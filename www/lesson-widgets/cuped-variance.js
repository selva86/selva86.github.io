/* cuped-variance.js - variance reduction with pre-experiment data (CUPED), made visible.
 * If a covariate measured BEFORE the experiment (last week's spend, a pre-period metric)
 * correlates with the outcome, subtracting its predictable part shrinks the estimator's
 * variance by exactly a factor of 1 - rho^2, with zero bias. The confidence interval on the
 * treatment effect narrows for free. Toggle the pre-period correlation and watch the CI
 * collapse. Emits the same raw-vs-CUPED standard errors in base R.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  var RHOS = { weak: 0.3, moderate: 0.6, strong: 0.85 };

  function mount(el, cfg) {
    cfg = cfg || {}; var lvl = 'moderate';
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="cu-seg" style="margin-bottom:12px">' + u.seg([{ v: 'weak', label: 'Weak (rho=0.3)' }, { v: 'moderate', label: 'Moderate (0.6)' }, { v: 'strong', label: 'Strong (0.85)' }], 'moderate') + '</div>' +
      '<div class="cu-plot"></div>' +
      '<div class="cu-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'CUPED variance reduction, base R' });

    var plot = el.querySelector('.cu-plot'), read = el.querySelector('.cu-read');
    var W = 340, H = 130, CX = W / 2, RAW_HALF = 120;   // raw CI half-width in px (illustrative)
    function bar(y, half, col, lab) {
      return '<line x1="' + (CX - half) + '" y1="' + y + '" x2="' + (CX + half) + '" y2="' + y + '" stroke="' + col + '" stroke-width="3"/>' +
        '<line x1="' + (CX - half) + '" y1="' + (y - 6) + '" x2="' + (CX - half) + '" y2="' + (y + 6) + '" stroke="' + col + '" stroke-width="2"/>' +
        '<line x1="' + (CX + half) + '" y1="' + (y - 6) + '" x2="' + (CX + half) + '" y2="' + (y + 6) + '" stroke="' + col + '" stroke-width="2"/>' +
        '<circle cx="' + CX + '" cy="' + y + '" r="3.5" fill="' + col + '"/>' +
        '<text x="8" y="' + (y - 10) + '" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + col + '">' + lab + '</text>';
    }
    function draw() {
      var rho = RHOS[lvl], factor = Math.sqrt(1 - rho * rho), cupHalf = RAW_HALF * factor;
      var reduct = Math.round(rho * rho * 100);
      plot.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block;border:1px solid ' + P.line + ';border-radius:8px" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="CUPED confidence interval shrink">' +
        '<line x1="' + CX + '" y1="18" x2="' + CX + '" y2="' + (H - 10) + '" stroke="' + P.line2 + '" stroke-width="1" stroke-dasharray="2 3"/>' +
        bar(46, RAW_HALF, P.mut, 'raw 95% CI') +
        bar(96, cupHalf, P.c0, 'CUPED 95% CI') +
        '</svg>';
      read.innerHTML = 'A pre-period covariate correlated <b>' + rho + '</b> with the outcome shrinks the estimator variance by <b>1 &minus; ' + rho + '&sup2; = ' + (1 - rho * rho).toFixed(2) + '</b>, so the CI narrows by a factor of <b style="color:' + P.c0 + '">' + factor.toFixed(2) + '</b> (a <b>' + reduct + '%</b> variance cut) with no bias. ' +
        (lvl === 'weak' ? 'A weak pre-period signal barely helps.' : lvl === 'strong' ? 'A strong pre-period signal is like running the experiment on a much larger sample, for free.' : 'Equivalent to collecting ' + Math.round(1 / (1 - rho * rho)) + 'x the sample at no extra cost.');
    }
    u.wireSeg(el.querySelector('.cu-seg'), function (v) { lvl = v; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# CUPED: use a pre-experiment covariate to shrink the variance of an A/B estimate. Base R.',
      'set.seed(1)',
      'n   <- 4000',
      'pre <- rnorm(n)                                  # a metric measured BEFORE the test',
      'rho <- 0.6                                       # its correlation with the outcome',
      'y   <- rho * pre + sqrt(1 - rho^2) * rnorm(n)    # outcome, partly predicted by pre',
      'arm <- rep(0:1, each = n / 2)',
      'y   <- y + 0.05 * arm                            # a true treatment lift of 0.05',
      '',
      'g <- n / 2',
      'raw_se <- sqrt(var(y[arm == 1]) / g + var(y[arm == 0]) / g)   # ordinary difference in means',
      '',
      'theta <- cov(y, pre) / var(pre)                  # CUPED: regress out the pre-covariate',
      'yc    <- y - theta * (pre - mean(pre))',
      'cuped_se <- sqrt(var(yc[arm == 1]) / g + var(yc[arm == 0]) / g)',
      '',
      'round(c(raw_se = raw_se, cuped_se = cuped_se,',
      '        ratio = cuped_se / raw_se, predicted = sqrt(1 - rho^2)), 3)',
      '# the SE ratio lands right on sqrt(1 - rho^2): a real variance cut, no bias.'
    ].join('\n');
  }

  window.LessonWidgets.register('cuped-variance', mount);
})();
