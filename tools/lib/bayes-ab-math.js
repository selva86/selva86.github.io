/* bayes-ab-math.js - Bayesian A/B decision math (beta-binomial) for Tool Farm v2.

   Ground truth: R 4.6.0, two independent routes plus an exact 80-dp adjudicator
   (see Scripts/tool-truth/bayesian-ab-test-calculator.{R,json},
    Scripts/tool-truth/bayesian-ab-adjudicate.py):
     - integrate() at rel.tol 1e-12  -> precision
     - 4e6-draw rbeta Monte Carlo    -> derivation (independent of the algebra)
     - exact finite sum at 80 dp     -> adjudicates values doubles cannot resolve
                                       (Cook's beta-inequality sum; no quadrature,
                                        so it is the only route that is not
                                        double-limited)

   COMPOSES tools/lib/beta-math.js (dbeta / pbeta / sfbeta / qbeta), which itself
   composes tools/lib/ttest-math.js (lgamma + regularized incomplete beta).
   Neither upstream lib is modified: no primitive is re-implemented here.

   Posterior per arm, conjugate update of a Beta(a0, b0) prior:
     A ~ Beta(a0 + cA, b0 + nA - cA)      B ~ Beta(a0 + cB, b0 + nB - cB)

   Works in browser (window.BayesABMath) and Node (module.exports). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./beta-math.js'));
  } else {
    root.BayesABMath = factory(root.BetaMath);
  }
}(typeof self !== 'undefined' ? self : this, function (B) {
  'use strict';

  var dbeta = B.dbeta, pbeta = B.pbeta, sfbeta = B.sfbeta, qbeta = B.qbeta;

  // ---- quadrature -------------------------------------------------------
  //
  // The integration range is NEVER [0, 1].  A concentrated posterior (5000 of
  // 100000 -> sd 0.0007) is a narrow spike, and a rule that lays its nodes
  // across the whole unit interval reads ~0 everywhere and returns ~0 while
  // looking converged.  That is not hypothetical: R's own integrate(f, 0, 1)
  // did exactly this while building the truth table, returning loss ~1e-19 for
  // a case whose true loss is 1.5e-3.  So every integral below is confined to
  // the quantile window where the density factor actually has mass, and split
  // at the other arm's window edges (and at any clamp) so no piece straddles a
  // kink.

  var QTAIL = 1e-14;   // probability dropped from each tail of a window

  function win(a, b) { return [qbeta(QTAIL, a, b), qbeta(1 - QTAIL, a, b)]; }

  // Gauss-Legendre, not Simpson. Every piece below is split at its kinks, so
  // each one is analytic, and GL converges on an analytic integrand far faster
  // than a composite Newton-Cotes rule: 96 GL nodes beat 2048 Simpson nodes on
  // accuracy. That matters twice over here - it is what lets a full analyze()
  // (7 integrals plus ~160 CDF evaluations to invert the intervals) stay
  // interactive instead of taking a second and a half.
  var GL = {};
  function glRule(n) {
    if (GL[n]) return GL[n];
    var x = new Array(n), w = new Array(n), m = (n + 1) >> 1, i, j, k, z, z1, p0, p1, p2, pp;
    for (i = 0; i < m; i++) {
      z = Math.cos(Math.PI * (i + 0.75) / (n + 0.5));   // Chebyshev start
      for (j = 0; j < 100; j++) {
        p1 = 1; p2 = 0;
        for (k = 0; k < n; k++) {           // Legendre P_n by recurrence
          p0 = p2; p2 = p1;
          p1 = ((2 * k + 1) * z * p2 - k * p0) / (k + 1);
        }
        pp = n * (z * p1 - p2) / (z * z - 1);           // derivative
        z1 = z; z = z1 - p1 / pp;                       // Newton step
        if (Math.abs(z - z1) < 1e-15) break;
      }
      x[i] = -z; x[n - 1 - i] = z;
      w[i] = 2 / ((1 - z * z) * pp * pp); w[n - 1 - i] = w[i];
    }
    GL[n] = { x: x, w: w };
    return GL[n];
  }

  function glN(f, lo, hi, n) {
    if (!(hi > lo)) return 0;
    var g = glRule(n), c = 0.5 * (hi + lo), h = 0.5 * (hi - lo), s = 0, i;
    for (i = 0; i < n; i++) s += g.w[i] * f(c + h * g.x[i]);
    return s * h;
  }

  // Adaptive: take a coarse and a fine GL rule; if they disagree, bisect. The
  // bisection is the safety net for a piece that is smooth but badly scaled,
  // and it is rarely reached.
  function integ(f, lo, hi, tol, depth) {
    if (!(hi > lo)) return 0;
    tol = tol || 1e-13; depth = depth === undefined ? 6 : depth;
    var coarse = glN(f, lo, hi, 40), fine = glN(f, lo, hi, 96);
    if (Math.abs(fine - coarse) <= tol * Math.max(Math.abs(fine), 1e-300) || depth <= 0)
      return fine;
    var mid = 0.5 * (lo + hi);
    return integ(f, lo, mid, tol, depth - 1) + integ(f, mid, hi, tol, depth - 1);
  }

  // Integrate f over [lo, hi], breaking at every interior split point.
  function pieces(f, lo, hi, extra, tol) {
    var pts = [lo, hi], i;
    for (i = 0; i < extra.length; i++)
      if (extra[i] > lo && extra[i] < hi) pts.push(extra[i]);
    pts.sort(function (x, y) { return x - y; });
    var tot = 0;
    for (i = 0; i < pts.length - 1; i++)
      if (pts[i + 1] > pts[i]) tot += integ(f, pts[i], pts[i + 1], tol);
    return tot;
  }

  // ---- core quantities --------------------------------------------------

  // P(B > A) = int f_B(b) F_A(b) db
  function pBgtA(a1, b1, a2, b2) {
    var wB = win(a2, b2);
    var v = pieces(function (b) { return dbeta(b, a2, b2) * pbeta(b, a1, b1); },
                   wB[0], wB[1], win(a1, b1));
    return Math.min(1, Math.max(0, v));
  }

  // E[max(pB - pA, 0)] - the expected loss of CHOOSING A, in rate points.
  // "If I ship A and B was really better, how much conversion rate do I give
  //  up, averaged over everything the data still leave open?"
  //
  //   int_0^1 f_A(a) * E[(pB - a)+] da
  //   E[(pB - a)+] = mB * sf(a; a2+1, b2) - a * sf(a; a2, b2)
  //     using E[x * 1(x>c)] = mean * sf(c; alpha+1, beta), which is exact.
  // The sf() factors are never truncated; only the outer f_A range is windowed,
  // and f_A is what confines the integrand.
  function lossChooseA(a1, b1, a2, b2) {
    var mB = a2 / (a2 + b2), wA = win(a1, b1);
    var f = function (a) {
      return dbeta(a, a1, b1) * (mB * sfbeta(a, a2 + 1, b2) - a * sfbeta(a, a2, b2));
    };
    return Math.max(0, pieces(f, wA[0], wA[1], win(a2, b2)));
  }

  // E[max(pA - pB, 0)] - the expected loss of CHOOSING B. Same integral with
  // the arms swapped, so there is one implementation to be right about.
  function lossChooseB(a1, b1, a2, b2) { return lossChooseA(a2, b2, a1, b1); }

  // CDF of the absolute lift D = pB - pA.  P(D<=d) = int f_A(a) F_B(a+d) da.
  function cdfD(d, a1, b1, a2, b2) {
    var wA = win(a1, b1), wB = win(a2, b2);
    var v = pieces(function (a) { return dbeta(a, a1, b1) * pbeta(a + d, a2, b2); },
                   wA[0], wA[1], [-d, 1 - d, wB[0] - d, wB[1] - d], 1e-12);
    return Math.min(1, Math.max(0, v));
  }

  // CDF of the relative lift R = (pB - pA)/pA.  P(R<=r) = P(pB <= pA(1+r)).
  function cdfR(r, a1, b1, a2, b2) {
    var k = 1 + r;
    if (k <= 0) return 0;                    // pB <= 0 is impossible
    var wA = win(a1, b1), wB = win(a2, b2);
    var v = pieces(function (a) { return dbeta(a, a1, b1) * pbeta(a * k, a2, b2); },
                   wA[0], wA[1], [1 / k, wB[0] / k, wB[1] / k], 1e-12);
    return Math.min(1, Math.max(0, v));
  }

  // Invert a monotone CDF. Regula falsi with the Illinois correction: keeps a
  // bracket (so it cannot run away like a bare secant) but converges
  // superlinearly, ~8 CDF evaluations where plain bisection needs ~40. Each
  // evaluation is a full piecewise quadrature, so this is most of the tool's
  // running time: bisecting all four interval endpoints cost 260ms of a 300ms
  // analyze(), which is too slow to recompute on every keystroke.
  function solveMono(f, lo, hi, flo, fhi) {
    var side = 0, x, fx, i;
    for (i = 0; i < 60; i++) {
      x = (flo * hi - fhi * lo) / (flo - fhi);
      if (!isFinite(x) || !(x > lo && x < hi)) x = 0.5 * (lo + hi);
      fx = f(x);
      if (fx === 0) return x;
      if (fx < 0) { lo = x; flo = fx; if (side === -1) fhi *= 0.5; side = -1; }
      else { hi = x; fhi = fx; if (side === 1) flo *= 0.5; side = 1; }
      // The CDF itself is only good to ~1e-12, so chasing a tighter bracket
      // than this is chasing quadrature noise.
      if (hi - lo <= 1e-13 + 1e-11 * Math.abs(x)) break;
    }
    return 0.5 * (lo + hi);
  }

  // cdf must be non-decreasing. [lo, hi] should bracket the root; hi is widened
  // if it does not (the relative lift has no upper bound).
  function qFromCdf(cdf, target, lo, hi) {
    var f = function (x) { return cdf(x) - target; };
    var flo = f(lo), fhi = f(hi), i;
    for (i = 0; i < 80 && fhi < 0; i++) { lo = hi; flo = fhi; hi = hi * 2 + 1; fhi = f(hi); }
    for (i = 0; i < 80 && flo > 0; i++) { hi = lo; fhi = flo; lo = lo * 2 - 1; flo = f(lo); }
    if (flo > 0 || fhi < 0) return flo > 0 ? lo : hi;   // degenerate; no root
    return solveMono(f, lo, hi, flo, fhi);
  }

  function moments(a, b) {
    return {
      mean: a / (a + b),
      sd: Math.sqrt(a * b / ((a + b) * (a + b) * (a + b + 1)))
    };
  }

  // ---- decision layer ---------------------------------------------------

  // The stopping rule this tool teaches: pick a threshold of caring (the most
  // conversion rate you are willing to leave on the table, e.g. 0.1pp). Ship
  // the leading arm once ITS expected loss falls below that threshold. The
  // leader is the arm with the smaller expected loss, which is the arm with the
  // higher posterior mean.
  function stoppingRead(lossA, lossB, threshold) {
    var leader = lossB <= lossA ? 'B' : 'A';
    var lossLeader = Math.min(lossA, lossB);
    var lossOther = Math.max(lossA, lossB);
    return {
      leader: leader,
      lossLeader: lossLeader,
      lossOther: lossOther,
      threshold: threshold,
      canStop: lossLeader <= threshold,
      // how much further the leading arm's loss has to fall
      gap: Math.max(0, lossLeader - threshold)
    };
  }

  function validate(inp) {
    var e = [];
    function num(v) { return typeof v === 'number' && isFinite(v); }
    if (!num(inp.nA) || inp.nA < 1) e.push('Visitors for A must be at least 1.');
    if (!num(inp.nB) || inp.nB < 1) e.push('Visitors for B must be at least 1.');
    if (!num(inp.cA) || inp.cA < 0) e.push('Conversions for A cannot be negative.');
    if (!num(inp.cB) || inp.cB < 0) e.push('Conversions for B cannot be negative.');
    if (num(inp.cA) && num(inp.nA) && inp.cA > inp.nA)
      e.push('A has more conversions than visitors.');
    if (num(inp.cB) && num(inp.nB) && inp.cB > inp.nB)
      e.push('B has more conversions than visitors.');
    if (!num(inp.a0) || inp.a0 <= 0) e.push('Prior alpha must be greater than 0.');
    if (!num(inp.b0) || inp.b0 <= 0) e.push('Prior beta must be greater than 0.');
    return e;
  }

  // inp: {cA, nA, cB, nB, a0, b0, level, threshold}
  //   level     credible level for the lift intervals (e.g. 0.95)
  //   threshold threshold of caring, as a RATE (0.001 = 0.1pp)
  function analyze(inp) {
    var errors = validate(inp);
    if (errors.length) return { ok: false, errors: errors };

    var a0 = inp.a0, b0 = inp.b0;
    var a1 = a0 + inp.cA, b1 = b0 + inp.nA - inp.cA;
    var a2 = a0 + inp.cB, b2 = b0 + inp.nB - inp.cB;
    var lev = inp.level || 0.95;
    var loP = (1 - lev) / 2, hiP = 1 - loP;

    var mA = moments(a1, b1), mB = moments(a2, b2);
    var p = pBgtA(a1, b1, a2, b2);
    var lA = lossChooseA(a1, b1, a2, b2);
    var lB = lossChooseB(a1, b1, a2, b2);

    // Start the solver near the answer. D = pB - pA is close to normal with
    // mean mB-mA and sd sqrt(sdA^2+sdB^2); +-12 sd is a safe bracket that is
    // orders of magnitude tighter than (-1, 1), and qFromCdf widens it anyway
    // if the approximation was poor (tiny n, J-shaped posteriors). The exact
    // answer never depends on the bracket, only the time to find it.
    var dSd = Math.sqrt(mA.sd * mA.sd + mB.sd * mB.sd);
    var dMu = mB.mean - mA.mean;
    var dA = Math.max(-1, dMu - 12 * dSd), dB = Math.min(1, dMu + 12 * dSd);
    var fD = function (d) { return cdfD(d, a1, b1, a2, b2); };
    var fR = function (r) { return cdfR(r, a1, b1, a2, b2); };
    var dLo = qFromCdf(fD, loP, dA, dB);
    var dHi = qFromCdf(fD, hiP, dA, dB);
    // Relative lift is roughly D / mA, so scale the same bracket. Floor at -1
    // (pB cannot be negative) and leave room above for a small denominator.
    var rA = Math.max(-1, dA / mA.mean - 0.5), rB = dB / mA.mean + 0.5;
    var rLo = qFromCdf(fR, loP, rA, rB);
    var rHi = qFromCdf(fR, hiP, rA, rB);

    var thr = (typeof inp.threshold === 'number' && inp.threshold >= 0) ? inp.threshold : 0.001;

    return {
      ok: true, errors: [],
      a1: a1, b1: b1, a2: a2, b2: b2, a0: a0, b0: b0, level: lev,
      rateA: inp.cA / inp.nA, rateB: inp.cB / inp.nB,
      meanA: mA.mean, meanB: mB.mean, sdA: mA.sd, sdB: mB.sd,
      medA: qbeta(0.5, a1, b1), medB: qbeta(0.5, a2, b2),
      ciA: [qbeta(loP, a1, b1), qbeta(hiP, a1, b1)],
      ciB: [qbeta(loP, a2, b2), qbeta(hiP, a2, b2)],
      pBgtA: p, pAgtB: 1 - p,
      lossChooseA: lA, lossChooseB: lB,
      meanLift: mB.mean - mA.mean,
      meanRelLift: (mB.mean - mA.mean) / mA.mean,
      dLo: dLo, dHi: dHi, rLo: rLo, rHi: rHi,
      stop: stoppingRead(lA, lB, thr)
    };
  }

  // Prior sensitivity: the same data read under several priors. This is the
  // honest caveat made visible - if the three columns disagree, the prior is
  // doing the talking, not the data.
  function priorSweep(inp, priors) {
    return priors.map(function (pr) {
      var r = analyze({
        cA: inp.cA, nA: inp.nA, cB: inp.cB, nB: inp.nB,
        a0: pr.a0, b0: pr.b0, level: inp.level, threshold: inp.threshold
      });
      return { label: pr.label, a0: pr.a0, b0: pr.b0, res: r };
    });
  }

  return {
    win: win, glN: glN, integ: integ, pieces: pieces,
    pBgtA: pBgtA, lossChooseA: lossChooseA, lossChooseB: lossChooseB,
    cdfD: cdfD, cdfR: cdfR, qFromCdf: qFromCdf, moments: moments,
    stoppingRead: stoppingRead, validate: validate,
    analyze: analyze, priorSweep: priorSweep
  };
}));
