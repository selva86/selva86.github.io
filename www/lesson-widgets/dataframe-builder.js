/* dataframe-builder.js - foundations: a data frame is a set of equal-length
 * columns, each its own type. Toggle columns on and off and watch the table,
 * its dimensions, and each column's type update; then run the data.frame() call.
 * cfg: { columns: [{name, type, values:[]}] }
 */
(function () {
  'use strict';
  function mount(el, cfg) {
    var u = window.LessonWidgets.u; if (!u) return;
    cfg = cfg || {};
    var COLS = cfg.columns || [
      { name: 'name', type: 'character', values: ['Ana', 'Ben', 'Cy', 'Devi'] },
      { name: 'age', type: 'integer', values: [29, 41, 35, 23] },
      { name: 'member', type: 'logical', values: ['TRUE', 'FALSE', 'TRUE', 'TRUE'] }
    ];
    var on = COLS.map(function () { return true; });

    function active() { return COLS.filter(function (_, i) { return on[i]; }); }
    function rLiteral() {
      var a = active();
      var lines = a.map(function (c) {
        var vals = c.values.map(function (v) { return c.type === 'character' ? '"' + v + '"' : v; }).join(', ');
        return '  ' + c.name + ' = c(' + vals + ')';
      });
      return 'df <- data.frame(\n' + lines.join(',\n') + '\n)';
    }

    var wrap = document.createElement('div');
    wrap.style.cssText = 'font-family:IBM Plex Sans,system-ui,sans-serif';

    function render() {
      var a = active();
      var toggles = COLS.map(function (c, i) {
        return '<button type="button" class="dfb-col" data-i="' + i + '" style="font:inherit;font-size:12.5px;font-weight:600;border-radius:8px;padding:6px 12px;cursor:pointer;border:1px solid ' + u.P.line + ';background:' + (on[i] ? u.P.acc : '#fff') + ';color:' + (on[i] ? '#fff' : u.P.mut) + '">' + (on[i] ? '&#10003; ' : '') + u.esc(c.name) + '</button>';
      }).join('');
      var tableHtml, dimHtml, typesHtml;
      if (!a.length) {
        tableHtml = '<div style="font-size:13px;color:' + u.P.mut + ';padding:14px 0">Turn on at least one column to build a data frame.</div>';
        dimHtml = ''; typesHtml = '';
      } else {
        var cols = a.map(function (c) { return c.name; });
        var rows = a[0].values.map(function (_, ri) { return a.map(function (c) { return c.values[ri]; }); });
        tableHtml = u.tbl(cols, rows);
        dimHtml = '<span style="font-family:IBM Plex Mono,monospace">dim(df) #&gt; ' + rows.length + ' &times; ' + cols.length + '</span>';
        typesHtml = a.map(function (c) { return '<span style="font-family:IBM Plex Mono,monospace;font-size:12px;background:' + u.P.line2 + ';color:' + u.P.ink + ';padding:2px 7px;border-radius:6px">' + u.esc(c.name) + ': ' + c.type + '</span>'; }).join(' ');
      }
      wrap.querySelector('.dfb-toggles').innerHTML = toggles;
      wrap.querySelector('.dfb-table').innerHTML = tableHtml;
      wrap.querySelector('.dfb-meta').innerHTML = (a.length ? '<div style="margin:0 0 7px;font-size:12.5px;color:' + u.P.mut + '">' + dimHtml + '</div>' + typesHtml : '');
      wrap.querySelector('.dfb-run').innerHTML = a.length ? u.runnable(rLiteral() + '\n\ndf\nstr(df)', { label: 'Build it in R' }) : '';
    }

    wrap.innerHTML =
      '<div style="border:1px solid ' + u.P.line + ';border-radius:12px;padding:14px 16px;background:#fff">' +
        '<div style="font-size:12px;color:' + u.P.mut + ';margin:0 0 7px">Columns (each is one type; all the same length)</div>' +
        '<div class="dfb-toggles" style="display:flex;gap:8px;flex-wrap:wrap"></div>' +
        '<div class="dfb-table" style="overflow-x:auto;margin:14px 0 0"></div>' +
        '<div class="dfb-meta" style="margin:12px 0 0;display:flex;gap:7px;flex-wrap:wrap;align-items:center"></div>' +
      '</div>' +
      '<div class="dfb-run" style="margin:12px 0 0"></div>';

    wrap.addEventListener('click', function (e) {
      var b = e.target.closest('.dfb-col'); if (!b) return;
      var i = +b.getAttribute('data-i'); on[i] = !on[i]; render();
    });
    el.innerHTML = ''; el.appendChild(wrap); render();
  }
  if (window.LessonWidgets) window.LessonWidgets.register('dataframe-builder', mount);
})();
