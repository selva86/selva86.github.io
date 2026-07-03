/* uplift-curve.js - heterogeneous treatment effects and the Qini curve, made visible. An
 * average treatment effect can be small while hiding units the treatment HELPS a lot and
 * units it HURTS. An uplift model scores each unit by its predicted individual effect; ranking
 * by that score and targeting from the top first traces the Qini curve, cumulative incremental
 * conversions versus the fraction of the population treated. A good model's curve bulges above
 * the random-targeting diagonal, and can even peak before 100% (past that you are treating
 * people it hurts). Toggle model vs random. Emits a T-learner uplift model in base R.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function plogis(z) { return 1 / (1 + Math.exp(-z)); }

  function build() {
    var r = rng(5);
    var units = [];
    for (var i = 0; i < 4000; i++) {
      var x = r() * 2 - 1, treat = r() < 0.5 ? 1 : 0;
      var tau = 0.35 * x + 0.15;                       // true per-unit uplift, varies with x
      var p = plogis(-0.2 + 0.5 * x) + treat * tau;
      var y = r() < Math.min(1, Math.max(0, p)) ? 1 : 0;
      units.push({ score: x, treat: treat, y: y });   // score = x is the true uplift order
    }
    return units;
  }
  // Qini curve over units already sorted by score desc; returns array of {f, q}
  function qini(units) {
    var Nt = 0, Nc = 0, Yt = 0, Yc = 0, out = [{ f: 0, q: 0 }];
    for (var i = 0; i < units.length; i++) {
      if (units[i].treat) { Nt++; Yt += units[i].y; } else { Nc++; Yc += units[i].y; }
      var q = Yt - (Nc ? Yc * Nt / Nc : 0);
      if (i % 40 === 0 || i === units.length - 1) out.push({ f: (i + 1) / units.length, q: q });
    }
    return out;
  }

  function mount(el, cfg) {
    cfg = cfg || {}; var mode = 'model';
    var units = build();
    var byScore = units.slice().sort(function (a, b) { return b.score - a.score; });
    var qModel = qini(byScore);
    var qRand = qini(units);   // original order is effectively random wrt uplift
    var qmax = Math.max.apply(null, qModel.map(function (d) { return d.q; }));
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="up-seg" style="margin-bottom:12px">' + u.seg([{ v: 'model', label: 'Uplift model' }, { v: 'random', label: 'Random targeting' }], 'model') + '</div>' +
      '<div class="up-plot"></div>' +
      '<div class="up-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'T-learner uplift model + quartile validation, base R' });

    var plot = el.querySelector('.up-plot'), read = el.querySelector('.up-read');
    var W = 340, H = 200, PADL = 30, PADR = 8, T = 10, Bm = 24;
    function px(f) { return PADL + f * (W - PADL - PADR); }
    function py(q) { return T + (qmax - q) / (qmax + 1e-9) * (H - T - Bm); }
    function path(a, col, dash) { return '<polyline points="' + a.map(function (d) { return px(d.f).toFixed(1) + ',' + py(d.q).toFixed(1); }).join(' ') + '" fill="none" stroke="' + col + '" stroke-width="2.5"' + (dash ? ' stroke-dasharray="5 3"' : '') + '/>'; }
    function draw() {
      var sel = mode === 'model' ? qModel : qRand, other = mode === 'model' ? qRand : qModel;
      var peak = qModel[qModel.length - 1].q, best = qmax;
      plot.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block;border:1px solid ' + P.line + ';border-radius:8px" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="qini uplift curve">' +
        '<line x1="' + px(0).toFixed(1) + '" y1="' + py(0).toFixed(1) + '" x2="' + px(1).toFixed(1) + '" y2="' + py(qRand[qRand.length - 1].q).toFixed(1) + '" stroke="' + P.line + '" stroke-width="1" stroke-dasharray="2 3"/>' +
        path(other, P.line2, true) + path(sel, mode === 'model' ? P.acc : P.mut) +
        '<text x="' + (PADL + 4) + '" y="' + (T + 10) + '" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">cumulative incremental conversions</text>' +
        '<text x="' + (W / 2) + '" y="' + (H - 6) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">fraction of population targeted -></text></svg>';
      read.innerHTML = mode === 'model'
        ? 'Ranking by predicted uplift and treating from the top bends the Qini curve <b>above</b> the random diagonal: the same budget wins far more incremental conversions. The curve peaks before 100%, past there you are treating people the offer HURTS.'
        : 'Random targeting traces the straight diagonal: incremental conversions grow in proportion to how many you treat, with no benefit from ordering. The gap to the uplift curve is what targeting buys.';
    }
    u.wireSeg(el.querySelector('.up-seg'), function (v) { mode = v; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Uplift (heterogeneous effects): who does the treatment actually help? Base R T-learner.',
      'set.seed(5)',
      'n <- 4000; x <- runif(n, -1, 1); treat <- rbinom(n, 1, 0.5)   # randomized',
      'tau <- 0.35 * x + 0.15                                # TRUE per-unit uplift varies with x',
      'y <- rbinom(n, 1, pmin(pmax(plogis(-0.2 + 0.5*x) + treat*tau, 0), 1))',
      '',
      'm1 <- glm(y ~ x, binomial, subset = treat == 1)       # T-learner: one model per arm',
      'm0 <- glm(y ~ x, binomial, subset = treat == 0)',
      'uplift <- predict(m1, data.frame(x), type="response") - predict(m0, data.frame(x), type="response")',
      '',
      '# validate: actual treated-minus-control response within predicted-uplift quartiles',
      'q <- cut(uplift, quantile(uplift, 0:4/4), labels = 1:4, include.lowest = TRUE)',
      'round(sapply(1:4, function(g) mean(y[q==g & treat==1]) - mean(y[q==g & treat==0])), 2)',
      '#> [1] -0.09  0.02  0.26  0.39      # rises with predicted uplift; Q1 is HURT by treatment',
      'round(mean(y[treat==1]) - mean(y[treat==0]), 2)     # the flat average that hides all this',
      '#> [1] 0.15'
    ].join('\n');
  }

  window.LessonWidgets.register('uplift-curve', mount);
})();
