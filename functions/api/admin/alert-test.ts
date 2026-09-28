// GET /api/admin/alert-test?to=<allowlisted email>
//
// Sends the three price-alert emails verbatim to a test address: the
// confirmation with its four one-click answers, the 23% offer, and the T-24h
// reminder. The code is a dummy and is NOT minted in Paddle, nothing is written
// to price_alerts or email_events, and recipients are hard-restricted to the
// test allowlist, so neither the admin session nor the CRON_SECRET can be used
// to email anyone else. Auth mirrors /api/admin/recovery-test.

import type { Env, RequestData } from "../../_middleware";
import { json, jsonError } from "../../_lib/errors";
import { previewAlertEmail, offerExpiry, formatOfferExpiry, type AlertEnv } from "../../_lib/pricealerts";
import { sendMail } from "../../_lib/email";

const SENDER = { email: "akshay@r-statistics.co", name: "Akshay from r-statistics.co" };
const REPLY_TO = { email: "akshay@r-statistics.co", name: "Akshay" };
const SITE = "https://r-statistics.co";

const DEFAULT_ADMIN = "selva86@gmail.com";
const DEFAULT_ALLOWLIST = "selva@r-statistics.co,selva86@gmail.com";

function timingSafeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let x = 0;
  for (let i = 0; i < a.length; i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return x === 0;
}

export const onRequestGet: PagesFunction<
  Env & AlertEnv & { CRON_SECRET?: string; EMAIL_TEST_ALLOWLIST?: string }, string, RequestData
> = async (context) => {
  const env = context.env;
  const admin = (env as { ADMIN_EMAIL?: string }).ADMIN_EMAIL || DEFAULT_ADMIN;
  const u = context.data.user;
  const bearer = (context.request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  const isAdmin = !!u && (u.email || "").toLowerCase() === admin.toLowerCase();
  const isCron = !!env.CRON_SECRET && !!bearer && timingSafeEq(bearer, env.CRON_SECRET);
  if (!isAdmin && !isCron) return jsonError(403, "forbidden", "Admin or cron only");

  const to = (new URL(context.request.url).searchParams.get("to") || "").trim().toLowerCase();
  const allow = new Set(
    (env.EMAIL_TEST_ALLOWLIST || DEFAULT_ALLOWLIST).split(",").map((s) => s.trim().toLowerCase()).filter(Boolean),
  );
  if (!to) return jsonError(400, "bad_to", "Pass ?to=<allowlisted email>");
  if (!allow.has(to)) return jsonError(403, "not_allowlisted", "Test sends only reach the allowlist");

  const now = Math.floor(Date.now() / 1000);
  const code = "PRO23TESTXX";              // dummy: not minted in Paddle
  const expires = offerExpiry(now);
  const offerUrl = `${SITE}/pricing.html?code=${encodeURIComponent(code)}&src=alert&exp=${expires}`;
  const link = (w: string) => `${SITE}/api/email/intent?a=0&t=preview&w=${w}`;

  const jobs: Array<[string, Record<string, unknown>]> = [
    ["alert-confirm", {
      today_url: link("today"), week_url: link("week"),
      month_url: link("month"), someday_url: link("someday"),
    }],
    ["alert-offer", { code, expires_line: formatOfferExpiry(expires), offer_url: offerUrl }],
    // what a real reminder carries: 24 hours left against a 7-day code
    ["alert-reminder", { code, offer_url: offerUrl, expires_line: formatOfferExpiry(now + 24 * 3600) }],
  ];

  const out: Array<{ template: string; ok: boolean; subject?: string; error?: string }> = [];
  for (const [template, extra] of jobs) {
    const r = await previewAlertEmail(env, template, extra);
    if (!r) { out.push({ template, ok: false, error: "template did not render" }); continue; }
    const res = await sendMail(env, {
      to: { email: to },
      subject: r.subject, htmlBody: r.html, textBody: r.text,
      from: SENDER, replyTo: REPLY_TO,
    });
    out.push({ template, ok: res.ok, subject: r.subject, ...(res.ok ? {} : { error: res.error || String(res.status) }) });
  }

  return json({
    to, sent: out,
    note: "dummy code, not minted in Paddle; nothing written to price_alerts or email_events",
  });
};
