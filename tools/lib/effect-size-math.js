/* effect-size-math.js  -  verified effect-size conversions for r-statistics.co
   Ground truth: Scripts/tool-truth/effect-size-converter.json (base R 4.6.0).
   All conversions are exact closed forms (Cohen 1988; Borenstein et al. 2009;
   Hasselblad & Hedges 1995; Kraemer & Kupfer 2006). The exact Hedges' J uses
   lgamma; the d confidence interval inverts the noncentral t (matches
   MBESS::ci.smd / effectsize::cohens_d), reusing power-math's AS-243 pt_nc.

   UMD: browser global (window.EffectSizeMath) + Node require.
   Reuses NormalMath (pnorm/qnorm/lgamma) and PowerMath (pt_nc) per project rule. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./normal-math.js'), require('./power-math.js'));
  } else {
    root.EffectSizeMath = factory(root.NormalMath, root.PowerMath);
  }
}(typeof self !== 'undefined' ? self : this, function (Normal, Power) {
  'use strict';

  var pnorm = Normal.pnorm, qnorm = Normal.qnorm, lgamma = Normal.lgamma;
  var pt_nc = Power.pt_nc;
  var SQRT2 = Math.SQRT2, PI = Math.PI;

  // ---- pairwise conversions (all exact) ------------------------------
  // Point-biserial r from d, with the unequal-n correction a = (n1+n2)^2/(n1 n2)
  // (Aaron, Kromrey & Ferron 1998). Equal / unknown n -> a = 4 (Cohen 1988).
  function dToR(d, n1, n2) {
    var a = (!n1 || !n2 || n1 === n2) ? 4 : (n1 + n2) * (n1 + n2) / (n1 * n2);
    return d / Math.sqrt(d * d + a);
  }
  function rToD(r) {
    if (Math.abs(r) >= 1) return Infinity * Math.sign(r);
    return 2 * r / Math.sqrt(1 - r * r);
  }
  function dToOr(d) { return Math.exp(d * PI / Math.sqrt(3)); }         // log OR = d*pi/sqrt(3)
  function orToD(or) { return Math.log(or) * Math.sqrt(3) / PI; }
  function eta2ToF(e) { if (e <= 0) return 0; if (e >= 1) return Infinity; return Math.sqrt(e / (1 - e)); }
  function fToEta2(f) { return (f * f) / (1 + f * f); }
  function dToCles(d) { return pnorm(d / SQRT2); }                     // P(X1 > X2)
  function clesToD(p) { return SQRT2 * qnorm(p); }

  // exact Hedges' correction factor J (df = n1+n2-2); matches effectsize::hedges_g
  function hedgesJ(n1, n2) {
    var df = (n1 || 50) + (n2 || 50) - 2;
    if (df <= 1) return NaN;
    return Math.exp(lgamma(df / 2) - 0.5 * Math.log(df / 2) - lgamma((df - 1) / 2));
  }
  function dToG(d, n1, n2) { return d * hedgesJ(n1, n2); }
  function gToD(g, n1, n2) { return g / hedgesJ(n1, n2); }

  // Kraemer & Kupfer (2006) distributional NNT = 1 / SRD, SRD = 2*CLES - 1.
  // Undefined (Infinity) for d <= 0 (no benefit to "number needed to treat").
  function dToNnt(d) {
    var srd = 2 * pnorm(d / SQRT2) - 1;
    if (srd <= 0) return Infinity;
    return 1 / srd;
  }

  // canonical Cohen's d from any source (drives every downstream target)
  function toCohenD(kind, s) {
    switch (kind) {
      case 'd':    return { d: s.d, n1: s.n1, n2: s.n2 };
      case 'g':    return { d: gToD(s.g, s.n1, s.n2), n1: s.n1, n2: s.n2 };
      case 'r':    return { d: rToD(s.r), n1: Math.floor((s.n || 100) / 2), n2: Math.ceil((s.n || 100) / 2) };
      case 'or':   return { d: orToD(s.or), n1: 50, n2: 50 };
      case 'eta2': return { d: 2 * Math.sqrt(s.eta2 / (1 - s.eta2)), n1: 50, n2: 50 };
      case 'f':    return { d: 2 * s.f, n1: 50, n2: 50 };
      case 'cles': return { d: clesToD(s.cles), n1: 50, n2: 50 };
      default:     return { d: NaN, n1: 50, n2: 50 };
    }
  }

  // ---- confidence intervals ------------------------------------------
  // exact noncentral-t CI for the two-group SMD. Inverts pt_nc(t, df, ncp)=target
  // by monotone bisection (pt_nc is strictly decreasing in ncp).
  function invNcp(tval, df, target) {
    var lo = tval - 200, hi = tval + 200;   // pt_nc(lo)->~1 > target ; pt_nc(hi)->~0 < target
    var flo = pt_nc(tval, df, lo) - target;
    var fhi = pt_nc(tval, df, hi) - target;
    var i, span = 200;
    while (flo < 0 && span < 1e6) { span *= 2; lo = tval - span; flo = pt_nc(tval, df, lo) - target; }
    while (fhi > 0 && span < 1e6) { span *= 2; hi = tval + span; fhi = pt_nc(tval, df, hi) - target; }
    for (i = 0; i < 200; i++) {
      var mid = 0.5 * (lo + hi);
      var fm = pt_nc(tval, df, mid) - target;
      if (Math.abs(fm) < 1e-12 || (hi - lo) < 1e-11) return mid;
      // pt_nc decreasing in ncp: fm>0 means mid too small
      if (fm > 0) lo = mid; else hi = mid;
    }
    return 0.5 * (lo + hi);
  }
  function dCiExact(d, n1, n2, level) {
    level = level || 0.95;
    var alpha = 1 - level;
    var df = n1 + n2 - 2;
    var scale = Math.sqrt(n1 * n2 / (n1 + n2));   // t = d*scale ; ncp = delta*scale
    var tval = d * scale;
    var ncpL = invNcp(tval, df, 1 - alpha / 2);
    var ncpU = invNcp(tval, df, alpha / 2);
    return [ncpL / scale, ncpU / scale];
  }
  // Fisher-z CI for Pearson r
  function rCi(r, n, level) {
    level = level || 0.95;
    if (Math.abs(r) >= 1 || n < 4) return [NaN, NaN];
    var z = Math.atanh(r), se = 1 / Math.sqrt(n - 3);
    var zc = qnorm(1 - (1 - level) / 2);
    return [Math.tanh(z - zc * se), Math.tanh(z + zc * se)];
  }

  // ---- clinical OR + baseline -> p2, RR, ARR, NNT --------------------
  function orClinical(or, p1) {
    var odds1 = p1 / (1 - p1);
    var odds2 = or * odds1;
    var p2 = odds2 / (1 + odds2);
    var arr = p2 - p1;
    return { p2: p2, rr: p2 / p1, arr: arr, nnt: arr === 0 ? Infinity : 1 / Math.abs(arr) };
  }

  // ---- magnitude labels (Cohen 1988 benchmarks) ----------------------
  function magnitudeD(d) {
    var a = Math.abs(d);
    if (a < 0.2) return 'negligible';
    if (a < 0.5) return 'small';
    if (a < 0.8) return 'medium';
    return 'large';
  }
  function magnitudeR(r) {
    var a = Math.abs(r);
    if (a < 0.10) return 'negligible';
    if (a < 0.30) return 'small';
    if (a < 0.50) return 'medium';
    return 'large';
  }
  function magnitudeEta2(e) {
    if (e < 0.01) return 'negligible';
    if (e < 0.06) return 'small';
    if (e < 0.14) return 'medium';
    return 'large';
  }

  return {
    dToR: dToR, rToD: rToD, dToOr: dToOr, orToD: orToD,
    eta2ToF: eta2ToF, fToEta2: fToEta2, dToCles: dToCles, clesToD: clesToD,
    hedgesJ: hedgesJ, dToG: dToG, gToD: gToD, dToNnt: dToNnt,
    toCohenD: toCohenD, dCiExact: dCiExact, rCi: rCi, orClinical: orClinical,
    magnitudeD: magnitudeD, magnitudeR: magnitudeR, magnitudeEta2: magnitudeEta2,
    pnorm: pnorm, qnorm: qnorm
  };
}));
