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
//   flag:email-live    "on" = sends reach everyone. Anything else = dev mode:
//                       only the test allowlist receives real email; every
//                       other decision is logged as a would_send event with
//                       NO ledger write, so flipping live later delivers the
//                       still-eligible emails for real.
// Per-email flags gate each sender (welcome-email, lifecycle-engine, cap-email).

import type { User } from "./db";
import { resolvePass } from "./pass";
import { meterMonth, METER_LIMIT } from "./meter";
import { sendMail } from "./email";
import { renderEmail, type TemplateData, type EmailCategory } from "./email-templates";

export interface BrainEnv {
  DB: D1Database;
  KV: KVNamespace;
  ZOHO_ZEPTOMAIL_TOKEN: string;
  ZOHO_ZEPTOMAIL_SENDER: string;
  EMAIL_UNSUB_SECRET?: string;
  EMAIL_TEST_ALLOWLIST?: string;
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
const REPLY_TO = { email: "selva@r-statistics.co", name: "Selva" };
const SITE = "https://r-statistics.co";

const fmtDate = (sec: number) =>
  new Date(sec * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

async function hmacHex(secret: string, msg: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function unsubUrl(env: BrainEnv, userId: string): Promise<string | undefined> {
  if (!env.EMAIL_UNSUB_SECRET) return undefined;
  const t = await hmacHex(env.EMAIL_UNSUB_SECRET, userId);
  return `${SITE}/api/email/unsubscribe?u=${encodeURIComponent(userId)}&t=${t}`;
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
  const live = (await env.KV.get("flag:email-live")) === "on";
  const dailyRun = opts.forceDaily || new Date(now * 1000).getUTCHours() === DAILY_HOUR_UTC;
  const allow = new Set(
    (env.EMAIL_TEST_ALLOWLIST || DEFAULT_ALLOWLIST).split(",").map((s) => s.trim().toLowerCase()).filter(Boolean),
  );

  const flags = {
    welcome: (await env.KV.get("flag:welcome-email")) === "on",
    arc: (await env.KV.get("flag:lifecycle-engine")) === "on",
    cap: (await env.KV.get("flag:cap-email")) === "on",
    meter: (await env.KV.get("flag:exercise-meter")) === "on",
  };

  const candidates: Candidate[] = [];
  const dayStart = now - (now % 86400);

  // ---- welcome (account, FAST: any run; 30min settle so backfill can set
  // signup_gate; 48h validity window, then it is noise) --------------------
  if (flags.welcome) {
    const rows = await env.DB.prepare(
      `SELECT u.id, u.email, u.display_name, u.created_at, u.pro_until,
              u.signup_gate, u.signup_slug, u.email_status, u.email_progress
       FROM users u
       WHERE u.deleted_at IS NULL
         AND u.created_at BETWEEN ?1 AND ?2
         AND NOT EXISTS (SELECT 1 FROM sent_emails s WHERE s.user_id = u.id AND s.email_key = 'welcome')
       LIMIT 200`,
    ).bind(now - 48 * 3600, now - 30 * 60).all<UserRow>();
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
          pass_end_date: pass ? fmtDate(pass.ends_at) : undefined,
          hub_url: u.signup_slug ? `/${u.signup_slug.replace(/\.html$/, "")}.html` : undefined,
        },
        why: `signup ${Math.round((now - u.created_at) / 60)}min ago, gate=${gate || "none"}`,
      });
    }
  }

  // ---- pass arc (offers, DAILY). resolvePass is null while flag:da-pass is
  // off, so the whole arc is silent until the flip - by derivation. ---------
  if (flags.arc && dailyRun) {
    const launchedRaw = await env.KV.get("da-pass:launched_at");
    const launched = launchedRaw ? parseInt(launchedRaw, 10) : NaN;
    if ((await env.KV.get("flag:da-pass")) === "on") {
      // Users whose pass day could be 23-33: start = max(created_at, launched).
      const oldestStart = now - 34 * 86400;
      const rows = await env.DB.prepare(
        `SELECT u.id, u.email, u.display_name, u.created_at, u.pro_until,
                u.signup_gate, u.signup_slug, u.email_status, u.email_progress
         FROM users u
         WHERE u.deleted_at IS NULL AND u.created_at >= ?1
         LIMIT 2000`,
      ).bind(Number.isFinite(launched) ? Math.min(oldestStart, launched) : oldestStart)
        .all<UserRow>();
      for (const u of rows.results ?? []) {
        // Pro users have nothing expiring that matters; derivation retires them.
        if (u.pro_until === -1 || (u.pro_until ?? 0) > now) continue;
        const start = Number.isFinite(launched) ? Math.max(u.created_at, launched) : u.created_at;
        const day = Math.floor((now - start) / 86400);
        const endsAt = start + 30 * 86400;
        const dataCommon: TemplateData = {
          first_name: u.display_name,
          pass_end_date: fmtDate(endsAt),
          next_lesson_url: "/roadmap/data-analyst.html",
        };
        if (day >= 23 && day <= 25) {
          candidates.push({ u, key: "pass-23", template: "pass-23", category: "offers", priority: 5, data: dataCommon, why: `pass day ${day}` });
        } else if (day === 30 && now < endsAt) {
          candidates.push({ u, key: "pass-30", template: "pass-30", category: "offers", priority: 1, data: dataCommon, why: `pass day 30, ends ${fmtDate(endsAt)}` });
        } else if (day >= 31 && day <= 33) {
          candidates.push({ u, key: "pass-31", template: "pass-31", category: "offers", priority: 6, data: dataCommon, why: `pass day ${day}, landed` });
        }
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

  // ---- arbitrate + send ---------------------------------------------------
  const decisions: Decision[] = [];
  const byUser = new Map<string, Candidate[]>();
  for (const c of candidates) {
    if (!byUser.has(c.u.id)) byUser.set(c.u.id, []);
    (byUser.get(c.u.id) as Candidate[]).push(c);
  }

  let sends = 0;
  for (const [userId, list] of byUser) {
    const u = list[0].u;
    if (u.email_status === "bounced" || u.email_status === "complained") {
      decisions.push({ user_id: userId, email: u.email, key: "-", template: "-", category: "account", action: "skipped", reason: `suppressed: ${u.email_status}` });
      continue;
    }
    // Ledger dedupe (covers re-runs inside a day too).
    const pending: Candidate[] = [];
    for (const c of list) {
      const dup = await env.DB.prepare(
        "SELECT 1 AS x FROM sent_emails WHERE user_id = ?1 AND email_key = ?2",
      ).bind(userId, c.key).first<{ x: number }>();
      if (!dup) pending.push(c);
    }
    if (!pending.length) continue;

    // Consent per category (account always passes; offers arc is
    // service-adjacent per plan s4 and sends; progress honors the toggle).
    const allowed = pending.filter((c) =>
      c.category === "account" ? true :
      c.category === "progress" ? u.email_progress === 1 : true,
    );
    for (const c of pending.filter((x) => !allowed.includes(x))) {
      decisions.push({ user_id: userId, email: u.email, key: c.key, template: c.template, category: c.category, action: "skipped", reason: "consent: progress opted out" });
    }
    if (!allowed.length) continue;

    // One non-account email per user per day; account emails ride along free.
    const accountMails = allowed.filter((c) => c.category === "account");
    let others = allowed.filter((c) => c.category !== "account").sort((a, b) => a.priority - b.priority);
    if (others.length) {
      const sentToday = await env.DB.prepare(
        "SELECT email_key FROM sent_emails WHERE user_id = ?1 AND sent_at >= ?2 AND email_key != 'welcome' LIMIT 1",
      ).bind(userId, dayStart).first<{ email_key: string }>();
      if (sentToday) {
        for (const c of others) decisions.push({ user_id: userId, email: u.email, key: c.key, template: c.template, category: c.category, action: "skipped", reason: `one-a-day: ${sentToday.email_key} already sent today` });
        others = [];
      } else {
        for (const c of others.slice(1)) decisions.push({ user_id: userId, email: u.email, key: c.key, template: c.template, category: c.category, action: "skipped", reason: `lost arbitration to ${others[0].key}` });
        others = others.slice(0, 1);
      }
    }

    for (const c of [...accountMails, ...others]) {
      if (sends >= MAX_SENDS_PER_RUN) {
        decisions.push({ user_id: userId, email: u.email, key: c.key, template: c.template, category: c.category, action: "skipped", reason: "run send cap reached; next run picks it up" });
        continue;
      }
      const devBlocked = !live && !allow.has((u.email || "").toLowerCase());
      if (!execute) {
        decisions.push({ user_id: userId, email: u.email, key: c.key, template: c.template, category: c.category, action: devBlocked ? "would_send" : "sent", reason: `[dry-run] ${c.why}` });
        continue;
      }
      if (devBlocked) {
        await env.DB.prepare(
          "INSERT INTO email_events (user_id, email, email_key, event, at, meta) VALUES (?1, ?2, ?3, 'would_send', ?4, ?5)",
        ).bind(userId, u.email, c.key, now, c.why).run();
        decisions.push({ user_id: userId, email: u.email, key: c.key, template: c.template, category: c.category, action: "would_send", reason: `dev mode: ${c.why}` });
        continue;
      }
      // Ledger BEFORE send: a crash between the two loses one email, never
      // doubles it. Send failure rolls the row back, best effort.
      const ins = await env.DB.prepare(
        "INSERT OR IGNORE INTO sent_emails (user_id, email_key, sent_at) VALUES (?1, ?2, ?3)",
      ).bind(userId, c.key, now).run();
      if ((ins.meta?.changes ?? 0) === 0) continue; // raced by another run
      c.data.unsubscribe_url = await unsubUrl(env, userId);
      const r = renderEmail(c.template, c.data);
      if (!r) {
        decisions.push({ user_id: userId, email: u.email, key: c.key, template: c.template, category: c.category, action: "error", reason: "no template" });
        continue;
      }
      const res = await sendMail(env, {
        to: { email: u.email, name: u.display_name || undefined },
        subject: r.subject, htmlBody: r.html, textBody: r.text, replyTo: REPLY_TO,
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

  return { ran: true, mode: live ? "live" : "development", daily_run: dailyRun, decisions };
}
