// Badge engine (profile v3 pass 1).
//
// Definitions live here as one const; awards live in D1 user_badges with
// PK(user_id, badge_id), so the lazy sweep (run on profile loads) is
// idempotent and race-safe by construction: INSERT OR IGNORE either lands a
// row once or does nothing. History backfills user by user with no
// migration. Rarity counts are KV-cached and suppressed below 3 holders.

import type { Env } from "../_middleware";

export interface BadgeCtx {
  xp: number;
  solved: number;
  certs: Array<{ track_name: string; issued_at: number }>;
  streakBest: number;
  quizBestScore: number;      // best passed quiz score, 0-100
  createdAt: number;          // unix seconds
  tierIndex: number;          // 0..5 from computeTier
  activeDays: number;         // any-activity days, all loaded history
  profileReady: boolean;      // bio + at least one link set
  // Dimensions beyond volume and consistency. Optional so older call sites
  // still compile; a missing field simply leaves its badges unearned rather
  // than awarding them on a zero.
  hubsDone?: number;          // hubs where every graded exercise is solved
  hubsTouched?: number;       // distinct hubs with at least one solve
  advanced?: number;          // solves worth 50 XP, which is what advanced pays
  unaided?: number;           // solves with no hint opened
}

export interface BadgeDef {
  id: string;
  name: string;
  blurb: string;              // shown under the name when earned
  shape: Cut;
  color: string;              // stroke/fill family
  glyph: string;              // short text drawn in the art
  test: (c: BadgeCtx) => { earned: boolean; progress: number; note: string };
}


/* Every numeric rung, in one place. The attempt handler gates its badge sweep
   on these, so adding a rung above is enough to make it fire; before this the
   trigger was a separate literal and the two drifted the moment anyone added
   a mark. */
export const LADDER_MARKS = {
  solves: [1, 5, 10, 25, 50, 100, 200, 300, 500, 1000],
  streak: [3, 7, 14, 30, 60, 100, 200, 365],
  hubsDone: [1, 3, 5, 10, 25, 50],
  hubsTouched: [5, 10, 25, 50],
  advanced: [10, 25, 50, 100],
  unaided: [10, 50, 100, 250],
};

const EARLY_MEMBER_CUTOFF = 1782585600; // 2026-06-28: the first year of accounts

export const BADGE_DEFS: BadgeDef[] = [
  {
    id: "first-solve", name: "Off the Mark", blurb: "the first graded win",
    shape: "kite", color: "#2056d2", glyph: "1",
    test: (c) => ({ earned: c.solved >= 1, progress: Math.min(1, c.solved), note: "solve any exercise" }),
  },
  {
    id: "first-day", name: "Day One", blurb: "showed up and did the work",
    shape: "kite", color: "#2056d2", glyph: "GO",
    test: (c) => ({ earned: c.activeDays >= 1, progress: Math.min(1, c.activeDays), note: "any graded activity" }),
  },
  {
    id: "profile-ready", name: "Name on the Door", blurb: "bio and a link in place",
    shape: "square", color: "#2056d2", glyph: "ID",
    test: (c) => ({ earned: c.profileReady, progress: c.profileReady ? 1 : 0, note: "add a bio and one link" }),
  },
  {
    id: "streak-7", name: "Seven Straight", blurb: "a full week, every day",
    shape: "hex", color: "#0f7a52", glyph: "7",
    test: (c) => ({ earned: c.streakBest >= 7, progress: Math.min(1, c.streakBest / 7), note: `best so far: ${c.streakBest}` }),
  },
  {
    id: "streak-30", name: "Thirty Straight", blurb: "a month without missing",
    shape: "hex", color: "#0f7a52", glyph: "30",
    test: (c) => ({ earned: c.streakBest >= 30, progress: Math.min(1, c.streakBest / 30), note: `best so far: ${c.streakBest}` }),
  },
  {
    id: "streak-100", name: "The Long Run", blurb: "one hundred straight days",
    shape: "shield", color: "#0f7a52", glyph: "100",
    test: (c) => ({ earned: c.streakBest >= 100, progress: Math.min(1, c.streakBest / 100), note: `best so far: ${c.streakBest}` }),
  },
  {
    id: "solves-5", name: "Off and Running", blurb: "past the first one, and still here",
    shape: "kite", color: "#2056d2", glyph: "5",
    test: (c) => ({ earned: c.solved >= 5, progress: Math.min(1, c.solved / 5), note: `${c.solved} of 5` }),
  },
  {
    id: "solves-10", name: "Double Digits", blurb: "ten problems answered for real",
    shape: "kite", color: "#2056d2", glyph: "10",
    test: (c) => ({ earned: c.solved >= 10, progress: Math.min(1, c.solved / 10), note: `${c.solved} of 10` }),
  },
  {
    id: "solves-25", name: "Quarter Century", blurb: "a habit rather than a try",
    shape: "hex", color: "#0f7a52", glyph: "25",
    test: (c) => ({ earned: c.solved >= 25, progress: Math.min(1, c.solved / 25), note: `${c.solved} of 25` }),
  },
  {
    id: "solves-50", name: "Half Century", blurb: "fifty graded wins",
    shape: "hex", color: "#0f7a52", glyph: "50",
    test: (c) => ({ earned: c.solved >= 50, progress: Math.min(1, c.solved / 50), note: `${c.solved} of 50` }),
  },
  {
    id: "solves-100", name: "Century", blurb: "one hundred graded wins",
    shape: "shield", color: "#a16207", glyph: "100",
    test: (c) => ({ earned: c.solved >= 100, progress: Math.min(1, c.solved / 100), note: `${c.solved} of 100` }),
  },
  {
    id: "solves-200", name: "Double Century", blurb: "two hundred graded wins",
    shape: "shield", color: "#a16207", glyph: "200",
    test: (c) => ({ earned: c.solved >= 200, progress: Math.min(1, c.solved / 200), note: `${c.solved} of 200` }),
  },
  {
    id: "solves-300", name: "Triple Century", blurb: "three hundred graded wins",
    shape: "shield", color: "#a16207", glyph: "300",
    test: (c) => ({ earned: c.solved >= 300, progress: Math.min(1, c.solved / 300), note: `${c.solved} of 300` }),
  },
  {
    id: "solves-500", name: "Five Hundred", blurb: "five hundred graded wins",
    shape: "shield", color: "#a16207", glyph: "500",
    test: (c) => { const v = c.solved ?? 0; return { earned: v >= 500, progress: Math.min(1, v / 500), note: `${v} of 500 solves` }; },
  },
  {
    id: "solves-1000", name: "Four Figures", blurb: "a thousand problems, answered",
    shape: "shield", color: "#a16207", glyph: "1K",
    test: (c) => { const v = c.solved ?? 0; return { earned: v >= 1000, progress: Math.min(1, v / 1000), note: `${v} of 1000 solves` }; },
  },
  {
    id: "streak-3", name: "Three Straight", blurb: "three days is where a habit starts",
    shape: "hex", color: "#0f7a52", glyph: "3",
    test: (c) => { const v = c.streakBest ?? 0; return { earned: v >= 3, progress: Math.min(1, v / 3), note: `${v} of 3 days` }; },
  },
  {
    id: "streak-14", name: "Fortnight", blurb: "two weeks without a gap",
    shape: "hex", color: "#0f7a52", glyph: "14",
    test: (c) => { const v = c.streakBest ?? 0; return { earned: v >= 14, progress: Math.min(1, v / 14), note: `${v} of 14 days` }; },
  },
  {
    id: "streak-60", name: "Sixty Straight", blurb: "two months, every day",
    shape: "shield", color: "#0f7a52", glyph: "60",
    test: (c) => { const v = c.streakBest ?? 0; return { earned: v >= 60, progress: Math.min(1, v / 60), note: `${v} of 60 days` }; },
  },
  {
    id: "streak-200", name: "Two Hundred Straight", blurb: "two hundred days in a row",
    shape: "shield", color: "#0f7a52", glyph: "200",
    test: (c) => { const v = c.streakBest ?? 0; return { earned: v >= 200, progress: Math.min(1, v / 200), note: `${v} of 200 days` }; },
  },
  {
    id: "streak-365", name: "A Full Year", blurb: "three hundred and sixty five days",
    shape: "shield", color: "#0f7a52", glyph: "365",
    test: (c) => { const v = c.streakBest ?? 0; return { earned: v >= 365, progress: Math.min(1, v / 365), note: `${v} of 365 days` }; },
  },
  {
    id: "hubs-1", name: "Clean Sweep", blurb: "every problem in one hub",
    shape: "kite", color: "#2056d2", glyph: "1",
    test: (c) => { const v = c.hubsDone ?? 0; return { earned: v >= 1, progress: Math.min(1, v / 1), note: `${v} of 1 hubs` }; },
  },
  {
    id: "hubs-3", name: "Hat-Trick", blurb: "three hubs finished",
    shape: "kite", color: "#2056d2", glyph: "3",
    test: (c) => { const v = c.hubsDone ?? 0; return { earned: v >= 3, progress: Math.min(1, v / 3), note: `${v} of 3 hubs` }; },
  },
  {
    id: "hubs-5", name: "Five-For", blurb: "five hubs finished",
    shape: "hex", color: "#2056d2", glyph: "5",
    test: (c) => { const v = c.hubsDone ?? 0; return { earned: v >= 5, progress: Math.min(1, v / 5), note: `${v} of 5 hubs` }; },
  },
  {
    id: "hubs-10", name: "Ten-For", blurb: "ten hubs finished",
    shape: "hex", color: "#2056d2", glyph: "10",
    test: (c) => { const v = c.hubsDone ?? 0; return { earned: v >= 10, progress: Math.min(1, v / 10), note: `${v} of 10 hubs` }; },
  },
  {
    id: "hubs-25", name: "Twenty-Five Up", blurb: "twenty five hubs finished",
    shape: "shield", color: "#2056d2", glyph: "25",
    test: (c) => { const v = c.hubsDone ?? 0; return { earned: v >= 25, progress: Math.min(1, v / 25), note: `${v} of 25 hubs` }; },
  },
  {
    id: "hubs-50", name: "Fifty Hubs", blurb: "fifty hubs finished",
    shape: "shield", color: "#2056d2", glyph: "50",
    test: (c) => { const v = c.hubsDone ?? 0; return { earned: v >= 50, progress: Math.min(1, v / 50), note: `${v} of 50 hubs` }; },
  },
  {
    id: "wide-5", name: "Five Doors", blurb: "solves in five different hubs",
    shape: "square", color: "#2056d2", glyph: "5",
    test: (c) => { const v = c.hubsTouched ?? 0; return { earned: v >= 5, progress: Math.min(1, v / 5), note: `${v} of 5 hubs` }; },
  },
  {
    id: "wide-10", name: "Ten Doors", blurb: "solves in ten different hubs",
    shape: "square", color: "#2056d2", glyph: "10",
    test: (c) => { const v = c.hubsTouched ?? 0; return { earned: v >= 10, progress: Math.min(1, v / 10), note: `${v} of 10 hubs` }; },
  },
  {
    id: "wide-25", name: "All-Rounder", blurb: "solves in twenty five different hubs",
    shape: "square", color: "#2056d2", glyph: "25",
    test: (c) => { const v = c.hubsTouched ?? 0; return { earned: v >= 25, progress: Math.min(1, v / 25), note: `${v} of 25 hubs` }; },
  },
  {
    id: "wide-50", name: "Fifty Doors", blurb: "solves in fifty different hubs",
    shape: "square", color: "#2056d2", glyph: "50",
    test: (c) => { const v = c.hubsTouched ?? 0; return { earned: v >= 50, progress: Math.min(1, v / 50), note: `${v} of 50 hubs` }; },
  },
  {
    id: "hard-10", name: "Deep End", blurb: "ten advanced problems",
    shape: "kite", color: "#7c3aed", glyph: "10",
    test: (c) => { const v = c.advanced ?? 0; return { earned: v >= 10, progress: Math.min(1, v / 10), note: `${v} of 10 hard` }; },
  },
  {
    id: "hard-25", name: "Tough Crowd", blurb: "twenty five advanced problems",
    shape: "hex", color: "#7c3aed", glyph: "25",
    test: (c) => { const v = c.advanced ?? 0; return { earned: v >= 25, progress: Math.min(1, v / 25), note: `${v} of 25 hard` }; },
  },
  {
    id: "hard-50", name: "Heavy Roller", blurb: "fifty advanced problems",
    shape: "hex", color: "#7c3aed", glyph: "50",
    test: (c) => { const v = c.advanced ?? 0; return { earned: v >= 50, progress: Math.min(1, v / 50), note: `${v} of 50 hard` }; },
  },
  {
    id: "hard-100", name: "Hundred Hard Ones", blurb: "one hundred advanced problems",
    shape: "shield", color: "#7c3aed", glyph: "100",
    test: (c) => { const v = c.advanced ?? 0; return { earned: v >= 100, progress: Math.min(1, v / 100), note: `${v} of 100 hard` }; },
  },
  {
    id: "solo-10", name: "No Help Needed", blurb: "ten solved without opening a hint",
    shape: "square", color: "#7c3aed", glyph: "10",
    test: (c) => { const v = c.unaided ?? 0; return { earned: v >= 10, progress: Math.min(1, v / 10), note: `${v} of 10 unaided` }; },
  },
  {
    id: "solo-50", name: "Unaided Fifty", blurb: "fifty solved without a hint",
    shape: "square", color: "#7c3aed", glyph: "50",
    test: (c) => { const v = c.unaided ?? 0; return { earned: v >= 50, progress: Math.min(1, v / 50), note: `${v} of 50 unaided` }; },
  },
  {
    id: "solo-100", name: "Unaided Hundred", blurb: "one hundred solved without a hint",
    shape: "square", color: "#7c3aed", glyph: "100",
    test: (c) => { const v = c.unaided ?? 0; return { earned: v >= 100, progress: Math.min(1, v / 100), note: `${v} of 100 unaided` }; },
  },
  {
    id: "solo-250", name: "Unaided Two-Fifty", blurb: "two hundred and fifty, all unaided",
    shape: "shield", color: "#7c3aed", glyph: "250",
    test: (c) => { const v = c.unaided ?? 0; return { earned: v >= 250, progress: Math.min(1, v / 250), note: `${v} of 250 unaided` }; },
  },
  {
    id: "quiz-perfect", name: "No Residuals", blurb: "a flawless assessment, nothing left over",
    shape: "hex", color: "#7c3aed", glyph: "OK",
    test: (c) => ({ earned: c.quizBestScore >= 100, progress: Math.min(1, c.quizBestScore / 100), note: `best score: ${c.quizBestScore}%` }),
  },
  {
    id: "early-member", name: "First Cohort", blurb: "joined in year one",
    shape: "square", color: "#7c3aed", glyph: "I",
    test: (c) => ({ earned: c.createdAt > 0 && c.createdAt < EARLY_MEMBER_CUTOFF, progress: 0, note: "founding cohort" }),
  },
  {
    id: "tier-master", name: "Top of the Order", blurb: "the top of the ladder",
    shape: "shield", color: "#7c3aed", glyph: "TOP",
    test: (c) => ({ earned: c.tierIndex >= 5, progress: Math.min(1, c.tierIndex / 5), note: "reach the Master tier" }),
  },
];

// Certificates become badges dynamically (one per track), so a new track
// never needs a code change here.
export function certBadges(c: BadgeCtx): Array<{ id: string; name: string; blurb: string }> {
  return c.certs.map((cert) => {
    const slug = (cert.track_name || "certificate").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
    return {
      id: `cert-${slug}`,
      name: cert.track_name || "Certificate",
      blurb: "certified " + new Date(cert.issued_at * 1000).toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
    };
  });
}

let tableReady = false;
export async function ensureBadgeTable(DB: D1Database): Promise<void> {
  if (tableReady) return;
  await DB.prepare(
    "CREATE TABLE IF NOT EXISTS user_badges (" +
    "user_id TEXT NOT NULL, badge_id TEXT NOT NULL, awarded_at INTEGER NOT NULL, " +
    "meta_json TEXT, PRIMARY KEY (user_id, badge_id))"
  ).run();
  tableReady = true;
}

// Lazy sweep: award anything newly earned. Returns the ids inserted by THIS
// call (empty on reruns). Never throws into the caller.
export async function awardBadges(DB: D1Database, userId: string, ctx: BadgeCtx): Promise<string[]> {
  try {
    await ensureBadgeTable(DB);
    const now = Math.floor(Date.now() / 1000);
    const earned: string[] = [];
    for (const def of BADGE_DEFS) {
      if (def.test(ctx).earned) earned.push(def.id);
    }
    for (const cb of certBadges(ctx)) earned.push(cb.id);
    const fresh: string[] = [];
    for (const id of earned) {
      const res = await DB.prepare(
        "INSERT OR IGNORE INTO user_badges (user_id, badge_id, awarded_at) VALUES (?1, ?2, ?3)"
      ).bind(userId, id, now).run();
      if (res.meta.changes) fresh.push(id);
    }
    return fresh;
  } catch {
    return [];
  }
}


/* Breadth, depth, difficulty and unaided solves, in three queries.
 *
 * hubsDone needs the per-hub totals, which live in the exercise manifest, so
 * it counts solves per hub and compares each against that hub's real size.
 * Everything else is a single aggregate. Failure returns zeroes, which leaves
 * the affected badges unearned rather than awarding them by accident.
 */
export async function loadBadgeExtras(
  DB: D1Database,
  userId: string,
  hubSize: (slug: string) => number,
): Promise<{ hubsDone: number; hubsTouched: number; advanced: number; unaided: number }> {
  const zero = { hubsDone: 0, hubsTouched: 0, advanced: 0, unaided: 0 };
  try {
    const [perHub, agg] = await Promise.all([
      DB.prepare(
        "SELECT hub_slug, COUNT(*) AS n FROM exercise_attempts WHERE user_id = ?1 GROUP BY hub_slug",
      ).bind(userId).all<{ hub_slug: string; n: number }>(),
      DB.prepare(
        `SELECT
           SUM(CASE WHEN xp_awarded >= 50 THEN 1 ELSE 0 END) AS adv,
           SUM(CASE WHEN COALESCE(hints_used, 0) = 0 THEN 1 ELSE 0 END) AS solo
         FROM exercise_attempts WHERE user_id = ?1`,
      ).bind(userId).first<{ adv: number; solo: number }>(),
    ]);
    const rows = perHub.results ?? [];
    let done = 0;
    for (const r of rows) {
      const size = hubSize(r.hub_slug);
      if (size > 0 && Number(r.n) >= size) done++;
    }
    return {
      hubsDone: done,
      hubsTouched: rows.length,
      advanced: Number(agg?.adv ?? 0),
      unaided: Number(agg?.solo ?? 0),
    };
  } catch {
    return zero;
  }
}

export async function loadUserBadges(DB: D1Database, userId: string): Promise<Map<string, number>> {
  try {
    await ensureBadgeTable(DB);
    const rows = await DB.prepare(
      "SELECT badge_id, awarded_at FROM user_badges WHERE user_id = ?1"
    ).bind(userId).all<{ badge_id: string; awarded_at: number }>();
    return new Map((rows.results ?? []).map((r) => [r.badge_id, r.awarded_at]));
  } catch {
    return new Map();
  }
}

// badge_id -> holder count, KV-cached for an hour. Counts under 3 are
// treated as "no rarity line" by the renderer.
export async function badgeRarity(env: Env): Promise<Record<string, number>> {
  try {
    const cached = await env.KV.get("badges:rarity:v1", "json");
    if (cached) return cached as Record<string, number>;
    await ensureBadgeTable(env.DB);
    const rows = await env.DB.prepare(
      "SELECT badge_id, COUNT(*) AS n FROM user_badges GROUP BY badge_id"
    ).all<{ badge_id: string; n: number }>();
    const out: Record<string, number> = {};
    for (const r of rows.results ?? []) out[r.badge_id] = Number(r.n);
    await env.KV.put("badges:rarity:v1", JSON.stringify(out), { expirationTtl: 3600 });
    return out;
  } catch {
    return {};
  }
}

// Inline SVG art for a badge (earned or locked variant handled by CSS).
export type Cut = "kite" | "hex" | "shield" | "square" | "circle";

/* Three shades per hue: the table, the lit flank, the shaded flank. Flat
   planes only. A stone reads as cut because the planes disagree about the
   light, not because anything is blurred. */
const FACETS: Record<string, [string, string, string]> = {
  "#2056d2": ["#8fb0f2", "#2f63d8", "#17346f"],   // blue, the early rungs
  "#0f7a52": ["#7fcda4", "#1f8a5c", "#0e4531"],   // green, the habit rungs
  "#a16207": ["#e8c477", "#b4801a", "#6b4a08"],   // amber, the heavy rungs
  "#7c3aed": ["#b79bf3", "#6d3bd6", "#37196e"],   // violet, the odd ones out
};

export function badgeArt(shape: Cut, color: string, glyph: string): string {
  const [lite, mid, deep] = FACETS[color] || FACETS["#2056d2"];
  const g = glyph.length > 3 ? glyph.slice(0, 3) : glyph;
  const size = g.length >= 3 ? 14 : g.length === 2 ? 17 : 20;
  const label = g === "OK"
    ? `<path d="M21 31l6.5 6.5L40 24" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`
    : `<text x="30" y="36" text-anchor="middle" font-family="'Inter Tight','IBM Plex Sans',sans-serif" font-size="${size}" font-weight="700" fill="#fff">${g}</text>`;

  // Each cut is: outline path, table plane, lit flank, shaded flank.
  const cuts: Record<Cut, [string, string, string, string]> = {
    kite: [
      "M30 3 55 25 30 57 5 25Z",
      "M30 3 45 17 30 25 15 17Z",
      "M5 25 15 17 30 25 30 57Z",
      "M55 25 45 17 30 25 30 57Z",
    ],
    hex: [
      "M30 4 53 17 53 43 30 56 7 43 7 17Z",
      "M30 4 53 17 30 29 7 17Z",
      "M7 17 30 29 30 56 7 43Z",
      "M53 17 30 29 30 56 53 43Z",
    ],
    shield: [
      "M30 4 54 14v16c0 13-10 22-24 26C16 52 6 43 6 30V14Z",
      "M30 4 54 14 30 26 6 14Z",
      "M6 14 30 26v30C16 52 6 43 6 30Z",
      "M54 14 30 26v30c14-4 24-13 24-26Z",
    ],
    square: [
      "M18 6h24l12 12v24l-12 12H18L6 42V18Z",
      "M18 6h24l12 12H6Z",
      "M6 18h24v36H18L6 42Z",
      "M54 18H30v36h12l12-12Z",
    ],
    circle: [
      "M30 4a26 26 0 110 52 26 26 0 010-52Z",
      "M30 4a26 26 0 0122.5 13H7.5A26 26 0 0130 4Z",
      "M7.5 17H30v39A26 26 0 017.5 17Z",
      "M52.5 17H30v39a26 26 0 0022.5-39Z",
    ],
  };

  const [outline, table, lit, shade] = cuts[shape] || cuts.kite;
  return `<svg class="art" viewBox="0 0 60 60" role="img">` +
    `<path d="${shade}" fill="${deep}"/>` +
    `<path d="${lit}" fill="${mid}"/>` +
    `<path d="${table}" fill="${lite}"/>` +
    `<path d="${outline}" fill="none" stroke="${deep}" stroke-width="2.5" stroke-linejoin="round"/>` +
    `${label}</svg>`;
}

