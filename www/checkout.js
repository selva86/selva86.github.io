/* One-click Pro checkout, shared by the lesson wall and any page that wants
   to open Paddle without a detour through /pricing.html.

   window.rsCheckout.ready(cb)         cb({prices, currency, fmt}) once Paddle has localized
   window.rsCheckout.open(plan, opts)  plan: 'allaccess' | 'single' | 'lifetime';
                                       opts: {term:'year'|'month', track, code}
   window.rsCheckout.price(plan, term) formatted localized total, or null before ready

   Reads the same public config as pricing.html (/api/_auth-config: client
   token, price ids), fires the same purchase-intent signals, and sends the
   same customData the Paddle webhook keys entitlement on. Signed-out visitors
   are sent to sign in and come back to the same page. */
(function () {
  'use strict';
  if (window.rsCheckout) return;
  var cfg = null, ready = false, FMT = {}, currency = 'USD', waiters = [], loading = false;

  function token() {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf('sb-') === 0 && k.indexOf('-auth-token') > 0) {
          var v = JSON.parse(localStorage.getItem(k));
          if (v && typeof v.access_token === 'string') return v.access_token;
          if (Array.isArray(v) && typeof v[0] === 'string') return v[0];
        }
      }
    } catch (e) {}
    return null;
  }
  function claims(t) { try { return JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); } catch (e) { return {}; } }
  function signal(s, m) {
    try {
      var h = { 'Content-Type': 'application/json' }; var t = token(); if (t) h['Authorization'] = 'Bearer ' + t;
      var a = localStorage.getItem('rsc-aid'); if (!a) { a = Math.random().toString(36).slice(2, 12); localStorage.setItem('rsc-aid', a); }
      fetch('/api/signal', { method: 'POST', keepalive: true, headers: h, body: JSON.stringify({ s: s, p: location.pathname, m: m || '', a: a }) }).catch(function () {});
    } catch (e) {}
  }
  function priceId(plan, term) {
    var P = (cfg && cfg.prices) || {};
    if (plan === 'lifetime') return P.lifetime || null;
    var g = P[plan]; if (!g) return null;
    return g[term === 'month' ? 'month' : 'year'] || null;
  }
  function fmtWhole(raw, cur) {
    var n = parseInt(raw, 10); if (!isFinite(n)) return null;
    try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(n / 100); } catch (e) { return null; }
  }
  function load() {
    if (loading || ready) return; loading = true;
    fetch('/api/_auth-config').then(function (r) { return r.json(); }).then(function (c) {
      if (!c || !c.paddle || !c.paddle.clientToken) { loading = false; return; }
      cfg = c.paddle;
      var s = document.createElement('script');
      s.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
      s.onload = function () {
        try {
          window.Paddle.Environment.set(cfg.environment === 'sandbox' ? 'sandbox' : 'production');
          window.Paddle.Initialize({ token: cfg.clientToken, eventCallback: function (ev) {
            try {
              if (!ev || !ev.name) return;
              var d = ev.data || {};
              if (ev.name === 'checkout.loaded') { signal('checkout_start', String((d.items && d.items[0] && (d.items[0].price_id || (d.items[0].price && d.items[0].price.id))) || '')); if (typeof gtag === 'function') gtag('event', 'begin_checkout', { currency: d.currency_code, value: d.totals && d.totals.total }); }
              else if (ev.name === 'checkout.customer.created' || ev.name === 'checkout.customer.updated') { var ce = d.customer && d.customer.email; if (ce) signal('checkout_lead', ce); }
              else if (ev.name === 'checkout.completed') { signal('purchase_client', d.transaction_id || ''); if (typeof gtag === 'function') gtag('event', 'purchase', { transaction_id: d.transaction_id, currency: d.currency_code, value: d.totals && d.totals.total }); }
              else if (ev.name === 'checkout.closed') signal('checkout_closed', '');
            } catch (e) {}
          } });
          ready = true;
          preview();
        } catch (e) { loading = false; }
      };
      s.onerror = function () { loading = false; };
      document.head.appendChild(s);
    }).catch(function () { loading = false; });
  }
  function preview() {
    var P = cfg.prices || {}, items = [];
    [P.single && P.single.month, P.single && P.single.year, P.allaccess && P.allaccess.month, P.allaccess && P.allaccess.year, P.lifetime]
      .forEach(function (id) { if (id) items.push({ priceId: id, quantity: 1 }); });
    if (!items.length) { flush(); return; }
    window.Paddle.PricePreview({ items: items }).then(function (r) {
      var d = r && r.data;
      if (d && d.details && d.details.lineItems) {
        currency = d.currencyCode || 'USD';
        d.details.lineItems.forEach(function (li) { FMT[li.price.id] = fmtWhole(li.totals && li.totals.total, currency) || (li.formattedTotals && li.formattedTotals.total); });
      }
      flush();
    }).catch(flush);
  }
  function flush() { var w = waiters; waiters = []; w.forEach(function (cb) { try { cb({ prices: FMT, currency: currency, price: price }); } catch (e) {} }); }
  function price(plan, term) { var id = priceId(plan, term); return (id && FMT[id]) || null; }

  function open(plan, opts) {
    opts = opts || {};
    var t = token();
    if (!t) { location.href = '/signin.html?next=' + encodeURIComponent(location.pathname + location.search); return; }
    if (!ready) { waiters.push(function () { open(plan, opts); }); load(); return; }
    var id = priceId(plan, opts.term);
    if (!id) { location.href = '/pricing.html'; return; }
    var c = claims(t);
    var cd = { user_id: c.sub || '', plan: plan, term: plan === 'lifetime' ? 'once' : (opts.term === 'month' ? 'month' : 'year') };
    if (plan === 'single' && opts.track) cd.track = opts.track;
    try {
      window.Paddle.Checkout.open({
        discountCode: opts.code || undefined,
        items: [{ priceId: id, quantity: 1 }],
        customer: c.email ? { email: c.email } : undefined,
        customData: cd,
        settings: { displayMode: 'overlay', variant: 'one-page', successUrl: location.origin + '/welcome.html' },
      });
    } catch (e) { location.href = '/pricing.html'; }
  }

  window.rsCheckout = {
    ready: function (cb) { if (ready && Object.keys(FMT).length) cb({ prices: FMT, currency: currency, price: price }); else { waiters.push(cb); load(); } },
    open: open,
    price: price,
    load: load,
  };
})();
