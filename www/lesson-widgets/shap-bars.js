/* shap-bars.js - additive feature contributions for ONE prediction, as a waterfall.
 * Start at the baseline (the average prediction), add each feature's signed push, and
 * land exactly on this row's prediction. That "sums to the prediction" property is the
 * heart of SHAP. Emits runnable R that computes exact additive contributions for a
 * linear model (where SHAP has a closed form).
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  var BASE = 0.30;
  var CONTRIB = [
    ['tenure',        +0.22],
    ['monthly spend', +0.14],
    ['support calls', -0.18],
    ['discount',      +0.09],
    ['contract: 1yr', -0.07]
  ];

  function mount(el, cfg) {
    cfg = cfg || {};
    var pred = BASE + CONTRIB.reduce(function (s, c) { return s + c[1]; }, 0);

    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="sh-plot"></div>' +
      '<div style="font:13px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:10px 0 14px">The bars start at the <b>baseline</b> (' + BASE.toFixed(2) + ', the average prediction) and each feature pushes the score up (blue) or down (amber). They sum to exactly this customer\'s prediction (<b>' + pred.toFixed(2) + '</b>) - that is what makes SHAP an <i>explanation</i>, not just a ranking.</div>' +
      u.runnable(rcode(), { label: 'Compute exact additive contributions in R' });

    var W = 460, rowH = 30, m = 120, top = 14, iw = W - m - 60;
    var lo = Math.min(BASE, pred) - 0.05, hi = Math.max(BASE, pred) + 0.05;
    // build cumulative steps
    var rows = [], run = BASE;
    CONTRIB.forEach(function (c) { rows.push({ name: c[0], from: run, to: run + c[1], v: c[1] }); run += c[1]; });
    function px(x) { return m + (x - lo) / (hi - lo) * iw; }
    var H = top + rowH * (CONTRIB.length + 2) + 10;
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="SHAP contribution waterfall">';
    function bandLabel(y, txt, val, bold) {
      return '<text x="' + (m - 8) + '" y="' + (y + 4) + '" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="11.5"' + (bold ? ' font-weight="600"' : '') + ' fill="' + P.ink + '">' + txt + '</text>' +
        '<text x="' + (W - 6) + '" y="' + (y + 4) + '" text-anchor="end" font-family="IBM Plex Mono,monospace" font-size="11" fill="' + P.mut + '">' + val + '</text>';
    }
    var y = top + 12;
    // baseline marker
    svg += '<line x1="' + px(BASE).toFixed(1) + '" y1="' + top + '" x2="' + px(BASE).toFixed(1) + '" y2="' + (H - 18) + '" stroke="' + P.line + '" stroke-dasharray="3 3"/>';
    svg += bandLabel(y, 'baseline', BASE.toFixed(2), true); y += rowH;
    rows.forEach(function (r) {
      var x1 = px(Math.min(r.from, r.to)), x2 = px(Math.max(r.from, r.to)), up = r.v >= 0;
      svg += '<rect x="' + x1.toFixed(1) + '" y="' + (y - 9) + '" width="' + Math.max(2, x2 - x1).toFixed(1) + '" height="18" rx="3" fill="' + (up ? P.acc : (P.c2 || '#c9a24a')) + '"/>';
      svg += bandLabel(y, r.name, (up ? '+' : '') + r.v.toFixed(2), false); y += rowH;
    });
    svg += '<line x1="' + px(pred).toFixed(1) + '" y1="' + top + '" x2="' + px(pred).toFixed(1) + '" y2="' + (H - 18) + '" stroke="' + P.ink + '" stroke-width="1.5"/>';
    svg += bandLabel(y, 'prediction', pred.toFixed(2), true);
    svg += '</svg>';
    el.querySelector('.sh-plot').innerHTML = svg;
  }

  function rcode() {
    return [
      '# For a linear model, a feature\'s SHAP value has an exact closed form:',
      '#   contribution_j = beta_j * (x_j - mean(x_j))',
      '# and the contributions + the baseline sum to the prediction.',
      'set.seed(1)',
      'd <- data.frame(tenure = rnorm(200), spend = rnorm(200), calls = rnorm(200))',
      'd$y <- 0.3 + 0.8*d$tenure + 0.5*d$spend - 0.6*d$calls + rnorm(200, 0, 0.3)',
      'fit <- lm(y ~ tenure + spend + calls, data = d)',
      '',
      'b   <- coef(fit)[-1]                 # slopes',
      'mu  <- colMeans(d[, c("tenure","spend","calls")])',
      'row <- d[1, c("tenure","spend","calls")]',
      'contrib <- b * (unlist(row) - mu)    # per-feature SHAP contributions',
      '',
      'baseline <- predict(fit, newdata = as.data.frame(t(mu)))',
      'c(baseline = baseline, contrib,',
      '  reconstructed = baseline + sum(contrib),  # == the prediction',
      '  prediction    = predict(fit, newdata = row))'
    ].join('\n');
  }

  window.LessonWidgets.register('shap-bars', mount);
})();
