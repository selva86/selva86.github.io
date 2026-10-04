/* Roadmap re-skin overlay (design mock, 2026-10). Loaded only by the preview
   copies roadmap/reskin.html and roadmap/reskin-forecaster.html. It swaps copy,
   corrects the free/Pro labels to match the real gating, and adds the
   "Where to start" rows and the route diagram. A Before / After switch flips
   every change; ?before opens in the original state. */
(function () {
  var doc = document.documentElement;
  var after = !/[?&]before\b/.test(location.search);
  var swapped = [];

  /* Swap an element's HTML. Re-renders by the page's own scripts are detected
     (content neither the original nor ours) and swapped again. */
  function swap(el, html) {
    if (!el) return;
    var s = el.__rs;
    if (!s) { s = el.__rs = { b: el.innerHTML, a: html }; swapped.push(el); }
    else if (el.innerHTML !== s.a && el.innerHTML !== s.b) { s.b = el.innerHTML; s.a = html; }
    var want = after ? s.a : s.b;
    if (el.innerHTML !== want) el.innerHTML = want;
  }
  function q(sel, root) { return (root || document).querySelector(sel); }
  function qa(sel, root) { return [].slice.call((root || document).querySelectorAll(sel)); }
  function add(html, ref, where) {
    var t = document.createElement('div'); t.innerHTML = html; var n = t.firstChild;
    ref.insertAdjacentElement(where, n); return n;
  }
  var ARR = '<i aria-hidden="true">&rarr;</i>';

  /* Real numbers from courses.json + the Pro gating list (2026-10-04). */
  var TRACK = {
    foundations: { name: 'New to R', page: '/roadmap/new-to-r.html', c: '--core', secs: 8, lessons: 43, access: 'Free', sub: 'R programming foundations',
      out: 'The R language itself: data types, data frames, control flow and functions.' },
    analyst: { name: 'Data Analyst', page: '/roadmap/data-analyst.html', c: '--core', secs: 9, lessons: 44, access: 'Section 1 free', sub: 'Data analysis with the tidyverse',
      out: 'Turn raw data into tables and charts with dplyr, tidyr and ggplot2.' },
    ds: { name: 'Data Scientist', page: '/roadmap/data-scientist.html', c: '--ds', secs: 29, lessons: 178, access: 'Section 1 free', sub: 'Predictive modelling and machine learning',
      out: 'Build predictive models with tidymodels and check how well they hold up on new data.' },
    ts: { name: 'Forecaster', page: '/roadmap/forecaster.html', c: '--ts', secs: 16, lessons: 99, access: 'Section 1 free', sub: 'Time series analysis and forecasting',
      out: 'Build forecasts with ETS, ARIMA and machine learning models, and measure their accuracy.' },
    researcher: { name: 'Researcher', page: '/roadmap/researcher.html', c: '--res', secs: 16, lessons: 0, access: 'Section 1 free', sub: 'Statistical inference and reporting',
      out: 'Choose the right statistical test and report results the way journals expect.' },
    developer: { name: 'R Developer', page: '/roadmap/r-developer.html', c: '--dev', secs: 15, lessons: 0, access: 'Section 1 free', sub: 'Advanced R and software engineering',
      out: 'Write and test R packages, and build Shiny applications.' }
  };
  var VIZ = { foundations: 'foundations', analyst: 'analyst', ds: 'ds', ts: 'ts', researcher: 'researcher', developer: 'developer' };
  function facts(t, order) {
    var lessons = t.lessons ? t.lessons + ' lessons' : 'Lessons in progress';
    var bits = order === 'lessons-first' ? [lessons, t.secs + ' sections'] : [t.secs + ' sections', lessons];
    bits.push(t.access);
    return bits.map(function (b) { return '<span' + (/free/i.test(b) ? ' class="free"' : '') + '>' + b + '</span>'; }).join('');
  }
  function keyOfCard(card) {
    var v = card.getAttribute('data-viz') || '', href = card.getAttribute('href') || '';
    for (var k in TRACK) if (VIZ[k] === v || TRACK[k].page === href) return k;
    return null;
  }

  /* The route, drawn from the real paths: shared core, then the fork. */
  function routeSvg() {
    var sp = ['ds', 'ts', 'researcher', 'developer'], ys = [40, 90, 140, 190], my = 115;
    function node(x, y, k, cap) {
      var t = TRACK[k];
      return '<a href="' + t.page + '"><text x="' + x + '" y="' + y + '" class="rn">' + t.name + '</text>' +
        '<line x1="' + x + '" y1="' + (y + 8) + '" x2="' + (x + 26) + '" y2="' + (y + 8) + '" stroke="var(' + t.c + ')" stroke-width="3" stroke-linecap="round"/>' +
        (cap.below ? '<text x="' + x + '" y="' + (y + 27) + '" class="rc">' + cap.text + '</text>'
                   : '<text x="' + (x + 150) + '" y="' + y + '" class="rc">' + cap.text + '</text>') + '</a>';
    }
    var g = '<path d="M150 ' + (my - 4) + ' H280" class="rl" marker-end="url(#rsah)"/>';
    ys.forEach(function (y) { g += '<path d="M440 ' + (my - 4) + ' C 500 ' + (my - 4) + ', 520 ' + (y - 4) + ', 585 ' + (y - 4) + '" class="rl" marker-end="url(#rsah)"/>'; });
    g += node(20, my - 8, 'foundations', { below: true, text: 'Free in full' });
    g += node(300, my - 8, 'analyst', { below: true, text: 'Section 1 free' });
    sp.forEach(function (k, i) { g += node(600, ys[i], k, { text: TRACK[k].sub }); });
    return '<svg class="rs-route" viewBox="0 0 1040 210" role="img" aria-label="New to R, then Data Analyst, then one of four specializations">' +
      '<style>.rs-route .rn{font:600 14px Inter,sans-serif;fill:var(--ink)}.rs-route .rc{font:400 12.5px Inter,sans-serif;fill:var(--faint)}.rs-route .rl{stroke:#c3ccd6;stroke-width:1.5;fill:none}.rs-route a:hover .rn{fill:var(--c,var(--ink))}</style>' +
      '<defs><marker id="rsah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M1 1l8 4-8 4" fill="none" stroke="#c3ccd6" stroke-width="1.5"/></marker></defs>' +
      g + '</svg>';
  }

  function mainPage() {
    var hero = q('header.hero');
    if (!hero || !q('#coreRoles')) return;
    swap(q('#hlede'), 'Interactive R lessons, organized by the job you want. Start with the free R foundations, then choose a specialization.');
    var stats = q('#hstats');
    if (stats && !q('.rs-fact')) add('<p class="rs-add rs-fact"><b>366</b> interactive lessons so far, across six paths.</p>', stats, 'afterend');
    var cap = q('.hviz-cap');
    if (cap) swap(cap, '<b>Lesson 4, Data Analyst track.</b> You write the R code that draws it.');

    // Where to start, between the hero and the path cards
    if (!q('.rs-start')) {
      var rows = [
        ['You have not written R before', 'foundations', 'New to R, lesson 1', '/R-Syntax-and-First-Objects.html'],
        ['You can write R and want to analyze data', 'analyst', 'Data Analyst'],
        ['You analyze data and want to build predictive models', 'ds', 'Data Scientist'],
        ['You work with data recorded over time', 'ts', 'Forecaster'],
        ['You run studies and report statistical results', 'researcher', 'Researcher'],
        ['You write R code that other people use', 'developer', 'R Developer']
      ].map(function (r) {
        var t = TRACK[r[1]];
        return '<a class="rs-row" style="--c:var(' + t.c + ')" href="' + (r[3] || t.page) + '"><span class="q">' + r[0] + '</span><span class="a">' + r[2] + ' ' + ARR + '</span></a>';
      }).join('');
      add('<section class="rs-add rs-start"><h2 class="disp">Where to start</h2><p class="lead">Pick the line that sounds most like you.</p><div class="rs-rows">' + rows + '</div></section>', hero, 'afterend');
    }

    // path cards
    var roles = q('section.roles');
    if (roles) {
      swap(q('.roles-head h2', roles), 'Six learning paths');
      swap(q('.roles-head p', roles), 'Everyone takes New to R and Data Analyst first. Then choose one specialization, or several.');
      var labels = qa('.rlabel', roles);
      swap(labels[0], 'The shared core');
      swap(labels[1], 'Specializations');
    }
    qa('.rcard').forEach(function (card) {
      var k = keyOfCard(card); if (!k) return;
      var t = TRACK[k];
      swap(q('.rout', card), t.out);
      swap(q('.rmeta', card), facts(t));
      if (k === 'foundations') {
        var viz = q('.rviz', card);
        if (viz && !q('.rs-code', viz)) add('<div class="rs-add rs-code"><pre>x &lt;- c(12, 7, 21, 9)\nmean(x)\n<span class="o">#&gt; [1] 12.25</span></pre></div>', viz, 'beforeend');
      }
    });

    // chapters
    var shs = qa('.shead');
    shs.forEach(function (sh) {
      var h = q('h2', sh); if (!h) return;
      var p = q('p', sh);
      if (/foundation/i.test(h.textContent) || (h.__rs && /foundation/i.test(h.__rs.b))) swap(p, 'Every path starts with these two: the R language, then data analysis with the tidyverse. New to R is free in full, and the first section of Data Analyst is free.');
      if (/specializ/i.test(h.textContent) || (h.__rs && /specializ/i.test(h.__rs.b))) swap(p, 'Section 1 of every specialization is free. Pro opens the remaining sections, graded exercises and the certificate.');
      if (/projects/i.test(h.textContent) || (h.__rs && /projects/i.test(h.__rs.b))) {
        swap(h, 'Projects');
        swap(p, 'Guided projects are in development. These are the ones planned for each path.');
      }
    });
    qa('.chmeta[data-track]').forEach(function (m) {
      var k = m.getAttribute('data-track'), t = TRACK[k]; if (!t) return;
      swap(m, facts(t, 'lessons-first'));
      var ch = m.closest('.chapter'); if (!ch) return;
      swap(q('.chhead h3', ch), t.name);
      var cred = q('.cred', ch);
      if (cred) {
        var ct = q('.ct', cred), name = ((ct && (ct.__rs ? ct.__rs.b : ct.textContent)) || '').replace(/^Earn the /, '').replace(/ certificate$/, '');
        swap(ct, 'Certificate: ' + name);
        swap(q('.cs', cred), 'Awarded when you complete every section of the path.');
      }
    });
    // free/Pro chips follow the real gating: only New to R is free beyond section 1
    qa('details.sec[data-track]').forEach(function (d) {
      var k = d.getAttribute('data-track'), n = +d.getAttribute('data-sec');
      if (k === 'foundations' || n <= 1) return;
      var chip = q('.sright .chip', d); if (!chip) return;
      if (!chip.__rsCls) chip.__rsCls = chip.className;
      chip.className = after ? 'chip pro' : chip.__rsCls;
      swap(chip, '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:11px;height:11px"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>Pro');
    });

    // hand-off between the core and the specializations, with the route diagram
    var fork = q('.fork-wrap');
    if (fork) {
      swap(q('b', fork), 'After the shared core, choose a specialization.');
      swap(q('span', fork), 'The four specializations are independent. Take one, or several in any order. Each has its own certificate.');
      var fsvg = q(':scope > svg', fork);
      if (fsvg) { if (!fsvg.__rsDisp) fsvg.__rsDisp = fsvg.style.display || ''; fsvg.style.display = after ? 'none' : fsvg.__rsDisp; }
      if (!q('.rs-routewrap', fork)) add('<div class="rs-add rs-routewrap" style="margin-top:14px">' + routeSvg() + '</div>', fork, 'beforeend');
    }

    qa('.psoon').forEach(function (s) { swap(s, 'Planned'); });

    var fin = q('#cert.final');
    if (fin) {
      swap(q('h2', fin), 'Start with the free R foundations');
      swap(q('.final-copy p', fin), 'New to R is free from the first lesson to the last, and every other path is free for its first section. Pro opens the remaining sections, graded exercises and the certificates.');
      swap(q('.final-copy .btn-primary', fin), 'See Pro plans <span class="a">&rarr;</span>');
    }
  }

  function trackPage() {
    var curric = q('#curric');
    if (!curric) return;
    var secs = qa('details.sec', curric), N = secs.length;
    var certB = q('#roleMeta span:last-child b'), cert = certB ? certB.textContent : 'track';
    if (/forecaster/.test(location.pathname)) swap(q('#roleDek'), 'Build and evaluate forecasts in R with ETS, ARIMA, regression and machine learning models.');
    var pre = q('#prereq');
    if (pre && pre.textContent.trim()) {
      var links = qa('a', pre).map(function (a) { return a.outerHTML; });
      if (links.length >= 2) swap(pre, 'Comes after ' + links[0] + ' and ' + links[1] + '. If you already use the tidyverse, you can start here.');
    }
    swap(q('#curLead'), 'Section 1 is free. Sections 2 to ' + N + ' are included with Pro, along with the ' + cert + ' certificate.');
    secs.forEach(function (d, i) {
      var st = q('summary .st', d); if (!st) return;
      if (!q('.rs-smeta', st)) {
        var cnt = qa('.lsn', d).length, pro = i > 0;
        add('<span class="rs-add rs-smeta">' + cnt + ' lesson' + (cnt === 1 ? '' : 's') + ' &middot; ' + (pro ? '<span class="p">Pro</span>' : 'Free') + '</span>', st, 'beforeend');
      }
      if (i === 1 && !q('.rs-probreak', curric)) add('<div class="rs-add rs-probreak"><b>Sections 2 to ' + N + ' are included with Pro.</b><span>Every lesson is listed so you can see what you get.</span><a href="/pricing.html">See plans</a></div>', d, 'beforebegin');
    });
    var ps = q('#projects-sec');
    if (ps) {
      swap(q('.shead h2', ps), 'Projects');
      swap(q('.shead p', ps), 'Guided projects for this path are in development.');
      qa('.ptag.soon', ps).forEach(function (t) { swap(t, 'Planned'); });
    }
    swap(q('#certSub'), 'Section 1 is free. Pro opens the other ' + (N - 1) + ' sections, graded exercises and the ' + cert + ' certificate.');
    swap(q('.certband a.primary'), 'See Pro plans <span class="a">&rarr;</span>');
  }

  /* keep the reviewer inside the two mock pages */
  function linkup() {
    qa('a[href="/roadmap/forecaster.html"]').forEach(function (a) { a.setAttribute('href', '/roadmap/reskin-forecaster.html'); });
    qa('a[href="/roadmap/"]').forEach(function (a) { a.setAttribute('href', '/roadmap/reskin.html'); });
  }

  var busy = false;
  function run() {
    if (busy) return; busy = true;
    doc.classList.toggle('rs-after', after);
    try { mainPage(); trackPage(); linkup(); } catch (e) { if (window.console) console.error('[reskin]', e); }
    busy = false;
  }
  function setMode(a) {
    after = a; run();
    qa('.rs-switch button').forEach(function (b) { b.classList.toggle('on', (b.getAttribute('data-m') === 'after') === after); });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var sw = document.createElement('div');
    sw.className = 'rs-switch';
    sw.innerHTML = '<span>Re-skin mock</span><button type="button" data-m="before">Before</button><button type="button" data-m="after">After</button>';
    document.body.appendChild(sw);
    sw.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) setMode(b.getAttribute('data-m') === 'after'); });
    setMode(after);
    var t = null;
    new MutationObserver(function () { if (busy) return; clearTimeout(t); t = setTimeout(run, 120); })
      .observe(document.body, { childList: true, subtree: true });
    setTimeout(run, 400); setTimeout(run, 1500);
  });
})();
