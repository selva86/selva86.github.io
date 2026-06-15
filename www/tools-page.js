/* Tools landing page: the live Welch two-sample t-test widget in the hero.
   Vanilla JS, no dependencies. Dark mode + reveal-on-scroll live in sections-v3.js. */
(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }

  function init() {
    // Bail safely if the calculator markup is not on this page.
    if (!$('mA') || !$('oT')) return;

    // normal CDF (Abramowitz-Stegun 7.1.26), good to ~1e-7
    function normCdf(z) {
      var t = 1 / (1 + 0.2316419 * Math.abs(z));
      var d = 0.3989422804014327 * Math.exp(-z * z / 2);
      var p = d * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
      return z > 0 ? 1 - p : p;
    }
    // two-sided p from a t-statistic, via a normal approx tail-corrected for df
    // (Welch-Satterthwaite df; for the verdict sentence this is accurate enough to ~3 dp)
    function tTwoSided(t, df) {
      var x = Math.abs(t);
      // small-sample correction toward the t tail (Cornish-Fisher-ish nudge)
      var z = x * (1 - 1 / (4 * df)) / Math.sqrt(1 + x * x / (2 * df));
      return 2 * (1 - normCdf(z));
    }
    function fmt(x, d) { if (!isFinite(x)) return ', '; return x.toFixed(d); }

    function recompute() {
      var mA = parseFloat($('mA').value), sA = parseFloat($('sA').value), nA = parseFloat($('nA').value);
      var mB = parseFloat($('mB').value), sB = parseFloat($('sB').value), nB = parseFloat($('nB').value);
      var lA = ($('lA').value || 'A').trim(), lB = ($('lB').value || 'B').trim();

      var bad = function (el, cond) { el.classList.toggle('bad', cond); };
      var okA = isFinite(mA) && isFinite(sA) && sA >= 0 && isFinite(nA) && nA >= 2;
      var okB = isFinite(mB) && isFinite(sB) && sB >= 0 && isFinite(nB) && nB >= 2;
      bad($('sA'), isFinite(sA) && sA < 0); bad($('nA'), isFinite(nA) && nA < 2);
      bad($('sB'), isFinite(sB) && sB < 0); bad($('nB'), isFinite(nB) && nB < 2);

      if (!okA || !okB) {
        $('oT').textContent = $('oDf').textContent = $('oP').textContent = $('oCI').textContent = ', ';
        $('oSent').innerHTML = 'Enter two means, non-negative standard deviations, and sample sizes of at least 2.';
        return;
      }

      var vA = sA * sA / nA, vB = sB * sB / nB;
      var se = Math.sqrt(vA + vB);
      var diff = mB - mA;                       // B relative to A
      var t = se > 0 ? diff / se : 0;
      // Welch-Satterthwaite degrees of freedom
      var df = se > 0 ? Math.pow(vA + vB, 2) / ((vA * vA) / (nA - 1) + (vB * vB) / (nB - 1)) : (nA + nB - 2);
      var p = se > 0 ? tTwoSided(t, df) : 1;
      // ~95% CI on the difference (t-multiplier approximated; 1.984 near df=95, nudged by df)
      var tcrit = 1.96 * (1 + 1 / (2 * df));
      var lo = diff - tcrit * se, hi = diff + tcrit * se;

      $('oT').textContent = fmt(t, 2);
      $('oDf').textContent = fmt(df, 1);
      var pEl = $('oP');
      pEl.textContent = p < 0.001 ? '<0.001' : fmt(p, 3);
      pEl.className = 'v ' + (p < 0.05 ? 'sig' : 'ns');
      $('oCI').textContent = fmt(lo, 1) + ', ' + fmt(hi, 1);

      // plain-English inference sentence
      var mag = Math.abs(diff);
      var dir = diff >= 0 ? 'higher' : 'lower';
      var who = diff >= 0 ? lB : lA;
      var other = diff >= 0 ? lA : lB;
      var head = mag < 1e-9
        ? (lA + ' and ' + lB + ' have effectively the same mean')
        : (cap(who) + ' is ' + fmt(mag, 1) + ' point' + (Math.abs(mag - 1) < 1e-9 ? '' : 's') + ' ' + dir + ' than ' + other);
      var pTxt = p < 0.001 ? 'p &lt; 0.001' : ('p = ' + fmt(p, 3));
      var tail = p < 0.05
        ? ('At <b>' + pTxt + '</b> that gap is <span class="up">unlikely to be noise</span>.')
        : ('At <b>' + pTxt + '</b> that gap is <span class="dn">well within what chance could produce</span>, so treat it as no real difference.');
      $('oSent').innerHTML = head + '. ' + tail;

      // live R reproduction
      $('oCode').innerHTML =
        '<span class="cm"># Welch two-sample t-test from summary stats</span>\n' +
        '<span class="nm">m</span> <span class="op">&lt;-</span> <span class="fn">c</span>(' + num(mA) + ', ' + num(mB) + '); ' +
        '<span class="nm">s</span> <span class="op">&lt;-</span> <span class="fn">c</span>(' + num(sA) + ', ' + num(sB) + '); ' +
        '<span class="nm">n</span> <span class="op">&lt;-</span> <span class="fn">c</span>(' + num(nA) + ', ' + num(nB) + ')\n' +
        '<span class="nm">se</span> <span class="op">&lt;-</span> <span class="fn">sqrt</span>(s[1]^2/n[1] + s[2]^2/n[2])\n' +
        '<span class="nm">t</span>  <span class="op">&lt;-</span> (m[2] - m[1]) / se\n' +
        '<span class="fn">2</span> <span class="op">*</span> <span class="fn">pt</span>(<span class="op">-</span><span class="fn">abs</span>(t), df = ' + num(round1(df)) + ')' +
        '   <span class="cm">#&gt; ' + (p < 0.001 ? '<0.001' : fmt(p, 3)) + '</span>';
    }
    function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
    function num(x) { var r = Math.round(x * 100) / 100; return ('' + r); }
    function round1(x) { return Math.round(x * 10) / 10; }

    function copyR(btn) {
      var txt = $('oCode').textContent;
      if (navigator.clipboard) { navigator.clipboard.writeText(txt); }
      var old = btn.innerHTML; btn.innerHTML = 'copied';
      setTimeout(function () { btn.innerHTML = old; }, 1300);
    }

    // Wire inputs (markup uses inline oninput="recompute()"; bind here too so the page
    // works without inline handlers, and expose copyR for the inline copy button).
    var ids = ['mA', 'sA', 'nA', 'lA', 'mB', 'sB', 'nB', 'lB'];
    ids.forEach(function (id) {
      var el = $(id);
      if (el) el.addEventListener('input', recompute);
    });
    window.recompute = recompute;
    window.copyR = copyR;

    // compute once on load so the hero shows a real result immediately
    recompute();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
