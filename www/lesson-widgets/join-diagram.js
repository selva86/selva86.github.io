/* join-diagram.js - two keyed tables + a join-type switch + the live result.
 * cfg: { left:{cols,rows}, right:{cols,rows}, key:"dept", op:"inner" }
 * Switch inner/left/right/full/semi/anti; the result recomputes and matched keys
 * are tinted. Default = employees x departments with one unmatched key on each side.
 */
(function () {
  'use strict';
  var OPS = [{ v: 'inner', label: 'inner' }, { v: 'left', label: 'left' }, { v: 'right', label: 'right' }, { v: 'full', label: 'full' }, { v: 'semi', label: 'semi' }, { v: 'anti', label: 'anti' }];
  var WHY = {
    inner: 'inner_join keeps only rows whose key is in BOTH tables.',
    left: 'left_join keeps every LEFT row; unmatched right columns become NA.',
    right: 'right_join keeps every RIGHT row; unmatched left columns become NA.',
    full: 'full_join keeps every row from BOTH; gaps become NA.',
    semi: 'semi_join keeps LEFT rows that HAVE a match (left columns only).',
    anti: 'anti_join keeps LEFT rows with NO match (left columns only).'
  };
  var OPFN = { inner: 'inner_join', left: 'left_join', right: 'right_join', full: 'full_join', semi: 'semi_join', anti: 'anti_join' };
  function mount(el, cfg) {
    var u = window.LessonWidgets.u; if (!u) return;
    cfg = cfg || {};
    var L = cfg.left || { cols: ['id', 'name', 'dept'], rows: [[1, 'Aarti', 'S'], [2, 'Biju', 'S'], [3, 'Chen', 'E'], [4, 'Devi', 'X']] };
    var R = cfg.right || { cols: ['dept', 'dept_name'], rows: [['S', 'Sales'], ['E', 'Eng'], ['M', 'Marketing']] };
    var key = cfg.key || 'dept', op = cfg.op || 'inner';
    var li = L.cols.indexOf(key), ri = R.cols.indexOf(key);
    var rMap = {}; R.rows.forEach(function (r) { rMap[r[ri]] = r; });
    var lKeys = {}; L.rows.forEach(function (r) { lKeys[r[li]] = 1; });
    var rExtra = R.cols.filter(function (c) { return c !== key; });

    function compute(o) {
      var cols, rows = [];
      if (o === 'semi' || o === 'anti') {
        cols = L.cols.slice();
        L.rows.forEach(function (r) { var has = rMap[r[li]] != null; if ((o === 'semi') === has) rows.push(r.slice()); });
        return { cols: cols, rows: rows };
      }
      cols = L.cols.concat(rExtra);
      function joinRow(lr, rr) { var row = lr ? lr.slice() : L.cols.map(function (c) { return c === key ? (rr ? rr[ri] : null) : null; }); rExtra.forEach(function (c) { row.push(rr ? rr[R.cols.indexOf(c)] : null); }); return row; }
      if (o === 'inner') L.rows.forEach(function (lr) { if (rMap[lr[li]]) rows.push(joinRow(lr, rMap[lr[li]])); });
      else if (o === 'left') L.rows.forEach(function (lr) { rows.push(joinRow(lr, rMap[lr[li]] || null)); });
      else if (o === 'right') R.rows.forEach(function (rr) { var lr = L.rows.find(function (x) { return x[li] === rr[ri]; }); rows.push(joinRow(lr || null, rr)); });
      else if (o === 'full') { L.rows.forEach(function (lr) { rows.push(joinRow(lr, rMap[lr[li]] || null)); }); R.rows.forEach(function (rr) { if (!lKeys[rr[ri]]) rows.push(joinRow(null, rr)); }); }
      return { cols: cols, rows: rows };
    }

    var wrap = document.createElement('div');
    wrap.style.cssText = 'font-family:IBM Plex Sans,system-ui,sans-serif';
    var matchTintL = {}, matchTintR = {};
    L.rows.forEach(function (r, i) { if (rMap[r[li]]) matchTintL[i + ',' + li] = u.P.add; });
    R.rows.forEach(function (r, i) { if (lKeys[r[ri]]) matchTintR[i + ',' + ri] = u.P.add; });
    wrap.innerHTML =
      '<div style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:12px">' +
        '<div style="flex:1;min-width:150px"><div style="font:600 11px/1 IBM Plex Mono,monospace;color:' + u.P.mut + ';margin-bottom:5px">LEFT (x)</div>' + u.tbl(L.cols, L.rows, { hi: matchTintL }) + '</div>' +
        '<div style="flex:1;min-width:150px"><div style="font:600 11px/1 IBM Plex Mono,monospace;color:' + u.P.mut + ';margin-bottom:5px">RIGHT (y)</div>' + u.tbl(R.cols, R.rows, { hi: matchTintR }) + '</div>' +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px"><span style="font-size:12.5px;color:' + u.P.mut + '">join by <code style="font-family:IBM Plex Mono,monospace;color:' + u.P.ink + '">' + u.esc(key) + '</code>:</span><span class="jd-seg"></span></div>' +
      '<div class="jd-res" style="overflow-x:auto"></div>' +
      '<div class="jd-cap" style="margin-top:9px;font-size:12.5px;color:' + u.P.mut + '"></div>' +
      '<div class="jd-code" style="margin-top:12px"></div>';
    var segHost = wrap.querySelector('.jd-seg'); segHost.innerHTML = u.seg(OPS, op);
    var res = wrap.querySelector('.jd-res'), cap = wrap.querySelector('.jd-cap'), codeEl = wrap.querySelector('.jd-code');
    // Self-contained, runnable: build both tables inline + the dplyr join for this op.
    function jdCode(o) {
      return 'library(dplyr)\n' + u.rdfCR('x', L.cols, L.rows) + '\n' + u.rdfCR('y', R.cols, R.rows) +
        '\n\n' + OPFN[o] + '(x, y, by = "' + key + '")';
    }
    function render(o) {
      var r = compute(o); res.innerHTML = u.tbl(r.cols, r.rows);
      cap.innerHTML = WHY[o] + ' <span style="color:' + u.P.acc + ';font-weight:600">' + r.rows.length + ' row' + (r.rows.length === 1 ? '' : 's') + '</span>.';
      codeEl.innerHTML = u.runnable(jdCode(o), { label: 'Run this join' });
    }
    u.wireSeg(segHost, function (v) { render(v); });
    render(op);
    el.innerHTML = ''; el.appendChild(wrap);
  }
  if (window.LessonWidgets) window.LessonWidgets.register('join-diagram', mount);
})();
