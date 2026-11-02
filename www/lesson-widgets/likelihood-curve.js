/* likelihood-curve.js - where an estimate comes from, and where its error bar
 * comes from.
 *
 * The shelf had no likelihood widget at all, so maximum likelihood had to be
 * taught as a formula handed down. It is not a formula. It is the peak of a
 * curve, and the curve is drawn here.
 *
 * Three things sit on one picture, because they are three readings of the same
 * object and students usually meet them as three unrelated topics:
 *
 *   the PEAK           is the maximum likelihood estimate
 *   the CURVATURE      at the peak is the observed Fisher information, so a
 *                      sharp peak means a small standard error
 *   the WIDTH at -1.92 is a confidence interval, read straight off the curve
 *
 * The dashed parabola is the quadratic approximation the Wald interval assumes.
 * At small n it visibly misses the real curve, and the readout prices the gap
 * between the two intervals. That gap is the honest reason a Wald interval
 * misbehaves on small samples, and it is a fact about this picture rather than
 * a warning the reader has to take on trust.
 *
 * Both models are rigged so the estimate lands on a round number at every
 * sample size (k = 0.3n exactly; sum of waiting times = 2n exactly). Only the
 * curvature changes as n moves, which is the one thing the slider is for.
 *
 * cfg: { model: 'bern'|'expo', n: <one of 10 20 40 80 160 320> }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  var NS = [10, 20, 40, 80, 160, 320];

  /* Half of the 95% chi-squared(1) point. Where a log-likelihood curve has
     dropped by this much, you are at the edge of a 95% interval. */
  var DROP = 1.920729;
  var Z = 1.959964;

  var MODEL = {
    bern: {
      label: 'Coin flips',
      pname: 'p',
      what: 'the chance of heads, estimated from a run of flips',
      /* k successes out of n, with k/n pinned at 0.3 for every n. */
      hat: 0.3,
      k: function (n) { return 0.3 * n; },
      ll: function (p, n) { var k = 0.3 * n; return k * Math.log(p) + (n - k) * Math.log(1 - p); },
      info: function (n) { return n / (0.3 * 0.7); },
      lo: 0.004, hi: 0.996,
      fmt: function (v) { return v.toFixed(3); },
      data: function (n) { return '3 heads in every 10 flips, ' + n + ' flips in all'; }
    },
    expo: {
      label: 'Waiting times',
      pname: 'rate',
      what: 'how often something happens, estimated from the gaps between events',
      /* n waiting times summing to exactly 2n, so the rate estimate is 0.5. */
      hat: 0.5,
      ll: function (r, n) { return n * Math.log(r) - r * (2 * n); },
      info: function (n) { return n / (0.5 * 0.5); },
      lo: 0.004, hi: 4,
      fmt: function (v) { return v.toFixed(3); },
      data: function (n) { return n + ' waits averaging 2 minutes each'; }
    }
  };

  function mount(el, cfg) {
    cfg = cfg || {};

    var model = MODEL[cfg.model] ? cfg.model : 'bern';
    var n = NS.indexOf(+cfg.n) >= 0 ? +cfg.n : 40;

    el.innerHTML =
      '<div style="border:1px solid ' + P.line + ';border-radius:12px;padding:16px;background:#fff">' +
        '<div class="lc-seg" style="margin-bottom:10px">' +
          u.seg([{ v: 'bern', label: MODEL.bern.label }, { v: 'expo', label: MODEL.expo.label }], model) +
        '</div>' +
        '<label style="display:block;font-size:12.5px;color:' + P.mut + ';margin-bottom:12px">' +
          'Sample size <b class="lc-nlab" style="color:' + P.ink + '">' + n + '</b>' +
          '<input class="lc-ns" type="range" min="0" max="' + (NS.length - 1) + '" step="1" value="' +
            NS.indexOf(n) + '" style="width:100%;margin-top:5px">' +
        '</label>' +
        '<div class="lc-plot"></div>' +
        '<p class="lc-read" style="font-size:13.5px;line-height:1.62;color:' + P.body +
          ';margin:12px 0 0"></p>' +
      '</div>' +
      '<div style="margin-top:14px">' + u.runnable(rcode(), { label: 'Find the peak yourself' }) + '</div>';

    var plot = el.querySelector('.lc-plot');
    var read = el.querySelector('.lc-read');
    var nlab = el.querySelector('.lc-nlab');

    function draw() {
      var M = MODEL[model];
      var hat = M.hat, I = M.info(n), se = 1 / Math.sqrt(I);

      /* Always frame the picture four standard errors each side of the peak, so
         the curve fills the panel at every sample size instead of collapsing
         into a spike. */
      var lo = Math.max(M.lo, hat - 4.2 * se), hi = Math.min(M.hi, hat + 4.2 * se);
      var YMIN = -7;

      var W = 460, H = 272, m = { t: 14, r: 14, b: 40, l: 46 };
      var iw = W - m.l - m.r, ih = H - m.t - m.b;
      var sx = function (v) { return m.l + (v - lo) / (hi - lo) * iw; };
      var sy = function (v) { return m.t + (0 - v) / (0 - YMIN) * ih; };

      var N = 240, i, xs = [], real = [], quad = [];
      var llhat = M.ll(hat, n);
      for (i = 0; i <= N; i++) {
        var x = lo + (hi - lo) * i / N;
        xs.push(x);
        real.push(Math.max(YMIN, M.ll(x, n) - llhat));
        quad.push(Math.max(YMIN, -0.5 * I * (x - hat) * (x - hat)));
      }
      function path(ys) {
        var d = '', k;
        for (k = 0; k <= N; k++) d += (k ? 'L' : 'M') + sx(xs[k]).toFixed(1) + ' ' + sy(ys[k]).toFixed(1);
        return d;
      }

      /* Where each curve crosses the -1.92 line: the likelihood interval from
         the real curve, the Wald interval from the parabola. Found by scanning
         the grid already computed, so the picture and the numbers cannot drift
         apart. */
      function cross(ys) {
        /* Interpolated between grid points, not snapped to one. The readout
           quotes three decimals and the grid step is coarser than that, so
           taking the nearer grid point would print a number the curve does not
           actually cross at. Checked against R: both ends land within 0.001. */
        function at(k) {
          var y0 = ys[k - 1], y1 = ys[k], f = (y1 === y0) ? 0 : (-DROP - y0) / (y1 - y0);
          return xs[k - 1] + f * (xs[k] - xs[k - 1]);
        }
        var a = null, b = null, k;
        for (k = 1; k <= N; k++) {
          if (a === null && ys[k] > -DROP && ys[k - 1] <= -DROP) a = at(k);
          if (ys[k - 1] > -DROP && ys[k] <= -DROP) b = at(k);
        }
        return [a, b];
      }
      var ciL = cross(real), ciW = [hat - Z * se, hat + Z * se];

      var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W +
        'px;display:block;margin:0 auto" xmlns="http://www.w3.org/2000/svg" role="img" ' +
        'aria-label="log-likelihood curve with its peak, its quadratic approximation and the 95 percent cutoff">';

      /* grid + y labels */
      [0, -2, -4, -6].forEach(function (t) {
        svg += '<line x1="' + m.l + '" y1="' + sy(t).toFixed(1) + '" x2="' + (m.l + iw) +
               '" y2="' + sy(t).toFixed(1) + '" stroke="' + P.line2 + '"/>' +
               '<text x="' + (m.l - 7) + '" y="' + (sy(t) + 3).toFixed(1) +
               '" text-anchor="end" font-family="IBM Plex Mono,monospace" font-size="9" fill="' +
               P.mut + '">' + t + '</text>';
      });
      svg += '<line x1="' + m.l + '" y1="' + (m.t + ih) + '" x2="' + (m.l + iw) + '" y2="' + (m.t + ih) +
             '" stroke="' + P.line + '" stroke-width="1.5"/>' +
             '<line x1="' + m.l + '" y1="' + m.t + '" x2="' + m.l + '" y2="' + (m.t + ih) +
             '" stroke="' + P.line + '" stroke-width="1.5"/>';

      /* the 95% cutoff, labelled, because it is the whole reason the curve has
         a width worth reading */
      svg += '<line x1="' + m.l + '" y1="' + sy(-DROP).toFixed(1) + '" x2="' + (m.l + iw) +
             '" y2="' + sy(-DROP).toFixed(1) + '" stroke="' + P.c1 +
             '" stroke-width="1.5" stroke-dasharray="4 3"/>' +
             '<text x="' + (m.l + iw - 3) + '" y="' + (sy(-DROP) - 5).toFixed(1) +
             '" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="9.5" fill="' +
             P.c1 + '">95% cutoff, a drop of 1.92</text>';

      /* x ticks */
      var tk = [lo, (lo + hat) / 2, hat, (hat + hi) / 2, hi];
      tk.forEach(function (t) {
        svg += '<text x="' + sx(t).toFixed(1) + '" y="' + (m.t + ih + 15) +
               '" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="9" fill="' +
               P.mut + '">' + t.toFixed(2) + '</text>';
      });

      /* the quadratic the Wald interval believes in, then the real curve on top */
      svg += '<path d="' + path(quad) + '" fill="none" stroke="' + P.faint +
             '" stroke-width="2" stroke-dasharray="5 4"/>';
      svg += '<path d="' + path(real) + '" fill="none" stroke="' + P.acc + '" stroke-width="2.6"/>';

      /* the peak */
      svg += '<line x1="' + sx(hat).toFixed(1) + '" y1="' + sy(0).toFixed(1) + '" x2="' + sx(hat).toFixed(1) +
             '" y2="' + (m.t + ih) + '" stroke="' + P.ink + '" stroke-width="1" stroke-dasharray="2 3"/>' +
             '<circle cx="' + sx(hat).toFixed(1) + '" cy="' + sy(0).toFixed(1) + '" r="4.5" fill="' + P.acc + '"/>' +
             /* Labelled at the foot of its own dashed line, not at the apex.
                The apex is where the curve is, and a label there sits on top
                of the thing it is pointing at. */
             '<text x="' + sx(hat).toFixed(1) + '" y="' + (m.t + ih - 7) +
             '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' +
             P.ink + '">estimate ' + M.fmt(hat) + '</text>';

      svg += '<text x="' + (m.l + iw / 2) + '" y="' + (H - 5) +
             '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="11" fill="' +
             P.mut + '">' + u.esc(M.pname) + ', the value being estimated</text>' +
             '<text transform="translate(11,' + (m.t + ih / 2) +
             ') rotate(-90)" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="11" fill="' +
             P.mut + '">log-likelihood, relative to its peak</text>';
      svg += '</svg>';
      plot.innerHTML = svg;

      var wW = ciW[1] - ciW[0];
      var wL = (ciL[0] !== null && ciL[1] !== null) ? ciL[1] - ciL[0] : null;
      var txt =
        '<b>' + u.esc(M.data(n)) + '.</b> The curve scores every value of ' + u.esc(M.pname) +
        ' by how well it explains that data. Its peak is at <b>' + M.fmt(hat) +
        '</b>, and that peak is the maximum likelihood estimate: not a formula, just the best-scoring value. ' +
        'The curvature there is the observed information, <b>' + I.toFixed(1) +
        '</b>, and one over its square root is the standard error, <b>' + se.toFixed(4) +
        '</b>. A sharper peak means the data rule out nearby values more firmly, which is the whole content of the ' +
        'phrase "more information".';

      if (wL !== null) {
        var gap = Math.abs(wL - wW) / wW * 100;
        txt += ' Reading the width off the real curve at the dashed orange line gives <b>' +
          ciL[0].toFixed(3) + ' to ' + ciL[1].toFixed(3) + '</b>. The dashed parabola, which is what a Wald interval ' +
          'assumes the curve looks like, gives <b>' + ciW[0].toFixed(3) + ' to ' + ciW[1].toFixed(3) + '</b>, ' +
          (gap < 2
            ? 'near enough identical. At this sample size the parabola is a fair stand-in for the curve, which is why the easy formula works here.'
            : 'about <b>' + gap.toFixed(0) + '% different in width</b>, and visibly off-centre. The parabola is symmetric and the real curve is not, so the easy formula is quietly wrong at this sample size. Slide n up and watch the two merge.');
      }
      read.innerHTML = txt;
      nlab.textContent = n;
    }

    u.wireSeg(el.querySelector('.lc-seg'), function (v) { model = v; draw(); });
    el.querySelector('.lc-ns').addEventListener('input', function () {
      n = NS[+this.value]; draw();
    });
    draw();
  }

  /* Emitted once. It does the thing the picture cannot: proves the peak is a
     peak by searching for it numerically, then shows that the curvature really
     does reproduce the textbook standard error. A reader who runs this has
     derived both formulas instead of being given them. */
  function rcode() {
    return [
      '# 3 heads in every 10 flips, 40 flips in all.',
      'n <- 40; k <- 12',
      '',
      '# Score every candidate value of p by how well it explains the data.',
      'loglik <- function(p) k * log(p) + (n - k) * log(1 - p)',
      'p_grid <- seq(0.01, 0.99, by = 0.0005)',
      'p_hat  <- p_grid[which.max(loglik(p_grid))]',
      'c(found_by_search = p_hat, the_formula = k / n)',
      '',
      '# optim() gets the same answer without a grid.',
      'optimise(loglik, c(0.001, 0.999), maximum = TRUE)$maximum',
      '',
      '# Curvature at the peak IS the information. Differentiate twice,',
      '# numerically, and compare against the textbook standard error.',
      'h <- 1e-4',
      'curv <- (loglik(p_hat + h) - 2 * loglik(p_hat) + loglik(p_hat - h)) / h^2',
      'c(se_from_curvature = 1 / sqrt(-curv),',
      '  se_from_formula   = sqrt(p_hat * (1 - p_hat) / n))',
      '',
      '# Two intervals. Where the curve itself drops by 1.92, and the Wald',
      '# formula. They agree when the curve is near enough a parabola.',
      'cut   <- loglik(p_hat) - qchisq(0.95, df = 1) / 2',
      'inside <- p_grid[loglik(p_grid) >= cut]',
      'rbind(from_the_curve = range(inside),',
      '      wald           = p_hat + c(-1, 1) * 1.96 * sqrt(p_hat * (1 - p_hat) / n))'
    ].join('\n');
  }

  window.LessonWidgets.register('likelihood-curve', mount);
})();
