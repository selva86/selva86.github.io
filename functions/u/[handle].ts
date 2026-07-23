// GET /u/<handle>
//
// Server-rendered public learner profile (v2). Self-contained shell, no site
// template dependency. Privacy contract:
//   - public_profile = 1 (schema default): full page for everyone; shows
//     display name + achievements, NEVER the email.
//   - public_profile = 0: strangers get a data-free "this profile is private"
//     shell (nothing sensitive in the HTML source). The owner, identified
//     client-side via their token against /api/me/profile, sees an own-view
//     with the full editor.
// Renamed handles: /u/<old> 301s to /u/<new> (prev_handle lookup).
// noindex for v1 (indexing public profiles is a separate owner decision).

import type { Env, RequestData } from "../_middleware";
import {
  ensureProfileColumns, loadProfileStats, escHtml, renderHeatmapSvg, describeAction,
  computeTier, parseProfileJson, linkedInAddUrl, bumpProfileView,
} from "../_lib/profile";
import { isProActive, type User } from "../_lib/db";

const SHELL_CSS = `
  *{box-sizing:border-box}
  body{font-family:'IBM Plex Sans',-apple-system,'Segoe UI',Roboto,Arial,sans-serif;background:#fbfbfa;color:#16181d;margin:0;line-height:1.55}
  a{color:#2056d2;text-decoration:none} a:hover{text-decoration:underline}
  .top{background:#fff;border-bottom:1px solid #e7e4da;padding:10px 20px;display:flex;align-items:center;gap:18px}
  .top .wordmark{font-family:'Inter Tight','IBM Plex Sans',sans-serif;font-weight:700;font-size:19px;color:#16181d}
  .top .wordmark span{color:#2056d2}
  .top nav{display:flex;gap:16px;font-size:13.5px} .top nav a{color:#5c6270}
  .wrap{max-width:900px;margin:0 auto;padding:26px 20px 60px}
  .card{background:#fff;border:1px solid #e2e5ea;border-radius:14px;padding:22px 24px;margin-bottom:14px}
  .head{display:flex;gap:20px;align-items:flex-start;flex-wrap:wrap}
  .avatar{width:84px;height:84px;border-radius:50%;background:#2056d2;color:#fff;display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:600;overflow:hidden;flex:none}
  .avatar img{width:100%;height:100%;object-fit:cover}
  h1{font-family:'Inter Tight','IBM Plex Sans',sans-serif;font-weight:700;font-size:27px;margin:0;letter-spacing:-.01em}
  .idline{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
  .meta{color:#6b7280;font-size:13.5px;margin-top:3px}
  .bio{margin:8px 0 0;font-size:15px;max-width:560px}
  .pro{display:inline-block;background:#0f8a5f;color:#fff;font-size:11px;font-weight:600;letter-spacing:.4px;padding:2px 8px;border-radius:10px}
  .tier{display:inline-block;color:#fff;font-size:11.5px;font-weight:600;padding:3px 10px;border-radius:10px}
  .otw{display:inline-block;background:#eef6f1;color:#0f8a5f;border:1px solid #bfe0cf;font-size:12px;font-weight:600;padding:3px 10px;border-radius:10px}
  .tiernext{color:#8a8f98;font-size:12.5px;margin-top:6px}
  .links{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
  .lbtn{display:inline-flex;align-items:center;gap:6px;border:1px solid #d8dce4;background:#fff;border-radius:9px;padding:6px 12px;font-size:13px;color:#1a2340}
  .lbtn.em{background:#16181d;border-color:#16181d;color:#fff}
  .lbtn .v{color:#0f8a5f;font-weight:700;font-size:11px}
  .tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(128px,1fr));gap:12px;margin:16px 0 0}
  .tile{background:#f7f8fa;border:1px solid #e8eaef;border-radius:10px;padding:12px 14px}
  .tile b{display:block;font-size:23px;font-variant-numeric:tabular-nums}
  .tile span{font-size:12px;color:#6b7280}
  h2{font-family:'Inter Tight','IBM Plex Sans',sans-serif;font-weight:700;font-size:16px;margin:0 0 12px}
  h2 em{color:#8a8f98;font-style:normal;font-weight:400;font-size:12.5px}
  table{width:100%;border-collapse:collapse;font-size:14px}
  td{padding:6px 4px;border-top:1px solid #eef0f4} td.num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
  .bars .row{display:flex;align-items:center;gap:10px;margin:7px 0}
  .bars .lab{flex:0 0 150px;font-size:13.5px}
  .bars .bar{flex:1;height:10px;background:#eef0f4;border-radius:5px;overflow:hidden}
  .bars .fill{height:100%;background:#4272d4;border-radius:5px}
  .bars .n{flex:0 0 44px;text-align:right;font-size:13px;font-variant-numeric:tabular-nums;color:#3d4450}
  .duo{display:grid;grid-template-columns:1fr 1fr;gap:14px}
  @media(max-width:700px){.duo{grid-template-columns:1fr}}
  .donut-wrap{display:flex;align-items:center;gap:18px}
  .legend{font-size:13px;color:#3d4450}
  .legend i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:7px}
  .certgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px}
  .cert{border:1px solid #e2e5ea;border-radius:12px;padding:14px 16px}
  .cert b{display:block;font-size:14.5px;margin-bottom:2px}
  .cert .vf{color:#0f8a5f;font-size:11.5px;font-weight:700;letter-spacing:.4px}
  .cert .d{color:#6b7280;font-size:12.5px;margin:2px 0 10px}
  .cert .row{display:flex;gap:8px;flex-wrap:wrap}
  .cert a.small{font-size:12.5px;border:1px solid #d8dce4;border-radius:8px;padding:4px 10px}
  .own{display:none;background:#fffbe9;border:1px solid #e5d9a8;border-radius:14px;padding:16px 18px;margin-bottom:14px;font-size:14px}
  .own .row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:10px}
  .btn{display:inline-block;border:1px solid #c9d4ea;background:#fff;border-radius:8px;padding:7px 14px;font-size:13.5px;cursor:pointer;color:#1a2340;font-family:inherit}
  .btn.primary{background:#2056d2;border-color:#2056d2;color:#fff}
  .own input[type=text],.own textarea,.own select{width:100%;border:1px solid #d8dce4;border-radius:8px;padding:7px 10px;font:inherit;font-size:13.5px;margin:3px 0 8px;background:#fff}
  .own textarea{min-height:110px;font-family:'IBM Plex Mono',Consolas,monospace;font-size:12.5px}
  .own label{font-size:12.5px;font-weight:600;color:#5c5330}
  .own .grid2{display:grid;grid-template-columns:1fr 1fr;gap:0 14px}
  @media(max-width:700px){.own .grid2{grid-template-columns:1fr}}
  #own-editor{display:none;margin-top:12px;border-top:1px solid #eadfae;padding-top:12px}
  .msg{font-size:12.5px;margin-top:6px}
  .msg.err{color:#b42318}.msg.ok{color:#0f8a5f}
  .foot{color:#6b7280;font-size:12.5px;margin-top:20px}
  .private-card{max-width:520px;margin:60px auto;text-align:center}
  .report{color:#9aa0ab;font-size:11.5px;margin-top:8px}
`;

function shell(title: string, body: string, extraHead = ""): string {
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8">
<title>${escHtml(title)} &middot; r-statistics.co</title>
<meta name="robots" content="noindex,follow">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="shortcut icon" href="/screenshots/iconb-64.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@600;700&display=swap" rel="stylesheet">
${extraHead}
<style>${SHELL_CSS}</style>
</head><body>
<div class="top">
  <a class="wordmark" href="/">R<span>.</span></a>
  <nav><a href="/roadmap/">Roadmap</a><a href="/tutorials/">Tutorials</a><a href="/exercises/">Exercises</a><a href="/tools/">Tools</a></nav>
</div>
<div class="wrap">${body}</div>
</body></html>`;
}

function htmlResponse(body: string, status: number): Response {
  return new Response(body, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-store" },
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

// Inline hydration: identifies the OWNER client-side (token -> /api/me/profile),
// reveals the owner bar + editor, wires saves. Strangers see nothing extra.
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
  function api(method, body){
    return fetch('/api/me/profile', {
      method: method,
      headers: method === 'POST'
        ? { 'Authorization': 'Bearer ' + tok, 'Content-Type': 'application/json' }
        : { 'Authorization': 'Bearer ' + tok },
      body: body ? JSON.stringify(body) : undefined
    }).then(function(r){ return r.json().then(function(j){ return { ok: r.ok, j: j }; }); });
  }
  api('GET').then(function(res){
    var p = res.j;
    if (!p || !p.handle || p.handle !== ${JSON.stringify(pageHandle)}) return;
    var bar = document.getElementById('ownbar');
    if (!bar) return;
    bar.style.display = 'block';
    var statusEl = document.getElementById('own-status');
    var toggle = document.getElementById('own-toggle');
    function paint(){
      statusEl.textContent = (p.is_public
        ? 'Your profile is public.'
        : 'Your profile is private: only you can see it.')
        + (p.views_month ? ' ' + p.views_month + ' view' + (p.views_month === 1 ? '' : 's') + ' this month.' : '');
      toggle.textContent = p.is_public ? 'Make private' : 'Make public';
    }
    paint();
    toggle.addEventListener('click', function(){
      toggle.disabled = true;
      api('POST', { public: !p.is_public }).then(function(){ location.reload(); });
    });
    var copy = document.getElementById('own-copy');
    if (copy) copy.addEventListener('click', function(){
      try { navigator.clipboard.writeText(location.origin + '/u/' + p.handle); copy.textContent = 'Copied'; } catch (e) {}
    });
    var embed = document.getElementById('own-embed');
    if (embed) embed.addEventListener('click', function(){
      var md = '[![My r-statistics.co learner card](' + location.origin + '/u/' + p.handle + '/card.svg)](' + location.origin + '/u/' + p.handle + ')';
      try { navigator.clipboard.writeText(md); embed.textContent = 'Markdown copied'; } catch (e) {}
    });
    var li = document.getElementById('own-li');
    if (li) li.href = 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(location.origin + '/u/' + p.handle);
    var xs = document.getElementById('own-x');
    if (xs) xs.href = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent('My R learning profile: ' + location.origin + '/u/' + p.handle);

    // ---- editor ----
    var editBtn = document.getElementById('own-edit');
    var ed = document.getElementById('own-editor');
    var x = p.extras || {};
    function val(id){ return (document.getElementById(id).value || '').trim(); }
    function fill(){
      document.getElementById('f-bio').value = x.bio || '';
      document.getElementById('f-website').value = x.website || '';
      document.getElementById('f-resume').value = x.resume || '';
      document.getElementById('f-github').value = x.github || '';
      document.getElementById('f-p1').value = (x.projects && x.projects[0]) || '';
      document.getElementById('f-p2').value = (x.projects && x.projects[1]) || '';
      document.getElementById('f-p3').value = (x.projects && x.projects[2]) || '';
      document.getElementById('f-otw').checked = !!x.open_to_work;
      document.getElementById('f-role').value = x.role || '';
      document.getElementById('f-pref').value = x.work_pref || 'any';
      document.getElementById('f-sn-title').value = (x.snippet && x.snippet.title) || '';
      document.getElementById('f-sn-code').value = (x.snippet && x.snippet.code) || '';
      var h = document.getElementById('f-handle');
      h.value = p.handle; h.disabled = !!p.handle_locked;
      document.getElementById('handle-note').textContent = p.handle_locked
        ? 'Handle was already changed once; it is now permanent.'
        : 'One change allowed. Your old URL will keep redirecting.';
    }
    if (editBtn) editBtn.addEventListener('click', function(){
      ed.style.display = ed.style.display === 'block' ? 'none' : 'block';
      if (ed.style.display === 'block') fill();
    });
    var save = document.getElementById('own-save');
    if (save) save.addEventListener('click', function(){
      save.disabled = true;
      var msg = document.getElementById('own-msg');
      msg.className = 'msg'; msg.textContent = 'Saving...';
      var projects = [val('f-p1'), val('f-p2'), val('f-p3')].filter(Boolean);
      var body = {
        bio: val('f-bio'), website: val('f-website'), resume: val('f-resume'),
        github: val('f-github'), projects: projects,
        open_to_work: document.getElementById('f-otw').checked,
        role: val('f-role'), work_pref: val('f-pref')
      };
      var code = val('f-sn-code');
      body.snippet = code ? { title: val('f-sn-title'), code: document.getElementById('f-sn-code').value } : null;
      api('POST', body).then(function(res){
        if (!res.ok || res.j.error) {
          msg.className = 'msg err'; msg.textContent = res.j.error || 'Save failed';
          save.disabled = false; return;
        }
        var newHandle = val('f-handle');
        if (!p.handle_locked && newHandle && newHandle !== p.handle) {
          return api('POST', { handle: newHandle }).then(function(r2){
            if (!r2.ok || r2.j.error) {
              msg.className = 'msg err'; msg.textContent = r2.j.error || 'Handle change failed';
              save.disabled = false; return;
            }
            location.href = '/u/' + newHandle;
          });
        }
        location.reload();
      }).catch(function(){
        msg.className = 'msg err'; msg.textContent = 'Network error';
        save.disabled = false;
      });
    });
  }).catch(function(){});
})();
</script>`;
}

function ownerBar(): string {
  return `<div class="own" id="ownbar">
    <b>This is your profile.</b> <span id="own-status"></span>
    <div class="row">
      <button class="btn primary" id="own-toggle" type="button">&hellip;</button>
      <button class="btn" id="own-edit" type="button">Edit profile</button>
      <button class="btn" id="own-copy" type="button">Copy link</button>
      <button class="btn" id="own-embed" type="button">Copy README embed</button>
      <a class="btn" id="own-li" href="#" target="_blank" rel="noopener">Share on LinkedIn</a>
      <a class="btn" id="own-x" href="#" target="_blank" rel="noopener">Share on X</a>
    </div>
    <div id="own-editor">
      <div class="grid2">
        <div><label>Bio (140 chars)</label><input type="text" id="f-bio" maxlength="140"></div>
        <div><label>Handle</label><input type="text" id="f-handle"><div class="msg" id="handle-note"></div></div>
        <div><label>Website</label><input type="text" id="f-website" placeholder="https://..."></div>
        <div><label>Resume link (Drive, Dropbox, PDF...)</label><input type="text" id="f-resume" placeholder="https://..."></div>
        <div><label>GitHub URL (auto-verified users can leave blank)</label><input type="text" id="f-github" placeholder="https://github.com/you"></div>
        <div><label>Target role</label><input type="text" id="f-role" placeholder="Data Analyst" maxlength="60"></div>
        <div><label>Project link 1</label><input type="text" id="f-p1" placeholder="https://..."></div>
        <div><label>Project link 2</label><input type="text" id="f-p2" placeholder="https://..."></div>
        <div><label>Project link 3</label><input type="text" id="f-p3" placeholder="https://..."></div>
        <div><label>Work preference</label><select id="f-pref"><option value="any">Any</option><option value="remote">Remote</option><option value="hybrid">Hybrid</option><option value="onsite">On-site</option></select></div>
      </div>
      <label style="display:flex;align-items:center;gap:8px;margin:6px 0"><input type="checkbox" id="f-otw" style="width:auto;margin:0"> Open to work (shows a badge on your public profile)</label>
      <label>Pinned snippet title</label><input type="text" id="f-sn-title" maxlength="80" placeholder="My favourite plot">
      <label>Pinned R snippet (runs live on your profile; max 2000 chars; clear to remove)</label>
      <textarea id="f-sn-code" maxlength="2000" placeholder="library(ggplot2)&#10;..."></textarea>
      <div class="row"><button class="btn primary" id="own-save" type="button">Save profile</button><span class="msg" id="own-msg"></span></div>
    </div>
  </div>`;
}

// The standard runnable-code markup (same contract webr-init.js drives site-wide).
function snippetBlock(title: string, code: string): string {
  return `<div class="card"><h2>${escHtml(title)} <em>pinned by the learner &middot; runs in your browser</em></h2>
    <div class="webr-container" data-block-title="${escHtml(title)}">
      <div class="webr-code-block">
        <div class="webr-editor" data-language="r">${escHtml(code)}</div>
        <div class="webr-buttons">
          <button class="btn btn-sm btn-primary webr-run-btn" onclick="runWebR(this)">&#9654; Run</button>
          <button class="btn btn-sm btn-default webr-reset-btn" onclick="resetWebR(this)">&#8634; Reset</button>
        </div>
        <pre class="webr-output"></pre>
      </div>
      <div class="webr-plot-output"></div>
    </div>
    <div class="report"><a href="mailto:selva86@gmail.com?subject=Report%20profile%20snippet" style="color:inherit">Report this snippet</a></div>
  </div>`;
}

function donutSvg(byDiff: Record<string, number>): string {
  const order = ["beginner", "intermediate", "advanced"];
  const colors: Record<string, string> = { beginner: "#7fa3e8", intermediate: "#4272d4", advanced: "#1f4eb8", other: "#c9cfd9" };
  const entries: Array<[string, number]> = order.filter((k) => byDiff[k]).map((k) => [k, byDiff[k]]);
  const other = Object.entries(byDiff).filter(([k]) => !order.includes(k)).reduce((a, [, v]) => a + v, 0);
  if (other) entries.push(["other", other]);
  const total = entries.reduce((a, [, v]) => a + v, 0);
  if (!total) return "";
  const R = 40, CX = 50, CY = 50, SW = 16;
  const C = 2 * Math.PI * R;
  let off = 0;
  let segs = "";
  for (const [k, v] of entries) {
    const frac = v / total;
    segs += `<circle r="${R}" cx="${CX}" cy="${CY}" fill="none" stroke="${colors[k] || colors.other}" stroke-width="${SW}" stroke-dasharray="${(frac * C).toFixed(1)} ${C.toFixed(1)}" stroke-dashoffset="${(-off * C).toFixed(1)}" transform="rotate(-90 ${CX} ${CY})"/>`;
    off += frac;
  }
  const legend = entries.map(([k, v]) =>
    `<div><i style="background:${colors[k] || colors.other}"></i>${escHtml(k)}: <b>${v}</b></div>`).join("");
  return `<div class="donut-wrap"><svg viewBox="0 0 100 100" width="110" height="110" role="img" aria-label="Solved by difficulty">
    ${segs}<text x="${CX}" y="${CY + 4}" text-anchor="middle" font-size="18" font-weight="700" fill="#16181d">${total}</text></svg>
    <div class="legend">${legend}</div></div>`;
}

export const onRequestGet: PagesFunction<Env, "handle", RequestData> = async (context) => {
  const raw = decodeURIComponent(String(context.params.handle || "")).toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{1,30}$/.test(raw)) return notFound();

  const DB = context.env.DB;
  await ensureProfileColumns(DB);
  const u = await DB.prepare(
    "SELECT * FROM users WHERE handle = ?1 AND deleted_at IS NULL"
  ).bind(raw).first<User & { public_profile?: number; profile_json?: string; github_login?: string; prev_handle?: string }>();

  if (!u) {
    // renamed? 301 the old handle to the new one (covers card.svg via its own route)
    const renamed = await DB.prepare(
      "SELECT handle FROM users WHERE prev_handle = ?1 AND deleted_at IS NULL"
    ).bind(raw).first<{ handle: string }>();
    if (renamed?.handle) {
      const url = new URL(context.request.url);
      url.pathname = `/u/${renamed.handle}`;
      return Response.redirect(url.toString(), 301);
    }
    return notFound();
  }

  const isPublic = (u.public_profile ?? 1) === 1;
  const name = escHtml(u.display_name || "R learner");

  if (!isPublic) {
    return htmlResponse(shell("Private profile", `
      ${ownerBar()}
      <div class="card private-card" id="private-card">
        <h1 style="font-size:22px">This profile is private</h1>
        <p class="meta" style="margin:10px 0 16px">The learner has chosen to keep their progress to themselves.</p>
        <a href="/">Explore r-statistics.co &rarr;</a>
      </div>
      ${ownerScript(raw)}`), 200);
  }

  context.waitUntil(bumpProfileView(DB, raw));

  const stats = await loadProfileStats(DB, u.id, u.total_xp || 0);
  const extras = parseProfileJson(u.profile_json);
  const tier = computeTier(u.total_xp || 0, stats.exercises_solved, stats.certificates.length);
  const memberSince = new Date(u.created_at * 1000).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const initial = name.trim().charAt(0).toUpperCase() || "R";
  const avatar = u.avatar_url
    ? `<img src="${escHtml(u.avatar_url)}" alt="" referrerpolicy="no-referrer">`
    : initial;
  const pro = isProActive(u) ? '<span class="pro">PRO</span>' : "";

  const metaBits = [`Member since ${memberSince}`];
  if (stats.currently_learning) metaBits.push(`Deep in ${escHtml(stats.currently_learning)} this month`);
  if (stats.rank) metaBits.push(`#${stats.rank.toLocaleString()} of ${stats.learners_total.toLocaleString()} learners by XP`);

  const links: string[] = [];
  if (extras.resume) links.push(`<a class="lbtn em" href="${escHtml(extras.resume)}" target="_blank" rel="noopener nofollow">Resume</a>`);
  const gh = u.github_login
    ? `<a class="lbtn" href="https://github.com/${escHtml(u.github_login)}" target="_blank" rel="noopener nofollow">GitHub <span class="v">verified</span></a>`
    : extras.github
      ? `<a class="lbtn" href="${escHtml(extras.github)}" target="_blank" rel="noopener nofollow">GitHub</a>`
      : "";
  if (gh) links.push(gh);
  if (extras.website) links.push(`<a class="lbtn" href="${escHtml(extras.website)}" target="_blank" rel="noopener nofollow me">Website</a>`);
  (extras.projects || []).forEach((p, i) => {
    let label = `Project ${i + 1}`;
    try { label = new URL(p).hostname.replace(/^www\./, ""); } catch { /* keep default */ }
    links.push(`<a class="lbtn" href="${escHtml(p)}" target="_blank" rel="noopener nofollow">${escHtml(label)}</a>`);
  });

  const otw = extras.open_to_work
    ? `<span class="otw">Open to work${extras.role ? `: ${escHtml(extras.role)}` : ""}${extras.work_pref && extras.work_pref !== "any" ? ` &middot; ${escHtml(extras.work_pref)}` : ""}</span>`
    : "";

  const maxTrack = Math.max(1, ...stats.by_track.map((t) => t.solved));
  const trackBars = stats.by_track.map((t) =>
    `<div class="row"><span class="lab">${escHtml(t.track)}</span><span class="bar"><span class="fill" style="width:${Math.round((t.solved / maxTrack) * 100)}%"></span></span><span class="n">${t.solved}</span></div>`
  ).join("");

  const certCards = stats.certificates.map((c) => `
    <div class="cert">
      <span class="vf">VERIFIED</span>
      <b>${escHtml(c.track_name || "Certificate")}</b>
      <div class="d">Issued ${new Date(c.issued_at * 1000).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</div>
      <div class="row">
        <a class="small" href="/cert/${escHtml(c.public_id)}">View</a>
        <a class="small" href="${escHtml(linkedInAddUrl(c))}" target="_blank" rel="noopener">Add to LinkedIn</a>
      </div>
    </div>`).join("");

  const recentRows = stats.recent.map((r) =>
    `<tr><td>${escHtml(describeAction(r.action, r.ref))}</td>` +
    `<td class="num">+${r.xp} XP</td>` +
    `<td class="num">${new Date(r.at * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</td></tr>`
  ).join("");

  const hasActivity = stats.exercises_solved > 0 || (u.total_xp || 0) > 0 || stats.pages_read > 0;
  const donut = donutSvg(stats.by_difficulty);

  const ogDesc = `${u.display_name || "An R learner"}: ${(u.total_xp || 0).toLocaleString()} XP, ${stats.exercises_solved} exercises solved` +
    (stats.certificates.length ? `, ${stats.certificates.length} certificate${stats.certificates.length > 1 ? "s" : ""}` : "") +
    " on r-statistics.co";
  const extraHead =
    `<meta property="og:title" content="${escHtml(u.display_name || "R learner")} on r-statistics.co">` +
    `<meta property="og:description" content="${escHtml(ogDesc)}">` +
    `<meta property="og:type" content="profile">` +
    `<meta property="og:url" content="https://r-statistics.co/u/${escHtml(raw)}">` +
    `<meta name="twitter:card" content="summary">` +
    (extras.snippet ? `<link rel="stylesheet" href="/www/webr.css">` : "");

  const body = `
    ${ownerBar()}
    <div class="card">
      <div class="head">
        <div class="avatar">${avatar}</div>
        <div style="flex:1;min-width:240px">
          <div class="idline"><h1>${name}</h1><span class="tier" style="background:${tier.color}">${escHtml(tier.name)}</span>${pro}${otw}</div>
          <div class="meta">${metaBits.join(" &middot; ")}</div>
          ${extras.bio ? `<p class="bio">${escHtml(extras.bio)}</p>` : ""}
          ${tier.next ? `<div class="tiernext">${escHtml(tier.next.line)}</div>` : ""}
          ${links.length ? `<div class="links">${links.join("")}</div>` : ""}
        </div>
      </div>
      <div class="tiles">
        <div class="tile"><b>${(u.total_xp || 0).toLocaleString()}</b><span>total XP</span></div>
        <div class="tile"><b>${stats.exercises_solved.toLocaleString()}</b><span>exercises solved</span></div>
        <div class="tile"><b>${u.current_streak_days || 0}</b><span>day streak (best ${u.longest_streak_days || 0})</span></div>
        <div class="tile"><b>${stats.quizzes_passed}</b><span>quizzes passed</span></div>
        <div class="tile"><b>${stats.pages_read.toLocaleString()}</b><span>pages read</span></div>
        <div class="tile"><b>${stats.weeks_active_26}<span style="font-size:14px;color:#6b7280">/26</span></b><span>weeks active</span></div>
      </div>
    </div>
    <div class="card"><h2>Activity <em>last 52 weeks, UTC days</em></h2>${renderHeatmapSvg(stats.heatmap)}</div>
    ${hasActivity && (trackBars || donut) ? `
    <div class="duo">
      ${trackBars ? `<div class="card"><h2>Skills by track <em>graded exercises solved</em></h2><div class="bars">${trackBars}</div></div>` : ""}
      ${donut ? `<div class="card"><h2>Solved by difficulty</h2>${donut}</div>` : ""}
    </div>` : ""}
    ${certCards ? `<div class="card"><h2>Certificates <em>issuer-verified</em></h2><div class="certgrid">${certCards}</div></div>` : ""}
    ${extras.snippet?.code ? snippetBlock(extras.snippet.title || "Pinned snippet", extras.snippet.code) : ""}
    ${recentRows ? `<div class="card"><h2>Recent activity</h2><table>${recentRows}</table></div>` : ""}
    ${!hasActivity ? `<div class="card"><h2>Just getting started</h2><p class="meta">This learner joined in ${memberSince} and the journey is just beginning. Progress shows up here as they solve graded exercises and earn certificates.</p></div>` : ""}
    <div class="foot">Profiles show learning activity only; contact details are never published.
      Want a page like this? <a href="/signin.html">Start learning free</a>.</div>
    ${extras.snippet ? `<script src="/www/webr-init.js" defer></script>` : ""}
    ${ownerScript(raw)}`;

  return htmlResponse(shell(`${u.display_name || "R learner"} - learner profile`, body, extraHead), 200);
};
