/* spec-curve.js - a specification curve: every defensible version of one
 * analysis, sorted by the estimate it produces, over a matrix showing which
 * analytic choices each version made.
 *
 * The top panel answers "how much does the answer depend on choices nobody
 * reports?" and the bottom panel answers "which choice is doing it?" A curve
 * that crosses the null somewhere in the middle means the headline result was
 * a choice, not a finding. cfg:
 *   { specs:[{est, lo, hi, choices:{dim:"level"}}], nullAt:0,
 *     ylab:"Estimated effect", dims:[{key,label}] }
 * `dims` is optional; the dimensions and their levels are read off the specs
 * in first-seen order when it is left out.
 *
 * Every spec here is pre-computed by the lesson, because the point is to
 * compare them, not to refit 48 models in the browser. The runnable R block
 * builds the same table and asks the questions a reader should ask of it.
 */
(function () {
  'use strict';

  function mount(el, cfg) {
    var u = window.LessonWidgets.u; if (!u) return;
    cfg = cfg || {};
    var P = u.P;

    var specs = (cfg.specs && cfg.specs.length) ? cfg.specs.slice() : (function () {
      // A small but honest default: 2 x 2 x 3 = 12 defensible analyses.
      var out = [], outc = ['raw', 'log'], samp = ['full', 'trimmed'],
          covs = ['none', 'age + sex', 'age + sex + site'];
      var k = 0;
      outc.forEach(function (o) {
        samp.forEach(function (s) {
          covs.forEach(function (c) {
            // deterministic spread, not random: the shape is the teaching point
            var base = 0.26 + (o === 'log' ? -0.10 : 0.05) + (s === 'trimmed' ? -0.07 : 0.03) +
                       (c === 'none' ? 0.09 : c === 'age + sex' ? 0.0 : -0.06);
            var se = 0.07 + 0.012 * (k % 4);
            out.push({ est: base, lo: base - 1.96 * se, hi: base + 1.96 * se,
                       choices: { outcome: o, sample: s, covariates: c } });
            k++;
          });
        });
      });
      return out;
    })();

    var nullAt = cfg.nullAt == null ? 0 : +cfg.nullAt;
    var ylab = cfg.ylab || 'Estimated effect';

    specs.sort(function (a, b) { return a.est - b.est; });

    // dimensions and levels, in first-seen order
    var dimKeys = [], levels = {};
    (cfg.dims || []).forEach(function (d) { dimKeys.push(d.key); levels[d.key] = []; });
    var dimLabel = {};
    (cfg.dims || []).forEach(function (d) { dimLabel[d.key] = d.label || d.key; });
    specs.forEach(function (s) {
      Object.keys(s.choices || {}).forEach(function (k) {
        if (dimKeys.indexOf(k) < 0) { dimKeys.push(k); levels[k] = []; }
        if (!levels[k]) levels[k] = [];
        if (levels[k].indexOf(s.choices[k]) < 0) levels[k].push(s.choices[k]);
      });
    });
    // A dimension name gets its OWN row above its levels. Sharing a row put
    // "COVARIATES" straight through "age + sex + site", because both are long
    // and both want the same 150px gutter.
    var rows = [];
    dimKeys.forEach(function (k) {
      rows.push({ head: true, dim: k });
      (levels[k] || []).forEach(function (lv) { rows.push({ dim: k, level: lv }); });
    });

    // ---- geometry ----------------------------------------------------------
    var labW = 150, colW = Math.max(12, Math.min(26, 520 / specs.length));
    var topH = 190, rowH = 15, gap = 26;
    var W = labW + colW * specs.length + 24;
    var H = topH + gap + rowH * rows.length + 34;

    var lo = Math.min(nullAt, Math.min.apply(null, specs.map(function (s) { return s.lo; })));
    var hi = Math.max(nullAt, Math.max.apply(null, specs.map(function (s) { return s.hi; })));
    var pad = ((hi - lo) || 1) * 0.08;
    function sy(v) { return topH - 18 - (v - (lo - pad)) / ((hi + pad) - (lo - pad)) * (topH - 36); }
    function cx(i) { return labW + colW * i + colW / 2; }
    function f2(v) { return (Math.round(v * 100) / 100).toFixed(2); }

    var g = '';
    // y axis + null line
    g += '<line x1="' + labW + '" y1="' + sy(hi + pad) + '" x2="' + labW + '" y2="' + sy(lo - pad) +
         '" stroke="' + P.line + '" stroke-width="1.5"/>';
    [lo, nullAt, hi].forEach(function (t) {
      g += '<text x="' + (labW - 8) + '" y="' + (sy(t) + 3).toFixed(1) + '" text-anchor="end" ' +
           'font-family="IBM Plex Mono,monospace" font-size="9.5" fill="' + P.mut + '">' + f2(t) + '</text>';
    });
    g += '<line x1="' + labW + '" y1="' + sy(nullAt).toFixed(1) + '" x2="' + (W - 12) + '" y2="' + sy(nullAt).toFixed(1) +
         '" stroke="' + P.faint + '" stroke-width="1" stroke-dasharray="4 3"/>';
    g += '<text transform="translate(16,' + (topH / 2).toFixed(1) + ') rotate(-90)" text-anchor="middle" ' +
         'font-family="IBM Plex Sans,sans-serif" font-size="11" fill="' + P.mut + '">' + u.esc(ylab) + '</text>';

    // the curve
    var nSig = 0, nSigSame = 0;
    specs.forEach(function (s, i) {
      var crosses = (s.lo <= nullAt && s.hi >= nullAt);
      if (!crosses) { nSig++; if (s.est > nullAt) nSigSame++; }
      var col = crosses ? P.faint : P.acc;
      g += '<line x1="' + cx(i).toFixed(1) + '" y1="' + sy(s.lo).toFixed(1) + '" x2="' + cx(i).toFixed(1) +
           '" y2="' + sy(s.hi).toFixed(1) + '" stroke="' + col + '" stroke-width="1.3" stroke-opacity="0.75"/>';
      g += '<circle cx="' + cx(i).toFixed(1) + '" cy="' + sy(s.est).toFixed(1) + '" r="3" fill="' + col + '"/>';
    });

    // the choice matrix
    var y0 = topH + gap;
    rows.forEach(function (r, ri) {
      var y = y0 + rowH * ri + rowH / 2;
      if (r.head) {
        g += '<text x="8" y="' + (y + 3.5).toFixed(1) + '" font-family="IBM Plex Sans,sans-serif" ' +
             'font-size="9.5" font-weight="700" fill="' + P.mut + '" letter-spacing="0.05em">' +
             u.esc((dimLabel[r.dim] || r.dim).toUpperCase()) + '</text>';
        return;                       // header rows carry no dots
      }
      g += '<text x="' + (labW - 8) + '" y="' + (y + 3.5).toFixed(1) + '" text-anchor="end" ' +
           'font-family="IBM Plex Mono,monospace" font-size="10" fill="' + P.body + '">' + u.esc(r.level) + '</text>';
      specs.forEach(function (s, i) {
        var on = (s.choices || {})[r.dim] === r.level;
        var crosses = (s.lo <= nullAt && s.hi >= nullAt);
        g += '<circle cx="' + cx(i).toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (on ? 3 : 1.2) +
             '" fill="' + (on ? (crosses ? P.faint : P.acc) : P.line) + '"/>';
      });
    });
    // The caption lives in HTML below, not in the SVG. As SVG text it ran 45px
    // past the viewBox and was clipped, because prose length has nothing to do
    // with the chart's width.
    var chart = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W +
      'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Specification curve of ' +
      specs.length + ' analyses over a matrix of analytic choices">' + g + '</svg>';

    var rcode =
      '# Every defensible version of the same analysis, one row each.\n' +
      's <- data.frame(\n' +
      '  est = c(' + specs.map(function (x) { return +(Math.round(x.est * 1000) / 1000); }).join(', ') + '),\n' +
      '  lo  = c(' + specs.map(function (x) { return +(Math.round(x.lo * 1000) / 1000); }).join(', ') + '),\n' +
      '  hi  = c(' + specs.map(function (x) { return +(Math.round(x.hi * 1000) / 1000); }).join(', ') + ')' +
      (dimKeys.length ? ',\n' + dimKeys.map(function (k) {
        return '  ' + k.replace(/[^A-Za-z0-9_]/g, '_') + ' = c(' +
          specs.map(function (x) { return '"' + String((x.choices || {})[k] == null ? '' : (x.choices || {})[k]).replace(/"/g, '') + '"'; }).join(', ') + ')';
      }).join(',\n') : '') + ',\n' +
      '  stringsAsFactors = FALSE\n' +
      ')\n\n' +
      's <- s[order(s$est), ]\n' +
      's$sig <- !(s$lo <= ' + nullAt + ' & s$hi >= ' + nullAt + ')\n\n' +
      '# The three numbers that belong in the paper, instead of one estimate.\n' +
      'cat(sprintf("specifications      : %d\\n", nrow(s)))\n' +
      'cat(sprintf("median estimate     : %.3f\\n", median(s$est)))\n' +
      'cat(sprintf("range               : %.3f to %.3f\\n", min(s$est), max(s$est)))\n' +
      'cat(sprintf("exclude the null    : %d of %d (%.0f%%)\\n",\n' +
      '            sum(s$sig), nrow(s), 100 * mean(s$sig)))\n\n' +
      '# Which CHOICE moves the answer? Average the estimate within each level.\n' +
      'for (d in setdiff(names(s), c("est", "lo", "hi", "sig"))) {\n' +
      '  cat("\\n", d, ":\\n", sep = "")\n' +
      '  print(round(tapply(s$est, s[[d]], mean), 3))\n' +
      '}\n\n' +
      '# A curve that crosses the null partway along means the headline result was\n' +
      '# a choice. Reporting the single most favourable specification is the thing\n' +
      '# this plot exists to make visible.';

    var wrap = document.createElement('div');
    wrap.style.cssText = 'font-family:IBM Plex Sans,system-ui,sans-serif';
    wrap.innerHTML =
      '<div style="overflow-x:auto">' + chart + '</div>' +
      '<p style="margin:12px 0 10px;font-size:12.5px;color:' + P.mut + ';line-height:1.55">' +
        specs.length + ' specifications, sorted by the estimate each one produces. ' +
        '<b>' + nSig + ' of ' + specs.length + '</b> exclude the null' +
        (nSig ? ', and ' + nSigSame + ' of those point the same way' : '') +
        '. Faded columns are the ones whose interval spans no effect. Solid dots in the matrix ' +
        'mark the choices a specification made, so reading down a column tells you exactly ' +
        'which ones produced it.</p>' +
      u.runnable(rcode, { label: 'Interrogate the specification curve' });
    el.innerHTML = ''; el.appendChild(wrap);
  }

  if (window.LessonWidgets) window.LessonWidgets.register('spec-curve', mount);
})();
