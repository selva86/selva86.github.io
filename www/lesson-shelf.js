// Dashboard: "Your open lessons" shelf + the mini-course catalog + badges.
// Renders into #dh-shelf-host on dashboard.html.
//
// The catalog shows EVERY mini course (owner 2026-08-17): free members see
// an attractive locked wall that invites the Pro upgrade; Pro members get
// straight into any built lesson. Data: /api/nurture/catalog (public) +
// /api/me/shelf (authed). Pro state: body.pro via auth-hydrate (we listen
// for auth-hydrated and re-render, so the wall never flashes wrongly).
(function(){
  'use strict';
  var host = document.getElementById('dh-shelf-host');
  if (!host) return;

  var CSS = [
    '.mc-sect{margin-top:14px}',
    '.mc-head{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;margin:0 0 4px}',
    '.mc-head h2{margin:0}',
    '.mc-sub{font-size:13px;color:var(--mut,#64748b);margin:0 0 12px}',
    '.mc-cta{margin-left:auto;font-size:13px;font-weight:600;text-decoration:none;background:#6d28d2;color:#fff;padding:7px 14px;border-radius:8px;white-space:nowrap}',
    '.mc-cta:hover{background:#5c1fb4;color:#fff}',
    'html.dark .mc-cta{background:#7c3aed}',
    '.mc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px}',
    '.mc-card{position:relative;display:block;border:1px solid var(--line,#e7ebf1);border-radius:12px;padding:14px 16px;text-decoration:none;color:inherit;background:var(--card,#fff);transition:transform .15s ease,box-shadow .15s ease,border-color .15s ease}',
    '.mc-card:hover{transform:translateY(-2px);box-shadow:0 6px 18px rgba(2,6,23,.08);border-color:#c7b3f2;text-decoration:none;color:inherit}',
    'html.dark .mc-card:hover{box-shadow:0 6px 18px rgba(0,0,0,.4)}',
    '.mc-title{font-weight:700;font-size:14.5px;letter-spacing:-.01em;margin:0 0 2px;padding-right:52px}',
    '.mc-meta{font-size:12px;color:var(--mut,#64748b);margin:0 0 8px}',
    '.mc-parts{margin:0;padding:0;list-style:none;font-size:12.5px;color:var(--mut,#64748b)}',
    '.mc-parts li{padding:3px 0;border-top:1px solid var(--line,#eef1f5);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.mc-parts li b{color:inherit;font-weight:400}',
    '.mc-parts li.mc-open b{color:var(--ink,#1e293b);font-weight:600}',
    '.mc-more{font-size:12px;color:var(--mut,#94a3b8);padding-top:5px}',
    '.mc-chip{position:absolute;top:12px;right:12px;font-size:10.5px;font-weight:700;letter-spacing:.04em;padding:3px 9px;border-radius:99px}',
    '.mc-chip.lock{background:#f1e9ff;color:#6d28d2}',
    'html.dark .mc-chip.lock{background:#3b2a5e;color:#d6bcfa}',
    '.mc-chip.pro{background:#dcfce7;color:#166534}',
    'html.dark .mc-chip.pro{background:#14532d;color:#bbf7d0}',
    '.mc-chip.soon{background:var(--line,#eef1f5);color:var(--mut,#64748b)}',
    '.mc-lockrow{display:flex;align-items:center;gap:6px;margin-top:10px;font-size:12.5px;font-weight:600;color:#6d28d2}',
    'html.dark .mc-lockrow{color:#b794f6}',
    '.mc-lockrow svg{flex:none}'
  ].join('\n');

  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function token(){
    try{
      for (var i=0;i<localStorage.length;i++){
        var k = localStorage.key(i);
        if (/^sb-.*-auth-token$/.test(k)){
          var v = JSON.parse(localStorage.getItem(k));
          return (Array.isArray(v) ? v[0] : (v && v.access_token)) || null;
        }
      }
    }catch(e){}
    return null;
  }
  var LOCK = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/></svg>';

  var cat = null, shelf = { open: [], badges: [] };
  var optin = null;   // null = unknown; else {decided, nurture, offers}
  var OPTIN_DISMISS_KEY = 'rsc-optin-dismiss';
  var OPTIN_ROUTE_KEY = 'rsc-optin-routed';

  function isPro(){ return document.body.classList.contains('pro'); }

  // The daily-series consent state drives two things here:
  //  - undecided users (nudge/one-tap signups who never passed signin.html,
  //    plus accounts that predate the screen) get routed to the one-time
  //    opt-in screen, once per session so a failing API can never ping-pong;
  //  - decided-but-off users get a quiet retry card, dismissable for 14 days.
  // PAUSED until the daily-lesson series launches (owner, 2026-08-18):
  // flip OPTIN_LIVE to true on launch day to restore the dashboard routing
  // and the retry card.
  var OPTIN_LIVE = true;

  function checkOptin(tok){
    if (!OPTIN_LIVE || !tok || optin) return;
    fetch('/api/me/email-optin', { headers: { Authorization: 'Bearer ' + tok } })
      .then(function(r){ if (!r.ok) throw 0; return r.json(); })
      .then(function(s){
        optin = s;
        if (!s.decided){
          var routed = false;
          try{ routed = !!sessionStorage.getItem(OPTIN_ROUTE_KEY); }catch(e){}
          if (!routed){
            try{ sessionStorage.setItem(OPTIN_ROUTE_KEY, '1'); }catch(e){}
            location.href = '/email-optin.html?next=%2Fdashboard.html';
            return;
          }
        }
        render();
      }).catch(function(){});
  }

  function optinCardHtml(){
    if (!optin || !optin.decided || optin.nurture) return '';
    try{
      var at = parseInt(localStorage.getItem(OPTIN_DISMISS_KEY) || '0', 10) || 0;
      if (Date.now() - at < 14 * 86400e3) return '';
    }catch(e){}
    return '<section class="card" data-optin-card>' +
      '<h2 style="margin:0 0 4px">The daily lesson series</h2>' +
      '<p class="dh-sub" style="margin:0 0 14px">A five-minute interactive R lesson in your inbox each morning, free. Every email opens that day&#39;s lesson for three days.</p>' +
      '<div style="display:flex;gap:10px;align-items:center">' +
      '<button class="mc-cta" style="margin:0;border:0;cursor:pointer;font:inherit;font-weight:600" data-optin-yes>Start getting the lessons</button>' +
      '<button style="appearance:none;border:0;background:none;cursor:pointer;color:var(--mut,#64748b);font:inherit;font-size:13.5px" data-optin-dismiss>Not now</button>' +
      '</div></section>';
  }

  function courseCard(c, pro){
    var built = c.parts.filter(function(p){ return p.status === 'built'; });
    var tease = c.parts.slice(0, 3);
    var rows = tease.map(function(p){
      var open = pro && p.status === 'built';
      return '<li' + (open ? ' class="mc-open"' : '') + '><b>' + (open ? '' : '') + esc(p.subject) + '</b></li>';
    }).join('');
    var more = c.parts.length > 3 ? '<div class="mc-more">+ ' + (c.parts.length - 3) + ' more lessons</div>' : '';
    var chip, href, aria;
    if (pro){
      if (built.length){
        chip = '<span class="mc-chip pro">INCLUDED</span>';
        href = '/' + built[0].slug + '.html';
        aria = 'Open ' + c.title;
      } else {
        chip = '<span class="mc-chip soon">IN PRODUCTION</span>';
        href = null; aria = c.title + ' (in production)';
      }
    } else {
      chip = '<span class="mc-chip lock">PRO</span>';
      href = '/pricing.html?from=minicourses';
      aria = c.title + ' (Pro)';
    }
    var lockrow = !pro ? '<div class="mc-lockrow">' + LOCK + ' Included with Pro</div>'
      : (built.length ? '<div class="mc-lockrow" style="color:#166534">' + built.length + ' of ' + c.parts.length + ' lessons ready</div>' : '');
    var inner = '<span class="mc-title">' + esc(c.title) + '</span>' + chip +
      '<p class="mc-meta">' + c.parts.length + ' short lessons</p>' +
      '<ul class="mc-parts">' + rows + '</ul>' + more + lockrow;
    if (href){
      return '<a class="mc-card" href="' + esc(href) + '" aria-label="' + esc(aria) + '" data-mc="' + esc(c.id) + '">' + inner + '</a>';
    }
    return '<div class="mc-card" aria-label="' + esc(aria) + '">' + inner + '</div>';
  }

  function render(){
    if (!cat) return;
    var pro = isPro();
    var html = optinCardHtml();

    if (shelf.open && shelf.open.length){
      html += '<section class="card"><h2>Your open lessons <span class="dh-sub">each stays open 3 days from its email</span></h2><div>' +
        shelf.open.map(function(o){
          var left = Math.max(1, Math.round((o.closes_at*1000 - Date.now())/36e5));
          return '<div style="display:flex;justify-content:space-between;gap:10px;align-items:baseline;padding:9px 0;border-top:1px solid var(--line,#e7ebf1)">' +
            '<a href="/' + esc(o.slug) + '.html" style="font-weight:600">' + esc(o.subject) + '</a>' +
            '<span class="dh-sub" style="white-space:nowrap">' + left + 'h left</span></div>';
        }).join('') + '</div></section>';
    }

    if (shelf.badges && shelf.badges.length){
      html += '<section class="card"><h2>Your badges <span class="dh-sub">mini courses completed, every check passed</span></h2>' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px">' +
        shelf.badges.map(function(b){
          return '<a href="/badge/' + esc(b.public_id) + '" style="display:inline-flex;align-items:center;gap:8px;border:1px solid var(--line,#e7ebf1);border-radius:99px;padding:7px 14px;font-size:13px;font-weight:600;text-decoration:none">🏆 ' + esc(b.badge.replace(/-/g,' ')) + '</a>';
        }).join('') + '</div></section>';
    }

    var cards = (cat.courses||[]).map(function(c){ return courseCard(c, pro); }).join('');
    html += '<section class="card mc-sect">' +
      '<div class="mc-head"><h2>Mini courses</h2>' +
      (!pro ? '<a class="mc-cta" href="/pricing.html?from=minicourses" data-mc-cta>Upgrade to Pro</a>' : '') +
      '</div>' +
      '<p class="mc-sub">' + (pro
        ? 'Short, focused interactive courses on the statistics people actually use. Every lesson is included with your Pro plan as it ships.'
        : 'Short, focused interactive courses on the statistics people actually use. Pro members open every lesson, anytime.') + '</p>' +
      '<div class="mc-grid">' + cards + '</div></section>';

    host.innerHTML = html;
  }

  host.addEventListener('click', function(e){
    var yes = e.target.closest('[data-optin-yes]');
    if (yes){
      yes.disabled = true;
      fetch('/api/me/email-optin', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ optin: true, surface: 'dashboard-card', default_state: 'off' })
      }).then(function(r){ if (!r.ok) throw 0; return r.json(); })
        .then(function(){
          optin.nurture = true;
          var card = host.querySelector('[data-optin-card]');
          if (card) card.innerHTML = '<h2 style="margin:0 0 4px">You&#39;re in</h2>' +
            '<p class="dh-sub" style="margin:0">The first lesson lands tomorrow morning. Watch for Akshay in your inbox.</p>';
          try{ if (typeof gtag === 'function') gtag('event', 'nurture_optin', { placement: 'dashboard-card' }); }catch(err){}
        }).catch(function(){ yes.disabled = false; });
      return;
    }
    var dis = e.target.closest('[data-optin-dismiss]');
    if (dis){
      try{ localStorage.setItem(OPTIN_DISMISS_KEY, String(Date.now())); }catch(err){}
      var c = host.querySelector('[data-optin-card]');
      if (c) c.remove();
      return;
    }
    var cta = e.target.closest('[data-mc-cta]');
    var card = e.target.closest('[data-mc]');
    try{
      if (typeof gtag === 'function'){
        if (cta) gtag('event', 'minicourse_upgrade_click', { placement: 'dashboard' });
        else if (card && card.getAttribute('href') && card.getAttribute('href').indexOf('/pricing') === 0){
          gtag('event', 'minicourse_locked_click', { course: card.dataset.mc });
        }
      }
    }catch(err){}
  });

  var style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  var tok = token();
  Promise.all([
    fetch('/api/nurture/catalog').then(function(r){ return r.json(); }),
    tok ? fetch('/api/me/shelf', { headers: { Authorization: 'Bearer ' + tok } })
        .then(function(r){ return r.ok ? r.json() : { open: [], badges: [] }; })
        : Promise.resolve({ open: [], badges: [] })
  ]).then(function(res){
    cat = res[0]; shelf = res[1] || shelf;
    render();
  }).catch(function(){});
  checkOptin(tok);

  // Pro state hydrates after first paint; re-render so the wall never lies.
  // auth-hydrate may also have refreshed an expired token, so re-check the
  // consent state with the fresh one.
  document.addEventListener('auth-hydrated', function(){
    render();
    checkOptin(token());
  });
})();
