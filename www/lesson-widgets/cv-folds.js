/* cv-folds.js - k-fold cross-validation, rotating.
 * The data splits into k folds. Step through them: each fold takes a turn as the
 * validation set while the rest train, giving k scores whose average is a far more
 * honest estimate than one lucky split. Emits runnable R that does k-fold CV by hand.
 *
 * cfg: { k:5 }  - optional.
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  // deterministic per-fold scores (one per fold, up to 10), reused per k
  var SC = [0.94, 1.08, 0.86, 1.15, 0.97, 1.03, 0.9, 1.11, 0.99, 0.92];

  function mount(el, cfg) {
    cfg = cfg || {};
    var k = [4, 5, 10].indexOf(+cfg.k) >= 0 ? +cfg.k : 5, cur = 1, N = 20;

    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="cv-seg" style="margin:0 0 12px">' + u.seg([{ v: '4', label: '4 folds' }, { v: '5', label: '5 folds' }, { v: '10', label: '10 folds' }], String(k)) + '</div>' +
      '<div class="cv-strip"></div>' +
      '<div style="display:flex;align-items:center;gap:9px;margin:12px 0 0">' +
        '<button class="cv-prev" type="button" style="font:inherit;font-size:12.5px;font-weight:600;color:' + P.mut + ';background:none;border:1px solid ' + P.line + ';border-radius:8px;padding:8px 12px;cursor:pointer">&larr; Prev fold</button>' +
        '<button class="cv-next" type="button" style="font:inherit;font-size:12.5px;font-weight:600;color:#fff;background:' + P.acc + ';border:0;border-radius:8px;padding:8px 14px;cursor:pointer">Next fold &rarr;</button>' +
        '<span class="cv-pos" style="font:600 12.5px/1 IBM Plex Mono,monospace;color:' + P.body + '"></span>' +
      '</div>' +
      '<div class="cv-scores" style="display:flex;gap:5px;flex-wrap:wrap;margin:13px 0 0"></div>' +
      '<div class="cv-read" style="font:13px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Run k-fold cross-validation in R' });

    var strip = el.querySelector('.cv-strip'), scores = el.querySelector('.cv-scores'),
        read = el.querySelector('.cv-read'), pos = el.querySelector('.cv-pos');

    function foldOf(i) { return Math.floor(i * k / N) + 1; }    // contiguous blocks (random in the R)
    function draw() {
      var cells = '';
      for (var i = 0; i < N; i++) { var isVal = foldOf(i) === cur; cells += '<div title="fold ' + foldOf(i) + (isVal ? ' (validation)' : ' (train)') + '" style="flex:1;height:30px;border-radius:3px;background:' + (isVal ? P.c1 : P.acc) + ';opacity:' + (isVal ? 0.92 : 0.5) + '"></div>'; }
      strip.innerHTML = '<div style="display:flex;gap:3px">' + cells + '</div>' +
        '<div style="display:flex;justify-content:space-between;font:600 10px/1.6 IBM Plex Mono,monospace;letter-spacing:.04em;text-transform:uppercase;color:' + P.faint + ';margin:5px 0 0"><span style="color:' + P.c1 + '">&#9632; validation fold</span><span style="color:' + P.acc + '">&#9632; training folds</span></div>';

      var used = SC.slice(0, k), mean = used.reduce(function (a, b) { return a + b; }, 0) / k;
      scores.innerHTML = used.map(function (s, i) { var on = (i + 1) === cur; return '<span style="font:600 12px/1 IBM Plex Mono,monospace;padding:6px 9px;border-radius:7px;background:' + (on ? P.c1 : P.bg) + ';color:' + (on ? '#fff' : P.body) + '">f' + (i + 1) + ' ' + s.toFixed(2) + '</span>'; }).join('') +
        '<span style="font:700 12px/1 IBM Plex Mono,monospace;padding:6px 9px;border-radius:7px;background:' + P.ink + ';color:#fff">CV mean ' + mean.toFixed(3) + '</span>';
      pos.textContent = 'fold ' + cur + ' of ' + k;
      read.innerHTML = 'Fold <b>' + cur + '</b> is held out for validation; the other ' + (k - 1) + ' folds train the model, giving score <b style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '">' + used[cur - 1].toFixed(2) +
        '</b>. Every point validates exactly once. The <b>average of all ' + k + '</b> is the cross-validated error - steadier and less luck-dependent than any single split. More folds = less bias, more compute.';
    }
    u.wireSeg(el.querySelector('.cv-seg'), function (v) { k = +v; cur = 1; draw(); });
    el.querySelector('.cv-next').addEventListener('click', function () { cur = cur % k + 1; draw(); });
    el.querySelector('.cv-prev').addEventListener('click', function () { cur = (cur - 2 + k) % k + 1; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# k-fold cross-validation by hand: each fold takes a turn as the holdout.',
      'set.seed(1)',
      'n  <- 100',
      'df <- data.frame(x = rnorm(n)); df$y <- 2 * df$x + rnorm(n)',
      '',
      'k    <- 5',
      'fold <- sample(rep(1:k, length.out = n))     # random fold labels',
      'rmse <- numeric(k)',
      'for (f in 1:k) {',
      '  tr <- df[fold != f, ]; va <- df[fold == f, ]',
      '  fit     <- lm(y ~ x, data = tr)',
      '  rmse[f] <- sqrt(mean((va$y - predict(fit, va))^2))',
      '}',
      'rmse            # one score per fold',
      'mean(rmse)      # the cross-validated error'
    ].join('\n');
  }

  window.LessonWidgets.register('cv-folds', mount);
})();
