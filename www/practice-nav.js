/* practice-nav.js - upgrades the masthead "Exercises" link into a "Practice" mega-dropdown.
   Two-pane catalog navigator: categories on the left, hover reveals that category's ordered
   sub-topics + hubs on the right. Progressive enhancement: no JS / no hover -> the link still
   goes to /exercises/. Loaded only on the template (tutorials) + home. Default state is the
   non-signed-in visitor; swaps to a signed-in strip on auth-hydrated. */
(function(){
  if (window.__practiceNav) return; window.__practiceNav = 1;

  // ---- catalog (curated + validated against the 124 published hubs; see Scripts/gen_hubs.py) ----
window.XN_HUBS=[
 ["R Fundamentals","BRACKETS","/R-Basics-Exercises.html",[["First steps",[["Beginner drills","R-Beginner-Exercises"],["R basics","R-Basics-Exercises"],["Interview questions","R-Interview-Questions"]]],["Data structures",[["Vectors","R-Vectors-Exercises"],["Lists","R-Lists-Exercises"],["Data frames","R-Data-Frames-Exercises"],["Subsetting","R-Subsetting-Exercises"]]],["Logic and functions",[["Control flow","R-Control-Flow-Exercises"],["Functions","R-Functions-Exercises"],["The apply family","R-Apply-Exercises"],["Loops vs vectorization","Loops-vs-Vectorization-Exercises-in-R"]]]]],
 ["Data Wrangling","ROWS","/dplyr-Exercises-in-R.html",[["dplyr",[["dplyr basics","dplyr-Exercises-in-R"],["filter and select","dplyr-filter-select-Exercises"],["group and summarise","dplyr-group-by-summarise-Exercises"],["joins","dplyr-Joins-Exercises-in-R"],["window functions","dplyr-Window-Functions-Exercises-in-R"]]],["tidyr and friends",[["tidyr basics","tidyr-Exercises-in-R"],["pivot longer and wider","tidyr-Pivot-Exercises-in-R"],["nest and unnest","tidyr-Nest-Unnest-Exercises-in-R"],["reshaping","tidyr-Reshaping-Exercises"],["the tidyverse","tidyverse-Exercises-in-R"],["data.table","data.table-Exercises-in-R"]]],["Text, dates and factors",[["stringr","stringr-Exercises-in-R"],["base strings","R-String-Exercises"],["regular expressions","Regex-Exercises-in-R"],["lubridate","lubridate-Exercises-in-R"],["dates and times","R-Date-Time-Exercises"],["factors with forcats","forcats-Exercises-in-R"]]],["Import and clean",[["readr","readr-Exercises-in-R"],["data import","R-Data-Import-Exercises"],["SQL with dbplyr","dbplyr-SQL-Exercises-in-R"],["web scraping","Web-Scraping-Exercises-in-R"],["API calls","API-Calls-Exercises-in-R"],["data cleaning","Data-Cleaning-Exercises-in-R"],["missing data","Missing-Data-in-R-Exercises"],["wrangling project","Data-Wrangling-Exercises-in-R"]]]]],
 ["Visualization","CHART","/ggplot2-Exercises-in-R.html",[["ggplot2 core",[["ggplot2 basics","ggplot2-Exercises-in-R"],["aesthetics","ggplot2-Aesthetics-Exercises"],["geoms","ggplot2-Geom-Exercises"],["facets","ggplot2-Facets-Exercises-in-R"],["customization","ggplot2-Customization-Exercises"]]],["Chart craft",[["bar charts","ggplot2-Bar-Chart-Exercises-in-R"],["heatmaps","ggplot2-Heatmap-Exercises-in-R"],["color scales","ggplot2-Color-Scales-Exercises-in-R"],["themes","ggplot2-Themes-Exercises-in-R"]]],["Interactive and tables",[["plotly","plotly-Exercises-in-R"],["leaflet maps","leaflet-Exercises-in-R"],["gt tables","gt-Tables-Exercises-in-R"]]],["Put it together",[["visualization drills","Data-Visualization-Exercises-in-R"],["a full project","R-Visualization-Project"]]]]],
 ["Statistics","BELL","/Hypothesis-Testing-Exercises-in-R.html",[["Probability",[["probability","Probability-in-R-Exercises"],["distributions","Probability-Distributions-Exercises-in-R"],["binomial","Binomial-Distribution-Exercises-in-R"],["poisson","Poisson-Distribution-Exercises-in-R"],["central limit theorem","Central-Limit-Theorem-Exercises-in-R"]]],["Inference and tests",[["hypothesis testing","Hypothesis-Testing-Exercises-in-R"],["t-tests","T-Test-Exercises-in-R"],["chi-square","Chi-Square-Test-Exercises-in-R"],["correlation","Correlation-Exercises-in-R"],["confidence intervals","Confidence-Interval-Exercises-in-R"],["nonparametric tests","Nonparametric-Tests-Exercises-in-R"],["power analysis","Power-Analysis-Exercises-in-R"],["multiple testing","Multiple-Testing-Exercises-in-R"],["sampling","Sampling-Methods-Exercises-in-R"],["A/B testing","AB-Testing-Exercises-in-R"]]],["ANOVA and design",[["ANOVA","ANOVA-Exercises-in-R"],["post-hoc tests","Post-Hoc-Tests-Exercises-in-R"],["repeated measures","Repeated-Measures-Exercises-in-R"],["experimental design","Experimental-Design-Exercises-in-R"]]],["Regression",[["linear regression","Linear-Regression-Exercises-in-R"],["multiple regression","Multiple-Regression-Exercises-in-R"],["diagnostics","Regression-Diagnostics-Exercises-in-R"],["logistic regression","Logistic-Regression-Exercises-in-R"],["GLMs","GLM-Exercises-in-R"],["poisson regression","Poisson-Regression-Exercises-in-R"],["GAMs","GAM-Exercises-in-R"],["mixed-effects models","Mixed-Effects-Models-Exercises-in-R"]]],["Beyond the basics",[["exploratory analysis","EDA-Exercises-in-R"],["PCA","PCA-Exercises-in-R"],["bayesian statistics","Bayesian-Statistics-Exercises-in-R"],["structural equation models","SEM-Exercises-in-R"],["survival analysis","Survival-Analysis-Exercises-in-R"],["survey analysis","Survey-Analysis-in-R-Exercises"]]]]],
 ["Machine Learning","TARGET","/Machine-Learning-Exercises-in-R.html",[["Workflow",[["ML foundations","Machine-Learning-Exercises-in-R"],["data science drills","R-for-Data-Science-Exercises"],["cross-validation","Cross-Validation-Exercises-in-R"]]],["Models",[["decision trees","Decision-Tree-Exercises-in-R"],["random forests","Random-Forest-Exercises-in-R"],["XGBoost","XGBoost-Exercises-in-R"],["ridge and lasso","Ridge-and-Lasso-Exercises-in-R"],["clustering","Clustering-Exercises-in-R"]]],["Frameworks",[["caret","caret-Exercises-in-R"],["tidymodels","tidymodels-Exercises-in-R"],["tidy results with broom","broom-Exercises-in-R"]]]]],
 ["Advanced R","FUNC","/R-Functional-Programming-Exercises.html",[["Functional and OOP",[["functional programming","R-Functional-Programming-Exercises"],["purrr","purrr-Exercises-in-R"],["object-oriented R","R-OOP-Exercises"]]],["Robust code",[["debugging","R-Debugging-Exercises"],["testing with testthat","testthat-Exercises-in-R"]]],["Speed and scale",[["performance","R-Performance-Optimization-Exercises"],["parallel computing","Parallel-Computing-in-R-Exercises"]]],["Build and ship",[["package development","R-Package-Development-Exercises"],["shiny apps","Shiny-Exercises-in-R"],["R Markdown","R-Markdown-Exercises"]]]]],
 ["Specializations","SPEC","/R-for-Finance-Exercises.html",[["By field",[["finance","R-for-Finance-Exercises"],["biostatistics","R-for-Biostatistics-Exercises"],["genomics","R-for-Genomics-Exercises"],["healthcare","R-for-Healthcare-Exercises"],["marketing analytics","R-for-Marketing-Analytics-Exercises"],["sports analytics","R-for-Sports-Analytics-Exercises"]]],["By method",[["time series","Time-Series-Exercises-in-R"],["ARIMA","ARIMA-Exercises-in-R"],["text mining","Text-Mining-Exercises-in-R"],["network analysis","Network-Analysis-Exercises-in-R"],["spatial analysis","Spatial-Analysis-Exercises-in-R"]]]]],
];

  function glyph(d){
    switch(d){
      case 'BRACKETS': return '<path d="M9 8 L6 12 L9 16 M15 8 L18 12 L15 16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
      case 'ROWS': return '<path d="M6 8 H18 M6 12 H15 M6 16 H18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>';
      case 'CHART': return '<polyline points="6 16 10 11 14 14 18 7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
      case 'BELL': return '<path d="M7 16 C7 10, 17 10, 17 16" stroke="currentColor" stroke-width="2" fill="none"/><line x1="12" y1="16" x2="12" y2="8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>';
      case 'TARGET': return '<circle cx="12" cy="12" r="6" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="12" cy="12" r="2" fill="currentColor"/>';
      case 'FUNC': return '<path d="M8.5 8 L6 12 L8.5 16 M15.5 8 L18 12 L15.5 16 M13 7 L11 17" stroke="currentColor" stroke-width="1.9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
      case 'SPEC': return '<polyline points="6 15 10 10 13 12 18 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
      case 'MEDAL': return '<circle cx="12" cy="10" r="5" stroke="currentColor" stroke-width="2" fill="none"/><polyline points="9 14 8 20 12 18 16 20 15 14" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
    }
    return '';
  }
  var ARR = '<svg class="xn-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';
  function svg(d){ return '<svg viewBox="0 0 24 24" fill="none">'+glyph(d)+'</svg>'; }
  function esc(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;'); }

  function catCount(cat){ var n=0; cat[3].forEach(function(sg){ n+=sg[1].length; }); return n; }
  var TOTAL = window.XN_HUBS.reduce(function(a,c){ return a+catCount(c); }, 0);
  // the 8th, special "Mastery Quizzes" rail item (timed, cert-bearing - not hubs)
  var QUIZ = ["Mastery Quizzes","MEDAL","/certifications",null];

  function railHTML(){
    var items = window.XN_HUBS.map(function(cat,i){
      return '<button class="xn-cat" role="tab" data-i="'+i+'" aria-selected="'+(i===0?'true':'false')+'">'+
        '<span class="xn-cg">'+svg(cat[1])+'</span><span class="xn-cn">'+esc(cat[0])+'</span>'+
        '<span class="xn-cc">'+catCount(cat)+'</span></button>';
    }).join('');
    items += '<button class="xn-cat xn-cat-quiz" role="tab" data-i="quiz" aria-selected="false">'+
      '<span class="xn-cg">'+svg('MEDAL')+'</span><span class="xn-cn">Mastery Quizzes</span>'+
      '<span class="xn-cc">11</span></button>';
    return items;
  }

  function paneHTML(idx){
    if (idx === 'quiz'){
      return '<div class="xn-pane-head"><span class="xn-ph-name">Mastery Quizzes</span><span class="xn-ph-n">timed and graded</span></div>'+
        '<div class="xn-quizcard"><div class="xn-qz-t">Prove it, then keep the proof.</div>'+
        '<p class="xn-qz-p">Eleven timed quizzes, each one graded on real R you write. Pass the track and you earn a verifiable certificate with your name on it. You earn it by doing the work.</p>'+
        '<a class="xn-btn" href="/certifications">See how certification works '+ARR+'</a></div>';
    }
    var cat = window.XN_HUBS[idx];
    var groups = cat[3].map(function(sg){
      var hubs = sg[1].map(function(h){ return '<a class="xn-hub" href="/'+h[1]+'.html"><span class="xn-hk"></span>'+esc(h[0])+'</a>'; }).join('');
      return '<div class="xn-sg"><div class="xn-sgl">'+esc(sg[0])+'</div><div class="xn-hublist">'+hubs+'</div></div>';
    }).join('');
    return '<div class="xn-pane-head"><span class="xn-ph-name">'+esc(cat[0])+'</span><span class="xn-ph-n">'+catCount(cat)+' hubs</span>'+
      '<a class="xn-ph-all" href="'+cat[2]+'">see all '+ARR+'</a></div>'+
      '<div class="xn-groups">'+groups+'</div>';
  }

  function panelHTML(){
    return ''+
    '<div class="xn-top xn-anon" data-xn-strip>'+
      '<div class="xn-pl"><svg class="xn-ic" style="width:18px;height:18px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 4 14 11 14 10 22 19 9 12 9 13 2"/></svg></div>'+
      '<div class="xn-pt"><b class="xn-h">Practice R by solving real problems</b>'+
        '<span class="xn-s">'+TOTAL+' hubs, '+'2,904 problems, graded the moment you press Check</span></div>'+
      '<a class="xn-btn" href="/R-Basics-Exercises.html">Start with R Basics '+ARR+'</a>'+
    '</div>'+
    '<div class="xn-body2"><div class="xn-rail" role="tablist">'+railHTML()+'</div><div class="xn-pane" id="xn-pane"></div></div>'+
    '<div class="xn-foot"><span class="xn-tot"><b>'+TOTAL+'</b> hubs &middot; <b>2,904</b> problems &middot; free to attempt</span>'+
      '<span class="xn-fl"><a href="/exercises/">Browse the full library '+ARR+'</a></span></div>';
  }

  // ---- mobile sheet: a full-screen, tap-to-expand version of the same catalog ----
  function mobileSheetHTML(){
    var cats = window.XN_HUBS.map(function(cat,i){
      var groups = cat[3].map(function(sg){
        var hubs = sg[1].map(function(h){ return '<a class="xn-shub" href="/'+h[1]+'.html">'+esc(h[0])+'</a>'; }).join('');
        return '<div class="xn-ssgl">'+esc(sg[0])+'</div><div class="xn-shubs">'+hubs+'</div>';
      }).join('');
      return '<div class="xn-scatw"><button class="xn-scat" data-i="'+i+'" aria-expanded="false">'+
        '<span class="xn-cg">'+svg(cat[1])+'</span><span class="xn-scn">'+esc(cat[0])+'</span>'+
        '<span class="xn-cc">'+catCount(cat)+'</span>'+
        '<svg class="xn-schev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg></button>'+
        '<div class="xn-spanel" hidden>'+groups+'</div></div>';
    }).join('');
    return '<div class="xn-sheet-hd"><span class="xn-sheet-t">Practice</span><button class="xn-sheet-x" aria-label="Close">&times;</button></div>'+
      '<div class="xn-sheet-strip">'+TOTAL+' hubs &middot; 2,904 problems &middot; graded the moment you press Check</div>'+
      '<div class="xn-sheet-body">'+cats+
        '<div class="xn-scatw"><a class="xn-scat xn-scat-q" href="/certifications"><span class="xn-cg">'+svg('MEDAL')+'</span><span class="xn-scn">Mastery Quizzes</span><span class="xn-cc">11</span>'+ARR+'</a></div>'+
      '</div>'+
      '<a class="xn-sheet-foot" href="/exercises/">Browse the full library '+ARR+'</a>';
  }

  function userStrip(streak, xp){
    var k = (streak && streak > 0) ? (streak + '-day streak' + (xp ? (' &middot; ' + xp + ' XP') : ''))
                                   : (xp ? (xp + ' XP earned') : 'your progress is saved');
    return '<div class="xn-pl"><svg class="xn-ic" style="width:18px;height:18px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c1.6 3 4.6 4.2 4.6 8a4.6 4.6 0 0 1-9.2 0c0-1.5.6-2.5 1.5-3.3C9.4 9 10 10 10 11c.9-1.7.6-4.5 2-8z"/></svg></div>'+
      '<div class="xn-pt"><b class="xn-h">Pick up where you left off</b>'+
        '<span class="xn-s">'+k+' &middot; your streak, XP and solved problems are saved</span></div>'+
      '<a class="xn-btn" href="/exercises/">Resume practice '+ARR+'</a>';
  }

  function init(){
    var link = document.querySelector('.masthead-nav-link[href="/exercises/"]') || document.querySelector('.nav a[href="/exercises/"]');
    if (!link || link.closest('.xn-wrap')) return;

    if (!document.querySelector('link[data-xn-css]')){
      var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = '/www/practice-nav.css?v=5';
      l.setAttribute('data-xn-css', ''); document.head.appendChild(l);
    }

    var wrap = document.createElement('div'); wrap.className = 'xn-wrap';
    link.parentNode.insertBefore(wrap, link); wrap.appendChild(link);
    link.classList.add('xn-trigger');
    link.setAttribute('aria-haspopup', 'true'); link.setAttribute('aria-expanded', 'false');
    link.insertAdjacentHTML('beforeend', ' <svg class="xn-car" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>');

    var drop = document.createElement('div'); drop.className = 'xn-drop'; drop.setAttribute('role', 'menu');
    drop.innerHTML = panelHTML(); wrap.appendChild(drop);

    // two-pane: rail selects the right pane
    var pane = drop.querySelector('#xn-pane');
    var rail = drop.querySelector('.xn-rail');
    var cats = rail.querySelectorAll('.xn-cat');
    function activate(el){
      cats.forEach(function(c){ c.setAttribute('aria-selected', c===el ? 'true':'false'); });
      var i = el.getAttribute('data-i');
      pane.innerHTML = paneHTML(i === 'quiz' ? 'quiz' : parseInt(i,10));
    }
    cats.forEach(function(c){
      c.addEventListener('mouseenter', function(){ activate(c); });
      c.addEventListener('focus', function(){ activate(c); });
      c.addEventListener('click', function(e){ e.preventDefault(); activate(c); });
    });
    activate(cats[0]);

    var open = false, closeT;
    function setOpen(o){ open = o; wrap.classList.toggle('xn-open', o); link.setAttribute('aria-expanded', o ? 'true' : 'false'); }
    function canPanel(){ return window.innerWidth > 980 && window.matchMedia('(hover:hover)').matches; }
    wrap.addEventListener('mouseenter', function(){ if (canPanel()){ clearTimeout(closeT); setOpen(true); } });
    wrap.addEventListener('mouseleave', function(){ if (canPanel()){ closeT = setTimeout(function(){ setOpen(false); }, 140); } });
    link.addEventListener('click', function(e){ if (window.innerWidth > 980){ e.preventDefault(); setOpen(!open); } });
    document.addEventListener('click', function(e){ if (open && !wrap.contains(e.target)) setOpen(false); });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && open) setOpen(false); });

    // mobile: tap the hamburger "Exercises" -> full-screen catalog sheet (tap-to-expand)
    var sheet = null;
    function ensureSheet(){
      if (sheet) return;
      sheet = document.createElement('div'); sheet.className = 'xn-sheet'; sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-label', 'Practice catalog');
      sheet.innerHTML = mobileSheetHTML(); document.body.appendChild(sheet);
      sheet.querySelector('.xn-sheet-x').addEventListener('click', closeSheet);
      sheet.querySelectorAll('.xn-scat[data-i]').forEach(function(b){
        b.addEventListener('click', function(){
          var pnl = b.nextElementSibling, on = b.getAttribute('aria-expanded') === 'true';
          b.setAttribute('aria-expanded', on ? 'false' : 'true'); if (pnl) pnl.hidden = on;
        });
      });
    }
    function openSheet(){ ensureSheet(); document.documentElement.classList.add('xn-lock'); sheet.classList.add('xn-sheet-open'); }
    function closeSheet(){ if (sheet) sheet.classList.remove('xn-sheet-open'); document.documentElement.classList.remove('xn-lock'); }
    Array.prototype.forEach.call(document.querySelectorAll('.mnav-link[href="/exercises/"]'), function(a){
      a.addEventListener('click', function(e){ if (window.innerWidth <= 980){ e.preventDefault(); openSheet(); } });
    });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeSheet(); });

    // personalization: default is visitor; swap to signed-in when authenticated.
    var strip = drop.querySelector('[data-xn-strip]');
    function showUser(streak, xp){ if (strip){ strip.className = 'xn-top xn-user'; strip.innerHTML = userStrip(streak, xp); } }
    document.addEventListener('auth-hydrated', function(e){
      var me = e && e.detail && e.detail.me;
      if (me && me.user) showUser(me.current_streak_days || me.user.current_streak_days, me.total_xp || me.user.total_xp);
    });
    if (document.body.classList.contains('state-pro')) showUser(0, 0);
  }

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
