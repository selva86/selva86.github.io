// Runs on every request. Verifies JWT if present, attaches { user, payload } to
// data so endpoint handlers can read `context.data.user` without re-verifying.
// Does NOT enforce auth; that is per-endpoint. Unauthenticated requests pass
// through with user=null.

import { extractToken, verifyJWT, type JWTPayload } from "./_lib/auth";
import { getUserById, type User } from "./_lib/db";

export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  CERTS: R2Bucket;
  AVATARS: R2Bucket;
  EXPORTS: R2Bucket;
  COURSE_MEDIA: R2Bucket;
  SUPABASE_JWT_SECRET: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  PADDLE_API_KEY: string;
  PADDLE_WEBHOOK_SECRET: string;
  RAZORPAY_KEY_ID: string;
  RAZORPAY_KEY_SECRET: string;
  RAZORPAY_WEBHOOK_SECRET: string;
  ZOHO_AUTH_TOKEN: string;
  ZOHO_LIST_KEY: string;
  RESEND_API_KEY: string;
  SENTRY_DSN: string;
  ENVIRONMENT: string;
  SITE_ORIGIN: string;
}

export interface RequestData {
  user: User | null;
  payload: JWTPayload | null;
}

export const onRequest: PagesFunction<Env, string, RequestData> = async (context) => {
  context.data.user = null;
  context.data.payload = null;

  const token = extractToken(context.request);
  if (token) {
    const payload = await verifyJWT(token, context.env.SUPABASE_JWT_SECRET);
    if (payload?.sub) {
      context.data.payload = payload;
      context.data.user = await getUserById(context.env.DB, payload.sub);
    }
  }

  return context.next();
};
