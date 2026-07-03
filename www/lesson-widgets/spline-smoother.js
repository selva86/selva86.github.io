/* spline-smoother.js - a GAM lets the data choose the curve, but you set how wiggly it may
 * get. A straight line underfits a bending relationship; a too-flexible smooth chases every
 * noisy point and overfits. Slide the smoothness dial and watch the fit go from stiff line,
 * to the honest underlying curve, to a wild overfit. Emits runnable R fitting the same
 * smooth with mgcv::gam at a chosen basis size.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  // true curve: a sine-ish bend + noise
  var D = (function () {
    var a = [], s = 8; function r() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff - 0.5; }
    for (var i = 0; i < 60; i++) { var x = i / 59 * 10; a.push({ x: x, y: Math.sin(x * 0.9) * 3 + 0.15 * x + r() * 1.5 }); }
    return a;
  })();
  function truth(x) { return Math.sin(x * 0.9) * 3 + 0.15 * x; }

  function mount(el, cfg) {
    cfg = cfg || {}; var k = 6;   // effective wiggliness (2 = line ... 30 = overfit)
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="ss-plot"></div>' +
      '<label style="display:block;font:600 12px/1.6 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:12px 0 2px">smoothness (basis size k) <b class="ss-v" style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '"></b>' +
        '<input class="ss-s" type="range" min="2" max="30" step="1" value="6" style="width:100%;accent-color:' + P.acc + '"></label>' +
      '<div style="display:flex;justify-content:space-between;font:10px IBM Plex Sans,sans-serif;color:' + P.mut + '"><span>stiff (underfit)</span><span>flexible (overfit)</span></div>' +
      '<div class="ss-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'A penalized smooth with mgcv::gam()' });

    var plot = el.querySelector('.ss-plot'), read = el.querySelector('.ss-read'), slider = el.querySelector('.ss-s'), vEl = el.querySelector('.ss-v');
    var W = 440, H = 250, m = { l: 34, r: 12, t: 12, b: 28 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
    var xe = [0, 10], ye = [-5, 6];
    function sx(x) { return m.l + (x - xe[0]) / (xe[1] - xe[0]) * iw; }
    function sy(y) { return m.t + ih - (y - ye[0]) / (ye[1] - ye[0]) * ih; }
    // fit a local-regression-ish smoother; bandwidth from k (small k = wide = stiff)
    function smooth(x) {
      var bw = 6 / (k - 1);   // k=2 -> wide (line-like); k=30 -> narrow (wiggly)
      var sw = 0, swy = 0, swx = 0, swxx = 0, swxy = 0;
      D.forEach(function (d) { var w = Math.exp(-((d.x - x) * (d.x - x)) / (2 * bw * bw)); sw += w; swy += w * d.y; swx += w * d.x; swxx += w * d.x * d.x; swxy += w * d.x * d.y; });
      var den = sw * swxx - swx * swx; var b1 = den === 0 ? 0 : (sw * swxy - swx * swy) / den, b0 = (swy - b1 * swx) / sw;
      return b0 + b1 * x;
    }
    function draw() {
      var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="spline smoother">';
      svg += '<line x1="' + m.l + '" y1="' + (m.t + ih) + '" x2="' + (m.l + iw) + '" y2="' + (m.t + ih) + '" stroke="' + P.line + '"/><line x1="' + m.l + '" y1="' + m.t + '" x2="' + m.l + '" y2="' + (m.t + ih) + '" stroke="' + P.line + '"/>';
      D.forEach(function (d) { svg += '<circle cx="' + sx(d.x).toFixed(1) + '" cy="' + sy(d.y).toFixed(1) + '" r="3" fill="' + P.c0 + '" opacity="0.45"/>'; });
      // true curve (dashed grey)
      var tp = ''; for (var i = 0; i <= 100; i++) { var x = i / 100 * 10; tp += sx(x).toFixed(1) + ',' + sy(truth(x)).toFixed(1) + ' '; }
      svg += '<polyline points="' + tp + '" fill="none" stroke="' + P.faint + '" stroke-width="1.5" stroke-dasharray="4 3"/>';
      // fitted smooth
      var fp = ''; for (var j = 0; j <= 120; j++) { var xx = j / 120 * 10; fp += sx(xx).toFixed(1) + ',' + sy(smooth(xx)).toFixed(1) + ' '; }
      svg += '<polyline points="' + fp + '" fill="none" stroke="' + P.acc + '" stroke-width="2.6"/>';
      svg += '<text x="' + (m.l + 6) + '" y="' + (m.t + 12) + '" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.faint + '">dashed = true curve</text>';
      svg += '</svg>'; plot.innerHTML = svg;
      vEl.textContent = k;
      read.innerHTML = k <= 3
        ? '<b style="color:' + P.bad + '">Underfit.</b> With so few basis functions the smooth is nearly a straight line and misses the real bends: high bias.'
        : k >= 20
          ? '<b style="color:' + P.bad + '">Overfit.</b> The smooth is now flexible enough to chase individual noisy points, wiggling far from the true curve: high variance.'
          : '<b style="color:' + P.acc + '">Good fit.</b> The smooth tracks the true curve (dashed) without chasing noise. A GAM adds a penalty so it lands here on its own; you set k as the upper limit on wiggliness.';
    }
    slider.addEventListener('input', function () { k = +slider.value; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# A GAM fits a smooth curve; the penalty picks the right wiggliness automatically.',
      'library(mgcv)',
      'set.seed(8); n <- 200',
      'x <- runif(n, 0, 10)',
      'y <- sin(x * 0.9) * 3 + 0.15 * x + rnorm(n, 0, 1.2)',
      '',
      'g <- gam(y ~ s(x, k = 20))            # k caps flexibility; the penalty does the rest',
      'summary(g)$s.table                     # edf = effective degrees of freedom actually used',
      '# edf near 1 means a line; a larger edf means real curvature. The penalty avoids overfit.'
    ].join('\n');
  }

  window.LessonWidgets.register('spline-smoother', mount);
})();
