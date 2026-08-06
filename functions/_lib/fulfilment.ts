// Customer-facing purchase email (and the pre-renewal reminder).
//
// Until this shipped, a purchase sent the buyer nothing from us: the Paddle
// webhook granted entitlement and emailed the OWNER (notifyAdminEvent), and
// the customer's only confirmation was Paddle's receipt. Two real customers
// were fulfilled that way.
//
// Two templates, because the branches differ materially:
//   - lifetime      : one-time payment, no renewal, never mention one.
//   - subscription  : names the renewal date, the amount and how to cancel.
//                     An unannounced annual renewal is a leading chargeback
//                     trigger, so the terms are stated at purchase time and
//                     again ~7 days before the charge (sweepRenewalReminders).
//
// GATING. Every customer send is behind KV flag `flag:fulfilment-email`
// (`flag:renewal-reminder` for the reminder), DEFAULT OFF until the 2026-09-08
// launch. While the flag is off nothing is sent, but the full rendered message
// is still recorded to audit_log as `fulfilment.email.skipped_flag_off`, so the
// exact copy a customer would have received is inspectable before launch:
//
//   SELECT at, action, ref, meta_json FROM audit_log
//   WHERE action LIKE 'fulfilment.email.%' ORDER BY at DESC LIMIT 20;
//
// Flip it on with:
//   wrangler kv key put --binding KV flag:fulfilment-email on
//
// IDEMPOTENCY (the repo's hardest bug class). Three layers, so a replayed or
// duplicated Paddle delivery cannot mail a customer twice:
//   1. webhooks/paddle.ts returns early when webhook_events already holds the
//      event_id, so a plain retry never reaches this module.
//   2. a permanent KV marker `fulfil-emailed:<transaction id>` is claimed
//      BEFORE the send, which also covers two DIFFERENT event ids describing
//      the same transaction. Released on a failed send so the next delivery
//      retries rather than silently swallowing the email.
//   3. renewals are excluded at the call site by transaction origin
//      (`subscription_recurring`), so a yearly renewal never re-sends the
//      welcome email.
// The reminder uses the same claim-first marker, keyed per billing period:
// `renewal-reminded:<subscription id>:<period end>`.

import { sendMail, emailShell } from "./email";

// Structural env: functions/_middleware.ts Env satisfies this. Declared
// locally (rather than importing Env) so the module is unit-testable without
// pulling the whole middleware graph in.
export interface FulfilmentEnv {
  DB: D1Database;
  KV: KVNamespace;
  ZOHO_ZEPTOMAIL_TOKEN: string;
  ZOHO_ZEPTOMAIL_SENDER: string;
  PADDLE_API_KEY?: string;
}

const SUPPORT_EMAIL = "support@r-statistics.co";
const SITE = "https://r-statistics.co";
const DASHBOARD_URL = `${SITE}/dashboard.html`;
const BILLING_URL = `${SITE}/account-billing.html`;
const SIGNATURE = "Selva\nr-statistics.co";

// Roadmap destination per Single-track scope key (matches the TRACK_KEYS set
// in webhooks/paddle.ts and the pricing-page chips).
const TRACKS: Record<string, { name: string; path: string }> = {
  ds: { name: "Data Scientist", path: "/roadmap/data-scientist.html" },
  ts: { name: "Forecaster", path: "/roadmap/forecaster.html" },
  researcher: { name: "Researcher", path: "/roadmap/researcher.html" },
  developer: { name: "R Developer", path: "/roadmap/r-developer.html" },
  analyst: { name: "Data Analyst", path: "/roadmap/data-analyst.html" },
  foundations: { name: "New to R", path: "/roadmap/new-to-r.html" },
};

// Currencies with no minor unit. Paddle amounts are always in the lowest
// denomination, so dividing these by 100 would understate the charge by 100x
// in an email that states what the customer was billed.
const ZERO_DECIMAL = new Set([
  "BIF", "CLP", "DJF", "GNF", "ISK", "JPY", "KMF", "KRW",
  "PYG", "RWF", "UGX", "VND", "VUV", "XAF", "XOF", "XPF",
]);

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Paddle totals arrive as a string in the currency's lowest denomination.
// Returns "" when either half is missing, so callers can drop the line
// entirely rather than print a half-truth.
export function formatMoney(total: unknown, currency: unknown): string {
  const cur = typeof currency === "string" ? currency.trim().toUpperCase() : "";
  const raw = total == null ? "" : String(total).trim();
  if (!cur || !raw || !/^-?\d+$/.test(raw)) return "";
  const minor = parseInt(raw, 10);
  if (!Number.isFinite(minor)) return "";
  const amount = ZERO_DECIMAL.has(cur) ? String(minor) : (minor / 100).toFixed(2);
  return `${amount} ${cur}`;
}

// "8 September 2027" (UTC). Paddle timestamps are UTC and the customer's
// charge date is decided in UTC, so no local-timezone guessing.
export function formatDate(unixSec: number | null | undefined): string {
  if (unixSec == null || !Number.isFinite(unixSec)) return "";
  const d = new Date(unixSec * 1000);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function isoToUnix(iso: unknown): number | null {
  if (typeof iso !== "string" || !iso) return null;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? Math.floor(t / 1000) : null;
}

export interface PlanCopy {
  // Split so the purchase sentence can put the price between the thing and its
  // billing term: "You bought <noun> for 72.15 USD, <term>." Glued together
  // ("the X track, billed yearly for 72.15 USD") it reads as though the yearly
  // billing costs 72.15, which is exactly the ambiguity that starts disputes.
  noun: string;
  term: string;         // "billed yearly" | "billed monthly" | "" for lifetime
  listLabel: string;    // reads as a bare list value: "Plan: <listLabel>"
  startUrl: string;
  startLine: string;    // the one instruction after the link
}

const DASHBOARD_LINE =
  "Pick a track there and it will put you back on your next lesson every time you return.";

// One concrete place to start, chosen from the plan. Single-track buyers get
// their own roadmap; catalog-wide buyers get the dashboard, which is where
// their next lesson is picked up on every later visit.
export function describePlan(plan: string, track?: string | null): PlanCopy {
  const t = track && TRACKS[track] ? TRACKS[track] : null;
  const term = plan.endsWith("_month") ? "billed monthly" : "billed yearly";

  if (plan === "lifetime") {
    return {
      noun: "lifetime access to r-statistics.co",
      term: "",
      listLabel: "Lifetime access",
      startUrl: DASHBOARD_URL,
      startLine: DASHBOARD_LINE,
    };
  }
  if (plan.startsWith("allaccess")) {
    return {
      noun: "All-Access to r-statistics.co",
      term,
      listLabel: `All-Access, ${term}`,
      startUrl: DASHBOARD_URL,
      startLine: DASHBOARD_LINE,
    };
  }
  if (plan.startsWith("single") && t) {
    return {
      noun: `the ${t.name} track`,
      term,
      listLabel: `${t.name} track, ${term}`,
      startUrl: SITE + t.path,
      startLine: "Section 1 is at the top of that page. Work down it in order.",
    };
  }
  return {
    noun: "your r-statistics.co plan",
    term,
    listLabel: `r-statistics.co, ${term}`,
    startUrl: DASHBOARD_URL,
    startLine: DASHBOARD_LINE,
  };
}

// ---------------------------------------------------------------- templates

export interface RenderedEmail {
  subject: string;
  textBody: string;
  htmlBody: string;
}

export interface LifetimeArgs {
  name?: string | null;
  email: string;
  money: string;        // "319.87 EUR", or "" to omit the amount
  startUrl: string;
  startLine: string;
}

export interface SubscriptionArgs {
  name?: string | null;
  email: string;
  planNoun: string;     // "the Data Scientist track"
  planTerm: string;     // "billed yearly"
  money: string;
  renewalDate: string;  // "8 September 2027", or "" if genuinely unknown
  renewalMoney: string;
  startUrl: string;
  startLine: string;
  remindBeforeRenewal: boolean; // only promise the reminder if it is switched on
}

export interface ReminderArgs {
  name?: string | null;
  planLabel: string;
  renewalDate: string;
  renewalMoney: string;
}

function greeting(name?: string | null): string {
  const first = (name || "").trim().split(/\s+/)[0];
  return first && first.length <= 40 ? `Hi ${first},` : "Hi,";
}

function para(text: string): string {
  return `<p style="margin:0 0 14px">${escapeHtml(text)}</p>`;
}

function link(url: string): string {
  return `<p style="margin:0 0 14px"><a href="${escapeHtml(url)}" style="color:#2056d2">${escapeHtml(url)}</a></p>`;
}

export function buildLifetimeEmail(args: LifetimeArgs): RenderedEmail {
  const hi = greeting(args.name);
  const bought = args.money
    ? `You bought lifetime access to r-statistics.co for ${args.money}.`
    : "You bought lifetime access to r-statistics.co.";

  const textBody = [
    hi,
    "",
    "Your payment went through and your account is open.",
    "",
    `${bought} That was a one-time payment. There is no renewal, no subscription and no further charge, ever.`,
    "",
    `Everything on the site is unlocked on the account you signed in with, ${args.email}: every track, every interactive lesson, every graded exercise and the certificates.`,
    "",
    "Start here:",
    args.startUrl,
    args.startLine,
    "",
    "Your receipt and invoice come from Paddle, who handle payments for us.",
    "",
    `If anything does not work, or your account still looks locked, write to ${SUPPORT_EMAIL} or reply to this email. I read both.`,
    "",
    SIGNATURE,
  ].join("\n");

  const contentHtml = [
    `<p style="font-size:17px;font-weight:600;color:#0a0d14;margin:0 0 14px">${escapeHtml(hi)}</p>`,
    para("Your payment went through and your account is open."),
    para(`${bought} That was a one-time payment. There is no renewal, no subscription and no further charge, ever.`),
    para(`Everything on the site is unlocked on the account you signed in with, ${args.email}: every track, every interactive lesson, every graded exercise and the certificates.`),
    para("Start here:"),
    link(args.startUrl),
    para(args.startLine),
    para("Your receipt and invoice come from Paddle, who handle payments for us."),
    para(`If anything does not work, or your account still looks locked, write to ${SUPPORT_EMAIL} or reply to this email. I read both.`),
    para("Selva"),
  ].join("\n");

  return {
    subject: "Your r-statistics.co lifetime access is open",
    textBody,
    htmlBody: emailShell({
      preheader: "One-time payment, no renewal. Here is where to start.",
      contentHtml,
      ctaUrl: args.startUrl,
      ctaLabel: "Start learning",
    }),
  };
}

export function buildSubscriptionEmail(args: SubscriptionArgs): RenderedEmail {
  const hi = greeting(args.name);
  const suffix = args.planTerm ? `, ${args.planTerm}` : "";
  const bought = args.money
    ? `You bought ${args.planNoun} for ${args.money}${suffix}.`
    : `You bought ${args.planNoun}${suffix}.`;

  // Renewal terms, stated plainly. Every bullet is dropped rather than guessed
  // when the underlying value is missing.
  const terms: string[] = [];
  if (args.renewalDate) {
    terms.push(
      args.renewalMoney
        ? `It renews automatically on ${args.renewalDate} for ${args.renewalMoney}.`
        : `It renews automatically on ${args.renewalDate}.`,
    );
  } else {
    terms.push("It renews automatically at the end of each billing period.");
  }
  if (args.remindBeforeRenewal) {
    terms.push("We email you 7 days before that charge, so it is never a surprise.");
  }
  terms.push(
    args.renewalDate
      ? `You can cancel any time at ${BILLING_URL}. Cancelling stops the next charge and you keep access until ${args.renewalDate}.`
      : `You can cancel any time at ${BILLING_URL}. Cancelling stops the next charge and you keep access to the end of the period you have paid for.`,
  );

  const textBody = [
    hi,
    "",
    "Your payment went through and your account is open.",
    "",
    bought,
    "",
    "Your renewal terms, in plain words:",
    ...terms.map((t) => `- ${t}`),
    "",
    `Everything in the plan is unlocked on the account you signed in with, ${args.email}.`,
    "",
    "Start here:",
    args.startUrl,
    args.startLine,
    "",
    "Your receipt and invoice come from Paddle, who handle payments for us.",
    "",
    `If anything does not work, or your account still looks locked, write to ${SUPPORT_EMAIL} or reply to this email. I read both.`,
    "",
    SIGNATURE,
  ].join("\n");

  const contentHtml = [
    `<p style="font-size:17px;font-weight:600;color:#0a0d14;margin:0 0 14px">${escapeHtml(hi)}</p>`,
    para("Your payment went through and your account is open."),
    para(bought),
    para("Your renewal terms, in plain words:"),
    `<ul style="margin:0 0 14px;padding-left:20px">${terms
      .map((t) => `<li style="margin:0 0 6px">${escapeHtml(t)}</li>`)
      .join("")}</ul>`,
    para(`Everything in the plan is unlocked on the account you signed in with, ${args.email}.`),
    para("Start here:"),
    link(args.startUrl),
    para(args.startLine),
    para("Your receipt and invoice come from Paddle, who handle payments for us."),
    para(`If anything does not work, or your account still looks locked, write to ${SUPPORT_EMAIL} or reply to this email. I read both.`),
    para("Selva"),
  ].join("\n");

  return {
    subject: "Your r-statistics.co access is open",
    textBody,
    htmlBody: emailShell({
      preheader: args.renewalDate
        ? `Access is live. Renews ${args.renewalDate}, cancel any time.`
        : "Access is live. Cancel any time.",
      contentHtml,
      ctaUrl: args.startUrl,
      ctaLabel: "Start learning",
    }),
  };
}

export function buildRenewalReminderEmail(args: ReminderArgs): RenderedEmail {
  const hi = greeting(args.name);
  const facts: string[] = [
    `Plan: ${args.planLabel}`,
    `Renews: ${args.renewalDate}`,
  ];
  if (args.renewalMoney) facts.push(`Amount: ${args.renewalMoney}`);

  const textBody = [
    hi,
    "",
    `This is the heads-up before your r-statistics.co subscription renews on ${args.renewalDate}. If you want to keep it, do nothing.`,
    "",
    ...facts.map((f) => `- ${f}`),
    "",
    `If you would rather stop, cancel before that date at ${BILLING_URL}. You keep access until ${args.renewalDate} either way.`,
    "",
    `Any question about the charge, write to ${SUPPORT_EMAIL} or reply to this email.`,
    "",
    SIGNATURE,
  ].join("\n");

  const contentHtml = [
    `<p style="font-size:17px;font-weight:600;color:#0a0d14;margin:0 0 14px">${escapeHtml(hi)}</p>`,
    para(`This is the heads-up before your r-statistics.co subscription renews on ${args.renewalDate}. If you want to keep it, do nothing.`),
    `<ul style="margin:0 0 14px;padding-left:20px">${facts
      .map((f) => `<li style="margin:0 0 6px">${escapeHtml(f)}</li>`)
      .join("")}</ul>`,
    para(`If you would rather stop, cancel before that date at ${BILLING_URL}. You keep access until ${args.renewalDate} either way.`),
    para(`Any question about the charge, write to ${SUPPORT_EMAIL} or reply to this email.`),
    para("Selva"),
  ].join("\n");

  return {
    subject: `Your r-statistics.co subscription renews on ${args.renewalDate}`,
    textBody,
    htmlBody: emailShell({
      preheader: `Renews ${args.renewalDate}. Cancel before then if you would rather not.`,
      contentHtml,
      ctaUrl: BILLING_URL,
      ctaLabel: "Manage your plan",
    }),
  };
}

// ------------------------------------------------------------- audit + send

type Outcome = "sent" | "failed" | "skipped_flag_off" | "skipped";

async function audit(
  env: FulfilmentEnv,
  outcome: Outcome,
  userId: string | null,
  ref: string,
  meta: Record<string, unknown>,
): Promise<void> {
  await env.DB
    .prepare("INSERT INTO audit_log (user_id, actor, action, ref, meta_json, at) VALUES (?, 'system', ?, ?, ?, ?)")
    .bind(userId, `fulfilment.email.${outcome}`, ref, JSON.stringify(meta), Math.floor(Date.now() / 1000))
    .run()
    .catch((e) => console.warn(`[fulfilment] audit_log insert failed: ${e}`));
}

export interface FulfilmentPlan {
  kind: "lifetime" | "subscription";
  refId: string;                 // Paddle transaction id: the idempotency key
  userId: string | null;
  to: { email: string; name?: string | null };
  plan: string;                  // 'lifetime' | 'single_year' | 'allaccess_year' | ...
  track?: string | null;
  money: string;                 // already formatted, "" if unknown
  renewalAt?: number | null;     // unix, from the transaction's billing period
  subscriptionId?: string | null; // lets us read the AUTHORITATIVE next charge
}

// The customer purchase email. Best-effort by contract: callers fire it
// through waitUntil and a failure never affects the webhook response.
export async function sendFulfilmentEmail(
  env: FulfilmentEnv,
  plan: FulfilmentPlan,
): Promise<void> {
  try {
    if (!plan.to?.email || !plan.refId) return;

    // Single-track scope reaches us either on the transaction's checkout
    // custom_data or, when subscription.* landed first, in the KV scope cache.
    // Paddle does not guarantee the order of the two deliveries, so try both
    // before falling back to the generic dashboard start link.
    let track = plan.track ?? null;
    if (!track && plan.userId && plan.plan.startsWith("single")) {
      track = await env.KV.get(`tracks:${plan.userId}`).catch(() => null);
    }
    const copy = describePlan(plan.plan, track);

    // Renewal figures: prefer Paddle's own next-charge record over the
    // transaction we just saw, because a first-period discount makes the
    // amount paid a bad predictor of the amount that will renew. Falls back to
    // the transaction's billing period, and to the paid amount, when the API
    // is unavailable.
    let renewalAt = plan.renewalAt ?? null;
    let renewalMoney = plan.money;
    if (plan.kind === "subscription" && plan.subscriptionId) {
      const next = await fetchNextRenewal(env, plan.subscriptionId);
      if (next) { renewalAt = next.at; renewalMoney = next.money || plan.money; }
    }
    const renewalDate = formatDate(renewalAt);

    // The reminder is a separate flag; only promise it when it is actually on.
    const remind = plan.kind === "subscription"
      && (await env.KV.get("flag:renewal-reminder").catch(() => null)) === "on";

    const rendered = plan.kind === "lifetime"
      ? buildLifetimeEmail({
          name: plan.to.name, email: plan.to.email, money: plan.money,
          startUrl: copy.startUrl, startLine: copy.startLine,
        })
      : buildSubscriptionEmail({
          name: plan.to.name, email: plan.to.email,
          planNoun: copy.noun, planTerm: copy.term,
          money: plan.money, renewalDate, renewalMoney,
          startUrl: copy.startUrl, startLine: copy.startLine,
          remindBeforeRenewal: remind,
        });

    // Flag gate FIRST, so that flipping the flag on later does not find the
    // once-marker already burned by a dry pre-launch delivery.
    if ((await env.KV.get("flag:fulfilment-email")) !== "on") {
      await audit(env, "skipped_flag_off", plan.userId, plan.refId, {
        reason: "flag:fulfilment-email is off",
        kind: plan.kind,
        to: plan.to.email,
        plan: plan.plan,
        track,
        amount: plan.money || null,
        renews_on: renewalDate || null,
        subject: rendered.subject,
        would_have_sent: rendered.textBody,
      });
      return;
    }

    // Claim the once-marker BEFORE sending (see the idempotency note at top).
    const marker = `fulfil-emailed:${plan.refId}`;
    if (await env.KV.get(marker)) {
      await audit(env, "skipped", plan.userId, plan.refId, {
        reason: "already_sent", kind: plan.kind, to: plan.to.email,
      });
      return;
    }
    await env.KV.put(marker, "1");

    const res = await sendMail(env, {
      to: { email: plan.to.email, name: plan.to.name || plan.to.email },
      subject: rendered.subject,
      htmlBody: rendered.htmlBody,
      textBody: rendered.textBody,
      replyTo: { email: SUPPORT_EMAIL, name: "r-statistics.co support" },
    });

    await audit(env, res.ok ? "sent" : "failed", plan.userId, plan.refId, {
      kind: plan.kind,
      to: plan.to.email,
      plan: plan.plan,
      amount: plan.money || null,
      renews_on: renewalDate || null,
      subject: rendered.subject,
      status: res.status,
      error: res.error ?? null,
    });

    // Release the claim on failure so a Paddle retry (or the next sweep) can
    // try again instead of the customer silently getting nothing.
    if (!res.ok) await env.KV.delete(marker).catch(() => {});
  } catch (e) {
    console.warn(`[fulfilment] send failed for ${plan.refId}: ${(e as Error).message}`);
  }
}

// ------------------------------------------------------- renewal reminders
//
// Pages Functions have no cron trigger, so this follows the same pattern as
// _lib/cartrecovery.ts: a KV-throttled sweep that piggybacks on traffic to an
// endpoint the owner already hits (/api/admin/stats). That makes delivery
// dependent on the dashboard being opened; a real schedule needs a companion
// Worker with a cron trigger, which this repo does not have.
//
// Window is 5 to 9 days out rather than exactly 7, so one missed sweep does
// not lose the reminder entirely.

const SWEEP_INTERVAL = 6 * 3600;
const WINDOW_MIN = 5 * 86400;
const WINDOW_MAX = 9 * 86400;
const MAX_SENDS_PER_SWEEP = 25;

interface NextRenewal { at: number; money: string }

// Read the authoritative next charge from Paddle rather than from our mirror:
// the mirror does not store the recurring amount, and an email that states the
// wrong figure is worse than one that omits it. Returns null on any failure,
// and the caller then skips that subscription (no marker) so it retries.
async function fetchNextRenewal(
  env: FulfilmentEnv, subId: string,
): Promise<NextRenewal | null> {
  if (!env.PADDLE_API_KEY) return null;
  try {
    const base = env.PADDLE_API_KEY.startsWith("pdl_sdbx_")
      ? "https://sandbox-api.paddle.com" : "https://api.paddle.com";
    const resp = await fetch(
      `${base}/subscriptions/${encodeURIComponent(subId)}?include=next_transaction`,
      { headers: { Authorization: `Bearer ${env.PADDLE_API_KEY}` } },
    );
    if (!resp.ok) return null;
    const body = await resp.json() as {
      data?: {
        status?: string;
        next_billed_at?: string | null;
        scheduled_change?: { action?: string } | null;
        next_transaction?: { details?: { totals?: { total?: string; currency_code?: string } } } | null;
      };
    };
    const d = body?.data;
    if (!d || (d.status !== "active" && d.status !== "trialing")) return null;
    if (d.scheduled_change?.action === "cancel") return null; // already cancelled
    const at = isoToUnix(d.next_billed_at);
    if (!at) return null;
    const totals = d.next_transaction?.details?.totals;
    return { at, money: formatMoney(totals?.total, totals?.currency_code) };
  } catch (_) {
    return null;
  }
}

export async function sweepRenewalReminders(env: FulfilmentEnv): Promise<void> {
  try {
    if ((await env.KV.get("flag:renewal-reminder")) !== "on") return;
    if (!env.PADDLE_API_KEY) return;

    const now = Math.floor(Date.now() / 1000);
    const last = Number((await env.KV.get("renewal-sweep:last")) || 0);
    if (now - last < SWEEP_INTERVAL) return;
    await env.KV.put("renewal-sweep:last", String(now));

    const rows = await env.DB.prepare(
      `SELECT s.external_id AS sub_id, s.plan AS plan, s.current_period_end AS period_end,
              u.id AS user_id, u.email AS email, u.display_name AS name
       FROM subscriptions s JOIN users u ON u.id = s.user_id
       WHERE s.provider = 'paddle'
         AND s.plan <> 'lifetime'
         AND s.status IN ('active', 'trialing')
         AND COALESCE(s.cancel_at_period_end, 0) = 0
         AND s.current_period_end BETWEEN ?1 AND ?2
         AND u.deleted_at IS NULL
       ORDER BY s.current_period_end ASC
       LIMIT 100`,
    ).bind(now + WINDOW_MIN, now + WINDOW_MAX)
      .all<{ sub_id: string; plan: string; period_end: number; user_id: string; email: string; name: string | null }>();

    let sent = 0;
    for (const row of rows.results ?? []) {
      if (sent >= MAX_SENDS_PER_SWEEP) break;
      if (!row.email) continue;

      const next = await fetchNextRenewal(env, row.sub_id);
      if (!next) continue; // cancelled, unknown, or a transient API failure: retry next sweep
      if (next.at - now > WINDOW_MAX || next.at - now < WINDOW_MIN) continue;

      // One reminder per subscription per billing period. Claimed before the
      // send; released on failure so the next sweep retries.
      const marker = `renewal-reminded:${row.sub_id}:${next.at}`;
      if (await env.KV.get(marker)) continue;
      await env.KV.put(marker, "1");

      const track = await env.KV.get(`tracks:${row.user_id}`).catch(() => null);
      const copy = describePlan(row.plan, track);
      const rendered = buildRenewalReminderEmail({
        name: row.name,
        planLabel: copy.listLabel,
        renewalDate: formatDate(next.at),
        renewalMoney: next.money,
      });

      const res = await sendMail(env, {
        to: { email: row.email, name: row.name || row.email },
        subject: rendered.subject,
        htmlBody: rendered.htmlBody,
        textBody: rendered.textBody,
        replyTo: { email: SUPPORT_EMAIL, name: "r-statistics.co support" },
      });
      if (res.ok) sent++;
      else await env.KV.delete(marker).catch(() => {});

      await audit(env, res.ok ? "sent" : "failed", row.user_id, row.sub_id, {
        kind: "renewal_reminder",
        to: row.email,
        plan: row.plan,
        renews_on: formatDate(next.at),
        amount: next.money || null,
        status: res.status,
        error: res.error ?? null,
      });
    }
  } catch (e) {
    console.warn(`[fulfilment] renewal sweep failed: ${(e as Error).message}`);
  }
}
