// Saved-posts bookmark widget.
//
// Lives in the tutorial-page header. Reads the current post's slug (data-slug
// attribute), shows saved/unsaved state, handles toggle on click.
//
// Anon click flow: stores intent in sessionStorage, redirects to /signin with
// ?next= back to this URL. After signin, intent is replayed automatically.
//
// Depends on auth-hydrate.js (must load first) for body.state-pro detection
// and window.__auth.getAccessToken().

(function () {
  'use strict';

  const PENDING_KEY = 'rs-pending-intent';

  function getSlugFromPath() {
    // /<slug>.html -> <slug>
    const m = window.location.pathname.match(/\/([^\/]+)\.html?$/);
    return m ? decodeURIComponent(m[1]) : null;
  }

  function setBtnState(btn, saved) {
    btn.dataset.saved = saved ? '1' : '0';
    btn.setAttribute('aria-pressed', saved ? 'true' : 'false');
    const label = btn.querySelector('.bookmark-label');
    if (label) label.textContent = saved ? 'Saved' : 'Save';
    btn.title = saved ? 'Remove from saved' : 'Save this post';
  }

  async function fetchStatus(slug, token) {
    try {
      const resp = await fetch('/api/save/' + encodeURIComponent(slug), {
        headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/json' },
      });
      if (!resp.ok) return false;
      const j = await resp.json();
      return !!j.saved;
    } catch (_) {
      return false;
    }
  }

  async function setSaveState(slug, token, save) {
    const method = save ? 'POST' : 'DELETE';
    try {
      const resp = await fetch('/api/save/' + encodeURIComponent(slug), {
        method,
        headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/json' },
      });
      if (!resp.ok) return null;
      return await resp.json();
    } catch (_) {
      return null;
    }
  }

  function recordIntent(intent) {
    try { sessionStorage.setItem(PENDING_KEY, JSON.stringify(intent)); } catch (_) {}
  }

  function consumeIntent() {
    try {
      const raw = sessionStorage.getItem(PENDING_KEY);
      if (!raw) return null;
      sessionStorage.removeItem(PENDING_KEY);
      return JSON.parse(raw);
    } catch (_) { return null; }
  }

  function redirectToSignin() {
    const next = window.location.pathname + window.location.search + window.location.hash;
    window.location.href = '/signin.html?next=' + encodeURIComponent(next);
  }

  async function handleClick(btn, slug) {
    const token = window.__auth && window.__auth.getAccessToken();
    if (!token) {
      // Anon: record intent (save this slug after auth) + redirect to signin.
      recordIntent({ action: 'save', slug, ts: Date.now() });
      redirectToSignin();
      return;
    }
    // Authed: toggle save state.
    const isSaved = btn.dataset.saved === '1';
    btn.disabled = true;
    const result = await setSaveState(slug, token, !isSaved);
    btn.disabled = false;
    if (result && typeof result.saved === 'boolean') {
      setBtnState(btn, result.saved);
    }
    // If session expired (token rejected), force re-hydration which will reset state.
    if (!result && window.__auth) window.__auth.rehydrate();
  }

  function initButton(btn) {
    if (btn.dataset.wired === '1') return;
    btn.dataset.wired = '1';
    let slug = btn.dataset.slug;
    if (!slug) {
      slug = getSlugFromPath();
      if (slug) btn.dataset.slug = slug;
    }
    if (!slug) {
      // Nothing to bookmark; hide.
      btn.style.display = 'none';
      return;
    }
    setBtnState(btn, false);
    btn.addEventListener('click', e => {
      e.preventDefault();
      handleClick(btn, slug);
    });
  }

  async function onAuthHydrated(ev) {
    const me = ev.detail && ev.detail.me;
    const token = ev.detail && ev.detail.token;
    const slug = getSlugFromPath();
    const btns = document.querySelectorAll('.bookmark-btn');
    if (!btns.length) return;
    btns.forEach(initButton);

    if (!me || !token || !slug) return; // anon stays at default unsaved state.

    // Check live status.
    const saved = await fetchStatus(slug, token);
    btns.forEach(btn => setBtnState(btn, saved));

    // Replay pending intent if it matches this page.
    const intent = consumeIntent();
    if (intent && intent.action === 'save' && intent.slug === slug && !saved) {
      const result = await setSaveState(slug, token, true);
      if (result && result.saved) {
        btns.forEach(btn => setBtnState(btn, true));
      }
    }
  }

  // Init pass for buttons before hydration completes (in case auth-hydrate.js
  // fires before us); subsequent hydration sets correct state.
  function preInit() {
    document.querySelectorAll('.bookmark-btn').forEach(initButton);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', preInit);
  } else {
    preInit();
  }
  document.addEventListener('auth-hydrated', onAuthHydrated);
})();
