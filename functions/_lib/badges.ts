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
}

export interface BadgeDef {
  id: string;
  name: string;
  blurb: string;              // shown under the name when earned
  shape: "circle" | "shield" | "square";
  color: string;              // stroke/fill family
  glyph: string;              // short text drawn in the art
  test: (c: BadgeCtx) => { earned: boolean; progress: number; note: string };
}

const EARLY_MEMBER_CUTOFF = 1782585600; // 2026-06-28: the first year of accounts

export const BADGE_DEFS: BadgeDef[] = [
  {
    id: "streak-7", name: "7-day streak", blurb: "a full week, every day",
    shape: "circle", color: "#2056d2", glyph: "7",
    test: (c) => ({ earned: c.streakBest >= 7, progress: Math.min(1, c.streakBest / 7), note: `best so far: ${c.streakBest}` }),
  },
  {
    id: "streak-30", name: "30-day streak", blurb: "a month without missing",
    shape: "circle", color: "#2056d2", glyph: "30",
    test: (c) => ({ earned: c.streakBest >= 30, progress: Math.min(1, c.streakBest / 30), note: `best so far: ${c.streakBest}` }),
  },
  {
    id: "streak-100", name: "100-day streak", blurb: "one hundred straight days",
    shape: "circle", color: "#7c3aed", glyph: "100",
    test: (c) => ({ earned: c.streakBest >= 100, progress: Math.min(1, c.streakBest / 100), note: `best so far: ${c.streakBest}` }),
  },
  {
    id: "solves-100", name: "100 solves", blurb: "one hundred graded wins",
    shape: "shield", color: "#0f7a52", glyph: "100",
    test: (c) => ({ earned: c.solved >= 100, progress: Math.min(1, c.solved / 100), note: `${c.solved} of 100` }),
  },
  {
    id: "solves-200", name: "200 solves", blurb: "two hundred graded wins",
    shape: "shield", color: "#0f7a52", glyph: "200",
    test: (c) => ({ earned: c.solved >= 200, progress: Math.min(1, c.solved / 200), note: `${c.solved} of 200` }),
  },
  {
    id: "solves-300", name: "300 solves", blurb: "three hundred graded wins",
    shape: "shield", color: "#0f7a52", glyph: "300",
    test: (c) => ({ earned: c.solved >= 300, progress: Math.min(1, c.solved / 300), note: `${c.solved} of 300` }),
  },
  {
    id: "quiz-perfect", name: "Perfect quiz", blurb: "a flawless certification quiz",
    shape: "circle", color: "#2056d2", glyph: "OK",
    test: (c) => ({ earned: c.quizBestScore >= 100, progress: Math.min(1, c.quizBestScore / 100), note: `best score: ${c.quizBestScore}%` }),
  },
  {
    id: "early-member", name: "Early member", blurb: "joined in year one",
    shape: "circle", color: "#0f7a52", glyph: "Y1",
    test: (c) => ({ earned: c.createdAt > 0 && c.createdAt < EARLY_MEMBER_CUTOFF, progress: 0, note: "founding cohort" }),
  },
  {
    id: "tier-master", name: "Master tier", blurb: "the top of the ladder",
    shape: "square", color: "#7c3aed", glyph: "M",
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
export function badgeArt(shape: BadgeDef["shape"], color: string, glyph: string): string {
  const soft: Record<string, string> = {
    "#2056d2": "#eef3fe", "#0f7a52": "#e9f5ef", "#7c3aed": "#f3e8ff", "#a16207": "#fdf2e3",
  };
  const fill = soft[color] || "#f4f6fa";
  const g = glyph.length > 3 ? glyph.slice(0, 3) : glyph;
  const fontSize = g.length >= 3 ? 15 : 19;
  const text = g === "OK"
    ? `<path d="M19 31l8 8 14-16" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`
    : `<text x="30" y="37" text-anchor="middle" font-family="'Inter Tight','IBM Plex Sans',sans-serif" font-size="${fontSize}" font-weight="700" fill="${color}">${g}</text>`;
  if (shape === "shield") {
    return `<svg class="art" viewBox="0 0 60 60"><path d="M30 4 54 15v15c0 13-10 21-24 24C16 51 6 43 6 30V15z" fill="${fill}" stroke="${color}" stroke-width="3"/>${text}</svg>`;
  }
  if (shape === "square") {
    return `<svg class="art" viewBox="0 0 60 60"><rect x="8" y="8" width="44" height="44" rx="10" fill="${fill}" stroke="${color}" stroke-width="3"/>${text}</svg>`;
  }
  return `<svg class="art" viewBox="0 0 60 60"><circle cx="30" cy="30" r="26" fill="${fill}" stroke="${color}" stroke-width="3"/>${text}</svg>`;
}
