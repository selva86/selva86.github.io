// /api/admin/contact - one person, completely.
//
//   GET  ?email=<addr>
//        -> the full activity timeline (every table that records something a
//           person did, newest first), every email they were sent with what
//           happened after it, and everything the owner did about them.
//   POST { email, op: "note"|"snooze"|"done"|"replied"|"reopen", text?, days?, reason?, ref? }
//        -> records an owner action. Notes and replies are the owner's memory;
//           snooze and done take the person out of the queue (done only until a
//           NEW event raises a reason again).
//
// The header facts (state, score, plan) come from the list the page already
// holds, so this endpoint reads only this person's rows: a few hundred, not
// the 40k the list costs.
//
// Anonymous activity before sign-in is stitched in through intent_signals
// anon ids: any anon id that later appears on a row with this user's id is
// theirs. Those rows are marked, because the stitch is an inference.

import type { Env, RequestData } from "../../_middleware";
import { json, jsonError } from "../../_lib/errors";
import { requireAdmin } from "../../_lib/admin-auth";
import { ensureContactTables, describeSignal, slugOfPath, autoLabel, planLabel, DAY, type Action } from "../../_lib/contacts";
import { outreachLabel } from "../../_lib/outreach-copy";

type Cat = "account" | "learning" | "practice" | "buying" | "email" | "owner";
interface Ev { at: number; cat: Cat; text: string; link?: string; extra?: string; pre?: boolean }

const BUYING = new Set([
  "pricing_view", "pro_wall_hit", "parity_view", "offer_view", "pricing_toggle", "checkout_lead",
  "checkout_start", "checkout_closed", "purchase_client", "objection", "price_alert", "paywall_hit",
  "cert_view", "track_view",
]);

function page(slug: string): string { return slug ? `/${slug}.html` : ""; }
function words(slug: string): string { return slug.replace(/-/g, " "); }
/* Signed lesson links carry the reader's id and a token. The panel only needs
   where they went. */
function cleanDest(u: string | null): string {
  if (!u) return "";
  try { const x = new URL(u); return x.pathname; } catch { return String(u).split("?")[0]; }
}

export const onRequestGet: PagesFunction<Env & { CRON_SECRET?: string; ADMIN_EMAIL?: string }, string, RequestData> = async (context) => {
  const gate = await requireAdmin(context);
  if (gate instanceof Response) return gate;
  const DB = context.env.DB;
  await ensureContactTables(DB);

  const email = (new URL(context.request.url).searchParams.get("email") || "").trim().toLowerCase();
  if (!email) return jsonError(400, "no_email", "Pass ?email=<address>");
  const u = await DB.prepare("SELECT * FROM users WHERE lower(email) = ?1 AND deleted_at IS NULL")
    .bind(email).first<Record<string, unknown>>();
  if (!u) return jsonError(404, "no_user", "No user with that email");
  const uid = String(u.id);
  const now = Math.floor(Date.now() / 1000);

  const q = <T>(sql: string, ...b: unknown[]) => DB.prepare(sql).bind(...b).all<T>().then((r) => r.results ?? []).catch(() => [] as T[]);

  const [sessions, audit, reads, saved, attempts, xp, sigs, anonIds, alerts, subs, mails, actions, orgs, certs, badges] = await Promise.all([
    q<{ created_at: number; device: string | null; last_seen_at: number | null }>(
      "SELECT created_at, device, last_seen_at FROM sessions WHERE user_id = ?1 ORDER BY created_at", uid),
    q<{ action: string; actor: string | null; ref: string | null; meta_json: string | null; at: number }>(
      "SELECT action, actor, ref, meta_json, at FROM audit_log WHERE user_id = ?1 AND action NOT LIKE 'supabase.%' ORDER BY at", uid),
    q<{ post_slug: string; scroll_pct: number | null; marked_read: number; read_at: number }>(
      "SELECT post_slug, scroll_pct, marked_read, read_at FROM reading_progress WHERE user_id = ?1", uid),
    q<{ post_slug: string; saved_at: number }>("SELECT post_slug, saved_at FROM saved_posts WHERE user_id = ?1", uid),
    // One line per hub per day: a heavy practice day is dozens of attempts, and
    // the reader of this panel wants "practised X, solved 5", not 40 rows.
    q<{ hub_slug: string; day: number; n: number; passed: number; solved: number; hints: number; peeks: number; first: number; last: number; backfill: number }>(
      "SELECT hub_slug, submitted_at / 86400 day, COUNT(*) n, SUM(passed) passed, " +
      "COUNT(DISTINCT CASE WHEN passed = 1 THEN exercise_id END) solved, SUM(hints_used) hints, " +
      "SUM(solution_seen) peeks, MIN(submitted_at) first, MAX(submitted_at) last, " +
      "SUM(CASE WHEN source = 'backfill' THEN 1 ELSE 0 END) backfill " +
      "FROM exercise_attempts WHERE user_id = ?1 GROUP BY hub_slug, day", uid),
    q<{ action: string; ref: string | null; xp: number; at: number }>(
      "SELECT action, ref, xp, at FROM xp_ledger WHERE user_id = ?1 AND action NOT IN ('exercise.passed','exercise.backfill','streak.day') ORDER BY at", uid),
    q<{ at: number; signal: string; path: string | null; meta: string | null }>(
      "SELECT at, signal, path, meta FROM intent_signals WHERE user_id = ?1 ORDER BY at", uid),
    q<{ anon_id: string }>(
      "SELECT DISTINCT anon_id FROM intent_signals WHERE user_id = ?1 AND anon_id IS NOT NULL AND anon_id != ''", uid),
    q<Record<string, unknown>>("SELECT * FROM price_alerts WHERE user_id = ?1 OR lower(email) = ?2", uid, email),
    q<{ plan: string; status: string; cancel_at_period_end: number; current_period_end: number | null; created_at: number; updated_at: number }>(
      "SELECT plan, status, cancel_at_period_end, current_period_end, created_at, updated_at FROM subscriptions WHERE user_id = ?1 ORDER BY created_at", uid),
    q<{ id: number; email_key: string | null; event: string; at: number; meta: string | null }>(
      "SELECT id, email_key, event, at, meta FROM email_events WHERE user_id = ?1 ORDER BY at, id", uid),
    q<Action>("SELECT * FROM contact_actions WHERE user_id = ?1 ORDER BY at", uid),
    q<{ org_id: string; role: string; status: string; joined_at: number; removed_at: number | null }>(
      "SELECT org_id, role, status, joined_at, removed_at FROM org_members WHERE user_id = ?1", uid),
    q<{ track_name: string | null; issued_at: number; public_id: string }>(
      "SELECT track_name, issued_at, public_id FROM certificates WHERE user_id = ?1", uid),
    q<{ badge: string; earned_at: number }>("SELECT badge, earned_at FROM badges_earned WHERE user_id = ?1", uid),
  ]);

  // Activity from before they signed in, through the anon ids they carried.
  let pre: { at: number; signal: string; path: string | null; meta: string | null }[] = [];
  if (anonIds.length) {
    pre = await q<{ at: number; signal: string; path: string | null; meta: string | null }>(
      "SELECT at, signal, path, meta FROM intent_signals WHERE user_id IS NULL AND anon_id IN (SELECT value FROM json_each(?1)) ORDER BY at",
      JSON.stringify(anonIds.map((a) => a.anon_id)));
  }

  const ev: Ev[] = [];
  const createdAt = Number(u.created_at || 0);
  ev.push({
    at: createdAt, cat: "account", text: "Signed up",
    extra: u.signup_gate ? `via ${String(u.signup_gate)}${u.signup_slug ? ` on ${String(u.signup_slug)}` : ""}` : undefined,
    link: u.signup_slug ? page(slugOfPath(String(u.signup_slug))) : undefined,
  });
  if (u.pass_claimed_at) ev.push({ at: Number(u.pass_claimed_at), cat: "account", text: "Started the 30-day Data Analyst pass" });
  {
    let lastKey = "";
    for (const s of sessions) {
      const key = `${Math.floor(s.created_at / DAY)}|${s.device || ""}`;
      if (key === lastKey) continue;
      lastKey = key;
      ev.push({ at: s.created_at, cat: "account", text: `Signed in${s.device ? ` on ${s.device}` : ""}` });
    }
  }
  for (const a of audit) {
    let text = a.action.replace(/[._]/g, " ");
    let extra: string | undefined;
    let cat: Cat = "account";
    if (a.action === "email_optin") text = "Answered the email opt-in";
    else if (a.action === "email_offers_optin") text = "Opted in to offers by email";
    else if (a.action === "feedback") {
      text = "Sent feedback";
      try { const m = JSON.parse(a.meta_json || "{}"); extra = String(m.message || m.text || m.kind || "").slice(0, 400) || undefined; } catch { /* plain */ }
    } else if (a.action.startsWith("paddle.")) { cat = "buying"; text = "Paddle: " + a.action.slice(7).replace(/[._]/g, " "); }
    else if (a.action.startsWith("signup.email")) { cat = "email"; text = a.action === "signup.email.sent" ? "Sign-in email sent" : "Sign-in email failed"; }
    ev.push({ at: a.at, cat, text, extra });
  }
  for (const r of reads) {
    if (!r.read_at) continue;
    ev.push({
      at: r.read_at, cat: "learning", text: `Read ${words(r.post_slug)}`, link: page(r.post_slug),
      extra: r.marked_read ? "marked as read" : r.scroll_pct ? `${r.scroll_pct}% of the page` : undefined,
    });
  }
  for (const s of saved) ev.push({ at: s.saved_at, cat: "learning", text: `Saved ${words(s.post_slug)}`, link: page(s.post_slug) });
  for (const a of attempts) {
    const bits = [`${a.n} attempt${a.n === 1 ? "" : "s"}`, `${a.solved} solved`];
    if (a.hints) bits.push(`${a.hints} hint${a.hints === 1 ? "" : "s"}`);
    if (a.peeks) bits.push(`looked at ${a.peeks} solution${a.peeks === 1 ? "" : "s"}`);
    if (a.backfill) bits.push("carried over from before sign-in");
    ev.push({ at: a.last, cat: "practice", text: `Practised ${words(a.hub_slug)}`, link: page(a.hub_slug), extra: bits.join(", ") });
  }
  for (const x of xp) ev.push({ at: x.at, cat: "practice", text: `Earned ${x.xp} XP: ${x.action.replace(/[._]/g, " ")}`, extra: x.ref || undefined });
  // Cart recovery since 2026-10-18 is also in the email ledger (with its opens
  // and clicks), so its intent_signals marker would be the same send twice.
  const logged = new Set(mails.filter((m) => m.event === "sent").map((m) => m.email_key || ""));
  for (const s of sigs) {
    const cat: Cat = s.signal === "lesson_start" || s.signal === "lesson_complete" ? "learning"
      : s.signal.startsWith("recovery") ? "email" : BUYING.has(s.signal) ? "buying" : "learning";
    if (s.signal === "recovery_code") continue;
    if (s.path !== "skipped:purchased" && ((s.signal === "recovery_sent" && logged.has("cart-recovery")) || (s.signal === "recovery2_sent" && logged.has("cart-recovery-2")))) continue;
    const slug = slugOfPath(s.path);
    ev.push({ at: s.at, cat, text: describeSignal(s.signal, s.path, s.meta), link: slug && cat !== "email" ? page(slug) : undefined });
  }
  for (const s of pre) {
    const slug = slugOfPath(s.path);
    ev.push({ at: s.at, cat: BUYING.has(s.signal) ? "buying" : "learning", text: describeSignal(s.signal, s.path, s.meta), link: slug ? page(slug) : undefined, pre: true });
  }
  for (const a of alerts) {
    const surf = a.surface ? ` on ${String(a.surface)}` : "";
    ev.push({ at: Number(a.created_at), cat: "buying", text: `Asked to hear about discounts${surf}`, extra: a.intent ? `wants to start: ${String(a.intent)}` : undefined });
    if (a.offer_sent_at) ev.push({ at: Number(a.offer_sent_at), cat: "email", text: "Price-alert offer sent", extra: a.offer_code ? `code ${String(a.offer_code)}` : undefined });
    if (a.purchased_at) ev.push({ at: Number(a.purchased_at), cat: "buying", text: "Bought after the price alert" });
    if (a.unsubscribed_at) ev.push({ at: Number(a.unsubscribed_at), cat: "email", text: "Stopped the price alert" });
  }
  for (const s of subs) {
    ev.push({ at: s.created_at, cat: "buying", text: `Bought ${planLabel(s.plan)}` });
    if (s.cancel_at_period_end && s.status === "active") ev.push({ at: s.updated_at, cat: "buying", text: `Set ${planLabel(s.plan)} to end${s.current_period_end ? ` on ${new Date(s.current_period_end * 1000).toUTCString().slice(5, 16)}` : ""}` });
    if (s.status === "canceled" || s.status === "expired") ev.push({ at: s.updated_at, cat: "buying", text: `${planLabel(s.plan)} ${s.status === "canceled" ? "cancelled" : "expired"}` });
    if (s.status === "past_due") ev.push({ at: s.updated_at, cat: "buying", text: `Payment failing on ${planLabel(s.plan)}` });
  }
  for (const o of orgs) ev.push({ at: o.joined_at, cat: "account", text: `Joined a team as ${o.role}${o.status === "removed" ? " (later removed)" : ""}` });
  for (const c of certs) ev.push({ at: c.issued_at, cat: "learning", text: `Earned the ${c.track_name || "track"} certificate`, link: `/cert/${c.public_id}` });
  for (const b of badges) ev.push({ at: b.earned_at, cat: "learning", text: `Earned the ${b.badge.replace(/-/g, " ")} badge` });

  /* Emails: one record per send with what happened after it. Opens and clicks
     attach to the send by email key; the timeline gets the send and any click,
     never the opens, which Apple Mail fires on its own. */
  const sends: Array<{ key: string; label: string; at: number; opened_at: number | null; clicked_at: number | null; dest: string | null; manual: boolean }> = [];
  const byKey = new Map<string, number>();
  for (const m of mails) {
    const k = m.email_key || "";
    if (m.event === "sent" || m.event === "test_sent") {
      if (m.event === "test_sent") continue;
      byKey.set(k, sends.length);
      sends.push({ key: k, label: emailLabel(k), at: m.at, opened_at: null, clicked_at: null, dest: null, manual: k.startsWith("outreach:") });
    }
  }
  for (const m of mails) {
    const i = byKey.get(m.email_key || "");
    const s = i === undefined ? null : sends[i];
    if (m.event === "open" && s && !s.opened_at) s.opened_at = m.at;
    if (m.event === "click") {
      if (s && !s.clicked_at) { s.clicked_at = m.at; s.dest = cleanDest(m.meta); }
      ev.push({ at: m.at, cat: "email", text: `Clicked ${cleanDest(m.meta) || "a link"} in ${emailLabel(m.email_key || "")}` });
    }
    if (m.event === "bounce" || m.event === "soft_bounce") ev.push({ at: m.at, cat: "email", text: m.event === "bounce" ? "An email bounced" : "An email soft-bounced" });
    if (m.event === "unsubscribe") ev.push({ at: m.at, cat: "email", text: "Unsubscribed" });
    if (m.event === "pause") ev.push({ at: m.at, cat: "email", text: "Paused the daily lessons" });
    if (m.event === "vote") ev.push({ at: m.at, cat: "email", text: `Voted on a lesson email${m.meta ? `: ${m.meta}` : ""}` });
    if (m.event === "intent") ev.push({ at: m.at, cat: "email", text: `Answered an email question${m.meta ? `: ${m.meta}` : ""}` });
    if (m.event === "prefs_change") ev.push({ at: m.at, cat: "email", text: "Changed email preferences" });
  }
  for (const s of sends) {
    const after = s.clicked_at ? "clicked" : s.opened_at ? "opened" : "";
    ev.push({ at: s.at, cat: s.manual ? "owner" : "email", text: `${s.manual ? "You sent" : "Sent"}: ${s.label}`, extra: after || undefined });
  }

  for (const a of actions) {
    if (a.kind === "outreach") continue; // already in sends, with its reactions
    const t = a.kind === "note" ? "You noted" : a.kind === "snooze" ? `You snoozed them${a.until_at ? ` until ${new Date(a.until_at * 1000).toUTCString().slice(5, 16)}` : ""}`
      : a.kind === "done" ? `You marked them done${a.reason ? ` (${a.reason})` : ""}` : a.kind === "replied" ? "They replied to your email" : a.kind === "reopen" ? "You put them back in the queue" : a.kind;
    ev.push({ at: a.at, cat: "owner", text: t, extra: a.body || undefined });
  }

  ev.sort((x, y) => y.at - x.at);
  const counts: Record<string, number> = {};
  for (const e of ev) counts[e.cat] = (counts[e.cat] || 0) + 1;

  return json({
    now,
    person: {
      id: uid, email: u.email, name: u.display_name || null, handle: u.handle || null,
      country: u.country || null, created_at: createdAt,
      persona: u.persona || null, job_role: u.job_role || null, job_role_other: u.job_role_other || null,
      levels: { r: u.level_r || null, ml: u.level_ml || null, ts: u.level_ts || null },
      email_status: u.email_status || "ok",
      consents: { progress: Number(u.email_progress ?? 1), nurture: Number(u.email_nurture ?? 0), offers: Number(u.email_offers ?? 0) },
      nurture_paused_until: u.nurture_paused_until || null,
      subscriptions: subs.map((s) => ({ ...s, label: planLabel(s.plan) })),
      pre_signin_events: pre.length,
    },
    timeline: ev.slice(0, 5000),
    truncated: ev.length > 5000,
    counts,
    emails: sends.sort((x, y) => y.at - x.at),
    actions: actions.slice().reverse(),
  });
};

function emailLabel(key: string): string {
  if (key.startsWith("outreach:")) return `your email "${outreachLabel(key.split(":")[1] || "")}"`;
  if (key.startsWith("seq:")) return `daily lesson ${key.slice(4)}`;
  return autoLabel(key) || key;
}

export const onRequestPost: PagesFunction<Env & { CRON_SECRET?: string; ADMIN_EMAIL?: string }, string, RequestData> = async (context) => {
  const gate = await requireAdmin(context);
  if (gate instanceof Response) return gate;
  const DB = context.env.DB;
  await ensureContactTables(DB);
  let b: Record<string, unknown>;
  try { b = await context.request.json(); } catch { return jsonError(400, "bad_json", "Body must be JSON"); }

  const email = String(b.email || "").trim().toLowerCase();
  const op = String(b.op || "");
  if (!["note", "snooze", "done", "replied", "reopen"].includes(op)) return jsonError(400, "bad_op", "op must be note, snooze, done, replied or reopen");
  const u = await DB.prepare("SELECT id FROM users WHERE lower(email) = ?1 AND deleted_at IS NULL").bind(email).first<{ id: string }>();
  if (!u) return jsonError(404, "no_user", "No user with that email");

  const now = Math.floor(Date.now() / 1000);
  const text = String(b.text || "").trim().slice(0, 4000) || null;
  if (op === "note" && !text) return jsonError(400, "empty", "A note needs some text");
  const days = Math.min(90, Math.max(1, parseInt(String(b.days || "7"), 10) || 7));
  const until = op === "snooze" ? now + days * DAY : null;
  const ref = b.ref === undefined || b.ref === null ? null : Number(b.ref) || null;
  if (op === "replied" && ref) {
    const o = await DB.prepare("SELECT id FROM contact_actions WHERE id = ?1 AND user_id = ?2 AND kind = 'outreach'")
      .bind(ref, u.id).first();
    if (!o) return jsonError(404, "no_email", "That email is not one of yours to this person");
  }
  const reason = b.reason ? String(b.reason).slice(0, 40) : null;

  const res = await DB.prepare(
    "INSERT INTO contact_actions (user_id, kind, ref, body, until_at, reason, at, actor) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
  ).bind(u.id, op, ref, text, until, reason, now, gate.isCron ? "cron" : gate.admin).run();
  return json({ ok: true, id: res.meta?.last_row_id ?? null, op, until_at: until });
};
