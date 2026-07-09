/* power-math.js - exact statistical-power math for Tool Farm v2.
   Ground truth: R 4.6.0 `pwr` package (see Scripts/tool-truth/power-analysis.json).
   Every design matches the pwr function it emulates:
     oneT/twoT/paired -> pwr.t.test / pwr.t2n.test  (exact noncentral t, AS 243)
     oneProp          -> pwr.p.test                 (arcsine normal approx, ncp = h*sqrt(n))
     twoProp          -> pwr.2p.test                (arcsine normal approx, ncp = h*sqrt(n/2))
     anova            -> pwr.anova.test             (noncentral F)
     correlation      -> pwr.r.test                 (Fisher-z approximation)
     chisq            -> pwr.chisq.test             (noncentral chi-square)
   Works in browser (window.PowerMath) and Node (module.exports). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PowerMath = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ---- log-gamma (Lanczos) ----
  function lgamma(x) {
    var c = [76.18009172947146, -86.50532032941677, 24.01409824083091,
             -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
    var y = x, t = x + 5.5;
    t -= (x + 0.5) * Math.log(t);
    var s = 1.000000000190015;
    for (var j = 0; j < 6; j++) s += c[j] / ++y;
    return -t + Math.log(2.5066282746310005 * s / x);
  }

  // ---- regularized incomplete beta I_x(a,b) ----
  function betacf(a, b, x) {
    var MAXIT = 500, EPS = 3e-16, FPMIN = 1e-300;
    var qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    d = 1 / d; var h = d, m, m2, aa, del;
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
  function ibeta(a, b, x) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    var lbeta = lgamma(a + b) - lgamma(a) - lgamma(b);
    var front = Math.exp(Math.log(x) * a + Math.log(1 - x) * b + lbeta);
    if (x < (a + 1) / (a + b + 2)) return front * betacf(a, b, x) / a;
    return 1 - front * betacf(b, a, 1 - x) / b;
  }

  // ---- regularized lower incomplete gamma P(a,x) ----
  function gser(a, x) {
    var ITMAX = 500, EPS = 3e-16, gln = lgamma(a), ap = a, sum = 1 / a, del = sum;
    for (var n = 1; n <= ITMAX; n++) { ap += 1; del *= x / ap; sum += del; if (Math.abs(del) < Math.abs(sum) * EPS) break; }
    return sum * Math.exp(-x + a * Math.log(x) - gln);
  }
  function gcf(a, x) {
    var ITMAX = 500, EPS = 3e-16, FPMIN = 1e-300, gln = lgamma(a), b = x + 1 - a, c = 1 / FPMIN, d = 1 / b, h = d;
    for (var i = 1; i <= ITMAX; i++) {
      var an = -i * (i - a); b += 2;
      d = an * d + b; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = b + an / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d; var del = d * c; h *= del;
      if (Math.abs(del - 1) < EPS) break;
    }
    return Math.exp(-x + a * Math.log(x) - gln) * h;
  }
  function pgamma(a, x) { if (x <= 0) return 0; return x < a + 1 ? gser(a, x) : 1 - gcf(a, x); }
  function gammq(a, x) { if (x <= 0) return 1; return x < a + 1 ? 1 - gser(a, x) : gcf(a, x); }

  // ---- normal CDF / quantile (machine precision; matches R pnorm/qnorm) ----
  function erfc(x) { return x >= 0 ? gammq(0.5, x * x) : 2 - gammq(0.5, x * x); }
  function pnorm(z) { return 0.5 * erfc(-z / Math.SQRT2); }
  function qnorm(p) {
    if (p <= 0) return -Infinity; if (p >= 1) return Infinity;
    var a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
    var b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
    var c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
    var d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
    var plow = 0.02425, phigh = 1 - plow, q, r, x;
    if (p < plow) { q = Math.sqrt(-2 * Math.log(p)); x = (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1); }
    else if (p <= phigh) { q = p - 0.5; r = q * q; x = (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q / (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1); }
    else { q = Math.sqrt(-2 * Math.log(1 - p)); x = -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1); }
    var e = pnorm(x) - p, u = e * Math.sqrt(2 * Math.PI) * Math.exp(x * x / 2);
    return x - u / (1 + x * u / 2);
  }

  // ---- central F / chi-square CDFs + quantiles (bisection, ~machine precision) ----
  function pf(F, df1, df2) { if (F <= 0) return 0; return ibeta(df1 / 2, df2 / 2, df1 * F / (df1 * F + df2)); }
  function pchisq(x, df) { return pgamma(df / 2, x / 2); }
  function tCDF(t, df) { var x = df / (df + t * t), ib = 0.5 * ibeta(df / 2, 0.5, x); return t > 0 ? 1 - ib : ib; }
  function bisectQ(cdf, p, lo, hi) {
    for (var i = 0; i < 200; i++) { var mid = (lo + hi) / 2; if (cdf(mid) < p) lo = mid; else hi = mid; if ((hi - lo) <= Math.max(1e-12, Math.abs(hi) * 1e-13)) break; }
    return (lo + hi) / 2;
  }
  function qf(p, df1, df2) { return bisectQ(function (x) { return pf(x, df1, df2); }, p, 1e-9, 1e7); }
  function qchisq(p, df) { return bisectQ(function (x) { return pchisq(x, df); }, p, 1e-9, 1e7); }
  function qt(p, df) {
    if (p <= 0) return -Infinity; if (p >= 1) return Infinity; if (p === 0.5) return 0;
    return bisectQ(function (x) { return tCDF(x, df); }, p, -1e5, 1e5);
  }

  // ---- noncentral t CDF P(T <= t), exact (Algorithm AS 243, Lenth 1989; matches R pt(.,ncp)) ----
  function pt_nc(t, df, ncp) {
    if (!ncp) return tCDF(t, df);
    var negdel, tt, del, tnc;
    if (t >= 0) { negdel = false; tt = t; del = ncp; } else { negdel = true; tt = -t; del = -ncp; }
    var x = tt * tt / (tt * tt + df);
    if (x <= 0) { tnc = pnorm(-del); return negdel ? 1 - tnc : tnc; }
    var lambda = del * del;
    var p = 0.5 * Math.exp(-0.5 * lambda);
    var q = Math.sqrt(2 / Math.PI) * p * del;
    var s = 0.5 - p; if (s < 1e-7) s = -0.5 * Math.expm1(-0.5 * lambda);
    var a = 0.5, b = 0.5 * df;
    var rxb = Math.pow(1 - x, b);
    var albeta = 0.5 * Math.log(Math.PI) + lgamma(b) - lgamma(0.5 + b);
    var xodd = ibeta(a, b, x);
    var godd = 2 * rxb * Math.exp(a * Math.log(x) - albeta);
    var xeven = 1 - rxb, geven = b * x * rxb;
    tnc = p * xodd + q * xeven;
    for (var it = 1; it <= 1000; it++) {
      a += 1;
      xodd -= godd; xeven -= geven;
      godd *= x * (a + b - 1) / a;
      geven *= x * (a + b - 0.5) / (a + 0.5);
      p *= lambda / (2 * it); q *= lambda / (2 * it + 1);
      s -= p;
      tnc += p * xodd + q * xeven;
      if (Math.abs(2 * s * (xodd - godd)) < 1e-13) break;
    }
    tnc += pnorm(-del);
    tnc = Math.min(tnc, 1);
    return negdel ? 1 - tnc : tnc;
  }

  // ---- noncentral F CDF (Poisson mixture of incomplete betas) ----
  function pf_nc(F, df1, df2, ncp) {
    if (!ncp) return pf(F, df1, df2);
    if (F <= 0) return 0;
    var lambda = ncp / 2, x = df1 * F / (df1 * F + df2), sum = 0;
    var peak = Math.floor(lambda);
    var w0 = Math.exp(-lambda + peak * Math.log(lambda) - lgamma(peak + 1));
    var w = w0;
    for (var j = peak; j < peak + 2000; j++) {
      w = j === peak ? w0 : w * lambda / j;
      if (w < 1e-16 && j > peak) break;
      sum += w * ibeta(df1 / 2 + j, df2 / 2, x);
    }
    var bw = w0;
    for (var k = peak - 1; k >= 0; k--) { bw = bw * (k + 1) / lambda; if (bw < 1e-16) break; sum += bw * ibeta(df1 / 2 + k, df2 / 2, x); }
    return Math.min(1, Math.max(0, sum));
  }

  // ---- noncentral chi-square CDF (Poisson mixture of central chi-squares) ----
  function pchisq_nc(xv, df, ncp) {
    if (!ncp) return pchisq(xv, df);
    if (xv <= 0) return 0;
    var lambda = ncp / 2, sum = 0, peak = Math.floor(lambda);
    var w0 = Math.exp(-lambda + peak * Math.log(lambda) - lgamma(peak + 1)), w = w0;
    for (var j = peak; j < peak + 2000; j++) {
      w = j === peak ? w0 : w * lambda / j;
      if (w < 1e-16 && j > peak) break;
      sum += w * pchisq(xv, df + 2 * j);
    }
    var bw = w0;
    for (var k = peak - 1; k >= 0; k--) { bw = bw * (k + 1) / lambda; if (bw < 1e-16) break; sum += bw * pchisq(xv, df + 2 * k); }
    return Math.min(1, Math.max(0, sum));
  }

  // ---- Cohen's h for proportions ----
  function cohenH(p1, p2) { return 2 * (Math.asin(Math.sqrt(p1)) - Math.asin(Math.sqrt(p2))); }

  // ============================================================
  // Power per design (n is PER GROUP for twoT/anova/twoProp; TOTAL for chisq)
  // ============================================================
  function powerT(d, n, alpha, tail, ncp, df) {
    if (df < 1 || d === 0) return alpha;
    if (tail === 1) { var tc1 = qt(1 - alpha, df); return 1 - pt_nc(tc1, df, ncp); }
    var tc = qt(1 - alpha / 2, df);
    return 1 - pt_nc(tc, df, ncp) + pt_nc(-tc, df, ncp);
  }
  function powerOneSampleT(d, n, alpha, tail) {
    if (n < 2) return NaN;
    return powerT(Math.abs(d), n, alpha, tail, Math.abs(d) * Math.sqrt(n), n - 1);
  }
  function powerTwoSampleT(d, n, alpha, tail, ratio) {
    if (n < 2) return NaN;
    var k = (typeof ratio === 'number' && ratio > 0) ? ratio : 1;
    var n2 = n * k, df = n + n2 - 2, ncp = Math.abs(d) * Math.sqrt(n * k / (1 + k));
    return powerT(Math.abs(d), n, alpha, tail, ncp, df);
  }
  function powerPaired(d, n, alpha, tail, rPaired) {
    var r = (typeof rPaired === 'number') ? rPaired : 0.5;
    var denom = Math.sqrt(2 * (1 - r)), dz = denom > 0 ? d / denom : d;
    return powerOneSampleT(dz, n, alpha, tail);
  }
  function powerOneProp(h, n, alpha, tail) {
    if (n < 2) return NaN;
    var ncp = Math.abs(h) * Math.sqrt(n);
    if (tail === 1) return 1 - pnorm(qnorm(1 - alpha) - ncp);
    var zc = qnorm(1 - alpha / 2);
    return 1 - pnorm(zc - ncp) + pnorm(-zc - ncp);
  }
  function powerTwoProp(h, n, alpha, tail) {
    if (n < 2) return NaN;
    var ncp = Math.abs(h) * Math.sqrt(n / 2);   // pwr.2p.test: per-arm n, ncp = h*sqrt(n/2)
    if (tail === 1) return 1 - pnorm(qnorm(1 - alpha) - ncp);
    var zc = qnorm(1 - alpha / 2);
    return 1 - pnorm(zc - ncp) + pnorm(-zc - ncp);
  }
  function powerAnova(f, k, n, alpha) {
    if (k < 2 || n < 2 || f === 0) return alpha;
    var df1 = k - 1, df2 = k * n - k, ncp = f * f * k * n, fCrit = qf(1 - alpha, df1, df2);
    return 1 - pf_nc(fCrit, df1, df2, ncp);
  }
  function powerCorr(r, n, alpha, tail) {
    if (n < 4) return NaN;
    var df = n - 2, rr = Math.abs(r);
    var ttt = qt(1 - alpha / (tail === 2 ? 2 : 1), df);
    var rc = Math.sqrt(ttt * ttt / (ttt * ttt + df));
    var zr = Math.atanh(rr) + rr / (2 * (n - 1)), zrc = Math.atanh(rc), sN = Math.sqrt(n - 3);
    if (tail === 2) return pnorm((zr - zrc) * sN) + pnorm((-zr - zrc) * sN);
    return pnorm((zr - zrc) * sN);
  }
  function powerChisq(w, n, df, alpha) {
    if (n < 2 || w === 0 || df < 1) return alpha;
    var ncp = w * w * n, xCrit = qchisq(1 - alpha, df);
    return 1 - pchisq_nc(xCrit, df, ncp);
  }

  // dispatcher: p = {effect, n, alpha, tail, ratio, rPaired, k, df}
  function power(design, p) {
    var tail = p.tail || 2, a = p.alpha, n = p.n, e = p.effect;
    switch (design) {
      case 'oneT':        return powerOneSampleT(e, n, a, tail);
      case 'twoT':        return powerTwoSampleT(e, n, a, tail, p.ratio);
      case 'paired':      return powerPaired(e, n, a, tail, p.rPaired);
      case 'oneProp':     return powerOneProp(e, n, a, tail);
      case 'twoProp':     return powerTwoProp(e, n, a, tail);
      case 'anova':       return powerAnova(e, p.k, n, a);
      case 'correlation': return powerCorr(e, n, a, tail);
      case 'chisq':       return powerChisq(e, n, p.df, a);
    }
    return NaN;
  }

  // ============================================================
  // Solvers - continuous root find matching pwr's uniroot (returns fractional).
  // power() is monotone increasing in n, effect, and alpha for each design.
  // ============================================================
  var N_FLOOR = { oneT: 2, twoT: 2, paired: 2, oneProp: 2, twoProp: 2, anova: 2, correlation: 4, chisq: 1 };
  function rootMonotone(f, lo, hi, target) {
    // assumes f increasing; f(lo) < target <= f(hi). Returns x with f(x)=target.
    for (var i = 0; i < 200; i++) {
      var mid = 0.5 * (lo + hi), v = f(mid);
      if (v < target) lo = mid; else hi = mid;
      if ((hi - lo) <= Math.abs(hi) * 1e-11 + 1e-12) break;
    }
    return 0.5 * (lo + hi);
  }
  function solveN(design, params, target) {
    var floor = N_FLOOR[design] || 2;
    var f = function (n) { var v = power(design, Object.assign({}, params, { n: n })); return isFinite(v) ? v : 0; };
    var lo = floor + 1e-9;
    if (f(lo) >= target) return lo;
    var hi = Math.max(lo * 2, 8);
    while (f(hi) < target) { hi *= 2; if (hi > 1e9) return Infinity; }
    return rootMonotone(f, lo, hi, target);
  }
  function solveEffect(design, params, target) {
    var f = function (e) { var v = power(design, Object.assign({}, params, { effect: e })); return isFinite(v) ? v : 0; };
    var lo = 1e-6, hi = 1e-3;
    if (f(lo) >= target) return lo;
    while (f(hi) < target) { hi *= 2; if (hi > 1e4) return Infinity; }
    return rootMonotone(f, lo, hi, target);
  }
  function solveAlpha(design, params, target) {
    var f = function (al) { var v = power(design, Object.assign({}, params, { alpha: al })); return isFinite(v) ? v : 0; };
    var lo = 1e-12, hi = 0.5 - 1e-9;
    if (f(hi) < target) return NaN;      // unreachable even at alpha 0.5
    if (f(lo) >= target) return lo;
    return rootMonotone(f, lo, hi, target);
  }
  function solve(design, solveFor, params, target) {
    switch (solveFor) {
      case 'n':      return solveN(design, params, target);
      case 'effect': return solveEffect(design, params, target);
      case 'alpha':  return solveAlpha(design, params, target);
      case 'power':  return power(design, params);
    }
    return NaN;
  }

  return {
    lgamma: lgamma, ibeta: ibeta, pgamma: pgamma, pnorm: pnorm, qnorm: qnorm,
    pf: pf, pchisq: pchisq, tCDF: tCDF, qf: qf, qchisq: qchisq, qt: qt,
    pt_nc: pt_nc, pf_nc: pf_nc, pchisq_nc: pchisq_nc, cohenH: cohenH,
    powerOneSampleT: powerOneSampleT, powerTwoSampleT: powerTwoSampleT, powerPaired: powerPaired,
    powerOneProp: powerOneProp, powerTwoProp: powerTwoProp, powerAnova: powerAnova,
    powerCorr: powerCorr, powerChisq: powerChisq,
    power: power, solveN: solveN, solveEffect: solveEffect, solveAlpha: solveAlpha, solve: solve
  };
}));
