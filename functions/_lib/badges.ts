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

