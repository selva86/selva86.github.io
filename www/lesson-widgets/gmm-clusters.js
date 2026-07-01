/* gmm-clusters.js - soft clustering. Unlike k-means (every point fully in one cluster), a
 * Gaussian mixture gives each point a PROBABILITY of belonging to each component. Toggle
 * hard vs soft: in soft mode the boundary points turn an in-between colour, showing the
 * model's honest uncertainty. Emits runnable R that computes mixture responsibilities by
 * hand for two components.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  var A = [3.3, 4.2], B = [6.4, 5.6], SD = 1.25;
  var PTS = (function () { var s = 4, out = []; function r() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; } function g() { return (r() + r() + r() - 1.5) * 1.3; } for (var i = 0; i < 22; i++) out.push([A[0] + g(), A[1] + g()]); for (var j = 0; j < 22; j++) out.push([B[0] + g(), B[1] + g()]); return out; })();

  function mount(el, cfg) {
    cfg = cfg || {}; var soft = true;
    function resp(p) { var da = Math.exp(-((p[0] - A[0]) * (p[0] - A[0]) + (p[1] - A[1]) * (p[1] - A[1])) / (2 * SD * SD)); var db = Math.exp(-((p[0] - B[0]) * (p[0] - B[0]) + (p[1] - B[1]) * (p[1] - B[1])) / (2 * SD * SD)); return da / (da + db); }
    function mix(t) { var c0 = [32, 86, 210], c1 = [201, 162, 74]; return 'rgb(' + Math.round(c0[0] * t + c1[0] * (1 - t)) + ',' + Math.round(c0[1] * t + c1[1] * (1 - t)) + ',' + Math.round(c0[2] * t + c1[2] * (1 - t)) + ')'; }

    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="gm-seg" style="display:flex;gap:6px;margin-bottom:12px"></div>' +
      '<div class="gm-plot"></div>' +
      '<div class="gm-read" style="font:13px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Compute mixture responsibilities in R' });

    var seg = el.querySelector('.gm-seg'), plot = el.querySelector('.gm-plot'), read = el.querySelector('.gm-read');
    [['true', 'soft (GMM)'], ['false', 'hard (k-means)']].forEach(function (o) {
      var b = document.createElement('button'); b.textContent = o[1];
      b.style.cssText = 'font:600 12px IBM Plex Sans,sans-serif;border:1px solid ' + P.line + ';border-radius:8px;padding:6px 12px;cursor:pointer';
      b.addEventListener('click', function () { soft = o[0] === 'true'; draw(); });
      seg.appendChild(b);
    });
    function draw() {
      seg.querySelectorAll('button').forEach(function (x, i) { var on = ['true', 'false'][i] === String(soft); x.style.background = on ? P.ink : '#fff'; x.style.color = on ? '#fff' : P.body; });
      var S = 240, m = 10, sc = (S - 2 * m) / 10;
      function px(x) { return m + x * sc; } function py(y) { return (S - m) - y * sc; }
      var svg = '<svg viewBox="0 0 ' + S + ' ' + S + '" width="100%" style="max-width:' + S + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="gaussian mixture clustering">';
      svg += '<rect x="' + m + '" y="' + m + '" width="' + (S - 2 * m) + '" height="' + (S - 2 * m) + '" fill="#fbfcfb" stroke="' + P.line + '"/>';
      [A, B].forEach(function (c) { svg += '<ellipse cx="' + px(c[0]).toFixed(1) + '" cy="' + py(c[1]).toFixed(1) + '" rx="' + (SD * 2 * sc).toFixed(1) + '" ry="' + (SD * 2 * sc).toFixed(1) + '" fill="none" stroke="' + P.line + '" stroke-dasharray="3 3"/>'; });
      PTS.forEach(function (p) { var t = resp(p); var col = soft ? mix(t) : (t >= 0.5 ? P.acc : (P.c2 || '#c9a24a')); svg += '<circle cx="' + px(p[0]).toFixed(1) + '" cy="' + py(p[1]).toFixed(1) + '" r="4" fill="' + col + '" opacity="0.92"/>'; });
      svg += '</svg>'; plot.innerHTML = svg;
      read.innerHTML = soft
        ? 'Soft: points near the overlap take an in-between colour - the model reports, say, 60% / 40% rather than forcing a side. That honesty is the point of a mixture model.'
        : 'Hard: every point is forced fully into one cluster, even the ambiguous ones in the overlap. k-means cannot express "maybe".';
    }
    draw();
  }

  function rcode() {
    return [
      '# A 2-component mixture gives each point a PROBABILITY per cluster (a responsibility),',
      '# not a hard label. Here it is by hand; the mclust package fits it for real.',
      'set.seed(1)',
      'x <- c(rnorm(40, -2), rnorm(40, 2))',
      'mu <- c(-2, 2); sg <- c(1, 1)                 # two components',
      'la <- dnorm(x, mu[1], sg[1]); lb <- dnorm(x, mu[2], sg[2])',
      'resp <- la / (la + lb)                        # P(component 1 | x)',
      'head(round(resp, 2), 10)                      # values near 0.5 = uncertain'
    ].join('\n');
  }

  window.LessonWidgets.register('gmm-clusters', mount);
})();
