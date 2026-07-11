// Sign-in nudge - a dependency-free, two-state prompt shown to logged-out
// readers, capturing signup/sign-in inline so they can save progress.
//
// Design (rebuilt 2026-07-06 for a minimal, premium look):
//   - Shows ONLY for anonymous visitors (body.state-anon, set by auth-hydrate).
//   - Two placements: a bottom-right slide-in toast (scroll/time trigger) and
//     a centered modal with a dimmed backdrop (2-opened-lessons trigger).
//   - Layout is deliberately spare: R-dot brand mark, a 3-word headline, one
//     supporting line, then the two OAuth buttons as the hero and email as the
//     quiet fallback. NO badge / benefit list / trust row (the earlier
//     text-heavy version tested poorly with the owner).
//   - Two states, toggled in place: SIGNUP ("Save your progress") <-> SIGNIN
//     ("Welcome back"). Both offer Google + GitHub (signInWithOAuth) and an
//     email magic link (signInWithOtp, shouldCreateUser:true - no dead-end for
//     never-registered emails). Google is white-labelled via GIS when available
//     (enhanceGoogleButton); the OAuth button is the fallback.
//   - Auth round-trip redirects to /signin.html?next=<current> because only
//     signin.html / account.html parse the token from the URL hash; tutorial
//     pages run auth-hydrate.js (localStorage-only). Mirrors signin.html.
//   - Dismissible; dismissal remembered 30 days. Suppressed on /signin,/account
//     and on lesson-mode pages (never interrupts an interactive lesson/quiz).
//   - Supabase client is lazy-imported on first submit, so it adds no
//     network/JS cost until the reader engages with it.
//
// Add to a page with <script defer src="/www/signin-nudge.js?v=2"></script>
// (wired into _build/template.html). Bump ?v=N when editing - /www/* is
// immutable-cached at the edge.

(function () {
  'use strict';

  var DISMISS_KEY = 'rs-signin-nudge-dismissed';
  var OPTIN_KEY = 'rs-marketing-optin';
  var DISMISS_DAYS = 30;
  // Relaxed again 2026-06-13 (owner: still fired too early). Was 40%/30s.
  // The scroll trigger is usually the early one (a fast scroller hits 40% in
  // seconds); raised to 60% and the timer to 45s. Tune against nudge_shown vs
  // nudge_dismissed rates in GA4.
  var SCROLL_TRIGGER_PCT = 60;
  var TIME_TRIGGER_MS = 45000;
  var SUPA_VERSION = '2.45.4';

  // ---- Bail-out gates (cheapest first) -------------------------------------

  var path = location.pathname.toLowerCase();
  if (path.indexOf('signin') !== -1 || path.indexOf('account') !== -1) return;

  try {
    var until = parseInt(localStorage.getItem(DISMISS_KEY) || '0', 10);
    if (until && Date.now() < until) return;
  } catch (_) {}

  // Whether the visitor is signed in. We trust auth-hydrate.js's body class as
  // the source of truth: it optimistically sets state-pro at first paint when a
  // Supabase token exists, then /api/me CORRECTS it to state-anon if that token
  // is invalid/expired. Since the nudge only fires after the engagement trigger
  // (10s / 20% scroll) - well after /api/me resolves - state-pro/state-anon is
  // authoritative by then. (Earlier versions bailed on raw token presence, which
  // wrongly suppressed the nudge for logged-out users holding a stale token.)
  function isSignedIn() {
    return document.body.classList.contains('state-pro');
  }

  // ---- Styles (light default + html.dark overrides) ------------------------

  var CSS =
    '.rs-nudge{position:fixed;right:20px;bottom:20px;z-index:1100;width:344px;max-width:calc(100vw - 32px);box-sizing:border-box;' +
    'background:#fff;color:#0e1117;border:1px solid #e7e9ef;border-radius:16px;' +
    "font-family:'IBM Plex Sans',-apple-system,Segoe UI,Roboto,sans-serif;font-size:14px;line-height:1.5;" +
    'box-shadow:0 2px 6px rgba(12,17,29,.05),0 20px 48px rgba(12,17,29,.16);padding:24px 24px 20px;' +
    'transform:translateY(140%);opacity:0;transition:transform .4s cubic-bezier(.22,1,.36,1),opacity .4s}' +
    '.rs-nudge.show{transform:translateY(0);opacity:1}' +
    '.rs-nudge-backdrop{position:fixed;inset:0;z-index:1098;background:rgba(12,15,22,.52);' +
    '-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);opacity:0;transition:opacity .32s ease}' +
    '.rs-nudge-backdrop.show{opacity:1}' +
    '.rs-nudge.center{right:auto;bottom:auto;top:50%;left:50%;width:372px;max-height:calc(100vh - 44px);overflow-y:auto;z-index:1101;' +
    'box-shadow:0 30px 70px rgba(12,15,22,.4);transform:translate(-50%,-48%) scale(.97);transition:transform .34s cubic-bezier(.22,1,.36,1),opacity .34s}' +
    '.rs-nudge.center.show{transform:translate(-50%,-50%) scale(1)}' +
    '.rs-nudge-x{position:absolute;top:13px;right:13px;background:none;border:0;color:#b6bcc6;font-size:20px;line-height:1;cursor:pointer;padding:3px 7px;border-radius:7px;transition:color .15s,background .15s}' +
    '.rs-nudge-x:hover{color:#4b5260;background:#f1f3f6}' +
    '.rs-nudge-logo{display:inline-flex;align-items:baseline;justify-content:center;width:44px;height:44px;border-radius:12px;' +
    'background:linear-gradient(150deg,#f0f4fb,#eaf5ee);' +
    "font-family:'Inter Tight','IBM Plex Sans',sans-serif;font-weight:700;font-size:23px;color:#1b2a4a;letter-spacing:-.03em;margin:0 0 15px}" +
    '.rs-nudge-logo i{font-style:normal;color:#2fa565;margin-left:1px}' +
    '.rs-nudge-title{font-family:"Inter Tight","IBM Plex Sans",sans-serif;font-weight:700;font-size:20px;line-height:1.18;letter-spacing:-.02em;color:#0e1117;margin:0}' +
    '.rs-nudge-sub{font-size:13.5px;color:#5b6472;margin:7px 0 18px;line-height:1.5}' +
    '.rs-nudge-auth{display:flex;flex-direction:column;gap:9px}' +
    '.rs-nudge-oauth{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;box-sizing:border-box;height:46px;padding:0 16px;' +
    'border-radius:11px;font-family:inherit;font-size:14.5px;font-weight:600;cursor:pointer;background:#fff;color:#14161b;border:1.5px solid #e4e7ee;' +
    'transition:border-color .15s,background .15s,box-shadow .15s,transform .1s}' +
    '.rs-nudge-oauth:hover:not(:disabled){border-color:#cdd3de;background:#fafbfd;box-shadow:0 3px 10px rgba(14,17,23,.07)}' +
    '.rs-nudge-oauth:active:not(:disabled){transform:translateY(1px)}' +
    '.rs-nudge-oauth:disabled{opacity:.6;cursor:wait}' +
    '.rs-nudge-oauth svg{width:19px;height:19px;flex:0 0 auto}' +
    '.rs-nudge-oauth.gh{background:#18181b;color:#fff;border-color:#18181b}' +
    '.rs-nudge-oauth.gh:hover:not(:disabled){background:#000;border-color:#000;box-shadow:0 3px 12px rgba(0,0,0,.18)}' +
    '.rs-nudge-oauth.gh svg{fill:#fff;color:#fff}' +
    '.rs-nudge-or{display:flex;align-items:center;gap:12px;margin:15px 0;color:#9aa1ad;font-size:10.5px;font-weight:600;text-transform:uppercase;letter-spacing:.1em}' +
    '.rs-nudge-or::before,.rs-nudge-or::after{content:"";flex:1;height:1px;background:#eceef3}' +
    '.rs-nudge-gsi{display:flex;justify-content:center;min-height:46px}' +
    '.rs-nudge-row{display:flex;gap:8px}' +
    '.rs-nudge-email{flex:1;min-width:0;height:46px;padding:0 14px;border:1.5px solid #e4e7ee;border-radius:11px;font-family:inherit;font-size:14.5px;color:#14161b;background:#fff;transition:border-color .15s,box-shadow .15s}' +
    '.rs-nudge-email::placeholder{color:#a2a8b2}' +
    '.rs-nudge-email:focus{outline:none;border-color:#2563a8;box-shadow:0 0 0 3px rgba(37,99,168,.13)}' +
    '.rs-nudge-submit{flex:0 0 auto;width:46px;height:46px;display:flex;align-items:center;justify-content:center;background:#2563a8;color:#fff;border:0;border-radius:11px;cursor:pointer;transition:background .15s}' +
    '.rs-nudge-submit:hover:not(:disabled){background:#1d4f88}' +
    '.rs-nudge-submit:disabled{opacity:.65;cursor:wait}' +
    '.rs-nudge-submit svg{width:19px;height:19px}' +
    '.rs-nudge-foot{margin:16px 0 0;font-size:12.5px;color:#6b7280;text-align:center}' +
    '.rs-nudge-foot a{color:#2563a8;font-weight:600;cursor:pointer;text-decoration:none}' +
    '.rs-nudge-foot a:hover{text-decoration:underline}' +
    '.rs-nudge-legal{margin:9px 0 0;font-size:10.5px;color:#a2a8b2;text-align:center;line-height:1.5}' +
    '.rs-nudge-legal a{color:#a2a8b2;text-decoration:underline}' +
    '.rs-nudge-msg{font-size:12.5px;padding:9px 11px;border-radius:9px;margin-top:12px;line-height:1.45;display:none}' +
    '.rs-nudge-msg.show{display:block}' +
    '.rs-nudge-msg.ok{background:#dff1e3;color:#137a3e;border:1px solid #b8e0c5}' +
    '.rs-nudge-msg.err{background:#fbe2e2;color:#9a1f1f;border:1px solid #f0b4b4}' +
    '.rs-nudge-spin{display:inline-block;width:14px;height:14px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:rs-nudge-spin .7s linear infinite}' +
    '@keyframes rs-nudge-spin{to{transform:rotate(360deg)}}' +
    'html.dark .rs-nudge{background:#12151b;color:#e6edf3;border-color:#262b33;box-shadow:0 2px 6px rgba(0,0,0,.4),0 24px 56px rgba(0,0,0,.55)}' +
    'html.dark .rs-nudge-logo{background:linear-gradient(150deg,#18202f,#152a20);color:#dfe7f5}' +
    'html.dark .rs-nudge-logo i{color:#4bd489}' +
    'html.dark .rs-nudge-title{color:#f0f3f7}' +
    'html.dark .rs-nudge-sub{color:#9aa4b2}' +
    'html.dark .rs-nudge-x:hover{background:#1f242c;color:#e6edf3}' +
    'html.dark .rs-nudge-oauth{background:#1a1e25;color:#e6edf3;border-color:#2d333b}' +
    'html.dark .rs-nudge-oauth:hover:not(:disabled){background:#21262d;border-color:#3d444d}' +
    'html.dark .rs-nudge-oauth.gh{background:#e6edf3;color:#18181b;border-color:#e6edf3}' +
    'html.dark .rs-nudge-oauth.gh:hover:not(:disabled){background:#fff;border-color:#fff}' +
    'html.dark .rs-nudge-oauth.gh svg{fill:#18181b;color:#18181b}' +
    'html.dark .rs-nudge-or{color:#6b7280}html.dark .rs-nudge-or::before,html.dark .rs-nudge-or::after{background:#262b33}' +
    'html.dark .rs-nudge-email{background:#0d1117;border-color:#30363d;color:#e6edf3}' +
    'html.dark .rs-nudge-email::placeholder{color:#6b7280}' +
    'html.dark .rs-nudge-foot{color:#9aa4b2}' +
    'html.dark .rs-nudge-legal{color:#6b7280}html.dark .rs-nudge-legal a{color:#6b7280}' +
    '@media (prefers-reduced-motion:reduce){.rs-nudge{transition:opacity .2s}.rs-nudge.show{transform:none}.rs-nudge.center{transition:opacity .2s;transform:translate(-50%,-50%)}.rs-nudge.center.show{transform:translate(-50%,-50%)}}' +
    '@media (max-width:480px){.rs-nudge{left:16px;right:16px;width:auto;bottom:16px}' +
    '.rs-nudge.center{width:auto;left:16px;right:16px;transform:translateY(-48%) scale(.98);padding:22px 20px 18px}' +
    '.rs-nudge.center.show{transform:translateY(-50%) scale(1)}}';

  // ---- Auth callback target + lazy Supabase client -------------------------

  var next = encodeURIComponent(location.pathname + location.search);
  var CALLBACK_URL = location.origin + '/signin.html?next=' + next;

  var cfgPromise = null;
  function getConfig() {
    if (!cfgPromise) {
      cfgPromise = (async function () {
        var resp = await fetch('/api/_auth-config');
        if (!resp.ok) throw new Error('config ' + resp.status);
        return await resp.json();
      })();
    }
    return cfgPromise;
  }

  var supaPromise = null;
  function getSupa() {
    if (!supaPromise) {
      supaPromise = (async function () {
        var cfg = await getConfig();
        var mod = await import('https://esm.sh/@supabase/supabase-js@' + SUPA_VERSION);
        return mod.createClient(cfg.url, cfg.anonKey, {
          auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'implicit' },
        });
      })();
    }
    return supaPromise;
  }

  // White-label Google (GIS + signInWithIdToken): replaces the OAuth Google
  // button with Google's own rendered button, whose consent screen has no
  // supabase.co line. Progressive enhancement, called after each render - the
  // OAuth button (data-google) stays as the fallback and is hidden only once
  // GIS actually renders. Loads GIS lazily (post-engagement, like the nudge).
  function enhanceGoogleButton(mode) {
    if (!window.rsGoogleOneTap || !el) return;
    var oauthBtn = el.querySelector('[data-google]');
    if (!oauthBtn) return;
    getConfig().then(function (cfg) {
      if (!cfg || !cfg.googleClientId || !el || !el.contains(oauthBtn)) return;
      var holder = document.createElement('div');
      holder.className = 'rs-nudge-gsi';
      oauthBtn.parentNode.insertBefore(holder, oauthBtn);
      var width = Math.round(oauthBtn.getBoundingClientRect().width) || 300;
      window.rsGoogleOneTap.mount({
        clientId: cfg.googleClientId,
        container: holder,
        getSupabase: getSupa,
        buttonWidth: width,
        onBeforeSignIn: function () {
          track('nudge_google_click', { mode: mode, method: 'gis' });
          var o = el && el.querySelector('[data-optin]');
          if (o && o.checked) recordOptinSignal();
        },
        onSuccess: function () { location.reload(); },
        onError: function (m) { if (el) msg('err', m); },
      }).then(function (ok) {
        if (ok) oauthBtn.style.display = 'none';
        else if (holder.parentNode) holder.parentNode.removeChild(holder);
      });
    }).catch(function () {});
  }

  // ---- Build + show --------------------------------------------------------

  var shown = false;
  var waitingForConsent = false;
  var el = null, backdrop = null, escHandler = null;

  // GA4 funnel events. gtag is the inline stub on every template page, so
  // events queue even before the GA library loads; no-op where GA is absent.
  function track(name, params) {
    try {
      if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
    } catch (_) {}
  }

  function dismiss() {
    track('nudge_dismissed');
    if (el) el.classList.remove('show');
    if (backdrop) backdrop.classList.remove('show');
    if (escHandler) { document.removeEventListener('keydown', escHandler); escHandler = null; }
    try { localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_DAYS * 864e5)); } catch (_) {}
    setTimeout(function () {
      if (el) { el.remove(); el = null; }
      if (backdrop) { backdrop.remove(); backdrop = null; }
    }, 400);
  }

  function msg(kind, text) {
    var m = el.querySelector('.rs-nudge-msg');
    m.className = 'rs-nudge-msg show ' + kind;
    m.textContent = text;
  }

  var GOOGLE_SVG = '<svg viewBox="0 0 18 18" aria-hidden="true"><path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/><path fill="#34A853" d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.97 10.72A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33z"/><path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58A9 9 0 0 0 9 0 9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"/></svg>';
  var GITHUB_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.05-.02-2.06-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.87.12 3.17.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.62-5.49 5.92.43.37.81 1.1.81 2.22 0 1.6-.01 2.9-.01 3.29 0 .32.22.7.83.58A12.01 12.01 0 0 0 24 12.5C24 5.87 18.63.5 12 .5z"/></svg>';
  var ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="4" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';

  // Minimal two-state render. mode = 'signup' | 'signin'. The two OAuth
  // buttons are the hero; email is the quiet fallback. No benefit list /
  // badge / trust row by design (the earlier text-heavy layout tested poorly).
  function render(mode) {
    var signup = mode === 'signup';
    var inner =
      '<button class="rs-nudge-x" type="button" aria-label="Close">&times;</button>' +
      '<span class="rs-nudge-logo" aria-hidden="true">R<i>.</i></span>' +
      '<h3 class="rs-nudge-title">' + (signup ? 'Save your progress' : 'Welcome back') + '</h3>' +
      '<p class="rs-nudge-sub">' + (signup
        ? 'Free account, so your lessons, XP and streak follow you on any device.'
        : 'Pick up right where you left off.') + '</p>' +
      '<div class="rs-nudge-auth">' +
        '<button class="rs-nudge-oauth" type="button" data-google>' + GOOGLE_SVG + '<span>Continue with Google</span></button>' +
        '<button class="rs-nudge-oauth gh" type="button" data-github>' + GITHUB_SVG + '<span>Continue with GitHub</span></button>' +
      '</div>' +
      '<div class="rs-nudge-or">or</div>' +
      '<form class="rs-nudge-form"><div class="rs-nudge-row">' +
        '<input class="rs-nudge-email" type="email" required autocomplete="email" placeholder="you@email.com" aria-label="Email address">' +
        '<button class="rs-nudge-submit" type="submit" aria-label="' + (signup ? 'Sign up with email' : 'Send sign-in link') + '">' + ARROW + '</button>' +
      '</div></form>' +
      '<p class="rs-nudge-foot">' + (signup
        ? 'Already have an account? <a data-to-signin>Sign in</a>'
        : 'New here? <a data-to-signup>Create a free account</a>') + '</p>' +
      (signup
        ? '<p class="rs-nudge-legal">By continuing you agree to our <a href="/terms-of-service.html">Terms</a> &amp; <a href="/privacy.html">Privacy</a>.</p>'
        : '') +
      '<div class="rs-nudge-msg" role="alert"></div>';

    el.innerHTML = inner;
    wire(mode);
    enhanceGoogleButton(mode);
  }

  function wire(mode) {
    el.querySelector('.rs-nudge-x').addEventListener('click', dismiss);

    var gbtn = el.querySelector('[data-google]');
    if (gbtn) gbtn.addEventListener('click', function () { doGoogle(mode); });

    var ghbtn = el.querySelector('[data-github]');
    if (ghbtn) ghbtn.addEventListener('click', function () { doGithub(mode); });

    var toSignin = el.querySelector('[data-to-signin]');
    if (toSignin) toSignin.addEventListener('click', function () { render('signin'); });
    var toSignup = el.querySelector('[data-to-signup]');
    if (toSignup) toSignup.addEventListener('click', function () { render('signup'); });

    el.querySelector('.rs-nudge-form').addEventListener('submit', function (e) {
      e.preventDefault();
      doMagicLink(mode);
    });
  }

  // Google one-click via Supabase hosted OAuth (identical mechanism to
  // signin.html). signInWithOAuth full-page-redirects to Google, then back to
  // CALLBACK_URL (/signin.html?next=...), which parses the session and forwards
  // to the originating page. Newsletter opt-in (if ticked) is stored to
  // localStorage and claimed post-auth by auth-hydrate -> /api/newsletter/claim-optin,
  // since OAuth can't carry user metadata.
  async function doGoogle(mode) {
    var gbtn = el.querySelector('[data-google]');
    var label = gbtn ? gbtn.querySelector('span') : null;
    var optin = el.querySelector('[data-optin]');
    if (optin && optin.checked) recordOptinSignal();
    track('nudge_google_click', { mode: mode });
    if (gbtn) { gbtn.disabled = true; if (label) label.textContent = 'Redirecting...'; }
    function reset() {
      if (gbtn) { gbtn.disabled = false; if (label) label.textContent = 'Continue with Google'; }
    }
    try {
      var supa = await getSupa();
      var res = await supa.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: CALLBACK_URL },
      });
      // On success the browser is already navigating to Google; only errors
      // return control here.
      if (res.error) {
        reset();
        track('nudge_error', { mode: mode, reason: String(res.error.message || 'oauth_error').slice(0, 80) });
        msg('err', res.error.message || 'Could not start Google sign-in. Try again.');
      }
    } catch (err) {
      reset();
      track('nudge_error', { mode: mode, reason: String((err && err.message) || 'exception').slice(0, 80) });
      msg('err', (err && err.message) || 'Something went wrong. Try again.');
    }
  }

  // GitHub one-click via Supabase hosted OAuth (identical mechanism to Google).
  async function doGithub(mode) {
    var btn = el.querySelector('[data-github]');
    var label = btn ? btn.querySelector('span') : null;
    var optin = el.querySelector('[data-optin]');
    if (optin && optin.checked) recordOptinSignal();
    track('nudge_github_click', { mode: mode });
    if (btn) { btn.disabled = true; if (label) label.textContent = 'Redirecting...'; }
    function reset() { if (btn) { btn.disabled = false; if (label) label.textContent = 'Continue with GitHub'; } }
    try {
      var supa = await getSupa();
      var res = await supa.auth.signInWithOAuth({ provider: 'github', options: { redirectTo: CALLBACK_URL } });
      if (res.error) {
        reset();
        track('nudge_error', { mode: mode, reason: String(res.error.message || 'oauth_error').slice(0, 80) });
        msg('err', res.error.message || 'Could not start GitHub sign-in. Try again.');
      }
    } catch (err) {
      reset();
      track('nudge_error', { mode: mode, reason: String((err && err.message) || 'exception').slice(0, 80) });
      msg('err', (err && err.message) || 'Could not start GitHub sign-in. Try again.');
    }
  }

  function recordOptinSignal() {
    // Audit signal for Phase 6 (Zoho sync); also passed as Supabase metadata
    // on the email path. Unticked default; only written when the user opts in.
    try {
      localStorage.setItem(OPTIN_KEY, JSON.stringify({
        opted_in: true, source: 'signin-nudge', at: new Date().toISOString(),
      }));
    } catch (_) {}
  }

  async function doMagicLink(mode) {
    var input = el.querySelector('.rs-nudge-email');
    var btn = el.querySelector('.rs-nudge-submit');
    var email = input.value.trim();
    if (!email) return;
    var optin = el.querySelector('[data-optin]');
    var wantsNewsletter = !!(optin && optin.checked);
    track('nudge_email_submitted', { mode: mode, newsletter_opt_in: wantsNewsletter });
    if (wantsNewsletter) recordOptinSignal();

    var orig = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="rs-nudge-spin"></span>';
    try {
      var supa = await getSupa();
      var opts = { emailRedirectTo: CALLBACK_URL, shouldCreateUser: true };
      if (wantsNewsletter) {
        opts.data = {
          marketing_opt_in: true,
          marketing_opt_in_source: 'signin-nudge',
          marketing_opt_in_at: new Date().toISOString(),
        };
      }
      var res = await supa.auth.signInWithOtp({ email: email, options: opts });
      btn.disabled = false;
      btn.innerHTML = orig;
      if (res.error) {
        track('nudge_error', { mode: mode, reason: String(res.error.message || 'otp_error').slice(0, 80) });
        msg('err', res.error.message || 'Could not send link. Try again.');
      } else {
        track('nudge_magic_link_sent', { mode: mode, newsletter_opt_in: wantsNewsletter });
        msg('ok', 'Check your inbox. The link is good for 60 minutes; you can close this tab.');
        input.value = '';
      }
    } catch (err) {
      btn.disabled = false;
      btn.innerHTML = orig;
      track('nudge_error', { mode: mode, reason: String((err && err.message) || 'exception').slice(0, 80) });
      msg('err', (err && err.message) || 'Something went wrong. Try again.');
    }
  }

  function show(centered) {
    if (shown) return;
    // Never nudge inside an interactive lesson / quiz / roadmap player - it would
    // interrupt the learning flow. body.lesson-mode marks every such page.
    if (document.body.classList.contains('lesson-mode')) return;
    if (isSignedIn()) return; // authoritative by now (post /api/me hydration)
    // Cookie consent banner (#rs-cc, EU/UK first visit) owns the bottom of the
    // viewport; both fixed-bottom elements overlap on mobile. Defer the nudge
    // until the visitor resolves the banner; give up after 60s.
    if (document.getElementById('rs-cc')) {
      if (waitingForConsent) return; // one poller; scroll can re-trigger show()
      waitingForConsent = true;
      var waited = 0;
      var wait = setInterval(function () {
        waited += 1000;
        if (!document.getElementById('rs-cc')) { clearInterval(wait); waitingForConsent = false; show(); }
        else if (waited >= 60000) { clearInterval(wait); waitingForConsent = false; }
      }, 1000);
      return;
    }
    shown = true;
    teardownTriggers();

    var style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    if (centered) {
      // dimmed backdrop behind a centered modal (2-opened-lessons trigger)
      backdrop = document.createElement('div');
      backdrop.className = 'rs-nudge-backdrop';
      backdrop.addEventListener('click', dismiss);
      document.body.appendChild(backdrop);
      escHandler = function (e) { if (e.key === 'Escape' || e.keyCode === 27) dismiss(); };
      document.addEventListener('keydown', escHandler);
    }

    el = document.createElement('div');
    el.className = 'rs-nudge' + (centered ? ' center' : '');
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', centered ? 'true' : 'false');
    el.setAttribute('aria-label', 'Save your progress by signing in');
    document.body.appendChild(el);
    render('signup');

    void el.offsetWidth; // reflow so the transition runs
    el.classList.add('show');
    if (backdrop) backdrop.classList.add('show');
    track('nudge_shown', { placement: centered ? 'center' : 'corner' });
  }

  // ---- Engagement triggers: SCROLL_TRIGGER_PCT scroll OR TIME_TRIGGER_MS --

  function scrolledEnough() {
    var doc = document.documentElement;
    var scrollable = doc.scrollHeight - window.innerHeight;
    if (scrollable <= 0) return false;
    return (window.scrollY / scrollable) * 100 >= SCROLL_TRIGGER_PCT;
  }
  function onScroll() { if (scrolledEnough()) show(); }

  var timer = setTimeout(show, TIME_TRIGGER_MS);
  function teardownTriggers() {
    clearTimeout(timer);
    window.removeEventListener('scroll', onScroll);
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  // Centered-modal trigger, retuned 2026-07-12 (owner: it fired the moment a
  // visitor clicked ANY link once 2 lifetime pages were visited - GA engagement
  // dropped). New rule: only from the 3rd page of THIS SESSION onwards, and only
  // after a 10s dwell so it never lands the instant a page paints. Lifetime
  // >=2 opened pages still required (proves there is progress worth saving).
  // Once per session; dismissal still backs off 30 days (DISMISS_KEY gate at top).
  (function () {
    try {
      var pv = 0;
      try {
        pv = parseInt(sessionStorage.getItem('rs-nudge-pv') || '0', 10) + 1;
        sessionStorage.setItem('rs-nudge-pv', String(pv));
      } catch (_) {}
      var v = JSON.parse(localStorage.getItem('rstat_visited') || '{}');
      var s = JSON.parse(localStorage.getItem('rstat_started') || '{}');
      var n = Object.keys(v).length;
      for (var k in s) { if (!v[k]) n++; }
      if (pv >= 3 && n >= 2 && !sessionStorage.getItem('rs-nudge-center-seen')) {
        try { sessionStorage.setItem('rs-nudge-center-seen', '1'); } catch (_) {}
        setTimeout(function () { show(true); }, 10000);
      }
    } catch (e) {}
  })();
})();
