/* icc-math.js - intraclass correlation (Shrout & Fleiss 1979) for the ICC
   calculator (Tool Farm v2).

   Ground truth: R  psych::ICC(x, lmer = FALSE)  -- see
   Scripts/tool-truth/icc-calculator.json.

   WHY lmer = FALSE IS THE TARGET (psych's own default is lmer = TRUE):
     The lmer path fits the two-way random-effects model with lme4 (REML) and
     back-computes the mean squares from the variance components. It is an
     iterative optimizer, so it reproduces the closed form only to convergence
     tolerance (~1e-3 on clean balanced data), and it clamps negative variance
     components at zero -- turning a genuinely negative ICC into 0.00. The
     lmer = FALSE path is the exact Shrout & Fleiss ANOVA closed form: it is
     deterministic, it is what every textbook prints, and it is reproducible
     here to machine precision. The page emits lmer = FALSE in its R snippet
     so the code a reader copies reproduces the numbers they are looking at.

   Composes the existing verified primitives rather than re-deriving them:
     - DistTablesMath: pf / qf (adaptive inversion, fractional df) and pvF
       (right-tail F via the beta symmetry I_x(a,b) = 1 - I_{1-x}(b,a), so the
       deep tail stays exact instead of underflowing through 1 - pf).

   Browser: window.ICCMath (needs NormalMath + TTestMath + DistTablesMath first).
   Node: require('./icc-math.js'). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./dist-tables-math.js'));
  } else {
    root.ICCMath = factory(root.DistTablesMath);
  }
}(typeof self !== 'undefined' ? self : this, function (D) {
  'use strict';

  // ====================================================================
  //  Two-way ANOVA decomposition of a complete n x k matrix
  //  (rows = subjects/targets, columns = raters/judges).
  //
  //  Balanced and orthogonal, so the closed form below is exact and the
  //  order of the subject / judge terms does not matter.
  // ====================================================================
  function twoWayAnova(x) {
    var n = x.length, k = x[0].length, i, j;

    var total = 0;
    for (i = 0; i < n; i++) for (j = 0; j < k; j++) total += x[i][j];
    var grand = total / (n * k);

    var rowM = [], colM = [];
    for (i = 0; i < n; i++) {
      var rs = 0;
      for (j = 0; j < k; j++) rs += x[i][j];
      rowM.push(rs / k);
    }
    for (j = 0; j < k; j++) {
      var cs = 0;
      for (i = 0; i < n; i++) cs += x[i][j];
      colM.push(cs / n);
    }

    var SSB = 0, SSJ = 0, SST = 0;
    for (i = 0; i < n; i++) SSB += (rowM[i] - grand) * (rowM[i] - grand);
    SSB *= k;
    for (j = 0; j < k; j++) SSJ += (colM[j] - grand) * (colM[j] - grand);
    SSJ *= n;
    for (i = 0; i < n; i++) for (j = 0; j < k; j++) {
      SST += (x[i][j] - grand) * (x[i][j] - grand);
    }

    // Residual by subtraction. Catastrophic cancellation can push this a few
    // ulps below zero when the raters agree exactly; clamp at 0 (a sum of
    // squares is never negative).
    var SSE = SST - SSB - SSJ;
    if (SSE < 0) SSE = 0;

    var dfB = n - 1, dfJ = k - 1, dfE = (n - 1) * (k - 1);

    return {
      n: n, k: k,
      dfB: dfB, dfJ: dfJ, dfE: dfE,
      SSB: SSB, SSJ: SSJ, SSE: SSE, SST: SST,
      MSB: SSB / dfB,                       // between subjects
      MSJ: SSJ / dfJ,                       // between judges
      MSE: SSE / dfE,                       // residual
      MSW: (SSJ + SSE) / (dfJ + dfE),       // one-way within-subject
      grand: grand, rowMeans: rowM, colMeans: colM
    };
  }

  // Right-tail F probability, accurate into the deep tail.
  function pUpper(F, d1, d2) {
    if (!isFinite(F)) return 0;
    return D.pvF(F, d1, d2, 'upper');
  }

  // ====================================================================
  //  The six ICC forms.
  //
  //  Shrout & Fleiss naming, as psych reports it:
  //    ICC1  = one-way random,   single rater      (absolute, raters random)
  //    ICC2  = two-way random,   single rater      (absolute agreement)
  //    ICC3  = two-way mixed,    single rater      (consistency)
  //    ICC1k / ICC2k / ICC3k = the average-of-k-raters counterparts
  // ====================================================================
  var TYPES = ['ICC1', 'ICC2', 'ICC3', 'ICC1k', 'ICC2k', 'ICC3k'];

  function analyze(x, alpha) {
    if (alpha === undefined || alpha === null) alpha = 0.05;
    var a = twoWayAnova(x);
    var n = a.n, k = a.k;
    var MSB = a.MSB, MSJ = a.MSJ, MSE = a.MSE, MSW = a.MSW;

    // --- point estimates -------------------------------------------------
    var ICC1 = (MSB - MSW) / (MSB + (k - 1) * MSW);
    var ICC2 = (MSB - MSE) / (MSB + (k - 1) * MSE + k * (MSJ - MSE) / n);
    var ICC3 = (MSB - MSE) / (MSB + (k - 1) * MSE);
    var ICC1k = (MSB - MSW) / MSB;
    var ICC2k = (MSB - MSE) / (MSB + (MSJ - MSE) / n);
    var ICC3k = (MSB - MSE) / MSB;

    // The point estimates above need no special-casing when the residual
    // vanishes: plain IEEE arithmetic already gives the right limit. With
    // MSE = 0, ICC3 = MSB/MSB = 1 and ICC2 = MSB/(MSB + k*MSJ/n), which is
    // NOT 1 -- a constant offset between raters leaves consistency perfect
    // while absolute agreement stays capped by the judge term. Only the F
    // ratios and the intervals below need the limit taken by hand, because
    // they divide by zero and land on Inf/Inf = NaN.
    //
    // (R's QR-based aov reaches ~1e-28 of floating noise instead of an exact
    // zero, which is why its F prints as ~1e31 rather than infinity. The
    // estimates and bounds agree; only F and p differ, and only in the
    // exactly-perfect case.)
    var perfectWithin = (MSE === 0 && MSB > 0);   // no residual disagreement
    var perfectOneWay = (MSW === 0 && MSB > 0);   // no residual AND no judge effect

    // --- F tests ---------------------------------------------------------
    var F11 = perfectOneWay ? Infinity : MSB / MSW;
    var df11n = n - 1, df11d = n * (k - 1);
    var p11 = pUpper(F11, df11n, df11d);

    var F21 = perfectWithin ? Infinity : MSB / MSE;
    var df21n = n - 1, df21d = (n - 1) * (k - 1);
    var p21 = pUpper(F21, df21n, df21d);

    // --- confidence bounds ----------------------------------------------
    // ICC1 / ICC1k and ICC3 / ICC3k invert the F ratio directly.
    var lo = [NaN, NaN, NaN, NaN, NaN, NaN];
    var hi = [NaN, NaN, NaN, NaN, NaN, NaN];

    if (perfectOneWay) {
      lo[0] = hi[0] = 1; lo[3] = hi[3] = 1;
    } else {
      var F1L = F11 / D.qf(1 - alpha / 2, df11n, df11d);
      var F1U = F11 * D.qf(1 - alpha / 2, df11d, df11n);
      lo[0] = (F1L - 1) / (F1L + (k - 1));
      hi[0] = (F1U - 1) / (F1U + k - 1);
      lo[3] = 1 - 1 / F1L;
      hi[3] = 1 - 1 / F1U;
    }

    if (perfectWithin) {
      // F21 diverges, so (F-1)/(F+k-1) -> 1 for the consistency forms.
      lo[2] = hi[2] = 1; lo[5] = hi[5] = 1;
    } else {
      var F3L = F21 / D.qf(1 - alpha / 2, df21n, df21d);
      var F3U = F21 * D.qf(1 - alpha / 2, df21d, df21n);
      lo[2] = (F3L - 1) / (F3L + k - 1);
      hi[2] = (F3U - 1) / (F3U + k - 1);
      lo[5] = 1 - 1 / F3L;
      hi[5] = 1 - 1 / F3U;
    }

    // ICC2 keeps a real interval even when the residual vanishes, because the
    // judge term survives in its denominator. It needs a Satterthwaite-style
    // approximate df, which is fractional.
    var Fj = MSJ / MSE;
    var v;
    if (perfectWithin) {
      // Fj -> infinity, and v = vn/vd -> (k-1)(n-1)/(n-1) = k-1.
      v = k - 1;
    } else {
      var vn = (k - 1) * (n - 1) *
               Math.pow(k * ICC2 * Fj + n * (1 + (k - 1) * ICC2) - k * ICC2, 2);
      var vd = (n - 1) * k * k * ICC2 * ICC2 * Fj * Fj +
               Math.pow(n * (1 + (k - 1) * ICC2) - k * ICC2, 2);
      v = vn / vd;
    }
    var FU = D.qf(1 - alpha / 2, n - 1, v);
    var FL = D.qf(1 - alpha / 2, v, n - 1);
    var L3 = n * (MSB - FU * MSE) /
             (FU * (k * MSJ + (k * n - k - n) * MSE) + n * MSB);
    var U3 = n * (FL * MSB - MSE) /
             (k * MSJ + (k * n - k - n) * MSE + n * FL * MSB);
    lo[1] = L3; hi[1] = U3;
    // The average-measure transform. This is singular when 1 + L3*(k-1)
    // crosses zero, which happens for sufficiently negative ICC -- psych has
    // the same behaviour and can report a "lower" bound above its "upper"
    // bound there. Reproduced faithfully; the page suppresses the interval
    // instead of printing the artefact.
    lo[4] = L3 * k / (1 + L3 * (k - 1));
    hi[4] = U3 * k / (1 + U3 * (k - 1));
    a.v = v;

    var est = [ICC1, ICC2, ICC3, ICC1k, ICC2k, ICC3k];
    var Fv = [F11, F21, F21, F11, F21, F21];
    var d1 = [df11n, df21n, df21n, df11n, df21n, df21n];
    var d2 = [df11d, df21d, df21d, df11d, df21d, df21d];
    var pv = [p11, p21, p21, p11, p21, p21];

    var rows = [];
    for (var i = 0; i < 6; i++) {
      rows.push({
        type: TYPES[i],
        icc: est[i],
        F: Fv[i],
        df1: d1[i],
        df2: d2[i],
        p: pv[i],
        lower: lo[i],
        upper: hi[i]
      });
    }

    return {
      n: n, k: k, alpha: alpha,
      anova: a,
      rows: rows,
      byType: rows.reduce(function (o, r) { o[r.type] = r; return o; }, {}),
      perfect: perfectWithin && perfectOneWay
    };
  }

  // ====================================================================
  //  The WHICH-ICC picker.
  //
  //  Three questions decide the form; this maps the answers onto the
  //  Shrout & Fleiss name and explains the choice in plain language.
  //    design: 'oneway'   each subject rated by a DIFFERENT set of raters
  //            'random'   same raters, and they are a sample of many
  //            'fixed'    same raters, and these exact raters are the whole story
  //    agree:  'absolute' | 'consistency'   (ignored when design is 'oneway')
  //    unit:   'single' | 'average'
  // ====================================================================
  function recommend(design, agree, unit) {
    var base, why;
    if (design === 'oneway') {
      base = 'ICC1';
      why = 'Each subject was rated by a different set of raters, so there is no ' +
            'rater column to model. That is the one-way random design, and it can ' +
            'only ever measure absolute agreement.';
    } else if (design === 'fixed' || agree === 'consistency') {
      base = 'ICC3';
      why = (design === 'fixed')
        ? 'The same raters rated everyone and these exact raters are the only ones ' +
          'you care about, so rater differences are a fixed effect, not error. ' +
          'That is the two-way mixed model.'
        : 'The same raters rated everyone and you only need them to rank subjects ' +
          'the same way, so a constant offset between raters is not counted as ' +
          'disagreement. That is consistency.';
    } else {
      base = 'ICC2';
      why = 'The same raters rated everyone, they stand in for a wider pool of raters, ' +
            'and you need them to land on the same number, not just the same order. ' +
            'That is two-way random with absolute agreement.';
    }
    var type = (unit === 'average') ? base + 'k' : base;
    return {
      type: type,
      base: base,
      why: why,
      unitWhy: (unit === 'average')
        ? 'You will report the mean of all raters as the score, so the average-measure ' +
          'form applies. Averaging cancels some rater noise, so this is always the ' +
          'higher number -- it is only honest if the mean really is what gets used.'
        : 'A single rater will produce the score in real use, so the single-measure ' +
          'form applies. This is the reliability of one typical rater.'
    };
  }

  // Koo & Li (2016) bands - the convention most journals now cite, applied to
  // the LOWER confidence bound rather than the point estimate.
  function band(v) {
    if (!isFinite(v)) return { label: 'undefined', tone: 'bad' };
    if (v < 0.5) return { label: 'poor', tone: 'bad' };
    if (v < 0.75) return { label: 'moderate', tone: 'warn' };
    if (v < 0.9) return { label: 'good', tone: 'ok' };
    return { label: 'excellent', tone: 'great' };
  }

  return {
    version: '1.0.0',
    TYPES: TYPES,
    twoWayAnova: twoWayAnova,
    analyze: analyze,
    recommend: recommend,
    band: band
  };
}));
