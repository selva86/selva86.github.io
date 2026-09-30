/* lesson-mode.js - interactive lesson player (post_type: LESSON).
 *
 * Builds a full-screen overlay from the .lesson-step nodes md2lesson emits,
 * shows one step at a time, gates Continue on quizzes/try-its, mounts widgets
 * when their step is shown, persists resume state, reports solves to the
 * exercise grading backend (shared XP/streak), and preview-gates Pro lessons.
 *
 * Consumes the contract in _build/lesson-contract.md. With no JS, the steps
 * render as a normal crawlable document and none of this runs.
 */
(function () {
  'use strict';

  var PREVIEW_STEPS = 2;            // free preview before the Pro paywall
  var RESUME_KEY = 'rsc-lesson-v1:' + location.pathname;
  // A u&t token in the URL means this open arrived from a sequence email.
  // One GA4 event marks the arrival (the funnel step between the email
  // click and lesson_step_shown). The token stays in the URL on purpose:
  // signed-out readers need it to survive a reload within the window.
  try {
    var _q = new URLSearchParams(location.search);
    if (_q.get('u') && _q.get('t') && typeof gtag === 'function') {
      gtag('event', 'email_lesson_open', { lesson: location.pathname.slice(1).replace(/[.]html?$/i, '') });
    }
  } catch (e) {}

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  ready(function () {
    var content = document.getElementById('content') || document.body;
    var steps = Array.prototype.slice.call(content.querySelectorAll('.lesson-step'));
    if (!steps.length) return;

    var body = document.body;
    var ds = body.dataset || {};
    var access = (body.getAttribute('data-lesson-access') || 'free').toLowerCase();
    // Windowed = a daily-email lesson. Hoisted because the chrome below needs it.
    // Every daily-lesson behaviour in this file is gated on it; a track lesson
    // never reaches any of it.
    var windowed = access === 'windowed';
    var courseTitle = ds.courseTitle || 'Course';
    // the lesson's own title is its cover-step H2 (this is what the roadmap row shows); the
    // course title stays as the exit target + rail header. Keeps chrome == roadmap == cover.
    var lessonTitle = (function () {
      var h = steps[0] && steps[0].querySelector('h2');
      if (!h) return courseTitle;
      var c = h.cloneNode(true);                       // drop any heading anchor-link ("#") before reading
      Array.prototype.forEach.call(c.querySelectorAll('a'), function (a) { if ((a.textContent || '').trim() === '#') a.parentNode.removeChild(a); });
      var t = (c.textContent || '').trim().replace(/^#\s*/, '').replace(/\s*#$/, '').trim();
      return t || courseTitle;
    })();
    var lessonKind = (ds.lessonKind || '').toLowerCase();       // 'quiz' for a section quiz
    var showCounter = !!(ds.courseLesson && ds.courseTotal) && lessonKind !== 'quiz';
    var landing = ds.courseLanding || '/';
    var nextHref = ds.courseNext || '';
    var total = steps.length;
    var courseId = ds.courseId || '';
    var curSlug = location.pathname.replace(/^\//, '').replace(/index\.html?$/i, '').replace(/\.html?$/i, '').replace(/\/$/, '');
    var COURSE_KEY = 'rsc-course-v1:' + courseId;
    var railCourse = null;
    var allCourses = [];          // every course in courses.json (for the drill-up rail)
    var trackIndex = null;        // {track, trackLabel, sections:{n:{n,label,courses[]}}} for the current track
    var railLevel = 'lessons';    // in-player drill-up: 'lessons' | 'section' | 'track'
    var curSection = null;        // the current lesson's section number
    var viewSection = null;       // section shown at the 'section' level (defaults to curSection)
    var railWired = false;        // the delegated rail click handler is attached once

    /* ---- resume state ---- */
    var state = { furthest: 0, passed: {} };
    try {
      var saved = JSON.parse(localStorage.getItem(RESUME_KEY));
      if (saved && typeof saved === 'object') {
        state.furthest = saved.furthest || 0;
        state.passed = saved.passed || {};
      }
    } catch (e) {}
    function save() { try { localStorage.setItem(RESUME_KEY, JSON.stringify(state)); } catch (e) {} }

    /* ---- build overlay chrome ---- */
    var app = document.createElement('div');
    app.className = 'lm-app';
    app.innerHTML =
      '<div class="lm-top">' +
        /* A sidebar-panel glyph, not a hamburger. Below 860px this button sits
           a hundred-odd pixels under the site navbar's own hamburger, and two
           identical three-line icons stacked read as one duplicated control.
           This is the same panel icon the tutorial sidebar already uses, so it
           says "open the lesson list" rather than "open a second menu". */
        '<button class="lm-rail-toggle" type="button" aria-label="Show lessons in this course">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
          '<rect x="3" y="4" width="18" height="16" rx="2.5"/><line x1="9.5" y1="4" x2="9.5" y2="20"/>' +
          '<path d="m14 9.5 2.5 2.5-2.5 2.5"/></svg></button>' +
        '<a class="lm-exit" href="' + esc(landing) + '">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>' +
          esc(courseTitle) + '</a>' +
        '<span class="lm-title">' + esc(lessonTitle) +
          (showCounter ? ' <span>&middot; Lesson ' + esc(ds.courseLesson) + ' of ' + esc(ds.courseTotal) + '</span>' : '') +
        '</span>' +
        '<div class="lm-top-right">' +
          '<span class="lm-stepn">Step <b class="lm-cur">1</b> / ' + total + '</span>' +
          '<button class="lm-fs" type="button" aria-label="Toggle fullscreen">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg></button>' +
          '<a class="lm-cert" href="/pricing.html">Get certified</a>' +
        '</div>' +
      '</div>' +
      '<div class="lm-body">' +
        '<nav class="lm-rail" aria-label="Lessons in this course"></nav>' +
        '<div class="lm-main">' +
          '<div class="lm-segs">' + steps.map(function (s) {
            var st = s.getAttribute('data-step-type') || '';
            var h2 = s.querySelector('h2');
            var tip = h2 ? h2.textContent.replace(/\s+/g, ' ').trim() : '';
            return '<i' + ((st === 'quiz' || st === 'tryit') ? ' data-practice=""' : '') +
                   (tip ? ' data-tip="' + esc(tip) + '"' : '') + '></i>';
          }).join('') + '</div>' +
          (windowed ? '<div class="lm-win" hidden></div>' : '') +
          '<div class="lm-stage"></div>' +
          '<div class="lm-stepper">' +
            '<button class="lm-back" disabled>&larr; Back</button>' +
            '<span class="lm-mid"></span>' +
            '<button class="lm-cont">Continue &rarr;</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    var stage = app.querySelector('.lm-stage');
    steps.forEach(function (s) { stage.appendChild(s); });   // move steps into the player
    body.appendChild(app);
    body.classList.add('lesson-js-ready');
    // The site navbar stays visible above the player: measure it so the fixed
    // .lm-app starts right below it (0 when a page has no navbar).
    function setNavH() {
      var nav = document.querySelector('body > .container > .sitenav');
      var h = nav ? nav.offsetHeight : 0;
      document.documentElement.style.setProperty('--lm-nav-h', h + 'px');
    }
    setNavH();
    window.addEventListener('resize', setNavH);
    setTimeout(setNavH, 600);
    document.documentElement.style.overflow = 'hidden';   // the page scroll lives on <html>; locking body alone leaves a stray scrollbar behind the overlay

    var segEls = Array.prototype.slice.call(app.querySelectorAll('.lm-segs i'));
    // Segment tooltip: hovering a progress segment names its step.
    var segTip = document.createElement('div');
    segTip.className = 'lm-seg-tip';
    app.appendChild(segTip);
    var segsWrap = app.querySelector('.lm-segs');
    segsWrap.addEventListener('mouseover', function (e) {
      var t = e.target;
      if (!t || t.tagName !== 'I' || !t.getAttribute('data-tip')) return;
      segTip.textContent = t.getAttribute('data-tip');
      segTip.style.display = 'block';
      var r = t.getBoundingClientRect(), a = app.getBoundingClientRect();
      segTip.style.top = (r.bottom - a.top + 8) + 'px';
      segTip.style.left = '0px';
      var x = r.left + r.width / 2 - a.left - segTip.offsetWidth / 2;
      segTip.style.left = Math.max(10, Math.min(x, a.width - segTip.offsetWidth - 10)) + 'px';
    });
    segsWrap.addEventListener('mouseout', function (e) {
      if (e.target && e.target.tagName === 'I') segTip.style.display = 'none';
    });
    // Click a visited segment to jump back to that step (gating untouched:
    // only steps at or before the furthest visited are reachable).
    segsWrap.addEventListener('click', function (e) {
      var t = e.target;
      if (!t || t.tagName !== 'I') return;
      var k = segEls.indexOf(t);
      if (k < 0 || k === i || k > (state.furthest || 0)) return;
      if (locked && !gateHold) { renderProGate(); return; }
      i = k;
      render();
    });
    // Keyboard: ArrowRight/Enter continue, ArrowLeft back. Never while typing
    // in the R editor or a form control, never with a modifier held.
    document.addEventListener('keydown', function (e) {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      var a = document.activeElement;
      if (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.tagName === 'SELECT' || a.isContentEditable)) return;
      if (a && a.closest && a.closest('.webr-editor')) return;
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (a && a.tagName === 'BUTTON' && a !== contBtn) return;
        if (a && a.tagName === 'A') return;
        if (!contBtn.disabled) { e.preventDefault(); contBtn.click(); }
      } else if (e.key === 'ArrowLeft') {
        if (!backBtn.disabled) { e.preventDefault(); backBtn.click(); }
      }
    });
    var lastStepTracked = -1;
    var curEl = app.querySelector('.lm-cur');
    var midEl = app.querySelector('.lm-mid');
    var backBtn = app.querySelector('.lm-back');
    var contBtn = app.querySelector('.lm-cont');

    /* ---- Pro gating ---- */
    // stripped = the server removed locked step content for this (non-Pro)
    // request; the shells remain so step counts stay honest. A stripped page
    // is always treated as locked client-side regardless of any local state.
    var stripped = body.getAttribute('data-stripped') === '1';
    // Windowed nurture lessons: the SERVER is the only gate (the middleware
    // 302s expired windows to the expiry page before this code ever runs),
    // so the client never account-walls or pro-walls them.
    // `windowed` is declared at the top of this closure, beside `access`.
    // Mini courses award badges, not certificates: the Get-certified button
    // is the wrong promise here, and the player has its own Pro moments.
    if (windowed) { var certBtn = app.querySelector('.lm-cert'); if (certBtn) certBtn.style.display = 'none'; }
    var locked = (!windowed && (access === 'pro') && !body.classList.contains('pro')) || stripped;
    if (!stripped) { try { sessionStorage.removeItem('rsc-lm-reload:' + location.pathname); } catch (e) {} }
    // Gate v2 hold: a signed-in visitor holding a FULL (unstripped) Pro page
    // was verified Pro at the edge; give auth-hydrate a beat to confirm before
    // walling so paying users never see the gate flash. Anonymous visitors and
    // stripped pages gate instantly.
    // Stripped pages hold too when a session exists: the edge may simply not
    // have had the identity cookie yet (first load after sign-in, or a lapsed
    // cookie). auth-hydrate settles it either way - a Pro answer reloads once
    // for the full page, a free answer walls - so the wall never flashes for
    // a paying member. Anonymous visitors still gate instantly.
    var gateHold = locked && hasAuthToken();
    if (gateHold) setTimeout(function () { if (gateHold) { gateHold = false; if (locked) render(); } }, stripped ? 2500 : 700);

    /* ---- account gate (free courses): first 2 lessons of a course are open to
       anyone; lesson 3+ asks for a free account. Mutually exclusive with the Pro
       wall above (Pro lessons use access==='pro'; this only fires on free courses). */
    var FREE_PREVIEW_LESSONS = 2;
    var lessonOrder = parseInt(ds.courseLesson || '0', 10) || 0;
    function hasAuthToken() {
      try { if (API && API.token && API.token()) return true; } catch (e) {}
      try { for (var n = 0; n < localStorage.length; n++) { var k = localStorage.key(n); if (k && k.indexOf('sb-') === 0 && k.indexOf('-auth-token') > 0) return true; } } catch (e) {}
      return body.classList.contains('state-pro');
    }
    var signedIn = hasAuthToken();
    var accountGated = (access !== 'pro') && !windowed && lessonOrder > FREE_PREVIEW_LESSONS;
    var accountLocked = accountGated && !signedIn;

    /* ---- Data Analyst 30-day pass (plan s5) ---- */
    // Set from /api/me on hydration. An ACTIVE pass on a full (unstripped)
    // Pro page unlocks it: the edge already resolved the pass into scope and
    // served the full body, the client just stops second-guessing. Stripped
    // pages stay walled - the edge ruled them outside the pass. An EXPIRED
    // pass only changes the gate's copy, never its behavior.
    var passState = null;

    var meState = null;
    document.addEventListener('auth-hydrated', function (e) {
      var me = e.detail && e.detail.me;
      meState = me || null;
      passState = (me && me.pass) || null;
      if (me && me.user && !me.pro && locked) upgradeGateForMember();
      if (passState && passState.active && locked && !stripped) {
        locked = false;
        render();
      }
      if (passState && passState.claimed && !passState.active) updateGatePassCopy();
      renderPassChip();
      if (me && me.pro && locked) {
        if (stripped) {
          // The locked steps are not in this response. auth-hydrate has just
          // synced the auth cookie, so one reload serves the full page
          // server-side. Guarded so a stale entitlement can never loop.
          try {
            var rk = 'rsc-lm-reload:' + location.pathname;
            if (!sessionStorage.getItem(rk)) { sessionStorage.setItem(rk, '1'); location.reload(); return; }
          } catch (err) {}
        } else { locked = false; render(); }
      }
      if (me && me.user && accountLocked) { accountLocked = false; signedIn = true; render(); }
      if (gateHold) { gateHold = false; if (locked) render(); }
      hydrateSolved();
    });

    /* ---- grading ---- */
    var API = window.RSCExerciseAPI;
    var hub = API ? API.hubSlugFromPath() : '';
    function exerciseId(step) {
      var ex = step.querySelector('.exercise');
      return ex ? ex.getAttribute('data-exercise-id') : '';
    }
    function markPassed(idx, solved) {
      if (state.passed[idx]) return;
      state.passed[idx] = true;
      save();
      if (solved === false) return;   // the gate opens on any answer, but a wrong answer earns no XP
      var id = exerciseId(steps[idx]);
      if (API && id) API.reportSolve(hub, id, 0).then(handleAttemptExtras);
    }
    function hydrateSolved() {
      if (!API) return;
      API.fetchSolved(hub).then(function (ids) {
        if (!ids || !ids.length) return;
        steps.forEach(function (step, idx) {
          var id = exerciseId(step);
          if (id && ids.indexOf(id) !== -1 && !state.passed[idx]) {
            state.passed[idx] = true;
            step.classList.add('passed');
          }
        });
        save();
        render();
      });
    }

    /* ---- quiz wiring ---- */
    app.querySelectorAll('.lesson-quiz').forEach(function (quiz) {
      var step = quiz.closest('.lesson-step');
      var idx = steps.indexOf(step);
      var correct = parseInt(quiz.getAttribute('data-correct'), 10);
      var opts = Array.prototype.slice.call(quiz.querySelectorAll('.lesson-opt'));
      if (state.passed[idx]) step.classList.add('passed');
      opts.forEach(function (opt) {
        opt.addEventListener('click', function () {
          if (quiz.classList.contains('answered')) return;
          quiz.classList.add('answered');
          var chosen = parseInt(opt.getAttribute('data-i'), 10);
          var right = chosen === correct;
          opts.forEach(function (o, j) {
            o.classList.add('dim');
            if ((j + 1) === correct) o.classList.remove('dim');
          });
          opt.classList.remove('dim');
          opt.classList.add(right ? 'correct' : 'wrong');
          if (!right) opts[correct - 1].classList.add('correct');
          var fb = quiz.querySelector('.lesson-qfb-' + (right ? 'ok' : 'no'));
          if (fb) fb.classList.add('show');
          step.classList.add('passed');     // either answer reveals the lesson; the gate opens
          markPassed(idx, right);           // ...but only a correct answer reports a solve / earns XP
          render();
        });
      });
    });

    /* ---- try-it wiring ---- */
    app.querySelectorAll('.lesson-tryit').forEach(function (tryit) {
      var step = tryit.closest('.lesson-step');
      var idx = steps.indexOf(step);
      if (state.passed[idx]) step.classList.add('passed');
      var input = tryit.querySelector('.lesson-tryit-input');
      var checkBtn = tryit.querySelector('.lesson-tryit-check');
      var ok = tryit.querySelector('.lesson-tryit-ok');
      var no = tryit.querySelector('.lesson-tryit-no');
      var re = null;
      try { re = new RegExp(tryit.getAttribute('data-check-regex')); } catch (e) {}
      if (checkBtn) checkBtn.addEventListener('click', function () {
        var pass = re ? re.test(input.value) : true;
        if (ok) ok.classList.toggle('show', pass);
        if (no) no.classList.toggle('show', !pass);
        if (pass) { step.classList.add('passed'); markPassed(idx, true); render(); }
      });
    });

    /* ---- navigation ---- */
    // Resume: an in-progress lesson reopens where you left off; a COMPLETED lesson
    // reopens at step 1 (review mode) so a finished lesson is never a dead-end.
    var completedLesson = (state.furthest || 0) >= total - 1;
    var i = completedLesson ? 0 : Math.min(state.furthest || 0, total - 1);
    if (!completedLesson && i > 0) {
      showNudgeToast('Picked up where you left off: step ' + (i + 1) + ' of ' + total + '.');
    }
    // A locked viewer never resumes past the preview, whatever localStorage says.
    if (locked) i = Math.min(i, PREVIEW_STEPS - 1);
    var showingPaywall = false;

    function gated(idx) {
      return steps[idx].hasAttribute('data-gate') && !steps[idx].classList.contains('passed');
    }

    /* ---- pass-2 award moments: nudge toast + badge modal ---- */
    var cachedHandle = null;
    function myHandle() {
      if (cachedHandle) return Promise.resolve(cachedHandle);
      try {
        var tk = API && API.token && API.token();
        if (!tk) return Promise.resolve(null);
        return fetch('/api/me/profile', { headers: { 'Authorization': 'Bearer ' + tk } })
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (p) { cachedHandle = p && p.handle; return cachedHandle; })
          .catch(function () { return null; });
      } catch (e) { return Promise.resolve(null); }
    }
    function showNudgeToast(text) {
      try {
        var el = document.createElement('div');
        el.className = 'lm-nudge-toast';
        el.textContent = text;
        body.appendChild(el);
        setTimeout(function () { el.classList.add('on'); }, 30);
        setTimeout(function () {
          el.classList.remove('on');
          setTimeout(function () { el.remove(); }, 400);
        }, 5200);
      } catch (e) {}
    }
    function showXpPulse(n) {
      try {
        var el = document.createElement('div');
        el.className = 'lm-xp-pulse';
        el.textContent = '+' + n + ' XP';
        app.appendChild(el);
        setTimeout(function () { el.classList.add('on'); }, 20);
        setTimeout(function () { el.classList.remove('on'); }, 1900);
        setTimeout(function () { el.remove(); }, 2400);
      } catch (e) {}
    }
    function showAwardModal(badge) {
      myHandle().then(function (h) {
        try {
          var wrap = document.createElement('div');
          wrap.className = 'lm-award';
          var profileUrl = h ? location.origin + '/u/' + h : location.origin;
          var cardUrl = h ? '/u/' + h + '/badge-card.svg?id=' + encodeURIComponent(badge.id) : '';
          wrap.innerHTML =
            '<div class="lm-award-box">' +
              '<h3>Badge earned</h3>' +
              '<p class="lm-award-name">' + esc(badge.name) + '</p>' +
              (cardUrl ? '<img class="lm-award-card" alt="' + esc(badge.name) + ' share card" src="' + cardUrl + '">' : '') +
              '<div class="lm-award-row">' +
                (h ? '<a class="lm-award-btn li" target="_blank" rel="noopener" href="https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(profileUrl) + '">Share on LinkedIn</a>' : '') +
                (h ? '<a class="lm-award-btn" target="_blank" rel="noopener" href="https://twitter.com/intent/tweet?text=' + encodeURIComponent('Just earned the ' + badge.name + ' badge on r-statistics.co: ' + profileUrl) + '">Share on X</a>' : '') +
                '<button class="lm-award-btn keep" type="button">Keep going</button>' +
              '</div>' +
            '</div>';
          wrap.addEventListener('click', function (ev) {
            if (ev.target === wrap || (ev.target.classList && ev.target.classList.contains('keep'))) wrap.remove();
          });
          body.appendChild(wrap);
        } catch (e) {}
      });
    }
    function handleAttemptExtras(res) {
      if (!res) return;
      try {
        if (typeof res.xp_awarded_now === 'number' && res.xp_awarded_now > 0) {
          showXpPulse(res.xp_awarded_now);
        }
        if (res.new_badges && res.new_badges.length) {
          showAwardModal(res.new_badges[0]);
        } else if (res.nudge) {
          showNudgeToast(res.nudge);
        }
        if (res.freeze_used_today) {
          showNudgeToast('A streak freeze saved your streak. Keep it rolling today.');
        }
      } catch (e) {}
    }

    /* First-party intent beacon (see /api/signal). Deduped per session per
       signal+lesson so reloads and re-renders do not spam. */
    function rsSignal(sig, meta) {
      try {
        var k = 'rs-sig:' + sig + ':' + location.pathname;
        if (sessionStorage.getItem(k)) return;
        sessionStorage.setItem(k, '1');
        var a = localStorage.getItem('rsc-aid');
        if (!a) { a = Math.random().toString(36).slice(2, 12); localStorage.setItem('rsc-aid', a); }
        var hdrs = { 'Content-Type': 'application/json' };
        try {
          var tk = window.RSCExerciseAPI && window.RSCExerciseAPI.token && window.RSCExerciseAPI.token();
          if (tk) hdrs['Authorization'] = 'Bearer ' + tk;
        } catch (e) {}
        fetch('/api/signal', { method: 'POST', keepalive: true, headers: hdrs,
          body: JSON.stringify({ s: sig, p: location.pathname, m: meta || '', a: a }) }).catch(function () {});
      } catch (e) {}
    }

    function renderPaywall() {
      showingPaywall = true;
      rsSignal('paywall_hit', courseId ? courseId + ':' + lessonOrder : '');
      steps.forEach(function (s) { s.classList.remove('on'); });
      var pw = stage.querySelector('.lm-paywall');
      if (!pw) {
        pw = document.createElement('div');
        pw.className = 'lm-paywall';
        pw.innerHTML = '<h3>Continue this course with Pro</h3>' +
          '<p>The first lessons are free. Unlock the full ' + esc(courseTitle) +
          ' course, every interactive lesson, and your certificate with Pro.</p>' +
          '<a href="/pricing.html">See plans &rarr;</a>';
        stage.appendChild(pw);
      }
      pw.style.display = '';
      curEl.textContent = Math.min(i + 1, total);
      midEl.textContent = 'Preview complete';
      backBtn.disabled = false;
      contBtn.disabled = true;
      stage.scrollTop = 0;
    }

    /* Countdown chip in the top bar, day 1 onward (plan: springing it late
       is a trap; showing it early is the device). Only meaningful on Pro
       lessons a pass is holding open; replaces the Get-certified link there. */
    function renderPassChip() {
      var tr = app.querySelector('.lm-top-right');
      if (!tr || tr.querySelector('.lm-pass')) return;
      if (!passState || !passState.active || access !== 'pro') return;
      var a = document.createElement('a');
      a.className = 'lm-pass';
      a.href = '/pricing.html';
      a.textContent = 'Pass: ' + passState.days_left + ' day' +
        (passState.days_left === 1 ? '' : 's') + ' left';
      var cert = tr.querySelector('.lm-cert');
      if (cert) { tr.insertBefore(a, cert); cert.style.display = 'none'; }
      else tr.appendChild(a);
      try { if (typeof gtag === 'function') gtag('event', 'pass_chip_view', { lesson: curSlug, days_left: passState.days_left }); } catch (e) {}
    }

    /* The gate is built once and cached; if it exists when the expired pass
       state arrives, rewrite its copy in place. The guardrail: pass copy
       always says what stays free. */
    function updateGatePassCopy() {
      var g = stage.querySelector('.lm-gate');
      if (!g || body.classList.contains('pro')) return;
      var h = g.querySelector('h3');
      if (h && h.textContent !== 'Your 30-day Data Analyst pass has ended') {
        h.textContent = 'Your 30-day Data Analyst pass has ended';
      }
      if (!g.querySelector('.lm-gate-pass-note')) {
        var n = document.createElement('p');
        n.className = 'lm-gate-pass-note';
        var cpn = gateCoupon();
        n.textContent = cpn
          ? 'Everything you finished stays on your profile. Your 23% code ' + cpn.code + ' works until ' + new Date(cpn.expires_at * 1000).toLocaleString(undefined, { weekday: 'long', hour: 'numeric', minute: '2-digit' }) + '.'
          : 'Everything you finished stays on your profile, and the first section of every track stays free.';
        var pos = g.querySelector('.lm-gate-pos') || h;
        if (pos && pos.parentNode) pos.parentNode.insertBefore(n, pos.nextSibling);
      }
    }

    /* ---- Pro gate v2: instant wall over a faded first-content-step teaser.
       The server already strips steps 3+ for non-entitled requests, so the
       teaser exposes only what the old 2-step preview served anyway. ---- */
    function teardownGate() {
      var g = stage.querySelector('.lm-gate'); if (g) g.style.display = 'none';
      stage.classList.remove('lm-gatelock');
      steps.forEach(function (s) { s.classList.remove('lm-teaser', 'lm-teaser-quiz'); });
      var sg = app.querySelector('.lm-segs'); if (sg) sg.classList.remove('lm-gated');
      var sp = app.querySelector('.lm-stepper'); if (sp) sp.classList.remove('lm-gated');
    }
    function fillGateFreeLink() {
      var a = stage.querySelector('[data-gate-free]');
      if (!a || !railCourse || !railCourse.lessons) return;
      for (var j = 0; j < railCourse.lessons.length; j++) {
        var l = railCourse.lessons[j];
        if (String(l.access || '').toLowerCase() !== 'pro' && l.built !== false && l.slug !== curSlug) {
          a.href = '/' + esc(l.slug) + '.html'; a.hidden = false; return;
        }
      }
    }
    /* Wall-to-checkout (2026-09-17). A signed-in free member at the wall is at
       peak intent, so the wall itself sells: the local price, one click into
       Paddle, and the pass coupon applied when one exists. Anonymous visitors
       keep the sign-in path; the pricing page stays one link away. */
    var gateUpgraded = false;
    function gateCoupon() { return (passState && passState.coupon && passState.coupon.code) ? passState.coupon : null; }
    function upgradeGateForMember() {
      var g = stage.querySelector('.lm-gate');
      if (!g || gateUpgraded || body.classList.contains('pro')) return;
      gateUpgraded = true;
      var title = (document.querySelector('h1') || {}).textContent || document.title || curSlug;
      rsSignal('pro_wall_hit', (courseId ? courseId + ':' + lessonOrder : '') + '|' + String(title).replace(/\s+/g, ' ').trim().slice(0, 120));
      var cta = g.querySelector('[data-gate-cta]');
      if (cta) {
        cta.textContent = 'Unlock with All-Access';
        cta.setAttribute('href', '#');
        cta.setAttribute('data-gate-buy', 'allaccess');
        var alt = document.createElement('a');
        alt.className = 'lm-gate-alt'; alt.href = '/pricing.html'; alt.textContent = 'All plans, Single Track from $65 a year';
        cta.insertAdjacentElement('afterend', alt);
      }
      var price = g.querySelector('.lm-gate-price');
      var fine = g.querySelector('.lm-gate-fine');
      var c = gateCoupon();
      if (price) price.textContent = c ? 'Your 23% code ' + c.code + ' is applied at checkout.' : '$129 a year, or $14 a month.';
      if (fine) fine.textContent = '14-day full refund, no questions asked. Cancel anytime.';
      if (!document.getElementById('rs-checkout-js')) {
        var sc = document.createElement('script'); sc.id = 'rs-checkout-js'; sc.src = '/www/checkout.js?v=1'; sc.defer = true;
        sc.onload = function () { if (window.rsCheckout) window.rsCheckout.ready(function (p) {
          var y = p.price('allaccess', 'year'), m = p.price('allaccess', 'month');
          if (price && y) price.textContent = (c ? 'Your 23% code ' + c.code + ' comes off ' : '') + y + ' a year' + (m ? ', or ' + m + ' a month' : '') + (c ? ' at checkout.' : '.');
        }); };
        document.head.appendChild(sc);
      }
    }
    function renderProGate() {
      steps.forEach(function (s) { s.classList.remove('on'); });
      var pw = stage.querySelector('.lm-paywall'); if (pw) pw.style.display = 'none';
      var teaser = steps.length > 1 ? steps[1] : steps[0];
      if (teaser) {
        teaser.classList.add('on', 'lm-teaser');
        if (lessonKind === 'quiz') teaser.classList.add('lm-teaser-quiz');
        if (window.LessonWidgets) { try { window.LessonWidgets.mountAll(teaser); } catch (e) {} }
      }
      stage.classList.add('lm-gatelock');
      var g = stage.querySelector('.lm-gate');
      if (!g) {
        var isProUser = body.classList.contains('pro');
        var desc = '';
        try {
          var m = document.querySelector('meta[name="Description"]') || document.querySelector('meta[name="description"]');
          desc = (m && m.getAttribute('content')) || '';
        } catch (e) {}
        var pos = (ds.courseLesson && ds.courseTotal)
          ? 'Lesson ' + esc(ds.courseLesson) + ' of ' + esc(ds.courseTotal) + (courseTitle ? ' · ' + esc(courseTitle) : '') + ' · ' + total + ' steps'
          : esc(courseTitle || '');
        g = document.createElement('div');
        g.className = 'lm-gate';
        // tex2jax_ignore: MathJax runs on lesson pages and would otherwise
        // treat the two $ signs in the price line as inline-math delimiters
        // (eating them and collapsing the spaces between).
        g.innerHTML = '<div class="lm-gate-card tex2jax_ignore">' +
          '<div class="lm-gate-lock" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/></svg></div>' +
          '<h3>' + (isProUser ? 'This lesson is in a different track'
            : (passState && passState.claimed && !passState.active ? 'Your 30-day Data Analyst pass has ended' : 'This is a Pro lesson')) + '</h3>' +
          (pos ? '<p class="lm-gate-pos">' + pos + '</p>' : '') +
          (desc ? '<p class="lm-gate-desc">' + esc(desc) + '</p>' : '') +
          '<a class="lm-gate-cta" href="/pricing.html" data-gate-cta>' + (isProUser ? 'Upgrade to All-Access &rarr;' : 'Unlock with Pro &rarr;') + '</a>' +
          '<p class="lm-gate-price">From $9/month, or $65 for a full year</p>' +
          '<p class="lm-gate-fine">14-day money-back guarantee · cancel anytime</p>' +
          '<a class="lm-gate-free" data-gate-free hidden>The first lessons of this course are free &rarr;</a><br>' +
          '<a class="lm-gate-back" href="' + esc(exitTarget()) + '">&larr; Back to ' + esc(exitLabel()) + '</a>' +
          '</div>';
        stage.appendChild(g);
        g.addEventListener('click', function (ev) {
          var t = ev.target.closest && ev.target.closest('[data-gate-cta],[data-gate-free]');
          if (!t) return;
          if (t.hasAttribute('data-gate-buy')) {
            ev.preventDefault();
            var cp = gateCoupon();
            try { if (typeof gtag === 'function') gtag('event', 'pro_gate_cta', { target: 'checkout', lesson: curSlug }); } catch (e) {}
            if (window.rsCheckout) window.rsCheckout.open(t.getAttribute('data-gate-buy'), { term: 'year', code: cp ? cp.code : null });
            else location.href = '/pricing.html';
            return;
          }
          try { if (typeof gtag === 'function') gtag('event', 'pro_gate_cta', { target: t.hasAttribute('data-gate-cta') ? 'pricing' : 'free-lesson', lesson: curSlug }); } catch (e) {}
        });
        try { if (typeof gtag === 'function') gtag('event', 'pro_gate_view', { lesson: curSlug, course: courseId || '' }); } catch (e) {}
      } else { g.style.display = ''; }
      if (passState && passState.claimed && !passState.active) updateGatePassCopy();
      if (meState && meState.user && !meState.pro) upgradeGateForMember();
      fillGateFreeLink();
      segEls.forEach(function (e2) { e2.className = ''; });
      curEl.textContent = 1;
      midEl.textContent = 'Pro lesson';
      backBtn.disabled = true;
      contBtn.disabled = true;
      var sg2 = app.querySelector('.lm-segs'); if (sg2) sg2.classList.add('lm-gated');
      var sp2 = app.querySelector('.lm-stepper'); if (sp2) sp2.classList.add('lm-gated');
      stage.scrollTop = 0;
    }

    function renderSignInWall() {
      rsSignal('signin_wall_hit', courseId ? courseId + ':' + lessonOrder : '');
      steps.forEach(function (s) { s.classList.remove('on'); });
      var w = stage.querySelector('.lm-signin');
      if (!w) {
        var next = encodeURIComponent(location.pathname + location.search);
        w = document.createElement('div');
        w.className = 'lm-signin';
        w.innerHTML = '<h3>Create a free account to keep going</h3>' +
          '<p>You have started <b>' + esc(courseTitle) + '</b>. It is free to continue: a free account unlocks the rest of this course, saves your progress, and lets you pick up on any device.</p>' +
          '<a class="lm-signin-cta" href="/signin.html?next=' + next + '">Sign in to continue &rarr;</a>' +
          '<p class="lm-signin-fine">Free account, no card. Your first two lessons stay open.</p>' +
          '<a class="lm-signin-back" href="' + esc(exitTarget()) + '">&larr; Back to ' + esc(exitLabel()) + '</a>';
        stage.appendChild(w);
      } else { w.style.display = ''; }
      segEls.forEach(function (e) { e.className = ''; });
      curEl.textContent = Math.min(lessonOrder || (i + 1), total);
      midEl.textContent = 'Free account needed';
      backBtn.disabled = true;
      contBtn.disabled = true;
      stage.scrollTop = 0;
    }

    function render() {
      if (accountLocked) { renderSignInWall(); return; }
      // Gate v2: locked lessons never render content - the gate over its
      // faded teaser is the entire experience until entitlement unlocks.
      if (locked && !gateHold) { renderProGate(); return; }
      teardownGate();
      var sw = stage.querySelector('.lm-signin'); if (sw) sw.style.display = 'none';
      if (showingPaywall) { var p = stage.querySelector('.lm-paywall'); if (p) p.style.display = 'none'; showingPaywall = false; }
      steps.forEach(function (s, k) { s.classList.toggle('on', k === i); });
      segEls.forEach(function (e, k) { e.className = k < i ? 'done' : (k === i ? 'cur' : ''); });
      curEl.textContent = i + 1;
      if (i !== lastStepTracked) {
        lastStepTracked = i;
        try { if (typeof gtag === 'function') gtag('event', 'lesson_step_shown', { lesson: curSlug, step: i + 1, total: total }); } catch (e) {}
      }
      midEl.textContent = locked
        ? 'Preview · step ' + (i + 1) + ' of ' + total
        : 'Step ' + (i + 1) + ' of ' + total;
      backBtn.disabled = i === 0;
      var last = i === total - 1;
      contBtn.innerHTML = last ? (nextHref ? 'Next lesson &rarr;' : 'Finish &check;') : 'Continue &rarr;';
      contBtn.disabled = gated(i);
      if (i > state.furthest) { state.furthest = i; save(); }
      if (window.LessonWidgets) window.LessonWidgets.mountAll(steps[i]);
      if (last) { if (courseId) markCourseLessonDone(curSlug); showCompleteActions(); }   // last step = done + next-actions
      stage.scrollTop = 0;
    }

    function go(delta) {
      var target = i + delta;
      if (target < 0 || target >= total) {
        if (target >= total && i === total - 1 && nextHref) { location.href = nextHref; }
        return;
      }
      // Gate v2 belt-and-suspenders: no stepping while locked, any direction.
      if (locked && !gateHold) { renderProGate(); return; }
      i = target;
      render();
    }

    backBtn.addEventListener('click', function () {
      if (showingPaywall) { render(); return; }
      go(-1);
    });
    contBtn.addEventListener('click', function () { go(1); });
    document.addEventListener('keydown', function (e) {
      // Never hijack arrow keys while the reader is typing in a code editor,
      // input, or any editable field - there the arrows must move the caret.
      var t = e.target;
      if (t && (t.isContentEditable ||
                (t.tagName && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) ||
                (t.closest && t.closest('.webr-container, .webr-editor, .webr-editor-input, [contenteditable="true"]')))) {
        return;
      }
      if (e.key === 'ArrowRight' && !contBtn.disabled) go(1);
      else if (e.key === 'ArrowLeft' && !backBtn.disabled) go(-1);
    });

    /* ---- course rail (left playlist) + fullscreen ----
       The rail is built from /courses.json (fetched once). It lists the course's
       lessons in order with done ticks (from a per-course localStorage set that
       every lesson page shares) and Pro locks. If the fetch fails or there is no
       matching course, the rail stays empty (CSS hides it) and the player works
       exactly as before via the next/prev already in body.dataset. */
    function courseState() { try { return JSON.parse(localStorage.getItem(COURSE_KEY)) || {}; } catch (e) { return {}; } }
    function courseSave(s) { try { localStorage.setItem(COURSE_KEY, JSON.stringify(s)); } catch (e) {} }
    function markCourseLessonDone(slug) {
      if (!slug) return;
      var s = courseState(); s.completed = s.completed || {};
      if (!s.completed[slug]) { s.completed[slug] = true; s.last = slug; courseSave(s); renderRail(); rsSignal('lesson_complete', courseId ? courseId + ':' + lessonOrder : slug); }
    }
    /* ---- the drill-up rail: lessons -> section -> track, all from courses.json ----
       Default view is this course's lessons. The up-button climbs to the section
       (sibling interactive courses) then the track (its sections), and from there
       out to the roadmap. Built only when the course has roadmap data; without it
       the rail is the simple single-course list, exactly as before. */
    function curRoadmap() { return (railCourse && railCourse.roadmap) || null; }
    function buildTrackIndex() {
      var rm = curRoadmap(); if (!rm || !rm.track) return null;
      var idx = { track: rm.track, trackLabel: rm.trackLabel || rm.track, sections: {} };
      allCourses.forEach(function (c) {
        if (!c.roadmap || c.roadmap.track !== rm.track) return;
        var n = c.roadmap.section;
        var sec = idx.sections[n] || (idx.sections[n] = { n: n, label: c.roadmap.sectionLabel || ('Section ' + n), courses: [] });
        sec.courses.push(c);
      });
      return idx;
    }
    function sectionNums() { return Object.keys(trackIndex.sections).map(Number).sort(function (a, b) { return a - b; }); }
    function railLessonRows(course, done, pro) {
      var h = '';
      (course.lessons || []).forEach(function (l) {
        var cur = l.slug === curSlug, isDone = !!done[l.slug];
        var lk = String(l.access || '').toLowerCase() === 'pro' && !pro;
        var soon = l.built === false;
        var cls = 'lm-rail-item' + (cur ? ' current' : '') + (isDone ? ' done' : '') + (lk ? ' locked' : '') + (soon ? ' soon' : '');
        var mk = isDone ? '<span class="lm-rail-mk done">&#10003;</span>' : '<span class="lm-rail-mk">' + (l.order || '') + '</span>';
        var badge = soon ? '<span class="lm-rail-badge">soon</span>' : (lk ? '<span class="lm-rail-badge">Pro</span>' : '');
        var inner = mk + '<span class="lm-rail-tx">' + esc(l.title) + '</span>' + badge;
        if (cur || soon) h += '<li><span class="' + cls + '"' + (cur ? ' aria-current="step"' : '') + '>' + inner + '</span></li>';
        else h += '<li><a class="' + cls + '" href="/' + esc(l.slug) + '.html">' + inner + '</a></li>';
      });
      return h;
    }
    function railUp(label) {
      return '<button type="button" class="lm-rail-up" data-rail-up>' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>' +
        '<span>' + esc(label) + '</span></button>';
    }
    function renderLessonsLevel(done, pro, hasUp) {
      var dn = railCourse.lessons.filter(function (l) { return done[l.slug]; }).length;
      var rm = curRoadmap();
      var up = (hasUp && rm) ? railUp(rm.sectionLabel || 'This section') : '';
      return '<div class="lm-rail-head">' + up +
        '<span class="lm-rail-title">' + esc(railCourse.title) + '</span>' +
        '<span class="lm-rail-prog">' + dn + ' / ' + railCourse.lessons.length + ' done</span></div>' +
        '<ol class="lm-rail-list">' + railLessonRows(railCourse, done, pro) + '</ol>';
    }
    function renderSectionLevel(done, pro) {
      var sec = trackIndex.sections[viewSection];
      if (!sec) return renderLessonsLevel(done, pro, true);
      var h = '<div class="lm-rail-head">' + railUp(trackIndex.trackLabel) +
        '<span class="lm-rail-eyebrow">Section ' + esc(sec.n) + '</span>' +
        '<span class="lm-rail-title">' + esc(sec.label) + '</span></div>';
      sec.courses.forEach(function (c) {
        var isCur = c.course_id === courseId;
        var cdn = (c.lessons || []).filter(function (l) { return done[l.slug]; }).length;
        h += '<div class="lm-rail-course' + (isCur ? ' current' : '') + '">' +
          '<div class="lm-rail-csub">' + esc(c.title) + '<span>' + cdn + ' / ' + (c.lessons || []).length + '</span></div>' +
          '<ol class="lm-rail-list">' + railLessonRows(c, done, pro) + '</ol></div>';
      });
      return h;
    }
    function renderTrackLevel(done, pro) {
      var h = '<div class="lm-rail-head">' + railUp('The roadmap') +
        '<span class="lm-rail-eyebrow">Track</span>' +
        '<span class="lm-rail-title">' + esc(trackIndex.trackLabel) + '</span></div><ol class="lm-rail-list">';
      sectionNums().forEach(function (n) {
        var sec = trackIndex.sections[n], isCur = n === curSection;
        var nLes = sec.courses.reduce(function (a, c) { return a + (c.lessons || []).length; }, 0);
        h += '<li><button type="button" class="lm-rail-item lm-rail-secrow' + (isCur ? ' current' : '') + '" data-rail-section="' + esc(n) + '">' +
          '<span class="lm-rail-mk">' + esc(n) + '</span>' +
          '<span class="lm-rail-tx">' + esc(sec.label) + '<span class="lm-rail-sub">' + nLes + ' lesson' + (nLes === 1 ? '' : 's') + '</span></span>' +
          '<svg class="lm-rail-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 6 15 12 9 18"/></svg></button></li>';
      });
      return h + '</ol><a class="lm-rail-foot" href="' + roadmapTrackUrl(curRoadmap()) + '">Full ' + esc(trackIndex.trackLabel) + ' roadmap &rarr;</a>';
    }
    function renderRail() {
      var rail = app.querySelector('.lm-rail');
      if (!rail || !railCourse || !railCourse.lessons) return;
      app.classList.add('lm-has-rail');
      var st = courseState(), done = st.completed || {}, pro = body.classList.contains('pro');
      if (!curRoadmap() || !trackIndex) { rail.innerHTML = renderLessonsLevel(done, pro, false); return; }
      if (railLevel === 'track') rail.innerHTML = renderTrackLevel(done, pro);
      else if (railLevel === 'section') rail.innerHTML = renderSectionLevel(done, pro);
      else rail.innerHTML = renderLessonsLevel(done, pro, true);
    }
    function wireRail() {
      if (railWired) return;
      var rail = app.querySelector('.lm-rail'); if (!rail) return;
      railWired = true;
      rail.addEventListener('click', function (e) {
        if (e.target.closest('.lm-rail-up')) {
          e.preventDefault();
          if (railLevel === 'lessons') { viewSection = curSection; railLevel = 'section'; }
          else if (railLevel === 'section') { railLevel = 'track'; }
          else { location.href = roadmapTrackUrl(curRoadmap()); return; }
          renderRail();
          return;
        }
        var sb = e.target.closest('[data-rail-section]');
        if (sb) { e.preventDefault(); viewSection = parseInt(sb.getAttribute('data-rail-section'), 10); railLevel = 'section'; renderRail(); }
      });
    }
    function buildRail() {
      if (windowed) { buildWindowRail(); return; }   // daily lessons have their own
      if (!courseId) return;
      fetch('/courses.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (data) {
        if (!data || !data.courses) return;
        allCourses = data.courses;
        for (var k = 0; k < allCourses.length; k++) { if (allCourses[k].course_id === courseId) { railCourse = allCourses[k]; break; } }
        if (!railCourse) return;
        trackIndex = buildTrackIndex();
        curSection = (railCourse.roadmap && railCourse.roadmap.section) || null;
        viewSection = curSection;
        var s = courseState(); s.last = curSlug; courseSave(s);
        wireRail();
        renderRail();
        renderCrumbs();
        fillGateFreeLink();
        if (i === total - 1) showCompleteActions();   // refresh the card with progress if we're already on the end
      }).catch(function () {});
    }


    /* =====================================================================
       THE DAILY LESSON RAIL
       Windowed lessons only. Reached solely from buildRail()'s first line,
       and every selector it writes lives under
       body[data-lesson-access="windowed"] in lesson-mode.css.

       One loud element, used where the action is: a ring on each lesson that
       is still open, at most three, soonest first, so the first ring in the
       list is always the nearest deadline. Closed lessons carry no geometry,
       one label, and the way back in on hover.

       Data is one authenticated call to /api/me/shelf. A reader who opened the
       lesson from a signed email link on a device with no session has no
       bearer token; the call 401s, the rail stays empty and CSS hides it, and
       the lesson reads exactly as it does today. That is the intended
       degradation, not an oversight.
       ===================================================================== */
    var winShelf = null;
    var winLink = null;          // 'u=..&t=..' when the page was opened from an email
    var winUsedLink = false;     // and true only once it is what identified them
    var WIN_COLLAPSE_KEY = 'rsc-daily-rail-collapsed';
    var WIN_HAS_KEY = 'rsc-daily-rail-has';   // did this reader have one last time

    /* The signed pair the email put in the address bar. The middleware already
       trusts it to serve this lesson; the rail uses it to ask who the reader is
       when there is no session, and carries it on to the next lesson so the
       links it draws actually open. */
    function winLinkParams() {
      try {
        var p = new URLSearchParams(location.search);
        var u = p.get('u'), t = p.get('t');
        return (u && t) ? ('u=' + encodeURIComponent(u) + '&t=' + encodeURIComponent(t)) : null;
      } catch (e) { return null; }
    }
    /* The token rides along only for a reader the link actually identified.
       Without it the next lesson would 302 them to the expiry page, so the rail
       would list lessons and then refuse every one. A signed-in reader needs
       none of that, and their links stay clean. */
    function winHref(slug) {
      return '/' + slug + '.html' + (winUsedLink && winLink ? '?' + winLink : '');
    }
    /* Does this browser hold a session at all? The same probe auth-hydrate
       uses. If it does, the reader has an account and the rail must be read as
       theirs, however long the token takes to arrive: falling back to a link
       that happens to be in the address bar would answer for the wrong person
       and then drag that link through every row. */
    function winHasSession() {
      try {
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k && k.indexOf('sb-') === 0 && k.slice(-11) === '-auth-token' &&
              (localStorage.getItem(k) || '').length) return true;
        }
      } catch (e) {}
      return false;
    }
    function winIsPro() {
      return body.classList.contains('pro') || !!(winShelf && winShelf.pro);
    }

    function winHasRemembered() {
      try { return localStorage.getItem(WIN_HAS_KEY); } catch (e) { return null; }
    }
    function winRemember(has) {
      try { localStorage.setItem(WIN_HAS_KEY, has ? '1' : '0'); } catch (e) {}
    }
    function winCollapsed() {
      try { return localStorage.getItem(WIN_COLLAPSE_KEY) === '1'; } catch (e) { return false; }
    }
    function winSetCollapsed(v) {
      try { localStorage.setItem(WIN_COLLAPSE_KEY, v ? '1' : '0'); } catch (e) {}
    }

    function winLeft(sec) {              // seconds remaining -> what the row says
      if (sec < 3600) return Math.max(1, Math.round(sec / 60)) + ' min left';
      if (sec < 86400) return Math.round(sec / 3600) + 'h left';
      var d = new Date(sec * 1000 + Date.now());
      return winDayShort(d) + ', ' + winTime(d);
    }
    var WIN_DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var WIN_MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
                   'August', 'September', 'October', 'November', 'December'];
    function winDayShort(d) { return WIN_DOW[d.getDay()] + ' ' + d.getDate(); }
    function winTime(d) {
      var h = d.getHours(), ap = h < 12 ? 'am' : 'pm', m = d.getMinutes();
      h = h % 12 || 12;
      return h + (m ? ':' + (m < 10 ? '0' : '') + m : '') + ap;
    }
    function winUrgency(sec) {
      if (sec < 3600) return 'is-urgent';
      if (sec < 86400) return 'is-soon';
      return '';
    }
    /* One label carrying both facts. Whether they read it and how long ago it
       shut are two answers to the same question, and the pair is the
       interesting answer. A lesson they finished needs no date, because
       nothing was lost. */
    function winLabel(r, now, pro) {
      if (r.finished) return 'finished';
      if (pro) return 'not started';
      var closed = new Date(r.closes_at * 1000), today = new Date(now * 1000);
      var sameDay = closed.getDate() === today.getDate() &&
                    closed.getMonth() === today.getMonth() &&
                    closed.getFullYear() === today.getFullYear();
      if (sameDay) return 'missed today';
      if (now - r.closes_at < 172800) return 'missed yesterday';
      return 'not opened';
    }
    /* The ring. 18px, 1.75px stroke, and an arc that never falls below a tenth
       of the circle: a window with forty minutes left is 0.9 percent of 72
       hours, and an arc that thin is an empty ring, which is the opposite of
       what it has to say. */
    function winRing(frac, cls, done) {
      var S = 18, W = 1.75, R = (S - W) / 2, C = 2 * Math.PI * R;
      if (done) {
        return '<span class="lm-dial is-done"><svg width="' + S + '" height="' + S + '" viewBox="0 0 ' + S + ' ' + S + '" aria-hidden="true">' +
          '<circle class="trk" cx="' + S / 2 + '" cy="' + S / 2 + '" r="' + R + '" fill="none" stroke-width="' + W + '"/>' +
          '<path class="tick" d="M5.2 9.2 L7.7 11.7 L12.8 6.4"/></svg></span>';
      }
      frac = Math.max(0.1, Math.min(1, frac));
      return '<span class="lm-dial ' + (cls || '') + '"><svg width="' + S + '" height="' + S + '" viewBox="0 0 ' + S + ' ' + S + '" aria-hidden="true">' +
        '<circle class="trk" cx="' + S / 2 + '" cy="' + S / 2 + '" r="' + R + '" fill="none" stroke-width="' + W + '"/>' +
        '<circle class="arc" cx="' + S / 2 + '" cy="' + S / 2 + '" r="' + R + '" fill="none" stroke-width="' + W + '"' +
        ' stroke-linecap="round" stroke-dasharray="' + C.toFixed(2) + '" stroke-dashoffset="' + (C * (1 - frac)).toFixed(2) + '"/></svg></span>';
    }
    function winPlace(r) {
      if (!r.course_title) return '';
      return r.part ? r.course_title + ', part ' + r.part + ' of ' + r.parts : r.course_title;
    }

    function winRailHtml() {
      var d = winShelf; if (!d) return '';
      var pro = winIsPro();
      var now = Math.floor(Date.now() / 1000);
      var win = (d.window_hours || 72) * 3600;
      var open = d.open || [], closed = d.closed || [];
      var h = '';

      h += '<div class="lm-rail-head">' +
        '<button type="button" class="lm-rail-collapse" data-rail-collapse aria-expanded="true"' +
        ' title="Collapse your daily lessons" aria-label="Collapse your daily lessons">' +
        '<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5"' +
        ' stroke-linejoin="round" aria-hidden="true">' +
        '<rect x="2.2" y="3.6" width="13.6" height="10.8" rx="2.4"/><path d="M7.2 3.6 V14.4"/>' +
        '<path class="fill" d="M4.6 3.6 H7.2 V14.4 H4.6 A2.4 2.4 0 0 1 2.2 12 V6 A2.4 2.4 0 0 1 4.6 3.6 Z"' +
        ' fill="currentColor" stroke="none"/>' +
        /* which way it will move, so the press is predictable */
        '<path class="dir" d="M12.7 7.1 L10.6 9 L12.7 10.9" stroke-linecap="round"/>' +
        '</svg></button>' +
        '<span class="lm-rail-h">Your daily lessons</span>' +
        '<span class="lm-rail-sub">' +
          (pro ? 'No windows on your account'
               : (d.position ? 'Day ' + d.position + ' of the series' : 'Your series so far')) +
        '</span></div>';

      h += '<div class="lm-rail-scroll">';

      if (open.length) {
        h += '<div class="lm-rail-grp">' + (pro ? 'Reading now' : 'Open') +
             ' <span>' + open.length + '</span></div><ol class="lm-rail-rows">';
        open.forEach(function (r) {
          var left = Math.max(0, r.closes_at - now);
          var u = pro ? '' : winUrgency(left);
          var cur = r.slug === curSlug;
          var inner = winRing(pro ? 1 : left / win, u, r.finished) +
            '<span class="lm-rail-tx"><span class="lm-rail-t">' + esc(r.subject) + '</span></span>' +
            (pro ? '' : '<span class="lm-rail-when">' + esc(winLeft(left)) + '</span>');
          var attr = ' title="' + esc(winPlace(r)) + '"';
          h += '<li>' + (cur
            ? '<span class="lm-rail-row is-current ' + u + '"' + attr + ' aria-current="step">' + inner + '</span>'
            : '<a class="lm-rail-row ' + u + '" href="' + esc(winHref(r.slug)) + '"' + attr + '>' + inner + '</a>') + '</li>';
        });
        h += '</ol>';
      }

      if (closed.length) {
        h += '<div class="lm-rail-grp">Earlier <span>' +
             (pro ? 'progress' : closed.length) + '</span></div><ol class="lm-rail-rows">';
        closed.forEach(function (r) {
          // For a paying member these are not shut at all, they are simply
          // earlier. Dimming them to the disabled ink says the opposite of what
          // is true: every one of them opens on a click.
          h += '<li><a class="lm-rail-row is-shut' + (pro ? ' is-available' : '') +
            (r.finished ? ' is-read' : '') + '" href="' + esc(winHref(r.slug)) + '"' +
            ' data-shut="' + esc(r.slug) + '">' +
            '<span class="lm-rail-pad"></span>' +
            '<span class="lm-rail-tx"><span class="lm-rail-t">' + esc(r.subject) + '</span></span>' +
            '<span class="lm-rail-state">' + esc(winLabel(r, now, pro)) + '</span>' +
            '</a></li>';
        });
        h += '</ol>';
      }
      h += '</div>';

      h += '<div class="lm-rail-mini"><ol>' + open.map(function (r) {
        var left = Math.max(0, r.closes_at - now);
        return '<li><a href="' + esc(winHref(r.slug)) + '" title="' + esc(r.subject) +
          (pro ? '' : ' \u00b7 ' + winLeft(left)) + '">' +
          winRing(pro ? 1 : left / win, pro ? '' : winUrgency(left), r.finished) + '</a></li>';
      }).join('') + '</ol></div>';

      if (!pro && closed.length) {
        /* The one place on this rail that mentions Pro. It used to lead with a
           running count of what had shut, which turns a sidebar into a tally
           kept against the reader. The count still gets said once, in the
           closed-shelf email, to people who were actually using the lessons. */
        h += '<div class="lm-rail-foot"><a href="#" data-win-all>Reopen with Pro</a></div>';
      } else if (pro) {
        h += '<div class="lm-rail-foot">Nothing in this list expires.</div>';
      }
      return h;
    }

    function winRender() {
      var rail = app.querySelector('.lm-rail');
      if (!rail || !winShelf) return;
      var any = (winShelf.open || []).length || (winShelf.closed || []).length;
      winRemember(!!any);
      if (!any) {
        // nothing to show: drop the held space rather than leave a bare column
        rail.classList.remove('is-reserved');
        rail.innerHTML = '';
        var w0 = app.querySelector('.lm-win');
        if (w0) { w0.hidden = true; w0.innerHTML = ''; }
        return;
      }
      rail.classList.remove('is-reserved');
      app.classList.add('lm-has-rail');
      rail.innerHTML = winRailHtml();
      if (winCollapsed()) {
        rail.classList.add('is-collapsed');
        var t = rail.querySelector('[data-rail-collapse]');
        if (t) {
          t.setAttribute('aria-expanded', 'false');
          t.setAttribute('title', 'Show your daily lessons');
          t.setAttribute('aria-label', 'Show your daily lessons');
        }
      }
      winRenderLine();
    }

    /* One line under the step dots: when THIS lesson closes, with a hairline
       that empties across its window. It sits on the row the decision is made
       on rather than floating, and it never appears for a member who has paid
       the deadline away. */
    function winRenderLine() {
      var el = app.querySelector('.lm-win');
      if (!el || !winShelf) return;
      el.classList.remove('is-reserved');
      var pro = winIsPro();
      var here = (winShelf.open || []).filter(function (r) { return r.slug === curSlug; })[0];
      if (pro || !here) { el.hidden = true; el.innerHTML = ''; return; }
      var now = Math.floor(Date.now() / 1000);
      var win = (winShelf.window_hours || 72) * 3600;
      var left = Math.max(0, here.closes_at - now);
      var closes = new Date(here.closes_at * 1000);
      var u = winUrgency(left);
      var says = left < 86400
        ? 'This lesson <em>closes in ' + (left < 3600
            ? Math.max(1, Math.round(left / 60)) + ' minutes'
            : Math.round(left / 3600) + ' hours') + '</em>'
        : 'This lesson is <em>open until ' + WIN_DOW_FULL[closes.getDay()] + ', ' + winTime(closes) + '</em>';
      el.hidden = false;
      el.className = 'lm-win ' + u;
      el.innerHTML = '<div class="lm-win-bar"><b style="width:' +
        (Math.min(1, left / win) * 100).toFixed(1) + '%"></b></div>' +
        '<div class="lm-win-row">' + says + '</div>';
    }
    var WIN_DOW_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    /* The Pro moment. A closed lesson in the rail would otherwise navigate to
       /lesson-locked.html, which throws away the lesson the reader is in the
       middle of. The click is intercepted and answered in place. */
    function winProScreen(r, all) {
      var n = (winShelf.closed || []).length;
      var here = (winShelf.open || []).filter(function (x) { return x.slug === curSlug; })[0];
      var courseParts = (here && here.parts) || 0;
      var courseName = (here && here.course_title) || '';
      // only when it is true: three closed against an eleven part course is not
      // "more than the whole of" anything, and this is the one screen that
      // cannot afford a false sentence
      var bigger = (courseParts && n > courseParts && courseName)
        ? ' ' + winWord(n) + ' lessons is more than the whole of ' + esc(courseName) + '.' : '';
      var shut = r ? new Date(r.closes_at * 1000) : null;
      var when = shut ? winSpoken(shut) : '';
      /* Clicking one closed lesson states a fact and stops. No price, no tally
         of the others, no comparison to a course they are part way through. A
         reader who wants the way out has one link in the rail footer, and that
         is where the case gets made. */
      if (!all) {
        return '<div class="lm-pro-card is-plain">' +
          '<div class="lm-pro-top">' +
            '<h3>This one has closed</h3>' +
            '<div class="lm-pro-what"><b>' + esc(r.subject) + '</b>' +
              (winPlace(r) ? '<span>' + esc(winPlace(r)) + '</span>' : '') + '</div>' +
            '<p>It closed on ' + esc(when) + '. Daily lessons stay open for three days.</p>' +
          '</div>' +
          '<div class="lm-pro-bot">' +
            '<button type="button" class="lm-pro-skip">Back to your lesson</button>' +
          '</div></div>';
      }
      /* The single Pro link in the rail lands here, and this is the only screen
         that argues for it. It says the number once, because someone who has
         just asked how to reopen things is owed the size of what they would get
         back. */
      return '<div class="lm-pro-card">' +
        '<div class="lm-pro-top">' +
          '<h3>Reopen every one of them</h3>' +
          '<p>Daily lessons stay open for three days and then they go. ' +
          winWord(n) + ' of yours have.' + bigger + '</p>' +
          '<p>Pro takes the clock off all ' + winWord(n) + ', and off everything still to come. ' +
          'It opens the full tracks as well, though the windows are probably the part you are running into.</p>' +
        '</div>' +
        '<div class="lm-pro-bot">' +
          '<a class="lm-pro-cta" href="/pricing.html">Open every lesson with Pro</a>' +
          '<p class="lm-pro-fine">14 days to change your mind, no questions.</p>' +
          '<button type="button" class="lm-pro-skip">Back to your lesson</button>' +
        '</div></div>';
    }
    var WIN_WORDS = ['no', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight',
                     'Nine', 'Ten', 'Eleven', 'Twelve'];
    function winWord(n) { return WIN_WORDS[n] || String(n); }
    /* "the 21st" is how a date is said out loud; the full date once the month
       has turned over and the day alone would be ambiguous. */
    function winSpoken(d) {
      var now = new Date();
      if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) {
        return d.getDate() + ' ' + WIN_MON[d.getMonth()];
      }
      var day = d.getDate(), t = ['th', 'st', 'nd', 'rd'][(day % 100 - 20) % 10] ||
        ['th', 'st', 'nd', 'rd'][day % 100] || 'th';
      return 'the ' + day + t;
    }
    var winOverlay = null;
    function winClosePro() { if (winOverlay) { winOverlay.remove(); winOverlay = null; } }
    function winOpenPro(r, all) {
      winClosePro();
      var ov = document.createElement('div');
      ov.className = 'lm-pro';
      ov.innerHTML = winProScreen(r, all);
      app.appendChild(ov);
      winOverlay = ov;
      try { if (typeof gtag === 'function') gtag('event', 'daily_rail_pro_view', { slug: curSlug }); } catch (e) {}
      var skip = ov.querySelector('.lm-pro-skip');
      if (skip) skip.addEventListener('click', winClosePro);
      ov.addEventListener('click', function (e) { if (e.target === ov) winClosePro(); });
    }

    function winWire() {
      var rail = app.querySelector('.lm-rail'); if (!rail) return;
      rail.addEventListener('click', function (e) {
        var t = e.target.closest('[data-rail-collapse]');
        if (t) {
          e.preventDefault();
          var now = rail.classList.toggle('is-collapsed');
          winSetCollapsed(now);
          t.setAttribute('aria-expanded', String(!now));
          t.setAttribute('title', (now ? 'Show' : 'Collapse') + ' your daily lessons');
          t.setAttribute('aria-label', (now ? 'Show' : 'Collapse') + ' your daily lessons');
          return;
        }
        var all = e.target.closest('[data-win-all]');
        if (all) { e.preventDefault(); winOpenPro(null, true); return; }
        var row = e.target.closest('[data-shut]');
        if (row) {
          if (winIsPro()) return;                      // Pro follows the link
          e.preventDefault();
          var slug = row.getAttribute('data-shut');
          var r = (winShelf.closed || []).filter(function (x) { return x.slug === slug; })[0];
          if (r) winOpenPro(r, false);
        }
      });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') winClosePro(); });
    }

    /* The token arrives when auth-hydrate's /api/me call lands, which is
       usually after this runs. Asking once at DOM ready and giving up was the
       reason the rail stayed empty on a real session: the answer was simply
       not there yet. Ask again when auth-hydrate says so, with two timed
       fallbacks in case the event is missed, and stop at the first success.

       A reader with no session never gets a token at all, so the rail stays
       empty and CSS hides it. That path is unchanged. */
    var winAsked = false;
    /* Hold the space before the answer arrives, so the lesson never moves under
       the reader. Only for somebody who plausibly has a rail: no session and no
       link means there will never be one, and a remembered "none" means we have
       already asked and been told. */
    function winReserve() {
      var rail = app.querySelector('.lm-rail');
      if (!rail) return;
      if (!winHasSession() && !winLinkParams()) return;
      if (winHasRemembered() === '0') return;
      rail.classList.add('is-reserved');
      if (winCollapsed()) rail.classList.add('is-collapsed');
      var el = app.querySelector('.lm-win');
      if (el && !body.classList.contains('pro')) {
        el.hidden = false;
        el.className = 'lm-win is-reserved';
        // the real structure, invisible, so the height it holds is the exact
        // height the real line will need
        el.innerHTML = '<div class="lm-win-bar"><b style="width:0"></b></div>' +
          '<div class="lm-win-row">&nbsp;</div>';
      }
    }

    function buildWindowRail() {
      winLink = winLinkParams();
      function attempt(allowLink, lastChance) {
        if (winAsked) return;
        var tok = null;
        try { tok = API && API.token && API.token(); } catch (e) {}
        var url = null, opts = {};
        if (tok) {
          url = '/api/me/shelf';
          opts = { headers: { Authorization: 'Bearer ' + tok } };
        } else if (allowLink && winLink && !(winHasSession() && !lastChance)) {
          // no session, but the email named them: same pair the middleware
          // already accepted to serve this page
          url = '/api/me/shelf?' + winLink;
          winUsedLink = true;
        }
        if (!url) return;
        winAsked = true;
        fetch(url, opts)
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (d) {
            if (!d) { winAsked = false; return; }   // let a later attempt retry
            winShelf = d;
            winWire();
            winRender();
          }).catch(function () { winAsked = false; });
      }
      /* Give the session a chance first: a signed-in reader should be read as
         themselves even if an old link is still in the address bar. Only once
         auth has had its say do we fall back to the link. */
      attempt(false);
      document.addEventListener('auth-hydrated', function () { attempt(true); });
      setTimeout(function () { attempt(false); }, 1200);
      setTimeout(function () { attempt(true); }, 2500);
      // last chance: a session token that is present but expired would otherwise
      // block the link for ever, and that reader is signed out in every way that
      // matters here
      setTimeout(function () { attempt(true, true); }, 6000);
      /* If nothing ever answers, give the space back. A stale session token
         with no live bearer, or an endpoint that simply fails, would otherwise
         leave a reserved column and a blank window line sitting there for the
         rest of the visit. Late enough that it never races a slow answer. */
      setTimeout(function () {
        if (winShelf) return;
        var rail = app.querySelector('.lm-rail');
        if (rail) { rail.classList.remove('is-reserved'); }
        var w = app.querySelector('.lm-win');
        if (w && w.classList.contains('is-reserved')) { w.hidden = true; w.innerHTML = ''; }
      }, 9000);
    }

    /* ---- breadcrumb (Roadmap > Track > Section > Lesson) + exit target ----
       From courses.json's roadmap field. The Track + Section crumbs and the exit
       button deep-link into the per-track roadmap page at the exact section
       (/roadmap/<page>.html#rm-s<n>); roadmap-role.js opens + scrolls to it.
       Falls back to the course landing when there is no roadmap data. */
    var BACK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>';
    var ROADMAP_PAGES = { foundations: 'new-to-r', analyst: 'data-analyst', ds: 'data-scientist', ts: 'forecaster', researcher: 'researcher', developer: 'r-developer' };
    function roadmapTrackUrl(rm) { var p = rm && ROADMAP_PAGES[rm.track]; return p ? '/roadmap/' + p + '.html' : '/roadmap/'; }
    function roadmapSectionUrl(rm) { var b = roadmapTrackUrl(rm); return (rm && rm.section && b !== '/roadmap/') ? b + '#rm-s' + rm.section : b; }
    function exitTarget() {
      return (railCourse && railCourse.roadmap && railCourse.roadmap.track) ? roadmapSectionUrl(railCourse.roadmap) : landing;
    }
    function exitLabel() {
      return (railCourse && railCourse.roadmap && railCourse.roadmap.sectionLabel) || (railCourse && railCourse.title) || 'lessons';
    }
    function renderCrumbs() {
      var exitA = app.querySelector('.lm-exit');
      if (exitA) { exitA.setAttribute('href', exitTarget()); exitA.setAttribute('aria-label', 'Back to ' + exitLabel()); exitA.innerHTML = BACK_SVG; }
      var titleEl = app.querySelector('.lm-title');
      if (titleEl && railCourse && railCourse.roadmap) {
        var rm = railCourse.roadmap, tUrl = roadmapTrackUrl(rm), sUrl = roadmapSectionUrl(rm), sep = ' <span class="lm-sep">&rsaquo;</span> ';
        titleEl.classList.add('lm-crumbs');
        titleEl.innerHTML = '<a href="/roadmap/">Roadmap</a>' + sep +
          '<a href="' + tUrl + '">' + esc(rm.trackLabel || rm.track) + '</a>' + sep +
          '<a href="' + sUrl + '">' + esc(rm.sectionLabel || '') + '</a>' + sep +
          '<span class="lm-crumb-cur">' + esc(lessonTitle) + '</span>' +
          (showCounter ? ' <span class="lm-crumb-les">&middot; Lesson ' + esc(ds.courseLesson) + ' of ' + esc(ds.courseTotal) + '</span>' : '');
      }
    }

    /* ---- windowed mini-course ceremony (Phase B) ----
       On the final step of a windowed lesson: if this is the course's last
       part and every gated check across all parts is passed, the server
       mints the badge and we run the ceremony - the dismissable Why-Pro
       screen first (owner-decided order; Pro users skip it), then the badge
       with LinkedIn + verify links. Non-final parts get the slim next-part
       nudge instead. Fail-quiet: any error leaves the normal completion
       card untouched. */
    var ceremonyRan = false;
    function nurtureCeremony(step) {
      if (!windowed || ceremonyRan) return;
      ceremonyRan = true;
      fetch('/api/nurture/catalog').then(function (r) { return r.json(); }).then(function (cat) {
        var course = null, part = null;
        (cat.courses || []).forEach(function (c) {
          c.parts.forEach(function (pp) { if (pp.slug === curSlug) { course = c; part = pp; } });
        });
        if (!course) return;
        var isLast = part.part === course.parts.length;
        if (!isLast) {
          var nxt = course.parts[part.part]; // 0-indexed access = next part
          var nudge = document.createElement('div');
          nudge.className = 'lm-nudge-next';
          nudge.innerHTML = 'Part ' + (part.part + 1) + ' of ' + course.parts.length +
            (nxt ? ', <b>' + esc(nxt.subject) + '</b>,' : '') +
            ' unlocks with an upcoming email. <a href="/pricing.html">Pro opens every part now &rarr;</a>';
          step.appendChild(nudge);
          return;
        }
        var tok = null;
        try { if (API && API.token) tok = API.token(); } catch (e) {}
        if (!tok) return;
        fetch('/api/nurture/course-status?course=' + encodeURIComponent(course.id), {
          headers: { Authorization: 'Bearer ' + tok }
        }).then(function (r) { return r.ok ? r.json() : null; }).then(function (st) {
          if (!st) return;
          if (!st.complete) {
            var note = document.createElement('div');
            note.className = 'lm-nudge-next';
            note.innerHTML = 'Pass every check in all ' + st.parts_total + ' parts to earn the <b>' +
              esc(course.title) + '</b> badge. ' + st.parts_done + ' of ' + st.parts_total + ' parts done.';
            step.appendChild(note);
            return;
          }
          if (body.classList.contains('pro')) { showBadgeScreen(course, st.badge); }
          else { showWhyPro(function () { showBadgeScreen(course, st.badge); }); }
        }).catch(function () {});
      }).catch(function () {});
    }

    function showWhyPro(onContinue) {
      var ov = document.createElement('div');
      ov.className = 'lm-whypro';
      ov.innerHTML = '<div class="lm-whypro-card">' +
        '<h3>Why invest in r-statistics.co Pro?</h3>' +
        '<p>You just finished a whole mini course, so here is the honest pitch, once.</p>' +
        '<p>Pro opens every mini-course lesson anytime, forever - no 3-day windows, no waiting ' +
        'for the schedule. Plus the full Data Analyst and Data Scientist tracks, unlimited ' +
        'graded practice, and the certificates.</p>' +
        '<p class="lm-whypro-fine">Whatever you choose, the daily emails stay free and everything ' +
        'you have finished stays yours.</p>' +
        '<a class="lm-whypro-cta" href="/pricing.html">See Pro plans</a>' +
        '<button type="button" class="lm-whypro-skip">Continue to your badge &rarr;</button>' +
        '</div>';
      document.body.appendChild(ov);
      try { if (typeof gtag === 'function') gtag('event', 'whypro_view', { course: curSlug }); } catch (e) {}
      ov.querySelector('.lm-whypro-skip').addEventListener('click', function () {
        ov.remove(); onContinue();
      });
    }

    function showBadgeScreen(course, badge) {
      if (!badge) return;
      var ov = document.createElement('div');
      ov.className = 'lm-whypro';
      var when = new Date(badge.earned_at * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      ov.innerHTML = '<div class="lm-whypro-card lm-badge-card">' +
        '<div class="lm-badge-medal">&#127942;</div>' +
        '<h3>' + esc(course.title) + '</h3>' +
        '<p>Every part finished, every check passed. This badge is yours - earned ' + esc(when) + '.</p>' +
        '<a class="lm-whypro-cta" target="_blank" rel="noopener" href="' + esc(badge.linkedin_url) + '">Add to LinkedIn</a>' +
        '<a class="lm-badge-verify" target="_blank" rel="noopener" href="' + esc(badge.verify_url) + '">View your verified badge page</a>' +
        '<button type="button" class="lm-whypro-skip">Back to the lesson &rarr;</button>' +
        '</div>';
      document.body.appendChild(ov);
      try { if (typeof gtag === 'function') gtag('event', 'badge_earned_view', { badge: badge.id }); } catch (e) {}
      ov.querySelector('.lm-whypro-skip').addEventListener('click', function () { ov.remove(); });
    }

    /* ---- completion-actions card (content-adjacent, not stranded at the bottom) ---- */
    function showCompleteActions() {
      var step = steps[total - 1];
      if (!step || step.querySelector('.lm-complete-actions')) return;
      nurtureCeremony(step);
      var prog = '';
      if (railCourse && railCourse.lessons) {
        var st = courseState(), done = st.completed || {};
        var dn = railCourse.lessons.filter(function (l) { return done[l.slug]; }).length;
        prog = '<div class="lm-ca-prog">' +
          (ds.courseLesson && ds.courseTotal ? 'Lesson ' + esc(ds.courseLesson) + ' of ' + esc(ds.courseTotal) + ' complete' : 'Lesson complete') +
          ' &middot; ' + dn + ' / ' + railCourse.lessons.length + ' done</div>';
      }
      var primary = nextHref
        ? '<a class="lm-ca-next" href="' + esc(nextHref) + '">Next lesson &rarr;</a>'
        : '<a class="lm-ca-next" href="' + esc(exitTarget()) + '">Finish &check;</a>';
      var card = document.createElement('div');
      card.className = 'lm-complete-actions';
      card.innerHTML = prog + '<div class="lm-ca-btns">' + primary +
        '<button type="button" class="lm-ca-review">Review this lesson</button>' +
        '<a class="lm-ca-back" href="' + esc(exitTarget()) + '">&larr; ' + esc(exitLabel()) + '</a></div>';
      step.appendChild(card);
      var rv = card.querySelector('.lm-ca-review');
      if (rv) rv.addEventListener('click', function () { i = 0; render(); });
      completionOffer(card);
    }

    /* The one moment in the product where the reader has just succeeded at
       something, and until now the only moment nothing was asked of them. The
       line names what they actually just did; it does not sell. Never shown to
       anyone who already pays, and never a modal. */
    function completionOffer(card) {
      if (body.classList.contains('pro')) return;
      if (windowed && winShelf && winShelf.pro) return;
      if (card.querySelector('.lm-ca-pro')) return;

      var line = '', cta = 'See what Pro opens';
      if (windowed) {
        line = 'Daily lessons stay open for three days. Pro keeps every one of them open.';
        cta = 'Reopen with Pro';
      } else if (railCourse && railCourse.lessons) {
        var st2 = courseState(), dn2 = railCourse.lessons.filter(function (l) {
          return (st2.completed || {})[l.slug]; }).length;
        var left = railCourse.lessons.length - dn2;
        if (left > 0) {
          line = dn2 + ' of ' + railCourse.lessons.length + ' done in ' +
            (railCourse.title || 'this course') + '. ' +
            (left === 1 ? 'The last one is' : 'The remaining ' + left + ' are') + ' open with Pro.';
        } else {
          line = 'That is all of ' + (railCourse.title || 'this course') +
            '. The rest of the track is open with Pro.';
        }
      } else {
        line = 'The rest of this track is open with Pro.';
      }

      var el = document.createElement('div');
      el.className = 'lm-ca-pro';
      el.innerHTML = '<span>' + esc(line) + '</span>' +
        '<a href="/pricing.html" data-lm-ca-pro>' + esc(cta) + ' &rarr;</a>';
      card.appendChild(el);
      try { rsSignal('offer_view', 'lesson-complete:shown'); } catch (e) {}
      var a = el.querySelector('[data-lm-ca-pro]');
      if (a) a.addEventListener('click', function () {
        try { rsSignal('offer_view', 'lesson-complete:click'); } catch (e) {}
      });
    }

    function toggleFs() {
      try {
        if (!document.fullscreenElement) { if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen(); }
        else if (document.exitFullscreen) document.exitFullscreen();
      } catch (e) {}
    }
    var railToggle = app.querySelector('.lm-rail-toggle');
    if (railToggle) railToggle.addEventListener('click', function () { app.classList.toggle('rail-open'); });
    var fsBtn = app.querySelector('.lm-fs');
    if (fsBtn) fsBtn.addEventListener('click', toggleFs);
    if (windowed) winReserve();      // before anything is fetched, so nothing moves
    buildRail();
    // auth-hydrate stamps body.pro after its /api/me call returns, which can
    // land after the rail has drawn. Repaint once so a Pro member never sees a
    // countdown they have paid to be rid of. Windowed lessons only.
    if (windowed) {
      document.addEventListener('auth-hydrated', function () { if (winShelf) winRender(); });
      setTimeout(function () { if (winShelf) winRender(); }, 1200);
    }

    // If resuming into a locked region, clamp to the preview.
    if (locked && i >= PREVIEW_STEPS) i = PREVIEW_STEPS - 1;
    render();
    document.documentElement.classList.remove('lm-boot');   // overlay built + first step shown: reveal without flashing the raw document
    if (API && API.token && API.token()) hydrateSolved();
  });

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c];
    });
  }
})();
