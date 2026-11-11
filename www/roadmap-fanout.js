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

  /* ------------------------------------------------------------ player --- */

  function mountPlayer(wrap, href) {
    var f = document.createElement('iframe');
    f.className = 'rmx-frame';
    f.src = href + (href.indexOf('?') < 0 ? '?' : '&') + 'embed=1';
    f.title = 'Lesson player';
    f.setAttribute('allow', 'clipboard-write');
    var poster = $('.rmx-poster', wrap);
    if (poster) poster.replaceWith(f); else wrap.appendChild(f);
  }

  function initPlayer() {
    var wrap = $('[data-rmx-player]');
    if (!wrap) return;
    var poster = $('.rmx-poster', wrap);
    var href = wrap.getAttribute('data-lesson-href') || '';
    if (!poster || !href) return;

    poster.addEventListener('click', function (e) {
      e.preventDefault();
      /* Signed out: ask for an account before the lesson runs. The lesson page
         itself is open to anonymous readers, so this is a prompt and not a
         wall: the sign-in modal returns them to the lesson either way. */
      var anon = body.classList.contains('state-anon') || (hydrated && !(me && me.user));
      if (anon && window.rsSignin && typeof window.rsSignin.open === 'function') {
        window.rsSignin.open({ next: href, trigger: 'track-player' });
        return;
      }
      mountPlayer(wrap, href);
    });
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
        var ids = {
          year: p.prices && p.prices.allaccess && p.prices.allaccess.year,
          lifetime: p.prices && p.prices.lifetime
        };
        var items = [];
        slots.forEach(function (el) {
          var id = ids[el.getAttribute('data-rmx-price')];
          if (id && items.indexOf(id) < 0) items.push(id);
        });
        if (!items.length) return;
        loadPaddle(p, function () {
          window.Paddle.PricePreview({ items: items.map(function (id) { return { priceId: id, quantity: 1 }; }) })
            .then(function (r) {
              var lines = (r && r.data && r.data.details && r.data.details.lineItems) || [];
              var byId = {};
              lines.forEach(function (li) {
                var pid = li.price && li.price.id;
                if (pid) byId[pid] = (li.formattedTotals && li.formattedTotals.total) || '';
              });
              slots.forEach(function (el) {
                var txt = byId[ids[el.getAttribute('data-rmx-price')]];
                if (txt) el.textContent = txt;
              });
            }).catch(function () {});
        });
      }).catch(function () {});
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

  document.addEventListener('auth-hydrated', function (e) {
    hydrated = true;
    me = (e.detail && e.detail.me) || null;
  });

  function init() {
    initPlayer();
    localizePrices();
    armOffer();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
