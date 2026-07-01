/* kmeans-cluster.js - k-means, one step at a time. Press "step" to alternate the two
 * moves of Lloyd's algorithm: assign each point to its nearest centroid, then move each
 * centroid to the mean of its points. The within-cluster sum of squares drops and the
 * centroids settle. Emits runnable R that runs kmeans and reads the result.
 *
 * cfg: { k: 3 }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  var COL = [P.c0, P.acc, (P.c2 || '#c9a24a'), '#7a8a55'];
  // a fixed point cloud (three loose blobs) so the demo is deterministic
  var PTS = (function () {
    var seeds = [[2.4, 2.4], [7.4, 3.0], [4.6, 7.2]], out = [], s = 7;
    function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }
    seeds.forEach(function (c) { for (var i = 0; i < 9; i++) out.push([c[0] + (rnd() - 0.5) * 3, c[1] + (rnd() - 0.5) * 3]); });
    return out;
  })();

  function mount(el, cfg) {
    cfg = cfg || {}; var k = cfg.k || 3;
    var cents = [[3.5, 5.5], [5.5, 3.0], [6.5, 6.0]].slice(0, k);
    var assign = PTS.map(function () { return 0; }), phase = 'assign', iter = 0;
    function dist(a, b) { return (a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1]); }
    function wss() { var s = 0; PTS.forEach(function (p, i) { s += dist(p, cents[assign[i]]); }); return s; }

    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="km-plot"></div>' +
      '<div style="display:flex;align-items:center;gap:12px;margin:12px 0 4px;flex-wrap:wrap">' +
        '<button class="km-step" style="font:600 13px IBM Plex Sans,sans-serif;background:' + P.ink + ';color:#fff;border:0;border-radius:9px;padding:9px 16px;cursor:pointer">step</button>' +
        '<button class="km-reset" style="font:600 13px IBM Plex Sans,sans-serif;background:#fff;color:' + P.body + ';border:1px solid ' + P.line + ';border-radius:9px;padding:9px 14px;cursor:pointer">reset</button>' +
        '<span class="km-read" style="font:13px IBM Plex Mono,monospace;color:' + P.body + '"></span>' +
      '</div>' +
      u.runnable(rcode(), { label: 'Run k-means in R and read the clusters' });

    var plot = el.querySelector('.km-plot'), read = el.querySelector('.km-read');
    var S = 250, m = 14, sc = (S - 2 * m) / 10;
    function px(x) { return m + x * sc; } function py(y) { return (S - m) - y * sc; }
    function draw() {
      var svg = '<svg viewBox="0 0 ' + S + ' ' + S + '" width="100%" style="max-width:' + S + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="k-means clustering">';
      svg += '<rect x="' + m + '" y="' + m + '" width="' + (S - 2 * m) + '" height="' + (S - 2 * m) + '" fill="#fbfcfb" stroke="' + P.line + '"/>';
      PTS.forEach(function (p, i) { svg += '<circle cx="' + px(p[0]).toFixed(1) + '" cy="' + py(p[1]).toFixed(1) + '" r="4.5" fill="' + COL[assign[i]] + '" opacity="0.9"/>'; });
      cents.forEach(function (c, j) { svg += '<path d="M' + (px(c[0]) - 7) + ',' + py(c[1]) + ' h14 M' + px(c[0]) + ',' + (py(c[1]) - 7) + ' v14" stroke="' + COL[j] + '" stroke-width="3" stroke-linecap="round"/><circle cx="' + px(c[0]).toFixed(1) + '" cy="' + py(c[1]).toFixed(1) + '" r="9" fill="none" stroke="' + COL[j] + '" stroke-width="2"/>'; });
      svg += '</svg>'; plot.innerHTML = svg;
      read.textContent = 'iteration ' + iter + ' · next: ' + phase + ' · within-SS ' + wss().toFixed(1);
    }
    function step() {
      if (phase === 'assign') { PTS.forEach(function (p, i) { var best = 0, bd = Infinity; cents.forEach(function (c, j) { var d = dist(p, c); if (d < bd) { bd = d; best = j; } }); assign[i] = best; }); phase = 'update'; }
      else { cents = cents.map(function (c, j) { var sx = 0, sy = 0, n = 0; PTS.forEach(function (p, i) { if (assign[i] === j) { sx += p[0]; sy += p[1]; n++; } }); return n ? [sx / n, sy / n] : c; }); phase = 'assign'; iter++; }
      draw();
    }
    el.querySelector('.km-step').addEventListener('click', step);
    el.querySelector('.km-reset').addEventListener('click', function () { cents = [[3.5, 5.5], [5.5, 3.0], [6.5, 6.0]].slice(0, k); assign = PTS.map(function () { return 0; }); phase = 'assign'; iter = 0; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# k-means alternates two moves until the centroids stop moving:',
      '#   1. assign each point to its nearest centroid',
      '#   2. move each centroid to the mean of its assigned points',
      'set.seed(1)',
      'pts <- rbind(',
      '  cbind(rnorm(30, 2), rnorm(30, 2)),',
      '  cbind(rnorm(30, 7), rnorm(30, 3)),',
      '  cbind(rnorm(30, 4), rnorm(30, 7)))',
      '',
      'km <- kmeans(pts, centers = 3, nstart = 10)',
      'plot(pts, col = km$cluster, pch = 19)',
      'points(km$centers, pch = 3, cex = 2, lwd = 3)',
      'km$tot.withinss          # total within-cluster sum of squares (lower = tighter)'
    ].join('\n');
  }

  window.LessonWidgets.register('kmeans-cluster', mount);
})();
