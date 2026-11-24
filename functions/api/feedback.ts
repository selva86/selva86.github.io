// POST /api/feedback
//
// Site feedback capture. Anonymous-friendly: no auth required, but links to the
// signed-in user when a session exists. Stores the note in D1 (audit_log,
// action 'feedback') and sends a best-effort admin notice that never blocks the
// response. CSRF: state-changing POST, so we verify Origin against our own hosts.
//
// HARDENED 2026-11-23, after nine bot submissions in four bursts. The origin
// check here was already correct and was still defeated, which is the useful
// finding: a forged `Origin: https://r-statistics.co` passed it (verified
// against production, 400 bad_message on a deliberately short body), because
// an Origin header is one curl flag. Three things were added, in order of how
// much they actually cost an attacker: a honeypot field, recording of the IP
// and user agent so a repeat offender can be named at all, and a Turnstile
// token, which is the only one a script cannot simply assert. The shared
// origin helper now lives in _lib/form-guard.ts; this file held one of three
// copies that had drifted apart.

import type { Env, RequestData } from "../_middleware";
import { json, jsonError } from "../_lib/errors";
import { sendMail, emailShell, type SendMailResult } from "../_lib/email";
import { guardHeaders, guardChallenge, clientMeta } from "../_lib/form-guard";

const ADMIN_EMAIL = "selva86@gmail.com";
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;
/* "sales" is the one route that is not feedback at all: it is a lead, and it
   is marked differently in the owner's inbox so it does not sit in a pile of
   bug reports waiting to be triaged. */
const CATEGORIES = new Set(["general", "bug", "content", "idea", "sales"]);
const RATE_MAX = 8;          // submissions per IP per hour
const RATE_WINDOW = 3600;    // seconds

function esc(s: string): string {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export const onRequestPost: PagesFunction<Env, string, RequestData> = async (context) => {
  const { request, env } = context;

  const denied = guardHeaders(request, env);
  if (denied) return denied;

  // Light per-IP rate limit.
  const meta = clientMeta(request);
  const rlKey = `fb-rl:${meta.ip}:${Math.floor(Date.now() / 1000 / RATE_WINDOW)}`;
  try {
    const n = parseInt((await env.KV.get(rlKey)) || "0", 10);
    if (n >= RATE_MAX) return jsonError(429, "rate_limited", "Too many submissions. Try again later.");
    await env.KV.put(rlKey, String(n + 1), { expirationTtl: RATE_WINDOW });
  } catch { /* KV hiccup, so do not block genuine feedback */ }

  let body: { message?: string; email?: string; category?: string; page?: string; website?: string; cf_turnstile_response?: string };
  try { body = await request.json(); } catch { return jsonError(400, "bad_json", "Invalid request body."); }

  /* Honeypot, which /api/contact has had all along and this endpoint did not.
     Accepted silently so a bot learns nothing from the response. */
  if (typeof body.website === "string" && body.website.trim() !== "") {
    console.log(`[feedback] honeypot filled, dropped: ${meta.ip} ${meta.country || "?"}`);
    return json({ ok: true });
  }

  const message = String(body.message || "").trim().slice(0, 4000);
  if (message.length < 3) return jsonError(400, "bad_message", "Please add a little more detail.");

  const email = String(body.email || "").trim().toLowerCase().slice(0, 254);
  if (email && !EMAIL_RE.test(email)) return jsonError(400, "bad_email", "That email does not look right.");
  const category = body.category && CATEGORIES.has(String(body.category)) ? String(body.category) : "general";
  const page = String(body.page || "").slice(0, 300);
  const country = meta.country;
  const userId = context.data.user ? context.data.user.id : null;
  const now = Math.floor(Date.now() / 1000);

  /* Turnstile after validation, so a malformed payload never costs a
     siteverify subrequest. Inert until TURNSTILE_SECRET is set. */
  const guard = await guardChallenge(request, env, String(body.cf_turnstile_response || ""));
  if (guard.deny) return guard.deny;

  try {
    await env.DB
      .prepare("INSERT INTO audit_log (user_id, actor, action, ref, meta_json, at) VALUES (?, ?, 'feedback', ?, ?, ?)")
      .bind(
        userId,
        userId ? "user" : "system",
        email || category,
        /* ip/ua/ray/asn added 2026-11-23. Without them a burst of probes is
           indistinguishable from a burst of people, and there is nothing to
           hand Cloudflare for a block rule. */
        JSON.stringify({
          message, email: email || null, category, page, country,
          ip: meta.ip, ua: meta.ua, ray: meta.ray, asn: meta.asn,
          turnstile: guard.turnstile,
        }).slice(0, 3800),
        now,
      )
      .run();
  } catch (e) {
    console.error(`[feedback] insert failed: ${(e as Error).message}`);
    return jsonError(500, "db_error", "Could not save your feedback. Please try again.");
  }

  // Best-effort admin notice: never block or fail the response.
  context.waitUntil(notifyAdmin(env, { message, email, category, page, country }, userId).catch((e) =>
    console.warn(`[feedback] admin email failed: ${e}`)));

  return json({ ok: true });
};

async function notifyAdmin(
  env: Env,
  info: { message: string; email: string; category: string; page: string; country: string | null },
  userId: string | null,
): Promise<void> {
  if ((await env.KV.get("flag:feedback-admin-email")) === "off") return;   // default on
  const html = emailShell({
    preheader: `New feedback (${info.category}): ${info.message.slice(0, 80)}`,
    contentHtml:
      `<p style="margin:0 0 10px"><strong>New site feedback</strong></p>` +
      `<p style="margin:0 0 6px">Type: ${esc(info.category)}</p>` +
      `<p style="margin:0 0 6px">From: ${esc(info.email || (userId ? "(signed-in user)" : "(anonymous)"))}</p>` +
      `<p style="margin:0 0 6px">Page: ${esc(info.page || "?")} &middot; Country: ${esc(info.country || "?")}</p>` +
      `<p style="margin:14px 0 0;white-space:pre-wrap;border-left:3px solid #d4d9e3;padding-left:12px">${esc(info.message)}</p>`,
  });
  const res = await sendMail(env, {
    to: { email: ADMIN_EMAIL, name: "Selva" },
    subject: info.category === "sales"
      ? `SALES ENQUIRY: ${info.message.slice(0, 60)}`
      : `Feedback (${info.category}): ${info.message.slice(0, 60)}`,
    htmlBody: html,
    textBody: `New feedback [${info.category}] from ${info.email || "anonymous"} on ${info.page || "?"}:\n\n${info.message}`,
  });
  await recordSend(env, userId, info.email || info.category, res);
}

// Durable record of the admin-email outcome so a silent delivery failure stays
// queryable in D1 (mirrors the waitlist path). Never throws.
async function recordSend(env: Env, userId: string | null, ref: string, res: SendMailResult): Promise<void> {
  try {
    await env.DB.prepare(
      "INSERT INTO audit_log (user_id, actor, action, ref, meta_json, at) VALUES (?, 'system', ?, ?, ?, ?)",
    )
      .bind(
        userId,
        res.ok ? "feedback.admin.sent" : "feedback.admin.failed",
        ref,
        JSON.stringify({ status: res.status, error: res.error ?? null }).slice(0, 900),
        Math.floor(Date.now() / 1000),
      )
      .run();
  } catch { /* observability is non-fatal */ }
}
