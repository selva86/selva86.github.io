/* pearson-r-math.js - critical values of the Pearson correlation coefficient
   (wave-3). Ground truth: R 4.6.0 stats::cor.test + the qt-derived identity,
   verified in Scripts/tool-truth/test-pearson-critical-values-table-math.js at
   <= 1e-6 relative.

   REUSES the R-verified machinery in dist-tables-math.js (window.DistTables),
   which is shared by t-table / z-table / chi-square-table / f-table /
   p-value-calculator and is deliberately NOT edited here:
     - critR -> critical r at alpha  = tc / sqrt(df + tc^2), tc = qt(...)
     - rToT  -> t = r * sqrt(df / (1 - r^2))
     - pvR   -> p-value for an observed r (deep tails taken from the
                non-cancelling side, so p does not underflow to 0 early)
   and EXTENDS it additively with the reverse lookup (smallest n at which an r
   clears its critical value) and a one-call bundle for the page.

   The whole tool rests on ONE identity. A Pearson r is tested by converting it
   to a t statistic on df = n - 2:

       t = r * sqrt(df) / sqrt(1 - r^2)

   Invert it and the critical r drops out of the critical t:

       t^2 (1 - r^2) = r^2 df  ->  t^2 = r^2 (df + t^2)  ->  r = t / sqrt(df + t^2)

   so r_crit(alpha, df) = qt(1 - alpha/2, df) / sqrt(df + qt(1 - alpha/2, df)^2)
   for a two-tailed test. That is the whole printed table.

   Browser: window.PearsonRMath (load normal-math -> ttest-math ->
   dist-tables-math first). Node: require('./pearson-r-math.js'). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports)
    module.exports = factory(require('./dist-tables-math.js'));
  else root.PearsonRMath = factory(root.DistTablesMath);
}(typeof self !== 'undefined' ? self : this, function (D) {
  'use strict';

  // The rows the printed table carries: every df a textbook table prints.
  var DF_ROWS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17,
    18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 35, 40, 45, 50, 60,
    70, 80, 90, 100];
  // Classic column pairs: one column serves BOTH a two-tailed alpha and its
  // one-tailed half, because qt(1 - a/2, df) === qt(1 - (a/2), df).
  var ALPHA_PAIRS = [
    { two: 0.10, one: 0.050 },
    { two: 0.05, one: 0.025 },
    { two: 0.02, one: 0.010 },
    { two: 0.01, one: 0.005 }
  ];

  function critR(alpha, n, tail) { return D.critR(alpha, n, tail); }
  function rToT(r, n) { return D.rToT(r, n); }
  function pvR(r, n, tail) { return D.pvR(r, n, tail); }

  // Critical r straight from df (the table's own axis) rather than n.
  function critRfromDf(alpha, df, tail) { return D.critR(alpha, df + 2, tail); }

  // ---- reverse lookup ---------------------------------------------------
  // Smallest n >= 3 at which |r| STRICTLY exceeds the critical value at alpha.
  // df = 1 is the floor: n = 3 is the smallest sample with a testable r.
  // Monotone in n, so a linear scan from 3 is exact; capped to stay finite for
  // r values that never reach significance in a sane sample.
  function minNForR(r, alpha, tail) {
    var a = Math.abs(r);
    if (!(a > 0) || a >= 1) return (a >= 1) ? 3 : null;
    for (var n = 3; n <= 100000; n++) {
      if (a > critR(alpha, n, tail)) return n;
    }
    return null;
  }

  // ---- one-call bundle for the page ------------------------------------
  // Everything the lookup card shows, from one r + n + tail.
  function lookup(r, n, tail) {
    var df = n - 2;
    var t = rToT(r, n);
    var p = pvR(r, n, tail);
    var crits = ALPHA_PAIRS.map(function (pair) {
      var alpha = (tail === 'two') ? pair.two : pair.one;
      return { alpha: alpha, r: critR(alpha, n, tail) };
    });
    return { r: r, n: n, df: df, t: t, p: p, tail: tail, crits: crits };
  }

  // Verdict at one alpha. A t-based test rejects when |r| > r_crit, and for a
  // one-tailed test only when r points the way the alternative claims.
  function verdict(r, n, alpha, tail) {
    var rc = critR(alpha, n, tail);
    var sig;
    if (tail === 'two') sig = Math.abs(r) > rc;
    else if (tail === 'right') sig = r > rc;
    else sig = r < -rc;
    return { significant: sig, crit: rc, p: pvR(r, n, tail) };
  }

  return {
    DF_ROWS: DF_ROWS,
    ALPHA_PAIRS: ALPHA_PAIRS,
    critR: critR,
    critRfromDf: critRfromDf,
    rToT: rToT,
    pvR: pvR,
    minNForR: minNForR,
    lookup: lookup,
    verdict: verdict
  };
}));
