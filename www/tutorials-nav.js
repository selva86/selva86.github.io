/* tutorials-nav.js - upgrades the masthead "Tutorials" link into a small
   dropdown (All tutorials + the curriculum Books), and unifies the dropdown
   caret across the Roadmap / Tutorials / Exercises triggers: every trigger
   gets the same minimal chevron (.nav-car), replacing the older boxed glyphs.
   Sibling of practice-nav.js / roadmap-nav.js; namespaced .tn-*.
   Progressive enhancement: no JS -> the link still goes to /tutorials/. */
(function () {
  if (window.__tutorialsNav) return; window.__tutorialsNav = 1;

  var BOOKS = [
    { href: "/tutorials/time-series.html", name: "Time Series Forecasting", meta: "74 chapters, 13 parts" }
  ];

  var CAR = '<svg class="nav-car" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>';

  var CSS = [
    '.nav-car{width:11px;height:11px;margin-left:5px;color:#8a8f98;vertical-align:-1px;transition:transform .16s ease}',
    'a[aria-expanded="true"] .nav-car{transform:rotate(180deg)}',
    '.ex-caret,.rn-car{display:none!important}',
    '.tn-wrap{position:relative;display:inline-flex}',
    '.tn-drop{position:absolute;top:calc(100% + 10px);left:50%;transform:translate(-50%,4px);min-width:252px;background:#fff;border:1px solid #e7e4da;border-radius:14px;box-shadow:0 18px 44px rgba(20,22,26,.13);padding:8px;opacity:0;visibility:hidden;transition:.16s ease;z-index:60}',
    '.tn-wrap.open .tn-drop{opacity:1;visibility:visible;transform:translate(-50%,0)}',
    '.tn-drop a{display:block;padding:9px 12px;border-radius:9px;text-decoration:none}',
    '.tn-drop a:hover{background:#f6f4ec}',
    '.tn-all{font-weight:600;font-size:14px;color:#16181d}',
    '.tn-all .a{color:#1f7a55}',
    '.tn-lab{font-size:11.5px;font-weight:600;color:#8a8f98;padding:10px 12px 4px;border-top:1px solid #f0ede3;margin-top:6px}',
    '.tn-book-t{display:block;font-weight:600;font-size:14px;color:#16181d}',
    '.tn-book-m{display:block;font-size:12px;color:#8a8f98;margin-top:1px}',
    '@media (max-width: 860px){.tn-drop{display:none}}'
  ].join('\n');

  function findLink(href) {
    return document.querySelector('.sitenav .snav-links a[href="' + href + '"]')
        || document.querySelector('.nav .links a[href="' + href + '"]');
  }

  function unifyCaret(link) {
    if (!link || link.querySelector('.nav-car')) return;
    link.insertAdjacentHTML('beforeend', CAR);
  }

  function init() {
    var tut = findLink('/tutorials/');
    if (!tut) return;

    var style = document.createElement('style');
    style.setAttribute('data-tn-css', '');
    style.textContent = CSS;
    document.head.appendChild(style);

    // One caret design for all three dropdown triggers.
    unifyCaret(findLink('/roadmap/'));
    unifyCaret(findLink('/exercises/'));
    unifyCaret(tut);

    if (tut.closest('.tn-wrap')) return;
    var wrap = document.createElement('span');
    wrap.className = 'tn-wrap';
    tut.parentNode.insertBefore(wrap, tut);
    wrap.appendChild(tut);
    tut.setAttribute('aria-haspopup', 'true');
    tut.setAttribute('aria-expanded', 'false');

    var books = BOOKS.map(function (b) {
      return '<a href="' + b.href + '"><span class="tn-book-t">' + b.name + '</span><span class="tn-book-m">' + b.meta + '</span></a>';
    }).join('');
    var drop = document.createElement('div');
    drop.className = 'tn-drop';
    drop.setAttribute('role', 'menu');
    drop.innerHTML = '<a class="tn-all" href="/tutorials/" role="menuitem">All tutorials <span class="a">&rarr;</span></a>' +
      '<div class="tn-lab">Books</div>' + books;
    wrap.appendChild(drop);

    var closeT = null;
    function setOpen(on) {
      wrap.classList.toggle('open', on);
      tut.setAttribute('aria-expanded', on ? 'true' : 'false');
    }
    wrap.addEventListener('mouseenter', function () { clearTimeout(closeT); setOpen(true); });
    wrap.addEventListener('mouseleave', function () { closeT = setTimeout(function () { setOpen(false); }, 160); });
    tut.addEventListener('click', function (e) {
      // First tap/click on touch or keyboard opens; second follows the link.
      if (window.matchMedia('(hover: none)').matches && !wrap.classList.contains('open')) {
        e.preventDefault(); setOpen(true);
      }
    });
    document.addEventListener('click', function (e) {
      if (!wrap.contains(e.target)) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
