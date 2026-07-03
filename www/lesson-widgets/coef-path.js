/* coef-path.js - watch regularization work. Six coefficients start at their least-squares
 * values on the left (weak penalty) and get squeezed toward zero as the penalty lambda
 * grows to the right. Lasso snaps coefficients to exactly zero one by one (selection);
 * ridge shrinks them smoothly but never to zero. Drag lambda to read how many features
 * survive. Emits runnable R that fits the same path with glmnet.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  var NAMES = ['x1', 'x2', 'x3', 'x4', 'x5', 'x6'];
  var FULL = [2.4, -1.8, 1.1, 0.6, -0.35, 0.15];   // OLS coefficients (x1 strongest ... x6 noise)
  var STEPS = 40;
  // build the two paths across a log-lambda grid (col j = coef trajectory)
  function paths(mode) {
    var out = [];
    for (var s = 0; s < STEPS; s++) {
      var t = s / (STEPS - 1);                       // 0 (lambda small) -> 1 (lambda large)
      var row = FULL.map(function (b, j) {
        if (mode === 'ridge') return b / (1 + 9 * t * t);                       // smooth shrink, never 0
        var thr = t * 2.6;                                                       // soft-threshold amount
        var v = Math.sign(b) * Math.max(0, Math.abs(b) - thr * (1 - j * 0.06));  // weaker coefs die first
        return v;
      });
      out.push(row);
    }
    return out;
  }

  function mount(el, cfg) {
    cfg = cfg || {}; var mode = 'lasso', li = 14;
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="cp-seg" style="margin-bottom:12px">' + u.seg([{ v: 'lasso', label: 'Lasso (L1)' }, { v: 'ridge', label: 'Ridge (L2)' }], 'lasso') + '</div>' +
      '<div class="cp-plot"></div>' +
      '<label style="display:block;font:600 12px/1.6 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:10px 0 2px">penalty &lambda; <b class="cp-lam" style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '"></b>' +
        '<input class="cp-s" type="range" min="0" max="' + (STEPS - 1) + '" step="1" value="14" style="width:100%;accent-color:' + P.acc + '"></label>' +
      '<div class="cp-read" style="font:13px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:8px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'The lasso path with glmnet' });

    var plot = el.querySelector('.cp-plot'), read = el.querySelector('.cp-read'), slider = el.querySelector('.cp-s'), lamEl = el.querySelector('.cp-lam');
    var W = 440, H = 220, m = { l: 40, r: 54, t: 12, b: 28 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
    var yb = 2.8;
    function sx(s) { return m.l + s / (STEPS - 1) * iw; }
    function sy(v) { return m.t + ih / 2 - v / yb * (ih / 2); }
    function draw() {
      var P2 = paths(mode), pal = [P.c0, P.acc, P.c1, '#7a5ea3', '#2f8f86', P.faint];
      var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="regularization path">';
      svg += '<line x1="' + m.l + '" y1="' + sy(0) + '" x2="' + (m.l + iw) + '" y2="' + sy(0) + '" stroke="' + P.line + '"/>';
      NAMES.forEach(function (nm, j) {
        var pts = ''; for (var s = 0; s < STEPS; s++) pts += sx(s).toFixed(1) + ',' + sy(P2[s][j]).toFixed(1) + ' ';
        svg += '<polyline points="' + pts + '" fill="none" stroke="' + pal[j] + '" stroke-width="2.2"/>';
        svg += '<text x="' + (m.l + iw + 5) + '" y="' + (sy(P2[STEPS - 1][j]) + 3).toFixed(1) + '" font-family="IBM Plex Mono,monospace" font-size="10" fill="' + pal[j] + '">' + nm + '</text>';
      });
      svg += '<line x1="' + sx(li) + '" y1="' + m.t + '" x2="' + sx(li) + '" y2="' + (m.t + ih) + '" stroke="' + P.ink + '" stroke-width="1.5" stroke-dasharray="4 3"/>';
      svg += '<text x="' + m.l + '" y="' + (H - 6) + '" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">weak penalty</text><text x="' + (m.l + iw) + '" y="' + (H - 6) + '" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">strong penalty</text>';
      svg += '</svg>'; plot.innerHTML = svg;
      var alive = P2[li].filter(function (v) { return Math.abs(v) > 0.01; }).length;
      lamEl.textContent = (li / (STEPS - 1)).toFixed(2);
      read.innerHTML = mode === 'lasso'
        ? '<b style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '">' + alive + ' of 6 features survive.</b> Lasso drives weak coefficients to <b>exactly zero</b>, so raising &lambda; performs feature selection: the noise features (x5, x6) die first.'
        : '<b style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '">all 6 shrink, none vanish.</b> Ridge pulls every coefficient smoothly toward zero but never exactly to it, so it stabilizes rather than selects.';
    }
    u.wireSeg(el.querySelector('.cp-seg'), function (v) { mode = v; draw(); });
    slider.addEventListener('input', function () { li = +slider.value; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# The lasso path: coefficients shrink and drop to zero as the penalty grows.',
      'library(glmnet)',
      'set.seed(1); n <- 200',
      'X <- matrix(rnorm(n * 6), n, 6)',
      'y <- 2.4*X[,1] - 1.8*X[,2] + 1.1*X[,3] + rnorm(n)   # x4-x6 are noise',
      '',
      'fit <- glmnet(X, y, alpha = 1)          # alpha = 1 is lasso; alpha = 0 is ridge',
      'coef(fit, s = 0.30)                      # at this lambda, weak features are exactly 0',
      'colSums(coef(fit) != 0)                  # non-zero count shrinks as lambda rises'
    ].join('\n');
  }

  window.LessonWidgets.register('coef-path', mount);
})();
