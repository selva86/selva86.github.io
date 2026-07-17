/* post-hoc-calculator-ui.js - UI engine for tools/post-hoc-calculator.html.
   All math lives in posthoc-math.js (verified against R + FSA + multcompView);
   this file only parses input, renders, and emits R code.
   Externalised from the page to keep the rendered HTML under the 200KB ceiling. */
(function () {
  'use strict';
  var PH = window.PostHocMath, DP = window.DataParse;
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  var state = { mode: 'raw', route: 'tukey', conf: 0.95 };
  var last = null;

  // ---------------------------------------------------------------- presets --
  var SCEN = {
    drug: {
      mode: 'raw', label: 'Drug trial',
      raw: 'Control, 21.0\nControl, 19.5\nControl, 22.3\nControl, 20.1\nControl, 21.8\nControl, 20.6\n' +
           'DrugA, 25.2\nDrugA, 26.1\nDrugA, 24.8\nDrugA, 27.0\nDrugA, 25.5\nDrugA, 26.3\n' +
           'DrugB, 23.1\nDrugB, 22.4\nDrugB, 23.9\nDrugB, 22.0\nDrugB, 24.2\nDrugB, 23.3'
    },
    doses: {
      mode: 'raw', label: 'Unbalanced doses',
      raw: 'Placebo, 4.2\nPlacebo, 5.1\nPlacebo, 3.8\nPlacebo, 4.9\nPlacebo, 4.4\n' +
           'Low, 6.1\nLow, 5.8\nLow, 6.9\nLow, 6.3\nLow, 5.5\nLow, 6.7\nLow, 6.0\n' +
           'Mid, 7.8\nMid, 8.3\nMid, 7.1\nMid, 8.9\n' +
           'High, 9.2\nHigh, 8.7\nHigh, 9.9\nHigh, 10.3\nHigh, 9.5\nHigh, 8.8'
    },
    likert: {
      mode: 'raw', label: 'Likert ratings (ties)', route: 'dunn',
      raw: 'Novice, 2\nNovice, 3\nNovice, 2\nNovice, 1\nNovice, 3\nNovice, 2\nNovice, 2\nNovice, 3\nNovice, 1\nNovice, 2\n' +
           'Inter, 3\nInter, 4\nInter, 3\nInter, 3\nInter, 4\nInter, 2\nInter, 3\nInter, 4\nInter, 3\nInter, 3\n' +
           'Expert, 4\nExpert, 5\nExpert, 4\nExpert, 5\nExpert, 4\nExpert, 4\nExpert, 5\nExpert, 5\nExpert, 4\nExpert, 3'
    },
    nodiff: {
      mode: 'raw', label: 'No real difference',
      raw: 'X, 10.1\nX, 9.8\nX, 10.3\nX, 9.9\nX, 10.2\n' +
           'Y, 10.0\nY, 10.2\nY, 9.9\nY, 10.1\nY, 9.8\n' +
           'Z, 9.9\nZ, 10.1\nZ, 10.2\nZ, 9.8\nZ, 10.0'
    },
    plant: {
      mode: 'raw', label: "R's PlantGrowth",
      raw: 'ctrl, 4.17\nctrl, 5.58\nctrl, 5.18\nctrl, 6.11\nctrl, 4.50\nctrl, 4.61\nctrl, 5.17\nctrl, 4.53\nctrl, 5.33\nctrl, 5.14\n' +
           'trt1, 4.81\ntrt1, 4.17\ntrt1, 4.41\ntrt1, 3.59\ntrt1, 5.87\ntrt1, 3.83\ntrt1, 6.03\ntrt1, 4.89\ntrt1, 4.32\ntrt1, 4.69\n' +
           'trt2, 6.31\ntrt2, 5.12\ntrt2, 5.54\ntrt2, 5.50\ntrt2, 5.37\ntrt2, 5.29\ntrt2, 4.92\ntrt2, 6.15\ntrt2, 5.80\ntrt2, 5.26'
    },
    summ: {
      mode: 'summary', label: 'From a paper (summaries)',
      rows: [['Control', 50, 5, 10], ['Treatment A', 55, 6, 10], ['Treatment B', 62, 5.5, 10]]
    }
  };

  // ------------------------------------------------------------ formatting --
  function fmt(x, d) {
    if (x === null || x === undefined || !isFinite(x)) return 'n/a';
    d = d === undefined ? 4 : d;
    var a = Math.abs(x);
    if (a !== 0 && (a < 1e-4 || a >= 1e7)) return x.toExponential(2);
    return x.toFixed(d).replace(/\.?0+$/, function (m) { return m.indexOf('.') === 0 ? '' : m; });
  }
  function fixed(x, d) { return (x === null || !isFinite(x)) ? 'n/a' : x.toFixed(d); }
  // Small p-values keep 3 significant digits rather than being rounded to 4
  // decimal places: toFixed(4) turns 0.000357 into "0.0004", which throws away
  // the digits a reader would compare against R's output.
  function pfmtPlain(p) {
    if (p === null || !isFinite(p)) return 'n/a';
    if (p < 0.0001) return '< 0.0001';
    if (p < 0.1) return p.toPrecision(3);
    return p.toFixed(4);
  }
  function pfmt(p) {
    var t = pfmtPlain(p);
    return t.charAt(0) === '<' ? '&lt;' + t.slice(1) : t;
  }
  // "p = < 0.0001" carries both an equals and a less-than; render the relation
  // once, so a floored p reads "p < 0.0001" and everything else "p = 0.0123".
  function pLabel(p) {
    var v = pfmtPlain(p);
    return v.charAt(0) === '<' ? 'p &lt;' + v.slice(1) : 'p = ' + v;
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function rq(s) { return '"' + String(s).replace(/"/g, '\\"') + '"'; }

  // ---------------------------------------------------------------- parsing --
  // Accepts "label, value" / "label value" / "label<TAB>value" per line, and a
  // wide layout where each line is "label, v1, v2, v3, ...".
  function parseRaw(text) {
    var lines = String(text || '').split(/\r?\n/);
    var order = [], byName = {}, bad = 0, seen = 0;
    lines.forEach(function (ln) {
      var s = ln.trim();
      if (!s) return;
      if (/^(group|label|level|name)\s*[,;\t]/i.test(s) && !/\d/.test(s.split(/[,;\t]/)[1] || '')) return;
      seen++;
      var parts = s.split(/[,;\t]+|\s{2,}|\s+/).filter(function (t) { return t.length; });
      if (parts.length < 2) { bad++; return; }
      var name = parts[0];
      var nums = [];
      for (var i = 1; i < parts.length; i++) {
        var v = parseFloat(String(parts[i]).replace(/[^0-9eE+\-.]/g, ''));
        if (isFinite(v)) nums.push(v);
      }
      if (!nums.length) { bad++; return; }
      if (!byName[name]) { byName[name] = []; order.push(name); }
      byName[name] = byName[name].concat(nums);
    });
    return {
      groups: order.map(function (n) { return { name: n, values: byName[n] }; }),
      bad: bad, seen: seen
    };
  }

  function readSummary() {
    var rows = $$('#sumrows .srow'), names = [], means = [], sds = [], ns = [];
    rows.forEach(function (r) {
      var nm = r.querySelector('.s-name').value.trim();
      var m = parseFloat(r.querySelector('.s-mean').value);
      var s = parseFloat(r.querySelector('.s-sd').value);
      var n = parseFloat(r.querySelector('.s-n').value);
      if (!nm && !isFinite(m) && !isFinite(s) && !isFinite(n)) return;
      names.push(nm || ('Group ' + (names.length + 1)));
      means.push(m); sds.push(s); ns.push(n);
    });
    return { names: names, means: means, sds: sds, ns: ns };
  }

  // ------------------------------------------------------------- rendering --
  function routeRows(A) {
    // Normalise each route to one row shape the table + letters can consume.
    if (state.route === 'tukey') {
      return A.tukey.pairs.map(function (p) {
        return { pair: p.pair, ai: p.ai, bi: p.bi, diff: p.diff, lwr: p.lwr, upr: p.upr,
                 padj: p.padj, sig: p.padj < A.alpha, stat: p.statistic, statLabel: 'q' };
      });
    }
    if (state.route === 'bonf') {
      return A.bonferroni.pairs.map(function (p) {
        return { pair: p.pair, ai: p.ai, bi: p.bi, diff: p.diff, padj: p.padj,
                 sig: p.padj < A.alpha, stat: p.t, statLabel: 't', praw: p.praw };
      });
    }
    return (A.dunn ? A.dunn.pairs : []).map(function (p) {
      return { pair: p.pair, ai: p.ai, bi: p.bi, padj: p.padj, sig: p.reject,
               stat: p.z, statLabel: 'z', praw: p.praw, nonMono: p.padjNonMonotone };
    });
  }

  function render() {
    var err = $('#err'), res = $('#res');
    var A;
    try {
      if (state.mode === 'raw') {
        var pr = parseRaw($('#raw').value);
        if (!pr.groups.length) throw new Error('No data found. Use one row per observation: a group label, then the value, like "Control, 21.0".');
        A = PH.analyzeRaw(pr.groups, { conf: state.conf });
        A._bad = pr.bad;
      } else {
        var s = readSummary();
        if (s.names.length < 3) throw new Error('Post-hoc tests need at least three groups. Fill in three or more rows.');
        for (var i = 0; i < s.names.length; i++) {
          if (!isFinite(s.means[i])) throw new Error('Row ' + (i + 1) + ' (' + s.names[i] + ') needs a mean.');
          if (!isFinite(s.sds[i])) throw new Error('Row ' + (i + 1) + ' (' + s.names[i] + ') needs a standard deviation.');
          if (!isFinite(s.ns[i])) throw new Error('Row ' + (i + 1) + ' (' + s.names[i] + ') needs a sample size n.');
        }
        A = PH.analyzeSummary(s.names, s.means, s.sds, s.ns, { conf: state.conf });
      }
    } catch (e) {
      err.textContent = e.message;
      err.hidden = false;
      res.setAttribute('data-stale', '1');
      return;
    }
    err.hidden = true;
    res.removeAttribute('data-stale');
    last = A;

    // Dunn needs ranks, so it is unavailable from summaries. Say why, in place.
    var dunnBlocked = (state.mode === 'summary' && state.route === 'dunn');
    $('#dunn-blocked').hidden = !dunnBlocked;
    $('#routebody').hidden = dunnBlocked;

    paintOmnibus(A);
    if (!dunnBlocked) {
      var rows = routeRows(A);
      paintViz(A, rows);
      paintLetters(A, rows);
      paintTable(A, rows);
      paintInference(A, rows);
      paintPlain(A, rows);
      paintReport(A, rows);
      paintSteps(A, rows);
    }
    paintR(A);
    $$('.rt').forEach(function (b) {
      b.classList.toggle('on', b.dataset.route === state.route);
      b.setAttribute('aria-selected', b.dataset.route === state.route ? 'true' : 'false');
    });
  }

  function paintOmnibus(A) {
    var o = A.omnibus;
    var f = state.mode === 'raw' ? o.f : o.f, p = state.mode === 'raw' ? o.p : o.p;
    var dfB = state.mode === 'raw' ? o.dfBetween : o.dfB;
    var dfW = A.dfW;
    var sig = p < A.alpha;
    $('#omni').innerHTML =
      '<div class="ochip"><span class="ok">One-way ANOVA</span>' +
        '<b>F(' + dfB + ', ' + dfW + ') = ' + fixed(f, 3) + '</b>' +
        '<span class="op ' + (sig ? 'yes' : 'no') + '">' + pLabel(p) + '</span></div>' +
      (A.kruskal ? '<div class="ochip"><span class="ok">Kruskal-Wallis</span>' +
        '<b>chi-squared(' + A.kruskal.df + ') = ' + fixed(A.kruskal.chisq, 3) + '</b>' +
        '<span class="op ' + (A.kruskal.p < A.alpha ? 'yes' : 'no') + '">' + pLabel(A.kruskal.p) + '</span></div>' : '') +
      '<div class="ochip"><span class="ok">Groups</span><b>k = ' + A.k + ', N = ' + A.N + '</b>' +
        '<span class="op">' + (A.k * (A.k - 1) / 2) + ' pairs</span></div>';
    $('#omninote').innerHTML = sig
      ? 'The omnibus test says <b>at least one group differs</b>. That is the licence to ask which pairs, below.'
      : 'The omnibus test is <b>not significant</b> (p = ' + pfmtPlain(p) + '). Post-hoc pairs are shown for completeness, but with no overall signal treat any pairwise hit as exploratory, not confirmed.';
  }

  // Forest plot of pairwise differences with their family-wise CIs.
  function paintViz(A, rows) {
    var cap = $('#vizcap'), box = $('#viz');
    if (state.route === 'dunn') {
      // Dunn has no difference-in-means CI: show mean ranks instead.
      var mr = A.dunn.meanRanks, mx = Math.max.apply(null, mr), mn = 0;
      var w = 700, h = 40 + A.k * 34, pad = 130;
      var svg = ['<svg viewBox="0 0 ' + w + ' ' + h + '" width="100%" height="' + h + '" role="img" aria-label="Mean rank by group">'];
      A.names.forEach(function (nm, i) {
        var y = 26 + i * 34;
        var len = (mr[i] - mn) / (mx - mn) * (w - pad - 40);
        svg.push('<text x="' + (pad - 10) + '" y="' + (y + 5) + '" text-anchor="end" class="vl">' + esc(nm) + '</text>');
        svg.push('<rect x="' + pad + '" y="' + (y - 9) + '" width="' + Math.max(2, len) + '" height="18" rx="4" fill="#1f7a55" opacity="' + (0.35 + 0.5 * (mr[i] - mn) / (mx - mn)) + '"/>');
        svg.push('<text x="' + (pad + Math.max(2, len) + 8) + '" y="' + (y + 5) + '" class="vv">' + fixed(mr[i], 1) + '</text>');
      });
      svg.push('</svg>');
      box.innerHTML = svg.join('');
      cap.textContent = 'Mean rank per group. Dunn compares these ranks, not the means, which is why it survives skew, outliers and ordinal scales.';
      return;
    }
    if (state.route === 'bonf') {
      box.innerHTML = '';
      var wB = 700, hB = 40 + rows.length * 34;
      var mxd = Math.max.apply(null, rows.map(function (r) { return Math.abs(r.diff); })) * 1.15 || 1;
      var s2 = ['<svg viewBox="0 0 ' + wB + ' ' + hB + '" width="100%" height="' + hB + '" role="img" aria-label="Pairwise mean differences">'];
      var padB = 150, midB = padB + (wB - padB - 30) / 2, halfB = (wB - padB - 30) / 2;
      s2.push('<line x1="' + midB + '" y1="14" x2="' + midB + '" y2="' + (hB - 8) + '" stroke="#c9cbd0" stroke-dasharray="3 3"/>');
      rows.forEach(function (r, i) {
        var y = 30 + i * 34;
        var x = midB + (r.diff / mxd) * halfB;
        s2.push('<text x="' + (padB - 10) + '" y="' + (y + 4) + '" text-anchor="end" class="vl">' + esc(r.pair) + '</text>');
        s2.push('<line x1="' + midB + '" y1="' + y + '" x2="' + x + '" y2="' + y + '" stroke="' + (r.sig ? '#1f7a55' : '#a8adb5') + '" stroke-width="2"/>');
        s2.push('<circle cx="' + x + '" cy="' + y + '" r="5" fill="' + (r.sig ? '#1f7a55' : '#a8adb5') + '"/>');
      });
      s2.push('</svg>');
      box.innerHTML = s2.join('');
      cap.textContent = 'Mean difference for each pair. Green marks the pairs that stay significant after the Bonferroni penalty.';
      return;
    }
    // Tukey: differences + family-wise CIs against the zero line
    var lo = Math.min.apply(null, rows.map(function (r) { return r.lwr; }));
    var hi = Math.max.apply(null, rows.map(function (r) { return r.upr; }));
    var span = (hi - lo) || 1; lo -= span * 0.08; hi += span * 0.08;
    var W = 700, H = 46 + rows.length * 34, PAD = 150, RIGHT = 30;
    var sx = function (v) { return PAD + (v - lo) / (hi - lo) * (W - PAD - RIGHT); };
    var out = ['<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="' + H + '" role="img" aria-label="Tukey confidence intervals for each pair of group means">'];
    var z = sx(0);
    out.push('<line x1="' + z + '" y1="10" x2="' + z + '" y2="' + (H - 20) + '" stroke="#c9cbd0" stroke-dasharray="3 3"/>');
    out.push('<text x="' + z + '" y="' + (H - 6) + '" text-anchor="middle" class="vt">no difference</text>');
    rows.forEach(function (r, i) {
      var y = 26 + i * 34, col = r.sig ? '#1f7a55' : '#a8adb5';
      out.push('<text x="' + (PAD - 10) + '" y="' + (y + 4) + '" text-anchor="end" class="vl">' + esc(r.pair) + '</text>');
      out.push('<line x1="' + sx(r.lwr) + '" y1="' + y + '" x2="' + sx(r.upr) + '" y2="' + y + '" stroke="' + col + '" stroke-width="2.5" stroke-linecap="round"/>');
      out.push('<line x1="' + sx(r.lwr) + '" y1="' + (y - 5) + '" x2="' + sx(r.lwr) + '" y2="' + (y + 5) + '" stroke="' + col + '" stroke-width="2"/>');
      out.push('<line x1="' + sx(r.upr) + '" y1="' + (y - 5) + '" x2="' + sx(r.upr) + '" y2="' + (y + 5) + '" stroke="' + col + '" stroke-width="2"/>');
      out.push('<circle cx="' + sx(r.diff) + '" cy="' + y + '" r="4.5" fill="' + col + '"/>');
    });
    out.push('</svg>');
    box.innerHTML = out.join('');
    cap.innerHTML = 'Each bar is the ' + Math.round(state.conf * 100) + '% family-wise interval for one pair of means. ' +
      '<b>An interval that clears the dashed line is a real difference</b>; one that straddles it is not.';
  }

  function paintLetters(A, rows) {
    var sig = rows.filter(function (r) { return r.sig; });
    // display order: highest mean first, the convention readers expect
    var idx = A.names.map(function (_, i) { return i; });
    if (state.route === 'dunn') {
      var mr = A.dunn.meanRanks;
      idx.sort(function (a, b) { return mr[b] - mr[a]; });
    } else {
      idx.sort(function (a, b) { return A.means[b] - A.means[a]; });
    }
    var letters = PH.cld(A.names, sig, idx);
    var html = idx.map(function (i) {
      var val = state.route === 'dunn'
        ? 'mean rank ' + fixed(A.dunn.meanRanks[i], 1)
        : 'mean ' + fmt(A.means[i], 3);
      return '<div class="lrow"><span class="lname">' + esc(A.names[i]) + '</span>' +
             '<span class="lval">' + val + '</span>' +
             '<span class="llet">' + esc(letters[i]) + '</span></div>';
    }).join('');
    $('#letters').innerHTML = html;
    var nGroupsSharing = letters.filter(function (l, i) {
      return letters.some(function (m, j) { return j !== i && m.split('').some(function (ch) { return l.indexOf(ch) >= 0; }); });
    }).length;
    $('#lettercap').innerHTML = nGroupsSharing === 0
      ? 'Every group has its own letter: all ' + rows.length + ' pairs differ.'
      : 'Groups that <b>share a letter</b> are not significantly different from each other. Groups with no letter in common are.';
    return letters;
  }

  function paintTable(A, rows) {
    var isT = state.route === 'tukey';
    var head = '<tr><th>Pair</th><th>' + (state.route === 'dunn' ? 'Mean rank diff' : 'Difference') + '</th>' +
      (isT ? '<th>' + Math.round(state.conf * 100) + '% CI (family-wise)</th>' : '') +
      '<th>' + (rows[0] ? rows[0].statLabel : 'stat') + '</th>' +
      (state.route === 'tukey' ? '' : '<th>Raw p</th>') +
      '<th>Adjusted p</th><th>Verdict</th></tr>';
    var body = rows.map(function (r) {
      var d = (state.route === 'dunn')
        ? fixed(A.dunn.meanRanks[r.ai] - A.dunn.meanRanks[r.bi], 2)
        : fmt(r.diff, 4);
      return '<tr class="' + (r.sig ? 'sigrow' : '') + '"><td class="pn">' + esc(r.pair) + '</td>' +
        '<td>' + d + '</td>' +
        (isT ? '<td class="ci">[' + fmt(r.lwr, 4) + ', ' + fmt(r.upr, 4) + ']</td>' : '') +
        '<td>' + fixed(r.stat, 3) + '</td>' +
        (state.route === 'tukey' ? '' : '<td>' + pfmt(r.praw) + '</td>') +
        '<td><b>' + pfmt(r.padj) + '</b>' + (r.nonMono ? ' <span class="flag" title="dunn.test reports the raw Benjamini-Hochberg multiplier without the monotonicity step, so this printed value disagrees with the step-up decision. The verdict follows the step-up rule.">!</span>' : '') + '</td>' +
        '<td>' + (r.sig ? '<span class="yes">differ</span>' : '<span class="no">no evidence</span>') + '</td></tr>';
    }).join('');
    $('#ptab').innerHTML = '<thead>' + head + '</thead><tbody>' + body + '</tbody>';
    var anyNonMono = rows.some(function (r) { return r.nonMono; });
    $('#nonmono').hidden = !anyNonMono;
  }

  function paintInference(A, rows) {
    var sig = rows.filter(function (r) { return r.sig; });
    var name = { tukey: 'Tukey HSD', bonf: 'Bonferroni-adjusted t-tests', dunn: "Dunn's test with BH" }[state.route];
    var line;
    if (!sig.length) {
      line = 'Since every adjusted p is at or above ' + fixed(A.alpha, 2) + ', ' + name +
             ' finds no pair that differs once the ' + (state.route === 'dunn' ? 'false discovery rate' : 'family-wise error rate') +
             ' is controlled.';
    } else {
      var top = sig.slice().sort(function (a, b) { return a.padj - b.padj; })[0];
      line = 'Since the adjusted p for ' + top.pair + ' is ' + pfmtPlain(top.padj) + ' &lt; ' + fixed(A.alpha, 2) +
             ', ' + name + ' concludes those two groups genuinely differ' +
             (sig.length > 1 ? ', and ' + (sig.length - 1) + ' other pair' + (sig.length > 2 ? 's do' : ' does') + ' too' : '') + '.';
    }
    $('#infline').innerHTML = line;
  }

  function paintPlain(A, rows) {
    var sig = rows.filter(function (r) { return r.sig; });
    var alpha = A.alpha;
    var ctrl = state.route === 'dunn'
      ? 'Benjamini-Hochberg keeps the <b>false discovery rate</b> at ' + fixed(alpha, 2) + ': of the pairs it flags, about ' + Math.round(alpha * 100) + '% are expected to be false alarms.'
      : 'This route keeps the <b>family-wise error rate</b> at ' + fixed(alpha, 2) + ': that is the chance of <i>even one</i> false positive across all ' + rows.length + ' comparisons.';
    var body;
    if (!sig.length) {
      body = 'No pair survives the correction. With ' + rows.length + ' comparisons the bar is deliberately higher than a single test, ' +
             'so a difference that would look significant on its own can fail here. That is the correction doing its job, not a bug.';
    } else {
      body = 'Of ' + rows.length + ' comparisons, <b>' + sig.length + '</b> survive: ' +
             sig.map(function (r) { return esc(r.pair); }).join(', ') + '. ' +
             'Read each one as: these two groups differ, and the adjusted p already pays for the fact that you looked at every pair.';
    }
    $('#plain').innerHTML = '<p>' + body + '</p><p>' + ctrl + '</p>';
  }

  function paintReport(A, rows) {
    var sig = rows.filter(function (r) { return r.sig; });
    var o = A.omnibus;
    var dfB = state.mode === 'raw' ? o.dfBetween : o.dfB;
    var head = 'A one-way ANOVA showed ' + (o.p < A.alpha ? 'a significant' : 'no significant') +
      ' effect of group, F(' + dfB + ', ' + A.dfW + ') = ' + fixed(o.f, 2) + ', p ' +
      (o.p < 0.001 ? '< .001' : '= ' + fixed(o.p, 3)) + '. ';
    var nm = { tukey: 'Tukey HSD post-hoc comparisons', bonf: 'Bonferroni-corrected pairwise t-tests', dunn: "Dunn's post-hoc test with Benjamini-Hochberg adjustment" }[state.route];
    var tail;
    if (!sig.length) tail = nm + ' revealed no significant pairwise differences (all adjusted p >= ' + fixed(A.alpha, 2) + ').';
    else tail = nm + ' revealed significant differences between ' +
      sig.map(function (r) {
        var d = state.route === 'dunn' ? '' : ' (difference = ' + fmt(r.diff, 2) +
          (state.route === 'tukey' ? ', ' + Math.round(state.conf * 100) + '% CI [' + fmt(r.lwr, 2) + ', ' + fmt(r.upr, 2) + ']' : '') + ')';
        return r.pair + d + ', adjusted p ' + (r.padj < 0.001 ? '< .001' : '= ' + fixed(r.padj, 3));
      }).join('; ') + '.';
    $('#report').textContent = head + tail;
  }

  function paintSteps(A, rows) {
    var o = A.omnibus, r0 = rows[0];
    var h = [];
    h.push('<p>The pooled error from the ANOVA is what every route below leans on:</p>');
    h.push('<div class="calc">MS<sub>within</sub> = SS<sub>within</sub> / df<sub>within</sub> = ' +
      fmt(state.mode === 'raw' ? o.ssWithin : o.ssW, 4) + ' / ' + A.dfW + ' = <b>' + fmt(A.msW, 5) + '</b></div>');
    if (state.route === 'tukey' && r0) {
      h.push('<p>For <b>' + esc(r0.pair) + '</b>, Tukey divides the observed gap by the standard error of a <i>difference of two means</i>, then reads the studentized range distribution:</p>');
      var p0 = A.tukey.pairs[0];
      h.push('<div class="calc">SE = sqrt( (MS<sub>within</sub> / 2) &times; (1/n<sub>i</sub> + 1/n<sub>j</sub>) ) = sqrt( (' +
        fmt(A.msW, 5) + ' / 2) &times; (1/' + A.ns[p0.ai] + ' + 1/' + A.ns[p0.bi] + ') ) = <b>' + fmt(p0.se, 5) + '</b></div>');
      h.push('<div class="calc">q = difference / SE = ' + fmt(p0.diff, 4) + ' / ' + fmt(p0.se, 5) + ' = <b>' + fixed(p0.statistic, 4) + '</b></div>');
      h.push('<div class="calc">p adj = ptukey(|' + fixed(p0.statistic, 4) + '|, nmeans = ' + A.k + ', df = ' + A.dfW + ', lower.tail = FALSE) = <b>' + pfmtPlain(p0.padj) + '</b></div>');
      h.push('<div class="calc">CI = difference &plusmn; q<sub>crit</sub> &times; SE = ' + fmt(p0.diff, 4) + ' &plusmn; ' +
        fixed(A.tukey.qcrit, 4) + ' &times; ' + fmt(p0.se, 5) + ' = <b>[' + fmt(p0.lwr, 4) + ', ' + fmt(p0.upr, 4) + ']</b></div>');
      h.push('<p class="sn">The studentized range distribution already knows you are taking the largest of ' + A.k +
        ' means, which is exactly why no extra penalty is applied afterwards.</p>');
    } else if (state.route === 'bonf' && r0) {
      var b0 = A.bonferroni.pairs[0];
      h.push('<p>Bonferroni runs an ordinary t-test for <b>' + esc(b0.pair) + '</b>, but with the ANOVA\'s <i>pooled</i> SD and all ' + A.dfW + ' residual df:</p>');
      h.push('<div class="calc">pooled SD = sqrt(MS<sub>within</sub>) = sqrt(' + fmt(A.msW, 5) + ') = <b>' + fmt(A.bonferroni.pooledSD, 5) + '</b></div>');
      h.push('<div class="calc">t = difference / (pooled SD &times; sqrt(1/n<sub>i</sub> + 1/n<sub>j</sub>)) = ' +
        fmt(b0.diff, 4) + ' / ' + fmt(b0.se, 5) + ' = <b>' + fixed(b0.t, 4) + '</b></div>');
      h.push('<div class="calc">raw p = 2 &times; pt(-|' + fixed(b0.t, 4) + '|, df = ' + A.dfW + ') = <b>' + pfmtPlain(b0.praw) + '</b></div>');
      h.push('<div class="calc">adjusted p = min(1, raw p &times; m) = min(1, ' + pfmtPlain(b0.praw) + ' &times; ' + A.bonferroni.m + ') = <b>' + pfmtPlain(b0.padj) + '</b></div>');
      h.push('<p class="sn">m = ' + A.bonferroni.m + ' is the number of pairs. Multiplying every p by m is the whole method: blunt, transparent, and never anti-conservative.</p>');
    } else if (state.route === 'dunn' && A.dunn) {
      var d0 = A.dunn.pairs[0];
      h.push('<p>Dunn throws away the values and keeps only their <b>ranks</b> across all ' + A.N + ' observations, then compares mean ranks:</p>');
      h.push('<div class="calc">tie correction = sum(t<sup>3</sup> - t) / (12 &times; (N - 1)) = <b>' + fmt(A.dunn.tiesadj, 5) + '</b>' +
        (A.dunn.hasTies ? '' : '  (no ties in this data, so it is 0)') + '</div>');
      h.push('<div class="calc">z = (mean rank<sub>' + esc(d0.a) + '</sub> - mean rank<sub>' + esc(d0.b) + '</sub>) / sqrt( (N(N+1)/12 - tie correction) &times; (1/n<sub>i</sub> + 1/n<sub>j</sub>) )</div>');
      h.push('<div class="calc">z = (' + fixed(A.dunn.meanRanks[d0.ai], 2) + ' - ' + fixed(A.dunn.meanRanks[d0.bi], 2) + ') / ... = <b>' + fixed(d0.z, 4) + '</b></div>');
      h.push('<div class="calc">raw p = 2 &times; pnorm(-|' + fixed(d0.z, 4) + '|) = <b>' + pfmtPlain(d0.praw) + '</b>, then Benjamini-Hochberg across the ' + A.dunn.pairs.length + ' pairs gives <b>' + pfmtPlain(d0.padj) + '</b></div>');
      h.push('<p class="sn">Ranks are why this route shrugs off outliers and works on ordinal scales: only the ordering matters, not how far apart the numbers are.</p>');
    }
    $('#steps').innerHTML = h.join('');
  }

  // --------------------------------------------------------------- R export --
  function rVec(a) { return 'c(' + a.map(function (v) { return String(v); }).join(', ') + ')'; }
  function paintR(A) {
    var L = [];
    if (state.mode === 'raw') {
      var vals = [], labs = [];
      A.groups.forEach(function (g) {
        g.values.forEach(function (v) { vals.push(v); labs.push(g.name); });
      });
      L.push('# ' + A.k + ' groups, N = ' + A.N);
      L.push('value <- ' + rVec(vals));
      L.push('group <- factor(' + rVec(labs.map(rq)) + ',');
      L.push('                levels = ' + rVec(A.names.map(rq)) + ')');
      L.push('');
      L.push('fit <- aov(value ~ group)');
      L.push('summary(fit)                 # the omnibus F test first');
      L.push('');
      if (state.route === 'tukey') {
        L.push('# 1. Tukey HSD: pairwise differences, family-wise ' + Math.round(state.conf * 100) + '% CIs');
        L.push('TukeyHSD(fit, conf.level = ' + state.conf + ')');
      } else if (state.route === 'bonf') {
        L.push('# 2. Bonferroni: pooled-SD t-tests, every p multiplied by ' + A.bonferroni.m);
        L.push('pairwise.t.test(value, group, p.adjust.method = "bonferroni")');
      } else {
        L.push('# 3. Dunn: the Kruskal-Wallis follow-up, Benjamini-Hochberg adjusted');
        L.push('kruskal.test(value ~ group)');
        L.push('FSA::dunnTest(value, group, method = "bh")');
      }
    } else {
      L.push('# Only group summaries were available, so rebuild vectors that have');
      L.push('# EXACTLY the given mean and SD: m + s * scale(1:n) is exact, so aov()');
      L.push('# on these reproduces the real ANOVA and Tukey HSD.');
      L.push('mk <- function(m, s, n) as.numeric(m + s * scale(1:n))');
      A.names.forEach(function (nm, i) {
        L.push('g' + (i + 1) + ' <- mk(' + A.means[i] + ', ' + A.sds[i] + ', ' + A.ns[i] + ')   # ' + nm);
      });
      L.push('');
      L.push('value <- c(' + A.names.map(function (_, i) { return 'g' + (i + 1); }).join(', ') + ')');
      L.push('group <- factor(rep(' + rVec(A.names.map(rq)) + ',');
      L.push('                    times = ' + rVec(A.ns) + '),');
      L.push('                levels = ' + rVec(A.names.map(rq)) + ')');
      L.push('');
      L.push('fit <- aov(value ~ group)');
      L.push('summary(fit)');
      if (state.route === 'bonf') {
        L.push('pairwise.t.test(value, group, p.adjust.method = "bonferroni")');
      } else {
        L.push('TukeyHSD(fit, conf.level = ' + state.conf + ')');
      }
      L.push('');
      L.push('# Dunn is not available from summaries: ranks need the raw values.');
    }
    $('#rcode').textContent = L.join('\n');
  }

  // ------------------------------------------------------------------ wiring --
  // The GA event names are declared inline in the page (window.phGA) so they
  // stay greppable in the rendered HTML; this module only fires them.
  var used = false;
  function markUse() {
    if (used) return; used = true;
    try { if (window.phGA) window.phGA.use(); } catch (e) {}
  }

  function setMode(m) {
    state.mode = m;
    $('#pane-raw').hidden = m !== 'raw';
    $('#pane-sum').hidden = m !== 'summary';
    $$('.mode').forEach(function (b) { b.classList.toggle('on', b.dataset.mode === m); });
    var sel = $('#goal');
    if (sel.value !== m) sel.value = m;
    render();
  }

  function addRow(name, mean, sd, n) {
    var d = document.createElement('div');
    d.className = 'srow';
    d.innerHTML = '<input class="s-name" type="text" aria-label="Group name" placeholder="Group" value="' + esc(name || '') + '">' +
      '<input class="s-mean" type="number" step="any" aria-label="Mean" placeholder="mean" value="' + (mean === undefined ? '' : mean) + '">' +
      '<input class="s-sd" type="number" step="any" aria-label="Standard deviation" placeholder="SD" value="' + (sd === undefined ? '' : sd) + '">' +
      '<input class="s-n" type="number" step="1" min="2" aria-label="Sample size" placeholder="n" value="' + (n === undefined ? '' : n) + '">' +
      '<button class="srm" type="button" aria-label="Remove this group">&times;</button>';
    $('#sumrows').appendChild(d);
  }

  function loadScen(key) {
    var s = SCEN[key];
    if (!s) return;
    if (s.mode === 'raw') { $('#raw').value = s.raw; setMode('raw'); }
    else {
      $('#sumrows').innerHTML = '';
      s.rows.forEach(function (r) { addRow(r[0], r[1], r[2], r[3]); });
      setMode('summary');
    }
    if (s.route) { state.route = s.route; }
    $$('.scen').forEach(function (b) { b.classList.toggle('on', b.dataset.scen === key); });
    render();
  }

  function copy(text, btn) {
    function done() {
      var t = btn.textContent; btn.textContent = 'Copied'; btn.classList.add('okc');
      setTimeout(function () { btn.textContent = t; btn.classList.remove('okc'); }, 1400);
      try { if (window.phGA) window.phGA.copy(btn.dataset.copy); } catch (e) {}
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () {});
    } else {
      var ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) {}
      document.body.removeChild(ta);
    }
  }

  function boot() {
    $$('.mode').forEach(function (b) {
      b.addEventListener('click', function () { markUse(); setMode(b.dataset.mode); });
    });
    $('#goal').addEventListener('change', function () { markUse(); setMode(this.value); });
    $$('.rt').forEach(function (b) {
      b.addEventListener('click', function () { markUse(); state.route = b.dataset.route; render(); });
    });
    $$('.scen').forEach(function (b) {
      b.addEventListener('click', function () { markUse(); loadScen(b.dataset.scen); });
    });
    $('#raw').addEventListener('input', function () { markUse(); render(); });
    $('#conf').addEventListener('change', function () {
      markUse(); state.conf = parseFloat(this.value); render();
    });
    $('#sumrows').addEventListener('input', function () { markUse(); render(); });
    $('#sumrows').addEventListener('click', function (e) {
      if (e.target.classList.contains('srm')) {
        if ($$('#sumrows .srow').length <= 3) return;
        e.target.parentNode.remove(); render();
      }
    });
    $('#addrow').addEventListener('click', function () { markUse(); addRow(); render(); });
    // Seed the summary form BEFORE picking the opening scenario, so switching to
    // "Group summaries" always lands on a working tool. Left empty, the mode
    // switch threw "needs at least three groups" and stranded the previous
    // mode's table and R code on screen, which reads as someone else's result.
    SCEN.summ.rows.forEach(function (r) { addRow(r[0], r[1], r[2], r[3]); });
    $$('[data-copy]').forEach(function (b) {
      b.addEventListener('click', function () {
        var t = b.dataset.copy === 'r' ? $('#rcode').textContent : $('#report').textContent;
        copy(t, b);
      });
    });
    loadScen('drug');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
