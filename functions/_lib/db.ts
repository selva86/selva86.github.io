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
export async function upsertUserFromSupabase(
  db: D1Database,
  row: { id: string; email: string; display_name?: string; avatar_url?: string; country?: string },
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  await db
    .prepare(
      `INSERT INTO users (id, email, display_name, avatar_url, country, created_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         email        = excluded.email,
         display_name = COALESCE(excluded.display_name, users.display_name),
         avatar_url   = COALESCE(excluded.avatar_url, users.avatar_url),
         country      = COALESCE(excluded.country, users.country)`,
    )
    .bind(row.id, row.email, row.display_name ?? null, row.avatar_url ?? null, row.country ?? null, now)
    .run();
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
