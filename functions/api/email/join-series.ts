// GET /api/email/join-series?u=<user-id>&t=<sig> - the invitation email's
// one-click opt-in. Signed with EMAIL_UNSUB_SECRET (same scheme as the
// unsubscribe and tracking links), so it works signed-out. Sets
// email_nurture = 1 with a provable audit row, then sends the user's FIRST
// sequence lesson immediately - the moment of peak intent - writing the
// ledger row so the next daily run advances to the following lesson instead
// of repeating. In dev mode (flag:email-live off) a non-allowlist user still
// joins; their first lesson arrives with the first daily run after go-live.

import type { Env, RequestData } from "../../_middleware";
import { userSig } from "../../_lib/brain";
import { sendFirstLessonNow } from "../../_lib/first-lesson";

type JoinEnv = Env & { EMAIL_UNSUB_SECRET?: string; EMAIL_TEST_ALLOWLIST?: string };

function page(title: string, body: string): Response {
  return new Response(
    '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<meta name="robots" content="noindex"><title>' + title + '</title>' +
    "<style>body{margin:0;background:#f6f7f9;font:16px/1.6 'IBM Plex Sans','Segoe UI',Roboto,Arial,sans-serif;color:#0a0d14}" +
    "main{max-width:520px;margin:80px auto;background:#fff;border:1px solid #e4e7ee;padding:34px 36px;border-radius:12px}" +
    "h1{font-size:22px;margin:0 0 12px}p{margin:10px 0 0;color:#434b59}a{color:#2056d2}</style></head>" +
    '<body><main><h1>' + title + '</h1>' + body + '</main></body></html>',
    { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-store" } },
  );
}

export const onRequestGet: PagesFunction<JoinEnv, string, RequestData> = async (context) => {
  const env = context.env;
  const brainEnv = env as unknown as Parameters<typeof userSig>[0];
  const url = new URL(context.request.url);
  const uid = url.searchParams.get("u") || "";
  const t = url.searchParams.get("t") || "";
  const sig = uid ? await userSig(brainEnv, uid) : undefined;
  if (!uid || !t || !sig || sig !== t) {
    return page("This link did not work",
      "<p>The link looks incomplete. Open the invitation email again and click the join link once more, or just reply to it and we will sort you out.</p>");
  }

  const u = await env.DB.prepare(
    "SELECT id, email, display_name, level_r, email_nurture, email_optin_decided_at, email_status FROM users WHERE id = ?1 AND deleted_at IS NULL",
  ).bind(uid).first<{ id: string; email: string; display_name: string | null; level_r: string | null; email_nurture: number; email_optin_decided_at: number | null; email_status: string | null }>();
  if (!u) {
    return page("This link did not work",
      "<p>We could not find the account this invitation was sent to. Reply to the email and we will sort it out.</p>");
  }

  const now = Math.floor(Date.now() / 1000);
  const already = !!u.email_nurture;
  if (!already) {
    await env.DB.batch([
      env.DB.prepare(
        "UPDATE users SET email_nurture = 1, email_optin_decided_at = COALESCE(email_optin_decided_at, ?1) WHERE id = ?2",
      ).bind(now, uid),
      env.DB.prepare(
        "INSERT INTO audit_log (user_id, actor, action, ref, meta_json, at) VALUES (?1, 'user', 'email_optin', 'invite-email', ?2, ?3)",
      ).bind(uid, JSON.stringify({ optin: true, via: "one-click", scope: "nurture" }), now),
    ]);
  }

  // Immediate first lesson (shared with the opt-in bar). Fails silent: the
  // join above already succeeded, and the daily run picks the user up.
  const sentNow = await sendFirstLessonNow(env, u, "joined via invitation; first lesson sent on click");

  if (already) {
    return page("You are already in",
      "<p>You joined the daily series earlier, and it keeps arriving as usual. Nothing more to do.</p>");
  }
  return page("You are in", sentNow
    ? "<p>Your first lesson is in your inbox right now, and the next one arrives tomorrow. Six days a week, each lesson open for three days.</p>"
    : "<p>Your first lesson arrives with the next daily send. Six days a week, each lesson open for three days.</p>");
};
