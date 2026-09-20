// POST /api/exercise/<hub>/<id>/attempt
//
// Records one exercise attempt for the current user. XP is awarded exactly
// once per (user, hub, exercise) via the partial UNIQUE index — see
// _lib/db.ts recordAttempt. Streak is touched only on passing attempts.
//
// Body shape:
//   { passed: bool, hints_used?: int, elapsed_ms?: int, solution_seen?: bool }
//     elapsed_ms is the Practice Studio challenge clock, paused time already
//     removed. It is only read when this attempt completes the hub.
// Response:
//   { xp_awarded_now, total_xp, current_streak_days, longest_streak_days,
//     first_pass, streak_freezes, freeze_used_today,
//     nudge?, new_badges?, hub_badge? }  <- extras, additive + fail-safe:
// grading fields are computed exactly as before; every extra sits behind a
// try/catch (and the daily bonus behind flag:daily-set) so a failure in the
// new code can never affect the graded result.

import type { Env, RequestData } from "../../../../_middleware";
import { json, err401, jsonError } from "../../../../_lib/errors";
import { recordAttempt, isProActive } from "../../../../_lib/db";
import { resolveScope, scopeCovers } from "../../../../_lib/entitlement";
import {
  isValidHubSlug, isValidExerciseId, hubExists, lookupDifficulty,
  xpForDifficulty, isLessonHub, starsFor, xpForStars,
  sectionOf, sectionExerciseIds, SECTION_CLEAR_XP,
} from "../../../../_lib/exercises";
import { meterMonth, hubAccess, METER_LIMIT } from "../../../../_lib/meter";
import { checkDailyBonus } from "../../../../_lib/daily";
import {
  BADGE_DEFS, awardBadges, loadBadgeExtras, LADDER_MARKS, type BadgeCtx,
} from "../../../../_lib/badges";
import { hubProgress, mintHubBadge, hubExerciseIds } from "../../../../_lib/badges-hub";
import { computeTier, parseProfileJson } from "../../../../_lib/profile";
import proLessonsJson from "../../../../_data/pro-lessons.json";

// Lesson hubs share their slug with the lesson page, so the Pro-lesson map
// (slug -> track) is also the Pro-hub map. Attempts on these hubs require an
// entitlement whose scope covers the hub's track; without this, a free
// account could farm XP (and cert credit) from Pro quizzes by POSTing
// directly.
const PRO_HUBS = proLessonsJson as Record<string, string>;

const MAX_HINTS = 10;

// Derived from the ladder itself. These used to be literals, so every rung
// added after them was defined, tested, rendered, and never actually awarded
// on a solve: the sweep simply never ran at that count.
const SOLVE_BOUNDARIES = new Set(LADDER_MARKS.solves);
const STREAK_BOUNDARIES = new Set(LADDER_MARKS.streak);

// Nearest-milestone line for the success toast. Names the badge rather than
// repeating the number: "15 solves to Quarter Century" is a thing to want,
// "15 solves to the 25-solves badge" is the number twice.
const BADGE_NAME = new Map(BADGE_DEFS.map((d) => [d.id, d.name]));
const named = (id: string, fallback: string) => BADGE_NAME.get(id) || fallback;

function milestoneNudge(solved: number, streak: number): string | null {
  const nextOf = (v: number, marks: number[]) => marks.find((m) => m > v) ?? null;
  const ns = nextOf(solved, LADDER_MARKS.solves);
  if (ns) {
    const n = ns - solved;
    // the first mark is first-solve, which is not called solves-1
    const id = ns === 1 ? "first-solve" : "solves-" + ns;
    return `${n} solve${n === 1 ? "" : "s"} to ${named(id, ns + " solves")}`;
  }
  const nk = nextOf(streak, LADDER_MARKS.streak);
  if (nk) {
    const d = nk - streak;
    return `${d} day${d === 1 ? "" : "s"} to ${named("streak-" + nk, nk + "-day streak")}`;
  }
  return null;
}

export const onRequestPost: PagesFunction<Env, "hub" | "id", RequestData> = async (context) => {
  const u = context.data.user;
  if (!u) return err401();

  const hubSlug = decodeURIComponent(context.params.hub as string);
  const exerciseId = decodeURIComponent(context.params.id as string);
  if (!isValidHubSlug(hubSlug)) return jsonError(400, "bad_slug", "Invalid hub slug");
  if (!isValidExerciseId(exerciseId)) return jsonError(400, "bad_exercise", "Invalid exercise id");
  if (!hubExists(hubSlug)) return jsonError(400, "bad_slug", "Unknown hub");
  const difficulty = lookupDifficulty(hubSlug, exerciseId);
  if (!difficulty) return jsonError(400, "bad_exercise", "Unknown exercise for this hub");

  if (PRO_HUBS[hubSlug]) {
    const scope = await resolveScope(context.env, u);
    if (!scopeCovers(scope, PRO_HUBS[hubSlug])) {
      return jsonError(402, "pro_required", "This exercise belongs to a Pro lesson");
    }
  }

  // Practice meter. FAILS OPEN: a metering error must never block practice, so
  // everything except the deliberate limit response lives inside the catch.
  // Rules live in _lib/meter.ts, shared with /api/me/meter so the pill can
  // never disagree with this gate.
  let meterAfter: { limit: number; used: number; left: number; hub_open: true } | null = null;
  if (!isLessonHub(hubSlug) && !isProActive(u)) {
    let blocked = false;
    let resetDate = "";
    try {
      if ((await context.env.KV.get("flag:exercise-meter")) === "on") {
        const m = await meterMonth(context.env.DB, u.id);
        if (!hubAccess(m, hubSlug).open) {
          blocked = true;
          resetDate = m.resetsIso;
        } else {
          // Live pill state for the success response: this attempt is about to
          // be recorded, so count it now rather than re-querying afterwards.
          const used = m.attempts + 1;
          meterAfter = {
            limit: METER_LIMIT,
            used,
            left: Math.max(0, METER_LIMIT - used),
            hub_open: true,
          };
        }
      }
    } catch { /* fail open */ }
    if (blocked) {
      return jsonError(
        402, "meter_limit",
        `Monthly free practice limit reached. Resets ${resetDate}. Any hub you have started this month stays open.`,
      );
    }
  }

  let body: { passed?: unknown; hints_used?: unknown; elapsed_ms?: unknown; solution_seen?: unknown };
  try {
    body = await context.request.json();
  } catch {
    return jsonError(400, "bad_body", "Invalid JSON body");
  }
  if (typeof body.passed !== "boolean") {
    return jsonError(400, "bad_body", "passed must be a boolean");
  }
  const hintsUsed =
    typeof body.hints_used === "number" && Number.isFinite(body.hints_used)
      ? Math.max(0, Math.min(MAX_HINTS, Math.round(body.hints_used)))
      : 0;

  // Clock from the studio. Clamped to a day so a stale tab cannot write a
  // nonsense record onto a public badge.
  const elapsedMs =
    typeof body.elapsed_ms === "number" && Number.isFinite(body.elapsed_ms)
      ? Math.max(0, Math.min(86400000, Math.round(body.elapsed_ms)))
      : 0;

  // The solution counts only if it was opened before this pass. Opening it
  // afterwards to compare approaches is good practice and costs nothing: the
  // flag is read at check time and only the first pass is ever recorded.
  const solutionSeen = body.solution_seen === true;
  const stars = starsFor(hintsUsed, solutionSeen, null);
  const xpIfFirstPass = xpForStars(xpForDifficulty(difficulty), stars);
  const result = await recordAttempt(
    context.env.DB, u.id, hubSlug, exerciseId, body.passed, hintsUsed, xpIfFirstPass,
    solutionSeen,
  );

  // ---- pass-2 extras: everything below is additive and fail-safe ----
  let sectionCleared: Record<string, unknown> | null = null;
  let nudge: string | null = null;
  let newBadges: Array<{ id: string; name: string }> = [];
  let hubBadge: Record<string, unknown> | null = null;
  if (body.passed) {
    try {
      const DB = context.env.DB;

      // Hub badge: this attempt may have been the last one outstanding.
      // Cheap to ask (one COUNT) and idempotent to mint, so no extra state.
      if (!isLessonHub(hubSlug)) {
        const prog = await hubProgress(DB, u.id, hubSlug);
        if (prog.complete) {
          const hintRow = await DB.prepare(
            "SELECT COALESCE(SUM(hints_used), 0) AS h FROM exercise_attempts WHERE user_id = ?1 AND hub_slug = ?2",
          ).bind(u.id, hubSlug).first<{ h: number }>().catch(() => ({ h: 0 } as { h: number }));
          const xpTotal = hubExerciseIds(hubSlug)
            .reduce((sum, id) => sum + xpForDifficulty(lookupDifficulty(hubSlug, id)), 0);
          const minted = await mintHubBadge(DB, u.id, hubSlug, {
            elapsed_ms: elapsedMs || undefined,
            hints: Number(hintRow?.h ?? 0),
            xp: xpTotal,
            solved: prog.total,
          });
          if (minted) {
            hubBadge = {
              badge: minted.badge, title: minted.title, public_id: minted.public_id,
              url: `/badge/${minted.public_id}`, earned_at: minted.earned_at,
              newly_minted: minted.newly_minted, record: minted.record,
            };
          }
        }
      }
      const solvedRow = await DB.prepare(
        "SELECT COUNT(DISTINCT hub_slug || '|' || exercise_id) AS n FROM exercise_attempts " +
        "WHERE user_id = ?1 AND passed = 1"
      ).bind(u.id).first<{ n: number }>();
      const solved = Number(solvedRow?.n ?? 0);
      const streak = result.current_streak_days;

      /* Did this solve finish a section?
       *
       * Only ever on a first pass, and only once: the xp_ledger row is the
       * lock. Writing it with INSERT OR IGNORE against a unique ref means two
       * simultaneous solves of the last two problems in a section cannot both
       * claim the bonus. Lesson hubs have no sections and are skipped by
       * sectionOf returning null. Everything here is inside the same
       * fail-safe block as the rest of the extras: a broken bonus must never
       * cost someone their solve. */
      const sec = sectionOf(exerciseId);
      if (result.first_pass && sec !== null && !isLessonHub(hubSlug)) {
        const ids = sectionExerciseIds(hubSlug, sec);
        if (ids.length) {
          const marks = ids.map(() => "?").join(",");
          const done = await DB.prepare(
            `SELECT COUNT(*) AS n FROM exercise_attempts
              WHERE user_id = ?1 AND hub_slug = ?2 AND exercise_id IN (${marks})`,
          ).bind(u.id, hubSlug, ...ids).first<{ n: number }>().catch(() => ({ n: 0 }));
          if (Number(done?.n ?? 0) >= ids.length) {
            const ref = `${hubSlug}#s${sec}`;
            const ins = await DB.prepare(
              `INSERT OR IGNORE INTO xp_ledger (user_id, action, ref, xp, at)
               SELECT ?1, 'section.cleared', ?2, ?3, ?4
                WHERE NOT EXISTS (
                  SELECT 1 FROM xp_ledger
                   WHERE user_id = ?1 AND action = 'section.cleared' AND ref = ?2)`,
            ).bind(u.id, ref, SECTION_CLEAR_XP, Math.floor(Date.now() / 1000)).run()
              .catch(() => null);
            if ((ins?.meta?.changes ?? 0) === 1) {
              await DB.prepare("UPDATE users SET total_xp = total_xp + ? WHERE id = ?")
                .bind(SECTION_CLEAR_XP, u.id).run().catch(() => null);
              sectionCleared = { section: sec, of: ids.length, xp: SECTION_CLEAR_XP };
            }
          }
        }
      }

      nudge = milestoneNudge(solved, streak);

      // full badge sweep only at a boundary crossing (rare)
      if (SOLVE_BOUNDARIES.has(solved) || STREAK_BOUNDARIES.has(streak)) {
        const [certs, quizBest] = await Promise.all([
          DB.prepare(
            "SELECT track_name, issued_at FROM certificates WHERE user_id = ?1 AND status = 'active'"
          ).bind(u.id).all<{ track_name: string; issued_at: number }>()
            .catch(() => ({ results: [] as Array<{ track_name: string; issued_at: number }> })),
          DB.prepare(
            "SELECT COALESCE(MAX(score), 0) AS s FROM quiz_attempts WHERE user_id = ?1 AND passed = 1"
          ).bind(u.id).first<{ s: number }>().catch(() => ({ s: 0 } as { s: number })),
        ]);
        const certList = certs.results ?? [];
        const tier = computeTier(result.total_xp, solved, certList.length);
        const extras = parseProfileJson((u as { profile_json?: string }).profile_json);
        const ctx: BadgeCtx = {
          xp: result.total_xp,
          solved,
          certs: certList,
          streakBest: result.longest_streak_days,
          quizBestScore: Number((quizBest as { s?: number })?.s ?? 0),
          createdAt: u.created_at,
          tierIndex: tier.index,
          activeDays: Math.max(1, streak),
          profileReady: !!(extras.bio && (extras.website || extras.resume || extras.github)),
          ...(await loadBadgeExtras(DB, u.id, (slug) => hubExerciseIds(slug).length)),
        };
        const fresh = await awardBadges(DB, u.id, ctx);
        const names = new Map(BADGE_DEFS.map((d) => [d.id, d.name]));
        newBadges = fresh
          .filter((id) => names.has(id))
          .map((id) => ({ id, name: names.get(id) as string }));
      }

      // daily-set completion bonus, behind its flag
      if ((await context.env.KV.get("flag:daily-set")) === "on") {
        context.waitUntil(checkDailyBonus(DB, u.id).then(() => undefined));
      }
    } catch { /* extras never affect the graded result */ }
  }

  return json({
    stars: body.passed ? stars : null,
    section_cleared: sectionCleared,
    ...result,
    ...(nudge ? { nudge } : {}),
    ...(newBadges.length ? { new_badges: newBadges } : {}),
    ...(hubBadge ? { hub_badge: hubBadge } : {}),
    ...(meterAfter ? { meter: meterAfter } : {}),
  });
};
