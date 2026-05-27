// POST /api/exercise/backfill
//
// Migrates anon-era localStorage solves into the user's account on first
// sign-in. The client (www/exercise-hub.js) detects the missing per-user
// backfill flag and POSTs the full localStorage solve set in chunks.
// Idempotent via the partial UNIQUE index on exercise_attempts — replays
// and concurrent calls from two tabs are safe.
//
// Body:
//   { items: [{ hub: string, exercise_id: string }, ...] }   // max 200
// Response:
//   { recorded, skipped_unknown, total_xp_added,
//     total_xp, current_streak_days, longest_streak_days }
//
// Validates every (hub, exercise_id) against the manifest. Unknown pairs
// are silently skipped (counted in `skipped_unknown`) so a stale
// localStorage from a since-deleted exercise doesn't 400 the whole batch.

import type { Env, RequestData } from "../../_middleware";
import { json, err401, jsonError } from "../../_lib/errors";
import { backfillAttempts, getStats } from "../../_lib/db";
import {
  isValidHubSlug, isValidExerciseId, hubExists, lookupDifficulty,
  xpForDifficulty,
} from "../../_lib/exercises";

const MAX_ITEMS = 200;

export const onRequestPost: PagesFunction<Env, string, RequestData> = async (context) => {
  const u = context.data.user;
  if (!u) return err401();

  let body: { items?: unknown };
  try {
    body = await context.request.json();
  } catch {
    return jsonError(400, "bad_body", "Invalid JSON body");
  }
  if (!Array.isArray(body.items)) {
    return jsonError(400, "bad_body", "items must be an array");
  }
  if (body.items.length === 0) {
    // Empty backfill is a legal no-op (e.g., user has no localStorage solves).
    const stats = await getStats(context.env.DB, u.id);
    return json({
      recorded: 0, skipped_unknown: 0, total_xp_added: 0,
      total_xp: stats.total_xp,
      current_streak_days: stats.current_streak_days,
      longest_streak_days: stats.longest_streak_days,
    });
  }
  if (body.items.length > MAX_ITEMS) {
    return jsonError(400, "too_many_items", `Max ${MAX_ITEMS} items per call`);
  }

  const valid: Array<{ hub: string; exercise_id: string; xp: number }> = [];
  let skipped = 0;
  for (const raw of body.items) {
    if (!raw || typeof raw !== "object") { skipped += 1; continue; }
    const item = raw as { hub?: unknown; exercise_id?: unknown };
    const hub = typeof item.hub === "string" ? item.hub : "";
    const exerciseId = typeof item.exercise_id === "string" ? item.exercise_id : "";
    if (!isValidHubSlug(hub) || !isValidExerciseId(exerciseId)) {
      skipped += 1; continue;
    }
    if (!hubExists(hub)) { skipped += 1; continue; }
    const diff = lookupDifficulty(hub, exerciseId);
    if (!diff) { skipped += 1; continue; }
    valid.push({ hub, exercise_id: exerciseId, xp: xpForDifficulty(diff) });
  }

  const result = await backfillAttempts(context.env.DB, u.id, valid);
  const stats = await getStats(context.env.DB, u.id);
  return json({
    recorded: result.recorded,
    skipped_unknown: skipped,
    total_xp_added: result.total_xp_added,
    total_xp: stats.total_xp,
    current_streak_days: stats.current_streak_days,
    longest_streak_days: stats.longest_streak_days,
  });
};
