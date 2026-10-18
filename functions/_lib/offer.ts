// The homepage timed offer: a discount that is genuinely live for part of the
// day and genuinely gone for the rest of it.
//
// WHY THE WINDOW IS GLOBAL AND COMPUTED FROM THE CLOCK. A countdown that
// restarts per visitor, or resets when you clear cookies, is a lie told with a
// clock face. This one is derived from UTC alone: every visitor anywhere sees
// the same deadline, and when it passes the offer really is unavailable until
// the next window opens. Nothing is stored per person, so there is nothing to
// reset and nothing to game.
//
// WHY THE CODE CANNOT OUTLIVE THE WINDOW. Each window mints one Paddle
// discount whose `expires_at` is the window's own end. Enforcement is Paddle's,
// not ours: a code copied out of the page stops working at the deadline even if
// someone reaches checkout by another route. Outside a window no code exists at
// all, so there is nothing to leak.

import { createPaddleDiscount } from "./cartrecovery";

export interface OfferConfig {
  percent: number;      // whole percent off
  onHours: number;      // how long a window stays open
  offHours: number;     // the gap before the next one
  anchorHour: number;   // UTC hour the first window of the cycle opens
}

// 20% off the annual plans, open 12:00 to 20:00 UTC daily. That window is the
// US morning, the UK afternoon and the Indian evening at once, which is the
// best single slot for where the readers actually are.
export const DEFAULT_OFFER: OfferConfig = {
  percent: 20,
  onHours: 8,
  offHours: 16,
  anchorHour: 12,
};

export interface OfferWindow {
  active: boolean;
  startsAt: number;      // unix, the window containing or preceding `now`
  endsAt: number;
  nextStartsAt: number;  // when the next window opens (equals startsAt if active)
  id: string;            // stable per window, used in the code and the KV keys
}

/* The cycle repeats every onHours + offHours. Anchored to the Unix epoch plus
   anchorHour so the maths never depends on what "today" means in any timezone. */
export function offerWindow(nowSec: number, cfg: OfferConfig): OfferWindow {
  const cycle = Math.max(1, Math.round((cfg.onHours + cfg.offHours) * 3600));
  const on = Math.max(1, Math.round(cfg.onHours * 3600));
  const anchor = Math.round(cfg.anchorHour * 3600);

  // Index of the cycle `now` sits in, counting from the anchored epoch.
  const since = nowSec - anchor;
  const idx = Math.floor(since / cycle);
  const startsAt = anchor + idx * cycle;
  const endsAt = startsAt + on;
  const active = nowSec < endsAt;
  return {
    active,
    startsAt,
    endsAt,
    nextStartsAt: active ? startsAt : startsAt + cycle,
    id: String(startsAt),
  };
}

/* Readable, unambiguous, and impossible to confuse with a hand-issued code.
   No vowels, so no window can accidentally spell something. */
const ALPHABET = "BCDFGHJKLMNPQRSTVWXZ23456789";
export function offerCode(percent: number, windowId: string): string {
  let n = 0;
  for (let i = 0; i < windowId.length; i++) n = (n * 31 + windowId.charCodeAt(i)) >>> 0;
  let tail = "";
  for (let i = 0; i < 5; i++) { tail += ALPHABET[n % ALPHABET.length]; n = Math.floor(n / ALPHABET.length) + 7; }
  return `SAVE${percent}${tail}`;
}

export async function readOfferConfig(env: { KV: KVNamespace }): Promise<OfferConfig> {
  try {
    const raw = await env.KV.get("offer:config");
    if (!raw) return DEFAULT_OFFER;
    const p = JSON.parse(raw) as Partial<OfferConfig>;
    const cfg: OfferConfig = {
      percent: Number(p.percent) > 0 ? Math.round(Number(p.percent)) : DEFAULT_OFFER.percent,
      onHours: Number(p.onHours) > 0 ? Number(p.onHours) : DEFAULT_OFFER.onHours,
      offHours: Number(p.offHours) >= 0 ? Number(p.offHours) : DEFAULT_OFFER.offHours,
      anchorHour: Number.isFinite(Number(p.anchorHour)) ? Number(p.anchorHour) : DEFAULT_OFFER.anchorHour,
    };
    // A 100% code would hand the catalogue away; a 0% one is noise.
    if (cfg.percent < 1 || cfg.percent > 60) cfg.percent = DEFAULT_OFFER.percent;
    return cfg;
  } catch (_) {
    return DEFAULT_OFFER;
  }
}

/* The annual price ids this offer is allowed to touch. Monthly is deliberately
   excluded: discounting it trains people to wait for the bar on the plan with
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

export interface OfferState {
  enabled: boolean;      // the kill switch
  active: boolean;       // a window is open AND this visitor should see it
  percent: number;
  endsAt: number | null;
  nextStartsAt: number | null;
  code: string | null;
  reason?: string;       // why it is not showing, for the admin preview
}

/* Mint (or reuse) the discount for a window. Deterministic code means two
   concurrent first-visitors converge on the same one: whoever loses the race
   gets a duplicate-code error from Paddle, which is success in disguise. */
export async function ensureWindowCode(
  env: { KV: KVNamespace; PADDLE_API_KEY?: string } & OfferPriceEnv,
  win: OfferWindow,
  cfg: OfferConfig,
): Promise<string | null> {
  const key = `offer:code:${win.id}`;
  const cached = await env.KV.get(key).catch(() => null);
  if (cached) return cached;
  if (!env.PADDLE_API_KEY) return null;

  /* Negative cache. This runs on an ordinary homepage request, so without it
     a Paddle outage during a window would turn every visit into another
     failing create call. A few thousand a day is a bad way to treat someone
     else's API, and the answer is the same every time anyway: show nothing. */
  const failKey = `offer:fail:${win.id}`;
  if (await env.KV.get(failKey).catch(() => null)) return null;

  const prices = annualPriceIds(env);
  if (!prices.length) {
    console.error("[offer] no annual price ids configured; refusing to mint an unrestricted code");
    return null;
  }

  const code = offerCode(cfg.percent, win.id);
  const base = env.PADDLE_API_KEY.startsWith("pdl_sdbx_")
    ? "https://sandbox-api.paddle.com" : "https://api.paddle.com";
  try {
    const resp = await fetch(`${base}/discounts`, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.PADDLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        description: `Homepage timed offer, window ending ${new Date(win.endsAt * 1000).toISOString()}`,
        type: "percentage",
        amount: String(cfg.percent),
        enabled_for_checkout: true,
        code,
        // No usage limit: this one is public by design, unlike the single-use
        // codes the outreach emails carry. The deadline is the only limit.
        expires_at: new Date(win.endsAt * 1000).toISOString(),
        restrict_to: prices,
      }),
    });
    if (!resp.ok) {
      const text = await resp.text();
      // Already created by a concurrent request, or left over from a retry.
      // Either way the code exists with the right terms, so use it.
      if (!/already|duplicate|conflict/i.test(text)) {
        console.error(`[offer] discount create failed ${resp.status}: ${text.slice(0, 200)}`);
        return null;
      }
    }
  } catch (e) {
    console.error(`[offer] discount create threw: ${(e as Error).message}`);
    return null;
  }

  // Outlive the window slightly so a page open at the deadline can still read
  // it, then disappear. Paddle stops honouring it at endsAt regardless.
  const ttl = Math.max(60, win.endsAt - Math.floor(Date.now() / 1000) + 600);
  await env.KV.put(key, code, { expirationTtl: ttl }).catch(() => {});
  return code;
}

// ---------------------------------------------------------------------------
// Personal one-time codes, for an outreach email written from the contact
// centre. Different from the homepage window code in every way that matters:
// single use, 24 hours, and minted per recipient so Paddle's own description
// records who it was written for.
//
// HONEST LIMIT. Paddle cannot bind a discount to a customer, so "personal"
// here means unguessable, single-use and short-lived, not cryptographically
// tied to one person. Forwarded within the day, whoever redeems first gets it.
// Say that plainly rather than promising what the payment provider does not do.

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
      + `It works once and it stops working on ${expiryWords}.`,
    "",
    o.url,
  ].join("\n");
}
