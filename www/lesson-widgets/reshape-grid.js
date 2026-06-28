/* reshape-grid.js - pivot_longer <-> pivot_wider on a small table.
 * cfg: { wide:{cols,rows}, idCols:["country"], namesTo:"year", valuesTo:"cases" }
 * Toggle pivots the table between wide and long, tinting the id columns vs the
 * names/values columns so the mapping is visible. The long form is derived from
 * the wide form. Default = a country x year cases table.
 */
(function () {
  'use strict';
  function mount(el, cfg) {
    var u = window.LessonWidgets.u; if (!u) return;
    cfg = cfg || {};
    var wide = cfg.wide || { cols: ['country', '2020', '2021', '2022'], rows: [['India', 10, 12, 15], ['Kenya', 7, 8, 9]] };
    var idCols = cfg.idCols || ['country'];
    var namesTo = cfg.namesTo || 'year', valuesTo = cfg.valuesTo || 'cases';
    var valCols = wide.cols.filter(function (c) { return idCols.indexOf(c) < 0; });

    // derive long
    var longCols = idCols.concat([namesTo, valuesTo]), longRows = [];
    wide.rows.forEach(function (r) { var ids = idCols.map(function (c) { return r[wide.cols.indexOf(c)]; }); valCols.forEach(function (vc) { longRows.push(ids.concat([vc, r[wide.cols.indexOf(vc)]])); }); });

    function wideHi() { var hi = {}; wide.rows.forEach(function (r, ri) { wide.cols.forEach(function (c, ci) { if (valCols.indexOf(c) >= 0) hi[ri + ',' + ci] = u.P.line2; }); }); return hi; }
    function longHi() { var hi = {}; longRows.forEach(function (r, ri) { hi[ri + ',' + (longCols.length - 2)] = u.P.line2; hi[ri + ',' + (longCols.length - 1)] = u.P.line2; }); return hi; }

    var wrap = document.createElement('div'); wrap.style.cssText = 'font-family:IBM Plex Sans,system-ui,sans-serif';
    wrap.innerHTML =
      '<div style="margin-bottom:11px"><span class="rs-seg"></span></div>' +
      '<div class="rs-stage" style="overflow-x:auto"></div>' +
      '<div class="rs-cap" style="margin-top:9px;font-size:12.5px;color:' + u.P.mut + '"></div>' +
      '<div class="rs-code" style="margin-top:12px"></div>';
    var segHost = wrap.querySelector('.rs-seg'); segHost.innerHTML = u.seg([{ v: 'wide', label: 'Wide' }, { v: 'long', label: 'Long (tidy)' }], 'wide');
    var stage = wrap.querySelector('.rs-stage'), cap = wrap.querySelector('.rs-cap'), codeEl = wrap.querySelector('.rs-code');
    // Self-contained, runnable: build the natural source table inline + the pivot for this direction.
    function rsCode(form) {
      if (form === 'long') {
        return 'library(tidyr)\n' + u.rdfCR('df', wide.cols, wide.rows) + '\n\n' +
          'pivot_longer(df, cols = -' + idCols.join(', -') + ', names_to = "' + namesTo + '", values_to = "' + valuesTo + '")';
      }
      return 'library(tidyr)\n' + u.rdfCR('long', longCols, longRows) + '\n\n' +
        'pivot_wider(long, names_from = ' + namesTo + ', values_from = ' + valuesTo + ')';
    }
    function render(form) {
      if (form === 'wide') {
        stage.innerHTML = u.tbl(wide.cols, wide.rows, { hi: wideHi() });
        cap.innerHTML = 'Wide: one row per ' + idCols.join(', ') + ', one column per ' + namesTo + '. Easy to read, harder to plot. ' + wide.rows.length + ' rows.';
      } else {
        stage.innerHTML = u.tbl(longCols, longRows, { hi: longHi() });
        cap.innerHTML = 'Long (tidy): one row per observation, with <b>' + namesTo + '</b> and <b>' + valuesTo + '</b> columns. This is what ggplot and most models want. ' + longRows.length + ' rows.';
      }
      codeEl.innerHTML = u.runnable(rsCode(form), { label: 'Run this reshape' });
    }
    u.wireSeg(segHost, function (v) { render(v); });
    render('wide');
    el.innerHTML = ''; el.appendChild(wrap);
  }
  if (window.LessonWidgets) window.LessonWidgets.register('reshape-grid', mount);
})();
