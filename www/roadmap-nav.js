/* roadmap-nav.js - upgrades the masthead "Roadmap" link into the six-roadmaps
   ladder dropdown (stages: Start / Work with data / Go deep, boxed track cards,
   certificate footer). Sibling of practice-nav.js (the Exercises panel): same
   architecture, namespaced .rn-*. Progressive enhancement: no JS / mobile ->
   the link still goes to /roadmap/. */
(function(){
  if (window.__roadmapNav) return; window.__roadmapNav = 1;

  var STAGES = [
    ["Start", [
      {href:"/roadmap/new-to-r.html", dot:"#2056d2", name:"New to R",
       p:"Syntax to functions, from zero. Feeds every other track.",
       m:"43 interactive lessons", start:1}
    ]],
    ["Work with data", [
      {href:"/roadmap/data-analyst.html", dot:"#0f8a5f", name:"Data Analyst", p:"Wrangle, visualize, report.", m:"44 interactive lessons"},
      {href:"/roadmap/researcher.html", dot:"#7c3aed", name:"Researcher", p:"Tests, models, inference.", m:"tutorial curriculum"},
      {href:"/roadmap/forecaster.html", dot:"#0e7490", name:"Forecaster", p:"Decomposition to ARIMA.", m:"tutorial curriculum"}
    ]],
    ["Go deep", [
      {href:"/roadmap/data-scientist.html", dot:"#be185d", name:"Data Scientist", p:"Machine learning end to end.", m:"178 interactive lessons"},
      {href:"/roadmap/r-developer.html", dot:"#4d7c0f", name:"R Developer", p:"Packages, performance, Shiny.", m:"tutorial curriculum"},
      {soon:1, dot:"#c3c9d4", name:"ML Engineer", p:"Production ML systems.", m:"in the works"}
    ]]
  ];
  var ARR = '<svg class="rn-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';

  function nodeHTML(n){
    var inner = '<span class="rn-t"><span class="rn-dt" style="background:'+n.dot+'"></span><b>'+n.name+'</b></span>'+
      '<p>'+n.p+'</p><span class="rn-m">'+n.m+'</span>'+
      (n.start ? '<span class="rn-go">Start free '+ARR+'</span>' : '');
    if (n.soon) return '<div class="rn-node rn-soon">'+inner+'</div>';
    return '<a class="rn-node'+(n.start?' rn-start':'')+'" href="'+n.href+'" role="menuitem">'+inner+'</a>';
  }
  function panelHTML(){
    var cols = STAGES.map(function(sg){
      return '<div class="rn-col"><div class="rn-sl"><span class="rn-msdot"></span>'+sg[0]+'</div>'+
        sg[1].map(nodeHTML).join('')+'</div>';
    }).join('');
    return '<div class="rn-hd"><b>Six roadmaps, one path</b><a href="/roadmap/">Compare all six '+ARR+'</a></div>'+
      '<div class="rn-cols">'+cols+'</div>'+
      '<div class="rn-ft"><span>Every roadmap ends in a verifiable certificate.</span>'+
      '<a href="/roadmap/">Open the full roadmap '+ARR+'</a></div>';
  }

  function init(){
    var link = document.querySelector('.sitenav .snav-links a[href="/roadmap/"]') || document.querySelector('.nav a[href="/roadmap/"]');
    if (!link || link.closest('.rn-wrap')) return;
    if (!document.querySelector('link[data-rn-css]')){
      var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = '/www/roadmap-nav.css?v=1';
      l.setAttribute('data-rn-css', ''); document.head.appendChild(l);
    }
    var wrap = document.createElement('div'); wrap.className = 'rn-wrap';
    link.parentNode.insertBefore(wrap, link); wrap.appendChild(link);
    link.classList.add('rn-trigger');
    link.setAttribute('aria-haspopup', 'true'); link.setAttribute('aria-expanded', 'false');
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
  }

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
