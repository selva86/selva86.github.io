/* kappa-math.js - Cohen's kappa (rater agreement) for Tool Farm v2.
   Ground truth: psych::cohen.kappa (internal cohen.kappa1) on R 4.6.x, see
   Scripts/tool-truth/cohens-kappa-calculator.json. Reproduces, bit for bit:

     po  = sum(diag(p))                         observed agreement
     pc  = sum_i p_{i.} p_{.i}                  chance agreement
     kappa = (po - pc)/(1 - pc)                 unweighted Cohen's kappa
     w[i][j] = 1 - |i-j|^e / (K-1)^e            agreement weights (e=1 linear, e=2 quadratic)
     wpo, wpc, kappa_w = (wpo - wpc)/(1 - wpc)  weighted kappa
     Vark, Varkw                                Fleiss-Cohen-Everitt large-sample variances
     CI  = kappa +/- z(alpha/2)*sqrt(Var)       normal approximation, clamped to [-1, 1]

   The two weighted variances use psych's exact algebra (colw/roww outer sums),
   so linear and quadratic CIs match cohen.kappa's $confid rows.

   qnorm is reused from normal-math.js (verified vs R qnorm).
   Browser: window.KappaMath (needs NormalMath loaded first).
   Node: require('./kappa-math.js'). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./normal-math.js'));
  } else {
    root.KappaMath = factory(root.NormalMath);
  }
}(typeof self !== 'undefined' ? self : this, function (N) {
  'use strict';

  var qnorm = N.qnorm;

  function isNum(v) { return typeof v === 'number' && isFinite(v); }
  function sumDiag(M) { var s = 0, i; for (i = 0; i < M.length; i++) s += M[i][i]; return s; }
  function sumAll(M) { var s = 0, i, j; for (i = 0; i < M.length; i++) for (j = 0; j < M[i].length; j++) s += M[i][j]; return s; }
  function rowSums(M) { return M.map(function (r) { var s = 0, j; for (j = 0; j < r.length; j++) s += r[j]; return s; }); }
  function colSums(M) {
    var k = M.length, cs = new Array(k), i, j;
    for (j = 0; j < k; j++) { cs[j] = 0; for (i = 0; i < k; i++) cs[j] += M[i][j]; }
    return cs;
  }

  // agreement-weight matrix for K levels: w[i][j] = 1 - |i-j|^e / (K-1)^e
  function weightMatrix(K, e) {
    var w = [], i, j, denom = Math.pow(K - 1, e);
    for (i = 0; i < K; i++) { w[i] = []; for (j = 0; j < K; j++) w[i][j] = 1 - Math.pow(Math.abs(i - j), e) / denom; }
    return w;
  }

  // Core: unweighted stats + one weighting (exponent e) with psych's variances.
  // Returns po, pc, kappa, var_kappa; plus wpo, wpc, kappa_w, var_w for weight e.
  function kappaCore(counts, e) {
    var K = counts.length, N0 = sumAll(counts), i, j;
    var p = counts.map(function (r) { return r.map(function (c) { return c / N0; }); });
    var rs = rowSums(p), cs = colSums(p);
    var po = sumDiag(p);
    var pc = 0; for (i = 0; i < K; i++) pc += rs[i] * cs[i];
    var kappa = (1 - pc !== 0) ? (po - pc) / (1 - pc) : NaN;

    // ---- unweighted Fleiss-Cohen-Everitt variance ----
    var term1 = 0;
    for (i = 0; i < K; i++) {
      var a = (1 - pc) - (rs[i] + cs[i]) * (1 - po);
      term1 += p[i][i] * a * a;
    }
    var term2 = 0;
    for (i = 0; i < K; i++) for (j = 0; j < K; j++) {
      if (i === j) continue;
      var b = cs[i] + rs[j];
      term2 += p[i][j] * b * b;
    }
    term2 *= (1 - po) * (1 - po);
    var term3 = po * pc - 2 * pc + po; term3 *= term3;
    var denomV = N0 * Math.pow(1 - pc, 4);
    var Vark = denomV !== 0 ? (term1 + term2 - term3) / denomV : NaN;
    if (!isNum(Vark) || Vark < 0) Vark = 0;

    // ---- weighted stats + variance ----
    var w = weightMatrix(K, e);
    var wpo = 0, wpc = 0;
    for (i = 0; i < K; i++) for (j = 0; j < K; j++) { wpo += w[i][j] * p[i][j]; wpc += w[i][j] * rs[i] * cs[j]; }
    var colw = new Array(K), roww = new Array(K);
    for (j = 0; j < K; j++) { colw[j] = 0; roww[j] = 0; for (i = 0; i < K; i++) { colw[j] += w[i][j] * cs[i]; roww[j] += w[i][j] * rs[i]; } }
    var wkappa = (1 - wpc !== 0) ? (wpo - wpc) / (1 - wpc) : NaN;
    var sumD = 0;
    for (i = 0; i < K; i++) for (j = 0; j < K; j++) {
      var d = w[i][j] * (1 - wpc) - (colw[i] + roww[j]) * (1 - wpo);
      sumD += p[i][j] * d * d;
    }
    var t3w = wpo * wpc - 2 * wpc + wpo; t3w *= t3w;
    var denomVw = N0 * Math.pow(1 - wpc, 4);
    var Varkw = denomVw !== 0 ? (sumD - t3w) / denomVw : NaN;
    if (!isNum(Varkw) || Varkw < 0) Varkw = 0;

    return { N: N0, K: K, po: po, pc: pc, kappa: kappa, var_kappa: Vark,
             wpo: wpo, wpc: wpc, kappa_w: wkappa, var_w: Varkw };
  }

  function clamp1(v) { return v > 1 ? 1 : (v < -1 ? -1 : v); }

  // Normal-approx CI: psych does kappa + qnorm(alpha/2)*sqrt(V) (lower),
  // kappa - qnorm(alpha/2)*sqrt(V) (upper). qnorm(alpha/2) < 0.
  function ci(est, varr, alpha) {
    var z = qnorm(alpha / 2), se = Math.sqrt(varr);
    var lo = est + z * se, hi = est - z * se;
    return { lower: clamp1(lo), upper: clamp1(hi), se: se };
  }

  // Landis & Koch (1977) benchmark labels. The thresholds are a widely cited
  // convention, NOT a law of nature; the tool states this on-page.
  function landisKoch(k) {
    if (!isNum(k)) return { label: 'undefined', tone: 'na' };
    if (k < 0) return { label: 'Poor (worse than chance)', tone: 'bad' };
    if (k < 0.20) return { label: 'Slight', tone: 'bad' };
    if (k < 0.40) return { label: 'Fair', tone: 'warn' };
    if (k < 0.60) return { label: 'Moderate', tone: 'warn' };
    if (k < 0.80) return { label: 'Substantial', tone: 'ok' };
    return { label: 'Almost perfect', tone: 'ok' };
  }

  // Build a KxK count matrix from two paired rating vectors, over the union of
  // levels. Numeric-looking levels are ordered numerically (so ordinal weights
  // are sensible); otherwise lexical. Returns { matrix, levels, n, dropped }.
  function tableFromColumns(x1, x2) {
    var n = Math.min(x1.length, x2.length), pairs = [], dropped = 0, i;
    for (i = 0; i < n; i++) {
      var a = x1[i], b = x2[i];
      if (a === null || a === undefined || a === '' || b === null || b === undefined || b === '') { dropped++; continue; }
      pairs.push([String(a).trim(), String(b).trim()]);
    }
    var set = {};
    pairs.forEach(function (pr) { set[pr[0]] = true; set[pr[1]] = true; });
    var levels = Object.keys(set);
    var allNum = levels.length > 0 && levels.every(function (l) { return l !== '' && isFinite(Number(l)); });
    levels.sort(allNum ? function (a, b) { return Number(a) - Number(b); }
                       : function (a, b) { return a < b ? -1 : (a > b ? 1 : 0); });
    var idx = {}; levels.forEach(function (l, j) { idx[l] = j; });
    var K = levels.length, M = [], r, c;
    for (r = 0; r < K; r++) { M[r] = []; for (c = 0; c < K; c++) M[r][c] = 0; }
    pairs.forEach(function (pr) { M[idx[pr[0]]][idx[pr[1]]] += 1; });
    return { matrix: M, levels: levels, n: pairs.length, dropped: dropped, numeric: allNum };
  }

  // Main entry. counts: KxK array of non-negative counts.
  // opts: { alpha: 0.05 }. Returns everything needed to render all modes.
  function analyze(counts, opts) {
    opts = opts || {};
    var alpha = opts.alpha != null ? opts.alpha : 0.05;
    var K = counts.length;
    if (K < 2) return { ok: false, error: 'Need at least a 2x2 table (two or more categories).' };
    var okShape = counts.every(function (r) { return r.length === K; });
    if (!okShape) return { ok: false, error: 'The agreement matrix must be square (KxK).' };
    var N0 = sumAll(counts);
    if (!(N0 > 0)) return { ok: false, error: 'Enter some counts. The table sums to zero.' };
    if (counts.some(function (r) { return r.some(function (c) { return !isNum(c) || c < 0; }); }))
      return { ok: false, error: 'All cells must be non-negative numbers.' };

    var lin = kappaCore(counts, 1);
    var quad = kappaCore(counts, 2);

    var noVariance = !isNum(lin.kappa);   // 1 - pc == 0: raters used one category

    var ciK = ci(lin.kappa, lin.var_kappa, alpha);
    var ciL = ci(lin.kappa_w, lin.var_w, alpha);
    var ciQ = ci(quad.kappa_w, quad.var_w, alpha);

    return {
      ok: true, alpha: alpha, N: N0, K: K, noVariance: noVariance,
      po: lin.po, pc: lin.pc,
      kappa: lin.kappa, var_kappa: lin.var_kappa, se_kappa: ciK.se,
      ci_lower: ciK.lower, ci_upper: ciK.upper,
      linear:    { wpo: lin.wpo,  wpc: lin.wpc,  kappa: lin.kappa_w,  var: lin.var_w,  se: ciL.se, ci_lower: ciL.lower, ci_upper: ciL.upper },
      quadratic: { wpo: quad.wpo, wpc: quad.wpc, kappa: quad.kappa_w, var: quad.var_w, se: ciQ.se, ci_lower: ciQ.lower, ci_upper: ciQ.upper },
      band: landisKoch(lin.kappa)
    };
  }

  return {
    version: '1.0.0',
    analyze: analyze,
    tableFromColumns: tableFromColumns,
    weightMatrix: weightMatrix,
    landisKoch: landisKoch,
    _kappaCore: kappaCore
  };
}));
