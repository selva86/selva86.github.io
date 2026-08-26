// GET /api/me/stats
//
// Single endpoint returning the running XP + streak totals used by:
//   - auth-hydrate.js avatar dropdown ("⚡ N XP", "🔥 N day streak")
//   - the dashboard (hero, week panel, stat-tile sparklines, recap card)
//
// One endpoint instead of two separate XP + streak calls because both come
// from the same `users` row — single query, one round-trip. The dashboard
// redesign (2026-08) added: streak_freezes (banked 0-2, was invisible in the
// UI despite driving the streak mechanics) and `days`, a 90-day daily series
// of xp earned + exercises solved that the client turns into the greeting
// sparkline, the week bars, and the honest weekly recap. Two grouped queries,
// bounded rows (<=180), no per-day round-trips.

import type { Env, RequestData } from "../../_middleware";
import { json, err401 } from "../../_lib/errors";
import { getStats } from "../../_lib/db";

export const onRequestGet: PagesFunction<Env, string, RequestData> = async (context) => {
  const u = context.data.user;
  if (!u) return err401();
  const DB = context.env.DB;

  const stats = await getStats(DB, u.id);

  const fz = await DB
    .prepare("SELECT COALESCE(streak_freezes, 0) AS n FROM users WHERE id = ?")
    .bind(u.id)
    .first<{ n: number }>()
    .catch(() => ({ n: 0 } as { n: number }));

  const since = Math.floor(Date.now() / 1000) - 90 * 86400;
  const xpDays = (await DB.prepare(
    `SELECT date(at, 'unixepoch') AS d, SUM(xp) AS xp
     FROM xp_ledger WHERE user_id = ?1 AND at >= ?2 GROUP BY d`,
  ).bind(u.id, since).all<{ d: string; xp: number }>()).results ?? [];
  const solvedDays = (await DB.prepare(
    `SELECT date(submitted_at, 'unixepoch') AS d, COUNT(*) AS solved
     FROM exercise_attempts WHERE user_id = ?1 AND passed = 1 AND submitted_at >= ?2 GROUP BY d`,
  ).bind(u.id, since).all<{ d: string; solved: number }>()).results ?? [];

  const byDay: Record<string, { d: string; xp: number; solved: number }> = {};
  for (const r of xpDays) byDay[r.d] = { d: r.d, xp: r.xp, solved: 0 };
  for (const r of solvedDays) {
    if (!byDay[r.d]) byDay[r.d] = { d: r.d, xp: 0, solved: 0 };
    byDay[r.d].solved = r.solved;
  }
  const days = Object.values(byDay).sort((a, b) => (a.d < b.d ? -1 : 1));

  return json({
    total_xp: stats.total_xp,
    current_streak_days: stats.current_streak_days,
    longest_streak_days: stats.longest_streak_days,
    last_active_date: stats.last_active_date,
    streak_freezes: Number((fz as { n?: number })?.n ?? 0),
    days,
  });
};
