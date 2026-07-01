/* cluster-validate.js - choosing k. The elbow plot shows total within-cluster spread
 * dropping as k rises; it bends sharply at the "right" k and flattens after. The
 * silhouette bars score how well-separated each k is. Move the k marker and read both.
 * Emits runnable R that computes the within-SS elbow over a range of k.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  var WSS = [null, 520, 250, 120, 96, 82, 73, 66, 60];   // index = k (k=1..8); sharp bend at k=3
  var SIL = [null, 0, 0.42, 0.61, 0.55, 0.47, 0.40, 0.34, 0.29];

  function mount(el, cfg) {
    cfg = cfg || {}; var k = 3, view = 'elbow';
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="cvd-seg" style="display:flex;gap:6px;margin-bottom:12px"></div>' +
      '<div class="cvd-plot"></div>' +
      '<label style="display:block;font:600 12.5px/1.6 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:12px 0 2px">number of clusters k = <b class="cvd-k" style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '"></b>' +
        '<input class="cvd-s" type="range" min="2" max="8" step="1" value="3" style="width:100%;accent-color:' + P.acc + '"></label>' +
      '<div class="cvd-read" style="font:13px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:8px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Compute the within-SS elbow in R' });

    var seg = el.querySelector('.cvd-seg'), plot = el.querySelector('.cvd-plot'), read = el.querySelector('.cvd-read'), slider = el.querySelector('.cvd-s'), kEl = el.querySelector('.cvd-k');
    [['elbow', 'elbow (within-SS)'], ['sil', 'silhouette']].forEach(function (o) {
      var b = document.createElement('button'); b.textContent = o[1];
      b.style.cssText = 'font:600 12px IBM Plex Sans,sans-serif;border:1px solid ' + P.line + ';border-radius:8px;padding:6px 12px;cursor:pointer';
      b.addEventListener('click', function () { view = o[0]; draw(); });
      seg.appendChild(b);
    });
    function draw() {
      seg.querySelectorAll('button').forEach(function (x, i) { var on = ['elbow', 'sil'][i] === view; x.style.background = on ? P.ink : '#fff'; x.style.color = on ? '#fff' : P.body; });
      var W = 420, H = 170, m = 32, iw = W - m - 14, ih = H - m - 8;
      function px(kk) { return m + (kk - 2) / 6 * iw; } function pyE(v) { return (H - m) - (v - 55) / (520 - 55) * ih; } function pyS(v) { return (H - m) - v / 0.7 * ih; }
      var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="cluster validation">';
      svg += '<rect x="' + m + '" y="6" width="' + iw + '" height="' + ih + '" fill="#fbfcfb" stroke="' + P.line + '"/>';
      if (view === 'elbow') {
        var line = []; for (var kk = 2; kk <= 8; kk++) line.push(px(kk).toFixed(1) + ',' + pyE(WSS[kk]).toFixed(1));
        svg += '<polyline points="' + line.join(' ') + '" fill="none" stroke="' + P.c0 + '" stroke-width="2.5"/>';
        for (var kk2 = 2; kk2 <= 8; kk2++) svg += '<circle cx="' + px(kk2).toFixed(1) + '" cy="' + pyE(WSS[kk2]).toFixed(1) + '" r="3.5" fill="' + (kk2 === k ? P.acc : P.mut) + '"/>';
      } else {
        for (var kk3 = 2; kk3 <= 8; kk3++) { var h = SIL[kk3] / 0.7 * ih; svg += '<rect x="' + (px(kk3) - 10).toFixed(1) + '" y="' + (H - m - h).toFixed(1) + '" width="20" height="' + h.toFixed(1) + '" rx="2" fill="' + (kk3 === k ? P.acc : P.line) + '"/>'; }
      }
      for (var t = 2; t <= 8; t++) svg += '<text x="' + px(t).toFixed(1) + '" y="' + (H - 12) + '" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="9.5" fill="' + P.mut + '">' + t + '</text>';
      svg += '</svg>'; plot.innerHTML = svg;
      read.innerHTML = 'At k=<b>' + k + '</b>: within-SS <b>' + WSS[k] + '</b>, silhouette <b>' + SIL[k].toFixed(2) + '</b>. The elbow bends and the silhouette peaks around <b>k=3</b> - the natural number of groups here.';
      kEl.textContent = k;
    }
    slider.addEventListener('input', function () { k = +slider.value; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# The "elbow": total within-cluster spread falls fast, then flattens. The bend = good k.',
      'x <- scale(iris[, 1:4])',
      'wss <- sapply(1:8, function(k) kmeans(x, centers = k, nstart = 10)$tot.withinss)',
      'plot(1:8, wss, type = "b", xlab = "k", ylab = "within-cluster SS")',
      'wss                                  # the sharp drop ends around k = 3'
    ].join('\n');
  }

  window.LessonWidgets.register('cluster-validate', mount);
})();
