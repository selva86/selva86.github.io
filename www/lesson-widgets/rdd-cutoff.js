/* rdd-cutoff.js - sharp regression discontinuity, made visible. Units are treated only when
 * a running variable crosses a cutoff (a test score, an income threshold, an age). Just below
 * and just above the cutoff, units are near-identical except for treatment, so the vertical
 * JUMP in the fitted outcome at the cutoff is the causal effect. Fit a separate local line on
 * each side within a bandwidth and read the gap; a naive treated-minus-control difference is
 * biased by the slope in the running variable. Toggle the bandwidth and watch the estimate and
 * its wobble trade off. Emits the two local lm() fits in base R.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  var BW = { narrow: 0.3, medium: 0.6, wide: 1.0 };

  function build() {
    var r = rng(2), spare = null;
    function rnorm() { if (spare !== null) { var v = spare; spare = null; return v; } var a = Math.max(r(), 1e-12), b = r(), m = Math.sqrt(-2 * Math.log(a)); spare = m * Math.sin(2 * Math.PI * b); return m * Math.cos(2 * Math.PI * b); }
    var pts = [];
    for (var i = 0; i < 500; i++) { var x = r() * 2 - 1, t = x >= 0 ? 1 : 0; pts.push({ x: x, y: 3 + 2 * x + 4 * t + rnorm(), t: t }); }
    return pts;
  }
  function ols(pts) {  // returns {a, b}: y = a + b x
    var n = pts.length; if (n < 2) return { a: 0, b: 0 };
    var mx = 0, my = 0; pts.forEach(function (p) { mx += p.x; my += p.y; }); mx /= n; my /= n;
    var sxy = 0, sxx = 0; pts.forEach(function (p) { sxy += (p.x - mx) * (p.y - my); sxx += (p.x - mx) * (p.x - mx); });
    var b = sxx ? sxy / sxx : 0; return { a: my - b * mx, b: b };
  }

  function mount(el, cfg) {
    cfg = cfg || {}; var band = 'medium'; var pts = build();
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="rd-seg" style="margin-bottom:12px">' + u.seg([{ v: 'narrow', label: 'Narrow band (0.3)' }, { v: 'medium', label: 'Medium (0.6)' }, { v: 'wide', label: 'Wide (1.0)' }], 'medium') + '</div>' +
      '<div class="rd-plot"></div>' +
      '<div class="rd-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Sharp RDD: a local line on each side of the cutoff, base R' });

    var plot = el.querySelector('.rd-plot'), read = el.querySelector('.rd-read');
    var W = 340, H = 200, PADL = 8, PADR = 8, T = 10, Bm = 22;
    function px(x) { return PADL + (x + 1) / 2 * (W - PADL - PADR); }
    function py(y) { return T + (11 - y) / (11 - (-1)) * (H - T - Bm); }
    function draw() {
      var h = BW[band];
      var L = pts.filter(function (p) { return p.x < 0 && p.x >= -h; });
      var Rr = pts.filter(function (p) { return p.x >= 0 && p.x <= h; });
      var fl = ols(L), fr = ols(Rr), jump = fr.a - fl.a;
      var dots = pts.map(function (p) { var inb = Math.abs(p.x) <= h; return '<circle cx="' + px(p.x).toFixed(1) + '" cy="' + py(p.y).toFixed(1) + '" r="1.7" fill="' + (p.t ? P.c0 : P.c1) + '" opacity="' + (inb ? 0.7 : 0.15) + '"/>'; }).join('');
      var x0 = px(0);
      var lseg = '<line x1="' + px(-h).toFixed(1) + '" y1="' + py(fl.a + fl.b * -h).toFixed(1) + '" x2="' + x0.toFixed(1) + '" y2="' + py(fl.a).toFixed(1) + '" stroke="' + P.c1 + '" stroke-width="2.5"/>';
      var rseg = '<line x1="' + x0.toFixed(1) + '" y1="' + py(fr.a).toFixed(1) + '" x2="' + px(h).toFixed(1) + '" y2="' + py(fr.a + fr.b * h).toFixed(1) + '" stroke="' + P.c0 + '" stroke-width="2.5"/>';
      var jseg = '<line x1="' + x0.toFixed(1) + '" y1="' + py(fl.a).toFixed(1) + '" x2="' + x0.toFixed(1) + '" y2="' + py(fr.a).toFixed(1) + '" stroke="' + P.bad + '" stroke-width="3"/>';
      plot.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block;border:1px solid ' + P.line + ';border-radius:8px" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="regression discontinuity">' +
        '<line x1="' + x0.toFixed(1) + '" y1="' + T + '" x2="' + x0.toFixed(1) + '" y2="' + (H - Bm) + '" stroke="' + P.line2 + '" stroke-width="1" stroke-dasharray="2 3"/>' +
        dots + lseg + rseg + jseg +
        '<text x="' + (x0 + 5) + '" y="' + ((py(fl.a) + py(fr.a)) / 2 + 4).toFixed(1) + '" font-family="IBM Plex Sans,sans-serif" font-size="12" font-weight="600" fill="' + P.bad + '">jump ' + jump.toFixed(2) + '</text>' +
        '<text x="' + (x0 - 4) + '" y="' + (H - 8) + '" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">below cutoff</text>' +
        '<text x="' + (x0 + 4) + '" y="' + (H - 8) + '" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">above (treated)</text></svg>';
      read.innerHTML = 'Fitting a line just below and just above the cutoff, the outcome jumps by <b style="color:' + P.bad + '">' + jump.toFixed(2) + '</b> at the threshold (true effect 4). ' +
        (band === 'narrow' ? 'A narrow band uses only points near the cutoff, so it is less biased but noisier.' : band === 'wide' ? 'A wide band borrows far-away points, steadier but biased if the true relationship curves.' : 'The bandwidth trades bias (wide) against variance (narrow); this is the central RDD tuning choice.');
    }
    u.wireSeg(el.querySelector('.rd-seg'), function (v) { band = v; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Sharp regression discontinuity: the outcome jumps at a cutoff. Base R.',
      'set.seed(2)',
      'n <- 500; x <- runif(n, -1, 1)          # running variable, cutoff at 0',
      'treat <- as.integer(x >= 0)             # sharp: treated iff x >= cutoff',
      'y <- 3 + 2 * x + 4 * treat + rnorm(n)    # the TRUE jump at the cutoff is 4',
      '',
      'h <- 0.5                                 # bandwidth: keep points within h of the cutoff',
      'left  <- lm(y ~ x, subset = x < 0 & x >= -h)',
      'right <- lm(y ~ x, subset = x >= 0 & x <=  h)',
      'jump <- predict(right, data.frame(x = 0)) - predict(left, data.frame(x = 0))',
      'round(c(true = 4, rdd = unname(jump),',
      '        naive = mean(y[treat==1]) - mean(y[treat==0])), 2)',
      '#>  true   rdd naive',
      '#>  4.00  3.79  6.09   # naive is biased upward by the slope in x'
    ].join('\n');
  }

  window.LessonWidgets.register('rdd-cutoff', mount);
})();
