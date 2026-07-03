/* isolation-forest.js - why anomalies isolate faster.
 * An isolation tree splits the space with random axis-aligned cuts. A point in a dense cluster needs
 * many cuts to fence off on its own; a point out in empty space is fenced off in just a few. The
 * average number of cuts (path length) over many trees becomes the anomaly score. Toggle between a
 * cluster point and the outlier and watch the isolating path get much shorter for the outlier.
 * Emits a from-scratch isolation forest in base R.
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function gauss(r) { return Math.sqrt(-2 * Math.log(Math.max(r(), 1e-9))) * Math.cos(6.2831853 * r()); }

  // fixed point cloud in [0,1]^2: a tight cluster + one far outlier (last index)
  function build() {
    var r = rng(7), pts = [];
    for (var i = 0; i < 70; i++) pts.push([0.5 + 0.075 * gauss(r), 0.52 + 0.075 * gauss(r)]);
    pts.push([0.9, 0.12]); // the outlier
    return pts;
  }

  // one isolation path for point p among pts: random axis-aligned cuts, shrink the box to the side
  // holding p, until p is alone. Returns the list of cut segments (for drawing) and the path length.
  function isoPath(pts, pIdx, seed) {
    var r = rng(seed), box = [0, 1, 0, 1], idx = pts.map(function (_, i) { return i; }), cuts = [], guard = 0;
    while (idx.length > 1 && guard++ < 40) {
      var j = r() < 0.5 ? 0 : 1;
      var vals = idx.map(function (i) { return pts[i][j]; });
      var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
      if (hi - lo < 1e-6) break;
      var sp = lo + (hi - lo) * r();
      cuts.push({ axis: j, at: sp, box: box.slice() });
      var pv = pts[pIdx][j], keepLow = pv < sp;
      if (j === 0) box[keepLow ? 1 : 0] = sp; else box[keepLow ? 3 : 2] = sp;
      idx = idx.filter(function (i) { return (pts[i][j] < sp) === keepLow; });
    }
    return { cuts: cuts, len: cuts.length };
  }

  function mount(el, cfg) {
    cfg = cfg || {}; var pts = build(), outlier = pts.length - 1, sel = 'cluster';
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="if-seg" style="margin-bottom:12px">' + u.seg([{ v: 'cluster', label: 'A cluster point' }, { v: 'outlier', label: 'The outlier' }], 'cluster') + '</div>' +
      '<div class="if-plot"></div>' +
      '<div class="if-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Isolation forest from scratch: average path length -> anomaly score, base R' });

    var plot = el.querySelector('.if-plot'), read = el.querySelector('.if-read');
    var W = 340, H = 260, PAD = 14;
    function sx(x) { return PAD + x * (W - 2 * PAD); }
    function sy(y) { return H - PAD - y * (H - 2 * PAD); }
    // approximate average path length over many trees (JS mini-forest), for the honest readout
    function avgLen(pIdx) { var s = 0, N = 60; for (var t = 0; t < N; t++) s += isoPath(pts, pIdx, 1000 + t * 7 + pIdx).len; return s / N; }
    var cn = 2 * (Math.log(pts.length - 1) + 0.5772157) - 2 * (pts.length - 1) / pts.length;

    function draw() {
      var pIdx = sel === 'outlier' ? outlier : 3;
      var path = isoPath(pts, pIdx, 42 + pIdx), avg = avgLen(pIdx), score = Math.pow(2, -avg / cn);
      var lines = path.cuts.map(function (c) {
        if (c.axis === 0) return '<line x1="' + sx(c.at).toFixed(1) + '" y1="' + sy(c.box[3]).toFixed(1) + '" x2="' + sx(c.at).toFixed(1) + '" y2="' + sy(c.box[2]).toFixed(1) + '" stroke="' + P.acc + '" stroke-width="1" opacity="0.6"/>';
        return '<line x1="' + sx(c.box[0]).toFixed(1) + '" y1="' + sy(c.at).toFixed(1) + '" x2="' + sx(c.box[1]).toFixed(1) + '" y2="' + sy(c.at).toFixed(1) + '" stroke="' + P.acc + '" stroke-width="1" opacity="0.6"/>';
      }).join('');
      var dots = pts.map(function (p, i) {
        var isSel = i === pIdx, isOut = i === outlier;
        return '<circle cx="' + sx(p[0]).toFixed(1) + '" cy="' + sy(p[1]).toFixed(1) + '" r="' + (isSel ? 5 : 3) + '" fill="' + (isSel ? P.bad : isOut ? P.del : P.c0) + '" opacity="' + (isSel ? 1 : 0.6) + '"' + (isSel ? ' stroke="#fff" stroke-width="1.5"' : '') + '/>';
      }).join('');
      plot.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block;border:1px solid ' + P.line + ';border-radius:8px" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="isolation forest splits">' +
        '<rect x="' + PAD + '" y="' + PAD + '" width="' + (W - 2 * PAD) + '" height="' + (H - 2 * PAD) + '" fill="none" stroke="' + P.line + '"/>' +
        lines + dots +
        '<text x="' + (W - 8) + '" y="18" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">' + path.len + ' cuts to isolate</text></svg>';
      read.innerHTML = 'This ' + (sel === 'outlier' ? '<b style="color:' + P.del + '">outlier</b>' : '<b>cluster point</b>') + ' is fenced off on its own after <b>' + path.len + '</b> random cuts here, and <b>' + avg.toFixed(1) + '</b> on average over many trees, giving an anomaly score of <b style="color:' + P.acc + '">' + score.toFixed(2) + '</b>. ' +
        (sel === 'outlier' ? 'Out in empty space, a few cuts suffice, so the short path scores near 1: anomalous.' : 'Buried among neighbours, it takes many cuts, so the long path scores near 0.5: normal.');
    }
    u.wireSeg(el.querySelector('.if-seg'), function (v) { sel = v; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Isolation Forest from scratch: anomalies isolate in fewer random splits (shorter paths). Base R.',
      'set.seed(1)',
      'X <- rbind(matrix(rnorm(200), 100, 2), c(4.5, 4.5))   # 100 normal points + 1 anomaly (row 101)',
      'cn <- function(n) if (n > 2) 2*(log(n-1)+0.5772157) - 2*(n-1)/n else if (n==2) 1 else 0  # avg path in a random tree',
      'ipath <- function(x, d, e = 0) {                      # depth of random splits to isolate x within d',
      '  n <- nrow(d)',
      '  if (n <= 1 || e > 30) return(e + cn(n))',
      '  j <- sample(ncol(d), 1); lo <- min(d[,j]); hi <- max(d[,j])',
      '  if (lo == hi) return(e + cn(n))',
      '  sp <- runif(1, lo, hi)                              # random split on a random feature',
      '  side <- if (x[j] < sp) d[,j] < sp else d[,j] >= sp',
      '  ipath(x, d[side, , drop = FALSE], e + 1)            # recurse into the side holding x',
      '}',
      'score <- function(i, trees = 100)                     # anomaly score = 2^(-avg path / cn)',
      '  2^(-mean(replicate(trees, ipath(X[i,], X))) / cn(nrow(X)))',
      'round(c(normal_pt = score(1), anomaly_pt = score(101)), 3)',
      '#>  normal_pt anomaly_pt',
      '#>      0.382      0.834'
    ].join('\n');
  }

  window.LessonWidgets.register('isolation-forest', mount);
})();
