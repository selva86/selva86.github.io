// Shared protection for the public, unauthenticated forms: /api/contact,
// /api/feedback and /api/waitlist.
//
// WHY THIS FILE EXISTS. Three endpoints each answered "is this request from
// our own site?" with their own copy of the same helper, and the copies
// disagreed. feedback.ts and waitlist.ts rejected a missing Origin header;
// contact.ts wrote the test as `if (origin && origin !== SITE_ORIGIN)`, so a
// request with NO Origin header skipped the check entirely and was accepted.
// A curl POST sends no Origin, which made /api/contact an unauthenticated
// send-mail endpoint. The same hand-rolled comparison was also too strict in
// the other direction: it rejected www.r-statistics.co and every
// *.r-statistics-co.pages.dev preview, so the contact form was broken on
// branch deploys. One shared helper removes both faults at once.
//
// WHAT AN ATTACKER CAN AND CANNOT FORGE. Probed against production on
// 2026-11-23 while a bot was submitting to both forms:
//   - no Origin on /api/feedback      -> 403 bad_origin   (guard works)
//   - forged Origin on /api/feedback  -> 400 bad_message  (guard passed)
// So the Origin header alone is already being defeated: it is one curl flag.
// Origin is still worth checking because it stops a drive-by cross-site POST
// from a real browser, but it is a lock on a door, not a wall. The only
// control here that a script cannot satisfy by adding a header is a Turnstile
// token, because that is minted by Cloudflare after a real browser runs a
// challenge. Everything else on this page raises cost; Turnstile sets a floor.

import type { Env } from "../_middleware";
import { jsonError } from "./errors";

const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/* Accept submissions only from our own origins: prod apex, www, and the
   Cloudflare preview deploys. Rejecting a null/absent Origin is the whole
   point, so the `!origin` branch returns false and never falls through. */
export function originAllowed(origin: string | null, env: Env): boolean {
  if (!origin) return false;
  let host: string;
  try {
    host = new URL(origin).host.toLowerCase();
  } catch {
    return false;
  }
  if (host === "r-statistics.co" || host === "www.r-statistics.co") return true;
  if (host.endsWith(".r-statistics-co.pages.dev")) return true; // branch/preview deploys
  try {
    if (env.SITE_ORIGIN && host === new URL(env.SITE_ORIGIN).host.toLowerCase()) return true;
  } catch {
    /* a malformed SITE_ORIGIN must not throw a request away */
  }
  return false;
}

/* Fetch metadata headers. A browser `fetch()` to our own origin always sends
   Sec-Fetch-Site: same-origin (or same-site from www), and no version of curl
   sends them unless told to. This is deliberately a soft signal: it is here to
   make the cheapest possible script fail, not to be relied on. A bot that
   forges Origin can forge these too, which is exactly why the strict mode
   below exists. */
export function browserShaped(request: Request): boolean {
  const site = request.headers.get("Sec-Fetch-Site");
  if (site && site !== "same-origin" && site !== "same-site") return false;
  const mode = request.headers.get("Sec-Fetch-Mode");
  if (mode && mode !== "cors" && mode !== "no-cors" && mode !== "navigate") return false;
  /* Absent Sec-Fetch-* is tolerated: a few old browsers and in-app webviews
     omit them, and silently dropping a real person's bug report to catch a
     bot that could forge the header anyway is a bad trade. A User-Agent,
     however, every real client sends. */
  const ua = request.headers.get("User-Agent") || "";
  return ua.length >= 8;
}

export interface TurnstileResult {
  ok: boolean;
  /** true when no secret is configured, so nothing was checked. */
  skipped: boolean;
  reason: string;
}

/* Server-side verification of a Turnstile token.
   Fails OPEN on a network error talking to Cloudflare: a siteverify outage
   must not take the contact form down with it. Fails CLOSED on a token that
   is present and genuinely invalid, which is the case that matters. */
export async function verifyTurnstile(
  env: Env,
  token: string,
  ip: string,
): Promise<TurnstileResult> {
  const secret = env.TURNSTILE_SECRET;
  if (!secret) return { ok: true, skipped: true, reason: "no_secret" };
  if (!token) return { ok: false, skipped: false, reason: "missing_token" };
  try {
    const form = new FormData();
    form.append("secret", secret);
    form.append("response", token);
    if (ip && ip !== "0.0.0.0" && ip !== "unknown") form.append("remoteip", ip);
    const res = await fetch(SITEVERIFY, { method: "POST", body: form });
    const body = (await res.json()) as { success?: boolean; "error-codes"?: string[] };
    if (body.success) return { ok: true, skipped: false, reason: "verified" };
    return { ok: false, skipped: false, reason: (body["error-codes"] || ["rejected"]).join(",").slice(0, 120) };
  } catch (e) {
    console.warn(`[form-guard] siteverify unreachable: ${(e as Error).message}`);
    return { ok: true, skipped: true, reason: "siteverify_unreachable" };
  }
}

/* Whether a token is REQUIRED rather than merely verified when supplied.
   Off by default on purpose. /www/feedback-widget.js is served immutable for a
   year, so until the cached copies age out there are real browsers running a
   widget that cannot send a token, and mandating one would reject their
   feedback. While the flag is off, a supplied token is still verified and a
   forged one is still refused. Flip it with:
     wrangler kv key put --remote --namespace-id <id> flag:form-strict-turnstile on */
export async function strictTurnstile(env: Env): Promise<boolean> {
  try {
    return (await env.KV.get("flag:form-strict-turnstile")) === "on";
  } catch {
    return false;
  }
}

export interface ClientMeta {
  ip: string;
  ua: string;
  country: string | null;
  /** Cloudflare request id. Pairs an inbox notice with an edge log line. */
  ray: string | null;
  asn: number | null;
}

/* The identifying facts about a submission. Neither form recorded any of
   these, so a repeat offender could not be named, counted or blocked: the
   nine probes on 2026-11-23 are indistinguishable from nine people. */
export function clientMeta(request: Request): ClientMeta {
  const cf = (request as Request & { cf?: { asn?: number } }).cf;
  return {
    ip: request.headers.get("CF-Connecting-IP") || "0.0.0.0",
    ua: (request.headers.get("User-Agent") || "").slice(0, 300),
    country: request.headers.get("CF-IPCountry") || null,
    ray: request.headers.get("CF-Ray") || null,
    asn: typeof cf?.asn === "number" ? cf.asn : null,
  };
}

export interface GuardOutcome {
  /** Non-null means stop and return this response. */
  deny: Response | null;
  /** How the token check went, for the audit row. */
  turnstile: string;
}

/* STAGE 1: the free checks. Origin and client shape cost nothing, so they run
   before the body is trusted and before any subrequest is spent. */
export function guardHeaders(request: Request, env: Env): Response | null {
  if (!originAllowed(request.headers.get("Origin"), env)) {
    return jsonError(403, "bad_origin", "Cross-origin requests are not allowed.");
  }
  if (!browserShaped(request)) {
    return jsonError(403, "bad_client", "This request did not come from a browser.");
  }
  return null;
}

/* STAGE 2: the challenge. Deliberately a separate call so each endpoint can
   run its own per-IP rate limit in between: siteverify is a subrequest, and a
   flooder should be turned away by the rate limiter before it costs us one. */
export async function guardChallenge(
  request: Request,
  env: Env,
  token: string,
): Promise<GuardOutcome> {
  const ip = request.headers.get("CF-Connecting-IP") || "0.0.0.0";
  const strict = await strictTurnstile(env);
  const t = await verifyTurnstile(env, token, ip);
  if (!t.ok && (strict || t.reason !== "missing_token")) {
    /* A present-but-invalid token is always fatal; a missing one only when
       strict mode is on. A replayed or expired token lands here. */
    return {
      deny: jsonError(403, "challenge_failed", "Please complete the verification and try again."),
      turnstile: t.reason,
    };
  }
  return { deny: null, turnstile: t.skipped ? t.reason : t.ok ? "verified" : `tolerated_${t.reason}` };
}
