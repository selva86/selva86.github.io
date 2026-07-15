/* lm-math.js - exact linear-model summary math for Tool Farm v2
   (tools/lm-output-interpreter.html).

   Ground truth: R 4.6.0 stats::lm / summary / confint / anova / pf / pt / qt /
   AIC / BIC / logLik  (see Scripts/tool-truth/lm-output-interpreter.json).

   Replaces three unverified approximations in the predecessor:
     - qt() Cornish-Fisher            -> exact TTestMath.tQuantile (bisection on exact tCDF)
     - overall/nested F p Wilson-H.   -> exact F upper tail via TTestMath.ibeta
     - AIC/BIC/logLik "kernels"       -> exact stats:: formulas

   Every distribution primitive is the SAME regularized incomplete beta already
   verified for the t-test / CI tools, so nothing new needs its own proof beyond
   the F-tail identity below.

   Browser: window.LMMath (needs window.TTestMath loaded first).
   Node:    require('./lm-math.js') (pulls ttest-math via require). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./ttest-math.js'));
  } else {
    root.LMMath = factory(root.TTestMath);
  }
}(typeof self !== 'undefined' ? self : this, function (T) {
  'use strict';

  // ---- coefficient row: t and two-sided p from (estimate, SE, df) ----
  // t = est/SE ;  p = 2*pt(-|t|, df) = P(|T_df| >= |t|)
  function coefStats(est, se, df) {
    var t = est / se;
    return { t: t, p: T.pTwoTailed(t, df) };
  }

  // ---- coefficient CI, matches confint(lm, level=conf) ----
  // est +/- qt(1-(1-conf)/2, df) * SE
  function coefCI(est, se, df, conf) {
    var crit = T.tQuantile(1 - (1 - conf) / 2, df);
    return { lo: est - crit * se, hi: est + crit * se, crit: crit };
  }

  // ---- F distribution ----
  // F CDF: pf(f, d1, d2) = I_x(d1/2, d2/2),  x = d1*f/(d1*f + d2)
  function fCDF(f, df1, df2) {
    if (f <= 0) return 0;
    var x = df1 * f / (df1 * f + df2);
    return T.ibeta(df1 / 2, df2 / 2, x);
  }
  // F upper tail (the model / anova p-value). Uses the complementary beta
  // argument directly so tiny p-values keep full precision instead of being
  // formed as 1 - (almost 1):  1 - I_x(d1/2,d2/2) = I_{1-x}(d2/2, d1/2).
  function fPValue(f, df1, df2) {
    if (f <= 0) return 1;
    var oneMinusX = df2 / (df1 * f + df2);   // = 1 - x
    return T.ibeta(df2 / 2, df1 / 2, oneMinusX);
  }

  // ---- R-squared relationships ----
  // adjusted R^2, matches summary(lm)$adj.r.squared. k = predictors (F numdf).
  function adjR2(r2, n, k) {
    return 1 - (1 - r2) * (n - 1) / (n - k - 1);
  }
  // R^2 recovered from the overall F: R^2 = d1*F / (d1*F + d2)
  function r2FromF(f, df1, df2) {
    return df1 * f / (df1 * f + df2);
  }
  // overall F recovered from R^2 (sanity/round-trip): F = (R^2/d1)/((1-R^2)/d2)
  function fFromR2(r2, df1, df2) {
    return (r2 / df1) / ((1 - r2) / df2);
  }

  // ---- information criteria (EXACT, not kernels) ----
  // logLik(lm) = -n/2 * (log(2*pi) + 1 - log(n) + log(RSS))
  // npar = coefficients incl. intercept (k+1); AIC/BIC add 1 for sigma^2.
  function logLik(n, rss) {
    return -n / 2 * (Math.log(2 * Math.PI) + 1 - Math.log(n) + Math.log(rss));
  }
  function aic(n, rss, npar) {
    return -2 * logLik(n, rss) + 2 * (npar + 1);
  }
  function bic(n, rss, npar) {
    return -2 * logLik(n, rss) + Math.log(n) * (npar + 1);
  }

  // ---- nested-model F-test, matches anova(fit_small, fit_big) ----
  // fit_big must nest fit_small (more terms). Needs each model's RSS + resid df.
  // F = ((RSS_s - RSS_b)/(df_s - df_b)) / (RSS_b/df_b)
  function nestedF(rssSmall, dfSmall, rssBig, dfBig) {
    var df1 = dfSmall - dfBig, df2 = dfBig;
    var f = ((rssSmall - rssBig) / df1) / (rssBig / df2);
    return { f: f, df1: df1, df2: df2, p: fPValue(f, df1, df2) };
  }

  // ---- residual sum of squares from summary numbers ----
  // RSS = sigma^2 * residual_df  (sigma = "Residual standard error")
  function rssFromSigma(sigma, dfResid) {
    return sigma * sigma * dfResid;
  }

  // ---- R quantile TYPE 7 (default) on a pre-sorted ascending array ----
  // h = (n-1)p ; linear interpolation between order statistics.
  function quantile7(sorted, p) {
    var n = sorted.length;
    if (n === 0) return NaN;
    if (n === 1) return sorted[0];
    var h = (n - 1) * p;
    var lo = Math.floor(h);
    if (lo >= n - 1) return sorted[n - 1];
    if (lo < 0) return sorted[0];
    return sorted[lo] + (h - lo) * (sorted[lo + 1] - sorted[lo]);
  }

  // ---- simple OLS y ~ x (single predictor, with intercept) from raw arrays ----
  // Matches R: lm(y ~ x) + summary.lm + confint + AIC/BIC/logLik.
  // opts = { conf: 0.95, xname: 'x', yname: 'y' }.
  // Returns { error } on: < 3 complete pairs, zero-variance x, or a perfect fit
  // (residual variance ~ 0 -> standard errors undefined).
  function fitSimple(x, y, opts) {
    opts = opts || {};
    var conf = (opts.conf == null) ? 0.95 : opts.conf;
    var xname = opts.xname || 'x';
    var yname = opts.yname || 'y';

    // clean pairs (drop any index with a null/NaN/non-finite x or y, like
    // R's complete.cases)
    var xs = [], ys = [];
    var m = Math.min(x.length, y.length), i;
    for (i = 0; i < m; i++) {
      var xi = x[i], yi = y[i];
      if (xi === null || xi === undefined || yi === null || yi === undefined) continue;
      xi = +xi; yi = +yi;
      if (!isFinite(xi) || !isFinite(yi)) continue;
      xs.push(xi); ys.push(yi);
    }
    var n = xs.length;
    if (n < 3) return { error: 'Need at least 3 complete (x, y) pairs; got ' + n + '.' };

    // means and centered sums of squares / cross-products
    var xbar = 0, ybar = 0;
    for (i = 0; i < n; i++) { xbar += xs[i]; ybar += ys[i]; }
    xbar /= n; ybar /= n;
    var sxx = 0, syy = 0, sxy = 0;
    for (i = 0; i < n; i++) {
      var dx = xs[i] - xbar, dy = ys[i] - ybar;
      sxx += dx * dx; syy += dy * dy; sxy += dx * dy;
    }
    if (sxx <= 0)
      return { error: 'Predictor "' + xname + '" has zero variance (all x values are equal); the slope is undefined.' };
    if (syy <= 0)
      return { error: 'Response "' + yname + '" has zero variance (all y values are equal); the model is degenerate.' };

    // closed-form OLS
    var b1 = sxy / sxx;
    var b0 = ybar - b1 * xbar;

    // fitted / residuals in cleaned-input order; RSS from residuals (matches R)
    var fitted = new Array(n), resid = new Array(n), rss = 0;
    for (i = 0; i < n; i++) {
      var f = b0 + b1 * xs[i];
      var r = ys[i] - f;
      fitted[i] = f; resid[i] = r; rss += r * r;
    }
    if (rss < 0) rss = 0;
    // perfect fit -> residual variance ~ 0 -> SEs undefined
    if (rss <= 1e-12 * syy)
      return { error: 'Perfect (or near-perfect) linear fit: residual variance is ~0, so standard errors are undefined.' };

    var df = n - 2;
    var sigma = Math.sqrt(rss / df);           // Residual standard error
    var r2 = 1 - rss / syy;                     // == summary(lm)$r.squared
    var r = sxy / Math.sqrt(sxx * syy);         // signed correlation
    var adjr2 = adjR2(r2, n, 1);

    var seB0 = sigma * Math.sqrt(1 / n + xbar * xbar / sxx);
    var seB1 = sigma / Math.sqrt(sxx);

    var stB0 = coefStats(b0, seB0, df);         // { t, p }
    var stB1 = coefStats(b1, seB1, df);
    var ciB0 = coefCI(b0, seB0, df, conf);      // { lo, hi, crit }
    var ciB1 = coefCI(b1, seB1, df, conf);

    // overall F (== t_slope^2) and its p (== slope two-sided p)
    var fstat = (r2 / 1) / ((1 - r2) / df);
    var fp = fPValue(fstat, 1, df);

    // residual five-number summary via R quantile type 7
    var sr = resid.slice().sort(function (a, b) { return a - b; });
    var residQuantiles = {
      min: sr[0],
      q1: quantile7(sr, 0.25),
      median: quantile7(sr, 0.5),
      q3: quantile7(sr, 0.75),
      max: sr[n - 1]
    };

    return {
      n: n, df: df, slope: b1, intercept: b0,
      coef: [
        { name: '(Intercept)', est: b0, se: seB0, t: stB0.t, p: stB0.p, ci: [ciB0.lo, ciB0.hi] },
        { name: xname, est: b1, se: seB1, t: stB1.t, p: stB1.p, ci: [ciB1.lo, ciB1.hi] }
      ],
      r: r, r2: r2, adjR2: adjr2, sigma: sigma,
      rss: rss, tss: syy, ess: syy - rss,
      fstat: fstat, fdf1: 1, fdf2: df, fp: fp,
      fitted: fitted, resid: resid, residQuantiles: residQuantiles,
      xbar: xbar, ybar: ybar, sxx: sxx, syy: syy, sxy: sxy,
      aic: aic(n, rss, 2), bic: bic(n, rss, 2), logLik: logLik(n, rss),
      conf: conf
    };
  }

  // ---- predict at x0: mean-response (confidence) + new-obs (prediction) ----
  // Matches R predict.lm(interval="confidence") and (interval="prediction").
  function predict(fit, x0, conf) {
    conf = (conf == null) ? fit.conf : conf;
    var b0 = fit.intercept, b1 = fit.slope;
    var yhat = b0 + b1 * x0;
    var lev = (x0 - fit.xbar);
    var base = 1 / fit.n + lev * lev / fit.sxx;
    var seFit = fit.sigma * Math.sqrt(base);        // CI for the mean response
    var sePred = fit.sigma * Math.sqrt(1 + base);   // PI for a new observation
    var crit = T.tQuantile(1 - (1 - conf) / 2, fit.df);
    return {
      x0: x0, fit: yhat,
      seFit: seFit, ciLo: yhat - crit * seFit, ciHi: yhat + crit * seFit,
      sePred: sePred, piLo: yhat - crit * sePred, piHi: yhat + crit * sePred,
      conf: conf
    };
  }

  return {
    coefStats: coefStats,
    coefCI: coefCI,
    fCDF: fCDF,
    fPValue: fPValue,
    adjR2: adjR2,
    r2FromF: r2FromF,
    fFromR2: fFromR2,
    logLik: logLik,
    aic: aic,
    bic: bic,
    nestedF: nestedF,
    rssFromSigma: rssFromSigma,
    quantile7: quantile7,
    fitSimple: fitSimple,
    predict: predict
  };
}));
