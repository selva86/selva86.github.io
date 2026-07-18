// Team / seat-management D1 helpers. Raw SQL lives here (never in handlers).
//
// Model: an `org` is a bulk "All-Access for Teams" purchase. seats_purchased
// mirrors the Paddle subscription quantity (billed seats = source of truth). The
// app enforces assigned <= seats_purchased, where
//   assigned = active org_members + pending (non-expired) org_invites.
// A member holds Pro entitlement only while their org is active AND not past its
// current_period_end (see _lib/entitlement.ts, which is the single Pro resolver).

export interface Org {
  id: string;
  name: string;
  owner_user_id: string;
  seats_purchased: number;
  paddle_subscription_id: string | null;
  paddle_customer_id: string | null;
  plan: string | null;
  status: string;                 // 'active' | 'past_due' | 'canceled'
  current_period_end: number | null;
  created_at: number;
  updated_at: number | null;
}

export interface OrgMember {
  org_id: string;
  user_id: string;
  role: string;                   // 'owner' | 'admin' | 'member'
  status: string;                 // 'active' | 'removed'
  email: string | null;
  invited_by: string | null;
  joined_at: number;
  removed_at: number | null;
}

export interface OrgInvite {
  token: string;
  org_id: string;
  email: string;
  role: string;
  invited_by: string | null;
  created_at: number;
  expires_at: number;
  accepted_at: number | null;
  revoked_at: number | null;
}

export const INVITE_TTL_SEC = 14 * 24 * 60 * 60; // invites expire after 14 days
export const MIN_TEAM_SEATS = 5;

// ---------- reads ----------

export async function getOrgById(db: D1Database, id: string): Promise<Org | null> {
  return await db.prepare("SELECT * FROM orgs WHERE id = ?").bind(id).first<Org>();
}

export async function getOrgBySubscription(db: D1Database, subId: string): Promise<Org | null> {
  return await db
    .prepare("SELECT * FROM orgs WHERE paddle_subscription_id = ?")
    .bind(subId)
    .first<Org>();
}

// Orgs where the user is the billing owner (owner_user_id). Usually 0 or 1.
export async function listOrgsOwnedBy(db: D1Database, userId: string): Promise<Org[]> {
  const r = await db
    .prepare("SELECT * FROM orgs WHERE owner_user_id = ? ORDER BY created_at DESC")
    .bind(userId)
    .all<Org>();
  return r.results || [];
}

// The orgs where the user is an ACTIVE member (owner rows are also members).
export async function listActiveMemberships(
  db: D1Database,
  userId: string,
): Promise<Array<{ org: Org; role: string }>> {
  const r = await db
    .prepare(
      `SELECT o.*, m.role AS member_role
         FROM org_members m JOIN orgs o ON o.id = m.org_id
        WHERE m.user_id = ? AND m.status = 'active'
        ORDER BY o.created_at DESC`,
    )
    .bind(userId)
    .all<Org & { member_role: string }>();
  return (r.results || []).map((row) => {
    const { member_role, ...org } = row;
    return { org: org as Org, role: member_role };
  });
}

// Entitlement primitive: does the user hold a seat that currently grants Pro?
// True iff they are an active member of an active org whose paid period has not
// lapsed. This is the ONLY seat check that grants Pro (see entitlement.ts).
export async function hasActiveSeat(
  db: D1Database,
  userId: string,
  nowSec = Math.floor(Date.now() / 1000),
): Promise<boolean> {
  const row = await db
    .prepare(
      `SELECT 1 AS ok
         FROM org_members m JOIN orgs o ON o.id = m.org_id
        WHERE m.user_id = ?
          AND m.status = 'active'
          AND o.status = 'active'
          AND (o.current_period_end IS NULL OR o.current_period_end > ?)
        LIMIT 1`,
    )
    .bind(userId, nowSec)
    .first<{ ok: number }>();
  return !!row;
}

// The org (with the user's seat details) that currently entitles them, if any.
export async function getEntitlingOrg(
  db: D1Database,
  userId: string,
  nowSec = Math.floor(Date.now() / 1000),
): Promise<{ org: Org; role: string } | null> {
  const row = await db
    .prepare(
      `SELECT o.*, m.role AS member_role
         FROM org_members m JOIN orgs o ON o.id = m.org_id
        WHERE m.user_id = ?
          AND m.status = 'active'
          AND o.status = 'active'
          AND (o.current_period_end IS NULL OR o.current_period_end > ?)
        ORDER BY o.current_period_end DESC
        LIMIT 1`,
    )
    .bind(userId, nowSec)
    .first<Org & { member_role: string }>();
  if (!row) return null;
  const { member_role, ...org } = row;
  return { org: org as Org, role: member_role };
}

export async function getMemberRole(
  db: D1Database, orgId: string, userId: string,
): Promise<string | null> {
  const row = await db
    .prepare("SELECT role FROM org_members WHERE org_id = ? AND user_id = ? AND status = 'active'")
    .bind(orgId, userId)
    .first<{ role: string }>();
  return row?.role ?? null;
}

export async function isOrgAdmin(db: D1Database, orgId: string, userId: string): Promise<boolean> {
  const role = await getMemberRole(db, orgId, userId);
  return role === "owner" || role === "admin";
}

export async function listActiveMembers(db: D1Database, orgId: string): Promise<OrgMember[]> {
  const r = await db
    .prepare(
      "SELECT * FROM org_members WHERE org_id = ? AND status = 'active' ORDER BY joined_at ASC",
    )
    .bind(orgId)
    .all<OrgMember>();
  return r.results || [];
}

export async function listPendingInvites(
  db: D1Database, orgId: string, nowSec = Math.floor(Date.now() / 1000),
): Promise<OrgInvite[]> {
  const r = await db
    .prepare(
      `SELECT * FROM org_invites
        WHERE org_id = ? AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at > ?
        ORDER BY created_at DESC`,
    )
    .bind(orgId, nowSec)
    .all<OrgInvite>();
  return r.results || [];
}

// Assigned seats = active members + live pending invites. This is what the app
// enforces against seats_purchased.
export async function countAssignedSeats(
  db: D1Database, orgId: string, nowSec = Math.floor(Date.now() / 1000),
): Promise<number> {
  const row = await db
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM org_members WHERE org_id = ?1 AND status = 'active')
       + (SELECT COUNT(*) FROM org_invites WHERE org_id = ?1 AND accepted_at IS NULL
            AND revoked_at IS NULL AND expires_at > ?2) AS n`,
    )
    .bind(orgId, nowSec)
    .first<{ n: number }>();
  return row?.n ?? 0;
}

export async function getInviteByToken(db: D1Database, token: string): Promise<OrgInvite | null> {
  return await db.prepare("SELECT * FROM org_invites WHERE token = ?").bind(token).first<OrgInvite>();
}

export async function isActiveMember(db: D1Database, orgId: string, userId: string): Promise<boolean> {
  const row = await db
    .prepare("SELECT 1 AS ok FROM org_members WHERE org_id = ? AND user_id = ? AND status = 'active'")
    .bind(orgId, userId)
    .first<{ ok: number }>();
  return !!row;
}

export async function hasPendingInvite(db: D1Database, orgId: string, email: string): Promise<boolean> {
  const row = await db
    .prepare(
      `SELECT 1 AS ok FROM org_invites
        WHERE org_id = ? AND email = ? AND accepted_at IS NULL AND revoked_at IS NULL`,
    )
    .bind(orgId, email.toLowerCase())
    .first<{ ok: number }>();
  return !!row;
}

// ---------- writes ----------

// Atomic seat-claiming invite creation. The INSERT ... SELECT ... WHERE evaluates
// the current assigned-seat count inside the single write statement; because D1
// (SQLite) serializes writers, two concurrent invites can never both claim the
// last seat. Returns changes===1 on success; 0 means no seat free OR a duplicate
// live invite (the partial UNIQUE index blocks the dup). Callers pre-check the
// duplicate case for a friendly message.
export async function createInviteAtomic(
  db: D1Database,
  args: {
    token: string; orgId: string; email: string; role: string;
    invitedBy: string | null; nowSec: number; ttlSec?: number;
  },
): Promise<{ claimed: boolean }> {
  const now = args.nowSec;
  const expires = now + (args.ttlSec ?? INVITE_TTL_SEC);
  const email = args.email.toLowerCase();
  const res = await db
    .prepare(
      `INSERT OR IGNORE INTO org_invites
         (token, org_id, email, role, invited_by, created_at, expires_at)
       SELECT ?1, ?2, ?3, ?4, ?5, ?6, ?7
       WHERE (
           (SELECT COUNT(*) FROM org_members WHERE org_id = ?2 AND status = 'active')
         + (SELECT COUNT(*) FROM org_invites WHERE org_id = ?2 AND accepted_at IS NULL
              AND revoked_at IS NULL AND expires_at > ?6)
       ) < (SELECT seats_purchased FROM orgs WHERE id = ?2 AND status = 'active')`,
    )
    .bind(args.token, args.orgId, email, args.role, args.invitedBy, now, expires)
    .run();
  return { claimed: (res.meta?.changes ?? 0) === 1 };
}

export async function revokeInvite(
  db: D1Database, orgId: string, token: string, nowSec: number,
): Promise<boolean> {
  const res = await db
    .prepare(
      `UPDATE org_invites SET revoked_at = ?
        WHERE token = ? AND org_id = ? AND accepted_at IS NULL AND revoked_at IS NULL`,
    )
    .bind(nowSec, token, orgId)
    .run();
  return (res.meta?.changes ?? 0) > 0;
}

// Revoke a pending invite by email (admin roster action). Tokens are never
// exposed through read APIs, so the admin UI cancels by address. At most one
// live invite exists per (org, email) thanks to the partial UNIQUE index.
export async function revokeInviteByEmail(
  db: D1Database, orgId: string, email: string, nowSec: number,
): Promise<boolean> {
  const res = await db
    .prepare(
      `UPDATE org_invites SET revoked_at = ?
        WHERE org_id = ? AND email = ? AND accepted_at IS NULL AND revoked_at IS NULL`,
    )
    .bind(nowSec, orgId, email.toLowerCase())
    .run();
  return (res.meta?.changes ?? 0) > 0;
}

// Accept an invite. Single-use via the atomic UPDATE claim (only one caller can
// flip accepted_at from NULL). Email must match the invited address (leaked-link
// protection). On success, upserts the member row active. Returns a reason on
// failure so the endpoint can message precisely.
export async function acceptInvite(
  db: D1Database,
  args: { token: string; userId: string; userEmail: string; nowSec: number },
): Promise<{ ok: true; orgId: string } | { ok: false; reason: string }> {
  const invite = await getInviteByToken(db, args.token);
  if (!invite) return { ok: false, reason: "not_found" };
  if (invite.accepted_at) return { ok: false, reason: "already_used" };
  if (invite.revoked_at) return { ok: false, reason: "revoked" };
  if (invite.expires_at <= args.nowSec) return { ok: false, reason: "expired" };
  if (invite.email.toLowerCase() !== args.userEmail.toLowerCase()) {
    return { ok: false, reason: "email_mismatch" };
  }
  const org = await getOrgById(db, invite.org_id);
  if (!org || org.status !== "active") return { ok: false, reason: "org_inactive" };

  // Atomic single-use claim of the invite.
  const claim = await db
    .prepare(
      `UPDATE org_invites SET accepted_at = ?
        WHERE token = ? AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at > ?`,
    )
    .bind(args.nowSec, args.token, args.nowSec)
    .run();
  if ((claim.meta?.changes ?? 0) !== 1) return { ok: false, reason: "already_used" };

  // Convert the reserved seat into an active membership (idempotent on re-accept).
  await db
    .prepare(
      `INSERT INTO org_members (org_id, user_id, role, status, email, invited_by, joined_at)
       VALUES (?, ?, ?, 'active', ?, ?, ?)
       ON CONFLICT(org_id, user_id) DO UPDATE SET
         status     = 'active',
         role       = excluded.role,
         email      = excluded.email,
         removed_at = NULL`,
    )
    .bind(invite.org_id, args.userId, invite.role, args.userEmail.toLowerCase(), invite.invited_by, args.nowSec)
    .run();
  return { ok: true, orgId: invite.org_id };
}

// Remove (soft) a member, freeing their seat for reassignment. Never removes the
// owner. Returns false if the target is not an active non-owner member.
export async function removeMember(
  db: D1Database, orgId: string, userId: string, nowSec: number,
): Promise<boolean> {
  const res = await db
    .prepare(
      `UPDATE org_members SET status = 'removed', removed_at = ?
        WHERE org_id = ? AND user_id = ? AND status = 'active' AND role != 'owner'`,
    )
    .bind(nowSec, orgId, userId)
    .run();
  return (res.meta?.changes ?? 0) > 0;
}

// Webhook upsert: create or update the org from a Paddle subscription event, and
// ensure the owner has an active owner membership. Idempotent via the UNIQUE
// index on paddle_subscription_id. ownerUserId may be '' if the buyer could not
// be resolved yet; the owner membership is only written when a real user id is
// known (a later claim path can attach it).
export async function upsertOrgFromSubscription(
  db: D1Database,
  args: {
    subscriptionId: string;
    customerId: string | null;
    ownerUserId: string;        // '' if unknown
    ownerEmail: string | null;
    seats: number;
    status: string;             // mapped org status
    currentPeriodEnd: number | null;
    name: string;
    nowSec: number;
  },
): Promise<Org> {
  const existing = await getOrgBySubscription(db, args.subscriptionId);
  const orgId = existing?.id ?? cryptoRandomId("org");
  await db
    .prepare(
      `INSERT INTO orgs
         (id, name, owner_user_id, seats_purchased, paddle_subscription_id,
          paddle_customer_id, plan, status, current_period_end, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'teams', ?, ?, ?, ?)
       ON CONFLICT(paddle_subscription_id) DO UPDATE SET
         seats_purchased    = excluded.seats_purchased,
         status             = excluded.status,
         current_period_end = excluded.current_period_end,
         paddle_customer_id = COALESCE(excluded.paddle_customer_id, orgs.paddle_customer_id),
         owner_user_id      = CASE WHEN orgs.owner_user_id = '' THEN excluded.owner_user_id ELSE orgs.owner_user_id END,
         updated_at         = excluded.updated_at`,
    )
    .bind(
      orgId, args.name, args.ownerUserId, args.seats, args.subscriptionId,
      args.customerId, args.status, args.currentPeriodEnd, args.nowSec, args.nowSec,
    )
    .run();

  const org = (await getOrgBySubscription(db, args.subscriptionId))!;

  // Ensure owner membership when we know who the owner is.
  if (args.ownerUserId) {
    await db
      .prepare(
        `INSERT INTO org_members (org_id, user_id, role, status, email, joined_at)
         VALUES (?, ?, 'owner', 'active', ?, ?)
         ON CONFLICT(org_id, user_id) DO UPDATE SET status = 'active', role = 'owner', removed_at = NULL`,
      )
      .bind(org.id, args.ownerUserId, args.ownerEmail, args.nowSec)
      .run();
  }
  return org;
}

// Update only the mutable billing/lifecycle fields (status, period end, seats)
// for an existing subscription. Used by subscription.updated / canceled / past_due.
export async function updateOrgLifecycle(
  db: D1Database,
  args: { subscriptionId: string; status: string; currentPeriodEnd: number | null; seats?: number; nowSec: number },
): Promise<boolean> {
  const setSeats = typeof args.seats === "number" ? ", seats_purchased = ?" : "";
  const binds: unknown[] = [args.status, args.currentPeriodEnd];
  if (typeof args.seats === "number") binds.push(args.seats);
  binds.push(args.nowSec, args.subscriptionId);
  const res = await db
    .prepare(
      `UPDATE orgs SET status = ?, current_period_end = ?${setSeats}, updated_at = ?
        WHERE paddle_subscription_id = ?`,
    )
    .bind(...binds)
    .run();
  return (res.meta?.changes ?? 0) > 0;
}

// 22-char url-safe random id with a readable prefix (e.g. "org_a1B2...").
export function cryptoRandomId(prefix: string): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let s = "";
  for (const b of bytes) s += (b & 0x3f).toString(36);
  return `${prefix}_${s.slice(0, 22)}`;
}

// High-entropy single-use invite token (base64url, 32 bytes).
export function newInviteToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
