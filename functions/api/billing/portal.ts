// GET /api/billing/portal
//
// Mints a Paddle customer-portal session for the signed-in user and returns
// its URL (the portal is Paddle-hosted: update card, cancel, view invoices).
// The customer id is resolved server-side from the authenticated user row -
// never from client input. Degrades to { url: null } so the UI can fall back
// to a "contact support" message rather than erroring.

import type { Env, RequestData } from "../../_middleware";
import { json, err401 } from "../../_lib/errors";
import { createPortalSession } from "../../_lib/paddle";

export const onRequestGet: PagesFunction<Env, string, RequestData> = async (context) => {
  const u = context.data.user;
  if (!u) return err401();
  const customerId = (u as { paddle_customer_id?: string | null }).paddle_customer_id || null;
  if (!customerId) return json({ url: null, reason: "no_customer" });

  // Deep-link the user's Paddle subscriptions (lifetime rows key on a
  // transaction id, which the portal can't deep-link - filter to sub_ ids).
  const subs = await context.env.DB
    .prepare("SELECT external_id FROM subscriptions WHERE provider = 'paddle' AND user_id = ? AND external_id LIKE 'sub_%'")
    .bind(u.id)
    .all<{ external_id: string }>()
    .catch(() => null);
  const subIds = (subs?.results || []).map((r) => r.external_id);

  const url = await createPortalSession(context.env, customerId, subIds);
  return json({ url, reason: url ? undefined : "portal_unavailable" });
};
