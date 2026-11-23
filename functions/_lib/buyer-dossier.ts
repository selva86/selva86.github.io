// Who the buyer is and what they did before they paid.
//
// WHY. The "Payment received" notice used to say the event, the plan, the
// amount and whichever email address the browser happened to put in
// custom_data at checkout. That is enough to know money arrived and nothing
// else: not whether the payer has an account, not what they had been reading,
// not what finally pushed them over, and not whether they were already paying
// for something. Every one of those facts is already in D1; the notice simply
// never asked. This file asks.
//
// It is also the cheapest possible guard against the class of bug found on
// 2026-11-23, where a customer bought a Single Track plan on top of an active
// All-Access subscription and the second purchase silently narrowed what they
// could read. The notice now lists the other subscriptions the buyer already
// holds, so a purchase that should not have been possible is visible in the
// inbox the moment it happens rather than 38 days later in a support email.
//
// RULES THIS FILE FOLLOWS.
//   - It never throws. Every query is independently catch-ed and a failure
//     drops one line from the email rather than losing the notification.
//   - It runs inside context.waitUntil, after the webhook has already
//     responded 200 to Paddle, so its cost is never on the response path.
//   - It reads. It writes nothing and decides nothing.

import { money } from "./payments";

export interface Dossier {
  /** Label/value pairs for the notification table. */
  rows: Array<[string, string]>;
  /** One line per action, oldest first, for the "Path to purchase" block. */
  journey: string[];
}

const DAY = 86400;
const day = (ts: number) => new Date(ts * 1000).toISOString().slice(0, 10);
const stamp = (ts: number) => new Date(ts * 1000).toISOString().replace("T", " ").slice(0, 16);

/* Signals that fire on sight rather than on intent. bar_view alone is 30,630
   rows in 90 days, so leaving it in would bury the four events that actually
   mean something under a wall of impressions. They are counted instead. */
const NOISE = new Set(["bar_view", "offer_shown", "pricing_toggle", "parity_view"]);

/* Raw signal names are fine in a dashboard, where the reader is looking for
   them. In an email they have to read as a sentence at a glance. */
const SIGNAL_WORDS: Record<string, string> = {
  signin_wall_hit: "hit the sign-in wall",
  pro_wall_hit: "hit a Pro wall",
  lesson_start: "started a lesson",
  lesson_complete: "finished a lesson",
  lesson_window_closed: "ran out of a lesson window",
  track_view: "looked at a track",
  track_lesson: "opened a track lesson",
  pricing_view: "read the pricing page",
  offer_view: "saw the offer",
  offer_click: "clicked the offer",
  bar_click: "clicked the offer bar",
  bar_code_open: "opened a discount code",
  bar_code_sent: "was sent a discount code",
  checkout_lead: "reached the checkout",
  checkout_start: "started the checkout",
  checkout_closed: "closed the checkout without buying",
  purchase_client: "completed the checkout",
  price_alert: "asked to be told when the price changes",
  recovery_sent: "was sent a cart-recovery email",
  recovery2_sent: "was sent a second cart-recovery email",
  recovery_code: "was sent a recovery code",
  objection: "said what was stopping them",
};

const OBJECTION_WORDS: Record<string, string> = {
  price: "the price",
  no_time: "no time right now",
  unsure: "not sure it is for me",
};

interface UserRow {
  id: string;
  email: string;
  created_at: number;
  country: string | null;
  pro_until: number | null;
  total_xp: number | null;
  current_streak_days: number | null;
}

/* Resolve the buyer, most authoritative source first. The subscription row is
   the only one written by our own webhook from a verified payload, so it wins.
   custom_data.email is buyer-writable and comes last for the same reason
   paddle-plan.ts refuses to read a plan out of it. */
async function findUser(
  db: D1Database,
  opts: { email: string; paddleCustomerId: string; subscriptionId: string },
): Promise<UserRow | null> {
  const COLS = "id, email, created_at, country, pro_until, total_xp, current_streak_days";
  if (opts.subscriptionId) {
    const r = await db
      .prepare(
        `SELECT ${COLS} FROM users WHERE id = (
           SELECT user_id FROM subscriptions WHERE provider = 'paddle' AND external_id = ?1
         ) AND deleted_at IS NULL`,
      )
      .bind(opts.subscriptionId)
      .first<UserRow>()
      .catch(() => null);
    if (r) return r;
  }
  if (opts.paddleCustomerId) {
    const r = await db
      .prepare(`SELECT ${COLS} FROM users WHERE paddle_customer_id = ?1 AND deleted_at IS NULL`)
      .bind(opts.paddleCustomerId)
      .first<UserRow>()
      .catch(() => null);
    if (r) return r;
  }
  if (opts.email) {
    const r = await db
      .prepare(`SELECT ${COLS} FROM users WHERE lower(email) = ?1 AND deleted_at IS NULL`)
      .bind(opts.email.toLowerCase())
      .first<UserRow>()
      .catch(() => null);
    if (r) return r;
  }
  return null;
}

export async function buyerDossier(
  db: D1Database,
  opts: {
    email?: string | null;
    paddleCustomerId?: string | null;
    subscriptionId?: string | null;
    /* The transaction being announced. recordPayment() has already written its
       row by the time this runs, so without excluding it "Paid before" counts
       the very charge the email is about: the first-ever purchase reads as
       "1 charge" instead of "their first charge". Caught against live data. */
    txnId?: string | null;
    now?: number;
  },
): Promise<Dossier> {
  const rows: Array<[string, string]> = [];
  const journey: string[] = [];
  const now = opts.now || Math.floor(Date.now() / 1000);

  const user = await findUser(db, {
    email: opts.email || "",
    paddleCustomerId: opts.paddleCustomerId || "",
    subscriptionId: opts.subscriptionId || "",
  });

  if (!user) {
    /* Not a footnote. A payment with no account behind it means the buyer
       cannot be given access, so it needs to be the loudest line in the
       email, not an absence the reader has to notice. */
    rows.push(["Account", `NONE FOUND for ${opts.email || "(no email in the payload)"}, so nothing can be unlocked`]);
    return { rows, journey };
  }

  const uid = user.id;
  const age = Math.max(0, Math.round((now - user.created_at) / DAY));
  rows.push(["Buyer", user.email]);
  rows.push([
    "Account",
    `signed up ${day(user.created_at)}, ${age} ${age === 1 ? "day" : "days"} ago`
      + (user.country ? `, ${user.country}` : "")
      + (user.total_xp ? `, ${user.total_xp} XP` : "")
      + (user.current_streak_days ? `, ${user.current_streak_days}-day streak` : ""),
  ]);

  /* Other subscriptions. This is the line that would have caught the
     2026-11-23 entitlement bug on the day it was created. */
  const subs = await db
    .prepare(
      `SELECT plan, status, created_at, external_id FROM subscriptions
        WHERE user_id = ?1 AND provider = 'paddle'
        ORDER BY created_at DESC LIMIT 6`,
    )
    .bind(uid)
    .all<{ plan: string; status: string; created_at: number | null; external_id: string }>()
    .catch(() => null);
  const others = (subs?.results || []).filter((s) => s.external_id !== (opts.subscriptionId || ""));
  if (others.length) {
    const paying = others.filter((s) => ["active", "trialing", "past_due"].includes(s.status));
    if (paying.length) {
      rows.push([
        paying.length > 1 ? "ALSO HOLDS" : "ALSO HOLDS",
        paying.map((s) => `${s.plan} (${s.status}${s.created_at ? ", since " + day(s.created_at) : ""})`).join("; "),
      ]);
    }
    const past = others.filter((s) => !["active", "trialing", "past_due"].includes(s.status));
    if (past.length) {
      rows.push(["Held before", past.map((s) => `${s.plan} (${s.status})`).join("; ")]);
    }
  }

  // What they have actually done on the site. One round trip, six counts.
  const eng = await db
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM intent_signals WHERE user_id = ?1 AND signal = 'lesson_start')    AS starts,
         (SELECT COUNT(*) FROM intent_signals WHERE user_id = ?1 AND signal = 'lesson_complete') AS finishes,
         (SELECT COUNT(*) FROM intent_signals WHERE user_id = ?1 AND signal = 'pro_wall_hit')    AS walls,
         (SELECT COUNT(*) FROM intent_signals WHERE user_id = ?1 AND signal = 'bar_view')        AS bar,
         (SELECT COUNT(*) FROM exercise_attempts WHERE user_id = ?1)                             AS ex,
         (SELECT COUNT(*) FROM exercise_attempts WHERE user_id = ?1 AND passed = 1)              AS exok,
         (SELECT COUNT(*) FROM reading_progress WHERE user_id = ?1)                              AS posts`,
    )
    .bind(uid)
    .first<{ starts: number; finishes: number; walls: number; bar: number; ex: number; exok: number; posts: number }>()
    .catch(() => null);
  if (eng) {
    const bits: string[] = [];
    if (eng.starts) bits.push(`${eng.starts} lessons started, ${eng.finishes} finished`);
    if (eng.ex) bits.push(`${eng.exok}/${eng.ex} exercises passed`);
    if (eng.posts) bits.push(`${eng.posts} posts read`);
    rows.push(["Engagement", bits.length ? bits.join(", ") : "nothing recorded, this is a cold purchase"]);
    /* How often they were stopped by the paywall. The single best predictor in
       this dataset of why a purchase happened at all. */
    if (eng.walls) rows.push(["Pro walls hit", `${eng.walls} times`]);
    if (eng.bar) rows.push(["Offer bar seen", `${eng.bar} times`]);
  }

  // Money before this one.
  const paid = await db
    .prepare(
      `SELECT COUNT(*) AS n, SUM(gross) AS gross, MIN(billed_at) AS first_at, MAX(currency) AS cur
         FROM payments WHERE user_id = ?1 AND gross > 0 AND id != ?2`,
    )
    .bind(uid, opts.txnId || "")
    .first<{ n: number; gross: number | null; first_at: number | null; cur: string | null }>()
    .catch(() => null);
  if (paid?.n) {
    rows.push([
      "Paid before",
      `${paid.n} ${paid.n === 1 ? "charge" : "charges"}, ${money(paid.gross, paid.cur)}`
        + (paid.first_at ? ` since ${day(paid.first_at)}` : ""),
    ]);
  } else {
    rows.push(["Paid before", "nothing, this is their first charge"]);
  }

  /* Anonymous ids this account was ever seen under, so the journey can reach
     back past the signup. Most first touches happen before an account exists,
     and without this the "First seen" line would never predate the signup. */
  const anon = await db
    .prepare(
      `SELECT DISTINCT anon_id FROM intent_signals
        WHERE user_id = ?1 AND anon_id IS NOT NULL AND anon_id != '' LIMIT 12`,
    )
    .bind(uid)
    .all<{ anon_id: string }>()
    .catch(() => null);
  const anonIds = (anon?.results || []).map((r) => r.anon_id);
  const anonJson = JSON.stringify(anonIds);
  const who = anonIds.length
    ? "(user_id = ?1 OR anon_id IN (SELECT value FROM json_each(?2)))"
    : "user_id = ?1";
  const bind = (...extra: unknown[]) => (anonIds.length ? [uid, anonJson, ...extra] : [uid, ...extra]);

  const first = await db
    .prepare(`SELECT at, signal, path FROM intent_signals WHERE ${who} ORDER BY at ASC LIMIT 1`)
    .bind(...bind())
    .first<{ at: number; signal: string; path: string | null }>()
    .catch(() => null);
  if (first) {
    rows.push([
      "First seen",
      `${day(first.at)}${first.path ? " on " + first.path : ""}`
        + (first.at < user.created_at ? ` (${Math.round((user.created_at - first.at) / DAY)} days before signing up)` : ""),
    ]);
  }

  /* The only direct customer voice this site collects. If they ever told us
     what was stopping them, it belongs beside the payment that proves the
     objection was answered. */
  const obj = await db
    .prepare(`SELECT at, meta FROM intent_signals WHERE signal = 'objection' AND ${who} ORDER BY at DESC LIMIT 1`)
    .bind(...bind())
    .first<{ at: number; meta: string | null }>()
    .catch(() => null);
  if (obj) {
    rows.push(["Said the blocker was", `${OBJECTION_WORDS[obj.meta || ""] || obj.meta || "(blank)"}, on ${day(obj.at)}`]);
  }

  /* Email attribution. Which of our own sends they last opened or clicked,
     which is the closest thing to an answer to "did the sequence do this". */
  const mail = await db
    .prepare(
      `SELECT email_key, event, at FROM email_events
        WHERE user_id = ?1 AND event IN ('click', 'open') ORDER BY at DESC LIMIT 1`,
    )
    .bind(uid)
    .first<{ email_key: string | null; event: string; at: number }>()
    .catch(() => null);
  if (mail?.email_key) {
    rows.push(["Last email acted on", `${mail.email_key}, ${mail.event}ed ${day(mail.at)}`]);
  }

  /* THE JOURNEY. The last fortnight of real actions, oldest first so it reads
     as a story that ends in the payment. Noise signals are excluded above, and
     the cap is low on purpose: fifteen lines is a story, fifty is a log file
     nobody reads. */
  const trail = await db
    .prepare(
      `SELECT at, signal, path, meta FROM intent_signals
        WHERE ${who} AND at >= ?${anonIds.length ? 3 : 2}
        ORDER BY at DESC LIMIT 60`,
    )
    .bind(...bind(now - 14 * DAY))
    .all<{ at: number; signal: string; path: string | null; meta: string | null }>()
    .catch(() => null);
  const events = (trail?.results || []).filter((e) => !NOISE.has(e.signal));
  for (const e of events.slice(0, 15).reverse()) {
    const words = SIGNAL_WORDS[e.signal] || e.signal;
    const where = e.path && e.path !== "/" ? ` ${e.path}` : "";
    const extra = e.signal === "objection" ? ` (${OBJECTION_WORDS[e.meta || ""] || e.meta || "blank"})` : "";
    journey.push(`${stamp(e.at)}  ${words}${extra}${where}`);
  }
  if (events.length > 15) {
    journey.unshift(`(${events.length - 15} earlier actions in the last 14 days not shown)`);
  }
  if (!events.length) {
    journey.push("No recorded activity in the 14 days before this payment.");
  }

  return { rows, journey };
}
