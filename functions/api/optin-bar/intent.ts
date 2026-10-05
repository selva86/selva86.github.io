// POST /api/optin-bar/intent  { email, topic?, page? }  -> { ok }
//
// The signed-out half of the opt-in bar. The bar records what the visitor asked
// for, keyed by the address they typed, then sends the ordinary sign-in email
// (Supabase). Nothing is subscribed here and no email is sent from here: the
// intent only takes effect when someone signs in AS that address within two
// hours (api/me/optin-bar, mode "claim"), which is the confirmation. A URL or
// a third party can therefore never subscribe anyone.

import type { Env, RequestData } from "../../_middleware";
import { json, jsonError } from "../../_lib/errors";

export const INTENT_TTL_S = 7200;
export const intentKey = (email: string) => "obi:" + email.trim().toLowerCase();

function looksLikeEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s) && s.length <= 200;
}

export const onRequestPost: PagesFunction<Env, string, RequestData> = async (context) => {
  let b: { email?: unknown; topic?: unknown; page?: unknown };
  try { b = await context.request.json(); } catch { return jsonError(400, "bad_body", "Invalid JSON"); }
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  if (!looksLikeEmail(email)) return jsonError(400, "bad_email", "Please enter a valid email address.");
  const topic = typeof b.topic === "string" ? b.topic.slice(0, 40) : "";
  let page = typeof b.page === "string" ? b.page.slice(0, 200) : "";
  if (page.charAt(0) !== "/" || page.charAt(1) === "/") page = "";
  const intent = {
    topic, page,
    at: Math.floor(Date.now() / 1000),
    country: context.request.headers.get("CF-IPCountry") || "",
  };
  await context.env.KV.put(intentKey(email), JSON.stringify(intent), { expirationTtl: INTENT_TTL_S });
  return json({ ok: true });
};
