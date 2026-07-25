// POST /api/me/avatar   { data: "data:image/jpeg;base64,..." }
// DELETE /api/me/avatar
//
// Learner-uploaded profile picture (profile v3 pass M). The client downsizes
// to 256x256 JPEG before upload, so the edge only validates and stores:
// magic-byte check (JPEG or PNG), 200KB decoded cap, R2 key derived from the
// user id (never from user input). users.avatar_key marks the upload so the
// OAuth picture can never clobber it on later sign-ins (see upsertUser).
// Requires a handle: the serving URL is /u/<handle>/avatar.jpg.

import type { Env, RequestData } from "../../_middleware";
import { json, err401, jsonError } from "../../_lib/errors";
import { ensureProfileColumns } from "../../_lib/profile";

const MAX_BYTES = 200 * 1024;

export const onRequestPost: PagesFunction<Env, string, RequestData> = async (context) => {
  const u = context.data.user;
  if (!u) return err401();
  const handle = (u as { handle?: string | null }).handle;
  if (!handle) return jsonError(409, "handle_required", "Set a profile handle before uploading a picture.");

  let body: { data?: unknown };
  try {
    body = await context.request.json();
  } catch {
    return jsonError(400, "bad_body", "Invalid JSON body");
  }
  const m = typeof body.data === "string"
    ? body.data.match(/^data:image\/(jpeg|png);base64,([A-Za-z0-9+/=]+)$/)
    : null;
  if (!m) return jsonError(400, "bad_image", "Send a JPEG or PNG data URL.");

  let bytes: Uint8Array;
  try {
    const bin = atob(m[2]);
    if (bin.length > MAX_BYTES) return jsonError(413, "too_large", "Image must be under 200KB after resizing.");
    bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  } catch {
    return jsonError(400, "bad_image", "Could not decode the image.");
  }
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8;
  const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  if (!isJpeg && !isPng) return jsonError(400, "bad_image", "File content is not a JPEG or PNG.");

  const key = `avatar/${u.id}.img`;
  await context.env.AVATARS.put(key, bytes, {
    httpMetadata: { contentType: isJpeg ? "image/jpeg" : "image/png" },
  });

  const now = Math.floor(Date.now() / 1000);
  const url = `/u/${handle}/avatar.jpg?v=${now}`;
  await ensureProfileColumns(context.env.DB);
  await context.env.DB.prepare(
    "UPDATE users SET avatar_key = ?1, avatar_url = ?2 WHERE id = ?3"
  ).bind(key, url, u.id).run();

  return json({ ok: true, avatar_url: url });
};

export const onRequestDelete: PagesFunction<Env, string, RequestData> = async (context) => {
  const u = context.data.user;
  if (!u) return err401();
  await ensureProfileColumns(context.env.DB);
  const key = `avatar/${u.id}.img`;
  try { await context.env.AVATARS.delete(key); } catch { /* already gone */ }
  await context.env.DB.prepare(
    "UPDATE users SET avatar_key = NULL, avatar_url = NULL WHERE id = ?1"
  ).bind(u.id).run();
  return json({ ok: true });
};
