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

// ---- Webhook source-IP allowlist (defense-in-depth on top of signatures) ----
//
// Paddle publishes its delivery IPs at <api-base>/ips (data.ipv4_cidrs,
// currently /32 entries). The endpoint is the source of truth - never
// hard-code the list. Cached in KV for 24h. Fail-open when the list can't be
// fetched: signature verification remains the primary control, and a webhook
// outage would be worse than the marginal exposure.

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    const v = Number(p);
    if (!Number.isInteger(v) || v < 0 || v > 255) return null;
    n = (n << 8) | v;
  }
  return n >>> 0;
}

function cidrContains(cidr: string, ip: string): boolean {
  const [net, lenStr] = cidr.split("/");
  const len = lenStr === undefined ? 32 : Number(lenStr);
  const netInt = ipv4ToInt(net);
  const ipInt = ipv4ToInt(ip);
  if (netInt === null || ipInt === null || !Number.isInteger(len) || len < 0 || len > 32) return false;
  const mask = len === 0 ? 0 : (~0 << (32 - len)) >>> 0;
  return (netInt & mask) === (ipInt & mask);
}

export async function isPaddleSourceIp(
  env: { KV: KVNamespace },
  requestIp: string | null,
): Promise<{ allowed: boolean; reason: string }> {
  if (!requestIp) return { allowed: true, reason: "no_ip_header" };
  // Sandbox and live publish DIFFERENT delivery IPs. Allow the union of both
  // Paddle-owned lists: correct in either environment and immune to the
  // account's env config drifting from the notification destination's env
  // (deriving one list from PADDLE_API_KEY 403'd real sandbox deliveries
  // when the key was unset on prod).
  const bases = ["https://api.paddle.com", "https://sandbox-api.paddle.com"];
  const cacheKey = "paddle:ips:union";
  let cidrs: string[] | null = null;
  const cached = await env.KV.get(cacheKey).catch(() => null);
  if (cached) {
    try { cidrs = JSON.parse(cached) as string[]; } catch { cidrs = null; }
  }
  if (!cidrs) {
    const collected: string[] = [];
    for (const base of bases) {
      try {
        const resp = await fetch(`${base}/ips`);
        if (resp.ok) {
          const data = (await resp.json()) as { data?: { ipv4_cidrs?: string[] } };
          for (const c of data?.data?.ipv4_cidrs ?? []) collected.push(c);
        }
      } catch (e) {
        console.warn(`[paddle] ip list fetch failed for ${base}: ${(e as Error).message}`);
      }
    }
    if (collected.length) {
      cidrs = collected;
      await env.KV.put(cacheKey, JSON.stringify(cidrs), { expirationTtl: 86400 }).catch(() => {});
    }
  }
  if (!cidrs || !cidrs.length) return { allowed: true, reason: "ip_list_unavailable" };
  const allowed = cidrs.some((c) => cidrContains(c, requestIp));
  return { allowed, reason: allowed ? "matched" : "ip_not_allowlisted" };
}

// Update (or preview an update to) the seat quantity on a teams subscription.
// Paddle requires the COMPLETE items list; teams subscriptions carry exactly one
// item (the per-seat price), so a single-element list is the complete list.
// preview=true hits /subscriptions/{id}/preview (read-only, returns proration
// amounts in update_summary / immediate_transaction); preview=false applies the
// change with prorated_immediately + prevent_change on payment failure.
export interface SeatUpdateResult {
  ok: boolean;
  status?: number;
  data?: Record<string, unknown> | null;
  error?: string;
}

export async function updateSubscriptionSeats(
  env: { PADDLE_API_KEY: string },
  subscriptionId: string,
  priceId: string,
  quantity: number,
  preview: boolean,
): Promise<SeatUpdateResult> {
  if (!env.PADDLE_API_KEY) return { ok: false, error: "paddle_not_configured" };
  const url = `${paddleApiBase(env.PADDLE_API_KEY)}/subscriptions/${subscriptionId}${preview ? "/preview" : ""}`;
  try {
    const resp = await fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${env.PADDLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [{ price_id: priceId, quantity }],
        proration_billing_mode: "prorated_immediately",
        on_payment_failure: "prevent_change",
      }),
    });
    const body = (await resp.json().catch(() => null)) as { data?: Record<string, unknown> } | null;
    if (!resp.ok) {
      console.error(`[paddle] seat update ${resp.status}: ${JSON.stringify(body).slice(0, 300)}`);
      return { ok: false, status: resp.status, error: "paddle_error" };
    }
    return { ok: true, status: resp.status, data: body?.data ?? null };
  } catch (e) {
    console.error(`[paddle] seat update error: ${(e as Error).message}`);
    return { ok: false, error: "network_error" };
  }
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
