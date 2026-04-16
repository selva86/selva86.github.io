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

// === Scroll-spy for right-side TOC (throttled to once per frame) ===
(function() {
  var ticking = false;
  var tocLinks = null;
  var headings = null;
  var lastActiveId = null;

  function updateScrollSpy() {
    if (!tocLinks) tocLinks = document.querySelectorAll('#toc a');
    if (!headings) headings = document.querySelectorAll('#content h2');
    if (tocLinks.length === 0 || headings.length === 0) { ticking = false; return; }

    var scrollPos = window.pageYOffset + 100;
    var currentId = null;
    for (var i = 0; i < headings.length; i++) {
      if (headings[i].offsetTop <= scrollPos) {
        currentId = headings[i].id;
      }
    }
    if (currentId !== lastActiveId) {
      tocLinks.forEach(function(a) { a.classList.remove('toc-active'); });
      if (currentId) {
        var activeLink = document.querySelector('#toc a[href="#' + currentId + '"]');
        if (activeLink) activeLink.classList.add('toc-active');
      }
      lastActiveId = currentId;
    }
    ticking = false;
  }

  window.addEventListener('scroll', function() {
    if (!ticking) {
      requestAnimationFrame(updateScrollSpy);
      ticking = true;
    }
  });
})();
