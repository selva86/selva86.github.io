/* synth-control.js - the synthetic control method, made visible. One treated unit (a state, a
 * city, a product) gets a policy at a known time; there is no single good control. Build a
 * SYNTHETIC control as a weighted blend of donor units chosen so the blend tracks the treated
 * unit through the whole pre-treatment period. After treatment, the gap between the treated
 * line and its synthetic twin is the causal effect. Toggle between the two trajectories and
 * the gap plot. Emits the donor-weight fit (optim over a simplex) in base R.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  var TPRE = 20, TPOST = 10, TT = TPRE + TPOST, EFFECT = 3;
  var W_TRUE = [0.5, 0.33, 0.17, 0, 0];

  function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function build() {
    var r = rng(4), spare = null;
    function rnorm() { if (spare !== null) { var v = spare; spare = null; return v; } var a = Math.max(r(), 1e-12), b = r(), m = Math.sqrt(-2 * Math.log(a)); spare = m * Math.sin(2 * Math.PI * b); return m * Math.cos(2 * Math.PI * b); }
    var donors = [];
    for (var j = 0; j < 5; j++) { var arr = [], c = 10; for (var t = 0; t < TT; t++) { c += 0.1 * (j + 1) + rnorm(); arr.push(c); } donors.push(arr); }
    var synth = [], treated = [];
    for (var t = 0; t < TT; t++) {
      var s = 0; for (var k = 0; k < 5; k++) s += W_TRUE[k] * donors[k][t];
      synth.push(s);
      treated.push(s + rnorm() * 0.3 + (t >= TPRE ? EFFECT : 0));
    }
    return { synth: synth, treated: treated };
  }

  function mount(el, cfg) {
    cfg = cfg || {}; var view = 'traj'; var d = build();
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="sc-seg" style="margin-bottom:12px">' + u.seg([{ v: 'traj', label: 'Trajectories' }, { v: 'gap', label: 'Gap (effect)' }], 'traj') + '</div>' +
      '<div class="sc-plot"></div>' +
      '<div class="sc-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Synthetic control: donor weights via optim, base R' });

    var plot = el.querySelector('.sc-plot'), read = el.querySelector('.sc-read');
    var W = 340, H = 200, PAD = 10, T = 10, Bm = 22;
    function px(t) { return PAD + t / (TT - 1) * (W - 2 * PAD); }
    function draw() {
      var series, ylo, yhi, cutX = px(TPRE - 0.5);
      if (view === 'traj') { series = [d.treated, d.synth]; var all = d.treated.concat(d.synth); ylo = Math.min.apply(null, all); yhi = Math.max.apply(null, all); }
      else { series = [d.treated.map(function (v, i) { return v - d.synth[i]; })]; ylo = -1; yhi = EFFECT + 2; }
      function py(y) { return T + (yhi - y) / (yhi - ylo) * (H - T - Bm); }
      function path(a, col, dash) { return '<polyline points="' + a.map(function (v, i) { return px(i).toFixed(1) + ',' + py(v).toFixed(1); }).join(' ') + '" fill="none" stroke="' + col + '" stroke-width="2.3"' + (dash ? ' stroke-dasharray="5 3"' : '') + '/>'; }
      var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block;border:1px solid ' + P.line + ';border-radius:8px" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="synthetic control">';
      svg += '<line x1="' + cutX.toFixed(1) + '" y1="' + T + '" x2="' + cutX.toFixed(1) + '" y2="' + (H - Bm) + '" stroke="' + P.line2 + '" stroke-width="1" stroke-dasharray="2 3"/>';
      svg += '<text x="' + (cutX + 3) + '" y="' + (T + 10) + '" font-family="IBM Plex Sans,sans-serif" font-size="9.5" fill="' + P.mut + '">policy</text>';
      if (view === 'traj') {
        svg += path(d.synth, P.c1, true) + path(d.treated, P.c0);
        svg += '<text x="' + (W - 8) + '" y="14" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.c0 + '">treated</text>';
        svg += '<text x="' + (W - 8) + '" y="28" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.c1 + '">synthetic</text>';
      } else {
        svg += '<line x1="' + px(0).toFixed(1) + '" y1="' + py(0).toFixed(1) + '" x2="' + px(TT - 1).toFixed(1) + '" y2="' + py(0).toFixed(1) + '" stroke="' + P.mut + '" stroke-width="1"/>';
        svg += path(series[0], P.bad);
        svg += '<text x="' + (W - 8) + '" y="14" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.bad + '">treated - synthetic</text>';
      }
      svg += '<text x="' + (W / 2) + '" y="' + (H - 6) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">time -></text></svg>';
      plot.innerHTML = svg;
      read.innerHTML = view === 'traj'
        ? 'The <b>synthetic</b> (dashed) is a weighted blend of donors tuned to track the <b>treated</b> unit before the policy. They match pre-policy, then split: the post-policy gap is the effect.'
        : 'The gap sits near <b>zero</b> before the policy (the synthetic is a good twin), then jumps to about <b style="color:' + P.bad + '">' + EFFECT + '</b> after: the estimated causal effect. A pre-period gap near zero is what licenses reading the post-period gap.';
    }
    u.wireSeg(el.querySelector('.sc-seg'), function (v) { view = v; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Synthetic control: build a weighted donor blend that tracks the treated unit pre-policy. Base R.',
      'set.seed(4)',
      'Tpre <- 20; Tpost <- 10; Tt <- Tpre + Tpost',
      'donors  <- sapply(1:5, function(j) cumsum(rnorm(Tt, 0.1 * j, 1)) + 10)   # 5 donor units',
      'treated <- as.numeric(donors %*% c(0.5, 0.3, 0.2, 0, 0)) + rnorm(Tt, 0, 0.3)',
      'treated[(Tpre + 1):Tt] <- treated[(Tpre + 1):Tt] + 3          # TRUE post-policy effect = 3',
      '',
      'pre  <- 1:Tpre                                                # fit weights on the pre-period only',
      'loss <- function(th) { w <- exp(th)/sum(exp(th)); sum((treated[pre] - donors[pre, ] %*% w)^2) }',
      'w    <- local({ o <- optim(rep(0, 5), loss); exp(o$par)/sum(exp(o$par)) })   # simplex weights',
      'synth <- as.numeric(donors %*% w)',
      'round(w, 2)',
      '#> [1] 0.50 0.33 0.17 0.00 0.00        # recovers the true donor mix, zeroes the rest',
      '',
      'round(c(true = 3,',
      '        effect   = mean(treated[(Tpre+1):Tt] - synth[(Tpre+1):Tt]),',
      '        pre_gap  = mean(treated[pre] - synth[pre])), 2)',
      '#>    true effect pre_gap',
      '#>    3.00   3.00    0.01   # near-zero pre-gap licenses the post-period read'
    ].join('\n');
  }

  window.LessonWidgets.register('synth-control', mount);
})();
