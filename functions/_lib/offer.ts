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

import { createPaddleDiscount } from "./cartrecovery";

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
}

const PERSONAL_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no I, O, 0, 1

export async function mintPersonalOffer(
  env: { PADDLE_API_KEY?: string } & OfferPriceEnv,
  o: { email: string; percent: number; hours: number; siteOrigin?: string },
): Promise<PersonalOffer | null> {
  if (!env.PADDLE_API_KEY) return null;
  const prices = annualPriceIds(env);
  if (!prices.length) {
    console.error("[offer] personal code refused: no annual price ids configured");
    return null;
  }
  const bytes = new Uint8Array(7);
  crypto.getRandomValues(bytes);
  let tail = "";
  for (let i = 0; i < bytes.length; i++) tail += PERSONAL_ALPHABET[bytes[i] % PERSONAL_ALPHABET.length];
  const code = `PRO${o.percent}${tail}`;
  const expiresAt = Math.floor(Date.now() / 1000) + Math.max(1, o.hours) * 3600;

  const ok = await createPaddleDiscount(env, {
    code,
    percent: String(o.percent),
    recur: true,
    expiresAt,
    priceIds: prices,
    description: `One-time ${o.percent}% annual for ${o.email}, from the contact centre ${new Date().toISOString().slice(0, 10)}`,
  });
  if (!ok) return null;

  const origin = o.siteOrigin || "https://r-statistics.co";
  return { code, percent: o.percent, expiresAt, url: `${origin}/pricing.html?code=${code}&src=outreach` };
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
