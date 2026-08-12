// POST /api/cron/email-brain - the brain's execution trigger.
//
// Called hourly by the email-brain cron Worker (workers/email-brain), which is
// a pure alarm clock: all logic and all secrets stay here on the Pages project.
// Authenticated by CRON_SECRET (a Pages secret; the same value lives on the
// Worker). Also callable by an admin bearer token for manual runs.

import type { Env, RequestData } from "../../_middleware";
import { json, err401 } from "../../_lib/errors";
import { runBrain } from "../../_lib/brain";

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
  const result = await runBrain(context.env, {
    execute: true,
    forceDaily: url.searchParams.get("force_daily") === "1",
  });
  const counts: Record<string, number> = {};
  for (const d of result.decisions) counts[d.action] = (counts[d.action] || 0) + 1;
  return json({ ran: result.ran, mode: result.mode, daily_run: result.daily_run, counts, total: result.decisions.length });
};
