// GET /api/me/exercises?hub=<slug>
//
// Returns the current user's solved exercise IDs for a single hub so the
// hub page can hydrate its "already solved" checkmarks on auth-hydrated.
// Per-hub instead of all-hubs to keep the payload tiny — a power user can
// have hundreds of solves across hubs but typically <50 per hub.

import type { Env, RequestData } from "../../_middleware";
import { json, err401, jsonError } from "../../_lib/errors";
import { listSolvedInHub } from "../../_lib/db";
import { isValidHubSlug, hubExists, starsFor} from "../../_lib/exercises";

export const onRequestGet: PagesFunction<Env, string, RequestData> = async (context) => {
  const u = context.data.user;
  if (!u) return err401();

  const url = new URL(context.request.url);
  const hub = url.searchParams.get("hub") || "";
  if (!isValidHubSlug(hub)) return jsonError(400, "bad_slug", "Invalid hub slug");
  if (!hubExists(hub)) {
    // Not an error condition — the page may be a non-exercise hub. Return
    // empty list rather than 400 so the client doesn't have to differentiate.
    return json({ hub, solved: [] });
  }

  const solved = await listSolvedInHub(context.env.DB, u.id, hub);

  /* Stars per exercise, alongside the ids rather than instead of them: the
     `solved` array is what exercise-hub.js has always read, and changing its
     shape to carry stars would break every existing caller for a decoration.
     Derived from the same rule the attempt endpoint uses, so the dot on the
     path and the modal after a solve cannot disagree. Backfilled rows come
     back unrated rather than as a flawless run. */
  const stars: Record<string, number> = {};
  try {
    const rows = (await context.env.DB.prepare(
      `SELECT exercise_id, hints_used, solution_seen, source
         FROM exercise_attempts WHERE user_id = ?1 AND hub_slug = ?2`,
    ).bind(u.id, hub).all<{ exercise_id: string; hints_used: number; solution_seen: number; source: string | null }>()).results ?? [];
    for (const r of rows) {
      const v = starsFor(Number(r.hints_used || 0), !!r.solution_seen, r.source);
      if (v !== null) stars[r.exercise_id] = v;
    }
  } catch { /* decoration only: the path still draws solved and unsolved */ }

  return json({ hub, solved, stars });
};
