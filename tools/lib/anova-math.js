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
    adjR2: adjR2
  };
}));
