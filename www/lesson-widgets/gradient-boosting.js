/* gradient-boosting.js - boosting as sequential error-correction.
 * Start with one flat guess (the mean). Each round fits a shallow tree to what's
 * still WRONG (the residuals) and adds a shrunken slice of it. Slide the number of
 * rounds: the fit hugs the data and the residuals collapse toward zero. Emits
 * runnable R that boosts the same way with rpart stumps.
 *
 * cfg: { rounds:0, lr:0.3 }  - optional.
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  var Z = [0.3, -0.4, 0.1, 0.5, -0.2, 0.35, -0.5, 0.2, -0.1, 0.4, -0.3, 0.15, 0.45, -0.25, 0.05, -0.45, 0.25, -0.15, 0.5, -0.35, 0.1, 0.3, -0.2, 0.4, -0.4, 0.2, -0.05, 0.35, -0.3, 0.15];

  function mount(el, cfg) {
    cfg = cfg || {};
    var MAX = 16, lr = (cfg.lr != null) ? +cfg.lr : 0.3, round = Math.min(MAX, Math.max(0, +cfg.rounds || 0));
    var N = Z.length, X = [], Y = [];
    for (var i = 0; i < N; i++) { var x = 10 * i / (N - 1); X.push(x); Y.push(Math.sin(x) + 0.18 * x + Z[i]); }

    function fitStump(res) {
      var best = null;
      for (var s = 1; s < N; s++) {
        var sp = (X[s - 1] + X[s]) / 2, ls = 0, ln = 0, rs = 0, rn = 0, j;
        for (j = 0; j < N; j++) { if (X[j] < sp) { ls += res[j]; ln++; } else { rs += res[j]; rn++; } }
        if (!ln || !rn) continue;
        var lm = ls / ln, rm = rs / rn, sse = 0;
        for (j = 0; j < N; j++) { var p = X[j] < sp ? lm : rm; sse += (res[j] - p) * (res[j] - p); }
        if (!best || sse < best.sse) best = { sp: sp, lm: lm, rm: rm, sse: sse };
      }
      return best;
    }
    // precompute cumulative predictions for each round
    var mean = Y.reduce(function (a, b) { return a + b; }, 0) / N;
    var PRED = [Y.map(function () { return mean; })];
    for (var m = 1; m <= MAX; m++) {
      var prev = PRED[m - 1], res = Y.map(function (y, k) { return y - prev[k]; }), st = fitStump(res);
      PRED.push(prev.map(function (p, k) { return p + lr * (X[k] < st.sp ? st.lm : st.rm); }));
    }

    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="gb-chart"></div>' +
      '<label style="display:block;font:600 12.5px/1.6 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:12px 0 2px">boosting rounds (trees): <b class="gb-r" style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '"></b>' +
        '<input class="gb-s" type="range" min="0" max="' + MAX + '" step="1" value="' + round + '" style="width:100%;accent-color:' + P.acc + '"></label>' +
      '<div class="gb-read" style="font:13px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:8px 0 14px"></div>' +
      u.runnable(rcode(lr), { label: 'Boost it for real with rpart stumps in R' });

    var chart = el.querySelector('.gb-chart'), read = el.querySelector('.gb-read'),
        slider = el.querySelector('.gb-s'), rEl = el.querySelector('.gb-r');

    function draw() {
      var pred = PRED[round];
      var W = 480, H = 260, m2 = { t: 14, r: 14, b: 32, l: 40 }, iw = W - m2.l - m2.r, ih = H - m2.t - m2.b;
      var ylo = Math.min.apply(null, Y) - 0.6, yhi = Math.max.apply(null, Y) + 0.6;
      function sx(x) { return m2.l + x / 10 * iw; } function sy(y) { return m2.t + ih - (y - ylo) / (yhi - ylo) * ih; }
      var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="gradient boosting fit">';
      svg += '<line x1="' + m2.l + '" y1="' + (m2.t + ih) + '" x2="' + (m2.l + iw) + '" y2="' + (m2.t + ih) + '" stroke="' + P.line + '" stroke-width="1.5"/>';
      svg += '<line x1="' + m2.l + '" y1="' + m2.t + '" x2="' + m2.l + '" y2="' + (m2.t + ih) + '" stroke="' + P.line + '" stroke-width="1.5"/>';
      // residual stems (data to prediction)
      for (var k = 0; k < N; k++) svg += '<line x1="' + sx(X[k]).toFixed(1) + '" y1="' + sy(Y[k]).toFixed(1) + '" x2="' + sx(X[k]).toFixed(1) + '" y2="' + sy(pred[k]).toFixed(1) + '" stroke="' + P.bad + '" stroke-width="1" opacity=".4"/>';
      // prediction (step-ish line)
      svg += '<polyline points="' + X.map(function (x, k2) { return sx(x).toFixed(1) + ',' + sy(pred[k2]).toFixed(1); }).join(' ') + '" fill="none" stroke="' + P.acc + '" stroke-width="2.5"/>';
      for (k = 0; k < N; k++) svg += '<circle cx="' + sx(X[k]).toFixed(1) + '" cy="' + sy(Y[k]).toFixed(1) + '" r="3.6" fill="' + P.ink + '" fill-opacity="0.72"/>';
      svg += '</svg>';
      chart.innerHTML = svg;

      var rmse = Math.sqrt(Y.reduce(function (a, y, k3) { return a + (y - pred[k3]) * (y - pred[k3]); }, 0) / N);
      read.innerHTML = (round === 0
        ? 'Round 0 is just the mean - one flat line, big residuals.'
        : 'After <b>' + round + '</b> round' + (round === 1 ? '' : 's') + ', each tree has nudged the fit toward the points it still got wrong.') +
        ' The orange stems are the residuals; watch them shrink. <b style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '">RMSE ' + rmse.toFixed(3) + '</b>';
      rEl.textContent = round;
    }
    slider.addEventListener('input', function () { round = +slider.value; draw(); });
    draw();
  }

  function rcode(lr) {
    return [
      '# Gradient boosting by hand: each shallow tree fits the CURRENT residuals,',
      '# and we add a shrunken slice of it. Watch RMSE fall as trees stack.',
      'library(rpart)',
      'set.seed(1)',
      'n <- 80',
      'x <- sort(runif(n, 0, 10))',
      'y <- sin(x) + 0.18 * x + rnorm(n, 0, 0.3)',
      '',
      'pred <- rep(mean(y), n)               # start with one flat guess',
      'lr   <- ' + lr,
      'for (m in 1:15) {',
      '  resid <- y - pred                   # what we still get wrong',
      '  stump <- rpart(resid ~ x, control = rpart.control(maxdepth = 1, cp = 0))',
      '  pred  <- pred + lr * predict(stump) # add a shrunken correction',
      '}',
      'plot(x, y, pch = 19, col = "gray70"); lines(x, pred, col = "forestgreen", lwd = 2)',
      'sqrt(mean((y - pred)^2))              # RMSE after boosting'
    ].join('\n');
  }

  window.LessonWidgets.register('gradient-boosting', mount);
})();
