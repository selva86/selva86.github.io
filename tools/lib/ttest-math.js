/* ttest-math.js - exact t-test math for Tool Farm v2.
   Ground truth: R 4.6.0 t.test() (see Scripts/tool-truth/t-test.json).
   Works in browser (window.TTestMath) and Node (module.exports). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TTestMath = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Lanczos log-gamma
  function lgamma(x) {
    var c = [76.18009172947146, -86.50532032941677, 24.01409824083091,
             -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
    var y = x, t = x + 5.5;
    t -= (x + 0.5) * Math.log(t);
    var s = 1.000000000190015;
    for (var j = 0; j < 6; j++) s += c[j] / ++y;
    return -t + Math.log(2.5066282746310005 * s / x);
  }

  // regularized incomplete beta, continued fraction (Numerical Recipes)
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

  function ibeta(a, b, x) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    var bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b;
  }

  // two-tailed p for |T| >= |t|
  function pTwoTailed(t, df) {
    if (!isFinite(t)) return 0;
    if (t === 0) return 1;
    return ibeta(df / 2, 0.5, df / (df + t * t));
  }
  function tCDF(t, df) {
    var p2 = pTwoTailed(t, df);
    return t >= 0 ? 1 - p2 / 2 : p2 / 2;
  }
  function tQuantile(p, df) {
    var lo = -80, hi = 80, mid;
    for (var i = 0; i < 300; i++) {
      mid = (lo + hi) / 2;
      if (tCDF(mid, df) < p) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }
  function tPDF(t, df) {
    return Math.exp(lgamma((df + 1) / 2) - lgamma(df / 2)) /
           Math.sqrt(df * Math.PI) * Math.pow(1 + t * t / df, -(df + 1) / 2);
  }

  function sd(xs) {
    var n = xs.length, m = 0, i;
    for (i = 0; i < n; i++) m += xs[i];
    m /= n;
    var v = 0;
    for (i = 0; i < n; i++) v += (xs[i] - m) * (xs[i] - m);
    return Math.sqrt(v / (n - 1));
  }
  function mean(xs) {
    var s = 0;
    for (var i = 0; i < xs.length; i++) s += xs[i];
    return s / xs.length;
  }

  // alternative: 'two' | 'greater' | 'less'   conf: e.g. 0.95
  // Matches R t.test() semantics incl. one-sided CI bounds (Inf on the open side).
  function pAndCI(t, df, se, est, alternative, conf) {
    var p, lo, hi, tc;
    if (alternative === 'two') {
      p = pTwoTailed(t, df);
      tc = tQuantile(1 - (1 - conf) / 2, df);
      lo = est - tc * se; hi = est + tc * se;
    } else if (alternative === 'greater') {
      p = 1 - tCDF(t, df);
      tc = tQuantile(conf, df);
      lo = est - tc * se; hi = Infinity;
    } else {
      p = tCDF(t, df);
      tc = tQuantile(conf, df);
      lo = -Infinity; hi = est + tc * se;
    }
    return { p: p, ci: [lo, hi] };
  }

  // two-sample Welch from summary stats
  function welchSummary(m1, s1, n1, m2, s2, n2, alternative, conf) {
    var v1 = s1 * s1 / n1, v2 = s2 * s2 / n2, se = Math.sqrt(v1 + v2);
    var t = (m1 - m2) / se;
    var df = (v1 + v2) * (v1 + v2) / ((v1 * v1) / (n1 - 1) + (v2 * v2) / (n2 - 1));
    var r = pAndCI(t, df, se, m1 - m2, alternative, conf);
    var sp = Math.sqrt(((n1 - 1) * s1 * s1 + (n2 - 1) * s2 * s2) / (n1 + n2 - 2));
    return { t: t, df: df, p: r.p, ci: r.ci, d: (m1 - m2) / sp, se: se, est: m1 - m2 };
  }
  function welchRaw(xs, ys, alternative, conf) {
    return welchSummary(mean(xs), sd(xs), xs.length, mean(ys), sd(ys), ys.length, alternative, conf);
  }

  // one-sample vs mu
  function oneSampleSummary(m, s, n, mu, alternative, conf) {
    var se = s / Math.sqrt(n), t = (m - mu) / se, df = n - 1;
    var r = pAndCI(t, df, se, m, alternative, conf);   // R CIs are for the MEAN, not mean-mu
    return { t: t, df: df, p: r.p, ci: r.ci, d: (m - mu) / s, se: se, est: m };
  }
  function oneSampleRaw(xs, mu, alternative, conf) {
    return oneSampleSummary(mean(xs), sd(xs), xs.length, mu, alternative, conf);
  }

  // paired: one-sample on the differences x - y, CI on the mean difference
  function pairedRaw(xs, ys, alternative, conf) {
    var ds = xs.map(function (x, i) { return x - ys[i]; });
    var m = mean(ds), s = sd(ds), n = ds.length;
    var se = s / Math.sqrt(n), t = m / se, df = n - 1;
    var r = pAndCI(t, df, se, m, alternative, conf);
    return { t: t, df: df, p: r.p, ci: r.ci, d: m / s, se: se, est: m };
  }

  return {
    lgamma: lgamma, ibeta: ibeta, pTwoTailed: pTwoTailed, tCDF: tCDF,
    tQuantile: tQuantile, tPDF: tPDF, mean: mean, sd: sd,
    welchSummary: welchSummary, welchRaw: welchRaw,
    oneSampleSummary: oneSampleSummary, oneSampleRaw: oneSampleRaw,
    pairedRaw: pairedRaw
  };
}));
