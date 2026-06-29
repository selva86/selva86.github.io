/* nest-unnest.js - foundations/iteration: a list-column packs a whole table into a
 * single cell. Toggle between the flat data frame and its nested form (one row per
 * group, each carrying its own mini-table), then run nest() / unnest() for real.
 * cfg: { cols:["region","month","sales"], rows:[["East","Jan",10],...], nestBy:"region", listCol:"data" }
 */
(function () {
  'use strict';
  function mount(el, cfg) {
    var u = window.LessonWidgets.u; if (!u) return;
    cfg = cfg || {};
    var cols = cfg.cols || ['region', 'month', 'sales'];
    var rows = cfg.rows || [['East', 'Jan', 10], ['East', 'Feb', 14], ['West', 'Jan', 8], ['West', 'Feb', 12]];
    var nestBy = cfg.nestBy || cols[0];
    var listCol = cfg.listCol || 'data';
    var view = 'flat';
    var dataCols = cols.filter(function (c) { return c !== nestBy; });
    var bi = cols.indexOf(nestBy);

    var wrap = document.createElement('div');
    wrap.style.cssText = 'font-family:IBM Plex Sans,system-ui,sans-serif';

    function groups() {
      var order = [], by = {};
      rows.forEach(function (r) { var k = r[bi]; if (!(k in by)) { by[k] = 0; order.push(k); } by[k]++; });
      return order.map(function (k) { return { key: k, n: by[k] }; });
    }

    function nestedTable() {
      var h = '<table style="border-collapse:collapse;font-family:IBM Plex Mono,monospace;font-size:12.5px;width:100%">';
      h += '<thead><tr><th style="text-align:left;padding:6px 9px;border:1px solid ' + u.P.line + ';background:' + u.P.bg + ';color:' + u.P.ink + ';font-weight:700">' + u.esc(nestBy) + '</th>' +
        '<th style="text-align:left;padding:6px 9px;border:1px solid ' + u.P.line + ';background:' + u.P.add + ';color:' + u.P.ink + ';font-weight:700">' + u.esc(listCol) + ' <span style="font-weight:400;color:' + u.P.mut + '">(list-column)</span></th></tr></thead><tbody>';
      groups().forEach(function (g) {
        h += '<tr><td style="padding:6px 9px;border:1px solid ' + u.P.line + ';background:#fff;color:' + u.P.ink + '">' + u.esc(g.key) + '</td>' +
          '<td style="padding:6px 9px;border:1px solid ' + u.P.line + ';background:#fff">' +
            '<span style="display:inline-block;font-size:11.5px;font-weight:600;color:' + u.P.acc + ';background:' + u.P.add + ';border:1px solid ' + u.P.acc + ';border-radius:6px;padding:3px 9px">tibble [' + g.n + ' x ' + dataCols.length + ']</span>' +
          '</td></tr>';
      });
      return h + '</tbody></table>';
    }

    function rCode() {
      var objs = rows.map(function (r) { var o = {}; cols.forEach(function (c, i) { o[c] = r[i]; }); return o; });
      var rcols = cols.map(function (c) { return { name: c, key: c }; });
      return 'library(dplyr)\nlibrary(tidyr)\n\n' +
        u.rdf(objs, rcols, 'df') + '\n\n' +
        'nested <- df |> nest(' + listCol + ' = c(' + dataCols.join(', ') + '))\n' +
        'nested            # one row per ' + nestBy + ', ' + listCol + ' is a list of tibbles\n\n' +
        'nested |> unnest(' + listCol + ')   # back to the flat frame';
    }

    function render() {
      var isFlat = view === 'flat';
      wrap.querySelector('.nu-table').innerHTML = isFlat ? u.tbl(cols, rows) : nestedTable();
      wrap.querySelector('.nu-cap').innerHTML = isFlat
        ? '<b>' + rows.length + ' rows</b>, one per observation. <code style="font-family:IBM Plex Mono,monospace">nest()</code> packs the ' + dataCols.join(' and ') + ' columns into a list-column.'
        : '<b>' + groups().length + ' rows</b>, one per ' + nestBy + '. Each ' + listCol + ' cell holds a whole tibble. <code style="font-family:IBM Plex Mono,monospace">unnest()</code> spreads it back out.';
      wrap.querySelector('.nu-run').innerHTML = u.runnable(rCode(), { label: 'Run nest() and unnest()' });
    }

    wrap.innerHTML =
      '<div style="border:1px solid ' + u.P.line + ';border-radius:12px;padding:14px 16px;background:#fff">' +
        '<div class="nu-seg">' + u.seg([{ v: 'flat', label: 'Flat frame' }, { v: 'nested', label: 'Nested' }], 'flat') + '</div>' +
        '<div class="nu-table" style="margin:14px 0 0;overflow-x:auto"></div>' +
        '<div class="nu-cap" style="margin:11px 0 0;font-size:12.5px;color:' + u.P.body + ';line-height:1.55"></div>' +
      '</div>' +
      '<div class="nu-run" style="margin:12px 0 0"></div>';

    u.wireSeg(wrap.querySelector('.nu-seg'), function (v) { view = v; render(); });
    el.innerHTML = ''; el.appendChild(wrap); render();
  }
  if (window.LessonWidgets) window.LessonWidgets.register('nest-unnest', mount);
})();
