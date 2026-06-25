/* table-transform.js - a dplyr/data.table verb shown as a before -> after table diff.
 * The workhorse for the wrangling track: filter, select, mutate, arrange, distinct,
 * summarise, separate/unite, recode, missing-value treatment are all before->after
 * table transforms. cfg:
 *   { code:"df %>% filter(...)", caption:"...",
 *     before:{cols:[], rows:[[]]}, after:{cols:[], rows:[[]]} }
 * Renders the before table + the code; "Run" reveals the result, with NEW columns in
 * green and removed rows struck through, plus a delta line. Default = a filter() example.
 */
(function () {
  'use strict';
  function mount(el, cfg) {
    var u = window.LessonWidgets.u; if (!u) return;
    cfg = cfg || {};
    var before = cfg.before || { cols: ['name', 'dept', 'salary'], rows: [['Aarti', 'Sales', 48], ['Biju', 'Sales', 61], ['Chen', 'Eng', 77], ['Devi', 'Eng', 52]] };
    var after = cfg.after || { cols: ['name', 'dept', 'salary'], rows: [['Biju', 'Sales', 61], ['Chen', 'Eng', 77], ['Devi', 'Eng', 52]] };
    var code = cfg.code || 'df %>% filter(salary > 50)';
    var caption = cfg.caption || 'filter() keeps only the rows where the condition is TRUE.';

    var addCols = {}, dropCols = {};
    after.cols.forEach(function (c) { if (before.cols.indexOf(c) < 0) addCols[c] = 1; });
    before.cols.forEach(function (c) { if (after.cols.indexOf(c) < 0) dropCols[c] = 1; });
    var afterKeys = {}; after.rows.forEach(function (r) { afterKeys[JSON.stringify(r)] = 1; });
    var delRows = {}; before.rows.forEach(function (r, i) { if (!afterKeys[JSON.stringify(r)]) delRows[i] = 1; });
    var nDel = Object.keys(delRows).length, nAddCol = Object.keys(addCols).length, nDropCol = Object.keys(dropCols).length, nAddRow = Math.max(0, after.rows.length - (before.rows.length - nDel));

    var wrap = document.createElement('div');
    wrap.style.cssText = 'font-family:IBM Plex Sans,system-ui,sans-serif';
    wrap.innerHTML =
      '<div style="display:flex;gap:9px;align-items:center;margin-bottom:11px;flex-wrap:wrap">' +
        '<div style="flex:1;min-width:200px">' + u.code(code) + '</div>' +
        '<button class="tt-run" style="flex:none;font:inherit;font-size:13px;font-weight:600;color:#fff;background:' + u.P.acc + ';border:0;border-radius:8px;padding:9px 16px;cursor:pointer">Run &#9654;</button>' +
        '<button class="tt-reset" style="flex:none;font:inherit;font-size:13px;font-weight:600;color:' + u.P.mut + ';background:none;border:1px solid ' + u.P.line + ';border-radius:8px;padding:9px 14px;cursor:pointer;display:none">Reset</button>' +
      '</div><div class="tt-stage" style="overflow-x:auto"></div>' +
      '<div class="tt-cap" style="margin-top:10px;font-size:12.5px;color:' + u.P.mut + '"></div>';
    var stage = wrap.querySelector('.tt-stage'), cap = wrap.querySelector('.tt-cap'),
        runB = wrap.querySelector('.tt-run'), resetB = wrap.querySelector('.tt-reset');

    function showBefore() { stage.innerHTML = u.tbl(before.cols, before.rows); cap.innerHTML = '<b>Before.</b> ' + before.rows.length + ' rows &times; ' + before.cols.length + ' columns. Press Run.'; }
    function showAfter() {
      // diff view first: original columns (plus any new), removed rows struck, new cols green
      var cols = before.cols.concat(after.cols.filter(function (c) { return before.cols.indexOf(c) < 0; }));
      var rows = before.rows.map(function (r, i) { var row = before.cols.map(function (c, ci) { return r[ci]; }); after.cols.forEach(function (c) { if (before.cols.indexOf(c) < 0) { var ai = after.cols.indexOf(c); var match = after.rows.find(function (ar) { return before.cols.every(function (bc, bi) { return ar[after.cols.indexOf(bc)] === r[bi]; }); }); row.push(match ? match[ai] : null); } }); return row; });
      stage.innerHTML = u.tbl(cols, rows, { addCols: addCols, dropCols: dropCols, delRows: delRows });
      var d = [];
      if (nDel) d.push('&minus;' + nDel + ' row' + (nDel > 1 ? 's' : ''));
      if (nAddRow) d.push('+' + nAddRow + ' row' + (nAddRow > 1 ? 's' : ''));
      if (nAddCol) d.push('+' + nAddCol + ' column' + (nAddCol > 1 ? 's' : ''));
      if (nDropCol) d.push('&minus;' + nDropCol + ' column' + (nDropCol > 1 ? 's' : ''));
      cap.innerHTML = '<b>After.</b> ' + caption + (d.length ? ' <span style="color:' + u.P.acc + ';font-weight:600">' + d.join(', ') + '</span>' : '');
    }
    showBefore();
    runB.addEventListener('click', function () { showAfter(); runB.style.display = 'none'; resetB.style.display = ''; });
    resetB.addEventListener('click', function () { showBefore(); resetB.style.display = 'none'; runB.style.display = ''; });
    el.innerHTML = ''; el.appendChild(wrap);
  }
  if (window.LessonWidgets) window.LessonWidgets.register('table-transform', mount);
})();
