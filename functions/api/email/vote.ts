// GET /api/email/vote?u=<uid>&k=<email_key>&t=<hmac>&v=<up|down|reason:...>
//
// The one-tap footer vote on the daily lesson emails ("was today worth your
// time?") and the optional follow-up reason from the thank-you page. Writes
// an email_events row (event = 'vote', meta = the value) keyed to the exact
// email, then 302s to /email-thanks.html. Never a click event: these links
// bypass the click tracker on purpose so votes do not inflate CTR. Invalid
// signatures still land on the thank-you page; nothing is recorded.

import type { Env, RequestData } from "../../_middleware";

const VALUES = new Set(["up", "down", "reason:too_easy", "reason:too_hard", "reason:not_my_topic", "reason:loved_it", "reason:too_long"]);

async function hmacHex(secret: string, msg: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const onRequestGet: PagesFunction<Env & { EMAIL_UNSUB_SECRET?: string }, string, RequestData> = async (context) => {
  const p = new URL(context.request.url).searchParams;
  const u = p.get("u") || "", k = (p.get("k") || "").slice(0, 60), t = p.get("t") || "", v = p.get("v") || "";
  let ok = false;
  try {
    if (u && k && t && VALUES.has(v) && context.env.EMAIL_UNSUB_SECRET) {
      const want = await hmacHex(context.env.EMAIL_UNSUB_SECRET, u);
      if (t.toLowerCase() === want) {
        const now = Math.floor(Date.now() / 1000);
        // One up/down per (user, email): a second tap replaces the first.
        if (!v.startsWith("reason:")) {
          await context.env.DB.prepare(
            "DELETE FROM email_events WHERE user_id = ?1 AND email_key = ?2 AND event = 'vote' AND meta IN ('up','down')",
          ).bind(u, k).run();
        }
        await context.env.DB.prepare(
          "INSERT INTO email_events (user_id, email, email_key, event, at, meta) VALUES (?1, NULL, ?2, 'vote', ?3, ?4)",
        ).bind(u, k, now, v).run();
        ok = true;
      }
    }
  } catch { /* never block the page */ }
  const q = new URLSearchParams({ t: ok ? "vote" : "invalid", v, k, u, s: t });
  return new Response(null, {
    status: 302,
    headers: { Location: `/email-thanks.html?${q.toString()}`, "Cache-Control": "private, no-store" },
  });
};
