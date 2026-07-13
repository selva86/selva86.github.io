/* outlier-math.js - exact outlier-detection math for Tool Farm v2.
   Ground truth: R 4.6.0
     Grubbs      -> outliers::grubbs.test  (+ outliers:::qgrubbs for G_crit)
     ESD/Rosner  -> EnvStats::rosnerTest   (+ rosnerTestLambda)
     Hampel(MAD) -> stats::median / stats::mad (constant 1.4826)
     Tukey IQR   -> grDevices::boxplot.stats (fivenum hinges)
   See Scripts/tool-truth/outlier.json.
   t-distribution (pt/qt) reused from ttest-math.js.
   Works in browser (window.OutlierMath) and Node (module.exports). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./ttest-math.js'));
  } else {
    root.OutlierMath = factory(root.TTestMath);
  }
}(typeof self !== 'undefined' ? self : this, function (T) {
  'use strict';

  var pt = T.tCDF;        // Student-t CDF, pt(t, df)
  var qt = T.tQuantile;   // Student-t quantile, qt(p, df)

  // ---- basic sample statistics (R conventions) ----------------
  function mean(x) {
    var s = 0, i;
    for (i = 0; i < x.length; i++) s += x[i];
    return s / x.length;
  }
  // sample variance / sd (denominator n-1), matches R var()/sd()
  function variance(x) {
    var n = x.length, m = mean(x), s = 0, i;
    if (n < 2) return NaN;
    for (i = 0; i < n; i++) s += (x[i] - m) * (x[i] - m);
    return s / (n - 1);
  }
  function sd(x) { return Math.sqrt(variance(x)); }

  // R median(): sort, middle for odd n, average of two middle for even n
  function median(x) {
    var s = x.slice().sort(function (a, b) { return a - b; });
    var n = s.length, h = Math.floor(n / 2);
    return (n % 2) ? s[h] : (s[h - 1] + s[h]) / 2;
  }

  // R mad(x): constant * median(abs(x - center)), center = median(x)
  function mad(x, constant) {
    if (constant == null) constant = 1.4826;
    var c = median(x), i, dev = new Array(x.length);
    for (i = 0; i < x.length; i++) dev[i] = Math.abs(x[i] - c);
    return constant * median(dev);
  }

  // R fivenum(): Tukey hinges used by boxplot.stats
  function fivenum(x) {
    var s = x.slice().sort(function (a, b) { return a - b; });
    var n = s.length;
    var n4 = Math.floor((n + 3) / 2) / 2;
    var d = [1, n4, (n + 1) / 2, n + 1 - n4, n];
    var out = [], j, lo, hi;
    for (j = 0; j < 5; j++) {
      lo = Math.floor(d[j]); hi = Math.ceil(d[j]);
      out.push(0.5 * (s[lo - 1] + s[hi - 1]));   // 1-indexed -> 0-indexed
    }
    return out;
  }

  // =============================================================
  // Grubbs test for a single outlier (two-sided is the tool default)
  // Reproduces outliers::grubbs.test(x, type=10) p-values exactly.
  // =============================================================
  function grubbs(data, alpha) {
    if (alpha == null) alpha = 0.05;
    var x = data.slice().sort(function (a, b) { return a - b; });
    var n = x.length;
    var m = mean(x), s = sd(x);
    if (!(s > 0)) {
      return { n: n, mean: m, sd: s, G: NaN, U: NaN, low: false,
        extreme: NaN, pOne: NaN, pTwo: NaN, Gcrit: NaN, isOut: false,
        degenerate: true };
    }
    // extreme end: low if the min is farther from the mean than the max
    var low = (x[n - 1] - m) < (m - x[0]);
    var o = low ? x[0] : x[n - 1];
    var d = low ? x.slice(1) : x.slice(0, n - 1);
    var G = Math.abs(o - m) / s;
    var U = variance(d) / variance(x) * (n - 2) / (n - 1);

    // one-sided p from outliers:::qgrubbs(g,n,10,rev=TRUE)
    var num = G * G * n * (2 - n);
    var den = G * G * n - (n - 1) * (n - 1);
    var sVal = num / den;
    var t = Math.sqrt(sVal);
    var res;
    if (isNaN(t)) { res = 0; }
    else { res = n * (1 - pt(t, n - 2)); if (res > 1) res = 1; }
    var pOne = res;
    var pTwo = 2 * pOne;
    if (pTwo > 1) pTwo = 2 - pTwo;

    // critical G at alpha: outliers:::qgrubbs(alpha,n,10,rev=FALSE)
    var tc = qt((1 - alpha) / n, n - 2);
    var Gcrit = ((n - 1) / Math.sqrt(n)) *
      Math.sqrt(tc * tc / (n - 2 + tc * tc));

    return {
      n: n, mean: m, sd: s, G: G, U: U, low: low, extreme: o,
      pOne: pOne, pTwo: pTwo, Gcrit: Gcrit,
      isOut: pTwo < alpha, degenerate: false
    };
  }

  // Rosner lambda critical value for the k-th test (1-indexed k)
  // EnvStats:::rosnerTestLambda
  function rosnerLambda(n, k, alpha) {
    var l = k - 1;
    var p = 1 - ((alpha / 2) / (n - l));
    var tc = qt(p, n - l - 2);
    return tc * (n - l - 1) / Math.sqrt((n - l - 2 + tc * tc) * (n - l));
  }

  // =============================================================
  // Generalized ESD (Rosner) - up to k outliers.
  // Reproduces EnvStats::rosnerTest. Operates in input order,
  // tracks 1-based observation numbers (does NOT sort).
  // =============================================================
  function esd(data, k, alpha) {
    if (k == null) k = 3;
    if (alpha == null) alpha = 0.05;
    var n = data.length;
    k = Math.max(1, Math.min(k, n - 2));   // R requires 1 <= k <= n-2
    var work = data.slice();
    var idx = [];
    for (var q = 0; q < n; q++) idx.push(q + 1);  // 1-based obs numbers

    var stats = [];
    for (var i = 0; i < k; i++) {
      var m = mean(work), s = sd(work);
      if (!(s > 0)) break;   // R: R[i:k] <- NA; break
      var maxR = -Infinity, at = 0, j;
      for (j = 0; j < work.length; j++) {
        var az = Math.abs(work[j] - m) / s;
        if (az > maxR) { maxR = az; at = j; }   // first argmax (strict >)
      }
      var lam = rosnerLambda(n, i + 1, alpha);
      stats.push({
        i: i, mean: m, sd: s, value: work[at], obsNum: idx[at],
        R: maxR, lambda: lam, outlier: maxR > lam
      });
      work.splice(at, 1);
      idx.splice(at, 1);
    }
    // number of outliers = index of the last row flagged as outlier
    var lastOut = -1;
    for (var r = 0; r < stats.length; r++) if (stats[r].outlier) lastOut = r;
    for (var rr = 0; rr <= lastOut; rr++) stats[rr].outlier = true;
    var nOut = lastOut + 1;

    var outlierValues = [];
    for (var t2 = 0; t2 < nOut; t2++) outlierValues.push(stats[t2].value);

    return { n: n, k: k, nOut: nOut, stats: stats,
      outlierValues: outlierValues };
  }

  // =============================================================
  // Hampel filter (median +/- k * MAD)
  // =============================================================
  function hampel(data, k) {
    if (k == null) k = 3;
    var med = median(data), MAD = mad(data);
    var lo = med - k * MAD, hi = med + k * MAD;
    var flagged = [];
    for (var i = 0; i < data.length; i++) {
      if (Math.abs(data[i] - med) > k * MAD) flagged.push(data[i]);
    }
    flagged.sort(function (a, b) { return a - b; });
    return { n: data.length, median: med, mad: MAD, k: k,
      lo: lo, hi: hi, flagged: flagged, nFlagged: flagged.length };
  }

  // =============================================================
  // Tukey IQR (boxplot.stats, fivenum hinges)
  // =============================================================
  function tukey(data, coef) {
    if (coef == null) coef = 1.5;
    var fv = fivenum(data);
    var q1 = fv[1], q3 = fv[3], iqr = q3 - q1;
    var lo = q1 - coef * iqr, hi = q3 + coef * iqr;
    var flagged = [];
    for (var i = 0; i < data.length; i++) {
      if (data[i] < lo || data[i] > hi) flagged.push(data[i]);
    }
    flagged.sort(function (a, b) { return a - b; });
    return { n: data.length, five: fv, q1: q1, q3: q3, iqr: iqr,
      coef: coef, lo: lo, hi: hi, flagged: flagged,
      nFlagged: flagged.length };
  }

  // ---- dispatcher --------------------------------------------
  function analyze(data, method, params) {
    params = params || {};
    switch (method) {
      case 'grubbs': return grubbs(data, params.alpha);
      case 'esd':    return esd(data, params.k, params.alpha);
      case 'hampel': return hampel(data, params.k);
      case 'tukey':  return tukey(data, params.coef);
      default: throw new Error('unknown method ' + method);
    }
  }

  // ---- robust numeric parser (commas / spaces / newlines / tabs) ----
  function parseData(str) {
    if (str == null) return [];
    var toks = String(str).split(/[\s,;]+/);
    var out = [], i, v;
    for (i = 0; i < toks.length; i++) {
      if (toks[i] === '') continue;
      v = Number(toks[i]);
      if (isFinite(v)) out.push(v);
    }
    return out;
  }

  return {
    mean: mean, variance: variance, sd: sd, median: median, mad: mad,
    fivenum: fivenum, rosnerLambda: rosnerLambda,
    grubbs: grubbs, esd: esd, hampel: hampel, tukey: tukey,
    analyze: analyze, parseData: parseData
  };
}));
