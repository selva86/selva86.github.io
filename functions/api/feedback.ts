// POST /api/feedback
//
// Site feedback capture. Anonymous-friendly: no auth required, but links to the
// signed-in user when a session exists. Stores the note in D1 (audit_log,
// action 'feedback') and sends a best-effort admin notice that never blocks the
// response. CSRF: state-changing POST, so we verify Origin against our own hosts.

import type { Env, RequestData } from "../_middleware";
import { json, jsonError } from "../_lib/errors";
import { sendMail, emailShell, type SendMailResult } from "../_lib/email";

const ADMIN_EMAIL = "selva86@gmail.com";
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;
const CATEGORIES = new Set(["general", "bug", "content", "idea"]);
const RATE_MAX = 8;          // submissions per IP per hour
const RATE_WINDOW = 3600;    // seconds

function esc(s: string): string {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function originAllowed(origin: string | null, env: Env): boolean {
  if (!origin) return false;
  let host: string;
  try { host = new URL(origin).host.toLowerCase(); } catch { return false; }
  if (host === "r-statistics.co" || host === "www.r-statistics.co") return true;
  if (host.endsWith(".r-statistics-co.pages.dev")) return true;       // branch/preview deploys
  try { if (env.SITE_ORIGIN && host === new URL(env.SITE_ORIGIN).host.toLowerCase()) return true; } catch { /* ignore */ }
  return false;
}

export const onRequestPost: PagesFunction<Env, string, RequestData> = async (context) => {
  const { request, env } = context;

  if (!originAllowed(request.headers.get("Origin"), env)) {
    return jsonError(403, "bad_origin", "Cross-origin requests are not allowed.");
  }

  // Light per-IP rate limit.
  const ip = request.headers.get("CF-Connecting-IP") || "0.0.0.0";
  const rlKey = `fb-rl:${ip}:${Math.floor(Date.now() / 1000 / RATE_WINDOW)}`;
  try {
    const n = parseInt((await env.KV.get(rlKey)) || "0", 10);
    if (n >= RATE_MAX) return jsonError(429, "rate_limited", "Too many submissions. Try again later.");
    await env.KV.put(rlKey, String(n + 1), { expirationTtl: RATE_WINDOW });
  } catch { /* KV hiccup — don't block genuine feedback */ }

  let body: { message?: string; email?: string; category?: string; page?: string };
  try { body = await request.json(); } catch { return jsonError(400, "bad_json", "Invalid request body."); }

  const message = String(body.message || "").trim().slice(0, 4000);
  if (message.length < 3) return jsonError(400, "bad_message", "Please add a little more detail.");

  const email = String(body.email || "").trim().toLowerCase().slice(0, 254);
  if (email && !EMAIL_RE.test(email)) return jsonError(400, "bad_email", "That email does not look right.");
  const category = body.category && CATEGORIES.has(String(body.category)) ? String(body.category) : "general";
  const page = String(body.page || "").slice(0, 300);
  const country = request.headers.get("CF-IPCountry") || null;
  const userId = context.data.user ? context.data.user.id : null;
  const now = Math.floor(Date.now() / 1000);

  try {
    await env.DB
      .prepare("INSERT INTO audit_log (user_id, actor, action, ref, meta_json, at) VALUES (?, ?, 'feedback', ?, ?, ?)")
      .bind(
        userId,
        userId ? "user" : "system",
        email || category,
        JSON.stringify({ message, email: email || null, category, page, country }).slice(0, 3800),
        now,
      )
      .run();
  } catch (e) {
    console.error(`[feedback] insert failed: ${(e as Error).message}`);
    return jsonError(500, "db_error", "Could not save your feedback. Please try again.");
  }

  // Best-effort admin notice — never block or fail the response.
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
    subject: `Feedback (${info.category}): ${info.message.slice(0, 60)}`,
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
