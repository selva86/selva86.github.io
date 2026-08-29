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
  function ga(name, params) { try { if (typeof gtag === 'function') gtag('event', name, params || {}); } catch (e) {} }

  function wire(box) {
    var btn = box.querySelector('[data-palert-btn]'), form = box.querySelector('[data-palert-form]');
    var email = box.querySelector('[data-palert-email]'), send = box.querySelector('[data-palert-send]');
    var done = box.querySelector('[data-palert-done]');
    var surface = box.getAttribute('data-surface') || 'pricing';
    var busy = false;
    function finish(res) {
      if (btn) btn.hidden = true;
      if (form) form.hidden = true;
      var lead = box.querySelector('[data-palert-lead]');
      if (lead) lead.hidden = true;
      if (done) {
        done.hidden = false;
        if (res && res.already) done.textContent = 'You are already on the list. You will hear from me the moment there is a discount.';
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
      var body = { surface: surface };
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
