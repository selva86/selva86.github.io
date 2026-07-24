// GET /api/me/daily - the signed-in learner's daily set (profile v3 pass 2).
//
// Three problems picked deterministically per (user, UTC day): one from the
// track they are currently deep in, one from their weakest practiced track,
// one review (something they solved more than 30 days ago). Same inputs,
// same set, all day - the endpoint is pure read; the +15 completion bonus is
// awarded by the attempt flow (flag:daily-set), never here.
//
// Fallbacks guarantee three tasks whenever the catalog allows: a brand-new
// user gets three beginner problems from the Learn R shelf; a user who has
// solved everything in a pool falls through to the global unsolved pool.

import type { Env, RequestData } from "../../_middleware";
import { json, err401, err500 } from "../../_lib/errors";
import manifestJson from "../../_data/exercise-manifest.json";
import hubTracksJson from "../../_data/hub-tracks.json";

const manifest = manifestJson as { hubs: Record<string, Record<string, string>> };
const hubTracks = hubTracksJson as Record<string, string>;

function utcDayStr(sec: number): string {
  return new Date(sec * 1000).toISOString().slice(0, 10);
}

// djb2: stable tiny hash for deterministic picks
function hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h;
}

interface Task {
  hub: string;
  exercise_id: string;
  track: string | null;
  difficulty: string;
  reason: string;
  href: string;
  done: boolean;
}

export const onRequestGet: PagesFunction<Env, string, RequestData> = async (context) => {
  const u = context.data.user;
  if (!u) return err401();
  try {
    const DB = context.env.DB;
    const now = Math.floor(Date.now() / 1000);
    const today = utcDayStr(now);
    const dayStart = Math.floor(Date.parse(today + "T00:00:00Z") / 1000);
    const since30 = now - 30 * 86400;

    const [solvedRows, recentRows, todayRows, bonusRow] = await Promise.all([
      DB.prepare(
        "SELECT hub_slug, exercise_id, MAX(submitted_at) AS last_pass FROM exercise_attempts " +
        "WHERE user_id = ?1 AND passed = 1 GROUP BY hub_slug, exercise_id LIMIT 3000"
      ).bind(u.id).all<{ hub_slug: string; exercise_id: string; last_pass: number }>(),
      DB.prepare(
        "SELECT hub_slug, COUNT(*) AS n FROM exercise_attempts " +
        "WHERE user_id = ?1 AND submitted_at >= ?2 GROUP BY hub_slug ORDER BY n DESC LIMIT 20"
      ).bind(u.id, since30).all<{ hub_slug: string; n: number }>(),
      DB.prepare(
        "SELECT DISTINCT hub_slug, exercise_id FROM exercise_attempts " +
        "WHERE user_id = ?1 AND passed = 1 AND submitted_at >= ?2"
      ).bind(u.id, dayStart).all<{ hub_slug: string; exercise_id: string }>(),
      DB.prepare(
        "SELECT 1 AS x FROM xp_ledger WHERE user_id = ?1 AND action = 'daily.bonus' AND ref = ?2 LIMIT 1"
      ).bind(u.id, today).first<{ x: number }>().catch(() => null),
    ]);

    const solved = new Set((solvedRows.results ?? []).map((r) => r.hub_slug + "|" + r.exercise_id));
    const solvedByTrack = new Map<string, number>();
    for (const r of solvedRows.results ?? []) {
      const t = hubTracks[r.hub_slug];
      if (t) solvedByTrack.set(t, (solvedByTrack.get(t) || 0) + 1);
    }
    const doneToday = new Set((todayRows.results ?? []).map((r) => r.hub_slug + "|" + r.exercise_id));

    // dominant track of the last 30 days
    let dominant: string | null = null;
    {
      const byTrack = new Map<string, number>();
      for (const r of recentRows.results ?? []) {
        const t = hubTracks[r.hub_slug];
        if (t) byTrack.set(t, (byTrack.get(t) || 0) + Number(r.n));
      }
      let best = 0;
      for (const [t, n] of byTrack) if (n > best) { best = n; dominant = t; }
    }
    // weakest practiced track (lowest solved count); null when no history
    let weakest: string | null = null;
    {
      let low = Infinity;
      for (const [t, n] of solvedByTrack) if (n < low) { low = n; weakest = t; }
      if (weakest && weakest === dominant && solvedByTrack.size > 1) {
        let low2 = Infinity; let alt: string | null = null;
        for (const [t, n] of solvedByTrack) if (t !== dominant && n < low2) { low2 = n; alt = t; }
        weakest = alt || weakest;
      }
    }

    const seed = hash(u.id + "|" + today);
    const unsolvedIn = (track: string | null): Array<[string, string, string]> => {
      const pool: Array<[string, string, string]> = [];
      for (const [hub, exs] of Object.entries(manifest.hubs)) {
        if (track && hubTracks[hub] !== track) continue;
        for (const [ex, diff] of Object.entries(exs)) {
          if (!solved.has(hub + "|" + ex)) pool.push([hub, ex, diff]);
        }
        if (pool.length > 800) break;
      }
      return pool;
    };
    const pick = (pool: Array<[string, string, string]>, salt: number) =>
      pool.length ? pool[(seed + salt * 7919) % pool.length] : null;

    const tasks: Task[] = [];
    const used = new Set<string>();
    const push = (t: [string, string, string] | null, track: string | null, reason: string) => {
      if (!t) return false;
      const key = t[0] + "|" + t[1];
      if (used.has(key)) return false;
      used.add(key);
      tasks.push({
        hub: t[0], exercise_id: t[1],
        track: hubTracks[t[0]] || track,
        difficulty: t[2] || "beginner",
        reason,
        href: "/" + t[0] + ".html",
        done: doneToday.has(key),
      });
      return true;
    };

    // task 1: current track (fallback: any unsolved)
    push(pick(unsolvedIn(dominant), 1), dominant, dominant ? "your current track" : "a fresh start")
      || push(pick(unsolvedIn(null), 1), null, "a fresh start");
    // task 2: weakest track (fallbacks: Learn R, then any)
    push(pick(unsolvedIn(weakest && weakest !== dominant ? weakest : null), 2),
         weakest, weakest ? "your weakest track" : "broaden the base")
      || push(pick(unsolvedIn("Learn R"), 2), "Learn R", "broaden the base")
      || push(pick(unsolvedIn(null), 2), null, "broaden the base");
    // task 3: review (solved > 30 days ago); fallback: any unsolved
    {
      const reviewPool: Array<[string, string, string]> = [];
      for (const r of solvedRows.results ?? []) {
        if (Number(r.last_pass) < since30) {
          const diff = manifest.hubs[r.hub_slug]?.[r.exercise_id] || "beginner";
          reviewPool.push([r.hub_slug, r.exercise_id, diff]);
        }
      }
      push(pick(reviewPool, 3), null, "review: keep it sharp")
        || push(pick(unsolvedIn(null), 3), null, "one more for the day");
    }

    const allDone = tasks.length === 3 && tasks.every((t) => t.done);
    return json({
      date: today,
      tasks,
      all_done: allDone,
      bonus_awarded: !!bonusRow,
      bonus_xp: 15,
    });
  } catch (e) {
    return err500(`daily set failed: ${String((e as Error)?.message || e)}`);
  }
};
