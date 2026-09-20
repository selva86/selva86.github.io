// GET /api/me/shelf - the signed-in user's windowed-lesson state: which
// lessons are open right now (their recent seq sends inside the window),
// their sequence position, and (Phase B) badges. Derived entirely from the
// send ledger + registry; no stored unlock state exists anywhere.

import type { Env, RequestData } from "../../_middleware";
import { json, err401 } from "../../_lib/errors";
import { BADGE_DEFS, loadUserBadges, badgeArt, LADDER_MARKS } from "../../_lib/badges";
import miniCoursesJson from "../../_data/mini-courses.json";

interface Mini { window_hours: number; sequence: Array<{ seq: number; kind: string; subject: string; slug?: string | null; course?: string | null }> }
const MINI = miniCoursesJson as unknown as Mini;
const WINDOW_SEC = (MINI.window_hours || 72) * 3600;


/* The milestone ladder for the dashboard.
 *
 * Earned state is read from user_badges, which is the durable record written
 * by awardBadges on solve and on profile view. The "next" rung is computed
 * only over the marks that actually move day to day, the solve counts and the
 * streaks; rungs that depend on profile completeness or quiz scores are
 * reported when earned but never dangled as a target, because their distance
 * is not a number a learner can act on.
 */
/* Derived from the ladder rather than restated here.
 *
 * These were a hand-copied subset and had already fallen behind: the ladder
 * runs to a thousand solves and a full year, and this list stopped at three
 * hundred and at a hundred days, so the four longest rungs could be earned
 * but never dangled. A list that has to be edited in two places to stay true
 * is a list that will be edited in one. */
const SOLVE_MARKS: Array<[string, number]> = LADDER_MARKS.solves.map(
  (n) => [n === LADDER_MARKS.solves[0] ? "first-solve" : `solves-${n}`, n] as [string, number],
);
const STREAK_MARKS: Array<[string, number]> = LADDER_MARKS.streak.map(
  (n) => [`streak-${n}`, n] as [string, number],
);

async function ladderFor(DB: D1Database, userId: string, streakBest: number) {
  const owned = await loadUserBadges(DB, userId);
  const solvedRow = await DB.prepare(
    "SELECT COUNT(*) AS n FROM exercise_attempts WHERE user_id = ?1",
  ).bind(userId).first<{ n: number }>().catch(() => ({ n: 0 } as { n: number }));
  const solved = Number(solvedRow?.n ?? 0);

  const byId = new Map(BADGE_DEFS.map((d) => [d.id, d]));
  const card = (id: string, extra: Record<string, unknown>) => {
    const d = byId.get(id);
    if (!d) return null;
    return { id, name: d.name, blurb: d.blurb, art: badgeArt(d.shape, d.color, d.glyph), ...extra };
  };

  const earned = [...owned.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id, at]) => card(id, { at }))
    .filter(Boolean);

  // the nearest mark still ahead, solve or streak, whichever is closer in kind
  let next = null as unknown;
  const nextSolve = SOLVE_MARKS.find(([id, n]) => !owned.has(id) && solved < n);
  const nextStreak = STREAK_MARKS.find(([id, n]) => !owned.has(id) && streakBest < n);
  if (nextSolve) {
    next = card(nextSolve[0], {
      have: solved, need: nextSolve[1], left: nextSolve[1] - solved, unit: "solves",
    });
  } else if (nextStreak) {
    next = card(nextStreak[0], {
      have: streakBest, need: nextStreak[1], left: nextStreak[1] - streakBest, unit: "days",
    });
  }
  return { earned, next, total: BADGE_DEFS.length, solved };
}

export const onRequestGet: PagesFunction<Env, string, RequestData> = async (context) => {
  const u = context.data.user;
  if (!u) return err401();
  const now = Math.floor(Date.now() / 1000);
  const rows = (await context.env.DB.prepare(
    "SELECT email_key, sent_at FROM sent_emails WHERE user_id = ?1 AND email_key LIKE 'seq:%'",
  ).bind(u.id).all<{ email_key: string; sent_at: number }>()).results ?? [];

  const sent = new Map<number, number>();
  for (const r of rows) {
    const n = parseInt(r.email_key.slice(4), 10);
    if (Number.isFinite(n)) sent.set(n, r.sent_at);
  }
  const open = [];
  for (const it of MINI.sequence) {
    if (it.kind !== "lesson") continue;
    const at = sent.get(it.seq);
    if (at !== undefined && now - at < WINDOW_SEC) {
      open.push({
        seq: it.seq, subject: it.subject, slug: it.slug ?? null,
        course: it.course ?? null, closes_at: at + WINDOW_SEC,
      });
    }
  }
  open.sort((a, b) => b.seq - a.seq);
  const position = rows.length ? Math.max(...[...sent.keys()]) : null;
  const badges = (await context.env.DB.prepare(
    "SELECT badge, public_id, earned_at FROM badges_earned WHERE user_id = ?1 ORDER BY earned_at DESC",
  ).bind(u.id).all<{ badge: string; public_id: string; earned_at: number }>()).results ?? [];
  const streakBest = Math.max(
    Number((u as { longest_streak_days?: number }).longest_streak_days || 0),
    Number((u as { current_streak_days?: number }).current_streak_days || 0),
  );
  const milestones = await ladderFor(context.env.DB, u.id, streakBest)
    .catch(() => null);   // the section disappears, the dashboard does not
  return json({ open, position, badges, milestones });
};
