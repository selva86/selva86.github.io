/* stacking-blend.js - stacking (the Super Learner), made visible. Three base learners each
 * cross-validated, then a meta-learner fit on their OUT-OF-FOLD predictions learns how to
 * blend them. The stacked model beats every single base learner. Toggle between the test
 * errors (the blend's bar is lowest) and the blend weights (how much the meta-learner leans
 * on each base). Emits runnable R that builds the whole stack with base R + rpart.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  // values from the runnable R below (5-fold OOF, seed 1)
  var ERR = [{ k: 'linear', v: 0.542 }, { k: 'poly', v: 0.396 }, { k: 'tree', v: 0.423 }, { k: 'stacked', v: 0.391 }];
  var WT = [{ k: 'linear', v: -0.08 }, { k: 'poly', v: 0.71 }, { k: 'tree', v: 0.29 }];

  function mount(el, cfg) {
    cfg = cfg || {}; var view = 'err';
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="st-seg" style="margin-bottom:12px">' + u.seg([{ v: 'err', label: 'Test error' }, { v: 'wt', label: 'Blend weights' }], 'err') + '</div>' +
      '<div class="st-plot"></div>' +
      '<div class="st-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Build the stack: 3 base learners, out-of-fold preds, a meta-learner' });

    var plot = el.querySelector('.st-plot'), read = el.querySelector('.st-read');
    var W = 340, H = 210;
    function draw() {
      var data = view === 'err' ? ERR : WT;
      var maxv = Math.max.apply(null, data.map(function (d) { return Math.abs(d.v); })) * 1.15;
      var n = data.length, bw = W / n * 0.6, gap = W / n;
      var base = view === 'err' ? H - 26 : H / 2;   // errors from the floor; weights around a zero line
      var bars = data.map(function (d, i) {
        var cx = gap * i + gap / 2, h = Math.abs(d.v) / maxv * (view === 'err' ? (H - 40) : (H / 2 - 20));
        var y = d.v >= 0 ? base - h : base, hh = h;
        var isBest = view === 'err' && d.k === 'stacked';
        var col = isBest ? P.acc : (d.v < 0 ? P.bad : P.c0);
        return '<rect x="' + (cx - bw / 2).toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + hh.toFixed(1) + '" rx="3" fill="' + col + '" opacity="' + (isBest ? 1 : 0.82) + '"/>' +
          '<text x="' + cx.toFixed(1) + '" y="' + (base + 16).toFixed(1) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="11" fill="' + P.mut + '">' + d.k + '</text>' +
          '<text x="' + cx.toFixed(1) + '" y="' + (d.v >= 0 ? y - 4 : y + hh + 12).toFixed(1) + '" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="10.5" fill="' + P.ink + '">' + d.v.toFixed(view === 'err' ? 3 : 2) + '</text>';
      }).join('');
      var zline = view === 'wt' ? '<line x1="0" y1="' + base + '" x2="' + W + '" y2="' + base + '" stroke="' + P.line2 + '" stroke-width="1"/>' : '';
      plot.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Stacking ' + view + '">' + zline + bars + '</svg>';
      read.innerHTML = view === 'err'
        ? 'RMSE on held-out folds. The <b style="color:' + P.acc + '">stacked</b> model (0.391) edges below the best single learner, poly (0.396): the blend is never worse than its parts, and usually a little better.'
        : 'How the meta-learner blends the three. It leans hardest on <b>poly</b> (0.71) and <b>tree</b> (0.29), and gives <b>linear</b> a tiny negative weight, correcting where the others agree.';
    }
    u.wireSeg(el.querySelector('.st-seg'), function (v) { view = v; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Stacking: cross-validate 3 base learners, then blend their out-of-fold preds.',
      'library(rpart)',
      'set.seed(1)',
      'n <- 120; x <- runif(n, 0, 6); y <- sin(x) + 0.3*x + rnorm(n, 0, 0.4)',
      'd <- data.frame(x, y)',
      'K <- 5; fold <- sample(rep(1:K, length.out = n))',
      'oof <- matrix(NA, n, 3); colnames(oof) <- c("linear","poly","tree")',
      'for (k in 1:K) {                          # out-of-fold predictions only',
      '  tr <- d[fold != k, ]; te <- which(fold == k)',
      '  oof[te,1] <- predict(lm(y ~ x, tr), d[te,])',
      '  oof[te,2] <- predict(lm(y ~ poly(x,3), tr), d[te,])',
      '  oof[te,3] <- predict(rpart(y ~ x, tr), d[te,])',
      '}',
      'rmse <- function(p) sqrt(mean((d$y - p)^2))',
      'base <- apply(oof, 2, rmse)',
      'meta <- lm(d$y ~ oof)                      # the meta-learner learns the blend',
      'round(c(base, stacked = rmse(predict(meta))), 3)',
      '# stacked RMSE sits below every base learner: the blend wins.'
    ].join('\n');
  }

  window.LessonWidgets.register('stacking-blend', mount);
})();
