// Add id attr to each h2, h4 and h5, show the TOC gets correct links.
$("#content").find("h2").each(function() {
  h = $(this);	
  h.attr("id", h.text());
});

$("#content").find("h4").each(function() {
  h = $(this);	
  h.attr("id", h.text());
});

$("#content").find("h5").each(function() {
  h = $(this);	
  h.attr("id", h.text());
});

toc = $("ul#toc");
$("#content").find("h2").each(function() {
  h = $(this);
  toc.append("<li><a href='#" + h.attr("id") + "'>" + h.text() + "</a></li>");
});


$('#nav').affix({
    offset: $('#nav').position()
});