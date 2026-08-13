// GET /badge/<public_id> - the public badge verify page. Anyone with the
// link (a recruiter, LinkedIn) sees who earned which mini-course badge and
// when, served from the badges_earned row. noindex: these are personal.

import type { Env, RequestData } from "../_middleware";
import { courseDef } from "../_lib/badges-mini";
import miniCoursesJson from "../_data/mini-courses.json";

interface Mini { courses: Record<string, { title: string; badge: string; parts: unknown[] }> }
const MINI = miniCoursesJson as unknown as Mini;

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
}

export const onRequestGet: PagesFunction<Env, "id", RequestData> = async (context) => {
  const pid = String(context.params.id || "");
  const row = /^[a-f0-9]{18}$/.test(pid)
    ? await context.env.DB.prepare(
        `SELECT b.badge, b.earned_at, u.display_name FROM badges_earned b
         JOIN users u ON u.id = b.user_id WHERE b.public_id = ?1`,
      ).bind(pid).first<{ badge: string; earned_at: number; display_name: string | null }>()
    : null;

  const notFound = !row;
  let title = "Badge not found";
  let holder = "";
  let when = "";
  let partsLine = "";
  if (row) {
    const course = Object.entries(MINI.courses).find(([, c]) => c.badge === row.badge);
    title = course ? course[1].title : row.badge;
    holder = row.display_name || "An r-statistics.co learner";
    when = new Date(row.earned_at * 1000).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
    const def = course ? courseDef(course[0]) : null;
    if (def) partsLine = `${def.parts.length} interactive lessons, every graded check passed.`;
  }

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>${esc(title)} &middot; badge &middot; r-statistics.co</title>
<meta property="og:title" content="${esc(holder ? holder + " earned the " + title + " badge" : title)}">
<meta property="og:description" content="A verified mini-course badge from r-statistics.co.">
<style>
  body{margin:0;padding:48px 16px;background:#f4f6f9;font-family:'Helvetica Neue',Arial,sans-serif;color:#0a0d14;line-height:1.6}
  .card{max-width:480px;margin:0 auto;background:#fff;border:1px solid #e4e7ee;border-radius:12px;padding:36px;text-align:center}
  .brand{font-family:'Courier New',monospace;font-weight:600;font-size:15px;margin-bottom:22px}
  .medal{width:84px;height:84px;margin:0 auto 16px;border-radius:50%;background:#eef4ff;border:2px solid #2056d2;display:flex;align-items:center;justify-content:center;font-size:34px}
  h1{font-size:21px;margin:0 0 6px}
  .who{font-size:15px;margin:0 0 4px}
  .when{font-size:13.5px;color:#6b7280;margin:0 0 14px}
  .parts{font-size:13.5px;color:#6b7280;margin:0 0 20px}
  .verified{display:inline-block;font-size:12px;font-weight:700;color:#166534;background:#dcfce7;border-radius:99px;padding:3px 12px;margin-bottom:20px}
  a.home{color:#2056d2;font-size:13.5px}
</style></head><body><div class="card">
<div class="brand">r-statistics.co</div>
${notFound
  ? `<h1>Badge not found</h1><p class="when">This link does not match any issued badge.</p>`
  : `<div class="medal">&#127942;</div>
<span class="verified">Verified badge</span>
<h1>${esc(title)}</h1>
<p class="who"><b>${esc(holder)}</b></p>
<p class="when">Earned ${esc(when)}</p>
<p class="parts">${esc(partsLine)}</p>`}
<a class="home" href="https://r-statistics.co/">r-statistics.co: learn R, statistics and machine learning</a>
</div></body></html>`;
  return new Response(html, {
    status: notFound ? 404 : 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=300" },
  });
};
