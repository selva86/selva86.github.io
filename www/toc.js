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

// === Dynamic sidebar from sidebar.json ===
(function() {
  var currentPage = window.location.pathname.split('/').pop() || 'index.html';
  var sidebarEl = document.getElementById('sidebar-nav');
  if (!sidebarEl) return;

  fetch('www/sidebar.json?t=' + Date.now())
    .then(function(r) { return r.json(); })
    .then(function(sections) {
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

        for (var k = 0; k < section.items.length; k++) {
          var item = section.items[k];
          if (item.divider) {
            html += '<li class="sidebar-divider">' + item.text + '</li>';
            continue;
          }
          var isActive = (item.href === currentPage);
          html += '<li><a href="' + item.href + '"' + (isActive ? ' class="active"' : '') + '>' + item.text + '</a></li>';
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

      // Click handlers for section toggle
      sidebarEl.querySelectorAll('.sidebar-section-header').forEach(function(header) {
        header.addEventListener('click', function() {
          this.closest('.sidebar-section').classList.toggle('expanded');
        });
      });
    })
    .catch(function() {});
})();

// === Scroll-spy for right-side TOC ===
window.addEventListener('scroll', function() {
  var scrollPos = window.pageYOffset + 100;
  document.querySelectorAll('#toc a').forEach(function(a) { a.classList.remove('toc-active'); });
  var headings = document.querySelectorAll('#content h2');
  var current = null;
  headings.forEach(function(h) {
    if (h.getBoundingClientRect().top + window.pageYOffset <= scrollPos) {
      current = h;
    }
  });
  if (current) {
    var activeLink = document.querySelector('#toc a[href="#' + current.id + '"]');
    if (activeLink) activeLink.classList.add('toc-active');
  }
});
