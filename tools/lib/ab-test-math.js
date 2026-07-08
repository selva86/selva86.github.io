/* ab-test-math.js - exact A/B-test math for Tool Farm v2.
   Ground truth: R 4.6.0 prop.test / pwr.2p.test / integrate (see
   Scripts/tool-truth/ab-test-calculator.json). Deterministic - no RNG.
   Primitives (lgamma, ibeta, erfc/pnorm, qnorm) are the verified
   implementations from ttest-math.js / normal-math.js, inlined so the
   module is self-contained in both browser (window.ABTestMath) and Node. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ABTestMath = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---- gamma / beta ---- */
  function lgamma(x) {
    var c = [76.18009172947146, -86.50532032941677, 24.01409824083091,
             -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
    var y = x, t = x + 5.5;
    t -= (x + 0.5) * Math.log(t);
    var s = 1.000000000190015;
    for (var j = 0; j < 6; j++) s += c[j] / ++y;
    return -t + Math.log(2.5066282746310005 * s / x);
  }
  function lbeta(a, b) { return lgamma(a) + lgamma(b) - lgamma(a + b); }

  function betacf(a, b, x) {
    var MAXIT = 300, EPS = 3e-14, FPMIN = 1e-300;
    var qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    d = 1 / d;
    var h = d, m, m2, aa, del;
    for (m = 1; m <= MAXIT; m++) {
      m2 = 2 * m;
      aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d; del = d * c; h *= del;
      if (Math.abs(del - 1) < EPS) break;
    }
    return h;
  }
  // regularized incomplete beta I_x(a,b) == R pbeta(x, a, b)
  function ibeta(a, b, x) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    var bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b;
  }
  function pbeta(x, a, b) { return ibeta(a, b, x); }
  // Beta density; returns 0 outside (0,1) so quadrature over [0,1] is safe.
  function dbeta(x, a, b) {
    if (x <= 0 || x >= 1) return 0;
    return Math.exp((a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x) - lbeta(a, b));
  }

  /* ---- normal (machine precision, matches R pnorm/qnorm) ---- */
  function gser(a, x) {
    var ITMAX = 500, EPS = 3e-16, gln = lgamma(a), ap = a, sum = 1 / a, del = sum;
    for (var n = 1; n <= ITMAX; n++) { ap += 1; del *= x / ap; sum += del;
      if (Math.abs(del) < Math.abs(sum) * EPS) break; }
    return sum * Math.exp(-x + a * Math.log(x) - gln);
  }
  function gcf(a, x) {
    var ITMAX = 500, EPS = 3e-16, FPMIN = 1e-300;
    var gln = lgamma(a), b = x + 1 - a, c = 1 / FPMIN, d = 1 / b, h = d;
    for (var i = 1; i <= ITMAX; i++) {
      var an = -i * (i - a); b += 2;
      d = an * d + b; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = b + an / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d; var del = d * c; h *= del;
      if (Math.abs(del - 1) < EPS) break;
    }
    return Math.exp(-x + a * Math.log(x) - gln) * h;
  }
  function gammq(a, x) {
    if (x < 0 || a <= 0) return NaN;
    if (x === 0) return 1;
    return x < a + 1 ? 1 - gser(a, x) : gcf(a, x);
  }
  function erfc(x) { return x >= 0 ? gammq(0.5, x * x) : 2 - gammq(0.5, x * x); }
  function pnorm(z) { return 0.5 * erfc(-z / Math.SQRT2); }
  function dnorm(z) { return Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI); }
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
    var plow = 0.02425, phigh = 1 - plow, q, x;
    if (p < plow) {
      q = Math.sqrt(-2 * Math.log(p));
      x = (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
    } else if (p <= phigh) {
      q = p - 0.5; var r = q * q;
      x = (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q / (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
    } else {
      q = Math.sqrt(-2 * Math.log(1 - p));
      x = -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
    }
    var e = pnorm(x) - p, u = e * Math.sqrt(2 * Math.PI) * Math.exp(x * x / 2);
    return x - u / (1 + x * u / 2);
  }

  /* ---- composite Simpson quadrature (for the Bayesian integrals) ----
     Beta posteriors are narrow peaks; a coarse adaptive scheme starting on
     [0,1] samples only the flat tails and misses the peak, so we integrate a
     FIXED, dense grid over a peak-focused range (mean +/- k sd, clipped). */
  function simpsonN(f, a, b, N) {
    if (!(b > a)) return 0;
    if (N % 2) N++;
    var h = (b - a) / N, s = f(a) + f(b), i;
    for (i = 1; i < N; i++) s += (i & 1 ? 4 : 2) * f(a + i * h);
    return s * h / 3;
  }
  function betaMoments(a, b) {
    var s = a + b;
    return { m: a / s, sd: Math.sqrt(a * b / (s * s * (s + 1))) };
  }

  /* ---- FREQ: two-proportion z-test (matches prop.test correct=FALSE) ----
     Sign: lift = pB - pA. tail: 2 = two-sided, 1 = one-sided (B > A). */
  function twoProp(cA, nA, cB, nB, alpha, tail) {
    var pa = cA / nA, pb = cB / nB, diff = pb - pa;
    var ppool = (cA + cB) / (nA + nB);
    var seH0 = Math.sqrt(ppool * (1 - ppool) * (1 / nA + 1 / nB));
    var z, p;
    if (seH0 === 0) { z = 0; p = 1; }
    else {
      z = diff / seH0;
      p = (tail === 2) ? 2 * pnorm(-Math.abs(z)) : (1 - pnorm(z));
    }
    var seCi = Math.sqrt(pa * (1 - pa) / nA + pb * (1 - pb) / nB);
    var ciLo, ciHi;
    if (tail === 2) {
      var zc = qnorm(1 - alpha / 2);
      ciLo = diff - zc * seCi; ciHi = diff + zc * seCi;
    } else {
      var zc1 = qnorm(1 - alpha);
      ciLo = diff - zc1 * seCi; ciHi = 1;
    }
    return { pa: pa, pb: pb, diff: diff, relDiff: pa !== 0 ? diff / pa : Infinity,
             z: z, chisq: z * z, p: p, ciLo: ciLo, ciHi: ciHi,
             ciLevel: 1 - alpha, seH0: seH0, seCi: seCi, tail: tail };
  }

  /* ---- PLAN: sample size (matches pwr.2p.test, arcsine) ----
     Replicates pwr's exact power body incl. the two-sided opposite tail. */
  function esh(p1, p2) { return 2 * Math.asin(Math.sqrt(p1)) - 2 * Math.asin(Math.sqrt(p2)); }
  function powerAtN(h, n, alpha, tail) {
    var ncp = h * Math.sqrt(n / 2);
    if (tail === 2) {
      var qa = qnorm(1 - alpha / 2);
      return pnorm(ncp - qa) + pnorm(-qa - ncp);   // upper + lower tail
    }
    return pnorm(ncp - qnorm(1 - alpha));            // one-sided (B > A)
  }
  function sampleSize(p1, p2, alpha, power, tail) {
    var h = Math.abs(esh(p1, p2));
    if (h === 0) return { h: 0, n: Infinity, nCeil: Infinity, p1: p1, p2: p2 };
    // bisection for n in [2, 1e9] on powerAtN(n) - power (monotone increasing in n)
    var lo = 2 + 1e-10, hi = 1e9;
    for (var i = 0; i < 200; i++) {
      var mid = (lo + hi) / 2;
      if (powerAtN(h, mid, alpha, tail) < power) lo = mid; else hi = mid;
      if (hi - lo < 1e-8) break;
    }
    var n = (lo + hi) / 2;
    return { h: h, n: n, nCeil: Math.ceil(n), p1: p1, p2: p2 };
  }

  /* ---- BAYES: deterministic beta-binomial ----
     Prior Beta(a0,b0). Posteriors A~Beta(a1,b1), B~Beta(a2,b2).
     P(B>A), mean lift, 95% credible interval of D=pB-pA, and the exact
     closed-form Bayes factor (rates differ vs equal). */
  function bayes(cA, nA, cB, nB, a0, b0) {
    a0 = (a0 && a0 > 0) ? a0 : 1;
    b0 = (b0 && b0 > 0) ? b0 : 1;
    var a1 = a0 + cA, b1 = b0 + nA - cA;
    var a2 = a0 + cB, b2 = b0 + nB - cB;
    var mA = betaMoments(a1, b1), mB = betaMoments(a2, b2);
    // sd half-width K=24 keeps the truncated Beta tail below ~1e-11 even for
    // J-shaped posteriors (e.g. cB=0 -> Beta(1, nB+1) with an exp tail).
    var K = 24;
    // P(B > A) = int dbeta(x;a2,b2) * pbeta(x;a1,b1) dx over B's support
    var loB = Math.max(0, mB.m - K * mB.sd), hiB = Math.min(1, mB.m + K * mB.sd);
    var pBbetter = simpsonN(function (x) { return dbeta(x, a2, b2) * pbeta(x, a1, b1); }, loB, hiB, 6000);
    pBbetter = Math.min(1, Math.max(0, pBbetter));
    var meanLift = a2 / (a2 + b2) - a1 / (a1 + b1);
    // CDF of D = pB - pA:  P(D<=d) = int dbeta(a;a1,b1) * pbeta(a+d;a2,b2) da over A's support
    var loA = Math.max(0, mA.m - K * mA.sd), hiA = Math.min(1, mA.m + K * mA.sd);
    // P(D<=d) = int dbeta(a;a1,b1) * pbeta(a+d;a2,b2) da. The pbeta clamp at
    // a+d=0 and a+d=1 introduces kinks; integrate the smooth interior on its
    // own (a+d strictly in (0,1)) so Simpson keeps O(h^4), plus the flat tail.
    function cdfD(d) {
      var lo = Math.max(loA, -d), hiSmooth = Math.min(hiA, 1 - d), val = 0;
      if (hiSmooth > lo)
        val += simpsonN(function (a) { return dbeta(a, a1, b1) * pbeta(a + d, a2, b2); }, lo, hiSmooth, 1500);
      var loTail = Math.max(loA, 1 - d);   // here a+d>1 => pbeta=1 => integrand=dbeta(a)
      if (hiA > loTail)
        val += simpsonN(function (a) { return dbeta(a, a1, b1); }, loTail, hiA, 400);
      return val;
    }
    function quantD(target) {
      var lo = -1, hi = 1, mid;
      for (var i = 0; i < 40; i++) {
        mid = (lo + hi) / 2;
        if (cdfD(mid) < target) lo = mid; else hi = mid;
        if (hi - lo < 1e-10) break;
      }
      return (lo + hi) / 2;
    }
    var crLo = quantD(0.025), crHi = quantD(0.975);
    // BF10 = B(a1,b1)B(a2,b2) / [B(a0,b0) B(a0+cA+cB, b0+nA+nB-cA-cB)]
    var lbf = lbeta(a1, b1) + lbeta(a2, b2) - lbeta(a0, b0) -
              lbeta(a0 + cA + cB, b0 + nA + nB - cA - cB);
    return { a1: a1, b1: b1, a2: a2, b2: b2, a0: a0, b0: b0,
             pBbetter: pBbetter, meanLift: meanLift, crLo: crLo, crHi: crHi,
             bf10: Math.exp(lbf) };
  }

  /* ---- SEQUENTIAL: Pocock constant boundaries -> per-look nominal alpha ----
     Constants: Jennison & Turnbull (2000), Group Sequential Methods, Table 2.1
     (Pocock 1977). c_K is the constant two-sided z-boundary for K equally
     spaced looks; per-look nominal alpha = 2*(1 - Phi(c_K)). */
  var POCOCK = {
    '0.05': { 1: 1.960, 2: 2.178, 3: 2.289, 4: 2.361, 5: 2.413,
              6: 2.453, 7: 2.485, 8: 2.512, 9: 2.535, 10: 2.555 },
    '0.01': { 1: 2.576, 2: 2.772, 3: 2.873, 4: 2.939, 5: 2.986,
              6: 3.023, 7: 3.053, 8: 3.078, 9: 3.099, 10: 3.117 },
    '0.10': { 1: 1.645, 2: 1.875, 3: 1.992, 4: 2.067, 5: 2.122,
              6: 2.164, 7: 2.197, 8: 2.225, 9: 2.249, 10: 2.270 }
  };
  function pocockKey(alpha) {
    if (Math.abs(alpha - 0.01) < 1e-9) return '0.01';
    if (Math.abs(alpha - 0.10) < 1e-9) return '0.10';
    return '0.05';
  }
  function pocockNominal(K, alpha) {
    var tbl = POCOCK[pocockKey(alpha)];
    K = Math.max(1, Math.min(10, Math.round(K)));
    var ck = tbl[K];
    return { K: K, alpha: alpha, ck: ck, nominal: 2 * (1 - pnorm(ck)) };
  }

  return {
    lgamma: lgamma, lbeta: lbeta, ibeta: ibeta, pbeta: pbeta, dbeta: dbeta,
    pnorm: pnorm, dnorm: dnorm, qnorm: qnorm, simpsonN: simpsonN,
    esh: esh, powerAtN: powerAtN,
    twoProp: twoProp, sampleSize: sampleSize, bayes: bayes,
    pocockNominal: pocockNominal, POCOCK: POCOCK
  };
}));
