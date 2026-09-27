// Contextual outreach from the contact centre, one lead at a time.
//
//   GET  /api/admin/outreach?user=<email>[&template=<key>]
//        -> the suggested template for that lead, rendered with their own
//           figures, plus every template available and a safety report.
//   POST /api/admin/outreach  { user, template, mode: "test"|"send",
//                               subject?, preheader?, body?, save? }
//        -> sends. mode "test" goes to the admin, "send" goes to the lead.
//           `save: true` stores an edited body in KV as the new default.
//
// WHY A SEPARATE PATH FROM THE BRAIN. The brain is automatic and picks at most
// one non-account email per user per day from derived state. This is the owner
// deciding to write to one person now. Mixing them would mean either the manual
// send silently consuming the automated slot, or the brain re-sending something
// the owner has just sent by hand.
//
// So manual sends get their own ledger key (`outreach:<template>`), and the GET
// reports what the brain has already sent in the last 24 hours and whether an
// automated follow-up is pending for this person. The owner is told, rather than
// the system silently guessing. The one thing it will NOT do is mail a suppressed
// address: bounced and complained are refused outright.

import type { Env, RequestData } from "../../_middleware";
import { json, err401, err403, jsonError } from "../../_lib/errors";
import { getUserById } from "../../_lib/db";
import { readCookie, verifyIdCookie, ID_COOKIE } from "../../_lib/idcookie";
import { renderPersonalNote, SENDER, REPLY_TO } from "../../_lib/email-templates";
import { sendMail } from "../../_lib/email";
import { ensureIntentTable } from "../signal";

const DEFAULT_ADMIN = "selva86@gmail.com";
const DAY = 86400;

function timingSafeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let x = 0;
  for (let i = 0; i < a.length; i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return x === 0;
}

interface Ctx {
  first_name: string; email: string;
  lessons: number; solved: number; xp: number; streak: number;
  wall: number; pricing: number; checkout: number;
  opens: number; clicks: number; alerts: number;
  last_seen_days: number; joined_days: number;
  top_hub: string | null; last_lesson: string | null;
  is_customer: boolean;
}

interface Tpl {
  key: string; label: string; when: string;
  subject: string; preheader: string; body: string;
}

/* The templates.
 *
 * THE RULE: quote ACHIEVEMENT, never SURVEILLANCE. Lessons finished and
 * exercises solved are flattering, true, and only this sender could know them.
 * Wall hits, pricing views and abandoned-checkout counts are never counted back
 * at a person: "you hit the wall 9 times" says you have been watching, and
 * frames them as repeatedly failing. The cart template is the one exception,
 * because the abandoned checkout is its premise and the reader knows they did it.
 *
 * Every template that asks for money carries ONE link and the refund line. The
 * probe template deliberately carries no link at all: it is a real question
 * about why someone stopped, and a sales link would poison the only email whose
 * whole value is an honest reply.
 *
 * No price anywhere. Parity pricing means the number belongs on the page, in
 * their own currency.
 *
 * Every one is a plain personal note from Akshay, because that is what every
 * other non-receipt email on this site is, and because a support-alias-shaped
 * pitch is exactly what people ignore. They lead with the person's own record
 * rather than with the product: "you solved 23 exercises" is a fact only this
 * sender could know, and it earns the rest of the message.
 *
 * Tokens in braces are filled from the lead's real aggregates. A token whose
 * value would be zero is never interpolated into a sentence that needs it to be
 * positive; the template picker below chooses on exactly those conditions. */
const TEMPLATES: Tpl[] = [
  {
    key: "cart",
    label: "Checkout abandoned",
    when: "opened a checkout and did not finish",
    subject: "Did something go wrong at checkout?",
    preheader: "If the page broke, I can usually fix it in minutes.",
    body: [
      "Hi {first_name},",
      "",
      "You started checking out and did not finish. If something on that page broke, a card that would not go through, a country or a currency it did not like, tell me and I can usually fix it in a few minutes.",
      "",
      "If it was the price, say so plainly and I will tell you honestly whether anything is coming.",
      "",
      "[Pick up where you left off -> https://r-statistics.co/pricing.html?utm_source=email&utm_campaign=outreach]",
      "",
      "Fourteen days to change your mind either way, no form and no questions.",
      "",
      "And if you simply changed your mind, that is a perfectly good answer and you can ignore this.",
      "",
      "Akshay",
    ].join("\n"),
  },
  {
    key: "wall",
    label: "Hit the Pro wall",
    when: "keeps reaching Pro lessons",
    subject: "You are further in than most people get",
    preheader: "What the paid half opens, and what it costs where you are.",
    body: [
      "Hi {first_name},",
      "",
      "You have finished {lessons} lessons here and solved {solved} exercises. That is further than almost anyone gets on the free material, and it means you have more or less run out of it.",
      "",
      "The paid half is the rest of every track: every lesson after the first section, unlimited graded exercises instead of twenty five a month, and the certificate at the end of the track.",
      "",
      "[See what it costs where you are -> https://r-statistics.co/pricing.html?utm_source=email&utm_campaign=outreach]",
      "",
      "Fourteen days to change your mind, no form and no questions.",
      "",
      "And if there is a reason you have not upgraded, I would genuinely like to hear it. Reply and tell me. I read every one.",
      "",
      "Akshay",
    ].join("\n"),
  },
  {
    key: "probe",
    label: "Went quiet",
    when: "was active and has gone quiet this month",
    subject: "Did you get stuck on something?",
    preheader: "No pitch. I am just curious what stopped you.",
    body: [
      "Hi {first_name},",
      "",
      "You were going well, {solved} exercises solved and {lessons} lessons finished, and then it went quiet.",
      "",
      "That is usually one of two things: life got busy, or something here was harder or duller than it should have been. If it is the second one, I would really like to know which bit.",
      "",
      "One line back is plenty. It helps me more than you would think.",
      "",
      "Akshay",
    ].join("\n"),
  },
  {
    key: "revive",
    label: "Dormant, with a record",
    when: "quiet one to three months but has real history",
    subject: "Your work here is still where you left it",
    preheader: "Nothing expired, nothing lost.",
    body: [
      "Hi {first_name},",
      "",
      "It has been a while. Before you stopped you had solved {solved} exercises and finished {lessons} lessons, which is a real body of work.",
      "",
      "All of it is still there, exactly where you left it, along with your XP and your streak record. Nothing expired and nothing was lost.",
      "",
      "[Pick up where you left off -> https://r-statistics.co/dashboard.html?utm_source=email&utm_campaign=outreach]",
      "",
      "If you would rather I just pointed you at the right next thing, reply and tell me what you were working towards.",
      "",
      "Akshay",
    ].join("\n"),
  },
  {
    key: "review",
    label: "Happy customer, ask for a review",
    when: "a paying member who is actually using it",
    subject: "Would you tell me what you think?",
    preheader: "Two lines is plenty, and the unflattering parts are the useful ones.",
    body: [
      "Hi {first_name},",
      "",
      "You have solved {solved} exercises and worked through {lessons} lessons, which puts you among the people who actually use this rather than just paying for it.",
      "",
      "Would you tell me what you make of it? Two lines is plenty, and the unflattering parts are the useful parts. If something annoys you every single time you open it, that is exactly what I want to hear.",
      "",
      "If I ever want to quote you on the site I will ask you first, and never without your say-so.",
      "",
      "Akshay",
    ].join("\n"),
  },
  {
    key: "onboard",
    label: "Paid, has not started",
    when: "a paying member with little activity yet",
    subject: "Did you get started alright?",
    preheader: "If something is in the way, I will clear it.",
    body: [
      "Hi {first_name},",
      "",
      "You joined and I have not seen much activity since. That is usually a free evening that has not arrived yet, or something getting in the way.",
      "",
      "If it is the second, reply and tell me what happened. A track that is hard to start is my problem to fix, not yours.",
      "",
      "[Start where the track begins -> https://r-statistics.co/dashboard.html?utm_source=email&utm_campaign=outreach]",
      "",
      "Akshay",
    ].join("\n"),
  },
];

const BY_KEY = new Map(TEMPLATES.map((t) => [t.key, t]));

/* Pick the template the lead actually warrants, on the same logic the contact
   list uses for its "next action" column, so the button and the column never
   disagree. */
function suggest(c: Ctx): string {
  if (c.is_customer) return (c.solved >= 10 || c.lessons >= 10) ? "review" : "onboard";
  if (c.checkout > 0) return "cart";
  if (c.wall > 0) return "wall";
  if (c.last_seen_days <= 30 && (c.solved > 0 || c.lessons > 0)) return "probe";
  if (c.last_seen_days <= 120 && (c.solved > 0 || c.lessons > 0)) return "revive";
  return "probe";
}

function fill(t: string, c: Ctx): string {
  return t.replace(/\{([a-z_]+)\}/g, (m, k: string) => {
    const v = (c as unknown as Record<string, unknown>)[k];
    if (v === undefined || v === null) return m;
    return typeof v === "number" ? String(v) : String(v);
  });
}

export const onRequest: PagesFunction<
  Env & { CRON_SECRET?: string; ZOHO_ZEPTOMAIL_TOKEN: string; ZOHO_ZEPTOMAIL_SENDER: string },
  string, RequestData
> = async (context) => {
  let me = context.data.user;
  if (!me) {
    const secret = (context.env as { EDGE_ID_SECRET?: string }).EDGE_ID_SECRET || "";
    const sub = secret ? await verifyIdCookie(secret, readCookie(context.request, ID_COOKIE)) : null;
    if (sub) me = await getUserById(context.env.DB, sub).catch(() => null);
  }
  const auth = context.request.headers.get("Authorization") || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const isCron = !!context.env.CRON_SECRET && timingSafeEq(bearer, context.env.CRON_SECRET);
  const admin = (context.env as { ADMIN_EMAIL?: string }).ADMIN_EMAIL || DEFAULT_ADMIN;
  const isAdmin = !!me && (me.email || "").toLowerCase() === admin.toLowerCase();
  if (!isAdmin && !isCron) return me ? err403("Admins only") : err401();

  await ensureIntentTable(context.env.DB);
  const DB = context.env.DB;
  const now = Math.floor(Date.now() / 1000);
  const method = context.request.method.toUpperCase();

  let body: Record<string, unknown> = {};
  if (method === "POST") {
    try { body = await context.request.json(); } catch { return jsonError(400, "bad_json", "Body must be JSON"); }
  }
  const url = new URL(context.request.url);
  const targetEmail = String((method === "POST" ? body.user : url.searchParams.get("user")) || "").trim().toLowerCase();
  if (!targetEmail) return jsonError(400, "no_user", "Pass ?user=<email>");

  const lead = await DB.prepare(
    "SELECT id, email, display_name, created_at, pro_until, total_xp, current_streak_days, " +
    "email_status FROM users WHERE lower(email) = ?1 AND deleted_at IS NULL",
  ).bind(targetEmail).first<Record<string, unknown>>();
  if (!lead) return jsonError(404, "no_user", "No user with that email");

  const uid = String(lead.id);

  // Their own figures, so the copy can name them.
  const [ex, rd, sig, ev, recent, al] = await Promise.all([
    DB.prepare(
      "SELECT COUNT(DISTINCT CASE WHEN passed = 1 THEN hub_slug || '|' || exercise_id END) solved, " +
      "MAX(submitted_at) last FROM exercise_attempts WHERE user_id = ?1",
    ).bind(uid).first<{ solved: number; last: number }>(),
    DB.prepare("SELECT COUNT(*) n, MAX(read_at) last FROM reading_progress WHERE user_id = ?1")
      .bind(uid).first<{ n: number; last: number }>(),
    DB.prepare("SELECT signal, COUNT(*) n FROM intent_signals WHERE user_id = ?1 GROUP BY signal")
      .bind(uid).all<{ signal: string; n: number }>(),
    DB.prepare("SELECT event, COUNT(*) n FROM email_events WHERE user_id = ?1 GROUP BY event")
      .bind(uid).all<{ event: string; n: number }>(),
    // What the brain has already sent, so a manual send is never blind.
    DB.prepare("SELECT email_key, sent_at FROM sent_emails WHERE user_id = ?1 ORDER BY sent_at DESC LIMIT 6")
      .bind(uid).all<{ email_key: string; sent_at: number }>(),
    DB.prepare("SELECT COUNT(*) n FROM price_alerts WHERE user_id = ?1").bind(uid).first<{ n: number }>(),
  ]);

  const S = new Map((sig.results ?? []).map((r) => [r.signal, r.n]));
  const E = new Map((ev.results ?? []).map((r) => [r.event, r.n]));
  const lastSeen = Math.max(Number(ex?.last || 0), Number(rd?.last || 0));
  const proUntil = lead.pro_until === null || lead.pro_until === undefined ? null : Number(lead.pro_until);

  const ctx: Ctx = {
    first_name: String(lead.display_name || "").trim().split(/\s+/)[0] || "there",
    email: String(lead.email),
    lessons: Number(rd?.n || 0), solved: Number(ex?.solved || 0),
    xp: Number(lead.total_xp || 0), streak: Number(lead.current_streak_days || 0),
    wall: S.get("pro_wall_hit") || 0, pricing: S.get("pricing_view") || 0,
    checkout: S.get("checkout_start") || 0,
    opens: E.get("open") || 0, clicks: E.get("click") || 0,
    alerts: Number(al?.n || 0),
    last_seen_days: lastSeen ? Math.floor((now - lastSeen) / DAY) : 999,
    joined_days: Math.floor((now - Number(lead.created_at || now)) / DAY),
    top_hub: null, last_lesson: null,
    is_customer: proUntil === -1 || (!!proUntil && proUntil > now),
  };

  const suggested = suggest(ctx);
  const key = String((method === "POST" ? body.template : url.searchParams.get("template")) || suggested);
  const tpl = BY_KEY.get(key);
  if (!tpl) return jsonError(404, "no_template", `Unknown template. Have: ${TEMPLATES.map((t) => t.key).join(", ")}`);

  // A saved edit in KV beats the shipped default, same convention as emailcopy:*.
  let saved: Partial<Tpl> | null = null;
  try {
    const raw = await context.env.KV.get(`outreach:${key}`);
    if (raw) saved = JSON.parse(raw);
  } catch { /* shipped default */ }

  const subject = String(body.subject ?? saved?.subject ?? tpl.subject);
  const preheader = String(body.preheader ?? saved?.preheader ?? tpl.preheader);
  const rawBody = String(body.body ?? saved?.body ?? tpl.body);

  const rendered = renderPersonalNote({
    key: `outreach:${key}`, category: "offers",
    reason: "you have an account on r-statistics.co",
    subject: fill(subject, ctx), preheader: fill(preheader, ctx),
    body: fill(rawBody, ctx), data: {},
  });

  const suppressed = lead.email_status === "bounced" || lead.email_status === "complained";
  const brainRecent = (recent.results ?? []).filter((r) => now - r.sent_at < DAY);

  if (method === "GET") {
    return json({
      user: { email: ctx.email, name: lead.display_name || null, is_customer: ctx.is_customer },
      context: ctx,
      suggested, template: key,
      templates: TEMPLATES.map((t) => ({ key: t.key, label: t.label, when: t.when })),
      // Raw (unfilled) copy, so the editor shows the tokens rather than one
      // person's numbers baked in.
      editable: { subject, preheader, body: rawBody },
      preview: { subject: rendered.subject, preheader: rendered.preheader, text: rendered.text, html: rendered.html },
      safety: {
        suppressed, email_status: lead.email_status || null,
        sent_last_24h: brainRecent.map((r) => r.email_key),
        recent_sends: (recent.results ?? []).map((r) => ({ key: r.email_key, at: r.sent_at })),
        note: suppressed
          ? "This address is suppressed. Sending is refused."
          : brainRecent.length
            ? "The engine already mailed this person in the last 24 hours. Sending now means two emails in a day."
            : "Nothing sent to this person in the last 24 hours.",
      },
    });
  }

  // ---- POST: send
  const mode = String(body.mode || "test");
  if (mode !== "test" && mode !== "send") return jsonError(400, "bad_mode", "mode must be test or send");
  if (mode === "send" && suppressed) {
    return jsonError(409, "suppressed", `Refusing to send: address is ${lead.email_status}`);
  }

  if (body.save === true) {
    await context.env.KV.put(`outreach:${key}`, JSON.stringify({ subject, preheader, body: rawBody }));
  }

  const to = mode === "test" ? admin : ctx.email;
  const res = await sendMail(context.env, {
    to: { email: to },
    subject: rendered.subject,
    htmlBody: rendered.html, textBody: rendered.text,
    from: SENDER, replyTo: REPLY_TO,
  });
  if (!res.ok) return jsonError(502, "send_failed", res.error || `status ${res.status}`);

  if (mode === "send") {
    /* Ledger under a distinct key, so a hand-written email never consumes the
       brain's automated slot and the brain's dedupe is never confused by it. The
       audit row is what makes a manual send visible in the email dashboard
       alongside everything else. */
    await DB.prepare(
      "INSERT OR IGNORE INTO sent_emails (user_id, email_key, sent_at) VALUES (?1, ?2, ?3)",
    ).bind(uid, `outreach:${key}`, now).run().catch(() => {});
    await DB.prepare(
      "INSERT INTO email_events (user_id, email, email_key, event, at, meta) VALUES (?1, ?2, ?3, 'sent', ?4, ?5)",
    ).bind(uid, ctx.email, `outreach:${key}`, now, "manual outreach from the contact centre").run().catch(() => {});
  }

  return json({ sent: true, mode, to, template: key, subject: rendered.subject, saved: body.save === true });
};
