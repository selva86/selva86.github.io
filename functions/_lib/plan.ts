// What plan a member holds, in the shape the pricing page needs to describe
// it back to them ("Your plan", renewal date, upgrade paths). Read-only view
// composed from the entitlement resolver, the subscriptions mirror, the
// KV track scope, and the org tables. Never used for gating: entitlement.ts
// stays the authority on what a user can open.

import type { Entitlement } from "./entitlement";
import { getOrgById, countAssignedSeats } from "./teams";
import type { User } from "./db";

export interface PlanInfo {
  kind: "free" | "single" | "allaccess" | "lifetime" | "team";
  track: string | null;        // roadmap track key for Single Track
  term: "month" | "year" | null;
  renews_at: number | null;    // unix; the current period end for subscriptions
  will_renew: boolean;         // false when a cancel is scheduled
  sub_id: string | null;       // paddle sub_ id, for upgrades
  team: { org_id: string; name: string; role: string; seats: number; seats_used: number; current_period_end: number | null } | null;
}

interface SubRow {
  external_id: string;
  plan: string;
  status: string;
  current_period_end: number | null;
  cancel_at_period_end: number | null;
}

export async function activeIndividualSub(db: D1Database, userId: string): Promise<SubRow | null> {
  return await db
    .prepare(
      `SELECT external_id, plan, status, current_period_end, cancel_at_period_end
         FROM subscriptions
        WHERE provider = 'paddle' AND user_id = ? AND external_id LIKE 'sub_%'
          AND status IN ('active', 'trialing', 'past_due')
        ORDER BY updated_at DESC LIMIT 1`,
    )
    .bind(userId)
    .first<SubRow>()
    .catch(() => null);
}

export async function describePlan(
  env: { DB: D1Database; KV: KVNamespace },
  u: User,
  ent: Entitlement,
): Promise<PlanInfo> {
  const none: PlanInfo = { kind: "free", track: null, term: null, renews_at: null, will_renew: false, sub_id: null, team: null };
  if (!ent.pro) return none;

  if (ent.source === "lifetime") return { ...none, kind: "lifetime" };

  if (ent.source === "team" && ent.team) {
    const org = await getOrgById(env.DB, ent.team.org_id).catch(() => null);
    const used = org ? await countAssignedSeats(env.DB, org.id).catch(() => 0) : 0;
    return {
      ...none,
      kind: "team",
      renews_at: ent.team.current_period_end,
      will_renew: true,
      team: {
        org_id: ent.team.org_id,
        name: org?.name || "your team",
        role: ent.team.role,
        seats: org?.seats_purchased || 0,
        seats_used: used,
        current_period_end: ent.team.current_period_end,
      },
    };
  }

  // Individual subscription (Single Track / All-Access). The mirror row is
  // the source for term + renewal; the KV scope says which track a Single
  // plan covers (absent = unscoped, which the resolver treats as all).
  const sub = await activeIndividualSub(env.DB, u.id);
  const plan = sub?.plan || "";
  const isSingle = plan.startsWith("single");
  const term: PlanInfo["term"] = plan.endsWith("_month") ? "month" : plan ? "year" : null;
  const track = isSingle ? await env.KV.get(`tracks:${u.id}`).catch(() => null) : null;
  return {
    ...none,
    kind: isSingle ? "single" : "allaccess",
    track: track || null,
    term,
    renews_at: sub?.current_period_end ?? ent.pro_until,
    will_renew: sub ? !sub.cancel_at_period_end && sub.status !== "canceled" : false,
    sub_id: sub?.external_id || null,
  };
}
