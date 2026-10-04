// POST /api/cron/email-brain - the brain's execution trigger.
//
// Called hourly by the email-brain cron Worker (workers/email-brain), which is
// a pure alarm clock: all logic and all secrets stay here on the Pages project.
// Authenticated by CRON_SECRET (a Pages secret; the same value lives on the
// Worker). Also callable by an admin bearer token for manual runs.

import type { Env, RequestData } from "../../_middleware";
import { sweepAbandonedCheckouts } from "../../_lib/cartrecovery";
import { sweepPendingSignups } from "../../_lib/notify";
import { cfAnalytics } from "../admin/stats";
import { sweepPriceAlerts } from "../../_lib/pricealerts";
import { json, err401 } from "../../_lib/errors";
import { runBrain } from "../../_lib/brain";
import { maybeSendDigest } from "../../_lib/digest";
import { sendMail } from "../../_lib/email";

const DEFAULT_ADMIN = "selva86@gmail.com";

function timingSafeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let x = 0;
  for (let i = 0; i < a.length; i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return x === 0;
}

export const onRequestPost: PagesFunction<Env & { CRON_SECRET?: string; EMAIL_UNSUB_SECRET?: string; EMAIL_TEST_ALLOWLIST?: string }, string, RequestData> = async (context) => {
  const auth = context.request.headers.get("Authorization") || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const secret = context.env.CRON_SECRET || "";
  const admin = (context.env as { ADMIN_EMAIL?: string }).ADMIN_EMAIL || DEFAULT_ADMIN;
  const isCron = !!secret && timingSafeEq(bearer, secret);
  const isAdmin = (context.data.user?.email || "").toLowerCase() === admin.toLowerCase();
  if (!isCron && !isAdmin) return err401();

  const url = new URL(context.request.url);

  // These four are registered BEFORE the brain runs, and that ordering is
  // deliberate. They used to be registered after it, which meant they were
  // hostage to it: the daily 13:00 run is long enough to be cut off part way
  // through, and a run that never returns never reaches the lines that queue
  // them, so the busiest hour of the day was also the one hour these did not
  // happen. None of them depends on the brain's result, so none of them should
  // wait on it.

  // A parked signup notification is normally flushed by the browser coming
  // back. When it does not come back, nothing sent the notice at all and it
  // expired in KV two days later. This is the path that does not need a
  // browser.
  try { context.waitUntil(sweepPendingSignups(context.env).then(() => undefined).catch(() => undefined)); } catch (_) {}
  // Snapshot traffic into traffic_daily. This used to happen only when the
  // admin dashboard was opened, so the table went stale on 2026-09-20 and the
  // daily digest, which reads it, has been reporting an apparent traffic
  // collapse ever since. A 30-day range also backfills the days that were
  // missed, since Cloudflare keeps 30 days of RUM. The 30-minute response
  // cache is shorter than this hourly beat, so each run really does refresh.
  try {
    context.waitUntil(
      cfAnalytics(context.env as never, context.env.DB, Math.floor(Date.now() / 1000), "30d")
        .then(() => undefined).catch(() => undefined),
    );
  } catch (_) {}
  // Cart-recovery rides the same hourly heartbeat, so both recovery touches
  // land on schedule even in zero-traffic hours (internally 30-min throttled).
  try { context.waitUntil(sweepAbandonedCheckouts(context.env)); } catch (_) {}
  // The price-alert flow (offer / T-24h / last-30-minutes / close) rides the
  // same heartbeat: every step is a time window, and the hourly cadence is
  // exactly what the hh:30 expiry snap is built around.
  try { context.waitUntil(sweepPriceAlerts(context.env)); } catch (_) {}
  /* The daily operator digest rides the same heartbeat and fires in exactly
     one of the twenty-four runs. Its own once-a-day guard is the email_events
     row it writes, so a retry cannot double-send. */
  try {
    context.waitUntil(maybeSendDigest(
      context.env as never,
      (a) => sendMail(context.env as never, a),
      { force: url.searchParams.get("force_digest") === "1" },
    ).then(() => undefined).catch(() => undefined));
  } catch (_) {}

  const result = await runBrain(context.env, {
    execute: true,
    forceDaily: url.searchParams.get("force_daily") === "1",
  });
  const counts: Record<string, number> = {};
  for (const d of result.decisions) counts[d.action] = (counts[d.action] || 0) + 1;
  return json({ ran: result.ran, mode: result.mode, daily_run: result.daily_run, counts, total: result.decisions.length });
};
