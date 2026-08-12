// GET/POST /api/me/email-prefs - the preference center's backend.
//
// Three toggles, matching the consent categories in
// Plans/01_email_and_nurture/email-program-v2.md s4:
//   progress  - milestones, cap-hit, weekly recaps (default on, opt-out)
//   nurture   - daily rep, guided tour (default off, strictly opt-in)
//   offers    - pass-deadline coupons, intent follow-ups (default off, opt-in)
// Account/billing email has no toggle - it is the service.
//
// POST body: any subset of { progress: bool, nurture: bool, offers: bool }.

import type { Env, RequestData } from "../../_middleware";
import { json, err401, jsonError } from "../../_lib/errors";

type PrefRow = { email_progress: number; email_nurture: number; email_offers: number };

export const onRequestGet: PagesFunction<Env, string, RequestData> = async (context) => {
  const u = context.data.user;
  if (!u) return err401();
  const row = await context.env.DB.prepare(
    "SELECT email_progress, email_nurture, email_offers FROM users WHERE id = ?1",
  ).bind(u.id).first<PrefRow>();
  return json({
    progress: (row?.email_progress ?? 1) === 1,
    nurture: (row?.email_nurture ?? 0) === 1,
    offers: (row?.email_offers ?? 0) === 1,
  });
};

export const onRequestPost: PagesFunction<Env, string, RequestData> = async (context) => {
  const u = context.data.user;
  if (!u) return err401();
  let body: { progress?: unknown; nurture?: unknown; offers?: unknown };
  try { body = await context.request.json(); } catch { return jsonError(400, "bad_body", "Invalid JSON"); }

  const sets: string[] = [];
  const binds: number[] = [];
  const fields: Array<[keyof typeof body, string]> = [
    ["progress", "email_progress"], ["nurture", "email_nurture"], ["offers", "email_offers"],
  ];
  for (const [k, col] of fields) {
    if (typeof body[k] === "boolean") { sets.push(`${col} = ?${binds.length + 1}`); binds.push(body[k] ? 1 : 0); }
  }
  if (!sets.length) return jsonError(400, "bad_body", "Nothing to update");
  await context.env.DB.prepare(
    `UPDATE users SET ${sets.join(", ")} WHERE id = ?${binds.length + 1}`,
  ).bind(...binds, u.id).run();
  await context.env.DB.prepare(
    "INSERT INTO email_events (user_id, email, email_key, event, at, meta) VALUES (?1, ?2, NULL, 'prefs_change', ?3, ?4)",
  ).bind(u.id, u.email, Math.floor(Date.now() / 1000), JSON.stringify(body).slice(0, 180)).run();

  const row = await context.env.DB.prepare(
    "SELECT email_progress, email_nurture, email_offers FROM users WHERE id = ?1",
  ).bind(u.id).first<PrefRow>();
  return json({
    progress: (row?.email_progress ?? 1) === 1,
    nurture: (row?.email_nurture ?? 0) === 1,
    offers: (row?.email_offers ?? 0) === 1,
  });
};
