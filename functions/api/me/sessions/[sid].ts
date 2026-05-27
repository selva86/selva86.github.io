// DELETE /api/me/sessions/<sid>
//
// Revokes a single session belonging to the current user. Sets revoked_at in
// D1 and adds revoked:<sid> to KV with TTL = JWT max-lifetime (so any cached
// JWT for that session gets rejected by middleware on its next hit).
//
// If sid matches the requester's current session, the response includes
// `revoked_self: true` so the client knows to redirect to /signin.

import type { Env, RequestData } from "../../../_middleware";
import { json, jsonError, err401 } from "../../../_lib/errors";
import { revokeSession } from "../../../_lib/db";

export const onRequestDelete: PagesFunction<Env, "sid", RequestData> = async (context) => {
  const u = context.data.user;
  if (!u) return err401();
  const sid = decodeURIComponent(context.params.sid as string);
  if (!sid || sid.length > 256) return jsonError(400, "bad_sid", "Invalid session id");

  const ok = await revokeSession(context.env.DB, context.env.KV, u.id, sid);
  if (!ok) return jsonError(404, "not_found", "Session not found or already revoked");

  return json({
    revoked: true,
    session_id: sid,
    revoked_self: sid === context.data.session_id,
  });
};
