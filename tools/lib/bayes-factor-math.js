/* bayes-factor-math.js - R-verified Bayes factors for Tool Farm v2.
   Ground truth: BayesFactor 0.9.12-4.8 (Morey & Rouder), see
   Scripts/tool-truth/bayes-factor-calculator.json. Every BF10 matches the
   corresponding BayesFactor function to <=1e-6 relative:
     bfT   -> ttest.tstat        (Rouder et al. 2009 JZS Cauchy prior)
     bfLM  -> linearReg.R2stat   (Liang et al. 2008 Zellner-Siow g-prior;
                                   also one-way fixed-effects ANOVA via R2)
     bfCor -> .bf10Exact          (Ly et al. 2016 exact 2F1 stretched-beta)
     bfProp-> contingencyIndepMultinomial (Gunel & Dickey 1974 Dirichlet)
   Works in the browser (window.BayesFactorMath) and Node (module.exports). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.BayesFactorMath = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ---- special functions -------------------------------------------------
  // Lanczos log-gamma (g = 607/128, 15 terms): ~1e-15 relative, so that the
  // large-argument lgamma differences in the correlation/proportion closed
  // forms stay accurate for n into the thousands.
  var LG = [
    0.99999999999999709182, 57.156235665862923517, -59.597960355475491248,
    14.136097974741747174, -0.49191381609762019978, 0.33994649984811888699e-4,
    0.46523628927048575665e-4, -0.98374475304879564677e-4, 0.15808870322491248884e-3,
    -0.21026444172410488319e-3, 0.21743961811521264320e-3, -0.16431810653676389022e-3,
    0.84418223983852743293e-4, -0.26190838401581408670e-4, 0.36899182659531622704e-5
  ];
  function lgamma(x) {
    if (x <= 0 && x === Math.floor(x)) return Infinity;
    if (x < 0.5) {
      // reflection: lgamma(x) = log(pi/sin(pi x)) - lgamma(1-x)
      return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - lgamma(1 - x);
    }
    x -= 1;
    var a = LG[0], tt = x + 607 / 128 + 0.5;
    for (var i = 1; i < 15; i++) a += LG[i] / (x + i);
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(tt) - tt + Math.log(a);
  }
  function lbeta(a, b) { return lgamma(a) + lgamma(b) - lgamma(a + b); }

  // Regularized incomplete beta I_x(a,b) (Numerical Recipes) - for F/t p-values.
  function betacf(a, b, x) {
    var FPMIN = 1e-300, qab = a + b, qap = a + 1, qam = a - 1;
    var c = 1, d = 1 - qab * x / qap;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    d = 1 / d; var h = d;
    for (var m = 1; m <= 300; m++) {
      var m2 = 2 * m;
      var aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d; var del = d * c; h *= del;
      if (Math.abs(del - 1) < 3e-16) break;
    }
    return h;
  }
  function ibeta(a, b, x) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    var bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) +
                      a * Math.log(x) + b * Math.log(1 - x));
    if (x < (a + 1) / (a + b + 2)) return bt * betacf(a, b, x) / a;
    return 1 - bt * betacf(b, a, 1 - x) / b;
  }
  // Two-sided Student-t p-value.
  function ptTwoSided(t, df) {
    if (!isFinite(t)) return 0;
    var x = df / (df + t * t);
    return ibeta(df / 2, 0.5, x);
  }
  // Upper-tail F p-value P(F_{d1,d2} > f).
  function pfUpper(f, d1, d2) {
    if (!(f > 0)) return 1;
    return ibeta(d2 / 2, d1 / 2, d2 / (d2 + d1 * f));
  }
  // Standard normal CDF via erf (Abramowitz-Stegun 7.1.26, ~1e-7).
  function pnorm(z) {
    var s = z < 0 ? -1 : 1; z = Math.abs(z) / Math.SQRT2;
    var t = 1 / (1 + 0.3275911 * z);
    var y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t
              - 0.284496736) * t + 0.254829592) * t * Math.exp(-z * z);
    return 0.5 * (1 + s * y);
  }

  // ---- deterministic log-space quadrature --------------------------------
  // Integrate exp(logf(u)) du over the unimodal integrand on [loInit,hiInit].
  // We locate the mode, subtract its log-height so the exponentials never
  // overflow, trim the support to where the integrand is negligible, then run
  // a fixed fine composite Simpson (spacing scales with the peak width, so the
  // O(h^4) error stays ~1e-10 even for very peaked integrands). Deterministic,
  // always terminates - unlike naive recursive adaptive Simpson, whose halving
  // tolerance underflows machine precision on sharp peaks and recurses forever.
  function logIntegrate(logf, loInit, hiInit) {
    var NS = 300, hS = (hiInit - loInit) / NS, c = -Infinity, uMode = (loInit + hiInit) / 2;
    for (var i = 0; i <= NS; i++) {
      var u = loInit + i * hS, v = logf(u);
      if (isFinite(v) && v > c) { c = v; uMode = u; }
    }
    if (!isFinite(c)) return NaN;
    // Trim to the effective support (integrand within exp(-55) of the peak).
    var lo = uMode, hi = uMode, step = 0.5;
    while (lo > loInit && logf(lo) > c - 55) lo -= step;
    while (hi < hiInit && logf(hi) > c - 55) hi += step;
    lo = Math.max(lo, loInit); hi = Math.min(hi, hiInit);
    var N = 8000, h = (hi - lo) / N, s = 0;
    for (var j = 0; j <= N; j++) {
      var uu = lo + j * h, w = (j === 0 || j === N) ? 1 : ((j % 2) ? 4 : 2);
      var d = logf(uu) - c; s += w * (d < -745 ? 0 : Math.exp(d));
    }
    return Math.log(h / 3 * s) + c;
  }

  // ---- 1. JZS t-test (Rouder 2009) ---------------------------------------
  // Model: delta ~ Cauchy(0, r), t | delta ~ noncentral-t(df=nu, ncp=delta*sqrt(neff)).
  // Equivalent Zellner-Siow g form (integrate over u = log g):
  //   pi(g)  = InvGamma(g; 1/2, r^2/2)
  //   f(g)   = (1+neff*g)^(-1/2) * (1 + t^2/(nu*(1+neff*g)))^(-(nu+1)/2)
  //   BF10   = INT f(g) pi(g) dg  /  (1 + t^2/nu)^(-(nu+1)/2)
  function logIntegrandT(u, t, neff, nu, r2) {
    var g = Math.exp(u);
    var logPi = 0.5 * Math.log(r2 / 2) - lgamma(0.5) - 1.5 * u - (r2 / 2) / g;
    var oneNG = 1 + neff * g;
    var logA = -0.5 * Math.log(oneNG);
    var logB = -((nu + 1) / 2) * Math.log(1 + t * t / (nu * oneNG));
    return logPi + logA + logB + u; // + u = dg = g du Jacobian
  }
  function bfT(t, neff, nu, r) {
    if (!(neff > 0) || !(nu >= 1) || !(r > 0)) return NaN;
    if (!isFinite(t)) return NaN;
    var tt = Math.abs(t) < 1e-12 ? 1e-12 : Math.abs(t), r2 = r * r;
    var f = function (u) { return logIntegrandT(u, tt, neff, nu, r2); };
    var logNum = logIntegrate(f, -50, 40); // u = log g
    var logDen = -((nu + 1) / 2) * Math.log(1 + tt * tt / nu);
    return Math.exp(logNum - logDen);
  }

  // ---- 2. JZS linear model: regression & one-way ANOVA (Liang 2008) ------
  // Integrate over u = log g:
  //   a(g)  = 1/2*((N-p-1)*log(1+g) - (N-1)*log(1+g*(1-R2)))
  //   pi(g) = InvGamma(g; 1/2, N*r^2/2)
  //   BF10  = INT exp(a) pi(g) dg
  function logIntegrandLM(u, N, p, R2, s) {
    var g = Math.exp(u);
    var logPi = 0.5 * Math.log(s) - lgamma(0.5) - 1.5 * u - s / g;
    var a = 0.5 * ((N - p - 1) * Math.log(1 + g) - (N - 1) * Math.log(1 + g * (1 - R2)));
    return a + logPi + u;
  }
  function bfLM(N, p, R2, r) {
    if (!(N > p + 1) || !(r > 0)) return NaN;
    if (!(R2 >= 0) || !(R2 < 1)) return NaN;
    var s = N * r * r / 2;
    var f = function (u) { return logIntegrandLM(u, N, p, R2, s); };
    return Math.exp(logIntegrate(f, -40, 45)); // u = log g
  }
  // One-way fixed-effects ANOVA: BF from the omnibus F via R2 = F*df1/(F*df1+df2).
  function bfAnova(F, df1, df2, N, r) {
    if (!(F >= 0) || !(df1 >= 1) || !(df2 >= 1) || !(N > df1 + 1)) return NaN;
    var R2 = (F * df1) / (F * df1 + df2);
    return bfLM(N, df1, R2, r);
  }
  function bfRegF(F, df1, df2, N, r) { return bfLM(N, df1, (F * df1) / (F * df1 + df2), r); }

  // ---- 3. Exact correlation BF (Ly, Verhagen & Wagenmakers 2016) ---------
  // log 2F1(a,a;c;z) via the positive-term series, accumulated in log space.
  function log2F1aa(a, c, z) {
    if (z <= 0) return 0; // only k=0 term
    var logz = Math.log(z), logTerm = 0, terms = [0], maxL = 0;
    for (var k = 1; k <= 20000; k++) {
      logTerm += 2 * Math.log(a + k - 1) + logz - Math.log((c + k - 1) * k);
      terms.push(logTerm);
      if (logTerm > maxL) maxL = logTerm;
      if (logTerm < maxL - 42 && logTerm < terms[k - 1]) break; // past the peak, negligible
    }
    var s = 0;
    for (var i = 0; i < terms.length; i++) { var d = terms[i] - maxL; if (d > -745) s += Math.exp(d); }
    return maxL + Math.log(s);
  }
  // Returns BF10. kappa is the stretched-beta width (rscale). n = pairs.
  function bfCor(n, r, kappa) {
    if (!(n > 2)) return 1;                       // undefined -> BF 1 (BayesFactor: bf=0 log)
    if (Math.abs(r) >= 1) return kappa >= 1 ? Infinity : NaN;
    var twoOk = 2 / kappa;
    var logHyper = log2F1aa((n - 1) / 2, (n + twoOk) / 2, r * r);
    var logBF = (1 - twoOk) * Math.log(2) + 0.5 * Math.log(Math.PI)
              - lbeta(1 / kappa, 1 / kappa)
              + lgamma((n + twoOk - 1) / 2) - lgamma((n + twoOk) / 2) + logHyper;
    return Math.exp(logBF);
  }

  // ---- 4. Two-proportion / 2x2 independent-multinomial BF (Gunel-Dickey) --
  function ldirich(alpha) {
    var s = 0, t = 0;
    for (var i = 0; i < alpha.length; i++) { s += lgamma(alpha[i]); t += alpha[i]; }
    return s - lgamma(t);
  }
  // Rows = the two groups; columns = (success, failure). Prior concentration a>=1.
  function bfProp(x1, n1, x2, n2, a) {
    if (!(a >= 1)) return NaN;
    if (x1 < 0 || x2 < 0 || x1 > n1 || x2 > n2) return NaN;
    var I = 2, oc = 1, ac = 2 * a, ar = 2 * a; // symmetric 2x2 with scalar a
    var cY = [x1, x2, n1 - x1, n2 - x2], cA = [a, a, a, a];
    var t1 = ldirich([ac - (I - 1) * oc, ac - (I - 1) * oc]);
    var t2 = ldirich([ar, ar]);
    var yc = [x1 + x2, (n1 - x1) + (n2 - x2)];
    var t3 = ldirich(cY.map(function (v, i) { return v + cA[i]; }));
    var t4 = ldirich([yc[0] + ac - (I - 1) * oc, yc[1] + ac - (I - 1) * oc]);
    var t5 = ldirich([n1 + ar, n2 + ar]);
    var t6 = ldirich(cA);
    return Math.exp(t1 + t2 + t3 - t4 - t5 - t6);
  }

  // ---- interpretation (Jeffreys / Lee & Wagenmakers) ---------------------
  function interpret(bf) {
    if (!isFinite(bf) || bf <= 0) return { label: 'undefined', side: 'na' };
    if (bf >= 100) return { label: 'extreme evidence for H1', side: 'h1' };
    if (bf >= 30) return { label: 'very strong evidence for H1', side: 'h1' };
    if (bf >= 10) return { label: 'strong evidence for H1', side: 'h1' };
    if (bf >= 3) return { label: 'moderate evidence for H1', side: 'h1' };
    if (bf > 1) return { label: 'anecdotal evidence for H1', side: 'h1' };
    if (bf === 1) return { label: 'no evidence either way', side: 'none' };
    if (bf > 1 / 3) return { label: 'anecdotal evidence for H0', side: 'h0' };
    if (bf > 1 / 10) return { label: 'moderate evidence for H0', side: 'h0' };
    if (bf > 1 / 30) return { label: 'strong evidence for H0', side: 'h0' };
    if (bf > 1 / 100) return { label: 'very strong evidence for H0', side: 'h0' };
    return { label: 'extreme evidence for H0', side: 'h0' };
  }

  return {
    lgamma: lgamma, lbeta: lbeta, ibeta: ibeta,
    ptTwoSided: ptTwoSided, pfUpper: pfUpper, pnorm: pnorm,
    bfT: bfT, bfLM: bfLM, bfAnova: bfAnova, bfRegF: bfRegF,
    bfCor: bfCor, bfProp: bfProp, log2F1aa: log2F1aa,
    interpret: interpret
  };
}));
