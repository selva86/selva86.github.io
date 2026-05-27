// POST /api/me/sessions-revoke-all
//
// Revokes EVERY active session for the current user (including the current
// one) AND calls Supabase admin signOut with scope='global' to invalidate
// the user's refresh tokens server-side. After this, the current device's
// JWT is dead immediately at our edge (KV revoke) and refresh tokens are
// dead at Supabase, so re-auth is required everywhere.

import type { Env, RequestData } from "../../_middleware";
import { json, err401 } from "../../_lib/errors";
import { revokeAllSessions } from "../../_lib/db";

export const onRequestPost: PagesFunction<Env, string, RequestData> = async (context) => {
  const u = context.data.user;
  if (!u) return err401();

  // 1. KV + D1 revocation for every session.
  const count = await revokeAllSessions(context.env.DB, context.env.KV, u.id);

  // 2. Supabase admin signOut (global). Best-effort: if it fails (network,
  //    rate limit, etc.) the local revoke still effectively logs them out at
  //    our edge. Refresh tokens remain valid until Supabase processes the
  //    sign-out, but our middleware rejects the JWT regardless.
  try {
    const url = `${context.env.SUPABASE_URL.replace(/\/$/, "")}/auth/v1/admin/users/${u.id}/logout`;
    await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${context.env.SUPABASE_SERVICE_ROLE_KEY}`,
        "apikey": context.env.SUPABASE_SERVICE_ROLE_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ scope: "global" }),
    });
  } catch (e) {
    console.warn("[sessions] Supabase admin signOut failed:", (e as Error).message);
  }

  return json({ revoked: true, count });
};
