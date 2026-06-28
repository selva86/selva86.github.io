/* facet-grid.js - one combined chart vs small multiples (facet_wrap).
 * cfg: { data:[{x,y,facet}], geom:"point", x, y, facetVar:"species" }
 * Toggle between a single chart (colored by facet) and one mini-chart per facet,
 * to show what facet_wrap(~var) does. Default = iris-like petal scatter by species.
 */
(function () {
  'use strict';
  function mount(el, cfg) {
    var u = window.LessonWidgets.u; if (!u) return;
    cfg = cfg || {};
    var data = cfg.data || [
      { x: 1.4, y: 0.2, facet: 'setosa' }, { x: 1.3, y: 0.2, facet: 'setosa' }, { x: 1.5, y: 0.1, facet: 'setosa' }, { x: 1.4, y: 0.3, facet: 'setosa' },
      { x: 4.7, y: 1.4, facet: 'versicolor' }, { x: 4.5, y: 1.5, facet: 'versicolor' }, { x: 4.9, y: 1.5, facet: 'versicolor' }, { x: 4.0, y: 1.3, facet: 'versicolor' },
      { x: 6.0, y: 2.5, facet: 'virginica' }, { x: 5.9, y: 2.1, facet: 'virginica' }, { x: 6.1, y: 2.3, facet: 'virginica' }, { x: 5.6, y: 1.8, facet: 'virginica' }
    ];
    var geom = cfg.geom || 'point', xlab = cfg.x || 'petal length', ylab = cfg.y || 'petal width', fvar = cfg.facetVar || 'species';
    var facets = []; data.forEach(function (d) { if (facets.indexOf(d.facet) < 0) facets.push(d.facet); });

    // R-safe column names (the display labels may contain spaces).
    var xc = (xlab || 'x').replace(/\s+/g, '_'), yc = (ylab || 'y').replace(/\s+/g, '_'), fc = (fvar || 'group').replace(/\s+/g, '_');
    function fgCode(mode) {
      var base = 'library(ggplot2)\n' + u.rdf(data, [{ name: xc, key: 'x' }, { name: yc, key: 'y' }, { name: fc, key: 'facet' }]) + '\n\n';
      return mode === 'one'
        ? base + 'ggplot(df, aes(' + xc + ', ' + yc + ', color = ' + fc + ')) +\n  geom_point()'
        : base + 'ggplot(df, aes(' + xc + ', ' + yc + ')) +\n  geom_point() +\n  facet_wrap(~ ' + fc + ')';
    }
    function fgSVG(mode) {
      if (mode === 'one') return u.plot(data, { geom: geom, x: xlab, y: ylab, w: 440, h: 260 });
      var h = '<div style="display:flex;gap:10px;flex-wrap:wrap">';
      facets.forEach(function (f) { var sub = data.filter(function (d) { return d.facet === f; });
        h += '<div style="flex:1;min-width:150px"><div style="font:600 12px/1 IBM Plex Sans,sans-serif;color:' + u.P.ink + ';text-align:center;margin-bottom:2px">' + u.esc(f) + '</div>' + u.plot(sub, { geom: geom, x: xlab, y: ylab, w: 220, h: 170 }) + '</div>'; });
      return h + '</div>';
    }
    var wrap = document.createElement('div'); wrap.style.cssText = 'font-family:IBM Plex Sans,system-ui,sans-serif';
    wrap.innerHTML = '<div style="margin-bottom:11px"><span class="fg-seg"></span></div><div class="fg-code"></div>';
    var segHost = wrap.querySelector('.fg-seg'); segHost.innerHTML = u.seg([{ v: 'one', label: 'One chart' }, { v: 'facet', label: 'facet_wrap(~' + fvar + ')' }], 'one');
    var codeEl = wrap.querySelector('.fg-code');
    // ONE chart region: seed the SVG preview into the runnable block's plot area; Run draws the real plot there.
    function render(mode) {
      codeEl.innerHTML = u.runnable(fgCode(mode), { label: 'Run this chart' });
      var po = codeEl.querySelector('.webr-plot-output');
      if (po) { po.innerHTML = u.previewSeed(fgSVG(mode)); po.classList.add('has-content'); }
    }
    u.wireSeg(segHost, function (v) { render(v); });
    render('one');
    el.innerHTML = ''; el.appendChild(wrap);
  }
  if (window.LessonWidgets) window.LessonWidgets.register('facet-grid', mount);
})();
