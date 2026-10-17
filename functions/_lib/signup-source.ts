// Where an account came from, saved once onto users.signup_gate / signup_slug.
//
// The sign-in surfaces (signin.html, the sign-in modal) know the page and the
// trigger, but until 2026-10-18 that only reached the admin "new signup" email
// through a one-hour KV key, so 14 of 1,164 accounts had a recorded source.
// The contact centre's door table and the welcome email both read these two
// columns, so both callers of this file write them:
//   - /api/me/signup-context  (OAuth, and magic links opened in the same browser)
//   - the Supabase webhook    (magic links, from user_metadata, any device)
//
// Set once (signup_gate IS NULL) and only for an account created in the last
// two hours: a returning member who signs in again parks a source too, and
// that sign-in is not where they signed up. The exercise backfill may still
// upgrade "browsing" to "exercise" when it carries real solves, because a
// solve is the more specific door.

import { hubExists, isLessonHub } from "./exercises";

export interface SignupSource { page?: string; trigger?: string; next?: string }

const FRESH = 2 * 3600;
const OWN_HOST = /(^|\.)r-statistics\.co$|\.pages\.dev$|^localhost$|^127\.0\.0\.1$/;

// "/Some-Lesson.html?x=1" or "https://r-statistics.co/roadmap/data-analyst.html"
// -> "Some-Lesson" / "roadmap/data-analyst". Other sites (a search engine as
// the referrer) and the sign-in page itself are not a door.
export function slugOf(raw: string | undefined | null): string | null {
  if (!raw) return null;
  let path: string;
  try {
    const u = new URL(raw, "https://r-statistics.co");
    if (!OWN_HOST.test(u.hostname)) return null;
    path = u.pathname;
  } catch { return null; }
  const s = path.replace(/^\/+/, "").replace(/\/+$/, "").replace(/\.html?$/i, "");
  if (s === "signin") return null;
  return (s || "index").slice(0, 200);
}

export function classifySignup(src: SignupSource): { gate: string; slug: string | null } | null {
  const trig = (src.trigger || "").toLowerCase();
  const next = slugOf(src.next), page = slugOf(src.page);
  if (!next && !page && !trig) return null;
  // A lesson page sends its readers to sign-in with next = the lesson.
  for (const s of [next, page]) if (s && isLessonHub(s)) return { gate: "lesson", slug: s };
  if (trig === "enroll" || next === "pricing") return { gate: "pricing", slug: page || "pricing" };
  if (trig === "optin-bar") return { gate: "optin", slug: page };
  // An exercise hub stays "browsing" here: the backfill turns it into
  // "exercise" only when the visitor really saved a solve.
  return { gate: "browsing", slug: (next && hubExists(next) ? next : page) || next };
}

export async function recordSignupSource(DB: D1Database, userId: string, src: SignupSource): Promise<void> {
  const c = classifySignup(src);
  if (!c || !userId) return;
  const now = Math.floor(Date.now() / 1000);
  await DB.prepare(
    "UPDATE users SET signup_gate = ?1, signup_slug = ?2 WHERE id = ?3 AND signup_gate IS NULL AND created_at >= ?4",
  ).bind(c.gate, c.slug, userId, now - FRESH).run();
}
