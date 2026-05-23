// Edge JWT verification for Supabase Auth tokens.
//
// Supports HS256 (symmetric, secret-based) only for v1. If your Supabase project
// uses ECC P256 / ES256 (the 2025+ default for new projects), open Supabase
// dashboard -> Project Settings -> API -> JWT Settings and switch the signing
// algorithm to HS256. Document choice in BUILD-PHASE-0.md step 4.
//
// Why HS256: simpler (single shared secret), no JWKS fetch, fewer round trips.
// ES256 support can be added when needed; requires KV-caching the JWKS.

const CLOCK_SKEW_SEC = 30;          // grace for clock drift between Supabase and CF edge
const EXPECTED_AUD   = "authenticated"; // reject anon tokens

export interface JWTPayload {
  sub: string;             // user UUID
  email?: string;
  role?: string;           // 'authenticated' | 'anon'
  aud?: string | string[];
  exp: number;             // unix seconds
  iat: number;
  nbf?: number;
  iss?: string;
  session_id?: string;     // Supabase Auth v2 (rotated per session)
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

function b64urlDecode(input: string): Uint8Array {
  const pad = input.length % 4 === 2 ? "==" : input.length % 4 === 3 ? "=" : "";
  const b64 = (input + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function b64urlDecodeJson<T = unknown>(input: string): T {
  return JSON.parse(new TextDecoder().decode(b64urlDecode(input))) as T;
}

let cachedKey: { secret: string; key: CryptoKey } | null = null;

async function getHmacKey(secret: string): Promise<CryptoKey> {
  if (cachedKey && cachedKey.secret === secret) return cachedKey.key;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  cachedKey = { secret, key };
  return key;
}

export async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, signatureB64] = parts;

    const header = b64urlDecodeJson<{ alg: string; typ?: string; kid?: string }>(headerB64);
    if (header.alg !== "HS256") {
      // Surface this clearly in Workers logs so misconfigured Supabase projects
      // don't fail silently. The Pages tail (`npm run tail`) catches console.warn.
      console.warn(`[auth] unsupported JWT alg=${header.alg}; expected HS256. Configure Supabase to HS256.`);
      return null;
    }

    const key = await getHmacKey(secret);
    const signed = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
    const sig = b64urlDecode(signatureB64);
    const valid = await crypto.subtle.verify("HMAC", key, sig, signed);
    if (!valid) return null;

    const payload = b64urlDecodeJson<JWTPayload>(payloadB64);
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp + CLOCK_SKEW_SEC < now) return null;
    if (payload.nbf && payload.nbf - CLOCK_SKEW_SEC > now) return null;

    // Audience: Supabase issues 'authenticated' for signed-in users, 'anon' for
    // pre-auth. We treat anon as no-user so endpoints requiring auth 401 cleanly.
    const aud = Array.isArray(payload.aud) ? payload.aud : payload.aud ? [payload.aud] : [];
    if (aud.length && !aud.includes(EXPECTED_AUD)) return null;

    if (!payload.sub) return null; // sub is required to look up the user

    return payload;
  } catch {
    return null;
  }
}

// ===== Token extraction =====
//
// Two transports supported (checked in order):
//
// 1. Authorization: Bearer <jwt>  — preferred for v1 (simpler, no cookie parsing).
//    Frontend code should set this header on every fetch:
//      const { data } = await supabase.auth.getSession();
//      fetch('/api/me', { headers: { Authorization: `Bearer ${data.session.access_token}` } });
//
// 2. Cookie: sb-<projectref>-auth-token=<base64-encoded JSON array>
//    Supabase JS client writes this when `persistSession: true` (default).
//    Value is base64-encoded JSON: [access_token, refresh_token, provider_token, provider_refresh_token, user].
//    We base64-decode, parse, and pull index [0].

export function extractToken(request: Request): string | null {
  // 1. Authorization header (preferred)
  const auth = request.headers.get("Authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7).trim() || null;

  // 2. Supabase-style cookie: sb-<projectref>-auth-token
  const cookieHeader = request.headers.get("Cookie") || "";
  if (!cookieHeader) return null;

  for (const part of cookieHeader.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    const name = part.slice(0, eq).trim();
    if (!name.startsWith("sb-") || !name.endsWith("-auth-token")) continue;
    const raw = decodeURIComponent(part.slice(eq + 1).trim());
    const token = parseSupabaseAuthCookie(raw);
    if (token) return token;
  }
  return null;
}

function parseSupabaseAuthCookie(raw: string): string | null {
  try {
    // Supabase prefixes with 'base64-' marker in some versions.
    const payload = raw.startsWith("base64-") ? raw.slice(7) : raw;
    // Could be raw JWT (legacy) or base64-JSON-array (v2 default).
    if (payload.split(".").length === 3) return payload; // looks like a bare JWT
    const json = JSON.parse(new TextDecoder().decode(b64urlDecode(payload)));
    if (Array.isArray(json) && typeof json[0] === "string") return json[0];
    if (json && typeof json.access_token === "string") return json.access_token;
    return null;
  } catch {
    return null;
  }
}
