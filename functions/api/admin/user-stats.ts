// GET /api/admin/user-stats?email=<addr> - one user's complete picture for the
// admin drill-down page (/admin/user.html). Admin-gated like email-stats.
//
// Blocks: account (identity, gate, consents, pro state), engagement (xp,
// streaks, freezes, last active), practice (attempts + solved, top hubs,
// this-month meter-relevant count), credentials (certificates + badges),
// library (reading + saved), email (sent/open/click totals, series position,
// recent events), and intent signals.

import type { Env, RequestData } from "../../_middleware";
import { json, err401, err403 } from "../../_lib/errors";
import { ensureIntentTable } from "../signal";

const DEFAULT_ADMIN = "selva86@gmail.com";

export const onRequestGet: PagesFunction<Env, string, RequestData> = async (context) => {
  const u = context.data.user;
  if (!u) return err401();
  const admin = (context.env as { ADMIN_EMAIL?: string }).ADMIN_EMAIL || DEFAULT_ADMIN;
  if ((u.email || "").toLowerCase() !== admin.toLowerCase()) return err403("Restricted.");

  const email = (new URL(context.request.url).searchParams.get("email") || "").trim().toLowerCase();
  if (!email) return json({ message: "email required" }, { status: 400 });

  const DB = context.env.DB;
  const now = Math.floor(Date.now() / 1000);
  await ensureIntentTable(DB);

  const row = await DB.prepare("SELECT * FROM users WHERE lower(email) = ?1 AND deleted_at IS NULL")
    .bind(email).first<Record<string, unknown>>();
  if (!row) return json({ message: "no user with that email" }, { status: 404 });
  const uid = String(row.id);
  const proUntil = Number(row.pro_until ?? 0);

  const monthStart = Math.floor(Date.UTC(
    new Date(now * 1000).getUTCFullYear(), new Date(now * 1000).getUTCMonth(), 1) / 1000);

  const attempts = await DB.prepare(
    `SELECT COUNT(*) AS n,
            SUM(CASE WHEN passed = 1 THEN 1 ELSE 0 END) AS passed,
            SUM(CASE WHEN submitted_at >= ?2 AND source IS NOT 'backfill' THEN 1 ELSE 0 END) AS month_counted,
            MAX(submitted_at) AS last_at
     FROM exercise_attempts WHERE user_id = ?1`,
  ).bind(uid, monthStart).first<{ n: number; passed: number; month_counted: number; last_at: number | null }>();

  const hubs = (await DB.prepare(
    `SELECT hub_slug, COUNT(*) AS attempts,
            SUM(CASE WHEN passed = 1 THEN 1 ELSE 0 END) AS passed,
            MAX(submitted_at) AS last_at
     FROM exercise_attempts WHERE user_id = ?1
     GROUP BY hub_slug ORDER BY last_at DESC LIMIT 10`,
  ).bind(uid).all<{ hub_slug: string; attempts: number; passed: number; last_at: number }>()).results ?? [];

  const certs = (await DB.prepare(
    `SELECT public_id, track, track_name, score, issued_at, status
     FROM certificates WHERE user_id = ?1 ORDER BY issued_at DESC`,
  ).bind(uid).all()).results ?? [];

  const badges = (await DB.prepare(
    `SELECT badge, public_id, earned_at FROM badges_earned WHERE user_id = ?1 ORDER BY earned_at DESC`,
  ).bind(uid).all()).results ?? [];

  const reading = (await DB.prepare(
    `SELECT post_slug, scroll_pct, last_section, marked_read, read_at
     FROM reading_progress WHERE user_id = ?1 ORDER BY read_at DESC LIMIT 6`,
  ).bind(uid).all()).results ?? [];
  const readingCount = await DB.prepare(
    "SELECT COUNT(*) AS n FROM reading_progress WHERE user_id = ?1").bind(uid).first<{ n: number }>();

  const savedCount = await DB.prepare(
    "SELECT COUNT(*) AS n FROM saved_posts WHERE user_id = ?1").bind(uid).first<{ n: number }>();

  const emailTotals = await DB.prepare(
    `SELECT
       SUM(CASE WHEN event = 'sent' THEN 1 ELSE 0 END) AS sent,
       COUNT(DISTINCT CASE WHEN event = 'open' THEN email_key END) AS opened_keys,
       COUNT(DISTINCT CASE WHEN event = 'click' THEN email_key END) AS clicked_keys,
       SUM(CASE WHEN event = 'unsubscribe' THEN 1 ELSE 0 END) AS unsubs
     FROM email_events WHERE user_id = ?1`,
  ).bind(uid).first<{ sent: number; opened_keys: number; clicked_keys: number; unsubs: number }>();

  const emailRecent = (await DB.prepare(
    `SELECT at, email_key, event FROM email_events WHERE user_id = ?1
     ORDER BY at DESC, id DESC LIMIT 20`,
  ).bind(uid).all()).results ?? [];

  const seqPos = await DB.prepare(
    `SELECT MAX(CAST(substr(email_key, 5) AS INTEGER)) AS pos, COUNT(*) AS n
     FROM sent_emails WHERE user_id = ?1 AND email_key LIKE 'seq:%'`,
  ).bind(uid).first<{ pos: number | null; n: number }>();

  const signals = (await DB.prepare(
    `SELECT at, signal, path FROM intent_signals WHERE user_id = ?1
     ORDER BY at DESC LIMIT 30`,
  ).bind(uid).all()).results ?? [];

  return json({
    account: {
      email: row.email, display_name: row.display_name, handle: row.handle,
      country: row.country, created_at: row.created_at, role: row.role,
      signup_gate: row.signup_gate, signup_slug: row.signup_slug,
      pass_claimed_at: row.pass_claimed_at,
      pro: proUntil === -1 || proUntil > now,
      pro_until: proUntil,
      email_status: row.email_status ?? "ok",
      consents: {
        progress: row.email_progress ?? 1,
        nurture: row.email_nurture ?? 0,
        offers: row.email_offers ?? 0,
      },
    },
    engagement: {
      total_xp: row.total_xp ?? 0,
      current_streak_days: row.current_streak_days ?? 0,
      longest_streak_days: row.longest_streak_days ?? 0,
      streak_freezes: row.streak_freezes ?? 0,
      last_active_date: row.last_active_date ?? null,
    },
    practice: {
      attempts: attempts?.n ?? 0, solved: attempts?.passed ?? 0,
      month_counted: attempts?.month_counted ?? 0, last_at: attempts?.last_at ?? null,
      hubs,
    },
    credentials: { certificates: certs, badges },
    library: { reading, reading_count: readingCount?.n ?? 0, saved_count: savedCount?.n ?? 0 },
    email: {
      sent: emailTotals?.sent ?? 0, opened_keys: emailTotals?.opened_keys ?? 0,
      clicked_keys: emailTotals?.clicked_keys ?? 0, unsubs: emailTotals?.unsubs ?? 0,
      series_position: seqPos?.pos ?? null, series_received: seqPos?.n ?? 0,
      recent: emailRecent,
    },
    signals,
  });
};
