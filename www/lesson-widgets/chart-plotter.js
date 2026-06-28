/* chart-plotter.js - the grammar-of-graphics / chart-type chooser.
 * Same data, switchable geom (point/line/bar/histogram/boxplot); renders an instant
 * SVG preview AND a REAL runnable ggplot2 block (self-contained: builds the data frame
 * inline, then the ggplot call) so the reader can run it and see the true plot. cfg:
 *   { data:[{x,y,fill}], geoms:["point","line","bar"], x:"month", y:"sales",
 *     code:{point:"...", line:"..."} }
 * Default = a monthly sales series (point/line/bar).
 */
(function () {
  'use strict';
  var GEOML = { point: 'geom_point()', line: 'geom_line()', bar: 'geom_col()', col: 'geom_col()', histogram: 'geom_histogram(bins = 10)', boxplot: 'geom_boxplot()' };
  function mount(el, cfg) {
    var u = window.LessonWidgets.u; if (!u) return;
    cfg = cfg || {};
    var data = cfg.data || [{ x: 1, y: 12 }, { x: 2, y: 19 }, { x: 3, y: 15 }, { x: 4, y: 25 }, { x: 5, y: 22 }, { x: 6, y: 30 }];
    var geoms = cfg.geoms || ['point', 'line', 'bar'];
    var xlab = cfg.x || 'month', ylab = cfg.y || 'sales', codeMap = cfg.code || {};
    var cur = geoms[0];
    var has = data[0] || {};

    function ggline(g) {
      if (codeMap[g]) return codeMap[g];
      var aesX = (g === 'bar' || g === 'col') ? 'factor(' + xlab + ')' : xlab;
      if (g === 'histogram') return 'ggplot(df, aes(' + xlab + ')) +\n  ' + GEOML[g];
      if (g === 'boxplot') return 'ggplot(df, aes(' + xlab + ', ' + ylab + ')) +\n  ' + GEOML[g];
      return 'ggplot(df, aes(' + aesX + ', ' + ylab + ')) +\n  ' + (GEOML[g] || 'geom_point()');
    }
    // Self-contained, runnable: library + the data frame built inline + the ggplot call.
    // The frame is named to match what the ggplot code references (authors may use a
    // narrative name like `bakery`), so the block stays self-consistent and runs.
    function runnableCode(g) {
      var cols = [{ name: xlab, key: 'x' }];
      if ('y' in has) cols.push({ name: ylab, key: 'y' });
      if ('fill' in has) cols.push({ name: 'group', key: 'fill' });
      var line = ggline(g);
      var mm = line.match(/\bggplot\s*\(\s*([A-Za-z.][\w.]*)/);
      var frame = mm ? mm[1] : 'df';
      return 'library(ggplot2)\n' + u.rdf(data, cols, frame) + '\n\n' + line;
    }

    var wrap = document.createElement('div'); wrap.style.cssText = 'font-family:IBM Plex Sans,system-ui,sans-serif';
    wrap.innerHTML =
      '<div style="margin-bottom:11px"><span class="cp-seg"></span></div>' +
      '<div class="cp-code"></div>';
    var segHost = wrap.querySelector('.cp-seg'); segHost.innerHTML = u.seg(geoms.map(function (g) { return { v: g, label: g }; }), cur);
    var codeEl = wrap.querySelector('.cp-code');
    // ONE chart region: the runnable block's plot area is seeded with the instant SVG
    // preview; pressing Run clears it (webr-init) and draws the real ggplot in its place.
    function render(g) {
      codeEl.innerHTML = u.runnable(runnableCode(g), { label: 'Run this chart' });
      var po = codeEl.querySelector('.webr-plot-output');
      if (po) { po.innerHTML = u.previewSeed(u.plot(data, { geom: g, x: xlab, y: ylab, corr: g === 'point' })); po.classList.add('has-content'); }
    }
    u.wireSeg(segHost, function (v) { cur = v; render(v); });
    render(cur);
    el.innerHTML = ''; el.appendChild(wrap);
  }
  if (window.LessonWidgets) window.LessonWidgets.register('chart-plotter', mount);
})();
