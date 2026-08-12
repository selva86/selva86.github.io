// POST /api/webhooks/zeptomail?key=<secret> - delivery/engagement events.
//
// ZeptoMail webhooks (Mail Agent -> Webhooks) POST here for opens, clicks,
// bounces. Auth = shared secret in the URL (configure the full URL including
// ?key= in the ZeptoMail dashboard; value = ZEPTOMAIL_WEBHOOK_SECRET).
//
// Parsing is deliberately defensive: ZeptoMail's payload shape has varied
// (event_name arrays, nested event_message), so this extracts the event type
// and recipient from several candidate locations and stores a raw slice in
// meta. Rows land in email_events; a hard bounce or complaint flips
// users.email_status, which the brain treats as full suppression.

import type { Env, RequestData } from "../../_middleware";
import { json, jsonError, err401 } from "../../_lib/errors";

function timingSafeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let x = 0;
  for (let i = 0; i < a.length; i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return x === 0;
}

// Map ZeptoMail event names onto our canonical set.
function canonicalEvent(raw: string): string | null {
  const s = raw.toLowerCase();
  if (s.includes("hardbounce")) return "bounce";
  if (s.includes("softbounce")) return "soft_bounce";
  if (s.includes("open")) return "open";
  if (s.includes("click")) return "click";
  if (s.includes("delivered") || s.includes("delivery")) return "delivered";
  if (s.includes("spam") || s.includes("complaint") || s.includes("abuse")) return "complaint";
  if (s.includes("unsubscribe")) return "unsubscribe";
  return null;
}

// Walk the payload for the first plausible email address.
function findEmail(node: unknown, depth = 0): string | null {
  if (depth > 6 || node == null) return null;
  if (typeof node === "string") {
    const m = node.match(/[^\s@"<>]+@[^\s@"<>]+\.[^\s@"<>]{2,}/);
    return m ? m[0].toLowerCase() : null;
  }
  if (Array.isArray(node)) {
    for (const v of node) { const r = findEmail(v, depth + 1); if (r) return r; }
    return null;
  }
  if (typeof node === "object") {
    const o = node as Record<string, unknown>;
    // Prefer explicit recipient-ish keys before a blind walk.
    for (const k of ["email_address", "address", "recipient", "to", "email"]) {
      if (k in o) { const r = findEmail(o[k], depth + 1); if (r) return r; }
    }
    for (const v of Object.values(o)) { const r = findEmail(v, depth + 1); if (r) return r; }
  }
  return null;
}

function findEventNames(payload: unknown): string[] {
  const out: string[] = [];
  const walk = (node: unknown, depth: number) => {
    if (depth > 5 || node == null) return;
    if (Array.isArray(node)) { node.forEach((v) => walk(v, depth + 1)); return; }
    if (typeof node === "object") {
      const o = node as Record<string, unknown>;
      for (const k of ["event_name", "event", "event_type"]) {
        const v = o[k];
        if (typeof v === "string") out.push(v);
        if (Array.isArray(v)) v.forEach((x) => typeof x === "string" && out.push(x));
      }
      Object.values(o).forEach((v) => walk(v, depth + 1));
    }
  };
  walk(payload, 0);
  return out;
}

export const onRequestPost: PagesFunction<Env & { ZEPTOMAIL_WEBHOOK_SECRET?: string }, string, RequestData> = async (context) => {
  const secret = context.env.ZEPTOMAIL_WEBHOOK_SECRET || "";
  const key = new URL(context.request.url).searchParams.get("key") || "";
  if (!secret || !timingSafeEq(key, secret)) return err401();

  let payload: unknown;
  try { payload = await context.request.json(); } catch { return jsonError(400, "bad_body", "Invalid JSON"); }

  const now = Math.floor(Date.now() / 1000);
  const email = findEmail(payload);
  const events = findEventNames(payload).map(canonicalEvent).filter(Boolean) as string[];
  const meta = JSON.stringify(payload).slice(0, 400);

  if (!events.length) {
    // Unknown shape: log it so the dashboard shows something to debug.
    await context.env.DB.prepare(
      "INSERT INTO email_events (user_id, email, email_key, event, at, meta) VALUES (NULL, ?1, NULL, 'unknown', ?2, ?3)",
    ).bind(email, now, meta).run();
    return json({ ok: true, recorded: 0 });
  }

  let userId: string | null = null;
  if (email) {
    const row = await context.env.DB.prepare("SELECT id FROM users WHERE lower(email) = ?1")
      .bind(email).first<{ id: string }>();
    userId = row?.id ?? null;
  }

  for (const ev of events) {
    await context.env.DB.prepare(
      "INSERT INTO email_events (user_id, email, email_key, event, at, meta) VALUES (?1, ?2, NULL, ?3, ?4, ?5)",
    ).bind(userId, email, ev, now, meta).run();
    if (userId && (ev === "bounce" || ev === "complaint")) {
      await context.env.DB.prepare("UPDATE users SET email_status = ?1 WHERE id = ?2")
        .bind(ev === "bounce" ? "bounced" : "complained", userId).run();
    }
  }
  return json({ ok: true, recorded: events.length });
};
