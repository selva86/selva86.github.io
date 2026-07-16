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

  // ---- exact display arithmetic --------------------------------------------
  // A printed 4dp table is otherwise hostage to the last bit of a double. Many
  // of these probabilities terminate exactly one digit past the printed
  // precision: dbinom(1, 6, 0.5) is exactly 0.09375, dbinom(1, 5, 0.1) is
  // exactly 0.32805. Those sit ON the rounding tie, where one ulp decides the
  // 4th decimal, and no implementation is reliable there:
  //   dbinom(1, 6, 0.5) == 0.09375 is FALSE in R  (R is 1.4e-17 low, though
  //     0.09375 is exactly representable), so sprintf("%.4f") prints 0.0937
  //   dbinom(0, 5, 0.5) == 0.03125 is TRUE, and R then rounds the tie to even
  //     and prints 0.0312
  // So R's printed digit at a tie is half its own float error and half a
  // half-to-even rule. It is not reproducible and not worth reproducing.
  //
  // The numbers we PRINT therefore come from exact rationals via BigInt, not
  // doubles. For a decimal p = m / 10^t:
  //   P(X = k) = C(n,k) * m^k * (10^t - m)^(n-k) / 10^(t*n)
  // is exact, and P(X <= k) is an exact sum of those terms. Ties round half up:
  // the rule printed tables use, the one a reader applies by hand, and the one
  // that agrees with the value R shows at the console (dbinom(1, 6, 0.5) prints
  // 0.09375, which a reader rounds to 0.0938 -- our cell). Every cell is thus
  // the true probability, correctly rounded. The double routines above still do
  // all the statistics; this only decides the printed digits.
  // Scripts/tool-truth/test-binomial-table-math.js pins all 4600 cells against
  // R and proves each of the 11 tie disagreements is exactly this and nothing
  // more.
  // Returns null (caller falls back to toFixed) when p is not a plain decimal
  // or the integers would get big enough to cost real time.
  var EXACT_MAX_DIGITS = 2000;   // cap on the denominator 10^(t*n)

  function decParts(pStr) {      // "0.05" -> {m: 5n, t: 2}; null if not plain
    var s = String(pStr).trim();
    if (!/^[01](\.\d+)?$|^0?\.\d+$/.test(s)) return null;
    var dot = s.indexOf('.');
    if (dot < 0) return { m: BigInt(s), t: 0 };
    var frac = s.slice(dot + 1);
    return { m: BigInt((s.slice(0, dot) || '0') + frac), t: frac.length };
  }
  function chooseBig(n, k) {
    var r = 1n, N = BigInt(n);
    for (var i = 0n; i < BigInt(k); i++) r = r * (N - i) / (i + 1n);
    return r;
  }
  // Exact P(X = k) or P(X <= k) or P(X >= k) as a rational {N, D}. kind: eq|le|ge
  function exactRational(kind, k, n, pStr) {
    var d = decParts(pStr);
    if (!d || !Number.isInteger(n) || !Number.isInteger(k) || n < 0) return null;
    if (d.t * n > EXACT_MAX_DIGITS) return null;
    var ten = 10n ** BigInt(d.t), m = d.m, q = ten - m;
    if (m < 0n || q < 0n) return null;
    var D = ten ** BigInt(n);
    function term(j) {           // C(n,j) * m^j * q^(n-j)
      return chooseBig(n, j) * (m ** BigInt(j)) * (q ** BigInt(n - j));
    }
    if (kind === 'eq') return (k < 0 || k > n) ? { N: 0n, D: D } : { N: term(k), D: D };
    var lo = 0, hi;
    if (kind === 'le') { if (k < 0) return { N: 0n, D: D }; hi = Math.min(k, n); }
    else { if (k <= 0) return { N: D, D: D }; if (k > n) return { N: 0n, D: D }; lo = k; hi = n; }
    var s = 0n;
    for (var j = lo; j <= hi; j++) s += term(j);
    return { N: s, D: D };
  }
  // Round an exact rational to d decimals, ties away from zero (all values
  // here are probabilities, so: half up). N and D are non-negative.
  function fmtRational(N, D, d) {
    var scale = 10n ** BigInt(d);
    var num = N * scale, quo = num / D, rem = num % D;
    if (rem * 2n >= D) quo += 1n;
    var s = quo.toString().padStart(d + 1, '0');
    return d > 0 ? s.slice(0, s.length - d) + '.' + s.slice(s.length - d) : s;
  }
  // The one entry point the table baker and the page both print through.
  // kind: 'eq' | 'le' | 'ge'. Returns null when exact arithmetic does not apply.
  function fmtExact(kind, k, n, pStr, d) {
    var r = exactRational(kind, k, n, pStr);
    if (!r) return null;
    return fmtRational(r.N, r.D, d === undefined ? 4 : d);
  }

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
    fmtExact: fmtExact, exactRational: exactRational,
    normalOK: normalOK, normalApproxLE: normalApproxLE,
    normalApproxGE: normalApproxGE, normalApproxEq: normalApproxEq
  };
}));
