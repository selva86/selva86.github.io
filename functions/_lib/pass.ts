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
import { createPaddleDiscount } from "./cartrecovery";

export const PASS_DAYS = 30;
export const PASS_TRACK = "analyst"; // roadmap track key of the DA lessons

export interface PassState {
  claimed: boolean;
  active: boolean;
  track: string;
  ends_at: number;   // unix seconds; 0 while unclaimed
  days_left: number; // full allowance while unclaimed; 0 once expired
  // The day-27 code (23% off, 72h), while it is still valid. Minted once by
  // the email brain, kept in KV passcode:<uid>, surfaced on the lesson wall
  // and the pricing page so the email and the page tell the same story.
  coupon?: PassCoupon | null;
}

export interface PassCoupon { code: string; expires_at: number }

export const PASS_COUPON_PERCENT = "23";
export const PASS_COUPON_HOURS = 72;

export async function passCoupon(
  env: { KV: KVNamespace }, userId: string, nowSec = Math.floor(Date.now() / 1000),
): Promise<PassCoupon | null> {
  try {
    const raw = await env.KV.get(`passcode:${userId}`);
    if (!raw) return null;
    const c = JSON.parse(raw) as PassCoupon;
    return c && c.code && c.expires_at > nowSec ? c : null;
  } catch { return null; }
}

// Mint the pass coupon exactly once per user: a personal, single-use 23%
// code on the four individual prices, valid 72 hours. Returns the existing
// coupon when one is still valid. Null when Paddle is not configured or the
// call fails (the caller retries next run).
export async function mintPassCoupon(
  env: { KV: KVNamespace; PADDLE_API_KEY?: string; PADDLE_PRICE_SINGLE_MONTH?: string; PADDLE_PRICE_SINGLE_YEAR?: string;
         PADDLE_PRICE_AA_MONTH?: string; PADDLE_PRICE_AA_YEAR?: string },
  userId: string, nowSec = Math.floor(Date.now() / 1000),
): Promise<PassCoupon | null> {
  const have = await passCoupon(env, userId, nowSec);
  if (have) return have;
  if (!env.PADDLE_API_KEY) return null;
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "PASS23";
  const b = new Uint8Array(6); crypto.getRandomValues(b);
  for (const x of b) code += A[x % A.length];
  const expiresAt = nowSec + PASS_COUPON_HOURS * 3600;
  const priceIds = [env.PADDLE_PRICE_SINGLE_MONTH, env.PADDLE_PRICE_SINGLE_YEAR, env.PADDLE_PRICE_AA_MONTH, env.PADDLE_PRICE_AA_YEAR]
    .filter((x): x is string => !!x);
  const ok = await createPaddleDiscount(env, {
    code, percent: PASS_COUPON_PERCENT, expiresAt, priceIds,
    description: `Data Analyst pass day-27 code for user ${userId}`,
  });
  if (!ok) return null;
  const c: PassCoupon = { code, expires_at: expiresAt };
  await env.KV.put(`passcode:${userId}`, JSON.stringify(c), { expirationTtl: PASS_COUPON_HOURS * 3600 + 86400 }).catch(() => undefined);
  return c;
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
    coupon: await passCoupon(env, user.id, nowSec),
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
