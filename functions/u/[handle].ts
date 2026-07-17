// GET /u/<handle>
//
// Server-rendered public learner profile. Same self-contained-shell pattern
// as /cert/[id].ts. Privacy contract:
//   - public_profile = 1 (schema default): full page for everyone; shows
//     display name + achievements, NEVER the email.
//   - public_profile = 0: strangers get a data-free "this profile is private"
//     shell (nothing sensitive in the HTML source). The owner, identified
//     client-side via their token against /api/me/profile, sees a compact
//     own-view card with a make-public toggle.
// Owner controls on public pages (privacy toggle, copy link, share) hydrate
// client-side the same way. noindex for v1.

import type { Env, RequestData } from "../_middleware";
import {
  ensureProfileColumns, loadProfileStats, escHtml, renderHeatmapSvg, describeAction,
} from "../_lib/profile";
import { isProActive, type User } from "../_lib/db";

const SHELL_CSS = `
  *{box-sizing:border-box}
  body{font-family:'IBM Plex Sans',-apple-system,'Segoe UI',Roboto,Arial,sans-serif;background:#f6f7f9;color:#0a0d14;margin:0;line-height:1.55}
  a{color:#2056d2;text-decoration:none} a:hover{text-decoration:underline}
  .top{background:#0d1426;color:#fff;padding:10px 20px;display:flex;align-items:center;gap:18px}
  .top .wordmark{font-family:'IBM Plex Serif',Georgia,serif;font-weight:700;font-size:19px;color:#fff}
  .top .wordmark span{color:#4272d4}
  .top nav{display:flex;gap:16px;font-size:13.5px} .top nav a{color:#c7d2e8}
  .wrap{max-width:880px;margin:0 auto;padding:28px 20px 60px}
  .card{background:#fff;border:1px solid #d4d9e3;border-radius:12px;padding:22px 24px;margin-bottom:14px;box-shadow:0 2px 10px -4px rgba(13,20,38,.06)}
  .head{display:flex;gap:18px;align-items:center;flex-wrap:wrap}
  .avatar{width:72px;height:72px;border-radius:50%;background:#2056d2;color:#fff;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:600;overflow:hidden;flex:none}
  .avatar img{width:100%;height:100%;object-fit:cover}
  h1{font-family:'IBM Plex Serif',Georgia,serif;font-size:26px;margin:0}
  .meta{color:#6b7280;font-size:13.5px}
  .pro{display:inline-block;background:#0f8a5f;color:#fff;font-size:11px;font-weight:600;letter-spacing:.4px;padding:2px 8px;border-radius:10px;vertical-align:2px;margin-left:8px}
  .tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin:16px 0 0}
  .tile{background:#f6f8fc;border:1px solid #e4e9f2;border-radius:10px;padding:12px 14px}
  .tile b{display:block;font-size:24px;font-variant-numeric:tabular-nums}
  .tile span{font-size:12.5px;color:#6b7280}
  h2{font-size:15px;margin:0 0 12px}
  table{width:100%;border-collapse:collapse;font-size:14px}
  td{padding:6px 4px;border-top:1px solid #edf0f6} td.num{text-align:right;font-variant-numeric:tabular-nums}
  .own{display:none;background:#fffbe9;border:1px solid #e5d9a8;border-radius:12px;padding:14px 18px;margin-bottom:14px;font-size:14px}
  .own .row{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:10px}
  .btn{display:inline-block;border:1px solid #c9d4ea;background:#fff;border-radius:8px;padding:7px 14px;font-size:13.5px;cursor:pointer;color:#1a2340;font-family:inherit}
  .btn.primary{background:#2056d2;border-color:#2056d2;color:#fff}
  .foot{color:#6b7280;font-size:12.5px;margin-top:20px}
  .private-card{max-width:520px;margin:60px auto;text-align:center}
`;

function shell(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8">
<title>${escHtml(title)} &middot; r-statistics.co</title>
<meta name="robots" content="noindex,follow">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="shortcut icon" href="/screenshots/iconb-64.png">
<style>${SHELL_CSS}</style>
</head><body>
<div class="top">
  <a class="wordmark" href="/">R<span>.</span></a>
  <nav><a href="/roadmap/">Roadmap</a><a href="/Tutorials.html">Tutorials</a><a href="/exercises/">Exercises</a><a href="/tools/">Tools</a></nav>
</div>
<div class="wrap">${body}</div>
</body></html>`;
}

function htmlResponse(body: string, status: number): Response {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
    },
  });
}

function notFound(): Response {
  return htmlResponse(shell("Profile not found", `
    <div class="card private-card">
      <h1 style="font-size:22px">Profile not found</h1>
      <p class="meta" style="margin:10px 0 16px">No learner profile lives at this address. The handle may have changed, or the URL was mistyped.</p>
      <a href="/">Back to r-statistics.co &rarr;</a>
    </div>`), 404);
}

// Inline hydration script: identifies the OWNER client-side (token ->
// /api/me/profile) and reveals the owner bar / own-view. Strangers see
// nothing extra. Kept dependency-free.
function ownerScript(pageHandle: string): string {
  return `<script>
(function(){
  'use strict';
  var tok = null;
  try {
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (/^sb-.*-auth-token$/.test(k)) {
        var v = JSON.parse(localStorage.getItem(k));
        tok = (Array.isArray(v) ? v[0] : (v && v.access_token)) || null;
        break;
      }
    }
  } catch (e) {}
  if (!tok) return;
  fetch('/api/me/profile', { headers: { Authorization: 'Bearer ' + tok } })
    .then(function(r){ return r.ok ? r.json() : null; })
    .then(function(p){
      if (!p || !p.handle || p.handle !== ${JSON.stringify(pageHandle)}) return;
      var bar = document.getElementById('ownbar');
      if (!bar) return;
      bar.style.display = 'block';
      var toggle = document.getElementById('own-toggle');
      var statusEl = document.getElementById('own-status');
      function paint(){
        statusEl.textContent = p.is_public
          ? 'Your profile is public: anyone with the link can see it.'
          : 'Your profile is private: only you can see this page.';
        toggle.textContent = p.is_public ? 'Make profile private' : 'Make profile public';
      }
      paint();
      toggle.addEventListener('click', function(){
        toggle.disabled = true;
        fetch('/api/me/profile', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json' },
          body: JSON.stringify({ public: !p.is_public })
        }).then(function(r){ return r.json(); }).then(function(res){
          p.is_public = !!res.is_public; toggle.disabled = false; paint();
          location.reload();
        }).catch(function(){ toggle.disabled = false; });
      });
      var copy = document.getElementById('own-copy');
      if (copy) copy.addEventListener('click', function(){
        try { navigator.clipboard.writeText(location.origin + '/u/' + p.handle); copy.textContent = 'Copied'; } catch (e) {}
      });
      var ownStats = document.getElementById('own-stats');
      if (ownStats && p.stats) {
        ownStats.innerHTML =
          '<div class="tiles">' +
          '<div class="tile"><b>' + (p.total_xp || 0).toLocaleString() + '</b><span>total XP</span></div>' +
          '<div class="tile"><b>' + (p.stats.exercises_solved || 0).toLocaleString() + '</b><span>exercises solved</span></div>' +
          '<div class="tile"><b>' + (p.current_streak_days || 0) + '</b><span>day streak</span></div>' +
          '<div class="tile"><b>' + (p.stats.certificates ? p.stats.certificates.length : 0) + '</b><span>certificates</span></div>' +
          '</div>';
      }
    })
    .catch(function(){});
})();
</script>`;
}

function ownerBar(isPublicPage: boolean): string {
  return `<div class="own" id="ownbar">
    <b>This is your profile.</b> <span id="own-status"></span>
    ${isPublicPage ? "" : '<div id="own-stats"></div>'}
    <div class="row">
      <button class="btn primary" id="own-toggle" type="button">&hellip;</button>
      <button class="btn" id="own-copy" type="button">Copy profile link</button>
      <a class="btn" href="/dashboard.html">Go to dashboard</a>
    </div>
  </div>`;
}

export const onRequestGet: PagesFunction<Env, "handle", RequestData> = async (context) => {
  const raw = decodeURIComponent(String(context.params.handle || "")).toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{1,30}$/.test(raw)) return notFound();

  const DB = context.env.DB;
  await ensureProfileColumns(DB);
  const u = await DB.prepare(
    "SELECT * FROM users WHERE handle = ?1 AND deleted_at IS NULL"
  ).bind(raw).first<User & { public_profile?: number }>();
  if (!u) return notFound();

  const isPublic = (u.public_profile ?? 1) === 1;
  const name = escHtml(u.display_name || "R learner");

  if (!isPublic) {
    // Data-free shell for strangers; the owner unlocks a compact own-view.
    return htmlResponse(shell("Private profile", `
      ${ownerBar(false)}
      <div class="card private-card" id="private-card">
        <h1 style="font-size:22px">This profile is private</h1>
        <p class="meta" style="margin:10px 0 16px">The learner has chosen to keep their progress to themselves.</p>
        <a href="/">Explore r-statistics.co &rarr;</a>
      </div>
      ${ownerScript(raw)}`), 200);
  }

  const stats = await loadProfileStats(DB, u.id);
  const memberSince = new Date(u.created_at * 1000).toLocaleDateString("en-GB", {
    month: "long", year: "numeric",
  });
  const initial = name.trim().charAt(0).toUpperCase() || "R";
  const avatar = u.avatar_url
    ? `<img src="${escHtml(u.avatar_url)}" alt="" referrerpolicy="no-referrer">`
    : initial;
  const pro = isProActive(u) ? '<span class="pro">PRO</span>' : "";

  const certRows = stats.certificates.map((c) =>
    `<tr><td><a href="/cert/${escHtml(c.public_id)}">${escHtml(c.track_name || "Certificate")}</a></td>` +
    `<td class="num">${new Date(c.issued_at * 1000).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}</td></tr>`
  ).join("");
  const hubRows = stats.top_hubs.map((h) =>
    `<tr><td><a href="/${escHtml(h.hub_slug)}.html">${escHtml(h.hub_slug.replace(/-/g, " "))}</a></td>` +
    `<td class="num">${h.solved} solved</td></tr>`
  ).join("");
  const recentRows = stats.recent.map((r) =>
    `<tr><td>${escHtml(describeAction(r.action, r.ref))}</td>` +
    `<td class="num">+${r.xp} XP</td>` +
    `<td class="num">${new Date(r.at * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</td></tr>`
  ).join("");

  const body = `
    ${ownerBar(true)}
    <div class="card">
      <div class="head">
        <div class="avatar">${avatar}</div>
        <div>
          <h1>${name}${pro}</h1>
          <div class="meta">Learning R on r-statistics.co &middot; member since ${memberSince}</div>
        </div>
      </div>
      <div class="tiles">
        <div class="tile"><b>${(u.total_xp || 0).toLocaleString()}</b><span>total XP</span></div>
        <div class="tile"><b>${stats.exercises_solved.toLocaleString()}</b><span>exercises solved</span></div>
        <div class="tile"><b>${u.current_streak_days || 0}</b><span>day streak (best ${u.longest_streak_days || 0})</span></div>
        <div class="tile"><b>${stats.certificates.length}</b><span>certificates</span></div>
      </div>
    </div>
    <div class="card"><h2>Activity, last 26 weeks</h2>${renderHeatmapSvg(stats.heatmap)}</div>
    ${certRows ? `<div class="card"><h2>Certificates</h2><table>${certRows}</table></div>` : ""}
    ${hubRows ? `<div class="card"><h2>Most practiced exercise hubs</h2><table>${hubRows}</table></div>` : ""}
    ${recentRows ? `<div class="card"><h2>Recent activity</h2><table>${recentRows}</table></div>` : ""}
    <div class="foot">Profiles show learning activity only; contact details are never published.
      Want a page like this? <a href="/signin.html">Start learning free</a>.</div>
    ${ownerScript(raw)}`;

  return htmlResponse(shell(`${u.display_name || "R learner"} - learner profile`, body), 200);
};
