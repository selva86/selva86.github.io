// Abandoned-checkout recovery (owner-approved 2026-07-23: 15% off, ONE email
// at the 2-hour mark).
//
// The pricing page captures the visitor's email the moment they type it into
// the Paddle overlay (intent_signals row, signal=checkout_lead, meta=email).
// This sweep finds leads 2-48h old with no completed purchase, mints a
// single-use 15% Paddle discount (24h expiry, restricted to the price they
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
import { sendMail } from "./email";
import { renderPersonalNote, SENDER as RSENDER, REPLY_TO as RREPLY } from "./email-templates";
// Recovery mail is store operations (a discount + "did checkout break?"),
// so it sends from the support address: role-appropriate, keeps the author
// brand out of discount nags, and signals a real operation at the moment a
// buyer decides whether to trust the site with money. Akshay keeps the
// lifecycle/series mail; Selva's name stays on the teaching.
// From a person, like every other non-receipt email on this site. A support
// alias offering a coupon reads as marketing; a note from Akshay asking what
// went wrong reads as a question, and it is the reply that is actually useful.
const RECOVERY_SENDER = RSENDER;
const RECOVERY_REPLY_TO = RREPLY;
import { notifyAdminEvent } from "./notify";

const SWEEP_INTERVAL = 1800;          // seconds between real runs
const MIN_AGE = 2 * 3600;             // lead must be at least 2h old
const MAX_AGE = 48 * 3600;            // and at most 48h old
const MAX_SENDS_PER_SWEEP = 10;

/* How long a recovery code lives, and when the reminder lands. REMIND_MIN/MAX
   are ages of the touch-1 send, so 20-22h puts the reminder 2-4 hours before a
   24h code dies. Keep the band at least 2h wide: the sweep runs at most every
   30 minutes off an hourly cron, and a narrower window can be stepped over. */
const CODE_HOURS = 24;
const REMIND_MIN = 20 * 3600;
const REMIND_MAX = 22 * 3600;

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
export async function hasPurchased(env: PaddleEnv, email: string): Promise<boolean> {
  const cust = await paddleGet(env, `/customers?email=${encodeURIComponent(email)}`);
  const id = cust?.data?.[0]?.id;
  if (!id) return false;
  const tx = await paddleGet(env, `/transactions?customer_id=${encodeURIComponent(id)}&per_page=10`);
  const rows: Array<{ status?: string }> = tx?.data ?? [];
  return rows.some((t) => ["completed", "paid", "billed"].includes(t.status || ""));
}

// Generic single-use percentage code (shared with the price-alert flow).
export async function createPaddleDiscount(
  env: PaddleEnv,
  o: { code: string; percent: string; expiresAt: number; priceIds?: string[]; description: string },
): Promise<boolean> {
  try {
    const body: Record<string, unknown> = {
      description: o.description,
      type: "percentage",
      amount: o.percent,
      enabled_for_checkout: true,
      code: o.code,
      usage_limit: 1,
      expires_at: new Date(o.expiresAt * 1000).toISOString(),
    };
    if (o.priceIds && o.priceIds.length) body.restrict_to = o.priceIds;
    const resp = await fetch(paddleApiBase(env.PADDLE_API_KEY!) + "/discounts", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.PADDLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return resp.ok;
  } catch (_) { return false; }
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
      expires_at: new Date(Date.now() + CODE_HOURS * 3600 * 1000).toISOString(),
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

export function recoveryEmail(code: string): { subject: string; html: string; text: string } {
  const link = `https://r-statistics.co/pricing.html?code=${encodeURIComponent(code)}&src=recovery`;
  /* Names the three real reasons someone stops at a checkout instead of
     assuming it was the price. Leading with the discount answers a question
     most of them did not ask, and teaches the ones who notice that abandoning
     is worth 15%. */
  const body = [
    "Hi,",
    "",
    "You got as far as the checkout page at r-statistics.co earlier and then stopped. In my experience that is one of three things: the price, something that did not work, or you just wanted to think it over.",
    "",
    "If it was the price, this code takes 15% off. It works once, and it stops working in 24 hours.",
    "",
    code,
    "",
    `[Pick up where you left off -> ${link}]`,
    "",
    "The code applies itself through that link, so there is nothing to type in. And every plan has a 14 day refund, so if you join and it turns out not to be what you wanted, you are not stuck with it.",
    "",
    "If it was one of the other two, reply and tell me what happened. I read every one.",
    "",
    "Akshay",
  ].join("\n");
  const r = renderPersonalNote({
    key: "cart-recovery", category: "offers",
    reason: "you started a checkout at r-statistics.co",
    subject: "Did something go wrong at checkout?",
    preheader: "There is a 15% code in here if the price was the sticking point.",
    body, data: {},
  });
  return { subject: r.subject, html: r.html, text: r.text };
}

export function reminderEmail(code: string, hoursLeft = 3): { subject: string; html: string; text: string } {
  const link = `https://r-statistics.co/pricing.html?code=${encodeURIComponent(code)}&src=recovery2`;
  const body = [
    "Hi,",
    "",
    "One note and then I will leave you alone.",
    "",
    `The 15% code from your checkout, ${code}, has not been used and stops working in about ${hoursLeft} ${hoursLeft === 1 ? "hour" : "hours"}.`,
    "",
    `[Use it here -> ${link}]`,
    "",
    "If the price was never the problem, that is genuinely fine and you can ignore this. But if something about the checkout itself did not work, reply and tell me what happened. Every reply gets read.",
    "",
    "Akshay",
  ].join("\n");
  const r = renderPersonalNote({
    key: "cart-recovery-2", category: "offers",
    reason: "you started a checkout at r-statistics.co",
    subject: "That 15% code runs out in a few hours",
    preheader: "One note, then I will stop.",
    body, data: {},
  });
  return { subject: r.subject, html: r.html, text: r.text };
}

// Touch 2: for every touch-1 recovery REMIND_MIN..REMIND_MAX old, still
// unpurchased, sent so it lands a few hours BEFORE the code dies rather than
// send ONE expiry reminder with the same code. Older touch-1 sends that
// predate code storage simply never match (no recovery_code row).
async function sweepExpiryReminders(env: Env & PaddleEnv, now: number): Promise<void> {
  const due = await env.DB.prepare(
    "SELECT r.meta AS email, r.user_id, r.anon_id, r.at AS sent_at, c.path AS code FROM intent_signals r " +
    "JOIN intent_signals c ON c.signal = 'recovery_code' AND c.meta = r.meta " +
    "WHERE r.signal = 'recovery_sent' AND r.path != 'skipped:purchased' " +
    "AND r.at BETWEEN ?1 AND ?2 " +
    "AND r.meta NOT IN (SELECT meta FROM intent_signals WHERE signal = 'recovery2_sent') " +
    "GROUP BY r.meta LIMIT 10"
  ).bind(now - REMIND_MAX, now - REMIND_MIN)
    .all<{ email: string; user_id: string | null; anon_id: string | null; sent_at: number; code: string }>();

  for (const d of due.results ?? []) {
    const email = (d.email || "").trim().toLowerCase();
    if (!looksLikeEmail(email) || !d.code) continue;
    if (await hasPurchased(env, email)) {
      await env.DB.prepare(
        "INSERT INTO intent_signals (at, user_id, anon_id, signal, path, meta) VALUES (?, ?, ?, 'recovery2_sent', 'skipped:purchased', ?)"
      ).bind(now, d.user_id, d.anon_id, email).run().catch(() => {});
      continue;
    }
    // Real hours left, not a fixed phrase: the band is two hours wide, so a
    // hardcoded number would be wrong at one end of it.
    const hoursLeft = Math.max(1, Math.round((d.sent_at + CODE_HOURS * 3600 - now) / 3600));
    const mail = reminderEmail(d.code, hoursLeft);
    const res = await sendMail(env, {
      to: { email },
      subject: mail.subject,
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
        subject: mail.subject,
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
