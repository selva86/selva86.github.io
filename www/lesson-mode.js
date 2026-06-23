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
    var landing = ds.courseLanding || '/';
    var nextHref = ds.courseNext || '';
    var total = steps.length;
    var courseId = ds.courseId || '';
    var curSlug = location.pathname.replace(/^\//, '').replace(/index\.html?$/i, '').replace(/\.html?$/i, '').replace(/\/$/, '');
    var COURSE_KEY = 'rsc-course-v1:' + courseId;
    var railCourse = null;

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
        '<span class="lm-title">' + esc(courseTitle) +
          (ds.courseLesson && ds.courseTotal ? ' <span>&middot; Lesson ' + esc(ds.courseLesson) + ' of ' + esc(ds.courseTotal) + '</span>' : '') +
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

    var segEls = Array.prototype.slice.call(app.querySelectorAll('.lm-segs i'));
    var curEl = app.querySelector('.lm-cur');
    var midEl = app.querySelector('.lm-mid');
    var backBtn = app.querySelector('.lm-back');
    var contBtn = app.querySelector('.lm-cont');

    /* ---- Pro gating ---- */
    var locked = (access === 'pro') && !body.classList.contains('pro');
    document.addEventListener('auth-hydrated', function (e) {
      var pro = !!(e.detail && e.detail.me && e.detail.me.pro);
      if (pro && locked) { locked = false; render(); }
      hydrateSolved();
    });

    /* ---- grading ---- */
    var API = window.RSCExerciseAPI;
    var hub = API ? API.hubSlugFromPath() : '';
    function exerciseId(step) {
      var ex = step.querySelector('.exercise');
      return ex ? ex.getAttribute('data-exercise-id') : '';
    }
    function markPassed(idx) {
      if (state.passed[idx]) return;
      state.passed[idx] = true;
      save();
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
          step.classList.add('passed');     // either answer reveals the lesson; gate opens
          markPassed(idx);
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
        if (pass) { step.classList.add('passed'); markPassed(idx); render(); }
      });
    });

    /* ---- navigation ---- */
    var i = Math.min(state.furthest || 0, total - 1);
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

    function render() {
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
      if (i === total - 1 && courseId) markCourseLessonDone(curSlug);   // reaching the last step = lesson done
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
    function renderRail() {
      var rail = app.querySelector('.lm-rail');
      if (!rail || !railCourse || !railCourse.lessons) return;
      app.classList.add('lm-has-rail');
      var st = courseState(), done = st.completed || {}, pro = body.classList.contains('pro');
      var dn = railCourse.lessons.filter(function (l) { return done[l.slug]; }).length;
      var h = '<div class="lm-rail-head"><span class="lm-rail-title">' + esc(railCourse.title) + '</span>' +
        '<span class="lm-rail-prog">' + dn + ' / ' + railCourse.lessons.length + ' done</span></div><ol class="lm-rail-list">';
      railCourse.lessons.forEach(function (l) {
        var cur = l.slug === curSlug, isDone = !!done[l.slug];
        var locked = String(l.access || '').toLowerCase() === 'pro' && !pro;
        var soon = l.built === false;
        var cls = 'lm-rail-item' + (cur ? ' current' : '') + (isDone ? ' done' : '') + (locked ? ' locked' : '') + (soon ? ' soon' : '');
        var mk = isDone ? '<span class="lm-rail-mk done">&#10003;</span>' : '<span class="lm-rail-mk">' + (l.order || '') + '</span>';
        var badge = soon ? '<span class="lm-rail-badge">soon</span>' : (locked ? '<span class="lm-rail-badge">Pro</span>' : '');
        var inner = mk + '<span class="lm-rail-tx">' + esc(l.title) + '</span>' + badge;
        if (cur || soon) h += '<li><span class="' + cls + '"' + (cur ? ' aria-current="step"' : '') + '>' + inner + '</span></li>';
        else h += '<li><a class="' + cls + '" href="/' + esc(l.slug) + '.html">' + inner + '</a></li>';
      });
      rail.innerHTML = h + '</ol>';
    }
    function buildRail() {
      if (!courseId) return;
      fetch('/courses.json', { cache: 'force-cache' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (data) {
        if (!data || !data.courses) return;
        for (var k = 0; k < data.courses.length; k++) { if (data.courses[k].course_id === courseId) { railCourse = data.courses[k]; break; } }
        if (!railCourse) return;
        var s = courseState(); s.last = curSlug; courseSave(s);
        renderRail();
      }).catch(function () {});
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
    if (API && API.token && API.token()) hydrateSolved();
  });

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c];
    });
  }
})();
