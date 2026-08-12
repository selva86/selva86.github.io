// GET /api/email/click?u=<uid>&k=<email_key>&t=<hmac>&to=<path> - click redirect.
//
// Every CTA in an HTML email routes through here so clicks attribute to the
// exact email_key, then 302s to the real destination. `to` is confined to
// this site (a path, or an absolute r-statistics.co URL) - never an open
// redirect. Invalid signatures still redirect (the reader always reaches the
// page; we just do not count the click).

import type { Env, RequestData } from "../../_middleware";

const SITE = "https://r-statistics.co";

async function hmacHex(secret: string, msg: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function safeDest(raw: string): string {
  try {
    if (raw.startsWith("/") && !raw.startsWith("//")) return SITE + raw;
    const u = new URL(raw);
    if (u.origin === SITE) return u.toString();
  } catch { /* fall through */ }
  return SITE + "/";
}

export const onRequestGet: PagesFunction<Env & { EMAIL_UNSUB_SECRET?: string }, string, RequestData> = async (context) => {
  const p = new URL(context.request.url).searchParams;
  const dest = safeDest(p.get("to") || "/");
  try {
    const u = p.get("u") || "", k = (p.get("k") || "").slice(0, 60), t = p.get("t") || "";
    if (u && k && t && context.env.EMAIL_UNSUB_SECRET) {
      const want = await hmacHex(context.env.EMAIL_UNSUB_SECRET, u);
      if (t.toLowerCase() === want) {
        await context.env.DB.prepare(
          "INSERT INTO email_events (user_id, email, email_key, event, at, meta) VALUES (?1, NULL, ?2, 'click', ?3, ?4)",
        ).bind(u, k, Math.floor(Date.now() / 1000), dest.slice(0, 180)).run();
      }
    }
  } catch { /* never block the redirect */ }
  return new Response(null, {
    status: 302,
    headers: { Location: dest, "Cache-Control": "private, no-store" },
  });
};
