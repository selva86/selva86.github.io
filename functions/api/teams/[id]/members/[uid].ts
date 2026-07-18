// DELETE /api/teams/:id/members/:uid
//
// Owner/admin removes a member, freeing their seat for reassignment. The owner
// can never be removed. Removal is soft (status='removed') so the seat frees but
// history is kept; the member loses Pro entitlement immediately (their seat no
// longer satisfies hasActiveSeat). Their progress/XP/certs are untouched.

import type { Env, RequestData } from "../../../../_middleware";
import { json, jsonError, err401, err403, err404 } from "../../../../_lib/errors";
import { getOrgById, isOrgAdmin, getMemberRole, removeMember, setMemberRole } from "../../../../_lib/teams";

export const onRequestDelete: PagesFunction<Env, string, RequestData> = async (context) => {
  const u = context.data.user;
  if (!u) return err401();
  const orgId = context.params.id as string;
  const targetUserId = context.params.uid as string;
  const db = context.env.DB;
  const now = Math.floor(Date.now() / 1000);

  const org = await getOrgById(db, orgId);
  if (!org) return err404("Team not found.");
  if (!(await isOrgAdmin(db, orgId, u.id))) return err403("Only a team owner or admin can remove members.");

  const targetRole = await getMemberRole(db, orgId, targetUserId);
  if (!targetRole) return err404("Member not found.");
  if (targetRole === "owner") return err403("The team owner cannot be removed. Transfer ownership first.");

  const ok = await removeMember(db, orgId, targetUserId, now);
  if (!ok) return err404("Member not found or already removed.");

  await db
    .prepare("INSERT INTO audit_log (user_id, actor, action, ref, meta_json, at) VALUES (?, 'user', 'team.member.remove', ?, ?, ?)")
    .bind(u.id, orgId, JSON.stringify({ removed_user_id: targetUserId }), now)
    .run()
    .catch(() => {});

  return json({ ok: true, removed_user_id: targetUserId });
};

// POST /api/teams/:id/members/:uid   { role: 'admin' | 'member' }
//
// Owner-only promote/demote between admin and member. Owner-only (not admin)
// so admins cannot demote each other; the owner role itself moves only via
// /transfer.
export const onRequestPost: PagesFunction<Env, string, RequestData> = async (context) => {
  const u = context.data.user;
  if (!u) return err401();
  const orgId = context.params.id as string;
  const targetUserId = context.params.uid as string;
  const db = context.env.DB;
  const now = Math.floor(Date.now() / 1000);

  const org = await getOrgById(db, orgId);
  if (!org) return err404("Team not found.");
  const myRole = await getMemberRole(db, orgId, u.id);
  if (myRole !== "owner") return err403("Only the team owner can change member roles.");

  let body: { role?: unknown };
  try {
    body = (await context.request.json()) as typeof body;
  } catch {
    return jsonError(400, "bad_request", "Invalid JSON body");
  }
  const role = body.role === "admin" || body.role === "member" ? body.role : null;
  if (!role) return jsonError(400, "bad_request", "role must be 'admin' or 'member'.");

  const targetRole = await getMemberRole(db, orgId, targetUserId);
  if (!targetRole) return err404("Member not found.");
  if (targetRole === "owner") return err403("Use ownership transfer to change the owner.");

  const ok = await setMemberRole(db, orgId, targetUserId, role);
  if (!ok) return err404("Member not found or unchanged.");

  await db
    .prepare("INSERT INTO audit_log (user_id, actor, action, ref, meta_json, at) VALUES (?, 'user', 'team.member.role', ?, ?, ?)")
    .bind(u.id, orgId, JSON.stringify({ target: targetUserId, role }), now)
    .run()
    .catch(() => {});

  return json({ ok: true, user_id: targetUserId, role });
};
