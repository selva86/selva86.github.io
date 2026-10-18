// GET /api/admin/billing - the money ledger behind the contact centre's
// Money tab: every paying customer, the plan they are on, every charge from
// their first payment through each renewal, and whether the renewals that
// came due actually charged.
//
// Reads payments + subscriptions, which the Paddle webhook keeps current, so
// the tab is live without anything polling Paddle. The logic lives in
// _lib/ledger.ts so the daily digest can read the same figures.

import type { Env, RequestData } from "../../_middleware";
import { json } from "../../_lib/errors";
import { requireAdmin } from "../../_lib/admin-auth";
import { loadLedger } from "../../_lib/ledger";
import { syncPaymentsFromPaddle } from "../../_lib/paddle-sync";

type BillingEnv = Env & { CRON_SECRET?: string; ADMIN_EMAIL?: string; PADDLE_API_KEY?: string };

export const onRequestGet: PagesFunction<BillingEnv, string, RequestData> = async (context) => {
  const gate = await requireAdmin(context);
  if (gate instanceof Response) return gate;
  const led = await loadLedger(context.env.DB);
  return json(led);
};

// POST = reconcile against Paddle, then return the refreshed ledger. This is
// what seeded the table originally and what repairs it if a delivery is ever
// missed. Idempotent, and it never touches entitlement.
export const onRequestPost: PagesFunction<BillingEnv, string, RequestData> = async (context) => {
  const gate = await requireAdmin(context);
  if (gate instanceof Response) return gate;
  const sync = await syncPaymentsFromPaddle(context.env);
  const led = await loadLedger(context.env.DB);
  return json({ ...led, sync });
};
