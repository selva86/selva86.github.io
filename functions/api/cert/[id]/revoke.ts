// POST /api/cert/<public_id>/revoke
// POST /api/cert/<public_id>/unrevoke    (alias served by toggling status param)
//
// User-initiated cert visibility toggle. Sets status=unlisted (revoke) or
// active (unrevoke). Verify URL returns 404 while unlisted.
//
// Admin-style hard revocation is NOT this endpoint — it would set
// status='revoked' and is a separate path (not implemented in v1).

import type { Env, RequestData } from "../../../_middleware";
import { json, err401, jsonError } from "../../../_lib/errors";
import { setCertificateStatus } from "../../../_lib/db";
import { isValidPublicId } from "../../../_lib/tracks";

export const onRequestPost: PagesFunction<Env, "id", RequestData> = async (context) => {
  const u = context.data.user;
  if (!u) return err401();
  const publicId = decodeURIComponent(context.params.id as string);
  if (!isValidPublicId(publicId)) return jsonError(400, "bad_id", "Invalid public ID");

  const ok = await setCertificateStatus(context.env.DB, u.id, publicId, "unlisted");
  if (!ok) return jsonError(404, "not_found", "Certificate not found or not yours");
  return json({ public_id: publicId, status: "unlisted" });
};
