/* bayes-update.js - the heart of Bayesian inference on one screen. A prior belief
 * (normal) times the evidence from data (the likelihood) gives the posterior. Drag the
 * prior's mean and confidence and the amount of data; watch the posterior sit between
 * belief and evidence, and tighten as data grows. Emits runnable base-R that does the
 * exact conjugate normal-normal update the picture shows.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  function mount(el, cfg) {
    cfg = cfg || {};
    var st = { pm: 0, ps: 1.0, dm: 3, n: 10 };   // prior mean/sd, data mean, n (data sd fixed = 2)
    var DSD = 2;

    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="bu-plot"></div>' +
      row('prior mean', 'pm', -4, 6, 0.5, st.pm) +
      row('prior confidence', 'ps', 0.4, 3, 0.1, st.ps, true) +
      row('data average', 'dm', -4, 6, 0.5, st.dm) +
      row('data points n', 'n', 1, 200, 1, st.n) +
      '<div class="bu-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:10px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'The conjugate normal-normal update in base R' });

    var plot = el.querySelector('.bu-plot'), read = el.querySelector('.bu-read');
    function row(lab, key, lo, hi, step, val, inv) {
      return '<label style="display:block;font:600 12px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 1px">' + lab +
        ' <b class="bu-v-' + key + '" style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '"></b>' +
        '<input class="bu-s" data-k="' + key + '"' + (inv ? ' data-inv="1"' : '') + ' type="range" min="' + lo + '" max="' + hi + '" step="' + step + '" value="' + val + '" style="width:100%;accent-color:' + P.acc + '"></label>';
    }
    function dnorm(x, m, s) { return Math.exp(-(x - m) * (x - m) / (2 * s * s)) / (s * Math.sqrt(2 * Math.PI)); }

    function draw() {
      // conjugate normal update: prior N(pm, ps^2), data mean dm with n obs of sd DSD
      var priorVar = st.ps * st.ps, dataVar = DSD * DSD / st.n;
      var postVar = 1 / (1 / priorVar + 1 / dataVar);
      var postM = postVar * (st.pm / priorVar + st.dm / dataVar);
      var postS = Math.sqrt(postVar), likS = Math.sqrt(dataVar);
      var W = 440, H = 190, m = { l: 8, r: 8, t: 10, b: 22 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
      var lo = Math.min(st.pm, st.dm, postM) - 4, hi = Math.max(st.pm, st.dm, postM) + 4;
      var peak = Math.max(dnorm(st.pm, st.pm, st.ps), dnorm(st.dm, st.dm, likS), dnorm(postM, postM, postS));
      function sx(x) { return m.l + (x - lo) / (hi - lo) * iw; }
      function sy(y) { return m.t + ih - y / (peak * 1.08) * ih; }
      function curve(mn, sd, col, fill) {
        var pts = ''; for (var i = 0; i <= 80; i++) { var x = lo + (hi - lo) * i / 80; pts += sx(x).toFixed(1) + ',' + sy(dnorm(x, mn, sd)).toFixed(1) + ' '; }
        var area = fill ? '<polygon points="' + sx(lo).toFixed(1) + ',' + sy(0) + ' ' + pts + sx(hi).toFixed(1) + ',' + sy(0) + '" fill="' + col + '" opacity="0.10"/>' : '';
        return area + '<polyline points="' + pts + '" fill="none" stroke="' + col + '" stroke-width="' + (fill ? 2.6 : 2) + '"/>';
      }
      var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="prior, likelihood and posterior">';
      svg += '<line x1="' + m.l + '" y1="' + sy(0) + '" x2="' + (m.l + iw) + '" y2="' + sy(0) + '" stroke="' + P.line + '"/>';
      svg += curve(st.pm, st.ps, P.mut, false);           // prior
      svg += curve(st.dm, likS, P.c1, false);              // likelihood (data)
      svg += curve(postM, postS, P.acc, true);             // posterior
      // legend
      var lg = [['prior', P.mut], ['likelihood (data)', P.c1], ['posterior', P.acc]];
      lg.forEach(function (o, i) { svg += '<line x1="' + (m.l + 6 + i * 132) + '" y1="14" x2="' + (m.l + 24 + i * 132) + '" y2="14" stroke="' + o[1] + '" stroke-width="3"/><text x="' + (m.l + 28 + i * 132) + '" y="17.5" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.body + '">' + o[0] + '</text>'; });
      svg += '</svg>';
      plot.innerHTML = svg;
      var pull = ((postM - st.pm) / (st.dm - st.pm || 1) * 100);
      read.innerHTML = '<b style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '">posterior &mu; ' + postM.toFixed(2) + ', sd ' + postS.toFixed(2) + '</b>. ' +
        'The posterior sits <b>' + (isFinite(pull) ? Math.max(0, Math.min(100, Math.round(pull))) : 0) + '%</b> of the way from your prior toward the data. ' +
        (st.n >= 60 ? 'With this much data, the evidence dominates and the prior barely matters.' : st.n <= 3 ? 'With so little data, your prior still carries real weight.' : 'Prior and data each pull their share; add data and the posterior tightens toward the evidence.');
      el.querySelector('.bu-v-pm').textContent = st.pm.toFixed(1);
      el.querySelector('.bu-v-ps').textContent = st.ps.toFixed(1);
      el.querySelector('.bu-v-dm').textContent = st.dm.toFixed(1);
      el.querySelector('.bu-v-n').textContent = st.n;
    }
    Array.prototype.forEach.call(el.querySelectorAll('.bu-s'), function (s) {
      s.addEventListener('input', function () { st[s.getAttribute('data-k')] = +s.value; draw(); });
    });
    draw();
  }

  function rcode() {
    return [
      '# Conjugate normal-normal update: prior belief x data evidence -> posterior.',
      'prior_mean <- 0;  prior_sd <- 1      # what you believed before',
      'data_mean  <- 3;  data_sd  <- 2;  n <- 10   # what the data say',
      '',
      'prior_var <- prior_sd^2',
      'data_var  <- data_sd^2 / n            # the mean of n points is this precise',
      'post_var  <- 1 / (1/prior_var + 1/data_var)',
      'post_mean <- post_var * (prior_mean/prior_var + data_mean/data_var)',
      'c(post_mean = round(post_mean, 3), post_sd = round(sqrt(post_var), 3))',
      '# posterior mean is a precision-weighted blend of prior and data;',
      '# more data (raise n) shrinks data_var, so the posterior follows the data.'
    ].join('\n');
  }

  window.LessonWidgets.register('bayes-update', mount);
})();
