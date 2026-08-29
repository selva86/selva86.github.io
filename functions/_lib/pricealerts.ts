// The "email me if there is ever a discount" flow (owner-approved 2026-08-29).
//
// A visitor clicks the quiet button on pricing / lesson-locked / Why-Pro.
// That click is the purest purchase-intent signal there is ("I want this,
// price is the blocker") and doubles as explicit offers consent
// (users.email_offers = 1, audit_log row). One row per address in
// price_alerts is the whole state machine:
//
//   click  -> confirmation email (sent synchronously by /api/price-alert) with
//             four one-click intent links: today / week / month / someday
//   intent -> offer_due_at   today: next hourly run   week: +24h
//                            month: +21d   someday: +45d   (no answer: +72h)
//   due    -> a personal single-use 23% Paddle code, annual plans only, 7-day
//             expiry snapped to hh:30 so the hourly cron lands exactly 30 min
//             before it; the offer email links pricing.html?code=... which
//             applies the code at checkout
//   T-24h  -> one reminder, only if still unbought
//   T-30m  -> the "last 30 minutes" note, only to people who OPENED the offer
//             or the reminder and still have not bought (silent readers never
//             get it)
//   expiry -> the close: no more emails unless they click "tell me next time"
//             (renew = eligible again after 60 days)
//   every step stops the moment a purchase is detected (local Pro state, or
//   the Paddle customer's transactions).
//
// Sends go through the personal-note renderer (Akshay voice); copy lives in
// _data/lifecycle-emails.json under alert-* and is dashboard-editable via
// KV emailcopy:<template>. flag:price-alerts gates the sweep; flag:email-live
// off = allowlist-only, same as the brain.

import type { Env } from "../_middleware";
import { sendMail } from "./email";
import { renderEmail, SENDER, REPLY_TO, type TemplateData } from "./email-templates";
import { createPaddleDiscount, hasPurchased } from "./cartrecovery";

const SITE = "https://r-statistics.co";
const SWEEP_INTERVAL = 30 * 60;
const MAX_SENDS_PER_SWEEP = 40;
const DEFAULT_ALLOWLIST = "selva@r-statistics.co,selva86@gmail.com";
const OFFER_PERCENT = "23";
const OFFER_DAYS = 7;

export type AlertEnv = Env & {
  EMAIL_UNSUB_SECRET?: string;
  EMAIL_TEST_ALLOWLIST?: string;
  PADDLE_PRICE_SINGLE_YEAR?: string;
  PADDLE_PRICE_AA_YEAR?: string;
  ZOHO_ZEPTOMAIL_TOKEN: string;
  ZOHO_ZEPTOMAIL_SENDER: string;
};

export interface AlertRow {
  id: number; user_id: string | null; email: string; surface: string | null; country: string | null;
  created_at: number; intent: string | null; intent_at: number | null; offer_due_at: number | null;
  offer_sent_at: number | null; offer_code: string | null; offer_expires_at: number | null;
  reminder_sent_at: number | null; last30_sent_at: number | null; closed_sent_at: number | null;
  purchased_at: number | null; unsubscribed_at: number | null;
  display_name?: string | null; pro_until?: number | null;
}

async function hmacHex(secret: string, msg: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Every signed link for an alert row signs "pa:<id>", account or not, so the
// endpoints never need to know whether a user exists.
export function alertSubject(id: number): string { return `pa:${id}`; }
export async function alertSig(env: { EMAIL_UNSUB_SECRET?: string }, id: number): Promise<string | null> {
  if (!env.EMAIL_UNSUB_SECRET) return null;
  return hmacHex(env.EMAIL_UNSUB_SECRET, alertSubject(id));
}
export async function verifyAlertSig(env: { EMAIL_UNSUB_SECRET?: string }, id: number, t: string): Promise<boolean> {
  const want = await alertSig(env, id);
  return !!want && want === (t || "").toLowerCase();
}

export function offerDueAt(intent: string | null, at: number): number {
  switch (intent) {
    case "today": return at;                 // the next hourly run
    case "week": return at + 24 * 3600;
    case "month": return at + 21 * 86400;
    case "someday": return at + 45 * 86400;
    case "renew": return at + 60 * 86400;    // "tell me next time": the next occasion, not a re-nag
    default: return at + 72 * 3600;          // never answered: a gentle offer after three days
  }
}

// Seven days out, snapped to hh:30, so the :00 cron run before expiry is
// exactly 30 minutes early: the "last 30 minutes" note needs no scheduler.
export function offerExpiry(sentAt: number): number {
  const base = sentAt + OFFER_DAYS * 86400;
  return Math.floor(base / 3600) * 3600 + 1800;
}

function fmtExpiry(sec: number): string {
  return new Date(sec * 1000).toLocaleString("en-US", {
    weekday: "long", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "UTC",
  }) + " UTC";
}

function genCode(): string {
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "PRO23";
  const b = new Uint8Array(6); crypto.getRandomValues(b);
  for (const x of b) s += A[x % A.length];
  return s;
}

async function trackData(env: AlertEnv, row: AlertRow, key: string): Promise<TemplateData> {
  const uid = row.user_id || alertSubject(row.id);
  const sig = env.EMAIL_UNSUB_SECRET ? await hmacHex(env.EMAIL_UNSUB_SECRET, uid) : "";
  const stopSig = await alertSig(env, row.id);
  const d: TemplateData = { first_name: row.display_name || null };
  if (sig) d.track = { uid, sig, key };
  if (stopSig) d.unsubscribe_url = `${SITE}/api/price-alert/stop?a=${row.id}&t=${stopSig}`;
  return d;
}

async function copyFor(env: AlertEnv, template: string) {
  try { const raw = await env.KV.get(`emailcopy:${template}`); if (raw) return JSON.parse(raw); } catch { /* default */ }
  return null;
}

function allowedTo(env: AlertEnv, live: boolean, email: string): boolean {
  if (live) return true;
  const allow = new Set((env.EMAIL_TEST_ALLOWLIST || DEFAULT_ALLOWLIST).split(",").map((s) => s.trim().toLowerCase()).filter(Boolean));
  return allow.has(email.toLowerCase());
}

async function logEvent(env: AlertEnv, row: AlertRow, key: string, event: string, meta: string) {
  const uid = row.user_id || alertSubject(row.id);
  await env.DB.prepare(
    "INSERT INTO email_events (user_id, email, email_key, event, at, meta) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
  ).bind(uid, row.email, key, event, Math.floor(Date.now() / 1000), meta.slice(0, 180)).run().catch(() => {});
}

async function sendTemplate(env: AlertEnv, row: AlertRow, template: string, key: string, extra: Partial<TemplateData>, why: string): Promise<boolean> {
  const data = Object.assign(await trackData(env, row, key), extra);
  const r = renderEmail(template, data, await copyFor(env, template));
  if (!r) return false;
  const res = await sendMail(env, {
    to: { email: row.email, name: row.display_name || undefined },
    subject: r.subject, htmlBody: r.html, textBody: r.text, from: SENDER, replyTo: REPLY_TO,
  });
  await logEvent(env, row, key, res.ok ? "sent" : "error", res.ok ? why : (res.error || String(res.status)));
  return res.ok;
}

// ---- the confirmation, sent synchronously by /api/price-alert ------------
export async function sendAlertConfirmation(env: AlertEnv, row: AlertRow): Promise<boolean> {
  const live = (await env.KV.get("flag:email-live")) === "on";
  if (!allowedTo(env, live, row.email)) { await logEvent(env, row, "alert-confirm", "would_send", "dev mode"); return false; }
  const t = await alertSig(env, row.id);
  if (!t) return false;
  const link = (w: string) => `${SITE}/api/email/intent?a=${row.id}&t=${t}&w=${w}`;
  return sendTemplate(env, row, "alert-confirm", "alert-confirm", {
    today_url: link("today"), week_url: link("week"), month_url: link("month"), someday_url: link("someday"),
  }, `asked from ${row.surface || "pricing"}`);
}

async function purchased(env: AlertEnv, row: AlertRow, now: number): Promise<boolean> {
  if (row.pro_until === -1 || (row.pro_until ?? 0) > now) return true;
  if (row.user_id) {
    const u = await env.DB.prepare("SELECT pro_until FROM users WHERE id = ?1").bind(row.user_id).first<{ pro_until: number | null }>();
    if (u && (u.pro_until === -1 || (u.pro_until ?? 0) > now)) return true;
  }
  if (env.PADDLE_API_KEY) return hasPurchased(env, row.email);
  return false;
}

async function markPurchased(env: AlertEnv, row: AlertRow, now: number) {
  await env.DB.prepare("UPDATE price_alerts SET purchased_at = ?1 WHERE id = ?2 AND purchased_at IS NULL").bind(now, row.id).run();
  await logEvent(env, row, "alert-flow", "converted", "purchase detected, flow stopped");
}

async function engaged(env: AlertEnv, row: AlertRow): Promise<boolean> {
  const uid = row.user_id || alertSubject(row.id);
  const r = await env.DB.prepare(
    "SELECT 1 AS x FROM email_events WHERE user_id = ?1 AND email_key IN ('alert-offer','alert-reminder') AND event IN ('open','click') LIMIT 1",
  ).bind(uid).first<{ x: number }>();
  return !!r;
}

// ---- the hourly sweep -----------------------------------------------------
export async function sweepPriceAlerts(env: AlertEnv, opts: { force?: boolean } = {}): Promise<void> {
  try {
    if ((await env.KV.get("flag:price-alerts")) !== "on") return;
    const now = Math.floor(Date.now() / 1000);
    if (!opts.force) {
      const last = Number((await env.KV.get("alert-sweep:last")) || 0);
      if (now - last < SWEEP_INTERVAL) return;
      await env.KV.put("alert-sweep:last", String(now));
    }
    const live = (await env.KV.get("flag:email-live")) === "on";
    const rows = (await env.DB.prepare(
      `SELECT p.*, u.display_name, u.pro_until FROM price_alerts p LEFT JOIN users u ON u.id = p.user_id
       WHERE p.unsubscribed_at IS NULL AND p.purchased_at IS NULL AND p.closed_sent_at IS NULL
       ORDER BY p.created_at LIMIT 300`,
    ).all<AlertRow>()).results ?? [];

    let sends = 0;
    for (const row of rows) {
      if (sends >= MAX_SENDS_PER_SWEEP) break;
      if (!allowedTo(env, live, row.email)) continue;
      const due = row.offer_due_at ?? offerDueAt(row.intent, row.intent_at ?? row.created_at);

      // 1) the offer
      if (!row.offer_sent_at) {
        if (due > now) continue;
        if (await purchased(env, row, now)) { await markPurchased(env, row, now); continue; }
        const code = genCode();
        const expires = offerExpiry(now);
        const priceIds = [env.PADDLE_PRICE_SINGLE_YEAR, env.PADDLE_PRICE_AA_YEAR].filter((x): x is string => !!x);
        const ok = await createPaddleDiscount(env, {
          code, percent: OFFER_PERCENT, expiresAt: expires, priceIds,
          description: `Price alert offer (auto) for alert #${row.id}`,
        });
        if (!ok) continue; // retried next sweep
        const sent = await sendTemplate(env, row, "alert-offer", "alert-offer", {
          code, expires_line: fmtExpiry(expires),
          offer_url: `${SITE}/pricing.html?code=${encodeURIComponent(code)}&src=alert&exp=${expires}`,
        }, `intent=${row.intent || "none"}`);
        if (sent) {
          sends++;
          await env.DB.prepare(
            "UPDATE price_alerts SET offer_sent_at = ?1, offer_code = ?2, offer_expires_at = ?3, offer_due_at = ?4 WHERE id = ?5",
          ).bind(now, code, expires, due, row.id).run();
        }
        continue;
      }

      const exp = row.offer_expires_at ?? 0;
      const left = exp - now;
      const offerUrl = `${SITE}/pricing.html?code=${encodeURIComponent(row.offer_code || "")}&src=alert&exp=${exp}`;

      // 2) the T-24h reminder (one run's window), unbought only
      if (!row.reminder_sent_at && left <= 25 * 3600 && left > 24 * 3600 - 300) {
        if (await purchased(env, row, now)) { await markPurchased(env, row, now); continue; }
        if (await sendTemplate(env, row, "alert-reminder", "alert-reminder",
          { code: row.offer_code || "", offer_url: offerUrl, expires_line: fmtExpiry(exp) }, "24h before expiry")) {
          sends++;
          await env.DB.prepare("UPDATE price_alerts SET reminder_sent_at = ?1 WHERE id = ?2").bind(now, row.id).run();
        }
        continue;
      }

      // 3) the last 30 minutes: only the people who opened and still hold back
      if (!row.last30_sent_at && left > 0 && left <= 45 * 60) {
        if (!(await engaged(env, row))) continue;
        if (await purchased(env, row, now)) { await markPurchased(env, row, now); continue; }
        if (await sendTemplate(env, row, "alert-last30", "alert-last30",
          { code: row.offer_code || "", offer_url: offerUrl }, "30 minutes before expiry, engaged")) {
          sends++;
          await env.DB.prepare("UPDATE price_alerts SET last30_sent_at = ?1 WHERE id = ?2").bind(now, row.id).run();
        }
        continue;
      }

      // 4) the close, after expiry
      if (left <= 0 && exp > 0) {
        if (await purchased(env, row, now)) { await markPurchased(env, row, now); continue; }
        const t = await alertSig(env, row.id);
        if (await sendTemplate(env, row, "alert-closed", "alert-closed",
          { renew_url: `${SITE}/api/email/intent?a=${row.id}&t=${t}&w=renew` }, "code expired, closing")) {
          sends++;
          await env.DB.prepare("UPDATE price_alerts SET closed_sent_at = ?1 WHERE id = ?2").bind(now, row.id).run();
        }
      }
    }
  } catch (_) { /* never break the caller */ }
}
