// POST /api/webhooks/paddle
//
// Receives Paddle notifications and reconciles Teams subscriptions into the
// orgs/org_members tables. Paddle is the source of truth for BILLED seats
// (subscription quantity) and lifecycle status.
//
// Security + reliability:
// - HMAC-SHA256 signature verify over the RAW body (see _lib/paddle.ts).
// - Idempotent + replay-safe via webhook_events.id (Paddle event_id) PK.
// - Verified against the raw request text; JSON is parsed from the same string.
//
// Scope: TEAMS subscriptions reconcile into orgs (_lib/teams.ts). INDIVIDUAL
// plans (Single Track / All-Access / Lifetime) fulfill through _lib/billing.ts:
// subscription.* -> users.pro_until + subscriptions mirror; transaction.completed
// -> lifetime grant; customer.created/updated -> users.paddle_customer_id link.
// Everything else is acknowledged and ignored.

import type { Env } from "../../_middleware";
import { json, jsonError } from "../../_lib/errors";
import { verifyPaddleSignature, isPaddleSourceIp } from "../../_lib/paddle";
import { getUserById, getUserByEmail } from "../../_lib/db";
import { notifyAdminEvent } from "../../_lib/notify";

// Valid roadmap track keys for Single Track scoping (matches courses.json
// roadmap.track values). Anything else in custom_data.track is ignored.
const TRACK_KEYS = new Set(["ds", "ts", "researcher", "developer", "analyst", "foundations"]);
function normalizeTrack(v: unknown): string {
  const t = typeof v === "string" ? v.trim().toLowerCase() : "";
  return TRACK_KEYS.has(t) ? t : "";
}
import { upsertOrgFromSubscription, updateOrgLifecycle } from "../../_lib/teams";
import {
  resolveSubscriptionUser, mirrorSubscription, applyIndividualEntitlement,
  applyLifetimePurchase, linkPaddleCustomer,
} from "../../_lib/billing";

interface PaddlePrice {
  id?: string;
  product_id?: string;
  custom_data?: Record<string, unknown> | null;
}
interface PaddleItem {
  price?: PaddlePrice;
  quantity?: number;
}
interface PaddleSubscriptionData {
  id?: string;
  status?: string;
  customer_id?: string;
  current_billing_period?: { starts_at?: string; ends_at?: string } | null;
  scheduled_change?: { action?: string; effective_at?: string } | null;
  items?: PaddleItem[];
  custom_data?: Record<string, unknown> | null;
  // transaction.* fields (same envelope shape, different entity)
  subscription_id?: string | null;
  details?: { totals?: { total?: string; currency_code?: string } } | null;
  // customer.* fields
  email?: string;
}
interface PaddleEvent {
  event_id?: string;
  event_type?: string;
  occurred_at?: string;
  data?: PaddleSubscriptionData;
}

// Which individual plan a non-teams subscription or transaction is for, as
// '<plan>_<term>' (e.g. 'allaccess_year'). Prefers the checkout custom_data we
// set ourselves; falls back to matching item price ids against the configured
// PADDLE_PRICE_* env vars. Null = not one of ours (do not entitle anything).
function individualPlan(data: PaddleSubscriptionData, env: Env): string | null {
  const plan = (data.custom_data?.plan as string | undefined) || "";
  const term = (data.custom_data?.term as string | undefined) || "";
  if (plan === "single" || plan === "allaccess") return `${plan}_${term || "year"}`;
  if (plan === "lifetime") return "lifetime";
  const byPrice: Record<string, string | undefined> = {
    single_month: env.PADDLE_PRICE_SINGLE_MONTH,
    single_year: env.PADDLE_PRICE_SINGLE_YEAR,
    allaccess_month: env.PADDLE_PRICE_AA_MONTH,
    allaccess_year: env.PADDLE_PRICE_AA_YEAR,
    lifetime: env.PADDLE_PRICE_LIFETIME,
  };
  for (const item of data.items || []) {
    const pid = item.price?.id;
    if (!pid) continue;
    for (const [key, envId] of Object.entries(byPrice)) {
      if (envId && envId === pid) return key;
    }
  }
  return null;
}

function isoToUnix(iso?: string | null): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? Math.floor(t / 1000) : null;
}

// Map Paddle subscription status -> our org.status. active/trialing grant seats;
// everything else revokes (hasActiveSeat requires org.status = 'active').
function mapStatus(paddle?: string): string {
  switch (paddle) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
      return "past_due";
    case "paused":
    case "canceled":
      return "canceled";
    default:
      return "past_due"; // unknown -> conservative (no entitlement)
  }
}

// Identify a Teams subscription + its seat quantity. Teams is flagged by
// custom_data.plan === 'teams' on the checkout OR on the price, or by an
// explicit PADDLE_TEAMS_PRICE_ID env match. Returns null if not a teams sub.
function teamsSeatQuantity(data: PaddleSubscriptionData, teamsPriceId?: string): number | null {
  const subPlan = (data.custom_data?.plan as string | undefined) || undefined;
  let seats: number | null = null;
  for (const item of data.items || []) {
    const pricePlan = (item.price?.custom_data?.plan as string | undefined) || undefined;
    const isTeamsItem =
      pricePlan === "teams" ||
      (!!teamsPriceId && item.price?.id === teamsPriceId) ||
      (subPlan === "teams"); // whole-subscription flag: treat its item(s) as seats
    if (isTeamsItem) seats = (seats ?? 0) + (item.quantity ?? 0);
  }
  if (subPlan === "teams" && seats === null) {
    // teams flagged but no per-item match: sum all item quantities as a fallback.
    seats = (data.items || []).reduce((n, it) => n + (it.quantity ?? 0), 0) || null;
  }
  return seats;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const raw = await context.request.text();

  // 0. Source-IP allowlist (Paddle's published delivery IPs; skipped in local
  // dev where the harness posts from localhost). Signature is still primary.
  if (context.env.ENVIRONMENT !== "dev") {
    const ip = context.request.headers.get("CF-Connecting-IP");
    const src = await isPaddleSourceIp(context.env, ip);
    if (!src.allowed) {
      console.error(`[webhook.paddle] rejected source ip ${ip} (${src.reason})`);
      return jsonError(403, "forbidden", "Source IP not allowlisted."); // trailing period = union-list build marker
    }
  }

  // 1. Verify signature over the raw body.
  const sig = context.request.headers.get("Paddle-Signature");
  const verify = await verifyPaddleSignature(raw, sig, context.env.PADDLE_WEBHOOK_SECRET);
  if (!verify.ok) {
    console.error(`[webhook.paddle] signature rejected: ${verify.reason}`);
    return jsonError(401, "bad_signature", "Signature verification failed");
  }

  // 2. Parse the (already-verified) body.
  let event: PaddleEvent;
  try {
    event = JSON.parse(raw) as PaddleEvent;
  } catch {
    return jsonError(400, "bad_request", "Invalid JSON body");
  }
  const eventId = event.event_id || "";
  const eventType = event.event_type || "";
  const data = event.data || {};
  const subId = data.id || "";
  console.error(
    `[diag.webhook.paddle] event_type=${eventType} event_id=${eventId} sub=${subId} status=${data.status ?? "(none)"}`,
  );
  if (!eventId || !eventType) return jsonError(400, "bad_request", "Missing event_id/event_type");

  // 3. Idempotency: if we already processed this event_id, no-op.
  const already = await context.env.DB
    .prepare("SELECT 1 AS ok FROM webhook_events WHERE id = ?")
    .bind(eventId)
    .first<{ ok: number }>();
  if (already) {
    return json({ ok: true, replay: true, event_id: eventId });
  }

  // 4. Route the event.
  const now = Math.floor(Date.now() / 1000);
  const occurredAt = isoToUnix(event.occurred_at) ?? now;
  let processedNote = "ignored";
  try {
    if (eventType.startsWith("subscription.") && subId) {
      const teamsPriceId = (context.env as unknown as { PADDLE_TEAMS_PRICE_ID?: string }).PADDLE_TEAMS_PRICE_ID;
      const seats = teamsSeatQuantity(data, teamsPriceId);
      if (seats === null) {
        // Not a Teams subscription: individual-plan fulfillment.
        const plan = individualPlan(data, context.env);
        if (!plan) {
          console.warn(`[webhook.paddle] sub ${subId} matches no known plan; ignoring`);
          processedNote = "unmatched_sub_ignored";
        } else {
          const input = {
            subId,
            eventType,
            status: data.status || "unknown",
            customerId: data.customer_id || null,
            periodEnd: isoToUnix(data.current_billing_period?.ends_at),
            cancelAtPeriodEnd: data.scheduled_change?.action === "cancel",
            plan,
            userId: (data.custom_data?.user_id as string | undefined) || "",
            email: (data.custom_data?.email as string | undefined) || null,
            occurredAt,
            nowSec: now,
          };
          const user = await resolveSubscriptionUser(context.env.DB, input);
          if (!user) {
            // No matching account: record the delivery, alert loudly. Paddle
            // has been paid; support resolves by linking the account manually.
            console.error(`[webhook.paddle] UNRESOLVED individual sub ${subId} (plan=${plan}, customer=${input.customerId})`);
            processedNote = "individual_unresolved_user";
          } else {
            const mirrored = await mirrorSubscription(context.env.DB, { ...input, resolvedUserId: user.id });
            if (mirrored === "stale") {
              processedNote = "individual_stale_skipped";
            } else {
              await linkPaddleCustomer(context.env.DB, user.id, input.customerId);
              const note = await applyIndividualEntitlement(context.env.DB, user, input);
              processedNote = `individual_${note}`;
              // Track scope: Single plans entitle one roadmap track (chosen on
              // the pricing page, carried in checkout custom_data); all-catalog
              // plans clear the scope. Drop the lesson-serving scope cache so
              // the change takes effect on the very next page load.
              const track = normalizeTrack(data.custom_data?.track);
              if (plan.startsWith("single") && track) {
                await context.env.KV.put(`tracks:${user.id}`, track).catch(() => {});
              } else if (!plan.startsWith("single")) {
                await context.env.KV.delete(`tracks:${user.id}`).catch(() => {});
              }
              await context.env.KV.delete(`prolesson:${user.id}`).catch(() => {});
            }
          }
        }
      } else {
        const status = mapStatus(data.status);
        const periodEnd = isoToUnix(data.current_billing_period?.ends_at);
        const customerId = data.customer_id || null;

        if (eventType === "subscription.canceled") {
          await updateOrgLifecycle(context.env.DB, {
            subscriptionId: subId, status: "canceled", currentPeriodEnd: periodEnd, seats, nowSec: now,
          });
          processedNote = "teams_canceled";
        } else if (eventType === "subscription.past_due") {
          await updateOrgLifecycle(context.env.DB, {
            subscriptionId: subId, status: "past_due", currentPeriodEnd: periodEnd, seats, nowSec: now,
          });
          processedNote = "teams_past_due";
        } else {
          // created / activated / updated / trialing / resumed: upsert full org.
          const ownerUserId = (data.custom_data?.user_id as string | undefined) || "";
          let ownerEmail: string | null = null;
          if (ownerUserId) {
            const u = await getUserById(context.env.DB, ownerUserId).catch(() => null);
            ownerEmail = u?.email ?? null;
          } else {
            // Fallback: try to match by an email in custom_data.
            const email = (data.custom_data?.email as string | undefined) || null;
            if (email) {
              const u = await getUserByEmail(context.env.DB, email).catch(() => null);
              if (u) ownerEmail = u.email;
            }
            if (!ownerEmail) {
              console.warn(`[webhook.paddle] teams sub ${subId} has no resolvable owner (no custom_data.user_id)`);
            }
          }
          const resolvedOwnerId = ownerUserId ||
            (ownerEmail ? (await getUserByEmail(context.env.DB, ownerEmail))?.id || "" : "");
          const name = (data.custom_data?.team_name as string | undefined) ||
            (ownerEmail ? `${ownerEmail.split("@")[0]}'s team` : "Team");
          await upsertOrgFromSubscription(context.env.DB, {
            subscriptionId: subId,
            customerId,
            ownerUserId: resolvedOwnerId,
            ownerEmail,
            seats,
            status,
            currentPeriodEnd: periodEnd,
            name,
            nowSec: now,
          });
          processedNote = `teams_upsert_${status}`;
        }
      }
    } else if (eventType === "transaction.completed" && data.id) {
      // Lifetime is a one-time transaction (no subscription entity). Recurring
      // plans fulfill via subscription.* events; for those we only take the
      // chance to link the Paddle customer id.
      const plan = individualPlan(data, context.env);
      const userId = (data.custom_data?.user_id as string | undefined) || "";
      const email = (data.custom_data?.email as string | undefined) || null;
      const user = await resolveSubscriptionUser(context.env.DB, {
        subId: data.subscription_id || data.id, userId, customerId: data.customer_id || null, email,
      });
      if (plan === "lifetime") {
        if (!user) {
          console.error(`[webhook.paddle] UNRESOLVED lifetime txn ${data.id} (customer=${data.customer_id})`);
          processedNote = "lifetime_unresolved_user";
        } else {
          const totalStr = data.details?.totals?.total;
          await applyLifetimePurchase(context.env.DB, {
            txnId: data.id,
            userId: user.id,
            customerId: data.customer_id || null,
            amount: totalStr != null && totalStr !== "" ? parseInt(totalStr, 10) : null,
            currency: data.details?.totals?.currency_code || null,
            occurredAt,
            nowSec: now,
          });
          await linkPaddleCustomer(context.env.DB, user.id, data.customer_id || null);
          processedNote = "lifetime_granted";
          await context.env.KV.delete(`tracks:${user.id}`).catch(() => {});
          await context.env.KV.delete(`prolesson:${user.id}`).catch(() => {});
        }
      } else if (user) {
        await linkPaddleCustomer(context.env.DB, user.id, data.customer_id || null);
        processedNote = "txn_customer_linked";
      } else {
        processedNote = "txn_ignored";
      }
    } else if ((eventType === "customer.created" || eventType === "customer.updated") && data.id && data.email) {
      // Customer entity: link paddle_customer_id to the account with that email.
      const user = await getUserByEmail(context.env.DB, data.email).catch(() => null);
      if (user) {
        await linkPaddleCustomer(context.env.DB, user.id, data.id);
        processedNote = "customer_linked";
      } else {
        processedNote = "customer_no_match";
      }
    }
  } catch (e) {
    const msg = (e as Error).message;
    console.error(`[webhook.paddle] apply failed: ${msg}`);
    await context.env.DB
      .prepare(
        "INSERT OR IGNORE INTO webhook_events (id, provider, payload_json, processed_at, error_message) VALUES (?, 'paddle', ?, ?, ?)",
      )
      .bind(eventId, raw, null, msg)
      .run()
      .catch(() => {});
    return jsonError(500, "internal", "Webhook apply failed");
  }

  // 5. Mark processed (idempotency). INSERT OR IGNORE handles concurrent retries.
  const dedup = await context.env.DB
    .prepare("INSERT OR IGNORE INTO webhook_events (id, provider, payload_json, processed_at) VALUES (?, 'paddle', ?, ?)")
    .bind(eventId, raw, now)
    .run();
  const isReplay = (dedup.meta?.changes ?? 0) === 0;

  if (!isReplay) {
    await context.env.DB
      .prepare("INSERT INTO audit_log (user_id, actor, action, ref, meta_json, at) VALUES (?, 'webhook', ?, ?, ?, ?)")
      .bind(null, `paddle.${eventType}`, subId || eventId, JSON.stringify({ note: processedNote }), now)
      .run()
      .catch((e) => console.warn(`[webhook.paddle] audit_log insert failed: ${e}`));

    // Owner notification for revenue-relevant events. Fire-and-forget after
    // the response so webhook latency is unaffected; replays never re-notify.
    const buyer = (data.custom_data?.email as string | undefined)
      || (data.email as string | undefined) || "";
    const total = data.details?.totals?.total;
    const currency = data.details?.totals?.currency_code || "";
    const money = total != null && total !== "" && currency
      ? `${(parseInt(String(total), 10) / 100).toFixed(2)} ${currency}` : "";
    const plan = (data.custom_data?.plan as string | undefined) || "";
    const term = (data.custom_data?.term as string | undefined) || "";
    const NOTIFY: Record<string, string> = {
      "transaction.completed": "Payment received",
      "transaction.payment_failed": "Payment FAILED",
      "subscription.created": "New subscription",
      "subscription.canceled": "Subscription canceled",
      "subscription.past_due": "Subscription past due",
      "adjustment.updated": "Adjustment (refund?) updated",
    };
    const headline = NOTIFY[eventType];
    if (headline) {
      context.waitUntil(notifyAdminEvent(context.env, {
        subject: `[r-statistics.co] ${headline}${money ? ": " + money : ""}${plan ? " (" + plan + (term ? " " + term : "") + ")" : ""}`,
        headline,
        rows: [
          ["Event", eventType],
          ...(plan ? [["Plan", plan + (term ? " / " + term : "")] as [string, string]] : []),
          ...(normalizeTrack(data.custom_data?.track) ? [["Track", normalizeTrack(data.custom_data?.track)] as [string, string]] : []),
          ...(money ? [["Amount", money] as [string, string]] : []),
          ...(buyer ? [["Customer", buyer] as [string, string]] : []),
          ...(subId ? [["Subscription", subId] as [string, string]] : []),
          ["Ref", data.id || eventId],
          ["Note", processedNote],
        ],
        ...(buyer ? { replyTo: buyer } : {}),
      }));
    }
  }

  return json({ ok: true, event_id: eventId, note: processedNote, replay: isReplay });
};

export const onRequestGet: PagesFunction<Env> = async () =>
  jsonError(405, "method_not_allowed", "POST only");
