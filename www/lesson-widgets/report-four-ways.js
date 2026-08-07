/* report-four-ways.js - one result, four write-ups, and the reveal that they are one result.
 *
 * Serves the effect-size, confidence-interval, trend, model-fit and missing-data reporting
 * objections in The Publishing Handbook.
 *
 * Stage one: four sentences are shown. The reader picks the one that reads as the
 * strongest evidence. Stage two: the reveal. All four describe the same analysis of the
 * same data, and nothing about the evidence changed between them. What changed is how much
 * of it the reader was allowed to see.
 *
 * Stage three, which is the part that makes this worth doing rather than a trick: a second
 * study is added whose p-value rounds to exactly the same number. Under bare-p reporting
 * the two studies are indistinguishable. Under full reporting they are opposites. One is
 * precise and clinically uninteresting; the other could be anything from nothing to
 * enormous. The p-value cannot tell them apart, and it never could.
 *
 * Every number is computed from the study description with a real t distribution, not
 * typed in: the interval, the t statistic, the p-value and Cohen's d all come from the
 * same means, standard deviation and sample sizes, so they cannot silently disagree. The
 * emitted R rebuilds vectors with exactly those means and standard deviations and runs
 * t.test on them, so it prints the same numbers.
 *
 * cfg: {
 *   studies: [{                     // two by default; more are allowed
 *     label: "Trial A",
 *     outcome: "depression score",  // named in every sentence
 *     unit: "points",
 *     n1: 600, n2: 600,             // group sizes
 *     m1: 0, m2: 0.9,               // group means (m2 - m1 is the reported difference)
 *     sd: 7.5,                      // common within-group standard deviation
 *     mcid: 3                       // smallest difference that matters clinically (0 hides this)
 *   }],
 *   start: 0,                       // which study is shown first
 *   alpha: 0.05
 * }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u;

  var LIGHT = {
    ink: '#131720', body: '#434b59', mut: '#677084', faint: '#97a0b2',
    line: '#d8dee9', grid: '#eef1f6', acc: '#1f7a55', c0: '#2563a8', c1: '#b5631a',
    bad: '#c2410c', panel: '#ffffff', soft: '#f6f8fa', pick: '#e7f3ec'
  };
  var DARK = {
    ink: '#eef4fb', body: '#c3d1e3', mut: '#93a4bb', faint: '#6f8299',
    line: 'rgba(255,255,255,.24)', grid: 'rgba(255,255,255,.10)', acc: '#46c08a',
    c0: '#7fb2ea', c1: '#e3a05a', bad: '#f4805a', panel: '#101c2b',
    soft: 'rgba(255,255,255,.05)', pick: 'rgba(70,192,138,.16)'
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

  /* ---- Student t, so every number on a card comes from the same arithmetic ---- */
  function lgamma(x) {
    var c = [76.18009172947146, -86.50532032941677, 24.01409824083091,
             -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
    var y = x, t = x + 5.5, s = 1.000000000190015;
    t -= (x + 0.5) * Math.log(t);
    for (var j = 0; j < 6; j++) s += c[j] / ++y;
    return -t + Math.log(2.5066282746310005 * s / x);
  }
  function betacf(a, b, x) {
    var FPMIN = 1e-300, qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    d = 1 / d; var h = d;
    for (var mi = 1; mi <= 300; mi++) {
      var m2 = 2 * mi, aa = mi * (b - mi) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d; h *= d * c;
      aa = -(a + mi) * (qab + mi) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d; var del = d * c; h *= del;
      if (Math.abs(del - 1) < 3e-12) break;
    }
    return h;
  }
  function ibeta(a, b, x) {
    if (x <= 0) return 0; if (x >= 1) return 1;
    var bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    return (x < (a + 1) / (a + b + 2)) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b;
  }
  function pt2(t, df) { return ibeta(df / 2, 0.5, df / (df + t * t)); }
  function qt(p, df) {
    var lo = 0, hi = 200, i;
    for (i = 0; i < 160; i++) { var mid = (lo + hi) / 2; if (1 - pt2(mid, df) / 2 < p) lo = mid; else hi = mid; }
    return (lo + hi) / 2;
  }

  var DEFAULT_STUDIES = [
    { label: 'Trial A', outcome: 'depression score', unit: 'points',
      n1: 600, n2: 600, m1: 0, m2: 0.9, sd: 7.5, mcid: 3 },
    { label: 'Trial B', outcome: 'depression score', unit: 'points',
      n1: 22, n2: 22, m1: 0, m2: 6.4, sd: 9.8, mcid: 3 }
  ];

  function analyse(s, alpha) {
    var df = s.n1 + s.n2 - 2;
    var se = s.sd * Math.sqrt(1 / s.n1 + 1 / s.n2);
    var diff = s.m2 - s.m1, t = diff / se, p = pt2(Math.abs(t), df), tc = qt(1 - alpha / 2, df);
    return { diff: diff, se: se, t: t, df: df, p: p, lo: diff - tc * se, hi: diff + tc * se,
             d: diff / s.sd, sd: s.sd, n1: s.n1, n2: s.n2 };
  }
  function fmtP(p) { return p < 0.001 ? 'p < 0.001' : 'p = ' + p.toFixed(2); }
  function fmtPx(p) { return p < 0.001 ? 'p < 0.001' : 'p = ' + p.toFixed(3); }

  /* the four write-ups of one result */
  function renders(s, a) {
    var un = s.unit;
    return [
      { key: 'bare', name: 'Bare p-value',
        text: 'The treatment group improved significantly (' + fmtP(a.p) + ').',
        shows: [0, 0, 0] },
      { key: 'peff', name: 'p plus an effect size',
        text: 'The treatment group improved significantly (Cohen\'s d = ' + a.d.toFixed(2) + ', ' + fmtP(a.p) + ').',
        shows: [1, 0, 0] },
      { key: 'ci', name: 'Interval, no p-value',
        text: 'The groups differed by ' + a.diff.toFixed(2) + ' ' + un + ' (95% CI ' + a.lo.toFixed(2) + ' to ' + a.hi.toFixed(2) + ').',
        shows: [1, 1, 0] },
      { key: 'full', name: 'The whole result',
        text: 'Mean difference ' + a.diff.toFixed(2) + ' ' + un + ' (95% CI ' + a.lo.toFixed(2) + ' to ' + a.hi.toFixed(2) + '), ' +
              't(' + a.df + ') = ' + a.t.toFixed(2) + ', ' + fmtPx(a.p) + ', d = ' + a.d.toFixed(2) + ', n = ' + a.n1 + ' and ' + a.n2 + '. ' +
              (s.mcid ? 'The smallest change patients notice is about ' + s.mcid + ' ' + un + ', ' +
                 (a.hi < s.mcid ? 'and the whole interval falls below that.'
                                : 'and the interval runs from below that to well above it.') : ''),
        shows: [1, 1, 1] }
    ];
  }

  function mount(el, cfg) {
    cfg = cfg || {};
    var studies = (cfg.studies && cfg.studies.length ? cfg.studies : DEFAULT_STUDIES);
    var alpha = +cfg.alpha || 0.05;
    var cur = Math.max(0, Math.min(studies.length - 1, +cfg.start || 0));
    var picked = null, revealed = false;

    var P = palette(el);
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:' + P.panel + ';padding:16px 17px';
    el.innerHTML =
      '<div class="rf-q" style="font:600 13.5px/1.5 IBM Plex Sans,sans-serif;color:' + P.ink + ';margin-bottom:4px"></div>' +
      '<div class="rf-sub" style="font:12px/1.5 IBM Plex Sans,sans-serif;color:' + P.faint + ';margin-bottom:11px"></div>' +
      '<div class="rf-cards" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(215px,1fr));gap:9px"></div>' +
      '<div class="rf-reveal" style="margin-top:13px"></div>' +
      '<div class="rf-r" style="margin-top:13px"></div>';

    var q = el.querySelector('.rf-q'), sub = el.querySelector('.rf-sub'),
        cards = el.querySelector('.rf-cards'), reveal = el.querySelector('.rf-reveal'),
        rbox = el.querySelector('.rf-r');

    cards.addEventListener('click', function (ev) {
      var b = ev.target.closest ? ev.target.closest('[data-k]') : null;
      if (!b || !cards.contains(b)) return;
      picked = b.getAttribute('data-k'); revealed = true; render();
    });

    function render() {
      P = palette(el);
      el.style.background = P.panel; el.style.borderColor = P.line;
      var s = studies[cur], a = analyse(s, alpha), rs = renders(s, a);

      q.textContent = revealed ? 'The same analysis, written four ways'
                               : 'Which of these reads as the strongest evidence?';
      q.style.color = P.ink;
      sub.textContent = revealed ? s.label + ': ' + s.n1 + ' and ' + s.n2 + ' participants, outcome measured in ' + s.unit + '.'
                                 : 'Four sentences from four different papers reporting a trial of the same drug. Pick one.';
      sub.style.color = P.faint;

      cards.innerHTML = rs.map(function (r) {
        var on = revealed && picked === r.key;
        return '<button type="button" data-k="' + r.key + '"' + (revealed ? ' disabled' : '') +
          ' style="text-align:left;font:inherit;cursor:' + (revealed ? 'default' : 'pointer') +
          ';border:1.5px solid ' + (on ? P.acc : P.line) + ';background:' + (on ? P.pick : P.soft) +
          ';border-radius:10px;padding:11px 12px;display:block;width:100%">' +
          (revealed ? '<div style="font:600 10px IBM Plex Sans,sans-serif;letter-spacing:.05em;text-transform:uppercase;color:' +
             (on ? P.acc : P.faint) + ';margin-bottom:5px">' + u.esc(r.name) + (on ? ' &middot; you picked this' : '') + '</div>' : '') +
          '<div style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + '">' + r.text + '</div>' +
          '</button>';
      }).join('');

      reveal.innerHTML = revealed ? revealPanel(studies, cur, alpha, picked, P) : '';
      rbox.innerHTML = revealed ? u.runnable(rcode(studies, alpha), { label: 'Reproduce every number in R' }) : '';

      var segEl = reveal.querySelector('.rf-seg');
      if (segEl) u.wireSeg(segEl, function (v) { cur = +v; render(); });
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

  /* ---------------- the reveal ---------------- */
  var CHECKS = ['How big is it?', 'How precise is it?', 'Does it matter?'];

  function revealPanel(studies, cur, alpha, picked, P) {
    var s = studies[cur], a = analyse(s, alpha), rs = renders(s, a);
    var h = '<div style="border-top:1px solid ' + P.line + ';padding-top:12px">';
    h += '<div style="font:13px/1.6 IBM Plex Sans,sans-serif;color:' + P.body + '">' +
      'All four sentences describe the same analysis of the same data. The difference is ' +
      '<b>' + a.diff.toFixed(2) + ' ' + s.unit + '</b>, the interval runs <b>' + a.lo.toFixed(2) + ' to ' + a.hi.toFixed(2) +
      '</b>, and <b>' + fmtPx(a.p) + '</b>. Not one number moved between the cards. What moved is how much of the result you were allowed to see.' +
      '</div>';

    /* what each rendering lets a reader answer */
    h += '<table style="border-collapse:collapse;width:100%;margin-top:11px;font-family:IBM Plex Sans,sans-serif;font-size:11.5px">' +
      '<thead><tr><th style="text-align:left;padding:5px 8px;color:' + P.mut + ';font-weight:600;border-bottom:1px solid ' + P.line + '">Rendering</th>' +
      CHECKS.map(function (c) { return '<th style="padding:5px 8px;color:' + P.mut + ';font-weight:600;border-bottom:1px solid ' + P.line + '">' + u.esc(c) + '</th>'; }).join('') +
      '</tr></thead><tbody>';
    rs.forEach(function (r) {
      h += '<tr><td style="padding:5px 8px;color:' + (r.key === picked ? P.acc : P.ink) + ';border-bottom:1px solid ' + P.grid + '">' +
        u.esc(r.name) + (r.key === picked ? ' (your pick)' : '') + '</td>' +
        r.shows.map(function (v) {
          return '<td style="text-align:center;padding:5px 8px;border-bottom:1px solid ' + P.grid + ';color:' + (v ? P.acc : P.bad) +
            ';font-family:IBM Plex Mono,monospace">' + (v ? 'yes' : 'no') + '</td>';
        }).join('') + '</tr>';
    });
    h += '</tbody></table>';

    /* the two studies, side by side */
    if (studies.length > 1) {
      h += '<div style="margin-top:15px;font:600 12.5px IBM Plex Sans,sans-serif;color:' + P.ink + '">Now a second trial with the same p-value</div>' +
        '<div class="rf-seg" style="margin:8px 0 10px">' +
        u.seg(studies.map(function (st, i) { return { v: i, label: st.label }; }), cur) + '</div>' +
        compare(studies, alpha, P);
    }
    return h + '</div>';
  }

  function compare(studies, alpha, P) {
    var as = studies.map(function (s) { return analyse(s, alpha); });
    var rows = [
      ['Reported as a bare p-value', as.map(function (a) { return fmtP(a.p); })],
      ['Difference', as.map(function (a, i) { return a.diff.toFixed(2) + ' ' + studies[i].unit; })],
      ['95% interval', as.map(function (a) { return a.lo.toFixed(2) + ' to ' + a.hi.toFixed(2); })],
      ['Cohen\'s d', as.map(function (a) { return a.d.toFixed(2); })],
      ['Group sizes', as.map(function (a) { return a.n1 + ' and ' + a.n2; })]
    ];
    var h = '<table style="border-collapse:collapse;width:100%;font-family:IBM Plex Sans,sans-serif;font-size:12px"><thead><tr>' +
      '<th style="text-align:left;padding:5px 8px;border-bottom:1px solid ' + P.line + ';color:' + P.mut + ';font-weight:600"></th>' +
      studies.map(function (s) { return '<th style="text-align:right;padding:5px 8px;border-bottom:1px solid ' + P.line + ';color:' + P.mut + ';font-weight:600">' + u.esc(s.label) + '</th>'; }).join('') +
      '</tr></thead><tbody>';
    rows.forEach(function (r, ri) {
      var same = r[1].every(function (v) { return v === r[1][0]; });
      h += '<tr><td style="padding:5px 8px;border-bottom:1px solid ' + P.grid + ';color:' + P.body + '">' + u.esc(r[0]) +
        (ri === 0 && same ? ' <span style="color:' + P.bad + ';font-weight:600">identical</span>' : '') + '</td>' +
        r[1].map(function (v) {
          return '<td style="text-align:right;padding:5px 8px;border-bottom:1px solid ' + P.grid + ';color:' + (same ? P.bad : P.ink) +
            ';font-family:IBM Plex Mono,monospace">' + u.esc(v) + '</td>';
        }).join('') + '</tr>';
    });
    h += '</tbody></table>';
    var a0 = as[0], a1 = as[1], m = studies[0].mcid;
    h += '<div style="font:13px/1.6 IBM Plex Sans,sans-serif;color:' + P.body + ';margin-top:9px">' +
      'Rounded to two places both trials report the same p-value, so a reader given only that number cannot tell them apart. ' +
      'They are not remotely alike. ' + studies[0].label + ' is precise and small: the whole interval sits ' +
      (m && a0.hi < m ? 'below the ' + m + '-' + studies[0].unit.replace(/s$/, '') + ' change patients can notice, which is a real finding and a negative one'
                      : 'in a narrow range') + '. ' +
      studies[1].label + ' is compatible with almost nothing (' + a1.lo.toFixed(2) + ') and with a very large effect (' + a1.hi.toFixed(2) +
      '), so it settles nothing at all. The p-value cannot tell you which of those two situations you are in, and it never could.</div>';
    return h;
  }

  /* ---------------- runnable R ----------------
     scale() forces exact means and standard deviations, so t.test reproduces the widget's
     numbers to the last digit rather than approximately. */
  function rcode(studies, alpha) {
    var L = ['# Both trials, rebuilt with exactly the means and spreads on screen.',
             'set.seed(1)', ''];
    L.push('make <- function(n, m, s) m + s * as.numeric(scale(rnorm(n)))');
    L.push('');
    L.push('report <- function(x, y, label) {');
    L.push('  tt <- t.test(x, y, var.equal = TRUE)');
    L.push('  sp <- sqrt(((length(x) - 1) * var(x) + (length(y) - 1) * var(y)) /');
    L.push('             (length(x) + length(y) - 2))');
    L.push('  cat(label, ": diff", round(unname(diff(rev(tt$estimate))), 2),');
    L.push('      " CI", round(tt$conf.int[1], 2), "to", round(tt$conf.int[2], 2),');
    L.push('      " t", round(unname(tt$statistic), 2), " p", round(tt$p.value, 3),');
    L.push('      " d", round(unname(diff(rev(tt$estimate))) / sp, 2), "\\n")');
    L.push('}');
    L.push('');
    studies.forEach(function (s, i) {
      L.push('a' + i + ' <- make(' + s.n1 + ', ' + s.m1 + ', ' + s.sd + ')   # control');
      L.push('b' + i + ' <- make(' + s.n2 + ', ' + s.m2 + ', ' + s.sd + ')   # treated');
      L.push('report(b' + i + ', a' + i + ', "' + s.label + '")');
    });
    return L.join('\n');
  }

  window.LessonWidgets.register('report-four-ways', mount);
})();
