// GET  /api/me/profile  - the signed-in user's own profile state + stats
// POST /api/me/profile  - update profile settings; body: { public: boolean }
//
// Backs the owner controls on /u/<handle> and the "My profile" dropdown
// entry. GET also guarantees the user has a handle (lazy generation), so any
// signed-in user who opens their profile gets a working URL.

import type { Env, RequestData } from "../../_middleware";
import { json, err401, err500 } from "../../_lib/errors";
import { isProActive } from "../../_lib/db";
import { ensureHandle, ensureProfileColumns, loadProfileStats } from "../../_lib/profile";

export const onRequestGet: PagesFunction<Env, string, RequestData> = async (context) => {
  const u = context.data.user;
  if (!u) return err401();
  try {
    const handle = await ensureHandle(context.env.DB, u);
    const stats = await loadProfileStats(context.env.DB, u.id);
    const pub = (u as { public_profile?: number }).public_profile;
    return json({
      handle,
      url: handle ? `/u/${handle}` : null,
      is_public: (pub ?? 1) === 1,
      display_name: u.display_name,
      avatar_url: u.avatar_url,
      created_at: u.created_at,
      pro: isProActive(u),
      total_xp: u.total_xp,
      current_streak_days: u.current_streak_days,
      longest_streak_days: (u as { longest_streak_days?: number }).longest_streak_days ?? 0,
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
    const body = (await context.request.json().catch(() => ({}))) as { public?: unknown };
    if (typeof body.public !== "boolean") {
      return json({ error: "body must be { public: true|false }" }, { status: 400 });
    }
    await ensureProfileColumns(context.env.DB);
    await context.env.DB.prepare(
      "UPDATE users SET public_profile = ?1 WHERE id = ?2"
    ).bind(body.public ? 1 : 0, u.id).run();
    return json({ ok: true, is_public: body.public });
  } catch (e) {
    return err500(`profile update failed: ${String((e as Error)?.message || e)}`);
  }
};
