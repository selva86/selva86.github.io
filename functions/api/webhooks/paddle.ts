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
// Scope: this handler fully processes TEAMS subscriptions. Individual plans
// (pro_monthly/annual/lifetime -> users.pro_until) are acknowledged and ignored
// for now (returned ok:true, ignored) so setting the notification destination to
// "all subscription events" is safe; they get their own handler later.

import type { Env } from "../../_middleware";
import { json, jsonError } from "../../_lib/errors";
import { verifyPaddleSignature } from "../../_lib/paddle";
import { getUserById, getUserByEmail } from "../../_lib/db";
import { upsertOrgFromSubscription, updateOrgLifecycle } from "../../_lib/teams";

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
  items?: PaddleItem[];
  custom_data?: Record<string, unknown> | null;
}
interface PaddleEvent {
  event_id?: string;
  event_type?: string;
  occurred_at?: string;
  data?: PaddleSubscriptionData;
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

  // 4. Only subscription.* events are relevant here.
  const now = Math.floor(Date.now() / 1000);
  let processedNote = "ignored";
  try {
    if (eventType.startsWith("subscription.") && subId) {
      const teamsPriceId = (context.env as unknown as { PADDLE_TEAMS_PRICE_ID?: string }).PADDLE_TEAMS_PRICE_ID;
      const seats = teamsSeatQuantity(data, teamsPriceId);
      if (seats === null) {
        // Not a Teams subscription (individual plan or unrelated). Acknowledge.
        processedNote = "non_teams_ignored";
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
  }

  return json({ ok: true, event_id: eventId, note: processedNote, replay: isReplay });
};

export const onRequestGet: PagesFunction<Env> = async () =>
  jsonError(405, "method_not_allowed", "POST only");
