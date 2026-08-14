/* luck-simulator - "could it be pure luck?" made tangible.
 *
 * Simulates a guessing game: someone with NO skill guesses `trials` times,
 * each guess right with probability `p`. Every run counts the lucky hits and
 * drops the result onto a growing histogram. A marker sits at the observed
 * result, and the readout tracks how often pure luck matched or beat it -
 * the beating heart of inference-from-zero (and, later, of p-values).
 *
 * cfg (all optional):
 *   trials    guesses per run            (default 10)
 *   p         chance each guess is right (default 0.5)
 *   observed  the real result to judge   (default 9)
 *   unit      noun for the readout       (default "correct guesses")
 *   seed      RNG seed                   (default 42; deterministic replays)
 *
 * Numbers are REAL: every bar is an actual simulated run, the >= counter is
 * an actual count. Nothing is faked or precomputed.
 */
(function () {
  'use strict';

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function mount(el, cfg) {
    var trials = cfg.trials || 10;
    var p = (cfg.p === undefined) ? 0.5 : cfg.p;
    var observed = (cfg.observed === undefined) ? 9 : cfg.observed;
    var unit = cfg.unit || 'correct guesses';
    var rng = mulberry32(cfg.seed || 42);

    var counts = new Array(trials + 1).fill(0);
    var total = 0, atLeast = 0;

    el.innerHTML =
      '<div class="lw-luck" style="font-family:inherit">' +
      '<div class="lw-luck-bars" style="display:flex;align-items:flex-end;gap:3px;height:150px;padding:6px 2px 0"></div>' +
      '<div class="lw-luck-x" style="display:flex;gap:3px;font-size:11px;opacity:.75;text-align:center"></div>' +
      '<div class="lw-luck-out" style="margin:10px 0 8px;font-size:14px;line-height:1.5"></div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
      '<button type="button" class="lw-btn" data-n="1">Run 1 game</button>' +
      '<button type="button" class="lw-btn" data-n="100">Run 100</button>' +
      '<button type="button" class="lw-btn" data-n="1000">Run 1,000</button>' +
      '<button type="button" class="lw-btn" data-reset="1">Reset</button>' +
      '</div></div>';

    var barsEl = el.querySelector('.lw-luck-bars');
    var xEl = el.querySelector('.lw-luck-x');
    var outEl = el.querySelector('.lw-luck-out');
    var bars = [];
    for (var k = 0; k <= trials; k++) {
      var wrap = document.createElement('div');
      wrap.style.cssText = 'flex:1;display:flex;flex-direction:column;justify-content:flex-end;height:100%';
      var bar = document.createElement('div');
      var hot = k >= observed;
      bar.style.cssText = 'width:100%;height:0%;border-radius:3px 3px 0 0;transition:height .15s;' +
        'background:' + (hot ? '#d97706' : '#3b82f6') + ';opacity:' + (hot ? '1' : '.75');
      wrap.appendChild(bar);
      barsEl.appendChild(wrap);
      bars.push(bar);
      var lab = document.createElement('div');
      lab.style.cssText = 'flex:1';
      lab.textContent = k;
      xEl.appendChild(lab);
    }

    el.querySelectorAll('.lw-btn').forEach(function (b) {
      b.style.cssText = 'font:inherit;font-size:13px;padding:6px 12px;border:1px solid currentColor;' +
        'border-radius:7px;background:transparent;cursor:pointer;opacity:.9';
    });

    function runOnce() {
      var hits = 0;
      for (var i = 0; i < trials; i++) if (rng() < p) hits++;
      counts[hits]++; total++;
      if (hits >= observed) atLeast++;
    }

    function render() {
      var max = Math.max.apply(null, counts.concat([1]));
      for (var k = 0; k <= trials; k++) {
        bars[k].style.height = (counts[k] / max * 100) + '%';
      }
      if (!total) {
        outEl.innerHTML = 'No games yet. Each game: a pure guesser makes <b>' + trials +
          '</b> guesses, each right half the time. Press a button and watch where luck lands.';
        return;
      }
      var pct = (atLeast / total * 100);
      outEl.innerHTML = '<b>' + total.toLocaleString() + '</b> games of pure guessing so far. ' +
        'Luck reached <b>' + observed + ' or more ' + unit + '</b> in <b>' + atLeast.toLocaleString() +
        '</b> of them, which is <b>' + (pct < 0.1 && atLeast > 0 ? pct.toFixed(2) : pct.toFixed(1)) + '%</b>.';
    }

    el.querySelector('.lw-luck').addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.reset) {
        counts = new Array(trials + 1).fill(0); total = 0; atLeast = 0;
        rng = mulberry32(cfg.seed || 42);
      } else {
        var n = parseInt(b.dataset.n, 10) || 1;
        for (var i = 0; i < n; i++) runOnce();
      }
      render();
    });

    render();
  }

  if (window.LessonWidgets) window.LessonWidgets.register('luck-simulator', mount);
})();
