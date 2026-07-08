/* ci-math.js - confidence-interval math for Tool Farm v2.
   Ground truth: R 4.6.0 t.test / prop.test(correct=FALSE) / binom.test
   (see Scripts/tool-truth/confidence-interval.json).
   Depends on ttest-math.js (t quantile) and normal-math.js (qnorm) when in
   the browser; in Node the factory receives them via require. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./ttest-math.js'), require('./normal-math.js'));
  } else {
    root.CIMath = factory(root.TTestMath, root.NormalMath);
  }
}(typeof self !== 'undefined' ? self : this, function (T, N) {
  'use strict';

  // ---- mean CI (t-based), matches t.test()$conf.int ----
  function meanCI(m, s, n, conf) {
    var se = s / Math.sqrt(n);
    var tc = T.tQuantile(1 - (1 - conf) / 2, n - 1);
    return { lo: m - tc * se, hi: m + tc * se, se: se, crit: tc, df: n - 1 };
  }

  // ---- Wilson score interval, no continuity correction ----
  // matches prop.test(x, n, correct = FALSE)$conf.int
  function wilsonCI(x, n, conf) {
    var p = x / n;
    var z = N.qnorm(1 - (1 - conf) / 2);
    var z2 = z * z;
    var denom = 1 + z2 / n;
    var centre = (p + z2 / (2 * n)) / denom;
    var half = z * Math.sqrt(p * (1 - p) / n + z2 / (4 * n * n)) / denom;
    return { lo: Math.max(0, centre - half), hi: Math.min(1, centre + half), p: p, crit: z };
  }

  // ---- Clopper-Pearson exact, via inverse incomplete beta (bisection) ----
  // matches binom.test(x, n)$conf.int
  function qbeta(p, a, b) {
    if (p <= 0) return 0;
    if (p >= 1) return 1;
    var lo = 0, hi = 1, mid;
    for (var i = 0; i < 200; i++) {
      mid = (lo + hi) / 2;
      if (T.ibeta(a, b, mid) < p) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }
  function exactCI(x, n, conf) {
    var a = 1 - conf;
    var lo = x === 0 ? 0 : qbeta(a / 2, x, n - x + 1);
    var hi = x === n ? 1 : qbeta(1 - a / 2, x + 1, n - x);
    return { lo: lo, hi: hi, p: x / n };
  }

  // ---- difference of means (Welch), matches t.test(x, y)$conf.int ----
  function diffMeanCI(m1, s1, n1, m2, s2, n2, conf) {
    var v1 = s1 * s1 / n1, v2 = s2 * s2 / n2, se = Math.sqrt(v1 + v2);
    var df = (v1 + v2) * (v1 + v2) / ((v1 * v1) / (n1 - 1) + (v2 * v2) / (n2 - 1));
    var tc = T.tQuantile(1 - (1 - conf) / 2, df);
    var est = m1 - m2;
    return { lo: est - tc * se, hi: est + tc * se, est: est, se: se, df: df, crit: tc };
  }

  // ---- difference of proportions (Wald, no continuity correction) ----
  // matches prop.test(c(x1,x2), c(n1,n2), correct = FALSE)$conf.int
  function diffPropCI(x1, n1, x2, n2, conf) {
    var p1 = x1 / n1, p2 = x2 / n2, est = p1 - p2;
    var se = Math.sqrt(p1 * (1 - p1) / n1 + p2 * (1 - p2) / n2);
    var z = N.qnorm(1 - (1 - conf) / 2);
    return { lo: Math.max(-1, est - z * se), hi: Math.min(1, est + z * se), est: est, se: se, crit: z };
  }

  // ---- chi-square CDF/quantile (via normal-math's incomplete gamma) ----
  function chisqCDF(x, k) {
    if (x <= 0) return 0;
    return 1 - N.gammq(k / 2, x / 2);
  }
  function qchisq(p, k) {
    if (p <= 0) return 0;
    var lo = 0, hi = Math.max(100, k + 40 * Math.sqrt(2 * k)), mid;
    while (chisqCDF(hi, k) < p) hi *= 2;
    for (var i = 0; i < 200; i++) {
      mid = (lo + hi) / 2;
      if (chisqCDF(mid, k) < p) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  // ---- Poisson rate (exact), matches poisson.test(x, T)$conf.int ----
  function poissonCI(x, exposure, conf) {
    var a = 1 - conf;
    var lo = x === 0 ? 0 : qchisq(a / 2, 2 * x) / 2 / exposure;
    var hi = qchisq(1 - a / 2, 2 * (x + 1)) / 2 / exposure;
    return { lo: lo, hi: hi, est: x / exposure };
  }

  // ---- variance / SD (chi-square interval) ----
  function varianceCI(s, n, conf) {
    var a = 1 - conf, s2 = s * s;
    var lo = (n - 1) * s2 / qchisq(1 - a / 2, n - 1);
    var hi = (n - 1) * s2 / qchisq(a / 2, n - 1);
    return { lo: lo, hi: hi, sdLo: Math.sqrt(lo), sdHi: Math.sqrt(hi), est: s2 };
  }

  // ---- correlation (Fisher z), matches cor.test (Pearson)$conf.int ----
  function corrCI(r, n, conf) {
    var z = 0.5 * Math.log((1 + r) / (1 - r));
    var se = 1 / Math.sqrt(n - 3);
    var zc = N.qnorm(1 - (1 - conf) / 2);
    function inv(v) { var e = Math.exp(2 * v); return (e - 1) / (e + 1); }
    return { lo: inv(z - zc * se), hi: inv(z + zc * se), est: r };
  }

  // ---- regression coefficient (t interval), matches confint(lm) ----
  function regBetaCI(b, se, df, conf) {
    var tc = T.tQuantile(1 - (1 - conf) / 2, df);
    return { lo: b - tc * se, hi: b + tc * se, est: b, crit: tc };
  }

  return { meanCI: meanCI, wilsonCI: wilsonCI, exactCI: exactCI, qbeta: qbeta,
           diffMeanCI: diffMeanCI, diffPropCI: diffPropCI, poissonCI: poissonCI,
           varianceCI: varianceCI, corrCI: corrCI, regBetaCI: regBetaCI,
           chisqCDF: chisqCDF, qchisq: qchisq };
}));
