// Auth state hydration — shared across all auth-aware pages.
//
// Sets body.state-anon or body.state-pro based on /api/me result, fills
// .auth-email / .auth-display-name elements, wires .auth-signout buttons.
// Designed to fail gracefully (defaults to anon) so it's safe on pages
// served from origins without /api/me (e.g. live r-statistics.co during
// pre-cutover served by GH Pages).
//
// CSS contract (pages provide their own styling, this script just toggles classes):
//   body.state-anon  -> show .auth-anon elements, hide .auth-user
//   body.state-pro   -> show .auth-user elements, hide .auth-anon
//                       AND fills .auth-email / .auth-display-name text
//   body.state-pro.pro -> additional pill for actual Pro subscribers
//
// Element conventions inside .auth-user:
//   .auth-email          -> set to user.email
//   .auth-display-name   -> set to user.display_name || user.email's local part
//   .auth-signout        -> click handler calls Supabase signOut + reloads
//
// Cross-tab sync: listens for storage events on the Supabase session key so
// signing out in one tab updates other open tabs on next focus.

(function () {
  'use strict';

  // Default to anon immediately so anon UI is visible during the API roundtrip.
  // Pro state is opt-in once /api/me confirms.
  document.body.classList.add('state-anon');

  const ME_TIMEOUT_MS = 3000;
  let cachedAccessToken = null;

  // Try to read the access_token from Supabase's localStorage entry.
  // Avoids needing to load the full Supabase JS bundle on every page.
  function readAccessToken() {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith('sb-') || !key.endsWith('-auth-token')) continue;
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        // Supabase JS v2 stores an object with access_token; older versions used arrays.
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
      // Network error, 404 (e.g. GH Pages doesn't have /api/me), or timeout. Anon.
      return null;
    } finally {
      clearTimeout(t);
    }
  }

  function setAuthState(me) {
    const body = document.body;
    if (!me || !me.user) {
      body.classList.add('state-anon');
      body.classList.remove('state-pro', 'pro');
      return;
    }
    body.classList.remove('state-anon');
    body.classList.add('state-pro');
    if (me.pro) body.classList.add('pro'); else body.classList.remove('pro');

    const display = me.user.display_name || (me.user.email ? me.user.email.split('@')[0] : 'You');
    document.querySelectorAll('.auth-email').forEach(el => { el.textContent = me.user.email || ''; });
    document.querySelectorAll('.auth-display-name').forEach(el => { el.textContent = display; });

    // Wire sign-out button(s).
    document.querySelectorAll('.auth-signout').forEach(btn => {
      // Idempotent: skip if already wired.
      if (btn.dataset.wired === '1') return;
      btn.dataset.wired = '1';
      btn.addEventListener('click', async function (e) {
        e.preventDefault();
        await signOut();
      });
    });
  }

  // Lazy-load Supabase JS only when sign-out is clicked.
  async function signOut() {
    try {
      const cfgResp = await fetch('/api/_auth-config');
      if (!cfgResp.ok) throw new Error('config ' + cfgResp.status);
      const cfg = await cfgResp.json();
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.45.4');
      const supa = createClient(cfg.url, cfg.anonKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, flowType: 'implicit' },
      });
      await supa.auth.signOut();
    } catch (_) {
      // Even if Supabase call fails, force-clear local storage so UI updates.
      try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const k = localStorage.key(i);
          if (k && k.startsWith('sb-')) localStorage.removeItem(k);
        }
      } catch (_) { /* nothing else to do */ }
    }
    // Reload to reset UI and re-evaluate state.
    window.location.reload();
  }

  // Cross-tab sync: if Supabase auth-token storage changes in another tab,
  // re-hydrate on next focus.
  window.addEventListener('storage', function (e) {
    if (e.key && e.key.startsWith('sb-') && e.key.endsWith('-auth-token')) {
      hydrate();
    }
  });

  async function hydrate() {
    const token = readAccessToken();
    cachedAccessToken = token;
    const me = await fetchMe(token);
    setAuthState(me);
    // Custom event so feature scripts (bookmark widget, etc.) can react.
    document.dispatchEvent(new CustomEvent('auth-hydrated', { detail: { me, token } }));
  }

  // Run on initial load.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hydrate);
  } else {
    hydrate();
  }

  // Expose for feature scripts that need the token after init.
  window.__auth = {
    getAccessToken: () => cachedAccessToken,
    rehydrate: hydrate,
    signOut: signOut,
  };
})();
