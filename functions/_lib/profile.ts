// Shared profile plumbing: lazy column migration, handle generation/renames,
// the aggregate queries behind /u/<handle> + /api/me/profile + card.svg, the
// tier ladder, and the SVG renderers (heatmap, embeddable card).
//
// The users table SCHEMA already carries handle / avatar_url / public_profile,
// but the production table may predate any of these columns (CREATE TABLE IF
// NOT EXISTS never adds columns). ensureProfileColumns() applies the ALTERs
// lazily with try/catch - idempotent, safe to race, no wrangler needed.

import type { User } from "./db";
import { lookupDifficulty } from "./exercises";
import hubTracksJson from "../_data/hub-tracks.json";

const hubTracks = hubTracksJson as Record<string, string>;

export const RESERVED_HANDLES = new Set([
  "me", "admin", "api", "u", "profile", "profiles", "user", "users",
  "settings", "account", "dashboard", "cert", "certs", "anonymous",
  "signin", "signup", "pricing", "tools", "roadmap", "exercises",
  "card", "transcript", "team", "teams", "about", "help", "support",
]);

let columnsReady = false;
export async function ensureProfileColumns(DB: D1Database): Promise<void> {
  if (columnsReady) return;
  const stmts = [
    "ALTER TABLE users ADD COLUMN handle TEXT",
    "ALTER TABLE users ADD COLUMN public_profile INTEGER DEFAULT 1",
    "ALTER TABLE users ADD COLUMN profile_json TEXT",
    "ALTER TABLE users ADD COLUMN github_login TEXT",
    "ALTER TABLE users ADD COLUMN prev_handle TEXT",
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_users_handle ON users(handle)",
    "CREATE INDEX IF NOT EXISTS idx_users_prev_handle ON users(prev_handle)",
    "CREATE TABLE IF NOT EXISTS profile_views (" +
      "handle TEXT NOT NULL, day TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, " +
      "PRIMARY KEY (handle, day))",
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

export const HANDLE_RE = /^[a-z0-9][a-z0-9-]{1,30}$/;

// Is this handle free to claim? Checks live handles AND retired ones
// (prev_handle), so a previously shared URL can never be taken over.
export async function handleAvailable(DB: D1Database, cand: string): Promise<boolean> {
  if (!HANDLE_RE.test(cand) || RESERVED_HANDLES.has(cand)) return false;
  const row = await DB.prepare(
    "SELECT 1 AS x FROM users WHERE handle = ?1 OR prev_handle = ?1 LIMIT 1"
  ).bind(cand).first<{ x: number }>();
  return !row;
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
      if (!(await handleAvailable(DB, cand))) continue;
      await DB.prepare("UPDATE users SET handle = ?1 WHERE id = ?2 AND handle IS NULL")
        .bind(cand, u.id).run();
      const row = await DB.prepare("SELECT handle FROM users WHERE id = ?1")
        .bind(u.id).first<{ handle: string | null }>();
      if (row?.handle) return row.handle; // ours, or a concurrent winner - both fine
    } catch { /* unique collision - try the next candidate */ }
  }
  return null;
}

// One-time handle rename. Enforced atomically: the UPDATE only fires while
// prev_handle IS NULL. Returns the outcome for the API to relay.
export async function renameHandle(
  DB: D1Database, u: User, next: string,
): Promise<{ ok: boolean; error?: string }> {
  await ensureProfileColumns(DB);
  const cand = String(next || "").toLowerCase().trim();
  if (!HANDLE_RE.test(cand)) return { ok: false, error: "handle must be 2-31 chars: lowercase letters, digits, hyphens" };
  if (RESERVED_HANDLES.has(cand)) return { ok: false, error: "that handle is reserved" };
  if (cand === u.handle) return { ok: false, error: "that is already your handle" };
  if ((u as { prev_handle?: string | null }).prev_handle) {
    return { ok: false, error: "handle can only be changed once" };
  }
  if (!(await handleAvailable(DB, cand))) return { ok: false, error: "that handle is taken" };
  try {
    const res = await DB.prepare(
      "UPDATE users SET prev_handle = handle, handle = ?1 " +
      "WHERE id = ?2 AND prev_handle IS NULL AND handle IS NOT NULL"
    ).bind(cand, u.id).run();
    if (!res.meta.changes) return { ok: false, error: "handle can only be changed once" };
    return { ok: true };
  } catch {
    return { ok: false, error: "that handle is taken" }; // unique-index race loser
  }
}

// ---------------------------------------------------------------- tiers

export interface Tier {
  name: string;
  color: string;
  index: number;
  next: { name: string; line: string } | null;
}

// Verifiable activity only - PRO never affects tier. Tunable in one place.
const TIER_LADDER: Array<{ name: string; color: string; xp: number; solved: number; certs: number; anyOf?: boolean }> = [
  { name: "Newcomer",     color: "#8a8f98", xp: 0,     solved: 0,   certs: 0 },
  { name: "Apprentice",   color: "#7f8fb8", xp: 250,   solved: 10,  certs: 0, anyOf: true },
  { name: "Practitioner", color: "#3f7fbf", xp: 1000,  solved: 25,  certs: 0 },
  { name: "Analyst",      color: "#1f7a55", xp: 3000,  solved: 75,  certs: 0 },
  { name: "Expert",       color: "#a16207", xp: 8000,  solved: 150, certs: 1 },
  { name: "Master",       color: "#7c3aed", xp: 20000, solved: 300, certs: 2 },
];

function meetsTier(t: (typeof TIER_LADDER)[number], xp: number, solved: number, certs: number): boolean {
  if (t.anyOf) return xp >= t.xp || solved >= t.solved;
  return xp >= t.xp && solved >= t.solved && certs >= t.certs;
}

export function computeTier(xp: number, solved: number, certs: number): Tier {
  let idx = 0;
  for (let i = TIER_LADDER.length - 1; i >= 0; i--) {
    if (meetsTier(TIER_LADDER[i], xp, solved, certs)) { idx = i; break; }
  }
  const cur = TIER_LADDER[idx];
  const nxt = TIER_LADDER[idx + 1];
  let next: Tier["next"] = null;
  if (nxt) {
    const parts: string[] = [];
    if (xp < nxt.xp) parts.push(`${xp.toLocaleString()} / ${nxt.xp.toLocaleString()} XP`);
    if (solved < nxt.solved) parts.push(`${solved} / ${nxt.solved} solved`);
    if (nxt.certs > certs) parts.push(`${certs} / ${nxt.certs} certificate${nxt.certs > 1 ? "s" : ""}`);
    next = { name: nxt.name, line: parts.length ? `${parts.join(" and ")} to ${nxt.name}` : `Almost at ${nxt.name}` };
  }
  return { name: cur.name, color: cur.color, index: idx, next };
}

// ------------------------------------------------------------ profile_json

export interface ProfileExtras {
  bio?: string;
  website?: string;
  resume?: string;
  projects?: string[];       // up to 3 https URLs
  github?: string;           // manual fallback; auto github_login wins
  open_to_work?: boolean;
  role?: string;             // target role, <= 60 chars
  work_pref?: string;        // remote | hybrid | onsite | any
  snippet?: { title?: string; code?: string };  // pinned runnable R snippet
}

const URL_CAP = 200;

function cleanUrl(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (!s || s.length > URL_CAP) return null;
  if (!/^https:\/\/[a-z0-9][a-z0-9.-]*\.[a-z]{2,}([/?#]\S*)?$/i.test(s)) return null;
  return s;
}

function cleanText(v: unknown, cap: number): string | null {
  if (typeof v !== "string") return null;
  // strip control characters, collapse whitespace
  let s = "";
  for (const ch of v) {
    const code = ch.codePointAt(0) || 0;
    s += code < 32 || code === 127 ? " " : ch;
  }
  s = s.replace(/\s+/g, " ").trim().slice(0, cap);
  return s || null;
}

export function parseProfileJson(raw: string | null | undefined): ProfileExtras {
  if (!raw) return {};
  try {
    const p = JSON.parse(raw);
    return p && typeof p === "object" && !Array.isArray(p) ? (p as ProfileExtras) : {};
  } catch { return {}; }
}

// Validate a partial update from the owner; merge onto current. Returns the
// merged object or a field-level error.
export function mergeProfileExtras(
  cur: ProfileExtras, body: Record<string, unknown>,
): { ok: true; extras: ProfileExtras } | { ok: false; error: string } {
  const out: ProfileExtras = { ...cur };

  if ("bio" in body) {
    if (body.bio === "" || body.bio == null) delete out.bio;
    else {
      const b = cleanText(body.bio, 140);
      if (!b) return { ok: false, error: "bio must be 1-140 printable characters" };
      out.bio = b;
    }
  }
  for (const k of ["website", "resume", "github"] as const) {
    if (k in body) {
      if (body[k] === "" || body[k] == null) delete out[k];
      else {
        const u = cleanUrl(body[k]);
        if (!u) return { ok: false, error: `${k} must be an https:// URL (max ${URL_CAP} chars)` };
        out[k] = u;
      }
    }
  }
  if ("projects" in body) {
    if (body.projects == null) delete out.projects;
    else {
      if (!Array.isArray(body.projects) || body.projects.length > 3) {
        return { ok: false, error: "projects must be a list of at most 3 https:// URLs" };
      }
      const cleaned: string[] = [];
      for (const p of body.projects) {
        const u = cleanUrl(p);
        if (!u) return { ok: false, error: "every project link must be an https:// URL" };
        cleaned.push(u);
      }
      if (cleaned.length) out.projects = cleaned; else delete out.projects;
    }
  }
  if ("open_to_work" in body) {
    if (typeof body.open_to_work !== "boolean") return { ok: false, error: "open_to_work must be true or false" };
    if (body.open_to_work) out.open_to_work = true; else delete out.open_to_work;
  }
  if ("role" in body) {
    if (body.role === "" || body.role == null) delete out.role;
    else {
      const r = cleanText(body.role, 60);
      if (!r) return { ok: false, error: "role must be 1-60 characters" };
      out.role = r;
    }
  }
  if ("work_pref" in body) {
    if (body.work_pref === "" || body.work_pref == null) delete out.work_pref;
    else if (["remote", "hybrid", "onsite", "any"].includes(String(body.work_pref))) {
      out.work_pref = String(body.work_pref);
    } else return { ok: false, error: "work_pref must be remote, hybrid, onsite or any" };
  }
  if ("snippet" in body) {
    if (body.snippet == null) delete out.snippet;
    else {
      const s = body.snippet as { title?: unknown; code?: unknown };
      const code = typeof s.code === "string" ? s.code.replace(/\r\n/g, "\n").slice(0, 2000) : "";
      if (!code.trim()) return { ok: false, error: "snippet.code must be non-empty R code (max 2000 chars)" };
      const title = cleanText(s.title, 80) || "Pinned snippet";
      out.snippet = { title, code };
    }
  }
  return { ok: true, extras: out };
}

// ---------------------------------------------------------------- stats

export interface ProfileStats {
  exercises_solved: number;
  exercises_attempts: number;
  hubs_practiced: number;
  pages_read: number;
  quizzes_passed: number;
  weeks_active_26: number;
  rank: number | null;            // 1-based by total_xp; null when base < 100
  learners_total: number;
  by_difficulty: Record<string, number>;
  by_track: Array<{ track: string; solved: number }>;
  currently_learning: string | null;   // top track of the last 30 days
  certificates: Array<{ public_id: string; track_name: string; issued_at: number }>;
  top_hubs: Array<{ hub_slug: string; solved: number }>;
  heatmap: Array<{ day: string; n: number; xp: number }>; // last 52 weeks, UTC days
  recent: Array<{ action: string; ref: string | null; xp: number; at: number }>;
}

export async function loadProfileStats(DB: D1Database, userId: string, totalXp: number): Promise<ProfileStats> {
  const now = Math.floor(Date.now() / 1000);
  const since52 = now - 364 * 86400;
  const since26 = now - 182 * 86400;
  const since30 = now - 30 * 86400;

  const [ex, certs, hubs, pairs, heatXp, heatRead, recent, reading, quizzes, rankRow, totalRow, recentHubs] =
    await Promise.all([
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
        "ORDER BY solved DESC LIMIT 8"
      ).bind(userId).all<{ hub_slug: string; solved: number }>(),
      DB.prepare(
        "SELECT DISTINCT hub_slug, exercise_id FROM exercise_attempts WHERE user_id = ?1 AND passed = 1 LIMIT 2000"
      ).bind(userId).all<{ hub_slug: string; exercise_id: string }>(),
      DB.prepare(
        "SELECT strftime('%Y-%m-%d', at, 'unixepoch') AS day, SUM(xp) AS xp, COUNT(*) AS n " +
        "FROM xp_ledger WHERE user_id = ?1 AND at >= ?2 GROUP BY day"
      ).bind(userId, since52).all<{ day: string; xp: number; n: number }>(),
      DB.prepare(
        "SELECT strftime('%Y-%m-%d', read_at, 'unixepoch') AS day, COUNT(*) AS n " +
        "FROM reading_progress WHERE user_id = ?1 AND read_at >= ?2 GROUP BY day"
      ).bind(userId, since52).all<{ day: string; n: number }>()
        .catch(() => ({ results: [] as Array<{ day: string; n: number }> })),
      DB.prepare(
        "SELECT action, ref, xp, at FROM xp_ledger WHERE user_id = ?1 ORDER BY at DESC LIMIT 8"
      ).bind(userId).all<{ action: string; ref: string | null; xp: number; at: number }>(),
      DB.prepare(
        "SELECT COUNT(*) AS n FROM reading_progress WHERE user_id = ?1"
      ).bind(userId).first<{ n: number }>().catch(() => ({ n: 0 } as { n: number })),
      DB.prepare(
        "SELECT COUNT(DISTINCT track) AS n FROM quiz_attempts WHERE user_id = ?1 AND passed = 1"
      ).bind(userId).first<{ n: number }>().catch(() => ({ n: 0 } as { n: number })),
      DB.prepare(
        "SELECT COUNT(*) + 1 AS r FROM users WHERE total_xp > ?1 AND deleted_at IS NULL"
      ).bind(totalXp).first<{ r: number }>(),
      DB.prepare(
        "SELECT COUNT(*) AS n FROM users WHERE deleted_at IS NULL"
      ).first<{ n: number }>(),
      DB.prepare(
        "SELECT hub_slug, COUNT(*) AS n FROM exercise_attempts " +
        "WHERE user_id = ?1 AND submitted_at >= ?2 GROUP BY hub_slug ORDER BY n DESC LIMIT 12"
      ).bind(userId, since30).all<{ hub_slug: string; n: number }>(),
    ]);

  // merge XP days + reading days into one activity map
  const byDay = new Map<string, { n: number; xp: number }>();
  for (const r of heatXp.results ?? []) byDay.set(r.day, { n: Number(r.n) || 0, xp: Number(r.xp) || 0 });
  for (const r of heatRead.results ?? []) {
    const cur = byDay.get(r.day) || { n: 0, xp: 0 };
    cur.n += Number(r.n) || 0;
    byDay.set(r.day, cur);
  }
  const heatmap = Array.from(byDay, ([day, v]) => ({ day, n: v.n, xp: v.xp }));

  // weeks with any activity in the last 26
  const weekSet = new Set<number>();
  for (const h of heatmap) {
    const t = Date.parse(h.day + "T00:00:00Z") / 1000;
    if (t >= since26) weekSet.add(Math.floor(t / (7 * 86400)));
  }

  // difficulty + track breakdowns from the solved pairs
  const byDifficulty: Record<string, number> = {};
  const trackCount = new Map<string, number>();
  for (const p of pairs.results ?? []) {
    const d = (lookupDifficulty(p.hub_slug, p.exercise_id) || "other").toLowerCase();
    byDifficulty[d] = (byDifficulty[d] || 0) + 1;
    const track = hubTracks[p.hub_slug];
    if (track) trackCount.set(track, (trackCount.get(track) || 0) + 1);
  }
  const byTrack = Array.from(trackCount, ([track, solved]) => ({ track, solved }))
    .sort((a, b) => b.solved - a.solved).slice(0, 8);

  // currently learning: dominant track of the last 30 days' graded activity
  const recent30 = new Map<string, number>();
  for (const r of recentHubs.results ?? []) {
    const track = hubTracks[r.hub_slug];
    if (track) recent30.set(track, (recent30.get(track) || 0) + Number(r.n));
  }
  let currently: string | null = null;
  let best = 2; // require at least 3 graded actions in 30d before claiming it
  for (const [track, n] of recent30) if (n > best) { best = n; currently = track; }

  const learners = totalRow?.n ?? 0;

  return {
    exercises_solved: Number(ex?.solved ?? 0),
    exercises_attempts: ex?.attempts ?? 0,
    hubs_practiced: ex?.hubs ?? 0,
    pages_read: Number((reading as { n?: number })?.n ?? 0),
    quizzes_passed: Number((quizzes as { n?: number })?.n ?? 0),
    weeks_active_26: weekSet.size,
    rank: learners >= 100 ? Number(rankRow?.r ?? 0) || null : null,
    learners_total: learners,
    by_difficulty: byDifficulty,
    by_track: byTrack,
    currently_learning: currently,
    certificates: certs.results ?? [],
    top_hubs: hubs.results ?? [],
    heatmap,
    recent: recent.results ?? [],
  };
}

// ------------------------------------------------------------ view counter

export async function bumpProfileView(DB: D1Database, handle: string): Promise<void> {
  try {
    const day = new Date().toISOString().slice(0, 10);
    await DB.prepare(
      "INSERT INTO profile_views (handle, day, n) VALUES (?1, ?2, 1) " +
      "ON CONFLICT(handle, day) DO UPDATE SET n = n + 1"
    ).bind(handle, day).run();
  } catch { /* never blocks a page view */ }
}

export async function viewsThisMonth(DB: D1Database, handle: string): Promise<number> {
  try {
    const monthStart = new Date().toISOString().slice(0, 8) + "01";
    const row = await DB.prepare(
      "SELECT COALESCE(SUM(n), 0) AS n FROM profile_views WHERE handle = ?1 AND day >= ?2"
    ).bind(handle, monthStart).first<{ n: number }>();
    return Number(row?.n ?? 0);
  } catch { return 0; }
}

// ---------------------------------------------------------------- helpers

export function escHtml(s: unknown): string {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

export function linkedInAddUrl(cert: { public_id: string; track_name: string; issued_at: number }): string {
  const d = new Date(cert.issued_at * 1000);
  const p = new URLSearchParams({
    startTask: "CERTIFICATION_NAME",
    name: cert.track_name || "r-statistics.co certificate",
    organizationName: "r-statistics.co",
    issueYear: String(d.getUTCFullYear()),
    issueMonth: String(d.getUTCMonth() + 1),
    certUrl: `https://r-statistics.co/cert/${cert.public_id}`,
    certId: cert.public_id,
  });
  return `https://www.linkedin.com/profile/add?${p.toString()}`;
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

// ---------------------------------------------------------------- heatmap

// GitHub-style activity heatmap as a self-contained inline SVG.
// 52 weeks x 7, UTC day buckets, month labels on top, Mon/Wed/Fri left,
// per-cell tooltips with the activity count.
export function renderHeatmapSvg(heat: Array<{ day: string; n: number; xp: number }>): string {
  const byDay = new Map(heat.map((h) => [h.day, h]));
  const CELL = 11, GAP = 3, WEEKS = 52, LEFT = 26, TOP = 14;
  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const start = todayUtc - ((WEEKS - 1) * 7 + new Date(todayUtc).getUTCDay()) * 86400000;
  const colors = ["#eceff5", "#bcd0f0", "#7fa3e8", "#4272d4", "#1f4eb8"];
  const level = (n: number, xp: number) => {
    const score = xp > 0 ? xp : n * 8;
    return score <= 0 ? 0 : score < 15 ? 1 : score < 40 ? 2 : score < 90 ? 3 : 4;
  };
  let cells = "";
  const monthMarks: Array<{ x: number; label: string }> = [];
  let lastMonth = -1;
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  for (let w = 0; w < WEEKS; w++) {
    for (let d = 0; d < 7; d++) {
      const t = start + (w * 7 + d) * 86400000;
      if (t > todayUtc) continue;
      const dt = new Date(t);
      const day = dt.toISOString().slice(0, 10);
      const rec = byDay.get(day);
      const n = rec?.n || 0;
      if (d === 0 && dt.getUTCMonth() !== lastMonth) {
        lastMonth = dt.getUTCMonth();
        monthMarks.push({ x: LEFT + w * (CELL + GAP), label: MONTHS[lastMonth] });
      }
      const tip = n > 0
        ? `${n} activit${n === 1 ? "y" : "ies"} on ${day}`
        : `No activity on ${day}`;
      cells += `<rect x="${LEFT + w * (CELL + GAP)}" y="${TOP + d * (CELL + GAP)}" width="${CELL}" height="${CELL}" rx="2" fill="${colors[level(n, rec?.xp || 0)]}"><title>${tip}</title></rect>`;
    }
  }
  const monthLabels = monthMarks
    .map((m) => `<text x="${m.x}" y="9" font-size="9" fill="#6b7280" font-family="inherit">${m.label}</text>`)
    .join("");
  const dayLabels = ([["Mon", 1], ["Wed", 3], ["Fri", 5]] as Array<[string, number]>)
    .map(([lab, d]) =>
      `<text x="0" y="${TOP + d * (CELL + GAP) + 9}" font-size="8.5" fill="#6b7280" font-family="inherit">${lab}</text>`)
    .join("");
  const w = LEFT + WEEKS * (CELL + GAP) - GAP;
  const h = TOP + 7 * (CELL + GAP) - GAP;
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" role="img" aria-label="Activity heatmap, last 52 weeks" style="max-width:${w}px">${monthLabels}${dayLabels}${cells}</svg>`;
}

// ---------------------------------------------------------------- card.svg

// The embeddable README stats card. Everything user-derived is escaped; the
// card contains only what the public page already shows.
export function renderCardSvg(args: {
  name: string;
  handle: string;
  tier: Tier;
  totalXp: number;
  solved: number;
  streak: number;
  certs: number;
  heat: Array<{ day: string; n: number; xp: number }>;
}): string {
  const W = 480, H = 180;
  const name = escHtml(args.name.slice(0, 32));
  const tierName = escHtml(args.tier.name);

  // 16-week mini heatmap strip
  const byDay = new Map(args.heat.map((h) => [h.day, h]));
  const CELL = 8, GAP = 2, WEEKS = 16;
  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const start = todayUtc - ((WEEKS - 1) * 7 + new Date(todayUtc).getUTCDay()) * 86400000;
  const colors = ["#e9edf4", "#bcd0f0", "#7fa3e8", "#4272d4", "#1f4eb8"];
  let strip = "";
  for (let w = 0; w < WEEKS; w++) {
    for (let d = 0; d < 7; d++) {
      const t = start + (w * 7 + d) * 86400000;
      if (t > todayUtc) continue;
      const day = new Date(t).toISOString().slice(0, 10);
      const rec = byDay.get(day);
      const score = rec ? (rec.xp > 0 ? rec.xp : rec.n * 8) : 0;
      const lv = score <= 0 ? 0 : score < 15 ? 1 : score < 40 ? 2 : score < 90 ? 3 : 4;
      strip += `<rect x="${300 + w * (CELL + GAP)}" y="${96 + d * (CELL + GAP)}" width="${CELL}" height="${CELL}" rx="1.5" fill="${colors[lv]}"/>`;
    }
  }

  const stat = (x: number, value: string, label: string) =>
    `<text x="${x}" y="112" font-size="22" font-weight="700" fill="#0a0d14" font-family="'Segoe UI',Roboto,Arial,sans-serif">${value}</text>` +
    `<text x="${x}" y="130" font-size="10.5" fill="#6b7280" font-family="'Segoe UI',Roboto,Arial,sans-serif">${label}</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="r-statistics.co learner card for ${name}">
  <rect width="${W - 1}" height="${H - 1}" x="0.5" y="0.5" rx="12" fill="#ffffff" stroke="#d4d9e3"/>
  <text x="24" y="42" font-size="20" font-weight="700" fill="#0a0d14" font-family="'Segoe UI',Roboto,Arial,sans-serif">${name}</text>
  <rect x="24" y="54" rx="9" height="18" width="${16 + tierName.length * 7}" fill="${args.tier.color}"/>
  <text x="${24 + (16 + tierName.length * 7) / 2}" y="67" font-size="10.5" font-weight="600" fill="#ffffff" text-anchor="middle" font-family="'Segoe UI',Roboto,Arial,sans-serif">${tierName}</text>
  ${stat(24, args.totalXp.toLocaleString(), "XP")}
  ${stat(114, String(args.solved), "solved")}
  ${stat(194, String(args.streak), "day streak")}
  ${stat(274, String(args.certs), "certificates")}
  ${strip}
  <text x="24" y="164" font-size="10.5" fill="#6b7280" font-family="'Segoe UI',Roboto,Arial,sans-serif">r-statistics.co/u/${escHtml(args.handle)}</text>
  <text x="${W - 24}" y="164" font-size="12" font-weight="700" text-anchor="end" fill="#2056d2" font-family="Georgia,serif">R.</text>
</svg>`;
}


// ================= pass 1 additions =================

// Monthly deltas for the hero stat strip.
export async function monthlyDeltas(DB: D1Database, userId: string): Promise<{ xp30: number; solved30: number }> {
  const cutoff = Math.floor(Date.now() / 1000) - 30 * 86400;
  try {
    const [xp, sv] = await Promise.all([
      DB.prepare("SELECT COALESCE(SUM(xp),0) AS n FROM xp_ledger WHERE user_id = ?1 AND at >= ?2")
        .bind(userId, cutoff).first<{ n: number }>(),
      DB.prepare(
        "SELECT COUNT(DISTINCT hub_slug || '|' || exercise_id) AS n FROM exercise_attempts " +
        "WHERE user_id = ?1 AND passed = 1 AND submitted_at >= ?2"
      ).bind(userId, cutoff).first<{ n: number }>(),
    ]);
    return { xp30: Number(xp?.n ?? 0), solved30: Number(sv?.n ?? 0) };
  } catch { return { xp30: 0, solved30: 0 }; }
}

// Weekly rank history: captured lazily on renders (first render each ISO
// week stores that week's rank); the delta compares the latest two weeks.
let rankTableReady = false;
async function ensureRankTable(DB: D1Database): Promise<void> {
  if (rankTableReady) return;
  await DB.prepare(
    "CREATE TABLE IF NOT EXISTS rank_history (" +
    "user_id TEXT NOT NULL, week TEXT NOT NULL, rank INTEGER NOT NULL, " +
    "PRIMARY KEY (user_id, week))"
  ).run();
  rankTableReady = true;
}

function isoWeek(d = new Date()): string {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y = t.getUTCFullYear();
  const week = Math.ceil((((t.getTime() - Date.UTC(y, 0, 1)) / 86400000) + 1) / 7);
  return `${y}-W${String(week).padStart(2, "0")}`;
}

export async function captureAndDeltaRank(DB: D1Database, userId: string, rank: number | null): Promise<number | null> {
  if (!rank) return null;
  try {
    await ensureRankTable(DB);
    await DB.prepare(
      "INSERT OR IGNORE INTO rank_history (user_id, week, rank) VALUES (?1, ?2, ?3)"
    ).bind(userId, isoWeek(), rank).run();
    const rows = await DB.prepare(
      "SELECT week, rank FROM rank_history WHERE user_id = ?1 ORDER BY week DESC LIMIT 2"
    ).bind(userId).all<{ week: string; rank: number }>();
    const r = rows.results ?? [];
    if (r.length < 2) return null;
    return r[1].rank - r[0].rank;   // positive = climbed
  } catch { return null; }
}

// Activity rows for an arbitrary calendar year (the board's year selector).
export async function loadBoardRows(
  DB: D1Database, userId: string, year: number,
): Promise<Array<{ day: string; n: number; xp: number }>> {
  const start = Math.floor(Date.UTC(year, 0, 1) / 1000);
  const end = Math.floor(Date.UTC(year + 1, 0, 1) / 1000);
  try {
    const [xp, rd] = await Promise.all([
      DB.prepare(
        "SELECT strftime('%Y-%m-%d', at, 'unixepoch') AS day, SUM(xp) AS xp, COUNT(*) AS n " +
        "FROM xp_ledger WHERE user_id = ?1 AND at >= ?2 AND at < ?3 GROUP BY day"
      ).bind(userId, start, end).all<{ day: string; xp: number; n: number }>(),
      DB.prepare(
        "SELECT strftime('%Y-%m-%d', read_at, 'unixepoch') AS day, COUNT(*) AS n " +
        "FROM reading_progress WHERE user_id = ?1 AND read_at >= ?2 AND read_at < ?3 GROUP BY day"
      ).bind(userId, start, end).all<{ day: string; n: number }>()
        .catch(() => ({ results: [] as Array<{ day: string; n: number }> })),
    ]);
    const byDay = new Map<string, { n: number; xp: number }>();
    for (const r of xp.results ?? []) byDay.set(r.day, { n: Number(r.n) || 0, xp: Number(r.xp) || 0 });
    for (const r of rd.results ?? []) {
      const cur = byDay.get(r.day) || { n: 0, xp: 0 };
      cur.n += Number(r.n) || 0;
      byDay.set(r.day, cur);
    }
    return Array.from(byDay, ([day, v]) => ({ day, n: v.n, xp: v.xp }));
  } catch { return []; }
}

// Month-segmented board (the mock's board, server-rendered). Summary is
// computed from the same rows that paint the cells, so they can never drift.
export function renderBoardHtml(
  rows: Array<{ day: string; n: number; xp: number }>, year: number,
): { html: string; summary: string } {
  const byDay = new Map(rows.map((r) => [r.day, r]));
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const DAYS = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const lvl = (n: number, xp: number) => {
    const score = xp > 0 ? xp : n * 8;
    return score <= 0 ? 0 : score < 15 ? 1 : score < 40 ? 2 : score < 90 ? 3 : 4;
  };
  let offset = new Date(Date.UTC(year, 0, 1)).getUTCDay();
  let total = 0, activeDays = 0, streak = 0, maxStreak = 0;
  let html = '<div class="dowcol"><span></span><span>Mon</span><span></span><span>Wed</span><span></span><span>Fri</span><span></span></div>';
  for (let m = 0; m < 12; m++) {
    let cells = "";
    let moActs = 0;
    for (let b = 0; b < offset; b++) cells += '<span class="cell blank"></span>';
    for (let d = 1; d <= DAYS[m]; d++) {
      const t = Date.UTC(year, m, d);
      if (t > todayUtc) { cells += '<span class="cell"></span>'; continue; }
      const day = `${year}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const rec = byDay.get(day);
      const n = rec?.n || 0;
      const L = lvl(n, rec?.xp || 0);
      const tip = n > 0 ? `${n} activit${n === 1 ? "y" : "ies"} on ${d} ${MONTHS[m]} ${year}` : `No activity on ${d} ${MONTHS[m]} ${year}`;
      cells += `<span class="cell${L ? " l" + L : ""}" title="${tip}"></span>`;
      moActs += n;
      total += n;
      if (n > 0) { activeDays++; streak++; if (streak > maxStreak) maxStreak = streak; }
      else streak = 0;
    }
    offset = (offset + DAYS[m]) % 7;
    html += `<div class="mo"><div class="grid">${cells}</div><span class="lab">${MONTHS[m]}</span><span class="cnt">${moActs || ""}</span></div>`;
  }
  const summary = `${total.toLocaleString()} activities &middot; ${activeDays} active days &middot; max streak ${maxStreak}`;
  return { html, summary };
}

// Cumulative-XP chart over the trailing 12 months with cert milestones.
export async function renderXpChartSvg(
  DB: D1Database, userId: string,
  certs: Array<{ track_name: string; issued_at: number }>,
): Promise<string> {
  try {
    const rows = await DB.prepare(
      "SELECT strftime('%Y-%m', at, 'unixepoch') AS mo, SUM(xp) AS xp FROM xp_ledger " +
      "WHERE user_id = ?1 GROUP BY mo ORDER BY mo"
    ).bind(userId).all<{ mo: string; xp: number }>();
    const monthly = new Map((rows.results ?? []).map((r) => [r.mo, Number(r.xp) || 0]));
    if (!monthly.size) return "";
    // trailing 12 calendar months ending now
    const labels: string[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      labels.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
    }
    // cumulative XP up to and including each label month
    let before = 0;
    for (const [mo, xp] of monthly) if (mo < labels[0]) before += xp;
    const cum: number[] = [];
    let run = before;
    for (const mo of labels) { run += monthly.get(mo) || 0; cum.push(run); }
    const max = Math.max(...cum, 1);
    const W = 720, H = 190, L = 46, R = 20, T = 20, B = 40;
    const px = (i: number) => L + i * ((W - L - R) / 11);
    const py = (v: number) => H - B - (v / max) * (H - T - B);
    const pts = cum.map((v, i) => `${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(" ");
    const MABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const lab = (mo: string) => MABBR[Number(mo.slice(5)) - 1];
    let marks = "";
    for (const c of certs) {
      const mo = new Date(c.issued_at * 1000).toISOString().slice(0, 7);
      const i = labels.indexOf(mo);
      if (i < 0) continue;
      marks += `<circle cx="${px(i).toFixed(1)}" cy="${py(cum[i]).toFixed(1)}" r="5" fill="#0f7a52"/>` +
        `<text x="${px(i).toFixed(1)}" y="${(py(cum[i]) - 12).toFixed(1)}" text-anchor="middle" font-size="10.5" fill="#0f7a52" font-weight="600">${escHtml((c.track_name || "Certificate").slice(0, 26))}</text>`;
    }
    const gridY = [1 / 3, 2 / 3].map((f) => {
      const y = (T + (H - T - B) * f).toFixed(1);
      return `<line x1="${L}" y1="${y}" x2="${W - R}" y2="${y}" stroke="#f0f2f6"/>`;
    }).join("");
    const kfmt = (v: number) => v >= 1000 ? (v / 1000).toFixed(v >= 10000 ? 0 : 1) + "k" : String(v);
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Cumulative XP over the last twelve months">
      <line x1="${L}" y1="${T}" x2="${L}" y2="${H - B}" stroke="#e6e8ee"/>
      <line x1="${L}" y1="${H - B}" x2="${W - R}" y2="${H - B}" stroke="#e6e8ee"/>
      ${gridY}
      <text x="${L - 8}" y="${H - B + 3}" text-anchor="end" font-size="10" fill="#98a0ad">0</text>
      <text x="${L - 8}" y="${T + 4}" text-anchor="end" font-size="10" fill="#98a0ad">${kfmt(max)}</text>
      <polygon fill="#eef3fe" points="${px(0).toFixed(1)},${H - B} ${pts} ${px(11).toFixed(1)},${H - B}"/>
      <polyline fill="none" stroke="#2056d2" stroke-width="2.5" stroke-linejoin="round" points="${pts}"/>
      <circle cx="${px(11).toFixed(1)}" cy="${py(cum[11]).toFixed(1)}" r="5" fill="#2056d2"/>
      ${marks}
      <text x="${px(0).toFixed(1)}" y="${H - B + 17}" font-size="10" fill="#98a0ad">${lab(labels[0])}</text>
      <text x="${px(5).toFixed(1)}" y="${H - B + 17}" font-size="10" fill="#98a0ad" text-anchor="middle">${lab(labels[5])}</text>
      <text x="${px(11).toFixed(1)}" y="${H - B + 17}" font-size="10" fill="#98a0ad" text-anchor="end">${lab(labels[11])}</text>
    </svg>`;
  } catch { return ""; }
}
