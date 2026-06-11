// Sign-in nudge — a dependency-free, two-state slide-in toast shown to
// logged-out readers, capturing signup/sign-in inline (magic link + Google)
// so they can save posts and resume progress.
//
// Behaviour (locked with Selva 2026-06-11):
//   - Shows ONLY for anonymous visitors (body.state-anon, no Supabase token).
//   - Triggers for ENGAGED readers: after ~40% scroll OR ~20s, whichever first.
//   - Two states, toggled in place:
//       SIGNUP   "Save your progress across devices" — email + Google +
//                unticked R-newsletter opt-in.  -> "Already have an account?"
//       SIGNIN   "Welcome back!" — email only.     -> "New here? Sign up free"
//   - Passwordless: both states call signInWithOtp with shouldCreateUser:true
//     (no dead-end for typo'd / never-registered emails). Google = OAuth.
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
  var SCROLL_TRIGGER_PCT = 40;
  var TIME_TRIGGER_MS = 20000;
  var SUPA_VERSION = '2.45.4';

  // ---- Bail-out gates (cheapest first) -------------------------------------

  var path = location.pathname.toLowerCase();
  if (path.indexOf('signin') !== -1 || path.indexOf('account') !== -1) return;

  try {
    var until = parseInt(localStorage.getItem(DISMISS_KEY) || '0', 10);
    if (until && Date.now() < until) return;
  } catch (_) {}

  function looksSignedIn() {
    if (document.body.classList.contains('state-pro')) return true;
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf('sb-') === 0 && k.indexOf('-auth-token') === k.length - 11) {
          var v = localStorage.getItem(k);
          if (v && v.length > 0) return true;
        }
      }
    } catch (_) {}
    return false;
  }
  if (looksSignedIn()) return;

  // ---- Styles (light default + html.dark overrides) ------------------------

  var CSS =
    '.rs-nudge{position:fixed;right:20px;bottom:20px;z-index:1100;width:340px;max-width:calc(100vw - 32px);' +
    'background:#fff;color:#0a0d14;border:1px solid #d4d9e3;border-radius:13px;' +
    "font-family:'IBM Plex Sans',-apple-system,Segoe UI,Roboto,sans-serif;font-size:14px;line-height:1.5;" +
    'box-shadow:0 12px 32px rgba(10,13,20,.18);padding:18px 18px 15px;' +
    'transform:translateY(140%);opacity:0;transition:transform .35s cubic-bezier(.22,1,.36,1),opacity .35s}' +
    '.rs-nudge.show{transform:translateY(0);opacity:1}' +
    '.rs-nudge-head{display:flex;align-items:center;gap:9px;margin:0 0 4px;padding-right:20px}' +
    '.rs-nudge-ico{flex:0 0 auto;width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;' +
    'background:#e9efff;color:#2056d2;font-size:16px}' +
    '.rs-nudge-title{font-family:"IBM Plex Serif",Georgia,serif;font-weight:600;font-size:16.5px;margin:0;letter-spacing:-.01em}' +
    '.rs-nudge-body{font-size:13px;color:#4b5260;margin:2px 0 13px}' +
    '.rs-nudge-oauth{display:flex;align-items:center;justify-content:center;gap:9px;width:100%;padding:10px 14px;' +
    'border:1px solid #d4d9e3;border-radius:7px;background:#fff;color:#0a0d14;font-family:inherit;font-size:13.5px;' +
    'font-weight:500;cursor:pointer;transition:border-color .15s,background .15s}' +
    '.rs-nudge-oauth:hover:not(:disabled){border-color:#1f2533;background:#fafbff}' +
    '.rs-nudge-oauth:disabled{opacity:.55;cursor:wait}' +
    '.rs-nudge-oauth svg{width:17px;height:17px;flex:none}' +
    '.rs-nudge-or{display:flex;align-items:center;gap:10px;color:#6b7280;font-size:11px;text-transform:uppercase;' +
    'letter-spacing:.06em;margin:13px 0}' +
    '.rs-nudge-or::before,.rs-nudge-or::after{content:"";flex:1;height:1px;background:#e4e7ee}' +
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
    // dark theme
    'html.dark .rs-nudge{background:#161b22;color:#e6edf3;border-color:#262a31;box-shadow:0 12px 32px rgba(0,0,0,.55)}' +
    'html.dark .rs-nudge-ico{background:#1f2b46;color:#7aa2ff}' +
    'html.dark .rs-nudge-body{color:#9aa4b2}' +
    'html.dark .rs-nudge-oauth{background:#0d1117;border-color:#30363d;color:#e6edf3}' +
    'html.dark .rs-nudge-oauth:hover:not(:disabled){background:#161b22;border-color:#484f58}' +
    'html.dark .rs-nudge-or{color:#8a909c}html.dark .rs-nudge-or::before,html.dark .rs-nudge-or::after{background:#262a31}' +
    'html.dark .rs-nudge-email{background:#0d1117;border-color:#30363d;color:#e6edf3}' +
    'html.dark .rs-nudge-optin,html.dark .rs-nudge-foot{color:#9aa4b2}' +
    'html.dark .rs-nudge-x:hover{background:#1f242c;color:#e6edf3}' +
    '@media (prefers-reduced-motion:reduce){.rs-nudge{transition:opacity .2s}.rs-nudge.show{transform:none}}' +
    '@media (max-width:480px){.rs-nudge{left:16px;right:16px;width:auto}}';

  var GOOGLE_SVG =
    '<svg viewBox="0 0 18 18" aria-hidden="true">' +
    '<path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/>' +
    '<path fill="#34A853" d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"/>' +
    '<path fill="#FBBC05" d="M3.97 10.72A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33z"/>' +
    '<path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58A9 9 0 0 0 9 0 9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"/></svg>';

  // ---- Auth callback target + lazy Supabase client -------------------------

  var next = encodeURIComponent(location.pathname + location.search);
  var CALLBACK_URL = location.origin + '/signin.html?next=' + next;

  var supaPromise = null;
  function getSupa() {
    if (!supaPromise) {
      supaPromise = (async function () {
        var resp = await fetch('/api/_auth-config');
        if (!resp.ok) throw new Error('config ' + resp.status);
        var cfg = await resp.json();
        var mod = await import('https://esm.sh/@supabase/supabase-js@' + SUPA_VERSION);
        return mod.createClient(cfg.url, cfg.anonKey, {
          auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'implicit' },
        });
      })();
    }
    return supaPromise;
  }

  // ---- Build + show --------------------------------------------------------

  var shown = false;
  var el = null;

  function dismiss() {
    if (el) el.classList.remove('show');
    try { localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_DAYS * 864e5)); } catch (_) {}
    if (el) setTimeout(function () { if (el) el.remove(); el = null; }, 400);
  }

  function msg(kind, text) {
    var m = el.querySelector('.rs-nudge-msg');
    m.className = 'rs-nudge-msg show ' + kind;
    m.textContent = text;
  }

  // Two-state render. mode = 'signup' | 'signin'.
  function render(mode) {
    var signup = mode === 'signup';
    var inner =
      '<button class="rs-nudge-x" type="button" aria-label="Dismiss">&times;</button>' +
      '<div class="rs-nudge-head">' +
        '<span class="rs-nudge-ico">' + (signup ? '&#9993;' : '&#128075;') + '</span>' +
        '<h3 class="rs-nudge-title">' + (signup ? 'Save your progress across devices' : 'Welcome back!') + '</h3>' +
      '</div>' +
      '<p class="rs-nudge-body">' +
        (signup
          ? 'Never lose your code, challenges, or XP. Sign up free — no password needed.'
          : 'Enter your email to restore your progress.') +
      '</p>';

    if (signup) {
      inner +=
        '<button class="rs-nudge-oauth" type="button" data-google>' + GOOGLE_SVG + '<span>Continue with Google</span></button>' +
        '<div class="rs-nudge-or">or</div>';
    }

    inner +=
      '<form class="rs-nudge-form">' +
        '<div class="rs-nudge-row">' +
          '<input class="rs-nudge-email" type="email" required autocomplete="email" placeholder="your@email.com" aria-label="Email address">' +
          '<button class="rs-nudge-submit" type="submit">' + (signup ? 'Sign up' : 'Send link') + '</button>' +
        '</div>';

    if (signup) {
      inner +=
        '<label class="rs-nudge-optin"><input type="checkbox" data-optin>' +
        '<span>Send me R tips &amp; updates</span></label>';
    }
    inner += '</form>';

    inner +=
      '<p class="rs-nudge-foot">' +
        (signup
          ? 'Already have an account? <a data-to-signin>Send magic link</a>'
          : 'New here? <a data-to-signup>Sign up free</a>') +
      '</p>' +
      (signup
        ? '<p class="rs-nudge-legal">By signing up you agree to our <a href="/terms-of-service.html">Terms</a> and <a href="/privacy.html">Privacy Policy</a>.</p>'
        : '') +
      '<div class="rs-nudge-msg" role="alert"></div>';

    el.innerHTML = inner;
    wire(mode);
  }

  function wire(mode) {
    el.querySelector('.rs-nudge-x').addEventListener('click', dismiss);

    var toSignin = el.querySelector('[data-to-signin]');
    if (toSignin) toSignin.addEventListener('click', function () { render('signin'); });
    var toSignup = el.querySelector('[data-to-signup]');
    if (toSignup) toSignup.addEventListener('click', function () { render('signup'); });

    var google = el.querySelector('[data-google]');
    if (google) google.addEventListener('click', function () { doGoogle(google); });

    el.querySelector('.rs-nudge-form').addEventListener('submit', function (e) {
      e.preventDefault();
      doMagicLink(mode);
    });
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

  async function doGoogle(btn) {
    var optin = el.querySelector('[data-optin]');
    if (optin && optin.checked) recordOptinSignal();
    var span = btn.querySelector('span');
    var orig = span.textContent;
    btn.disabled = true;
    span.innerHTML = '<span class="rs-nudge-spin"></span> Redirecting…';
    try {
      var supa = await getSupa();
      var res = await supa.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: CALLBACK_URL } });
      if (res.error) throw res.error;
      // Success triggers a full-page redirect; nothing more to do.
    } catch (err) {
      btn.disabled = false;
      span.textContent = orig;
      msg('err', (err && err.message) || 'Could not start Google sign-in.');
    }
  }

  async function doMagicLink(mode) {
    var input = el.querySelector('.rs-nudge-email');
    var btn = el.querySelector('.rs-nudge-submit');
    var email = input.value.trim();
    if (!email) return;
    var optin = el.querySelector('[data-optin]');
    var wantsNewsletter = !!(optin && optin.checked);
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
        msg('err', res.error.message || 'Could not send link. Try again.');
      } else {
        msg('ok', 'Check your inbox — link is good for 60 minutes. You can close this tab.');
        input.value = '';
      }
    } catch (err) {
      btn.disabled = false;
      btn.textContent = orig;
      msg('err', (err && err.message) || 'Something went wrong. Try again.');
    }
  }

  function show() {
    if (shown) return;
    if (looksSignedIn()) return; // /api/me may have flipped state since load
    shown = true;
    teardownTriggers();

    var style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    el = document.createElement('div');
    el.className = 'rs-nudge';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Save your progress by signing in');
    document.body.appendChild(el);
    render('signup');

    void el.offsetWidth; // reflow so the slide-in transition runs
    el.classList.add('show');
  }

  // ---- Engagement triggers: 40% scroll OR 20s -----------------------------

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
})();
