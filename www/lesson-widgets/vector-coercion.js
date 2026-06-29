/* vector-coercion.js - foundations: an atomic vector holds ONE type, so mixing
 * types coerces the whole vector up the hierarchy logical < integer < double <
 * character. Add elements of different types and watch the vector's type change.
 * cfg: { start: [{lit,type}] }  (type in logical|integer|double|character)
 */
(function () {
  'use strict';
  var RANK = { logical: 1, integer: 2, double: 3, character: 4 };
  function mount(el, cfg) {
    var u = window.LessonWidgets.u; if (!u) return;
    cfg = cfg || {};
    var start = cfg.start || [{ lit: 'TRUE', type: 'logical' }, { lit: '2L', type: 'integer' }];
    var ADD = [
      { lit: 'TRUE', type: 'logical', label: 'TRUE' },
      { lit: '7L', type: 'integer', label: '7L (integer)' },
      { lit: '3.5', type: 'double', label: '3.5 (double)' },
      { lit: '"hi"', type: 'character', label: '"hi" (text)' }
    ];
    var items = start.slice();

    function targetType() { var r = 1; items.forEach(function (it) { r = Math.max(r, RANK[it.type]); }); return Object.keys(RANK).filter(function (k) { return RANK[k] === r; })[0]; }
    function coerce(it, t) {
      if (t === 'character') { var s = it.lit.replace(/^"|"$/g, '').replace(/L$/, ''); return '"' + s + '"'; }
      if (t === 'double' || t === 'integer') {
        if (it.type === 'logical') return it.lit === 'TRUE' ? '1' : '0';
        return it.lit.replace(/L$/, '');
      }
      return it.lit; // all-logical
    }
    function rLiteral() { return 'c(' + items.map(function (it) { return it.lit; }).join(', '); }

    var wrap = document.createElement('div');
    wrap.style.cssText = 'font-family:IBM Plex Sans,system-ui,sans-serif';

    function render() {
      var t = targetType();
      var coerced = items.map(function (it) { return coerce(it, t); });
      var pieces = items.map(function (it) {
        var changed = coerce(it, t) !== it.lit;
        return '<code style="font-family:IBM Plex Mono,monospace;font-size:13px;background:' + u.P.line2 + ';color:' + u.P.ink + ';padding:3px 7px;border-radius:6px">' + u.esc(it.lit) +
          '<span style="color:' + u.P.faint + ';font-size:11px"> ' + it.type + '</span></code>';
      }).join('<span style="color:' + u.P.faint + ';margin:0 2px">,</span> ');
      var bg = { logical: '#eef3f9', integer: '#eef3f9', double: '#e7f3ec', character: '#fbeae5' }[t];
      wrap.querySelector('.vc-in').innerHTML = 'c( ' + pieces + ' )';
      wrap.querySelector('.vc-out').innerHTML =
        '<div style="font-size:12.5px;color:' + u.P.mut + ';margin:0 0 6px">R stores them all as one type:</div>' +
        '<code style="display:inline-block;font-family:IBM Plex Mono,monospace;font-size:14px;background:' + bg + ';color:' + u.P.ink + ';padding:8px 13px;border-radius:8px;font-weight:600">' +
          '[1] ' + coerced.join(' ') + '</code>' +
        '<div style="margin:8px 0 0;font-family:IBM Plex Mono,monospace;font-size:12.5px;color:' + u.P.acc + '">typeof(x)  #&gt; "' + t + '"</div>';
      var run = wrap.querySelector('.vc-run');
      run.innerHTML = u.runnable('x <- ' + rLiteral() + ')\nx\ntypeof(x)', { label: 'Run it in R' });
    }

    wrap.innerHTML =
      '<div style="border:1px solid ' + u.P.line + ';border-radius:12px;padding:14px 16px;background:#fff">' +
        '<div style="font-size:12px;color:' + u.P.mut + ';margin:0 0 6px">Your vector</div>' +
        '<div class="vc-in" style="font-family:IBM Plex Mono,monospace;font-size:13px;line-height:2"></div>' +
        '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:12px 0 0">' +
          '<span style="font-size:12.5px;color:' + u.P.mut + '">Add an element:</span>' +
          ADD.map(function (a, i) { return '<button type="button" class="vc-add" data-i="' + i + '" style="font:inherit;font-size:12.5px;font-weight:600;color:' + u.P.mut + ';background:#fff;border:1px solid ' + u.P.line + ';border-radius:8px;padding:6px 11px;cursor:pointer">+ ' + u.esc(a.label) + '</button>'; }).join('') +
          '<button type="button" class="vc-reset" style="font:inherit;font-size:12.5px;font-weight:600;color:' + u.P.mut + ';background:none;border:1px solid ' + u.P.line + ';border-radius:8px;padding:6px 11px;cursor:pointer">Reset</button>' +
        '</div>' +
        '<div class="vc-out" style="margin:14px 0 0"></div>' +
      '</div>' +
      '<div class="vc-run" style="margin:12px 0 0"></div>';

    wrap.addEventListener('click', function (e) {
      var add = e.target.closest('.vc-add'), rs = e.target.closest('.vc-reset');
      if (add) { items.push(ADD[+add.getAttribute('data-i')]); render(); }
      else if (rs) { items = start.slice(); render(); }
    });
    el.innerHTML = ''; el.appendChild(wrap); render();
  }
  if (window.LessonWidgets) window.LessonWidgets.register('vector-coercion', mount);
})();
