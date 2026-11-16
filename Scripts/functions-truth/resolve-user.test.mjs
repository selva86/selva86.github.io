// Unit checks for resolveSubscriptionUser in functions/_lib/billing.ts: WHY a
// paid subscription could not be matched to an account.
//
// The distinction under test is the whole point of the function. Until
// 2026-11-12 every lookup inside it ended in .catch(() => null), so a D1
// outage and a buyer who genuinely has no account produced the identical
// value, and the webhook treated both as final. One of them would have healed
// itself on a Paddle retry and never got one; the other was retried forever
// in cases where no retry could ever succeed.
//
//   no_match       every route ran and none matched   -> a person must link it
//   lookup_failed  at least one route threw           -> retry; it may heal
//
// Run: node Scripts/functions-truth/resolve-user.test.mjs
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";

const ROOT = path.resolve(import.meta.dirname, "..", "..");
const esbuild = await import("esbuild");
const outFile = path.join(mkdtempSync(path.join(tmpdir(), "resolve-user-")), "billing.mjs");
await esbuild.build({
  entryPoints: [path.join(ROOT, "functions", "_lib", "billing.ts")],
  bundle: true, format: "esm", platform: "neutral", outfile: outFile, logLevel: "error",
});
const B = await import(pathToFileURL(outFile).href);

let n = 0, fails = 0;
function eq(actual, expected, label) {
  n++;
  try { assert.deepEqual(actual, expected); }
  catch { fails++; console.log(`  FAIL ${label}\n       got  ${JSON.stringify(actual)}\n       want ${JSON.stringify(expected)}`); }
}

const USER = { id: "u1", email: "buyer@example.com", country: "US" };

/* A stand-in D1. `rows` decides what a SELECT returns; `throwOn` makes a
   named route fail, which is how a database outage is reproduced without
   needing one. */
function makeDb({ rows = {}, throwOn = new Set() } = {}) {
  return {
    prepare(sql) {
      const route =
        sql.includes("FROM subscriptions") ? "mirror" :
        sql.includes("paddle_customer_id") ? "customer" :
        sql.includes("WHERE email") || sql.includes("lower(email)") ? "email" : "byid";
      return {
        bind() { return this; },
        async first() {
          if (throwOn.has(route)) throw new Error(`D1 unavailable (${route})`);
          return rows[route] ?? null;
        },
        async all() {
          if (throwOn.has(route)) throw new Error(`D1 unavailable (${route})`);
          return { results: rows[route] ? [rows[route]] : [] };
        },
        async run() { return { meta: { changes: 0 } }; },
      };
    },
  };
}

const input = (over = {}) => ({
  subId: "sub_1", userId: "", customerId: null, email: null, ...over,
});

// ---- a buyer who really is not there ------------------------------------
{
  const db = makeDb();
  const r = await B.resolveSubscriptionUser(db, input({ customerId: "ctm_1", email: "nobody@example.com" }));
  eq({ user: r.user, cause: r.cause }, { user: null, cause: "no_match" },
    "every route ran and matched nothing -> no_match");
}

// ---- the database could not answer --------------------------------------
{
  const db = makeDb({ throwOn: new Set(["mirror", "customer", "email", "byid"]) });
  const r = await B.resolveSubscriptionUser(db, input({ customerId: "ctm_1", email: "buyer@example.com" }));
  eq(r.cause, "lookup_failed", "every route threw -> lookup_failed, which is retryable");
  eq(typeof r.error === "string" && r.error.length > 0, true, "lookup_failed carries the reason");
}

// ---- one broken route must not strand a buyer another route would find ---
{
  const db = makeDb({ rows: { customer: USER }, throwOn: new Set(["mirror"]) });
  const r = await B.resolveSubscriptionUser(db, input({ customerId: "ctm_1" }));
  eq({ id: r.user?.id, cause: r.cause }, { id: "u1", cause: null },
    "a throwing route is recorded but the next route still runs and wins");
}

// ---- a found user is never reported as a failure ------------------------
{
  const db = makeDb({ rows: { customer: USER } });
  const r = await B.resolveSubscriptionUser(db, input({ customerId: "ctm_1" }));
  eq(r.cause, null, "a match reports no cause");
}

// ---- nothing to go on at all --------------------------------------------
{
  const db = makeDb();
  const r = await B.resolveSubscriptionUser(db, input());
  eq(r.cause, "no_match", "no identifiers at all is a miss, not a failure");
}

console.log(fails ? `\n${n - fails}/${n} checks passed, ${fails} FAILED` : `${n}/${n} checks passed`);
process.exit(fails ? 1 : 0);
