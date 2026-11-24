// Unit checks for functions/_lib/form-guard.ts: who is allowed to post to the
// public forms. Run:
//   node Scripts/functions-truth/form-guard.test.mjs
//
// WHAT THIS LOCKS DOWN. On 2026-11-23 a bot submitted nine times to
// /api/feedback and once to /api/contact. /api/contact accepted it because its
// origin test read `if (origin && origin !== env.SITE_ORIGIN)`: with no Origin
// header the guard skipped itself, so a curl POST reached sendMail. The first
// check below is that exact regression, and it fails against the old code.
//
// The second class of bug in the same line was the opposite one: a bare
// equality test against SITE_ORIGIN rejected www.r-statistics.co and every
// *.r-statistics-co.pages.dev preview, which broke the contact form on branch
// deploys. Those are checked too, because a fix that only tightens the guard
// would have left the contact form broken in preview.
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";

const ROOT = path.resolve(import.meta.dirname, "..", "..");
const esbuild = await import("esbuild");
const outFile = path.join(mkdtempSync(path.join(tmpdir(), "form-guard-")), "form-guard.mjs");
await esbuild.build({
  entryPoints: [path.join(ROOT, "functions", "_lib", "form-guard.ts")],
  bundle: true, format: "esm", platform: "neutral", outfile: outFile, logLevel: "error",
});
const G = await import(pathToFileURL(outFile).href);

let n = 0, fails = 0;
function eq(actual, expected, label) {
  n++;
  try { assert.deepEqual(actual, expected); }
  catch { fails++; console.log(`  FAIL ${label}\n       got  ${JSON.stringify(actual)}\n       want ${JSON.stringify(expected)}`); }
}

const ENV = { SITE_ORIGIN: "https://r-statistics.co" };

// A minimal stand-in for the headers of an incoming request.
function req(headers = {}) {
  const lower = {};
  for (const k of Object.keys(headers)) lower[k.toLowerCase()] = headers[k];
  return { headers: { get: (k) => (k.toLowerCase() in lower ? lower[k.toLowerCase()] : null) } };
}

const BROWSER = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "Sec-Fetch-Site": "same-origin",
  "Sec-Fetch-Mode": "cors",
};

console.log("originAllowed");
// THE REGRESSION. A curl POST sends no Origin; it must never be let through.
eq(G.originAllowed(null, ENV), false, "no Origin header is refused");
eq(G.originAllowed("", ENV), false, "empty Origin is refused");
eq(G.originAllowed("null", ENV), false, "literal 'null' Origin is refused");
// The other half: our own hosts must all still work.
eq(G.originAllowed("https://r-statistics.co", ENV), true, "apex allowed");
eq(G.originAllowed("https://www.r-statistics.co", ENV), true, "www allowed");
eq(G.originAllowed("https://harden-public-forms.r-statistics-co.pages.dev", ENV), true, "preview deploy allowed");
/* URL() drops a default port, so :443 normalises to the bare host and is
   allowed. Worth asserting rather than assuming: on http it would not. */
eq(G.originAllowed("https://r-statistics.co:443", ENV), true, "default https port normalises to the apex");
eq(G.originAllowed("https://r-statistics.co:8443", ENV), false, "a non-default port is a different host");
// And nobody else's.
eq(G.originAllowed("https://evil.example", ENV), false, "third-party origin refused");
// A lookalike that ends with our preview suffix only as a subdomain label.
eq(G.originAllowed("https://r-statistics-co.pages.dev.evil.example", ENV), false, "suffix lookalike refused");
eq(G.originAllowed("not a url", ENV), false, "unparseable Origin refused");
// A malformed SITE_ORIGIN must not throw a good request away.
eq(G.originAllowed("https://r-statistics.co", { SITE_ORIGIN: ":::" }), true, "bad SITE_ORIGIN does not break the apex");

console.log("browserShaped");
eq(G.browserShaped(req(BROWSER)), true, "a browser fetch passes");
eq(G.browserShaped(req({})), false, "no headers at all is refused");
eq(G.browserShaped(req({ "User-Agent": "curl/8.4.0" })), true, "a UA alone is tolerated");
eq(G.browserShaped(req({ ...BROWSER, "Sec-Fetch-Site": "cross-site" })), false, "cross-site fetch refused");
eq(G.browserShaped(req({ ...BROWSER, "Sec-Fetch-Site": "none" })), false, "direct navigation refused");
eq(G.browserShaped(req({ ...BROWSER, "Sec-Fetch-Site": "same-site" })), true, "same-site (www) allowed");
eq(G.browserShaped(req({ "Sec-Fetch-Site": "same-origin" })), false, "no User-Agent refused");

console.log("guardHeaders");
eq(G.guardHeaders(req({ ...BROWSER, Origin: "https://r-statistics.co" }), ENV), null, "our own form passes both gates");
const noOrigin = G.guardHeaders(req(BROWSER), ENV);
eq(noOrigin === null, false, "a missing Origin is denied");
eq(noOrigin.status, 403, "denied with 403");

console.log("verifyTurnstile");
// Inert with no secret: this is what keeps the forms working before the keys exist.
eq(await G.verifyTurnstile({}, "", "1.2.3.4"), { ok: true, skipped: true, reason: "no_secret" },
  "no secret configured means nothing is checked");
// With a secret, a missing token is reported as such. Whether that is fatal is
// guardChallenge's decision, not this function's.
eq(await G.verifyTurnstile({ TURNSTILE_SECRET: "s" }, "", "1.2.3.4"),
  { ok: false, skipped: false, reason: "missing_token" }, "missing token reported");

// siteverify responses, with fetch stubbed.
const realFetch = globalThis.fetch;
async function withSiteverify(reply, fn) {
  globalThis.fetch = async () => ({ json: async () => reply });
  try { return await fn(); } finally { globalThis.fetch = realFetch; }
}
eq(await withSiteverify({ success: true }, () => G.verifyTurnstile({ TURNSTILE_SECRET: "s" }, "tok", "1.2.3.4")),
  { ok: true, skipped: false, reason: "verified" }, "a good token verifies");
eq(await withSiteverify({ success: false, "error-codes": ["timeout-or-duplicate"] },
  () => G.verifyTurnstile({ TURNSTILE_SECRET: "s" }, "tok", "1.2.3.4")),
  { ok: false, skipped: false, reason: "timeout-or-duplicate" }, "a replayed token is refused");
// An outage at Cloudflare must not take the contact form down with it.
globalThis.fetch = async () => { throw new Error("network down"); };
eq(await G.verifyTurnstile({ TURNSTILE_SECRET: "s" }, "tok", "1.2.3.4"),
  { ok: true, skipped: true, reason: "siteverify_unreachable" }, "siteverify outage fails open");
globalThis.fetch = realFetch;

console.log("guardChallenge");
const kv = (flag) => ({ KV: { get: async (k) => (k === "flag:form-strict-turnstile" ? flag : null) } });
// Lenient (the shipped default): no token is tolerated, because browsers still
// hold a cached copy of the old feedback widget that cannot send one.
let out = await G.guardChallenge(req(BROWSER), { ...kv(null), TURNSTILE_SECRET: "s" }, "");
/* The label matters as much as the verdict: the audit row says the submission
   was let through WITHOUT a token, so these are countable once Turnstile is
   live and the owner can see when it is safe to turn strict mode on. */
eq([out.deny, out.turnstile], [null, "tolerated_missing_token"], "lenient mode tolerates a missing token, and records that it did");
// Strict: the same request is refused.
out = await G.guardChallenge(req(BROWSER), { ...kv("on"), TURNSTILE_SECRET: "s" }, "");
eq(out.deny === null, false, "strict mode refuses a missing token");
eq(out.deny.status, 403, "refused with 403");
// A token that is present and bad is refused in BOTH modes. This is the case
// that matters: it is the only outcome a bot can actually produce.
out = await withSiteverify({ success: false, "error-codes": ["invalid-input-response"] },
  () => G.guardChallenge(req(BROWSER), { ...kv(null), TURNSTILE_SECRET: "s" }, "forged"));
eq([out.deny === null, out.deny.status, out.turnstile],
  [false, 403, "invalid-input-response"], "a forged token is refused even in lenient mode");
// And with no secret at all nothing is refused, which is today's live state.
out = await G.guardChallenge(req(BROWSER), kv(null), "");
eq([out.deny, out.turnstile], [null, "no_secret"], "no secret means no refusal");
// A KV read failure must not hand out strict mode or deny a submission.
out = await G.guardChallenge(req(BROWSER), { KV: { get: async () => { throw new Error("kv down"); } } }, "");
eq([out.deny, out.turnstile], [null, "no_secret"], "a KV failure stays lenient");

console.log("clientMeta");
const m = G.clientMeta({
  ...req({ "CF-Connecting-IP": "203.0.113.9", "User-Agent": "UA/1.0", "CF-IPCountry": "US", "CF-Ray": "abc-DEL" }),
  cf: { asn: 64512 },
});
eq(m, { ip: "203.0.113.9", ua: "UA/1.0", country: "US", ray: "abc-DEL", asn: 64512 }, "all five facts captured");
const bare = G.clientMeta(req({}));
eq(bare, { ip: "0.0.0.0", ua: "", country: null, ray: null, asn: null }, "nothing invented when headers are absent");

console.log(`\n${n - fails}/${n} checks passed`);
process.exit(fails ? 1 : 0);
