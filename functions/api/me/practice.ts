// GET /api/me/practice
//
// One read for the practice surfaces (the navbar Practice menu and /exercises/):
// what a signed-in learner has solved on the PRACTICE hubs, shaped for them.
// Lesson checks share exercise_attempts but are not practice, so they are left out.
//
//   solved  total problems solved on practice hubs
//   hubs    { <hub slug>: solved }
//   diff    { beginner, intermediate, advanced } solved, from the manifest difficulty
//   days    [{ d: "YYYY-MM-DD", n }] solves per UTC day over the last 26 weeks
//   streak  { current, longest } from the users row (same numbers as /api/me/stats)
//   last    { slug, solved, total, at } the most recently practised hub that is
//           not finished yet (where "Continue" and "Resume" lead), or null
//
// Problem totals per hub are catalog data (the page already has them), not here.

import type { Env, RequestData } from "../../_middleware";
import { json, err401 } from "../../_lib/errors";
import { hubExists, hubSize, isLessonHub, lookupDifficulty } from "../../_lib/exercises";
import { getStats } from "../../_lib/db";

const WINDOW_DAYS = 26 * 7;

export const onRequestGet: PagesFunction<Env, string, RequestData> = async (context) => {
  const u = context.data.user;
  if (!u) return err401();
  const DB = context.env.DB;

  const rows = (await DB.prepare(
    `SELECT hub_slug, exercise_id, submitted_at
       FROM exercise_attempts
      WHERE user_id = ?1 AND passed = 1`,
  ).bind(u.id).all<{ hub_slug: string; exercise_id: string; submitted_at: number }>()
    .catch(() => ({ results: [] as { hub_slug: string; exercise_id: string; submitted_at: number }[] })))
    .results ?? [];

  const since = Math.floor(Date.now() / 1000) - (WINDOW_DAYS + 1) * 86400;
  const seen = new Set<string>();
  const hubs: Record<string, number> = {};
  const lastAt: Record<string, number> = {};
  const diff = { beginner: 0, intermediate: 0, advanced: 0 };
  const byDay: Record<string, number> = {};
  let solved = 0;

  for (const r of rows) {
    const hub = r.hub_slug;
    if (!hub || isLessonHub(hub) || !hubExists(hub)) continue;
    const key = hub + "\u0000" + r.exercise_id;
    if (seen.has(key)) continue;   // the partial UNIQUE index already guarantees this; belt and braces
    seen.add(key);
    solved++;
    hubs[hub] = (hubs[hub] || 0) + 1;
    const at = Number(r.submitted_at || 0);
    if (at > (lastAt[hub] || 0)) lastAt[hub] = at;
    const d = lookupDifficulty(hub, r.exercise_id);
    if (d === "beginner" || d === "intermediate" || d === "advanced") diff[d]++;
    if (at >= since) {
      const day = new Date(at * 1000).toISOString().slice(0, 10);
      byDay[day] = (byDay[day] || 0) + 1;
    }
  }

  let last: { slug: string; solved: number; total: number; at: number } | null = null;
  for (const slug of Object.keys(lastAt)) {
    const total = hubSize(slug);
    if (hubs[slug] >= total) continue;   // finished hubs are not where anyone "continues"
    if (!last || lastAt[slug] > last.at) last = { slug, solved: hubs[slug], total, at: lastAt[slug] };
  }

  const st = await getStats(DB, u.id).catch(() => null);
  return json({
    solved,
    hubs,
    diff,
    days: Object.keys(byDay).sort().map((d) => ({ d, n: byDay[d] })),
    streak: { current: Number(st?.current_streak_days ?? 0), longest: Number(st?.longest_streak_days ?? 0) },
    last,
  });
};
