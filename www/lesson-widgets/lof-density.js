/* lof-density.js - Local Outlier Factor made visible.
 * LOF compares a point's local density to the density of its neighbours. Deep inside a cluster,
 * a point is as crowded as its neighbours, so LOF ~ 1. A point in a sparse pocket, whose neighbours
 * are themselves crowded, has far lower density than them, so LOF >> 1. Unlike a global cutoff, LOF
 * adapts to each region, catching a point that is only locally sparse. Slide k and read each point's
 * LOF off its colour. Emits a from-scratch LOF in base R.
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function gauss(r) { return Math.sqrt(-2 * Math.log(Math.max(r(), 1e-9))) * Math.cos(6.2831853 * r()); }

  function build() {
    var r = rng(11), pts = [], i;
    for (i = 0; i < 40; i++) pts.push([0.35 + 0.08 * gauss(r), 0.55 + 0.08 * gauss(r)]);   // dense cluster A
    for (i = 0; i < 20; i++) pts.push([0.72 + 0.05 * gauss(r), 0.35 + 0.05 * gauss(r)]);   // tighter cluster B
    pts.push([0.6, 0.8]);   // locally sparse point between the clusters (the interesting outlier)
    return pts;
  }

  function dist(a, b) { var dx = a[0] - b[0], dy = a[1] - b[1]; return Math.sqrt(dx * dx + dy * dy); }
  function lofAll(pts, k) {
    var n = pts.length, D = [], i, j;
    for (i = 0; i < n; i++) { D[i] = []; for (j = 0; j < n; j++) D[i][j] = dist(pts[i], pts[j]); }
    function knn(i) { var o = D[i].map(function (d, j) { return [d, j]; }).sort(function (a, b) { return a[0] - b[0]; }); return o.slice(1, k + 1).map(function (x) { return x[1]; }); }
    var NN = pts.map(function (_, i) { return knn(i); });
    function kdist(i) { return D[i][NN[i][k - 1]]; }
    function lrd(i) { var s = 0; NN[i].forEach(function (o) { s += Math.max(D[i][o], kdist(o)); }); return 1 / (s / k); }
    return pts.map(function (_, i) { var s = 0; NN[i].forEach(function (o) { s += lrd(o); }); return (s / k) / lrd(i); });
  }

  function mount(el, cfg) {
    cfg = cfg || {}; var pts = build(), outlier = pts.length - 1, k = 8;
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="lf-seg" style="margin-bottom:12px">' + u.seg([{ v: '5', label: 'k = 5' }, { v: '8', label: 'k = 8' }, { v: '12', label: 'k = 12' }], '8') + '</div>' +
      '<div class="lf-plot"></div>' +
      '<div class="lf-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Local Outlier Factor from scratch: local density ratio, base R' });

    var plot = el.querySelector('.lf-plot'), read = el.querySelector('.lf-read');
    var W = 340, H = 250, PAD = 14;
    function sx(x) { return PAD + x * (W - 2 * PAD); }
    function sy(y) { return H - PAD - y * (H - 2 * PAD); }
    function col(lof) { return lof > 1.8 ? P.bad : lof > 1.3 ? '#e08a2e' : P.c0; }

    function draw() {
      var lof = lofAll(pts, k);
      var dots = pts.map(function (p, i) {
        var isOut = i === outlier;
        return '<circle cx="' + sx(p[0]).toFixed(1) + '" cy="' + sy(p[1]).toFixed(1) + '" r="' + (isOut ? 6 : 3.5 + Math.min(3, (lof[i] - 1) * 3)) + '" fill="' + col(lof[i]) + '" opacity="0.8"' + (isOut ? ' stroke="#fff" stroke-width="1.5"' : '') + '/>';
      }).join('');
      plot.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block;border:1px solid ' + P.line + ';border-radius:8px" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="LOF colored scatter">' +
        '<rect x="' + PAD + '" y="' + PAD + '" width="' + (W - 2 * PAD) + '" height="' + (H - 2 * PAD) + '" fill="none" stroke="' + P.line + '"/>' +
        dots +
        '<text x="' + (W - 8) + '" y="18" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">bigger, redder = higher LOF</text></svg>';
      var clusterMean = 0, cc = 0; lof.forEach(function (v, i) { if (i !== outlier) { clusterMean += v; cc++; } });
      read.innerHTML = 'At <b>k = ' + k + '</b>, the highlighted point scores <b style="color:' + P.bad + '">LOF = ' + lof[outlier].toFixed(2) + '</b>, while ordinary cluster points sit near <b>' + (clusterMean / cc).toFixed(2) + '</b>. An LOF near 1 means "as dense as my neighbours"; well above 1 means "in a far sparser pocket than the points around me", the local signal a single global distance cutoff would miss.';
    }
    u.wireSeg(el.querySelector('.lf-seg'), function (v) { k = parseInt(v, 10); draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Local Outlier Factor from scratch: an outlier is far less dense than its own neighbours. Base R.',
      'set.seed(1)',
      'X <- rbind(matrix(rnorm(100), 50, 2), c(3.5, 3.5))   # 50-point cluster + 1 outlier (row 51)',
      'k <- 5; D <- as.matrix(dist(X))',
      'knn   <- function(i) order(D[i,])[2:(k+1)]           # k nearest neighbours (drop self)',
      'kdist <- function(i) D[i, knn(i)[k]]                 # distance to the k-th neighbour',
      'rd    <- function(i, o) max(D[i, o], kdist(o))       # reachability distance of i from o',
      'lrd   <- function(i) 1 / mean(sapply(knn(i), function(o) rd(i, o)))   # local reachability density',
      'lof   <- function(i) mean(sapply(knn(i), lrd)) / lrd(i)               # neighbour density / my density',
      'round(c(cluster_pt = lof(1), outlier_pt = lof(51)), 2)',
      '#> cluster_pt outlier_pt',
      '#>       1.02       3.80'
    ].join('\n');
  }

  window.LessonWidgets.register('lof-density', mount);
})();
