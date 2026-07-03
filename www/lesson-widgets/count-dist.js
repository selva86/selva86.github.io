/* count-dist.js - why a plain Poisson often fails on real counts. Real count data (support
 * tickets, insurance claims, doctor visits) usually has more variance than a Poisson allows
 * (overdispersion) and a pile-up of extra zeros. The bars are the observed counts; the line
 * is the model's fitted shape. Toggle Poisson -> Negative Binomial -> Zero-Inflated and
 * watch the line finally match the tall zero bar and the long tail. Emits runnable R that
 * compares the observed zeros to what a Poisson predicts.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  // observed counts 0..9 (excess zeros + long tail; not a clean Poisson)
  var OBS = [0.34, 0.16, 0.15, 0.12, 0.09, 0.06, 0.035, 0.02, 0.01, 0.005];
  var LAM = 2.3;   // mean-ish
  function pois(k) { var e = Math.exp(-LAM), p = e; for (var i = 1; i <= k; i++) p *= LAM / i; return p; }
  function nb(k) { var r = 2.0, pr = r / (r + LAM), c = 1; for (var i = 0; i < k; i++) c *= (r + i) / (i + 1); return c * Math.pow(pr, r) * Math.pow(1 - pr, k); }
  function zip(k) { var pi = 0.22, base = pois(k); return k === 0 ? pi + (1 - pi) * base : (1 - pi) * base; }

  function mount(el, cfg) {
    cfg = cfg || {}; var model = 'pois';
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="cd-seg" style="margin-bottom:12px">' + u.seg([{ v: 'pois', label: 'Poisson' }, { v: 'nb', label: 'Neg. Binomial' }, { v: 'zip', label: 'Zero-Inflated' }], 'pois') + '</div>' +
      '<div class="cd-plot"></div>' +
      '<div class="cd-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Observed zeros vs what a Poisson predicts (base R)' });

    var plot = el.querySelector('.cd-plot'), read = el.querySelector('.cd-read');
    var W = 440, H = 220, m = { l: 36, r: 12, t: 12, b: 28 }, iw = W - m.l - m.r, ih = H - m.t - m.b, mx = 0.4;
    var bw = iw / OBS.length;
    function sy(p) { return m.t + ih - p / mx * ih; }
    function draw() {
      var fn = model === 'pois' ? pois : model === 'nb' ? nb : zip;
      var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="count distribution fit">';
      svg += '<line x1="' + m.l + '" y1="' + (m.t + ih) + '" x2="' + (m.l + iw) + '" y2="' + (m.t + ih) + '" stroke="' + P.line + '"/>';
      OBS.forEach(function (o, k) { var x = m.l + bw * k + 3, h = o / mx * ih; svg += '<rect x="' + x.toFixed(1) + '" y="' + sy(o).toFixed(1) + '" width="' + (bw - 6).toFixed(1) + '" height="' + h.toFixed(1) + '" rx="2" fill="' + P.line + '"/>'; svg += '<text x="' + (x + (bw - 6) / 2).toFixed(1) + '" y="' + (m.t + ih + 14) + '" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="9" fill="' + P.mut + '">' + k + '</text>'; });
      var pts = ''; for (var k = 0; k < OBS.length; k++) pts += (m.l + bw * k + bw / 2).toFixed(1) + ',' + sy(fn(k)).toFixed(1) + ' ';
      svg += '<polyline points="' + pts + '" fill="none" stroke="' + P.acc + '" stroke-width="2.6"/>';
      for (var k2 = 0; k2 < OBS.length; k2++) svg += '<circle cx="' + (m.l + bw * k2 + bw / 2).toFixed(1) + '" cy="' + sy(fn(k2)).toFixed(1) + '" r="3" fill="' + P.acc + '"/>';
      svg += '<text x="' + (m.l + iw) + '" y="' + (H - 4) + '" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">bars = observed, line = model</text>';
      svg += '</svg>'; plot.innerHTML = svg;
      var gapZero = (OBS[0] - fn(0)).toFixed(2);
      read.innerHTML = model === 'pois'
        ? '<b style="color:' + P.bad + '">Poisson misses on both ends.</b> It underpredicts the zero bar by <b>' + gapZero + '</b> and cannot match the long tail, because Poisson forces variance = mean. Real counts are usually more spread out.'
        : model === 'nb'
          ? '<b style="color:' + P.acc + '">Negative binomial</b> adds a dispersion parameter, so variance can exceed the mean. The tail now fits, but a genuine excess of zeros can still be under-modeled.'
          : '<b style="color:' + P.acc + '">Zero-inflated</b> mixes a "structural zero" process with the counts, so the tall zero bar and the tail both fit: the right choice when many zeros come from "never at risk" cases.';
    }
    u.wireSeg(el.querySelector('.cd-seg'), function (v) { model = v; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Does a Poisson fit? Compare the zeros it predicts to the zeros you actually see.',
      'set.seed(1); n <- 800',
      '# a process with extra zeros: 25% structural zeros, rest ~ Poisson(2.3)',
      'lambda <- 2.3',
      'y <- ifelse(runif(n) < 0.25, 0, rpois(n, lambda))',
      '',
      'obs_zeros  <- mean(y == 0)',
      'pois_zeros <- dpois(0, mean(y))        # zeros a fitted Poisson expects',
      'c(observed = round(obs_zeros, 3), poisson_expects = round(pois_zeros, 3))',
      '# far more observed zeros than Poisson allows -> reach for NB or a zero-inflated model.'
    ].join('\n');
  }

  window.LessonWidgets.register('count-dist', mount);
})();
