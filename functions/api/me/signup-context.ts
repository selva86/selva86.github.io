// POST /api/me/signup-context
//
// Receives the signup attribution (page, trigger, next) that signin.html
// parked in localStorage before an OAuth redirect. Stored briefly in KV so
// the admin "new signup" email (fired by the Supabase webhook, which has no
// access to client context on OAuth signups) can pick it up. Best-effort and
// informational; always 204 for authenticated callers.

import type { Env, RequestData } from "../../_middleware";
import { err401 } from "../../_lib/errors";
import { flushPendingSignup } from "../../_lib/notify";

const FIELD_CAP = 300;

export const onRequestPost: PagesFunction<Env, string, RequestData> = async (context) => {
  const u = context.data.user;
  if (!u) return err401();
  try {
    let body: { page?: unknown; trigger?: unknown; next?: unknown } = {};
    try { body = await context.request.json(); } catch (_) {}
    const clean = (v: unknown) => (typeof v === "string" ? v.slice(0, FIELD_CAP) : "");
    const src = { page: clean(body.page), trigger: clean(body.trigger), next: clean(body.next) };
    if (src.page || src.trigger || src.next) {
      await context.env.KV.put(`signup-src:${u.id}`, JSON.stringify(src), { expirationTtl: 3600 });
      // If the webhook already fired without attribution, the notification is
      // parked — send it now with the source passed directly (no KV race).
      context.waitUntil(flushPendingSignup(context.env, u.id, src));
    }
  } catch (_) { /* informational only */ }
  return new Response(null, { status: 204 });
};
