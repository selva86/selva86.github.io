// The contact centre's shared core.
//
// Three questions, answered in one place so the list, the person panel and
// the daily digest can never disagree:
//
//   1. Who is each person right now?   state, score, the evidence behind the
//      score, and the action worth taking (unchanged from v1, moved here).
//   2. Who needs the owner today?      the queue: a short list of people with a
//      time-sensitive reason, minus anyone already handled, snoozed or done.
//   3. What happened after each email the owner sent by hand?   the threads:
//      opened, clicked, came to pricing, opened checkout, bought, replied.
//
// WHY THE QUEUE IS SMALL ON PURPOSE. There are hundreds of cooling and dormant
// accounts. A queue that holds them all is a second copy of the list, and a
// list nobody can finish is a list nobody opens. The queue holds only reasons
// that go stale within days (a checkout, a wall, a cancellation, a follow-up
// due); everything slower lives in the All tab with its own filters.
//
// WHY "HANDLED" IS DECIDED BY TIME, NOT BY A FLAG. An email the owner sent
// clears a reason only if it went AFTER the event that raised it. A person who
// opens checkout again after being written to is back in the queue, which is
// exactly when they should be.
//
// Everything here is derived live from the activity tables. The only stored
// state is contact_actions: what the owner did (an email, a note, a snooze, a
// "done", a reply marked).

import proLessonsJson from "../_data/pro-lessons.json";
import { ensureIntentTable } from "../api/signal";

export const DAY = 86400;

export type State = "customer" | "hot" | "engaged" | "cooling" | "dormant" | "lost" | "new";

const TRACK_NAMES: Record<string, string> = {
  foundations: "New to R", analyst: "Data Analyst", ds: "Data Scientist", ts: "Forecaster",
  researcher: "Researcher", developer: "R Developer", mleng: "ML Engineer",
};
const PRO_LESSON_TRACK = proLessonsJson as Record<string, string>;

export function trackOfSlug(slug: string): { key: string; name: string } | null {
  const key = PRO_LESSON_TRACK[slug];
  return key && TRACK_NAMES[key] ? { key, name: TRACK_NAMES[key] } : null;
}

export function slugOfPath(path: string | null | undefined): string {
  return String(path || "").replace(/^\//, "").replace(/\.html?$/i, "").replace(/[?#].*$/, "");
}

/* Where a click went, without the query string: signed lesson links carry
   the reader's id and a token, and utm tags are noise in an admin table. */
export function pathOnly(u: string | null): string | null {
  if (!u) return null;
  try { return new URL(u).pathname; } catch { return String(u).split("?")[0]; }
}

export function planLabel(plan: string | null | undefined): string {
  const p = String(plan || "");
  if (p === "lifetime") return "Lifetime";
  if (p === "teams") return "Teams";
  const tier = p.startsWith("single") ? "Single Track" : p.startsWith("allaccess") || p.startsWith("pro") ? "All-Access" : p;
  const term = /month/.test(p) ? "monthly" : /year|annual/.test(p) ? "yearly" : "";
  return term ? `${tier}, ${term}` : tier || "Pro";
}

/* ------------------------------------------------------------ the tables */

let actionsReady = false;
/* contact_actions is the one table this feature owns. Created on first use,
   the same pattern as intent_signals, so a deploy needs no migration step.
   The email_events key index makes "what happened to this email" one range
   scan instead of a walk of every event ever written. */
export async function ensureContactTables(DB: D1Database): Promise<void> {
  if (actionsReady) return;
  await ensureIntentTable(DB);
  await DB.prepare(
    "CREATE TABLE IF NOT EXISTS contact_actions (" +
    "id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL, kind TEXT NOT NULL, " +
    "ref INTEGER, template TEXT, email_key TEXT, subject TEXT, body TEXT, " +
    "until_at INTEGER, reason TEXT, at INTEGER NOT NULL, actor TEXT)",
  ).run();
  await DB.prepare("CREATE INDEX IF NOT EXISTS idx_contact_actions_user ON contact_actions (user_id, at)").run();
  await DB.prepare("CREATE INDEX IF NOT EXISTS idx_email_events_key ON email_events (email_key, at)").run();
  actionsReady = true;
}

export interface Action {
  id: number; user_id: string; kind: string; ref: number | null; template: string | null;
  email_key: string | null; subject: string | null; body: string | null;
  until_at: number | null; reason: string | null; at: number; actor: string | null;
}

/* ------------------------------------------------------------ aggregates */

interface Agg {
  attempts: number; solved: number;
  reads: number; last_read: number;
  last_xp: number;
  sent: number; last_sent: number;
  opens: number; clicks: number;
  saved: number; alerts: number;
  pricing: number; wall: number; signin_wall: number;
  checkout_start: number; checkout_lead: number; parity: number;
  last_intent: number;
  last_checkout: number; last_wall: number; wall_path: string; wall_meta: string;
  pricing14: number; pricing_days14: number; last_pricing: number;
  recovery: number; last_recovery: number;
  lessons_done: number; last_lesson: number;
}

function blank(): Agg {
  return {
    attempts: 0, solved: 0, reads: 0, last_read: 0, last_xp: 0,
    sent: 0, last_sent: 0, opens: 0, clicks: 0, saved: 0, alerts: 0,
    pricing: 0, wall: 0, signin_wall: 0, checkout_start: 0, checkout_lead: 0,
    parity: 0, last_intent: 0,
    last_checkout: 0, last_wall: 0, wall_path: "", wall_meta: "",
    pricing14: 0, pricing_days14: 0, last_pricing: 0,
    recovery: 0, last_recovery: 0, lessons_done: 0, last_lesson: 0,
  };
}

/* Score components, each capped so no single signal can dominate a row.
 *
 * The weights are ordered by how close the action sits to a purchase decision,
 * which is a judgement, not a fitted model: a checkout that was opened and
 * abandoned is the strongest signal a free user can emit, and time on the site
 * is the weakest. They are deliberately round numbers so that changing one is
 * obviously a policy decision rather than a tuned parameter. */
interface Part { label: string; points: number }

function components(a: Agg, xp: number, streak: number): Part[] {
  const cap = (v: number, max: number) => Math.min(v, max);
  return [
    { label: "opened checkout", points: cap(a.checkout_start * 30, 60) },
    { label: "left email at checkout", points: cap(a.checkout_lead * 25, 25) },
    { label: "hit the Pro wall", points: cap(a.wall * 12, 48) },
    { label: "set a price alert", points: cap(a.alerts * 20, 20) },
    { label: "viewed pricing", points: cap(a.pricing * 6, 30) },
    { label: "saw parity pricing", points: cap(a.parity * 4, 12) },
    { label: "solved exercises", points: cap(a.solved * 1.5, 30) },
    { label: "clicked an email", points: cap(a.clicks * 5, 25) },
    { label: "read lessons", points: cap(a.reads * 1, 20) },
    { label: "opened emails", points: cap(a.opens * 2, 20) },
    { label: "earned XP", points: cap(xp / 100, 15) },
    { label: "kept a streak", points: cap(streak * 2, 20) },
    { label: "saved a page", points: cap(a.saved * 2, 10) },
  ].filter((p) => p.points > 0);
}

/* Recency decay. A wall hit last week and a wall hit last year are not the same
 * fact, and a list sorted without decay silently ranks history above intent. */
function decay(lastAt: number, now: number): number {
  if (!lastAt) return 0.1;
  const age = now - lastAt;
  if (age < 7 * DAY) return 1;
  if (age < 30 * DAY) return 0.6;
  if (age < 90 * DAY) return 0.3;
  return 0.1;
}

function stateOf(a: Agg, isCustomer: boolean, createdAt: number, lastAny: number, now: number): State {
  if (isCustomer) return "customer";
  if (a.pricing + a.wall + a.checkout_start > 0 && now - a.last_intent < 7 * DAY) return "hot";
  if (lastAny && now - lastAny < 7 * DAY) return "engaged";
  if (lastAny && now - lastAny < 30 * DAY) return "cooling";
  if (lastAny && now - lastAny < 90 * DAY) return "dormant";
  if (!lastAny && now - createdAt < 7 * DAY) return "new";
  return "lost";
}

/* The next action, for the All tab. The queue below is stricter: this column
   says what suits the person in general, the queue says who needs you today. */
function nextAction(s: State, a: Agg): { do: string; why: string; template: string } {
  if (s === "customer") {
    return a.solved >= 10 || a.reads >= 10
      ? { do: "Ask for a review", why: "a customer who is actually using it", template: "review" }
      : { do: "Check they got started", why: "paid but little activity, churn risk", template: "get-started" };
  }
  if (a.checkout_start > 0) return { do: "Help with checkout", why: "opened checkout and did not finish", template: "checkout-help" };
  if (s === "hot" && a.wall > 0) return { do: "Ask about their goal", why: "reached the paid part of a track recently", template: "wall-goal" };
  if (s === "hot") return { do: "Help them pick a plan", why: "looking at the plans", template: "plan-help" };
  if (s === "engaged" && a.pricing === 0) return { do: "Nothing, keep teaching", why: "learning well, no buying signal yet", template: "probe" };
  if (s === "engaged") return { do: "Nothing yet", why: "active and already saw pricing", template: "plan-help" };
  if (s === "cooling") return { do: "Ask what stopped them", why: "went quiet in the last month", template: "probe" };
  if (s === "dormant") return { do: "Welcome them back", why: "quiet 1 to 3 months, has a record worth quoting", template: "welcome-back" };
  if (s === "new") return { do: "Let onboarding run", why: "signed up this week", template: "probe" };
  return { do: "Leave dormant", why: "no activity for over 90 days", template: "welcome-back" };
}

export interface SubInfo {
  first: number;             // first purchase, unix
  plan: string; status: string; cancel: boolean;
  period_end: number | null; updated_at: number;
}

export interface ContactRow {
  id: string; email: string; name: string | null; country: string | null;
  created_at: number; pro_until: number | null;
  signup_gate: string | null; signup_slug: string | null;
  persona: string | null; job_role: string | null;
  email_status: string | null; opted_out: boolean;
  consents: { progress: number; nurture: number; offers: number };
  state: State; score: number; why: string[];
  last_seen: number | null; xp: number; streak: number;
  lessons: number; lessons_done: number; solved: number; attempts: number;
  wall: number; pricing: number; checkout: number;
  emails_sent: number; opens: number; clicks: number;
  alerts: number; saved: number;
  purchased_at: number | null;
  plan: string | null;            // human label, customers only
  action: string; action_why: string; action_template: string;
  last_contacted: number | null; contacted: number;
  queue: string | null;           // the queue reason, when the person is in it
}

export interface Loaded {
  now: number;
  rows: ContactRow[];
  byId: Map<string, ContactRow>;
  agg: Map<string, Agg>;
  subs: Map<string, SubInfo>;
  actions: Action[];
}

/* Ten grouped queries scan the activity tables once each (about 40k rows at
   1,200 users). A per-user loop would be thousands of queries. */
export async function loadContacts(DB: D1Database, now = Math.floor(Date.now() / 1000)): Promise<Loaded> {
  await ensureContactTables(DB);
  const since14 = now - 14 * DAY;

  const [users, ex, rd, xpr, sig, se, ev, subs, sav, al, p14, wall, done, acts] = await Promise.all([
    DB.prepare(
      "SELECT id, email, display_name, country, created_at, pro_until, total_xp, " +
      "current_streak_days, signup_gate, signup_slug, email_status, " +
      "email_progress, email_nurture, email_offers, persona, job_role " +
      "FROM users WHERE deleted_at IS NULL",
    ).all<Record<string, unknown>>(),
    DB.prepare(
      "SELECT user_id, COUNT(*) n, " +
      "COUNT(DISTINCT CASE WHEN passed = 1 THEN hub_slug || '|' || exercise_id END) solved " +
      "FROM exercise_attempts GROUP BY user_id",
    ).all<{ user_id: string; n: number; solved: number }>(),
    DB.prepare("SELECT user_id, COUNT(*) n, MAX(read_at) last FROM reading_progress GROUP BY user_id")
      .all<{ user_id: string; n: number; last: number }>(),
    DB.prepare("SELECT user_id, MAX(at) last FROM xp_ledger GROUP BY user_id")
      .all<{ user_id: string; last: number }>(),
    DB.prepare(
      "SELECT user_id, signal, COUNT(*) n, MAX(at) last FROM intent_signals " +
      // A recovery row marked skipped:purchased records that no email went.
      "WHERE user_id IS NOT NULL AND NOT (signal LIKE 'recovery%' AND path = 'skipped:purchased') GROUP BY user_id, signal",
    ).all<{ user_id: string; signal: string; n: number; last: number }>(),
    DB.prepare("SELECT user_id, COUNT(*) n, MAX(sent_at) last FROM sent_emails GROUP BY user_id")
      .all<{ user_id: string; n: number; last: number }>(),
    // The column is `event`, not `type`.
    DB.prepare(
      "SELECT user_id, event, COUNT(*) n FROM email_events " +
      "WHERE event IN ('open','click') AND user_id IS NOT NULL GROUP BY user_id, event",
    ).all<{ user_id: string; event: string; n: number }>(),
    DB.prepare(
      "SELECT user_id, plan, status, cancel_at_period_end, current_period_end, created_at, updated_at " +
      "FROM subscriptions ORDER BY created_at",
    ).all<{ user_id: string; plan: string; status: string; cancel_at_period_end: number; current_period_end: number | null; created_at: number; updated_at: number }>(),
    DB.prepare("SELECT user_id, COUNT(*) n FROM saved_posts GROUP BY user_id")
      .all<{ user_id: string; n: number }>(),
    DB.prepare("SELECT user_id, COUNT(*) n FROM price_alerts WHERE user_id IS NOT NULL GROUP BY user_id")
      .all<{ user_id: string; n: number }>(),
    // Plans visited on two different days in a fortnight is a decision being
    // made; one visit is curiosity.
    DB.prepare(
      "SELECT user_id, COUNT(*) n, COUNT(DISTINCT at / 86400) days, MAX(at) last FROM intent_signals " +
      "WHERE signal = 'pricing_view' AND user_id IS NOT NULL AND at >= ?1 GROUP BY user_id",
    ).bind(since14).all<{ user_id: string; n: number; days: number; last: number }>(),
    // SQLite returns the bare columns from the row that holds MAX(at).
    DB.prepare(
      "SELECT user_id, path, meta, MAX(at) at FROM intent_signals " +
      "WHERE signal = 'pro_wall_hit' AND user_id IS NOT NULL GROUP BY user_id",
    ).all<{ user_id: string; path: string; meta: string | null; at: number }>(),
    DB.prepare(
      "SELECT user_id, COUNT(DISTINCT path) n, MAX(at) last FROM intent_signals " +
      "WHERE signal = 'lesson_complete' AND user_id IS NOT NULL GROUP BY user_id",
    ).all<{ user_id: string; n: number; last: number }>(),
    DB.prepare("SELECT * FROM contact_actions ORDER BY at").all<Action>(),
  ]);

  const A = new Map<string, Agg>();
  const get = (id: string) => {
    let a = A.get(id);
    if (!a) { a = blank(); A.set(id, a); }
    return a;
  };
  for (const r of ex.results ?? []) { const a = get(r.user_id); a.attempts = r.n; a.solved = r.solved; }
  for (const r of rd.results ?? []) { const a = get(r.user_id); a.reads = r.n; a.last_read = r.last || 0; }
  for (const r of xpr.results ?? []) { get(r.user_id).last_xp = r.last || 0; }
  for (const r of se.results ?? []) { const a = get(r.user_id); a.sent = r.n; a.last_sent = r.last || 0; }
  for (const r of sav.results ?? []) { get(r.user_id).saved = r.n; }
  for (const r of al.results ?? []) { get(r.user_id).alerts = r.n; }
  for (const r of done.results ?? []) { const a = get(r.user_id); a.lessons_done = r.n; a.last_lesson = r.last || 0; }
  for (const r of p14.results ?? []) { const a = get(r.user_id); a.pricing14 = r.n; a.pricing_days14 = r.days; }
  for (const r of wall.results ?? []) {
    const a = get(r.user_id); a.wall_path = r.path || ""; a.wall_meta = r.meta || "";
  }
  for (const r of ev.results ?? []) {
    const a = get(r.user_id);
    if (r.event === "open") a.opens = r.n;
    else if (r.event === "click") a.clicks = r.n;
  }
  for (const r of sig.results ?? []) {
    const a = get(r.user_id);
    if (r.signal === "pricing_view") { a.pricing = r.n; a.last_pricing = r.last; }
    else if (r.signal === "pro_wall_hit") { a.wall = r.n; a.last_wall = r.last; }
    else if (r.signal === "signin_wall_hit") a.signin_wall = r.n;
    else if (r.signal === "checkout_start") { a.checkout_start = r.n; a.last_checkout = r.last; }
    else if (r.signal === "checkout_lead") a.checkout_lead = r.n;
    else if (r.signal === "parity_view") a.parity = r.n;
    else if (r.signal === "recovery_sent" || r.signal === "recovery2_sent") {
      a.recovery += r.n; a.last_recovery = Math.max(a.last_recovery, r.last);
    }
    // last_intent tracks only signals that indicate BUYING interest, so a
    // lesson-completion beacon cannot make someone look hot.
    if (["pricing_view", "pro_wall_hit", "checkout_start", "checkout_lead", "parity_view"].includes(r.signal)) {
      a.last_intent = Math.max(a.last_intent, r.last);
    }
  }

  const S = new Map<string, SubInfo>();
  for (const r of subs.results ?? []) {
    const prev = S.get(r.user_id);
    S.set(r.user_id, {
      first: prev ? prev.first : Number(r.created_at || 0),
      plan: r.plan, status: r.status, cancel: Number(r.cancel_at_period_end || 0) === 1,
      period_end: r.current_period_end ?? null,
      updated_at: Number(r.updated_at || r.created_at || 0),
    });
  }

  const actions = (acts.results ?? []) as Action[];
  const lastOut = new Map<string, { at: number; n: number }>();
  for (const x of actions) {
    if (x.kind !== "outreach") continue;
    const p = lastOut.get(x.user_id);
    lastOut.set(x.user_id, { at: Math.max(p?.at || 0, x.at), n: (p?.n || 0) + 1 });
  }

  const rows: ContactRow[] = (users.results ?? []).map((raw) => {
    const id = String(raw.id);
    const a = A.get(id) ?? blank();
    const xp = Number(raw.total_xp || 0);
    const streak = Number(raw.current_streak_days || 0);
    const proUntil = raw.pro_until === null || raw.pro_until === undefined ? null : Number(raw.pro_until);
    const isCustomer = proUntil === -1 || (!!proUntil && proUntil > now);
    const createdAt = Number(raw.created_at || 0);
    const lastAny = Math.max(a.last_read, a.last_xp, a.last_intent, a.last_lesson);
    const state = stateOf(a, isCustomer, createdAt, lastAny, now);
    const parts = components(a, xp, streak).sort((p, q) => q.points - p.points);
    const rawScore = parts.reduce((s, p) => s + p.points, 0);
    const score = Math.round(rawScore * decay(Math.max(lastAny, a.last_sent), now));
    const act = nextAction(state, a);
    const sub = S.get(id);
    const lo = lastOut.get(id);
    return {
      id, email: String(raw.email || ""), name: (raw.display_name as string) || null,
      country: (raw.country as string) || null,
      created_at: createdAt, pro_until: proUntil,
      signup_gate: (raw.signup_gate as string) || null,
      signup_slug: (raw.signup_slug as string) || null,
      persona: (raw.persona as string) || null,
      job_role: (raw.job_role as string) || null,
      email_status: (raw.email_status as string) || null,
      opted_out: Number(raw.email_progress ?? 1) === 0,
      consents: {
        progress: Number(raw.email_progress ?? 1),
        nurture: Number(raw.email_nurture ?? 0),
        offers: Number(raw.email_offers ?? 0),
      },
      state, score,
      // The three components that produced the score, so the number is auditable.
      why: parts.slice(0, 3).map((p) => `${p.label} (${Math.round(p.points)})`),
      last_seen: lastAny || null,
      xp, streak,
      lessons: a.reads, lessons_done: a.lessons_done, solved: a.solved, attempts: a.attempts,
      wall: a.wall, pricing: a.pricing, checkout: a.checkout_start,
      emails_sent: a.sent, opens: a.opens, clicks: a.clicks,
      alerts: a.alerts, saved: a.saved,
      purchased_at: sub ? sub.first : null,
      plan: isCustomer ? (sub ? planLabel(sub.plan) : proUntil === -1 ? "Lifetime" : "Pro") : null,
      action: act.do, action_why: act.why, action_template: act.template,
      last_contacted: lo ? lo.at : null, contacted: lo ? lo.n : 0,
      queue: null,
    };
  });

  return { now, rows, byId: new Map(rows.map((r) => [r.id, r])), agg: A, subs: S, actions };
}

/* ------------------------------------------------------------ threads */

export interface Thread {
  id: number; user_id: string; email: string; name: string | null;
  template: string; subject: string; key: string; sent_at: number;
  follows: number | null;        // the thread this one follows up
  followed_by: number | null;    // a later follow-up to this one
  opened_at: number | null; clicked_at: number | null; click_dest: string | null;
  pricing_at: number | null; checkout_at: number | null; purchased_at: number | null;
  replied_at: number | null; unsubscribed_at: number | null; bounced_at: number | null;
  status: "bought" | "replied" | "checkout" | "clicked" | "opened" | "sent" | "bounced" | "unsubscribed";
  next: "won" | "replied" | "follow_up" | "wait" | "no_response" | "closed";
  next_why: string;
}

const AFTER_WINDOW = 14 * DAY;     // pricing and checkout count for two weeks after a send
const BUY_WINDOW = 30 * DAY;       // a purchase counts for a month

export async function loadThreads(DB: D1Database, L: Loaded): Promise<Thread[]> {
  const outs = L.actions.filter((a) => a.kind === "outreach" && a.email_key);
  if (!outs.length) return [];
  const users = [...new Set(outs.map((o) => o.user_id))];
  const minAt = Math.min(...outs.map((o) => o.at));
  const ids = JSON.stringify(users);

  const [evs, sigs] = await Promise.all([
    DB.prepare(
      "SELECT email_key, user_id, event, MIN(at) at, meta FROM email_events " +
      "WHERE email_key LIKE 'outreach:%' AND event IN ('open','click','bounce','soft_bounce') GROUP BY email_key, event",
    ).all<{ email_key: string; user_id: string; event: string; at: number; meta: string | null }>(),
    DB.prepare(
      "SELECT user_id, signal, at FROM intent_signals " +
      "WHERE signal IN ('pricing_view','checkout_start') AND at >= ?1 " +
      "AND user_id IN (SELECT value FROM json_each(?2)) ORDER BY at",
    ).bind(minAt, ids).all<{ user_id: string; signal: string; at: number }>(),
  ]);
  const unsubs = await DB.prepare(
    "SELECT user_id, MIN(at) at FROM email_events WHERE event = 'unsubscribe' AND at >= ?1 " +
    "AND user_id IN (SELECT value FROM json_each(?2)) GROUP BY user_id",
  ).bind(minAt, ids).all<{ user_id: string; at: number }>();

  const E = new Map<string, Map<string, { at: number; meta: string | null }>>();
  for (const r of evs.results ?? []) {
    let m = E.get(r.email_key);
    if (!m) { m = new Map(); E.set(r.email_key, m); }
    m.set(r.event, { at: r.at, meta: r.meta });
  }
  const sigBy = new Map<string, { signal: string; at: number }[]>();
  for (const r of sigs.results ?? []) {
    const l = sigBy.get(r.user_id) ?? [];
    l.push(r); sigBy.set(r.user_id, l);
  }
  const unsubBy = new Map((unsubs.results ?? []).map((r) => [r.user_id, r.at]));
  const replied = new Map<number, number>();
  for (const a of L.actions) if (a.kind === "replied" && a.ref) replied.set(a.ref, a.at);
  const followedBy = new Map<number, number>();
  for (const o of outs) if (o.ref) followedBy.set(o.ref, o.id);

  const now = L.now;
  return outs.map((o) => {
    const row = L.byId.get(o.user_id);
    const e = E.get(o.email_key as string) ?? new Map();
    const s = (sigBy.get(o.user_id) ?? []).filter((x) => x.at >= o.at && x.at < o.at + AFTER_WINDOW);
    const sub = L.subs.get(o.user_id);
    // A first purchase within a month of this email. "After", not "because of":
    // the panel says so, since twelve purchases cannot carry a causal claim.
    const bought = sub && sub.first >= o.at && sub.first <= o.at + BUY_WINDOW ? sub.first : null;
    const t: Thread = {
      id: o.id, user_id: o.user_id, email: row?.email || "", name: row?.name || null,
      template: o.template || "", subject: o.subject || "", key: o.email_key as string, sent_at: o.at,
      follows: o.ref ?? null, followed_by: followedBy.get(o.id) ?? null,
      opened_at: e.get("open")?.at ?? null,
      clicked_at: e.get("click")?.at ?? null,
      click_dest: pathOnly(e.get("click")?.meta ?? null),
      pricing_at: s.find((x) => x.signal === "pricing_view")?.at ?? null,
      checkout_at: s.find((x) => x.signal === "checkout_start")?.at ?? null,
      purchased_at: bought,
      replied_at: replied.get(o.id) ?? null,
      unsubscribed_at: (unsubBy.get(o.user_id) ?? 0) >= o.at ? unsubBy.get(o.user_id)! : null,
      bounced_at: e.get("bounce")?.at ?? e.get("soft_bounce")?.at ?? null,
      status: "sent", next: "wait", next_why: "",
    };
    // A click implies the email was seen, even when images were blocked.
    if (t.clicked_at && !t.opened_at) t.opened_at = t.clicked_at;
    t.status = t.purchased_at ? "bought" : t.replied_at ? "replied" : t.bounced_at ? "bounced"
      : t.unsubscribed_at ? "unsubscribed" : t.checkout_at ? "checkout" : t.clicked_at ? "clicked"
      : t.opened_at ? "opened" : "sent";
    const age = now - o.at;
    const isFollowUp = !!o.ref;
    if (t.status === "bought") { t.next = "won"; t.next_why = "bought after this email"; }
    else if (t.status === "replied") { t.next = "replied"; t.next_why = "replied, carry on in your inbox"; }
    else if (t.status === "bounced" || t.status === "unsubscribed") { t.next = "closed"; t.next_why = t.status === "bounced" ? "the address bounced" : "they unsubscribed"; }
    else if (row?.state === "customer") { t.next = "closed"; t.next_why = "already a customer"; }
    else if (t.followed_by) { t.next = "closed"; t.next_why = "followed up"; }
    else if (isFollowUp) {
      t.next = age > 7 * DAY ? "no_response" : "wait";
      t.next_why = age > 7 * DAY ? "no reply to the follow-up, leave it" : "follow-up sent, give it a week";
    } else if ((t.status === "checkout" || t.status === "clicked") && age >= 2 * DAY && age < 21 * DAY) {
      t.next = "follow_up"; t.next_why = t.status === "checkout" ? "opened checkout after your email" : "clicked, did not buy";
    } else if (age >= 4 * DAY && age < 21 * DAY) {
      t.next = "follow_up"; t.next_why = t.status === "opened" ? "opened, no reply" : "no reaction yet";
    } else if (age >= 21 * DAY) {
      t.next = "no_response"; t.next_why = "three weeks without a reply";
    } else {
      t.next = "wait"; t.next_why = age < DAY ? "sent today" : "give it a few days";
    }
    return t;
  }).sort((x, y) => y.sent_at - x.sent_at);
}

/* ------------------------------------------------------------ the queue */

export type Reason = "billing" | "checkout" | "followup" | "save" | "wall" | "upgrade" | "plans" | "start" | "review";

export const REASON_LABEL: Record<Reason, string> = {
  billing: "Payment failing",
  checkout: "Opened checkout, did not finish",
  followup: "Follow-up due on your email",
  save: "Plan set to cancel",
  wall: "Reached the paid part of a track",
  upgrade: "Single Track member reaching other tracks",
  plans: "Came back to the plans",
  start: "Paid, has not started",
  review: "Happy customer, ask for a review",
};

export interface QueueItem {
  user_id: string; email: string; name: string | null;
  reason: Reason; label: string; detail: string;
  since: number; priority: number; template: string; ref: number | null;
  state: State; score: number; automation: string[];
}

function ago(sec: number, now: number): string {
  const d = Math.max(0, now - sec);
  if (d < 3600) return `${Math.max(1, Math.floor(d / 60))} min ago`;
  if (d < DAY) return `${Math.floor(d / 3600)}h ago`;
  const n = Math.floor(d / DAY);
  return n === 1 ? "yesterday" : `${n} days ago`;
}

/* Human names for the automatic emails, so "what has the system already said"
   reads as English in the queue. Daily lessons are deliberately left out:
   they are teaching, not selling, and every active reader gets one a day. */
export function autoLabel(key: string): string | null {
  if (!key || key.startsWith("seq:") || key.startsWith("outreach:") || key === "digest") return null;
  if (key.startsWith("wall:")) return "Automatic wall note";
  if (key === "cart-recovery") return "Cart recovery note with a 15% code";
  if (key === "cart-recovery-2") return "Cart recovery reminder";
  if (key.startsWith("alert-")) return "Price-alert email (" + key.slice(6) + ")";
  if (key.startsWith("pass-")) return "Pass email (" + key.slice(5) + ")";
  if (key.startsWith("welcome")) return "Welcome email";
  if (key.startsWith("quiet")) return "Quiet-days check-in";
  if (key.startsWith("closed-shelf")) return "Closed-lessons note";
  if (key.startsWith("invite-series")) return "Daily-series invite";
  if (key === "cap") return "Monthly practice cap note";
  if (key === "flip") return "Announcement";
  return key;
}

export async function buildQueue(DB: D1Database, L: Loaded, threads: Thread[]): Promise<QueueItem[]> {
  const now = L.now;
  // What the owner already did, per person.
  const snoozedUntil = new Map<string, number>();
  const doneAt = new Map<string, Map<string, number>>();
  const lastOut = new Map<string, number>();
  const sentTemplates = new Map<string, Set<string>>();
  for (const a of L.actions) {
    if (a.kind === "snooze" && a.until_at) snoozedUntil.set(a.user_id, Math.max(snoozedUntil.get(a.user_id) || 0, a.until_at));
    if (a.kind === "reopen") { snoozedUntil.delete(a.user_id); doneAt.delete(a.user_id); }
    if (a.kind === "done") {
      const m = doneAt.get(a.user_id) ?? new Map<string, number>();
      m.set(a.reason || "*", a.at); doneAt.set(a.user_id, m);
    }
    if (a.kind === "outreach") {
      lastOut.set(a.user_id, Math.max(lastOut.get(a.user_id) || 0, a.at));
      const s = sentTemplates.get(a.user_id) ?? new Set<string>();
      s.add(a.template || ""); sentTemplates.set(a.user_id, s);
    }
  }

  // Customers who bought in the last month: did anything happen since?
  const recentBuyers = L.rows.filter((r) => r.state === "customer" && r.purchased_at && now - r.purchased_at < 30 * DAY);
  const activeSince = new Map<string, number>();
  if (recentBuyers.length) {
    const spec = JSON.stringify(recentBuyers.map((r) => ({ u: r.id, t: r.purchased_at })));
    const res = await DB.prepare(
      "WITH p AS (SELECT json_extract(value,'$.u') u, json_extract(value,'$.t') t FROM json_each(?1)) " +
      "SELECT p.u user_id, " +
      "(SELECT COUNT(*) FROM reading_progress r WHERE r.user_id = p.u AND r.read_at > p.t) + " +
      "(SELECT COUNT(*) FROM exercise_attempts e WHERE e.user_id = p.u AND e.submitted_at > p.t) + " +
      "(SELECT COUNT(*) FROM intent_signals s WHERE s.user_id = p.u AND s.signal = 'lesson_complete' AND s.at > p.t) n FROM p",
    ).bind(spec).all<{ user_id: string; n: number }>();
    for (const r of res.results ?? []) activeSince.set(r.user_id, r.n);
  }

  const followups = new Map<string, Thread>();
  for (const t of threads) if (t.next === "follow_up" && !followups.has(t.user_id)) followups.set(t.user_id, t);

  const items: QueueItem[] = [];
  for (const r of L.rows) {
    if (r.email_status === "bounced" || r.email_status === "complained") continue;
    if ((snoozedUntil.get(r.id) || 0) > now) continue;
    const a = L.agg.get(r.id) ?? blank();
    const sub = L.subs.get(r.id);
    const isCustomer = r.state === "customer";
    const handled = (since: number) => (lastOut.get(r.id) || 0) >= since;
    const dismissed = (reason: Reason, since: number) => {
      const m = doneAt.get(r.id);
      return !!m && ((m.get(reason) || 0) >= since || (m.get("*") || 0) >= since);
    };
    const cands: Omit<QueueItem, "user_id" | "email" | "name" | "state" | "score" | "automation" | "label">[] = [];

    if (sub && sub.status === "past_due") {
      cands.push({ reason: "billing", detail: `${planLabel(sub.plan)}, payment failing since ${ago(sub.updated_at, now)}`, since: sub.updated_at, priority: 0, template: "billing", ref: null });
    }
    if (!r.opted_out) {
      if (!isCustomer && a.last_checkout && now - a.last_checkout < 7 * DAY && !(r.purchased_at && r.purchased_at >= a.last_checkout)) {
        cands.push({ reason: "checkout", detail: `opened checkout ${ago(a.last_checkout, now)}`, since: a.last_checkout, priority: 1, template: "checkout-help", ref: null });
      }
      const f = followups.get(r.id);
      if (f && !isCustomer) {
        cands.push({ reason: "followup", detail: `${f.next_why}, your note went ${ago(f.sent_at, now)}`, since: f.sent_at + 1, priority: f.status === "clicked" || f.status === "checkout" ? 1 : 2, template: "follow-up", ref: f.id });
      }
      if (isCustomer && sub && sub.cancel && sub.status === "active") {
        const end = sub.period_end ? `ends ${fmtDay(sub.period_end)}` : "set to end";
        cands.push({ reason: "save", detail: `${planLabel(sub.plan)}, ${end}`, since: sub.updated_at, priority: 2, template: "stay", ref: null });
      }
      if (!isCustomer && a.last_wall && now - a.last_wall < 7 * DAY) {
        const title = (a.wall_meta.split("|")[1] || slugOfPath(a.wall_path).replace(/-/g, " ")).trim();
        cands.push({ reason: "wall", detail: `reached ${title} ${ago(a.last_wall, now)}`, since: a.last_wall, priority: 2, template: "wall-goal", ref: null });
      }
      if (isCustomer && sub && sub.plan.startsWith("single") && a.last_wall && a.last_wall > sub.first && now - a.last_wall < 14 * DAY) {
        const t = trackOfSlug(slugOfPath(a.wall_path));
        cands.push({ reason: "upgrade", detail: `reached ${t ? t.name : "another track"} ${ago(a.last_wall, now)}`, since: a.last_wall, priority: 3, template: "upgrade", ref: null });
      }
      if (!isCustomer && a.pricing_days14 >= 2 && !(a.last_checkout && now - a.last_checkout < 14 * DAY)) {
        cands.push({ reason: "plans", detail: `on the plans ${a.pricing14} times over ${a.pricing_days14} days, last ${ago(a.last_pricing, now)}`, since: a.last_pricing, priority: 3, template: "plan-help", ref: null });
      }
      if (isCustomer && r.purchased_at && now - r.purchased_at >= 3 * DAY && now - r.purchased_at < 30 * DAY && (activeSince.get(r.id) || 0) < 3) {
        cands.push({ reason: "start", detail: `bought ${ago(r.purchased_at, now)}, little use since`, since: r.purchased_at, priority: 3, template: "get-started", ref: null });
      }
      if (isCustomer && r.purchased_at && now - r.purchased_at >= 21 * DAY && r.lessons_done + r.solved >= 15 && !sentTemplates.get(r.id)?.has("review")) {
        cands.push({ reason: "review", detail: `${r.lessons_done} lessons, ${r.solved} exercises solved`, since: r.purchased_at + 21 * DAY, priority: 4, template: "review", ref: null });
      }
    }

    const open = cands
      .filter((c) => (c.reason === "followup" || !handled(c.since)) && !dismissed(c.reason, c.since))
      .sort((x, y) => x.priority - y.priority || y.since - x.since);
    if (!open.length) continue;
    const c = open[0];
    items.push({
      ...c, label: REASON_LABEL[c.reason], user_id: r.id, email: r.email, name: r.name,
      state: r.state, score: r.score, automation: [],
    });
    r.queue = c.reason;
  }

  /* What the system already said to each of them in the last fortnight, so the
     owner never writes "did something go wrong at checkout?" an hour after the
     machine did. Everything is in the email ledger; cart recovery sent before
     2026-10-18 (or to an address with no account) is only in intent_signals. */
  if (items.length) {
    const ids = JSON.stringify(items.map((i) => i.user_id));
    const since = now - 14 * DAY;
    const [sent, react] = await Promise.all([
      DB.prepare(
        "SELECT user_id, email_key, MIN(at) at FROM email_events WHERE event = 'sent' AND at >= ?1 " +
        "AND user_id IN (SELECT value FROM json_each(?2)) GROUP BY user_id, email_key ORDER BY at DESC",
      ).bind(since, ids).all<{ user_id: string; email_key: string; at: number }>(),
      DB.prepare(
        "SELECT user_id, email_key, event FROM email_events WHERE event IN ('open','click') AND at >= ?1 " +
        "AND user_id IN (SELECT value FROM json_each(?2)) GROUP BY user_id, email_key, event",
      ).bind(since, ids).all<{ user_id: string; email_key: string; event: string }>(),
    ]);
    const R = new Set((react.results ?? []).map((x) => `${x.user_id}|${x.email_key}|${x.event}`));
    const by = new Map(items.map((i) => [i.user_id, i]));
    const cartLogged = new Set((sent.results ?? []).filter((x) => x.email_key.startsWith("cart-recovery")).map((x) => x.user_id));
    for (const x of sent.results ?? []) {
      const it = by.get(x.user_id);
      const label = autoLabel(x.email_key);
      if (!it || !label || it.automation.length >= 3) continue;
      const clicked = R.has(`${x.user_id}|${x.email_key}|click`);
      const opened = clicked || R.has(`${x.user_id}|${x.email_key}|open`);
      it.automation.push(`${label}, ${ago(x.at, now)}${clicked ? ", clicked" : opened ? ", opened" : ", no reaction"}`);
    }
    for (const it of items) {
      const a = L.agg.get(it.user_id);
      if (a && a.last_recovery && now - a.last_recovery < 14 * DAY && it.automation.length < 4 && !cartLogged.has(it.user_id)) {
        it.automation.unshift(`Cart recovery note with a 15% code, ${ago(a.last_recovery, now)}`);
      }
    }
  }

  return items.sort((x, y) => x.priority - y.priority || y.since - x.since);
}

export function fmtDay(sec: number): string {
  return new Date(sec * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" });
}

/* ------------------------------------------------------------ insights */

export interface Insights {
  /** accounts with a recorded sign-up source; the door table is only as good as this */
  recorded: number; total: number;
  doors: Array<{ gate: string; users: number; active30: number; checkout: number; bought: number }>;
  slugs: Array<{ gate: string; slug: string; users: number; bought: number }>;
  stories: Array<{
    user_id: string; email: string; name: string | null; plan: string | null;
    bought_at: number; days_to_buy: number; door: string; door_slug: string | null;
    before: { lessons: number; pages: number; solved: number; pricing: number; wall: number; checkout: number; clicks: string[] };
    last_steps: Array<{ at: number; what: string }>;
  }>;
  outreach: Array<{ template: string; sent: number; opened: number; clicked: number; checkout: number; bought: number; replied: number }>;
}

const GATE_LABEL: Record<string, string> = {
  exercise: "Saved an exercise solve", lesson: "Signed up at a lesson", browsing: "Signed up while browsing",
  pricing: "Signed up on the way to the plans", optin: "Joined the daily lessons",
};
export function gateLabel(g: string | null): string {
  if (!g) return "Before sign-up sources were recorded";
  return GATE_LABEL[g] || g;
}

export async function buildInsights(DB: D1Database, L: Loaded, threads: Thread[]): Promise<Insights> {
  const now = L.now;
  const doors = new Map<string, { gate: string; users: number; active30: number; checkout: number; bought: number }>();
  const slugs = new Map<string, { gate: string; slug: string; users: number; bought: number }>();
  for (const r of L.rows) {
    const g = r.signup_gate || "";
    const d = doors.get(g) ?? { gate: g, users: 0, active30: 0, checkout: 0, bought: 0 };
    d.users++;
    if (r.last_seen && now - r.last_seen < 30 * DAY) d.active30++;
    if (r.checkout > 0) d.checkout++;
    if (r.purchased_at || r.state === "customer") d.bought++;
    doors.set(g, d);
    if (r.signup_slug) {
      const k = g + "|" + r.signup_slug;
      const s = slugs.get(k) ?? { gate: g, slug: r.signup_slug, users: 0, bought: 0 };
      s.users++;
      if (r.purchased_at || r.state === "customer") s.bought++;
      slugs.set(k, s);
    }
  }

  // Purchase stories: what each buyer did before buying.
  const buyers = L.rows.filter((r) => r.purchased_at);
  const stories: Insights["stories"] = [];
  if (buyers.length) {
    const spec = JSON.stringify(buyers.map((r) => ({ u: r.id, t: r.purchased_at })));
    const P = "WITH p AS (SELECT json_extract(value,'$.u') u, json_extract(value,'$.t') t FROM json_each(?1)) ";
    const [sig, ex, clk, steps, rd] = await Promise.all([
      DB.prepare(P + "SELECT s.user_id, s.signal, COUNT(*) n FROM intent_signals s JOIN p ON p.u = s.user_id AND s.at < p.t GROUP BY s.user_id, s.signal")
        .bind(spec).all<{ user_id: string; signal: string; n: number }>(),
      DB.prepare(P + "SELECT e.user_id, COUNT(DISTINCT CASE WHEN e.passed = 1 THEN e.hub_slug || '|' || e.exercise_id END) n FROM exercise_attempts e JOIN p ON p.u = e.user_id AND e.submitted_at < p.t GROUP BY e.user_id")
        .bind(spec).all<{ user_id: string; n: number }>(),
      DB.prepare(P + "SELECT e.user_id, e.email_key, MIN(e.at) at FROM email_events e JOIN p ON p.u = e.user_id AND e.at < p.t AND e.at > p.t - 30 * 86400 WHERE e.event = 'click' GROUP BY e.user_id, e.email_key")
        .bind(spec).all<{ user_id: string; email_key: string; at: number }>(),
      DB.prepare(P + "SELECT s.user_id, s.at, s.signal, s.path, s.meta FROM intent_signals s JOIN p ON p.u = s.user_id AND s.at < p.t AND s.at > p.t - 3 * 86400 ORDER BY s.at DESC")
        .bind(spec).all<{ user_id: string; at: number; signal: string; path: string | null; meta: string | null }>(),
      DB.prepare(P + "SELECT r.user_id, COUNT(*) n FROM reading_progress r JOIN p ON p.u = r.user_id AND r.read_at < p.t GROUP BY r.user_id")
        .bind(spec).all<{ user_id: string; n: number }>(),
    ]);
    const sigBy = new Map<string, Map<string, number>>();
    for (const x of sig.results ?? []) {
      const m = sigBy.get(x.user_id) ?? new Map(); m.set(x.signal, x.n); sigBy.set(x.user_id, m);
    }
    const exBy = new Map((ex.results ?? []).map((x) => [x.user_id, x.n]));
    const rdBy = new Map((rd.results ?? []).map((x) => [x.user_id, x.n]));
    const clkBy = new Map<string, string[]>();
    for (const x of clk.results ?? []) {
      const l = clkBy.get(x.user_id) ?? []; l.push(x.email_key); clkBy.set(x.user_id, l);
    }
    const stepBy = new Map<string, Array<{ at: number; what: string }>>();
    for (const x of steps.results ?? []) {
      const l = stepBy.get(x.user_id) ?? [];
      if (l.length >= 8) continue;
      const what = describeSignal(x.signal, x.path, x.meta);
      if (l.length && l[l.length - 1].what === what) continue; // "typed their email" five times is one step
      l.push({ at: x.at, what });
      stepBy.set(x.user_id, l);
    }
    for (const b of buyers) {
      const m = sigBy.get(b.id) ?? new Map<string, number>();
      stories.push({
        user_id: b.id, email: b.email, name: b.name, plan: b.plan,
        bought_at: b.purchased_at as number,
        days_to_buy: Math.max(0, Math.round(((b.purchased_at as number) - b.created_at) / DAY)),
        door: gateLabel(b.signup_gate), door_slug: b.signup_slug,
        before: {
          lessons: (m.get("lesson_complete") || 0), pages: rdBy.get(b.id) || 0, solved: exBy.get(b.id) || 0,
          pricing: m.get("pricing_view") || 0, wall: m.get("pro_wall_hit") || 0,
          checkout: m.get("checkout_start") || 0, clicks: clkBy.get(b.id) || [],
        },
        last_steps: stepBy.get(b.id) || [],
      });
    }
    stories.sort((x, y) => y.bought_at - x.bought_at);
  }

  const out = new Map<string, Insights["outreach"][0]>();
  for (const t of threads) {
    const o = out.get(t.template) ?? { template: t.template, sent: 0, opened: 0, clicked: 0, checkout: 0, bought: 0, replied: 0 };
    o.sent++;
    if (t.opened_at) o.opened++;
    if (t.clicked_at) o.clicked++;
    if (t.checkout_at) o.checkout++;
    if (t.purchased_at) o.bought++;
    if (t.replied_at) o.replied++;
    out.set(t.template, o);
  }

  return {
    recorded: L.rows.filter((r) => r.signup_gate).length, total: L.rows.length,
    doors: [...doors.values()].sort((x, y) => y.bought - x.bought || y.users - x.users),
    slugs: [...slugs.values()].sort((x, y) => y.bought - x.bought || y.users - x.users).slice(0, 15),
    stories,
    outreach: [...out.values()].sort((x, y) => y.sent - x.sent),
  };
}

/* One line of English per intent signal, shared by the timeline and the
   purchase stories. */
export function describeSignal(signal: string, path: string | null, meta: string | null): string {
  const page = slugOfPath(path) || "a page";
  const m = meta || "";
  switch (signal) {
    case "pricing_view": {
      let from = "";
      try { if (m.startsWith("http")) from = slugOfPath(new URL(m).pathname); } catch { /* not a URL */ }
      return from ? `Viewed the plans, coming from ${from}` : "Viewed the plans";
    }
    case "pro_wall_hit": return `Reached a Pro lesson: ${(m.split("|")[1] || page.replace(/-/g, " ")).trim()}`;
    case "parity_view": return "Saw the regional price";
    case "offer_view": return `Was shown an offer (${m || page})`;
    case "pricing_toggle": return `Switched the billing period on the plans${m ? ` (${m})` : ""}`;
    case "checkout_lead": return "Typed their email into checkout";
    // meta is a Paddle price id or a plan key; a price id means nothing to a reader.
    case "checkout_start": return `Opened checkout${m && !m.startsWith("pri_") ? ` (${m.replace(/_/g, " ")})` : ""}`;
    case "checkout_closed": return "Closed checkout without paying";
    case "purchase_client": return "Completed a payment";
    case "objection": return `Answered the pricing question: ${m || "?"}`;
    case "price_alert": return "Asked to hear about discounts";
    case "lesson_start": return `Started lesson ${page}`;
    case "lesson_complete": return `Finished lesson ${page}`;
    case "signin_wall_hit": return `Hit the sign-in wall on ${page}`;
    case "paywall_hit": return `Hit the paywall on ${page}`;
    case "cert_view": return "Looked at certificates";
    case "track_view": return `Looked at a track: ${page}`;
    case "recovery_sent": return path === "skipped:purchased" ? "Had already bought, so no cart recovery note went" : "Was sent the cart recovery note (15% code)";
    case "recovery2_sent": return path === "skipped:purchased" ? "Had already bought, so no cart recovery reminder went" : "Was sent the cart recovery reminder";
    case "recovery_code": return "A recovery code was created";
    default: return `${signal.replace(/_/g, " ")}${path ? ` on ${page}` : ""}`;
  }
}
