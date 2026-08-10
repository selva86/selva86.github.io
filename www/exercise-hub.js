/* exercise-hub.js - engagement layer for exercise hubs (post_type: EX).
 *
 * Consumes the markup defined in _build/exercise-hub-contract.md:
 *   <section class="exercise" data-exercise-id data-grade-mode data-difficulty>
 * Replaces engagement.js on EX pages (build.py loads one or the other).
 *
 * Features: auto-grading, persistent progress, progressive hints, Next,
 * difficulty/time labels, expand-by-default + auto-collapse-on-solve,
 * daily streak, completion badge, end-of-hub CTA, honest proof line.
 *
 * No dependencies. All state in localStorage; degrades silently if blocked.
 */
(function () {
  'use strict';

  /* ---------------------------------------------------------------
     Constants
     --------------------------------------------------------------- */
  var PROGRESS_KEY = 'rsc-exercise-hub-v1:' + location.pathname;
  var STREAK_KEY = 'rsc-streak-v1';                       // site-wide
  var DAILY_KEY = 'rsc-daily-v1';                         // solves made today
  var TIME_BY_DIFF = { beginner: 3, intermediate: 5, advanced: 7 };
  var DOTS_BY_DIFF = { beginner: 1, intermediate: 2, advanced: 3 };
  // XP is difficulty-weighted: a hard solve is worth more than an easy one.
  var XP_BY_DIFF = { beginner: 10, intermediate: 25, advanced: 50 };
  function xpWeight(difficulty) {
    return XP_BY_DIFF[String(difficulty || '').toLowerCase()] || 10;
  }
  var COLLAPSE_DELAY = 3400;                              // ms - let the win land
  var SETUP_ERR = /could not find function|object '[^']*' not found/i;

  // Drawn checkmark for the 'correct' verdict - the path animates via CSS.
  var CHECK_SVG = '<svg class="xh-check-svg" viewBox="0 0 24 24" aria-hidden="true">' +
    '<path d="M4 12.5l5 5L20 6"/></svg>';
  // Inline status pill shown beside the Check button, per state.
  var STATUS_CONTENT = {
    running: '<span class="xh-spinner"></span>Checking',
    pass: CHECK_SVG + 'Success!',
    mismatch: '✗ Not a match',
    error: '⚠ Error'
  };

  // Phase 3 (2026-05-28) wired exercise-hub.js to the live D1 backend.
  // The widget now POSTs each first-solve to /api/exercise/<hub>/<id>/attempt
  // when the user is authenticated, hydrates from /api/me/exercises on
  // auth-hydrated, and backfills anon-era localStorage solves on first
  // sign-in via /api/exercise/backfill. Anon users keep working entirely
  // offline against localStorage as before.
  var BACKFILL_FLAG_PREFIX = 'rsc-backfill-done-';     // suffixed with user_id
  var BACKFILL_BATCH_SIZE = 200;
  var LOCALSTORAGE_HUB_PREFIX = 'rsc-exercise-hub-v1:';
  // Module-scope reference so multiple init/hydrate calls cooperate.
  var authToken = null;
  var authedUserId = null;

  /* ---------------------------------------------------------------
     Small helpers
     --------------------------------------------------------------- */
  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function todayStr() { return new Date().toISOString().slice(0, 10); }

  /* Normalize R console text for comparison: drop `#>` prompts, collapse
     whitespace, drop blank lines. Imperfect by design - a mismatch falls
     back to a "compare them" verdict, never a hard failure. */
  function normalizeOutput(text) {
    var t = String(text || '')
      .replace(/×/g, 'x')
      .replace(/…/g, '...')
      .replace(/ /g, ' ');

    // Strip R warning blocks BEFORE collapsing whitespace so we can use
    // line indentation to detect continuation lines. WebR may surface
    // warnings differently from Rscript (the audit captures the latter),
    // and the warning text itself varies by R version. Both sides strip
    // them so the comparison is robust no matter where/whether a warning
    // appears. The warning text stays in the authored expected for
    // pedagogy; only the comparison ignores it.
    var rawLines = t.split('\n');
    var kept = [];
    var inWarning = false;
    for (var i = 0; i < rawLines.length; i++) {
      var raw = rawLines[i];
      var trimmed = raw.trim();
      var classifyable = trimmed.replace(/^#>\s?/, '');
      if (/^(?:Warning message|Warning messages|Warning in\b)/i.test(classifyable)) {
        inWarning = true;
        continue;
      }
      if (inWarning) {
        var preStripped = raw.replace(/^\s*#>\s?/, '');
        if (/^\s+\S/.test(preStripped) || /^\d+:\s+/.test(classifyable) || trimmed === '') {
          continue;
        }
        inWarning = false;
      }
      kept.push(raw);
    }

    return kept
      .map(function (l) {
        return l.replace(/^\s*#>\s?/, '').replace(/\s+/g, ' ').trim();
      })
      .filter(function (l) { return l.length; })
      .join('\n');
  }

  function firstDiffLine(a, b) {
    var la = a.split('\n'), lb = b.split('\n');
    var n = Math.max(la.length, lb.length);
    for (var i = 0; i < n; i++) {
      if (la[i] !== lb[i]) return i + 1;
    }
    return 0;
  }

  /* ---------------------------------------------------------------
     Storage
     --------------------------------------------------------------- */
  var STORE = {
    loadProgress: function () {
      try {
        var d = JSON.parse(localStorage.getItem(PROGRESS_KEY));
        return (d && typeof d.solved === 'object') ? d : { solved: {} };
      } catch (e) { return { solved: {} }; }
    },
    saveProgress: function (d) {
      try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(d)); } catch (e) {}
    },
    loadStreak: function () {
      try {
        var d = JSON.parse(localStorage.getItem(STREAK_KEY));
        if (d && typeof d.days === 'number') return d;
      } catch (e) {}
      return { days: 0, lastVisit: null };
    },
    saveStreak: function (d) {
      try { localStorage.setItem(STREAK_KEY, JSON.stringify(d)); } catch (e) {}
    },
    /* Honest daily micro-goal (item 5): a real count of solves made today. */
    loadDaily: function () {
      try {
        var d = JSON.parse(localStorage.getItem(DAILY_KEY));
        if (d && d.date === todayStr() && typeof d.count === 'number') return d;
      } catch (e) {}
      return { date: todayStr(), count: 0 };
    },
    bumpDaily: function () {
      var d = this.loadDaily();
      d.count = (d.count || 0) + 1; d.date = todayStr();
      try { localStorage.setItem(DAILY_KEY, JSON.stringify(d)); } catch (e) {}
      return d.count;
    }
  };

  /* Derive hub slug from the current URL path. CF Pages strips .html with
     a 308 redirect, so the canonical URL might be /Foo or /Foo.html — accept
     either. Matches the regex used in saved-posts-button.js so server-side
     dedup against save+read endpoints aligns. */
  function hubSlugFromPath() {
    var m = location.pathname.match(/^\/([^\/]+?)(?:\.html?)?\/?$/);
    return m && m[1] ? decodeURIComponent(m[1]) : '';
  }

  /* Read the freshest access token from auth-hydrate.js. This may return
     null even after auth-hydrated fires if the user signed out in another
     tab — every caller treats null as "go anon". */
  function getAuthToken() {
    return (window.__auth && window.__auth.getAccessToken && window.__auth.getAccessToken()) || null;
  }

  /* POST one solve to the server. Best-effort and non-blocking — UI never
     waits on this. keepalive:true lets the request survive a navigation
     started in COLLAPSE_DELAY ms (the auto-collapse + scroll sequence).
     Anon users: silent no-op; their progress lives in localStorage and
     migrates on first sign-in via backfillIfNeeded. */
  function reportSolve(card) {
    if (!authToken) return;
    var hub = hubSlugFromPath();
    if (!hub || !card || !card.id) return;
    var hints = (typeof card.hintsUsed === 'number') ? card.hintsUsed : 0;
    try {
      fetch('/api/exercise/' + encodeURIComponent(hub) +
            '/' + encodeURIComponent(card.id) + '/attempt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + authToken
        },
        body: JSON.stringify({ passed: true, hints_used: hints }),
        keepalive: true
      })
      .then(function (r) {
        // Meter limit: the server said no. Re-sync so the wall renders; the
        // local grade already showed, which is fine - the XP simply cannot be
        // banked past the limit.
        if (r.status === 402) { meterFetch(); return null; }
        return r.ok ? r.json() : null;
      })
      .then(function (result) {
        if (result && result.meter) meterApply(result.meter, card);
        if (result && typeof result.total_xp === 'number') {
          // Avatar dropdown listens for this and refreshes its XP / streak
          // pills without an extra round-trip to /api/me/stats.
          document.dispatchEvent(new CustomEvent('exercise-progress-changed', {
            detail: {
              total_xp: result.total_xp,
              current_streak_days: result.current_streak_days,
              longest_streak_days: result.longest_streak_days
            }
          }));
        }
      })
      .catch(function () {});
    } catch (e) { /* never block the UI on a network error */ }
  }

  /* GET /api/me/exercises?hub=<slug> and merge solved IDs into localStorage
     state, then repaint card UI. Called on auth-hydrated (after backfill).
     Idempotent: marking an already-solved card is a no-op. */
  function hydrateSolvedFromServer() {
    if (!authToken) return Promise.resolve();
    var hub = hubSlugFromPath();
    if (!hub) return Promise.resolve();
    return fetch('/api/me/exercises?hub=' + encodeURIComponent(hub), {
      headers: { 'Authorization': 'Bearer ' + authToken, 'Accept': 'application/json' }
    })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (body) {
      if (!body || !Array.isArray(body.solved)) return;
      var ids = body.solved;
      var dirty = false;
      for (var i = 0; i < ids.length; i++) {
        var id = ids[i];
        if (!progressState.solved[id]) {
          progressState.solved[id] = true;
          dirty = true;
        }
        // Find the card if it's currently rendered on this page.
        for (var c = 0; c < cards.length; c++) {
          var card = cards[c];
          if (card.id === id && !card.solved) {
            card.solved = true;
            card.section.classList.add('is-solved');
          }
        }
      }
      if (dirty) {
        STORE.saveProgress(progressState);
        updateProgress(solvedCount(), totalCount);
        updateXp(false);
        if (solvedCount() >= totalCount && badgeEl) showBadge();
      }
    })
    .catch(function () { /* best-effort */ });
  }

  /* Enumerate every rsc-exercise-hub-v1:* key in localStorage and collect
     {hub, exercise_id} pairs for /api/exercise/backfill. The per-user flag
     ensures this runs at most once per (user, browser) — repeat hydrations
     of the same session skip the round-trip. Account switch: a different
     user_id has its own flag, so backfill re-runs for them. signOut clears
     localStorage entirely (see auth-hydrate.js) to prevent Account B from
     inheriting Account A's anon progress. */
  function collectLocalSolves() {
    var items = [];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (!key || key.indexOf(LOCALSTORAGE_HUB_PREFIX) !== 0) continue;
        var path = key.slice(LOCALSTORAGE_HUB_PREFIX.length);
        // path is the URL pathname for that hub. Derive slug via same regex.
        var m = path.match(/^\/([^\/]+?)(?:\.html?)?\/?$/);
        if (!m || !m[1]) continue;
        var hub = decodeURIComponent(m[1]);
        var data;
        try { data = JSON.parse(localStorage.getItem(key)); } catch (e) { continue; }
        if (!data || !data.solved || typeof data.solved !== 'object') continue;
        for (var ex in data.solved) {
          if (data.solved[ex]) items.push({ hub: hub, exercise_id: ex });
        }
      }
    } catch (e) {}
    return items;
  }

  function backfillIfNeeded(userId) {
    if (!authToken || !userId) return Promise.resolve();
    var flagKey = BACKFILL_FLAG_PREFIX + userId;
    try {
      if (localStorage.getItem(flagKey) === '1') return Promise.resolve();
    } catch (e) {}
    var items = collectLocalSolves();
    if (!items.length) {
      try { localStorage.setItem(flagKey, '1'); } catch (e) {}
      return Promise.resolve();
    }
    // Chunk into batches the server accepts (max 200/call).
    var batches = [];
    for (var i = 0; i < items.length; i += BACKFILL_BATCH_SIZE) {
      batches.push(items.slice(i, i + BACKFILL_BATCH_SIZE));
    }
    return batches.reduce(function (p, batch) {
      return p.then(function () {
        return fetch('/api/exercise/backfill', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken
          },
          body: JSON.stringify({ items: batch })
        }).then(function (r) { return r.ok ? r.json() : null; });
      });
    }, Promise.resolve()).then(function (lastResult) {
      try { localStorage.setItem(flagKey, '1'); } catch (e) {}
      if (lastResult && typeof lastResult.total_xp === 'number') {
        document.dispatchEvent(new CustomEvent('exercise-progress-changed', {
          detail: {
            total_xp: lastResult.total_xp,
            current_streak_days: lastResult.current_streak_days,
            longest_streak_days: lastResult.longest_streak_days
          }
        }));
      }
    }).catch(function () { /* leave flag unset so we retry next session */ });
  }

  /* Top-level hook: backfill first (so XP for anon solves is awarded
     before /api/me/exercises is queried), then hydrate card UI. */
  function onAuthHydrated(ev) {
    var detail = ev && ev.detail || {};
    var newToken = detail.token || null;
    var newUserId = (detail.me && detail.me.user && detail.me.user.id) || null;
    authToken = newToken;
    authedUserId = newUserId;
    if (!newToken || !newUserId) return; // anon path: nothing more to do
    backfillIfNeeded(newUserId).then(hydrateSolvedFromServer).then(meterFetch);
  }
  /* ---------------------------------------------------------------
     Practice meter (flag:exercise-meter). Displays the server-side
     allowance: an always-visible pill in the progress-map head, a
     one-time explainer, and the wall when this hub cannot be attempted.
     Renders only for signed-in FREE users while the flag is on:
     /api/me/meter returns metered:false otherwise and nothing here
     leaves a trace. Anonymous visitors are untouched by design.
     Spec: Plans/free-user-onboarding-plan.md s4 + the approved simulator.
     --------------------------------------------------------------- */
  var meterState = null;
  var meterPillEl = null, meterWallEl = null, meterIntroEl = null;
  var METER_INTRO_KEY = 'rsc-meter-intro-v1';

  function meterWalled() {
    return !!(meterState && meterState.metered && meterState.hub_open === false);
  }

  function meterFetch() {
    if (!authToken) return;
    var hub = hubSlugFromPath();
    if (!hub) return;
    fetch('/api/me/meter?hub=' + encodeURIComponent(hub), {
      headers: { 'Authorization': 'Bearer ' + authToken, 'Accept': 'application/json' }
    })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (body) { if (body) { meterState = body; meterRender(); } })
    .catch(function () { /* display only; never interfere */ });
  }

  function meterResetLabel() {
    var iso = meterState && meterState.resets;
    if (!iso) return 'the 1st';
    var d = new Date(iso + 'T00:00:00Z');
    var M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
             'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return M[d.getUTCMonth()] + ' ' + d.getUTCDate();
  }

  function meterRender() {
    var s = meterState;
    if (!s || !s.metered) {
      if (meterPillEl) { meterPillEl.remove(); meterPillEl = null; }
      if (meterWallEl) { meterWallEl.remove(); meterWallEl = null; }
      document.documentElement.classList.remove('xh-meter-walled');
      return;
    }
    var head = document.querySelector('.xh-map-head');
    if (head) {
      if (!meterPillEl) {
        meterPillEl = document.createElement('span');
        head.insertBefore(meterPillEl, head.querySelector('.xh-map-count'));
      }
      if (s.hub_started) {
        meterPillEl.className = 'xh-meter is-open';
        meterPillEl.innerHTML = 'This hub stays open until ' + meterResetLabel();
      } else {
        meterPillEl.className = 'xh-meter' + (s.left <= 5 ? ' is-low' : '');
        var segs = '';
        for (var i = 0; i < 5; i++) {
          var fill = Math.max(0, Math.min(5, s.left - i * 5)) / 5;
          segs += '<span class="xh-meter-seg"><i style="transform:scaleY(' + fill + ')"></i></span>';
        }
        meterPillEl.innerHTML =
          '<span class="xh-meter-segs" aria-hidden="true">' + segs + '</span>' +
          '<b>' + s.left + '</b>&nbsp;of ' + s.limit + ' left this month' +
          '<span class="xh-meter-reset">resets ' + meterResetLabel() + '</span>';
      }
    }
    meterIntroRender();
    meterWallRender();
  }

  /* One-time "how free practice works" card, above the progress map. */
  function meterIntroRender() {
    if (!meterState || !meterState.metered || meterWalled() || meterIntroEl) return;
    var seen = null;
    try { seen = localStorage.getItem(METER_INTRO_KEY); } catch (e) { /* private mode */ }
    if (seen) return;
    var anchor = mapEl || document.querySelector('section.exercise');
    if (!anchor || !anchor.parentElement) return;
    meterIntroEl = document.createElement('div');
    meterIntroEl.className = 'xh-meter-intro';
    meterIntroEl.innerHTML =
      '<div class="xh-meter-intro-body"><b>How free practice works</b>' +
      '<p>You get 25 graded exercises a month. Any hub you start stays open until ' +
      'the month ends, so you can always finish what you began.</p></div>' +
      '<button type="button" class="xh-meter-intro-ok">Got it</button>';
    meterIntroEl.querySelector('.xh-meter-intro-ok').addEventListener('click', function () {
      try { localStorage.setItem(METER_INTRO_KEY, '1'); } catch (e) { /* fine */ }
      meterIntroEl.remove();
      meterIntroEl = null;
    });
    anchor.parentElement.insertBefore(meterIntroEl, anchor);
  }

  /* The wall: an achievement screen, never an error. Renders above the first
     exercise when this hub cannot be attempted this month. */
  function meterWallRender() {
    var walled = meterWalled();
    document.documentElement.classList.toggle('xh-meter-walled', walled);
    if (!walled) {
      if (meterWallEl) { meterWallEl.remove(); meterWallEl = null; }
      return;
    }
    if (meterWallEl) return;
    var first = document.querySelector('section.exercise');
    if (!first || !first.parentElement) return;
    var s = meterState;
    var open = s.open_hubs || [];
    var openLine = open.length
      ? 'The ' + open.length + ' hub' + (open.length === 1 ? '' : 's') +
        ' you started this month, until ' + meterResetLabel()
      : 'Your reading position and streak, everywhere';
    meterWallEl = document.createElement('div');
    meterWallEl.className = 'xh-meter-wall';
    meterWallEl.setAttribute('role', 'status');
    meterWallEl.innerHTML =
      '<div class="xh-meter-wall-head">' +
      '<div class="xh-meter-wall-title">That&#39;s all ' + s.limit + ' for this month</div>' +
      '<div class="xh-meter-wall-sub">A full month of practice, done.</div></div>' +
      '<div class="xh-meter-wall-body">' +
      '<div class="xh-meter-wall-h">Still open right now</div>' +
      '<ul class="xh-meter-wall-list">' +
      '<li>' + openLine + '</li>' +
      '<li>Every lesson and every tutorial, always</li>' +
      '<li>A fresh ' + s.limit + ' on ' + meterResetLabel() + '</li></ul>' +
      '<div class="xh-meter-wall-cta">' +
      '<a class="xh-meter-wall-pro" href="/pricing.html">Go Pro for unlimited practice</a>' +
      '<a class="xh-meter-wall-free" href="/tutorials/">Keep learning free</a></div>' +
      '<div class="xh-meter-wall-note">Your streak and XP are safe either way.</div>' +
      '</div>';
    first.parentElement.insertBefore(meterWallEl, first);
  }

  /* Live update from the attempt response; adds the scarce inline note to the
     just-graded card when 5 or fewer remain. */
  function meterApply(m, card) {
    if (!meterState) meterState = { metered: true, resets: '', open_hubs: [] };
    meterState.metered = true;
    meterState.limit = m.limit;
    meterState.left = m.left;
    meterState.used = m.used;
    meterState.hub_started = true;
    meterState.hub_open = true;
    meterRender();
    if (m.left <= 5 && card && card.verdict) {
      var vbody = card.verdict.querySelector('.xh-verdict-body');
      if (vbody && !vbody.querySelector('.xh-meter-inline')) {
        vbody.insertAdjacentHTML('beforeend',
          '<span class="xh-meter-inline"> &middot; ' + m.left + ' of ' + m.limit +
          ' left this month</span>');
      }
    }
  }

  document.addEventListener('auth-hydrated', onAuthHydrated);

  /* Bump the site-wide streak for today's visit. */
  function updateStreak() {
    var s = STORE.loadStreak();
    var today = todayStr();
    if (s.lastVisit === today) return s.days || 1;
    if (s.lastVisit) {
      var gap = (new Date(today) - new Date(s.lastVisit)) / 86400000;
      s.days = (gap === 1) ? (s.days + 1) : 1;
    } else {
      s.days = 1;
    }
    s.lastVisit = today;
    STORE.saveStreak(s);
    return s.days;
  }

  /* ---------------------------------------------------------------
     Sidebar walk - find the next tutorial after this page (for the CTA)
     --------------------------------------------------------------- */
  function discoverNext() {
    var current = location.pathname.split('/').pop();
    var links = Array.prototype.slice.call(
      document.querySelectorAll('#nav a, .col-sm-3 a'));
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href') || '';
      if (href && (href === current || href.indexOf(current) >= 0)) {
        for (var j = i + 1; j < links.length; j++) {
          var nh = links[j].getAttribute('href') || '';
          if (nh && nh.indexOf('.html') !== -1 && nh !== current) {
            return { url: nh, title: links[j].textContent.trim() };
          }
        }
        break;
      }
    }
    return null;
  }

  /* ---------------------------------------------------------------
     Hub-level meta strip (engagement.js does this on non-EX pages;
     it is not loaded here, so we render it ourselves).
     --------------------------------------------------------------- */
  function renderMetaStrip() {
    var meta = document.querySelector('.engagement-header');
    if (!meta) return;
    var diff = meta.getAttribute('data-difficulty');
    var time = meta.getAttribute('data-time');
    var exc = meta.getAttribute('data-exercises');
    // XP total is difficulty-weighted straight from the exercises, so it
    // always agrees with what the status bar awards (xpWeight is the SSOT;
    // the build-time data-xp attribute is a flat estimate and is ignored).
    var xp = 0;
    var exs = document.querySelectorAll('section.exercise');
    for (var x = 0; x < exs.length; x++) {
      xp += xpWeight(exs[x].getAttribute('data-difficulty'));
    }
    var parts = [];
    if (diff) {
      parts.push('<span class="engagement-meta-diff engagement-meta-diff-' +
        escapeHtml(diff.toLowerCase().replace(/[^a-z]/g, '')) + '">' +
        escapeHtml(diff) + '</span>');
    }
    if (time) parts.push('<span class="engagement-meta-time">~ ' + escapeHtml(time) + ' min</span>');
    if (exc) parts.push('<span class="engagement-meta-count">' + escapeHtml(exc) + ' exercises</span>');
    if (xp) parts.push('<span class="engagement-meta-xp">' + xp.toLocaleString() + ' XP</span>');
    if (parts.length) meta.innerHTML = parts.join('<span class="engagement-meta-dot">&middot;</span>');
  }

  /* ---------------------------------------------------------------
     Status bar - streak + progress + honest proof line
     --------------------------------------------------------------- */
  // Progress map (replaces the old streak/XP/flat-progress .xh-statusbar).
  var mapEl, mapCountEl, mapContinueEl, mapGoalEl;
  var mapLanes = [];        // { el, countEl, railFill, cards:[{node,id}], n }
  var xpNumEl = null, xpGainEl = null;   // XP now lives in the masthead + account
  var DAILY_GOAL = 3;       // honest daily micro-goal (item 5)
  var _painted = {};        // ids already shown solved (drives the node pop)
  var AUTO_HINT_AFTER = 2;  // reveal hint 1 after this many failed checks

  /* The progress map is a top-of-page overview, not a pinned bar - no sticky. */

  function cleanHeading(el) {
    var raw = (el.textContent || '').replace(/^\s*#\s*/, '').trim();
    var m = raw.match(/^Section\s+(\d+)\s*[.:]?\s*(.+?)\s*(?:\([^)]*\))?\s*$/i);
    if (m) return { num: m[1], name: m[2].trim() };
    return { num: '', name: raw.replace(/\s*\([^)]*\)\s*$/, '') };
  }

  /* Build the section-lanes progress map: one lane per section heading, one
     node per exercise, in the sidebar's node + rail + green-tick language.
     Runs before cards are enhanced, so node clicks resolve the card by id at
     click time. Falls back to a single unlabelled rail if a hub has no section
     headings (none currently do). */
  function buildStatusBar(total, streakDays) {
    var content = document.querySelector('#content') || document.body;
    var groups = [];
    var curr = null;
    var els = content.querySelectorAll('h2, section.exercise');
    Array.prototype.forEach.call(els, function (el) {
      if (el.classList && el.classList.contains('exercise')) {
        var id = el.getAttribute('data-exercise-id');
        if (!id) return;
        if (!curr) { curr = { head: null, cards: [] }; groups.push(curr); }
        curr.cards.push(id);
      } else {
        curr = { head: cleanHeading(el), cards: [] };
        groups.push(curr);
      }
    });
    groups = groups.filter(function (g) { return g.cards.length; });
    if (!groups.length) return;
    var single = groups.length === 1 && (!groups[0].head || !groups[0].head.name);

    mapEl = document.createElement('div');
    mapEl.className = 'xh-map' + (single ? ' xh-map-single' : '');
    mapEl.setAttribute('role', 'group');
    var head = document.createElement('div');
    head.className = 'xh-map-head';
    head.innerHTML =
      '<span class="xh-map-eyebrow">Your progress</span>' +
      '<span class="xh-map-goal" hidden></span>' +
      '<span class="xh-map-count"><b>0</b> of ' + total + ' solved</span>' +
      '<button type="button" class="xh-map-continue"></button>';
    mapEl.appendChild(head);
    mapCountEl = head.querySelector('.xh-map-count');
    mapGoalEl = head.querySelector('.xh-map-goal');
    mapContinueEl = head.querySelector('.xh-map-continue');
    mapContinueEl.addEventListener('click', continueToNext);

    var lanesWrap = document.createElement('div');
    lanesWrap.className = 'xh-map-lanes';
    mapLanes = [];
    groups.forEach(function (g, gi) {
      var idxTxt = (g.head && g.head.num) ? g.head.num : String(gi + 1);
      var name = (g.head && g.head.name) ? g.head.name : '';
      var lane = document.createElement('div');
      lane.className = 'xh-lane';
      lane.innerHTML =
        (single ? '' :
          '<span class="xh-lane-idx">' + escapeHtml(idxTxt) + '</span>' +
          '<span class="xh-lane-name">' + escapeHtml(name) + '</span>') +
        '<span class="xh-lane-nodes"><span class="xh-rail-bg"></span>' +
        '<span class="xh-rail-fill"></span></span>' +
        '<span class="xh-lane-count">0/' + g.cards.length + '</span>';
      var nodesHost = lane.querySelector('.xh-lane-nodes');
      var rec = { el: lane, countEl: lane.querySelector('.xh-lane-count'),
                  railFill: lane.querySelector('.xh-rail-fill'), cards: [], n: g.cards.length };
      g.cards.forEach(function (id, i) {
        var node = document.createElement('button');
        node.type = 'button';
        node.className = 'xh-node';
        node.setAttribute('data-ex-id', id);
        node.setAttribute('aria-label', 'Go to exercise ' + idxTxt + '.' + (i + 1));
        node.addEventListener('click', function () { jumpToExercise(id); });
        nodesHost.appendChild(node);
        rec.cards.push({ node: node, id: id });
      });
      mapLanes.push(rec);
      lanesWrap.appendChild(lane);
    });
    mapEl.appendChild(lanesWrap);

    // Place the map after the intro (title, lead, byline, setup), just before
    // the exercises begin - so the H1 keeps leading instead of being pushed
    // down. Anchor on the first section heading, else the first exercise.
    var h1 = content.querySelector('h1');
    var anchor = content.querySelector('#content h2, main h2, .exercise-hub h2') ||
                 content.querySelector('h2') ||
                 content.querySelector('section.exercise');
    if (anchor && anchor.parentElement) anchor.parentElement.insertBefore(mapEl, anchor);
    else if (h1 && h1.parentElement) h1.parentElement.insertBefore(mapEl, h1);
    else content.insertBefore(mapEl, content.firstChild);
  }

  function openAndScroll(card) {
    setCardOpen(card.section, true);
    var h = card.section.querySelector('.xh-ex-head');
    if (h) h.setAttribute('aria-expanded', 'true');
    var y = card.section.getBoundingClientRect().top + window.scrollY - 76;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }
  function cardById(id) {
    for (var i = 0; i < cards.length; i++) if (cards[i].id === id) return cards[i];
    return null;
  }
  function jumpToExercise(id) {
    var c = cardById(id);
    if (c) { openAndScroll(c); return; }
    var sec = document.querySelector('section.exercise[data-exercise-id="' + id + '"]');
    if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function continueToNext() {
    for (var i = 0; i < cards.length; i++) {
      if (!cards[i].solved) { openAndScroll(cards[i]); return; }
    }
  }

  function isSolvedId(id) {
    for (var i = 0; i < cards.length; i++) if (cards[i].id === id) return !!cards[i].solved;
    return !!(progressState && progressState.solved && progressState.solved[id]);
  }
  function popNode(node) {
    node.classList.remove('xh-node-pop'); void node.offsetWidth; node.classList.add('xh-node-pop');
  }
  function updateProgress(solved, total) {
    if (!mapEl) return;
    var overall = 0;
    mapLanes.forEach(function (lane) {
      var k = 0;
      lane.cards.forEach(function (c) {
        var s = isSolvedId(c.id);
        c.node.classList.toggle('solved', s);
        if (s && !_painted[c.id]) { popNode(c.node); _painted[c.id] = true; }
        if (s) k++;
      });
      lane.countEl.textContent = k + '/' + lane.n;
      lane.el.classList.toggle('is-done', lane.n > 0 && k === lane.n);
      var frac = lane.n > 1 ? (k > 0 ? (k - 1) / (lane.n - 1) : 0) : (k > 0 ? 1 : 0);
      lane.railFill.style.width = 'calc((100% - 16px) * ' + frac + ')';
      overall += k;
    });
    if (mapCountEl) mapCountEl.querySelector('b').textContent = overall;
    mapEl.setAttribute('aria-label', overall + ' of ' + total + ' exercises solved');
    updateGoal();
    updateContinue(overall, total);
  }
  function updateContinue(solved, total) {
    if (!mapContinueEl) return;
    if (solved >= total) { mapContinueEl.hidden = true; return; }
    mapContinueEl.hidden = false;
    mapContinueEl.innerHTML = (solved === 0 ? 'Start solving'
      : 'Continue <span class="xh-cont-sep">&middot;</span> ' + (total - solved) + ' to go') +
      ' <span class="xh-cont-arrow" aria-hidden="true">&rarr;</span>';
  }
  function updateGoal() {
    if (!mapGoalEl) return;
    var n = STORE.loadDaily().count || 0;
    if (n <= 0) { mapGoalEl.hidden = true; return; }
    mapGoalEl.hidden = false;
    if (n >= DAILY_GOAL) {
      mapGoalEl.className = 'xh-map-goal is-met';
      mapGoalEl.innerHTML = '<span aria-hidden="true">&#10003;</span> Daily goal';
    } else {
      mapGoalEl.className = 'xh-map-goal';
      mapGoalEl.textContent = 'Today ' + n + ' / ' + DAILY_GOAL;
    }
  }

  /* Pulse the overall solved-count when a solve registers. */
  function pulseProgress() {
    if (!mapCountEl) return;
    var b = mapCountEl.querySelector('b');
    if (!b) return;
    b.classList.remove('xh-bump');
    void b.offsetWidth;
    b.classList.add('xh-bump');
  }

  /* The newly-solved node's pop is handled in updateProgress (see popNode). */
  function surgeProgressFill() {}

  /* Total XP from solved cards - difficulty-weighted, derived from solved
     state on each render (never stored separately). */
  function xpEarned() {
    var n = 0;
    for (var i = 0; i < cards.length; i++) {
      if (cards[i].solved) n += cards[i].xp;
    }
    return n;
  }

  /* Refresh the XP chip. On a solve (animate=true) the number bumps and a
     floating "+N XP" rises off the chip. */
  var xpShown = 0;
  function updateXp(animate) {
    if (!xpNumEl) return;
    var earned = xpEarned();
    var prev = xpShown;
    xpShown = earned;
    xpNumEl.textContent = earned.toLocaleString();
    if (!animate || earned <= prev) return;
    xpNumEl.classList.remove('xh-bump');
    void xpNumEl.offsetWidth;
    xpNumEl.classList.add('xh-bump');
    if (xpGainEl) {
      xpGainEl.textContent = '+' + (earned - prev) + ' XP';
      xpGainEl.classList.remove('is-shown');
      void xpGainEl.offsetWidth;
      xpGainEl.classList.add('is-shown');
    }
  }

  /* milestone toast at 25 / 50 / 75 percent solved (100% is the badge). */
  var milestoneEl;
  function showMilestone(text) {
    if (!milestoneEl) {
      milestoneEl = document.createElement('div');
      milestoneEl.className = 'xh-milestone';
      milestoneEl.setAttribute('role', 'status');
      document.body.appendChild(milestoneEl);
    }
    milestoneEl.textContent = text;
    void milestoneEl.offsetWidth;
    milestoneEl.classList.add('is-shown');
    clearTimeout(milestoneEl._t);
    milestoneEl._t = setTimeout(function () {
      milestoneEl.classList.remove('is-shown');
    }, 2800);
  }
  function checkMilestone(solved, total) {
    if (!total) return;
    if (!progressState.milestones) progressState.milestones = {};
    var marks = [
      { key: '75', at: 0.75, msg: 'Almost done' },
      { key: '50', at: 0.50, msg: 'Halfway there' },
      { key: '25', at: 0.25, msg: 'Quarter done' }
    ];
    var pct = solved / total;
    for (var i = 0; i < marks.length; i++) {
      var m = marks[i];
      if (pct >= m.at && !progressState.milestones[m.key]) {
        progressState.milestones[m.key] = true;
        STORE.saveProgress(progressState);
        showMilestone(m.msg + ' (' + solved + ' / ' + total + ')');
        return;
      }
    }
  }

  /* ---------------------------------------------------------------
     Difficulty pill - neutral dot rating (green/red are reserved for
     correctness verdicts, see audit item A1).
     --------------------------------------------------------------- */
  function difficultyPill(difficulty) {
    var key = (difficulty || '').toLowerCase();
    var filled = DOTS_BY_DIFF[key] || 0;
    if (!filled) return '';
    var dots = '';
    for (var i = 0; i < 3; i++) {
      dots += (i < filled) ? '<i></i>' : '<i class="xh-dot-off"></i>';
    }
    var label = key.charAt(0).toUpperCase() + key.slice(1);
    return '<span class="xh-diff" title="Difficulty: ' + escapeHtml(label) + '">' +
      '<span class="xh-diff-dots" aria-hidden="true">' + dots + '</span>' +
      escapeHtml(label) + '</span>';
  }

  /* ---------------------------------------------------------------
     Card enhancement
     --------------------------------------------------------------- */
  var cards = [];   // { section, body, verdict, id, mode, solved }

  /* Group the body into three zones - problem, workspace, help - so the card
     guides the eye: read the problem, do the work, reach for help if stuck. */
  function buildZones(card, body) {
    var problem = document.createElement('div');
    problem.className = 'xh-zone xh-zone-problem';
    var work = document.createElement('div');
    work.className = 'xh-zone xh-zone-work';
    var help = document.createElement('div');
    help.className = 'xh-zone xh-zone-help';

    var task = body.querySelector('.exercise-task');
    var expected = body.querySelector('.exercise-expected');
    if (task) problem.appendChild(task);
    if (expected) problem.appendChild(expected);

    if (card.yourTurn) work.appendChild(card.yourTurn);
    else if (card.staticTurn) work.appendChild(card.staticTurn);
    var checkRow = body.querySelector('.xh-check-row');
    if (checkRow) work.appendChild(checkRow);
    if (card.verdict) work.appendChild(card.verdict);

    var hints = body.querySelector('.xh-hints');
    if (hints) help.appendChild(hints);
    var solution = body.querySelector('details.exercise-solution');
    if (solution) help.appendChild(solution);

    var foot = body.querySelector('.xh-ex-foot');
    var dsrc = body.querySelector('.xh-difficulty-src');
    if (dsrc) dsrc.remove();

    // The body folds via a grid-row height animation, which needs exactly one
    // clipping child - wrap every zone in .xh-ex-inner.
    var inner = document.createElement('div');
    inner.className = 'xh-ex-inner';
    inner.appendChild(problem);
    inner.appendChild(work);
    if (help.childNodes.length) inner.appendChild(help);
    if (foot) inner.appendChild(foot);
    body.appendChild(inner);
  }

  /* Fold a card body open or shut with a height animation. Before the card
     gets .xh-anim (first paint) it just toggles the class, so nothing
     animates on load. CSS owns the resting state (height:0 / auto). */
  function setCardOpen(section, open) {
    var body = section.querySelector('.xh-ex-body');
    var isOpen = section.classList.contains('is-open');
    if (!body || !section.classList.contains('xh-anim')) {
      section.classList.toggle('is-open', open);
      return;
    }
    if (isOpen === open) return;
    var start = body.getBoundingClientRect().height;
    section.classList.toggle('is-open', open);
    var end = open ? body.scrollHeight : 0;
    body.style.height = start + 'px';
    body.offsetHeight;                       // force reflow so the next set transitions
    body.style.height = end + 'px';
    var timer;
    var settle = function (e) {
      if (e && e.target !== body) return;    // ignore the inner's opacity transition
      body.style.height = '';                // hand the resting size back to CSS
      body.removeEventListener('transitionend', settle);
      clearTimeout(timer);
    };
    body.addEventListener('transitionend', settle);
    timer = setTimeout(settle, 480);         // fallback if transitionend is missed
  }

  function enhanceSection(section, index, total, progress) {
    var id = section.getAttribute('data-exercise-id') || ('ex-' + index);
    var mode = section.getAttribute('data-grade-mode') || 'output-compare';
    var difficulty = section.getAttribute('data-difficulty') || '';
    var solved = !!progress.solved[id];

    section.classList.add('xh-card');
    section.classList.add(solved ? 'is-solved' : 'is-open');

    // Heading: keep the <h3> for document outline; the clickable trigger is
    // a <button> nested inside it (the WAI-ARIA accordion pattern).
    var h3 = section.querySelector('.exercise-title');
    var fullTitle = h3 ? h3.textContent.trim() : ('Exercise ' + (index + 1));
    var split = fullTitle.split(/:\s*/);
    var exNum = (split.length > 1) ? split.shift() : '';
    var exName = split.join(': ');

    var bodyId = 'xh-body-' + id;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'xh-ex-head';
    btn.setAttribute('aria-expanded', solved ? 'false' : 'true');
    btn.setAttribute('aria-controls', bodyId);
    btn.innerHTML =
      (exNum ? '<span class="xh-ex-num">' + escapeHtml(exNum) + '</span>' : '') +
      '<span class="xh-ex-name">' + escapeHtml(exName) + '</span>' +
      difficultyPill(difficulty) +
      '<span class="xh-time">⏱ ' +
        (TIME_BY_DIFF[difficulty.toLowerCase()] || 4) + ' min</span>' +
      '<span class="xh-state" aria-hidden="true">✓</span>' +
      '<span class="xh-chevron" aria-hidden="true">▾</span>';

    if (h3) {
      h3.textContent = '';
      h3.appendChild(btn);
    }

    // Body: everything in the section except the heading.
    var body = document.createElement('div');
    body.className = 'xh-ex-body';
    body.id = bodyId;
    var node = section.firstChild;
    while (node) {
      var next = node.nextSibling;
      if (node !== h3) body.appendChild(node);
      node = next;
    }
    section.appendChild(body);

    // Hide the redundant visible "Difficulty:" line (the pill replaces it).
    var ps = body.querySelectorAll('p');
    for (var p = 0; p < ps.length; p++) {
      if (/^\s*Difficulty:/.test(ps[p].textContent)) {
        ps[p].classList.add('xh-difficulty-src');
        break;
      }
    }

    // Your-turn block = the first webr-container not inside the solution.
    var yourTurn = null;
    var containers = body.querySelectorAll('.webr-container');
    for (var c = 0; c < containers.length; c++) {
      if (!containers[c].closest('details')) { yourTurn = containers[c]; break; }
    }

    // Static hubs (webr: false) have no webr-container - the Your-turn block
    // is a plain <pre><code class="language-r">. Find it so the card still has
    // a workspace; such cards get a "Mark as done" control, not auto-grading.
    var staticTurn = null;
    if (!yourTurn) {
      var pres = body.querySelectorAll('pre');
      for (var sp = 0; sp < pres.length; sp++) {
        if (pres[sp].closest('details') ||
            pres[sp].closest('.exercise-expected')) continue;
        var sc = pres[sp].querySelector('code');
        if (sc && /\blanguage-r\b/.test(sc.className || '')) {
          staticTurn = pres[sp];
          break;
        }
      }
    }

    // Verdict region - aria-live so screen readers announce the result.
    var verdict = document.createElement('div');
    verdict.className = 'xh-verdict';
    verdict.setAttribute('role', 'status');
    verdict.setAttribute('aria-live', 'polite');

    // "Check answer" - runs the code AND grades it. Plain Run (the webr
    // button / Ctrl+Enter) just executes, so the learner can experiment
    // without a verdict on every run.
    var checkBtn = null, checkStatus = null, doneBtn = null;
    if (yourTurn) {
      var checkRow = document.createElement('div');
      checkRow.className = 'xh-check-row';
      checkBtn = document.createElement('button');
      checkBtn.type = 'button';
      checkBtn.className = 'xh-check-btn';
      checkBtn.textContent = 'Check answer';
      checkStatus = document.createElement('span');
      checkStatus.className = 'xh-check-status';
      checkStatus.setAttribute('role', 'status');
      checkRow.appendChild(checkBtn);
      checkRow.appendChild(checkStatus);
      yourTurn.after(checkRow);
      checkRow.after(verdict);
    } else if (staticTurn) {
      // No runnable block - this exercise cannot be auto-graded. Give the
      // learner a self-reported completion control instead.
      var doneRow = document.createElement('div');
      doneRow.className = 'xh-check-row';
      doneBtn = document.createElement('button');
      doneBtn.type = 'button';
      doneBtn.className = 'xh-done-btn';
      doneBtn.textContent = solved ? '✓ Marked done' : 'Mark as done';
      doneBtn.disabled = solved;
      doneRow.appendChild(doneBtn);
      staticTurn.after(doneRow);
      doneRow.after(verdict);
    } else {
      body.appendChild(verdict);
    }

    // Progressive hints (if authored) - placed before the solution.
    buildHints(section, body, verdict);

    // Solution disclosure - cleaner label that reflects open/closed state.
    var solDetails = body.querySelector('details.exercise-solution');
    if (solDetails) {
      var solSummary = solDetails.querySelector('summary');
      if (solSummary) {
        solSummary.textContent = 'Reveal solution';
        solDetails.addEventListener('toggle', function () {
          solSummary.textContent = solDetails.open ? 'Hide solution' : 'Reveal solution';
        });
      }
    }

    // Footer with the Next button.
    var foot = document.createElement('div');
    foot.className = 'xh-ex-foot';
    var nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'xh-next';
    nextBtn.innerHTML = 'Next exercise <span class="xh-next-arrow">→</span>';
    foot.appendChild(nextBtn);
    body.appendChild(foot);

    var card = {
      section: section, body: body, verdict: verdict, checkBtn: checkBtn,
      checkStatus: checkStatus, doneBtn: doneBtn,
      id: id, mode: mode, solved: solved, yourTurn: yourTurn,
      staticTurn: staticTurn, xp: xpWeight(difficulty)
    };
    cards.push(card);
    buildZones(card, body);

    // Header toggles the card.
    btn.addEventListener('click', function () {
      var open = !section.classList.contains('is-open');
      setCardOpen(section, open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    // Next button.
    nextBtn.addEventListener('click', function () {
      setCardOpen(section, false);
      btn.setAttribute('aria-expanded', 'false');
      var nextCard = cards[index + 1];
      if (nextCard) {
        setCardOpen(nextCard.section, true);
        nextCard.section.querySelector('.xh-ex-head')
          .setAttribute('aria-expanded', 'true');
        nextCard.section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (badgeEl) {
        badgeEl.scrollIntoView({ behavior: 'smooth' });
      }
    });

    return card;
  }

  /* Build the progressive hint ladder from <div class="exercise-hints">. */
  function buildHints(section, body, verdict) {
    var src = body.querySelector('.exercise-hints');
    if (!src) return;
    var hintEls = src.querySelectorAll('p');
    if (!hintEls.length) { src.remove(); return; }
    var hints = Array.prototype.map.call(hintEls, function (el) {
      return el.innerHTML;
    });
    src.remove();

    var wrap = document.createElement('div');
    wrap.className = 'xh-hints';
    var bar = document.createElement('div');
    bar.className = 'xh-hintbar';
    bar.innerHTML = '<span class="xh-hintbar-label">Stuck?</span>';
    wrap.appendChild(bar);

    hints.forEach(function (htmlText, h) {
      var link = document.createElement('button');
      link.type = 'button';
      link.className = 'xh-hint-link';
      link.textContent = 'Show hint ' + (h + 1);
      if (h > 0) link.disabled = true;          // unlock sequentially
      bar.appendChild(link);

      var panel = document.createElement('div');
      panel.className = 'xh-hint';
      panel.hidden = true;
      panel.innerHTML = '<b>Hint ' + (h + 1) + '</b>' + htmlText;
      wrap.appendChild(panel);

      link.addEventListener('click', function () {
        panel.hidden = false;
        link.disabled = true;
        link.textContent = 'Hint ' + (h + 1) + ' shown';
        var nextLink = bar.querySelectorAll('.xh-hint-link')[h + 1];
        if (nextLink) nextLink.disabled = false;
        // Track hints used per card so reportSolve can include it in the
        // attempt payload (analytics only — no XP penalty per 2026-05-28
        // decision).
        var hostCard = null;
        for (var ci = 0; ci < cards.length; ci++) {
          if (cards[ci].section === section) { hostCard = cards[ci]; break; }
        }
        if (hostCard) {
          hostCard.hintsUsed = (hostCard.hintsUsed || 0) + 1;
        }
      });
    });

    // Place the ladder before the solution <details>, else before the footer.
    var solution = body.querySelector('details.exercise-solution') ||
                   body.querySelector('details');
    if (solution) solution.parentNode.insertBefore(wrap, solution);
    else verdict.after(wrap);
  }

  /* ---------------------------------------------------------------
     Grading
     --------------------------------------------------------------- */
  function setVerdict(card, state, icon, msg, detail) {
    // inline pill beside the Check button - the at-a-glance status
    if (card.checkStatus) {
      card.checkStatus.className = 'xh-check-status is-shown is-' + state;
      card.checkStatus.innerHTML = STATUS_CONTENT[state] || '';
    }
    // the verdict box carries the detail; show it only when there is detail
    var v = card.verdict;
    if (detail) {
      v.className = 'xh-verdict is-shown is-' + state;
      v.innerHTML =
        '<span class="xh-verdict-icon" aria-hidden="true">' + icon + '</span>' +
        '<span class="xh-verdict-body">' + escapeHtml(msg) +
        '<span class="xh-verdict-detail">' + detail + '</span></span>';
    } else {
      v.className = 'xh-verdict';
      v.innerHTML = '';
    }
  }

  function hideVerdict(card) {
    card.verdict.className = 'xh-verdict';
    card.verdict.innerHTML = '';
    if (card.checkStatus) {
      card.checkStatus.className = 'xh-check-status';
      card.checkStatus.innerHTML = '';
    }
  }

  function expectedText(card) {
    var pre = card.section.querySelector('.exercise-expected pre');
    return pre ? pre.textContent : '';
  }

  function runSetupAndRetry() {
    var prelude = document.querySelector('.webr-container');
    if (!prelude) return;
    var runBtn = prelude.querySelector('.webr-run-btn');
    if (runBtn) runBtn.click();
  }

  function grade(card) {
    var outEl = card.yourTurn && card.yourTurn.querySelector('.webr-output');
    if (!outEl) return;
    var cls = outEl.className || '';
    var text = outEl.textContent || '';

    // Error path.
    if (cls.indexOf('has-error') !== -1) {
      if (SETUP_ERR.test(text)) {
        setVerdict(card, 'error', '⚠',
          'Looks like the setup has not run yet.',
          'Run the setup block at the top of the page, then run this again.');
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'xh-setup-btn';
        btn.textContent = 'Run setup now';
        btn.addEventListener('click', runSetupAndRetry);
        card.verdict.querySelector('.xh-verdict-body').appendChild(btn);
      } else {
        setVerdict(card, 'error', '✗',
          'Your code raised an error.',
          'Read the message above, fix it, and run again.');
        registerFail(card);
      }
      return;
    }

    // Self-check: no machine verdict possible - confirm the run, mark done.
    if (card.mode !== 'output-compare') {
      setVerdict(card, 'pass', CHECK_SVG,
        'Ran. Compare your output with the expected result above.',
        'This exercise is self-checked: you decide if it matches.');
      markSolved(card);
      return;
    }

    // Output-compare.
    var got = normalizeOutput(text);
    var want = normalizeOutput(expectedText(card));
    if (!got) {
      setVerdict(card, 'running', '…', 'Waiting for output…');
      return;
    }
    if (got === want) {
      setVerdict(card, 'pass', CHECK_SVG,
        'Correct! Your output matches the expected result.');
      markSolved(card);
    } else {
      var ln = firstDiffLine(got, want);
      setVerdict(card, 'mismatch', '≠',
        'Not a match yet.',
        (ln ? 'First difference around line ' + ln + '. ' : '') +
        'Compare your output with the expected result above, or open a hint.');
      registerFail(card);
    }
  }

  /* Auto-reveal the first hint after AUTO_HINT_AFTER failed checks, so a
     stuck learner is nudged forward instead of bouncing (activation). */
  function registerFail(card) {
    card.fails = (card.fails || 0) + 1;
    if (card.fails < AUTO_HINT_AFTER || card._autoHinted) return;
    var link = card.section.querySelector('.xh-hint-link');
    if (link && !link.disabled) { card._autoHinted = true; link.click(); }
  }

  function wireGrading(card) {
    // Static (webr:false) cards have no runnable block - wire the
    // self-reported "Mark as done" control, then skip all grading wiring.
    if (card.doneBtn) {
      card.doneBtn.addEventListener('click', function () {
        if (card.solved) return;
        markSolved(card);
        card.doneBtn.textContent = '✓ Marked done';
        card.doneBtn.disabled = true;
      });
    }
    if (!card.yourTurn) return;
    var outEl = card.yourTurn.querySelector('.webr-output');
    if (!outEl) return;

    // "Check answer": grade the NEXT run. It re-runs the current code, so the
    // verdict always reflects what is in the editor now, never a stale run.
    if (card.checkBtn) {
      card.checkBtn.addEventListener('click', function () {
        if (meterWalled()) {
          if (meterWallEl) meterWallEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
        card.gradeNext = true;
        setVerdict(card, 'running',
          '<span class="xh-spinner"></span>', 'Checking your answer…');
        var runBtn = card.yourTurn.querySelector('.webr-run-btn');
        if (runBtn) runBtn.click();
      });
    }

    // A plain Run (the webr button, not a Check) just executes - drop any
    // stale verdict so the learner can experiment without being judged.
    card.yourTurn.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('.webr-run-btn') && !card.gradeNext) {
        hideVerdict(card);
      }
    });

    // The output element's class mutates several times per run. Grade exactly
    // once - on the first ready-state mutation while a Check is pending. A
    // LATER mutation while output is still ready must NOT touch the verdict:
    // doing so wiped the 'Success!' / 'Not a match' pill milliseconds after it
    // appeared. Stale verdicts are cleared instead when a NEW run starts, i.e.
    // when the output loses its ready-state class.
    var obs = new MutationObserver(function () {
      var cls = outEl.className || '';
      var ready = cls.indexOf('has-content') !== -1 ||
                  cls.indexOf('has-error') !== -1 ||
                  cls.indexOf('has-message') !== -1;
      if (ready) {
        if (card.gradeNext) {
          card.gradeNext = false;
          grade(card);
        }
        // output ready, no Check pending: leave any verdict untouched.
      } else if (!card.gradeNext) {
        // output lost its ready-state - a new plain run is starting - drop the
        // stale verdict (a pending Check keeps gradeNext true, so it survives).
        hideVerdict(card);
      }
    });
    obs.observe(outEl, { attributes: true, attributeFilter: ['class'] });

    // Self-check exercises may only produce a plot - watch the plot slot too.
    if (card.mode !== 'output-compare') {
      var plot = card.yourTurn.querySelector('.webr-plot-output');
      if (plot) {
        var plotObs = new MutationObserver(function () {
          if (plot.childNodes.length && card.gradeNext && !card.solved) {
            card.gradeNext = false;
            setVerdict(card, 'pass', CHECK_SVG,
              'Plot rendered. Compare it with the expected result.',
              'This exercise is self-checked.');
            markSolved(card);
          }
        });
        plotObs.observe(plot, { childList: true });
      }
    }
  }

  /* ---------------------------------------------------------------
     Solve bookkeeping
     --------------------------------------------------------------- */
  var progressState, totalCount, badgeEl;

  function solvedCount() {
    var n = 0;
    for (var i = 0; i < cards.length; i++) if (cards[i].solved) n++;
    return n;
  }

  function markSolved(card) {
    if (!card.solved) {
      card.solved = true;
      progressState.solved[card.id] = true;
      STORE.saveProgress(progressState);
      STORE.bumpDaily();      // honest daily micro-goal (item 5)
      reportSolve(card);      // POSTs to /api/exercise/.../attempt when authed
    }
    card.section.classList.add('is-solved');
    updateProgress(solvedCount(), totalCount);
    pulseProgress();
    surgeProgressFill();
    updateXp(true);
    checkMilestone(solvedCount(), totalCount);

    // Auto-collapse the solved card once the verdict has been seen, then
    // scroll it into view. The solved tick lives in the header, so without
    // the scroll the collapse just drops the learner onto unrelated content.
    // Guarded so repeated observer fires cannot stack stale timeouts.
    if (!card._collapseScheduled) {
      card._collapseScheduled = true;
      setTimeout(function () {
        if (card.section.classList.contains('is-open')) {
          setCardOpen(card.section, false);
          var h = card.section.querySelector('.xh-ex-head');
          if (h) h.setAttribute('aria-expanded', 'false');
        }
        // On the final solve the completion badge owns the view instead.
        if (solvedCount() < totalCount) {
          var y = card.section.getBoundingClientRect().top + window.scrollY - 76;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, COLLAPSE_DELAY);
    }

    if (solvedCount() >= totalCount && badgeEl) showBadge();
  }

  /* ---------------------------------------------------------------
     Completion badge + end-of-hub CTA
     --------------------------------------------------------------- */
  function buildBadge(lastSection) {
    var h1 = document.querySelector('#content h1') || document.querySelector('h1');
    var hubName = h1 ? h1.textContent.trim() : 'this set';

    badgeEl = document.createElement('div');
    badgeEl.className = 'xh-badge';
    badgeEl.setAttribute('role', 'status');
    var shareUrl = 'https://www.linkedin.com/sharing/share-offsite/?url=' +
      encodeURIComponent(location.href);
    badgeEl.innerHTML =
      '<div class="xh-badge-medal" aria-hidden="true">🏆</div>' +
      '<div class="xh-badge-title">All ' + totalCount + ' exercises solved</div>' +
      '<div class="xh-badge-desc">You completed ' + escapeHtml(hubName) +
      ', a milestone on your r-statistics.co practice track.</div>' +
      '<div class="xh-badge-actions">' +
      '<a class="xh-badge-btn xh-badge-btn-primary" target="_blank" rel="noopener" href="' +
      escapeHtml(shareUrl) + '">Share on LinkedIn</a>' +
      '</div>';
    lastSection.after(badgeEl);
  }

  function showBadge() {
    if (!badgeEl || badgeEl.classList.contains('is-shown')) return;
    badgeEl.classList.add('is-shown');
    requestAnimationFrame(function () {
      badgeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    // Phase 5: when the hub completion celebration plays, also check if any
    // certification track is newly eligible (or pre-existing eligible-but-not-
    // minted) and surface a 'Claim certificate' CTA inside the badge. Anon
    // users: skipped (no token).
    surfaceCertClaim();
  }

  // ===== Phase 5: certificate-claim CTA on hub completion =====
  // Fires once per page load. Fetches /api/me/tracks, filters for tracks the
  // user is eligible for and has not yet minted, then injects a claim button
  // into the existing hub-completion badge. The track may or may not include
  // the current hub - either way, this is the right moment to surface the
  // earnable cert: the user is in a 'just-finished-something' headspace.
  var certClaimChecked = false;
  function surfaceCertClaim() {
    if (certClaimChecked) return;
    certClaimChecked = true;
    if (!authToken || !badgeEl) return;
    fetch('/api/me/tracks', {
      headers: { 'Authorization': 'Bearer ' + authToken, 'Accept': 'application/json' },
    })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (body) {
        if (!body || !Array.isArray(body.tracks)) return;
        var claimable = body.tracks.filter(function (t) { return t.eligible && !t.minted; });
        if (!claimable.length) return;
        renderClaimBlock(claimable);
      })
      .catch(function () {});
  }

  function renderClaimBlock(tracks) {
    var actions = badgeEl.querySelector('.xh-badge-actions') || badgeEl;
    var block = document.createElement('div');
    block.className = 'xh-cert-claim';
    block.style.cssText =
      'margin-top:18px;padding-top:18px;border-top:1px dashed rgba(0,0,0,.12);' +
      'display:flex;flex-direction:column;gap:10px';
    var headline = document.createElement('div');
    headline.style.cssText = 'font-weight:600;color:#0a0d14';
    headline.textContent = tracks.length === 1
      ? 'You’ve earned a certificate.'
      : 'You’ve earned ' + tracks.length + ' certificates.';
    block.appendChild(headline);
    tracks.forEach(function (t) {
      var row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:12px;' +
        'background:#fff;border:1px solid #d4d9e3;border-radius:8px;padding:10px 14px';
      row.innerHTML =
        '<div><div style="font-family:\'IBM Plex Serif\',Georgia,serif;font-weight:600;font-size:14.5px;color:' + t.color_primary + '">' +
        escapeHtml(t.name) + '</div>' +
        '<div style="font-size:12px;color:#6b7280;margin-top:2px">' + t.solved + ' of ' + t.total_exercises + ' exercises</div></div>';
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.style.cssText = 'background:' + t.color_primary + ';color:#fff;border:none;border-radius:6px;' +
        'padding:8px 16px;font-family:inherit;font-size:13px;font-weight:600;cursor:pointer;flex:none';
      btn.textContent = 'Claim';
      btn.addEventListener('click', function () { claimCert(t, btn, row); });
      row.appendChild(btn);
      block.appendChild(row);
    });
    actions.appendChild(block);
  }

  function claimCert(track, btn, row) {
    if (!authToken) return;
    btn.disabled = true;
    var orig = btn.textContent;
    btn.textContent = 'Minting...';
    fetch('/api/cert/mint', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + authToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ track_id: track.id }),
    })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, body: j }; }); })
      .then(function (resp) {
        if (!resp.ok) throw new Error(resp.body && resp.body.message || 'Mint failed');
        btn.textContent = 'View certificate';
        btn.disabled = false;
        btn.onclick = function () { window.open(resp.body.verify_url, '_blank', 'noopener'); };
        // Also notify the avatar dropdown of the new XP.
        if (typeof resp.body.total_xp === 'number') {
          document.dispatchEvent(new CustomEvent('exercise-progress-changed', {
            detail: {
              total_xp: resp.body.total_xp,
              current_streak_days: resp.body.current_streak_days,
              longest_streak_days: resp.body.longest_streak_days,
            },
          }));
        }
        // Open the freshly-minted cert immediately so the user sees the prize.
        window.open(resp.body.verify_url, '_blank', 'noopener');
      })
      .catch(function (e) {
        btn.disabled = false;
        btn.textContent = orig;
        var err = document.createElement('div');
        err.style.cssText = 'font-size:12px;color:#9a1f1f;margin-top:6px';
        err.textContent = e.message || 'Could not mint';
        row.appendChild(err);
      });
  }

  function buildCTA(lastSection) {
    var next = discoverNext();
    var cta = document.createElement('div');
    cta.className = 'xh-cta';
    var href = next ? next.url : 'index.html';
    var label = next ? ('Continue: ' + next.title) : 'Back to all tutorials';
    cta.innerHTML =
      '<div class="xh-cta-text"><strong>Finished practising?</strong>' +
      '<span>Keep your momentum going with the next lesson.</span></div>' +
      '<a class="xh-cta-btn" href="' + escapeHtml(href) + '">' +
      escapeHtml(label) + ' →</a>';
    (badgeEl || lastSection).after(cta);
  }

  /* ---------------------------------------------------------------
     Init
     --------------------------------------------------------------- */
  function init() {
    var sections = Array.prototype.slice.call(
      document.querySelectorAll('section.exercise'));
    if (!sections.length) return;          // not an exercise hub - do nothing

    totalCount = sections.length;
    progressState = STORE.loadProgress();
    var streakDays = updateStreak();

    renderMetaStrip();
    buildStatusBar(totalCount, streakDays);

    sections.forEach(function (section, i) {
      enhanceSection(section, i, totalCount, progressState);
    });
    cards.forEach(wireGrading);

    updateProgress(solvedCount(), totalCount);
    updateXp(false);

    var lastSection = sections[sections.length - 1];
    buildBadge(lastSection);
    buildCTA(lastSection);
    if (solvedCount() >= totalCount) showBadge();

    // Deep links from /exercises/ (and anywhere else): the original section
    // ids move to xh-body-* during enhancement, so a plain #<Hub>-ex-<s>-<n>
    // hash never resolves natively. Re-resolve it here: open the card and
    // scroll it under the sticky masthead.
    var dhash = decodeURIComponent((location.hash || '').slice(1));
    if (/-ex-\d+-\d+$/.test(dhash)) {
      var dbody = document.getElementById('xh-body-' + dhash);
      var dcard = dbody && dbody.closest('section.exercise');
      if (dcard) {
        setCardOpen(dcard, true);
        setTimeout(function () {
          dcard.scrollIntoView();
          window.scrollBy(0, -84);
        }, 150);
      }
    }

    // Enable the fold transition after the first paint, so cards do not
    // animate themselves open when the page loads. rAF covers the normal
    // case; the timeout is a fallback for background tabs, where rAF is
    // paused - without it the fold would never become active.
    var enableFold = function () {
      for (var i = 0; i < cards.length; i++) {
        cards[i].section.classList.add('xh-anim');
      }
    };
    requestAnimationFrame(function () { requestAnimationFrame(enableFold); });
    setTimeout(enableFold, 250);
  }

  /* Engagement is a UI enhancement, not on the critical path. */
  function schedule() {
    if (window.requestIdleCallback) requestIdleCallback(init, { timeout: 2000 });
    else setTimeout(init, 200);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule);
  } else {
    schedule();
  }
})();
