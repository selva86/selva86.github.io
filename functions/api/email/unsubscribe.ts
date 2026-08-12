// Unsubscribe, done politely and safely.
//
// GET shows a CONFIRMATION page - it never changes anything. This matters
// twice over: an accidental click is reversible by just closing the tab, and
// mail scanners that prefetch GET links can no longer silently unsubscribe
// people who never clicked. The page's button POSTs back here to apply.
//
// POST applies the unsubscribe. It is also the RFC 8058 one-click path
// (List-Unsubscribe-Post): mail clients call POST directly, which is
// explicitly user-initiated, so applying immediately is correct there.
//
// Unsubscribing turns off every non-account category (progress, nurture,
// offers). Account/billing email is the service and cannot be turned off.
//
// Link shape: /api/email/unsubscribe?u=<user_id>&t=<hmac>&k=<email_key>
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

async function validLink(
  env: { EMAIL_UNSUB_SECRET?: string }, url: URL,
): Promise<{ ok: boolean; u: string }> {
  const u = url.searchParams.get("u") || "";
  const t = url.searchParams.get("t") || "";
  if (!env.EMAIL_UNSUB_SECRET || !u || !t) return { ok: false, u };
  const want = await hmacHex(env.EMAIL_UNSUB_SECRET, u);
  return { ok: timingSafeEq(t.toLowerCase(), want), u };
}

function page(inner: string): Response {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>Email preferences &middot; r-statistics.co</title></head>
<body style="margin:0;padding:48px 16px;background:#f4f6f9;font-family:'Helvetica Neue',Arial,sans-serif;color:#0a0d14">
<div style="max-width:480px;margin:0 auto;background:#fff;border:1px solid #e4e7ee;border-radius:12px;padding:32px">
<div style="font-family:'Courier New',monospace;font-weight:600;margin-bottom:16px">r-statistics.co</div>
${inner}
</div></body></html>`;
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-store" },
  });
}

const FINE_PRINT = `<p style="font-size:13px;color:#6b7280;margin:16px 0 0">Fine-grained choices live in
<a href="/account.html#emails" style="color:#2056d2">your account's email preferences</a>.</p>`;

export const onRequestGet: PagesFunction<Env & { EMAIL_UNSUB_SECRET?: string }, string, RequestData> = async (context) => {
  const url = new URL(context.request.url);
  const v = await validLink(context.env, url);
  if (!v.ok) {
    return page(`<p style="font-size:15px;line-height:1.6;margin:0">This unsubscribe link is not valid or has expired.</p>${FINE_PRINT}`);
  }
  // Confirmation only - nothing changes on GET. The form re-posts the same
  // signed query string.
  const action = "/api/email/unsubscribe?" + url.searchParams.toString();
  return page(
    `<p style="font-size:15px;line-height:1.6;margin:0 0 8px"><b>Unsubscribe from non-essential email?</b></p>
<p style="font-size:14px;line-height:1.6;color:#374151;margin:0 0 20px">You would stop getting progress notes, practice reminders, and offers.
Account and billing email still arrives - that part is the service.</p>
<form method="post" action="${action}" style="margin:0 0 12px">
<button type="submit" style="background:#b42318;color:#fff;border:0;border-radius:8px;padding:10px 18px;font-size:14px;font-weight:600;cursor:pointer">Yes, unsubscribe me</button>
</form>
<p style="font-size:13px;color:#6b7280;margin:0">Clicked by accident? Just close this page - nothing has changed.</p>${FINE_PRINT}`,
  );
};

export const onRequestPost: PagesFunction<Env & { EMAIL_UNSUB_SECRET?: string }, string, RequestData> = async (context) => {
  const url = new URL(context.request.url);
  const v = await validLink(context.env, url);
  if (!v.ok) {
    return page(`<p style="font-size:15px;line-height:1.6;margin:0">This unsubscribe link is not valid or has expired.</p>${FINE_PRINT}`);
  }
  await context.env.DB.prepare(
    "UPDATE users SET email_progress = 0, email_nurture = 0, email_offers = 0 WHERE id = ?1",
  ).bind(v.u).run();
  const k = (url.searchParams.get("k") || "").slice(0, 60) || null;
  await context.env.DB.prepare(
    "INSERT INTO email_events (user_id, email, email_key, event, at, meta) VALUES (?1, NULL, ?2, 'unsubscribe', ?3, 'confirmed')",
  ).bind(v.u, k, Math.floor(Date.now() / 1000)).run();
  return page(
    `<p style="font-size:15px;line-height:1.6;margin:0"><b>Done.</b> You will only get account and billing email from now on.</p>
<p style="font-size:13px;color:#6b7280;margin:12px 0 0">Changed your mind? You can turn categories back on anytime from your account's email preferences.</p>${FINE_PRINT}`,
  );
};
