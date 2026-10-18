// Every Paddle charge that moved money, recorded as it happens.
//
// WHY THIS MODULE EXISTS. The subscriptions mirror answers "what plan is this
// person on". It cannot answer "what did they pay, and what is each renewal
// costing", because the subscription.* webhook payload carries no money at
// all. Every amount arrives on transaction.completed instead. Before this,
// that event only linked a customer id and threw the money away, so the only
// place the ledger existed was inside Paddle.
//
// MONEY UNITS. Minor units throughout, exactly as Paddle sends them. `gross`
// is in `currency`: what the customer was charged, in their currency, tax
// included. `earnings` is in `earnings_currency`: what Paddle actually pays
// out, after tax and fees, nearly always USD. They are different currencies
// on most rows, so never sum a gross with an earnings. Totals across
// customers use earnings; a single customer's own history shows gross.

export interface PaymentInput {
  txnId: string;
  userId: string | null;
  customerId: string | null;
  subscriptionId: string | null;
  plan: string | null;
  origin: string;
  status: string;
  currency: string | null;
  gross: number | null;
  tax: number | null;
  discount: number | null;
  earnings: number | null;
  earningsCurrency: string | null;
  discountId: string | null;
  invoiceNumber: string | null;
  country: string | null;
  billedAt: number | null;
  periodStart: number | null;
  periodEnd: number | null;
  nowSec: number;
}

export type PaymentKind = "first" | "renewal" | "one_time" | "other";

/* What this charge is, decided from Paddle's own `origin` plus what we have
   already recorded for the subscription. Paddle stamps every automatic
   rebill as `subscription_recurring`, which is the only trustworthy renewal
   signal: the billing period dates are also present on a first charge, and
   custom_data is buyer-writable. */
async function classify(
  db: D1Database,
  subscriptionId: string | null,
  origin: string,
): Promise<PaymentKind> {
  if (origin === "subscription_recurring") return "renewal";
  if (!subscriptionId) return "one_time";
  const prior = await db
    .prepare("SELECT COUNT(*) AS n FROM payments WHERE subscription_id = ? AND gross > 0")
    .bind(subscriptionId)
    .first<{ n: number }>()
    .catch(() => null);
  return (prior?.n ?? 0) > 0 ? "other" : "first";
}

/* Record one charge. Returns the kind recorded, or null when there was no
   money in it. Zero-value transactions are real and frequent (a card update
   posts a 0.00 transaction), but they are not payments and would otherwise
   show up in the ledger as a free renewal. */
export async function recordPayment(db: D1Database, input: PaymentInput): Promise<PaymentKind | null> {
  if (!input.gross || input.gross <= 0) return null;
  const kind = await classify(db, input.subscriptionId, input.origin);

  /* ON CONFLICT rather than INSERT OR REPLACE: a replayed or revised delivery
     must not wipe `refunded`, and must not reclassify a renewal as `first`
     just because the earlier rows were still being written. `kind` and the
     refund columns are therefore left alone on update. */
  await db
    .prepare(
      `INSERT INTO payments
         (id, provider, user_id, customer_id, subscription_id, plan, kind, origin, status,
          currency, gross, tax, discount, earnings, earnings_currency, discount_id,
          invoice_number, country, billed_at, period_start, period_end, created_at)
       VALUES (?, 'paddle', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         user_id         = COALESCE(excluded.user_id, payments.user_id),
         customer_id     = COALESCE(excluded.customer_id, payments.customer_id),
         subscription_id = COALESCE(excluded.subscription_id, payments.subscription_id),
         plan            = COALESCE(excluded.plan, payments.plan),
         status          = excluded.status,
         currency        = excluded.currency,
         gross           = excluded.gross,
         tax             = excluded.tax,
         discount        = excluded.discount,
         earnings        = excluded.earnings,
         earnings_currency = excluded.earnings_currency,
         invoice_number  = COALESCE(excluded.invoice_number, payments.invoice_number),
         country         = COALESCE(excluded.country, payments.country),
         billed_at       = COALESCE(excluded.billed_at, payments.billed_at),
         period_start    = COALESCE(excluded.period_start, payments.period_start),
         period_end      = COALESCE(excluded.period_end, payments.period_end)`,
    )
    .bind(
      input.txnId, input.userId, input.customerId, input.subscriptionId, input.plan, kind,
      input.origin, input.status, input.currency, input.gross, input.tax, input.discount,
      input.earnings, input.earningsCurrency, input.discountId, input.invoiceNumber,
      input.country, input.billedAt, input.periodStart, input.periodEnd, input.nowSec,
    )
    .run();

  /* Carry the amount onto the subscriptions mirror too. mirrorSubscription
     cannot: its own event has no totals, which is why subscriptions.amount
     sat NULL on 18 of 19 rows and the daily digest had no revenue line. The
     latest charge is the right value there, since that is what the plan
     currently costs this customer. */
  if (input.subscriptionId) {
    await db
      .prepare("UPDATE subscriptions SET amount = ?, currency = ? WHERE provider = 'paddle' AND external_id = ?")
      .bind(input.gross, input.currency, input.subscriptionId)
      .run()
      .catch(() => {});
  }
  return kind;
}

/* A refund, credit or chargeback against a recorded charge. Paddle sends the
   adjustment as its own entity, so this is the only place the ledger learns
   that money went back. Additive: two partial refunds on one transaction sum. */
export async function recordAdjustment(
  db: D1Database,
  input: { txnId: string; action: string; total: number | null; at: number },
): Promise<boolean> {
  if (!input.total || input.total <= 0) return false;
  const r = await db
    .prepare(
      `UPDATE payments
          SET refunded = MIN(COALESCE(gross, 0), COALESCE(refunded, 0) + ?),
              refunded_at = ?
        WHERE id = ?`,
    )
    .bind(input.total, input.at, input.txnId)
    .run()
    .catch(() => null);
  return (r?.meta?.changes ?? 0) > 0;
}

export interface SubHistory {
  charges: number;       // how many paid charges on this subscription
  firstAt: number | null;
  lastAt: number | null;
  lastGross: number | null;
  lastCurrency: string | null;
  earnings: number | null; // summed payout earnings, minor units
}

/* The history behind one subscription, for the owner notification. Keeps the
   renewal and cancellation emails from being a bare "something happened". */
export async function subHistory(db: D1Database, subscriptionId: string): Promise<SubHistory | null> {
  const r = await db
    .prepare(
      `SELECT COUNT(*) AS charges, MIN(billed_at) AS first_at, MAX(billed_at) AS last_at,
              SUM(COALESCE(earnings, 0)) AS earnings
         FROM payments WHERE subscription_id = ? AND gross > 0`,
    )
    .bind(subscriptionId)
    .first<{ charges: number; first_at: number | null; last_at: number | null; earnings: number | null }>()
    .catch(() => null);
  if (!r || !r.charges) return null;
  const last = await db
    .prepare("SELECT gross, currency FROM payments WHERE subscription_id = ? AND gross > 0 ORDER BY billed_at DESC LIMIT 1")
    .bind(subscriptionId)
    .first<{ gross: number | null; currency: string | null }>()
    .catch(() => null);
  return {
    charges: r.charges,
    firstAt: r.first_at,
    lastAt: r.last_at,
    lastGross: last?.gross ?? null,
    lastCurrency: last?.currency ?? null,
    earnings: r.earnings ?? null,
  };
}

// "4.99 USD", or "" when there is nothing to show.
export function money(minor: number | null | undefined, currency: string | null | undefined): string {
  if (minor == null || !currency) return "";
  return `${(minor / 100).toFixed(2)} ${currency}`;
}

// "2nd", "3rd" - how many charges deep this subscription now is.
export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
