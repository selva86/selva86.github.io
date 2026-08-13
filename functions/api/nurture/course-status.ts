// GET /api/nurture/course-status?course=<id> (authed) - the ceremony
// endpoint. Reports completion (derived) and mints the badge exactly once
// when a course is newly complete. The player calls it on the final step of
// a windowed lesson; the response drives the Why-Pro screen + badge screen.

import type { Env, RequestData } from "../../_middleware";
import { json, err401, jsonError } from "../../_lib/errors";
import { courseComplete, courseDef, mintBadge, linkedInAddUrl } from "../../_lib/badges-mini";

export const onRequestGet: PagesFunction<Env, string, RequestData> = async (context) => {
  const u = context.data.user;
  if (!u) return err401();
  const courseId = new URL(context.request.url).searchParams.get("course") || "";
  if (!courseDef(courseId)) return jsonError(404, "no_course", "Unknown mini course");

  const status = await courseComplete(context.env.DB, u.id, courseId);
  if (!status.complete) {
    return json({ complete: false, parts_done: status.parts_done, parts_total: status.parts_total });
  }
  const badge = await mintBadge(context.env.DB, u.id, courseId);
  if (!badge) return jsonError(500, "mint_failed", "Could not mint the badge");
  return json({
    complete: true,
    parts_done: status.parts_done,
    parts_total: status.parts_total,
    badge: {
      id: badge.badge, title: badge.title, public_id: badge.public_id,
      earned_at: badge.earned_at, newly_minted: badge.newly_minted,
      verify_url: `https://r-statistics.co/badge/${badge.public_id}`,
      linkedin_url: linkedInAddUrl(badge.title, badge.public_id, badge.earned_at),
    },
  });
};
