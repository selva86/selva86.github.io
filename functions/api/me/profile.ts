// GET  /api/me/profile  - the signed-in user's own profile state + stats
// POST /api/me/profile  - update profile settings. Accepted bodies:
//     { public: boolean }            visibility toggle (legacy shape, kept)
//     { handle: "new-handle" }       one-time handle rename
//     { bio, website, resume, github, projects, open_to_work, role,
//       work_pref, snippet }         profile extras (validated + merged)
//   Shapes can be combined except handle (processed alone for clear errors).
//
// Backs the owner controls on /u/<handle> and the "My profile" dropdown
// entry. GET also guarantees the user has a handle (lazy generation), so any
// signed-in user who opens their profile gets a working URL.

import type { Env, RequestData } from "../../_middleware";
import { json, err401, err500 } from "../../_lib/errors";
import { isProActive } from "../../_lib/db";
import {
  ensureHandle, ensureProfileColumns, loadProfileStats, parseProfileJson,
  mergeProfileExtras, renameHandle, computeTier, viewsThisMonth,
} from "../../_lib/profile";

export const onRequestGet: PagesFunction<Env, string, RequestData> = async (context) => {
  const u = context.data.user;
  if (!u) return err401();
  try {
    const handle = await ensureHandle(context.env.DB, u);
    const stats = await loadProfileStats(context.env.DB, u.id, u.total_xp || 0);
    const pub = (u as { public_profile?: number }).public_profile;
    const extras = parseProfileJson((u as { profile_json?: string }).profile_json);
    const tier = computeTier(u.total_xp || 0, stats.exercises_solved, stats.certificates.length);
    const views = handle ? await viewsThisMonth(context.env.DB, handle) : 0;
    return json({
      handle,
      url: handle ? `/u/${handle}` : null,
      is_public: (pub ?? 1) === 1,
      handle_locked: !!(u as { prev_handle?: string }).prev_handle,
      display_name: u.display_name,
      avatar_url: u.avatar_url,
      created_at: u.created_at,
      pro: isProActive(u),
      total_xp: u.total_xp,
      current_streak_days: u.current_streak_days,
      longest_streak_days: (u as { longest_streak_days?: number }).longest_streak_days ?? 0,
      github_login: (u as { github_login?: string }).github_login || null,
      tier,
      views_month: views,
      extras,
      stats,
    });
  } catch (e) {
    return err500(`profile load failed: ${String((e as Error)?.message || e)}`);
  }
};

export const onRequestPost: PagesFunction<Env, string, RequestData> = async (context) => {
  const u = context.data.user;
  if (!u) return err401();
  try {
    const body = (await context.request.json().catch(() => ({}))) as Record<string, unknown>;
    await ensureProfileColumns(context.env.DB);

    // handle rename is processed alone so its errors are unambiguous
    if ("handle" in body) {
      const res = await renameHandle(context.env.DB, u, String(body.handle || ""));
      if (!res.ok) return json({ error: res.error }, { status: 400 });
      return json({ ok: true, handle: String(body.handle).toLowerCase().trim() });
    }

    let updatedPublic: boolean | null = null;
    if ("public" in body) {
      if (typeof body.public !== "boolean") {
        return json({ error: "public must be true or false" }, { status: 400 });
      }
      await context.env.DB.prepare(
        "UPDATE users SET public_profile = ?1 WHERE id = ?2"
      ).bind(body.public ? 1 : 0, u.id).run();
      updatedPublic = body.public;
    }

    const extraKeys = ["bio", "website", "resume", "github", "projects", "open_to_work", "role", "work_pref", "snippet", "theme"];
    if (extraKeys.some((k) => k in body)) {
      const cur = parseProfileJson((u as { profile_json?: string }).profile_json);
      const merged = mergeProfileExtras(cur, body);
      if (!merged.ok) return json({ error: merged.error }, { status: 400 });
      await context.env.DB.prepare(
        "UPDATE users SET profile_json = ?1 WHERE id = ?2"
      ).bind(JSON.stringify(merged.extras), u.id).run();
    }

    return json({ ok: true, ...(updatedPublic !== null ? { is_public: updatedPublic } : {}) });
  } catch (e) {
    return err500(`profile update failed: ${String((e as Error)?.message || e)}`);
  }
};
