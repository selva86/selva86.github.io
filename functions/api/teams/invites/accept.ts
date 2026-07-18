// POST /api/teams/invites/accept   { token }
//
// The invited user accepts their seat. Must be signed in AND signed in as the
// invited email address (leaked-link protection). Single-use: the invite's
// accepted_at is claimed atomically. On success the user immediately has an
// active membership and Pro entitlement (via the seat).

import type { Env, RequestData } from "../../../_middleware";
import { json, jsonError, err401 } from "../../../_lib/errors";
import { acceptInvite, getOrgById } from "../../../_lib/teams";

const REASON_STATUS: Record<string, number> = {
  not_found: 404,
  already_used: 409,
  revoked: 410,
  expired: 410,
  email_mismatch: 403,
  org_inactive: 409,
};

const REASON_MESSAGE: Record<string, string> = {
  not_found: "This invite link is not valid.",
  already_used: "This invite has already been used.",
  revoked: "This invite was cancelled by the team.",
  expired: "This invite has expired. Ask the team to send a new one.",
  email_mismatch: "This invite was sent to a different email. Sign in with the invited address.",
  org_inactive: "This team's subscription is not active.",
};

export const onRequestPost: PagesFunction<Env, string, RequestData> = async (context) => {
  const u = context.data.user;
  if (!u) return err401();

  let body: { token?: unknown };
  try {
    body = (await context.request.json()) as typeof body;
  } catch {
    return jsonError(400, "bad_request", "Invalid JSON body");
  }
  const token = typeof body.token === "string" ? body.token.trim() : "";
  if (!token) return jsonError(400, "bad_request", "Missing token.");

  const now = Math.floor(Date.now() / 1000);
  const result = await acceptInvite(context.env.DB, {
    token, userId: u.id, userEmail: u.email, nowSec: now,
  });

  if (!result.ok) {
    const status = REASON_STATUS[result.reason] ?? 400;
    return jsonError(status, result.reason, REASON_MESSAGE[result.reason] ?? "Could not accept invite.");
  }

  await context.env.DB
    .prepare("INSERT INTO audit_log (user_id, actor, action, ref, at) VALUES (?, 'user', 'team.invite.accept', ?, ?)")
    .bind(u.id, result.orgId, now)
    .run()
    .catch(() => {});

  const org = await getOrgById(context.env.DB, result.orgId);
  return json({ ok: true, org: org ? { id: org.id, name: org.name } : { id: result.orgId } });
};
