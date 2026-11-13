// GET  /api/bar-offer   may this visitor be shown the strip's discount, and what is it worth
// POST /api/bar-offer   { email, a, campaign } -> mint a personal code and mail it now
//
// The announcement strip's own offer (owner decisions 2026-11-13): 20% off
// every individual plan, 24 hours, one redemption, delivered by email.
//
// WHY THE GET EXISTS AT ALL, rather than the strip hardcoding "20% off". Three
// things have to be true before a reader may be shown a discount, and none of
// them is knowable in the browser:
//
//   The programme is on. One KV flag, so it can be stopped without a deploy.
//
//   The reader is not already paying. This is the whole reason the server has
//   to answer: the browser's idea of "signed in" lags a lapsed or cancelled
//   plan, and offering 20% off All-Access to somebody already paying for
//   All-Access is how you turn a customer into a refund request. The cookie
//   fallback below is not optional either, for the reason /api/offer records:
//   the middleware only fills context.data.user from a Supabase bearer, and
//   this is a plain same-origin fetch that carries cookies and no bearer.
//
//   Every price the offer claims to cover actually exists. An empty restrict_to
//   means "every price in the account", which would quietly include Teams.
//
// And the percent comes back from the server so the strip, the email and the
// pricing banner cannot drift apart, which is the rule offer.ts was written to
// enforce after the bar said 20 and the price-alert flow said 23.
//
// THE POST SENDS INLINE, not through the hourly brain. A 24-hour code whose
// mail waits up to an hour for the next cron run is not a 24-hour code, and
// the brain's "at most one non-account email per person per day" cap could
// drop it altogether. It also does not consult flag:email-live: that flag
// gates the lifecycle engine, and this is a transactional reply to something
// the reader asked for thirty seconds ago, closer to a receipt than a campaign.
//
// RATE LIMITS ARE THE POINT, not a precaution. Every other caller of
// mintPersonalOffer runs from a server-side sweep over rows the site already
// owns. This one mints a real Paddle discount object from an anonymous form on
// 2,090 pages, which without limits is a way to fill the Paddle account with
// junk and to mail strangers on request. Four of them, cheapest first.

import type { Env, RequestData } from "../_middleware";
import { json, jsonError } from "../_lib/errors";
import { isOn } from "../_lib/flags";
import { resolvePro } from "../_lib/entitlement";
import { getUserById } from "../_lib/db";
import { readCookie, verifyIdCookie, ID_COOKIE } from "../_lib/idcookie";
import { readBarOfferConfig, allPlanPriceIds, mintPersonalOffer } from "../_lib/offer";
import { senderFor } from "../_lib/email-templates";
import { sendMail } from "../_lib/email";

type BarEnv = Env & {
  PADDLE_API_KEY?: string;
  EDGE_ID_SECRET?: string;
  ENVIRONMENT?: string;
  ZOHO_ZEPTOMAIL_TOKEN?: string;
  ZOHO_ZEPTOMAIL_SENDER?: string;
  EMAIL_TEST_ALLOWLIST?: string;
  PADDLE_PRICE_AA_MONTH?: string;
  PADDLE_PRICE_AA_QUARTER?: string;
  PADDLE_PRICE_AA_YEAR?: string;
  PADDLE_PRICE_SINGLE_MONTH?: string;
  PADDLE_PRICE_SINGLE_YEAR?: string;
  PADDLE_PRICE_LIFETIME?: string;
};

/* Per anon id and per IP in a day, and across the whole site in a day. The
   global cap is the one that matters: it bounds how much damage a script can do
   to the Paddle account before anybody notices, and at 20% of a day's traffic
   it is far above honest demand. */
const MAX_PER_ANON_DAY = 3;
const MAX_PER_IP_DAY = 5;
const MAX_PER_SITE_DAY = 300;
/* A reader whose code is already live gets it mailed again, once, if their
   first copy went astray. Same code, so no second Paddle object: a resend is a
   delivery problem, not a new offer. */
const RESEND_AFTER_SEC = 15 * 60;

let tableReady = false;
async function ensureTable(DB: D1Database) {
  if (tableReady) return;
  await DB.prepare(
    "CREATE TABLE IF NOT EXISTS bar_offers (" +
    "id INTEGER PRIMARY KEY AUTOINCREMENT, at INTEGER NOT NULL, " +
    "email TEXT NOT NULL, anon_id TEXT, campaign TEXT, code TEXT NOT NULL, " +
    "discount_id TEXT, percent INTEGER NOT NULL, expires_at INTEGER NOT NULL, " +
    "sent_at INTEGER, send_error TEXT, redeemed_at INTEGER)"
  ).run();
  /* For a table that a preview already created from the first version of this
     statement. CREATE TABLE IF NOT EXISTS says nothing about columns, and
     schema.sql has drifted from production before by exactly this route. */
  await DB.prepare("ALTER TABLE bar_offers ADD COLUMN discount_id TEXT").run().catch(() => {});
  await DB.prepare(
    "CREATE INDEX IF NOT EXISTS idx_bar_offers_discount ON bar_offers (discount_id)"
  ).run().catch(() => {});
  await DB.prepare(
    "CREATE INDEX IF NOT EXISTS idx_bar_offers_email ON bar_offers (email, at)"
  ).run();
  await DB.prepare(
    "CREATE INDEX IF NOT EXISTS idx_bar_offers_at ON bar_offers (at)"
  ).run();
  tableReady = true;
}

interface BarOfferState {
  enabled: boolean;
  percent: number;
  hours: number;
  /* The sale's name for the strip's chip, from KV. Carried on the refusals
     too, so the shape of the answer does not change with the answer. */
  label: string | null;
  reason?: string;
}

/* Shared by both verbs on purpose. The POST re-runs the whole check rather
   than trusting that the GET said yes, because the two are separate requests
   and anything in between (a purchase, the flag going off) must win. */
async function eligibility(
  context: { request: Request; env: BarEnv; data: RequestData },
): Promise<BarOfferState> {
  const now = Math.floor(Date.now() / 1000);
  const cfg = await readBarOfferConfig(context.env);
  const base: BarOfferState = { enabled: false, percent: cfg.percent, hours: cfg.hours, label: cfg.label };

  if (!(await isOn(context.env.KV, "bar-offer", context).catch(() => false))) {
    return { ...base, reason: "flag_off" };
  }

  const { missing } = allPlanPriceIds(context.env);
  if (missing.length) {
    /* Loud, because the strip would otherwise advertise a discount on plans
       the code cannot touch, and the reader finds out at checkout. */
    console.error(`[bar-offer] refusing: unset price vars ${missing.join(", ")}`);
    return { ...base, reason: "no_prices" };
  }

  let user = context.data.user ?? null;
  if (!user) {
    const secret = context.env.EDGE_ID_SECRET || "";
    const sub = secret ? await verifyIdCookie(secret, readCookie(context.request, ID_COOKIE)) : null;
    if (sub) user = await getUserById(context.env.DB, sub).catch(() => null);
  }
  if (user) {
    const ent = await resolvePro(context.env.DB, user, now).catch(() => null);
    if (ent?.pro) return { ...base, reason: "already_pro" };
  }

  return { enabled: true, percent: cfg.percent, hours: cfg.hours, label: cfg.label };
}

export const onRequestGet: PagesFunction<BarEnv, string, RequestData> = async (context) => {
  const state = await eligibility(context);
  return new Response(JSON.stringify(state), {
    headers: {
      "Content-Type": "application/json",
      // The answer depends on who is asking; a cached "enabled" would offer a
      // discount to somebody who has since started paying.
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
};

/* Deliberately permissive. The job is to reject what cannot be an address, not
   to adjudicate RFC 5322: a real address wrongly refused is a lost sale, and a
   fake one costs a bounce. */
function looksLikeEmail(v: unknown): v is string {
  return typeof v === "string" && v.length >= 6 && v.length <= 160 && /^[^\s@]+@[^\s@.]+\.[^\s@]+$/.test(v);
}

async function bump(KV: KVNamespace, key: string, cap: number, ttl: number): Promise<boolean> {
  try {
    const n = Number((await KV.get(key)) || 0);
    if (n >= cap) return false;
    await KV.put(key, String(n + 1), { expirationTtl: ttl });
    return true;
  } catch (_) {
    /* KV unreachable. Allow rather than refuse: the D1 per-email check below
       is the limit that protects a person, and these three protect a budget. */
    return true;
  }
}

function barEmailBody(o: {
  code: string; percent: number; hours: number; url: string; origin: string;
}): { subject: string; textBody: string; htmlBody: string } {
  /* A note, not a campaign. No shell, no logo, no button, no tracking pixel:
     this is a reply to somebody who asked a question thirty seconds ago, and
     the Promotions classifier keys on exactly the chrome a template would add.

     Shortened to this form by the owner on 2026-11-13, after reading the first
     one that went out. The window is now a labelled line rather than a
     sentence, and two claims came out with the prose: that the code works
     once, and that the percent then holds at every renewal. Both were in the
     reader's favour, so dropping them misleads nobody. But if the recur
     decision is ever capped or turned off, the renewal sentence has to come
     back, because then its absence would be the flattering reading. */
  const validity = o.hours % 24 === 0
    ? `${o.hours / 24} day${o.hours === 24 ? "" : "s"}`
    : `${o.hours} hour${o.hours === 1 ? "" : "s"}`;
  const paras = [
    `Here is the code you asked for: ${o.code}`,
    `It takes ${o.percent}% off any plan, Lifetime included.`,
    `Use this link and proceed to checkout for the discount to apply: ${o.url}`,
    `If you would rather do it yourself, pick a plan on that page and paste ${o.code} into the discount box.`,
    `Validity: ${validity}`,
    `Then, start here: ${o.origin}/roadmap/`,
    `Guyen`,
  ];
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  /* The link now sits inside a sentence instead of on its own line, so the old
     "is this paragraph exactly the url" test would have rendered it as dead
     text in the HTML copy. Linkify any http run instead, which also fixes the
     roadmap link at the end: that one has been unclickable in every note sent
     so far, for exactly this reason.

     Escaping first is what makes this safe. It leaves &amp; inside the href,
     which is the correct encoding for a literal ampersand in an attribute, so
     the query string survives. Trailing sentence punctuation stays outside the
     anchor, or "start here: <url>." would link the full stop too. */
  const linkify = (s: string) =>
    esc(s).replace(/https?:\/\/[^\s<]*[^\s<.,;:!?)]/g, (m) => `<a href="${m}">${m}</a>`);
  const html = paras.map((p) => `<p style="margin:0 0 14px">${linkify(p)}</p>`).join("");
  return {
    subject: `Your ${o.percent}% code`,
    textBody: paras.join("\n\n"),
    htmlBody:
      `<div style="font:15px/1.6 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1a1a1a;max-width:560px">${html}</div>`,
  };
}

export const onRequestPost: PagesFunction<BarEnv, string, RequestData> = async (context) => {
  const state = await eligibility(context);
  if (!state.enabled) {
    /* 200 with sent:false rather than an error. The strip asks for eligibility
       before it renders, so landing here means the answer changed underneath
       the reader, and that is not their mistake to see as a failure. */
    return json({ sent: false, reason: state.reason || "unavailable" });
  }

  let body: { email?: unknown; a?: unknown; campaign?: unknown } = {};
  try { body = (await context.request.json()) as typeof body; } catch (_) { /* empty */ }
  if (!looksLikeEmail(body.email)) {
    return jsonError(400, "bad_email", "That does not look like an email address.");
  }
  const email = body.email.trim().toLowerCase();
  const anon = typeof body.a === "string" ? body.a.slice(0, 40) : "";
  const campaign = typeof body.campaign === "string" ? body.campaign.slice(0, 40) : "";
  const now = Math.floor(Date.now() / 1000);
  const origin = new URL(context.request.url).origin;

  await ensureTable(context.env.DB);

  /* 1. Already holds a live code. Resend the same one if their copy could have
        gone astray, otherwise say yes and send nothing: the code is sitting in
        their inbox, and a second identical mail is noise. Either way no new
        Paddle object, which is what stops a reload loop minting hundreds. */
  const live = await context.env.DB.prepare(
    "SELECT id, code, percent, expires_at, sent_at FROM bar_offers " +
    "WHERE email = ? AND expires_at > ? ORDER BY at DESC LIMIT 1"
  ).bind(email, now).first<{ id: number; code: string; percent: number; expires_at: number; sent_at: number | null }>()
    .catch(() => null);

  if (live) {
    if (live.sent_at && now - live.sent_at < RESEND_AFTER_SEC) {
      return json({ sent: true, resent: false });
    }
    const url = `${origin}/pricing.html?code=${live.code}&src=bar&exp=${live.expires_at}`;
    const { from, replyTo } = senderFor("offers");
    const mail = barEmailBody({
      code: live.code, percent: live.percent,
      hours: Math.max(1, Math.round((live.expires_at - now) / 3600)),
      url, origin,
    });
    const res = await sendMail(context.env as never, { to: { email }, from, replyTo, ...mail });
    await context.env.DB.prepare("UPDATE bar_offers SET sent_at = ?, send_error = ? WHERE id = ?")
      .bind(res.ok ? now : null, res.ok ? null : (res.error || "send_failed"), live.id).run().catch(() => {});
    return json({ sent: res.ok, resent: true });
  }

  /* 2. Per anon id, 3. per IP, 4. per site. Checked before the mint so a
        refusal costs no Paddle object. */
  const day = new Date(now * 1000).toISOString().slice(0, 10);
  const ip = context.request.headers.get("CF-Connecting-IP") || "0";
  if (anon && !(await bump(context.env.KV, `baroffer:a:${day}:${anon}`, MAX_PER_ANON_DAY, 86400))) {
    return json({ sent: false, reason: "rate_anon" });
  }
  if (!(await bump(context.env.KV, `baroffer:ip:${day}:${ip}`, MAX_PER_IP_DAY, 86400))) {
    return json({ sent: false, reason: "rate_ip" });
  }
  if (!(await bump(context.env.KV, `baroffer:all:${day}`, MAX_PER_SITE_DAY, 86400))) {
    console.error("[bar-offer] daily site cap reached");
    return json({ sent: false, reason: "rate_site" });
  }

  const offer = await mintPersonalOffer(context.env, {
    email,
    percent: state.percent,
    hours: state.hours,
    priceIds: allPlanPriceIds(context.env).ids,
    /* The prefix is not decoration: pricing.html decides from it alone which
       terms a code may be carried into, and BAR is the one that means "every
       individual plan, never Teams". */
    prefix: "BAR",
    what: "any plan",
    siteOrigin: origin,
  });
  if (!offer) {
    console.error(`[bar-offer] mint failed for ${email}`);
    return jsonError(502, "mint_failed", "Could not create the code. Please try again.");
  }

  const url = `${origin}/pricing.html?code=${offer.code}&src=bar&exp=${offer.expiresAt}`;
  const { from, replyTo } = senderFor("offers");
  const mail = barEmailBody({
    code: offer.code, percent: offer.percent, hours: state.hours, url, origin,
  });
  const res = await sendMail(context.env as never, { to: { email }, from, replyTo, ...mail });

  /* Recorded whether or not the mail left, and with the reason it did not. A
     minted Paddle code that nobody can account for is worse than a failed
     send: it is live, it is redeemable, and without this row there is nothing
     to find it by. */
  await context.env.DB.prepare(
    "INSERT INTO bar_offers (at, email, anon_id, campaign, code, discount_id, percent, expires_at, sent_at, send_error) " +
    "VALUES (?,?,?,?,?,?,?,?,?,?)"
  ).bind(
    now, email, anon || null, campaign || null, offer.code, offer.discountId,
    offer.percent, offer.expiresAt,
    res.ok ? now : null, res.ok ? null : (res.error || "send_failed"),
  ).run().catch((e) => { console.error(`[bar-offer] row insert failed for ${offer.code}: ${e}`); });

  if (!res.ok) {
    console.error(`[bar-offer] send failed for ${email}: ${res.error}`);
    return jsonError(502, "send_failed", "The code was created but the email did not go out.");
  }
  return json({ sent: true, resent: false });
};
