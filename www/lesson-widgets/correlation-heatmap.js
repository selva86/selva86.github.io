/* correlation-heatmap.js - a correlation matrix as a diverging color grid.
 * cfg: either { vars:[...], data:{var:[...]} }  (computes Pearson r), or a
 * precomputed { vars:[...], matrix:[[...]] }. Negative = blue, positive = green,
 * |r| sets the intensity; each cell shows the value. Default = mpg/wt/hp/disp.
 */
(function () {
  'use strict';
  function pearson(a, b) { var n = a.length, ma = 0, mb = 0, i; for (i = 0; i < n; i++) { ma += a[i]; mb += b[i]; } ma /= n; mb /= n; var sab = 0, saa = 0, sbb = 0; for (i = 0; i < n; i++) { sab += (a[i] - ma) * (b[i] - mb); saa += (a[i] - ma) * (a[i] - ma); sbb += (b[i] - mb) * (b[i] - mb); } return sab / Math.sqrt(saa * sbb); }
  function mount(el, cfg) {
    var u = window.LessonWidgets.u; if (!u) return;
    cfg = cfg || {};
    var vars = cfg.vars || ['mpg', 'wt', 'hp', 'disp'];
    var data = cfg.data || { mpg: [21, 21, 22.8, 21.4, 18.7, 18.1, 24.4, 30.4], wt: [2.6, 2.9, 2.3, 3.2, 3.4, 3.5, 3.2, 1.6], hp: [110, 110, 93, 110, 175, 105, 62, 66], disp: [160, 160, 108, 258, 360, 225, 147, 76] };
    var M = cfg.matrix;
    if (!M) { M = vars.map(function (a) { return vars.map(function (b) { return a === b ? 1 : pearson(data[a], data[b]); }); }); }

    var P = u.P, cell = 46;
    function color(r) { if (r >= 0) return 'rgba(31,122,85,' + (0.12 + 0.78 * r).toFixed(2) + ')'; return 'rgba(37,99,168,' + (0.12 + 0.78 * (-r)).toFixed(2) + ')'; }
    var h = '<div style="overflow-x:auto"><table style="border-collapse:separate;border-spacing:3px;font-family:IBM Plex Mono,monospace;font-size:11.5px"><thead><tr><th></th>';
    vars.forEach(function (v) { h += '<th style="padding:4px 6px;color:' + P.mut + ';font-weight:600">' + u.esc(v) + '</th>'; });
    h += '</tr></thead><tbody>';
    M.forEach(function (row, i) {
      h += '<tr><th style="text-align:right;padding:4px 8px;color:' + P.mut + ';font-weight:600">' + u.esc(vars[i]) + '</th>';
      row.forEach(function (r) { var dark = Math.abs(r) > 0.55; h += '<td style="width:' + cell + 'px;height:' + cell + 'px;text-align:center;border-radius:7px;background:' + color(r) + ';color:' + (dark ? '#fff' : P.ink) + ';font-weight:600">' + (Math.round(r * 100) / 100) + '</td>'; });
      h += '</tr>';
    });
    h += '</tbody></table></div>' +
      '<div style="margin-top:10px;display:flex;align-items:center;gap:8px;font-size:11px;color:' + P.mut + '">' +
        '<span>&minus;1</span><span style="flex:0 0 120px;height:10px;border-radius:5px;background:linear-gradient(90deg,rgba(37,99,168,.9),#fff,rgba(31,122,85,.9))"></span><span>+1</span>' +
        '<span style="margin-left:6px">blue = negative, green = positive, intensity = strength</span></div>';
    el.innerHTML = '<div style="font-family:IBM Plex Sans,system-ui,sans-serif">' + h + '</div>';
  }
  if (window.LessonWidgets) window.LessonWidgets.register('correlation-heatmap', mount);
})();
