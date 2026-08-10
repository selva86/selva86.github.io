// Practice meter rules, shared by the attempt endpoint (enforcement) and
// /api/me/meter (display). One implementation so the pill can never disagree
// with the gate. Spec: Plans/free-user-onboarding-plan.md section 4; behavior
// spec is the approved simulator linked there.
//
// Shown to users as "25 free exercises a month". Enforced as: a started hub is
// fully unlocked for the month (no mid-hub wall, ever), new hubs open while
// under the monthly count, a 2-hub floor so one 50-exercise hub cannot consume
// the whole month, and a max-starts guard so seeding one attempt across many
// hubs cannot bank unlimited unlocks. Lesson hubs never count and never reach
// these rules.

import { isLessonHub } from "./exercises";

export const METER_LIMIT = 25;       // monthly practice attempts that permit starting new hubs
export const METER_FLOOR_HUBS = 2;   // always startable, regardless of count
export const METER_MAX_STARTS = 4;   // hub-starts per month; invisible to honest use

export interface MeterMonth {
  attempts: number;        // practice-hub attempts this UTC calendar month
  startedHubs: string[];   // distinct practice hubs attempted this month
  monthStartSec: number;   // unix seconds, start of current UTC month
  resetsIso: string;       // YYYY-MM-DD of the next reset (1st of next month, UTC)
}

/** One query, grouped by hub; lesson hubs filtered out in JS (the set lives in
 *  the bundled manifest, so SQL cannot see it). Per-user monthly rows are tiny. */
export async function meterMonth(db: D1Database, userId: string): Promise<MeterMonth> {
  const now = new Date();
  const monthStartSec = Math.floor(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1) / 1000,
  );
  const resetsIso = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
  ).toISOString().slice(0, 10);

  // source IS NOT 'backfill': anon-era solves banked at sign-in are on the
  // house - a fresh account reads 25 of 25 and the taster hub is not counted
  // as started. (SQLite IS NOT treats NULL as a plain value, so live attempts,
  // whose source is NULL, are kept.)
  const rows = await db.prepare(
    "SELECT hub_slug, COUNT(*) AS n FROM exercise_attempts " +
    "WHERE user_id = ?1 AND submitted_at >= ?2 AND source IS NOT 'backfill' " +
    "GROUP BY hub_slug",
  ).bind(userId, monthStartSec).all<{ hub_slug: string; n: number }>();

  const practice = (rows.results ?? []).filter((r) => !isLessonHub(r.hub_slug));
  return {
    attempts: practice.reduce((s, r) => s + Number(r.n), 0),
    startedHubs: practice.map((r) => r.hub_slug),
    monthStartSec,
    resetsIso,
  };
}

/** The decision for one hub. `started` = attempted this month (fully unlocked);
 *  `open` = an attempt right now would be allowed. */
export function hubAccess(m: MeterMonth, hubSlug: string): { started: boolean; open: boolean } {
  const started = m.startedHubs.includes(hubSlug);
  const open =
    started ||
    m.startedHubs.length < METER_FLOOR_HUBS ||
    (m.attempts < METER_LIMIT && m.startedHubs.length < METER_MAX_STARTS);
  return { started, open };
}
