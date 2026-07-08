/* normal-math.js - exact normal-distribution math for Tool Farm v2.
   Ground truth: R 4.6.0 pnorm/qnorm (see Scripts/tool-truth/z-score.json).
   pnorm via erfc computed with the regularized incomplete gamma (series +
   continued fraction), near machine precision; qnorm via Acklam's inverse
   with one Halley refinement step. Browser (window.NormalMath) + Node. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.NormalMath = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function lgamma(x) {
    var c = [76.18009172947146, -86.50532032941677, 24.01409824083091,
             -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
    var y = x, t = x + 5.5;
    t -= (x + 0.5) * Math.log(t);
    var s = 1.000000000190015;
    for (var j = 0; j < 6; j++) s += c[j] / ++y;
    return -t + Math.log(2.5066282746310005 * s / x);
  }

  // regularized lower incomplete gamma P(a,x) by series
  function gser(a, x) {
    var ITMAX = 500, EPS = 3e-16;
    var gln = lgamma(a), ap = a, sum = 1 / a, del = sum;
    for (var n = 1; n <= ITMAX; n++) {
      ap += 1; del *= x / ap; sum += del;
      if (Math.abs(del) < Math.abs(sum) * EPS) break;
    }
    return sum * Math.exp(-x + a * Math.log(x) - gln);
  }
  // regularized upper incomplete gamma Q(a,x) by continued fraction
  function gcf(a, x) {
    var ITMAX = 500, EPS = 3e-16, FPMIN = 1e-300;
    var gln = lgamma(a), b = x + 1 - a, c = 1 / FPMIN, d = 1 / b, h = d;
    for (var i = 1; i <= ITMAX; i++) {
      var an = -i * (i - a);
      b += 2;
      d = an * d + b; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = b + an / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d;
      var del = d * c; h *= del;
      if (Math.abs(del - 1) < EPS) break;
    }
    return Math.exp(-x + a * Math.log(x) - gln) * h;
  }
  function gammq(a, x) {          // Q(a,x) = 1 - P(a,x)
    if (x < 0 || a <= 0) return NaN;
    if (x === 0) return 1;
    return x < a + 1 ? 1 - gser(a, x) : gcf(a, x);
  }
  function erfc(x) {
    return x >= 0 ? gammq(0.5, x * x) : 2 - gammq(0.5, x * x);
  }

  // standard normal CDF, near machine precision, matches R pnorm
  function pnorm(z) {
    return 0.5 * erfc(-z / Math.SQRT2);
  }
  function dnorm(z) {
    return Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
  }

  // Acklam's inverse normal + one Halley refinement -> ~machine precision
  function qnorm(p) {
    if (p <= 0) return -Infinity;
    if (p >= 1) return Infinity;
    var a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02,
              1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
    var b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02,
              6.680131188771972e+01, -1.328068155288572e+01];
    var c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00,
             -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
    var d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00,
             3.754408661907416e+00];
    var plow = 0.02425, phigh = 1 - plow, q, r, x;
    if (p < plow) {
      q = Math.sqrt(-2 * Math.log(p));
      x = (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
    } else if (p <= phigh) {
      q = p - 0.5; r = q * q;
      x = (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q / (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
    } else {
      q = Math.sqrt(-2 * Math.log(1 - p));
      x = -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
    }
    // Halley refinement against the high-precision pnorm
    var e = pnorm(x) - p;
    var u = e * Math.sqrt(2 * Math.PI) * Math.exp(x * x / 2);
    x = x - u / (1 + x * u / 2);
    return x;
  }

  // conveniences for the calculator
  function zFromX(x, mean, sd) { return (x - mean) / sd; }
  function pctFromZ(z) { return pnorm(z); }
  function zFromPct(p) { return qnorm(p); }
  function between(a, b, mean, sd) { return pnorm((b - mean) / sd) - pnorm((a - mean) / sd); }
  function twoTail(z) { return 2 * pnorm(-Math.abs(z)); }

  return { lgamma: lgamma, erfc: erfc, gammq: gammq, pnorm: pnorm, dnorm: dnorm, qnorm: qnorm,
           zFromX: zFromX, pctFromZ: pctFromZ, zFromPct: zFromPct,
           between: between, twoTail: twoTail };
}));
