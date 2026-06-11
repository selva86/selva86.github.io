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
} as const;
