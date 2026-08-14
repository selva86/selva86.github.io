// The Data Analyst 30-day pass, claim-to-start model (owner decision
// 2026-08-16). The 30-day clock does NOT start at signup: it starts the
// first time the user opens a gated lesson on the DA track (the claim,
// written server-side by the middleware). Unclaimed = the offer stands,
// nothing ticking, forever. This is the honest free trial: the timer only
// runs on someone who knows it is running.
//
// Dormant until flag:da-pass = "on". The old da-pass:launched_at KV key is
// no longer used: existing accounts simply claim whenever they first open
// the track after the flip.
//
// A pass is NOT Pro: resolveScope() returns the DA track key for an active
// pass, so the lesson middleware serves full DA pages and the attempt
// endpoint grades DA quizzes, while every other track stays gated.

import type { User } from "./db";

export const PASS_DAYS = 30;
export const PASS_TRACK = "analyst"; // roadmap track key of the DA lessons

export interface PassState {
  claimed: boolean;
  active: boolean;
  track: string;
  ends_at: number;   // unix seconds; 0 while unclaimed
  days_left: number; // full allowance while unclaimed; 0 once expired
}

export async function resolvePass(
  env: { KV: KVNamespace },
  user: User | null,
  nowSec = Math.floor(Date.now() / 1000),
): Promise<PassState | null> {
  if (!user) return null;
  if ((await env.KV.get("flag:da-pass")) !== "on") return null;
  const claimedAt = (user as { pass_claimed_at?: number | null }).pass_claimed_at ?? null;
  if (!claimedAt) {
    return { claimed: false, active: false, track: PASS_TRACK, ends_at: 0, days_left: PASS_DAYS };
  }
  const endsAt = claimedAt + PASS_DAYS * 86400;
  return {
    claimed: true,
    active: nowSec < endsAt,
    track: PASS_TRACK,
    ends_at: endsAt,
    days_left: Math.max(0, Math.ceil((endsAt - nowSec) / 86400)),
  };
}

// Writes the claim exactly once (the WHERE guard makes replays no-ops).
export async function claimPass(
  db: D1Database, userId: string, nowSec = Math.floor(Date.now() / 1000),
): Promise<boolean> {
  const r = await db.prepare(
    "UPDATE users SET pass_claimed_at = ?1 WHERE id = ?2 AND pass_claimed_at IS NULL",
  ).bind(nowSec, userId).run();
  return (r.meta?.changes ?? 0) === 1;
}
