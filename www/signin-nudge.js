// Sign-in nudge — a dependency-free, two-state slide-in toast shown to
// logged-out readers, capturing signup/sign-in inline (email magic link)
// so they can save posts and resume progress.
//
// Behaviour (locked with Selva 2026-06-11):
//   - Shows ONLY for anonymous visitors (body.state-anon, set by auth-hydrate).
//   - Triggers for ENGAGED readers: after ~40% scroll OR ~20s, whichever first.
//   - Two states, toggled in place:
//       SIGNUP   "Save your progress across devices" — email magic link +
//                unticked R-newsletter opt-in.  -> "Already have an account?"
//       SIGNIN   "Welcome back!" — email only.     -> "New here? Sign up free"
//   - Passwordless: both states call signInWithOtp with shouldCreateUser:true
//     (no dead-end for typo'd / never-registered emails).
//   - Email-only by design: Google/GitHub OAuth is deliberately NOT offered
//     here. Its consent screen still shows the supabase.co URL (white-label
//     via signInWithIdToken is pending), which is too jarring for a mid-read
//     nudge. OAuth stays on the full /signin.html page; add back here once
//     the white-label ships.
//   - Auth round-trip redirects to /signin.html?next=<current> because only
//     signin.html / account.html parse the token from the URL hash; tutorial
//     pages run auth-hydrate.js (localStorage-only). Mirrors signin.html.
//   - Dismissible; dismissal remembered 30 days. Suppressed on /signin,/account.
//   - Supabase client is lazy-imported on first submit, so the toast adds no
//     network/JS cost until the reader engages with it.
//
// Newsletter opt-in is captured here (unticked) but the full Zoho sync +
// audit plumbing is Phase 6 — for now consent is recorded into Supabase user
// metadata (email path) and localStorage 'rs-marketing-optin' as an audit
// signal for Phase 6 to consume.
//
// Add to a page with <script defer src="/www/signin-nudge.js?v=2"></script>
// (wired into _build/template.html). Bump ?v=N when editing — /www/* is
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
  // (10s / 20% scroll) — well after /api/me resolves — state-pro/state-anon is
  // authoritative by then. (Earlier versions bailed on raw token presence, which
  // wrongly suppressed the nudge for logged-out users holding a stale token.)
  function isSignedIn() {
    return document.body.classList.contains('state-pro');
  }

  // ---- Styles (light default + html.dark overrides) ------------------------

  var CSS =
    '.rs-nudge{position:fixed;right:20px;bottom:20px;z-index:1100;width:340px;max-width:calc(100vw - 32px);' +
    'background:#fff;color:#0a0d14;border:1px solid #d4d9e3;border-radius:13px;' +
    "font-family:'IBM Plex Sans',-apple-system,Segoe UI,Roboto,sans-serif;font-size:14px;line-height:1.5;" +
    'box-shadow:0 12px 32px rgba(10,13,20,.18);padding:18px 18px 15px;' +
    'transform:translateY(140%);opacity:0;transition:transform .35s cubic-bezier(.22,1,.36,1),opacity .35s}' +
    '.rs-nudge.show{transform:translateY(0);opacity:1}' +
    '.rs-nudge-backdrop{position:fixed;inset:0;z-index:1098;background:rgba(10,13,20,.5);opacity:0;transition:opacity .3s ease}' +
    '.rs-nudge-backdrop.show{opacity:1}' +
    '.rs-nudge.center{right:auto;bottom:auto;top:50%;left:50%;width:384px;max-height:calc(100vh - 44px);overflow-y:auto;z-index:1101;box-shadow:0 24px 64px rgba(10,13,20,.4);transform:translate(-50%,-46%) scale(.96);transition:transform .32s cubic-bezier(.22,1,.36,1),opacity .32s}' +
    '.rs-nudge.center.show{transform:translate(-50%,-50%) scale(1)}' +
    '.rs-nudge-head{display:flex;align-items:center;gap:9px;margin:0 0 4px;padding-right:20px}' +
    '.rs-nudge-ico{flex:0 0 auto;width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;' +
    'background:#e9efff;color:#2056d2;font-size:16px}' +
    '.rs-nudge-title{font-family:"IBM Plex Serif",Georgia,serif;font-weight:600;font-size:16.5px;margin:0;letter-spacing:-.01em}' +
    '.rs-nudge-body{font-size:13px;color:#4b5260;margin:2px 0 13px}' +
    '.rs-nudge-row{display:flex;gap:8px}' +
    '.rs-nudge-email{flex:1;min-width:0;padding:10px 12px;border:1px solid #d4d9e3;border-radius:7px;' +
    'font-family:inherit;font-size:14px;color:#0a0d14;background:#fff;transition:border-color .15s,box-shadow .15s}' +
    '.rs-nudge-email:focus{outline:none;border-color:#2056d2;box-shadow:0 0 0 3px #e9efff}' +
    '.rs-nudge-submit{flex:0 0 auto;background:#2056d2;color:#fff;border:0;border-radius:7px;font-family:inherit;' +
    'font-size:13.5px;font-weight:600;padding:0 16px;cursor:pointer;transition:background .15s}' +
    '.rs-nudge-submit:hover:not(:disabled){background:#1842a8}' +
    '.rs-nudge-submit:disabled{opacity:.6;cursor:wait}' +
    '.rs-nudge-optin{display:flex;align-items:flex-start;gap:7px;font-size:12.5px;color:#4b5260;margin:11px 0 0;cursor:pointer}' +
    '.rs-nudge-optin input{margin-top:2px;flex:0 0 auto;width:15px;height:15px;accent-color:#2056d2;cursor:pointer}' +
    '.rs-nudge-foot{margin:13px 0 0;font-size:12px;color:#6b7280}' +
    '.rs-nudge-foot a{color:#2056d2;cursor:pointer;text-decoration:none}' +
    '.rs-nudge-foot a:hover{text-decoration:underline}' +
    '.rs-nudge-legal{margin:11px 0 0;font-size:11px;color:#8a909c;line-height:1.45}' +
    '.rs-nudge-legal a{color:#8a909c;text-decoration:underline}' +
    '.rs-nudge-msg{font-size:12.5px;padding:9px 11px;border-radius:7px;margin-top:11px;line-height:1.45;display:none}' +
    '.rs-nudge-msg.show{display:block}' +
    '.rs-nudge-msg.ok{background:#dff1e3;color:#137a3e;border:1px solid #b8e0c5}' +
    '.rs-nudge-msg.err{background:#fbe2e2;color:#9a1f1f;border:1px solid #f0b4b4}' +
    '.rs-nudge-x{position:absolute;top:10px;right:11px;background:none;border:0;color:#b6bcc6;font-size:19px;' +
    'line-height:1;cursor:pointer;padding:2px 6px;border-radius:5px}' +
    '.rs-nudge-x:hover{color:#4b5260;background:#f1f3f6}' +
    '.rs-nudge-spin{display:inline-block;width:12px;height:12px;border:2px solid currentColor;border-right-color:transparent;' +
    'border-radius:50%;animation:rs-nudge-spin .7s linear infinite;vertical-align:-1px}' +
    '@keyframes rs-nudge-spin{to{transform:rotate(360deg)}}' +
    // Google one-click button + "or" divider
    '.rs-nudge-oauth{display:flex;align-items:center;justify-content:center;gap:9px;width:100%;box-sizing:border-box;' +
    'background:#fff;color:#0a0d14;border:1px solid #d4d9e3;border-radius:7px;font-family:inherit;font-size:13.5px;' +
    'font-weight:600;padding:10px 12px;cursor:pointer;transition:background .15s,border-color .15s}' +
    '.rs-nudge-oauth:hover:not(:disabled){background:#f6f8fc;border-color:#c2c9d6}' +
    '.rs-nudge-oauth:disabled{opacity:.6;cursor:wait}' +
    '.rs-nudge-oauth svg{width:17px;height:17px;flex:0 0 auto}' +
    '.rs-nudge-or{display:flex;align-items:center;gap:10px;margin:10px 0;color:#8a909c;font-size:11.5px}' +
    '.rs-nudge-or::before,.rs-nudge-or::after{content:"";flex:1;height:1px;background:#e4e8ef}' +
    '.rs-nudge-gsi{display:flex;justify-content:center;min-height:40px}' +
    // dark theme
    'html.dark .rs-nudge{background:#161b22;color:#e6edf3;border-color:#262a31;box-shadow:0 12px 32px rgba(0,0,0,.55)}' +
    'html.dark .rs-nudge-ico{background:#1f2b46;color:#7aa2ff}' +
    'html.dark .rs-nudge-body{color:#9aa4b2}' +
    'html.dark .rs-nudge-email{background:#0d1117;border-color:#30363d;color:#e6edf3}' +
    'html.dark .rs-nudge-optin,html.dark .rs-nudge-foot{color:#9aa4b2}' +
    'html.dark .rs-nudge-x:hover{background:#1f242c;color:#e6edf3}' +
    'html.dark .rs-nudge-oauth{background:#0d1117;color:#e6edf3;border-color:#30363d}' +
    'html.dark .rs-nudge-oauth:hover:not(:disabled){background:#161b22;border-color:#3d444d}' +
    'html.dark .rs-nudge-or{color:#6b7280}' +
    'html.dark .rs-nudge-or::before,html.dark .rs-nudge-or::after{background:#262a31}' +
    '@media (prefers-reduced-motion:reduce){.rs-nudge{transition:opacity .2s}.rs-nudge.show{transform:none}.rs-nudge.center{transition:opacity .2s;transform:translate(-50%,-50%)}.rs-nudge.center.show{transform:translate(-50%,-50%)}}' +
    '.rs-nudge{padding:18px 19px 15px}' +
    '.rs-nudge-badge{display:inline-flex;align-items:center;gap:5px;font-family:"JetBrains Mono",ui-monospace,monospace;font-size:9.5px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:#137a3e;background:#e7f3ea;border-radius:999px;padding:4px 10px 4px 8px;margin:1px 0 11px}' +
    '.rs-nudge-badge svg{width:11px;height:11px}' +
    '.rs-nudge-title{font-size:18.5px;line-height:1.2;letter-spacing:-.015em;color:#0a0d14}' +
    '.rs-nudge-body{font-size:13px;margin:6px 0 12px;color:#4b5260}' +
    '.rs-nudge-benefits{list-style:none;margin:0 0 13px;padding:0;display:flex;flex-direction:column;gap:7px}' +
    '.rs-nudge-benefit{display:flex;align-items:flex-start;gap:9px;font-size:12.5px;color:#3a4048;line-height:1.38}' +
    '.rs-nudge-benefit>svg{flex:0 0 auto;width:17px;height:17px;margin-top:1px;color:#178a4e}' +
    '.rs-nudge-benefit b{font-weight:600;color:#14161b}' +
    '.rs-nudge-auth{display:flex;flex-direction:column;gap:8px}' +
    '.rs-nudge-oauth{padding:11px 14px;border-radius:9px;font-size:14px}' +
    '.rs-nudge-oauth.gh{background:#1f2328;color:#fff;border-color:#1f2328}' +
    '.rs-nudge-oauth.gh:hover:not(:disabled){background:#0d1117;border-color:#0d1117}' +
    '.rs-nudge-oauth.gh svg{color:#fff;fill:#fff}' +
    '.rs-nudge-email{border-radius:9px}.rs-nudge-submit{border-radius:9px}' +
    '.rs-nudge-trust{display:flex;align-items:center;flex-wrap:wrap;gap:4px 13px;margin:11px 0 0;font-size:11px;color:#5b6270;font-weight:500}' +
    '.rs-nudge-trust span{display:inline-flex;align-items:center;gap:4px}' +
    '.rs-nudge-trust svg{width:12px;height:12px;color:#178a4e}' +
    'html.dark .rs-nudge-title{color:#e6edf3}' +
    'html.dark .rs-nudge-badge{background:#0e2a1c;color:#7ee8a0}' +
    'html.dark .rs-nudge-benefit{color:#c9d1d9}html.dark .rs-nudge-benefit b{color:#fff}' +
    'html.dark .rs-nudge-oauth.gh{background:#21262d;border-color:#30363d}html.dark .rs-nudge-oauth.gh:hover:not(:disabled){background:#30363d;border-color:#3d444d}' +
    'html.dark .rs-nudge-trust{color:#8a909c}' +
    '@media (max-width:480px){.rs-nudge{left:16px;right:16px;width:auto}.rs-nudge.center{width:auto;left:16px;right:16px;transform:translateY(-46%) scale(.97);padding:16px 17px 14px}.rs-nudge.center.show{transform:translateY(-50%) scale(1)}.rs-nudge-benefits{gap:6px}.rs-nudge-benefit{font-size:12px}}';

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
  // supabase.co line. Progressive enhancement, called after each render — the
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

  var CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>';
  var GOOGLE_SVG = '<svg viewBox="0 0 18 18" aria-hidden="true"><path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/><path fill="#34A853" d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.97 10.72A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33z"/><path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58A9 9 0 0 0 9 0 9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"/></svg>';
  var GITHUB_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.05-.02-2.06-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.87.12 3.17.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.62-5.49 5.92.43.37.81 1.1.81 2.22 0 1.6-.01 2.9-.01 3.29 0 .32.22.7.83.58A12.01 12.01 0 0 0 24 12.5C24 5.87 18.63.5 12 .5z"/></svg>';

  // Two-state render. mode = 'signup' | 'signin'.
  function render(mode) {
    var signup = mode === 'signup';
    var inner = '<button class="rs-nudge-x" type="button" aria-label="Close">&times;</button>';

    if (signup) {
      inner +=
        '<span class="rs-nudge-badge">' + CHECK + 'Free account</span>' +
        '<h3 class="rs-nudge-title">Save your progress and keep what you earn</h3>' +
        '<p class="rs-nudge-body">You are getting into it. Create a free account so your work, XP and streak follow you on every device.</p>' +
        '<ul class="rs-nudge-benefits">' +
          '<li class="rs-nudge-benefit">' + CHECK + '<span><b>Pick up on any device</b> — your lessons and code stay saved</span></li>' +
          '<li class="rs-nudge-benefit">' + CHECK + '<span><b>Keep your XP and daily streak</b> as you go</span></li>' +
          '<li class="rs-nudge-benefit">' + CHECK + '<span><b>Auto-graded practice</b> with instant, step-by-step hints</span></li>' +
          '<li class="rs-nudge-benefit">' + CHECK + '<span><b>Earn a verifiable certificate</b> to share on LinkedIn</span></li>' +
        '</ul>';
    } else {
      inner +=
        '<div class="rs-nudge-head"><span class="rs-nudge-ico">&#128075;</span><h3 class="rs-nudge-title">Welcome back</h3></div>' +
        '<p class="rs-nudge-body">Sign in to pick up right where you left off — your progress, XP and streak are waiting.</p>';
    }

    // Social sign-in: Google + GitHub (same signInWithOAuth flow as signin.html).
    inner +=
      '<div class="rs-nudge-auth">' +
        '<button class="rs-nudge-oauth" type="button" data-google>' + GOOGLE_SVG + '<span>Continue with Google</span></button>' +
        '<button class="rs-nudge-oauth gh" type="button" data-github>' + GITHUB_SVG + '<span>Continue with GitHub</span></button>' +
      '</div>' +
      '<div class="rs-nudge-or">or</div>';

    inner +=
      '<form class="rs-nudge-form">' +
        '<div class="rs-nudge-row">' +
          '<input class="rs-nudge-email" type="email" required autocomplete="email" placeholder="you@email.com" aria-label="Email address">' +
          '<button class="rs-nudge-submit" type="submit">' + (signup ? 'Sign up' : 'Send link') + '</button>' +
        '</div>';
    if (signup) {
      inner +=
        '<label class="rs-nudge-optin"><input type="checkbox" data-optin>' +
        '<span>Send me R tips &amp; new lessons (optional)</span></label>';
    }
    inner += '</form>';

    if (signup) {
      inner +=
        '<div class="rs-nudge-trust">' +
          '<span>' + CHECK + 'Free forever</span>' +
          '<span>' + CHECK + 'No credit card</span>' +
          '<span>' + CHECK + 'Takes 20 seconds</span>' +
        '</div>';
    }

    inner +=
      '<p class="rs-nudge-foot">' +
        (signup
          ? 'Already have an account? <a data-to-signin>Sign in</a>'
          : 'New here? <a data-to-signup>Create a free account</a>') +
      '</p>' +
      (signup
        ? '<p class="rs-nudge-legal">By continuing you agree to our <a href="/terms-of-service.html">Terms</a> and <a href="/privacy.html">Privacy Policy</a>.</p>'
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

    var orig = btn.textContent;
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
      btn.textContent = orig;
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
      btn.textContent = orig;
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

  // 2-opened-lessons trigger: a reader who has already opened >=2 lessons is
  // clearly engaged (and about to lose that progress) — nudge right away instead
  // of waiting for the scroll/time engagement trigger. show() still self-guards
  // against signed-in users and a prior dismissal.
  (function () {
    try {
      var v = JSON.parse(localStorage.getItem('rstat_visited') || '{}');
      var s = JSON.parse(localStorage.getItem('rstat_started') || '{}');
      var n = Object.keys(v).length;
      for (var k in s) { if (!v[k]) n++; }
      // >=2 lessons opened -> a prominent centered modal, but only once per
      // session (so it does not reappear on every page nav; dismissal = 30 days).
      if (n >= 2 && !sessionStorage.getItem('rs-nudge-center-seen')) {
        try { sessionStorage.setItem('rs-nudge-center-seen', '1'); } catch (_) {}
        show(true);
      }
    } catch (e) {}
  })();
})();
