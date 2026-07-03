/* ppc-overlay.js - the posterior predictive check, made visible. Pick a test statistic
 * (here: how many zeros a dataset has), simulate it under the fitted model many times, and
 * see where the OBSERVED value falls. Under a good model the observed statistic sits in the
 * bulk of the replicates; under a misspecified one it lands in the tail. Toggle between a
 * Normal fit (wrong for zero-heavy counts) and a Poisson fit (right) and watch the observed
 * line move from the tail into the crowd. Emits the same PPC p-value in base R.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  var T_OBS = 15;          // observed number of zeros in the data (matches the runnable R)
  var MU = 1.6, SD = 1.4;  // fitted mean and sd of the counts

  function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function reps(model, nrep) {
    var r = rng(model === 'poisson' ? 11 : 23), spare = null;
    function rnorm() { if (spare !== null) { var v = spare; spare = null; return v; } var a = Math.max(r(), 1e-12), b = r(), m = Math.sqrt(-2 * Math.log(a)); spare = m * Math.sin(2 * Math.PI * b); return m * Math.cos(2 * Math.PI * b); }
    function rpois(l) { var L = Math.exp(-l), k = 0, p = 1; do { k++; p *= r(); } while (p > L); return k - 1; }
    var out = [];
    for (var j = 0; j < nrep; j++) {
      var zeros = 0;
      for (var i = 0; i < 60; i++) {
        var val = model === 'poisson' ? rpois(MU) : Math.round(MU + SD * rnorm());
        if (val === 0) zeros++;
      }
      out.push(zeros);
    }
    return out;
  }

  function mount(el, cfg) {
    cfg = cfg || {}; var model = 'normal';
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="pp-seg" style="margin-bottom:12px">' + u.seg([{ v: 'normal', label: 'Normal fit (wrong)' }, { v: 'poisson', label: 'Poisson fit (right)' }], 'normal') + '</div>' +
      '<div class="pp-plot"></div>' +
      '<div class="pp-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'A posterior predictive check with the number-of-zeros statistic, base R' });

    var plot = el.querySelector('.pp-plot'), read = el.querySelector('.pp-read');
    var W = 340, H = 170, XMAX = 24;
    function bx(t) { return (t / XMAX) * (W - 8) + 4; }
    function draw() {
      var rp = reps(model, 2000);
      var bins = new Array(XMAX + 1).fill(0);
      rp.forEach(function (t) { if (t >= 0 && t <= XMAX) bins[t]++; });
      var mx = Math.max.apply(null, bins) || 1, bw = (W - 8) / (XMAX + 1);
      var ppc = rp.filter(function (t) { return t >= T_OBS; }).length / rp.length;
      var bars = bins.map(function (c, t) { var h = c / mx * (H - 34); return '<rect x="' + bx(t).toFixed(1) + '" y="' + (H - 18 - h).toFixed(1) + '" width="' + (bw - 1).toFixed(1) + '" height="' + h.toFixed(1) + '" fill="' + P.c0 + '" opacity="0.55"/>'; }).join('');
      var obsX = bx(T_OBS).toFixed(1);
      plot.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block;border:1px solid ' + P.line + ';border-radius:8px" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="posterior predictive check">' +
        bars +
        '<line x1="' + obsX + '" y1="4" x2="' + obsX + '" y2="' + (H - 18) + '" stroke="' + P.bad + '" stroke-width="2"/>' +
        '<text x="' + obsX + '" y="14" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.bad + '">observed = ' + T_OBS + '</text>' +
        '<text x="6" y="' + (H - 4) + '" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">number of zeros in a replicated dataset</text></svg>';
      read.innerHTML = (model === 'poisson'
        ? 'The <b>Poisson</b> replicates cluster around 11-12 zeros, and the observed <b style="color:' + P.bad + '">15</b> sits comfortably inside the crowd. '
        : 'The <b>Normal</b> replicates almost never reach 15 zeros (they average ~8), so the observed <b style="color:' + P.bad + '">15</b> lands far out in the tail. ') +
        'PPC p-value &asymp; <b>' + ppc.toFixed(2) + '</b>: ' + (ppc > 0.05 && ppc < 0.95 ? 'the model reproduces this feature of the data.' : 'the model fails to reproduce the zeros, a clear misfit.');
    }
    u.wireSeg(el.querySelector('.pp-seg'), function (v) { model = v; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Posterior predictive check: does the model reproduce the number of zeros? Base R.',
      'set.seed(2)',
      'y <- rpois(60, 1.5)                               # observed zero-heavy counts',
      'T_obs <- sum(y == 0)                              # test statistic: number of zeros',
      'mu <- mean(y); s <- sd(y)',
      '',
      '# replicate the statistic under each fitted model',
      'T_normal <- replicate(3000, sum(round(rnorm(60, mu, s)) == 0))   # wrong: a Normal',
      'T_pois   <- replicate(3000, sum(rpois(60, mu) == 0))             # right: a Poisson',
      '',
      'round(c(T_obs = T_obs,',
      '        ppc_p_normal = mean(T_normal >= T_obs),   # near 0 => the Normal misfits',
      '        ppc_p_pois   = mean(T_pois   >= T_obs)),  # mid-range => the Poisson is fine',
      '      3)',
      '# the Normal predicts far too few zeros (tiny PPC p); the Poisson reproduces them.'
    ].join('\n');
  }

  window.LessonWidgets.register('ppc-overlay', mount);
})();
