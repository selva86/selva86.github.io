// GET /api/teams/:id/progress        (owner/admin only)
// GET /api/teams/:id/progress?format=csv
//
// Per-member learning progress for the team dashboard: XP, streak, exercises
// solved, certificates, last active day. Sorted by XP (doubles as the team
// leaderboard). CSV variant downloads the same rows for reporting.
//
// Privacy: members are told on their own team card that team admins can see
// their learning progress. Only aggregate learning stats are exposed, never
// reading history or saved posts.

import type { Env, RequestData } from "../../../_middleware";
import { json, err401, err403, err404 } from "../../../_lib/errors";
import { getOrgById, isOrgAdmin, listActiveMembers } from "../../../_lib/teams";

interface MemberProgress {
  user_id: string;
  email: string | null;
  display_name: string | null;
  role: string;
  joined_at: number;
  total_xp: number;
  current_streak_days: number;
  last_active_date: string | null;
  exercises_solved: number;
  certificates: number;
}

export const onRequestGet: PagesFunction<Env, string, RequestData> = async (context) => {
  const u = context.data.user;
  if (!u) return err401();
  const orgId = context.params.id as string;
  const db = context.env.DB;

  const org = await getOrgById(db, orgId);
  if (!org) return err404("Team not found.");
  if (!(await isOrgAdmin(db, orgId, u.id))) return err403("Only a team owner or admin can view team progress.");

  const members = await listActiveMembers(db, orgId);
  if (members.length === 0) return json({ members: [] });

  const ids = members.map((m) => m.user_id);
  const ph = ids.map(() => "?").join(",");

  const [usersRes, solvedRes, certsRes] = await Promise.all([
    db.prepare(
      `SELECT id, email, display_name, total_xp, current_streak_days, last_active_date
         FROM users WHERE id IN (${ph})`,
    ).bind(...ids).all<{
      id: string; email: string | null; display_name: string | null;
      total_xp: number; current_streak_days: number; last_active_date: string | null;
    }>(),
    db.prepare(
      `SELECT user_id, COUNT(*) AS n FROM exercise_attempts
        WHERE passed = 1 AND user_id IN (${ph}) GROUP BY user_id`,
    ).bind(...ids).all<{ user_id: string; n: number }>(),
    db.prepare(
      `SELECT user_id, COUNT(*) AS n FROM certificates
        WHERE status != 'revoked' AND user_id IN (${ph}) GROUP BY user_id`,
    ).bind(...ids).all<{ user_id: string; n: number }>(),
  ]);

  const byId = new Map((usersRes.results || []).map((r) => [r.id, r]));
  const solved = new Map((solvedRes.results || []).map((r) => [r.user_id, r.n]));
  const certs = new Map((certsRes.results || []).map((r) => [r.user_id, r.n]));

  const rows: MemberProgress[] = members.map((m) => {
    const usr = byId.get(m.user_id);
    return {
      user_id: m.user_id,
      email: m.email ?? usr?.email ?? null,
      display_name: usr?.display_name ?? null,
      role: m.role,
      joined_at: m.joined_at,
      total_xp: usr?.total_xp ?? 0,
      current_streak_days: usr?.current_streak_days ?? 0,
      last_active_date: usr?.last_active_date ?? null,
      exercises_solved: solved.get(m.user_id) ?? 0,
      certificates: certs.get(m.user_id) ?? 0,
    };
  });
  rows.sort((a, b) => b.total_xp - a.total_xp);

  const url = new URL(context.request.url);
  if (url.searchParams.get("format") === "csv") {
    const esc = (v: unknown) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = "email,name,role,total_xp,exercises_solved,certificates,current_streak_days,last_active_date";
    const lines = rows.map((r) =>
      [r.email, r.display_name, r.role, r.total_xp, r.exercises_solved, r.certificates, r.current_streak_days, r.last_active_date]
        .map(esc).join(","),
    );
    return new Response([header, ...lines].join("\n") + "\n", {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="team-progress.csv"`,
        "Cache-Control": "private, no-store",
      },
    });
  }

  return json({ members: rows });
};
