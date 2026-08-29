// GET /api/price-alert/stop?a=<alert id>&t=<hmac> - one-click "no more
// discount emails" for the alert flow (works for anonymous rows too, which
// the account-keyed /api/email/unsubscribe cannot cover). Marks the row
// unsubscribed; a signed-in account also loses email_offers consent.

import type { Env, RequestData } from "../../_middleware";
import { verifyAlertSig, type AlertEnv } from "../../_lib/pricealerts";

export const onRequestGet: PagesFunction<Env & AlertEnv, string, RequestData> = async (context) => {
  const p = new URL(context.request.url).searchParams;
  const id = parseInt(p.get("a") || "", 10);
  const t = p.get("t") || "";
  let ok = false;
  try {
    if (Number.isFinite(id) && (await verifyAlertSig(context.env, id, t))) {
      const now = Math.floor(Date.now() / 1000);
      const row = await context.env.DB.prepare("SELECT user_id, email FROM price_alerts WHERE id = ?1").bind(id)
        .first<{ user_id: string | null; email: string }>();
      if (row) {
        await context.env.DB.prepare("UPDATE price_alerts SET unsubscribed_at = ?1 WHERE id = ?2").bind(now, id).run();
        if (row.user_id) {
          await context.env.DB.prepare("UPDATE users SET email_offers = 0 WHERE id = ?1").bind(row.user_id).run();
        }
        await context.env.DB.prepare(
          "INSERT INTO email_events (user_id, email, email_key, event, at, meta) VALUES (?1, ?2, 'alert-flow', 'unsubscribe', ?3, 'price-alert stop link')",
        ).bind(row.user_id || `pa:${id}`, row.email, now).run();
        ok = true;
      }
    }
  } catch { /* fall through to the page */ }
  return new Response(null, {
    status: 302,
    headers: { Location: `/email-thanks.html?t=${ok ? "stopped" : "invalid"}`, "Cache-Control": "private, no-store" },
  });
};
