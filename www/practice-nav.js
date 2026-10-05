/* practice-nav.js - the navbar Practice menu (design handoff 2026-10, option 2b
   "Practice by goal"). Upgrades the masthead Practice link (href /exercises/):
   desktop (>980px) gets a panel with a personal sidebar (continue where you left
   off, or a start-here suggestion), the featured sets by goal and the topics one
   row below; phones get a full-screen sheet from the drawer's Practice row.
   Progressive enhancement: with no JS the link still goes to /exercises/.

   Data: /practice-menu.json, generated from www/exercise-catalog.json by
   _build/gen_exercises_index.py on every build (counts are never typed by hand).
   Progress: /api/me/practice for signed-in learners, fetched on the first open.
   Styles: /www/practice-menu.css (CSS_V). Pages pin this script at ?v=16
   (immutable cache): a change here needs a ?v bump across pages + emitters. */
(function(){
  if (window.__practiceNav) return; window.__practiceNav = 1;

  var CSS_V = 1;
  var D = null, dataP = null, P = null, progAsked = false, signedIn = false, token = '';
  var ARR = ' &rarr;';
  var MEDAL = 'M12 14.5a5 5 0 1 1 0-10a5 5 0 1 1 0 10M12 7.3l.9 1.8 2 .3-1.45 1.4.35 2-1.8-.95-1.8.95.35-2-1.45-1.4 2-.3zM8.6 13.2L7 21l5-2.6 5 2.6-1.6-7.8';

  function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
  function ico(d, s){ return '<svg width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="'+d+'"/></svg>'; }
  function data(){
    dataP = dataP || fetch('/practice-menu.json').then(function(r){ return r.ok ? r.json() : null; }).then(function(d){ D = d; return d; }).catch(function(){ dataP = null; return null; });
    return dataP;
  }
  function ensureCss(){
    if (document.head.querySelector('link[data-pm-css]')) return;
    var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = '/www/practice-menu.css?v='+CSS_V;
    l.setAttribute('data-pm-css', ''); document.head.appendChild(l);
  }
  var fontsDone = false;
  function loadFonts(){
    if (fontsDone) return; fontsDone = true;
    if (!document.querySelector('link[href*="Plus+Jakarta+Sans"][href*="Source+Sans+3"]')){
      var f = document.createElement('link'); f.rel = 'stylesheet';
      f.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&family=Source+Sans+3:wght@400;600;700&display=swap';
      document.head.appendChild(f);
    }
  }

  /* ---------- shared pieces ---------- */
  function hubSolved(slug, n){ var v = P && P.hubs && P.hubs[slug]; return v ? Math.min(n, v) : 0; }
  function pill(slug, n){
    var d = hubSolved(slug, n);
    if (!signedIn || !P || !d) return '';
    return d >= n ? '<span class="pm-pill pm-done">Done</span>' : '<span class="pm-pill">'+d+'/'+n+'</span>';
  }
  function quizRow(){
    var q = D.quizzes;
    return '<a class="pm-a pm-quiz" href="'+q.href+'"><span class="pm-qt">'+ico(q.icon || MEDAL, 16)+'</span>'+
      '<span class="pm-qx"><b>Mastery quizzes</b><span>'+q.n+' timed, across '+q.topics+' topics</span></span><span class="pm-qc" aria-hidden="true">&rsaquo;</span></a>';
  }
  /* the sidebar: continue where you left off (signed in, unfinished hub), else start here */
  function cont(){
    if (!signedIn || !P || !P.last || !D.hubs[P.last.slug]) return null;
    var h = D.hubs[P.last.slug], total = P.last.total || h[1], solved = Math.min(total, P.last.solved || 0);
    return { slug: P.last.slug, label: h[2], title: h[0], solved: solved, total: total, pct: Math.round(100 * solved / Math.max(total, 1)), streak: (P.streak && P.streak.current) || 0 };
  }
  function sideHTML(){
    var c = cont();
    if (c) return '<span class="pm-kick">Continue practicing</span>'+
      '<span class="pm-sg">'+esc(c.label)+'</span><span class="pm-st pm-pj">'+esc(c.title)+'</span>'+
      '<span class="pm-sr"><span>'+c.solved+' of '+c.total+' solved</span>'+(c.streak ? '<span>'+c.streak+'-day streak</span>' : '')+'</span>'+
      '<span class="pm-bar" role="progressbar" aria-label="'+esc(c.title)+' progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+c.pct+'"><i style="width:'+c.pct+'%"></i></span>'+
      '<a class="pm-a pm-btn" href="/'+esc(c.slug)+'.html">Resume'+ARR+'</a>'+quizRow();
    var s = D.start, next = encodeURIComponent(location.pathname + location.search);
    return '<span class="pm-kick">Start here</span>'+
      '<span class="pm-sg">'+esc(s.goal)+'</span><span class="pm-st pm-pj">'+esc(s.t)+'</span>'+
      (signedIn ? '<span class="pm-sc">Solve in the browser, no setup. Your progress is saved as you go.</span>'
                : '<span class="pm-sc">Solve in the browser, no setup. <a class="pm-a pm-si" href="/signin.html?next='+next+'">Sign in</a> to save your progress.</span>')+
      '<a class="pm-a pm-btn" href="'+esc(s.h)+'">Start solving'+ARR+'</a>'+quizRow();
  }
  function mainHTML(){
    var goals = D.goals.map(function(g){
      return '<div class="pm-goal"><div class="pm-gh"><span class="pm-tile">'+ico(g.icon, 17)+'</span><span class="pm-gn pm-pj">'+esc(g.name)+'</span></div>'+
        '<div class="pm-gl">'+g.sets.map(function(s){
          return '<a class="pm-a pm-set" href="'+esc(s.h)+'" data-pm-hub="'+esc(s.s)+'" data-n="'+s.n+'"><span class="pm-sn">'+esc(s.t)+'</span>'+pill(s.s, s.n)+'</a>';
        }).join('')+'</div>'+
        '<a class="pm-a pm-gf" href="'+esc(g.href)+'">'+esc(g.all)+ARR+'</a></div>';
    }).join('');
    var chips = D.topics.map(function(t){
      return '<a class="pm-a pm-chip" href="'+esc(t.href)+'"><span class="pm-ci">'+ico(t.icon, 12)+'</span>'+esc(t.name)+' <span class="pm-cn">'+t.n+'</span></a>';
    }).join('');
    return '<div class="pm-goals">'+goals+'</div>'+
      '<div class="pm-topics"><span class="pm-tl">Or by topic</span><div class="pm-chips">'+chips+'</div></div>';
  }

  /* ---------- progress (signed in): one call, first open, cached 5 minutes ---------- */
  var drop = null, sheet = null;
  function paint(){
    if (!D) return;
    if (drop){
      drop.querySelector('[data-pm-side]').innerHTML = sideHTML();
      drop.querySelector('[data-pm-body]').innerHTML = mainHTML();
    }
    if (sheet) sheetFill();
  }
  function progress(){
    if (progAsked || !signedIn || !token) return; progAsked = true;
    var c = null; try { c = JSON.parse(sessionStorage.getItem('pm-prog') || 'null'); } catch (e) {}
    if (c && c.at > Date.now() - 300000 && c.P){ P = c.P; paint(); return; }
    fetch('/api/me/practice', { headers: { Authorization: 'Bearer ' + token } }).then(function(r){ return r.ok ? r.json() : null; }).then(function(j){
      if (!j) return; P = j;
      try { sessionStorage.setItem('pm-prog', JSON.stringify({ at: Date.now(), P: j })); } catch (e) {}
      paint();
    }).catch(function(){});
  }

  /* ---------- phone sheet ---------- */
  function sheetFill(){
    var body = sheet.querySelector('[data-pm-sbody]'), c = cont();
    if (!D){ body.innerHTML = '<a class="pm-srow" href="/exercises/">Browse the full library'+ARR+'</a>'; return; }
    var html = '';
    if (c) html += '<a class="pm-cont" href="/'+esc(c.slug)+'.html" aria-label="Continue '+esc(c.title)+', '+c.solved+' of '+c.total+' solved">'+
      '<span class="pm-ck">Continue</span><span class="pm-cr"><span class="pm-cn2 pm-pj">'+esc(c.title)+'</span><span class="pm-cs">'+c.solved+' of '+c.total+'</span></span>'+
      '<span class="pm-bar"><i style="width:'+c.pct+'%"></i></span></a>';
    html += D.goals.map(function(g){
      return '<div class="pm-card"><div class="pm-sch"><span class="pm-tile">'+ico(g.icon, 15)+'</span><span class="pm-pj">'+esc(g.name)+'</span></div>'+
        g.sets.map(function(s){ return '<a class="pm-srow" href="'+esc(s.h)+'"><span>'+esc(s.t)+'</span>'+(pill(s.s, s.n) || '<span class="pm-scnt">'+s.n+'</span>')+'</a>'; }).join('')+
        '<a class="pm-sall" href="'+esc(g.href)+'">'+esc(g.all)+ARR+'</a></div>';
    }).join('');
    html += '<div class="pm-card"><div class="pm-sch"><span class="pm-pj">By topic</span></div><div class="pm-schips">'+
      D.topics.map(function(t){ return '<a class="pm-chip" href="'+esc(t.href)+'"><span class="pm-ci">'+ico(t.icon, 12)+'</span>'+esc(t.name)+' <span class="pm-cn">'+t.n+'</span></a>'; }).join('')+
      '</div></div>';
    html += '<div class="pm-card pm-qcard">'+quizRow().replace('pm-a pm-quiz', 'pm-quiz')+'</div>';
    body.innerHTML = html;
  }
  var opener = null;
  function openSheet(from){
    ensureCss(); loadFonts();
    if (!sheet){
      sheet = document.createElement('div');
      sheet.className = 'pm-sheet'; sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true'); sheet.setAttribute('aria-label', 'Practice');
      sheet.innerHTML = '<div class="pm-top"><a class="pm-brand pm-pj" href="/"><img src="/logo-mark.svg" alt="" width="28" height="28">r-statistics.co</a>'+
        '<button class="pm-x" type="button" aria-label="Close menu">&times;</button></div>'+
        '<div class="pm-scroll" data-pm-sbody></div>'+
        '<div class="pm-pin"><a class="pm-pinb" href="/exercises/">Browse the full library'+ARR+'</a></div>';
      document.body.appendChild(sheet);
      sheet.querySelector('.pm-x').addEventListener('click', function(){ closeSheet(true); });
      sheet.addEventListener('keydown', function(e){
        if (e.key !== 'Tab') return;
        var f = Array.prototype.filter.call(sheet.querySelectorAll('a[href],button'), function(el){ return el.offsetParent !== null; });
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]){ e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]){ e.preventDefault(); f[0].focus(); }
      });
    }
    sheetFill();
    data().then(function(){ if (sheet) sheetFill(); });
    progress();
    opener = from || null;
    document.documentElement.classList.add('pm-lock');
    sheet.classList.add('pm-open');
    setTimeout(function(){ var x = sheet.querySelector('.pm-x'); if (x) x.focus(); }, 30);
  }
  function closeSheet(refocus){
    if (!sheet || !sheet.classList.contains('pm-open')) return;
    sheet.classList.remove('pm-open');
    document.documentElement.classList.remove('pm-lock');
    if (refocus && opener && opener.focus) opener.focus();
  }

  /* ---------- desktop panel ---------- */
  function desktop(link){
    ensureCss();
    var wrap = document.createElement('div'); wrap.className = 'pm-wrap';
    link.parentNode.insertBefore(wrap, link); wrap.appendChild(link);
    link.classList.add('pm-trigger');
    // One label sitewide: some older pages bake "Exercises" into the markup.
    for (var ci = 0; ci < link.childNodes.length; ci++){
      var tn = link.childNodes[ci];
      if (tn.nodeType === 3 && /^\s*Exercises\s*$/.test(tn.nodeValue)) tn.nodeValue = tn.nodeValue.replace('Exercises', 'Practice');
    }
    // One chevron: tutorials-nav.js adds the same .nav-car when it loads.
    if (!link.querySelector('.ex-caret') && !link.querySelector('svg')){
      link.insertAdjacentHTML('beforeend', '<svg class="nav-car" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>');
    }
    drop = document.createElement('div');
    drop.className = 'pm-drop'; drop.id = 'pm-practice';
    drop.setAttribute('role', 'region'); drop.setAttribute('aria-label', 'Practice');
    drop.innerHTML = '<div class="pm-side" data-pm-side></div>'+
      '<div class="pm-main"><div class="pm-hd"><span class="pm-h2 pm-pj">What are you practicing for?</span>'+
      '<a class="pm-a pm-lib" href="/exercises/">Browse the full library'+ARR+'</a></div><div class="pm-body" data-pm-body></div></div>';
    var bridge = document.createElement('div'); bridge.className = 'pm-bridge'; bridge.setAttribute('aria-hidden', 'true');
    wrap.appendChild(bridge); wrap.appendChild(drop);
    link.setAttribute('aria-haspopup', 'true'); link.setAttribute('aria-expanded', 'false'); link.setAttribute('aria-controls', 'pm-practice');
    function fixOn(){ var on = drop.querySelectorAll('a.on'); if (!on.length) return; on.forEach(function(a){ a.classList.remove('on'); }); link.classList.add('on'); }
    setTimeout(fixOn, 0); window.addEventListener('load', fixOn);

    var open = false, via = '', closeT = null, hideT = null;
    function place(){
      var cw = document.documentElement.clientWidth || window.innerWidth;
      var w = Math.min(1180, cw - 64);
      var header = link.closest('.sitenav') || link.closest('nav') || link.closest('header') || wrap.parentNode;
      var hb = header.getBoundingClientRect(), wb = wrap.getBoundingClientRect(), lb = link.getBoundingClientRect();
      var top = Math.round(hb.bottom - wb.top + 10), left = Math.round((cw - w) / 2 - wb.left);
      drop.style.width = w + 'px'; drop.style.left = left + 'px'; drop.style.top = top + 'px';
      /* the top two-thirds of the window: scale down (not below 0.8), then scroll inside */
      drop.style.maxHeight = 'none'; drop.style.setProperty('--pm-z', '1');
      var avail = Math.max(220, Math.floor(window.innerHeight * 2 / 3 - hb.bottom - 10));
      var natural = drop.offsetHeight, z = 1;
      if (natural > avail){
        z = Math.max(0.8, avail / natural);
        if (natural * z > avail + 1) drop.style.maxHeight = Math.floor(avail / z) + 'px';
      }
      drop.style.setProperty('--pm-z', String(Math.round(z * 1000) / 1000));
      var bw = Math.min(w, 380), bl = Math.round(lb.left + lb.width / 2 - bw / 2 - wb.left);
      bl = Math.max(left, Math.min(bl, left + w - bw));
      var bt = Math.round(lb.bottom - wb.top);
      bridge.style.left = bl + 'px'; bridge.style.width = bw + 'px'; bridge.style.top = bt + 'px'; bridge.style.height = Math.max(0, top - bt) + 'px';
    }
    function setOpen(o, how){
      if (o === open) return;
      clearTimeout(closeT); clearTimeout(hideT);
      open = o; via = o ? how : '';
      if (o){
        wrap.classList.add('pm-shown');
        loadFonts();
        if (!D) data().then(function(){ paint(); if (open) place(); });
        paint(); progress(); place(); void drop.offsetWidth;
      }
      else hideT = setTimeout(function(){ if (!open) wrap.classList.remove('pm-shown'); }, 180);
      wrap.classList.toggle('pm-open', o);
      document.documentElement.classList.toggle('pm-dopen', o);
      link.setAttribute('aria-expanded', o ? 'true' : 'false');
      if (o && how === 'key') setTimeout(function(){ var f = drop.querySelector('a[href]'); if (f) f.focus(); }, 60);
    }
    function canHover(){ return window.innerWidth > 980 && window.matchMedia('(hover:hover)').matches; }
    wrap.addEventListener('mouseenter', function(){ if (canHover()){ clearTimeout(closeT); data(); setOpen(true, 'hover'); } });
    wrap.addEventListener('mouseleave', function(){ if (canHover() && open) closeT = setTimeout(function(){ setOpen(false); }, 160); });
    link.addEventListener('click', function(e){
      if (window.innerWidth <= 980) return;
      e.preventDefault();
      if (e.detail === 0){ setOpen(!open, 'key'); return; }
      if (open && via === 'hover') return;
      setOpen(!open, 'click');
    });
    link.addEventListener('keydown', function(e){
      if (window.innerWidth <= 980) return;
      if (e.key === ' ' || e.key === 'Spacebar'){ e.preventDefault(); setOpen(!open, 'key'); }
      else if (e.key === 'ArrowDown'){ e.preventDefault(); if (!open) setOpen(true, 'key'); else { var f = drop.querySelector('a[href]'); if (f) f.focus(); } }
    });
    document.addEventListener('click', function(e){ if (open && !wrap.contains(e.target)) setOpen(false); });
    document.addEventListener('keydown', function(e){
      if (e.key !== 'Escape' || !open) return;
      var inside = wrap.contains(document.activeElement);
      setOpen(false); if (inside) link.focus();
    });
    wrap.addEventListener('focusout', function(e){ if (open && e.relatedTarget && !wrap.contains(e.relatedTarget)) setOpen(false); });
    window.addEventListener('resize', function(){ if (open){ if (window.innerWidth <= 980) setOpen(false); else place(); } });
    window.addEventListener('pageshow', function(e){ if (e.persisted && open) setOpen(false); });   // route change via back/forward cache
    if (canHover()){
      var idle = window.requestIdleCallback || function(f){ return setTimeout(f, 1500); };
      window.addEventListener('load', function(){ idle(function(){ data(); loadFonts(); }); });
    }
  }

  function init(){
    var link = document.querySelector('.sitenav .snav-links a[href="/exercises/"]') || document.querySelector('.masthead-nav-link[href="/exercises/"]') || document.querySelector('.nav a[href="/exercises/"]');
    if (link && !link.closest('.pm-wrap') && !link.closest('.xn-wrap')) desktop(link);
    // phones: the Practice row in any drawer opens the sheet
    Array.prototype.forEach.call(document.querySelectorAll('.mnav-link[href="/exercises/"]'), function(a){
      if (!a.querySelector('.ex-caret')) a.insertAdjacentHTML('beforeend', ' <span class="ex-caret" aria-hidden="true">&#9662;</span>');
    });
    document.addEventListener('click', function(e){
      var a = e.target && e.target.closest && e.target.closest('.mnav-link[href="/exercises/"],.snav-dlink[href="/exercises/"]');
      if (!a || window.innerWidth > 1023) return;
      e.preventDefault(); openSheet(a);
    });
    // Esc closes one layer (the sheet), not the drawer under it
    window.addEventListener('keydown', function(e){
      if (e.key !== 'Escape' || !sheet || !sheet.classList.contains('pm-open')) return;
      e.stopPropagation(); closeSheet(true);
    }, true);
  }

  document.addEventListener('auth-hydrated', function(e){
    var d = e && e.detail, me = d && d.me;
    if (d && d.token) token = d.token;
    var was = signedIn;
    signedIn = !!(me && me.user);
    if (!signedIn){ P = null; try { sessionStorage.removeItem('pm-prog'); } catch (x) {} }
    if (was !== signedIn) paint();
  });
  function boot(){
    init();
    if (document.body && document.body.classList.contains('state-pro')) signedIn = true;
  }
  if (document.readyState !== 'loading') boot();
  else document.addEventListener('DOMContentLoaded', boot);
})();
