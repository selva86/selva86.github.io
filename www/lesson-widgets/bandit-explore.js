/* bandit-explore.js - explore vs exploit in a multi-armed bandit, made visible. Three arms
 * with unknown reward rates; a strategy must learn which is best while paying for every pull
 * of a worse one. That running cost is REGRET. epsilon-greedy explores blindly at a fixed
 * rate; Thompson sampling explores in proportion to its uncertainty and stops wasting pulls
 * on clearly-worse arms, so its regret curve flattens sooner. Toggle the two and compare the
 * cumulative-regret curves. Emits the same bandit simulation in base R.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  var RATES = [0.30, 0.50, 0.55], BEST = 0.55, T = 400;

  function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

  function simulate(strategy) {
    var r = rng(strategy === 'thompson' ? 7 : 19), spare = null;
    function rnorm() { if (spare !== null) { var v = spare; spare = null; return v; } var a = Math.max(r(), 1e-12), b = r(), m = Math.sqrt(-2 * Math.log(a)); spare = m * Math.sin(2 * Math.PI * b); return m * Math.cos(2 * Math.PI * b); }
    var K = RATES.length, succ = [0, 0, 0], n = [0, 0, 0], regret = 0, curve = [];
    for (var t = 0; t < T; t++) {
      var pick = 0;
      if (strategy === 'egreedy') {
        if (r() < 0.1) { pick = Math.floor(r() * K); }
        else { var bm = -1; for (var k = 0; k < K; k++) { var mean = n[k] ? succ[k] / n[k] : 1; if (mean > bm) { bm = mean; pick = k; } } }
      } else { // thompson: sample each arm's rate from its Beta posterior (normal approx), pick the max
        var best = -1;
        for (var k2 = 0; k2 < K; k2++) {
          var a = succ[k2] + 1, b2 = n[k2] - succ[k2] + 1, tot = a + b2;
          var mn = a / tot, vr = a * b2 / (tot * tot * (tot + 1));
          var draw = Math.min(0.999, Math.max(0.001, mn + Math.sqrt(vr) * rnorm()));
          if (draw > best) { best = draw; pick = k2; }
        }
      }
      var reward = r() < RATES[pick] ? 1 : 0;
      succ[pick] += reward; n[pick]++;
      regret += BEST - RATES[pick];
      curve.push(regret);
    }
    return { curve: curve, regret: regret, n: n };
  }

  function mount(el, cfg) {
    cfg = cfg || {}; var strat = 'thompson';
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="ba-seg" style="margin-bottom:12px">' + u.seg([{ v: 'egreedy', label: 'epsilon-greedy' }, { v: 'thompson', label: 'Thompson sampling' }], 'thompson') + '</div>' +
      '<div class="ba-plot"></div>' +
      '<div class="ba-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'A three-arm bandit: epsilon-greedy vs Thompson, base R' });

    var plot = el.querySelector('.ba-plot'), read = el.querySelector('.ba-read');
    var eg = simulate('egreedy'), th = simulate('thompson');
    var YMAX = Math.max(eg.regret, th.regret) * 1.05;
    var W = 340, H = 185, PAD = 30;
    function px(t) { return PAD + (t / T) * (W - PAD - 8); }
    function py(v) { return (H - 22) - (v / YMAX) * (H - 34); }
    function path(c) { return c.map(function (v, t) { return px(t).toFixed(1) + ',' + py(v).toFixed(1); }).join(' '); }
    function draw() {
      var sel = strat === 'thompson' ? th : eg, other = strat === 'thompson' ? eg : th;
      plot.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block;border:1px solid ' + P.line + ';border-radius:8px" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="cumulative regret over rounds">' +
        '<polyline points="' + path(other.curve) + '" fill="none" stroke="' + P.line2 + '" stroke-width="1.5" stroke-dasharray="3 3"/>' +
        '<polyline points="' + path(sel.curve) + '" fill="none" stroke="' + P.c0 + '" stroke-width="2.5"/>' +
        '<text x="' + (W - 8) + '" y="12" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">cumulative regret</text>' +
        '<text x="' + (W / 2) + '" y="' + (H - 4) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">round (1 to ' + T + ')</text></svg>';
      read.innerHTML = '<b>' + (strat === 'thompson' ? 'Thompson sampling' : 'epsilon-greedy') + '</b> ends ' + T + ' rounds with total regret <b style="color:' + P.c0 + '">' + sel.regret.toFixed(1) + '</b> (the dashed line is the other strategy at ' + other.regret.toFixed(1) + '). ' +
        (strat === 'thompson' ? 'Its curve bends toward flat: once an arm looks clearly worse, Thompson almost stops pulling it.' : 'It keeps spending a fixed 10% of pulls exploring at random forever, so its regret keeps climbing even after the best arm is obvious.');
    }
    u.wireSeg(el.querySelector('.ba-seg'), function (v) { strat = v; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Three-arm bandit: epsilon-greedy vs Thompson sampling, scored by cumulative regret. Base R.',
      'rates <- c(0.30, 0.50, 0.55); best <- max(rates); T <- 400',
      '',
      'run <- function(strategy) {',
      '  succ <- rep(0, 3); n <- rep(0, 3); regret <- 0',
      '  for (t in 1:T) {',
      '    if (strategy == "egreedy") {',
      '      pick <- if (runif(1) < 0.1) sample(3, 1) else which.max(ifelse(n > 0, succ / n, 1))',
      '    } else {',
      '      pick <- which.max(rbeta(3, succ + 1, n - succ + 1))   # Thompson: draw from each arm\'s Beta',
      '    }',
      '    reward <- rbinom(1, 1, rates[pick])',
      '    succ[pick] <- succ[pick] + reward; n[pick] <- n[pick] + 1',
      '    regret <- regret + (best - rates[pick])',
      '  }',
      '  c(regret = regret, pulls_best = n[which.max(rates)])',
      '}',
      'set.seed(7)',
      'round(rbind(egreedy = run("egreedy"), thompson = run("thompson")), 1)',
      '# Thompson ends with lower regret and far more pulls on the best arm.'
    ].join('\n');
  }

  window.LessonWidgets.register('bandit-explore', mount);
})();
