/* chisq-math.js - chi-square math for Tool Farm v2.
   Ground truth: R 4.6.0 chisq.test() / fisher.test()
   (see Scripts/tool-truth/chi-square-calculator.json).
   Depends on normal-math.js for the regularized incomplete gamma (gammq);
   in the browser it is read from the global, in Node via require.

   Return shapes match the page's legacy chiIndependence()/chiGoF() so the
   tool wires to the lib with no render changes:
     independence(tbl, yates) -> {chi, df, p, expected, stdres, residuals,
        contrib, cramerV, N, rowTot, colTot, R, C, yates, minExpected}
     goodnessOfFit(obs, exp)  -> {chi, df, p, expected, stdres, residuals,
        contrib, cohenW, N, k, minExpected}
   Conventions verified against R:
     - p = upper tail = gammq(df/2, chi/2)  (== pchisq(chi, df, lower.tail=FALSE))
     - stdres    == chisq.test()$stdres    (standardized / adjusted residuals)
     - residuals == chisq.test()$residuals (Pearson residuals, raw O-E)
     - Yates affects ONLY the statistic/p (not the residuals), 2x2 only.
     - Cramer's V uses the UNCORRECTED statistic: sqrt(X2 / (N*(min(r,c)-1)))
     - Cohen's w (GoF): sqrt(X2 / N) */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./normal-math.js'));
  } else {
    root.ChisqMath = factory(root.NormalMath);
  }
}(typeof self !== 'undefined' ? self : this, function (N) {
  'use strict';

  // ---- self-contained lgamma fallback (Lanczos) if NormalMath is absent ----
  function lgammaLocal(z) {
    var c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
             771.32342877765313, -176.61502916214059, 12.507343278686905,
             -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lgammaLocal(1 - z);
    z -= 1; var x = c[0];
    for (var i = 1; i < 9; i++) x += c[i] / (z + i);
    var t = z + 7.5;
    return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
  }
  var lgamma = (N && N.lgamma) ? N.lgamma : lgammaLocal;

  // Q(a,x) = 1 - P(a,x), upper regularized incomplete gamma.
  // Prefer NormalMath's near-machine-precision gammq; fall back to a local one.
  function gammqLocal(a, x) {
    if (x <= 0) return 1;
    if (x < a + 1) {                 // series for P, return 1 - P
      var sum = 1 / a, ap = a, del = sum;
      for (var n = 1; n <= 300; n++) { ap += 1; del *= x / ap; sum += del; if (Math.abs(del) < Math.abs(sum) * 1e-15) break; }
      return 1 - sum * Math.exp(-x + a * Math.log(x) - lgamma(a));
    }
    var fpmin = 1e-300, b = x + 1 - a, cc = 1 / fpmin, d = 1 / b, h = d; // continued fraction for Q
    for (var i = 1; i <= 300; i++) {
      var an = -i * (i - a);
      b += 2; d = an * d + b; if (Math.abs(d) < fpmin) d = fpmin;
      cc = b + an / cc; if (Math.abs(cc) < fpmin) cc = fpmin;
      d = 1 / d; var delc = d * cc; h *= delc; if (Math.abs(delc - 1) < 1e-15) break;
    }
    return h * Math.exp(-x + a * Math.log(x) - lgamma(a));
  }
  var gammq = (N && N.gammq) ? N.gammq : gammqLocal;

  // chi-square upper-tail p-value = Q(df/2, x/2). df,x > 0.
  function pchisqUpper(x, df) {
    if (x <= 0) return 1;
    if (df <= 0) return NaN;
    return gammq(df / 2, x / 2);
  }
  // chi-square CDF.
  function pchisq(x, df) { if (x <= 0 || df <= 0) return 0; return 1 - pchisqUpper(x, df); }
  // chi-square quantile via bisection on the CDF (parity helper; unused by core).
  function qchisq(p, df) {
    if (p <= 0) return 0;
    if (p >= 1) return Infinity;
    var lo = 0, hi = Math.max(df * 5, 100);
    while (pchisq(hi, df) < p && hi < 1e12) hi *= 2;
    for (var i = 0; i < 200; i++) {
      var mid = 0.5 * (lo + hi);
      if (pchisq(mid, df) < p) lo = mid; else hi = mid;
      if ((hi - lo) / Math.max(1, hi) < 1e-12) break;
    }
    return 0.5 * (lo + hi);
  }

  var BENCH = { small: 0.1, medium: 0.3, large: 0.5 };
  function magnitude(v) { return v < BENCH.small ? 'negligible' : v < BENCH.medium ? 'small' : v < BENCH.large ? 'medium' : 'large'; }

  // ---- test of independence / homogeneity (2-way table) ----
  function independence(tbl, yates) {
    var R = tbl.length, C = tbl[0].length, i, j;
    var rowTot = tbl.map(function (r) { return r.reduce(function (a, b) { return a + b; }, 0); });
    var colTot = [];
    for (j = 0; j < C; j++) { var s = 0; for (i = 0; i < R; i++) s += tbl[i][j]; colTot.push(s); }
    var Ntot = rowTot.reduce(function (a, b) { return a + b; }, 0);
    if (Ntot === 0) return { error: 'Empty table' };
    if (rowTot.some(function (t) { return t === 0; })) return { error: 'Empty row' };
    if (colTot.some(function (t) { return t === 0; })) return { error: 'Empty column' };

    var applyYates = !!yates && R === 2 && C === 2;
    var expected = [], stdres = [], residuals = [], contrib = [];
    var chi = 0, minExpected = Infinity;
    for (i = 0; i < R; i++) {
      expected.push([]); stdres.push([]); residuals.push([]); contrib.push([]);
      for (j = 0; j < C; j++) {
        var e = rowTot[i] * colTot[j] / Ntot;
        expected[i].push(e);
        if (e < minExpected) minExpected = e;
        var o = tbl[i][j];
        // Yates: R uses min(0.5, |o-e|) so the correction never overshoots.
        var dev = Math.abs(o - e);
        var devY = applyYates ? dev - Math.min(0.5, dev) : dev;
        var cell = (devY * devY) / e;
        chi += cell;
        contrib[i].push(cell);
        // residuals use the RAW deviation (R does not Yates-correct residuals)
        residuals[i].push((o - e) / Math.sqrt(e));
        var rowP = rowTot[i] / Ntot, colP = colTot[j] / Ntot;
        var se = Math.sqrt(e * (1 - rowP) * (1 - colP));
        stdres[i].push(se > 0 ? (o - e) / se : 0);
      }
    }
    var df = (R - 1) * (C - 1);
    var p = pchisqUpper(chi, df);
    // Cramer's V from the UNCORRECTED statistic (standard; matches rcompanion).
    var chiUnc = chi;
    if (applyYates) {
      chiUnc = 0;
      for (i = 0; i < R; i++) for (j = 0; j < C; j++) {
        var d2 = tbl[i][j] - expected[i][j]; chiUnc += (d2 * d2) / expected[i][j];
      }
    }
    var cramerV = Math.sqrt(chiUnc / (Ntot * Math.min(R - 1, C - 1)));

    return {
      chi: chi, df: df, p: p, expected: expected, stdres: stdres, residuals: residuals,
      contrib: contrib, cramerV: cramerV, cramerVmag: magnitude(cramerV),
      N: Ntot, rowTot: rowTot, colTot: colTot, R: R, C: C,
      yates: applyYates, minExpected: minExpected
    };
  }

  // ---- goodness-of-fit (one row of observed vs expected/uniform) ----
  // Matches the page's expected-detection: sum~=1 => proportions*N; sum==N => as-is;
  // else rescale to N (relative weights); blank => uniform N/k.
  function goodnessOfFit(observed, expected) {
    var k = observed.length, i;
    if (k === 0) return { error: 'No observed counts' };
    var Ntot = observed.reduce(function (a, b) { return a + b; }, 0);
    if (Ntot === 0) return { error: 'Total count is zero' };

    var exp;
    if (!expected || expected.length === 0) {
      exp = new Array(k).fill(Ntot / k);
    } else if (expected.length !== k) {
      return { error: 'Expected length (' + expected.length + ') does not match observed (' + k + ')' };
    } else {
      var sumExp = expected.reduce(function (a, b) { return a + b; }, 0);
      if (Math.abs(sumExp - 1) < 1e-6 || (sumExp < 1.01 && Math.abs(sumExp - Ntot) > 1)) {
        exp = expected.map(function (pp) { return pp * Ntot; });
      } else if (Math.abs(sumExp - Ntot) < 1e-6) {
        exp = expected.slice();
      } else {
        exp = expected.map(function (v) { return v * Ntot / sumExp; });
      }
    }
    if (exp.some(function (e) { return e <= 0; })) return { error: 'Expected counts must be positive' };

    var chi = 0, stdres = [], residuals = [], contrib = [], minExpected = Infinity;
    for (i = 0; i < k; i++) {
      var e = exp[i];
      if (e < minExpected) minExpected = e;
      var dev = observed[i] - e;
      var cell = (dev * dev) / e;
      chi += cell; contrib.push(cell);
      residuals.push(dev / Math.sqrt(e));
      var pi = e / Ntot;                       // == the hypothesised probability
      var se = Math.sqrt(e * (1 - pi));
      stdres.push(se > 0 ? dev / se : 0);
    }
    var df = k - 1;
    var p = pchisqUpper(chi, df);
    var cohenW = Math.sqrt(chi / Ntot);
    return {
      chi: chi, df: df, p: p, expected: exp, stdres: stdres, residuals: residuals,
      contrib: contrib, cohenW: cohenW, cohenWmag: magnitude(cohenW),
      N: Ntot, k: k, minExpected: minExpected
    };
  }

  // ---- Fisher's exact test, 2x2, two-sided (matches R fisher.test 2x2) ----
  function lchoose(n, k) {
    if (k < 0 || k > n) return -Infinity;
    return lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1);
  }
  function fisher2x2(tbl) {
    if (tbl.length !== 2 || tbl[0].length !== 2) return { error: 'Fisher exact requires a 2x2 table' };
    var a = tbl[0][0], b = tbl[0][1], c = tbl[1][0], d = tbl[1][1];
    var r1 = a + b, r2 = c + d, c1 = a + c, Ntot = a + b + c + d;
    var lo = Math.max(0, c1 - r2), hi = Math.min(c1, r1);
    var logDen = lchoose(Ntot, c1);
    function prob(kk) { return Math.exp(lchoose(r1, kk) + lchoose(r2, c1 - kk) - logDen); }
    var pObs = prob(a);
    var tol = 1 + 1e-7, pv = 0;
    for (var kk = lo; kk <= hi; kk++) { var pk = prob(kk); if (pk <= pObs * tol) pv += pk; }
    return { p: Math.min(1, pv), pObs: pObs };
  }

  return {
    independence: independence,
    goodnessOfFit: goodnessOfFit,
    fisher2x2: fisher2x2,
    pchisq: pchisq,
    pchisqUpper: pchisqUpper,
    qchisq: qchisq,
    magnitude: magnitude
  };
}));
