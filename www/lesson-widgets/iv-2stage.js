/* iv-2stage.js - instrumental variables / two-stage least squares, made visible. When an
 * unobserved confounder drives both treatment and outcome, the naive regression slope is
 * biased. An instrument Z shifts the treatment X but touches the outcome only through X, so
 * the part of X that Z explains is exogenous. IV recovers the true slope from that part
 * (equivalently, the Wald ratio cov(Z,Y)/cov(Z,X)). A WEAK instrument, one barely related to
 * X, makes the ratio's denominator tiny and the estimate wild. Toggle strong vs weak and
 * watch the IV line settle or swing. Emits the two-stage lm() fit in base R.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  var STR = { strong: 0.8, weak: 0.12 };

  function build(zcoef) {
    var r = rng(3), spare = null;
    function rnorm() { if (spare !== null) { var v = spare; spare = null; return v; } var a = Math.max(r(), 1e-12), b = r(), m = Math.sqrt(-2 * Math.log(a)); spare = m * Math.sin(2 * Math.PI * b); return m * Math.cos(2 * Math.PI * b); }
    var z = [], x = [], y = [];
    for (var i = 0; i < 400; i++) { var zi = rnorm(), ui = rnorm(); var xi = zcoef * zi + 1.2 * ui + rnorm(); var yi = 2 * xi + 3 * ui + rnorm(); z.push(zi); x.push(xi); y.push(yi); }
    return { z: z, x: x, y: y };
  }
  function mean(a) { return a.reduce(function (s, v) { return s + v; }, 0) / a.length; }
  function cov(a, b) { var ma = mean(a), mb = mean(b), s = 0; for (var i = 0; i < a.length; i++) s += (a[i] - ma) * (b[i] - mb); return s / (a.length - 1); }

  function mount(el, cfg) {
    cfg = cfg || {}; var strength = 'strong';
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="iv-seg" style="margin-bottom:12px">' + u.seg([{ v: 'strong', label: 'Strong instrument' }, { v: 'weak', label: 'Weak instrument' }], 'strong') + '</div>' +
      '<div class="iv-plot"></div>' +
      '<div class="iv-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Two-stage least squares (IV) by hand, base R' });

    var plot = el.querySelector('.iv-plot'), read = el.querySelector('.iv-read');
    var W = 340, H = 200, PAD = 10;
    function draw() {
      var d = build(STR[strength]);
      var mx = mean(d.x), my = mean(d.y);
      var naive = cov(d.x, d.y) / cov(d.x, d.x);
      var iv = cov(d.z, d.y) / cov(d.z, d.x);
      var fstrength = cov(d.z, d.x) * cov(d.z, d.x) / (cov(d.z, d.z) * cov(d.x, d.x)) * (d.x.length - 2) / Math.max(1e-6, 1 - cov(d.z, d.x) * cov(d.z, d.x) / (cov(d.z, d.z) * cov(d.x, d.x)));
      var xr = [Math.min.apply(null, d.x), Math.max.apply(null, d.x)], yr = [Math.min.apply(null, d.y), Math.max.apply(null, d.y)];
      function px(x) { return PAD + (x - xr[0]) / (xr[1] - xr[0]) * (W - 2 * PAD); }
      function py(y) { return H - 22 - (y - yr[0]) / (yr[1] - yr[0]) * (H - 32); }
      var dots = d.x.map(function (xi, i) { return '<circle cx="' + px(xi).toFixed(1) + '" cy="' + py(d.y[i]).toFixed(1) + '" r="1.6" fill="' + P.faint + '" opacity="0.6"/>'; }).join('');
      function seg(slope, col, dash) { var x1 = xr[0], x2 = xr[1]; var y1 = my + slope * (x1 - mx), y2 = my + slope * (x2 - mx); return '<line x1="' + px(x1).toFixed(1) + '" y1="' + py(y1).toFixed(1) + '" x2="' + px(x2).toFixed(1) + '" y2="' + py(y2).toFixed(1) + '" stroke="' + col + '" stroke-width="2.5"' + (dash ? ' stroke-dasharray="5 3"' : '') + '/>'; }
      plot.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block;border:1px solid ' + P.line + ';border-radius:8px" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="instrumental variables">' +
        dots + seg(naive, P.bad) + seg(iv, P.acc, true) +
        '<text x="' + (W - 8) + '" y="14" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.bad + '">naive OLS ' + naive.toFixed(2) + '</text>' +
        '<text x="' + (W - 8) + '" y="28" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.acc + '">IV ' + iv.toFixed(2) + '</text>' +
        '<text x="' + (W / 2) + '" y="' + (H - 6) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">treatment x -> outcome y</text></svg>';
      read.innerHTML = 'Naive OLS reads a slope of <b style="color:' + P.bad + '">' + naive.toFixed(2) + '</b>, biased by the hidden confounder; IV recovers <b style="color:' + P.acc + '">' + iv.toFixed(2) + '</b> (true effect 2) from the instrument-driven part of x. ' +
        (strength === 'weak'
          ? 'First-stage F &asymp; <b style="color:' + P.bad + '">' + fstrength.toFixed(0) + '</b>: a <b>weak</b> instrument barely moves x, so the Wald ratio\'s denominator is tiny and the estimate is unstable (rule of thumb: need F &gt; 10).'
          : 'First-stage F &asymp; <b>' + fstrength.toFixed(0) + '</b>, comfortably above the F &gt; 10 rule: a strong instrument gives a stable estimate.');
    }
    u.wireSeg(el.querySelector('.iv-seg'), function (v) { strength = v; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Instrumental variables (2SLS): recover a causal slope despite an unobserved confounder. Base R.',
      'set.seed(3)',
      'n <- 1000',
      'z <- rnorm(n)                       # instrument (random encouragement)',
      'u <- rnorm(n)                       # UNOBSERVED confounder',
      'x <- 0.8 * z + 1.2 * u + rnorm(n)    # treatment: driven by z AND u',
      'y <- 2 * x + 3 * u + rnorm(n)        # TRUE effect of x is 2; u confounds',
      '',
      'naive <- coef(lm(y ~ x))["x"]        # biased upward by u',
      'xhat  <- fitted(lm(x ~ z))           # stage 1: the exogenous, z-driven part of x',
      'iv    <- coef(lm(y ~ xhat))["xhat"]  # stage 2',
      'round(c(true = 2, naive_ols = unname(naive), iv_2sls = unname(iv)), 2)',
      '#>      true naive_ols  iv_2sls',
      '#>      2.00      3.16     1.85',
      '',
      'summary(lm(x ~ z))$fstatistic[1]     # first-stage strength (need F > 10)',
      '#>    value',
      '#>    257.8'
    ].join('\n');
  }

  window.LessonWidgets.register('iv-2stage', mount);
})();
