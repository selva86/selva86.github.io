// GET /api/me
// Returns auth + Pro state for the current session. Always 200; { user: null } when signed out.
// The site shell uses this to set body.state-anon vs body.state-pro on hydration.

import type { Env, RequestData } from "../_middleware";
import { json } from "../_lib/errors";
import { isProActive } from "../_lib/db";

export const onRequestGet: PagesFunction<Env, string, RequestData> = async (context) => {
  const u = context.data.user;
  if (!u) return json({ user: null, pro: false });

  return json({
    user: {
      id: u.id,
      email: u.email,
      display_name: u.display_name,
      avatar_url: u.avatar_url,
      handle: u.handle,
      total_xp: u.total_xp,
      current_streak_days: u.current_streak_days,
      created_at: u.created_at,
    },
    pro: isProActive(u),
    pro_until: u.pro_until,
  });
};
