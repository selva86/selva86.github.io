// GET /api/admin/recovery-test?to=<allowlisted email>
//
// Sends BOTH cart-recovery emails (touch 1 "15% off inside" and touch 2
// "expires tomorrow") verbatim to a test address, with a dummy code that is
// NOT minted in Paddle. Recipients are hard-restricted to the test
// allowlist, so neither the admin session nor the CRON_SECRET can be used
// to email anyone else. Auth mirrors /api/admin/email-plan.

import type { Env, RequestData } from "../../_middleware";
import { json, jsonError } from "../../_lib/errors";
import { recoveryEmail, reminderEmail } from "../../_lib/cartrecovery";
import { sendMail } from "../../_lib/email";
import { SENDER, REPLY_TO } from "../../_lib/email-templates";

const DEFAULT_ADMIN = "selva86@gmail.com";
const DEFAULT_ALLOWLIST = "selva@r-statistics.co,selva86@gmail.com";

function timingSafeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let x = 0;
  for (let i = 0; i < a.length; i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return x === 0;
}

export const onRequestGet: PagesFunction<Env & { CRON_SECRET?: string; EMAIL_TEST_ALLOWLIST?: string }, string, RequestData> = async (context) => {
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

  const code = "BACK15TESTX";
  const t1 = recoveryEmail(code);
  const t2 = reminderEmail(code);
  const r1 = await sendMail(env, {
    to: { email: to },
    subject: "Finish your r-statistics.co enrollment (15% off inside)",
    htmlBody: t1.html, textBody: t1.text,
    from: SENDER, replyTo: REPLY_TO,
  });
  const r2 = await sendMail(env, {
    to: { email: to },
    subject: "Your 15% code expires tomorrow",
    htmlBody: t2.html, textBody: t2.text,
    from: SENDER, replyTo: REPLY_TO,
  });
  return json({ touch1: r1.ok, touch2: r2.ok, to, note: "dummy code, not minted in Paddle" });
};
