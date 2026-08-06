/* Unit tests for functions/_lib/fulfilment.ts (customer purchase email +
   renewal reminder).

   Run:  node Scripts/functions-truth/test-fulfilment-email.mjs

   There is no test runner in this repo, so this follows the Scripts/tool-truth
   convention: a plain node script with a self-rolled assertion harness that
   exits non-zero on any failure. The module under test is bundled with the
   esbuild already present in node_modules (wrangler ships it), because the
   source imports './email' without a file extension and Node's ESM resolver
   cannot load that directly.

   Nothing here talks to the network. globalThis.fetch is stubbed, so the
   assertions cover the REAL sendMail path including the exact JSON body
   ZeptoMail would receive. KV and D1 are in-memory fakes.

   What is covered: money/date formatting (including the zero-decimal currency
   trap), plan-to-copy mapping, both templates verbatim-ish, the house no-em-dash
   rule, the three idempotency layers, flag-off observability, marker release on
   a failed send, and the renewal sweep's throttle + per-period dedup. */

import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = path.resolve(import.meta.dirname, "..", "..");
let esbuild;
try {
  esbuild = await import("esbuild");
} catch (_) {
  console.error("esbuild not resolvable from node_modules. Run: npm install");
  process.exit(2);
}
const outFile = path.join(mkdtempSync(path.join(tmpdir(), "fulfil-")), "fulfilment.mjs");
await esbuild.build({
  entryPoints: [path.join(ROOT, "functions", "_lib", "fulfilment.ts")],
  bundle: true, format: "esm", platform: "neutral", outfile: outFile, logLevel: "error",
});

const F = await import(pathToFileURL(outFile).href);

// ------------------------------------------------------------------ harness
let checks = 0, fails = 0;
function ok(label, cond, detail) {
  checks++;
  if (!cond) { fails++; console.log(`  FAIL ${label}${detail ? `: ${detail}` : ""}`); }
}
function eq(label, got, want) {
  ok(label, got === want, `got ${JSON.stringify(got)} want ${JSON.stringify(want)}`);
}
function has(label, hay, needle) {
  ok(label, String(hay).includes(needle), `missing ${JSON.stringify(needle)}`);
}
function lacks(label, hay, needle) {
  ok(label, !String(hay).includes(needle), `unexpectedly contains ${JSON.stringify(needle)}`);
}
function section(name) { console.log(`\n${name}`); }

// -------------------------------------------------------------- fake bindings
function fakeKV(seed = {}) {
  const map = new Map(Object.entries(seed));
  return {
    map,
    get: async (k) => (map.has(k) ? map.get(k) : null),
    put: async (k, v) => { map.set(k, v); },
    delete: async (k) => { map.delete(k); },
  };
}

// Minimal D1 shim: records every audit_log insert, and replays a canned result
// set for the sweep's SELECT.
function fakeDB(selectRows = []) {
  const audits = [];
  return {
    audits,
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async run() {
              if (/INSERT INTO audit_log/.test(sql)) {
                const [user_id, action, ref, meta_json] = args;
                audits.push({ user_id, action, ref, meta: JSON.parse(meta_json) });
              }
              return { meta: { changes: 1 } };
            },
            async all() { return { results: selectRows }; },
            async first() { return null; },
          };
        },
      };
    },
  };
}

function baseEnv(overrides = {}) {
  return {
    DB: fakeDB(overrides.rows || []),
    KV: fakeKV(overrides.kv || {}),
    ZOHO_ZEPTOMAIL_TOKEN: "Zoho-enczapikey TEST",
    ZOHO_ZEPTOMAIL_SENDER: "noreply@r-statistics.co",
    PADDLE_API_KEY: overrides.paddleKey ?? "pdl_sdbx_test",
  };
}

// fetch stub: routes ZeptoMail vs Paddle, records every send.
const sends = [];
let zeptoStatus = 201;
let paddleSub = null;
globalThis.fetch = async (url, init) => {
  const u = String(url);
  if (u.includes("zeptomail")) {
    sends.push({ url: u, body: JSON.parse(init.body), auth: init.headers.Authorization });
    return {
      ok: zeptoStatus < 300,
      status: zeptoStatus,
      json: async () => ({ data: [{ code: "EM_104", message: "OK" }], message: "OK" }),
    };
  }
  if (u.includes("/subscriptions/")) {
    if (!paddleSub) return { ok: false, status: 404, json: async () => ({}) };
    return { ok: true, status: 200, json: async () => ({ data: paddleSub }) };
  }
  throw new Error(`unexpected fetch to ${u}`);
};
function resetSends() { sends.length = 0; zeptoStatus = 201; }

const SEP_2027 = Math.floor(Date.parse("2027-09-08T09:30:00Z") / 1000);

// ------------------------------------------------------------------- 1. money
section("formatMoney");
eq("EUR lifetime total", F.formatMoney("31987", "eur"), "319.87 EUR");
eq("USD annual total", F.formatMoney("7215", "USD"), "72.15 USD");
eq("zero-decimal JPY is not divided", F.formatMoney("1000", "JPY"), "1000 JPY");
eq("zero-decimal KRW", F.formatMoney("29000", "krw"), "29000 KRW");
eq("missing total", F.formatMoney(null, "USD"), "");
eq("missing currency", F.formatMoney("100", ""), "");
eq("non-numeric total", F.formatMoney("12.34", "USD"), "");
eq("empty string total", F.formatMoney("", "USD"), "");

// -------------------------------------------------------------------- 2. date
section("formatDate / isoToUnix");
eq("UTC date renders long-form", F.formatDate(SEP_2027), "8 September 2027");
eq("null date", F.formatDate(null), "");
eq("undefined date", F.formatDate(undefined), "");
eq("iso to unix", F.isoToUnix("2027-09-08T09:30:00Z"), SEP_2027);
eq("iso null", F.isoToUnix(null), null);
eq("iso garbage", F.isoToUnix("not a date"), null);

// -------------------------------------------------------------- 3. describePlan
section("describePlan");
const life = F.describePlan("lifetime", null);
eq("lifetime start is the dashboard", life.startUrl, "https://r-statistics.co/dashboard.html");
has("lifetime noun", life.noun, "lifetime access");
eq("lifetime has no billing term", life.term, "");
const single = F.describePlan("single_year", "ds");
eq("single ds start is its roadmap", single.startUrl, "https://r-statistics.co/roadmap/data-scientist.html");
eq("single ds noun", single.noun, "the Data Scientist track");
eq("single ds term", single.term, "billed yearly");
eq("single ds list label", single.listLabel, "Data Scientist track, billed yearly");
eq("forecaster roadmap", F.describePlan("single_year", "ts").startUrl, "https://r-statistics.co/roadmap/forecaster.html");
eq("unknown track falls back to dashboard", F.describePlan("single_year", "zzz").startUrl, "https://r-statistics.co/dashboard.html");
eq("all-access monthly term", F.describePlan("allaccess_month", null).term, "billed monthly");
eq("all-access yearly term", F.describePlan("allaccess_year", null).term, "billed yearly");

// ------------------------------------------------------------ 4. house style
section("house style (no em-dash anywhere)");
const lifeMail = F.buildLifetimeEmail({
  name: "Selva Prabhakaran", email: "selva@r-statistics.co", money: "319.87 EUR",
  startUrl: life.startUrl, startLine: life.startLine,
});
const subMail = F.buildSubscriptionEmail({
  name: "Selva", email: "selva@r-statistics.co", planNoun: single.noun, planTerm: single.term,
  money: "72.15 USD", renewalDate: "8 September 2027", renewalMoney: "72.15 USD",
  startUrl: single.startUrl, startLine: single.startLine, remindBeforeRenewal: true,
});
const remMail = F.buildRenewalReminderEmail({
  name: "Selva", planLabel: single.listLabel,
  renewalDate: "8 September 2027", renewalMoney: "72.15 USD",
});
for (const [n, m] of [["lifetime", lifeMail], ["subscription", subMail], ["reminder", remMail]]) {
  lacks(`${n} subject has no em-dash`, m.subject, "—");
  lacks(`${n} text has no em-dash`, m.textBody, "—");
  lacks(`${n} html has no em-dash`, m.htmlBody, "—");
  lacks(`${n} text has no en-dash`, m.textBody, "–");
}

// -------------------------------------------------------- 5. lifetime template
section("lifetime template");
eq("subject", lifeMail.subject, "Your r-statistics.co lifetime access is open");
has("greets by first name only", lifeMail.textBody, "Hi Selva,");
has("states one-time payment", lifeMail.textBody, "one-time payment");
has("states no further charge", lifeMail.textBody, "no further charge, ever");
has("names the amount", lifeMail.textBody, "319.87 EUR");
has("names the account", lifeMail.textBody, "selva@r-statistics.co");
has("one start link", lifeMail.textBody, "https://r-statistics.co/dashboard.html");
has("human contact", lifeMail.textBody, "support@r-statistics.co");
ok("never mentions a renewal date", !/renews on/i.test(lifeMail.textBody));
ok("never mentions cancelling", !/cancel/i.test(lifeMail.textBody));
lacks("no billing page link", lifeMail.textBody, "account-billing");
has("html carries the CTA", lifeMail.htmlBody, "Start learning");
eq("no-name greeting", F.buildLifetimeEmail({
  name: null, email: "a@b.co", money: "", startUrl: "https://x", startLine: "y",
}).textBody.split("\n")[0], "Hi,");
has("amount omitted cleanly when unknown", F.buildLifetimeEmail({
  name: null, email: "a@b.co", money: "", startUrl: "https://x", startLine: "y",
}).textBody, "You bought lifetime access to r-statistics.co. That was a one-time payment");

// ---------------------------------------------------- 6. subscription template
section("subscription template");
eq("subject", subMail.subject, "Your r-statistics.co access is open");
has("names what they bought, price before the billing term", subMail.textBody, "You bought the Data Scientist track for 72.15 USD, billed yearly.");
has("names the renewal date and amount", subMail.textBody, "It renews automatically on 8 September 2027 for 72.15 USD.");
has("says how to cancel", subMail.textBody, "https://r-statistics.co/account-billing.html");
has("says access survives cancelling", subMail.textBody, "you keep access until 8 September 2027");
has("promises the reminder when it is on", subMail.textBody, "We email you 7 days before that charge");
has("one start link", subMail.textBody, "https://r-statistics.co/roadmap/data-scientist.html");
has("human contact", subMail.textBody, "support@r-statistics.co");
const subNoRemind = F.buildSubscriptionEmail({
  name: "Selva", email: "a@b.co", planNoun: single.noun, planTerm: single.term, money: "72.15 USD",
  renewalDate: "8 September 2027", renewalMoney: "72.15 USD",
  startUrl: single.startUrl, startLine: single.startLine, remindBeforeRenewal: false,
});
lacks("no reminder promise when the reminder flag is off", subNoRemind.textBody, "7 days before");
const subNoDate = F.buildSubscriptionEmail({
  name: null, email: "a@b.co", planNoun: single.noun, planTerm: single.term, money: "", renewalDate: "",
  renewalMoney: "", startUrl: "https://x", startLine: "y", remindBeforeRenewal: false,
});
has("degrades honestly with no renewal date", subNoDate.textBody, "It renews automatically at the end of each billing period.");
lacks("never invents a renewal date", subNoDate.textBody, "undefined");

// ------------------------------------------------------- 7. reminder template
section("renewal reminder template");
eq("subject names the date", remMail.subject, "Your r-statistics.co subscription renews on 8 September 2027");
has("says no action needed", remMail.textBody, "If you want to keep it, do nothing.");
has("lists the amount", remMail.textBody, "Amount: 72.15 USD");
has("says how to stop it", remMail.textBody, "https://r-statistics.co/account-billing.html");
const remNoMoney = F.buildRenewalReminderEmail({
  name: null, planLabel: "All-Access, billed yearly", renewalDate: "1 March 2028", renewalMoney: "",
});
lacks("omits the amount line rather than guessing", remNoMoney.textBody, "Amount:");

// ------------------------------------------------- 8. flag off = observable
section("flag off (default): logs, never sends");
resetSends();
{
  const env = baseEnv();
  await F.sendFulfilmentEmail(env, {
    kind: "lifetime", refId: "txn_01", userId: "u1",
    to: { email: "buyer@example.com", name: "Buyer" },
    plan: "lifetime", money: "319.87 EUR",
  });
  eq("no email sent", sends.length, 0);
  eq("one audit row", env.DB.audits.length, 1);
  eq("audit action", env.DB.audits[0].action, "fulfilment.email.skipped_flag_off");
  eq("audit ref is the transaction", env.DB.audits[0].ref, "txn_01");
  has("audit records the recipient", env.DB.audits[0].meta.to, "buyer@example.com");
  has("audit records the subject", env.DB.audits[0].meta.subject, "lifetime access is open");
  has("audit records the full body", env.DB.audits[0].meta.would_have_sent, "one-time payment");
  ok("once-marker NOT burned while the flag is off", !env.KV.map.has("fulfil-emailed:txn_01"));
}

// ----------------------------------------------------- 9. flag on = one send
section("flag on: sends exactly once");
resetSends();
{
  const env = baseEnv({ kv: { "flag:fulfilment-email": "on" } });
  const plan = {
    kind: "lifetime", refId: "txn_02", userId: "u1",
    to: { email: "buyer@example.com", name: "Buyer" },
    plan: "lifetime", money: "319.87 EUR",
  };
  await F.sendFulfilmentEmail(env, plan);
  eq("one email sent", sends.length, 1);
  eq("recipient", sends[0].body.to[0].email_address.address, "buyer@example.com");
  eq("sender", sends[0].body.from.address, "noreply@r-statistics.co");
  eq("reply-to reaches a human", sends[0].body.reply_to[0].address, "support@r-statistics.co");
  ok("html body present", typeof sends[0].body.htmlbody === "string" && sends[0].body.htmlbody.length > 200);
  ok("text body present", typeof sends[0].body.textbody === "string" && sends[0].body.textbody.length > 200);
  eq("audit action", env.DB.audits[0].action, "fulfilment.email.sent");
  eq("audit status", env.DB.audits[0].meta.status, 201);
  ok("once-marker set", env.KV.map.has("fulfil-emailed:txn_02"));

  // Layer 2 of idempotency: a second delivery of the SAME transaction under a
  // different event id must not mail the customer again.
  await F.sendFulfilmentEmail(env, plan);
  eq("replay sends nothing further", sends.length, 1);
  eq("replay is audited", env.DB.audits[1].action, "fulfilment.email.skipped");
  eq("replay reason", env.DB.audits[1].meta.reason, "already_sent");
}

// --------------------------------------------- 10. failed send releases claim
section("failed send releases the claim so a retry can work");
resetSends();
{
  const env = baseEnv({ kv: { "flag:fulfilment-email": "on" } });
  zeptoStatus = 400;
  const plan = {
    kind: "lifetime", refId: "txn_03", userId: "u1",
    to: { email: "buyer@example.com" }, plan: "lifetime", money: "319.87 EUR",
  };
  await F.sendFulfilmentEmail(env, plan);
  eq("attempted", sends.length, 1);
  eq("audited as failed", env.DB.audits[0].action, "fulfilment.email.failed");
  eq("failure status recorded", env.DB.audits[0].meta.status, 400);
  ok("marker released", !env.KV.map.has("fulfil-emailed:txn_03"));

  zeptoStatus = 201;
  await F.sendFulfilmentEmail(env, plan);
  eq("retry sends", sends.length, 2);
  eq("retry audited as sent", env.DB.audits[1].action, "fulfilment.email.sent");
}

// --------------------------------- 11. subscription pulls the authoritative renewal
section("subscription: renewal figures come from Paddle, not from the amount paid");
resetSends();
{
  paddleSub = {
    status: "active",
    next_billed_at: "2027-09-08T09:30:00Z",
    next_transaction: { details: { totals: { total: "9000", currency_code: "USD" } } },
  };
  const env = baseEnv({ kv: { "flag:fulfilment-email": "on", "flag:renewal-reminder": "on" } });
  await F.sendFulfilmentEmail(env, {
    kind: "subscription", refId: "txn_04", userId: "u1",
    to: { email: "buyer@example.com", name: "Buyer" },
    plan: "single_year", track: "ds",
    money: "72.15 USD",                    // first period, discounted
    renewalAt: Math.floor(Date.parse("2027-01-01T00:00:00Z") / 1000), // stale fallback
    subscriptionId: "sub_01",
  });
  eq("one email", sends.length, 1);
  has("uses Paddle's next charge, not the discounted amount",
    sends[0].body.textbody, "It renews automatically on 8 September 2027 for 90.00 USD.");
  has("still states what was actually paid", sends[0].body.textbody,
    "You bought the Data Scientist track for 72.15 USD, billed yearly.");
  has("promises the reminder because that flag is on", sends[0].body.textbody, "7 days before");
  paddleSub = null;
}

section("subscription: Paddle unreachable falls back to the transaction period");
resetSends();
{
  paddleSub = null; // 404
  const env = baseEnv({ kv: { "flag:fulfilment-email": "on" } });
  await F.sendFulfilmentEmail(env, {
    kind: "subscription", refId: "txn_05", userId: "u1",
    to: { email: "buyer@example.com" }, plan: "allaccess_year",
    money: "99.00 USD", renewalAt: SEP_2027, subscriptionId: "sub_02",
  });
  has("falls back to billing_period.ends_at", sends[0].body.textbody, "on 8 September 2027");
  lacks("no reminder promise (flag off)", sends[0].body.textbody, "7 days before");
}

section("single track: falls back to the KV scope cache when custom_data has no track");
resetSends();
{
  const env = baseEnv({ kv: { "flag:fulfilment-email": "on", "tracks:u1": "ts" } });
  await F.sendFulfilmentEmail(env, {
    kind: "subscription", refId: "txn_07", userId: "u1",
    to: { email: "buyer@example.com" }, plan: "single_year", track: null,
    money: "65.00 USD", renewalAt: SEP_2027, subscriptionId: null,
  });
  has("start link is the Forecaster roadmap", sends[0].body.textbody,
    "https://r-statistics.co/roadmap/forecaster.html");
  has("names the Forecaster track", sends[0].body.textbody, "You bought the Forecaster track");
}

// ------------------------------------------------------------ 12. defensive
section("defensive");
resetSends();
{
  const env = baseEnv({ kv: { "flag:fulfilment-email": "on" } });
  await F.sendFulfilmentEmail(env, {
    kind: "lifetime", refId: "txn_06", userId: null,
    to: { email: "" }, plan: "lifetime", money: "",
  });
  eq("no recipient means no send", sends.length, 0);
  await F.sendFulfilmentEmail(env, {
    kind: "lifetime", refId: "", userId: null,
    to: { email: "a@b.co" }, plan: "lifetime", money: "",
  });
  eq("no transaction id means no send", sends.length, 0);
}

// ------------------------------------------------------- 13. reminder sweep
section("renewal sweep");
resetSends();
{
  const now = Math.floor(Date.now() / 1000);
  const due = now + 7 * 86400;
  const rows = [{
    sub_id: "sub_10", plan: "single_year", period_end: due,
    user_id: "u9", email: "sub@example.com", name: "Sub Scriber",
  }];

  // flag off -> nothing at all
  const off = baseEnv({ rows });
  await F.sweepRenewalReminders(off);
  eq("flag off sends nothing", sends.length, 0);
  eq("flag off audits nothing", off.DB.audits.length, 0);

  paddleSub = {
    status: "active",
    next_billed_at: new Date(due * 1000).toISOString(),
    next_transaction: { details: { totals: { total: "7215", currency_code: "USD" } } },
  };
  const env = baseEnv({ rows, kv: { "flag:renewal-reminder": "on", [`tracks:u9`]: "ds" } });
  await F.sweepRenewalReminders(env);
  eq("one reminder sent", sends.length, 1);
  has("subject names the date", sends[0].body.subject, "renews on");
  has("body names the plan", sends[0].body.textbody, "Data Scientist track, billed yearly");
  has("body names the amount from Paddle", sends[0].body.textbody, "Amount: 72.15 USD");
  eq("audited as sent", env.DB.audits[0].action, "fulfilment.email.sent");
  eq("audit kind", env.DB.audits[0].meta.kind, "renewal_reminder");
  ok("per-period marker set", env.KV.map.has(`renewal-reminded:sub_10:${due}`));

  // immediate re-run is throttled
  await F.sweepRenewalReminders(env);
  eq("throttled: no second send", sends.length, 1);

  // throttle cleared but the per-period marker still holds
  env.KV.map.set("renewal-sweep:last", "0");
  await F.sweepRenewalReminders(env);
  eq("per-period dedup holds", sends.length, 1);

  // a cancelled subscription is dropped by the Paddle check
  const env2 = baseEnv({ rows, kv: { "flag:renewal-reminder": "on" } });
  paddleSub = {
    status: "active",
    next_billed_at: new Date(due * 1000).toISOString(),
    scheduled_change: { action: "cancel" },
    next_transaction: { details: { totals: { total: "7215", currency_code: "USD" } } },
  };
  await F.sweepRenewalReminders(env2);
  eq("scheduled-cancel gets no reminder", sends.length, 1);
  paddleSub = null;
}

console.log(`\n${checks - fails}/${checks} checks passed`);
if (fails) { console.log(`${fails} FAILED`); process.exit(1); }
