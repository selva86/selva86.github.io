// The Data Analyst 30-day pass (Plans/free-user-onboarding-plan.md s5).
// Every account gets the DA track free for its first 30 days. The clock
// starts at account creation for accounts created after launch, and at the
// launch moment for accounts that predate it (their announcement email is
// the re-engagement event).
//
// Dormant until BOTH KV keys are set at the flip:
//   flag:da-pass          = "on"
//   da-pass:launched_at   = <unix seconds of the flip>
// While launched_at is missing, pre-launch accounts resolve to an expired
// window (fail-closed) and post-launch accounts still work off created_at.
//
// A pass is NOT Pro: resolveScope() returns the DA track key for an active
// pass, so the lesson middleware serves full DA pages and the attempt
// endpoint grades DA quizzes, while every other track stays gated. Note the
// DA lessons themselves are still access:free today; the regate to Pro
// happens in the same deploy as the flip (runbook in the plan).

import type { User } from "./db";

export const PASS_DAYS = 30;
export const PASS_TRACK = "analyst"; // roadmap track key of the DA lessons

export interface PassState {
  active: boolean;
  track: string;
  ends_at: number;   // unix seconds
  days_left: number; // 0 once expired
}

export async function resolvePass(
  env: { KV: KVNamespace },
  user: User | null,
  nowSec = Math.floor(Date.now() / 1000),
): Promise<PassState | null> {
  if (!user) return null;
  if ((await env.KV.get("flag:da-pass")) !== "on") return null;
  const launchedRaw = await env.KV.get("da-pass:launched_at");
  const launched = launchedRaw ? parseInt(launchedRaw, 10) : NaN;
  const created = user.created_at || 0;
  const start = Number.isFinite(launched) ? Math.max(created, launched) : created;
  const endsAt = start + PASS_DAYS * 86400;
  return {
    active: nowSec < endsAt,
    track: PASS_TRACK,
    ends_at: endsAt,
    days_left: Math.max(0, Math.ceil((endsAt - nowSec) / 86400)),
  };
}
