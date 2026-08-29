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
import { SEQ_ITEMS } from "../../_lib/nurture";
import manifestJson from "../../_data/exercise-manifest.json";

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
    `SELECT email_key, event, COUNT(*) AS n, COUNT(DISTINCT user_id) AS uniq, MAX(at) AS last_at
     FROM email_events WHERE email_key IS NOT NULL GROUP BY email_key, event`,
  ).all<{ email_key: string; event: string; n: number; uniq: number; last_at: number }>()).results ?? [];

  // Per-email performance rollup: sends, unique openers/clickers (the pixel
  // and the click redirect attribute to the exact key), unsubs, errors, and
  // dev-mode simulations. Test sends are counted separately and never mix
  // into the rates.
  const metricsByKey: Record<string, {
    sent: number; would: number; test: number; openers: number; clickers: number;
    unsubs: number; errors: number; last_sent: number;
  }> = {};
  for (const r of perEmail) {
    const k = r.email_key.startsWith("test:") ? r.email_key : r.email_key;
    if (!metricsByKey[k]) metricsByKey[k] = { sent: 0, would: 0, test: 0, openers: 0, clickers: 0, unsubs: 0, errors: 0, last_sent: 0 };
    const m = metricsByKey[k];
    if (r.event === "sent") { m.sent = r.n; m.last_sent = r.last_at; }
    else if (r.event === "would_send") m.would = r.n;
    else if (r.event === "test_sent") m.test = r.n;
    else if (r.event === "open") m.openers = r.uniq;
    else if (r.event === "click") m.clickers = r.uniq;
    else if (r.event === "unsubscribe") m.unsubs = r.n;
    else if (r.event === "error") m.errors = r.n;
  }

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

  // Pass-deadline cohort (claim-to-start: day counts from pass_claimed_at).
  let passCohort: Array<{ email: string; day: number }> = [];
  if (flags["da-pass"]) {
    const rows = (await DB.prepare(
      `SELECT email, pass_claimed_at FROM users
       WHERE deleted_at IS NULL AND pass_claimed_at IS NOT NULL
         AND (pro_until IS NULL OR (pro_until != -1 AND pro_until <= ?1))
         AND pass_claimed_at >= ?2 LIMIT 500`,
    ).bind(now, now - 32 * 86400).all<{ email: string; pass_claimed_at: number }>()).results ?? [];
    passCohort = rows
      .map((r) => ({ email: r.email, day: Math.floor((now - r.pass_claimed_at) / 86400) }))
      .filter((r) => r.day >= 21 && r.day <= 31)
      .sort((a2, b2) => b2.day - a2.day).slice(0, 30);
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

  // ---- signals (2026-08-29): the series as the reader lives it -----------
  // Survival by DAY of the user's own walk (ROW_NUMBER over their seq sends),
  // so a reorder of the plan never scrambles the curve. Per-seq: lessons that
  // expired without the reader ever clicking through, how deep clickers got
  // in the lesson (attempted any check / passed every check), the footer
  // votes, and the quiet-probe outcomes.
  const survival = (await DB.prepare(
    `WITH s AS (
       SELECT user_id, email_key, sent_at,
              ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY sent_at, email_key) AS pos
       FROM sent_emails WHERE email_key LIKE 'seq:%'),
     o AS (SELECT DISTINCT user_id, email_key FROM email_events WHERE event = 'open'),
     c AS (SELECT DISTINCT user_id, email_key FROM email_events WHERE event = 'click'),
     un AS (SELECT DISTINCT user_id, email_key FROM email_events WHERE event = 'unsubscribe')
     SELECT s.pos AS pos, COUNT(*) AS sent,
            SUM(CASE WHEN o.user_id IS NOT NULL THEN 1 ELSE 0 END) AS opened,
            SUM(CASE WHEN c.user_id IS NOT NULL THEN 1 ELSE 0 END) AS clicked,
            SUM(CASE WHEN un.user_id IS NOT NULL THEN 1 ELSE 0 END) AS unsubs
     FROM s LEFT JOIN o ON o.user_id = s.user_id AND o.email_key = s.email_key
            LEFT JOIN c ON c.user_id = s.user_id AND c.email_key = s.email_key
            LEFT JOIN un ON un.user_id = s.user_id AND un.email_key = s.email_key
     WHERE s.pos <= 90 GROUP BY s.pos ORDER BY s.pos`,
  ).all<{ pos: number; sent: number; opened: number; clicked: number; unsubs: number }>()).results ?? [];

  const WINDOW = 72 * 3600;
  const expiry = (await DB.prepare(
    `WITH o AS (SELECT DISTINCT user_id, email_key FROM email_events WHERE event = 'open'),
          c AS (SELECT DISTINCT user_id, email_key FROM email_events WHERE event = 'click')
     SELECT s.email_key AS key, COUNT(*) AS eligible,
            SUM(CASE WHEN c.user_id IS NULL THEN 1 ELSE 0 END) AS expired_unopened,
            SUM(CASE WHEN c.user_id IS NULL AND o.user_id IS NOT NULL THEN 1 ELSE 0 END) AS opened_not_clicked
     FROM sent_emails s LEFT JOIN c ON c.user_id = s.user_id AND c.email_key = s.email_key
                        LEFT JOIN o ON o.user_id = s.user_id AND o.email_key = s.email_key
     WHERE s.email_key LIKE 'seq:%' AND s.sent_at < ?1 GROUP BY s.email_key`,
  ).bind(now - WINDOW).all<{ key: string; eligible: number; expired_unopened: number; opened_not_clicked: number }>()).results ?? [];

  // Lesson depth: clickers of each seq email vs their graded checks on that
  // lesson's hub (windowed lessons are exercise hubs; hub slug == page slug).
  const seqSlugs: Record<string, string> = {};
  for (const n of Object.keys(SEQ_ITEMS)) { const it = SEQ_ITEMS[Number(n)]; if (it && it.kind === "lesson" && it.slug) seqSlugs[`seq:${n}`] = it.slug; }
  const slugList = Object.values(seqSlugs);
  const clickers = (await DB.prepare(
    "SELECT DISTINCT user_id, email_key FROM email_events WHERE event = 'click' AND email_key LIKE 'seq:%'",
  ).all<{ user_id: string; email_key: string }>()).results ?? [];
  const attempts = slugList.length ? ((await DB.prepare(
    `SELECT hub_slug, user_id, COUNT(DISTINCT exercise_id) AS tried,
            COUNT(DISTINCT CASE WHEN passed = 1 THEN exercise_id END) AS passed
     FROM exercise_attempts WHERE hub_slug IN (${slugList.map(() => "?").join(",")}) GROUP BY hub_slug, user_id`,
  ).bind(...slugList).all<{ hub_slug: string; user_id: string; tried: number; passed: number }>()).results ?? []) : [];
  const attemptBy = new Map<string, { tried: number; passed: number }>();
  for (const a of attempts) attemptBy.set(`${a.hub_slug}|${a.user_id}`, { tried: a.tried, passed: a.passed });
  const hubTotals: Record<string, number> = {};
  const hubs = (manifestJson as { hubs?: Record<string, Record<string, string>> }).hubs || {};
  for (const slug of slugList) hubTotals[slug] = Object.keys(hubs[slug] || {}).length;
  const depth: Record<string, { clickers: number; started: number; finished: number; checks: number }> = {};
  for (const r of clickers) {
    const slug = seqSlugs[r.email_key]; if (!slug) continue;
    if (!depth[r.email_key]) depth[r.email_key] = { clickers: 0, started: 0, finished: 0, checks: hubTotals[slug] || 0 };
    const d = depth[r.email_key]; d.clickers++;
    const a = attemptBy.get(`${slug}|${r.user_id}`);
    if (a && a.tried > 0) d.started++;
    if (a && d.checks > 0 && a.passed >= d.checks) d.finished++;
  }

  const voteRows = (await DB.prepare(
    "SELECT email_key AS key, meta, COUNT(*) AS n FROM email_events WHERE event = 'vote' GROUP BY email_key, meta",
  ).all<{ key: string; meta: string; n: number }>()).results ?? [];
  const votes: Record<string, { up: number; down: number; reasons: Record<string, number> }> = {};
  for (const v of voteRows) {
    if (!votes[v.key]) votes[v.key] = { up: 0, down: 0, reasons: {} };
    if (v.meta === "up") votes[v.key].up = v.n;
    else if (v.meta === "down") votes[v.key].down = v.n;
    else if (v.meta && v.meta.startsWith("reason:")) votes[v.key].reasons[v.meta.slice(7)] = v.n;
  }

  const probe = (await DB.prepare(
    "SELECT meta, COUNT(*) AS n FROM email_events WHERE email_key = 'quiet-probe' AND event = 'pause' GROUP BY meta",
  ).all<{ meta: string; n: number }>()).results ?? [];

  let alerts: Record<string, number> = {};
  try {
    const a = await DB.prepare(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN intent = 'today' THEN 1 ELSE 0 END) AS i_today,
              SUM(CASE WHEN intent = 'week' THEN 1 ELSE 0 END) AS i_week,
              SUM(CASE WHEN intent = 'month' THEN 1 ELSE 0 END) AS i_month,
              SUM(CASE WHEN intent = 'someday' THEN 1 ELSE 0 END) AS i_someday,
              SUM(CASE WHEN intent IS NULL THEN 1 ELSE 0 END) AS i_none,
              SUM(CASE WHEN offer_sent_at IS NOT NULL THEN 1 ELSE 0 END) AS offers,
              SUM(CASE WHEN reminder_sent_at IS NOT NULL THEN 1 ELSE 0 END) AS reminders,
              SUM(CASE WHEN last30_sent_at IS NOT NULL THEN 1 ELSE 0 END) AS last30,
              SUM(CASE WHEN closed_sent_at IS NOT NULL THEN 1 ELSE 0 END) AS closed,
              SUM(CASE WHEN purchased_at IS NOT NULL THEN 1 ELSE 0 END) AS purchased,
              SUM(CASE WHEN unsubscribed_at IS NOT NULL THEN 1 ELSE 0 END) AS stopped
       FROM price_alerts`,
    ).first<Record<string, number>>();
    if (a) alerts = a;
  } catch { /* table absent on a fresh preview DB */ }

  return json({
    now,
    signals: { survival, expiry, depth, votes, probe, alerts, window_hours: WINDOW / 3600 },
    mode: { engine: flags["email-engine"], live: flags["email-live"], flags },
    engagement, perEmail, metricsByKey,
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
