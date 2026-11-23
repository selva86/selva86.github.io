// Unit checks for functions/_lib/buyer-dossier.ts: the buyer facts and the
// pre-purchase trail attached to the "Payment received" notice. Run:
//   node Scripts/functions-truth/buyer-dossier.test.mjs
//
// WHAT MATTERS HERE. This code runs inside context.waitUntil after the webhook
// has already answered Paddle, so nothing it does can cost a payment. The
// thing that CAN go wrong is that a query fails and takes the whole
// notification email with it, leaving the owner with no notice that money
// arrived. So the loudest checks below are the failure ones: every query is
// knocked out in turn and the dossier still has to come back usable.
//
// The resolution order is the other half. custom_data.email is written by the
// buyer's browser at checkout, so it is the LAST source consulted, for the
// same reason paddle-plan.ts refuses to read a plan out of custom_data.
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";

const ROOT = path.resolve(import.meta.dirname, "..", "..");
const esbuild = await import("esbuild");
const outFile = path.join(mkdtempSync(path.join(tmpdir(), "buyer-dossier-")), "buyer-dossier.mjs");
await esbuild.build({
  entryPoints: [path.join(ROOT, "functions", "_lib", "buyer-dossier.ts")],
  bundle: true, format: "esm", platform: "neutral", outfile: outFile, logLevel: "error",
});
const { buyerDossier } = await import(pathToFileURL(outFile).href);

let n = 0, fails = 0;
function eq(actual, expected, label) {
  n++;
  try { assert.deepEqual(actual, expected); }
  catch { fails++; console.log(`  FAIL ${label}\n       got  ${JSON.stringify(actual)}\n       want ${JSON.stringify(expected)}`); }
}
function has(rows, key, substr, label) {
  n++;
  const row = rows.find((r) => r[0] === key);
  const ok = row && String(row[1]).includes(substr);
  if (!ok) {
    fails++;
    console.log(`  FAIL ${label}\n       row  ${row ? JSON.stringify(row) : `"${key}" is absent`}\n       want value containing "${substr}"`);
  }
}
function lacks(rows, key, label) {
  n++;
  if (rows.some((r) => r[0] === key)) { fails++; console.log(`  FAIL ${label}: "${key}" should not be present`); }
}

const NOW = 1764000000;                 // 2025-11-24 in unix seconds
const DAY = 86400;
const ago = (d) => NOW - d * DAY;

const USER = {
  id: "u-1", email: "buyer@example.com", created_at: ago(70),
  country: "IN", pro_until: null, total_xp: 312, current_streak_days: 4,
};

/* A fake D1 that dispatches on the text of each query. Keyed on fragments that
   are unique to one statement, so a rewritten query fails loudly here instead
   of silently returning the wrong table's rows. */
function fakeDb(script, { fail = [] } = {}) {
  const seen = [];
  function pick(sql) {
    if (sql.includes("external_id = ?1")) return "userBySub";
    if (sql.includes("paddle_customer_id = ?1")) return "userByCustomer";
    if (sql.includes("lower(email) = ?1")) return "userByEmail";
    if (sql.includes("FROM subscriptions") && sql.includes("user_id = ?1")) return "subs";
    if (sql.includes("AS starts")) return "engagement";
    /* The exclusion is asserted, not assumed: recordPayment has already
       written the row for the charge being announced, so a dossier that
       forgets `id != ?2` reports a first-ever purchase as "1 charge". */
    if (sql.includes("FROM payments")) {
      if (!sql.includes("id != ?2")) throw new Error("payments query must exclude the current transaction");
      return "payments";
    }
    if (sql.includes("DISTINCT anon_id")) return "anon";
    if (sql.includes("ORDER BY at ASC LIMIT 1")) return "first";
    if (sql.includes("signal = 'objection'")) return "objection";
    if (sql.includes("FROM email_events")) return "mail";
    if (sql.includes("LIMIT 60")) return "trail";
    throw new Error(`unrecognised query: ${sql.slice(0, 90)}`);
  }
  return {
    queries: seen,
    prepare(sql) {
      const which = pick(sql);
      seen.push(which);
      return {
        bind() {
          return {
            async first() {
              if (fail.includes(which)) throw new Error(`${which} unavailable`);
              const v = script[which];
              return Array.isArray(v) ? (v[0] ?? null) : (v ?? null);
            },
            async all() {
              if (fail.includes(which)) throw new Error(`${which} unavailable`);
              const v = script[which];
              return { results: Array.isArray(v) ? v : v ? [v] : [] };
            },
          };
        },
      };
    },
  };
}

const FULL = {
  userBySub: USER,
  subs: [
    { plan: "allaccess_month", status: "active", created_at: ago(67), external_id: "sub_OTHER" },
    { plan: "single_month", status: "canceled", created_at: ago(40), external_id: "sub_OLD" },
  ],
  engagement: { starts: 41, finishes: 28, walls: 9, bar: 120, ex: 19, exok: 12, posts: 6 },
  payments: { n: 2, gross: 1796, first_at: ago(67), cur: "USD" },
  anon: [{ anon_id: "a-1" }],
  first: { at: ago(84), signal: "pricing_view", path: "/Time-Series-Analysis-in-R.html" },
  objection: { at: ago(52), meta: "price" },
  mail: { email_key: "day27-coupon", event: "click", at: ago(2) },
  trail: [
    { at: ago(0) + 60, signal: "purchase_client", path: "/pricing.html", meta: null },
    { at: ago(0), signal: "checkout_start", path: "/pricing.html", meta: null },
    { at: ago(1), signal: "pro_wall_hit", path: "/lessons/Forecasting-with-ARIMA.html", meta: null },
    { at: ago(1) - 10, signal: "bar_view", path: "/", meta: null },
    { at: ago(3), signal: "lesson_complete", path: "/lessons/Stationarity.html", meta: null },
  ],
};

const OPTS = { email: "buyer@example.com", paddleCustomerId: "ctm_1", subscriptionId: "sub_NEW", txnId: "txn_NEW", now: NOW };

console.log("the full picture");
{
  const db = fakeDb(FULL);
  const d = await buyerDossier(db, OPTS);
  has(d.rows, "Buyer", "buyer@example.com", "the resolved account email leads");
  has(d.rows, "Account", "70 days ago", "account age in days");
  has(d.rows, "Account", "312 XP", "XP carried through");
  // The line that would have caught the 2026-11-23 double-subscription bug.
  has(d.rows, "ALSO HOLDS", "allaccess_month (active", "an existing paying plan is shouted, not whispered");
  lacks(d.rows, "Customer", "the bare payload email row is replaced by the dossier");
  has(d.rows, "Held before", "single_month (canceled)", "lapsed plans listed separately");
  has(d.rows, "Engagement", "41 lessons started, 28 finished", "lesson counts");
  has(d.rows, "Engagement", "12/19 exercises passed", "exercise ratio, not just a total");
  has(d.rows, "Pro walls hit", "9 times", "paywall hits, the best purchase predictor in this data");
  has(d.rows, "Paid before", "2 charges, 17.96 USD", "prior money, formatted from minor units");
  has(d.rows, "First seen", "/Time-Series-Analysis-in-R.html", "first touch path");
  has(d.rows, "First seen", "14 days before signing up", "pre-signup touch is dated against the signup");
  has(d.rows, "Said the blocker was", "the price", "the objection is spelled out, not left as a code");
  has(d.rows, "Last email acted on", "day27-coupon, clicked", "email attribution");

  // The trail: oldest first, noise dropped, every line readable English.
  eq(d.journey.length, 4, "bar_view dropped from a 5-event trail");
  eq(d.journey[0].includes("finished a lesson"), true, "oldest event first");
  eq(d.journey[3].includes("completed the checkout"), true, "newest event last");
  eq(d.journey.some((l) => l.includes("bar_view")), false, "no raw impression noise");
  eq(d.journey.some((l) => l.includes("pro_wall_hit")), false, "raw signal names never reach the email");
  eq(d.journey.some((l) => l.includes("hit a Pro wall")), true, "signals read as sentences");
}

console.log("resolution order");
{
  // The subscription row wins: it is the only one our own webhook wrote.
  const db = fakeDb({ ...FULL, userBySub: USER, userByEmail: { ...USER, id: "wrong" } });
  const d = await buyerDossier(db, OPTS);
  eq(db.queries.includes("userByEmail"), false, "the buyer-written email is never consulted when the subscription resolves");
  has(d.rows, "Buyer", "buyer@example.com", "resolved from the subscription");
}
{
  // Falling back in order when earlier sources miss.
  const db = fakeDb({ ...FULL, userBySub: null, userByCustomer: USER });
  await buyerDossier(db, OPTS);
  eq(db.queries.slice(0, 2), ["userBySub", "userByCustomer"], "customer id is the second source");
}
{
  const db = fakeDb({ ...FULL, userBySub: null, userByCustomer: null, userByEmail: USER });
  await buyerDossier(db, OPTS);
  eq(db.queries.slice(0, 3), ["userBySub", "userByCustomer", "userByEmail"], "the payload email is the last resort");
}

console.log("a payment with no account behind it");
{
  const db = fakeDb({ userBySub: null, userByCustomer: null, userByEmail: null });
  const d = await buyerDossier(db, OPTS);
  // This is the one case that must be impossible to skim past: money arrived
  // and there is nobody to give access to.
  has(d.rows, "Account", "NONE FOUND", "an unmatched payment says so in capitals");
  has(d.rows, "Account", "buyer@example.com", "and names the address it could not match");
  eq(d.journey, [], "no trail is invented for an account that does not exist");
  eq(db.queries.length, 3, "and it stops after three lookups rather than querying on");
}

console.log("every query knocked out in turn");
// The point of this block: a dossier query that fails must cost one line of
// the email, never the email. Any throw escaping buyerDossier would land in
// the waitUntil and the owner would simply never hear that money arrived.
for (const q of ["subs", "engagement", "payments", "anon", "first", "objection", "mail", "trail"]) {
  const db = fakeDb(FULL, { fail: [q] });
  let d = null, threw = null;
  try { d = await buyerDossier(db, OPTS); } catch (e) { threw = e; }
  n++;
  if (threw || !d || !d.rows.length) {
    fails++;
    console.log(`  FAIL a failing "${q}" query broke the dossier: ${threw ? threw.message : "no rows returned"}`);
  }
  // The account identity survives every single-query failure.
  has(d ? d.rows : [], "Buyer", "buyer@example.com", `"${q}" can fail and the buyer is still named`);
}

console.log("a brand new buyer with no history");
{
  const db = fakeDb({
    userBySub: { ...USER, created_at: NOW - 600, total_xp: 0, current_streak_days: 0 },
    subs: [], engagement: { starts: 0, finishes: 0, walls: 0, bar: 0, ex: 0, exok: 0, posts: 0 },
    payments: { n: 0, gross: null, first_at: null, cur: null },
    anon: [], first: null, objection: null, mail: null, trail: [],
  });
  const d = await buyerDossier(db, OPTS);
  has(d.rows, "Account", "0 days ago", "a signup minutes old reads as 0 days");
  has(d.rows, "Engagement", "cold purchase", "no activity is stated plainly, not left blank");
  has(d.rows, "Paid before", "first charge", "first-time buyer is called out");
  lacks(d.rows, "ALSO HOLDS", "nothing is shouted when there is nothing to shout");
  lacks(d.rows, "Pro walls hit", "a zero count is omitted rather than printed as 0");
  eq(d.journey, ["No recorded activity in the 14 days before this payment."],
    "an empty trail says so, because a blank block reads as a bug");
}

console.log("the trail is capped");
{
  const many = [];
  for (let i = 0; i < 40; i++) many.push({ at: NOW - i * 600, signal: "lesson_start", path: `/l${i}.html`, meta: null });
  const db = fakeDb({ ...FULL, trail: many });
  const d = await buyerDossier(db, OPTS);
  eq(d.journey.length, 16, "15 events plus the line that says how many were left out");
  eq(d.journey[0].includes("25 earlier actions"), true, "and it says how many, rather than silently truncating");
}

console.log(`\n${n - fails}/${n} checks passed`);
process.exit(fails ? 1 : 0);
