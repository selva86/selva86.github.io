/* samplesize-math.js - sample size for a target margin of error (the survey
   estimation arm of the sample-size hub, tools/sample-size-calculator.html).

   Ground truth: R 4.6.0 qnorm, via Scripts/tool-truth/sample-size-calculator.R
   -> sample-size-calculator.json.

   COMPOSES margin-math.js and adds NOTHING to it. margin-math already owns:
     - zcrit(conf)                 the normal critical value
     - sampleSizeProp(E,p,c,N)     Cochran n for a proportion, verified by the
                                   margin-of-error tool
     - propMOE / meanMOE           the margin achieved at a given n
   What is genuinely new here is only the MEAN arm, n = (z*sd/E)^2, which
   margin-math has no counterpart for (it solves margin-from-n for means, not
   n-from-margin). Editing margin-math to add it would have re-pinned every
   page that references it; composing costs nothing and keeps that lib frozen.

   The proportion arm deliberately DELEGATES to MarginMath.sampleSizeProp
   rather than restating the formula, so the two can never drift apart. The
   node harness asserts that delegation still agrees with shrinkToPop() here.

   Arithmetic ordering below mirrors the R script operation-for-operation.
   That is not fussiness: the ceiling makes this bit-sensitive. A 1-ulp drift
   in n0 near a whole number changes the answer by an entire respondent (see
   the prop_edge_exact_int case, where n0 = 100.00000000000003 -> 101). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./margin-math.js'));
  } else {
    root.SampleSizeMath = factory(root.MarginMath);
  }
}(typeof self !== 'undefined' ? self : this, function (M) {
  'use strict';

  function isPop(N) { return !(N == null || !isFinite(N) || N <= 0); }

  // Finite population correction FOR A SAMPLE SIZE: n = n0 / (1 + (n0-1)/N).
  //
  // Not to be confused with margin-math's fpc(n, N) = sqrt((N-n)/(N-1)), which
  // shrinks a MARGIN at a known n. Same idea, different algebra, opposite
  // direction. Mixing them up is the classic bug here, hence the name split.
  function shrinkToPop(n0, N) {
    if (!isPop(N)) return n0;
    return n0 / (1 + (n0 - 1) / N);
  }

  // ---- estimating a PROPORTION ----
  // n0 = z^2 p(1-p) / E^2.  p = 0.5 maximises p(1-p), so it is the honest
  // default when you have no prior estimate: it can only overshoot.
  function sizeProp(E, p, conf, N) {
    var z = M.zcrit(conf);
    var n0 = z * z * p * (1 - p) / (E * E);
    var nExact = shrinkToPop(n0, N);
    // Delegate the headline integer to the already-verified lib.
    var n = M.sampleSizeProp(E, p, conf, isPop(N) ? N : null).n;
    return { n0: n0, nExact: nExact, n: n, z: z };
  }

  // ---- estimating a MEAN ----
  // n0 = (z * sd / E)^2. Uses z, not t: n is unknown at planning time, so the
  // t df are unknown too. The page teaches this approximation honestly and
  // points at the margin-of-error tool for the t-based margin once n is fixed.
  function sizeMean(E, sd, conf, N) {
    var z = M.zcrit(conf);
    var t = z * sd / E;
    var n0 = t * t;                    // mirrors R's x^2 (R_pow special-cases 2)
    var nExact = shrinkToPop(n0, N);
    return { n0: n0, nExact: nExact, n: Math.ceil(nExact), z: z };
  }

  // ---- margin actually delivered by the whole-person n ----
  // Ceiling only ever adds people, so this is always at least as tight as the
  // margin asked for. Straight passthrough to the verified margin lib; method
  // 'z' keeps the round trip consistent with the z-based n above.
  function marginAt(mode, n, conf, N, p, sd) {
    if (mode === 'prop') return M.propMOE(p, n, conf, isPop(N) ? N : null).moe;
    return M.meanMOE(sd, n, conf, 'z', isPop(N) ? N : null).moe;
  }

  // Degenerate inputs the closed form cannot answer, surfaced for the UI to
  // explain rather than silently returning a nonsense n.
  //   p = 0 or 1 -> p(1-p) = 0 -> n = 0. The Wald form has no variance to
  //   cover, which is an artefact of the approximation, not a real answer.
  function degenerate(mode, p) {
    if (mode !== 'prop') return null;
    if (p === 0 || p === 1) return 'boundary-p';
    return null;
  }

  return {
    sizeProp: sizeProp, sizeMean: sizeMean, marginAt: marginAt,
    shrinkToPop: shrinkToPop, degenerate: degenerate,
    zcrit: function (c) { return M.zcrit(c); }
  };
}));
