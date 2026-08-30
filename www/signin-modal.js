/* signin-modal.js - sign in without leaving the page.
 *
 * Every same-origin link to /signin.html (navbar, exercise gates, lesson
 * walls, persona menu, links created at runtime) opens the sign-in card in a
 * modal over the current page instead of navigating away. The card mirrors
 * signin.html: Google (GIS white-label with the OAuth button as fallback),
 * GitHub (OAuth), and the email magic link.
 *
 * Auth mechanics are unchanged from signin.html:
 *  - Redirect flows (GitHub, the OAuth fallback, the magic link) still land on
 *    /signin.html?next=<page> because only signin.html parses the token from
 *    the URL hash. signin.html then forwards to /email-optin.html?next=<page>,
 *    which is an instant pass-through for anyone who already decided.
 *  - Google one-tap completes in place (signInWithIdToken), then follows the
 *    same /email-optin.html?next=<page> route so every method behaves alike.
 *  - Signup attribution rides along as ?src=&trig= on the callback URL (which
 *    signin.html honours) and as user metadata on the magic-link path.
 *
 * Served with a short edge TTL (see _headers): edit in place, no ?v sweep.
 * Pages that are themselves auth surfaces (signin, email-optin, account) are
 * left alone. window.rsSignin.open({next, trigger}) is exposed for scripts.
 */
(function () {
  'use strict';
  if (window.rsSignin) return;
  var here = location.pathname.replace(/\/$/, '');
  if (/^\/(signin|email-optin|account)(\.html)?$/.test(here)) return;

  var SUPA_URL = 'https://esm.sh/@supabase/supabase-js@2.45.4';

  var CSS =
    '.rs-sm{position:fixed;inset:0;z-index:2600;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(15,26,43,.55);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);opacity:0;transition:opacity .18s ease}' +
    '.rs-sm[hidden]{display:none}' +
    '.rs-sm.rs-sm-on{opacity:1}' +
    '.rs-sm-card{position:relative;width:100%;max-width:440px;max-height:calc(100vh - 40px);overflow:auto;background:#fff;color:#0f1a2b;border:1px solid #d9e0e8;border-radius:0;padding:30px 32px 24px;box-shadow:0 30px 60px -30px rgba(15,26,43,.5);transform:translateY(8px);transition:transform .18s ease;font:15px/1.5 Inter,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased;text-align:left;box-sizing:border-box}' +
    '.rs-sm-card *,.rs-sm-card *::before,.rs-sm-card *::after{box-sizing:border-box}' +
    '.rs-sm.rs-sm-on .rs-sm-card{transform:none}' +
    '.rs-sm-x{position:absolute;top:10px;right:10px;width:34px;height:34px;border:0;background:none;color:#6b7684;font-size:24px;line-height:1;cursor:pointer;padding:0;margin:0;box-shadow:none}' +
    '.rs-sm-x:hover{color:#0f1a2b}' +
    '.rs-sm-brand{display:flex;align-items:center;gap:10px;font:700 16px "Inter Tight",Inter,"Helvetica Neue",Arial,sans-serif;margin:0 0 16px;letter-spacing:-.01em;color:#0f1a2b}' +
    '.rs-sm-mark{width:28px;height:28px;background:#10452f;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:15px;flex:none}' +
    '.rs-sm-card h2{margin:0;padding:0;border:0;font:700 24px/1.15 "Inter Tight",Inter,"Helvetica Neue",Arial,sans-serif;letter-spacing:-.025em;color:#0f1a2b;text-transform:none}' +
    '.rs-sm-sub{margin:8px 0 20px;padding:0;font-size:14.5px;line-height:1.5;color:#3a4757}' +
    '.rs-sm-oauth{display:grid;gap:10px}' +
    '.rs-sm-gsi{display:flex;justify-content:center}' +
    '.rs-sm-gsi:empty{display:none}' +
    '.rs-sm-o{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;margin:0;padding:12px 16px;font:600 15px Inter,"Helvetica Neue",Arial,sans-serif;border:1px solid #d9e0e8;border-radius:0;background:#fff;color:#0f1a2b;cursor:pointer;box-shadow:none;transition:border-color .15s}' +
    '.rs-sm-o:hover:not(:disabled){border-color:#0f1a2b;background:#fff;color:#0f1a2b}' +
    '.rs-sm-o:disabled{opacity:.55;cursor:wait}' +
    '.rs-sm-o svg{width:18px;height:18px;flex:none}' +
    '.rs-sm-or{display:flex;align-items:center;gap:12px;margin:18px 0;font-size:12.5px;color:#6b7684}' +
    '.rs-sm-or::before,.rs-sm-or::after{content:"";flex:1;height:1px;background:#e6ebf0}' +
    '.rs-sm-form{margin:0}' +
    '.rs-sm-form label{display:block;margin:0 0 6px;padding:0;font-size:13px;font-weight:600;color:#0f1a2b}' +
    '.rs-sm-form input[type=email]{display:block;width:100%;height:auto;margin:0;padding:11px 12px;font:15px Inter,"Helvetica Neue",Arial,sans-serif;border:1px solid #d9e0e8;border-radius:0;outline:0;background:#fff;color:#0f1a2b;box-shadow:none}' +
    '.rs-sm-form input[type=email]:focus{border-color:#1f7a55;box-shadow:none}' +
    '.rs-sm-opt{display:flex!important;gap:9px;align-items:flex-start;margin:12px 0 0!important;font-size:13px!important;font-weight:400!important;line-height:1.45;color:#3a4757!important;cursor:pointer}' +
    '.rs-sm-opt input{width:15px;height:15px;margin:3px 0 0;flex:none}' +
    '.rs-sm-m{display:block;width:100%;margin:12px 0 0;padding:13px 16px;font:600 15px Inter,"Helvetica Neue",Arial,sans-serif;background:#1f7a55;color:#fff;border:0;border-radius:0;cursor:pointer;box-shadow:none}' +
    '.rs-sm-m:hover:not(:disabled){background:#155c40;color:#fff}' +
    '.rs-sm-m:disabled{opacity:.6;cursor:wait}' +
    '.rs-sm-msg{margin:14px 0 0;padding:10px 12px;font-size:14px;line-height:1.45;border:1px solid #cfe3d8;background:#eef7f2;color:#0f1a2b}' +
    '.rs-sm-msg[hidden]{display:none}' +
    '.rs-sm-msg.rs-sm-err{border-color:#e6c3c3;background:#fbf0f0;color:#7a1f1f}' +
    '.rs-sm-fine{margin:16px 0 0;padding:0;font-size:12.5px;line-height:1.5;color:#6b7684;text-align:center}' +
    '.rs-sm-fine a{color:#3a4757;text-decoration:underline}' +
    'html.rs-sm-lock{overflow:hidden}' +
    '@media(max-width:480px){.rs-sm{padding:12px}.rs-sm-card{padding:26px 22px 20px}}' +
    'html.dark .rs-sm-card{background:#151920;color:#e8eaee;border-color:#2a2f38}' +
    'html.dark .rs-sm-x{color:#9aa0ab}html.dark .rs-sm-x:hover{color:#e8eaee}' +
    'html.dark .rs-sm-brand,html.dark .rs-sm-card h2,html.dark .rs-sm-form label{color:#e8eaee}' +
    'html.dark .rs-sm-sub,html.dark .rs-sm-fine,html.dark .rs-sm-fine a{color:#b0b5bf}' +
    'html.dark .rs-sm-o,html.dark .rs-sm-o:hover:not(:disabled){background:#1a1d22;border-color:#2a2f38;color:#e8eaee}' +
    'html.dark .rs-sm-o:hover:not(:disabled){border-color:#b0b5bf}' +
    'html.dark .rs-sm-o svg path[fill="#181717"]{fill:#e8eaee}' +
    'html.dark .rs-sm-or{color:#8a909b}html.dark .rs-sm-or::before,html.dark .rs-sm-or::after{background:#2a2f38}' +
    'html.dark .rs-sm-form input[type=email]{background:#0e0f12;border-color:#2a2f38;color:#e8eaee}' +
    'html.dark .rs-sm-opt{color:#b0b5bf!important}' +
    'html.dark .rs-sm-msg{background:#13221b;border-color:#1f4a35;color:#dfe8e2}' +
    'html.dark .rs-sm-msg.rs-sm-err{background:#2a1616;border-color:#5a2424;color:#f1caca}';

  var GOOGLE_SVG = '<svg viewBox="0 0 18 18" aria-hidden="true"><path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/><path fill="#34A853" d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.97 10.72A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33z"/><path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58A9 9 0 0 0 9 0 9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"/></svg>';
  var GITHUB_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="#181717"><path d="M12 .3a12 12 0 0 0-3.8 23.38c.6.1.83-.26.83-.58v-2c-3.34.72-4.04-1.6-4.04-1.6-.55-1.4-1.34-1.77-1.34-1.77-1.08-.74.09-.72.09-.72 1.2.08 1.83 1.24 1.83 1.24 1.08 1.83 2.81 1.3 3.5 1 .1-.78.42-1.3.76-1.6-2.66-.3-5.47-1.34-5.47-5.95 0-1.32.47-2.4 1.24-3.24-.13-.3-.54-1.52.1-3.17 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.66 1.65.24 2.87.12 3.17a4.7 4.7 0 0 1 1.24 3.24c0 4.62-2.82 5.64-5.5 5.94.43.37.81 1.1.81 2.22v3.3c0 .32.21.7.83.58A12 12 0 0 0 12 .3"/></svg>';

  var root = null, card = null, msgEl = null, lastFocus = null, hideTimer = null;
  var state = { next: '/', trigger: '', src: '' };
  var ready = null, supa = null, cfg = null, gisTried = false;

  function safePath(p) {
    return (typeof p === 'string' && p.charAt(0) === '/' && p.charAt(1) !== '/') ? p : null;
  }
  function currentPath() { return location.pathname + location.search + location.hash; }
  // Same vocabulary as signin.html's signupSource() so the admin email and
  // the signup-context KV read identically whichever surface signed them up.
  function inferTrigger(next) {
    if (!next) return 'direct';
    if (next.indexOf('/dashboard.html') === 0) return 'start-free';
    if (next.indexOf('/pricing.html') === 0) return 'enroll';
    return 'content-gate';
  }
  function callbackUrl() {
    var u = new URL('/signin.html', location.origin);
    u.searchParams.set('next', state.next);
    if (state.src) u.searchParams.set('src', state.src);
    if (state.trigger) u.searchParams.set('trig', state.trigger);
    return u.toString();
  }
  function source() {
    return { signup_page: state.src, signup_trigger: state.trigger, signup_next: state.next };
  }
  function parkSource() {
    try { localStorage.setItem('rsc-signup-src', JSON.stringify(Object.assign({ ts: Date.now() }, source()))); } catch (e) {}
  }
  // Mirrors signin.html: post the parked attribution the moment a session
  // exists, before leaving the page (keepalive outlives the navigation).
  function postSignupContextNow(session) {
    try {
      var raw = localStorage.getItem('rsc-signup-src');
      if (!raw || !session || !session.access_token) return Promise.resolve();
      var src = JSON.parse(raw);
      if (!src || !src.ts || (Date.now() - src.ts) > 3600000) { localStorage.removeItem('rsc-signup-src'); return Promise.resolve(); }
      return fetch('/api/me/signup-context', {
        method: 'POST', keepalive: true,
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + session.access_token },
        body: JSON.stringify({ page: src.signup_page || '', trigger: src.signup_trigger || '', next: src.signup_next || '' })
      }).then(function (r) { if (r && r.ok) { try { localStorage.removeItem('rsc-signup-src'); } catch (e) {} } }).catch(function () {});
    } catch (e) { return Promise.resolve(); }
  }
  function wantsNewsletter() {
    var c = card && card.querySelector('#rs-sm-optin');
    return !!(c && c.checked);
  }
  function recordOptin() {
    try { localStorage.setItem('rs-marketing-optin', JSON.stringify({ opted_in: true, source: 'signin-modal', at: new Date().toISOString() })); } catch (e) {}
  }
  function track(name) {
    try { if (window.gtag) window.gtag('event', name, { trigger: state.trigger, page_path: location.pathname, next: state.next }); } catch (e) {}
  }

  function load() {
    if (ready) return ready;
    ready = Promise.all([
      fetch('/api/_auth-config').then(function (r) { if (!r.ok) throw new Error('auth config ' + r.status); return r.json(); }),
      import(SUPA_URL)
    ]).then(function (res) {
      cfg = res[0];
      supa = res[1].createClient(cfg.url, cfg.anonKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, flowType: 'implicit' }
      });
      return supa;
    });
    ready.catch(function () { ready = null; });
    return ready;
  }

  function showMsg(kind, text) {
    if (!msgEl) return;
    msgEl.textContent = text;
    msgEl.className = 'rs-sm-msg' + (kind === 'error' ? ' rs-sm-err' : '');
    msgEl.hidden = false;
  }
  function hideMsg() { if (msgEl) { msgEl.hidden = true; msgEl.textContent = ''; } }

  function build() {
    var style = document.createElement('style');
    style.setAttribute('data-signin-modal', '1');
    style.textContent = CSS;
    document.head.appendChild(style);

    root = document.createElement('div');
    root.className = 'rs-sm';
    root.hidden = true;
    root.innerHTML =
      '<div class="rs-sm-card" role="dialog" aria-modal="true" aria-labelledby="rs-sm-title">' +
        '<button class="rs-sm-x" type="button" aria-label="Close">&times;</button>' +
        '<div class="rs-sm-brand"><span class="rs-sm-mark">R</span>r-statistics.co</div>' +
        '<h2 id="rs-sm-title">Sign in</h2>' +
        '<p class="rs-sm-sub">Magic link, Google, or GitHub. No password needed. You stay right here, and your progress is kept.</p>' +
        '<div class="rs-sm-oauth">' +
          '<button class="rs-sm-o" type="button" data-rs-provider="google">' + GOOGLE_SVG + '<span>Continue with Google</span></button>' +
          '<button class="rs-sm-o" type="button" data-rs-provider="github">' + GITHUB_SVG + '<span>Continue with GitHub</span></button>' +
        '</div>' +
        '<div class="rs-sm-or">or with email</div>' +
        '<form class="rs-sm-form">' +
          '<label for="rs-sm-email">Email address</label>' +
          '<input id="rs-sm-email" type="email" name="email" autocomplete="email" required placeholder="you@example.com">' +
          '<label class="rs-sm-opt"><input type="checkbox" id="rs-sm-optin"><span>Send me R tips &amp; updates</span></label>' +
          '<button class="rs-sm-m" type="submit"><span>Send magic link</span></button>' +
        '</form>' +
        '<div class="rs-sm-msg" role="alert" hidden></div>' +
        '<p class="rs-sm-fine">By signing in you agree to our <a href="/terms-of-service.html">Terms</a> and <a href="/privacy.html">Privacy Policy</a>.</p>' +
      '</div>';
    document.body.appendChild(root);
    card = root.querySelector('.rs-sm-card');
    msgEl = root.querySelector('.rs-sm-msg');

    root.addEventListener('click', function (e) { if (e.target === root) close(); });
    root.querySelector('.rs-sm-x').addEventListener('click', close);
    root.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key !== 'Tab') return;
      var f = card.querySelectorAll('button:not(:disabled),input,a[href],[tabindex]:not([tabindex="-1"])');
      var items = [];
      for (var i = 0; i < f.length; i++) if (f[i].offsetParent !== null) items.push(f[i]);
      if (!items.length) return;
      var first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    var btns = card.querySelectorAll('[data-rs-provider]');
    for (var i = 0; i < btns.length; i++) {
      (function (b) { b.addEventListener('click', function () { oauth(b, b.getAttribute('data-rs-provider')); }); })(btns[i]);
    }
    card.querySelector('.rs-sm-form').addEventListener('submit', magic);
  }

  function oauth(btn, provider) {
    var span = btn.querySelector('span'), orig = span.textContent;
    hideMsg();
    if (wantsNewsletter()) recordOptin();
    parkSource();
    btn.disabled = true; span.textContent = 'Redirecting...';
    load().then(function (s) {
      return s.auth.signInWithOAuth({ provider: provider, options: { redirectTo: callbackUrl() } });
    }).then(function (r) {
      if (r && r.error) throw r.error;
    }).catch(function (e) {
      showMsg('error', (e && e.message) || 'Could not start sign-in. Try again.');
      btn.disabled = false; span.textContent = orig;
    });
  }

  // White-label Google (GIS + signInWithIdToken), exactly as signin.html does
  // it: Google's own button replaces the OAuth button only once it renders.
  function mountGoogle() {
    if (gisTried) return;
    gisTried = true;
    load().then(function (s) {
      if (!cfg || !cfg.googleClientId || !window.rsGoogleOneTap) return;
      var gbtn = card.querySelector('[data-rs-provider="google"]');
      if (!gbtn) return;
      var holder = document.createElement('div');
      holder.className = 'rs-sm-gsi';
      gbtn.parentNode.insertBefore(holder, gbtn);
      var w = Math.max(200, Math.min(400, Math.round(gbtn.getBoundingClientRect().width) || 376));
      return window.rsGoogleOneTap.mount({
        clientId: cfg.googleClientId,
        container: holder,
        buttonWidth: w,
        getSupabase: function () { return Promise.resolve(s); },
        onBeforeSignIn: function () { if (wantsNewsletter()) recordOptin(); parkSource(); },
        onSuccess: function () {
          track('signin_modal_success');
          s.auth.getSession().then(function (r) {
            return postSignupContextNow(r && r.data && r.data.session);
          }).catch(function () {}).then(function () {
            location.assign('/email-optin.html?next=' + encodeURIComponent(state.next));
          });
        },
        onError: function (m) { showMsg('error', m || 'Google sign-in did not complete. Try another method.'); }
      }).then(function (ok) {
        if (ok) gbtn.style.display = 'none'; else holder.remove();
      });
    }).catch(function () { gisTried = false; });
  }

  function magic(e) {
    e.preventDefault();
    var input = card.querySelector('#rs-sm-email'), btn = card.querySelector('.rs-sm-m'), span = btn.querySelector('span');
    var email = (input.value || '').trim();
    if (!email) { input.focus(); return; }
    hideMsg();
    btn.disabled = true; span.textContent = 'Sending...';
    var data = source();
    if (wantsNewsletter()) {
      recordOptin();
      data.marketing_opt_in = true;
      data.marketing_opt_in_source = 'signin-modal';
      data.marketing_opt_in_at = new Date().toISOString();
    }
    load().then(function (s) {
      return s.auth.signInWithOtp({ email: email, options: { emailRedirectTo: callbackUrl(), data: data } });
    }).then(function (r) {
      if (r && r.error) throw r.error;
      track('signin_modal_magic_sent');
      showMsg('success', 'Check your inbox. The link is good for 60 minutes and brings you straight back here.');
      input.value = '';
    }).catch(function (e2) {
      showMsg('error', (e2 && e2.message) || 'Could not send the link. Try again.');
    }).then(function () {
      btn.disabled = false; span.textContent = 'Send magic link';
    });
  }

  function open(opts) {
    opts = opts || {};
    if (!root) build();
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    var linkNext = safePath(opts.next);
    state.next = linkNext || currentPath();
    state.src = safePath(opts.src) || location.pathname;
    state.trigger = opts.trigger || inferTrigger(linkNext || '');
    lastFocus = document.activeElement;
    hideMsg();
    root.hidden = false;
    requestAnimationFrame(function () { root.classList.add('rs-sm-on'); });
    document.documentElement.classList.add('rs-sm-lock');
    var first = card.querySelector('.rs-sm-o');
    if (first) first.focus();
    load().catch(function () { showMsg('error', 'Could not reach the sign-in service. Try again in a moment.'); });
    mountGoogle();
    track('signin_modal_open');
  }

  function close() {
    if (!root || root.hidden) return;
    root.classList.remove('rs-sm-on');
    document.documentElement.classList.remove('rs-sm-lock');
    hideTimer = setTimeout(function () { root.hidden = true; hideTimer = null; }, 180);
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) {} }
  }

  // Intercept every same-origin sign-in link, including ones created later
  // by page scripts (exercise gates, lesson walls, persona menu). Modified
  // clicks, new-tab links and [data-no-modal] keep the normal navigation.
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var t = e.target;
    var a = (t && t.closest) ? t.closest('a[href]') : null;
    if (!a || a.hasAttribute('data-no-modal') || a.hasAttribute('download')) return;
    if (a.target && a.target !== '_self') return;
    var u;
    try { u = new URL(a.getAttribute('href'), location.href); } catch (err) { return; }
    if (u.origin !== location.origin) return;
    var p = u.pathname.replace(/\/$/, '');
    if (p !== '/signin.html' && p !== '/signin') return;
    e.preventDefault();
    var pm = a.closest('.pm-menu');           // persona dropdown: fold it away behind the modal
    if (pm) pm.classList.remove('pm-open');
    open({
      next: u.searchParams.get('next'),
      trigger: a.getAttribute('data-trig') || u.searchParams.get('trig'),
      src: u.searchParams.get('src')
    });
  }, true);

  window.rsSignin = { open: open, close: close };
})();
