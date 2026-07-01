/* assoc-rules.js - market-basket rules. A handful of baskets; pick a rule "if X then Y"
 * and read its three numbers: support (how often X and Y appear together), confidence
 * (of baskets with X, how many also have Y), and lift (how much more than chance). Lift
 * above 1 is a real association. Emits runnable R that computes the three by hand.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  var BASKETS = [
    ['bread', 'butter', 'milk'], ['bread', 'butter'], ['bread', 'milk'],
    ['beer', 'chips'], ['bread', 'butter', 'jam'], ['beer', 'chips', 'salsa'],
    ['bread', 'butter'], ['milk', 'cereal'], ['beer', 'chips'], ['bread', 'jam']
  ];
  var RULES = [['bread', 'butter'], ['beer', 'chips'], ['bread', 'milk'], ['butter', 'jam']];

  function mount(el, cfg) {
    cfg = cfg || {}; var ri = 0;
    function metrics(x, y) {
      var n = BASKETS.length, X = 0, XY = 0, Y = 0;
      BASKETS.forEach(function (b) { var hx = b.indexOf(x) >= 0, hy = b.indexOf(y) >= 0; if (hx) X++; if (hy) Y++; if (hx && hy) XY++; });
      var supp = XY / n, conf = X ? XY / X : 0, lift = (Y / n) ? conf / (Y / n) : 0;
      return { supp: supp, conf: conf, lift: lift };
    }
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div style="font:600 10px/1 IBM Plex Mono,monospace;letter-spacing:.06em;text-transform:uppercase;color:' + P.faint + ';margin:0 0 8px">pick a rule</div>' +
      '<div class="ar-seg" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px"></div>' +
      '<div class="ar-bars"></div>' +
      '<div class="ar-read" style="font:13px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:10px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Compute support, confidence and lift in R' });

    var seg = el.querySelector('.ar-seg'), bars = el.querySelector('.ar-bars'), read = el.querySelector('.ar-read');
    RULES.forEach(function (r, i) {
      var b = document.createElement('button'); b.innerHTML = r[0] + ' &rarr; ' + r[1];
      b.style.cssText = 'font:600 12px IBM Plex Sans,sans-serif;border:1px solid ' + P.line + ';border-radius:8px;padding:6px 11px;cursor:pointer';
      b.addEventListener('click', function () { ri = i; draw(); });
      seg.appendChild(b);
    });
    function bar(lab, v, max, fmt) {
      return '<div style="display:flex;align-items:center;gap:9px;margin:7px 0"><span style="font:11px IBM Plex Mono,monospace;color:' + P.mut + ';width:78px">' + lab + '</span>' +
        '<span style="flex:1;height:13px;border-radius:4px;background:' + P.line + ';overflow:hidden;display:block"><i style="display:block;height:100%;width:' + Math.min(100, v / max * 100).toFixed(0) + '%;background:' + (lab === 'lift' && v >= 1 ? P.acc : (lab === 'lift' ? (P.c2 || '#c9a24a') : P.c0)) + '"></i></span>' +
        '<span style="font:11px IBM Plex Mono,monospace;color:' + P.ink + ';width:40px;text-align:right">' + fmt + '</span></div>';
    }
    function draw() {
      seg.querySelectorAll('button').forEach(function (x, i) { var on = i === ri; x.style.background = on ? P.ink : '#fff'; x.style.color = on ? '#fff' : P.body; });
      var r = RULES[ri], m = metrics(r[0], r[1]);
      bars.innerHTML = bar('support', m.supp, 1, (m.supp * 100).toFixed(0) + '%') + bar('confidence', m.conf, 1, (m.conf * 100).toFixed(0) + '%') + bar('lift', m.lift, 3, m.lift.toFixed(2));
      read.innerHTML = 'Buyers of <b>' + r[0] + '</b> take <b>' + r[1] + '</b> ' + (m.conf * 100).toFixed(0) + '% of the time, and lift <b>' + m.lift.toFixed(2) + '</b> means that is <b>' + (m.lift >= 1 ? (m.lift.toFixed(1) + 'x more likely than chance - a real association worth acting on') : 'no more likely than chance - not a useful rule') + '</b>.';
    }
    draw();
  }

  function rcode() {
    return [
      '# Association rules score "if X then Y" with three numbers.',
      'baskets <- list(c("bread","butter","milk"), c("bread","butter"), c("bread","milk"),',
      '                c("beer","chips"), c("bread","butter","jam"), c("beer","chips"))',
      'has <- function(it) sapply(baskets, function(b) it %in% b)',
      'n <- length(baskets)',
      '',
      'support    <- mean(has("bread") & has("butter"))       # X and Y together',
      'confidence <- sum(has("bread") & has("butter")) / sum(has("bread"))',
      'lift       <- confidence / mean(has("butter"))         # > 1 = real association',
      'c(support = support, confidence = confidence, lift = lift)'
    ].join('\n');
  }

  window.LessonWidgets.register('assoc-rules', mount);
})();
