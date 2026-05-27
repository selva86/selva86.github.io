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
//     first_pass }

import type { Env, RequestData } from "../../../../_middleware";
import { json, err401, jsonError } from "../../../../_lib/errors";
import { recordAttempt } from "../../../../_lib/db";
import {
  isValidHubSlug, isValidExerciseId, hubExists, lookupDifficulty,
  xpForDifficulty,
} from "../../../../_lib/exercises";

const MAX_HINTS = 10;

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
  return json(result);
};
