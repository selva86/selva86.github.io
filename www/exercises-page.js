// exercises-page.js — live grader hero + signed-in streak/XP personalization.
// Vanilla JS, no libraries. Guards every DOM access; never throws.
// Dark-mode toggle and reveal-on-scroll are provided by sections-v3.js
// (the shared chrome), NOT here.
(function () {
  'use strict';

  // =================================================================
  // 1. THE DELIGHT: a real, client-side graded exercise (hero).
  //    Lifted from the mock <script>, exposed as globals for the
  //    fragment's inline onclick handlers. Null-guarded throughout.
  // =================================================================
  var solved = false;

  function show(el, kind, body, xp) {
    if (!el) return;
    el.className = 'verdict ' + kind + ' show';
    var label = kind === 'ok'
      ? '<svg class="ic ic-sm"><use href="#i-check"/></svg> Solved'
      : '<svg class="ic ic-sm"><use href="#i-pencil"/></svg> Keep going';
    el.innerHTML = '<div class="vt">' + label + '</div><div class="vb">' + body + '</div>' +
      (xp ? '<div class="xp">' + xp + '</div>' : '');
  }

  function checkAnswer() {
    var ans = document.getElementById('answer');
    var v = document.getElementById('verdict');
    if (!ans || !v) return;
    var src = ans.value;
    // strip comments + whitespace, look at the user's actual expression(s)
    var code = src.replace(/#[^\n]*/g, ' ').replace(/\s+/g, ' ').trim();

    var usedSort = /\bsort\s*\(/.test(code);
    var hasSecond =
      /max\s*\(\s*x\s*\[\s*x\s*[<!]=?\s*max\s*\(\s*x\s*\)/.test(code) ||   // max(x[x < max(x)])
      /x\s*\[\s*-\s*which\.max\s*\(\s*x\s*\)\s*\][\s\S]*max/.test(code) || // max(x[-which.max(x)])
      /max\s*\(\s*x\s*\[\s*-\s*which\.max/.test(code) ||
      /order\s*\(\s*x\s*,\s*decreasing\s*=\s*(t|true)/i.test(code) ||      // order(...)[2]
      /which\s*\(\s*x\s*==\s*max\s*\(\s*x\s*\[\s*x\s*[<!]/.test(code) ||
      /\b23\b/.test(code.replace('42', ''));                              // last resort: literal 23

    if (usedSort) {
      show(v, 'hint', 'Almost. That works, but the brief asked you to skip <code>sort()</code> on purpose. The trick is to knock out the maximum first, then take the max of what is left. Try <code>max(x[x &lt; max(x)])</code> and run it again.');
    } else if (hasSecond && !/\b42\b/.test(code.replace(/c\([^)]*\)/, ''))) {
      solved = true;
      show(v, 'ok', 'Correct. <code>max(x[x &lt; max(x)])</code> reads as "the biggest value that is not the biggest value", which is exactly the second largest. That is the kind of indexing that stops being scary on about the third try.',
        'That is +10 XP once you sign in &mdash; and 1 down, 49 to go in this hub.');
    } else {
      show(v, 'hint', 'Not quite there yet, and that is fine, this is the whole point. You want an expression that lands on <code>23</code>. One clean route: filter out the maximum with a logical test, then take the max of the rest. Have a go, then hit "Show me one way" if you want the answer.');
    }
  }

  function loadSolution() {
    var ans = document.getElementById('answer');
    var v = document.getElementById('verdict');
    if (ans) {
      ans.value =
        'x <- c(4, 19, 7, 42, 23)\n# drop the max, then take the max of what remains\nmax(x[x < max(x)])';
    }
    show(v, 'hint', 'There is one clean way. Read it out loud: "the maximum of the values that are less than the maximum." Press Check to see it graded as your own, that last step matters more than it sounds.');
  }

  function focusEx() {
    setTimeout(function () {
      var a = document.getElementById('answer');
      if (a) {
        a.focus();
        var pos = a.value.indexOf('\n');
        var p2 = a.value.indexOf('\n', pos + 1);
        if (p2 > -1) a.setSelectionRange(p2, p2);
      }
    }, 420);
  }

  window.checkAnswer = checkAnswer;
  window.loadSolution = loadSolution;
  window.focusEx = focusEx;

  // =================================================================
  // 2. Signed-in personalization (anon-safe, additive, fail-safe).
  //    Turns the streak "preview" into the user's real status when a
  //    Supabase session exists. Anonymous visitors see the authored
  //    sample preview unchanged.
  // =================================================================

  // Copied from auth-hydrate.js / cert-page.js.
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

  function fetchJson(url, token) {
    var headers = { 'Accept': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    return fetch(url, { headers: headers, credentials: 'include' }).then(function (r) {
      if (!r.ok) return null;
      return r.json();
    }).catch(function () { return null; });
  }

  function num(n) {
    n = Number(n);
    return isFinite(n) && n >= 0 ? n : 0;
  }

  function applyStats(stats, me, tracksData) {
    var streak = document.getElementById('streak');
    if (!streak || !stats) return;

    var cap = document.getElementById('streakCap');
    if (cap) cap.textContent = '';   // no longer a preview — this is the real user

    var name = me && me.user && me.user.display_name;
    var lab = document.getElementById('streakLab');
    if (lab) lab.textContent = 'Welcome back' + (name ? ', ' + name : '') + '.';

    var days = num(stats.current_streak_days);
    var xp = num(stats.total_xp);
    var main = document.getElementById('streakMain');
    if (main) {
      main.innerHTML =
        '<svg class="ic ic-sm"><use href="#i-flame"/></svg> ' + days + ' day streak' +
        ' <span style="opacity:.5">&middot;</span> ' +
        '<svg class="ic ic-sm"><use href="#i-bolt"/></svg> ' + xp.toLocaleString() + ' XP';
    }

    // furthest-along in-progress track from /api/me/tracks
    var best = null;
    if (tracksData && Array.isArray(tracksData.tracks)) {
      tracksData.tracks.forEach(function (t) {
        if (!t) return;
        var pct = num(t.pct);
        if (pct > 0 && pct < 100 && (!best || pct > num(best.pct))) best = t;
      });
    }
    var sub = document.getElementById('streakSub');
    if (sub) {
      sub.textContent = best
        ? 'Furthest along: ' + best.name + ' — ' + num(best.solved) + '/' + num(best.total_exercises) + ' solved'
        : 'Pick a hub below and keep the streak alive.';
    }
    var resume = document.getElementById('streakResume');
    if (resume) resume.setAttribute('href', '#topics');
  }

  function hydrate() {
    var streak = document.getElementById('streak');
    if (!streak) return;
    var token = readAccessToken();
    if (!token) return;   // anonymous: leave the authored sample preview

    Promise.all([
      fetchJson('/api/me/stats', token),
      fetchJson('/api/me', token),
      fetchJson('/api/me/tracks', token),
    ]).then(function (r) {
      if (!r[0]) return;
      try { applyStats(r[0], r[1], r[2]); } catch (_) { /* never throw */ }
    }).catch(function () { /* leave preview */ });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hydrate);
  } else {
    hydrate();
  }
})();
