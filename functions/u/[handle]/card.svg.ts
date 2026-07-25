// GET /u/<handle>/card.svg
//
// The embeddable learner stats card (README embeds, social). Public profiles
// only: private or unknown handles get a 404. Renamed handles 301 to the new
// URL (img tags follow redirects). Edge-cached for an hour; the card carries
// only what the public profile page already shows.

import type { Env, RequestData } from "../../_middleware";
import {
  ensureProfileColumns, loadProfileStats, computeTier, renderCardSvg,
} from "../../_lib/profile";
import type { User } from "../../_lib/db";

export const onRequestGet: PagesFunction<Env, "handle", RequestData> = async (context) => {
  const raw = decodeURIComponent(String(context.params.handle || "")).toLowerCase();
  const notFound = new Response("not found", { status: 404, headers: { "Cache-Control": "public, max-age=300" } });
  if (!/^[a-z0-9][a-z0-9-]{1,30}$/.test(raw)) return notFound;

  const DB = context.env.DB;
  await ensureProfileColumns(DB);
  const u = await DB.prepare(
    "SELECT * FROM users WHERE handle = ?1 AND deleted_at IS NULL"
  ).bind(raw).first<User & { public_profile?: number }>();

  if (!u) {
    const renamed = await DB.prepare(
      "SELECT handle FROM users WHERE prev_handle = ?1 AND deleted_at IS NULL"
    ).bind(raw).first<{ handle: string }>();
    if (renamed?.handle) {
      const url = new URL(context.request.url);
      url.pathname = `/u/${renamed.handle}/card.svg`;
      return Response.redirect(url.toString(), 301);
    }
    return notFound;
  }
  if ((u.public_profile ?? 1) !== 1) return notFound;

  const themeParam = new URL(context.request.url).searchParams.get("theme");
  const theme = themeParam === "dark" ? "dark" as const : "light" as const;
  const stats = await loadProfileStats(DB, u.id, u.total_xp || 0);
  const tier = computeTier(u.total_xp || 0, stats.exercises_solved, stats.certificates.length);
  const svg = renderCardSvg({
    name: u.display_name || "R learner",
    handle: raw,
    tier,
    totalXp: u.total_xp || 0,
    solved: stats.exercises_solved,
    streak: u.current_streak_days || 0,
    certs: stats.certificates.length,
    heat: stats.heatmap,
  }, theme);

  return new Response(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=14400, stale-while-revalidate=86400",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
    },
  });
};
