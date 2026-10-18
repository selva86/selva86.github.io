// Reconcile the payments ledger against Paddle.
//
// The webhook keeps the ledger current in normal operation. This is the
// repair path for the two cases the webhook cannot cover: the charges that
// happened before the table existed, and any delivery that was missed while
// an endpoint was down. Safe to run at any time, as often as you like: every
// write is an upsert keyed on the Paddle transaction id, and nothing here
// touches entitlement.
//
// Runs inside the Worker because PADDLE_API_KEY lives in Cloudflare's secret
// store and is not readable from a developer machine.

const PAGE = 30;          // Paddle caps per_page at 30 for transactions
const MAX_PAGES = 20;     // 600 charges; raise when the business outgrows it

interface PaddleTxn {
  id: string;
  status?: string;
  origin?: string;
  customer_id?: string | null;
  subscription_id?: string | null;
  invoice_number?: string | null;
  discount_id?: string | null;
  billed_at?: string | null;
  currency_code?: string | null;
  billing_period?: { starts_at?: string; ends_at?: string } | null;
  address?: { country_code?: string } | null;
  details?: {
    totals?: { total?: string; grand_total?: string; tax?: string; discount?: string; earnings?: string; currency_code?: string };
    payout_totals?: { earnings?: string; currency_code?: string } | null;
  } | null;
}

interface PaddleAdj {
  id: string;
  action?: string;
  status?: string;
  transaction_id?: string;
  created_at?: string;
  totals?: { total?: string } | null;
}

function iso(v?: string | null): number | null {
  if (!v) return null;
  const t = Date.parse(v);
  return Number.isFinite(t) ? Math.floor(t / 1000) : null;
}
function int(v?: string | null): number | null {
  if (v == null || v === "") return null;
  const n = parseInt(String(v), 10);
  return Number.isFinite(n) ? n : null;
}

async function page<T>(env: { PADDLE_API_KEY: string }, path: string, after: string | null): Promise<{ rows: T[]; more: boolean }> {
  const base = env.PADDLE_API_KEY.startsWith("pdl_sdbx_") ? "https://sandbox-api.paddle.com" : "https://api.paddle.com";
  const url = `${base}${path}${path.includes("?") ? "&" : "?"}per_page=${PAGE}${after ? `&after=${encodeURIComponent(after)}` : ""}`;
  const resp = await fetch(url, { headers: { Authorization: `Bearer ${env.PADDLE_API_KEY}` } });
  if (!resp.ok) throw new Error(`paddle ${resp.status} on ${path}: ${(await resp.text()).slice(0, 200)}`);
  const body = await resp.json() as { data?: T[]; meta?: { pagination?: { has_more?: boolean } } };
  return { rows: body.data || [], more: !!body.meta?.pagination?.has_more };
}

export interface SyncResult {
  scanned: number;
  written: number;
  refunds: number;
  linked: number;
  skipped_zero: number;
  error?: string;
}

export async function syncPaymentsFromPaddle(
  env: { PADDLE_API_KEY?: string; DB: D1Database },
): Promise<SyncResult> {
  const out: SyncResult = { scanned: 0, written: 0, refunds: 0, linked: 0, skipped_zero: 0 };
  if (!env.PADDLE_API_KEY) return { ...out, error: "paddle_not_configured" };
  const key = { PADDLE_API_KEY: env.PADDLE_API_KEY };
  const now = Math.floor(Date.now() / 1000);

  // 1. Every transaction that moved money, oldest first.
  const txns: PaddleTxn[] = [];
  let after: string | null = null;
  for (let i = 0; i < MAX_PAGES; i++) {
    const r: { rows: PaddleTxn[]; more: boolean } = await page<PaddleTxn>(
      key, "/transactions?status=billed,paid,completed,past_due&order_by=billed_at[ASC]&include=address", after,
    );
    txns.push(...r.rows);
    if (!r.more || !r.rows.length) break;
    after = r.rows[r.rows.length - 1].id;
  }
  out.scanned = txns.length;

  /* Classify in one pass over the full history, rather than asking the
     database per row what it has already seen. Paddle's own `origin` names
     every automatic rebill; among the rest, the earliest charge on a
     subscription is its first and anything later is a mid-term change. */
  const seen = new Set<string>();
  const stmts: D1PreparedStatement[] = [];
  for (const t of txns) {
    const T = t.details?.totals;
    const gross = int(T?.grand_total ?? T?.total);
    if (!gross || gross <= 0) { out.skipped_zero += 1; continue; }
    const sub = t.subscription_id || null;
    let kind: string;
    if (t.origin === "subscription_recurring") kind = "renewal";
    else if (!sub) kind = "one_time";
    else if (seen.has(sub)) kind = "other";
    else kind = "first";
    if (sub) seen.add(sub);

    stmts.push(env.DB.prepare(
      `INSERT INTO payments
         (id, provider, user_id, customer_id, subscription_id, plan, kind, origin, status,
          currency, gross, tax, discount, earnings, earnings_currency, discount_id,
          invoice_number, country, billed_at, period_start, period_end, created_at)
       VALUES (?, 'paddle', NULL, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         customer_id = COALESCE(excluded.customer_id, payments.customer_id),
         subscription_id = COALESCE(excluded.subscription_id, payments.subscription_id),
         status = excluded.status, currency = excluded.currency, gross = excluded.gross,
         tax = excluded.tax, discount = excluded.discount, earnings = excluded.earnings,
         earnings_currency = excluded.earnings_currency,
         invoice_number = COALESCE(excluded.invoice_number, payments.invoice_number),
         country = COALESCE(excluded.country, payments.country),
         billed_at = COALESCE(excluded.billed_at, payments.billed_at),
         period_start = COALESCE(excluded.period_start, payments.period_start),
         period_end = COALESCE(excluded.period_end, payments.period_end)`,
    ).bind(
      t.id, t.customer_id || null, sub, kind, t.origin || "web", t.status || "completed",
      T?.currency_code || t.currency_code || null, gross, int(T?.tax), int(T?.discount),
      int(t.details?.payout_totals?.earnings ?? T?.earnings),
      t.details?.payout_totals?.currency_code || T?.currency_code || null,
      t.discount_id || null, t.invoice_number || null, t.address?.country_code || null,
      iso(t.billed_at), iso(t.billing_period?.starts_at), iso(t.billing_period?.ends_at), now,
    ));
  }
  out.written = stmts.length;
  // D1 batches run in one transaction; chunked so a large history cannot
  // exceed the statement limit in a single call.
  for (let i = 0; i < stmts.length; i += 50) await env.DB.batch(stmts.slice(i, i + 50));

  // 2. Refunds, credits and chargebacks against those charges.
  const adjs: PaddleAdj[] = [];
  after = null;
  for (let i = 0; i < MAX_PAGES; i++) {
    const r: { rows: PaddleAdj[]; more: boolean } = await page<PaddleAdj>(key, "/adjustments", after);
    adjs.push(...r.rows);
    if (!r.more || !r.rows.length) break;
    after = r.rows[r.rows.length - 1].id;
  }
  /* Summed per transaction rather than applied one by one, so two partial
     refunds against one charge total correctly instead of the last winning. */
  const refundBy = new Map<string, { total: number; at: number }>();
  for (const a of adjs) {
    if (a.action !== "refund" && a.action !== "chargeback") continue;
    if (a.status === "rejected" || a.status === "reversed") continue;
    const amt = int(a.totals?.total);
    if (!a.transaction_id || !amt) continue;
    const cur = refundBy.get(a.transaction_id) || { total: 0, at: 0 };
    refundBy.set(a.transaction_id, { total: cur.total + amt, at: Math.max(cur.at, iso(a.created_at) || 0) });
  }
  const rStmts = [...refundBy.entries()].map(([txn, r]) =>
    env.DB.prepare("UPDATE payments SET refunded = MIN(COALESCE(gross,0), ?), refunded_at = ? WHERE id = ?")
      .bind(r.total, r.at || now, txn));
  if (rStmts.length) for (let i = 0; i < rStmts.length; i += 50) await env.DB.batch(rStmts.slice(i, i + 50));
  out.refunds = rStmts.length;

  // 3. Plan and owner are resolved inside the database, from the mirror the
  // site already trusts, so a sync can never disagree with entitlement. A
  // lifetime purchase has no subscription entity and its mirror row keys on
  // the transaction id instead, which the COALESCE covers.
  const link = await env.DB.batch([
    env.DB.prepare(
      `UPDATE payments SET plan = (SELECT s.plan FROM subscriptions s
         WHERE s.provider = 'paddle' AND s.external_id = COALESCE(payments.subscription_id, payments.id))
       WHERE plan IS NULL`),
    env.DB.prepare(
      `UPDATE payments SET user_id = (SELECT s.user_id FROM subscriptions s
         WHERE s.provider = 'paddle' AND s.external_id = COALESCE(payments.subscription_id, payments.id))
       WHERE user_id IS NULL`),
    env.DB.prepare(
      `UPDATE payments SET user_id = (SELECT u.id FROM users u
         WHERE u.paddle_customer_id = payments.customer_id AND u.deleted_at IS NULL)
       WHERE user_id IS NULL AND customer_id IS NOT NULL`),
    // Give the mirror the amount its own webhook never carried, so the daily
    // digest finally has a revenue figure to read.
    env.DB.prepare(
      `UPDATE subscriptions SET
         amount = (SELECT p.gross FROM payments p WHERE p.subscription_id = subscriptions.external_id
                   ORDER BY p.billed_at DESC LIMIT 1),
         currency = (SELECT p.currency FROM payments p WHERE p.subscription_id = subscriptions.external_id
                   ORDER BY p.billed_at DESC LIMIT 1)
       WHERE provider = 'paddle'
         AND EXISTS (SELECT 1 FROM payments p WHERE p.subscription_id = subscriptions.external_id)`),
  ]);
  out.linked = link.reduce((a, r) => a + (r.meta?.changes ?? 0), 0);
  return out;
}
