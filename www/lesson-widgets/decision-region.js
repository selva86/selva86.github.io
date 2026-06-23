/* decision-region.js - a real greedy CART decision tree, fit live in the
 * browser, that overfits as you raise its depth. Reference lesson widget.
 *
 * Ported from the verified _mocks/rf-course-lesson1 model: two diagonal
 * gaussian blobs + training-only planted noise, recursive Gini splitting,
 * region rendering, train/test accuracy and a data-driven verdict.
 *
 * cfg: { seed, min, max, start, showTest, labels:{c0,c1}, metrics:[...] }
 */
(function () {
  'use strict';
  var C0 = '#2563a8', C1 = '#b5631a';

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function mount(el, cfg) {
    cfg = cfg || {};
    var SEED = cfg.seed || 7;
    var MIN = cfg.min || 1, MAX = cfg.max || 10, START = cfg.start || 3;
    var SHOW_TEST = cfg.showTest !== false;
    var labels = cfg.labels || { c0: 'class 0', c1: 'class 1' };

    var rnd = mulberry32(SEED);
    function gauss(mx, my, s) {
      var u = rnd(), v = rnd();
      var g = Math.sqrt(-2 * Math.log(u + 1e-9)) * Math.cos(6.2832 * v);
      var g2 = Math.sqrt(-2 * Math.log(u + 1e-9)) * Math.sin(6.2832 * v);
      return { x: Math.min(0.97, Math.max(0.03, mx + g * s)),
               y: Math.min(0.97, Math.max(0.03, my + g2 * s)) };
    }

    var DATA = [];
    (function () {
      function blob(mx, my, c, n) {
        for (var k = 0; k < n; k++) { var p = gauss(mx, my, 0.13); DATA.push({ x: p.x, y: p.y, c: c }); }
      }
      blob(0.38, 0.42, 0, 70); blob(0.62, 0.58, 1, 70);
      DATA.forEach(function (p, i) { p.test = (i % 3 === 0); });
      // Training-only noise planted inside the opposite cloud: a deep tree
      // carves islands around these, which is exactly what tanks test accuracy.
      var noise = [[0.47, 0.50, 1], [0.50, 0.45, 1], [0.43, 0.40, 1], [0.45, 0.47, 1],
                   [0.56, 0.60, 0], [0.60, 0.54, 0], [0.53, 0.62, 0], [0.57, 0.53, 0]];
      noise.forEach(function (n) { DATA.push({ x: n[0], y: n[1], c: n[2], test: false }); });
    })();
    var TRAIN = DATA.filter(function (p) { return !p.test; });
    var TEST = DATA.filter(function (p) { return p.test; });

    function gini(pts) {
      if (!pts.length) return 0;
      var c0 = 0; pts.forEach(function (p) { if (p.c === 0) c0++; });
      var n = pts.length, p0 = c0 / n; return 2 * p0 * (1 - p0);
    }
    function build(pts, depth, maxD) {
      var c0 = 0; pts.forEach(function (p) { if (p.c === 0) c0++; });
      var maj = (c0 >= pts.length - c0) ? 0 : 1;
      if (depth >= maxD || pts.length < 4 || c0 === 0 || c0 === pts.length) return { leaf: true, cls: maj };
      var best = null;
      ['x', 'y'].forEach(function (ax) {
        var vals = pts.map(function (p) { return p[ax]; }).sort(function (a, b) { return a - b; });
        for (var v = 0; v < vals.length - 1; v++) {
          var thr = (vals[v] + vals[v + 1]) / 2, L = [], R = [];
          pts.forEach(function (p) { (p[ax] <= thr ? L : R).push(p); });
          if (!L.length || !R.length) continue;
          var g = (L.length * gini(L) + R.length * gini(R)) / pts.length;
          if (!best || g < best.g) best = { g: g, ax: ax, thr: thr, L: L, R: R };
        }
      });
      if (!best) return { leaf: true, cls: maj };
      return { leaf: false, ax: best.ax, thr: best.thr,
               left: build(best.L, depth + 1, maxD), right: build(best.R, depth + 1, maxD) };
    }
    function predict(node, x, y) {
      while (!node.leaf) { node = ((node.ax === 'x' ? x : y) <= node.thr) ? node.left : node.right; }
      return node.cls;
    }

    el.innerHTML =
      '<div class="lw-ctrl"><div class="lw-ctrl-row"><span>tree depth</span><b class="lw-depth">' + START + '</b></div>' +
      '<input class="lw-slider" type="range" min="' + MIN + '" max="' + MAX + '" step="1" value="' + START + '"></div>' +
      '<div class="lw-grid">' +
        '<div><div class="lw-canvas-wrap"><canvas class="lw-canvas" width="300" height="300"></canvas></div>' +
        '<div class="lw-legend"><span class="lw-k"><i class="lw-sw" style="background:' + C0 + '"></i>' + labels.c0 + '</span>' +
        '<span class="lw-k"><i class="lw-sw" style="background:' + C1 + '"></i>' + labels.c1 + '</span>' +
        (SHOW_TEST ? '<span class="lw-k"><i class="lw-sw lw-sw-ring"></i>held-out test point</span>' : '') + '</div></div>' +
        '<div class="lw-metrics">' +
          '<div class="lw-m lw-m-train"><div class="lw-v lw-train">.</div><div class="lw-k2">Train accuracy</div></div>' +
          (SHOW_TEST ? '<div class="lw-m lw-m-test"><div class="lw-v lw-test">.</div><div class="lw-k2">Test accuracy</div></div>' : '') +
        '</div>' +
      '</div>' +
      '<div class="lw-note"></div>';

    var slider = el.querySelector('.lw-slider');
    var depthEl = el.querySelector('.lw-depth');
    var canvas = el.querySelector('.lw-canvas');
    var trainEl = el.querySelector('.lw-train');
    var testEl = el.querySelector('.lw-test');
    var noteEl = el.querySelector('.lw-note');
    var ctx = canvas.getContext('2d');

    function acc(tree, pts) {
      var ok = 0; pts.forEach(function (p) { if (predict(tree, p.x, p.y) === p.c) ok++; });
      return pts.length ? ok / pts.length : 0;
    }

    function render() {
      var d = +slider.value;
      depthEl.textContent = d;
      var tree = build(TRAIN, 0, d);
      var W = canvas.width, H = canvas.height, cell = 6;
      for (var px = 0; px < W; px += cell) {
        for (var py = 0; py < H; py += cell) {
          var x = px / W, y = 1 - py / H;
          ctx.fillStyle = predict(tree, x, y) === 0 ? 'rgba(37,99,168,0.13)' : 'rgba(181,99,26,0.13)';
          ctx.fillRect(px, py, cell, cell);
        }
      }
      DATA.forEach(function (p) {
        if (p.test && !SHOW_TEST) return;
        var X = p.x * W, Y = (1 - p.y) * H;
        ctx.beginPath(); ctx.arc(X, Y, 3.6, 0, 7);
        if (p.test) {
          ctx.fillStyle = '#fff'; ctx.fill();
          ctx.lineWidth = 2.2; ctx.strokeStyle = (p.c === 0) ? C0 : C1; ctx.stroke();
        } else {
          ctx.fillStyle = (p.c === 0) ? C0 : C1; ctx.fill();
          ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.stroke();
        }
      });
      var trA = acc(tree, TRAIN), teA = acc(tree, TEST);
      trainEl.textContent = (trA * 100).toFixed(0) + '%';
      if (testEl) testEl.textContent = (teA * 100).toFixed(0) + '%';
      var verdict, vclass;
      if (trA < 0.82) { verdict = 'Underfitting: the tree is too shallow to capture the boundary.'; vclass = 'lw-under'; }
      else if (trA - teA > 0.13) { verdict = 'Overfitting: it is memorizing noise. Train is high, test has dropped.'; vclass = 'lw-over'; }
      else { verdict = 'Good fit: the boundary is about as accurate on unseen data as on training data.'; vclass = 'lw-good'; }
      noteEl.className = 'lw-note ' + vclass;
      noteEl.innerHTML = '<b>Depth ' + d + '.</b> ' + verdict;
    }

    slider.addEventListener('input', render);
    render();
  }

  if (window.LessonWidgets) window.LessonWidgets.register('decision-region', mount);
})();
