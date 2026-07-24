// Weekly recap email (profile v3 pass 2). Flag-gated (flag:recap-email),
// traffic-piggybacked: /api/me occasionally calls sweepRecapEmails via
// waitUntil; one KV week-marker makes the sweep run at most once per ISO
// week, and a per-(user, week) marker dedupes sends. Cohort at launch:
// newsletter opt-ins active in the last 14 days who have not opted out of
// recaps. Unsubscribe needs no auth: a random token minted per send maps
// back to the user in KV (90-day TTL).

import type { Env } from "../_middleware";
import { sendMail, emailShell } from "./email";

const COHORT_CAP = 200;      // per sweep; a bigger base gets a real scheduler
const WEEK_TTL = 60 * 86400;

function isoWeek(d = new Date()): string {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y = t.getUTCFullYear();
  const week = Math.ceil((((t.getTime() - Date.UTC(y, 0, 1)) / 86400000) + 1) / 7);
  return `${y}-W${String(week).padStart(2, "0")}`;
}

function randToken(): string {
  const buf = new Uint8Array(18);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}

function nearestBadgeLine(solved: number, streak: number): string | null {
  const nextOf = (v: number, marks: number[]) => marks.find((m) => m > v) ?? null;
  const ns = nextOf(solved, [100, 200, 300]);
  if (ns) return `${ns - solved} solve${ns - solved === 1 ? "" : "s"} from the ${ns}-solves badge`;
  const nk = nextOf(streak, [7, 30, 100]);
  if (nk) return `${nk - streak} day${nk - streak === 1 ? "" : "s"} from the ${nk}-day streak badge`;
  return null;
}

export async function sweepRecapEmails(env: Env): Promise<void> {
  try {
    if ((await env.KV.get("flag:recap-email")) !== "on") return;
    const week = isoWeek();
    const sweepKey = `recap:sweep:${week}`;
    if (await env.KV.get(sweepKey)) return;
    await env.KV.put(sweepKey, "1", { expirationTtl: WEEK_TTL });

    const now = Math.floor(Date.now() / 1000);
    const cohort = await env.DB.prepare(
      "SELECT u.id, u.email, u.display_name, u.handle, u.total_xp, u.current_streak_days " +
      "FROM users u WHERE u.newsletter_opt_in = 1 AND COALESCE(u.recap_opt_out, 0) = 0 " +
      "AND u.deleted_at IS NULL AND u.id IN " +
      "(SELECT DISTINCT user_id FROM xp_ledger WHERE at >= ?1) LIMIT ?2"
    ).bind(now - 14 * 86400, COHORT_CAP)
      .all<{ id: string; email: string; display_name: string | null; handle: string | null; total_xp: number; current_streak_days: number }>();

    for (const user of cohort.results ?? []) {
      try {
        const sentKey = `recap:sent:${user.id}:${week}`;
        if (await env.KV.get(sentKey)) continue;

        const weekStart = now - 7 * 86400;
        const [xpRow, solveRow] = await Promise.all([
          env.DB.prepare(
            "SELECT COALESCE(SUM(xp), 0) AS n FROM xp_ledger WHERE user_id = ?1 AND at >= ?2"
          ).bind(user.id, weekStart).first<{ n: number }>(),
          env.DB.prepare(
            "SELECT COUNT(DISTINCT hub_slug || '|' || exercise_id) AS n FROM exercise_attempts " +
            "WHERE user_id = ?1 AND passed = 1 AND submitted_at >= ?2"
          ).bind(user.id, weekStart).first<{ n: number }>(),
        ]);
        const weekXp = Number(xpRow?.n ?? 0);
        const weekSolves = Number(solveRow?.n ?? 0);
        if (weekXp === 0 && weekSolves === 0) continue;   // nothing to say

        const totalSolved = await env.DB.prepare(
          "SELECT COUNT(DISTINCT hub_slug || '|' || exercise_id) AS n FROM exercise_attempts " +
          "WHERE user_id = ?1 AND passed = 1"
        ).bind(user.id).first<{ n: number }>();
        const badgeLine = nearestBadgeLine(Number(totalSolved?.n ?? 0), user.current_streak_days || 0);

        const token = randToken();
        await env.KV.put(`recap-unsub:${token}`, user.id, { expirationTtl: 90 * 86400 });
        const unsubUrl = `https://r-statistics.co/api/recap/unsub?t=${token}`;
        const profileUrl = user.handle ? `https://r-statistics.co/u/${user.handle}` : "https://r-statistics.co/dashboard.html";
        const name = (user.display_name || "").split(/\s+/)[0] || "there";

        const contentHtml = `
          <p style="font-size:17px;font-weight:600;color:#0a0d14;margin:0 0 12px">Your week in R</p>
          <p>Hi ${name}, here is what you put on the board this week:</p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="font-size:14px;margin:10px 0">
            <tr><td style="padding:2px 12px 2px 0;color:#6b7280">XP earned</td><td><strong>${weekXp.toLocaleString()}</strong></td></tr>
            <tr><td style="padding:2px 12px 2px 0;color:#6b7280">Exercises solved</td><td><strong>${weekSolves}</strong></td></tr>
            <tr><td style="padding:2px 12px 2px 0;color:#6b7280">Current streak</td><td><strong>${user.current_streak_days || 0} day${(user.current_streak_days || 0) === 1 ? "" : "s"}</strong></td></tr>
          </table>
          ${badgeLine ? `<p>You are <strong>${badgeLine}</strong>.</p>` : ""}
          <p style="margin:18px 0"><a href="${profileUrl}" style="display:inline-block;background:#2056d2;color:#fff;text-decoration:none;font-weight:600;padding:10px 20px;border-radius:8px">See your profile</a></p>
          <p style="color:#6b7280;font-size:12px">You get this weekly recap because you opted into updates.
          <a href="${unsubUrl}" style="color:#6b7280">Stop the weekly recap</a>.</p>`;
        const textBody =
          `Your week in R\n\nXP earned: ${weekXp}\nExercises solved: ${weekSolves}\n` +
          `Current streak: ${user.current_streak_days || 0} days\n` +
          (badgeLine ? `You are ${badgeLine}.\n` : "") +
          `\nYour profile: ${profileUrl}\nStop the weekly recap: ${unsubUrl}\n`;

        const res = await sendMail(env, {
          to: { email: user.email, name: user.display_name || undefined },
          subject: `Your week in R: ${weekXp.toLocaleString()} XP, ${weekSolves} solved`,
          htmlBody: emailShell({ preheader: `${weekXp} XP and ${weekSolves} solves this week`, contentHtml }),
          textBody,
        });
        if (res.ok) await env.KV.put(sentKey, "1", { expirationTtl: WEEK_TTL });
      } catch { /* one user failing never stops the sweep */ }
    }
  } catch (e) {
    console.warn(`[recap] sweep failed: ${(e as Error).message}`);
  }
}
