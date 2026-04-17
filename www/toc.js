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

// === Dynamic sidebar from sidebar.json ===
(function() {
  var currentPage = window.location.pathname.split('/').pop() || 'index.html';
  var sidebarEl = document.getElementById('sidebar-nav');
  if (!sidebarEl) return;

  fetch('/www/sidebar.json')
    .then(function(r) { return r.json(); })
    .then(function(sections) {
      var visited = getVisited();
      var collapsed = getCollapsed();
      var html = '<ul class="sidebar-menu list-unstyled">';

      for (var i = 0; i < sections.length; i++) {
        var section = sections[i];
        if (!section.items || section.items.length === 0) continue;

        var hasActive = false;
        for (var j = 0; j < section.items.length; j++) {
          if (section.items[j].divider) continue;
          if (section.items[j].href === currentPage) { hasActive = true; break; }
        }

        html += '<li class="sidebar-section' + (hasActive ? ' expanded' : '') + '">';
        html += '<div class="sidebar-section-header">';
        html += '<span class="sidebar-chevron">&#9656;</span> ' + section.title;
        html += '</div>';
        html += '<ul class="sidebar-section-items list-unstyled">';

        var subIdx = 0;
        for (var k = 0; k < section.items.length; k++) {
          var item = section.items[k];
          if (item.divider) {
            subIdx++;
            var subKey = 'sec' + i + 'sub' + subIdx;
            var isCollapsed = collapsed[subKey] === true;
            html += '<li class="sidebar-divider sidebar-subsection-toggle" data-subkey="' + subKey + '" data-collapsed="' + isCollapsed + '">';
            html += '<span class="subsec-chevron">' + (isCollapsed ? '&#9654;' : '&#9660;') + '</span> ';
            html += item.text;
            html += '</li>';
            continue;
          }
          var isActive = item.href === currentPage;
          var isVisited = visited[item.href] === true;
          var curSubKey = 'sec' + i + 'sub' + subIdx;
          var isHidden = subIdx > 0 && collapsed[curSubKey] === true;
          html += '<li' + (isHidden ? ' style="display:none"' : '') + ' data-subkey="' + curSubKey + '">';
          html += '<a href="' + item.href + '"' + (isActive ? ' class="active"' : '') + '>';
          html += '<span class="progress-dot' + (isVisited ? ' visited' : '') + '"></span>';
          html += item.text;
          html += '</a></li>';
        }

        html += '</ul></li>';
      }

      html += '</ul>';
      html += '<div class="sidebar-subscribe">';
      html += '<p>Stay up-to-date. <a href="https://docs.google.com/forms/d/1xkMYkLNFU9U39Dd8S_2JC0p8B5t6_Yq6zUQjanQQJpY/viewform">Subscribe!</a></p>';
      html += '<p><a href="https://docs.google.com/forms/d/13GrkCFcNa-TOIllQghsz2SIEbc-YqY9eJX02B19l5Ow/viewform">Chat!</a></p>';
      html += '</div>';

      sidebarEl.innerHTML = html;

      // Expand first section if none active
      if (!sidebarEl.querySelector('.sidebar-section.expanded')) {
        var first = sidebarEl.querySelector('.sidebar-section');
        if (first) first.classList.add('expanded');
      }

      // Section toggle (top-level)
      sidebarEl.querySelectorAll('.sidebar-section-header').forEach(function(header) {
        header.addEventListener('click', function() {
          this.closest('.sidebar-section').classList.toggle('expanded');
        });
      });

      // Subsection toggle
      sidebarEl.querySelectorAll('.sidebar-subsection-toggle').forEach(function(divider) {
        divider.addEventListener('click', function() {
          var key = this.getAttribute('data-subkey');
          var nowCollapsed = this.getAttribute('data-collapsed') !== 'true';
          this.setAttribute('data-collapsed', nowCollapsed);
          this.querySelector('.subsec-chevron').innerHTML = nowCollapsed ? '&#9654;' : '&#9660;';

          var c = getCollapsed();
          c[key] = nowCollapsed;
          saveCollapsed(c);

          sidebarEl.querySelectorAll('li[data-subkey="' + key + '"]:not(.sidebar-subsection-toggle)').forEach(function(li) {
            li.style.display = nowCollapsed ? 'none' : '';
          });
        });
      });
    })
    .catch(function() {});
})();

// === Scroll-spy for right-side TOC ===
// Uses IntersectionObserver — no scroll handler, no layout reads, no jank.
// The old implementation called `offsetTop` for every h2 on every scroll tick,
// forcing a full layout recalc. On pages with 20+ headings and 30+ code blocks
// that was a visible source of scroll stutter.
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
    // Pick the topmost heading currently inside the "active zone" — if none is
    // in view (long section body), keep the last one we highlighted.
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

  // rootMargin: a thin band near the top of the viewport. A heading is
  // "active" while its text sits in this band. Bottom margin pushes the
  // zone close to the top so scrolling into a new section switches promptly.
  var io = new IntersectionObserver(function (entries) {
    for (var i = 0; i < entries.length; i++) {
      visibleIds[entries[i].target.id] = entries[i].isIntersecting;
    }
    updateActive();
  }, { rootMargin: '-80px 0px -70% 0px', threshold: 0 });

  headings.forEach(function (h) { io.observe(h); });
})();
