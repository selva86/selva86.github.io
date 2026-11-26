/* missingness-pattern.js - the pattern matrix for missing data: one row per
 * distinct pattern of which variables are present, sized by how many cases
 * share it, over a per-variable missing rate.
 *
 * Reading the matrix is how you tell the three mechanisms apart in practice.
 * One dominant complete row with scattered singletons looks like MCAR; a
 * staircase, where missing one variable almost always means missing another,
 * is structure that MAR can model; and a pattern that lines up with the values
 * themselves is the MNAR case no pattern plot can rule out. cfg:
 *   { vars:["age","bmi"], patterns:[{mask:[1,0], n:42}], mechanism:"MAR",
 *     note:"..." }
 * mask entries: 1 observed, 0 missing. Rows are sorted by n, so the complete
 * cases come first.
 */
(function () {
  'use strict';

  function mount(el, cfg) {
    var u = window.LessonWidgets.u; if (!u) return;
    cfg = cfg || {};
    var P = u.P;

    var vars = (cfg.vars && cfg.vars.length) ? cfg.vars.slice()
      : ['age', 'bmi', 'sbp', 'cholesterol'];
    var patterns = (cfg.patterns && cfg.patterns.length) ? cfg.patterns.slice() : [
      { mask: [1, 1, 1, 1], n: 612 },
      { mask: [1, 1, 1, 0], n: 118 },
      { mask: [1, 1, 0, 0], n: 141 },
      { mask: [1, 0, 1, 1], n: 46 },
      { mask: [1, 0, 0, 0], n: 83 }
    ];
    var mechanism = cfg.mechanism || '';

    patterns.sort(function (a, b) { return b.n - a.n; });
    var total = patterns.reduce(function (a, p) { return a + p.n; }, 0);

    // per-variable missing count
    var miss = vars.map(function (_, ci) {
      return patterns.reduce(function (a, p) { return a + (p.mask[ci] ? 0 : p.n); }, 0);
    });
    var complete = patterns.filter(function (p) {
      return p.mask.every(function (m) { return m === 1; });
    }).reduce(function (a, p) { return a + p.n; }, 0);

    // ---- geometry ----------------------------------------------------------
    var cellW = 86, cellH = 30, headH = 46, nW = 92, barH = 44;
    var W = nW + cellW * vars.length + 16;
    var H = headH + cellH * patterns.length + barH + 30;

    var g = '';
    // column headers
    vars.forEach(function (v, ci) {
      var x = nW + cellW * ci + cellW / 2;
      g += '<text x="' + x.toFixed(1) + '" y="' + (headH - 22) + '" text-anchor="middle" ' +
           'font-family="IBM Plex Mono,monospace" font-size="11" fill="' + P.ink + '">' + u.esc(v) + '</text>';
      g += '<text x="' + x.toFixed(1) + '" y="' + (headH - 8) + '" text-anchor="middle" ' +
           'font-family="IBM Plex Mono,monospace" font-size="9.5" fill="' +
           (miss[ci] ? P.bad : P.mut) + '">' + (100 * miss[ci] / total).toFixed(0) + '% NA</text>';
    });
    g += '<text x="8" y="' + (headH - 15) + '" font-family="IBM Plex Sans,sans-serif" font-size="10" ' +
         'font-weight="700" fill="' + P.mut + '" letter-spacing="0.03em">CASES</text>';

    // the matrix
    patterns.forEach(function (p, ri) {
      var y = headH + cellH * ri;
      var isComplete = p.mask.every(function (m) { return m === 1; });
      g += '<text x="' + (nW - 10) + '" y="' + (y + cellH / 2 + 4).toFixed(1) + '" text-anchor="end" ' +
           'font-family="IBM Plex Mono,monospace" font-size="11.5" fill="' + P.ink +
           '"' + (isComplete ? ' font-weight="700"' : '') + '>' + p.n + '</text>';
      p.mask.forEach(function (m, ci) {
        var x = nW + cellW * ci;
        g += '<rect x="' + (x + 2) + '" y="' + (y + 3) + '" width="' + (cellW - 4) + '" height="' + (cellH - 6) +
             '" rx="3" fill="' + (m ? P.add : P.del) + '" stroke="' + (m ? P.acc : P.bad) +
             '" stroke-opacity="0.45" stroke-width="1"/>';
        if (!m) {
          g += '<text x="' + (x + cellW / 2).toFixed(1) + '" y="' + (y + cellH / 2 + 4).toFixed(1) +
               '" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="10.5" ' +
               'font-weight="700" fill="' + P.bad + '">NA</text>';
        }
      });
    });

    // per-variable missing bars
    var by = headH + cellH * patterns.length + 14;
    var maxMiss = Math.max.apply(null, miss) || 1;
    vars.forEach(function (v, ci) {
      var x = nW + cellW * ci, h = (miss[ci] / maxMiss) * (barH - 18);
      g += '<rect x="' + (x + cellW / 2 - 13) + '" y="' + (by + (barH - 18) - h).toFixed(1) +
           '" width="26" height="' + h.toFixed(1) + '" rx="2" fill="' + P.bad + '" fill-opacity="0.55"/>';
      g += '<text x="' + (x + cellW / 2).toFixed(1) + '" y="' + (by + barH - 2) + '" text-anchor="middle" ' +
           'font-family="IBM Plex Mono,monospace" font-size="9.5" fill="' + P.mut + '">' + miss[ci] + '</text>';
    });
    g += '<text x="' + (nW - 10) + '" y="' + (by + barH - 2) + '" text-anchor="end" ' +
         'font-family="IBM Plex Sans,sans-serif" font-size="9.5" fill="' + P.mut + '">missing</text>';

    var chart = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W +
      'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Missing data pattern matrix for ' +
      vars.length + ' variables across ' + patterns.length + ' patterns">' + g + '</svg>';

    // ---- runnable R: rebuild the same patterns, then ask the MCAR question --
    var rcode =
      '# Rebuild exactly the patterns in the plot, so the counts match.\n' +
      'vars <- c(' + vars.map(function (v) { return '"' + String(v).replace(/"/g, '') + '"'; }).join(', ') + ')\n' +
      'mask <- rbind(\n' +
      patterns.map(function (p) { return '  c(' + p.mask.map(function (m) { return m ? 1 : 0; }).join(', ') + ')'; }).join(',\n') + '\n)\n' +
      'n    <- c(' + patterns.map(function (p) { return p.n; }).join(', ') + ')\n\n' +
      '# One row per case: observed values are filled in, missing ones are NA.\n' +
      '# The first variable is drawn so that cases missing MORE shift upward on it.\n' +
      '# That is deliberate: it makes the data genuinely MAR, so the test below has\n' +
      '# something true to find. Draw it independently and the test comes back null\n' +
      '# while the pattern matrix still looks structured, which teaches the wrong\n' +
      '# lesson about what a pattern plot can tell you.\n' +
      'set.seed(42)\n' +
      'rows <- do.call(rbind, lapply(seq_len(nrow(mask)), function (i) {\n' +
      '  nmiss <- sum(mask[i, ] == 0)\n' +
      '  m <- matrix(rnorm(n[i] * length(vars)), nrow = n[i])\n' +
      '  m[, 1] <- m[, 1] + 0.75 * nmiss          # missingness depends on var 1\n' +
      '  m[, mask[i, ] == 0] <- NA\n' +
      '  m\n' +
      '}))\n' +
      'd <- as.data.frame(rows)\n' +
      'names(d) <- vars\n\n' +
      '# Missing rate per variable. Always the first thing to print.\n' +
      'print(round(colMeans(is.na(d)), 3))\n\n' +
      '# The pattern table. This is the plot, as numbers.\n' +
      'pat <- apply(ifelse(is.na(d), 0, 1), 1, paste, collapse = "")\n' +
      'print(sort(table(pat), decreasing = TRUE))\n\n' +
      'cat(sprintf("\\ncomplete cases: %d of %d (%.0f%%)\\n",\n' +
      '            sum(complete.cases(d)), nrow(d), 100 * mean(complete.cases(d))))\n\n' +
      '# The question the picture cannot answer. MCAR says missingness is\n' +
      '# unrelated to anything; MAR says it depends on what you DID observe.\n' +
      '# Testable: does being missing on one variable depend on another?\n' +
      'd$miss_' + String(vars[vars.length - 1]).replace(/[^A-Za-z0-9_]/g, '_') +
      ' <- as.integer(is.na(d$`' + String(vars[vars.length - 1]).replace(/`/g, '') + '`))\n' +
      'print(summary(glm(miss_' + String(vars[vars.length - 1]).replace(/[^A-Za-z0-9_]/g, '_') +
      ' ~ `' + String(vars[0]).replace(/`/g, '') + '`,\n' +
      '                  data = d, family = binomial))$coefficients)\n\n' +
      '# A significant slope rules MCAR out. Nothing here can rule MNAR out,\n' +
      '# because that would need the values you do not have.';

    var wrap = document.createElement('div');
    wrap.style.cssText = 'font-family:IBM Plex Sans,system-ui,sans-serif';
    wrap.innerHTML =
      '<div style="overflow-x:auto">' + chart + '</div>' +
      '<p style="margin:12px 0 10px;font-size:12.5px;color:' + P.mut + ';line-height:1.55">' +
        '<b>' + complete + ' of ' + total + '</b> cases are complete (' +
        (100 * complete / total).toFixed(0) + '%), so a complete-case analysis throws away ' +
        (100 - 100 * complete / total).toFixed(0) + '% of the data' +
        (patterns.length > 2 ? ' and the discarded rows are not a random sample of the rest' : '') + '. ' +
        (mechanism ? 'This dataset is ' + u.esc(mechanism) + '. ' : '') +
        'The matrix shows which variables go missing together; it cannot show whether they go ' +
        'missing <i>because of their own values</i>.</p>' +
      u.runnable(rcode, { label: 'Rebuild and test these patterns' });
    el.innerHTML = ''; el.appendChild(wrap);
  }

  if (window.LessonWidgets) window.LessonWidgets.register('missingness-pattern', mount);
})();
