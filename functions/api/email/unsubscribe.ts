// One-click unsubscribe. GET renders a tiny confirmation page; POST is the
// RFC 8058 List-Unsubscribe-Post path (mail clients call it directly).
// Both turn off every non-account category (progress, nurture, offers).
// Account/billing email is the service and cannot be unsubscribed here.
//
// Link shape: /api/email/unsubscribe?u=<user_id>&t=<hmac-sha256(user_id)>
// signed with EMAIL_UNSUB_SECRET, so a link only works for its own account.

import type { Env, RequestData } from "../../_middleware";

async function hmacHex(secret: string, msg: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let x = 0;
  for (let i = 0; i < a.length; i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return x === 0;
}

async function applyUnsub(
  env: Env & { EMAIL_UNSUB_SECRET?: string }, url: URL,
): Promise<{ ok: boolean; status: number; message: string }> {
  const u = url.searchParams.get("u") || "";
  const t = url.searchParams.get("t") || "";
  if (!env.EMAIL_UNSUB_SECRET || !u || !t) {
    return { ok: false, status: 400, message: "This unsubscribe link is incomplete." };
  }
  const want = await hmacHex(env.EMAIL_UNSUB_SECRET, u);
  if (!timingSafeEq(t.toLowerCase(), want)) {
    return { ok: false, status: 403, message: "This unsubscribe link is not valid." };
  }
  await env.DB.prepare(
    "UPDATE users SET email_progress = 0, email_nurture = 0, email_offers = 0 WHERE id = ?1",
  ).bind(u).run();
  await env.DB.prepare(
    "INSERT INTO email_events (user_id, email, email_key, event, at, meta) VALUES (?1, NULL, NULL, 'unsubscribe', ?2, 'one-click')",
  ).bind(u, Math.floor(Date.now() / 1000)).run();
  return { ok: true, status: 200, message: "Done. You will only get account and billing email from now on." };
}

function page(message: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>Email preferences &middot; r-statistics.co</title></head>
<body style="margin:0;padding:48px 16px;background:#f4f6f9;font-family:'Helvetica Neue',Arial,sans-serif;color:#0a0d14">
<div style="max-width:480px;margin:0 auto;background:#fff;border:1px solid #e4e7ee;border-radius:12px;padding:32px">
<div style="font-family:'Courier New',monospace;font-weight:600;margin-bottom:16px">r-statistics.co</div>
<p style="font-size:15px;line-height:1.6;margin:0 0 16px">${message}</p>
<p style="font-size:13px;color:#6b7280;margin:0">Fine-grained choices live in
<a href="/account.html#emails" style="color:#2056d2">your account's email preferences</a>.</p>
</div></body></html>`;
}

export const onRequestGet: PagesFunction<Env & { EMAIL_UNSUB_SECRET?: string }, string, RequestData> = async (context) => {
  const r = await applyUnsub(context.env, new URL(context.request.url));
  return new Response(page(r.message), {
    status: r.status,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-store" },
  });
};

export const onRequestPost: PagesFunction<Env & { EMAIL_UNSUB_SECRET?: string }, string, RequestData> = async (context) => {
  const r = await applyUnsub(context.env, new URL(context.request.url));
  return new Response(r.ok ? "ok" : r.message, { status: r.status, headers: { "Cache-Control": "private, no-store" } });
};
