/* repro-repair.js - a broken analysis script, repaired one fault at a time, until it runs
 * twice from a clean session and gives the same answer both times.
 *
 * Serves the reproducibility objection in The Publishing Handbook and the sharing chapters
 * in Part 10. The reader is not asked to agree that hidden state is bad. They are handed a
 * script that works on the author's machine and nowhere else, and they have to make it run.
 *
 * THE MECHANIC. Four faults are planted, each on a specific line:
 *
 *   1. hidden state     the script uses an object that only exists because it was typed
 *                       into the console earlier and never saved
 *   2. absolute path    a file path that exists on exactly one laptop
 *   3. unset seed       a random step with no seed, so the numbers change between runs
 *   4. load order       a function is called before the package that defines it is loaded,
 *                       and a later package masks it
 *
 * Click a flagged line to see the fault and apply its repair. Then press Run. The run is a
 * simulation of a FRESH session, which is the whole point: the script has no memory of what
 * you did before, so a fault that a warm session hides shows up immediately.
 *
 * The seed fault is the interesting one and it is why the checker runs the script TWICE.
 * With no seed the script runs perfectly the first time and prints a different number the
 * second time. "It ran" is not "it reproduces", and this is the cheapest way to feel that.
 *
 * The emitted R is the repaired script, and it really runs: it builds its own data instead
 * of reading a path, sets a seed, loads what it uses at the top, and prints a number that
 * is the same on every machine. Verified against R 4.6.0.
 *
 * cfg: {
 *   faults: ["state","path","seed","order"],   // which faults to plant (default: all four)
 *   seed: 12345                                // the seed the repaired script uses
 * }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u;

  var LIGHT = {
    ink: '#131720', body: '#434b59', mut: '#677084', faint: '#97a0b2',
    line: '#d8dee9', grid: '#eef1f6', acc: '#1f7a55', c0: '#2563a8', c1: '#b5631a',
    bad: '#c2410c', panel: '#ffffff', soft: '#f6f8fa',
    add: '#e7f3ec', del: '#fbeae5', codeBg: '#0d1117', codeFg: '#e6edf3'
  };
  var DARK = {
    ink: '#eef4fb', body: '#c3d1e3', mut: '#93a4bb', faint: '#6f8299',
    line: 'rgba(255,255,255,.24)', grid: 'rgba(255,255,255,.10)', acc: '#46c08a',
    c0: '#7fb2ea', c1: '#e3a05a', bad: '#f4805a', panel: '#101c2b', soft: 'rgba(255,255,255,.05)',
    add: 'rgba(70,192,138,.18)', del: 'rgba(244,128,90,.18)', codeBg: '#0a0f16', codeFg: '#e6edf3'
  };
  function lumOf(c) {
    c = String(c).trim(); var r, g, b, m;
    if (c.charAt(0) === '#') {
      if (c.length === 4) { r = parseInt(c[1] + c[1], 16); g = parseInt(c[2] + c[2], 16); b = parseInt(c[3] + c[3], 16); }
      else { r = parseInt(c.substr(1, 2), 16); g = parseInt(c.substr(3, 2), 16); b = parseInt(c.substr(5, 2), 16); }
    } else if ((m = c.match(/rgba?\(([^)]+)\)/))) { var p = m[1].split(','); r = +p[0]; g = +p[1]; b = +p[2]; }
    else return 1;
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  }
  function isDark(el) {
    try { var v = getComputedStyle(el).getPropertyValue('--lm-panel'); if (v && v.trim()) return lumOf(v) < 0.45; } catch (e) {}
    return !!(document.documentElement && document.documentElement.classList.contains('dark'));
  }
  function palette(el) { return isDark(el) ? DARK : LIGHT; }

  /* ---------------- the script, line by line ----------------
     `fault` marks a line as breakable; `broken` is what it says before the repair and
     `fixed` is what it says after. Lines with no fault never change. */
  function script(seed) {
    return [
      { t: '# analysis.R  -  effect of the programme on follow-up score' },
      { t: 'library(dplyr)' },
      { fault: 'order', broken: '', fixed: 'library(MASS)          # every package attached at the top, where you can see them' },
      { t: '' },
      { fault: 'path',
        broken: 'raw   <- read.csv("C:/Users/sam/Desktop/final_v3 (2).csv")',
        fixed: 'raw   <- read.csv("data/trial.csv")     # a path inside the project folder' },
      { fault: 'state',
        broken: 'trial <- cleaned %>% filter(!is.na(score))   # where does `cleaned` come from?',
        fixed: 'trial <- raw %>% filter(!is.na(score))' },
      { t: '' },
      { fault: 'order', broken: 'library(MASS)          # attached halfway down, after dplyr', fixed: '' },
      { fault: 'order',
        broken: 'keep  <- select(trial, id, arm, score)      # whose select() is this now?',
        fixed: 'keep  <- dplyr::select(trial, id, arm, score)' },
      { t: '' },
      { fault: 'seed', broken: '', fixed: 'set.seed(' + seed + ')       # the bootstrap is now repeatable' },
      { t: 'boot  <- replicate(2000, {' },
      { t: '  i <- sample(nrow(keep), replace = TRUE)' },
      { t: '  diff(tapply(keep$score[i], keep$arm[i], mean))' },
      { t: '})' },
      { t: '' },
      { t: 'cat("effect", round(mean(boot), 3),' },
      { t: '    "  95% CI", round(quantile(boot, c(.025, .975)), 3), "\\n")' }
    ];
  }

  var FAULTS = {
    state: {
      name: 'Hidden state',
      why: 'The script asks for an object called `cleaned`. Nothing in the script creates it. It exists on the author\'s machine because it was typed into the console weeks ago and never written down.',
      err: 'Error in filter(., !is.na(score)) : object \'cleaned\' not found',
      fix: 'Build every object the script needs inside the script.'
    },
    path: {
      name: 'Absolute path',
      why: 'That path names one folder on one laptop. A co-author, a reviewer, a server and your own next machine all fail on the same line.',
      err: 'Error in file(file, "rt") : cannot open file \'C:/Users/sam/Desktop/final_v3 (2).csv\': No such file or directory',
      fix: 'Use a path relative to the project folder, and ship the folder.'
    },
    seed: {
      name: 'No seed',
      why: 'The bootstrap draws random samples. With no seed, R starts from a different place every session, so the interval you publish is not the interval anyone else gets.',
      err: 'Ran without error, and produced a DIFFERENT answer than the run before it.',
      fix: 'Set a seed before anything random, and state it in the paper.'
    },
    order: {
      name: 'Load order',
      why: 'MASS and dplyr both export a function called `select`, and they are not the same function. Whichever package was attached last wins. Here MASS is attached halfway down the file, so the same `select()` call means one thing above that line and another below it, and it also depends on what was already attached in the session.',
      err: 'Error in select(trial, id, arm, score) : unused arguments (id, arm, score)',
      fix: 'Attach every package at the top, and write dplyr::select when the name is contested.'
    }
  };
  var ORDER = ['state', 'path', 'seed', 'order'];

  var CHECKS = [
    { key: 'state', label: 'Runs in a session that knows nothing' },
    { key: 'path', label: 'Finds its data on another machine' },
    { key: 'order', label: 'Calls the function it means to call' },
    { key: 'seed', label: 'Gives the same answer twice' }
  ];

  function mount(el, cfg) {
    cfg = cfg || {};
    var want = (cfg.faults && cfg.faults.length ? cfg.faults : ORDER).filter(function (f) { return FAULTS[f]; });
    if (!want.length) want = ORDER.slice();
    var seed = (cfg.seed == null ? 12345 : +cfg.seed);
    var lines = script(seed);
    var repaired = {}, open = null, runs = [];

    var P = palette(el);
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:' + P.panel + ';padding:16px 17px';
    el.innerHTML =
      '<div class="rp-head" style="font:600 12.5px/1.5 IBM Plex Sans,sans-serif;color:' + P.mut + ';margin-bottom:3px">' +
        'analysis.R, exactly as it was sent to the journal</div>' +
      '<div class="rp-hint" style="font:11.5px/1.5 IBM Plex Sans,sans-serif;color:' + P.faint + ';margin-bottom:9px">' +
        'Flagged lines are the faults. Click one to read it and apply the repair.</div>' +
      '<div class="rp-code" style="overflow-x:auto"></div>' +
      '<div class="rp-panel" style="margin-top:10px"></div>' +
      '<div class="rp-actions" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">' +
        '<button type="button" class="rp-run" style="font:600 12.5px IBM Plex Sans,sans-serif;color:#fff;background:' + P.acc +
          ';border:0;border-radius:8px;padding:8px 15px;cursor:pointer">Run twice from a clean session</button>' +
        '<button type="button" class="rp-reset" style="font:600 12.5px IBM Plex Sans,sans-serif;color:' + P.mut +
          ';background:none;border:1px solid ' + P.line + ';border-radius:8px;padding:8px 14px;cursor:pointer">Start over</button>' +
      '</div>' +
      '<div class="rp-log" style="margin-top:11px"></div>' +
      '<div class="rp-checks" style="margin-top:11px"></div>' +
      '<div class="rp-r" style="margin-top:13px"></div>';

    var codeBox = el.querySelector('.rp-code'), panel = el.querySelector('.rp-panel'),
        log = el.querySelector('.rp-log'), checks = el.querySelector('.rp-checks'),
        rbox = el.querySelector('.rp-r'), runBtn = el.querySelector('.rp-run'),
        resetBtn = el.querySelector('.rp-reset');

    codeBox.addEventListener('click', function (ev) {
      var row = ev.target.closest ? ev.target.closest('[data-f]') : null;
      if (!row || !codeBox.contains(row)) return;
      var f = row.getAttribute('data-f');
      open = (open === f) ? null : f;
      render();
    });
    panel.addEventListener('click', function (ev) {
      var b = ev.target.closest ? ev.target.closest('[data-fix]') : null;
      if (!b || !panel.contains(b)) return;
      repaired[b.getAttribute('data-fix')] = true;
      open = null; runs = [];
      render();
    });
    runBtn.addEventListener('click', function () { runs = simulate(want, repaired, seed); render(); });
    resetBtn.addEventListener('click', function () { repaired = {}; open = null; runs = []; render(); });

    function render() {
      P = palette(el);
      el.style.background = P.panel; el.style.borderColor = P.line;
      codeBox.innerHTML = codeView(lines, want, repaired, open, P);
      panel.innerHTML = open ? faultPanel(open, repaired, P) : '';
      log.innerHTML = runs.length ? logView(runs, P) : '';
      checks.innerHTML = checkList(want, repaired, runs, P);
      rbox.innerHTML = u.runnable(rcode(seed), { label: 'The repaired script, start to finish' });
      runBtn.style.background = P.acc;
      resetBtn.style.color = P.mut; resetBtn.style.borderColor = P.line;
    }

    var wasDark = isDark(el);
    if (window.MutationObserver) {
      var mo = new MutationObserver(function () {
        if (!document.contains(el)) { mo.disconnect(); return; }
        var now = isDark(el); if (now !== wasDark) { wasDark = now; render(); }
      });
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    }
    render();
  }

  /* ---------------- the script view, diff coloured ---------------- */
  function codeView(lines, want, repaired, open, P) {
    var h = '<div style="background:' + P.codeBg + ';border-radius:9px;padding:10px 0;font-family:IBM Plex Mono,monospace;font-size:12.5px;line-height:1.62;min-width:430px">';
    var num = 0, shown = {};
    lines.forEach(function (L) {
      var f = L.fault, active = f && want.indexOf(f) >= 0, done = active && repaired[f];
      var text, bg = 'transparent', mark = ' ';
      if (!active) { text = L.t != null ? L.t : (L.fixed || L.broken); }
      else if (done) {
        if (!L.fixed) return;                               // a line the repair deletes
        text = L.fixed; bg = P.add; mark = '+';
      } else {
        if (!L.broken) return;                              // a line the repair ADDS is not there yet
        text = L.broken; bg = P.del; mark = '-';
      }
      num++;
      if (active) shown[f] = true;
      var isOpen = active && open === f;
      h += '<div' + (active ? ' data-f="' + f + '" tabindex="0" role="button" style="cursor:pointer;' : ' style="') +
        'display:flex;gap:10px;padding:1px 12px;background:' + (isOpen ? 'rgba(255,255,255,.10)' : bg) + '">' +
        '<span style="color:#5b6675;width:20px;text-align:right;flex:none;user-select:none">' + num + '</span>' +
        '<span style="color:' + (mark === '-' ? P.bad : (mark === '+' ? P.acc : '#5b6675')) + ';flex:none;user-select:none">' + mark + '</span>' +
        '<span style="color:' + (text.charAt(0) === '#' ? '#7d8898' : P.codeFg) + ';white-space:pre">' + u.esc(text) + '</span>' +
        (active && !done ? '<span style="margin-left:auto;flex:none;color:' + P.bad + ';font-size:10.5px;align-self:center">fault</span>' : '') +
        '</div>';
    });
    // a fault that is the ABSENCE of a line has nothing to click, so give it a marker
    var MISSING = { seed: 'missing: nothing sets a seed before the bootstrap',
                    order: 'missing: a package is attached too late',
                    state: 'missing: the object this script depends on',
                    path: 'missing: a portable path' };
    want.forEach(function (f) {
      if (repaired[f] || shown[f]) return;
      h += '<div data-f="' + f + '" tabindex="0" role="button" style="cursor:pointer;display:flex;gap:10px;padding:1px 12px;background:' + P.del + '">' +
        '<span style="color:#5b6675;width:20px;text-align:right;flex:none">&nbsp;</span>' +
        '<span style="color:' + P.bad + ';flex:none">!</span>' +
        '<span style="color:' + P.bad + ';white-space:pre">' + u.esc(MISSING[f] || 'missing') + '</span>' +
        '<span style="margin-left:auto;flex:none;color:' + P.bad + ';font-size:10.5px;align-self:center">fault</span>' +
        '</div>';
    });
    return h + '</div>';
  }

  function faultPanel(f, repaired, P) {
    var F = FAULTS[f], done = !!repaired[f];
    return '<div style="border:1px solid ' + P.line + ';border-left:3px solid ' + (done ? P.acc : P.bad) +
      ';border-radius:0 9px 9px 0;background:' + P.soft + ';padding:11px 13px">' +
      '<div style="font:600 12px IBM Plex Sans,sans-serif;color:' + (done ? P.acc : P.bad) + ';margin-bottom:5px">' + u.esc(F.name) + '</div>' +
      '<div style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin-bottom:7px">' + F.why.replace(/`([^`]+)`/g,
        '<code style="font-family:IBM Plex Mono,monospace;font-size:12px;color:' + P.ink + '">$1</code>') + '</div>' +
      '<div style="font:12px/1.5 IBM Plex Sans,sans-serif;color:' + P.mut + ';margin-bottom:9px"><b>The repair:</b> ' + u.esc(F.fix) + '</div>' +
      (done ? '<div style="font:600 12px IBM Plex Sans,sans-serif;color:' + P.acc + '">Repaired.</div>'
            : '<button type="button" data-fix="' + f + '" style="font:600 12px IBM Plex Sans,sans-serif;color:#fff;background:' + P.acc +
              ';border:0;border-radius:7px;padding:7px 13px;cursor:pointer">Apply this repair</button>') +
      '</div>';
  }

  /* ---------------- the fresh-session run ----------------
     Faults are hit in the order R would hit them; the seed fault only shows on the second
     run, because a script with no seed runs perfectly once. */
  function simulate(want, repaired, seed) {
    var out = [], pass = 1, first = null;
    for (pass = 1; pass <= 2; pass++) {
      var lines = ['> Rscript analysis.R          (fresh session ' + pass + ' of 2)'], stopped = false, k;
      for (k = 0; k < ORDER.length; k++) {
        var f = ORDER[k];
        if (f === 'seed') continue;                        // not an error, a difference
        if (want.indexOf(f) >= 0 && !repaired[f]) {
          lines.push(FAULTS[f].err);
          out.push({ ok: false, lines: lines, fault: f });
          stopped = true;
          break;
        }
      }
      if (stopped) return out;                             // it never got as far as a second run
      var noSeed = want.indexOf('seed') >= 0 && !repaired.seed;
      // a deterministic stand-in for the bootstrap: with a seed both passes agree, without
      // one the second pass starts somewhere else
      var val = noSeed ? bootValue(seed + pass * 7717) : bootValue(seed);
      lines.push('effect ' + val.est + '   95% CI ' + val.lo + ' ' + val.hi);
      out.push({ ok: true, lines: lines, val: val });
      if (pass === 1) first = val;
      else out.push({ verdict: (first.est === val.est && first.lo === val.lo && first.hi === val.hi) });
    }
    return out;
  }
  function bootValue(s) {                                  // stable pseudo-output, not a real fit
    function r(a) { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
    var e = 2.4 + 0.18 * (r(s) - 0.5), w = 1.55 + 0.12 * (r(s + 1) - 0.5);
    return { est: e.toFixed(3), lo: (e - w).toFixed(3), hi: (e + w).toFixed(3) };
  }

  function logView(runs, P) {
    var h = '<div style="background:' + P.codeBg + ';border-radius:9px;padding:10px 13px;font-family:IBM Plex Mono,monospace;font-size:12px;line-height:1.6">';
    runs.forEach(function (r) {
      if (r.verdict !== undefined) return;
      r.lines.forEach(function (L, i) {
        var col = i === 0 ? '#7d8898' : (r.ok ? P.codeFg : P.bad);
        h += '<div style="color:' + col + ';white-space:pre-wrap">' + u.esc(L) + '</div>';
      });
      h += '<div style="height:6px"></div>';
    });
    h += '</div>';
    var v = runs.filter(function (r) { return r.verdict !== undefined; })[0];
    var failed = runs.filter(function (r) { return r.ok === false; })[0];
    if (failed) {
      h += '<div style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.bad + ';margin-top:8px">' +
        'It stopped on the first fault it met. On your own machine this line works, because your session already holds what the script forgot to say.</div>';
    } else if (v && !v.verdict) {
      h += '<div style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.bad + ';margin-top:8px">' +
        'It ran twice with no error and gave two different answers. This is the fault that survives every code review, because nothing about it looks wrong. ' +
        'The interval you would have published is one draw from a distribution nobody else can reach.</div>';
    } else if (v && v.verdict) {
      h += '<div style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.acc + ';margin-top:8px">' +
        'Two clean sessions, same numbers. That is what a reviewer means by reproducible: not that the analysis is right, but that it is the same analysis every time anyone runs it.</div>';
    }
    return h;
  }

  function checkList(want, repaired, runs, P) {
    var ran = runs.length > 0;
    var v = runs.filter(function (r) { return r.verdict !== undefined; })[0];
    var done = 0;
    var rows = CHECKS.filter(function (c) { return want.indexOf(c.key) >= 0; }).map(function (c) {
      var ok = !!repaired[c.key] && (c.key !== 'seed' || (ran && v && v.verdict));
      if (ok) done++;
      return '<li style="display:flex;gap:8px;align-items:baseline;margin:0 0 3px;font:12.5px IBM Plex Sans,sans-serif;color:' +
        (ok ? P.acc : P.mut) + '"><span style="font-family:IBM Plex Mono,monospace">' + (ok ? 'x' : 'o') + '</span>' + u.esc(c.label) + '</li>';
    });
    return '<div style="font:600 11px IBM Plex Sans,sans-serif;color:' + P.mut + ';margin-bottom:4px">' +
      'What a fresh session has proved so far (' + done + ' of ' + rows.length + ')</div>' +
      '<ul style="list-style:none;margin:0;padding:0">' + rows.join('') + '</ul>';
  }

  /* ---------------- runnable R: the repaired script ----------------
     Self-contained on purpose. Building the data in the script is the honest fix for the
     absolute path in a setting where there is no project folder to point at. */
  function rcode(seed) {
    return [
      '# analysis.R, repaired. Everything it needs, it makes or loads itself.',
      'set.seed(' + seed + ')                     # 1. the random step is now repeatable',
      '',
      '# 2. no absolute path: the data is built here rather than read from one laptop.',
      '#    In a real project this line is read.csv("data/trial.csv"), a path inside the',
      '#    project folder that travels with the project. Because the data is built here',
      '#    rather than read, these numbers are this script\'s own, not the console above.',
      'n     <- 300',
      'raw   <- data.frame(',
      '  id    = seq_len(n),',
      '  arm   = rep(c("control", "programme"), each = n / 2),',
      '  score = rnorm(n, mean = rep(c(50, 52.4), each = n / 2), sd = 6)',
      ')',
      'raw$score[c(7, 19, 88)] <- NA          # a little real-world mess',
      '',
      '# 3. no hidden state: every object below is created above.',
      'trial <- raw[!is.na(raw$score), ]',
      'keep  <- trial[, c("id", "arm", "score")]',
      '',
      '# 4. no load-order surprise: base R here, and where a name is contested say',
      '#    which package you mean, as in dplyr::select(...).',
      'boot <- replicate(2000, {',
      '  i <- sample(nrow(keep), replace = TRUE)',
      '  m <- tapply(keep$score[i], keep$arm[i], mean)',
      '  unname(m["programme"] - m["control"])',
      '})',
      '',
      'cat("effect", round(mean(boot), 3),',
      '    "  95% CI", round(quantile(boot, c(.025, .975)), 3), "\\n")',
      '',
      '# Run it twice. Same numbers, on any machine, in any session.'
    ].join('\n');
  }

  window.LessonWidgets.register('repro-repair', mount);
})();
