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

// Mark current page as visited
(function() {
  var page = window.location.pathname.split('/').pop() || 'index.html';
  if (page) {
    var visited = getVisited();
    visited[page] = true;
    saveVisited(visited);
  }
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
  var collapsed = getCollapsed();

  // Paint visited dots
  sidebarEl.querySelectorAll('.sidebar-section-items a').forEach(function(a) {
    var href = a.getAttribute('href');
    if (href && visited[href]) {
      var dot = a.querySelector('.progress-dot');
      if (dot) dot.classList.add('visited');
    }
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
