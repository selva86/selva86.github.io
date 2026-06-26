/* gini-split.js - one decision-tree split shown as a purity (Gini) drop.
 * A mixed parent node splits into two purer children; every Gini value is
 * computed from the real counts, not hard-coded. Static by design.
 * cfg (optional): { feature, parent:[stay,churn], left:[stay,churn],
 *                   right:[stay,churn], labels:{stay,churn} }
 */
(function () {
  'use strict';
  var C_STAY = '#2563a8', C_CHURN = '#b5631a', INK = '#131720', MUT = '#677084', LINE = '#c5cdda';

  function gini(a, b) { var n = a + b; if (!n) return 0; var p = a / n, q = b / n; return 1 - p * p - q * q; }
  function f2(x) { return (Math.round(x * 100) / 100).toFixed(2); }

  function dots(cx, cy, stay, churn) {
    var n = stay + churn, per = 10, gap = 12, out = '', i;
    var cols = Math.min(n, per), w = (cols - 1) * gap, x0 = cx - w / 2;
    for (i = 0; i < n; i++) {
      var col = i % per, row = (i / per) | 0, fill = i < stay ? C_STAY : C_CHURN;
      out += '<circle cx="' + (x0 + col * gap) + '" cy="' + (cy + row * gap) + '" r="4.4" fill="' + fill + '"/>';
    }
    return out;
  }
  function nodeBox(cx, top, w, h) {
    return '<rect x="' + (cx - w / 2) + '" y="' + top + '" width="' + w + '" height="' + h + '" rx="9" fill="#fff" stroke="' + LINE + '" stroke-width="1.5"/>';
  }
  function txt(x, y, s, col, fs, weight) {
    return '<text x="' + x + '" y="' + y + '" text-anchor="middle" fill="' + (col || INK) +
      '" font-family="IBM Plex Mono, monospace" font-size="' + (fs || 11) + '" font-weight="' + (weight || 600) + '">' + s + '</text>';
  }

  function mount(el, cfg) {
    cfg = cfg || {};
    var feature = cfg.feature || 'tenure under 8 mo?';
    var P = cfg.parent || [10, 10], L = cfg.left || [2, 8], R = cfg.right || [8, 2];
    var ln = cfg.labels || {}, sName = ln.stay || 'stays', cName = ln.churn || 'churns';
    var gp = gini(P[0], P[1]), gl = gini(L[0], L[1]), gr = gini(R[0], R[1]);
    var nL = L[0] + L[1], nR = R[0] + R[1], nT = nL + nR;
    var gw = nT ? (nL / nT) * gl + (nR / nT) * gr : 0;

    var svg =
      '<svg viewBox="0 0 460 300" width="100%" style="max-width:480px;display:block;margin:0 auto" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A split lowers Gini impurity from ' + f2(gp) + ' to ' + f2(gw) + '.">' +
      nodeBox(230, 8, 220, 60) + dots(230, 28, P[0], P[1]) + txt(230, 60, 'parent: Gini = ' + f2(gp), MUT, 11) +
      '<line x1="230" y1="68" x2="120" y2="150" stroke="' + LINE + '" stroke-width="2"/>' +
      '<line x1="230" y1="68" x2="340" y2="150" stroke="' + LINE + '" stroke-width="2"/>' +
      txt(230, 92, feature, INK, 11) + txt(158, 116, 'yes', MUT, 10) + txt(302, 116, 'no', MUT, 10) +
      nodeBox(120, 150, 170, 58) + dots(120, 170, L[0], L[1]) + txt(120, 200, 'Gini = ' + f2(gl), MUT, 11) +
      nodeBox(340, 150, 170, 58) + dots(340, 170, R[0], R[1]) + txt(340, 200, 'Gini = ' + f2(gr), MUT, 11) +
      txt(230, 250, 'weighted Gini = ' + f2(gw), INK, 14, 700) +
      txt(230, 272, 'down from ' + f2(gp) + ': a purer split', '#1f7a55', 11) +
      '</svg>';
    el.innerHTML = '<div class="lw-diagram">' +
      '<div style="text-align:center;font:600 11px/1.4 \'IBM Plex Mono\',monospace;color:' + MUT + ';margin-bottom:2px">' +
      '<span style="color:' + C_STAY + '">&#9679;</span> ' + sName + ' &nbsp; <span style="color:' + C_CHURN + '">&#9679;</span> ' + cName + '</div>' +
      svg + '</div>';
  }
  if (window.LessonWidgets) window.LessonWidgets.register('gini-split', mount);
})();
