// Edge JWT verification for Supabase Auth tokens (HS256).
// Supabase issues JWT with HS256 signed by SUPABASE_JWT_SECRET. We verify at the
// CF edge using Web Crypto (no Node deps). On success returns decoded payload.

export interface JWTPayload {
  sub: string;             // user UUID
  email?: string;
  role?: string;           // 'authenticated' | 'anon'
  aud?: string;
  exp: number;             // unix seconds
  iat: number;
  iss?: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

function b64urlDecode(input: string): Uint8Array {
  // base64url -> base64
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

    const header = b64urlDecodeJson<{ alg: string; typ: string }>(headerB64);
    if (header.alg !== "HS256") return null;

    const key = await getHmacKey(secret);
    const signed = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
    const sig = b64urlDecode(signatureB64);
    const valid = await crypto.subtle.verify("HMAC", key, sig, signed);
    if (!valid) return null;

    const payload = b64urlDecodeJson<JWTPayload>(payloadB64);
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) return null;
    return payload;
  } catch {
    return null;
  }
}

// Cookie name set by Supabase JS client by default. Adjust if you change the storage key.
export const ACCESS_TOKEN_COOKIE = "sb-access-token";

export function extractToken(request: Request): string | null {
  // 1. Authorization header
  const auth = request.headers.get("Authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  // 2. Cookie
  const cookie = request.headers.get("Cookie") || "";
  const m = cookie.match(new RegExp(`(?:^|;\\s*)${ACCESS_TOKEN_COOKIE}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : null;
}
