// price-alert.js v1 -- the quiet "Email me if there is ever a discount" button.
//
// Markup contract (any surface): a [data-palert] container with
// data-surface, holding [data-palert-btn], a hidden [data-palert-form] with
// [data-palert-email] + [data-palert-send], and a hidden [data-palert-done].
// Signed-in visitors: one click posts to /api/price-alert and the container
// says the email is on its way. Signed-out: the click reveals the one-field
// form. Never a modal, never competing with the buy button.
(function () {
  'use strict';
  function readToken() {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (!k || k.indexOf('sb-') !== 0 || k.indexOf('-auth-token') < 0) continue;
        var raw = localStorage.getItem(k); if (!raw) continue;
        var val = raw;
        if (raw.charAt(0) !== '{' && raw.indexOf('base64-') === 0) { try { val = atob(raw.slice(7)); } catch (e) {} }
        try { var o = JSON.parse(val); if (o && o.access_token) return o.access_token; if (Array.isArray(o) && typeof o[0] === 'string') return o[0]; }
        catch (e) { if (val.split('.').length === 3) return val; }
      }
    } catch (e) {}
    return null;
  }
  /* What the email field is actually for, in the reader's own terms. One line
     each, because the answer they tapped already told us what they care about
     and repeating it back is the only thing that makes the field make sense. */
  var PROMPT = {
    price: 'Leave your email and I will write to you the moment there is a discount on Pro. '
         + 'That is the only thing I will ever use it for: no newsletter, no sequence, and you can '
         + 'stop it from that one email.',
    unsure: 'Leave your email and I will send you one complete lesson, free and with no card. '
          + 'It takes about fifteen minutes, which is enough to judge it on.'
  };
  function ga(name, params) { try { if (typeof gtag === 'function') gtag('event', name, params || {}); } catch (e) {} }
  /* The same anon id every other beacon on the page uses. Passed to
     /api/price-alert because that endpoint used to hardcode anon_id NULL,
     which collapsed every anonymous alert into one bucket and is why 17 rows
     were reported as "5 people". */
  function anonId() {
    try {
      var a = localStorage.getItem('rsc-aid');
      if (!a) { a = Math.random().toString(36).slice(2, 12); localStorage.setItem('rsc-aid', a); }
      return a;
    } catch (e) { return null; }
  }
  /* Which answer was tapped, recorded for every answer including the one that
     writes no alert row. Without this the box's own conversion is unmeasurable. */
  function signal(reason) {
    try {
      var h = { 'Content-Type': 'application/json' };
      var t = readToken(); if (t) h['Authorization'] = 'Bearer ' + t;
      fetch('/api/signal', { method: 'POST', keepalive: true, headers: h,
        body: JSON.stringify({ s: 'objection', p: location.pathname, m: reason, a: anonId() }) }).catch(function () {});
    } catch (e) {}
  }

  function wire(box) {
    var btn = box.querySelector('[data-palert-btn]'), form = box.querySelector('[data-palert-form]');
    var email = box.querySelector('[data-palert-email]'), send = box.querySelector('[data-palert-send]');
    var done = box.querySelector('[data-palert-done]');
    var surface = box.getAttribute('data-surface') || 'pricing';
    var reasons = box.querySelector('[data-palert-reasons]');
    var lock = box.querySelector('[data-palert-lock]');
    var chosen = 'price';   // the historic behaviour of every existing surface
    var busy = false;
    function finish(res) {
      if (btn) btn.hidden = true;
      if (form) form.hidden = true;
      var lead = box.querySelector('[data-palert-lead]');
      if (lead) lead.hidden = true;
      if (done) {
        done.hidden = false;
        if (chosen === 'unsure') {
          done.textContent = res && res.sent
            ? 'Check your inbox. The lesson is on its way, and it is the only email you will get.'
            : 'Noted. I will send that lesson over, and nothing after it.';
        } else if (res && res.already) done.textContent = 'You are already on the list. You will hear from me the moment there is a discount.';
        else if (res && res.sent) done.textContent = 'Sent. There is one question in it, which tells me when to send the code.';
        else done.textContent = 'Noted. You will hear from me the moment there is a discount.';
      }
      ga('price_alert_optin', { surface: surface, sent: !!(res && res.sent) });
      // A bar surface (the bottom whisper bar) slides away after the thank-you.
      if (box.hasAttribute('data-palert-bar')) setTimeout(function () { box.classList.remove('show'); box.classList.add('gone'); }, 3500);
    }
    function submit(addr) {
      if (busy) return; busy = true;
      var hdrs = { 'Content-Type': 'application/json' };
      var tok = readToken(); if (tok) hdrs['Authorization'] = 'Bearer ' + tok;
      var body = { surface: surface, reason: chosen, a: anonId() };
      if (addr) body.email = addr;
      fetch('/api/price-alert', { method: 'POST', headers: hdrs, body: JSON.stringify(body) })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (x) {
          busy = false;
          if (!x.ok) { if (email) { email.setCustomValidity(''); email.focus(); } if (done) { done.hidden = false; done.textContent = (x.j && x.j.error && x.j.error.message) || (x.j && x.j.message) || 'Please check the email address.'; } return; }
          finish(x.j);
        })
        .catch(function () { busy = false; if (done) { done.hidden = false; done.textContent = 'Something went wrong on my side. Please try again in a moment.'; } });
    }
    /* Tap first, ask for an address second, and only on the answers that need
       a reply. Committing to an answer is one tap with no field, which is the
       whole point: the address was the friction, not the question. */
    if (reasons) {
      reasons.addEventListener('click', function (e) {
        var b = e.target.closest('[data-palert-reason]'); if (!b) return;
        chosen = b.getAttribute('data-palert-reason') || 'price';
        signal(chosen);
        ga('price_alert_reason', { surface: surface, reason: chosen });
        reasons.hidden = true;
        var lead = box.querySelector('[data-palert-lead]');
        try {
          box.dispatchEvent(new CustomEvent('palert-reason',
            { bubbles: true, detail: { reason: chosen, box: box, surface: surface } }));
        } catch (err) {}
        /* "No time right now" is answered by the price lock, which is a
           checkout, not an email. Whoever owns a checkout on this page renders
           it; nothing more is asked of the reader here. */
        if (chosen === 'no_time') {
          if (lead) lead.hidden = true;
          /* If no page rendered a panel (a surface with no checkout), say so
             rather than leaving a dead end. */
          setTimeout(function () {
            if (lock && lock.hidden && done) {
              done.hidden = false;
              done.textContent = 'Noted. The plans are on the pricing page whenever you are ready.';
            }
          }, 400);
          return;
        }
        /* Signed in, so the address is already known: no field, no typing,
           straight to the confirmation. */
        if (readToken()) { if (lead) lead.hidden = true; submit(null); return; }
        /* Signed out, so one line has to say what the address is for. Leaving
           a bare input with no sentence was the whole complaint: the reader
           has committed to an answer and is then asked for an email with no
           reason given. */
        if (lead) lead.textContent = PROMPT[chosen] || PROMPT.price;
        if (form) { form.hidden = false; form.style.display = 'flex'; if (email) email.focus(); }
      });
    }

    if (btn) btn.addEventListener('click', function () {
      ga('price_alert_click', { surface: surface });
      if (readToken()) { submit(null); return; }
      if (form) { form.hidden = false; form.style.display = 'inline-flex'; form.style.gap = '6px'; form.style.verticalAlign = 'middle'; if (email) email.focus(); }
      btn.hidden = true;
    });
    if (send) send.addEventListener('click', function () {
      var v = email && email.value.trim();
      if (!v || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { if (email) email.focus(); return; }
      submit(v);
    });
    if (email) email.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); if (send) send.click(); } });
  }
  /* Persistent mode ([data-palert-persist], the pricing page's "Still deciding?"):
     the three answers stay on screen as chips, the first is pre-selected, tapping
     one swaps in its [data-palert-answer] and records the objection. The email
     field only appears for the answers that need a reply (price, unsure); a
     signed-in reader gets a one-click button instead of a field, and nothing is
     sent until they press it. */
  function wirePersist(box) {
    var reasons = box.querySelector('[data-palert-reasons]');
    var form = box.querySelector('[data-palert-form]'), email = box.querySelector('[data-palert-email]');
    var send = box.querySelector('[data-palert-send]'), done = box.querySelector('[data-palert-done]');
    var surface = box.getAttribute('data-surface') || 'pricing';
    var signedIn = !!readToken();
    var EMAILS = { price: 1, unsure: 1 };
    var sent = {}, busy = false;
    var pre = reasons && reasons.querySelector('[aria-pressed="true"]');
    var chosen = (pre && pre.getAttribute('data-palert-reason')) || 'no_time';
    if (email && signedIn) email.hidden = true;
    function show(reason) {
      chosen = reason;
      Array.prototype.forEach.call(reasons.querySelectorAll('[data-palert-reason]'), function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-palert-reason') === reason ? 'true' : 'false');
      });
      Array.prototype.forEach.call(box.querySelectorAll('[data-palert-answer]'), function (a) {
        a.hidden = a.getAttribute('data-palert-answer') !== reason;
      });
      if (form) form.hidden = !EMAILS[reason] || !!sent[reason];
      if (send) send.textContent = reason === 'unsure' ? 'Send me a lesson' : 'Email me';
      if (done) { done.hidden = !sent[reason]; done.textContent = sent[reason] || ''; }
    }
    function message(res) {
      if (chosen === 'unsure') return res && res.sent
        ? 'Check your inbox. The lesson is on its way, and it is the only email you will get.'
        : 'Noted. I will send that lesson over, and nothing after it.';
      if (res && res.already) return 'You are already on the list. You will hear from me if there is ever a discount.';
      if (res && res.sent) return 'Thanks. Check your inbox: one short question in it tells me when to send you a code.';
      return 'Thanks. You will hear from me if there is ever a discount.';
    }
    if (reasons) reasons.addEventListener('click', function (e) {
      var b = e.target.closest('[data-palert-reason]'); if (!b) return;
      var r = b.getAttribute('data-palert-reason') || 'price';
      show(r);
      signal(r);
      ga('price_alert_reason', { surface: surface, reason: r });
    });
    if (send) send.addEventListener('click', function () {
      if (busy) return;
      var body = { surface: surface, reason: chosen, a: anonId() };
      var hdrs = { 'Content-Type': 'application/json' };
      var tok = readToken(); if (tok) hdrs['Authorization'] = 'Bearer ' + tok;
      if (!tok) {
        var v = email && email.value.trim();
        if (!v || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { if (email) email.focus(); return; }
        body.email = v;
      }
      busy = true; send.disabled = true;
      var reason = chosen;
      fetch('/api/price-alert', { method: 'POST', headers: hdrs, body: JSON.stringify(body) })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (x) {
          busy = false; send.disabled = false;
          if (!x.ok) { if (done) { done.hidden = false; done.textContent = (x.j && x.j.error && x.j.error.message) || (x.j && x.j.message) || 'Please check the email address.'; } return; }
          sent[reason] = message(x.j);
          ga('price_alert_optin', { surface: surface, sent: !!(x.j && x.j.sent), reason: reason });
          if (chosen === reason) show(reason);
        })
        .catch(function () { busy = false; send.disabled = false; if (done) { done.hidden = false; done.textContent = 'Something went wrong on my side. Please try again in a moment.'; } });
    });
    if (email) email.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); if (send) send.click(); } });
    show(chosen);
  }
  function init() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-palert]'), function (box) {
      if (box.hasAttribute('data-palert-persist')) wirePersist(box); else wire(box);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
