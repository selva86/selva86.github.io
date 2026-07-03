/* worst-group.js - worst-group accuracy and distributionally robust optimization, made visible.
 * A model trained to minimize AVERAGE loss (ERM) can post a high headline accuracy while quietly
 * failing a minority group, when a spurious feature that helps the majority points the wrong way
 * for the minority. Reweighting to protect the worst group (a simple DRO) trades a little average
 * accuracy for a large gain on the group that was failing. Toggle ERM vs DRO and watch the worst
 * bar rise. Emits the same ERM-vs-reweighted comparison in base R.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  var DATA = {
    erm: { A: 0.96, B: 0.11, worst: 0.11, avg: 0.88 },
    dro: { A: 0.71, B: 0.66, worst: 0.66, avg: 0.70 }
  };
  var BARS = [{ k: 'A', label: 'group A (majority)' }, { k: 'B', label: 'group B (minority)' }, { k: 'worst', label: 'worst group' }, { k: 'avg', label: 'average' }];

  function mount(el, cfg) {
    cfg = cfg || {}; var method = 'erm';
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="wg-seg" style="margin-bottom:12px">' + u.seg([{ v: 'erm', label: 'ERM (average loss)' }, { v: 'dro', label: 'DRO (worst group)' }], 'erm') + '</div>' +
      '<div class="wg-plot"></div>' +
      '<div class="wg-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'ERM vs group-reweighted DRO: worst-group accuracy, base R' });

    var plot = el.querySelector('.wg-plot'), read = el.querySelector('.wg-read');
    var W = 340, H = 190, PADL = 10, PADR = 10, T = 14, Bm = 40;
    function draw() {
      var d = DATA[method], n = BARS.length, gap = (W - PADL - PADR) / n, bw = gap * 0.55;
      var bars = BARS.map(function (b, i) {
        var v = d[b.k], x = PADL + i * gap + (gap - bw) / 2, h = v * (H - T - Bm);
        var col = b.k === 'worst' ? P.bad : (b.k === 'avg' ? P.mut : P.c0);
        return '<rect x="' + x.toFixed(1) + '" y="' + (H - Bm - h).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + h.toFixed(1) + '" fill="' + col + '" opacity="0.8"/>' +
          '<text x="' + (x + bw / 2).toFixed(1) + '" y="' + (H - Bm - h - 4).toFixed(1) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="11" font-weight="600" fill="' + col + '">' + v.toFixed(2) + '</text>' +
          '<text x="' + (x + bw / 2).toFixed(1) + '" y="' + (H - Bm + 13).toFixed(1) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="8.5" fill="' + P.mut + '">' + b.k + '</text>';
      }).join('');
      plot.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block;border:1px solid ' + P.line + ';border-radius:8px" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="worst-group accuracy">' +
        '<line x1="' + PADL + '" y1="' + (H - Bm) + '" x2="' + (W - PADR) + '" y2="' + (H - Bm) + '" stroke="' + P.line + '" stroke-width="1"/>' +
        bars +
        '<text x="' + PADL + '" y="' + (H - 6) + '" font-family="IBM Plex Sans,sans-serif" font-size="9" fill="' + P.mut + '">accuracy per group (A majority, B minority)</text></svg>';
      read.innerHTML = method === 'erm'
        ? '<b>ERM</b> minimizes average loss and posts a healthy <b>0.88</b> overall, but group B (the minority, where a spurious feature reverses) sits at <b style="color:' + P.bad + '">0.11</b>, worse than a coin flip. The average hid a group in freefall.'
        : '<b>DRO</b> upweights the failing group, lifting the worst group from 0.11 to <b style="color:' + P.acc + '">0.66</b>. Average accuracy drops from 0.88 to 0.70: the deliberate price of protecting the worst-off group.';
    }
    u.wireSeg(el.querySelector('.wg-seg'), function (v) { method = v; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Worst-group accuracy: ERM can pass on average and fail a minority group. Base R.',
      'set.seed(4)',
      'n <- 3000',
      'grp  <- ifelse(runif(n) < 0.9, "A", "B")            # A majority 90%, B minority 10%',
      'core <- rnorm(n); y <- rbinom(n, 1, plogis(1.2 * core))       # the TRUE signal',
      'spur <- ifelse(grp == "A", 2*y - 1, 1 - 2*y) + rnorm(n, 0, 0.5)  # spurious: reversed for B',
      'd <- data.frame(y, core, spur, grp)',
      'gacc <- function(fit) { p <- predict(fit, d, type = "response") > 0.5',
      '  aA <- mean(p[grp=="A"]==y[grp=="A"]); aB <- mean(p[grp=="B"]==y[grp=="B"])',
      '  c(A = aA, B = aB, worst = min(aA, aB), avg = mean(p == y)) }',
      '',
      'erm <- glm(y ~ core + spur, binomial, data = d)                 # minimize AVERAGE loss',
      'dro <- glm(y ~ core + spur, binomial, data = d,',
      '           weights = ifelse(grp == "B", 9, 1))                  # upweight the minority (DRO)',
      'round(rbind(ERM = gacc(erm), DRO = gacc(dro)), 2)',
      '#>        A    B worst  avg',
      '#> ERM 0.96 0.11  0.11 0.88   # great average, minority in freefall',
      '#> DRO 0.71 0.66  0.66 0.70   # worst group rescued, small average cost'
    ].join('\n');
  }

  window.LessonWidgets.register('worst-group', mount);
})();
