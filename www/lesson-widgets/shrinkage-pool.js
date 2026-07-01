/* shrinkage-pool.js - partial pooling, the idea at the heart of mixed models. Eight
 * clinics each measure a handful of patients; their raw averages scatter wildly because
 * small samples are noisy. Slide the pooling dial from "no pooling" (trust each clinic
 * alone) to "complete pooling" (one global number for all) and watch partial pooling in
 * between pull the shakiest, smallest clinics hardest toward the grand mean. Emits
 * runnable R fitting the same shrinkage with lme4::lmer.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  // 8 groups: true effect ~ around the grand mean; small n = noisy raw mean
  var GRAND = 50;
  var G = [
    { id: 'A', n: 3, raw: 61 }, { id: 'B', n: 25, raw: 53 }, { id: 'C', n: 4, raw: 39 },
    { id: 'D', n: 40, raw: 51 }, { id: 'E', n: 2, raw: 66 }, { id: 'F', n: 30, raw: 48 },
    { id: 'G', n: 5, raw: 42 }, { id: 'H', n: 12, raw: 55 }
  ];

  function mount(el, cfg) {
    cfg = cfg || {}; var lam = 0.5;   // 0 = no pooling, 1 = complete pooling
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="sp-plot"></div>' +
      '<label style="display:block;font:600 12px/1.6 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:12px 0 2px">pooling <b class="sp-v" style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '"></b>' +
        '<input class="sp-s" type="range" min="0" max="1" step="0.05" value="0.5" style="width:100%;accent-color:' + P.acc + '"></label>' +
      '<div style="display:flex;justify-content:space-between;font:10px IBM Plex Sans,sans-serif;color:' + P.mut + '"><span>no pooling (each clinic alone)</span><span>complete pooling (one number)</span></div>' +
      '<div class="sp-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Partial pooling with lme4::lmer()' });

    var plot = el.querySelector('.sp-plot'), read = el.querySelector('.sp-read'), slider = el.querySelector('.sp-s'), vEl = el.querySelector('.sp-v');
    var W = 440, H = 180, m = { l: 26, r: 26, t: 22, b: 24 }, iw = W - m.l - m.r;
    var lo = 34, hi = 70;
    function sx(v) { return m.l + (v - lo) / (hi - lo) * iw; }
    // shrinkage weight: bigger n shrinks less; lam scales overall pull
    function est(g) { var w = lam * (1 - g.n / (g.n + 8)); return g.raw + (GRAND - g.raw) * (lam >= 1 ? 1 : Math.min(1, w * 2)); }
    function draw() {
      var y0 = m.t + 20;
      var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="shrinkage toward the grand mean">';
      svg += '<line x1="' + m.l + '" y1="' + (y0 + 60) + '" x2="' + (m.l + iw) + '" y2="' + (y0 + 60) + '" stroke="' + P.line + '"/>';
      [40, 50, 60].forEach(function (t) { svg += '<text x="' + sx(t) + '" y="' + (y0 + 74) + '" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="9" fill="' + P.mut + '">' + t + '</text>'; });
      // grand mean line
      svg += '<line x1="' + sx(GRAND) + '" y1="' + (y0 - 14) + '" x2="' + sx(GRAND) + '" y2="' + (y0 + 60) + '" stroke="' + P.ink + '" stroke-width="1.5" stroke-dasharray="4 3"/><text x="' + sx(GRAND) + '" y="' + (y0 - 18) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.ink + '">grand mean</text>';
      // each clinic: raw (faint) -> shrunk (solid), arrow, size by n
      G.forEach(function (g) {
        var e = est(g), r = 3 + Math.min(7, Math.sqrt(g.n));
        svg += '<circle cx="' + sx(g.raw).toFixed(1) + '" cy="' + (y0 + 30) + '" r="3" fill="' + P.faint + '"/>';
        svg += '<line x1="' + sx(g.raw).toFixed(1) + '" y1="' + (y0 + 30) + '" x2="' + sx(e).toFixed(1) + '" y2="' + (y0 + 30) + '" stroke="' + P.line + '"/>';
        svg += '<circle cx="' + sx(e).toFixed(1) + '" cy="' + (y0 + 30) + '" r="' + r.toFixed(1) + '" fill="' + P.acc + '" opacity="0.85"/>';
      });
      svg += '<text x="' + m.l + '" y="' + (y0 + 30 - 40) + '" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">faint = raw mean; green = pooled estimate (size = sample size)</text>';
      svg += '</svg>'; plot.innerHTML = svg;
      vEl.textContent = lam.toFixed(2);
      var smallPull = Math.abs(est(G[4]) - G[4].raw).toFixed(1), bigPull = Math.abs(est(G[3]) - G[3].raw).toFixed(1);
      read.innerHTML = lam < 0.05
        ? '<b>No pooling:</b> every clinic is trusted on its own, so tiny clinics (n=2, n=3) swing far from the grand mean on almost no evidence.'
        : lam > 0.95
          ? '<b>Complete pooling:</b> all clinics collapse to the single grand mean, throwing away every real between-clinic difference.'
          : '<b style="color:' + P.acc + '">Partial pooling.</b> Clinic E (n=2) is pulled <b>' + smallPull + '</b> toward the mean while clinic D (n=40) barely moves (<b>' + bigPull + '</b>): small, noisy groups borrow strength from the whole, exactly what a random-effects model does automatically.';
    }
    slider.addEventListener('input', function () { lam = +slider.value; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Partial pooling: a mixed model shrinks noisy small-group means toward the average.',
      'library(lme4)',
      'set.seed(1)',
      'clinic <- factor(rep(LETTERS[1:8], times = c(3,25,4,40,2,30,5,12)))',
      'y <- rnorm(length(clinic), 50 + rep(c(8,3,-9,1,12,-2,-6,5),',
      '                                    times = c(3,25,4,40,2,30,5,12)), 6)',
      '',
      'raw    <- tapply(y, clinic, mean)                 # noisy raw means',
      'pooled <- coef(lmer(y ~ 1 + (1 | clinic)))$clinic[,1]   # shrunk estimates',
      'round(rbind(raw, pooled), 1)                      # small groups move most'
    ].join('\n');
  }

  window.LessonWidgets.register('shrinkage-pool', mount);
})();
