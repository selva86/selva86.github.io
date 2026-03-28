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

// === Sidebar collapsible sections ===
$(function() {
  var currentPage = window.location.pathname.split('/').pop() || 'index.html';

  $('.sidebar-section-header').on('click', function() {
    $(this).closest('.sidebar-section').toggleClass('expanded');
  });

  // Expand section containing the active page link
  $('.sidebar-section-items a').each(function() {
    var href = $(this).attr('href');
    if (href === currentPage) {
      $(this).addClass('active');
      $(this).closest('.sidebar-section').addClass('expanded');
    }
  });

  // If no section matched (e.g. homepage), expand the first section
  if ($('.sidebar-section.expanded').length === 0) {
    $('.sidebar-section').first().addClass('expanded');
  }
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
