// POST /api/cron/integrity   Bearer CRON_SECRET
//
// Asks the three questions that, left unasked, let a pricing change break
// something quietly. Each of them is here because it actually went wrong.
//
//   1. Does every price id the site is configured with still exist in Paddle,
//      and is it still active? A checkout against an archived price fails at
//      the moment of payment, which is the single worst moment to find out.
//
//   2. Does each price-lock price still mirror the annual price it is
//      documented to mirror, override for override? On 2026-11-12 the India
//      annual price was raised and its two lock twins were not. The locks are
//      described in their own Paddle descriptions as mirroring the annual
//      price "including every regional override", and for several hours they
//      did not. Nothing would have reported it: the lock is a real, buyable
//      price, so Indian buyers would simply have paid the old figure through
//      it, indefinitely, and the books would have balanced.
//
//   3. Is every live subscription on a price the site still recognises? A
//      subscription whose price id is not in the configuration entitles
//      NOTHING on its next renewal, because individualPlan() resolves plans
//      only from configured ids. That failure would land on the renewal date,
//      long after the change that caused it.
//
// Reports through ops-alert, so a finding reaches the owner rather than the
// console. Returns the full report either way, so it is also worth running by
// hand after any pricing change.

import type { Env, RequestData } from "../../_middleware";
import { json, jsonError } from "../../_lib/errors";
import { paddleApiBase } from "../../_lib/paddle";
import { alertOps } from "../../_lib/ops-alert";

interface PaddlePrice {
  id: string;
  status?: string;
  description?: string;
  unit_price?: { amount?: string; currency_code?: string };
  unit_price_overrides?: Array<{
    country_codes?: string[];
    unit_price?: { amount?: string; currency_code?: string };
  }>;
}

type Finding = { check: string; severity: "critical" | "warn"; detail: string };

async function getPrice(apiKey: string, id: string): Promise<PaddlePrice | { error: string }> {
  try {
    const r = await fetch(`${paddleApiBase(apiKey)}/prices/${id}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!r.ok) return { error: `HTTP ${r.status}` };
    const b = (await r.json()) as { data?: PaddlePrice };
    return b.data ?? { error: "no data" };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

/* A price reduced to the thing that must match: its base, and each override
   keyed by the exact set of countries it covers. Country order is not
   meaningful to Paddle, so it is sorted; otherwise a harmless reordering
   would read as drift and every run would cry wolf. */
function shape(p: PaddlePrice): string {
  const base = `${p.unit_price?.amount}${p.unit_price?.currency_code}`;
  const ovs = (p.unit_price_overrides ?? [])
    .map((o) => `${[...(o.country_codes ?? [])].sort().join("+")}=${o.unit_price?.amount}${o.unit_price?.currency_code}`)
    .sort();
  return [base, ...ovs].join(" | ");
}

export const onRequestPost: PagesFunction<Env & { CRON_SECRET?: string }, string, RequestData> = async (context) => {
  const auth = context.request.headers.get("Authorization") || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const secret = context.env.CRON_SECRET || "";
  if (!secret || bearer !== secret) return jsonError(401, "unauthorized", "Bad cron secret.");

  const apiKey = context.env.PADDLE_API_KEY;
  if (!apiKey) return jsonError(503, "not_configured", "No Paddle API key.");
  const quiet = new URL(context.request.url).searchParams.get("quiet") === "1";

  const env = context.env as unknown as Record<string, string | undefined>;
  const CONFIGURED: Array<[string, string | undefined]> = [
    ["PADDLE_PRICE_SINGLE_MONTH", env.PADDLE_PRICE_SINGLE_MONTH],
    ["PADDLE_PRICE_SINGLE_YEAR", env.PADDLE_PRICE_SINGLE_YEAR],
    ["PADDLE_PRICE_AA_MONTH", env.PADDLE_PRICE_AA_MONTH],
    ["PADDLE_PRICE_AA_QUARTER", env.PADDLE_PRICE_AA_QUARTER],
    ["PADDLE_PRICE_AA_YEAR", env.PADDLE_PRICE_AA_YEAR],
    ["PADDLE_PRICE_LIFETIME", env.PADDLE_PRICE_LIFETIME],
    ["PADDLE_PRICE_SINGLE_YEAR_LOCK", env.PADDLE_PRICE_SINGLE_YEAR_LOCK],
    ["PADDLE_PRICE_AA_YEAR_LOCK", env.PADDLE_PRICE_AA_YEAR_LOCK],
    ["PADDLE_TEAMS_PRICE_ID", env.PADDLE_TEAMS_PRICE_ID],
  ];

  const findings: Finding[] = [];
  const fetched: Record<string, PaddlePrice> = {};
  const checked: Array<{ name: string; id: string; status: string }> = [];

  // ---- 1. every configured price exists and is active ---------------------
  for (const [name, id] of CONFIGURED) {
    if (!id) continue;                        // unset is a decision, not drift
    const p = await getPrice(apiKey, id);
    if ("error" in p) {
      findings.push({ check: "price_missing", severity: "critical",
        detail: `${name} (${id}) could not be read from Paddle: ${p.error}` });
      continue;
    }
    fetched[name] = p;
    checked.push({ name, id, status: p.status || "unknown" });
    if (p.status && p.status !== "active") {
      findings.push({ check: "price_inactive", severity: "critical",
        detail: `${name} (${id}) is ${p.status}. A checkout against it will fail at payment.` });
    }
  }

  // ---- 2. each lock still mirrors its annual twin --------------------------
  const MIRRORS: Array<[string, string]> = [
    ["PADDLE_PRICE_AA_YEAR_LOCK", "PADDLE_PRICE_AA_YEAR"],
    ["PADDLE_PRICE_SINGLE_YEAR_LOCK", "PADDLE_PRICE_SINGLE_YEAR"],
  ];
  for (const [lockName, twinName] of MIRRORS) {
    const lock = fetched[lockName], twin = fetched[twinName];
    if (!lock || !twin) continue;
    const a = shape(lock), b = shape(twin);
    if (a !== b) {
      findings.push({ check: "lock_drift", severity: "critical",
        detail: `${lockName} no longer mirrors ${twinName}.\n  lock: ${a}\n  twin: ${b}` });
    }
  }

  // ---- 3. every live subscription is on a price we still recognise --------
  const known = new Set(CONFIGURED.map(([, id]) => id).filter(Boolean) as string[]);
  let subsSeen = 0;
  try {
    const r = await fetch(`${paddleApiBase(apiKey)}/subscriptions?per_page=200&status=active`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (r.ok) {
      const b = (await r.json()) as { data?: Array<{ id: string; items?: Array<{ price?: { id?: string } }> }> };
      for (const s of b.data ?? []) {
        subsSeen++;
        for (const it of s.items ?? []) {
          const pid = it.price?.id;
          if (pid && !known.has(pid)) {
            findings.push({ check: "subscription_orphaned", severity: "critical",
              detail: `Live subscription ${s.id} bills price ${pid}, which is in no PADDLE_PRICE_* variable. ` +
                      `It will entitle nothing on its next renewal.` });
          }
        }
      }
    } else {
      findings.push({ check: "subscriptions_unreadable", severity: "warn",
        detail: `Could not list subscriptions: HTTP ${r.status}` });
    }
  } catch (e) {
    findings.push({ check: "subscriptions_unreadable", severity: "warn",
      detail: `Could not list subscriptions: ${(e as Error).message}` });
  }

  // ---- report -------------------------------------------------------------
  const critical = findings.filter((f) => f.severity === "critical");
  if (findings.length && !quiet) {
    /* One alert for the whole run, not one per finding. A reprice that misses
       a tier usually trips several checks at once, and they are one problem
       with one fix. The dedupe ref keeps a daily run from re-emailing an
       unfixed finding more than its hourly ceiling allows. */
    await alertOps(context.env, {
      kind: "catalog_drift",
      severity: critical.length ? "critical" : "warn",
      ref: `integrity:${findings.map((f) => f.check).sort().join(",")}`,
      summary: critical.length
        ? `Pricing integrity: ${critical.length} problem${critical.length === 1 ? "" : "s"} that will cost a sale`
        : `Pricing integrity: ${findings.length} thing${findings.length === 1 ? "" : "s"} to look at`,
      rows: findings.map((f) => [f.check, f.detail] as [string, string]),
    });
  }

  return json({
    ok: findings.length === 0,
    checked_prices: checked,
    live_subscriptions_seen: subsSeen,
    findings,
  });
};
