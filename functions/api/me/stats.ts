// GET /api/me/stats
//
// Single endpoint returning the running XP + streak totals used by:
//   - auth-hydrate.js avatar dropdown ("⚡ N XP", "🔥 N day streak")
//   - the future dashboard (Phase 1.7 / post-Phase-3)
//
// One endpoint instead of two separate XP + streak calls because both come
// from the same `users` row — single query, one round-trip.

import type { Env, RequestData } from "../../_middleware";
import { json, err401 } from "../../_lib/errors";
import { getStats } from "../../_lib/db";

export const onRequestGet: PagesFunction<Env, string, RequestData> = async (context) => {
  const u = context.data.user;
  if (!u) return err401();

  const stats = await getStats(context.env.DB, u.id);
  return json({
    total_xp: stats.total_xp,
    current_streak_days: stats.current_streak_days,
    longest_streak_days: stats.longest_streak_days,
    last_active_date: stats.last_active_date,
  });
};
