/* oddsratio-math.js - 2x2 epidemiology suite (W2.3)
   Ground truth: R 4.6.0 base fisher.test / chisq.test + explicit textbook
   formulas, cross-checked against epitools::oddsratio.wald / riskratio.wald.
   Verified in Scripts/tool-truth/test-odds-ratio-calculator-math.js at
   <= 1e-6 relative (see that harness header for the near-zero absolute floor).

   2x2 layout:
              Outcome+   Outcome-
     Exposed     a          b       n1 = a+b
     Unexposed   c          d       n0 = c+d

   Odds ratio, risk ratio and their Wald CIs (plus the RR-derived AR% and PAF)
   apply the Haldane-Anscombe 0.5 correction when any cell is zero. Absolute
   risks, the risk difference, NNT and the chi-square / Fisher tests use the
   original counts. The Fisher exact CI + p reproduce R's fisher.test via the
   noncentral hypergeometric distribution and R's uniroot (zeroin2 Brent port,
   tol = .Machine$double.eps^0.25) so the CI lands on R's root, not a tighter
   one. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./normal-math.js'));
  else root.OddsRatioMath = factory(root.NormalMath);
}(typeof self !== 'undefined' ? self : this, function (N) {
  'use strict';
  var EPS = 2.220446049250313e-16;
  var UROOT_TOL = Math.pow(EPS, 0.25);   // R uniroot default tol = 1.220703125e-4

  function lchoose(n, k) { return N.lgamma(n + 1) - N.lgamma(k + 1) - N.lgamma(n - k + 1); }

  /* ---------- Brent root finder (R zeroin2), tol matches R uniroot ---------- */
  function zeroin2(ax, bx, fa, fb, f, tol, maxit) {
    var a = ax, b = bx, c = a, fc = fa, mit = maxit + 1;
    if (fa === 0) return a;
    if (fb === 0) return b;
    while (mit--) {
      var prev = b - a, tolAct, newStep, p, q;
      if (Math.abs(fc) < Math.abs(fb)) { a = b; b = c; c = a; fa = fb; fb = fc; fc = fa; }
      tolAct = 2 * EPS * Math.abs(b) + tol / 2;
      newStep = (c - b) / 2;
      if (Math.abs(newStep) <= tolAct || fb === 0) return b;
      if (Math.abs(prev) >= tolAct && Math.abs(fa) > Math.abs(fb)) {
        var cb = c - b, t1, t2;
        if (a === c) { t1 = fb / fa; p = cb * t1; q = 1 - t1; }
        else {
          q = fa / fc; t1 = fb / fc; t2 = fb / fa;
          p = t2 * (cb * q * (q - t1) - (b - a) * (t1 - 1));
          q = (q - 1) * (t1 - 1) * (t2 - 1);
        }
        if (p > 0) q = -q; else p = -p;
        if (p < 0.75 * cb * q - Math.abs(tolAct * q) / 2 && p < Math.abs(prev * q / 2)) newStep = p / q;
      }
      if (Math.abs(newStep) < tolAct) newStep = newStep > 0 ? tolAct : -tolAct;
      a = b; fa = fb; b += newStep; fb = f(b);
      if ((fb > 0 && fc > 0) || (fb < 0 && fc < 0)) { c = a; fc = fa; }
    }
    return b;
  }
  function uniroot(f, lo, hi) {
    var flo = f(lo), fhi = f(hi);
    return zeroin2(lo, hi, flo, fhi, f, UROOT_TOL, 1000);
  }

  /* ---------- Fisher exact: noncentral hypergeometric, reproduces R ---------
     For a 2x2 table with cell a at [1,1]:
       m = a + c (col1 total), n = b + d (col2 total), k = a + b (row1 total),
       observed x = a, support = lo..hi. */
  function fisherModel(a, b, c, d) {
    var m = a + c, n = b + d, k = a + b, x = a;
    var lo = Math.max(0, k - n), hi = Math.min(k, m);
    var len = hi - lo + 1;
    // logdc via a recurrence so huge supports stay O(len) cheap.
    var logdc = new Float64Array(len);
    logdc[0] = lchoose(m, lo) + lchoose(n, k - lo);
    for (var i = 1; i < len; i++) {
      var s = lo + i;
      var ratio = ((m - s + 1) * (k - s + 1)) / (s * (n - k + s));
      logdc[i] = logdc[i - 1] + Math.log(ratio);
    }
    function dnhyper(ncp) {
      var d = new Float64Array(len), mx = -Infinity, lncp = Math.log(ncp), i, s;
      for (i = 0; i < len; i++) { s = lo + i; d[i] = logdc[i] + lncp * s; if (d[i] > mx) mx = d[i]; }
      var sum = 0;
      for (i = 0; i < len; i++) { d[i] = Math.exp(d[i] - mx); sum += d[i]; }
      for (i = 0; i < len; i++) d[i] /= sum;
      return d;
    }
    function mnhyper(ncp) {
      if (ncp === 0) return lo;
      if (!isFinite(ncp)) return hi;
      var d = dnhyper(ncp), s = 0;
      for (var i = 0; i < len; i++) s += (lo + i) * d[i];
      return s;
    }
    // P(X <= q) [lower] or P(X >= q) [upper] under odds ratio ncp
    function pnhyper(q, ncp, upper) {
      if (ncp === 1) {
        // central hypergeometric via the normalized logdc (== dhyper)
        var d0 = dnhyper(1), s0 = 0, i;
        for (i = 0; i < len; i++) {
          var sv = lo + i;
          if (upper ? sv >= q : sv <= q) s0 += d0[i];
        }
        return s0;
      }
      if (ncp === 0) return upper ? (q <= lo ? 1 : 0) : (q >= lo ? 1 : 0);
      if (!isFinite(ncp)) return upper ? (q <= hi ? 1 : 0) : (q >= hi ? 1 : 0);
      var d = dnhyper(ncp), s = 0;
      for (var j = 0; j < len; j++) {
        var v = lo + j;
        if (upper ? v >= q : v <= q) s += d[j];
      }
      return s;
    }
    return { m: m, n: n, k: k, x: x, lo: lo, hi: hi, len: len,
             dnhyper: dnhyper, mnhyper: mnhyper, pnhyper: pnhyper };
  }

  // two-sided fisher exact p-value (R "minlike" default)
  function fisherP(a, b, c, d) {
    var M = fisherModel(a, b, c, d);
    var d1 = M.dnhyper(1);
    var dobs = d1[M.x - M.lo];
    var relErr = 1 + 1e-7, s = 0;
    for (var i = 0; i < M.len; i++) if (d1[i] <= dobs * relErr) s += d1[i];
    return Math.min(1, s);
  }

  // exact CI for the odds ratio (fisher.test $conf.int, two.sided)
  function fisherCI(a, b, c, d, level) {
    var M = fisherModel(a, b, c, d), x = M.x, alpha = (1 - level) / 2;
    var lower, upper;
    // lower bound (ncp.L)
    if (x === M.lo) lower = 0;
    else {
      var pL = M.pnhyper(x, 1, true);
      if (pL > alpha) lower = uniroot(function (t) { return M.pnhyper(x, t, true) - alpha; }, 0, 1);
      else if (pL < alpha) lower = 1 / uniroot(function (t) { return M.pnhyper(x, 1 / t, true) - alpha; }, EPS, 1);
      else lower = 1;
    }
    // upper bound (ncp.U)
    if (x === M.hi) upper = Infinity;
    else {
      var pU = M.pnhyper(x, 1, false);
      if (pU < alpha) upper = uniroot(function (t) { return M.pnhyper(x, t, false) - alpha; }, 0, 1);
      else if (pU > alpha) upper = 1 / uniroot(function (t) { return M.pnhyper(x, 1 / t, false) - alpha; }, EPS, 1);
      else upper = 1;
    }
    return { lo: lower, hi: upper };
  }

  // conditional MLE of the odds ratio (fisher.test $estimate)
  function fisherMLE(a, b, c, d) {
    var M = fisherModel(a, b, c, d), x = M.x;
    if (x === M.lo) return 0;
    if (x === M.hi) return Infinity;
    var mu = M.mnhyper(1);
    if (mu > x) return uniroot(function (t) { return M.mnhyper(t) - x; }, 0, 1);
    if (mu < x) return 1 / uniroot(function (t) { return M.mnhyper(1 / t) - x; }, EPS, 1);
    return 1;
  }

  /* ---------- chi-square (Pearson, df = 1), Yates + uncorrected ---------- */
  function chisq(a, b, c, d) {
    var n1 = a + b, n0 = c + d, m1 = a + c, m0 = b + d, Nn = a + b + c + d;
    var det = a * d - b * c;
    var denom = n1 * n0 * m1 * m0;
    var minExp = Math.min(n1 * m1, n1 * m0, n0 * m1, n0 * m0) / Nn;
    if (denom === 0) return { stat: NaN, statYates: NaN, p: NaN, pYates: NaN, minExp: minExp };
    var stat = Nn * det * det / denom;
    var yatesNum = Math.abs(det) - Nn / 2;
    if (yatesNum < 0) yatesNum = 0;
    var statY = Nn * yatesNum * yatesNum / denom;
    var p = 2 * N.pnorm(-Math.sqrt(stat));
    var pY = 2 * N.pnorm(-Math.sqrt(statY));
    return { stat: stat, statYates: statY, p: p, pYates: pY, minExp: minExp };
  }

  /* ======================= main analyze ======================= */
  function analyze(a, b, c, d, opts) {
    opts = opts || {};
    var level = opts.level || 0.95;
    var z = N.qnorm(1 - (1 - level) / 2);
    a = +a; b = +b; c = +c; d = +d;

    var n1 = a + b, n0 = c + d, m1 = a + c, m0 = b + d, Nn = a + b + c + d;
    var risk1 = a / n1, risk0 = c / n0;

    var corrected = (a === 0 || b === 0 || c === 0 || d === 0);
    var A = a, B = b, C = c, D = d;
    if (corrected) { A = a + 0.5; B = b + 0.5; C = c + 0.5; D = d + 0.5; }
    var n1c = A + B, n0c = C + D, Nc = A + B + C + D, m1c = A + C;

    // odds ratio (Wald)
    var OR = (A * D) / (B * C);
    var seOR = Math.sqrt(1 / A + 1 / B + 1 / C + 1 / D);
    var or = { est: OR, lo: Math.exp(Math.log(OR) - z * seOR), hi: Math.exp(Math.log(OR) + z * seOR), se: seOR };

    // odds ratio (Fisher exact CI + conditional MLE)
    var fci = fisherCI(a, b, c, d, level);
    var orFisher = { lo: fci.lo, hi: fci.hi, cmle: fisherMLE(a, b, c, d) };

    // risk ratio (Wald)
    var RR = (A / n1c) / (C / n0c);
    var seRR = Math.sqrt(1 / A - 1 / n1c + 1 / C - 1 / n0c);
    var rr = { est: RR, lo: Math.exp(Math.log(RR) - z * seRR), hi: Math.exp(Math.log(RR) + z * seRR), se: seRR };

    // risk difference (Wald, raw)
    var RD = risk1 - risk0;
    var seRD = Math.sqrt(risk1 * (1 - risk1) / n1 + risk0 * (1 - risk0) / n0);
    var rd = { est: RD, lo: RD - z * seRD, hi: RD + z * seRD, se: seRD };

    // NNT / NNH from the risk difference and its CI (Altman 1998)
    var nnt = nntFrom(rd);

    // attributable fraction among exposed + population attributable fraction
    var afe = (RR - 1) / RR * 100;
    var It = m1c / Nc, I0 = C / n0c;
    var paf = (It - I0) / It * 100;

    // tests (raw counts) + auto-pick
    var cs = chisq(a, b, c, d);
    var fp = fisherP(a, b, c, d);
    var pick = cs.minExp < 5 ? 'fisher' : 'chisq';
    var test = pick === 'fisher'
      ? { pick: 'fisher', p: fp, label: "Fisher's exact test", why: 'the smallest expected count is below 5' }
      : { pick: 'chisq', p: cs.pYates, label: 'Pearson chi-square (Yates corrected)', why: 'every expected count is at least 5' };

    return {
      inputs: { a: a, b: b, c: c, d: d, n1: n1, n0: n0, m1: m1, m0: m0, N: Nn },
      level: level, z: z, corrected: corrected,
      risk1: risk1, risk0: risk0,
      or: or, orFisher: orFisher, rr: rr, rd: rd, nnt: nnt,
      afe: afe, paf: paf,
      chisq: cs, fisherP: fp, test: test
    };
  }

  function nntFrom(rd) {
    var RD = rd.est, lo = rd.lo, hi = rd.hi;
    var kind = RD > 0 ? 'NNH' : 'NNT';       // exposure raises risk -> harm
    var value = RD !== 0 ? 1 / Math.abs(RD) : Infinity;
    var crosses = lo <= 0 && hi >= 0;         // RD CI straddles zero
    // reciprocals of the CI limits (absolute)
    var r1 = lo !== 0 ? 1 / Math.abs(lo) : Infinity;
    var r2 = hi !== 0 ? 1 / Math.abs(hi) : Infinity;
    var ciLo = Math.min(r1, r2), ciHi = Math.max(r1, r2);
    return { value: value, kind: kind, spansInfinity: crosses, ciLo: ciLo, ciHi: ciHi, rdLo: lo, rdHi: hi };
  }

  return {
    analyze: analyze,
    fisherCI: fisherCI, fisherP: fisherP, fisherMLE: fisherMLE,
    chisq: chisq, lchoose: lchoose, uniroot: uniroot
  };
}));
