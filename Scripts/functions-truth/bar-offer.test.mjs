// Unit checks for the announcement strip's discount offer.
//
// Four things here can cost real money if they drift, so each gets a test
// against the real source rather than a description of it.
//
//   The price list. An empty restrict_to means "every price in the account",
//   which would discount Teams. A partial list means the strip advertises
//   plans the code cannot touch, and the reader finds out at checkout.
//
//   codeFor() in pricing.html. Paddle refuses an ENTIRE checkout when a code
//   applies to no line in it, so carrying a BAR code into Teams turns a
//   purchase into a dead checkout. The function is extracted from the page
//   source and run, not reimplemented here, or the test would only prove the
//   copy agrees with itself.
//
//   The minted discount. Prefix, percent, single use, the 24-hour expiry and
//   recur, read off the actual Paddle request body.
//
//   The config bounds. A KV value is hand-edited by a person; 100% hands the
//   catalogue away.
//
// Run: node Scripts/functions-truth/bar-offer.test.mjs
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";

const ROOT = path.resolve(import.meta.dirname, "..", "..");
const esbuild = await import("esbuild");
const outFile = path.join(mkdtempSync(path.join(tmpdir(), "bar-offer-")), "offer.mjs");
await esbuild.build({
  entryPoints: [path.join(ROOT, "functions", "_lib", "offer.ts")],
  bundle: true, format: "esm", platform: "neutral", outfile: outFile, logLevel: "error",
});
const O = await import(pathToFileURL(outFile).href);

let n = 0, fails = 0;
function eq(actual, expected, label) {
  n++;
  try { assert.deepEqual(actual, expected); }
  catch { fails++; console.log(`  FAIL ${label}\n       got  ${JSON.stringify(actual)}\n       want ${JSON.stringify(expected)}`); }
}
function ok(cond, label) { eq(!!cond, true, label); }

const SIX = {
  PADDLE_PRICE_AA_MONTH: "pri_aa_m",
  PADDLE_PRICE_AA_QUARTER: "pri_aa_q",
  PADDLE_PRICE_AA_YEAR: "pri_aa_y",
  PADDLE_PRICE_SINGLE_MONTH: "pri_s_m",
  PADDLE_PRICE_SINGLE_YEAR: "pri_s_y",
  PADDLE_PRICE_LIFETIME: "pri_life",
};

// ---- the price list ------------------------------------------------------
{
  const r = O.allPlanPriceIds(SIX);
  eq(r.ids.length, 6, "all six individual prices are included");
  eq(r.missing, [], "nothing reported missing when all six are set");
}
{
  // Teams and the two lock prices must never be swept in by being present.
  const r = O.allPlanPriceIds({
    ...SIX,
    PADDLE_TEAMS_PRICE_ID: "pri_teams",
    PADDLE_PRICE_AA_YEAR_LOCK: "pri_aa_lock",
    PADDLE_PRICE_SINGLE_YEAR_LOCK: "pri_s_lock",
  });
  eq(r.ids.includes("pri_teams"), false, "Teams is never in the offer, even when configured");
  eq(r.ids.includes("pri_aa_lock"), false, "the All-Access lock price is never in the offer");
  eq(r.ids.includes("pri_s_lock"), false, "the Single lock price is never in the offer");
  eq(r.ids.length, 6, "a configured Teams price does not widen the list");
}
{
  const { PADDLE_PRICE_AA_QUARTER, ...five } = SIX;
  const r = O.allPlanPriceIds(five);
  eq(r.missing, ["PADDLE_PRICE_AA_QUARTER"], "an unset price is named, not silently dropped");
  eq(r.ids.length, 5, "the rest still resolve so the caller can decide");
}
{
  const r = O.allPlanPriceIds({});
  eq(r.ids, [], "nothing configured yields an empty list");
  eq(r.missing.length, 6, "and names all six, so the caller refuses rather than sending no restrict_to");
}

// ---- config bounds ------------------------------------------------------
const kv = (raw) => ({ KV: { get: async () => raw } });
{
  eq(await O.readBarOfferConfig(kv(null)), { percent: 20, hours: 24 },
    "the owner's defaults: 20% for 24 hours");
  eq(await O.readBarOfferConfig(kv('{"percent":25,"hours":72}')), { percent: 25, hours: 72 },
    "KV moves both without a deploy");
  eq((await O.readBarOfferConfig(kv('{"percent":100}'))).percent, 20,
    "100% is refused and falls back");
  eq((await O.readBarOfferConfig(kv('{"percent":0}'))).percent, 20,
    "0% is noise and falls back");
  eq((await O.readBarOfferConfig(kv('{"hours":0}'))).hours, 24,
    "an unhonourable window falls back");
  eq((await O.readBarOfferConfig(kv('{"hours":999}'))).hours, 24,
    "a window past 30 days is a price change, not a deadline");
  eq(await O.readBarOfferConfig(kv("not json")), { percent: 20, hours: 24 },
    "a corrupt KV value cannot break the read");
}

// ---- the minted discount, read off the real Paddle request --------------
{
  let sent = null;
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    sent = { url: String(url), body: JSON.parse(init.body) };
    return { ok: true, json: async () => ({ data: { id: "dsc_01barlive" } }) };
  };
  const before = Math.floor(Date.now() / 1000);
  const offer = await O.mintPersonalOffer(
    { PADDLE_API_KEY: "live_key", ...SIX },
    {
      email: "reader@example.com", percent: 20, hours: 24,
      priceIds: O.allPlanPriceIds(SIX).ids, prefix: "BAR", what: "any plan",
      siteOrigin: "https://r-statistics.co",
    },
  );
  globalThis.fetch = realFetch;

  ok(offer, "a code is minted");
  ok(/^BAR20[A-HJ-NP-Z2-9]{7}$/.test(offer.code),
    `code is BAR + percent + 7 unambiguous chars (got ${offer && offer.code})`);
  eq(sent.body.amount, "20", "Paddle is told 20%");
  eq(sent.body.usage_limit, 1, "single use");
  eq(sent.body.recur, true, "recurring, so the discount holds at renewal instead of jumping back");
  eq(sent.body.restrict_to.length, 6, "restricted to the six individual prices");
  eq(sent.body.restrict_to.includes("pri_teams"), false, "and never to Teams");
  const exp = Math.floor(Date.parse(sent.body.expires_at) / 1000);
  ok(exp - before >= 23 * 3600 && exp - before <= 25 * 3600,
    `expiry is about 24 hours out (got ${exp - before}s)`);
  /* Without this id nothing can match a code to the payment that redeemed it:
     payments.discount_id holds Paddle's id, never the code string. */
  eq(offer.discountId, "dsc_01barlive", "Paddle's discount id is kept, so a redemption can be counted");
}
{
  // Created but the body unreadable: still a success, because the discount is
  // live. Reporting failure here would mint a second live code.
  const realFetch = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: true, json: async () => { throw new Error("no body"); } });
  const offer = await O.mintPersonalOffer({ PADDLE_API_KEY: "k", ...SIX }, {
    email: "a@b.co", percent: 20, hours: 24, priceIds: O.allPlanPriceIds(SIX).ids, prefix: "BAR",
  });
  globalThis.fetch = realFetch;
  ok(offer, "an unreadable create response still yields a usable code");
  eq(offer.discountId, null, "and says plainly that the id is not known");
}
{
  // Paddle refused: no code, and no id to pretend otherwise.
  const realFetch = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: false, json: async () => ({}) });
  const offer = await O.mintPersonalOffer({ PADDLE_API_KEY: "k", ...SIX }, {
    email: "a@b.co", percent: 20, hours: 24, priceIds: O.allPlanPriceIds(SIX).ids, prefix: "BAR",
  });
  globalThis.fetch = realFetch;
  eq(offer, null, "a refused create mints nothing");
}
{
  // A missing key must refuse rather than mint something unusable.
  const offer = await O.mintPersonalOffer({ ...SIX }, {
    email: "a@b.co", percent: 20, hours: 24, priceIds: O.allPlanPriceIds(SIX).ids, prefix: "BAR",
  });
  eq(offer, null, "no Paddle key means no code, not a broken one");
}

// ---- codeFor(), extracted from pricing.html and actually run ------------
{
  const page = readFileSync(path.join(ROOT, "pricing.html"), "utf8");
  const m = page.match(/function codeFor\(term\)\{[\s\S]*?\n\}/);
  ok(m, "codeFor is still findable in pricing.html");
  // eslint-disable-next-line no-new-func
  const make = new Function("recoveryCode", `${m[0]}; return codeFor;`);

  const bar = make("BAR20QRSTKMN");
  eq(bar("year"), "BAR20QRSTKMN", "a BAR code rides the annual checkout");
  eq(bar("month"), "BAR20QRSTKMN", "and the monthly one");
  eq(bar("once"), "BAR20QRSTKMN", "and Lifetime");
  eq(bar("teams"), undefined,
    "but NEVER Teams: Paddle refuses a whole checkout a code cannot apply to");

  // The existing programmes must not have shifted underneath this change.
  const pro = make("PRO23ABCDEFG");
  eq(pro("year"), "PRO23ABCDEFG", "PRO codes still work on annual");
  eq(pro("month"), undefined, "PRO codes are still annual-only");
  eq(pro("once"), undefined, "PRO codes still never reach Lifetime");

  const track = make("TRACK20ABCDEF");
  eq(track("year"), "TRACK20ABCDEF", "TRACK codes still work on annual");
  eq(track("once"), "TRACK20ABCDEF", "and on Lifetime");
  eq(track("month"), undefined, "and still not monthly");

  eq(make("")("year"), undefined, "no code, no discount");
}

// ---- the banner reads BAR's own percent ---------------------------------
{
  const page = readFileSync(path.join(ROOT, "pricing.html"), "utf8");
  const re = page.match(/recoveryCode\.match\((\/\^\(\?:[A-Z|]+\)\(\\d\{1,2\}\)\/)\)/);
  ok(re, "the banner's percent regex is still findable");
  const pct = (code) => (code.match(eval(re[1])) || [0, "23"])[1];
  eq(pct("BAR20QRSTKMN"), "20",
    "the banner reads 20 off a BAR20 code; without BAR in the list it fell through to the 23 default");
  eq(pct("PRO23ABCDEFG"), "23", "and still reads the existing programmes correctly");
}

console.log(fails ? `\n${n - fails}/${n} checks passed, ${fails} FAILED` : `${n}/${n} checks passed`);
process.exit(fails ? 1 : 0);
