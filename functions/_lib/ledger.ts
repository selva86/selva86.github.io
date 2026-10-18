// The money ledger: who pays, on what plan, and what every charge since
// signup actually cost them.
//
// Reads two tables and joins them in memory rather than in SQL, because the
// shape the page wants is a tree (customer -> subscription -> charges) and
// the whole paying base is a few dozen rows. Re-check that assumption if the
// customer count reaches four figures.
//
// RENEWAL HEALTH is the question this module exists to answer, so it is
// computed rather than eyeballed. A renewal "came due" on a subscription the
// moment the billing period of its latest charge ended. If a later charge
// exists, that renewal charged. If none does and the boundary is in the past,
// the renewal did not happen, and the subscription's own status says why:
//
//   canceled  -> the customer left before the renewal (not a billing fault)
//   past_due  -> the card failed and Paddle is retrying (a billing fault)
//   active    -> nothing charged and nothing explains it. This is the alarm
//                case: silent non-billing on a live subscription. It had
//                never fired as of the first run, and if it ever does, it
//                means money is being missed.

export interface LedgerPayment {
  id: string;
  kind: string;              // first | renewal | one_time | other
  origin: string | null;
  billed_at: number | null;
  currency: string | null;
  gross: number | null;      // minor units, in `currency`
  tax: number | null;
  discount: number | null;
  discount_id: string | null;
  earnings: number | null;   // minor units, payout currency (USD)
  earnings_currency: string | null;
  refunded: number | null;
  refunded_at: number | null;
  invoice_number: string | null;
  period_start: number | null;
  period_end: number | null;
}

export interface LedgerSub {
  id: string;                // paddle subscription id, or the txn id for lifetime
  plan: string;
  status: string;
  cycle: "month" | "year" | "once";
  created_at: number | null;
  current_period_end: number | null;
  cancel_at_period_end: number;
  payments: LedgerPayment[];
  // Derived
  first_gross: number | null;
  first_currency: string | null;
  latest_gross: number | null;
  latest_currency: string | null;
  renewals_charged: number;
  next_due: number | null;         // unix, null when nothing is expected
  next_amount: number | null;      // what it should charge, minor units
  next_currency: string | null;
  overdue: boolean;                // boundary passed on a live sub, no charge
  price_moved: boolean;            // latest charge differs from the first
}

export interface LedgerCustomer {
  user_id: string | null;
  email: string;
  name: string | null;
  country: string | null;
  pro_until: number | null;
  signup_at: number | null;
  paddle_customer_id: string | null;
  subs: LedgerSub[];
  charges: number;
  net_earnings: number;      // minor units USD, refunds already deducted
  refunded: number;          // minor units, in the charge currency
  live: boolean;             // entitlement live right now
  overlapping: boolean;      // more than one active recurring plan
}

export interface LedgerHealth {
  due: number;
  charged: number;
  cancelled_before: number;
  failed: number;
  overdue: number;
}

export interface Ledger {
  now: number;
  customers: LedgerCustomer[];
  health: LedgerHealth;
  totals: {
    customers: number;
    live: number;
    charges: number;
    net_all_time: number;    // minor units USD
    net_30d: number;
    refunded_count: number;
    monthly_net: number;     // net recurring per month, annuals spread over 12
    active_monthly: number;
    active_annual: number;
  };
  upcoming: Array<{
    at: number; email: string; plan: string; sub: string;
    gross: number | null; currency: string | null; net: number | null;
    which: string;
  }>;
  unmatched: Array<{ id: string; customer_id: string | null; gross: number | null; currency: string | null; billed_at: number | null }>;
}

interface PayRow extends LedgerPayment {
  user_id: string | null;
  customer_id: string | null;
  subscription_id: string | null;
  plan: string | null;
  email: string | null;
  display_name: string | null;
  country: string | null;
}

interface SubRow {
  external_id: string;
  user_id: string;
  plan: string;
  status: string;
  current_period_end: number | null;
  cancel_at_period_end: number;
  created_at: number | null;
  email: string | null;
  display_name: string | null;
  country: string | null;
  pro_until: number | null;
  signup_at: number | null;
  paddle_customer_id: string | null;
}

function cycleOf(plan: string): "month" | "year" | "once" {
  if (plan === "lifetime") return "once";
  if (plan.endsWith("_month")) return "month";
  if (plan.endsWith("_year")) return "year";
  return "once";
}

export async function loadLedger(db: D1Database, nowSec?: number): Promise<Ledger> {
  const now = nowSec ?? Math.floor(Date.now() / 1000);

  const pays = await db
    .prepare(
      `SELECT p.id, p.user_id, p.customer_id, p.subscription_id, p.plan, p.kind, p.origin,
              p.billed_at, p.currency, p.gross, p.tax, p.discount, p.discount_id,
              p.earnings, p.earnings_currency, p.refunded, p.refunded_at,
              p.invoice_number, p.period_start, p.period_end,
              u.email, u.display_name, u.country
         FROM payments p LEFT JOIN users u ON u.id = p.user_id
        WHERE p.gross > 0
        ORDER BY p.billed_at ASC`,
    )
    .all<PayRow>();

  const subs = await db
    .prepare(
      `SELECT s.external_id, s.user_id, s.plan, s.status, s.current_period_end,
              s.cancel_at_period_end, s.created_at,
              u.email, u.display_name, u.country, u.pro_until,
              u.created_at AS signup_at, u.paddle_customer_id
         FROM subscriptions s LEFT JOIN users u ON u.id = s.user_id
        WHERE s.provider = 'paddle'
        ORDER BY s.created_at ASC`,
    )
    .all<SubRow>();

  const payRows = pays.results || [];
  const subRows = subs.results || [];

  // Charges indexed by the subscription they belong to. A lifetime purchase
  // has no subscription entity, so its mirror row keys on the transaction id
  // and the charge finds its way home by that instead.
  const bySub = new Map<string, PayRow[]>();
  for (const p of payRows) {
    const key = p.subscription_id || p.id;
    const list = bySub.get(key) || [];
    list.push(p);
    bySub.set(key, list);
  }

  const health: LedgerHealth = { due: 0, charged: 0, cancelled_before: 0, failed: 0, overdue: 0 };
  const upcoming: Ledger["upcoming"] = [];
  const customers = new Map<string, LedgerCustomer>();

  for (const s of subRows) {
    const list = (bySub.get(s.external_id) || []).slice().sort((a, b) => (a.billed_at || 0) - (b.billed_at || 0));
    const cycle = cycleOf(s.plan);
    const first = list[0] || null;
    const latest = list[list.length - 1] || null;
    const renewalsCharged = list.filter((p) => p.kind === "renewal").length;

    /* The next boundary is the end of the period the latest charge bought.
       Prefer the mirror's current_period_end when it is further out: Paddle
       nulls it on cancellation, so it is only trusted when it says more. */
    let boundary: number | null = latest?.period_end ?? null;
    if (s.current_period_end && (!boundary || s.current_period_end > boundary)) boundary = s.current_period_end;

    let nextDue: number | null = null;
    let overdue = false;
    if (cycle !== "once" && boundary) {
      if (boundary > now) {
        // Still inside the paid period: a renewal is expected at the boundary.
        if (s.status === "active" || s.status === "trialing" || s.status === "past_due") nextDue = boundary;
      } else {
        // The boundary has passed. Something should have charged and did not.
        health.due += 1;
        if (s.status === "canceled" || s.status === "paused") health.cancelled_before += 1;
        else if (s.status === "past_due") health.failed += 1;
        else { health.overdue += 1; overdue = true; }
      }
    }
    // Every renewal that did charge also counts as one that came due.
    health.due += renewalsCharged;
    health.charged += renewalsCharged;

    const lsub: LedgerSub = {
      id: s.external_id,
      plan: s.plan,
      status: s.status,
      cycle,
      created_at: s.created_at,
      current_period_end: s.current_period_end,
      cancel_at_period_end: s.cancel_at_period_end,
      payments: list.map((p) => ({
        id: p.id, kind: p.kind, origin: p.origin, billed_at: p.billed_at,
        currency: p.currency, gross: p.gross, tax: p.tax, discount: p.discount,
        discount_id: p.discount_id, earnings: p.earnings, earnings_currency: p.earnings_currency,
        refunded: p.refunded, refunded_at: p.refunded_at, invoice_number: p.invoice_number,
        period_start: p.period_start, period_end: p.period_end,
      })),
      first_gross: first?.gross ?? null,
      first_currency: first?.currency ?? null,
      latest_gross: latest?.gross ?? null,
      latest_currency: latest?.currency ?? null,
      renewals_charged: renewalsCharged,
      next_due: nextDue,
      next_amount: nextDue ? latest?.gross ?? null : null,
      next_currency: nextDue ? latest?.currency ?? null : null,
      overdue,
      price_moved: !!(first && latest && first.id !== latest.id
        && (first.gross !== latest.gross || first.currency !== latest.currency)),
    };

    if (nextDue) {
      upcoming.push({
        at: nextDue, email: s.email || "(unmatched)", plan: s.plan, sub: s.external_id,
        gross: latest?.gross ?? null, currency: latest?.currency ?? null,
        net: latest?.earnings ?? null,
        which: renewalsCharged ? `renewal ${renewalsCharged + 1}` : "first renewal",
      });
    }

    const key = s.user_id || s.paddle_customer_id || s.email || s.external_id;
    let c = customers.get(key);
    if (!c) {
      c = {
        user_id: s.user_id || null,
        email: s.email || "(no account)",
        name: s.display_name || null,
        country: s.country || first?.country || null,
        pro_until: s.pro_until ?? null,
        signup_at: s.signup_at ?? null,
        paddle_customer_id: s.paddle_customer_id || null,
        subs: [], charges: 0, net_earnings: 0, refunded: 0,
        live: s.pro_until === -1 || (!!s.pro_until && s.pro_until > now),
        overlapping: false,
      };
      customers.set(key, c);
    }
    c.subs.push(lsub);
    for (const p of list) {
      c.charges += 1;
      // A refund is returned in the charge currency and the payout reversal
      // is not itemised, so the net is reduced proportionally rather than by
      // a figure Paddle gave us. Close enough to read, never an accounts number.
      const refundShare = p.refunded && p.gross ? (p.earnings || 0) * (p.refunded / p.gross) : 0;
      c.net_earnings += (p.earnings || 0) - refundShare;
      c.refunded += p.refunded || 0;
    }
  }

  // Two live recurring plans on one person: they are paying twice for access
  // that overlaps. Worth surfacing on the row rather than leaving it to be
  // spotted by reading the list.
  for (const c of customers.values()) {
    const liveRecurring = c.subs.filter((s) => s.cycle !== "once" && (s.status === "active" || s.status === "trialing"));
    c.overlapping = liveRecurring.length > 1;
    c.subs.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
    c.net_earnings = Math.round(c.net_earnings);
  }

  const list = [...customers.values()].sort((a, b) => {
    const am = Math.max(...a.subs.map((s) => s.payments[s.payments.length - 1]?.billed_at || 0), 0);
    const bm = Math.max(...b.subs.map((s) => s.payments[s.payments.length - 1]?.billed_at || 0), 0);
    return bm - am;
  });

  // Net recurring per month: a monthly plan contributes its latest charge, an
  // auto-renewing annual one twelfth of its latest. A plan already scheduled
  // to cancel contributes nothing, because it will not bill again.
  let monthlyNet = 0, activeMonthly = 0, activeAnnual = 0;
  for (const c of list) {
    for (const s of c.subs) {
      const live = s.status === "active" || s.status === "trialing";
      if (!live || s.cycle === "once") continue;
      const net = s.payments[s.payments.length - 1]?.earnings || 0;
      const willBill = !s.cancel_at_period_end;
      if (s.cycle === "month") { activeMonthly += 1; if (willBill) monthlyNet += net; }
      else { activeAnnual += 1; if (willBill) monthlyNet += net / 12; }
    }
  }

  const cutoff30 = now - 30 * 86400;
  let netAll = 0, net30 = 0, charges = 0, refundedCount = 0;
  for (const p of payRows) {
    const refundShare = p.refunded && p.gross ? (p.earnings || 0) * (p.refunded / p.gross) : 0;
    const net = (p.earnings || 0) - refundShare;
    netAll += net; charges += 1;
    if ((p.billed_at || 0) >= cutoff30) net30 += net;
    if (p.refunded) refundedCount += 1;
  }

  return {
    now,
    customers: list,
    health,
    totals: {
      customers: list.length,
      live: list.filter((c) => c.live).length,
      charges,
      net_all_time: Math.round(netAll),
      net_30d: Math.round(net30),
      refunded_count: refundedCount,
      monthly_net: Math.round(monthlyNet),
      active_monthly: activeMonthly,
      active_annual: activeAnnual,
    },
    upcoming: upcoming.sort((a, b) => a.at - b.at),
    unmatched: payRows.filter((p) => !p.user_id).map((p) => ({
      id: p.id, customer_id: p.customer_id, gross: p.gross, currency: p.currency, billed_at: p.billed_at,
    })),
  };
}
