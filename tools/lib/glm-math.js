/* glm-math.js - exact generalized-linear-model summary math for Tool Farm v2
   (tools/glm-output-interpreter.html).

   Ground truth: R 4.6.0 stats::glm / summary / confint.default / AIC / BIC /
   logLik / anova / pchisq / pf / pnorm / pt ; MASS::glm.nb
   (see Scripts/tool-truth/glm-output-interpreter.json).

   Replaces four unverified inline approximations in the predecessor:
     - qnorm Acklam without Halley refinement -> exact NormalMath.qnorm
     - chi-sq upper tail (gammaSeries/gammaCF) -> exact NormalMath.gammq
     - F upper tail (betaIncReg/betaCF)        -> exact TTestMath.ibeta
     - probit series approximation             -> exact NormalMath.pnorm

   Every distribution primitive is one already verified for the z-score / t-test
   / CI tools, so nothing new needs its own proof.

   Coefficient p-values follow summary(glm): a normal (z) reference when the
   dispersion is fixed at 1 (binomial / poisson / negative-binomial) and a
   Student-t reference on the residual df when the dispersion is estimated
   (quasi-* / Gamma / gaussian). Coefficient CIs are the Wald normal intervals
   that confint.default() returns for every family (est +/- qnorm * SE), which
   is what the emitted `exp(confint.default(fit))` reproduces.

   Browser: window.GLMMath (needs window.NormalMath + window.TTestMath first).
   Node:    require('./glm-math.js'). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./normal-math.js'), require('./ttest-math.js'));
  } else {
    root.GLMMath = factory(root.NormalMath, root.TTestMath);
  }
}(typeof self !== 'undefined' ? self : this, function (N, T) {
  'use strict';

  // ---- coefficient statistic + two-sided p ----
  // dist === 'z' : stat = est/SE, p = 2*pnorm(-|stat|)           (dispersion fixed)
  // dist === 't' : stat = est/SE, p = 2*pt(-|stat|, df_resid)    (dispersion estimated)
  function coefStat(est, se, df, dist) {
    var stat = est / se;
    var p = (dist === 't')
      ? T.pTwoTailed(stat, df)          // = 2*pt(-|stat|, df)
      : 2 * N.pnorm(-Math.abs(stat));   // z reference
    return { stat: stat, p: p };
  }

  // ---- Wald confidence interval, matches confint.default(glm, level=conf) ----
  // est +/- qnorm(1-(1-conf)/2) * SE  (normal quantile for EVERY family)
  function coefCI(est, se, conf) {
    var crit = N.qnorm(1 - (1 - conf) / 2);
    return { lo: est - crit * se, hi: est + crit * se, crit: crit };
  }

  // ---- exponentiated coefficient + CI (odds ratio / rate ratio) ----
  function expCI(est, se, conf) {
    var ci = coefCI(est, se, conf);
    return { est: Math.exp(est), lo: Math.exp(ci.lo), hi: Math.exp(ci.hi) };
  }

  // ---- chi-square upper tail = pchisq(x, k, lower.tail = FALSE) ----
  // = Q(k/2, x/2), the regularized upper incomplete gamma.
  function chisqUpper(x, k) {
    if (x <= 0) return 1;
    return N.gammq(k / 2, x / 2);
  }

  // ---- model-level likelihood-ratio test against the null model ----
  // LR = null deviance - residual deviance ~ chi-sq on (df_null - df_resid).
  function lrTest(nullDev, nullDf, residDev, residDf) {
    var lr = nullDev - residDev;
    var df = nullDf - residDf;
    return { lr: lr, df: df, p: chisqUpper(lr, df) };
  }

  // ---- residual-deviance goodness-of-fit / overdispersion p ----
  // pchisq(residDev, residDf, lower.tail = FALSE)
  function devianceGOF(residDev, residDf) {
    return chisqUpper(residDev, residDf);
  }

  // ---- deviance-ratio pseudo-R^2 = 1 - residDev/nullDev ----
  // (the quantity computable from a pasted summary; NOT McFadden's logLik ratio,
  //  which needs the fitted object.  Labelled honestly on the page.)
  function pseudoR2(nullDev, residDev) {
    return 1 - residDev / nullDev;
  }

  // ---- dispersion estimate from deviance / residual df ----
  function dispersionRatio(residDev, residDf) {
    return residDev / residDf;
  }

  // ---- BIC reconstructed from the reported AIC ----
  // AIC = 2k - 2logLik ; BIC = log(n)k - 2logLik = AIC - 2k + log(n)k.
  // k = attr(logLik, "df") = #coefficients (+1 for gaussian/Gamma dispersion).
  function bicFromAic(aic, k, n) {
    return aic - 2 * k + Math.log(n) * k;
  }

  // ---- F upper tail = pf(f, df1, df2, lower.tail = FALSE) ----
  // 1 - I_x(d1/2,d2/2) = I_{1-x}(d2/2, d1/2), x = d1*f/(d1*f+d2).
  function fUpperTail(f, df1, df2) {
    if (f <= 0) return 1;
    var oneMinusX = df2 / (df1 * f + df2);
    return T.ibeta(df2 / 2, df1 / 2, oneMinusX);
  }

  // ---- nested-model LR chi-square test, matches anova(small, big, test="Chisq") ----
  // big must nest small (more terms). dev = devSmall - devBig on dfSmall - dfBig.
  function nestedChisq(devSmall, dfSmall, devBig, dfBig) {
    var dev = devSmall - devBig;
    var df = dfSmall - dfBig;
    return { dev: dev, df: df, p: chisqUpper(dev, df) };
  }

  // ---- nested-model F test for quasi families, matches anova(small, big, test="F") ----
  // F = ((devSmall - devBig)/(dfSmall - dfBig)) / phi_big ; p = pf(F, df1, df2=dfBig).
  function nestedF(devSmall, dfSmall, devBig, dfBig, phiBig) {
    var df1 = dfSmall - dfBig, df2 = dfBig;
    var f = ((devSmall - devBig) / df1) / phiBig;
    return { f: f, df1: df1, df2: df2, p: fUpperTail(f, df1, df2) };
  }

  return {
    coefStat: coefStat,
    coefCI: coefCI,
    expCI: expCI,
    chisqUpper: chisqUpper,
    lrTest: lrTest,
    devianceGOF: devianceGOF,
    pseudoR2: pseudoR2,
    dispersionRatio: dispersionRatio,
    bicFromAic: bicFromAic,
    fUpperTail: fUpperTail,
    nestedChisq: nestedChisq,
    nestedF: nestedF
  };
}));
