// Shared profile plumbing: lazy column migration, handle generation, and the
// aggregate queries behind /u/<handle> and /api/me/profile.
//
// The users table SCHEMA already carries handle / avatar_url / public_profile,
// but the production table may predate those columns (CREATE TABLE IF NOT
// EXISTS never adds columns). ensureProfileColumns() applies the ALTERs
// lazily with try/catch - idempotent, safe to race, no wrangler needed.

import type { User } from "./db";

const RESERVED_HANDLES = new Set([
  "me", "admin", "api", "u", "profile", "profiles", "user", "users",
  "settings", "account", "dashboard", "cert", "certs", "anonymous",
  "signin", "signup", "pricing", "tools", "roadmap", "exercises",
]);

let columnsReady = false;
export async function ensureProfileColumns(DB: D1Database): Promise<void> {
  if (columnsReady) return;
  const stmts = [
    "ALTER TABLE users ADD COLUMN handle TEXT",
    "ALTER TABLE users ADD COLUMN public_profile INTEGER DEFAULT 1",
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_users_handle ON users(handle)",
  ];
  for (const sql of stmts) {
    try { await DB.prepare(sql).run(); } catch { /* column/index already exists */ }
  }
  columnsReady = true;
}

function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
}

// Deterministic, non-identifying fallback suffix from the user id.
function idSuffix(userId: string): string {
  return userId.replace(/-/g, "").slice(0, 4).toLowerCase();
}

// Generate + persist a handle for a user that has none. Never derived from
// the email (identity leak); display_name only, else "learner-<id4>".
// Uniqueness is enforced by idx_users_handle; on collision we walk suffixes.
export async function ensureHandle(DB: D1Database, u: User): Promise<string | null> {
  if (u.handle) return u.handle;
  await ensureProfileColumns(DB);

  const base0 = slugifyName(u.display_name || "");
  const base = base0.length >= 3 && !RESERVED_HANDLES.has(base0) ? base0 : "learner";
  const suffix = idSuffix(u.id);
  const candidates = [
    base === "learner" ? `learner-${suffix}` : base,
    `${base}-${suffix}`,
    `${base}-${suffix}${Date.now() % 97}`,
  ];
  for (const cand of candidates) {
    try {
      await DB.prepare("UPDATE users SET handle = ?1 WHERE id = ?2 AND handle IS NULL")
        .bind(cand, u.id).run();
      const row = await DB.prepare("SELECT handle FROM users WHERE id = ?1")
        .bind(u.id).first<{ handle: string | null }>();
      if (row?.handle) return row.handle; // ours, or a concurrent winner - both fine
    } catch { /* unique collision - try the next candidate */ }
  }
  return null;
}

export interface ProfileStats {
  exercises_solved: number;
  exercises_attempts: number;
  hubs_practiced: number;
  certificates: Array<{ public_id: string; track_name: string; issued_at: number }>;
  top_hubs: Array<{ hub_slug: string; solved: number }>;
  heatmap: Array<{ day: string; xp: number }>; // last 26 weeks, UTC days with activity
  recent: Array<{ action: string; ref: string | null; xp: number; at: number }>;
}

export async function loadProfileStats(DB: D1Database, userId: string): Promise<ProfileStats> {
  const since = Math.floor(Date.now() / 1000) - 182 * 86400;
  const [ex, certs, hubs, heat, recent] = await Promise.all([
    DB.prepare(
      "SELECT COUNT(DISTINCT CASE WHEN passed = 1 THEN hub_slug || '|' || exercise_id END) AS solved, " +
      "COUNT(*) AS attempts, COUNT(DISTINCT hub_slug) AS hubs FROM exercise_attempts WHERE user_id = ?1"
    ).bind(userId).first<{ solved: number; attempts: number; hubs: number }>(),
    DB.prepare(
      "SELECT public_id, track_name, issued_at FROM certificates " +
      "WHERE user_id = ?1 AND status = 'active' AND public_id IS NOT NULL ORDER BY issued_at DESC LIMIT 12"
    ).bind(userId).all<{ public_id: string; track_name: string; issued_at: number }>()
      .catch(() => ({ results: [] as Array<{ public_id: string; track_name: string; issued_at: number }> })),
    DB.prepare(
      "SELECT hub_slug, COUNT(DISTINCT CASE WHEN passed = 1 THEN exercise_id END) AS solved " +
      "FROM exercise_attempts WHERE user_id = ?1 GROUP BY hub_slug HAVING solved > 0 " +
      "ORDER BY solved DESC LIMIT 5"
    ).bind(userId).all<{ hub_slug: string; solved: number }>(),
    DB.prepare(
      "SELECT strftime('%Y-%m-%d', at, 'unixepoch') AS day, SUM(xp) AS xp " +
      "FROM xp_ledger WHERE user_id = ?1 AND at >= ?2 GROUP BY day"
    ).bind(userId, since).all<{ day: string; xp: number }>(),
    DB.prepare(
      "SELECT action, ref, xp, at FROM xp_ledger WHERE user_id = ?1 ORDER BY at DESC LIMIT 8"
    ).bind(userId).all<{ action: string; ref: string | null; xp: number; at: number }>(),
  ]);
  return {
    exercises_solved: Number(ex?.solved ?? 0),
    exercises_attempts: ex?.attempts ?? 0,
    hubs_practiced: ex?.hubs ?? 0,
    certificates: certs.results ?? [],
    top_hubs: hubs.results ?? [],
    heatmap: heat.results ?? [],
    recent: recent.results ?? [],
  };
}

export function escHtml(s: unknown): string {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

// GitHub-style activity heatmap as a self-contained inline SVG (26 weeks x 7).
// Buckets are UTC days; intensity from XP earned that day.
export function renderHeatmapSvg(heat: Array<{ day: string; xp: number }>): string {
  const byDay = new Map(heat.map((h) => [h.day, h.xp]));
  const CELL = 11, GAP = 3, WEEKS = 26;
  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  // start on the Sunday 26 weeks back
  const start = todayUtc - ((WEEKS - 1) * 7 + new Date(todayUtc).getUTCDay()) * 86400000;
  const colors = ["#e9edf4", "#bcd0f0", "#7fa3e8", "#4272d4", "#1f4eb8"];
  const level = (xp: number) => (xp <= 0 ? 0 : xp < 15 ? 1 : xp < 40 ? 2 : xp < 90 ? 3 : 4);
  let cells = "";
  const monthMarks: Array<{ x: number; label: string }> = [];
  let lastMonth = -1;
  for (let w = 0; w < WEEKS; w++) {
    for (let d = 0; d < 7; d++) {
      const t = start + (w * 7 + d) * 86400000;
      if (t > todayUtc) continue;
      const dt = new Date(t);
      const day = dt.toISOString().slice(0, 10);
      const xp = byDay.get(day) || 0;
      if (d === 0 && dt.getUTCMonth() !== lastMonth) {
        lastMonth = dt.getUTCMonth();
        monthMarks.push({
          x: w * (CELL + GAP),
          label: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][lastMonth],
        });
      }
      cells += `<rect x="${w * (CELL + GAP)}" y="${14 + d * (CELL + GAP)}" width="${CELL}" height="${CELL}" rx="2" fill="${colors[level(xp)]}"><title>${day}: ${xp} XP</title></rect>`;
    }
  }
  const labels = monthMarks
    .map((m) => `<text x="${m.x}" y="9" font-size="9" fill="#6b7280" font-family="inherit">${m.label}</text>`)
    .join("");
  const w = WEEKS * (CELL + GAP) - GAP;
  const h = 14 + 7 * (CELL + GAP) - GAP;
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" role="img" aria-label="Activity heatmap, last 26 weeks" style="max-width:${w}px">${labels}${cells}</svg>`;
}

// Human wording for xp_ledger actions on the public activity feed.
export function describeAction(action: string, ref: string | null): string {
  const hub = (ref || "").split("|")[0].replace(/-/g, " ").replace(/\.html$/, "");
  switch (action) {
    case "exercise.passed": return hub ? `Solved an exercise in ${hub}` : "Solved an exercise";
    case "cert.earned": return "Earned a certificate";
    case "streak.day": return "Kept the daily streak alive";
    case "post.upvote": return "Upvoted a tutorial";
    default: return "Made progress";
  }
}
