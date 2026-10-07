// Unit checks for functions/_lib/signup-site.ts (shared Supabase project:
// which site mirrors, counts and announces an account). Run:
//   node Scripts/functions-truth/signup-site.test.mjs
// The same file runs unchanged on the sister site (the checks name both site
// keys explicitly).
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";

const ROOT = path.resolve(import.meta.dirname, "..", "..");
const esbuild = await import("esbuild");
const outFile = path.join(mkdtempSync(path.join(tmpdir(), "signup-site-")), "signup-site.mjs");
await esbuild.build({
  entryPoints: [path.join(ROOT, "functions", "_lib", "signup-site.ts")],
  bundle: true, format: "esm", platform: "neutral", outfile: outFile, logLevel: "error",
});
const S = await import(pathToFileURL(outFile).href);

let n = 0, fails = 0;
function eq(actual, expected, label) {
  n++;
  try { assert.deepEqual(actual, expected); }
  catch { fails++; console.log(`  FAIL ${label}\n       got  ${JSON.stringify(actual)}\n       want ${JSON.stringify(expected)}`); }
}
const ML = "mlplus", RSC = "rstatistics";
const H = 3600;

// ---- siteTag: user_metadata is user-writable, so only a well-formed key counts.
eq(S.siteTag({ site: "mlplus", name: "A" }), "mlplus", "tag read");
eq(S.siteTag({ site: " rstatistics " }), "rstatistics", "tag trimmed");
eq(S.siteTag({}), "", "no tag");
eq(S.siteTag(null), "", "null metadata");
eq(S.siteTag({ site: 7 }), "", "non-string tag");
eq(S.siteTag({ site: "<script>" }), "", "malformed tag treated as untagged");
eq(S.siteTag({ site: "x".repeat(33) }), "", "overlong tag treated as untagged");

// ---- supabaseTime: auth API and webhook (database) forms.
const T = Date.UTC(2026, 9, 7, 6, 57, 1) / 1000;
eq(S.supabaseTime("2026-10-07T06:57:01.123456Z"), T, "API form with microseconds");
eq(S.supabaseTime("2026-10-07T06:57:01Z"), T, "API form without fraction");
eq(S.supabaseTime("2026-10-07 06:57:01.123456+00"), T, "database form, short offset");
eq(S.supabaseTime("2026-10-07T12:27:01.5+05:30"), T, "explicit offset");
eq(Number.isNaN(S.supabaseTime("")), true, "empty is NaN");
eq(Number.isNaN(S.supabaseTime(null)), true, "null is NaN");
eq(Number.isNaN(S.supabaseTime("not a date")), true, "garbage is NaN");

// ---- accountTime: later of creation and confirmation.
eq(S.accountTime({ created_at: "2026-10-07T06:57:01Z", email_confirmed_at: "2026-10-07T07:57:01Z" }), T + H, "magic link clicked an hour after the request: confirmation wins");
eq(S.accountTime({ created_at: "2026-10-07T06:57:01Z", email_confirmed_at: null }), T, "unconfirmed: creation");
eq(S.accountTime({ created_at: "2026-10-07T06:57:01Z", confirmed_at: "2026-10-07T06:57:02Z" }), T + 1, "confirmed_at fallback");
eq(S.accountTime({ email_confirmed_at: "2026-10-07T06:57:01Z" }), T, "creation missing: confirmation");
eq(Number.isNaN(S.accountTime({})), true, "nothing known: NaN");

// ---- webhookPlan (rule 2).
eq(S.webhookPlan("INSERT", ML, ML), { own: true, mirror: "upsert" }, "own INSERT creates the row");
eq(S.webhookPlan("UPDATE", ML, ML), { own: true, mirror: "upsert" }, "own UPDATE upserts");
eq(S.webhookPlan("INSERT", RSC, ML), { own: false, mirror: "skip" }, "other site's INSERT never enters this database");
eq(S.webhookPlan("INSERT", "", ML), { own: false, mirror: "skip" }, "untagged INSERT (OAuth) is mirrored by no webhook");
eq(S.webhookPlan("INSERT", "", RSC), { own: false, mirror: "skip" }, "untagged INSERT skipped on rsc too (no home site)");
eq(S.webhookPlan("UPDATE", RSC, ML), { own: false, mirror: "refresh" }, "other site's UPDATE refreshes an existing row only");
eq(S.webhookPlan("UPDATE", "", RSC), { own: false, mirror: "refresh" }, "legacy untagged UPDATE keeps rsc rows current");
eq(S.webhookPlan("DELETE", RSC, ML), { own: false, mirror: "delete" }, "DELETE applies everywhere");
eq(S.webhookPlan("DELETE", "", ML).mirror, "delete", "untagged DELETE applies");
eq(S.webhookPlan("TRUNCATE", ML, ML), { own: false, mirror: "skip" }, "unknown event type ignored");

// ---- classifyFirstSight (rule 3). firstSeenAt = when this site created its row.
const C = (tag, siteKey, lagSec, accountAt = T) =>
  S.classifyFirstSight({ tag, siteKey, accountAt, firstSeenAt: accountAt + lagSec });
eq(C("", ML, 5), { kind: "claim", signupSite: ML, writeTag: true, notify: true }, "Google signup landing on ML+: claimed, tagged, announced");
eq(C("", RSC, 5), { kind: "claim", signupSite: RSC, writeTag: true, notify: true }, "Google signup landing on rsc: claimed by rsc");
eq(C("", ML, S.CLAIM_WINDOW_SEC), { kind: "claim", signupSite: ML, writeTag: true, notify: true }, "claim window is inclusive");
eq(C("", ML, S.CLAIM_WINDOW_SEC + 1), { kind: "legacy", signupSite: null, writeTag: false, notify: false }, "untagged and older: pre-existing account, not a signup here");
eq(C("", ML, 400 * 86400), { kind: "legacy", signupSite: null, writeTag: false, notify: false }, "legacy rsc account's first ML+ visit: row only");
eq(C(RSC, ML, 5), { kind: "other-site", signupSite: RSC, writeTag: false, notify: false }, "rsc-tagged account visiting ML+ minutes after signup: never ML+'s");
eq(C(ML, RSC, 30 * 86400), { kind: "other-site", signupSite: ML, writeTag: false, notify: false }, "ML+ account's first rsc visit");
eq(C(ML, ML, 10), { kind: "own", signupSite: ML, writeTag: false, notify: true }, "own tag, webhook missed: attributed and announced");
eq(C(ML, ML, S.NOTIFY_WINDOW_SEC + 1), { kind: "own", signupSite: ML, writeTag: false, notify: false }, "own tag first seen days later (preview account on production): no stale email");
eq(C("", ML, -120), { kind: "claim", signupSite: ML, writeTag: true, notify: true }, "edge clock behind Supabase counts as zero lag");
eq(S.classifyFirstSight({ tag: "", siteKey: ML, accountAt: NaN, firstSeenAt: T }),
  { kind: "legacy", signupSite: null, writeTag: false, notify: false }, "unknown account age: never claim, never announce");
eq(S.classifyFirstSight({ tag: ML, siteKey: ML, accountAt: NaN, firstSeenAt: T }).notify, false, "own tag with unknown age: attributed, not announced");

// ---- signupSourceFromMeta.
eq(S.signupSourceFromMeta({ signup_page: "/x/", signup_trigger: "content-gate", signup_next: "", site: ML }),
  { page: "/x/", trigger: "content-gate", next: undefined }, "magic-link attribution");
eq(S.signupSourceFromMeta({ full_name: "A" }), { page: undefined, trigger: undefined, next: undefined }, "OAuth metadata has none");
eq(S.signupSourceFromMeta(undefined), { page: undefined, trigger: undefined, next: undefined }, "no metadata");

console.log(fails ? `\n${n - fails}/${n} checks passed, ${fails} FAILED` : `\n${n}/${n} checks passed`);
process.exit(fails ? 1 : 0);
