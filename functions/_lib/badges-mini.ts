// Mini-course badges (windowed-lessons plan, Phase B).
//
// Completion is DERIVED, never stored: a course is complete for a user when
// every part is a BUILT lesson and every gated exercise in every part has a
// passing attempt. The only stored artifact is the minted badge row, which
// exists for the public verify page and a stable earned_at.

import miniCoursesJson from "../_data/mini-courses.json";
import manifestJson from "../_data/exercise-manifest.json";

interface Part { seq: number; part: number; subject: string; slug?: string | null; status: string }
interface Course { title: string; badge: string; parts: Part[] }
interface Mini { courses: Record<string, Course> }
const MINI = miniCoursesJson as unknown as Mini;
const HUBS = (manifestJson as unknown as { hubs: Record<string, Record<string, string>> }).hubs;

export function courseDef(courseId: string): (Course & { id: string }) | null {
  const c = MINI.courses[courseId];
  return c ? { id: courseId, ...c } : null;
}

export async function courseComplete(
  db: D1Database, userId: string, courseId: string,
): Promise<{ complete: boolean; parts_done: number; parts_total: number }> {
  const c = MINI.courses[courseId];
  if (!c) return { complete: false, parts_done: 0, parts_total: 0 };
  let done = 0;
  let allBuilt = true;
  for (const p of c.parts) {
    if (p.status !== "built" || !p.slug) { allBuilt = false; continue; }
    const ids = Object.keys(HUBS[p.slug] || {});
    if (!ids.length) { done += 1; continue; } // nothing gated = nothing to pass
    const row = await db.prepare(
      `SELECT COUNT(DISTINCT exercise_id) AS n FROM exercise_attempts
       WHERE user_id = ?1 AND hub_slug = ?2 AND passed = 1`,
    ).bind(userId, p.slug).first<{ n: number }>();
    if ((row?.n ?? 0) >= ids.length) done += 1;
  }
  return { complete: allBuilt && done === c.parts.length, parts_done: done, parts_total: c.parts.length };
}

function randomId(): string {
  const b = new Uint8Array(9);
  crypto.getRandomValues(b);
  return [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

export interface MintedBadge {
  badge: string; title: string; public_id: string; earned_at: number; newly_minted: boolean;
}

export async function mintBadge(
  db: D1Database, userId: string, courseId: string,
): Promise<MintedBadge | null> {
  const c = MINI.courses[courseId];
  if (!c) return null;
  const now = Math.floor(Date.now() / 1000);
  const pid = randomId();
  const ins = await db.prepare(
    "INSERT OR IGNORE INTO badges_earned (user_id, badge, public_id, earned_at) VALUES (?1, ?2, ?3, ?4)",
  ).bind(userId, c.badge, pid, now).run();
  const row = await db.prepare(
    "SELECT public_id, earned_at FROM badges_earned WHERE user_id = ?1 AND badge = ?2",
  ).bind(userId, c.badge).first<{ public_id: string; earned_at: number }>();
  if (!row) return null;
  return {
    badge: c.badge, title: c.title, public_id: row.public_id, earned_at: row.earned_at,
    newly_minted: (ins.meta?.changes ?? 0) === 1,
  };
}

export function linkedInAddUrl(title: string, publicId: string, earnedAt: number): string {
  const d = new Date(earnedAt * 1000);
  const verify = `https://r-statistics.co/badge/${publicId}`;
  const q = new URLSearchParams({
    startTask: "CERTIFICATION_NAME",
    name: `${title} (mini course badge)`,
    organizationName: "r-statistics.co",
    issueYear: String(d.getUTCFullYear()),
    issueMonth: String(d.getUTCMonth() + 1),
    certUrl: verify,
    certId: publicId,
  });
  return `https://www.linkedin.com/profile/add?${q.toString()}`;
}
