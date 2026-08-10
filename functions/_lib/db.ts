// D1 helpers. Keep raw SQL here, never in endpoint handlers (easier to audit + reuse).

export interface User {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  handle: string | null;
  country: string | null;
  timezone: string | null;
  created_at: number;
  pro_until: number | null;
  paddle_customer_id: string | null;
  razorpay_customer_id: string | null;
  newsletter_opt_in: number;
  newsletter_subscribed_at: number | null;
  public_profile: number;
  total_xp: number;
  current_streak_days: number;
  longest_streak_days: number;
  last_active_date: string | null;
  role: string;
  deleted_at: number | null;
}

export async function getUserById(db: D1Database, id: string): Promise<User | null> {
  return await db
    .prepare("SELECT * FROM users WHERE id = ? AND deleted_at IS NULL")
    .bind(id)
    .first<User>();
}

export async function getUserByEmail(db: D1Database, email: string): Promise<User | null> {
  return await db
    .prepare("SELECT * FROM users WHERE email = ? AND deleted_at IS NULL")
    .bind(email)
    .first<User>();
}

// Upsert called from Supabase Auth webhook on user.created / user.updated,
// and from /api/me as a lazy-create fallback when JWT validates but no D1
// row exists (Phase 1.6 — webhook race / pre-webhook signups).
let avatarKeyEnsured = false;
async function ensureAvatarKeyColumn(db: D1Database): Promise<void> {
  if (avatarKeyEnsured) return;
  try { await db.prepare("ALTER TABLE users ADD COLUMN avatar_key TEXT").run(); } catch { /* exists */ }
  avatarKeyEnsured = true;
}

export async function upsertUserFromSupabase(
  db: D1Database,
  row: { id: string; email: string; display_name?: string; avatar_url?: string; country?: string },
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  // avatar_key set = the learner uploaded their own picture; the OAuth
  // provider picture must never clobber it on later sign-ins.
  await ensureAvatarKeyColumn(db);
  const sql =
    `INSERT INTO users (id, email, display_name, avatar_url, country, created_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       email        = excluded.email,
       display_name = COALESCE(excluded.display_name, users.display_name),
       avatar_url   = CASE WHEN users.avatar_key IS NOT NULL THEN users.avatar_url
                           ELSE COALESCE(excluded.avatar_url, users.avatar_url) END,
       country      = COALESCE(excluded.country, users.country)`;
  const bind = [row.id, row.email, row.display_name ?? null, row.avatar_url ?? null, row.country ?? null, now];
  try {
    await db.prepare(sql).bind(...bind).run();
  } catch {
    // pre-migration fallback: the exact pre-avatar_key statement, so a
    // failed ALTER can never break signups
    await db.prepare(
      `INSERT INTO users (id, email, display_name, avatar_url, country, created_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         email        = excluded.email,
         display_name = COALESCE(excluded.display_name, users.display_name),
         avatar_url   = COALESCE(excluded.avatar_url, users.avatar_url),
         country      = COALESCE(excluded.country, users.country)`,
    ).bind(...bind).run();
  }
}

// ===== Newsletter consent sync (Phase 6 / Phase A) =====
// Records a newsletter opt-in captured at signup (Supabase user_metadata on
// the magic-link path, localStorage replay via /api/newsletter/claim-optin on
// the OAuth path). Idempotent; never downgrades. Only an explicit unsubscribe
// flow may set users.newsletter_opt_in back to 0 or touch unsubscribed_at.
//
// Guard: if this email previously unsubscribed (newsletter_subs.unsubscribed_at
// set), all passive sync paths no-op — the signup metadata keeps saying
// marketing_opt_in=true forever, and it must not resurrect a dead subscription.
export async function recordNewsletterOptIn(
  db: D1Database,
  args: { userId: string; email: string; source: string },
): Promise<{ recorded: boolean }> {
  const now = Math.floor(Date.now() / 1000);
  const sub = await db
    .prepare("SELECT unsubscribed_at FROM newsletter_subs WHERE email = ?")
    .bind(args.email)
    .first<{ unsubscribed_at: number | null }>();
  if (sub?.unsubscribed_at) return { recorded: false };

  await db
    .prepare(
      `UPDATE users SET
         newsletter_opt_in = 1,
         newsletter_subscribed_at = COALESCE(newsletter_subscribed_at, ?)
       WHERE id = ? AND deleted_at IS NULL`,
    )
    .bind(now, args.userId)
    .run();
  // Account signups are already email-verified + explicitly ticked, so
  // confirmed_at is set on first opt-in (no double opt-in needed; see plan).
  await db
    .prepare(
      `INSERT INTO newsletter_subs (email, user_id, confirmed_at, source)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(email) DO UPDATE SET
         user_id      = COALESCE(newsletter_subs.user_id, excluded.user_id),
         confirmed_at = COALESCE(newsletter_subs.confirmed_at, excluded.confirmed_at),
         source       = COALESCE(newsletter_subs.source, excluded.source)`,
    )
    .bind(args.email, args.userId, now, args.source)
    .run();
  return { recorded: true };
}

export function isProActive(user: User | null, nowSec = Math.floor(Date.now() / 1000)): boolean {
  if (!user || !user.pro_until) return false;
  if (user.pro_until === -1) return true; // lifetime
  return user.pro_until > nowSec;
}

// ===== Sessions (Phase 1.4) =====
export interface SessionRow {
  session_id: string;
  user_id: string;
  device: string | null;
  user_agent: string | null;
  created_at: number;
  expires_at: number;
  revoked_at: number | null;
  last_seen_at: number | null;
}

// Upsert called by middleware on every authenticated request. INSERT OR IGNORE
// on first sight of a session_id (creates the row); ALWAYS bumps last_seen_at
// on subsequent calls (throttled by middleware so we don't write on every page
// load — see TOUCH_THROTTLE_SEC in _middleware).
export async function upsertSession(
  db: D1Database,
  row: { session_id: string; user_id: string; device: string; user_agent: string; expires_at: number },
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  await db
    .prepare(
      `INSERT INTO sessions (session_id, user_id, device, user_agent, created_at, expires_at, last_seen_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(session_id) DO UPDATE SET
         last_seen_at = excluded.last_seen_at,
         device       = COALESCE(sessions.device, excluded.device),
         user_agent   = COALESCE(sessions.user_agent, excluded.user_agent)`,
    )
    .bind(row.session_id, row.user_id, row.device, row.user_agent, now, row.expires_at, now)
    .run();
}

export async function getActiveSessions(
  db: D1Database, userId: string,
): Promise<SessionRow[]> {
  const result = await db
    .prepare(
      `SELECT session_id, user_id, device, user_agent, created_at, expires_at, revoked_at, last_seen_at
       FROM sessions WHERE user_id = ? AND revoked_at IS NULL
       ORDER BY last_seen_at DESC NULLS LAST`,
    )
    .bind(userId)
    .all<SessionRow>();
  return result.results || [];
}

export async function revokeSession(
  db: D1Database, kv: KVNamespace, userId: string, sessionId: string,
): Promise<boolean> {
  const now = Math.floor(Date.now() / 1000);
  // Only revoke if it belongs to this user (defensive). Returns rows affected.
  const result = await db
    .prepare("UPDATE sessions SET revoked_at = ? WHERE session_id = ? AND user_id = ? AND revoked_at IS NULL")
    .bind(now, sessionId, userId)
    .run();
  if ((result.meta?.changes ?? 0) === 0) return false;
  // Add to KV revoked list with TTL = ~JWT max-lifetime (1h default; bump a bit for safety).
  await kv.put(`revoked:${sessionId}`, "1", { expirationTtl: 7200 }).catch(() => {});
  return true;
}

export async function revokeAllSessions(
  db: D1Database, kv: KVNamespace, userId: string,
): Promise<number> {
  const now = Math.floor(Date.now() / 1000);
  // Fetch active session_ids first so we can KV-revoke each.
  const result = await db
    .prepare("SELECT session_id FROM sessions WHERE user_id = ? AND revoked_at IS NULL")
    .bind(userId)
    .all<{ session_id: string }>();
  const ids = (result.results || []).map(r => r.session_id);
  await db
    .prepare("UPDATE sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL")
    .bind(now, userId)
    .run();
  await Promise.all(ids.map(id => kv.put(`revoked:${id}`, "1", { expirationTtl: 7200 }).catch(() => {})));
  return ids.length;
}

export async function isSessionRevoked(kv: KVNamespace, sessionId: string): Promise<boolean> {
  const v = await kv.get(`revoked:${sessionId}`);
  return v === "1";
}

// ===== Reading progress (Phase 2) =====
export interface ReadingProgressRow {
  user_id: string;
  post_slug: string;
  scroll_pct: number | null;
  last_section: string | null;
  read_at: number | null;
  marked_read: number; // 0 or 1
}

export type ReadingKind = "in_progress" | "read" | "all";

// In-progress definition: actively-read but not yet finished. Excludes posts
// the user explicitly marked read or scrolled past 90% (we treat that as
// effectively done so the Continue chip doesn't suggest a tutorial they
// already finished).
const IN_PROGRESS_MIN = 5;
const IN_PROGRESS_MAX = 90;

export async function getReadingProgress(
  db: D1Database, userId: string, slug: string,
): Promise<ReadingProgressRow | null> {
  return await db
    .prepare(
      `SELECT user_id, post_slug, scroll_pct, last_section, read_at, marked_read
       FROM reading_progress WHERE user_id = ? AND post_slug = ?`,
    )
    .bind(userId, slug)
    .first<ReadingProgressRow>();
}

// Idempotent upsert. Only the fields you pass are updated; omitted fields
// preserve their stored value. This is critical so that a scroll-tracking
// POST doesn't accidentally clear marked_read (and vice versa).
export async function upsertReadingProgress(
  db: D1Database,
  userId: string,
  slug: string,
  patch: { scroll_pct?: number; last_section?: string; marked_read?: boolean },
): Promise<ReadingProgressRow> {
  const now = Math.floor(Date.now() / 1000);
  // Clamp scroll_pct to [0, 100]; coerce undefined → null for binding.
  const scrollPct =
    typeof patch.scroll_pct === "number"
      ? Math.max(0, Math.min(100, Math.round(patch.scroll_pct)))
      : null;
  const lastSection =
    typeof patch.last_section === "string" ? patch.last_section.slice(0, 200) : null;
  const markedRead =
    typeof patch.marked_read === "boolean" ? (patch.marked_read ? 1 : 0) : null;

  // ON CONFLICT preserves prior values when the incoming bind is NULL. COALESCE
  // chooses the incoming value when not-null, else falls back to the stored
  // value. read_at is always bumped to "now" because any POST means activity.
  await db
    .prepare(
      `INSERT INTO reading_progress (user_id, post_slug, scroll_pct, last_section, read_at, marked_read)
       VALUES (?, ?, ?, ?, ?, COALESCE(?, 0))
       ON CONFLICT(user_id, post_slug) DO UPDATE SET
         scroll_pct   = COALESCE(excluded.scroll_pct,   reading_progress.scroll_pct),
         last_section = COALESCE(excluded.last_section, reading_progress.last_section),
         read_at      = excluded.read_at,
         marked_read  = COALESCE(?, reading_progress.marked_read)`,
    )
    .bind(userId, slug, scrollPct, lastSection, now, markedRead, markedRead)
    .run();

  const row = await getReadingProgress(db, userId, slug);
  // Row must exist after the upsert; return non-null guarantee for the caller.
  return row as ReadingProgressRow;
}

export async function listReadingProgress(
  db: D1Database,
  userId: string,
  opts: { kind: ReadingKind; limit: number; offset: number },
): Promise<{ items: ReadingProgressRow[]; has_more: boolean }> {
  let where = "user_id = ?";
  const binds: unknown[] = [userId];
  if (opts.kind === "in_progress") {
    where += " AND marked_read = 0 AND scroll_pct >= ? AND scroll_pct < ?";
    binds.push(IN_PROGRESS_MIN, IN_PROGRESS_MAX);
  } else if (opts.kind === "read") {
    where += " AND (marked_read = 1 OR scroll_pct >= ?)";
    binds.push(IN_PROGRESS_MAX);
  }
  // Fetch one extra to detect has_more (same pattern as /api/me/saved).
  const result = await db
    .prepare(
      `SELECT user_id, post_slug, scroll_pct, last_section, read_at, marked_read
       FROM reading_progress
       WHERE ${where}
       ORDER BY read_at DESC NULLS LAST
       LIMIT ? OFFSET ?`,
    )
    .bind(...binds, opts.limit + 1, opts.offset)
    .all<ReadingProgressRow>();
  const rows = result.results || [];
  const has_more = rows.length > opts.limit;
  return { items: rows.slice(0, opts.limit), has_more };
}

// ===== Exercises + XP + streak (Phase 3) =====
import { utcDay, isYesterdayUtc } from "./exercises";

export interface AttemptResult {
  xp_awarded_now: number;     // 0 if this wasn't a first-pass
  total_xp: number;           // user's running total after this attempt
  current_streak_days: number;
  longest_streak_days: number;
  first_pass: boolean;        // true if this attempt was the first-ever pass for this exercise
  streak_freezes: number;     // banked freezes after this attempt (0-2)
  freeze_used_today: boolean; // a freeze bridged yesterday's gap on this touch
}

export interface UserStats {
  total_xp: number;
  current_streak_days: number;
  longest_streak_days: number;
  last_active_date: string | null;
}

// Record an attempt. Always inserts into exercise_attempts (every attempt
// logged for analytics). On a passing attempt, attempts to claim the
// first-pass XP via the partial UNIQUE index on (user_id, hub_slug,
// exercise_id) WHERE passed=1 — second concurrent first-pass insert from
// another tab fails silently, so xp is awarded exactly once.
//
// Streak is touched only on passes (failed attempts don't extend streaks).
// Streak day-boundary is UTC; see _lib/exercises.ts utcDay() rationale.
export async function recordAttempt(
  db: D1Database,
  userId: string,
  hubSlug: string,
  exerciseId: string,
  passed: boolean,
  hintsUsed: number,
  xpIfFirstPass: number,
): Promise<AttemptResult> {
  const now = Math.floor(Date.now() / 1000);

  let xpAwarded = 0;
  let firstPass = false;

  if (passed) {
    // Atomic claim of first-pass via the partial UNIQUE index. The first
    // INSERT with passed=1 for this (user, hub, exercise) succeeds; any
    // subsequent first-pass insert hits the unique constraint and is
    // turned into a no-op by INSERT OR IGNORE. This is our race-free
    // "did I already award XP for this?" check.
    const insRes = await db
      .prepare(
        `INSERT OR IGNORE INTO exercise_attempts
           (user_id, hub_slug, exercise_id, passed, hints_used, xp_awarded, submitted_at)
         VALUES (?, ?, ?, 1, ?, ?, ?)`,
      )
      .bind(userId, hubSlug, exerciseId, hintsUsed, xpIfFirstPass, now)
      .run();
    firstPass = (insRes.meta?.changes ?? 0) === 1;
    if (firstPass) {
      xpAwarded = xpIfFirstPass;
      // Audit log: one xp_ledger row per XP grant.
      await db
        .prepare(
          `INSERT INTO xp_ledger (user_id, action, ref, xp, at)
           VALUES (?, 'exercise.passed', ?, ?, ?)`,
        )
        .bind(userId, `${hubSlug}/${exerciseId}`, xpAwarded, now)
        .run();
      await db
        .prepare("UPDATE users SET total_xp = total_xp + ? WHERE id = ?")
        .bind(xpAwarded, userId)
        .run();
    } else {
      // Wasn't a first-pass (already solved before, or another tab won the
      // race). Still record this attempt for analytics — passed=1 but
      // xp_awarded=0. The partial UNIQUE index would block another
      // passed=1 insert, so we record as passed=0 to keep the log honest
      // about the *attempt result* without re-awarding XP. (Alternative
      // considered: a separate retries table; rejected as over-engineering.)
      await db
        .prepare(
          `INSERT INTO exercise_attempts
             (user_id, hub_slug, exercise_id, passed, hints_used, xp_awarded, submitted_at)
           VALUES (?, ?, ?, 0, ?, 0, ?)`,
        )
        .bind(userId, hubSlug, exerciseId, hintsUsed, now)
        .run();
    }
  } else {
    // Failing attempt: plain insert, no XP, no streak touch.
    await db
      .prepare(
        `INSERT INTO exercise_attempts
           (user_id, hub_slug, exercise_id, passed, hints_used, xp_awarded, submitted_at)
         VALUES (?, ?, ?, 0, ?, 0, ?)`,
      )
      .bind(userId, hubSlug, exerciseId, hintsUsed, now)
      .run();
  }

  // Touch streak on any pass (whether or not it was a first-pass — engaging
  // with previously-solved exercises still counts as "showed up today").
  let freezeUsed = false;
  if (passed) {
    freezeUsed = (await touchStreak(db, userId, now)).freezeUsed;
  }

  const stats = await getStats(db, userId);
  const fz = await db
    .prepare("SELECT COALESCE(streak_freezes, 0) AS n FROM users WHERE id = ?")
    .bind(userId)
    .first<{ n: number }>()
    .catch(() => ({ n: 0 } as { n: number }));
  return {
    xp_awarded_now: xpAwarded,
    total_xp: stats.total_xp,
    current_streak_days: stats.current_streak_days,
    longest_streak_days: stats.longest_streak_days,
    first_pass: firstPass,
    streak_freezes: Number((fz as { n?: number })?.n ?? 0),
    freeze_used_today: freezeUsed,
  };
}

let freezeColReady = false;
async function ensureFreezeColumn(db: D1Database): Promise<void> {
  if (freezeColReady) return;
  try { await db.prepare("ALTER TABLE users ADD COLUMN streak_freezes INTEGER DEFAULT 0").run(); }
  catch { /* exists */ }
  freezeColReady = true;
}

function utcGapDays(lastDay: string, today: string): number {
  const a = Date.parse(lastDay + "T00:00:00Z");
  const b = Date.parse(today + "T00:00:00Z");
  if (!a || !b) return 999;
  return Math.round((b - a) / 86400000);
}

// Streak math. Reads current state, applies one of five transitions, writes
// back. Idempotent within a single UTC day (multiple calls same-day are
// no-ops after the first).
//
// Freeze rules (profile v3 pass 2): a banked freeze bridges EXACTLY one
// missed day (gap of 2); longer gaps always reset. One freeze is earned at
// every 7-day multiple, capped at 2. Consumption is an atomic decrement
// guarded by freezes > 0, so a concurrent double-touch cannot double-spend.
// Any failure in the freeze branch falls back to the pre-freeze behavior.
export async function touchStreak(
  db: D1Database, userId: string, nowSec: number,
): Promise<{ freezeUsed: boolean }> {
  const today = utcDay(nowSec);
  await ensureFreezeColumn(db);
  const row = await db
    .prepare(
      "SELECT last_active_date, current_streak_days, longest_streak_days, COALESCE(streak_freezes, 0) AS streak_freezes FROM users WHERE id = ?",
    )
    .bind(userId)
    .first<{
      last_active_date: string | null;
      current_streak_days: number;
      longest_streak_days: number;
      streak_freezes: number;
    }>();
  if (!row) return { freezeUsed: false }; // defensive bail

  const last = row.last_active_date;
  let current = row.current_streak_days ?? 0;
  const longest = row.longest_streak_days ?? 0;
  let freezeUsed = false;

  if (last === today) {
    return { freezeUsed: false }; // already counted today
  } else if (last && isYesterdayUtc(last, today)) {
    current += 1;
  } else if (last && utcGapDays(last, today) === 2 && (row.streak_freezes ?? 0) > 0) {
    // exactly one missed day and a freeze is banked: try to spend it
    try {
      const spend = await db
        .prepare("UPDATE users SET streak_freezes = streak_freezes - 1 WHERE id = ? AND streak_freezes > 0")
        .bind(userId)
        .run();
      if (spend.meta.changes) {
        current += 1;          // the streak survives the bridge
        freezeUsed = true;
      } else {
        current = 1;           // race lost: normal reset
      }
    } catch {
      current = 1;             // freeze machinery failing = old behavior
    }
  } else {
    // null OR a gap freezes cannot bridge → fresh streak
    current = 1;
  }
  const newLongest = current > longest ? current : longest;
  await db
    .prepare(
      `UPDATE users SET
         current_streak_days = ?,
         longest_streak_days = ?,
         last_active_date    = ?
       WHERE id = ?`,
    )
    .bind(current, newLongest, today, userId)
    .run();

  // Earn a freeze at each full week of streak (cap 2). The last==today guard
  // above means this runs at most once per user per day.
  if (current > 0 && current % 7 === 0) {
    try {
      await db
        .prepare("UPDATE users SET streak_freezes = MIN(2, COALESCE(streak_freezes, 0) + 1) WHERE id = ?")
        .bind(userId)
        .run();
    } catch { /* earning is best-effort */ }
  }
  return { freezeUsed };
}

export async function getStats(db: D1Database, userId: string): Promise<UserStats> {
  const row = await db
    .prepare(
      `SELECT total_xp, current_streak_days, longest_streak_days, last_active_date
       FROM users WHERE id = ?`,
    )
    .bind(userId)
    .first<UserStats>();
  return row ?? {
    total_xp: 0,
    current_streak_days: 0,
    longest_streak_days: 0,
    last_active_date: null,
  };
}

export async function listSolvedInHub(
  db: D1Database, userId: string, hubSlug: string,
): Promise<string[]> {
  const result = await db
    .prepare(
      `SELECT exercise_id FROM exercise_attempts
       WHERE user_id = ? AND hub_slug = ? AND passed = 1`,
    )
    .bind(userId, hubSlug)
    .all<{ exercise_id: string }>();
  return (result.results || []).map(r => r.exercise_id);
}

// Backfill many anon-era solves in one call. Each item awards XP if it's a
// first-pass (per the same UNIQUE-index dedup as recordAttempt). Caller has
// already validated every (hub, exercise_id) against the manifest. Returns
// counts so the client can report "N solves restored".
//
// Streak is touched once at the END with "now" so backfilling doesn't lie
// about historical engagement.
// Build a Map<hub_slug, Set<exercise_id>> of every passed exercise for a
// user. Used by /api/me/tracks to compute per-track progress in O(1) per
// (hub, exercise) lookup. Single query, no joins.
export async function getSolvedByHub(
  db: D1Database, userId: string,
): Promise<Map<string, Set<string>>> {
  const result = await db
    .prepare(
      `SELECT hub_slug, exercise_id FROM exercise_attempts
       WHERE user_id = ? AND passed = 1`,
    )
    .bind(userId)
    .all<{ hub_slug: string; exercise_id: string }>();
  const out = new Map<string, Set<string>>();
  for (const r of result.results || []) {
    let s = out.get(r.hub_slug);
    if (!s) { s = new Set(); out.set(r.hub_slug, s); }
    s.add(r.exercise_id);
  }
  return out;
}

// ===== Certificates (Phase 5) =====
export interface CertificateRow {
  id: string;
  user_id: string;
  track: string;
  score: number | null;
  issued_at: number;
  pdf_r2_key: string | null;
  revoked_at: number | null;
  revoke_reason: string | null;
  public_id: string | null;
  track_name: string | null;
  recipient_name: string | null;
  skills_json: string | null;
  status: string;
  email_sent_at: number | null;
  evidence_json: string | null;
}

// Mint a certificate. Idempotent: if the same user already has an active or
// unlisted cert for this track, returns that one. The partial UNIQUE index
// idx_certs_user_track_active is the race-free guard (two tabs minting at
// once: second INSERT fails, we fall through to the lookup).
//
// xp_ledger + users.total_xp bumped only on a truly new mint. Email send
// is left to the endpoint (it's I/O-bound and shouldn't block the DB tx).
export async function mintCertificate(
  db: D1Database,
  args: {
    userId: string;
    trackId: string;
    trackName: string;
    recipientName: string;
    skills: unknown;          // serialised to JSON
    evidence: string[];       // hub URLs used as evidence
    publicId: string;         // pre-generated by caller (generatePublicId)
    rowId: string;            // primary key (separate from public_id for backward compat with existing schema)
    xpAward: number;
  },
): Promise<{ cert: CertificateRow; newly_minted: boolean }> {
  const now = Math.floor(Date.now() / 1000);
  const skillsJson = JSON.stringify(args.skills);
  const evidenceJson = JSON.stringify(args.evidence);

  // First, see if one already exists (active or unlisted). If so, no-op.
  const existing = await db
    .prepare(
      `SELECT * FROM certificates
       WHERE user_id = ? AND track = ? AND status != 'revoked'
       LIMIT 1`,
    )
    .bind(args.userId, args.trackId)
    .first<CertificateRow>();
  if (existing) {
    return { cert: existing, newly_minted: false };
  }

  // INSERT OR IGNORE leans on the partial UNIQUE index. If a concurrent
  // request beat us to it, our INSERT is a no-op and we re-read the row.
  const insRes = await db
    .prepare(
      `INSERT OR IGNORE INTO certificates
         (id, user_id, track, issued_at, public_id, track_name,
          recipient_name, skills_json, status, evidence_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
    )
    .bind(
      args.rowId, args.userId, args.trackId, now,
      args.publicId, args.trackName, args.recipientName, skillsJson, evidenceJson,
    )
    .run();
  const newlyMinted = (insRes.meta?.changes ?? 0) === 1;

  if (newlyMinted) {
    await db
      .prepare(
        `INSERT INTO xp_ledger (user_id, action, ref, xp, at)
         VALUES (?, 'cert.earned', ?, ?, ?)`,
      )
      .bind(args.userId, `cert/${args.trackId}/${args.publicId}`, args.xpAward, now)
      .run();
    await db
      .prepare("UPDATE users SET total_xp = total_xp + ? WHERE id = ?")
      .bind(args.xpAward, args.userId)
      .run();
  }

  const cert = await db
    .prepare(
      `SELECT * FROM certificates
       WHERE user_id = ? AND track = ? AND status != 'revoked'
       LIMIT 1`,
    )
    .bind(args.userId, args.trackId)
    .first<CertificateRow>();
  return { cert: cert as CertificateRow, newly_minted: newlyMinted };
}

// Public verify-page lookup. Only returns non-revoked rows; the calling
// endpoint differentiates 404 (unknown) from 410 (revoked) by also doing
// an admin lookup if the public ID is well-formed.
export async function getCertificateByPublicId(
  db: D1Database, publicId: string,
): Promise<CertificateRow | null> {
  return await db
    .prepare("SELECT * FROM certificates WHERE public_id = ? LIMIT 1")
    .bind(publicId)
    .first<CertificateRow>();
}

export async function listCertificates(
  db: D1Database, userId: string,
): Promise<CertificateRow[]> {
  const result = await db
    .prepare(
      `SELECT * FROM certificates
       WHERE user_id = ? AND status != 'revoked'
       ORDER BY issued_at DESC`,
    )
    .bind(userId)
    .all<CertificateRow>();
  return result.results || [];
}

// User-initiated revoke: cert disappears from public verify URL but the row
// is preserved so the user can un-revoke. Status flips active <-> unlisted.
export async function setCertificateStatus(
  db: D1Database, userId: string, publicId: string, status: "active" | "unlisted",
): Promise<boolean> {
  const result = await db
    .prepare(
      `UPDATE certificates SET status = ?
       WHERE user_id = ? AND public_id = ? AND status != 'revoked'`,
    )
    .bind(status, userId, publicId)
    .run();
  return (result.meta?.changes ?? 0) > 0;
}

// Update recipient_name to current users.display_name. Used by the
// "Regenerate name" button — for users who changed their display_name
// after minting and want the cert to reflect the new name.
export async function regenerateRecipientName(
  db: D1Database, userId: string, publicId: string,
): Promise<{ updated: boolean; recipient_name: string | null }> {
  const user = await db
    .prepare("SELECT display_name, email FROM users WHERE id = ?")
    .bind(userId)
    .first<{ display_name: string | null; email: string | null }>();
  if (!user) return { updated: false, recipient_name: null };
  const name = user.display_name || (user.email ? user.email.split("@")[0] : "Learner");
  const result = await db
    .prepare(
      `UPDATE certificates SET recipient_name = ?
       WHERE user_id = ? AND public_id = ? AND status != 'revoked'`,
    )
    .bind(name, userId, publicId)
    .run();
  return { updated: (result.meta?.changes ?? 0) > 0, recipient_name: name };
}

export async function backfillAttempts(
  db: D1Database,
  userId: string,
  items: Array<{ hub: string; exercise_id: string; xp: number }>,
): Promise<{ recorded: number; total_xp_added: number }> {
  const now = Math.floor(Date.now() / 1000);
  let recorded = 0;
  let xpAdded = 0;
  for (const it of items) {
    const insRes = await db
      .prepare(
        `INSERT OR IGNORE INTO exercise_attempts
           (user_id, hub_slug, exercise_id, passed, hints_used, xp_awarded, submitted_at, source)
         VALUES (?, ?, ?, 1, 0, ?, ?, 'backfill')`,
      )
      .bind(userId, it.hub, it.exercise_id, it.xp, now)
      .run();
    if ((insRes.meta?.changes ?? 0) === 1) {
      recorded += 1;
      xpAdded += it.xp;
      await db
        .prepare(
          `INSERT INTO xp_ledger (user_id, action, ref, xp, at)
           VALUES (?, 'exercise.backfill', ?, ?, ?)`,
        )
        .bind(userId, `${it.hub}/${it.exercise_id}`, it.xp, now)
        .run();
    }
  }
  if (xpAdded > 0) {
    await db
      .prepare("UPDATE users SET total_xp = total_xp + ? WHERE id = ?")
      .bind(xpAdded, userId)
      .run();
    // Single streak touch at "now" — backfill represents recent engagement,
    // not a reconstruction of historical activity.
    await touchStreak(db, userId, now);
  }
  return { recorded, total_xp_added: xpAdded };
}
