// GET /api/admin/email-stats - everything the email dashboard shows, one JSON.
//
// Blocks: mode (flag states), totals (7/30d), per-email performance, lifecycle
// state distribution (derived, matching email-program-v2 s2), hot leads
// (intent signals joined to users, cap-hitters, pass-deadline cohort),
// friction (signups never activated, wall-hits without purchase, suppressed
// addresses), and the recent event feed. Admin-gated like /api/admin/stats.

import type { Env, RequestData } from "../../_middleware";
import { json, err401, err403 } from "../../_lib/errors";
import { ensureIntentTable } from "../signal";

const DEFAULT_ADMIN = "selva86@gmail.com";

export const onRequestGet: PagesFunction<Env, string, RequestData> = async (context) => {
  const u = context.data.user;
  if (!u) return err401();
  const admin = (context.env as { ADMIN_EMAIL?: string }).ADMIN_EMAIL || DEFAULT_ADMIN;
  if ((u.email || "").toLowerCase() !== admin.toLowerCase()) return err403("Restricted.");

  const DB = context.env.DB;
  const KV = context.env.KV;
  const now = Math.floor(Date.now() / 1000);
  const d7 = now - 7 * 86400;
  const d21 = now - 21 * 86400;
  const d30 = now - 30 * 86400;
  await ensureIntentTable(DB);

  // ---- mode / flags -------------------------------------------------------
  const flagNames = ["email-engine", "email-live", "welcome-email", "lifecycle-engine",
    "cap-email", "da-pass", "exercise-meter", "cart-recovery"];
  const flags: Record<string, boolean> = {};
  for (const f of flagNames) flags[f] = (await KV.get(`flag:${f}`)) === "on";

  // ---- per-email performance (events x keys) ------------------------------
  const perEmail = (await DB.prepare(
    `SELECT email_key, event, COUNT(*) AS n, MAX(at) AS last_at
     FROM email_events WHERE email_key IS NOT NULL GROUP BY email_key, event`,
  ).all<{ email_key: string; event: string; n: number; last_at: number }>()).results ?? [];

  // Engagement events arrive from the webhook without an email_key (ZeptoMail
  // does not echo it), so opens/clicks/bounces are program-level for now.
  const engagement = (await DB.prepare(
    `SELECT event, COUNT(*) AS n,
            SUM(CASE WHEN at >= ?1 THEN 1 ELSE 0 END) AS n7,
            SUM(CASE WHEN at >= ?2 THEN 1 ELSE 0 END) AS n30
     FROM email_events GROUP BY event`,
  ).bind(d7, d30).all<{ event: string; n: number; n7: number; n30: number }>()).results ?? [];

  // ---- lifecycle states (derived; matches email-program-v2 s2) ------------
  const states = await DB.prepare(
    `SELECT
       SUM(CASE WHEN pro_until = -1 OR pro_until > ?1 THEN 1 ELSE 0 END) AS s4_pro,
       SUM(CASE WHEN (pro_until IS NULL OR (pro_until != -1 AND pro_until <= ?1))
                 AND pro_until IS NOT NULL AND pro_until > 0 THEN 1 ELSE 0 END) AS s6_churned,
       SUM(CASE WHEN (pro_until IS NULL OR pro_until = 0)
                 AND created_at > ?2 THEN 1 ELSE 0 END) AS s1_new,
       SUM(CASE WHEN (pro_until IS NULL OR pro_until = 0) AND created_at <= ?2
                 AND EXISTS (SELECT 1 FROM sessions s WHERE s.user_id = users.id AND s.last_seen_at > ?3)
                THEN 1 ELSE 0 END) AS s2_active,
       COUNT(*) AS total
     FROM users WHERE deleted_at IS NULL`,
  ).bind(now, d30, d21).first<{ s4_pro: number; s6_churned: number; s1_new: number; s2_active: number; total: number }>();
  const s = states || { s4_pro: 0, s6_churned: 0, s1_new: 0, s2_active: 0, total: 0 };
  const s3_dormant = Math.max(0, (s.total || 0) - (s.s4_pro || 0) - (s.s6_churned || 0) - (s.s1_new || 0) - (s.s2_active || 0));

  // ---- signup gates (where accounts come from) ----------------------------
  const gates = (await DB.prepare(
    `SELECT COALESCE(signup_gate, 'unknown') AS gate, COUNT(*) AS n,
            SUM(CASE WHEN created_at >= ?1 THEN 1 ELSE 0 END) AS n30
     FROM users WHERE deleted_at IS NULL GROUP BY gate ORDER BY n DESC`,
  ).bind(d30).all<{ gate: string; n: number; n30: number }>()).results ?? [];

  // ---- hot leads -----------------------------------------------------------
  const hotSignals = (await DB.prepare(
    `SELECT i.at, i.signal, i.path, u.email, u.display_name,
            CASE WHEN u.pro_until = -1 OR u.pro_until > ?1 THEN 1 ELSE 0 END AS pro
     FROM intent_signals i LEFT JOIN users u ON u.id = i.user_id
     WHERE i.at >= ?2 AND i.user_id IS NOT NULL
     ORDER BY i.at DESC LIMIT 30`,
  ).bind(now, d7).all<{ at: number; signal: string; path: string | null; email: string | null; display_name: string | null; pro: number }>()).results ?? [];

  const monthStart = Math.floor(Date.UTC(new Date(now * 1000).getUTCFullYear(), new Date(now * 1000).getUTCMonth(), 1) / 1000);
  const capUsers = (await DB.prepare(
    `SELECT u.email, u.display_name, COUNT(*) AS attempts, MAX(a.submitted_at) AS last_at
     FROM exercise_attempts a JOIN users u ON u.id = a.user_id
     WHERE a.submitted_at >= ?1 AND a.source IS NOT 'backfill'
       AND (u.pro_until IS NULL OR (u.pro_until != -1 AND u.pro_until <= ?2))
     GROUP BY a.user_id HAVING attempts >= 20 ORDER BY attempts DESC LIMIT 20`,
  ).bind(monthStart, now).all<{ email: string; display_name: string | null; attempts: number; last_at: number }>()).results ?? [];

  // Pass-deadline cohort (only meaningful once flag:da-pass is on).
  let passCohort: Array<{ email: string; day: number }> = [];
  if (flags["da-pass"]) {
    const launchedRaw = await KV.get("da-pass:launched_at");
    const launched = launchedRaw ? parseInt(launchedRaw, 10) : NaN;
    const rows = (await DB.prepare(
      `SELECT email, created_at FROM users
       WHERE deleted_at IS NULL AND (pro_until IS NULL OR (pro_until != -1 AND pro_until <= ?1))
         AND created_at >= ?2 LIMIT 500`,
    ).bind(now, Number.isFinite(launched) ? Math.min(now - 31 * 86400, launched) : now - 31 * 86400)
      .all<{ email: string; created_at: number }>()).results ?? [];
    passCohort = rows
      .map((r) => ({ email: r.email, day: Math.floor((now - Math.max(r.created_at, Number.isFinite(launched) ? launched : r.created_at)) / 86400) }))
      .filter((r) => r.day >= 21 && r.day <= 31)
      .sort((a, b) => b.day - a.day).slice(0, 30);
  }

  // ---- friction ------------------------------------------------------------
  const neverActivated = await DB.prepare(
    `SELECT COUNT(*) AS n FROM users u
     WHERE u.deleted_at IS NULL AND u.created_at BETWEEN ?1 AND ?2
       AND NOT EXISTS (SELECT 1 FROM exercise_attempts a WHERE a.user_id = u.id)
       AND NOT EXISTS (SELECT 1 FROM reading_progress r WHERE r.user_id = u.id)`,
  ).bind(now - 14 * 86400, now - 2 * 86400).first<{ n: number }>();
  const wallNoBuy = await DB.prepare(
    `SELECT COUNT(DISTINCT i.user_id) AS n FROM intent_signals i JOIN users u ON u.id = i.user_id
     WHERE i.at >= ?1 AND (i.signal LIKE '%paywall%' OR i.signal LIKE '%wall%')
       AND (u.pro_until IS NULL OR (u.pro_until != -1 AND u.pro_until <= ?2))`,
  ).bind(d30, now).first<{ n: number }>();
  const suppressed = (await DB.prepare(
    `SELECT email, email_status FROM users WHERE email_status IN ('bounced','complained') LIMIT 20`,
  ).all<{ email: string; email_status: string }>()).results ?? [];

  // ---- recent feed ----------------------------------------------------------
  const feed = (await DB.prepare(
    `SELECT at, email, email_key, event, meta FROM email_events ORDER BY at DESC, id DESC LIMIT 50`,
  ).all<{ at: number; email: string | null; email_key: string | null; event: string; meta: string | null }>()).results ?? [];

  return json({
    now,
    mode: { engine: flags["email-engine"], live: flags["email-live"], flags },
    engagement, perEmail,
    states: { s1_new: s.s1_new, s2_active: s.s2_active, s3_dormant, s4_pro: s.s4_pro, s6_churned: s.s6_churned, total: s.total },
    gates,
    hot: { signals: hotSignals, capUsers, passCohort },
    friction: {
      never_activated_14d: neverActivated?.n ?? 0,
      wall_no_buy_30d: wallNoBuy?.n ?? 0,
      suppressed,
    },
    feed,
  });
};
