/* sample-size-calculator-ui.js - UI for tools/sample-size-calculator.html.
   All arithmetic lives in samplesize-math.js (verified against R's qnorm via
   Scripts/tool-truth/sample-size-calculator.R). Nothing is recomputed here.
   Externalised from the page so the rendered HTML stays under the tool-audit
   size ceiling; the GA hooks stay inline on the page, where the audit greps. */
(function () {
  'use strict';
  var SS = window.SampleSizeMath;
  if (!SS) return;

  var $ = function (id) { return document.getElementById(id); };
  var mode = 'prop';
  var used = false;

  // ------------------------------------------------------------ formatting
  function commas(n) { return Number(n).toLocaleString('en-US'); }
  function sig(x, d) {
    if (!isFinite(x)) return '-';
    return Number(x.toPrecision(d || 4)).toLocaleString('en-US',
      { maximumFractionDigits: 6 });
  }
  function pct(x, d) { return (x * 100).toFixed(d == null ? 3 : d) + '%'; }
  // Trailing-zero-free fixed decimal, for prose where 2.50 reads worse than 2.5.
  function trim(x, d) {
    var s = Number(x).toFixed(d == null ? 4 : d);
    return s.indexOf('.') < 0 ? s : s.replace(/\.?0+$/, '');
  }
  // R's default console formatting: 7 significant digits, trailing zeros
  // dropped. Strips zeros ONLY after a decimal point, or 1000 would print
  // as 1 (toPrecision(7) gives "1000.000").
  function rnum(x) {
    var s = Number(x).toPrecision(7);
    if (s.indexOf('e') >= 0) return s;
    if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
    return s;
  }
  // A literal for the emitted R. String() gives the shortest representation
  // that round-trips the double, so R parses back the EXACT number the page
  // computed with. Rounding here (0.0314159265 -> 0.031416) would quietly
  // make R answer a slightly different question than the one on screen.
  function rlit(x) {
    var s = String(x);
    return (s.indexOf('e') >= 0) ? Number(x).toPrecision(15) : s;
  }

  function val(id) { return parseFloat($(id).value); }
  function popVal() {
    var raw = $('Npop').value.trim();
    if (raw === '') return null;
    var v = parseFloat(raw);
    return (isFinite(v) && v > 0) ? v : null;
  }

  // ----------------------------------------------------------- validation
  // Returns an error string, or null when the inputs are usable. Human
  // sentences, not field names: the user has to know what to change.
  function validate() {
    var conf = val('conf');
    if (!isFinite(conf) || conf <= 50 || conf >= 100)
      return 'Confidence level must be between 50 and 100 (95 is standard).';
    var N = $('Npop').value.trim();
    if (N !== '' && (!isFinite(parseFloat(N)) || parseFloat(N) < 2))
      return 'Population size must be at least 2, or blank if the population is large.';
    if (mode === 'prop') {
      var E = val('Eprop'), p = val('pexp');
      if (!isFinite(E) || E <= 0) return 'Enter a margin of error greater than 0 (try 3 for plus or minus 3 points).';
      if (E >= 50) return 'A margin of plus or minus 50 points covers every possible answer. Try something under 50.';
      if (!isFinite(p) || p < 0 || p > 100) return 'Expected percentage must be between 0 and 100 (use 50 if you have no idea).';
    } else {
      var Em = val('Emean'), sd = val('sd');
      if (!isFinite(Em) || Em <= 0) return "Enter a margin of error greater than 0, in your outcome's own units.";
      if (!isFinite(sd) || sd <= 0) return 'Enter the standard deviation you expect. It must be greater than 0.';
    }
    return null;
  }

  // ------------------------------------------------------------- the maths
  function current() {
    var conf = val('conf') / 100;
    var N = popVal();
    if (mode === 'prop') {
      var E = val('Eprop') / 100, p = val('pexp') / 100;
      var r = SS.sizeProp(E, p, conf, N);
      r.E = E; r.p = p; r.conf = conf; r.N = N;
      r.deg = SS.degenerate('prop', p);
      r.moe = r.n > 0 ? SS.marginAt('prop', r.n, conf, N, p, null) : NaN;
      return r;
    }
    var Em = val('Emean'), sd = val('sd');
    var m = SS.sizeMean(Em, sd, conf, N);
    m.E = Em; m.sd = sd; m.conf = conf; m.N = N; m.deg = null;
    m.moe = SS.marginAt('mean', m.n, conf, N, null, sd);
    return m;
  }

  // ------------------------------------------------------------------ viz
  // n against margin of error, with your point marked. The hyperbola IS the
  // lesson: the curve is flat where margins are loose and goes near-vertical
  // as they tighten, which is the 1/E^2 law made visible.
  function viz(r) {
    var W = 620, H = 200, L = 52, R = 14, T = 12, B = 34;
    var lo = r.E / 4, hi = r.E * 2.5;
    var pts = [], i, E, n;
    for (i = 0; i <= 120; i++) {
      E = lo + (hi - lo) * i / 120;
      n = (mode === 'prop')
        ? SS.sizeProp(E, r.p, r.conf, r.N).nExact
        : SS.sizeMean(E, r.sd, r.conf, r.N).nExact;
      pts.push([E, n]);
    }
    var nmax = pts[0][1];
    if (!isFinite(nmax) || nmax <= 0) { $('viz').innerHTML = ''; return; }
    var x = function (e) { return L + (e - lo) / (hi - lo) * (W - L - R); };
    var y = function (v) { return T + (1 - Math.min(v, nmax) / nmax) * (H - T - B); };

    var d = pts.map(function (p, k) { return (k ? 'L' : 'M') + x(p[0]).toFixed(1) + ' ' + y(p[1]).toFixed(1); }).join(' ');
    var area = d + ' L' + x(hi).toFixed(1) + ' ' + y(0).toFixed(1) + ' L' + x(lo).toFixed(1) + ' ' + y(0).toFixed(1) + ' Z';

    var mx = x(r.E), my = y(r.nExact);
    var lab = (mode === 'prop') ? ('±' + trim(r.E * 100, 2) + ' pts') : ('±' + trim(r.E, 4));
    var ticks = '';
    [lo, (lo + hi) / 2, hi].forEach(function (e) {
      var t = (mode === 'prop') ? trim(e * 100, 2) : trim(e, 3);
      ticks += '<text x="' + x(e).toFixed(1) + '" y="' + (H - 12) + '" text-anchor="middle" font-size="10.5" fill="#888e97">' + t + '</text>';
    });

    $('viz').innerHTML =
      '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Sample size against margin of error. At a margin of ' +
      lab.replace('±', 'plus or minus ') + ' you need ' + commas(r.n) + '. The curve rises steeply as the margin tightens.">' +
      '<path d="' + area + '" fill="#e8f3ee"/>' +
      '<path d="' + d + '" fill="none" stroke="#1f7a55" stroke-width="2"/>' +
      '<line x1="' + L + '" y1="' + y(0) + '" x2="' + (W - R) + '" y2="' + y(0) + '" stroke="#e9e9e4"/>' +
      '<line x1="' + L + '" y1="' + T + '" x2="' + L + '" y2="' + y(0) + '" stroke="#e9e9e4"/>' +
      '<line x1="' + mx.toFixed(1) + '" y1="' + my.toFixed(1) + '" x2="' + mx.toFixed(1) + '" y2="' + y(0) + '" stroke="#155c40" stroke-width="1" stroke-dasharray="3 3"/>' +
      '<circle cx="' + mx.toFixed(1) + '" cy="' + my.toFixed(1) + '" r="4.5" fill="#155c40"/>' +
      '<text x="' + Math.min(mx + 9, W - 70).toFixed(1) + '" y="' + Math.max(my - 7, T + 10).toFixed(1) + '" font-size="11.5" font-weight="600" fill="#155c40">' + commas(r.n) + '</text>' +
      '<text x="' + (L - 6) + '" y="' + (T + 9) + '" text-anchor="end" font-size="10.5" fill="#888e97">' + commas(Math.round(nmax)) + '</text>' +
      '<text x="' + (L - 6) + '" y="' + y(0) + '" text-anchor="end" font-size="10.5" fill="#888e97">0</text>' +
      ticks +
      '<text x="' + ((L + W - R) / 2) + '" y="' + H + '" text-anchor="middle" font-size="10.5" fill="#888e97">margin of error' +
      (mode === 'prop' ? ' (points)' : '') + '</text>' +
      '</svg>';
  }

  // ------------------------------------------------------------ live tables
  function levTable(r) {
    var rows, labs, k;
    if (mode === 'prop') {
      rows = [0.01, 0.02, 0.03, 0.05, 0.10];
      labs = rows.map(function (e) { return '±' + trim(e * 100, 2) + ' points'; });
    } else {
      rows = [r.E * 0.5, r.E, r.E * 2, r.E * 4];
      labs = rows.map(function (e) { return '±' + trim(e, 4); });
    }
    var html = '';
    for (k = 0; k < rows.length; k++) {
      var cur = Math.abs(rows[k] - r.E) < 1e-12;
      html += '<tr' + (cur ? ' class="cur"' : '') + '><td>' + labs[k] + (cur ? ' (yours)' : '') + '</td>';
      [0.90, 0.95, 0.99].forEach(function (cf) {
        var n = (mode === 'prop')
          ? SS.sizeProp(rows[k], r.p, cf, r.N).n
          : SS.sizeMean(rows[k], r.sd, cf, r.N).n;
        html += '<td' + (cur ? ' class="cur"' : '') + '>' + commas(n) + '</td>';
      });
      html += '</tr>';
    }
    $('levbody').innerHTML = html;
    $('levh').textContent = (mode === 'prop') ? 'Margin of error' : 'Margin of error (your units)';
  }

  // ----------------------------------------------------------------- steps
  function steps(r) {
    var s = [], z = r.z;
    s.push(['Find the critical value',
      'z = qnorm(1 - (1 - ' + trim(r.conf, 4) + ') / 2) = ' + z.toFixed(6)]);
    if (mode === 'prop') {
      s.push(['Size it as if the population were infinite',
        'n₀ = z² × p(1-p) / E² = ' + z.toFixed(4) + '² × ' +
        trim(r.p, 4) + '(1 - ' + trim(r.p, 4) + ') / ' + trim(r.E, 6) + '² = ' + sig(r.n0, 8)]);
    } else {
      s.push(['Size it as if the population were infinite',
        'n₀ = (z × SD / E)² = (' + z.toFixed(4) + ' × ' + trim(r.sd, 6) +
        ' / ' + trim(r.E, 6) + ')² = ' + sig(r.n0, 8)]);
    }
    if (r.N != null) {
      s.push(['Correct for your finite population',
        'n = n₀ / (1 + (n₀ - 1)/N) = ' + sig(r.n0, 8) + ' / (1 + (' + sig(r.n0, 8) +
        ' - 1)/' + commas(r.N) + ') = ' + sig(r.nExact, 8)]);
    } else {
      s.push(['No population correction',
        'You left the population blank, so it is treated as large enough not to matter.']);
    }
    s.push(['Round up to a whole person',
      'ceiling(' + sig(r.nExact, 8) + ') = ' + commas(r.n)]);
    if (isFinite(r.moe)) {
      s.push(['Check what that sample actually buys',
        'margin at n = ' + commas(r.n) + ' is ' +
        (mode === 'prop' ? pct(r.moe, 4) : trim(r.moe, 5)) +
        ', a shade tighter than the ' +
        (mode === 'prop' ? pct(r.E, 4) : trim(r.E, 5)) + ' you asked for, because rounding only adds people.']);
    }
    $('steps').innerHTML = s.map(function (st, i) {
      return '<div class="step"><div class="n">' + (i + 1) + '</div><div class="sx"><b>' +
        st[0] + '</b><span class="sc">' + st[1] + '</span></div></div>';
    }).join('');
  }

  // ---------------------------------------------------------------- R code
  // Every line below runs as written. Rscript auto-prints, so the #> lines are
  // the real console output, and #> is already a comment (no print() needed).
  function rcode(r) {
    var L = [];
    if (mode === 'prop') {
      L.push('# Sample size to estimate a proportion within a margin of error');
      L.push('E    <- ' + rlit(r.E) + '   # margin of error you want (as a proportion)');
      L.push('p    <- ' + rlit(r.p) + '   # proportion you expect (0.5 = worst case)');
      L.push('conf <- ' + rlit(r.conf) + '   # confidence level');
      L.push('');
      L.push('z  <- qnorm(1 - (1 - conf) / 2)');
      L.push('n0 <- z^2 * p * (1 - p) / E^2');
      if (r.N == null) {
        L.push('ceiling(n0)');
        L.push('#> [1] ' + r.n);
      } else {
        L.push('');
        L.push('N <- ' + rlit(r.N) + '   # your population size');
        L.push('n <- n0 / (1 + (n0 - 1) / N)   # finite population correction');
        L.push('ceiling(n)');
        L.push('#> [1] ' + r.n);
      }
      L.push('');
      L.push('# What that whole-person sample actually delivers:');
      L.push('z * sqrt(p * (1 - p) / ' + r.n + ')' +
        (r.N == null ? '' : ' * sqrt((N - ' + r.n + ') / (N - 1))'));
      L.push('#> [1] ' + rnum(r.moe));
    } else {
      L.push('# Sample size to estimate a mean within a margin of error');
      L.push("E    <- " + rlit(r.E) + "   # margin of error, in the outcome's units");
      L.push('sd   <- ' + rlit(r.sd) + '   # standard deviation you expect');
      L.push('conf <- ' + rlit(r.conf) + '   # confidence level');
      L.push('');
      L.push('z  <- qnorm(1 - (1 - conf) / 2)');
      L.push('n0 <- (z * sd / E)^2');
      if (r.N == null) {
        L.push('ceiling(n0)');
        L.push('#> [1] ' + r.n);
      } else {
        L.push('');
        L.push('N <- ' + rlit(r.N) + '   # your population size');
        L.push('n <- n0 / (1 + (n0 - 1) / N)   # finite population correction');
        L.push('ceiling(n)');
        L.push('#> [1] ' + r.n);
      }
      L.push('');
      L.push('# What that whole-person sample actually delivers:');
      L.push('z * (sd / sqrt(' + r.n + '))' +
        (r.N == null ? '' : ' * sqrt((N - ' + r.n + ') / (N - 1))'));
      L.push('#> [1] ' + rnum(r.moe));
    }
    $('rcodepre').textContent = L.join('\n');
  }

  // --------------------------------------------------------------- render
  function render() {
    var e = validate();
    if (e) {
      $('err').textContent = e;
      $('err').classList.add('show');
      return;
    }
    $('err').classList.remove('show');

    var r = current();

    // Degenerate: p at 0 or 100 kills the variance term, so the formula
    // returns 0 people. Say so plainly rather than printing "survey 0 people".
    if (r.deg === 'boundary-p') {
      $('vchip').textContent = 'Estimating a percentage';
      $('verdict').textContent = 'That percentage needs a different method';
      $('vsub').textContent = 'At 0% or 100% the normal approximation has no variance to work with.';
      $('bignv').textContent = '-';
      $('bignl').textContent = 'no answer from this formula';
      $('viz').innerHTML = '';
      $('stats').hidden = true;
      $('whatif').hidden = true;
      $('plain').innerHTML = 'You entered an expected percentage of <b>' + trim(r.p * 100, 2) +
        '%</b>. The formula multiplies by <b>p(1 - p)</b>, which is exactly zero at both ends, so it reports that you need nobody. That is an artefact of the normal approximation, not a real answer: a rate you believe is 0% still needs a sample to demonstrate it. Plan with a small non-zero value you would not be embarrassed by (1% or 2%), or use an exact method such as the rule of three.';
      $('inftext').innerHTML = 'The normal approximation does not hold at <b>p = ' + trim(r.p * 100, 2) +
        '%</b>, so there is no sample size to report here. Enter a value strictly between 0 and 100.';
      $('report').textContent = 'No sample size: the normal approximation is not valid at p = ' + trim(r.p * 100, 2) + '%.';
      $('rcodepre').textContent = '# p = ' + trim(r.p, 4) + ' makes p*(1-p) = 0, so the closed form returns 0.\n' +
        '# Use an exact approach instead, e.g. the rule of three for a zero-event rate:\n' +
        '3 / 0.01   # n for 95% confidence that a rate is below 1% if you see no events\n#> [1] 300';
      $('steps').innerHTML = '<div class="step"><div class="n">!</div><div class="sx"><b>Not computable</b>' +
        '<span class="sc">p(1 - p) = 0 at p = ' + trim(r.p, 4) + ', so n0 = z² × 0 / E² = 0.</span></div></div>';
      return;
    }

    $('stats').hidden = false;
    $('whatif').hidden = false;

    var unit = (mode === 'prop') ? 'people' : 'observations';
    var askLab = (mode === 'prop')
      ? '±' + trim(r.E * 100, 2) + ' points'
      : '±' + trim(r.E, 4);
    var gotLab = (mode === 'prop') ? pct(r.moe, 3) : trim(r.moe, 4);

    $('vchip').textContent = (mode === 'prop') ? 'Estimating a percentage' : 'Estimating an average';
    $('verdict').textContent = (mode === 'prop')
      ? 'Survey ' + commas(r.n) + ' ' + (r.n === 1 ? 'person' : 'people')
      : 'Collect ' + commas(r.n) + ' ' + (r.n === 1 ? 'observation' : 'observations');
    $('vsub').textContent = (mode === 'prop')
      ? 'To report a percentage to within ' + trim(r.E * 100, 2) + ' points at ' + trim(r.conf * 100, 2) + '% confidence.'
      : 'To report an average to within ' + trim(r.E, 4) + ' at ' + trim(r.conf * 100, 2) + '% confidence.';
    $('bignv').textContent = commas(r.n);
    $('bignl').textContent = (mode === 'prop') ? 'people to survey' : 'observations to collect';

    $('s_exact').textContent = sig(r.nExact, 6);
    $('s_moe').textContent = gotLab;
    $('s_z').textContent = r.z.toFixed(3);
    $('s_z').previousElementSibling.textContent = 'z for ' + trim(r.conf * 100, 2) + '%';
    if (r.N == null) {
      $('s_4k').textContent = 'Population';
      $('s_4').textContent = 'Not set';
    } else {
      $('s_4k').textContent = 'Share of population';
      $('s_4').textContent = (r.n / r.N * 100).toFixed(1) + '%';
    }

    viz(r);
    levTable(r);
    steps(r);
    rcode(r);

    // Plain English
    var saved = '';
    if (r.N != null) {
      var inf = (mode === 'prop') ? SS.sizeProp(r.E, r.p, r.conf, null).n : SS.sizeMean(r.E, r.sd, r.conf, null).n;
      if (inf > r.n) {
        saved = ' Because your population is only ' + commas(r.N) + ', you need ' + commas(inf - r.n) +
          ' fewer than the ' + commas(inf) + ' an unlimited population would demand.';
      } else {
        saved = ' Your population of ' + commas(r.N) + ' is large enough that the correction changes nothing.';
      }
    }
    $('plain').innerHTML = (mode === 'prop')
      ? 'Ask <b>' + commas(r.n) + '</b> ' + (r.n === 1 ? 'person' : 'people') + ' and you can report a percentage as "' +
        trim(r.p * 100, 2) + '%, give or take ' + trim(r.E * 100, 2) + ' points" with ' + trim(r.conf * 100, 2) +
        '% confidence.' + saved + ' Planning at ' + trim(r.p * 100, 2) + '% ' +
        (Math.abs(r.p - 0.5) < 1e-9
          ? 'is the worst case, so whatever the real answer turns out to be, your margin can only come in tighter than this.'
          : 'assumes the true rate really is near there. If it lands nearer 50%, your margin will be wider than planned.')
      : 'Collect <b>' + commas(r.n) + '</b> ' + (r.n === 1 ? 'observation' : 'observations') +
        ' and you can report an average give or take ' + trim(r.E, 4) + ' at ' + trim(r.conf * 100, 2) +
        '% confidence.' + saved + ' The whole answer rides on the SD of ' + trim(r.sd, 4) +
        ' being right: double it and you would need ' + commas(SS.sizeMean(r.E, r.sd * 2, r.conf, r.N).n) + '.';

    // Inference line: names the rule and the conclusion for THESE inputs.
    $('inftext').innerHTML = 'You asked for <b>' + askLab + '</b> at ' + trim(r.conf * 100, 2) +
      '% confidence, so the formula needs ' + sig(r.nExact, 6) + ' and you cannot recruit a fraction of a ' +
      (mode === 'prop' ? 'person' : 'unit') + ': <b>round up to ' + commas(r.n) + '</b>. ' +
      'That sample actually delivers <b>' + gotLab + '</b>, slightly better than you asked for.';

    $('report').textContent = (mode === 'prop')
      ? 'A sample of ' + commas(r.n) + ' estimates a proportion to within ' + trim(r.E * 100, 2) +
        ' percentage points at ' + trim(r.conf * 100, 2) + '% confidence (p = ' + trim(r.p, 4) + ' assumed' +
        (r.N == null ? '' : ', population ' + commas(r.N)) + ').'
      : 'A sample of ' + commas(r.n) + ' estimates a mean to within ' + trim(r.E, 4) + ' at ' +
        trim(r.conf * 100, 2) + '% confidence (SD = ' + trim(r.sd, 4) + ' assumed' +
        (r.N == null ? '' : ', population ' + commas(r.N)) + ').';

    syncSlider(r);
  }

  // ------------------------------------------------------------ what-if
  // The slider walks the margin, the one lever that dominates the answer.
  // Its scale is mode-specific: points for a percentage, SD-relative units
  // for a mean (where "1" means nothing without knowing the spread).
  function sliderToE(v) {
    if (mode === 'prop') return (v / 10) / 100;          // 0.1 .. 10.0 points
    var sd = val('sd');
    return sd * (v / 100);                                // 0.01sd .. 1.0sd
  }
  function eToSlider(E) {
    if (mode === 'prop') return Math.round(E * 100 * 10);
    var sd = val('sd');
    return Math.round(E / sd * 100);
  }
  function syncSlider(r) {
    var v = Math.max(1, Math.min(100, eToSlider(r.E)));
    $('wf').value = v;
    paintSlider(r.E, r.n);
  }
  function paintSlider(E, n) {
    $('wfv').textContent = (mode === 'prop')
      ? '±' + trim(E * 100, 2) + ' points → ' + commas(n) + ' people'
      : '±' + trim(E, 4) + ' → ' + commas(n) + ' observations';
  }
  $('wf').addEventListener('input', function () {
    if (validate()) return;
    var E = sliderToE(parseFloat(this.value));
    if (!(E > 0)) return;
    if (mode === 'prop') $('Eprop').value = trim(E * 100, 3);
    else $('Emean').value = trim(E, 5);
    markUsed();
    render();
  });

  // ------------------------------------------------------------- scenarios
  var SCEN = {
    poll:  { mode: 'prop', Eprop: 3,  pexp: 50, conf: 95, Npop: '' },
    tight: { mode: 'prop', Eprop: 1,  pexp: 50, conf: 95, Npop: '' },
    rare:  { mode: 'prop', Eprop: 2,  pexp: 5,  conf: 95, Npop: '' },
    staff: { mode: 'prop', Eprop: 5,  pexp: 50, conf: 95, Npop: '800' },
    score: { mode: 'mean', Emean: 2,  sd: 15,   conf: 95, Npop: '' }
  };
  Array.prototype.forEach.call(document.querySelectorAll('.chip'), function (c) {
    c.addEventListener('click', function () {
      var s = SCEN[c.getAttribute('data-scen')];
      if (!s) return;
      setMode(s.mode);
      Object.keys(s).forEach(function (k) {
        if (k !== 'mode' && $(k)) $(k).value = s[k];
      });
      markUsed();
      render();
    });
  });

  // ------------------------------------------------------------ mode wiring
  function setMode(m) {
    mode = m;
    Array.prototype.forEach.call(document.querySelectorAll('.mode'), function (b) {
      var on = b.getAttribute('data-mode') === m;
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    $('iwsel').value = m;
    $('iwt').textContent = $('iwsel').options[$('iwsel').selectedIndex].text;
    $('fEprop').hidden = (m !== 'prop');
    $('fEmean').hidden = (m === 'prop');
    $('fp').hidden = (m !== 'prop');
    $('fsd').hidden = (m === 'prop');
    $('g2lab').textContent = (m === 'prop') ? 'What you expect to find' : 'How spread out is the outcome?';
  }
  Array.prototype.forEach.call(document.querySelectorAll('.mode'), function (b) {
    b.addEventListener('click', function () {
      setMode(b.getAttribute('data-mode'));
      markUsed();
      render();
    });
  });
  $('iwsel').addEventListener('change', function () {
    setMode(this.value);
    markUsed();
    render();
  });

  // ------------------------------------------------------------ input wiring
  ['Eprop', 'Emean', 'pexp', 'sd', 'conf', 'Npop'].forEach(function (id) {
    $(id).addEventListener('input', function () { markUsed(); render(); });
  });

  function markUsed() {
    if (used) return;
    used = true;
    if (window.__sscUse) window.__sscUse();
  }

  // ----------------------------------------------------------------- copy
  function copyText(t, btn, what) {
    function done() {
      var old = btn.textContent;
      btn.textContent = 'Copied';
      setTimeout(function () { btn.textContent = old; }, 1400);
      if (window.__sscCopy) window.__sscCopy(what);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(t).then(done, function () { fallback(t, done); });
    } else fallback(t, done);
  }
  function fallback(t, done) {
    var ta = document.createElement('textarea');
    ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); done(); } catch (e) {}
    document.body.removeChild(ta);
  }
  $('copybtn').addEventListener('click', function () {
    copyText($('report').textContent, this, 'report');
  });
  $('rcopy').addEventListener('click', function () {
    copyText($('rcodepre').textContent, this, 'rcode');
  });

  // Route clicks are the point of the page; count them as engagement.
  Array.prototype.forEach.call(document.querySelectorAll('.rt'), function (a) {
    a.addEventListener('click', function () {
      if (window.__sscGA) window.__sscGA('tool_use', 'route:' + (a.id || '').replace('rt-', ''));
    });
  });

  setMode('prop');
  render();
})();
