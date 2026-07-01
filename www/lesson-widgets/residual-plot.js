/* residual-plot.js - reading a residuals-vs-fitted plot.
 * Toggle three fits: a healthy one (residuals a flat random band), a funnel
 * (variance grows with the fitted value - heteroscedastic), and a curve
 * (the model missed a nonlinearity). The scatter + its trend update so the
 * learner learns the SHAPE of trouble. Emits runnable R: lm() + plot(fit).
 *
 * cfg: { start:"healthy" }  - optional.
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  // deterministic standard-ish noise (mean ~0), reused across scenarios
  var Z = [0.4, -1.1, 0.7, -0.3, 1.4, -0.8, 0.2, 0.9, -1.5, 0.6, -0.2, 1.1, -0.9, 0.5, -1.3, 0.8, -0.4, 1.2, -0.7, 0.3, -1.0, 0.6, 1.0, -0.6];

  function mount(el, cfg) {
    cfg = cfg || {};
    var scen = cfg.start || 'healthy';
    var N = Z.length;
    // fitted values spread across a range
    function fitted(i) { return 2 + 8 * i / (N - 1); }
    function resid(i, s) {
      var f = fitted(i), z = Z[i];
      if (s === 'funnel') return z * (0.25 + 0.34 * (f - 2));          // spread grows with fitted
      if (s === 'curved') { var c = (f - 6); return 0.9 * (c * c / 4 - 1.4) + z * 0.5; } // U-shaped bias
      return z * 1.0;                                                   // healthy: flat band
    }

    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="rp-seg" style="margin:0 0 12px">' + u.seg([{ v: 'healthy', label: 'Healthy fit' }, { v: 'funnel', label: 'Funnel (non-constant variance)' }, { v: 'curved', label: 'Curve (missed nonlinearity)' }], scen) + '</div>' +
      '<div class="rp-chart"></div>' +
      '<div class="rp-read" style="font:13px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'See the real diagnostic plots in R' });

    var chart = el.querySelector('.rp-chart'), read = el.querySelector('.rp-read');

    function draw() {
      var W = 480, H = 250, m = { t: 16, r: 14, b: 36, l: 44 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
      var rs = []; for (var i = 0; i < N; i++) rs.push(resid(i, scen));
      var rmax = Math.max.apply(null, rs.map(Math.abs)) * 1.15 || 1;
      var flo = 2, fhi = 10;
      function sx(f) { return m.l + (f - flo) / (fhi - flo) * iw; }
      function sy(r) { return m.t + ih / 2 - r / rmax * (ih / 2); }
      var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="residuals versus fitted">';
      svg += '<line x1="' + m.l + '" y1="' + (m.t + ih) + '" x2="' + (m.l + iw) + '" y2="' + (m.t + ih) + '" stroke="' + P.line + '" stroke-width="1.5"/>';
      svg += '<line x1="' + m.l + '" y1="' + m.t + '" x2="' + m.l + '" y2="' + (m.t + ih) + '" stroke="' + P.line + '" stroke-width="1.5"/>';
      // zero reference
      svg += '<line x1="' + m.l + '" y1="' + sy(0).toFixed(1) + '" x2="' + (m.l + iw) + '" y2="' + sy(0).toFixed(1) + '" stroke="' + P.bad + '" stroke-dasharray="4 3" opacity=".55"/>';
      // a smooth trend (mean residual in sliding windows) - flat = good
      var trend = ''; for (var t = 0; t <= 16; t++) { var f = flo + (fhi - flo) * t / 16; var acc = 0, wsum = 0; for (var j = 0; j < N; j++) { var d = Math.abs(fitted(j) - f); var w = Math.exp(-d * d / 2.2); acc += w * rs[j]; wsum += w; } trend += sx(f).toFixed(1) + ',' + sy(acc / wsum).toFixed(1) + ' '; }
      svg += '<polyline points="' + trend.trim() + '" fill="none" stroke="' + P.c0 + '" stroke-width="2" opacity=".8"/>';
      for (i = 0; i < N; i++) svg += '<circle cx="' + sx(fitted(i)).toFixed(1) + '" cy="' + sy(rs[i]).toFixed(1) + '" r="4.5" fill="' + P.ink + '" fill-opacity="0.72"/>';
      svg += '<text x="' + (m.l + iw / 2) + '" y="' + (H - 5) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="11" fill="' + P.mut + '">fitted value &rarr;</text>';
      svg += '<text transform="translate(11,' + (m.t + ih / 2) + ') rotate(-90)" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="11" fill="' + P.mut + '">residual</text>';
      svg += '</svg>';
      chart.innerHTML = svg;

      var msg = scen === 'funnel' ? ['Trouble: non-constant variance.', 'The spread fans out as the fitted value grows. The model is less certain for big predictions; standard errors are wrong. Fix with a transform or robust/weighted errors.']
        : scen === 'curved' ? ['Trouble: a missed nonlinearity.', 'The residuals bend in a clear U instead of scattering flat. The straight-line model is leaving structure on the table; add a term or transform.']
        : ['Healthy.', 'Residuals scatter in a flat, even band around zero with no pattern - exactly what the assumptions want. Constant variance, no missed curve.'];
      read.innerHTML = '<b style="color:' + (scen === 'healthy' ? P.acc : P.bad) + '">' + msg[0] + '</b> ' + msg[1];
    }

    u.wireSeg(el.querySelector('.rp-seg'), function (v) { scen = v; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Residual diagnostics. Build a fit, then read its plots: a healthy model',
      '# shows a flat, even band of residuals; a funnel or a curve is a warning.',
      'set.seed(7)',
      'x <- runif(60, 1, 10)',
      'y <- 3 + 1.5 * x + rnorm(60, 0, 1.2)        # a well-behaved linear relationship',
      'fit <- lm(y ~ x)',
      '',
      'par(mfrow = c(1, 2))',
      'plot(fit, which = 1)                         # residuals vs fitted (look for a flat band)',
      'plot(fit, which = 2)                         # normal Q-Q (points on the line = normal)',
      'par(mfrow = c(1, 1))'
    ].join('\n');
  }

  window.LessonWidgets.register('residual-plot', mount);
})();
