// Contextual outreach from the contact centre, one person at a time.
//
//   GET  /api/admin/outreach?user=<email>[&template=<key>][&reason=<queue reason>][&ref=<action id>]
//        -> the suggested template for that person, rendered with their own
//           figures, every template with whether it applies, and a safety report.
//   POST /api/admin/outreach  { user, template, mode: "preview"|"test"|"send",
//                               subject?, preheader?, body?, save?, ref? }
//        -> "preview" renders the edited copy and sends nothing; "test" goes
//           to the admin, "send" goes to the person.
//           `save: true` stores the edited copy in KV as the new default.
//
// Copy: functions/_lib/outreach-copy.ts (SSOT Plans/01_email_and_nurture/outreach-copy-v2.md).
//
// WHAT CHANGED IN V2 (2026-10-14)
//  - Every send is tracked. v1 rendered with no tracking data, so a hand-sent
//    email recorded no open and no click, and nothing could say what happened
//    after it. Each send now gets its own key, outreach:<template>:<id>, so two
//    emails to the same person are measured separately.
//  - Every send is a contact_actions row, which is what the Contacted tab and
//    the person panel read.
//  - Marketing emails carry the one-click unsubscribe the automatic ones carry,
//    and are refused to anyone who turned email off. The payment email is a
//    service message and still goes.
//  - A test send never carries the person's real unsubscribe link, so clicking
//    around in your own test cannot unsubscribe them.
//
// WHY A SEPARATE PATH FROM THE BRAIN. The brain is automatic and picks at most
// one non-account email per user per day. This is the owner deciding to write
// to one person now. Manual sends have their own ledger keys, and the GET
// reports what the brain sent in the last 24 hours, so the owner is told
// rather than the system silently guessing.

import type { Env, RequestData } from "../../_middleware";
import { json, jsonError } from "../../_lib/errors";
import { requireAdmin } from "../../_lib/admin-auth";
import { renderPersonalNote, SENDER, REPLY_TO, type TemplateData } from "../../_lib/email-templates";
import { sendMail } from "../../_lib/email";
import { userSig, unsubUrl } from "../../_lib/brain";
import { ensureContactTables, trackOfSlug, slugOfPath, planLabel, fmtDay, DAY, type Reason } from "../../_lib/contacts";
import {
  OUTREACH, OUTREACH_BY_KEY, fillCopy, fillLine, utmLinks, missingRequired, progressPhrase,
  type OutreachTemplate, type Tokens,
} from "../../_lib/outreach-copy";

type OEnv = Env & {
  CRON_SECRET?: string; ADMIN_EMAIL?: string;
  ZOHO_ZEPTOMAIL_TOKEN: string; ZOHO_ZEPTOMAIL_SENDER: string;
  EMAIL_UNSUB_SECRET?: string; ENVIRONMENT?: string; EMAIL_TEST_ALLOWLIST?: string;
};

const BY_REASON: Record<Reason, string> = {
  billing: "billing", checkout: "checkout-help", followup: "follow-up", save: "stay",
  wall: "wall-goal", upgrade: "upgrade", plans: "plan-help", start: "get-started", review: "review",
};

interface Person {
  uid: string; email: string; name: string | null; status: string | null; optedOut: boolean;
  isCustomer: boolean; tokens: Tokens; facts: Record<string, number | string | null>;
  lastOutreach: { id: number; at: number; template: string | null } | null;
  refFound: boolean;
}

async function loadPerson(DB: D1Database, email: string, ref: number | null): Promise<Person | null> {
  const lead = await DB.prepare(
    "SELECT id, email, display_name, created_at, pro_until, total_xp, email_status, email_progress, persona, job_role " +
    "FROM users WHERE lower(email) = ?1 AND deleted_at IS NULL",
  ).bind(email).first<Record<string, unknown>>();
  if (!lead) return null;
  const uid = String(lead.id);
  const now = Math.floor(Date.now() / 1000);

  const [ex, done, wall, subs, outs, sig] = await Promise.all([
    DB.prepare("SELECT COUNT(DISTINCT CASE WHEN passed = 1 THEN hub_slug || '|' || exercise_id END) solved, MAX(submitted_at) last FROM exercise_attempts WHERE user_id = ?1")
      .bind(uid).first<{ solved: number; last: number | null }>(),
    DB.prepare("SELECT COUNT(DISTINCT path) n, MAX(at) last FROM intent_signals WHERE user_id = ?1 AND signal = 'lesson_complete'")
      .bind(uid).first<{ n: number; last: number | null }>(),
    DB.prepare("SELECT path, meta, at FROM intent_signals WHERE user_id = ?1 AND signal = 'pro_wall_hit' ORDER BY at DESC LIMIT 1")
      .bind(uid).first<{ path: string | null; meta: string | null; at: number }>(),
    DB.prepare("SELECT plan, status, cancel_at_period_end, current_period_end, created_at FROM subscriptions WHERE user_id = ?1 ORDER BY created_at")
      .bind(uid).all<{ plan: string; status: string; cancel_at_period_end: number; current_period_end: number | null; created_at: number }>(),
    DB.prepare("SELECT id, at, template FROM contact_actions WHERE user_id = ?1 AND kind = 'outreach' ORDER BY at DESC")
      .bind(uid).all<{ id: number; at: number; template: string | null }>(),
    DB.prepare("SELECT signal, COUNT(*) n FROM intent_signals WHERE user_id = ?1 GROUP BY signal")
      .bind(uid).all<{ signal: string; n: number }>(),
  ]);

  const proUntil = lead.pro_until === null || lead.pro_until === undefined ? null : Number(lead.pro_until);
  const isCustomer = proUntil === -1 || (!!proUntil && proUntil > now);
  const s = subs.results ?? [];
  const first = s.length ? Number(s[0].created_at) : 0;
  const latest = s.length ? s[s.length - 1] : null;
  const track = wall ? trackOfSlug(slugOfPath(wall.path)) : null;
  const title = wall ? ((wall.meta || "").split("|")[1] || slugOfPath(wall.path).replace(/-/g, " ")).trim() : "";
  const lessons = Number(done?.n || 0);
  const solved = Number(ex?.solved || 0);
  const all = outs.results ?? [];
  const refRow = ref ? all.find((o) => o.id === ref) ?? null : null;
  const lastOutreach = refRow ?? all[0] ?? null;
  const S = new Map((sig.results ?? []).map((r) => [r.signal, r.n]));

  const tokens: Tokens = {
    first_name: String(lead.display_name || "").trim().split(/\s+/)[0] || "",
    progress_phrase: progressPhrase(lessons, solved),
    track_name: track ? track.name : "",
    lesson_title: title,
    plan_name: latest ? planLabel(latest.plan) : "",
    access_end_date: latest && latest.cancel_at_period_end && latest.current_period_end ? fmtDay(latest.current_period_end) : "",
    last_note_date: lastOutreach ? fmtDay(lastOutreach.at) : "",
    refund_line: first && now - first < 14 * DAY
      ? `Your 14-day refund is open until ${fmtDay(first + 14 * DAY)}, so there's no wrong answer.` : "",
  };
  return {
    uid, email: String(lead.email), name: (lead.display_name as string) || null,
    status: (lead.email_status as string) || null,
    optedOut: Number(lead.email_progress ?? 1) === 0,
    isCustomer, tokens, lastOutreach, refFound: !!refRow,
    facts: {
      lessons, solved, xp: Number(lead.total_xp || 0),
      wall: S.get("pro_wall_hit") || 0, pricing: S.get("pricing_view") || 0, checkout: S.get("checkout_start") || 0,
      last_seen_days: Math.max(Number(ex?.last || 0), Number(done?.last || 0))
        ? Math.floor((now - Math.max(Number(ex?.last || 0), Number(done?.last || 0))) / DAY) : null,
      persona: (lead.persona as string) || null, job_role: (lead.job_role as string) || null,
      plan: isCustomer ? (latest ? planLabel(latest.plan) : "Pro") : null,
    },
  };
}

function suggest(p: Person, reason: string | null): string {
  if (reason && BY_REASON[reason as Reason]) return BY_REASON[reason as Reason];
  const f = p.facts;
  if (p.isCustomer) return Number(f.solved) + Number(f.lessons) >= 15 ? "review" : "get-started";
  if (Number(f.checkout) > 0) return "checkout-help";
  if (Number(f.wall) > 0 && p.tokens.track_name) return "wall-goal";
  if (Number(f.pricing) > 0) return "plan-help";
  return p.tokens.progress_phrase ? "probe" : "plan-help";
}

function render(tpl: OutreachTemplate, copy: { subject: string; preheader: string; body: string }, t: Tokens, data: TemplateData) {
  return renderPersonalNote({
    key: `outreach:${tpl.key}`, category: tpl.category, reason: tpl.reason,
    subject: fillLine(copy.subject, t), preheader: fillLine(copy.preheader, t),
    body: fillCopy(utmLinks(copy.body, tpl.key), t), data,
  });
}

async function savedCopy(KV: KVNamespace, key: string): Promise<Partial<OutreachTemplate> | null> {
  try { const raw = await KV.get(`outreach:${key}`); return raw ? JSON.parse(raw) : null; } catch { return null; }
}

export const onRequest: PagesFunction<OEnv, string, RequestData> = async (context) => {
  const gate = await requireAdmin(context);
  if (gate instanceof Response) return gate;
  const DB = context.env.DB;
  await ensureContactTables(DB);
  const now = Math.floor(Date.now() / 1000);
  const method = context.request.method.toUpperCase();
  if (method !== "GET" && method !== "POST") return jsonError(405, "method", "GET or POST");

  let body: Record<string, unknown> = {};
  if (method === "POST") {
    try { body = await context.request.json(); } catch { return jsonError(400, "bad_json", "Body must be JSON"); }
  }
  const url = new URL(context.request.url);
  const param = (k: string) => (method === "POST" ? body[k] : url.searchParams.get(k));
  const target = String(param("user") || "").trim().toLowerCase();
  if (!target) return jsonError(400, "no_user", "Pass ?user=<email>");
  const refRaw = param("ref");
  const ref = refRaw === null || refRaw === undefined || refRaw === "" ? null : Number(refRaw) || null;

  const p = await loadPerson(DB, target, ref);
  if (!p) return jsonError(404, "no_user", "No user with that email");

  const reason = method === "GET" ? url.searchParams.get("reason") : null;
  const suggested = suggest(p, reason);
  const key = String(param("template") || suggested);
  const tpl = OUTREACH_BY_KEY.get(key);
  if (!tpl) return jsonError(404, "no_template", `Unknown template. Have: ${OUTREACH.map((t) => t.key).join(", ")}`);

  const saved = await savedCopy(context.env.KV, key);
  const copy = {
    subject: String(body.subject ?? saved?.subject ?? tpl.subject),
    preheader: String(body.preheader ?? saved?.preheader ?? tpl.preheader),
    body: String(body.body ?? saved?.body ?? tpl.body),
  };
  const missing = missingRequired(tpl, p.tokens);
  const suppressed = p.status === "bounced" || p.status === "complained";
  const blockedOptOut = p.optedOut && tpl.category !== "account";

  const recent = await DB.prepare(
    "SELECT email_key, at FROM email_events WHERE user_id = ?1 AND event = 'sent' AND at >= ?2 ORDER BY at DESC",
  ).bind(p.uid, now - DAY).all<{ email_key: string; at: number }>();
  const last24 = (recent.results ?? []).map((r) => r.email_key);

  if (method === "GET") {
    const rendered = render(tpl, copy, p.tokens, {});
    const notes: string[] = [];
    if (suppressed) notes.push(`This address is ${p.status}. Sending is refused.`);
    else if (blockedOptOut) notes.push("They turned email off. Only the payment email can go to them.");
    if (missing.length) notes.push(`This template needs ${missing.join(", ")}, which this person does not have.`);
    if (last24.length) notes.push(`Already emailed in the last 24 hours (${last24.join(", ")}). Sending now means two emails in a day.`);
    if (p.lastOutreach && now - p.lastOutreach.at < 3 * DAY && key !== "follow-up") {
      notes.push(`You wrote to them ${Math.max(1, Math.round((now - p.lastOutreach.at) / 3600))} hours ago.`);
    }
    return json({
      user: { email: p.email, name: p.name, is_customer: p.isCustomer },
      context: p.facts,
      tokens: p.tokens,
      suggested, template: key, reason, ref,
      templates: OUTREACH.map((t) => ({
        key: t.key, group: t.group, label: t.label, when: t.when,
        available: missingRequired(t, p.tokens).length === 0 && !(p.optedOut && t.category !== "account"),
      })),
      guide: { when: tpl.when, angle: tpl.angle, avoid: tpl.avoid, category: tpl.category },
      // Raw copy, so the editor shows the tokens rather than one person's
      // figures baked in.
      editable: copy,
      preview: { subject: rendered.subject, preheader: rendered.preheader, text: rendered.text },
      safety: {
        suppressed, opted_out: p.optedOut, blocked: suppressed || blockedOptOut || missing.length > 0,
        sent_last_24h: last24, notes,
        note: notes[0] || "Nothing sent to this person in the last 24 hours.",
      },
    });
  }

  // ---- POST
  const mode = String(body.mode || "test");
  if (mode !== "preview" && mode !== "test" && mode !== "send") return jsonError(400, "bad_mode", "mode must be preview, test or send");
  if (mode === "preview") {
    // The owner's edits, rendered exactly as they would go. No side effects.
    const r = render(tpl, copy, p.tokens, {});
    return json({ preview: { subject: r.subject, preheader: r.preheader, text: r.text } });
  }
  if (ref && !p.refFound) return jsonError(404, "bad_ref", "That email is not one of yours to this person");
  // A follow-up always hangs off an earlier email: the one named, or the latest.
  const threadRef = ref ?? (key === "follow-up" ? p.lastOutreach?.id ?? null : null);
  if (mode === "send") {
    if (suppressed) return jsonError(409, "suppressed", `Refusing to send: the address is ${p.status}`);
    if (blockedOptOut) return jsonError(409, "opted_out", "Refusing to send: they turned email off");
    if (missing.length) return jsonError(409, "missing", `This template needs ${missing.join(", ")}`);
    if (key === "follow-up" && !threadRef) return jsonError(400, "no_ref", "A follow-up needs an earlier email of yours to follow");
  }

  if (body.save === true) {
    await context.env.KV.put(`outreach:${key}`, JSON.stringify(copy));
  }

  if (mode === "test") {
    const r = render(tpl, copy, p.tokens, {});
    const res = await sendMail(context.env, {
      to: { email: gate.admin }, subject: `[test] ${r.subject}`,
      htmlBody: r.html, textBody: r.text, from: SENDER, replyTo: REPLY_TO,
    });
    if (!res.ok) return jsonError(502, "send_failed", res.error || `status ${res.status}`);
    return json({ sent: true, mode, to: gate.admin, template: key, subject: r.subject, saved: body.save === true });
  }

  /* The action row first: its id is part of the tracking key, which is what
     lets two emails to the same person be measured apart. */
  const ins = await DB.prepare(
    "INSERT INTO contact_actions (user_id, kind, ref, template, at, actor) VALUES (?1, 'outreach', ?2, ?3, ?4, ?5)",
  ).bind(p.uid, threadRef, key, now, gate.isCron ? "cron" : gate.admin).run();
  const id = Number(ins.meta?.last_row_id || 0);
  const ekey = `outreach:${key}:${id}`;
  const sig = await userSig(context.env, p.uid);
  const data: TemplateData = {
    track: sig ? { uid: p.uid, sig, key: ekey } : undefined,
    unsubscribe_url: tpl.category === "account" ? undefined : await unsubUrl(context.env, p.uid, ekey),
  };
  const r = render(tpl, copy, p.tokens, data);
  const res = await sendMail(context.env, {
    to: { email: p.email }, subject: r.subject,
    htmlBody: r.html, textBody: r.text, from: SENDER, replyTo: REPLY_TO,
  });
  if (!res.ok) {
    await DB.prepare("DELETE FROM contact_actions WHERE id = ?1").bind(id).run().catch(() => {});
    return jsonError(502, "send_failed", res.error || `status ${res.status}`);
  }
  await DB.prepare("UPDATE contact_actions SET email_key = ?1, subject = ?2, body = ?3 WHERE id = ?4")
    .bind(ekey, r.subject, fillCopy(copy.body, p.tokens), id).run().catch(() => {});
  /* The ledger row keeps the brain's per-day picture honest; the event row is
     what makes the send visible in the email dashboard with everything else. */
  await DB.prepare("INSERT OR IGNORE INTO sent_emails (user_id, email_key, sent_at) VALUES (?1, ?2, ?3)")
    .bind(p.uid, ekey, now).run().catch(() => {});
  await DB.prepare("INSERT INTO email_events (user_id, email, email_key, event, at, meta) VALUES (?1, ?2, ?3, 'sent', ?4, ?5)")
    .bind(p.uid, p.email, ekey, now, `contact centre: ${tpl.label}`).run().catch(() => {});

  return json({ sent: true, mode, to: p.email, template: key, id, key: ekey, subject: r.subject, saved: body.save === true });
};
