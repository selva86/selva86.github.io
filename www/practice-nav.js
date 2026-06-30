/* practice-nav.js - upgrades the masthead "Exercises" link into a "Practice" mega-dropdown.
   Progressive enhancement: no JS / no hover -> the link still goes to /exercises/.
   Loaded only on the template (tutorials) + home, never on roadmap/pricing/transactional pages.
   Default state is the non-signed-in visitor; swaps to a signed-in strip on auth-hydrated. */
(function(){
  if (window.__practiceNav) return; window.__practiceNav = 1;

  var PATHS = [
    ['R Fundamentals','/R-Basics-Exercises.html','14 hubs','M9 8 L6 12 L9 16 M15 8 L18 12 L15 16'],
    ['Data Wrangling','/dplyr-Exercises.html','30 hubs','M6 8 H18 M6 12 H15 M6 16 H18'],
    ['Visualization','/ggplot2-Exercises.html','17 hubs','POLY:6 16 10 11 14 14 18 7'],
    ['Statistics','/Hypothesis-Testing-Exercises-in-R.html','32 hubs','BELL'],
    ['Machine Learning','/Machine-Learning-Exercises-in-R.html','13 hubs','TARGET'],
    ['Advanced R','/R-Functional-Programming-Exercises.html','11 hubs','M8.5 8 L6 12 L8.5 16 M15.5 8 L18 12 L15.5 16 M13 7 L11 17'],
    ['Specializations','/R-for-Finance-Exercises.html','10 hubs','POLY:6 15 10 10 13 12 18 6'],
    ['Mastery Quizzes','/certifications','11 quizzes','MEDAL']
  ];
  var SOLVED = {0:'23',1:'11',2:'4',3:'0',4:'0',5:'2'}; // shown only when signed in (sample until per-path API lands)

  function glyph(d){
    if (d === 'BELL') return '<path d="M7 16 C7 10, 17 10, 17 16" stroke="currentColor" stroke-width="2" fill="none"/><line x1="12" y1="16" x2="12" y2="8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>';
    if (d === 'TARGET') return '<circle cx="12" cy="12" r="6" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="12" cy="12" r="2" fill="currentColor"/>';
    if (d === 'MEDAL') return '<circle cx="12" cy="10" r="5" stroke="currentColor" stroke-width="2" fill="none"/><polyline points="9 14 8 20 12 18 16 20 15 14" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
    if (d.indexOf('POLY:') === 0) return '<polyline points="'+d.slice(5)+'" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
    return '<path d="'+d+'" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
  }
  var ARR = '<svg class="xn-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';

  function pathsHTML(){
    return PATHS.map(function(p,i){
      var solved = SOLVED.hasOwnProperty(i) ? ' <span class="xn-solved" data-xn-solved>&middot; '+SOLVED[i]+' solved</span>' : '';
      return '<a class="xn-path" href="'+p[1]+'"><span class="xn-g"><svg viewBox="0 0 24 24" fill="none">'+glyph(p[3])+'</svg></span>'+
        '<span class="xn-pn"><span class="xn-nm">'+p[0]+'</span><span class="xn-ct">'+p[2]+solved+'</span></span></a>';
    }).join('');
  }

  function panelHTML(){
    return ''+
    '<div class="xn-top xn-anon" data-xn-strip>'+
      '<div class="xn-pl"><svg class="xn-ic" style="width:18px;height:18px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 4 14 11 14 10 22 19 9 12 9 13 2"/></svg></div>'+
      '<div class="xn-pt"><div class="xn-k">2,904 problems &middot; graded instantly</div>'+
        '<b class="xn-h">Practice R by solving real problems</b>'+
        '<span class="xn-s">free to attempt, no signup, no multiple choice</span></div>'+
      '<a class="xn-btn" href="/R-Basics-Exercises.html">Start with R Basics '+ARR+'</a>'+
    '</div>'+
    '<div class="xn-body">'+
      '<div class="xn-paths"><div class="xn-label">Browse by path</div><div class="xn-grid">'+pathsHTML()+'</div></div>'+
      '<div class="xn-side"><div class="xn-label">Start here</div>'+
        '<a class="xn-starter" href="/R-Basics-Exercises.html"><span class="xn-num">1</span><span class="xn-sn"><span class="xn-snm">R Basics</span><span class="xn-wy">Short enough to win several in a row.</span></span></a>'+
        '<a class="xn-starter" href="/dplyr-filter-select-Exercises.html"><span class="xn-num">2</span><span class="xn-sn"><span class="xn-snm">dplyr: filter &amp; select</span><span class="xn-wy">The two verbs you reach for daily.</span></span></a>'+
        '<a class="xn-starter" href="/ggplot2-Exercises.html"><span class="xn-num">3</span><span class="xn-sn"><span class="xn-snm">ggplot2</span><span class="xn-wy">Where practice feels like play.</span></span></a>'+
        '<div class="xn-warm"><div class="xn-wk"><svg class="xn-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 L13.8 9.4 L20 11 L13.8 12.6 L12 19 L10.2 12.6 L4 11 L10.2 9.4 Z"/></svg> Today\'s warm-up</div>'+
          '<div class="xn-wq">Return the second-largest value of <code>x</code> without <code>sort()</code>.</div>'+
          '<a class="xn-wgo" href="/R-Vectors-Exercises.html">Solve it in a minute '+ARR+'</a></div>'+
      '</div>'+
    '</div>'+
    '<div class="xn-foot"><span class="xn-tot"><b>2,904</b> problems &middot; <b>127</b> hubs &middot; free to attempt</span>'+
      '<span class="xn-fl"><a href="/exercises/">Browse all exercises '+ARR+'</a><a href="/certifications">Mastery quizzes '+ARR+'</a></span></div>';
  }

  // Build the signed-in version of the top strip.
  function userStrip(streak, xp){
    var k = (streak && streak > 0) ? (streak + '-day streak' + (xp ? (' &middot; ' + xp + ' XP') : ''))
                                   : (xp ? (xp + ' XP earned') : 'your progress is saved');
    return '<div class="xn-pl"><svg class="xn-ic" style="width:18px;height:18px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c1.6 3 4.6 4.2 4.6 8a4.6 4.6 0 0 1-9.2 0c0-1.5.6-2.5 1.5-3.3C9.4 9 10 10 10 11c.9-1.7.6-4.5 2-8z"/></svg></div>'+
      '<div class="xn-pt"><div class="xn-k">'+k+'</div>'+
        '<b class="xn-h">Pick up where you left off</b>'+
        '<span class="xn-s">your streak, XP and solved problems are saved</span></div>'+
      '<a class="xn-btn" href="/exercises/">Resume practice '+ARR+'</a>';
  }

  function init(){
    var link = document.querySelector('.masthead-nav-link[href="/exercises/"]') || document.querySelector('.nav a[href="/exercises/"]');
    if (!link || link.closest('.xn-wrap')) return;

    if (!document.querySelector('link[data-xn-css]')){
      var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = '/www/practice-nav.css?v=1';
      l.setAttribute('data-xn-css', ''); document.head.appendChild(l);
    }

    var wrap = document.createElement('div'); wrap.className = 'xn-wrap';
    link.parentNode.insertBefore(wrap, link); wrap.appendChild(link);
    link.classList.add('xn-trigger');
    link.setAttribute('aria-haspopup', 'true'); link.setAttribute('aria-expanded', 'false');
    link.insertAdjacentHTML('beforeend', ' <svg class="xn-car" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>');

    var drop = document.createElement('div'); drop.className = 'xn-drop'; drop.setAttribute('role', 'menu');
    drop.innerHTML = panelHTML(); wrap.appendChild(drop);

    var open = false, closeT;
    function setOpen(o){ open = o; wrap.classList.toggle('xn-open', o); link.setAttribute('aria-expanded', o ? 'true' : 'false'); }
    function canPanel(){ return window.innerWidth > 900 && window.matchMedia('(hover:hover)').matches; }

    wrap.addEventListener('mouseenter', function(){ if (canPanel()){ clearTimeout(closeT); setOpen(true); } });
    wrap.addEventListener('mouseleave', function(){ if (canPanel()){ closeT = setTimeout(function(){ setOpen(false); }, 120); } });
    link.addEventListener('click', function(e){ if (window.innerWidth > 900){ e.preventDefault(); setOpen(!open); } });
    document.addEventListener('click', function(e){ if (open && !wrap.contains(e.target)) setOpen(false); });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && open) setOpen(false); });

    // personalization: default is visitor; swap to signed-in when authenticated.
    var strip = drop.querySelector('[data-xn-strip]');
    function showUser(streak, xp){
      if (!strip) return;
      strip.className = 'xn-top xn-user'; strip.innerHTML = userStrip(streak, xp);
      var sv = drop.querySelectorAll('[data-xn-solved]'); for (var i=0;i<sv.length;i++) sv[i].style.display = '';
    }
    // hide the sample "solved" counts until we know the user is signed in
    var sv0 = drop.querySelectorAll('[data-xn-solved]'); for (var i=0;i<sv0.length;i++) sv0[i].style.display = 'none';

    document.addEventListener('auth-hydrated', function(e){
      var me = e && e.detail && e.detail.me;
      if (me && me.user) showUser(me.current_streak_days || me.user.current_streak_days, me.total_xp || me.user.total_xp);
    });
    // if hydration already happened (signed-in class set) before this listener attached, show a generic signed-in strip
    if (document.body.classList.contains('state-pro')) showUser(0, 0);
  }

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
