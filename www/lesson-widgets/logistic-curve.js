/* logistic-curve.js - logistic regression as a probability + a threshold.
 * The S-curve maps a feature to P(y=1). Slide the decision threshold: the cutoff
 * x moves, points flip class, and the false positives / false negatives trade off.
 * Emits runnable R that fits glm(family=binomial) and draws the same curve.
 *
 * cfg: { }  - renders from {}.
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  var XS = [1, 2, 2.5, 3, 4, 4.5, 5.5, 6, 7, 7.5, 8, 9];
  var YS = [0, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 1];
  var B0 = -5.5, B1 = 1.1;                         // an illustrative fit; R computes the real one
  function prob(x) { return 1 / (1 + Math.exp(-(B0 + B1 * x))); }

  function mount(el, cfg) {
    cfg = cfg || {};
    var thr = 0.5;

    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="lc-chart"></div>' +
      '<label style="display:block;font:600 12.5px/1.6 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:12px 0 2px">decision threshold <b class="lc-t" style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '"></b>' +
        '<input class="lc-s" type="range" min="0.05" max="0.95" step="0.01" value="' + thr + '" style="width:100%;accent-color:' + P.acc + '"></label>' +
      '<div class="lc-read" style="font:13px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:8px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Fit the logistic model for real in R' });

    var chart = el.querySelector('.lc-chart'), read = el.querySelector('.lc-read'),
        slider = el.querySelector('.lc-s'), tEl = el.querySelector('.lc-t');

    function draw() {
      var W = 480, H = 268, m = { t: 16, r: 14, b: 36, l: 44 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
      var xlo = 0, xhi = 10;
      function sx(x) { return m.l + (x - xlo) / (xhi - xlo) * iw; }
      function sy(p) { return m.t + ih - p * ih; }
      var bound = (Math.log(thr / (1 - thr)) - B0) / B1;       // x where prob == threshold
      var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="logistic curve with threshold">';
      svg += '<line x1="' + m.l + '" y1="' + (m.t + ih) + '" x2="' + (m.l + iw) + '" y2="' + (m.t + ih) + '" stroke="' + P.line + '" stroke-width="1.5"/>';
      svg += '<line x1="' + m.l + '" y1="' + m.t + '" x2="' + m.l + '" y2="' + (m.t + ih) + '" stroke="' + P.line + '" stroke-width="1.5"/>';
      [0, 0.5, 1].forEach(function (g) { svg += '<line x1="' + m.l + '" y1="' + sy(g).toFixed(1) + '" x2="' + (m.l + iw) + '" y2="' + sy(g).toFixed(1) + '" stroke="' + P.line2 + '"/><text x="' + (m.l - 7) + '" y="' + (sy(g) + 3).toFixed(1) + '" text-anchor="end" font-family="IBM Plex Mono,monospace" font-size="9" fill="' + P.mut + '">' + g + '</text>'; });
      // the S-curve
      var curve = ''; for (var x = xlo; x <= xhi + 0.001; x += 0.1) curve += sx(x).toFixed(1) + ',' + sy(prob(x)).toFixed(1) + ' ';
      svg += '<polyline points="' + curve.trim() + '" fill="none" stroke="' + P.c0 + '" stroke-width="2.6"/>';
      // boundary + threshold
      svg += '<line x1="' + m.l + '" y1="' + sy(thr).toFixed(1) + '" x2="' + (m.l + iw) + '" y2="' + sy(thr).toFixed(1) + '" stroke="' + P.mut + '" stroke-dasharray="4 3"/>';
      if (bound > xlo && bound < xhi) svg += '<line x1="' + sx(bound).toFixed(1) + '" y1="' + m.t + '" x2="' + sx(bound).toFixed(1) + '" y2="' + (m.t + ih) + '" stroke="' + P.ink + '" stroke-width="1" opacity=".4"/>';
      // points: actual class on rows y=0 (bottom) / y=1 (top), colored by correct/incorrect
      var tp = 0, fp = 0, tn = 0, fn = 0;
      XS.forEach(function (x, i) {
        var pred = prob(x) >= thr ? 1 : 0, act = YS[i], ok = pred === act;
        if (act === 1 && pred === 1) tp++; else if (act === 0 && pred === 1) fp++; else if (act === 0 && pred === 0) tn++; else fn++;
        svg += '<circle cx="' + sx(x).toFixed(1) + '" cy="' + sy(act ? 0.97 : 0.03).toFixed(1) + '" r="5.5" fill="' + (ok ? P.acc : P.bad) + '" fill-opacity="0.85"/>';
      });
      svg += '<text x="' + (m.l + iw / 2) + '" y="' + (H - 4) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="11" fill="' + P.mut + '">feature x &rarr;</text>';
      svg += '<text transform="translate(11,' + (m.t + ih / 2) + ') rotate(-90)" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="11" fill="' + P.mut + '">P(y = 1)</text>';
      svg += '</svg>';
      chart.innerHTML = svg;

      read.innerHTML = 'Predict 1 when the curve is above the threshold. At <b style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '">' + thr.toFixed(2) +
        '</b>: <b style="color:' + P.bad + '">' + fp + ' false positive' + (fp === 1 ? '' : 's') + '</b>, <b style="color:' + P.bad + '">' + fn + ' false negative' + (fn === 1 ? '' : 's') +
        '</b>. Lower the threshold to catch more 1s (fewer false negatives, more false positives); raise it for the reverse. The S-curve is fixed; only the cutoff moves.';
      tEl.textContent = thr.toFixed(2);
    }

    slider.addEventListener('input', function () { thr = +slider.value; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Logistic regression models a PROBABILITY with an S-curve, then a threshold',
      '# turns that probability into a class.',
      'x <- c(1, 2, 2.5, 3, 4, 4.5, 5.5, 6, 7, 7.5, 8, 9)',
      'y <- c(0, 0, 0,   0, 0, 1,   0,   1, 1, 1,   1, 1)',
      'fit <- glm(y ~ x, family = binomial)',
      'coef(fit)                                   # intercept and slope (log-odds)',
      '',
      'p <- predict(fit, type = "response")        # fitted probabilities',
      'plot(x, y, pch = 19, ylab = "P(y = 1)")',
      'curve(predict(fit, data.frame(x = x), type = "response"),',
      '      add = TRUE, col = "steelblue", lwd = 2)',
      'table(predicted = as.integer(p >= 0.5), actual = y)   # try 0.3 or 0.7'
    ].join('\n');
  }

  window.LessonWidgets.register('logistic-curve', mount);
})();
