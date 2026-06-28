/* theme-styler.js - the same chart, restyled: palette + theme, without touching data.
 * cfg: { data:[{x,y}], x, y }. Switch palette (default / colorblind-safe Okabe-Ito /
 * grayscale) and theme (minimal / gray / dark); the bars recolor and the panel
 * restyles, and the scale/theme code updates. Default = a 5-category bar chart.
 */
(function () {
  'use strict';
  var PALS = {
    default: { label: 'default', colors: ['#1f7a55', '#2563a8', '#b5631a', '#7a5ea3', '#2f8f86'], code: 'scale_fill_brewer()' },
    cb: { label: 'colorblind-safe', colors: ['#E69F00', '#56B4E9', '#009E73', '#0072B2', '#D55E00'], code: 'scale_fill_manual(values = okabe_ito)  # colorblind-safe' },
    gray: { label: 'grayscale', colors: ['#222', '#555', '#777', '#999', '#bbb'], code: 'scale_fill_grey()' }
  };
  var THEMES = {
    minimal: { label: 'theme_minimal', panel: '#ffffff', ink: '#131720' },
    gray: { label: 'theme_gray', panel: '#ebedf0', ink: '#131720' },
    dark: { label: 'theme_dark', panel: '#1f2430', ink: '#e6edf3' }
  };
  function mount(el, cfg) {
    var u = window.LessonWidgets.u; if (!u) return;
    cfg = cfg || {};
    var data = cfg.data || [{ x: 'North', y: 38 }, { x: 'South', y: 52 }, { x: 'East', y: 27 }, { x: 'West', y: 45 }, { x: 'Central', y: 33 }];
    var xlab = cfg.x || 'region', ylab = cfg.y || 'sales';
    var pal = 'default', theme = 'minimal';

    var wrap = document.createElement('div'); wrap.style.cssText = 'font-family:IBM Plex Sans,system-ui,sans-serif';
    wrap.innerHTML =
      '<div style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:12px">' +
        '<div><div style="font:600 10px/1 IBM Plex Mono,monospace;letter-spacing:.06em;text-transform:uppercase;color:' + u.P.faint + ';margin-bottom:5px">Palette</div><span class="ts-pal"></span></div>' +
        '<div><div style="font:600 10px/1 IBM Plex Mono,monospace;letter-spacing:.06em;text-transform:uppercase;color:' + u.P.faint + ';margin-bottom:5px">Theme</div><span class="ts-theme"></span></div>' +
      '</div>' +
      '<div class="ts-code"></div>';
    var palHost = wrap.querySelector('.ts-pal'); palHost.innerHTML = u.seg(Object.keys(PALS).map(function (k) { return { v: k, label: PALS[k].label }; }), pal);
    var thHost = wrap.querySelector('.ts-theme'); thHost.innerHTML = u.seg(Object.keys(THEMES).map(function (k) { return { v: k, label: THEMES[k].label }; }), theme);
    var codeEl = wrap.querySelector('.ts-code');
    // Self-contained, runnable: library + inline data frame + the styling pipeline.
    function runnableCode() {
      var p = PALS[pal], t = THEMES[theme];
      var pre = 'library(ggplot2)\n' + u.rdf(data, [{ name: xlab, key: 'x' }, { name: ylab, key: 'y' }]) + '\n';
      if (pal === 'cb') pre += 'okabe_ito <- c("#E69F00", "#56B4E9", "#009E73", "#0072B2", "#D55E00")\n';
      return pre + '\nggplot(df, aes(' + xlab + ', ' + ylab + ', fill = ' + xlab + ')) +\n  geom_col() +\n  ' + p.code + ' +\n  ' + t.label + '()';
    }
    function render() {
      var t = THEMES[theme], p = PALS[pal];
      codeEl.innerHTML = u.runnable(runnableCode(), { label: 'Run this chart' });
      var po = codeEl.querySelector('.webr-plot-output');
      if (po) {
        po.style.background = t.panel;
        po.innerHTML = u.previewSeed(u.plot(data, { geom: 'bar', x: xlab, y: ylab, palette: p.colors }));
        po.classList.add('has-content');
      }
    }
    u.wireSeg(palHost, function (v) { pal = v; render(); });
    u.wireSeg(thHost, function (v) { theme = v; render(); });
    render();
    el.innerHTML = ''; el.appendChild(wrap);
  }
  if (window.LessonWidgets) window.LessonWidgets.register('theme-styler', mount);
})();
