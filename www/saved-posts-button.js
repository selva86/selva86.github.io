// Tutorial byline + actionbar widget.
//
// On every tutorial page, rebuilds the area between H1 and the article body
// to match _mocks/blog-page-mock-v2.html:
//
//   H1
//   <p class="lead">...</p>
//   <div class="byline">
//     [SP] Selva Prabhakaran  •  Updated <date>  •  ✓ Reviewed  •  ⏱ <X> min  [Difficulty]
//   </div>
//   <div class="actionbar">
//     [bookmark] Save     [↗] Share     <sync indicator>
//   </div>
//
// Data sources (all already on the page from build pipeline):
//   - .post-byline text → author name, last updated date
//   - .engagement-header data-time, data-difficulty attrs → reading time, difficulty
//
// Anon bookmark click: stores intent in sessionStorage, redirects to
// /signin.html?next=<current-url>. After auth, replayed automatically.

(function () {
  'use strict';

  const PENDING_KEY = 'rs-pending-intent';
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  function getSlugFromPath() {
    const m = window.location.pathname.match(/^\/([^\/]+?)(?:\.html?)?\/?$/);
    return m && m[1] ? decodeURIComponent(m[1]) : null;
  }

  function formatDate(rawDate) {
    try {
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return rawDate;
      return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
    } catch (_) { return rawDate; }
  }

  function computeInitials(name) {
    const parts = (name || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return (parts[0] || '??').slice(0, 2).toUpperCase();
  }

  function buildByline(author, updatedDate, difficulty, readingTime) {
    const initials = computeInitials(author);
    let html = '<div class="byline">';
    html += '<span class="av-sm">' + initials + '</span>';
    html += '<span class="who">' + author + '</span>';
    if (updatedDate) {
      html += '<span class="dot">&bull;</span><span>Updated ' + updatedDate + '</span>';
    }
    html += '<span class="dot">&bull;</span>';
    html += '<span class="rev"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Reviewed</span>';
    if (readingTime) {
      html += '<span class="dot">&bull;</span>';
      html += '<span class="time"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 16 14"/></svg> ' + readingTime + ' min</span>';
    }
    if (difficulty) {
      html += '<span class="diff">' + difficulty + '</span>';
    }
    html += '</div>';
    return html;
  }

  function rebuildByline() {
    const content = document.getElementById('content');
    if (!content) return null;
    const h1 = content.querySelector('h1');
    if (!h1) return null;

    // Parse existing .post-byline for author + last updated date.
    const oldByline = content.querySelector('.post-byline');
    let author = 'Selva Prabhakaran';
    let updatedDate = '';
    if (oldByline) {
      const text = oldByline.textContent || '';
      const am = text.match(/By\s+([^·•]+?)(?:\s*[·•]|$)/);
      if (am) author = am[1].trim();
      const dm = text.match(/(?:Last updated|Updated)\s+([A-Z][a-z]+\.?\s+\d{1,2},?\s+\d{4})/i);
      if (dm) updatedDate = formatDate(dm[1]);
      else {
        const pm = text.match(/Published\s+([A-Z][a-z]+\.?\s+\d{1,2},?\s+\d{4})/i);
        if (pm) updatedDate = formatDate(pm[1]);
      }
    }

    // Read difficulty + reading time from engagement-header data attributes.
    const eh = content.querySelector('.engagement-header');
    const difficulty = eh ? eh.getAttribute('data-difficulty') : '';
    const readingTime = eh ? eh.getAttribute('data-time') : '';

    // Build + inject new byline; place after p.lead if present, else after H1.
    const lead = (h1.nextElementSibling && h1.nextElementSibling.matches && h1.nextElementSibling.matches('p.lead'))
      ? h1.nextElementSibling : h1;
    const wrap = document.createElement('div');
    wrap.innerHTML = buildByline(author, updatedDate, difficulty, readingTime);
    const newByline = wrap.firstChild;
    lead.insertAdjacentElement('afterend', newByline);

    if (oldByline) oldByline.remove();
    return newByline;
  }

  function injectActionbar(afterEl) {
    if (document.querySelector('.bookmark-btn')) return null;
    const slug = getSlugFromPath();
    if (!slug) return null;
    const bar = document.createElement('div');
    bar.className = 'actionbar';
    bar.innerHTML =
      '<button class="act bookmark-btn" type="button" data-slug="' + slug.replace(/"/g, '&quot;') + '" aria-pressed="false" title="Save this post">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>' +
        '<span class="bookmark-label">Save</span>' +
      '</button>' +
      '<button class="act share-btn" type="button" title="Share this post">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>' +
        '<span>Share</span>' +
      '</button>' +
      '<span class="actionbar-sync auth-user"><b>Synced</b> to your account</span>' +
      '<span class="actionbar-sync auth-anon"><a href="/signin.html">Sign in</a> to save and track progress</span>';
    afterEl.insertAdjacentElement('afterend', bar);
    return bar;
  }

  // ===== Save / unsave handlers =====
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
    } catch (_) { return false; }
  }

  async function setSaveState(slug, token, save) {
    try {
      const resp = await fetch('/api/save/' + encodeURIComponent(slug), {
        method: save ? 'POST' : 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/json' },
      });
      if (!resp.ok) return null;
      return await resp.json();
    } catch (_) { return null; }
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

  async function handleBookmarkClick(btn, slug) {
    const token = window.__auth && window.__auth.getAccessToken();
    if (!token) {
      recordIntent({ action: 'save', slug: slug, ts: Date.now() });
      redirectToSignin();
      return;
    }
    const isSaved = btn.dataset.saved === '1';
    btn.disabled = true;
    const result = await setSaveState(slug, token, !isSaved);
    btn.disabled = false;
    if (result && typeof result.saved === 'boolean') setBtnState(btn, result.saved);
    if (!result && window.__auth) window.__auth.rehydrate();
  }

  function initBookmarkButton(btn) {
    if (btn.dataset.wired === '1') return;
    btn.dataset.wired = '1';
    let slug = btn.dataset.slug;
    if (!slug) {
      slug = getSlugFromPath();
      if (slug) btn.dataset.slug = slug;
    }
    if (!slug) { btn.style.display = 'none'; return; }
    setBtnState(btn, false);
    btn.addEventListener('click', e => { e.preventDefault(); handleBookmarkClick(btn, slug); });
  }

  // ===== Share button =====
  function showToast(text) {
    let t = document.getElementById('rs-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'rs-toast';
      t.className = 'rs-toast';
      document.body.appendChild(t);
    }
    t.textContent = text;
    t.classList.add('show');
    clearTimeout(t._hideTimer);
    t._hideTimer = setTimeout(() => t.classList.remove('show'), 2200);
  }

  async function handleShareClick() {
    const url = window.location.href;
    const title = document.title;
    if (navigator.share) {
      try { await navigator.share({ title, url }); return; } catch (_) { /* user cancelled or unsupported */ }
    }
    try {
      await navigator.clipboard.writeText(url);
      showToast('Link copied');
    } catch (_) {
      // Last-resort fallback
      window.prompt('Copy this URL', url);
    }
  }

  function initShareButton(btn) {
    if (btn.dataset.wired === '1') return;
    btn.dataset.wired = '1';
    btn.addEventListener('click', e => { e.preventDefault(); handleShareClick(); });
  }

  // ===== Hydration handler =====
  async function onAuthHydrated(ev) {
    const me = ev.detail && ev.detail.me;
    const token = ev.detail && ev.detail.token;
    const slug = getSlugFromPath();
    document.querySelectorAll('.bookmark-btn').forEach(initBookmarkButton);
    document.querySelectorAll('.share-btn').forEach(initShareButton);
    if (!me || !token || !slug) return;

    const saved = await fetchStatus(slug, token);
    document.querySelectorAll('.bookmark-btn').forEach(btn => setBtnState(btn, saved));

    const intent = consumeIntent();
    if (intent && intent.action === 'save' && intent.slug === slug && !saved) {
      const result = await setSaveState(slug, token, true);
      if (result && result.saved) {
        document.querySelectorAll('.bookmark-btn').forEach(btn => setBtnState(btn, true));
      }
    }
  }

  function preInit() {
    const newByline = rebuildByline();
    const insertAfter = newByline || (document.getElementById('content') && document.getElementById('content').querySelector('h1'));
    if (insertAfter) injectActionbar(insertAfter);
    document.querySelectorAll('.bookmark-btn').forEach(initBookmarkButton);
    document.querySelectorAll('.share-btn').forEach(initShareButton);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', preInit);
  } else {
    preInit();
  }
  document.addEventListener('auth-hydrated', onAuthHydrated);
})();
