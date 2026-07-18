// POST /api/teams/:id/transfer   { user_id }
//
// Current owner hands billing ownership to an active member. The old owner
// stays on the team as an admin (their seat is untouched). Required before the
// owner can ever leave or delete their account, so teams are never orphaned.
// Note: the Paddle customer on the subscription is unchanged; billing-portal
// access follows owner_user_id, and the card on file can be changed there.

import type { Env, RequestData } from "../../../_middleware";
import { json, jsonError, err401, err403, err404 } from "../../../_lib/errors";
import { getOrgById, getMemberRole, transferOwnership } from "../../../_lib/teams";

export const onRequestPost: PagesFunction<Env, string, RequestData> = async (context) => {
  const u = context.data.user;
  if (!u) return err401();
  const orgId = context.params.id as string;
  const db = context.env.DB;
  const now = Math.floor(Date.now() / 1000);

  const org = await getOrgById(db, orgId);
  if (!org) return err404("Team not found.");
  const role = await getMemberRole(db, orgId, u.id);
  if (role !== "owner") return err403("Only the current owner can transfer ownership.");

  let body: { user_id?: unknown };
  try {
    body = (await context.request.json()) as typeof body;
  } catch {
    return jsonError(400, "bad_request", "Invalid JSON body");
  }
  const target = typeof body.user_id === "string" ? body.user_id.trim() : "";
  if (!target) return jsonError(400, "bad_request", "user_id required.");

  const result = await transferOwnership(db, orgId, u.id, target);
  if (!result.ok) {
    const msg = result.reason === "not_a_member"
      ? "The new owner must be an active member of the team."
      : "You already own this team.";
    return jsonError(400, result.reason, msg);
  }

  await db
    .prepare("INSERT INTO audit_log (user_id, actor, action, ref, meta_json, at) VALUES (?, 'user', 'team.transfer', ?, ?, ?)")
    .bind(u.id, orgId, JSON.stringify({ to: target }), now)
    .run()
    .catch(() => {});

  return json({ ok: true, new_owner: target });
};
