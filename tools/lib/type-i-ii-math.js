/* type-i-ii-math.js - geometry + exact stats for the Type I / II error visualizer.
   Composes tools/lib/power-math.js (AS 243 exact noncentral t, exact noncentral F,
   machine-precision normal; ground truth R 4.6.0 `pwr`). Every displayed number
   (power, beta, critical value, ncp) is exact to R; the density functions are used
   ONLY to draw the plot curves (pixel scale), and their shaded regions equal the
   exact computed beta/power by construction.
   Browser: window.TypeIIMath (needs window.PowerMath loaded first).
   Node:    module.exports (requires ./power-math.js). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./power-math.js'));
  else root.TypeIIMath = factory(root.PowerMath);
}(typeof self !== 'undefined' ? self : this, function (PM) {
  'use strict';
  if (!PM) throw new Error('TypeIIMath requires PowerMath');

  var SQRT2PI = Math.sqrt(2 * Math.PI);

  // ---- densities (plot only) ----
  function dnorm(x, mu, sd) { var z = (x - (mu || 0)) / (sd || 1); return Math.exp(-0.5 * z * z) / (SQRT2PI * (sd || 1)); }
  function dt(x, df) {
    return Math.exp(PM.lgamma((df + 1) / 2) - PM.lgamma(df / 2)) /
           (Math.sqrt(df * Math.PI) * Math.pow(1 + x * x / df, (df + 1) / 2));
  }
  function dt_nc(x, df, ncp) {
    if (!ncp) return dt(x, df);
    var h = 1e-3;
    return (PM.pt_nc(x + h, df, ncp) - PM.pt_nc(x - h, df, ncp)) / (2 * h);
  }
  function fpdf(x, df1, df2, ncp) {
    if (x <= 0) return 0;
    var h = 1e-3, xl = Math.max(1e-9, x - h);
    var cdf = ncp ? PM.pf_nc : PM.pf;
    return (cdf(x + h, df1, df2, ncp) - cdf(xl, df1, df2, ncp)) / ((x + h) - xl);
  }

  function fmt(v, d) { return isFinite(v) ? Number(v).toFixed(d == null ? 3 : d) : String(v); }

  // ---- main: returns the full render object for one design + parameter set ----
  // s = {effect, n, alpha, tail, k, p0, p1, p2}
  function compute(design, s) {
    var alpha = s.alpha, tail = s.tail || 2, n = s.n;
    var half = (tail === 1) ? 1 : 2;
    var o = { design: design, alpha: alpha, tail: tail, n: n };

    if (design === 'oneT' || design === 'twoT') {
      var d = s.effect;
      var df = (design === 'oneT') ? Math.max(1, n - 1) : Math.max(1, 2 * n - 2);
      var ncp = (design === 'oneT') ? Math.abs(d) * Math.sqrt(n) : Math.abs(d) * Math.sqrt(n / 2);
      var crit = PM.qt(1 - alpha / half, df);
      var power = (design === 'oneT') ? PM.powerOneSampleT(d, n, alpha, tail)
                                      : PM.powerTwoSampleT(d, n, alpha, tail, 1);
      o.family = 't'; o.df = df; o.ncp = ncp; o.crit = crit;
      o.power = power; o.beta = 1 - power;
      o.effectSym = 'd'; o.effectVal = d;
      o.dfStr = (design === 'oneT') ? 'df = n - 1 = ' + df : 'df = 2n - 2 = ' + df;
      o.ncpStr = (design === 'oneT') ? 'ncp = d*sqrt(n) = ' + fmt(ncp) : 'ncp = d*sqrt(n/2) = ' + fmt(ncp);
      o.critText = (tail === 1) ? 't* = ' + fmt(crit) : 't* = ±' + fmt(crit);
      o.nullPdf = function (x) { return dt(x, df); };
      o.altPdf = function (x) { return dt_nc(x, df, ncp); };
      o.xRange = [Math.min(-4, ncp - 4), Math.max(4, ncp + 4)];
    }
    else if (design === 'oneProp' || design === 'twoProp') {
      var h = (design === 'oneProp') ? PM.cohenH(s.p1, s.p0) : PM.cohenH(s.p2, s.p1);
      var ncpz = (design === 'oneProp') ? Math.abs(h) * Math.sqrt(n) : Math.abs(h) * Math.sqrt(n / 2);
      var critz = PM.qnorm(1 - alpha / half);
      var powz = (design === 'oneProp') ? PM.powerOneProp(h, n, alpha, tail)
                                        : PM.powerTwoProp(h, n, alpha, tail);
      o.family = 'z'; o.df = Infinity; o.ncp = ncpz; o.crit = critz;
      o.power = powz; o.beta = 1 - powz;
      o.effectSym = 'h'; o.effectVal = h;
      o.dfStr = 'z-test (normal reference)';
      o.ncpStr = (design === 'oneProp') ? 'ncp = h*sqrt(n) = ' + fmt(ncpz) : 'ncp = h*sqrt(n/2) = ' + fmt(ncpz);
      o.critText = (tail === 1) ? 'z* = ' + fmt(critz) : 'z* = ±' + fmt(critz);
      o.nullPdf = function (x) { return dnorm(x, 0, 1); };
      o.altPdf = function (x) { return dnorm(x, ncpz, 1); };
      o.xRange = [Math.min(-4, ncpz - 4), Math.max(4, ncpz + 4)];
    }
    else if (design === 'anova') {
      var f = s.effect, k = s.k;
      var df1 = Math.max(1, k - 1), df2 = Math.max(1, k * n - k);
      var ncpf = f * f * k * n;
      var fcrit = PM.qf(1 - alpha, df1, df2);
      var powf = PM.powerAnova(f, k, n, alpha);
      o.family = 'f'; o.df = [df1, df2]; o.ncp = ncpf; o.crit = fcrit;
      o.power = powf; o.beta = 1 - powf; o.tail = 1;
      o.effectSym = 'f'; o.effectVal = f;
      o.dfStr = 'df1 = k - 1 = ' + df1 + ', df2 = k*n - k = ' + df2;
      o.ncpStr = 'ncp = f²*k*n = ' + fmt(ncpf);
      o.critText = 'F* = ' + fmt(fcrit);
      o.nullPdf = function (x) { return fpdf(x, df1, df2, 0); };
      o.altPdf = function (x) { return fpdf(x, df1, df2, ncpf); };
      o.xRange = [0, Math.max(fcrit * 1.5, fcrit + 2 * (ncpf / df1) + 4)];
    }
    else if (design === 'correlation') {
      var r = s.effect, rr = Math.abs(r), df = Math.max(1, n - 2);
      var powr = PM.powerCorr(r, n, alpha, tail);
      // Fisher-z standardized picture (exactly the pwr.r.test model)
      var ncps = (n > 3) ? (Math.atanh(rr) + rr / (2 * (n - 1))) * Math.sqrt(n - 3) : 0;
      var tt = PM.qt(1 - alpha / half, df);
      var rc = Math.sqrt(tt * tt / (tt * tt + df));           // critical correlation r*
      var critz2 = Math.atanh(rc) * Math.sqrt(n - 3);         // crit in standardized units
      o.family = 'z'; o.df = df; o.ncp = ncps; o.crit = critz2;
      o.power = powr; o.beta = 1 - powr;
      o.effectSym = 'r'; o.effectVal = r; o.critR = rc;
      o.dfStr = 'df = n - 2 = ' + df + ' (Fisher-z, sqrt(n-3) scale)';
      o.ncpStr = 'ncp = (atanh(r) + r/(2(n-1)))*sqrt(n-3) = ' + fmt(ncps);
      o.critText = (tail === 1) ? '|r*| = ' + fmt(rc) : '|r*| = ±' + fmt(rc);
      o.nullPdf = function (x) { return dnorm(x, 0, 1); };
      o.altPdf = function (x) { return dnorm(x, ncps, 1); };
      o.xRange = [Math.min(-4, ncps - 4), Math.max(4, ncps + 4)];
    }
    return o;
  }

  return { compute: compute, dnorm: dnorm, dt: dt, dt_nc: dt_nc, fpdf: fpdf };
}));
