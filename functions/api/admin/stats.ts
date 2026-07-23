// GET /api/admin/stats?range=today|7d|30d|90d|all
//
// The owner-only analytics endpoint behind /admin/analytics.html.
// Hard-gated server-side by email: only ADMIN_EMAIL (default selva86@gmail.com)
// gets data; everyone else gets 401/403. The dashboard page itself is a public
// shell with no data in it - THIS endpoint is the security boundary.
//
// Two data planes:
//   1. D1 (first-party, zero setup): live signed-in users (sessions.last_seen_at
//      within 5 min), sign-ins / signups / exercises / XP over the selected
//      range, totals, top hubs, recent signups, and per-day series for trends.
//      First-party data never expires, so 90d/all ranges are fully supported.
//   2. Cloudflare Web Analytics GraphQL (sitewide anon traffic): visitors,
//      page views, top pages, top referrers, live-5-minute page views, and a
//      per-day visitors trend. Requires CF_ANALYTICS_TOKEN + CF_ACCOUNT_TAG
//      (+ optional CF_SITE_TAG override); until those secrets exist the
//      response carries {configured:false}.
//
// CF retention is 30 days on the free plan, so every request also SNAPSHOTS
// per-day traffic rollups (visits, pageviews, daily top-15 pages) into the D1
// table traffic_daily. Ranges beyond 30 days read traffic from the snapshots,
// which accumulate indefinitely from first deploy onward.
//
// "Today" and D1 day buckets use the IST day boundary (UTC+5:30, no DST).
// CF's per-day dimension buckets on UTC days - the trend is labeled as such.
// CF results are cached in KV per range to stay far below GraphQL rate limits.

import type { Env, RequestData } from "../../_middleware";
import { json, err401, err403, err500 } from "../../_lib/errors";
import { ensureIntentTable } from "../signal";

const DEFAULT_ADMIN = "selva86@gmail.com";
const IST_OFFSET = 19800; // +5:30 in seconds
// The Web Analytics site tag; equals the beacon token deployed sitewide.
const DEFAULT_SITE_TAG = "edf7e3d50c3e4130a913e7f144643624";

type RangeKey = "today" | "7d" | "30d" | "90d" | "all";
const RANGE_DAYS: Record<RangeKey, number> = { today: 1, "7d": 7, "30d": 30, "90d": 90, all: 0 };
const SERIES_DAYS: Record<RangeKey, number> = { today: 7, "7d": 7, "30d": 30, "90d": 90, all: 120 };
const CF_CACHE_TTL: Record<RangeKey, number> = { today: 120, "7d": 600, "30d": 1800, "90d": 1800, all: 1800 };
const cfCacheKey = (r: RangeKey) => `admin:cf:v2:${r}`;

function istDayStart(nowSec: number): number {
  const ist = nowSec + IST_OFFSET;
  return ist - (ist % 86400) - IST_OFFSET;
}
function utcDayStart(sec: number): number {
  return sec - (sec % 86400);
}
function utcDayStr(sec: number): string {
  return new Date(sec * 1000).toISOString().slice(0, 10);
}

function rangeStart(now: number, r: RangeKey): number {
  if (r === "all") return 0;
  return istDayStart(now - (RANGE_DAYS[r] - 1) * 86400);
}

// ---------------------------------------------------------------- D1 plane

async function d1Stats(DB: D1Database, now: number, range: RangeKey) {
  const rs = rangeStart(now, range);
  const live5m = now - 300;
  const seriesN = SERIES_DAYS[range];
  const seriesStart = istDayStart(now - (seriesN - 1) * 86400);

  const [liveUsers, signins, signups, totals, attempts, xp, topHubs, recent, sSignups, sSignins, sPassed, sXp] =
    await Promise.all([
      DB.prepare(
        "SELECT COUNT(DISTINCT user_id) AS n FROM sessions WHERE last_seen_at >= ?1 AND revoked_at IS NULL"
      ).bind(live5m).first<{ n: number }>(),
      DB.prepare("SELECT COUNT(*) AS n FROM sessions WHERE created_at >= ?1")
        .bind(rs).first<{ n: number }>(),
      DB.prepare("SELECT COUNT(*) AS n FROM users WHERE created_at >= ?1")
        .bind(rs).first<{ n: number }>(),
      DB.prepare(
        "SELECT COUNT(*) AS total, SUM(CASE WHEN pro_until = -1 OR pro_until > ?1 THEN 1 ELSE 0 END) AS pro FROM users"
      ).bind(now).first<{ total: number; pro: number }>(),
      DB.prepare(
        "SELECT COUNT(*) AS attempts, SUM(passed) AS passed, " +
        "COUNT(DISTINCT CASE WHEN passed = 1 THEN user_id || '|' || hub_slug || '|' || exercise_id END) AS completed, " +
        "COUNT(DISTINCT user_id) AS solvers FROM exercise_attempts WHERE submitted_at >= ?1"
      ).bind(rs).first<{ attempts: number; passed: number; completed: number; solvers: number }>(),
      DB.prepare("SELECT COALESCE(SUM(xp), 0) AS xp FROM xp_ledger WHERE at >= ?1")
        .bind(rs).first<{ xp: number }>(),
      DB.prepare(
        "SELECT hub_slug, COUNT(*) AS attempts, SUM(passed) AS passed FROM exercise_attempts " +
        "WHERE submitted_at >= ?1 GROUP BY hub_slug ORDER BY attempts DESC LIMIT 8"
      ).bind(rs).all<{ hub_slug: string; attempts: number; passed: number }>(),
      DB.prepare(
        "SELECT email, display_name, created_at FROM users ORDER BY created_at DESC LIMIT 10"
      ).all<{ email: string; display_name: string | null; created_at: number }>(),
      // per-IST-day series for the trend lines
      DB.prepare(
        "SELECT (created_at + ?2) / 86400 AS day, COUNT(*) AS n FROM users WHERE created_at >= ?1 GROUP BY day"
      ).bind(seriesStart, IST_OFFSET).all<{ day: number; n: number }>(),
      DB.prepare(
        "SELECT (created_at + ?2) / 86400 AS day, COUNT(*) AS n FROM sessions WHERE created_at >= ?1 GROUP BY day"
      ).bind(seriesStart, IST_OFFSET).all<{ day: number; n: number }>(),
      DB.prepare(
        "SELECT (submitted_at + ?2) / 86400 AS day, SUM(passed) AS n FROM exercise_attempts WHERE submitted_at >= ?1 GROUP BY day"
      ).bind(seriesStart, IST_OFFSET).all<{ day: number; n: number }>(),
      DB.prepare(
        "SELECT (at + ?2) / 86400 AS day, COALESCE(SUM(xp), 0) AS n FROM xp_ledger WHERE at >= ?1 GROUP BY day"
      ).bind(seriesStart, IST_OFFSET).all<{ day: number; n: number }>(),
    ]);

  // normalize the four series onto the last N IST days
  const days: string[] = [];
  const serSignups: number[] = [];
  const serSignins: number[] = [];
  const serPassed: number[] = [];
  const serXp: number[] = [];
  const pick = (rows: Array<{ day: number; n: number }>, bucket: number) =>
    Number(rows.find((r) => Number(r.day) === bucket)?.n ?? 0);
  for (let i = seriesN - 1; i >= 0; i--) {
    const dStart = istDayStart(now - i * 86400);
    const bucket = Math.floor((dStart + IST_OFFSET) / 86400);
    days.push(new Date((dStart + IST_OFFSET) * 1000).toISOString().slice(5, 10));
    serSignups.push(pick(sSignups.results ?? [], bucket));
    serSignins.push(pick(sSignins.results ?? [], bucket));
    serPassed.push(pick(sPassed.results ?? [], bucket));
    serXp.push(pick(sXp.results ?? [], bucket));
  }

  return {
    range_start_utc: rs,
    timezone: "IST (UTC+5:30)",
    live_signed_in_5m: liveUsers?.n ?? 0,
    signins: signins?.n ?? 0,
    signups: signups?.n ?? 0,
    users_total: totals?.total ?? 0,
    pro_total: totals?.pro ?? 0,
    exercises_attempts: attempts?.attempts ?? 0,
    exercises_passed: Number(attempts?.passed ?? 0),
    exercises_completed: attempts?.completed ?? 0,
    exercise_solvers: attempts?.solvers ?? 0,
    xp: xp?.xp ?? 0,
    top_hubs: topHubs.results ?? [],
    recent_signups: (recent.results ?? []).map((r) => ({
      email: r.email,
      name: r.display_name,
      at: r.created_at,
    })),
    series: {
      days,
      signups: serSignups,
      signins: serSignins,
      exercises_passed: serPassed,
      xp: serXp,
    },
  };
}

// ------------------------------------------------------------ intent plane

async function intentStats(DB: D1Database, now: number, range: RangeKey) {
  await ensureIntentTable(DB);
  const rs = rangeStart(now, range);
  const seriesN = SERIES_DAYS[range];
  const seriesStart = istDayStart(now - (seriesN - 1) * 86400);

  const [counts, series, recent, actors] = await Promise.all([
    DB.prepare(
      "SELECT signal, COUNT(*) AS n, COUNT(DISTINCT COALESCE(user_id, anon_id)) AS actors " +
      "FROM intent_signals WHERE at >= ?1 GROUP BY signal ORDER BY n DESC"
    ).bind(rs).all<{ signal: string; n: number; actors: number }>(),
    DB.prepare(
      "SELECT (at + ?2) / 86400 AS day, COUNT(*) AS n FROM intent_signals WHERE at >= ?1 GROUP BY day"
    ).bind(seriesStart, IST_OFFSET).all<{ day: number; n: number }>(),
    DB.prepare(
      "SELECT i.at, i.signal, i.path, i.meta, u.email AS email, u.display_name AS name " +
      "FROM intent_signals i LEFT JOIN users u ON u.id = i.user_id " +
      "WHERE i.at >= ?1 ORDER BY i.at DESC LIMIT 12"
    ).bind(rs).all<{ at: number; signal: string; path: string | null; meta: string | null; email: string | null; name: string | null }>(),
    DB.prepare(
      "SELECT COUNT(DISTINCT COALESCE(user_id, anon_id)) AS n FROM intent_signals WHERE at >= ?1"
    ).bind(rs).first<{ n: number }>(),
  ]);

  const days: string[] = [];
  const ser: number[] = [];
  const rowsMap = new Map((series.results ?? []).map((r) => [Number(r.day), Number(r.n)]));
  for (let i = seriesN - 1; i >= 0; i--) {
    const dStart = istDayStart(now - i * 86400);
    days.push(new Date((dStart + IST_OFFSET) * 1000).toISOString().slice(5, 10));
    ser.push(rowsMap.get(Math.floor((dStart + IST_OFFSET) / 86400)) ?? 0);
  }

  return {
    counts: counts.results ?? [],
    actors: actors?.n ?? 0,
    series: { days, signals: ser },
    recent: recent.results ?? [],
  };
}

// ------------------------------------------------------------ leaderboards

interface LbRow {
  email: string;
  name: string | null;
  handle: string | null;
  pro: number; // 1 | 0
  [k: string]: unknown;
}

async function leaderboards(DB: D1Database, now: number, range: RangeKey) {
  const rs = rangeStart(now, range);
  const proExpr = "CASE WHEN u.pro_until = -1 OR u.pro_until > ?2 THEN 1 ELSE 0 END AS pro";
  const base = "u.email AS email, u.display_name AS name, u.handle AS handle, " + proExpr;

  const [xp, solvers, active, readers, streaks, hotLeads, atRisk] = await Promise.all([
    DB.prepare(
      `SELECT ${base}, SUM(l.xp) AS xp, u.total_xp AS xp_all FROM xp_ledger l ` +
      "JOIN users u ON u.id = l.user_id AND u.deleted_at IS NULL " +
      "WHERE l.at >= ?1 GROUP BY l.user_id ORDER BY xp DESC LIMIT 10"
    ).bind(rs, now).all<LbRow>(),
    DB.prepare(
      `SELECT ${base}, ` +
      "COUNT(DISTINCT CASE WHEN a.passed = 1 THEN a.hub_slug || '|' || a.exercise_id END) AS solved, " +
      "COUNT(*) AS attempts FROM exercise_attempts a " +
      "JOIN users u ON u.id = a.user_id AND u.deleted_at IS NULL " +
      "WHERE a.submitted_at >= ?1 GROUP BY a.user_id HAVING solved > 0 " +
      "ORDER BY solved DESC, attempts ASC LIMIT 10"
    ).bind(rs, now).all<LbRow>(),
    DB.prepare(
      `SELECT ${base}, COUNT(DISTINCT ev.day) AS days FROM (` +
      "SELECT user_id, (at + 19800) / 86400 AS day FROM xp_ledger WHERE at >= ?1 " +
      "UNION SELECT user_id, (submitted_at + 19800) / 86400 FROM exercise_attempts WHERE submitted_at >= ?1 " +
      "UNION SELECT user_id, (read_at + 19800) / 86400 FROM reading_progress WHERE read_at >= ?1" +
      ") ev JOIN users u ON u.id = ev.user_id AND u.deleted_at IS NULL " +
      "GROUP BY ev.user_id ORDER BY days DESC LIMIT 10"
    ).bind(rs, now).all<LbRow>(),
    DB.prepare(
      `SELECT ${base}, COUNT(*) AS pages, SUM(r.marked_read) AS finished FROM reading_progress r ` +
      "JOIN users u ON u.id = r.user_id AND u.deleted_at IS NULL " +
      "WHERE r.read_at >= ?1 GROUP BY r.user_id ORDER BY pages DESC LIMIT 10"
    ).bind(rs, now).all<LbRow>(),
    DB.prepare(
      `SELECT ${base}, u.current_streak_days AS streak, u.longest_streak_days AS best FROM users u ` +
      "WHERE u.current_streak_days > 0 AND u.deleted_at IS NULL " +
      "ORDER BY u.current_streak_days DESC, u.longest_streak_days DESC LIMIT 10"
    ).bind(0, now).all<LbRow>(),
    // Hot leads: the most engaged FREE users in range - the conversion list.
    DB.prepare(
      "SELECT u.email AS email, u.display_name AS name, u.handle AS handle, 0 AS pro, " +
      "u.created_at AS joined, SUM(l.xp) AS xp, u.total_xp AS xp_all FROM xp_ledger l " +
      "JOIN users u ON u.id = l.user_id AND u.deleted_at IS NULL " +
      "WHERE l.at >= ?1 AND (u.pro_until IS NULL OR (u.pro_until != -1 AND u.pro_until <= ?2)) " +
      "GROUP BY l.user_id ORDER BY xp DESC LIMIT 10"
    ).bind(rs, now).all<LbRow>(),
    // At risk: paying users with ZERO recorded activity in the range.
    DB.prepare(
      "SELECT u.email AS email, u.display_name AS name, u.handle AS handle, 1 AS pro, " +
      "u.total_xp AS xp_all, u.last_active_date AS last_active FROM users u " +
      "WHERE (u.pro_until = -1 OR u.pro_until > ?2) AND u.deleted_at IS NULL " +
      "AND u.id NOT IN (SELECT DISTINCT user_id FROM xp_ledger WHERE at >= ?1) " +
      "AND u.id NOT IN (SELECT DISTINCT user_id FROM exercise_attempts WHERE submitted_at >= ?1) " +
      "ORDER BY u.total_xp DESC LIMIT 10"
    ).bind(rs, now).all<LbRow>(),
  ]);

  return {
    xp: xp.results ?? [],
    solvers: solvers.results ?? [],
    active: active.results ?? [],
    readers: readers.results ?? [],
    streaks: streaks.results ?? [],
    hot_leads: hotLeads.results ?? [],
    at_risk: atRisk.results ?? [],
  };
}

// ------------------------------------------------------------ CF plane

interface CfEnv {
  CF_ANALYTICS_TOKEN?: string;
  CF_ACCOUNT_TAG?: string;
  CF_SITE_TAG?: string;
}

interface DayRow {
  day: string;
  visits: number;
  pageviews: number;
  top_pages: string | null;
  updated_at: number;
}

let tableReady = false;
async function ensureTrafficTable(DB: D1Database) {
  if (tableReady) return;
  await DB.prepare(
    "CREATE TABLE IF NOT EXISTS traffic_daily (" +
    "day TEXT PRIMARY KEY, visits INTEGER NOT NULL DEFAULT 0, " +
    "pageviews INTEGER NOT NULL DEFAULT 0, top_pages TEXT, updated_at INTEGER NOT NULL)"
  ).run();
  tableReady = true;
}

// a stored day is final once written >= 2h after that UTC day ended
function dayFinalTs(dayStr: string): number {
  return Math.floor(Date.parse(dayStr + "T00:00:00Z") / 1000) + 86400 + 7200;
}

async function cfAnalytics(env: Env & CfEnv, DB: D1Database, now: number, range: RangeKey) {
  if (!env.CF_ANALYTICS_TOKEN || !env.CF_ACCOUNT_TAG) {
    return { configured: false as const };
  }
  const cached = await env.KV.get(cfCacheKey(range), "json");
  if (cached) return cached as Record<string, unknown>;

  await ensureTrafficTable(DB);

  const siteTag = env.CF_SITE_TAG || DEFAULT_SITE_TAG;
  const iso = (s: number) => new Date(s * 1000).toISOString();
  const todayUtc = utcDayStart(now);
  const cfWindowStart = todayUtc - 29 * 86400; // CF free retention: 30 days
  const longRange = range === "90d" || range === "all";
  // page/referrer/total window: the range itself when <=30d, else capped at 30d
  const pageStart = longRange ? cfWindowStart : rangeStart(now, range);

  // which stored days still need their top-15 pages backfilled (cap 10/request)
  const stored = await DB.prepare(
    "SELECT day, visits, pageviews, top_pages, updated_at FROM traffic_daily WHERE day >= ?1"
  ).bind(utcDayStr(cfWindowStart)).all<DayRow>();
  const byDay = new Map((stored.results ?? []).map((r) => [r.day, r]));
  const backfill: string[] = [];
  for (let d = cfWindowStart; d < todayUtc && backfill.length < 10; d += 86400) {
    const ds = utcDayStr(d);
    const row = byDay.get(ds);
    if (!row || row.top_pages == null || row.updated_at < dayFinalTs(ds)) backfill.push(ds);
  }

  const bfGroups = backfill.map((ds, i) =>
    `bf_${i}: rumPageloadEventsAdaptiveGroups(limit: 15, orderBy: [sum_visits_DESC],
      filter: {siteTag: $siteTag, datetime_geq: "${ds}T00:00:00Z", datetime_leq: "${ds}T23:59:59Z"}) {
      count sum { visits } dimensions { requestPath }
    }`
  ).join("\n");

  const query = `
    query($accountTag: string!, $siteTag: string!, $pageStart: Time!, $trendStart: Time!, $now: Time!, $live: Time!) {
      viewer { accounts(filter: {accountTag: $accountTag}) {
        total: rumPageloadEventsAdaptiveGroups(limit: 1,
          filter: {siteTag: $siteTag, datetime_geq: $pageStart, datetime_leq: $now}) {
          count sum { visits }
        }
        days: rumPageloadEventsAdaptiveGroups(limit: 31, orderBy: [date_ASC],
          filter: {siteTag: $siteTag, datetime_geq: $trendStart, datetime_leq: $now}) {
          count sum { visits } dimensions { date }
        }
        pages: rumPageloadEventsAdaptiveGroups(limit: 15, orderBy: [sum_visits_DESC],
          filter: {siteTag: $siteTag, datetime_geq: $pageStart, datetime_leq: $now}) {
          count sum { visits } dimensions { requestPath }
        }
        referrers: rumPageloadEventsAdaptiveGroups(limit: 10, orderBy: [sum_visits_DESC],
          filter: {siteTag: $siteTag, datetime_geq: $pageStart, datetime_leq: $now, refererHost_neq: ""}) {
          sum { visits } dimensions { refererHost }
        }
        live: rumPageloadEventsAdaptiveGroups(limit: 1,
          filter: {siteTag: $siteTag, datetime_geq: $live, datetime_leq: $now}) {
          count sum { visits }
        }
        ${bfGroups}
      } }
    }`;
  const resp = await fetch("https://api.cloudflare.com/client/v4/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.CF_ANALYTICS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables: {
        accountTag: env.CF_ACCOUNT_TAG,
        siteTag,
        pageStart: iso(pageStart),
        trendStart: iso(cfWindowStart),
        now: iso(now),
        live: iso(now - 300),
      },
    }),
  });
  const body = (await resp.json()) as {
    data?: { viewer?: { accounts?: Array<Record<string, any>> } };
    errors?: Array<{ message: string }>;
  };
  if (!resp.ok || body.errors?.length || !body.data?.viewer?.accounts?.length) {
    return {
      configured: true as const,
      error: body.errors?.[0]?.message || `GraphQL HTTP ${resp.status}`,
    };
  }
  const acc = body.data.viewer.accounts[0];

  // ---- snapshot: upsert per-day visits/pageviews + backfilled top pages
  const cfDays = new Map<string, { visits: number; views: number }>();
  for (const r of acc.days ?? []) {
    cfDays.set(r.dimensions.date, { visits: r.sum?.visits ?? 0, views: r.count ?? 0 });
  }
  const stmts: D1PreparedStatement[] = [];
  const upsertDay = DB.prepare(
    "INSERT INTO traffic_daily (day, visits, pageviews, updated_at) VALUES (?1, ?2, ?3, ?4) " +
    "ON CONFLICT(day) DO UPDATE SET visits=excluded.visits, pageviews=excluded.pageviews, updated_at=excluded.updated_at"
  );
  const upsertPages = DB.prepare(
    "INSERT INTO traffic_daily (day, visits, pageviews, top_pages, updated_at) VALUES (?1, 0, 0, ?2, ?3) " +
    "ON CONFLICT(day) DO UPDATE SET top_pages=excluded.top_pages, updated_at=excluded.updated_at"
  );
  for (const [ds, v] of cfDays) stmts.push(upsertDay.bind(ds, v.visits, v.views, now));
  backfill.forEach((ds, i) => {
    const rowsRaw = (acc[`bf_${i}`] ?? []) as any[];
    const pages = rowsRaw.map((p) => ({
      path: p.dimensions.requestPath,
      visits: p.sum?.visits ?? 0,
      views: p.count ?? 0,
    }));
    stmts.push(upsertPages.bind(ds, JSON.stringify(pages), now));
  });
  if (stmts.length) await DB.batch(stmts);

  // ---- assemble the response
  let visits: number, pageviews: number;
  let trendDaysArr: string[], trendVisits: number[];
  let topPages: Array<{ path: string; visits: number; views: number }>;
  let pagesNote = "";

  if (!longRange) {
    visits = acc.total?.[0]?.sum?.visits ?? 0;
    pageviews = acc.total?.[0]?.count ?? 0;
    const nDays = SERIES_DAYS[range];
    trendDaysArr = [];
    trendVisits = [];
    for (let i = nDays - 1; i >= 0; i--) {
      const ds = utcDayStr(todayUtc - i * 86400);
      trendDaysArr.push(ds.slice(5));
      trendVisits.push(cfDays.get(ds)?.visits ?? 0);
    }
    topPages = (acc.pages ?? []).map((p: any) => ({
      path: p.dimensions.requestPath,
      visits: p.sum.visits,
      views: p.count,
    }));
  } else {
    // beyond CF retention: read the accumulated snapshots
    const windowDays = range === "90d" ? 90 : 120;
    const winStartStr = range === "all" ? "0000" : utcDayStr(todayUtc - (windowDays - 1) * 86400);
    const snap = await DB.prepare(
      "SELECT day, visits, pageviews, top_pages FROM traffic_daily WHERE day >= ?1 ORDER BY day ASC"
    ).bind(winStartStr).all<DayRow>();
    let rows = snap.results ?? [];
    if (range === "all" && rows.length > 120) rows = rows.slice(rows.length - 120);
    visits = rows.reduce((a, r) => a + (r.visits || 0), 0);
    pageviews = rows.reduce((a, r) => a + (r.pageviews || 0), 0);
    const snapMap = new Map(rows.map((r) => [r.day, r]));
    const firstDay = rows.length ? rows[0].day : utcDayStr(todayUtc);
    const spanStart = range === "90d"
      ? todayUtc - (windowDays - 1) * 86400
      : Math.floor(Date.parse(firstDay + "T00:00:00Z") / 1000);
    trendDaysArr = [];
    trendVisits = [];
    for (let d = spanStart; d <= todayUtc; d += 86400) {
      const ds = utcDayStr(d);
      trendDaysArr.push(ds.slice(5));
      trendVisits.push(snapMap.get(ds)?.visits ?? 0);
    }
    // approximate top pages: merge the stored daily top-15s
    const agg = new Map<string, { visits: number; views: number }>();
    for (const r of rows) {
      if (!r.top_pages) continue;
      try {
        for (const p of JSON.parse(r.top_pages) as any[]) {
          const cur = agg.get(p.path) || { visits: 0, views: 0 };
          cur.visits += p.visits || 0;
          cur.views += p.views || 0;
          agg.set(p.path, cur);
        }
      } catch { /* ignore malformed snapshot rows */ }
    }
    topPages = Array.from(agg, ([path, v]) => ({ path, visits: v.visits, views: v.views }))
      .sort((a, b) => b.visits - a.visits).slice(0, 15);
    pagesNote = "approximate: merged from daily top-15 snapshots (accumulating since 2026-07-17)";
  }

  const out = {
    configured: true as const,
    visits,
    pageviews,
    live_pageviews_5m: acc.live?.[0]?.count ?? 0,
    trend: { days: trendDaysArr, visits: trendVisits, basis: "UTC days" },
    top_pages: topPages,
    top_referrers: (acc.referrers ?? []).map((r: any) => ({
      host: r.dimensions.refererHost,
      visits: r.sum.visits,
    })),
    pages_note: pagesNote,
    referrers_note: longRange ? "last 30 days (CF retention)" : "",
  };
  await env.KV.put(cfCacheKey(range), JSON.stringify(out), { expirationTtl: CF_CACHE_TTL[range] });
  return out;
}

// ------------------------------------------------------------------ handler

export const onRequestGet: PagesFunction<Env & CfEnv, string, RequestData> = async (context) => {
  const u = context.data.user;
  if (!u) return err401();
  const admin = (context.env as { ADMIN_EMAIL?: string }).ADMIN_EMAIL || DEFAULT_ADMIN;
  if ((u.email || "").toLowerCase() !== admin.toLowerCase()) {
    return err403("This dashboard is restricted.");
  }

  const rParam = new URL(context.request.url).searchParams.get("range") || "today";
  const range: RangeKey = (["today", "7d", "30d", "90d", "all"] as const).includes(rParam as RangeKey)
    ? (rParam as RangeKey) : "today";

  const now = Math.floor(Date.now() / 1000);
  try {
    const [d1, cf, lb, intent] = await Promise.all([
      d1Stats(context.env.DB, now, range),
      cfAnalytics(context.env, context.env.DB, now, range).catch((e: Error) => ({
        configured: true as const,
        error: String(e?.message || e),
      })),
      leaderboards(context.env.DB, now, range).catch((e: Error) => ({
        error: String(e?.message || e),
        xp: [], solvers: [], active: [], readers: [], streaks: [], hot_leads: [], at_risk: [],
      })),
      intentStats(context.env.DB, now, range).catch((e: Error) => ({
        error: String(e?.message || e),
        counts: [], actors: 0, series: { days: [], signals: [] }, recent: [],
      })),
    ]);
    return json({ generated_at: now, range, d1, cf, leaderboards: lb, intent });
  } catch (e) {
    return err500(`admin stats failed: ${String((e as Error)?.message || e)}`);
  }
};
