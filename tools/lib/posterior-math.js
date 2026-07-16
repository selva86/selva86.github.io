/* posterior-math.js - conjugate posterior updates for Tool Farm v2.
   Ground truth: R 4.6.0 closed-form updates + qbeta/qnorm/qgamma
   (see Scripts/tool-truth/posterior-calculator.json).

   COMPOSES the existing verified libraries. No special function is
   re-derived here and NO existing lib is modified:

     Beta-Binomial  -> BetaMath        dbeta/pbeta/qbeta/moments
     Normal-Normal  -> NormalMath      dnorm/pnorm/qnorm
     Gamma-Poisson  -> NormalMath.lgamma only; the rest is below, because
                       the obvious composition is measurably WRONG here:

   WHY THE GAMMA CDF IS NOT COMPOSED. Gamma(a, rate b) and chi-square are the
   same law (2bX ~ chisq(2a) for any real a > 0), so pgamma(x,a,b) "should" be
   DistTablesMath.pchisq(2bx, 2a). It cannot be used: pchisq is 1 - gammq(),
   and NormalMath.gammq's series caps at ITMAX = 500 and then returns its
   PARTIAL SUM with no error signal. The series needs ~O(sqrt(a)) terms, so
   accuracy silently collapses as the shape grows:

       shape       composed pchisq      R 4.6.0 pgamma        error
           5       0.559506714935       0.559506714935        exact
        5000       0.501880633942       0.501880634034        1e-10
       50001       0.487896106195       0.500594702158        1.3e-02   <-

   A Gamma-Poisson shape is a0 + y where y is a raw event count, so 50000
   events is an ordinary input, not a corner. (normal-math is fine for its own
   purpose: erfc only ever calls gammq with a = 0.5, which converges at once.
   The latent defect reaches pchisq/qchisq above df ~ 10000 and is reported
   separately; fixing it there is a re-pin of 33 pages and its own test pass.)
   So gammaP/gammaQ below are sized for a real shape and, crucially, return
   NaN rather than an unconverged partial sum. They compose lgamma.

   The gamma QUANTILE also needs its own solver. DistTablesMath.invCDF bisects
   in linear space from [0,1] and caps at 200 halvings, bottoming out near
   6e-61. The standard vague prior Gamma(0.001, 0.001) with zero observed
   events has a real posterior median of 2.6e-303, which linear bisection
   cannot reach. qgamma() bisects in LOG space, which also buys constant
   relative precision at every scale. When the quantile sits below the
   smallest positive double it returns 0, which is what R does too.

   Browser: window.PosteriorMath (load ttest-math, normal-math and beta-math
   first). Node: require('./posterior-math.js'). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./normal-math.js'),
                             require('./beta-math.js'));
  } else {
    root.PosteriorMath = factory(root.NormalMath, root.BetaMath);
  }
}(typeof self !== 'undefined' ? self : this, function (N, B) {
  'use strict';

  var LOG_MIN = -744.4400719213812;   // ln(5e-324), the smallest positive double
  var EPS = 3e-16;
  var ITMAX = 1e6;                    // sized for shape ~1e9; the break exits early

  // ---------------------------------------------------------------- gamma
  // Regularized lower incomplete gamma P(a,x), by series. Returns NaN rather
  // than a partial sum if it does not converge - the failure mode above.
  function gser(a, x) {
    var gln = N.lgamma(a), ap = a, sum = 1 / a, del = sum;
    for (var n = 1; n <= ITMAX; n++) {
      ap += 1; del *= x / ap; sum += del;
      if (Math.abs(del) < Math.abs(sum) * EPS) {
        return sum * Math.exp(-x + a * Math.log(x) - gln);
      }
    }
    return NaN;
  }
  // Regularized upper incomplete gamma Q(a,x), by continued fraction (Lentz).
  function gcf(a, x) {
    var FPMIN = 1e-300;
    var gln = N.lgamma(a), b = x + 1 - a, c = 1 / FPMIN, d = 1 / b, h = d;
    for (var i = 1; i <= ITMAX; i++) {
      var an = -i * (i - a);
      b += 2;
      d = an * d + b; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = b + an / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d;
      var del = d * c; h *= del;
      if (Math.abs(del - 1) < EPS) {
        return Math.exp(-x + a * Math.log(x) - gln) * h;
      }
    }
    return NaN;
  }
  // Each tail is taken from the form that computes it DIRECTLY, never by
  // subtracting a near-1 number from 1.
  function gammaP(a, x) {
    if (!(x > 0)) return 0;
    return x < a + 1 ? gser(a, x) : 1 - gcf(a, x);
  }
  function gammaQ(a, x) {
    if (!(x > 0)) return 1;
    return x < a + 1 ? 1 - gser(a, x) : gcf(a, x);
  }

  function dgamma(x, a, b) {
    if (x < 0) return 0;
    if (x === 0) return a < 1 ? Infinity : (a === 1 ? b : 0);
    return Math.exp(a * Math.log(b) + (a - 1) * Math.log(x) - b * x - N.lgamma(a));
  }
  function pgamma(x, a, b) {
    if (x <= 0) return 0;
    return gammaP(a, b * x);
  }
  // Inverse gamma CDF by bisection in log space (see the header note).
  function qgamma(p, a, b) {
    if (!(p > 0)) return 0;
    if (p >= 1) return Infinity;
    var cdf = function (u) { return pgamma(Math.exp(u), a, b); };
    // If even the smallest representable x already carries p of the mass,
    // the true quantile underflows. R returns 0 here; so do we.
    if (cdf(LOG_MIN) >= p) return 0;
    // Bracket outward from the mean, in log space.
    var u = Math.log(a / b), lo, hi, i;
    if (!isFinite(u)) u = 0;
    if (cdf(u) < p) {
      lo = u;
      hi = u + 1;
      for (i = 0; i < 200 && cdf(hi) < p; i++) { lo = hi; hi += Math.max(1, Math.abs(hi)); }
    } else {
      hi = u;
      lo = u - 1;
      for (i = 0; i < 2000 && cdf(lo) >= p; i++) {
        hi = lo;
        lo -= Math.max(1, Math.abs(lo) * 0.5);
        if (lo <= LOG_MIN) { lo = LOG_MIN; break; }
      }
    }
    // Judge convergence on the BRACKET, never on the step length: where the
    // density spikes, a tiny step means a steep curve, not a found root.
    for (i = 0; i < 400; i++) {
      var mid = 0.5 * (lo + hi);
      if (mid === lo || mid === hi) break;
      if (cdf(mid) < p) lo = mid; else hi = mid;
    }
    return Math.exp(0.5 * (lo + hi));
  }

  // -------------------------------------------------------- family adapters
  // Each adapter exposes the same shape so the page never branches on family:
  //   d(x)/p(x)/q(p) for prior, likelihood-as-a-density, and posterior.
  function fmtNum(x) { return x; }

  function betaBinomial(inp, lev) {
    var a0 = inp.a0, b0 = inp.b0, s = inp.s, n = inp.n;
    var a1 = a0 + s, b1 = b0 + n - s;
    var lo = (1 - lev) / 2, hi = 1 - lo;
    var m0 = B.moments(a0, b0), m1 = B.moments(a1, b1);
    // The prior's weight is its pseudo-observation count: a0+b0 prior trials
    // against n real ones. postMean = w*priorMean + (1-w)*mle, exactly.
    var priorObs = a0 + b0, w = priorObs / (priorObs + n);
    return {
      param: 'theta', paramLabel: 'the success probability',
      priorName: 'Beta(' + a0 + ', ' + b0 + ')',
      postName: 'Beta(' + a1 + ', ' + b1 + ')',
      post: { a: a1, b: b1 },
      prior: { a: a0, b: b0 },
      priorMean: m0.mean, priorSd: m0.sd,
      mean: m1.mean, sd: m1.sd,
      median: B.qbeta(0.5, a1, b1),
      lo: B.qbeta(lo, a1, b1), hi: B.qbeta(hi, a1, b1),
      priorLo: B.qbeta(lo, a0, b0), priorHi: B.qbeta(hi, a0, b0),
      mle: n > 0 ? s / n : NaN,
      priorObs: priorObs, dataObs: n, w: w,
      dPrior: function (x) { return B.dbeta(x, a0, b0); },
      dPost: function (x) { return B.dbeta(x, a1, b1); },
      dLik: function (x) { return B.dbeta(x, s + 1, n - s + 1); },
      pPost: function (x) { return B.pbeta(x, a1, b1); },
      qPost: function (p) { return B.qbeta(p, a1, b1); },
      likLo: B.qbeta(0.005, s + 1, n - s + 1), likHi: B.qbeta(0.995, s + 1, n - s + 1),
      support: [0, 1],
      // Reference prior for the credible-vs-confidence comparison.
      flat: (function () {
        var fa = 1 + s, fb = 1 + n - s;
        return { name: 'Beta(1, 1)', lo: B.qbeta(lo, fa, fb), hi: B.qbeta(hi, fa, fb),
                 mean: fa / (fa + fb) };
      })()
    };
  }

  function normalNormal(inp, lev) {
    var m0 = inp.m0, s0 = inp.s0, xbar = inp.xbar, n = inp.n, sigma = inp.sigma;
    var prec0 = 1 / (s0 * s0), precD = n / (sigma * sigma), prec1 = prec0 + precD;
    var s1 = Math.sqrt(1 / prec1);
    var m1 = (m0 * prec0 + xbar * precD) / prec1;
    var lo = (1 - lev) / 2, hi = 1 - lo;
    var se = sigma / Math.sqrt(n);
    // n0 = how many observations the prior is worth. Then m1 is literally
    // (n0*m0 + n*xbar) / (n0 + n): the same weighted average as the others.
    var n0 = (sigma * sigma) / (s0 * s0), w = n0 / (n0 + n);
    return {
      param: 'mu', paramLabel: 'the population mean',
      priorName: 'Normal(' + m0 + ', ' + s0 + '^2)',
      postName: 'Normal(' + m1.toPrecision(6) + ', ' + s1.toPrecision(6) + '^2)',
      post: { m: m1, s: s1 },
      prior: { m: m0, s: s0 },
      priorMean: m0, priorSd: s0,
      mean: m1, sd: s1, median: m1,
      lo: m1 + s1 * N.qnorm(lo), hi: m1 + s1 * N.qnorm(hi),
      priorLo: m0 + s0 * N.qnorm(lo), priorHi: m0 + s0 * N.qnorm(hi),
      mle: xbar,
      priorObs: n0, dataObs: n, w: w, se: se,
      dPrior: function (x) { return N.dnorm((x - m0) / s0) / s0; },
      dPost: function (x) { return N.dnorm((x - m1) / s1) / s1; },
      dLik: function (x) { return N.dnorm((x - xbar) / se) / se; },
      pPost: function (x) { return N.pnorm((x - m1) / s1); },
      qPost: function (p) { return m1 + s1 * N.qnorm(p); },
      likLo: xbar + se * N.qnorm(0.005), likHi: xbar + se * N.qnorm(0.995),
      support: [m1 - 4.5 * s1, m1 + 4.5 * s1],
      // With a flat prior the posterior is exactly N(xbar, sigma^2/n), so its
      // credible interval is arithmetically IDENTICAL to the z confidence
      // interval. Same numbers, different claim - the honest teaching hook.
      flat: { name: 'flat (s0 -> infinity)', lo: xbar + se * N.qnorm(lo),
              hi: xbar + se * N.qnorm(hi), mean: xbar, identicalToCI: true }
    };
  }

  function gammaPoisson(inp, lev) {
    var a0 = inp.a0, b0 = inp.b0, y = inp.y, t = inp.t;
    var a1 = a0 + y, b1 = b0 + t;
    var lo = (1 - lev) / 2, hi = 1 - lo;
    // The prior carries a0 events over b0 exposure; data adds y over t.
    var w = b0 / (b0 + t);
    var m1 = a1 / b1;
    return {
      param: 'lambda', paramLabel: 'the event rate',
      priorName: 'Gamma(' + a0 + ', rate = ' + b0 + ')',
      postName: 'Gamma(' + a1 + ', rate = ' + b1 + ')',
      post: { a: a1, b: b1 },
      prior: { a: a0, b: b0 },
      priorMean: a0 / b0, priorSd: Math.sqrt(a0) / b0,
      mean: m1, sd: Math.sqrt(a1) / b1,
      median: qgamma(0.5, a1, b1),
      lo: qgamma(lo, a1, b1), hi: qgamma(hi, a1, b1),
      priorLo: qgamma(lo, a0, b0), priorHi: qgamma(hi, a0, b0),
      mle: t > 0 ? y / t : NaN,
      priorObs: b0, dataObs: t, w: w,
      dPrior: function (x) { return dgamma(x, a0, b0); },
      dPost: function (x) { return dgamma(x, a1, b1); },
      dLik: function (x) { return dgamma(x, y + 1, t); },
      pPost: function (x) { return pgamma(x, a1, b1); },
      qPost: function (p) { return qgamma(p, a1, b1); },
      likLo: qgamma(0.005, y + 1, t), likHi: qgamma(0.995, y + 1, t),
      support: [0, qgamma(0.9995, a1, b1)],
      flat: (function () {
        var fa = y + 0.5, fb = t;   // Jeffreys reference prior for a Poisson rate
        return { name: 'Jeffreys, Gamma(0.5, 0)', lo: qgamma(lo, fa, fb),
                 hi: qgamma(hi, fa, fb), mean: fa / fb };
      })()
    };
  }

  // ---------------------------------------------------------- validation
  function isPosNum(v) { return typeof v === 'number' && isFinite(v) && v > 0; }
  function isNonNegInt(v) { return typeof v === 'number' && isFinite(v) && v >= 0 && v === Math.round(v); }

  function validate(family, inp, lev) {
    var e = [];
    if (!(lev > 0 && lev < 1)) e.push('Pick a credible level between 0 and 1.');
    if (family === 'beta-binomial') {
      if (!isPosNum(inp.a0)) e.push('Prior alpha must be a number above 0.');
      if (!isPosNum(inp.b0)) e.push('Prior beta must be a number above 0.');
      if (!isNonNegInt(inp.n) || inp.n < 1) e.push('Trials must be a whole number of 1 or more.');
      if (!isNonNegInt(inp.s)) e.push('Successes must be a whole number of 0 or more.');
      else if (isNonNegInt(inp.n) && inp.s > inp.n) e.push('Successes cannot exceed trials.');
    } else if (family === 'normal-normal') {
      if (typeof inp.m0 !== 'number' || !isFinite(inp.m0)) e.push('Prior mean must be a number.');
      if (!isPosNum(inp.s0)) e.push('Prior SD must be a number above 0.');
      if (typeof inp.xbar !== 'number' || !isFinite(inp.xbar)) e.push('Sample mean must be a number.');
      if (!isNonNegInt(inp.n) || inp.n < 1) e.push('Sample size must be a whole number of 1 or more.');
      if (!isPosNum(inp.sigma)) e.push('Known SD must be a number above 0.');
    } else if (family === 'gamma-poisson') {
      if (!isPosNum(inp.a0)) e.push('Prior shape must be a number above 0.');
      if (!isPosNum(inp.b0)) e.push('Prior rate must be above 0. For a vague prior use a small value like 0.001.');
      if (!isNonNegInt(inp.y)) e.push('Total events must be a whole number of 0 or more.');
      if (!isPosNum(inp.t)) e.push('Exposure must be a number above 0.');
    } else {
      e.push('Unknown family.');
    }
    return e;
  }

  var FAMILIES = {
    'beta-binomial': betaBinomial,
    'normal-normal': normalNormal,
    'gamma-poisson': gammaPoisson
  };

  function analyze(family, inp) {
    var lev = (typeof inp.level === 'number') ? inp.level : 0.95;
    var errors = validate(family, inp, lev);
    if (errors.length) return { ok: false, errors: errors, family: family };
    var r = FAMILIES[family](inp, lev);
    r.ok = true;
    r.errors = [];
    r.family = family;
    r.level = lev;
    // How much did the data move the prior? Reported in prior SDs, which is
    // the only scale-free way to say "a lot" across three families.
    r.shift = isFinite(r.priorSd) && r.priorSd > 0
      ? (r.mean - r.priorMean) / r.priorSd : NaN;
    r.width = r.hi - r.lo;
    r.priorWidth = r.priorHi - r.priorLo;
    return r;
  }

  // Same data, a weak and a strong prior, so the pull is visible.
  function priorSweep(family, inp, priors) {
    return priors.map(function (pr) {
      var merged = {}, k;
      for (k in inp) if (inp.hasOwnProperty(k)) merged[k] = inp[k];
      for (k in pr.set) if (pr.set.hasOwnProperty(k)) merged[k] = pr.set[k];
      return { label: pr.label, res: analyze(family, merged) };
    });
  }

  return {
    dgamma: dgamma, pgamma: pgamma, qgamma: qgamma,
    betaBinomial: betaBinomial, normalNormal: normalNormal, gammaPoisson: gammaPoisson,
    validate: validate, analyze: analyze, priorSweep: priorSweep, fmtNum: fmtNum
  };
}));
