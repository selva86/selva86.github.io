// Auth state hydration — shared across all auth-aware pages.
//
// Sets body.state-anon / body.state-pro from /api/me result.
// When state-pro, REPLACES the contents of every .auth-user span on the
// page with a uniform avatar+dropdown UI (initials circle that opens a
// menu: Saved posts, Account, Sign out). Pages just need an empty
// <span class="auth-user"></span> placeholder; this script handles the
// rest. Design adapted from _mocks/blog-page-mock-v2.html.
//
// Anon UI: pages provide their own <span class="auth-anon">Sign in</span>
// element; this script only toggles visibility via body class.
//
// Cross-tab sync via storage events on Supabase auth-token key.

(function () {
  'use strict';

  document.body.classList.add('state-anon');

  const ME_TIMEOUT_MS = 3000;
  let cachedAccessToken = null;
  let cssInjected = false;

  // ===== Standardized avatar + dropdown HTML =====
  // Filled per-instance with initials + display name + email at hydration.
  const AUTH_USER_HTML = (
    '<button class="masthead-avatar" type="button" aria-label="Open account menu" aria-haspopup="true" aria-expanded="false">' +
      '<span class="auth-initials">?</span>' +
    '</button>' +
    '<div class="masthead-udrop" role="menu">' +
      '<div class="udrop-head">' +
        '<b class="auth-display-name"></b>' +
        '<span class="auth-email"></span>' +
      '</div>' +
      '<a href="/saved-posts.html" role="menuitem">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>' +
        '<span>Saved posts</span>' +
      '</a>' +
      '<a href="/account.html" role="menuitem">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>' +
        '<span>Account</span>' +
      '</a>' +
      '<div class="udrop-sep"></div>' +
      '<button class="auth-signout udrop-item" role="menuitem" type="button">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8"/><polyline points="14 17 19 12 14 7"/><line x1="19" y1="12" x2="9" y2="12"/></svg>' +
        '<span>Sign out</span>' +
      '</button>' +
    '</div>'
  );

  const AUTH_CSS = (
    /* Uniform auth-user styling, scoped under .auth-user to coexist with page CSS */
    '.auth-user{position:relative;display:none;align-items:center}' +
    'body.state-pro .auth-user{display:inline-flex}' +
    '.auth-user .masthead-avatar{width:34px;height:34px;border-radius:50%;border:2px solid transparent;' +
      'background:linear-gradient(135deg,#1c2c4f,#33508c);color:#fff;cursor:pointer;padding:0;' +
      'display:flex;align-items:center;justify-content:center;font-family:inherit;' +
      'transition:border-color .15s,box-shadow .15s}' +
    '.auth-user .masthead-avatar:hover{border-color:#2056d2}' +
    '.auth-user .masthead-avatar .auth-initials{font-weight:700;font-size:12.5px;letter-spacing:.02em;line-height:1}' +
    '.auth-user .masthead-udrop{position:absolute;top:calc(100% + 8px);right:0;width:248px;background:#fff;' +
      'border:1px solid #d4d9e3;border-radius:12px;box-shadow:0 20px 44px -16px rgba(13,20,38,.4);' +
      'z-index:70;overflow:hidden;display:none;font-family:\'IBM Plex Sans\',-apple-system,sans-serif}' +
    '.auth-user .masthead-udrop.show{display:block}' +
    '.auth-user .masthead-udrop .udrop-head{padding:14px 15px;border-bottom:1px solid #e4e7ee;' +
      'display:flex;flex-direction:column;gap:1px}' +
    '.auth-user .masthead-udrop .udrop-head b{font-size:13.5px;font-weight:600;color:#0a0d14;' +
      'overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '.auth-user .masthead-udrop .udrop-head span{font-size:11.5px;color:#6b7280;' +
      'overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '.auth-user .masthead-udrop a, .auth-user .masthead-udrop .udrop-item{' +
      'display:flex;align-items:center;gap:10px;padding:9px 15px;font-size:13px;' +
      'color:#0a0d14;font-weight:500;text-decoration:none;background:none;border:0;width:100%;' +
      'text-align:left;font-family:inherit;cursor:pointer}' +
    '.auth-user .masthead-udrop a:hover, .auth-user .masthead-udrop .udrop-item:hover{background:#f1f3f6}' +
    '.auth-user .masthead-udrop a svg, .auth-user .masthead-udrop .udrop-item svg{flex:none;color:#6b7280}' +
    '.auth-user .masthead-udrop .udrop-sep{height:1px;background:#e4e7ee;margin:4px 0}' +
    /* Dark mode (when page sets html.dark) */
    'html.dark .auth-user .masthead-udrop{background:#14161a;border-color:#262a31}' +
    'html.dark .auth-user .masthead-udrop .udrop-head{border-bottom-color:#262a31}' +
    'html.dark .auth-user .masthead-udrop .udrop-head b{color:#eef2fa}' +
    'html.dark .auth-user .masthead-udrop a, html.dark .auth-user .masthead-udrop .udrop-item{color:#eef2fa}' +
    'html.dark .auth-user .masthead-udrop a:hover, html.dark .auth-user .masthead-udrop .udrop-item:hover{background:#1f242c}' +
    'html.dark .auth-user .masthead-udrop .udrop-sep{background:#262a31}'
  );

  function injectCssOnce() {
    if (cssInjected) return;
    cssInjected = true;
    const s = document.createElement('style');
    s.setAttribute('data-auth-hydrate', '1');
    s.textContent = AUTH_CSS;
    document.head.appendChild(s);
  }

  function readAccessToken() {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith('sb-') || !key.endsWith('-auth-token')) continue;
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.access_token === 'string') return parsed.access_token;
        if (Array.isArray(parsed) && typeof parsed[0] === 'string') return parsed[0];
      }
    } catch (_) { /* invalid storage, treat as anon */ }
    return null;
  }

  async function fetchMe(token) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), ME_TIMEOUT_MS);
    try {
      const headers = { 'Accept': 'application/json' };
      if (token) headers['Authorization'] = 'Bearer ' + token;
      const resp = await fetch('/api/me', { headers, signal: controller.signal });
      if (!resp.ok) return null;
      return await resp.json();
    } catch (_) {
      return null;
    } finally {
      clearTimeout(t);
    }
  }

  function computeInitials(displayName, email) {
    const source = (displayName || email || '?').trim();
    const parts = source.split(/[\s@._-]+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return (parts[0] || '?').slice(0, 2).toUpperCase();
  }

  function fillAuthUser(span, user) {
    // Always replace contents so re-hydration produces a clean tree (no
    // duplicate listeners, no stale data).
    span.innerHTML = AUTH_USER_HTML;
    const initials = computeInitials(user.display_name, user.email);
    const display = user.display_name || (user.email ? user.email.split('@')[0] : 'You');
    span.querySelectorAll('.auth-initials').forEach(el => { el.textContent = initials; });
    span.querySelectorAll('.auth-display-name').forEach(el => { el.textContent = display; });
    span.querySelectorAll('.auth-email').forEach(el => { el.textContent = user.email || ''; });

    const avatarBtn = span.querySelector('.masthead-avatar');
    const dropdown = span.querySelector('.masthead-udrop');
    if (avatarBtn && dropdown) {
      avatarBtn.addEventListener('click', e => {
        e.stopPropagation();
        const open = dropdown.classList.toggle('show');
        avatarBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }

    span.querySelectorAll('.auth-signout').forEach(btn => {
      btn.addEventListener('click', async e => {
        e.preventDefault();
        await signOut();
      });
    });
  }

  function closeAllDropdowns(except) {
    document.querySelectorAll('.auth-user .masthead-udrop.show').forEach(d => {
      if (d === except) return;
      d.classList.remove('show');
      const btn = d.parentElement && d.parentElement.querySelector('.masthead-avatar');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    });
  }

  // Global click-outside dismissal.
  document.addEventListener('click', e => {
    if (!e.target.closest('.auth-user .masthead-udrop') && !e.target.closest('.masthead-avatar')) {
      closeAllDropdowns(null);
    }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeAllDropdowns(null);
  });

  function setAuthState(me) {
    const body = document.body;
    if (!me || !me.user) {
      body.classList.add('state-anon');
      body.classList.remove('state-pro', 'pro');
      // Clear any previously-injected dropdown content.
      document.querySelectorAll('.auth-user').forEach(span => { span.innerHTML = ''; });
      return;
    }
    body.classList.remove('state-anon');
    body.classList.add('state-pro');
    if (me.pro) body.classList.add('pro'); else body.classList.remove('pro');

    document.querySelectorAll('.auth-user').forEach(span => fillAuthUser(span, me.user));
  }

  async function signOut() {
    try {
      const cfgResp = await fetch('/api/_auth-config');
      if (cfgResp.ok) {
        const cfg = await cfgResp.json();
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.45.4');
        const supa = createClient(cfg.url, cfg.anonKey, {
          auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, flowType: 'implicit' },
        });
        await supa.auth.signOut();
      }
    } catch (_) { /* fall through */ }
    // Belt+suspenders: clear sb-* localStorage entries.
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith('sb-')) localStorage.removeItem(k);
      }
    } catch (_) {}
    window.location.reload();
  }

  window.addEventListener('storage', function (e) {
    if (e.key && e.key.startsWith('sb-') && e.key.endsWith('-auth-token')) hydrate();
  });

  // Rewrite every <a href="/signin.html"> on the page so it carries
  // ?next=<current_url>. Without this, the user signs in but then lands on
  // /account.html instead of returning to the post / tool / page they
  // started from. Idempotent: skips signin links that already have a query.
  // Skipped entirely when we are already on signin.html or account.html
  // (auth surfaces — no point routing back to themselves).
  function rewriteSigninLinks() {
    const path = window.location.pathname.replace(/\/$/, '');
    if (path === '/signin.html' || path === '/signin' ||
        path === '/account.html' || path === '/account') return;
    const nextPath = window.location.pathname + window.location.search + window.location.hash;
    const encoded = encodeURIComponent(nextPath);
    document.querySelectorAll('a[href]').forEach(a => {
      const href = a.getAttribute('href');
      if (!href) return;
      // Only rewrite bare /signin or /signin.html (no existing query/hash).
      if (href === '/signin' || href === '/signin.html') {
        a.setAttribute('href', '/signin.html?next=' + encoded);
      }
    });
  }

  async function hydrate() {
    injectCssOnce();
    rewriteSigninLinks();
    const token = readAccessToken();
    cachedAccessToken = token;
    const me = await fetchMe(token);
    setAuthState(me);
    // Re-run after setAuthState because anon-state may have injected the
    // sign-in dropdown link (and saved-posts-button.js may have just
    // inserted the actionbar's "Sign in" anchor).
    rewriteSigninLinks();
    document.dispatchEvent(new CustomEvent('auth-hydrated', { detail: { me, token } }));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hydrate);
  } else {
    hydrate();
  }

  window.__auth = {
    getAccessToken: () => cachedAccessToken,
    rehydrate: hydrate,
    signOut: signOut,
  };
})();
