// POST /api/cert/<public_id>/regenerate-name
//
// Re-snapshots recipient_name from the user's current display_name. For
// users who changed their display name AFTER minting and want the cert to
// reflect the updated name.

import type { Env, RequestData } from "../../../_middleware";
import { json, err401, jsonError } from "../../../_lib/errors";
import { regenerateRecipientName } from "../../../_lib/db";
import { isValidPublicId } from "../../../_lib/tracks";

export const onRequestPost: PagesFunction<Env, "id", RequestData> = async (context) => {
  const u = context.data.user;
  if (!u) return err401();
  const publicId = decodeURIComponent(context.params.id as string);
  if (!isValidPublicId(publicId)) return jsonError(400, "bad_id", "Invalid public ID");

  const result = await regenerateRecipientName(context.env.DB, u.id, publicId);
  if (!result.updated) return jsonError(404, "not_found", "Certificate not found or not yours");
  return json({ public_id: publicId, recipient_name: result.recipient_name });
};
