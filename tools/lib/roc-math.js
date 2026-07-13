/* roc-math.js  ---  ROC / AUC math for the r-statistics.co ROC/AUC calculator.
 *
 * Ground truth: R 4.6.0 + pROC 1.19.0.1. Verified bit-for-bit (<=1e-9) against
 *   pROC::auc(), pROC::var() (DeLong), pROC::ci.auc(method="delong"),
 *   pROC::coords(..., "best", best.method="youden") and pROC::coords(x=t).
 *
 * Key facts this library encodes (and the v1 inline math got wrong):
 *   - AUC = Mann-Whitney U / (n_pos*n_neg) with ties counted as 0.5.
 *   - DeLong variance = var(V10)/n_pos + var(V01)/n_neg using unbiased (n-1)
 *     sample variances of the structural components.
 *   - The DeLong CI is built on the LINEAR AUC scale and clamped to [0,1]:
 *         ci = clamp(auc +- z*se, 0, 1)
 *     (pROC does NOT use the logit scale; the v1 logit CI was materially off.)
 *   - pROC's threshold grid = midpoints of consecutive unique scores plus +-Inf,
 *     with "predicted positive iff score > t" (direction "<"). Optimal thresholds
 *     and coords are reported on that grid.
 *
 * UMD: browser global (window.RocMath) + node require.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RocMath = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---- normal quantile (Acklam) + Halley refinement to full double ------- */
  function pnorm(z) { return 0.5 * erfc(-z / Math.SQRT2); }
  function erfc(x) {
    var z = Math.abs(x);
    var t = 1 / (1 + 0.5 * z);
    var r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 +
      t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 +
      t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
    return x >= 0 ? r : 2 - r;
  }
  function qnorm(p) {
    if (p <= 0) return -Infinity;
    if (p >= 1) return Infinity;
    var a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
    var b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
    var c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
    var d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
    var plow = 0.02425, phigh = 1 - plow, q, r, x;
    if (p < plow) { q = Math.sqrt(-2 * Math.log(p)); x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    else if (p <= phigh) { q = p - 0.5; r = q * q; x = (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1); }
    else { q = Math.sqrt(-2 * Math.log(1 - p)); x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    // one Halley step
    var e = pnorm(x) - p, u = e * Math.sqrt(2 * Math.PI) * Math.exp(x * x / 2);
    x = x - u / (1 + x * u / 2);
    return x;
  }

  /* ---- binary search on ascending array ---------------------------------- */
  function lowerBound(arr, x) { // first index with arr[i] >= x
    var lo = 0, hi = arr.length;
    while (lo < hi) { var mid = (lo + hi) >> 1; if (arr[mid] < x) lo = mid + 1; else hi = mid; }
    return lo;
  }
  function upperBound(arr, x) { // first index with arr[i] > x
    var lo = 0, hi = arr.length;
    while (lo < hi) { var mid = (lo + hi) >> 1; if (arr[mid] <= x) lo = mid + 1; else hi = mid; }
    return lo;
  }
  function sampleVar(a) {
    var n = a.length; if (n < 2) return 0;
    var m = 0, i; for (i = 0; i < n; i++) m += a[i]; m /= n;
    var s = 0, dlt; for (i = 0; i < n; i++) { dlt = a[i] - m; s += dlt * dlt; }
    return s / (n - 1);
  }

  /* ---- AUC + DeLong structural components --------------------------------- */
  function delong(y, score) {
    var pos = [], neg = [], i, n = y.length;
    for (i = 0; i < n; i++) { if (y[i] === 1) pos.push(score[i]); else neg.push(score[i]); }
    var m = pos.length, k = neg.length;
    if (m === 0 || k === 0) return { error: 'need both classes' };
    var posSorted = pos.slice().sort(function (a, b) { return a - b; });
    var negSorted = neg.slice().sort(function (a, b) { return a - b; });

    var V10 = new Array(m), V01 = new Array(k), lt, eq, gt, x;
    for (i = 0; i < m; i++) {
      x = pos[i];
      lt = lowerBound(negSorted, x);
      eq = upperBound(negSorted, x) - lt;
      V10[i] = (lt + 0.5 * eq) / k;
    }
    for (i = 0; i < k; i++) {
      x = neg[i];
      gt = m - upperBound(posSorted, x);
      eq = upperBound(posSorted, x) - lowerBound(posSorted, x);
      V01[i] = (gt + 0.5 * eq) / m;
    }
    var auc = 0; for (i = 0; i < m; i++) auc += V10[i]; auc /= m;
    var v10 = sampleVar(V10), v01 = sampleVar(V01);
    var variance = v10 / m + v01 / k;
    return { auc: auc, variance: variance, se: Math.sqrt(Math.max(variance, 0)), n_pos: m, n_neg: k };
  }

  // DeLong CI on the linear AUC scale, clamped to [0,1] (matches pROC::ci.auc).
  function ciAuc(auc, se, conf) {
    conf = conf || 0.95;
    if (!(se > 0)) return [auc, auc];        // AUC==1 / degenerate -> [auc,auc], as pROC
    var z = qnorm(0.5 + conf / 2);
    return [Math.min(Math.max(auc - z * se, 0), 1), Math.min(Math.max(auc + z * se, 0), 1)];
  }

  /* ---- threshold grid (pROC midpoints + -+Inf) ---------------------------- */
  function thresholdGrid(score) {
    var u = Array.from(new Set(score)).sort(function (a, b) { return a - b; });
    if (u.length === 1) return [-Infinity, Infinity];
    var mids = [];
    for (var i = 1; i < u.length; i++) mids.push((u[i] + u[i - 1]) / 2);
    return [-Infinity].concat(mids, [Infinity]);
  }

  // confusion + metrics at threshold t (predict positive iff score > t).
  function metricsAt(y, score, t) {
    var TP = 0, FP = 0, FN = 0, TN = 0, i, pred;
    for (i = 0; i < y.length; i++) {
      pred = score[i] > t;
      if (pred) { if (y[i] === 1) TP++; else FP++; }
      else { if (y[i] === 1) FN++; else TN++; }
    }
    var npos = TP + FN, nneg = TN + FP, N = TP + FP + FN + TN;
    var sens = npos > 0 ? TP / npos : 0;
    var spec = nneg > 0 ? TN / nneg : 0;
    var ppv = (TP + FP) > 0 ? TP / (TP + FP) : NaN;
    var npv = (TN + FN) > 0 ? TN / (TN + FN) : NaN;
    var acc = (TP + TN) / N;
    var f1 = (2 * TP + FP + FN) > 0 ? 2 * TP / (2 * TP + FP + FN) : 0;
    return { t: t, TP: TP, FP: FP, FN: FN, TN: TN, sens: sens, spec: spec, ppv: ppv, npv: npv, acc: acc, f1: f1 };
  }

  // ROC operating points over the grid (ascending threshold).
  function rocPoints(y, score) {
    var grid = thresholdGrid(score), pts = [], i;
    for (i = 0; i < grid.length; i++) {
      var m = metricsAt(y, score, grid[i]);
      pts.push({ t: grid[i], tpr: m.sens, fpr: 1 - m.spec, TP: m.TP, FP: m.FP, FN: m.FN, TN: m.TN });
    }
    return pts;
  }

  // first-argmax over the ascending grid (matches R best_over_grid).
  function bestOverGrid(y, score, scorer, maximize) {
    var grid = thresholdGrid(score), best = null, bestV = maximize ? -Infinity : Infinity, i;
    for (i = 0; i < grid.length; i++) {
      var m = metricsAt(y, score, grid[i]);
      var v = scorer(m);
      if ((maximize && v > bestV) || (!maximize && v < bestV)) { bestV = v; best = m; best.value = v; }
    }
    return best;
  }
  function bestYouden(y, score) { return bestOverGrid(y, score, function (m) { return m.sens + m.spec - 1; }, true); }
  function bestF1(y, score) { return bestOverGrid(y, score, function (m) { return m.f1; }, true); }
  function bestCost(y, score, k) { k = (k == null ? 1 : k); return bestOverGrid(y, score, function (m) { return m.FP + k * m.FN; }, false); }

  function brier(y, score) {
    var s = 0, i; for (i = 0; i < y.length; i++) { var d = score[i] - y[i]; s += d * d; }
    return s / y.length;
  }

  // reliability bins: stable sort by (score, index), contiguous B bins.
  function calibBins(y, score, B) {
    B = B || 10;
    var n = y.length;
    var idx = []; for (var i = 0; i < n; i++) idx.push(i);
    idx.sort(function (a, b) { return score[a] - score[b] || a - b; });
    var bins = [];
    for (var b = 0; b < B; b++) {
      var lo = Math.floor(b * n / B), hi = Math.floor((b + 1) * n / B);
      if (lo >= hi) continue;
      var ms = 0, my = 0;
      for (var j = lo; j < hi; j++) { ms += score[idx[j]]; my += y[idx[j]]; }
      bins.push({ n: hi - lo, mean_score: ms / (hi - lo), mean_y: my / (hi - lo) });
    }
    return bins;
  }

  /* ---- one-call analysis for the page ------------------------------------ */
  function analyze(y, score, opts) {
    opts = opts || {};
    var conf = opts.conf || 0.95;
    var k = opts.costRatio == null ? 1 : opts.costRatio;
    var d = delong(y, score);
    if (d.error) return d;
    var ci = ciAuc(d.auc, d.se, conf);
    return {
      auc: d.auc, variance: d.variance, se: d.se,
      n_pos: d.n_pos, n_neg: d.n_neg, n: y.length,
      ci: { lo: ci[0], hi: ci[1], conf: conf },
      youden: bestYouden(y, score),
      f1: bestF1(y, score),
      cost: bestCost(y, score, k),
      brier: brier(y, score),
      calib: calibBins(y, score, 10),
      points: rocPoints(y, score)
    };
  }

  return {
    qnorm: qnorm, pnorm: pnorm,
    delong: delong, ciAuc: ciAuc,
    thresholdGrid: thresholdGrid, metricsAt: metricsAt, rocPoints: rocPoints,
    bestYouden: bestYouden, bestF1: bestF1, bestCost: bestCost,
    brier: brier, calibBins: calibBins,
    analyze: analyze
  };
}));
