// GET /api/email/pause?u=<uid>&t=<hmac>&d=<days>
//
// The quiet-five-days probe's two links. d=14 pauses the daily lesson series
// for two weeks (users.nurture_paused_until; the brain's seq walk skips the
// user until then, and the lessons resume on their own, right where they
// left off). d=0 is "keep them coming": clears any pause and records the
// answer. Both write an email_events row so the dashboard can see the
// probe's outcome. 302s to /email-thanks.html.

import type { Env, RequestData } from "../../_middleware";

async function hmacHex(secret: string, msg: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const onRequestGet: PagesFunction<Env & { EMAIL_UNSUB_SECRET?: string }, string, RequestData> = async (context) => {
  const p = new URL(context.request.url).searchParams;
  const u = p.get("u") || "", t = p.get("t") || "";
  const d = Math.max(0, Math.min(60, parseInt(p.get("d") || "0", 10) || 0));
  let ok = false;
  try {
    if (u && t && context.env.EMAIL_UNSUB_SECRET) {
      const want = await hmacHex(context.env.EMAIL_UNSUB_SECRET, u);
      if (t.toLowerCase() === want) {
        const now = Math.floor(Date.now() / 1000);
        const until = d > 0 ? now + d * 86400 : null;
        await context.env.DB.prepare("UPDATE users SET nurture_paused_until = ?1 WHERE id = ?2").bind(until, u).run();
        await context.env.DB.prepare(
          "INSERT INTO email_events (user_id, email, email_key, event, at, meta) VALUES (?1, NULL, 'quiet-probe', 'pause', ?2, ?3)",
        ).bind(u, now, d > 0 ? `paused ${d}d` : "keep going").run();
        ok = true;
      }
    }
  } catch { /* never block the page */ }
  return new Response(null, {
    status: 302,
    headers: { Location: `/email-thanks.html?t=${ok ? (d > 0 ? "paused" : "keep") : "invalid"}&d=${d}`, "Cache-Control": "private, no-store" },
  });
};
