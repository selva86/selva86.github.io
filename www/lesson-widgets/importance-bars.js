/* importance-bars.js - variable importance as sorted horizontal bars.
 * An illustrative ranking for the lesson's churn example (consistent with the
 * running narrative), not a measured benchmark. Static.
 * cfg (optional): { items:[{label,value}] }
 */
(function () {
  'use strict';
  var INK = '#131720', MUT = '#677084', BAR = '#1f7a55', TOP = '#2563a8';

  function mount(el, cfg) {
    cfg = cfg || {};
    var items = (cfg.items && cfg.items.length) ? cfg.items.slice() : [
      { label: 'tenure', value: 100 }, { label: 'monthly spend', value: 71 },
      { label: 'total spend', value: 58 }, { label: 'support calls', value: 34 },
      { label: 'contract type', value: 22 }, { label: 'age', value: 12 }
    ];
    items.sort(function (a, b) { return b.value - a.value; });
    var max = items[0].value || 1, n = items.length;
    var rowH = 30, padT = 12, padB = 8, labW = 120, barX = labW + 8, barMax = 280;
    var H = padT + n * rowH + padB, W = barX + barMax + 46, rows = '', i;
    for (i = 0; i < n; i++) {
      var y = padT + i * rowH, bw = Math.max(2, items[i].value / max * barMax), col = i === 0 ? TOP : BAR;
      rows += '<text x="' + labW + '" y="' + (y + 18) + '" text-anchor="end" fill="' + INK + '" font-family="IBM Plex Mono, monospace" font-size="12" font-weight="600">' + items[i].label + '</text>' +
        '<rect x="' + barX + '" y="' + (y + 5) + '" width="' + bw + '" height="18" rx="4" fill="' + col + '"/>' +
        '<text x="' + (barX + bw + 6) + '" y="' + (y + 18) + '" fill="' + MUT + '" font-family="IBM Plex Mono, monospace" font-size="11">' + items[i].value + '</text>';
    }
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block;margin:0 auto" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Variable importance ranking, ' + items[0].label + ' highest.">' + rows + '</svg>';
    el.innerHTML = '<div class="lw-diagram">' + svg + '</div>';
  }
  if (window.LessonWidgets) window.LessonWidgets.register('importance-bars', mount);
})();
