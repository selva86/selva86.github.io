/* shift-types.js - the three kinds of distribution shift, made visible. A model trained on one
 * distribution is deployed on another, and WHAT changed decides whether it still works.
 * Covariate shift: the feature distribution P(x) moves but the relationship P(y|x) holds, so a
 * well-specified model stays valid. Label shift: the class base rate P(y) changes. Concept
 * shift: the relationship P(y|x) itself changes, which silently breaks the model. Toggle the
 * three and watch which curve moves. Emits a base-R demo of each shift's effect on accuracy.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  function mount(el, cfg) {
    cfg = cfg || {}; var mode = 'covariate';
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="sh-seg" style="margin-bottom:12px">' + u.seg([{ v: 'covariate', label: 'Covariate: P(x)' }, { v: 'label', label: 'Label: P(y)' }, { v: 'concept', label: 'Concept: P(y|x)' }], 'covariate') + '</div>' +
      '<div class="sh-plot"></div>' +
      '<div class="sh-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Which shift breaks the model? Base R' });

    var plot = el.querySelector('.sh-plot'), read = el.querySelector('.sh-read');
    var W = 340, H = 180, PAD = 12, T = 10, Bm = 24;
    function px(x) { return PAD + (x + 4) / 8 * (W - 2 * PAD); }            // x in [-4,4]
    function bell(mu, sd, col, dash) { var pts = []; for (var x = -4; x <= 4; x += 0.1) { var d = Math.exp(-0.5 * ((x - mu) / sd) * ((x - mu) / sd)); pts.push(px(x).toFixed(1) + ',' + (H - Bm - d * (H - T - Bm)).toFixed(1)); } return '<polyline points="' + pts.join(' ') + '" fill="none" stroke="' + col + '" stroke-width="2.3"' + (dash ? ' stroke-dasharray="5 3"' : '') + '/>'; }
    function sigmoid(k, col, dash) { var pts = []; for (var x = -4; x <= 4; x += 0.1) { var s = 1 / (1 + Math.exp(-k * x)); pts.push(px(x).toFixed(1) + ',' + (H - Bm - s * (H - T - Bm)).toFixed(1)); } return '<polyline points="' + pts.join(' ') + '" fill="none" stroke="' + col + '" stroke-width="2.3"' + (dash ? ' stroke-dasharray="5 3"' : '') + '/>'; }
    function draw() {
      var body;
      if (mode === 'covariate') {
        body = bell(0, 1, P.c0) + bell(1.6, 1, P.c1, true) + sigmoid(1.5, P.faint);
      } else if (mode === 'concept') {
        body = sigmoid(1.5, P.c0) + sigmoid(-1.5, P.c1, true);
      } else { // label: two pairs of class-proportion bars
        var bw = 46, cx = W / 2;
        function bar(x, h, col) { return '<rect x="' + x + '" y="' + (H - Bm - h) + '" width="' + bw + '" height="' + h + '" fill="' + col + '" opacity="0.75"/>'; }
        body = bar(cx - 150, 0.5 * (H - T - Bm), P.c0) + bar(cx - 95, 0.5 * (H - T - Bm), P.c0) +
               bar(cx + 55, 0.25 * (H - T - Bm), P.c1) + bar(cx + 110, 0.75 * (H - T - Bm), P.c1) +
               '<text x="' + (cx - 120) + '" y="' + (H - 8) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="9.5" fill="' + P.mut + '">train 50/50</text>' +
               '<text x="' + (cx + 85) + '" y="' + (H - 8) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="9.5" fill="' + P.mut + '">test 25/75</text>';
      }
      var axisLbl = mode === 'label' ? 'class 0            class 1' : (mode === 'concept' ? 'feature x  ->  P(y=1|x)' : 'feature x');
      plot.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block;border:1px solid ' + P.line + ';border-radius:8px" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="distribution shift">' +
        body +
        '<line x1="' + PAD + '" y1="' + (H - Bm) + '" x2="' + (W - PAD) + '" y2="' + (H - Bm) + '" stroke="' + P.line + '" stroke-width="1"/>' +
        (mode !== 'label' ? '<text x="' + (W - 8) + '" y="14" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.c0 + '">train</text><text x="' + (W - 8) + '" y="28" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.c1 + '">test (dashed)</text>' : '') +
        '<text x="' + (W / 2) + '" y="' + (H - 6) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">' + axisLbl + '</text></svg>';
      read.innerHTML = mode === 'covariate'
        ? '<b>Covariate shift:</b> the feature distribution P(x) slides (test sits to the right), but the relationship P(y|x) (grey) is unchanged. A correctly specified model stays valid, accuracy need not drop.'
        : mode === 'concept'
        ? '<b>Concept shift:</b> the relationship P(y|x) itself flips, train rises with x, test falls. The model is now systematically wrong (accuracy can fall below chance). This is the dangerous one.'
        : '<b>Label shift:</b> the class base rate P(y) changes (50/50 to 25/75) while P(x|y) holds. Thresholds and calibration break even when the feature-to-label map is intact.';
    }
    u.wireSeg(el.querySelector('.sh-seg'), function (v) { mode = v; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Which kind of distribution shift actually breaks a model? Base R.',
      'set.seed(1)',
      'n <- 2000',
      'x <- rnorm(n); y <- rbinom(n, 1, plogis(1.5 * x))   # TRAIN: P(y=1|x) = plogis(1.5 x)',
      'fit <- glm(y ~ x, binomial)',
      'acc <- function(f, xx, yy) mean((predict(f, data.frame(x = xx), type = "response") > 0.5) == yy)',
      '',
      'x_cov <- rnorm(n, 1.5); y_cov <- rbinom(n, 1, plogis( 1.5 * x_cov))  # covariate: P(x) moves',
      'x_con <- rnorm(n);      y_con <- rbinom(n, 1, plogis(-1.5 * x_con))  # concept: P(y|x) flips',
      'round(c(train         = acc(fit, x, y),',
      '        covariate     = acc(fit, x_cov, y_cov),   # P(y|x) intact -> model still fine',
      '        concept       = acc(fit, x_con, y_con)),  # relationship changed -> model breaks',
      '      2)',
      '#>     train covariate   concept',
      '#>      0.72      0.86      0.25   # concept shift falls BELOW chance; covariate shift does not'
    ].join('\n');
  }

  window.LessonWidgets.register('shift-types', mount);
})();
