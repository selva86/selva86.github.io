/* sample-size-anova-ui.js - UI layer for tools/sample-size-anova-calculator.html
 *
 * Externalised from the page to keep the RENDERED html under the 200KB tool-audit
 * ceiling (the JS injects SVG, tables and steps, so rendered >> disk). The GA hooks
 * stay inline on the page as window.__ssaUse / window.__ssaCopy, because the audit
 * greps the rendered HTML for the literal tool_use / tool_copy. Do NOT call gtag()
 * from this file.
 *
 * All maths lives in sample-size-anova-math.js (verified against R). This file only
 * reads inputs, formats and paints.
 */
(function () {
  'use strict';
  var M = window.SampleSizeAnovaMath;
  function $(id) { return document.getElementById(id); }

  var mode = 'n';       // n | power | f
  var src = 'f';        // f | means | eta2
  var usedOnce = false, wfTouched = false;

  var IWANT = {
    n: 'size a study on several groups',
    power: 'check the power of a study I can afford',
    f: 'find the smallest effect I could detect'
  };

  var SCEN = {
    classic: { mode: 'n', src: 'f', f: 0.25, k: 3, power: 0.80, alpha: 0.05 },
    small:   { mode: 'n', src: 'f', f: 0.10, k: 4, power: 0.80, alpha: 0.05 },
    means:   { mode: 'n', src: 'means', means: '10, 12, 15, 11', sdw: 4, power: 0.80, alpha: 0.05 },
    pilot:   { mode: 'n', src: 'f', f: 0.40, k: 3, power: 0.80, alpha: 0.05 },
    ttest:   { mode: 'n', src: 'f', f: 0.25, k: 2, power: 0.80, alpha: 0.05 }
  };

  function num(id) { return parseFloat($(id).value); }
  function pct(x, dp) { return (100 * x).toFixed(dp == null ? 1 : dp) + '%'; }
  function trimNum(x) { return String(parseFloat(Number(x).toFixed(6))); }

  // ---- precision of the emitted "#>" claims -------------------------------
  // A "#>" comment asserts what R prints, so it must be true at the precision
  // shown. pwr.anova.test finds n and f with uniroot at its DEFAULT tol
  // (.Machine$double.eps^0.25 = 1.22e-4), so R's own last digits wobble: over the
  // 1111-case truth grid, claiming 7 significant digits of n would be FALSE 288
  // times. These roundings were each verified against the full grid:
  //   nR  (2 dp) : 0 / 1111 mismatches   fR (2 dp) : 0 / 280 mismatches
  //   powR (6 dp): 0 / 1152 mismatches   (power is a direct evaluation, not a root)
  // Scripts/tool-truth/test-sample-size-anova-math.js re-checks these on every run.
  function nR(x) { return x.toFixed(2); }
  function fR(x) { return x.toFixed(2); }
  function powR(x) { return x.toFixed(6); }

  // Parse "10, 12, 15, 11" (also tolerates spaces / tabs / newlines as separators).
  function parseMeans(s) {
    var parts = String(s).split(/[,;\s]+/).filter(function (t) { return t.length; });
    var out = [], bad = false;
    parts.forEach(function (t) {
      var v = parseFloat(t);
      if (!isFinite(v)) bad = true; else out.push(v);
    });
    return { vals: out, bad: bad };
  }

  // ---------- effect size from the active source ----------
  function currentF() {
    if (src === 'f') return { f: num('fval'), steps: null, k: null };
    if (src === 'eta2') {
      var e = num('eta2');
      if (!isFinite(e)) return { f: NaN, error: 'Enter an eta-squared value.' };
      if (e < 0 || e >= 1) return { f: NaN, error: 'Eta-squared must be at least 0 and below 1. It is a share of variance, so it cannot reach 1.' };
      var fv = M.fFromEta2(e);
      return {
        f: fv, k: null,
        steps: [{ label: 'Cohen&rsquo;s f from eta-squared', expr: '&radic;(' + trimNum(e) + ' / (1 &minus; ' + trimNum(e) + '))', val: fv.toFixed(4) }]
      };
    }
    var p = parseMeans($('means').value);
    if (p.bad) return { f: NaN, error: 'The group means must be numbers separated by commas, for example 10, 12, 15.' };
    if (p.vals.length < 2) return { f: NaN, error: 'Enter at least two group means, separated by commas.' };
    if (p.vals.length > 200) return { f: NaN, error: 'That is more than 200 groups. Enter a shorter list of means.' };
    var r = M.fFromMeans(p.vals, num('sdw'));
    if (r.error) return { f: NaN, error: r.error };
    return { f: r.f, steps: r.steps, k: r.k, detail: r };
  }

  function setMode(m) {
    mode = m;
    document.querySelectorAll('.mode').forEach(function (b) {
      var on = b.dataset.mode === m;
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    $('iwsel').value = m;
    $('iwt').textContent = IWANT[m];
    // In "detectable effect" mode the effect IS the answer, so hide its inputs.
    $('srcrow').hidden = (m === 'f');
    $('fpower').hidden = (m === 'power');
    $('fn').hidden = (m === 'n');
    syncSrc();
    compute();
  }

  function syncSrc() {
    $('srcf').classList.toggle('on', src === 'f');
    $('srcm').classList.toggle('on', src === 'means');
    $('srce').classList.toggle('on', src === 'eta2');
    var solvingF = (mode === 'f');
    $('ff').hidden = solvingF || src !== 'f';
    $('fmeans').hidden = solvingF || src !== 'means';
    $('feta').hidden = solvingF || src !== 'eta2';
    // k is derived from the list of means, so lock the field and say why.
    var derived = (!solvingF && src === 'means');
    $('k').disabled = derived;
    $('klab').textContent = derived ? 'Number of groups (from your means)' : 'Number of groups (k)';
  }

  // ---------- power curve ----------
  function drawCurve(f, k, a, nReq, achieved, target) {
    var W = 640, H = 226, padL = 46, padR = 16, padT = 14, base = H - 34;
    var nMax = Math.max(10, Math.ceil(nReq * 2.4));
    function X(n) { return padL + (n - 2) / (nMax - 2) * (W - padL - padR); }
    function Y(p) { return padT + (1 - p) * (base - padT); }
    var pts = M.powerCurve(f, k, a, nMax, 90);
    var dpath = pts.map(function (p, i) { return (i ? 'L' : 'M') + X(p.n).toFixed(1) + ' ' + Y(p.power).toFixed(1); }).join(' ');
    var s = [];
    s.push('<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Power rises with the number per group and flattens out. ' +
      'At ' + nReq + ' per group across ' + k + ' groups the test reaches ' + pct(achieved) + ' power.">');
    [0, 0.25, 0.5, 0.75, 1].forEach(function (p) {
      s.push('<line x1="' + padL + '" y1="' + Y(p).toFixed(1) + '" x2="' + (W - padR) + '" y2="' + Y(p).toFixed(1) + '" stroke="#f2f2ee"/>');
      s.push('<text x="' + (padL - 8) + '" y="' + (Y(p) + 4).toFixed(1) + '" text-anchor="end" font-size="10.5" fill="#888e97">' + (p * 100) + '%</text>');
    });
    if (isFinite(target)) {
      s.push('<line x1="' + padL + '" y1="' + Y(target).toFixed(1) + '" x2="' + (W - padR) + '" y2="' + Y(target).toFixed(1) +
        '" stroke="#888e97" stroke-dasharray="3 3"/>');
      s.push('<text x="' + (W - padR) + '" y="' + (Y(target) - 6).toFixed(1) + '" text-anchor="end" font-size="10.5" fill="#888e97">target ' + pct(target, 0) + '</text>');
    }
    s.push('<path d="' + dpath + '" fill="none" stroke="#1f7a55" stroke-width="2"/>');
    s.push('<line x1="' + X(nReq).toFixed(1) + '" y1="' + Y(0).toFixed(1) + '" x2="' + X(nReq).toFixed(1) + '" y2="' + Y(achieved).toFixed(1) +
      '" stroke="#155c40" stroke-width="1.2" stroke-dasharray="2.5 2.5"/>');
    s.push('<circle cx="' + X(nReq).toFixed(1) + '" cy="' + Y(achieved).toFixed(1) + '" r="4.5" fill="#155c40"/>');
    s.push('<text x="' + X(nReq).toFixed(1) + '" y="' + (base + 15) + '" text-anchor="middle" font-size="11" font-weight="700" fill="#155c40">n = ' + nReq + '</text>');
    s.push('<line x1="' + padL + '" y1="' + Y(0).toFixed(1) + '" x2="' + (W - padR) + '" y2="' + Y(0).toFixed(1) + '" stroke="#e9e9e4"/>');
    s.push('<text x="' + ((padL + W - padR) / 2) + '" y="' + (H - 4) + '" text-anchor="middle" font-size="10.5" fill="#888e97">sample size (per group)</text>');
    s.push('</svg>');
    $('viz').innerHTML = s.join('');
  }

  // ---------- live lever table: effect size x power ----------
  function levers(fv, k, a, pwNow) {
    var fs = [0.10, 0.25, 0.40];
    if (isFinite(fv) && fv > 0 && fs.indexOf(+fv.toFixed(2)) < 0) { fs.push(+fv.toFixed(2)); fs.sort(function (x, y) { return x - y; }); }
    $('levbody').innerHTML = fs.map(function (ff) {
      var cells = [0.80, 0.90, 0.95].map(function (pw) {
        var r = M.solveSampleSize({ f: ff, k: k, alpha: a, power: pw });
        var cur = (Math.abs(ff - fv) < 5e-3 && Math.abs(pw - pwNow) < 1e-9);
        return '<td class="' + (cur ? 'cur' : '') + '">' + (r.error ? 'n/a' : r.nCeil) + '</td>';
      }).join('');
      var lab = ff.toFixed(2);
      var tag = (Math.abs(ff - fv) < 5e-3) ? ' (yours)' : '';
      return '<tr><td>f = ' + lab + tag + '</td>' + cells + '</tr>';
    }).join('');
  }

  // ---------- live n-vs-k table ----------
  function kTable(fv, a, pw, kNow) {
    if (!isFinite(fv) || fv <= 0 || !isFinite(pw) || pw <= 0 || pw >= 1) { $('kbody').innerHTML = ''; return; }
    var rows = M.nVsK(fv, a, pw, 2, 10);
    var base = rows.length ? rows[0].N : NaN;
    $('kbody').innerHTML = rows.map(function (r) {
      if (!isFinite(r.n)) return '';
      var cur = (r.k === kNow) ? ' class="cur"' : '';
      var vs = isFinite(base) && base > 0 ? (r.N / base).toFixed(2) + '&times;' : 'n/a';
      return '<tr><td' + cur + '>k = ' + r.k + ((r.k === kNow) ? ' (yours)' : '') + '</td><td' + cur + '>' + r.nCeil +
        '</td><td' + cur + '>' + r.N + '</td><td' + cur + '>' + vs + '</td></tr>';
    }).join('');
  }

  // ---------- R code ----------
  function rcode(res, fv, k, a, eff) {
    var L = [];
    L.push('library(pwr)');
    L.push('');

    // When f is DERIVED, derive it in R too and pass the variable. Emitting a
    // rounded literal (f = 0.467707) would make R solve a slightly different
    // problem than the page did, and the two n's would drift apart.
    var fArg = trimNum(fv);      // src === 'f': the user typed it, so it is exact
    var derived = (mode !== 'f') && (src === 'means' || src === 'eta2') && eff && eff.steps;

    if (derived && src === 'means' && eff.detail) {
      var d = eff.detail;
      L.push('means <- c(' + d.devs.map(function (dv) { return trimNum(d.grand + dv); }).join(', ') + ')');
      L.push('sd    <- ' + trimNum(d.sd));
      L.push('k     <- length(means)');
      L.push('');
      L.push('# Cohen\'s f: the POPULATION spread of the means (divide by k), over the');
      L.push('# within-group SD.');
      L.push('f <- sqrt(sum((means - mean(means))^2) / k) / sd');
      L.push('f');
      L.push('#> [1] ' + fv.toFixed(7));
      L.push('');
      fArg = 'f';
    } else if (derived && src === 'eta2') {
      L.push('eta2 <- ' + trimNum(num('eta2')));
      L.push('');
      L.push('# Cohen\'s f compares explained spread to what is LEFT OVER, while');
      L.push('# eta-squared compares it to the total. Hence the (1 - eta2).');
      L.push('f <- sqrt(eta2 / (1 - eta2))');
      L.push('f');
      L.push('#> [1] ' + fv.toFixed(7));
      L.push('');
      fArg = 'f';
    }
    var kArg = (derived && src === 'means') ? 'k' : String(k);
    // between.var must be an EXACT R expression, never a rounded decimal: rounding
    // it to 6dp made power.anova.test answer a slightly different question than the
    // page (0.4203885 vs the page's 0.4203901). f^2 * k/(k-1) is the bridge anyway,
    // so emitting it as arithmetic is both exact and the thing worth teaching.
    var bvExpr = fArg + '^2 * ' + k + '/' + (k - 1);

    if (mode === 'n') {
      L.push('# Sample size per group for a balanced one-way ANOVA');
      L.push('pwr.anova.test(k = ' + kArg + ', f = ' + fArg + ', sig.level = ' + trimNum(a) + ', power = ' + trimNum(res.power) + ')');
      L.push('#> n = ' + nR(res.n) + '   (per group; round up to ' + res.nCeil + ')');
      L.push('');
      if (derived && src === 'means') {
        L.push('# Base R, no packages. power.anova.test asks for variances instead of f.');
        L.push('# var(means) divides by k - 1, which is exactly the factor that makes its');
        L.push('# lambda match pwr\'s: (k-1) * n * f^2 * k/(k-1) = k * n * f^2.');
        L.push('power.anova.test(groups = k, between.var = var(means), within.var = sd^2,');
        L.push('                 sig.level = ' + trimNum(a) + ', power = ' + trimNum(res.power) + ')');
        L.push('#> n = ' + nR(res.n));
      } else {
        L.push('# Base R, no packages. power.anova.test parameterises with variances, and');
        L.push('# between.var / within.var = f^2 * k/(k-1). With within.var = 1:');
        L.push('power.anova.test(groups = ' + k + ', between.var = ' + bvExpr + ', within.var = 1,');
        L.push('                 sig.level = ' + trimNum(a) + ', power = ' + trimNum(res.power) + ')');
        L.push('#> n = ' + nR(res.n));
      }
      // R's qf() switches to a chi-square approximation above df2 = 4e5 and
      // pwr inherits it, so above that line the two genuinely diverge. Say so
      // rather than printing a number R will not reproduce.
      if (res.df2 > 4e5) {
        L.push('');
        L.push('# Heads up: with df2 = (n-1)*k = ' + Math.round(res.df2) + ' above 400000, R\'s qf() switches');
        L.push('# to a chi-square approximation ("fudge the extreme DF cases" in qf.c), so');
        L.push('# pwr returns n a shade low here. This page inverts the F distribution');
        L.push('# directly; R\'s own pf() agrees with the page, not with pwr, at this size.');
      }
    } else if (mode === 'power') {
      L.push('# Power of a balanced one-way ANOVA at a sample size you can afford');
      L.push('pwr.anova.test(k = ' + kArg + ', n = ' + res.n + ', f = ' + fArg + ', sig.level = ' + trimNum(a) + ')');
      L.push('#> power = ' + powR(res.power));
      L.push('');
      L.push('# Base R route, same answer:');
      L.push('power.anova.test(groups = ' + k + ', n = ' + res.n + ', between.var = ' + bvExpr + ',');
      L.push('                 within.var = 1, sig.level = ' + trimNum(a) + ')');
      L.push('#> power = ' + powR(res.power));
    } else {
      L.push('# Smallest Cohen\'s f detectable with the sample you have.');
      L.push('# pwr solves f by uniroot at its default tolerance, so R\'s trailing');
      L.push('# digits wobble; this page reports the tighter root, f = ' + res.f.toFixed(4) + '.');
      L.push('pwr.anova.test(k = ' + k + ', n = ' + res.n + ', sig.level = ' + trimNum(a) + ', power = ' + trimNum(res.power) + ')');
      L.push('#> f = ' + fR(res.f));
    }

    if (k === 2 && mode === 'n') {
      L.push('');
      L.push('# k = 2 is the two-sided two-sample t test, where f = d/2. Same answer:');
      L.push('pwr.t.test(d = ' + (derived ? '2 * f' : trimNum(2 * fv)) + ', sig.level = ' + trimNum(a) + ', power = ' + trimNum(res.power) + ',');
      L.push('           type = "two.sample", alternative = "two.sided")');
      L.push('#> n = ' + nR(res.n));
    }
    $('rcodepre').textContent = L.join('\n');
  }

  // ---------- steps ----------
  function steps(res, fv, k, a, eff) {
    var out = [], i = 1;
    function step(label, calc) {
      out.push('<div class="step"><span class="n">' + (i++) + '</span><span class="sx"><b>' + label + '</b><span class="sc">' + calc + '</span></span></div>');
    }
    if (eff && eff.steps) eff.steps.forEach(function (s) { step(s.label + ': ' + s.expr, '= ' + s.val); });

    var eta = M.eta2FromF(fv);
    step('Same effect as eta-squared',
      '&eta;&sup2; = f&sup2; / (1 + f&sup2;) = ' + trimNum(fv) + '&sup2; / (1 + ' + trimNum(fv) + '&sup2;) = ' + eta.toFixed(4) +
      ', so the grouping explains about ' + pct(eta, 1) + ' of the variance');

    if (mode === 'f') {
      step('Degrees of freedom', 'df&#8321; = k &minus; 1 = ' + res.df1 + ' and df&#8322; = (n &minus; 1) &times; k = (' + res.n + ' &minus; 1) &times; ' + k + ' = ' + res.df2);
      step('Solve power(f) = ' + trimNum(res.power) + ' for f',
        'Raise f until the noncentral F distribution puts ' + pct(res.power) + ' of its mass past the critical value. Root: f = ' + res.f.toFixed(4));
      step('Noncentrality at that effect', '&lambda; = k &times; n &times; f&sup2; = ' + k + ' &times; ' + res.n + ' &times; ' + res.f.toFixed(4) + '&sup2; = ' + res.ncp.toFixed(4));
      $('steps').innerHTML = out.join('');
      return;
    }

    if (mode === 'power') {
      step('Noncentrality parameter', '&lambda; = k &times; n &times; f&sup2; = ' + k + ' &times; ' + res.n + ' &times; ' + trimNum(fv) + '&sup2; = ' + res.ncp.toFixed(4));
      step('Degrees of freedom', 'df&#8321; = k &minus; 1 = ' + res.df1 + ' and df&#8322; = (n &minus; 1) &times; k = (' + res.n + ' &minus; 1) &times; ' + k + ' = ' + res.df2);
      step('Power', 'The share of the noncentral F(' + res.df1 + ', ' + res.df2 + ', &lambda; = ' + res.ncp.toFixed(3) +
        ') distribution beyond the alpha = ' + trimNum(a) + ' critical value: ' + res.power.toFixed(6));
      $('steps').innerHTML = out.join('');
      return;
    }

    step('Noncentrality parameter at the answer',
      '&lambda; = k &times; n &times; f&sup2; = ' + k + ' &times; ' + res.nCeil + ' &times; ' + trimNum(fv) + '&sup2; = ' + res.ncp.toFixed(4));
    step('Degrees of freedom',
      'df&#8321; = k &minus; 1 = ' + res.df1 + ' and df&#8322; = (n &minus; 1) &times; k = (' + res.nCeil + ' &minus; 1) &times; ' + k + ' = ' + res.df2);
    step('Solve power(n) = ' + trimNum(res.power) + ' for n',
      'Raise n until the noncentral F distribution puts ' + pct(res.power) + ' of its mass past the critical value. Root: n = ' + res.n.toFixed(4));
    step('Round up to whole participants',
      'ceiling(' + res.n.toFixed(4) + ') = ' + res.nCeil + ' per group, so ' + res.N + ' in total across ' + k + ' groups');
    step('Power you actually get at that integer',
      'power(' + res.nCeil + ') = ' + res.powerAtCeil.toFixed(6) + ', a little above the ' + pct(res.power) +
      ' you asked for because of the rounding');
    step('The base R cross-check',
      'power.anova.test wants variances: between.var / within.var = f&sup2; &times; k/(k&minus;1) = ' + res.betweenVarFor1.toFixed(6) +
      ' when within.var = 1. Its &lambda; = (k&minus;1) &times; n &times; ' + res.betweenVarFor1.toFixed(6) + ' matches pwr\'s k &times; n &times; f&sup2; exactly');
    $('steps').innerHTML = out.join('');
  }

  // ---------- main ----------
  function compute() {
    var eff = currentF();
    var a = num('alpha');
    var fv = eff.f;

    function bad(msg) {
      $('err').textContent = msg;
      $('err').classList.add('show');
      $('rescard').style.opacity = '.45';
    }
    $('err').classList.remove('show');
    $('rescard').style.opacity = '1';

    if (eff.error) { bad(eff.error); return; }

    // k: derived from the means when that source is active, else the k field.
    var k = (mode !== 'f' && src === 'means' && eff.k) ? eff.k : Math.round(num('k'));
    if (mode !== 'f' && src === 'means' && eff.k) $('k').value = eff.k;

    if (!isFinite(k) || k < 2) { bad('You need at least 2 groups for an ANOVA. For 2 groups this is the same test as a two-sample t test.'); return; }
    if (k > 200) { bad('That is more than 200 groups. Check the number of groups.'); return; }
    if (!isFinite(a) || a <= 0 || a >= 1) { bad('Alpha must be between 0 and 1. The usual value is 0.05.'); return; }

    var res, pw = num('power'), nPer = mode === 'f' || mode === 'power' ? Math.round(num('nper')) : null;

    if (mode !== 'f') {
      if (!isFinite(fv)) { bad('Enter the effect size you want to detect.'); return; }
      if (fv < 0) { bad("Cohen's f cannot be negative. It is a spread, so it is always 0 or more."); return; }
      if (fv < 1e-4) { bad("Cohen's f must be bigger than 0. If every group mean is identical there is no effect to detect, at any sample size."); return; }
    }
    if (mode !== 'power') {
      if (!isFinite(pw) || pw <= 0 || pw >= 1) { bad('Power must be between 0 and 1. The usual value is 0.80.'); return; }
      if (pw <= a) { bad('Power must be greater than alpha, otherwise the test is no better than a coin flip.'); return; }
    }
    if (mode !== 'n') {
      if (!isFinite(nPer) || nPer < 2) { bad('Each group needs at least 2 observations, otherwise there is no within-group variance to measure.'); return; }
    }

    if (mode === 'n') {
      res = M.solveSampleSize({ f: fv, k: k, alpha: a, power: pw });
    } else if (mode === 'power') {
      res = M.solvePower({ f: fv, k: k, n: nPer, alpha: a });
    } else {
      res = M.solveDetectableF({ k: k, n: nPer, alpha: a, power: pw });
      fv = res.f;
    }
    if (res.error) { bad(res.error); return; }

    var bm = M.benchmark(fv), eta = M.eta2FromF(fv);

    // derived-effect note
    if (mode !== 'f' && (src === 'means' || src === 'eta2') && eff.steps) {
      $('dnote').hidden = false;
      $('dnote').innerHTML = 'Your numbers imply <b>f = ' + fv.toFixed(4) + '</b> (&eta;&sup2; = ' + eta.toFixed(4) + '), ' +
        bm.note + '. The full arithmetic is in "How this number is computed" below.';
    } else { $('dnote').hidden = true; }

    $('vchip').textContent = 'One-way ANOVA, ' + k + ' group' + (k === 1 ? '' : 's');

    if (mode === 'n') {
      $('verdict').textContent = 'Recruit ' + res.nCeil + ' per group';
      $('vsub').textContent = res.N + ' participants in total across ' + k + ' groups.';
      $('bignv').textContent = res.nCeil;
      $('bignl').innerHTML = 'per group &middot; ' + res.N + ' total';
      $('s_exact').textContent = res.n.toFixed(3);
      $('s_ach').textContent = res.powerAtCeil.toFixed(4);
      if (res.atFloor) {
        $('verdict').textContent = 'Recruit 2 per group';
        $('vsub').textContent = 'An effect that large is detectable with the smallest possible study.';
      }
    } else if (mode === 'power') {
      $('verdict').textContent = pct(res.power) + ' power';
      $('vsub').textContent = 'With ' + nPer + ' per group, ' + res.N + ' in total.';
      $('bignv').textContent = pct(res.power);
      $('bignl').innerHTML = 'power &middot; ' + nPer + ' per group, ' + res.N + ' total';
      $('s_exact').textContent = nPer;
      $('s_ach').textContent = res.power.toFixed(4);
    } else {
      $('verdict').textContent = 'Smallest detectable f = ' + res.f.toFixed(3);
      $('vsub').textContent = 'With ' + nPer + ' per group, ' + res.N + ' in total.';
      $('bignv').textContent = res.f.toFixed(3);
      $('bignl').innerHTML = 'Cohen&rsquo;s f &middot; ' + nPer + ' per group, ' + res.N + ' total';
      $('s_exact').textContent = nPer;
      $('s_ach').textContent = res.powerAtF.toFixed(4);
    }
    $('s_f').textContent = fv.toFixed(3);
    $('s_eta').textContent = eta.toFixed(3);

    var nShow = (mode === 'n') ? res.nCeil : nPer;
    var pShow = (mode === 'n') ? res.powerAtCeil : (mode === 'power' ? res.power : res.powerAtF);

    if (mode === 'f') {
      $('plain').innerHTML = 'With <b>' + nPer + ' per group</b> across ' + k + ' groups (' + res.N +
        ' in total), the smallest effect you can catch ' + pct(pw, 0) + ' of the time is <b>f = ' + res.f.toFixed(3) +
        '</b> (&eta;&sup2; = ' + eta.toFixed(3) + ', about ' + pct(eta, 1) + ' of the variance), ' + bm.note +
        '. Anything smaller than that will slip past you more often than not at this sample size.';
    } else {
      $('plain').innerHTML = 'If the true effect really is <b>f = ' + fv.toFixed(3) + '</b> (' + bm.note +
        ', explaining about ' + pct(eta, 1) + ' of the variance), then a study with <b>' + nShow + ' per group</b> across ' +
        k + ' groups has a <b>' + pct(pShow) + '</b> chance of returning a significant F test at alpha = ' + trimNum(a) +
        '. Put the other way round, you would still miss a real effect of that size <b>' + pct(1 - pShow) + '</b> of the time.';
    }

    if (mode === 'n') {
      $('inftext').innerHTML = 'To detect <b>f = ' + fv.toFixed(3) + '</b> across ' + k + ' groups with ' + pct(pw, 0) +
        ' power at alpha = ' + trimNum(a) + ', recruit <b>' + res.nCeil + ' per group</b> (<b>' + res.N +
        '</b> in total). The exact requirement is ' + res.n.toFixed(2) + ', and rounding up to ' + res.nCeil +
        ' lands you at ' + pct(res.powerAtCeil) + ' power, so you are just above your target rather than below it.';
    } else if (mode === 'power') {
      var verdictWord = res.power >= 0.80 ? 'is adequately powered by the usual 80% convention'
        : res.power >= 0.5 ? 'is underpowered by the usual 80% convention' : 'is badly underpowered';
      $('inftext').innerHTML = 'With <b>' + nPer + ' per group</b> across ' + k + ' groups, a one-way ANOVA has <b>' +
        pct(res.power) + '</b> power to detect f = ' + fv.toFixed(3) + ' at alpha = ' + trimNum(a) + ', so this study <b>' +
        verdictWord + '</b>. You would miss a real effect of that size ' + pct(1 - res.power) + ' of the time.';
    } else {
      $('inftext').innerHTML = 'With <b>' + nPer + ' per group</b> across ' + k + ' groups you can detect <b>f = ' +
        res.f.toFixed(3) + '</b> or larger ' + pct(pw, 0) + ' of the time at alpha = ' + trimNum(a) +
        '. That is ' + bm.note + '. To catch anything smaller, you need a bigger sample or a more precise measurement.';
    }

    $('report').textContent = mode === 'f'
      ? 'A one-way ANOVA with ' + nPer + ' per group across ' + k + ' groups (N = ' + res.N + ') can detect f = ' +
        res.f.toFixed(3) + ' or larger with ' + pct(pw, 0) + ' power at alpha = ' + trimNum(a) + '.'
      : 'A one-way ANOVA with ' + nShow + ' per group across ' + k + ' groups (N = ' + (mode === 'n' ? res.N : res.N) +
        ') has ' + pct(pShow) + ' power to detect f = ' + fv.toFixed(3) + ' (eta-squared = ' + eta.toFixed(3) +
        ') at alpha = ' + trimNum(a) + '.';

    // what-if slider over k
    if (!wfTouched) $('wf').value = Math.min(12, Math.max(2, k));
    updateWf(fv, a, pw);

    drawCurve(fv, k, a, nShow, pShow, mode === 'power' ? NaN : pw);
    levers(fv, k, a, pw);
    kTable(fv, a, mode === 'power' ? 0.80 : pw, k);
    rcode(res, fv, k, a, eff);
    steps(res, fv, k, a, eff);

    if (!usedOnce) { usedOnce = true; if (window.__ssaUse) window.__ssaUse(); }
  }

  function updateWf(fv, a, pw) {
    var wk = parseInt($('wf').value, 10);
    var target = (mode === 'power') ? 0.80 : pw;
    if (!isFinite(fv) || fv <= 0 || !isFinite(target) || target <= 0 || target >= 1) return;
    var r = M.solveSampleSize({ f: fv, k: wk, alpha: a, power: target });
    $('wfv').textContent = r.error
      ? wk + ' groups → n/a'
      : wk + ' groups → ' + r.nCeil + ' per group, ' + r.N + ' total';
  }

  // ---------- wiring ----------
  document.querySelectorAll('.mode').forEach(function (b) {
    b.addEventListener('click', function () { wfTouched = false; setMode(b.dataset.mode); });
  });
  $('iwsel').addEventListener('change', function () { wfTouched = false; setMode($('iwsel').value); });
  document.querySelectorAll('.srcrow button').forEach(function (b) {
    b.addEventListener('click', function () { src = b.dataset.src; wfTouched = false; syncSrc(); compute(); });
  });
  ['fval', 'means', 'sdw', 'eta2', 'k', 'power', 'alpha', 'nper'].forEach(function (id) {
    $(id).addEventListener('input', function () { wfTouched = false; compute(); });
  });
  $('wf').addEventListener('input', function () { wfTouched = true; compute(); });

  document.querySelectorAll('.chip').forEach(function (c) {
    c.addEventListener('click', function () {
      var s = SCEN[c.dataset.scen];
      if (!s) return;
      src = s.src; wfTouched = false;
      if (s.f != null) $('fval').value = s.f;
      if (s.k != null) $('k').value = s.k;
      if (s.means != null) $('means').value = s.means;
      if (s.sdw != null) $('sdw').value = s.sdw;
      $('power').value = s.power;
      $('alpha').value = s.alpha;
      setMode(s.mode);
    });
  });

  $('copybtn').addEventListener('click', function () {
    navigator.clipboard.writeText($('report').textContent).then(function () {
      $('copybtn').textContent = 'Copied';
      setTimeout(function () { $('copybtn').textContent = 'Copy result line'; }, 1400);
      if (window.__ssaCopy) window.__ssaCopy('report');
    });
  });
  $('rcopy').addEventListener('click', function () {
    navigator.clipboard.writeText($('rcodepre').textContent).then(function () {
      $('rcopy').textContent = 'Copied';
      setTimeout(function () { $('rcopy').textContent = 'Copy'; }, 1400);
      if (window.__ssaCopy) window.__ssaCopy('rcode');
    });
  });

  setMode('n');
})();
