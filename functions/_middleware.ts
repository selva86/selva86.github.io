// Runs on every request. Verifies JWT if present, attaches { user, payload } to
// data so endpoint handlers can read `context.data.user` without re-verifying.
// Does NOT enforce auth; that is per-endpoint. Unauthenticated requests pass
// through with user=null.
//
// Also (Phase 1.4):
// - Rejects (treats as anon) if the session_id is in KV revoked list.
// - Upserts a row in `sessions` table on first sight of a session_id; bumps
//   last_seen_at on subsequent requests with 60s throttle (KV-backed) so we
//   don't write to D1 on every single page load.

import { extractToken, verifyJWT, type JWTPayload } from "./_lib/auth";
import { getUserById, isSessionRevoked, upsertSession, type User } from "./_lib/db";
import { parseDeviceLabel } from "./_lib/devices";

export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  CERTS: R2Bucket;
  AVATARS: R2Bucket;
  EXPORTS: R2Bucket;
  COURSE_MEDIA: R2Bucket;
  SUPABASE_JWT_SECRET?: string;   // optional; only needed for legacy HS256 tokens
  SUPABASE_URL: string;           // used to fetch JWKS for ES256 verification
  SUPABASE_WEBHOOK_SECRET: string; // shared secret for /api/webhooks/supabase
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  PADDLE_API_KEY: string;
  PADDLE_WEBHOOK_SECRET: string;
  RAZORPAY_KEY_ID: string;
  RAZORPAY_KEY_SECRET: string;
  RAZORPAY_WEBHOOK_SECRET: string;
  ZOHO_AUTH_TOKEN: string;
  ZOHO_LIST_KEY: string;
  ZOHO_CAMPAIGNS_API_DOMAIN: string;     // e.g. https://www.zohoapis.in
  ZOHO_ZEPTOMAIL_TOKEN: string;
  ZOHO_ZEPTOMAIL_SENDER: string;
  SENTRY_DSN: string;
  ENVIRONMENT: string;
  SITE_ORIGIN: string;
}

export interface RequestData {
  user: User | null;
  payload: JWTPayload | null;
  session_id: string | null;
}

const TOUCH_THROTTLE_SEC = 60; // skip session upsert if we touched it < 60s ago

export const onRequest: PagesFunction<Env, string, RequestData> = async (context) => {
  context.data.user = null;
  context.data.payload = null;
  context.data.session_id = null;

  const token = extractToken(context.request);
  if (!token) return context.next();

  const payload = await verifyJWT(token, context.env);
  if (!payload?.sub) return context.next();

  // Derive session_id. Newer Supabase JWTs include it as a claim; older
  // configs don't, so fall back to a deterministic synthetic id so the
  // sessions UI still has one row per JWT.
  const sessionId = (payload.session_id as string | undefined)
    || `synth:${payload.sub}:${payload.iat ?? 0}`;

  // Hard revocation check: if this session is in the KV revoke list, treat
  // as anon. The Supabase JWT itself stays valid until its natural expiry
  // (~1h) but our app refuses it.
  if (await isSessionRevoked(context.env.KV, sessionId)) {
    return context.next();
  }

  context.data.payload = payload;
  context.data.session_id = sessionId;
  context.data.user = await getUserById(context.env.DB, payload.sub);

  // Throttled session upsert: avoid 1 D1 write per page load by skipping if
  // we touched this session within the last 60s. KV is the throttle store
  // (cheap reads, eventual consistency is fine).
  try {
    const touchKey = `session-touched:${sessionId}`;
    const touched = await context.env.KV.get(touchKey);
    if (!touched) {
      const ua = context.request.headers.get("user-agent") || "";
      await upsertSession(context.env.DB, {
        session_id: sessionId,
        user_id: payload.sub,
        device: parseDeviceLabel(ua),
        user_agent: ua,
        expires_at: payload.exp ?? Math.floor(Date.now() / 1000) + 3600,
      });
      await context.env.KV.put(touchKey, "1", { expirationTtl: TOUCH_THROTTLE_SEC });
    }
  } catch (e) {
    // Don't block the request if session bookkeeping fails.
    console.error("[middleware] session upsert failed:", (e as Error).message);
  }

  return context.next();
};
