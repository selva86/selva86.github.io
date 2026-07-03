/* hazard-ratio.js - what a Cox hazard ratio does to a survival curve. Proportional hazards
 * means one group's survival is the other's raised to a power: S1(t) = S0(t)^HR. Toggle the
 * hazard ratio and watch the second curve pull away from the baseline - below it when HR > 1
 * (higher hazard, dies sooner), above it when HR < 1 (protective). The curves never cross:
 * that is the proportional-hazards assumption made visible. Emits a runnable coxph fit.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  function mount(el, cfg) {
    cfg = cfg || {}; var HR = 2;
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="hr-seg" style="margin-bottom:12px">' + u.seg([{ v: '0.5', label: 'HR 0.5' }, { v: '1', label: 'HR 1' }, { v: '2', label: 'HR 2' }, { v: '3', label: 'HR 3' }], '2') + '</div>' +
      '<div class="hr-plot"></div>' +
      '<div class="hr-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'A Cox proportional-hazards fit, and its hazard ratios' });

    var plot = el.querySelector('.hr-plot'), read = el.querySelector('.hr-read');
    var W = 340, H = 240, TMAX = 60, r0 = 0.035;   // baseline hazard rate
    function px(t) { return (t / TMAX) * (W - 8) + 4; }
    function py(s) { return H - s * (H - 14) - 7; }
    function s0(t) { return Math.exp(-r0 * t); }
    function curvePath(pw) {
      var p = '', N = 80;
      for (var i = 0; i <= N; i++) { var t = TMAX * i / N, s = Math.pow(s0(t), pw); p += (i ? ' L' : 'M') + px(t).toFixed(1) + ',' + py(s).toFixed(1); }
      return p;
    }
    function draw() {
      var half = '<line x1="4" y1="' + py(0.5).toFixed(1) + '" x2="' + W + '" y2="' + py(0.5).toFixed(1) + '" stroke="' + P.line2 + '" stroke-width="1" stroke-dasharray="4 3"/>';
      var med0 = Math.log(2) / r0, med1 = Math.log(2) / (r0 * HR);
      plot.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block;border:1px solid ' + P.line + ';border-radius:8px" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Two survival curves under a hazard ratio">' +
        half +
        '<path d="' + curvePath(1) + '" fill="none" stroke="' + P.mut + '" stroke-width="2" stroke-dasharray="5 3"/>' +
        '<path d="' + curvePath(HR) + '" fill="none" stroke="' + (HR > 1 ? P.bad : HR < 1 ? P.acc : P.mut) + '" stroke-width="2.4"/>' +
        '<text x="6" y="12" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">S(t)</text>' +
        '<text x="' + (W - 6) + '" y="' + (H - 2) + '" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">time</text></svg>';
      read.innerHTML = 'Dashed grey is the <b>baseline</b> group; the solid line is <b>S(t) = S0(t)<sup>' + HR.toFixed(1) + '</sup></b>. ' +
        (HR > 1 ? 'HR ' + HR.toFixed(1) + ' &gt; 1: <b style="color:' + P.bad + '">' + HR.toFixed(1) + '&times; the hazard</b>, so the curve drops faster and median survival falls from ' + med0.toFixed(0) + ' to ' + med1.toFixed(0) + '.'
         : HR < 1 ? 'HR ' + HR.toFixed(1) + ' &lt; 1: <b style="color:' + P.acc + '">protective</b>, half the hazard, so median survival rises from ' + med0.toFixed(0) + ' to ' + med1.toFixed(0) + '.'
         : 'HR = 1: identical hazard, the curves coincide.') +
        ' Under proportional hazards the two curves never cross.';
    }
    u.wireSeg(el.querySelector('.hr-seg'), function (v) { HR = parseFloat(v); draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Cox proportional hazards: read each coefficient as a hazard ratio.',
      'library(survival)',
      'set.seed(2)',
      'n      <- 150',
      'age    <- round(runif(n, 40, 80))',
      'smoker <- rbinom(n, 1, 0.4)',
      'lp      <- 0.03 * (age - 60) + 0.8 * smoker      # the true log-hazard',
      'event_t <- rexp(n, 0.02 * exp(lp)); cens_t <- runif(n, 0, 60)',
      'time    <- pmin(event_t, cens_t); status <- as.integer(event_t <= cens_t)',
      '',
      'cox <- coxph(Surv(time, status) ~ age + smoker)',
      'round(exp(coef(cox)), 3)                          # hazard ratios',
      '# smoker ~ 1.6x the hazard, and each extra year of age ~ 1.04x;',
      '# a hazard ratio scales the whole survival curve, S1(t) = S0(t)^HR.'
    ].join('\n');
  }

  window.LessonWidgets.register('hazard-ratio', mount);
})();
