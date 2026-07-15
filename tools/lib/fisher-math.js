/* fisher-math.js - Fisher's exact test for a 2x2 table (wave-3)
   Ground truth: R 4.6.0 base fisher.test / chisq.test + base dhyper (mid-p),
   verified in Scripts/tool-truth/test-fisher-exact-test-calculator-math.js at
   <= 1e-6 relative.

   REUSES the R-verified machinery in oddsratio-math.js (window.OddsRatioMath):
     - fisherP   -> two-sided p (R "minlike")
     - fisherMLE -> conditional MLE (fisher.test $estimate)
     - fisherCI  -> two-sided exact CI (fisher.test $conf.int)
     - chisq     -> Pearson chi-square (Yates + raw) + smallest expected count
     - uniroot   -> R zeroin2 Brent, tol = .Machine$double.eps^0.25
   and EXTENDS it additively with one-sided p, mid-p and one-sided exact CIs,
   matching fisher.test(alternative = "greater" | "less").

   2x2 layout (cell a at [1,1]):
              Outcome+   Outcome-
     Group 1     a          b
     Group 2     c          d
   fisher.test internals: m = a+c (col1), n = b+d (col2), k = a+b (row1), x = a.
   one-sided p: greater = P(X >= x), less = P(X <= x) under the null (OR = 1). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports)
    module.exports = factory(require('./oddsratio-math.js'), require('./normal-math.js'));
  else root.FisherMath = factory(root.OddsRatioMath, root.NormalMath);
}(typeof self !== 'undefined' ? self : this, function (ORM, N) {
  'use strict';
  var EPS = 2.220446049250313e-16;

  function lchoose(n, k) { return N.lgamma(n + 1) - N.lgamma(k + 1) - N.lgamma(n - k + 1); }

  /* noncentral hypergeometric model (ported from oddsratio-math.js, re-verified)
     so one-sided p / mid-p / one-sided CI can reach pnhyper directly. */
  function model(a, b, c, d) {
    var m = a + c, n = b + d, k = a + b, x = a;
    var lo = Math.max(0, k - n), hi = Math.min(k, m);
    var len = hi - lo + 1;
    var logdc = new Float64Array(len);
    logdc[0] = lchoose(m, lo) + lchoose(n, k - lo);
    for (var i = 1; i < len; i++) {
      var s = lo + i;
      var ratio = ((m - s + 1) * (k - s + 1)) / (s * (n - k + s));
      logdc[i] = logdc[i - 1] + Math.log(ratio);
    }
    function dnhyper(ncp) {
      var dd = new Float64Array(len), mx = -Infinity, lncp = Math.log(ncp), i, s;
      for (i = 0; i < len; i++) { s = lo + i; dd[i] = logdc[i] + lncp * s; if (dd[i] > mx) mx = dd[i]; }
      var sum = 0;
      for (i = 0; i < len; i++) { dd[i] = Math.exp(dd[i] - mx); sum += dd[i]; }
      for (i = 0; i < len; i++) dd[i] /= sum;
      return dd;
    }
    // P(X <= q) [lower] or P(X >= q) [upper] under odds ratio ncp
    function pnhyper(q, ncp, upper) {
      if (ncp === 0) return upper ? (q <= lo ? 1 : 0) : (q >= lo ? 1 : 0);
      if (!isFinite(ncp)) return upper ? (q <= hi ? 1 : 0) : (q >= hi ? 1 : 0);
      var dd = dnhyper(ncp), s = 0;
      for (var j = 0; j < len; j++) {
        var v = lo + j;
        if (upper ? v >= q : v <= q) s += dd[j];
      }
      return s;
    }
    return { m: m, n: n, k: k, x: x, lo: lo, hi: hi, len: len,
             dnhyper: dnhyper, pnhyper: pnhyper };
  }

  /* one-sided exact CI bounds (fisher.test greater/less conf.int).
     Mirrors R's ncp.L / ncp.U with a single-tail alpha. */
  function ncpL(M, alpha) {
    var x = M.x;
    if (x === M.lo) return 0;
    var p = M.pnhyper(x, 1, true);
    if (p > alpha) return ORM.uniroot(function (t) { return M.pnhyper(x, t, true) - alpha; }, 0, 1);
    if (p < alpha) return 1 / ORM.uniroot(function (t) { return M.pnhyper(x, 1 / t, true) - alpha; }, EPS, 1);
    return 1;
  }
  function ncpU(M, alpha) {
    var x = M.x;
    if (x === M.hi) return Infinity;
    var p = M.pnhyper(x, 1, false);
    if (p < alpha) return ORM.uniroot(function (t) { return M.pnhyper(x, t, false) - alpha; }, 0, 1);
    if (p > alpha) return 1 / ORM.uniroot(function (t) { return M.pnhyper(x, 1 / t, false) - alpha; }, EPS, 1);
    return 1;
  }

  function sampleOR(a, b, c, d) {
    var corrected = (a === 0 || b === 0 || c === 0 || d === 0);
    var A = a, B = b, C = c, D = d;
    if (corrected) { A = a + 0.5; B = b + 0.5; C = c + 0.5; D = d + 0.5; }
    return { est: (A * D) / (B * C), corrected: corrected };
  }

  /* ======================= main analyze ======================= */
  function analyze(a, b, c, d, opts) {
    opts = opts || {};
    var level = opts.level || 0.95;
    var alt = opts.alternative || 'two.sided';   // 'two.sided' | 'greater' | 'less'
    a = +a; b = +b; c = +c; d = +d;

    var M = model(a, b, c, d), x = M.x;

    // p-values (all three, null OR = 1)
    var pTwo = ORM.fisherP(a, b, c, d);
    var pGreater = M.pnhyper(x, 1, true);
    var pLess = M.pnhyper(x, 1, false);

    // mid-p (tail - 0.5 * point mass; two-sided uses the minlike ordering)
    var d1 = M.dnhyper(1), dobs = d1[x - M.lo], relErr = 1 + 1e-7;
    var lessMass = 0, eqMass = 0;
    for (var i = 0; i < M.len; i++) {
      if (d1[i] < dobs / relErr) lessMass += d1[i];
      else if (d1[i] <= dobs * relErr) eqMass += d1[i];
    }
    var midTwo = Math.min(1, lessMass + 0.5 * eqMass);
    var midGreater = pGreater - 0.5 * dobs;
    var midLess = pLess - 0.5 * dobs;

    // odds ratio: conditional MLE (fisher.test estimate) + sample ad/bc
    var cmle = ORM.fisherMLE(a, b, c, d);
    var samp = sampleOR(a, b, c, d);

    // exact CI matching the chosen alternative
    var ci;
    if (alt === 'greater') ci = { lo: ncpL(M, 1 - level), hi: Infinity };
    else if (alt === 'less') ci = { lo: 0, hi: ncpU(M, 1 - level) };
    else ci = ORM.fisherCI(a, b, c, d, level);   // two.sided (reuse verified)

    // selected-alternative p + mid-p
    var p = alt === 'greater' ? pGreater : (alt === 'less' ? pLess : pTwo);
    var midp = alt === 'greater' ? midGreater : (alt === 'less' ? midLess : midTwo);

    // chi-square comparison + expected-count recommendation
    var cs = ORM.chisq(a, b, c, d);
    var recommend = cs.minExp < 5 ? 'fisher' : 'chisq';

    return {
      inputs: { a: a, b: b, c: c, d: d, n1: a + b, n0: c + d, m1: a + c, m0: b + d, N: a + b + c + d },
      level: level, alternative: alt,
      p: p, midp: midp,
      pTwo: pTwo, pGreater: pGreater, pLess: pLess,
      midTwo: midTwo, midGreater: midGreater, midLess: midLess,
      or: { cmle: cmle, sample: samp.est, corrected: samp.corrected, lo: ci.lo, hi: ci.hi },
      chisq: cs, recommend: recommend,
      support: { lo: M.lo, hi: M.hi, len: M.len, x: x }
    };
  }

  // expose the null pmf (for the shows-work distribution viz)
  function nullPmf(a, b, c, d) {
    var M = model(a, b, c, d);
    return { lo: M.lo, hi: M.hi, x: M.x, d: Array.prototype.slice.call(M.dnhyper(1)) };
  }

  return {
    analyze: analyze, model: model, nullPmf: nullPmf,
    ncpL: ncpL, ncpU: ncpU, sampleOR: sampleOR
  };
}));
