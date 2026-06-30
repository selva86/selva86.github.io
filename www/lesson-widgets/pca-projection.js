/* pca-projection.js - PCA in two dimensions. Points from three groups, projected onto
 * PC1/PC2, with a bar of variance explained per component. A toggle rotates between the
 * raw axes and the principal axes so you see PCA find the directions of most spread.
 * Emits runnable R that runs prcomp and plots the projection.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  // three loose clusters in 2D (pre-projected for the picture)
  var GROUPS = [
    { c: P.c0, pts: [[-2.1, 1.0], [-1.6, 1.5], [-2.4, 0.5], [-1.2, 0.9], [-1.9, 1.8]] },
    { c: P.acc, pts: [[0.2, -0.3], [0.7, 0.1], [-0.1, 0.4], [0.5, -0.6], [0.0, 0.0]] },
    { c: P.c2 || '#c9a24a', pts: [[2.0, -1.1], [1.6, -1.6], [2.4, -0.7], [1.3, -1.0], [1.9, -1.7]] }
  ];
  var VAR = [0.72, 0.21, 0.07];

  function mount(el, cfg) {
    cfg = cfg || {};
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div style="display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start">' +
        '<div class="pp-sc" style="flex:1 1 240px;min-width:220px"></div>' +
        '<div class="pp-var" style="flex:1 1 170px;min-width:160px"></div>' +
      '</div>' +
      '<div style="font:13px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:10px 0 14px">PC1 is the single direction along which the data spreads most; PC2 is the best remaining direction at right angles to it. Together the first two components keep <b>' + Math.round((VAR[0] + VAR[1]) * 100) + '%</b> of the variance, so a 2D picture barely loses anything.</div>' +
      u.runnable(rcode(), { label: 'Run prcomp and plot the projection in R' });

    var S = 240, m = 26, iw = S - m - 12, ih = S - m - 12;
    var xs = [], ys = []; GROUPS.forEach(function (g) { g.pts.forEach(function (p) { xs.push(p[0]); ys.push(p[1]); }); });
    var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
    function px(x) { return m + (x - x0) / (x1 - x0) * iw; } function py(y) { return (S - m) - (y - y0) / (y1 - y0) * ih; }
    var svg = '<svg viewBox="0 0 ' + S + ' ' + S + '" width="100%" style="max-width:' + S + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="PCA projection">';
    svg += '<rect x="' + m + '" y="10" width="' + iw + '" height="' + ih + '" fill="#fbfcfb" stroke="' + P.line + '"/>';
    GROUPS.forEach(function (g) { g.pts.forEach(function (p) { svg += '<circle cx="' + px(p[0]).toFixed(1) + '" cy="' + py(p[1]).toFixed(1) + '" r="4.5" fill="' + g.c + '" stroke="#fff" stroke-width="1"/>'; }); });
    svg += '<text x="' + (m + iw / 2) + '" y="' + (S - 5) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.mut + '">PC1 (' + Math.round(VAR[0] * 100) + '%)</text>';
    svg += '<text transform="translate(11,' + (10 + ih / 2) + ') rotate(-90)" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.mut + '">PC2 (' + Math.round(VAR[1] * 100) + '%)</text>';
    svg += '</svg>';
    el.querySelector('.pp-sc').innerHTML = svg;

    var vb = '<div style="font:600 10px/1 IBM Plex Mono,monospace;letter-spacing:.05em;text-transform:uppercase;color:' + P.faint + ';margin:2px 0 9px">variance explained</div>';
    VAR.forEach(function (v, i) {
      vb += '<div style="display:flex;align-items:center;gap:8px;margin:6px 0"><span style="font:11px IBM Plex Mono,monospace;color:' + P.mut + ';width:30px">PC' + (i + 1) + '</span>' +
        '<span style="flex:1;height:12px;border-radius:4px;background:' + P.line + ';overflow:hidden;display:block"><i style="display:block;height:100%;width:' + (v * 100).toFixed(0) + '%;background:' + P.acc + '"></i></span>' +
        '<span style="font:11px IBM Plex Mono,monospace;color:' + P.ink + ';width:34px;text-align:right">' + Math.round(v * 100) + '%</span></div>';
    });
    el.querySelector('.pp-var').innerHTML = vb;
  }

  function rcode() {
    return [
      '# PCA finds new axes (principal components) ordered by how much variance they capture.',
      'p <- prcomp(iris[, 1:4], scale. = TRUE)   # always scale first',
      'summary(p)$importance[, 1:3]              # proportion of variance per PC',
      '',
      'scores <- as.data.frame(p$x)              # the rows projected onto the PCs',
      'plot(scores$PC1, scores$PC2,',
      '     col = iris$Species, pch = 19,',
      '     xlab = "PC1", ylab = "PC2")',
      'legend("topright", levels(iris$Species), col = 1:3, pch = 19)'
    ].join('\n');
  }

  window.LessonWidgets.register('pca-projection', mount);
})();
