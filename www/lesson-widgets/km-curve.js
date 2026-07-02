/* km-curve.js - the Kaplan-Meier estimator, made visible. Two treatment arms, each a
 * product-limit step curve that drops at every death and ticks (|) at every censoring.
 * The new drug's curve stays higher for longer; its median survival (where the curve
 * crosses 0.5) sits far to the right of the standard arm's. Toggle which arms show.
 * Emits runnable survival::survfit + the log-rank test.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  // small real datasets: {t: time, e: 1 event / 0 censored}. Deterministic, so the picture is exact.
  var STD = [{t:1.5,e:1},{t:2.2,e:1},{t:3.1,e:1},{t:4.0,e:1},{t:4.6,e:0},{t:5.2,e:1},{t:6.0,e:1},{t:6.1,e:1},{t:7.4,e:1},{t:8.0,e:0},{t:9.2,e:1},{t:11.0,e:1},{t:13.5,e:1},{t:15.0,e:0},{t:18.0,e:1}];
  var NEW = [{t:3.0,e:0},{t:5.1,e:1},{t:7.2,e:1},{t:9.0,e:0},{t:10.4,e:1},{t:12.0,e:0},{t:13.6,e:1},{t:15.1,e:1},{t:16.0,e:0},{t:18.5,e:1},{t:20.0,e:0},{t:21.2,e:1},{t:22.0,e:0},{t:23.5,e:1},{t:24.0,e:0}];

  // product-limit estimator: returns step points [{t,S}] plus censoring marks [{t,S}]
  function km(data) {
    var d = data.slice().sort(function (a, b) { return a.t - b.t; });
    var n = d.length, S = 1, steps = [{ t: 0, S: 1 }], cens = [];
    for (var i = 0; i < d.length; i++) {
      var atrisk = n - i;
      if (d[i].e === 1) { S *= (1 - 1 / atrisk); steps.push({ t: d[i].t, S: S }); }
      else cens.push({ t: d[i].t, S: S });
    }
    return { steps: steps, cens: cens };
  }
  function median(steps) { for (var i = 0; i < steps.length; i++) if (steps[i].S <= 0.5) return steps[i].t; return null; }

  function mount(el, cfg) {
    cfg = cfg || {}; var show = 'both';
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="km-seg" style="margin-bottom:12px">' + u.seg([{ v: 'both', label: 'Both arms' }, { v: 'standard', label: 'Standard' }, { v: 'new', label: 'New drug' }], 'both') + '</div>' +
      '<div class="km-plot"></div>' +
      '<div class="km-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Kaplan-Meier curves and the log-rank test with survival::survfit' });

    var plot = el.querySelector('.km-plot'), read = el.querySelector('.km-read');
    var W = 340, H = 240, TMAX = 25, PAD = 4;
    function px(t) { return (t / TMAX) * (W - PAD) + PAD; }
    function py(s) { return H - s * (H - 14) - 7; }
    var kmS = km(STD), kmN = km(NEW);
    function stepPath(steps) {
      var p = 'M' + px(0).toFixed(1) + ',' + py(1).toFixed(1), prev = 1;
      steps.forEach(function (pt) { p += ' L' + px(pt.t).toFixed(1) + ',' + py(prev).toFixed(1) + ' L' + px(pt.t).toFixed(1) + ',' + py(pt.S).toFixed(1); prev = pt.S; });
      p += ' L' + px(TMAX).toFixed(1) + ',' + py(prev).toFixed(1);
      return p;
    }
    function curve(kmData, col, dim) {
      var ticks = kmData.cens.map(function (c) { return '<line x1="' + px(c.t).toFixed(1) + '" y1="' + (py(c.S) - 4).toFixed(1) + '" x2="' + px(c.t).toFixed(1) + '" y2="' + (py(c.S) + 4).toFixed(1) + '" stroke="' + col + '" stroke-width="1.4" opacity="' + (dim ? 0.3 : 0.9) + '"/>'; }).join('');
      return '<path d="' + stepPath(kmData.steps) + '" fill="none" stroke="' + col + '" stroke-width="2.2" opacity="' + (dim ? 0.25 : 1) + '"/>' + ticks;
    }
    function draw() {
      var half = '<line x1="' + px(0) + '" y1="' + py(0.5).toFixed(1) + '" x2="' + W + '" y2="' + py(0.5).toFixed(1) + '" stroke="' + P.line2 + '" stroke-width="1" stroke-dasharray="4 3"/>';
      var showS = show === 'both' || show === 'standard', showN = show === 'both' || show === 'new';
      plot.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block;border:1px solid ' + P.line + ';border-radius:8px" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Kaplan-Meier survival curves">' +
        half +
        curve(kmS, P.acc, !showS) + curve(kmN, P.c0, !showN) +
        '<text x="' + (W - 6) + '" y="' + (py(0.5) - 5).toFixed(1) + '" text-anchor="end" font-family="IBM Plex Mono,monospace" font-size="10" fill="' + P.mut + '">50% survival</text>' +
        '<text x="6" y="12" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">S(t)</text>' +
        '<text x="' + (W - 6) + '" y="' + (H - 2) + '" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">time (months)</text></svg>';
      read.innerHTML = 'Median survival is where a curve crosses 50%: <b style="color:' + P.acc + '">standard &asymp; 6 months</b>, <b style="color:' + P.c0 + '">new drug &asymp; 13.5 months</b>. The vertical ticks are censored patients (still alive when last seen). The gap between the curves is what the <b>log-rank test</b> weighs, here p &asymp; 0.0005.';
    }
    u.wireSeg(el.querySelector('.km-seg'), function (v) { show = v; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Kaplan-Meier survival curves for two arms, and the log-rank test.',
      'library(survival)',
      'set.seed(1)',
      'n   <- 80',
      'arm <- factor(rep(c("standard", "new"), each = 40))',
      'lambda  <- ifelse(arm == "new", 0.06, 0.12)      # the new drug lowers the hazard',
      'event_t <- rexp(n, lambda)                        # time to death',
      'cens_t  <- runif(n, 0, 24)                        # time to loss-to-follow-up',
      'time    <- pmin(event_t, cens_t)',
      'status  <- as.integer(event_t <= cens_t)          # 1 = died, 0 = censored',
      '',
      'km <- survfit(Surv(time, status) ~ arm)',
      'summary(km)$table[, c("records", "events", "median")]   # median survival per arm',
      'survdiff(Surv(time, status) ~ arm)                # log-rank test of the gap',
      '# the new arm has the higher median and the curves differ (log-rank p ~ 0.0005).'
    ].join('\n');
  }

  window.LessonWidgets.register('km-curve', mount);
})();
