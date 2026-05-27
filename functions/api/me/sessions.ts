// GET /api/me/sessions
//
// Returns the current user's active sessions with device label + last seen.
// The "current" flag is set on the row matching the requesting JWT's
// session_id so the UI can highlight "this device".
//
// Strictly filtered by user_id (defensive against cross-user enumeration).

import type { Env, RequestData } from "../../_middleware";
import { json, err401 } from "../../_lib/errors";
import { getActiveSessions } from "../../_lib/db";

export const onRequestGet: PagesFunction<Env, string, RequestData> = async (context) => {
  const u = context.data.user;
  if (!u) return err401();

  const sessions = await getActiveSessions(context.env.DB, u.id);
  const currentSid = context.data.session_id;
  return json({
    sessions: sessions.map(s => ({
      session_id: s.session_id,
      device: s.device || "Unknown device",
      created_at: s.created_at,
      last_seen_at: s.last_seen_at,
      expires_at: s.expires_at,
      current: s.session_id === currentSid,
    })),
  });
};
