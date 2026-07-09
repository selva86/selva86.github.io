/* classification-math.js - exact confusion-matrix metrics for Tool Farm v2.
   Ground truth: R 4.6.0 caret::confusionMatrix() + binom.test/mcnemar.test
   (see Scripts/tool-truth/confusion-matrix-interpreter.json).
   Accuracy CI is Clopper-Pearson exact (as caret), NOT Wilson. Adds the
   No-Information-Rate p-value and McNemar's test that caret prints.
   Works in browser (window.ClassificationMath) and Node (module.exports). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ClassificationMath = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ---- special functions (self-contained) --------------------------------
  function lgamma(x) {
    var c = [76.18009172947146, -86.50532032941677, 24.01409824083091,
             -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
    var y = x, t = x + 5.5;
    t -= (x + 0.5) * Math.log(t);
    var s = 1.000000000190015;
    for (var j = 0; j < 6; j++) s += c[j] / ++y;
    return -t + Math.log(2.5066282746310005 * s / x);
  }
  // regularized incomplete beta I_x(a,b), continued fraction (Numerical Recipes)
  function betacf(a, b, x) {
    var MAXIT = 400, EPS = 3e-15, FPMIN = 1e-300;
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
  // inverse regularized incomplete beta (bisection; I_x is monotone in x)
  function qbeta(p, a, b) {
    if (p <= 0) return 0;
    if (p >= 1) return 1;
    var lo = 0, hi = 1, mid;
    for (var i = 0; i < 200; i++) {
      mid = 0.5 * (lo + hi);
      if (ibeta(a, b, mid) < p) lo = mid; else hi = mid;
      if (hi - lo < 1e-15) break;
    }
    return 0.5 * (lo + hi);
  }
  // regularized upper incomplete gamma Q(a,x) -> chisq upper tail
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
  function gammq(a, x) { if (x < 0 || a <= 0) return NaN; if (x === 0) return 1; return x < a + 1 ? 1 - gser(a, x) : gcf(a, x); }
  // pchisq(x, df, lower.tail=FALSE)
  function pchisqUpper(x, df) { if (!isFinite(x)) return NaN; return gammq(df / 2, x / 2); }

  // ---- shared building blocks --------------------------------------------
  // Clopper-Pearson exact CI for x successes of n (matches R binom.test$conf.int)
  function accuracyCI(x, n, conf) {
    var a = 1 - conf, lo, hi;
    lo = (x === 0) ? 0 : qbeta(a / 2, x, n - x + 1);
    hi = (x === n) ? 1 : qbeta(1 - a / 2, x + 1, n - x);
    return [lo, hi];
  }
  // one-sided binom.test p-value P(X >= x), X~Binom(n, p0)  (Acc > NIR)
  function accPValue(x, n, p0) {
    if (x <= 0) return 1;
    if (x > n) return 0;
    return ibeta(x, n - x + 1, p0);   // I_{p0}(x, n-x+1) = P(X >= x)
  }
  // McNemar's test p-value from a square count matrix M (pred x ref).
  // 2x2 gets Yates continuity correction when discordant (matches mcnemar.test).
  function mcnemarP(M) {
    var k = M.length, i, j, anyDiff = false;
    for (i = 0; i < k; i++) for (j = 0; j < k; j++) if (M[i][j] !== M[j][i]) anyDiff = true;
    var correct = (k === 2 && anyDiff), stat = 0;
    for (i = 0; i < k; i++) for (j = i + 1; j < k; j++) {
      var diff = M[i][j] - M[j][i];
      var y = correct ? (Math.abs(diff) - 1) : diff;
      var s = M[i][j] + M[j][i];
      stat += (y * y) / s;   // s==0 & y==0 -> NaN, propagates (as in R)
    }
    return pchisqUpper(stat, k * (k - 1) / 2);
  }

  function fbeta(precision, recall, beta) {
    var b2 = beta * beta, den = b2 * precision + recall;
    return den > 0 ? (1 + b2) * precision * recall / den : NaN;
  }

  // ---- binary --------------------------------------------------------------
  // Inputs are counts with the caret/epi convention:
  //   TP = predicted +, actual +;  FP = predicted +, actual -
  //   FN = predicted -, actual +;  TN = predicted -, actual -
  function binary(TP, FP, FN, TN, conf) {
    conf = conf || 0.95;
    var N = TP + FP + FN + TN;
    if (N === 0) return null;
    var correct = TP + TN;
    var accuracy = correct / N;
    var sensitivity = (TP + FN) > 0 ? TP / (TP + FN) : NaN;   // recall (+)
    var specificity = (TN + FP) > 0 ? TN / (TN + FP) : NaN;
    var precision   = (TP + FP) > 0 ? TP / (TP + FP) : NaN;   // PPV
    var npv         = (TN + FN) > 0 ? TN / (TN + FN) : NaN;
    var f1  = fbeta(precision, sensitivity, 1);
    var f05 = fbeta(precision, sensitivity, 0.5);
    var f2  = fbeta(precision, sensitivity, 2);
    var balancedAccuracy = (isFinite(sensitivity) && isFinite(specificity)) ? (sensitivity + specificity) / 2 : NaN;
    var prevalence = (TP + FN) / N;
    var detectionRate = TP / N;
    var detectionPrevalence = (TP + FP) / N;
    // Cohen's kappa
    var po = accuracy;
    var pe = (((TP + FP) * (TP + FN)) + ((FN + TN) * (FP + TN))) / (N * N);
    var kappa = (1 - pe) !== 0 ? (po - pe) / (1 - pe) : NaN;
    // Matthews correlation
    var mccDen = Math.sqrt((TP + FP) * (TP + FN) * (TN + FP) * (TN + FN));
    var mcc = mccDen > 0 ? (TP * TN - FP * FN) / mccDen : NaN;
    // likelihood ratios
    var lrPlus  = (isFinite(specificity) && (1 - specificity) > 0) ? sensitivity / (1 - specificity) : (sensitivity > 0 ? Infinity : NaN);
    var lrMinus = (isFinite(specificity) && specificity > 0) ? (1 - sensitivity) / specificity : NaN;
    // no-information rate = the larger reference-class share
    var nir = Math.max(TP + FN, FP + TN) / N;
    var ci = accuracyCI(correct, N, conf);
    return {
      TP: TP, FP: FP, FN: FN, TN: TN, N: N, correct: correct,
      accuracy: accuracy, accuracyLower: ci[0], accuracyUpper: ci[1],
      nir: nir, accPValue: accPValue(correct, N, nir), mcnemarP: mcnemarP([[TN, FN], [FP, TP]]),
      kappa: kappa, mcc: mcc,
      sensitivity: sensitivity, recall: sensitivity, specificity: specificity,
      precision: precision, ppv: precision, npv: npv,
      f1: f1, f0_5: f05, f2: f2,
      balancedAccuracy: balancedAccuracy, prevalence: prevalence,
      detectionRate: detectionRate, detectionPrevalence: detectionPrevalence,
      lrPlus: lrPlus, lrMinus: lrMinus
    };
  }

  // ---- multi-class ---------------------------------------------------------
  // M is a k x k matrix, M[pred][ref].
  function multi(M, conf) {
    conf = conf || 0.95;
    var k = M.length, i, j, r, c;
    var N = 0; for (i = 0; i < k; i++) for (j = 0; j < k; j++) N += M[i][j];
    if (N === 0) return null;
    var rowSums = [], colSums = [], correct = 0;
    for (i = 0; i < k; i++) { rowSums[i] = 0; colSums[i] = 0; }
    for (i = 0; i < k; i++) for (j = 0; j < k; j++) { rowSums[i] += M[i][j]; colSums[j] += M[i][j]; }
    for (i = 0; i < k; i++) correct += M[i][i];
    var accuracy = correct / N;
    var perClass = [];
    for (i = 0; i < k; i++) {
      var TP = M[i][i], FP = rowSums[i] - TP, FN = colSums[i] - TP, TN = N - TP - FP - FN;
      var sens = (TP + FN) > 0 ? TP / (TP + FN) : NaN;
      var spec = (TN + FP) > 0 ? TN / (TN + FP) : NaN;
      var prec = (TP + FP) > 0 ? TP / (TP + FP) : NaN;
      var npv  = (TN + FN) > 0 ? TN / (TN + FN) : NaN;
      perClass.push({
        index: i, TP: TP, FP: FP, FN: FN, TN: TN, support: colSums[i],
        sensitivity: sens, recall: sens, specificity: spec, precision: prec, ppv: prec, npv: npv,
        f1: fbeta(prec, sens, 1),
        balancedAccuracy: (isFinite(sens) && isFinite(spec)) ? (sens + spec) / 2 : NaN
      });
    }
    function mmean(sel) { var s = 0, n = 0; for (i = 0; i < k; i++) { var v = sel(perClass[i]); if (isFinite(v)) { s += v; n++; } } return n ? s / n : NaN; }
    function wmean(sel) { var s = 0, w = 0; for (i = 0; i < k; i++) { var v = sel(perClass[i]), sp = perClass[i].support; if (isFinite(v)) { s += v * sp; w += sp; } } return w ? s / w : NaN; }
    var macroPrecision = mmean(function (p) { return p.precision; });
    var macroRecall = mmean(function (p) { return p.recall; });
    var macroF1 = mmean(function (p) { return p.f1; });
    var weightedPrecision = wmean(function (p) { return p.precision; });
    var weightedRecall = wmean(function (p) { return p.recall; });
    var weightedF1 = wmean(function (p) { return p.f1; });
    var balancedAccuracy = mmean(function (p) { return p.sensitivity; });
    // Cohen's kappa
    var pe = 0; for (i = 0; i < k; i++) pe += (rowSums[i] * colSums[i]) / (N * N);
    var kappa = (1 - pe) !== 0 ? (accuracy - pe) / (1 - pe) : NaN;
    // Gorodkin multi-class MCC
    var num = 0, dt = 0, dp = 0;
    for (i = 0; i < k; i++) { num += N * M[i][i] - rowSums[i] * colSums[i]; dt += colSums[i] * (N - colSums[i]); dp += rowSums[i] * (N - rowSums[i]); }
    var mcc = (dt > 0 && dp > 0) ? num / Math.sqrt(dt * dp) : NaN;
    var nir = Math.max.apply(null, colSums) / N;
    var ci = accuracyCI(correct, N, conf);
    return {
      k: k, N: N, correct: correct,
      accuracy: accuracy, accuracyLower: ci[0], accuracyUpper: ci[1],
      nir: nir, accPValue: accPValue(correct, N, nir), mcnemarP: mcnemarP(M),
      kappa: kappa, mcc: mcc, microF1: accuracy,
      macroPrecision: macroPrecision, macroRecall: macroRecall, macroF1: macroF1,
      weightedPrecision: weightedPrecision, weightedRecall: weightedRecall, weightedF1: weightedF1,
      balancedAccuracy: balancedAccuracy,
      rowSums: rowSums, colSums: colSums, perClass: perClass
    };
  }

  return {
    lgamma: lgamma, ibeta: ibeta, qbeta: qbeta, gammq: gammq, pchisqUpper: pchisqUpper,
    accuracyCI: accuracyCI, accPValue: accPValue, mcnemarP: mcnemarP, fbeta: fbeta,
    binary: binary, multi: multi
  };
}));
