// The discount programme: one percentage, one delivery route, and no clock on
// any public page.
//
// WHAT CHANGED ON 2026-10-19, AND WHY. This file used to run a timed homepage
// bar: a window open 12:00 to 20:00 UTC, a fresh Paddle code minted per window,
// and a countdown ticking toward the deadline. Three measurements retired it.
//
//   Reach. The bar was homepage-only, and the homepage is 3 to 5% of traffic
//   (34 visits on the day it launched, against roughly a thousand site-wide).
//   Eight hours on and sixteen off left about a dozen impressions a day. Three
//   windows ran; all three codes finished with times_used = 0.
//
//   Honesty. The window reopened every single day, so "Ends in 04h 57m" was
//   true of the code and false of the offer. A countdown that resets at
//   midnight is manufactured scarcity, and under the Unfair Commercial
//   Practices Directive (Annex I, point 7) falsely stating that something is
//   available only for a very limited time is prohibited outright, with no
//   case-by-case defence. The homepage is also the page a lecturer reads before
//   linking a course page, so the exposure was worst exactly where the reach
//   was thinnest.
//
//   Where the money actually leaks. 160 people viewed pricing in nine days and
//   5 opened a checkout. The ones who leave are anonymous and unreachable, so a
//   discount shown on the page changes nothing for them: they have already seen
//   a price and gone. Their own answers say price is the top objection, 14 of 28.
//
// So the discount is asked for rather than broadcast, and it arrives by email as
// a personal single-use code. That makes the deadline real instead of
// theatrical: one recipient, one redemption, an expiry Paddle itself enforces.
// The clock lives in an inbox, where a deadline is ordinary, rather than on a
// public page where it is a dark pattern. `price_alerts` is the state machine
// (pricealerts.ts); this file owns the percentage and the minting.

import { createPaddleDiscountWithId } from "./cartrecovery";

/* One number, in one place. Every surface that names a discount reads it from
   here: the pricing page's answer to "the price", the Pro wall, the outreach
   note and the price-alert emails. They used to disagree (the bar said 20, the
   price-alert flow said 23) which is a promise waiting to be compared by
   someone who received both. */
export interface OfferConfig {
  percent: number;      // whole percent off, annual plans only
  hours: number;        // how long a personal code stays alive
}

/* 23, not the retired bar's 20, because 23 is what the price-alert emails have
   been sending all along and this merge must not change anyone's price. One
   KV write moves every surface at once:
     wrangler kv key put --namespace-id <prod> offer:config '{"percent":20}' --remote */
export const DEFAULT_OFFER: OfferConfig = {
  percent: 23,
  hours: 7 * 24,
};

/* KV `offer:config` overrides either field with no deploy. It may still hold
   the retired window keys (onHours, offHours, anchorHour); they are ignored
   rather than rejected so an old value cannot break the read. */
export async function readOfferConfig(env: { KV: KVNamespace }): Promise<OfferConfig> {
  try {
    const raw = await env.KV.get("offer:config");
    if (!raw) return DEFAULT_OFFER;
    const p = JSON.parse(raw) as Partial<OfferConfig>;
    const cfg: OfferConfig = {
      percent: Number(p.percent) > 0 ? Math.round(Number(p.percent)) : DEFAULT_OFFER.percent,
      hours: Number(p.hours) > 0 ? Math.round(Number(p.hours)) : DEFAULT_OFFER.hours,
    };
    // A 100% code would hand the catalogue away; a 0% one is noise.
    if (cfg.percent < 1 || cfg.percent > 60) cfg.percent = DEFAULT_OFFER.percent;
    // Under an hour cannot be honoured by an hourly cron; over 30 days is not a
    // deadline, it is a price change.
    if (cfg.hours < 1 || cfg.hours > 30 * 24) cfg.hours = DEFAULT_OFFER.hours;
    return cfg;
  } catch (_) {
    return DEFAULT_OFFER;
  }
}

/* The annual price ids this offer is allowed to touch. Monthly is deliberately
   excluded: discounting it trains people to wait for a sale on the plan with
   the worst retention, and the owner chose annual-only. An empty list would
   mean "every price", so a missing env var must disable the offer rather than
   silently widen it. */
export interface OfferPriceEnv {
  PADDLE_PRICE_SINGLE_YEAR?: string;
  PADDLE_PRICE_AA_YEAR?: string;
}

export function annualPriceIds(env: OfferPriceEnv): string[] {
  return [env.PADDLE_PRICE_SINGLE_YEAR, env.PADDLE_PRICE_AA_YEAR]
    .filter((v): v is string => typeof v === "string" && v.length > 0);
}

/* ---------------------------------------------------------------------------
   THE BAR OFFER (owner decisions 2026-11-13). A SECOND programme, deliberately
   not a widening of the one above, because the two reach opposite people.

   The one above is asked for, on the pricing page, by somebody who has already
   read a price and said it is what is stopping them: 23%, seven days, annual
   only. This one is broadcast from the announcement strip to somebody who
   arrived on the ggplot2 gallery from a search and has never heard of the
   courses: 20%, 24 hours, every individual plan.

   Merging them would have meant changing the percent and the scope of a live
   flow nobody asked me to touch. What they do share is the part where
   duplication would actually cost something: the eligibility rule (never show
   a discount to somebody already paying) and mintPersonalOffer below.

   On 20% rather than 23%: it is what the retired homepage bar used, and it
   keeps the ladder honest, since somebody who asks should not do worse than
   somebody who was simply shown a bar.

   On 24 hours: the owner's call, against my suggestion of 72. The window only
   works if the mail is genuinely immediate, so api/bar-offer.ts sends inline
   from the request rather than handing the send to the hourly brain, and does
   not consult flag:email-live, which gates the lifecycle engine and would hold
   a code somebody asked for thirty seconds ago. */
export interface BarOfferConfig {
  percent: number;
  hours: number;
  /* The sale's name, shown in the strip's chip in place of the percent badge.
     It lives in KV rather than in announce-bar.js on purpose: a seasonal name
     hardcoded into a file is a file that is still saying BLACK FRIDAY in
     December, and taking the sale down should not need a deploy. Null means
     the chip reads "<percent>% OFF", which is what it said before sales had
     names. */
  label: string | null;
}

/* KV `offer:bar-config` moves all three without a deploy:
     wrangler kv key put --binding KV offer:bar-config \
       '{"percent":20,"hours":24}' --remote
   and for a named sale:
     '{"percent":31,"hours":24,"label":"BLACK FRIDAY"}' */
export const DEFAULT_BAR_OFFER: BarOfferConfig = {
  percent: 20,
  hours: 24,
  label: null,
};

/* The chip is a small badge beside the message, so this is deliberately
   strict. Control characters are stripped and runs of whitespace collapsed,
   because this value is hand-edited in KV and a stray newline would land in
   the strip. Anything empty, unusable or too long for the badge returns null,
   which restores the percent chip: an always-correct fallback beats a
   truncated sale name reading "BLACK FRIDAY WEEKE". */
function barLabel(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim();
  if (!s || s.length > 24) return null;
  return s;
}

export async function readBarOfferConfig(env: { KV: KVNamespace }): Promise<BarOfferConfig> {
  try {
    const raw = await env.KV.get("offer:bar-config");
    if (!raw) return DEFAULT_BAR_OFFER;
    const p = JSON.parse(raw) as Partial<BarOfferConfig>;
    const cfg: BarOfferConfig = {
      percent: Number(p.percent) > 0 ? Math.round(Number(p.percent)) : DEFAULT_BAR_OFFER.percent,
      hours: Number(p.hours) > 0 ? Math.round(Number(p.hours)) : DEFAULT_BAR_OFFER.hours,
      label: barLabel(p.label),
    };
    // Same bounds as the asked-for offer: 100% hands the catalogue away.
    if (cfg.percent < 1 || cfg.percent > 60) cfg.percent = DEFAULT_BAR_OFFER.percent;
    // One hour is the floor a code can be honoured at; past 30 days it is a
    // price change wearing a deadline.
    if (cfg.hours < 1 || cfg.hours > 30 * 24) cfg.hours = DEFAULT_BAR_OFFER.hours;
    return cfg;
  } catch (_) {
    return DEFAULT_BAR_OFFER;
  }
}

/* Every individual price, which is what "all plans" means here.

   TEAMS IS DELIBERATELY ABSENT, and leaving it out is load-bearing in two
   directions. It is a $115-a-seat invoice with a five-seat minimum, which is
   not something to discount to anonymous traffic; and because it is absent,
   pricing.html must refuse to carry a BAR code into the Teams checkout, since
   Paddle rejects a whole checkout when the code cannot apply to any line in
   it. The guard in codeFor() and this omission are one decision.

   The two *_LOCK prices are absent for the same kind of reason: they are
   granted server side with the first charge deferred sixty days, never bought
   from a public page.

   REQUIRED, not best-effort. A missing variable used to mean the offer quietly
   stopped covering a plan the bar was still advertising, and an empty list
   would mean "every price in the account", which would discount Teams. So the
   caller gets the missing names and refuses, rather than narrowing in silence. */
export interface BarOfferPriceEnv {
  PADDLE_PRICE_AA_MONTH?: string;
  PADDLE_PRICE_AA_QUARTER?: string;
  PADDLE_PRICE_AA_YEAR?: string;
  PADDLE_PRICE_SINGLE_MONTH?: string;
  PADDLE_PRICE_SINGLE_YEAR?: string;
  PADDLE_PRICE_LIFETIME?: string;
}

const BAR_OFFER_VARS: Array<keyof BarOfferPriceEnv> = [
  "PADDLE_PRICE_AA_MONTH",
  "PADDLE_PRICE_AA_QUARTER",
  "PADDLE_PRICE_AA_YEAR",
  "PADDLE_PRICE_SINGLE_MONTH",
  "PADDLE_PRICE_SINGLE_YEAR",
  "PADDLE_PRICE_LIFETIME",
];

export function allPlanPriceIds(env: BarOfferPriceEnv): { ids: string[]; missing: string[] } {
  const ids: string[] = [];
  const missing: string[] = [];
  for (const name of BAR_OFFER_VARS) {
    const v = env[name];
    if (typeof v === "string" && v.length > 0) ids.push(v);
    else missing.push(name);
  }
  return { ids, missing };
}

/* What /api/offer answers. No code and no deadline: a page can say what the
   discount is worth and how to ask for it, and nothing more. Handing a live
   code to anyone who loads a page is what made the old bar leaky. */
export interface OfferState {
  enabled: boolean;      // the programme is on and this visitor may be told
  percent: number;
  hours: number;
  reason?: string;       // why it is not showing, for the admin preview
}

// ---------------------------------------------------------------------------
// Personal one-time codes. Minted for one named recipient, single use, annual
// plans only, with an expiry Paddle enforces. Used by the price-alert flow
// (someone answered "the price") and by an outreach note written from the
// contact centre.
//
// HONEST LIMIT. Paddle cannot bind a discount to a customer, so "personal"
// here means unguessable, single-use and short-lived, not cryptographically
// tied to one person. Forwarded inside its window, whoever redeems first gets
// it. Say that plainly rather than promising what the payment provider does not
// do.

export interface PersonalOffer {
  code: string;
  percent: number;
  expiresAt: number;
  url: string;
  /* Paddle's id for the discount, which is what payments.discount_id holds.
     Null when the create succeeded but the response could not be read: the
     code is still good, it simply cannot be matched to its redemption. */
  discountId: string | null;
}

const PERSONAL_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no I, O, 0, 1

export async function mintPersonalOffer(
  env: { PADDLE_API_KEY?: string } & OfferPriceEnv,
  /* `priceIds` and `prefix` are optional and default to what this did before:
     the two annual prices, and a PRO code. The track offer passes the Lifetime
     price as well, under its own prefix, because pricing.html decides which
     terms a code may be carried into from that prefix alone. */
  o: {
    email: string; percent: number; hours: number; siteOrigin?: string;
    priceIds?: string[]; prefix?: string; what?: string;
  },
): Promise<PersonalOffer | null> {
  if (!env.PADDLE_API_KEY) return null;
  const prices = (o.priceIds && o.priceIds.length) ? o.priceIds : annualPriceIds(env);
  if (!prices.length) {
    console.error("[offer] personal code refused: no price ids configured");
    return null;
  }
  const bytes = new Uint8Array(7);
  crypto.getRandomValues(bytes);
  let tail = "";
  for (let i = 0; i < bytes.length; i++) tail += PERSONAL_ALPHABET[bytes[i] % PERSONAL_ALPHABET.length];
  const code = `${o.prefix || "PRO"}${o.percent}${tail}`;
  const expiresAt = Math.floor(Date.now() / 1000) + Math.max(1, o.hours) * 3600;

  const made = await createPaddleDiscountWithId(env, {
    code,
    percent: String(o.percent),
    recur: true,
    expiresAt,
    priceIds: prices,
    description: `One-time ${o.percent}% ${o.what || "annual"} for ${o.email}, ${new Date().toISOString().slice(0, 10)}`,
  });
  if (!made.ok) return null;

  const origin = o.siteOrigin || "https://r-statistics.co";
  return {
    code, percent: o.percent, expiresAt, discountId: made.id,
    url: `${origin}/pricing.html?code=${code}&src=outreach`,
  };
}

/* The paragraph appended to the note. Kept here rather than in each of the
   twelve templates so it reads identically whichever one the owner picks, and
   so the claims about how the code behaves can only be changed in one place. */
export function offerParagraph(o: PersonalOffer, expiryWords: string): string {
  return [
    `If price is the sticking point, here is ${o.percent}% off an annual plan: ${o.code}. `
      + `It works once and it stops working on ${expiryWords}. The ${o.percent}% then stays `
      + `on every renewal, so the price you start at is the price you keep.`,
    "",
    o.url,
  ].join("\n");
}
