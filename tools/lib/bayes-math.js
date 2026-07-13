/* bayes-math.js - exact Bayes' theorem math for Tool Farm v2.
   Ground truth: R 4.6.0 closed-form arithmetic (see
   Scripts/tool-truth/bayes-theorem.json). Deterministic - no RNG, no
   special functions; R and JS share IEEE-754 doubles and operations, so
   every result is bit-for-bit identical to R. Self-contained in both the
   browser (window.BayesMath) and Node (require). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.BayesMath = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Core update: posterior odds are prior odds times the likelihood ratio,
  // renormalised. Written as a single ratio to match R exactly.
  //   bayes(prior, pdh, pdnh) = pdh*prior / (pdh*prior + pdnh*(1-prior))
  function bayes(prior, pdh, pdnh) {
    var num = pdh * prior;
    var den = num + pdnh * (1 - prior);
    return num / den;               // 0/0 -> NaN, x/0 -> Inf, same as R
  }

  // Diagnostic-test aliases: prior=prevalence, pdh=sensitivity,
  // pdnh=false-positive rate=1-specificity.
  function ppv(prev, sens, spec) { return bayes(prev, sens, 1 - spec); }
  // P(no disease | negative test): flip prior, use specificity as the
  // likelihood of a negative under "well" and 1-sensitivity under "sick".
  function npv(prev, sens, spec) { return bayes(1 - prev, spec, 1 - sens); }

  function lrPos(sens, spec) { return sens / (1 - spec); }        // Inf when spec=1
  function lrNeg(sens, spec) { return (1 - sens) / spec; }
  function preOdds(p)        { return p / (1 - p); }              // Inf when p=1
  function posteriorFromOdds(o) { return o / (1 + o); }
  // Post-test odds from a positive result = pre-test odds * LR+.
  function postOdds(prior, sens, spec) { return preOdds(prior) * lrPos(sens, spec); }

  // Natural-frequency breakdown of a population of N under the generic
  // (prior, pdh, pdnh) frame. For medical use pdh=sens, pdnh=1-spec.
  function populationCounts(prior, pdh, pdnh, N) {
    if (N == null) N = 10000;
    var posPop = N * prior, negPop = N * (1 - prior);
    var tp = posPop * pdh, fn = posPop * (1 - pdh);
    var fp = negPop * pdnh, tn = negPop * (1 - pdnh);
    return {
      posPop: posPop, negPop: negPop,
      tp: tp, fn: fn, fp: fp, tn: tn,
      ppvFromCounts: tp / (tp + fp)
    };
  }

  // Full generic frame: numerator, denominator, posterior + the per-N counts.
  function frame(prior, pdh, pdnh, N) {
    var num = pdh * prior;
    var den = num + pdnh * (1 - prior);
    var c = populationCounts(prior, pdh, pdnh, N);
    return {
      prior: prior, pdh: pdh, pdnh: pdnh,
      num: num, den: den, posterior: num / den,
      tp: c.tp, fn: c.fn, fp: c.fp, tn: c.tn,
      posPop: c.posPop, negPop: c.negPop,
      ppv_from_counts: c.ppvFromCounts
    };
  }

  // Medical/diagnostic frame: everything the page shows for a positive result.
  function medical(prev, sens, spec, N) {
    var f = frame(prev, sens, 1 - spec, N);
    var oPre = preOdds(prev);
    var lrp = lrPos(sens, spec);
    var oPost = oPre * lrp;
    f.ppv = f.posterior;
    f.npv = npv(prev, sens, spec);
    f.lr_pos = lrp;
    f.lr_neg = lrNeg(sens, spec);
    f.pre_odds = oPre;
    f.post_odds = oPost;
    f.post_from_odds = posteriorFromOdds(oPost);
    return f;
  }

  // Two sequential tests, positive both times. Assumes conditional
  // independence given the true state: the first posterior is the second
  // test's prior.
  function chain(prev, sens1, spec1, sens2, spec2, N) {
    if (N == null) N = 10000;
    var post1 = ppv(prev, sens1, spec1);
    var post2 = ppv(post1, sens2, spec2);
    var sick = N * prev, well = N * (1 - prev);
    var tp1 = sick * sens1, fp1 = well * (1 - spec1);
    var tp2 = tp1 * sens2, fp2 = fp1 * (1 - spec2);
    return {
      prev: prev, sens1: sens1, spec1: spec1, sens2: sens2, spec2: spec2,
      post1: post1, post2: post2,
      tp1: tp1, fp1: fp1, tp2: tp2, fp2: fp2,
      ppv1: tp1 / (tp1 + fp1), ppv2: tp2 / (tp2 + fp2)
    };
  }

  return {
    bayes: bayes, ppv: ppv, npv: npv,
    lrPos: lrPos, lrNeg: lrNeg, preOdds: preOdds,
    postOdds: postOdds, posteriorFromOdds: posteriorFromOdds,
    populationCounts: populationCounts,
    frame: frame, medical: medical, chain: chain
  };
}));
