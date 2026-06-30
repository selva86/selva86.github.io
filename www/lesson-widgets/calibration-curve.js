/* calibration-curve.js - reliability diagram. Bin predicted probabilities, plot the
 * observed frequency in each bin against the mean predicted probability, and compare
 * to the diagonal (perfect calibration). A slider tilts the model from over- to
 * under-confident so you can see the curve bow away from the diagonal.
 * Emits runnable R that fits a glm, bins its probabilities, and draws the curve.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  function mount(el, cfg) {
    cfg = cfg || {};
    var skew = 1;  // >1 over-confident (probs pushed to extremes), <1 under-confident
    var BINS = [0.1, 0.3, 0.5, 0.7, 0.9];

    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="cc-plot"></div>' +
      '<label style="display:block;font:600 12.5px/1.6 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:12px 0 2px">model confidence <b class="cc-l" style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '"></b>' +
        '<input class="cc-s" type="range" min="0.5" max="2" step="0.05" value="1" style="width:100%;accent-color:' + P.acc + '"></label>' +
      '<div class="cc-read" style="font:13px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:8px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Bin probabilities and draw the reliability curve in R' });

    var plot = el.querySelector('.cc-plot'), read = el.querySelector('.cc-read'),
        slider = el.querySelector('.cc-s'), lEl = el.querySelector('.cc-l');

    function observed(p) { var o = Math.pow(p, skew) / (Math.pow(p, skew) + Math.pow(1 - p, skew)); return o; }
    function draw() {
      var S = 240, m = 34, iw = S - m - 12, ih = S - m - 12;
      function px(x) { return m + x * iw; } function py(y) { return (S - m) - y * ih; }
      var pts = BINS.map(function (p) { return [p, observed(p)]; });
      var line = pts.map(function (q) { return px(q[0]).toFixed(1) + ',' + py(q[1]).toFixed(1); }).join(' ');
      var svg = '<svg viewBox="0 0 ' + S + ' ' + S + '" width="100%" style="max-width:' + S + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="reliability diagram">';
      svg += '<rect x="' + m + '" y="10" width="' + iw + '" height="' + ih + '" fill="#fbfcfb" stroke="' + P.line + '"/>';
      svg += '<line x1="' + m + '" y1="' + (S - m) + '" x2="' + (m + iw) + '" y2="10" stroke="' + P.mut + '" stroke-dasharray="4 3"/>';
      svg += '<polyline points="' + line + '" fill="none" stroke="' + P.c0 + '" stroke-width="2.5"/>';
      pts.forEach(function (q) { svg += '<circle cx="' + px(q[0]).toFixed(1) + '" cy="' + py(q[1]).toFixed(1) + '" r="4.5" fill="' + P.acc + '" stroke="#fff" stroke-width="1.3"/>'; });
      svg += '<text x="' + (m + iw / 2) + '" y="' + (S - 6) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.mut + '">mean predicted probability</text>';
      svg += '<text transform="translate(11,' + (10 + ih / 2) + ') rotate(-90)" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.mut + '">observed frequency</text>';
      svg += '</svg>';
      plot.innerHTML = svg;
      var state = Math.abs(skew - 1) < 0.06 ? 'well calibrated - points sit on the diagonal, so a predicted 0.7 really does happen about 70% of the time'
        : (skew > 1 ? 'over-confident - the curve bows below the diagonal, so high predictions happen less often than claimed'
                    : 'under-confident - the curve bows above the diagonal, so the model hedges when it could be surer');
      read.innerHTML = 'This model is <b>' + state + '</b>. Calibration (Platt or isotonic) bends the curve back onto the diagonal.';
      lEl.textContent = skew > 1.06 ? 'over-confident' : (skew < 0.94 ? 'under-confident' : 'calibrated');
    }
    slider.addEventListener('input', function () { skew = +slider.value; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# A reliability diagram bins predictions, then asks: of the cases I called ~0.7,',
      '# what fraction were actually positive? Calibrated => that fraction is ~0.7.',
      'set.seed(1)',
      'n <- 600; x <- rnorm(n)',
      'p_true <- plogis(1.2 * x)              # the real probability',
      'y <- rbinom(n, 1, p_true)',
      'fit <- glm(y ~ x, family = binomial)',
      'p_hat <- predict(fit, type = "response")',
      '',
      'bins <- cut(p_hat, breaks = seq(0, 1, by = 0.1), include.lowest = TRUE)',
      'cal  <- data.frame(',
      '  predicted = tapply(p_hat, bins, mean),',
      '  observed  = tapply(y,     bins, mean))',
      'cal <- cal[complete.cases(cal), ]',
      '',
      'plot(cal$predicted, cal$observed, type = "b", pch = 19,',
      '     xlim = 0:1, ylim = 0:1, xlab = "predicted", ylab = "observed")',
      'abline(0, 1, lty = 2)                  # perfect calibration',
      'cal'
    ].join('\n');
  }

  window.LessonWidgets.register('calibration-curve', mount);
})();
