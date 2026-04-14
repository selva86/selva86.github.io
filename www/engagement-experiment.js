/* Engagement Experiment — isolated prototype, loaded only on ggplot2-Scatter-Plots.html.
 * Builds a segmented progress bar and predict-and-reveal overlays for the first
 * three runnable code blocks. Fully namespaced under class prefix `engagement-`.
 * Rollback = delete this file + revert the fragment + rebuild.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'rsc-engagement-v1:' + location.pathname;

  var STORAGE = {
    load: function () {
      try {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { ran: [], predictionsSeen: [], celebrated: false };
        var data = JSON.parse(raw);
        return {
          ran: Array.isArray(data.ran) ? data.ran : [],
          predictionsSeen: Array.isArray(data.predictionsSeen) ? data.predictionsSeen : [],
          celebrated: Boolean(data.celebrated)
        };
      } catch (e) {
        return { ran: [], predictionsSeen: [], celebrated: false };
      }
    },
    save: function (data) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
      catch (e) { /* quota / private mode — degrade silently */ }
    }
  };

  var NEXT_TUTORIAL = { url: 'ggplot2-Line-Charts.html', title: 'Line Charts' };

  // Deterministic PRNG so silhouettes are stable across loads.
  function mulberry32(seed) {
    return function () {
      var t = seed += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Hand-authored silhouette: faint scatter with a downward slope.
  function buildScatterSilhouette(withColorGroups, seed) {
    var dots = [];
    var rng = mulberry32(seed || 42);
    var palette = ['#0f172a', '#475569', '#94a3b8'];
    for (var i = 0; i < 90; i++) {
      var x = rng();
      var noise = (rng() - 0.5) * 0.28;
      var y = 1 - x * 0.82 + noise;
      var cx = 28 + x * 384;
      var cy = 18 + (1 - Math.max(0, Math.min(1, y))) * 136;
      var fill = '#0f172a';
      var opacity = 0.26;
      if (withColorGroups) {
        var group = Math.floor(x * 3);
        fill = palette[group] || '#0f172a';
        opacity = 0.34;
      }
      dots.push(
        '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) +
        '" r="3.6" fill="' + fill + '" opacity="' + opacity + '"/>'
      );
    }
    return '<svg viewBox="0 0 440 180" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
           dots.join('') + '</svg>';
  }

  // Predictions keyed by visible-block index (blocks that are children of .webr-container
  // and NOT inside a <details> element). Block 2 is a try-it starter — skipped here.
  var PREDICTIONS = {
    0: {
      type: 'TABLE',
      kind: 'text',
      content:
        '      manufacturer  displ  hwy  drv     class     cyl\n' +
        '142     subaru       2.5    27   4    subcompact    4\n' +
        '89      honda        1.6    33   f    subcompact    4\n' +
        '35      dodge        4.7    13   4    pickup        8\n' +
        '77      ford         4.6    15   r    suv           8\n' +
        '18      chevrolet    5.3    16   4    suv           8\n' +
        '121     nissan       3.5    24   f    midsize       6'
    },
    1: {
      type: 'PLOT',
      kind: 'svg',
      content: buildScatterSilhouette(false, 42)
    },
    3: {
      type: 'PLOT',
      kind: 'svg',
      content: buildScatterSilhouette(true, 17)
    }
  };

  function getVisibleBlocks() {
    var all = Array.prototype.slice.call(document.querySelectorAll('.webr-container'));
    return all.filter(function (el) { return !el.closest('details'); });
  }

  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  // -------- Progress bar --------
  function buildProgressBar(total) {
    var wrap = document.createElement('div');
    wrap.className = 'engagement-progress';
    wrap.setAttribute('role', 'progressbar');
    wrap.setAttribute('aria-valuemin', '0');
    wrap.setAttribute('aria-valuemax', String(total));
    wrap.setAttribute('aria-valuenow', '0');
    wrap.setAttribute('aria-label', 'Interactive blocks run on this page');

    var label = document.createElement('div');
    label.className = 'engagement-progress-label';
    label.innerHTML =
      '<strong><span class="engagement-progress-count">' + pad2(0) + '</span></strong>' +
      ' / ' + pad2(total) + ' &middot; Interactive Blocks';

    var pills = document.createElement('div');
    pills.className = 'engagement-progress-pills';
    for (var i = 0; i < total; i++) {
      var p = document.createElement('div');
      p.className = 'engagement-progress-pill';
      p.setAttribute('data-index', String(i));
      pills.appendChild(p);
    }

    wrap.appendChild(label);
    wrap.appendChild(pills);
    return wrap;
  }

  function placeProgressBar(bar) {
    var content = document.querySelector('#content') ||
                  document.querySelector('.col-sm-7') ||
                  document.querySelector('.col-sm-8') ||
                  document.body;
    var lead = content.querySelector('p.lead');
    if (lead && lead.parentElement === content) { lead.after(bar); return; }
    var h1 = content.querySelector('h1');
    if (h1 && h1.parentElement === content) { h1.after(bar); return; }
    content.insertBefore(bar, content.firstChild);
  }

  function updateProgressBar(bar, ranIndices, total, flashIndex) {
    var pills = bar.querySelectorAll('.engagement-progress-pill');
    var countEl = bar.querySelector('.engagement-progress-count');
    var ranSet = {};
    for (var i = 0; i < ranIndices.length; i++) ranSet[ranIndices[i]] = true;

    for (var j = 0; j < pills.length; j++) {
      if (ranSet[j]) pills[j].classList.add('is-filled');
      if (flashIndex === j) {
        pills[j].classList.remove('just-filled');
        void pills[j].offsetWidth;
        pills[j].classList.add('just-filled');
      }
    }

    var ran = ranIndices.length;
    if (countEl) countEl.textContent = pad2(ran);
    bar.setAttribute('aria-valuenow', String(ran));

    if (ran >= total && total > 0) {
      var pillsWrap = bar.querySelector('.engagement-progress-pills');
      pillsWrap.classList.remove('is-complete');
      void pillsWrap.offsetWidth;
      pillsWrap.classList.add('is-complete');
    }
  }

  // -------- Predict & Reveal --------
  function injectPrediction(blockEl, pred) {
    var output = blockEl.querySelector('.webr-output');
    if (!output) return;
    if (output.querySelector('.engagement-prediction')) return;

    var wrap = document.createElement('div');
    wrap.className = 'engagement-prediction';
    wrap.setAttribute('aria-hidden', 'true');

    var badge = document.createElement('span');
    badge.className = 'engagement-prediction-badge';
    badge.textContent = pred.type;

    var content = document.createElement('div');
    content.className = 'engagement-prediction-content';
    if (pred.kind === 'svg') content.innerHTML = pred.content;
    else content.textContent = pred.content;

    var hint = document.createElement('div');
    hint.className = 'engagement-prediction-hint';
    hint.textContent = 'Guess, then reveal';

    wrap.appendChild(badge);
    wrap.appendChild(content);
    wrap.appendChild(hint);
    output.appendChild(wrap);
  }

  function revealPrediction(blockEl) {
    var wrap = blockEl.querySelector('.engagement-prediction');
    if (!wrap) return;
    wrap.classList.add('is-revealing');
    setTimeout(function () { if (wrap.parentNode) wrap.parentNode.removeChild(wrap); }, 400);
  }

  // -------- Completion card --------
  function buildCompletionCard(total) {
    var card = document.createElement('div');
    card.className = 'engagement-completion';
    card.setAttribute('role', 'status');
    card.setAttribute('aria-live', 'polite');
    card.innerHTML =
      '<button class="engagement-completion-dismiss" type="button" aria-label="Dismiss">\u00d7</button>' +
      '<p class="engagement-completion-eyebrow">Tutorial Complete</p>' +
      '<p class="engagement-completion-headline">You finished ggplot2 Scatter Plots</p>' +
      '<p class="engagement-completion-stat">' + total + ' blocks run &middot; Great work</p>' +
      '<a class="engagement-completion-cta" href="' + NEXT_TUTORIAL.url + '">' +
        '<span>Continue with ' + NEXT_TUTORIAL.title + '</span>' +
        '<span class="engagement-completion-cta-arrow">\u2192</span>' +
      '</a>';

    card.querySelector('.engagement-completion-dismiss').addEventListener('click', function () {
      card.classList.remove('is-visible');
      setTimeout(function () { if (card.parentNode) card.parentNode.removeChild(card); }, 450);
    });
    return card;
  }

  // -------- Wire up --------
  function init() {
    var blocks = getVisibleBlocks();
    var total = blocks.length;
    if (total === 0) return;

    var state = STORAGE.load();
    var ranIndices = state.ran.filter(function (i) { return i < total; });
    var ranMap = {};
    ranIndices.forEach(function (i) { ranMap[i] = true; });
    var seenPredictions = {};
    state.predictionsSeen.forEach(function (i) { seenPredictions[i] = true; });

    var bar = buildProgressBar(total);
    placeProgressBar(bar);
    updateProgressBar(bar, ranIndices, total);

    // Inject predictions on eligible, unseen, unrun blocks.
    Object.keys(PREDICTIONS).forEach(function (key) {
      var idx = Number(key);
      if (idx >= total) return;
      if (ranMap[idx]) return;
      if (seenPredictions[idx]) return;
      injectPrediction(blocks[idx], PREDICTIONS[idx]);
    });

    // Observe output class changes to detect a successful run.
    blocks.forEach(function (block, idx) {
      var output = block.querySelector('.webr-output');
      if (!output) return;
      var obs = new MutationObserver(function (mutations) {
        for (var i = 0; i < mutations.length; i++) {
          var m = mutations[i];
          if (m.type !== 'attributes' || m.attributeName !== 'class') continue;
          var cls = output.className || '';
          if (cls.indexOf('has-content') !== -1 ||
              cls.indexOf('has-error') !== -1 ||
              cls.indexOf('has-message') !== -1) {
            markRun(idx);
            return;
          }
        }
      });
      obs.observe(output, { attributes: true, attributeFilter: ['class'] });
    });

    // Delegated click on Run button → fade prediction out, mark as seen.
    document.addEventListener('click', function (e) {
      var btn = e.target && e.target.closest ? e.target.closest('.webr-run-btn') : null;
      if (!btn) return;
      var block = btn.closest('.webr-container');
      if (!block) return;
      if (!block.querySelector('.engagement-prediction')) return;
      revealPrediction(block);
      var blockIdx = blocks.indexOf(block);
      if (blockIdx >= 0 && !seenPredictions[blockIdx]) {
        seenPredictions[blockIdx] = true;
        persist();
      }
    }, true);

    function persist() {
      var ranList = [];
      Object.keys(ranMap).forEach(function (k) { ranList.push(Number(k)); });
      var seenList = [];
      Object.keys(seenPredictions).forEach(function (k) { seenList.push(Number(k)); });
      STORAGE.save({ ran: ranList, predictionsSeen: seenList, celebrated: state.celebrated });
    }

    function markRun(idx) {
      if (ranMap[idx]) return;
      ranMap[idx] = true;
      var ranList = [];
      Object.keys(ranMap).forEach(function (k) { ranList.push(Number(k)); });
      persist();
      updateProgressBar(bar, ranList, total, idx);

      if (ranList.length >= total && !state.celebrated) {
        state.celebrated = true;
        persist();
        showCompletion(total);
      }
    }

    function showCompletion(total) {
      var card = buildCompletionCard(total);
      document.body.appendChild(card);
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { card.classList.add('is-visible'); });
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
