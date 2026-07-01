/* bias-variance.js - the bias-variance tradeoff.
 * Slide model complexity (polynomial degree): training error falls monotonically
 * while test error traces a U (underfit -> best -> overfit). Emits runnable R that
 * fits polynomials of increasing degree to noisy data and plots the same two curves.
 *
 * cfg: { maxDegree=12, start=3 }  - all optional; renders from {}.
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  function mount(el, cfg) {
    cfg = cfg || {};
    var MAX = Math.max(4, +cfg.maxDegree || 12);
    var deg = Math.min(MAX, Math.max(1, +cfg.start || 3));

    // Deterministic, illustrative error curves (the intuition; the R block below is the real fit).
    // train error falls and flattens; test error = bias^2 (falls) + variance (rises) + noise.
    function errs(d) {
      var noise = 0.18;
      var test = noise + 1.55 / d + 0.05 * d;            // U-shape
      var train = noise * 0.6 + 1.35 / (d + 1.1) - 0.025 * d;
      return { train: Math.max(0.04, train), test: test };
    }
    var DS = []; for (var d = 1; d <= MAX; d++) { var e = errs(d); DS.push({ d: d, train: e.train, test: e.test }); }
    var bestD = DS.reduce(function (b, r) { return r.test < b.test ? r : b; }, DS[0]).d;

    // ---- layout ----
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:0 0 12px">' +
        '<label style="font:600 12.5px/1 IBM Plex Sans,sans-serif;color:' + P.body + '">Model complexity (polynomial degree): ' +
          '<b class="bv-deg" style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '">' + deg + '</b></label>' +
        '<span class="bv-tag" style="font:700 11px/1 IBM Plex Mono,monospace;letter-spacing:.04em;text-transform:uppercase;padding:4px 9px;border-radius:6px"></span>' +
      '</div>' +
      '<input class="bv-slider" type="range" min="1" max="' + MAX + '" value="' + deg + '" step="1" style="width:100%;accent-color:' + P.acc + ';margin:0 0 6px">' +
      '<div class="bv-chart"></div>' +
      '<div class="bv-read" style="font:13px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Fit it for real: the bias-variance U-curve in R' });

    var chart = el.querySelector('.bv-chart'),
        read = el.querySelector('.bv-read'),
        tag = el.querySelector('.bv-tag'),
        degEl = el.querySelector('.bv-deg'),
        slider = el.querySelector('.bv-slider');

    function draw() {
      var W = 480, H = 250, m = { t: 14, r: 14, b: 36, l: 44 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
      var maxY = Math.max.apply(null, DS.map(function (r) { return r.test; })) * 1.08;
      function sx(dd) { return m.l + (dd - 1) / (MAX - 1) * iw; }
      function sy(v) { return m.t + ih - v / maxY * ih; }
      function poly(key, col) {
        return '<polyline points="' + DS.map(function (r) { return sx(r.d).toFixed(1) + ',' + sy(r[key]).toFixed(1); }).join(' ') +
          '" fill="none" stroke="' + col + '" stroke-width="2.5"/>';
      }
      var cur = DS[deg - 1];
      var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="bias-variance error curves">';
      // axes
      svg += '<line x1="' + m.l + '" y1="' + (m.t + ih) + '" x2="' + (m.l + iw) + '" y2="' + (m.t + ih) + '" stroke="' + P.line + '" stroke-width="1.5"/>';
      svg += '<line x1="' + m.l + '" y1="' + m.t + '" x2="' + m.l + '" y2="' + (m.t + ih) + '" stroke="' + P.line + '" stroke-width="1.5"/>';
      // best-fit band
      svg += '<line x1="' + sx(bestD).toFixed(1) + '" y1="' + m.t + '" x2="' + sx(bestD).toFixed(1) + '" y2="' + (m.t + ih) + '" stroke="' + P.line + '" stroke-dasharray="3 3"/>';
      svg += '<text x="' + sx(bestD).toFixed(1) + '" y="' + (m.t + 9) + '" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="9" fill="' + P.faint + '">sweet spot</text>';
      // curves
      svg += poly('test', P.c1) + poly('train', P.acc);
      // current-degree marker
      svg += '<line x1="' + sx(deg).toFixed(1) + '" y1="' + m.t + '" x2="' + sx(deg).toFixed(1) + '" y2="' + (m.t + ih) + '" stroke="' + P.ink + '" stroke-width="1" opacity=".35"/>';
      svg += '<circle cx="' + sx(deg).toFixed(1) + '" cy="' + sy(cur.test).toFixed(1) + '" r="5" fill="' + P.c1 + '"/>';
      svg += '<circle cx="' + sx(deg).toFixed(1) + '" cy="' + sy(cur.train).toFixed(1) + '" r="5" fill="' + P.acc + '"/>';
      // labels
      svg += '<text x="' + (m.l + iw / 2) + '" y="' + (H - 5) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="11" fill="' + P.mut + '">model complexity &rarr;</text>';
      svg += '<text transform="translate(11,' + (m.t + ih / 2) + ') rotate(-90)" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="11" fill="' + P.mut + '">prediction error</text>';
      // legend
      svg += '<rect x="' + (m.l + 8) + '" y="' + (m.t + 4) + '" width="10" height="10" rx="2" fill="' + P.c1 + '"/><text x="' + (m.l + 22) + '" y="' + (m.t + 13) + '" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.body + '">test</text>';
      svg += '<rect x="' + (m.l + 58) + '" y="' + (m.t + 4) + '" width="10" height="10" rx="2" fill="' + P.acc + '"/><text x="' + (m.l + 72) + '" y="' + (m.t + 13) + '" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.body + '">train</text>';
      svg += '</svg>';
      chart.innerHTML = svg;

      var state = deg <= Math.max(1, bestD - 2) ? ['Underfitting', P.c0, '#e8f0f9', 'Too simple: high bias. The model misses the real pattern, so both train and test error are high.']
        : deg >= bestD + 2 ? ['Overfitting', P.bad, P.del, 'Too flexible: high variance. Train error keeps falling, but the model is memorizing noise and test error climbs.']
        : ['About right', P.acc, P.add, 'Near the sweet spot: enough flexibility to fit the signal, not so much that it chases noise. Test error is at its lowest.'];
      tag.textContent = state[0]; tag.style.color = state[1]; tag.style.background = state[2];
      read.innerHTML = state[3] + ' <b style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '">train ' + cur.train.toFixed(2) + ' &middot; test ' + cur.test.toFixed(2) + '</b>';
      degEl.textContent = deg;
    }

    slider.addEventListener('input', function () { deg = +slider.value; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# The bias-variance tradeoff: fit polynomials of rising degree to noisy data,',
      '# then watch train error fall while test error traces a U.',
      'set.seed(1)',
      'n  <- 120',
      'x  <- sort(runif(n, -3, 3))',
      'y  <- sin(x) + rnorm(n, 0, 0.35)          # true signal + noise',
      'train <- data.frame(x = x[1:80],  y = y[1:80])',
      'test  <- data.frame(x = x[81:n],  y = y[81:n])',
      '',
      'deg <- 1:12',
      'err <- sapply(deg, function(d) {',
      '  fit <- lm(y ~ poly(x, d), data = train)',
      '  c(train = sqrt(mean((train$y - predict(fit))^2)),',
      '    test  = sqrt(mean((test$y  - predict(fit, test))^2)))',
      '})',
      '',
      'plot(deg, err["test", ], type = "b", col = "darkorange", lwd = 2,',
      '     ylim = range(err), xlab = "polynomial degree (complexity)", ylab = "RMSE")',
      'lines(deg, err["train", ], type = "b", col = "forestgreen", lwd = 2)',
      'legend("topright", c("test error", "train error"),',
      '       col = c("darkorange", "forestgreen"), lwd = 2, bty = "n")'
    ].join('\n');
  }

  window.LessonWidgets.register('bias-variance', mount);
})();
