// GET /api/health
// Smoke test: pings D1 + KV. Use as the CF Pages health-check probe.
// curl https://r-statistics.co/api/health -> {ok:true, db:'ok', kv:'ok', env:'production'}

import type { Env } from "../_middleware";
import { json } from "../_lib/errors";

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const checks = { db: "unknown", kv: "unknown" };

  try {
    const row = await context.env.DB.prepare("SELECT 1 AS ok").first<{ ok: number }>();
    checks.db = row?.ok === 1 ? "ok" : "unexpected";
  } catch (e) {
    // Log full error to Workers tail; surface only a generic status to callers.
    console.error("[health] db error:", (e as Error).message);
    checks.db = "error";
  }

  try {
    await context.env.KV.get("health:probe");
    checks.kv = "ok";
  } catch (e) {
    console.error("[health] kv error:", (e as Error).message);
    checks.kv = "error";
  }

  const ok = checks.db === "ok" && checks.kv === "ok";
  return json(
    { ok, ...checks, env: context.env.ENVIRONMENT, time: new Date().toISOString() },
    { status: ok ? 200 : 503 },
  );
};
