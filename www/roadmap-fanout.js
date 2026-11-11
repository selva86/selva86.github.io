/* Track page v2 behaviour: the gated player, localized plan prices, and the
   one-time offer.

   Three deliberate choices, each because the alternative is worse:

   1. The player is a poster until someone asks to run it. Mounting the real
      lesson on page load would pull the R runtime into a landing page for
      every visitor, nearly all of whom are reading. The poster carries the
      real first step's words, so it is a preview rather than a picture.

   2. Prices are localized by Paddle at runtime, and the page stays on the
      baked USD if Paddle is not configured. Same dormancy rule as
      pricing.html: no client token means no localized figures, never a
      half-localized page.

   3. The offer mints a code server side when the dialog is shown, and never
      displays one on page load. That rule is already set in /api/offer: a
      code handed to a page load is a code that leaks. Checkout is reached by
      deep-linking /pricing.html?code=..., so there is one checkout path on
      the site and not a second copy of the Paddle controller here. */
(function () {
  'use strict';

  var body = document.body;
  var me = null;          // filled by auth-hydrated
  var hydrated = false;

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  /* ------------------------------------------------------------- rail --- */

  /* The rail is the navigation: a click loads that lesson into the player and
     stays on this page. A locked lesson loads exactly as a free one does,
     because the lesson's own gate IS the lock and it shows a real preview
     first. All this page adds is the one thing the gate does not say, the
     price, which is why the plan box appears only then. */
  function initRail() {
    var wrap = $('[data-rmx-player]');
    var pro = $('.rmx-pro');
    var links = $$('[data-rmx-lesson]');
    if (!wrap || !links.length) return;

    function select(a, load, fromClick) {
      var slug = a.getAttribute('data-rmx-lesson');
      if (!slug) return;
      for (var i = 0; i < links.length; i++) links[i].removeAttribute('aria-current');
      a.setAttribute('aria-current', 'true');
      if (load) {
        var lt = a.querySelector('.rmx-lt');
        setLesson(slug, lt ? lt.textContent.trim() : slug, a.getAttribute('data-pro') === '1');
      }
      if (pro) {
        if (a.getAttribute('data-pro') === '1') pro.removeAttribute('hidden');
        else pro.setAttribute('hidden', '');
      }
      try { history.replaceState(null, '', '#' + slug); } catch (e) {}
      // only pull the page up when the player is not already in view
      if (fromClick && wrap.getBoundingClientRect().top < 0) {
        wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    links.forEach(function (a) {
      a.addEventListener('click', function (e) {
        // modified clicks are left alone so "open in a new tab" still works
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;
        e.preventDefault();
        select(a, true, true);
      });
    });

    function bySlug(slug) {
      for (var i = 0; i < links.length; i++) {
        if (links[i].getAttribute('data-rmx-lesson') === slug) return links[i];
      }
      return null;
    }

    var hash = (location.hash || '').replace(/^#/, '');
    var deep = hash ? bySlug(hash) : null;
    if (deep) { select(deep, true, false); return; }

    // nothing asked for: mark the lesson the frame already holds
    var href = wrap.getAttribute('data-lesson-href') || '';
    var first = bySlug(href.replace(/^\//, '').replace(/\.html$/, ''));
    if (first) first.setAttribute('aria-current', 'true');
  }

  /* ------------------------------------------------------------ player --- */

  /* The player has three states and the script decides which from who is
     asking, not from what was clicked:

       signin  a free lesson, nobody signed in. The lesson is loaded and
               readable, with a light scrim and a play button over it: what
               the overlay withholds is the use of it, not the sight of it.
       locked  a Pro lesson and no Pro plan. A lock, no play button, and the
               lesson is never requested, so there is nothing to read in the
               markup or lift out with devtools.
       open    mounted and running.

     The cover's blurred bars are an empty skeleton rather than the real text
     dimmed, which is the difference between hiding a lesson and pretending
     to. */
  var P = { wrap: null, slug: '', title: '', pro: false };

  function userPro() { return !!(me && me.pro); }
  function anon() { return body.classList.contains('state-anon') || (hydrated && !(me && me.user)); }

  function mountFrame() {
    if (!P.wrap) return;
    var src = '/' + P.slug + '.html';
    var f = $('iframe.rmx-frame', P.wrap);
    if (f) {
      if (f.getAttribute('src') !== src) f.setAttribute('src', src);
      return;
    }
    f = document.createElement('iframe');
    f.className = 'rmx-frame';
    f.setAttribute('title', P.title + ', interactive lesson');
    f.addEventListener('load', function () { dressFrame(f); });
    f.setAttribute('src', src);
    P.wrap.appendChild(f);
  }

  function dropFrame() {
    if (!P.wrap) return;
    var f = $('iframe.rmx-frame', P.wrap);
    if (f && f.parentNode) f.parentNode.removeChild(f);
  }

  function renderPlayer() {
    if (!P.wrap) return;
    var state = (P.pro && !userPro()) ? 'locked' : (anon() ? 'signin' : 'open');
    P.wrap.setAttribute('data-state', state);

    var t = $('[data-rmx-covertitle]', P.wrap);
    var n = $('[data-rmx-covernote]', P.wrap);
    var play = $('[data-rmx-play]', P.wrap);
    if (t) t.textContent = P.title;
    if (n) {
      n.textContent = state === 'locked'
        ? 'This lesson comes with Pro. The first lesson of every section is free to run.'
        : 'Sign in to run this lesson in the page.';
    }
    if (play) play.setAttribute('href', '/' + P.slug + '.html');

    /* The lesson is loaded in every state. Signed out on a free one it is
       meant to be seen and the overlay only stops it being used. A Pro one is
       loaded too, because its own page is public and serves two free steps
       and then the gate: blurring that behind the lock shows there is
       something here without showing anything that was not already open. */
    mountFrame();
  }

  function setLesson(slug, title, pro) {
    P.slug = slug;
    P.title = title || slug;
    P.pro = !!pro;
    renderPlayer();
  }

  function initPlayer() {
    P.wrap = $('[data-rmx-player]');
    if (!P.wrap) return;
    var href = P.wrap.getAttribute('data-lesson-href') || '';
    P.slug = href.replace(/^\//, '').replace(/\.html$/, '');
    P.title = P.wrap.getAttribute('data-lesson-title') || P.slug;
    P.pro = false;   // the opening lesson is always a free one

    var play = $('[data-rmx-play]', P.wrap);
    if (play) {
      play.addEventListener('click', function (e) {
        // a modified click keeps working as the plain link it is
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;
        e.preventDefault();
        if (anon() && window.rsSignin && typeof window.rsSignin.open === 'function') {
          /* Back to this page with the lesson in the hash, so they return to
             the lesson they asked for rather than the top of the track. */
          window.rsSignin.open({
            next: location.pathname + '#' + P.slug,
            trigger: 'track-player'
          });
          return;
        }
        P.wrap.setAttribute('data-state', 'open');
        mountFrame();
      });
    }
    renderPlayer();
  }

  /* Two things have to go inside the frame or the embed gives itself away: the
     site navbar, which would be the second one on the page, and the lesson's
     own course rail, which repeats what this page lists on both sides of the
     player and costs 264px of reading width. Hiding them from the parent keeps
     the change here rather than in 1,300 lesson pages and their shared CSS.
     .lm-app is position:fixed and offset below the navbar, so it is lifted. */
  var EMBED_CSS =
    'body > .container, footer.rsft, .fbanner, #mobile-sidebar { display: none !important; }' +
    /* the sitewide announcement bar, which the host page already suppresses */
    '.rs-announce { display: none !important; }' +
    '.lm-app { top: 0 !important; }' +
    '.lm-body > .lm-rail { display: none !important; }' +
    /* The lesson's own way out. Its back arrow goes to the v1 track page, so
       following it from in here drops a reader out of this page and into a
       different one, which is how somebody gets lost. The rail toggle beside
       it opens the course rail this embed hides, so it would do nothing. */
    '.lm-top .lm-exit, .lm-top .lm-rail-toggle { display: none !important; }' +
    /* The breadcrumb stays as context, since the player no longer has a bar
       of its own naming the lesson, but it stops being navigation: every one
       of its links led back out to the v1 pages. */
    '.lm-crumbs a { pointer-events: none; color: inherit; text-decoration: none; }';

  function dressFrame(f) {
    /* Every reach into the frame is wrapped. A page that cannot tidy the frame
       should still show a working lesson, never a broken one. */
    try {
      var d = f.contentDocument;
      if (!d || !d.head || d.getElementById('rmx-embed')) return;
      var s = d.createElement('style');
      s.id = 'rmx-embed';
      s.textContent = EMBED_CSS;
      d.head.appendChild(s);
      routeFrameLinks(d);
    } catch (e) {}
  }

  /* A link inside the frame must never strand a reader in it. The lesson's own
     gate offers previous and next lessons and a way back to the course, and
     followed inside the frame those would render a page with its navigation
     hidden and no way out. Another lesson loads into the player and moves the
     rail with it; anything else leaves the frame for the real window. */
  function routeFrameLinks(d) {
    d.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;
      var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!a) return;
      var href = a.getAttribute('href') || '';
      if (!href || href.charAt(0) === '#' || /^(mailto:|tel:|javascript:)/i.test(href)) return;
      var url;
      try { url = new URL(href, d.baseURI); } catch (err) { return; }
      if (url.origin !== location.origin) return;
      var slug = url.pathname.replace(/^\//, '').replace(/\.html$/, '');
      var row = null;
      try { row = document.querySelector('[data-rmx-lesson="' + slug.replace(/["\\]/g, '') + '"]'); } catch (err) {}
      e.preventDefault();
      if (row) row.click(); else window.location.href = url.href;
    }, true);
  }

  /* ------------------------------------------------------------ prices --- */

  function money(amount, currency) {
    var n = parseInt(amount, 10);
    if (!isFinite(n)) return '';
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency', currency: currency || 'USD',
        minimumFractionDigits: 0, maximumFractionDigits: 0
      }).format(n / 100);
    } catch (e) { return (n / 100).toFixed(0) + ' ' + (currency || ''); }
  }

  function localizePrices() {
    var slots = Array.prototype.slice.call(document.querySelectorAll('[data-rmx-price]'));
    if (!slots.length) return;
    fetch('/api/_auth-config', { cache: 'no-cache' })
      .then(function (r) { return r.json(); })
      .then(function (cfg) {
        var p = cfg && cfg.paddle;
        if (!p || !p.clientToken) return;          // dormant: keep the baked USD
        var aa = (p.prices && p.prices.allaccess) || {};
        var ids = { year: aa.year, month: aa.month, lifetime: p.prices && p.prices.lifetime };
        var items = [];
        /* The monthly price is previewed although nothing shows it: the saving
           and the per-month equivalent are worked out from the real localized
           figures, because a saving calculated in dollars is wrong in rupees
           and the page would be quoting one while charging the other. */
        ['year', 'month', 'lifetime'].forEach(function (k) {
          if (ids[k] && items.indexOf(ids[k]) < 0) items.push(ids[k]);
        });
        if (!items.length) return;
        loadPaddle(p, function () {
          window.Paddle.PricePreview({ items: items.map(function (id) { return { priceId: id, quantity: 1 }; }) })
            .then(function (r) {
              var lines = (r && r.data && r.data.details && r.data.details.lineItems) || [];
              var byId = {}, raw = {};
              var ccy = (r && r.data && r.data.currencyCode) || 'USD';
              lines.forEach(function (li) {
                var pid = li.price && li.price.id;
                if (!pid) return;
                byId[pid] = (li.formattedTotals && li.formattedTotals.total) || '';
                raw[pid] = parseInt((li.totals && li.totals.total) || '0', 10);
              });
              slots.forEach(function (el) {
                var txt = byId[ids[el.getAttribute('data-rmx-price')]];
                if (txt) el.textContent = txt;
              });
              restate(raw[ids.year], raw[ids.month], ccy);
            }).catch(function () {});
        });
      }).catch(function () {});
  }

  /* The per-month equivalent and the saving, from the figures Paddle actually
     quoted this visitor. If either price is missing the saving is removed
     rather than guessed: a wrong discount claim is worse than none. */
  function restate(year, month, ccy) {
    var pm = $('[data-rmx-permonth]'), save = $('[data-rmx-save]');
    if (!year || !month) { if (save) save.style.display = 'none'; return; }
    if (pm) {
      try {
        pm.textContent = 'about ' + new Intl.NumberFormat(undefined, {
          style: 'currency', currency: ccy, maximumFractionDigits: 0
        }).format(year / 12 / 100) + ' a month';
      } catch (e) {}
    }
    if (save) {
      var pct = Math.round((1 - (year / 12) / month) * 100);
      if (pct > 0) save.textContent = 'save ' + pct + '%';
      else save.style.display = 'none';
    }
  }

  /* The two plan rows are a choice, not two cards to compare, so picking one
     moves where the button goes. */
  function initPlans() {
    var opts = $$('[data-rmx-opt]');
    var buy = $('[data-rmx-buy]');
    if (!opts.length) return;
    opts.forEach(function (b) {
      b.addEventListener('click', function () {
        opts.forEach(function (x) {
          x.classList.remove('on');
          x.setAttribute('aria-pressed', 'false');
        });
        b.classList.add('on');
        b.setAttribute('aria-pressed', 'true');
        if (buy) {
          buy.href = b.getAttribute('data-rmx-opt') === 'lifetime'
            ? '/pricing.html#lifetime' : '/pricing.html#plans';
        }
      });
    });
  }

  function loadPaddle(cfg, done) {
    if (window.Paddle) { try { done(); } catch (e) {} return; }
    var s = document.createElement('script');
    s.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
    s.onload = function () {
      try {
        window.Paddle.Environment.set(cfg.environment === 'production' ? 'production' : 'sandbox');
        window.Paddle.Initialize({ token: cfg.clientToken });
        done();
      } catch (e) {}
    };
    document.head.appendChild(s);
  }

  /* ------------------------------------------------------------- offer --- */

  var offerShown = false;

  /* Minutes and seconds, in two boxes. Hours are folded into the minutes
     rather than shown, because a clock that reads 01:00:00 is a deadline and
     one that reads 59:12 is a decision. */
  function countdown(mm, ss, until, onEnd) {
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    function tick() {
      var left = until - Math.floor(Date.now() / 1000);
      if (left <= 0) {
        mm.textContent = '00'; ss.textContent = '00';
        if (onEnd) onEnd();
        return;
      }
      mm.textContent = pad(Math.floor(left / 60));
      ss.textContent = pad(left % 60);
      setTimeout(tick, 1000);
    }
    tick();
  }

  function showOffer(o) {
    var dlg = $('#rmxOffer');
    if (!dlg || offerShown) return;
    offerShown = true;
    var pct = $('[data-rmx-pct]', dlg);
    if (pct) pct.textContent = o.percent + '%';
    var code = $('[data-rmx-code]', dlg);
    if (code) code.textContent = o.code;
    /* What the coupon covers comes from the server, which derives it from the
       same price list it restricted the Paddle discount to. If Lifetime is not
       configured there, the dialog stops claiming it. */
    var applies = $('[data-rmx-applies]', dlg);
    if (applies && o.applies) applies.textContent = o.applies;
    var cta = $('[data-rmx-take]', dlg);
    if (cta) {
      cta.href = '/pricing.html?code=' + encodeURIComponent(o.code) + '&src=track';
      cta.textContent = 'Use ' + o.percent + '% coupon →';
    }
    var mm = $('[data-rmx-mm]', dlg), ss = $('[data-rmx-ss]', dlg);
    if (mm && ss && o.expires_at) {
      countdown(mm, ss, o.expires_at, function () {
        /* Expired while open. Saying so beats leaving a dead button that
           fails at checkout. */
        if (cta) { cta.removeAttribute('href'); cta.textContent = 'This offer has expired'; }
      });
    }

    /* Copy puts the code on the clipboard and says so in place, because a
       button that reports nothing leaves people clicking it twice. */
    var cp = $('[data-rmx-copy]', dlg);
    if (cp) {
      cp.addEventListener('click', function () {
        var label = $('.cplab', cp) || cp;
        function said(t) { label.textContent = t; setTimeout(function () { label.textContent = 'Copy'; }, 1600); }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(o.code).then(function () { said('Copied'); }).catch(function () { said('Press Ctrl C'); });
        } else { said('Press Ctrl C'); }
      });
    }

    dlg.classList.add('on');
    dlg.setAttribute('aria-hidden', 'false');
    var close = $('.ox', dlg);
    if (close) close.focus();
  }

  function closeOffer() {
    var dlg = $('#rmxOffer');
    if (!dlg) return;
    dlg.classList.remove('on');
    dlg.setAttribute('aria-hidden', 'true');
  }

  function armOffer() {
    var target = $('[data-rmx-offertrigger]');
    var dlg = $('#rmxOffer');
    if (!target || !dlg || !('IntersectionObserver' in window)) return;

    /* Signed-in and not paying is decided by the server, not here: the browser's
       idea of a plan lags a lapsed one, and offering a discount on a plan
       somebody already holds is the one outcome worth engineering against. */
    var io = new IntersectionObserver(function (entries, obs) {
      if (!entries.some(function (e) { return e.isIntersecting; })) return;
      obs.disconnect();
      fetch('/api/offer/once', { method: 'POST', headers: { 'Accept': 'application/json' } })
        .then(function (r) { return r.json(); })
        .then(function (o) { if (o && o.code && o.percent) showOffer(o); })
        .catch(function () {});
    }, { rootMargin: '0px 0px -25% 0px' });
    io.observe(target);

    dlg.addEventListener('click', function (e) {
      if (e.target === dlg || (e.target.classList && e.target.classList.contains('ox'))) closeOffer();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeOffer();
    });
  }

  /* -------------------------------------------------------------- init --- */

  /* Who is asking only becomes known here, so the cover is re-decided: a
     signed-in reader gets the lesson mounted without touching anything, and a
     Pro subscriber gets the starred ones too. */
  document.addEventListener('auth-hydrated', function (e) {
    hydrated = true;
    me = (e.detail && e.detail.me) || null;
    try { renderPlayer(); } catch (err) {}
  });

  function init() {
    initPlayer();
    initRail();
    initPlans();
    localizePrices();
    armOffer();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
