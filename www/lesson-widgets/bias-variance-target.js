/* bias-variance-target.js - the dartboard view of bias and variance.
 * Shots at a bullseye. Bias offsets the cluster's CENTER from the target;
 * variance is its SPREAD. Slide each and watch the four corners - low/high bias
 * x low/high variance - and the error split MSE = bias^2 + variance. Emits
 * runnable R that simulates the shots and computes the same decomposition.
 *
 * cfg: { bias:1.2, variance:0.4 }  - optional.
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  var ZX = [0.5, -0.8, 0.2, 1.0, -0.4, 0.7, -1.1, 0.3, -0.2, 0.9, -0.6, 0.1];
  var ZY = [-0.6, 0.4, 1.0, -0.3, -0.9, 0.5, 0.2, -1.0, 0.8, -0.2, 0.6, -0.5];

  function mount(el, cfg) {
    cfg = cfg || {};
    var bias = (cfg.bias != null) ? +cfg.bias : 1.2, variance = (cfg.variance != null) ? +cfg.variance : 0.4;

    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="bt-chart"></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 18px;margin:12px 0 2px">' +
        '<label style="font:600 12px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + '">bias <b class="bt-b" style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '"></b><input class="bt-bs" type="range" min="0" max="2" step="0.05" value="' + bias + '" style="width:100%;accent-color:' + P.acc + '"></label>' +
        '<label style="font:600 12px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + '">variance <b class="bt-v" style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '"></b><input class="bt-vs" type="range" min="0.02" max="1.4" step="0.02" value="' + variance + '" style="width:100%;accent-color:' + P.acc + '"></label>' +
      '</div>' +
      '<div class="bt-read" style="font:13px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Simulate the shots + split the error in R' });

    var chart = el.querySelector('.bt-chart'), read = el.querySelector('.bt-read'),
        bs = el.querySelector('.bt-bs'), vs = el.querySelector('.bt-vs'), bEl = el.querySelector('.bt-b'), vEl = el.querySelector('.bt-v');

    function draw() {
      var S = 280, cx = S / 2, cy = S / 2, unit = S / 7, sd = Math.sqrt(variance);
      function px(x) { return cx + x * unit; } function py(y) { return cy - y * unit; }
      var sxs = ZX.map(function (z) { return bias + z * sd; }), sys = ZY.map(function (z) { return z * sd; });
      var svg = '<svg viewBox="0 0 ' + S + ' ' + S + '" width="100%" style="max-width:' + S + 'px;display:block;margin:0 auto" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="bias variance dartboard">';
      [2.4, 1.6, 0.8].forEach(function (rr, i) { svg += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (rr * unit).toFixed(1) + '" fill="' + (i % 2 ? '#fff' : P.bg) + '" stroke="' + P.line + '"/>'; });
      svg += '<circle cx="' + cx + '" cy="' + cy + '" r="4" fill="' + P.acc + '"/>';
      // cluster center marker
      var mcx = sxs.reduce(function (a, b) { return a + b; }, 0) / ZX.length, mcy = sys.reduce(function (a, b) { return a + b; }, 0) / ZY.length;
      svg += '<line x1="' + px(0) + '" y1="' + py(0) + '" x2="' + px(mcx).toFixed(1) + '" y2="' + py(mcy).toFixed(1) + '" stroke="' + P.bad + '" stroke-width="1.4" stroke-dasharray="3 3"/>';
      sxs.forEach(function (x, i) { svg += '<circle cx="' + px(x).toFixed(1) + '" cy="' + py(sys[i]).toFixed(1) + '" r="5" fill="' + P.bad + '" fill-opacity="0.8"/>'; });
      svg += '<circle cx="' + px(mcx).toFixed(1) + '" cy="' + py(mcy).toFixed(1) + '" r="6" fill="none" stroke="' + P.ink + '" stroke-width="2"/>';
      svg += '</svg>';
      chart.innerHTML = svg;

      var bias2 = mcx * mcx + mcy * mcy, varEst = sxs.reduce(function (a, x, i) { return a + (x - mcx) * (x - mcx) + (sys[i] - mcy) * (sys[i] - mcy); }, 0) / ZX.length;
      var label = bias > 1 && variance > 0.7 ? 'High bias AND high variance - off-center and scattered.'
        : bias > 1 ? 'High bias, low variance - tightly grouped, but in the wrong spot (a too-simple model).'
        : variance > 0.7 ? 'Low bias, high variance - centered on average, but wildly inconsistent (overfitting).'
        : 'Low bias, low variance - the goal: tight and on target.';
      read.innerHTML = '<b>' + label + '</b> Error splits cleanly: <b style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '">bias&sup2; ' + bias2.toFixed(2) + ' + variance ' + varEst.toFixed(2) + ' = MSE ' + (bias2 + varEst).toFixed(2) +
        '</b>. The dashed line is how far the cluster center sits from the bullseye (bias); the scatter around that center is variance.';
      bEl.textContent = (+bias).toFixed(2); vEl.textContent = (+variance).toFixed(2);
    }
    bs.addEventListener('input', function () { bias = +bs.value; draw(); });
    vs.addEventListener('input', function () { variance = +vs.value; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Bias vs variance as darts at a bullseye. Bias shifts the cluster CENTER',
      '# off target; variance is its SPREAD. Total error = bias^2 + variance.',
      'set.seed(1)',
      'bias <- 1.2; variance <- 0.4; n <- 12     # try bias 0 + variance 1.0, etc.',
      'shots_x <- bias + rnorm(n, 0, sqrt(variance))',
      'shots_y <-        rnorm(n, 0, sqrt(variance))',
      '',
      'plot(shots_x, shots_y, xlim = c(-3, 3), ylim = c(-3, 3), asp = 1,',
      '     pch = 19, col = "firebrick", xlab = "", ylab = "")',
      'symbols(rep(0, 3), rep(0, 3), circles = c(0.6, 1.4, 2.2), inches = FALSE, add = TRUE)',
      '',
      'center <- c(mean(shots_x), mean(shots_y))',
      'bias2  <- sum(center^2)                                   # distance from bullseye',
      'var_   <- mean((shots_x - center[1])^2 + (shots_y - center[2])^2)',
      'c(bias2 = bias2, variance = var_, mse = bias2 + var_)'
    ].join('\n');
  }

  window.LessonWidgets.register('bias-variance-target', mount);
})();
