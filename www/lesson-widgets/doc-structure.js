/* doc-structure.js - the anatomy of an R Markdown / Quarto doc: YAML + prose +
 * code chunks, and what it knits to. Toggle source <-> rendered. cfg:
 *   { blocks:[{type:"yaml|prose|code", text}], title }  (an output chart is shown
 *   in rendered mode for any code block flagged {chart:[{x,y}]}).
 * Default = a short sales report.
 */
(function () {
  'use strict';
  function mount(el, cfg) {
    var u = window.LessonWidgets.u; if (!u) return;
    cfg = cfg || {};
    var blocks = cfg.blocks || [
      { type: 'yaml', text: 'title: "Q4 Sales report"\nauthor: "Analytics"\nformat: html' },
      { type: 'prose', text: '## Summary\n\nRevenue grew **18%** in Q4, led by the Web channel.' },
      { type: 'code', text: 'ggplot(sales, aes(channel, rev)) +\n  geom_col()', chart: [{ x: 'Web', y: 62 }, { x: 'Retail', y: 40 }, { x: 'B2B', y: 38 }] }
    ];
    var P = u.P;
    function mdInline(t) { return u.esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>'); }

    function source() {
      var h = '';
      blocks.forEach(function (b) {
        if (b.type === 'yaml') h += '<div style="border-left:3px solid ' + P.c1 + ';background:' + P.bg + ';padding:8px 12px;margin-bottom:8px;font-family:IBM Plex Mono,monospace;font-size:12px;color:' + P.ink + ';white-space:pre">---\n' + u.esc(b.text) + '\n---</div>';
        else if (b.type === 'code') h += '<div style="margin-bottom:8px"><div style="font:600 10px/1 IBM Plex Mono,monospace;color:' + P.acc + ';margin-bottom:3px">```{r}</div>' + u.code(b.text) + '<div style="font:600 10px/1 IBM Plex Mono,monospace;color:' + P.acc + ';margin-top:3px">```</div></div>';
        else h += '<div style="padding:6px 2px;margin-bottom:8px;font-family:IBM Plex Mono,monospace;font-size:12.5px;color:' + P.body + ';white-space:pre-wrap">' + u.esc(b.text) + '</div>';
      });
      return '<div style="border:1px solid ' + P.line + ';border-radius:10px;padding:13px">' + h + '</div>';
    }
    function rendered() {
      var h = '<div style="border:1px solid ' + P.line + ';border-radius:10px;padding:18px 20px;background:#fff;max-width:460px">';
      blocks.forEach(function (b) {
        if (b.type === 'yaml') { var m = /title:\s*"?([^"\n]+)"?/.exec(b.text); h += '<div style="font-family:IBM Plex Serif,Georgia,serif;font-weight:600;font-size:21px;color:' + P.ink + ';border-bottom:1px solid ' + P.line + ';padding-bottom:9px;margin-bottom:11px">' + u.esc(m ? m[1] : 'Document') + '</div>'; }
        else if (b.type === 'prose') { b.text.split(/\n\n+/).forEach(function (para) { var hm = /^##\s+(.+)/.exec(para); if (hm) h += '<div style="font-family:IBM Plex Sans,sans-serif;font-weight:700;font-size:15px;color:' + P.ink + ';margin:6px 0">' + mdInline(hm[1]) + '</div>'; else h += '<p style="font-family:IBM Plex Sans,sans-serif;font-size:14px;line-height:1.6;color:' + P.body + ';margin:0 0 9px">' + mdInline(para) + '</p>'; }); }
        else if (b.type === 'code' && b.chart) { h += u.plot(b.chart, { geom: 'bar', x: '', y: '', w: 400, h: 180 }); }
      });
      return h + '</div>';
    }
    var wrap = document.createElement('div'); wrap.style.cssText = 'font-family:IBM Plex Sans,system-ui,sans-serif';
    wrap.innerHTML = '<div style="margin-bottom:11px"><span class="ds-seg"></span></div><div class="ds-stage"></div>';
    var segHost = wrap.querySelector('.ds-seg'); segHost.innerHTML = u.seg([{ v: 'src', label: 'Source (.qmd)' }, { v: 'out', label: 'Rendered' }], 'src');
    var stage = wrap.querySelector('.ds-stage');
    function render(v) { stage.innerHTML = v === 'out' ? rendered() : source(); }
    u.wireSeg(segHost, function (v) { render(v); });
    render('src');
    el.innerHTML = ''; el.appendChild(wrap);
  }
  if (window.LessonWidgets) window.LessonWidgets.register('doc-structure', mount);
})();
