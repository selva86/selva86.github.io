/* null-distribution.js - the sampling distribution under H0 with the observed
 * statistic marked and its p-value tail(s) shaded. The p-value is computed from
 * a REAL standard-normal CDF (erf approximation), not faked. Interactive: drag
 * the observed statistic and watch the tail area (the p-value) change.
 * Reusable for any hypothesis-test lesson (t-test, z-test, A/B test).
 * cfg (optional): { tails:1|2, max, start, label }
 */
(function () {
  'use strict';
  var INK = '#131720', MUT = '#677084', ACC = '#1f7a55', TAIL = '#b5631a', LINE = '#c5cdda';

  function erf(x) {
    var s = x < 0 ? -1 : 1; x = Math.abs(x);
    var t = 1 / (1 + 0.3275911 * x);
    var y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return s * y;
  }
  function Phi(x) { return 0.5 * (1 + erf(x / Math.SQRT2)); }
  function pdf(x) { return Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI); }

  function mount(el, cfg) {
    cfg = cfg || {};
    var tails = cfg.tails || 2, MAX = cfg.max || 4, start = cfg.start != null ? cfg.start : 2.0, label = cfg.label || 'observed t';
    var W = 460, H = 230, padB = 30, padT = 10, x0 = 18, x1 = W - 18, midY = H - padB;
    var sx = function (z) { return x0 + (z + MAX) / (2 * MAX) * (x1 - x0); };
    var peak = pdf(0), sy = function (d) { return padT + (1 - d / peak) * (midY - padT - 6); };
    var curve = '', i;
    for (i = 0; i <= 120; i++) { var z = -MAX + i / 120 * 2 * MAX; curve += (i ? 'L' : 'M') + sx(z).toFixed(1) + ' ' + sy(pdf(z)).toFixed(1) + ' '; }

    el.innerHTML =
      '<div class="lw-ctrl"><div class="lw-ctrl-row"><span>' + label + '</span><b class="nd-tval">' + start.toFixed(2) + '</b></div>' +
      '<input type="range" class="lw-slider nd-slider" min="0" max="' + MAX + '" step="0.05" value="' + start + '"></div>' +
      '<div class="lw-diagram"><svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Null distribution with the p-value tail shaded.">' +
        '<line x1="' + x0 + '" y1="' + midY + '" x2="' + x1 + '" y2="' + midY + '" stroke="' + LINE + '" stroke-width="1"/>' +
        '<path class="nd-tail-r" fill="rgba(181,99,26,0.20)" stroke="none"/>' +
        (tails === 2 ? '<path class="nd-tail-l" fill="rgba(181,99,26,0.20)" stroke="none"/>' : '') +
        '<path d="' + curve + '" fill="none" stroke="' + ACC + '" stroke-width="2"/>' +
        '<line class="nd-line-r" y1="' + padT + '" y2="' + midY + '" stroke="' + TAIL + '" stroke-width="2"/>' +
        (tails === 2 ? '<line class="nd-line-l" y1="' + padT + '" y2="' + midY + '" stroke="' + TAIL + '" stroke-width="2" stroke-dasharray="3 3"/>' : '') +
        '<text x="' + sx(0) + '" y="' + (midY + 15) + '" text-anchor="middle" fill="' + MUT + '" font-family="IBM Plex Mono,monospace" font-size="10">0</text>' +
      '</svg></div>' +
      '<div class="nd-out" style="text-align:center;font:600 13px/1.5 \'IBM Plex Mono\',monospace;color:' + INK + ';margin-top:4px"></div>';

    var slider = el.querySelector('.nd-slider'), tval = el.querySelector('.nd-tval'),
        lineR = el.querySelector('.nd-line-r'), lineL = el.querySelector('.nd-line-l'),
        tailR = el.querySelector('.nd-tail-r'), tailL = el.querySelector('.nd-tail-l'), out = el.querySelector('.nd-out');

    function tailPath(fromZ, dir) {
      var p = 'M' + sx(fromZ).toFixed(1) + ' ' + midY + ' ', n = 40, k;
      for (k = 0; k <= n; k++) { var z = fromZ + (dir * MAX - fromZ) * k / n; p += 'L' + sx(z).toFixed(1) + ' ' + sy(pdf(z)).toFixed(1) + ' '; }
      return p + 'L' + sx(dir * MAX).toFixed(1) + ' ' + midY + ' Z';
    }
    function render() {
      var t = parseFloat(slider.value); tval.textContent = t.toFixed(2);
      var xr = sx(t); lineR.setAttribute('x1', xr); lineR.setAttribute('x2', xr);
      tailR.setAttribute('d', tailPath(t, 1));
      if (tails === 2) { var xl = sx(-t); lineL.setAttribute('x1', xl); lineL.setAttribute('x2', xl); tailL.setAttribute('d', tailPath(-t, -1)); }
      var p = (tails === 2 ? 2 : 1) * (1 - Phi(t)), sig = p < 0.05;
      out.innerHTML = 'p-value = <b style="color:' + (sig ? ACC : TAIL) + '">' + p.toFixed(3) + '</b> &nbsp; ' + (sig ? 'reject H0 (p &lt; 0.05)' : 'fail to reject H0');
    }
    slider.addEventListener('input', render);
    render();
  }
  if (window.LessonWidgets) window.LessonWidgets.register('null-distribution', mount);
})();
