/* process-flow.js - a numbered N-step pipeline as a vertical flow diagram.
 * Static. Reads well on desktop and narrow screens (single column).
 * cfg (optional): { steps:[{title, sub}] }
 */
(function () {
  'use strict';
  var INK = '#131720', MUT = '#677084', ACC = '#1f7a55', BG = '#f3f6f4', LINE = '#c5cdda';
  var _uid = 0;

  function mount(el, cfg) {
    cfg = cfg || {};
    var steps = (cfg.steps && cfg.steps.length) ? cfg.steps : [
      { title: 'Bootstrap', sub: 'grow each tree on its own random resample of the rows' },
      { title: 'Random features', sub: 'at each split, consider only a random subset (mtry)' },
      { title: 'Average', sub: 'all trees vote; the majority or mean is the forest answer' }
    ];
    var n = steps.length, boxH = 62, gap = 24, padY = 6;
    var H = padY * 2 + n * boxH + (n - 1) * gap, mid = 'pf-ar' + (++_uid), out = '', i;
    for (i = 0; i < n; i++) {
      var y = padY + i * (boxH + gap), cy = y + boxH / 2;
      out += '<rect x="8" y="' + y + '" width="444" height="' + boxH + '" rx="11" fill="' + BG + '" stroke="' + LINE + '" stroke-width="1.5"/>' +
        '<circle cx="40" cy="' + cy + '" r="16" fill="' + ACC + '"/>' +
        '<text x="40" y="' + (cy + 5) + '" text-anchor="middle" fill="#fff" font-family="IBM Plex Mono, monospace" font-size="15" font-weight="700">' + (i + 1) + '</text>' +
        '<text x="68" y="' + (y + 26) + '" fill="' + INK + '" font-family="IBM Plex Mono, monospace" font-size="14" font-weight="700">' + steps[i].title + '</text>' +
        '<text x="68" y="' + (y + 46) + '" fill="' + MUT + '" font-family="IBM Plex Mono, monospace" font-size="11">' + steps[i].sub + '</text>';
      if (i < n - 1) out += '<line x1="40" y1="' + (y + boxH + 2) + '" x2="40" y2="' + (y + boxH + gap - 4) + '" stroke="' + MUT + '" stroke-width="2" marker-end="url(#' + mid + ')"/>';
    }
    var svg = '<svg viewBox="0 0 460 ' + H + '" width="100%" style="max-width:460px;display:block;margin:0 auto" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + n + '-step process flow">' +
      '<defs><marker id="' + mid + '" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="' + MUT + '"/></marker></defs>' + out + '</svg>';
    el.innerHTML = '<div class="lw-diagram">' + svg + '</div>';
  }
  if (window.LessonWidgets) window.LessonWidgets.register('process-flow', mount);
})();
