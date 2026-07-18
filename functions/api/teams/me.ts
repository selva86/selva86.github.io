// GET /api/teams/me
//
// Returns the teams the current user belongs to. For teams they can manage
// (owner/admin) the payload includes the seat roster, pending invites, and seat
// counts. For teams where they're a plain member it returns just enough to show
// "you're on <team>". Signed out -> { teams: [] }.

import type { Env, RequestData } from "../../_middleware";
import { json, err401 } from "../../_lib/errors";
import {
  listActiveMemberships, listActiveMembers, listPendingInvites, countAssignedSeats,
  type Org,
} from "../../_lib/teams";

function orgPublic(org: Org) {
  return {
    id: org.id,
    name: org.name,
    plan: org.plan,
    status: org.status,
    seats_purchased: org.seats_purchased,
    current_period_end: org.current_period_end,
  };
}

export const onRequestGet: PagesFunction<Env, string, RequestData> = async (context) => {
  const u = context.data.user;
  if (!u) return err401();
  const db = context.env.DB;
  const now = Math.floor(Date.now() / 1000);

  // Pre-schema resilience: if the teams columns/tables are not applied to this
  // environment's D1 yet, report "no teams" instead of 500ing. Real teams can
  // only exist after the schema (webhook provisioning requires it), so an
  // empty list is always truthful here.
  let memberships: Awaited<ReturnType<typeof listActiveMemberships>>;
  try {
    memberships = await listActiveMemberships(db, u.id);
  } catch (e) {
    console.warn(`[teams/me] membership query failed (schema not applied?): ${(e as Error).message}`);
    return json({ teams: [] });
  }
  const teams = [];
  for (const { org, role } of memberships) {
    const canManage = role === "owner" || role === "admin";
    if (!canManage) {
      teams.push({ org: orgPublic(org), role, can_manage: false });
      continue;
    }
    const [members, invites, assigned] = await Promise.all([
      listActiveMembers(db, org.id),
      listPendingInvites(db, org.id, now),
      countAssignedSeats(db, org.id, now),
    ]);
    teams.push({
      org: orgPublic(org),
      role,
      can_manage: true,
      seats: {
        total: org.seats_purchased,
        assigned,
        available: Math.max(0, org.seats_purchased - assigned),
      },
      members: members.map((m) => ({
        user_id: m.user_id,
        email: m.email,
        role: m.role,
        joined_at: m.joined_at,
      })),
      // Tokens are never exposed; the roster shows the invited address + expiry.
      invites: invites.map((i) => ({
        email: i.email,
        role: i.role,
        created_at: i.created_at,
        expires_at: i.expires_at,
      })),
    });
  }

  return json({ teams });
};
