/* regression-intervals.js - confidence vs prediction intervals.
 * Slide the sample size: the CONFIDENCE band (uncertainty about the mean line)
 * shrinks toward the line as n grows, but the PREDICTION band (where a NEW point
 * could land) stays wide - it is floored by the noise, not the sample size.
 * Emits runnable R using predict(interval = "confidence" / "prediction").
 *
 * cfg: { }  - renders from {}.
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; }
  function gauss(r) { return (r() + r() + r() + r() - 2) * 0.8660254; }   // ~N(0,1) from uniforms

  function mount(el, cfg) {
    cfg = cfg || {};
    var n = 20, A = 2, B = 0.6, SD = 1.3, xlo = 0, xhi = 10;
    function data(N) { var r = rng(7), d = []; for (var i = 0; i < N; i++) { var x = r() * 10; d.push({ x: x, y: A + B * x + gauss(r) * SD }); } return d; }

    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="ri-chart"></div>' +
      '<label style="display:block;font:600 12.5px/1.6 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:12px 0 2px">sample size n = <b class="ri-n" style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '"></b>' +
        '<input class="ri-s" type="range" min="8" max="300" step="1" value="' + n + '" style="width:100%;accent-color:' + P.acc + '"></label>' +
      '<div class="ri-read" style="font:13px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:8px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Confidence vs prediction intervals in R' });

    var chart = el.querySelector('.ri-chart'), read = el.querySelector('.ri-read'),
        slider = el.querySelector('.ri-s'), nEl = el.querySelector('.ri-n');

    function draw() {
      var d = data(n), N = d.length;
      var sx = 0, sy = 0, sxx = 0, sxy = 0; d.forEach(function (p) { sx += p.x; sy += p.y; sxx += p.x * p.x; sxy += p.x * p.y; });
      var xbar = sx / N, b = (N * sxy - sx * sy) / (N * sxx - sx * sx), a = (sy - b * sx) / N;
      var sse = 0, Sxx = 0; d.forEach(function (p) { var e = p.y - (a + b * p.x); sse += e * e; Sxx += (p.x - xbar) * (p.x - xbar); });
      var s = Math.sqrt(sse / Math.max(1, N - 2)), tval = 2.04;
      function ci(x) { return tval * s * Math.sqrt(1 / N + (x - xbar) * (x - xbar) / Sxx); }
      function pi(x) { return tval * s * Math.sqrt(1 + 1 / N + (x - xbar) * (x - xbar) / Sxx); }

      var W = 480, H = 280, m = { t: 14, r: 14, b: 34, l: 40 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
      var ylo = A - 4, yhi = A + B * 10 + 4;
      function px(x) { return m.l + (x - xlo) / (xhi - xlo) * iw; } function py(y) { return m.t + ih - (y - ylo) / (yhi - ylo) * ih; }
      function band(fn, fill) { var up = '', dn = ''; for (var x = xlo; x <= xhi + 0.001; x += 0.5) { up += px(x).toFixed(1) + ',' + py(a + b * x + fn(x)).toFixed(1) + ' '; dn = px(x).toFixed(1) + ',' + py(a + b * x - fn(x)).toFixed(1) + ' ' + dn; } return '<polygon points="' + up + dn + '" fill="' + fill + '" stroke="none"/>'; }
      var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="confidence and prediction intervals"><line x1="' + m.l + '" y1="' + (m.t + ih) + '" x2="' + (m.l + iw) + '" y2="' + (m.t + ih) + '" stroke="' + P.line + '" stroke-width="1.5"/><line x1="' + m.l + '" y1="' + m.t + '" x2="' + m.l + '" y2="' + (m.t + ih) + '" stroke="' + P.line + '" stroke-width="1.5"/>';
      svg += band(pi, 'rgba(181,99,26,0.13)') + band(ci, 'rgba(31,122,85,0.22)');
      svg += '<line x1="' + px(xlo).toFixed(1) + '" y1="' + py(a + b * xlo).toFixed(1) + '" x2="' + px(xhi).toFixed(1) + '" y2="' + py(a + b * xhi).toFixed(1) + '" stroke="' + P.acc + '" stroke-width="2.5"/>';
      d.forEach(function (p) { svg += '<circle cx="' + px(p.x).toFixed(1) + '" cy="' + py(p.y).toFixed(1) + '" r="' + (n > 120 ? 2.4 : 3.6) + '" fill="' + P.ink + '" fill-opacity="0.6"/>'; });
      svg += '<rect x="' + (m.l + 8) + '" y="' + (m.t + 4) + '" width="10" height="10" fill="rgba(31,122,85,0.5)"/><text x="' + (m.l + 22) + '" y="' + (m.t + 13) + '" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.body + '">confidence (mean)</text><rect x="' + (m.l + 138) + '" y="' + (m.t + 4) + '" width="10" height="10" fill="rgba(181,99,26,0.28)"/><text x="' + (m.l + 152) + '" y="' + (m.t + 13) + '" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.body + '">prediction (new point)</text></svg>';
      chart.innerHTML = svg;
      read.innerHTML = 'At n=' + n + ', confidence half-width at the center is <b style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '">&plusmn;' + ci(xbar).toFixed(2) + '</b> and prediction is <b style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '">&plusmn;' + pi(xbar).toFixed(2) +
        '</b>. Push n up: the green confidence band collapses onto the line (we pin down the mean), but the orange prediction band barely moves - a single new point still carries the irreducible noise.';
      nEl.textContent = n;
    }
    slider.addEventListener('input', function () { n = +slider.value; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Two very different intervals. Confidence = uncertainty about the mean line;',
      '# prediction = where a NEW observation could fall (much wider).',
      'set.seed(1)',
      'x <- runif(40, 0, 10); y <- 2 + 0.6 * x + rnorm(40, 0, 1.3)',
      'fit <- lm(y ~ x)',
      'grid <- data.frame(x = seq(0, 10, 0.5))',
      '',
      'ci <- predict(fit, grid, interval = "confidence")   # for the average y at x',
      'pi <- predict(fit, grid, interval = "prediction")   # for a single new y at x',
      '',
      'plot(x, y, pch = 19, col = "gray60")',
      'abline(fit, col = "forestgreen", lwd = 2)',
      'lines(grid$x, ci[, "lwr"], col = "forestgreen", lty = 2)',
      'lines(grid$x, ci[, "upr"], col = "forestgreen", lty = 2)',
      'lines(grid$x, pi[, "lwr"], col = "darkorange", lty = 3)',
      'lines(grid$x, pi[, "upr"], col = "darkorange", lty = 3)'
    ].join('\n');
  }

  window.LessonWidgets.register('regression-intervals', mount);
})();
