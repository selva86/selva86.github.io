/* ordinal-cumlogit.js - modeling an ordered outcome without pretending it is a number.
 * Satisfaction is low < medium < high: the order matters, but the gaps are not real
 * distances, so plain regression is wrong. A proportional-odds model gives each response a
 * probability that shifts smoothly as a predictor rises. Slide the predictor and watch the
 * stacked bands move mass from "low" up to "high". Emits runnable R fitting MASS::polr.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  var CATS = ['low', 'medium', 'high'];
  var COL = [P.c1, P.faint, P.acc];
  var BETA = 1.1, CUT = [-1.2, 1.0];   // proportional-odds: shared slope, two cutpoints
  function invlogit(z) { return 1 / (1 + Math.exp(-z)); }
  function probs(x) {
    var eta = BETA * x;
    var c1 = invlogit(CUT[0] - eta), c2 = invlogit(CUT[1] - eta);   // cumulative P(<=k)
    return [c1, c2 - c1, 1 - c2];
  }

  function mount(el, cfg) {
    cfg = cfg || {}; var xv = 0;
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="oc-plot"></div>' +
      '<label style="display:block;font:600 12px/1.6 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:12px 0 2px">predictor (e.g. price cut, service quality) <b class="oc-v" style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '"></b>' +
        '<input class="oc-s" type="range" min="-3" max="3" step="0.1" value="0" style="width:100%;accent-color:' + P.acc + '"></label>' +
      '<div class="oc-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'A proportional-odds model with MASS::polr()' });

    var plot = el.querySelector('.oc-plot'), read = el.querySelector('.oc-read'), slider = el.querySelector('.oc-s'), vEl = el.querySelector('.oc-v');
    var W = 440, H = 210, m = { l: 40, r: 90, t: 12, b: 26 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
    function draw() {
      // stacked bands across the predictor range + a marker at xv
      var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="ordinal category probabilities">';
      var N = 60, sx = function (i) { return m.l + i / N * iw; };
      // build cumulative band polygons
      var lowerY = []; for (var i = 0; i <= N; i++) lowerY.push(m.t + ih);
      for (var c = 0; c < 3; c++) {
        var top = [], bot = [];
        for (var j = 0; j <= N; j++) { var x = -3 + 6 * j / N, pr = probs(x); var cum = 0; for (var cc = 0; cc <= c; cc++) cum += pr[cc]; var y = m.t + ih - cum * ih; top.push(sx(j) + ',' + y.toFixed(1)); }
        for (var k = N; k >= 0; k--) bot.push(sx(k) + ',' + lowerY[k].toFixed(1));
        svg += '<polygon points="' + top.join(' ') + ' ' + bot.join(' ') + '" fill="' + COL[c] + '" opacity="0.8"/>';
        for (var jj = 0; jj <= N; jj++) { var x2 = -3 + 6 * jj / N, pr2 = probs(x2), cum2 = 0; for (var c2 = 0; c2 <= c; c2++) cum2 += pr2[c2]; lowerY[jj] = m.t + ih - cum2 * ih; }
      }
      // marker
      var mi = (xv + 3) / 6 * N; svg += '<line x1="' + sx(mi).toFixed(1) + '" y1="' + m.t + '" x2="' + sx(mi).toFixed(1) + '" y2="' + (m.t + ih) + '" stroke="' + P.ink + '" stroke-width="1.5"/>';
      // legend
      CATS.forEach(function (nm, i) { svg += '<rect x="' + (m.l + iw + 14) + '" y="' + (m.t + 6 + i * 20) + '" width="12" height="12" rx="2" fill="' + COL[i] + '"/><text x="' + (m.l + iw + 30) + '" y="' + (m.t + 16 + i * 20) + '" font-family="IBM Plex Sans,sans-serif" font-size="11" fill="' + P.body + '">' + nm + '</text>'; });
      svg += '<text x="' + (m.l + iw / 2) + '" y="' + (H - 3) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">predictor value</text>';
      svg += '</svg>'; plot.innerHTML = svg;
      var pr = probs(xv);
      vEl.textContent = xv.toFixed(1);
      read.innerHTML = 'At this predictor value: P(low) <b>' + (pr[0] * 100).toFixed(0) + '%</b>, P(medium) <b>' + (pr[1] * 100).toFixed(0) + '%</b>, P(high) <b style="color:' + P.acc + '">' + (pr[2] * 100).toFixed(0) + '%</b>. ' +
        'As the predictor rises, probability flows steadily from "low" up to "high". The <b>proportional-odds</b> assumption is that one slope drives every cutpoint, so the bands shift together and never cross.';
    }
    slider.addEventListener('input', function () { xv = +slider.value; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# An ordered outcome (low < medium < high) modeled with proportional odds.',
      'library(MASS)',
      'set.seed(1); n <- 600',
      'x <- rnorm(n)',
      'eta <- 1.1 * x',
      'p_le1 <- plogis(-1.2 - eta); p_le2 <- plogis(1.0 - eta)   # cumulative probs',
      'u <- runif(n)',
      'y <- factor(ifelse(u < p_le1, "low", ifelse(u < p_le2, "medium", "high")),',
      '            levels = c("low","medium","high"), ordered = TRUE)',
      '',
      'm <- polr(y ~ x, Hess = TRUE)',
      'coef(m)          # one slope; positive x shifts mass toward "high"'
    ].join('\n');
  }

  window.LessonWidgets.register('ordinal-cumlogit', mount);
})();
