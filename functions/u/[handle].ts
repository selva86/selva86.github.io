// GET /u/<handle>  (profile v3, pass 1 - the mock-v2 layout, all real data)
//
// Server-rendered public learner profile. Privacy contract unchanged:
//   - public: full page, email never rendered
//   - private: data-free shell; owner unlocks own-view client-side
// Renamed handles 301 via prev_handle. noindex for v1.
// ?year=YYYY re-renders the activity board for that calendar year.

import type { Env, RequestData } from "../_middleware";
import {
  ensureProfileColumns, loadProfileStats, escHtml, describeAction,
  computeTier, parseProfileJson, linkedInAddUrl, bumpProfileView,
  monthlyDeltas, captureAndDeltaRank, loadBoardRows, renderBoardHtml, xpPercentiles,
  renderXpChartSvg,
} from "../_lib/profile";
import {
  BADGE_DEFS, certBadges, awardBadges, loadUserBadges, badgeRarity, badgeArt,
  type BadgeCtx,
} from "../_lib/badges";
import { isProActive, type User } from "../_lib/db";

const CSS = `
  *{box-sizing:border-box}
  html,body{margin:0}
  body{background:#f7f7f5;color:#16181d;font:14.5px/1.55 'IBM Plex Sans',-apple-system,'Segoe UI',Roboto,Arial,sans-serif}
  a{color:#2056d2;text-decoration:none} a:hover{text-decoration:underline}
  .masthead{background:#101a30;padding:11px 24px;display:flex;align-items:center;gap:22px}
  .wordmark{font-family:'Inter Tight',sans-serif;font-weight:700;font-size:19px;color:#fff}
  .wordmark b{color:#7da2ff}
  .masthead nav{display:flex;gap:18px;font-size:13.5px}
  .masthead nav a{color:#c7d2e8}
  .masthead .grow{flex:1}
  .masthead .cta{background:#fff;color:#101a30;border-radius:9px;padding:7px 14px;font-size:13px;font-weight:600}
  .hero{background:linear-gradient(180deg,var(--hero-a,#101a30) 0%,var(--hero-b,#182644) 100%);color:#e8edf8;padding:34px 0 0}
  .hero-in{max-width:1180px;margin:0 auto;padding:0 22px;display:flex;gap:26px;align-items:flex-start;flex-wrap:wrap}
  .ringwrap{position:relative;width:148px;height:148px;flex:none}
  .ringwrap svg{position:absolute;inset:0}
  .avatar{position:absolute;inset:11px;border-radius:50%;background:#3b5bd8;color:#fff;display:flex;align-items:center;justify-content:center;font-family:'Inter Tight',sans-serif;font-size:48px;font-weight:700;overflow:hidden}
  .avatar img{width:100%;height:100%;object-fit:cover;border-radius:50%}
  .tierpin{position:absolute;left:50%;bottom:-9px;transform:translateX(-50%);color:#fff;font-size:11px;font-weight:700;padding:3px 13px;border-radius:11px;letter-spacing:.4px;box-shadow:0 2px 8px rgba(0,0,0,.35);white-space:nowrap}
  .hid{flex:1;min-width:280px;padding-top:6px}
  .hid h1{font-family:'Inter Tight',sans-serif;font-weight:800;font-size:34px;margin:0;letter-spacing:-.015em;color:#fff}
  .hid .handle{color:#9daac6;font-size:14px;margin-top:2px}
  .hid .bio{color:#c7d2e8;font-size:14.5px;max-width:520px;margin:10px 0 0}
  .hchips{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
  .hchip{font-size:12px;font-weight:600;padding:4px 12px;border-radius:11px;background:rgba(255,255,255,.09);color:#dbe4f5;border:1px solid rgba(255,255,255,.14)}
  .hchip.pro{background:#0f7a52;border-color:#0f7a52;color:#fff}
  .hchip.otw{background:rgba(35,160,105,.18);border-color:rgba(85,200,145,.4);color:#7fd8ae}
  .hmeta{display:flex;gap:18px;flex-wrap:wrap;color:#9daac6;font-size:12.5px;margin-top:14px}
  .hmeta b{color:#e8edf8;font-weight:500}
  .hstats{display:grid;grid-template-columns:repeat(4,auto);gap:10px 34px;align-self:center;padding:10px 0}
  @media(max-width:980px){.hstats{grid-template-columns:repeat(2,auto)}}
  .hstat b{display:block;font-family:'Inter Tight',sans-serif;font-weight:700;font-size:30px;color:#fff;font-variant-numeric:tabular-nums;letter-spacing:-.01em}
  .hstat span{font-size:12px;color:#9daac6}
  .hstat .delta{color:#7fd8ae;font-size:11.5px;font-weight:600}
  .heronav{max-width:1180px;margin:26px auto 0;padding:0 22px;display:flex;gap:4px;overflow-x:auto}
  .heronav a{color:#9daac6;font-size:13.5px;font-weight:500;padding:11px 16px;border-radius:9px 9px 0 0;white-space:nowrap}
  .heronav a.on{background:#f7f7f5;color:#16181d;font-weight:600}
  .heronav a:hover{text-decoration:none;color:#fff}
  .heronav a.on:hover{color:#16181d}
  .page{max-width:1180px;margin:0 auto;padding:24px 22px 80px;display:grid;grid-template-columns:308px 1fr;gap:20px;align-items:start}
  @media(max-width:920px){.page{grid-template-columns:1fr}}
  .card{background:#fff;border:1px solid #e6e8ee;border-radius:16px;padding:20px 22px;box-shadow:0 1px 2px rgba(16,26,48,.05),0 4px 14px -6px rgba(16,26,48,.08)}
  h2{font-family:'Inter Tight',sans-serif;font-weight:700;font-size:16.5px;margin:0 0 14px;letter-spacing:-.01em}
  h2 small{font-family:'IBM Plex Sans',sans-serif;font-weight:400;font-size:12.5px;color:#667085;margin-left:8px}
  .rail{display:flex;flex-direction:column;gap:16px;position:sticky;top:16px}
  @media(max-width:920px){.rail{position:static}}
  .main{display:flex;flex-direction:column;gap:16px;min-width:0}
  .streakhead{display:flex;align-items:center;gap:14px}
  .flame{width:46px;height:46px;flex:none}
  .streakhead b{font-family:'Inter Tight',sans-serif;font-size:30px;font-weight:700;font-variant-numeric:tabular-nums}
  .streakhead .lbl{font-size:12px;color:#667085}
  .streakhead .best{margin-left:auto;font-size:12px;color:#667085;text-align:right}
  .weekstrip{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-top:14px}
  .weekstrip div{text-align:center;font-size:10.5px;color:#667085}
  .weekstrip i{display:block;height:26px;border-radius:7px;background:#eef1f6;margin-bottom:4px}
  .weekstrip .hit i{background:#2056d2}
  .weekstrip .today i{outline:2px solid #2056d2;outline-offset:2px;background:#c3d4f2}
  .linkcol{display:flex;flex-direction:column;gap:7px}
  .lbtn{display:flex;align-items:center;gap:9px;border:1px solid #e6e8ee;border-radius:9px;padding:8px 12px;font-size:13px;color:#16181d;background:#fff}
  .lbtn:hover{border-color:#c9d2e6;text-decoration:none}
  .lbtn.em{background:#16181d;border-color:#16181d;color:#fff}
  .lbtn .tag{margin-left:auto;font-size:10.5px;font-weight:700;color:#0f7a52;letter-spacing:.4px}
  .sharerow{display:flex;gap:7px;flex-wrap:wrap}
  .sbtn{flex:1;text-align:center;border:1px solid #e6e8ee;border-radius:9px;padding:7px 4px;font-size:12px;color:#3a4150;background:#fff;cursor:pointer;font-family:inherit;white-space:nowrap}
  .editbtn{width:100%;background:#2056d2;border:none;color:#fff;border-radius:9px;padding:9px;font-size:13.5px;font-weight:500;cursor:pointer;font-family:inherit}
  .meter{margin-top:4px}
  .meter .bar{height:7px;background:#eef1f6;border-radius:4px;overflow:hidden}
  .meter .bar i{display:block;height:100%;background:#0f7a52;border-radius:4px}
  .meter .lbl{font-size:12px;color:#667085;margin-top:6px}
  .perfrow{display:grid;grid-template-columns:1fr 1.25fr;gap:16px}
  @media(max-width:1020px){.perfrow{grid-template-columns:1fr}}
  .bignum{font-family:'Inter Tight',sans-serif;font-weight:700;font-size:30px;letter-spacing:-.01em;font-variant-numeric:tabular-nums}
  .sub{color:#667085;font-size:12.5px}
  .rankring{display:flex;gap:18px;align-items:center}
  .solvedwrap{display:flex;gap:20px;align-items:center}
  .solvedlegend{flex:1;display:flex;flex-direction:column;gap:8px;min-width:0}
  .diffrow{display:grid;grid-template-columns:92px 1fr 76px;gap:10px;align-items:center;font-size:13px}
  .diffrow .nm{color:#3a4150}
  .diffrow .bar{height:7px;background:#eef1f6;border-radius:4px;overflow:hidden}
  .diffrow .bar i{display:block;height:100%;border-radius:4px}
  .diffrow .ct{text-align:right;font-variant-numeric:tabular-nums;color:#667085;font-size:12.5px}
  .board-head{display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;margin-bottom:14px}
  .board-head h2{margin:0}
  .board-sum{color:#667085;font-size:12.5px;margin-left:auto;font-variant-numeric:tabular-nums}
  .yeartabs{display:inline-flex;border:1px solid #e6e8ee;border-radius:9px;overflow:hidden}
  .yeartabs a{border:0;background:#fff;padding:5px 13px;font-size:12.5px;color:#667085;border-left:1px solid #e6e8ee}
  .yeartabs a:first-child{border-left:0}
  .yeartabs a:hover{text-decoration:none}
  .yeartabs a.on{background:#eef3fe;color:#2056d2;font-weight:600}
  .boardscroll{overflow-x:auto;padding-bottom:4px}
  .board{display:flex;gap:13px;align-items:flex-end;min-width:820px}
  .dowcol{display:grid;grid-template-rows:repeat(7,11px);gap:3px;margin-right:2px;margin-bottom:30px}
  .dowcol span{font-size:9px;color:#98a0ad;line-height:11px}
  .mo{display:flex;flex-direction:column;gap:5px}
  .mo .grid{display:grid;grid-auto-flow:column;grid-template-rows:repeat(7,11px);gap:3px}
  .mo .cell{width:11px;height:11px;border-radius:2.5px;background:#eef1f6}
  .mo .cell.blank{visibility:hidden}
  .mo .l1{background:#c3d4f2}.mo .l2{background:#85a8ea}.mo .l3{background:#4272d4}.mo .l4{background:#1f4eb8}
  .mo .lab{font-size:10.5px;color:#16181d;text-align:center;font-weight:500}
  .mo .cnt{font-size:9.5px;color:#667085;text-align:center;min-height:12px}
  .legend{display:flex;align-items:center;gap:5px;font-size:11px;color:#667085;margin-top:12px;justify-content:flex-end}
  .legend i{width:11px;height:11px;border-radius:2.5px;display:inline-block}
  .chartwrap{overflow-x:auto}
  .chartwrap svg{display:block;min-width:640px;width:100%}
  .skillrow{display:grid;grid-template-columns:170px 1fr auto;gap:14px;align-items:center;padding:11px 0;border-top:1px solid #f0f2f6}
  .skillrow:first-of-type{border-top:0}
  .skillrow .nm{font-weight:500;font-size:14px}
  .mchips{display:flex;gap:6px;flex-wrap:wrap}
  .mchip{font-size:11.5px;padding:3px 9px;border-radius:9px;background:#f4f6fa;color:#3a4150;font-variant-numeric:tabular-nums}
  .mchip b{font-weight:600}
  .mchip.adv{background:#eef3fe;color:#2056d2}
  .skillrow .tot{font-family:'Inter Tight',sans-serif;font-weight:700;font-size:19px;font-variant-numeric:tabular-nums;text-align:right}
  .skillrow .tot span{display:block;font-family:'IBM Plex Sans',sans-serif;font-weight:400;font-size:11px;color:#667085}
  .badgegrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}
  .bdg{border:1px solid #e6e8ee;border-radius:14px;padding:14px;text-align:center;background:#fff}
  .bdg .art{width:60px;height:60px;margin:0 auto 8px;display:block}
  .bdg b{display:block;font-size:13px;font-weight:600}
  .bdg span{font-size:11.5px;color:#667085}
  .bdg .rar{display:inline-block;margin-top:6px;font-size:10.5px;font-weight:600;color:#a16207;background:#fdf2e3;border-radius:8px;padding:2px 8px}
  .bdg.locked{background:#fafbfc}
  .bdg.locked .art{filter:grayscale(1);opacity:.4}
  .bdg.locked b{color:#667085}
  .bdg .pbar{height:4px;background:#eef1f6;border-radius:2px;margin-top:8px;overflow:hidden}
  .bdg .pbar i{display:block;height:100%;background:#a6b7d4;border-radius:2px}
  .certgrid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
  @media(max-width:760px){.certgrid{grid-template-columns:1fr}}
  .cert{border:1px solid #e6e8ee;border-left:4px solid #0f7a52;border-radius:12px;padding:16px 18px;display:flex;flex-direction:column;gap:4px;background:#fff}
  .cert .vrow{display:flex;align-items:center;gap:6px;font-size:11px;font-weight:700;color:#0f7a52;letter-spacing:.5px}
  .cert .vrow svg{width:13px;height:13px}
  .cert b{font-size:15px}
  .cert .meta{color:#667085;font-size:12.5px}
  .cert .row{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}
  .cert .row a{font-size:12.5px;border:1px solid #e6e8ee;border-radius:8px;padding:5px 11px;color:#16181d}
  .cert .row a.li{background:#0a66c2;border-color:#0a66c2;color:#fff}
  .cert .row a:hover{text-decoration:none}
  .webrcard{border:1px solid #e6e8ee;border-radius:12px;overflow:hidden;margin-top:4px}
  .feed td{padding:8px 4px;border-top:1px solid #f0f2f6;font-size:13.5px}
  .feed tr:first-child td{border-top:0}
  .feed .ic{width:26px}
  .feed .dot{width:9px;height:9px;border-radius:50%;display:inline-block}
  .feed .xp{text-align:right;font-variant-numeric:tabular-nums;color:#0f7a52;font-weight:500;white-space:nowrap}
  .feed .when{text-align:right;color:#667085;font-size:12.5px;white-space:nowrap}
  table{width:100%;border-collapse:collapse}
  .own{display:none;background:#fffbe9;border:1px solid #e5d9a8;border-radius:14px;padding:16px 18px;font-size:14px}
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
  .msg.err{color:#b42318}.msg.ok{color:#0f7a52}
  .foot{color:#667085;font-size:12.5px;margin-top:4px}
  .private-card{max-width:520px;margin:60px auto;text-align:center;background:#fff;border:1px solid #e6e8ee;border-radius:16px;padding:26px}
  .report{color:#9aa0ab;font-size:11.5px;margin-top:8px}
  button:focus-visible,a:focus-visible{outline:2px solid #2056d2;outline-offset:2px}
  @media(max-width:560px){.masthead nav{display:none}.masthead{gap:12px}}
  @media(max-width:560px){.hid h1{font-size:27px}.hstats{gap:8px 22px}.hstat b{font-size:24px}}
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
<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@600;700;800&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet">
${extraHead}
<style>${CSS}</style>
</head><body>
<div class="masthead">
  <a class="wordmark" href="/">R<b>.</b></a>
  <nav><a href="/roadmap/">Roadmap</a><a href="/tutorials/">Tutorials</a><a href="/exercises/">Exercises</a><a href="/tools/">Tools</a></nav>
  <span class="grow"></span>
  <a class="cta" href="/pricing.html">Get certified</a>
</div>
${body}
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
    <div class="private-card">
      <h2 style="font-size:22px">Profile not found</h2>
      <p class="sub" style="margin:10px 0 16px">No learner profile lives at this address. The handle may have changed, or the URL was mistyped.</p>
      <a href="/">Back to r-statistics.co &rarr;</a>
    </div>`), 404);
}

// Owner hydration script: same contract as before, plus the completeness meter.
function ownerScript(pageHandle: string): string {
  return `<script>
(function(){
  'use strict';
  // Count-up on the hero numbers. Pure decoration: static text is the
  // fallback for reduced-motion, old browsers, and any parse miss.
  try {
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      var els = document.querySelectorAll('.hstat b, .bignum');
      els.forEach(function(el){
        var raw = (el.textContent || '').trim();
        if (!/^[\\d,]+$/.test(raw)) return;
        var target = parseInt(raw.replace(/,/g, ''), 10);
        if (!isFinite(target) || target <= 0) return;
        var hasComma = raw.indexOf(',') >= 0;
        var t0 = null;
        var DUR = 700;
        el.textContent = '0';
        function step(ts){
          if (t0 === null) t0 = ts;
          var p = Math.min(1, (ts - t0) / DUR);
          var eased = 1 - Math.pow(1 - p, 3);
          var v = Math.round(target * eased);
          el.textContent = hasComma ? v.toLocaleString('en-US') : String(v);
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }
  } catch (e) {}
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
    // completeness meter
    var x = p.extras || {};
    var items = [
      [!!x.bio, 'add a bio'],
      [!!(x.website || x.resume || x.github || p.github_login || (x.projects && x.projects.length)), 'add a link'],
      [!!x.resume, 'link your resume'],
      [!!(x.snippet && x.snippet.code), 'pin a runnable snippet'],
      [!!x.open_to_work, 'set open to work'],
      [!!p.is_public, 'make your profile public']
    ];
    var done = items.filter(function(i){ return i[0]; }).length;
    var pct = Math.round(done / items.length * 100);
    var meter = document.getElementById('own-meter');
    if (meter) {
      var missing = items.filter(function(i){ return !i[0]; }).slice(0, 2).map(function(i){ return i[1]; });
      meter.innerHTML = '<div class="bar"><i style="width:' + pct + '%"></i></div>' +
        '<div class="lbl">Profile ' + pct + '% complete' + (missing.length ? ': next, ' + missing.join(', then ') : '') + '</div>';
    }
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

    var editBtn = document.getElementById('own-edit');
    var ed = document.getElementById('own-editor');
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
      document.getElementById('f-theme').value = x.theme || 'navy';
      var pins = (x.pinned && x.pinned.length) ? x.pinned
        : (x.snippet && x.snippet.code ? [{ title: x.snippet.title, code: x.snippet.code }] : []);
      document.getElementById('f-sn-title').value = (pins[0] && pins[0].title) || '';
      document.getElementById('f-sn-code').value = (pins[0] && pins[0].code) || '';
      document.getElementById('f-sn2-title').value = (pins[1] && pins[1].title) || '';
      document.getElementById('f-sn2-code').value = (pins[1] && pins[1].code) || '';
      document.getElementById('f-sn3-title').value = (pins[2] && pins[2].title) || '';
      document.getElementById('f-sn3-code').value = (pins[2] && pins[2].code) || '';
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
    var avIn = document.getElementById('f-avatar');
    if (avIn) avIn.addEventListener('change', function(){
      var f = avIn.files && avIn.files[0];
      if (!f) return;
      var am = document.getElementById('avatar-msg');
      am.textContent = 'Uploading...';
      var img = new Image();
      img.onload = function(){
        try {
          var c = document.createElement('canvas');
          c.width = 256; c.height = 256;
          var ctx = c.getContext('2d');
          var side = Math.min(img.width, img.height);
          ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, 256, 256);
          var data = c.toDataURL('image/jpeg', 0.85);
          fetch('/api/me/avatar', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + tok, 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: data })
          }).then(function(r){ return r.json(); }).then(function(j){
            if (j && j.ok) { am.textContent = 'Saved. Reloading...'; location.reload(); }
            else { am.textContent = (j && j.error && j.error.message) || 'Upload failed.'; }
          }).catch(function(){ am.textContent = 'Upload failed.'; });
        } catch (e) { am.textContent = 'Could not read that image.'; }
      };
      img.onerror = function(){ am.textContent = 'Could not read that image.'; };
      img.src = URL.createObjectURL(f);
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
        role: val('f-role'), work_pref: val('f-pref'),
        theme: val('f-theme')
      };
      var pinned = [];
      [['f-sn-title','f-sn-code'],['f-sn2-title','f-sn2-code'],['f-sn3-title','f-sn3-code']].forEach(function(pair){
        var c = document.getElementById(pair[1]).value;
        if (c && c.trim()) pinned.push({ title: val(pair[0]), code: c });
      });
      body.pinned = pinned.length ? pinned : null;
      body.snippet = null;
      api('POST', body).then(function(res2){
        if (!res2.ok || res2.j.error) {
          msg.className = 'msg err'; msg.textContent = res2.j.error || 'Save failed';
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
    <div class="meter" id="own-meter"></div>
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
        <div><label>Profile picture (square works best)</label><input type="file" id="f-avatar" accept="image/jpeg,image/png,image/webp"><div class="msg" id="avatar-msg"></div></div>
        <div><label>Accent theme</label><select id="f-theme"><option value="navy">Navy (default)</option><option value="forest">Forest</option><option value="plum">Plum</option><option value="slate">Slate</option><option value="ember">Ember</option></select></div>
      </div>
      <label style="display:flex;align-items:center;gap:8px;margin:6px 0"><input type="checkbox" id="f-otw" style="width:auto;margin:0"> Open to work (shows a badge on your public profile)</label>
      <label>Pinned work 1 title</label><input type="text" id="f-sn-title" maxlength="80" placeholder="My favourite plot">
      <label>Pinned work 1 code (runs live on your profile; max 2000 chars; clear to remove)</label>
      <textarea id="f-sn-code" maxlength="2000" placeholder="library(ggplot2)&#10;..."></textarea>
      <label>Pinned work 2 title</label><input type="text" id="f-sn2-title" maxlength="80">
      <label>Pinned work 2 code</label>
      <textarea id="f-sn2-code" maxlength="2000"></textarea>
      <label>Pinned work 3 title</label><input type="text" id="f-sn3-title" maxlength="80">
      <label>Pinned work 3 code</label>
      <textarea id="f-sn3-code" maxlength="2000"></textarea>
      <div class="row"><button class="btn primary" id="own-save" type="button">Save profile</button><span class="msg" id="own-msg"></span></div>
    </div>
  </div>`;
}

function showcaseBlock(items: Array<{ title: string; code: string; note?: string }>): string {
  return `<div class="card" id="showcase"><h2>Showcase <small>pinned by the learner &middot; runs in your browser</small></h2>
    ${items.map((it) => onePiece(it)).join("")}</div>`;
}

function onePiece(it: { title: string; code: string; note?: string }): string {
  const title = it.title;
  const code = it.code;
  return `<div class="webrcard">
    ${it.note ? `<p class="sub" style="margin:0 0 8px">${escHtml(it.note)}</p>` : ""}
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
    <div class="report"><a href="mailto:selva86@gmail.com?subject=Report%20profile%20snippet" style="color:inherit">Report this piece</a></div>
  </div>`;
}

function donutSvg(byDiff: Record<string, number>): string {
  const order = ["beginner", "intermediate", "advanced"];
  const colors: Record<string, string> = { beginner: "#85a8ea", intermediate: "#4272d4", advanced: "#1f4eb8", other: "#c9cfd9" };
  const entries: Array<[string, number]> = order.filter((k) => byDiff[k]).map((k) => [k, byDiff[k]]);
  const other = Object.entries(byDiff).filter(([k]) => !order.includes(k)).reduce((a, [, v]) => a + v, 0);
  if (other) entries.push(["other", other]);
  const total = entries.reduce((a, [, v]) => a + v, 0);
  if (!total) return "";
  const R = 41, C = 2 * Math.PI * R;
  let off = 0, segs = "";
  for (const [k, v] of entries) {
    const frac = v / total;
    segs += `<circle r="${R}" cx="49" cy="49" fill="none" stroke="${colors[k] || colors.other}" stroke-width="9" stroke-linecap="round" stroke-dasharray="${(frac * C).toFixed(1)} ${C.toFixed(1)}" stroke-dashoffset="${(-off * C).toFixed(1)}" transform="rotate(-90 49 49)"/>`;
    off += frac;
  }
  return `<svg width="98" height="98" viewBox="0 0 98 98" aria-label="${total} exercises solved">
    <circle cx="49" cy="49" r="${R}" fill="none" stroke="#eef1f6" stroke-width="9"/>${segs}
    <text x="49" y="46" text-anchor="middle" font-family="Inter Tight" font-size="22" font-weight="700" fill="#16181d">${total}</text>
    <text x="49" y="62" text-anchor="middle" font-size="10" fill="#667085">solved</text></svg>`;
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
      <div class="page" style="grid-template-columns:1fr">
      <div>
      ${ownerBar()}
      <div class="private-card" id="private-card">
        <h2 style="font-size:22px">This profile is private</h2>
        <p class="sub" style="margin:10px 0 16px">The learner has chosen to keep their progress to themselves.</p>
        <a href="/">Explore r-statistics.co &rarr;</a>
      </div>
      </div></div>
      ${ownerScript(raw)}`), 200);
  }

  context.waitUntil(bumpProfileView(DB, raw));

  const yearParam = Number(new URL(context.request.url).searchParams.get("year")) || 0;
  const thisYear = new Date().getUTCFullYear();
  const minYear = Math.max(2025, new Date(u.created_at * 1000).getUTCFullYear());
  const year = yearParam >= minYear && yearParam <= thisYear ? yearParam : thisYear;

  const [stats, deltas] = await Promise.all([
    loadProfileStats(DB, u.id, u.total_xp || 0),
    monthlyDeltas(DB, u.id),
  ]);
  const extras = parseProfileJson(u.profile_json);
  const THEMES: Record<string, [string, string]> = {
    forest: ["#0d2418", "#12352a"], plum: ["#231031", "#331b49"],
    slate: ["#15171c", "#20242c"], ember: ["#2a130c", "#3c2012"],
  };
  const themeVars = extras.theme && THEMES[extras.theme]
    ? `<style>:root{--hero-a:${THEMES[extras.theme][0]};--hero-b:${THEMES[extras.theme][1]}}</style>`
    : "";
  const showcaseItems: Array<{ title: string; code: string; note?: string }> =
    (extras.pinned && extras.pinned.length ? extras.pinned : (extras.snippet?.code
      ? [{ title: extras.snippet.title || "Pinned snippet", code: extras.snippet.code }] : [])).slice(0, 3);
  const tier = computeTier(u.total_xp || 0, stats.exercises_solved, stats.certificates.length);
  const xpPct = await xpPercentiles(DB, context.env.KV, u.total_xp || 0, deltas.xp30).catch(() => ({ alltime: null, month: null }));

  // badge sweep (lazy backfill) + render data
  const bctx: BadgeCtx = {
    xp: u.total_xp || 0,
    solved: stats.exercises_solved,
    certs: stats.certificates,
    streakBest: Math.max(u.longest_streak_days || 0, u.current_streak_days || 0),
    quizBestScore: 0,   // filled below
    createdAt: u.created_at,
    tierIndex: tier.index,
    activeDays: stats.heatmap.filter((h) => h.n > 0).length,
    profileReady: !!(extras.bio && (extras.website || extras.resume || extras.github || u.github_login || (extras.projects || []).length)),
  };
  const quizBest = await DB.prepare(
    "SELECT COALESCE(MAX(score),0) AS s FROM quiz_attempts WHERE user_id = ?1 AND passed = 1"
  ).bind(u.id).first<{ s: number }>().catch(() => ({ s: 0 } as { s: number }));
  bctx.quizBestScore = Number((quizBest as { s?: number })?.s ?? 0);
  await awardBadges(DB, u.id, bctx);
  const [owned, rarity, boardRows, xpChart, rankDelta] = await Promise.all([
    loadUserBadges(DB, u.id),
    badgeRarity(context.env),
    year === thisYear
      ? Promise.resolve(stats.heatmap.filter((h) => h.day.startsWith(String(thisYear))))
      : loadBoardRows(DB, u.id, year),
    renderXpChartSvg(DB, u.id, stats.certificates),
    captureAndDeltaRank(DB, u.id, stats.rank),
  ]);

  const memberSince = new Date(u.created_at * 1000).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const initial = name.trim().charAt(0).toUpperCase() || "R";
  const avatar = u.avatar_url ? `<img src="${escHtml(u.avatar_url)}" alt="" referrerpolicy="no-referrer">` : initial;
  const pro = isProActive(u) ? '<span class="hchip pro">PRO</span>' : "";

  // hero ring: progress within the current tier band toward the next
  const ringFrac = tier.next ? Math.max(0.04, Math.min(0.96, tier.index / 5 + 0.2 * 0.62)) : 1;
  const ringLen = (ringFrac * 427.3).toFixed(1);

  const otw = extras.open_to_work
    ? `<span class="hchip otw">Open to work${extras.role ? `: ${escHtml(extras.role)}` : ""}${extras.work_pref && extras.work_pref !== "any" ? ` &middot; ${escHtml(extras.work_pref)}` : ""}</span>`
    : "";
  const curr = stats.currently_learning ? `<span class="hchip">Deep in ${escHtml(stats.currently_learning)} this month</span>` : "";
  const pctChips =
    (xpPct.alltime ? `<span class="hchip">Top ${xpPct.alltime}% by XP</span>` : "") +
    (xpPct.month ? `<span class="hchip">Top ${xpPct.month}% this month</span>` : "");

  const pct = stats.rank && stats.learners_total ? Math.max(1, Math.ceil((stats.rank / stats.learners_total) * 100)) : null;

  const board = renderBoardHtml(boardRows, year);
  const years: number[] = [];
  for (let y = thisYear; y >= minYear; y--) years.push(y);
  const yearTabs = years.map((y) =>
    `<a href="/u/${escHtml(raw)}?year=${y}#activity" class="${y === year ? "on" : ""}">${y}</a>`).join("");

  // solved ring split
  const bd = stats.by_difficulty;
  const dTotal = Object.values(bd).reduce((a, b) => a + b, 0);
  const diffRows = (["beginner", "intermediate", "advanced"] as const).map((k) => {
    const v = bd[k] || 0;
    const w = dTotal ? Math.round((v / Math.max(1, stats.exercises_solved)) * 100) : 0;
    const col = { beginner: "#85a8ea", intermediate: "#4272d4", advanced: "#1f4eb8" }[k];
    return `<div class="diffrow"><span class="nm">${k[0].toUpperCase() + k.slice(1)}</span><span class="bar"><i style="width:${w}%;background:${col}"></i></span><span class="ct">${v}</span></div>`;
  }).join("");

  // skills matrix: per-track difficulty chips need pairs by track+difficulty
  const skillRows = stats.by_track.map((t) => {
    const parts: string[] = [];
    if (t.beginner) parts.push(`<span class="mchip">${t.beginner} beginner</span>`);
    if (t.intermediate) parts.push(`<span class="mchip">${t.intermediate} intermediate</span>`);
    if (t.advanced) parts.push(`<span class="mchip">${t.advanced} advanced</span>`);
    const chips = parts.join("") || `<span class="mchip"><b>${t.solved}</b> graded exercise${t.solved === 1 ? "" : "s"} solved</span>`;
    return `<div class="skillrow"><div class="nm">${escHtml(t.track)}</div>
      <div class="mchips">${chips}</div>
      <div class="tot">${t.solved}<span>solved</span></div></div>`;
  }).join("");

  // badges: earned first (by award date), then locked with progress
  const rarLine = (id: string) => {
    const n = rarity[id] || 0;
    return n >= 3 ? `<div><span class="rar">held by ${n} learners</span></div>` : "";
  };
  let badgeCards = "";
  let earnedCount = 0;
  for (const def of BADGE_DEFS) {
    const t = def.test(bctx);
    const has = owned.has(def.id) || t.earned;
    if (has) {
      earnedCount++;
      const when = owned.get(def.id);
      badgeCards += `<div class="bdg">${badgeArt(def.shape, def.color, def.glyph)}<b>${escHtml(def.name)}</b><span>${escHtml(when ? "earned " + new Date(when * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : def.blurb)}</span>${rarLine(def.id)}</div>`;
    }
  }
  for (const cb of certBadges(bctx)) {
    earnedCount++;
    badgeCards += `<div class="bdg">${badgeArt("shield", "#2056d2", cb.name.split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase())}<b>${escHtml(cb.name)}</b><span>${escHtml(cb.blurb)}</span>${rarLine(cb.id)}</div>`;
  }
  let lockedCount = 0;
  for (const def of BADGE_DEFS) {
    const t = def.test(bctx);
    if (owned.has(def.id) || t.earned) continue;
    lockedCount++;
    badgeCards += `<div class="bdg locked">${badgeArt(def.shape, def.color, def.glyph)}<b>${escHtml(def.name)}</b><span>${escHtml(t.note)}</span><div class="pbar"><i style="width:${Math.round(t.progress * 100)}%"></i></div></div>`;
  }

  const certCards = stats.certificates.map((c) => `
    <div class="cert">
      <span class="vrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6 9 17l-5-5"/></svg>VERIFIED</span>
      <b>${escHtml(c.track_name || "Certificate")}</b>
      <span class="meta">Issued ${new Date(c.issued_at * 1000).toLocaleDateString("en-GB", { month: "long", year: "numeric" })} &middot; ID ${escHtml(c.public_id)}</span>
      <div class="row">
        <a href="/cert/${escHtml(c.public_id)}">View credential</a>
        <a class="li" href="${escHtml(linkedInAddUrl(c))}" target="_blank" rel="noopener">Add to LinkedIn</a>
        <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://r-statistics.co/cert/${c.public_id}`)}" target="_blank" rel="noopener">Share</a>
        <a href="/u/${escHtml(raw)}/cert-card.svg?id=${escHtml(c.public_id)}" target="_blank" rel="noopener">Card</a>
      </div>
    </div>`).join("");

  // Timeline: collapse same-day runs of solves in one hub into a single row,
  // then interleave badge awards; newest first, capped at 12 rows.
  type FeedRow = { at: number; col: string; text: string; xp: number | null };
  const feed: FeedRow[] = [];
  for (const r of stats.recent) {
    const day = new Date(r.at * 1000).toISOString().slice(0, 10);
    const hub = (r.ref || "").split("|")[0];
    const prev = feed[feed.length - 1] as (FeedRow & { _day?: string; _hub?: string; _n?: number }) | undefined;
    if (r.action === "exercise.passed" && prev && (prev as { _day?: string })._day === day && (prev as { _hub?: string })._hub === hub) {
      const px = prev as FeedRow & { _day: string; _hub: string; _n: number };
      px._n += 1;
      px.xp = (px.xp || 0) + r.xp;
      px.text = `Solved ${px._n} exercises in ${hub.replace(/-/g, " ")}`;
      continue;
    }
    const row: FeedRow & { _day?: string; _hub?: string; _n?: number } = {
      at: r.at,
      col: r.action === "cert.earned" ? "#a16207" : r.action === "streak.day" ? "#a16207" : r.action === "daily.bonus" ? "#0f7a52" : "#2056d2",
      text: r.action === "daily.bonus" ? "Completed the daily set" : describeAction(r.action, r.ref),
      xp: r.xp,
    };
    if (r.action === "exercise.passed") { row._day = day; row._hub = hub; row._n = 1; }
    feed.push(row);
  }
  {
    const names = new Map(BADGE_DEFS.map((d) => [d.id, d.name]));
    const badgeEvents = Array.from(owned, ([id, at]) => ({ id, at }))
      .filter((b) => names.has(b.id)).sort((a, b) => b.at - a.at).slice(0, 5);
    for (const b of badgeEvents) {
      feed.push({ at: b.at, col: "#7c3aed", text: `Earned the ${names.get(b.id)} badge`, xp: null });
    }
  }
  feed.sort((a, b) => b.at - a.at);
  const recentRows = feed.slice(0, 12).map((r) => {
    return `<tr><td class="ic"><span class="dot" style="background:${r.col}"></span></td><td>${escHtml(r.text)}</td>` +
      `<td class="xp">${r.xp ? `+${r.xp} XP` : ""}</td>` +
      `<td class="when">${new Date(r.at * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</td></tr>`;
  }).join("");

  // streak week strip from the current-year rows
  const today = new Date();
  const weekCells: string[] = [];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const byDayMap = new Map(stats.heatmap.map((h) => [h.day, h.n]));
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i));
    const key = d.toISOString().slice(0, 10);
    const hit = (byDayMap.get(key) || 0) > 0;
    const cls = i === 0 ? (hit ? "hit today" : "today") : (hit ? "hit" : "");
    weekCells.push(`<div class="${cls}"><i></i>${dayNames[d.getUTCDay()]}</div>`);
  }

  const hasActivity = stats.exercises_solved > 0 || (u.total_xp || 0) > 0 || stats.pages_read > 0;

  const ogDesc = `${u.display_name || "An R learner"}: ${(u.total_xp || 0).toLocaleString()} XP, ${stats.exercises_solved} exercises solved` +
    (stats.certificates.length ? `, ${stats.certificates.length} certificate${stats.certificates.length > 1 ? "s" : ""}` : "") +
    " on r-statistics.co";
  const extraHead =
    `<meta property="og:title" content="${escHtml(u.display_name || "R learner")} on r-statistics.co">` +
    `<meta property="og:description" content="${escHtml(ogDesc)}">` +
    `<meta property="og:type" content="profile">` +
    `<meta property="og:url" content="https://r-statistics.co/u/${escHtml(raw)}">` +
    `<meta name="twitter:card" content="summary">` +
    (showcaseItems.length ? `<link rel="stylesheet" href="/www/webr.css">` : "") +
    themeVars;

  const hero = `
  <header class="hero">
    <div class="hero-in">
      <div class="ringwrap">
        <svg viewBox="0 0 148 148" aria-label="Tier progress">
          <circle cx="74" cy="74" r="68" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="7"/>
          <circle cx="74" cy="74" r="68" fill="none" stroke="#d9a021" stroke-width="7"
                  stroke-linecap="round" stroke-dasharray="${ringLen} 427.3" transform="rotate(-90 74 74)"/>
        </svg>
        <div class="avatar">${avatar}</div>
        <span class="tierpin" style="background:${tier.color}">${escHtml(tier.name.toUpperCase())}</span>
      </div>
      <div class="hid">
        <h1>${name}</h1>
        <div class="handle">r-statistics.co/u/${escHtml(raw)}</div>
        ${extras.bio ? `<p class="bio">${escHtml(extras.bio)}</p>` : ""}
        <div class="hchips">${pro}${pctChips}${otw}${curr}</div>
        <div class="hmeta">
          <span>Member since <b>${memberSince}</b></span>
          ${tier.next ? `<span>${escHtml(tier.next.line)}</span>` : "<span>Top of the ladder</span>"}
        </div>
      </div>
      <div class="hstats">
        <div class="hstat"><b>${(u.total_xp || 0).toLocaleString()}</b><span>total XP</span>${deltas.xp30 ? `<div class="delta">+${deltas.xp30.toLocaleString()} this month</div>` : ""}</div>
        <div class="hstat"><b>${stats.exercises_solved.toLocaleString()}</b><span>solved</span>${deltas.solved30 ? `<div class="delta">+${deltas.solved30} this month</div>` : ""}</div>
        <div class="hstat"><b>${u.current_streak_days || 0}</b><span>day streak</span><div class="delta">best ${Math.max(u.longest_streak_days || 0, u.current_streak_days || 0)}</div></div>
        <div class="hstat"><b>${stats.rank ? "#" + stats.rank.toLocaleString() : "&ndash;"}</b><span>${stats.rank ? "of " + stats.learners_total.toLocaleString() + " by XP" : "rank"}</span>${pct ? `<div class="delta">Top ${pct}%</div>` : ""}</div>
      </div>
    </div>
    <nav class="heronav">
      <a class="on" href="#top">Overview</a>
      <a href="#activity">Activity</a>
      <a href="#skills">Skills</a>
      <a href="#badges">Badges</a>
      ${certCards ? '<a href="#certs">Certificates</a>' : ""}
      ${extras.snippet?.code ? '<a href="#showcase">Showcase</a>' : ""}
    </nav>
  </header>`;

  const links: string[] = [];
  if (extras.resume) links.push(`<a class="lbtn em" href="${escHtml(extras.resume)}" target="_blank" rel="noopener nofollow"><span>Resume</span></a>`);
  if (u.github_login) links.push(`<a class="lbtn" href="https://github.com/${escHtml(u.github_login)}" target="_blank" rel="noopener nofollow">GitHub<span class="tag">VERIFIED</span></a>`);
  else if (extras.github) links.push(`<a class="lbtn" href="${escHtml(extras.github)}" target="_blank" rel="noopener nofollow">GitHub</a>`);
  if (extras.website) {
    let wl = "Website";
    try { wl = new URL(extras.website).hostname.replace(/^www\./, ""); } catch { /* default */ }
    links.push(`<a class="lbtn" href="${escHtml(extras.website)}" target="_blank" rel="noopener nofollow me">${escHtml(wl)}</a>`);
  }
  (extras.projects || []).forEach((p, i) => {
    let label = `Project ${i + 1}`;
    try {
      const uo = new URL(p);
      label = uo.hostname.includes("github.com") ? uo.pathname.split("/").filter(Boolean).slice(-1)[0] || label : uo.hostname.replace(/^www\./, "");
    } catch { /* default */ }
    links.push(`<a class="lbtn" href="${escHtml(p)}" target="_blank" rel="noopener nofollow">${escHtml(label)}</a>`);
  });

  const body = `
  ${hero}
  <div class="page" id="top">
    <aside class="rail">
      ${links.length ? `<div class="card"><h2>Links</h2><div class="linkcol">${links.join("")}</div></div>` : ""}
      <div class="card">
        <div class="streakhead">
          <svg class="flame" viewBox="0 0 46 46" aria-hidden="true">
            <path d="M23 4c2 7-6 9-6 16a6 6 0 0 0 12 0c0-3-2-5-2-8 5 3 9 8 9 14a13 13 0 0 1-26 0C10 16 20 12 23 4z" fill="#e88b1f"/>
            <path d="M23 20c1 4-3 5-3 8a3 3 0 0 0 6 0c0-3-2-4-3-8z" fill="#ffd166"/>
          </svg>
          <div><b>${u.current_streak_days || 0}</b><div class="lbl">day streak</div></div>
          <div class="best">best<br>${Math.max(u.longest_streak_days || 0, u.current_streak_days || 0)}</div>
        </div>
        <div class="weekstrip">${weekCells.join("")}</div>
      </div>
      <div class="card" style="display:flex;flex-direction:column;gap:8px">
        <div class="sub" style="font-size:12.5px">Views this month are shown to the profile owner. Consistency: active ${stats.weeks_active_26} of the last 26 weeks &middot; ${stats.pages_read.toLocaleString()} pages read &middot; ${stats.quizzes_passed} quiz${stats.quizzes_passed === 1 ? "" : "zes"} passed.</div>
      </div>
    </aside>
    <main class="main">
      ${ownerBar()}
      <div class="perfrow">
        <div class="card">
          <h2>Standing</h2>
          ${stats.rank ? `
          <div class="rankring">
            <svg width="92" height="92" viewBox="0 0 92 92" aria-label="Top ${pct} percent of learners">
              <circle cx="46" cy="46" r="40" fill="none" stroke="#eef1f6" stroke-width="8"/>
              <circle cx="46" cy="46" r="40" fill="none" stroke="#2056d2" stroke-width="8"
                      stroke-linecap="round" stroke-dasharray="${(251.3 * (1 - (pct || 100) / 100)).toFixed(1)} 251.3" transform="rotate(-90 46 46)"/>
              <text x="46" y="43" text-anchor="middle" font-family="Inter Tight" font-size="17" font-weight="700" fill="#16181d">Top</text>
              <text x="46" y="61" text-anchor="middle" font-family="Inter Tight" font-size="17" font-weight="700" fill="#16181d">${pct}%</text>
            </svg>
            <div>
              <div class="bignum">#${stats.rank.toLocaleString()}</div>
              <div class="sub">of ${stats.learners_total.toLocaleString()} learners by XP</div>
              ${rankDelta && rankDelta > 0 ? `<div class="sub" style="margin-top:6px;color:#0f7a52;font-weight:600">up ${rankDelta} place${rankDelta === 1 ? "" : "s"} since last week</div>` : ""}
              ${rankDelta && rankDelta < 0 ? `<div class="sub" style="margin-top:6px">down ${-rankDelta} place${rankDelta === -1 ? "" : "s"} since last week</div>` : ""}
            </div>
          </div>` : `<div class="sub">Rank appears once the learner base passes 100.</div>`}
        </div>
        <div class="card">
          <h2>Solved <small>${stats.exercises_solved} graded exercise${stats.exercises_solved === 1 ? "" : "s"}</small></h2>
          <div class="solvedwrap">
            ${donutSvg(stats.by_difficulty) || '<div class="sub">No graded work yet.</div>'}
            <div class="solvedlegend">${diffRows}
              <div class="sub">${stats.exercises_attempts.toLocaleString()} attempts across ${stats.hubs_practiced} topic${stats.hubs_practiced === 1 ? "" : "s"}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="card" id="activity">
        <div class="board-head">
          <h2>Activity</h2>
          <div class="yeartabs">${yearTabs}</div>
          <span class="board-sum">${board.summary}</span>
        </div>
        <div class="boardscroll"><div class="board">${board.html}</div></div>
        <div class="legend">Less <i style="background:#eef1f6"></i><i style="background:#c3d4f2"></i><i style="background:#85a8ea"></i><i style="background:#4272d4"></i><i style="background:#1f4eb8"></i> More</div>
      </div>
      ${xpChart ? `<div class="card"><h2>XP over the year <small>cumulative, milestones marked</small></h2><div class="chartwrap">${xpChart}</div></div>` : ""}
      ${skillRows ? `<div class="card" id="skills"><h2>Skills <small>from graded exercises, not self-reported</small></h2>${skillRows}</div>` : ""}
      <div class="card" id="badges">
        <h2>Badges <small>${earnedCount} earned${lockedCount ? `, ${lockedCount} in progress` : ""}</small></h2>
        <div class="badgegrid">${badgeCards}</div>
      </div>
      ${certCards ? `<div class="card" id="certs"><h2>Certificates <small>issuer-verified, employer-checkable</small></h2><div class="certgrid">${certCards}</div></div>` : ""}
      ${showcaseItems.length ? showcaseBlock(showcaseItems) : ""}
      ${recentRows ? `<div class="card"><h2>Recent activity</h2><table class="feed">${recentRows}</table></div>` : ""}
      ${!hasActivity ? `<div class="card"><h2>Just getting started</h2><p class="sub">This learner joined in ${memberSince} and the journey is just beginning. Progress shows up here as they solve graded exercises and earn certificates.</p></div>` : ""}
      <div class="foot">Profiles show learning activity only; contact details are never published.
        Want a page like this? <a href="/signin.html">Start learning free</a>.</div>
    </main>
  </div>
  ${showcaseItems.length ? `<script src="/www/webr-init.js" defer></script>` : ""}
  ${ownerScript(raw)}`;

  return htmlResponse(shell(`${u.display_name || "R learner"} - learner profile`, body, extraHead), 200);
};
