// POST /api/newsletter/claim-optin
//
// Replays a newsletter opt-in that the sign-in nudge recorded in
// localStorage ('rs-marketing-optin') before authentication completed.
// Covers the paths where Supabase user_metadata cannot carry the opt-in:
// - OAuth (Google/GitHub): no metadata hook at sign-in time.
// - Magic-link for an EXISTING user: Supabase ignores options.data then.
//
// Called by auth-hydrate.js after state-pro hydration with the Bearer token
// (never cookie-only, per the project CSRF rule for state-changing endpoints).
// Idempotent; recordNewsletterOptIn respects prior explicit unsubscribes.

import type { Env, RequestData } from "../../_middleware";
import { json, err401, jsonError } from "../../_lib/errors";
import { recordNewsletterOptIn } from "../../_lib/db";

const SOURCE_MAX = 64;

export const onRequestPost: PagesFunction<Env, string, RequestData> = async (context) => {
  const u = context.data.user;
  if (!u) return err401();

  let source = "signin-nudge";
  try {
    const body = (await context.request.json()) as { source?: string } | null;
    if (body && typeof body.source === "string" && body.source.trim()) {
      source = body.source.trim().slice(0, SOURCE_MAX);
    }
  } catch {
    // Empty or non-JSON body is fine; default source stands.
  }

  const result = await recordNewsletterOptIn(context.env.DB, {
    userId: u.id,
    email: u.email,
    source,
  });
  return json({ ok: true, recorded: result.recorded });
};

// Other methods are not supported on this endpoint.
export const onRequestGet: PagesFunction<Env> = async () => {
  return jsonError(405, "method_not_allowed", "POST only");
};
