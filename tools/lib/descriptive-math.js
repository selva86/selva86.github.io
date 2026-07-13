/* descriptive-math.js - exact descriptive statistics for Tool Farm v2.
   Ground truth: R 4.6.0
     mean / median / sd / var        -> base R (sample, denominator n-1)
     quantile(type = 7)              -> base R default quantile
     skewness / kurtosis             -> e1071::skewness/kurtosis type = 3 (pkg default)
     CI of mean                      -> mean +/- qt(1-(1-lvl)/2, n-1) * sd/sqrt(n)
     fivenum                         -> stats::fivenum (Tukey hinges)
     histogram bins                  -> grDevices::nclass.FD / nclass.Sturges
     1.5*IQR fences                  -> q1 - 1.5*IQR, q3 + 1.5*IQR (type-7 quartiles)
   See Scripts/tool-truth/descriptive-statistics-calculator.json.
   t-quantile (qt) reused from ttest-math.js.
   Works in browser (window.DescriptiveMath) and Node (module.exports). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./ttest-math.js'));
  } else {
    root.DescriptiveMath = factory(root.TTestMath);
  }
}(typeof self !== 'undefined' ? self : this, function (T) {
  'use strict';

  var qt = T.tQuantile;   // Student-t quantile, qt(p, df)

  function sum(x) { var s = 0, i; for (i = 0; i < x.length; i++) s += x[i]; return s; }
  function mean(x) { return sum(x) / x.length; }

  // Central moment m_k = mean((x - mean)^k)
  function moments(x, m) {
    var n = x.length, m2 = 0, m3 = 0, m4 = 0, i, d, d2;
    for (i = 0; i < n; i++) {
      d = x[i] - m; d2 = d * d;
      m2 += d2; m3 += d2 * d; m4 += d2 * d2;
    }
    return { m2: m2 / n, m3: m3 / n, m4: m4 / n, ss: m2 };
  }

  // R quantile type 7 on a sorted array.
  function quantile7(sorted, p) {
    var n = sorted.length;
    if (n === 1) return sorted[0];
    var h = (n - 1) * p, lo = Math.floor(h), frac = h - lo;
    if (lo + 1 >= n) return sorted[n - 1];
    return sorted[lo] + frac * (sorted[lo + 1] - sorted[lo]);
  }

  function median(sorted) { return quantile7(sorted, 0.5); }

  // stats::fivenum (Tukey five-number summary) on a sorted array.
  function fivenum(sorted) {
    var n = sorted.length;
    if (n === 0) return [NaN, NaN, NaN, NaN, NaN];
    var n4 = Math.floor((n + 3) / 2) / 2;
    var d = [1, n4, (n + 1) / 2, n + 1 - n4, n], out = [], i, fl, cl;
    for (i = 0; i < 5; i++) {
      fl = Math.floor(d[i] - 1); cl = Math.ceil(d[i] - 1);
      out.push(0.5 * (sorted[fl] + sorted[cl]));
    }
    return out;
  }

  // R signif(x, 5): round to 5 significant digits (nclass.FD rounds first).
  function signif5(x) {
    if (x === 0 || !isFinite(x)) return x;
    var d = Math.ceil(Math.log(Math.abs(x)) / Math.LN10);
    var mag = Math.pow(10, 5 - d);
    return Math.round(x * mag) / mag;
  }

  // grDevices::nclass.FD as implemented in R 4.6 (uses signif(x,5), 2*IQR, a
  // shrinking-quantile fallback, then 3.5*sd). Returns null for n < 2, where
  // R's nclass.FD errors (var is NA), so the tool falls back to Sturges there.
  function fdBins(sorted) {
    var n = sorted.length, i, d;
    if (n < 2) return null;
    var xs = sorted.map(signif5).sort(function (a, b) { return a - b; });
    var h = 2 * (quantile7(xs, 0.75) - quantile7(xs, 0.25));
    if (h === 0) {
      var al = 1 / 4, alMin = 1 / 512;
      while (h === 0 && (al = al / 2) >= alMin)
        h = (quantile7(xs, 1 - al) - quantile7(xs, al)) / (1 - 2 * al);
    }
    if (h === 0) {
      var m = mean(sorted), ss = 0;
      for (i = 0; i < n; i++) { d = sorted[i] - m; ss += d * d; }
      h = 3.5 * Math.sqrt(ss / (n - 1));
    }
    if (h > 0) {
      var rng = sorted[n - 1] - sorted[0];
      return Math.ceil(rng / h * Math.pow(n, 1 / 3));
    }
    return 1;
  }

  // grDevices::nclass.Sturges
  function sturgesBins(n) { return Math.ceil(Math.log(n) / Math.log(2) + 1); }

  // Modes: value(s) at maximum frequency. If nothing repeats and n > 1 the
  // convention here is "no mode" (empty), matching the tool's on-page note.
  function modesOf(x) {
    var freq = {}, order = [], i, k, mx = 0;
    for (i = 0; i < x.length; i++) {
      k = x[i];
      if (freq[k] === undefined) { freq[k] = 0; order.push(k); }
      freq[k]++;
      if (freq[k] > mx) mx = freq[k];
    }
    var modes = [];
    for (i = 0; i < order.length; i++) if (freq[order[i]] === mx) modes.push(order[i]);
    modes.sort(function (a, b) { return a - b; });
    var hasMode = !(mx === 1 && x.length > 1);
    return { modes: hasMode ? modes : [], modeFreq: mx, nModes: hasMode ? modes.length : 0 };
  }

  /* Full descriptive summary of a clean numeric array (NA already removed).
     opts.level: confidence level for the reported CI of the mean (default .95).
     Returns null-valued fields where a statistic is undefined (n < 2, or a
     zero-variance sample for skewness/kurtosis), matching the R truth table. */
  function describe(data, opts) {
    opts = opts || {};
    var level = opts.level == null ? 0.95 : opts.level;
    var n = data.length;
    if (n === 0) return { n: 0, empty: true };

    var sorted = data.slice().sort(function (a, b) { return a - b; });
    var m = mean(data), sm = sum(data);
    var med = median(sorted);
    var mn = sorted[0], mx = sorted[n - 1], rng = mx - mn;
    var q1 = quantile7(sorted, 0.25), q3 = quantile7(sorted, 0.75), iqr = q3 - q1;

    var mo = (n > 1) ? moments(data, m) : null;
    var v = (n > 1) ? mo.ss / (n - 1) : null;         // sample variance
    var sd = (n > 1) ? Math.sqrt(v) : null;           // sample sd
    var varPop = (n > 0) ? (mo ? mo.m2 : 0) : null;   // population variance
    var sdPop = (n > 0) ? Math.sqrt(varPop) : null;
    var se = (n > 1) ? sd / Math.sqrt(n) : null;

    var skewness = null, kurtosis = null;
    if (n > 1 && mo.m2 > 0) {
      var g1 = mo.m3 / Math.pow(mo.m2, 1.5);
      skewness = g1 * Math.pow((n - 1) / n, 1.5);
      var g2 = mo.m4 / (mo.m2 * mo.m2);
      kurtosis = g2 * Math.pow((n - 1) / n, 2) - 3;
    }

    var ci = ciMean(m, sd, n, level);
    var cv = (sd !== null && m !== 0) ? sd / m : null;
    var cvPop = (sdPop !== null && m !== 0) ? sdPop / m : null;

    var five = fivenum(sorted);
    var fenceLo = q1 - 1.5 * iqr, fenceHi = q3 + 1.5 * iqr;
    var outliers = [], i;
    for (i = 0; i < n; i++) if (sorted[i] < fenceLo || sorted[i] > fenceHi) outliers.push(sorted[i]);
    var mo2 = modesOf(data);

    return {
      n: n, mean: m, sum: sm, median: med,
      sd: sd, var: v, sdPop: sdPop, varPop: varPop, se: se,
      level: level, ciLo: ci[0], ciHi: ci[1],
      min: mn, max: mx, range: rng,
      q1: q1, q3: q3, iqr: iqr,
      skewness: skewness, kurtosis: kurtosis,
      cv: cv, cvPop: cvPop,
      five: five, fenceLo: fenceLo, fenceHi: fenceHi,
      outliers: outliers, nOut: outliers.length,
      modes: mo2.modes, modeFreq: mo2.modeFreq, nModes: mo2.nModes,
      fdBins: fdBins(sorted), sturgesBins: sturgesBins(n),
      sorted: sorted
    };
  }

  // CI of the mean at a confidence level. Returns [null,null] for n < 2.
  function ciMean(m, sd, n, level) {
    if (n < 2 || sd === null) return [null, null];
    var tc = qt(1 - (1 - level) / 2, n - 1);
    var se = sd / Math.sqrt(n);
    return [m - tc * se, m + tc * se];
  }

  // Freedman-Diaconis histogram breaks (edges) for the viz. Falls back to a
  // small fixed count for degenerate samples so the chart never divides by 0.
  function histogram(sorted, binsOverride) {
    var n = sorted.length;
    if (n === 0) return { edges: [], counts: [], binWidth: 0 };
    var mn = sorted[0], mx = sorted[n - 1];
    if (mn === mx) {  // constant sample: one centred bin
      return { edges: [mn - 0.5, mn + 0.5], counts: [n], binWidth: 1 };
    }
    var k = binsOverride || fdBins(sorted) || sturgesBins(n);
    if (!isFinite(k) || k < 1) k = 1;
    if (k > 250) k = 250;
    var w = (mx - mn) / k, edges = [], counts = [], i, idx;
    for (i = 0; i <= k; i++) edges.push(mn + i * w);
    for (i = 0; i < k; i++) counts.push(0);
    for (i = 0; i < n; i++) {
      idx = Math.floor((sorted[i] - mn) / w);
      if (idx >= k) idx = k - 1; if (idx < 0) idx = 0;
      counts[idx]++;
    }
    return { edges: edges, counts: counts, binWidth: w };
  }

  return {
    sum: sum, mean: mean, median: median, quantile7: quantile7,
    fivenum: fivenum, fdBins: fdBins, sturgesBins: sturgesBins,
    modesOf: modesOf, ciMean: ciMean, describe: describe, histogram: histogram
  };
}));
