/* tree-diagram.js - a clean static decision-tree SVG. Used as a cover hero so a
 * lesson opens with a visual, not plain text. Non-interactive by design (it sets
 * the scene without spoiling the live demos later in the lesson).
 *
 * cfg (all optional): { root, l, r, leaves:[ll,lr,rl,rr] }  // node labels
 */
(function () {
  'use strict';
  var INK = '#131720', C0 = '#2563a8', C1 = '#b5631a', LINE = '#c5cdda', MUT = '#677084';

  function box(x, y, w, h, fill, stroke, text, tcolor, fs) {
    return '<rect x="' + (x - w / 2) + '" y="' + (y - h / 2) + '" width="' + w + '" height="' + h +
      '" rx="8" fill="' + fill + '" stroke="' + stroke + '" stroke-width="1.5"/>' +
      '<text x="' + x + '" y="' + (y + (fs ? fs * 0.34 : 4.5)) + '" text-anchor="middle" fill="' + tcolor +
      '" font-family="IBM Plex Mono, monospace" font-size="' + (fs || 12) + '" font-weight="600">' + text + '</text>';
  }
  function edge(x1, y1, x2, y2, label) {
    var mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + LINE + '" stroke-width="2"/>' +
      (label ? '<text x="' + mx + '" y="' + (my - 3) + '" text-anchor="middle" fill="' + MUT +
        '" font-family="IBM Plex Mono, monospace" font-size="10">' + label + '</text>' : '');
  }

  function mount(el, cfg) {
    cfg = cfg || {};
    var root = cfg.root || 'tenure < 8 mo?';
    var l = cfg.l || 'calls > 3?', r = cfg.r || 'spend > $70?';
    var lv = cfg.leaves || ['churns', 'stays', 'stays', 'churns'];
    var svg =
      '<svg viewBox="0 0 460 300" width="100%" style="max-width:460px;display:block;margin:0 auto" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A decision tree splitting customers by tenure, calls and spend into churn or stay leaves.">' +
      edge(230, 49, 120, 116, 'yes') + edge(230, 49, 340, 116, 'no') +
      edge(120, 144, 70, 214, 'yes') + edge(120, 144, 170, 214, 'no') +
      edge(340, 144, 290, 214, 'yes') + edge(340, 144, 390, 214, 'no') +
      box(230, 34, 150, 30, '#fff', INK, root, INK, 12.5) +
      box(120, 130, 120, 28, '#fff', '#9aa6b8', l, INK, 11.5) +
      box(340, 130, 120, 28, '#fff', '#9aa6b8', r, INK, 11.5) +
      leaf(70, 228, lv[0]) + leaf(170, 228, lv[1]) + leaf(290, 228, lv[2]) + leaf(390, 228, lv[3]) +
      '</svg>';
    el.innerHTML = '<div class="lw-diagram">' + svg + '</div>';
  }
  function leaf(x, y, label) {
    var churn = /churn/i.test(label);
    var fill = churn ? 'rgba(181,99,26,0.12)' : 'rgba(37,99,168,0.12)';
    var stroke = churn ? C1 : C0;
    return box(x, y, 86, 28, fill, stroke, label, churn ? C1 : C0, 11.5);
  }

  if (window.LessonWidgets) window.LessonWidgets.register('tree-diagram', mount);
})();
