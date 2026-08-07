/* Send ONE real fulfilment email to a safe test address, or render the
   templates to stdout without sending.

   Render only (no credentials needed, no network):
     node Scripts/functions-truth/send-test-fulfilment-email.mjs --render

   Real send (needs the live ZeptoMail token):
     ZOHO_ZEPTOMAIL_TOKEN="Zoho-enczapikey <key>" \
     node Scripts/functions-truth/send-test-fulfilment-email.mjs --send --template lifetime

   The token is a Cloudflare Pages secret and cannot be read back from
   Cloudflare. Get it from ZeptoMail -> Mail Agent -> SMTP & API Info -> API.

   SAFETY. The recipient is hard-limited to ALLOWED below. Customer addresses
   are not reachable from this script by design: the whole point of the
   `fulfilment-email` flag is that no customer hears from us before the
   2026-09-08 launch, and a test script is exactly where that rule gets broken
   by accident. Pass --to only to pick between the allowed addresses. */

import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ALLOWED = new Set(["selva@r-statistics.co", "selva86@gmail.com"]);

const argv = process.argv.slice(2);
const arg = (name, dflt) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : dflt;
};
const wantSend = argv.includes("--send");
const template = arg("--template", "lifetime");
const to = arg("--to", "selva@r-statistics.co");

if (!ALLOWED.has(to)) {
  console.error(`Refusing to send to ${to}. Allowed: ${[...ALLOWED].join(", ")}`);
  process.exit(2);
}

const ROOT = path.resolve(import.meta.dirname, "..", "..");
const esbuild = await import("esbuild");
const outFile = path.join(mkdtempSync(path.join(tmpdir(), "fulfil-send-")), "fulfilment.mjs");
await esbuild.build({
  entryPoints: [path.join(ROOT, "functions", "_lib", "fulfilment.ts")],
  bundle: true, format: "esm", platform: "neutral", outfile: outFile, logLevel: "error",
});
const F = await import(pathToFileURL(outFile).href);

// Plausible dummy values, deliberately NOT either real customer's figures.
const lifetimeCopy = F.describePlan("lifetime", null);
const subCopy = F.describePlan("single_year", "ds");
const RENEWS = Math.floor(Date.parse("2027-09-08T00:00:00Z") / 1000);

const rendered = template === "subscription"
  ? F.buildSubscriptionEmail({
      name: "Selva", email: to, planNoun: subCopy.noun, planTerm: subCopy.term,
      money: "72.15 USD", renewalDate: F.formatDate(RENEWS), renewalMoney: "72.15 USD",
      startUrl: subCopy.startUrl, startLine: subCopy.startLine, remindBeforeRenewal: true,
    })
  : F.buildLifetimeEmail({
      name: "Selva", email: to, money: "319.87 EUR",
      startUrl: lifetimeCopy.startUrl, startLine: lifetimeCopy.startLine,
    });

console.log(`--- template: ${template} ---`);
console.log(`To:      ${to}`);
console.log(`Subject: ${rendered.subject}\n`);
console.log(rendered.textBody);
console.log("\n--- end ---");

if (!wantSend) {
  console.log("\nRender only. Re-run with --send (and ZOHO_ZEPTOMAIL_TOKEN set) to deliver it.");
  process.exit(0);
}

const token = process.env.ZOHO_ZEPTOMAIL_TOKEN;
const sender = process.env.ZOHO_ZEPTOMAIL_SENDER || "noreply@r-statistics.co";
if (!token) {
  console.error("\nZOHO_ZEPTOMAIL_TOKEN is not set. Nothing was sent.");
  process.exit(2);
}
const auth = token.startsWith("Zoho-enczapikey ") ? token : `Zoho-enczapikey ${token}`;

const resp = await fetch("https://api.zeptomail.in/v1.1/email", {
  method: "POST",
  headers: { Authorization: auth, "Content-Type": "application/json" },
  body: JSON.stringify({
    from: { address: sender, name: "r-statistics.co" },
    to: [{ email_address: { address: to, name: "Selva" } }],
    subject: rendered.subject,
    htmlbody: rendered.htmlBody,
    textbody: rendered.textBody,
    reply_to: [{ address: "support@r-statistics.co", name: "r-statistics.co support" }],
  }),
});
const body = await resp.text();
console.log(`\nZeptoMail HTTP ${resp.status}`);
console.log(body);
process.exit(resp.ok ? 0 : 1);
