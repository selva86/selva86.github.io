// GET /api/me/reading?limit=20&offset=0&kind=in_progress|read|all
//
// Returns the current user's reading_progress rows in reverse-chronological
// order of read_at. `kind` filters:
//
//   in_progress (default) : actively reading; excludes marked_read and
//                           anything past 90% scroll
//   read                  : finished (marked_read OR scrolled past 90%)
//   all                   : everything with any progress recorded
//
// Title lookup is client-side from /www/sidebar.json (same pattern as
// /api/me/saved). We don't denormalize titles here.

import type { Env, RequestData } from "../../_middleware";
import { json, err401 } from "../../_lib/errors";
import { listReadingProgress, type ReadingKind } from "../../_lib/db";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 200;

function parseKind(raw: string | null): ReadingKind {
  if (raw === "read" || raw === "all") return raw;
  return "in_progress";
}

export const onRequestGet: PagesFunction<Env, string, RequestData> = async (context) => {
  const u = context.data.user;
  if (!u) return err401();

  const url = new URL(context.request.url);
  const limit = Math.min(
    Math.max(1, parseInt(url.searchParams.get("limit") || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT),
    MAX_LIMIT,
  );
  const offset = Math.max(0, parseInt(url.searchParams.get("offset") || "0", 10) || 0);
  const kind = parseKind(url.searchParams.get("kind"));

  const { items, has_more } = await listReadingProgress(context.env.DB, u.id, {
    kind,
    limit,
    offset,
  });

  return json({
    kind,
    items: items.map(r => ({
      slug: r.post_slug,
      scroll_pct: r.scroll_pct,
      last_section: r.last_section,
      read_at: r.read_at,
      marked_read: r.marked_read,
    })),
    limit,
    offset,
    has_more,
  });
};
