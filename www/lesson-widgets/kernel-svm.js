/* kernel-svm.js - the kernel trick, made visible. Two classes that no straight line can
 * separate. A linear SVM tries anyway and fails; switch to a polynomial or RBF kernel and
 * the boundary bends into a closed curve that wraps one class perfectly. The support
 * vectors (circled) are the only points that shape it. Emits runnable R fitting e1071::svm
 * with each kernel and reporting the training error.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  // inner class (circle) vs outer ring: linearly inseparable on purpose
  var PTS = (function () {
    var a = [], s = 11; function r() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }
    for (var i = 0; i < 26; i++) { var ang = r() * 6.283, rad = r() * 1.1; a.push({ x: rad * Math.cos(ang), y: rad * Math.sin(ang), c: 1 }); }   // inner
    for (var j = 0; j < 34; j++) { var a2 = r() * 6.283, rr = 2.1 + r() * 1.0; a.push({ x: rr * Math.cos(a2), y: rr * Math.sin(a2), c: 0 }); }   // ring
    return a;
  })();

  // decision score per kernel (illustrative, matched to the geometry above)
  function score(kernel, x, y) {
    var rad2 = x * x + y * y;
    if (kernel === 'linear') return 0.9 * x + 0.4 * y + 0.15;          // a line: cannot separate the ring
    if (kernel === 'poly') return 3.2 - rad2;                          // quadratic: a circle
    return 1.6 * Math.exp(-rad2 / 1.4) - 0.5;                          // RBF: a smooth bump around the inner class
  }
  function isSV(kernel, p) { return Math.abs(score(kernel, p.x, p.y)) < (kernel === 'linear' ? 0.8 : 0.9); }

  function mount(el, cfg) {
    cfg = cfg || {}; var kernel = 'linear';
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="ks-seg" style="margin-bottom:12px">' + u.seg([{ v: 'linear', label: 'Linear' }, { v: 'poly', label: 'Polynomial' }, { v: 'rbf', label: 'RBF' }], 'linear') + '</div>' +
      '<div class="ks-plot"></div>' +
      '<div class="ks-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Three kernels with e1071::svm(), and their training error' });

    var plot = el.querySelector('.ks-plot'), read = el.querySelector('.ks-read');
    var W = 300, H = 300, R = [-3.4, 3.4];
    function px(x) { return (x - R[0]) / (R[1] - R[0]) * W; }
    function py(y) { return H - (y - R[0]) / (R[1] - R[0]) * H; }
    function draw() {
      // shade the decision region on a grid
      var cells = '', step = 12;
      for (var gx = 0; gx < W; gx += step) for (var gy = 0; gy < H; gy += step) {
        var wx = R[0] + (gx + step / 2) / W * (R[1] - R[0]), wy = R[0] + (H - gy - step / 2) / H * (R[1] - R[0]);
        var s = score(kernel, wx, wy);
        cells += '<rect x="' + gx + '" y="' + gy + '" width="' + step + '" height="' + step + '" fill="' + (s > 0 ? P.c0 : P.acc) + '" opacity="' + (Math.min(0.22, 0.05 + Math.abs(s) * 0.06)).toFixed(3) + '"/>';
      }
      var err = 0, dots = '';
      PTS.forEach(function (p) { var pred = score(kernel, p.x, p.y) > 0 ? 1 : 0; if (pred !== p.c) err++; var sv = isSV(kernel, p);
        dots += '<circle cx="' + px(p.x).toFixed(1) + '" cy="' + py(p.y).toFixed(1) + '" r="' + (sv ? 6.5 : 4.5) + '" fill="' + (p.c ? P.c0 : P.acc) + '"' + (sv ? ' stroke="' + P.ink + '" stroke-width="1.6"' : '') + '/>'; });
      plot.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block;border:1px solid ' + P.line + ';border-radius:8px" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="SVM decision region">' + cells + dots + '</svg>';
      read.innerHTML = kernel === 'linear'
        ? '<b style="font-family:IBM Plex Mono,monospace;color:' + P.bad + '">Linear kernel: ' + err + ' of ' + PTS.length + ' misclassified.</b> No straight boundary can wrap the inner class, so a linear SVM is stuck.'
        : '<b style="font-family:IBM Plex Mono,monospace;color:' + P.acc + '">' + (kernel === 'poly' ? 'Polynomial' : 'RBF') + ' kernel: ' + err + ' misclassified.</b> The kernel trick lifts the points into a higher space where a flat boundary exists; back in 2-D it appears as a curve. The circled points are the <b>support vectors</b> that define it.';
    }
    u.wireSeg(el.querySelector('.ks-seg'), function (v) { kernel = v; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Two classes no straight line can split: an inner blob inside a ring.',
      'library(e1071)',
      'set.seed(11)',
      'ang <- runif(60, 0, 2*pi)',
      'rad <- c(runif(26, 0, 1.1), 2.1 + runif(34, 0, 1))    # inner vs ring',
      'd <- data.frame(x = rad*cos(ang), y = rad*sin(ang),',
      '                cls = factor(c(rep(1,26), rep(0,34))))',
      '',
      'err <- function(k) mean(predict(svm(cls ~ x + y, d, kernel = k)) != d$cls)',
      'c(linear = err("linear"), polynomial = err("polynomial"), radial = err("radial"))',
      '# linear can never separate the ring; radial (RBF) drives training error to ~0.'
    ].join('\n');
  }

  window.LessonWidgets.register('kernel-svm', mount);
})();
