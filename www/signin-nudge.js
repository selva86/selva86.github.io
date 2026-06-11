// Sign-in nudge — a dependency-free slide-in toast shown to logged-out
// readers only, encouraging them to sign in so they can save posts and
// resume their progress.
//
// Behaviour (locked with Selva 2026-06-11):
//   - Shows ONLY for anonymous visitors (body.state-anon, no Supabase token).
//   - Triggers for ENGAGED readers: after ~40% scroll OR ~20s, whichever first.
//   - Bottom-right slide-in card. Dismissible; dismissal remembered 30 days.
//   - "Sign in" links to /signin.html?next=<current path> so the reader
//     returns to this page after auth (uses the existing intent-replay path).
//   - Suppressed on auth pages themselves (signin / account) where it's noise.
//
// Self-contained: injects its own CSS + DOM. Add to a page with
//   <script defer src="/www/signin-nudge.js?v=1"></script>
// (already wired into _build/template.html). Bump ?v=N when editing — /www/*
// is immutable-cached at the edge.

(function () {
  'use strict';

  var DISMISS_KEY = 'rs-signin-nudge-dismissed';
  var DISMISS_DAYS = 30;
  var SCROLL_TRIGGER_PCT = 40;
  var TIME_TRIGGER_MS = 20000;

  // ---- Bail-out gates (cheapest first) -------------------------------------

  // Don't nag on the auth pages themselves.
  var path = location.pathname.toLowerCase();
  if (path.indexOf('signin') !== -1 || path.indexOf('account') !== -1) return;

  // Respect a prior dismissal (30-day TTL).
  try {
    var until = parseInt(localStorage.getItem(DISMISS_KEY) || '0', 10);
    if (until && Date.now() < until) return;
  } catch (_) {}

  // Don't show to someone who looks signed in. auth-hydrate.js optimistically
  // sets state-pro when a Supabase token exists, then corrects via /api/me;
  // we re-check at fire time too, so an early read here is just an early exit.
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

  // ---- Styles (injected once) ----------------------------------------------

  var CSS =
    '.rs-nudge{position:fixed;right:20px;bottom:20px;z-index:1100;width:320px;max-width:calc(100vw - 32px);' +
    'background:#fff;color:#0d1117;border:1px solid #e3e7ee;border-radius:12px;' +
    "font-family:'IBM Plex Sans',-apple-system,Segoe UI,Roboto,sans-serif;" +
    'box-shadow:0 12px 32px rgba(10,13,20,.18);padding:16px 16px 14px;' +
    'transform:translateY(140%);opacity:0;transition:transform .35s cubic-bezier(.22,1,.36,1),opacity .35s}' +
    '.rs-nudge.show{transform:translateY(0);opacity:1}' +
    '.rs-nudge-title{display:flex;align-items:center;gap:7px;font-size:14.5px;font-weight:600;margin:0 0 5px}' +
    '.rs-nudge-title svg{flex:0 0 auto;color:#2563eb}' +
    '.rs-nudge-body{font-size:13px;line-height:1.45;color:#4a5160;margin:0 0 13px}' +
    '.rs-nudge-actions{display:flex;align-items:center;gap:10px}' +
    '.rs-nudge-cta{flex:0 0 auto;background:#2563eb;color:#fff;text-decoration:none;font-size:13px;font-weight:600;' +
    'padding:8px 16px;border-radius:7px;transition:background .15s}' +
    '.rs-nudge-cta:hover{background:#1d4ed8;color:#fff;text-decoration:none}' +
    '.rs-nudge-later{background:none;border:0;color:#8a909c;font-size:12.5px;cursor:pointer;padding:6px 4px}' +
    '.rs-nudge-later:hover{color:#4a5160;text-decoration:underline}' +
    '.rs-nudge-x{position:absolute;top:8px;right:9px;background:none;border:0;color:#b6bcc6;font-size:18px;' +
    'line-height:1;cursor:pointer;padding:3px 6px;border-radius:5px}' +
    '.rs-nudge-x:hover{color:#4a5160;background:#f1f3f6}' +
    'html.dark .rs-nudge{background:#161b22;color:#e6edf3;border-color:#262a31;box-shadow:0 12px 32px rgba(0,0,0,.5)}' +
    'html.dark .rs-nudge-body{color:#9aa4b2}' +
    'html.dark .rs-nudge-x:hover{background:#1f242c;color:#e6edf3}' +
    '@media (prefers-reduced-motion:reduce){.rs-nudge{transition:opacity .2s}.rs-nudge.show{transform:none}}' +
    '@media (max-width:480px){.rs-nudge{left:16px;right:16px;width:auto}}';

  // ---- Build + show --------------------------------------------------------

  var shown = false;

  function dismiss() {
    var el = document.querySelector('.rs-nudge');
    if (el) el.classList.remove('show');
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_DAYS * 864e5));
    } catch (_) {}
    if (el) setTimeout(function () { el.remove(); }, 400);
  }

  function show() {
    if (shown) return;
    // Re-check at fire time: /api/me may have flipped us to signed-in since load.
    if (looksSignedIn()) return;
    shown = true;
    teardownTriggers();

    var style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    var next = encodeURIComponent(location.pathname + location.search);
    var el = document.createElement('div');
    el.className = 'rs-nudge';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Sign in to save your progress');
    el.innerHTML =
      '<button class="rs-nudge-x" type="button" aria-label="Dismiss">&times;</button>' +
      '<p class="rs-nudge-title">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>' +
        'Save your progress' +
      '</p>' +
      '<p class="rs-nudge-body">Create a free account to bookmark tutorials and pick up right where you left off.</p>' +
      '<div class="rs-nudge-actions">' +
        '<a class="rs-nudge-cta" href="/signin.html?next=' + next + '">Sign in free</a>' +
        '<button class="rs-nudge-later" type="button">Maybe later</button>' +
      '</div>';
    document.body.appendChild(el);

    el.querySelector('.rs-nudge-x').addEventListener('click', dismiss);
    el.querySelector('.rs-nudge-later').addEventListener('click', dismiss);
    // CTA click counts as "handled" — don't pop it up again next visit.
    el.querySelector('.rs-nudge-cta').addEventListener('click', function () {
      try { localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_DAYS * 864e5)); } catch (_) {}
    });

    // Force reflow so the transition runs from the off-screen start state.
    void el.offsetWidth;
    el.classList.add('show');
  }

  // ---- Engagement triggers: 40% scroll OR 20s -----------------------------

  function scrolledEnough() {
    var doc = document.documentElement;
    var scrollable = doc.scrollHeight - window.innerHeight;
    if (scrollable <= 0) return false; // short page; let the timer handle it
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
