// Single source of truth for "is this user Pro, and why".
//
// Pro can come from more than one source, and this resolver composes them so new
// sources (team seats now; comps / SSO later) slot in without touching every
// call site. isProActive(user) stays the synchronous individual-scalar check
// (users.pro_until); this async resolver adds the relational team-seat source
// WITHOUT clobbering pro_until, so a user's individual entitlement and their
// team seat never overwrite each other.
//
// Every server-side Pro decision should route through resolvePro (or at least
// treat a team-seat holder as Pro). /api/me and cert minting use it.

import { isProActive, type User } from "./db";
import { getEntitlingOrg, type Org } from "./teams";

export type ProSource = "individual" | "lifetime" | "team" | null;

export interface Entitlement {
  pro: boolean;
  pro_until: number | null;     // when the current entitlement lapses (-1 = lifetime, null = n/a)
  source: ProSource;
  team: {
    org_id: string;
    role: string;               // 'owner' | 'admin' | 'member'
    current_period_end: number | null;
  } | null;
}

export async function resolvePro(
  db: D1Database,
  user: User | null,
  nowSec = Math.floor(Date.now() / 1000),
): Promise<Entitlement> {
  if (!user) return { pro: false, pro_until: null, source: null, team: null };

  // 1. Individual entitlement first (scalar; cheapest, and a paid individual
  //    plan takes precedence as the "source" even if they also hold a seat).
  if (isProActive(user, nowSec)) {
    const source: ProSource = user.pro_until === -1 ? "lifetime" : "individual";
    // Still surface team membership if present (for the dashboard), but Pro is
    // already granted individually.
    const seat = await getEntitlingOrg(db, user.id, nowSec).catch(() => null);
    return {
      pro: true,
      pro_until: user.pro_until,
      source,
      team: seat ? teamBlock(seat.org, seat.role) : null,
    };
  }

  // 2. Team-seat entitlement.
  const seat = await getEntitlingOrg(db, user.id, nowSec).catch(() => null);
  if (seat) {
    return {
      pro: true,
      pro_until: seat.org.current_period_end,
      source: "team",
      team: teamBlock(seat.org, seat.role),
    };
  }

  return { pro: false, pro_until: null, source: null, team: null };
}

function teamBlock(org: Org, role: string): Entitlement["team"] {
  return { org_id: org.id, role, current_period_end: org.current_period_end };
}
