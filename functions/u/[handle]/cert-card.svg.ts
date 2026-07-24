// GET /u/<handle>/cert-card.svg?id=<public_id>
// The navy certificate share card. Public profiles + the owner's own active
// certificate only; everything escaped; edge-cached an hour.

import type { Env, RequestData } from "../../_middleware";
import { ensureProfileColumns, renderShareCardSvg } from "../../_lib/profile";
import type { User } from "../../_lib/db";

export const onRequestGet: PagesFunction<Env, "handle", RequestData> = async (context) => {
  const notFound = new Response("not found", { status: 404, headers: { "Cache-Control": "public, max-age=300" } });
  const raw = decodeURIComponent(String(context.params.handle || "")).toLowerCase();
  const certId = new URL(context.request.url).searchParams.get("id") || "";
  if (!/^[a-z0-9][a-z0-9-]{1,30}$/.test(raw)) return notFound;
  if (!/^[A-Za-z0-9_-]{4,64}$/.test(certId)) return notFound;

  const DB = context.env.DB;
  await ensureProfileColumns(DB);
  const u = await DB.prepare(
    "SELECT * FROM users WHERE handle = ?1 AND deleted_at IS NULL"
  ).bind(raw).first<User & { public_profile?: number }>();
  if (!u || (u.public_profile ?? 1) !== 1) return notFound;

  const cert = await DB.prepare(
    "SELECT public_id, track_name, issued_at, score FROM certificates " +
    "WHERE user_id = ?1 AND public_id = ?2 AND status = 'active'"
  ).bind(u.id, certId).first<{ public_id: string; track_name: string; issued_at: number; score: number | null }>();
  if (!cert) return notFound;

  const trackName = cert.track_name || "r-statistics.co certificate";
  const initials = trackName.split(/\s+/).map((w) => w[0]).join("").replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase() || "RC";
  const year = new Date(cert.issued_at * 1000).getUTCFullYear();
  const svg = renderShareCardSvg({
    name: u.display_name || "R learner",
    handle: raw,
    headline: `earned the ${trackName}`,
    chip: "VERIFIED",
    footer: (cert.score ? `score ${cert.score}% · ` : "") + `verify at r-statistics.co/cert/${cert.public_id}`,
    ringText: initials,
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
