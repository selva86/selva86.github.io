// Runs on every request. Verifies JWT if present, attaches { user, payload } to
// data so endpoint handlers can read `context.data.user` without re-verifying.
// Does NOT enforce auth; that is per-endpoint. Unauthenticated requests pass
// through with user=null.
//
// Also (Phase 1.4):
// - Rejects (treats as anon) if the session_id is in KV revoked list.
// - Upserts a row in `sessions` table on first sight of a session_id; bumps
//   last_seen_at on subsequent requests with 60s throttle (KV-backed) so we
//   don't write to D1 on every single page load.

import { extractToken, verifyJWT, type JWTPayload } from "./_lib/auth";
import { getUserById, isSessionRevoked, upsertSession, type User } from "./_lib/db";
import { parseDeviceLabel } from "./_lib/devices";
import { resolveScope, scopeCovers } from "./_lib/entitlement";
import { claimPass, PASS_TRACK } from "./_lib/pass";
import { isProActive } from "./_lib/db";
import proLessonsJson from "./_data/pro-lessons.json";
import renamedPagesJson from "./_data/renamed-pages.json";
import miniCoursesJson from "./_data/mini-courses.json";

// Slug -> roadmap track key of built lesson pages whose access is Pro
// (generated at build time by Scripts/build_lessons_tracker.py). Requests for
// these pages get their locked step content stripped server-side unless the
// requester's entitlement scope covers the lesson's track, so the paid lesson
// body never reaches a non-entitled client.
const PRO_LESSONS = proLessonsJson as Record<string, string>;
const LESSON_PREVIEW_STEPS = 2; // must match PREVIEW_STEPS in www/lesson-mode.js

// Old slug -> new slug for pages that were renamed or retired after
// publication, so the indexed URL keeps its link equity instead of 404ing.
// `_redirects` cannot do this on a `pages_build_output_dir` project (proven
// ineffective; see the deviations table in CLAUDE.md), and middleware runs
// ahead of the asset server, so this map is the only reliable 301 mechanism
// here.
//
// Keys and values are site-root-relative slugs with NO leading slash and NO
// `.html` extension. Nested paths are supported: "tools/old-tool" ->
// "tools/new-tool" redirects /tools/old-tool.html and its extensionless twin.
// Add an entry whenever a published page is renamed. Never remove one.
const RENAMED_PAGES = renamedPagesJson as Record<string, string>;

// Windowed nurture lessons (Plans/01_email_and_nurture/windowed-lessons-
// implementation-plan.md): slug -> sequence number, for BUILT lessons only
// (the factory fills slugs as lessons ship). A windowed page serves only to
// Pro, or to the user whose seq:<n> email was sent within the window; anyone
// else is 302d to the graceful expiry page. Never in PRO_LESSONS.
interface MiniCoursesData {
  window_hours: number;
  sequence: Array<{ seq: number; kind: string; slug?: string | null }>;
}
const MINI = miniCoursesJson as unknown as MiniCoursesData;
const WINDOWED: Record<string, number> = {};
for (const it of MINI.sequence) {
  if (it.kind === "lesson" && it.slug) WINDOWED[it.slug] = it.seq;
}
const WINDOW_SEC = (MINI.window_hours || 72) * 3600;

async function hmacHexMw(secret: string, msg: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Serve a windowed lesson or redirect to the expiry page. Fail-CLOSED to the
// expiry page (it is graceful and names what is open), never to a 404.
async function serveWindowedLesson(
  context: { request: Request; env: Env },
  res: Response,
  slug: string,
  seq: number,
): Promise<Response> {
  try {
    // 1. Pro (or track scope) opens everything, forever.
    const scope = await requesterScope(context);
    if (scope !== "0") return windowedOk(res);
    // 2. Resolve WHO: the signed link token (?u&t, same per-user HMAC as
    //    unsubscribe/tracking) wins over the session, so email clicks work
    //    signed-out on any device.
    const url = new URL(context.request.url);
    let uid: string | null = null;
    const tu = url.searchParams.get("u"), tt = url.searchParams.get("t");
    const secret = (context.env as { EMAIL_UNSUB_SECRET?: string }).EMAIL_UNSUB_SECRET || "";
    if (tu && tt && secret && (await hmacHexMw(secret, tu)) === tt.toLowerCase()) {
      uid = tu;
    } else {
      const token = extractToken(context.request);
      if (token) {
        const payload = await verifyJWT(token, context.env as never).catch(() => null);
        uid = payload?.sub ?? null;
      }
    }
    // 3. The window: their seq:<n> email sent within the last 72h.
    if (uid) {
      const row = await context.env.DB.prepare(
        "SELECT sent_at FROM sent_emails WHERE user_id = ?1 AND email_key = ?2",
      ).bind(uid, `seq:${seq}`).first<{ sent_at: number }>();
      if (row && Math.floor(Date.now() / 1000) - row.sent_at < WINDOW_SEC) {
        return windowedOk(res);
      }
    }
  } catch { /* fall through to the expiry page */ }
  const to = new URL(context.request.url);
  to.pathname = "/lesson-locked.html";
  to.search = `?slug=${encodeURIComponent(slug)}`;
  return new Response(null, {
    status: 302,
    headers: { Location: to.toString(), "Cache-Control": "private, no-store" },
  });
}

function windowedOk(res: Response): Response {
  const out = new Response(res.body, res);
  out.headers.set("Cache-Control", "private, no-store");
  out.headers.set("X-Robots-Tag", "noindex, nofollow");
  return out;
}

// Resolve the requester's Pro entitlement for a page request. Fail-closed:
// any error means "not Pro" (they get the stripped page; the client's
// reload-once path retries after hydration). KV-cached briefly so hot lesson
// browsing does not hit D1 on every page.
async function serveProLesson(
  context: { request: Request; env: Env },
  res: Response,
  lessonTrack: string,
): Promise<Response> {
  const scope = await requesterScope(context);
  const out = new Response(res.body, res);
  out.headers.set("Cache-Control", "private, no-store");
  if (scopeCovers(scope, lessonTrack)) return out;
  // Claim-to-start DA pass: a signed-in free user opening a gated DA-track
  // lesson for the first time claims their 30 days right here, and this very
  // page serves in full. The KV scope cache is busted so the claim takes
  // effect everywhere immediately. Replays are no-ops (claimPass guards).
  if (lessonTrack === PASS_TRACK) {
    try {
      if ((await context.env.KV.get("flag:da-pass")) === "on") {
        const token = extractToken(context.request);
        const payload = token ? await verifyJWT(token, context.env as never).catch(() => null) : null;
        if (payload?.sub) {
          const user = await getUserById(context.env.DB, payload.sub);
          if (user && !isProActive(user) && !user.pass_claimed_at) {
            if (await claimPass(context.env.DB, user.id)) {
              await context.env.KV.delete(`prolesson:${payload.sub}`).catch(() => undefined);
              return out; // their pass just started; serve the full lesson
            }
          }
        }
      }
    } catch { /* fail closed to the normal strip */ }
  }
  let stepIdx = 0;
  return new HTMLRewriter()
    .on("body", { element(el) { el.setAttribute("data-stripped", "1"); } })
    .on("section.lesson-step", {
      element(el) { if (stepIdx++ >= LESSON_PREVIEW_STEPS) el.setInnerContent("", { html: false }); },
    })
    .transform(out);
}

// Entitlement scope of the requester: "0" | "all" | <track>. Fail-closed to
// "0" on any error; KV-cached briefly (the purchase webhook deletes the cache
// key so an upgrade takes effect immediately).
async function requesterScope(context: { request: Request; env: Env }): Promise<string> {
  try {
    const token = extractToken(context.request);
    if (!token) return "0";
    const payload = await verifyJWT(token, context.env as never);
    if (!payload?.sub) return "0";
    const kvKey = `prolesson:${payload.sub}`;
    const cached = await context.env.KV.get(kvKey);
    if (cached) return cached;
    const user = await getUserById(context.env.DB, payload.sub);
    const scope = await resolveScope(context.env, user);
    await context.env.KV.put(kvKey, scope, { expirationTtl: 300 });
    return scope;
  } catch (_) {
    return "0";
  }
}

export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  CERTS: R2Bucket;
  AVATARS: R2Bucket;
  EXPORTS: R2Bucket;
  COURSE_MEDIA: R2Bucket;
  SUPABASE_JWT_SECRET?: string;   // optional; only needed for legacy HS256 tokens
  SUPABASE_URL: string;           // used to fetch JWKS for ES256 verification
  SUPABASE_WEBHOOK_SECRET: string; // shared secret for /api/webhooks/supabase
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  PADDLE_API_KEY: string;
  PADDLE_WEBHOOK_SECRET: string;
  PADDLE_CLIENT_TOKEN?: string;    // public client-side token (test_/live_) for Paddle.js checkout
  PADDLE_TEAMS_PRICE_ID?: string;  // teams per-seat price id, used by checkout + webhook matching
  PADDLE_PRICE_SINGLE_MONTH?: string; // individual-plan price ids, surfaced via /api/_auth-config
  PADDLE_PRICE_SINGLE_YEAR?: string;
  PADDLE_PRICE_AA_MONTH?: string;
  PADDLE_PRICE_AA_YEAR?: string;
  PADDLE_PRICE_LIFETIME?: string;
  RAZORPAY_KEY_ID: string;
  RAZORPAY_KEY_SECRET: string;
  RAZORPAY_WEBHOOK_SECRET: string;
  ZOHO_AUTH_TOKEN: string;
  ZOHO_LIST_KEY: string;
  ZOHO_CAMPAIGNS_API_DOMAIN: string;     // e.g. https://www.zohoapis.in
  ZOHO_ZEPTOMAIL_TOKEN: string;
  ZOHO_ZEPTOMAIL_SENDER: string;
  SENTRY_DSN: string;
  ENVIRONMENT: string;
  SITE_ORIGIN: string;
}

export interface RequestData {
  user: User | null;
  payload: JWTPayload | null;
  session_id: string | null;
  // PagesFunction's Data generic is constrained to Record<string, unknown>;
  // without this index signature every endpoint using RequestData raises
  // TS2344. Type-only; no runtime effect.
  [key: string]: unknown;
}

const TOUCH_THROTTLE_SEC = 60; // skip session upsert if we touched it < 60s ago

export const onRequest: PagesFunction<Env, string, RequestData> = async (context) => {
  // --- Phase 8: block source/config files from being served ---
  // This legacy pages_build_output_dir project ignores .assetsignore, and
  // _redirects cannot 404 files that exist as static assets. Middleware runs
  // ahead of the asset server, so a 404 here is the reliable block.
  // CAREFUL: /posts/ is the user-facing Compendium, so only *.md under it is
  // blocked here, never the directory or its generated HTML. Same treatment for
  // /lessons/ (interactive lesson markdown source) and the _lessons/ fragment
  // dir: source must 404 while the built /<slug>.html lesson pages serve 200.
  const path = new URL(context.request.url).pathname;
  const BLOCK_DIRS = /^\/(?:_posts|_lessons|_build|Scripts|Plan|Plans|_archive|_mocks|post_plans|workers)(?:\/|$)/i;
  const BLOCK_FILES = /^\/(?:wrangler\.toml|schema\.sql|package\.json|package-lock\.json|tsconfig\.json|BUILD-PHASE-0\.md|post_queue\.json|curriculum-status\.json|pseo-status\.json|lessons-status\.json|\.dev\.vars(?:\.example)?|\.gitignore|\.claudecodeignore|CNAME)$/i;
  const BLOCK_SOURCE_MD = /^\/(?:posts|lessons)\/.+\.md$/i;
  if (BLOCK_DIRS.test(path) || BLOCK_FILES.test(path) || BLOCK_SOURCE_MD.test(path)) {
    return new Response("Not Found", { status: 404 });
  }

  // --- 301 renamed pages to their new slug ---
  // Must run before the .html rewrite below, which would otherwise hand the
  // old path to the asset server (404 for a deleted page, or a stale 200 for
  // one still on disk). Both `/Old.html` and the extensionless `/Old` twin
  // redirect to the canonical `/New.html`. Nested paths (`/tools/Old.html`)
  // are matched too, so the key may contain slashes.
  // Own-property lookup only: a bare `RENAMED_PAGES[key]` also matches
  // inherited Object members, so `/constructor.html` would 301 to garbage.
  const renameKey = path.endsWith(".html") ? path.slice(1, -".html".length) : path.slice(1);
  if (renameKey && Object.prototype.hasOwnProperty.call(RENAMED_PAGES, renameKey)) {
    const to = new URL(context.request.url);
    to.pathname = "/" + RENAMED_PAGES[renameKey] + ".html";
    return new Response(null, {
      status: 301,
      headers: { Location: to.toString(), "Cache-Control": "public, max-age=86400" },
    });
  }

  // --- Phase 8: preserve .html URLs (serve 200, no 308 redirect to clean) ---
  // CF Pages default 308-redirects /X.html -> /X. All ~1,300 pages are indexed
  // and canonical-tagged as .html, so we keep .html serving 200 by rewriting
  // the request to the clean path (which the asset server serves 200) and
  // returning that response at the original .html URL. No loop: context.next()
  // goes to the asset server, not back through this middleware.
  if (path.endsWith(".html")) {
    const url = new URL(context.request.url);
    url.pathname = path.endsWith("/index.html")
      ? path.slice(0, -"index.html".length) // /foo/index.html -> /foo/ ; /index.html -> /
      : path.slice(0, -".html".length);      // /foo.html -> /foo
    const res = await context.next(new Request(url.toString(), context.request));

    // --- Pro lesson enforcement (server-side) ---
    // The client paywall is UX, not security: the full lesson body ships in
    // the HTML. For Pro lessons, strip every step beyond the preview unless
    // the requester is Pro. Responses depend on auth, so they must never be
    // cached or served stale across entitlement states.
    const lessonSlug = path.slice(1, -".html".length);
    if (!path.slice(1).includes("/") && WINDOWED[lessonSlug] !== undefined) {
      return serveWindowedLesson(context, res, lessonSlug, WINDOWED[lessonSlug]);
    }
    if (!path.slice(1).includes("/") && PRO_LESSONS[lessonSlug]) {
      return serveProLesson(context, res, PRO_LESSONS[lessonSlug]);
    }

    // Restore edge/browser caching for HTML. Worker responses default to
    // no-store; pages are static shells (auth/personalization is client-side
    // via /api/me, which stays no-store), so a short TTL + stale-while-
    // revalidate is safe and balances freshness against frequent republishes.
    const out = new Response(res.body, res);
    out.headers.set("Cache-Control", "public, max-age=300, stale-while-revalidate=86400");
    return out;
  }

  // Extensionless twin of a Pro lesson page (/X serves alongside /X.html on
  // this project) must get the identical treatment or the strip is trivially
  // bypassed by dropping the extension.
  const cleanSlug = path.slice(1);
  if (context.request.method === "GET" && !cleanSlug.includes("/") && !cleanSlug.includes(".") && WINDOWED[cleanSlug] !== undefined) {
    const res = await context.next();
    return serveWindowedLesson(context, res, cleanSlug, WINDOWED[cleanSlug]);
  }
  if (context.request.method === "GET" && !cleanSlug.includes("/") && !cleanSlug.includes(".") && PRO_LESSONS[cleanSlug]) {
    const res = await context.next();
    return serveProLesson(context, res, PRO_LESSONS[cleanSlug]);
  }

  context.data.user = null;
  context.data.payload = null;
  context.data.session_id = null;

  const token = extractToken(context.request);
  if (!token) return context.next();

  const payload = await verifyJWT(token, context.env);
  if (!payload?.sub) return context.next();

  // Derive session_id. Newer Supabase JWTs include it as a claim; older
  // configs don't, so fall back to a deterministic synthetic id so the
  // sessions UI still has one row per JWT.
  const sessionId = (payload.session_id as string | undefined)
    || `synth:${payload.sub}:${payload.iat ?? 0}`;

  // Hard revocation check: if this session is in the KV revoke list, treat
  // as anon. The Supabase JWT itself stays valid until its natural expiry
  // (~1h) but our app refuses it.
  if (await isSessionRevoked(context.env.KV, sessionId)) {
    return context.next();
  }

  context.data.payload = payload;
  context.data.session_id = sessionId;
  context.data.user = await getUserById(context.env.DB, payload.sub);

  // Throttled session upsert: avoid 1 D1 write per page load by skipping if
  // we touched this session within the last 60s. KV is the throttle store
  // (cheap reads, eventual consistency is fine).
  try {
    const touchKey = `session-touched:${sessionId}`;
    const touched = await context.env.KV.get(touchKey);
    if (!touched) {
      const ua = context.request.headers.get("user-agent") || "";
      await upsertSession(context.env.DB, {
        session_id: sessionId,
        user_id: payload.sub,
        device: parseDeviceLabel(ua),
        user_agent: ua,
        expires_at: payload.exp ?? Math.floor(Date.now() / 1000) + 3600,
      });
      await context.env.KV.put(touchKey, "1", { expirationTtl: TOUCH_THROTTLE_SEC });
    }
  } catch (e) {
    // Don't block the request if session bookkeeping fails.
    console.error("[middleware] session upsert failed:", (e as Error).message);
  }

  return context.next();
};
