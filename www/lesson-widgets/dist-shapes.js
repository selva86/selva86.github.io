/* dist-shapes.js - the four continuous distributions inference runs on.
 *
 * Not a gallery of curves. Each one is the distribution OF something a
 * researcher computes, and the slider shows what the degrees of freedom buy.
 * The t is drawn over a dashed standard normal on purpose: the gap in the
 * tails is the price of estimating sigma instead of knowing it, which is the
 * entire reason a t interval is wider than a z interval. The readout prices
 * that gap as a real critical value, so the picture and the number agree.
 *
 * cfg: { dist: 'norm'|'t'|'chisq'|'f', df: <number> }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  /* Numerical Recipes gammln. Valid for x > 0, which is all we ask of it. */
  var LG = [76.18009172947146, -86.50532032941677, 24.01409824083091,
            -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  function lgamma(x) {
    var y = x, tmp = x + 5.5, ser = 1.000000000190015;
    tmp -= (x + 0.5) * Math.log(tmp);
    for (var j = 0; j < 6; j++) ser += LG[j] / ++y;
    return -tmp + Math.log(2.5066282746310005 * ser / x);
  }
  function lbeta(a, b) { return lgamma(a) + lgamma(b) - lgamma(a + b); }

  function dnorm(x) { return Math.exp(-0.5 * x * x) / 2.5066282746310002; }
  function dt(x, v) {
    return Math.exp(lgamma((v + 1) / 2) - lgamma(v / 2)
      - 0.5 * Math.log(v * Math.PI) - ((v + 1) / 2) * Math.log(1 + x * x / v));
  }
  function dchisq(x, k) {
    if (x <= 0) return 0;
    return Math.exp((k / 2 - 1) * Math.log(x) - x / 2 - (k / 2) * Math.log(2) - lgamma(k / 2));
  }
  function dfisher(x, d1, d2) {
    if (x <= 0) return 0;
    return Math.exp((d1 / 2) * Math.log(d1 / d2) + (d1 / 2 - 1) * Math.log(x)
      - ((d1 + d2) / 2) * Math.log(1 + d1 * x / d2) - lbeta(d1 / 2, d2 / 2));
  }

  /* The readout prints a cutoff and invites the reader to check it with qt(),
     so it has to be right at every df on the slider, not just the comfortable
     ones. An earlier version integrated the density numerically from -40 and
     was wrong by 47% at df = 1, because a t with one degree of freedom keeps
     about 0.8% of its mass beyond that point. The exact route is the
     regularized incomplete beta (Numerical Recipes betacf/betai), which is
     what R uses too, so the widget and qt() agree to three decimals. */
  function betacf(a, b, x) {
    var MAXIT = 300, EPS = 3e-14, FPMIN = 1e-300;
    var qab = a + b, qap = a + 1, qam = a - 1;
    var c = 1, d = 1 - qab * x / qap;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    d = 1 / d;
    var h = d, m, m2, aa, del;
    for (m = 1; m <= MAXIT; m++) {
      m2 = 2 * m;
      aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d; del = d * c; h *= del;
      if (Math.abs(del - 1) < EPS) break;
    }
    return h;
  }
  function betai(a, b, x) {            // regularized incomplete beta I_x(a, b)
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    var bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b)
      + a * Math.log(x) + b * Math.log(1 - x));
    if (x < (a + 1) / (a + b + 2)) return bt * betacf(a, b, x) / a;
    return 1 - bt * betacf(b, a, 1 - x) / b;
  }
  function pt(t, v) {                  // exact Student t CDF
    var x = v / (v + t * t), tail = 0.5 * betai(v / 2, 0.5, x);
    return t >= 0 ? 1 - tail : tail;
  }
  function tcrit(v) {                  // two-sided 97.5% cutoff
    var lo = 0, hi = 400, m;
    for (var i = 0; i < 80; i++) { m = (lo + hi) / 2; if (pt(m, v) < 0.975) lo = m; else hi = m; }
    return (lo + hi) / 2;
  }

  var META = {
    norm: {
      label: 'Normal', pname: null, xlo: -4, xhi: 4,
      what: 'the distribution of a sample mean once n is large enough, and of the data themselves when they happen to be normal',
      note: 'The reference shape. The three below are all what happens when you have to estimate something instead of knowing it.'
    },
    t: {
      label: 't', pname: 'df', plo: 1, phi: 30, pdef: 5, xlo: -4, xhi: 4,
      what: 'the distribution of a mean divided by its own estimated standard error',
      note: ''
    },
    chisq: {
      label: 'Chi-squared', pname: 'df', plo: 1, phi: 20, pdef: 4, xlo: 0, xhi: 25,
      what: 'the distribution of a sum of squared standard normals',
      note: 'That is why it appears wherever squared deviations get added up: variance estimates, goodness of fit, and the likelihood-ratio tests built on them. It cannot fall below zero, and it leans right until the degrees of freedom pile up.'
    },
    f: {
      label: 'F', pname: 'df1', plo: 1, phi: 15, pdef: 3, xlo: 0, xhi: 5,
      what: 'the distribution of a ratio of two variance estimates',
      note: 'A ratio near one is the null story: both halves are estimating the same variance. An ANOVA table is that ratio, which is why the F table and the ANOVA table are the same table.'
    }
  };

  function mount(el, cfg) {
    cfg = cfg || {};
    var dist = META[cfg.dist] ? cfg.dist : 'norm';
    var param = +cfg.df || 0;

    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="ds-seg" style="margin-bottom:12px">' +
        u.seg([{ v: 'norm', label: 'Normal' }, { v: 't', label: 't' },
               { v: 'chisq', label: 'Chi-squared' }, { v: 'f', label: 'F' }], dist) +
      '</div>' +
      '<div class="ds-ctl" style="margin:0 0 10px"></div>' +
      '<div class="ds-plot"></div>' +
      '<div class="ds-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Build all three from standard normals, and price the t' });

    var ctl = el.querySelector('.ds-ctl'), plot = el.querySelector('.ds-plot'),
        read = el.querySelector('.ds-read');

    var W = 440, H = 220, m = { l: 38, r: 12, t: 12, b: 28 },
        iw = W - m.l - m.r, ih = H - m.t - m.b;

    function dens(x) {
      if (dist === 'norm') return dnorm(x);
      if (dist === 't') return dt(x, param);
      if (dist === 'chisq') return dchisq(x, param);
      return dfisher(x, param, 12);
    }

    function controls() {
      var M = META[dist];
      if (!M.pname) { ctl.innerHTML = ''; return; }
      if (!param || param < M.plo || param > M.phi) param = M.pdef;
      ctl.innerHTML =
        '<label style="display:block;font:600 12.5px/1.6 IBM Plex Sans,sans-serif;color:' + P.body + '">' +
          u.esc(M.pname) + ' <b class="ds-pv" style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '">' + param + '</b>' +
          '<input class="ds-ps" type="range" min="' + M.plo + '" max="' + M.phi + '" step="1" value="' + param +
          '" style="width:100%;accent-color:' + P.acc + '"></label>';
      ctl.querySelector('.ds-ps').addEventListener('input', function (e) {
        param = +e.target.value;
        ctl.querySelector('.ds-pv').textContent = param;
        draw();
      });
    }

    function draw() {
      var M = META[dist], lo = M.xlo, hi = M.xhi, N = 240, i;
      var xs = [], ys = [], mx = 0, y;
      for (i = 0; i <= N; i++) {
        var x = lo + (hi - lo) * i / N;
        y = dens(x);
        if (!isFinite(y)) y = 0;
        xs.push(x); ys.push(y); if (y > mx) mx = y;
      }
      // The t is read against the normal, so both share one vertical scale.
      var ref = [];
      if (dist === 't') {
        for (i = 0; i <= N; i++) { var r = dnorm(xs[i]); ref.push(r); if (r > mx) mx = r; }
      }
      mx = mx * 1.12 || 1;

      function sx(v) { return m.l + (v - lo) / (hi - lo) * iw; }
      function sy(v) { return m.t + ih - (v / mx) * ih; }
      function path(arr) {
        var d = '';
        for (var k = 0; k <= N; k++) d += (k ? 'L' : 'M') + sx(xs[k]).toFixed(1) + ' ' + sy(arr[k]).toFixed(1);
        return d;
      }

      var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W +
        'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' +
        u.esc(M.label) + ' density">';
      svg += '<line x1="' + m.l + '" y1="' + (m.t + ih) + '" x2="' + (m.l + iw) + '" y2="' + (m.t + ih) +
             '" stroke="' + P.line + '"/>';
      var stepT = (hi - lo) <= 8 ? 1 : (hi - lo) <= 12 ? 2 : 5;
      for (var t0 = Math.ceil(lo / stepT) * stepT; t0 <= hi + 1e-9; t0 += stepT) {
        svg += '<text x="' + sx(t0).toFixed(1) + '" y="' + (m.t + ih + 14) +
               '" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="9" fill="' +
               P.mut + '">' + t0 + '</text>';
      }
      if (dist === 't') {
        svg += '<path d="' + path(ref) + '" fill="none" stroke="' + P.faint +
               '" stroke-width="2" stroke-dasharray="5 4"/>';
      }
      svg += '<path d="' + path(ys) + '" fill="none" stroke="' + P.acc + '" stroke-width="2.6"/>';
      svg += '<text x="' + (m.l + iw) + '" y="' + (H - 4) +
             '" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">' +
             (dist === 't' ? 'solid = t, dashed = standard normal' : u.esc(M.label) + ' density') + '</text>';
      svg += '</svg>';
      plot.innerHTML = svg;

      var head = '<b>The ' + u.esc(M.label) + '</b> is ' + M.what + '.';
      var body = M.note;
      if (dist === 't') {
        var c = tcrit(param), gap = (c / 1.959964 - 1) * 100;
        body = 'With <b>df = ' + param + '</b> the cutoff for a 95% interval is <b>' + c.toFixed(3) +
               '</b>, against <b>1.960</b> for the normal, so the interval is <b>' + gap.toFixed(0) +
               '% wider</b>. That is not a correction somebody invented. It is what honesty costs when sigma is ' +
               'estimated from the same small sample that produced the mean. Drag df up and the solid curve ' +
               'settles onto the dashed one, because with enough data an estimated sigma is as good as a known one.';
      } else if (dist === 'chisq') {
        body += ' At <b>df = ' + param + '</b> the mean sits at <b>' + param +
                '</b> and the standard deviation at <b>' + Math.sqrt(2 * param).toFixed(2) + '</b>.';
      } else if (dist === 'f') {
        body += ' Shown here with <b>df1 = ' + param + '</b> over <b>df2 = 12</b>.';
      }
      read.innerHTML = head + ' ' + body;
    }

    u.wireSeg(el.querySelector('.ds-seg'), function (v) {
      dist = v; param = META[v].pdef || 0; controls(); draw();
    });
    controls();
    draw();
  }

  /* One script, emitted once, because every widget here emits its runnable
     block exactly once and nothing rescans the page afterwards. It earns its
     place by showing the one fact the four curves share: t, chi-squared and F
     are all assembled out of standard normals, so none of them is a new
     assumption. Then it prices the t, which is the number that changes a
     reader's intervals tomorrow. */
  function rcode() {
    return [
      '# All three are built out of standard normals. Build them and check.',
      'set.seed(1)',
      '',
      '# chi-squared with k df IS a sum of k squared standard normals',
      'k <- 4',
      'chi <- replicate(20000, sum(rnorm(k)^2))',
      'round(quantile(chi, c(0.05, 0.5, 0.95)), 2)',
      'round(qchisq(c(0.05, 0.5, 0.95), df = k), 2)   # the same distribution, up to simulation noise',
      '',
      '# F IS a ratio of two of those, each divided by its own df',
      'd1 <- 3; d2 <- 12',
      'fsim <- replicate(20000, (sum(rnorm(d1)^2) / d1) / (sum(rnorm(d2)^2) / d2))',
      'round(c(sim = quantile(fsim, 0.95), theory = qf(0.95, d1, d2)), 3)',
      '',
      '# and the t is a mean over its ESTIMATED standard error, which costs width:',
      'for (d in c(2, 5, 10, 30, 100)) {',
      '  cat("df =", formatC(d, width = 3), " t =", round(qt(0.975, d), 3),',
      '      " vs z =", round(qnorm(0.975), 3), "\\n")',
      '}'
    ].join('\n');
  }

  window.LessonWidgets.register('dist-shapes', mount);
})();
