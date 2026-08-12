// GET /api/admin/email-plan - the brain's dry run: who would get what today
// and WHY (the arbitration trace), without sending or writing anything.
// The eyeball step before any flag turns on.
//
//   ?force_daily=1          evaluate as if this were the 13:00 UTC run
//   ?send_test=<template>   render that template with sample data and send it
//                           to the admin's own inbox (recorded as test_sent)
//
// Admin-gated the same way as /api/admin/stats (ADMIN_EMAIL match).

import type { Env, RequestData } from "../../_middleware";
import { json, err401, err403, jsonError } from "../../_lib/errors";
import { runBrain, unsubUrl, userSig } from "../../_lib/brain";
import { renderEmail, TEMPLATES, SENDER, REPLY_TO } from "../../_lib/email-templates";
import { sendMail } from "../../_lib/email";

const DEFAULT_ADMIN = "selva86@gmail.com";
const DEFAULT_ALLOWLIST = "selva@r-statistics.co,selva86@gmail.com";

function timingSafeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let x = 0;
  for (let i = 0; i < a.length; i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return x === 0;
}

const SAMPLE = {
  first_name: "Selva",
  pass_end_date: "Sep 11",
  hub_url: "/R-Interview-Questions.html",
  course_title: "Data Wrangling with dplyr",
  next_lesson_url: "/roadmap/data-analyst.html",
  reset_date: "Sep 1",
};

export const onRequestGet: PagesFunction<Env & { EMAIL_UNSUB_SECRET?: string; EMAIL_TEST_ALLOWLIST?: string; CRON_SECRET?: string }, string, RequestData> = async (context) => {
  // Auth: the admin's own session, OR the CRON_SECRET bearer (infrastructure).
  // Either way, test sends can only reach the allowlist, so the secret cannot
  // be used to email anyone else.
  const u = context.data.user;
  const admin = (context.env as { ADMIN_EMAIL?: string }).ADMIN_EMAIL || DEFAULT_ADMIN;
  const auth = context.request.headers.get("Authorization") || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const isCron = !!context.env.CRON_SECRET && timingSafeEq(bearer, context.env.CRON_SECRET);
  const isAdmin = !!u && (u.email || "").toLowerCase() === admin.toLowerCase();
  if (!isAdmin && !isCron) return u ? err403("Restricted.") : err401();

  const url = new URL(context.request.url);
  const testKey = url.searchParams.get("send_test");
  const previewKey = url.searchParams.get("preview");

  if (previewKey) {
    if (!TEMPLATES[previewKey]) {
      return jsonError(404, "no_template", `Unknown template. Have: ${Object.keys(TEMPLATES).join(", ")}`);
    }
    const r = renderEmail(previewKey, { ...SAMPLE });
    if (!r) return jsonError(500, "render_failed", "Template rendered null");
    return json({ template: previewKey, subject: r.subject, preheader: r.preheader,
      category: r.category, reason: r.reason, text: r.text, html: r.html });
  }

  if (testKey) {
    if (!TEMPLATES[testKey]) {
      return jsonError(404, "no_template", `Unknown template. Have: ${Object.keys(TEMPLATES).join(", ")}`);
    }
    const allow = new Set((context.env.EMAIL_TEST_ALLOWLIST || DEFAULT_ALLOWLIST)
      .split(",").map((x) => x.trim().toLowerCase()).filter(Boolean));
    const to = (url.searchParams.get("to") || u?.email || admin).toLowerCase();
    if (!allow.has(to)) return err403("Test sends are allowlist-only.");
    const uid = u?.id || "test-recipient";
    const sig = await userSig(context.env, uid);
    const r = renderEmail(testKey, {
      ...SAMPLE,
      unsubscribe_url: await unsubUrl(context.env, uid, `test:${testKey}`),
      ...(sig ? { track: { uid, sig, key: `test:${testKey}` } } : {}),
    });
    if (!r) return jsonError(500, "render_failed", "Template rendered null");
    const res = await sendMail(context.env, {
      to: { email: to },
      subject: `[TEST] ${r.subject}`,
      htmlBody: r.html, textBody: r.text,
      from: SENDER, replyTo: REPLY_TO,
    });
    await context.env.DB.prepare(
      "INSERT INTO email_events (user_id, email, email_key, event, at, meta) VALUES (?1, ?2, ?3, 'test_sent', ?4, ?5)",
    ).bind(uid, to, testKey, Math.floor(Date.now() / 1000), res.ok ? "ok" : (res.error || String(res.status))).run();
    return json({ sent: res.ok, to, template: testKey, subject: r.subject, error: res.error ?? null });
  }

  const result = await runBrain(context.env, {
    execute: false,
    forceDaily: url.searchParams.get("force_daily") === "1",
  });
  return json({
    mode: result.mode,
    daily_run: result.daily_run,
    count: result.decisions.length,
    decisions: result.decisions,
    templates: Object.keys(TEMPLATES),
  });
};
