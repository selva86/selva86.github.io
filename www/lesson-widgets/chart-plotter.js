/* chart-plotter.js - the grammar-of-graphics / chart-type chooser.
 * Same data, switchable geom (point/line/bar/histogram/boxplot); renders the chart
 * AND the ggplot2 code that makes it, so the mapping (data -> aes -> geom) is visible.
 * On a scatter it prints Pearson r. cfg:
 *   { data:[{x,y,fill}], geoms:["point","line","bar"], x:"month", y:"sales",
 *     code:{point:"...", line:"..."} }
 * Default = a monthly sales series (point/line/bar).
 */
(function () {
  'use strict';
  var GEOML = { point: 'geom_point()', line: 'geom_line()', bar: 'geom_col()', col: 'geom_col()', histogram: 'geom_histogram()', boxplot: 'geom_boxplot()' };
  function mount(el, cfg) {
    var u = window.LessonWidgets.u; if (!u) return;
    cfg = cfg || {};
    var data = cfg.data || [{ x: 1, y: 12 }, { x: 2, y: 19 }, { x: 3, y: 15 }, { x: 4, y: 25 }, { x: 5, y: 22 }, { x: 6, y: 30 }];
    var geoms = cfg.geoms || ['point', 'line', 'bar'];
    var xlab = cfg.x || 'month', ylab = cfg.y || 'sales', codeMap = cfg.code || {};
    var cur = geoms[0];

    function codeFor(g) {
      if (codeMap[g]) return codeMap[g];
      var aesX = (g === 'bar' || g === 'col') ? 'factor(' + xlab + ')' : ((g === 'histogram') ? xlab : xlab);
      if (g === 'histogram') return 'ggplot(df, aes(' + xlab + ')) +\n  ' + GEOML[g];
      if (g === 'boxplot') return 'ggplot(df, aes(' + xlab + ', ' + ylab + ')) +\n  ' + GEOML[g];
      return 'ggplot(df, aes(' + aesX + ', ' + ylab + ')) +\n  ' + (GEOML[g] || 'geom_point()');
    }
    var wrap = document.createElement('div'); wrap.style.cssText = 'font-family:IBM Plex Sans,system-ui,sans-serif';
    wrap.innerHTML =
      '<div style="margin-bottom:11px"><span class="cp-seg"></span></div>' +
      '<div style="display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start">' +
        '<div class="cp-plot" style="flex:1;min-width:280px"></div>' +
        '<div class="cp-code" style="flex:1;min-width:220px"></div>' +
      '</div>';
    var segHost = wrap.querySelector('.cp-seg'); segHost.innerHTML = u.seg(geoms.map(function (g) { return { v: g, label: g }; }), cur);
    var plotEl = wrap.querySelector('.cp-plot'), codeEl = wrap.querySelector('.cp-code');
    function render(g) { plotEl.innerHTML = u.plot(data, { geom: g, x: xlab, y: ylab, corr: g === 'point' }); codeEl.innerHTML = u.code(codeFor(g)); }
    u.wireSeg(segHost, function (v) { cur = v; render(v); });
    render(cur);
    el.innerHTML = ''; el.appendChild(wrap);
  }
  if (window.LessonWidgets) window.LessonWidgets.register('chart-plotter', mount);
})();
