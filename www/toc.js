// === Generate heading IDs and TOC links (vanilla JS) ===
function slugify(text) {
  return text.replace(/\s+/g, '-').replace(/[^\w-]/g, '');
}

document.querySelectorAll('#content h2, #content h4, #content h5').forEach(function(h) {
  h.id = slugify(h.textContent);
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
//   3. Update last-visited pointer for the continue-reading chip.
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

  // Paint visited / started dots
  sidebarEl.querySelectorAll('.sidebar-section-items a').forEach(function(a) {
    var href = a.getAttribute('href');
    if (!href) return;
    var dot = a.querySelector('.progress-dot');
    if (!dot) return;
    if (visited[href]) dot.classList.add('visited');
    else if (started[href]) dot.classList.add('started');
  });

  // Section meta: "visited / total" per section
  sidebarEl.querySelectorAll('.sidebar-section').forEach(function(section) {
    var meta = section.querySelector('[data-section-meta]');
    if (!meta) return;
    var links = section.querySelectorAll('.sidebar-section-items > li:not(.sidebar-divider) > a');
    var total = links.length;
    if (!total) return;
    var done = 0;
    links.forEach(function(a) {
      var href = a.getAttribute('href');
      if (href && visited[href]) done++;
    });
    if (done > 0) meta.textContent = done + ' / ' + total;
  });

  // Continue-reading chip: link to most recently visited page (skip if it's the current page)
  (function() {
    var chip = sidebarEl.querySelector('[data-continue-chip]');
    if (!chip) return;
    var raw;
    try { raw = localStorage.getItem('rstat_last_visited'); } catch(e) { return; }
    if (!raw) return;
    try {
      var lv = JSON.parse(raw);
      if (!lv || !lv.href || lv.href === currentPage) return;
      var link = chip.querySelector('[data-continue-link]');
      if (!link) return;
      link.href = lv.href;
      link.textContent = lv.title || lv.href;
      chip.classList.add('has-link');
    } catch(e) {}
  })();

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
