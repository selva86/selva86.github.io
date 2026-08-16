// Admin email-copy editor (nurture sequence only; lifecycle templates stay
// code-managed by design - their bodies carry conditional logic).
//
//   GET     -> every seq email: subject/preheader/body in effect, default vs
//              edited, sendable state. Feeds the dashboard editor.
//   POST    -> save an override {key:"seq:<n>", subject?, preheader, body}.
//              Validated hard (see below), then written to KV; the very next
//              render - preview, test, or real send - uses it. No deploy.
//   DELETE  -> ?key=seq:<n> reverts to the shipped default.
//
// Validation is the glitch-proofing: a saved body MUST contain {url} exactly
// (the lesson link), may only use known tokens, and every field is length-
// capped. A bad save is rejected with a reason, never stored.

import type { Env, RequestData } from "../../_middleware";
import { json, err401, err403, jsonError } from "../../_lib/errors";
import { SEQ_ITEMS, defaultSeqCopy, getSeqCopy } from "../../_lib/nurture";
import { LIFECYCLE, defaultLifecycleCopy, lifecycleTokens } from "../../_lib/email-templates";

const DEFAULT_ADMIN = "selva86@gmail.com";
const ALLOWED_TOKENS = new Set(["first_name", "url"]);

function isAdmin(context: { data: RequestData; env: unknown }): boolean {
  const u = context.data.user;
  const admin = (context.env as { ADMIN_EMAIL?: string }).ADMIN_EMAIL || DEFAULT_ADMIN;
  return !!u && (u.email || "").toLowerCase() === admin.toLowerCase();
}

function validateShape(subject: unknown, preheader: unknown, body: unknown): string | null {
  if (subject !== undefined && subject !== null && subject !== "") {
    if (typeof subject !== "string" || subject.length > 90) return "Subject must be text, 90 characters max.";
    if (/[\r\n]/.test(subject)) return "Subject cannot contain line breaks.";
  }
  if (typeof preheader !== "string" || !preheader.trim() || preheader.length > 140) {
    return "Preheader is required, 140 characters max.";
  }
  if (typeof body !== "string" || !body.trim() || body.length > 6000) {
    return "Body is required, 6000 characters max.";
  }
  return null;
}

// Sequence emails: fixed token set, {url} mandatory (the lesson link).
function validate(subject: unknown, preheader: unknown, body: unknown): string | null {
  const base = validateShape(subject, preheader, body);
  if (base) return base;
  const text = String(body);
  if (!text.includes("{url}")) return "The body must contain {url} - that is the lesson link.";
  const tokens = [...text.matchAll(/\{([a-z_]+)\}/g)].map((m) => m[1]);
  for (const t of tokens) {
    if (!ALLOWED_TOKENS.has(t)) return `Unknown token {${t}}. Allowed: {first_name}, {url}.`;
  }
  return null;
}

// Lifecycle emails: each template declares its own allowed + required tokens.
function validateWith(
  subject: unknown, preheader: unknown, body: unknown,
  allowed: Set<string>, required: string[],
): string | null {
  const base = validateShape(subject, preheader, body);
  if (base) return base;
  const text = String(body);
  const tokens = [...text.matchAll(/\{([a-z_]+)\}/g)].map((mm) => mm[1]);
  for (const t of tokens) {
    if (!allowed.has(t)) return `Unknown token {${t}}. Allowed: ${[...allowed].map((x) => `{${x}}`).join(", ")}.`;
  }
  for (const req of required) {
    if (!text.includes(`{${req}}`)) return `The body must contain {${req}} - that link is how the reader acts on this email.`;
  }
  return null;
}

export const onRequestGet: PagesFunction<Env, string, RequestData> = async (context) => {
  if (!context.data.user) return err401();
  if (!isAdmin(context)) return err403("Restricted.");
  const overrides = new Set<string>();
  try {
    const listed = await context.env.KV.list({ prefix: "emailcopy:seq:" });
    for (const k of listed.keys) overrides.add(k.name.slice("emailcopy:".length));
  } catch { /* list failure just means no edited chips */ }
  const items = [];
  for (const seqStr of Object.keys(SEQ_ITEMS)) {
    const seq = parseInt(seqStr, 10);
    const it = SEQ_ITEMS[seq];
    const def = defaultSeqCopy(seq);
    if (!def) continue; // no copy written yet - not editable, not sendable
    const eff = await getSeqCopy(context.env.KV, seq);
    items.push({
      key: `seq:${seq}`, seq, kind: it.kind, course: it.course ?? null,
      built: it.kind === "public" ? true : !!it.slug,
      // Where this email's {url} points (bare path; the sender adds the
      // personal token for windowed lessons). Null = lesson not built yet.
      url: it.kind === "public" ? `/${it.source}.html` : (it.slug ? `/${it.slug}.html` : null),
      subject: (eff && eff.subject) || it.subject,
      default_subject: it.subject,
      preheader: eff?.preheader ?? def.preheader,
      body: eff?.body ?? def.body,
      edited: overrides.has(`seq:${seq}`),
    });
  }
  items.sort((a, b) => a.seq - b.seq);
  const lifecycle = [];
  for (const template of Object.keys(LIFECYCLE)) {
    const def = defaultLifecycleCopy(template);
    if (!def) continue;
    let ovr = null;
    try { const raw = await context.env.KV.get(`emailcopy:${template}`); if (raw) ovr = JSON.parse(raw); } catch { /* none */ }
    const tok = lifecycleTokens(template);
    lifecycle.push({
      key: template, kind: "lifecycle",
      subject: ovr?.subject || def.subject,
      preheader: ovr?.preheader || def.preheader,
      body: ovr?.body || def.body,
      edited: !!ovr,
      allowed_tokens: tok?.allowed ?? [], required_tokens: tok?.required ?? [],
    });
  }
  return json({ items, lifecycle });
};

export const onRequestPost: PagesFunction<Env, string, RequestData> = async (context) => {
  if (!context.data.user) return err401();
  if (!isAdmin(context)) return err403("Restricted.");
  let b: { key?: unknown; subject?: unknown; preheader?: unknown; body?: unknown };
  try { b = await context.request.json(); } catch { return jsonError(400, "bad_body", "Invalid JSON"); }
  const key = String(b.key || "");
  const m = key.match(/^seq:(\d+)$/);
  const isLifecycle = !!LIFECYCLE[key];
  if (!isLifecycle) {
    if (!m || !SEQ_ITEMS[parseInt(m[1], 10)]) return jsonError(404, "no_email", "Unknown email key");
    if (!defaultSeqCopy(parseInt(m[1], 10))) return jsonError(400, "no_default", "No shipped copy exists for this seq yet");
  }
  let err: string | null;
  if (isLifecycle) {
    const tok = lifecycleTokens(key)!;
    err = validateWith(b.subject, b.preheader, b.body, new Set(tok.allowed), tok.required);
  } else {
    err = validate(b.subject, b.preheader, b.body);
  }
  if (err) return jsonError(400, "invalid_copy", err);
  const record: Record<string, string> = { preheader: String(b.preheader).trim(), body: String(b.body) };
  if (b.subject && String(b.subject).trim()) record.subject = String(b.subject).trim();
  await context.env.KV.put(`emailcopy:${key}`, JSON.stringify(record));
  await context.env.DB.prepare(
    "INSERT INTO email_events (user_id, email, email_key, event, at, meta) VALUES (?1, ?2, ?3, 'copy_edited', ?4, ?5)",
  ).bind(context.data.user!.id, context.data.user!.email, key, Math.floor(Date.now() / 1000), "dashboard edit").run();
  return json({ saved: true, key, edited: true });
};

export const onRequestDelete: PagesFunction<Env, string, RequestData> = async (context) => {
  if (!context.data.user) return err401();
  if (!isAdmin(context)) return err403("Restricted.");
  const key = new URL(context.request.url).searchParams.get("key") || "";
  if (!/^seq:\d+$/.test(key) && !LIFECYCLE[key]) return jsonError(400, "bad_key", "Bad key");
  await context.env.KV.delete(`emailcopy:${key}`);
  return json({ reverted: true, key });
};
