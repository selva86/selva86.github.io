// GET /api/teams/:id/portal
//
// Returns a Paddle customer-portal URL for the billing owner to manage their
// card, invoices, and subscription (add/remove seats, cancel). Owner-only.
// Degrades to { url: null } if Paddle can't mint a session, so the UI can fall
// back to a "contact support" message rather than erroring.

import type { Env, RequestData } from "../../../_middleware";
import { json, err401, err403, err404 } from "../../../_lib/errors";
import { getOrgById, getMemberRole } from "../../../_lib/teams";
import { createPortalSession } from "../../../_lib/paddle";

export const onRequestGet: PagesFunction<Env, string, RequestData> = async (context) => {
  const u = context.data.user;
  if (!u) return err401();
  const orgId = context.params.id as string;
  const db = context.env.DB;

  const org = await getOrgById(db, orgId);
  if (!org) return err404("Team not found.");
  const role = await getMemberRole(db, orgId, u.id);
  if (role !== "owner") return err403("Only the billing owner can open the billing portal.");
  if (!org.paddle_customer_id) return json({ url: null, reason: "no_customer" });

  const url = await createPortalSession(
    context.env,
    org.paddle_customer_id,
    org.paddle_subscription_id ? [org.paddle_subscription_id] : [],
  );
  return json({ url });
};
