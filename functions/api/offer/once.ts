// POST /api/offer/once - the one-time track-page offer.
//
// Shown once to one signed-in reader who is not paying, never again, whether
// or not they took it. That is the whole point of it: an offer that reappears
// on every visit is a price, and a price does not need a countdown.
//
// Rules carried over from /api/offer rather than reinvented here:
//   - a code is minted per recipient when asked for, never handed to a page
//     load, because a code on a page load is a code that leaks;
//   - annual plans only (mintPersonalOffer restricts the Paddle discount, and
//     pricing.html independently refuses a PRO code on a non-annual term);
//   - whether somebody already pays is decided server side, because the
//     browser's idea of a plan lags a lapsed one and offering a discount on a
//     plan somebody already holds is the one outcome worth engineering
//     against.
//
// Behind flag:track-offer, default off. It mints live Paddle discounts, so it
// should start when the owner says so and not when a deploy lands.

import type { Env, RequestData } from "../../_middleware";
import { isOn } from "../../_lib/flags";
import { resolvePro } from "../../_lib/entitlement";
import { getUserById } from "../../_lib/db";
import { readCookie, verifyIdCookie, ID_COOKIE } from "../../_lib/idcookie";
import { mintPersonalOffer, type OfferPriceEnv } from "../../_lib/offer";

type OnceEnv = Env & OfferPriceEnv & {
  PADDLE_API_KEY?: string;
  EDGE_ID_SECRET?: string;
  SITE_ORIGIN?: string;
  ENVIRONMENT?: string;
};

interface TrackOffer {
  percent: number;
  hours: number;
}

/* One hour, matching the reference: the dialog shows minutes and seconds, and
   a clock that has to show hours is a deadline rather than a decision. */
const DEFAULT_TRACK_OFFER: TrackOffer = { percent: 30, hours: 1 };

/* KV `offer:track` overrides either field with no deploy. Kept separate from
   `offer:config` on purpose: that one drives the 23% price-alert code that has
   been going out for weeks, and this must not move it. */
async function readTrackOffer(kv: KVNamespace): Promise<TrackOffer> {
  try {
    const raw = await kv.get("offer:track");
    if (!raw) return DEFAULT_TRACK_OFFER;
    const p = JSON.parse(raw) as Partial<TrackOffer>;
    const percent = Number(p.percent) > 0 ? Math.round(Number(p.percent)) : DEFAULT_TRACK_OFFER.percent;
    const hours = Number(p.hours) > 0 ? Math.round(Number(p.hours)) : DEFAULT_TRACK_OFFER.hours;
    return {
      // The same bounds as the other offer: a 100% code hands the catalogue
      // away, a 0% one is noise.
      percent: percent >= 1 && percent <= 60 ? percent : DEFAULT_TRACK_OFFER.percent,
      // Under an hour is not an offer, it is a trick; over a week stops being
      // a deadline and becomes the price.
      hours: hours >= 1 && hours <= 168 ? hours : DEFAULT_TRACK_OFFER.hours,
    };
  } catch (_) {
    return DEFAULT_TRACK_OFFER;
  }
}

function send(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

export const onRequestPost: PagesFunction<OnceEnv, string, RequestData> = async (context) => {
  const now = Math.floor(Date.now() / 1000);

  if (!(await isOn(context.env.KV, "track-offer", context).catch(() => false))) {
    return send({ reason: "flag_off" });
  }

  /* The middleware fills context.data.user from a Supabase bearer only, and
     this is a same-origin fetch carrying cookies and no bearer, so without the
     cookie fallback no signed-in reader would ever qualify. */
  let user = context.data.user ?? null;
  if (!user) {
    const secret = context.env.EDGE_ID_SECRET || "";
    const sub = secret ? await verifyIdCookie(secret, readCookie(context.request, ID_COOKIE)) : null;
    if (sub) user = await getUserById(context.env.DB, sub).catch(() => null);
  }
  // Anonymous readers are told nothing. An offer needs somebody to be once to.
  if (!user) return send({ reason: "anon" });

  const ent = await resolvePro(context.env.DB, user, now).catch(() => null);
  if (ent?.pro) return send({ reason: "already_pro" });

  const key = `offer-once:${user.id}`;
  const seen = await context.env.KV.get(key);
  // Shown before. No code, so the dialog can never come back, which is what
  // the dialog itself promises.
  if (seen) return send({ reason: "spent" });

  const cfg = await readTrackOffer(context.env.KV);
  const expiresAt = now + cfg.hours * 3600;

  /* Claim first, mint second. Two tabs scrolling into the panel at the same
     moment would otherwise mint two live discounts for one reader. The claim
     is removed again if the mint fails, so a genuine failure is retryable and
     only a success is permanent. */
  await context.env.KV.put(key, JSON.stringify({ at: now, percent: cfg.percent, pending: true }), {
    expirationTtl: 60 * 60 * 24 * 365,
  });

  /* Reviewable on a preview deployment, which has no Paddle key, without ever
     being reachable on production: a fake code there would be a real offer
     nobody can redeem. */
  if (!context.env.PADDLE_API_KEY) {
    if ((context.env.ENVIRONMENT || "") === "production") {
      await context.env.KV.delete(key);
      return send({ reason: "not_configured" });
    }
    const preview = { code: "PREVIEW" + cfg.percent, percent: cfg.percent, expires_at: expiresAt, preview: true };
    await context.env.KV.put(key, JSON.stringify({ at: now, ...preview }), { expirationTtl: 60 * 60 * 24 * 365 });
    return send(preview);
  }

  const minted = await mintPersonalOffer(context.env, {
    email: user.email,
    percent: cfg.percent,
    hours: cfg.hours,
    siteOrigin: context.env.SITE_ORIGIN,
  }).catch(() => null);

  if (!minted) {
    await context.env.KV.delete(key);
    return send({ reason: "mint_failed" });
  }

  await context.env.KV.put(key, JSON.stringify({
    at: now, code: minted.code, percent: minted.percent, expires_at: minted.expiresAt,
  }), { expirationTtl: 60 * 60 * 24 * 365 });

  return send({ code: minted.code, percent: minted.percent, expires_at: minted.expiresAt });
};
