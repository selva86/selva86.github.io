// POST /api/contact - public contact form.
//
// Sends the sender's message to the site inbox via ZeptoMail, with Reply-To
// set to the sender so the owner can reply directly from their inbox.
// Protections: shared origin + client check, honeypot field, Turnstile when
// configured, per-IP rate limit (KV), length caps, and HTML-escaping of all
// user input before it lands in the email.
//
// A contact-form notification is genuinely transactional, so ZeptoMail is the
// correct sender here. Delivery still depends on available ZeptoMail credits.
//
// HARDENED 2026-11-23, after a bot submitted here and to /api/feedback. The
// origin test used to read `if (origin && origin !== env.SITE_ORIGIN)`, which
// skipped itself when no Origin header was present: a plain curl POST reached
// sendMail and spent a ZeptoMail credit. Verified against production that day
// (no Origin -> 400 bad_json, so the check had been passed, not failed). The
// same comparison also rejected www and every preview deploy. Both faults are
// gone: the check now lives in _lib/form-guard.ts and is shared with
// /api/feedback and /api/waitlist, which already had it right.

import type { Env } from "../_middleware";
import { sendMail } from "../_lib/email";
import { json, jsonError } from "../_lib/errors";
import { guardHeaders, guardChallenge, clientMeta } from "../_lib/form-guard";

const INBOX = "selva86@gmail.com"; // where contact messages are delivered
const MAX = { name: 100, email: 160, subject: 150, message: 5000 };
const RL_LIMIT = 5; // messages per window per IP
const RL_WINDOW = 600; // seconds

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function validEmail(s: string): boolean {
  // Deliberately simple; ZeptoMail rejects genuinely bad addresses anyway.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= MAX.email;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // Origin and client shape: free checks, so they run before anything else.
  const denied = guardHeaders(request, env);
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "bad_json", "Invalid request body.");
  }

  // Honeypot: real users leave this empty; bots fill it.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return json({ ok: true }); // silently accept, do not send
  }

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const subject = String(body.subject ?? "").trim();
  const message = String(body.message ?? "").trim();

  if (!name || !email || !message) {
    return jsonError(400, "missing_fields", "Please add your name, email, and message.");
  }
  if (!validEmail(email)) {
    return jsonError(400, "bad_email", "Please enter a valid email address.");
  }
  if (name.length > MAX.name || subject.length > MAX.subject || message.length > MAX.message) {
    return jsonError(400, "too_long", "One of the fields is too long.");
  }

  const meta = clientMeta(request);

  // Per-IP rate limit (best-effort; KV is not strictly atomic).
  const rlKey = `contact-rl:${meta.ip}`;
  try {
    const n = parseInt((await env.KV.get(rlKey)) || "0", 10) || 0;
    if (n >= RL_LIMIT) {
      return jsonError(429, "rate_limited", "Too many messages. Please try again later or email support@r-statistics.co.");
    }
    await env.KV.put(rlKey, String(n + 1), { expirationTtl: RL_WINDOW });
  } catch {
    // If KV is unavailable, don't block a legitimate message.
  }

  /* Turnstile last of the gates: it is the only one that costs a subrequest,
     so the rate limiter above turns a flood away before we pay for it. */
  const guard = await guardChallenge(request, env, String(body.cf_turnstile_response ?? ""));
  if (guard.deny) return guard.deny;

  const when = new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC";
  const subjLine = subject || "(no subject)";
  const htmlBody =
    `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#1a1a2e;line-height:1.6">` +
    `<p style="margin:0 0 12px"><strong>New message from the r-statistics.co contact form</strong></p>` +
    `<table style="border-collapse:collapse">` +
    `<tr><td style="padding:2px 12px 2px 0;color:#6b7280">Name</td><td><strong>${esc(name)}</strong></td></tr>` +
    `<tr><td style="padding:2px 12px 2px 0;color:#6b7280">Email</td><td><a href="mailto:${esc(email)}">${esc(email)}</a></td></tr>` +
    `<tr><td style="padding:2px 12px 2px 0;color:#6b7280">Subject</td><td>${esc(subjLine)}</td></tr>` +
    `<tr><td style="padding:2px 12px 2px 0;color:#6b7280">Received</td><td>${when}</td></tr>` +
    `<tr><td style="padding:2px 12px 2px 0;color:#6b7280">From</td><td>${esc(meta.country || "?")} &middot; ${esc(meta.ip)}</td></tr>` +
    `</table>` +
    `<p style="margin:14px 0 6px;color:#6b7280">Message</p>` +
    `<div style="white-space:pre-wrap;border-left:3px solid #e5e7eb;padding:4px 0 4px 12px">${esc(message)}</div>` +
    `<p style="color:#6b7280;font-size:13px;margin-top:16px">Reply to this email to respond to ${esc(name)} directly.</p>` +
    `</div>`;
  const textBody =
    `New message from the r-statistics.co contact form\n\n` +
    `Name: ${name}\nEmail: ${email}\nSubject: ${subjLine}\nReceived: ${when}\n\n` +
    `Message:\n${message}\n\nReply to this email to respond directly.`;

  const res = await sendMail(env, {
    to: { email: INBOX, name: "Selva" },
    subject: `Contact form: ${subjLine}`,
    htmlBody,
    textBody,
    replyTo: { email, name },
  });

  /* Durable record. This endpoint used to store nothing at all, so the inbox
     was the only trace a contact message had ever existed: a submission could
     not be counted, correlated with a second one from the same address, or
     attributed to an IP. Written after the send so the row carries the
     delivery outcome, and never allowed to fail the request. */
  context.waitUntil(
    env.DB.prepare(
      "INSERT INTO audit_log (user_id, actor, action, ref, meta_json, at) VALUES (NULL, 'system', 'contact', ?, ?, ?)",
    )
      .bind(
        email,
        JSON.stringify({
          name, email, subject: subjLine, message,
          ip: meta.ip, ua: meta.ua, country: meta.country, ray: meta.ray, asn: meta.asn,
          turnstile: guard.turnstile,
          sent: res.ok, send_status: res.status ?? null,
        }).slice(0, 3800),
        Math.floor(Date.now() / 1000),
      )
      .run()
      .catch((e) => console.warn(`[contact] audit_log insert failed: ${e}`)),
  );

  if (!res.ok) {
    return jsonError(502, "send_failed", "We could not send your message right now. Please email support@r-statistics.co instead.");
  }
  return json({ ok: true });
};
