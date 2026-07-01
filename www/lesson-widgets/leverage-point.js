/* leverage-point.js - how one point can swing a regression.
 * A clean scatter has a stable fit. Move the single far-right point up and down
 * (high leverage) and the whole least-squares line pivots toward it; the dashed
 * "line without that point" stays put, so you SEE its influence. Emits runnable
 * R that refits with and without the point and prints Cook's distance.
 *
 * cfg: { }  - renders from {}.
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  function mount(el, cfg) {
    cfg = cfg || {};
    // a tidy base relationship y ~ 1 + 0.5x, plus one high-leverage point far to the right
    var base = [{ x: 1, y: 1.6 }, { x: 2, y: 2.0 }, { x: 3, y: 2.6 }, { x: 4, y: 2.9 }, { x: 5, y: 3.6 }, { x: 6, y: 3.9 }, { x: 7, y: 4.6 }];
    var px = 13;                 // the leverage point's x (far from the rest)
    var py = 3.0;                // its y - the slider moves this

    function ols(pts) {
      var n = pts.length, sx = 0, sy = 0, sxx = 0, sxy = 0;
      pts.forEach(function (p) { sx += p.x; sy += p.y; sxx += p.x * p.x; sxy += p.x * p.y; });
      var b = (n * sxy - sx * sy) / (n * sxx - sx * sx); return { b: b, a: (sy - b * sx) / n };
    }

    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="lv-chart"></div>' +
      '<label style="display:block;font:600 12.5px/1.6 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:12px 0 2px">Drag the far-right point’s value: <b class="lv-y" style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '"></b>' +
        '<input class="lv-s" type="range" min="0" max="12" step="0.1" value="' + py + '" style="width:100%;accent-color:' + P.acc + '"></label>' +
      '<div class="lv-read" style="font:13px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:8px 0 14px"></div>' +
      u.runnable(rcode(base, px), { label: 'Measure the influence in R (Cook’s distance)' });

    var chart = el.querySelector('.lv-chart'), read = el.querySelector('.lv-read'),
        slider = el.querySelector('.lv-s'), yEl = el.querySelector('.lv-y');

    function draw() {
      var all = base.concat([{ x: px, y: py }]);
      var fitAll = ols(all), fitBase = ols(base);
      var W = 480, H = 270, m = { t: 14, r: 14, b: 34, l: 40 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
      var xlo = 0, xhi = px + 1, ylo = 0, yhi = 12;
      function sx(x) { return m.l + (x - xlo) / (xhi - xlo) * iw; }
      function sy(y) { return m.t + ih - (y - ylo) / (yhi - ylo) * ih; }
      function line(f, col, dash) { return '<line x1="' + sx(xlo).toFixed(1) + '" y1="' + sy(f.a + f.b * xlo).toFixed(1) + '" x2="' + sx(xhi).toFixed(1) + '" y2="' + sy(f.a + f.b * xhi).toFixed(1) + '" stroke="' + col + '" stroke-width="2.4"' + (dash ? ' stroke-dasharray="6 4"' : '') + '/>'; }
      var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="leverage and influence">';
      svg += '<line x1="' + m.l + '" y1="' + (m.t + ih) + '" x2="' + (m.l + iw) + '" y2="' + (m.t + ih) + '" stroke="' + P.line + '" stroke-width="1.5"/>';
      svg += '<line x1="' + m.l + '" y1="' + m.t + '" x2="' + m.l + '" y2="' + (m.t + ih) + '" stroke="' + P.line + '" stroke-width="1.5"/>';
      svg += line(fitBase, P.faint, true) + line(fitAll, P.acc, false);
      base.forEach(function (p) { svg += '<circle cx="' + sx(p.x).toFixed(1) + '" cy="' + sy(p.y).toFixed(1) + '" r="4.5" fill="' + P.ink + '" fill-opacity="0.72"/>'; });
      svg += '<circle cx="' + sx(px).toFixed(1) + '" cy="' + sy(py).toFixed(1) + '" r="7" fill="' + P.bad + '" stroke="#fff" stroke-width="1.5"/>';
      // legend
      svg += '<line x1="' + (m.l + 8) + '" y1="' + (m.t + 9) + '" x2="' + (m.l + 26) + '" y2="' + (m.t + 9) + '" stroke="' + P.acc + '" stroke-width="2.4"/><text x="' + (m.l + 31) + '" y="' + (m.t + 12) + '" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.body + '">with the point</text>';
      svg += '<line x1="' + (m.l + 130) + '" y1="' + (m.t + 9) + '" x2="' + (m.l + 148) + '" y2="' + (m.t + 9) + '" stroke="' + P.faint + '" stroke-width="2.4" stroke-dasharray="6 4"/><text x="' + (m.l + 153) + '" y="' + (m.t + 12) + '" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.body + '">without it</text>';
      svg += '</svg>';
      chart.innerHTML = svg;

      var dSlope = Math.abs(fitAll.b - fitBase.b), pull = Math.abs(py - (fitBase.a + fitBase.b * px));
      var sev = pull > 5 ? ['Highly influential.', P.bad] : pull > 2 ? ['Pulling the line.', P.c1] : ['Barely budging it.', P.acc];
      read.innerHTML = '<b style="color:' + sev[1] + '">' + sev[0] + '</b> One far-out point at x=' + px + ' has high <b>leverage</b>: it sits far from the others on x, so the line swings to chase it. Slope with it ' +
        '<b style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '">' + fitAll.b.toFixed(2) + '</b> vs without ' +
        '<b style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '">' + fitBase.b.toFixed(2) + '</b>.';
      yEl.textContent = py.toFixed(1);
    }

    slider.addEventListener('input', function () { py = +slider.value; draw(); });
    draw();
  }

  function rcode(base, px) {
    var rows = base.concat([{ x: px, y: 11 }]);     // an extreme value to show the swing
    var rdf = u.rdf(rows, [{ name: 'x', key: 'x' }, { name: 'y', key: 'y' }], 'd');
    return [
      '# The last row is a far-out, high-leverage point. Fit with and without it,',
      '# and let Cook’s distance flag how much it moves the model.',
      rdf,
      '',
      'fit_all  <- lm(y ~ x, data = d)',
      'fit_drop <- lm(y ~ x, data = d[-nrow(d), ])   # drop the influential point',
      'rbind(with_point = coef(fit_all), without = coef(fit_drop))',
      '',
      'round(cooks.distance(fit_all), 3)              # influence of each row',
      'plot(d$x, d$y, pch = 19); abline(fit_all, col = "forestgreen", lwd = 2)',
      'abline(fit_drop, col = "gray60", lwd = 2, lty = 2)'
    ].join('\n');
  }

  window.LessonWidgets.register('leverage-point', mount);
})();
