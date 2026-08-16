// GET  /api/me/email-optin  -> { decided, nurture, offers }
// POST /api/me/email-optin  { optin, surface?, default_state? }
//
// The post-signup opt-in screen's backend. One decision sets BOTH consent
// columns (email_nurture + email_offers) and stamps email_optin_decided_at,
// which is what stops the screen from ever showing again (NULL = never
// asked). Every decision writes an audit_log row carrying the surface it was
// made on, the default the user was shown (geo-dependent), the final choice,
// and the CF-resolved country, so consent is provable later.

import type { Env, RequestData } from "../../_middleware";
import { json, err401, jsonError } from "../../_lib/errors";

export const onRequestGet: PagesFunction<Env, string, RequestData> = async (context) => {
  const u = context.data.user;
  if (!u) return err401();
  const row = await context.env.DB.prepare(
    "SELECT email_optin_decided_at, email_nurture, email_offers FROM users WHERE id = ?1",
  ).bind(u.id).first<{ email_optin_decided_at: number | null; email_nurture: number; email_offers: number }>();
  return json({
    decided: !!row?.email_optin_decided_at,
    nurture: !!row?.email_nurture,
    offers: !!row?.email_offers,
  });
};

export const onRequestPost: PagesFunction<Env, string, RequestData> = async (context) => {
  const u = context.data.user;
  if (!u) return err401();
  let b: { optin?: unknown; surface?: unknown; default_state?: unknown };
  try { b = await context.request.json(); } catch { return jsonError(400, "bad_body", "Invalid JSON"); }
  if (typeof b.optin !== "boolean") return jsonError(400, "bad_body", "optin must be a boolean");

  const now = Math.floor(Date.now() / 1000);
  const on = b.optin ? 1 : 0;
  const country = context.request.headers.get("CF-IPCountry") || "";
  const surface = typeof b.surface === "string" ? b.surface.slice(0, 40) : "optin-screen";
  const shownDefault = typeof b.default_state === "string" ? b.default_state.slice(0, 10) : "";

  await context.env.DB.batch([
    context.env.DB.prepare(
      "UPDATE users SET email_nurture = ?1, email_offers = ?1, email_optin_decided_at = ?2 WHERE id = ?3",
    ).bind(on, now, u.id),
    context.env.DB.prepare(
      "INSERT INTO audit_log (user_id, actor, action, ref, meta_json, at) VALUES (?1, 'user', 'email_optin', ?2, ?3, ?4)",
    ).bind(u.id, surface, JSON.stringify({ optin: b.optin, default_state: shownDefault, country }), now),
  ]);
  return json({ ok: true, nurture: b.optin, offers: b.optin });
};
