// Abandoned-checkout recovery (owner-approved 2026-07-23: 15% off, ONE email
// at the 2-hour mark).
//
// The pricing page captures the visitor's email the moment they type it into
// the Paddle overlay (intent_signals row, signal=checkout_lead, meta=email).
// This sweep finds leads 2-48h old with no completed purchase, mints a
// single-use 15% Paddle discount (72h expiry, restricted to the price they
// chose when known) and sends one service-toned recovery email via ZeptoMail.
//
// No cron exists on Pages Functions, so the sweep piggybacks on traffic:
// /api/signal and /api/admin/stats call it via waitUntil, and a KV timestamp
// throttles it to one real run per 30 minutes. Gated by KV flag
// `flag:cart-recovery`. Dedup marker = a server-inserted intent_signals row
// (signal=recovery_sent, meta=email): queryable, visible on the dashboard,
// and immune to KV eventual consistency across sweeps.

import type { Env } from "../_middleware";
import { ensureIntentTable } from "../api/signal";
import { paddleApiBase } from "./paddle";
import { sendMail, emailShell } from "./email";
// Recovery mail is store operations (a discount + "did checkout break?"),
// so it sends from the support address: role-appropriate, keeps the author
// brand out of discount nags, and signals a real operation at the moment a
// buyer decides whether to trust the site with money. Akshay keeps the
// lifecycle/series mail; Selva's name stays on the teaching.
const RECOVERY_SENDER = { email: "support@r-statistics.co", name: "r-statistics.co support" };
const RECOVERY_REPLY_TO = { email: "support@r-statistics.co", name: "r-statistics.co support" };
import { notifyAdminEvent } from "./notify";

const SWEEP_INTERVAL = 1800;          // seconds between real runs
const MIN_AGE = 2 * 3600;             // lead must be at least 2h old
const MAX_AGE = 48 * 3600;            // and at most 48h old
const MAX_SENDS_PER_SWEEP = 10;

interface PaddleEnv { PADDLE_API_KEY?: string }

function looksLikeEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s) && s.length <= 120;
}

function genCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let tail = "";
  const buf = new Uint8Array(5);
  crypto.getRandomValues(buf);
  for (const b of buf) tail += chars[b % chars.length];
  return "BACK15" + tail;
}

async function paddleGet(env: PaddleEnv, path: string): Promise<any | null> {
  try {
    const resp = await fetch(paddleApiBase(env.PADDLE_API_KEY!) + path, {
      headers: { Authorization: `Bearer ${env.PADDLE_API_KEY}` },
    });
    if (!resp.ok) return null;
    return await resp.json();
  } catch (_) { return null; }
}

// Has this email completed (or be mid-flight on) a Paddle transaction?
// Authoritative check against Paddle itself, so buyers whose checkout email
// differs from any site account are never nagged.
async function hasPurchased(env: PaddleEnv, email: string): Promise<boolean> {
  const cust = await paddleGet(env, `/customers?email=${encodeURIComponent(email)}`);
  const id = cust?.data?.[0]?.id;
  if (!id) return false;
  const tx = await paddleGet(env, `/transactions?customer_id=${encodeURIComponent(id)}&per_page=10`);
  const rows: Array<{ status?: string }> = tx?.data ?? [];
  return rows.some((t) => ["completed", "paid", "billed"].includes(t.status || ""));
}

async function createDiscount(
  env: PaddleEnv, code: string, priceId: string | null,
): Promise<boolean> {
  try {
    const body: Record<string, unknown> = {
      description: "Checkout recovery (auto)",
      type: "percentage",
      amount: "15",
      enabled_for_checkout: true,
      code,
      usage_limit: 1,
      expires_at: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
    };
    if (priceId) { body.restrict_to = [priceId]; }
    const resp = await fetch(paddleApiBase(env.PADDLE_API_KEY!) + "/discounts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.PADDLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    return resp.ok;
  } catch (_) { return false; }
}

export function recoveryEmail(code: string): { html: string; text: string } {
  const link = `https://r-statistics.co/pricing.html?code=${encodeURIComponent(code)}&src=recovery`;
  const contentHtml = `
    <p style="font-size:17px;font-weight:600;color:#0a0d14;margin:0 0 12px">Your enrollment is one step from done</p>
    <p>You started checkout at r-statistics.co but did not finish. Your plan selection is still waiting, and to make the decision easier the code below takes <strong>15% off</strong>. It works once and expires in 72 hours.</p>
    <p style="margin:18px 0;text-align:center">
      <span style="display:inline-block;background:#f3f4f6;border:1px dashed #9ca3af;border-radius:8px;padding:10px 22px;font-size:20px;font-weight:700;letter-spacing:1px">${code}</span>
    </p>
    <p style="text-align:center;margin:18px 0">
      <a href="${link}" style="display:inline-block;background:#2056d2;color:#fff;text-decoration:none;font-weight:600;padding:11px 26px;border-radius:8px">Finish enrolling</a>
    </p>
    <p style="color:#6b7280;font-size:13px">The code is applied automatically when you use the button. Every plan includes the 14-day money-back guarantee. If you hit any problem with checkout, just reply to this email and tell us what happened.</p>`;
  const text =
    "You started checkout at r-statistics.co but did not finish.\n\n" +
    `This code takes 15% off and works for 72 hours (one use): ${code}\n\n` +
    `Finish enrolling: ${link}\n\n` +
    "Every plan includes the 14-day money-back guarantee. If you hit any problem with checkout, reply to this email.";
  return { html: emailShell({ preheader: "15% off to finish your enrollment", contentHtml }), text };
}

export function reminderEmail(code: string): { html: string; text: string } {
  const link = `https://r-statistics.co/pricing.html?code=${encodeURIComponent(code)}&src=recovery2`;
  const contentHtml = `
    <p style="margin:0 0 6px"><span style="display:inline-block;background:#fef3c7;color:#92400e;font-size:12px;font-weight:700;letter-spacing:.4px;padding:3px 10px;border-radius:99px;text-transform:uppercase">Expires tomorrow</span></p>
    <p style="margin:12px 0 0">One quick nudge and then we will leave you alone: the 15% code from your checkout, <strong style="letter-spacing:1px">${code}</strong>, is still unused and stops working tomorrow.</p>
    <p style="margin:14px 0 0">If you meant to come back, this link applies it for you: <a href="${link}" style="color:#2056d2;font-weight:600">finish enrolling here</a>.</p>
    <p style="margin:14px 0 0">And if something about checkout did not work, or the price is the sticking point, reply to this email and tell us what happened. Every reply gets read.</p>`;
  const text =
    "One quick nudge and then we will leave you alone: the 15% code " +
    `from your checkout, ${code}, is still unused and stops working tomorrow.\n\n` +
    `If you meant to come back, this link applies it for you: ${link}\n\n` +
    "And if something about checkout did not work, or the price is the sticking point, " +
    "reply to this email and tell us what happened. Every reply gets read.";
  return { html: emailShell({ preheader: "The 15% code from your checkout expires tomorrow", contentHtml }), text };
}

// Touch 2: for every touch-1 recovery 46-60h old (code expires at 72h, so
// "tomorrow" is literally true across the whole band), still unpurchased,
// send ONE expiry reminder with the same code. Older touch-1 sends that
// predate code storage simply never match (no recovery_code row).
async function sweepExpiryReminders(env: Env & PaddleEnv, now: number): Promise<void> {
  const due = await env.DB.prepare(
    "SELECT r.meta AS email, r.user_id, r.anon_id, c.path AS code FROM intent_signals r " +
    "JOIN intent_signals c ON c.signal = 'recovery_code' AND c.meta = r.meta " +
    "WHERE r.signal = 'recovery_sent' AND r.path != 'skipped:purchased' " +
    "AND r.at BETWEEN ?1 AND ?2 " +
    "AND r.meta NOT IN (SELECT meta FROM intent_signals WHERE signal = 'recovery2_sent') " +
    "GROUP BY r.meta LIMIT 10"
  ).bind(now - 60 * 3600, now - 46 * 3600)
    .all<{ email: string; user_id: string | null; anon_id: string | null; code: string }>();

  for (const d of due.results ?? []) {
    const email = (d.email || "").trim().toLowerCase();
    if (!looksLikeEmail(email) || !d.code) continue;
    if (await hasPurchased(env, email)) {
      await env.DB.prepare(
        "INSERT INTO intent_signals (at, user_id, anon_id, signal, path, meta) VALUES (?, ?, ?, 'recovery2_sent', 'skipped:purchased', ?)"
      ).bind(now, d.user_id, d.anon_id, email).run().catch(() => {});
      continue;
    }
    const mail = reminderEmail(d.code);
    const res = await sendMail(env, {
      to: { email },
      subject: "Your 15% code expires tomorrow",
      htmlBody: mail.html,
      textBody: mail.text,
      from: RECOVERY_SENDER, replyTo: RECOVERY_REPLY_TO,
    });
    if (!res.ok) continue;   // no marker: retried on a later sweep inside the band
    await env.DB.prepare(
      "INSERT INTO intent_signals (at, user_id, anon_id, signal, path, meta) VALUES (?, ?, ?, 'recovery2_sent', ?, ?)"
    ).bind(now, d.user_id, d.anon_id, d.code, email).run().catch(() => {});
    await notifyAdminEvent(env, {
      subject: `Expiry reminder sent: ${email}`,
      headline: "Checkout recovery reminder (touch 2) sent",
      rows: [["Lead", email], ["Code", d.code]],
      replyTo: email,
    });
  }
}

export async function sweepAbandonedCheckouts(env: Env & PaddleEnv): Promise<void> {
  try {
    if ((await env.KV.get("flag:cart-recovery")) !== "on") return;
    if (!env.PADDLE_API_KEY) return;

    // throttle to one real run per SWEEP_INTERVAL
    const now = Math.floor(Date.now() / 1000);
    const last = Number((await env.KV.get("cart-sweep:last")) || 0);
    if (now - last < SWEEP_INTERVAL) return;
    await env.KV.put("cart-sweep:last", String(now));

    await ensureIntentTable(env.DB);
    const leads = await env.DB.prepare(
      "SELECT meta AS email, anon_id, user_id, MAX(at) AS last_at FROM intent_signals " +
      "WHERE signal = 'checkout_lead' AND at BETWEEN ?1 AND ?2 " +
      "AND meta NOT IN (SELECT meta FROM intent_signals WHERE signal = 'recovery_sent') " +
      "GROUP BY meta ORDER BY last_at DESC LIMIT 25"
    ).bind(now - MAX_AGE, now - MIN_AGE)
      .all<{ email: string; anon_id: string | null; user_id: string | null; last_at: number }>();

    let sent = 0;
    for (const lead of leads.results ?? []) {
      if (sent >= MAX_SENDS_PER_SWEEP) break;
      const email = (lead.email || "").trim().toLowerCase();
      if (!looksLikeEmail(email)) continue;
      if (await hasPurchased(env, email)) {
        // record so the dashboard shows the lead converted and we never re-check
        await env.DB.prepare(
          "INSERT INTO intent_signals (at, user_id, anon_id, signal, path, meta) VALUES (?, ?, ?, 'recovery_sent', 'skipped:purchased', ?)"
        ).bind(now, lead.user_id, lead.anon_id, email).run().catch(() => {});
        continue;
      }

      // price the lead was looking at, for a restricted code (best effort)
      const ps = await env.DB.prepare(
        "SELECT meta FROM intent_signals WHERE signal = 'checkout_start' AND " +
        "((anon_id IS NOT NULL AND anon_id = ?1) OR (user_id IS NOT NULL AND user_id = ?2)) " +
        "ORDER BY at DESC LIMIT 1"
      ).bind(lead.anon_id, lead.user_id).first<{ meta: string | null }>().catch(() => null);
      const priceId = ps?.meta && /^pri_/.test(ps.meta) ? ps.meta : null;

      const code = genCode();
      if (!(await createDiscount(env, code, priceId))) {
        // no marker: retried on a later sweep
        continue;
      }
      const mail = recoveryEmail(code);
      const res = await sendMail(env, {
        to: { email },
        subject: "Finish your r-statistics.co enrollment (15% off inside)",
        htmlBody: mail.html,
        textBody: mail.text,
        from: RECOVERY_SENDER, replyTo: RECOVERY_REPLY_TO,
      });
      if (!res.ok) continue;   // no marker: retried later

      sent++;
      await env.DB.prepare(
        "INSERT INTO intent_signals (at, user_id, anon_id, signal, path, meta) VALUES (?, ?, ?, 'recovery_sent', ?, ?)"
      ).bind(now, lead.user_id, lead.anon_id, priceId || "", email).run().catch(() => {});
      // The code itself, for the expiry reminder (touch 2) 46h later.
      await env.DB.prepare(
        "INSERT INTO intent_signals (at, user_id, anon_id, signal, path, meta) VALUES (?, ?, ?, 'recovery_code', ?, ?)"
      ).bind(now, lead.user_id, lead.anon_id, code, email).run().catch(() => {});
      await notifyAdminEvent(env, {
        subject: `Recovery email sent: ${email}`,
        headline: "Abandoned-checkout recovery email sent",
        rows: [["Lead", email], ["Code", code], ["Price", priceId || "any plan"]],
        replyTo: email,
      });
    }
    await sweepExpiryReminders(env, now);
  } catch (e) {
    console.warn(`[cart-recovery] sweep failed: ${(e as Error).message}`);
  }
}
