// POST /api/price-alert  { surface, email? }  -> { ok, sent, already }
//
// The "email me if there is ever a discount" button. Signed-in: the account
// email is used and users.email_offers flips to 1 with an audit_log row (the
// consent the offers category needs). Signed-out: the body carries the email
// the visitor typed. One row per address in price_alerts; the confirmation
// email (with the four one-click intent links) is sent synchronously so the
// UI can truthfully say "sent". Repeat clicks never double-send: an existing
// open row returns already=true.

import type { Env, RequestData } from "../_middleware";
import { json, jsonError } from "../_lib/errors";
import { sendAlertConfirmation, type AlertEnv, type AlertRow } from "../_lib/pricealerts";
import { ensureIntentTable } from "./signal";

const SURFACES = new Set(["pricing", "lesson-locked", "why-pro", "dashboard"]);

function looksLikeEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s) && s.length <= 200;
}

export const onRequestPost: PagesFunction<Env & AlertEnv, string, RequestData> = async (context) => {
  let b: { surface?: unknown; email?: unknown };
  try { b = await context.request.json(); } catch { return jsonError(400, "bad_body", "Invalid JSON"); }
  const u = context.data.user;
  const surface = typeof b.surface === "string" && SURFACES.has(b.surface) ? b.surface : "pricing";
  const typed = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  const email = (u?.email || typed || "").toLowerCase();
  if (!looksLikeEmail(email)) return jsonError(400, "bad_email", "Please enter a valid email address.");

  const now = Math.floor(Date.now() / 1000);
  const country = context.request.headers.get("CF-IPCountry") || "";
  const DB = context.env.DB;

  const existing = await DB.prepare("SELECT * FROM price_alerts WHERE email = ?1").bind(email).first<AlertRow>();
  let row: AlertRow;
  if (existing && !existing.unsubscribed_at && !existing.closed_sent_at && !existing.purchased_at) {
    // Already on the list and the flow is open: no second confirmation.
    if (u && !existing.user_id) {
      await DB.prepare("UPDATE price_alerts SET user_id = ?1 WHERE id = ?2").bind(u.id, existing.id).run();
    }
    return json({ ok: true, sent: false, already: true });
  }
  if (existing) {
    // A closed / expired / unsubscribed row asked again: reopen it fresh.
    await DB.prepare(
      `UPDATE price_alerts SET user_id = COALESCE(?1, user_id), surface = ?2, country = ?3, created_at = ?4,
         intent = NULL, intent_at = NULL, offer_due_at = NULL, offer_sent_at = NULL, offer_code = NULL,
         offer_expires_at = NULL, reminder_sent_at = NULL, last30_sent_at = NULL, closed_sent_at = NULL,
         purchased_at = NULL, unsubscribed_at = NULL
       WHERE id = ?5`,
    ).bind(u?.id ?? null, surface, country, now, existing.id).run();
    row = { ...existing, user_id: u?.id ?? existing.user_id, surface, country, created_at: now,
      intent: null, intent_at: null, offer_due_at: null, offer_sent_at: null, offer_code: null, offer_expires_at: null,
      reminder_sent_at: null, last30_sent_at: null, closed_sent_at: null, purchased_at: null, unsubscribed_at: null };
  } else {
    const ins = await DB.prepare(
      "INSERT INTO price_alerts (user_id, email, surface, country, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
    ).bind(u?.id ?? null, email, surface, country, now).run();
    const id = Number(ins.meta?.last_row_id ?? 0);
    row = { id, user_id: u?.id ?? null, email, surface, country, created_at: now,
      intent: null, intent_at: null, offer_due_at: null, offer_sent_at: null, offer_code: null, offer_expires_at: null,
      reminder_sent_at: null, last30_sent_at: null, closed_sent_at: null, purchased_at: null, unsubscribed_at: null };
  }
  if (u) {
    row.display_name = u.display_name;
    await DB.batch([
      DB.prepare("UPDATE users SET email_offers = 1 WHERE id = ?1").bind(u.id),
      DB.prepare(
        "INSERT INTO audit_log (user_id, actor, action, ref, meta_json, at) VALUES (?1, 'user', 'email_offers_optin', ?2, ?3, ?4)",
      ).bind(u.id, `price-alert:${surface}`, JSON.stringify({ country, email }), now),
    ]);
  }
  // The intent signal feeds the admin hot-leads panel like every other beacon.
  try {
    await ensureIntentTable(DB);
    await DB.prepare(
      "INSERT INTO intent_signals (at, user_id, anon_id, signal, path, meta) VALUES (?1, ?2, NULL, 'price_alert', ?3, ?4)",
    ).bind(now, u?.id ?? null, surface, email).run();
  } catch { /* best effort */ }

  const sent = await sendAlertConfirmation(context.env, row);
  return json({ ok: true, sent, already: false });
};
