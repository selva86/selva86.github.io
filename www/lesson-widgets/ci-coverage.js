/* ci-coverage.js - what "95% confident" actually promises, counted.
 *
 * A confidence interval is almost always taught with one interval on screen,
 * which is exactly the picture that produces the standard misreading: that
 * there is a 95% chance the truth sits inside THIS interval. The promise is
 * not about one interval. It is about the procedure, across repetitions. So
 * this draws sixty repetitions and counts.
 *
 * The sixty samples are held fixed when the method changes. Identical data,
 * three different recipes, three different coverage counts: that is the only
 * honest way to show that the shortfall belongs to the recipe and not to bad
 * luck in the draw. Switching the population or the sample size redraws them,
 * because those genuinely are different data.
 *
 * The payoff is the combination the slider makes reachable: a skewed
 * population at n = 5 with the z recipe covers far less often than it claims.
 * Nothing is wrong with the arithmetic. The normal approximation it rests on
 * has simply not arrived yet, which is the thing a coverage check is for.
 *
 * Seeded, so the count under any given setting is the same for every reader
 * and a lesson can quote it in prose.
 *
 * cfg: { method: 'z'|'t'|'boot', parent: 'norm'|'skew', n: <one of 5 10 20 40 80> }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  var NS = [5, 10, 20, 40, 80];
  var REPS = 60;
  var B = 300;

  /* Numerical Recipes lgamma, and the regularized incomplete beta built on it,
     so the t cutoff is exact at every df rather than read off a table of a few
     rows. Verified against qt() at df 1 through 30. */
  var LG = [76.18009172947146, -86.50532032941677, 24.01409824083091,
            -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  function lgamma(x) {
    var y = x, tmp = x + 5.5, ser = 1.000000000190015;
    tmp -= (x + 0.5) * Math.log(tmp);
    for (var j = 0; j < 6; j++) ser += LG[j] / ++y;
    return -tmp + Math.log(2.5066282746310005 * ser / x);
  }
  function betacf(a, b, x) {
    var MAXIT = 200, EPS = 3e-14, FPMIN = 1e-300;
    var qab = a + b, qap = a + 1, qam = a - 1;
    var c = 1, d = 1 - qab * x / qap, m2, aa, del, h, m;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    d = 1 / d; h = d;
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
  function betai(a, b, x) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    var bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b)
      + a * Math.log(x) + b * Math.log(1 - x));
    if (x < (a + 1) / (a + b + 2)) return bt * betacf(a, b, x) / a;
    return 1 - bt * betacf(b, a, 1 - x) / b;
  }
  function pt(t, v) {
    var x = v / (v + t * t), tail = 0.5 * betai(v / 2, 0.5, x);
    return t >= 0 ? 1 - tail : tail;
  }
  function tcrit(v) {
    var lo = 0, hi = 400, mid, i;
    for (i = 0; i < 80; i++) { mid = (lo + hi) / 2; if (pt(mid, v) < 0.975) lo = mid; else hi = mid; }
    return (lo + hi) / 2;
  }
  var Z = 1.959964;

  /* mulberry32, so every reader sees the same sixty samples. */
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function rnorm(r) {
    var u1 = Math.max(r(), 1e-12), u2 = r();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  var PARENT = {
    norm: {
      label: 'Bell-shaped',
      mu: 0,
      draw: function (r) { return rnorm(r); },
      note: 'a bell-shaped population, the case every textbook formula was derived for'
    },
    skew: {
      label: 'Strongly skewed',
      mu: 1,
      /* exponential, rate 1: mean 1, and a long right tail */
      draw: function (r) { return -Math.log(Math.max(r(), 1e-12)); },
      note: 'a strongly skewed population, the case real waiting times and incomes actually look like'
    }
  };

  var METHOD = {
    z: {
      label: 'z interval',
      blurb: 'the textbook formula with 1.96, which assumes the sample mean is already normal',
      why: 'the formula assumes the sample mean is normal and sigma is known, and at this sample size and shape it is neither'
    },
    t: {
      label: 't interval',
      blurb: 'the same formula with a t cutoff, which pays for sigma being estimated',
      why: 'the t cutoff pays for sigma being estimated, but it still assumes the underlying population is bell-shaped, and here it is not'
    },
    boot: {
      label: 'Bootstrap',
      blurb: 'the percentile bootstrap, which assumes no shape at all',
      why: 'resampling assumes the sample in hand is a fair picture of the population, and a handful of points from a long-tailed population almost never contains the tail'
    }
  };

  function mount(el, cfg) {
    cfg = cfg || {};

    var method = METHOD[cfg.method] ? cfg.method : 'z';
    var parent = PARENT[cfg.parent] ? cfg.parent : 'skew';
    var n = NS.indexOf(+cfg.n) >= 0 ? +cfg.n : 10;

    el.innerHTML =
      '<div style="border:1px solid ' + P.line + ';border-radius:12px;padding:16px;background:#fff">' +
        '<div class="cc-m" style="margin-bottom:8px">' +
          u.seg([{ v: 'z', label: METHOD.z.label }, { v: 't', label: METHOD.t.label },
                 { v: 'boot', label: METHOD.boot.label }], method) +
        '</div>' +
        '<div class="cc-p" style="margin-bottom:10px">' +
          u.seg([{ v: 'norm', label: PARENT.norm.label }, { v: 'skew', label: PARENT.skew.label }], parent) +
        '</div>' +
        '<label style="display:block;font-size:12.5px;color:' + P.mut + ';margin-bottom:12px">' +
          'Sample size <b class="cc-nlab" style="color:' + P.ink + '">' + n + '</b>' +
          '<input class="cc-ns" type="range" min="0" max="' + (NS.length - 1) + '" step="1" value="' +
            NS.indexOf(n) + '" style="width:100%;margin-top:5px">' +
        '</label>' +
        '<div class="cc-plot"></div>' +
        '<p class="cc-read" style="font-size:13.5px;line-height:1.62;color:' + P.body +
          ';margin:12px 0 0"></p>' +
      '</div>' +
      '<div style="margin-top:14px">' + u.runnable(rcode(), { label: 'Count the coverage yourself' }) + '</div>';

    var plot = el.querySelector('.cc-plot');
    var read = el.querySelector('.cc-read');
    var nlab = el.querySelector('.cc-nlab');

    /* The same sixty samples survive a method change, so the only thing that
       moves is the recipe. Keyed on what genuinely changes the data. */
    var cache = {}, samples = null;
    function getSamples() {
      var key = parent + ':' + n;
      if (cache[key]) return cache[key];
      var r = rng(20261103), Pp = PARENT[parent], out = [], i, j, s;
      for (i = 0; i < REPS; i++) {
        s = [];
        for (j = 0; j < n; j++) s.push(Pp.draw(r));
        out.push(s);
      }
      cache[key] = out;
      return out;
    }

    function interval(s, idx) {
      var i, nn = s.length, sum = 0;
      for (i = 0; i < nn; i++) sum += s[i];
      var xbar = sum / nn, ss = 0;
      for (i = 0; i < nn; i++) ss += (s[i] - xbar) * (s[i] - xbar);
      var sd = Math.sqrt(ss / (nn - 1)), se = sd / Math.sqrt(nn);
      if (method === 'z') return [xbar - Z * se, xbar + Z * se, xbar];
      if (method === 't') { var c = tcrit(nn - 1); return [xbar - c * se, xbar + c * se, xbar]; }
      /* Percentile bootstrap. Seeded per replicate, not per sample size: one
         shared stream would hand all sixty samples the identical sequence of
         resample indices, which correlates the sixty intervals and corrupts
         the count the widget exists to report. Still deterministic. */
      var r = rng(777 + nn * 131 + idx * 7919), means = [], b, k, acc;
      for (b = 0; b < B; b++) {
        acc = 0;
        for (k = 0; k < nn; k++) acc += s[(r() * nn) | 0];
        means.push(acc / nn);
      }
      means.sort(function (a, b2) { return a - b2; });
      return [means[Math.floor(0.025 * B)], means[Math.floor(0.975 * B) - 1], xbar];
    }

    function draw() {
      var Pp = PARENT[parent], mu = Pp.mu;
      samples = getSamples();
      var ivs = samples.map(function (s, i) { return interval(s, i); });
      var miss = 0;
      ivs.forEach(function (v) { if (!(v[0] <= mu && mu <= v[1])) miss++; });
      var cover = REPS - miss;

      /* Show every interval in full, and only clip when one is genuinely wild.
         Framing on a fixed quantile of the endpoints was the first thing tried
         and it is wrong: it clips a fixed number of intervals by construction,
         so an arrow appeared on a perfectly ordinary picture and meant nothing.
         The budget is instead tied to the typical width, so an arrow shows up
         only when an interval really is several times wider than its peers,
         which at n = 5 on a skewed population is a true and useful sight. */
      var wid = ivs.map(function (v) { return v[1] - v[0]; }).sort(function (a, b2) { return a - b2; });
      var medW = wid[Math.floor(wid.length / 2)] || 1;
      var lo = Infinity, hi = -Infinity;
      ivs.forEach(function (v) { if (v[0] < lo) lo = v[0]; if (v[1] > hi) hi = v[1]; });
      lo = Math.max(lo, mu - 3.2 * medW);
      hi = Math.min(hi, mu + 3.2 * medW);
      var pad = (hi - lo) * 0.06 || 1;
      lo -= pad; hi += pad;

      var W = 460, H = 320, m = { t: 14, r: 14, b: 42, l: 30 };
      var iw = W - m.l - m.r, ih = H - m.t - m.b;
      var sx = function (v) { return m.l + (v - lo) / (hi - lo) * iw; };
      var rowH = ih / REPS;

      var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W +
        'px;display:block;margin:0 auto" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' +
        REPS + ' confidence intervals from ' + REPS + ' samples; ' + cover +
        ' of them contain the true value and ' + miss + ' miss it">';

      /* the truth, drawn first so every interval is read against it */
      svg += '<line x1="' + sx(mu).toFixed(1) + '" y1="' + (m.t - 4) + '" x2="' + sx(mu).toFixed(1) +
             '" y2="' + (m.t + ih + 4) + '" stroke="' + P.ink + '" stroke-width="1.8"/>' +
             '<text x="' + sx(mu).toFixed(1) + '" y="' + (m.t + ih + 20) +
             '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' +
             P.ink + '">the true value, ' + mu + '</text>';

      ivs.forEach(function (v, i) {
        var y = m.t + rowH * (i + 0.5);
        var hit = v[0] <= mu && mu <= v[1];
        var a = Math.max(lo, v[0]), b2 = Math.min(hi, v[1]);
        var col = hit ? P.acc : P.bad;
        svg += '<line x1="' + sx(a).toFixed(1) + '" y1="' + y.toFixed(1) + '" x2="' + sx(b2).toFixed(1) +
               '" y2="' + y.toFixed(1) + '" stroke="' + col + '" stroke-width="' + (hit ? 1.7 : 2.8) +
               '" stroke-opacity="' + (hit ? 0.72 : 1) + '"/>';
        /* a miss carries a marker as well as a colour, so the count survives
           being read on a monochrome print or by a colourblind reader */
        if (!hit) {
          svg += '<circle cx="' + sx(v[2] < mu ? b2 : a).toFixed(1) + '" cy="' + y.toFixed(1) +
                 '" r="2.6" fill="' + P.bad + '"/>';
        }
        if (v[0] < lo) svg += '<path d="M' + (m.l + 5).toFixed(1) + ' ' + (y - 3).toFixed(1) + 'L' + m.l + ' ' + y.toFixed(1) + 'L' + (m.l + 5).toFixed(1) + ' ' + (y + 3).toFixed(1) + '" fill="none" stroke="' + col + '" stroke-width="1.4"/>';
        if (v[1] > hi) svg += '<path d="M' + (m.l + iw - 5).toFixed(1) + ' ' + (y - 3).toFixed(1) + 'L' + (m.l + iw) + ' ' + y.toFixed(1) + 'L' + (m.l + iw - 5).toFixed(1) + ' ' + (y + 3).toFixed(1) + '" fill="none" stroke="' + col + '" stroke-width="1.4"/>';
      });

      svg += '<text x="' + m.l + '" y="' + (H - 6) +
             '" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut +
             '">one line per sample, ' + REPS + ' samples; a dot marks an interval that misses</text>';
      svg += '</svg>';
      plot.innerHTML = svg;

      var pct = (100 * cover / REPS).toFixed(0);
      var shortfall = 95 - 100 * cover / REPS;
      var txt = '<b>' + cover + ' of ' + REPS + ' intervals contain the true value, which is ' + pct +
        '%.</b> Each line is a fresh sample of ' + n + ' from ' + Pp.note +
        ', run through ' + METHOD[method].blurb + '. ';

      if (shortfall > 4) {
        txt += 'The claim on the label is 95%, so this recipe is <b>overconfident by about ' +
          shortfall.toFixed(0) + ' points</b> here. The arithmetic is not wrong: ' + METHOD[method].why +
          '. No amount of care in the calculation fixes a broken assumption, and nothing inside a single ' +
          'interval reveals that it is broken. Counting across repetitions is the only way to find out.';
      } else if (shortfall < -3) {
        txt += 'That is wider coverage than the 95% claimed, so the intervals are conservative here: ' +
          'not wrong, but paying more width than the job needs.';
      } else {
        txt += 'That is close to the 95% on the label, so the recipe is keeping its promise under these ' +
          'conditions. Note what the promise was about. Not this interval, but the procedure: run it many ' +
          'times and about 95% of the intervals it produces will contain the truth.';
      }
      txt += ' Switch the recipe and the sixty samples stay exactly the same, so any change in the count ' +
        'belongs to the recipe rather than to luck in the draw.';
      read.innerHTML = txt;
      nlab.textContent = n;
    }

    u.wireSeg(el.querySelector('.cc-m'), function (v) { method = v; draw(); });
    u.wireSeg(el.querySelector('.cc-p'), function (v) { parent = v; draw(); });
    el.querySelector('.cc-ns').addEventListener('input', function () { n = NS[+this.value]; draw(); });
    draw();
  }

  /* Emitted once. The picture shows sixty repetitions; this runs ten thousand,
     which is the number you would actually trust, and it makes the reader
     generate the shortfall rather than believe a claim about it. */
  function rcode() {
    return [
      '# Coverage is a property of a RECIPE, so measure it by repetition.',
      'set.seed(1)',
      '',
      'coverage <- function(n, reps = 10000, mu = 1, rule = "z") {',
      '  hit <- replicate(reps, {',
      '    x  <- rexp(n, rate = 1)          # skewed population, true mean 1',
      '    se <- sd(x) / sqrt(n)',
      '    k  <- if (rule == "z") 1.96 else qt(0.975, df = n - 1)',
      '    ci <- mean(x) + c(-1, 1) * k * se',
      '    ci[1] <= mu && mu <= ci[2]',
      '  })',
      '  mean(hit)',
      '}',
      '',
      '# Both recipes claim 95%. Watch what they actually deliver.',
      'for (n in c(5, 10, 20, 40, 80)) {',
      '  cat("n =", formatC(n, width = 3),',
      '      " z:", sprintf("%.3f", coverage(n, rule = "z")),',
      '      " t:", sprintf("%.3f", coverage(n, rule = "t")), "\\n")',
      '}',
      '',
      '# Now the control: the same check on a bell-shaped population, where the',
      '# assumption behind the formula is true from the very first sample.',
      'coverage_normal <- function(n, reps = 10000) {',
      '  mean(replicate(reps, {',
      '    x  <- rnorm(n)',
      '    ci <- mean(x) + c(-1, 1) * qt(0.975, df = n - 1) * sd(x) / sqrt(n)',
      '    ci[1] <= 0 && 0 <= ci[2]',
      '  }))',
      '}',
      'sapply(c(5, 10, 20), coverage_normal)'
    ].join('\n');
  }

  window.LessonWidgets.register('ci-coverage', mount);
})();
