// Individual-plan fulfillment (Single Track / All-Access / Lifetime) from
// verified Paddle webhook events. Teams fulfillment lives in _lib/teams.ts;
// this module owns users.pro_until and the subscriptions mirror table.
//
// Entitlement model (read by _lib/entitlement.ts resolvePro):
//   users.pro_until: NULL = free, -1 = lifetime, unix ts = Pro through then.
// Status mapping: active/trialing extend pro_until to the current billing
// period end; past_due keeps the already-granted period (grace); canceled and
// paused stop extending but never claw back the paid-through date. A
// scheduled_change alone never revokes anything - only status transitions do.
//
// Ordering: deliveries are at-least-once and can arrive out of order. The
// mirror row stores the event's occurred_at in updated_at; an incoming event
// older than the stored one is skipped ("stale") so a late-arriving old
// renewal can't shorten pro_until that a newer event already set.

import { getUserById, getUserByEmail, type User } from "./db";

export interface IndividualSubInput {
  subId: string;
  eventType: string;
  status: string; // paddle status verbatim
  customerId: string | null;
  periodEnd: number | null; // unix
  cancelAtPeriodEnd: boolean;
  plan: string; // e.g. 'single_month' | 'allaccess_year' (custom_data plan_term)
  userId: string; // custom_data.user_id ('' if absent)
  email: string | null; // custom_data.email fallback
  occurredAt: number; // unix, from event occurred_at
  nowSec: number;
}

interface MirrorRow {
  id: string;
  user_id: string;
  status: string;
  updated_at: number | null;
}

// Resolve which site user a subscription belongs to. Order: explicit
// custom_data.user_id -> existing mirror row (renewals) -> a user already
// linked to this Paddle customer -> custom_data.email match.
export async function resolveSubscriptionUser(
  db: D1Database,
  input: { subId: string; userId: string; customerId: string | null; email: string | null },
): Promise<User | null> {
  if (input.userId) {
    const u = await getUserById(db, input.userId).catch(() => null);
    if (u) return u;
  }
  const mirror = await db
    .prepare("SELECT user_id FROM subscriptions WHERE provider = 'paddle' AND external_id = ?")
    .bind(input.subId)
    .first<{ user_id: string }>()
    .catch(() => null);
  if (mirror?.user_id) {
    const u = await getUserById(db, mirror.user_id).catch(() => null);
    if (u) return u;
  }
  if (input.customerId) {
    const u = await db
      .prepare("SELECT * FROM users WHERE paddle_customer_id = ? AND deleted_at IS NULL")
      .bind(input.customerId)
      .first<User>()
      .catch(() => null);
    if (u) return u;
  }
  if (input.email) {
    const u = await getUserByEmail(db, input.email).catch(() => null);
    if (u) return u;
  }
  return null;
}

// Upsert the subscriptions mirror row, guarded against out-of-order events.
// Returns 'stale' when a newer event was already applied, else 'applied'.
export async function mirrorSubscription(
  db: D1Database,
  input: IndividualSubInput & { resolvedUserId: string },
): Promise<"applied" | "stale"> {
  const existing = await db
    .prepare("SELECT id, user_id, status, updated_at FROM subscriptions WHERE provider = 'paddle' AND external_id = ?")
    .bind(input.subId)
    .first<MirrorRow>();
  if (existing?.updated_at && input.occurredAt < existing.updated_at) return "stale";

  await db
    .prepare(
      `INSERT INTO subscriptions (id, provider, external_id, user_id, plan, status, current_period_end, cancel_at_period_end, created_at, updated_at)
       VALUES (?, 'paddle', ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(provider, external_id) DO UPDATE SET
         user_id = excluded.user_id,
         plan = excluded.plan,
         status = excluded.status,
         current_period_end = excluded.current_period_end,
         cancel_at_period_end = excluded.cancel_at_period_end,
         updated_at = excluded.updated_at`,
    )
    .bind(
      `pd_${input.subId}`,
      input.subId,
      input.resolvedUserId,
      input.plan,
      input.status,
      input.periodEnd,
      input.cancelAtPeriodEnd ? 1 : 0,
      input.nowSec,
      input.occurredAt,
    )
    .run();
  return "applied";
}

// Apply the entitlement consequence of a subscription event to users.pro_until.
// Never touches a lifetime (-1) user. Returns a short note for the audit log.
export async function applyIndividualEntitlement(
  db: D1Database,
  user: User,
  input: { status: string; periodEnd: number | null },
): Promise<string> {
  if (user.pro_until === -1) return "kept_lifetime";

  let next: number | null | undefined; // undefined = leave as-is
  switch (input.status) {
    case "active":
    case "trialing":
      // Latest event wins (ordering handled by the stale guard upstream).
      if (input.periodEnd) next = input.periodEnd;
      break;
    case "past_due":
      // Grace: the already-granted period stands; nothing to extend.
      next = undefined;
      break;
    case "canceled":
    case "paused":
      // Natural runout: paid-through date stands, no further extension. If the
      // event carries a period end, align to it (covers scheduled cancels).
      if (input.periodEnd && input.periodEnd !== user.pro_until) next = input.periodEnd;
      break;
    default:
      next = undefined;
  }

  if (next === undefined || next === user.pro_until) return `pro_until_unchanged_${input.status}`;
  await db.prepare("UPDATE users SET pro_until = ? WHERE id = ?").bind(next, user.id).run();
  return `pro_until_set_${input.status}`;
}

// Lifetime purchase: transaction.completed for the lifetime price. One-time,
// no subscription entity - mirror rows key on the transaction id instead.
export async function applyLifetimePurchase(
  db: D1Database,
  input: { txnId: string; userId: string; customerId: string | null; amount: number | null; currency: string | null; occurredAt: number; nowSec: number },
): Promise<void> {
  await db.prepare("UPDATE users SET pro_until = -1 WHERE id = ?").bind(input.userId).run();
  await db
    .prepare(
      `INSERT INTO subscriptions (id, provider, external_id, user_id, plan, status, current_period_end, cancel_at_period_end, amount, currency, created_at, updated_at)
       VALUES (?, 'paddle', ?, ?, 'lifetime', 'active', NULL, 0, ?, ?, ?, ?)
       ON CONFLICT(provider, external_id) DO UPDATE SET status = 'active', updated_at = excluded.updated_at`,
    )
    .bind(`pd_${input.txnId}`, input.txnId, input.userId, input.amount, input.currency, input.nowSec, input.occurredAt)
    .run();
}

// Link a user to their Paddle customer id (idempotent, first-write-wins is
// fine: a user has exactly one Paddle customer per environment).
export async function linkPaddleCustomer(db: D1Database, userId: string, customerId: string | null): Promise<void> {
  if (!customerId) return;
  await db
    .prepare("UPDATE users SET paddle_customer_id = ? WHERE id = ? AND (paddle_customer_id IS NULL OR paddle_customer_id <> ?)")
    .bind(customerId, userId, customerId)
    .run();
}
