// GET /api/me/saved?limit=50&offset=0
//
// Returns the current user's saved posts in reverse chronological order.
// Title lookup is done client-side from /www/sidebar.json — we don't denormalize
// titles into saved_posts to avoid drift when posts are renamed.

import type { Env, RequestData } from "../../_middleware";
import { json, err401 } from "../../_lib/errors";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export const onRequestGet: PagesFunction<Env, string, RequestData> = async (context) => {
  const u = context.data.user;
  if (!u) return err401();

  const url = new URL(context.request.url);
  const limit = Math.min(
    Math.max(1, parseInt(url.searchParams.get("limit") || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT),
    MAX_LIMIT,
  );
  const offset = Math.max(0, parseInt(url.searchParams.get("offset") || "0", 10) || 0);

  const result = await context.env.DB
    .prepare(
      `SELECT post_slug, saved_at FROM saved_posts
       WHERE user_id = ?
       ORDER BY saved_at DESC
       LIMIT ? OFFSET ?`,
    )
    .bind(u.id, limit + 1, offset) // fetch one extra to detect has_more
    .all<{ post_slug: string; saved_at: number }>();

  const rows = result.results || [];
  const has_more = rows.length > limit;
  const items = rows.slice(0, limit).map(r => ({ slug: r.post_slug, saved_at: r.saved_at }));

  // Total count (optional but useful for UI). Skip if results are clearly less than limit + offset.
  let total: number | null = null;
  if (offset === 0 && !has_more) {
    total = items.length;
  } else {
    const cnt = await context.env.DB
      .prepare("SELECT COUNT(*) AS n FROM saved_posts WHERE user_id = ?")
      .bind(u.id)
      .first<{ n: number }>();
    total = cnt?.n ?? null;
  }

  return json({ items, total, limit, offset, has_more });
};
