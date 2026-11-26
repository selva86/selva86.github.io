/* funnel-plot.js - effect on x, standard error down the y axis, so the precise
 * studies sit at the narrow top and the imprecise ones scatter along the wide
 * bottom. The dashed funnel is the region where 95% of studies should fall if
 * the only thing spreading them out is sampling error.
 *
 * The plot is a publication-bias instrument: with no bias the cloud is
 * symmetric about the pooled line, and a hole in one bottom corner is the
 * shape of small unflattering studies never being written up. cfg:
 *   { studies:[{name, est, se}], pooled:<number>, xlab:"Effect",
 *     missing:[{est, se}], showFunnel:true }
 * `pooled` defaults to the inverse-variance weighted mean. `missing` draws
 * hollow markers, for a lesson that shows what absence would have looked like.
 *
 * Egger's test is computed in the runnable R by regression, not by a package:
 * it is just the intercept of the standard normal deviate on precision.
 */
(function () {
  'use strict';

  function mount(el, cfg) {
    var u = window.LessonWidgets.u; if (!u) return;
    cfg = cfg || {};
    var P = u.P;
    var studies = (cfg.studies && cfg.studies.length) ? cfg.studies : [
      { name: 'A', est: 0.30, se: 0.055 }, { name: 'B', est: 0.26, se: 0.075 },
      { name: 'C', est: 0.36, se: 0.090 }, { name: 'D', est: 0.21, se: 0.105 },
      { name: 'E', est: 0.44, se: 0.130 }, { name: 'F', est: 0.48, se: 0.165 },
      { name: 'G', est: 0.58, se: 0.200 }, { name: 'H', est: 0.33, se: 0.145 },
      { name: 'I', est: 0.62, se: 0.235 }, { name: 'J', est: 0.41, se: 0.185 }
    ];
    var missing = cfg.missing || [];
    var xlab = cfg.xlab || 'Effect estimate';
    var showFunnel = cfg.showFunnel !== false;

    var sw = 0, swy = 0;
    studies.forEach(function (s) { var w = 1 / (s.se * s.se); sw += w; swy += w * s.est; });
    var pooled = cfg.pooled == null ? swy / sw : +cfg.pooled;

    // ---- geometry: se increases DOWNWARD ----------------------------------
    var W = 520, H = 360, m = { t: 22, r: 20, b: 46, l: 58 };
    var iw = W - m.l - m.r, ih = H - m.t - m.b;
    var seMax = Math.max.apply(null, studies.concat(missing).map(function (s) { return s.se; })) * 1.12;
    var xs = studies.concat(missing).map(function (s) { return s.est; });
    // the funnel at its widest decides the x range, else points fall outside it
    var xLo = Math.min(Math.min.apply(null, xs), pooled - 1.96 * seMax);
    var xHi = Math.max(Math.max.apply(null, xs), pooled + 1.96 * seMax);
    var xpad = (xHi - xLo) * 0.06 || 0.1;
    xLo -= xpad; xHi += xpad;

    function sx(v) { return m.l + (v - xLo) / (xHi - xLo) * iw; }
    function sy(se) { return m.t + (se / seMax) * ih; }   // se 0 at the top
    function f2(v) { return (Math.round(v * 100) / 100).toFixed(2); }
    function f3(v) { return (Math.round(v * 1000) / 1000).toFixed(3); }

    var g = '';
    // frame
    g += '<line x1="' + m.l + '" y1="' + m.t + '" x2="' + m.l + '" y2="' + (m.t + ih) +
         '" stroke="' + P.line + '" stroke-width="1.5"/>' +
         '<line x1="' + m.l + '" y1="' + (m.t + ih) + '" x2="' + (m.l + iw) + '" y2="' + (m.t + ih) +
         '" stroke="' + P.line + '" stroke-width="1.5"/>';

    // y ticks: se, increasing downward
    [0, seMax / 2, seMax].forEach(function (t) {
      g += '<line x1="' + (m.l - 5) + '" y1="' + sy(t).toFixed(1) + '" x2="' + m.l + '" y2="' + sy(t).toFixed(1) +
           '" stroke="' + P.line + '"/>' +
           '<text x="' + (m.l - 9) + '" y="' + (sy(t) + 3).toFixed(1) + '" text-anchor="end" ' +
           'font-family="IBM Plex Mono,monospace" font-size="9.5" fill="' + P.mut + '">' + f3(t) + '</text>';
    });
    // x ticks
    [xLo + xpad, pooled, xHi - xpad].forEach(function (t) {
      g += '<text x="' + sx(t).toFixed(1) + '" y="' + (m.t + ih + 16) + '" text-anchor="middle" ' +
           'font-family="IBM Plex Mono,monospace" font-size="9.5" fill="' + P.mut + '">' + f2(t) + '</text>';
    });

    // the funnel: pooled +/- 1.96 se, so straight lines from the apex
    if (showFunnel) {
      g += '<path d="M ' + sx(pooled).toFixed(1) + ' ' + sy(0).toFixed(1) +
           ' L ' + sx(pooled - 1.96 * seMax).toFixed(1) + ' ' + sy(seMax).toFixed(1) +
           ' L ' + sx(pooled + 1.96 * seMax).toFixed(1) + ' ' + sy(seMax).toFixed(1) + ' Z" ' +
           'fill="' + P.bg + '" fill-opacity="0.65" stroke="' + P.faint +
           '" stroke-width="1" stroke-dasharray="4 3"/>';
    }
    // pooled vertical
    g += '<line x1="' + sx(pooled).toFixed(1) + '" y1="' + m.t + '" x2="' + sx(pooled).toFixed(1) +
         '" y2="' + (m.t + ih) + '" stroke="' + P.acc + '" stroke-width="1.5"/>';

    // observed studies
    studies.forEach(function (s) {
      g += '<circle cx="' + sx(s.est).toFixed(1) + '" cy="' + sy(s.se).toFixed(1) + '" r="5" fill="' + P.c0 +
           '" fill-opacity="0.8"/>';
    });
    // the studies that were never published, if the lesson supplies them
    missing.forEach(function (s) {
      g += '<circle cx="' + sx(s.est).toFixed(1) + '" cy="' + sy(s.se).toFixed(1) + '" r="5" fill="none" ' +
           'stroke="' + P.bad + '" stroke-width="1.6" stroke-dasharray="3 2"/>';
    });

    // axis titles
    g += '<text x="' + (m.l + iw / 2).toFixed(1) + '" y="' + (H - 10) + '" text-anchor="middle" ' +
         'font-family="IBM Plex Sans,sans-serif" font-size="11" fill="' + P.mut + '">' + u.esc(xlab) + '</text>' +
         '<text transform="translate(14,' + (m.t + ih / 2).toFixed(1) + ') rotate(-90)" text-anchor="middle" ' +
         'font-family="IBM Plex Sans,sans-serif" font-size="11" fill="' + P.mut + '">standard error</text>' +
         '<text x="' + (m.l + 6) + '" y="' + (m.t + 11) + '" font-family="IBM Plex Sans,sans-serif" ' +
         'font-size="9.5" fill="' + P.faint + '">more precise</text>' +
         '<text x="' + (m.l + 6) + '" y="' + (m.t + ih - 5) + '" font-family="IBM Plex Sans,sans-serif" ' +
         'font-size="9.5" fill="' + P.faint + '">less precise</text>';

    var chart = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W +
      'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" ' +
      'aria-label="Funnel plot of ' + studies.length + ' studies, standard error on the vertical axis">' +
      g + '</svg>';

    var rcode =
      '# est and se as published. Precision is 1/se: the funnel narrows as it grows.\n' +
      'f <- data.frame(\n' +
      '  study = c(' + studies.map(function (s) { return '"' + String(s.name).replace(/"/g, '') + '"'; }).join(', ') + '),\n' +
      '  est   = c(' + studies.map(function (s) { return +s.est; }).join(', ') + '),\n' +
      '  se    = c(' + studies.map(function (s) { return +s.se; }).join(', ') + '),\n' +
      '  stringsAsFactors = FALSE\n' +
      ')\n\n' +
      'w      <- 1 / f$se^2\n' +
      'pooled <- sum(w * f$est) / sum(w)\n' +
      'cat(sprintf("pooled %.3f\\n", pooled))\n\n' +
      '# Egger\'s test is a regression, not a package. Regress the standard normal\n' +
      '# deviate on precision: a non-zero INTERCEPT is funnel asymmetry, because a\n' +
      '# symmetric funnel has small studies scattered evenly about the pooled line.\n' +
      'snd  <- f$est / f$se\n' +
      'prec <- 1 / f$se\n' +
      'eg   <- lm(snd ~ prec)\n' +
      'print(summary(eg)$coefficients)\n\n' +
      'cat(sprintf("\\nEgger intercept %.2f (p = %.3f)\\n",\n' +
      '            coef(eg)[1], summary(eg)$coefficients[1, 4]))\n\n' +
      '# Asymmetry is EVIDENCE, not proof. Small-study effects, real differences in\n' +
      '# how small trials are run, and plain chance all bend a funnel. With this few\n' +
      '# studies the test has little power, so read it alongside the picture.\n' +
      'cat("studies:", nrow(f), "- Egger is underpowered below about 10\\n")';

    var wrap = document.createElement('div');
    wrap.style.cssText = 'font-family:IBM Plex Sans,system-ui,sans-serif';
    wrap.innerHTML =
      '<div style="overflow-x:auto">' + chart + '</div>' +
      '<p style="margin:12px 0 10px;font-size:12.5px;color:' + P.mut + ';line-height:1.55">' +
        'Each dot is a study, placed by its effect and its standard error. Inside the dashed ' +
        'funnel is where 95% of them belong if sampling error is the only thing spreading them ' +
        'out. A gap in one bottom corner is the signature of small studies that found the wrong ' +
        'answer and were never written up' +
        (missing.length ? ', drawn here as hollow markers.' : '.') + '</p>' +
      u.runnable(rcode, { label: 'Run Egger\'s test on these studies' });
    el.innerHTML = ''; el.appendChild(wrap);
  }

  if (window.LessonWidgets) window.LessonWidgets.register('funnel-plot', mount);
})();
