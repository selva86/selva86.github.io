// GET /api/offer - is the homepage timed offer running right now, and if so,
// what is the code and when does it die.
//
// Never cached. The answer depends on the clock (to the second, near a
// deadline) and on who is asking, and a cached "active" response would keep
// promising a discount after its code had expired.

import type { Env, RequestData } from "../_middleware";
import { isOn } from "../_lib/flags";
import { resolvePro } from "../_lib/entitlement";
import { getUserById } from "../_lib/db";
import { readCookie, verifyIdCookie, ID_COOKIE } from "../_lib/idcookie";
import { readOfferConfig, offerWindow, ensureWindowCode, type OfferState } from "../_lib/offer";

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
  const win = offerWindow(now, cfg);

  const base: OfferState = {
    enabled: false, active: false, percent: cfg.percent,
    endsAt: null, nextStartsAt: win.nextStartsAt, code: null,
  };

  // Kill switch, checked first so a flipped flag silences the bar instantly
  // without waiting on Paddle or the database.
  if (!(await isOn(context.env.KV, "offer-bar", context).catch(() => false))) {
    return send({ ...base, reason: "flag_off" });
  }
  base.enabled = true;

  /* Somebody who already pays should never be shown a discount on what they
     are already paying for. Checked server side rather than in the page: the
     browser's idea of "signed in" lags a cancelled or lapsed plan, and getting
     this wrong is the difference between a quiet page and an insulting one. */
  /* The middleware only fills context.data.user from a Supabase bearer, and
     this request is a plain same-origin fetch from the homepage that carries
     cookies and no bearer. Without the cookie fallback every signed-in
     customer would be shown a discount on the plan they already pay for. */
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

  if (!win.active) return send({ ...base, reason: "between_windows" });

  const code = await ensureWindowCode(context.env, win, cfg);
  // No code means Paddle refused or is not configured. Showing a countdown
  // with a code that does not work is worse than showing nothing.
  if (!code) return send({ ...base, reason: "no_code" });

  return send({
    enabled: true, active: true, percent: cfg.percent,
    endsAt: win.endsAt, nextStartsAt: win.nextStartsAt, code,
  });
};
