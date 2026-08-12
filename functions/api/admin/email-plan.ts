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
import { runBrain, unsubUrl } from "../../_lib/brain";
import { renderEmail, TEMPLATES } from "../../_lib/email-templates";
import { sendMail } from "../../_lib/email";

const DEFAULT_ADMIN = "selva86@gmail.com";

const SAMPLE = {
  first_name: "Selva",
  pass_end_date: "Sep 11",
  hub_url: "/R-Interview-Questions.html",
  course_title: "Data Wrangling with dplyr",
  next_lesson_url: "/roadmap/data-analyst.html",
  reset_date: "Sep 1",
};

export const onRequestGet: PagesFunction<Env & { EMAIL_UNSUB_SECRET?: string; EMAIL_TEST_ALLOWLIST?: string }, string, RequestData> = async (context) => {
  const u = context.data.user;
  if (!u) return err401();
  const admin = (context.env as { ADMIN_EMAIL?: string }).ADMIN_EMAIL || DEFAULT_ADMIN;
  if ((u.email || "").toLowerCase() !== admin.toLowerCase()) return err403("Restricted.");

  const url = new URL(context.request.url);
  const testKey = url.searchParams.get("send_test");

  if (testKey) {
    if (!TEMPLATES[testKey]) {
      return jsonError(404, "no_template", `Unknown template. Have: ${Object.keys(TEMPLATES).join(", ")}`);
    }
    const r = renderEmail(testKey, { ...SAMPLE, unsubscribe_url: await unsubUrl(context.env, u.id) });
    if (!r) return jsonError(500, "render_failed", "Template rendered null");
    const res = await sendMail(context.env, {
      to: { email: u.email, name: u.display_name || undefined },
      subject: `[TEST] ${r.subject}`,
      htmlBody: r.html, textBody: r.text,
      replyTo: { email: "selva@r-statistics.co", name: "Selva" },
    });
    await context.env.DB.prepare(
      "INSERT INTO email_events (user_id, email, email_key, event, at, meta) VALUES (?1, ?2, ?3, 'test_sent', ?4, ?5)",
    ).bind(u.id, u.email, testKey, Math.floor(Date.now() / 1000), res.ok ? "ok" : (res.error || String(res.status))).run();
    return json({ sent: res.ok, to: u.email, template: testKey, subject: r.subject, error: res.error ?? null });
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
