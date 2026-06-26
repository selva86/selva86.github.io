/* bootstrap-sample.js - draw a bootstrap sample (rows picked with replacement)
 * and see which rows are left out (out-of-bag). Counts are real: about 37% of
 * rows land out-of-bag on average. Interactive (Draw again).
 * cfg (optional): { n, seed, tail }  tail = the closing sentence of the note.
 */
(function () {
  'use strict';
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var C_IN = '#1f7a55', C_DUP = '#2563a8', C_OOB = '#aeb6c2', INK = '#131720', MUT = '#677084';

  function mount(el, cfg) {
    cfg = cfg || {};
    var n = cfg.n || 12, seed0 = cfg.seed || 7, draw = 0;
    var tail = cfg.tail || 'Those rows trained no tree here, so they are a free test set.';
    el.innerHTML =
      '<div class="lw-diagram" style="text-align:center">' +
      '<div class="lw-bs-strip" style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:2px 0 10px"></div>' +
      '<div class="lw-bs-note" style="font:600 12px/1.5 \'IBM Plex Mono\',monospace;color:' + INK + ';min-height:3em"></div>' +
      '<button type="button" class="lw-bs-draw" style="margin-top:8px;font:600 12px \'IBM Plex Mono\',monospace;color:#fff;background:' + C_IN + ';border:0;border-radius:7px;padding:8px 16px;cursor:pointer">Draw again</button>' +
      '<div style="font:500 11px/1.5 \'IBM Plex Mono\',monospace;color:' + MUT + ';margin-top:8px">' +
      '<span style="color:' + C_IN + '">&#9632;</span> in the sample &nbsp; <span style="color:' + C_DUP + '">&#9632;</span> picked more than once &nbsp; <span style="color:' + C_OOB + '">&#9632;</span> out-of-bag</div>' +
      '</div>';
    var strip = el.querySelector('.lw-bs-strip'), note = el.querySelector('.lw-bs-note'), btn = el.querySelector('.lw-bs-draw'), i;

    function render() {
      var rng = mulberry32(seed0 + draw * 977), counts = [];
      for (i = 0; i < n; i++) counts[i] = 0;
      for (var d = 0; d < n; d++) { counts[(rng() * n) | 0]++; }
      var oob = 0, html = '';
      for (i = 0; i < n; i++) {
        var c = counts[i], bg = c === 0 ? C_OOB : (c > 1 ? C_DUP : C_IN);
        if (c === 0) oob++;
        var lbl = c === 0 ? 'OOB' : ('#' + (i + 1) + (c > 1 ? (' x' + c) : ''));
        html += '<span style="display:inline-block;min-width:52px;padding:6px 8px;border-radius:6px;background:' + bg + ';color:#fff;font:600 11px \'IBM Plex Mono\',monospace">' + lbl + '</span>';
      }
      strip.innerHTML = html;
      var pct = Math.round(oob / n * 100);
      note.innerHTML = 'Out-of-bag this draw: <b>' + oob + ' of ' + n + '</b> rows (' + pct + '%). ' + tail;
    }
    btn.addEventListener('click', function () { draw++; render(); });
    render();
  }
  if (window.LessonWidgets) window.LessonWidgets.register('bootstrap-sample', mount);
})();
