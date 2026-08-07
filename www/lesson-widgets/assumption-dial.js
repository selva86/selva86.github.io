/* assumption-dial.js - a model assumption, violated on a dial, with the damage measured.
 *
 * Serves the seven assumption objections in The Publishing Handbook: normality, equal
 * variance, independence, autocorrelation, multicollinearity, linearity, proportional
 * hazards. One widget, one config key.
 *
 * The reader drags severity from none to severe. Behind the dial the widget runs a
 * couple of thousand complete studies at EVERY severity level and measures two things:
 *
 *   COVERAGE - the share of those studies whose 95% interval actually contains the true
 *     value. That is what a confidence interval promises, and it is what a violated
 *     assumption breaks.
 *   FIT - R-squared, or Harrell's C for the survival model. That is what a reader looks
 *     at, and it is mostly what a violated assumption does NOT touch.
 *
 * Every generative model here holds the signal variance and the error variance fixed as
 * severity rises, so R-squared has no arithmetic reason to drift. Anything that moves is
 * the violation, not the setup.
 *
 * The honest part: the seven do not fail the same way, and the widget reports what it
 * measures rather than a uniform scare story.
 *
 *   equal variance / independence / autocorrelation -> coverage collapses, fit sits still.
 *       The interval is the casualty and the repair is the standard error.
 *   linearity -> coverage of the prediction at the top of the range goes to zero while
 *       R-squared barely moves. The line is a fine summary and a bad prediction.
 *   multicollinearity -> coverage HOLDS at 95% (verified at 6000 studies per point, every
 *       level within Monte Carlo error of 0.95). Only the WIDTH moves. Collinearity makes
 *       an estimate imprecise, not wrong, and the interval already says so.
 *   normality -> the mildest of the seven. Coverage moves about one point at a skewness
 *       of 4.5, because the Central Limit Theorem is doing the work.
 *   proportional hazards -> one hazard ratio cannot describe an effect that changes over
 *       follow-up, so the interval misses the early-period effect it is quoted as estimating.
 *
 * The emitted R runs the same experiment with the same generative model.
 *
 * cfg: {
 *   assumption: "heteroskedasticity",   // which violation (keys listed below)
 *   assumptions: ["...", "..."],        // OR an array -> segmented control, computed on pick
 *   levels: 11,                         // severity steps on the dial (0 .. 1)
 *   start: 0,                           // starting step index
 *   sims: null,                         // studies per point (per-assumption default)
 *   n: null,                            // sample size (per-assumption default)
 *   bars: 30,                           // how many study intervals to draw in the lower panel
 *   seed: 17                            // mulberry32 seed - same config, same picture
 * }
 *
 * assumption: normality | heteroskedasticity | independence | autocorrelation |
 *             multicollinearity | linearity | proportional-hazards
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u;

  /* ---------------- theme ----------------
     The player is light today. Resolve from --lm-panel when it exists so a dark panel
     never produces black on black, and fall back to html.dark elsewhere. */
  var LIGHT = {
    ink: '#131720', body: '#434b59', mut: '#677084', faint: '#97a0b2',
    line: '#d8dee9', grid: '#eef1f6', acc: '#1f7a55', c0: '#2563a8', bad: '#c2410c',
    panel: '#ffffff'
  };
  var DARK = {
    ink: '#eef4fb', body: '#c3d1e3', mut: '#93a4bb', faint: '#6f8299',
    line: 'rgba(255,255,255,.24)', grid: 'rgba(255,255,255,.10)', acc: '#46c08a',
    c0: '#7fb2ea', bad: '#f4805a', panel: '#101c2b'
  };
  function lumOf(c) {
    c = String(c).trim(); var r, g, b, m;
    if (c.charAt(0) === '#') {
      if (c.length === 4) { r = parseInt(c[1] + c[1], 16); g = parseInt(c[2] + c[2], 16); b = parseInt(c[3] + c[3], 16); }
      else { r = parseInt(c.substr(1, 2), 16); g = parseInt(c.substr(3, 2), 16); b = parseInt(c.substr(5, 2), 16); }
    } else if ((m = c.match(/rgba?\(([^)]+)\)/))) { var p = m[1].split(','); r = +p[0]; g = +p[1]; b = +p[2]; }
    else return 1;
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  }
  function isDark(el) {
    try {
      var v = getComputedStyle(el).getPropertyValue('--lm-panel');
      if (v && v.trim()) return lumOf(v) < 0.45;
    } catch (e) {}
    return !!(document.documentElement && document.documentElement.classList.contains('dark'));
  }
  function palette(el) { return isDark(el) ? DARK : LIGHT; }

  /* ---------------- seeded numerics ---------------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function gaussian(rnd) {                       // Box-Muller, one draw per call
    var a = 1 - rnd(), b = rnd();
    return Math.sqrt(-2 * Math.log(a)) * Math.cos(2 * Math.PI * b);
  }

  /* Student t via the regularised incomplete beta (Lentz continued fraction). */
  function lgamma(x) {
    var c = [76.18009172947146, -86.50532032941677, 24.01409824083091,
             -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
    var y = x, t = x + 5.5, s = 1.000000000190015;
    t -= (x + 0.5) * Math.log(t);
    for (var j = 0; j < 6; j++) s += c[j] / ++y;
    return -t + Math.log(2.5066282746310005 * s / x);
  }
  function betacf(a, b, x) {
    var FPMIN = 1e-300, qab = a + b, qap = a + 1, qam = a - 1;
    var c = 1, d = 1 - qab * x / qap;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    d = 1 / d; var h = d;
    for (var m = 1; m <= 300; m++) {
      var m2 = 2 * m, aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d; var del = d * c; h *= del;
      if (Math.abs(del - 1) < 3e-12) break;
    }
    return h;
  }
  function ibeta(a, b, x) {
    if (x <= 0) return 0; if (x >= 1) return 1;
    var bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    return (x < (a + 1) / (a + b + 2)) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b;
  }
  function pt(t, df) { var p = 0.5 * ibeta(df / 2, 0.5, df / (df + t * t)); return t > 0 ? 1 - p : p; }
  function qt(p, df) {
    var lo = -60, hi = 60, i;
    for (i = 0; i < 160; i++) { var mid = (lo + hi) / 2; if (pt(mid, df) < p) lo = mid; else hi = mid; }
    return (lo + hi) / 2;
  }
  function pnorm(z) {
    var s = z < 0 ? -1 : 1, x = Math.abs(z) / Math.SQRT2, t = 1 / (1 + 0.3275911 * x);
    var y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return 0.5 * (1 + s * y);
  }
  function qnorm(p) {
    var lo = -9, hi = 9, i;
    for (i = 0; i < 90; i++) { var m = (lo + hi) / 2; if (pnorm(m) < p) lo = m; else hi = m; }
    return (lo + hi) / 2;
  }
  /* If a 95% interval covers only `cov` of the time, its standard error is understating
     the truth by roughly this factor. Exact under normality, indicative otherwise. */
  function understate(cov) {
    if (cov >= 0.9499) return 1;
    return 1.959963985 / qnorm((1 + Math.max(0.001, cov)) / 2);
  }

  function inv(A) {                              // Gauss-Jordan, p <= 4 here
    var p = A.length, M = [], i, j, k;
    for (i = 0; i < p; i++) { M.push(A[i].slice()); for (j = 0; j < p; j++) M[i].push(i === j ? 1 : 0); }
    for (i = 0; i < p; i++) {
      var piv = i;
      for (k = i + 1; k < p; k++) if (Math.abs(M[k][i]) > Math.abs(M[piv][i])) piv = k;
      var tmp = M[i]; M[i] = M[piv]; M[piv] = tmp;
      var dd = M[i][i] || 1e-300;
      for (j = 0; j < 2 * p; j++) M[i][j] /= dd;
      for (k = 0; k < p; k++) {
        if (k === i) continue;
        var f = M[k][i]; if (!f) continue;
        for (j = 0; j < 2 * p; j++) M[k][j] -= f * M[i][j];
      }
    }
    var out = []; for (i = 0; i < p; i++) out.push(M[i].slice(p));
    return out;
  }
  function std(a) {
    var n = a.length, m = 0, v = 0, i;
    for (i = 0; i < n; i++) m += a[i]; m /= n;
    for (i = 0; i < n; i++) v += (a[i] - m) * (a[i] - m);
    return { m: m, s: Math.sqrt(v / (n - 1)) };
  }
  function zed(a) {                              // exact mean 0, sd 1
    var m = std(a), out = [], i;
    for (i = 0; i < a.length; i++) out.push((a[i] - m.m) / m.s);
    return out;
  }
  function skewLN(sg) { var w = Math.exp(sg * sg); return (w + 2) * Math.sqrt(w - 1); }

  /* Fixed-design OLS. The design matrix never changes across simulated studies, so the
     cross-product inverse is computed once and each study costs O(n * p). */
  function fitter(Xflat, n, p, target) {
    var XtX = [], j, k, i;
    for (j = 0; j < p; j++) { XtX.push(new Array(p)); for (k = 0; k < p; k++) XtX[j][k] = 0; }
    for (i = 0; i < n; i++) for (j = 0; j < p; j++) for (k = j; k < p; k++) XtX[j][k] += Xflat[i * p + j] * Xflat[i * p + k];
    for (j = 0; j < p; j++) for (k = 0; k < j; k++) XtX[j][k] = XtX[k][j];
    var V = inv(XtX), df = n - p, tc = qt(0.975, df);
    var q0;                                      // the quadratic form behind the standard error
    if (target.kind === 'pred') {
      q0 = 0;
      for (j = 0; j < p; j++) for (k = 0; k < p; k++) q0 += target.x0[j] * V[j][k] * target.x0[k];
    } else q0 = V[target.j][target.j];
    var Xty = new Float64Array(p), beta = new Float64Array(p);
    return function (y) {
      var a, b, s;
      for (a = 0; a < p; a++) Xty[a] = 0;
      for (i = 0; i < n; i++) { var yi = y[i]; for (a = 0; a < p; a++) Xty[a] += Xflat[i * p + a] * yi; }
      for (a = 0; a < p; a++) { s = 0; for (b = 0; b < p; b++) s += V[a][b] * Xty[b]; beta[a] = s; }
      var rss = 0, ybar = 0, tss = 0;
      for (i = 0; i < n; i++) ybar += y[i]; ybar /= n;
      for (i = 0; i < n; i++) {
        var f = 0; for (a = 0; a < p; a++) f += Xflat[i * p + a] * beta[a];
        var r = y[i] - f; rss += r * r;
        var c = y[i] - ybar; tss += c * c;
      }
      var s2 = rss / df, est = 0;
      if (target.kind === 'pred') { for (a = 0; a < p; a++) est += target.x0[a] * beta[a]; }
      else est = beta[target.j];
      var se = Math.sqrt(s2 * q0);
      return { est: est, lo: est - tc * se, hi: est + tc * se, r2: 1 - rss / tss };
    };
  }

  /* Cox proportional hazards, one covariate, Breslow ties, Newton-Raphson.
     Checked against survival::coxph: same coefficient and standard error to 3 decimals. */
  function coxfit(time, event, z, order) {
    var n = time.length, i;
    order.sort(function (a, b) { return time[a] - time[b]; });
    var beta = 0, it, k, zk, w, s0, s1, s2, g, h, m1, step;
    for (it = 0; it < 40; it++) {
      s0 = 0; s1 = 0; s2 = 0; g = 0; h = 0;
      for (i = n - 1; i >= 0; i--) {                    // walk back so the risk set accumulates
        k = order[i]; zk = z[k]; w = Math.exp(beta * zk);
        s0 += w; s1 += w * zk; s2 += w * zk * zk;
        if (event[k]) { m1 = s1 / s0; g += zk - m1; h += s2 / s0 - m1 * m1; }
      }
      if (h < 1e-12) break;
      step = g / h; beta += step;
      if (Math.abs(step) < 1e-10) break;
    }
    s0 = 0; s1 = 0; s2 = 0; var I = 0;
    for (i = n - 1; i >= 0; i--) {
      k = order[i]; zk = z[k]; w = Math.exp(beta * zk);
      s0 += w; s1 += w * zk; s2 += w * zk * zk;
      if (event[k]) { m1 = s1 / s0; I += s2 / s0 - m1 * m1; }
    }
    return { beta: beta, se: I > 0 ? 1 / Math.sqrt(I) : NaN };
  }
  /* Concordance. `risk` is a risk score: higher means expected to fail sooner. Pairs with
     a tied risk score count a half, which is what survival::concordance does, so this
     number is comparable with summary(coxph(...))$concordance in the R block. */
  function cindex(time, event, risk) {
    var n = time.length, conc = 0, disc = 0, tie = 0, i, j;
    for (i = 0; i < n; i++) {
      if (!event[i]) continue;
      for (j = 0; j < n; j++) {
        if (j === i || time[j] <= time[i]) continue;
        if (risk[i] > risk[j]) conc++; else if (risk[i] < risk[j]) disc++; else tie++;
      }
    }
    var tot = conc + disc + tie;
    return tot ? (conc + 0.5 * tie) / tot : 0.5;
  }

  /* ---------------- the seven assumptions ----------------
     design(rnd, n) builds the FIXED part of the study (the predictors) once for the whole
     dial. draw(rnd, s, d, n, y) fills y for one study at severity s. */
  var SPECS = {
    normality: {
      title: 'Normality of the errors', short: 'Normality',
      dialName: 'skew of the error distribution', estimand: 'the slope',
      n: 30, sims: 2000, fit: 'ols', target: { kind: 'coef', j: 1 },
      dial: function (s) { return s === 0 ? 'errors normal' : 'skewness ' + skewLN(0.85 * s).toFixed(1); },
      design: function (rnd, n) {
        var x = [], X = new Float64Array(n * 2), i;
        for (i = 0; i < n; i++) x.push(gaussian(rnd));
        x = zed(x);
        for (i = 0; i < n; i++) { X[i * 2] = 1; X[i * 2 + 1] = x[i]; }
        return { X: X, p: 2, x: x };
      },
      truth: function () { return 1; },
      draw: function (rnd, s, d, n, y) {
        var sg = Math.max(1e-6, 0.85 * s), i;
        var mu = Math.exp(sg * sg / 2), sd = Math.sqrt((Math.exp(sg * sg) - 1) * Math.exp(sg * sg));
        for (i = 0; i < n; i++) y[i] = d.x[i] + (Math.exp(sg * gaussian(rnd)) - mu) / sd;   // standardised lognormal
      }
    },
    heteroskedasticity: {
      title: 'Equal error variance', short: 'Equal variance',
      dialName: 'how much the spread grows with x', estimand: 'the slope',
      n: 60, sims: 2000, fit: 'ols', target: { kind: 'coef', j: 1 },
      dial: function (s) { return s === 0 ? 'spread constant' : 'widest spread about ' + Math.exp(1.1 * s * 4).toFixed(1) + 'x the narrowest'; },
      design: function (rnd, n) {
        var x = [], X = new Float64Array(n * 2), i;
        for (i = 0; i < n; i++) x.push(gaussian(rnd));
        x = zed(x);
        for (i = 0; i < n; i++) { X[i * 2] = 1; X[i * 2 + 1] = x[i]; }
        return { X: X, p: 2, x: x };
      },
      truth: function () { return 1; },
      draw: function (rnd, s, d, n, y) {
        var i, ss = 0, w = new Float64Array(n);
        for (i = 0; i < n; i++) { w[i] = Math.exp(1.1 * s * d.x[i]); ss += w[i] * w[i]; }
        var nz = Math.sqrt(ss / n);                          // average error variance stays 1
        for (i = 0; i < n; i++) y[i] = d.x[i] + (w[i] / nz) * gaussian(rnd);
      }
    },
    independence: {
      title: 'Independent observations', short: 'Independence',
      dialName: 'intraclass correlation', estimand: 'the group-level slope',
      n: 60, sims: 2000, fit: 'ols', target: { kind: 'coef', j: 1 },
      dial: function (s) { return 'ICC = ' + (0.6 * s).toFixed(2) + ', design effect ' + (1 + 4 * 0.6 * s).toFixed(1); },
      design: function (rnd, n) {
        var m = 5, k = Math.round(n / m), x = [], cl = [], j, i;
        for (j = 0; j < k; j++) { var xv = gaussian(rnd); for (i = 0; i < m; i++) { x.push(xv); cl.push(j); } }
        x = zed(x);
        var X = new Float64Array(n * 2);
        for (i = 0; i < n; i++) { X[i * 2] = 1; X[i * 2 + 1] = x[i]; }
        return { X: X, p: 2, x: x, cl: cl, k: k, m: m };
      },
      truth: function () { return 1; },
      draw: function (rnd, s, d, n, y) {
        var rho = 0.6 * s, i, uj = new Float64Array(d.k);
        for (i = 0; i < d.k; i++) uj[i] = gaussian(rnd);
        var a = Math.sqrt(rho), b = Math.sqrt(1 - rho);
        for (i = 0; i < n; i++) y[i] = d.x[i] + a * uj[d.cl[i]] + b * gaussian(rnd);
      }
    },
    autocorrelation: {
      title: 'Independent errors over time', short: 'Autocorrelation',
      dialName: 'AR(1) correlation between neighbouring errors', estimand: 'the trend slope',
      n: 60, sims: 2000, fit: 'ols', target: { kind: 'coef', j: 1 },
      dial: function (s) { return 'phi = ' + (0.92 * s).toFixed(2); },
      design: function (rnd, n) {
        var x = [], X = new Float64Array(n * 2), i;
        for (i = 0; i < n; i++) x.push(i);
        x = zed(x);
        for (i = 0; i < n; i++) { X[i * 2] = 1; X[i * 2 + 1] = x[i]; }
        return { X: X, p: 2, x: x };
      },
      truth: function () { return 1; },
      draw: function (rnd, s, d, n, y) {
        var phi = 0.92 * s, sd = Math.sqrt(1 - phi * phi), e = gaussian(rnd), i;
        for (i = 0; i < n; i++) {
          e = i === 0 ? e : phi * e + sd * gaussian(rnd);     // stationary AR(1), variance 1
          y[i] = d.x[i] + e;
        }
      }
    },
    multicollinearity: {
      title: 'Predictors that are not near-duplicates', short: 'Collinearity',
      dialName: 'correlation between the two predictors', estimand: 'the first coefficient',
      n: 60, sims: 2000, fit: 'ols', target: { kind: 'coef', j: 1 }, dynamicX: true,
      dial: function (s) { var r = 0.995 * s; return 'r = ' + r.toFixed(3) + ', VIF ' + (1 / (1 - r * r)).toFixed(1); },
      design: function (rnd, n) {
        var a = [], b = [], i;
        for (i = 0; i < n; i++) { a.push(gaussian(rnd)); b.push(gaussian(rnd)); }
        a = zed(a); b = zed(b);
        var cab = 0;                                          // orthogonalise so the dial is
        for (i = 0; i < n; i++) cab += a[i] * b[i];           // the only correlation in play
        cab /= (n - 1);
        for (i = 0; i < n; i++) b[i] -= cab * a[i];
        return { a: a, b: zed(b), p: 3 };
      },
      // the design matrix itself depends on severity here, so it is rebuilt per level
      buildX: function (s, d, n) {
        var r = 0.995 * s, X = new Float64Array(n * 3), i;
        for (i = 0; i < n; i++) {
          X[i * 3] = 1; X[i * 3 + 1] = d.a[i];
          X[i * 3 + 2] = r * d.a[i] + Math.sqrt(1 - r * r) * d.b[i];
        }
        return X;
      },
      truth: function () { return 1; },
      draw: function (rnd, s, d, n, y, X) {
        var esd = Math.sqrt(1 + 0.995 * s), i;                // holds R-squared still as r moves
        for (i = 0; i < n; i++) y[i] = X[i * 3 + 1] + X[i * 3 + 2] + esd * gaussian(rnd);
      }
    },
    linearity: {
      title: 'A straight line is the right shape', short: 'Linearity',
      dialName: 'share of the real signal that is curved',
      estimand: 'the mean outcome at the top of the x range',
      n: 60, sims: 2000, fit: 'ols',
      dial: function (s) { return s === 0 ? 'signal perfectly straight' : Math.round(100 * s) + '% of the signal is curvature'; },
      design: function (rnd, n) {
        var x = [], i;
        for (i = 0; i < n; i++) x.push(0.2 + 2 * rnd());
        var q = x.map(function (v) { return v * v; });
        var X = new Float64Array(n * 2);
        for (i = 0; i < n; i++) { X[i * 2] = 1; X[i * 2 + 1] = x[i]; }
        var d = { X: X, p: 2, x: x, q: q, zx: std(x), zq: std(q), top: 2.2 };
        d.target = { kind: 'pred', x0: [1, d.top] };
        return d;
      },
      truth: function (s, d) {
        return 2 * ((1 - s) * (d.top - d.zx.m) / d.zx.s + s * (d.top * d.top - d.zq.m) / d.zq.s);
      },
      draw: function (rnd, s, d, n, y) {
        var i;
        for (i = 0; i < n; i++) {
          var zx = (d.x[i] - d.zx.m) / d.zx.s, zq = (d.q[i] - d.zq.m) / d.zq.s;
          y[i] = 2 * ((1 - s) * zx + s * zq) + gaussian(rnd);
        }
      }
    },
    'proportional-hazards': {
      title: 'One hazard ratio for all of follow-up', short: 'Proportional hazards',
      dialName: 'how far the late-period hazard ratio drifts from the early one',
      estimand: 'the early-period log hazard ratio',
      n: 200, sims: 600, fit: 'cox',
      dial: function (s) { return 'early HR 0.50, late HR ' + (0.5 + 0.5 * s).toFixed(2); },
      design: function (rnd, n) {
        var z = new Float64Array(n), order = [], i;
        for (i = 0; i < n; i++) { z[i] = i < n / 2 ? 0 : 1; order.push(i); }
        return { z: z, order: order, cut: 0.5, adm: 2.0 };
      },
      truth: function () { return Math.log(0.5); },
      drawSurv: function (rnd, s, d, n, time, event) {
        var late = 0.5 + 0.5 * s, i;
        for (i = 0; i < n; i++) {
          var l1 = d.z[i] ? 0.5 : 1, l2 = d.z[i] ? late : 1;   // piecewise-constant hazards
          var E = -Math.log(1 - rnd()), t;
          t = (E < l1 * d.cut) ? E / l1 : d.cut + (E - l1 * d.cut) / l2;
          if (t > d.adm) { t = d.adm; event[i] = 0; } else event[i] = 1;
          time[i] = t;
        }
      }
    }
  };

  /* ---------------- one severity level, measured ---------------- */
  function measure(spec, s, n, sims, seed, keep, d) {
    var rnd = mulberry32(seed), truth = spec.truth(s, d);
    var hits = 0, fitSum = 0, widthSum = 0, cis = [], i;

    if (spec.fit === 'cox') {
      var time = new Float64Array(n), event = new Int8Array(n), risk = new Float64Array(n);
      var cSum = 0, cN = 0, j;
      for (i = 0; i < sims; i++) {
        spec.drawSurv(rnd, s, d, n, time, event);
        for (j = 0; j < n; j++) d.order[j] = j;
        var m = coxfit(time, event, d.z, d.order);
        var lo = m.beta - 1.959963985 * m.se, hi = m.beta + 1.959963985 * m.se, ok = lo < truth && truth < hi;
        if (ok) hits++;
        widthSum += hi - lo;
        if (i < keep) cis.push([lo, hi, ok, m.beta]);
        if (i < 25) {                                   // C is O(n^2): a subsample is enough
          for (j = 0; j < n; j++) risk[j] = m.beta * d.z[j];
          cSum += cindex(time, event, risk); cN++;
        }
      }
      return { cov: hits / sims, fit: cSum / cN, width: widthSum / sims, cis: cis, truth: truth };
    }

    var X = spec.buildX ? spec.buildX(s, d, n) : d.X;
    var fit = fitter(X, n, d.p, spec.target || d.target);
    var y = new Float64Array(n);
    for (i = 0; i < sims; i++) {
      spec.draw(rnd, s, d, n, y, X);
      var f = fit(y), ok2 = f.lo < truth && truth < f.hi;
      if (ok2) hits++;
      fitSum += f.r2; widthSum += f.hi - f.lo;
      if (i < keep) cis.push([f.lo, f.hi, ok2, f.est]);
    }
    return { cov: hits / sims, fit: fitSum / sims, width: widthSum / sims, cis: cis, truth: truth };
  }

  /* ---------------- mount ---------------- */
  function mount(el, cfg) {
    cfg = cfg || {};
    var list = (cfg.assumptions && cfg.assumptions.length ? cfg.assumptions : [cfg.assumption || 'heteroskedasticity'])
                 .filter(function (k) { return SPECS[k]; });
    if (!list.length) list = ['heteroskedasticity'];
    var which = list[0];
    var levels = Math.max(3, +cfg.levels || 11);
    var seed = (cfg.seed == null ? 17 : +cfg.seed);
    var bars = Math.max(8, Math.min(40, +cfg.bars || 30));
    var step = Math.max(0, Math.min(levels - 1, +cfg.start || 0));
    var cache = {};

    var P = palette(el);
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:' + P.panel + ';padding:16px 17px';
    el.innerHTML =
      (list.length > 1 ? '<div class="ad-seg" style="margin-bottom:12px"></div>' : '') +
      '<div class="ad-lab" style="font:600 12.5px/1.5 IBM Plex Sans,sans-serif;color:' + P.mut + ';margin-bottom:5px"></div>' +
      '<input class="ad-sev" type="range" min="0" max="' + (levels - 1) + '" step="1" value="' + step +
        '" aria-label="severity of the violation" style="width:100%;max-width:460px;display:block;margin-bottom:13px">' +
      '<div class="ad-plot"></div>' +
      '<div class="ad-read" style="font:13px/1.6 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:11px 0 14px"></div>' +
      '<div class="ad-r"></div>';

    var segBox = el.querySelector('.ad-seg'), plot = el.querySelector('.ad-plot'),
        read = el.querySelector('.ad-read'), lab = el.querySelector('.ad-lab'),
        slider = el.querySelector('.ad-sev'), rbox = el.querySelector('.ad-r');

    if (segBox) {
      segBox.innerHTML = u.seg(list.map(function (k) { return { v: k, label: SPECS[k].short }; }), which);
      u.wireSeg(segBox, function (v) { which = v; render(true); });
    }

    function series(key) {
      if (cache[key]) return cache[key];
      var spec = SPECS[key], n = Math.max(12, +cfg.n || spec.n), sims = Math.max(150, +cfg.sims || spec.sims);
      var d = spec.design(mulberry32(seed ^ 0x5f3759d), n), out = [], i;
      for (i = 0; i < levels; i++) out.push(measure(spec, i / (levels - 1), n, sims, seed + i * 101, bars, d));
      cache[key] = { rows: out, n: n, sims: sims, spec: spec };
      return cache[key];
    }

    function render(newR) {
      P = palette(el);
      el.style.background = P.panel; el.style.borderColor = P.line;
      lab.style.color = P.mut; read.style.color = P.body;
      var S = series(which), s = step / (levels - 1);
      lab.innerHTML = u.esc(S.spec.title) + ': <b style="color:' + P.ink + '">' + u.esc(S.spec.dial(s)) + '</b>';
      plot.innerHTML = svg(S, step, P, bars);
      read.innerHTML = verdict(which, S, step, P);
      if (newR || !rbox.firstChild) rbox.innerHTML = u.runnable(RCODE[which](), { label: 'Run the same experiment in R' });
    }

    slider.addEventListener('input', function () { step = +slider.value; render(false); });

    var wasDark = isDark(el);
    if (window.MutationObserver) {
      var mo = new MutationObserver(function () {
        if (!document.contains(el)) { mo.disconnect(); return; }
        var now = isDark(el);
        if (now !== wasDark) { wasDark = now; render(false); }
      });
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    }
    render(true);
  }

  /* ---------------- drawing ---------------- */
  function svg(S, step, P, bars) {
    var W = 520, mA = { l: 46, r: 16, t: 42 }, hA = 122;
    var yTop = mA.t, yBot = mA.t + hA, levels = S.rows.length;
    var fitName = S.spec.fit === 'cox' ? 'Concordance (C)' : 'R-squared';
    // a halo in the panel colour, thick enough that a plotted line under a label cannot
    // read as a strikethrough
    var HALO = 'stroke="' + P.panel + '" stroke-width="4.6" paint-order="stroke" stroke-linejoin="round"';
    function sx(i) { return mA.l + i / (levels - 1) * (W - mA.l - mA.r); }
    function sy(v) { return yBot - v * hA; }
    var g = '', i;

    [0, 0.25, 0.5, 0.75, 1].forEach(function (v) {
      g += '<line x1="' + mA.l + '" y1="' + sy(v).toFixed(1) + '" x2="' + (W - mA.r) + '" y2="' + sy(v).toFixed(1) + '" stroke="' + P.grid + '"/>' +
           '<text x="' + (mA.l - 7) + '" y="' + (sy(v) + 3).toFixed(1) + '" text-anchor="end" font-family="IBM Plex Mono,monospace" font-size="9" fill="' + P.mut + '">' + (v * 100) + '%</text>';
    });
    g += '<line x1="' + mA.l + '" y1="' + sy(0.95).toFixed(1) + '" x2="' + (W - mA.r) + '" y2="' + sy(0.95).toFixed(1) +
         '" stroke="' + P.acc + '" stroke-width="1" stroke-dasharray="3 3"/>';

    var cov = [], fit = [];
    for (i = 0; i < levels; i++) {
      cov.push(sx(i).toFixed(1) + ',' + sy(S.rows[i].cov).toFixed(1));
      fit.push(sx(i).toFixed(1) + ',' + sy(S.rows[i].fit).toFixed(1));
    }
    g += '<polyline points="' + fit.join(' ') + '" fill="none" stroke="' + P.c0 + '" stroke-width="2" stroke-dasharray="5 3"/>' +
         '<polyline points="' + cov.join(' ') + '" fill="none" stroke="' + P.bad + '" stroke-width="2.6"/>' +
         '<line x1="' + sx(step).toFixed(1) + '" y1="' + yTop + '" x2="' + sx(step).toFixed(1) + '" y2="' + yBot + '" stroke="' + P.line + '" stroke-dasharray="2 3"/>' +
         '<circle cx="' + sx(step).toFixed(1) + '" cy="' + sy(S.rows[step].fit).toFixed(1) + '" r="4" fill="' + P.c0 + '"/>' +
         '<circle cx="' + sx(step).toFixed(1) + '" cy="' + sy(S.rows[step].cov).toFixed(1) + '" r="5" fill="' + P.bad + '"/>';
    // side: away from whichever edge is closer. height: above the marker when there is room
    // under the legend, otherwise below it, so the label never sits on its own curve.
    var late = step > (levels - 1) * 0.62, yc = sy(S.rows[step].cov);
    var yLab = (yc - 12 >= yTop + 10) ? yc - 11 : yc + 19;
    g += '<text x="' + (late ? sx(step) - 9 : sx(step) + 9).toFixed(1) + '" y="' + yLab.toFixed(1) +
         '" text-anchor="' + (late ? 'end' : 'start') + '" font-family="IBM Plex Mono,monospace" font-size="12.5" font-weight="700" fill="' + P.bad + '" ' + HALO + '>' +
         (100 * S.rows[step].cov).toFixed(1) + '%</text>';
    // legend sits above the plot area, so no label can ever cross a curve
    g += '<text x="' + mA.l + '" y="16" font-family="IBM Plex Sans,sans-serif" font-size="10.5" font-weight="600" fill="' + P.bad + '">Interval coverage (promised 95%)</text>' +
         '<text x="' + (W - mA.r) + '" y="16" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10.5" font-weight="600" fill="' + P.c0 + '">' + fitName + '</text>' +
         '<text x="' + mA.l + '" y="32" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.faint + '">' +
         u.esc(S.sims.toLocaleString() + ' studies behind every point, n = ' + S.n) + '</text>' +
         '<line x1="' + mA.l + '" y1="' + yBot + '" x2="' + (W - mA.r) + '" y2="' + yBot + '" stroke="' + P.line + '" stroke-width="1.5"/>' +
         '<text x="' + mA.l + '" y="' + (yBot + 15) + '" font-family="IBM Plex Mono,monospace" font-size="9" fill="' + P.mut + '">none</text>' +
         '<text x="' + (W - mA.r) + '" y="' + (yBot + 15) + '" text-anchor="end" font-family="IBM Plex Mono,monospace" font-size="9" fill="' + P.mut + '">severe</text>' +
         '<text x="' + ((mA.l + W - mA.r) / 2) + '" y="' + (yBot + 15) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.mut + '">' +
         u.esc(S.spec.dialName) + '</text>';

    /* lower panel: the intervals themselves, one line per simulated study */
    var row = S.rows[step], cis = row.cis, truth = row.truth;
    var yB = yBot + 54, hB = Math.max(96, bars * 4.2), mB = { l: 46, r: 16 };
    var lows = [], highs = [];
    cis.forEach(function (c) { lows.push(c[0]); highs.push(c[1]); });
    lows.sort(function (a, b) { return a - b; }); highs.sort(function (a, b) { return a - b; });
    // clip at the 8th/92nd percentile of the endpoints so one wild interval cannot squash
    // the rest; anything past the edge gets an arrowhead instead of a bar end
    var lo = Math.min(lows[Math.floor(lows.length * 0.08)], truth);
    var hi = Math.max(highs[Math.floor(highs.length * 0.92)], truth);
    var pad = (hi - lo) * 0.12 || 1; lo -= pad; hi += pad;
    function bx(v) { return mB.l + (Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo) * (W - mB.l - mB.r); }
    g += '<text x="' + mB.l + '" y="' + (yB - 13) + '" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.ink + '">' +
         cis.length + ' of those studies: the 95% interval for ' + u.esc(S.spec.estimand) + '</text>';
    var miss = 0;
    cis.forEach(function (c, k) {
      var yy = yB + 6 + k * ((hB - 12) / Math.max(1, cis.length - 1));
      var col = c[2] ? P.mut : P.bad;
      if (!c[2]) miss++;
      g += '<line x1="' + bx(c[0]).toFixed(1) + '" y1="' + yy.toFixed(1) + '" x2="' + bx(c[1]).toFixed(1) + '" y2="' + yy.toFixed(1) +
           '" stroke="' + col + '" stroke-width="' + (c[2] ? 1.6 : 2.6) + '" stroke-opacity="' + (c[2] ? 0.55 : 1) + '" stroke-linecap="round"/>';
      if (c[0] < lo) g += '<path d="M' + (mB.l + 1) + ',' + (yy - 3).toFixed(1) + ' L' + (mB.l - 4) + ',' + yy.toFixed(1) + ' L' + (mB.l + 1) + ',' + (yy + 3).toFixed(1) + 'Z" fill="' + col + '"/>';
      if (c[1] > hi) g += '<path d="M' + (W - mB.r - 1) + ',' + (yy - 3).toFixed(1) + ' L' + (W - mB.r + 4) + ',' + yy.toFixed(1) + ' L' + (W - mB.r - 1) + ',' + (yy + 3).toFixed(1) + 'Z" fill="' + col + '"/>';
    });
    g += '<line x1="' + bx(truth).toFixed(1) + '" y1="' + yB + '" x2="' + bx(truth).toFixed(1) + '" y2="' + (yB + hB) + '" stroke="' + P.acc + '" stroke-width="1.6"/>' +
         '<text x="' + bx(truth).toFixed(1) + '" y="' + (yB + hB + 15) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.acc + '" ' + HALO + '>true value</text>' +
         '<text x="' + (W - mB.r) + '" y="' + (yB - 13) + '" text-anchor="end" font-family="IBM Plex Mono,monospace" font-size="10.5" fill="' + (miss ? P.bad : P.mut) + '">' +
         miss + ' of ' + cis.length + ' miss</text>';
    var H = yB + hB + 24;
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" ' +
      'aria-label="Interval coverage and model fit against the severity of an assumption violation, with individual study intervals below">' + g + '</svg>';
  }

  /* ---------------- the sentence under the picture ---------------- */
  function verdict(key, S, step, P) {
    var a = S.rows[0], b = S.rows[step];
    var pc = function (v) { return (100 * v).toFixed(1) + '%'; };
    var covTx = '<b style="color:' + (b.cov < 0.9 ? P.bad : P.acc) + '">' + pc(b.cov) + '</b>';
    var fitName = S.spec.fit === 'cox' ? 'Concordance' : 'R-squared';
    var fitTx = '<b style="color:' + P.c0 + '">' + b.fit.toFixed(3) + '</b>';
    if (step === 0) {
      return 'With the assumption satisfied, ' + covTx + ' of the 95% intervals contain the true value, which is what 95% is supposed to mean. ' +
        fitName + ' is ' + fitTx + '. Drag the dial and watch which of those two numbers moves.';
    }
    var common = 'Coverage is now ' + covTx + ' against the 95% it promises. ' + fitName + ' went from ' + a.fit.toFixed(3) + ' to ' + fitTx + '. ';
    var tooNarrow = understate(b.cov).toFixed(1);
    if (key === 'multicollinearity') {
      return 'Coverage is ' + covTx + '. It has not moved and it will not: collinearity biases nothing. What moved is the WIDTH, now <b>' +
        (b.width / a.width).toFixed(1) + 'x</b> what it was with uncorrelated predictors. The interval is telling the truth about how little this data can separate two variables that carry the same information. ' +
        'A wide honest interval is a result to report, not a violation to fix.';
    }
    if (key === 'normality') {
      return common + 'This is the mildest of the seven. An estimate is an average of many draws, and averages are close to normal whatever the draws look like, ' +
        'so the interval survives an error distribution that looks nothing like a bell. Non-normal residuals are a reason to look for outliers and for the wrong functional form. On their own they are not a reason to distrust the interval.';
    }
    if (key === 'linearity') {
      return common + 'The line still summarises the cloud, which is why the fit statistic stays calm. It is the PREDICTION at the top of the range that is wrong, ' +
        'and no standard error repairs that: the model is estimating the wrong quantity, not estimating the right one badly.';
    }
    if (key === 'proportional-hazards') {
      return common + 'The model still ranks patients well, so nothing in the fit complains. But one hazard ratio is being asked to describe an effect that changes over follow-up, ' +
        'so the interval quoted for the early period misses it ' + pc(1 - b.cov) + ' of the time. Split the follow-up, or model the interaction with time, and quote both periods.';
    }
    if (key === 'independence') {
      return common + 'Every row is being counted as fresh information when rows inside a group are partly the same information. The intervals are about <b>' + tooNarrow +
        'x too narrow</b>. This is the one an ordinary robust standard error does not repair, because it also assumes independent observations.';
    }
    if (key === 'autocorrelation') {
      return common + 'Neighbouring errors move together, so 60 observations carry far less than 60 observations worth of information. The intervals are about <b>' + tooNarrow +
        'x too narrow</b>, and note that the fit statistic went UP: a smooth error series flatters R-squared at the same time as it destroys the interval.';
    }
    return common + 'The estimate is roughly right and the interval around it is about <b>' + tooNarrow + 'x too narrow</b>. ' +
      'That is a standard-error problem, not a model problem: the fit is fine and the uncertainty statement is not.';
  }

  /* ---------------- runnable R, one per assumption ----------------
     Each block reproduces the widget's own experiment: same generative model, same
     estimand, same 95% interval, coverage counted the same way. Base R only. */
  function head(txt) {
    return ['# ' + txt, '# sev runs 0 (assumption holds) to 1 (severe). Change it and run again.', 'set.seed(11)'];
  }
  var RCODE = {
    normality: function () {
      return head('Skewed errors. Does the 95% interval for the slope still cover the truth?').concat([
        'n <- 30; sims <- 2000; sev <- 1',
        'x  <- as.numeric(scale(rnorm(n)))',
        'sg <- max(1e-6, 0.85 * sev)',
        'mu <- exp(sg^2 / 2); sdl <- sqrt((exp(sg^2) - 1) * exp(sg^2))',
        '',
        'one <- function() {',
        '  e  <- (exp(sg * rnorm(n)) - mu) / sdl      # standardised lognormal: mean 0, sd 1',
        '  y  <- x + e',
        '  m  <- lm(y ~ x)',
        '  ci <- confint(m)["x", ]',
        '  c(covered = ci[1] < 1 && 1 < ci[2], r2 = summary(m)$r.squared)',
        '}',
        'res <- t(replicate(sims, one()))',
        'round(c(coverage = mean(res[, "covered"]), r_squared = mean(res[, "r2"])), 3)'
      ]).join('\n');
    },
    heteroskedasticity: function () {
      return head('Error spread that grows with x. The fit is fine; the interval is not.').concat([
        'n <- 60; sims <- 2000; sev <- 1',
        'x <- as.numeric(scale(rnorm(n)))',
        'w <- exp(1.1 * sev * x); w <- w / sqrt(mean(w^2))   # average error variance stays 1',
        '',
        'one <- function() {',
        '  y  <- x + rnorm(n, sd = w)',
        '  m  <- lm(y ~ x)',
        '  ci <- confint(m)["x", ]',
        '  c(covered = ci[1] < 1 && 1 < ci[2], r2 = summary(m)$r.squared)',
        '}',
        'res <- t(replicate(sims, one()))',
        'round(c(coverage = mean(res[, "covered"]), r_squared = mean(res[, "r2"])), 3)'
      ]).join('\n');
    },
    independence: function () {
      return head('Observations clustered in groups. Coverage falls; R-squared does not.').concat([
        'n <- 60; m <- 5; k <- n / m; sims <- 2000; sev <- 1',
        'rho <- 0.6 * sev                        # intraclass correlation',
        'cl  <- rep(1:k, each = m)',
        'x   <- as.numeric(scale(rep(rnorm(k), each = m)))   # the predictor varies BETWEEN groups',
        '',
        'one <- function() {',
        '  y  <- x + sqrt(rho) * rnorm(k)[cl] + sqrt(1 - rho) * rnorm(n)',
        '  fm <- lm(y ~ x)',
        '  ci <- confint(fm)["x", ]',
        '  c(covered = ci[1] < 1 && 1 < ci[2], r2 = summary(fm)$r.squared)',
        '}',
        'res <- t(replicate(sims, one()))',
        'round(c(coverage = mean(res[, "covered"]), r_squared = mean(res[, "r2"])), 3)',
        'round(1 + (m - 1) * rho, 2)             # design effect: the factor the variance is out by'
      ]).join('\n');
    },
    autocorrelation: function () {
      return head('Errors correlated with their own past, fitted against a trend.').concat([
        'n <- 60; sims <- 2000; sev <- 1',
        'phi <- 0.92 * sev',
        'x   <- as.numeric(scale(seq_len(n)))',
        '',
        'one <- function() {',
        '  e  <- as.numeric(arima.sim(list(ar = phi), n = n, sd = sqrt(1 - phi^2)))',
        '  y  <- x + e',
        '  m  <- lm(y ~ x)',
        '  ci <- confint(m)["x", ]',
        '  c(covered = ci[1] < 1 && 1 < ci[2], r2 = summary(m)$r.squared)',
        '}',
        'res <- t(replicate(sims, one()))',
        'round(c(coverage = mean(res[, "covered"]), r_squared = mean(res[, "r2"])), 3)'
      ]).join('\n');
    },
    multicollinearity: function () {
      return head('Two near-duplicate predictors. Watch the width, not the coverage.').concat([
        'n <- 60; sims <- 2000; sev <- 1',
        'r  <- 0.995 * sev',
        'a  <- as.numeric(scale(rnorm(n))); b <- as.numeric(scale(rnorm(n)))',
        'b  <- as.numeric(scale(residuals(lm(b ~ a))))       # make b independent of a',
        'x1 <- a; x2 <- r * a + sqrt(1 - r^2) * b',
        '',
        'one <- function() {',
        '  y  <- x1 + x2 + rnorm(n, sd = sqrt(1 + r))        # holds R-squared still as r moves',
        '  m  <- lm(y ~ x1 + x2)',
        '  ci <- confint(m)["x1", ]',
        '  c(covered = ci[1] < 1 && 1 < ci[2], width = unname(ci[2] - ci[1]), r2 = summary(m)$r.squared)',
        '}',
        'res <- t(replicate(sims, one()))',
        'round(c(coverage   = mean(res[, "covered"]),',
        '        mean_width = mean(res[, "width"]),',
        '        r_squared  = mean(res[, "r2"])), 3)'
      ]).join('\n');
    },
    linearity: function () {
      return head('A curved truth fitted with a straight line. The prediction at the top is the casualty.').concat([
        'n <- 60; sims <- 2000; sev <- 1',
        'x   <- 0.2 + 2 * runif(n); q <- x^2',
        'zx  <- as.numeric(scale(x)); zq <- as.numeric(scale(q))',
        'top <- 2.2',
        'truth <- 2 * ((1 - sev) * (top - mean(x)) / sd(x) +',
        '                    sev  * (top^2 - mean(q)) / sd(q))',
        '',
        'one <- function() {',
        '  y  <- 2 * ((1 - sev) * zx + sev * zq) + rnorm(n)',
        '  m  <- lm(y ~ x)',
        '  ci <- predict(m, data.frame(x = top), interval = "confidence")',
        '  c(covered = ci[1, "lwr"] < truth && truth < ci[1, "upr"], r2 = summary(m)$r.squared)',
        '}',
        'res <- t(replicate(sims, one()))',
        'round(c(coverage = mean(res[, "covered"]), r_squared = mean(res[, "r2"])), 3)'
      ]).join('\n');
    },
    'proportional-hazards': function () {
      return head('A hazard ratio that changes halfway through follow-up.').concat([
        'library(survival)',
        'n <- 200; sims <- 400; sev <- 1',
        'z    <- rep(0:1, each = n / 2)',
        'cut  <- 0.5; adm <- 2.0',
        'late <- 0.5 + 0.5 * sev                 # the early HR stays 0.50 throughout',
        '',
        'one <- function() {',
        '  l1 <- ifelse(z == 1, 0.5, 1); l2 <- ifelse(z == 1, late, 1)',
        '  E  <- rexp(n)',
        '  tt <- ifelse(E < l1 * cut, E / l1, cut + (E - l1 * cut) / l2)',
        '  d  <- as.integer(tt <= adm); tt <- pmin(tt, adm)',
        '  m  <- coxph(Surv(tt, d) ~ z)',
        '  ci <- confint(m)',
        '  c(covered = ci[1] < log(0.5) && log(0.5) < ci[2],',
        '    conc    = unname(summary(m)$concordance[1]))',
        '}',
        'res <- t(replicate(sims, one()))',
        'round(c(coverage = mean(res[, "covered"]), concordance = mean(res[, "conc"])), 3)'
      ]).join('\n');
    }
  };

  window.LessonWidgets.register('assumption-dial', mount);
})();
