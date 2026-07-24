// GET /u/<handle>/avatar.jpg
//
// Serves the learner-uploaded picture from R2. Served regardless of the
// profile's public/private setting: the owner's own masthead loads this URL
// without auth headers, and a lone avatar image reveals nothing the OAuth
// provider picture would not (those are public at the provider anyway).
// Day-long edge cache; the writer busts with ?v=<ts>.

import type { Env, RequestData } from "../../_middleware";

export const onRequestGet: PagesFunction<Env, "handle", RequestData> = async (context) => {
  const notFound = new Response("not found", { status: 404, headers: { "Cache-Control": "public, max-age=300" } });
  const raw = decodeURIComponent(String(context.params.handle || "")).toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{1,30}$/.test(raw)) return notFound;

  const u = await context.env.DB.prepare(
    "SELECT id, avatar_key FROM users WHERE handle = ?1 AND deleted_at IS NULL"
  ).bind(raw).first<{ id: string; avatar_key: string | null }>().catch(() => null);
  if (!u?.avatar_key) return notFound;

  const obj = await context.env.AVATARS.get(u.avatar_key);
  if (!obj) return notFound;

  return new Response(obj.body, {
    status: 200,
    headers: {
      "Content-Type": obj.httpMetadata?.contentType || "image/jpeg",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
};
