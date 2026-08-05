/* review-triage.js - sort a real-looking review before answering a word of it.
 *
 * Serves the review-triage hub chapter in The Publishing Handbook and every response and
 * revision chapter that follows it. The single most useful thing a researcher can do with
 * a review is decide, comment by comment, which of three kinds each one is, because the
 * kind decides the response:
 *
 *   substantive  the result could change. Run the analysis, report what it shows, and say
 *                so even when it is inconvenient.
 *   reporting    the result does not change. Something is missing from the write-up. Add
 *                the number, the version, the definition, and point to where it now is.
 *   preference   the reviewer would have done it differently, and both ways are defensible.
 *                Give a reason for your choice, offer the alternative in a supplement if it
 *                is cheap, and decline politely.
 *
 * A researcher who cannot tell these apart does one of two things: treats everything as
 * substantive and rebuilds a paper that did not need rebuilding, or treats everything as
 * preference and gets a hostile second round. Both are common and both are avoidable.
 *
 * The reader assigns each comment, presses Check, and gets per-comment feedback that names
 * WHY it belongs where it belongs rather than just marking it wrong. The summary then
 * builds the shape of the response letter: substantive first, reporting next, preference
 * last and briefly.
 *
 * The runnable R is the diagnostic the review's hardest substantive comment demands, so the
 * reader can see the difference in cost between a comment that needs a rerun and a comment
 * that needs a sentence. It runs in R 4.6.0 with no packages.
 *
 * cfg: {
 *   comments: [{ id, from: "Reviewer 2", text, kind: "substantive|reporting|preference",
 *                why: "one sentence naming why" }],   // a default review of nine is built in
 *   shuffle: true,     // present them in a seeded shuffle rather than grouped by kind
 *   seed: 5
 * }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u;

  var LIGHT = {
    ink: '#131720', body: '#434b59', mut: '#677084', faint: '#97a0b2',
    line: '#d8dee9', grid: '#eef1f6', acc: '#1f7a55', c0: '#2563a8', c1: '#b5631a',
    bad: '#c2410c', panel: '#ffffff', soft: '#f6f8fa', pick: '#e7f3ec', warn: '#fbeae5'
  };
  var DARK = {
    ink: '#eef4fb', body: '#c3d1e3', mut: '#93a4bb', faint: '#6f8299',
    line: 'rgba(255,255,255,.24)', grid: 'rgba(255,255,255,.10)', acc: '#46c08a',
    c0: '#7fb2ea', c1: '#e3a05a', bad: '#f4805a', panel: '#101c2b', soft: 'rgba(255,255,255,.05)',
    pick: 'rgba(70,192,138,.18)', warn: 'rgba(244,128,90,.16)'
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

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  var KINDS = [
    { k: 'substantive', label: 'Substantive', short: 'the result could change',
      how: 'Run it, report what it shows, and say so even if it goes against you.' },
    { k: 'reporting', label: 'Reporting', short: 'the result stands, the write-up is thin',
      how: 'Add the number or the definition, and say where it now appears.' },
    { k: 'preference', label: 'Preference', short: 'a defensible difference of taste',
      how: 'Give your reason, offer the alternative if it is cheap, and decline politely.' }
  ];

  var DEFAULT_REVIEW = [
    { id: 1, from: 'Reviewer 2', kind: 'substantive',
      text: 'Participants were recruited in 14 clinics but the models treat every participant as independent. Outcomes within a clinic are likely correlated.',
      why: 'Ignoring the clustering understates the standard errors, so the interval and the p-value both change. Nothing about this can be settled in the text.' },
    { id: 2, from: 'Reviewer 2', kind: 'reporting',
      text: 'Please state the software and package versions used for the analysis.',
      why: 'A version number changes no estimate. It is missing from the manuscript, so it is a sentence in the methods, not a rerun.' },
    { id: 3, from: 'Reviewer 1', kind: 'preference',
      text: 'I would have used a Bayesian model with weakly informative priors rather than the frequentist approach taken here.',
      why: 'Both approaches are defensible for this question, and the reviewer has not claimed the chosen one is invalid. Justify the choice and decline.' },
    { id: 4, from: 'Reviewer 1', kind: 'substantive',
      text: 'Forty-one participants are missing the primary outcome and appear to have been dropped. Were they different from those retained?',
      why: 'If the missingness is related to the outcome, the complete-case estimate is biased. The answer is a comparison and a sensitivity analysis, and it might move the result.' },
    { id: 5, from: 'Reviewer 2', kind: 'reporting',
      text: 'Table 2 gives p-values but no effect sizes or confidence intervals.',
      why: 'The numbers already exist in the fitted model. Reporting them changes nothing about the analysis and everything about whether a reader can judge it.' },
    { id: 6, from: 'Reviewer 3', kind: 'preference',
      text: 'Figure 3 would be clearer as a bar chart than as a boxplot.',
      why: 'A boxplot shows the spread a bar chart hides, so this is a judgement call, and the reviewer has given no reason the current figure misleads.' },
    { id: 7, from: 'Reviewer 3', kind: 'substantive',
      text: 'The interaction reported in section 3.4 was not in the registered analysis plan and is not flagged as exploratory.',
      why: 'An unregistered interaction found after looking is a different kind of evidence from a pre-specified one. The estimate stays; the CLAIM has to change, and that is substantive.' },
    { id: 8, from: 'Reviewer 1', kind: 'reporting',
      text: 'How was the primary outcome defined? The text refers to "improvement" without giving a threshold.',
      why: 'The definition exists, or the analysis could not have been run. It is missing from the paper, so it goes in the methods.' },
    { id: 9, from: 'Reviewer 2', kind: 'preference',
      text: 'The introduction should cite Karlsson et al. (2019) and Ito (2021).',
      why: 'Unless one of those papers contradicts the claim being made, this is a citation preference. Add them if they fit and say so in one line.' }
  ];

  function mount(el, cfg) {
    cfg = cfg || {};
    var comments = (cfg.comments && cfg.comments.length ? cfg.comments : DEFAULT_REVIEW).slice();
    var seed = (cfg.seed == null ? 5 : +cfg.seed);
    if (cfg.shuffle !== false) {                      // seeded Fisher-Yates: same order every time
      var rnd = mulberry32(seed);
      for (var i = comments.length - 1; i > 0; i--) {
        var j = Math.floor(rnd() * (i + 1)), t = comments[i]; comments[i] = comments[j]; comments[j] = t;
      }
    }
    var picks = {}, graded = false;

    var P = palette(el);
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:' + P.panel + ';padding:16px 17px';
    el.innerHTML =
      '<div class="rt-head" style="font:600 13px/1.5 IBM Plex Sans,sans-serif;color:' + P.ink + ';margin-bottom:3px">' +
        'Decision letter: major revision. Sort every comment before you answer one.</div>' +
      '<div class="rt-legend" style="margin:8px 0 12px"></div>' +
      '<div class="rt-list"></div>' +
      '<div class="rt-actions" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"></div>' +
      '<div class="rt-score" style="margin-top:12px"></div>' +
      '<div class="rt-r" style="margin-top:13px"></div>';

    var legend = el.querySelector('.rt-legend'), list = el.querySelector('.rt-list'),
        actions = el.querySelector('.rt-actions'), score = el.querySelector('.rt-score'),
        rbox = el.querySelector('.rt-r');

    list.addEventListener('click', function (ev) {
      var b = ev.target.closest ? ev.target.closest('[data-pick]') : null;
      if (!b || !list.contains(b) || graded) return;
      picks[b.getAttribute('data-id')] = b.getAttribute('data-pick');
      render();
    });
    actions.addEventListener('click', function (ev) {
      var b = ev.target.closest ? ev.target.closest('[data-act]') : null;
      if (!b || !actions.contains(b)) return;
      if (b.getAttribute('data-act') === 'check') graded = true;
      else { graded = false; picks = {}; }
      render();
    });

    function render() {
      P = palette(el);
      el.style.background = P.panel; el.style.borderColor = P.line;
      el.querySelector('.rt-head').style.color = P.ink;

      legend.innerHTML = KINDS.map(function (K) {
        return '<div style="display:flex;gap:8px;align-items:baseline;font:12px/1.5 IBM Plex Sans,sans-serif;color:' + P.mut + '">' +
          '<b style="color:' + kindColour(K.k, P) + ';min-width:88px">' + K.label + '</b><span>' + u.esc(K.short) + '</span></div>';
      }).join('');

      list.innerHTML = comments.map(function (c) { return card(c, picks[c.id], graded, P); }).join('');

      var answered = comments.filter(function (c) { return picks[c.id]; }).length;
      actions.innerHTML = graded
        ? '<button type="button" data-act="reset" style="font:600 12.5px IBM Plex Sans,sans-serif;color:' + P.mut +
            ';background:none;border:1px solid ' + P.line + ';border-radius:8px;padding:8px 14px;cursor:pointer">Try it again</button>'
        : '<button type="button" data-act="check"' + (answered < comments.length ? ' disabled' : '') +
            ' style="font:600 12.5px IBM Plex Sans,sans-serif;color:#fff;background:' + (answered < comments.length ? P.faint : P.acc) +
            ';border:0;border-radius:8px;padding:8px 15px;cursor:' + (answered < comments.length ? 'default' : 'pointer') + '">' +
            'Check my sorting (' + answered + ' of ' + comments.length + ')</button>';

      score.innerHTML = graded ? summary(comments, picks, P) : '';
      rbox.innerHTML = u.runnable(rcode(), { label: 'What the first substantive comment actually costs' });
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

  function kindColour(k, P) { return k === 'substantive' ? P.bad : (k === 'reporting' ? P.c0 : P.mut); }

  function card(c, pick, graded, P) {
    var right = graded && pick === c.kind;
    var wrong = graded && pick !== c.kind;
    var edge = graded ? (right ? P.acc : P.bad) : P.line;
    var h = '<div style="border:1px solid ' + P.line + ';border-left:3px solid ' + edge +
      ';border-radius:0 10px 10px 0;background:' + P.soft + ';padding:11px 13px;margin-bottom:9px">' +
      '<div style="font:600 10.5px IBM Plex Sans,sans-serif;letter-spacing:.04em;text-transform:uppercase;color:' + P.faint + ';margin-bottom:4px">' +
      u.esc(c.from) + '</div>' +
      '<div style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin-bottom:9px">' + u.esc(c.text) + '</div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap">';
    KINDS.forEach(function (K) {
      var on = pick === K.k;
      var isAnswer = graded && K.k === c.kind;
      var bg = graded ? (isAnswer ? P.pick : (on ? P.warn : 'transparent')) : (on ? P.pick : 'transparent');
      var bd = graded ? (isAnswer ? P.acc : (on ? P.bad : P.line)) : (on ? P.acc : P.line);
      h += '<button type="button" data-id="' + c.id + '" data-pick="' + K.k + '"' + (graded ? ' disabled' : '') +
        ' style="font:600 12px IBM Plex Sans,sans-serif;color:' + (graded && isAnswer ? P.acc : (on ? P.ink : P.mut)) +
        ';background:' + bg + ';border:1.4px solid ' + bd + ';border-radius:7px;padding:6px 11px;cursor:' + (graded ? 'default' : 'pointer') + '">' +
        u.esc(K.label) + '</button>';
    });
    h += '</div>';
    if (graded) {
      h += '<div style="margin-top:9px;font:12.5px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + '">' +
        '<b style="color:' + (right ? P.acc : P.bad) + '">' + (right ? 'Right: ' : 'It is ' + kindLabel(c.kind) + '. ') + '</b>' +
        u.esc(c.why) + '</div>' +
        '<div style="margin-top:5px;font:12px/1.5 IBM Plex Sans,sans-serif;color:' + P.faint + '">' +
        u.esc('In the letter: ' + howFor(c.kind)) + '</div>';
    }
    return h + '</div>';
  }
  function kindLabel(k) { for (var i = 0; i < KINDS.length; i++) if (KINDS[i].k === k) return KINDS[i].label.toLowerCase(); return k; }
  function howFor(k) { for (var i = 0; i < KINDS.length; i++) if (KINDS[i].k === k) return KINDS[i].how; return ''; }

  function summary(comments, picks, P) {
    var right = 0, byKind = { substantive: 0, reporting: 0, preference: 0 }, missed = { substantive: 0, reporting: 0, preference: 0 };
    comments.forEach(function (c) {
      byKind[c.kind]++;
      if (picks[c.id] === c.kind) right++; else missed[c.kind]++;
    });
    var n = comments.length;
    var overCall = comments.filter(function (c) { return picks[c.id] === 'substantive' && c.kind !== 'substantive'; }).length;
    var underCall = comments.filter(function (c) { return c.kind === 'substantive' && picks[c.id] !== 'substantive'; }).length;

    var h = '<div style="border-top:1px solid ' + P.line + ';padding-top:12px">' +
      '<div style="font:600 14px IBM Plex Sans,sans-serif;color:' + (right === n ? P.acc : P.ink) + ';margin-bottom:6px">' +
      right + ' of ' + n + ' sorted correctly</div>';
    h += '<div style="font:13px/1.6 IBM Plex Sans,sans-serif;color:' + P.body + ';margin-bottom:10px">' +
      'This review is <b>' + byKind.substantive + ' substantive</b>, <b>' + byKind.reporting + ' reporting</b> and <b>' +
      byKind.preference + ' preference</b>. ' +
      (overCall ? 'You marked ' + overCall + ' as substantive that ' + (overCall === 1 ? 'is not' : 'are not') +
        '. That is the expensive error: it turns a revision into a rebuild and invites the reviewer to keep pulling. '
      : '') +
      (underCall ? 'You marked ' + underCall + ' substantive comment' + (underCall === 1 ? '' : 's') +
        ' as something lighter. That is the dangerous error: answering a real problem with a sentence is what produces a hostile second round. '
      : '') +
      (!overCall && !underCall ? 'You put every genuinely substantive comment in the right pile, which is the part that decides how the second round goes. ' : '') +
      '</div>';
    h += '<div style="font:600 11px IBM Plex Sans,sans-serif;color:' + P.mut + ';margin-bottom:5px">The letter this implies</div>' +
      '<ol style="margin:0;padding-left:19px;font:12.5px/1.6 IBM Plex Sans,sans-serif;color:' + P.body + '">' +
      '<li>Open with the ' + byKind.substantive + ' substantive points, each with what you ran and what it showed, including where it did not help you.</li>' +
      '<li>Group the ' + byKind.reporting + ' reporting points together and point to the line and page each one now appears on.</li>' +
      '<li>Take the ' + byKind.preference + ' preference points last, briefly, with a reason for the choice you made.</li>' +
      '</ol></div>';
    return h;
  }

  /* ---------------- runnable R ----------------
     The first substantive comment in the default review is the clustering one, so this is
     that diagnostic: how far the naive standard error is out once clinics are accounted
     for. Base R only, and the design effect is checked against the formula. */
  function rcode() {
    return [
      '# Comment 1 said outcomes within a clinic are correlated. That is a substantive',
      '# comment, so it costs a rerun. Here is the rerun, and what it changes.',
      'set.seed(20)',
      'k <- 14; m <- 20; n <- k * m          # 14 clinics, 20 participants each',
      'rho <- 0.06                           # a small, very ordinary intraclass correlation',
      '',
      'clinic <- rep(1:k, each = m)',
      'arm    <- rep(rep(0:1, length.out = k), each = m)   # the programme runs clinic-wide',
      'y      <- 0.35 * arm + sqrt(rho) * rnorm(k)[clinic] + sqrt(1 - rho) * rnorm(n)',
      '',
      'naive  <- lm(y ~ arm)',
      'se_n   <- coef(summary(naive))["arm", "Std. Error"]',
      '',
      '# analyse at the level the treatment was assigned: one number per clinic',
      'cm     <- tapply(y, clinic, mean)',
      'ca     <- tapply(arm, clinic, max)',
      'se_c   <- sqrt(sum((cm - ave(cm, ca))^2) / (k - 2) * (2 / (k / 2)))',
      '',
      'round(c(naive_se     = se_n,',
      '        clustered_se = se_c,',
      '        ratio        = se_c / se_n,',
      '        design_effect_formula = sqrt(1 + (m - 1) * rho)), 3)',
      '',
      '# The estimate barely moves. The standard error does, and so does the p-value.',
      'round(c(naive_p     = coef(summary(naive))["arm", "Pr(>|t|)"],',
      '        clustered_p = unname(2 * pt(abs(diff(rev(tapply(cm, ca, mean)))) / se_c,',
      '                                    df = k - 2, lower.tail = FALSE))), 4)'
    ].join('\n');
  }

  window.LessonWidgets.register('review-triage', mount);
})();
