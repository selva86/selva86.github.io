/* causal-dag.js - read a causal graph. Three nodes (X treatment, Y outcome, Z other) and
 * arrows you switch between confounder, collider and mediator. Each pattern tells you a
 * different thing about whether to control for Z: adjust for a confounder, never for a
 * collider, and think twice for a mediator. Emits runnable R that shows a confounder
 * flipping a regression coefficient.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  var SCEN = {
    confounder: { arrows: [['Z', 'X'], ['Z', 'Y'], ['X', 'Y']], say: 'Z is a <b>confounder</b> (it causes both X and Y). Leaving it out makes the X-&gt;Y link look stronger or weaker than it is. <b>Control for Z.</b>' },
    collider: { arrows: [['X', 'Z'], ['Y', 'Z'], ['X', 'Y']], say: 'Z is a <b>collider</b> (both X and Y point into it). Controlling for it OPENS a fake path and invents a correlation. <b>Do not control for Z.</b>' },
    mediator: { arrows: [['X', 'Z'], ['Z', 'Y']], say: 'Z is a <b>mediator</b> (X acts through Z). Control for it and you remove the very effect you wanted to measure. <b>Usually leave it free.</b>' }
  };
  var POS = { X: [70, 150], Y: [330, 150], Z: [200, 50] };

  function mount(el, cfg) {
    cfg = cfg || {}; var mode = 'confounder';
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="cd-seg" style="display:flex;gap:6px;margin-bottom:12px"></div>' +
      '<div class="cd-plot"></div>' +
      '<div class="cd-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Watch a confounder flip a coefficient in R' });

    var seg = el.querySelector('.cd-seg'), plot = el.querySelector('.cd-plot'), read = el.querySelector('.cd-read');
    [['confounder', 'confounder'], ['collider', 'collider'], ['mediator', 'mediator']].forEach(function (o) {
      var b = document.createElement('button'); b.textContent = o[1];
      b.style.cssText = 'font:600 12px IBM Plex Sans,sans-serif;border:1px solid ' + P.line + ';border-radius:8px;padding:6px 12px;cursor:pointer';
      b.addEventListener('click', function () { mode = o[0]; draw(); });
      seg.appendChild(b);
    });
    function node(n, lab) { var p = POS[n]; var hi = (mode === 'confounder' && n === 'Z') || (mode === 'collider' && n === 'Z'); return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="26" fill="' + (n === 'Z' ? (hi ? P.acc : '#eef1f7') : '#1c2c4f') + '" stroke="' + P.line + '"/><text x="' + p[0] + '" y="' + (p[1] + 5) + '" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="14" font-weight="600" fill="' + (n === 'Z' && !hi ? P.ink : '#fff') + '">' + lab + '</text>'; }
    function arrow(a, b) { var pa = POS[a], pb = POS[b], dx = pb[0] - pa[0], dy = pb[1] - pa[1], L = Math.sqrt(dx * dx + dy * dy), ux = dx / L, uy = dy / L; var x1 = pa[0] + ux * 27, y1 = pa[1] + uy * 27, x2 = pb[0] - ux * 30, y2 = pb[1] - uy * 30; var ang = Math.atan2(uy, ux); return '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" stroke="' + P.mut + '" stroke-width="2"/>' + '<path d="M' + x2.toFixed(1) + ',' + y2.toFixed(1) + ' L' + (x2 - 8 * Math.cos(ang - 0.4)).toFixed(1) + ',' + (y2 - 8 * Math.sin(ang - 0.4)).toFixed(1) + ' L' + (x2 - 8 * Math.cos(ang + 0.4)).toFixed(1) + ',' + (y2 - 8 * Math.sin(ang + 0.4)).toFixed(1) + ' Z" fill="' + P.mut + '"/>'; }
    function draw() {
      seg.querySelectorAll('button').forEach(function (x, i) { var on = ['confounder', 'collider', 'mediator'][i] === mode; x.style.background = on ? P.ink : '#fff'; x.style.color = on ? '#fff' : P.body; });
      var sc = SCEN[mode], svg = '<svg viewBox="0 0 400 195" width="100%" style="max-width:400px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="causal DAG">';
      sc.arrows.forEach(function (a) { svg += arrow(a[0], a[1]); });
      svg += node('X', 'X') + node('Y', 'Y') + node('Z', 'Z');
      svg += '<text x="70" y="190" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.faint + '">treatment</text><text x="330" y="190" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.faint + '">outcome</text>';
      svg += '</svg>'; plot.innerHTML = svg; read.innerHTML = sc.say;
    }
    draw();
  }

  function rcode() {
    return [
      '# A confounder Z drives both X and Y. Ignore it and the X->Y coefficient lies.',
      'set.seed(1); n <- 500',
      'Z <- rnorm(n)',
      'X <- 0.8 * Z + rnorm(n)            # Z causes X',
      'Y <- 1.0 * Z + rnorm(n)            # Z causes Y; X has NO real effect on Y',
      '',
      'coef(lm(Y ~ X))["X"]              # biased: looks like X affects Y',
      'coef(lm(Y ~ X + Z))["X"]          # adjust for Z: the effect collapses to ~0'
    ].join('\n');
  }

  window.LessonWidgets.register('causal-dag', mount);
})();
