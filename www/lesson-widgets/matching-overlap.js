/* matching-overlap.js - propensity-score overlap and covariate balance, made visible.
 * When treatment is confounded, treated and control units have different propensity-score
 * distributions: the treated pile up at high scores, controls at low ones, and a naive
 * difference in outcomes is biased. Matching (or IP-weighting) keeps only the region of
 * common support and reshapes control to look like treated, collapsing the standardized
 * mean difference toward zero. Toggle before/after and watch the two mirrored histograms
 * line up and the balance number fall. Emits the same propensity + nearest-neighbour match
 * in base R.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function plogis(z) { return 1 / (1 + Math.exp(-z)); }

  // deterministic sample: x ~ N(0,1), treat ~ Bernoulli(plogis(0.8 x)), ps = plogis(0.8 x)
  function build() {
    var r = rng(1), spare = null;
    function rnorm() { if (spare !== null) { var v = spare; spare = null; return v; } var a = Math.max(r(), 1e-12), b = r(), m = Math.sqrt(-2 * Math.log(a)); spare = m * Math.sin(2 * Math.PI * b); return m * Math.cos(2 * Math.PI * b); }
    var trt = [], ctrl = [];
    for (var i = 0; i < 600; i++) { var x = rnorm(), ps = plogis(0.8 * x); if (r() < ps) trt.push(ps); else ctrl.push(ps); }
    // nearest-neighbour match: each treated -> closest control ps (with replacement)
    var matched = trt.map(function (p) { var bi = 0, bd = 2; for (var j = 0; j < ctrl.length; j++) { var d = Math.abs(ctrl[j] - p); if (d < bd) { bd = d; bi = j; } } return ctrl[bi]; });
    return { trt: trt, ctrl: ctrl, matched: matched };
  }
  function mean(a) { return a.reduce(function (s, v) { return s + v; }, 0) / a.length; }
  function vari(a) { var m = mean(a); return a.reduce(function (s, v) { return s + (v - m) * (v - m); }, 0) / (a.length - 1); }
  function smd(a, b) { return (mean(a) - mean(b)) / Math.sqrt((vari(a) + vari(b)) / 2); }
  function hist(a, nb) { var h = new Array(nb).fill(0); a.forEach(function (v) { var k = Math.min(nb - 1, Math.floor(v * nb)); h[k]++; }); return h; }

  function mount(el, cfg) {
    cfg = cfg || {}; var phase = 'before';
    var d = build();
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="mo-seg" style="margin-bottom:12px">' + u.seg([{ v: 'before', label: 'Before matching' }, { v: 'after', label: 'After matching' }], 'before') + '</div>' +
      '<div class="mo-plot"></div>' +
      '<div class="mo-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Propensity score + nearest-neighbour matching, base R' });

    var plot = el.querySelector('.mo-plot'), read = el.querySelector('.mo-read');
    var NB = 20, W = 340, H = 190, MID = H / 2, bw = (W - 8) / NB;
    function draw() {
      var control = phase === 'before' ? d.ctrl : d.matched;
      var ht = hist(d.trt, NB), hc = hist(control, NB);
      var mx = Math.max(Math.max.apply(null, ht), Math.max.apply(null, hc)) || 1;
      var sc = (MID - 16) / mx;
      function bars(h, up) { return h.map(function (c, k) { var hh = c * sc; var y = up ? MID - hh : MID; return '<rect x="' + (4 + k * bw).toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + (bw - 1).toFixed(1) + '" height="' + hh.toFixed(1) + '" fill="' + (up ? P.c0 : P.c1) + '" opacity="0.6"/>'; }).join(''); }
      var s = smd(d.trt, control);
      plot.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block;border:1px solid ' + P.line + ';border-radius:8px" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="propensity overlap">' +
        bars(ht, true) + bars(hc, false) +
        '<line x1="4" y1="' + MID + '" x2="' + (W - 4) + '" y2="' + MID + '" stroke="' + P.mut + '" stroke-width="1"/>' +
        '<text x="8" y="14" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.c0 + '">treated</text>' +
        '<text x="8" y="' + (H - 6) + '" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.c1 + '">control</text>' +
        '<text x="' + (W - 6) + '" y="' + (MID + 14) + '" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">propensity score ->' + '</text></svg>';
      read.innerHTML = phase === 'before'
        ? 'Treated units pile up at <b>high</b> propensity scores and controls at <b>low</b> ones: standardized mean difference <b style="color:' + P.bad + '">' + s.toFixed(2) + '</b>. A raw outcome gap here is confounded.'
        : 'Each treated unit is paired with its nearest-propensity control, so the two histograms now line up: standardized mean difference <b style="color:' + P.acc + '">' + s.toFixed(2) + '</b> (under 0.1 is good balance). The matched comparison is fair.';
    }
    u.wireSeg(el.querySelector('.mo-seg'), function (v) { phase = v; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Confounded treatment: recover the true effect with propensity-score matching. Base R.',
      'set.seed(1)',
      'n <- 600; x <- rnorm(n)',
      'treat <- rbinom(n, 1, plogis(0.8 * x))   # treatment depends on x (a confounder)',
      'y <- 2 * treat + 1.5 * x + rnorm(n)       # the TRUE treatment effect is 2',
      '',
      'naive <- mean(y[treat == 1]) - mean(y[treat == 0])   # biased: ignores x',
      'ps <- glm(treat ~ x, family = binomial)$fitted.values',
      'ctrl <- which(treat == 0); trt <- which(treat == 1)',
      'match <- sapply(trt, function(i) ctrl[which.min(abs(ps[ctrl] - ps[i]))])',
      'att <- mean(y[trt] - y[match])            # matched difference',
      'round(c(true = 2, naive = naive, matched = att), 2)',
      '#>    true   naive matched',
      '#>    2.00    3.02    2.01',
      '',
      'smd <- function(a, b) (mean(a) - mean(b)) / sqrt((var(a) + var(b)) / 2)',
      'round(c(before = smd(x[trt], x[ctrl]), after = smd(x[trt], x[match])), 2)  # covariate balance',
      '#> before  after',
      '#>   0.74    0.01'
    ].join('\n');
  }

  window.LessonWidgets.register('matching-overlap', mount);
})();
