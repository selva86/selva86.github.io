// GET /api/email/join-series?u=<user-id>&t=<sig> - the invitation email's
// one-click opt-in. Signed with EMAIL_UNSUB_SECRET (same scheme as the
// unsubscribe and tracking links), so it works signed-out. Sets
// email_nurture = 1 with a provable audit row, then sends the user's FIRST
// sequence lesson immediately - the moment of peak intent - writing the
// ledger row so the next daily run advances to the following lesson instead
// of repeating. In dev mode (flag:email-live off) a non-allowlist user still
// joins; their first lesson arrives with the first daily run after go-live.

import type { Env, RequestData } from "../../_middleware";
import { userSig, unsubUrl } from "../../_lib/brain";
import { getSeqPlan, seqSendable, seqUrl, renderSeqEmail, getSeqCopy, SEQ_ITEMS } from "../../_lib/nurture";
import { sendMail } from "../../_lib/email";
import { SENDER, REPLY_TO } from "../../_lib/email-templates";
import type { TemplateData } from "../../_lib/email-templates";

type JoinEnv = Env & { EMAIL_UNSUB_SECRET?: string; EMAIL_TEST_ALLOWLIST?: string };
const DEFAULT_ALLOWLIST = "selva@r-statistics.co,selva86@gmail.com";

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

  // Immediate first lesson. Every guard here fails SILENT on purpose: the
  // join above already succeeded, and the daily run picks the user up.
  let sentNow = false;
  try {
    const live = (await env.KV.get("flag:email-live")) === "on";
    const allow = new Set(
      (env.EMAIL_TEST_ALLOWLIST || DEFAULT_ALLOWLIST).split(",").map((s) => s.trim().toLowerCase()).filter(Boolean),
    );
    const suppressed = !!(u.email_status && u.email_status !== "ok");
    if ((live || allow.has((u.email || "").toLowerCase())) && !suppressed) {
      const sent = (await env.DB.prepare(
        "SELECT email_key FROM sent_emails WHERE user_id = ?1 AND email_key LIKE 'seq:%'",
      ).bind(uid).all<{ email_key: string }>()).results ?? [];
      const have = new Set(sent.map((r) => parseInt(r.email_key.slice(4), 10)));
      const plan = await getSeqPlan(env.KV);
      let next = -1;
      for (const p of plan) {
        if (!p.enabled) continue;
        if (p.seq === 0 && (have.size > 0 || u.level_r !== "new")) continue;
        if (!have.has(p.seq)) { next = p.seq; break; }
      }
      if (next >= 0 && SEQ_ITEMS[next] && seqSendable(next)) {
        const key = "seq:" + next;
        const ins = await env.DB.prepare(
          "INSERT OR IGNORE INTO sent_emails (user_id, email_key, sent_at) VALUES (?1, ?2, ?3)",
        ).bind(uid, key, now).run();
        if ((ins.meta?.changes ?? 0) > 0) {
          const dest = seqUrl(next, uid, sig);
          const data: TemplateData = {
            first_name: u.display_name || undefined,
            unsubscribe_url: await unsubUrl(brainEnv, uid, key),
            track: { uid, sig, key },
          } as TemplateData;
          const copy = await getSeqCopy(env.KV, next);
          const r = dest ? renderSeqEmail(next, dest, data, copy) : null;
          if (r) {
            const res = await sendMail(env as unknown as Parameters<typeof sendMail>[0], {
              to: { email: u.email, name: u.display_name || undefined },
              subject: r.subject, htmlBody: r.html, textBody: r.text,
              from: SENDER, replyTo: REPLY_TO,
            });
            if (res.ok) {
              sentNow = true;
              await env.DB.prepare(
                "INSERT INTO email_events (user_id, email, email_key, event, at, meta) VALUES (?1, ?2, ?3, 'sent', ?4, 'joined via invitation; first lesson sent on click')",
              ).bind(uid, u.email, key, now).run();
            } else {
              await env.DB.prepare("DELETE FROM sent_emails WHERE user_id = ?1 AND email_key = ?2").bind(uid, key).run();
            }
          } else {
            await env.DB.prepare("DELETE FROM sent_emails WHERE user_id = ?1 AND email_key = ?2").bind(uid, key).run();
          }
        }
      }
    }
  } catch { /* the join itself already succeeded */ }

  if (already) {
    return page("You are already in",
      "<p>You joined the daily series earlier, and it keeps arriving as usual. Nothing more to do.</p>");
  }
  return page("You are in", sentNow
    ? "<p>Your first lesson is in your inbox right now, and the next one arrives tomorrow. Six days a week, each lesson open for three days.</p>"
    : "<p>Your first lesson arrives with the next daily send. Six days a week, each lesson open for three days.</p>");
};
