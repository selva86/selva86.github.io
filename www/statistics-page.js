// statistics-page.js — the hero's live two-sample t-test visualization.
// Vanilla JS, no libraries. Drag the gap, two bell curves separate, and a real
// one-sided two-sample t approximation (equal n, pooled SD) recomputes the
// p-value with a plain-English read. Reveal-on-scroll and dark mode come from
// the shared sections-v3.js, not here. Guards every DOM access; never throws.
(function () {
  'use strict';

  var SVG_W = 380, X0 = 40, X1 = 350, BASE = 118, PEAK = 40;
  var SD_PX = 46;       // visual spread of each curve, in svg px
  var SD_UNITS = 1.0;   // each curve's standard deviation in score units
  var N = 30;           // samples per group (drives df and the SE)
  var muA_units = 0;    // group A mean (anchor)

  function bell(cx) {
    var pts = [], k = 0;
    for (var x = X0; x <= X1; x += 4) {
      var z = (x - cx) / SD_PX;
      var y = BASE - (BASE - PEAK) * Math.exp(-0.5 * z * z);
      pts.push((k++ ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1));
    }
    pts.push('L' + X1 + ' ' + BASE);
    pts.push('L' + X0 + ' ' + BASE + ' Z');
    return pts.join(' ');
  }

  function xForUnits(u) {
    var ax = X0 + (X1 - X0) * 0.30;
    return ax + (u - muA_units) * SD_PX * 0.78;
  }

  // standard normal CDF (Abramowitz-Stegun 7.1.26)
  function normCdf(z) {
    var t = 1 / (1 + 0.2316419 * Math.abs(z));
    var d = 0.3989423 * Math.exp(-z * z / 2);
    var p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return z > 0 ? 1 - p : p;
  }

  function recompute() {
    var gapEl = document.getElementById('gap');
    if (!gapEl) return;
    var raw = +gapEl.value;          // 0..40
    var gapUnits = raw / 10;         // 0..4.0 SDs of difference
    var gapVal = document.getElementById('gapVal');
    if (gapVal) gapVal.textContent = 'B - A = ' + gapUnits.toFixed(1);

    var ax = xForUnits(muA_units), bx = xForUnits(muA_units + gapUnits);

    var cA = document.getElementById('curveA'), cB = document.getElementById('curveB');
    if (cA) cA.setAttribute('d', bell(ax));
    if (cB) cB.setAttribute('d', bell(bx));
    var mA = document.getElementById('meanA'), mB = document.getElementById('meanB');
    if (mA) { mA.setAttribute('x1', ax); mA.setAttribute('x2', ax); }
    if (mB) { mB.setAttribute('x1', bx); mB.setAttribute('x2', bx); }
    var lA = document.getElementById('lblA'), lB = document.getElementById('lblB');
    if (lA) lA.setAttribute('x', ax);
    if (lB) lB.setAttribute('x', bx);

    var se = SD_UNITS * Math.sqrt(2 / N);
    var t = gapUnits / se;
    var df = 2 * N - 2;
    var p = Math.max(1 - normCdf(t), 0);

    var pStr = p < 0.001 ? '< 0.001' : p.toFixed(3);
    var inHundred = p <= 0 ? 0 : Math.max(1, Math.round(p * 100));

    var verdict, cls;
    if (p < 0.001) { verdict = 'B is almost certainly higher. A gap this big basically never happens by luck.'; cls = 'hl'; }
    else if (p < 0.05) { verdict = 'you would see a gap this big by chance only about ' + inHundred + ' times in 100. Reject the null.'; cls = 'hl'; }
    else if (p < 0.15) { verdict = 'suggestive, but a gap this big still shows up ~' + inHundred + ' times in 100 by luck. Not enough.'; cls = 'warn'; }
    else { verdict = 'this is what plain noise looks like. No case here.'; cls = 'warn'; }

    var readout = document.getElementById('readout');
    if (readout) {
      readout.innerHTML =
        't = <b>' + t.toFixed(2) + '</b>   df = ' + df + '   <b>p ' + (p < 0.001 ? '' : '= ') + pStr + '</b>\n' +
        '<span class="' + cls + '">' + verdict + '</span>';
    }
  }

  function runDemo() {
    var out = document.getElementById('demoOut');
    var btn = document.getElementById('runBtn');
    if (out) out.classList.add('show');
    if (btn) {
      btn.classList.add('ran');
      btn.innerHTML = '<svg class="ic ic-sm"><use href="#i-check"/></svg> Ran';
    }
    var b = document.getElementById('curveB');
    if (b) {
      b.style.transition = 'opacity .5s var(--ease)';
      b.style.opacity = '0';
      setTimeout(function () { b.style.opacity = '0.34'; recompute(); }, 60);
    } else {
      recompute();
    }
  }

  window.recompute = recompute;
  window.runDemo = runDemo;

  // draw the initial state on load
  function start() { try { recompute(); } catch (_) { } }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
