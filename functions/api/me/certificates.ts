// GET /api/me/certificates
//
// Returns the current user's certificates (active + unlisted; revoked
// excluded). Used by /account-certificates.html.

import type { Env, RequestData } from "../../_middleware";
import { json, err401 } from "../../_lib/errors";
import { listCertificates } from "../../_lib/db";

export const onRequestGet: PagesFunction<Env, string, RequestData> = async (context) => {
  const u = context.data.user;
  if (!u) return err401();

  const certs = await listCertificates(context.env.DB, u.id);
  const origin = new URL(context.request.url).origin;
  return json({
    items: certs.map(c => ({
      public_id: c.public_id,
      track: c.track,
      track_name: c.track_name,
      recipient_name: c.recipient_name,
      skills: c.skills_json ? JSON.parse(c.skills_json) : [],
      issued_at: c.issued_at,
      status: c.status,
      verify_url: c.public_id ? `${origin}/cert/${c.public_id}` : null,
    })),
  });
};
