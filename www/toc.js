// === Generate heading IDs and TOC links (vanilla JS) ===
function slugify(text) {
  return text.replace(/\s+/g, '-').replace(/[^\w-]/g, '');
}

document.querySelectorAll('#content h2, #content h4, #content h5').forEach(function(h) {
  // Only set an id if the heading doesn't already have one. The build pipeline
  // (build.py) pre-assigns ids to H2s for PSEO posts so the auto-injected
  // jump-chip strip can target them. Overwriting here would change the casing
  // (e.g. "what-filter-does..." -> "What-filter-does...") and break those anchors.
  if (!h.id) h.id = slugify(h.textContent);
});

var toc = document.getElementById('toc');
if (toc) {
  document.querySelectorAll('#content h2').forEach(function(h) {
    var li = document.createElement('li');
    li.innerHTML = '<a href="#' + h.id + '">' + h.textContent + '</a>';
    toc.appendChild(li);
  });
}

// === Progress tracking (localStorage) ===
function getVisited() {
  try { return JSON.parse(localStorage.getItem('rstat_visited') || '{}'); } catch(e) { return {}; }
}
function saveVisited(v) {
  try { localStorage.setItem('rstat_visited', JSON.stringify(v)); } catch(e) {}
}
function getCollapsed() {
  try { return JSON.parse(localStorage.getItem('rstat_subsec_collapsed') || '{}'); } catch(e) { return {}; }
}
function saveCollapsed(c) {
  try { localStorage.setItem('rstat_subsec_collapsed', JSON.stringify(c)); } catch(e) {}
}

function getStarted() {
  try { return JSON.parse(localStorage.getItem('rstat_started') || '{}'); } catch(e) { return {}; }
}
function saveStarted(s) {
  try { localStorage.setItem('rstat_started', JSON.stringify(s)); } catch(e) {}
}

// Progress lifecycle for the current page:
//   1. On load: mark as `started` (unless already `visited`).
//   2. On reaching ~80% scroll depth: promote to `visited`.
//   3. Roll the prior last-visited pointer into rstat_continue (read by the
//      sidebar chip), then write the current page as the new last-visited.
(function() {
  var page = window.location.pathname.split('/').pop() || 'index.html';
  if (!page) return;
  var visited = getVisited();
  var started = getStarted();
  if (!visited[page]) {
    started[page] = true;
    saveStarted(started);
  }
  try {
    // Roll prior last-visited into "continue" slot — but only if it points
    // to a different page than the one we're now on. This is what the
    // sidebar chip reads. Update last-visited only after reading it.
    var priorRaw = localStorage.getItem('rstat_last_visited');
    if (priorRaw) {
      var prior = JSON.parse(priorRaw);
      if (prior && prior.href && prior.href !== page) {
        localStorage.setItem('rstat_continue', priorRaw);
      }
    }
    var title = document.title.replace(/\s*[\|—\-].*$/, '').trim() || page;
    localStorage.setItem('rstat_last_visited', JSON.stringify({ href: page, title: title, ts: Date.now() }));
  } catch(e) {}

  if (visited[page]) return;

  function markVisited() {
    var v = getVisited();
    if (v[page]) return;
    v[page] = true;
    saveVisited(v);
    var s = getStarted();
    if (s[page]) { delete s[page]; saveStarted(s); }
  }

  function checkDepth() {
    var doc = document.documentElement;
    var scrolled = window.scrollY || window.pageYOffset || 0;
    var viewport = window.innerHeight || doc.clientHeight;
    var total = doc.scrollHeight - viewport;
    if (total <= 0 || scrolled / total >= 0.8) {
      markVisited();
      window.removeEventListener('scroll', onScroll);
    }
  }
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function() { ticking = false; checkDepth(); });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  // Short pages: if there's nothing to scroll, count it as visited immediately.
  setTimeout(checkDepth, 100);
})();

// === Sidebar Posts/Tools tab switcher ===
// Server renders an initial active tab based on URL (Tools tab when on a
// /tools/* page, Posts tab otherwise). On load we apply the user's pinned
// preference if it conflicts with the current page; clicks update both
// the visible state and the pinned preference.
(function() {
  var tabs = document.querySelectorAll('.sidebar-tab');
  var panels = document.querySelectorAll('.sidebar-panel');
  if (!tabs.length || !panels.length) return;

  function activate(name) {
    tabs.forEach(function(t) { t.classList.toggle('active', t.getAttribute('data-tab') === name); });
    panels.forEach(function(p) { p.classList.toggle('active', p.getAttribute('data-panel') === name); });
  }

  // If the user pinned a tab and the current page is neither a tool nor a
  // post that contradicts the pin, honour it. Tool pages always start on
  // the Tools tab regardless of pin (cheaper than reasoning about pin).
  var onToolPage = window.location.pathname.indexOf('/tools/') === 0;
  if (!onToolPage) {
    try {
      var pinned = localStorage.getItem('rstat_sidebar_tab');
      if (pinned === 'tools' || pinned === 'posts') activate(pinned);
    } catch(e) {}
  }

  tabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
      var name = tab.getAttribute('data-tab');
      activate(name);
      try { localStorage.setItem('rstat_sidebar_tab', name); } catch(e) {}
    });
  });
})();

// === Hydrate the static sidebar with per-user state + click handlers ===
// The sidebar HTML is rendered server-side by build.py, so it ships in the
// initial response and survives Ezoic's external-script stripping. This
// block only enhances it: paints the visited dots from localStorage,
// applies the collapsed-subsection state, and wires up toggle clicks.
(function() {
  var sidebarEl = document.getElementById('sidebar-nav');
  if (!sidebarEl) return;

  var visited = getVisited();
  var started = getStarted();
  var collapsed = getCollapsed();
  var currentPage = window.location.pathname.split('/').pop() || 'index.html';

  // Progress is keyed on the bare filename (pathname.pop()), but sidebar hrefs
  // carry a leading slash (/Foo.html). Normalize before every lookup, else the
  // visited/started dot never matches and the green tick never appears.
  function keyOf(href) { return href.replace(/^\//, ''); }

  // Paint visited / started dots
  sidebarEl.querySelectorAll('.sidebar-section-items a').forEach(function(a) {
    var href = a.getAttribute('href');
    if (!href) return;
    var key = keyOf(href);
    var dot = a.querySelector('.progress-dot');
    if (!dot) return;
    if (visited[key]) dot.classList.add('visited');
    else if (started[key]) dot.classList.add('started');
  });

  // Section meta: "started+visited / total" per section.
  // The current page counts as touched (it's `started` even on first load),
  // so a freshly-landed reader sees "1 / N" instead of an empty header.
  sidebarEl.querySelectorAll('.sidebar-section').forEach(function(section) {
    var meta = section.querySelector('[data-section-meta]');
    if (!meta) return;
    var links = section.querySelectorAll('.sidebar-section-items > li:not(.sidebar-divider) > a');
    var total = links.length;
    if (!total) return;
    var done = 0;
    links.forEach(function(a) {
      var href = a.getAttribute('href');
      if (!href) return;
      var key = keyOf(href);
      if (visited[key] || started[key] || key === currentPage) done++;
    });
    meta.textContent = done + ' / ' + total;
  });

  // Continue-reading chip + end-of-page block: both point to the page
  // visited just before this one. rstat_continue is rolled forward from
  // rstat_last_visited at page load (see top of file).
  //
  // Source-of-truth priority:
  //   1. Server in-progress entry  (only when signed in; via auth-hydrated)
  //   2. Server most-recently-read entry (signed-in fallback)
  //   3. localStorage rstat_continue (anon, or if server returned nothing)
  //
  // We render (3) immediately so anon users + cache-warm sessions never see
  // an empty chip; then upgrade to (1)/(2) once the auth-hydrated event
  // fires with a valid token.
  function applyChip(href, title) {
    if (!href || href === currentPage) return;
    var chip = sidebarEl.querySelector('[data-continue-chip]');
    if (chip) {
      var chipLink = chip.querySelector('[data-continue-link]');
      if (chipLink) {
        chipLink.href = href;
        chipLink.textContent = title || href;
        chip.classList.add('has-link');
      }
    }
    var bottomBlock = document.querySelector('[data-continue-block]');
    if (bottomBlock) {
      var bottomLink = bottomBlock.querySelector('[data-continue-link]');
      if (bottomLink) {
        bottomLink.href = href;
        bottomLink.textContent = title || href;
        bottomBlock.classList.add('has-link');
      }
    }
  }

  // (3) Render from localStorage immediately.
  (function() {
    var raw;
    try { raw = localStorage.getItem('rstat_continue'); } catch(e) { return; }
    if (!raw) return;
    var lv;
    try { lv = JSON.parse(raw); } catch(e) { return; }
    if (!lv || !lv.href) return;
    applyChip(lv.href, lv.title);
  })();

  // (1) + (2) Upgrade to server data on auth-hydrated.
  document.addEventListener('auth-hydrated', function(ev) {
    var token = ev.detail && ev.detail.token;
    if (!token) return;
    // Build a slug -> {href, title} lookup from the rendered sidebar links.
    var lookup = {};
    sidebarEl.querySelectorAll('.sidebar-section-items a').forEach(function(a) {
      var href = a.getAttribute('href');
      if (!href) return;
      var slug = href.replace(/^\//, '').replace(/\.html?$/, '');
      lookup[slug] = { href: href, title: (a.textContent || '').trim() };
    });
    function chooseAndApply(slug) {
      if (!slug) return false;
      var entry = lookup[slug];
      var href = entry ? entry.href : ('/' + slug + '.html');
      var title = entry ? entry.title : slug.replace(/-/g, ' ');
      if (href === currentPage) return false;
      applyChip(href, title);
      return true;
    }
    function fetchKind(kind) {
      return fetch('/api/me/reading?kind=' + kind + '&limit=1', {
        headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/json' },
      }).then(function(r) { return r.ok ? r.json() : null; }).catch(function(){ return null; });
    }
    fetchKind('in_progress').then(function(j) {
      if (j && j.items && j.items.length && chooseAndApply(j.items[0].slug)) return;
      // Fallback: most-recent-any (the user finished reading something — point
      // them to the next thing in the sidebar comes Phase 3+; for now we just
      // surface the latest read so they know we remember).
      fetchKind('all').then(function(j2) {
        if (j2 && j2.items && j2.items.length) chooseAndApply(j2.items[0].slug);
      });
    });
  });

  // Apply collapsed-subsection state from localStorage
  sidebarEl.querySelectorAll('.sidebar-subsection-toggle').forEach(function(divider) {
    var key = divider.getAttribute('data-subkey');
    if (collapsed[key] === true) {
      divider.setAttribute('data-collapsed', 'true');
      var chev = divider.querySelector('.subsec-chevron');
      if (chev) chev.innerHTML = '&#9654;';
      sidebarEl.querySelectorAll('li[data-subkey="' + key + '"]:not(.sidebar-subsection-toggle)').forEach(function(li) {
        li.style.display = 'none';
      });
    }
  });

  // Section toggle (top-level)
  sidebarEl.querySelectorAll('.sidebar-section-header').forEach(function(header) {
    header.addEventListener('click', function() {
      this.closest('.sidebar-section').classList.toggle('expanded');
    });
  });

  // Subsection toggle
  sidebarEl.querySelectorAll('.sidebar-subsection-toggle').forEach(function(divider) {
    divider.addEventListener('click', function() {
      var key = divider.getAttribute('data-subkey');
      var nowCollapsed = divider.getAttribute('data-collapsed') !== 'true';
      divider.setAttribute('data-collapsed', nowCollapsed);
      var chev = divider.querySelector('.subsec-chevron');
      if (chev) chev.innerHTML = nowCollapsed ? '&#9654;' : '&#9660;';

      var c = getCollapsed();
      c[key] = nowCollapsed;
      saveCollapsed(c);

      sidebarEl.querySelectorAll('li[data-subkey="' + key + '"]:not(.sidebar-subsection-toggle)').forEach(function(li) {
        li.style.display = nowCollapsed ? 'none' : '';
      });
    });
  });
})();

// === Scroll-spy for right-side TOC ===
// Uses IntersectionObserver — no scroll handler, no layout reads, no jank.
(function() {
  if (!('IntersectionObserver' in window)) return;
  var headings = document.querySelectorAll('#content h2');
  var tocLinks = document.querySelectorAll('#toc a');
  if (!headings.length || !tocLinks.length) return;

  var linkById = {};
  tocLinks.forEach(function (a) {
    var href = a.getAttribute('href') || '';
    if (href.charAt(0) === '#') linkById[href.slice(1)] = a;
  });

  var visibleIds = {};
  var activeId = null;

  function updateActive() {
    var chosen = null;
    for (var i = 0; i < headings.length; i++) {
      if (visibleIds[headings[i].id]) { chosen = headings[i].id; break; }
    }
    if (!chosen) return;
    if (chosen === activeId) return;
    if (activeId && linkById[activeId]) linkById[activeId].classList.remove('toc-active');
    if (linkById[chosen]) linkById[chosen].classList.add('toc-active');
    activeId = chosen;
  }

  var io = new IntersectionObserver(function (entries) {
    for (var i = 0; i < entries.length; i++) {
      visibleIds[entries[i].target.id] = entries[i].isIntersecting;
    }
    updateActive();
  }, { rootMargin: '-80px 0px -70% 0px', threshold: 0 });

  headings.forEach(function (h) { io.observe(h); });
})();

// === Book navigation: scoped curriculum sidebar for "book" member pages ===
// Pages belonging to a curriculum book (www/curricula.json) get a scoped
// chapter menu in place of the full sidebar, with an in-place swap back to
// the full menu and a return card. Fail-open: any error, missing fetch, or
// non-member page leaves the baked sidebar exactly as it is today.
(function () {
  var sidebarEl = document.getElementById('sidebar-nav');
  if (!sidebarEl) return;
  var slug = window.location.pathname.replace(/^\//, '');
  if (!slug || slug.indexOf('/') !== -1) {
    // books hold root-level tutorials only; index/nested pages keep the full menu
    if (slug !== '') return;
  }

  fetch('/www/curricula.json?v=4').then(function (r) { return r.ok ? r.json() : null; }).then(function (data) {
    if (!data || !data.books) return;
    var book = null, flat = [], cur = -1;
    data.books.forEach(function (b) {
      if (book) return;
      var f = [];
      b.parts.forEach(function (p) { p.chapters.forEach(function (c) { f.push(c); }); });
      var hit = f.some(function (c) { return c.href === '/' + slug; });
      if (hit) { book = b; flat = f; }
    });
    if (!book) return;

    var css = [
      '#sidebar-nav .bn-wrap{position:relative;overflow:hidden}',
      '.bn-panel{transition:transform .26s ease,opacity .26s ease}',
      '.bn-off{position:absolute;top:0;left:0;width:100%;opacity:0;pointer-events:none}',
      '.bn-off-l{transform:translateX(-108%)}.bn-off-r{transform:translateX(108%)}',
      '.bn-back{background:none;border:1px solid #e2ded2;border-radius:9px;padding:5px 11px;font-size:12px;font-weight:600;color:#5b6068;cursor:pointer;margin:0 0 10px}',
      '.bn-back:hover{color:#1a1a1a;border-color:#c9c3b2}',
      '.bn-title{font-family:"Inter Tight",Inter,"IBM Plex Sans",sans-serif;font-weight:700;font-size:16.5px;line-height:1.3;color:#16181d;margin:2px 0 2px}',
      '.bn-home{display:inline-block;font-size:12px;font-weight:600;color:#1f7a55;text-decoration:none;margin:0 0 6px}',
      '.bn-home:hover{text-decoration:underline}',
      '.bn-part{font-family:"Inter Tight",Inter,sans-serif;font-weight:600;font-size:12.5px;color:#14532d;margin:13px 0 4px}',
      '.bn-list{list-style:none;margin:0;padding:0}',
      '.bn-list a,.bn-soon{display:flex;gap:7px;align-items:baseline;padding:3px 6px 3px 2px;font-size:13px;line-height:1.4;color:#3f434b;text-decoration:none;border-radius:6px}',
      '.bn-list a:hover{background:#f2efe6;color:#1a1a1a}',
      '.bn-n{min-width:18px;text-align:right;font-size:10.5px;color:#b3ac97}',
      '.bn-cur>a{background:#eaf4ee;color:#14532d;font-weight:600}',
      '.bn-cur .bn-n{color:#1f7a55}',
      '.bn-soon{color:#a7acb4}',
      '.bn-soon .bn-tag{margin-left:auto;font-size:9.5px;font-weight:700;color:#8a8f98;border:1px solid #e5e7ea;border-radius:999px;padding:0 6px}',
      '.bn-pro{border-top:1px solid #eceadf;margin-top:14px;padding-top:11px}',
      '.bn-pro-h{font-family:"Inter Tight",Inter,sans-serif;font-weight:600;font-size:13px;color:#16181d;margin-bottom:3px}',
      '.bn-pro p{font-size:11.5px;color:#6b7280;line-height:1.45;margin:0 0 6px}',
      '.bn-pro a{font-size:12px;font-weight:600;color:#14532d;text-decoration:none}',
      '.bn-pro a:hover{text-decoration:underline}',
      '.bn-return{border:1px solid #d9e8de;background:#f2f8f4;border-radius:10px;padding:9px 11px;margin:0 0 12px}',
      '.bn-return-hint{font-size:10.5px;color:#6b7280;margin-bottom:4px}',
      '.bn-return-btn{background:#1f7a55;color:#fff;border:0;border-radius:8px;padding:6px 10px;font-size:12px;font-weight:600;cursor:pointer;text-align:left;width:100%}',
      '.bn-return-btn:hover{background:#17603f}'
    ].join('\n');
    var st = document.createElement('style');
    st.setAttribute('data-bn-css', '');
    st.textContent = css;
    document.head.appendChild(st);

    function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
    var n = 0, html = [];
    html.push('<button type="button" class="bn-back" data-bn-main>&larr; All tutorials</button>');
    html.push('<div class="bn-title">' + esc(book.title) + '</div>');
    html.push('<a class="bn-home" href="' + book.index + '">Book contents &rarr;</a>');
    book.parts.forEach(function (p, pi) {
      html.push('<div class="bn-part">' + (pi + 1) + '. ' + esc(p.title) + '</div><ul class="bn-list">');
      p.chapters.forEach(function (c) {
        n += 1;
        if (c.href) {
          var curCls = (c.href === '/' + slug) ? ' class="bn-cur"' : '';
          html.push('<li' + curCls + '><a href="' + c.href + '"><span class="bn-n">' + n + '</span>' + esc(c.title) + '</a></li>');
        } else {
          html.push('<li><span class="bn-soon"><span class="bn-n">' + n + '</span>' + esc(c.title) + '</span></li>');
        }
      });
      html.push('</ul>');
    });
    if (book.pro) {
      html.push('<div class="bn-pro"><div class="bn-pro-h">Prefer it guided?</div><p>' + esc(book.pro.blurb) + '</p><a href="' + book.pro.href + '">' + esc(book.pro.label) + ' &rarr;</a></div>');
    }

    var wrap = document.createElement('div');
    wrap.className = 'bn-wrap';
    var main = document.createElement('div');
    main.className = 'bn-panel';
    main.id = 'bn-main';
    while (sidebarEl.firstChild) main.appendChild(sidebarEl.firstChild);
    var ret = document.createElement('div');
    ret.className = 'bn-return';
    ret.innerHTML = '<div class="bn-return-hint">You are reading a chapter of</div>' +
      '<button type="button" class="bn-return-btn" data-bn-book>' + esc(book.short || book.title) + ' &rarr;</button>';
    main.insertBefore(ret, main.firstChild);
    var bookPanel = document.createElement('div');
    bookPanel.className = 'bn-panel';
    bookPanel.id = 'bn-book';
    bookPanel.innerHTML = html.join('');
    wrap.appendChild(bookPanel);
    wrap.appendChild(main);
    sidebarEl.appendChild(wrap);

    function show(which) {
      if (which === 'main') {
        bookPanel.classList.add('bn-off', 'bn-off-l');
        main.classList.remove('bn-off', 'bn-off-r', 'bn-off-l');
      } else {
        main.classList.add('bn-off', 'bn-off-r');
        bookPanel.classList.remove('bn-off', 'bn-off-l', 'bn-off-r');
      }
      try { sessionStorage.setItem('bn-state:' + book.key, which); } catch (e) {}
      wrap.style.minHeight = ((which === 'main' ? main : bookPanel).offsetHeight || 0) + 'px';
    }
    wrap.addEventListener('click', function (e) {
      if (e.target.closest('[data-bn-main]')) show('main');
      else if (e.target.closest('[data-bn-book]')) show('book');
    });
    var initial = 'book';
    try { initial = sessionStorage.getItem('bn-state:' + book.key) || 'book'; } catch (e) {}
    show(initial);
    // No auto-scroll: centering the current chapter scrolled the rail down on
    // deep chapters, making Part 1 look missing (and nudged the page scroll).
    // The rail always opens at the top; the reader's position is the page.
  }).catch(function () { /* fail-open: baked sidebar stays */ });
})();
