/* dist-tables-math.js - critical-value + tail-area math for the t-table and
   z-table tools (Tool Farm v2). Ground truth: R 4.6.0 qt/pt, qnorm/pnorm,
   qchisq/pchisq, qf/pf (see Scripts/tool-truth/t-table.json).

   Composes the existing exact primitives instead of re-deriving them:
     - NormalMath: pnorm/qnorm/dnorm (erfc via incomplete gamma), gammq
     - TTestMath:  ibeta (regularized incomplete beta), tCDF, tPDF, lgamma
   and adds adaptive quantile inversion (wide brackets) so extreme critical
   values like qt(0.9995, df=1) ~ 636.6 are exact, and the F distribution.

   Browser: window.DistTablesMath (needs NormalMath + TTestMath loaded first).
   Node: require('./dist-tables-math.js'). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./normal-math.js'), require('./ttest-math.js'));
  } else {
    root.DistTablesMath = factory(root.NormalMath, root.TTestMath);
  }
}(typeof self !== 'undefined' ? self : this, function (N, T) {
  'use strict';

  var lgamma = T.lgamma, ibeta = T.ibeta;

  // ---- generic monotone-increasing root finder on a CDF ----------------
  // Solves cdf(x) = p for x in [xmin, inf). Brackets by doubling, then
  // ~200 bisection steps => machine-precision (relative <= 1e-12 typical).
  function invCDF(cdf, p, xmin) {
    if (p <= 0) return xmin;
    if (p >= 1) return Infinity;
    var lo = xmin, hi = (xmin === 0 ? 1 : xmin + 1);
    var guard = 0;
    while (cdf(hi) < p) {
      lo = hi;
      hi = (hi <= 0) ? 1 : hi * 2;
      if (++guard > 200) break;
    }
    for (var i = 0; i < 200; i++) {
      var mid = 0.5 * (lo + hi);
      if (mid === lo || mid === hi) break;
      if (cdf(mid) < p) lo = mid; else hi = mid;
    }
    return 0.5 * (lo + hi);
  }

  // ====================================================================
  //  Standard normal  (thin wrappers over NormalMath, exact)
  // ====================================================================
  function pnorm(z) { return N.pnorm(z); }        // P(Z <= z)
  function qnorm(p) { return N.qnorm(p); }
  function dnorm(z) { return N.dnorm(z); }
  // area helpers for the z-table region selector
  function zArea(z, region, z2) {
    switch (region) {
      case 'left':   return N.pnorm(z);
      case 'right':  return 1 - N.pnorm(z);
      case 'beyond': return 2 * N.pnorm(-Math.abs(z));               // both tails |Z|>z
      case 'between':                                                // P(lo < Z < hi)
        var lo = Math.min(z, z2), hi = Math.max(z, z2);
        return N.pnorm(hi) - N.pnorm(lo);
      default: return N.pnorm(z);
    }
  }

  // ====================================================================
  //  Student's t
  // ====================================================================
  // pt = lower CDF P(T <= t). Exact via TTestMath (ibeta-based).
  function pt(t, df) {
    if (!isFinite(df)) return N.pnorm(t);          // df = Inf -> normal
    return T.tCDF(t, df);
  }
  function dt(t, df) {
    if (!isFinite(df)) return N.dnorm(t);
    return T.tPDF(t, df);
  }
  // two-tailed p for |T| >= |t|
  function ptTwo(t, df) {
    if (!isFinite(df)) return 2 * N.pnorm(-Math.abs(t));
    return T.pTwoTailed(t, df);
  }
  // qt = inverse CDF. Symmetric; adaptive bracket handles heavy tails
  // (qt(0.9995, 1) ~ 636.6 lies far outside a fixed [-80,80] window).
  function qt(p, df) {
    if (p <= 0) return -Infinity;
    if (p >= 1) return Infinity;
    if (p === 0.5) return 0;
    if (!isFinite(df)) return N.qnorm(p);
    if (p < 0.5) return -qt(1 - p, df);            // reflect to the upper tail
    return invCDF(function (x) { return T.tCDF(x, df); }, p, 0);
  }

  // ====================================================================
  //  Chi-square
  // ====================================================================
  function pchisq(x, df) {                          // P(X <= x)
    if (x <= 0) return 0;
    return 1 - N.gammq(df / 2, x / 2);
  }
  function dchisq(x, df) {
    if (x < 0) return 0;
    if (x === 0) return df < 2 ? Infinity : (df === 2 ? 0.5 : 0);
    var k = df / 2;
    return Math.exp((k - 1) * Math.log(x) - x / 2 - k * Math.LN2 - lgamma(k));
  }
  function qchisq(p, df) {
    if (p <= 0) return 0;
    if (p >= 1) return Infinity;
    return invCDF(function (x) { return pchisq(x, df); }, p, 0);
  }

  // ====================================================================
  //  F distribution  (via the regularized incomplete beta identity)
  //  P(F <= x) = I_{d1 x /(d1 x + d2)}(d1/2, d2/2)
  // ====================================================================
  function pf(x, d1, d2) {
    if (x <= 0) return 0;
    var y = d1 * x;
    return ibeta(d1 / 2, d2 / 2, y / (y + d2));
  }
  function df_pdf(x, d1, d2) {
    if (x <= 0) return 0;
    var a = d1 / 2, b = d2 / 2;
    var lognum = a * Math.log(d1) + b * Math.log(d2) + (a - 1) * Math.log(x);
    var logden = (a + b) * Math.log(d1 * x + d2)
               + lgamma(a) + lgamma(b) - lgamma(a + b);
    return Math.exp(lognum - logden);
  }
  function qf(p, d1, d2) {
    if (p <= 0) return 0;
    if (p >= 1) return Infinity;
    return invCDF(function (x) { return pf(x, d1, d2); }, p, 0);
  }

  // ====================================================================
  //  Correlation r  ->  t transform (R's cor.test / lm t for Pearson r):
  //  t = r * sqrt((n - 2) / (1 - r^2)), tested on df = n - 2.
  // ====================================================================
  function rToT(r, n) {
    var df = n - 2;
    return r * Math.sqrt(df / (1 - r * r));
  }

  // ====================================================================
  //  p-values from a test statistic. Composes the CDFs above so the page,
  //  the node harness and R share ONE code path. Tail argument varies by
  //  distribution and is documented per function. Every deep tail is taken
  //  from the accurate (non-cancelling) side so p underflow stays exact:
  //  right-t via symmetry, upper chi-square via gammq Q, upper F via the
  //  beta-symmetry identity.
  // ====================================================================
  function pvT(t, df, tail) {                 // 'two' | 'right' | 'left'
    if (tail === 'right') return pt(-t, df);  // P(T>=t) = P(T<=-t), accurate deep tail
    if (tail === 'left')  return pt(t, df);   // P(T<=t)
    return ptTwo(t, df);                       // P(|T|>=|t|)
  }
  function pvZ(z, tail) {                      // 'two' | 'right' | 'left'
    if (tail === 'right') return N.pnorm(-z);
    if (tail === 'left')  return N.pnorm(z);
    return 2 * N.pnorm(-Math.abs(z));
  }
  function pvChisq(x, df, tail) {              // 'upper'/'right' | 'lower'/'left'
    if (x <= 0) return (tail === 'lower' || tail === 'left') ? 0 : 1;
    if (tail === 'lower' || tail === 'left') return pchisq(x, df);
    return N.gammq(df / 2, x / 2);             // upper tail Q(df/2, x/2)
  }
  function pvF(x, d1, d2, tail) {              // 'upper'/'right' | 'lower'/'left'
    if (x <= 0) return (tail === 'lower' || tail === 'left') ? 0 : 1;
    if (tail === 'lower' || tail === 'left') return pf(x, d1, d2);
    var y = d1 * x;                            // upper tail via I_x(a,b)=1-I_{1-x}(b,a)
    return ibeta(d2 / 2, d1 / 2, d2 / (y + d2));
  }
  function pvR(r, n, tail) {                   // Pearson r; tail as pvT
    return pvT(rToT(r, n), n - 2, tail);
  }

  // ---- critical values from alpha (inverse mode) ---------------------
  // Returns the (positive) cutoff a statistic must beat. Two-tailed t/z/r
  // report the positive edge; the negative edge is its mirror.
  function critT(alpha, df, tail) {
    if (tail === 'right') return qt(1 - alpha, df);
    if (tail === 'left')  return qt(alpha, df);
    return qt(1 - alpha / 2, df);
  }
  function critZ(alpha, tail) {
    if (tail === 'right') return N.qnorm(1 - alpha);
    if (tail === 'left')  return N.qnorm(alpha);
    return N.qnorm(1 - alpha / 2);
  }
  function critChisq(alpha, df, tail) {
    return (tail === 'lower' || tail === 'left') ? qchisq(alpha, df) : qchisq(1 - alpha, df);
  }
  function critF(alpha, d1, d2, tail) {
    return (tail === 'lower' || tail === 'left') ? qf(alpha, d1, d2) : qf(1 - alpha, d1, d2);
  }
  function critR(alpha, n, tail) {            // critical Pearson r
    var df = n - 2;
    var tc = (tail === 'two') ? qt(1 - alpha / 2, df) : qt(1 - alpha, df);
    return tc / Math.sqrt(df + tc * tc);
  }

  return {
    invCDF: invCDF,
    pnorm: pnorm, qnorm: qnorm, dnorm: dnorm, zArea: zArea,
    pt: pt, dt: dt, ptTwo: ptTwo, qt: qt,
    pchisq: pchisq, dchisq: dchisq, qchisq: qchisq,
    pf: pf, df_pdf: df_pdf, qf: qf,
    rToT: rToT,
    pvT: pvT, pvZ: pvZ, pvChisq: pvChisq, pvF: pvF, pvR: pvR,
    critT: critT, critZ: critZ, critChisq: critChisq, critF: critF, critR: critR
  };
}));
