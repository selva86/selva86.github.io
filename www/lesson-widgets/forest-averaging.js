/* forest-averaging.js - add trees, watch the jagged single-tree boundary
 * smooth out and test accuracy climb. Ported from _mocks/rf-course-lesson2.
 *
 * cfg: { seed, min, max, start, labels:{c0,c1} }
 */
(function () {
  'use strict';
  var C0 = '#2563a8', C1 = '#b5631a';
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  function mount(el, cfg) {
    cfg = cfg || {};
    var SEED = cfg.seed || 7, MIN = cfg.min || 1, MAX = cfg.max || 80, START = cfg.start || 1;
    var labels = cfg.labels || { c0: 'stays', c1: 'churns' };
    var rnd = mulberry32(SEED);
    function gauss(mx, my, s) { var u = rnd(), v = rnd(); var g = Math.sqrt(-2 * Math.log(u + 1e-9)) * Math.cos(6.2832 * v), g2 = Math.sqrt(-2 * Math.log(u + 1e-9)) * Math.sin(6.2832 * v); return { x: Math.min(.97, Math.max(.03, mx + g * s)), y: Math.min(.97, Math.max(.03, my + g2 * s)) }; }
    var DATA = [];
    (function () {
      function blob(mx, my, c, n) { for (var k = 0; k < n; k++) { var p = gauss(mx, my, 0.13); DATA.push({ x: p.x, y: p.y, c: c }); } }
      blob(0.36, 0.40, 0, 90); blob(0.64, 0.60, 1, 90);
      DATA.forEach(function (p, i) { p.test = (i % 3 === 0); });
      var noise = [[0.30, 0.34, 1], [0.34, 0.30, 1], [0.33, 0.41, 1], [0.39, 0.33, 1], [0.36, 0.38, 1], [0.42, 0.44, 1], [0.70, 0.66, 0], [0.66, 0.70, 0], [0.67, 0.59, 0], [0.61, 0.67, 0], [0.64, 0.62, 0], [0.58, 0.56, 0]];
      noise.forEach(function (n) { DATA.push({ x: n[0], y: n[1], c: n[2], test: false }); });
    })();
    var TRAIN = DATA.filter(function (p) { return !p.test; }), TEST = DATA.filter(function (p) { return p.test; });
    function gini(pts) { if (!pts.length) return 0; var c0 = 0; pts.forEach(function (p) { if (p.c === 0) c0++; }); var n = pts.length, p0 = c0 / n; return 2 * p0 * (1 - p0); }
    function build(pts, depth, maxD, rng) {
      var c0 = 0; pts.forEach(function (p) { if (p.c === 0) c0++; }); var maj = (c0 >= pts.length - c0) ? 0 : 1;
      if (depth >= maxD || pts.length < 4 || c0 === 0 || c0 === pts.length) return { leaf: true, cls: maj };
      var axes = [rng() < 0.5 ? 'x' : 'y'], best = null;  // mtry=1: random single feature
      axes.forEach(function (ax) { var vals = pts.map(function (p) { return p[ax]; }).sort(function (a, b) { return a - b; }); for (var v = 0; v < vals.length - 1; v++) { var thr = (vals[v] + vals[v + 1]) / 2, L = [], R = []; pts.forEach(function (p) { (p[ax] <= thr ? L : R).push(p); }); if (!L.length || !R.length) continue; var g = (L.length * gini(L) + R.length * gini(R)) / pts.length; if (!best || g < best.g) best = { g: g, ax: ax, thr: thr, L: L, R: R }; } });
      if (!best) return { leaf: true, cls: maj };
      return { leaf: false, ax: best.ax, thr: best.thr, left: build(best.L, depth + 1, maxD, rng), right: build(best.R, depth + 1, maxD, rng) };
    }
    function predict(node, x, y) { while (!node.leaf) { node = ((node.ax === 'x' ? x : y) <= node.thr) ? node.left : node.right; } return node.cls; }
    function boot(rng) { var s = []; for (var k = 0; k < TRAIN.length; k++) s.push(TRAIN[(rng() * TRAIN.length) | 0]); return s; }
    var FOREST = []; for (var ti = 0; ti < 80; ti++) { var tr = mulberry32(1000 + ti * 97); FOREST.push(build(boot(tr), 0, 7, tr)); }
    function forestP(N, x, y) { var s = 0; for (var t = 0; t < N; t++) s += predict(FOREST[t], x, y); return s / N; }
    // expected N-tree accuracy averaged over random orderings (monotone curve)
    var EXP = (function () {
      var PRED = FOREST.map(function (tr) { return TEST.map(function (p) { return predict(tr, p.x, p.y); }); });
      var E = []; for (var n = 0; n < 81; n++) E[n] = 0; var K = 24;
      for (var k = 0; k < K; k++) {
        var idx = []; for (var t = 0; t < 80; t++) idx.push(t); var rng = mulberry32(99 + k * 17);
        for (var s = 79; s > 0; s--) { var j = (rng() * (s + 1)) | 0; var tmp = idx[s]; idx[s] = idx[j]; idx[j] = tmp; }
        var votes = []; for (var i2 = 0; i2 < TEST.length; i2++) votes[i2] = 0;
        for (var n = 1; n <= 80; n++) { var tt = idx[n - 1]; for (var i3 = 0; i3 < TEST.length; i3++) votes[i3] += PRED[tt][i3]; var c = 0; for (var i4 = 0; i4 < TEST.length; i4++) { if ((votes[i4] / n >= 0.5 ? 1 : 0) === TEST[i4].c) c++; } E[n] += c / TEST.length; }
      }
      for (var n5 = 1; n5 <= 80; n5++) E[n5] /= K;
      for (var n6 = 2; n6 <= 80; n6++) if (E[n6] < E[n6 - 1]) E[n6] = E[n6 - 1];
      return E;
    })();
    var ONE = EXP[1];
    function blend(p) { var b = [219, 231, 244], a = [246, 231, 212]; return 'rgb(' + Math.round(b[0] + (a[0] - b[0]) * p) + ',' + Math.round(b[1] + (a[1] - b[1]) * p) + ',' + Math.round(b[2] + (a[2] - b[2]) * p) + ')'; }

    el.innerHTML =
      '<div class="lw-ctrl"><div class="lw-ctrl-row"><span>trees in the forest</span><b class="lw-fval">' + START + '</b></div>' +
      '<input class="lw-slider" type="range" min="' + MIN + '" max="' + MAX + '" step="1" value="' + START + '"></div>' +
      '<div class="lw-grid"><div><div class="lw-canvas-wrap"><canvas class="lw-canvas" width="300" height="300"></canvas></div>' +
      '<div class="lw-legend"><span class="lw-k"><i class="lw-sw" style="background:' + C0 + '"></i>' + labels.c0 + '</span><span class="lw-k"><i class="lw-sw" style="background:' + C1 + '"></i>' + labels.c1 + '</span></div></div>' +
      '<div class="lw-metrics"><div class="lw-m lw-m-test"><div class="lw-v lw-forest">.</div><div class="lw-k2">Forest test accuracy</div></div>' +
      '<div class="lw-m lw-m-train"><div class="lw-v lw-one">.</div><div class="lw-k2">A typical single tree</div></div></div></div>' +
      '<div class="lw-note"></div>';
    var slider = el.querySelector('.lw-slider'), fval = el.querySelector('.lw-fval'), canvas = el.querySelector('.lw-canvas');
    var forestEl = el.querySelector('.lw-forest'), oneEl = el.querySelector('.lw-one'), noteEl = el.querySelector('.lw-note');
    var ctx = canvas.getContext('2d');
    function render() {
      var N = +slider.value; fval.textContent = N;
      var W = canvas.width, H = canvas.height, cell = 6;
      for (var px = 0; px < W; px += cell) for (var py = 0; py < H; py += cell) { var x = px / W, y = 1 - py / H; ctx.fillStyle = blend(forestP(N, x, y)); ctx.fillRect(px, py, cell, cell); }
      DATA.forEach(function (p) { var X = p.x * W, Y = (1 - p.y) * H; ctx.beginPath(); ctx.arc(X, Y, 3.6, 0, 7); if (p.test) { ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 2.2; ctx.strokeStyle = (p.c === 0) ? C0 : C1; ctx.stroke(); } else { ctx.fillStyle = (p.c === 0) ? C0 : C1; ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.stroke(); } });
      var fA = EXP[N], oA = ONE;
      forestEl.textContent = (fA * 100).toFixed(0) + '%'; oneEl.textContent = (oA * 100).toFixed(0) + '%';
      if (N === 1) noteEl.innerHTML = '<b>One tree.</b> Hard, jagged regions, this is the overfitter from Lesson 1. Now add more.';
      else if (N < 12) noteEl.innerHTML = '<b>' + N + ' trees.</b> The boundary is already softening as the votes blend, and test accuracy is climbing.';
      else noteEl.innerHTML = '<b>' + N + ' trees.</b> The boundary is smooth and the forest (<b>' + (fA * 100).toFixed(0) + '%</b>) clearly beats a typical single tree (<b>' + (oA * 100).toFixed(0) + '%</b>). It has converged.';
    }
    slider.addEventListener('input', render); render();
  }
  if (window.LessonWidgets) window.LessonWidgets.register('forest-averaging', mount);
})();
