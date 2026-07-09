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
    rssFromSigma: rssFromSigma
  };
}));
