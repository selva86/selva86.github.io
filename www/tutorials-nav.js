/* tutorials-nav.js - upgrades the masthead "Tutorials" link into a small
   dropdown (All tutorials + the curriculum Books), and unifies the dropdown
   caret across the Roadmap / Tutorials / Exercises triggers: every trigger
   gets the same minimal chevron (.nav-car), replacing the older boxed glyphs.
   Sibling of practice-nav.js / roadmap-nav.js; namespaced .tn-*.
   Progressive enhancement: no JS -> the link still goes to /tutorials/. */
(function () {
  if (window.__tutorialsNav) return; window.__tutorialsNav = 1;

  // Books come from the same registry the scoped sidebar uses, so new books
  // and renames appear here without touching this module. Falls back to a
  // static list if the fetch fails.
  var FALLBACK_BOOKS = [
    { href: "/tutorials/statistics.html", name: "The Statistics Handbook", meta: "A complete grounding in statistics for data analysis, taught in runnable R." },
    { href: "/tutorials/time-series.html", name: "The Time Series Forecasting Handbook", meta: "How to build and evaluate forecasts in R." },
    { href: "/tutorials/ggplot2.html", name: "The ggplot2 Handbook", meta: "Make publication-quality figures with ggplot2." }
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
    '.tn-sheet{position:fixed;inset:0;z-index:10010;background:#fff;display:flex;flex-direction:column;transform:translateY(100%);transition:transform .26s cubic-bezier(.22,.61,.36,1);visibility:hidden;font-family:\'IBM Plex Sans\',\'Inter\',-apple-system,\'Segoe UI\',Roboto,Arial,sans-serif;color:#111827}',
    '.tn-sheet.tn-sheet-open{transform:none;visibility:visible}',
    '.tn-sheet *{box-sizing:border-box}',
    '.tn-sheet a{text-decoration:none;color:inherit}',
    '.tn-sheet-hd{display:flex;align-items:center;justify-content:space-between;padding:15px 18px;border-bottom:1px solid #e5e7eb;flex:none}',
    '.tn-sheet-t{font-family:\'Inter Tight\',\'Inter\',sans-serif;font-size:19px;font-weight:700}',
    '.tn-sheet-x{border:0;background:#f1f3f7;width:34px;height:34px;border-radius:50%;font-size:22px;line-height:1;color:#5b6573;cursor:pointer}',
    '.tn-sheet-body{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:10px 18px 14px}',
    '.tn-sheet-lab{font-size:12px;font-weight:600;color:#8a8f98;padding:10px 0 6px}',
    '.tn-sbook{display:block;border:1px solid #e5e7eb;border-radius:12px;padding:13px 15px;margin:0 0 10px}',
    '.tn-sbook b{display:block;font-size:15px}',
    '.tn-sbook span{display:block;font-size:12.5px;color:#6b7280;margin-top:2px}',
    '.tn-sheet-foot{flex:none;display:flex;align-items:center;justify-content:center;gap:6px;padding:15px;border-top:1px solid #e5e7eb;color:#2056d2;font-weight:600;font-size:14px}',
    'html.dark .tn-sheet{background:#0b1120;color:#eef2fa}',
    'html.dark .tn-sheet-hd,html.dark .tn-sheet-foot{border-color:#1f2a48}',
    'html.dark .tn-sheet-x{background:#192240;color:#9aa6c0}',
    'html.dark .tn-sbook{border-color:#1f2a48}',
    'html.dark .tn-sbook span{color:#aeb9d4}',
    '@media (max-width: 860px){.tn-drop{display:none}}'
  ].join('\n');

  function findLink(href) {
    return document.querySelector('.sitenav .snav-links a[href="' + href + '"]')
        || document.querySelector('.nav .links a[href="' + href + '"]');
  }

  function unifyCaret(link) {
    // Skip links that already carry any caret svg: on the legacy .nav
    // variant the Practice trigger arrives with its own .xn-car, and
    // appending .nav-car beside it rendered a double chevron.
    if (!link || link.querySelector('svg')) return;
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

    function bookRows(list) {
      return list.map(function (b) {
        return '<a href="' + b.href + '"><span class="tn-book-t">' + b.name + '</span><span class="tn-book-m">' + b.meta + '</span></a>';
      }).join('');
    }
    var drop = document.createElement('div');
    drop.className = 'tn-drop';
    drop.setAttribute('role', 'menu');
    drop.innerHTML = '<a class="tn-all" href="/tutorials/" role="menuitem">All tutorials <span class="a">&rarr;</span></a>' +
      '<div class="tn-lab">Books</div>' + bookRows(FALLBACK_BOOKS);
    window.__tnBooks = FALLBACK_BOOKS;
    wrap.appendChild(drop);

    fetch('/www/curricula.json?v=7').then(function (r) { return r.ok ? r.json() : null; }).then(function (data) {
      if (!data || !data.books || !data.books.length) return;
      var rows = data.books.filter(function (b) { return b.nav !== false; }).map(function (b) {
        return { href: b.index, name: b.title, meta: b.tagline || '' };
      });
      var lab = drop.querySelector('.tn-lab');
      while (lab.nextSibling) drop.removeChild(lab.nextSibling);
      lab.insertAdjacentHTML('afterend', bookRows(rows));
      window.__tnBooks = rows;
    }).catch(function () {});

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

  /* ---- mobile: Books bottom sheet (parity with rn-sheet / xn-sheet) ---- */
  (function(){
    var sheet = null;
    function rowsHTML(){
      var list = window.__tnBooks || [];
      return list.map(function(b){
        return '<a class="tn-sbook" href="' + b.href + '"><b>' + b.name + '</b><span>' + (b.meta || '') + '</span></a>';
      }).join('');
    }
    function ensureSheet(){
      if (sheet) return;
      sheet = document.createElement('div');
      sheet.className = 'tn-sheet'; sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-label', 'Tutorials');
      sheet.innerHTML = '<div class="tn-sheet-hd"><span class="tn-sheet-t">Tutorials</span><button class="tn-sheet-x" aria-label="Close">&times;</button></div>' +
        '<div class="tn-sheet-body"><div class="tn-sheet-lab">Books</div>' + rowsHTML() + '</div>' +
        '<a class="tn-sheet-foot" href="/tutorials/">Browse all tutorials &rarr;</a>';
      document.body.appendChild(sheet);
      sheet.querySelector('.tn-sheet-x').addEventListener('click', closeSheet);
    }
    function openSheet(){ ensureSheet(); document.documentElement.classList.add('tn-lock'); sheet.classList.add('tn-sheet-open'); }
    function closeSheet(){ if (sheet) sheet.classList.remove('tn-sheet-open'); document.documentElement.classList.remove('tn-lock'); }
    Array.prototype.forEach.call(document.querySelectorAll('.mnav-link[href="/tutorials/"]'), function(a){
      if (!a.querySelector('.ex-caret')) a.insertAdjacentHTML('beforeend', ' <span class="ex-caret" aria-hidden="true">&#9662;</span>');
    });
    document.addEventListener('click', function(e){
      var a = e.target && e.target.closest && e.target.closest('.mnav-link[href="/tutorials/"],.snav-dlink[href="/tutorials/"]');
      if (!a || window.innerWidth > 980) return;
      e.preventDefault(); openSheet();
    });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeSheet(); });
  })();
})();
