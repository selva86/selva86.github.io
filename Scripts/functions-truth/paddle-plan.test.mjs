// Unit checks for functions/_lib/paddle-plan.ts: which plan a verified Paddle
// webhook pays for. The rule under test: only the catalog price ids decide;
// the entity's custom_data (written by the buyer's browser at checkout) never
// grants a plan. Run:
//   node Scripts/functions-truth/paddle-plan.test.mjs
// The same file runs unchanged on the sister site.
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";

const ROOT = path.resolve(import.meta.dirname, "..", "..");
const esbuild = await import("esbuild");
const outFile = path.join(mkdtempSync(path.join(tmpdir(), "paddle-plan-")), "paddle-plan.mjs");
await esbuild.build({
  entryPoints: [path.join(ROOT, "functions", "_lib", "paddle-plan.ts")],
  bundle: true, format: "esm", platform: "neutral", outfile: outFile, logLevel: "error",
});
const P = await import(pathToFileURL(outFile).href);

let n = 0, fails = 0;
function eq(actual, expected, label) {
  n++;
  try { assert.deepEqual(actual, expected); }
  catch { fails++; console.log(`  FAIL ${label}\n       got  ${JSON.stringify(actual)}\n       want ${JSON.stringify(expected)}`); }
}

const ENV = {
  PADDLE_PRICE_SINGLE_MONTH: "pri_single_m",
  PADDLE_PRICE_SINGLE_YEAR: "pri_single_y",
  PADDLE_PRICE_AA_MONTH: "pri_aa_m",
  PADDLE_PRICE_AA_YEAR: "pri_aa_y",
  PADDLE_PRICE_LIFETIME: "pri_life",
  PADDLE_PRICE_SINGLE_YEAR_LOCK: "pri_single_lock",
  PADDLE_PRICE_AA_YEAR_LOCK: "pri_aa_lock",
};
const TEAMS = "pri_teams";
const buy = (priceId, customData = null, quantity = 1, priceCustom = null) => ({
  items: [{ price: { id: priceId, custom_data: priceCustom }, quantity }],
  custom_data: customData,
});

// ---- Every configured price resolves to its own plan.
eq(P.individualPlan(buy("pri_single_m"), ENV), "single_month", "single month");
eq(P.individualPlan(buy("pri_single_y"), ENV), "single_year", "single year");
eq(P.individualPlan(buy("pri_aa_m"), ENV), "allaccess_month", "all-access month");
eq(P.individualPlan(buy("pri_aa_y"), ENV), "allaccess_year", "all-access year");
eq(P.individualPlan(buy("pri_life"), ENV), "lifetime", "lifetime");
eq(P.individualPlan(buy("pri_single_lock"), ENV), "single_year", "single price lock = single year");
eq(P.individualPlan(buy("pri_aa_lock"), ENV), "allaccess_year", "all-access price lock = all-access year");

// ---- The flaw: custom_data names a better plan than the price paid. The price wins.
eq(P.individualPlan(buy("pri_single_m", { plan: "lifetime" }), ENV), "single_month", "$9 month claiming lifetime stays single_month");
eq(P.individualPlan(buy("pri_single_m", { plan: "allaccess", term: "year" }), ENV), "single_month", "single month claiming all-access year");
eq(P.individualPlan(buy("pri_single_y", { plan: "allaccess", term: "year" }), ENV), "single_year", "single year claiming all-access");
eq(P.individualPlan(buy("pri_aa_m", { plan: "allaccess", term: "year" }), ENV), "allaccess_month", "month claiming year term");
eq(P.individualPlan(buy("pri_single_m", { plan: "single", term: "lifetime" }), ENV), "single_month", "nonsense term ignored");

// ---- Legitimate checkouts: custom_data agrees with the price; result unchanged.
eq(P.individualPlan(buy("pri_aa_y", { plan: "allaccess", term: "year", user_id: "u1" }), ENV), "allaccess_year", "honest all-access year");
eq(P.individualPlan(buy("pri_life", { plan: "lifetime", user_id: "u1" }), ENV), "lifetime", "honest lifetime");

// ---- Unknown, missing or unconfigured prices entitle nothing, whatever custom_data says.
eq(P.individualPlan(buy("pri_other", { plan: "lifetime" }), ENV), null, "foreign price claiming lifetime");
eq(P.individualPlan(buy("pri_other", { plan: "allaccess", term: "year" }), ENV), null, "foreign price claiming all-access");
eq(P.individualPlan({ items: [], custom_data: { plan: "lifetime" } }, ENV), null, "no items");
eq(P.individualPlan({ custom_data: { plan: "lifetime" } }, ENV), null, "items missing");
eq(P.individualPlan({ items: [{ price: {} }], custom_data: { plan: "lifetime" } }, ENV), null, "item without a price id");
eq(P.individualPlan(buy("pri_life"), {}), null, "nothing configured: nothing granted");
eq(P.individualPlan(buy("pri_life"), { ...ENV, PADDLE_PRICE_LIFETIME: "" }), null, "lifetime unconfigured: not granted");
eq(P.individualPlan(buy(undefined, { plan: "lifetime" }), { ...ENV, PADDLE_PRICE_LIFETIME: undefined }), null, "undefined price id never equals an undefined env id");

// ---- Several items: the first configured price decides; foreign items are skipped.
eq(P.individualPlan({ items: [{ price: { id: "pri_other" } }, { price: { id: "pri_aa_y" } }] }, ENV), "allaccess_year", "skips a foreign item");

// ---- Price lock: either signal is enough (a forged flag only delays the buyer's own access).
eq(P.isPriceLock(buy("pri_single_lock"), ENV), true, "lock by price id");
eq(P.isPriceLock(buy("pri_aa_lock"), ENV), true, "all-access lock by price id");
eq(P.isPriceLock(buy("pri_aa_y", { price_lock: true }), ENV), true, "lock by flag");
eq(P.isPriceLock(buy("pri_aa_y", { price_lock: "true" }), ENV), true, "lock by string flag");
eq(P.isPriceLock(buy("pri_aa_y"), ENV), false, "ordinary price is not a lock");
eq(P.isPriceLock(buy("pri_aa_y", { price_lock: false }), ENV), false, "false flag");
eq(P.isPriceLock(buy("pri_single_lock"), {}), false, "locks unconfigured");

// ---- Teams: only the catalog price decides; a custom_data claim is ignored.
eq(P.teamsSeatQuantity(buy(TEAMS, null, 5), TEAMS), 5, "teams price, 5 seats");
eq(P.teamsSeatQuantity(buy("pri_x", null, 7, { plan: "teams" }), TEAMS), 7, "price flagged teams in the catalog");
eq(P.teamsSeatQuantity(buy(TEAMS, { plan: "teams", team_name: "Acme" }, 6), TEAMS), 6, "honest teams checkout");
eq(P.teamsSeatQuantity(buy("pri_single_m", { plan: "teams" }, 1), TEAMS), null, "single month claiming teams is not teams");
eq(P.teamsSeatQuantity(buy("pri_single_m", { plan: "teams" }, 50), TEAMS), null, "claiming teams with quantity 50");
eq(P.teamsSeatQuantity(buy("pri_aa_y", { plan: "teams" }), undefined), null, "teams claim with teams price unconfigured");
eq(P.teamsSeatQuantity(buy("pri_aa_y"), TEAMS), null, "ordinary subscription");
eq(P.teamsSeatQuantity({ items: [{ price: { id: TEAMS }, quantity: 3 }, { price: { id: TEAMS }, quantity: 2 }] }, TEAMS), 5, "seats summed across teams items");
eq(P.teamsSeatQuantity({ items: [{ price: { id: TEAMS }, quantity: 3 }, { price: { id: "pri_aa_y" }, quantity: 4 }] }, TEAMS), 3, "non-teams items not counted as seats");

// ---- Owner notification label: what was paid for.
eq(P.planLabel(buy("pri_single_m", { plan: "lifetime" }), ENV, TEAMS), "single month", "label shows the price, not the claim");
eq(P.planLabel(buy("pri_life"), ENV, TEAMS), "lifetime", "lifetime label");
eq(P.planLabel(buy("pri_aa_y"), ENV, TEAMS), "allaccess year", "all-access year label");
eq(P.planLabel(buy(TEAMS, null, 5), ENV, TEAMS), "teams", "teams label");
eq(P.planLabel(buy("pri_other", { plan: "lifetime" }), ENV, TEAMS), "", "unknown price: no label");

console.log(`${n - fails}/${n} checks passed${fails ? `, ${fails} FAILED` : ""}`);
process.exit(fails ? 1 : 0);
