/* binomial-math.js - Binomial(n, p) probabilities for Tool Farm v2.
   Ground truth: R 4.6.0 dbinom / pbinom / qbinom
   (see Scripts/tool-truth/binomial-probability-calculator.json).
   Composes ttest-math.js (lgamma + regularized incomplete beta) and
   normal-math.js (pnorm, for the normal-approximation note). It adds
   nothing to the shared libs. In the browser the factory reads the
   globals; in Node it is handed the modules via require.

   Tail accuracy comes from the beta identity, exactly as R's C code:
     P(X <= k) = I_{1-p}(n-k, k+1)            (lower tail, ibeta)
     P(X >= k) = I_{p}(k, n-k+1)              (upper tail, ibeta)
   so deep tails never lose precision to a long running sum. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./ttest-math.js'), require('./normal-math.js'));
  } else {
    root.BinomialMath = factory(root.TTestMath, root.NormalMath);
  }
}(typeof self !== 'undefined' ? self : this, function (T, N) {
  'use strict';

  var lgamma = T.lgamma, ibeta = T.ibeta;

  // log(n choose k)
  function lchoose(n, k) {
    if (k < 0 || k > n) return -Infinity;
    return lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1);
  }

  // P(X = k) for X ~ Binomial(n, p). Exact boundary handling for p in {0,1}.
  function dbinom(k, n, p) {
    if (k < 0 || k > n || k !== Math.round(k)) return 0;
    if (p === 0) return k === 0 ? 1 : 0;
    if (p === 1) return k === n ? 1 : 0;
    return Math.exp(lchoose(n, k) + k * Math.log(p) + (n - k) * Math.log(1 - p));
  }

  // P(X <= k). k is floored to an integer (the CDF is a step function).
  function pbinom(k, n, p) {
    k = Math.floor(k);
    if (k < 0) return 0;
    if (k >= n) return 1;
    if (p === 0) return 1;          // all mass at 0
    if (p === 1) return 0;          // all mass at n (> k)
    // P(X <= k) = I_{1-p}(n-k, k+1)
    return ibeta(n - k, k + 1, 1 - p);
  }

  // P(X >= k), tail-accurate. k is ceiled (P(X >= k) = P(X >= ceil k)).
  function pbinomUpper(k, n, p) {
    k = Math.ceil(k);
    if (k <= 0) return 1;
    if (k > n) return 0;
    if (p === 0) return 0;          // all mass at 0 (< k, since k>=1)
    if (p === 1) return 1;          // all mass at n (>= k, since k<=n)
    // P(X >= k) = I_{p}(k, n-k+1)
    return ibeta(k, n - k + 1, p);
  }

  // P(a <= X <= b) = P(X <= b) - P(X <= a-1).
  function pbinomRange(a, b, n, p) {
    a = Math.ceil(a); b = Math.floor(b);
    if (b < a) return 0;
    return pbinom(b, n, p) - pbinom(a - 1, n, p);
  }

  // Smallest integer k with P(X <= k) >= target. Matches R qbinom. R's own
  // 64*eps fuzz keeps a target that equals a CDF value exactly on the correct
  // side; our incomplete-beta pbinom carries ~1e-11 compute noise (vs R's
  // ~1e-15), so we compare with a 1e-9 slack instead. That is orders of
  // magnitude above the noise yet far below the gap between distinct CDF
  // steps for any query a user can meaningfully specify.
  var QTOL = 1e-9;
  function ge(cdf, t) { return cdf >= t - QTOL; }
  function qbinom(target, n, p) {
    if (target <= 0) return 0;
    if (target >= 1) return n;
    if (p === 0) return 0;
    if (p === 1) return n;
    // Cornish-Fisher initial guess, then a short local search, so large n is
    // cheap while the exact CDF decides the boundary.
    var mu = n * p, sigma = Math.sqrt(n * p * (1 - p));
    var gamma = (1 - 2 * p) / sigma;
    var z = N.qnorm(target);
    var y = Math.floor(mu + sigma * (z + gamma * (z * z - 1) / 6) + 0.5);
    if (y < 0) y = 0;
    if (y > n) y = n;
    if (ge(pbinom(y, n, p), target)) {
      while (y > 0 && ge(pbinom(y - 1, n, p), target)) y--;
    } else {
      while (y < n && !ge(pbinom(y, n, p), target)) y++;
    }
    return y;
  }

  function mean(n, p) { return n * p; }
  function variance(n, p) { return n * p * (1 - p); }
  function sd(n, p) { return Math.sqrt(n * p * (1 - p)); }

  // Normal-approximation note. Rule of thumb: n*p >= 5 AND n*(1-p) >= 5.
  // Returns the continuity-corrected normal probability for a query so the
  // page can show exact-vs-approx side by side.
  function normalOK(n, p) { return n * p >= 5 && n * (1 - p) >= 5; }
  function normalApproxLE(k, n, p) {   // ~ P(X <= k) with continuity correction
    var mu = n * p, s = Math.sqrt(n * p * (1 - p));
    if (s === 0) return k >= mu ? 1 : 0;
    return N.pnorm((k + 0.5 - mu) / s);
  }
  function normalApproxGE(k, n, p) {   // ~ P(X >= k) with continuity correction
    var mu = n * p, s = Math.sqrt(n * p * (1 - p));
    if (s === 0) return k <= mu ? 1 : 0;
    return N.pnorm(-(k - 0.5 - mu) / s);
  }
  function normalApproxEq(k, n, p) {   // ~ P(X = k) with continuity correction
    return normalApproxLE(k, n, p) - normalApproxLE(k - 1, n, p);
  }

  return {
    lchoose: lchoose, dbinom: dbinom, pbinom: pbinom, pbinomUpper: pbinomUpper,
    pbinomRange: pbinomRange, qbinom: qbinom,
    mean: mean, variance: variance, sd: sd,
    normalOK: normalOK, normalApproxLE: normalApproxLE,
    normalApproxGE: normalApproxGE, normalApproxEq: normalApproxEq
  };
}));
