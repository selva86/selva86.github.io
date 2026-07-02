/* bayesopt-acq.js - Bayesian optimization, one step at a time. A cheap GP surrogate stands
 * in for an expensive black-box objective; the acquisition function (Expected Improvement)
 * scores where to look next, trading off "high predicted value" against "high uncertainty".
 * Press Next sample to run one BO step: EI picks the next x, the objective is evaluated there,
 * the surrogate updates. Watch it lock onto the global peak in a few evaluations, then probe
 * the runner-up. Emits the same EI loop as runnable base R.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  function f(x) { return 1.5 * Math.exp(-(x - 6) * (x - 6) / 1.5) + Math.exp(-(x - 2.5) * (x - 2.5) / 0.8); }
  function rbf(a, b, l) { var d = a - b; return Math.exp(-d * d / (2 * l * l)); }
  function pnorm(z) {
    var b1 = 0.319381530, b2 = -0.356563782, b3 = 1.781477937, b4 = -1.821255978, b5 = 1.330274429, p = 0.2316419, c = 0.39894228;
    var t = 1 / (1 + p * Math.abs(z)), y = 1 - c * Math.exp(-z * z / 2) * t * (b1 + t * (b2 + t * (b3 + t * (b4 + t * b5))));
    return z >= 0 ? y : 1 - y;
  }
  function dnorm(z) { return 0.39894228 * Math.exp(-z * z / 2); }
  function inv(M) {
    var n = M.length, A = M.map(function (r, i) { return r.concat(Array.from({ length: n }, function (_, j) { return i === j ? 1 : 0; })); });
    for (var c = 0; c < n; c++) { var pv = A[c][c]; for (var j = 0; j < 2 * n; j++) A[c][j] /= pv; for (var r = 0; r < n; r++) { if (r === c) continue; var fct = A[r][c]; for (var k = 0; k < 2 * n; k++) A[r][k] -= fct * A[c][k]; } }
    return A.map(function (row) { return row.slice(n); });
  }
  function matvec(M, v) { return M.map(function (row) { return row.reduce(function (s, x, i) { return s + x * v[i]; }, 0); }); }

  var L = 0.9, S0 = 1e-4, GRID = (function () { var g = []; for (var i = 0; i < 100; i++) g.push(8 * i / 99); return g; })();

  function surrogate(X, Y) {
    var n = X.length, K = [];
    for (var i = 0; i < n; i++) { K.push([]); for (var j = 0; j < n; j++) K[i].push(rbf(X[i], X[j], L) + (i === j ? S0 : 0)); }
    var Ki = inv(K), alpha = matvec(Ki, Y), best = Math.max.apply(null, Y);
    return GRID.map(function (xg) {
      var ks = X.map(function (xt) { return rbf(xg, xt, L); });
      var m = ks.reduce(function (s, kv, i) { return s + kv * alpha[i]; }, 0);
      var Kiks = matvec(Ki, ks), v = 1 - ks.reduce(function (s, kv, i) { return s + kv * Kiks[i]; }, 0), sd = Math.sqrt(Math.max(v, 1e-9));
      var z = (m - best) / sd, ei = (m - best) * pnorm(z) + sd * dnorm(z);
      return { x: xg, m: m, sd: sd, ei: Math.max(ei, 0) };
    });
  }

  function mount(el, cfg) {
    cfg = cfg || {};
    var X, Y;
    function reset() { X = [1, 4, 7.5]; Y = X.map(f); }
    reset();
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div style="display:flex;gap:8px;margin-bottom:12px">' +
        '<button class="bo-next" style="font:600 13px IBM Plex Sans,sans-serif;color:#fff;background:' + P.ink + ';border:0;border-radius:8px;padding:7px 15px;cursor:pointer">Next sample &rarr;</button>' +
        '<button class="bo-reset" style="font:600 13px IBM Plex Sans,sans-serif;color:' + P.mut + ';background:none;border:1px solid ' + P.line + ';border-radius:8px;padding:7px 13px;cursor:pointer">Reset</button>' +
      '</div>' +
      '<div class="bo-plot"></div>' +
      '<div class="bo-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'The same Expected-Improvement loop in base R' });

    var plot = el.querySelector('.bo-plot'), read = el.querySelector('.bo-read');
    var W = 340, Ht = 170, Ha = 70, RX = [0, 8], RYo = [-0.2, 1.8];
    function px(x) { return (x - RX[0]) / (RX[1] - RX[0]) * W; }
    function pyo(y) { return Ht - (y - RYo[0]) / (RYo[1] - RYo[0]) * Ht; }
    function draw(nextX) {
      var post = surrogate(X, Y);
      var maxEI = Math.max.apply(null, post.map(function (p) { return p.ei; })), argEI = post.reduce(function (a, b) { return b.ei > a.ei ? b : a; }).x;
      // objective panel: true curve (dashed), GP mean + band, samples
      var truePts = GRID.map(function (x) { return px(x).toFixed(1) + ',' + pyo(f(x)).toFixed(1); });
      var meanPts = post.map(function (p) { return px(p.x).toFixed(1) + ',' + pyo(p.m).toFixed(1); });
      var top = post.map(function (p) { return [px(p.x), pyo(p.m + 1.96 * p.sd)]; }), bot = post.map(function (p) { return [px(p.x), pyo(p.m - 1.96 * p.sd)]; });
      var band = 'M' + top.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' L') + ' L' + bot.reverse().map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' L') + ' Z';
      var dots = X.map(function (xt, i) { return '<circle cx="' + px(xt).toFixed(1) + '" cy="' + pyo(Y[i]).toFixed(1) + '" r="4" fill="' + P.ink + '"/>'; }).join('');
      var objSvg = '<svg viewBox="0 0 ' + W + ' ' + Ht + '" width="100%" style="max-width:' + W + 'px;display:block;border:1px solid ' + P.line + ';border-radius:8px 8px 0 0;border-bottom:0" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="objective and GP surrogate">' +
        '<path d="' + band + '" fill="' + P.acc + '" opacity="0.13"/>' +
        '<polyline points="' + truePts.join(' ') + '" fill="none" stroke="' + P.mut + '" stroke-width="1.3" stroke-dasharray="4 3"/>' +
        '<polyline points="' + meanPts.join(' ') + '" fill="none" stroke="' + P.acc + '" stroke-width="2"/>' + dots +
        (nextX != null ? '<line x1="' + px(nextX).toFixed(1) + '" y1="0" x2="' + px(nextX).toFixed(1) + '" y2="' + Ht + '" stroke="' + P.c0 + '" stroke-width="1.5" stroke-dasharray="3 2"/>' : '') + '</svg>';
      // acquisition panel: EI curve, argmax marked
      var eiPts = post.map(function (p) { return px(p.x).toFixed(1) + ',' + (Ha - p.ei / (maxEI || 1) * (Ha - 8)).toFixed(1); });
      var acqSvg = '<svg viewBox="0 0 ' + W + ' ' + Ha + '" width="100%" style="max-width:' + W + 'px;display:block;border:1px solid ' + P.line + ';border-radius:0 0 8px 8px" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="expected improvement">' +
        '<polyline points="' + eiPts.join(' ') + '" fill="none" stroke="' + P.c0 + '" stroke-width="1.8"/>' +
        '<line x1="' + px(argEI).toFixed(1) + '" y1="0" x2="' + px(argEI).toFixed(1) + '" y2="' + Ha + '" stroke="' + P.c0 + '" stroke-width="1.3" stroke-dasharray="3 2"/>' +
        '<text x="6" y="12" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">acquisition (EI)</text></svg>';
      plot.innerHTML = objSvg + acqSvg;
      var bi = Y.indexOf(Math.max.apply(null, Y));
      read.innerHTML = 'Evaluations: <b>' + X.length + '</b>. Best so far: <b style="font-family:IBM Plex Mono,monospace">f(' + X[bi].toFixed(2) + ') = ' + Y[bi].toFixed(2) + '</b> (true max &asymp; 1.50 at x&asymp;6). The blue curve is Expected Improvement; its peak is where BO looks next, balancing a high predicted mean against wide uncertainty.';
    }
    el.querySelector('.bo-next').addEventListener('click', function () {
      var post = surrogate(X, Y), pick = post.reduce(function (a, b) { return b.ei > a.ei ? b : a; }).x;
      X.push(pick); Y.push(f(pick)); draw();
    });
    el.querySelector('.bo-reset').addEventListener('click', function () { reset(); draw(); });
    // initial view shows where EI would send the first step
    (function () { var post = surrogate(X, Y); draw(post.reduce(function (a, b) { return b.ei > a.ei ? b : a; }).x); })();
  }

  function rcode() {
    return [
      '# Bayesian optimization: a GP surrogate + Expected Improvement, base R.',
      'f <- function(x) 1.5*exp(-(x-6)^2/1.5) + exp(-(x-2.5)^2/0.8)  # expensive black box',
      'rbf <- function(a,b,l) exp(-outer(a,b,"-")^2/(2*l^2))',
      'xg <- seq(0, 8, length.out = 100)',
      'X <- c(1, 4, 7.5); Y <- f(X)                     # 3 initial evaluations',
      'ei_pick <- function(X, Y, l=0.9, s0=1e-4) {',
      '  K <- rbf(X,X,l) + s0*diag(length(X)); Ki <- solve(K)',
      '  Ks <- rbf(xg, X, l)',
      '  mu <- as.numeric(Ks %*% (Ki %*% Y))            # surrogate mean',
      '  s  <- sqrt(pmax(1 - rowSums((Ks %*% Ki) * Ks), 1e-9))  # surrogate sd',
      '  z  <- (mu - max(Y)) / s',
      '  ei <- (mu - max(Y))*pnorm(z) + s*dnorm(z)      # expected improvement',
      '  xg[which.max(ei)]                              # look here next',
      '}',
      'for (i in 1:5) { xn <- ei_pick(X, Y); X <- c(X, xn); Y <- c(Y, f(xn)) }',
      'round(c(best_x = X[which.max(Y)], best_y = max(Y)), 2)',
      '# a handful of evaluations find the global peak (x=6, f=1.5).'
    ].join('\n');
  }

  window.LessonWidgets.register('bayesopt-acq', mount);
})();
