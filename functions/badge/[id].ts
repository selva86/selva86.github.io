// GET /badge/<public_id> - the public badge verify page. Anyone with the link
// (a recruiter, LinkedIn) sees who earned which badge and when, served from
// the badges_earned row. noindex: these are personal.
//
// Two kinds of badge share this page:
//   mini-course badges (badges-mini.ts), and
//   hub badges (badges-hub.ts), which carry an attempt record: how long the
//   challenge took, how many hints were opened, the XP.
//
// The page never ranks the holder against anyone. Population context appears
// only as an interquartile range, and only once enough people hold the badge
// for a range to mean anything. See Plans/section-badges-and-track-paths.md.

import type { Env, RequestData } from "../_middleware";
import { courseDef } from "../_lib/badges-mini";
import {
  slugFromBadge, hubTitle, hubBreakdown, hubTimeRange, fmtElapsed,
  type HubRecord,
} from "../_lib/badges-hub";
import miniCoursesJson from "../_data/mini-courses.json";

interface Mini { courses: Record<string, { title: string; badge: string; parts: unknown[] }> }
const MINI = miniCoursesJson as unknown as Mini;

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
}

const HEX =
  '<polygon points="192,100 146,179.7 54,179.7 8,100 54,20.3 146,20.3" fill="url(#hexg)"/>' +
  '<polygon points="192,100 146,179.7 54,179.7 8,100 54,20.3 146,20.3" fill="url(#shine)"/>' +
  '<polygon points="176,100 138,165.8 62,165.8 24,100 62,34.2 138,34.2" fill="none" stroke="#fff" stroke-opacity=".42" stroke-width="1.8"/>';

const DEFS =
  '<defs>' +
  '<linearGradient id="hexg" x1="0" y1="0" x2=".55" y2="1">' +
  '<stop offset="0" stop-color="#3aa87c"/><stop offset=".5" stop-color="#1f7a55"/><stop offset="1" stop-color="#0f3d2a"/></linearGradient>' +
  '<linearGradient id="shine" x1="0" y1="0" x2="0" y2="1">' +
  '<stop offset="0" stop-color="#fff" stop-opacity=".26"/><stop offset=".48" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
  '</defs>';

function medal(glyph: string, sub: string): string {
  return `<svg class="medal" viewBox="0 0 200 200" role="img" aria-label="${esc(sub || glyph)} badge">${DEFS}${HEX}
<text x="100" y="${sub ? 118 : 126}" text-anchor="middle" font-family="Inter Tight, Inter, sans-serif" font-size="${glyph.length > 2 ? 40 : 62}" font-weight="800" fill="#fff">${esc(glyph)}</text>
${sub ? `<text x="100" y="146.5" text-anchor="middle" font-family="Inter Tight, Inter, sans-serif" font-size="9.5" font-weight="700" letter-spacing="1.8" fill="#fff" fill-opacity=".92">${esc(sub)}</text>` : ""}</svg>`;
}

function statCell(value: string, label: string, hi = false): string {
  return `<div${hi ? ' class="hi"' : ""}><b>${esc(value)}</b><span>${esc(label)}</span></div>`;
}

export const onRequestGet: PagesFunction<Env, "id", RequestData> = async (context) => {
  const pid = String(context.params.id || "");
  const row = /^[a-f0-9]{18}$/.test(pid)
    ? await context.env.DB.prepare(
        `SELECT b.badge, b.earned_at, b.meta_json, u.display_name FROM badges_earned b
         JOIN users u ON u.id = b.user_id WHERE b.public_id = ?1`,
      ).bind(pid).first<{ badge: string; earned_at: number; meta_json: string | null; display_name: string | null }>()
        .catch(async () =>
          // meta_json may not exist yet on an older database
          await context.env.DB.prepare(
            `SELECT b.badge, b.earned_at, u.display_name FROM badges_earned b
             JOIN users u ON u.id = b.user_id WHERE b.public_id = ?1`,
          ).bind(pid).first<{ badge: string; earned_at: number; display_name: string | null }>()
            .then((r) => (r ? { ...r, meta_json: null } : null)),
        )
    : null;

  let title = "Badge not found";
  let kicker = "";
  let holder = "";
  let when = "";
  let glyph = "";
  let sub = "";
  let stats = "";
  let covered = "";
  let context_line = "";

  if (row) {
    holder = row.display_name || "An r-statistics.co learner";
    when = new Date(row.earned_at * 1000).toLocaleDateString("en-GB", {
      year: "numeric", month: "long", day: "numeric", timeZone: "UTC",
    });

    const slug = slugFromBadge(row.badge);
    if (slug) {
      // ---- hub badge
      title = hubTitle(slug);
      kicker = "Practice badge";
      const bd = hubBreakdown(slug);
      glyph = String(bd.total);
      sub = "PRACTICE";
      let rec: HubRecord = {};
      try { rec = row.meta_json ? JSON.parse(row.meta_json) as HubRecord : {}; } catch { /* none */ }
      const elapsed = fmtElapsed(rec.elapsed_ms);
      stats =
        (elapsed ? statCell(elapsed, "of recorded work", true) : "") +
        statCell(String(rec.solved ?? bd.total), "problems solved") +
        (rec.xp ? statCell(String(rec.xp), "XP earned") : "") +
        statCell(rec.hints ? String(rec.hints) : "none", "hints used");
      const parts: string[] = [];
      if (bd.beginner) parts.push(`${bd.beginner} beginner`);
      if (bd.intermediate) parts.push(`${bd.intermediate} intermediate`);
      if (bd.advanced) parts.push(`${bd.advanced} advanced`);
      covered = `Every graded problem in this hub, passed: ${parts.join(", ")}.`;
      const range = await hubTimeRange(context.env.DB, row.badge);
      if (range) {
        const a = fmtElapsed(range.p25), b = fmtElapsed(range.p75);
        if (a && b) context_line = `Most people finish this hub in ${a} to ${b}.`;
      }
    } else {
      // ---- mini-course badge
      const course = Object.entries(MINI.courses).find(([, c]) => c.badge === row.badge);
      title = course ? course[1].title : row.badge;
      kicker = "Mini-course badge";
      const def = course ? courseDef(course[0]) : null;
      glyph = def ? String(def.parts.length) : "R";
      sub = "MINI COURSE";
      if (def) covered = `${def.parts.length} interactive lessons, every graded check passed.`;
    }
  }

  const notFound = !row;
  const signedIn = !!context.data.user;
  const header = signedIn
    ? `<div class="top"><div class="in wide">
        <a class="brandwrap" href="/"><span class="bmark">R</span><span class="brand">r-statistics<span>.co</span></span></a>
        <nav class="navlinks">
          <a href="/roadmap/">Courses</a><a href="/tutorials/">Tutorials</a>
          <a href="/exercises/">Practice</a><a href="/pricing.html">Pricing</a><a href="/tools/">Tools</a>
        </nav>
        <a class="mine" href="/dashboard.html">Your dashboard &rarr;</a>
      </div></div>`
    : `<div class="top"><div class="in">
        <a class="brandwrap" href="/"><span class="bmark">R</span><span class="brand">r-statistics<span>.co</span></span></a>
      </div></div>`;

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>${esc(title)} &middot; badge &middot; r-statistics.co</title>
<meta property="og:title" content="${esc(holder ? holder + " earned the " + title + " badge" : title)}">
<meta property="og:description" content="A verified badge from r-statistics.co.">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
:root{--ink:#0f1a2b;--body:#3f4b5b;--mut:#7b8592;--hair:#e6eaef;--line:#d9e0e8;--tint:#eef7f2;--green:#1f7a55;--deep:#0f3d2a}
*{box-sizing:border-box}
body{margin:0;background:#f4f7f9;color:var(--ink);font:16px/1.5 Inter,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;font-variant-numeric:tabular-nums}
h1,h2{font-family:'Inter Tight',Inter,sans-serif;letter-spacing:-.03em;margin:0}
a{text-decoration:none;color:inherit}
.top{background:#fff;border-bottom:1px solid var(--line)}
.top .in{max-width:1120px;margin:0 auto;padding:0 28px;height:60px;display:flex;align-items:center;gap:10px}
.brandwrap{display:inline-flex;align-items:center;gap:10px}
.navlinks{display:flex;gap:4px;margin-left:auto;margin-right:auto}
.navlinks a{padding:8px 12px;font-weight:600;font-size:14.5px;color:#4b5058}
.navlinks a:hover{background:#f1f3f6;color:var(--ink)}
.mine{font-weight:600;font-size:14px;color:var(--green)}
@media(max-width:820px){.navlinks{display:none}.mine{margin-left:auto}}
.bmark{width:29px;height:29px;background:var(--deep);color:#fff;display:inline-flex;align-items:center;justify-content:center;font:700 17px 'Inter Tight'}
.brand{font:700 17px 'Inter Tight';letter-spacing:-.02em}.brand span{color:var(--mut)}
.wrap{max-width:660px;margin:0 auto;padding:44px 24px 0}
.cred{background:#fff;border:1px solid var(--line);box-shadow:0 1px 2px rgba(15,26,43,.04),0 22px 50px -34px rgba(15,26,43,.4)}
.credtop{position:relative;padding:42px 40px 32px;text-align:center;border-bottom:1px solid var(--hair);overflow:hidden}
.guil{position:absolute;inset:0;opacity:.5;pointer-events:none}
.medal{width:142px;height:142px;margin:0 auto 20px;display:block;position:relative}
.kick{position:relative;font-size:13.5px;color:var(--mut);margin:0 0 6px}
.cred h1{position:relative;font-size:29px;font-weight:700;line-height:1.18;margin-bottom:10px}
.holder{position:relative;font-size:16px;color:var(--body);margin:0}
.holder b{color:var(--ink);font-weight:600}
.on{position:relative;font-size:13.5px;color:var(--mut);margin:7px 0 0}
.record{padding:24px 40px 26px;border-bottom:1px solid var(--hair)}
.record h2{font-size:15px;font-weight:700;margin-bottom:14px}
.nums{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr))}
.nums div{padding:0 14px}
.nums div:first-child{padding-left:0}
.nums div+div{border-left:1px solid var(--hair)}
.nums b{display:block;font:700 23px 'Inter Tight';letter-spacing:-.03em;line-height:1.15}
.nums span{font-size:12.5px;color:var(--mut)}
.nums .hi b{color:var(--green)}
.ctx{margin:18px 0 0;padding-top:14px;border-top:1px solid var(--hair);font-size:13.5px;color:var(--mut)}
.covered{padding:22px 40px 26px;border-bottom:1px solid var(--hair);font-size:14.5px;color:var(--body)}
.covered h2{font-size:15px;font-weight:700;margin-bottom:6px;color:var(--ink)}
.issue{padding:22px 40px 26px;display:flex;align-items:flex-start;gap:24px;flex-wrap:wrap}
.issuer{flex:1;min-width:220px}
.issuer h2{font-size:15px;font-weight:700;margin-bottom:6px}
.issuer p{margin:0;font-size:13.5px;color:var(--body);line-height:1.6}
.issuer p b{color:var(--ink);font-weight:600}
.idb{flex:none;text-align:right}
.idb .k{font-size:12px;color:var(--mut);margin-bottom:4px}
.idb code{font:14px ui-monospace,Menlo,Consolas,monospace;letter-spacing:.04em}
.ver{display:flex;align-items:center;gap:8px;margin-top:8px;font-size:12.5px;color:#14532d;justify-content:flex-end}
.tick{width:16px;height:16px;border-radius:50%;background:var(--green);position:relative;flex:none}
.tick::after{content:'';position:absolute;left:5px;top:3px;width:4px;height:7px;border:solid #fff;border-width:0 2px 2px 0;transform:rotate(45deg)}
.tail{text-align:center;font-size:13px;color:var(--mut);margin:20px 0 40px}
.tail a{color:var(--green);font-weight:600}
.nf{max-width:460px;margin:0 auto;background:#fff;border:1px solid var(--line);padding:40px;text-align:center}
@media(max-width:620px){.credtop,.record,.covered,.issue{padding-left:22px;padding-right:22px}.nums div{padding-left:0;border-left:0}}
</style></head><body>
${header}
<div class="wrap">
${notFound ? `<div class="nf"><h1>Badge not found</h1><p class="on">This link does not match any issued badge.</p></div>` : `
<div class="cred">
  <div class="credtop">
    <svg class="guil" aria-hidden="true"><defs><pattern id="g" width="44" height="44" patternUnits="userSpaceOnUse">
      <circle cx="22" cy="22" r="19" fill="none" stroke="#dfe7e2" stroke-width=".7"/>
      <circle cx="0" cy="0" r="19" fill="none" stroke="#dfe7e2" stroke-width=".7"/>
      <circle cx="44" cy="0" r="19" fill="none" stroke="#dfe7e2" stroke-width=".7"/>
      <circle cx="0" cy="44" r="19" fill="none" stroke="#dfe7e2" stroke-width=".7"/>
      <circle cx="44" cy="44" r="19" fill="none" stroke="#dfe7e2" stroke-width=".7"/>
    </pattern></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>
    ${medal(glyph, sub)}
    <p class="kick">${esc(kicker)}</p>
    <h1>${esc(title)}</h1>
    <p class="holder">Awarded to <b>${esc(holder)}</b></p>
    <p class="on">${esc(when)}</p>
  </div>
  ${stats ? `<div class="record"><h2>How it was earned</h2><div class="nums">${stats}</div>${context_line ? `<p class="ctx">${esc(context_line)}</p>` : ""}</div>` : ""}
  ${covered ? `<div class="covered"><h2>What it covered</h2>${esc(covered)}</div>` : ""}
  <div class="issue">
    <div class="issuer"><h2>Issued by</h2>
      <p><b>r-statistics.co</b>, on the work recorded above. The holder cannot edit this page, and the record was written by the grader at the time each problem was solved.</p></div>
    <div class="idb"><div class="k">Credential ID</div><code>${esc(pid.slice(0, 12).toUpperCase())}</code>
      <div class="ver"><span class="tick"></span>Verified</div></div>
  </div>
</div>`}
<p class="tail"><a href="https://r-statistics.co/">r-statistics.co</a>, learn R, statistics and machine learning</p>
</div></body></html>`;

  return new Response(html, {
    status: notFound ? 404 : 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=300" },
  });
};
