/* sections-v3.js — shared behavior for the v3 standalone section pages.
   (1) reveal-on-scroll for .reveal elements
   (2) dark-mode toggle synced to html.dark + localStorage['theme'] (site-wide convention)
   The avatar dropdown + auth state are handled by www/auth-hydrate.js. */
(function () {
  'use strict';

  // ---- dark mode (html.dark + localStorage['theme']); the early inline head
  // script already applied the saved theme to avoid a flash. Keep the toggle
  // button glyph in sync, and expose a global toggleDark() for the masthead. ----
  var SUN = '☀';   // ☀
  var MOON = '☽';  // ☽
  function syncDarkBtn() {
    var b = document.getElementById('darkBtn');
    if (b) b.innerHTML = document.documentElement.classList.contains('dark') ? SUN : MOON;
  }
  window.toggleDark = function () {
    var on = document.documentElement.classList.toggle('dark');
    try { localStorage.setItem('theme', on ? 'dark' : 'light'); } catch (e) {}
    syncDarkBtn();
  };

  // ---- reveal-on-scroll ----
  function revealAll() {
    var els = document.querySelectorAll('.reveal');
    for (var i = 0; i < els.length; i++) els[i].classList.add('in');
  }
  function initReveal() {
    if (!('IntersectionObserver' in window)) { revealAll(); return; }
    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) { entries[i].target.classList.add('in'); io.unobserve(entries[i].target); }
      }
    }, { threshold: 0, rootMargin: '0px 0px 20% 0px' });
    var els = document.querySelectorAll('.reveal');
    for (var j = 0; j < els.length; j++) io.observe(els[j]);
    // safety fallback so nothing stays hidden if the observer never fires
    setTimeout(revealAll, 1600);
  }

  function start() { syncDarkBtn(); initReveal(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
