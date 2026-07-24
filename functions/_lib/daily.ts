// Daily-set core (profile v3 pass 2). One deterministic selection function
// shared by GET /api/me/daily (display) and the attempt flow's bonus check,
// so the two can never disagree about what today's set is.

import manifestJson from "../_data/exercise-manifest.json";
import hubTracksJson from "../_data/hub-tracks.json";
import proLessonsJson from "../_data/pro-lessons.json";

const manifest = manifestJson as { hubs: Record<string, Record<string, string>> };
const hubTracks = hubTracksJson as Record<string, string>;
// The daily set only ever draws from free hubs: a Pro-walled task would make
// the set uncompletable for a free account (402 on attempt), and the bonus
// unreachable. Pro users lose nothing; the free pool is thousands deep.
const proHubs = proLessonsJson as Record<string, string>;

export const DAILY_BONUS_XP = 15;

function utcDayStr(sec: number): string {
  return new Date(sec * 1000).toISOString().slice(0, 10);
}

// djb2: stable tiny hash for deterministic picks
function hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h;
}

export interface DailyTask {
  hub: string;
  exercise_id: string;
  track: string | null;
  difficulty: string;
  reason: string;
  href: string;
  done: boolean;
}

export interface DailySet {
  date: string;
  tasks: DailyTask[];
  all_done: boolean;
}

export async function computeDailySet(DB: D1Database, userId: string): Promise<DailySet> {
  const now = Math.floor(Date.now() / 1000);
  const today = utcDayStr(now);
  const dayStart = Math.floor(Date.parse(today + "T00:00:00Z") / 1000);
  const since30 = now - 30 * 86400;

  // Every selection input is frozen at UTC day start (attempts made today are
  // excluded from pools, track stats, and recency). Without this, passing a
  // task removes it from the pool and the deterministic pick DRIFTS mid-day:
  // solved tasks vanish from the set instead of flipping to done, and the
  // completion bonus can never fire.
  const [solvedRows, recentRows, todayRows] = await Promise.all([
    DB.prepare(
      "SELECT hub_slug, exercise_id, " +
      "MAX(CASE WHEN submitted_at < ?2 THEN submitted_at END) AS last_before " +
      "FROM exercise_attempts " +
      "WHERE user_id = ?1 AND passed = 1 GROUP BY hub_slug, exercise_id LIMIT 3000"
    ).bind(userId, dayStart).all<{ hub_slug: string; exercise_id: string; last_before: number | null }>(),
    DB.prepare(
      "SELECT hub_slug, COUNT(*) AS n FROM exercise_attempts " +
      "WHERE user_id = ?1 AND submitted_at >= ?2 AND submitted_at < ?3 " +
      "GROUP BY hub_slug ORDER BY n DESC LIMIT 20"
    ).bind(userId, since30, dayStart).all<{ hub_slug: string; n: number }>(),
    DB.prepare(
      "SELECT DISTINCT hub_slug, exercise_id FROM exercise_attempts " +
      "WHERE user_id = ?1 AND passed = 1 AND submitted_at >= ?2"
    ).bind(userId, dayStart).all<{ hub_slug: string; exercise_id: string }>(),
  ]);

  const beforeRows = (solvedRows.results ?? []).filter((r) => r.last_before != null);
  const solved = new Set(beforeRows.map((r) => r.hub_slug + "|" + r.exercise_id));
  const solvedByTrack = new Map<string, number>();
  for (const r of beforeRows) {
    const t = hubTracks[r.hub_slug];
    if (t) solvedByTrack.set(t, (solvedByTrack.get(t) || 0) + 1);
  }
  const doneToday = new Set((todayRows.results ?? []).map((r) => r.hub_slug + "|" + r.exercise_id));

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

  const seed = hash(userId + "|" + today);
  const unsolvedIn = (track: string | null): Array<[string, string, string]> => {
    const pool: Array<[string, string, string]> = [];
    for (const [hub, exs] of Object.entries(manifest.hubs)) {
      if (proHubs[hub]) continue;
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

  const tasks: DailyTask[] = [];
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

  push(pick(unsolvedIn(dominant), 1), dominant, dominant ? "your current track" : "a fresh start")
    || push(pick(unsolvedIn(null), 1), null, "a fresh start");
  push(pick(unsolvedIn(weakest && weakest !== dominant ? weakest : null), 2),
       weakest, weakest ? "your weakest track" : "broaden the base")
    || push(pick(unsolvedIn("Learn R"), 2), "Learn R", "broaden the base")
    || push(pick(unsolvedIn(null), 2), null, "broaden the base");
  {
    const reviewPool: Array<[string, string, string]> = [];
    for (const r of beforeRows) {
      if (proHubs[r.hub_slug]) continue;
      if (Number(r.last_before) < since30) {
        const diff = manifest.hubs[r.hub_slug]?.[r.exercise_id] || "beginner";
        reviewPool.push([r.hub_slug, r.exercise_id, diff]);
      }
    }
    push(pick(reviewPool, 3), null, "review: keep it sharp")
      || push(pick(unsolvedIn(null), 3), null, "one more for the day");
  }

  return {
    date: today,
    tasks,
    all_done: tasks.length === 3 && tasks.every((t) => t.done),
  };
}

// Award the +15 completion bonus exactly once per day, if today's set is
// fully passed. Called from the attempt flow via waitUntil, flag-gated by
// the caller. SELECT-then-insert guard; a perfect race costs one duplicate
// 15 XP row, which the ledger makes visible (accepted risk).
export async function checkDailyBonus(DB: D1Database, userId: string): Promise<boolean> {
  try {
    const set = await computeDailySet(DB, userId);
    if (!set.all_done) return false;
    const existing = await DB.prepare(
      "SELECT 1 AS x FROM xp_ledger WHERE user_id = ?1 AND action = 'daily.bonus' AND ref = ?2 LIMIT 1"
    ).bind(userId, set.date).first<{ x: number }>();
    if (existing) return false;
    const now = Math.floor(Date.now() / 1000);
    await DB.prepare(
      "INSERT INTO xp_ledger (user_id, action, ref, xp, at) VALUES (?1, 'daily.bonus', ?2, ?3, ?4)"
    ).bind(userId, set.date, DAILY_BONUS_XP, now).run();
    await DB.prepare(
      "UPDATE users SET total_xp = total_xp + ?1 WHERE id = ?2"
    ).bind(DAILY_BONUS_XP, userId).run();
    return true;
  } catch {
    return false;
  }
}
