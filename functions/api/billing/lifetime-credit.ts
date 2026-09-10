// POST /api/billing/lifetime-credit
//
// For a member on an annual or monthly plan who wants Lifetime: works out the
// value of the unused part of their current billing period from the live
// Paddle subscription, mints a one-use flat discount for exactly that amount
// (restricted to the Lifetime price, 48h validity), and returns the code so
// the pricing page can open checkout with it applied. The annual plan is
// cancelled by the webhook when the Lifetime payment lands.
//
// { code: null, credit: 0 } when there is nothing to credit (no active
// subscription, or under one unit of currency left).

import type { Env, RequestData } from "../../_middleware";
import { json, jsonError, err401 } from "../../_lib/errors";
import { activeIndividualSub } from "../../_lib/plan";
import { getSubscription, createFlatDiscount } from "../../_lib/paddle";

function code(): string {
  const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const b = new Uint8Array(8);
  crypto.getRandomValues(b);
  let s = "LIFE";
  for (const x of b) s += a[x % a.length];
  return s;
}

export const onRequestPost: PagesFunction<Env, string, RequestData> = async (context) => {
  const u = context.data.user;
  if (!u) return err401();
  const lifetimePrice = context.env.PADDLE_PRICE_LIFETIME;
  if (!lifetimePrice) return jsonError(503, "not_configured", "Lifetime is not available yet.");

  const sub = await activeIndividualSub(context.env.DB, u.id);
  if (!sub) return json({ code: null, credit: 0 });

  // One code per member per day; re-issuing on every click would litter the
  // Paddle discount list and each code is single-use anyway.
  const kvKey = `lifecredit:${u.id}`;
  const cached = await context.env.KV.get(kvKey, "json").catch(() => null) as { code: string; credit: number; currency: string } | null;
  if (cached?.code) return json({ ...cached, reused: true });

  const live = await getSubscription(context.env, sub.external_id);
  const item = live?.items?.[0];
  const period = live?.current_billing_period;
  if (!live || live.status === "canceled" || !item || !period) return json({ code: null, credit: 0 });

  const paid = parseInt(item.price.unit_price.amount, 10) * (item.quantity || 1);
  const start = Date.parse(period.starts_at) / 1000, end = Date.parse(period.ends_at) / 1000;
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(paid) || !(end > start) || now >= end) return json({ code: null, credit: 0 });
  const credit = Math.floor(paid * ((end - now) / (end - start)));
  const currency = item.price.unit_price.currency_code || live.currency_code;
  if (credit < 100) return json({ code: null, credit: 0 });

  const c = code();
  const ok = await createFlatDiscount(context.env, {
    code: c,
    amount: credit,
    currency,
    expiresAt: now + 48 * 3600,
    priceIds: [lifetimePrice],
    description: `Lifetime credit: unused ${sub.plan} time for user ${u.id} (sub ${sub.external_id})`,
  });
  if (!ok) return jsonError(502, "paddle_error", "Could not prepare your credit. Nothing was charged.");
  const out = { code: c, credit, currency, ends_at: end };
  await context.env.KV.put(kvKey, JSON.stringify(out), { expirationTtl: 24 * 3600 }).catch(() => undefined);
  return json(out);
};
