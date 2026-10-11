// Which plan a verified Paddle subscription or transaction pays for.
//
// Decided ONLY from the catalog price ids on its items (and the seller-set
// custom_data on those catalog prices). Never from the entity's own
// custom_data: that is whatever the buyer's browser passed to
// Paddle.Checkout.open, so it can name any plan. Trusting it let a $9 Single
// Track month fulfil as Lifetime, a Single subscription as All-Access, and any
// subscription as a Teams org (found 2026-10-11, never used).
//
// Pure functions, no I/O: unit-tested by Scripts/functions-truth/paddle-plan.test.mjs.

export interface PlanPriceEnv {
  PADDLE_PRICE_SINGLE_MONTH?: string;
  PADDLE_PRICE_SINGLE_YEAR?: string;
  PADDLE_PRICE_AA_MONTH?: string;
  PADDLE_PRICE_AA_YEAR?: string;
  PADDLE_PRICE_LIFETIME?: string;
  PADDLE_PRICE_SINGLE_YEAR_LOCK?: string;
  PADDLE_PRICE_AA_YEAR_LOCK?: string;
}

export interface PaddlePlanPrice {
  id?: string;
  custom_data?: Record<string, unknown> | null;
}
export interface PaddlePlanItem {
  price?: PaddlePlanPrice;
  quantity?: number;
}
export interface PaddlePlanData {
  items?: PaddlePlanItem[];
  custom_data?: Record<string, unknown> | null;
}

// '<plan>_<term>' (e.g. 'allaccess_year') or 'lifetime' for the first item
// whose price id is one of the configured PADDLE_PRICE_* ids. Null = not one
// of ours: entitle nothing.
export function individualPlan(data: PaddlePlanData, env: PlanPriceEnv): string | null {
  const byPrice: Record<string, string | undefined> = {
    single_month: env.PADDLE_PRICE_SINGLE_MONTH,
    single_year: env.PADDLE_PRICE_SINGLE_YEAR,
    allaccess_month: env.PADDLE_PRICE_AA_MONTH,
    allaccess_year: env.PADDLE_PRICE_AA_YEAR,
    lifetime: env.PADDLE_PRICE_LIFETIME,
    /* The price-lock prices are the same plans with the first charge pushed
       out 60 days, so they resolve to the same plan keys. What differs is only
       WHEN entitlement starts, which isPriceLock decides. */
    single_year_lock: env.PADDLE_PRICE_SINGLE_YEAR_LOCK,
    allaccess_year_lock: env.PADDLE_PRICE_AA_YEAR_LOCK,
  };
  for (const item of data.items || []) {
    const pid = item.price?.id;
    if (!pid) continue;
    for (const [key, envId] of Object.entries(byPrice)) {
      if (envId && envId === pid) return key.replace(/_lock$/, "");
    }
  }
  return null;
}

/* Is this subscription a price lock, i.e. bought now to start later? Two
   independent signals, because the answer decides whether somebody reads paid
   lessons for free: what checkout stamped into custom_data, and the price id
   itself. Either is sufficient; neither is trusted alone. (A forged
   custom_data flag can only delay the buyer's own access, never grant any.) */
export function isPriceLock(data: PaddlePlanData, env: PlanPriceEnv): boolean {
  if (data.custom_data?.price_lock === true || data.custom_data?.price_lock === "true") return true;
  const locks = [env.PADDLE_PRICE_SINGLE_YEAR_LOCK, env.PADDLE_PRICE_AA_YEAR_LOCK].filter(Boolean);
  if (!locks.length) return false;
  for (const item of data.items || []) {
    const pid = item.price?.id;
    if (pid && locks.includes(pid)) return true;
  }
  return false;
}

// Identify a Teams subscription and its seat quantity: the summed quantity of
// the items whose catalog price is the Teams price (PADDLE_TEAMS_PRICE_ID, or
// custom_data.plan === 'teams' set on the price itself in the catalog).
// Returns null if no item is a Teams seat.
export function teamsSeatQuantity(data: PaddlePlanData, teamsPriceId?: string): number | null {
  let seats: number | null = null;
  for (const item of data.items || []) {
    const pricePlan = (item.price?.custom_data?.plan as string | undefined) || undefined;
    const isTeamsItem = pricePlan === "teams" || (!!teamsPriceId && item.price?.id === teamsPriceId);
    if (isTeamsItem) seats = (seats ?? 0) + (item.quantity ?? 0);
  }
  return seats;
}

// Short label for owner notifications: the plan actually paid for.
export function planLabel(data: PaddlePlanData, env: PlanPriceEnv, teamsPriceId?: string): string {
  if (teamsSeatQuantity(data, teamsPriceId) !== null) return "teams";
  const p = individualPlan(data, env);
  return p ? p.replace("_", " ") : "";
}
