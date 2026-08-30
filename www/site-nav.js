/* site-nav.js - companion to www/site-nav.css (the sitewide navbar).
   1. Marks the current section link .on (Courses/Tutorials/Practice/Pricing/Tools).
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
    // Dashboard tab for signed-in users (owner 2026-08-15). Injected at
    // runtime so no page sweep is needed; CSS keys visibility on
    // body.state-pro, which auth-hydrate sets before this script runs
    // (both defer, auth-hydrate loads first) and corrects after /api/me.
    var linksRow = nav.querySelector('.snav-links') || nav.querySelector('.links');
    if (linksRow && !linksRow.querySelector('.snav-dash')) {
      var dashA = document.createElement('a');
      dashA.href = '/dashboard.html';
      dashA.className = 'snav-dash';
      dashA.textContent = 'Dashboard';
      linksRow.insertBefore(dashA, linksRow.firstChild);
    }
    var links = nav.querySelectorAll('.snav-links a, .links a');
    var best = null, bestLen = -1;
    links.forEach(function (a) {
      var href = a.getAttribute('href') || '';
      if (href === '/') return;
      if (path.indexOf(href) === 0 && href.length > bestLen) { best = a; bestLen = href.length; }
    });
    if (best && !best.classList.contains('on')) best.classList.add('on');

    // Mobile search: the magnifier icon toggles a slide-down row.
    var sbtn = nav.querySelector('[data-snav-search]');
    if (sbtn) {
      var spanel = null;
      sbtn.addEventListener('click', function () {
        if (!spanel) {
          spanel = document.createElement('div');
          spanel.className = 'snav-spanel';
          spanel.innerHTML =
            '<form role="search" aria-label="Search r-statistics.co">' +
            '<svg class="snav-sicon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/></svg>' +
            '<input type="search" name="q" placeholder="Search r-statistics.co" aria-label="Search r-statistics.co">' +
            '</form>';
          spanel.querySelector('form').addEventListener('submit', function (e) {
            e.preventDefault();
            var q = (this.q.value || '').trim();
            if (q) window.open('https://www.google.com/search?q=' + encodeURIComponent(q + ' site:r-statistics.co'));
          });
          nav.appendChild(spanel);
        }
        var on = spanel.classList.toggle('open');
        sbtn.setAttribute('aria-expanded', on ? 'true' : 'false');
        if (on) spanel.querySelector('input').focus();
      });
      sbtn.setAttribute('aria-haspopup', 'true');
      sbtn.setAttribute('aria-expanded', 'false');
    }

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
        '<a class="snav-dlink snav-dash" href="/dashboard.html">Dashboard</a>' +
        '<a class="snav-dlink" href="/roadmap/">Courses <span class="ex-caret" aria-hidden="true">&#9662;</span></a>' +
        '<a class="snav-dlink" href="/tutorials/">Tutorials <span class="ex-caret" aria-hidden="true">&#9662;</span></a>' +
        '<a class="snav-dlink" href="/exercises/">Practice <span class="ex-caret" aria-hidden="true">&#9662;</span></a>' +
        '<a class="snav-dlink" href="/pricing.html">Pricing</a>' +
        '<a class="snav-dlink" href="/tools/">Tools</a>' +
        '<a class="snav-dcta" href="/pricing.html">Get Certified</a>' +
        '<a class="snav-dsignin" href="/signin.html">Sign in</a>' +
        '</div>';
      document.body.appendChild(drawer);
      // Signed-in users don't need the Sign in row; signed-out users
      // don't get the Dashboard row (it 401-redirects anyway).
      if (document.body.classList.contains('state-pro')) {
        var si = drawer.querySelector('.snav-dsignin');
        if (si) si.remove();
      } else {
        var dd = drawer.querySelector('.snav-dash');
        if (dd) dd.remove();
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
