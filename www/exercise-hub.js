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

  // Social-proof counter — wired to a backend AFTER the login project.
  // Set COUNTER_ENDPOINT to the counter URL to switch it on; empty = off.
  // reportSolve() is the single integration point (see below).
  var COUNTER_ENDPOINT = '';

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
    return String(text || '')
      .replace(/×/g, 'x')      // tibble "N × M" header -> ASCII "N x M"
      .replace(/…/g, '...')    // unicode ellipsis -> ASCII (truncated tibbles)
      .replace(/ /g, ' ')      // non-breaking space -> normal space
      .split('\n')
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
    }
  };

  /* Report the first solve of an exercise to the social-proof counter.
     COUNTER-READY HOOK: the backend (counter service) is set up after the
     login project. Until COUNTER_ENDPOINT is set this is a no-op. markSolved
     calls this only on the genuine first solve, so it fires at most once per
     exercise per browser - i.e. it counts unique solvers, not page reloads.
     When wiring the backend, this function body is the only thing to change. */
  function reportSolve(exerciseId) {
    if (!COUNTER_ENDPOINT) return;
    try {
      fetch(COUNTER_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exercise: exerciseId, page: location.pathname }),
        keepalive: true
      }).catch(function () {});
    } catch (e) { /* counter is best-effort; never block the UI */ }
  }

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
  var progressFillEl, progressLabelEl, streakEl, xpNumEl, xpGainEl;

  /* Native position:sticky is dead here - the site sets overflow on
     #content / body / html, which kills sticky for descendants. So pin the
     bar to the viewport ourselves: position:fixed once scrolled past, in
     normal flow otherwise, with a placeholder holding the flow space. */
  function makeBarSticky(bar) {
    var ph = document.createElement('div');
    ph.setAttribute('aria-hidden', 'true');
    bar.parentNode.insertBefore(ph, bar);
    var pinned = false;
    function sync() {
      var anchor = ph.getBoundingClientRect().top + window.scrollY;
      var shouldPin = window.scrollY >= anchor;
      if (shouldPin !== pinned) {
        pinned = shouldPin;
        if (pinned) {
          var r = ph.getBoundingClientRect();
          ph.style.height = bar.offsetHeight + 'px';
          bar.style.position = 'fixed';
          bar.style.top = '0';
          bar.style.left = r.left + 'px';
          bar.style.width = r.width + 'px';
          bar.classList.add('is-pinned');
        } else {
          ph.style.height = '0';
          bar.style.position = '';
          bar.style.top = '';
          bar.style.left = '';
          bar.style.width = '';
          bar.classList.remove('is-pinned');
        }
      } else if (pinned) {
        var r2 = ph.getBoundingClientRect();
        bar.style.left = r2.left + 'px';
        bar.style.width = r2.width + 'px';
      }
    }
    window.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    sync();
  }

  function buildStatusBar(total, streakDays) {
    var bar = document.createElement('div');
    bar.className = 'xh-statusbar';

    streakEl = document.createElement('div');
    streakEl.className = 'xh-streak';
    streakEl.innerHTML = '🔥 <span></span>';
    streakEl.querySelector('span').textContent = streakDays + '-day streak';

    var xpEl = document.createElement('div');
    xpEl.className = 'xh-xp';
    xpEl.title = 'Experience points: harder exercises are worth more';
    xpEl.innerHTML = '⚡ <b>0</b> XP' +
      '<span class="xh-xp-gain" aria-hidden="true"></span>';
    xpNumEl = xpEl.querySelector('b');
    xpGainEl = xpEl.querySelector('.xh-xp-gain');

    var prog = document.createElement('div');
    prog.className = 'xh-progress';
    prog.setAttribute('role', 'progressbar');
    prog.setAttribute('aria-valuemin', '0');
    prog.setAttribute('aria-valuemax', String(total));
    prog.setAttribute('aria-valuenow', '0');
    prog.setAttribute('aria-label', 'Exercises solved');
    prog.innerHTML =
      '<span class="xh-progress-count"><b>0</b> / ' + total + ' solved</span>' +
      '<div class="xh-progress-track"><div class="xh-progress-fill"></div></div>' +
      '<span class="xh-progress-pct">0%</span>';

    bar.appendChild(streakEl);
    bar.appendChild(xpEl);
    bar.appendChild(prog);

    progressFillEl = bar.querySelector('.xh-progress-fill');
    progressLabelEl = bar.querySelector('.xh-progress-count');
    progressLabelEl._prog = prog;

    // Place directly above the page H1 header (matches the mock).
    var content = document.querySelector('#content') || document.body;
    var h1 = content.querySelector('h1');
    if (h1 && h1.parentElement) {
      h1.parentElement.insertBefore(bar, h1);
    } else {
      var fallback = content.querySelector('section.exercise');
      if (fallback && fallback.parentElement) {
        fallback.parentElement.insertBefore(bar, fallback);
      } else {
        content.insertBefore(bar, content.firstChild);
      }
    }
    makeBarSticky(bar);
  }

  function updateProgress(solvedCount, total) {
    if (!progressFillEl) return;
    var pct = total ? Math.round(solvedCount / total * 100) : 0;
    progressFillEl.style.width = pct + '%';
    progressLabelEl.querySelector('b').textContent = solvedCount;
    progressLabelEl._prog.querySelector('.xh-progress-pct').textContent = pct + '%';
    progressLabelEl._prog.setAttribute('aria-valuenow', String(solvedCount));
  }

  /* Briefly pulse the solved-count - the status bar is always on screen,
     so this is a scroll-independent confirmation that a solve registered. */
  function pulseProgress() {
    if (!progressLabelEl) return;
    var b = progressLabelEl.querySelector('b');
    if (!b) return;
    b.classList.remove('xh-bump');
    void b.offsetWidth;
    b.classList.add('xh-bump');
  }

  /* progress-bar surge - a glow pulse on the fill when an exercise is solved */
  function surgeProgressFill() {
    if (!progressFillEl) return;
    progressFillEl.classList.remove('xh-surge');
    void progressFillEl.offsetWidth;
    progressFillEl.classList.add('xh-surge');
  }

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
    }
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
      reportSolve(card.id);   // counter-ready hook (no-op until backend wired)
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
