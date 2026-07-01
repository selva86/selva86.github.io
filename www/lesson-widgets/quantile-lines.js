/* quantile-lines.js - one regression line is not enough when the spread changes. Income
 * fans out with experience: juniors cluster tight, seniors range from modest to huge.
 * OLS draws a single line through the middle and hides that. Quantile regression draws a
 * line for the 10th, 50th and 90th percentile; because they fan apart, you can read the
 * whole conditional distribution, not just its mean. Toggle a quantile to highlight it.
 * Emits runnable base-R that fits a quantile line by minimizing the pinball (check) loss.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  // heteroskedastic fan: y spread grows with x
  var D = (function () {
    var a = [], s = 5; function r() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff - 0.5; }
    for (var i = 0; i < 90; i++) { var x = 1 + (i / 89) * 18; a.push({ x: x, y: 20 + 2.2 * x + r() * (6 + 2.4 * x) }); }
    return a;
  })();
  // fanned quantile lines (intercept, slope) matched to the generator
  var Q = { '0.1': [16, 1.0], '0.5': [20, 2.2], '0.9': [24, 3.4] };

  function mount(el, cfg) {
    cfg = cfg || {}; var tau = '0.5';
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="ql-seg" style="margin-bottom:12px">' + u.seg([{ v: '0.1', label: '10th %ile' }, { v: '0.5', label: 'median' }, { v: '0.9', label: '90th %ile' }], '0.5') + '</div>' +
      '<div class="ql-plot"></div>' +
      '<div class="ql-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'A quantile line by minimizing the pinball loss (base R)' });

    var plot = el.querySelector('.ql-plot'), read = el.querySelector('.ql-read');
    var W = 440, H = 250, m = { l: 42, r: 12, t: 12, b: 30 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
    var xe = [0, 20], ye = [0, 120];
    function sx(x) { return m.l + (x - xe[0]) / (xe[1] - xe[0]) * iw; }
    function sy(y) { return m.t + ih - (y - ye[0]) / (ye[1] - ye[0]) * ih; }
    function draw() {
      var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="quantile regression">';
      svg += '<line x1="' + m.l + '" y1="' + (m.t + ih) + '" x2="' + (m.l + iw) + '" y2="' + (m.t + ih) + '" stroke="' + P.line + '"/><line x1="' + m.l + '" y1="' + m.t + '" x2="' + m.l + '" y2="' + (m.t + ih) + '" stroke="' + P.line + '"/>';
      D.forEach(function (d) { svg += '<circle cx="' + sx(d.x).toFixed(1) + '" cy="' + sy(d.y).toFixed(1) + '" r="3" fill="' + P.c0 + '" opacity="0.4"/>'; });
      ['0.1', '0.5', '0.9'].forEach(function (q) { var b = Q[q], on = q === tau, col = on ? P.acc : P.faint;
        svg += '<line x1="' + sx(xe[0]) + '" y1="' + sy(b[0] + b[1] * xe[0]) + '" x2="' + sx(xe[1]) + '" y2="' + sy(b[0] + b[1] * xe[1]) + '" stroke="' + col + '" stroke-width="' + (on ? 3 : 1.8) + '"/>';
        svg += '<text x="' + (sx(xe[1]) - 3) + '" y="' + (sy(b[0] + b[1] * xe[1]) - 4).toFixed(1) + '" text-anchor="end" font-family="IBM Plex Mono,monospace" font-size="10" fill="' + col + '">&tau;=' + q + '</text>'; });
      svg += '<text x="' + (m.l + iw / 2) + '" y="' + (H - 4) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.mut + '">years of experience</text>';
      svg += '<text transform="translate(12,' + (m.t + ih / 2) + ') rotate(-90)" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.mut + '">income</text>';
      svg += '</svg>'; plot.innerHTML = svg;
      var b = Q[tau];
      read.innerHTML = tau === '0.5'
        ? 'The <b>median</b> line (slope ' + b[1].toFixed(1) + ') is close to what OLS would give. But it is only the middle of the story.'
        : '<b style="color:' + P.acc + '">The &tau;=' + tau + ' line has slope ' + b[1].toFixed(1) + '.</b> The 90th-percentile line rises far steeper than the 10th: each extra year of experience buys the top earners much more than the bottom. The lines <b>fan apart</b> because the spread grows with x, which a single OLS line can never show.';
    }
    u.wireSeg(el.querySelector('.ql-seg'), function (v) { tau = v; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Quantile regression fits a line to a percentile by minimizing the pinball loss.',
      'set.seed(5); n <- 300',
      'x <- runif(n, 1, 19)',
      'y <- 20 + 2.2 * x + rnorm(n) * (6 + 2.4 * x)   # spread grows with x (heteroskedastic)',
      '',
      'pinball <- function(b, tau) { r <- y - (b[1] + b[2]*x); sum(r * (tau - (r < 0))) }',
      'fit_q  <- function(tau) optim(c(20, 2), pinball, tau = tau)$par',
      'rbind(q10 = fit_q(0.1), median = fit_q(0.5), q90 = fit_q(0.9))',
      '# the slope rises across quantiles: the top earners gain more per year than the bottom.'
    ].join('\n');
  }

  window.LessonWidgets.register('quantile-lines', mount);
})();
