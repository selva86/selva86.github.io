// GET /api/admin/stats
//
// The owner-only analytics endpoint behind /admin/analytics.html.
// Hard-gated server-side by email: only ADMIN_EMAIL (default selva86@gmail.com)
// gets data; everyone else gets 401/403. The dashboard page itself is a public
// shell with no data in it - THIS endpoint is the security boundary.
//
// Two data planes:
//   1. D1 (first-party, zero setup): live signed-in users (sessions.last_seen_at
//      within 5 min), sign-ins today (sessions created), signups today + recent
//      list, totals, exercises attempted/passed today, XP today, top hubs today,
//      7-day signup/exercise series.
//   2. Cloudflare Web Analytics GraphQL (sitewide anon traffic): visitors,
//      page views, top pages, top referrers, live-5-minute page views. Requires
//      CF_ANALYTICS_TOKEN + CF_ACCOUNT_TAG (+ optional CF_SITE_TAG override);
//      until those secrets exist the response carries {configured:false} and the
//      dashboard shows setup instructions instead of numbers.
//
// "Today" = IST day boundary (UTC+5:30, no DST), because the owner operates in
// IST; the boundary is stated in the payload so the UI can label it honestly.
// CF results are cached in KV for 120s to stay far below GraphQL rate limits.

import type { Env, RequestData } from "../../_middleware";
import { json, err401, err403, err500 } from "../../_lib/errors";

const DEFAULT_ADMIN = "selva86@gmail.com";
const IST_OFFSET = 19800; // +5:30 in seconds
const CF_CACHE_KEY = "admin:cf-analytics:v1";
const CF_CACHE_TTL = 120; // seconds
// The Web Analytics site tag; equals the beacon token deployed sitewide.
const DEFAULT_SITE_TAG = "edf7e3d50c3e4130a913e7f144643624";

function istDayStart(nowSec: number): number {
  const ist = nowSec + IST_OFFSET;
  return ist - (ist % 86400) - IST_OFFSET;
}

async function d1Stats(DB: D1Database, now: number) {
  const dayStart = istDayStart(now);
  const live5m = now - 300;
  const weekAgo = istDayStart(now - 6 * 86400);

  const [liveUsers, signins, signups, totals, attempts, xp, topHubs, recent, series] =
    await Promise.all([
      DB.prepare(
        "SELECT COUNT(DISTINCT user_id) AS n FROM sessions WHERE last_seen_at >= ?1 AND revoked_at IS NULL"
      ).bind(live5m).first<{ n: number }>(),
      DB.prepare("SELECT COUNT(*) AS n FROM sessions WHERE created_at >= ?1")
        .bind(dayStart).first<{ n: number }>(),
      DB.prepare("SELECT COUNT(*) AS n FROM users WHERE created_at >= ?1")
        .bind(dayStart).first<{ n: number }>(),
      DB.prepare(
        "SELECT COUNT(*) AS total, SUM(CASE WHEN pro_until = -1 OR pro_until > ?1 THEN 1 ELSE 0 END) AS pro FROM users"
      ).bind(now).first<{ total: number; pro: number }>(),
      DB.prepare(
        "SELECT COUNT(*) AS attempts, SUM(passed) AS passed, " +
        "COUNT(DISTINCT CASE WHEN passed = 1 THEN user_id || '|' || hub_slug || '|' || exercise_id END) AS completed, " +
        "COUNT(DISTINCT user_id) AS solvers FROM exercise_attempts WHERE submitted_at >= ?1"
      ).bind(dayStart).first<{ attempts: number; passed: number; completed: number; solvers: number }>(),
      DB.prepare("SELECT COALESCE(SUM(xp), 0) AS xp FROM xp_ledger WHERE at >= ?1")
        .bind(dayStart).first<{ xp: number }>(),
      DB.prepare(
        "SELECT hub_slug, COUNT(*) AS attempts, SUM(passed) AS passed FROM exercise_attempts " +
        "WHERE submitted_at >= ?1 GROUP BY hub_slug ORDER BY attempts DESC LIMIT 8"
      ).bind(dayStart).all<{ hub_slug: string; attempts: number; passed: number }>(),
      DB.prepare(
        "SELECT email, display_name, created_at FROM users ORDER BY created_at DESC LIMIT 10"
      ).all<{ email: string; display_name: string | null; created_at: number }>(),
      // 7-day series, bucketed on the IST day
      DB.prepare(
        "SELECT (created_at + ?2) / 86400 AS day, COUNT(*) AS n FROM users WHERE created_at >= ?1 GROUP BY day"
      ).bind(weekAgo, IST_OFFSET).all<{ day: number; n: number }>()
        .then(async (su) => ({
          signups: su.results ?? [],
          passed: (await DB.prepare(
            "SELECT (submitted_at + ?2) / 86400 AS day, SUM(passed) AS n FROM exercise_attempts WHERE submitted_at >= ?1 GROUP BY day"
          ).bind(weekAgo, IST_OFFSET).all<{ day: number; n: number }>()).results ?? [],
        })),
    ]);

  // normalize the two series onto the last 7 IST days
  const days: string[] = [];
  const signup7: number[] = [];
  const passed7: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const dStart = istDayStart(now - i * 86400);
    const bucket = Math.floor((dStart + IST_OFFSET) / 86400);
    days.push(new Date((dStart + IST_OFFSET) * 1000).toISOString().slice(5, 10));
    signup7.push(series.signups.find((r) => Number(r.day) === bucket)?.n ?? 0);
    passed7.push(Number(series.passed.find((r) => Number(r.day) === bucket)?.n ?? 0));
  }

  return {
    day_start_utc: dayStart,
    timezone: "IST (UTC+5:30)",
    live_signed_in_5m: liveUsers?.n ?? 0,
    signins_today: signins?.n ?? 0,
    signups_today: signups?.n ?? 0,
    users_total: totals?.total ?? 0,
    pro_total: totals?.pro ?? 0,
    exercises_attempts_today: attempts?.attempts ?? 0,
    exercises_passed_today: Number(attempts?.passed ?? 0),
    exercises_completed_today: attempts?.completed ?? 0,
    exercise_solvers_today: attempts?.solvers ?? 0,
    xp_today: xp?.xp ?? 0,
    top_hubs_today: topHubs.results ?? [],
    recent_signups: (recent.results ?? []).map((r) => ({
      email: r.email,
      name: r.display_name,
      at: r.created_at,
    })),
    series7: { days, signups: signup7, exercises_passed: passed7 },
  };
}

interface CfEnv {
  CF_ANALYTICS_TOKEN?: string;
  CF_ACCOUNT_TAG?: string;
  CF_SITE_TAG?: string;
}

async function cfAnalytics(env: Env & CfEnv, now: number) {
  if (!env.CF_ANALYTICS_TOKEN || !env.CF_ACCOUNT_TAG) {
    return { configured: false as const };
  }
  const cached = await env.KV.get(CF_CACHE_KEY, "json");
  if (cached) return cached as Record<string, unknown>;

  const siteTag = env.CF_SITE_TAG || DEFAULT_SITE_TAG;
  const iso = (s: number) => new Date(s * 1000).toISOString();
  const dayStart = istDayStart(now);
  const query = `
    query($accountTag: string!, $siteTag: string!, $dayStart: Time!, $now: Time!, $live: Time!) {
      viewer { accounts(filter: {accountTag: $accountTag}) {
        total: rumPageloadEventsAdaptiveGroups(limit: 1,
          filter: {siteTag: $siteTag, datetime_geq: $dayStart, datetime_leq: $now}) {
          count sum { visits }
        }
        pages: rumPageloadEventsAdaptiveGroups(limit: 15, orderBy: [sum_visits_DESC],
          filter: {siteTag: $siteTag, datetime_geq: $dayStart, datetime_leq: $now}) {
          count sum { visits } dimensions { requestPath }
        }
        referrers: rumPageloadEventsAdaptiveGroups(limit: 10, orderBy: [sum_visits_DESC],
          filter: {siteTag: $siteTag, datetime_geq: $dayStart, datetime_leq: $now, refererHost_neq: ""}) {
          sum { visits } dimensions { refererHost }
        }
        live: rumPageloadEventsAdaptiveGroups(limit: 1,
          filter: {siteTag: $siteTag, datetime_geq: $live, datetime_leq: $now}) {
          count sum { visits }
        }
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
        dayStart: iso(dayStart),
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
  const out = {
    configured: true as const,
    visits_today: acc.total?.[0]?.sum?.visits ?? 0,
    pageviews_today: acc.total?.[0]?.count ?? 0,
    live_pageviews_5m: acc.live?.[0]?.count ?? 0,
    top_pages_today: (acc.pages ?? []).map((p: any) => ({
      path: p.dimensions.requestPath,
      visits: p.sum.visits,
      views: p.count,
    })),
    top_referrers_today: (acc.referrers ?? []).map((r: any) => ({
      host: r.dimensions.refererHost,
      visits: r.sum.visits,
    })),
  };
  await env.KV.put(CF_CACHE_KEY, JSON.stringify(out), { expirationTtl: CF_CACHE_TTL });
  return out;
}

export const onRequestGet: PagesFunction<Env & CfEnv, string, RequestData> = async (context) => {
  const u = context.data.user;
  if (!u) return err401();
  const admin = (context.env as { ADMIN_EMAIL?: string }).ADMIN_EMAIL || DEFAULT_ADMIN;
  if ((u.email || "").toLowerCase() !== admin.toLowerCase()) {
    return err403("This dashboard is restricted.");
  }

  const now = Math.floor(Date.now() / 1000);
  try {
    const [d1, cf] = await Promise.all([
      d1Stats(context.env.DB, now),
      cfAnalytics(context.env, now).catch((e: Error) => ({
        configured: true as const,
        error: String(e?.message || e),
      })),
    ]);
    return json({ generated_at: now, d1, cf });
  } catch (e) {
    return err500(`admin stats failed: ${String((e as Error)?.message || e)}`);
  }
};
