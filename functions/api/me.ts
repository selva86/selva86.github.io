// GET /api/me
//
// Returns auth + Pro state for the current session. Always 200; { user: null }
// when signed out. The site shell uses this to set body.state-anon vs
// body.state-pro on hydration.
//
// Lazy user-row creation (Phase 1.6):
// If the JWT validates but no D1 user row exists (signup happened before the
// webhook was configured, or the webhook failed silently, or this user
// existed in Supabase before this app), we create the row from JWT claims
// on the fly. /api/me is the natural place because it's the first hit of any
// auth-aware page load.

import type { Env, RequestData } from "../_middleware";
import { json } from "../_lib/errors";
import { getUserById, recordNewsletterOptIn, upsertUserFromSupabase, type User } from "../_lib/db";
import { resolvePro } from "../_lib/entitlement";
import { notifyNewSignup } from "../_lib/notify";
import { ensureHandle } from "../_lib/profile";

export const onRequestGet: PagesFunction<Env, string, RequestData> = async (context) => {
  let u = context.data.user;
  const payload = context.data.payload;

  // Lazy-create case: JWT valid (payload set) but no D1 row.
  if (!u && payload?.sub && payload.email) {
    try {
      const meta = (payload.user_metadata ?? {}) as Record<string, unknown>;
      await upsertUserFromSupabase(context.env.DB, {
        id: payload.sub,
        email: payload.email,
        display_name:
          (meta.full_name as string) ||
          (meta.name as string) ||
          payload.email.split("@")[0],
        avatar_url: (meta.avatar_url as string) || undefined,
        country: context.request.headers.get("CF-IPCountry") || undefined,
      });
      u = await getUserById(context.env.DB, payload.sub);
      // Fallback admin signup notification for webhook-missed signups. A valid
      // JWT means the user is authenticated/confirmed. KV-deduped against the
      // webhook path so we never double-notify.
      if (u) {
        const meta2 = (payload.app_metadata ?? {}) as Record<string, unknown>;
        context.waitUntil(
          notifyNewSignup(context.env, {
            id: u.id,
            email: u.email,
            provider: meta2.provider as string | undefined,
          }),
        );
      }
    } catch (e) {
      console.error(`[api/me] lazy-create failed for ${payload.sub}: ${(e as Error).message}`);
      // Fall through and return null rather than 500 — page can still load anon.
    }
  }

  if (!u) return json({ user: null, pro: false });

  // Newsletter consent sync, self-healing (Phase 6/A): if signup metadata
  // carries the opt-in but the D1 flag never got set (missed webhook, failed
  // waitUntil write), fix it here — u is already loaded so the check is free.
  // recordNewsletterOptIn respects prior explicit unsubscribes, so a stale
  // metadata flag can never resurrect a dead subscription.
  const metaOptIn = (payload?.user_metadata as Record<string, unknown> | undefined)
    ?.marketing_opt_in;
  if (!u.newsletter_opt_in && metaOptIn) {
    const source =
      ((payload?.user_metadata as Record<string, unknown>)
        ?.marketing_opt_in_source as string) || "signup";
    const user = u;
    context.waitUntil(
      recordNewsletterOptIn(context.env.DB, {
        userId: user.id,
        email: user.email,
        source,
      }).catch((e) =>
        console.warn(`[api/me] newsletter opt-in sync failed: ${e}`),
      ),
    );
  }

  // Lazy handle generation (profiles feature): once per user, ever. Wrapped
  // so a failure can never break sign-in hydration - the profile link in the
  // dropdown simply stays hidden until a later request succeeds.
  if (!u.handle) {
    try {
      const h = await ensureHandle(context.env.DB, u);
      if (h) u = { ...u, handle: h };
    } catch (e) {
      console.warn(`[api/me] handle generation failed for ${u.id}: ${(e as Error).message}`);
    }
  }

  return await renderMe(context.env.DB, u);
};

async function renderMe(db: D1Database, u: User): Promise<Response> {
  // resolvePro composes individual + team-seat Pro. pro/pro_until keep their
  // existing meaning (auth-hydrate.js reads me.pro unchanged); `team` is new.
  const ent = await resolvePro(db, u);
  return json({
    user: {
      id: u.id,
      email: u.email,
      display_name: u.display_name,
      avatar_url: u.avatar_url,
      handle: u.handle,
      total_xp: u.total_xp,
      current_streak_days: u.current_streak_days,
      created_at: u.created_at,
    },
    pro: ent.pro,
    pro_until: ent.pro_until,
    pro_source: ent.source,
    team: ent.team,
  });
}
