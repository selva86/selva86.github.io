// GET /api/email/intent?a=<alert id>&t=<hmac>&w=<today|week|month|someday|renew>
//
// The one-click answer to "when were you hoping to start?" in the price-alert
// confirmation email, and the "tell me next time" link in the close. Records
// the intent and derives offer_due_at (today = the next hourly run, week =
// +24h, month = +21d, someday = +45d, renew = +60d). A first answer wins;
// later clicks on a different option only re-time an offer that has not
// gone out yet. 302s to /email-thanks.html.

import type { Env, RequestData } from "../../_middleware";
import { verifyAlertSig, offerDueAt, type AlertEnv } from "../../_lib/pricealerts";

const WHEN = new Set(["today", "week", "month", "someday", "renew"]);

export const onRequestGet: PagesFunction<Env & AlertEnv, string, RequestData> = async (context) => {
  const p = new URL(context.request.url).searchParams;
  const id = parseInt(p.get("a") || "", 10);
  const t = p.get("t") || "", w = p.get("w") || "";
  let ok = false;
  try {
    if (Number.isFinite(id) && WHEN.has(w) && (await verifyAlertSig(context.env, id, t))) {
      const now = Math.floor(Date.now() / 1000);
      const DB = context.env.DB;
      const row = await DB.prepare("SELECT user_id, email, offer_sent_at, closed_sent_at FROM price_alerts WHERE id = ?1").bind(id)
        .first<{ user_id: string | null; email: string; offer_sent_at: number | null; closed_sent_at: number | null }>();
      if (row) {
        if (w === "renew") {
          // Back on the list for the next occasion: a clean row, due in 60 days.
          await DB.prepare(
            `UPDATE price_alerts SET intent = 'renew', intent_at = ?1, offer_due_at = ?2, created_at = ?1,
               offer_sent_at = NULL, offer_code = NULL, offer_expires_at = NULL, reminder_sent_at = NULL,
               last30_sent_at = NULL, closed_sent_at = NULL, unsubscribed_at = NULL
             WHERE id = ?3`,
          ).bind(now, offerDueAt("renew", now), id).run();
        } else if (!row.offer_sent_at) {
          await DB.prepare(
            "UPDATE price_alerts SET intent = ?1, intent_at = ?2, offer_due_at = ?3 WHERE id = ?4",
          ).bind(w, now, offerDueAt(w, now), id).run();
        }
        await DB.prepare(
          "INSERT INTO email_events (user_id, email, email_key, event, at, meta) VALUES (?1, ?2, 'alert-confirm', 'intent', ?3, ?4)",
        ).bind(row.user_id || `pa:${id}`, row.email, now, w).run();
        ok = true;
      }
    }
  } catch { /* never block the page */ }
  return new Response(null, {
    status: 302,
    headers: { Location: `/email-thanks.html?t=${ok ? "intent" : "invalid"}&w=${encodeURIComponent(w)}`, "Cache-Control": "private, no-store" },
  });
};
