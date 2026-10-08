// The email brain: one run = derive state from facts, collect candidates,
// apply consent, arbitrate, send at most one non-account email per user, write
// the ledger. Design SSOT: Plans/01_email_and_nurture/email-program-v2.md s7.
//
// STATE IS DERIVED, NEVER STORED. The only writes are the sent_emails ledger
// and email_events log rows. A purchase, a consent change, or a pass expiry
// changes tomorrow's derivation; nothing here needs to be cancelled.
//
// Heartbeat: hourly (a cron Worker POSTs /api/cron/email-brain). Emails carry
// a send policy: FAST ones (welcome) fire on any run once their min-age is
// met; DAILY ones (pass arc, cap-hit) fire only in the 13:00 UTC run.
//
// Development mode vs live (the owner's switch):
//   flag:email-engine  "on" = the brain runs at all (master kill)
//   flag:email-live    "on" = sends reach everyone, and ONLY in production:
//                       previews share the dev KV namespace, so the flag is
//                       read through emailLive() which refuses outside
//                       production. Anything else = dev mode:
//                       only the test allowlist receives real email; every
//                       other decision is logged as a would_send event with
//                       NO ledger write, so flipping live later delivers the
//                       still-eligible emails for real.
// Per-email flags gate each sender (welcome-email, lifecycle-engine, cap-email).

import type { User } from "./db";
import { resolvePass, passCoupon, mintPassCoupon } from "./pass";
import proLessonsJson from "../_data/pro-lessons.json";
import { meterMonth, METER_LIMIT } from "./meter";
import { sendMail, emailLive } from "./email";
import { renderEmail, SENDER, REPLY_TO, type TemplateData, type EmailCategory } from "./email-templates";
import { seqSendable, seqUrl, renderSeqEmail, getSeqCopy, getSeqPlan, SEQ_ITEMS } from "./nurture";
import { SITE_KEY } from "./site-key";

export interface BrainEnv {
  DB: D1Database;
  KV: KVNamespace;
  ZOHO_ZEPTOMAIL_TOKEN: string;
  ZOHO_ZEPTOMAIL_SENDER: string;
  EMAIL_UNSUB_SECRET?: string;
  EMAIL_TEST_ALLOWLIST?: string;
  // Only "production" lets email reach anyone but the allowlist (see emailLive).
  ENVIRONMENT?: string;
  // Pass day-27 coupon minting (pass.ts); absent = the coupon emails are skipped.
  PADDLE_API_KEY?: string;
  PADDLE_PRICE_SINGLE_MONTH?: string;
  PADDLE_PRICE_SINGLE_YEAR?: string;
  PADDLE_PRICE_AA_MONTH?: string;
  PADDLE_PRICE_AA_YEAR?: string;
}

const TRACK_NAMES: Record<string, string> = {
  foundations: "New to R", analyst: "Data Analyst", ds: "Data Scientist", ts: "Forecaster",
  researcher: "Researcher", developer: "R Developer", mleng: "ML Engineer",
};
const PRO_LESSON_TRACK = proLessonsJson as Record<string, string>;

/* The wall email answers "what is behind it" with the track's own figures
   instead of adjectives, so both halves of that answer are derived here from
   the same file the gate reads.

   TRACK_LOCKED counts the Pro lessons in each track. TRACK_TOPICS names a few
   of them in prose, taken verbatim in substance from the syllabus published on
   pricing.html, so the email can never promise something the page does not.
   Prose, not a bulleted list: renderPersonalNote sends these as plain personal
   notes precisely because benefit bullets are what the Promotions classifier
   keys on. */
const TRACK_LOCKED: Record<string, number> = (() => {
  const n: Record<string, number> = {};
  for (const t of Object.values(PRO_LESSON_TRACK)) n[t] = (n[t] || 0) + 1;
  return n;
})();

export function wallSample(trackKey = "ds"): {
  track_name: string; locked_count: number; track_topics: string;
} {
  /* The admin test send renders from live figures rather than a frozen
     sample, so the test email cannot drift from what subscribers receive
     as lessons are added to a track. */
  return {
    track_name: TRACK_NAMES[trackKey] || TRACK_NAMES.ds,
    locked_count: TRACK_LOCKED[trackKey] || 0,
    track_topics: TRACK_TOPICS[trackKey] || TRACK_TOPICS.ds,
  };
}

const TRACK_TOPICS: Record<string, string> = {
  /* These name lessons that EXIST. Sourcing them from pricing.html was a
     mistake: that page is ideal-first, the same as the roadmap, so it sells
     sections nobody has written yet. GARCH, duckdb, gt and non-equi joins all
     appeared there and none has a lesson. Check any edit against the built
     titles in courses.json before shipping it. */
  ds: "leak-free feature engineering, nested cross-validation, calibrated probabilities, model interpretability with SHAP, and putting a model into production",
  ts: "seasonal ARIMA and ETS, dynamic harmonic regression and TBATS for awkward seasonality, the Kalman filter, and judging a forecast with rolling-origin cross-validation",
  analyst: "joins, pivoting and rectangling, data.table for data bigger than memory, report-ready tables, and Quarto dashboards and Shiny",
};

function fmtHour(sec: number): string {
  const d = new Date(sec * 1000);
  return d.toLocaleString("en-GB", { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit", timeZone: "UTC" }) + " UTC";
}

export interface Decision {
  user_id: string;
  email: string;
  key: string;            // ledger key, e.g. 'welcome', 'pass-23', 'cap:2026-08'
  template: string;       // template registry key
  category: EmailCategory;
  action: "sent" | "would_send" | "skipped" | "error";
  reason: string;         // arbitration trace, human-readable
}

export interface BrainResult {
  ran: boolean;
  mode: "live" | "development" | "disabled";
  daily_run: boolean;
  decisions: Decision[];
}

const DAILY_HOUR_UTC = 13;
const MAX_SENDS_PER_RUN = 200;
const DEFAULT_ALLOWLIST = "selva@r-statistics.co,selva86@gmail.com";
const SITE = "https://r-statistics.co";

const fmtDate = (sec: number) =>
  new Date(sec * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

async function hmacHex(secret: string, msg: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function userSig(env: BrainEnv, userId: string): Promise<string | undefined> {
  if (!env.EMAIL_UNSUB_SECRET) return undefined;
  return hmacHex(env.EMAIL_UNSUB_SECRET, userId);
}

export async function unsubUrl(env: BrainEnv, userId: string, emailKey = ""): Promise<string | undefined> {
  const t = await userSig(env, userId);
  if (!t) return undefined;
  const k = emailKey ? `&k=${encodeURIComponent(emailKey)}` : "";
  return `${SITE}/api/email/unsubscribe?u=${encodeURIComponent(userId)}&t=${t}${k}`;
}

type UserRow = Pick<User, "id" | "email" | "display_name" | "created_at" | "pro_until"> & {
  signup_gate: string | null;
  signup_slug: string | null;
  email_status: string | null;
  email_progress: number;
};

interface Candidate {
  u: UserRow;
  key: string;
  template: string;
  category: EmailCategory;
  priority: number; // lower wins
  data: TemplateData;
  why: string;
}

export async function runBrain(
  env: BrainEnv,
  opts: { now?: number; execute?: boolean; forceDaily?: boolean } = {},
): Promise<BrainResult> {
  const now = opts.now ?? Math.floor(Date.now() / 1000);
  const execute = opts.execute === true;

  if ((await env.KV.get("flag:email-engine")) !== "on") {
    return { ran: false, mode: "disabled", daily_run: false, decisions: [] };
  }
  const live = await emailLive(env);
  // The daily batch is RESUMABLE. It used to get exactly one window a day, so
  // a run that was cut off part way through simply lost the rest of the list,
  // and because the list had no order it lost the same people every day: on
  // 2026-10-03, 98 of 242 opted-in readers got their lesson and the other 144
  // had never had one. A run that reaches its end stamps the day done; the
  // absence of that stamp is the only reliable signal that it was cut off, so
  // the later hours of the day read it and continue the batch. One KV get per
  // quiet hour. Every block below is keyed in the ledger and every reader is
  // held to one email a day, so continuing cannot double-send.
  const dayStamp = new Date(now * 1000).toISOString().slice(0, 10);
  const doneKey = `brain-daily-done:${dayStamp}`;
  const hourNow = new Date(now * 1000).getUTCHours();
  let dailyRun = opts.forceDaily || hourNow === DAILY_HOUR_UTC;
  if (!dailyRun && hourNow > DAILY_HOUR_UTC) {
    dailyRun = (await env.KV.get(doneKey)) !== "done";
  }
  const allow = new Set(
    (env.EMAIL_TEST_ALLOWLIST || DEFAULT_ALLOWLIST).split(",").map((s) => s.trim().toLowerCase()).filter(Boolean),
  );

  const flags = {
    welcome: (await env.KV.get("flag:welcome-email")) === "on",
    arc: (await env.KV.get("flag:lifecycle-engine")) === "on",
    cap: (await env.KV.get("flag:cap-email")) === "on",
    meter: (await env.KV.get("flag:exercise-meter")) === "on",
    seq: (await env.KV.get("flag:nurture-sequence")) === "on",
    wall: (await env.KV.get("flag:wall-email")) === "on",
    flip: (await env.KV.get("flag:flip-broadcast")) === "on",
    closedShelf: (await env.KV.get("flag:closed-shelf")) === "on",
  };

  const candidates: Candidate[] = [];
  const decisions: Decision[] = [];
  const dayStart = now - (now % 86400);

  // ONE ledger snapshot serves the seq walk, the per-candidate dedupe, and
  // the one-a-day rule. Before this, those were per-user/per-candidate
  // queries, and each D1 call counts against the Workers subrequest budget:
  // the 2026-08-25 daily run died on that cap mid-send. One subrequest now.
  const ledgerRows = (await env.DB.prepare(
    "SELECT user_id, email_key, sent_at FROM sent_emails",
  ).all<{ user_id: string; email_key: string; sent_at: number }>()).results ?? [];
  const ledger = new Map<string, Map<string, number>>();
  for (const r of ledgerRows) {
    let m = ledger.get(r.user_id);
    if (!m) { m = new Map(); ledger.set(r.user_id, m); }
    m.set(r.email_key, r.sent_at);
  }

  // ---- welcome (account, FAST: any run; 30min settle so backfill can set
  // signup_gate; 48h validity window, then it is noise) --------------------
  if (flags.welcome) {
    const rows = await env.DB.prepare(
      `SELECT u.id, u.email, u.display_name, u.created_at, u.pro_until,
              u.signup_gate, u.signup_slug, u.email_status, u.email_progress
       FROM users u
       WHERE u.deleted_at IS NULL
         AND u.created_at BETWEEN ?1 AND ?2
         -- Shared Supabase project: a row also appears when a machinelearningplus.com
         -- member visits for the first time (signup_site = 'mlplus'). Only rsc's own
         -- signups (legacy rows have NULL) get rsc's welcome.
         AND (u.signup_site IS NULL OR u.signup_site = ?3)
         AND NOT EXISTS (SELECT 1 FROM sent_emails s WHERE s.user_id = u.id AND s.email_key = 'welcome')
       LIMIT 200`,
    ).bind(now - 48 * 3600, now - 30 * 60, SITE_KEY).all<UserRow>();
    for (const u of rows.results ?? []) {
      const gate = (u.signup_gate || "").toLowerCase();
      const template =
        gate === "exercise" ? "welcome-exercise" :
        gate === "lesson" ? "welcome-lesson" : "welcome-browsing";
      const pass = await resolvePass(env, u as unknown as User, now).catch(() => null);
      candidates.push({
        u, key: "welcome", template, category: "account", priority: 0,
        data: {
          first_name: u.display_name,
          pass_end_date: pass && pass.claimed ? fmtDate(pass.ends_at) : undefined,
          hub_url: u.signup_slug ? `/${u.signup_slug.replace(/\.html$/, "")}.html` : undefined,
        },
        why: `signup ${Math.round((now - u.created_at) / 60)}min ago, gate=${gate || "none"}`,
      });
    }
  }

  // ---- pass arc (offers, DAILY). resolvePass is null while flag:da-pass is
  // off, so the whole arc is silent until the flip - by derivation. ---------
  if (flags.arc && dailyRun) {
    if ((await env.KV.get("flag:da-pass")) === "on") {
      // Claim-to-start: the arc runs on CLAIM day, so every email in it
      // reaches someone who actually opened the track. Unclaimed users are
      // simply not in the arc.
      const rows = await env.DB.prepare(
        `SELECT u.id, u.email, u.display_name, u.created_at, u.pro_until,
                u.signup_gate, u.signup_slug, u.email_status, u.email_progress,
                u.pass_claimed_at
         FROM users u
         WHERE u.deleted_at IS NULL AND u.pass_claimed_at IS NOT NULL
           AND u.pass_claimed_at >= ?1
         LIMIT 2000`,
      ).bind(now - 34 * 86400)
        .all<UserRow & { pass_claimed_at: number }>();
      for (const u of rows.results ?? []) {
        // Pro users have nothing expiring that matters; derivation retires them.
        if (u.pro_until === -1 || (u.pro_until ?? 0) > now) continue;
        const start = u.pass_claimed_at;
        const day = Math.floor((now - start) / 86400);
        const endsAt = start + 30 * 86400;
        const dataCommon: TemplateData = {
          first_name: u.display_name,
          pass_end_date: fmtDate(endsAt),
          next_lesson_url: "/roadmap/data-analyst.html",
        };
        if (day >= 23 && day <= 25) {
          candidates.push({ u, key: "pass-23", template: "pass-23", category: "offers", priority: 5, data: dataCommon, why: `pass day ${day}` });
        } else if (day >= 26 && day <= 28) {
          // The one-time 72-hour code (copy book 2c). Minted only when this
          // run really sends, so dry runs never litter Paddle with codes.
          const c = (execute && live)
            ? await mintPassCoupon(env, u.id, now).catch(() => null)
            : { code: "PASS23PREVIEW", expires_at: now + 72 * 3600 };
          if (c) {
            candidates.push({ u, key: "pass-27", template: "pass-27", category: "offers", priority: 2, data: {
              ...dataCommon, coupon_code: c.code, coupon_expiry: fmtHour(c.expires_at),
              offer_url: `${SITE}/pricing.html?code=${encodeURIComponent(c.code)}&src=pass&exp=${c.expires_at}`,
            }, why: `pass day ${day}, coupon ${c.code}` });
          }
        } else if (day === 29 && now < endsAt) {  // the last full day (day 30 never satisfies now < endsAt)
          const c = await passCoupon(env, u.id, now);
          candidates.push({ u, key: "pass-30", template: "pass-30", category: "offers", priority: 1, data: {
            ...dataCommon,
            coupon_line: c ? `Your 23% code ${c.code} still works until ${fmtHour(c.expires_at)}.` : "",
          }, why: `pass last day, ends ${fmtDate(endsAt)}` });
        } else if (day >= 30 && day <= 32) {
          const c = await passCoupon(env, u.id, now);
          candidates.push({ u, key: "pass-31", template: "pass-31", category: "offers", priority: 6, data: {
            ...dataCommon,
            coupon_last_call: c ? `One practical note: your 23% code ${c.code} is valid for a few more hours, until ${fmtHour(c.expires_at)}. After that it is gone.` : "",
          }, why: `pass day ${day}, landed` });
        }
      }
    }
  }

  // ---- wall follow-up (offers, FAST; copy book 3e). A signed-in free user
  // hit a Pro lesson wall (intent signal pro_wall_hit, written by the player)
  // 30 minutes to 24 hours ago. Once per lesson ever, at most once per 14
  // days, three lifetime. Pro users drop out by derivation. --------------------
  if (flags.wall) {
    const rows = await env.DB.prepare(
      `SELECT i.user_id, i.path, i.meta, MAX(i.at) AS at,
              u.id, u.email, u.display_name, u.created_at, u.pro_until,
              u.signup_gate, u.signup_slug, u.email_status, u.email_progress
       FROM intent_signals i JOIN users u ON u.id = i.user_id
       WHERE i.signal = 'pro_wall_hit' AND i.user_id IS NOT NULL
         AND i.at BETWEEN ?1 AND ?2
         AND u.deleted_at IS NULL
         AND (u.pro_until IS NULL OR (u.pro_until <> -1 AND u.pro_until < ?3))
       GROUP BY i.user_id, i.path
       LIMIT 300`,
    ).bind(now - 24 * 3600, now - 30 * 60, now).all<UserRow & { user_id: string; path: string; meta: string | null; at: number }>();
    for (const r of rows.results ?? []) {
      const slug = (r.path || "").replace(/^\//, "").replace(/\.html?$/i, "");
      if (!slug) continue;
      const key = `wall:${slug}`;
      const mine = ledger.get(r.id);
      if (mine?.has(key)) continue;
      const wallKeys = [...(mine?.keys() ?? [])].filter((k) => k.startsWith("wall:"));
      if (wallKeys.length >= 3) continue;
      const lastWall = Math.max(0, ...wallKeys.map((k) => mine?.get(k) ?? 0));
      if (lastWall && now - lastWall < 14 * 86400) continue;
      // meta = courseId:lessonOrder|title (player); title falls back to the slug words.
      const title = ((r.meta || "").split("|")[1] || slug.replace(/-/g, " ")).trim();
      /* Everything this email says is derived from the track, so an unmapped
         slug has nothing honest to say and is skipped rather than padded. The
         gate reads this same map, so a wall hit off-map should not happen. */
      const trackKey = PRO_LESSON_TRACK[slug] || "";
      const track = TRACK_NAMES[trackKey];
      if (!track || !TRACK_LOCKED[trackKey] || !TRACK_TOPICS[trackKey]) continue;
      candidates.push({ u: r, key, template: "wall", category: "offers", priority: 3, data: {
        first_name: r.display_name,
        lesson_title: title,
        track_name: track,
        locked_count: TRACK_LOCKED[trackKey],
        track_topics: TRACK_TOPICS[trackKey],
        lesson_url: `${SITE}/${slug}.html?utm_source=email&utm_campaign=wall`,
        offer_url: `${SITE}/pricing.html?utm_source=email&utm_campaign=wall`,
      }, why: `pro wall on ${slug} ${Math.round((now - r.at) / 60)}min ago` });
    }
  }

  /* ---- the closed shelf (offers). Daily lessons shut 72 hours after they
     arrive, so an engaged reader quietly accumulates lessons they worked
     through and can no longer reopen. Nothing has ever told them that, and it
     is the one argument for Pro that is both entirely true and impossible for
     anyone else to make.

     CLOSED_MIN is the pile worth mentioning. ENGAGED_MIN is what makes the
     email honest: of the 151 accounts with nine or more closed lessons, only
     34 have ever finished one. Mailing the other 117 would tell people who
     never opened anything that they had "missed" a great deal, which is both
     untrue in spirit and the fastest way to get marked as spam. Once per
     person, ever. ---------------------------------------------------------- */
  if (flags.closedShelf && dailyRun) {
    const CLOSED_MIN = 9;
    const ENGAGED_MIN = 2;
    const WINDOW_SEC = 72 * 3600;
    const rows = await env.DB.prepare(
      `SELECT u.id, u.email, u.display_name, u.created_at, u.pro_until,
              u.signup_gate, u.signup_slug, u.email_status, u.email_progress,
              COUNT(*) AS closed_n,
              (SELECT COUNT(*) FROM intent_signals i
                WHERE i.user_id = u.id AND i.signal = 'lesson_complete') AS engaged
         FROM sent_emails s JOIN users u ON u.id = s.user_id
        WHERE s.email_key LIKE 'seq:%' AND s.sent_at < ?1
          AND u.deleted_at IS NULL
          AND (u.pro_until IS NULL OR (u.pro_until <> -1 AND u.pro_until < ?2))
        GROUP BY u.id
       HAVING closed_n >= ?3 AND engaged >= ?4
        LIMIT 200`,
    ).bind(now - WINDOW_SEC, now, CLOSED_MIN, ENGAGED_MIN)
      .all<UserRow & { closed_n: number; engaged: number }>();

    const eligible = (rows.results ?? []).filter((r) => !ledger.get(r.id)?.has("closed-shelf"));
    if (eligible.length) {
      /* One query for every closed lesson belonging to the whole cohort, rather
         than one per person: this runs hourly and the row count is small. */
      const ids = eligible.map((r) => r.id);
      const marks = ids.map(() => "?").join(",");
      const seqRows = (await env.DB.prepare(
        `SELECT user_id, email_key, sent_at FROM sent_emails
          WHERE email_key LIKE 'seq:%' AND sent_at < ? AND user_id IN (${marks})`,
      ).bind(now - WINDOW_SEC, ...ids).all<{ user_id: string; email_key: string; sent_at: number }>()).results ?? [];
      const byUser = new Map<string, { seq: number; at: number }[]>();
      for (const r of seqRows) {
        const n = parseInt(String(r.email_key).split(":")[1] || "", 10);
        if (!Number.isFinite(n)) continue;
        const list = byUser.get(r.user_id) || [];
        list.push({ seq: n, at: r.sent_at });
        byUser.set(r.user_id, list);
      }
      for (const r of eligible) {
        const mine = (byUser.get(r.id) || []).sort((a, b) => b.at - a.at);
        const titles = mine
          .map((x) => SEQ_ITEMS[x.seq] && SEQ_ITEMS[x.seq].subject)
          .filter((t): t is string => !!t)
          .slice(0, 3);
        if (titles.length < 1) continue;   // nothing honest to name
        candidates.push({
          u: r, key: "closed-shelf", template: "closed-shelf", category: "offers", priority: 4,
          data: {
            first_name: r.display_name,
            closed_count: r.closed_n,
            lesson_list: titles.map((t) => "  " + t).join("\n"),
            offer_url: `${SITE}/pricing.html?utm_source=email&utm_campaign=closed-shelf`,
          },
          why: `${r.closed_n} closed, ${r.engaged} finished`,
        });
      }
    }
  }

  // ---- the flip announcement (account, FAST, one-time broadcast; copy book
  // 4). Everyone whose account predates KV flip:at gets it exactly once, in
  // slices of 150 per run so the hourly Worker never trips its budget. ----------
  if (flags.flip) {
    const flipAt = parseInt((await env.KV.get("flip:at")) || "0", 10);
    if (flipAt > 0) {
      const rows = await env.DB.prepare(
        `SELECT u.id, u.email, u.display_name, u.created_at, u.pro_until,
                u.signup_gate, u.signup_slug, u.email_status, u.email_progress
         FROM users u
         WHERE u.deleted_at IS NULL AND u.created_at < ?1
           AND NOT EXISTS (SELECT 1 FROM sent_emails s WHERE s.user_id = u.id AND s.email_key = 'flip')
         ORDER BY u.created_at DESC
         LIMIT 150`,
      ).bind(flipAt).all<UserRow>();
      for (const u of rows.results ?? []) {
        candidates.push({ u, key: "flip", template: "flip", category: "account", priority: 0,
          data: { first_name: u.display_name }, why: "flip announcement (one-time)" });
      }
    }
  }

  // ---- cap-hit (progress, DAILY; only meaningful while the meter is live).
  // Candidates by cheap SQL first, exact meter math per candidate after. ----
  if (flags.cap && flags.meter && dailyRun) {
    const monthStart = Math.floor(Date.UTC(
      new Date(now * 1000).getUTCFullYear(), new Date(now * 1000).getUTCMonth(), 1) / 1000);
    const monthKey = `cap:${new Date(now * 1000).toISOString().slice(0, 7)}`;
    const rows = await env.DB.prepare(
      `SELECT u.id, u.email, u.display_name, u.created_at, u.pro_until,
              u.signup_gate, u.signup_slug, u.email_status, u.email_progress,
              MAX(a.submitted_at) AS last_at, COUNT(*) AS n
       FROM exercise_attempts a JOIN users u ON u.id = a.user_id
       WHERE a.submitted_at >= ?1 AND a.source IS NOT 'backfill' AND u.deleted_at IS NULL
       GROUP BY a.user_id HAVING n >= ?2
       LIMIT 200`,
    ).bind(monthStart, METER_LIMIT).all<UserRow & { last_at: number; n: number }>();
    for (const u of rows.results ?? []) {
      if (u.pro_until === -1 || (u.pro_until ?? 0) > now) continue;
      if (now - u.last_at > 48 * 3600) continue; // validity: cap + 48h, else the wall already told them
      const m = await meterMonth(env.DB, u.id); // exact, lesson-hubs excluded
      if (m.attempts < METER_LIMIT) continue;
      candidates.push({
        u, key: monthKey, template: "cap", category: "progress", priority: 4,
        data: { first_name: u.display_name, reset_date: fmtDate(Date.parse(m.resetsIso + "T00:00:00Z") / 1000) },
        why: `hit ${m.attempts}/${METER_LIMIT} this month`,
      });
    }
  }

  // ---- nurture sequence (nurture, DAILY Mon-Sat; the send IS the lesson
  // unlock, so this must never fire for an unbuilt lesson - users hold at
  // the frontier until the factory catches up). Opt-in only. Sundays belong
  // to the recap. seq 0 (write-your-first-script) goes only to level_r=new
  // users; everyone else starts at seq 1. ----------------------------------
  if (flags.seq && dailyRun && new Date(now * 1000).getUTCDay() !== 0) {
    // The admin plan decides which emails are on and in what order.
    const seqPlan = await getSeqPlan(env.KV);
    const seqOrder: number[] = [];
    for (const p of seqPlan) if (p.enabled) seqOrder.push(p.seq);
    const rows = await env.DB.prepare(
      `SELECT u.id, u.email, u.display_name, u.created_at, u.pro_until,
              u.signup_gate, u.signup_slug, u.email_status, u.email_progress,
              u.level_r, u.nurture_paused_until
       FROM users u
       WHERE u.deleted_at IS NULL AND u.email_nurture = 1
       LIMIT 2000`,
    ).all<UserRow & { level_r: string | null; nurture_paused_until: number | null }>();
    for (const u of rows.results ?? []) {
      // The quiet-probe pause: the walk simply waits, then resumes in place.
      if (u.nurture_paused_until && u.nurture_paused_until > now) continue;
      const have = new Set<number>();
      for (const k of ledger.get(u.id)?.keys() ?? []) {
        if (k.startsWith("seq:")) have.add(parseInt(k.slice(4), 10));
      }
      // Next email = the first ENABLED plan entry this user has not received.
      // Reorders and switches apply cleanly mid-sequence: nobody repeats an
      // email, and a disabled one is simply never their next.
      let next = -1;
      for (const s of seqOrder) {
        if (s === 0 && (have.size > 0 || u.level_r !== "new")) continue; // seq 0 is only ever a FIRST email, and only for new-to-R users
        if (!have.has(s)) { next = s; break; }
      }
      if (next < 0 || !SEQ_ITEMS[next]) continue;
      if (!seqSendable(next)) continue; // frontier hold: lesson not built yet
      candidates.push({
        u, key: `seq:${next}`, template: `seq:${next}`, category: "nurture", priority: 8,
        data: { first_name: u.display_name, seq_day: have.size + 1 },
        why: `sequence day ${have.size + 1}, seq ${next} (${SEQ_ITEMS[next].kind})`,
      });
    }
  }

  /* ---- the silence ladder (nurture, DAILY; flag:quiet-probe).
   *
   * A reader who stops opening used to get one question, once, ever. Ignore
   * it and the lessons kept arriving indefinitely: 31 opted-in readers had
   * received lessons and never opened a single one. That is pointless for
   * them and it is the thing that decides whether anyone else's email reaches
   * an inbox at all, because a list full of never-opened mail is what a spam
   * filter reads as a list worth distrusting.
   *
   * So the question repeats, and then it ends:
   *
   *   15 unopened lessons -> "should I pause these?"
   *   30 unopened         -> the same question again
   *   45 unopened         -> a final notice saying they stop
   *   then                -> they stop, with one click to bring them back
   *
   * At one lesson a day, six days a week, that is first contact after about
   * two and a half weeks of silence, and quiet after about seven and a half.
   * Three emails over nearly two months is not nagging.
   *
   * The count is the UNBROKEN run of unopened lessons, newest first, so a
   * single open anywhere resets the whole ladder to zero and a reader who
   * comes back is never chased. Opens are read from the pixel and click rows
   * over 180 days, which has to be longer than the ladder itself or an open
   * at the start of it would scroll out of the window and be miscounted as
   * silence. ------------------------------------------------------------- */
  if (flags.seq && dailyRun && (await env.KV.get("flag:quiet-probe")) === "on") {
    const QUIET_STEP = 15;        // unopened lessons between rungs
    const PARK_SECONDS = 3650 * 86400;
    const engagedKeys = new Set<string>();
    const ev = (await env.DB.prepare(
      `SELECT DISTINCT user_id, email_key FROM email_events
       WHERE event IN ('open','click') AND email_key LIKE 'seq:%' AND at >= ?1`,
    ).bind(now - 180 * 86400).all<{ user_id: string; email_key: string }>()).results ?? [];
    for (const r of ev) engagedKeys.add(`${r.user_id}|${r.email_key}`);
    const rows = await env.DB.prepare(
      `SELECT u.id, u.email, u.display_name, u.created_at, u.pro_until,
              u.signup_gate, u.signup_slug, u.email_status, u.email_progress,
              u.nurture_paused_until
       FROM users u
       WHERE u.deleted_at IS NULL AND u.email_nurture = 1
       LIMIT 2000`,
    ).all<UserRow & { nurture_paused_until: number | null }>();
    for (const u of rows.results ?? []) {
      if (u.nurture_paused_until && u.nurture_paused_until > now) continue;
      const mine = ledger.get(u.id);
      const seqSends: Array<{ key: string; at: number }> = [];
      for (const [k, at] of mine ?? []) if (k.startsWith("seq:")) seqSends.push({ key: k, at });
      if (seqSends.length < QUIET_STEP) continue;
      seqSends.sort((a, b) => b.at - a.at);
      // give the newest lesson a day to be opened before counting it against them
      if (now - seqSends[0].at < 20 * 3600) continue;
      let unopened = 0;
      for (const s of seqSends) {
        if (engagedKeys.has(`${u.id}|${s.key}`)) break;
        unopened += 1;
      }
      if (unopened < QUIET_STEP) continue;

      /* Which rung are they on? The legacy `quiet-probe` key counts as the
         first question, so the 96 readers who already had it are not asked
         the same thing twice. */
      const asked1 = !!(mine?.has("quiet-probe") || mine?.has("quiet-probe:1"));
      const asked2 = !!mine?.has("quiet-probe:2");
      const toldLast = !!mine?.has("quiet-last-call");

      const sig = await userSig(env, u.id);
      if (!sig) continue;
      const base = `${SITE}/api/email/pause?u=${encodeURIComponent(u.id)}&t=${sig}`;

      if (toldLast) {
        /* They were warned and still have not opened anything. Stop. Consent
           is untouched: they never withdrew it, so this parks the series
           rather than opting them out, and the keep link below clears the
           park and resumes them exactly where they left off. Being parked
           excludes them from every block above, this one included, so it
           happens once.

           This is the one rung that is a state change rather than an email,
           so unlike the rest of candidate collection it has to respect the
           dry run: without this guard, opening the admin preview would park
           people for real. */
        if (!execute) {
          decisions.push({
            user_id: u.id, email: u.email, key: "quiet-stopped", template: "-",
            category: "nurture", action: "would_send",
            reason: `[dry-run] would stop the series: ${unopened} unopened after the final notice`,
          });
          continue;
        }
        try {
          await env.DB.prepare("UPDATE users SET nurture_paused_until = ?1 WHERE id = ?2")
            .bind(now + PARK_SECONDS, u.id).run();
          await env.DB.prepare(
            `INSERT INTO email_events (user_id, email, email_key, event, at, meta)
             VALUES (?1, ?2, 'quiet-stopped', 'pause', ?3, ?4)`,
          ).bind(u.id, u.email, now, `${unopened} unopened after the final notice`).run();
        } catch { /* try again tomorrow */ }
        continue;
      }

      if (asked2 && unopened >= 3 * QUIET_STEP) {
        candidates.push({
          u, key: "quiet-last-call", template: "quiet-last-call", category: "nurture", priority: 7,
          data: { first_name: u.display_name, keep_url: `${base}&d=0` },
          why: `${unopened} lesson emails unopened, final notice`,
        });
      } else if (asked1 && !asked2 && unopened >= 2 * QUIET_STEP) {
        candidates.push({
          u, key: "quiet-probe:2", template: "quiet-probe", category: "nurture", priority: 7,
          data: {
            first_name: u.display_name,
            pause_url: `${base}&d=14`,
            keep_url: `${base}&d=0`,
          },
          why: `${unopened} lesson emails unopened, asking a second time`,
        });
      } else if (!asked1) {
        candidates.push({
          u, key: "quiet-probe:1", template: "quiet-probe", category: "nurture", priority: 7,
          data: {
            first_name: u.display_name,
            pause_url: `${base}&d=14`,
            keep_url: `${base}&d=0`,
          },
          why: `${unopened} lesson emails unopened`,
        });
      }
    }
  }

  // ---- daily-series invitation (nurture, DAILY; one-time per user, gated
  // on flag:invite-series). Capped per run so the base is invited over
  // several daily runs - a deliberate deliverability warmup ramp. The
  // sent_emails key doubles as the once-only guard. --------------------------
  if (dailyRun && (await env.KV.get("flag:invite-series")) === "on") {
    // 60/run keeps the whole daily run inside the Workers subrequest budget
    // (the 2026-08-25 run at 150 blew the free plan's 50-cap mid-send) and
    // doubles as a gentler deliverability ramp: the base is invited in ~9 runs.
    const INVITE_CAP = 60;
    const rows = await env.DB.prepare(
      `SELECT u.id, u.email, u.display_name, u.created_at, u.pro_until,
              u.signup_gate, u.signup_slug, u.email_status, u.email_progress
       FROM users u
       WHERE u.deleted_at IS NULL AND u.email_progress = 1 AND u.email_nurture = 0
         AND (u.email_status IS NULL OR u.email_status = 'ok')
         AND NOT EXISTS (SELECT 1 FROM sent_emails s
                         WHERE s.user_id = u.id AND s.email_key = 'invite-series')
       ORDER BY u.created_at
       LIMIT ${INVITE_CAP}`,
    ).all<UserRow>();
    for (const u of rows.results ?? []) {
      const sig = await userSig(env, u.id);
      if (!sig) continue;
      candidates.push({
        u, key: "invite-series", template: "invite-series", category: "nurture", priority: 6,
        data: {
          first_name: u.display_name,
          join_url: `${SITE}/api/email/join-series?u=${encodeURIComponent(u.id)}&t=${sig}`,
        },
        why: "one-time invitation to the daily lesson series",
      });
    }
  }

  /* ---- write down what the day owes, BEFORE anything is sent.
   *
   * The starvation on 2026-10-03 went unnoticed for weeks because nothing
   * compared what was due against what went out: 242 readers were owed a
   * lesson, 99 got one, and no record of the first number existed anywhere.
   * The daily digest now reports both, which is what makes any future
   * divergence loud regardless of its cause.
   *
   * Recorded here rather than at the end so it survives a run that is cut
   * off, which is exactly the case worth reporting. First write of the day
   * wins: the catch-up runs after 13:00 see a shorter list and must not
   * overwrite the day's total. ------------------------------------------- */
  if (dailyRun && execute) {
    const owedKey = `brain-owed:${dayStamp}`;
    try {
      if (!(await env.KV.get(owedKey))) {
        const owed = new Set(
          candidates.filter((c) => c.key.startsWith("seq:")).map((c) => c.u.id),
        ).size;
        await env.KV.put(owedKey, String(owed), { expirationTtl: 14 * 86400 });
      }
    } catch { /* the digest reports "not recorded" rather than a wrong number */ }
  }

  // ---- arbitrate + send ---------------------------------------------------
  const byUser = new Map<string, Candidate[]>();
  for (const c of candidates) {
    if (!byUser.has(c.u.id)) byUser.set(c.u.id, []);
    (byUser.get(c.u.id) as Candidate[]).push(c);
  }

  // Serve the longest-waiting reader first. A Map iterates in insertion order,
  // which here was the order the database happened to return rows in, so the
  // same prefix of the list was served every single day and everyone past the
  // cut-off waited forever. Ordering by who was last written to means a run
  // that only gets through part of the list still gets through the part that
  // has waited longest, and the queue rotates instead of starving. Account mail
  // (welcome, receipts) is time-critical and keeps the front of the queue.
  // Transactional mail does not count as having been served. A reader who
  // signed up on Thursday, got their welcome on Thursday and has still never
  // had a lesson has waited longer FOR A LESSON than someone who had one on
  // Monday, and counting the welcome against them put them behind that person.
  // The one-a-day rule already discounts welcome for the same reason.
  const TRANSACTIONAL = new Set(["welcome", "flip"]);
  const lastTouch = (uid: string): number => {
    let m = 0;
    for (const [k, at] of ledger.get(uid) ?? []) {
      if (TRANSACTIONAL.has(k)) continue;
      if (at > m) m = at;
    }
    return m;
  };
  const queue = [...byUser.keys()].sort((a, b) => {
    const aAcct = (byUser.get(a) as Candidate[]).some((c) => c.category === "account") ? 0 : 1;
    const bAcct = (byUser.get(b) as Candidate[]).some((c) => c.category === "account") ? 0 : 1;
    if (aAcct !== bAcct) return aAcct - bAcct;
    return lastTouch(a) - lastTouch(b);
  });

  // The same lesson copy serves every reader on that lesson, and the same
  // override serves every reader on that template, but both were being fetched
  // from KV once per send: ~240 round trips a day on the critical path of a run
  // that is racing a wall-clock limit. Fetch each one once per run instead.
  const copyCache = new Map<string, unknown>();
  const seqCopyCache = new Map<number, Awaited<ReturnType<typeof getSeqCopy>>>();

  // Yield before the platform cuts us off. The daily run had grown long enough
  // to be killed in mid-loop, and an abrupt kill is not free: the ledger row is
  // written before the send, so the reader being processed at that moment is
  // recorded as having had their lesson and never receives it. Stopping on our
  // own clock turns that into a clean hand-off. The budget is set well inside
  // the request limit, and the hours after 13:00 continue the batch, so this
  // costs nothing but the wait.
  const RUN_BUDGET_MS = 60_000;
  const startedAt = Date.now();
  let yielded = false;

  let sends = 0;
  for (const userId of queue) {
    const list = byUser.get(userId) as Candidate[];
    const u = list[0].u;
    if (u.email_status === "bounced" || u.email_status === "complained") {
      decisions.push({ user_id: userId, email: u.email, key: "-", template: "-", category: "account", action: "skipped", reason: `suppressed: ${u.email_status}` });
      continue;
    }
    // Ledger dedupe (covers re-runs inside a day too).
    const pending: Candidate[] = [];
    const userLedger = ledger.get(userId);
    for (const c of list) {
      if (!userLedger?.has(c.key)) pending.push(c);
    }
    if (!pending.length) continue;

    // Consent per category (account always passes; offers arc is
    // service-adjacent per plan s4 and sends; progress honors the toggle).
    const allowed = pending.filter((c) =>
      c.category === "account" ? true :
      c.category === "progress" ? u.email_progress === 1 :
      c.category === "nurture" ? true : // sender already filtered on email_nurture=1
      true,
    );
    for (const c of pending.filter((x) => !allowed.includes(x))) {
      decisions.push({ user_id: userId, email: u.email, key: c.key, template: c.template, category: c.category, action: "skipped", reason: "consent: progress opted out" });
    }
    if (!allowed.length) continue;

    // One non-account email per user per day; account emails ride along free.
    const accountMails = allowed.filter((c) => c.category === "account");
    let others = allowed.filter((c) => c.category !== "account").sort((a, b) => a.priority - b.priority);
    if (others.length) {
      let sentTodayKey: string | null = null;
      if (userLedger) {
        for (const [k, at] of userLedger) {
          if (k !== "welcome" && at >= dayStart) { sentTodayKey = k; break; }
        }
      }
      if (sentTodayKey) {
        for (const c of others) decisions.push({ user_id: userId, email: u.email, key: c.key, template: c.template, category: c.category, action: "skipped", reason: `one-a-day: ${sentTodayKey} already sent today` });
        others = [];
      } else {
        for (const c of others.slice(1)) decisions.push({ user_id: userId, email: u.email, key: c.key, template: c.template, category: c.category, action: "skipped", reason: `lost arbitration to ${others[0].key}` });
        others = others.slice(0, 1);
      }
    }

    for (const c of [...accountMails, ...others]) {
      if (sends >= MAX_SENDS_PER_RUN || Date.now() - startedAt > RUN_BUDGET_MS) {
        yielded = true;
        decisions.push({ user_id: userId, email: u.email, key: c.key, template: c.template, category: c.category, action: "skipped", reason: sends >= MAX_SENDS_PER_RUN ? "run send cap reached; a later run continues the batch" : "run time budget reached; a later run continues the batch" });
        continue;
      }
      const devBlocked = !live && !allow.has((u.email || "").toLowerCase());
      if (!execute) {
        decisions.push({ user_id: userId, email: u.email, key: c.key, template: c.template, category: c.category, action: devBlocked ? "would_send" : "sent", reason: `[dry-run] ${c.why}` });
        continue;
      }
      if (devBlocked) {
        // One simulation row per (user, key) per day - the hourly heartbeat
        // would otherwise re-log the same pending users 24x and drown the
        // dashboard in duplicates.
        const already = await env.DB.prepare(
          "SELECT 1 AS x FROM email_events WHERE user_id = ?1 AND email_key = ?2 AND event = 'would_send' AND at >= ?3 LIMIT 1",
        ).bind(userId, c.key, dayStart).first<{ x: number }>();
        if (!already) {
          await env.DB.prepare(
            "INSERT INTO email_events (user_id, email, email_key, event, at, meta) VALUES (?1, ?2, ?3, 'would_send', ?4, ?5)",
          ).bind(userId, u.email, c.key, now, c.why).run();
        }
        decisions.push({ user_id: userId, email: u.email, key: c.key, template: c.template, category: c.category, action: "would_send", reason: `dev mode: ${c.why}` });
        continue;
      }
      // Ledger BEFORE send: a crash between the two loses one email, never
      // doubles it. Send failure rolls the row back, best effort.
      const ins = await env.DB.prepare(
        "INSERT OR IGNORE INTO sent_emails (user_id, email_key, sent_at) VALUES (?1, ?2, ?3)",
      ).bind(userId, c.key, now).run();
      if ((ins.meta?.changes ?? 0) === 0) continue; // raced by another run
      // One signature per user, not two: the unsubscribe link and the tracking
      // token are the same HMAC, and it was being computed twice per send.
      const sig = await userSig(env, userId);
      c.data.unsubscribe_url = sig
        ? `${SITE}/api/email/unsubscribe?u=${encodeURIComponent(userId)}&t=${sig}&k=${encodeURIComponent(c.key)}`
        : undefined;
      if (sig) c.data.track = { uid: userId, sig, key: c.key };
      let r: ReturnType<typeof renderEmail>;
      if (c.template.startsWith("seq:")) {
        const seqN = parseInt(c.template.slice(4), 10);
        const dest = seqUrl(seqN, userId, sig);
        if (!seqCopyCache.has(seqN)) seqCopyCache.set(seqN, await getSeqCopy(env.KV, seqN));
        const copy = seqCopyCache.get(seqN) ?? null;
        if (sig) {
          const vb = `${SITE}/api/email/vote?u=${encodeURIComponent(userId)}&k=${encodeURIComponent(c.key)}&t=${sig}&v=`;
          c.data.vote_up_url = vb + "up";
          c.data.vote_down_url = vb + "down";
        }
        r = dest ? renderSeqEmail(seqN, dest, c.data, copy) : null;
      } else {
        if (!copyCache.has(c.template)) {
          let o: unknown = null;
          try {
            const raw = await env.KV.get(`emailcopy:${c.template}`);
            if (raw) o = JSON.parse(raw);
          } catch { /* default */ }
          copyCache.set(c.template, o);
        }
        r = renderEmail(c.template, c.data, copyCache.get(c.template) as never);
      }
      if (!r) {
        decisions.push({ user_id: userId, email: u.email, key: c.key, template: c.template, category: c.category, action: "error", reason: "no template" });
        continue;
      }
      const res = await sendMail(env, {
        to: { email: u.email, name: u.display_name || undefined },
        subject: r.subject, htmlBody: r.html, textBody: r.text,
        from: SENDER, replyTo: REPLY_TO,
      });
      if (res.ok) {
        sends += 1;
        await env.DB.prepare(
          "INSERT INTO email_events (user_id, email, email_key, event, at, meta) VALUES (?1, ?2, ?3, 'sent', ?4, ?5)",
        ).bind(userId, u.email, c.key, now, c.why).run();
        decisions.push({ user_id: userId, email: u.email, key: c.key, template: c.template, category: c.category, action: "sent", reason: c.why });
      } else {
        await env.DB.prepare("DELETE FROM sent_emails WHERE user_id = ?1 AND email_key = ?2").bind(userId, c.key).run();
        await env.DB.prepare(
          "INSERT INTO email_events (user_id, email, email_key, event, at, meta) VALUES (?1, ?2, ?3, 'error', ?4, ?5)",
        ).bind(userId, u.email, c.key, now, (res.error || String(res.status)).slice(0, 180)).run();
        decisions.push({ user_id: userId, email: u.email, key: c.key, template: c.template, category: c.category, action: "error", reason: res.error || `status ${res.status}` });
      }
    }
  }

  // Reaching this line is the proof the whole list was worked through, so the
  // later hours of the day can stand down. A run that is cut off never gets
  // here, which is exactly when the later hours should pick the batch up.
  if (dailyRun && execute && !yielded) {
    try { await env.KV.put(doneKey, "done", { expirationTtl: 3 * 86400 }); } catch { /* retry next hour */ }
  }
  return { ran: true, mode: live ? "live" : "development", daily_run: dailyRun, decisions };
}
