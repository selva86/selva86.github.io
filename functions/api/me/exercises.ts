// GET /api/me/exercises?hub=<slug>
//
// Returns the current user's solved exercise IDs for a single hub so the
// hub page can hydrate its "already solved" checkmarks on auth-hydrated.
// Per-hub instead of all-hubs to keep the payload tiny — a power user can
// have hundreds of solves across hubs but typically <50 per hub.

import type { Env, RequestData } from "../../_middleware";
import { json, err401, jsonError } from "../../_lib/errors";
import { listSolvedInHub } from "../../_lib/db";
import { isValidHubSlug, hubExists } from "../../_lib/exercises";

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
  return json({ hub, solved });
};
