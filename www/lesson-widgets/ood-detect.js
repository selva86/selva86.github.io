/* ood-detect.js - out-of-distribution detection by a novelty score + threshold, made visible.
 * Fit the training data's shape (here a Gaussian, scored by Mahalanobis distance), then flag any
 * new point whose score exceeds a threshold as out-of-distribution. The threshold trades a false-
 * positive rate on genuine inliers against the detection rate on true outliers: a strict cutoff
 * misses subtle novelties, a loose one cries wolf. Toggle the cutoff and read both rates off the
 * two score histograms. Emits the same Mahalanobis + chi-square-threshold detector in base R.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  // chi-square 2df thresholds (Mahalanobis^2 cutoffs) at 3 percentiles
  var THR = { strict: { q: 13.82, pct: '99.9%' }, medium: { q: 9.21, pct: '99%' }, loose: { q: 5.99, pct: '95%' } };

  function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function build() {
    var r = rng(2);
    // inlier score ~ chi-square(2df) = Exponential(mean 2); OOD ~ inlier + offset ~32 (a point ~4 sd away)
    var inl = [], ood = [];
    for (var i = 0; i < 400; i++) { inl.push(-2 * Math.log(Math.max(r(), 1e-9))); ood.push(-2 * Math.log(Math.max(r(), 1e-9)) + 26 + 12 * r()); }
    return { inl: inl, ood: ood };
  }

  function mount(el, cfg) {
    cfg = cfg || {}; var level = 'medium'; var d = build();
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="od-seg" style="margin-bottom:12px">' + u.seg([{ v: 'loose', label: 'Loose (95%)' }, { v: 'medium', label: 'Medium (99%)' }, { v: 'strict', label: 'Strict (99.9%)' }], 'medium') + '</div>' +
      '<div class="od-plot"></div>' +
      '<div class="od-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'OOD detection: Mahalanobis distance + chi-square threshold, base R' });

    var plot = el.querySelector('.od-plot'), read = el.querySelector('.od-read');
    var W = 340, H = 180, PAD = 10, T = 10, Bm = 22, XMAX = 55, NB = 44;
    function px(s) { return PAD + Math.min(s, XMAX) / XMAX * (W - 2 * PAD); }
    function hist(a) { var h = new Array(NB).fill(0); a.forEach(function (s) { var k = Math.min(NB - 1, Math.floor(s / XMAX * NB)); h[k]++; }); return h; }
    function draw() {
      var thr = THR[level].q;
      var hi = hist(d.inl), ho = hist(d.ood);
      var mx = Math.max(Math.max.apply(null, hi), Math.max.apply(null, ho)) || 1;
      var bw = (W - 2 * PAD) / NB;
      function bars(h, col) { return h.map(function (c, k) { var hh = c / mx * (H - T - Bm); return '<rect x="' + (PAD + k * bw).toFixed(1) + '" y="' + (H - Bm - hh).toFixed(1) + '" width="' + (bw - 0.5).toFixed(1) + '" height="' + hh.toFixed(1) + '" fill="' + col + '" opacity="0.55"/>'; }).join(''); }
      var fpr = d.inl.filter(function (s) { return s > thr; }).length / d.inl.length;
      var det = d.ood.filter(function (s) { return s > thr; }).length / d.ood.length;
      plot.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block;border:1px solid ' + P.line + ';border-radius:8px" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="ood score histogram">' +
        bars(hi, P.c0) + bars(ho, P.bad) +
        '<line x1="' + px(thr).toFixed(1) + '" y1="' + T + '" x2="' + px(thr).toFixed(1) + '" y2="' + (H - Bm) + '" stroke="' + P.ink + '" stroke-width="1.5" stroke-dasharray="3 2"/>' +
        '<text x="' + (px(thr) + 3).toFixed(1) + '" y="' + (T + 10) + '" font-family="IBM Plex Sans,sans-serif" font-size="9.5" fill="' + P.ink + '">flag ></text>' +
        '<text x="' + (W - 8) + '" y="14" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.c0 + '">inliers</text>' +
        '<text x="' + (W - 8) + '" y="28" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.bad + '">out-of-distribution</text>' +
        '<text x="' + (W / 2) + '" y="' + (H - 6) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">novelty score (Mahalanobis distance) -></text></svg>';
      read.innerHTML = 'At the <b>' + THR[level].pct + '</b> cutoff, <b style="color:' + P.bad + '">' + Math.round(fpr * 100) + '%</b> of genuine inliers are wrongly flagged (false positives) and <b style="color:' + P.acc + '">' + Math.round(det * 100) + '%</b> of true out-of-distribution points are caught. ' +
        (level === 'strict' ? 'A strict cutoff nearly eliminates false alarms but can miss subtle novelty.' : level === 'loose' ? 'A loose cutoff catches everything odd but at a higher false-alarm cost.' : 'A middle cutoff balances the two, the usual starting point.');
    }
    u.wireSeg(el.querySelector('.od-seg'), function (v) { level = v; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Out-of-distribution detection: score novelty by Mahalanobis distance, threshold it. Base R.',
      'set.seed(2)',
      'n <- 500; X <- cbind(rnorm(n), rnorm(n))       # training data: a 2D Gaussian blob',
      'mu <- colMeans(X); S <- cov(X)',
      'score <- function(pts) mahalanobis(pts, mu, S) # squared Mahalanobis distance = OOD score',
      'thr <- qchisq(0.99, df = 2)                    # cutoff: chi-square 2 df, 99th percentile',
      '',
      'test_in  <- cbind(rnorm(200),    rnorm(200))    # in-distribution',
      'test_ood <- cbind(rnorm(200, 4), rnorm(200, 4)) # out-of-distribution (shifted 4 sd away)',
      'round(c(threshold      = thr,',
      '        flagged_inlier = mean(score(test_in)  > thr),   # false-positive rate ~ 0.01',
      '        flagged_ood    = mean(score(test_ood) > thr)),  # detection rate ~ 0.99',
      '      3)',
      '#>      threshold flagged_inlier    flagged_ood',
      '#>          9.210          0.015          0.990'
    ].join('\n');
  }

  window.LessonWidgets.register('ood-detect', mount);
})();
