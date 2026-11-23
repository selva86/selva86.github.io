// Unit checks for resolveScope in functions/_lib/entitlement.ts: which slice of
// the catalog a Pro user is allowed to read. Run:
//   node Scripts/functions-truth/scope.test.mjs
//
// THE RULE UNDER TEST: a Single Track scope key may never narrow a user who is
// also paying for a broader plan. `tracks:<uid>` is keyed on the user, not on
// the subscription that scoped them, so before this guard existed a Single
// purchase on top of an active All-Access plan silently cut that customer down
// to one track. That happened in production on 2026-11-23 to a customer who had
// held allaccess_month since September: 38 days scoped to "ds", unable to open
// the Forecaster track, and they ended up buying a third plan to escape it.
//
// The sibling guard lives in the Paddle webhook, which declines to WRITE the key
// in the same situation. Both halves are deliberate: the read guard repairs
// existing bad state, the write guard stops new state being created.
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";

const ROOT = path.resolve(import.meta.dirname, "..", "..");
const esbuild = await import("esbuild");
const outFile = path.join(mkdtempSync(path.join(tmpdir(), "scope-")), "entitlement.mjs");
await esbuild.build({
  entryPoints: [path.join(ROOT, "functions", "_lib", "entitlement.ts")],
  bundle: true, format: "esm", platform: "neutral", outfile: outFile, logLevel: "error",
});
const E = await import(pathToFileURL(outFile).href);

let n = 0, fails = 0;
function eq(actual, expected, label) {
  n++;
  try { assert.deepEqual(actual, expected); }
  catch { fails++; console.log(`  FAIL ${label}\n       got  ${JSON.stringify(actual)}\n       want ${JSON.stringify(expected)}`); }
}

const NOW = 1795000000;
const LATER = NOW + 86400 * 30;
const PAYING = ["active", "trialing", "past_due"];

/* A D1 stand-in that answers exactly the two questions resolveScope asks: the
   team-seat join (always "no seat" here) and the broader-plan probe. Dispatch is
   on the SQL text, so a rewritten query that no longer asks about subscriptions
   shows up as a failure rather than quietly passing. */
function fakeDb(subs, { throwOnProbe = false } = {}) {
  return {
    prepare(sql) {
      const isProbe = sql.includes("plan NOT LIKE 'single%'");
      return {
        bind() {
          return {
            async first() {
              if (!isProbe) return null;                 // no org seat
              if (throwOnProbe) throw new Error("D1 unavailable");
              const hit = subs.some((s) => PAYING.includes(s.status) && !s.plan.startsWith("single"));
              return hit ? { found: 1 } : null;
            },
            async all() { return { results: [] }; },
          };
        },
      };
    },
  };
}
const fakeKv = (map = {}) => ({ async get(k) { return k in map ? map[k] : null; } });
const user = (pro_until) => ({ id: "u1", pro_until, pass_claimed_at: null });
const scope = (subs, kv, pro_until = LATER, opts) =>
  E.resolveScope({ DB: fakeDb(subs, opts), KV: fakeKv(kv) }, user(pro_until));

const AA = { plan: "allaccess_month", status: "active" };
const SINGLE = { plan: "single_month", status: "active" };

// ---- THE REGRESSION. Both plans at once: the wider one wins. ---------------
eq(await scope([AA, SINGLE], { "tracks:u1": "ds" }), "all",
  "all-access + single track with a ds key resolves to the WHOLE catalog");
eq(await scope([{ plan: "allaccess_year", status: "past_due" }, SINGLE], { "tracks:u1": "ds" }), "all",
  "a past_due all-access plan is still broader than the key (grace period)");
eq(await scope([{ plan: "allaccess_quarter", status: "trialing" }, SINGLE], { "tracks:u1": "ts" }), "all",
  "a trialing all-access plan is still broader than the key");

// ---- Single Track alone still scopes, which is what customers pay for. ----
eq(await scope([SINGLE], { "tracks:u1": "ds" }), "ds",
  "single track alone is still scoped to its one track");
eq(await scope([{ plan: "single_year", status: "active" }], { "tracks:u1": "ts" }), "ts",
  "an annual single track is scoped the same way");
eq(await scope([SINGLE], {}), "all",
  "single track with no key is unscoped Pro, as before");

// ---- Plans that are all-catalog by definition ignore any stale key. -------
eq(await scope([AA], { "tracks:u1": "ds" }), "all",
  "all-access with a stale key from an earlier single purchase self-heals");
eq(await scope([], { "tracks:u1": "ds" }, -1), "all",
  "lifetime ignores a stale key even with no subscription row at all");

// ---- Not Pro, and the fail-closed path. ----------------------------------
eq(await scope([], {}, NOW - 1), "0",
  "a lapsed pro_until is scope 0, not all");
eq(await scope([AA, SINGLE], { "tracks:u1": "ds" }, LATER, { throwOnProbe: true }), "ds",
  "a D1 failure falls back to the key rather than handing out the catalog");

// ---- scopeCovers, the pure half of the rule. -----------------------------
eq(E.scopeCovers("ds", "ts"), false, "a ds scope does not cover the ts track");
eq(E.scopeCovers("ds", "analyst"), true, "every paid scope covers the shared analyst core");
eq(E.scopeCovers("ds", "foundations"), true, "every paid scope covers foundations");
eq(E.scopeCovers("all", "ts"), true, "an all scope covers every track");
eq(E.scopeCovers("0", "ts"), false, "scope 0 covers nothing");
eq(E.scopeCovers("0", "any"), false, "not even an unroadmapped lesson leaks to scope 0");
eq(E.scopeCovers("ds", "any"), true, "an unroadmapped lesson is readable by any paid scope");

console.log(`${n - fails}/${n} checks passed${fails ? `, ${fails} FAILED` : ""}`);
process.exit(fails ? 1 : 0);
