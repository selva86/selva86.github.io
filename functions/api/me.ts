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
import { resolvePass } from "../_lib/pass";
import { notifyNewSignup, flushPendingSignup } from "../_lib/notify";
import { ensureHandle, ensureProfileColumns } from "../_lib/profile";
import { sweepRecapEmails } from "../_lib/recap";

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

  // Weekly recap sweep, traffic-piggybacked: ~5% of authenticated hydrations
  // attempt it; the sweep itself is flag-gated and once-per-week via KV.
  if (Math.random() < 0.05) {
    try { context.waitUntil(sweepRecapEmails(context.env)); } catch { /* never blocks */ }
  }

  // Fresh-user fallback: if the webhook parked a source-less signup
  // notification and the client never posted attribution (closed the tab
  // mid-OAuth, blocked fetch), send it on their next page load. One cheap KV
  // get, and only for users created in the last 48h.
  if (u.created_at && Date.now() / 1000 - u.created_at < 48 * 3600) {
    const uid = u.id;
    context.waitUntil(flushPendingSignup(context.env, uid));
  }

  // Verified GitHub link for the learner profile: users who authenticated via
  // GitHub carry their login in the JWT metadata. Written once (column NULL),
  // so this costs nothing at steady state.
  if (!(u as { github_login?: string }).github_login && payload) {
    const app = (payload.app_metadata ?? {}) as { provider?: string; providers?: string[] };
    const viaGithub = app.provider === "github" || (app.providers || []).includes("github");
    const meta3 = (payload.user_metadata ?? {}) as { user_name?: string; preferred_username?: string };
    const login = viaGithub ? (meta3.user_name || meta3.preferred_username || "").trim() : "";
    if (login && /^[a-zA-Z0-9-]{1,39}$/.test(login)) {
      const uid2 = u.id;
      context.waitUntil((async () => {
        try {
          await ensureProfileColumns(context.env.DB);
          await context.env.DB.prepare(
            "UPDATE users SET github_login = ?1 WHERE id = ?2 AND github_login IS NULL"
          ).bind(login, uid2).run();
        } catch { /* best effort */ }
      })());
    }
  }

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

  return await renderMe(context.env, u);
};

async function renderMe(env: { DB: D1Database; KV: KVNamespace }, u: User): Promise<Response> {
  // resolvePro composes individual + team-seat Pro. pro/pro_until keep their
  // existing meaning (auth-hydrate.js reads me.pro unchanged); `team` is new.
  const ent = await resolvePro(env.DB, u);
  // The Data Analyst pass rides along for non-Pro users while its flag is
  // on - included even when expired, so the lesson wall can say the pass
  // ended rather than pretend it never existed. Absent = feature off.
  const pass = ent.pro ? null : await resolvePass(env, u).catch(() => null);
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
    ...(pass ? { pass } : {}),
  });
}
