// POST /api/exercise/<hub>/<id>/attempt
//
// Records one exercise attempt for the current user. XP is awarded exactly
// once per (user, hub, exercise) via the partial UNIQUE index — see
// _lib/db.ts recordAttempt. Streak is touched only on passing attempts.
//
// Body shape:
//   { passed: bool, hints_used?: int }
// Response:
//   { xp_awarded_now, total_xp, current_streak_days, longest_streak_days,
//     first_pass, streak_freezes, freeze_used_today,
//     nudge?, new_badges? }        <- pass-2 extras, additive + fail-safe:
// grading fields are computed exactly as before; every extra sits behind a
// try/catch (and the daily bonus behind flag:daily-set) so a failure in the
// new code can never affect the graded result.

import type { Env, RequestData } from "../../../../_middleware";
import { json, err401, jsonError } from "../../../../_lib/errors";
import { recordAttempt, isProActive } from "../../../../_lib/db";
import { resolveScope, scopeCovers } from "../../../../_lib/entitlement";
import {
  isValidHubSlug, isValidExerciseId, hubExists, lookupDifficulty,
  xpForDifficulty, isLessonHub,
} from "../../../../_lib/exercises";
import { meterMonth, hubAccess, METER_LIMIT } from "../../../../_lib/meter";
import { checkDailyBonus } from "../../../../_lib/daily";
import {
  BADGE_DEFS, awardBadges, type BadgeCtx,
} from "../../../../_lib/badges";
import { computeTier, parseProfileJson } from "../../../../_lib/profile";
import proLessonsJson from "../../../../_data/pro-lessons.json";

// Lesson hubs share their slug with the lesson page, so the Pro-lesson map
// (slug -> track) is also the Pro-hub map. Attempts on these hubs require an
// entitlement whose scope covers the hub's track; without this, a free
// account could farm XP (and cert credit) from Pro quizzes by POSTing
// directly.
const PRO_HUBS = proLessonsJson as Record<string, string>;

const MAX_HINTS = 10;

const SOLVE_BOUNDARIES = new Set([1, 100, 200, 300]);
const STREAK_BOUNDARIES = new Set([7, 30, 100]);

// Nearest-milestone line for the success toast. Pure function of two counters.
function milestoneNudge(solved: number, streak: number): string | null {
  const nextOf = (v: number, marks: number[]) => marks.find((m) => m > v) ?? null;
  const ns = nextOf(solved, [100, 200, 300]);
  if (ns && ns - solved <= 25) {
    return `${ns - solved} solve${ns - solved === 1 ? "" : "s"} to the ${ns}-solves badge`;
  }
  const nk = nextOf(streak, [7, 30, 100]);
  if (nk && nk - streak <= 3) {
    return `${nk - streak} day${nk - streak === 1 ? "" : "s"} to the ${nk}-day streak badge`;
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

  let body: { passed?: unknown; hints_used?: unknown };
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

  const xpIfFirstPass = xpForDifficulty(difficulty);
  const result = await recordAttempt(
    context.env.DB, u.id, hubSlug, exerciseId, body.passed, hintsUsed, xpIfFirstPass,
  );

  // ---- pass-2 extras: everything below is additive and fail-safe ----
  let nudge: string | null = null;
  let newBadges: Array<{ id: string; name: string }> = [];
  if (body.passed) {
    try {
      const DB = context.env.DB;
      const solvedRow = await DB.prepare(
        "SELECT COUNT(DISTINCT hub_slug || '|' || exercise_id) AS n FROM exercise_attempts " +
        "WHERE user_id = ?1 AND passed = 1"
      ).bind(u.id).first<{ n: number }>();
      const solved = Number(solvedRow?.n ?? 0);
      const streak = result.current_streak_days;

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
    ...result,
    ...(nudge ? { nudge } : {}),
    ...(newBadges.length ? { new_badges: newBadges } : {}),
    ...(meterAfter ? { meter: meterAfter } : {}),
  });
};
