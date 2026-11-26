/* forest-plot.js - the meta-analysis forest plot: one row per study, a marker
 * sized by its weight, its confidence interval as a horizontal line, and the
 * pooled estimate as a diamond under a vertical null line.
 *
 * The whole point of the shape is that it shows precision and effect at once:
 * a big square on a short line is a study that moves the pooled answer, a tiny
 * square on a line spanning the null is one that barely does. cfg:
 *   { studies:[{name, est, lo, hi}], pooled:{est, lo, hi, label}, nullAt:0,
 *     xlab:"Standardised mean difference", effect:"SMD", model:"fixed" }
 * `pooled` is optional: left out, it is computed by inverse-variance weighting,
 * which is also what the runnable R block does by hand, so the picture and the
 * code cannot disagree.
 *
 * Deliberately NO metafor/meta dependency. Those are not proven runnable in
 * the sandbox, and a reader who sees rma() do it in one line learns less than
 * one who watches 1/se^2 do the weighting.
 */
(function () {
  'use strict';

  function se_of(lo, hi) {
    // 95% CI half-width is 1.96 se each side, so the full width is 3.92 se.
    var w = (hi - lo) / 3.9199;
    return w > 0 ? w : 1e-6;
  }

  function pool(studies) {
    var sw = 0, swy = 0;
    studies.forEach(function (s) {
      var w = 1 / Math.pow(se_of(s.lo, s.hi), 2);
      sw += w; swy += w * s.est;
    });
    var est = swy / sw, se = Math.sqrt(1 / sw);
    return { est: est, lo: est - 1.96 * se, hi: est + 1.96 * se };
  }

  function mount(el, cfg) {
    var u = window.LessonWidgets.u; if (!u) return;
    cfg = cfg || {};
    var P = u.P;
    var studies = (cfg.studies && cfg.studies.length) ? cfg.studies : [
      { name: 'Alvarez 2019', est: 0.42, lo: 0.04, hi: 0.80 },
      { name: 'Boateng 2020', est: 0.31, lo: 0.11, hi: 0.51 },
      { name: 'Chaudhary 2021', est: 0.58, lo: -0.06, hi: 1.22 },
      { name: 'Doyle 2021', est: 0.12, lo: -0.04, hi: 0.28 },
      { name: 'Eriksen 2022', est: 0.37, lo: 0.19, hi: 0.55 },
      { name: 'Fujita 2023', est: 0.66, lo: 0.10, hi: 1.22 }
    ];
    var nullAt = cfg.nullAt == null ? 0 : +cfg.nullAt;
    var xlab = cfg.xlab || 'Standardised mean difference';
    var effect = cfg.effect || 'SMD';
    var pooled = cfg.pooled || pool(studies);
    var pooledLabel = (cfg.pooled && cfg.pooled.label) || 'Pooled (fixed effect)';

    // Weights as a share of the total, which is what the square area encodes.
    var ws = studies.map(function (s) { return 1 / Math.pow(se_of(s.lo, s.hi), 2); });
    var wsum = ws.reduce(function (a, b) { return a + b; }, 0);
    var wpct = ws.map(function (w) { return 100 * w / wsum; });

    // ---- geometry ----------------------------------------------------------
    var rowH = 26, padT = 34, padB = 52, nameW = 132, numW = 118;
    var W = 620, plotL = nameW + 10, plotR = W - numW - 10, plotW = plotR - plotL;
    var H = padT + rowH * (studies.length + 1.6) + padB;

    var allLo = Math.min(nullAt, pooled.lo, Math.min.apply(null, studies.map(function (s) { return s.lo; })));
    var allHi = Math.max(nullAt, pooled.hi, Math.max.apply(null, studies.map(function (s) { return s.hi; })));
    var span = (allHi - allLo) || 1, pad = span * 0.08;
    var d0 = allLo - pad, d1 = allHi + pad;
    function sx(v) { return plotL + (v - d0) / (d1 - d0) * plotW; }

    function fmt(v) { return (Math.round(v * 100) / 100).toFixed(2); }

    var svg = '';
    // x axis ticks: null, and the two ends. Drop any tick that would land on
    // top of one already placed: with a null near an endpoint the two labels
    // overlap into an unreadable smudge, and the null is the one that matters.
    var ticks = [nullAt, d0 + pad, d1 - pad].reduce(function (keep, t) {
      var clash = keep.some(function (k) { return Math.abs(sx(k) - sx(t)) < 34; });
      if (!clash) keep.push(t);
      return keep;
    }, []).sort(function (a, b) { return a - b; });
    var axisY = padT + rowH * (studies.length + 1.5);
    svg += '<line x1="' + sx(d0) + '" y1="' + axisY + '" x2="' + sx(d1) + '" y2="' + axisY +
           '" stroke="' + P.line + '" stroke-width="1.5"/>';
    ticks.forEach(function (t) {
      svg += '<line x1="' + sx(t).toFixed(1) + '" y1="' + axisY + '" x2="' + sx(t).toFixed(1) + '" y2="' + (axisY + 5) +
             '" stroke="' + P.line + '"/>' +
             '<text x="' + sx(t).toFixed(1) + '" y="' + (axisY + 17) + '" text-anchor="middle" ' +
             'font-family="IBM Plex Mono,monospace" font-size="9.5" fill="' + P.mut + '">' + fmt(t) + '</text>';
    });
    svg += '<text x="' + ((plotL + plotR) / 2).toFixed(1) + '" y="' + (H - 16) + '" text-anchor="middle" ' +
           'font-family="IBM Plex Sans,sans-serif" font-size="11" fill="' + P.mut + '">' + u.esc(xlab) + '</text>';

    // the null line, drawn behind everything
    svg += '<line x1="' + sx(nullAt).toFixed(1) + '" y1="' + (padT - 14) + '" x2="' + sx(nullAt).toFixed(1) +
           '" y2="' + axisY + '" stroke="' + P.faint + '" stroke-width="1" stroke-dasharray="4 3"/>';

    // header row
    svg += '<text x="8" y="' + (padT - 16) + '" font-family="IBM Plex Sans,sans-serif" font-size="10" ' +
           'font-weight="700" fill="' + P.mut + '" letter-spacing="0.04em">STUDY</text>' +
           '<text x="' + (W - 8) + '" y="' + (padT - 16) + '" text-anchor="end" ' +
           'font-family="IBM Plex Sans,sans-serif" font-size="10" font-weight="700" fill="' + P.mut +
           '" letter-spacing="0.04em">' + u.esc(effect) + ' [95% CI]   WT</text>';

    // study rows
    studies.forEach(function (s, i) {
      var y = padT + rowH * i + rowH / 2;
      // marker side scales with sqrt(weight) so AREA tracks weight, not height
      var side = 5 + 13 * Math.sqrt(wpct[i] / 100);
      svg += '<text x="8" y="' + (y + 4).toFixed(1) + '" font-family="IBM Plex Sans,sans-serif" ' +
             'font-size="11.5" fill="' + P.ink + '">' + u.esc(s.name) + '</text>';
      svg += '<line x1="' + sx(s.lo).toFixed(1) + '" y1="' + y.toFixed(1) + '" x2="' + sx(s.hi).toFixed(1) +
             '" y2="' + y.toFixed(1) + '" stroke="' + P.body + '" stroke-width="1.4"/>';
      // end caps
      [s.lo, s.hi].forEach(function (v) {
        svg += '<line x1="' + sx(v).toFixed(1) + '" y1="' + (y - 4).toFixed(1) + '" x2="' + sx(v).toFixed(1) +
               '" y2="' + (y + 4).toFixed(1) + '" stroke="' + P.body + '" stroke-width="1.4"/>';
      });
      svg += '<rect x="' + (sx(s.est) - side / 2).toFixed(1) + '" y="' + (y - side / 2).toFixed(1) +
             '" width="' + side.toFixed(1) + '" height="' + side.toFixed(1) + '" fill="' + P.c0 + '" fill-opacity="0.85"/>';
      svg += '<text x="' + (W - 8) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="end" ' +
             'font-family="IBM Plex Mono,monospace" font-size="10.5" fill="' + P.body + '">' +
             fmt(s.est) + ' [' + fmt(s.lo) + ', ' + fmt(s.hi) + ']  ' + wpct[i].toFixed(0) + '%</text>';
    });

    // pooled diamond
    var py = padT + rowH * studies.length + rowH * 0.75;
    var dl = sx(pooled.lo), dr = sx(pooled.hi), dc = sx(pooled.est), dh = 8;
    svg += '<polygon points="' + dl.toFixed(1) + ',' + py.toFixed(1) + ' ' + dc.toFixed(1) + ',' + (py - dh).toFixed(1) +
           ' ' + dr.toFixed(1) + ',' + py.toFixed(1) + ' ' + dc.toFixed(1) + ',' + (py + dh).toFixed(1) +
           '" fill="' + P.acc + '"/>';
    svg += '<text x="8" y="' + (py + 4).toFixed(1) + '" font-family="IBM Plex Sans,sans-serif" font-size="11.5" ' +
           'font-weight="700" fill="' + P.ink + '">' + u.esc(pooledLabel) + '</text>';
    svg += '<text x="' + (W - 8) + '" y="' + (py + 4).toFixed(1) + '" text-anchor="end" ' +
           'font-family="IBM Plex Mono,monospace" font-size="10.5" font-weight="700" fill="' + P.ink + '">' +
           fmt(pooled.est) + ' [' + fmt(pooled.lo) + ', ' + fmt(pooled.hi) + ']</text>';

    var chart = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W +
      'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Forest plot of ' +
      studies.length + ' studies with a pooled estimate">' + svg + '</svg>';

    // ---- the runnable R: same arithmetic, by hand -------------------------
    var rcode =
      '# One row per study. se is recovered from the interval, because that is\n' +
      '# what published papers actually give you.\n' +
      'm <- data.frame(\n' +
      '  study = c(' + studies.map(function (s) { return '"' + String(s.name).replace(/"/g, '') + '"'; }).join(', ') + '),\n' +
      '  est   = c(' + studies.map(function (s) { return +s.est; }).join(', ') + '),\n' +
      '  lo    = c(' + studies.map(function (s) { return +s.lo; }).join(', ') + '),\n' +
      '  hi    = c(' + studies.map(function (s) { return +s.hi; }).join(', ') + '),\n' +
      '  stringsAsFactors = FALSE\n' +
      ')\n\n' +
      'm$se <- (m$hi - m$lo) / (2 * qnorm(0.975))   # 3.92 se across a 95% CI\n' +
      'm$w  <- 1 / m$se^2                            # inverse variance\n' +
      'm$wt <- round(100 * m$w / sum(m$w))           # weight, as a percentage\n\n' +
      '# Fixed-effect pooling IS the weighted mean. No package needed.\n' +
      'est <- sum(m$w * m$est) / sum(m$w)\n' +
      'se  <- sqrt(1 / sum(m$w))\n' +
      'ci  <- est + c(-1, 1) * qnorm(0.975) * se\n\n' +
      'print(m[, c("study", "est", "lo", "hi", "wt")], row.names = FALSE)\n' +
      'cat(sprintf("\\npooled %.2f  95%% CI [%.2f, %.2f]\\n", est, ci[1], ci[2]))\n\n' +
      '# The widest interval carries the least weight. Check which study that is:\n' +
      'cat("widest CI:", m$study[which.max(m$hi - m$lo)],\n' +
      '    "with weight", m$wt[which.max(m$hi - m$lo)], "%\\n")';

    var wrap = document.createElement('div');
    wrap.style.cssText = 'font-family:IBM Plex Sans,system-ui,sans-serif';
    wrap.innerHTML =
      '<div style="overflow-x:auto">' + chart + '</div>' +
      '<p style="margin:12px 0 10px;font-size:12.5px;color:' + P.mut + ';line-height:1.55">' +
        'Square <b>area</b> is the study\'s weight, so a small square on a long line is a study the ' +
        'pooled estimate largely ignores. The dashed line is no effect; the diamond spans the ' +
        'pooled interval.</p>' +
      u.runnable(rcode, { label: 'Pool these studies yourself' });
    el.innerHTML = ''; el.appendChild(wrap);
  }

  if (window.LessonWidgets) window.LessonWidgets.register('forest-plot', mount);
})();
