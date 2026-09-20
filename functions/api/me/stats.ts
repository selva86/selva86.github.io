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

  /* How the 312 were solved, not just that there were 312.
   *
   * The rule matches starsFor() in _lib/exercises.ts: a backfilled row is
   * unrated rather than flawless, reading the solution is zero whatever the
   * hint count, and otherwise hints decide. Kept in SQL as one pass over the
   * same rows the count already reads. */
  const q = await DB.prepare(
    `SELECT COUNT(*) AS solved,
            SUM(CASE WHEN COALESCE(source,'') = 'backfill' THEN 1 ELSE 0 END) AS unrated,
            SUM(CASE WHEN COALESCE(source,'') != 'backfill'
                      AND COALESCE(solution_seen,0) = 0
                      AND COALESCE(hints_used,0) = 0 THEN 1 ELSE 0 END) AS unaided,
            SUM(CASE WHEN COALESCE(source,'') != 'backfill'
                      AND COALESCE(solution_seen,0) = 0
                      AND COALESCE(hints_used,0) >= 1 THEN 1 ELSE 0 END) AS hinted,
            SUM(CASE WHEN COALESCE(source,'') != 'backfill'
                      AND COALESCE(solution_seen,0) = 1 THEN 1 ELSE 0 END) AS seen
       FROM exercise_attempts WHERE user_id = ?1 AND passed = 1`,
  ).bind(u.id).first<{ solved: number; unrated: number; unaided: number; hinted: number; seen: number }>()
    .catch(() => null);

  /* Fifty-two weeks, dense.
   *
   * Bucketed here from day counts rather than by strftime('%W') so the
   * client gets a fixed 52-length array and never has to reimplement
   * SQLite's week numbering to line the cells up. Index 0 is the oldest
   * week, 51 is the one running now. The 90-day `days` series below is
   * untouched: the greeting sparkline, the week bars and the recap all read
   * it, and this is 52 numbers beside it, not a bigger version of it. */
  const WEEKS = 52;
  const yearFrom = Math.floor(Date.now() / 1000) - WEEKS * 7 * 86400;
  const yearRows = (await DB.prepare(
    `SELECT date(submitted_at, 'unixepoch') AS d, COUNT(*) AS n
       FROM exercise_attempts
      WHERE user_id = ?1 AND passed = 1 AND submitted_at >= ?2
      GROUP BY d`,
  ).bind(u.id, yearFrom).all<{ d: string; n: number }>().catch(() => ({ results: [] })))
    .results ?? [];

  const weeks = new Array<number>(WEEKS).fill(0);
  let activeYear = 0;
  const todayMs = Date.now();
  for (const r of yearRows) {
    const t = Date.parse(r.d + "T00:00:00Z");
    if (!Number.isFinite(t)) continue;
    const daysAgo = Math.floor((todayMs - t) / 86400000);
    const idx = WEEKS - 1 - Math.floor(daysAgo / 7);
    if (idx >= 0 && idx < WEEKS) weeks[idx] += Number(r.n || 0);
    if (Number(r.n || 0) > 0) activeYear++;
  }

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
    solved: Number(q?.solved ?? 0),
    quality: {
      unaided: Number(q?.unaided ?? 0),
      hinted: Number(q?.hinted ?? 0),
      seen: Number(q?.seen ?? 0),
      unrated: Number(q?.unrated ?? 0),
    },
    weeks,
    active_days_year: activeYear,
  });
};
