// GET /api/me/shelf - the signed-in user's windowed-lesson state: which
// lessons are open right now (their recent seq sends inside the window), which
// ones have closed behind them, their sequence position, and (Phase B) badges.
// Derived entirely from the send ledger + registry; no stored unlock state
// exists anywhere.
//
// WINDOWED LESSONS ONLY. Everything here is keyed on the seq send ledger, which
// exists for the daily emails and nothing else. Track lessons have no rows in
// it and are not reachable from this endpoint.

import type { Env, RequestData } from "../../_middleware";
import { json, err401 } from "../../_lib/errors";
import { BADGE_DEFS, loadUserBadges, badgeArt, LADDER_MARKS } from "../../_lib/badges";
import miniCoursesJson from "../../_data/mini-courses.json";

import manifestJson from "../../_data/exercise-manifest.json";

interface Mini {
  window_hours: number;
  sequence: Array<{ seq: number; kind: string; subject: string; slug?: string | null; course?: string | null }>;
  courses: Record<string, { title: string; parts: Array<{ part: number; slug?: string | null }> }>;
}
const MINI = miniCoursesJson as unknown as Mini;

/* slug -> which course it belongs to and where in it. Built once per isolate. */
const PLACE: Record<string, { course_title: string; part: number; parts: number }> = {};
for (const [, c] of Object.entries(MINI.courses || {})) {
  for (const p of c.parts) {
    if (p.slug) PLACE[p.slug] = { course_title: c.title, part: p.part, parts: c.parts.length };
  }
}
const WINDOW_SEC = (MINI.window_hours || 72) * 3600;
const HUBS = (manifestJson as unknown as { hubs: Record<string, Record<string, string>> }).hubs;

/* Which of these lessons the reader actually finished.
 *
 * Same rule as the mini-course badge (functions/_lib/badges-mini.ts): every
 * gated exercise in the lesson has a passing attempt. Deliberately the same, so
 * the rail and the badge can never tell the reader two different stories. One
 * grouped query rather than one per lesson.
 *
 * A lesson with no gated exercises reports NOT finished here. The badge code
 * counts it as done because it is asking whether a course can be completed;
 * this is asking what this reader did, and "they opened a page" is not an
 * answer we hold. No built windowed lesson is ungated today, so the branch is
 * a guard rather than a behaviour.
 */
async function finishedSlugs(DB: D1Database, userId: string, slugs: string[]): Promise<Set<string>> {
  const out = new Set<string>();
  if (!slugs.length) return out;
  const rows = (await DB.prepare(
    `SELECT hub_slug, COUNT(DISTINCT exercise_id) AS n FROM exercise_attempts
     WHERE user_id = ?1 AND passed = 1 GROUP BY hub_slug`,
  ).bind(userId).all<{ hub_slug: string; n: number }>()).results ?? [];
  const passed = new Map(rows.map((r) => [r.hub_slug, Number(r.n || 0)]));
  for (const slug of slugs) {
    const need = Object.keys(HUBS[slug] || {}).length;
    if (need > 0 && (passed.get(slug) ?? 0) >= need) out.add(slug);
  }
  return out;
}


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
  const closed = [];
  for (const it of MINI.sequence) {
    if (it.kind !== "lesson") continue;
    const at = sent.get(it.seq);
    if (at === undefined) continue;                  // never sent to this reader
    const place = it.slug ? PLACE[it.slug] : undefined;
    const row = {
      seq: it.seq, subject: it.subject, slug: it.slug ?? null,
      course: it.course ?? null, closes_at: at + WINDOW_SEC, sent_at: at,
      course_title: place?.course_title ?? null,
      part: place?.part ?? null, parts: place?.parts ?? null,
    };
    if (now - at < WINDOW_SEC) open.push(row);
    else closed.push(row);
  }
  open.sort((a, b) => a.closes_at - b.closes_at);    // soonest deadline first
  closed.sort((a, b) => b.closes_at - a.closes_at);  // most recently shut first

  // one query for both lists
  const fin = await finishedSlugs(
    context.env.DB, u.id,
    [...open, ...closed].map((r) => r.slug).filter((x): x is string => !!x),
  ).catch(() => new Set<string>());
  const withFin = <T extends { slug: string | null }>(r: T) =>
    ({ ...r, finished: !!(r.slug && fin.has(r.slug)) });
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
  return json({
    open: open.map(withFin),
    closed: closed.map(withFin),
    window_hours: MINI.window_hours || 72,
    position, badges, milestones,
  });
};
