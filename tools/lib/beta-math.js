/* beta-math.js - Beta distribution math for Tool Farm v2.
   Ground truth: R 4.6.0 dbeta() / pbeta() / qbeta()
   (see Scripts/tool-truth/beta-distribution-calculator.json).

   COMPOSES tools/lib/ttest-math.js (lgamma + regularized incomplete beta).
   No primitive is re-implemented here and ttest-math.js is NOT modified:

     pbeta(x, a, b)  =  I_x(a, b)              -> T.ibeta(a, b, x) directly
     P(X > x)        =  1 - I_x(a, b)  =  I_{1-x}(b, a)

   Those two forms for the upper tail are equal on paper and NOT equal in
   doubles, so sfbeta() picks between them (see the note there). Neither is
   safe everywhere: subtracting from 1 dies when the upper tail is small,
   and the identity dies when x is small, because it needs 1 - x.

   Works in browser (window.BetaMath) and Node (module.exports). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./ttest-math.js'));
  } else {
    root.BetaMath = factory(root.TTestMath);
  }
}(typeof self !== 'undefined' ? self : this, function (T) {
  'use strict';

  var lgamma = T.lgamma, ibeta = T.ibeta;

  // log B(a, b)
  function lbeta(a, b) {
    return lgamma(a) + lgamma(b) - lgamma(a + b);
  }

  // ---- density ----------------------------------------------------------
  // The boundaries need their own branches: the general log form hits
  // 0 * -Infinity = NaN when a === 1 at x === 0 (and b === 1 at x === 1).
  function dbeta(x, a, b) {
    if (!(x >= 0 && x <= 1)) return 0;
    if (x === 0) {
      if (a < 1) return Infinity;               // integrable spike at 0
      if (a === 1) return Math.exp(-lbeta(a, b));
      return 0;
    }
    if (x === 1) {
      if (b < 1) return Infinity;               // integrable spike at 1
      if (b === 1) return Math.exp(-lbeta(a, b));
      return 0;
    }
    return Math.exp((a - 1) * Math.log(x) + (b - 1) * Math.log1p(-x) - lbeta(a, b));
  }

  // ---- CDF and upper tail ----------------------------------------------
  function pbeta(x, a, b) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    return ibeta(a, b, x);
  }
  // P(X > x), tail-accurate. Which form is safe depends on WHICH tail is the
  // small one, so the branch is chosen against the mean:
  //   x above the mean -> upper tail is small. 1 - I_x(a,b) would cancel
  //     against 1 (Beta(2,5) at x=0.95: 1 - 0.9999982), so use the identity.
  //   x below the mean -> upper tail is near 1 and I_x(a,b) is small, so
  //     1 - I_x(a,b) is exact. The identity would be WRONG here: it needs
  //     1 - x, which for x = 2.5e-16 rounds straight to 1 and flattens the
  //     function (this silently returned 0.99902 instead of 0.999 for
  //     Beta(0.2,3) until the R truth table caught it).
  // The one irreducible case is x within ~1e-12 of 1, where 1 - x has no
  // digits left to give. R is no better there (its own pbeta(qbeta(p)) misses
  // by 8e-6) and no user types an x that precise.
  function sfbeta(x, a, b) {
    if (x <= 0) return 1;
    if (x >= 1) return 0;
    return x > a / (a + b) ? ibeta(b, a, 1 - x) : 1 - ibeta(a, b, x);
  }

  // ---- quantile ---------------------------------------------------------
  // Safeguarded Newton (Numerical Recipes rtsafe): Newton where it stays
  // inside the bracket, bisection where it does not. Solves the requested
  // tail DIRECTLY - the upper branch roots sfbeta(x) - p instead of
  // qbeta(1 - p), so a tiny upper-tail p never gets rounded away by 1 - p.
  function qsolve(p, a, b, lower) {
    if (p <= 0) return lower ? 0 : 1;
    if (p >= 1) return lower ? 1 : 0;
    var lo = 0, hi = 1;
    // f is increasing in x for the lower tail, decreasing for the upper.
    var f = function (x) {
      return lower ? pbeta(x, a, b) - p : sfbeta(x, a, b) - p;
    };
    var x = 0.5, i, fx, df, nx;
    // Mean is a cheaper-than-nothing start when it is inside the bracket.
    var m = a / (a + b);
    if (m > 0 && m < 1) x = m;
    for (i = 0; i < 300; i++) {
      fx = f(x);
      if (fx === 0) return x;
      // keep the bracket
      if (lower ? (fx < 0) : (fx > 0)) lo = x; else hi = x;
      if (hi <= lo) return x;
      df = dbeta(x, a, b);
      if (!lower) df = -df;
      nx = isFinite(df) && df !== 0 ? x - fx / df : NaN;
      if (!(nx > lo && nx < hi) || !isFinite(nx)) nx = lo + 0.5 * (hi - lo);
      // Convergence is judged on the BRACKET, never on the Newton step
      // length: where the density spikes (a < 1 near 0) the derivative is
      // enormous, so a tiny step means a steep curve, not a found root.
      // Stopping on step length there quits while still far from the root
      // (Beta(0.2,3) upper 0.999, whose root is 2.5e-16).
      if (nx === x) return x;                     // at the resolution limit
      x = nx;
      if (hi - lo <= 1e-17 * Math.abs(x)) return x;
    }
    return x;
  }
  function qbeta(p, a, b) { return qsolve(p, a, b, true); }
  function qbetaUpper(p, a, b) { return qsolve(p, a, b, false); }

  // ---- moments ----------------------------------------------------------
  // mode is genuinely undefined in two cases and we report that rather than
  // inventing a number: Beta(1,1) is flat (every point is a mode) and
  // a<1 & b<1 is bimodal, piling up at BOTH 0 and 1.
  function moments(a, b) {
    var mean = a / (a + b);
    var v = a * b / ((a + b) * (a + b) * (a + b + 1));
    var mode;
    if (a > 1 && b > 1) mode = (a - 1) / (a + b - 2);
    else if (a === 1 && b === 1) mode = null;     // flat
    else if (a <= 1 && b > 1) mode = 0;
    else if (a > 1 && b <= 1) mode = 1;
    else mode = null;                             // bimodal at 0 and 1
    return { mean: mean, var: v, sd: Math.sqrt(v), mode: mode };
  }

  // ---- analyze (one call per page mode) ---------------------------------
  function analyze(mode, inp) {
    var a = inp.a, b = inp.b, mo = moments(a, b), r = {
      a: a, b: b, mean: mo.mean, var: mo.var, sd: mo.sd, mode: mo.mode
    };
    if (mode === 'below' || mode === 'above') {
      r.x = inp.x;
      r.d = dbeta(inp.x, a, b);
      r.p_below = pbeta(inp.x, a, b);
      r.p_above = sfbeta(inp.x, a, b);
      r.p = mode === 'below' ? r.p_below : r.p_above;
    } else if (mode === 'between') {
      r.lo = inp.lo; r.hi = inp.hi;
      r.p_lo = pbeta(inp.lo, a, b);
      r.p_hi = pbeta(inp.hi, a, b);
      r.p_between = r.p_hi - r.p_lo;
      r.p_outside = 1 - r.p_between;
      r.p = r.p_between;
    } else if (mode === 'quantile') {
      r.p_in = inp.p;
      r.q_left = qbeta(inp.p, a, b);
      r.q_right = qbetaUpper(inp.p, a, b);
    }
    return r;
  }

  // Pseudo-count reading of the shape parameters: a Beta(a,b) posterior
  // from a uniform Beta(1,1) prior implies a-1 successes and b-1 failures.
  function pseudoCounts(a, b) {
    return { successes: a - 1, failures: b - 1, trials: a + b - 2 };
  }

  return {
    lbeta: lbeta, dbeta: dbeta, pbeta: pbeta, sfbeta: sfbeta,
    qbeta: qbeta, qbetaUpper: qbetaUpper, moments: moments,
    analyze: analyze, pseudoCounts: pseudoCounts
  };
}));
