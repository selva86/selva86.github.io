// /api/read/<slug>
//
// GET:  returns {slug, scroll_pct, last_section, read_at, marked_read} or
//       {slug, scroll_pct:null, ..., marked_read:0} if no row yet.
// POST: body {scroll_pct?:number, last_section?:string, marked_read?:bool}
//       Upserts. Only the fields you include are updated; omitted fields
//       preserve their stored value. read_at is always bumped to "now".
//
// Both require authentication via middleware. Slug validated against the same
// rules as /api/save/<slug> (no spaces, no slashes, <=200 chars).

import type { Env, RequestData } from "../../_middleware";
import { json, err401, jsonError } from "../../_lib/errors";
import { getReadingProgress, upsertReadingProgress } from "../../_lib/db";

const SLUG_MAX = 200;

function badSlug(slug: string): boolean {
  return !slug || slug.length > SLUG_MAX || /[\/\s]/.test(slug);
}

function rowOrEmpty(slug: string, row: Awaited<ReturnType<typeof getReadingProgress>>) {
  if (!row) {
    return {
      slug,
      scroll_pct: null,
      last_section: null,
      read_at: null,
      marked_read: 0,
    };
  }
  return {
    slug,
    scroll_pct: row.scroll_pct,
    last_section: row.last_section,
    read_at: row.read_at,
    marked_read: row.marked_read,
  };
}

export const onRequestGet: PagesFunction<Env, "slug", RequestData> = async (context) => {
  const u = context.data.user;
  if (!u) return err401();
  const slug = decodeURIComponent(context.params.slug as string);
  if (badSlug(slug)) return jsonError(400, "bad_slug", "Invalid slug");

  const row = await getReadingProgress(context.env.DB, u.id, slug);
  return json(rowOrEmpty(slug, row));
};

export const onRequestPost: PagesFunction<Env, "slug", RequestData> = async (context) => {
  const u = context.data.user;
  if (!u) return err401();
  const slug = decodeURIComponent(context.params.slug as string);
  if (badSlug(slug)) return jsonError(400, "bad_slug", "Invalid slug");

  // Body is optional. An empty POST is treated as a "still here" heartbeat —
  // bumps read_at only. (Same effect as send-beacon shutdown ping.)
  let body: { scroll_pct?: unknown; last_section?: unknown; marked_read?: unknown } = {};
  if (context.request.headers.get("content-length") !== "0") {
    try {
      body = await context.request.json();
    } catch {
      return jsonError(400, "bad_body", "Invalid JSON body");
    }
  }

  const patch: { scroll_pct?: number; last_section?: string; marked_read?: boolean } = {};
  if (typeof body.scroll_pct === "number" && Number.isFinite(body.scroll_pct)) {
    patch.scroll_pct = body.scroll_pct;
  }
  if (typeof body.last_section === "string" && body.last_section.length > 0) {
    patch.last_section = body.last_section;
  }
  if (typeof body.marked_read === "boolean") {
    patch.marked_read = body.marked_read;
  }

  const row = await upsertReadingProgress(context.env.DB, u.id, slug, patch);
  return json(rowOrEmpty(slug, row));
};
