// POST /api/teams/:id/seats   { seats: number, preview?: boolean }
//
// Owner-only self-serve seat changes.
// - Increases apply immediately with proration (prorated_immediately) via the
//   Paddle API; orgs.seats_purchased is updated optimistically and the
//   subscription.updated webhook reconciles it (Paddle stays source of truth).
// - preview:true returns Paddle's proration preview (charge now + new recurring
//   total) without applying anything.
// - Decreases are RENEWAL-ONLY by policy: rejected here with `renewal_only`; the
//   owner reduces at renewal through the billing portal. Never below max(5, assigned).

import type { Env, RequestData } from "../../../_middleware";
import { json, jsonError, err401, err403, err404 } from "../../../_lib/errors";
import { getOrgById, getMemberRole, countAssignedSeats, MIN_TEAM_SEATS } from "../../../_lib/teams";
import { updateSubscriptionSeats } from "../../../_lib/paddle";

const MAX_TEAM_SEATS = 100;

export const onRequestPost: PagesFunction<Env, string, RequestData> = async (context) => {
  const u = context.data.user;
  if (!u) return err401();
  const orgId = context.params.id as string;
  const db = context.env.DB;
  const now = Math.floor(Date.now() / 1000);

  const org = await getOrgById(db, orgId);
  if (!org) return err404("Team not found.");
  const role = await getMemberRole(db, orgId, u.id);
  if (role !== "owner") return err403("Only the billing owner can change seats.");
  if (org.status !== "active") return err403("This team's subscription is not active.");

  let body: { seats?: unknown; preview?: unknown };
  try {
    body = (await context.request.json()) as typeof body;
  } catch {
    return jsonError(400, "bad_request", "Invalid JSON body");
  }
  const seats = typeof body.seats === "number" && Number.isInteger(body.seats) ? body.seats : NaN;
  const preview = body.preview === true;
  if (!Number.isFinite(seats)) return jsonError(400, "bad_request", "seats must be an integer.");
  if (seats < MIN_TEAM_SEATS || seats > MAX_TEAM_SEATS) {
    return jsonError(400, "out_of_range", `Teams are ${MIN_TEAM_SEATS} to ${MAX_TEAM_SEATS} seats.`);
  }

  const assigned = await countAssignedSeats(db, orgId, now);
  if (seats < org.seats_purchased) {
    // Renewal-only reductions; also communicates the floor so the UI can explain.
    return jsonError(400, "renewal_only",
      "Seat reductions apply at renewal. Reduce seats from the billing portal; you can never go below your assigned seats.",
      { current: org.seats_purchased, assigned });
  }
  if (seats === org.seats_purchased) {
    return json({ ok: true, unchanged: true, seats: org.seats_purchased });
  }

  const priceId = context.env.PADDLE_TEAMS_PRICE_ID;
  if (!org.paddle_subscription_id || !priceId) {
    return jsonError(409, "not_available",
      "Self-serve seat changes are not available for this team yet. Email support@r-statistics.co.");
  }

  const result = await updateSubscriptionSeats(
    context.env, org.paddle_subscription_id, priceId, seats, preview,
  );
  if (!result.ok) {
    return jsonError(502, "paddle_error",
      "Could not reach billing to update seats. Try again, or use the billing portal.");
  }

  if (preview) {
    // Surface only what the UI needs from the preview payload.
    const d = result.data as {
      immediate_transaction?: { details?: { totals?: { grand_total?: string; currency_code?: string } } };
      recurring_transaction_details?: { totals?: { grand_total?: string; currency_code?: string } };
    } | null;
    return json({
      ok: true,
      preview: true,
      seats,
      charge_now: d?.immediate_transaction?.details?.totals?.grand_total ?? null,
      recurring_total: d?.recurring_transaction_details?.totals?.grand_total ?? null,
      currency: d?.immediate_transaction?.details?.totals?.currency_code
        ?? d?.recurring_transaction_details?.totals?.currency_code ?? "USD",
    });
  }

  // Applied: reflect immediately; the subscription.updated webhook reconciles.
  await db
    .prepare("UPDATE orgs SET seats_purchased = ?, updated_at = ? WHERE id = ?")
    .bind(seats, now, orgId)
    .run();
  await db
    .prepare("INSERT INTO audit_log (user_id, actor, action, ref, meta_json, at) VALUES (?, 'user', 'team.seats.update', ?, ?, ?)")
    .bind(u.id, orgId, JSON.stringify({ from: org.seats_purchased, to: seats }), now)
    .run()
    .catch(() => {});

  return json({ ok: true, seats, previous: org.seats_purchased });
};
