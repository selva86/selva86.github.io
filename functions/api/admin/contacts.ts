// GET /api/admin/contacts - the contact centre list. One row per user with a
// derived lifecycle state, a lead score, the evidence behind that score, and the
// action worth taking next.
//
//   ?sort=score|last_seen|xp|solved|lessons|wall|pricing|opens|created
//   ?dir=desc|asc         ?state=hot|engaged|cooling|dormant|lost|new|customer
//   ?q=<email substring>  ?limit=100 (max 500)  ?offset=0
//   ?format=json (default)
//
// WHY THIS SHAPE. The drill-down already exists (/api/admin/user-stats +
// /admin/user.html) and is good. What was missing is the list, the state, the
// score and the next action. So this endpoint deliberately does NOT reproduce a
// per-user timeline; it links to the one that exists.
//
// WHY EVERY ROW CARRIES ITS EVIDENCE. There are 12 purchases in the whole
// database. No scoring model can be validated against 12 outcomes, so a bare
// number would invite confidence the data cannot support. Each row therefore
// reports the three components that produced its score, and the UI shows them.
// The score is a way to sort a list, not a prediction.
//
// WHY AGGREGATE QUERIES, NOT PER-USER. 979 users. Ten grouped queries scan about
// 35k rows once; a per-user loop would be ~10,000 queries. The whole dataset is
// smaller than one page of most analytics products.
//
// EXCLUDED ON PURPOSE: badges, certificates and quiz attempts. All three have
// zero rows in production, so scoring on them would be scoring on nothing. The
// UI says so rather than showing three always-empty columns.

import type { Env, RequestData } from "../../_middleware";
import { json, err401, err403 } from "../../_lib/errors";
import { getUserById } from "../../_lib/db";
import { readCookie, verifyIdCookie, ID_COOKIE } from "../../_lib/idcookie";
import { ensureIntentTable } from "../signal";

const DEFAULT_ADMIN = "selva86@gmail.com";

/* Constant-time compare, same as /api/admin/email-plan. A length-varying or
   short-circuiting compare on a shared secret is a timing oracle. */
function timingSafeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let x = 0;
  for (let i = 0; i < a.length; i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return x === 0;
}
const DAY = 86400;

type State = "customer" | "hot" | "engaged" | "cooling" | "dormant" | "lost" | "new";

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
  purchased_at: number;
}

function blank(): Agg {
  return {
    attempts: 0, solved: 0, reads: 0, last_read: 0, last_xp: 0,
    sent: 0, last_sent: 0, opens: 0, clicks: 0, saved: 0, alerts: 0,
    pricing: 0, wall: 0, signin_wall: 0, checkout_start: 0, checkout_lead: 0,
    parity: 0, last_intent: 0, purchased_at: 0,
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

function stateOf(a: Agg, proUntil: number | null, createdAt: number, lastAny: number, now: number): State {
  if (proUntil === -1 || (proUntil && proUntil > now)) return "customer";
  const intentRecent = Math.max(a.last_intent, 0);
  if (a.pricing + a.wall + a.checkout_start > 0 && now - intentRecent < 7 * DAY) return "hot";
  if (lastAny && now - lastAny < 7 * DAY) return "engaged";
  if (lastAny && now - lastAny < 30 * DAY) return "cooling";
  if (lastAny && now - lastAny < 90 * DAY) return "dormant";
  if (!lastAny && now - createdAt < 7 * DAY) return "new";
  return "lost";
}

/* The next action. Every one of these maps to a sender that ALREADY exists, so
 * this is a recommendation the owner can act on today rather than a roadmap. */
function nextAction(s: State, a: Agg): { do: string; why: string } {
  if (s === "customer") {
    return a.solved >= 10 || a.reads >= 10
      ? { do: "Ask for a review", why: "a customer who is actually using it" }
      : { do: "Check they got started", why: "paid but little activity, churn risk" };
  }
  if (a.checkout_start > 0) return { do: "Cart recovery", why: "opened checkout and did not finish" };
  if (s === "hot" && a.wall > 0) return { do: "Send the wall email", why: "hit the Pro wall recently" };
  if (s === "hot") return { do: "Leave alone for now", why: "looking at pricing, let them look" };
  if (s === "engaged" && a.pricing === 0) return { do: "Nothing, keep teaching", why: "learning well, no buying signal yet" };
  if (s === "engaged") return { do: "Nothing yet", why: "active and already saw pricing" };
  if (s === "cooling") return { do: "Quiet-five-days probe", why: "went quiet in the last month" };
  if (s === "dormant") return { do: "Reactivate with their own history", why: "quiet 1 to 3 months, has a record worth quoting" };
  if (s === "new") return { do: "Let onboarding run", why: "signed up this week" };
  return { do: "Leave dormant", why: "no activity for over 90 days" };
}

export const onRequestGet: PagesFunction<Env & { CRON_SECRET?: string }, string, RequestData> = async (context) => {
  /* Same rsc-id cookie fallback as /api/admin/digest. /api/* resolves
     context.data.user from a bearer only, so without this an admin typing the
     URL into a browser gets a 401 while signed in. */
  let u = context.data.user;
  if (!u) {
    const secret = (context.env as { EDGE_ID_SECRET?: string }).EDGE_ID_SECRET || "";
    const sub = secret ? await verifyIdCookie(secret, readCookie(context.request, ID_COOKIE)) : null;
    if (sub) u = await getUserById(context.env.DB, sub).catch(() => null);
  }
  /* OR the CRON_SECRET bearer, as /api/admin/email-plan accepts. This is a
     READ-ONLY endpoint, and the secret already grants the ability to run the
     email brain, so it is not a widening of trust. It exists so the list can be
     verified and later automated (the digest could carry a "who needs attention"
     block) without a browser session. */
  const auth = context.request.headers.get("Authorization") || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const isCron = !!context.env.CRON_SECRET && timingSafeEq(bearer, context.env.CRON_SECRET);
  const admin = (context.env as { ADMIN_EMAIL?: string }).ADMIN_EMAIL || DEFAULT_ADMIN;
  const isAdmin = !!u && (u.email || "").toLowerCase() === admin.toLowerCase();
  if (!isAdmin && !isCron) return u ? err403("Admins only") : err401();

  await ensureIntentTable(context.env.DB);
  const url = new URL(context.request.url);
  const sort = url.searchParams.get("sort") || "score";
  const dir = url.searchParams.get("dir") === "asc" ? 1 : -1;
  const stateFilter = (url.searchParams.get("state") || "").toLowerCase();
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();
  const limit = Math.min(500, Math.max(10, parseInt(url.searchParams.get("limit") || "100", 10)));
  const offset = Math.max(0, parseInt(url.searchParams.get("offset") || "0", 10));
  const now = Math.floor(Date.now() / 1000);
  const DB = context.env.DB;

  const [users, ex, rd, xpr, sig, se, ev, sub, sav, al] = await Promise.all([
    DB.prepare(
      "SELECT id, email, display_name, country, created_at, pro_until, total_xp, " +
      "current_streak_days, last_active_date, signup_gate, signup_slug " +
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
      "WHERE user_id IS NOT NULL GROUP BY user_id, signal",
    ).all<{ user_id: string; signal: string; n: number; last: number }>(),
    DB.prepare("SELECT user_id, COUNT(*) n, MAX(sent_at) last FROM sent_emails GROUP BY user_id")
      .all<{ user_id: string; n: number; last: number }>(),
    // The column is `event`, not `type`, and the values that matter here are
    // `open` and `click` (the rest are sent/delivered/error/vote bookkeeping).
    DB.prepare(
      "SELECT user_id, event, COUNT(*) n FROM email_events " +
      "WHERE event IN ('open','click') AND user_id IS NOT NULL GROUP BY user_id, event",
    ).all<{ user_id: string; event: string; n: number }>(),
    DB.prepare("SELECT user_id, MIN(created_at) first FROM subscriptions GROUP BY user_id")
      .all<{ user_id: string; first: number }>(),
    DB.prepare("SELECT user_id, COUNT(*) n FROM saved_posts GROUP BY user_id")
      .all<{ user_id: string; n: number }>(),
    DB.prepare("SELECT user_id, COUNT(*) n FROM price_alerts GROUP BY user_id")
      .all<{ user_id: string; n: number }>(),
  ]);

  const A = new Map<string, Agg>();
  const get = (id: string) => {
    let a = A.get(id);
    if (!a) { a = blank(); A.set(id, a); }
    return a;
  };
  for (const r of ex.results ?? []) { const a = get(r.user_id); a.attempts = r.n; a.solved = r.solved; }
  for (const r of rd.results ?? []) { const a = get(r.user_id); a.reads = r.n; a.last_read = r.last; }
  for (const r of xpr.results ?? []) { get(r.user_id).last_xp = r.last; }
  for (const r of se.results ?? []) { const a = get(r.user_id); a.sent = r.n; a.last_sent = r.last; }
  for (const r of sav.results ?? []) { get(r.user_id).saved = r.n; }
  for (const r of al.results ?? []) { get(r.user_id).alerts = r.n; }
  for (const r of sub.results ?? []) { get(r.user_id).purchased_at = r.first; }
  for (const r of ev.results ?? []) {
    const a = get(r.user_id);
    if (r.event === "open") a.opens = r.n;
    else if (r.event === "click") a.clicks = r.n;
  }
  for (const r of sig.results ?? []) {
    const a = get(r.user_id);
    if (r.signal === "pricing_view") a.pricing = r.n;
    else if (r.signal === "pro_wall_hit") a.wall = r.n;
    else if (r.signal === "signin_wall_hit") a.signin_wall = r.n;
    else if (r.signal === "checkout_start") a.checkout_start = r.n;
    else if (r.signal === "checkout_lead") a.checkout_lead = r.n;
    else if (r.signal === "parity_view") a.parity = r.n;
    // last_intent tracks only signals that indicate BUYING interest, so a
    // lesson-completion beacon cannot make someone look hot.
    if (["pricing_view", "pro_wall_hit", "checkout_start", "checkout_lead", "parity_view"].includes(r.signal)) {
      a.last_intent = Math.max(a.last_intent, r.last);
    }
  }

  const rows = (users.results ?? []).map((raw) => {
    const id = String(raw.id);
    const a = A.get(id) ?? blank();
    const xp = Number(raw.total_xp || 0);
    const streak = Number(raw.current_streak_days || 0);
    const proUntil = raw.pro_until === null || raw.pro_until === undefined ? null : Number(raw.pro_until);
    const createdAt = Number(raw.created_at || 0);
    const lastAny = Math.max(a.last_read, a.last_xp, a.last_intent);
    const state = stateOf(a, proUntil, createdAt, lastAny, now);

    const parts = components(a, xp, streak).sort((p, r) => r.points - p.points);
    const raw_score = parts.reduce((s, p) => s + p.points, 0);
    const score = Math.round(raw_score * decay(Math.max(lastAny, a.last_sent), now));
    const act = nextAction(state, a);

    return {
      id, email: String(raw.email || ""), name: (raw.display_name as string) || null,
      country: (raw.country as string) || null,
      created_at: createdAt, pro_until: proUntil,
      signup_gate: (raw.signup_gate as string) || null,
      signup_slug: (raw.signup_slug as string) || null,
      state, score,
      // The three components that produced the score, so the number is auditable.
      why: parts.slice(0, 3).map((p) => `${p.label} (${Math.round(p.points)})`),
      last_seen: lastAny || null,
      xp, streak,
      lessons: a.reads, solved: a.solved, attempts: a.attempts,
      wall: a.wall, pricing: a.pricing, checkout: a.checkout_start,
      emails_sent: a.sent, opens: a.opens, clicks: a.clicks,
      alerts: a.alerts, saved: a.saved,
      purchased_at: a.purchased_at || null,
      action: act.do, action_why: act.why,
    };
  });

  const keys: Record<string, (r: typeof rows[0]) => number> = {
    score: (r) => r.score, last_seen: (r) => r.last_seen || 0, xp: (r) => r.xp,
    solved: (r) => r.solved, lessons: (r) => r.lessons, wall: (r) => r.wall,
    pricing: (r) => r.pricing, opens: (r) => r.opens, created: (r) => r.created_at,
    checkout: (r) => r.checkout,
  };
  const keyf = keys[sort] || keys.score;

  let out = rows;
  if (stateFilter) out = out.filter((r) => r.state === stateFilter);
  if (q) out = out.filter((r) => r.email.toLowerCase().includes(q) || (r.name || "").toLowerCase().includes(q));
  out.sort((x, y) => (keyf(x) - keyf(y)) * dir);

  const counts: Record<string, number> = {};
  for (const r of rows) counts[r.state] = (counts[r.state] || 0) + 1;

  return json({
    now, total: rows.length, matched: out.length,
    counts, sort, dir: dir === 1 ? "asc" : "desc", state: stateFilter || null, q: q || null,
    rows: out.slice(offset, offset + limit),
    // Stated in the payload so the UI can say it rather than implying precision
    // the data cannot support.
    caveat: {
      purchases: rows.filter((r) => r.purchased_at).length,
      note: "The score orders a list; it is not a prediction. With this few purchases no model can be validated, so every row carries the components behind its score.",
      excluded: "badges, certificates and quiz attempts all have zero rows in production and are not scored",
    },
  });
};
