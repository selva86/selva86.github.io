// Server-signed identity cookie for PAGE requests.
//
// Browsers cannot attach an Authorization header to a normal page load, so the
// edge used to read a client-set mirror of the 1-hour Supabase JWT (`rsc-at`).
// That mirror expired hourly, which meant a paying member could be served the
// stripped lesson page and see the Pro wall flash before the client reloaded.
//
// This replaces it with `rsc-id`: an httpOnly, HMAC-signed cookie carrying
// only the user id and an expiry. /api/me sets it on every authenticated call
// (sliding 30-day life), sign-out clears it, and the middleware verifies the
// signature before trusting the id. Entitlement is still resolved server-side
// on every request; the cookie only says WHO is asking, never what they own.
//
// Format: v1.<sub>.<exp>.<sig>   sig = base64url(HMAC-SHA256(secret, "v1.<sub>.<exp>"))

export const ID_COOKIE = "rsc-id";
export const ID_COOKIE_TTL_SEC = 30 * 24 * 3600;

const enc = new TextEncoder();

function b64url(bytes: ArrayBuffer): string {
  let s = "";
  const u = new Uint8Array(bytes);
  for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(secret: string, msg: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(await crypto.subtle.sign("HMAC", key, enc.encode(msg)));
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function signIdCookie(secret: string, sub: string, ttlSec = ID_COOKIE_TTL_SEC): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + ttlSec;
  const body = `v1.${sub}.${exp}`;
  return `${body}.${await hmac(secret, body)}`;
}

// Returns the user id when the cookie is well-formed, unexpired, and signed
// with our secret; null otherwise. Never throws.
export async function verifyIdCookie(secret: string, value: string | null | undefined): Promise<string | null> {
  try {
    if (!secret || !value) return null;
    const parts = value.split(".");
    if (parts.length !== 4 || parts[0] !== "v1") return null;
    const [, sub, expStr, sig] = parts;
    const exp = parseInt(expStr, 10);
    if (!sub || !Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return null;
    const expected = await hmac(secret, `v1.${sub}.${exp}`);
    return timingSafeEqual(expected, sig) ? sub : null;
  } catch {
    return null;
  }
}

export function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("Cookie") || "";
  if (!header) return null;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    if (part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim() || null;
  }
  return null;
}

export function idCookieSetHeader(value: string, ttlSec = ID_COOKIE_TTL_SEC): string {
  return `${ID_COOKIE}=${value}; Path=/; Max-Age=${ttlSec}; HttpOnly; Secure; SameSite=Lax`;
}

export function idCookieClearHeader(): string {
  return `${ID_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}
