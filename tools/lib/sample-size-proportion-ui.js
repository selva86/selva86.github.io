/* sample-size-proportion-ui.js
 * UI layer for tools/sample-size-proportion-calculator.html.
 * Externalised from the page purely to keep rendered outerHTML under the
 * 200KB tool-audit ceiling; all math lives in sample-size-prop-math.js.
 * GA is reached through the page's inline window.__sspGA hook so the
 * tool_use / tool_copy wiring stays visible in the page itself.
 */
(function () {
  var M = window.SampleSizePropMath;
  function $(id) { return document.getElementById(id); }
  var mode = 'two', src = 'props', method = 'arcsine', usedOnce = false, wfTouched = false;

  var MODE_LABEL = { one: 'One-proportion test', two: 'Two-proportion test' };
  var IWANT = { one: 'size one rate against a target', two: 'size an A/B test on two rates' };
  var UNIT = { one: 'observations', two: 'per group' };

  var SCEN = {
    ab:     { mode: 'two', src: 'props', p1: 0.05, p2: 0.06, power: 0.80, alpha: 0.05, tail: '2', ratio: 1, method: 'arcsine' },
    mid:    { mode: 'two', src: 'props', p1: 0.50, p2: 0.55, power: 0.80, alpha: 0.05, tail: '2', ratio: 1, method: 'arcsine' },
    rare:   { mode: 'two', src: 'props', p1: 0.01, p2: 0.02, power: 0.80, alpha: 0.05, tail: '2', ratio: 1, method: 'arcsine' },
    trial:  { mode: 'two', src: 'props', p1: 0.10, p2: 0.05, power: 0.90, alpha: 0.05, tail: '2', ratio: 1, method: 'arcsine' },
    alloc:  { mode: 'two', src: 'props', p1: 0.05, p2: 0.08, power: 0.80, alpha: 0.05, tail: '2', ratio: 2, method: 'arcsine' },
    target: { mode: 'one', src: 'props', p1o: 0.60, p0: 0.50, power: 0.80, alpha: 0.05, tail: '2', ratio: 1, method: 'arcsine' }
  };

  // fixed teaching rows for the method-gap table, chosen to span the range
  var GAPROWS = [
    [0.05, 0.06], [0.50, 0.55], [0.05, 0.10], [0.90, 0.95], [0.01, 0.02], [0.001, 0.002]
  ];

  function num(id) { return parseFloat($(id).value); }
  function pct(x, dp) { return (100 * x).toFixed(dp == null ? 1 : dp) + '%'; }
  function sig7(x) { return Number(x.toPrecision(7)); }
  function grp(n) { return isFinite(n) ? Math.round(n).toLocaleString('en-US') : String(n); }
  function trimNum(x) { return String(parseFloat(Number(x).toFixed(6))); }

  // ---------- effect size ----------
  function currentH() {
    if (src === 'h') return { h: num('h'), steps: null };
    var r = (mode === 'one')
      ? M.hFromProps('one', { p1: num('p1o'), p0: num('p0') })
      : M.hFromProps('two', { p1: num('p1'), p2: num('p2') });
    return { h: r.h, steps: r.steps, error: r.error, raw: r.raw };
  }
  function curP1() { return (mode === 'one') ? num('p1o') : num('p1'); }
  function curP2() { return (mode === 'one') ? num('p0') : num('p2'); }

  function setMode(m) {
    mode = m;
    document.querySelectorAll('.mode').forEach(function (b) {
      var on = b.dataset.mode === m;
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    $('iwsel').value = m; $('iwt').textContent = IWANT[m];
    $('fratio').style.display = (m === 'two') ? '' : 'none';
    $('srcp').textContent = (m === 'one') ? 'Rates' : 'Rates';
    syncSrc();
    compute();
  }

  function syncSrc() {
    $('srcp').classList.toggle('on', src === 'props');
    $('srch').classList.toggle('on', src === 'h');
    $('fp_two').hidden = !(src === 'props' && mode === 'two');
    $('fp_one').hidden = !(src === 'props' && mode === 'one');
    $('fh').hidden = src !== 'h';
    syncMethod();
  }

  // The normal approximation is a two-sample, equal-n, raw-rate routine.
  // Outside that it genuinely does not apply, so say why rather than fake it.
  function methodAvailable() {
    if (mode !== 'two') return { ok: false, why: 'The normal approximation (<b>power.prop.test</b>) is a two-sample routine. A one-proportion test against a fixed reference has only the arcsine form, <b>pwr.p.test</b>.' };
    if (src !== 'props') return { ok: false, why: 'The normal approximation needs the two actual rates, not just Cohen\'s h: it works on the raw <b>p(1-p)</b> scale. Switch the effect input to Rates to use it.' };
    var k = num('ratio');
    if (isFinite(k) && Math.abs(k - 1) > 1e-9) return { ok: false, why: 'The normal approximation (<b>power.prop.test</b>) assumes equal groups, so it cannot take an allocation ratio. Unequal groups use <b>pwr.2p2n.test</b>.' };
    return { ok: true, why: '' };
  }

  function syncMethod() {
    var av = methodAvailable();
    $('mrow').hidden = false;
    $('mnorm').disabled = !av.ok;
    if (!av.ok && method === 'normal') method = 'arcsine';
    $('marc').classList.toggle('on', method === 'arcsine');
    $('mnorm').classList.toggle('on', method === 'normal');
    if (!av.ok) { $('mnote').hidden = false; $('mnote').innerHTML = av.why; }
    else { $('mnote').hidden = true; }
  }

  // ---------- power curve ----------
  function drawCurve(res, h, a, t, ratio) {
    var W = 640, H = 226, padL = 52, padR = 16, padT = 14, base = H - 34;
    var nReq = res.n1, nMax = Math.max(10, Math.ceil(nReq * 2.4));
    function X(n) { return padL + (n - 2) / (nMax - 2) * (W - padL - padR); }
    function Y(p) { return padT + (1 - p) * (base - padT); }
    var pts = M.powerCurve(mode, { h: h, alpha: a, tail: t, ratio: ratio, method: method, p1: curP1(), p2: curP2() }, nMax, 90);
    var dpath = pts.map(function (p, i) { return (i ? 'L' : 'M') + X(p.n).toFixed(1) + ' ' + Y(p.power).toFixed(1); }).join(' ');
    var tgt = res.power;
    var s = [];
    s.push('<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Power rises with sample size and flattens out. ' +
      'At ' + nReq + ' ' + UNIT[mode] + ' the test reaches ' + pct(res.achieved) + ' power.">');
    [0, 0.25, 0.5, 0.75, 1].forEach(function (p) {
      s.push('<line x1="' + padL + '" y1="' + Y(p).toFixed(1) + '" x2="' + (W - padR) + '" y2="' + Y(p).toFixed(1) + '" stroke="#f2f2ee"/>');
      s.push('<text x="' + (padL - 8) + '" y="' + (Y(p) + 4).toFixed(1) + '" text-anchor="end" font-size="10.5" fill="#888e97">' + (p * 100) + '%</text>');
    });
    s.push('<line x1="' + padL + '" y1="' + Y(tgt).toFixed(1) + '" x2="' + (W - padR) + '" y2="' + Y(tgt).toFixed(1) +
      '" stroke="#888e97" stroke-dasharray="3 3"/>');
    s.push('<text x="' + (W - padR) + '" y="' + (Y(tgt) - 6).toFixed(1) + '" text-anchor="end" font-size="10.5" fill="#888e97">target ' + pct(tgt, 0) + '</text>');
    s.push('<path d="' + dpath + '" fill="none" stroke="#1f7a55" stroke-width="2"/>');
    s.push('<line x1="' + X(nReq).toFixed(1) + '" y1="' + Y(0).toFixed(1) + '" x2="' + X(nReq).toFixed(1) + '" y2="' + Y(res.achieved).toFixed(1) +
      '" stroke="#155c40" stroke-width="1.2" stroke-dasharray="2.5 2.5"/>');
    s.push('<circle cx="' + X(nReq).toFixed(1) + '" cy="' + Y(res.achieved).toFixed(1) + '" r="4.5" fill="#155c40"/>');
    s.push('<text x="' + X(nReq).toFixed(1) + '" y="' + (base + 15) + '" text-anchor="middle" font-size="11" font-weight="700" fill="#155c40">n = ' + grp(nReq) + '</text>');
    if (wfTouched) {
      var wn = parseInt($('wf').value, 10);
      if (wn >= 2 && wn <= nMax) {
        var wp = M.powerAt(mode, { h: h, n: wn, alpha: a, tail: t, ratio: ratio, method: method, p1: curP1(), p2: curP2() });
        s.push('<circle cx="' + X(wn).toFixed(1) + '" cy="' + Y(wp).toFixed(1) + '" r="4" fill="#fff" stroke="#16233a" stroke-width="1.8"/>');
      }
    }
    s.push('<line x1="' + padL + '" y1="' + Y(0).toFixed(1) + '" x2="' + (W - padR) + '" y2="' + Y(0).toFixed(1) + '" stroke="#e9e9e4"/>');
    s.push('<text x="' + ((padL + W - padR) / 2) + '" y="' + (H - 4) + '" text-anchor="middle" font-size="10.5" fill="#888e97">sample size (' + UNIT[mode] + ')</text>');
    s.push('</svg>');
    $('viz').innerHTML = s.join('');
  }

  // ---------- baseline curve: THE lesson ----------
  function drawBaseline(a, pw, t) {
    var diff = Math.abs(curP1() - curP2());
    if (!(diff > 0) || src === 'h' || !isFinite(diff)) {
      $('bviz').innerHTML = '<p style="font:500 13px Inter;color:#888e97;padding:8px 2px">Enter two rates to see how the cost of that same gap changes with the baseline.</p>';
      $('bcap').textContent = '';
      return;
    }
    var pts = M.baselineCurve(diff, { alpha: a, power: pw, tail: t }, 70).filter(function (p) { return isFinite(p.n); });
    if (!pts.length) { $('bviz').innerHTML = ''; $('bcap').textContent = ''; return; }
    var W = 660, H = 250, padL = 58, padR = 18, padT = 16, base = H - 40;
    var nMax = 0, peak = pts[0];
    pts.forEach(function (p) { if (p.n > nMax) { nMax = p.n; peak = p; } });
    var loB = pts[0].baseline, hiB = pts[pts.length - 1].baseline;
    function X(b) { return padL + (b - loB) / (hiB - loB) * (W - padL - padR); }
    function Y(n) { return padT + (1 - n / (nMax * 1.08)) * (base - padT); }
    var s = [];
    s.push('<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Required sample size against baseline rate, holding the absolute difference at ' +
      diff.toFixed(3) + '. The curve peaks at ' + grp(peak.n) + ' per group near a baseline of ' + peak.baseline.toFixed(2) +
      ' and falls to about ' + grp(Math.min(pts[0].n, pts[pts.length - 1].n)) + ' towards the ends of the scale.">');
    // y gridlines
    [0, 0.5, 1].forEach(function (f) {
      var nv = nMax * 1.08 * f;
      s.push('<line x1="' + padL + '" y1="' + Y(nv).toFixed(1) + '" x2="' + (W - padR) + '" y2="' + Y(nv).toFixed(1) + '" stroke="#f2f2ee"/>');
      s.push('<text x="' + (padL - 8) + '" y="' + (Y(nv) + 4).toFixed(1) + '" text-anchor="end" font-size="10.5" fill="#888e97">' + grp(nv) + '</text>');
    });
    // 0.5 marker
    if (loB < 0.5 && hiB > 0.5) {
      s.push('<line x1="' + X(0.5).toFixed(1) + '" y1="' + padT + '" x2="' + X(0.5).toFixed(1) + '" y2="' + Y(0).toFixed(1) + '" stroke="#e9e9e4" stroke-dasharray="3 3"/>');
      s.push('<text x="' + X(0.5).toFixed(1) + '" y="' + (padT - 4) + '" text-anchor="middle" font-size="10" fill="#888e97">p = 0.5</text>');
    }
    var dpath = pts.map(function (p, i) { return (i ? 'L' : 'M') + X(p.baseline).toFixed(1) + ' ' + Y(p.n).toFixed(1); }).join(' ');
    s.push('<path d="' + dpath + '" fill="none" stroke="#1f7a55" stroke-width="2"/>');
    // user's baseline
    var ub = Math.min(curP1(), curP2());
    if (ub >= loB && ub <= hiB) {
      var mine = M.solveSampleSize('two', { h: Math.abs(M.cohenH(ub + diff, ub)), alpha: a, power: pw, tail: t, ratio: 1, method: 'arcsine' });
      if (!mine.error) {
        s.push('<line x1="' + X(ub).toFixed(1) + '" y1="' + Y(0).toFixed(1) + '" x2="' + X(ub).toFixed(1) + '" y2="' + Y(mine.n1).toFixed(1) + '" stroke="#155c40" stroke-width="1.2" stroke-dasharray="2.5 2.5"/>');
        s.push('<circle cx="' + X(ub).toFixed(1) + '" cy="' + Y(mine.n1).toFixed(1) + '" r="4.5" fill="#155c40"/>');
        s.push('<text x="' + X(ub).toFixed(1) + '" y="' + (Y(mine.n1) - 9).toFixed(1) + '" text-anchor="middle" font-size="10.5" font-weight="700" fill="#155c40">you: ' + grp(mine.n1) + '</text>');
      }
    }
    // x axis
    s.push('<line x1="' + padL + '" y1="' + Y(0).toFixed(1) + '" x2="' + (W - padR) + '" y2="' + Y(0).toFixed(1) + '" stroke="#e9e9e4"/>');
    [loB, (loB + hiB) / 2, hiB].forEach(function (b) {
      s.push('<text x="' + X(b).toFixed(1) + '" y="' + (base + 16) + '" text-anchor="middle" font-size="10.5" fill="#888e97">' + b.toFixed(2) + '</text>');
    });
    s.push('<text x="' + ((padL + W - padR) / 2) + '" y="' + (H - 4) + '" text-anchor="middle" font-size="10.5" fill="#888e97">baseline rate (the lower of your two rates)</text>');
    s.push('<text x="14" y="' + (padT + 6) + '" font-size="10.5" fill="#888e97">n per group</text>');
    s.push('</svg>');
    $('bviz').innerHTML = s.join('');

    var lows = Math.min(pts[0].n, pts[pts.length - 1].n);
    $('bcap').innerHTML = 'Holding your gap of <b>' + trimNum(diff) + '</b> fixed, the cost swings from about <b>' + grp(lows) +
      '</b> per group out at the ends to <b>' + grp(peak.n) + '</b> near a baseline of ' + peak.baseline.toFixed(2) +
      ', a factor of <b>' + (peak.n / Math.max(lows, 1)).toFixed(1) + '</b>. Same difference, same power, same alpha. Only the starting point moved.';
  }

  // ---------- live method-gap table ----------
  function gapTable(a, pw, t) {
    var rows = GAPROWS.slice();
    var mineRow = null;
    if (src === 'props' && mode === 'two') {
      var q1 = curP1(), q2 = curP2();
      if (isFinite(q1) && isFinite(q2) && q1 !== q2) {
        var dup = rows.some(function (r) { return Math.abs(r[0] - q1) < 1e-12 && Math.abs(r[1] - q2) < 1e-12; });
        if (!dup) mineRow = [q1, q2];
      }
    }
    var all = rows.map(function (r) { return { p: r, mine: false }; });
    if (mineRow) all.push({ p: mineRow, mine: true });

    var html = all.map(function (o) {
      var q1 = o.p[0], q2 = o.p[1];
      var h = Math.abs(M.cohenH(q2, q1));
      var arc = M.solveSampleSize('two', { h: h, alpha: a, power: pw, tail: t, ratio: 1, method: 'arcsine' });
      var nrm = M.solveSampleSize('two', { h: h, p1: q1, p2: q2, alpha: a, power: pw, tail: t, ratio: 1, method: 'normal' });
      var an = arc.error ? null : arc.n1, nn = nrm.error ? null : nrm.n1;
      var gap = (an && nn) ? (nn - an) : null;
      var gtxt = (gap == null) ? 'n/a' : (gap === 0 ? 'none' : (gap > 0 ? '+' : '') + grp(gap));
      var cur = o.mine ? ' class="cur"' : '';
      return '<tr' + cur + '><td>' + trimNum(q1) + ' to ' + trimNum(q2) + (o.mine ? ' (yours)' : '') + '</td>' +
        '<td>' + h.toFixed(4) + '</td>' +
        '<td>' + (an == null ? 'n/a' : grp(an)) + '</td>' +
        '<td>' + (nn == null ? 'n/a' : grp(nn)) + '</td>' +
        '<td>' + gtxt + '</td></tr>';
    }).join('');
    $('gapbody').innerHTML = html;
  }

  // ---------- R code ----------
  function rcode(res, h, a, t, ratio) {
    var alt = (t === 2) ? 'two.sided' : 'greater';
    var altP = (t === 2) ? 'two.sided' : 'one.sided';
    var L = [];
    L.push('library(pwr)');
    L.push('');

    // how h is obtained
    if (src === 'h') {
      L.push('h <- ' + trimNum(h) + '   # Cohen\'s h, entered directly');
    } else if (mode === 'one') {
      L.push('# Cohen\'s h between your expected rate and the reference value');
      L.push('h <- abs(ES.h(p1 = ' + trimNum(num('p1o')) + ', p2 = ' + trimNum(num('p0')) + '))');
      L.push('#> ' + sig7(h));
    } else {
      L.push('# Cohen\'s h: the arcsine distance between the two rates');
      L.push('h <- abs(ES.h(p1 = ' + trimNum(num('p2')) + ', p2 = ' + trimNum(num('p1')) + '))');
      L.push('#> ' + sig7(h));
    }
    L.push('');

    if (mode === 'one') {
      L.push('# Sample size for one proportion against a fixed reference');
      L.push('pwr.p.test(h = h, sig.level = ' + trimNum(a) + ', power = ' + trimNum(res.power) + ',');
      L.push('           alternative = "' + alt + '")');
      L.push('#> n = ' + sig7(res.nExact) + '   (observations; round up to ' + res.n1 + ')');
      $('rcodepre').textContent = L.join('\n');
      return;
    }

    if (Math.abs(ratio - 1) > 1e-9) {
      L.push('# pwr.2p.test assumes equal groups, so for a ' + trimNum(ratio) + ':1 allocation');
      L.push('# check the power of the pair you plan to recruit.');
      L.push('pwr.2p2n.test(n1 = ' + res.n1 + ', n2 = ' + res.n2 + ', h = h, sig.level = ' + trimNum(a) + ',');
      L.push('              alternative = "' + alt + '")');
      L.push('#> power = ' + sig7(res.achieved));
      $('rcodepre').textContent = L.join('\n');
      return;
    }

    // equal groups: always show BOTH routes, so the gap is never hidden
    var arc = M.solveSampleSize('two', { h: h, alpha: a, power: res.power, tail: t, ratio: 1, method: 'arcsine' });
    L.push('# Arcsine route: the answer a power table or pwr gives you');
    L.push('pwr.2p.test(h = h, sig.level = ' + trimNum(a) + ', power = ' + trimNum(res.power) + ',');
    L.push('            alternative = "' + alt + '")');
    L.push('#> n = ' + sig7(arc.nExact) + '   (per group; round up to ' + arc.n1 + ')');

    if (src === 'props') {
      var nrm = M.solveSampleSize('two', { h: h, p1: curP1(), p2: curP2(), alpha: a, power: res.power, tail: t, ratio: 1, method: 'normal' });
      L.push('');
      L.push('# Normal-approximation route: base R, no packages. It works on the raw p');
      L.push('# scale rather than the arcsine scale, so it can differ near 0 and 1.');
      L.push('# strict = TRUE counts both tails, matching pwr\'s two-sided convention.');
      L.push('power.prop.test(p1 = ' + trimNum(curP1()) + ', p2 = ' + trimNum(curP2()) + ', sig.level = ' + trimNum(a) + ',');
      L.push('                power = ' + trimNum(res.power) + ', alternative = "' + altP + '", strict = TRUE)');
      if (!nrm.error) L.push('#> n = ' + sig7(nrm.nExact) + '   (per group; round up to ' + nrm.n1 + ')');
    }
    $('rcodepre').textContent = L.join('\n');
  }

  // ---------- steps ----------
  function steps(res, h, a, t, ratio, hsteps) {
    var out = [], i = 1;
    function step(label, calc) {
      out.push('<div class="step"><span class="n">' + (i++) + '</span><span class="sx"><b>' + label + '</b><span class="sc">' + calc + '</span></span></div>');
    }
    if (hsteps) hsteps.forEach(function (s) { step(s.label + ': ' + s.expr, s.calc); });

    if (method === 'normal') {
      var q1 = curP1(), q2 = curP2();
      var pbar = (q1 + q2) / 2;
      step('Pooled rate under the null', 'p&#772; = (' + trimNum(q1) + ' + ' + trimNum(q2) + ') / 2 = ' + pbar.toFixed(6));
      step('Spread of each arm', 'p&#8321;(1&minus;p&#8321;) = ' + (q1 * (1 - q1)).toFixed(6) + ',  p&#8322;(1&minus;p&#8322;) = ' + (q2 * (1 - q2)).toFixed(6) +
        '. The normal route uses these raw variances instead of the arcsine scale.');
      step('Solve power(n) = ' + trimNum(res.power) + ' for n',
        'Raise n until the normal approximation puts ' + pct(res.power) + ' of its mass past the critical value. Root: n = ' + res.nExact.toFixed(4));
    } else {
      step('Noncentrality parameter at the answer',
        (mode === 'two'
          ? 'ncp = h &times; &radic;(n&#8321;n&#8322;/(n&#8321;+n&#8322;)) = ' + trimNum(h) + ' &times; &radic;(' + res.n1 + '&times;' + res.n2 + '/' + (res.n1 + res.n2) + ') = ' + res.ncp.toFixed(4)
          : 'ncp = h &times; &radic;n = ' + trimNum(h) + ' &times; &radic;' + res.n1 + ' = ' + res.ncp.toFixed(4)));
      step('Solve power(n) = ' + trimNum(res.power) + ' for n',
        'Raise n until the shifted normal distribution puts ' + pct(res.power) + ' of its mass past the critical value. Root: n = ' + res.nExact.toFixed(4));
    }
    step('Round up to whole subjects',
      'ceiling(' + res.nExact.toFixed(4) + ') = ' + grp(res.n1) + (mode === 'two' ? ' per group, so ' + grp(res.n2) + ' in group 2 and ' + grp(res.total) + ' in total' : ''));
    step('Power you actually get at that integer',
      'power(' + grp(res.n1) + ') = ' + res.achieved.toFixed(6) + ', a little above the ' + pct(res.power) + ' you asked for because of the rounding');
    $('steps').innerHTML = out.join('');
  }

  // ---------- main ----------
  function compute() {
    var e = currentH();
    var h = e.h, a = num('alpha'), pw = num('power'), t = parseInt($('tail').value, 10);
    var ratio = (mode === 'two') ? num('ratio') : 1;

    function bad(msg) {
      $('err').textContent = msg; $('err').classList.add('show');
      $('rescard').style.opacity = '.45';
    }
    $('err').classList.remove('show'); $('rescard').style.opacity = '1';

    syncMethod();

    if (e.error) { bad(e.error); return; }
    if (!isFinite(h)) { bad('Enter the effect you want to detect.'); return; }
    if (Math.abs(h) < 1e-9) { bad('The two rates are identical, so Cohen\'s h is 0. An effect of exactly zero can never be detected, at any sample size.'); return; }
    if (!isFinite(a) || a <= 0 || a >= 1) { bad('Alpha must be between 0 and 1. The usual value is 0.05.'); return; }
    if (!isFinite(pw) || pw <= 0 || pw >= 1) { bad('Power must be between 0 and 1. The usual value is 0.80.'); return; }
    if (pw <= a) { bad('Power must be greater than alpha, otherwise the test is no better than a coin flip.'); return; }
    if (mode === 'two' && (!isFinite(ratio) || ratio <= 0)) { bad('The allocation ratio must be greater than 0. Use 1 for equal groups.'); return; }

    var ah = Math.abs(h);
    var res = M.solveSampleSize(mode, {
      h: ah, p1: curP1(), p2: curP2(), alpha: a, power: pw, tail: t, ratio: ratio, method: method
    });
    if (res.error) { bad(res.error); return; }

    var bm = M.benchmark(ah);

    // note when h was derived from rates
    if (src === 'props' && e.steps) {
      $('dnote').hidden = false;
      $('dnote').innerHTML = 'Those rates differ by <b>' + trimNum(Math.abs(e.raw)) + '</b> on the raw scale, which is <b>h = ' + ah.toFixed(4) +
        '</b> once the arcsine transform has levelled the playing field, ' + bm.note + '.';
    } else { $('dnote').hidden = true; }

    // headline
    $('vchip').textContent = MODE_LABEL[mode] + (mode === 'two' && method === 'normal' ? ', normal approx' : '');
    if (mode === 'two') {
      $('verdict').textContent = 'Recruit ' + grp(res.n1) + ' per group';
      $('vsub').textContent = (Math.abs(ratio - 1) > 1e-9)
        ? grp(res.n1) + ' in group 1 and ' + grp(res.n2) + ' in group 2, ' + grp(res.total) + ' in total.'
        : grp(res.total) + ' subjects in total.';
      $('bignv').textContent = grp(res.n1);
      $('bignl').innerHTML = 'per group &middot; ' + grp(res.total) + ' total';
    } else {
      $('verdict').textContent = 'Collect ' + grp(res.n1) + ' observations';
      $('vsub').textContent = 'A single sample compared against your reference value.';
      $('bignv').textContent = grp(res.n1);
      $('bignl').innerHTML = 'observations';
    }

    $('s_exact').textContent = res.nExact < 1e6 ? res.nExact.toFixed(3) : sig7(res.nExact);
    $('s_ach').textContent = res.achieved.toFixed(4);
    $('s_h').textContent = ah.toFixed(4);
    $('s_tot').textContent = grp(res.total);

    var rateTxt = (src === 'props')
      ? (mode === 'one'
          ? 'your rate really is <b>' + trimNum(curP1()) + '</b> against a reference of <b>' + trimNum(curP2()) + '</b>'
          : 'the two rates really are <b>' + trimNum(curP1()) + '</b> and <b>' + trimNum(curP2()) + '</b>')
      : 'the true effect really is <b>h = ' + ah.toFixed(3) + '</b>';

    $('plain').innerHTML = 'If ' + rateTxt + ' (' + bm.note + '), then a study with <b>' +
      grp(res.n1) + ' ' + UNIT[mode] + '</b> has a <b>' + pct(res.achieved) + '</b> chance of returning a significant result at alpha = ' +
      trimNum(a) + ', ' + (t === 2 ? 'two-tailed' : 'one-tailed') + '. Put the other way round, you would still miss a real difference of that size <b>' +
      pct(1 - res.achieved) + '</b> of the time.';

    $('inftext').innerHTML = 'To detect <b>h = ' + ah.toFixed(3) + '</b> with ' + pct(pw, 0) + ' power at alpha = ' + trimNum(a) +
      ', recruit <b>' + grp(res.n1) + ' ' + UNIT[mode] + '</b>' + (mode === 'two' ? ' (<b>' + grp(res.total) + '</b> in total)' : '') +
      '. The exact requirement is ' + res.nExact.toFixed(2) + ', and rounding up to ' + grp(res.n1) + ' lands you at ' +
      pct(res.achieved) + ' power, so you are ' + (res.achieved >= pw ? 'just above' : 'at') + ' your target rather than below it.';

    $('report').textContent = 'A ' + MODE_LABEL[mode].toLowerCase() + ' with ' + grp(res.n1) + ' ' + UNIT[mode] +
      (mode === 'two' ? ' (N = ' + grp(res.total) + ')' : '') + ' has ' + pct(res.achieved) + ' power to detect Cohen\'s h = ' + ah.toFixed(3) +
      ' at alpha = ' + trimNum(a) + ', ' + (t === 2 ? 'two-tailed' : 'one-tailed') + '.';

    // what-if slider
    var wfMax = Math.max(10, Math.ceil(res.n1 * 2.4));
    $('wf').max = wfMax;
    if (!wfTouched) $('wf').value = res.n1;
    updateWf(ah, a, t, ratio);

    drawCurve(res, ah, a, t, ratio);
    drawBaseline(a, pw, t);
    gapTable(a, pw, t);
    rcode(res, ah, a, t, ratio);
    steps(res, ah, a, t, ratio, e.steps);

    if (!usedOnce) {
      usedOnce = true;
      if (window.__sspGA) window.__sspGA('use');
    }
  }

  function updateWf(h, a, t, ratio) {
    var wn = parseInt($('wf').value, 10);
    var wp = M.powerAt(mode, { h: h, n: wn, alpha: a, tail: t, ratio: ratio, method: method, p1: curP1(), p2: curP2() });
    $('wfv').textContent = grp(wn) + ' ' + UNIT[mode] + ' → ' + pct(wp) + ' power';
  }

  // ---------- wiring ----------
  document.querySelectorAll('.mode').forEach(function (b) {
    b.addEventListener('click', function () { wfTouched = false; setMode(b.dataset.mode); });
  });
  $('iwsel').addEventListener('change', function () { wfTouched = false; setMode($('iwsel').value); });
  document.querySelectorAll('#srcrow button').forEach(function (b) {
    b.addEventListener('click', function () { src = b.dataset.src; wfTouched = false; syncSrc(); compute(); });
  });
  document.querySelectorAll('#mrow button').forEach(function (b) {
    b.addEventListener('click', function () {
      if (b.disabled) return;
      method = b.dataset.method; wfTouched = false; syncMethod(); compute();
    });
  });
  ['p1', 'p2', 'p1o', 'p0', 'h', 'power', 'alpha', 'ratio'].forEach(function (id) {
    $(id).addEventListener('input', function () { wfTouched = false; compute(); });
  });
  $('tail').addEventListener('change', function () { wfTouched = false; compute(); });
  $('wf').addEventListener('input', function () { wfTouched = true; compute(); });

  document.querySelectorAll('.chip').forEach(function (c) {
    c.addEventListener('click', function () {
      var s = SCEN[c.dataset.scen]; if (!s) return;
      src = s.src; method = s.method; wfTouched = false;
      if (s.p1 != null) $('p1').value = s.p1;
      if (s.p2 != null) $('p2').value = s.p2;
      if (s.p1o != null) $('p1o').value = s.p1o;
      if (s.p0 != null) $('p0').value = s.p0;
      $('power').value = s.power; $('alpha').value = s.alpha;
      $('tail').value = s.tail; $('ratio').value = s.ratio;
      setMode(s.mode);
    });
  });

  $('copybtn').addEventListener('click', function () {
    navigator.clipboard.writeText($('report').textContent).then(function () {
      $('copybtn').textContent = 'Copied';
      setTimeout(function () { $('copybtn').textContent = 'Copy result line'; }, 1400);
      if (window.__sspGA) window.__sspGA('copy', 'report');
    });
  });
  $('rcopy').addEventListener('click', function () {
    navigator.clipboard.writeText($('rcodepre').textContent).then(function () {
      $('rcopy').textContent = 'Copied';
      setTimeout(function () { $('rcopy').textContent = 'Copy'; }, 1400);
      if (window.__sspGA) window.__sspGA('copy', 'rcode');
    });
  });

  setMode('two');
})();
