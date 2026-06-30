/* drift-monitor.js - watching a feature after launch. The reference distribution (what the
 * model trained on) stays put; slide "weeks since launch" and the live distribution drifts
 * away. A population-stability index (PSI) climbs, and once it crosses the alert line the
 * model is seeing inputs it was never trained on - time to retrain. Emits runnable R that
 * computes PSI between a reference and a current sample.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  var BINS = 10, REF = [];
  (function () { var s = 6; function r() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; } var a = new Array(BINS).fill(0); for (var i = 0; i < 1000; i++) { var v = (r() + r() + r()) / 3; a[Math.min(BINS - 1, Math.floor(v * BINS))]++; } REF = a.map(function (c) { return c / 1000; }); })();

  function mount(el, cfg) {
    cfg = cfg || {}; var shift = 0;  // weeks -> mean shift
    function current() { var a = new Array(BINS).fill(0); var s = 6; function r() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; } for (var i = 0; i < 1000; i++) { var v = (r() + r() + r()) / 3 + shift * 0.04; v = Math.max(0, Math.min(0.999, v)); a[Math.floor(v * BINS)]++; } return a.map(function (c) { return c / 1000; }); }
    function psi(ref, cur) { var s = 0; for (var i = 0; i < BINS; i++) { var e = Math.max(ref[i], 0.001), o = Math.max(cur[i], 0.001); s += (o - e) * Math.log(o / e); } return s; }

    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="dm-plot"></div>' +
      '<label style="display:block;font:600 12.5px/1.6 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:12px 0 2px">weeks since launch <b class="dm-w" style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '"></b>' +
        '<input class="dm-s" type="range" min="0" max="8" step="0.5" value="0" style="width:100%;accent-color:' + P.acc + '"></label>' +
      '<div class="dm-read" style="font:13px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:8px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Compute the population-stability index in R' });

    var plot = el.querySelector('.dm-plot'), read = el.querySelector('.dm-read'), slider = el.querySelector('.dm-s'), wEl = el.querySelector('.dm-w');
    function draw() {
      var cur = current(), W = 420, H = 150, bw = W / BINS, mx = 0.32;
      var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="distribution drift">';
      REF.forEach(function (c, i) { var h = c / mx * (H - 16); svg += '<rect x="' + (i * bw + 2).toFixed(1) + '" y="' + (H - h).toFixed(1) + '" width="' + (bw - 4).toFixed(1) + '" height="' + h.toFixed(1) + '" fill="none" stroke="' + P.mut + '" stroke-dasharray="3 2" rx="1"/>'; });
      cur.forEach(function (c, i) { var h = c / mx * (H - 16); svg += '<rect x="' + (i * bw + 2).toFixed(1) + '" y="' + (H - h).toFixed(1) + '" width="' + (bw - 4).toFixed(1) + '" height="' + h.toFixed(1) + '" fill="' + P.acc + '" opacity="0.85" rx="1"/>'; });
      svg += '</svg>'; plot.innerHTML = svg;
      var ps = psi(REF, cur), alert = ps >= 0.2;
      read.innerHTML = '<b style="font-family:IBM Plex Mono,monospace;color:' + (alert ? P.del : P.ink) + '">PSI ' + ps.toFixed(2) + '</b> &middot; dashed = training reference, solid = live traffic. ' +
        (alert ? '<b style="color:' + P.del + '">Drift alert (PSI &ge; 0.2)</b> - the live inputs no longer match training. Retrain.' : ps >= 0.1 ? 'Minor drift - keep watching.' : 'Stable - inputs still look like the training data.');
      wEl.textContent = shift.toFixed(1);
    }
    slider.addEventListener('input', function () { shift = +slider.value; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# PSI compares a live sample to the training reference, bin by bin. >= 0.2 = real drift.',
      'set.seed(1)',
      'ref <- rnorm(1000, 0, 1)                 # training distribution',
      'live <- rnorm(1000, 0.6, 1)              # months later: shifted',
      'br <- quantile(ref, probs = seq(0, 1, 0.1))',
      'e <- table(cut(ref,  br)) / length(ref)',
      'o <- table(cut(live, br)) / length(live)',
      'psi <- sum((o - e) * log(pmax(o, 1e-4) / pmax(e, 1e-4)))',
      'psi                                       # compare to 0.1 (watch) and 0.2 (alert)'
    ].join('\n');
  }

  window.LessonWidgets.register('drift-monitor', mount);
})();
