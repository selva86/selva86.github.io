// GET /api/me/hubs
//
// One number per hub: how many distinct problems this user has passed in it.
// The practice studio's rail lists every hub on the platform, and without
// this it could only ever show the one the reader is standing in, which makes
// a 143-row list a catalogue rather than a record of their own work.
//
// Deliberately counts and nothing else. The per-exercise detail already has
// an endpoint (/api/me/exercises?hub=), and a reader looking at the rail
// wants "17 of 20 here, nothing yet there", not 397 ids.

import type { Env, RequestData } from "../../_middleware";
import { json, err401 } from "../../_lib/errors";

export const onRequestGet: PagesFunction<Env, string, RequestData> = async (context) => {
  const u = context.data.user;
  if (!u) return err401();

  const out: Record<string, number> = {};
  try {
    const rows = (await context.env.DB.prepare(
      `SELECT hub_slug, COUNT(DISTINCT exercise_id) AS n
         FROM exercise_attempts
        WHERE user_id = ?1 AND passed = 1
        GROUP BY hub_slug`,
    ).bind(u.id).all<{ hub_slug: string; n: number }>()).results ?? [];
    for (const r of rows) {
      if (r.hub_slug) out[r.hub_slug] = Number(r.n || 0);
    }
  } catch {
    /* The rail is a navigation aid before it is a scoreboard: an empty map
       draws every hub, just without the counts. Never fail the request. */
  }

  return json({ hubs: out });
};
