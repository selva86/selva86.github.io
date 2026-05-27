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
    const slugAttr = slug.replace(/"/g, '&quot;');
    bar.innerHTML =
      '<button class="act bookmark-btn" type="button" data-slug="' + slugAttr + '" aria-pressed="false" title="Save this post">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>' +
        '<span class="bookmark-label">Save</span>' +
      '</button>' +
      '<button class="act markread-btn" type="button" data-slug="' + slugAttr + '" aria-pressed="false" title="Mark this post as read">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' +
        '<span class="markread-label">Mark as read</span>' +
      '</button>' +
      '<button class="act share-btn" type="button" title="Share this post">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>' +
        '<span>Share</span>' +
      '</button>' +
      '<span class="actionbar-sync auth-user"><b>Synced</b>&nbsp;to your account</span>' +
      '<span class="actionbar-sync auth-anon"><a href="/signin.html">Sign in</a>&nbsp;to save and track progress</span>';
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

  // ===== Mark-as-read button =====
  function setMarkReadState(btn, read) {
    btn.dataset.read = read ? '1' : '0';
    btn.setAttribute('aria-pressed', read ? 'true' : 'false');
    const label = btn.querySelector('.markread-label');
    if (label) label.textContent = read ? 'Read' : 'Mark as read';
    btn.title = read ? 'Unmark as read' : 'Mark this post as read';
  }

  async function postReadProgress(slug, token, body) {
    try {
      const resp = await fetch('/api/read/' + encodeURIComponent(slug), {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(body || {}),
        keepalive: true, // allows the final pagehide flush to complete
      });
      if (!resp.ok) return null;
      return await resp.json();
    } catch (_) { return null; }
  }

  async function fetchReadStatus(slug, token) {
    try {
      const resp = await fetch('/api/read/' + encodeURIComponent(slug), {
        headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/json' },
      });
      if (!resp.ok) return null;
      return await resp.json();
    } catch (_) { return null; }
  }

  async function handleMarkReadClick(btn, slug) {
    const token = window.__auth && window.__auth.getAccessToken();
    if (!token) {
      recordIntent({ action: 'mark_read', slug: slug, ts: Date.now() });
      redirectToSignin();
      return;
    }
    const isRead = btn.dataset.read === '1';
    btn.disabled = true;
    const result = await postReadProgress(slug, token, { marked_read: !isRead });
    btn.disabled = false;
    if (result && typeof result.marked_read === 'number') {
      setMarkReadState(btn, !!result.marked_read);
    } else if (!result && window.__auth) {
      window.__auth.rehydrate();
    }
  }

  function initMarkReadButton(btn) {
    if (btn.dataset.wired === '1') return;
    btn.dataset.wired = '1';
    let slug = btn.dataset.slug;
    if (!slug) {
      slug = getSlugFromPath();
      if (slug) btn.dataset.slug = slug;
    }
    if (!slug) { btn.style.display = 'none'; return; }
    setMarkReadState(btn, false);
    btn.addEventListener('click', e => { e.preventDefault(); handleMarkReadClick(btn, slug); });
  }

  // ===== Scroll progress tracker =====
  // Throttled POST to /api/read/<slug>. Only fires when:
  //   - delta from last-sent scroll_pct is >= MIN_DELTA_PCT, AND
  //   - at least MIN_INTERVAL_MS has passed since the previous POST.
  // Plus a final flush on pagehide / visibilitychange:hidden so the last
  // position is always recorded even if the user navigates away mid-page.
  const SCROLL_MIN_DELTA = 5;
  const SCROLL_MIN_INTERVAL_MS = 5000;
  const SCROLL_HEARTBEAT_MS = 60000; // periodic flush even without scroll movement

  function computeScrollPct() {
    const doc = document.documentElement;
    const total = (doc.scrollHeight || document.body.scrollHeight) - window.innerHeight;
    if (total <= 0) return 100; // page fits in viewport — counts as fully seen
    const pct = (window.scrollY / total) * 100;
    return Math.max(0, Math.min(100, pct));
  }

  function findNearestSection() {
    const headings = document.querySelectorAll('#content h2[id], #content h2');
    if (!headings.length) return '';
    const fold = window.scrollY + 120; // account for sticky offset
    let nearest = '';
    for (const h of headings) {
      const top = h.getBoundingClientRect().top + window.scrollY;
      if (top <= fold) {
        nearest = (h.textContent || '').trim().slice(0, 200);
      } else {
        break;
      }
    }
    return nearest;
  }

  function initScrollTracker(slug, token) {
    if (window.__rsScrollTracker) return; // singleton — only attach once per page
    let lastSentPct = -100;
    let lastSentAt = 0;
    let pending = null; // timer handle for trailing-edge flush
    let lastSection = '';

    function snapshot() {
      const pct = Math.round(computeScrollPct());
      const section = findNearestSection();
      return { pct, section };
    }

    function flush(force) {
      const now = Date.now();
      const { pct, section } = snapshot();
      const delta = Math.abs(pct - lastSentPct);
      const intervalOk = now - lastSentAt >= SCROLL_MIN_INTERVAL_MS;
      if (!force && (delta < SCROLL_MIN_DELTA || !intervalOk)) return;
      lastSentPct = pct;
      lastSentAt = now;
      lastSection = section || lastSection;
      const body = { scroll_pct: pct };
      if (lastSection) body.last_section = lastSection;
      postReadProgress(slug, token, body);
    }

    function onScroll() {
      if (document.visibilityState === 'hidden') return;
      if (pending) return; // already scheduled
      pending = setTimeout(() => { pending = null; flush(false); }, 500);
    }

    function onPageExit() {
      if (pending) { clearTimeout(pending); pending = null; }
      // Force-flush regardless of throttle on exit.
      const now = Date.now();
      const { pct, section } = snapshot();
      // Only emit if there's been ANY movement since the previous POST,
      // or if we never posted at all this session.
      if (lastSentAt === 0 || Math.abs(pct - lastSentPct) >= 1) {
        lastSentPct = pct;
        lastSentAt = now;
        const body = { scroll_pct: pct };
        if (section) body.last_section = section;
        postReadProgress(slug, token, body);
      }
    }

    // Periodic heartbeat — keeps read_at fresh for long readers who park on a
    // page without scrolling. Doesn't move scroll_pct unless the delta gate
    // also opens.
    const heartbeatId = setInterval(() => {
      if (document.visibilityState === 'visible') flush(false);
    }, SCROLL_HEARTBEAT_MS);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pagehide', onPageExit);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') onPageExit();
    });

    window.__rsScrollTracker = {
      flushNow: () => flush(true),
      stop: () => {
        clearInterval(heartbeatId);
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('pagehide', onPageExit);
      },
    };
  }

  // ===== Hydration handler =====
  async function onAuthHydrated(ev) {
    const me = ev.detail && ev.detail.me;
    const token = ev.detail && ev.detail.token;
    const slug = getSlugFromPath();
    document.querySelectorAll('.bookmark-btn').forEach(initBookmarkButton);
    document.querySelectorAll('.markread-btn').forEach(initMarkReadButton);
    document.querySelectorAll('.share-btn').forEach(initShareButton);
    if (!me || !token || !slug) return;

    // Parallel fetch of save + read status — both are independent.
    const [saved, readStatus] = await Promise.all([
      fetchStatus(slug, token),
      fetchReadStatus(slug, token),
    ]);
    document.querySelectorAll('.bookmark-btn').forEach(btn => setBtnState(btn, saved));
    const isRead = !!(readStatus && readStatus.marked_read);
    document.querySelectorAll('.markread-btn').forEach(btn => setMarkReadState(btn, isRead));

    // Start scroll tracking only on real tutorial pages (slug derived + #content exists).
    if (document.getElementById('content')) {
      initScrollTracker(slug, token);
    }

    // Replay any pre-auth intents stored before redirect to /signin.
    const intent = consumeIntent();
    if (intent && intent.slug === slug) {
      if (intent.action === 'save' && !saved) {
        const result = await setSaveState(slug, token, true);
        if (result && result.saved) {
          document.querySelectorAll('.bookmark-btn').forEach(btn => setBtnState(btn, true));
        }
      } else if (intent.action === 'mark_read' && !isRead) {
        const result = await postReadProgress(slug, token, { marked_read: true });
        if (result && result.marked_read) {
          document.querySelectorAll('.markread-btn').forEach(btn => setMarkReadState(btn, true));
        }
      }
    }
  }

  function preInit() {
    const newByline = rebuildByline();
    const insertAfter = newByline || (document.getElementById('content') && document.getElementById('content').querySelector('h1'));
    if (insertAfter) injectActionbar(insertAfter);
    document.querySelectorAll('.bookmark-btn').forEach(initBookmarkButton);
    document.querySelectorAll('.markread-btn').forEach(initMarkReadButton);
    document.querySelectorAll('.share-btn').forEach(initShareButton);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', preInit);
  } else {
    preInit();
  }
  document.addEventListener('auth-hydrated', onAuthHydrated);
})();
