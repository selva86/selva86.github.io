// POST /api/teams/:id/invites   { emails: string[] }  (or { email })
//
// Owner/admin invites members. Each email is validated, de-duplicated against
// active members + live invites, and claims a seat atomically (the seat count
// is evaluated inside the INSERT, so concurrent invites can't oversell the last
// seat). A signed single-use token is emailed to the invitee. Per-user rate
// limited. Returns a per-email result array so the UI can report each outcome.

import type { Env, RequestData } from "../../../_middleware";
import { json, jsonError, err401, err403, err404, err429 } from "../../../_lib/errors";
import { sendMail, emailShell } from "../../../_lib/email";
import {
  getOrgById, isOrgAdmin, isActiveMember, hasPendingInvite, createInviteAtomic,
  countAssignedSeats, newInviteToken, revokeInviteByEmail,
} from "../../../_lib/teams";
import { getUserByEmail } from "../../../_lib/db";

const MAX_EMAILS = 50;
const RL_LIMIT = 200;         // invites per user per window
const RL_WINDOW = 3600;       // 1 hour

function validEmail(e: string): boolean {
  return typeof e === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 254;
}

async function sendInviteEmail(
  env: Env, to: string, teamName: string, inviterName: string, acceptUrl: string,
): Promise<boolean> {
  const contentHtml = `
    <p style="margin:0 0 14px">${esc(inviterName)} invited you to join <strong>${esc(teamName)}</strong> on r-statistics.co.</p>
    <p style="margin:0 0 14px">Your seat unlocks All-Access Pro: every course, graded practice, projects, and verifiable certificates. It is free for you, your team covers it.</p>
    <p style="margin:0 0 6px">This invite expires in 14 days.</p>`;
  const html = emailShell({
    preheader: `Join ${teamName} on r-statistics.co`,
    contentHtml,
    ctaUrl: acceptUrl,
    ctaLabel: "Accept your seat",
  });
  const text = `${inviterName} invited you to join ${teamName} on r-statistics.co.\n\nAccept your seat: ${acceptUrl}\n\nThis invite expires in 14 days.`;
  const res = await sendMail(env, {
    to: { email: to },
    subject: `You are invited to ${teamName} on r-statistics.co`,
    htmlBody: html,
    textBody: text,
  });
  return res.ok;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export const onRequestPost: PagesFunction<Env, string, RequestData> = async (context) => {
  const u = context.data.user;
  if (!u) return err401();
  const orgId = context.params.id as string;
  const db = context.env.DB;
  const now = Math.floor(Date.now() / 1000);

  const org = await getOrgById(db, orgId);
  if (!org) return err404("Team not found.");
  if (org.status !== "active") return err403("This team's subscription is not active.");
  if (!(await isOrgAdmin(db, orgId, u.id))) return err403("Only a team owner or admin can invite.");

  // Rate limit (per user).
  const rlKey = `teams-invite-rl:${u.id}`;
  const used = parseInt((await context.env.KV.get(rlKey)) || "0", 10) || 0;

  let body: { emails?: unknown; email?: unknown };
  try {
    body = (await context.request.json()) as typeof body;
  } catch {
    return jsonError(400, "bad_request", "Invalid JSON body");
  }
  const raw = Array.isArray(body.emails)
    ? body.emails
    : typeof body.email === "string"
      ? [body.email]
      : [];
  // Normalize + dedupe within the request.
  const emails = Array.from(new Set(raw.filter((e): e is string => typeof e === "string").map((e) => e.trim().toLowerCase())));
  if (emails.length === 0) return jsonError(400, "bad_request", "Provide at least one email.");
  if (emails.length > MAX_EMAILS) return jsonError(400, "too_many", `Max ${MAX_EMAILS} emails per request.`);
  if (used + emails.length > RL_LIMIT) return err429("Invite limit reached; try again later.");

  const inviterName = u.display_name || u.email.split("@")[0];
  const results: Array<{ email: string; status: string; emailed?: boolean }> = [];
  let claimed = 0;

  for (const email of emails) {
    if (!validEmail(email)) { results.push({ email, status: "invalid" }); continue; }
    // Already an active member?
    const existingUser = await getUserByEmail(db, email);
    if (existingUser && (await isActiveMember(db, orgId, existingUser.id))) {
      results.push({ email, status: "already_member" });
      continue;
    }
    if (await hasPendingInvite(db, orgId, email)) {
      results.push({ email, status: "already_pending" });
      continue;
    }
    const token = newInviteToken();
    const { claimed: ok } = await createInviteAtomic(db, {
      token, orgId, email, role: "member", invitedBy: u.id, nowSec: now,
    });
    if (!ok) {
      // No seat free (or a race lost). Report seats-exhausted.
      results.push({ email, status: "no_seats" });
      continue;
    }
    claimed += 1;
    const acceptUrl = `${context.env.SITE_ORIGIN}/team-invite.html?token=${encodeURIComponent(token)}`;
    const emailed = await sendInviteEmail(context.env, email, org.name, inviterName, acceptUrl)
      .catch(() => false);
    results.push({ email, status: "invited", emailed });
  }

  if (claimed > 0) {
    await context.env.KV.put(rlKey, String(used + claimed), { expirationTtl: RL_WINDOW }).catch(() => {});
    await db
      .prepare("INSERT INTO audit_log (user_id, actor, action, ref, meta_json, at) VALUES (?, 'user', 'team.invite', ?, ?, ?)")
      .bind(u.id, orgId, JSON.stringify({ count: claimed }), now)
      .run()
      .catch(() => {});
  }

  const assigned = await countAssignedSeats(db, orgId, now);
  return json({
    results,
    seats: { total: org.seats_purchased, assigned, available: Math.max(0, org.seats_purchased - assigned) },
  });
};

// DELETE /api/teams/:id/invites  { email }  -> revoke a pending invite (frees the seat).
export const onRequestDelete: PagesFunction<Env, string, RequestData> = async (context) => {
  const u = context.data.user;
  if (!u) return err401();
  const orgId = context.params.id as string;
  const db = context.env.DB;
  const now = Math.floor(Date.now() / 1000);

  const org = await getOrgById(db, orgId);
  if (!org) return err404("Team not found.");
  if (!(await isOrgAdmin(db, orgId, u.id))) return err403("Only a team owner or admin can cancel invites.");

  let body: { email?: unknown };
  try {
    body = (await context.request.json()) as typeof body;
  } catch {
    return jsonError(400, "bad_request", "Invalid JSON body");
  }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email) return jsonError(400, "bad_request", "Provide the invite email to cancel.");

  const ok = await revokeInviteByEmail(db, orgId, email, now);
  const assigned = await countAssignedSeats(db, orgId, now);
  return json({
    ok,
    seats: { total: org.seats_purchased, assigned, available: Math.max(0, org.seats_purchased - assigned) },
  });
};
