/* conformal-bands.js - split conformal prediction intervals, made visible.
 * Fit a model, then set a band half-width from a high quantile of the calibration residuals. The
 * band y-hat +/- q-hat is guaranteed to cover at least the target fraction of new points, with no
 * assumption about the error distribution. Raise the target coverage and watch the band widen and
 * the empirical coverage track the target. Emits split conformal from scratch in base R.
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function gauss(r) { return Math.sqrt(-2 * Math.log(Math.max(r(), 1e-9))) * Math.cos(6.2831853 * r()); }

  // linear data: y = 2 + 1.5 x + noise; split into a calibration set and a test set
  function build() {
    var r = rng(4), cal = [], te = [], i, x;
    for (i = 0; i < 120; i++) { x = 10 * r(); cal.push([x, 2 + 1.5 * x + 2 * gauss(r)]); }
    for (i = 0; i < 120; i++) { x = 10 * r(); te.push([x, 2 + 1.5 * x + 2 * gauss(r)]); }
    return { cal: cal, te: te };
  }
  function ols(pts) {
    var n = pts.length, mx = 0, my = 0, i;
    for (i = 0; i < n; i++) { mx += pts[i][0]; my += pts[i][1]; } mx /= n; my /= n;
    var sxy = 0, sxx = 0, dx;
    for (i = 0; i < n; i++) { dx = pts[i][0] - mx; sxy += dx * (pts[i][1] - my); sxx += dx * dx; }
    var b = sxy / sxx, a = my - b * mx;
    return function (x) { return a + b * x; };
  }
  function qConformal(res, alpha) {              // the split-conformal quantile of |residuals|
    var s = res.slice().sort(function (a, b) { return a - b; }), n = s.length;
    var k = Math.ceil((n + 1) * (1 - alpha));    // rank guaranteeing coverage
    return s[Math.min(n - 1, k - 1)];
  }

  var LV = { '0.8': { a: 0.2, pct: '80%' }, '0.9': { a: 0.1, pct: '90%' }, '0.95': { a: 0.05, pct: '95%' } };

  function mount(el, cfg) {
    cfg = cfg || {}; var d = build(), f = ols(d.cal), level = '0.9';
    var resCal = d.cal.map(function (p) { return Math.abs(p[1] - f(p[0])); });
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="cb-seg" style="margin-bottom:12px">' + u.seg([{ v: '0.8', label: 'Target 80%' }, { v: '0.9', label: 'Target 90%' }, { v: '0.95', label: 'Target 95%' }], '0.9') + '</div>' +
      '<div class="cb-plot"></div>' +
      '<div class="cb-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Split conformal prediction: guaranteed-coverage band, base R' });

    var plot = el.querySelector('.cb-plot'), read = el.querySelector('.cb-read');
    var W = 340, H = 220, PAD = 26;
    var ally = d.cal.concat(d.te).map(function (p) { return p[1]; });
    var ymin = Math.min.apply(null, ally) - 1, ymax = Math.max.apply(null, ally) + 1;
    function sx(x) { return PAD + x / 10 * (W - PAD - 8); }
    function sy(y) { return H - PAD - (y - ymin) / (ymax - ymin) * (H - PAD - 8); }

    function draw() {
      var a = LV[level].a, qhat = qConformal(resCal, a);
      var xs = [0, 10];
      var band = '<polygon points="' + sx(xs[0]).toFixed(1) + ',' + sy(f(xs[0]) + qhat).toFixed(1) + ' ' + sx(xs[1]).toFixed(1) + ',' + sy(f(xs[1]) + qhat).toFixed(1) + ' ' + sx(xs[1]).toFixed(1) + ',' + sy(f(xs[1]) - qhat).toFixed(1) + ' ' + sx(xs[0]).toFixed(1) + ',' + sy(f(xs[0]) - qhat).toFixed(1) + '" fill="' + P.acc + '" fill-opacity="0.12"/>';
      var line = '<line x1="' + sx(xs[0]).toFixed(1) + '" y1="' + sy(f(xs[0])).toFixed(1) + '" x2="' + sx(xs[1]).toFixed(1) + '" y2="' + sy(f(xs[1])).toFixed(1) + '" stroke="' + P.acc + '" stroke-width="1.5"/>';
      var inside = 0;
      var dots = d.te.map(function (p) {
        var yhat = f(p[0]), inb = Math.abs(p[1] - yhat) <= qhat; if (inb) inside++;
        return '<circle cx="' + sx(p[0]).toFixed(1) + '" cy="' + sy(p[1]).toFixed(1) + '" r="2.6" fill="' + (inb ? P.c0 : P.bad) + '" opacity="' + (inb ? 0.6 : 0.95) + '"/>';
      }).join('');
      var cover = inside / d.te.length;
      plot.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block;border:1px solid ' + P.line + ';border-radius:8px" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="conformal prediction band">' +
        '<line x1="' + PAD + '" y1="' + (H - PAD) + '" x2="' + (W - 8) + '" y2="' + (H - PAD) + '" stroke="' + P.line + '"/>' +
        '<line x1="' + PAD + '" y1="8" x2="' + PAD + '" y2="' + (H - PAD) + '" stroke="' + P.line + '"/>' +
        band + line + dots +
        '<text x="' + (W - 8) + '" y="16" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">test points; red = outside band</text></svg>';
      read.innerHTML = 'At a target of <b>' + LV[level].pct + '</b> coverage, the calibration residuals set the band half-width to <b>q&#770; = ' + qhat.toFixed(2) + '</b>. On fresh test points the band actually covers <b style="color:' + P.acc + '">' + Math.round(cover * 100) + '%</b>, at or above target: that is conformal prediction\'s finite-sample guarantee, with no assumption about the error shape. Raise the target and the band widens to keep the promise.';
    }
    u.wireSeg(el.querySelector('.cb-seg'), function (v) { level = v; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Split conformal prediction: a band with GUARANTEED coverage, from residual quantiles. Base R.',
      'set.seed(1)',
      'n <- 600; x <- runif(n, 0, 10); y <- 2 + 1.5 * x + rnorm(n, 0, 2)',
      'd <- data.frame(x, y)',
      'tr <- 1:300; cal <- 301:450; te <- 451:600        # train / calibrate / test',
      'fit <- lm(y ~ x, d[tr, ])                          # 1) fit on the training split',
      'res <- abs(d$y[cal] - predict(fit, d[cal, ]))      # 2) nonconformity = |residual| on calibration',
      'alpha <- 0.1                                        # want >= 90% coverage',
      'k    <- ceiling((length(cal) + 1) * (1 - alpha)) / length(cal)',
      'qhat <- quantile(res, k)                            # 3) the conformal quantile = band half-width',
      'pred <- predict(fit, d[te, ])                       # 4) band is pred +/- qhat on new points',
      'cover <- mean(d$y[te] >= pred - qhat & d$y[te] <= pred + qhat)',
      'round(c(qhat = unname(qhat), target = 1 - alpha, coverage = cover), 3)',
      '#>     qhat   target coverage',
      '#>    3.615    0.900    0.913'
    ].join('\n');
  }

  window.LessonWidgets.register('conformal-bands', mount);
})();
