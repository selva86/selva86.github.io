/* robust-weights.js - one outlier, three fits. OLS chases every point and lets a single
 * bad row tilt the whole line; robust M-estimators (Huber, Tukey) notice the point does
 * not fit and quietly turn its weight down. Toggle the method and watch the line snap
 * back to the honest trend while the outlier fades to its down-weighted size. Emits
 * runnable R comparing lm() with MASS::rlm().
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  // 14 honest points on y = 2 + 1.4x, plus one high-leverage outlier
  var D = (function () {
    var a = [], s = 3; function r() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff - 0.5; }
    for (var i = 0; i < 14; i++) { var x = 1 + i * 0.55; a.push({ x: x, y: 2 + 1.4 * x + r() * 1.3 }); }
    a.push({ x: 7.2, y: 2.0 });   // the outlier: should be ~12, sits at 2
    return a;
  })();

  function fit(method) {
    // IRLS. method: ols | huber | tukey. Returns {b0,b1,w:[]}
    var w = D.map(function () { return 1; }), b0 = 0, b1 = 0, it, k;
    for (it = 0; it < (method === 'ols' ? 1 : 12); it++) {
      var sw = 0, swx = 0, swy = 0, swxx = 0, swxy = 0;
      D.forEach(function (d, i) { var wi = w[i]; sw += wi; swx += wi * d.x; swy += wi * d.y; swxx += wi * d.x * d.x; swxy += wi * d.x * d.y; });
      var den = sw * swxx - swx * swx; b1 = (sw * swxy - swx * swy) / den; b0 = (swy - b1 * swx) / sw;
      var res = D.map(function (d) { return d.y - (b0 + b1 * d.x); });
      var mad = res.map(Math.abs).sort(function (a, b) { return a - b; })[Math.floor(res.length / 2)] * 1.4826 || 1;
      if (method === 'ols') break;
      k = method === 'huber' ? 1.345 : 4.685;
      w = res.map(function (rr) { var u2 = rr / (mad * k); return method === 'huber' ? Math.min(1, 1 / Math.abs(u2 || 1e-9)) : (Math.abs(u2) < 1 ? (1 - u2 * u2) * (1 - u2 * u2) : 0); });
    }
    return { b0: b0, b1: b1, w: w };
  }

  function mount(el, cfg) {
    cfg = cfg || {}; var method = 'ols';
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="rw-seg" style="margin-bottom:12px">' + u.seg([{ v: 'ols', label: 'OLS' }, { v: 'huber', label: 'Huber' }, { v: 'tukey', label: 'Tukey' }], 'ols') + '</div>' +
      '<div class="rw-plot"></div>' +
      '<div class="rw-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'OLS vs a robust fit with MASS::rlm()' });

    var plot = el.querySelector('.rw-plot'), read = el.querySelector('.rw-read');
    var xs = D.map(function (d) { return d.x; }), ys = D.map(function (d) { return d.y; });
    var xe = [Math.min.apply(null, xs) - 0.5, Math.max.apply(null, xs) + 0.5], ye = [0, Math.max.apply(null, ys) + 1];
    var W = 440, H = 250, m = { l: 40, r: 12, t: 12, b: 30 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
    function sx(x) { return m.l + (x - xe[0]) / (xe[1] - xe[0]) * iw; }
    function sy(y) { return m.t + ih - (y - ye[0]) / (ye[1] - ye[0]) * ih; }
    function draw() {
      var f = fit(method), fo = fit('ols');
      var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="robust regression">';
      svg += '<line x1="' + m.l + '" y1="' + (m.t + ih) + '" x2="' + (m.l + iw) + '" y2="' + (m.t + ih) + '" stroke="' + P.line + '"/><line x1="' + m.l + '" y1="' + m.t + '" x2="' + m.l + '" y2="' + (m.t + ih) + '" stroke="' + P.line + '"/>';
      // faint OLS reference line when a robust method is active
      if (method !== 'ols') svg += '<line x1="' + sx(xe[0]) + '" y1="' + sy(fo.b0 + fo.b1 * xe[0]) + '" x2="' + sx(xe[1]) + '" y2="' + sy(fo.b0 + fo.b1 * xe[1]) + '" stroke="' + P.faint + '" stroke-width="1.5" stroke-dasharray="4 3"/>';
      // the active fit line
      svg += '<line x1="' + sx(xe[0]) + '" y1="' + sy(f.b0 + f.b1 * xe[0]) + '" x2="' + sx(xe[1]) + '" y2="' + sy(f.b0 + f.b1 * xe[1]) + '" stroke="' + P.acc + '" stroke-width="2.6"/>';
      // points sized by weight (down-weighted = small + faded)
      D.forEach(function (d, i) { var wt = method === 'ols' ? 1 : f.w[i]; var out = d.x > 6.9 && d.y < 4; svg += '<circle cx="' + sx(d.x).toFixed(1) + '" cy="' + sy(d.y).toFixed(1) + '" r="' + (3 + wt * 3).toFixed(1) + '" fill="' + (out ? P.bad : P.c0) + '" opacity="' + (0.35 + wt * 0.55).toFixed(2) + '"/>'; });
      svg += '</svg>';
      plot.innerHTML = svg;
      var slope = f.b1.toFixed(2), olsSlope = fo.b1.toFixed(2), trueSlope = '1.40';
      read.innerHTML = method === 'ols'
        ? '<b style="font-family:IBM Plex Mono,monospace;color:' + P.bad + '">OLS slope ' + slope + '</b>. One outlier (red) drags the least-squares line well below the true trend (' + trueSlope + '): every point, however wrong, gets full weight.'
        : '<b style="font-family:IBM Plex Mono,monospace;color:' + P.acc + '">' + (method === 'huber' ? 'Huber' : 'Tukey') + ' slope ' + slope + '</b> vs OLS ' + olsSlope + ' (dashed). The estimator gives the outlier a weight of <b>' + f.w[D.length - 1].toFixed(2) + '</b>, so the line snaps back to the honest slope near ' + trueSlope + '. ' + (method === 'tukey' ? 'Tukey redescends to weight 0: gross outliers are rejected outright.' : 'Huber caps a big residual\'s pull without discarding it.');
    }
    u.wireSeg(el.querySelector('.rw-seg'), function (v) { method = v; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# One outlier is enough to tilt an OLS line. Robust regression down-weights it.',
      'library(MASS)',
      'set.seed(3)',
      'x <- seq(1, 8, length.out = 14)',
      'y <- 2 + 1.4 * x + rnorm(14, 0, 0.6)',
      'x <- c(x, 7.2); y <- c(y, 2.0)          # add one bad point (should be ~12, is 2)',
      '',
      'coef(lm(y ~ x))["x"]                     # OLS: slope dragged well below 1.4',
      'coef(rlm(y ~ x, psi = psi.bisquare))["x"] # Tukey bisquare: back near the true 1.4',
      '# rlm iteratively reweights: the outlier gets a near-zero weight and loses its pull.'
    ].join('\n');
  }

  window.LessonWidgets.register('robust-weights', mount);
})();
