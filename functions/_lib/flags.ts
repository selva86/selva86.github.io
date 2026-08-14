// KV-backed feature flags. Key format: `flag:<name>`. Value: 'on' or 'off' (any
// non-'on' is treated as off). Read-through caches the lookup for the request lifetime.
// Flip flags at runtime via:
//   wrangler kv key put --binding KV flag:paywall on
// or in the CF dashboard: Workers & Pages > KV > r-stats-cache > Edit.

const REQ_CACHE = new WeakMap<object, Map<string, boolean>>();

export async function isOn(kv: KVNamespace, name: string, cacheKey?: object): Promise<boolean> {
  if (cacheKey) {
    const c = REQ_CACHE.get(cacheKey);
    if (c?.has(name)) return c.get(name)!;
  }
  const val = await kv.get(`flag:${name}`);
  const on = val === "on";
  if (cacheKey) {
    const c = REQ_CACHE.get(cacheKey) ?? new Map();
    c.set(name, on);
    REQ_CACHE.set(cacheKey, c);
  }
  return on;
}

// Known flag names. Centralised so they don't drift across endpoints.
export const FLAGS = {
  AUTH: "auth",
  SAVED: "saved",
  PROGRESS: "progress",
  EXERCISES: "exercises",
  PAYWALL: "paywall",
  CERTS: "certs",
  NEWSLETTER: "newsletter",
  COMMENTS: "comments",
  LEADERBOARD: "leaderboard",
  SIGNUP_ADMIN_EMAIL: "signup-admin-email",
  // Customer-facing purchase email (see _lib/fulfilment.ts). OFF until the
  // 2026-09-08 launch: while off the handler still records to audit_log
  // exactly what it would have sent.
  FULFILMENT_EMAIL: "fulfilment-email",
  // The 7-days-before-renewal reminder sweep. Deliberately a SEPARATE flag so
  // the purchase email can go live without a job that mails existing
  // subscribers on its first run.
  RENEWAL_REMINDER: "renewal-reminder",
  // Free-tier practice meter ("25 a month"; enforcement in
  // api/exercise/.../attempt.ts, rules in Plans/free-user-onboarding-plan.md
  // s4). Flip only together with the meter UI, or users hit a wall with no
  // meter that ever warned them.
  EXERCISE_METER: "exercise-meter",
  // The Data Analyst 30-day pass (plan s5). Flip together with the DA lesson
  // regate and set da-pass:launched_at = <unix seconds> in the same session,
  // or pre-launch accounts never get their window.
  DA_PASS: "da-pass",
  // ---- email engine (Plans/01_email_and_nurture/email-program-v2.md s7) ----
  // EMAIL_ENGINE: master kill; the brain refuses to run without it.
  // EMAIL_LIVE: THE go-live switch. Off = development mode: only the test
  //   allowlist receives real email, everyone else's decisions are logged as
  //   would_send events. On = sends reach every eligible user.
  // Per-sender flags gate individual emails; safe to leave on in dev mode.
  EMAIL_ENGINE: "email-engine",
  EMAIL_LIVE: "email-live",
  WELCOME_EMAIL: "welcome-email",
  LIFECYCLE_ENGINE: "lifecycle-engine",
  CAP_EMAIL: "cap-email",
  // The daily nurture sequence (windowed lessons). The send IS the lesson
  // unlock; flip only once the factory has runway (~14 built lessons).
  NURTURE_SEQUENCE: "nurture-sequence",
} as const;
