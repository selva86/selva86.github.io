// Things the site noticed and nobody was told about.
//
// The money path was written to be resilient, which it is: a failure anywhere
// in it is caught, logged with console.warn or console.error, and the request
// returns 200 so a customer is never shown a stack trace. That is the right
// behaviour for the customer and the wrong behaviour for the operator, because
// console output in a Worker is visible only to somebody already running
// `wrangler tail`. Nobody is. So the loudest a failure ever got was a line in
// a log that is not kept.
//
// Found 2026-11-12, during a reprice. Six places in the webhook and fulfilment
// can take a customer's money and grant them nothing, and each one of them
// said so only to the console:
//
//   webhooks/paddle.ts  a subscription matching no configured price
//   webhooks/paddle.ts  a subscription whose buyer could not be resolved
//   webhooks/paddle.ts  a Teams subscription with no resolvable owner
//   webhooks/paddle.ts  a LIFETIME transaction whose buyer could not be
//                       resolved: the largest single charge on the site
//   webhooks/paddle.ts  a payments row that failed to insert, so the money is
//                       absent from the ledger it is reconciled against
//   fulfilment.ts       a purchase email that never sent, so the buyer has no
//                       receipt and no link to the thing they just bought
//
// This module gives those places somewhere to report to. Two rules shape it:
//
// RECORD BEFORE SENDING. The row goes in first and the email second, because
// email is the part that fails: ZeptoMail credits ran out once already and
// took the signup mails with them. An alert that exists only as an email is an
// alert that disappears exactly when things are worst.
//
// NEVER THROW. These calls sit inside handlers whose job is to fulfil a
// purchase. An alert that breaks fulfilment would cause the very failure it
// exists to report.

import type { Env } from "../_middleware";
import { notifyAdminEvent } from "./notify";

/* The bindings an alert actually needs: somewhere to write it and a way to
   send it. Declared structurally rather than as Env so that fulfilment.ts can
   call this too, since it deliberately takes a narrow FulfilmentEnv and is not
   given the whole environment. notifyAdminEvent is typed against Env but only
   ever reaches for the mail credentials below, so the cast at its call site is
   sound; this type is what keeps it so. */
export type AlertEnv = {
  DB: D1Database;
  KV: KVNamespace;
  ZOHO_ZEPTOMAIL_TOKEN: string;
  ZOHO_ZEPTOMAIL_SENDER: string;
};

/* Each kind is a sentence about what the customer lost, not about which
   function returned null. "paid_not_entitled" is answerable: find the buyer,
   grant the plan. "individualPlan returned null" is not. */
export type AlertKind =
  | "paid_not_entitled"   // money taken, access not granted
  | "paid_not_recorded"   // money taken, missing from the ledger
  | "receipt_not_sent"    // access granted, buyer told nothing
  | "webhook_rejected"    // a call claiming to be Paddle was refused
  | "catalog_drift"       // config and Paddle disagree about a price
  | "lookup_failed";      // the database could not answer, so cause is unknown

export type Severity = "critical" | "warn";

/* An hour of one kind of alert. Past this the rows keep landing and the email
   goes quiet, with one line saying so, which is the same shape as the
   objection emails in notify.ts. A webhook retry storm or a bad deploy can
   produce hundreds of identical failures, and an inbox with three hundred
   copies of one problem is as unreadable as an inbox with none. */
const EMAIL_CAP_PER_HOUR = 5;

let tableReady = false;

/* Created on first use, the same pattern as contact_actions and
   intent_signals, so shipping this needs no migration step. resolved_at is
   nullable and nothing sets it automatically: an alert stays open until a
   person decides it is dealt with. */
async function ensureTable(DB: D1Database): Promise<void> {
  if (tableReady) return;
  await DB.prepare(
    "CREATE TABLE IF NOT EXISTS ops_alerts (" +
    "id INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT NOT NULL, severity TEXT NOT NULL, " +
    "summary TEXT NOT NULL, detail_json TEXT, dedupe_key TEXT, ref TEXT, " +
    "at INTEGER NOT NULL, emailed INTEGER NOT NULL DEFAULT 0, resolved_at INTEGER)",
  ).run();
  await DB.prepare("CREATE INDEX IF NOT EXISTS idx_ops_alerts_open ON ops_alerts (resolved_at, at)").run();
  await DB.prepare("CREATE INDEX IF NOT EXISTS idx_ops_alerts_kind ON ops_alerts (kind, at)").run();
  tableReady = true;
}

export interface AlertInput {
  kind: AlertKind;
  severity: Severity;
  /* One line naming what the customer lost. This becomes the email subject,
     so it is written to be read on a phone lock screen. */
  summary: string;
  /* Everything needed to fix it by hand without opening the dashboard: ids,
     the price that did not match, the email to search for. */
  rows: Array<[string, string]>;
  /* What this alert is ABOUT, e.g. a subscription or transaction id. Repeats
     of the same ref collapse into one email per hour. */
  ref?: string | null;
}

/* Record an operational failure and, within limits, say so.

   Returns nothing and throws nothing: callers are fulfilment paths and must
   not change behaviour based on whether the alert landed. */
export async function alertOps(env: AlertEnv, a: AlertInput): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const dedupeKey = `${a.kind}:${a.ref || a.summary}`;

  // 1. The durable half. If only one of the two halves can happen, it is this
  //    one, so it goes first and is not conditional on anything.
  let recorded = false;
  try {
    await ensureTable(env.DB);
    await env.DB
      .prepare(
        "INSERT INTO ops_alerts (kind, severity, summary, detail_json, dedupe_key, ref, at, emailed) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?, 0)",
      )
      .bind(a.kind, a.severity, a.summary, JSON.stringify(a.rows), dedupeKey, a.ref || null, now)
      .run();
    recorded = true;
  } catch (e) {
    // The database is the thing that failed. Console is all that is left.
    console.error(`[ops-alert] could not record ${a.kind}: ${(e as Error).message}`);
  }

  /* 2. The loud half. Only "critical" reaches the inbox, because only
        critical means a customer is out of pocket right now. A warn is real
        and is kept, but it is read in the daily digest and at
        /api/admin/alerts rather than interrupting anyone: rejected webhook
        signatures in particular arrive from internet scanners all day, and an
        alert that cries wolf daily is one nobody opens on the day it matters. */
  if (a.severity !== "critical") return;

  try {
    const bucket = Math.floor(now / 3600);
    const key = `opsalert:${a.kind}:${bucket}`;
    const seen = parseInt((await env.KV.get(key)) || "0", 10) + 1;
    // Expires just past the hour it counts, so the ceiling resets on its own.
    await env.KV.put(key, String(seen), { expirationTtl: 5400 }).catch(() => undefined);

    if (seen > EMAIL_CAP_PER_HOUR + 1) return;

    const rows: Array<[string, string]> = [...a.rows];
    if (!recorded) {
      rows.push(["Warning", "This alert could NOT be written to the database. It exists only in this email."]);
    }
    if (seen === EMAIL_CAP_PER_HOUR + 1) {
      await notifyAdminEvent(env as unknown as Env, {
        subject: `[quiet] ${a.kind} is repeating`,
        headline:
          `More than ${EMAIL_CAP_PER_HOUR} "${a.kind}" alerts in one hour. Further ones this hour are still ` +
          `being recorded in ops_alerts, but will not be emailed, so this inbox stays readable.`,
        rows: [["Kind", a.kind], ["Most recent", a.summary], ["Where", "/api/admin/alerts"]],
      });
      return;
    }

    await notifyAdminEvent(env as unknown as Env, {
      subject: `${a.severity === "critical" ? "[action needed] " : "[notice] "}${a.summary}`,
      headline: a.summary,
      rows,
    });
  } catch (e) {
    console.error(`[ops-alert] could not send ${a.kind}: ${(e as Error).message}`);
  }
}

export interface OpenAlert {
  id: number; kind: string; severity: string; summary: string;
  detail_json: string | null; ref: string | null; at: number;
}

/* Open alerts, newest first, for the daily digest and the admin page. An
   alert nobody can see is the problem this module exists to solve, so it is
   deliberately easy to list. */
export async function openAlerts(DB: D1Database, limit = 50): Promise<OpenAlert[]> {
  try {
    await ensureTable(DB);
    const r = await DB
      .prepare(
        "SELECT id, kind, severity, summary, detail_json, ref, at FROM ops_alerts " +
        "WHERE resolved_at IS NULL ORDER BY at DESC LIMIT ?",
      )
      .bind(limit)
      .all<OpenAlert>();
    return r.results ?? [];
  } catch {
    return [];
  }
}

export async function resolveAlert(DB: D1Database, id: number): Promise<boolean> {
  try {
    await ensureTable(DB);
    const r = await DB
      .prepare("UPDATE ops_alerts SET resolved_at = ? WHERE id = ? AND resolved_at IS NULL")
      .bind(Math.floor(Date.now() / 1000), id)
      .run();
    return (r.meta?.changes ?? 0) > 0;
  } catch {
    return false;
  }
}
