/* roadmap-nav.js - the navbar Courses menu (design handoff 2026-10: 2a desktop
   panel, 2d phone sheet). Upgrades the masthead Courses link (href /roadmap/):
   desktop (>980px) gets a centred panel on hover / click / keyboard; phones get
   a full-screen sheet from the Courses row of whichever drawer the page has.
   Progressive enhancement: with no JS the link still goes to /roadmap/.
   Styles live in /www/courses-nav.css (CSS_V below). Pages pin this script at a
   frozen ?v with a short-TTL header, so edits ship without a page sweep; the CSS
   is a separate file so a stale cached copy of this script keeps its own CSS. */
(function(){
  if (window.__roadmapNav) return; window.__roadmapNav = 1;

  var CSS_V = 2;
  var R = '/roadmap/';
  /* Access labels follow what is published (courses.json, 2026-10-05): New to R
     is free in full; Data Analyst, Data Scientist and Forecaster open with a free
     Section 1; Researcher and R Developer lessons are still being published (no
     Section 1 yet); ML Engineer is planned and has no sign-up yet, so it offers
     the plan rather than a notification. Certificate names = _build/tracks-source.json. */
  var T = [
    {id:'newr', track:'foundations', name:'New to R', href:R+'new-to-r.html', cert:'Certified R Fundamentals',
     desc:'From your first line of R to writing your own functions. No experience needed, and every other track builds on it.',
     b:'free', bl:'Free', act:'Start free', sf:1, icon:'M5 8l4 4-4 4M12 16h7'},
    {id:'da', track:'analyst', name:'Data Analyst', href:R+'data-analyst.html', cert:'Certified R Data Analyst',
     desc:'Wrangle, visualize, report.', b:'free', bl:'Section 1 free', act:'Start free', sf:1,
     icon:'M4 20h16M6 20v-6M10 20V9M14 20v-8M18 20V5'},
    {id:'ds', track:'ds', name:'Data Scientist', href:R+'data-scientist.html', cert:'Certified R Data Scientist',
     desc:'Machine learning end to end.', b:'pro', bl:'Pro', act:'Try Section 1 free', sf:1,
     icon:'M8 7a2 2 0 1 1-4 0a2 2 0 1 1 4 0M20 7a2 2 0 1 1-4 0a2 2 0 1 1 4 0M14 17a2 2 0 1 1-4 0a2 2 0 1 1 4 0M8 7h8M7 9l4 6M17 9l-4 6'},
    {id:'fc', track:'ts', name:'Forecaster', href:R+'forecaster.html', cert:'Certified R Forecaster',
     desc:'From ARIMA to deep learning, with reliable prediction intervals.', b:'pro', bl:'Pro', act:'Try Section 1 free', sf:1,
     icon:'M3 17l5-5 4 3 6-7M14 8h4v4'},
    {id:'rs', track:'researcher', name:'Researcher', href:R+'researcher.html', cert:'Certified R Researcher',
     desc:'Statistical tests to mixed models, Bayesian and causal inference.', b:'pro', bl:'Pro', act:'See the roadmap',
     icon:'M3 19h18M4 18c3 0 4-11 8-11s5 11 8 11'},
    {id:'rd', track:'developer', name:'R Developer', href:R+'r-developer.html', cert:'Certified R Developer',
     desc:'Packages, performance, Shiny.', b:'pro', bl:'Pro', act:'See the roadmap',
     icon:'M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zM4 7.5l8 4.5 8-4.5M12 12v9'},
    {id:'ml', track:'', name:'ML Engineer', href:R+'ml-engineer.html', cert:'Certified R ML Engineer',
     desc:'Ship and operate ML in production.', b:'soon', bl:'Coming soon', act:'See the plan', soon:1,
     icon:'M4 5h16v5H4zM4 14h16v5H4zM8 7.5h.01M8 16.5h.01'}
  ];
  var BY = {}; T.forEach(function(t){ if (t.track) BY[t.track] = t; });
  var ARR = ' &rarr;';

  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;'); }
  function ico(d, s){ return '<svg width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="'+d+'"/></svg>'; }
  function badge(t){ return '<span class="cm-badge '+(t.b === 'soon' ? 'cm-soonb' : 'cm-'+t.b)+'">'+t.bl+'</span>'; }
  function tile(t, s){ return '<span class="cm-tile'+(t.soon ? ' cm-soon' : '')+'">'+ico(t.icon, s)+'</span>'; }
  function rowAttrs(t){ return ' href="'+t.href+'"'+(t.track ? ' data-cm-track="'+t.track+'"' : '')+(t.sf ? ' data-cm-sf="1"' : ''); }

  /* ---------- desktop panel (2a) ---------- */
  function coreRow(t){
    return '<a class="cm-a cm-row cm-core"'+rowAttrs(t)+'>'+tile(t, 19)+
      '<span class="cm-body"><span class="cm-nm"><span class="cm-name cm-pj">'+t.name+'</span>'+badge(t)+'</span>'+
      '<span class="cm-desc">'+t.desc+' <span class="cm-cl1">&middot; Earns</span> <span class="cm-cn">'+t.cert+'</span></span></span>'+
      '<span class="cm-act" data-cm-act>'+t.act+ARR+'</span></a>';
  }
  function specRow(t){
    return '<a class="cm-a cm-row"'+rowAttrs(t)+'>'+tile(t, 19)+
      '<span class="cm-body"><span class="cm-nm"><span class="cm-name cm-pj">'+t.name+'</span>'+badge(t)+'</span>'+
      '<span class="cm-desc">'+t.desc+'</span>'+
      '<span class="cm-cl">Earns <span class="cm-cn">'+t.cert+'</span></span>'+
      '<span class="cm-act'+(t.soon ? ' cm-soon' : '')+'" data-cm-act>'+t.act+ARR+'</span></span></a>';
  }
  function featStart(){
    var t = T[0];
    return '<span class="cm-kick">01 &middot; Start here</span>'+
      '<span class="cm-fh"><span class="cm-ftile">'+ico(t.icon, 21)+'</span><span class="cm-ft1 cm-pj">'+t.name+'</span></span>'+
      '<span class="cm-fd">'+t.desc+'</span>'+
      '<span class="cm-fcert"><span class="cm-flab">Certificate</span><b>'+t.cert+'</b></span>'+
      '<a class="cm-a cm-fbtn cm-bottom" href="'+t.href+'" data-cm-track="foundations" data-cm-sf="1">Start free'+ARR+'</a>';
  }
  function featCont(p){
    var t = BY[p.tk];
    return '<span class="cm-kick">Continue where you left off</span>'+
      '<span class="cm-fh"><span class="cm-ftile">'+ico(t.icon, 21)+'</span><span class="cm-ft1 cm-pj">'+t.name+'</span></span>'+
      '<span class="cm-prog"><span class="cm-pl"><span>Section '+p.sec+' of '+p.secs+'</span><span>'+p.pct+'%</span></span>'+
      '<span class="cm-bar" role="progressbar" aria-label="'+esc(t.name)+' progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+p.pct+'"><i style="width:'+p.pct+'%"></i></span></span>'+
      '<a class="cm-a cm-fbtn" href="'+esc(p.resume)+'">Resume'+ARR+'</a>'+
      '<span class="cm-done" data-cm-done hidden></span>';
  }
  function panelHTML(){
    return '<div class="cm-feat" data-cm-feat>'+featStart()+'</div>'+
      '<div class="cm-main">'+
        '<div class="cm-hd"><span class="cm-h2 cm-pj">Seven roadmaps, one path</span><a class="cm-a cm-cmp" href="'+R+'#roles">Compare all seven'+ARR+'</a></div>'+
        '<div class="cm-list">'+
          '<span class="cm-gl">02 &middot; Shared core</span>'+coreRow(T[1])+
          '<span class="cm-gl cm-gl2">03 &middot; Specialize, any order</span>'+
          '<div class="cm-grid">'+T.slice(2).map(specRow).join('')+'</div>'+
        '</div>'+
        '<div class="cm-foot"><span class="cm-fv">&#10003; Certificates are publicly verifiable. <a class="cm-a cm-vfy" href="/verify/">Verify one</a></span>'+
          '<a class="cm-a cm-all" href="'+R+'">Open the full roadmap'+ARR+'</a></div>'+
      '</div>';
  }

  /* ---------- fonts (design: Plus Jakarta Sans + Source Sans 3) ---------- */
  var fontsDone = false;
  function loadFonts(){
    if (fontsDone) return; fontsDone = true;
    if (!document.querySelector('link[href*="Plus+Jakarta+Sans"][href*="Source+Sans+3"]')){
      var f = document.createElement('link'); f.rel = 'stylesheet';
      f.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&family=Source+Sans+3:wght@400;600;700&display=swap';
      document.head.appendChild(f);
    }
    try { ['800 21px','700 17px'].forEach(function(s){ document.fonts.load(s+' "Plus Jakarta Sans"'); });
          ['400 15px','600 15px','700 15px'].forEach(function(s){ document.fonts.load(s+' "Source Sans 3"'); }); } catch (e) {}
  }

  /* ---------- learner progress (signed in) ----------
     Lesson completion lives on the device (rsc-course-v1:<course_id>, written by
     the lesson player); it has no timestamps, so "where you left off" = the
     furthest stage of the path with progress (New to R, then Data Analyst, then
     the specialization with the most lessons done), resuming at the next
     unfinished lesson after the last finished one. Free accounts see free-track
     progress only (the rule the previous menu used); members see every track. */
  var FREE = {foundations:1, analyst:1}, RANK = {foundations:0, analyst:1, ds:2, ts:2, researcher:2, developer:2};
  var coursesP = null, state = null, signedIn = false, token = '', progRan = 0;
  function readDone(cid){ try { return (JSON.parse(localStorage.getItem('rsc-course-v1:'+cid) || 'null') || {}).completed || {}; } catch (e) { return {}; } }
  function computeProgress(isPro){
    coursesP = coursesP || fetch('/courses.json').then(function(r){ return r.json(); });
    return coursesP.then(function(d){
      var by = {};
      (d.courses || []).forEach(function(c, ci){
        var rm = c.roadmap || {}, tk = rm.track; if (!(tk in RANK)) return;
        var done = readDone(c.course_id), sec = rm.section || 0;
        var b = by[tk] || (by[tk] = {L:[], done:0, total:0, max:0});
        if (sec > b.max) b.max = sec;
        (c.lessons || []).forEach(function(l){
          if (l.built === false) return;
          var x = !!done[l.slug];
          b.L.push({slug:l.slug, sec:sec, ci:ci, o:l.order || 0, done:x});
          b.total++; if (x) b.done++;
        });
      });
      var best = null;
      Object.keys(by).forEach(function(tk){
        var b = by[tk];
        if (!b.done || b.done >= b.total || (!FREE[tk] && !isPro)) return;
        if (!best || RANK[tk] > RANK[best.tk] || (RANK[tk] === RANK[best.tk] && b.done > best.b.done)) best = {tk:tk, b:b};
      });
      if (!best) return null;
      var L = best.b.L.sort(function(a, z){ return a.sec - z.sec || a.ci - z.ci || a.o - z.o; });
      var last = -1, i, next = null;
      for (i = 0; i < L.length; i++) if (L[i].done) last = i;
      for (i = last + 1; i < L.length && !next; i++) if (!L[i].done) next = L[i];
      for (i = 0; i < L.length && !next; i++) if (!L[i].done) next = L[i];
      return {tk:best.tk, sec:next.sec, secs:best.b.max, pct:Math.max(1, Math.round(100 * best.b.done / best.b.total)), resume:'/'+next.slug+'.html'};
    });
  }
  function refresh(isPro){
    if (progRan && (progRan === 2 || !isPro)) return;
    progRan = isPro ? 2 : 1;
    computeProgress(isPro).then(function(p){ state = p; applyState(); }).catch(function(){});
  }

  /* "Completed": the latest certificate actually earned, from /api/me/tracks.
     Fetched on the first open only (at most once per session), never on load. */
  var doneAsked = false, doneData = null;
  function paintDone(){
    var c = doneData; if (!c || !c.url) return;
    document.querySelectorAll('[data-cm-done]').forEach(function(el){
      el.innerHTML = '<span class="cm-flab">Completed</span><a class="cm-a cm-donea" href="'+esc(c.url)+'"><b>'+esc(c.track)+'</b> &middot; '+esc(c.cert)+' earned</a>';
      el.hidden = false;
    });
  }
  function fillCompleted(){
    if (doneAsked || !state || !token) return; doneAsked = true;
    var cached = null;
    try { cached = JSON.parse(sessionStorage.getItem('cm-done') || 'null'); } catch (e) {}
    var use = function(c){ doneData = c; paintDone(); };
    if (cached && cached.at > Date.now() - 600000) { use(cached.c); return; }
    fetch('/api/me/tracks', {headers:{Authorization:'Bearer '+token}}).then(function(r){ return r.ok ? r.json() : null; }).then(function(j){
      var got = null;
      ((j && j.tracks) || []).forEach(function(t){
        if (!t.minted || !t.minted.public_id) return;
        if (!got || (t.minted.issued_at || 0) > got.at) {
          var nav = BY[t.roadmap_track];
          got = {at:t.minted.issued_at || 0, url:t.minted.verify_url, track:nav ? nav.name : t.name, cert:t.name};
        }
      });
      var c = got ? {url:got.url, track:got.track, cert:got.cert} : null;
      try { sessionStorage.setItem('cm-done', JSON.stringify({at:Date.now(), c:c})); } catch (e) {}
      use(c);
    }).catch(function(){});
  }

  var feat = null, sheet = null;
  function applyState(){
    if (feat) feat.innerHTML = (signedIn && state) ? featCont(state) : featStart();
    document.querySelectorAll('.cm-drop [data-cm-act]').forEach(function(a){
      var row = a.closest('[data-cm-track]'), t = row && BY[row.getAttribute('data-cm-track')];
      if (t) a.innerHTML = (signedIn && state && state.tk === t.track ? 'Resume' : t.act) + ARR;
    });
    if (sheet) sheetState();
    paintDone();
  }

  /* ---------- phone sheet (2d) ---------- */
  function sheetRow(t){
    return '<a class="cm-srow"'+rowAttrs(t)+'>'+tile(t, 18)+
      '<span class="cm-st"><span class="cm-sn cm-pj">'+t.name+'</span><span class="cm-sc">'+t.cert+'</span></span>'+badge(t)+'</a>';
  }
  /* Same CTA as the drawers: Get Certified -> pricing; lesson pages call it Upgrade. */
  function ctaFromPage(){
    var c = document.querySelector('.sitenav .snav-btn');
    var label = c ? (c.textContent || '').replace(/[\u2192>]+\s*$/, '').trim() : '';
    return {label: /^upgrade$/i.test(label) ? 'Upgrade' : 'Get Certified', href:'/pricing.html'};
  }
  function buildSheet(){
    var cta = ctaFromPage(), CHEV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 15 12 9 18 15"/></svg>';
    sheet = document.createElement('div');
    sheet.className = 'cm-sheet'; sheet.id = 'cm-sheet';
    sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true'); sheet.setAttribute('aria-label', 'Courses');
    sheet.innerHTML =
      '<div class="cm-top"><a class="cm-brand cm-pj" href="/"><img src="/logo-mark.svg" alt="" width="28" height="28">r-statistics.co</a>'+
        '<button class="cm-x" type="button" aria-label="Close menu">&times;</button></div>'+
      '<div class="cm-scroll">'+
        '<a class="cm-cont" data-cm-cont hidden></a>'+
        '<div class="cm-card">'+
          '<button class="cm-chd" type="button" aria-expanded="true" aria-controls="cm-cbody"><span class="cm-ct cm-pj">Courses</span>'+CHEV+'</button>'+
          '<div class="cm-cbody" id="cm-cbody">'+
            '<span class="cm-sg">Start</span>'+sheetRow(T[0])+
            '<span class="cm-sg">Shared core</span>'+sheetRow(T[1])+
            '<span class="cm-sg">Specialize</span>'+T.slice(2).map(sheetRow).join('')+
            '<a class="cm-sall" href="'+R+'">Open the full roadmap'+ARR+'</a>'+
          '</div>'+
        '</div>'+
        '<div class="cm-nav">'+
          '<a class="cm-nl" href="/dashboard.html" data-cm-dash hidden><span>Dashboard</span></a>'+
          '<a class="cm-nl" href="/tutorials/" data-cm-fw><span>Tutorials</span><span class="cm-chev" aria-hidden="true">&rsaquo;</span></a>'+
          '<a class="cm-nl" href="/exercises/" data-cm-fw><span>Practice</span><span class="cm-chev" aria-hidden="true">&rsaquo;</span></a>'+
          '<a class="cm-nl" href="/pricing.html"><span>Pricing</span></a>'+
          '<a class="cm-nl" href="/tools/"><span>Tools</span></a>'+
        '</div>'+
      '</div>'+
      '<div class="cm-pin"><a class="cm-pinb" href="'+esc(cta.href)+'">'+esc(cta.label)+ARR+'</a></div>';
    document.body.appendChild(sheet);
    sheet.querySelector('.cm-x').addEventListener('click', function(){ closeSheet(true); });
    var chd = sheet.querySelector('.cm-chd'), body = sheet.querySelector('.cm-cbody');
    chd.addEventListener('click', function(){
      var on = chd.getAttribute('aria-expanded') !== 'true';
      chd.setAttribute('aria-expanded', on ? 'true' : 'false'); body.hidden = !on;
    });
    /* Tutorials / Practice rows hand over to those menus' own sheets (opened by
       their drawer rows); with no drawer row on the page they just navigate. */
    sheet.querySelectorAll('[data-cm-fw]').forEach(function(a){
      a.addEventListener('click', function(e){
        var h = a.getAttribute('href');
        var row = document.querySelector('.mnav-link[href="'+h+'"],.snav-dlink[href="'+h+'"]');
        if (!row || window.innerWidth > 980) return;
        e.preventDefault(); closeSheet(false); row.click();
      });
    });
    sheet.addEventListener('keydown', function(e){
      if (e.key !== 'Tab') return;
      var f = Array.prototype.filter.call(sheet.querySelectorAll('a[href],button'), function(el){ return el.offsetParent !== null; });
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    sheetState();
  }
  function sheetState(){
    var dash = sheet.querySelector('[data-cm-dash]'); if (dash) dash.hidden = !signedIn;
    var c = sheet.querySelector('[data-cm-cont]');
    if (signedIn && state) {
      var t = BY[state.tk];
      c.href = state.resume;
      c.innerHTML = '<span class="cm-ck">Continue</span><span class="cm-cr"><span class="cm-cn2 cm-pj">'+t.name+'</span><span class="cm-cs">Section '+state.sec+' of '+state.secs+'</span></span>'+
        '<span class="cm-bar" aria-hidden="true"><i style="width:'+state.pct+'%"></i></span>';
      c.setAttribute('aria-label', 'Continue '+t.name+', section '+state.sec+' of '+state.secs+', '+state.pct+'% done');
      c.hidden = false;
    } else c.hidden = true;
  }
  var opener = null;
  function openSheet(from){
    ensureCss(); loadFonts();
    if (!sheet) buildSheet(); else sheetState();
    opener = from || null;
    document.documentElement.classList.add('cm-lock');
    sheet.classList.add('cm-open');
    setTimeout(function(){ var x = sheet.querySelector('.cm-x'); if (x) x.focus(); }, 30);
  }
  function closeSheet(refocus){
    if (!sheet || !sheet.classList.contains('cm-open')) return;
    sheet.classList.remove('cm-open');
    document.documentElement.classList.remove('cm-lock');
    if (refocus && opener && opener.focus) opener.focus();
  }

  /* ---------- wiring ---------- */
  function init(){
    var link = document.querySelector('.sitenav .snav-links a[href="/roadmap/"]') || document.querySelector('.nav a[href="/roadmap/"]');
    if (link && !link.closest('.rn-wrap')) desktop(link);
    /* phones: the Courses row in any drawer (tutorial overlay .mnav-link, the
       generic drawer .snav-dlink, built lazily) opens the sheet */
    Array.prototype.forEach.call(document.querySelectorAll('.mnav-link[href="/roadmap/"]'), function(a){
      if (!a.querySelector('.ex-caret')) a.insertAdjacentHTML('beforeend', ' <span class="ex-caret" aria-hidden="true">&#9662;</span>');
    });
    document.addEventListener('click', function(e){
      var a = e.target && e.target.closest && e.target.closest('.mnav-link[href="/roadmap/"],.snav-dlink[href="/roadmap/"]');
      if (!a || window.innerWidth > 1023) return;
      e.preventDefault(); openSheet(a);
    });
    /* Esc closes one layer: the sheet, back to the drawer it was opened from. Capture
       on window so the drawers' own document-level Esc handlers do not also close. */
    window.addEventListener('keydown', function(e){
      if (e.key !== 'Escape' || !sheet || !sheet.classList.contains('cm-open')) return;
      e.stopPropagation(); closeSheet(true);
    }, true);
    /* GA: the start-free funnel event the previous menu sent */
    document.addEventListener('click', function(e){
      var a = e.target && e.target.closest && e.target.closest('.cm-drop [data-cm-sf], .cm-sheet [data-cm-sf]');
      if (!a) return;
      try { if (typeof gtag === 'function') gtag('event', 'nav_start_free_click', {track: a.getAttribute('data-cm-track') || ''}); } catch (_) {}
    }, true);
  }

  function ensureCss(){
    if (document.head.querySelector('link[data-cm-css]')) return;
    var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = '/www/courses-nav.css?v='+CSS_V;
    l.setAttribute('data-cm-css', ''); document.head.appendChild(l);
  }
  function desktop(link){
    ensureCss();
    var wrap = document.createElement('div'); wrap.className = 'rn-wrap';
    link.parentNode.insertBefore(wrap, link); wrap.appendChild(link);
    link.classList.add('rn-trigger');
    // One label sitewide: older section/tool pages still bake "Roadmap" into the markup.
    for (var ci = 0; ci < link.childNodes.length; ci++){
      var tn = link.childNodes[ci];
      if (tn.nodeType === 3 && /^\s*Roadmap\s*$/.test(tn.nodeValue)) tn.nodeValue = tn.nodeValue.replace('Roadmap', 'Courses');
    }
    // One chevron: tutorials-nav.js adds the same .nav-car when it loads; pages
    // without it (or without the baked .ex-caret pill) get it here.
    if (!link.querySelector('.ex-caret') && !link.querySelector('svg')){
      link.insertAdjacentHTML('beforeend', '<svg class="nav-car" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>');
    }
    var drop = document.createElement('div');
    drop.className = 'cm-drop'; drop.id = 'cm-courses';
    drop.setAttribute('role', 'region'); drop.setAttribute('aria-label', 'Courses');
    drop.innerHTML = panelHTML();
    var bridge = document.createElement('div'); bridge.className = 'cm-bridge'; bridge.setAttribute('aria-hidden', 'true');
    wrap.appendChild(bridge); wrap.appendChild(drop);
    feat = drop.querySelector('[data-cm-feat]');
    link.setAttribute('aria-haspopup', 'true'); link.setAttribute('aria-expanded', 'false'); link.setAttribute('aria-controls', 'cm-courses');

    /* site-nav.js marks the longest-prefix navbar link .on; panel rows sit inside
       the link row, so on a roadmap page a row could win. Give it back to Courses. */
    function fixOn(){ var on = drop.querySelectorAll('a.on'); if (!on.length) return; on.forEach(function(a){ a.classList.remove('on'); }); link.classList.add('on'); }
    setTimeout(fixOn, 0); window.addEventListener('load', fixOn);

    var open = false, via = '', closeT = null;
    function place(){
      var cw = document.documentElement.clientWidth || window.innerWidth;
      var w = Math.min(1160, cw - 48);
      var header = link.closest('.sitenav') || link.closest('nav') || wrap.parentNode;
      var hb = header.getBoundingClientRect(), wb = wrap.getBoundingClientRect(), lb = link.getBoundingClientRect();
      var top = Math.round(hb.bottom - wb.top + 10), left = Math.round((cw - w) / 2 - wb.left);
      drop.style.width = w + 'px'; drop.style.left = left + 'px'; drop.style.top = top + 'px';
      /* Stay inside the top two-thirds of the window (owner, 2026-10-05): measure the
         natural height, scale down to at most 0.8 if needed, and only past that let the
         panel scroll inside. Scaling is from the top centre, so the gap and centring hold. */
      drop.style.maxHeight = 'none'; drop.style.setProperty('--cm-z', '1');
      var avail = Math.max(220, Math.floor(window.innerHeight * 2 / 3 - hb.bottom - 10));
      var natural = drop.offsetHeight, z = 1;
      if (natural > avail) {
        z = Math.max(0.8, avail / natural);
        if (natural * z > avail + 1) drop.style.maxHeight = Math.floor(avail / z) + 'px';
      }
      drop.style.setProperty('--cm-z', String(Math.round(z * 1000) / 1000));
      // hover bridge over the gap between the link and the panel, centred on the link
      var bw = Math.min(w, 380), bl = Math.round(lb.left + lb.width / 2 - bw / 2 - wb.left);
      bl = Math.max(left, Math.min(bl, left + w - bw));
      var bt = Math.round(lb.bottom - wb.top);
      bridge.style.left = bl + 'px'; bridge.style.width = bw + 'px'; bridge.style.top = bt + 'px'; bridge.style.height = Math.max(0, top - bt) + 'px';
    }
    function setOpen(o, how){
      if (o === open) return;
      clearTimeout(closeT);
      open = o; via = o ? how : '';
      if (o) { loadFonts(); place(); fillCompleted(); }
      wrap.classList.toggle('rn-open', o);
      document.documentElement.classList.toggle('cm-dopen', o);   // lets the CSS park the feedback pill
      link.setAttribute('aria-expanded', o ? 'true' : 'false');
      if (o && how === 'key') setTimeout(function(){ var f = drop.querySelector('a[href]'); if (f) f.focus(); }, 40);
    }
    function canHover(){ return window.innerWidth > 980 && window.matchMedia('(hover:hover)').matches; }
    wrap.addEventListener('mouseenter', function(){ if (canHover()) { clearTimeout(closeT); loadFonts(); setOpen(true, 'hover'); } });
    wrap.addEventListener('mouseleave', function(){ if (canHover() && open) closeT = setTimeout(function(){ setOpen(false); }, 160); });
    link.addEventListener('click', function(e){
      if (window.innerWidth <= 980) return;
      e.preventDefault();
      if (e.detail === 0) { setOpen(!open, 'key'); return; }         // Enter on the focused link
      if (open && via === 'hover') return;                              // hover already opened it; a click keeps it
      setOpen(!open, 'click');
    });
    link.addEventListener('keydown', function(e){
      if (window.innerWidth <= 980) return;
      if (e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); setOpen(!open, 'key'); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); if (!open) setOpen(true, 'key'); else { var f = drop.querySelector('a[href]'); if (f) f.focus(); } }
    });
    document.addEventListener('click', function(e){ if (open && !wrap.contains(e.target)) setOpen(false); });
    document.addEventListener('keydown', function(e){
      if (e.key !== 'Escape' || !open) return;
      var inside = wrap.contains(document.activeElement);
      setOpen(false); if (inside) link.focus();
    });
    wrap.addEventListener('focusout', function(e){ if (open && e.relatedTarget && !wrap.contains(e.relatedTarget)) setOpen(false); });
    window.addEventListener('resize', function(){ if (open) { if (window.innerWidth <= 980) setOpen(false); else place(); } });
    // desktop visitors: fetch the two design fonts once the page is idle, so the
    // first open does not flash fallback type
    if (canHover()) {
      var idle = window.requestIdleCallback || function(f){ return setTimeout(f, 1500); };
      window.addEventListener('load', function(){ idle(loadFonts); });
    }
  }

  document.addEventListener('auth-hydrated', function(e){
    var me = e && e.detail && e.detail.me;
    if (e && e.detail && e.detail.token) token = e.detail.token;
    if (me && me.user) { signedIn = true; refresh(!!me.pro); }
    else if (signedIn) { signedIn = false; state = null; applyState(); }
  });
  function boot(){
    init();
    var b = document.body;
    if (b && b.classList.contains('state-pro')) { signedIn = true; refresh(b.classList.contains('pro')); }
  }
  if (document.readyState !== 'loading') boot();
  else document.addEventListener('DOMContentLoaded', boot);
})();
