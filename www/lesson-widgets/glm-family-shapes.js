/* glm-family-shapes.js - the outcome's shape tells you which GLM family to use. A normal
 * model assumes a symmetric bell on the whole line, but real targets are often bounded or
 * skewed: money spent is positive and right-skewed (Gamma), a proportion lives in [0,1]
 * (Beta), and insurance loss is a spike at zero plus a positive tail (Tweedie). Toggle the
 * family to see the density it implies and the kind of outcome it fits. Emits runnable
 * base-R that draws each density so you can see why the family matches the data.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  var FAM = {
    gamma: { lo: 0, hi: 8, dens: function (x) { var k = 2.2, th = 1.1; return x <= 0 ? 0 : Math.pow(x, k - 1) * Math.exp(-x / th) / (Math.pow(th, k) * gammaf(k)); }, say: '<b>Gamma</b> fits a strictly positive, right-skewed outcome: spend, claim size, time-to-complete. Mean and variance rise together, and it never predicts a negative value.', use: 'spend, claim amount, duration' },
    beta: { lo: 0, hi: 1, dens: function (x) { var a = 2.5, b = 4; return (x <= 0 || x >= 1) ? 0 : Math.pow(x, a - 1) * Math.pow(1 - x, b - 1) / betaf(a, b); }, say: '<b>Beta</b> fits a proportion or rate bounded in [0, 1]: conversion rate, share of budget, defect fraction. A normal model would happily predict impossible values below 0 or above 1.', use: 'proportion, rate, fraction' },
    tweedie: { lo: 0, hi: 8, dens: null, say: '<b>Tweedie</b> fits a spike of exact zeros plus a positive continuous tail: total insurance loss (most customers claim nothing; some claim a lot). No zero-free family (Gamma) can place mass exactly at 0.', use: 'insurance loss, total sales with many zeros' }
  };
  function gammaf(z) { var g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7]; if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gammaf(1 - z)); z -= 1; var x = c[0]; for (var i = 1; i < g + 2; i++) x += c[i] / (z + i); var t = z + g + 0.5; return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x; }
  function betaf(a, b) { return gammaf(a) * gammaf(b) / gammaf(a + b); }

  function mount(el, cfg) {
    cfg = cfg || {}; var fam = 'gamma';
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="gf-seg" style="margin-bottom:12px">' + u.seg([{ v: 'gamma', label: 'Gamma' }, { v: 'beta', label: 'Beta' }, { v: 'tweedie', label: 'Tweedie' }], 'gamma') + '</div>' +
      '<div class="gf-plot"></div>' +
      '<div class="gf-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'The density shapes in base R' });

    var plot = el.querySelector('.gf-plot'), read = el.querySelector('.gf-read');
    var W = 440, H = 210, m = { l: 30, r: 12, t: 12, b: 26 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
    function draw() {
      var f = FAM[fam], svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="GLM family density">';
      svg += '<line x1="' + m.l + '" y1="' + (m.t + ih) + '" x2="' + (m.l + iw) + '" y2="' + (m.t + ih) + '" stroke="' + P.line + '"/><line x1="' + m.l + '" y1="' + m.t + '" x2="' + m.l + '" y2="' + (m.t + ih) + '" stroke="' + P.line + '"/>';
      function sx(x) { return m.l + (x - f.lo) / (f.hi - f.lo) * iw; }
      if (fam === 'tweedie') {
        // spike at 0 + gamma-ish tail
        var pk = 0; var tw = function (x) { return x <= 0 ? 0 : 0.9 * Math.pow(x, 1.2) * Math.exp(-x / 1.0); };
        for (var xi = 0; xi <= f.hi; xi += 0.05) pk = Math.max(pk, tw(xi));
        var syT = function (v) { return m.t + ih - v / (pk * 1.15) * ih; };
        svg += '<line x1="' + sx(0) + '" y1="' + syT(pk * 1.05) + '" x2="' + sx(0) + '" y2="' + (m.t + ih) + '" stroke="' + P.acc + '" stroke-width="5"/>';
        svg += '<text x="' + (sx(0) + 5) + '" y="' + (syT(pk * 1.05) + 4) + '" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.acc + '">P(loss = 0)</text>';
        var tp = ''; for (var x2 = 0.05; x2 <= f.hi; x2 += 0.05) tp += sx(x2).toFixed(1) + ',' + syT(tw(x2)).toFixed(1) + ' ';
        svg += '<polyline points="' + tp + '" fill="none" stroke="' + P.acc + '" stroke-width="2.6"/>';
      } else {
        var peak = 0; for (var s = f.lo; s <= f.hi; s += (f.hi - f.lo) / 200) peak = Math.max(peak, f.dens(s));
        var sy = function (v) { return m.t + ih - v / (peak * 1.12) * ih; };
        var pts = '', area = sx(f.lo).toFixed(1) + ',' + sy(0) + ' ';
        for (var i = 0; i <= 200; i++) { var x = f.lo + (f.hi - f.lo) * i / 200; var yy = sy(f.dens(x)); pts += sx(x).toFixed(1) + ',' + yy.toFixed(1) + ' '; area += sx(x).toFixed(1) + ',' + yy.toFixed(1) + ' '; }
        area += sx(f.hi).toFixed(1) + ',' + sy(0);
        svg += '<polygon points="' + area + '" fill="' + P.acc + '" opacity="0.10"/><polyline points="' + pts + '" fill="none" stroke="' + P.acc + '" stroke-width="2.6"/>';
      }
      [f.lo, (f.lo + f.hi) / 2, f.hi].forEach(function (t) { svg += '<text x="' + sx(t) + '" y="' + (m.t + ih + 14) + '" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="9" fill="' + P.mut + '">' + t + '</text>'; });
      svg += '<text x="' + (m.l + iw / 2) + '" y="' + (H - 3) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">outcome value (' + f.use + ')</text>';
      svg += '</svg>'; plot.innerHTML = svg;
      read.innerHTML = f.say;
    }
    u.wireSeg(el.querySelector('.gf-seg'), function (v) { fam = v; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# The outcome\'s support and skew pick the family. See the shapes:',
      'x_pos <- seq(0.01, 8, 0.02)',
      'x_prp <- seq(0.001, 0.999, 0.002)',
      '',
      'gamma_d <- dgamma(x_pos, shape = 2.2, scale = 1.1)   # positive, right-skewed',
      'beta_d  <- dbeta(x_prp, 2.5, 4)                       # bounded in [0, 1]',
      'c(gamma_support = "x > 0, skewed  -> spend, claims",',
      '  beta_support  = "0 < x < 1     -> proportions",',
      '  tweedie       = "mass at 0 + positive tail -> insurance loss")',
      'c(gamma_peak_at = round(x_pos[which.max(gamma_d)], 2),',
      '  beta_peak_at  = round(x_prp[which.max(beta_d)], 2))'
    ].join('\n');
  }

  window.LessonWidgets.register('glm-family-shapes', mount);
})();
