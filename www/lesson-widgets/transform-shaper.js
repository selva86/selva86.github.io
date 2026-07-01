/* transform-shaper.js - tame a skewed feature. A right-skewed histogram (a long right
 * tail) reshapes as you toggle the transform: none / log / sqrt / Box-Cox. The skew
 * statistic updates so you see the tail pulled toward symmetry. Emits runnable R that
 * transforms a skewed variable and compares the shapes.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  // a fixed right-skewed sample (exponential-ish), deterministic
  var RAW = (function () { var s = 11, out = []; function r() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; } for (var i = 0; i < 240; i++) out.push(-Math.log(1 - r()) * 2 + 0.05); return out; })();

  function mount(el, cfg) {
    cfg = cfg || {}; var mode = 'none';
    function tx(v) { return mode === 'log' ? Math.log(v) : mode === 'sqrt' ? Math.sqrt(v) : mode === 'box' ? (Math.pow(v, 0.25) - 1) / 0.25 : v; }
    function skew(a) { var n = a.length, m = a.reduce(function (s, x) { return s + x; }, 0) / n, sd = Math.sqrt(a.reduce(function (s, x) { return s + (x - m) * (x - m); }, 0) / n); return a.reduce(function (s, x) { return s + Math.pow((x - m) / sd, 3); }, 0) / n; }

    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="ts-seg" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px"></div>' +
      '<div class="ts-plot"></div>' +
      '<div class="ts-read" style="font:13px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Transform a skewed variable in R and compare' });

    var seg = el.querySelector('.ts-seg'), plot = el.querySelector('.ts-plot'), read = el.querySelector('.ts-read');
    [['none', 'raw'], ['log', 'log'], ['sqrt', 'sqrt'], ['box', 'Box-Cox']].forEach(function (o) {
      var b = document.createElement('button'); b.textContent = o[1];
      b.style.cssText = 'font:600 12px IBM Plex Sans,sans-serif;border:1px solid ' + P.line + ';border-radius:8px;padding:6px 12px;cursor:pointer;background:' + (o[0] === mode ? P.ink : '#fff') + ';color:' + (o[0] === mode ? '#fff' : P.body);
      b.addEventListener('click', function () { mode = o[0]; draw(); seg.querySelectorAll('button').forEach(function (x, i) { var on = [['none'], ['log'], ['sqrt'], ['box']][i][0] === mode; x.style.background = on ? P.ink : '#fff'; x.style.color = on ? '#fff' : P.body; }); });
      seg.appendChild(b);
    });

    function draw() {
      var vals = RAW.map(tx), lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals), nb = 16, bins = new Array(nb).fill(0);
      vals.forEach(function (v) { var i = Math.min(nb - 1, Math.floor((v - lo) / (hi - lo) * nb)); bins[i]++; });
      var mx = Math.max.apply(null, bins), W = 420, H = 150, bw = W / nb;
      var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="histogram">';
      bins.forEach(function (c, i) { var h = c / mx * (H - 20); svg += '<rect x="' + (i * bw + 2).toFixed(1) + '" y="' + (H - h).toFixed(1) + '" width="' + (bw - 3).toFixed(1) + '" height="' + h.toFixed(1) + '" fill="' + P.acc + '" rx="2"/>'; });
      svg += '</svg>'; plot.innerHTML = svg;
      var sk = skew(vals);
      read.innerHTML = 'Skewness <b style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '">' + sk.toFixed(2) + '</b> (0 = symmetric). ' +
        (Math.abs(sk) < 0.4 ? 'The transform has pulled the long tail in - now a linear model and distance metrics behave.' : 'Still skewed: the long right tail makes means and distances misleading. Try a transform.');
    }
    draw();
  }

  function rcode() {
    return [
      '# A right-skewed feature (a long tail) distorts linear models and distances.',
      '# A log or Box-Cox transform pulls the tail in toward symmetry.',
      'set.seed(1)',
      'x <- rexp(500, rate = 0.5)            # heavily right-skewed',
      'g <- function(v) mean(((v - mean(v)) / sd(v))^3)   # skewness',
      '',
      'c(raw = g(x), log = g(log(x)), sqrt = g(sqrt(x)))  # closer to 0 = more symmetric',
      'par(mfrow = c(1, 2)); hist(x, main = "raw"); hist(log(x), main = "log")'
    ].join('\n');
  }

  window.LessonWidgets.register('transform-shaper', mount);
})();
