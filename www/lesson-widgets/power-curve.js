/* power-curve.js - the sample-size / power tradeoff, made visible. For a two-sample test at
 * a fixed significance level, statistical power climbs with the per-group sample size n, and
 * the whole curve shifts left as the true effect grows (a big effect is easy to detect with
 * few subjects; a small one needs a crowd). Toggle the effect size and read off the n that
 * buys 80% power. Emits the exact same numbers from base R's power.t.test.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  var ZA = 1.959964;   // qnorm(0.975): two-sided test at alpha = 0.05
  var EFFECTS = { small: 0.2, medium: 0.5, large: 0.8 };

  function erf(x) {
    var t = 1 / (1 + 0.3275911 * Math.abs(x));
    var y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return x >= 0 ? y : -y;
  }
  function pnorm(x) { return 0.5 * (1 + erf(x / Math.SQRT2)); }
  // power of a two-sample t-test (normal approximation), equal n per group
  function power(d, n) { var ncp = d * Math.sqrt(n / 2); return pnorm(ncp - ZA) + pnorm(-ncp - ZA); }
  // smallest n per group reaching 80% power (integer search)
  function nFor80(d) { for (var n = 2; n < 4000; n++) { if (power(d, n) >= 0.8) return n; } return 4000; }

  function mount(el, cfg) {
    cfg = cfg || {}; var eff = 'medium';
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="pw-seg" style="margin-bottom:12px">' + u.seg([{ v: 'small', label: 'Small effect (d=0.2)' }, { v: 'medium', label: 'Medium (d=0.5)' }, { v: 'large', label: 'Large (d=0.8)' }], 'medium') + '</div>' +
      '<div class="pw-plot"></div>' +
      '<div class="pw-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Sample size for 80% power, base R power.t.test' });

    var plot = el.querySelector('.pw-plot'), read = el.querySelector('.pw-read');
    var W = 340, H = 190, NMAX = 300, PAD = 30;
    function px(n) { return PAD + (n / NMAX) * (W - PAD - 8); }
    function py(p) { return (H - 22) - p * (H - 34); }
    function draw() {
      var d = EFFECTS[eff];
      var pts = [];
      for (var n = 2; n <= NMAX; n += 2) pts.push(px(n).toFixed(1) + ',' + py(power(d, n)).toFixed(1));
      var n80 = nFor80(d), x80 = px(Math.min(n80, NMAX)), y80 = py(0.8);
      var grid = '';
      [0.25, 0.5, 0.8].forEach(function (p) { grid += '<line x1="' + PAD + '" y1="' + py(p).toFixed(1) + '" x2="' + (W - 8) + '" y2="' + py(p).toFixed(1) + '" stroke="' + P.line + '" stroke-width="1" stroke-dasharray="3 3"/><text x="' + (PAD - 4) + '" y="' + (py(p) + 3).toFixed(1) + '" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="9.5" fill="' + P.mut + '">' + p + '</text>'; });
      plot.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block;border:1px solid ' + P.line + ';border-radius:8px" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="power versus sample size">' +
        grid +
        '<polyline points="' + pts.join(' ') + '" fill="none" stroke="' + P.c0 + '" stroke-width="2.5"/>' +
        (n80 <= NMAX ? '<line x1="' + x80.toFixed(1) + '" y1="' + y80.toFixed(1) + '" x2="' + x80.toFixed(1) + '" y2="' + (H - 22) + '" stroke="' + P.bad + '" stroke-width="1.5" stroke-dasharray="2 2"/><circle cx="' + x80.toFixed(1) + '" cy="' + y80.toFixed(1) + '" r="3.5" fill="' + P.bad + '"/>' : '') +
        '<text x="' + (W - 8) + '" y="12" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">power</text>' +
        '<text x="' + (W / 2) + '" y="' + (H - 4) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">sample size n per group</text></svg>';
      read.innerHTML = 'A <b>' + eff + '</b> effect (d = ' + d + ') needs <b style="color:' + P.bad + '">n &asymp; ' + n80 + '</b> per group to reach 80% power at &alpha; = 0.05. ' +
        (eff === 'small' ? 'Small effects are expensive: detecting them reliably takes hundreds per arm.' : eff === 'large' ? 'Large effects are cheap to detect: a couple of dozen per arm suffices.' : 'Halve the effect and the required sample roughly quadruples: power scales with n times d squared.');
    }
    u.wireSeg(el.querySelector('.pw-seg'), function (v) { eff = v; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# How many subjects per group for 80% power? Base R, no packages.',
      '# Two-sample t-test, alpha = 0.05 two-sided, effect measured in standard deviations (sd = 1).',
      'sizes <- sapply(c(small = 0.2, medium = 0.5, large = 0.8), function(d)',
      '  ceiling(power.t.test(delta = d, sd = 1, sig.level = 0.05, power = 0.80)$n))',
      'sizes',
      '',
      '# and the reverse: the power you actually get from n = 64 per group',
      'round(sapply(c(small = 0.2, medium = 0.5, large = 0.8), function(d)',
      '  power.t.test(n = 64, delta = d, sd = 1, sig.level = 0.05)$power), 3)',
      '# small effects need hundreds per arm; large effects only dozens.'
    ].join('\n');
  }

  window.LessonWidgets.register('power-curve', mount);
})();
