/* regex-highlight.js - foundations/strings: see what a regular expression actually
 * matches. Pick a pattern; every match lights up inside a sample string; the count
 * and the real R call update. Then run it for real.
 * cfg: { text: "...", patterns: [{src, label}] }  (src = JS/PCRE-style regex source)
 */
(function () {
  'use strict';
  function mount(el, cfg) {
    var u = window.LessonWidgets.u; if (!u) return;
    cfg = cfg || {};
    var text = cfg.text || 'Order A12 shipped on 2026-03-08 to dev@site.org for $45.90';
    var pats = cfg.patterns || [
      { src: '\\d+', label: 'Digits' },
      { src: '\\d{4}-\\d{2}-\\d{2}', label: 'Date' },
      { src: '[\\w.]+@[\\w.]+', label: 'Email' },
      { src: '\\$\\d+\\.\\d+', label: 'Price' }
    ];
    var cur = 0;

    var wrap = document.createElement('div');
    wrap.style.cssText = 'font-family:IBM Plex Sans,system-ui,sans-serif';

    // highlight every match of src inside text; returns {html, n}
    function highlight(src) {
      var re; try { re = new RegExp(src, 'g'); } catch (e) { return { html: u.esc(text), n: 0 }; }
      var out = '', last = 0, m, n = 0, guard = 0;
      while ((m = re.exec(text)) !== null && guard++ < 2000) {
        var mt = m[0];
        if (mt === '') { re.lastIndex++; continue; }
        out += u.esc(text.slice(last, m.index)) +
          '<mark style="background:' + u.P.add + ';color:' + u.P.ink + ';border-bottom:2px solid ' + u.P.acc + ';border-radius:3px;padding:1px 2px">' + u.esc(mt) + '</mark>';
        last = m.index + mt.length; n++;
      }
      out += u.esc(text.slice(last));
      return { html: out, n: n };
    }
    // R string literal needs backslashes doubled: \d+  ->  "\\d+"
    function rLit(src) { return src.replace(/\\/g, '\\\\'); }

    function render() {
      var p = pats[cur], h = highlight(p.src);
      wrap.querySelector('.rx-str').innerHTML = h.html;
      wrap.querySelector('.rx-meta').innerHTML =
        'Pattern <code style="font-family:IBM Plex Mono,monospace;background:' + u.P.line2 + ';padding:2px 6px;border-radius:5px">' + u.esc(p.src) + '</code> matched <b>' + h.n + '</b> time' + (h.n === 1 ? '' : 's') + '.';
      wrap.querySelector('.rx-run').innerHTML = u.runnable(
        'x <- "' + text.replace(/"/g, '\\"') + '"\n' +
        'regmatches(x, gregexpr("' + rLit(p.src) + '", x))',
        { label: 'Run it in R' });
    }

    wrap.innerHTML =
      '<div style="border:1px solid ' + u.P.line + ';border-radius:12px;padding:14px 16px;background:#fff">' +
        '<div style="font-size:12px;color:' + u.P.mut + ';margin:0 0 8px">Try a pattern:</div>' +
        '<div class="rx-seg">' + u.seg(pats.map(function (p, i) { return { v: i, label: p.label }; }), 0) + '</div>' +
        '<div class="rx-str" style="margin:14px 0 0;font-family:IBM Plex Mono,monospace;font-size:13.5px;line-height:1.9;background:' + u.P.bg + ';border:1px solid ' + u.P.line + ';border-radius:8px;padding:11px 13px;word-break:break-word"></div>' +
        '<div class="rx-meta" style="margin:10px 0 0;font-size:12.5px;color:' + u.P.body + '"></div>' +
      '</div>' +
      '<div class="rx-run" style="margin:12px 0 0"></div>';

    u.wireSeg(wrap.querySelector('.rx-seg'), function (v) { cur = +v; render(); });
    el.innerHTML = ''; el.appendChild(wrap); render();
  }
  if (window.LessonWidgets) window.LessonWidgets.register('regex-highlight', mount);
})();
