/* autoencoder-recon.js - anomaly detection by reconstruction error.
 * An autoencoder squeezes each point through a narrow bottleneck and rebuilds it. Trained on normal
 * data, it learns the manifold the normal points live on, so it rebuilds them well. A point off that
 * manifold cannot be rebuilt from the bottleneck, so its reconstruction error is large. The linear
 * case is exactly PCA: the bottleneck is the top principal directions, and the error is the distance
 * to that subspace. Here the manifold is a line; the residual dropped to the line IS the error.
 * Toggle a normal point vs the off-manifold anomaly and compare. Emits the PCA reconstruction in base R.
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function gauss(r) { return Math.sqrt(-2 * Math.log(Math.max(r(), 1e-9))) * Math.cos(6.2831853 * r()); }

  function build() {
    var r = rng(5), pts = [], i, x;
    for (i = 0; i < 90; i++) { x = 1.7 * gauss(r); pts.push([x, 0.7 * x + 0.18 * gauss(r)]); }  // hug the line y=0.7x
    pts.push([1.6, -1.6]);   // anomaly far off the line (last index)
    return pts;
  }

  // 2x2 PCA: centre, top eigenvector, project each point onto it, reconstruct, residual error.
  function pca1(pts) {
    var n = pts.length, mx = 0, my = 0, i;
    for (i = 0; i < n; i++) { mx += pts[i][0]; my += pts[i][1]; } mx /= n; my /= n;
    var a = 0, b = 0, c = 0, dx, dy;
    for (i = 0; i < n; i++) { dx = pts[i][0] - mx; dy = pts[i][1] - my; a += dx * dx; b += dx * dy; c += dy * dy; }
    a /= n; b /= n; c /= n;
    var lam = (a + c) / 2 + Math.sqrt(((a - c) / 2) * ((a - c) / 2) + b * b);
    var vx = b, vy = lam - a; if (Math.abs(b) < 1e-9 && Math.abs(vy) < 1e-9) { vx = 1; vy = 0; }
    var nv = Math.sqrt(vx * vx + vy * vy) || 1; vx /= nv; vy /= nv;
    var out = pts.map(function (p) {
      var px = p[0] - mx, py = p[1] - my, t = px * vx + py * vy;
      var rx = mx + t * vx, ry = my + t * vy;               // reconstruction on the line
      var ex = p[0] - rx, ey = p[1] - ry;
      return { recon: [rx, ry], err: ex * ex + ey * ey };
    });
    return { mean: [mx, my], v: [vx, vy], pts: out };
  }

  function mount(el, cfg) {
    cfg = cfg || {}; var pts = build(), anom = pts.length - 1, sel = 'normal', model = pca1(pts);
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="ae-seg" style="margin-bottom:12px">' + u.seg([{ v: 'normal', label: 'A normal point' }, { v: 'anomaly', label: 'The anomaly' }], 'normal') + '</div>' +
      '<div class="ae-plot"></div>' +
      '<div class="ae-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Autoencoder anomaly detection = PCA reconstruction error, base R' });

    var plot = el.querySelector('.ae-plot'), read = el.querySelector('.ae-read');
    var W = 340, H = 240, PAD = 16, LO = -3, HI = 3;
    function sx(x) { return PAD + (x - LO) / (HI - LO) * (W - 2 * PAD); }
    function sy(y) { return H - PAD - (y - LO) / (HI - LO) * (H - 2 * PAD); }
    var median = (function () { var e = model.pts.slice(0, anom).map(function (o) { return o.err; }).sort(function (a, b) { return a - b; }); return e[Math.floor(e.length / 2)]; })();

    function draw() {
      var pIdx = sel === 'anomaly' ? anom : 7;
      var m = model.mean, v = model.v, L = 4.2;
      var line = '<line x1="' + sx(m[0] - v[0] * L).toFixed(1) + '" y1="' + sy(m[1] - v[1] * L).toFixed(1) + '" x2="' + sx(m[0] + v[0] * L).toFixed(1) + '" y2="' + sy(m[1] + v[1] * L).toFixed(1) + '" stroke="' + P.mut + '" stroke-width="1.5" stroke-dasharray="4 3"/>';
      var resid = model.pts.map(function (o, i) { var p = pts[i]; var bold = i === pIdx; return '<line x1="' + sx(p[0]).toFixed(1) + '" y1="' + sy(p[1]).toFixed(1) + '" x2="' + sx(o.recon[0]).toFixed(1) + '" y2="' + sy(o.recon[1]).toFixed(1) + '" stroke="' + (bold ? P.bad : P.line2) + '" stroke-width="' + (bold ? 2 : 1) + '" opacity="' + (bold ? 1 : 0.5) + '"/>'; }).join('');
      var dots = pts.map(function (p, i) { var isSel = i === pIdx, isA = i === anom; return '<circle cx="' + sx(p[0]).toFixed(1) + '" cy="' + sy(p[1]).toFixed(1) + '" r="' + (isSel ? 5 : 3) + '" fill="' + (isSel ? P.bad : isA ? P.del : P.c0) + '" opacity="' + (isSel ? 1 : 0.6) + '"' + (isSel ? ' stroke="#fff" stroke-width="1.5"' : '') + '/>'; }).join('');
      plot.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block;border:1px solid ' + P.line + ';border-radius:8px" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="reconstruction residuals to the bottleneck line">' +
        line + resid + dots +
        '<text x="' + (W - 8) + '" y="18" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">dashed = bottleneck manifold</text>' +
        '<text x="' + (W - 8) + '" y="31" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.bad + '">red = reconstruction error</text></svg>';
      var err = model.pts[pIdx].err;
      read.innerHTML = 'The ' + (sel === 'anomaly' ? '<b style="color:' + P.del + '">anomaly</b>' : '<b>normal point</b>') + ' reconstructs with squared error <b style="color:' + P.bad + '">' + err.toFixed(2) + '</b>, against a typical normal error of about <b>' + median.toFixed(3) + '</b>. ' +
        (sel === 'anomaly' ? 'It sits off the manifold the bottleneck learned, so it cannot be rebuilt from one component: a large error flags it.' : 'It lies on the manifold, so one component rebuilds it almost perfectly: a tiny error, no flag.');
    }
    u.wireSeg(el.querySelector('.ae-seg'), function (v) { sel = v; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Autoencoder anomaly detection: reconstruct through a 1-component (PCA) bottleneck. Base R.',
      '# A linear autoencoder IS PCA; error = distance to the learned manifold (here a line).',
      'set.seed(1)',
      'n <- 200',
      'x <- rnorm(n); Y <- cbind(x, 0.7*x + rnorm(n, 0, 0.15))   # 2D data hugging a line',
      'Y <- rbind(Y, c(1.5, -1.5))                                # anomaly far off the line (row 201)',
      'pca   <- prcomp(Y, center = TRUE, rank. = 1)               # encoder: keep 1 of 2 dims (bottleneck)',
      'recon <- sweep(predict(pca) %*% t(pca$rotation[, 1, drop = FALSE]), 2, pca$center, "+")  # decode',
      'err   <- rowSums((Y - recon)^2)                            # reconstruction error per point',
      'round(c(median_normal = median(err[1:200]), anomaly = err[201]), 3)',
      '#> median_normal       anomaly',
      '#>         0.007         4.346'
    ].join('\n');
  }

  window.LessonWidgets.register('autoencoder-recon', mount);
})();
