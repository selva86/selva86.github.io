/* posterior-calculator-ui.js - UI engine for tools/posterior-calculator.html.
   Externalised from the page so the rendered document stays under the audit's
   200KB ceiling. All math comes from PosteriorMath (R-verified); nothing here
   computes a statistic of its own. */
(function () {
  'use strict';
  var P = window.PosteriorMath;
  function $(id) { return document.getElementById(id); }

  // ------------------------------------------------------------ formatting
  function trim(s) {
    return s.indexOf('.') < 0 ? s : s.replace(/0+$/, '').replace(/\.$/, '');
  }
  // Display format: readable, not R's.
  function fmt(x) {
    if (x === null || x === undefined || (typeof x === 'number' && isNaN(x))) return '-';
    if (!isFinite(x)) return x > 0 ? '&infin;' : '-&infin;';
    if (x === 0) return '0';
    var a = Math.abs(x);
    if (a >= 1e-4 && a < 1e7) return trim(x.toFixed(a >= 100 ? 2 : (a >= 1 ? 3 : 4)));
    return x.toExponential(2);
  }
  function pct(x) { return (x * 100).toFixed(x * 100 >= 10 ? 0 : 1) + '%'; }

  // ---- R's print() format. The #> lines are a contract: R prints 7 significant
  // digits, drops trailing zeros, pads the exponent to two digits, and picks
  // fixed vs scientific by whichever is not wider. A vector gets ONE common
  // format, driven by the element that needs the most decimals.
  function nsigOf(x, digits) {
    var full = parseFloat(x.toPrecision(digits));
    for (var d = 1; d < digits; d++) if (parseFloat(x.toPrecision(d)) === full) return d;
    return digits;
  }
  function sciStr(x, nsig) {
    return x.toExponential(Math.max(0, nsig - 1)).replace(/e([+-])(\d)$/, 'e$10$2');
  }
  function decOf(x, digits) {
    var ns = nsigOf(x, digits);
    var v = parseFloat(x.toPrecision(ns));
    var e = Math.floor(Math.log10(Math.abs(v)));
    return { ns: ns, dec: Math.max(0, ns - 1 - e) };
  }
  function fmtR(x, digits) {
    digits = digits || 7;
    if (x === 0) return '0';
    if (typeof x !== 'number' || isNaN(x)) return 'NaN';
    if (!isFinite(x)) return x > 0 ? 'Inf' : '-Inf';
    var d = decOf(x, digits);
    var fixed = parseFloat(x.toPrecision(d.ns)).toFixed(d.dec);
    var sci = sciStr(x, d.ns);
    return fixed.length <= sci.length ? fixed : sci;
  }
  function fmtRvec(xs, digits) {
    digits = digits || 7;
    var i, dec = 0, anySci = false, out = [];
    for (i = 0; i < xs.length; i++) {
      if (xs[i] === 0 || !isFinite(xs[i])) continue;
      var d = decOf(xs[i], digits);
      if (d.dec > dec) dec = d.dec;
      if (fmtR(xs[i], digits).indexOf('e') >= 0) anySci = true;
    }
    if (anySci) return xs.map(function (x) { return fmtR(x, digits); });
    for (i = 0; i < xs.length; i++) {
      out.push(!isFinite(xs[i]) ? fmtR(xs[i], digits) : xs[i].toFixed(dec));
    }
    return out;
  }
  // R pads every element of a vector to a COMMON WIDTH and right-aligns it, so
  // c(1, 51) prints "[1]  1 51" and c(50001, 101) prints "[1] 50001   101".
  function rOut(xs, digits) {
    var s = fmtRvec(xs, digits), w = 0;
    s.forEach(function (t) { if (t.length > w) w = t.length; });
    return '#> [1] ' + s.map(function (t) {
      return t.length < w ? new Array(w - t.length + 1).join(' ') + t : t;
    }).join(' ');
  }
  // R prints a number typed as a literal the same way; keep inputs verbatim so
  // the emitted script asks R the same question the page answered.
  function lit(x) { return String(x); }

  // ------------------------------------------------------------ families
  var FAM = {
    'beta-binomial': {
      label: 'a proportion', long: 'a proportion, from successes out of trials',
      groups: ['in-bb', 'in-bb2'], sym: '&theta;',
      hint: 'The prior is worth alpha0 + beta0 imaginary trials. Beta(1, 1) is flat and barely nudges anything; Beta(50, 50) is worth 100 trials and will out-vote a small sample.',
      read: function () {
        return { a0: +$('bb-a0').value, b0: +$('bb-b0').value, s: +$('bb-s').value, n: +$('bb-n').value };
      },
      set: function (v) {
        $('bb-a0').value = v.a0; $('bb-b0').value = v.b0; $('bb-s').value = v.s; $('bb-n').value = v.n;
      },
      priorTxt: function (i) { return 'Beta(' + lit(i.a0) + ', ' + lit(i.b0) + ')'; },
      dataTxt: function (i) { return i.s + ' of ' + i.n; },
      dataKey: 'Data said (s/n)',
      scen: [
        { t: 'Weak prior, 7 of 10', v: { a0: 1, b0: 1, s: 7, n: 10 } },
        { t: 'Strong prior, same data', v: { a0: 50, b0: 50, s: 7, n: 10 } },
        { t: 'Jeffreys prior', v: { a0: 0.5, b0: 0.5, s: 7, n: 10 } },
        { t: 'Zero events in 50', v: { a0: 1, b0: 1, s: 0, n: 50 } },
        { t: 'Big sample: 9000 of 10000', v: { a0: 1, b0: 1, s: 9000, n: 10000 } }
      ]
    },
    'normal-normal': {
      label: 'a mean', long: 'a mean, when the measurement SD is known',
      groups: ['in-nn', 'in-nn2'], sym: '&mu;',
      hint: 'A normal prior with SD s0 is worth n0 = sigma^2 / s0^2 observations. Widen the prior SD and its weight falls away; the known sigma is the measurement noise, not the spread of your prior belief.',
      read: function () {
        return { m0: +$('nn-m0').value, s0: +$('nn-s0').value, xbar: +$('nn-xbar').value,
                 n: +$('nn-n').value, sigma: +$('nn-sigma').value };
      },
      set: function (v) {
        $('nn-m0').value = v.m0; $('nn-s0').value = v.s0; $('nn-xbar').value = v.xbar;
        $('nn-n').value = v.n; $('nn-sigma').value = v.sigma;
      },
      priorTxt: function (i) { return 'Normal(' + lit(i.m0) + ', ' + lit(i.s0) + '&sup2;)'; },
      dataTxt: function (i) { return 'mean ' + lit(i.xbar) + ' from ' + i.n; },
      dataKey: 'Data said (x&#772;)',
      scen: [
        { t: 'Weak prior', v: { m0: 100, s0: 50, xbar: 112, n: 25, sigma: 15 } },
        { t: 'Strong prior, same data', v: { m0: 100, s0: 2, xbar: 112, n: 25, sigma: 15 } },
        { t: 'A single reading', v: { m0: 100, s0: 10, xbar: 130, n: 1, sigma: 15 } },
        { t: 'Big sample swamps the prior', v: { m0: 100, s0: 5, xbar: 112, n: 5000, sigma: 15 } }
      ]
    },
    'gamma-poisson': {
      label: 'an event rate', long: 'an event rate, from counts over exposure',
      groups: ['in-gp', 'in-gp2'], sym: '&lambda;',
      hint: 'The prior is worth alpha0 events already seen over beta0 units of exposure. Gamma(0.001, 0.001) is the conventional vague choice; a rate of exactly 0 is an improper prior and has no curve to draw.',
      read: function () {
        return { a0: +$('gp-a0').value, b0: +$('gp-b0').value, y: +$('gp-y').value, t: +$('gp-t').value };
      },
      set: function (v) {
        $('gp-a0').value = v.a0; $('gp-b0').value = v.b0; $('gp-y').value = v.y; $('gp-t').value = v.t;
      },
      priorTxt: function (i) { return 'Gamma(' + lit(i.a0) + ', rate ' + lit(i.b0) + ')'; },
      dataTxt: function (i) { return i.y + ' in ' + lit(i.t); },
      dataKey: 'Data said (y/t)',
      scen: [
        { t: 'Vague prior: 12 in 10', v: { a0: 0.001, b0: 0.001, y: 12, t: 10 } },
        { t: 'Strong prior, same data', v: { a0: 100, b0: 50, y: 12, t: 10 } },
        { t: 'Zero events in 20', v: { a0: 1, b0: 1, y: 0, t: 20 } },
        { t: 'Big count: 50000 in 100', v: { a0: 1, b0: 1, y: 50000, t: 100 } }
      ]
    }
  };
  var ORDER = ['beta-binomial', 'normal-normal', 'gamma-poisson'];
  var state = { family: 'beta-binomial' };

  // ------------------------------------------------------------ the plot
  var NS = 'http://www.w3.org/2000/svg';
  var W = 600, H = 268, PL = 8, PR = 8, PT = 14, PB = 26;

  function el(name, attrs) {
    var e = document.createElementNS(NS, name), k;
    for (k in attrs) if (attrs.hasOwnProperty(k)) e.setAttribute(k, attrs[k]);
    return e;
  }
  function windowFor(r) {
    var lo = Math.min(r.priorLo, r.likLo, r.lo);
    var hi = Math.max(r.priorHi, r.likHi, r.hi);
    // A diffuse prior must not flatten the posterior into an invisible spike:
    // clamp the view to a few posterior SDs and let the prior run off the edge
    // (which is itself the honest picture of a weak prior).
    if (isFinite(r.sd) && r.sd > 0) {
      lo = Math.max(lo, r.mean - 8 * r.sd);
      hi = Math.min(hi, r.mean + 8 * r.sd);
    }
    if (!(hi > lo)) { lo = r.mean - 1; hi = r.mean + 1; }
    var pad = (hi - lo) * 0.04;
    lo -= pad; hi += pad;
    if (r.family === 'beta-binomial') { lo = Math.max(0, lo); hi = Math.min(1, hi); }
    if (r.family === 'gamma-poisson') { lo = Math.max(0, lo); }
    return [lo, hi];
  }
  function draw(r) {
    var g = $('plot-g');
    while (g.firstChild) g.removeChild(g.firstChild);
    if (!r.ok) return;
    var win = windowFor(r), lo = win[0], hi = win[1];
    var N = 260, i, x, xs = [], dp = [], dl = [], dq = [];
    for (i = 0; i <= N; i++) {
      x = lo + (hi - lo) * i / N;
      xs.push(x);
      dp.push(r.dPrior(x)); dl.push(r.dLik(x)); dq.push(r.dPost(x));
    }
    function finiteMax(a) {
      var m = 0;
      for (var j = 0; j < a.length; j++) if (isFinite(a[j]) && a[j] > m) m = a[j];
      return m;
    }
    var mq = finiteMax(dq);
    // Cap the y-axis at 3x the posterior peak so an infinite prior spike
    // (alpha < 1) clips instead of crushing every other curve to the floor.
    var ymax = Math.max(finiteMax(dp), finiteMax(dl), mq);
    if (mq > 0) ymax = Math.min(ymax, mq * 3);
    if (!(ymax > 0)) ymax = 1;
    var X = function (v) { return PL + (v - lo) / (hi - lo) * (W - PL - PR); };
    var Y = function (v) {
      if (!isFinite(v)) v = ymax;
      return H - PB - Math.min(v, ymax) / ymax * (H - PT - PB);
    };
    function path(ds) {
      var d = '', started = false;
      for (var j = 0; j < xs.length; j++) {
        var v = ds[j];
        if (isNaN(v)) { started = false; continue; }
        d += (started ? 'L' : 'M') + X(xs[j]).toFixed(2) + ' ' + Y(v).toFixed(2) + ' ';
        started = true;
      }
      return d;
    }
    // baseline
    g.appendChild(el('line', { x1: PL, y1: H - PB, x2: W - PR, y2: H - PB, stroke: '#e9e9e4', 'stroke-width': 1 }));
    // shaded credible interval under the posterior
    var sLo = Math.max(lo, r.lo), sHi = Math.min(hi, r.hi);
    if (sHi > sLo) {
      var d2 = 'M' + X(sLo).toFixed(2) + ' ' + (H - PB);
      for (i = 0; i <= 120; i++) {
        x = sLo + (sHi - sLo) * i / 120;
        d2 += 'L' + X(x).toFixed(2) + ' ' + Y(r.dPost(x)).toFixed(2);
      }
      d2 += 'L' + X(sHi).toFixed(2) + ' ' + (H - PB) + 'Z';
      g.appendChild(el('path', { d: d2, fill: '#1f7a55', 'fill-opacity': '.13' }));
    }
    g.appendChild(el('path', { d: path(dp), fill: 'none', stroke: '#8a8f98', 'stroke-width': 2, 'stroke-dasharray': '6 4' }));
    // A flat prior scales the likelihood by a constant, so the two curves land
    // exactly on each other (Beta(1,1), the default, does this). Detect that
    // rather than guess at it, and widen the likelihood only then, so its dots
    // fringe the posterior instead of vanishing under it and reading as a
    // missing curve. At normal weight everywhere else.
    var coincide = true;
    for (i = 0; i < dq.length && coincide; i++) {
      if (!isFinite(dq[i]) || !isFinite(dl[i])) continue;
      if (Math.abs(dl[i] - dq[i]) > 1e-3 * Math.max(1e-12, mq)) coincide = false;
    }
    g.appendChild(el('path', {
      d: path(dl), fill: 'none', stroke: '#b06d2f',
      'stroke-width': coincide ? 6 : 2.2,
      'stroke-dasharray': coincide ? '1.5 5' : '2 3', 'stroke-linecap': 'round'
    }));
    g.appendChild(el('path', { d: path(dq), fill: 'none', stroke: '#1f7a55', 'stroke-width': 2.5 }));
    // posterior mean marker
    if (r.mean >= lo && r.mean <= hi) {
      g.appendChild(el('line', { x1: X(r.mean).toFixed(2), y1: Y(r.dPost(r.mean)).toFixed(2), x2: X(r.mean).toFixed(2), y2: H - PB, stroke: '#155c40', 'stroke-width': 1.5, 'stroke-dasharray': '3 3' }));
    }
    // axis ticks
    for (i = 0; i <= 4; i++) {
      var tv = lo + (hi - lo) * i / 4;
      var t = el('text', { x: X(tv).toFixed(2), y: H - 8, 'text-anchor': i === 0 ? 'start' : (i === 4 ? 'end' : 'middle'), fill: '#888e97', 'font-size': '11', 'font-family': 'Inter,sans-serif' });
      t.textContent = fmt(tv).replace('&infin;', 'Inf');
      g.appendChild(t);
    }
  }

  // ------------------------------------------------------------ R emitter
  function rcode(r, inp) {
    var lev = r.level, a = (1 - lev) / 2, b = 1 - a;
    var qs = '(c(' + a + ', ' + b + ')';
    var L = [];
    if (state.family === 'beta-binomial') {
      L.push('# Beta-Binomial: alpha counts successes, beta counts failures,');
      L.push('# so the update is addition.');
      L.push('a0 <- ' + lit(inp.a0) + '; b0 <- ' + lit(inp.b0) + '        # prior Beta(' + lit(inp.a0) + ', ' + lit(inp.b0) + ')');
      L.push('s  <- ' + lit(inp.s) + '; n  <- ' + lit(inp.n) + '        # ' + inp.s + ' successes in ' + inp.n + ' trials');
      L.push('');
      L.push('a1 <- a0 + s          # posterior alpha');
      L.push('b1 <- b0 + n - s      # posterior beta');
      L.push('c(a1, b1)');
      L.push(rOut([r.post.a, r.post.b]));
      L.push('');
      L.push('a1 / (a1 + b1)                 # posterior mean');
      L.push(rOut([r.mean]));
      L.push('qbeta(0.5, a1, b1)             # posterior median');
      L.push(rOut([r.median]));
      L.push('qbeta' + qs + ', a1, b1)   # ' + Math.round(lev * 100) + '% credible interval');
      L.push(rOut([r.lo, r.hi]));
    } else if (state.family === 'normal-normal') {
      L.push('# Normal-Normal with sigma known: precisions add.');
      L.push('m0 <- ' + lit(inp.m0) + '; s0 <- ' + lit(inp.s0) + '        # prior Normal(' + lit(inp.m0) + ', ' + lit(inp.s0) + '^2)');
      L.push('xbar <- ' + lit(inp.xbar) + '; n <- ' + lit(inp.n) + '; sigma <- ' + lit(inp.sigma));
      L.push('');
      L.push('prec0 <- 1 / s0^2     # prior precision');
      L.push('precD <- n / sigma^2  # data precision');
      L.push('s1 <- sqrt(1 / (prec0 + precD))                      # posterior SD');
      L.push('m1 <- (m0 * prec0 + xbar * precD) / (prec0 + precD)  # posterior mean');
      L.push('m1');
      L.push(rOut([r.post.m]));
      L.push('s1');
      L.push(rOut([r.post.s]));
      L.push('');
      L.push('qnorm' + qs + ', m1, s1)   # ' + Math.round(lev * 100) + '% credible interval');
      L.push(rOut([r.lo, r.hi]));
    } else {
      L.push('# Gamma-Poisson: the prior carries a0 events over b0 exposure.');
      L.push('a0 <- ' + lit(inp.a0) + '; b0 <- ' + lit(inp.b0) + '    # prior Gamma(' + lit(inp.a0) + ', rate = ' + lit(inp.b0) + ')');
      L.push('y  <- ' + lit(inp.y) + '; t  <- ' + lit(inp.t) + '        # ' + inp.y + ' events over ' + lit(inp.t) + ' of exposure');
      L.push('');
      L.push('a1 <- a0 + y          # posterior shape');
      L.push('b1 <- b0 + t          # posterior rate');
      L.push('c(a1, b1)');
      L.push(rOut([r.post.a, r.post.b]));
      L.push('');
      L.push('a1 / b1                                          # posterior mean');
      L.push(rOut([r.mean]));
      L.push('qgamma(0.5, shape = a1, rate = b1)               # posterior median');
      L.push(rOut([r.median]));
      L.push('qgamma' + qs + ', shape = a1, rate = b1)   # ' + Math.round(lev * 100) + '% credible interval');
      L.push(rOut([r.lo, r.hi]));
    }
    return L.join('\n');
  }

  // ------------------------------------------------------------ steps
  function steps(r, inp, F) {
    var lev = Math.round(r.level * 100);
    if (state.family === 'beta-binomial') {
      $('h1c').innerHTML = 'Your prior <code>Beta(' + lit(inp.a0) + ', ' + lit(inp.b0) + ')</code> is worth <b>' + fmt(inp.a0 + inp.b0) + ' imaginary trials</b>, and it expects a rate of ' + fmt(r.priorMean) + '.';
      $('h2c').innerHTML = 'Your data adds <b>' + inp.s + ' successes</b> and <b>' + (inp.n - inp.s) + ' failures</b>, an observed rate of ' + fmt(r.mle) + '.';
      $('h3c').innerHTML = 'Add them straight onto the parameters: &alpha;<sub>1</sub> = ' + lit(inp.a0) + ' + ' + inp.s + ' = <b>' + fmt(r.post.a) + '</b>, &beta;<sub>1</sub> = ' + lit(inp.b0) + ' + ' + (inp.n - inp.s) + ' = <b>' + fmt(r.post.b) + '</b>. The posterior is <code>Beta(' + fmt(r.post.a) + ', ' + fmt(r.post.b) + ')</code>, with mean &alpha;<sub>1</sub>/(&alpha;<sub>1</sub>+&beta;<sub>1</sub>) = <b>' + fmt(r.mean) + '</b>.';
    } else if (state.family === 'normal-normal') {
      $('h1c').innerHTML = 'Your prior <code>Normal(' + lit(inp.m0) + ', ' + lit(inp.s0) + '&sup2;)</code> carries precision 1/s<sub>0</sub>&sup2; = <b>' + fmt(1 / (inp.s0 * inp.s0)) + '</b>, which against &sigma; = ' + lit(inp.sigma) + ' is worth <b>' + fmt(r.priorObs) + ' observations</b>.';
      $('h2c').innerHTML = 'Your ' + inp.n + ' readings carry precision n/&sigma;&sup2; = <b>' + fmt(inp.n / (inp.sigma * inp.sigma)) + '</b>, and a sample mean of ' + fmt(r.mle) + '.';
      $('h3c').innerHTML = 'Precisions add: 1/s<sub>1</sub>&sup2; = ' + fmt(1 / (inp.s0 * inp.s0)) + ' + ' + fmt(inp.n / (inp.sigma * inp.sigma)) + ', so s<sub>1</sub> = <b>' + fmt(r.post.s) + '</b>. The posterior mean is the precision-weighted average <b>' + fmt(r.post.m) + '</b>, which is the same as (n<sub>0</sub>m<sub>0</sub> + nx&#772;)/(n<sub>0</sub>+n) with n<sub>0</sub> = ' + fmt(r.priorObs) + '.';
    } else {
      $('h1c').innerHTML = 'Your prior <code>Gamma(' + lit(inp.a0) + ', rate ' + lit(inp.b0) + ')</code> behaves like <b>' + lit(inp.a0) + ' events already seen over ' + lit(inp.b0) + ' of exposure</b>, expecting a rate of ' + fmt(r.priorMean) + '.';
      $('h2c').innerHTML = 'Your data adds <b>' + inp.y + ' events</b> over <b>' + lit(inp.t) + ' of exposure</b>, an observed rate of ' + fmt(r.mle) + '.';
      $('h3c').innerHTML = 'Add each to its own parameter: shape = ' + lit(inp.a0) + ' + ' + inp.y + ' = <b>' + fmt(r.post.a) + '</b>, rate = ' + lit(inp.b0) + ' + ' + lit(inp.t) + ' = <b>' + fmt(r.post.b) + '</b>. The posterior is <code>Gamma(' + fmt(r.post.a) + ', rate ' + fmt(r.post.b) + ')</code>, with mean shape/rate = <b>' + fmt(r.mean) + '</b>.';
    }
    var qfn = state.family === 'beta-binomial' ? 'qbeta()' : (state.family === 'normal-normal' ? 'qnorm()' : 'qgamma()');
    $('h4c').innerHTML = 'The ' + lev + '% credible interval is just two quantiles of that posterior, <code>' + qfn + '</code> at ' + ((1 - r.level) / 2) + ' and ' + (1 - (1 - r.level) / 2) + ': <b>' + fmt(r.lo) + '</b> to <b>' + fmt(r.hi) + '</b>. No approximation and no simulation: the posterior is a named distribution, so its quantiles are exact.';
  }

  // ------------------------------------------------------------ render
  function render() {
    var F = FAM[state.family];
    var inp = F.read();
    inp.level = +$('lev').value;
    var r = P.analyze(state.family, inp);

    $('hint').textContent = F.hint;
    if (!r.ok) {
      $('ierr').textContent = r.errors[0];
      $('ierr').classList.add('show');
      $('vchip').textContent = '-';
      $('vhead').textContent = '-';
      $('vsub').textContent = 'Fix the highlighted input and the answer comes back.';
      $('plain').innerHTML = '';
      $('inference-line').innerHTML = '';
      $('report').textContent = '';
      $('rcodepre').textContent = '';
      ['v1', 'v2', 'v3', 'v4', 'd1', 'd2', 'd3', 'd4'].forEach(function (id) { $(id).textContent = '-'; });
      draw({ ok: false });
      return;
    }
    $('ierr').classList.remove('show');

    var lev = Math.round(r.level * 100);
    $('vchip').innerHTML = 'Posterior: ' + (state.family === 'normal-normal'
      ? 'Normal(' + fmt(r.post.m) + ', ' + fmt(r.post.s) + '&sup2;)'
      : (state.family === 'beta-binomial' ? 'Beta(' : 'Gamma(') + fmt(r.post.a) + ', ' + fmt(r.post.b) + ')');
    $('vhead').innerHTML = fmt(r.lo) + ' to ' + fmt(r.hi);
    $('vsub').innerHTML = lev + '% credible interval for ' + F.long.split(',')[0] + ' (' + F.sym + '). Posterior mean ' + fmt(r.mean) + '.';

    $('k4').textContent = lev + '% credible';
    $('v1').textContent = fmt(r.mean);
    $('v2').textContent = fmt(r.median);
    $('v3').textContent = fmt(r.sd);
    $('v4').innerHTML = fmt(r.lo) + ' to ' + fmt(r.hi);

    $('d1').innerHTML = fmt(r.priorMean);
    $('dk2').innerHTML = F.dataKey;
    $('d2').innerHTML = fmt(r.mle);
    $('d3').innerHTML = pct(r.w);
    $('d4').innerHTML = state.family === 'normal-normal'
      ? fmt(r.post.m) + ' &plusmn; ' + fmt(r.post.s)
      : fmt(r.post.a) + ', ' + fmt(r.post.b);

    // plain English: which source drove the answer, and by how much
    var drove = r.w > 0.5 ? 'your prior' : 'the data';
    var pull = Math.abs(r.mean - r.mle), pullPrior = Math.abs(r.mean - r.priorMean);
    // Beta(1,1) is the one exactly-flat prior among these three families, and
    // it is the default. A flat prior scales the likelihood by a constant, so
    // the two curves land on each other; say so rather than let it look broken.
    var flatNote = (state.family === 'beta-binomial' && inp.a0 === 1 && inp.b0 === 1)
      ? ' A flat Beta(1, 1) prior just multiplies the likelihood by a constant, which is why the posterior curve is sitting exactly on the likelihood here.' : '';
    $('plain').innerHTML = 'On its own your data says <b>' + fmt(r.mle) + '</b>, and your prior expected <b>' + fmt(r.priorMean) + '</b>. '
      + 'The posterior settles at <b>' + fmt(r.mean) + '</b>, which is ' + (pull < pullPrior ? 'nearer the data' : (pull > pullPrior ? 'nearer the prior' : 'exactly between them'))
      + ', because the prior is carrying <b>' + pct(r.w) + '</b> of the weight and ' + drove + ' is doing most of the work. '
      + (state.family === 'normal-normal'
        ? 'A flat prior here would give exactly ' + fmt(r.flat.lo) + ' to ' + fmt(r.flat.hi) + ', digit for digit the z confidence interval.'
        : 'With a reference prior instead of yours the interval would be ' + fmt(r.flat.lo) + ' to ' + fmt(r.flat.hi) + '.')
      + flatNote;

    $('inference-line').innerHTML = '<span class="ik">What this means</span>Given a <b>' + F.priorTxt(inp)
      + '</b> prior and data of <b>' + F.dataTxt(inp) + '</b>, there is a <b>' + lev + '% probability</b> that '
      + F.long.split(',')[0] + ' lies between <b>' + fmt(r.lo) + '</b> and <b>' + fmt(r.hi) + '</b>. '
      + 'That is a claim about ' + F.sym + ' itself, which is what a confidence interval may not say.';

    $('report').textContent = 'Posterior ' + $('vchip').textContent.replace('Posterior: ', '')
      .replace(/&sup2;/g, '^2') + ': mean ' + fmt(r.mean) + ', ' + lev + '% credible interval ['
      + fmt(r.lo) + ', ' + fmt(r.hi) + '].';

    steps(r, inp, F);
    $('rcodepre').textContent = rcode(r, inp);
    draw(r);
  }

  // ------------------------------------------------------------ chrome
  function iwant() {
    var opts = ORDER.map(function (k) {
      return '<option value="' + k + '"' + (k === state.family ? ' selected' : '') + '>' + FAM[k].long + '</option>';
    }).join('');
    $('iwant').innerHTML = 'I want to update my belief about <span class="psel">' + FAM[state.family].label
      + '<span class="pcaret">&#9662;</span><select id="fsel" aria-label="Which family">' + opts + '</select></span>';
    $('fsel').addEventListener('change', function () { setFamily(this.value); });
  }
  function chips() {
    var c = $('scen');
    c.innerHTML = '<span class="sl">Try:</span>';
    FAM[state.family].scen.forEach(function (s) {
      var b = document.createElement('button');
      b.className = 'chip';
      b.setAttribute('data-scen', s.t);
      b.textContent = s.t;
      b.addEventListener('click', function () {
        FAM[state.family].set(s.v);
        window.RSTrack.use(state.family);
        render();
      });
      c.appendChild(b);
    });
  }
  function setFamily(f) {
    state.family = f;
    ORDER.forEach(function (k) {
      FAM[k].groups.forEach(function (g) { $(g).hidden = (k !== f); });
    });
    [].forEach.call(document.querySelectorAll('.mode'), function (m) {
      m.classList.toggle('on', m.getAttribute('data-mode') === f);
    });
    iwant();
    chips();
    window.RSTrack.use(f);
    render();
  }

  function init() {
    [].forEach.call(document.querySelectorAll('.mode'), function (m) {
      m.addEventListener('click', function () { setFamily(m.getAttribute('data-mode')); });
    });
    [].forEach.call(document.querySelectorAll('input, select'), function (i) {
      if (i.id === 'fsel') return;
      i.addEventListener('input', function () { window.RSTrack.use(state.family); render(); });
      i.addEventListener('change', function () { render(); });
    });
    $('copybtn').addEventListener('click', function () {
      navigator.clipboard.writeText($('report').textContent).then(function () {
        var b = $('copybtn'), t = b.textContent;
        b.textContent = 'Copied';
        setTimeout(function () { b.textContent = t; }, 1400);
      });
      window.RSTrack.copy('report');
    });
    $('rcopy').addEventListener('click', function () {
      navigator.clipboard.writeText($('rcodepre').textContent).then(function () {
        var b = $('rcopy'), t = b.textContent;
        b.textContent = 'Copied';
        setTimeout(function () { b.textContent = t; }, 1400);
      });
      window.RSTrack.copy('rcode');
    });
    iwant();
    chips();
    render();
  }
  // expose for the test harness
  window.__posterior = { render: render, setFamily: setFamily, fmtR: fmtR, fmtRvec: fmtRvec };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
