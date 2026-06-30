/* data-split.js - train / validation / test, and why leakage lies.
 * A row strip splits into train, validation, test. Flip the "leak a feature"
 * switch: a column secretly built from the answer sneaks in, and the test score
 * jumps to a too-good-to-be-true number - the single most common ML mistake.
 * Emits runnable R that does an honest split AND demonstrates the leak.
 *
 * cfg: { }  - renders from {}.
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  function mount(el, cfg) {
    cfg = cfg || {};
    var N = 20, nTrain = 12, nVal = 4;       // 60 / 20 / 20
    var leak = false;

    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="ds-strip"></div>' +
      '<div style="display:flex;align-items:center;gap:18px;flex-wrap:wrap;margin:14px 0 0">' +
        '<label style="display:inline-flex;align-items:center;gap:8px;font:600 13px/1 IBM Plex Sans,sans-serif;color:' + P.body + ';cursor:pointer">' +
          '<input class="ds-leak" type="checkbox"> Leak a feature built from the answer</label>' +
      '</div>' +
      '<div class="ds-read" style="font:13px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:11px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Split honestly - then watch a leak inflate the score - in R' });

    var strip = el.querySelector('.ds-strip'), read = el.querySelector('.ds-read');

    function draw() {
      var cells = '';
      for (var i = 0; i < N; i++) {
        var role = i < nTrain ? ['train', P.acc] : i < nTrain + nVal ? ['val', P.c0] : ['test', P.c1];
        cells += '<div title="' + role[0] + '" style="flex:1;height:30px;background:' + role[1] + ';opacity:.85;border-radius:3px"></div>';
      }
      var leakCol = leak ? '<div style="margin:9px 0 0"><div style="font:600 11px/1.4 IBM Plex Mono,monospace;color:' + P.bad + '">+ leaked column (a near-copy of y)</div>' +
        '<div style="display:flex;gap:3px;margin:4px 0 0">' + Array.apply(null, Array(N)).map(function () { return '<div style="flex:1;height:16px;background:' + P.bad + ';opacity:.55;border-radius:3px"></div>'; }).join('') + '</div></div>' : '';
      strip.innerHTML =
        '<div style="display:flex;gap:3px">' + cells + '</div>' +
        '<div style="display:flex;justify-content:space-between;font:600 10px/1.6 IBM Plex Mono,monospace;letter-spacing:.04em;text-transform:uppercase;color:' + P.faint + ';margin:5px 0 0">' +
          '<span style="color:' + P.acc + '">&#9632; train 60%</span><span style="color:' + P.c0 + '">&#9632; validation 20%</span><span style="color:' + P.c1 + '">&#9632; test 20%</span></div>' + leakCol;

      read.innerHTML = leak
        ? '<b style="color:' + P.bad + '">Test accuracy 0.99 - too good to be true.</b> The leaked column is basically the answer, so the model "predicts" by copying it. On truly new data with no such column, it collapses. Leakage = any information at training time you would not have at prediction time. Split FIRST, engineer features INSIDE the training fold only.'
        : '<b style="color:' + P.acc + '">Honest test accuracy 0.78.</b> Fit on train, tune on validation, and touch test exactly once at the end. The test set stands in for the future: the moment it influences a choice, its score stops being trustworthy.';
    }

    el.querySelector('.ds-leak').addEventListener('change', function (e) { leak = e.target.checked; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# An honest split, then a demonstration of leakage.',
      'set.seed(1)',
      'n  <- 200',
      'df <- data.frame(x = rnorm(n), y = rbinom(n, 1, 0.5))',
      '',
      'idx   <- sample(n, 0.7 * n)        # 70% to train, the rest to test',
      'train <- df[idx, ]; test <- df[-idx, ]',
      'c(train = nrow(train), test = nrow(test))',
      '',
      '# LEAKAGE: a feature secretly built from the answer y',
      'df$leak <- df$y + rnorm(n, 0, 0.01)          # "leak" basically IS y',
      'fit  <- glm(y ~ leak, family = binomial, data = df[idx, ])',
      'pred <- predict(fit, df[-idx, ], type = "response") > 0.5',
      'mean(pred == df$y[-idx])                      # ~1.00 - the tell-tale sign of a leak'
    ].join('\n');
  }

  window.LessonWidgets.register('data-split', mount);
})();
