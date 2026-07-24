// GET /u/<handle>/badge-card.svg?id=<badge_id>
// The navy badge share card. Public profiles + the owner's own awarded badge
// only; badge names come from the defs (cert badges from the cert list), so
// nothing user-authored is rendered beyond the display name.

import type { Env, RequestData } from "../../_middleware";
import { ensureProfileColumns, renderShareCardSvg } from "../../_lib/profile";
import { BADGE_DEFS } from "../../_lib/badges";
import type { User } from "../../_lib/db";

export const onRequestGet: PagesFunction<Env, "handle", RequestData> = async (context) => {
  const notFound = new Response("not found", { status: 404, headers: { "Cache-Control": "public, max-age=300" } });
  const raw = decodeURIComponent(String(context.params.handle || "")).toLowerCase();
  const badgeId = new URL(context.request.url).searchParams.get("id") || "";
  if (!/^[a-z0-9][a-z0-9-]{1,30}$/.test(raw)) return notFound;
  if (!/^[a-z0-9-]{2,60}$/.test(badgeId)) return notFound;

  const DB = context.env.DB;
  await ensureProfileColumns(DB);
  const u = await DB.prepare(
    "SELECT * FROM users WHERE handle = ?1 AND deleted_at IS NULL"
  ).bind(raw).first<User & { public_profile?: number }>();
  if (!u || (u.public_profile ?? 1) !== 1) return notFound;

  const owned = await DB.prepare(
    "SELECT awarded_at FROM user_badges WHERE user_id = ?1 AND badge_id = ?2"
  ).bind(u.id, badgeId).first<{ awarded_at: number }>().catch(() => null);
  if (!owned) return notFound;

  // resolve a display name: static defs first, else a cert badge title
  let badgeName: string | null = null;
  let ringText = "R";
  const def = BADGE_DEFS.find((d) => d.id === badgeId);
  if (def) {
    badgeName = def.name;
    ringText = def.glyph === "OK" ? "100" : def.glyph;
  } else if (badgeId.startsWith("cert-")) {
    const cert = await DB.prepare(
      "SELECT track_name FROM certificates WHERE user_id = ?1 AND status = 'active'"
    ).bind(u.id).all<{ track_name: string }>().catch(() => ({ results: [] as Array<{ track_name: string }> }));
    for (const c of cert.results ?? []) {
      const slug = (c.track_name || "certificate").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
      if ("cert-" + slug === badgeId) {
        badgeName = c.track_name;
        ringText = (c.track_name || "RC").split(/\s+/).map((w) => w[0]).join("").replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase();
        break;
      }
    }
  }
  if (!badgeName) return notFound;

  const year = new Date(owned.awarded_at * 1000).getUTCFullYear();
  const svg = renderShareCardSvg({
    name: u.display_name || "R learner",
    handle: raw,
    headline: `earned the ${badgeName} badge`,
    chip: "BADGE EARNED",
    footer: `see the profile at r-statistics.co/u/${raw}`,
    ringText,
    ringSub: String(year),
  });
  return new Response(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
    },
  });
};
