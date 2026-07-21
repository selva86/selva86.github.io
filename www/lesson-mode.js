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
        '<button class="lm-rail-toggle" type="button" aria-label="Show lessons in this course">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button>' +
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
          '<div class="lm-segs">' + steps.map(function () { return '<i></i>'; }).join('') + '</div>' +
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
    document.documentElement.style.overflow = 'hidden';   // the page scroll lives on <html>; locking body alone leaves a stray scrollbar behind the overlay

    var segEls = Array.prototype.slice.call(app.querySelectorAll('.lm-segs i'));
    var curEl = app.querySelector('.lm-cur');
    var midEl = app.querySelector('.lm-mid');
    var backBtn = app.querySelector('.lm-back');
    var contBtn = app.querySelector('.lm-cont');

    /* ---- Pro gating ---- */
    // stripped = the server removed locked step content for this (non-Pro)
    // request; the shells remain so step counts stay honest. A stripped page
    // is always treated as locked client-side regardless of any local state.
    var stripped = body.getAttribute('data-stripped') === '1';
    var locked = ((access === 'pro') && !body.classList.contains('pro')) || stripped;
    if (!stripped) { try { sessionStorage.removeItem('rsc-lm-reload:' + location.pathname); } catch (e) {} }

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
    var accountGated = (access !== 'pro') && lessonOrder > FREE_PREVIEW_LESSONS;
    var accountLocked = accountGated && !signedIn;

    document.addEventListener('auth-hydrated', function (e) {
      var me = e.detail && e.detail.me;
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
      if (API && id) API.reportSolve(hub, id, 0);
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
    // A locked viewer never resumes past the preview, whatever localStorage says.
    if (locked) i = Math.min(i, PREVIEW_STEPS - 1);
    var showingPaywall = false;

    function gated(idx) {
      return steps[idx].hasAttribute('data-gate') && !steps[idx].classList.contains('passed');
    }

    function renderPaywall() {
      showingPaywall = true;
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

    function renderSignInWall() {
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
      // Enforce the Pro wall on every render, not only on forward clicks:
      // resume state, storage edits and re-renders all funnel through here.
      if (locked && i >= PREVIEW_STEPS) { i = PREVIEW_STEPS - 1; renderPaywall(); return; }
      var sw = stage.querySelector('.lm-signin'); if (sw) sw.style.display = 'none';
      if (showingPaywall) { var p = stage.querySelector('.lm-paywall'); if (p) p.style.display = 'none'; showingPaywall = false; }
      steps.forEach(function (s, k) { s.classList.toggle('on', k === i); });
      segEls.forEach(function (e, k) { e.className = k < i ? 'done' : (k === i ? 'cur' : ''); });
      curEl.textContent = i + 1;
      midEl.textContent = 'Step ' + (i + 1) + ' of ' + total;
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
      // Pro wall: free preview is the first PREVIEW_STEPS; block beyond it.
      if (delta > 0 && locked && target >= PREVIEW_STEPS) { renderPaywall(); return; }
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
      if (!s.completed[slug]) { s.completed[slug] = true; s.last = slug; courseSave(s); renderRail(); }
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
        if (i === total - 1) showCompleteActions();   // refresh the card with progress if we're already on the end
      }).catch(function () {});
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

    /* ---- completion-actions card (content-adjacent, not stranded at the bottom) ---- */
    function showCompleteActions() {
      var step = steps[total - 1];
      if (!step || step.querySelector('.lm-complete-actions')) return;
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
    buildRail();

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
