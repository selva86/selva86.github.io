/* mcmc-walk.js - the Metropolis sampler, made visible. A random walk explores a posterior:
 * propose a step, accept it if it climbs (or by luck if it descends), and the chain's
 * histogram converges to the target. Toggle the proposal width to feel the tuning problem:
 * too small crawls (high acceptance, poor mixing), too large gets rejected constantly
 * (low acceptance), and a medium step mixes well. The top panel is the trace, the bottom
 * the running histogram against the true posterior. Emits the same Metropolis loop in base R.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  // target posterior: N(mu0, sd0) (a normal-mean posterior with sd = 1/sqrt(20))
  var MU0 = 3.19, SD0 = 0.224;
  function logpost(x) { var z = (x - MU0) / SD0; return -0.5 * z * z; }

  // deterministic PRNG (so the picture is stable) + Box-Muller normal
  function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

  function run(propSD, n) {
    var r = rng(7), spare = null;
    function rnorm() { if (spare !== null) { var v = spare; spare = null; return v; } var u1 = Math.max(r(), 1e-12), u2 = r(), m = Math.sqrt(-2 * Math.log(u1)); spare = m * Math.sin(2 * Math.PI * u2); return m * Math.cos(2 * Math.PI * u2); }
    var x = 0, acc = 0, chain = [x];
    for (var i = 1; i < n; i++) {
      var cand = x + propSD * rnorm();
      if (Math.log(Math.max(r(), 1e-12)) < logpost(cand) - logpost(x)) { x = cand; acc++; }
      chain.push(x);
    }
    return { chain: chain, acc: acc / (n - 1) };
  }

  function mount(el, cfg) {
    cfg = cfg || {}; var propSD = 0.5, N = 500;
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="mc-seg" style="margin-bottom:12px">' + u.seg([{ v: '0.08', label: 'Too small' }, { v: '0.5', label: 'Good' }, { v: '3', label: 'Too large' }], '0.5') + '</div>' +
      '<div class="mc-plot"></div>' +
      '<div class="mc-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'A Metropolis sampler for a normal-mean posterior, from scratch in base R' });

    var plot = el.querySelector('.mc-plot'), read = el.querySelector('.mc-read');
    var W = 340, Ht = 130, Hh = 96, YR = [2.3, 4.1];
    function tx(i) { return (i / (N - 1)) * (W - 4) + 2; }
    function ty(v) { return Ht - (v - YR[0]) / (YR[1] - YR[0]) * (Ht - 8) - 4; }
    function draw() {
      var res = run(propSD, N);
      var trace = res.chain.map(function (v, i) { return tx(i).toFixed(1) + ',' + ty(v).toFixed(1); });
      // histogram of post-burn samples
      var burn = Math.floor(N * 0.2), bins = 30, lo = YR[0], hi = YR[1], cnt = new Array(bins).fill(0);
      for (var i = burn; i < N; i++) { var b = Math.floor((res.chain[i] - lo) / (hi - lo) * bins); if (b >= 0 && b < bins) cnt[b]++; }
      var mx = Math.max.apply(null, cnt) || 1, bw = W / bins;
      var bars = cnt.map(function (c, i) { var h = c / mx * (Hh - 10); return '<rect x="' + (i * bw).toFixed(1) + '" y="' + (Hh - h).toFixed(1) + '" width="' + (bw - 1).toFixed(1) + '" height="' + h.toFixed(1) + '" fill="' + P.c0 + '" opacity="0.6"/>'; }).join('');
      // true posterior curve over the histogram panel
      var curve = [];
      for (var g = 0; g <= 60; g++) { var xv = lo + (hi - lo) * g / 60, d = Math.exp(logpost(xv)); curve.push(((xv - lo) / (hi - lo) * W).toFixed(1) + ',' + (Hh - d * (Hh - 10)).toFixed(1)); }
      plot.innerHTML =
        '<svg viewBox="0 0 ' + W + ' ' + Ht + '" width="100%" style="max-width:' + W + 'px;display:block;border:1px solid ' + P.line + ';border-radius:8px 8px 0 0;border-bottom:0" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="MCMC trace">' +
          '<polyline points="' + trace.join(' ') + '" fill="none" stroke="' + P.acc + '" stroke-width="1" opacity="0.85"/>' +
          '<text x="6" y="12" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">trace (chain over iterations)</text></svg>' +
        '<svg viewBox="0 0 ' + W + ' ' + Hh + '" width="100%" style="max-width:' + W + 'px;display:block;border:1px solid ' + P.line + ';border-radius:0 0 8px 8px" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="posterior histogram">' +
          bars + '<polyline points="' + curve.join(' ') + '" fill="none" stroke="' + P.ink + '" stroke-width="2"/>' +
          '<text x="6" y="12" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">samples vs true posterior</text></svg>';
      read.innerHTML = 'Proposal sd <b style="font-family:IBM Plex Mono,monospace">' + propSD.toFixed(2) + '</b>, acceptance <b>' + (res.acc * 100).toFixed(0) + '%</b>. ' +
        (propSD < 0.2 ? 'Tiny steps: almost every move is accepted, but the chain <b>crawls</b> and barely explores, poor mixing.'
         : propSD > 1.5 ? 'Huge steps: most proposals land in low-probability regions and are <b>rejected</b>, so the trace sticks in flat runs.'
         : 'A medium step <b>mixes well</b>: acceptance near 40-50%, the trace roams freely, and the histogram fills in the true posterior.');
    }
    u.wireSeg(el.querySelector('.mc-seg'), function (v) { propSD = parseFloat(v); draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Metropolis sampling: explore a posterior with a guided random walk, base R.',
      'set.seed(1)',
      'y <- rnorm(20, 3, 1)                              # data: 20 obs, unknown mean, sd = 1',
      'logpost <- function(mu) sum(dnorm(y, mu, 1, log = TRUE))   # flat prior on mu',
      '',
      'metropolis <- function(start, prop_sd, n) {',
      '  x <- numeric(n); x[1] <- start; acc <- 0',
      '  for (i in 2:n) {',
      '    cand <- rnorm(1, x[i-1], prop_sd)             # propose a step',
      '    if (log(runif(1)) < logpost(cand) - logpost(x[i-1])) {  # accept by the Metropolis rule',
      '      x[i] <- cand; acc <- acc + 1',
      '    } else x[i] <- x[i-1]                         # else stay put',
      '  }',
      '  list(chain = x, acc = acc / (n-1))',
      '}',
      'fit  <- metropolis(0, 0.5, 5000)',
      'burn <- 1:1000                                    # discard the warm-up',
      'round(c(post_mean = mean(fit$chain[-burn]), post_sd = sd(fit$chain[-burn]),',
      '        accept = fit$acc), 3)',
      '# the chain recovers the analytic posterior: mean ~ mean(y), sd ~ 1/sqrt(20).'
    ].join('\n');
  }

  window.LessonWidgets.register('mcmc-walk', mount);
})();
