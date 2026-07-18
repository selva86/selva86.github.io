// Paddle helpers: webhook signature verification (edge Web Crypto) + a thin
// API client for the customer billing portal.
//
// Signature scheme (developer.paddle.com/webhooks/signature-verification):
//   header  Paddle-Signature: ts=<unix>;h1=<hex>
//   signed  "<ts>:<raw_request_body>"   (raw bytes, no re-serialization)
//   h1      HMAC-SHA256(secret, signed) as lowercase hex
//   secret  the notification destination secret (pdl_ntfset_...), used raw
// Paddle's SDKs enforce a 5s timestamp tolerance. We use a wider window and lean
// on webhook_events idempotency as the real replay guard, so a delivery/clock
// skew or a legitimate retry (re-signed with a fresh ts) is never falsely dropped.

export async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  const bytes = new Uint8Array(sig);
  let hex = "";
  for (const b of bytes) hex += b.toString(16).padStart(2, "0");
  return hex;
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function parsePaddleSignature(header: string | null): { ts: string; h1: string } | null {
  if (!header) return null;
  let ts = "";
  let h1 = "";
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    const k = part.slice(0, eq).trim();
    const v = part.slice(eq + 1).trim();
    if (k === "ts") ts = v;
    else if (k === "h1") h1 = v;
  }
  if (!ts || !h1) return null;
  return { ts, h1 };
}

export interface VerifyResult {
  ok: boolean;
  reason?: string;
}

// Verify against the RAW body string exactly as received.
export async function verifyPaddleSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
  toleranceSec = 300,
  nowSec = Math.floor(Date.now() / 1000),
): Promise<VerifyResult> {
  if (!secret) return { ok: false, reason: "no_secret_configured" };
  const parsed = parsePaddleSignature(signatureHeader);
  if (!parsed) return { ok: false, reason: "malformed_signature_header" };

  const tsNum = parseInt(parsed.ts, 10);
  if (!Number.isFinite(tsNum)) return { ok: false, reason: "bad_timestamp" };
  if (Math.abs(nowSec - tsNum) > toleranceSec) return { ok: false, reason: "timestamp_out_of_tolerance" };

  const expected = await hmacSha256Hex(secret, `${parsed.ts}:${rawBody}`);
  if (!timingSafeEqualHex(expected, parsed.h1.toLowerCase())) {
    return { ok: false, reason: "signature_mismatch" };
  }
  return { ok: true };
}

// ---------- Paddle API (billing portal) ----------

// Sandbox keys are prefixed pdl_sdbx_; live keys pdl_live_. Pick the base URL
// from the key so the same code works in both without another env var.
export function paddleApiBase(apiKey: string): string {
  return apiKey.startsWith("pdl_sdbx_") ? "https://sandbox-api.paddle.com" : "https://api.paddle.com";
}

// Create a customer portal session so the billing owner can manage their card,
// invoices, and subscription. Returns the general portal URL (Paddle also
// returns per-subscription deep links). null on failure (caller degrades to a
// support message). Docs: POST /customers/{id}/portal-sessions.
export async function createPortalSession(
  env: { PADDLE_API_KEY: string },
  customerId: string,
  subscriptionIds: string[] = [],
): Promise<string | null> {
  if (!env.PADDLE_API_KEY || !customerId) return null;
  try {
    const resp = await fetch(`${paddleApiBase(env.PADDLE_API_KEY)}/customers/${customerId}/portal-sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.PADDLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(subscriptionIds.length ? { subscription_ids: subscriptionIds } : {}),
    });
    if (!resp.ok) {
      console.error(`[paddle] portal-session ${resp.status}: ${(await resp.text()).slice(0, 300)}`);
      return null;
    }
    const data = (await resp.json()) as {
      data?: { urls?: { general?: { overview?: string } } };
    };
    return data?.data?.urls?.general?.overview ?? null;
  } catch (e) {
    console.error(`[paddle] portal-session error: ${(e as Error).message}`);
    return null;
  }
}
