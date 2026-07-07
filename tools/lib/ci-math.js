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

  return { meanCI: meanCI, wilsonCI: wilsonCI, exactCI: exactCI, qbeta: qbeta };
}));
