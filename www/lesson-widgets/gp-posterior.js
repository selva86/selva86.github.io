/* gp-posterior.js - a Gaussian process for regression, made visible. Six training points,
 * a posterior mean curve, and a shaded 95% band that pinches tight where data lives and
 * flares wide where it does not - the GP's honest "I don't know here". Toggle the lengthscale
 * to feel the bias-variance dial: short = wiggly and local, long = smooth and stiff. Emits
 * runnable base-R computing the exact posterior mean and sd from the RBF kernel.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  // training data: matches the runnable R (sin(x) + seed(1) noise, hardcoded so the picture is exact)
  var XTR = [-4, -3, -1, 0, 2, 3];
  var YTR = [0.820, -0.123, -0.925, 0.160, 0.942, 0.059];

  function rbf(a, b, l) { var d = a - b; return Math.exp(-d * d / (2 * l * l)); }

  // invert an n x n matrix via Gauss-Jordan (n = 6 here, tiny)
  function inv(M) {
    var n = M.length, A = M.map(function (r, i) { return r.concat(Array.from({ length: n }, function (_, j) { return i === j ? 1 : 0; })); });
    for (var c = 0; c < n; c++) {
      var piv = A[c][c];
      for (var j = 0; j < 2 * n; j++) A[c][j] /= piv;
      for (var r = 0; r < n; r++) { if (r === c) continue; var f = A[r][c]; for (var k = 0; k < 2 * n; k++) A[r][k] -= f * A[c][k]; }
    }
    return A.map(function (row) { return row.slice(n); });
  }
  function matvec(M, v) { return M.map(function (row) { return row.reduce(function (s, x, i) { return s + x * v[i]; }, 0); }); }

  function posterior(l, sig) {
    var n = XTR.length, K = [];
    for (var i = 0; i < n; i++) { K.push([]); for (var j = 0; j < n; j++) K[i].push(rbf(XTR[i], XTR[j], l) + (i === j ? sig * sig : 0)); }
    var Ki = inv(K), alpha = matvec(Ki, YTR);
    return function (xs) {
      var ks = XTR.map(function (xt) { return rbf(xs, xt, l); });
      var mean = ks.reduce(function (s, kv, i) { return s + kv * alpha[i]; }, 0);
      var Kiks = matvec(Ki, ks);
      var v = 1 - ks.reduce(function (s, kv, i) { return s + kv * Kiks[i]; }, 0);
      return { m: mean, sd: Math.sqrt(Math.max(v, 1e-9)) };
    };
  }

  function mount(el, cfg) {
    cfg = cfg || {}; var l = 1.0, sig = 0.1;
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="gp-seg" style="margin-bottom:12px">' + u.seg([{ v: '0.5', label: 'Short' }, { v: '1', label: 'Medium' }, { v: '2', label: 'Long' }], '1') + '</div>' +
      '<div class="gp-plot"></div>' +
      '<div class="gp-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'The exact GP posterior mean and sd, from the RBF kernel in base R' });

    var plot = el.querySelector('.gp-plot'), read = el.querySelector('.gp-read');
    var W = 340, H = 240, RX = [-5.4, 5.4], RY = [-2.2, 2.2];
    function px(x) { return (x - RX[0]) / (RX[1] - RX[0]) * W; }
    function py(y) { return H - (y - RY[0]) / (RY[1] - RY[0]) * H; }
    function draw() {
      var f = posterior(l, sig), N = 80, top = [], bot = [], mid = [];
      for (var i = 0; i <= N; i++) { var x = RX[0] + (RX[1] - RX[0]) * i / N, r = f(x); top.push([px(x), py(r.m + 1.96 * r.sd)]); bot.push([px(x), py(r.m - 1.96 * r.sd)]); mid.push([px(x), py(r.m)]); }
      var band = 'M' + top.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' L') + ' L' + bot.slice().reverse().map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' L') + ' Z';
      var line = 'M' + mid.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' L');
      var dots = XTR.map(function (xt, i) { return '<circle cx="' + px(xt).toFixed(1) + '" cy="' + py(YTR[i]).toFixed(1) + '" r="4.5" fill="' + P.ink + '"/>'; }).join('');
      // sd at a data-rich point vs a data-poor edge, for the reading
      var sdNear = f(-3).sd, sdFar = f(5).sd;
      plot.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block;border:1px solid ' + P.line + ';border-radius:8px" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Gaussian process posterior">' +
        '<path d="' + band + '" fill="' + P.acc + '" opacity="0.15"/>' +
        '<path d="' + line + '" fill="none" stroke="' + P.acc + '" stroke-width="2.2"/>' + dots + '</svg>';
      read.innerHTML = 'Lengthscale <b style="font-family:IBM Plex Mono,monospace">' + l.toFixed(1) + '</b>: the band is tight near the points (sd &asymp; <b>' + sdNear.toFixed(2) + '</b>) and flares out where there is no data (sd &asymp; <b>' + sdFar.toFixed(2) + '</b>). ' + (l < 0.7 ? 'Short lengthscale &rarr; the mean wiggles and forgets fast between points.' : l > 1.5 ? 'Long lengthscale &rarr; a smooth, stiff mean that may miss local bumps.' : 'A medium lengthscale balances the two.');
    }
    u.wireSeg(el.querySelector('.gp-seg'), function (v) { l = parseFloat(v); draw(); });
    draw();
  }

  function rcode() {
    return [
      '# A Gaussian process posterior, from scratch: mean + uncertainty, no packages.',
      'xtr <- c(-4, -3, -1, 0, 2, 3)',
      'set.seed(1); ytr <- sin(xtr) + rnorm(6, 0, 0.1)   # noisy observations',
      'rbf <- function(a, b, l) exp(-outer(a, b, "-")^2 / (2 * l^2))',
      'l <- 1.0; sig <- 0.1                              # lengthscale, noise sd',
      'K   <- rbf(xtr, xtr, l) + sig^2 * diag(length(xtr))',
      'xte <- seq(-5, 5, length.out = 6)',
      'Ks  <- rbf(xte, xtr, l); Kss <- rbf(xte, xte, l)',
      'mu  <- as.numeric(Ks %*% solve(K, ytr))          # posterior mean',
      'sd  <- sqrt(pmax(diag(Kss - Ks %*% solve(K, t(Ks))), 0))  # predictive sd',
      'round(data.frame(x = xte, mean = mu, sd = sd), 2)',
      '# sd is small next to a training point and grows out at the edges (-5, 5):',
      '# that widening band is the GP telling you where it has no evidence.'
    ].join('\n');
  }

  window.LessonWidgets.register('gp-posterior', mount);
})();
