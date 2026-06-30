/* ols-fit.js - least squares, made literal.
 * Move the slope and intercept; each point drops a residual to the line and draws
 * a SQUARE whose side is that residual (area = squared error). The SSE updates live;
 * "Snap to least squares" jumps to the lm() solution. Emits runnable R that fits the
 * same line with lm() and reports the coefficients + SSE.
 *
 * cfg: { points:[{x,y},...] }  - optional; a default scatter is built from {}.
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  function mount(el, cfg) {
    cfg = cfg || {};
    var pts = (cfg.points && cfg.points.length) ? cfg.points.map(function (p) { return { x: +p.x, y: +p.y }; })
      : [{ x: 1, y: 2.1 }, { x: 2, y: 2.9 }, { x: 3, y: 3.7 }, { x: 4, y: 3.4 }, { x: 5, y: 5.2 }, { x: 6, y: 5.0 }, { x: 7, y: 6.6 }, { x: 8, y: 6.1 }, { x: 9, y: 7.8 }];

    // least-squares solution (used by the Snap button + the "best" reference)
    function ols() {
      var n = pts.length, sx = 0, sy = 0, sxx = 0, sxy = 0;
      pts.forEach(function (p) { sx += p.x; sy += p.y; sxx += p.x * p.x; sxy += p.x * p.y; });
      var b = (n * sxy - sx * sy) / (n * sxx - sx * sx), a = (sy - b * sx) / n;
      return { a: a, b: b };
    }
    var best = ols();
    var b = +(best.b * 0.45).toFixed(2);                 // start deliberately off the best fit
    var a = +(best.a + 1.2).toFixed(2);

    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="of-chart"></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 18px;margin:12px 0 4px">' +
        '<label style="font:600 12px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + '">slope <b class="of-b" style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '"></b>' +
          '<input class="of-bs" type="range" min="-1" max="2" step="0.02" value="' + b + '" style="width:100%;accent-color:' + P.acc + '"></label>' +
        '<label style="font:600 12px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + '">intercept <b class="of-a" style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '"></b>' +
          '<input class="of-as" type="range" min="-2" max="6" step="0.05" value="' + a + '" style="width:100%;accent-color:' + P.acc + '"></label>' +
      '</div>' +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:6px 0 14px">' +
        '<div class="of-sse" style="font:13px/1.4 IBM Plex Sans,sans-serif;color:' + P.body + '"></div>' +
        '<button class="of-snap" type="button" style="font:inherit;font-size:12.5px;font-weight:600;color:#fff;background:' + P.acc + ';border:0;border-radius:8px;padding:8px 14px;cursor:pointer">Snap to least squares</button>' +
      '</div>' +
      u.runnable(rcode(pts), { label: 'Fit it for real: lm() finds this exact line' });

    var chart = el.querySelector('.of-chart'), sseEl = el.querySelector('.of-sse'),
        bs = el.querySelector('.of-bs'), as = el.querySelector('.of-as'),
        bEl = el.querySelector('.of-b'), aEl = el.querySelector('.of-a');

    function draw() {
      var W = 480, H = 280, m = { t: 14, r: 14, b: 34, l: 40 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
      var xs = pts.map(function (p) { return p.x; }), ys = pts.map(function (p) { return p.y; });
      var xlo = Math.min.apply(null, xs) - 0.6, xhi = Math.max.apply(null, xs) + 0.6;
      var ylo = Math.min.apply(null, ys) - 1.4, yhi = Math.max.apply(null, ys) + 1.4;
      function sx(x) { return m.l + (x - xlo) / (xhi - xlo) * iw; }
      function sy(y) { return m.t + ih - (y - ylo) / (yhi - ylo) * ih; }
      var pxPerY = ih / (yhi - ylo);                       // residual square side in px (area = squared error feel)

      var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="least squares fit">';
      svg += '<line x1="' + m.l + '" y1="' + (m.t + ih) + '" x2="' + (m.l + iw) + '" y2="' + (m.t + ih) + '" stroke="' + P.line + '" stroke-width="1.5"/>';
      svg += '<line x1="' + m.l + '" y1="' + m.t + '" x2="' + m.l + '" y2="' + (m.t + ih) + '" stroke="' + P.line + '" stroke-width="1.5"/>';
      // residual squares (side = |residual| to scale), then the residual segment, then the point
      var sse = 0;
      pts.forEach(function (p) {
        var yhat = a + b * p.x, r = p.y - yhat; sse += r * r;
        var side = Math.abs(r) * pxPerY, px = sx(p.x), py = sy(p.y), pyh = sy(yhat);
        var sqx = px, sqy = Math.min(py, pyh);
        svg += '<rect x="' + sqx.toFixed(1) + '" y="' + sqy.toFixed(1) + '" width="' + side.toFixed(1) + '" height="' + side.toFixed(1) + '" fill="' + P.bad + '" fill-opacity="0.13" stroke="' + P.bad + '" stroke-opacity="0.4"/>';
        svg += '<line x1="' + px.toFixed(1) + '" y1="' + py.toFixed(1) + '" x2="' + px.toFixed(1) + '" y2="' + pyh.toFixed(1) + '" stroke="' + P.bad + '" stroke-width="1.4"/>';
      });
      // the line
      svg += '<line x1="' + sx(xlo).toFixed(1) + '" y1="' + sy(a + b * xlo).toFixed(1) + '" x2="' + sx(xhi).toFixed(1) + '" y2="' + sy(a + b * xhi).toFixed(1) + '" stroke="' + P.acc + '" stroke-width="2.5"/>';
      // points
      pts.forEach(function (p) { svg += '<circle cx="' + sx(p.x).toFixed(1) + '" cy="' + sy(p.y).toFixed(1) + '" r="5" fill="' + P.ink + '"/>'; });
      svg += '</svg>';
      chart.innerHTML = svg;

      var bestSse = 0; pts.forEach(function (p) { var r = p.y - (best.a + best.b * p.x); bestSse += r * r; });
      sseEl.innerHTML = 'Sum of squared errors <b style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '">' + sse.toFixed(2) + '</b>' +
        ' <span style="color:' + P.faint + '">(best possible ' + bestSse.toFixed(2) + ')</span>';
      bEl.textContent = b.toFixed(2); aEl.textContent = a.toFixed(2);
    }

    bs.addEventListener('input', function () { b = +bs.value; draw(); });
    as.addEventListener('input', function () { a = +as.value; draw(); });
    el.querySelector('.of-snap').addEventListener('click', function () {
      b = +best.b.toFixed(2); a = +best.a.toFixed(2); bs.value = b; as.value = a; draw();
    });
    draw();
  }

  function rcode(pts) {
    var rdf = u.rdf(pts, [{ name: 'x', key: 'x' }, { name: 'y', key: 'y' }], 'd');
    return [
      '# The same points. lm() finds the slope + intercept that minimize the',
      '# sum of squared residuals - the squares you were shrinking by hand.',
      rdf,
      '',
      'fit <- lm(y ~ x, data = d)',
      'coef(fit)                       # intercept and slope',
      'sse <- sum(residuals(fit)^2)    # the minimum sum of squared errors',
      'sse',
      '',
      'plot(d$x, d$y, pch = 19, xlab = "x", ylab = "y")',
      'abline(fit, col = "forestgreen", lwd = 2)',
      'segments(d$x, d$y, d$x, fitted(fit), col = "darkorange")   # the residuals'
    ].join('\n');
  }

  window.LessonWidgets.register('ols-fit', mount);
})();
