/* adversarial-perturb.js - adversarial robustness, made visible. A classifier can be confidently
 * right on a point and then confidently WRONG after a perturbation too small to see, because a
 * step along the gradient (the sign of the weights, the FGSM attack) walks the input straight
 * across the decision boundary. Toggle the perturbation budget from none to small and watch a
 * class-1 point flip to class 0 while barely moving. Emits the same logistic-model attack in base R.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  var EPS = { none: 0, small: 0.5, large: 0.9 };
  var W1 = 2.5, W2 = 2.5;                 // model weights (boundary x1 + x2 = 0)
  var PT = { x1: 0.35, x2: 0.30 };        // the input under attack (class 1)
  function prob(x1, x2) { return 1 / (1 + Math.exp(-(W1 * x1 + W2 * x2))); }

  function mount(el, cfg) {
    cfg = cfg || {}; var lvl = 'none';
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="ad-seg" style="margin-bottom:12px">' + u.seg([{ v: 'none', label: 'Original' }, { v: 'small', label: '+ tiny perturbation' }, { v: 'large', label: '+ larger' }], 'none') + '</div>' +
      '<div class="ad-plot"></div>' +
      '<div class="ad-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'An adversarial (FGSM) perturbation flips a logistic prediction, base R' });

    var plot = el.querySelector('.ad-plot'), read = el.querySelector('.ad-read');
    var W = 300, H = 200, PAD = 16, LO = -1.6, HI = 1.6;
    function px(x) { return PAD + (x - LO) / (HI - LO) * (W - 2 * PAD); }
    function py(y) { return (H - PAD) - (y - LO) / (HI - LO) * (H - 2 * PAD); }
    function draw() {
      var eps = EPS[lvl];
      var ax1 = PT.x1 - eps, ax2 = PT.x2 - eps;              // FGSM: step against sign(w) = -eps each
      var p0 = prob(PT.x1, PT.x2), p1 = prob(ax1, ax2);
      // decision boundary x1 + x2 = 0 -> line from (-1.6,1.6) to (1.6,-1.6)
      var bx1 = px(LO), by1 = py(-LO), bx2 = px(HI), by2 = py(-HI);
      var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block;border:1px solid ' + P.line + ';border-radius:8px" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="adversarial perturbation">';
      // class regions (above-right = class 1)
      svg += '<polygon points="' + px(HI) + ',' + py(HI) + ' ' + bx1 + ',' + by1 + ' ' + bx2 + ',' + by2 + '" fill="' + P.c0 + '" opacity="0.07"/>';
      svg += '<polygon points="' + px(LO) + ',' + py(LO) + ' ' + bx1 + ',' + by1 + ' ' + bx2 + ',' + by2 + '" fill="' + P.bad + '" opacity="0.07"/>';
      svg += '<line x1="' + bx1.toFixed(1) + '" y1="' + by1.toFixed(1) + '" x2="' + bx2.toFixed(1) + '" y2="' + by2.toFixed(1) + '" stroke="' + P.mut + '" stroke-width="1.5" stroke-dasharray="4 3"/>';
      svg += '<text x="' + (px(1.1)) + '" y="' + (py(1.35)) + '" font-family="IBM Plex Sans,sans-serif" font-size="9.5" fill="' + P.c0 + '">class 1</text>';
      svg += '<text x="' + (px(-1.5)) + '" y="' + (py(-1.2)) + '" font-family="IBM Plex Sans,sans-serif" font-size="9.5" fill="' + P.bad + '">class 0</text>';
      // original point + arrow to adversarial point
      svg += '<circle cx="' + px(PT.x1).toFixed(1) + '" cy="' + py(PT.x2).toFixed(1) + '" r="4" fill="' + P.c0 + '"/>';
      if (eps > 0) {
        svg += '<line x1="' + px(PT.x1).toFixed(1) + '" y1="' + py(PT.x2).toFixed(1) + '" x2="' + px(ax1).toFixed(1) + '" y2="' + py(ax2).toFixed(1) + '" stroke="' + P.ink + '" stroke-width="1.5"/>';
        svg += '<circle cx="' + px(ax1).toFixed(1) + '" cy="' + py(ax2).toFixed(1) + '" r="4" fill="' + (p1 > 0.5 ? P.c0 : P.bad) + '"/>';
      }
      svg += '<text x="' + (W / 2) + '" y="' + (H - 4) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="9.5" fill="' + P.mut + '">feature space (attack steps toward the boundary)</text></svg>';
      plot.innerHTML = svg;
      read.innerHTML = eps === 0
        ? 'The input sits in <b style="color:' + P.c0 + '">class 1</b> with probability <b>' + p0.toFixed(2) + '</b>, confidently correct.'
        : 'A perturbation of just <b>' + eps + '</b> per feature ' + (p1 > 0.5 ? 'moves the point toward the boundary (prob ' + p1.toFixed(2) + '), still class 1.' : 'pushes it <b>across the boundary</b>: prediction flips to <b style="color:' + P.bad + '">class 0</b> at probability <b>' + p1.toFixed(2) + '</b>, confidently WRONG, from a nudge you can barely see.');
    }
    u.wireSeg(el.querySelector('.ad-seg'), function (v) { lvl = v; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Adversarial example: a tiny perturbation flips a confident logistic prediction. Base R.',
      'set.seed(3)',
      'n <- 800; X <- matrix(rnorm(n * 2), n, 2); colnames(X) <- c("x1", "x2")',
      'y <- rbinom(n, 1, plogis(2.5 * X[, 1] + 2.5 * X[, 2]))',
      'fit <- glm(y ~ x1 + x2, binomial, data = data.frame(y, X))',
      'w <- coef(fit)[c("x1", "x2")]',
      '',
      'pt  <- data.frame(x1 = 0.35, x2 = 0.30)          # confidently classified as class 1',
      'eps <- 0.5                                       # a tiny per-feature budget',
      'adv <- data.frame(x1 = pt$x1 - eps * sign(w["x1"]),   # FGSM: step against the gradient',
      '                  x2 = pt$x2 - eps * sign(w["x2"]))',
      'round(c(orig_prob = predict(fit, pt,  type = "response"),',
      '        adv_prob  = predict(fit, adv, type = "response"),',
      '        Linf_perturb = eps), 3)',
      '#> orig_prob  adv_prob Linf_perturb',
      '#>     0.858     0.318        0.500   # prediction flips 1 -> 0'
    ].join('\n');
  }

  window.LessonWidgets.register('adversarial-perturb', mount);
})();
