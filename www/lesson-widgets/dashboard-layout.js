/* dashboard-layout.js - a mini dashboard: a filter input drives value boxes + chart
 * tiles, to show the reactive layout of a Quarto dashboard / Shiny app (one input ->
 * many outputs update). cfg: { filterLabel, views:{ name:{ boxes:[[label,value]],
 * line:[{x,y}], bar:[{x,y}] } } }. Default = sales by region.
 */
(function () {
  'use strict';
  function mount(el, cfg) {
    var u = window.LessonWidgets.u; if (!u) return;
    cfg = cfg || {};
    var views = cfg.views || {
      All: { boxes: [['Revenue', '$1.20M'], ['Orders', '8,432'], ['Avg order', '$142']], line: [{ x: 1, y: 88 }, { x: 2, y: 102 }, { x: 3, y: 96 }, { x: 4, y: 120 }, { x: 5, y: 130 }, { x: 6, y: 142 }], bar: [{ x: 'Web', y: 62 }, { x: 'Retail', y: 40 }, { x: 'B2B', y: 38 }] },
      North: { boxes: [['Revenue', '$520K'], ['Orders', '3,610'], ['Avg order', '$144']], line: [{ x: 1, y: 40 }, { x: 2, y: 44 }, { x: 3, y: 41 }, { x: 4, y: 52 }, { x: 5, y: 58 }, { x: 6, y: 63 }], bar: [{ x: 'Web', y: 30 }, { x: 'Retail', y: 14 }, { x: 'B2B', y: 18 }] },
      South: { boxes: [['Revenue', '$680K'], ['Orders', '4,822'], ['Avg order', '$141']], line: [{ x: 1, y: 48 }, { x: 2, y: 58 }, { x: 3, y: 55 }, { x: 4, y: 68 }, { x: 5, y: 72 }, { x: 6, y: 79 }], bar: [{ x: 'Web', y: 32 }, { x: 'Retail', y: 26 }, { x: 'B2B', y: 20 }] }
    };
    var names = Object.keys(views), cur = names[0], P = u.P;
    var wrap = document.createElement('div'); wrap.style.cssText = 'font-family:IBM Plex Sans,system-ui,sans-serif';
    wrap.innerHTML =
      '<div style="display:flex;align-items:center;gap:9px;margin-bottom:12px;flex-wrap:wrap"><span style="font-size:12.5px;font-weight:600;color:' + P.mut + '">' + u.esc(cfg.filterLabel || 'Region') + ':</span><span class="db-seg"></span><span style="margin-left:auto;font:600 9.5px/1 IBM Plex Mono,monospace;letter-spacing:.08em;text-transform:uppercase;color:' + P.faint + '">reactive</span></div>' +
      '<div class="db-boxes" style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:11px"></div>' +
      '<div class="db-tiles" style="display:flex;gap:10px;flex-wrap:wrap"></div>';
    var segHost = wrap.querySelector('.db-seg'); segHost.innerHTML = u.seg(names, cur);
    var boxesEl = wrap.querySelector('.db-boxes'), tilesEl = wrap.querySelector('.db-tiles');
    function tile(title, inner) { return '<div style="flex:1;min-width:240px;border:1px solid ' + P.line + ';border-radius:12px;padding:11px 13px;background:#fff"><div style="font:600 12px/1 IBM Plex Sans,sans-serif;color:' + P.ink + ';margin-bottom:7px">' + u.esc(title) + '</div>' + inner + '</div>'; }
    function render(v) {
      var view = views[v];
      boxesEl.innerHTML = view.boxes.map(function (b) { return '<div style="flex:1;min-width:120px;border:1px solid ' + P.line + ';border-radius:12px;padding:13px 15px;background:#fff"><div style="font:600 10px/1 IBM Plex Mono,monospace;letter-spacing:.06em;text-transform:uppercase;color:' + P.faint + ';margin-bottom:6px">' + u.esc(b[0]) + '</div><div style="font-family:IBM Plex Serif,Georgia,serif;font-weight:600;font-size:22px;color:' + P.ink + '">' + u.esc(b[1]) + '</div></div>'; }).join('');
      tilesEl.innerHTML = tile('Revenue trend', u.plot(view.line, { geom: 'line', x: 'month', y: 'k$', w: 320, h: 180 })) + tile('By channel', u.plot(view.bar, { geom: 'bar', x: '', y: 'k$', w: 320, h: 180 }));
    }
    u.wireSeg(segHost, function (v) { render(v); });
    render(cur);
    el.innerHTML = ''; el.appendChild(wrap);
  }
  if (window.LessonWidgets) window.LessonWidgets.register('dashboard-layout', mount);
})();
