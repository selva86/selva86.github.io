/* clt-sampler.js - the central limit theorem, including the case where it fails.
 *
 * Left panel: the parent population, which is deliberately not normal. Right
 * panel: the distribution of the SAMPLE MEAN at the chosen n, with the normal
 * the theorem promises drawn over it. The x axis is pinned per parent, so
 * raising n visibly tightens the right panel instead of rescaling it, which is
 * the whole point and the thing a rescaling chart hides.
 *
 * The fourth parent is a heavy tail with no finite variance. Averaging buys
 * nothing there, the overlay never fits, and the readout says so. A reader who
 * only ever sees the theorem work learns a rule; a reader who sees its one
 * honest counterexample learns the condition.
 *
 * Deterministic: seeded generator, so the picture is the same for every reader
 * and matches the numbers in the readout.
 *
 * cfg: { parent: 'unif'|'skew'|'bimodal'|'heavy', n: <number> }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  var NS = [1, 2, 5, 10, 30, 100];
  var REPS = 1200;

  /* mulberry32: small, fast, repeatable. */
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  var PARENTS = {
    unif: {
      label: 'Flat', mu: 0.5, sd: Math.sqrt(1 / 12), lo: -0.1, hi: 1.1, finite: true,
      draw: function (r) { return r(); },
      blurb: 'A flat population: every value between 0 and 1 equally likely. Nothing about it is bell shaped.'
    },
    skew: {
      label: 'Skewed', mu: 1, sd: 1, lo: -0.2, hi: 4.2, finite: true,
      draw: function (r) { return -Math.log(1 - r()); },
      blurb: 'A hard right skew, the shape of waiting times and incomes. Most values are small, a few are far out.'
    },
    bimodal: {
      label: 'Two humps', mu: 0, sd: Math.sqrt(2.5), lo: -4, hi: 4, finite: true,
      draw: function (r) {
        var z = Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
        return (r() < 0.5 ? -1.5 : 1.5) + 0.5 * z;
      },
      blurb: 'Two separated humps, the shape of a mixed population. No single value is typical.'
    },
    heavy: {
      label: 'Heavy tail', mu: 0, sd: null, lo: -6, hi: 6, finite: false,
      draw: function (r) { return Math.tan(Math.PI * (r() - 0.5)); },
      blurb: 'A heavy tail with no finite variance, the shape of some financial returns. Extreme values are not rare enough to ignore.'
    }
  };

  function mount(el, cfg) {
    cfg = cfg || {};
    var pk = PARENTS[cfg.parent] ? cfg.parent : 'skew';
    var ni = NS.indexOf(+cfg.n);
    if (ni < 0) ni = 3;

    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="cs-seg" style="margin-bottom:12px">' +
        u.seg([{ v: 'unif', label: 'Flat' }, { v: 'skew', label: 'Skewed' },
               { v: 'bimodal', label: 'Two humps' }, { v: 'heavy', label: 'Heavy tail' }], pk) +
      '</div>' +
      '<label style="display:block;font:600 12.5px/1.6 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:0 0 10px">' +
        'sample size n = <b class="cs-nv" style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '">' + NS[ni] + '</b>' +
        '<input class="cs-ns" type="range" min="0" max="' + (NS.length - 1) + '" step="1" value="' + ni +
        '" style="width:100%;accent-color:' + P.acc + '"></label>' +
      '<div class="cs-plot"></div>' +
      '<div class="cs-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Watch it happen, then watch it fail' });

    var plot = el.querySelector('.cs-plot'), read = el.querySelector('.cs-read');
    var W = 440, H = 250, m = { l: 8, r: 8, t: 12, b: 26 };

    function hist(vals, lo, hi, bins) {
      var h = new Array(bins), i;
      for (i = 0; i < bins; i++) h[i] = 0;
      var out = 0;
      for (i = 0; i < vals.length; i++) {
        var b = Math.floor((vals[i] - lo) / (hi - lo) * bins);
        if (b < 0 || b >= bins) { out++; continue; }
        h[b]++;
      }
      return { h: h, out: out };
    }

    function panel(x0, w, hs, lo, hi, title, overlay, mx) {
      var bins = hs.h.length, ph = H - m.t - m.b - 16, top = m.t + 16;
      var s = '<text x="' + (x0 + w / 2).toFixed(1) + '" y="' + (m.t + 8) +
        '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.mut + '">' +
        u.esc(title) + '</text>';
      var bw = w / bins;
      for (var i = 0; i < bins; i++) {
        if (!hs.h[i]) continue;
        var bh = hs.h[i] / mx * ph;
        s += '<rect x="' + (x0 + i * bw).toFixed(1) + '" y="' + (top + ph - bh).toFixed(1) +
             '" width="' + Math.max(0.6, bw - 0.6).toFixed(1) + '" height="' + bh.toFixed(1) +
             '" fill="' + P.line + '"/>';
      }
      if (overlay) {
        var d = '', N = 120;
        for (var k = 0; k <= N; k++) {
          var xv = lo + (hi - lo) * k / N;
          var dv = overlay(xv);                       // density per unit x
          var cnt = dv * (hi - lo) / bins * REPS;     // expected count in a bin
          var yy = top + ph - Math.min(cnt / mx, 1.25) * ph;
          d += (k ? 'L' : 'M') + (x0 + (xv - lo) / (hi - lo) * w).toFixed(1) + ' ' + yy.toFixed(1);
        }
        s += '<path d="' + d + '" fill="none" stroke="' + P.acc + '" stroke-width="2.4"/>';
      }
      s += '<line x1="' + x0.toFixed(1) + '" y1="' + (top + ph) + '" x2="' + (x0 + w).toFixed(1) +
           '" y2="' + (top + ph) + '" stroke="' + P.line + '"/>';
      return s;
    }

    function draw() {
      var Pp = PARENTS[pk], n = NS[ni];
      var r = rng(20261102);                     // fixed seed: same picture for everyone
      var raw = [], i, j;
      for (i = 0; i < REPS; i++) raw.push(Pp.draw(r));
      var r2 = rng(777);
      var means = [];
      for (i = 0; i < REPS; i++) {
        var s = 0;
        for (j = 0; j < n; j++) s += Pp.draw(r2);
        means.push(s / n);
      }

      var lo = Pp.lo, hi = Pp.hi, BINS = 44;
      var hA = hist(raw, lo, hi, BINS), hB = hist(means, lo, hi, BINS);
      // One shared vertical scale would flatten the parent, so each panel keeps
      // its own, and the pinned x axis carries the comparison instead.
      var mxA = Math.max.apply(null, hA.h) || 1, mxB = Math.max.apply(null, hB.h) || 1;

      var se = Pp.finite ? Pp.sd / Math.sqrt(n) : null;
      var overlay = null;
      if (Pp.finite) {
        overlay = function (x) {
          var z = (x - Pp.mu) / se;
          return Math.exp(-0.5 * z * z) / (se * 2.5066282746310002);
        };
      }

      var halfW = (W - m.l - m.r - 18) / 2;
      var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W +
        'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="population and sampling distribution of the mean">';
      svg += panel(m.l, halfW, hA, lo, hi, 'the population', null, mxA);
      svg += panel(m.l + halfW + 18, halfW, hB, lo, hi, 'means of ' + n + ' at a time', overlay, mxB);
      svg += '<text x="' + (W - m.r) + '" y="' + (H - 4) +
             '" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut +
             '">same x axis on both panels' + (Pp.finite ? ', green = the normal the theorem promises' : '') + '</text>';
      svg += '</svg>';
      plot.innerHTML = svg;

      // Observed spread of the means, to set against the promise. For the
      // heavy tail this has to be an IQR, not a standard deviation: quoting an
      // sd for a population with no finite variance would commit, in the
      // readout, the exact error the readout is warning about. The sd of
      // Cauchy means is not just large, it is meaningless, and it lurches
      // between runs. The IQR is well defined and visibly refuses to shrink.
      var obs, spreadWord;
      if (Pp.finite) {
        var mu = 0;
        for (i = 0; i < means.length; i++) mu += means[i];
        mu /= means.length;
        var v = 0;
        for (i = 0; i < means.length; i++) v += (means[i] - mu) * (means[i] - mu);
        obs = Math.sqrt(v / (means.length - 1));
        spreadWord = 'spread';
      } else {
        var srt = means.slice().sort(function (a, b) { return a - b; });
        obs = srt[Math.floor(0.75 * srt.length)] - srt[Math.floor(0.25 * srt.length)];
        spreadWord = 'middle half';
      }

      var txt = Pp.blurb + ' ';
      if (Pp.finite) {
        txt += 'Average <b>' + n + '</b> of them at a time and the right panel is already ' +
          (n === 1 ? 'just the population again, because a mean of one value is that value' :
            'closer to a bell than the population ever was') +
          '. Its spread is <b>' + obs.toFixed(3) + '</b>, against the <b>' + se.toFixed(3) +
          '</b> that sigma over the square root of n predicts. ' +
          (n >= 30 ? 'At this n the overlay sits on the bars whatever the population looked like, which is why so much of inference can assume normality it never checked.'
                   : 'Push n higher and the two numbers converge while the bars narrow.');
      } else {
        txt += 'Now average <b>' + n + '</b> at a time and nothing improves. The ' + spreadWord +
          ' of the means spans <b>' + obs.toFixed(2) + '</b> and it will not shrink, however high you push n, ' +
          'because the theorem needs a finite variance and this population has none. ' +
          '(That figure is a range rather than a standard deviation on purpose: a standard deviation here ' +
          'would be quoting a number that does not exist.) ' +
          (hB.out > 0 ? '<b>' + hB.out + '</b> of the ' + REPS +
          ' means fell outside the window entirely. ' : '') +
          '<b style="color:' + P.bad + '">This is the condition people forget.</b> The central limit theorem is a ' +
          'promise about populations with finite variance, not a law that averaging fixes everything.';
      }
      read.innerHTML = txt;
    }

    el.querySelector('.cs-ns').addEventListener('input', function (e) {
      ni = +e.target.value;
      el.querySelector('.cs-nv').textContent = NS[ni];
      draw();
    });
    u.wireSeg(el.querySelector('.cs-seg'), function (val) { pk = val; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# The theorem, then its one honest counterexample.',
      'set.seed(1)',
      '',
      '# A hard-skewed population. Averaging still drags the mean toward normal,',
      '# and the spread of the means tracks sigma / sqrt(n) exactly.',
      'for (n in c(1, 2, 5, 10, 30, 100)) {',
      '  means <- replicate(4000, mean(rexp(n, rate = 1)))   # sigma = 1',
      '  cat("n =", formatC(n, width = 3),',
      '      " sd(means) =", formatC(round(sd(means), 3), width = 6),',
      '      " 1/sqrt(n) =", round(1 / sqrt(n), 3), "\\n")',
      '}',
      '',
      '# Now a population with NO finite variance. The averages do not settle,',
      '# because the theorem never promised they would.',
      'for (n in c(1, 10, 100)) {',
      '  mc <- replicate(4000, mean(rcauchy(n)))',
      '  cat("n =", formatC(n, width = 3), " IQR of means =", round(IQR(mc), 2), "\\n")',
      '}',
      '# Check the condition before you lean on the conclusion.'
    ].join('\n');
  }

  window.LessonWidgets.register('clt-sampler', mount);
})();
