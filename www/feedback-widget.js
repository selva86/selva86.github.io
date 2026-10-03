// feedback-widget.js v2 -- the standing "Feedback" launcher, bottom right.
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
// v2 fixes a bug that made the composer unusable: the outside-click handler
// tested root.contains(e.target) while bubbling, but by then choosing a route
// had already replaced the panel's contents, so the clicked button was
// detached, containment read false, and the panel shut itself a frame after
// opening the form. The test now runs in the capture phase, before any
// handler has had the chance to rewrite the DOM underneath it.
(function () {
  'use strict';

  if (window.__rsFeedbackWidget) return;
  window.__rsFeedbackWidget = true;

  /* The player owns the whole viewport and its own bottom-right controls.
     lesson-locked and welcome are decision moments where a second floating
     thing competes with the only action that matters. */
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
  /* Placeholders ask for the one thing that makes each kind actionable. A bug
     with no steps and a feature request with no use case both cost a round
     trip to answer. */
  var PROMPT = {
    bug:     'What did you do, and what happened instead?',
    idea:    'What would you like to be able to do, and what are you doing today instead?',
    content: 'Which lesson or page, and what is wrong with it?',
    sales:   'How many people, and what do you need? Seats, invoicing, procurement.',
    general: 'Go ahead, I am reading.',
  };
  var MIN = 10;

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
    '.rsfb-panel{position:absolute;right:0;bottom:calc(100% + 10px);width:372px;',
    'max-width:calc(100vw - 32px);max-height:calc(100vh - 120px);overflow:auto;',
    'background:#fff;border:1px solid #e8eaee;border-radius:14px;box-shadow:0 24px 60px -18px rgba(9,14,26,.32);',
    'opacity:0;visibility:hidden;transform:translateY(6px);pointer-events:none;',
    'transition:opacity .16s ease,transform .16s ease,visibility .16s}',
    '.rsfb.is-open .rsfb-panel{opacity:1;visibility:visible;transform:none;pointer-events:auto}',
    '.rsfb-hd{padding:13px 15px 11px;border-bottom:1px solid #f1f3f6;display:flex;align-items:center;gap:8px}',
    ".rsfb-hd b{font-family:'Inter Tight',Inter,sans-serif;font-size:14.5px;color:#14161b;flex:1;font-weight:700}",
    '.rsfb-hd .rsfb-sub{display:block;font-size:11px;color:#868b94;font-weight:500;margin-top:1px}',
    '.rsfb-x,.rsfb-back{appearance:none;border:0;background:none;color:#868b94;cursor:pointer;',
    'padding:3px 5px;border-radius:6px;display:flex;align-items:center;line-height:1}',
    '.rsfb-x{font-size:19px}.rsfb-x:hover,.rsfb-back:hover{color:#14161b;background:#f1f3f6}',
    '.rsfb-back svg{width:15px;height:15px}',
    /* routes */
    '.rsfb-list{padding:5px}',
    '.rsfb-item{display:block;width:100%;text-align:left;border:0;background:none;cursor:pointer;',
    'padding:9px 10px;border-radius:9px;font:inherit}',
    '.rsfb-item:hover{background:#f1f3f6}',
    '.rsfb-item:focus-visible{outline:2px solid #2056d2;outline-offset:-2px}',
    '.rsfb-il{display:block;font-size:13.5px;font-weight:600;color:#14161b}',
    '.rsfb-is{display:block;font-size:11.5px;color:#868b94;margin-top:1px;line-height:1.4}',
    /* composer */
    '.rsfb-form{padding:13px 15px 15px}',
    '.rsfb-form label{display:block;font-size:11.5px;font-weight:600;color:#14161b;margin:0 0 5px}',
    '.rsfb-form textarea{width:100%;min-height:148px;resize:vertical;font:inherit;font-size:13.5px;',
    'line-height:1.55;padding:10px 11px;border:1px solid #e8eaee;border-radius:9px;color:#14161b;background:#fff}',
    '.rsfb-form textarea:focus{outline:0;border-color:#2056d2;box-shadow:0 0 0 3px rgba(32,86,210,.12)}',
    '.rsfb-meta{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:6px}',
    '.rsfb-count{font-size:11px;color:#868b94;font-variant-numeric:tabular-nums}',
    '.rsfb-where{font-size:11px;color:#868b94;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:60%}',
    '.rsfb-form input{width:100%;font:inherit;font-size:13px;padding:9px 11px;margin-top:4px;',
    'border:1px solid #e8eaee;border-radius:9px;color:#14161b;background:#fff}',
    '.rsfb-form input:focus{outline:0;border-color:#2056d2;box-shadow:0 0 0 3px rgba(32,86,210,.12)}',
    '.rsfb-field{margin-top:12px}',
    '.rsfb-send{margin-top:12px;width:100%;appearance:none;border:0;background:#14161b;color:#fff;',
    "font-family:'Inter Tight',Inter,sans-serif;font-weight:700;font-size:13.5px;padding:11px;",
    'border-radius:9px;cursor:pointer;transition:background .14s}',
    '.rsfb-send:hover:not([disabled]){background:#262a31}',
    '.rsfb-send[disabled]{background:#c3cad9;cursor:default}',
    '.rsfb-note{margin:9px 0 0;font-size:11px;color:#868b94;line-height:1.5}',
    '.rsfb-err{margin:9px 0 0;font-size:12px;color:#a3261b;line-height:1.5}',
    /* done */
    '.rsfb-done{padding:26px 18px;text-align:center}',
    '.rsfb-done .rsfb-tick{width:38px;height:38px;border-radius:50%;background:#e7f6ec;color:#166534;',
    'display:flex;align-items:center;justify-content:center;margin:0 auto 11px}',
    '.rsfb-done .rsfb-tick svg{width:19px;height:19px}',
    ".rsfb-done b{display:block;font-family:'Inter Tight',Inter,sans-serif;font-size:15px;color:#14161b}",
    '.rsfb-done p{margin:6px 0 0;font-size:12.5px;color:#868b94;line-height:1.55}',
    '.rsfb-again{margin-top:13px;appearance:none;border:1px solid #e8eaee;background:#fff;color:#14161b;',
    'font:inherit;font-size:12.5px;font-weight:600;padding:8px 14px;border-radius:8px;cursor:pointer}',
    '.rsfb-again:hover{background:#f1f3f6}',
    '@media(max-width:560px){.rsfb{right:12px;bottom:12px}.rsfb-t2{display:none}',
    '.rsfb-panel{width:calc(100vw - 24px)}}',
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
      '<div class="rsfb-panel" role="dialog" aria-label="Send feedback"></div>' +
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
    var route = 'general';

    function head(title, withBack) {
      return '<div class="rsfb-hd">' +
        (withBack ? '<button type="button" class="rsfb-back" aria-label="Back to the list">' +
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

    function showForm(id) {
      route = id;
      var r = ROUTES.filter(function (x) { return x.id === id; })[0] || ROUTES[4];
      var signedIn = !!readToken();
      var where = location.pathname.length > 34 ? location.pathname.slice(0, 33) + '...' : location.pathname;
      panel.innerHTML = head(r.label, true) +
        '<div class="rsfb-form">' +
          '<label for="rsfb-msg">' + esc(r.sub) + '</label>' +
          '<textarea id="rsfb-msg" data-msg placeholder="' + esc(PROMPT[r.id] || '') + '"></textarea>' +
          '<div class="rsfb-meta">' +
            '<span class="rsfb-where" title="' + esc(location.pathname) + '">Sent from ' + esc(where) + '</span>' +
            '<span class="rsfb-count" data-count>0</span>' +
          '</div>' +
          (signedIn ? '' :
            '<div class="rsfb-field"><label for="rsfb-em">Email, if you would like a reply</label>' +
            '<input id="rsfb-em" type="email" data-email placeholder="you@email.com" autocomplete="email"></div>') +
          '<button type="button" class="rsfb-send" data-send disabled>Send</button>' +
          '<p class="rsfb-note">' +
            (signedIn ? 'Sent from your account, so I can write back.'
                      : 'The email is optional. Without it I have no way to reply.') +
          '</p>' +
          '<p class="rsfb-err" data-err hidden></p>' +
        '</div>';
      var ta = panel.querySelector('[data-msg]');
      if (ta) { ta.focus(); gauge(); }
    }

    /* Send stays disabled until there is enough to act on, and the count says
       how far off they are rather than rejecting them after the fact. */
    function gauge() {
      var ta = panel.querySelector('[data-msg]');
      var c = panel.querySelector('[data-count]');
      var go = panel.querySelector('[data-send]');
      if (!ta || !go) return;
      var n = ta.value.trim().length;
      go.disabled = n < MIN;
      if (c) c.textContent = n < MIN ? (MIN - n) + ' more' : String(n);
    }

    function showDone() {
      panel.innerHTML =
        '<div class="rsfb-done">' +
          '<span class="rsfb-tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
          'stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>' +
          '<b>Thank you, that is with me.</b>' +
          '<p>' + (route === 'sales'
            ? 'Sales enquiries get a reply the same day, usually sooner.'
            : 'I read every one of these myself.') + '</p>' +
          '<button type="button" class="rsfb-again" data-again>Send another</button>' +
        '</div>';
    }

    function send() {
      var ta = panel.querySelector('[data-msg]');
      var em = panel.querySelector('[data-email]');
      var err = panel.querySelector('[data-err]');
      var go = panel.querySelector('[data-send]');
      var msg = (ta && ta.value || '').trim();
      if (msg.length < MIN) { if (ta) ta.focus(); return; }
      var addr = (em && em.value || '').trim();
      if (addr && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(addr)) {
        if (err) { err.hidden = false; err.textContent = 'That email does not look right.'; }
        if (em) em.focus(); return;
      }
      if (err) err.hidden = true;
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
          showDone();
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

    btn.addEventListener('click', function (e) { e.stopPropagation(); setOpen(!open); });

    panel.addEventListener('click', function (e) {
      var item = e.target.closest('[data-route]');
      if (item) { showForm(item.getAttribute('data-route')); return; }
      if (e.target.closest('.rsfb-x')) { setOpen(false); return; }
      if (e.target.closest('.rsfb-back')) { showRoutes(); return; }
      if (e.target.closest('[data-again]')) { showForm(route); return; }
      if (e.target.closest('[data-send]')) { send(); }
    });
    panel.addEventListener('input', function (e) { if (e.target.matches('[data-msg]')) gauge(); });
    panel.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && e.target.matches('[data-msg]')) { e.preventDefault(); send(); }
    });

    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && open) setOpen(false); });
    /* Capture, not bubble. Choosing a route rewrites the panel, so by the time
       a bubbling listener runs, the element that was clicked is detached and
       every containment test reads false. */
    document.addEventListener('click', function (e) {
      if (open && !root.contains(e.target)) setOpen(false);
    }, true);
  }

  function init() { if (!suppressed()) build(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
