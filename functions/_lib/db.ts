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
