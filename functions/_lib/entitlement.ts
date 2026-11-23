// Single source of truth for "is this user Pro, and why".
//
// Pro can come from more than one source, and this resolver composes them so new
// sources (team seats now; comps / SSO later) slot in without touching every
// call site. isProActive(user) stays the synchronous individual-scalar check
// (users.pro_until); this async resolver adds the relational team-seat source
// WITHOUT clobbering pro_until, so a user's individual entitlement and their
// team seat never overwrite each other.
//
// Every server-side Pro decision should route through resolvePro (or at least
// treat a team-seat holder as Pro). /api/me and cert minting use it.

import { isProActive, type User } from "./db";
import { getEntitlingOrg, type Org } from "./teams";
import { resolvePass, PASS_TRACK } from "./pass";

export type ProSource = "individual" | "lifetime" | "team" | null;

export interface Entitlement {
  pro: boolean;
  pro_until: number | null;     // when the current entitlement lapses (-1 = lifetime, null = n/a)
  source: ProSource;
  team: {
    org_id: string;
    role: string;               // 'owner' | 'admin' | 'member'
    current_period_end: number | null;
  } | null;
}

export async function resolvePro(
  db: D1Database,
  user: User | null,
  nowSec = Math.floor(Date.now() / 1000),
): Promise<Entitlement> {
  if (!user) return { pro: false, pro_until: null, source: null, team: null };

  // 1. Individual entitlement first (scalar; cheapest, and a paid individual
  //    plan takes precedence as the "source" even if they also hold a seat).
  if (isProActive(user, nowSec)) {
    const source: ProSource = user.pro_until === -1 ? "lifetime" : "individual";
    // Still surface team membership if present (for the dashboard), but Pro is
    // already granted individually.
    const seat = await getEntitlingOrg(db, user.id, nowSec).catch(() => null);
    return {
      pro: true,
      pro_until: user.pro_until,
      source,
      team: seat ? teamBlock(seat.org, seat.role) : null,
    };
  }

  // 2. Team-seat entitlement.
  const seat = await getEntitlingOrg(db, user.id, nowSec).catch(() => null);
  if (seat) {
    return {
      pro: true,
      pro_until: seat.org.current_period_end,
      source: "team",
      team: teamBlock(seat.org, seat.role),
    };
  }

  return { pro: false, pro_until: null, source: null, team: null };
}

function teamBlock(org: Org, role: string): Entitlement["team"] {
  return { org_id: org.id, role, current_period_end: org.current_period_end };
}

// Content scope for Pro gating: "0" (no Pro), "all" (All-Access / Lifetime /
// Teams), or a roadmap track key for a Single Track plan. The Paddle webhook
// maintains KV `tracks:<uid>` for single-plan buyers and clears it for
// all-catalog plans; absence of the key means unscoped Pro.
export async function resolveScope(
  env: { DB: D1Database; KV: KVNamespace },
  user: User | null,
): Promise<string> {
  const ent = await resolvePro(env.DB, user);
  if (!ent.pro || !user) {
    // Not Pro, but an active Data Analyst pass still covers the DA track:
    // the lesson middleware serves full DA pages and DA quizzes grade,
    // while every other track stays gated (plan s5). Fail-closed.
    if (user) {
      const pass = await resolvePass(env, user).catch(() => null);
      if (pass?.active) return PASS_TRACK;
    }
    return "0";
  }
  if (ent.source === "team") return "all";
  // Lifetime is the whole catalog by definition; no track key can narrow it.
  if (ent.source === "lifetime") return "all";
  /* A scope key narrows Pro to ONE track, so it may only be honoured when a
     Single Track plan is the broadest thing the user pays for. The key is keyed
     on the USER, not on the subscription that scoped them, so a Single purchase
     by somebody who already holds All-Access would otherwise overwrite the
     wider entitlement and lock them out of the catalog they had already bought.
     Found in production 2026-11-23: a customer sat scoped to "ds" for 38 days
     with an active allaccess_month beside it, and paid a third time to escape
     it. Buying a narrower plan alongside a wider one is allowed; reducing what
     somebody already paid for is not. */
  if (await hasBroaderActiveSub(env.DB, user.id)) return "all";
  const t = await env.KV.get(`tracks:${user.id}`).catch(() => null);
  return t || "all";
}

/* True when an active individual subscription pays for more than one track.
   Deliberately NOT activeIndividualSub() from plan.ts: that returns the most
   recently updated row, which for a user holding both plans answers "single",
   and that is precisely how a scope key came to narrow an All-Access customer.
   This asks a different question (is ANY active row broader?) so it cannot be
   fooled by which webhook happened to arrive last.

   Statuses are the paying ones only. A cancelled plan running out its paid term
   is not covered here; the webhook's matching guard stops a key from being
   written during such a window in the first place, which is the cheaper half of
   the same rule.

   Fails closed: a DB error returns false and falls through to the key, so a
   transient failure can never hand out the catalog. */
export async function hasBroaderActiveSub(db: D1Database, userId: string): Promise<boolean> {
  const row = await db
    .prepare(
      `SELECT 1 AS found
         FROM subscriptions
        WHERE provider = 'paddle' AND user_id = ? AND external_id LIKE 'sub_%'
          AND status IN ('active', 'trialing', 'past_due')
          AND plan NOT LIKE 'single%'
        LIMIT 1`,
    )
    .bind(userId)
    .first<{ found: number }>()
    .catch(() => null);
  return !!row;
}

// Tracks every paid scope includes: New to R (free content anyway) and the
// Data Analyst core. Single Track is sold as "the shared core plus one
// specialization", so a Single Track scope ("ds", "ts", ...) covers these too.
export const CORE_TRACKS = ["foundations", "analyst"];

// True when a scope string covers a lesson/hub's track ('any' = any Pro plan).
export function scopeCovers(scope: string, track: string): boolean {
  if (scope === "0") return false;
  return scope === "all" || track === "any" || scope === track || CORE_TRACKS.includes(track);
}
