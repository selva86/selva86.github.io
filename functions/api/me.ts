// GET /api/me
//
// Returns auth + Pro state for the current session. Always 200; { user: null }
// when signed out. The site shell uses this to set body.state-anon vs
// body.state-pro on hydration.
//
// Lazy user-row creation (Phase 1.6):
// If the JWT validates but no D1 user row exists (signup happened before the
// webhook was configured, or the webhook failed silently, or this user
// existed in Supabase before this app), we create the row from JWT claims
// on the fly. /api/me is the natural place because it's the first hit of any
// auth-aware page load.

import type { Env, RequestData } from "../_middleware";
import { json } from "../_lib/errors";
import { getUserById, isProActive, upsertUserFromSupabase, type User } from "../_lib/db";

export const onRequestGet: PagesFunction<Env, string, RequestData> = async (context) => {
  let u = context.data.user;
  const payload = context.data.payload;

  // Lazy-create case: JWT valid (payload set) but no D1 row.
  if (!u && payload?.sub && payload.email) {
    try {
      const meta = (payload.user_metadata ?? {}) as Record<string, unknown>;
      await upsertUserFromSupabase(context.env.DB, {
        id: payload.sub,
        email: payload.email,
        display_name:
          (meta.full_name as string) ||
          (meta.name as string) ||
          payload.email.split("@")[0],
        avatar_url: (meta.avatar_url as string) || undefined,
        country: context.request.headers.get("CF-IPCountry") || undefined,
      });
      u = await getUserById(context.env.DB, payload.sub);
    } catch (e) {
      console.error(`[api/me] lazy-create failed for ${payload.sub}: ${(e as Error).message}`);
      // Fall through and return null rather than 500 — page can still load anon.
    }
  }

  if (!u) return json({ user: null, pro: false });

  return renderMe(u);
};

function renderMe(u: User): Response {
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
}
