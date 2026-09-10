// POST /api/billing/upgrade   body: { preview?: boolean }
//
// Moves a Single Track member to All-Access on the SAME subscription, same
// term, prorated immediately: Paddle charges only the difference for the rest
// of the current period and the renewal date does not move. { preview: true }
// returns the amount that would be charged without changing anything.
//
// Guards: signed-in, holds an active individual Single subscription, and the
// All-Access price for that term is configured. Everything else 4xx.

import type { Env, RequestData } from "../../_middleware";
import { json, jsonError, err401 } from "../../_lib/errors";
import { activeIndividualSub } from "../../_lib/plan";
import { getSubscription, changeSubscriptionPlan } from "../../_lib/paddle";

export const onRequestPost: PagesFunction<Env, string, RequestData> = async (context) => {
  const u = context.data.user;
  if (!u) return err401();
  const origin = context.request.headers.get("Origin");
  if (origin && context.env.SITE_ORIGIN && origin !== context.env.SITE_ORIGIN && !origin.endsWith(".pages.dev")) {
    return jsonError(403, "bad_origin", "Request origin not allowed.");
  }
  let preview = false;
  try { preview = Boolean(((await context.request.json()) as { preview?: boolean })?.preview); } catch { /* empty body */ }

  const sub = await activeIndividualSub(context.env.DB, u.id);
  if (!sub || !sub.plan.startsWith("single")) {
    return jsonError(409, "not_upgradable", "Only Single Track plans can be upgraded here.");
  }
  const term = sub.plan.endsWith("_month") ? "month" : "year";
  const priceId = term === "month" ? context.env.PADDLE_PRICE_AA_MONTH : context.env.PADDLE_PRICE_AA_YEAR;
  if (!priceId) return jsonError(503, "not_configured", "All-Access is not available for this term yet.");

  const live = await getSubscription(context.env, sub.external_id);
  if (!live || live.status === "canceled") return jsonError(409, "not_active", "This subscription is no longer active.");

  const customData = { ...(live.custom_data || {}), user_id: u.id, plan: "allaccess", term };
  const r = await changeSubscriptionPlan(context.env, sub.external_id, priceId, customData, preview);
  if (!r.ok) return jsonError(502, r.error || "paddle_error", "Paddle could not apply the change. Nothing was charged.");

  const d = (r.data || {}) as {
    immediate_transaction?: { details?: { totals?: { grand_total?: string; total?: string; currency_code?: string } } };
    update_summary?: { result?: { action?: string; amount?: string; currency_code?: string } };
    next_billed_at?: string | null;
  };
  const totals = d.immediate_transaction?.details?.totals;
  const result = d.update_summary?.result;
  const amount = (result?.amount ?? totals?.grand_total ?? totals?.total) || null;
  const currency = result?.currency_code || totals?.currency_code || live.currency_code || null;

  if (!preview) {
    // Reflect the change locally right away; the subscription.updated webhook
    // repeats this idempotently and clears the same caches.
    await context.env.DB
      .prepare("UPDATE subscriptions SET plan = ?, updated_at = ? WHERE provider = 'paddle' AND external_id = ?")
      .bind(`allaccess_${term}`, Math.floor(Date.now() / 1000), sub.external_id)
      .run()
      .catch(() => undefined);
    await context.env.KV.delete(`tracks:${u.id}`).catch(() => undefined);
    await context.env.KV.delete(`prolesson:${u.id}`).catch(() => undefined);
  }
  return json({ ok: true, preview, term, amount, currency, renews_at: d.next_billed_at || null });
};
