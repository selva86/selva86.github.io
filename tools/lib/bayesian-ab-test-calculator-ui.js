/* bayesian-ab-test-calculator-ui.js - UI engine for tools/bayesian-ab-test-calculator.html
   Lives in a file (not inline) so the rendered page stays under the audit's
   200KB ceiling. All math comes from tools/lib/bayes-ab-math.js, which is
   verified against R; nothing here recomputes a statistic. */
(function () {
  'use strict';
  var M = window.BayesABMath, BM = window.BetaMath;
  if (!M) return;

  var $ = function (id) { return document.getElementById(id); };
  var els = {};
  ['cA', 'nA', 'cB', 'nB', 'thr', 'lev', 'prior', 'a0', 'b0', 'in-prior', 'rateA', 'rateB',
   'hint', 'ierr', 'vchip', 'vhead', 'vsub', 'curve', 'lossbar', 'lossviz',
   'k1', 'v1', 'k2', 'v2', 'k3', 'v3', 'k4', 'v4', 'dlabel',
   'k5', 'd1', 'k6', 'd2', 'k7', 'd3', 'k8', 'd4',
   'thrtab', 'thrbody', 'priortab', 'priorbody', 'plain', 'inference-line',
   'report', 'copybtn', 'iwant', 'h1c', 'h2c', 'h3c', 'rcopy', 'rcodepre'
  ].forEach(function (id) { els[id] = $(id); });

  var mode = 'decide';
  var used = false;

  // ---- formatting -------------------------------------------------------

  // Losses are rates; the page speaks percentage points. Below 0.0001pp the
  // value is not something a decision can use (thresholds live at 0.01pp and
  // up), and it is also past where double precision stays meaningful, so it is
  // reported as a bound rather than a fake digit.
  function fmtLoss(x) {
    var v = x * 100;
    if (!(v > 0)) return '0pp';
    if (v < 0.0001) return '<0.0001pp';
    return v.toFixed(4) + 'pp';
  }
  function fmtPP(x, d) {
    var v = x * 100;
    return (v >= 0 ? '+' : '') + v.toFixed(d === undefined ? 2 : d) + 'pp';
  }
  function fmtPct(x, d) { return (x * 100).toFixed(d === undefined ? 1 : d) + '%'; }
  function fmtRel(x) {
    var v = x * 100;
    return (v >= 0 ? '+' : '') + v.toFixed(1) + '%';
  }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function num(el) { var v = parseFloat(el.value); return isFinite(v) ? v : NaN; }

  // ---- state ------------------------------------------------------------

  function priorPair() {
    var p = els.prior.value;
    if (p === 'custom') return [num(els.a0), num(els.b0)];
    var parts = p.split(',');
    return [parseFloat(parts[0]), parseFloat(parts[1])];
  }

  function readInputs() {
    var pr = priorPair();
    return {
      cA: num(els.cA), nA: num(els.nA), cB: num(els.cB), nB: num(els.nB),
      a0: pr[0], b0: pr[1],
      level: parseFloat(els.lev.value),
      threshold: num(els.thr) / 100          // pp -> rate
    };
  }

  // analyze() runs seven quadratures plus an interval inversion, so repeated
  // renders (mode switches, re-paints) memoise rather than recompute.
  var memo = { key: '', val: null };
  function run(inp) {
    var key = [inp.cA, inp.nA, inp.cB, inp.nB, inp.a0, inp.b0, inp.level, inp.threshold].join('|');
    if (memo.key === key) return memo.val;
    var r = M.analyze(inp);
    memo = { key: key, val: r };
    return r;
  }

  // ---- posterior curves -------------------------------------------------

  var SVGNS = 'http://www.w3.org/2000/svg';
  function mk(tag, attrs) {
    var e = document.createElementNS(SVGNS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  function drawCurves(r) {
    var svg = els.curve;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var W = 640, H = 220, L = 8, R = 8, T = 12, Bo = 30;

    // Plot the union of both posteriors' visible ranges, padded a little.
    var wA = [BM.qbeta(1e-5, r.a1, r.b1), BM.qbeta(1 - 1e-5, r.a1, r.b1)];
    var wB = [BM.qbeta(1e-5, r.a2, r.b2), BM.qbeta(1 - 1e-5, r.a2, r.b2)];
    var lo = Math.max(0, Math.min(wA[0], wB[0])), hi = Math.min(1, Math.max(wA[1], wB[1]));
    var pad = (hi - lo) * 0.06; lo = Math.max(0, lo - pad); hi = Math.min(1, hi + pad);
    if (!(hi > lo)) { hi = Math.min(1, lo + 1e-6); }

    // 120 points across 640px is one every ~5px: indistinguishable on a smooth
    // density, and a quarter of the DOM. The page audit measures RENDERED
    // outerHTML against a 200KB ceiling, and four 260-point paths alone were
    // 14KB of it.
    var N = 120, i, x, ymax = 0;
    var xs = [], ya = [], yb = [];
    for (i = 0; i <= N; i++) {
      x = lo + (hi - lo) * i / N;
      xs.push(x);
      var da = BM.dbeta(x, r.a1, r.b1), db = BM.dbeta(x, r.a2, r.b2);
      if (!isFinite(da)) da = 0;
      if (!isFinite(db)) db = 0;
      ya.push(da); yb.push(db);
      if (da > ymax) ymax = da;
      if (db > ymax) ymax = db;
    }
    if (!(ymax > 0)) ymax = 1;

    var px = function (v) { return L + (v - lo) / (hi - lo) * (W - L - R); };
    var py = function (v) { return H - Bo - (v / ymax) * (H - Bo - T); };

    function path(ys, close) {
      var d = '', j;
      for (j = 0; j <= N; j++) d += (j ? 'L' : 'M') + px(xs[j]).toFixed(1) + ' ' + py(ys[j]).toFixed(1);
      if (close) d += 'L' + px(xs[N]).toFixed(1) + ' ' + py(0).toFixed(1) +
                      'L' + px(xs[0]).toFixed(1) + ' ' + py(0).toFixed(1) + 'Z';
      return d;
    }

    // baseline
    svg.appendChild(mk('line', { x1: L, y1: py(0), x2: W - R, y2: py(0), stroke: '#e9e9e4', 'stroke-width': 1 }));

    svg.appendChild(mk('path', { d: path(ya, true), fill: '#8a6a3d', opacity: 0.16 }));
    svg.appendChild(mk('path', { d: path(yb, true), fill: '#1f7a55', opacity: 0.16 }));
    svg.appendChild(mk('path', { d: path(ya, false), fill: 'none', stroke: '#8a6a3d', 'stroke-width': 2 }));
    svg.appendChild(mk('path', { d: path(yb, false), fill: 'none', stroke: '#1f7a55', 'stroke-width': 2 }));

    // mean markers
    [[r.meanA, '#8a6a3d', 'A'], [r.meanB, '#1f7a55', 'B']].forEach(function (m) {
      if (m[0] < lo || m[0] > hi) return;
      svg.appendChild(mk('line', {
        x1: px(m[0]), y1: py(0), x2: px(m[0]), y2: T + 2,
        stroke: m[1], 'stroke-width': 1.2, 'stroke-dasharray': '3 3', opacity: 0.75
      }));
      var t = mk('text', {
        x: px(m[0]), y: T - 1, 'text-anchor': 'middle',
        fill: m[1], 'font-size': 11, 'font-weight': 600,
        'font-family': 'Inter,system-ui,sans-serif'
      });
      t.textContent = m[2];
      svg.appendChild(t);
    });

    // x axis ticks in %
    var ticks = 5;
    for (i = 0; i <= ticks; i++) {
      var tv = lo + (hi - lo) * i / ticks;
      var tk = mk('text', {
        x: px(tv), y: H - 10, 'text-anchor': i === 0 ? 'start' : (i === ticks ? 'end' : 'middle'),
        fill: '#888e97', 'font-size': 11, 'font-family': 'Inter,system-ui,sans-serif'
      });
      tk.textContent = (tv * 100).toFixed((hi - lo) < 0.02 ? 2 : 1) + '%';
      svg.appendChild(tk);
    }
  }

  function drawLossBar(r) {
    var svg = els.lossviz;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var W = 640, H = 96, L = 8, R = 8;
    var loss = r.stop.lossLeader, thr = r.stop.threshold;
    var max = Math.max(loss * 1.35, thr * 2.2, 1e-9);
    var px = function (v) { return L + (v / max) * (W - L - R); };

    svg.appendChild(mk('rect', { x: L, y: 30, width: W - L - R, height: 26, rx: 6, fill: '#f2f2ee' }));
    var w = Math.max(2, px(Math.min(loss, max)) - L);
    svg.appendChild(mk('rect', {
      x: L, y: 30, width: w, height: 26, rx: 6,
      fill: r.stop.canStop ? '#1f7a55' : '#a8322c', opacity: 0.85
    }));
    // threshold line
    var tx = px(thr);
    svg.appendChild(mk('line', { x1: tx, y1: 20, x2: tx, y2: 66, stroke: '#14161b', 'stroke-width': 2 }));
    var lt = mk('text', {
      x: Math.min(W - R, tx + 6), y: 16, fill: '#14161b', 'font-size': 11.5, 'font-weight': 600,
      'font-family': 'Inter,system-ui,sans-serif',
      'text-anchor': tx > W * 0.72 ? 'end' : 'start'
    });
    lt.textContent = 'threshold ' + (thr * 100).toFixed(4).replace(/0+$/, '').replace(/\.$/, '') + 'pp';
    svg.appendChild(lt);
    var lv = mk('text', {
      x: w > 150 ? L + 8 : Math.min(W - R - 4, L + w + 8),
      y: 48, fill: w > 150 ? '#fff' : '#4d525b', 'font-size': 12.5, 'font-weight': 600,
      'font-family': 'Inter,system-ui,sans-serif'
    });
    lv.textContent = 'loss if you ship ' + r.stop.leader + ': ' + fmtLoss(loss);
    svg.appendChild(lv);
    var cap = mk('text', {
      x: L, y: 80, fill: '#888e97', 'font-size': 11, 'font-family': 'Inter,system-ui,sans-serif'
    });
    cap.textContent = r.stop.canStop
      ? 'Bar is left of the line: the plausible cost of shipping ' + r.stop.leader + ' is under what you said you cared about.'
      : 'Bar is right of the line: there is still more at stake than your threshold allows.';
    svg.appendChild(cap);
  }

  // ---- the R emitter ----------------------------------------------------

  function rCode(inp, r) {
    var L = [];
    L.push('# Bayesian A/B test, beta-binomial conjugate update');
    L.push('cA <- ' + inp.cA + '; nA <- ' + inp.nA + '   # A: conversions, visitors');
    L.push('cB <- ' + inp.cB + '; nB <- ' + inp.nB + '   # B: conversions, visitors');
    L.push('a0 <- ' + inp.a0 + '; b0 <- ' + inp.b0 + '   # prior on each rate');
    L.push('');
    L.push('# Posteriors: add successes to alpha, failures to beta');
    L.push('a1 <- a0 + cA; b1 <- b0 + nA - cA   # A ~ Beta(a1, b1)');
    L.push('a2 <- a0 + cB; b2 <- b0 + nB - cB   # B ~ Beta(a2, b2)');
    L.push('');
    L.push('# Integrate only where the posterior has mass. Over the full 0..1');
    L.push('# range a narrow posterior is missed entirely and integrate()');
    L.push('# returns ~0 while reporting success.');
    L.push('win <- function(a, b) c(qbeta(1e-14, a, b), qbeta(1 - 1e-14, a, b))');
    L.push('');
    L.push('# P(B > A) = int f_B(b) F_A(b) db');
    L.push('w <- win(a2, b2)');
    L.push('pBgtA <- integrate(function(b) dbeta(b, a2, b2) * pbeta(b, a1, b1),');
    L.push('                   w[1], w[2], rel.tol = 1e-12)$value');
    L.push('');
    L.push('# E[max(Beta(x2,y2) - Beta(x1,y1), 0)], using E[x 1(x>c)] = mean * sf(c; a+1, b)');
    L.push('eloss <- function(x1, y1, x2, y2) {');
    L.push('  m2 <- x2 / (x2 + y2); w <- win(x1, y1)');
    L.push('  integrate(function(a) dbeta(a, x1, y1) *');
    L.push('              (m2 * pbeta(a, x2 + 1, y2, lower.tail = FALSE) -');
    L.push('                 a * pbeta(a, x2, y2, lower.tail = FALSE)),');
    L.push('            w[1], w[2], rel.tol = 1e-12)$value');
    L.push('}');
    L.push('lossShipA <- eloss(a1, b1, a2, b2)   # ship A, B was really better');
    L.push('lossShipB <- eloss(a2, b2, a1, b1)   # ship B, A was really better');
    L.push('');
    // Printed with cat(sprintf()) rather than by auto-printing a named vector.
    // print() picks ONE common format for the whole vector, so a single tiny
    // element drags every other one into scientific notation (a clear winner
    // prints "1.000000e+00 5.241756e-27 1.999600e+00", not "1 ... 1.9996").
    // Fixed per-value formats keep the #> lines predictable and let them state
    // exactly the numbers the panel above shows.
    L.push('cat(sprintf("P(B beats A)          = %.4f\\n", pBgtA))');
    L.push('cat(sprintf("Expected loss, ship B = %.6f pp\\n", lossShipB * 100))');
    L.push('cat(sprintf("Expected loss, ship A = %.6f pp\\n", lossShipA * 100))');
    L.push('#> P(B beats A)          = ' + r.pBgtA.toFixed(4));
    L.push('#> Expected loss, ship B = ' + (r.lossChooseB * 100).toFixed(6) + ' pp');
    L.push('#> Expected loss, ship A = ' + (r.lossChooseA * 100).toFixed(6) + ' pp');
    return L.join('\n');
  }

  // ---- verdict wording --------------------------------------------------

  function leadWord(p) {
    if (p >= 0.99) return 'B is almost certainly better';
    if (p >= 0.95) return 'B is very likely better';
    if (p >= 0.8) return 'B is probably better';
    if (p > 0.5) return 'B is slightly ahead';
    if (p === 0.5) return 'The two are dead level';
    if (p > 0.2) return 'A is slightly ahead';
    if (p > 0.05) return 'A is probably better';
    return 'A is very likely better';
  }

  // ---- render -----------------------------------------------------------

  function setIwant() {
    var opts = [
      ['decide', 'decide which variant to ship'],
      ['stop', 'check whether I can stop the test now'],
      ['prior', 'see how much my prior is driving the answer']
    ];
    var sel = '<span class="psel">' + esc(opts.filter(function (o) { return o[0] === mode; })[0][1]) +
      '<span class="pcaret">&#9662;</span><select id="iwsel" aria-label="What do you want to work out">' +
      opts.map(function (o) {
        return '<option value="' + o[0] + '"' + (o[0] === mode ? ' selected' : '') + '>' + esc(o[1]) + '</option>';
      }).join('') + '</select></span>';
    els.iwant.innerHTML = 'I want to ' + sel;
    $('iwsel').addEventListener('change', function () { setMode(this.value); });
  }

  function setMode(m) {
    mode = m;
    document.querySelectorAll('.mode').forEach(function (b) {
      b.classList.toggle('on', b.dataset.mode === m);
    });
    setIwant();
    render();
  }

  function thresholdLadder(r) {
    var ladder = [0.0001, 0.0005, 0.001, 0.0025, 0.005, 0.01];
    if (ladder.indexOf(r.stop.threshold) === -1 && r.stop.threshold > 0) ladder.push(r.stop.threshold);
    ladder.sort(function (a, b) { return a - b; });
    var loss = r.stop.lossLeader;
    return ladder.map(function (t) {
      var stop = loss <= t;
      var here = Math.abs(t - r.stop.threshold) < 1e-12;
      return '<tr class="' + (here ? 'here' : '') + '"><td>' +
        (t * 100).toFixed(4).replace(/0+$/, '').replace(/\.$/, '') + 'pp' +
        (here ? ' <b>(yours)</b>' : '') + '</td><td>' + fmtLoss(loss) + '</td><td class="' +
        (stop ? 'on' : 'off') + '">' + (stop ? 'ship ' + r.stop.leader + ' now' : 'keep running') +
        '</td></tr>';
    }).join('');
  }

  function priorSweep(inp) {
    var priors = [
      { label: 'Uniform, Beta(1, 1)', a0: 1, b0: 1 },
      { label: 'Jeffreys, Beta(0.5, 0.5)', a0: 0.5, b0: 0.5 }
    ];
    var isStd = (inp.a0 === 1 && inp.b0 === 1) || (inp.a0 === 0.5 && inp.b0 === 0.5);
    if (!isStd) priors.push({ label: 'Yours, Beta(' + inp.a0 + ', ' + inp.b0 + ')', a0: inp.a0, b0: inp.b0 });
    return M.priorSweep(inp, priors).filter(function (row) { return row.res && row.res.ok; });
  }

  function priorRows(inp, rows) {
    return rows.map(function (row) {
      var q = row.res;
      var mine = Math.abs(row.a0 - inp.a0) < 1e-12 && Math.abs(row.b0 - inp.b0) < 1e-12;
      return '<tr class="' + (mine ? 'here' : '') + '"><td>' + esc(row.label) + (mine ? ' <b>(in use)</b>' : '') +
        '</td><td>' + fmtPct(q.pBgtA) + '</td><td>' + fmtLoss(q.stop.lossLeader) +
        '</td><td>' + fmtPP(q.meanLift) + '</td><td class="' + (q.stop.canStop ? 'on' : 'off') + '">' +
        (q.stop.canStop ? 'ship ' + q.stop.leader : 'keep running') + '</td></tr>';
    }).join('');
  }

  // Whether the prior is "driving" the answer is a question with a measurable
  // answer, so measure it against the uniform read rather than guessing from a
  // pseudo-count ratio. A Beta(30,270) prior against 10,000 visitors is 300
  // imaginary observations, which a ratio rule calls heavy, yet it moves
  // P(B beats A) by 0.3pp and changes no decision. What matters is whether the
  // prior changes the DECISION, then whether it visibly moves the numbers.
  function priorVerdict(inp, r, rows) {
    var uni = null;
    rows.forEach(function (row) { if (row.a0 === 1 && row.b0 === 1) uni = row.res; });
    if (!uni) return { head: 'Prior sensitivity', sub: '' };
    var dP = Math.abs(r.pBgtA - uni.pBgtA);
    var decisionMoved = uni.stop.leader !== r.stop.leader || uni.stop.canStop !== r.stop.canStop;
    var same = Math.abs(inp.a0 - 1) < 1e-12 && Math.abs(inp.b0 - 1) < 1e-12;
    var weight = 'Your prior is worth <b>' + (Math.round((inp.a0 + inp.b0) * 100) / 100) +
      ' imaginary visitors</b> per arm, against ' + Math.min(inp.nA, inp.nB).toLocaleString() +
      ' real ones in the smaller arm. ';
    if (same) return { head: 'The data are driving this, not the prior', sub: weight + 'You are on the uniform prior, so the rows below show what a different starting belief would have done.' };
    if (decisionMoved) return {
      head: 'Your prior is changing the decision',
      sub: weight + 'Against a uniform prior it flips the call, so this answer rests on the prior as much as on the data. Be able to say where the prior came from.'
    };
    if (dP > 0.02) return {
      head: 'The prior is nudging the answer',
      sub: weight + 'It shifts P(B beats A) by ' + (dP * 100).toFixed(1) + ' points against a uniform prior, without changing the decision.'
    };
    return {
      head: 'The data are driving this, not the prior',
      sub: weight + 'Swapping to a uniform prior moves P(B beats A) by ' + (dP * 100).toFixed(1) +
        ' points and changes nothing you would do.'
    };
  }

  function render() {
    var inp = readInputs();

    // prior fields only when custom
    els['in-prior'].hidden = els.prior.value !== 'custom';

    var r = run(inp);
    if (!r.ok) {
      els.ierr.className = 'ierr show';
      els.ierr.textContent = r.errors[0];
      return;
    }
    els.ierr.className = 'ierr';

    els.rateA.textContent = isFinite(r.rateA) ? fmtPct(r.rateA, 2) + ' converting' : '';
    els.rateB.textContent = isFinite(r.rateB) ? fmtPct(r.rateB, 2) + ' converting' : '';

    drawCurves(r);

    var lead = r.stop.leader, other = lead === 'B' ? 'A' : 'B';
    var pctB = fmtPct(r.pBgtA);

    // ---- headline per mode ----
    els.lossbar.hidden = mode !== 'stop';
    els.thrtab.hidden = mode !== 'stop';
    els.priortab.hidden = mode !== 'prior';

    if (mode === 'stop') {
      drawLossBar(r);
      els.thrbody.innerHTML = thresholdLadder(r);
      els.vchip.textContent = r.stop.canStop ? 'Stop the test' : 'Keep running';
      els.vchip.className = 'vchip' + (r.stop.canStop ? '' : ' warn');
      els.vhead.textContent = r.stop.canStop
        ? 'You can stop now and ship ' + lead
        : 'Not yet: too much is still at stake';
      els.vsub.innerHTML = r.stop.canStop
        ? 'Shipping ' + lead + ' risks <b>' + fmtLoss(r.stop.lossLeader) + '</b>, under your ' +
          (r.stop.threshold * 100).toFixed(4).replace(/0+$/, '').replace(/\.$/, '') + 'pp threshold.'
        : 'Shipping ' + lead + ' still risks <b>' + fmtLoss(r.stop.lossLeader) + '</b>, above your ' +
          (r.stop.threshold * 100).toFixed(4).replace(/0+$/, '').replace(/\.$/, '') + 'pp threshold.';
    } else if (mode === 'prior') {
      var sweep = priorSweep(inp);
      els.priorbody.innerHTML = priorRows(inp, sweep);
      var pv = priorVerdict(inp, r, sweep);
      els.vchip.textContent = 'Prior sensitivity';
      els.vchip.className = 'vchip';
      els.vhead.textContent = pv.head;
      els.vsub.innerHTML = pv.sub;
    } else {
      els.vchip.textContent = 'Beta(' + r.a1 + ', ' + r.b1 + ') vs Beta(' + r.a2 + ', ' + r.b2 + ')';
      els.vchip.className = 'vchip';
      els.vhead.textContent = leadWord(r.pBgtA) + (r.stop.canStop ? '. Safe to ship ' + lead : '');
      els.vsub.innerHTML = 'P(B beats A) = <b>' + pctB + '</b>, expected lift ' + fmtPP(r.meanLift) +
        ' (' + fmtRel(r.meanRelLift) + ' relative).';
    }

    // ---- stats grids (same in every mode) ----
    els.v1.textContent = pctB;
    els.v2.textContent = fmtLoss(r.lossChooseB);
    els.v3.textContent = fmtLoss(r.lossChooseA);
    els.v4.textContent = fmtPP(r.meanLift);
    els.v2.className = 'v' + (lead === 'B' ? ' acc' : '');
    els.v3.className = 'v' + (lead === 'A' ? ' acc' : '');

    var lv = Math.round(r.level * 100);
    els.dlabel.textContent = 'What the data still leave open (' + lv + '% credible)';
    els.k5.textContent = "A's rate";
    els.k6.textContent = "B's rate";
    els.k7.textContent = 'Lift, absolute';
    els.k8.textContent = 'Lift, relative';
    els.d1.textContent = fmtPct(r.ciA[0], 2) + ' to ' + fmtPct(r.ciA[1], 2);
    els.d2.textContent = fmtPct(r.ciB[0], 2) + ' to ' + fmtPct(r.ciB[1], 2);
    els.d3.textContent = fmtPP(r.dLo) + ' to ' + fmtPP(r.dHi);
    els.d4.textContent = fmtRel(r.rLo) + ' to ' + fmtRel(r.rHi);

    // ---- plain English ----
    var spans0 = r.dLo < 0 && r.dHi > 0;
    els.plain.innerHTML = 'Given the data and a Beta(' + inp.a0 + ', ' + inp.b0 + ') prior, B converts better than A in <b>' +
      pctB + '</b> of the outcomes still consistent with what you have seen. If you shipped <b>' + lead +
      '</b> today and it turned out to be the worse variant, you would give up <b>' + fmtLoss(r.stop.lossLeader) +
      '</b> of conversion rate on average. Shipping ' + other + ' instead would risk ' + fmtLoss(r.stop.lossOther) + '. ' +
      (spans0
        ? 'The ' + lv + '% credible interval for the lift still contains zero, so a genuinely flat result is not ruled out.'
        : 'The ' + lv + '% credible interval for the lift excludes zero, so a flat result is not among the plausible outcomes.');

    // ---- inference line ----
    var thrTxt = (r.stop.threshold * 100).toFixed(4).replace(/0+$/, '').replace(/\.$/, '') + 'pp';
    els['inference-line'].innerHTML = '<span class="ik">The read</span>' +
      (r.stop.canStop
        ? 'Since the expected loss of shipping ' + lead + ' is <b>' + fmtLoss(r.stop.lossLeader) +
          '</b>, below your ' + thrTxt + ' threshold of caring, <b>stop the test and ship ' + lead +
          '</b>: the most you are plausibly leaving on the table is less than the amount you said would matter.'
        : 'Since the expected loss of shipping ' + lead + ' is <b>' + fmtLoss(r.stop.lossLeader) +
          '</b>, still above your ' + thrTxt + ' threshold of caring, <b>keep the test running</b>' +
          (r.pBgtA >= 0.95 || r.pBgtA <= 0.05
            ? ', even though P(B beats A) already reads ' + pctB + '. Being ahead is not the same as being ahead by enough.'
            : '. There is more at stake than you said you were willing to give up.'));

    // ---- report line ----
    els.report.textContent = 'Bayesian A/B (Beta(' + inp.a0 + ',' + inp.b0 + ') prior): A ' + inp.cA + '/' + inp.nA +
      ', B ' + inp.cB + '/' + inp.nB + '. P(B>A) = ' + pctB + '; expected loss ship B = ' + fmtLoss(r.lossChooseB) +
      ', ship A = ' + fmtLoss(r.lossChooseA) + '; lift ' + fmtPP(r.meanLift) + ' (' + lv + '% CrI ' +
      fmtPP(r.dLo) + ' to ' + fmtPP(r.dHi) + '); ' +
      (r.stop.canStop ? 'loss below the ' + thrTxt + ' threshold, ship ' + lead + '.' : 'loss above the ' + thrTxt + ' threshold, keep running.');

    // ---- how it is computed, with live numbers ----
    els.h1c.innerHTML = 'The prior Beta(' + inp.a0 + ', ' + inp.b0 + ') meets the data. A saw ' + inp.cA +
      ' conversions in ' + inp.nA + ' visitors, so its posterior is <code>Beta(' + inp.a0 + '+' + inp.cA + ', ' +
      inp.b0 + '+' + (inp.nA - inp.cA) + ')</code> = <code>Beta(' + r.a1 + ', ' + r.b1 +
      ')</code>. B gives <code>Beta(' + r.a2 + ', ' + r.b2 + ')</code>. Conjugacy makes the update plain addition.';
    els.h2c.innerHTML = 'P(B beats A) sweeps B\'s posterior and asks, at each rate B might have, how much of A\'s posterior sits below it: ' +
      '<code>&#8747; f<sub>B</sub>(b) F<sub>A</sub>(b) db</code> = <b>' + pctB + '</b>.';
    els.h3c.innerHTML = 'Expected loss of shipping ' + lead + ' averages the shortfall over only the worlds where ' + lead +
      ' is the wrong pick: <code>E[max(p<sub>' + other + '</sub> &minus; p<sub>' + lead + '</sub>, 0)]</code> = <b>' +
      fmtLoss(r.stop.lossLeader) + '</b>. The mirror image, shipping ' + other + ', risks ' + fmtLoss(r.stop.lossOther) +
      '. The two always differ by exactly the gap in posterior means, ' + fmtPP(r.meanLift) + '.';

    // ---- R ----
    els.rcodepre.textContent = rCode(inp, r);
    if (window.RSyntaxHighlight) try { window.RSyntaxHighlight(els.rcodepre); } catch (e) {}
  }

  // ---- scenarios --------------------------------------------------------

  var SCEN = {
    typical:     { cA: 1200, nA: 10000, cB: 1260, nB: 10000, prior: '1,1', thr: 0.1 },
    winner:      { cA: 100,  nA: 10000, cB: 300,  nB: 10000, prior: '1,1', thr: 0.1 },
    early:       { cA: 8,    nA: 150,   cB: 12,   nB: 150,   prior: '1,1', thr: 0.1 },
    deadheat:    { cA: 1000, nA: 20000, cB: 1000, nB: 20000, prior: '1,1', thr: 0.1 },
    losing:      { cA: 300,  nA: 5000,  cB: 240,  nB: 5000,  prior: '1,1', thr: 0.1 },
    strongprior: { cA: 6,    nA: 20,    cB: 12,   nB: 20,    prior: 'custom', a0: 100, b0: 100, thr: 0.1 }
  };

  function loadScen(k) {
    var s = SCEN[k];
    if (!s) return;
    els.cA.value = s.cA; els.nA.value = s.nA; els.cB.value = s.cB; els.nB.value = s.nB;
    els.thr.value = s.thr;
    els.prior.value = s.prior;
    if (s.prior === 'custom') { els.a0.value = s.a0; els.b0.value = s.b0; }
    render();
  }

  // ---- wiring -----------------------------------------------------------

  function touched() {
    if (!used) { used = true; if (window.RSTrack) window.RSTrack.use(); }
  }

  // analyze() is heavy (quadrature + interval inversion), so keystrokes are
  // coalesced rather than each one triggering a full recompute.
  var timer = null;
  function schedule() {
    touched();
    if (timer) clearTimeout(timer);
    timer = setTimeout(function () { timer = null; render(); }, 90);
  }

  ['cA', 'nA', 'cB', 'nB', 'thr', 'a0', 'b0'].forEach(function (id) {
    els[id].addEventListener('input', schedule);
  });
  ['lev', 'prior'].forEach(function (id) {
    els[id].addEventListener('change', function () { touched(); render(); });
  });
  document.querySelectorAll('.mode').forEach(function (b) {
    b.addEventListener('click', function () { touched(); setMode(b.dataset.mode); });
  });
  document.querySelectorAll('.chip').forEach(function (b) {
    b.addEventListener('click', function () { touched(); loadScen(b.dataset.scen); });
  });

  function copy(text, btn, what) {
    var done = function () {
      var o = btn.textContent;
      btn.textContent = 'Copied';
      setTimeout(function () { btn.textContent = o; }, 1400);
      if (window.RSTrack) window.RSTrack.copy(what);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, done);
    } else {
      var ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta); done();
    }
  }
  els.copybtn.addEventListener('click', function () {
    copy(els.report.textContent, els.copybtn, 'report');
  });
  els.rcopy.addEventListener('click', function () {
    copy(els.rcodepre.textContent, els.rcopy, 'rcode');
  });

  els.hint.textContent = 'The threshold of caring is the most conversion rate you would shrug off to stop today. Pick it before you look.';
  setIwant();
  render();
})();
