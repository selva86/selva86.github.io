/* sample-size-t-math.js
 * Sample size for t tests: one-sample, two-sample (independent), paired.
 *
 * COMPOSES tools/lib/power-math.js - no primitives are redefined here and
 * power-math.js is not edited (it is shared by power-analysis, effect-size-converter
 * and type-i-ii-error-visualizer).
 *
 * Convention: pwr::pwr.t.test - a two-sided test counts BOTH rejection tails.
 * stats::power.t.test defaults to strict=FALSE (upper tail only) and returns a
 * slightly different n; it matches this tool only with strict=TRUE.
 * Verified against pwr.t.test / pwr.t2n.test / power.t.test(strict=TRUE), R 4.6.0.
 *
 * Mode -> R mapping
 *   one    : pwr.t.test(type="one.sample")   ncp = d*sqrt(n),           df = n-1
 *   paired : pwr.t.test(type="paired")       ncp = dz*sqrt(n_pairs),    df = n-1
 *            (identical to one-sample; d is the effect size OF THE DIFFERENCES)
 *   two    : pwr.t.test(type="two.sample") / pwr.t2n.test
 *            ncp = d*sqrt(n1*n2/(n1+n2)),    df = n1+n2-2
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./power-math.js'));
  } else {
    root.SampleSizeTMath = factory(root.PowerMath);
  }
}(typeof self !== 'undefined' ? self : this, function (PM) {
  'use strict';

  var MODES = ['one', 'two', 'paired'];
  function tailNum(tail) { return (tail === 1 || tail === 'one' || tail === 'one-sided') ? 1 : 2; }

  // ------------------------------------------------------------
  // Cohen's d from means + SDs (the "show the computation" path)
  // ------------------------------------------------------------
  // one    : d  = (mean - mu0) / sd
  // two    : d  = (m1 - m2) / sqrt((s1^2 + s2^2)/2)
  //          equal-n planning pooled SD. At design time there are no group n's yet,
  //          so the usual (n-1)-weighted pool degenerates to the simple RMS of the
  //          two SDs. Stated on the page rather than hidden.
  // paired : dz = mean_diff / sd_diff   (SD of the DIFFERENCES, not of the raw scores)
  function dFromMeans(mode, p) {
    var d, steps = [];
    if (mode === 'one') {
      var sd = +p.sd;
      if (!(sd > 0)) return { d: NaN, steps: [], error: 'SD must be greater than 0.' };
      d = (+p.mean - +p.mu0) / sd;
      steps.push({ label: 'Raw difference', expr: 'mean &minus; &mu;<sub>0</sub>',
        calc: fmt(+p.mean) + ' &minus; ' + fmt(+p.mu0) + ' = ' + fmt(+p.mean - +p.mu0) });
      steps.push({ label: "Cohen's d", expr: '(mean &minus; &mu;<sub>0</sub>) / SD',
        calc: fmt(+p.mean - +p.mu0) + ' / ' + fmt(sd) + ' = ' + fmt(d, 4) });
    } else if (mode === 'two') {
      var s1 = +p.sd1, s2 = +p.sd2;
      if (!(s1 > 0) || !(s2 > 0)) return { d: NaN, steps: [], error: 'Both SDs must be greater than 0.' };
      var sp = Math.sqrt((s1 * s1 + s2 * s2) / 2);
      d = (+p.mean1 - +p.mean2) / sp;
      steps.push({ label: 'Raw difference', expr: 'mean<sub>1</sub> &minus; mean<sub>2</sub>',
        calc: fmt(+p.mean1) + ' &minus; ' + fmt(+p.mean2) + ' = ' + fmt(+p.mean1 - +p.mean2) });
      steps.push({ label: 'Pooled SD', expr: '&radic;((SD<sub>1</sub>&sup2; + SD<sub>2</sub>&sup2;) / 2)',
        calc: '&radic;((' + fmt(s1) + '&sup2; + ' + fmt(s2) + '&sup2;) / 2) = ' + fmt(sp, 4) });
      steps.push({ label: "Cohen's d", expr: 'difference / pooled SD',
        calc: fmt(+p.mean1 - +p.mean2) + ' / ' + fmt(sp, 4) + ' = ' + fmt(d, 4) });
    } else {
      var sdd = +p.sdDiff;
      if (!(sdd > 0)) return { d: NaN, steps: [], error: 'SD of the differences must be greater than 0.' };
      d = (+p.meanDiff) / sdd;
      steps.push({ label: 'Mean difference', expr: 'mean of the paired differences',
        calc: fmt(+p.meanDiff) });
      steps.push({ label: "Cohen's d<sub>z</sub>", expr: 'mean difference / SD of the differences',
        calc: fmt(+p.meanDiff) + ' / ' + fmt(sdd) + ' = ' + fmt(d, 4) });
    }
    return { d: d, steps: steps };
  }

  function fmt(x, dp) {
    if (!isFinite(x)) return String(x);
    if (dp == null) dp = 4;
    var r = Math.round(x * 1e6) / 1e6;
    if (Number.isInteger(r)) return String(r);
    return String(parseFloat(x.toFixed(dp)));
  }

  // ------------------------------------------------------------
  // Power at a given n  (n = per group for two-sample; n = pairs for paired)
  // ------------------------------------------------------------
  function powerAt(mode, p) {
    var d = Math.abs(+p.d), t = tailNum(p.tail), a = +p.alpha, n = +p.n;
    if (!(d >= 0) || !(a > 0 && a < 1)) return NaN;
    if (mode === 'two') {
      var k = (+p.ratio > 0) ? +p.ratio : 1;
      return PM.powerTwoSampleT(d, n, a, t, k);
    }
    // paired is the one-sample formula on d_z, with n = number of pairs
    return PM.powerOneSampleT(d, n, a, t);
  }

  // power at an explicit integer pair (n1, n2) - drives "achieved power" after rounding up
  function powerAtPair(n1, n2, p) {
    var d = Math.abs(+p.d), t = tailNum(p.tail), a = +p.alpha;
    if (!(n1 >= 2) || !(n2 >= 2)) return NaN;
    return PM.powerTwoSampleT(d, n1, a, t, n2 / n1);
  }

  // ------------------------------------------------------------
  // Solve for n
  // ------------------------------------------------------------
  // Returns the exact fractional n (what pwr prints) AND the integer plan you
  // would actually run, plus the power that integer plan really achieves.
  function solveSampleSize(mode, p) {
    var d = Math.abs(+p.d), t = tailNum(p.tail), a = +p.alpha, target = +p.power;
    if (!(d > 0)) return { error: "Cohen's d must be greater than 0." };
    if (!(a > 0 && a < 1)) return { error: 'Alpha must be between 0 and 1.' };
    if (!(target > 0 && target < 1)) return { error: 'Power must be between 0 and 1.' };
    if (target <= a) return { error: 'Power must exceed alpha, otherwise the test is no better than chance.' };

    var res = { mode: mode, d: d, alpha: a, power: target, tail: t };

    if (mode === 'two') {
      var k = (+p.ratio > 0) ? +p.ratio : 1;
      res.ratio = k;
      var n1 = PM.solveN('twoT', { effect: d, alpha: a, tail: t, ratio: k }, target);
      if (!isFinite(n1)) return { error: 'That combination needs an impractically large sample.' };
      res.nExact = n1;
      res.n2Exact = n1 * k;
      res.n1 = Math.ceil(n1 - 1e-9);
      res.n2 = Math.ceil(res.n1 * k - 1e-9);
      if (res.n1 < 2) res.n1 = 2;
      if (res.n2 < 2) res.n2 = 2;
      res.total = res.n1 + res.n2;
      res.achieved = powerAtPair(res.n1, res.n2, { d: d, alpha: a, tail: t });
      res.df = res.n1 + res.n2 - 2;
      res.ncp = d * Math.sqrt(res.n1 * res.n2 / (res.n1 + res.n2));
    } else {
      var n = PM.solveN('oneT', { effect: d, alpha: a, tail: t }, target);
      if (!isFinite(n)) return { error: 'That combination needs an impractically large sample.' };
      res.nExact = n;
      res.n1 = Math.max(2, Math.ceil(n - 1e-9));
      res.total = res.n1;
      res.achieved = PM.powerOneSampleT(d, res.n1, a, t);
      res.df = res.n1 - 1;
      res.ncp = d * Math.sqrt(res.n1);
    }
    return res;
  }

  // ------------------------------------------------------------
  // Curves for the what-if teaching panel
  // ------------------------------------------------------------
  // power as a function of n (per group), at the current d/alpha/tail
  function powerCurve(mode, p, nMax, points) {
    var pts = [], m = nMax || 120, k = points || 60;
    for (var i = 0; i < k; i++) {
      var n = 2 + (m - 2) * (i / (k - 1));
      var pw = powerAt(mode, { d: p.d, alpha: p.alpha, tail: p.tail, ratio: p.ratio, n: n });
      pts.push({ n: n, power: isFinite(pw) ? pw : 0 });
    }
    return pts;
  }
  // required n as a function of d - the "n explodes as d shrinks" lesson
  function nVsD(mode, p, dMin, dMax, points) {
    var pts = [], k = points || 40;
    for (var i = 0; i < k; i++) {
      var d = dMin + (dMax - dMin) * (i / (k - 1));
      var r = solveSampleSize(mode, { d: d, alpha: p.alpha, power: p.power, tail: p.tail, ratio: p.ratio });
      pts.push({ d: d, n: r.error ? NaN : r.n1 });
    }
    return pts;
  }

  // ------------------------------------------------------------
  // Cohen's benchmarks - taught with the caveat, never as a verdict
  // ------------------------------------------------------------
  function benchmark(d) {
    var a = Math.abs(d);
    if (a < 0.2) return { label: 'below small', note: 'smaller than Cohen&rsquo;s smallest benchmark' };
    if (a < 0.5) return { label: 'small', note: 'around Cohen&rsquo;s small benchmark (0.2)' };
    if (a < 0.8) return { label: 'medium', note: 'around Cohen&rsquo;s medium benchmark (0.5)' };
    return { label: 'large', note: 'at or above Cohen&rsquo;s large benchmark (0.8)' };
  }

  return {
    MODES: MODES,
    dFromMeans: dFromMeans,
    powerAt: powerAt,
    powerAtPair: powerAtPair,
    solveSampleSize: solveSampleSize,
    powerCurve: powerCurve,
    nVsD: nVsD,
    benchmark: benchmark,
    _pm: PM
  };
}));
