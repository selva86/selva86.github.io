/* multiplicity-sim.js - the multiple-comparisons problem, simulated in front of the reader.
 *
 * Runs `nStudies` simulated studies in which NOTHING is real: every one of the k tests
 * is run under a true null, so every significant result is by definition a false positive.
 * The reader drags k and watches the share of studies with at least one p < alpha climb
 * away from alpha and track the theoretical family-wise error rate 1 - (1 - alpha)^k.
 * Switching the correction on collapses that share back to alpha.
 *
 * Why uniform draws are the honest model, not a shortcut: for a test with a continuous
 * statistic, the p-value under a true null IS Uniform(0, 1). Drawing runif(k) and running
 * k t-tests on pure noise are the same experiment; the uniform version just skips the
 * arithmetic. The lesson proves this before the widget is used.
 *
 * The exact-threshold identity used for the curves: Bonferroni rejects something iff
 * k * p_min < alpha, and Holm's first step is the same comparison, so under a global
 * null the two procedures have IDENTICAL family-wise error. Both curves therefore come
 * from one running minimum, which is exact, not an approximation. The per-test adjusted
 * values shown for the representative study are computed with the real step-down
 * procedure, where Holm and Bonferroni genuinely differ.
 *
 * cfg: {
 *   kMax: 50,            // slider maximum (number of tests in the family)
 *   kStart: 1,           // slider starting value
 *   alpha: 0.05,         // per-test significance level
 *   nStudies: 4000,      // simulated studies behind every plotted point
 *   corrections: ["none","bonferroni","holm"],   // which buttons to offer
 *   seed: 29,            // mulberry32 seed - same config always draws the same picture
 *   study: 1             // which simulated study to show test-by-test (1-based)
 * }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  var LABEL = { none: 'No correction', bonferroni: 'Bonferroni', holm: 'Holm' };
  // White halo so a label stays legible where it crosses a plotted line.
  var HALO = 'stroke="#fff" stroke-width="3" paint-order="stroke" stroke-linejoin="round"';

  /* Real Benjamini-style step-down adjustment, used for the one study shown test by
     test. Returns adjusted p-values in the ORIGINAL order. */
  function adjust(p, method) {
    var k = p.length, i;
    if (method === 'none') return p.slice();
    if (method === 'bonferroni') {
      var b = [];
      for (i = 0; i < k; i++) b.push(Math.min(1, k * p[i]));
      return b;
    }
    // Holm: sort ascending, multiply the i-th smallest by (k - i), enforce monotonicity.
    var order = p.map(function (v, ix) { return { v: v, ix: ix }; })
                 .sort(function (a, b2) { return a.v - b2.v; });
    var out = new Array(k), running = 0;
    for (i = 0; i < k; i++) {
      var val = Math.min(1, (k - i) * order[i].v);
      running = Math.max(running, val);            // adjusted p-values never decrease
      out[order[i].ix] = running;
    }
    return out;
  }

  function mount(el, cfg) {
    cfg = cfg || {};
    var kMax = Math.max(2, +cfg.kMax || 50);
    var alpha = +cfg.alpha || 0.05;
    var nStudies = Math.max(200, +cfg.nStudies || 4000);
    var seed = (cfg.seed == null ? 29 : +cfg.seed);
    var studyIx = Math.max(0, (+cfg.study || 1) - 1);
    var modes = (cfg.corrections && cfg.corrections.length ? cfg.corrections : ['none', 'bonferroni', 'holm'])
                  .filter(function (m) { return LABEL[m]; });
    if (!modes.length) modes = ['none'];
    var mode = modes[0];
    var k = Math.min(kMax, Math.max(1, +cfg.kStart || 1));

    /* ---- one deterministic pool of null p-values: nStudies rows, kMax columns ----
       Growing k adds tests to the SAME studies, which is exactly what happens when a
       researcher measures more outcomes on one dataset. */
    var rnd = mulberry32(seed);
    var pool = new Float64Array(nStudies * kMax);
    for (var s = 0; s < nStudies; s++)
      for (var j = 0; j < kMax; j++) pool[s * kMax + j] = rnd();

    /* ---- family-wise error rate at every k, for every mode, computed once ----
       runMin[s] is the smallest p-value study s has seen so far. */
    var curves = { none: new Array(kMax), bonferroni: new Array(kMax), holm: new Array(kMax) };
    var runMin = new Float64Array(nStudies);
    for (var i = 0; i < nStudies; i++) runMin[i] = 1;
    for (var kk = 1; kk <= kMax; kk++) {
      var hitRaw = 0, hitAdj = 0, cut = alpha / kk;
      for (var t = 0; t < nStudies; t++) {
        var v = pool[t * kMax + (kk - 1)];
        if (v < runMin[t]) runMin[t] = v;
        if (runMin[t] < alpha) hitRaw++;
        if (runMin[t] < cut) hitAdj++;
      }
      curves.none[kk - 1] = hitRaw / nStudies;
      curves.bonferroni[kk - 1] = hitAdj / nStudies;
      curves.holm[kk - 1] = hitAdj / nStudies;
    }

    /* ---- chrome ---- */
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      (modes.length > 1
        ? '<div class="ms-seg" style="margin-bottom:12px">' +
            u.seg(modes.map(function (m) { return { v: m, label: LABEL[m] }; }), mode) + '</div>'
        : '') +
      '<label class="ms-klab" style="display:block;font:600 12.5px/1.5 IBM Plex Sans,sans-serif;color:' + P.mut + ';margin-bottom:5px"></label>' +
      '<input class="ms-k" type="range" min="1" max="' + kMax + '" step="1" value="' + k + '" style="width:100%;max-width:460px;display:block;margin-bottom:12px">' +
      '<div class="ms-plot"></div>' +
      '<div class="ms-read" style="font:13px/1.6 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:10px 0 14px"></div>' +
      u.runnable(rcode(alpha), { label: 'The same simulation in R' });

    var plot = el.querySelector('.ms-plot'),
        read = el.querySelector('.ms-read'),
        klab = el.querySelector('.ms-klab'),
        slider = el.querySelector('.ms-k');

    var W = 460, H = 322;
    var m1 = { t: 18, r: 14, b: 30, l: 42 }, h1 = 150;          // top panel: FWER vs k
    var m2 = { t: h1 + 78, r: 14, b: 26, l: 42 }, h2 = 54;      // bottom panel: one study

    function sxK(kv) { return m1.l + (kv - 1) / Math.max(1, kMax - 1) * (W - m1.l - m1.r); }
    function syR(r) { return m1.t + (1 - r) * h1; }
    function sxP(pv) { return m2.l + pv * (W - m2.l - m2.r); }

    function fmtPct(x) { return (100 * x).toFixed(1) + '%'; }

    function draw() {
      var rate = curves[mode][k - 1];
      var theory = 1 - Math.pow(1 - alpha, k);
      var thresh = (mode === 'none') ? alpha : alpha / k;

      /* --- top panel: the curve --- */
      var g = '';
      // gridlines + y labels
      [0, 0.25, 0.5, 0.75, 1].forEach(function (r) {
        g += '<line x1="' + m1.l + '" y1="' + syR(r).toFixed(1) + '" x2="' + (W - m1.r) + '" y2="' + syR(r).toFixed(1) +
             '" stroke="' + P.line2 + '"/>' +
             '<text x="' + (m1.l - 6) + '" y="' + (syR(r) + 3).toFixed(1) + '" text-anchor="end" ' +
             'font-family="IBM Plex Mono,monospace" font-size="9" fill="' + P.mut + '">' + (100 * r) + '%</text>';
      });
      // alpha reference (labelled on the LEFT so it never collides with the k marker)
      g += '<line x1="' + m1.l + '" y1="' + syR(alpha).toFixed(1) + '" x2="' + (W - m1.r) + '" y2="' + syR(alpha).toFixed(1) +
           '" stroke="' + P.acc + '" stroke-width="1" stroke-dasharray="3 3"/>' +
           '<text x="' + (m1.l + 4) + '" y="' + (syR(alpha) - 5).toFixed(1) + '" ' +
           'font-family="IBM Plex Sans,sans-serif" font-size="9.5" fill="' + P.acc + '" ' + HALO + '>alpha = ' + alpha + '</text>';
      // theoretical uncorrected curve (always shown, so the correction is measured against it)
      var th = [];
      for (var a = 1; a <= kMax; a++) th.push(sxK(a).toFixed(1) + ',' + syR(1 - Math.pow(1 - alpha, a)).toFixed(1));
      g += '<polyline points="' + th.join(' ') + '" fill="none" stroke="' + P.faint + '" stroke-width="1.5" stroke-dasharray="4 3"/>';
      // simulated curve for the current mode
      var sim = [];
      for (var b2 = 1; b2 <= kMax; b2++) sim.push(sxK(b2).toFixed(1) + ',' + syR(curves[mode][b2 - 1]).toFixed(1));
      g += '<polyline points="' + sim.join(' ') + '" fill="none" stroke="' + (mode === 'none' ? P.bad : P.c0) + '" stroke-width="2.5"/>';
      // marker at the current k
      g += '<line x1="' + sxK(k).toFixed(1) + '" y1="' + m1.t + '" x2="' + sxK(k).toFixed(1) + '" y2="' + (m1.t + h1) +
           '" stroke="' + P.line + '" stroke-dasharray="2 3"/>' +
           '<circle cx="' + sxK(k).toFixed(1) + '" cy="' + syR(rate).toFixed(1) + '" r="5" fill="' + (mode === 'none' ? P.bad : P.c0) + '"/>';
      // Label on whichever side of the marker has room, above the dot unless it is near the top.
      var lateK = k > kMax * 0.62;
      g += '<text x="' + (lateK ? sxK(k) - 9 : sxK(k) + 9).toFixed(1) + '" y="' + Math.max(m1.t + 11, syR(rate) - 10).toFixed(1) + '" ' +
           'text-anchor="' + (lateK ? 'end' : 'start') + '" font-family="IBM Plex Mono,monospace" font-size="12" ' +
           'font-weight="700" fill="' + (mode === 'none' ? P.bad : P.c0) + '" ' + HALO + '>' + fmtPct(rate) + '</text>';
      // axes
      g += '<line x1="' + m1.l + '" y1="' + (m1.t + h1) + '" x2="' + (W - m1.r) + '" y2="' + (m1.t + h1) + '" stroke="' + P.line + '" stroke-width="1.5"/>';
      [1, Math.round(kMax / 2), kMax].forEach(function (kv) {
        g += '<text x="' + sxK(kv).toFixed(1) + '" y="' + (m1.t + h1 + 14) + '" text-anchor="middle" ' +
             'font-family="IBM Plex Mono,monospace" font-size="9" fill="' + P.mut + '">' + kv + '</text>';
      });
      g += '<text x="' + ((m1.l + W - m1.r) / 2) + '" y="' + (m1.t + h1 + 26) + '" text-anchor="middle" ' +
           'font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.mut + '">k, number of tests in the family</text>';
      g += '<text x="' + m1.l + '" y="' + (m1.t - 6) + '" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.ink +
           '">Studies with at least one false positive</text>';

      /* --- bottom panel: one study, test by test --- */
      var raw = [], ix;
      for (ix = 0; ix < k; ix++) raw.push(pool[studyIx * kMax + ix]);
      var adj = adjust(raw, mode);
      var nHit = 0;
      for (ix = 0; ix < k; ix++) if (adj[ix] < alpha) nHit++;

      g += '<text x="' + m2.l + '" y="' + (m2.t - 12) + '" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.ink +
           '">One of those studies: its ' + k + ' p-value' + (k === 1 ? '' : 's') + '</text>';
      // the region that counts as significant
      g += '<rect x="' + m2.l + '" y="' + m2.t + '" width="' + Math.max(0.6, sxP(thresh) - m2.l).toFixed(2) + '" height="' + h2 +
           '" fill="' + P.del + '"/>' +
           '<line x1="' + sxP(thresh).toFixed(2) + '" y1="' + m2.t + '" x2="' + sxP(thresh).toFixed(2) + '" y2="' + (m2.t + h2) +
           '" stroke="' + P.bad + '" stroke-width="1.5"/>';
      // one tick per test, at its raw p-value
      for (ix = 0; ix < k; ix++) {
        var hit = adj[ix] < alpha;
        g += '<line x1="' + sxP(raw[ix]).toFixed(2) + '" y1="' + (m2.t + 6) + '" x2="' + sxP(raw[ix]).toFixed(2) + '" y2="' + (m2.t + h2 - 6) +
             '" stroke="' + (hit ? P.bad : P.mut) + '" stroke-width="' + (hit ? 2.5 : 1.2) + '" stroke-opacity="' + (hit ? 1 : 0.55) + '"/>';
      }
      g += '<line x1="' + m2.l + '" y1="' + (m2.t + h2) + '" x2="' + (W - m2.r) + '" y2="' + (m2.t + h2) + '" stroke="' + P.line + '" stroke-width="1.5"/>';
      [0, 0.25, 0.5, 0.75, 1].forEach(function (pv) {
        g += '<text x="' + sxP(pv).toFixed(1) + '" y="' + (m2.t + h2 + 14) + '" text-anchor="middle" ' +
             'font-family="IBM Plex Mono,monospace" font-size="9" fill="' + P.mut + '">' + pv + '</text>';
      });
      g += '<text x="' + (W - m2.r) + '" y="' + (m2.t - 12) + '" text-anchor="end" font-family="IBM Plex Mono,monospace" ' +
           'font-size="10" fill="' + (nHit ? P.bad : P.mut) + '">' + nHit + ' called significant</text>';

      plot.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W +
        'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Family-wise false positive rate against the number of tests, with one study shown test by test">' +
        g + '</svg>';

      klab.innerHTML = 'k = <b style="color:' + P.ink + '">' + k + '</b> test' + (k === 1 ? '' : 's') + ' in the family';

      var thTxt = '1 &minus; (1 &minus; ' + alpha + ')<sup>' + k + '</sup> = <b>' + fmtPct(theory) + '</b>';
      if (mode === 'none') {
        read.innerHTML = 'Across <b>' + nStudies.toLocaleString() + '</b> simulated studies with no real effect anywhere, ' +
          '<b style="color:' + P.bad + '">' + fmtPct(rate) + '</b> produced at least one p-value below ' + alpha +
          '. Every one of those is a false positive. The formula predicts ' + thTxt + '.' +
          (k === 1 ? ' With a single test the rate is just alpha, which is the risk you agreed to.' : '');
      } else {
        read.innerHTML = LABEL[mode] + ' judges each test against <b>' + alpha + ' / ' + k + ' = ' +
          (alpha / k).toPrecision(2) + '</b> instead of ' + alpha + '. That drops the share of studies with any false positive to ' +
          '<b style="color:' + P.c0 + '">' + fmtPct(rate) + '</b>, back at alpha, while the uncorrected rate (dashed) sits at ' + fmtPct(theory) + '. ' +
          'Holm and Bonferroni give the SAME number here: when nothing is real, both reject something only if the smallest p-value clears alpha / k.';
      }
    }

    if (modes.length > 1) u.wireSeg(el.querySelector('.ms-seg'), function (v) { mode = v; draw(); });
    slider.addEventListener('input', function () { k = +slider.value; draw(); });
    draw();
  }

  function rcode(alpha) {
    return [
      '# Run many studies in which NOTHING is real, and count how often at least one',
      '# of the k tests comes back "significant". Change k and run it again.',
      'set.seed(11)',
      'alpha <- ' + alpha,
      'k     <- 14        # tests in the family',
      'sims  <- 4000      # simulated studies',
      '',
      '# Under a true null a p-value is Uniform(0, 1), so runif(k) IS k null tests.',
      'any_hit <- function(k) {',
      '  p <- runif(k)',
      '  c(none = min(p) < alpha,',
      '    bonferroni = min(p.adjust(p, method = "bonferroni")) < alpha,',
      '    holm       = min(p.adjust(p, method = "holm")) < alpha)',
      '}',
      '',
      'round(colMeans(t(replicate(sims, any_hit(k)))), 3)',
      'round(1 - (1 - alpha)^k, 3)   # what the formula predicts for the uncorrected case'
    ].join('\n');
  }

  window.LessonWidgets.register('multiplicity-sim', mount);
})();
