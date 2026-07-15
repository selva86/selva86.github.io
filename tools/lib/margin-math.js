/* margin-math.js - margin-of-error math for Tool Farm v2.
   Ground truth: R 4.6.0 qnorm / qt / t.test constructions
   (see Scripts/tool-truth/margin-of-error-calculator.json).
   Composes ci-math.js (t critical value via meanCI) and normal-math.js
   (qnorm). In the browser the factory reads the globals; in Node it is
   handed the modules via require. It adds nothing to the shared libs. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./ci-math.js'), require('./normal-math.js'));
  } else {
    root.MarginMath = factory(root.CIMath, root.NormalMath);
  }
}(typeof self !== 'undefined' ? self : this, function (CI, N) {
  'use strict';

  function zcrit(conf) { return N.qnorm(1 - (1 - conf) / 2); }

  // Finite population correction. N null/blank/Infinity -> 1 (infinite pop).
  // n == N -> 0 (a census leaves no sampling error).
  function fpc(n, Npop) {
    if (Npop == null || !isFinite(Npop)) return 1;
    if (Npop <= 1) return 1;
    return Math.sqrt((Npop - n) / (Npop - 1));
  }

  // ---- mode: prop ----
  // Wald / normal-approximation margin for a proportion:
  //   moe = z * sqrt(p(1-p)/n) * fpc.  Matches qnorm()*sqrt(p*(1-p)/n) in R.
  function propMOE(p, n, conf, Npop) {
    var z = zcrit(conf);
    var se = Math.sqrt(p * (1 - p) / n);
    var f = fpc(n, Npop);
    var moe = z * se * f;
    return { moe: moe, z: z, se: se, fpc: f,
             lo: Math.max(0, p - moe), hi: Math.min(1, p + moe) };
  }

  // ---- mode: size ----
  // Cochran sample size for a target proportion margin:
  //   n0 = z^2 p(1-p) / moe^2 ; with a finite pop, n = n0 / (1 + (n0-1)/N).
  // Rounded up to a whole respondent.
  function sampleSizeProp(moe, p, conf, Npop) {
    var z = zcrit(conf);
    var n0 = z * z * p * (1 - p) / (moe * moe);
    var n = (Npop == null || !isFinite(Npop)) ? Math.ceil(n0)
          : Math.ceil(n0 / (1 + (n0 - 1) / Npop));
    return { n: n, n0: n0, z: z };
  }

  // ---- mode: mean ----
  // Margin for an average: moe = crit * s/sqrt(n) * fpc.
  //   method 't' -> Student t with n-1 df (sample SD, the default)
  //   method 'z' -> normal (a known population SD)
  // The t branch reuses ci-math's meanCI, which is t.test()-verified.
  function meanMOE(s, n, conf, method, Npop) {
    var crit, se;
    if (method === 'z') {
      crit = zcrit(conf); se = s / Math.sqrt(n);
    } else {
      var c = CI.meanCI(0, s, n, conf);  // crit = qt(1-(1-conf)/2, n-1), se = s/sqrt(n)
      crit = c.crit; se = c.se;
    }
    var f = fpc(n, Npop);
    return { moe: crit * se * f, crit: crit, se: se, fpc: f };
  }

  return { propMOE: propMOE, sampleSizeProp: sampleSizeProp, meanMOE: meanMOE,
           zcrit: zcrit, fpc: fpc };
}));
