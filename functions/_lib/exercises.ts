import { hubExerciseIds } from "./badges-hub";
// Server-side exercise manifest + XP rules.
//
// The manifest is generated at build time by _build/build_exercise_manifest.py
// (scans _posts/*.html for <section class="exercise"> tags) and bundled with
// the function. We import it directly so wrangler ships it inside the Worker
// bundle — no runtime fetch, no cold-start network hop.
//
// Mirrors XP_BY_DIFF from www/exercise-hub.js. Both must stay in sync — the
// learner sees one number predicted in the status bar (computed client-side
// from XP_BY_DIFF) and another awarded by the server; they MUST match.
//
// Server validates every (hub, exercise_id) on attempt against this manifest.
// A tampered client cannot inflate XP because the server looks up the
// difficulty from this map, not from anything the client sent.

import manifestJson from "../_data/exercise-manifest.json";

interface ManifestShape {
  version: number;
  xp_by_difficulty: Record<string, number>;
  hubs: Record<string, Record<string, string>>;
  lesson_hubs?: string[];
}

const manifest = manifestJson as ManifestShape;

// Hubs sourced from _lessons/ (baked in by build_exercise_manifest.py). The
// practice meter must never count these: lesson gated checks post to the same
// attempt endpoint, and metering them would gate the free tracks and the DA
// pass (Plans/free-user-onboarding-plan.md s4 rule 1).
const LESSON_HUBS = new Set<string>(manifest.lesson_hubs ?? []);

export function isLessonHub(hubSlug: string): boolean {
  return LESSON_HUBS.has(hubSlug);
}

export const SLUG_MAX = 200;
export const EXERCISE_ID_MAX = 64;

// Same characters allowed in slugs as /api/save/<slug> and /api/read/<slug>:
// no spaces, no slashes. The /^[A-Za-z0-9._-]+$/ shape is stricter than the
// other endpoints but matches our actual file naming convention; tightens
// the attack surface for free.
const SLUG_RE = /^[A-Za-z0-9._-]+$/;
const EX_ID_RE = /^[A-Za-z0-9._-]+$/;

export function isValidHubSlug(slug: string): boolean {
  if (!slug || slug.length > SLUG_MAX) return false;
  return SLUG_RE.test(slug);
}

export function isValidExerciseId(id: string): boolean {
  if (!id || id.length > EXERCISE_ID_MAX) return false;
  return EX_ID_RE.test(id);
}

export function hubExists(hubSlug: string): boolean {
  return Object.prototype.hasOwnProperty.call(manifest.hubs, hubSlug);
}

// Returns difficulty for a (hub, exercise) pair, or null if unknown.
// Server callers should treat null as "exercise does not exist" → 400.
export function lookupDifficulty(hubSlug: string, exerciseId: string): string | null {
  const hub = manifest.hubs[hubSlug];
  if (!hub) return null;
  const diff = hub[exerciseId];
  return diff || null;
}

// XP for a difficulty. Unknown difficulty falls back to "beginner" — matches
// www/exercise-hub.js xpWeight() fallback so the displayed and awarded XP
// always agree.
/* Stars for one solved exercise.
 *
 * Derived from what the attempt row already records, so there is nothing to
 * keep in sync and nothing to backfill if the rule changes.
 *
 *   read the solution first  -> 0
 *   no hints                 -> 3
 *   one hint                 -> 2
 *   two or more              -> 1
 *
 * Returns null for an unrated attempt. Rows banked at sign-in from the
 * anonymous era carry hints_used = 0 because nothing was tracked then, and
 * rendering those as a flawless run would be a claim the data cannot support.
 */
export const SECTION_CLEAR_XP = 25;

/* The section an exercise belongs to, read off its own id.
 *
 * Ids are <hub>-ex-<section>-<n>, so dplyr-Exercises-in-R-ex-3-7 is section 3.
 * This is why clearing a section needed no new manifest and no new column: the
 * grouping has been sitting in the primary key the whole time.
 * Returns null for any id that does not follow the pattern, which keeps lesson
 * hubs and anything hand-made out of the section machinery rather than
 * guessing a section for them.
 */
export function sectionOf(exerciseId: string): number | null {
  const m = /-ex-(\d+)-\d+$/.exec(exerciseId || "");
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) ? n : null;
}

/* Every exercise id in one section of one hub, in the order the hub lists
   them. Derived from the manifest, so a hub that gains a problem gains it here
   too without anything being re-generated. */
export function sectionExerciseIds(hubSlug: string, section: number): string[] {
  return hubExerciseIds(hubSlug).filter((id) => sectionOf(id) === section);
}

export function starsFor(
  hintsUsed: number,
  solutionSeen: boolean,
  source?: string | null,
): number | null {
  if (source === "backfill") return null;
  if (solutionSeen) return 0;
  return 3 - Math.min(Math.max(0, hintsUsed), 2);
}

/* XP for a first pass, priced by the stars it earned. Three stars is the
   unchanged full award; the rest taper. Never zero: reading the solution and
   then writing the code is still work. */
export function xpForStars(baseXp: number, stars: number | null): number {
  if (stars === null) return baseXp;
  const factor = stars >= 3 ? 1 : stars === 2 ? 0.8 : stars === 1 ? 0.6 : 0.4;
  return Math.max(1, Math.round(baseXp * factor));
}

export function xpForDifficulty(difficulty: string | null | undefined): number {
  const key = String(difficulty || "beginner").toLowerCase();
  return manifest.xp_by_difficulty[key] ?? manifest.xp_by_difficulty.beginner ?? 10;
}

// Convenience: validate + look up XP in one call. Returns null if the
// (hub, exercise) doesn't exist in the manifest.
export function xpForExercise(hubSlug: string, exerciseId: string): number | null {
  const diff = lookupDifficulty(hubSlug, exerciseId);
  if (diff === null) return null;
  return xpForDifficulty(diff);
}

// UTC YYYY-MM-DD for streak day-boundary calculations. Server is the only
// authority on "today" — clients never send a date. Document this in the
// FAQ once the help center exists.
export function utcDay(nowSec?: number): string {
  const d = new Date((nowSec ?? Math.floor(Date.now() / 1000)) * 1000);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// True if `prev` is the UTC day immediately before `today`. Both must be
// YYYY-MM-DD strings.
export function isYesterdayUtc(prev: string, today: string): boolean {
  // Parse via Date.UTC so DST never bites — UTC has no DST.
  const [py, pm, pd] = prev.split("-").map(Number);
  const [ty, tm, td] = today.split("-").map(Number);
  if (!py || !ty) return false;
  const prevMs = Date.UTC(py, pm - 1, pd);
  const todayMs = Date.UTC(ty, tm - 1, td);
  return todayMs - prevMs === 24 * 60 * 60 * 1000;
}
