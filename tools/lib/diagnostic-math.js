/* diagnostic-math.js - regression-diagnostics math for Tool Farm v2
   (tools/diagnostic-plot.html).

   Ground truth: R 4.6.0 stats::lm / hatvalues / rstandard / cooks.distance and
   lmtest::bptest / resettest / dwtest + stats::shapiro.test
   (see Scripts/tool-truth/diagnostic-plot.json). Verified to <=1e-6.

   Unlike the predecessor (which never fit a model and approximated on pasted
   residuals), this ACTUALLY fits lm(y ~ x1 + ...) by ordinary least squares and
   computes the exact diagnostics R's plot.lm() draws.

   Reuses verified primitives:
     VIFMath.invertMatrix   Gauss-Jordan (X'X)^-1
     NormalMath.gammq/qnorm chi-square upper tail (BP), Q-Q theoretical quantiles
     LMMath.fPValue         exact F upper tail (RESET)
     NormalityMath.shapiroWilk  stats::shapiro.test on the residuals

   Browser: window.DiagnosticMath (needs NormalMath, VIFMath, LMMath,
   NormalityMath loaded first).  Node: require('./diagnostic-math.js'). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('./normal-math.js'),
      require('./vif-math.js'),
      require('./lm-math.js'),
      require('./normality-math.js')
    );
  } else {
    root.DiagnosticMath = factory(root.NormalMath, root.VIFMath, root.LMMath, root.NormalityMath);
  }
}(typeof self !== 'undefined' ? self : this, function (Normal, VIF, LM, Norm) {
  'use strict';

  // ---- small matrix helpers -------------------------------------------------
  function transposeTimes(X) {           // X'X  (k x k) for an n x k design
    var n = X.length, k = X[0].length, i, a, b, s;
    var M = [];
    for (a = 0; a < k; a++) {
      M.push(new Array(k));
      for (b = 0; b < k; b++) {
        s = 0;
        for (i = 0; i < n; i++) s += X[i][a] * X[i][b];
        M[a][b] = s;
      }
    }
    return M;
  }
  function transposeTimesVec(X, y) {     // X'y  (length k)
    var n = X.length, k = X[0].length, a, i, s, v = new Array(k);
    for (a = 0; a < k; a++) { s = 0; for (i = 0; i < n; i++) s += X[i][a] * y[i]; v[a] = s; }
    return v;
  }
  function matVec(M, v) {                 // M v
    var k = M.length, j, c, s, out = new Array(k);
    for (j = 0; j < k; j++) { s = 0; for (c = 0; c < v.length; c++) s += M[j][c] * v[c]; out[j] = s; }
    return out;
  }

  // ---- ordinary least squares on a design matrix ---------------------------
  // X = n x k design (caller supplies the intercept column). Returns
  // { beta, fitted, resid, rss, XtXinv, k, singular }.
  function ols(X, y) {
    var n = X.length, k = X[0].length, i, j, s;
    var XtX = transposeTimes(X);
    var XtXinv = VIF.invertMatrix(XtX);
    if (!XtXinv) return { singular: true };
    var beta = matVec(XtXinv, transposeTimesVec(X, y));
    var fitted = new Array(n), resid = new Array(n), rss = 0;
    for (i = 0; i < n; i++) {
      s = 0;
      for (j = 0; j < k; j++) s += X[i][j] * beta[j];
      fitted[i] = s; resid[i] = y[i] - s; rss += resid[i] * resid[i];
    }
    return { beta: beta, fitted: fitted, resid: resid, rss: rss, XtXinv: XtXinv, k: k, n: n };
  }

  // ppoints(n): (i - a)/(n + 1 - 2a), a = 3/8 if n<=10 else 1/2  (matches R)
  function ppoints(n) {
    var a = n <= 10 ? 3 / 8 : 0.5, out = new Array(n), i;
    for (i = 0; i < n; i++) out[i] = (i + 1 - a) / (n + 1 - 2 * a);
    return out;
  }
  function qqTheoretical(n) {             // sorted theoretical normal quantiles
    return ppoints(n).map(function (p) { return Normal.qnorm(p); });
  }

  // chi-square upper tail: P(X^2_df > x) = Q(df/2, x/2)
  function pchisqUpper(x, df) {
    if (x <= 0) return 1;
    return Normal.gammq(df / 2, x / 2);
  }

  // ---- studentized Breusch-Pagan (lmtest::bptest, studentize=TRUE) ----------
  // resi from y~X ; w = resi^2 - sigma2 ; aux = lm(w ~ Z), Z = X ;
  // BP = n * sum(fitted_aux^2)/sum(w^2) ; df = rank(Z)-1 ; p = pchisq upper.
  function bptest(X, resid, n) {
    var sigma2 = 0, i;
    for (i = 0; i < n; i++) sigma2 += resid[i] * resid[i];
    sigma2 /= n;
    var w = new Array(n), sw2 = 0;
    for (i = 0; i < n; i++) { w[i] = resid[i] * resid[i] - sigma2; sw2 += w[i] * w[i]; }
    var aux = ols(X, w);
    if (aux.singular) return { stat: NaN, df: X[0].length - 1, p: NaN };
    var sfit2 = 0;
    for (i = 0; i < n; i++) sfit2 += aux.fitted[i] * aux.fitted[i];
    var bp = n * sfit2 / sw2;
    var df = X[0].length - 1;
    return { stat: bp, df: df, p: pchisqUpper(bp, df) };
  }

  // ---- Ramsey RESET (lmtest::resettest, power=2:3, type="fitted") -----------
  // Z = [yhat^2, yhat^3] ; compare RSS of y~X vs y~[X,Z] ;
  // F = (df2/df1)*((rss1-rss2)/rss2) ; df1=2, df2=n-(k+2).
  function resettest(X, y, fitted, n) {
    var k = X[0].length, i, j;
    var XZ = new Array(n);
    for (i = 0; i < n; i++) {
      var row = X[i].slice();
      row.push(fitted[i] * fitted[i]);
      row.push(fitted[i] * fitted[i] * fitted[i]);
      XZ[i] = row;
    }
    var f1 = ols(X, y), f2 = ols(XZ, y);
    if (f1.singular || f2.singular) return { stat: NaN, df1: 2, df2: n - k - 2, p: NaN };
    var df1 = 2, df2 = n - (k + 2);
    var reset = (df2 / df1) * ((f1.rss - f2.rss) / f2.rss);
    return { stat: reset, df1: df1, df2: df2, p: LM.fPValue(reset, df1, df2) };
  }

  // ---- Durbin-Watson statistic (lmtest::dwtest$statistic) -------------------
  function dwStat(resid, n) {
    var num = 0, den = 0, i;
    for (i = 1; i < n; i++) { var d = resid[i] - resid[i - 1]; num += d * d; }
    for (i = 0; i < n; i++) den += resid[i] * resid[i];
    return num / den;
  }

  // ---- master: fit lm(y ~ predictors) and compute every diagnostic ----------
  // y: number[] ; predictors: number[][] (array of predictor columns, each len n)
  // opts: { outThresh=2, cookK=4 }
  function analyze(y, predictors, opts) {
    opts = opts || {};
    var outThresh = opts.outThresh != null ? opts.outThresh : 2;
    var cookK = opts.cookK != null ? opts.cookK : 4;
    var n = y.length, np = predictors.length, i, j;
    var k = np + 1;                       // + intercept
    if (n < k + 1) return { error: 'Need at least ' + (k + 1) + ' rows to fit ' + np + ' predictor(s).' };

    // design matrix with leading intercept column
    var X = new Array(n);
    for (i = 0; i < n; i++) {
      var row = [1];
      for (j = 0; j < np; j++) row.push(predictors[j][i]);
      X[i] = row;
    }
    var f = ols(X, y);
    if (f.singular) return { error: 'Predictors are collinear - the model matrix is singular.' };

    var dfResid = n - k;
    if (dfResid <= 0) return { error: 'No residual degrees of freedom (n = number of coefficients).' };
    var sigma = Math.sqrt(f.rss / dfResid);
    // perfect fit: residuals are (numerically) all zero, so every standardized
    // residual / test is undefined. Guide the user instead of drawing NaNs.
    var yScale = 0; for (i = 0; i < n; i++) yScale += y[i] * y[i];
    if (!(sigma > 1e-9 * Math.sqrt(yScale / n) + 1e-12)) {
      return { error: 'These points fall almost exactly on the fitted line (near-zero residual variance), so the residual diagnostics are undefined. Paste data with real scatter.' };
    }

    // hat values, standardized residuals, Cook's distance (exact R formulas)
    var M = f.XtXinv, hat = new Array(n), rstd = new Array(n), cooks = new Array(n);
    for (i = 0; i < n; i++) {
      var h = 0, a, b;
      for (a = 0; a < k; a++) {
        var Ma = 0;
        for (b = 0; b < k; b++) Ma += M[a][b] * X[i][b];
        h += X[i][a] * Ma;
      }
      hat[i] = h;
      var denom = sigma * Math.sqrt(Math.max(1 - h, 0));
      rstd[i] = denom > 0 ? f.resid[i] / denom : 0;
      cooks[i] = (rstd[i] * rstd[i] / k) * (h / (1 - h));
    }

    // total SS for R^2
    var ybar = 0; for (i = 0; i < n; i++) ybar += y[i]; ybar /= n;
    var tss = 0; for (i = 0; i < n; i++) tss += (y[i] - ybar) * (y[i] - ybar);
    var r2 = tss > 0 ? 1 - f.rss / tss : 0;
    var adjR2 = 1 - (1 - r2) * (n - 1) / (n - k);

    var bp = bptest(X, f.resid, n);
    var reset = resettest(X, y, f.fitted, n);
    var sw = Norm.shapiroWilk(f.resid) || { W: NaN, p: NaN };
    var dw = dwStat(f.resid, n);

    // counts
    var nOut = 0, outRows = [];
    for (i = 0; i < n; i++) if (Math.abs(rstd[i]) > outThresh) { nOut++; outRows.push(i); }
    var cookCut = cookK / n, nCook = 0, cookRows = [];
    for (i = 0; i < n; i++) if (cooks[i] > cookCut) { nCook++; cookRows.push(i); }

    return {
      n: n, k: k, p: k, dfResid: dfResid, nPred: np,
      beta: f.beta, fitted: f.fitted, resid: f.resid, hat: hat,
      rstandard: rstd, cooks: cooks, sigma: sigma, rss: f.rss,
      rSquared: r2, adjRSquared: adjR2,
      bp: bp, reset: reset, shapiro: { W: sw.W, p: sw.p }, dw: dw,
      qqTheo: qqTheoretical(n),
      nOut: nOut, outRows: outRows, nCook: nCook, cookRows: cookRows,
      cookCut: cookCut, maxCook: Math.max.apply(null, cooks), maxHat: Math.max.apply(null, hat)
    };
  }

  // ---- residuals-mode (predecessor parity): user pastes e + fitted only -----
  // Exact base-R equivalents:
  //   het   = n * R^2 from lm(e^2 ~ yhat) ; p = pchisq(., 1, lower=FALSE)   (BP score)
  //   nonlin= anova(lm(e~yhat), lm(e~yhat+I(yhat^2)+I(yhat^3)))  F test     (RESET)
  //   norm  = shapiro.test(e) ; indep = DW = sum(diff(e)^2)/sum(e^2)
  function analyzeResiduals(e, yhat, opts) {
    opts = opts || {};
    var outThresh = opts.outThresh != null ? opts.outThresh : 2;
    var n = e.length, i;
    if (n < 5) return { error: 'Need at least 5 rows to diagnose residuals.' };
    var eScale = 0; for (i = 0; i < n; i++) eScale += e[i] * e[i];
    if (!(eScale > 1e-18)) return { error: 'The residuals are all zero, so there is nothing to diagnose.' };

    // heteroscedasticity: BP score of e^2 on fitted
    var Xh = new Array(n), e2 = new Array(n), me2 = 0;
    for (i = 0; i < n; i++) { e2[i] = e[i] * e[i]; me2 += e2[i]; Xh[i] = [1, yhat[i]]; }
    me2 /= n;
    var tss = 0; for (i = 0; i < n; i++) tss += (e2[i] - me2) * (e2[i] - me2);
    var fh = ols(Xh, e2);
    var r2 = tss > 0 && !fh.singular ? 1 - fh.rss / tss : 0;
    var bpStat = n * r2, bp = { stat: bpStat, df: 1, p: pchisqUpper(bpStat, 1) };

    // nonlinearity: RESET of e on fitted^2, fitted^3
    var X1 = new Array(n), X2 = new Array(n);
    for (i = 0; i < n; i++) {
      X1[i] = [1, yhat[i]];
      X2[i] = [1, yhat[i], yhat[i] * yhat[i], yhat[i] * yhat[i] * yhat[i]];
    }
    var g1 = ols(X1, e), g2 = ols(X2, e);
    var df1 = 2, df2 = n - 4, resetStat = NaN, resetP = NaN;
    if (!g1.singular && !g2.singular && df2 > 0) {
      resetStat = (df2 / df1) * ((g1.rss - g2.rss) / g2.rss);
      resetP = LM.fPValue(resetStat, df1, df2);
    }
    var reset = { stat: resetStat, df1: df1, df2: df2, p: resetP };

    // standardized residuals e/sd(e) for the plots + counts
    var mean = 0; for (i = 0; i < n; i++) mean += e[i]; mean /= n;
    var v = 0; for (i = 0; i < n; i++) v += (e[i] - mean) * (e[i] - mean); v /= (n - 1);
    var sd = Math.sqrt(v);
    var rstd = new Array(n), nOut = 0, outRows = [];
    for (i = 0; i < n; i++) { rstd[i] = sd > 0 ? e[i] / sd : 0; if (Math.abs(rstd[i]) > outThresh) { nOut++; outRows.push(i); } }

    var sw = Norm.shapiroWilk(e) || { W: NaN, p: NaN };
    return {
      n: n, resid: e, fitted: yhat, rstandard: rstd, sd: sd,
      bp: bp, reset: reset, shapiro: { W: sw.W, p: sw.p }, dw: dwStat(e, n),
      qqTheo: qqTheoretical(n), nOut: nOut, outRows: outRows
    };
  }

  return {
    analyze: analyze,
    analyzeResiduals: analyzeResiduals,
    ols: ols,
    bptest: bptest,
    resettest: resettest,
    dwStat: dwStat,
    ppoints: ppoints,
    qqTheoretical: qqTheoretical,
    pchisqUpper: pchisqUpper
  };
}));
