// /api/save/<slug>
//
// GET:    returns {saved: bool, saved_at?: unix}   (no body)
// POST:   adds to saved_posts                       (returns {saved:true, saved_at})
// DELETE: removes from saved_posts                  (returns {saved:false})
//
// All methods require authentication via the standard middleware path.
// Slug is whatever the request URL says — we don't validate against a manifest
// because tutorials may be added/renamed faster than a manifest sync. List
// page filters orphan slugs visually if a post no longer exists.

import type { Env, RequestData } from "../../_middleware";
import { json, err401, jsonError } from "../../_lib/errors";

const SLUG_MAX = 200;

function badSlug(slug: string): boolean {
  return !slug || slug.length > SLUG_MAX || /[\/\s]/.test(slug);
}

export const onRequestGet: PagesFunction<Env, "slug", RequestData> = async (context) => {
  const u = context.data.user;
  if (!u) return err401();
  const slug = decodeURIComponent(context.params.slug as string);
  if (badSlug(slug)) return jsonError(400, "bad_slug", "Invalid slug");

  const row = await context.env.DB
    .prepare("SELECT saved_at FROM saved_posts WHERE user_id = ? AND post_slug = ?")
    .bind(u.id, slug)
    .first<{ saved_at: number }>();

  return json({ slug, saved: !!row, saved_at: row?.saved_at ?? null });
};

export const onRequestPost: PagesFunction<Env, "slug", RequestData> = async (context) => {
  const u = context.data.user;
  if (!u) return err401();
  const slug = decodeURIComponent(context.params.slug as string);
  if (badSlug(slug)) return jsonError(400, "bad_slug", "Invalid slug");

  const now = Math.floor(Date.now() / 1000);
  // INSERT OR IGNORE: idempotent, returns same shape whether new or existing.
  await context.env.DB
    .prepare(
      "INSERT OR IGNORE INTO saved_posts (user_id, post_slug, saved_at) VALUES (?, ?, ?)",
    )
    .bind(u.id, slug, now)
    .run();

  // Re-read to get the canonical saved_at (preserves original if pre-existing).
  const row = await context.env.DB
    .prepare("SELECT saved_at FROM saved_posts WHERE user_id = ? AND post_slug = ?")
    .bind(u.id, slug)
    .first<{ saved_at: number }>();

  return json({ slug, saved: true, saved_at: row?.saved_at ?? now });
};

export const onRequestDelete: PagesFunction<Env, "slug", RequestData> = async (context) => {
  const u = context.data.user;
  if (!u) return err401();
  const slug = decodeURIComponent(context.params.slug as string);
  if (badSlug(slug)) return jsonError(400, "bad_slug", "Invalid slug");

  await context.env.DB
    .prepare("DELETE FROM saved_posts WHERE user_id = ? AND post_slug = ?")
    .bind(u.id, slug)
    .run();

  return json({ slug, saved: false });
};
