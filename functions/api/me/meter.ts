// GET /api/me/meter[?hub=<slug>]
//
// The display half of the practice meter: what the pill, the wall, the catalog
// badges and the dashboard read. Enforcement lives in the attempt endpoint;
// both sides share _lib/meter.ts, so display and gate cannot disagree.
//
// Response:
//   { metered: false }                       when the flag is off, or the user
//                                            is Pro (nothing to show)
//   { metered: true, limit, used, left,      otherwise; `hub_*` fields only
//     resets, open_hubs, hub_started?,       when ?hub= was passed
//     hub_open? }
//
// `used` can exceed `limit` (started-hub grace); `left` floors at 0. Lesson
// hubs report hub_open: true always - the meter does not exist for them.

import type { Env, RequestData } from "../../_middleware";
import { json, err401, jsonError } from "../../_lib/errors";
import { isProActive } from "../../_lib/db";
import { isValidHubSlug, isLessonHub } from "../../_lib/exercises";
import { meterMonth, hubAccess, METER_LIMIT } from "../../_lib/meter";

export const onRequestGet: PagesFunction<Env, string, RequestData> = async (context) => {
  const u = context.data.user;
  if (!u) return err401();

  const hub = new URL(context.request.url).searchParams.get("hub");
  if (hub && !isValidHubSlug(hub)) return jsonError(400, "bad_slug", "Invalid hub slug");

  const flagOn = (await context.env.KV.get("flag:exercise-meter")) === "on";
  if (!flagOn || isProActive(u)) {
    return json({ metered: false, ...(hub ? { hub_open: true, hub_started: false } : {}) });
  }
  if (hub && isLessonHub(hub)) {
    // Lessons never touch the allowance; tell the client plainly.
    return json({ metered: false, hub_open: true, hub_started: false });
  }

  const m = await meterMonth(context.env.DB, u.id);
  const body: Record<string, unknown> = {
    metered: true,
    limit: METER_LIMIT,
    used: m.attempts,
    left: Math.max(0, METER_LIMIT - m.attempts),
    resets: m.resetsIso,
    open_hubs: m.startedHubs,
  };
  if (hub) {
    const a = hubAccess(m, hub);
    body.hub_started = a.started;
    body.hub_open = a.open;
  }
  return json(body);
};
