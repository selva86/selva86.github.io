// GET /api/_auth-config
//
// Returns the PUBLIC Supabase config (URL + anon key) so the frontend
// signin.html and account.html can initialize the Supabase JS client without
// hardcoding the values in HTML. Both values are public-safe — the anon key
// is intentionally exposed to browsers; only service_role + JWT secret are
// privileged. Saves us from manual-paste-on-deploy drift.
//
// Cached at CF edge for 10 minutes (values don't change often; cache shields
// the secret store from excessive lookups).

import type { Env } from "../_middleware";
import { json, jsonError } from "../_lib/errors";

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = context.env.SUPABASE_URL;
  const anonKey = context.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return jsonError(503, "config_missing", "Auth config not yet provisioned");
  }
  return json(
    { url, anonKey, env: context.env.ENVIRONMENT },
    {
      headers: {
        // Override the default no-store from json() since this IS cacheable.
        "Cache-Control": "public, max-age=600, s-maxage=600",
      },
    },
  );
};
