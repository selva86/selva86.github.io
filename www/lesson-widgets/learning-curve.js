/* learning-curve.js - early stopping.
 * As boosting rounds pile up, training error keeps falling but validation error
 * bottoms out then climbs (overfitting). Slide where you STOP: too early leaves
 * signal on the table, too late overfits, the sweet spot is the validation min.
 * Emits runnable R that boosts while tracking train + validation RMSE per round.
 *
 * cfg: { rounds:40 }  - optional.
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  function mount(el, cfg) {
    cfg = cfg || {};
    var R = Math.max(10, +cfg.rounds || 40);
    function train(r) { return 0.16 + 1.5 / (0.5 * r + 1); }
    function valid(r) { return 0.30 + 1.35 / (0.5 * r + 1) + 0.0135 * r; }
    var DS = []; for (var r = 1; r <= R; r++) DS.push({ r: r, train: train(r), valid: valid(r) });
    var best = DS.reduce(function (b, d) { return d.valid < b.valid ? d : b; }, DS[0]).r;
    var stop = Math.round(best * 0.5);                 // start stopped too early

    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="lcv-chart"></div>' +
      '<label style="display:block;font:600 12.5px/1.6 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:12px 0 2px">stop after round <b class="lcv-n" style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '"></b>' +
        '<input class="lcv-s" type="range" min="1" max="' + R + '" step="1" value="' + stop + '" style="width:100%;accent-color:' + P.acc + '"></label>' +
      '<div class="lcv-read" style="font:13px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:8px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Track train vs validation per round in R' });

    var chart = el.querySelector('.lcv-chart'), read = el.querySelector('.lcv-read'),
        slider = el.querySelector('.lcv-s'), nEl = el.querySelector('.lcv-n');

    function draw() {
      var W = 480, H = 250, m = { t: 14, r: 14, b: 34, l: 44 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
      var ymax = Math.max.apply(null, DS.map(function (d) { return d.valid; })) * 1.06, ymin = Math.min.apply(null, DS.map(function (d) { return d.train; })) * 0.9;
      function sx(rr) { return m.l + (rr - 1) / (R - 1) * iw; } function sy(v) { return m.t + ih - (v - ymin) / (ymax - ymin) * ih; }
      function pl(key, col) { return '<polyline points="' + DS.map(function (d) { return sx(d.r).toFixed(1) + ',' + sy(d[key]).toFixed(1); }).join(' ') + '" fill="none" stroke="' + col + '" stroke-width="2.5"/>'; }
      var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="learning curve"><line x1="' + m.l + '" y1="' + (m.t + ih) + '" x2="' + (m.l + iw) + '" y2="' + (m.t + ih) + '" stroke="' + P.line + '" stroke-width="1.5"/><line x1="' + m.l + '" y1="' + m.t + '" x2="' + m.l + '" y2="' + (m.t + ih) + '" stroke="' + P.line + '" stroke-width="1.5"/>';
      svg += '<line x1="' + sx(best).toFixed(1) + '" y1="' + m.t + '" x2="' + sx(best).toFixed(1) + '" y2="' + (m.t + ih) + '" stroke="' + P.line + '" stroke-dasharray="3 3"/><text x="' + sx(best).toFixed(1) + '" y="' + (m.t + 9) + '" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="9" fill="' + P.faint + '">best</text>';
      svg += pl('valid', P.c1) + pl('train', P.acc);
      svg += '<line x1="' + sx(stop).toFixed(1) + '" y1="' + m.t + '" x2="' + sx(stop).toFixed(1) + '" y2="' + (m.t + ih) + '" stroke="' + P.ink + '" stroke-width="2"/>';
      svg += '<circle cx="' + sx(stop).toFixed(1) + '" cy="' + sy(DS[stop - 1].valid).toFixed(1) + '" r="5" fill="' + P.c1 + '"/><circle cx="' + sx(stop).toFixed(1) + '" cy="' + sy(DS[stop - 1].train).toFixed(1) + '" r="5" fill="' + P.acc + '"/>';
      svg += '<rect x="' + (m.l + 8) + '" y="' + (m.t + 4) + '" width="10" height="10" rx="2" fill="' + P.c1 + '"/><text x="' + (m.l + 22) + '" y="' + (m.t + 13) + '" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.body + '">validation</text><rect x="' + (m.l + 86) + '" y="' + (m.t + 4) + '" width="10" height="10" rx="2" fill="' + P.acc + '"/><text x="' + (m.l + 100) + '" y="' + (m.t + 13) + '" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.body + '">train</text>';
      svg += '<text x="' + (m.l + iw / 2) + '" y="' + (H - 5) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="11" fill="' + P.mut + '">boosting rounds &rarr;</text></svg>';
      chart.innerHTML = svg;

      var s = stop < best - 1 ? ['Stopped too early.', P.c0, 'Validation error is still falling - the model has more signal to learn. Let it run longer.']
        : stop > best + 2 ? ['Stopped too late.', P.bad, 'Past the validation minimum, training error keeps dropping but validation creeps up - that gap is memorized noise. Overfitting.']
        : ['Right around the sweet spot.', P.acc, 'You stopped near the validation minimum: the most signal, the least overfit. This is what early stopping automates.'];
      read.innerHTML = '<b style="color:' + s[1] + '">' + s[0] + '</b> ' + s[2] + ' <b style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '">train ' + DS[stop - 1].train.toFixed(2) + ' &middot; valid ' + DS[stop - 1].valid.toFixed(2) + '</b>';
      nEl.textContent = stop;
    }
    slider.addEventListener('input', function () { stop = +slider.value; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Early stopping: boost while watching BOTH errors. Train keeps falling;',
      '# validation bottoms out then rises. Stop at the validation minimum.',
      'library(rpart)',
      'set.seed(1)',
      'n <- 160; x <- sort(runif(n, 0, 10)); y <- sin(x) + 0.18 * x + rnorm(n, 0, 0.4)',
      'tr <- 1:110; te <- 111:n',
      'pred <- rep(mean(y[tr]), n); lr <- 0.3',
      'tr_err <- va_err <- numeric(40)',
      'for (m in 1:40) {',
      '  st   <- rpart(r ~ x, data = data.frame(x = x[tr], r = y[tr] - pred[tr]),',
      '                control = rpart.control(maxdepth = 1, cp = 0))',
      '  pred <- pred + lr * predict(st, data.frame(x = x))',
      '  tr_err[m] <- sqrt(mean((y[tr] - pred[tr])^2))',
      '  va_err[m] <- sqrt(mean((y[te] - pred[te])^2))',
      '}',
      'plot(va_err, type = "l", col = "darkorange", lwd = 2, ylim = range(tr_err, va_err),',
      '     xlab = "round", ylab = "RMSE"); lines(tr_err, col = "forestgreen", lwd = 2)',
      'which.min(va_err)            # stop here'
    ].join('\n');
  }

  window.LessonWidgets.register('learning-curve', mount);
})();
