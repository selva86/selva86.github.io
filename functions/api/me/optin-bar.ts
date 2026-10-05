// POST /api/me/optin-bar  { mode: "claim" | "direct", topic?, page? }
//   -> { ok, claimed, already, sent_now }
//
// The opt-in bar's subscription. Two ways in, both signed in:
//  - "direct": a signed-in reader clicked the bar's one button.
//  - "claim":  a signed-out reader typed their address into the bar, got the
//              sign-in email and clicked it. Only valid while an intent for
//              THIS account's verified address exists (api/optin-bar/intent);
//              the intent is consumed here. No intent -> claimed:false and
//              nothing changes.
// Scope is the daily lesson series only (email_nurture); the offers consent
// (email_offers) is left as it was, because the bar never mentions offers.
// email_optin_decided_at is stamped if still empty so the post-sign-in opt-in
// screen does not ask again. Every subscription writes an audit_log row, then
// the first lesson goes out at once (shared with the invitation join).

import type { Env, RequestData } from "../../_middleware";
import { json, err401, err404, jsonError } from "../../_lib/errors";
import { sendFirstLessonNow } from "../../_lib/first-lesson";
import { intentKey } from "../optin-bar/intent";

export const onRequestPost: PagesFunction<Env, string, RequestData> = async (context) => {
  const u = context.data.user;
  if (!u) return err401();
  let b: { mode?: unknown; topic?: unknown; page?: unknown };
  try { b = await context.request.json(); } catch { return jsonError(400, "bad_body", "Invalid JSON"); }
  const mode = b.mode === "claim" ? "claim" : b.mode === "direct" ? "direct" : "";
  if (!mode) return jsonError(400, "bad_body", "mode must be claim or direct");

  const env = context.env;
  const row = await env.DB.prepare(
    "SELECT id, email, display_name, level_r, email_nurture, email_status FROM users WHERE id = ?1 AND deleted_at IS NULL",
  ).bind(u.id).first<{ id: string; email: string; display_name: string | null; level_r: string | null; email_nurture: number; email_status: string | null }>();
  if (!row) return err404("Account not found.");

  let topic = typeof b.topic === "string" ? b.topic.slice(0, 40) : "";
  let page = typeof b.page === "string" ? b.page.slice(0, 200) : "";
  let intentAt: number | null = null;
  if (mode === "claim") {
    const key = intentKey(u.email || row.email || "");
    const raw = await env.KV.get(key);
    if (!raw) return json({ ok: true, claimed: false, already: !!row.email_nurture, sent_now: false });
    try {
      const it = JSON.parse(raw) as { topic?: string; page?: string; at?: number };
      topic = (it.topic || "").slice(0, 40); page = (it.page || "").slice(0, 200); intentAt = it.at || null;
    } catch { /* a malformed intent still proves the request; keep going */ }
    await env.KV.delete(key);
  }
  if (page.charAt(0) !== "/" || page.charAt(1) === "/") page = "";

  const already = !!row.email_nurture;
  let sentNow = false;
  if (!already) {
    const now = Math.floor(Date.now() / 1000);
    const country = context.request.headers.get("CF-IPCountry") || "";
    await env.DB.batch([
      env.DB.prepare(
        "UPDATE users SET email_nurture = 1, email_optin_decided_at = COALESCE(email_optin_decided_at, ?1) WHERE id = ?2",
      ).bind(now, row.id),
      env.DB.prepare(
        "INSERT INTO audit_log (user_id, actor, action, ref, meta_json, at) VALUES (?1, 'user', 'email_optin', 'optin-bar', ?2, ?3)",
      ).bind(row.id, JSON.stringify({
        optin: true, scope: "nurture", via: mode === "claim" ? "confirmed-sign-in" : "one-click",
        topic, page, country, intent_at: intentAt,
      }), now),
    ]);
    sentNow = await sendFirstLessonNow(env, row, "joined via the opt-in bar; first lesson sent at once");
  }
  return json({ ok: true, claimed: mode === "claim", already, sent_now: sentNow });
};
