/* proportion-math.js - one- and two-proportion z-tests for Tool Farm v2.
   Ground truth: R 4.6.0 prop.test() for both correct=TRUE (Yates, R's default)
   and correct=FALSE (the textbook z-test). See
   Scripts/tool-truth/proportion-test-calculator.json.

   Composes normal-math.js (pnorm, qnorm) and ci-math.js (wilsonCI, diffPropCI).
   It adds NOTHING to those libs. The chi-square statistic is built cell-by-cell
   exactly as R's prop.test does, so both correct settings match R bit-for-bit:

     one sample: X = ((|x - n p0| - Y)^2)/(n p0) + ((|(n-x) - n(1-p0)| - Y)^2)/(n(1-p0))
                 Y = correct ? min(0.5, |x - n p0|) : 0
     two sample: pooled p = (x1+x2)/(n1+n2); X summed over the 2x2 of |O-E|-Y
                 Y = correct ? min(0.5, |p1-p2| / (1/n1 + 1/n2)) : 0

   signed z  = sign(effect) * sqrt(X)          (effect = phat-p0 or p1-p2)
   two-sided p = pchisq(X, 1, upper) = 2*pnorm(-|z|)
   one-sided p = pnorm(z, lower.tail = (alt == "less"))
   critical z (two-sided) = qnorm(1 - alpha/2);  (one-sided) = qnorm(1 - alpha)

   In the browser the factory reads the globals; in Node it is handed the
   modules via require. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./normal-math.js'), require('./ci-math.js'));
  } else {
    root.ProportionMath = factory(root.NormalMath, root.CIMath);
  }
}(typeof self !== 'undefined' ? self : this, function (N, CI) {
  'use strict';

  function sgn(x) { return x > 0 ? 1 : (x < 0 ? -1 : 0); }

  // p-value from a signed z and the (nonnegative) statistic X = z^2.
  function pval(z, alt) {
    if (alt === 'two') return 2 * N.pnorm(-Math.abs(z));
    if (alt === 'less') return N.pnorm(z);
    return N.pnorm(-z);                 // 'greater'
  }
  // critical z magnitude for the chosen alternative and confidence level.
  function critical(alt, conf) {
    var alpha = 1 - conf;
    return alt === 'two' ? N.qnorm(1 - alpha / 2) : N.qnorm(1 - alpha);
  }
  // does the observed z fall in the rejection region?
  function rejects(z, crit, alt) {
    if (alt === 'two') return Math.abs(z) > crit;
    if (alt === 'greater') return z > crit;
    return z < -crit;                  // 'less'
  }

  // One-sample: x successes of n, tested against p0.
  // alt: 'two'|'greater'|'less'; conf e.g. 0.95; correct = Yates on/off.
  function oneSample(x, n, p0, alt, conf, correct) {
    var phat = x / n;
    var se0 = Math.sqrt(p0 * (1 - p0) / n);            // SE under H0
    var Y = correct ? Math.min(0.5, Math.abs(x - n * p0)) : 0;
    var obs = [x, n - x], E = [n * p0, n * (1 - p0)];
    var stat = 0;
    for (var i = 0; i < 2; i++) { var d = Math.abs(obs[i] - E[i]) - Y; stat += d * d / E[i]; }
    var z = sgn(phat - p0) * Math.sqrt(stat);
    var crit = critical(alt, conf);
    var ci = CI.wilsonCI(x, n, conf);                  // == prop.test(correct=FALSE)$conf.int
    return {
      mode: 'one', phat: phat, se: se0, z: z, stat: stat,
      p: pval(z, alt), crit: crit, reject: rejects(z, crit, alt),
      ci: ci, yates: Y, correct: !!correct
    };
  }

  // Two-sample: x1/n1 vs x2/n2.
  function twoSample(x1, n1, x2, n2, alt, conf, correct) {
    var p1 = x1 / n1, p2 = x2 / n2, delta = p1 - p2;
    var ppool = (x1 + x2) / (n1 + n2);
    var se = Math.sqrt(ppool * (1 - ppool) * (1 / n1 + 1 / n2));   // pooled SE under H0
    var Y = correct ? Math.min(0.5, Math.abs(delta) / (1 / n1 + 1 / n2)) : 0;
    var obs = [[x1, n1 - x1], [x2, n2 - x2]];
    var E = [[n1 * ppool, n1 * (1 - ppool)], [n2 * ppool, n2 * (1 - ppool)]];
    var stat = 0;
    for (var i = 0; i < 2; i++) for (var j = 0; j < 2; j++) {
      var d = Math.abs(obs[i][j] - E[i][j]) - Y; stat += d * d / E[i][j];
    }
    var z = sgn(delta) * Math.sqrt(stat);
    var crit = critical(alt, conf);
    var ci = CI.diffPropCI(x1, n1, x2, n2, conf);       // == prop.test(correct=FALSE)$conf.int
    return {
      mode: 'two', p1: p1, p2: p2, delta: delta, ppool: ppool, se: se,
      z: z, stat: stat, p: pval(z, alt), crit: crit, reject: rejects(z, crit, alt),
      ci: ci, yates: Y, correct: !!correct
    };
  }

  return {
    oneSample: oneSample, twoSample: twoSample,
    pval: pval, critical: critical, rejects: rejects
  };
}));
