/* tuning-search.js - searching a 2-hyperparameter loss surface. The shaded grid is the
 * validation loss for each (param1, param2). Toggle grid vs random search and watch where
 * each spends its budget: grid wastes points on a coarse lattice; random covers each axis
 * better for the same count. The best point found is ringed. Emits runnable R that scores
 * a grid and picks the best combination.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  function loss(a, b) { return 0.2 + 0.8 * (Math.pow(a - 0.62, 2) + Math.pow(b - 0.38, 2)) + 0.05 * Math.sin(6 * a) * Math.cos(5 * b); }

  function mount(el, cfg) {
    cfg = cfg || {}; var mode = 'grid', N = 16;
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="tg-seg" style="display:flex;gap:6px;margin-bottom:12px"></div>' +
      '<div class="tg-plot"></div>' +
      '<div class="tg-read" style="font:13px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Grid-search two hyperparameters in R' });

    var seg = el.querySelector('.tg-seg'), plot = el.querySelector('.tg-plot'), read = el.querySelector('.tg-read');
    [['grid', 'grid search'], ['random', 'random search']].forEach(function (o) {
      var b = document.createElement('button'); b.textContent = o[1];
      b.style.cssText = 'font:600 12px IBM Plex Sans,sans-serif;border:1px solid ' + P.line + ';border-radius:8px;padding:6px 12px;cursor:pointer';
      b.addEventListener('click', function () { mode = o[0]; draw(); });
      seg.appendChild(b);
    });
    function pts() {
      var out = [];
      if (mode === 'grid') { var k = Math.round(Math.sqrt(N)); for (var i = 0; i < k; i++) for (var j = 0; j < k; j++) out.push([(i + 0.5) / k, (j + 0.5) / k]); }
      else { var s = 9; function r() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; } for (var t = 0; t < N; t++) out.push([r(), r()]); }
      return out;
    }
    function draw() {
      seg.querySelectorAll('button').forEach(function (x, i) { var on = ['grid', 'random'][i] === mode; x.style.background = on ? P.ink : '#fff'; x.style.color = on ? '#fff' : P.body; });
      var S = 240, m = 6, iw = S - 2 * m, res = 24;
      var svg = '<svg viewBox="0 0 ' + S + ' ' + S + '" width="100%" style="max-width:' + S + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="hyperparameter loss surface">';
      for (var i = 0; i < res; i++) for (var j = 0; j < res; j++) { var lv = loss((i + 0.5) / res, (j + 0.5) / res); var t = Math.max(0, Math.min(1, (lv - 0.2) / 0.9)); var c = Math.round(255 - t * 150); svg += '<rect x="' + (m + i / res * iw).toFixed(1) + '" y="' + (m + (1 - (j + 1) / res) * iw).toFixed(1) + '" width="' + (iw / res + 0.6).toFixed(1) + '" height="' + (iw / res + 0.6).toFixed(1) + '" fill="rgb(' + c + ',' + (c + 6) + ',' + (c - 20) + ')"/>'; }
      var P2 = pts(), best = null;
      P2.forEach(function (p) { var lv = loss(p[0], p[1]); if (!best || lv < best.l) best = { x: p[0], y: p[1], l: lv }; var cx = m + p[0] * iw, cy = m + (1 - p[1]) * iw; svg += '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="3" fill="' + P.ink + '" opacity="0.8"/>'; });
      svg += '<circle cx="' + (m + best.x * iw).toFixed(1) + '" cy="' + (m + (1 - best.y) * iw).toFixed(1) + '" r="7" fill="none" stroke="' + P.acc + '" stroke-width="2.5"/>';
      svg += '</svg>'; plot.innerHTML = svg;
      read.innerHTML = mode === 'grid'
        ? 'A grid spends its ' + N + ' evaluations on a regular lattice - so it only ever tries ' + Math.round(Math.sqrt(N)) + ' distinct values of each parameter.'
        : 'Random search spends the same ' + N + ' evaluations on ' + N + ' distinct values per axis, so it usually finds a better spot when one parameter barely matters.';
    }
    draw();
  }

  function rcode() {
    return [
      '# Score every combination on a validation set, then keep the best.',
      'val_loss <- function(a, b) 0.2 + (a - 0.62)^2 + (b - 0.38)^2   # stand-in for CV error',
      'grid <- expand.grid(param1 = seq(0, 1, length.out = 5),',
      '                    param2 = seq(0, 1, length.out = 5))',
      'grid$loss <- mapply(val_loss, grid$param1, grid$param2)',
      'grid[which.min(grid$loss), ]            # the best combination',
      '',
      '# random search: same budget, different values per axis',
      'set.seed(1); rs <- data.frame(param1 = runif(25), param2 = runif(25))',
      'rs$loss <- mapply(val_loss, rs$param1, rs$param2)',
      'rs[which.min(rs$loss), ]'
    ].join('\n');
  }

  window.LessonWidgets.register('tuning-search', mount);
})();
