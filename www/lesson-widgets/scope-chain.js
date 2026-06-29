/* scope-chain.js - foundations: lexical scoping. Inside a function, a name is
 * looked up in the function's own environment first, then outward to the global
 * environment. Pick a name and watch the lookup walk the chain. Then run it.
 * cfg: { global:{x:10,y:20}, local:{y:99} }
 */
(function () {
  'use strict';
  function mount(el, cfg) {
    var u = window.LessonWidgets.u; if (!u) return;
    cfg = cfg || {};
    var G = cfg.global || { x: 10, y: 20 }, L = cfg.local || { y: 99 };
    var names = Object.keys(G); // lookup choices = every name that exists somewhere
    Object.keys(L).forEach(function (k) { if (names.indexOf(k) < 0) names.push(k); });

    var wrap = document.createElement('div');
    wrap.style.cssText = 'font-family:IBM Plex Sans,system-ui,sans-serif';

    function envBox(title, vars, opts) {
      opts = opts || {};
      var rows = Object.keys(vars).map(function (k) {
        var hit = opts.foundKey === k, dim = opts.dimKey === k;
        var bg = hit ? u.P.add : '#fff';
        return '<span style="font-family:IBM Plex Mono,monospace;font-size:13px;padding:4px 9px;border-radius:6px;border:1px solid ' + (hit ? u.P.acc : u.P.line) + ';background:' + bg + ';color:' + (dim ? u.P.faint : u.P.ink) + ';' + (dim ? 'text-decoration:line-through' : '') + '">' + u.esc(k) + ' = ' + u.esc(vars[k]) + (hit ? '  &#10003;' : '') + '</span>';
      }).join(' ');
      return '<div style="border:1px solid ' + (opts.active ? u.P.acc : u.P.line) + ';border-radius:10px;padding:11px 13px;background:' + (opts.active ? '#f7fbf9' : '#fff') + '">' +
        '<div style="font-size:11px;font-weight:700;color:' + u.P.mut + ';text-transform:uppercase;letter-spacing:.04em;margin:0 0 7px">' + u.esc(title) + '</div>' +
        '<div style="display:flex;gap:7px;flex-wrap:wrap">' + (rows || '<span style="font-size:12px;color:' + u.P.faint + '">(empty)</span>') + '</div>' +
      '</div>';
    }

    function render(pick) {
      var localHas = pick != null && Object.prototype.hasOwnProperty.call(L, pick);
      var lo = {}, go = {}, msg = '';
      if (pick != null) {
        if (localHas) { lo = { active: true, foundKey: pick }; go = {}; msg = '<b>' + pick + '</b> is found in f()&rsquo;s own environment &rarr; <code style="font-family:IBM Plex Mono,monospace">' + L[pick] + '</code>. The local value shadows the global one.'; }
        else { lo = { active: true, dimKey: undefined }; go = { foundKey: pick }; msg = '<b>' + pick + '</b> is not in f(), so R looks outward to the global environment &rarr; <code style="font-family:IBM Plex Mono,monospace">' + G[pick] + '</code>.'; }
      }
      wrap.querySelector('.sc-local').innerHTML = envBox('inside f()  (local)', L, lo);
      wrap.querySelector('.sc-global').innerHTML = envBox('global environment', G, go);
      wrap.querySelector('.sc-msg').innerHTML = pick == null ? '<span style="color:' + u.P.faint + '">Pick a name to resolve from inside f().</span>' : msg;
    }

    wrap.innerHTML =
      '<div style="display:flex;gap:9px;align-items:center;flex-wrap:wrap;margin:0 0 12px">' +
        '<span style="font-size:12.5px;color:' + u.P.mut + '">Inside f(), look up:</span>' +
        names.map(function (nm) { return '<button type="button" class="sc-pick" data-n="' + u.esc(nm) + '" style="font:inherit;font-size:13px;font-weight:600;font-family:IBM Plex Mono,monospace;color:' + u.P.mut + ';background:#fff;border:1px solid ' + u.P.line + ';border-radius:8px;padding:6px 13px;cursor:pointer">' + u.esc(nm) + '</button>'; }).join('') +
      '</div>' +
      '<div class="sc-local" style="margin:0 0 8px"></div>' +
      '<div style="text-align:center;color:' + u.P.faint + ';font-size:16px;margin:0 0 8px">&darr; if not found, look outward</div>' +
      '<div class="sc-global"></div>' +
      '<div class="sc-msg" style="margin:11px 0 0;font-size:13px;color:' + u.P.body + ';line-height:1.5"></div>' +
      '<div style="margin:13px 0 0">' + u.runnable('x <- 10\ny <- 20\n\nf <- function() {\n  y <- 99\n  c(x = x, y = y)   # x from global, y from local\n}\n\nf()', { label: 'Run it in R' }) + '</div>';

    wrap.addEventListener('click', function (e) {
      var b = e.target.closest('.sc-pick'); if (!b) return;
      Array.prototype.forEach.call(wrap.querySelectorAll('.sc-pick'), function (x) { x.style.background = '#fff'; x.style.color = u.P.mut; });
      b.style.background = u.P.acc; b.style.color = '#fff';
      render(b.getAttribute('data-n'));
    });
    el.innerHTML = ''; el.appendChild(wrap); render(null);
  }
  if (window.LessonWidgets) window.LessonWidgets.register('scope-chain', mount);
})();
