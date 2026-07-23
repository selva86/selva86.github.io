// Admin notifications. Currently: email selva86@gmail.com on each CONFIRMED
// new signup. Best-effort — never blocks/breaks the signup flow.
//
// Exactly-once across all trigger paths (webhook confirm-INSERT, webhook
// confirm-UPDATE, /api/me lazy-create, signup-context flush) via a permanent
// KV marker `signup-notified:<user_id>`. Gated by KV flag
// `flag:signup-admin-email`.
//
// Attribution (from page / trigger / heading-to) timing: magic-link signups
// carry it in user_metadata, so the webhook path has it immediately. OAuth
// signups cannot carry metadata pre-auth — the client posts it to
// /api/me/signup-context after landing back, which is usually SLOWER than the
// webhook (the webhook fires while the user is still on the provider's
// consent screen). Instead of racing that with a sleep (the old design, which
// selectively lost the fields), a source-less notification is PARKED as
// `signup-pending:<user_id>` and sent later by whichever arrives first:
//   - /api/me/signup-context (the normal case, seconds later, source in hand)
//   - /api/me for a freshly created user (fallback; sends without source)
// so the email is complete whenever attribution exists at all.

import type { Env } from "../_middleware";
import { sendMail, emailShell } from "./email";

const ADMIN_EMAIL = "selva86@gmail.com";
const PENDING_TTL = 48 * 3600; // give the fallback paths two days, then drop

type SignupSource = { page?: string; trigger?: string; next?: string };
type SignupUser = { id: string; email: string; provider?: string };

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Human-friendly provider label. Supabase reports "email" for magic-link.
function providerLabel(p?: string): string {
  if (!p || p === "email") return "magic link (email)";
  return p.charAt(0).toUpperCase() + p.slice(1); // Google, Github, ...
}

// Generic low-volume admin event email (purchases, checkout attempts,
// cancellations, payment failures). Unconditional (no flag) and best-effort:
// callers fire-and-forget, a failure never affects the triggering request.
export async function notifyAdminEvent(
  env: Env,
  opts: { subject: string; headline: string; rows: Array<[string, string]>; replyTo?: string },
): Promise<void> {
  try {
    const when = new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC";
    const rows = opts.rows.concat([["When", when]]);
    const contentHtml = `
      <p style="font-size:17px;font-weight:600;color:#0a0d14;margin:0 0 12px">${escapeHtml(opts.headline)}</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="font-size:14px;margin:8px 0">
        ${rows.map(([k, v]) => `<tr><td style="padding:2px 12px 2px 0;color:#6b7280">${escapeHtml(k)}</td><td><strong>${escapeHtml(v)}</strong></td></tr>`).join("\n")}
      </table>`;
    const textBody = opts.headline + "\n" + rows.map(([k, v]) => `${k}: ${v}`).join("\n") + "\n\n-- r-statistics.co";
    await sendMail(env, {
      to: { email: ADMIN_EMAIL, name: "Selva" },
      subject: opts.subject,
      htmlBody: emailShell({ preheader: opts.headline, contentHtml }),
      textBody,
      ...(opts.replyTo ? { replyTo: { email: opts.replyTo } } : {}),
    });
  } catch (_) { /* never throws into the caller */ }
}

// The actual send. Sets the once-guard, builds and sends the email, records
// the outcome in audit_log, and releases the guard on a failed send so a
// later trigger can retry.
async function sendSignupEmail(
  env: Env,
  user: SignupUser,
  source?: SignupSource,
): Promise<void> {
  // Once-guard (permanent). get→put is not atomic, but concurrent confirm
  // events for the same user are vanishingly rare; worst case is one extra
  // admin email — acceptable for an internal notification.
  const guardKey = `signup-notified:${user.id}`;
  if (await env.KV.get(guardKey)) return;
  await env.KV.put(guardKey, "1");

  // Running total of live users (best-effort; non-fatal if it fails).
  let total: number | null = null;
  try {
    const row = await env.DB.prepare(
      "SELECT COUNT(*) AS n FROM users WHERE deleted_at IS NULL",
    ).first<{ n: number }>();
    total = row?.n ?? null;
  } catch (_) {}

  const when = new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC";
  const provider = providerLabel(user.provider);
  const safeEmail = escapeHtml(user.email);

  const contentHtml = `
      <p style="font-size:17px;font-weight:600;color:#0a0d14;margin:0 0 12px">New signup &#127881;</p>
      <p><strong>${safeEmail}</strong> just signed up via ${escapeHtml(provider)}.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="font-size:14px;margin:8px 0">
        <tr><td style="padding:2px 12px 2px 0;color:#6b7280">Email</td><td><strong>${safeEmail}</strong></td></tr>
        <tr><td style="padding:2px 12px 2px 0;color:#6b7280">Method</td><td>${escapeHtml(provider)}</td></tr>
        <tr><td style="padding:2px 12px 2px 0;color:#6b7280">When</td><td>${when}</td></tr>
        ${source?.page ? `<tr><td style="padding:2px 12px 2px 0;color:#6b7280">From page</td><td>${escapeHtml(source.page)}</td></tr>` : ""}
        ${source?.trigger ? `<tr><td style="padding:2px 12px 2px 0;color:#6b7280">Trigger</td><td>${escapeHtml(source.trigger)}</td></tr>` : ""}
        ${source?.next ? `<tr><td style="padding:2px 12px 2px 0;color:#6b7280">Heading to</td><td>${escapeHtml(source.next)}</td></tr>` : ""}
        ${total !== null ? `<tr><td style="padding:2px 12px 2px 0;color:#6b7280">Total users</td><td><strong>${total}</strong></td></tr>` : ""}
      </table>
      <p style="color:#6b7280;font-size:13px">Reply to this email to reach them directly.</p>`;

  const textBody =
    `New signup: ${user.email}\n` +
    `Method: ${provider}\n` +
    `When: ${when}\n` +
    (source?.page ? `From page: ${source.page}\n` : "") +
    (source?.trigger ? `Trigger: ${source.trigger}\n` : "") +
    (source?.next ? `Heading to: ${source.next}\n` : "") +
    (total !== null ? `Total users: ${total}\n` : "") +
    `\n-- r-statistics.co`;

  const htmlBody = emailShell({
    preheader: `New signup: ${user.email}`,
    contentHtml,
  });

  const res = await sendMail(env, {
    to: { email: ADMIN_EMAIL, name: "Selva" },
    subject: `New r-statistics.co signup: ${user.email}`,
    htmlBody,
    textBody,
    replyTo: { email: user.email },
  });

  // Durable outcome record. console.warn is ephemeral (needs a live `tail`);
  // audit_log is queryable via D1, so a silent ZeptoMail failure becomes
  // visible after the fact (status + error captured in meta_json).
  await env.DB.prepare(
    "INSERT INTO audit_log (user_id, actor, action, ref, meta_json, at) VALUES (?, 'system', ?, ?, ?, ?)",
  )
    .bind(
      user.id,
      res.ok ? "signup.email.sent" : "signup.email.failed",
      user.email,
      JSON.stringify({ status: res.status, error: res.error ?? null }),
      Math.floor(Date.now() / 1000),
    )
    .run()
    .catch(() => {});

  // Release the dedup guard on failure so the next trigger retries the send.
  // A transient ZeptoMail outage must not permanently suppress this user's
  // notification.
  if (!res.ok) {
    await env.KV.delete(`signup-notified:${user.id}`).catch(() => {});
  }
}

export async function notifyNewSignup(
  env: Env,
  user: SignupUser,
  source?: SignupSource,
): Promise<void> {
  try {
    // Flag gate — off by default; flip with `wrangler kv key put` / dashboard.
    if ((await env.KV.get("flag:signup-admin-email")) !== "on") return;
    if (await env.KV.get(`signup-notified:${user.id}`)) return;

    const hasSource = !!(source && (source.page || source.trigger || source.next));

    if (!hasSource) {
      // Maybe the client already posted it (fast landings).
      const raw = await env.KV.get(`signup-src:${user.id}`).catch(() => null);
      if (raw) {
        try {
          const s = JSON.parse(raw) as SignupSource;
          source = { page: s.page, trigger: s.trigger, next: s.next };
        } catch (_) {}
      }
    }

    if (source && (source.page || source.trigger || source.next)) {
      await sendSignupEmail(env, user, source);
      return;
    }

    // No attribution yet (typical OAuth: the webhook outruns the client).
    // Park the notification; /api/me/signup-context or the /api/me fresh-user
    // fallback sends it. Write the marker FIRST, then re-check the source:
    // whichever side runs second sees the other's write, so the email cannot
    // fall through the gap between "context posted" and "pending parked".
    await env.KV.put(
      `signup-pending:${user.id}`,
      JSON.stringify({ email: user.email, provider: user.provider ?? null }),
      { expirationTtl: PENDING_TTL },
    );
    const raw2 = await env.KV.get(`signup-src:${user.id}`).catch(() => null);
    if (raw2) {
      let src2: SignupSource | undefined;
      try { src2 = JSON.parse(raw2) as SignupSource; } catch (_) {}
      await env.KV.delete(`signup-pending:${user.id}`).catch(() => {});
      await sendSignupEmail(env, user, src2);
    }
  } catch (e) {
    console.warn(`[notify.signup] failed for ${user.id}: ${(e as Error).message}`);
  }
}

// Flush a parked signup notification. Called by /api/me/signup-context the
// moment attribution arrives (source in hand — no KV read race), and by
// /api/me for freshly created users as a source-less fallback. No-ops fast
// (one KV get) when nothing is parked.
export async function flushPendingSignup(
  env: Env,
  userId: string,
  source?: SignupSource,
): Promise<void> {
  try {
    const raw = await env.KV.get(`signup-pending:${userId}`);
    if (!raw) return;
    if ((await env.KV.get("flag:signup-admin-email")) !== "on") return;
    let pending: { email?: string; provider?: string | null } = {};
    try { pending = JSON.parse(raw); } catch (_) {}
    if (!pending.email) {
      await env.KV.delete(`signup-pending:${userId}`).catch(() => {});
      return;
    }
    if (!source || (!source.page && !source.trigger && !source.next)) {
      const rawSrc = await env.KV.get(`signup-src:${userId}`).catch(() => null);
      if (rawSrc) {
        try { source = JSON.parse(rawSrc) as SignupSource; } catch (_) {}
      }
    }
    await env.KV.delete(`signup-pending:${userId}`).catch(() => {});
    await sendSignupEmail(
      env,
      { id: userId, email: pending.email, provider: pending.provider ?? undefined },
      source,
    );
  } catch (e) {
    console.warn(`[notify.flush] failed for ${userId}: ${(e as Error).message}`);
  }
}
