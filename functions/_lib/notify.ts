// Admin notifications. Currently: email selva86@gmail.com on each CONFIRMED
// new signup. Best-effort — never blocks/breaks the signup flow.
//
// Exactly-once across all trigger paths (webhook confirm-INSERT, webhook
// confirm-UPDATE, /api/me lazy-create) via a permanent KV marker
// `signup-notified:<user_id>`. Gated by KV flag `flag:signup-admin-email`.

import type { Env } from "../_middleware";
import { sendMail, emailShell } from "./email";

const ADMIN_EMAIL = "selva86@gmail.com";

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

export async function notifyNewSignup(
  env: Env,
  user: { id: string; email: string; provider?: string },
): Promise<void> {
  try {
    // Flag gate — off by default; flip with `wrangler kv key put` / dashboard.
    if ((await env.KV.get("flag:signup-admin-email")) !== "on") return;

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
        ${total !== null ? `<tr><td style="padding:2px 12px 2px 0;color:#6b7280">Total users</td><td><strong>${total}</strong></td></tr>` : ""}
      </table>
      <p style="color:#6b7280;font-size:13px">Reply to this email to reach them directly.</p>`;

    const textBody =
      `New signup: ${user.email}\n` +
      `Method: ${provider}\n` +
      `When: ${when}\n` +
      (total !== null ? `Total users: ${total}\n` : "") +
      `\n-- r-statistics.co`;

    const htmlBody = emailShell({
      preheader: `New signup: ${user.email}`,
      contentHtml,
    });

    await sendMail(env, {
      to: { email: ADMIN_EMAIL, name: "Selva" },
      subject: `New r-statistics.co signup: ${user.email}`,
      htmlBody,
      textBody,
      replyTo: { email: user.email },
    });
  } catch (e) {
    console.warn(`[notify.signup] failed for ${user.id}: ${(e as Error).message}`);
  }
}
