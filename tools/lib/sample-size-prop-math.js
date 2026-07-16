/* sample-size-prop-math.js
 * Sample size for proportion tests: one proportion vs a reference, and two
 * proportions (A/B style), with allocation ratios.
 *
 * COMPOSES tools/lib/power-math.js. No primitive is redefined here and
 * power-math.js is NOT edited - it is shared by power-analysis,
 * effect-size-converter, type-i-ii-error-visualizer and sample-size-t-test.
 * PM supplies: cohenH, powerOneProp, powerTwoProp, pnorm, qnorm, solveN.
 *
 * Two legitimate answers, kept separate on purpose
 * ------------------------------------------------
 *   ARCSINE (pwr)      - works on Cohen's h = 2asin(sqrt(p1)) - 2asin(sqrt(p2)).
 *                        The arcsine transform stabilises the variance, so one
 *                        formula covers the whole 0..1 range.
 *   NORMAL (power.prop.test) - works on the raw p scale with p(1-p) variance.
 *
 * They agree near p = 0.5 and drift apart towards 0 and 1, which is exactly
 * where the raw-scale variance assumption is worst. Verified, R 4.6.0:
 *   0.50 -> 0.55  : 1565 vs 1565  (identical)
 *   0.05 -> 0.10  :  424 vs  435
 *   0.001 -> 0.002: 22840 vs 23511
 *
 * Tail conventions (the other reason the two disagree)
 * ----------------------------------------------------
 *   pwr's two.sided counts BOTH rejection tails.
 *   stats::power.prop.test defaults to strict = FALSE, which ignores the wrong
 *   tail. It matches pwr's convention only with strict = TRUE, which is why
 *   every power.prop.test line this tool emits passes strict = TRUE.
 *
 * ncp map (all verified against R)
 *   one    : pwr.p.test      ncp = h*sqrt(n)
 *   two    : pwr.2p.test     ncp = h*sqrt(n/2)              [equal n]
 *   two/k  : pwr.2p2n.test   ncp = h*sqrt(n1*n2/(n1+n2))    [any n1,n2]
 * Note h*sqrt(n1*n2/(n1+n2)) collapses to h*sqrt(n/2) when n1 = n2 = n, so the
 * unequal-n path is used for every two-sample case and stays consistent with
 * pwr.2p.test at ratio 1. The harness asserts that identity.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./power-math.js'));
  } else {
    root.SampleSizePropMath = factory(root.PowerMath);
  }
}(typeof self !== 'undefined' ? self : this, function (PM) {
  'use strict';

  var MODES = ['two', 'one'];
  var METHODS = ['arcsine', 'normal'];

  function tailNum(tail) { return (tail === 1 || tail === 'one' || tail === 'one-sided') ? 1 : 2; }
  // upper tail via symmetry - pnorm(-x) stays accurate where 1 - pnorm(x) collapses
  function upper(x) { return PM.pnorm(-x); }

  function fmt(x, dp) {
    if (!isFinite(x)) return String(x);
    if (dp == null) dp = 4;
    var r = Math.round(x * 1e6) / 1e6;
    if (Number.isInteger(r)) return String(r);
    return String(parseFloat(x.toFixed(dp)));
  }

  // ------------------------------------------------------------
  // Cohen's h, with the arithmetic exposed for the steps panel
  // ------------------------------------------------------------
  // h = 2*asin(sqrt(p1)) - 2*asin(sqrt(p2))    (pwr::ES.h)
  function hFromProps(mode, p) {
    var a = +p.p1, b = (mode === 'one') ? +p.p0 : +p.p2;
    var aName = (mode === 'one') ? 'your expected proportion' : 'group 2';
    var bName = (mode === 'one') ? 'the reference value' : 'group 1';
    if (!(a >= 0 && a <= 1)) return { h: NaN, steps: [], error: 'Proportions must be between 0 and 1. Enter 0.05 for 5%, not 5.' };
    if (!(b >= 0 && b <= 1)) return { h: NaN, steps: [], error: 'Proportions must be between 0 and 1. Enter 0.05 for 5%, not 5.' };

    var phi1 = 2 * Math.asin(Math.sqrt(a));
    var phi2 = 2 * Math.asin(Math.sqrt(b));
    var h = phi1 - phi2;
    var steps = [
      { label: 'Angle-transform ' + aName, expr: '2 &times; arcsin(&radic;p)',
        calc: '2 &times; arcsin(&radic;' + fmt(a) + ') = ' + fmt(phi1, 6) },
      { label: 'Angle-transform ' + bName, expr: '2 &times; arcsin(&radic;p)',
        calc: '2 &times; arcsin(&radic;' + fmt(b) + ') = ' + fmt(phi2, 6) },
      { label: "Cohen's h", expr: 'the difference of the two angles',
        calc: fmt(phi1, 6) + ' &minus; ' + fmt(phi2, 6) + ' = ' + fmt(h, 6) },
      { label: 'Raw difference, for contrast', expr: 'p<sub>1</sub> &minus; p<sub>2</sub>',
        calc: fmt(a) + ' &minus; ' + fmt(b) + ' = ' + fmt(a - b) + ' (not used: it is not a stable effect size)' }
    ];
    return { h: h, steps: steps, phi1: phi1, phi2: phi2, raw: a - b };
  }

  // ------------------------------------------------------------
  // ARCSINE power (pwr family)
  // ------------------------------------------------------------
  // one sample: pwr.p.test   ncp = h*sqrt(n)
  function powerOne(h, n, alpha, tail) {
    return PM.powerOneProp(Math.abs(h), n, alpha, tailNum(tail));
  }
  // two sample, ANY n1/n2: pwr.2p2n.test   ncp = h*sqrt(n1*n2/(n1+n2))
  function powerPair(h, n1, n2, alpha, tail) {
    var t = tailNum(tail), a = +alpha, hh = Math.abs(h);
    if (!(n1 > 0) || !(n2 > 0)) return NaN;
    if (!(a > 0 && a < 1)) return NaN;
    var ncp = hh * Math.sqrt((n1 * n2) / (n1 + n2));
    if (t === 1) return upper(PM.qnorm(1 - a) - ncp);
    var zc = PM.qnorm(1 - a / 2);
    return upper(zc - ncp) + PM.pnorm(-zc - ncp);
  }

  // ------------------------------------------------------------
  // NORMAL approximation (stats::power.prop.test), transcribed from R
  // ------------------------------------------------------------
  function pptPower(p1, p2, n, alpha, tail, strict) {
    var tside = tailNum(tail);
    if (!(p1 >= 0 && p1 <= 1) || !(p2 >= 0 && p2 <= 1)) return NaN;
    if (!(n > 0) || !(alpha > 0 && alpha < 1)) return NaN;
    var qu = PM.qnorm(1 - alpha / tside);
    var d = Math.abs(p1 - p2);
    var pbar = (p1 + p2) / 2, qbar = 1 - pbar;
    var v1 = p1 * (1 - p1), v2 = p2 * (1 - p2);
    var sd = Math.sqrt(v1 + v2);
    if (!(sd > 0)) return NaN;            // p1 = p2 = 0 or 1: R gives NaN here too
    var s2 = Math.sqrt(2 * pbar * qbar);  // == sqrt((p1+p2)*(1-(p1+p2)/2))
    if (strict && tside === 2) {
      return PM.pnorm((Math.sqrt(n) * d - qu * s2) / sd) +
             upper((Math.sqrt(n) * d + qu * s2) / sd);
    }
    return PM.pnorm((Math.sqrt(n) * d - qu * s2) / sd);
  }

  // ------------------------------------------------------------
  // Root finding. Mirrors PM's rootMonotone but tightened well past
  // uniroot's default tol, because R's own n is only good to ~1e-4.
  // ------------------------------------------------------------
  function rootMonotone(f, lo, hi, target) {
    for (var i = 0; i < 300; i++) {
      var mid = 0.5 * (lo + hi), v = f(mid);
      if (v < target) lo = mid; else hi = mid;
      if ((hi - lo) <= Math.abs(hi) * 1e-13 + 1e-13) break;
    }
    return 0.5 * (lo + hi);
  }
  function solveMonotone(f, floor, target) {
    var lo = floor;
    if (f(lo) >= target) return lo;
    var hi = Math.max(lo * 2, 8);
    while (f(hi) < target) { hi *= 2; if (hi > 1e12) return Infinity; }
    return rootMonotone(f, lo, hi, target);
  }

  // ------------------------------------------------------------
  // Solve for n
  // ------------------------------------------------------------
  // Returns the exact fractional n (what pwr prints), the integer plan you would
  // actually run, and the power that integer plan really achieves.
  //
  // mode 'two': n is PER GROUP (group 1). ratio k = n2/n1.
  // mode 'one': n is the number of observations.
  function solveSampleSize(mode, p) {
    var h = Math.abs(+p.h), t = tailNum(p.tail), a = +p.alpha, target = +p.power;
    var method = (p.method === 'normal') ? 'normal' : 'arcsine';

    if (!(h > 0)) return { error: "Cohen's h must be greater than 0. Two identical proportions can never be told apart, at any sample size." };
    if (!(a > 0 && a < 1)) return { error: 'Alpha must be between 0 and 1.' };
    if (!(target > 0 && target < 1)) return { error: 'Power must be between 0 and 1.' };
    if (target <= a) return { error: 'Power must exceed alpha, otherwise the test is no better than chance.' };

    var res = { mode: mode, h: h, alpha: a, power: target, tail: t, method: method };

    if (mode === 'one') {
      var n = solveMonotone(function (x) { return powerOne(h, x, a, t); }, 2 + 1e-9, target);
      if (!isFinite(n)) return { error: 'That combination needs an impractically large sample.' };
      res.nExact = n;
      res.n1 = Math.max(2, Math.ceil(n - 1e-9));
      res.total = res.n1;
      res.achieved = powerOne(h, res.n1, a, t);
      res.ncp = h * Math.sqrt(res.n1);
      return res;
    }

    var k = (+p.ratio > 0) ? +p.ratio : 1;
    res.ratio = k;

    if (method === 'normal') {
      // power.prop.test is an equal-n, raw-proportion routine. It has no h and no
      // allocation ratio, so this path is only offered when both are available.
      var p1 = +p.p1, p2 = +p.p2;
      var nn = solveMonotone(function (x) { return pptPower(p1, p2, x, a, t, true); }, 1 + 1e-9, target);
      if (!isFinite(nn)) return { error: 'That combination needs an impractically large sample.' };
      res.nExact = nn;
      res.n2Exact = nn;
      res.n1 = Math.max(2, Math.ceil(nn - 1e-9));
      res.n2 = res.n1;
      res.total = res.n1 + res.n2;
      res.achieved = pptPower(p1, p2, res.n1, a, t, true);
      res.ncp = h * Math.sqrt(res.n1 / 2);
      return res;
    }

    var n1 = solveMonotone(function (x) { return powerPair(h, x, x * k, a, t); }, 2 + 1e-9, target);
    if (!isFinite(n1)) return { error: 'That combination needs an impractically large sample.' };
    res.nExact = n1;
    res.n2Exact = n1 * k;
    res.n1 = Math.max(2, Math.ceil(n1 - 1e-9));
    res.n2 = Math.max(2, Math.ceil(res.n1 * k - 1e-9));
    res.total = res.n1 + res.n2;
    res.achieved = powerPair(h, res.n1, res.n2, a, t);
    res.ncp = h * Math.sqrt(res.n1 * res.n2 / (res.n1 + res.n2));
    return res;
  }

  // power at an arbitrary n, for the what-if slider and the curve
  function powerAt(mode, p) {
    var h = Math.abs(+p.h), t = tailNum(p.tail), a = +p.alpha, n = +p.n;
    if (mode === 'one') return powerOne(h, n, a, t);
    if (p.method === 'normal') return pptPower(+p.p1, +p.p2, n, a, t, true);
    var k = (+p.ratio > 0) ? +p.ratio : 1;
    return powerPair(h, n, n * k, a, t);
  }

  // ------------------------------------------------------------
  // Teaching curves
  // ------------------------------------------------------------
  function powerCurve(mode, p, nMax, points) {
    var pts = [], m = nMax || 120, k = points || 60, floor = (mode === 'one') ? 2 : 2;
    for (var i = 0; i < k; i++) {
      var n = floor + (m - floor) * (i / (k - 1));
      var pw = powerAt(mode, { h: p.h, alpha: p.alpha, tail: p.tail, ratio: p.ratio, n: n, method: p.method, p1: p.p1, p2: p.p2 });
      pts.push({ n: n, power: isFinite(pw) ? pw : 0 });
    }
    return pts;
  }

  // THE lesson: hold the absolute difference fixed, sweep the baseline.
  // Required n peaks where the two proportions straddle 0.5, because the
  // binomial variance p(1-p) peaks there.
  function baselineCurve(diff, p, points) {
    var pts = [], k = points || 60, d = Math.abs(diff);
    if (!(d > 0) || d >= 1) return pts;
    var lo = 0.001, hi = 1 - d - 0.001;
    if (hi <= lo) return pts;
    for (var i = 0; i < k; i++) {
      var b = lo + (hi - lo) * (i / (k - 1));
      var h = Math.abs(PM.cohenH(b + d, b));
      var r = solveSampleSize('two', { h: h, alpha: p.alpha, power: p.power, tail: p.tail, ratio: 1, method: 'arcsine' });
      pts.push({ baseline: b, h: h, n: r.error ? NaN : r.n1 });
    }
    return pts;
  }

  // ------------------------------------------------------------
  // Cohen's benchmarks for h - taught with the caveat, never as a verdict
  // ------------------------------------------------------------
  function benchmark(h) {
    var a = Math.abs(h);
    if (a < 0.2) return { label: 'below small', note: 'smaller than Cohen&rsquo;s smallest benchmark for h (0.2)' };
    if (a < 0.5) return { label: 'small', note: 'around Cohen&rsquo;s small benchmark for h (0.2)' };
    if (a < 0.8) return { label: 'medium', note: 'around Cohen&rsquo;s medium benchmark for h (0.5)' };
    return { label: 'large', note: 'at or above Cohen&rsquo;s large benchmark for h (0.8)' };
  }

  return {
    MODES: MODES,
    METHODS: METHODS,
    hFromProps: hFromProps,
    cohenH: PM.cohenH,
    powerOne: powerOne,
    powerPair: powerPair,
    pptPower: pptPower,
    powerAt: powerAt,
    solveSampleSize: solveSampleSize,
    powerCurve: powerCurve,
    baselineCurve: baselineCurve,
    benchmark: benchmark,
    _pm: PM
  };
}));
