// POST /api/waitlist
//
// Pro founding-member waitlist capture (pre-Lemon-Squeezy). Anonymous-friendly:
// no auth required, but links to the signed-in user when a session exists.
// Stores email + plan interest in D1 (waitlist table), sends a confirmation
// email to the subscriber and an admin notice — both best-effort, never block
// the response. Idempotent on email (re-submitting returns {already:true}).
//
// CSRF: this is a state-changing POST with no Authorization header for anon
// users, so we verify the Origin header against our own hosts before writing.

import type { Env, RequestData } from "../_middleware";
import { json, jsonError } from "../_lib/errors";
import { sendMail, emailShell, type SendMailResult } from "../_lib/email";

const ADMIN_EMAIL = "selva86@gmail.com";
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;
const PLANS = new Set(["monthly", "annual", "lifetime", "single", "allaccess"]);
const RATE_MAX = 6;          // submissions per IP per hour
const RATE_WINDOW = 3600;    // seconds

function esc(s: string): string {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Accept submissions only from our own origins (prod apex/www + CF previews).
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

  // Light per-IP rate limit (KV sliding-ish window).
  const ip = request.headers.get("CF-Connecting-IP") || "0.0.0.0";
  const rlKey = `wl-rl:${ip}:${Math.floor(Date.now() / 1000 / RATE_WINDOW)}`;
  try {
    const n = parseInt((await env.KV.get(rlKey)) || "0", 10);
    if (n >= RATE_MAX) return jsonError(429, "rate_limited", "Too many requests. Try again later.");
    await env.KV.put(rlKey, String(n + 1), { expirationTtl: RATE_WINDOW });
  } catch { /* KV hiccup — don't block a genuine signup */ }

  let body: { email?: string; plan?: string; source?: string };
  try { body = await request.json(); } catch { return jsonError(400, "bad_json", "Invalid request body."); }

  const email = String(body.email || "").trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return jsonError(400, "bad_email", "Please enter a valid email address.");
  }
  const plan = body.plan && PLANS.has(String(body.plan)) ? String(body.plan) : null;
  const source = (String(body.source || "pricing").slice(0, 40)) || "pricing";
  const country = request.headers.get("CF-IPCountry") || null;
  const userId = context.data.user ? context.data.user.id : null;
  const now = Math.floor(Date.now() / 1000);

  let already = false;
  try {
    const res = await env.DB
      .prepare(
        `INSERT INTO waitlist (id, email, plan_interest, source, country, user_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(email) DO NOTHING`,
      )
      .bind(crypto.randomUUID(), email, plan, source, country, userId, now)
      .run();
    already = !(res.meta && res.meta.changes && res.meta.changes > 0);
  } catch (e) {
    console.error(`[waitlist] insert failed: ${(e as Error).message}`);
    return jsonError(500, "db_error", "Could not save your spot. Please try again.");
  }

  // Best-effort emails - never block or fail the response.
  // The confirmation is sent on EVERY submit, including re-submits: a returning
  // subscriber who never got the first email (e.g. during an email outage) can
  // re-trigger it. The per-IP rate limit above caps abuse. Each send records its
  // outcome to audit_log so a silent delivery failure stays queryable in D1
  // (mirrors the signup-notification path) instead of vanishing into logs.
  context.waitUntil(sendConfirmation(env, email, userId).catch((e) =>
    console.warn(`[waitlist] confirmation email failed: ${e}`)));
  // Admin is alerted for genuinely-new signups only (a re-submit is not news).
  if (!already) {
    context.waitUntil(notifyAdmin(env, { email, plan, source, country }, userId).catch((e) =>
      console.warn(`[waitlist] admin email failed: ${e}`)));
  }

  return json({ ok: true, already });
};

async function sendConfirmation(env: Env, email: string, userId: string | null): Promise<void> {
  const html = emailShell({
    preheader: "You're on the r-statistics.co Pro founding-member waitlist.",
    contentHtml:
      `<p style="margin:0 0 14px"><strong>You're on the list.</strong></p>` +
      `<p style="margin:0 0 14px">Thanks for joining the r-statistics.co Pro founding-member waitlist. ` +
      `The price you saw is locked in for you, and we'll email you once &mdash; the moment Pro opens, ` +
      `with your founding-member checkout link.</p>` +
      `<p style="margin:0 0 14px">Your access begins when the paid features go live, not today. ` +
      `Until then, every tutorial, tool and exercise stays free to use.</p>` +
      `<p style="margin:0;color:#6b7280;font-size:13px">If you didn't request this, you can ignore this email.</p>`,
    ctaUrl: "https://r-statistics.co/roadmap/",
    ctaLabel: "Explore the roadmap while you wait",
  });
  const res = await sendMail(env, {
    to: { email },
    subject: "You're on the r-statistics.co Pro waitlist",
    htmlBody: html,
    textBody: "You're on the list. Thanks for joining the r-statistics.co Pro founding-member waitlist. " +
      "Your founding price is locked in and we'll email you once, the moment Pro opens, with your checkout link. " +
      "Your access begins when the paid features go live, not today. Until then everything stays free.",
  });
  await recordSend(env, userId, "confirm", email, res);
}

async function notifyAdmin(
  env: Env, info: { email: string; plan: string | null; source: string; country: string | null },
  userId: string | null,
): Promise<void> {
  if ((await env.KV.get("flag:waitlist-admin-email")) === "off") return;   // default on
  const html = emailShell({
    preheader: `New Pro waitlist signup: ${info.email}`,
    contentHtml:
      `<p style="margin:0 0 10px"><strong>New Pro waitlist signup</strong></p>` +
      `<p style="margin:0 0 6px">Email: <strong>${esc(info.email)}</strong></p>` +
      `<p style="margin:0 0 6px">Plan interest: ${esc(info.plan || "(none)")}</p>` +
      `<p style="margin:0 0 6px">Source: ${esc(info.source)}</p>` +
      `<p style="margin:0">Country: ${esc(info.country || "?")}</p>`,
  });
  const res = await sendMail(env, {
    to: { email: ADMIN_EMAIL, name: "Selva" },
    subject: `New Pro waitlist signup: ${info.email}`,
    htmlBody: html,
    textBody: `New Pro waitlist signup: ${info.email} · plan: ${info.plan || "(none)"} · source: ${info.source} · country: ${info.country || "?"}`,
  });
  await recordSend(env, userId, "admin", info.email, res);
}

// Durable record of each email outcome (sent/failed + ZeptoMail HTTP status) so
// a silent delivery failure is queryable in D1 rather than lost to ephemeral
// logs. Mirrors the signup-notification path. Never throws.
async function recordSend(
  env: Env, userId: string | null, kind: "confirm" | "admin", ref: string, res: SendMailResult,
): Promise<void> {
  try {
    await env.DB.prepare(
      "INSERT INTO audit_log (user_id, actor, action, ref, meta_json, at) VALUES (?, 'system', ?, ?, ?, ?)",
    )
      .bind(
        userId,
        res.ok ? `waitlist.${kind}.sent` : `waitlist.${kind}.failed`,
        ref,
        JSON.stringify({ status: res.status, error: res.error ?? null, body: res.body ?? null }).slice(0, 900),
        Math.floor(Date.now() / 1000),
      )
      .run();
  } catch { /* observability is non-fatal */ }
}
