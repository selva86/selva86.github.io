/* control-flow.js - foundations: watch a for-loop with an if/else execute one
 * iteration at a time. Step through it; see the counter, which branch the
 * condition takes, and the console output building up. Then run the real loop.
 * cfg: { n: 5 }  (loops i in 1:n, printing "even"/"odd")
 */
(function () {
  'use strict';
  function mount(el, cfg) {
    var u = window.LessonWidgets.u; if (!u) return;
    cfg = cfg || {};
    var n = cfg.n || 5, step = 0; // step 0 = nothing run yet; step k = i=k done

    var CODE = 'for (i in 1:' + n + ') {\n  if (i %% 2 == 0) {\n    print("even")\n  } else {\n    print("odd")\n  }\n}';
    var wrap = document.createElement('div');
    wrap.style.cssText = 'font-family:IBM Plex Sans,system-ui,sans-serif';

    function codePanel() {
      var even = step > 0 && step % 2 === 0; // current branch highlight
      var hiEven = even ? u.P.add : 'transparent', hiOdd = (step > 0 && !even) ? u.P.add : 'transparent';
      return '<pre style="margin:0;font-family:IBM Plex Mono,monospace;font-size:13px;line-height:1.6;background:' + u.P.codeBg + ';color:' + u.P.codeFg + ';padding:12px 14px;border-radius:8px;overflow-x:auto">' +
        '<span>for (i in 1:' + n + ') {</span>\n' +
        '<span>  if (i %% 2 == 0) {</span>\n' +
        '<span style="background:' + (hiEven === 'transparent' ? 'transparent' : 'rgba(123,201,159,.28)') + ';display:inline-block;width:100%">    print("even")</span>\n' +
        '<span>  } else {</span>\n' +
        '<span style="background:' + (hiOdd === 'transparent' ? 'transparent' : 'rgba(123,201,159,.28)') + ';display:inline-block;width:100%">    print("odd")</span>\n' +
        '<span>  }</span>\n<span>}</span></pre>';
    }
    function statePanel() {
      var out = [];
      for (var k = 1; k <= step; k++) out.push('[1] "' + (k % 2 === 0 ? 'even' : 'odd') + '"');
      var iNow = step === 0 ? '&ndash;' : step;
      return '<div style="display:flex;gap:10px;flex-wrap:wrap;margin:0 0 10px">' +
          '<span style="font-family:IBM Plex Mono,monospace;font-size:13px;background:' + u.P.line2 + ';color:' + u.P.ink + ';padding:5px 11px;border-radius:7px">i = ' + iNow + (step === 0 ? '' : (step % 2 === 0 ? '  (even)' : '  (odd)')) + '</span>' +
          '<span style="font-size:12.5px;color:' + u.P.mut + ';align-self:center">' + (step >= n ? 'loop finished' : (step === 0 ? 'press Step to start' : 'press Step for i = ' + (step + 1))) + '</span>' +
        '</div>' +
        '<div style="font-size:11px;color:' + u.P.faint + ';font-family:IBM Plex Mono,monospace;text-transform:uppercase;letter-spacing:.04em;margin:0 0 4px">Console</div>' +
        '<pre style="margin:0;min-height:46px;font-family:IBM Plex Mono,monospace;font-size:12.5px;line-height:1.5;background:#fff;border:1px solid ' + u.P.line + ';border-radius:7px;padding:9px 12px;color:' + u.P.ink + '">' + (out.join('\n') || '<span style="color:' + u.P.faint + '">(empty)</span>') + '</pre>';
    }
    function render() {
      wrap.querySelector('.cf-code').innerHTML = codePanel();
      wrap.querySelector('.cf-state').innerHTML = statePanel();
      wrap.querySelector('.cf-step').disabled = step >= n;
      wrap.querySelector('.cf-step').style.opacity = step >= n ? '.5' : '1';
    }

    wrap.innerHTML =
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">' +
        '<div class="cf-code"></div><div class="cf-state"></div>' +
      '</div>' +
      '<div style="display:flex;gap:9px;margin:12px 0 0">' +
        '<button type="button" class="cf-step" style="font:inherit;font-size:13px;font-weight:600;color:#fff;background:' + u.P.acc + ';border:0;border-radius:8px;padding:9px 16px;cursor:pointer">Step &rarr;</button>' +
        '<button type="button" class="cf-reset" style="font:inherit;font-size:13px;font-weight:600;color:' + u.P.mut + ';background:none;border:1px solid ' + u.P.line + ';border-radius:8px;padding:9px 14px;cursor:pointer">Reset</button>' +
      '</div>' +
      '<div style="margin:13px 0 0">' + u.runnable(CODE, { label: 'Run the whole loop' }) + '</div>';

    wrap.querySelector('.cf-step').addEventListener('click', function () { if (step < n) { step++; render(); } });
    wrap.querySelector('.cf-reset').addEventListener('click', function () { step = 0; render(); });
    el.innerHTML = ''; el.appendChild(wrap); render();
  }
  if (window.LessonWidgets) window.LessonWidgets.register('control-flow', mount);
})();
