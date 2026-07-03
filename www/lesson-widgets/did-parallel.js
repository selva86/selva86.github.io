/* did-parallel.js - difference-in-differences geometry, made visible. Two groups measured
 * before and after a policy: the treated line and the control line. Under PARALLEL TRENDS,
 * the control group's pre-to-post change is what the treated group WOULD have done without
 * treatment, so the dashed counterfactual runs parallel to control. The DiD estimate is the
 * gap between the treated group's actual post value and that counterfactual, a double
 * difference that a naive post-only comparison gets wrong whenever the groups started at
 * different levels. Toggle Naive vs DiD and read the gap. Emits lm(y ~ treat*post) in base R.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  // clean illustrative values (the runnable R shows the noisy-data version)
  var cPre = 20, cPost = 26, tPre = 18, tPost = 30;      // control +6, treated +12
  var cf = tPre + (cPost - cPre);                         // counterfactual: 18 + 6 = 24
  var did = tPost - cf;                                   // 30 - 24 = 6 (true effect)
  var naive = tPost - cPost;                              // 30 - 26 = 4 (biased)

  function mount(el, cfg) {
    cfg = cfg || {}; var mode = 'did';
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="dd-seg" style="margin-bottom:12px">' + u.seg([{ v: 'naive', label: 'Naive (post only)' }, { v: 'did', label: 'Difference-in-differences' }], 'did') + '</div>' +
      '<div class="dd-plot"></div>' +
      '<div class="dd-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Difference-in-differences with lm(y ~ treat*post), base R' });

    var plot = el.querySelector('.dd-plot'), read = el.querySelector('.dd-read');
    var W = 340, H = 200, L = 34, R = 90, T = 16, B = 26;
    var xPre = L, xPost = W - R, ymin = 14, ymax = 34;
    function py(v) { return T + (ymax - v) / (ymax - ymin) * (H - T - B); }
    function line(x1, y1, x2, y2, col, dash, wid) { return '<line x1="' + x1 + '" y1="' + py(y1).toFixed(1) + '" x2="' + x2 + '" y2="' + py(y2).toFixed(1) + '" stroke="' + col + '" stroke-width="' + (wid || 2.5) + '"' + (dash ? ' stroke-dasharray="4 3"' : '') + '/>'; }
    function dot(x, v, col) { return '<circle cx="' + x + '" cy="' + py(v).toFixed(1) + '" r="3.5" fill="' + col + '"/>'; }
    function draw() {
      var gapX = mode === 'did' ? xPost + 14 : xPost + 14;
      var top = mode === 'did' ? tPost : tPost, bot = mode === 'did' ? cf : cPost;
      var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block;border:1px solid ' + P.line + ';border-radius:8px" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="difference in differences">';
      // control (orange), treated (blue), counterfactual (dashed blue)
      svg += line(xPre, cPre, xPost, cPost, P.c1) + dot(xPre, cPre, P.c1) + dot(xPost, cPost, P.c1);
      svg += line(xPre, tPre, xPost, tPost, P.c0) + dot(xPre, tPre, P.c0) + dot(xPost, tPost, P.c0);
      if (mode === 'did') svg += line(xPre, tPre, xPost, cf, P.c0, true, 2) + dot(xPost, cf, P.c0);
      // the highlighted gap bracket at post
      svg += '<line x1="' + gapX + '" y1="' + py(top).toFixed(1) + '" x2="' + gapX + '" y2="' + py(bot).toFixed(1) + '" stroke="' + P.bad + '" stroke-width="2"/>';
      svg += '<text x="' + (gapX + 4) + '" y="' + ((py(top) + py(bot)) / 2 + 4).toFixed(1) + '" font-family="IBM Plex Sans,sans-serif" font-size="12" font-weight="600" fill="' + P.bad + '">' + (mode === 'did' ? did : naive) + '</text>';
      svg += '<text x="' + xPre + '" y="' + (H - 8) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">before</text>';
      svg += '<text x="' + xPost + '" y="' + (H - 8) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">after</text>';
      svg += '<text x="' + (xPre + 4) + '" y="' + (py(tPre) - 6).toFixed(1) + '" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.c0 + '">treated</text>';
      svg += '<text x="' + (xPre + 4) + '" y="' + (py(cPre) + 14).toFixed(1) + '" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.c1 + '">control</text>';
      svg += '</svg>';
      plot.innerHTML = svg;
      read.innerHTML = mode === 'naive'
        ? 'The <b>naive</b> comparison subtracts the two post values: ' + tPost + ' &minus; ' + cPost + ' = <b style="color:' + P.bad + '">' + naive + '</b>. But the groups began at different levels (' + tPre + ' vs ' + cPre + '), so this is biased.'
        : 'The dashed line is the counterfactual: where treated would land if it moved parallel to control (' + tPre + ' + ' + (cPost - cPre) + ' = ' + cf + '). <b>DiD</b> = ' + tPost + ' &minus; ' + cf + ' = <b style="color:' + P.bad + '">' + did + '</b>, the double difference, valid only if the trends really are parallel.';
    }
    u.wireSeg(el.querySelector('.dd-seg'), function (v) { mode = v; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Difference-in-differences: two groups, before and after a policy. Base R.',
      'set.seed(1)',
      'n <- 200',
      'd <- expand.grid(unit = 1:n, post = 0:1)',
      'd$treat <- ifelse(d$unit <= n / 2, 0, 1)',
      'base   <- ifelse(d$treat == 1, 18, 20)              # treated start lower',
      'trend  <- ifelse(d$post == 1, 6, 0)                  # common time trend',
      'effect <- ifelse(d$treat == 1 & d$post == 1, 6, 0)   # TRUE DiD effect = 6',
      'd$y <- base + trend + effect + rnorm(nrow(d), 0, 4)',
      '',
      'cell <- tapply(d$y, list(treat = d$treat, post = d$post), mean)',
      'did  <- (cell["1","1"] - cell["1","0"]) - (cell["0","1"] - cell["0","0"])',
      'c(naive_post_gap = cell["1","1"] - cell["0","1"], did = did)',
      '#> naive_post_gap            did',
      '#>           4.09           6.67',
      '',
      'round(coef(lm(y ~ treat * post, data = d)), 2)   # the treat:post term IS the DiD',
      '#> (Intercept)       treat        post  treat:post',
      '#>       20.44       -2.59        5.68        6.67'
    ].join('\n');
  }

  window.LessonWidgets.register('did-parallel', mount);
})();
