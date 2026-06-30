/* gradient-descent.js - how a model learns.
 * A ball on a loss bowl steps downhill by -learning_rate * gradient. Slide the
 * learning rate and step: too small crawls, just right converges, too large
 * oscillates, way too large diverges. Emits runnable R that runs the same loop.
 *
 * cfg: { min:3, start:-2 }  - optional; renders from {}.
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  function mount(el, cfg) {
    cfg = cfg || {};
    var WSTAR = (cfg.min != null) ? +cfg.min : 3;          // loss minimum at w = WSTAR
    var W0 = (cfg.start != null) ? +cfg.start : -2;
    var lr = 0.1;
    function loss(w) { return (w - WSTAR) * (w - WSTAR); }
    function grad(w) { return 2 * (w - WSTAR); }
    var path = [W0];

    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="gd-chart"></div>' +
      '<label style="display:block;font:600 12.5px/1.6 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:12px 0 0">learning rate <b class="gd-lr" style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '"></b>' +
        '<input class="gd-lrs" type="range" min="0.04" max="1.16" step="0.02" value="' + lr + '" style="width:100%;accent-color:' + P.acc + '"></label>' +
      '<div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin:10px 0 4px">' +
        '<button class="gd-step" type="button" style="font:inherit;font-size:12.5px;font-weight:600;color:#fff;background:' + P.acc + ';border:0;border-radius:8px;padding:8px 14px;cursor:pointer">Step downhill</button>' +
        '<button class="gd-run" type="button" style="font:inherit;font-size:12.5px;font-weight:600;color:' + P.mut + ';background:none;border:1px solid ' + P.line + ';border-radius:8px;padding:8px 14px;cursor:pointer">Run 15 steps</button>' +
        '<button class="gd-reset" type="button" style="font:inherit;font-size:12.5px;font-weight:600;color:' + P.mut + ';background:none;border:1px solid ' + P.line + ';border-radius:8px;padding:8px 12px;cursor:pointer">Reset</button>' +
      '</div>' +
      '<div class="gd-read" style="font:13px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:8px 0 14px"></div>' +
      u.runnable(rcode(WSTAR, W0), { label: 'Run the descent loop in R' });

    var chart = el.querySelector('.gd-chart'), read = el.querySelector('.gd-read'),
        lrs = el.querySelector('.gd-lrs'), lrEl = el.querySelector('.gd-lr');

    function draw() {
      var W = 480, H = 250, m = { t: 14, r: 14, b: 34, l: 42 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
      var wlo = WSTAR - 6.5, whi = WSTAR + 6.5, lmax = loss(wlo) * 1.05;
      function sx(w) { return m.l + (w - wlo) / (whi - wlo) * iw; }
      function sy(L) { return m.t + ih - Math.min(L, lmax) / lmax * ih; }
      var curve = ''; for (var w = wlo; w <= whi + 0.001; w += (whi - wlo) / 80) curve += sx(w).toFixed(1) + ',' + sy(loss(w)).toFixed(1) + ' ';
      var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="gradient descent on a loss bowl">';
      svg += '<line x1="' + m.l + '" y1="' + (m.t + ih) + '" x2="' + (m.l + iw) + '" y2="' + (m.t + ih) + '" stroke="' + P.line + '" stroke-width="1.5"/>';
      svg += '<line x1="' + sx(WSTAR).toFixed(1) + '" y1="' + m.t + '" x2="' + sx(WSTAR).toFixed(1) + '" y2="' + (m.t + ih) + '" stroke="' + P.line + '" stroke-dasharray="3 3"/>';
      svg += '<polyline points="' + curve.trim() + '" fill="none" stroke="' + P.c0 + '" stroke-width="2.5"/>';
      // descent path
      for (var i = 0; i < path.length; i++) {
        var cx = sx(path[i]), cy = sy(loss(path[i]));
        if (i > 0) svg += '<line x1="' + sx(path[i - 1]).toFixed(1) + '" y1="' + sy(loss(path[i - 1])).toFixed(1) + '" x2="' + cx.toFixed(1) + '" y2="' + cy.toFixed(1) + '" stroke="' + P.bad + '" stroke-width="1.2" opacity=".5"/>';
        var last = i === path.length - 1;
        svg += '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="' + (last ? 6 : 3.2) + '" fill="' + (last ? P.acc : P.bad) + '" fill-opacity="' + (last ? 1 : 0.55) + '"/>';
      }
      svg += '<text x="' + sx(WSTAR).toFixed(1) + '" y="' + (m.t + ih + 15) + '" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="9" fill="' + P.faint + '">minimum</text>';
      svg += '<text transform="translate(11,' + (m.t + ih / 2) + ') rotate(-90)" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="11" fill="' + P.mut + '">loss</text>';
      svg += '</svg>';
      chart.innerHTML = svg;

      var curW = path[path.length - 1], factor = Math.abs(1 - 2 * lr);
      var state = factor >= 1.001 ? ['Diverging', P.bad, 'The step overshoots so hard the ball climbs out of the bowl. Lower the learning rate.']
        : lr > 0.5 ? ['Oscillating in', P.c1, 'The step is large: the ball bounces side to side but still settles. Faster, but jumpy.']
        : ['Converging', P.acc, 'Small, steady steps walk smoothly down to the minimum. Slow but safe.'];
      read.innerHTML = '<b style="color:' + state[1] + '">' + state[0] + '.</b> ' + state[2] +
        ' <b style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '">step ' + (path.length - 1) + ' &middot; w ' + curW.toFixed(2) + ' &middot; loss ' + loss(curW).toFixed(2) + '</b>';
      lrEl.textContent = lr.toFixed(2);
    }

    function step() { var w = path[path.length - 1]; path.push(w - lr * grad(w)); if (path.length > 40) path.shift(); draw(); }
    lrs.addEventListener('input', function () { lr = +lrs.value; path = [W0]; draw(); });
    el.querySelector('.gd-step').addEventListener('click', step);
    el.querySelector('.gd-run').addEventListener('click', function () { for (var k = 0; k < 15; k++) step(); });
    el.querySelector('.gd-reset').addEventListener('click', function () { path = [W0]; draw(); });
    draw();
  }

  function rcode(wstar, w0) {
    return [
      '# Gradient descent: nudge w downhill by -learning_rate * gradient, over and over.',
      '# Loss L(w) = (w - ' + wstar + ')^2, so the gradient is 2 * (w - ' + wstar + ').',
      'grad <- function(w) 2 * (w - ' + wstar + ')',
      '',
      'lr <- 0.10           # try 0.5, then 0.95, then 1.10 and watch it blow up',
      'w  <- ' + w0,
      'for (i in 1:20) {',
      '  w <- w - lr * grad(w)',
      '  cat(sprintf("step %2d:  w = %7.3f   loss = %7.3f\\n", i, w, (w - ' + wstar + ')^2))',
      '}'
    ].join('\n');
  }

  window.LessonWidgets.register('gradient-descent', mount);
})();
