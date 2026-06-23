/* index.js */
/* lesson-widgets/index.js - registry + mounter for interactive lesson widgets.
 *
 * Each widget module calls LessonWidgets.register('<type>', mount). The player
 * (lesson-mode.js) calls mountAll(stepEl) when a step becomes visible, because
 * canvases must size themselves while shown, not while display:none.
 *
 * mount(el, cfg) contract: build controls + canvas inside el; idempotent
 * (guarded by el.dataset.mounted); self-contained; deterministic (seeded).
 */
(function () {
  'use strict';
  var registry = {};

  window.LessonWidgets = {
    register: function (type, mountFn) { registry[type] = mountFn; },

    mount: function (el) {
      if (!el || el.dataset.mounted) return;
      var type = el.getAttribute('data-widget-type');
      var fn = registry[type];
      if (!fn) return;                       // unknown type: leave the noscript fallback
      var cfg = {};
      try { cfg = JSON.parse(el.getAttribute('data-widget-config') || '{}'); } catch (e) {}
      el.dataset.mounted = '1';
      try { fn(el, cfg); }
      catch (e) { if (window.console) console.error('[lesson-widget] ' + type + ' failed', e); }
    },

    mountAll: function (root) {
      var scope = root || document;
      var els = scope.querySelectorAll ? scope.querySelectorAll('.lesson-widget') : [];
      for (var i = 0; i < els.length; i++) this.mount(els[i]);
    }
  };
})();

;
/* bootstrap-sample.js */
/* bootstrap-sample.js - draw a bootstrap sample (rows picked with replacement)
 * and see which rows are left out (out-of-bag). Counts are real: about 37% of
 * rows land out-of-bag on average. Interactive (Draw again).
 * cfg (optional): { n, seed, tail }  tail = the closing sentence of the note.
 */
(function () {
  'use strict';
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var C_IN = '#1f7a55', C_DUP = '#2563a8', C_OOB = '#aeb6c2', INK = '#131720', MUT = '#677084';

  function mount(el, cfg) {
    cfg = cfg || {};
    var n = cfg.n || 12, seed0 = cfg.seed || 7, draw = 0;
    var tail = cfg.tail || 'Those rows trained no tree here, so they are a free test set.';
    el.innerHTML =
      '<div class="lw-diagram" style="text-align:center">' +
      '<div class="lw-bs-strip" style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:2px 0 10px"></div>' +
      '<div class="lw-bs-note" style="font:600 12px/1.5 \'IBM Plex Mono\',monospace;color:' + INK + ';min-height:3em"></div>' +
      '<button type="button" class="lw-bs-draw" style="margin-top:8px;font:600 12px \'IBM Plex Mono\',monospace;color:#fff;background:' + C_IN + ';border:0;border-radius:7px;padding:8px 16px;cursor:pointer">Draw again</button>' +
      '<div style="font:500 11px/1.5 \'IBM Plex Mono\',monospace;color:' + MUT + ';margin-top:8px">' +
      '<span style="color:' + C_IN + '">&#9632;</span> in the sample &nbsp; <span style="color:' + C_DUP + '">&#9632;</span> picked more than once &nbsp; <span style="color:' + C_OOB + '">&#9632;</span> out-of-bag</div>' +
      '</div>';
    var strip = el.querySelector('.lw-bs-strip'), note = el.querySelector('.lw-bs-note'), btn = el.querySelector('.lw-bs-draw'), i;

    function render() {
      var rng = mulberry32(seed0 + draw * 977), counts = [];
      for (i = 0; i < n; i++) counts[i] = 0;
      for (var d = 0; d < n; d++) { counts[(rng() * n) | 0]++; }
      var oob = 0, html = '';
      for (i = 0; i < n; i++) {
        var c = counts[i], bg = c === 0 ? C_OOB : (c > 1 ? C_DUP : C_IN);
        if (c === 0) oob++;
        var lbl = c === 0 ? 'OOB' : ('#' + (i + 1) + (c > 1 ? (' x' + c) : ''));
        html += '<span style="display:inline-block;min-width:52px;padding:6px 8px;border-radius:6px;background:' + bg + ';color:#fff;font:600 11px \'IBM Plex Mono\',monospace">' + lbl + '</span>';
      }
      strip.innerHTML = html;
      var pct = Math.round(oob / n * 100);
      note.innerHTML = 'Out-of-bag this draw: <b>' + oob + ' of ' + n + '</b> rows (' + pct + '%). ' + tail;
    }
    btn.addEventListener('click', function () { draw++; render(); });
    render();
  }
  if (window.LessonWidgets) window.LessonWidgets.register('bootstrap-sample', mount);
})();

;
/* decision-region.js */
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

;
/* decorrelation.js */
/* decorrelation.js - toggle bagging vs random-features and watch the trees'
 * first splits go from all-identical (correlated) to varied (decorrelated).
 * Ported from _mocks/rf-course-lesson2.
 */
(function () {
  'use strict';
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  function mount(el, cfg) {
    var FEATS = [
      { n: 'tenure', s: 0.92, c: '#2563a8' }, { n: 'monthly_spend', s: 0.64, c: '#1f7a55' },
      { n: 'support_calls', s: 0.55, c: '#b5631a' }, { n: 'contract', s: 0.42, c: '#8a46b0' },
      { n: 'age', s: 0.22, c: '#5a4fcf' }
    ];
    var mtry = 5;
    el.innerHTML =
      '<div class="lw-toggle"><button type="button" data-m="5" class="on">Consider all 5 features (bagging)</button>' +
      '<button type="button" data-m="2">Random 2 of 5 (random forest)</button></div>' +
      '<div class="lw-dtrees"></div>' +
      '<div class="lw-divmeter"><span class="lw-divlbl">Tree <b>diversity</b></span>' +
      '<span class="lw-divtrack"><span class="lw-divfill"></span></span><span class="lw-divpv">.</span></div>' +
      '<div class="lw-note"></div>';
    var host = el.querySelector('.lw-dtrees'), fill = el.querySelector('.lw-divfill'),
        pv = el.querySelector('.lw-divpv'), note = el.querySelector('.lw-note');

    function render() {
      var roots = [], html = '';
      for (var t = 0; t < 6; t++) {
        var rng = mulberry32(50 + t * 131 + (mtry === 5 ? 0 : 324));
        var idx = [0, 1, 2, 3, 4];
        for (var s = 4; s > 0; s--) { var j = (rng() * (s + 1)) | 0; var tmp = idx[s]; idx[s] = idx[j]; idx[j] = tmp; }
        var subset = idx.slice(0, mtry), bf = subset[0];
        subset.forEach(function (f) { if (FEATS[f].s > FEATS[bf].s) bf = f; });
        roots.push(bf);
        html += '<div class="lw-dcard"><div class="lw-dtn">tree ' + (t + 1) + '</div><div class="lw-drl">first split on</div>' +
          '<div class="lw-droot" style="background:' + FEATS[bf].c + '">' + FEATS[bf].n + '</div></div>';
      }
      host.innerHTML = html;
      var distinct = {}; roots.forEach(function (r) { distinct[r] = 1; });
      var div = Object.keys(distinct).length, pct = Math.round((div - 1) / 5 * 100);
      fill.style.width = pct + '%'; pv.textContent = div + '/6';
      note.innerHTML = (mtry === 5)
        ? '<b>Bagging:</b> every tree may use all features, so the strongest one, <code>tenure</code>, wins every first split. The trees are near-identical, correlated, and averaging barely helps.'
        : '<b>Random forest:</b> each tree sees only 2 random features, so <code>tenure</code> often is not even an option. The first splits scatter across features, the trees decorrelate, and averaging pays off.';
    }
    Array.prototype.forEach.call(el.querySelectorAll('.lw-toggle button'), function (b) {
      b.addEventListener('click', function () {
        mtry = +b.getAttribute('data-m');
        Array.prototype.forEach.call(el.querySelectorAll('.lw-toggle button'), function (x) { x.classList.toggle('on', x === b); });
        render();
      });
    });
    render();
  }
  if (window.LessonWidgets) window.LessonWidgets.register('decorrelation', mount);
})();

;
/* forest-averaging.js */
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

;
/* gini-split.js */
/* gini-split.js - one decision-tree split shown as a purity (Gini) drop.
 * A mixed parent node splits into two purer children; every Gini value is
 * computed from the real counts, not hard-coded. Static by design.
 * cfg (optional): { feature, parent:[stay,churn], left:[stay,churn],
 *                   right:[stay,churn], labels:{stay,churn} }
 */
(function () {
  'use strict';
  var C_STAY = '#2563a8', C_CHURN = '#b5631a', INK = '#131720', MUT = '#677084', LINE = '#c5cdda';

  function gini(a, b) { var n = a + b; if (!n) return 0; var p = a / n, q = b / n; return 1 - p * p - q * q; }
  function f2(x) { return (Math.round(x * 100) / 100).toFixed(2); }

  function dots(cx, cy, stay, churn) {
    var n = stay + churn, per = 10, gap = 12, out = '', i;
    var cols = Math.min(n, per), w = (cols - 1) * gap, x0 = cx - w / 2;
    for (i = 0; i < n; i++) {
      var col = i % per, row = (i / per) | 0, fill = i < stay ? C_STAY : C_CHURN;
      out += '<circle cx="' + (x0 + col * gap) + '" cy="' + (cy + row * gap) + '" r="4.4" fill="' + fill + '"/>';
    }
    return out;
  }
  function nodeBox(cx, top, w, h) {
    return '<rect x="' + (cx - w / 2) + '" y="' + top + '" width="' + w + '" height="' + h + '" rx="9" fill="#fff" stroke="' + LINE + '" stroke-width="1.5"/>';
  }
  function txt(x, y, s, col, fs, weight) {
    return '<text x="' + x + '" y="' + y + '" text-anchor="middle" fill="' + (col || INK) +
      '" font-family="IBM Plex Mono, monospace" font-size="' + (fs || 11) + '" font-weight="' + (weight || 600) + '">' + s + '</text>';
  }

  function mount(el, cfg) {
    cfg = cfg || {};
    var feature = cfg.feature || 'tenure under 8 mo?';
    var P = cfg.parent || [10, 10], L = cfg.left || [2, 8], R = cfg.right || [8, 2];
    var ln = cfg.labels || {}, sName = ln.stay || 'stays', cName = ln.churn || 'churns';
    var gp = gini(P[0], P[1]), gl = gini(L[0], L[1]), gr = gini(R[0], R[1]);
    var nL = L[0] + L[1], nR = R[0] + R[1], nT = nL + nR;
    var gw = nT ? (nL / nT) * gl + (nR / nT) * gr : 0;

    var svg =
      '<svg viewBox="0 0 460 300" width="100%" style="max-width:480px;display:block;margin:0 auto" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A split lowers Gini impurity from ' + f2(gp) + ' to ' + f2(gw) + '.">' +
      nodeBox(230, 8, 220, 60) + dots(230, 28, P[0], P[1]) + txt(230, 60, 'parent: Gini = ' + f2(gp), MUT, 11) +
      '<line x1="230" y1="68" x2="120" y2="150" stroke="' + LINE + '" stroke-width="2"/>' +
      '<line x1="230" y1="68" x2="340" y2="150" stroke="' + LINE + '" stroke-width="2"/>' +
      txt(230, 92, feature, INK, 11) + txt(158, 116, 'yes', MUT, 10) + txt(302, 116, 'no', MUT, 10) +
      nodeBox(120, 150, 170, 58) + dots(120, 170, L[0], L[1]) + txt(120, 200, 'Gini = ' + f2(gl), MUT, 11) +
      nodeBox(340, 150, 170, 58) + dots(340, 170, R[0], R[1]) + txt(340, 200, 'Gini = ' + f2(gr), MUT, 11) +
      txt(230, 250, 'weighted Gini = ' + f2(gw), INK, 14, 700) +
      txt(230, 272, 'down from ' + f2(gp) + ': a purer split', '#1f7a55', 11) +
      '</svg>';
    el.innerHTML = '<div class="lw-diagram">' +
      '<div style="text-align:center;font:600 11px/1.4 \'IBM Plex Mono\',monospace;color:' + MUT + ';margin-bottom:2px">' +
      '<span style="color:' + C_STAY + '">&#9679;</span> ' + sName + ' &nbsp; <span style="color:' + C_CHURN + '">&#9679;</span> ' + cName + '</div>' +
      svg + '</div>';
  }
  if (window.LessonWidgets) window.LessonWidgets.register('gini-split', mount);
})();

;
/* importance-bars.js */
/* importance-bars.js - variable importance as sorted horizontal bars.
 * An illustrative ranking for the lesson's churn example (consistent with the
 * running narrative), not a measured benchmark. Static.
 * cfg (optional): { items:[{label,value}] }
 */
(function () {
  'use strict';
  var INK = '#131720', MUT = '#677084', BAR = '#1f7a55', TOP = '#2563a8';

  function mount(el, cfg) {
    cfg = cfg || {};
    var items = (cfg.items && cfg.items.length) ? cfg.items.slice() : [
      { label: 'tenure', value: 100 }, { label: 'monthly spend', value: 71 },
      { label: 'total spend', value: 58 }, { label: 'support calls', value: 34 },
      { label: 'contract type', value: 22 }, { label: 'age', value: 12 }
    ];
    items.sort(function (a, b) { return b.value - a.value; });
    var max = items[0].value || 1, n = items.length;
    var rowH = 30, padT = 12, padB = 8, labW = 120, barX = labW + 8, barMax = 280;
    var H = padT + n * rowH + padB, W = barX + barMax + 46, rows = '', i;
    for (i = 0; i < n; i++) {
      var y = padT + i * rowH, bw = Math.max(2, items[i].value / max * barMax), col = i === 0 ? TOP : BAR;
      rows += '<text x="' + labW + '" y="' + (y + 18) + '" text-anchor="end" fill="' + INK + '" font-family="IBM Plex Mono, monospace" font-size="12" font-weight="600">' + items[i].label + '</text>' +
        '<rect x="' + barX + '" y="' + (y + 5) + '" width="' + bw + '" height="18" rx="4" fill="' + col + '"/>' +
        '<text x="' + (barX + bw + 6) + '" y="' + (y + 18) + '" fill="' + MUT + '" font-family="IBM Plex Mono, monospace" font-size="11">' + items[i].value + '</text>';
    }
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block;margin:0 auto" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Variable importance ranking, ' + items[0].label + ' highest.">' + rows + '</svg>';
    el.innerHTML = '<div class="lw-diagram">' + svg + '</div>';
  }
  if (window.LessonWidgets) window.LessonWidgets.register('importance-bars', mount);
})();

;
/* oob-tuner.js */
/* oob-tuner.js - tune num.trees and mtry on a live forest; watch the OOB error
 * curve fall and flatten, and the mtry sweet spot. Ported from
 * _mocks/rf-course-lesson3 (the canonical OOB-vs-ntree curve + mtry U-shape).
 */
(function () {
  'use strict';
  var IMP = [['tenure', 100], ['monthly_spend', 74], ['total_spend', 63], ['support_calls', 55],
             ['contract_type', 43], ['num_services', 31], ['age', 19], ['payment_method', 12]];

  function asym(m) { return 0.115 + (m < 3 ? 0.020 * Math.pow(3 - m, 1.4) : 0.003 * (m - 3) * (m - 3)); }
  function jit(t) { var x = Math.sin(t * 12.9898) * 43758.5453; return (x - Math.floor(x)) - 0.5; }
  function oobErr(t, m) { var a = asym(m); var base = a + (0.33 - a) * Math.exp(-t / 34); return Math.max(0.045, base + 0.012 * Math.exp(-t / 26) * jit(t)); }

  function mount(el, cfg) {
    var bestMtry = (function () { var b = 1, be = asym(1); for (var m = 2; m <= 8; m++) { if (asym(m) < be) { be = asym(m); b = m; } } return b; })();
    el.innerHTML =
      '<div class="lw-dual">' +
        '<div class="lw-ctrl"><div class="lw-ctrl-row"><span>num.trees</span><b class="lw-tt">100</b></div><input class="lw-strees" type="range" min="1" max="500" step="1" value="100"></div>' +
        '<div class="lw-ctrl"><div class="lw-ctrl-row"><span>mtry (of 8 features)</span><b class="lw-tm">3</b></div><input class="lw-smtry" type="range" min="1" max="8" step="1" value="3"></div>' +
      '</div>' +
      '<div class="lw-chartwrap"><canvas class="lw-oob" width="920" height="440"></canvas></div>' +
      '<div class="lw-readout">' +
        '<div class="lw-m lw-r-err"><div class="lw-v lw-err">.</div><div class="lw-k2">OOB error</div></div>' +
        '<div class="lw-m lw-r-acc"><div class="lw-v lw-acc">.</div><div class="lw-k2">OOB accuracy</div></div>' +
        '<div class="lw-m lw-r-best"><div class="lw-v lw-best">.</div><div class="lw-k2">Best mtry here</div></div>' +
      '</div>' +
      '<div class="lw-impbox"><div class="lw-imph">Variable importance (impurity)</div><div class="lw-imp"></div></div>' +
      '<div class="lw-note"></div>';
    var sT = el.querySelector('.lw-strees'), sM = el.querySelector('.lw-smtry');
    var tt = el.querySelector('.lw-tt'), tm = el.querySelector('.lw-tm');
    var cv = el.querySelector('.lw-oob'), ctx = cv.getContext('2d');
    var errEl = el.querySelector('.lw-err'), accEl = el.querySelector('.lw-acc'), bestEl = el.querySelector('.lw-best'), note = el.querySelector('.lw-note');
    el.querySelector('.lw-imp').innerHTML = IMP.map(function (f) {
      return '<div class="lw-improw"><div class="lw-impnm">' + f[0] + '</div><div class="lw-impbar"><div class="lw-impfill" style="width:' + f[1] + '%"></div></div><div class="lw-imppct">' + f[1] + '</div></div>';
    }).join('');

    function draw() {
      var T = +sT.value, M = +sM.value; tt.textContent = T; tm.textContent = M;
      var W = cv.width, H = cv.height; ctx.clearRect(0, 0, W, H);
      var mL = 64, mR = 22, mT = 20, mB = 52, pW = W - mL - mR, pH = H - mT - mB, eMin = 0.04, eMax = 0.34;
      function X(t) { return mL + (t - 1) / 499 * pW; } function Y(e) { return mT + (1 - (e - eMin) / (eMax - eMin)) * pH; }
      ctx.font = "500 17px 'IBM Plex Mono',monospace"; ctx.textBaseline = "middle";
      [0.10, 0.15, 0.20, 0.25, 0.30].forEach(function (e) { var y = Y(e); ctx.strokeStyle = "#eef1f6"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(mL, y); ctx.lineTo(W - mR, y); ctx.stroke(); ctx.fillStyle = "#97a0b2"; ctx.textAlign = "right"; ctx.fillText((e * 100) + "%", mL - 10, y); });
      ctx.textAlign = "center"; ctx.textBaseline = "top"; [1, 100, 200, 300, 400, 500].forEach(function (t) { ctx.fillStyle = "#97a0b2"; ctx.fillText(t, X(t), H - mB + 12); });
      ctx.fillStyle = "#677084"; ctx.font = "600 18px 'IBM Plex Sans',sans-serif"; ctx.textAlign = "center"; ctx.fillText("number of trees", mL + pW / 2, H - 20);
      ctx.save(); ctx.translate(20, mT + pH / 2); ctx.rotate(-Math.PI / 2); ctx.fillText("OOB error", 0, 0); ctx.restore();
      var aY = Y(asym(M)); ctx.setLineDash([7, 6]); ctx.strokeStyle = "#c2410c"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(mL, aY); ctx.lineTo(W - mR, aY); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = "#c2410c"; ctx.font = "600 16px 'IBM Plex Mono',monospace"; ctx.textAlign = "left"; ctx.textBaseline = "bottom"; ctx.fillText("floor " + (asym(M) * 100).toFixed(1) + "%", mL + 8, aY - 4);
      ctx.strokeStyle = "rgba(31,122,85,.22)"; ctx.lineWidth = 2; ctx.beginPath(); for (var t = 1; t <= 500; t += 2) { var x = X(t), y = Y(oobErr(t, M)); t === 1 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke();
      ctx.strokeStyle = "#1f7a55"; ctx.lineWidth = 3.4; ctx.lineJoin = "round"; ctx.beginPath(); for (var t2 = 1; t2 <= T; t2++) { var x2 = X(t2), y2 = Y(oobErr(t2, M)); t2 === 1 ? ctx.moveTo(x2, y2) : ctx.lineTo(x2, y2); } ctx.stroke();
      var mx = X(T), my = Y(oobErr(T, M)); ctx.beginPath(); ctx.arc(mx, my, 7, 0, 7); ctx.fillStyle = "#1f7a55"; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = "#fff"; ctx.stroke();
      var e = oobErr(T, M); errEl.textContent = (e * 100).toFixed(1) + '%'; accEl.textContent = ((1 - e) * 100).toFixed(1) + '%'; bestEl.textContent = 'mtry ' + bestMtry;
      var parts = [];
      if (M < 3) parts.push('<b>mtry ' + M + ' is low:</b> each tree is starved of features, so the floor sits above its best.');
      else if (M > 5) parts.push('<b>mtry ' + M + ' is high:</b> trees re-correlate (all chasing the strong features) and the floor creeps back up.');
      else parts.push('<b>mtry ' + M + ' &asymp; &radic;8:</b> the sweet spot, the floor is as low as it goes.');
      if (T < 60) parts.push(' The curve is still falling, drag <b>trees</b> higher.');
      else if (T >= 220) parts.push(' Past ~200 trees the curve is flat, more trees just cost time.');
      else parts.push(' The error has nearly settled.');
      note.innerHTML = parts.join('');
    }
    sT.addEventListener('input', draw); sM.addEventListener('input', draw); draw();
  }
  if (window.LessonWidgets) window.LessonWidgets.register('oob-tuner', mount);
})();

;
/* process-flow.js */
/* process-flow.js - a numbered N-step pipeline as a vertical flow diagram.
 * Static. Reads well on desktop and narrow screens (single column).
 * cfg (optional): { steps:[{title, sub}] }
 */
(function () {
  'use strict';
  var INK = '#131720', MUT = '#677084', ACC = '#1f7a55', BG = '#f3f6f4', LINE = '#c5cdda';
  var _uid = 0;

  function mount(el, cfg) {
    cfg = cfg || {};
    var steps = (cfg.steps && cfg.steps.length) ? cfg.steps : [
      { title: 'Bootstrap', sub: 'grow each tree on its own random resample of the rows' },
      { title: 'Random features', sub: 'at each split, consider only a random subset (mtry)' },
      { title: 'Average', sub: 'all trees vote; the majority or mean is the forest answer' }
    ];
    var n = steps.length, boxH = 62, gap = 24, padY = 6;
    var H = padY * 2 + n * boxH + (n - 1) * gap, mid = 'pf-ar' + (++_uid), out = '', i;
    for (i = 0; i < n; i++) {
      var y = padY + i * (boxH + gap), cy = y + boxH / 2;
      out += '<rect x="8" y="' + y + '" width="444" height="' + boxH + '" rx="11" fill="' + BG + '" stroke="' + LINE + '" stroke-width="1.5"/>' +
        '<circle cx="40" cy="' + cy + '" r="16" fill="' + ACC + '"/>' +
        '<text x="40" y="' + (cy + 5) + '" text-anchor="middle" fill="#fff" font-family="IBM Plex Mono, monospace" font-size="15" font-weight="700">' + (i + 1) + '</text>' +
        '<text x="68" y="' + (y + 26) + '" fill="' + INK + '" font-family="IBM Plex Mono, monospace" font-size="14" font-weight="700">' + steps[i].title + '</text>' +
        '<text x="68" y="' + (y + 46) + '" fill="' + MUT + '" font-family="IBM Plex Mono, monospace" font-size="11">' + steps[i].sub + '</text>';
      if (i < n - 1) out += '<line x1="40" y1="' + (y + boxH + 2) + '" x2="40" y2="' + (y + boxH + gap - 4) + '" stroke="' + MUT + '" stroke-width="2" marker-end="url(#' + mid + ')"/>';
    }
    var svg = '<svg viewBox="0 0 460 ' + H + '" width="100%" style="max-width:460px;display:block;margin:0 auto" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + n + '-step process flow">' +
      '<defs><marker id="' + mid + '" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="' + MUT + '"/></marker></defs>' + out + '</svg>';
    el.innerHTML = '<div class="lw-diagram">' + svg + '</div>';
  }
  if (window.LessonWidgets) window.LessonWidgets.register('process-flow', mount);
})();

;
/* tree-diagram.js */
/* tree-diagram.js - a clean static decision-tree SVG. Used as a cover hero so a
 * lesson opens with a visual, not plain text. Non-interactive by design (it sets
 * the scene without spoiling the live demos later in the lesson).
 *
 * cfg (all optional): { root, l, r, leaves:[ll,lr,rl,rr] }  // node labels
 */
(function () {
  'use strict';
  var INK = '#131720', C0 = '#2563a8', C1 = '#b5631a', LINE = '#c5cdda', MUT = '#677084';

  function box(x, y, w, h, fill, stroke, text, tcolor, fs) {
    return '<rect x="' + (x - w / 2) + '" y="' + (y - h / 2) + '" width="' + w + '" height="' + h +
      '" rx="8" fill="' + fill + '" stroke="' + stroke + '" stroke-width="1.5"/>' +
      '<text x="' + x + '" y="' + (y + (fs ? fs * 0.34 : 4.5)) + '" text-anchor="middle" fill="' + tcolor +
      '" font-family="IBM Plex Mono, monospace" font-size="' + (fs || 12) + '" font-weight="600">' + text + '</text>';
  }
  function edge(x1, y1, x2, y2, label) {
    var mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + LINE + '" stroke-width="2"/>' +
      (label ? '<text x="' + mx + '" y="' + (my - 3) + '" text-anchor="middle" fill="' + MUT +
        '" font-family="IBM Plex Mono, monospace" font-size="10">' + label + '</text>' : '');
  }

  function mount(el, cfg) {
    cfg = cfg || {};
    var root = cfg.root || 'tenure < 8 mo?';
    var l = cfg.l || 'calls > 3?', r = cfg.r || 'spend > $70?';
    var lv = cfg.leaves || ['churns', 'stays', 'stays', 'churns'];
    var svg =
      '<svg viewBox="0 0 460 300" width="100%" style="max-width:460px;display:block;margin:0 auto" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A decision tree splitting customers by tenure, calls and spend into churn or stay leaves.">' +
      edge(230, 49, 120, 116, 'yes') + edge(230, 49, 340, 116, 'no') +
      edge(120, 144, 70, 214, 'yes') + edge(120, 144, 170, 214, 'no') +
      edge(340, 144, 290, 214, 'yes') + edge(340, 144, 390, 214, 'no') +
      box(230, 34, 150, 30, '#fff', INK, root, INK, 12.5) +
      box(120, 130, 120, 28, '#fff', '#9aa6b8', l, INK, 11.5) +
      box(340, 130, 120, 28, '#fff', '#9aa6b8', r, INK, 11.5) +
      leaf(70, 228, lv[0]) + leaf(170, 228, lv[1]) + leaf(290, 228, lv[2]) + leaf(390, 228, lv[3]) +
      '</svg>';
    el.innerHTML = '<div class="lw-diagram">' + svg + '</div>';
  }
  function leaf(x, y, label) {
    var churn = /churn/i.test(label);
    var fill = churn ? 'rgba(181,99,26,0.12)' : 'rgba(37,99,168,0.12)';
    var stroke = churn ? C1 : C0;
    return box(x, y, 86, 28, fill, stroke, label, churn ? C1 : C0, 11.5);
  }

  if (window.LessonWidgets) window.LessonWidgets.register('tree-diagram', mount);
})();
