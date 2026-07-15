/* anova-math.js - exact ANOVA-table math for Tool Farm v2
   (tools/anova-output-interpreter.html).

   The tool parses a printed ANOVA table (summary(aov()) or car::Anova())
   and RE-COMPUTES every number the reader should trust from the two columns
   R always prints exactly - Sum Sq and Df:

     MS   = SS / df
     F    = MS_term / MS_resid
     p    = pf(F, df_term, df_resid, lower.tail = FALSE)     <- verified value
     eta^2, partial eta^2, omega^2, partial omega^2, Cohen's f  (effect sizes)

   The predecessor READ F and p straight off the pasted text (so a rounded or
   "< 2.2e-16" p was all you got) and never computed omega^2 or Cohen's f at
   all. Here the F-tail p-value is the exact regularized-incomplete-beta value
   already verified for the t-test / lm / CI tools, and every effect size is the
   closed form R's effectsize package uses (eta_squared / omega_squared).

   Ground truth: Scripts/tool-truth/anova-output-interpreter.json
     - p-values vs stats::pf (all model terms + F edges)
     - effect sizes vs effectsize::eta_squared / omega_squared (balanced models)
       and vs the documented closed forms (every case).

   Browser: window.ANOVAMath (needs window.LMMath + window.TTestMath loaded first).
   Node:    require('./anova-math.js') (pulls lm-math -> ttest-math via require). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./lm-math.js'));
  } else {
    root.ANOVAMath = factory(root.LMMath);
  }
}(typeof self !== 'undefined' ? self : this, function (LM) {
  'use strict';

  // ---- mean square + F ratio (pure algebra off the SS/df columns) ----
  function ms(ss, df) { return ss / df; }
  function fFromSS(ssTerm, dfTerm, ssResid, dfResid) {
    return (ssTerm / dfTerm) / (ssResid / dfResid);
  }

  // ---- F distribution (delegates to the verified lm-math / ibeta tail) ----
  // pf(f, d1, d2) = I_x(d1/2, d2/2), x = d1 f/(d1 f + d2)
  function fCDF(f, df1, df2) { return LM.fCDF(f, df1, df2); }
  // upper tail = the ANOVA p-value, kept full-precision for tiny p.
  function fPValue(f, df1, df2) { return LM.fPValue(f, df1, df2); }

  // ---- effect sizes (closed forms matching R's effectsize package) ----
  // eta^2 = SS_term / SS_total   (SS_total = sum of every non-intercept SS,
  // residual included = the "column total" of the printed table).
  function eta2(ss, ssTotal) { return ss / ssTotal; }
  // partial eta^2 = SS_term / (SS_term + SS_resid)
  function partialEta2(ss, ssResid) { return ss / (ss + ssResid); }
  // omega^2 = (SS_term - df_term * MS_resid) / (SS_total + MS_resid)
  function omega2(ss, df, msResid, ssTotal) {
    return (ss - df * msResid) / (ssTotal + msResid);
  }
  // partial omega^2 = (SS_term - df_term*MS_resid)
  //                   / (SS_term + (N - df_term)*MS_resid)
  function partialOmega2(ss, df, msResid, N) {
    return (ss - df * msResid) / (ss + (N - df) * msResid);
  }
  // Cohen's f from partial eta^2:  f = sqrt(pEta2 / (1 - pEta2))
  function cohensF(pEta2) { return Math.sqrt(pEta2 / (1 - pEta2)); }

  // ---- one-shot: every recomputed quantity for a single term row ----
  // Inputs are lifted straight from the parsed table. ssTotal = column total
  // (non-intercept SS + residual SS); N = total observations (df_resid + all
  // non-intercept df + 1). Returns raw omega^2 (may be < 0); the page floors
  // at 0 for display, matching effectsize, and says so.
  function termStats(ssTerm, dfTerm, ssResid, dfResid, ssTotal, N) {
    var msResid = ssResid / dfResid;
    var msTerm = ssTerm / dfTerm;
    var f = msTerm / msResid;
    var pe = partialEta2(ssTerm, ssResid);
    return {
      ms: msTerm,
      msResid: msResid,
      f: f,
      p: fPValue(f, dfTerm, dfResid),
      eta2: eta2(ssTerm, ssTotal),
      partialEta2: pe,
      omega2: omega2(ssTerm, dfTerm, msResid, ssTotal),
      partialOmega2: partialOmega2(ssTerm, dfTerm, msResid, N),
      cohensF: cohensF(pe)
    };
  }

  // ---- whole-model fit off the table ----
  // R^2 = 1 - SS_resid/SS_total ; adj R^2 penalizes the model df.
  function r2(ssResid, ssTotal) { return 1 - ssResid / ssTotal; }
  function adjR2(ssResid, dfResid, ssTotal, n) {
    return 1 - (ssResid / dfResid) / (ssTotal / (n - 1));
  }

  // ===========================================================================
  // RAW-DATA ANOVA (anova-calculator, wave-3): compute the whole table from the
  // pasted numbers, not from a printed one.  All SS/df/MS/F/p reproduce R's
  // aov(); effect sizes reuse the closed forms above (== effectsize package).
  // ===========================================================================
  function mean(a) { var s = 0, i; for (i = 0; i < a.length; i++) s += a[i]; return s / a.length; }
  function variance(a) {                       // sample variance (n - 1), == R var()
    if (a.length < 2) return NaN;
    var m = mean(a), s = 0, i; for (i = 0; i < a.length; i++) { var d = a[i] - m; s += d * d; }
    return s / (a.length - 1);
  }
  function median(a) {                          // == R median() (mean of the two middles)
    var b = a.slice().sort(function (x, y) { return x - y; }), n = b.length;
    return n % 2 ? b[(n - 1) / 2] : (b[n / 2 - 1] + b[n / 2]) / 2;
  }
  function uniqInOrder(arr) {
    var seen = {}, out = [], i, k;
    for (i = 0; i < arr.length; i++) { k = String(arr[i]); if (!seen[k]) { seen[k] = 1; out.push(arr[i]); } }
    return out;
  }

  // Solve the normal equations X'X b = X'y by Gaussian elimination with partial
  // pivoting (small dense system: only the additive two-way model uses it).
  function gaussSolve(M0) {
    var n = M0.length, i, j, k;
    var M = M0.map(function (row) { return row.slice(); });   // augmented [A|b], n x (n+1)
    for (k = 0; k < n; k++) {
      var piv = k;
      for (i = k + 1; i < n; i++) if (Math.abs(M[i][k]) > Math.abs(M[piv][k])) piv = i;
      var tmp = M[k]; M[k] = M[piv]; M[piv] = tmp;
      var pv = M[k][k];
      for (j = k; j <= n; j++) M[k][j] /= pv;
      for (i = 0; i < n; i++) {
        if (i === k) continue;
        var f = M[i][k]; if (f === 0) continue;
        for (j = k; j <= n; j++) M[i][j] -= f * M[k][j];
      }
    }
    return M.map(function (row) { return row[n]; });
  }
  // Residual SS of the additive model y ~ A + B (reference/dummy coding) fitted
  // by OLS -- the one piece with no closed form when the design is unbalanced.
  function additiveRSS(y, aI, bI, A, B) {
    var n = y.length, p = 1 + (A - 1) + (B - 1), r, c;
    var X = [];
    for (r = 0; r < n; r++) {
      var row = new Array(p); for (c = 0; c < p; c++) row[c] = 0;
      row[0] = 1;
      if (aI[r] > 0) row[aI[r]] = 1;                 // A dummies at cols 1..A-1
      if (bI[r] > 0) row[(A - 1) + bI[r]] = 1;       // B dummies at cols A..A+B-2
      X.push(row);
    }
    // normal-equations augmented matrix [X'X | X'y]
    var M = [];
    for (r = 0; r < p; r++) { var mr = new Array(p + 1); for (c = 0; c <= p; c++) mr[c] = 0; M.push(mr); }
    for (r = 0; r < n; r++) {
      var xr = X[r], yr = y[r];
      for (var i2 = 0; i2 < p; i2++) {
        M[i2][p] += xr[i2] * yr;
        for (var j2 = 0; j2 < p; j2++) M[i2][j2] += xr[i2] * xr[j2];
      }
    }
    var beta = gaussSolve(M);
    var rss = 0;
    for (r = 0; r < n; r++) {
      var fit = 0; for (c = 0; c < p; c++) fit += X[r][c] * beta[c];
      var d = y[r] - fit; rss += d * d;
    }
    return rss;
  }

  // Levene's test, median-centered (Brown-Forsythe) -- car::leveneTest default.
  // = one-way F on z_ij = |y_ij - median_i|.
  function levene(groups) {
    var z = groups.map(function (g) {
      var med = median(g.values);
      return g.values.map(function (v) { return Math.abs(v - med); });
    });
    var k = z.length, N = 0, gsum = 0;
    z.forEach(function (v) { N += v.length; v.forEach(function (x) { gsum += x; }); });
    var grand = gsum / N, ssB = 0, ssW = 0;
    z.forEach(function (v) {
      var m = mean(v), within = 0;
      v.forEach(function (x) { var d = x - m; within += d * d; });
      ssB += v.length * (m - grand) * (m - grand); ssW += within;
    });
    var df1 = k - 1, df2 = N - k, f = (ssB / df1) / (ssW / df2);
    return { f: f, df1: df1, df2: df2, p: fPValue(f, df1, df2), statistic: f };
  }

  // ---- one-way ANOVA from raw groups ----------------------------------------
  // groups: [{name, values:[...]}, ...]  (bare number arrays also accepted).
  function oneWay(groups, opts) {
    opts = opts || {};
    var G = groups.map(function (g, i) {
      var vals = Array.isArray(g) ? g : g.values;
      var nm = Array.isArray(g) ? ('Group ' + (i + 1)) : (g.name != null && g.name !== '' ? g.name : 'Group ' + (i + 1));
      return { name: String(nm), values: vals.slice() };
    }).filter(function (g) { return g.values.length > 0; });
    var k = G.length;
    if (k < 2) throw new Error('Need at least two groups with data.');
    var N = 0, gsum = 0;
    G.forEach(function (g) { N += g.values.length; g.values.forEach(function (v) { gsum += v; }); });
    if (N <= k) throw new Error('Need more observations than groups (at least one group with n > 1).');
    var grand = gsum / N, ssB = 0, ssW = 0;
    var summary = G.map(function (g) {
      var n = g.values.length, m = mean(g.values), within = 0;
      g.values.forEach(function (v) { var d = v - m; within += d * d; });
      ssB += n * (m - grand) * (m - grand); ssW += within;
      var vv = n > 1 ? within / (n - 1) : NaN, sd = n > 1 ? Math.sqrt(vv) : NaN;
      return { name: g.name, n: n, mean: m, sd: sd, se: n > 1 ? sd / Math.sqrt(n) : NaN, variance: vv, min: Math.min.apply(null, g.values), max: Math.max.apply(null, g.values) };
    });
    var dfB = k - 1, dfW = N - k, ssT = ssB + ssW;
    var t = termStats(ssB, dfB, ssW, dfW, ssT, N);
    return {
      groups: G, summary: summary,
      k: k, N: N, grandMean: grand,
      ssBetween: ssB, dfBetween: dfB, msBetween: ssB / dfB,
      ssWithin: ssW, dfWithin: dfW, msWithin: ssW / dfW,
      ssTotal: ssT, dfTotal: N - 1,
      f: t.f, p: t.p,
      eta2: t.eta2, omega2: t.omega2, cohensF: t.cohensF, partialEta2: t.partialEta2,
      levene: levene(G),
      conf: opts.conf || 0.95
    };
  }

  // ---- two-way ANOVA from raw long data -------------------------------------
  // a, b: label arrays (factor levels); y: numeric array. Reproduces the Type I
  // sequential table of summary(aov(y ~ A * B)) for BALANCED and UNBALANCED data
  // via nested-model residual-SS differences.
  function twoWay(a, b, y, opts) {
    opts = opts || {};
    var n = y.length;
    if (a.length !== n || b.length !== n) throw new Error('Factor A, factor B and value columns must be the same length.');
    if (n < 4) throw new Error('Need at least four observations for a two-way ANOVA.');
    var levA = uniqInOrder(a), levB = uniqInOrder(b);
    var A = levA.length, B = levB.length;
    if (A < 2 || B < 2) throw new Error('Each factor needs at least two levels.');
    var aI = a.map(function (x) { return levA.indexOf(x); });
    var bI = b.map(function (x) { return levB.indexOf(x); });
    // every cell must be occupied
    var cnt = {}, i, ia, ib;
    for (i = 0; i < n; i++) { var key = aI[i] + '|' + bI[i]; cnt[key] = (cnt[key] || 0) + 1; }
    for (ia = 0; ia < A; ia++) for (ib = 0; ib < B; ib++)
      if (!cnt[ia + '|' + ib]) throw new Error('Cell "' + levA[ia] + ' x ' + levB[ib] + '" has no data; every factor combination needs at least one observation.');
    var dfRes = n - A * B;
    if (dfRes < 1) throw new Error('Not enough replication: two-way ANOVA with interaction needs more than one observation in at least one cell.');
    var grand = mean(y);
    var ssTotal = 0; for (i = 0; i < n; i++) { var d0 = y[i] - grand; ssTotal += d0 * d0; }
    // RSS(A): within factor-A group means
    var sumA = new Array(A), cA = new Array(A);
    for (ia = 0; ia < A; ia++) { sumA[ia] = 0; cA[ia] = 0; }
    for (i = 0; i < n; i++) { sumA[aI[i]] += y[i]; cA[aI[i]]++; }
    var mA = sumA.map(function (s, j) { return s / cA[j]; });
    var rssA = 0; for (i = 0; i < n; i++) { var da = y[i] - mA[aI[i]]; rssA += da * da; }
    // RSS(full): within cell means
    var sumC = {}, cntC = {};
    for (i = 0; i < n; i++) { var kk = aI[i] + '|' + bI[i]; sumC[kk] = (sumC[kk] || 0) + y[i]; cntC[kk] = (cntC[kk] || 0) + 1; }
    var rssFull = 0;
    for (i = 0; i < n; i++) { var kk2 = aI[i] + '|' + bI[i]; var dc = y[i] - sumC[kk2] / cntC[kk2]; rssFull += dc * dc; }
    // RSS(A+B): additive model, OLS
    var rssAdd = additiveRSS(y, aI, bI, A, B);
    var ssA = ssTotal - rssA, ssB2 = rssA - rssAdd, ssAB = rssAdd - rssFull, ssRes = rssFull;
    var dfA = A - 1, dfB2 = B - 1, dfAB = (A - 1) * (B - 1);
    var msRes = ssRes / dfRes;
    function mkRow(term, ss, df) {
      var msT = ss / df, f = msT / msRes, pe = ss / (ss + ssRes);
      return {
        term: term, ss: ss, df: df, ms: msT, f: f, p: fPValue(f, df, dfRes),
        eta2: ss / ssTotal, partialEta2: pe,
        omega2: omega2(ss, df, msRes, ssTotal), cohensF: cohensF(pe)
      };
    }
    // cell + marginal means for the plot / table
    var cellMean = [], cellN = [];
    for (ia = 0; ia < A; ia++) { cellMean.push(new Array(B)); cellN.push(new Array(B)); for (ib = 0; ib < B; ib++) { var k3 = ia + '|' + ib; cellMean[ia][ib] = sumC[k3] / cntC[k3]; cellN[ia][ib] = cntC[k3]; } }
    return {
      levelsA: levA.map(String), levelsB: levB.map(String), A: A, B: B, N: n,
      grandMean: grand, marginalA: mA,
      cellMean: cellMean, cellN: cellN,
      rows: [mkRow(opts.nameA || 'Factor A', ssA, dfA), mkRow(opts.nameB || 'Factor B', ssB2, dfB2), mkRow('Interaction', ssAB, dfAB)],
      resid: { ss: ssRes, df: dfRes, ms: msRes },
      total: { ss: ssTotal, df: n - 1 },
      balanced: (function () { var v = cellN[0][0], bal = true; for (ia = 0; ia < A; ia++) for (ib = 0; ib < B; ib++) if (cellN[ia][ib] !== v) bal = false; return bal; })()
    };
  }

  return {
    ms: ms,
    fFromSS: fFromSS,
    fCDF: fCDF,
    fPValue: fPValue,
    eta2: eta2,
    partialEta2: partialEta2,
    omega2: omega2,
    partialOmega2: partialOmega2,
    cohensF: cohensF,
    termStats: termStats,
    r2: r2,
    adjR2: adjR2,
    // raw-data ANOVA (anova-calculator)
    mean: mean,
    variance: variance,
    median: median,
    levene: levene,
    oneWay: oneWay,
    twoWay: twoWay
  };
}));
