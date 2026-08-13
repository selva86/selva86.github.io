// GET /api/nurture/catalog - the public mini-course catalog (titles, part
// subjects, built/planned status, slugs of built lessons). No auth: nothing
// here is secret; the lessons themselves are gated by the middleware window.
// Feeds the dashboard catalog and the lesson-locked page.

import type { Env, RequestData } from "../../_middleware";
import { json } from "../../_lib/errors";
import miniCoursesJson from "../../_data/mini-courses.json";

interface Part { seq: number; part: number; subject: string; slug?: string | null; status: string }
interface Course { title: string; badge: string; parts: Part[] }
interface Mini { window_hours: number; courses: Record<string, Course>; sequence: Array<{ seq: number; kind: string; subject: string; slug?: string | null }> }
const MINI = miniCoursesJson as unknown as Mini;

export const onRequestGet: PagesFunction<Env, string, RequestData> = async () => {
  const courses = Object.entries(MINI.courses).map(([id, c]) => ({
    id, title: c.title, badge: c.badge,
    parts: c.parts.map((p) => ({ seq: p.seq, part: p.part, subject: p.subject, slug: p.slug ?? null, status: p.status })),
  }));
  const bySeq: Record<number, { subject: string; slug: string | null }> = {};
  for (const it of MINI.sequence) {
    if (it.kind === "lesson") bySeq[it.seq] = { subject: it.subject, slug: it.slug ?? null };
  }
  const res = json({ window_hours: MINI.window_hours, courses, lessons_by_seq: bySeq });
  res.headers.set("Cache-Control", "public, max-age=600");
  return res;
};
