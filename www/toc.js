// === Generate heading IDs and TOC links ===
function slugify(text) {
  return text.replace(/\s+/g, '-').replace(/[^\w-]/g, '');
}

$("#content").find("h2").each(function() {
  var h = $(this);
  h.attr("id", slugify(h.text()));
});

$("#content").find("h4").each(function() {
  var h = $(this);
  h.attr("id", slugify(h.text()));
});

$("#content").find("h5").each(function() {
  var h = $(this);
  h.attr("id", slugify(h.text()));
});

var toc = $("ul#toc");
$("#content").find("h2").each(function() {
  var h = $(this);
  toc.append("<li><a href='#" + h.attr("id") + "'>" + h.text() + "</a></li>");
});

// === Dynamic sidebar from sidebar.json ===
$(function() {
  var currentPage = window.location.pathname.split('/').pop() || 'index.html';
  var sidebarEl = $('#sidebar-nav');

  // Only load if sidebar-nav container exists
  if (sidebarEl.length === 0) return;

  $.getJSON('www/sidebar.json?t=' + Date.now(), function(sections) {
    var html = '<ul class="sidebar-menu list-unstyled">';

    for (var i = 0; i < sections.length; i++) {
      var section = sections[i];

      // Skip sections with no items
      if (!section.items || section.items.length === 0) continue;

      var hasActive = false;

      // Check if current page is in this section
      for (var j = 0; j < section.items.length; j++) {
        if (section.items[j].href === currentPage) {
          hasActive = true;
          break;
        }
      }

      html += '<li class="sidebar-section' + (hasActive ? ' expanded' : '') + '">';
      html += '<div class="sidebar-section-header">';
      html += '<span class="sidebar-chevron">&#9656;</span> ' + section.title;
      html += '</div>';
      html += '<ul class="sidebar-section-items list-unstyled">';

      for (var k = 0; k < section.items.length; k++) {
        var item = section.items[k];
        var isActive = (item.href === currentPage);
        html += '<li><a href="' + item.href + '"' + (isActive ? ' class="active"' : '') + '>' + item.text + '</a></li>';
      }

      html += '</ul></li>';
    }

    html += '</ul>';

    // Add subscribe/chat
    html += '<div class="sidebar-subscribe">';
    html += '<p>Stay up-to-date. <a href="https://docs.google.com/forms/d/1xkMYkLNFU9U39Dd8S_2JC0p8B5t6_Yq6zUQjanQQJpY/viewform">Subscribe!</a></p>';
    html += '<p><a href="https://docs.google.com/forms/d/13GrkCFcNa-TOIllQghsz2SIEbc-YqY9eJX02B19l5Ow/viewform">Chat!</a></p>';
    html += '</div>';

    // Replace sidebar content
    sidebarEl.html(html);

    // If no section is expanded, expand the first one
    if ($('.sidebar-section.expanded').length === 0) {
      $('.sidebar-section').first().addClass('expanded');
    }

    // Attach click handlers
    $('.sidebar-section-header').on('click', function() {
      $(this).closest('.sidebar-section').toggleClass('expanded');
    });
  });
});

// === Scroll-spy for right-side TOC ===
$(window).on('scroll', function() {
  var scrollPos = $(window).scrollTop() + 100;
  $('#toc a').removeClass('toc-active');
  var headings = $('#content h2');
  var current = null;
  headings.each(function() {
    if ($(this).offset().top <= scrollPos) {
      current = $(this);
    }
  });
  if (current) {
    $('#toc a[href="#' + current.attr('id') + '"]').addClass('toc-active');
  }
});
