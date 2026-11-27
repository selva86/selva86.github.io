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
  const t = await env.KV.get(`tracks:${user.id}`).catch(() => null);
  return t || "all";
}

// Tracks every paid scope includes: New to R (free content anyway) and the
// Data Analyst core. Single Track is sold as "the shared core plus one
// specialization", so a Single Track scope ("ds", "ts", ...) covers these too.
export const CORE_TRACKS = ["foundations", "analyst"];

// There is deliberately no split-alias table here.
//
// One existed from 2026-11-26 to 2026-11-27, mapping ds -> product-ds, for a
// plan that would have MOVED 26 published lessons out of the `ds` track and
// into Product Data Scientist. Under that plan the alias was essential: a
// lesson changing track in pro-lessons.json would have silently stripped it
// from every `ds` Single Track customer, with no error and no log.
//
// The owner chose duplication over relocation instead (2026-11-27). A Product
// DS lesson that overlaps a `ds` one is written fresh under its own slug, so
// nothing a customer paid for ever changes track, and there is nobody to
// grandfather. The alias then does the opposite of protecting a buyer: it
// hands every `ds` Single Track customer the whole Product DS catalogue, a
// separately sold product, for nothing. It also let them mint the Certified R
// Product Data Scientist certificate off a track they never bought.
//
// Removed while Product DS had no content on production and no certificate
// had ever been issued, so it revoked nothing anybody held.
//
// If a track is ever genuinely split again, reintroduce the table here rather
// than widening a scope string: a scope carries no purchase date, so it
// cannot by itself tell an old buyer from a new one.

// True when a scope string covers a lesson/hub's track ('any' = any Pro plan).
export function scopeCovers(scope: string, track: string): boolean {
  if (scope === "0") return false;
  return scope === "all" || track === "any" || scope === track
    || CORE_TRACKS.includes(track);
}
