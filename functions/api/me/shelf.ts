// GET /api/me/shelf - the signed-in user's windowed-lesson state: which
// lessons are open right now (their recent seq sends inside the window),
// their sequence position, and (Phase B) badges. Derived entirely from the
// send ledger + registry; no stored unlock state exists anywhere.

import type { Env, RequestData } from "../../_middleware";
import { json, err401 } from "../../_lib/errors";
import miniCoursesJson from "../../_data/mini-courses.json";

interface Mini { window_hours: number; sequence: Array<{ seq: number; kind: string; subject: string; slug?: string | null; course?: string | null }> }
const MINI = miniCoursesJson as unknown as Mini;
const WINDOW_SEC = (MINI.window_hours || 72) * 3600;

export const onRequestGet: PagesFunction<Env, string, RequestData> = async (context) => {
  const u = context.data.user;
  if (!u) return err401();
  const now = Math.floor(Date.now() / 1000);
  const rows = (await context.env.DB.prepare(
    "SELECT email_key, sent_at FROM sent_emails WHERE user_id = ?1 AND email_key LIKE 'seq:%'",
  ).bind(u.id).all<{ email_key: string; sent_at: number }>()).results ?? [];

  const sent = new Map<number, number>();
  for (const r of rows) {
    const n = parseInt(r.email_key.slice(4), 10);
    if (Number.isFinite(n)) sent.set(n, r.sent_at);
  }
  const open = [];
  for (const it of MINI.sequence) {
    if (it.kind !== "lesson") continue;
    const at = sent.get(it.seq);
    if (at !== undefined && now - at < WINDOW_SEC) {
      open.push({
        seq: it.seq, subject: it.subject, slug: it.slug ?? null,
        course: it.course ?? null, closes_at: at + WINDOW_SEC,
      });
    }
  }
  open.sort((a, b) => b.seq - a.seq);
  const position = rows.length ? Math.max(...[...sent.keys()]) : null;
  const badges = (await context.env.DB.prepare(
    "SELECT badge, public_id, earned_at FROM badges_earned WHERE user_id = ?1 ORDER BY earned_at DESC",
  ).bind(u.id).all<{ badge: string; public_id: string; earned_at: number }>()).results ?? [];
  return json({ open, position, badges });
};
