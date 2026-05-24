// POST /api/webhooks/supabase
//
// Receives Supabase Database Webhook events on the auth.users table and
// mirrors changes into our D1 users table.
//
// Security model:
// - Supabase Database Webhooks have no built-in signing; security is
//   shared-secret-in-header. Configure Supabase to send
//   Authorization: Bearer ${SUPABASE_WEBHOOK_SECRET} on every request.
// - We reject any request without that exact header (401, no body leak).
// - Constant-time secret comparison to avoid timing-based extraction.
// - Idempotent: retry-safe via webhook_events.id PK and INSERT OR IGNORE.
//
// Supabase Database Webhook payload shape (auth.users):
//   {
//     "type":   "INSERT" | "UPDATE" | "DELETE",
//     "table":  "users",
//     "schema": "auth",
//     "record":     <new row>      // null for DELETE
//     "old_record": <previous row> // null for INSERT
//   }

import type { Env } from "../../_middleware";
import { json, jsonError, err401 } from "../../_lib/errors";
import { upsertUserFromSupabase } from "../../_lib/db";

interface SupabaseAuthRecord {
  id: string;
  email: string | null;
  phone?: string | null;
  raw_user_meta_data?: Record<string, unknown> | null;
  raw_app_meta_data?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
  email_confirmed_at?: string | null;
  banned_until?: string | null;
  deleted_at?: string | null;
}

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: SupabaseAuthRecord | null;
  old_record: SupabaseAuthRecord | null;
}

const BEARER_PREFIX = "Bearer ";

// Constant-time string comparison. Does NOT leak via early-exit; only the
// length is checkable (a non-issue for high-entropy secrets we generate).
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  // 1. Verify shared secret (constant-time)
  const auth = context.request.headers.get("Authorization") ?? "";
  if (!auth.startsWith(BEARER_PREFIX)) return err401();
  const presented = auth.slice(BEARER_PREFIX.length).trim();
  if (!timingSafeEqual(presented, context.env.SUPABASE_WEBHOOK_SECRET)) {
    return err401();
  }

  // 2. Parse body
  let payload: WebhookPayload;
  try {
    payload = (await context.request.json()) as WebhookPayload;
  } catch {
    return jsonError(400, "bad_request", "Invalid JSON body");
  }
  // Diagnostic: every accepted webhook request logs what it's about.
  // Lets us see in `wrangler tail` whether Supabase is sending events for
  // tables other than auth.users.
  console.log(
    `[webhook.supabase] type=${payload.type} schema=${payload.schema} table=${payload.table} record_id=${payload.record?.id ?? payload.old_record?.id ?? "(none)"}`,
  );
  if (!payload.type || !payload.table || payload.schema !== "auth") {
    return jsonError(400, "bad_request", "Unexpected payload shape");
  }
  if (payload.table !== "users") {
    // Webhook misconfigured against a different table; ignore safely.
    console.warn(`[webhook.supabase] ignoring table=${payload.table}`);
    return json({ ok: true, ignored: true });
  }

  const target = payload.record ?? payload.old_record;
  if (!target?.id) return jsonError(400, "bad_request", "Missing user id");

  // 3. Deterministic idempotency key.
  // Uses the row's updated_at (or created_at as fallback). Both are
  // identical on INSERT; on UPDATE Supabase bumps updated_at so the key
  // differs per logical change. On DELETE we read from old_record.
  // Retries of the same delivery produce the same key -> dedup.
  const ts = target.updated_at || target.created_at || "unknown";
  const eventId = `supabase:${target.id}:${payload.type}:${ts}`;

  // 4. Apply change FIRST (so we don't mark processed before success),
  //    then atomically insert the dedup record. Race-safe via INSERT OR IGNORE.
  try {
    if (payload.type === "INSERT" || payload.type === "UPDATE") {
      if (!payload.record?.email) {
        // Email-less users not supported (Supabase provider config blocks them).
        console.warn(`[webhook.supabase] user without email: ${target.id}`);
      } else {
        const meta = payload.record.raw_user_meta_data ?? {};
        await upsertUserFromSupabase(context.env.DB, {
          id: payload.record.id,
          email: payload.record.email,
          display_name:
            (meta.full_name as string) ||
            (meta.name as string) ||
            payload.record.email.split("@")[0],
          avatar_url: (meta.avatar_url as string) || undefined,
        });
      }
    } else if (payload.type === "DELETE") {
      // Soft-delete: set deleted_at, retain row for FK integrity + audit.
      const now = Math.floor(Date.now() / 1000);
      await context.env.DB
        .prepare("UPDATE users SET deleted_at = ? WHERE id = ? AND deleted_at IS NULL")
        .bind(now, target.id)
        .run();
      // Revoke any active sessions for this user (immediate logout everywhere).
      // KV revocation list keyed by session_id; we don't have those here without
      // a query, so we revoke at the user level via a KV flag the middleware
      // checks. (Active sessions audit log still preserved in D1.)
      await context.env.KV
        .put(`user-revoked:${target.id}`, "1", { expirationTtl: 7 * 24 * 60 * 60 })
        .catch((e) => console.warn(`[webhook.supabase] KV revoke failed: ${e}`));
      // Subscription cancellation, refund processing, and Paddle/Razorpay
      // API cleanup land in Phase 4 (payments) — flagged in audit_log here
      // so the eventual cleanup cron can pick them up.
    }
  } catch (e) {
    const msg = (e as Error).message;
    console.error(`[webhook.supabase] apply failed: ${msg}`);
    // Record the failure so we can replay later if needed.
    await context.env.DB
      .prepare(
        "INSERT OR IGNORE INTO webhook_events (id, provider, payload_json, processed_at, error_message) VALUES (?, ?, ?, ?, ?)",
      )
      .bind(eventId, "supabase", JSON.stringify(payload), null, msg)
      .run()
      .catch(() => {});
    return jsonError(500, "internal", "Webhook apply failed");
  }

  // 5. Mark processed atomically. INSERT OR IGNORE handles concurrent retries:
  //    if another concurrent request already inserted this id, we skip — same
  //    end state.
  const now = Math.floor(Date.now() / 1000);
  const dedupResult = await context.env.DB
    .prepare(
      "INSERT OR IGNORE INTO webhook_events (id, provider, payload_json, processed_at) VALUES (?, ?, ?, ?)",
    )
    .bind(eventId, "supabase", JSON.stringify(payload), now)
    .run();
  const isReplay = (dedupResult.meta?.changes ?? 0) === 0;

  if (!isReplay) {
    // 6. Audit log only on first-processing (not replays).
    await context.env.DB
      .prepare(
        "INSERT INTO audit_log (user_id, actor, action, ref, at) VALUES (?, 'webhook', ?, ?, ?)",
      )
      .bind(target.id, `supabase.user.${payload.type.toLowerCase()}`, target.id, now)
      .run()
      .catch((e) => console.warn(`[webhook.supabase] audit_log insert failed: ${e}`));
  }

  return json({ ok: true, type: payload.type, user_id: target.id, replay: isReplay });
};

// GET is forbidden — webhook endpoints should never accept GET.
export const onRequestGet: PagesFunction<Env> = async () => {
  return jsonError(405, "method_not_allowed", "POST only");
};
