// GET /api/email/open?u=<uid>&k=<email_key>&t=<hmac> - the open pixel.
//
// First-party open tracking: every HTML email embeds this 1x1 gif, so opens
// attribute to the exact email_key (ZeptoMail's webhook cannot carry our key).
// The HMAC is the same per-user signature as the unsubscribe link, so a pixel
// URL cannot be forged for another account. Metrics use COUNT(DISTINCT user),
// and the dashboard footnotes that opens are directional (Apple's mail proxy
// auto-fetches pixels).

import type { Env, RequestData } from "../../_middleware";

const GIF = Uint8Array.from([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 1, 0, 1, 0, 0x80, 0, 0, 0, 0, 0,
  0xff, 0xff, 0xff, 0x21, 0xf9, 4, 1, 0, 0, 0, 0, 0x2c, 0, 0, 0, 0,
  1, 0, 1, 0, 0, 2, 2, 0x44, 1, 0, 0x3b,
]);

async function hmacHex(secret: string, msg: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const onRequestGet: PagesFunction<Env & { EMAIL_UNSUB_SECRET?: string }, string, RequestData> = async (context) => {
  const gif = new Response(GIF, {
    headers: { "Content-Type": "image/gif", "Cache-Control": "private, no-store" },
  });
  try {
    const p = new URL(context.request.url).searchParams;
    const u = p.get("u") || "", k = (p.get("k") || "").slice(0, 60), t = p.get("t") || "";
    if (!u || !k || !t || !context.env.EMAIL_UNSUB_SECRET) return gif;
    const want = await hmacHex(context.env.EMAIL_UNSUB_SECRET, u);
    if (t.toLowerCase() !== want) return gif;
    // One open row per (user, key) per day keeps the table lean; distinct
    // math in the dashboard is unaffected either way.
    const now = Math.floor(Date.now() / 1000);
    const dayStart = now - (now % 86400);
    const dup = await context.env.DB.prepare(
      "SELECT 1 AS x FROM email_events WHERE user_id = ?1 AND email_key = ?2 AND event = 'open' AND at >= ?3 LIMIT 1",
    ).bind(u, k, dayStart).first<{ x: number }>();
    if (!dup) {
      await context.env.DB.prepare(
        "INSERT INTO email_events (user_id, email, email_key, event, at, meta) VALUES (?1, NULL, ?2, 'open', ?3, 'pixel')",
      ).bind(u, k, now).run();
    }
  } catch { /* the pixel must never fail */ }
  return gif;
};
