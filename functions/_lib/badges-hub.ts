// Hub badges: finish every graded exercise in one practice hub and the hub
// mints a public, verifiable badge.
//
// Deliberately built on the machinery that already exists rather than beside
// it. Completion is DERIVED from exercise_attempts, exactly like the
// mini-course badges in badges-mini.ts, so there is no completion state to
// keep in sync. The only stored artifact is the badges_earned row, which
// backs /badge/<public_id>.
//
// What is new here is the attempt record: how long the challenge took, how
// many hints were opened, the XP. That is what makes the badge worth sharing,
// and it lives in badges_earned.meta_json rather than in a new table.

import manifestJson from "../_data/exercise-manifest.json";
import catalogJson from "../../www/exercise-catalog.json";

const HUBS = (manifestJson as unknown as {
  hubs: Record<string, Record<string, string>>;
}).hubs;

interface CatalogHub { title: string; slug: string; n?: number }
interface Catalog { categories: Array<{ name: string; hubs: CatalogHub[] }> }

let TITLES: Record<string, string> | null = null;
function hubTitles(): Record<string, string> {
  if (TITLES) return TITLES;
  const out: Record<string, string> = {};
  for (const cat of (catalogJson as unknown as Catalog).categories || []) {
    for (const h of cat.hubs || []) if (h.slug) out[h.slug] = h.title;
  }
  TITLES = out;
  return out;
}

export function hubBadgeId(slug: string): string {
  return "hub-" + slug;
}

export function hubTitle(slug: string): string {
  return hubTitles()[slug] || slug.replace(/-/g, " ");
}

/** Every graded exercise id in the hub, from the bundled manifest. */
export function hubExerciseIds(slug: string): string[] {
  return Object.keys(HUBS[slug] || {});
}

export interface HubProgress { done: number; total: number; complete: boolean }

/** One query. Distinct passing exercise ids, compared against the manifest. */
export async function hubProgress(
  db: D1Database, userId: string, slug: string,
): Promise<HubProgress> {
  const total = hubExerciseIds(slug).length;
  if (!total) return { done: 0, total: 0, complete: false };
  const row = await db.prepare(
    `SELECT COUNT(DISTINCT exercise_id) AS n FROM exercise_attempts
     WHERE user_id = ?1 AND hub_slug = ?2 AND passed = 1`,
  ).bind(userId, slug).first<{ n: number }>();
  const done = Math.min(total, row?.n ?? 0);
  return { done, total, complete: done >= total };
}

export interface HubRecord {
  elapsed_ms?: number;   // from the challenge clock, paused time already removed
  hints?: number;
  xp?: number;
  solved?: number;
}

export interface MintedHubBadge {
  badge: string; slug: string; title: string; public_id: string;
  earned_at: number; newly_minted: boolean; record: HubRecord;
}

function randomId(): string {
  const b = new Uint8Array(9);
  crypto.getRandomValues(b);
  return [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

// badges_earned predates the attempt record, so widen it once, lazily. SQLite
// has no ADD COLUMN IF NOT EXISTS; a duplicate-column error is the success
// case on every run after the first.
let metaReady = false;
export async function ensureMetaColumn(db: D1Database): Promise<void> {
  if (metaReady) return;
  try {
    await db.prepare("ALTER TABLE badges_earned ADD COLUMN meta_json TEXT").run();
  } catch {
    /* already there */
  }
  metaReady = true;
}

/**
 * Mint the hub badge if it is not already held. Idempotent by the table's
 * PRIMARY KEY (user_id, badge): a rerun returns the existing row untouched,
 * so the earned_at and the record never drift.
 */
export async function mintHubBadge(
  db: D1Database, userId: string, slug: string, record: HubRecord = {},
): Promise<MintedHubBadge | null> {
  if (!hubExerciseIds(slug).length) return null;
  await ensureMetaColumn(db);
  const badge = hubBadgeId(slug);
  const now = Math.floor(Date.now() / 1000);
  const ins = await db.prepare(
    "INSERT OR IGNORE INTO badges_earned (user_id, badge, public_id, earned_at, meta_json) VALUES (?1, ?2, ?3, ?4, ?5)",
  ).bind(userId, badge, randomId(), now, JSON.stringify(record)).run();
  const row = await db.prepare(
    "SELECT public_id, earned_at, meta_json FROM badges_earned WHERE user_id = ?1 AND badge = ?2",
  ).bind(userId, badge).first<{ public_id: string; earned_at: number; meta_json: string | null }>();
  if (!row) return null;
  let rec: HubRecord = {};
  try { rec = row.meta_json ? JSON.parse(row.meta_json) as HubRecord : {}; } catch { rec = {}; }
  return {
    badge, slug, title: hubTitle(slug), public_id: row.public_id,
    earned_at: row.earned_at, newly_minted: (ins.meta?.changes ?? 0) === 1, record: rec,
  };
}

/** Slug back out of a stored badge id, for the public page. */
export function slugFromBadge(badge: string): string | null {
  return badge.startsWith("hub-") ? badge.slice(4) : null;
}

export function fmtElapsed(ms: number | undefined): string | null {
  if (!ms || ms < 1000) return null;
  const s = Math.round(ms / 1000);
  const h = Math.floor(s / 3600), m = Math.round((s % 3600) / 60);
  return h ? `${h}h ${m}m` : `${m || 1}m`;
}

/** Difficulty split for the hub, for the credential's "what it covered". */
export function hubBreakdown(slug: string): { beginner: number; intermediate: number; advanced: number; total: number } {
  const hub = HUBS[slug] || {};
  const out = { beginner: 0, intermediate: 0, advanced: 0, total: 0 };
  for (const id of Object.keys(hub)) {
    const d = hub[id];
    if (d === "beginner" || d === "intermediate" || d === "advanced") out[d] += 1;
    out.total += 1;
  }
  return out;
}

/**
 * Neutral population context for the credential: the interquartile range of
 * recorded times, and only once enough people hold the badge for a range to
 * mean anything. Never a rank, never a holder count on the page. Under the
 * threshold this returns null and the credential shows the holder's own
 * record alone.
 */
export const CONTEXT_MIN_HOLDERS = 30;

export async function hubTimeRange(
  db: D1Database, badge: string,
): Promise<{ p25: number; p75: number } | null> {
  try {
    const cnt = await db.prepare(
      `SELECT COUNT(*) AS n FROM badges_earned
       WHERE badge = ?1 AND meta_json IS NOT NULL
         AND json_extract(meta_json, '$.elapsed_ms') > 0`,
    ).bind(badge).first<{ n: number }>();
    const n = Number(cnt?.n ?? 0);
    if (n < CONTEXT_MIN_HOLDERS) return null;
    const at = async (offset: number) => {
      const r = await db.prepare(
        `SELECT json_extract(meta_json, '$.elapsed_ms') AS ms FROM badges_earned
         WHERE badge = ?1 AND meta_json IS NOT NULL
           AND json_extract(meta_json, '$.elapsed_ms') > 0
         ORDER BY ms ASC LIMIT 1 OFFSET ?2`,
      ).bind(badge, offset).first<{ ms: number }>();
      return Number(r?.ms ?? 0);
    };
    const p25 = await at(Math.floor(n * 0.25));
    const p75 = await at(Math.floor(n * 0.75));
    return p25 > 0 && p75 > 0 ? { p25, p75 } : null;
  } catch {
    return null;
  }
}
