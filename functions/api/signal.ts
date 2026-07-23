// POST /api/signal - first-party purchase-intent beacons.
//
// Tiny fire-and-forget endpoint the pricing page and the lesson player call
// (fetch keepalive) when a visitor does something that signals buying intent:
// viewing pricing, starting checkout, hitting a paywall or sign-in wall,
// starting/finishing free lessons. Rows land in D1 `intent_signals` and feed
// the "Purchase intent" panel on /admin/analytics.html plus the hot-leads
// join. Anonymous visitors are tracked by a client-random anon id (localStorage,
// no cookie, no fingerprinting); signed-in requests also carry user_id so a
// lead's trail stitches together when they sign up.
//
// Always 204 (even for garbage) - the client never needs feedback, and probes
// learn nothing. Table is created on first use (same pattern as traffic_daily).

import type { Env, RequestData } from "../_middleware";

const SIGNALS = new Set([
  "pricing_view", "pricing_toggle", "checkout_start", "checkout_closed",
  "purchase_client", "paywall_hit", "signin_wall_hit",
  "lesson_start", "lesson_complete", "cert_view", "track_view",
]);

let tableReady = false;
export async function ensureIntentTable(DB: D1Database) {
  if (tableReady) return;
  await DB.prepare(
    "CREATE TABLE IF NOT EXISTS intent_signals (" +
    "id INTEGER PRIMARY KEY AUTOINCREMENT, at INTEGER NOT NULL, " +
    "user_id TEXT, anon_id TEXT, signal TEXT NOT NULL, path TEXT, meta TEXT)"
  ).run();
  await DB.prepare(
    "CREATE INDEX IF NOT EXISTS idx_intent_at ON intent_signals (at)"
  ).run();
  tableReady = true;
}

export const onRequestPost: PagesFunction<Env, string, RequestData> = async (context) => {
  const done = new Response(null, { status: 204 });
  try {
    const raw = await context.request.text();
    if (!raw || raw.length > 2048) return done;
    let b: { s?: unknown; p?: unknown; m?: unknown; a?: unknown } = {};
    try { b = JSON.parse(raw); } catch (_) { return done; }
    const s = typeof b.s === "string" ? b.s : "";
    if (!SIGNALS.has(s)) return done;
    const clean = (v: unknown, cap: number) =>
      typeof v === "string" ? v.slice(0, cap) : null;
    await ensureIntentTable(context.env.DB);
    await context.env.DB.prepare(
      "INSERT INTO intent_signals (at, user_id, anon_id, signal, path, meta) VALUES (?,?,?,?,?,?)"
    ).bind(
      Math.floor(Date.now() / 1000),
      context.data.user?.id ?? null,
      clean(b.a, 40),
      s,
      clean(b.p, 200),
      clean(b.m, 200),
    ).run();
  } catch (_) { /* never fail the caller */ }
  return done;
};
