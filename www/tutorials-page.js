// tutorials-page.js - hero "Run it" demo + signed-in resume strip.
// Vanilla JS, no libraries. Guards every DOM access; never throws.
// Dark-mode toggle and reveal-on-scroll are provided by sections-v3.js
// (the shared chrome), NOT here.
(function () {
  'use strict';

  // -----------------------------------------------------------------
  // 1. Hero interactive demo: "run" the snippet -> reveal + animate plot.
  //    Copied from the mock <script> (runDemo + on-view auto-run), with
  //    null-guards so a missing demo card cannot throw.
  // -----------------------------------------------------------------
  function runDemo() {
    var out = document.getElementById('demoOut');
    var btn = document.getElementById('runBtn');
    if (!out) return;
    out.classList.add('show');
    if (btn) {
      btn.classList.add('ran');
      btn.innerHTML = '<svg class="ic ic-sm"><use href="#i-check"/></svg> Ran';
    }
    // animate the points in, then the fit line
    var pts = out.querySelectorAll('.pts circle');
    pts.forEach(function (c, i) {
      c.style.opacity = '0';
      c.style.transition = 'opacity .3s var(--ease)';
      setTimeout(function () { c.style.opacity = '1'; }, 120 + i * 28);
    });
    var line = out.querySelector('.fitline');
    if (line) {
      var len = line.getTotalLength ? 340 : 340;
      line.style.strokeDasharray = len;
      line.style.strokeDashoffset = len;
      line.style.transition = 'stroke-dashoffset .8s var(--ease) .55s';
      setTimeout(function () { line.style.strokeDashoffset = '0'; }, 40);
    }
  }

  var runBtn = document.getElementById('runBtn');
  if (runBtn) runBtn.addEventListener('click', runDemo);

  // gently auto-run the hero demo once, after load, so the proof lands
  var heroRan = false;
  window.addEventListener('load', function () {
    setTimeout(function () { if (!heroRan) { heroRan = true; runDemo(); } }, 1100);
  });

  // -----------------------------------------------------------------
  // 2. Resume personalization (real, anon-safe).
  //    Reads the Supabase access token from localStorage the same way
  //    auth-hydrate.js does, then asks /api/me/reading for the most recent
  //    in-progress post and reveals the resume strip. Silent on any failure.
  // -----------------------------------------------------------------

  // Copied verbatim from auth-hydrate.js readAccessToken().
  function readAccessToken() {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (!key || key.indexOf('sb-') !== 0 || key.slice(-11) !== '-auth-token') continue;
        var raw = localStorage.getItem(key);
        if (!raw) continue;
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed.access_token === 'string') return parsed.access_token;
        if (Array.isArray(parsed) && typeof parsed[0] === 'string') return parsed[0];
      }
    } catch (_) { /* invalid storage, treat as anon */ }
    return null;
  }

  function prettifySlug(slug) {
    if (!slug) return '';
    return String(slug)
      .replace(/\.html$/i, '')
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, function (m) { return m.toUpperCase(); });
  }

  function fetchJson(url, token) {
    var headers = { 'Accept': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    return fetch(url, { headers: headers, credentials: 'include' }).then(function (r) {
      if (!r.ok) return null;
      return r.json();
    }).catch(function () { return null; });
  }

  function showResume(item, me) {
    var strip = document.getElementById('resume');
    if (!strip || !item || !item.slug) return;

    var slug = String(item.slug).replace(/\.html$/i, '');
    var href = '/' + slug + '.html';
    var title = item.title || prettifySlug(slug);

    var titleLink = document.getElementById('resumeTitle');
    if (titleLink) {
      titleLink.textContent = title;
      titleLink.setAttribute('href', href);
    }

    var jump = document.getElementById('resumeLink');
    if (jump) jump.setAttribute('href', href);

    var where = document.getElementById('resumeWhere');
    if (where) {
      if (item.last_section) {
        where.textContent = 'you stopped at "' + item.last_section + '"';
      } else if (typeof item.scroll_pct === 'number') {
        where.textContent = Math.round(item.scroll_pct) + '% read';
      } else {
        where.textContent = '';
      }
    }

    var nameEl = document.getElementById('resumeName');
    if (nameEl) {
      var name = me && me.user && me.user.display_name;
      nameEl.textContent = name ? ('Welcome back, ' + name + '.') : 'Welcome back.';
    }

    strip.removeAttribute('hidden');
  }

  function hydrateResume() {
    var strip = document.getElementById('resume');
    if (!strip) return; // nothing to fill
    var token = readAccessToken();
    if (!token) return; // anonymous: leave hidden

    // Reading list is required; display name is a best-effort bonus.
    Promise.all([
      fetchJson('/api/me/reading?kind=in_progress&limit=1', token),
      fetchJson('/api/me', token),
    ]).then(function (results) {
      var reading = results[0];
      var me = results[1];
      if (!reading || !Array.isArray(reading.items) || reading.items.length < 1) return;
      showResume(reading.items[0], me);
    }).catch(function () { /* leave hidden */ });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hydrateResume);
  } else {
    hydrateResume();
  }
})();
