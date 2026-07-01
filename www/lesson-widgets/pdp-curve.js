/* pdp-curve.js - partial dependence + ICE. Faint lines are individual rows (ICE): how
 * one row's prediction changes as we sweep a single feature, holding its other values
 * fixed. The bold line is their average - the partial-dependence curve. Seeing the ICE
 * spread shows when the average hides interactions. Emits runnable R that builds a PDP
 * by sweeping a feature and averaging predictions.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  // an S-shaped average effect with per-row ICE offsets/steepness (interaction)
  var GRID = []; for (var g = 0; g <= 20; g++) GRID.push(g / 20);
  var ROWS = [
    { off: 0.00, k: 6 }, { off: 0.10, k: 5 }, { off: -0.08, k: 7 },
    { off: 0.18, k: 9 }, { off: -0.14, k: 4 }, { off: 0.04, k: 6 }
  ];
  function f(x, r) { return 0.5 + r.off + 0.42 * Math.tanh(r.k * (x - 0.5)); }

  function mount(el, cfg) {
    cfg = cfg || {};
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="pd-plot"></div>' +
      '<div style="font:13px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:10px 0 14px">Each <span style="color:' + P.mut + '">faint line</span> is one row\'s prediction as the feature sweeps left to right (an <b>ICE</b> curve). The <b style="color:' + P.acc + '">bold line</b> is their average - the <b>partial-dependence</b> curve. When the faint lines fan out instead of running parallel, the feature interacts with others and the average alone would mislead.</div>' +
      u.runnable(rcode(), { label: 'Build a partial-dependence curve in R' });

    var S = 260, W = 420, m = 34, iw = W - m - 14, ih = S - m - 14;
    function px(x) { return m + x * iw; } function py(y) { return (S - m) - y * ih; }
    var svg = '<svg viewBox="0 0 ' + W + ' ' + S + '" width="100%" style="max-width:' + W + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="partial dependence with ICE curves">';
    svg += '<rect x="' + m + '" y="10" width="' + iw + '" height="' + ih + '" fill="#fbfcfb" stroke="' + P.line + '"/>';
    // ICE lines
    ROWS.forEach(function (r) {
      var pts = GRID.map(function (x) { return px(x).toFixed(1) + ',' + py(f(x, r)).toFixed(1); }).join(' ');
      svg += '<polyline points="' + pts + '" fill="none" stroke="' + P.mut + '" stroke-width="1" opacity="0.45"/>';
    });
    // PDP = average
    var avg = GRID.map(function (x) { var s = 0; ROWS.forEach(function (r) { s += f(x, r); }); return px(x).toFixed(1) + ',' + py(s / ROWS.length).toFixed(1); }).join(' ');
    svg += '<polyline points="' + avg + '" fill="none" stroke="' + P.acc + '" stroke-width="3"/>';
    svg += '<text x="' + (m + iw / 2) + '" y="' + (S - 6) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.mut + '">feature value</text>';
    svg += '<text transform="translate(11,' + (10 + ih / 2) + ') rotate(-90)" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.mut + '">predicted outcome</text>';
    svg += '</svg>';
    el.querySelector('.pd-plot').innerHTML = svg;
  }

  function rcode() {
    return [
      '# Partial dependence: sweep ONE feature across a grid, holding the rest at their',
      '# real values, predict for every row, and average. The average is the PDP.',
      'set.seed(1)',
      'n <- 300',
      'd <- data.frame(x1 = runif(n), x2 = runif(n))',
      'd$y <- 1 / (1 + exp(-6 * (d$x1 - 0.5))) + 0.4 * d$x2 + rnorm(n, 0, 0.1)',
      'fit <- lm(y ~ poly(x1, 3) + x2, data = d)',
      '',
      'grid <- seq(0, 1, length.out = 25)',
      'pdp <- sapply(grid, function(v) {',
      '  tmp <- d; tmp$x1 <- v             # force x1 = v for every row',
      '  mean(predict(fit, tmp))           # average the predictions',
      '})',
      'plot(grid, pdp, type = "l", lwd = 2, xlab = "x1", ylab = "avg prediction")'
    ].join('\n');
  }

  window.LessonWidgets.register('pdp-curve', mount);
})();
