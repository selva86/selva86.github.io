/* prediction-interval-math.js - simple linear regression with BOTH intervals
   at a new x0, for tools/prediction-interval-calculator.html.

   Ground truth: R 4.6.0 stats::lm + stats::predict.lm with
   interval="prediction" and interval="confidence"
   (see Scripts/tool-truth/prediction-interval-calculator.json).

   The whole point of the tool is one contrast, so it is worth stating the
   math here once:

     yhat(x0) = b0 + b1*x0                       <- SAME centre for both
     seFit    = s * sqrt(     1/n + (x0-xbar)^2/Sxx)   <- mean response
     sePred   = s * sqrt( 1 + 1/n + (x0-xbar)^2/Sxx)   <- one new observation
     interval = yhat +/- qt(1-(1-level)/2, n-2) * se

   The lone extra "1" under the prediction root is the variance of the new
   point's own noise term (sigma^2). It does not shrink as n grows, which is
   why the PI stays wide forever while the CI collapses toward the line.

   No new distribution primitives: qt comes from TTestMath.tQuantile (exact
   bisection on the exact t CDF, already verified for the t-test / CI tools).

   Browser: window.PIMath (needs window.TTestMath, and window.DataParse for
            parseXY).
   Node:    require('./prediction-interval-math.js') */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./ttest-math.js'), require('./data-parse.js'));
  } else {
    root.PIMath = factory(root.TTestMath, root.DataParse);
  }
}(typeof self !== 'undefined' ? self : this, function (T, DP) {
  'use strict';

  var EPS = 1e-12;

  // ---- fit y ~ x by least squares -------------------------------------------
  // Returns null-free diagnostics; callers must check .ok first.
  function fit(x, y) {
    var n = x.length, i;
    if (!n || y.length !== n) return { ok: false, reason: 'length' };
    if (n < 3) return { ok: false, reason: 'n', n: n };

    var sx = 0, sy = 0;
    for (i = 0; i < n; i++) { sx += x[i]; sy += y[i]; }
    var xbar = sx / n, ybar = sy / n;

    var sxx = 0, syy = 0, sxy = 0, dx, dy;
    for (i = 0; i < n; i++) {
      dx = x[i] - xbar; dy = y[i] - ybar;
      sxx += dx * dx; syy += dy * dy; sxy += dx * dy;
    }
    // Every x identical -> the slope is not identified; no line, no intervals.
    if (sxx <= EPS * Math.max(1, Math.abs(xbar) * Math.abs(xbar) * n)) {
      return { ok: false, reason: 'sxx', n: n };
    }

    var b1 = sxy / sxx;
    var b0 = ybar - b1 * xbar;

    var sse = 0, resid = [], e;
    for (i = 0; i < n; i++) {
      e = y[i] - (b0 + b1 * x[i]);
      resid.push(e);
      sse += e * e;
    }
    var df = n - 2;
    var mse = sse / df;
    // Guard the perfect-fit case: -0 or a whisper of negative from rounding.
    var sigma = Math.sqrt(Math.max(0, mse));

    var seB1 = sigma / Math.sqrt(sxx);
    var seB0 = sigma * Math.sqrt(1 / n + (xbar * xbar) / sxx);
    var tB1 = seB1 > 0 ? b1 / seB1 : (b1 === 0 ? 0 : Infinity);
    var pB1 = isFinite(tB1) ? T.pTwoTailed(tB1, df) : 0;

    var ssr = syy - sse;
    var r2 = syy > EPS ? Math.max(0, Math.min(1, ssr / syy)) : 1;
    var adjr2 = 1 - (1 - r2) * (n - 1) / df;

    return {
      ok: true, n: n, b0: b0, b1: b1, sigma: sigma, df: df, mse: mse,
      xbar: xbar, ybar: ybar, sxx: sxx, syy: syy, sxy: sxy, sse: sse, ssr: ssr,
      seB0: seB0, seB1: seB1, tB1: tB1, pB1: pB1, r2: r2, adjr2: adjr2,
      resid: resid, xmin: Math.min.apply(null, x), xmax: Math.max.apply(null, x),
      x: x, y: y
    };
  }

  // ---- both intervals at one x0 ---------------------------------------------
  // Mirrors predict.lm(newdata, interval="prediction"|"confidence", level=).
  function predictAt(f, x0, level) {
    var d = x0 - f.xbar;
    var leverage = 1 / f.n + (d * d) / f.sxx;   // h00, the shared distance term
    var seFit = f.sigma * Math.sqrt(leverage);        // mean response
    var sePred = f.sigma * Math.sqrt(1 + leverage);   // + one new point's noise
    var tcrit = T.tQuantile(1 - (1 - level) / 2, f.df);
    var yhat = f.b0 + f.b1 * x0;
    return {
      x0: x0, level: level, fit: yhat, tcrit: tcrit,
      leverage: leverage, seFit: seFit, sePred: sePred,
      ci: { lo: yhat - tcrit * seFit, hi: yhat + tcrit * seFit,
            width: 2 * tcrit * seFit, margin: tcrit * seFit },
      pi: { lo: yhat - tcrit * sePred, hi: yhat + tcrit * sePred,
            width: 2 * tcrit * sePred, margin: tcrit * sePred },
      // How many times wider the PI is. The headline number of the tool.
      ratio: seFit > 0 ? sePred / seFit : Infinity,
      extrapolating: x0 < f.xmin || x0 > f.xmax
    };
  }

  // ---- band vertices for the plot ------------------------------------------
  // m evenly spaced x across [lo,hi]; both bands at each vertex.
  function band(f, lo, hi, level, m) {
    var pts = [], i, x0, p;
    m = m || 80;
    for (i = 0; i <= m; i++) {
      x0 = lo + (hi - lo) * (i / m);
      p = predictAt(f, x0, level);
      pts.push({ x: x0, fit: p.fit, ciLo: p.ci.lo, ciHi: p.ci.hi,
                 piLo: p.pi.lo, piHi: p.pi.hi });
    }
    return pts;
  }

  // ---- paste -> (x,y) pairs -------------------------------------------------
  // Tolerates headers, tabs/commas/semicolons/spaces, blank lines, and NA.
  // Rows where either column is missing or non-numeric are dropped and counted,
  // so the page can say exactly what it ignored instead of failing silently.
  function parseXY(text) {
    var empty = { ok: false, reason: 'empty', x: [], y: [], n: 0, dropped: 0 };
    if (!DP) return empty;
    var r = DP.parseMatrix(text);
    if (r.mode === 'empty') return empty;
    if (r.mode !== 'matrix' || r.ncol < 2) {
      return { ok: false, reason: 'onecol', x: [], y: [], n: 0, dropped: 0,
               nrow: r.nrow || 0 };
    }
    var x = [], y = [], dropped = 0, i, a, b;
    for (i = 0; i < r.matrix.length; i++) {
      a = r.matrix[i][0]; b = r.matrix[i][1];
      if (a === null || b === null || !isFinite(a) || !isFinite(b)) { dropped++; continue; }
      x.push(a); y.push(b);
    }
    if (!x.length) return { ok: false, reason: 'nonumeric', x: [], y: [], n: 0, dropped: dropped };
    return {
      ok: true, x: x, y: y, n: x.length, dropped: dropped,
      names: r.names, header: !!r.header,
      extraCols: r.ncol > 2 ? r.ncol - 2 : 0
    };
  }

  // ---- one-call convenience for the page ------------------------------------
  function analyse(x, y, x0, level) {
    var f = fit(x, y);
    if (!f.ok) return { ok: false, fit: f };
    return { ok: true, fit: f, at: predictAt(f, x0, level) };
  }

  return {
    version: '1.0.0',
    fit: fit,
    predictAt: predictAt,
    band: band,
    parseXY: parseXY,
    analyse: analyse
  };
}));
