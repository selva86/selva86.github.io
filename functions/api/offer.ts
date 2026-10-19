// GET /api/offer - is the discount programme running, what is it worth, and
// should this particular visitor be told about it.
//
// It no longer returns a code or a deadline. The old version handed a live
// Paddle code to anyone who loaded the homepage, which is how a public code
// leaks and why it needed a per-window expiry to contain it. A code is now
// minted per recipient when someone asks for one (pricealerts.ts), so this
// endpoint only answers whether a page may say "20% off the annual plans, ask
// and I will email you a code".
//
// Never cached: the answer depends on who is asking, and a cached "enabled"
// would offer a discount to someone who has since started paying.

import type { Env, RequestData } from "../_middleware";
import { isOn } from "../_lib/flags";
import { resolvePro } from "../_lib/entitlement";
import { getUserById } from "../_lib/db";
import { readCookie, verifyIdCookie, ID_COOKIE } from "../_lib/idcookie";
import { readOfferConfig, annualPriceIds, type OfferState } from "../_lib/offer";

type OfferEnv = Env & { PADDLE_API_KEY?: string };

function send(body: OfferState): Response {
  return new Response(JSON.stringify(body), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

export const onRequestGet: PagesFunction<OfferEnv, string, RequestData> = async (context) => {
  const now = Math.floor(Date.now() / 1000);
  const cfg = await readOfferConfig(context.env);
  const base: OfferState = { enabled: false, percent: cfg.percent, hours: cfg.hours };

  /* Kill switch. The flag is still called `offer-bar` although the bar itself
     is gone: it is the switch the owner already knows, and renaming a live flag
     to improve a name is how a discount silently turns itself off. */
  if (!(await isOn(context.env.KV, "offer-bar", context).catch(() => false))) {
    return send({ ...base, reason: "flag_off" });
  }

  /* No annual price ids means a code could only be minted unrestricted, which
     would discount monthly and lifetime too. Refuse to advertise what cannot be
     honoured on the terms stated. */
  if (!annualPriceIds(context.env).length) {
    return send({ ...base, reason: "no_prices" });
  }

  /* Somebody who already pays should never be shown a discount on what they
     are already paying for. Checked server side rather than in the page: the
     browser's idea of "signed in" lags a cancelled or lapsed plan, and getting
     this wrong is the difference between a quiet page and an insulting one.

     The middleware only fills context.data.user from a Supabase bearer, and
     this is a plain same-origin fetch carrying cookies and no bearer, so
     without the cookie fallback every signed-in customer would be offered a
     discount on the plan they already hold. */
  let user = context.data.user ?? null;
  if (!user) {
    const secret = context.env.EDGE_ID_SECRET || "";
    const sub = secret ? await verifyIdCookie(secret, readCookie(context.request, ID_COOKIE)) : null;
    if (sub) user = await getUserById(context.env.DB, sub).catch(() => null);
  }
  if (user) {
    const ent = await resolvePro(context.env.DB, user, now).catch(() => null);
    if (ent?.pro) return send({ ...base, reason: "already_pro" });
  }

  return send({ enabled: true, percent: cfg.percent, hours: cfg.hours });
};
