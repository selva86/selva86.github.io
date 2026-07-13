/* equivalence-math.js - exact equivalence / non-inferiority / superiority math
   for Tool Farm v2 (tools/equivalence-noninferiority-calculator.html).

   Two families:
     ANALYZE - two one-sided tests (TOST) from summary stats.
       continuous  : pooled or Welch two-sample t; upper-tail p via tCDF(-t)
                     so tiny p-values keep full precision (no 1-CDF cancellation).
       proportions : two one-sided z-tests, unpooled Wald SE; p via pnorm(-z).
     PLAN - sample size per group (normal approximation, Chow/Lakens closed form).
       equivalence : n = 2(z_1-a + z_1-b/2)^2 / (mu - bound)^2, max over both bounds.
       one-sided   : n = 2(z_1-a + z_1-b)^2 / (mu - margin)^2  (NI & superiority).

   Ground truth: Scripts/tool-truth/equivalence.json (base R), bit-exact vs
   TOSTER::tsum_TOST / TOSTtwo.prop / powerTOSTtwo.raw / powerTOSTtwo.prop for
   every mode that has a canonical TOSTER equivalent (17/17 cross-checks pass).

   NOTE vs the predecessor: v1's "super-superiority" reused the equivalence UPPER
   test t=(high-diff)/se, which rejects when the difference is BELOW the margin -
   the opposite of superiority. Fixed here: superiority is the one-sided
   "diff > margin" test, identical in shape to non-inferiority (positive margin).

   Browser: window.EquivalenceMath (needs window.TTestMath + window.NormalMath).
   Node:    require('./equivalence-math.js') (pulls both via require). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./ttest-math.js'), require('./normal-math.js'));
  } else {
    root.EquivalenceMath = factory(root.TTestMath, root.NormalMath);
  }
}(typeof self !== 'undefined' ? self : this, function (T, N) {
  'use strict';

  // Upper-tail probabilities via symmetry (accurate deep in the tail).
  function ptUpper(t, df) {           // P(T_df > t) == pt(t, df, lower.tail=FALSE)
    if (!isFinite(t)) return t > 0 ? 0 : 1;
    return T.tCDF(-t, df);
  }
  function pnUpper(z) {               // P(Z > z) == pnorm(z, lower.tail=FALSE)
    if (!isFinite(z)) return z > 0 ? 0 : 1;
    return N.pnorm(-z);
  }
  var qt = T.tQuantile, qnorm = N.qnorm;

  function pooledSp(sd1, sd2, n1, n2) {
    return Math.sqrt(((n1 - 1) * sd1 * sd1 + (n2 - 1) * sd2 * sd2) / (n1 + n2 - 2));
  }
  function welchDf(sd1, sd2, n1, n2) {
    var a = sd1 * sd1 / n1, b = sd2 * sd2 / n2;
    return (a + b) * (a + b) / (a * a / (n1 - 1) + b * b / (n2 - 1));
  }

  // ---------------- ANALYZE: continuous (two-sample TOST) ----------------
  // opts: {m1,m2,sd1,sd2,n1,n2,type:'equiv'|'ni'|'super',low,high,alpha,varEqual}
  function analyzeCont(o) {
    var m1 = +o.m1, m2 = +o.m2, sd1 = +o.sd1, sd2 = +o.sd2, n1 = +o.n1, n2 = +o.n2;
    var type = o.type || 'equiv', low = +o.low, high = +o.high, alpha = +o.alpha;
    var varEqual = o.varEqual !== false;               // default pooled (Schuirmann)
    var diff = m1 - m2, se, df;
    if (varEqual) {
      df = n1 + n2 - 2;
      var sp0 = pooledSp(sd1, sd2, n1, n2);
      se = sp0 * Math.sqrt(1 / n1 + 1 / n2);
    } else {
      se = Math.sqrt(sd1 * sd1 / n1 + sd2 * sd2 / n2);
      df = welchDf(sd1, sd2, n1, n2);
    }
    var sp = pooledSp(sd1, sd2, n1, n2);               // Cohen's d always on pooled SD
    var d = diff / sp;
    var tc = qt(1 - alpha, df);
    var r = { kind: 'analyze_cont', type: type, diff: diff, se: se, df: df, sp: sp, d: d,
              t1: null, p1: null, t2: null, p2: null,
              ciLo: NaN, ciHi: NaN, ciLoInf: false, ciHiInf: false, verdict: '' };
    if (type === 'equiv') {
      r.t1 = (diff - low) / se; r.p1 = ptUpper(r.t1, df);
      r.t2 = (high - diff) / se; r.p2 = ptUpper(r.t2, df);
      r.ciLo = diff - tc * se; r.ciHi = diff + tc * se;
      r.verdict = (r.p1 < alpha && r.p2 < alpha) ? 'equivalent'
                : (r.ciLo > high || r.ciHi < low) ? 'not equivalent' : 'inconclusive';
    } else if (type === 'ni') {
      r.t1 = (diff - low) / se; r.p1 = ptUpper(r.t1, df);
      r.ciLo = diff - tc * se; r.ciHiInf = true;
      r.verdict = (r.p1 < alpha) ? 'non-inferior' : 'inconclusive';
    } else {                                            // super: diff > high
      r.t2 = (diff - high) / se; r.p2 = ptUpper(r.t2, df);
      r.ciLo = diff - tc * se; r.ciHiInf = true;
      r.verdict = (r.p2 < alpha) ? 'superior' : 'inconclusive';
    }
    return r;
  }

  // ---------------- ANALYZE: proportions (two one-sided z) ----------------
  function analyzeProp(o) {
    var x1 = +o.x1, n1 = +o.n1, x2 = +o.x2, n2 = +o.n2;
    var type = o.type || 'equiv', low = +o.low, high = +o.high, alpha = +o.alpha;
    var p1 = x1 / n1, p2 = x2 / n2, diff = p1 - p2;
    var se = Math.sqrt(p1 * (1 - p1) / n1 + p2 * (1 - p2) / n2);
    var zc = qnorm(1 - alpha);
    var r = { kind: 'analyze_prop', type: type, p1: p1, p2: p2, diff: diff, se: se,
              z1: null, pz1: null, z2: null, pz2: null,
              ciLo: NaN, ciHi: NaN, ciLoInf: false, ciHiInf: false, verdict: '' };
    if (type === 'equiv') {
      r.z1 = (diff - low) / se; r.pz1 = pnUpper(r.z1);
      r.z2 = (high - diff) / se; r.pz2 = pnUpper(r.z2);
      r.ciLo = diff - zc * se; r.ciHi = diff + zc * se;
      r.verdict = (r.pz1 < alpha && r.pz2 < alpha) ? 'equivalent'
                : (r.ciLo > high || r.ciHi < low) ? 'not equivalent' : 'inconclusive';
    } else if (type === 'ni') {
      r.z1 = (diff - low) / se; r.pz1 = pnUpper(r.z1);
      r.ciLo = diff - zc * se; r.ciHiInf = true;
      r.verdict = (r.pz1 < alpha) ? 'non-inferior' : 'inconclusive';
    } else {
      r.z2 = (diff - high) / se; r.pz2 = pnUpper(r.z2);
      r.ciLo = diff - zc * se; r.ciHiInf = true;
      r.verdict = (r.pz2 < alpha) ? 'superior' : 'inconclusive';
    }
    return r;
  }

  // ---------------- PLAN: continuous sample size (bounds in Cohen's d) ----------------
  // opts: {type,low,high,mu,alpha,power}
  function planCont(o) {
    var type = o.type || 'equiv', low = +o.low, high = +o.high, mu = +o.mu || 0,
        alpha = +o.alpha, power = +o.power;
    var za = qnorm(1 - alpha), nraw, invalid = null;
    if (type === 'equiv') {
      if (mu <= low || mu >= high) invalid = 'true effect must lie inside the bounds';
      var zbE = qnorm(1 - (1 - power) / 2);
      var ntl = 2 * (za + zbE) * (za + zbE) / ((mu - low) * (mu - low));
      var nth = 2 * (za + zbE) * (za + zbE) / ((mu - high) * (mu - high));
      nraw = Math.max(ntl, nth);
    } else {
      var margin = (type === 'ni') ? low : high;
      var dist = mu - margin;
      if (dist <= 0) invalid = 'assumed true effect must exceed the margin';
      var zb1 = qnorm(power);
      nraw = 2 * (za + zb1) * (za + zb1) / (dist * dist);
    }
    var n = Math.ceil(nraw);
    return { kind: 'plan_cont', type: type, nraw: nraw, n: n, ntotal: 2 * n, invalid: invalid };
  }

  // ---------------- PLAN: proportion sample size ----------------
  // opts: {type,p1,p2,low,high,alpha,power}
  function planProp(o) {
    var type = o.type || 'equiv', p1 = +o.p1, p2 = +o.p2, low = +o.low, high = +o.high,
        alpha = +o.alpha, power = +o.power;
    var za = qnorm(1 - alpha), sig2 = p1 * (1 - p1) + p2 * (1 - p2), nraw, invalid = null;
    var mu = p1 - p2;
    if (type === 'equiv') {
      if (Math.abs(mu) >= Math.abs(low) || Math.abs(mu) >= Math.abs(high)) invalid = 'true difference must lie inside the bounds';
      var zbE = qnorm(1 - (1 - power) / 2);
      var dl = Math.abs(mu) - Math.abs(low), dh = Math.abs(mu) - Math.abs(high);
      nraw = Math.max(sig2 * ((za + zbE) / dl) * ((za + zbE) / dl),
                      sig2 * ((za + zbE) / dh) * ((za + zbE) / dh));
    } else {
      var margin = (type === 'ni') ? low : high;
      var dist = mu - margin;
      if (dist <= 0) invalid = 'assumed true difference must exceed the margin';
      var zb1 = qnorm(power);
      nraw = sig2 * ((za + zb1) / dist) * ((za + zb1) / dist);
    }
    var n = Math.ceil(nraw);
    return { kind: 'plan_prop', type: type, nraw: nraw, n: n, ntotal: 2 * n, invalid: invalid };
  }

  return {
    ptUpper: ptUpper, pnUpper: pnUpper,
    analyzeCont: analyzeCont, analyzeProp: analyzeProp,
    planCont: planCont, planProp: planProp
  };
}));
