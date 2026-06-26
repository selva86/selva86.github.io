/* decorrelation.js - toggle bagging vs random-features and watch the trees'
 * first splits go from all-identical (correlated) to varied (decorrelated).
 * Ported from _mocks/rf-course-lesson2.
 */
(function () {
  'use strict';
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  function mount(el, cfg) {
    var FEATS = [
      { n: 'tenure', s: 0.92, c: '#2563a8' }, { n: 'monthly_spend', s: 0.64, c: '#1f7a55' },
      { n: 'support_calls', s: 0.55, c: '#b5631a' }, { n: 'contract', s: 0.42, c: '#8a46b0' },
      { n: 'age', s: 0.22, c: '#5a4fcf' }
    ];
    var mtry = 5;
    el.innerHTML =
      '<div class="lw-toggle"><button type="button" data-m="5" class="on">Consider all 5 features (bagging)</button>' +
      '<button type="button" data-m="2">Random 2 of 5 (random forest)</button></div>' +
      '<div class="lw-dtrees"></div>' +
      '<div class="lw-divmeter"><span class="lw-divlbl">Tree <b>diversity</b></span>' +
      '<span class="lw-divtrack"><span class="lw-divfill"></span></span><span class="lw-divpv">.</span></div>' +
      '<div class="lw-note"></div>';
    var host = el.querySelector('.lw-dtrees'), fill = el.querySelector('.lw-divfill'),
        pv = el.querySelector('.lw-divpv'), note = el.querySelector('.lw-note');

    function render() {
      var roots = [], html = '';
      for (var t = 0; t < 6; t++) {
        var rng = mulberry32(50 + t * 131 + (mtry === 5 ? 0 : 324));
        var idx = [0, 1, 2, 3, 4];
        for (var s = 4; s > 0; s--) { var j = (rng() * (s + 1)) | 0; var tmp = idx[s]; idx[s] = idx[j]; idx[j] = tmp; }
        var subset = idx.slice(0, mtry), bf = subset[0];
        subset.forEach(function (f) { if (FEATS[f].s > FEATS[bf].s) bf = f; });
        roots.push(bf);
        html += '<div class="lw-dcard"><div class="lw-dtn">tree ' + (t + 1) + '</div><div class="lw-drl">first split on</div>' +
          '<div class="lw-droot" style="background:' + FEATS[bf].c + '">' + FEATS[bf].n + '</div></div>';
      }
      host.innerHTML = html;
      var distinct = {}; roots.forEach(function (r) { distinct[r] = 1; });
      var div = Object.keys(distinct).length, pct = Math.round((div - 1) / 5 * 100);
      fill.style.width = pct + '%'; pv.textContent = div + '/6';
      note.innerHTML = (mtry === 5)
        ? '<b>Bagging:</b> every tree may use all features, so the strongest one, <code>tenure</code>, wins every first split. The trees are near-identical, correlated, and averaging barely helps.'
        : '<b>Random forest:</b> each tree sees only 2 random features, so <code>tenure</code> often is not even an option. The first splits scatter across features, the trees decorrelate, and averaging pays off.';
    }
    Array.prototype.forEach.call(el.querySelectorAll('.lw-toggle button'), function (b) {
      b.addEventListener('click', function () {
        mtry = +b.getAttribute('data-m');
        Array.prototype.forEach.call(el.querySelectorAll('.lw-toggle button'), function (x) { x.classList.toggle('on', x === b); });
        render();
      });
    });
    render();
  }
  if (window.LessonWidgets) window.LessonWidgets.register('decorrelation', mount);
})();
