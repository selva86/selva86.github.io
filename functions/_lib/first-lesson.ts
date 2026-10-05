// The immediate first lesson: sent the moment a reader joins the daily series
// (peak intent), instead of waiting for the next 13:00 UTC run. Shared by the
// invitation email's one-click join (api/email/join-series) and the opt-in bar
// (api/me/optin-bar).
//
// The ledger row is written BEFORE the send so a concurrent daily run cannot
// send the same lesson twice, and is removed again if the send fails, so the
// daily run picks the reader up as usual. Every guard fails SILENT: the join
// itself has already succeeded by the time this runs.

import { userSig, unsubUrl } from "./brain";
import { getSeqPlan, seqSendable, seqUrl, renderSeqEmail, getSeqCopy, SEQ_ITEMS } from "./nurture";
import { sendMail, emailLive } from "./email";
import { SENDER, REPLY_TO } from "./email-templates";
import type { TemplateData } from "./email-templates";

const DEFAULT_ALLOWLIST = "selva@r-statistics.co,selva86@gmail.com";

export interface FirstLessonUser {
  id: string;
  email: string;
  display_name: string | null;
  level_r: string | null;
  email_status: string | null;
}

// Returns true only when a lesson email actually went out now.
// `note` is written to email_events.meta so the admin log says where it came from.
export async function sendFirstLessonNow(env: any, u: FirstLessonUser, note: string): Promise<boolean> {
  try {
    const brainEnv = env as Parameters<typeof userSig>[0];
    const uid = u.id;
    const sig = await userSig(brainEnv, uid);
    if (!sig) return false;
    const now = Math.floor(Date.now() / 1000);
    const live = await emailLive(env);
    const allow = new Set(
      (env.EMAIL_TEST_ALLOWLIST || DEFAULT_ALLOWLIST).split(",").map((s: string) => s.trim().toLowerCase()).filter(Boolean),
    );
    const suppressed = !!(u.email_status && u.email_status !== "ok");
    if (!(live || allow.has((u.email || "").toLowerCase())) || suppressed) return false;
    const sent = (await env.DB.prepare(
      "SELECT email_key FROM sent_emails WHERE user_id = ?1 AND email_key LIKE 'seq:%'",
    ).bind(uid).all()).results as Array<{ email_key: string }> ?? [];
    const have = new Set(sent.map((r) => parseInt(r.email_key.slice(4), 10)));
    const plan = await getSeqPlan(env.KV);
    let next = -1;
    for (const p of plan) {
      if (!p.enabled) continue;
      if (p.seq === 0 && (have.size > 0 || u.level_r !== "new")) continue;
      if (!have.has(p.seq)) { next = p.seq; break; }
    }
    if (next < 0 || !SEQ_ITEMS[next] || !seqSendable(next)) return false;
    const key = "seq:" + next;
    const ins = await env.DB.prepare(
      "INSERT OR IGNORE INTO sent_emails (user_id, email_key, sent_at) VALUES (?1, ?2, ?3)",
    ).bind(uid, key, now).run();
    if ((ins.meta?.changes ?? 0) === 0) return false;
    const dest = seqUrl(next, uid, sig);
    const data: TemplateData = {
      first_name: u.display_name || undefined,
      unsubscribe_url: await unsubUrl(brainEnv, uid, key),
      track: { uid, sig, key },
    } as TemplateData;
    const copy = await getSeqCopy(env.KV, next);
    const r = dest ? renderSeqEmail(next, dest, data, copy) : null;
    if (!r) {
      await env.DB.prepare("DELETE FROM sent_emails WHERE user_id = ?1 AND email_key = ?2").bind(uid, key).run();
      return false;
    }
    const res = await sendMail(env, {
      to: { email: u.email, name: u.display_name || undefined },
      subject: r.subject, htmlBody: r.html, textBody: r.text,
      from: SENDER, replyTo: REPLY_TO,
    });
    if (!res.ok) {
      await env.DB.prepare("DELETE FROM sent_emails WHERE user_id = ?1 AND email_key = ?2").bind(uid, key).run();
      return false;
    }
    await env.DB.prepare(
      "INSERT INTO email_events (user_id, email, email_key, event, at, meta) VALUES (?1, ?2, ?3, 'sent', ?4, ?5)",
    ).bind(uid, u.email, key, now, note).run();
    return true;
  } catch {
    return false;
  }
}
