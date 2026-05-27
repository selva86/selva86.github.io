// GET /api/certifications/alumni?limit=24&track=<id>
//
// Public list of recently-earned, still-active certificates. Powers the
// alumni hall-of-fame page. No auth required. Users who want their cert
// excluded from this listing toggle status=unlisted from their account
// page — that hides them here AND on the verify URL simultaneously.
//
// Returns lean fields only: recipient_name, track_name, issued_at,
// public_id, verify_url. No user_id, no email, no internal IDs.

import type { Env, RequestData } from "../../_middleware";
import { json } from "../../_lib/errors";

const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 100;

export const onRequestGet: PagesFunction<Env, string, RequestData> = async (context) => {
  const url = new URL(context.request.url);
  const limit = Math.min(
    Math.max(1, parseInt(url.searchParams.get("limit") || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT),
    MAX_LIMIT,
  );
  const trackFilter = url.searchParams.get("track") || "";
  const origin = url.origin;

  let where = "status = 'active'";
  const binds: unknown[] = [];
  if (trackFilter) {
    where += " AND track = ?";
    binds.push(trackFilter);
  }
  const result = await context.env.DB
    .prepare(
      `SELECT public_id, recipient_name, track, track_name, issued_at
       FROM certificates
       WHERE ${where}
       ORDER BY issued_at DESC
       LIMIT ?`,
    )
    .bind(...binds, limit)
    .all<{
      public_id: string | null;
      recipient_name: string | null;
      track: string;
      track_name: string | null;
      issued_at: number;
    }>();

  const items = (result.results || [])
    .filter(r => r.public_id) // skip any legacy rows without a public_id
    .map(r => ({
      public_id: r.public_id,
      recipient_name: r.recipient_name || "Learner",
      track: r.track,
      track_name: r.track_name || r.track,
      issued_at: r.issued_at,
      verify_url: `${origin}/cert/${r.public_id}`,
    }));

  return json({ items });
};
