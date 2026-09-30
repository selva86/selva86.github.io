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
    price: 'Fair enough. One email, only if there is ever a discount. Where should I send it?',
    unsure: 'Fair enough. Where should I send it? I will show you the quickest way to find out, free.'
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
            ? 'Sent. One email, with the fastest way to find out. Nothing else.'
            : 'Noted. I will send you the fastest way to find out, and nothing else.';
        } else if (res && res.already) done.textContent = 'You are already on the list. You will hear from me the moment there is a discount.';
        else if (res && res.sent) done.textContent = 'Sent. I have asked you one quick question in that email, pls check.';
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
          if (!x.ok) { if (email) { email.setCustomValidity(''); email.focus(); } if (done) { done.hidden = false; done.textContent = (x.j && x.j.message) || 'Please check the email address.'; } return; }
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
  function init() { Array.prototype.forEach.call(document.querySelectorAll('[data-palert]'), wire); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
