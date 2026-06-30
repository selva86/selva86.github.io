/* imbalance-resample.js - fixing class imbalance. A scatter with many majority points and
 * a few minority points. Toggle: original / oversample (duplicate minority) / SMOTE
 * (synthesize new minority points between neighbours). The class counts rebalance and the
 * minority region fills in. Emits runnable R that counts classes and upsamples.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  function rng(seed) { var s = seed; return function () { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; }
  var r = rng(5);
  var MAJ = [], MIN = [];
  for (var i = 0; i < 60; i++) MAJ.push([2 + r() * 5, 2 + r() * 5]);
  for (var j = 0; j < 8; j++) MIN.push([5.5 + r() * 2.5, 5.5 + r() * 2.5]);

  function mount(el, cfg) {
    cfg = cfg || {}; var mode = 'orig';
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="ir-seg" style="display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap"></div>' +
      '<div class="ir-plot"></div>' +
      '<div class="ir-read" style="font:13px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Count classes and upsample the minority in R' });

    var seg = el.querySelector('.ir-seg'), plot = el.querySelector('.ir-plot'), read = el.querySelector('.ir-read');
    [['orig', 'original'], ['over', 'oversample'], ['smote', 'SMOTE']].forEach(function (o) {
      var b = document.createElement('button'); b.textContent = o[1];
      b.style.cssText = 'font:600 12px IBM Plex Sans,sans-serif;border:1px solid ' + P.line + ';border-radius:8px;padding:6px 12px;cursor:pointer';
      b.addEventListener('click', function () { mode = o[0]; draw(); });
      seg.appendChild(b);
    });
    function minoritySet() {
      if (mode === 'orig') return { pts: MIN, synth: [] };
      if (mode === 'over') { var d = []; for (var k = 0; k < 52; k++) d.push(MIN[k % MIN.length]); return { pts: MIN, synth: d }; }
      var sy = [], rr = rng(3); for (var k = 0; k < 52; k++) { var a = MIN[Math.floor(rr() * MIN.length)], b = MIN[Math.floor(rr() * MIN.length)], t = rr(); sy.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); } return { pts: MIN, synth: sy };
    }
    function draw() {
      seg.querySelectorAll('button').forEach(function (x, i) { var on = ['orig', 'over', 'smote'][i] === mode; x.style.background = on ? P.ink : '#fff'; x.style.color = on ? '#fff' : P.body; });
      var S = 240, m = 10, sc = (S - 2 * m) / 10;
      function px(x) { return m + x * sc; } function py(y) { return (S - m) - y * sc; }
      var svg = '<svg viewBox="0 0 ' + S + ' ' + S + '" width="100%" style="max-width:' + S + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="class imbalance resampling">';
      svg += '<rect x="' + m + '" y="' + m + '" width="' + (S - 2 * m) + '" height="' + (S - 2 * m) + '" fill="#fbfcfb" stroke="' + P.line + '"/>';
      MAJ.forEach(function (p) { svg += '<circle cx="' + px(p[0]).toFixed(1) + '" cy="' + py(p[1]).toFixed(1) + '" r="3.4" fill="' + P.c0 + '" opacity="0.65"/>'; });
      var ms = minoritySet();
      ms.synth.forEach(function (p) { svg += '<circle cx="' + px(p[0]).toFixed(1) + '" cy="' + py(p[1]).toFixed(1) + '" r="3.2" fill="' + P.acc + '" opacity="0.35"/>'; });
      ms.pts.forEach(function (p) { svg += '<circle cx="' + px(p[0]).toFixed(1) + '" cy="' + py(p[1]).toFixed(1) + '" r="4" fill="' + P.acc + '" stroke="#fff" stroke-width="1"/>'; });
      svg += '</svg>'; plot.innerHTML = svg;
      var minN = MIN.length + ms.synth.length;
      read.innerHTML = 'Majority <b>' + MAJ.length + '</b> &middot; minority <b>' + minN + '</b>. ' +
        (mode === 'orig' ? 'A model trained here just predicts the majority and ignores the rare class.'
         : mode === 'over' ? 'Oversampling duplicates minority rows - balanced counts, but the duplicates add no new information and can overfit.'
         : 'SMOTE synthesises new minority points between real neighbours - balanced AND more varied, but never let it touch the test fold.');
    }
    draw();
  }

  function rcode() {
    return [
      '# Imbalance: the model can score 95% accuracy by always predicting the majority.',
      'set.seed(1)',
      'y <- factor(c(rep("no", 950), rep("yes", 50)))   # 95% / 5%',
      'table(y)',
      '',
      '# simplest fix: upsample the minority to match the majority',
      'idx_min <- which(y == "yes")',
      'up <- sample(idx_min, sum(y == "no"), replace = TRUE)',
      'table(y[c(which(y == "no"), up)])     # now balanced (SMOTE via the themis package goes further)'
    ].join('\n');
  }

  window.LessonWidgets.register('imbalance-resample', mount);
})();
