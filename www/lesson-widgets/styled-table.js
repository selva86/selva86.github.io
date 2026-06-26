/* styled-table.js - a raw data frame vs a report-ready table (gt / flextable style).
 * cfg: { cols, rows, formats:{col:"dollar|pct|comma|1dp"}, title, note, align:{col:"right"} }
 * Toggle between the raw print and the formatted table: number formatting, title,
 * footnote, bold header, zebra striping, right-aligned numbers. Default = a revenue table.
 */
(function () {
  'use strict';
  function comma(n) { return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function fmt(v, f) {
    if (v == null || isNaN(v)) return v;
    var n = +v;
    if (f === 'dollar') return '$' + comma(Math.round(n));
    if (f === 'pct') return (Math.round(n * 1000) / 10) + '%';
    if (f === 'comma') return comma(Math.round(n));
    if (f === '1dp') return n.toFixed(1);
    return v;
  }
  function mount(el, cfg) {
    var u = window.LessonWidgets.u; if (!u) return;
    cfg = cfg || {};
    var cols = cfg.cols || ['region', 'revenue', 'share'];
    var rows = cfg.rows || [['North', 1234567, 0.42], ['South', 876543, 0.30], ['West', 812000, 0.28]];
    var formats = cfg.formats || { revenue: 'dollar', share: 'pct' };
    var title = cfg.title || 'Q4 revenue by region', note = cfg.note || 'Source: internal finance, 2026.';
    var P = u.P;

    function raw() {
      var h = '<table style="border-collapse:collapse;font-family:IBM Plex Mono,monospace;font-size:12.5px"><thead><tr>';
      cols.forEach(function (c) { h += '<th style="text-align:left;padding:5px 10px;border:1px solid ' + P.line + ';color:' + P.mut + '">' + u.esc(c) + '</th>'; });
      h += '</tr></thead><tbody>';
      rows.forEach(function (r) { h += '<tr>'; r.forEach(function (v) { h += '<td style="padding:5px 10px;border:1px solid ' + P.line + ';color:' + P.ink + '">' + u.esc(v) + '</td>'; }); h += '</tr>'; });
      return h + '</tbody></table>';
    }
    function styled() {
      var h = '<div style="border:1px solid ' + P.line + ';border-radius:12px;overflow:hidden;max-width:440px;box-shadow:0 1px 2px rgba(19,23,32,.05)">';
      h += '<div style="padding:13px 16px 11px;border-bottom:2px solid ' + P.ink + '"><div style="font-family:IBM Plex Serif,Georgia,serif;font-weight:600;font-size:15px;color:' + P.ink + '">' + u.esc(title) + '</div></div>';
      h += '<table style="border-collapse:collapse;width:100%;font-family:IBM Plex Sans,system-ui,sans-serif;font-size:13px"><thead><tr>';
      cols.forEach(function (c) { var rt = formats[c]; h += '<th style="text-align:' + (rt ? 'right' : 'left') + ';padding:8px 16px;color:' + P.mut + ';font-weight:600;font-size:10.5px;letter-spacing:.04em;text-transform:uppercase;border-bottom:1px solid ' + P.line + '">' + u.esc(c) + '</th>'; });
      h += '</tr></thead><tbody>';
      rows.forEach(function (r, ri) { h += '<tr style="background:' + (ri % 2 ? P.bg : '#fff') + '">'; r.forEach(function (v, ci) { var c = cols[ci], rt = formats[c]; h += '<td style="text-align:' + (rt ? 'right' : 'left') + ';padding:8px 16px;color:' + P.ink + ';font-variant-numeric:tabular-nums;' + (rt ? 'font-family:IBM Plex Mono,monospace' : '') + '">' + u.esc(fmt(v, rt)) + '</td>'; }); h += '</tr>'; });
      h += '</tbody></table>';
      h += '<div style="padding:9px 16px;color:' + P.faint + ';font-size:11px;border-top:1px solid ' + P.line + '">' + u.esc(note) + '</div></div>';
      return h;
    }
    var wrap = document.createElement('div'); wrap.style.cssText = 'font-family:IBM Plex Sans,system-ui,sans-serif';
    wrap.innerHTML = '<div style="margin-bottom:11px"><span class="st-seg"></span></div><div class="st-stage" style="overflow-x:auto"></div>';
    var segHost = wrap.querySelector('.st-seg'); segHost.innerHTML = u.seg([{ v: 'raw', label: 'Raw print' }, { v: 'gt', label: 'Report table' }], 'raw');
    var stage = wrap.querySelector('.st-stage');
    function render(v) { stage.innerHTML = v === 'gt' ? styled() : raw(); }
    u.wireSeg(segHost, function (v) { render(v); });
    render('raw');
    el.innerHTML = ''; el.appendChild(wrap);
  }
  if (window.LessonWidgets) window.LessonWidgets.register('styled-table', mount);
})();
