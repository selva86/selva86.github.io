/* competing-risks.js - cumulative incidence when events compete. A patient can relapse OR
 * die first, never both; each event "uses up" patients the other can no longer claim. The
 * stacked bands show, at every time, the fraction still event-free (top), the fraction who
 * have relapsed, and the fraction who have died - always summing to 1. Naive "1 minus KM"
 * per cause would overcount; the cumulative incidence function (CIF) shares the risk
 * correctly. Toggle a time point to read the split. Emits a runnable multi-state survfit.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  // cause-specific: total event hazard h, relapse share 0.6, death share 0.4 (matches the R below)
  var H = 0.08, pRel = 0.6, pDeath = 0.4;
  function surv(t) { return Math.exp(-H * t); }
  function cifRel(t) { return pRel * (1 - surv(t)); }
  function cifDeath(t) { return pDeath * (1 - surv(t)); }

  function mount(el, cfg) {
    cfg = cfg || {}; var mark = 10;
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="cr-seg" style="margin-bottom:12px">' + u.seg([{ v: '5', label: 't = 5' }, { v: '10', label: 't = 10' }, { v: '20', label: 't = 20' }], '10') + '</div>' +
      '<div class="cr-plot"></div>' +
      '<div class="cr-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Cumulative incidence for competing events with survival::survfit' });

    var plot = el.querySelector('.cr-plot'), read = el.querySelector('.cr-read');
    var W = 340, H2 = 240, TMAX = 30;
    function px(t) { return (t / TMAX) * (W - 8) + 4; }
    function py(v) { return H2 - v * (H2 - 14) - 7; }
    // stacked bands: bottom relapse [0, cifRel], middle death [cifRel, cifRel+cifDeath], top survivors [.., 1]
    function band(lo, hi, col, op) {
      var N = 80, top = [], bot = [];
      for (var i = 0; i <= N; i++) { var t = TMAX * i / N; top.push([px(t), py(hi(t))]); bot.push([px(t), py(lo(t))]); }
      var p = 'M' + top.map(function (q) { return q[0].toFixed(1) + ',' + q[1].toFixed(1); }).join(' L') + ' L' + bot.reverse().map(function (q) { return q[0].toFixed(1) + ',' + q[1].toFixed(1); }).join(' L') + ' Z';
      return '<path d="' + p + '" fill="' + col + '" opacity="' + op + '"/>';
    }
    function draw() {
      var r = cifRel(mark), d = cifDeath(mark), s = surv(mark);
      var mx = px(mark).toFixed(1);
      plot.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H2 + '" width="100%" style="max-width:' + W + 'px;display:block;border:1px solid ' + P.line + ';border-radius:8px" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Stacked cumulative incidence">' +
        band(function () { return 0; }, cifRel, P.c0, 0.5) +
        band(cifRel, function (t) { return cifRel(t) + cifDeath(t); }, P.bad, 0.45) +
        band(function (t) { return cifRel(t) + cifDeath(t); }, function () { return 1; }, P.acc, 0.28) +
        '<line x1="' + mx + '" y1="0" x2="' + mx + '" y2="' + H2 + '" stroke="' + P.ink + '" stroke-width="1.4" stroke-dasharray="3 2"/>' +
        '<text x="8" y="' + (py(0.5 * cifRel(28)) + 4).toFixed(1) + '" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.ink + '">relapse</text>' +
        '<text x="8" y="' + (py(cifRel(28) + 0.5 * cifDeath(28)) + 4).toFixed(1) + '" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.ink + '">death</text>' +
        '<text x="8" y="20" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.mut + '">event-free</text>' +
        '<text x="' + (W - 6) + '" y="' + (H2 - 2) + '" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">time (months)</text></svg>';
      read.innerHTML = 'At <b>t = ' + mark + '</b> months: <b style="color:' + P.acc + '">' + (s * 100).toFixed(0) + '% event-free</b>, <b style="color:' + P.c0 + '">' + (r * 100).toFixed(0) + '% have relapsed</b>, <b style="color:' + P.bad + '">' + (d * 100).toFixed(0) + '% have died</b>. The three always sum to 100%: each event removes patients the other can no longer claim, which is why you share the risk with a CIF instead of treating each cause on its own.';
    }
    u.wireSeg(el.querySelector('.cr-seg'), function (v) { mark = parseFloat(v); draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Competing risks: cumulative incidence when relapse and death compete.',
      'library(survival)',
      'set.seed(3)',
      'n      <- 250',
      'event_t <- rexp(n, 0.08)                          # time to the first event',
      'etype   <- sample(1:2, n, TRUE, c(0.6, 0.4))       # 1 = relapse, 2 = death',
      'cens_t  <- runif(n, 0, 30)',
      'time    <- pmin(event_t, cens_t)',
      'status  <- ifelse(event_t <= cens_t, etype, 0)     # 0 = censored',
      'ev      <- factor(status, 0:2, c("censored", "relapse", "death"))',
      '',
      'fit <- survfit(Surv(time, ev) ~ 1)                # multi-state = competing risks',
      'summary(fit, times = c(5, 10, 20))$pstate         # CIF per state over time',
      '# relapse and death incidences plus the event-free fraction sum to 1 at every time.'
    ].join('\n');
  }

  window.LessonWidgets.register('competing-risks', mount);
})();
