// Edge JWT verification for Supabase Auth tokens.
//
// Supabase's 2025+ default is ECC P-256 / ES256 (asymmetric). We verify at the
// CF edge by fetching the JWKS once and caching the public key(s) in KV, then
// verifying every JWT with the matching key (by `kid`).
//
// Falls back to legacy HS256 only if SUPABASE_JWT_SECRET is set AND the token
// header advertises HS256. New Supabase projects don't need the secret at all.

const CLOCK_SKEW_SEC   = 30;             // grace for clock drift
const EXPECTED_AUD     = "authenticated"; // reject anon tokens
const JWKS_CACHE_TTL_S = 24 * 60 * 60;   // 24h key cache
const JWKS_KV_KEY      = "jwks:supabase";

export interface JWTPayload {
  sub: string;
  email?: string;
  role?: string;
  aud?: string | string[];
  exp: number;
  iat: number;
  nbf?: number;
  iss?: string;
  session_id?: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

interface JwksKey extends JsonWebKey {
  kid?: string;
  alg?: string;
  use?: string;
}

interface JwksDoc {
  keys: JwksKey[];
}

// ===== Env interface (subset used here) =====
interface AuthEnv {
  KV: KVNamespace;
  SUPABASE_URL: string;
  SUPABASE_JWT_SECRET?: string; // optional; only used for legacy HS256
}

// ===== base64url helpers =====
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

// ===== JWKS fetch + KV cache =====
// Stale-while-revalidate: if fetch fails but cache exists, return stale.
// If cache is fresh, return immediately. KV gets a 7d hard TTL so a long
// outage doesn't permanently break auth.

async function getJwks(env: AuthEnv): Promise<JwksKey[]> {
  const cached = await env.KV.get<{ keys: JwksKey[]; fetched_at: number }>(
    JWKS_KV_KEY, "json"
  );
  const now = Math.floor(Date.now() / 1000);
  if (cached && now - cached.fetched_at < JWKS_CACHE_TTL_S) {
    return cached.keys;
  }

  // Standard JWKS path. The deprecated `/auth/v1/keys` requires apikey header.
  const url = `${env.SUPABASE_URL.replace(/\/$/, "")}/auth/v1/.well-known/jwks.json`;
  try {
    const resp = await fetch(url, {
      headers: { "Accept": "application/json" },
      cf: { cacheTtl: 3600, cacheEverything: true },
    } as RequestInit);
    if (!resp.ok) throw new Error(`status ${resp.status}`);
    const doc = (await resp.json()) as JwksDoc;
    if (!doc?.keys?.length) throw new Error("empty JWKS");
    await env.KV.put(
      JWKS_KV_KEY,
      JSON.stringify({ keys: doc.keys, fetched_at: now }),
      { expirationTtl: 7 * 24 * 60 * 60 },
    );
    return doc.keys;
  } catch (e) {
    if (cached) {
      console.warn(`[auth] JWKS fetch failed, serving stale: ${(e as Error).message}`);
      return cached.keys;
    }
    console.error(`[auth] JWKS fetch failed and no cache: ${(e as Error).message}`);
    throw e;
  }
}

// ===== ES256 verify =====
async function verifyES256(
  token: string,
  headerB64: string,
  payloadB64: string,
  signatureB64: string,
  kid: string | undefined,
  env: AuthEnv,
): Promise<JWTPayload | null> {
  const keys = await getJwks(env);
  // Prefer kid match; fall back to first ES256 key if kid not provided.
  const jwk = kid
    ? keys.find(k => k.kid === kid)
    : keys.find(k => (k.alg ?? "ES256") === "ES256");
  if (!jwk) {
    console.warn(`[auth] no matching JWKS key for kid=${kid ?? "(none)"}`);
    return null;
  }

  const publicKey = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["verify"],
  );
  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  // ES256 signature is raw r||s (64 bytes for P-256); Web Crypto expects this.
  const sig = b64urlDecode(signatureB64);
  const ok = await crypto.subtle.verify(
    { name: "ECDSA", hash: "SHA-256" },
    publicKey,
    sig,
    data,
  );
  return ok ? b64urlDecodeJson<JWTPayload>(payloadB64) : null;
}

// ===== Legacy HS256 fallback =====
let cachedHmac: { secret: string; key: CryptoKey } | null = null;

async function getHmacKey(secret: string): Promise<CryptoKey> {
  if (cachedHmac && cachedHmac.secret === secret) return cachedHmac.key;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  cachedHmac = { secret, key };
  return key;
}

async function verifyHS256(
  headerB64: string,
  payloadB64: string,
  signatureB64: string,
  secret: string,
): Promise<JWTPayload | null> {
  const key = await getHmacKey(secret);
  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const sig = b64urlDecode(signatureB64);
  const ok = await crypto.subtle.verify("HMAC", key, sig, data);
  return ok ? b64urlDecodeJson<JWTPayload>(payloadB64) : null;
}

// ===== Public verify =====
export async function verifyJWT(token: string, env: AuthEnv): Promise<JWTPayload | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, signatureB64] = parts;
    const header = b64urlDecodeJson<{ alg: string; kid?: string; typ?: string }>(headerB64);

    let payload: JWTPayload | null = null;

    if (header.alg === "ES256") {
      payload = await verifyES256(token, headerB64, payloadB64, signatureB64, header.kid, env);
    } else if (header.alg === "HS256") {
      if (!env.SUPABASE_JWT_SECRET) {
        console.warn("[auth] HS256 token received but SUPABASE_JWT_SECRET not configured");
        return null;
      }
      payload = await verifyHS256(headerB64, payloadB64, signatureB64, env.SUPABASE_JWT_SECRET);
    } else {
      console.warn(`[auth] unsupported JWT alg=${header.alg}; expected ES256 or HS256`);
      return null;
    }
    if (!payload) return null;

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp + CLOCK_SKEW_SEC < now) return null;
    if (payload.nbf && payload.nbf - CLOCK_SKEW_SEC > now) return null;

    const aud = Array.isArray(payload.aud) ? payload.aud : payload.aud ? [payload.aud] : [];
    if (aud.length && !aud.includes(EXPECTED_AUD)) return null;

    if (!payload.sub) return null;
    return payload;
  } catch (e) {
    console.error(`[auth] verifyJWT error: ${(e as Error).message}`);
    return null;
  }
}

// ===== Token extraction (unchanged from prior version) =====
export function extractToken(request: Request): string | null {
  const auth = request.headers.get("Authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7).trim() || null;

  const cookieHeader = request.headers.get("Cookie") || "";
  if (!cookieHeader) return null;

  for (const part of cookieHeader.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    const name = part.slice(0, eq).trim();
    // rsc-at: lightweight raw-JWT mirror set by auth-hydrate.js so PAGE
    // requests (no Authorization header possible) are identifiable at the
    // edge for Pro lesson serving.
    if (name === "rsc-at") {
      const raw = part.slice(eq + 1).trim();
      if (raw.split(".").length === 3) return raw;
      continue;
    }
    if (!name.startsWith("sb-") || !name.endsWith("-auth-token")) continue;
    const raw = decodeURIComponent(part.slice(eq + 1).trim());
    const token = parseSupabaseAuthCookie(raw);
    if (token) return token;
  }
  return null;
}

function parseSupabaseAuthCookie(raw: string): string | null {
  try {
    const payload = raw.startsWith("base64-") ? raw.slice(7) : raw;
    if (payload.split(".").length === 3) return payload;
    const json = JSON.parse(new TextDecoder().decode(b64urlDecode(payload)));
    if (Array.isArray(json) && typeof json[0] === "string") return json[0];
    if (json && typeof json.access_token === "string") return json.access_token;
    return null;
  } catch {
    return null;
  }
}
