/* roadmap-nav.js - upgrades the masthead "Roadmap" link into the seven-roadmaps
   ladder dropdown (stages: Start / Work with data / Go deep, boxed track cards,
   certificate footer). Sibling of practice-nav.js (the Exercises panel): same
   architecture, namespaced .rn-*. Progressive enhancement: no JS / mobile ->
   the link still goes to /roadmap/. */
(function(){
  if (window.__roadmapNav) return; window.__roadmapNav = 1;

  /* per-track data-graphic marks - one shared stroke grammar, each track wears
     the chart it teaches (prompt, bar chart, bell curve, forecast, tree, code,
     gauge). Rendered inside the tinted .rn-mkc chip. */
  var MK = {
    found:'<svg width="24" height="20" viewBox="0 0 26 22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="4,4 11,11 4,18"/><line x1="15" y1="18" x2="23" y2="18"/></svg>',
    da:'<svg width="24" height="20" viewBox="0 0 26 22" fill="currentColor" stroke="none"><rect x="3" y="9" width="3.6" height="11" rx="1"/><rect x="9" y="3" width="3.6" height="17" rx="1"/><rect x="15" y="13" width="3.6" height="7" rx="1"/><rect x="21" y="6" width="3.6" height="14" rx="1"/><line x1="2" y1="20.6" x2="24.6" y2="20.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    res:'<svg width="24" height="20" viewBox="0 0 26 22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M2,19 C8,19 8.5,3 13,3 C17.5,3 18,19 24,19"/></svg>',
    fc:'<svg width="24" height="20" viewBox="0 0 26 22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="2,17 5,12.5 8,15 11,9.5 14,12 17,6.5"/><line x1="17" y1="6.5" x2="24" y2="3.5" stroke-dasharray="2.6 2.4"/></svg>',
    ds:'<svg width="24" height="20" viewBox="0 0 26 22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="13" cy="4" r="2.4" fill="currentColor" stroke="none"/><path d="M13,6.4 L13,9.5 M5,9.5 L21,9.5 M5,9.5 L5,12.8 M21,9.5 L21,12.8"/><circle cx="5" cy="15.4" r="2.4"/><circle cx="21" cy="15.4" r="2.4"/></svg>',
    dev:'<svg width="24" height="20" viewBox="0 0 26 22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="16,5 23,11 16,17"/><polyline points="10,5 3,11 10,17"/></svg>',
    mle:'<svg width="24" height="20" viewBox="0 0 26 22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M3.5,17.5 A9.5,9.5 0 0 1 22.5,17.5"/><line x1="13" y1="17.5" x2="18.2" y2="10.2"/><circle cx="13" cy="17.5" r="1.6" fill="currentColor" stroke="none"/></svg>'
  };

  /* cert names mirror what each track page hero advertises (roadmap-data.js
     LEVELS) - the dropdown must promise the same credential the page does */
  var STAGES = [
    ["Start", [
      {href:"/roadmap/new-to-r.html", tc:"#2563a8", mono:"R", mk:"found", name:"New to R", track:"foundations", free:1, sf:"R-Syntax-and-First-Objects",
       p:"Syntax to functions, from zero. Feeds every other track, and most people begin in it.",
       cert:"R Fundamentals", start:1}
    ]],
    ["Work with data", [
      {href:"/roadmap/data-analyst.html", tc:"#1f7a55", mono:"DA", mk:"da", name:"Data Analyst", track:"analyst", free:1, sf:"Importing-and-Tidy-Data-in-R", p:"Wrangle, visualize, report.", cert:"Tidyverse Practitioner"},
      {href:"/roadmap/researcher.html", tc:"#b45309", mono:"RS", mk:"res", name:"Researcher", p:"Tests, models, inference.", cert:"Applied Statistics with R"},
      {href:"/roadmap/forecaster.html", tc:"#be185d", mono:"F", mk:"fc", name:"Forecaster", p:"Decomposition to ARIMA.", cert:"Time Series Forecasting"}
    ]],
    ["Go deep", [
      {href:"/roadmap/data-scientist.html", tc:"#7c3aed", mono:"DS", mk:"ds", name:"Data Scientist", track:"ds", sf:"Framing-a-Problem-as-ML", p:"Machine learning end to end.", cert:"Machine Learning with R"},
      {href:"/roadmap/r-developer.html", tc:"#0e7490", mono:"RD", mk:"dev", name:"R Developer", p:"Packages, performance, Shiny.", cert:"Advanced R"},
      {href:"/roadmap/ml-engineer.html", tc:"#4338ca", mono:"ML", mk:"mle", name:"ML Engineer", p:"Ship and operate ML in production.", cert:"ML Engineering with R"}
    ]]
  ];
  var ARR = '<svg class="rn-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';

  function nodeHTML(n){
    var inner = '<span class="rn-row1"><span class="rn-mono">'+n.mono+'</span><b>'+n.name+'</b>'+
      (n.start ? '<span class="rn-tag">Start here</span>' : '')+
      '<span class="rn-mkc">'+MK[n.mk]+'</span></span>'+
      '<p>'+n.p+'</p><span class="rn-m" data-rn-m></span>'+
      '<span class="rn-cert">Certificate: <b>'+n.cert+'</b></span>'+
      (n.sf ? '<span class="rn-go rn-sf" role="link" tabindex="0" data-sf="'+n.href+'" data-track="'+(n.track||'')+'">Start free '+ARR+'</span>'
            : '<span class="rn-go">Open '+ARR+'</span>');
    if (n.soon) return '<div class="rn-node rn-soon" style="--tc:'+n.tc+'">'+inner+'</div>';
    return '<a class="rn-node'+(n.start?' rn-start':'')+'"'+(n.track?' data-rn-track="'+n.track+'"':'')+(n.free?' data-rn-free="1"':'')+' style="--tc:'+n.tc+'" href="'+n.href+'" role="menuitem">'+inner+'</a>';
  }
  function panelHTML(){
    var cols = STAGES.map(function(sg){
      return '<div class="rn-col"><div class="rn-sl"><span class="rn-msdot"></span>'+sg[0]+'</div>'+
        sg[1].map(nodeHTML).join('')+'</div>';
    }).join('');
    return '<div class="rn-hd"><b>Seven roadmaps, one path</b><a href="/roadmap/">Compare all seven '+ARR+'</a></div>'+
      '<div class="rn-cols">'+cols+'</div>'+
      '<div class="rn-ft"><span>Certificates are publicly verifiable.</span>'+
      '<a href="/roadmap/">Open the full roadmap '+ARR+'</a></div>';
  }

  /* dropdown Start free: goes to the TRACK PAGE (not the lesson) - the track
     page's own Start free handles the signed-out -> sign-in -> lesson funnel */
  document.addEventListener('click', function(e){
    var sf = e.target.closest && e.target.closest('.rn-sf'); if (!sf) return;
    e.preventDefault(); e.stopPropagation();
    try { if (typeof gtag === 'function') gtag('event', 'nav_start_free_click', { track: sf.getAttribute('data-track') || '' }); } catch (_) {}
    window.location.href = sf.getAttribute('data-sf');
  }, true);
  document.addEventListener('keydown', function(e){
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var sf = e.target.closest && e.target.closest('.rn-sf'); if (!sf) return;
    e.preventDefault(); sf.click();
  }, true);

  function init(){
    var link = document.querySelector('.sitenav .snav-links a[href="/roadmap/"]') || document.querySelector('.nav a[href="/roadmap/"]');
    if (!link || link.closest('.rn-wrap')) return;
    if (!document.querySelector('link[data-rn-css]')){
      var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = '/www/roadmap-nav.css?v=7';
      l.setAttribute('data-rn-css', ''); document.head.appendChild(l);
    }
    var wrap = document.createElement('div'); wrap.className = 'rn-wrap';
    link.parentNode.insertBefore(wrap, link); wrap.appendChild(link);
    link.classList.add('rn-trigger');
    link.setAttribute('aria-haspopup', 'true'); link.setAttribute('aria-expanded', 'false');
    // One label sitewide: older section/tool pages still bake "Roadmap" into
    // the markup; the dropdown is called Courses everywhere else (2026-08-29).
    for (var ci = 0; ci < link.childNodes.length; ci++){
      var tn = link.childNodes[ci];
      if (tn.nodeType === 3 && /^\s*Roadmap\s*$/.test(tn.nodeValue)) tn.nodeValue = tn.nodeValue.replace('Roadmap', 'Courses');
    }
    if (!link.querySelector('.ex-caret')){
      link.insertAdjacentHTML('beforeend', ' <svg class="rn-car" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>');
    }
    var drop = document.createElement('div'); drop.className = 'rn-drop'; drop.setAttribute('role', 'menu');
    drop.innerHTML = panelHTML(); wrap.appendChild(drop);

    var open = false, closeT;
    function clamp(){
      /* the Roadmap link sits near the left viewport edge; centering alone
         would push the panel off-screen, so shift it back into view */
      drop.style.marginLeft = '0px';
      var r = drop.getBoundingClientRect(), dx = 0;
      if (r.left < 14) dx = 14 - r.left;
      else if (r.right > window.innerWidth - 14) dx = (window.innerWidth - 14) - r.right;
      if (dx) drop.style.marginLeft = dx + 'px';
    }
    function setOpen(o){
      open = o; wrap.classList.toggle('rn-open', o); link.setAttribute('aria-expanded', o ? 'true' : 'false');
      if (o) requestAnimationFrame(clamp);
    }
    function canPanel(){ return window.innerWidth > 980 && window.matchMedia('(hover:hover)').matches; }
    wrap.addEventListener('mouseenter', function(){ if (canPanel()){ clearTimeout(closeT); setOpen(true); } });
    wrap.addEventListener('mouseleave', function(){ if (canPanel()){ closeT = setTimeout(function(){ setOpen(false); }, 140); } });
    link.addEventListener('click', function(e){ if (window.innerWidth > 980){ e.preventDefault(); setOpen(!open); } });
    document.addEventListener('click', function(e){ if (open && !wrap.contains(e.target)) setOpen(false); });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && open) setOpen(false); });

    /* ---- mobile: tap the drawer "Roadmap" -> full-screen sheet (same catalog,
       .rn-node markup reused so hydrateProgress decorates the sheet too) ---- */
    var sheet = document.createElement('div');
    sheet.className = 'rn-sheet'; sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-label', 'Roadmaps');
    sheet.innerHTML = '<div class="rn-sheet-hd"><span class="rn-sheet-t">Courses</span><button class="rn-sheet-x" aria-label="Close">&times;</button></div>'+
      '<div class="rn-sheet-strip">Seven roadmaps, one path. Every roadmap ends in a verifiable certificate.</div>'+
      '<div class="rn-sheet-body">'+
        STAGES.map(function(sg){
          return '<div class="rn-ssl"><span class="rn-msdot"></span>'+sg[0]+'</div>'+sg[1].map(nodeHTML).join('');
        }).join('')+
      '</div>'+
      '<a class="rn-sheet-foot" href="/roadmap/">Open the full roadmap '+ARR+'</a>';
    document.body.appendChild(sheet);
    function openSheet(){ document.documentElement.classList.add('rn-lock'); sheet.classList.add('rn-sheet-open'); }
    function closeSheet(){ sheet.classList.remove('rn-sheet-open'); document.documentElement.classList.remove('rn-lock'); }
    sheet.querySelector('.rn-sheet-x').addEventListener('click', closeSheet);
    // the drawer Roadmap rows carry the same caret pill as the desktop trigger
    Array.prototype.forEach.call(document.querySelectorAll('.mnav-link[href="/roadmap/"]'), function(a){
      if (!a.querySelector('.ex-caret')) a.insertAdjacentHTML('beforeend', ' <span class="ex-caret" aria-hidden="true">&#9662;</span>');
    });
    // delegated so the lazily-built generic drawer (site-nav.js .snav-dlink) is covered too
    document.addEventListener('click', function(e){
      var a = e.target && e.target.closest && e.target.closest('.mnav-link[href="/roadmap/"],.snav-dlink[href="/roadmap/"]');
      if (!a || window.innerWidth > 980) return;
      e.preventDefault(); openSheet();
    });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeSheet(); });
  }

  /* signed-in: real lesson progress per track, from the same localStorage the
     lesson player writes (rsc-course-v1:<course_id>.completed). Per-device. */
  function hydrateProgress(isPro){
    if (window.__rnProg && (!isPro || window.__rnProgPro)) return;
    window.__rnProg = 1; if (isPro) window.__rnProgPro = 1;
    fetch('/courses.json').then(function(r){ return r.json(); }).then(function(d){
      var tr = {};
      (d.courses || []).forEach(function(c){
        var t = c.roadmap && c.roadmap.track; if (!t) return;
        tr[t] = tr[t] || { done: 0, total: 0 };
        var done = {};
        try { done = (JSON.parse(localStorage.getItem('rsc-course-v1:' + c.course_id) || 'null') || {}).completed || {}; } catch (e) {}
        (c.lessons || []).forEach(function(l){
          if (l.built === false) return;
          tr[t].total++;
          if (done[l.slug]) tr[t].done++;
        });
      });
      document.querySelectorAll('.rn-node[data-rn-track]').forEach(function(node){
        var p = tr[node.getAttribute('data-rn-track')];
        if (!p || !p.done) return;
        /* free tier covers New to R + Data Analyst; other tracks need access */
        if (!node.hasAttribute('data-rn-free') && !isPro) return;
        var pct = Math.min(100, Math.round(100 * p.done / Math.max(p.total, 1)));
        var m = node.querySelector('[data-rn-m]');
        if (!m || node.querySelector('.rn-bar')) return;
        var bar = document.createElement('span');
        bar.className = 'rn-bar'; bar.innerHTML = '<i style="width:' + pct + '%"></i>';
        m.parentNode.insertBefore(bar, m);
        m.textContent = p.done + ' of ' + p.total + ' lessons done';
      });
    }).catch(function(){});
  }
  document.addEventListener('auth-hydrated', function(e){
    var me = e && e.detail && e.detail.me;
    if (me && me.user) hydrateProgress(!!me.pro);
  });

  function boot(){
    init();
    if (document.body && document.body.classList.contains('state-pro')) hydrateProgress(document.body.classList.contains('pro'));
  }
  if (document.readyState !== 'loading') boot();
  else document.addEventListener('DOMContentLoaded', boot);
})();
