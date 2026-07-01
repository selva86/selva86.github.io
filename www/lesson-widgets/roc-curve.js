/* roc-curve.js - threshold, confusion matrix and ROC, linked.
 * Two score clouds (actual positives skew high, negatives skew low) overlap.
 * Slide the threshold: the confusion matrix re-counts and the operating point
 * slides along the ROC curve. Shows why one number (accuracy) hides the trade.
 * Emits runnable R that sweeps the threshold and computes the ROC + AUC by hand.
 *
 * cfg: { }  - renders from {}.
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  var POS = [0.92, 0.86, 0.8, 0.74, 0.7, 0.64, 0.6, 0.54, 0.46, 0.4];
  var NEG = [0.6, 0.5, 0.46, 0.4, 0.34, 0.3, 0.25, 0.2, 0.14, 0.1];

  function mount(el, cfg) {
    cfg = cfg || {};
    var thr = 0.5;
    function counts(t) {
      var tp = 0, fn = 0, fp = 0, tn = 0;
      POS.forEach(function (s) { (s >= t ? tp++ : fn++); });
      NEG.forEach(function (s) { (s >= t ? fp++ : tn++); });
      return { tp: tp, fn: fn, fp: fp, tn: tn, tpr: tp / (tp + fn), fpr: fp / (fp + tn) };
    }
    // full ROC sweep
    var ROC = []; for (var t = 1.02; t >= -0.02; t -= 0.02) { var c = counts(t); ROC.push([c.fpr, c.tpr]); }
    var auc = 0; for (var i = 1; i < ROC.length; i++) auc += (ROC[i][0] - ROC[i - 1][0]) * (ROC[i][1] + ROC[i - 1][1]) / 2;

    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div style="display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start">' +
        '<div class="rc-roc" style="flex:1 1 230px;min-width:210px"></div>' +
        '<div class="rc-cm" style="flex:1 1 200px;min-width:190px"></div>' +
      '</div>' +
      '<label style="display:block;font:600 12.5px/1.6 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:12px 0 2px">classification threshold <b class="rc-t" style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '"></b>' +
        '<input class="rc-s" type="range" min="0.05" max="0.95" step="0.01" value="' + thr + '" style="width:100%;accent-color:' + P.acc + '"></label>' +
      '<div class="rc-read" style="font:13px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:8px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Build the ROC curve + AUC from scratch in R' });

    var roc = el.querySelector('.rc-roc'), cm = el.querySelector('.rc-cm'), read = el.querySelector('.rc-read'),
        slider = el.querySelector('.rc-s'), tEl = el.querySelector('.rc-t');

    function draw() {
      var c = counts(thr);
      // ROC panel
      var S = 220, m = 30, iw = S - m - 10, ih = S - m - 10;
      function px(f) { return m + f * iw; } function py(tp) { return (S - m) - tp * ih; }
      var line = ROC.map(function (p) { return px(p[0]).toFixed(1) + ',' + py(p[1]).toFixed(1); }).join(' ');
      var svg = '<svg viewBox="0 0 ' + S + ' ' + S + '" width="100%" style="max-width:' + S + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="ROC curve">';
      svg += '<rect x="' + m + '" y="10" width="' + iw + '" height="' + ih + '" fill="#fbfcfb" stroke="' + P.line + '"/>';
      svg += '<line x1="' + m + '" y1="' + (S - m) + '" x2="' + (m + iw) + '" y2="10" stroke="' + P.line + '" stroke-dasharray="4 3"/>';
      svg += '<polyline points="' + line + '" fill="none" stroke="' + P.c0 + '" stroke-width="2.5"/>';
      svg += '<circle cx="' + px(c.fpr).toFixed(1) + '" cy="' + py(c.tpr).toFixed(1) + '" r="6" fill="' + P.acc + '" stroke="#fff" stroke-width="1.5"/>';
      svg += '<text x="' + (m + iw / 2) + '" y="' + (S - 6) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.mut + '">false positive rate</text>';
      svg += '<text transform="translate(11,' + (10 + ih / 2) + ') rotate(-90)" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.mut + '">true positive rate</text>';
      svg += '<text x="' + (m + iw - 4) + '" y="22" text-anchor="end" font-family="IBM Plex Mono,monospace" font-size="11" fill="' + P.ink + '">AUC ' + auc.toFixed(2) + '</text>';
      svg += '</svg>';
      roc.innerHTML = svg;
      // confusion matrix
      function cell(n, lab, good) { return '<div style="border:1px solid ' + P.line + ';border-radius:7px;padding:8px 6px;text-align:center;background:' + (good ? P.add : P.del) + '"><b style="font-family:IBM Plex Mono,monospace;font-size:19px;color:' + P.ink + '">' + n + '</b><div style="font-size:10px;color:' + P.mut + '">' + lab + '</div></div>'; }
      cm.innerHTML =
        '<div style="font:600 11px/1 IBM Plex Mono,monospace;letter-spacing:.05em;text-transform:uppercase;color:' + P.faint + ';margin:0 0 7px">predicted &darr; / actual &rarr;</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">' + cell(c.tp, 'true positive', true) + cell(c.fp, 'false positive', false) + cell(c.fn, 'false negative', false) + cell(c.tn, 'true negative', true) + '</div>' +
        '<div style="font:12px/1.6 IBM Plex Mono,monospace;color:' + P.body + ';margin:9px 0 0">precision ' + (c.tp / (c.tp + c.fp) || 0).toFixed(2) + ' &middot; recall ' + c.tpr.toFixed(2) + '</div>';

      read.innerHTML = 'At threshold <b style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '">' + thr.toFixed(2) + '</b>: recall (TPR) <b>' + c.tpr.toFixed(2) + '</b>, false-positive rate <b>' + c.fpr.toFixed(2) +
        '</b>. Lowering it catches more positives but raises false alarms - you slide up the ROC curve. The curve (and its AUC) summarizes every threshold at once.';
      tEl.textContent = thr.toFixed(2);
    }
    slider.addEventListener('input', function () { thr = +slider.value; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# An ROC curve sweeps EVERY threshold. Build it by hand from scores + labels.',
      'pos <- c(0.92,0.86,0.8,0.74,0.7,0.64,0.6,0.54,0.46,0.4)   # actual positives',
      'neg <- c(0.6,0.5,0.46,0.4,0.34,0.3,0.25,0.2,0.14,0.1)     # actual negatives',
      'score  <- c(pos, neg)',
      'actual <- c(rep(1, length(pos)), rep(0, length(neg)))',
      '',
      'thr <- seq(0, 1, by = 0.02)',
      'roc <- t(sapply(thr, function(t) {',
      '  pred <- score >= t',
      '  c(FPR = sum(pred & actual == 0) / sum(actual == 0),',
      '    TPR = sum(pred & actual == 1) / sum(actual == 1))',
      '}))',
      'plot(roc[, "FPR"], roc[, "TPR"], type = "l", lwd = 2, xlab = "FPR", ylab = "TPR")',
      'abline(0, 1, lty = 2)',
      '',
      'o   <- order(roc[, "FPR"])                       # area under the curve (trapezoid)',
      'auc <- sum(diff(roc[o, "FPR"]) * (head(roc[o, "TPR"], -1) + tail(roc[o, "TPR"], -1)) / 2)',
      'auc'
    ].join('\n');
  }

  window.LessonWidgets.register('roc-curve', mount);
})();
