/* poisson-math.js - Poisson(lambda) probabilities for Tool Farm v2.
   Ground truth: R 4.6.0 dpois / ppois / qpois
   (see Scripts/tool-truth/poisson-distribution-calculator.json).
   Composes normal-math.js (lgamma for the PMF; pnorm/qnorm for the
   normal-approximation note and the qpois initial guess). It adds nothing
   to the shared lib.

   Tail accuracy comes from the regularized incomplete gamma, the identity
   R's own C code uses:
     P(X <= k) = Q(k+1, lambda)   (upper regularized incomplete gamma)
     P(X >= k) = P(k,   lambda)   (lower regularized incomplete gamma)
   Each tail is evaluated in the branch (series for x < a+1, continued
   fraction otherwise) that returns it directly, so a deep tail never loses
   precision to a long running sum. normal-math exports only gammq, whose
   accurate branch is a single tail; carrying both the series and the
   continued fraction here lets each Poisson tail pick its own branch. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./normal-math.js'));
  } else {
    root.PoissonMath = factory(root.NormalMath);
  }
}(typeof self !== 'undefined' ? self : this, function (N) {
  'use strict';

  var lgamma = N.lgamma;

  // regularized lower incomplete gamma P(a,x) by series (accurate when x < a+1)
  function gser(a, x) {
    var ITMAX = 1000, EPS = 3e-16;
    var gln = lgamma(a), ap = a, sum = 1 / a, del = sum;
    for (var n = 1; n <= ITMAX; n++) {
      ap += 1; del *= x / ap; sum += del;
      if (Math.abs(del) < Math.abs(sum) * EPS) break;
    }
    return sum * Math.exp(-x + a * Math.log(x) - gln);
  }
  // regularized upper incomplete gamma Q(a,x) by continued fraction (x >= a+1)
  function gcf(a, x) {
    var ITMAX = 1000, EPS = 3e-16, FPMIN = 1e-300;
    var gln = lgamma(a), b = x + 1 - a, c = 1 / FPMIN, d = 1 / b, h = d;
    for (var i = 1; i <= ITMAX; i++) {
      var an = -i * (i - a);
      b += 2;
      d = an * d + b; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = b + an / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d;
      var del = d * c; h *= del;
      if (Math.abs(del - 1) < EPS) break;
    }
    return Math.exp(-x + a * Math.log(x) - gln) * h;
  }
  // { p: P(a,x), q: Q(a,x) } with each side accurate in its own branch.
  function gammaPQ(a, x) {
    if (x < 0 || a <= 0) return { p: NaN, q: NaN };
    if (x === 0) return { p: 0, q: 1 };
    if (x < a + 1) { var p = gser(a, x); return { p: p, q: 1 - p }; }
    var q = gcf(a, x); return { p: 1 - q, q: q };
  }

  // P(X = k) for X ~ Poisson(lambda). Exact boundary handling for lambda = 0.
  function dpois(k, lambda) {
    if (k < 0 || k !== Math.round(k)) return 0;
    if (lambda === 0) return k === 0 ? 1 : 0;
    return Math.exp(k * Math.log(lambda) - lambda - lgamma(k + 1));
  }

  // P(X <= k). k is floored (the CDF is a step function). = Q(k+1, lambda).
  function ppois(k, lambda) {
    k = Math.floor(k);
    if (k < 0) return 0;
    if (lambda === 0) return 1;          // all mass at 0
    return gammaPQ(k + 1, lambda).q;
  }

  // P(X >= k), tail-accurate. k is ceiled. = P(k, lambda).
  function ppoisUpper(k, lambda) {
    k = Math.ceil(k);
    if (k <= 0) return 1;
    if (lambda === 0) return 0;          // all mass at 0 (< k, since k >= 1)
    return gammaPQ(k, lambda).p;
  }

  // P(a <= X <= b) = P(X <= b) - P(X <= a-1).
  function ppoisRange(a, b, lambda) {
    a = Math.ceil(a); b = Math.floor(b);
    if (b < a) return 0;
    return ppois(b, lambda) - ppois(a - 1, lambda);
  }

  // Smallest integer k with P(X <= k) >= target. Matches R qpois. Our
  // incomplete-gamma CDF carries slightly more compute noise than R's, so we
  // compare with a 1e-9 slack: orders of magnitude above the noise, far below
  // the gap between distinct CDF steps for any query a user can specify.
  var QTOL = 1e-9;
  function ge(cdf, t) { return cdf >= t - QTOL; }
  function qpois(target, lambda) {
    if (target <= 0) return 0;
    if (target >= 1) return Infinity;
    if (lambda === 0) return 0;
    // Cornish-Fisher initial guess (mean = var = lambda, skew = 1/sqrt(lambda)),
    // then a short local search so the exact CDF decides the boundary.
    var sigma = Math.sqrt(lambda), z = N.qnorm(target), gamma = 1 / sigma;
    var y = Math.floor(lambda + sigma * (z + gamma * (z * z - 1) / 6) + 0.5);
    if (y < 0) y = 0;
    var cap = Math.ceil(lambda + 40 * sigma + 1000);   // safety net; never hit in practice
    if (ge(ppois(y, lambda), target)) {
      while (y > 0 && ge(ppois(y - 1, lambda), target)) y--;
    } else {
      while (y < cap && !ge(ppois(y, lambda), target)) y++;
    }
    return y;
  }

  function mean(lambda) { return lambda; }
  function variance(lambda) { return lambda; }
  function sd(lambda) { return Math.sqrt(lambda); }

  // Normal-approximation note. Rule of thumb: lambda >= 10. Continuity-corrected
  // so the page can show exact-vs-approx side by side.
  function normalOK(lambda) { return lambda >= 10; }
  function normalApproxLE(k, lambda) {   // ~ P(X <= k)
    var s = Math.sqrt(lambda);
    if (s === 0) return k >= 0 ? 1 : 0;
    return N.pnorm((k + 0.5 - lambda) / s);
  }
  function normalApproxGE(k, lambda) {   // ~ P(X >= k)
    var s = Math.sqrt(lambda);
    if (s === 0) return k <= 0 ? 1 : 0;
    return N.pnorm(-(k - 0.5 - lambda) / s);
  }
  function normalApproxEq(k, lambda) {   // ~ P(X = k)
    return normalApproxLE(k, lambda) - normalApproxLE(k - 1, lambda);
  }

  return {
    dpois: dpois, ppois: ppois, ppoisUpper: ppoisUpper,
    ppoisRange: ppoisRange, qpois: qpois,
    mean: mean, variance: variance, sd: sd,
    normalOK: normalOK, normalApproxLE: normalApproxLE,
    normalApproxGE: normalApproxGE, normalApproxEq: normalApproxEq
  };
}));
