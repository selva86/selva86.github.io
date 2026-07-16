/* significance-math.js - "is my result statistically significant?" math for
   Tool Farm v2. Composes the already R-verified primitives; adds no new
   distribution code of its own:
     * conversion-rate comparison -> ab-test-math twoProp  (== prop.test correct=FALSE)
     * two independent means      -> ttest-math welchSummary (== t.test var.equal=FALSE)
     * one proportion vs a target -> normal-math pnorm/qnorm + ci-math wilsonCI
   Ground truth: R 4.6.0 (see Scripts/tool-truth/statistical-significance-calculator.json).
   Browser globals: ABTestMath, TTestMath, NormalMath, CIMath. Node: required. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('./ab-test-math.js'),
      require('./ttest-math.js'),
      require('./normal-math.js'),
      require('./ci-math.js')
    );
  } else {
    root.SigMath = factory(root.ABTestMath, root.TTestMath, root.NormalMath, root.CIMath);
  }
}(typeof self !== 'undefined' ? self : this, function (AB, T, N, CI) {
  'use strict';

  // ---- (a) conversion-rate comparison: two-proportion z-test ----
  // A = control, B = variant. lift is B relative to A. tail: 'two' or
  // 'greater' (B beats A). The reported CI is ALWAYS the two-sided unpooled
  // Wald interval for pB - pA (matches prop.test(correct=FALSE) two-sided),
  // shown as a supporting stat regardless of the chosen tail.
  function convRate(cA, nA, cB, nB, opts) {
    opts = opts || {};
    var alpha = (opts.alpha != null) ? +opts.alpha : 0.05;
    var tail = opts.tail === 'greater' ? 1 : 2;
    var r = AB.twoProp(cA, nA, cB, nB, alpha, tail);
    var zc = AB.qnorm(1 - alpha / 2);
    var ciLo = r.diff - zc * r.seCi, ciHi = r.diff + zc * r.seCi;
    var ppool = (cA + cB) / (nA + nB);
    return {
      pa: r.pa, pb: r.pb,
      absLift: r.diff,                                   // pB - pA (percentage points)
      relLift: r.pa !== 0 ? r.diff / r.pa : NaN,         // (pB - pA) / pA (relative)
      z: r.z, p: r.p,
      ciLo: ciLo, ciHi: ciHi, ciLevel: 1 - alpha,
      se0: r.seH0, seCi: r.seCi, ppool: ppool,
      tail: tail === 2 ? 'two' : 'greater', alpha: alpha
    };
  }

  // ---- (b) two independent means: Welch t-test from summary stats ----
  // alt: 'two' | 'greater' | 'less'. Delegates to the t.test-verified engine.
  function twoMeans(m1, s1, n1, m2, s2, n2, opts) {
    opts = opts || {};
    var alt = opts.alt || 'two';
    var conf = (opts.conf != null) ? +opts.conf : 0.95;
    var r = T.welchSummary(m1, s1, n1, m2, s2, n2, alt, conf);
    return {
      t: r.t, df: r.df, p: r.p,
      ciLo: r.ci[0], ciHi: r.ci[1],
      diff: r.est,                                       // m1 - m2
      se: r.se, d: r.d,                                  // pooled-sd Cohen's d
      alt: alt, conf: conf
    };
  }

  // ---- (c) one proportion vs a target: one-sample z-test ----
  // z uses the null-hypothesis variance p0(1-p0)/n, so z^2 equals R's
  // prop.test(correct=FALSE) X-squared. The CI is the two-sided Wilson score
  // interval (== prop.test(correct=FALSE)$conf.int).
  function oneProp(x, n, p0, opts) {
    opts = opts || {};
    var alt = opts.alt || 'two';
    var conf = (opts.conf != null) ? +opts.conf : 0.95;
    var phat = x / n;
    var se0 = Math.sqrt(p0 * (1 - p0) / n);
    var z = se0 === 0 ? 0 : (phat - p0) / se0;
    var p;
    if (alt === 'greater') p = 1 - N.pnorm(z);
    else if (alt === 'less') p = N.pnorm(z);
    else p = 2 * N.pnorm(-Math.abs(z));
    var ci = CI.wilsonCI(x, n, conf);
    return {
      phat: phat, p0: p0, z: z, p: p,
      ciLo: ci.lo, ciHi: ci.hi, ciLevel: conf,
      se0: se0, diff: phat - p0, alt: alt, conf: conf
    };
  }

  return {
    convRate: convRate, twoMeans: twoMeans, oneProp: oneProp,
    // re-export the shared primitives so the page needs no extra wiring
    pnorm: N.pnorm, qnorm: N.qnorm, dnorm: N.dnorm
  };
}));
