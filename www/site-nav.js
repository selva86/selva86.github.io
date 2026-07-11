/* site-nav.js - companion to www/site-nav.css (the sitewide navbar).
   1. Marks the current section link .on (Roadmap/Tutorials/Exercises/Tools).
   2. Provides a generic mobile nav drawer for pages that have no drawer of
      their own. Only burgers carrying [data-snav-burger] are wired here;
      tutorial pages (#mobile-menu-btn -> #mobile-sidebar overlay) and tool
      pages (.sidebar-toggle inline onclick) keep their existing drawers. */
(function () {
  'use strict';
  if (window.__siteNav) return; window.__siteNav = 1;

  function init() {
    var nav = document.querySelector('.sitenav') || document.querySelector('nav.nav');
    if (!nav) return;

    // Active link: longest matching prefix wins (so /roadmap/data-analyst.html
    // marks Roadmap; /tools/x.html marks Tools; root tutorials stay unmarked).
    var path = location.pathname;
    var links = nav.querySelectorAll('.snav-links a, .links a');
    var best = null, bestLen = -1;
    links.forEach(function (a) {
      var href = a.getAttribute('href') || '';
      if (href === '/') return;
      if (path.indexOf(href) === 0 && href.length > bestLen) { best = a; bestLen = href.length; }
    });
    if (best && !best.classList.contains('on')) best.classList.add('on');

    // Generic drawer, only for [data-snav-burger] buttons.
    var burger = nav.querySelector('[data-snav-burger]');
    if (!burger) return;
    var drawer = null;
    function ensureDrawer() {
      if (drawer) return drawer;
      drawer = document.createElement('div');
      drawer.className = 'snav-drawer';
      drawer.setAttribute('role', 'dialog');
      drawer.setAttribute('aria-label', 'Site navigation');
      drawer.innerHTML =
        '<div class="snav-scrim"></div>' +
        '<div class="snav-panel">' +
        '<button class="snav-close" type="button" aria-label="Close menu">&times;</button>' +
        '<div class="snav-dtitle">Navigate</div>' +
        '<a class="snav-dlink" href="/roadmap/">Roadmap</a>' +
        '<a class="snav-dlink" href="/tutorials/">Tutorials</a>' +
        '<a class="snav-dlink" href="/exercises/">Exercises</a>' +
        '<a class="snav-dlink" href="/tools/">Tools</a>' +
        '<a class="snav-dcta" href="/pricing.html">Get certified</a>' +
        '<a class="snav-dsignin" href="/signin.html">Sign in</a>' +
        '</div>';
      document.body.appendChild(drawer);
      // Signed-in users don't need the Sign in row.
      if (document.body.classList.contains('state-pro')) {
        var si = drawer.querySelector('.snav-dsignin');
        if (si) si.remove();
      }
      drawer.querySelector('.snav-scrim').addEventListener('click', close);
      drawer.querySelector('.snav-close').addEventListener('click', close);
      return drawer;
    }
    function open() { ensureDrawer().classList.add('open'); document.documentElement.classList.add('snav-lock'); burger.setAttribute('aria-expanded', 'true'); }
    function close() { if (drawer) drawer.classList.remove('open'); document.documentElement.classList.remove('snav-lock'); burger.setAttribute('aria-expanded', 'false'); }
    burger.setAttribute('aria-haspopup', 'true');
    burger.setAttribute('aria-expanded', 'false');
    burger.addEventListener('click', function () {
      if (drawer && drawer.classList.contains('open')) close(); else open();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
