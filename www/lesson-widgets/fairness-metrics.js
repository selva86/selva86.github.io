/* fairness-metrics.js - the same model, two groups. Bars compare group A and group B on
 * selection rate, true-positive rate and false-positive rate. Switch the fairness
 * definition and watch which one the model satisfies and which it violates - the
 * impossibility result is that you usually cannot satisfy all of them at once. Emits
 * runnable R that computes per-group rates from predictions.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  // per-group rates (group A advantaged); selection / TPR / FPR
  var G = { A: { sel: 0.46, tpr: 0.82, fpr: 0.20 }, B: { sel: 0.28, tpr: 0.66, fpr: 0.19 } };
  var DEFS = {
    parity: { keys: ['sel'], labels: ['selection rate'], say: 'Demographic parity asks for equal <b>selection rates</b>. Here A is picked 46% vs B 28% - a clear gap.' },
    opportunity: { keys: ['tpr'], labels: ['true-positive rate'], say: 'Equal opportunity asks for equal <b>true-positive rates</b> among the truly qualified. A 0.82 vs B 0.66 - the model finds qualified A\'s more often.' },
    odds: { keys: ['tpr', 'fpr'], labels: ['true-positive rate', 'false-positive rate'], say: 'Equalised odds needs BOTH rates equal. FPRs match (~0.20) but TPRs do not - so this fails too.' }
  };

  function mount(el, cfg) {
    cfg = cfg || {}; var def = 'parity';
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="fm-seg" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px"></div>' +
      '<div class="fm-bars"></div>' +
      '<div class="fm-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:10px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Compute per-group rates in R' });

    var seg = el.querySelector('.fm-seg'), barsEl = el.querySelector('.fm-bars'), read = el.querySelector('.fm-read');
    [['parity', 'demographic parity'], ['opportunity', 'equal opportunity'], ['odds', 'equalised odds']].forEach(function (o) {
      var b = document.createElement('button'); b.textContent = o[1];
      b.style.cssText = 'font:600 12px IBM Plex Sans,sans-serif;border:1px solid ' + P.line + ';border-radius:8px;padding:6px 11px;cursor:pointer';
      b.addEventListener('click', function () { def = o[0]; draw(); });
      seg.appendChild(b);
    });
    function group(metricKey, lab) {
      var a = G.A[metricKey], b = G.B[metricKey], gap = Math.abs(a - b);
      function row(name, v, col) { return '<div style="display:flex;align-items:center;gap:9px;margin:4px 0"><span style="font:11px IBM Plex Mono,monospace;color:' + P.mut + ';width:62px">' + name + '</span><span style="flex:1;height:14px;border-radius:4px;background:' + P.line + ';overflow:hidden;display:block"><i style="display:block;height:100%;width:' + (v * 100).toFixed(0) + '%;background:' + col + '"></i></span><span style="font:11px IBM Plex Mono,monospace;color:' + P.ink + ';width:38px;text-align:right">' + v.toFixed(2) + '</span></div>'; }
      return '<div style="margin:0 0 12px"><div style="font:600 11px IBM Plex Sans,sans-serif;color:' + P.ink + ';margin:0 0 3px">' + lab + (gap > 0.05 ? ' <span style="color:' + (P.c2 || '#c9a24a') + '">gap ' + gap.toFixed(2) + '</span>' : ' <span style="color:' + P.add + '">matched</span>') + '</div>' + row('group A', a, P.c0) + row('group B', b, P.acc) + '</div>';
    }
    function draw() {
      seg.querySelectorAll('button').forEach(function (x, i) { var on = ['parity', 'opportunity', 'odds'][i] === def; x.style.background = on ? P.ink : '#fff'; x.style.color = on ? '#fff' : P.body; });
      var d = DEFS[def]; barsEl.innerHTML = d.keys.map(function (k, i) { return group(k, d.labels[i]); }).join(''); read.innerHTML = d.say;
    }
    draw();
  }

  function rcode() {
    return [
      '# Fairness compares the SAME model across groups. Compute the rates per group.',
      'set.seed(1); n <- 400',
      'grp  <- sample(c("A","B"), n, replace = TRUE)',
      'true <- rbinom(n, 1, ifelse(grp == "A", 0.5, 0.4))',
      'pred <- rbinom(n, 1, ifelse(grp == "A", 0.46, 0.28))   # model selects A more',
      '',
      'rate <- function(g) c(',
      '  selection = mean(pred[grp == g]),',
      '  TPR = mean(pred[grp == g & true == 1]),',
      '  FPR = mean(pred[grp == g & true == 0]))',
      'rbind(A = rate("A"), B = rate("B"))     # compare the rows'
    ].join('\n');
  }

  window.LessonWidgets.register('fairness-metrics', mount);
})();
