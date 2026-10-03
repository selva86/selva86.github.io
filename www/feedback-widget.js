// feedback-widget.js v1 -- the standing "Feedback" launcher, bottom right.
//
// A page that only takes feedback through /feedback.html collects it from the
// small number of people who go looking. A launcher that is always there
// collects it from the people who have just hit the thing worth telling you
// about, which is a different and much more useful population.
//
// Contract: nothing to add to a page. The script injects its own styles, its
// own launcher and its own dialog, and posts to the existing /api/feedback.
// Five routes, four of which map onto categories the endpoint already knew;
// only "sales" is new, and a sales enquiry is a lead rather than feedback, so
// the endpoint marks it differently in the owner's inbox.
//
// It stays out of the way of the lesson player: a floating pill in the bottom
// right would sit on top of "Continue" and the rail, and the player is the one
// place on the site where the reader is mid-task.
(function () {
  'use strict';

  if (window.__rsFeedbackWidget) return;
  window.__rsFeedbackWidget = true;

  /* The player owns the whole viewport and its own bottom-right controls.
     lesson-locked and the checkout return are decision moments where a second
     floating thing competes with the only action that matters. */
  function suppressed() {
    try {
      var b = document.body;
      if (!b) return true;
      if (b.classList.contains('lesson-mode')) return true;
      if (document.querySelector('.lm-app')) return true;
      var p = location.pathname.replace(/\/+$/, '');
      return p === '/lesson-locked.html' || p === '/welcome.html' || p === '/feedback.html';
    } catch (e) { return false; }
  }

  var ROUTES = [
    { id: 'bug',     label: 'Report a bug',      sub: 'Something is wrong or broken' },
    { id: 'idea',    label: 'Request a feature', sub: 'Something you wish existed' },
    { id: 'content', label: 'Content feedback',  sub: 'A lesson, tutorial or exercise' },
    { id: 'sales',   label: 'Sales enquiry',     sub: 'Teams, invoicing, or a question about Pro' },
    { id: 'general', label: 'Something else',    sub: 'Anything that does not fit above' },
  ];
  var PROMPT = {
    bug:     'What went wrong, and where?',
    idea:    'What would you like to be able to do?',
    content: 'Which lesson or page, and what is off about it?',
    sales:   'What do you need? Seats, invoicing, or something about a plan.',
    general: 'Go ahead.',
  };

  var CSS = [
    '.rsfb{position:fixed;right:18px;bottom:18px;z-index:2147483000;',
    "font-family:Inter,-apple-system,'Segoe UI',Roboto,Arial,sans-serif}",
    '.rsfb *{box-sizing:border-box}',
    /* launcher */
    '.rsfb-btn{display:flex;align-items:center;gap:9px;background:#14161b;color:#fff;border:0;',
    'padding:9px 14px;border-radius:999px;cursor:pointer;box-shadow:0 6px 20px -6px rgba(9,14,26,.42);',
    'transition:transform .15s ease,box-shadow .15s ease}',
    '.rsfb-btn:hover{transform:translateY(-1px);box-shadow:0 10px 26px -8px rgba(9,14,26,.5)}',
    '.rsfb-btn:focus-visible{outline:2px solid #2056d2;outline-offset:2px}',
    '.rsfb-btn svg{width:16px;height:16px;flex:none}',
    '.rsfb-tx{display:flex;flex-direction:column;align-items:flex-start;line-height:1.2;text-align:left}',
    ".rsfb-t1{font-family:'Inter Tight',Inter,sans-serif;font-weight:700;font-size:13.5px}",
    '.rsfb-t2{font-size:10.5px;color:#c3cad9;font-weight:500;margin-top:1px}',
    /* panel */
    '.rsfb-panel{position:absolute;right:0;bottom:calc(100% + 10px);width:320px;max-width:calc(100vw - 32px);',
    'background:#fff;border:1px solid #e8eaee;border-radius:14px;box-shadow:0 24px 60px -18px rgba(9,14,26,.32);',
    'overflow:hidden;opacity:0;visibility:hidden;transform:translateY(6px);pointer-events:none;',
    'transition:opacity .16s ease,transform .16s ease,visibility .16s}',
    '.rsfb.is-open .rsfb-panel{opacity:1;visibility:visible;transform:none;pointer-events:auto}',
    '.rsfb-hd{padding:13px 15px 11px;border-bottom:1px solid #f1f3f6;display:flex;align-items:center;gap:8px}',
    ".rsfb-hd b{font-family:'Inter Tight',Inter,sans-serif;font-size:14.5px;color:#14161b;flex:1}",
    '.rsfb-hd .rsfb-sub{display:block;font-size:11px;color:#868b94;font-weight:500;margin-top:1px}',
    '.rsfb-x{appearance:none;border:0;background:none;color:#868b94;font-size:19px;line-height:1;',
    'cursor:pointer;padding:2px 4px;border-radius:6px}',
    '.rsfb-x:hover{color:#14161b;background:#f1f3f6}',
    '.rsfb-back{appearance:none;border:0;background:none;color:#868b94;cursor:pointer;padding:2px 4px;',
    'border-radius:6px;display:flex;align-items:center}',
    '.rsfb-back:hover{color:#14161b;background:#f1f3f6}',
    '.rsfb-back svg{width:15px;height:15px}',
    /* routes */
    '.rsfb-list{padding:5px}',
    '.rsfb-item{display:block;width:100%;text-align:left;border:0;background:none;cursor:pointer;',
    'padding:9px 10px;border-radius:9px;font:inherit}',
    '.rsfb-item:hover{background:#f1f3f6}',
    '.rsfb-item:focus-visible{outline:2px solid #2056d2;outline-offset:-2px}',
    '.rsfb-il{display:block;font-size:13.5px;font-weight:600;color:#14161b}',
    '.rsfb-is{display:block;font-size:11.5px;color:#868b94;margin-top:1px;line-height:1.4}',
    /* compose */
    '.rsfb-form{padding:12px 15px 14px}',
    '.rsfb-form textarea{width:100%;min-height:92px;resize:vertical;font:inherit;font-size:13.5px;',
    'padding:9px 10px;border:1px solid #e8eaee;border-radius:9px;color:#14161b;background:#fff}',
    '.rsfb-form textarea:focus{outline:0;border-color:#2056d2}',
    '.rsfb-form input{width:100%;font:inherit;font-size:13px;padding:8px 10px;margin-top:8px;',
    'border:1px solid #e8eaee;border-radius:9px;color:#14161b;background:#fff}',
    '.rsfb-form input:focus{outline:0;border-color:#2056d2}',
    '.rsfb-send{margin-top:10px;width:100%;appearance:none;border:0;background:#14161b;color:#fff;',
    "font-family:'Inter Tight',Inter,sans-serif;font-weight:700;font-size:13.5px;padding:10px;",
    'border-radius:9px;cursor:pointer}',
    '.rsfb-send:hover{background:#262a31}',
    '.rsfb-send[disabled]{opacity:.55;cursor:default}',
    '.rsfb-note{margin:8px 0 0;font-size:11px;color:#868b94;line-height:1.5}',
    '.rsfb-err{margin:8px 0 0;font-size:12px;color:#a3261b}',
    '.rsfb-done{padding:22px 16px;text-align:center}',
    ".rsfb-done b{display:block;font-family:'Inter Tight',Inter,sans-serif;font-size:15px;color:#14161b}",
    '.rsfb-done p{margin:6px 0 0;font-size:12.5px;color:#868b94;line-height:1.5}',
    '@media(max-width:560px){.rsfb{right:12px;bottom:12px}.rsfb-t2{display:none}}',
    '@media(prefers-reduced-motion:reduce){.rsfb-btn,.rsfb-panel{transition:none}}',
  ].join('');

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function readToken() {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (!k || k.indexOf('sb-') !== 0 || k.indexOf('-auth-token') < 0) continue;
        var raw = localStorage.getItem(k); if (!raw) continue;
        var v = raw;
        if (raw.charAt(0) !== '{' && raw.indexOf('base64-') === 0) { try { v = atob(raw.slice(7)); } catch (e) {} }
        try { var o = JSON.parse(v); if (o && o.access_token) return o.access_token; if (Array.isArray(o) && typeof o[0] === 'string') return o[0]; }
        catch (e) { if (v.split('.').length === 3) return v; }
      }
    } catch (e) {}
    return null;
  }

  function build() {
    var style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    var root = document.createElement('div');
    root.className = 'rsfb';
    root.innerHTML =
      '<div class="rsfb-panel" role="dialog" aria-label="Send feedback" aria-modal="false"></div>' +
      '<button type="button" class="rsfb-btn" aria-expanded="false" aria-haspopup="dialog">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" ' +
        'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.8 8.8 0 0 1-3.8-.9L3 20.5l1.6-4.9A8.4 8.4 0 0 1 12 3.1a8.4 8.4 0 0 1 9 8.4Z"/></svg>' +
        '<span class="rsfb-tx"><span class="rsfb-t1">Feedback</span>' +
        '<span class="rsfb-t2">Real people reply</span></span>' +
      '</button>';
    document.body.appendChild(root);

    var panel = root.querySelector('.rsfb-panel');
    var btn = root.querySelector('.rsfb-btn');
    var open = false;

    function head(title, withBack) {
      return '<div class="rsfb-hd">' +
        (withBack ? '<button type="button" class="rsfb-back" aria-label="Back">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
          'stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></button>' : '') +
        '<b>' + esc(title) + '<span class="rsfb-sub">Real people reply</span></b>' +
        '<button type="button" class="rsfb-x" aria-label="Close">&times;</button></div>';
    }

    function showRoutes() {
      panel.innerHTML = head('Feedback', false) + '<div class="rsfb-list">' +
        ROUTES.map(function (r) {
          return '<button type="button" class="rsfb-item" data-route="' + r.id + '">' +
            '<span class="rsfb-il">' + esc(r.label) + '</span>' +
            '<span class="rsfb-is">' + esc(r.sub) + '</span></button>';
        }).join('') + '</div>';
    }

    function showForm(route) {
      var r = ROUTES.filter(function (x) { return x.id === route; })[0] || ROUTES[4];
      var signedIn = !!readToken();
      panel.innerHTML = head(r.label, true) +
        '<div class="rsfb-form">' +
          '<textarea data-msg placeholder="' + esc(PROMPT[r.id] || '') + '"></textarea>' +
          (signedIn ? '' : '<input type="email" data-email placeholder="Email, if you would like a reply">') +
          '<button type="button" class="rsfb-send" data-send>Send</button>' +
          '<p class="rsfb-note">' +
            (signedIn ? 'Sent from your account, so I can reply.'
                      : 'The email is optional. Without it I cannot write back.') +
          '</p>' +
          '<p class="rsfb-err" data-err hidden></p>' +
        '</div>';
      var ta = panel.querySelector('[data-msg]');
      if (ta) ta.focus();
    }

    function showDone(route) {
      panel.innerHTML = '<div class="rsfb-done"><b>Thank you, that is with me.</b>' +
        '<p>' + (route === 'sales'
          ? 'Sales enquiries get a reply the same day, usually sooner.'
          : 'I read every one of these myself.') + '</p></div>';
      setTimeout(function () { if (open) setOpen(false); }, 2600);
    }

    function send(route) {
      var ta = panel.querySelector('[data-msg]');
      var em = panel.querySelector('[data-email]');
      var err = panel.querySelector('[data-err]');
      var go = panel.querySelector('[data-send]');
      var msg = (ta && ta.value || '').trim();
      if (msg.length < 3) { if (err) { err.hidden = false; err.textContent = 'A little more detail, and I can act on it.'; } if (ta) ta.focus(); return; }
      var addr = (em && em.value || '').trim();
      if (addr && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(addr)) {
        if (err) { err.hidden = false; err.textContent = 'That email does not look right.'; } if (em) em.focus(); return;
      }
      if (go) { go.disabled = true; go.textContent = 'Sending'; }
      var h = { 'Content-Type': 'application/json' };
      var tok = readToken(); if (tok) h.Authorization = 'Bearer ' + tok;
      fetch('/api/feedback', {
        method: 'POST', headers: h,
        body: JSON.stringify({ message: msg, email: addr || undefined, category: route, page: location.pathname }),
      }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (x) {
          if (!x.ok) {
            if (go) { go.disabled = false; go.textContent = 'Send'; }
            if (err) { err.hidden = false; err.textContent = (x.j && x.j.message) || 'That did not go through. Try again in a moment.'; }
            return;
          }
          try { if (typeof gtag === 'function') gtag('event', 'feedback_sent', { category: route }); } catch (e) {}
          showDone(route);
        })
        .catch(function () {
          if (go) { go.disabled = false; go.textContent = 'Send'; }
          if (err) { err.hidden = false; err.textContent = 'That did not go through. Try again in a moment.'; }
        });
    }

    function setOpen(o) {
      open = o;
      root.classList.toggle('is-open', o);
      btn.setAttribute('aria-expanded', o ? 'true' : 'false');
      if (o) showRoutes();
    }

    btn.addEventListener('click', function () { setOpen(!open); });
    panel.addEventListener('click', function (e) {
      var item = e.target.closest('[data-route]');
      if (item) { showForm(item.getAttribute('data-route')); return; }
      if (e.target.closest('.rsfb-x')) { setOpen(false); return; }
      if (e.target.closest('.rsfb-back')) { showRoutes(); return; }
      var go = e.target.closest('[data-send]');
      if (go) {
        var t = panel.querySelector('.rsfb-hd b');
        var label = t ? t.firstChild.nodeValue : '';
        var r = ROUTES.filter(function (x) { return x.label === label; })[0];
        send(r ? r.id : 'general');
      }
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && open) setOpen(false); });
    document.addEventListener('click', function (e) {
      if (open && !root.contains(e.target)) setOpen(false);
    });
  }

  function init() { if (!suppressed()) build(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
