/* knn-vote.js - k-nearest neighbors, made tangible.
 * Click anywhere to drop a query point; its k nearest neighbors light up and vote,
 * and the majority class colors the query. Slide k to watch the boundary go from
 * jagged (k=1) to smooth (large k). Emits runnable R that does the same vote by hand.
 *
 * cfg: { }  - renders from {}.
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  var A = [[2, 3], [3, 2], [2.5, 4], [4, 3], [3, 4], [1.5, 2.5], [4.5, 2], [3.5, 3.5], [2, 5]];
  var B = [[7, 8], [8, 7], [6.5, 7.5], [8, 8.5], [7, 6], [6, 8], [8.5, 7], [7.5, 9], [6, 6.5]];
  var PTS = A.map(function (p) { return { x: p[0], y: p[1], c: 'A' }; }).concat(B.map(function (p) { return { x: p[0], y: p[1], c: 'B' }; }));
  var CA = '#b04a52', CB = '#2f6fb0';

  function mount(el, cfg) {
    cfg = cfg || {};
    var k = 5, qx = 5, qy = 5;

    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="kn-chart" style="cursor:crosshair"></div>' +
      '<label style="display:block;font:600 12.5px/1.6 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:12px 0 2px">neighbors k = <b class="kn-k" style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '"></b>' +
        '<input class="kn-s" type="range" min="1" max="9" step="2" value="' + k + '" style="width:100%;accent-color:' + P.acc + '"></label>' +
      '<div class="kn-read" style="font:13px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:8px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Do the k-NN vote by hand in R' });

    var chart = el.querySelector('.kn-chart'), read = el.querySelector('.kn-read'),
        slider = el.querySelector('.kn-s'), kEl = el.querySelector('.kn-k');
    var W = 460, H = 300, m = { t: 14, r: 14, b: 14, l: 14 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
    function sx(x) { return m.l + x / 10 * iw; }
    function sy(y) { return m.t + ih - y / 10 * ih; }

    function draw() {
      var d = PTS.map(function (p, i) { return { i: i, dist: Math.sqrt((p.x - qx) * (p.x - qx) + (p.y - qy) * (p.y - qy)) }; }).sort(function (a, b) { return a.dist - b.dist; });
      var nn = d.slice(0, k), votes = { A: 0, B: 0 }; nn.forEach(function (e) { votes[PTS[e.i].c]++; });
      var pred = votes.A >= votes.B ? 'A' : 'B', isIn = {}; nn.forEach(function (e) { isIn[e.i] = 1; });

      var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="k nearest neighbors vote"><rect x="' + m.l + '" y="' + m.t + '" width="' + iw + '" height="' + ih + '" fill="#fbfcfb" stroke="' + P.line + '"/>';
      // vote lines
      nn.forEach(function (e) { svg += '<line x1="' + sx(qx).toFixed(1) + '" y1="' + sy(qy).toFixed(1) + '" x2="' + sx(PTS[e.i].x).toFixed(1) + '" y2="' + sy(PTS[e.i].y).toFixed(1) + '" stroke="' + P.faint + '" stroke-width="1.2" stroke-dasharray="3 3"/>'; });
      // points
      PTS.forEach(function (p, i) { var col = p.c === 'A' ? CA : CB; svg += '<circle cx="' + sx(p.x).toFixed(1) + '" cy="' + sy(p.y).toFixed(1) + '" r="' + (isIn[i] ? 8 : 5.5) + '" fill="' + col + '" fill-opacity="' + (isIn[i] ? 0.95 : 0.5) + '"' + (isIn[i] ? ' stroke="#fff" stroke-width="1.5"' : '') + '/>'; });
      // query
      var qc = pred === 'A' ? CA : CB;
      svg += '<rect x="' + (sx(qx) - 7).toFixed(1) + '" y="' + (sy(qy) - 7).toFixed(1) + '" width="14" height="14" rx="3" fill="' + qc + '" stroke="' + P.ink + '" stroke-width="2"/>';
      svg += '</svg>';
      chart.innerHTML = svg;

      read.innerHTML = '<b>k = ' + k + ':</b> <b style="color:' + CA + '">' + votes.A + ' class A</b>, <b style="color:' + CB + '">' + votes.B + ' class B</b> &rarr; predict <b style="color:' + (pred === 'A' ? CA : CB) + '">class ' + pred + '</b>. ' +
        (k === 1 ? 'At k=1 the query just copies its single closest point - jumpy and noise-sensitive.' : 'Larger k averages more neighbors: a smoother, steadier boundary, but it can blur real detail.') + ' Click the box to move the query.';
      kEl.textContent = k;
    }

    chart.addEventListener('click', function (e) {
      var svg = chart.querySelector('svg'); if (!svg) return;
      var pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
      var loc = pt.matrixTransform(svg.getScreenCTM().inverse());
      qx = Math.max(0, Math.min(10, (loc.x - m.l) / iw * 10));
      qy = Math.max(0, Math.min(10, (1 - (loc.y - m.t) / ih) * 10));
      draw();
    });
    slider.addEventListener('input', function () { k = +slider.value; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# k-NN with no package: measure distance to every training point, take the',
      '# k closest, and let them vote.',
      'train <- data.frame(',
      '  x = c(2,3,2.5,4,3,1.5,4.5,3.5,2,  7,8,6.5,8,7,6,8.5,7.5,6),',
      '  y = c(3,2,4,  3,4,2.5,2,  3.5,5,  8,7,7.5,8.5,6,8,7,9,  6.5),',
      '  cls = factor(rep(c("A","B"), each = 9)))',
      '',
      'query <- c(x = 5, y = 5)',
      'k <- 5',
      'dist <- sqrt((train$x - query["x"])^2 + (train$y - query["y"])^2)',
      'nn   <- order(dist)[1:k]            # the k nearest rows',
      'table(train$cls[nn])               # the votes',
      'names(which.max(table(train$cls[nn])))   # predicted class'
    ].join('\n');
  }

  window.LessonWidgets.register('knn-vote', mount);
})();
