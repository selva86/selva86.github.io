/* wrong-family-fit.js - fit the wrong kind of model and watch exactly how it fails.
 *
 * Serves the ordinal-outcome, link-function, zero-inflation, overfitting and missing-
 * interaction objections in The Publishing Handbook. One config key picks the
 * misspecification; each one fails in its own visible, countable way.
 *
 *   link          a linear model on a yes/no outcome predicts probabilities below 0 and
 *                 above 1. The widget counts them and names the worst one.
 *   zero-inflation a Poisson model on data with a pile of structural zeros predicts far
 *                 fewer zeros than the data contain. The widget compares the two counts.
 *   ordinal       a 1-to-5 rating treated as a number predicts values no respondent could
 *                 give, and assumes the gap from 1 to 2 equals the gap from 4 to 5, which
 *                 in this data it does not. The true gaps are printed.
 *   overfitting   a polynomial degree slider. Training fit rises to nearly perfect while
 *                 error on data the model has not seen goes the other way.
 *   interaction   two groups whose slopes point in opposite directions, fitted additively.
 *                 The single slope is near zero and describes neither group.
 *
 * Everything is seeded, so the same config always draws the same picture. The right model
 * is fitted alongside the wrong one by iteratively reweighted least squares (the same
 * algorithm glm() uses), and least squares is solved by modified Gram-Schmidt so a degree
 * 12 polynomial does not fall over numerically. Coefficients were checked against glm()
 * and lm() in R.
 *
 * SIMPLIFIED, and why: in `ordinal` mode the correct model is shown as the observed
 * distribution of ratings in each slice of x rather than as a fitted proportional-odds
 * curve. Fitting cumulative logit in the browser would add an optimiser for four
 * thresholds and buy nothing the reader needs to see: the point is that the categories are
 * not evenly spaced and the line predicts values that do not exist, and the observed
 * distribution shows that more directly than a fitted curve would. The emitted R fits
 * MASS::polr for anyone who wants the model itself.
 *
 * cfg: {
 *   mode: "link",              // link | zero-inflation | ordinal | overfitting | interaction
 *   modes: ["...", "..."],     // OR a list -> segmented control (default: just `mode`)
 *   n: null,                   // sample size (per-mode default)
 *   degree: 3,                 // overfitting mode: starting polynomial degree
 *   maxDegree: 12,             // overfitting mode: slider maximum
 *   seed: 31
 * }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u;

  var LIGHT = {
    ink: '#131720', body: '#434b59', mut: '#677084', faint: '#97a0b2',
    line: '#d8dee9', grid: '#eef1f6', acc: '#1f7a55', c0: '#2563a8', c1: '#b5631a',
    bad: '#c2410c', panel: '#ffffff', soft: '#f6f8fa', warn: '#fbeae5'
  };
  var DARK = {
    ink: '#eef4fb', body: '#c3d1e3', mut: '#93a4bb', faint: '#6f8299',
    line: 'rgba(255,255,255,.24)', grid: 'rgba(255,255,255,.10)', acc: '#46c08a',
    c0: '#7fb2ea', c1: '#e3a05a', bad: '#f4805a', panel: '#101c2b',
    soft: 'rgba(255,255,255,.05)', warn: 'rgba(244,128,90,.16)'
  };
  function lumOf(c) {
    c = String(c).trim(); var r, g, b, m;
    if (c.charAt(0) === '#') {
      if (c.length === 4) { r = parseInt(c[1] + c[1], 16); g = parseInt(c[2] + c[2], 16); b = parseInt(c[3] + c[3], 16); }
      else { r = parseInt(c.substr(1, 2), 16); g = parseInt(c.substr(3, 2), 16); b = parseInt(c.substr(5, 2), 16); }
    } else if ((m = c.match(/rgba?\(([^)]+)\)/))) { var p = m[1].split(','); r = +p[0]; g = +p[1]; b = +p[2]; }
    else return 1;
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  }
  function isDark(el) {
    try { var v = getComputedStyle(el).getPropertyValue('--lm-panel'); if (v && v.trim()) return lumOf(v) < 0.45; } catch (e) {}
    return !!(document.documentElement && document.documentElement.classList.contains('dark'));
  }
  function palette(el) { return isDark(el) ? DARK : LIGHT; }

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function gaussian(rnd) { var a = 1 - rnd(), b = rnd(); return Math.sqrt(-2 * Math.log(a)) * Math.cos(2 * Math.PI * b); }
  function rpois(rnd, lam) {                     // Knuth, fine for the small means used here
    var L = Math.exp(-lam), k = 0, p = 1;
    do { k++; p *= rnd(); } while (p > L);
    return k - 1;
  }
  function logistic(z) { return 1 / (1 + Math.exp(-z)); }

  /* Least squares by modified Gram-Schmidt: stable enough for a degree 12 Vandermonde. */
  function lsq(X, y) {
    var n = X.length, p = X[0].length, cols = [], Q = [], R = [], i, j, k;
    for (j = 0; j < p; j++) { var c = new Float64Array(n); for (i = 0; i < n; i++) c[i] = X[i][j]; cols.push(c); R.push(new Float64Array(p)); }
    for (j = 0; j < p; j++) {
      for (k = 0; k < j; k++) {
        var d = 0; for (i = 0; i < n; i++) d += Q[k][i] * cols[j][i];
        R[k][j] = d; for (i = 0; i < n; i++) cols[j][i] -= d * Q[k][i];
      }
      var nrm = 0; for (i = 0; i < n; i++) nrm += cols[j][i] * cols[j][i];
      nrm = Math.sqrt(nrm); R[j][j] = nrm;
      var q = new Float64Array(n);
      if (nrm > 1e-11) for (i = 0; i < n; i++) q[i] = cols[j][i] / nrm;
      Q.push(q);
    }
    var b = new Float64Array(p);
    for (j = 0; j < p; j++) { var s = 0; for (i = 0; i < n; i++) s += Q[j][i] * y[i]; b[j] = s; }
    var beta = new Float64Array(p);
    for (j = p - 1; j >= 0; j--) {
      var t = b[j];
      for (k = j + 1; k < p; k++) t -= R[j][k] * beta[k];
      beta[j] = R[j][j] > 1e-11 ? t / R[j][j] : 0;
    }
    return beta;
  }
  /* GLM by iteratively reweighted least squares - the algorithm glm() itself uses. */
  function glm(X, y, family) {
    var n = X.length, p = X[0].length, beta = new Float64Array(p), it, i, j;
    for (it = 0; it < 60; it++) {
      var Xw = [], z = new Float64Array(n);
      for (i = 0; i < n; i++) {
        var eta = 0;
        for (j = 0; j < p; j++) eta += X[i][j] * beta[j];
        var mu, wt;
        if (family === 'binomial') {
          mu = Math.min(1 - 1e-10, Math.max(1e-10, logistic(eta)));
          wt = mu * (1 - mu);
        } else {
          mu = Math.exp(Math.min(30, eta)); wt = Math.max(1e-10, mu);
        }
        var zz = eta + (y[i] - mu) / wt;              // the working response
        var sw = Math.sqrt(wt), row = [];
        for (j = 0; j < p; j++) row.push(X[i][j] * sw);
        Xw.push(row); z[i] = zz * sw;
      }
      var nb = lsq(Xw, z), delta = 0;
      for (j = 0; j < p; j++) { delta += Math.abs(nb[j] - beta[j]); beta[j] = nb[j]; }
      if (delta < 1e-11) break;
    }
    return beta;
  }
  function poly(x, deg) { var r = [1], v = 1, d; for (d = 1; d <= deg; d++) { v *= x; r.push(v); } return r; }
  function evalp(b, x) { var s = 0, v = 1, j; for (j = 0; j < b.length; j++) { s += b[j] * v; v *= x; } return s; }

  /* ---------------- the five misspecifications ---------------- */
  var MODES = {
    link: {
      short: 'Wrong link', n: 200,
      title: 'A yes/no outcome fitted with a straight line',
      build: function (n, seed) {
        var rnd = mulberry32(seed), x = [], y = [], i;
        for (i = 0; i < n; i++) { var xv = -3 + 6 * rnd(); x.push(xv); y.push(rnd() < logistic(1.4 * xv) ? 1 : 0); }
        var X = x.map(function (v) { return [1, v]; });
        var lin = lsq(X, y), log = glm(X, y, 'binomial');
        var bad = 0, worstLo = 1, worstHi = 0;
        x.forEach(function (v) { var f = lin[0] + lin[1] * v; if (f < 0 || f > 1) bad++; if (f < worstLo) worstLo = f; if (f > worstHi) worstHi = f; });
        return { x: x, y: y, lin: lin, log: log, bad: bad, worstLo: worstLo, worstHi: worstHi, n: n,
                 outX: 4, outLin: lin[0] + lin[1] * 4, outLog: logistic(log[0] + log[1] * 4) };
      }
    },
    'zero-inflation': {
      short: 'Zero inflation', n: 260,
      title: 'Counts with a pile of structural zeros, fitted as ordinary Poisson',
      build: function (n, seed) {
        var rnd = mulberry32(seed), x = [], y = [], i, pZero = 0.45;
        for (i = 0; i < n; i++) {
          var xv = gaussian(rnd);
          x.push(xv);
          y.push(rnd() < pZero ? 0 : rpois(rnd, Math.exp(0.9 + 0.7 * xv)));
        }
        var X = x.map(function (v) { return [1, v]; });
        var b = glm(X, y, 'poisson');
        var obsZero = 0, expZero = 0, maxC = 0;
        for (i = 0; i < n; i++) {
          if (y[i] === 0) obsZero++;
          expZero += Math.exp(-Math.exp(b[0] + b[1] * x[i]));
          if (y[i] > maxC) maxC = y[i];
        }
        return { x: x, y: y, b: b, obsZero: obsZero, expZero: expZero, maxC: maxC, n: n, pZero: pZero };
      }
    },
    ordinal: {
      short: 'Ordinal as numeric', n: 240,
      title: 'A 1-to-5 rating treated as a number',
      build: function (n, seed) {
        var rnd = mulberry32(seed), cuts = [-2.0, -0.4, 0.2, 2.4], x = [], y = [], i, j;
        for (i = 0; i < n; i++) {
          var xv = -2 + 4 * rnd();
          var z = 1.1 * xv + Math.log(rnd() / (1 - rnd()));      // logistic latent noise
          var cat = 1;
          for (j = 0; j < cuts.length; j++) if (z > cuts[j]) cat = j + 2;
          x.push(xv); y.push(cat);
        }
        var X = x.map(function (v) { return [1, v]; });
        var lin = lsq(X, y);
        var gaps = [];
        for (j = 1; j < cuts.length; j++) gaps.push(cuts[j] - cuts[j - 1]);
        return { x: x, y: y, lin: lin, cuts: cuts, gaps: gaps, n: n,
                 predLo: lin[0] - 2 * lin[1], predHi: lin[0] + 2 * lin[1],
                 outX: 3, predOut: lin[0] + 3 * lin[1] };
      }
    },
    overfitting: {
      short: 'Overfitting', n: 18, slider: true,
      title: 'A polynomial flexible enough to memorise the training set',
      build: function (n, seed) {
        var rnd = mulberry32(seed), xtr = [], ytr = [], xte = [], yte = [], i;
        function f(v) { return Math.sin(2.3 * v); }
        for (i = 0; i < n; i++) { var a = -1 + 2 * (i + 0.5) / n; xtr.push(a); ytr.push(f(a) + 0.28 * gaussian(rnd)); }
        for (i = 0; i < n; i++) { var b = -1 + 2 * rnd(); xte.push(b); yte.push(f(b) + 0.28 * gaussian(rnd)); }
        return { xtr: xtr, ytr: ytr, xte: xte, yte: yte, n: n };
      },
      refit: function (D, deg) {
        var X = D.xtr.map(function (v) { return poly(v, deg); });
        var b = lsq(X, D.ytr), i, rssTr = 0, tss = 0, mtr = 0, rssTe = 0;
        for (i = 0; i < D.ytr.length; i++) mtr += D.ytr[i]; mtr /= D.ytr.length;
        for (i = 0; i < D.xtr.length; i++) { var e = D.ytr[i] - evalp(b, D.xtr[i]); rssTr += e * e; tss += (D.ytr[i] - mtr) * (D.ytr[i] - mtr); }
        for (i = 0; i < D.xte.length; i++) { var e2 = D.yte[i] - evalp(b, D.xte[i]); rssTe += e2 * e2; }
        return { b: b, r2: 1 - rssTr / tss,
                 rmseTr: Math.sqrt(rssTr / D.xtr.length), rmseTe: Math.sqrt(rssTe / D.xte.length) };
      }
    },
    interaction: {
      short: 'Missing interaction', n: 140,
      title: 'Two groups with opposite slopes, fitted without an interaction',
      build: function (n, seed) {
        var rnd = mulberry32(seed), x = [], g = [], y = [], i;
        for (i = 0; i < n; i++) {
          var xv = 10 * rnd(), gi = i % 2;
          x.push(xv); g.push(gi);
          y.push((gi ? 10 - 0.8 * xv : 2 + 0.8 * xv) + 1.5 * gaussian(rnd));
        }
        var Xa = x.map(function (v, i2) { return [1, v, g[i2]]; });
        var ba = lsq(Xa, y);
        var Xi = x.map(function (v, i2) { return [1, v, g[i2], v * g[i2]]; });
        var bi = lsq(Xi, y);
        return { x: x, g: g, y: y, ba: ba, bi: bi, n: n };
      }
    }
  };

  /* ---------------- mount ---------------- */
  function mount(el, cfg) {
    cfg = cfg || {};
    var list = (cfg.modes && cfg.modes.length ? cfg.modes : [cfg.mode || 'link']).filter(function (k) { return MODES[k]; });
    if (!list.length) list = ['link'];
    var which = list[0];
    var seed = (cfg.seed == null ? 31 : +cfg.seed);
    var nOver = Math.max(12, +cfg.n || MODES.overfitting.n);
    // never let the polynomial interpolate the training set exactly: that makes the
    // training residual zero and the ratio below meaningless rather than dramatic
    var maxDeg = Math.max(2, Math.min(nOver - 3, +cfg.maxDegree || 15));
    var deg = Math.max(1, Math.min(maxDeg, +cfg.degree || 3));
    var cache = {};

    var P = palette(el);
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:' + P.panel + ';padding:16px 17px';
    el.innerHTML =
      (list.length > 1 ? '<div class="wf-seg" style="margin-bottom:11px"></div>' : '') +
      '<div class="wf-title" style="font:600 12.5px/1.5 IBM Plex Sans,sans-serif;color:' + P.mut + ';margin-bottom:8px"></div>' +
      '<div class="wf-ctl" style="margin-bottom:10px"></div>' +
      '<div class="wf-plot"></div>' +
      '<div class="wf-fail" style="margin:11px 0 0"></div>' +
      '<div class="wf-read" style="font:13px/1.6 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:10px 0 14px"></div>' +
      '<div class="wf-r"></div>';

    var segBox = el.querySelector('.wf-seg'), title = el.querySelector('.wf-title'),
        ctl = el.querySelector('.wf-ctl'), plot = el.querySelector('.wf-plot'),
        fail = el.querySelector('.wf-fail'), read = el.querySelector('.wf-read'),
        rbox = el.querySelector('.wf-r');

    if (segBox) {
      segBox.innerHTML = u.seg(list.map(function (k) { return { v: k, label: MODES[k].short }; }), which);
      u.wireSeg(segBox, function (v) { which = v; render(true); });
    }

    function data(key) {
      if (!cache[key]) {
        var M = MODES[key];
        cache[key] = M.build(Math.max(10, +cfg.n || M.n), seed);
      }
      return cache[key];
    }

    function render(rebuildCtl) {
      P = palette(el);
      el.style.background = P.panel; el.style.borderColor = P.line;
      title.style.color = P.mut; read.style.color = P.body;
      var M = MODES[which], D = data(which);
      title.textContent = M.title;

      if (rebuildCtl) {
        ctl.innerHTML = M.slider
          ? '<label style="display:block;font:600 12px IBM Plex Sans,sans-serif;color:' + P.mut + ';margin-bottom:4px">' +
            'Polynomial degree: <b class="wf-dv" style="color:' + P.ink + '">' + deg + '</b></label>' +
            '<input class="wf-deg" type="range" min="1" max="' + maxDeg + '" step="1" value="' + deg +
            '" aria-label="polynomial degree" style="width:100%;max-width:420px;display:block">'
          : '';
        var sl = ctl.querySelector('.wf-deg');
        if (sl) sl.addEventListener('input', function () { deg = +sl.value; render(false); });
      }
      var dv = ctl.querySelector('.wf-dv'); if (dv) { dv.textContent = deg; dv.style.color = P.ink; }

      var out = VIEW[which](D, P, deg);
      plot.innerHTML = out.svg;
      fail.innerHTML = callout(out.fail, P);
      read.innerHTML = out.read;
      // only rebuild the code panel when the mode changes: dragging the degree slider
      // must not wipe whatever the reader has typed or run
      if (rebuildCtl || !rbox.firstChild) rbox.innerHTML = u.runnable(RCODE[which](D), { label: 'Fit both models in R' });
    }

    var wasDark = isDark(el);
    if (window.MutationObserver) {
      var mo = new MutationObserver(function () {
        if (!document.contains(el)) { mo.disconnect(); return; }
        var now = isDark(el); if (now !== wasDark) { wasDark = now; render(true); }
      });
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    }
    render(true);
  }

  function callout(txt, P) {
    return '<div style="border-left:3px solid ' + P.bad + ';background:' + P.warn + ';border-radius:0 8px 8px 0;padding:9px 12px;' +
      'font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.ink + '">' + txt + '</div>';
  }

  /* ---------------- one drawing per mode ---------------- */
  var W = 520;
  function axes(P, m, iw, ih, xlab, ylab) {
    return '<line x1="' + m.l + '" y1="' + (m.t + ih) + '" x2="' + (m.l + iw) + '" y2="' + (m.t + ih) + '" stroke="' + P.line + '" stroke-width="1.5"/>' +
      '<line x1="' + m.l + '" y1="' + m.t + '" x2="' + m.l + '" y2="' + (m.t + ih) + '" stroke="' + P.line + '" stroke-width="1.5"/>' +
      '<text x="' + (m.l + iw / 2) + '" y="' + (m.t + ih + 26) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.mut + '">' + u.esc(xlab) + '</text>' +
      '<text transform="translate(11,' + (m.t + ih / 2) + ') rotate(-90)" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.mut + '">' + u.esc(ylab) + '</text>';
  }
  function wrap(g, H, label) {
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + u.esc(label) + '">' + g + '</svg>';
  }

  var VIEW = {
    link: function (D, P) {
      var m = { l: 42, r: 16, t: 14 }, iw = W - m.l - m.r, ih = 190, H = 236;
      var lo = -0.45, hi = 1.45;
      function sx(v) { return m.l + (v + 3) / 6 * iw; }
      function sy(v) { return m.t + (hi - v) / (hi - lo) * ih; }
      var g = '';
      g += '<rect x="' + m.l + '" y="' + m.t + '" width="' + iw + '" height="' + (sy(1) - m.t).toFixed(1) + '" fill="' + P.warn + '"/>' +
           '<rect x="' + m.l + '" y="' + sy(0).toFixed(1) + '" width="' + iw + '" height="' + (m.t + ih - sy(0)).toFixed(1) + '" fill="' + P.warn + '"/>' +
           '<text x="' + (m.l + 6) + '" y="' + (m.t + 12) + '" font-family="IBM Plex Sans,sans-serif" font-size="9.5" fill="' + P.bad + '">a probability cannot live up here</text>' +
           '<text x="' + (m.l + 6) + '" y="' + (m.t + ih - 5) + '" font-family="IBM Plex Sans,sans-serif" font-size="9.5" fill="' + P.bad + '">or down here</text>';
      [0, 0.5, 1].forEach(function (v) {
        g += '<line x1="' + m.l + '" y1="' + sy(v).toFixed(1) + '" x2="' + (m.l + iw) + '" y2="' + sy(v).toFixed(1) + '" stroke="' + P.grid + '"/>' +
             '<text x="' + (m.l - 6) + '" y="' + (sy(v) + 3).toFixed(1) + '" text-anchor="end" font-family="IBM Plex Mono,monospace" font-size="9" fill="' + P.mut + '">' + v + '</text>';
      });
      D.x.forEach(function (v, i) {
        g += '<circle cx="' + sx(v).toFixed(1) + '" cy="' + sy(D.y[i]).toFixed(1) + '" r="2.6" fill="' + P.mut + '" fill-opacity="0.42"/>';
      });
      var pl = [], pg = [], t;
      for (t = -3; t <= 3.0001; t += 0.05) {
        pl.push(sx(t).toFixed(1) + ',' + sy(D.lin[0] + D.lin[1] * t).toFixed(1));
        pg.push(sx(t).toFixed(1) + ',' + sy(logistic(D.log[0] + D.log[1] * t)).toFixed(1));
      }
      g += '<polyline points="' + pg.join(' ') + '" fill="none" stroke="' + P.acc + '" stroke-width="2.4"/>' +
           '<polyline points="' + pl.join(' ') + '" fill="none" stroke="' + P.bad + '" stroke-width="2.4" stroke-dasharray="6 3"/>' +
           '<text x="' + (m.l + iw - 4) + '" y="' + (sy(0.5) - 8) + '" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.acc + '">logistic</text>' +
           '<text x="' + (m.l + iw - 4) + '" y="' + (sy(0.5) + 14) + '" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.bad + '">linear model</text>' +
           axes(P, m, iw, ih, 'predictor', 'outcome (0 or 1)');
      return {
        svg: wrap(g, H, 'a linear model and a logistic model fitted to a binary outcome'),
        fail: '<b>' + D.bad + ' of ' + D.n + '</b> fitted values from the linear model are impossible probabilities ' +
          '(lowest ' + D.worstLo.toFixed(2) + ', highest ' + D.worstHi.toFixed(2) + '). Ask it for the probability at x = ' + D.outX +
          ', one step past the data, and it answers <b>' + D.outLin.toFixed(2) + '</b>. The logistic model answers ' + D.outLog.toFixed(2) + '.',
        read: 'The straight line has to keep going. A probability cannot, so the model is forced to state things that have no meaning, ' +
          'and it is worst exactly where the reviewer will look, at the two ends. The logistic curve is the same idea with a link that respects the range: ' +
          'it bends and flattens instead of walking off the chart. Nothing was lost by switching, and the fitted values are now interpretable.'
      };
    },

    'zero-inflation': function (D, P) {
      var m = { l: 42, r: 16, t: 22 }, iw = W - m.l - m.r, ih = 180, H = 234;
      var K = Math.min(12, D.maxC), i, j;
      var obs = new Array(K + 1), exp = new Array(K + 1);
      for (i = 0; i <= K; i++) { obs[i] = 0; exp[i] = 0; }
      for (i = 0; i < D.n; i++) obs[Math.min(K, D.y[i])]++;
      for (i = 0; i < D.n; i++) {
        var mu = Math.exp(D.b[0] + D.b[1] * D.x[i]), pk = Math.exp(-mu), acc = 0;
        for (j = 0; j <= K; j++) { exp[j] += pk; acc += pk; pk = pk * mu / (j + 1); }
        exp[K] += 1 - acc;                                       // pile the tail into the last bar
      }
      var top = Math.max(Math.max.apply(null, obs), Math.max.apply(null, exp)) * 1.14;
      var bw = iw / (K + 1);
      function sy(v) { return m.t + (1 - v / top) * ih; }
      var g = '';
      [0, top / 2, top].forEach(function (v) {
        g += '<line x1="' + m.l + '" y1="' + sy(v).toFixed(1) + '" x2="' + (m.l + iw) + '" y2="' + sy(v).toFixed(1) + '" stroke="' + P.grid + '"/>' +
             '<text x="' + (m.l - 6) + '" y="' + (sy(v) + 3).toFixed(1) + '" text-anchor="end" font-family="IBM Plex Mono,monospace" font-size="9" fill="' + P.mut + '">' + Math.round(v) + '</text>';
      });
      for (i = 0; i <= K; i++) {
        var x0 = m.l + bw * i;
        g += '<rect x="' + (x0 + bw * 0.14).toFixed(1) + '" y="' + sy(obs[i]).toFixed(1) + '" width="' + (bw * 0.72).toFixed(1) +
             '" height="' + (m.t + ih - sy(obs[i])).toFixed(1) + '" rx="2" fill="' + P.mut + '" fill-opacity="0.34"/>' +
             '<rect x="' + (x0 + bw * 0.28).toFixed(1) + '" y="' + sy(exp[i]).toFixed(1) + '" width="' + (bw * 0.44).toFixed(1) +
             '" height="' + (m.t + ih - sy(exp[i])).toFixed(1) + '" rx="2" fill="none" stroke="' + P.bad + '" stroke-width="1.8"/>' +
             '<text x="' + (x0 + bw / 2).toFixed(1) + '" y="' + (m.t + ih + 13) + '" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="8.5" fill="' + P.mut + '">' +
             (i === K ? i + '+' : i) + '</text>';
      }
      g += '<text x="' + m.l + '" y="12" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">solid = the data</text>' +
           '<text x="' + (m.l + iw) + '" y="12" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.bad + '">outline = what the Poisson model expects</text>' +
           axes(P, m, iw, ih, 'count', 'how many cases');
      return {
        svg: wrap(g, H, 'observed counts against the counts a Poisson model expects'),
        fail: 'The data contain <b>' + D.obsZero + ' zeros</b>. The Poisson model expects <b>' + D.expZero.toFixed(0) + '</b>. ' +
          'That gap is the model telling you it has the wrong shape.',
        read: 'A Poisson distribution has one parameter, so its mean fixes how many zeros it can produce. Here the zeros come from two different places: ' +
          Math.round(100 * D.pZero) + '% of the cases could never have had a positive count at all, and the rest could and sometimes did not. ' +
          'One parameter cannot describe two processes, so the model splits the difference: it overstates the low counts it can reach and understates the zeros. ' +
          'Fit a zero-inflated or a hurdle model and the two processes get a parameter each.'
      };
    },

    ordinal: function (D, P) {
      var m = { l: 42, r: 16, t: 16 }, iw = W - m.l - m.r, ih = 176, H = 226;
      var lo = 0.4, hi = 5.9;
      function sx(v) { return m.l + (v + 2) / 4 * iw; }
      function sy(v) { return m.t + (hi - v) / (hi - lo) * ih; }
      var g = '', i, j;
      [1, 2, 3, 4, 5].forEach(function (v) {
        g += '<line x1="' + m.l + '" y1="' + sy(v).toFixed(1) + '" x2="' + (m.l + iw) + '" y2="' + sy(v).toFixed(1) + '" stroke="' + P.grid + '"/>' +
             '<text x="' + (m.l - 6) + '" y="' + (sy(v) + 3).toFixed(1) + '" text-anchor="end" font-family="IBM Plex Mono,monospace" font-size="9" fill="' + P.mut + '">' + v + '</text>';
      });
      // observed distribution in five slices of x, drawn as stacked proportions
      var bins = 5, cnt = [];
      for (i = 0; i < bins; i++) { cnt.push([0, 0, 0, 0, 0]); }
      for (i = 0; i < D.n; i++) {
        var b = Math.min(bins - 1, Math.floor((D.x[i] + 2) / 4 * bins));
        cnt[b][D.y[i] - 1]++;
      }
      for (i = 0; i < bins; i++) {
        var tot = cnt[i].reduce(function (a, c) { return a + c; }, 0) || 1;
        var x0 = m.l + iw * i / bins + iw / bins * 0.16, wdt = iw / bins * 0.68, yTop = m.t + 6;
        for (j = 4; j >= 0; j--) {
          var frac = cnt[i][j] / tot, hgt = frac * (ih - 12);
          g += '<rect x="' + x0.toFixed(1) + '" y="' + yTop.toFixed(1) + '" width="' + wdt.toFixed(1) + '" height="' + hgt.toFixed(1) +
               '" fill="' + P.c0 + '" fill-opacity="' + (0.16 + 0.19 * j).toFixed(2) + '"/>';
          if (frac > 0.12) g += '<text x="' + (x0 + wdt / 2).toFixed(1) + '" y="' + (yTop + hgt / 2 + 3).toFixed(1) +
               '" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="9" fill="' + P.ink + '">' + (j + 1) + '</text>';
          yTop += hgt;
        }
      }
      var pl = [], t;
      for (t = -2; t <= 2.0001; t += 0.08) pl.push(sx(t).toFixed(1) + ',' + sy(D.lin[0] + D.lin[1] * t).toFixed(1));
      g += '<polyline points="' + pl.join(' ') + '" fill="none" stroke="' + P.bad + '" stroke-width="2.4" stroke-dasharray="6 3"/>' +
           '<text x="' + (m.l + iw - 4) + '" y="' + (sy(D.predHi) - 8).toFixed(1) + '" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.bad + '">the numeric model</text>' +
           '<text x="' + m.l + '" y="' + (m.t + ih + 25) + '" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">bars: what people actually answered in each slice of x</text>' +
           axes(P, m, iw, ih, 'predictor', 'rating, 1 to 5');
      return {
        svg: wrap(g, H, 'a straight line fitted to a five-point rating, against the observed answers'),
        fail: 'The line predicts <b>' + D.predLo.toFixed(2) + '</b> at the bottom of the range and <b>' + D.predHi.toFixed(2) +
          '</b> at the top. Nobody gave those answers, because nobody could. Push it one step past the data, to x = ' + D.outX +
          ', and it predicts <b>' + D.predOut.toFixed(2) + '</b>, which is off the scale entirely. ' +
          'It also treats the step from 1 to 2 as equal to the step from 4 to 5; in the process behind this data they are <b>' +
          D.gaps[0].toFixed(1) + '</b> and <b>' + D.gaps[2].toFixed(1) + '</b>.',
        read: 'Rating scales are ordered, not spaced. The numbers 1 to 5 are labels for a ranking, and arithmetic on labels invents a measurement that was never taken. ' +
          'Averaging them assumes every step is the same size, which is exactly the assumption the data violate here. ' +
          'An ordered logistic model estimates one slope and lets the category boundaries sit wherever the data put them, which is the honest version of the same question.'
      };
    },

    overfitting: function (D, P, deg) {
      var F = MODES.overfitting.refit(D, deg);
      var m = { l: 42, r: 16, t: 14 }, iw = W - m.l - m.r, ih = 186, H = 232;
      var lo = -2.2, hi = 2.2;
      function sx(v) { return m.l + (v + 1.05) / 2.1 * iw; }
      function sy(v) { return m.t + (hi - Math.max(lo, Math.min(hi, v))) / (hi - lo) * ih; }
      var g = '', t;
      [-2, -1, 0, 1, 2].forEach(function (v) {
        g += '<line x1="' + m.l + '" y1="' + sy(v).toFixed(1) + '" x2="' + (m.l + iw) + '" y2="' + sy(v).toFixed(1) + '" stroke="' + P.grid + '"/>' +
             '<text x="' + (m.l - 6) + '" y="' + (sy(v) + 3).toFixed(1) + '" text-anchor="end" font-family="IBM Plex Mono,monospace" font-size="9" fill="' + P.mut + '">' + v + '</text>';
      });
      var truth = [], curve = [];
      for (t = -1.05; t <= 1.0501; t += 0.01) {
        truth.push(sx(t).toFixed(1) + ',' + sy(Math.sin(2.3 * t)).toFixed(1));
        curve.push(sx(t).toFixed(1) + ',' + sy(evalp(F.b, t)).toFixed(1));
      }
      g += '<polyline points="' + truth.join(' ') + '" fill="none" stroke="' + P.acc + '" stroke-width="1.8" stroke-dasharray="4 3"/>';
      D.xte.forEach(function (v, i) { g += '<circle cx="' + sx(v).toFixed(1) + '" cy="' + sy(D.yte[i]).toFixed(1) + '" r="3" fill="none" stroke="' + P.c1 + '" stroke-width="1.4"/>'; });
      D.xtr.forEach(function (v, i) { g += '<circle cx="' + sx(v).toFixed(1) + '" cy="' + sy(D.ytr[i]).toFixed(1) + '" r="3.2" fill="' + P.c0 + '" fill-opacity="0.85"/>'; });
      g += '<polyline points="' + curve.join(' ') + '" fill="none" stroke="' + P.bad + '" stroke-width="2.4"/>' +
           '<text x="' + m.l + '" y="' + (m.t + 11) + '" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.c0 + '">filled = training data</text>' +
           '<text x="' + (m.l + iw) + '" y="' + (m.t + 11) + '" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.c1 + '">hollow = held out</text>' +
           axes(P, m, iw, ih, 'predictor', 'outcome');
      var ratio = F.rmseTr > 1e-9 ? F.rmseTe / F.rmseTr : Infinity;
      var offChart = false, tt;
      for (tt = -1.05; tt <= 1.0501; tt += 0.02) if (Math.abs(evalp(F.b, tt)) > hi) offChart = true;
      return {
        svg: wrap(g, H, 'a polynomial fitted at the chosen degree, with training and held-out points'),
        fail: 'Training R-squared <b>' + F.r2.toFixed(3) + '</b>. Error on the held-out points is <b>' +
          (isFinite(ratio) ? ratio.toFixed(1) + 'x' : 'unbounded') + '</b> the training error (' +
          F.rmseTe.toFixed(2) + ' against ' + F.rmseTr.toFixed(2) + ').' +
          (offChart ? ' The fitted curve runs off the top of the chart between the training points.' : ''),
        read: 'Every extra term can only improve the training fit, so R-squared rising is not evidence of anything. ' +
          'Watch the hollow points instead: they were never shown to the model, and they are the only honest test of whether it learned the pattern or the noise. ' +
          (deg <= 4 ? 'At this degree the curve is still tracking the real shape (dashed).'
                    : 'At this degree the curve is chasing individual training points, and it swings hardest where the data are thinnest.')
      };
    },

    interaction: function (D, P) {
      var m = { l: 42, r: 16, t: 14 }, iw = W - m.l - m.r, ih = 190, H = 236;
      var lo = -2, hi = 14;
      function sx(v) { return m.l + v / 10 * iw; }
      function sy(v) { return m.t + (hi - Math.max(lo, Math.min(hi, v))) / (hi - lo) * ih; }
      var g = '', t;
      [0, 4, 8, 12].forEach(function (v) {
        g += '<line x1="' + m.l + '" y1="' + sy(v).toFixed(1) + '" x2="' + (m.l + iw) + '" y2="' + sy(v).toFixed(1) + '" stroke="' + P.grid + '"/>' +
             '<text x="' + (m.l - 6) + '" y="' + (sy(v) + 3).toFixed(1) + '" text-anchor="end" font-family="IBM Plex Mono,monospace" font-size="9" fill="' + P.mut + '">' + v + '</text>';
      });
      D.x.forEach(function (v, i) {
        g += '<circle cx="' + sx(v).toFixed(1) + '" cy="' + sy(D.y[i]).toFixed(1) + '" r="2.8" fill="' + (D.g[i] ? P.c1 : P.c0) + '" fill-opacity="0.55"/>';
      });
      function line(b, gi, col, dash) {
        var a = b[0] + (b[2] || 0) * gi, s = b[1] + (b.length > 3 ? b[3] * gi : 0);
        return '<line x1="' + sx(0).toFixed(1) + '" y1="' + sy(a).toFixed(1) + '" x2="' + sx(10).toFixed(1) + '" y2="' + sy(a + 10 * s).toFixed(1) +
          '" stroke="' + col + '" stroke-width="2.4"' + (dash ? ' stroke-dasharray="6 3"' : '') + '/>';
      }
      g += line(D.ba, 0, P.bad, true) + line(D.ba, 1, P.bad, true) + line(D.bi, 0, P.c0, false) + line(D.bi, 1, P.c1, false);
      g += '<text x="' + (m.l + 6) + '" y="' + (m.t + 12) + '" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.bad + '">dashed = additive model (parallel by construction)</text>' +
           axes(P, m, iw, ih, 'predictor', 'outcome');
      var sA = D.bi[1], sB = D.bi[1] + D.bi[3];
      return {
        svg: wrap(g, H, 'two groups with opposite slopes, fitted with and without an interaction'),
        fail: 'The additive model reports one slope of <b>' + D.ba[1].toFixed(2) + '</b> for the predictor. ' +
          'With the interaction in, the slope is <b>' + sA.toFixed(2) + '</b> in one group and <b>' + sB.toFixed(2) + '</b> in the other.',
        read: 'An additive model can give the two groups different heights but not different directions: the two dashed lines are parallel because the model has no term that could make them anything else. ' +
          'So it averages a rise and a fall and reports roughly nothing. The correct sentence is not that the predictor has no effect. It is that the effect depends on the group, which is a finding, and the model without the interaction term cannot express it.'
      };
    }
  };

  /* ---------------- runnable R, one per mode ----------------
     Each block regenerates data with the same structure and fits both models. */
  var RCODE = {
    link: function (D) {
      return [
        '# A yes/no outcome, fitted the wrong way and then the right way.',
        'set.seed(9)',
        'n <- ' + D.n,
        'x <- runif(n, -3, 3)',
        'y <- rbinom(n, 1, plogis(1.4 * x))',
        '',
        'lin <- lm(y ~ x)                       # the wrong family',
        'log <- glm(y ~ x, family = binomial)   # the right one',
        '',
        'p_lin <- fitted(lin)',
        'c(impossible = sum(p_lin < 0 | p_lin > 1),',
        '  lowest     = round(min(p_lin), 3),',
        '  highest    = round(max(p_lin), 3))',
        '',
        'range(fitted(log))                     # a probability model stays inside 0 and 1'
      ].join('\n');
    },
    'zero-inflation': function (D) {
      return [
        '# Counts with a pile of structural zeros, fitted as ordinary Poisson.',
        'set.seed(9)',
        'n <- ' + D.n,
        'x <- rnorm(n)',
        'y <- ifelse(runif(n) < ' + D.pZero + ', 0, rpois(n, exp(0.9 + 0.7 * x)))',
        '',
        'm <- glm(y ~ x, family = poisson)',
        'mu <- fitted(m)',
        '',
        'c(observed_zeros = sum(y == 0),',
        '  expected_zeros = round(sum(dpois(0, mu)), 1),',
        '  poisson_slope  = round(unname(coef(m)[2]), 3),',
        '  true_slope     = 0.7)',
        '',
        '# a zero-inflated model gives the two processes a parameter each',
        '# install.packages("pscl"); pscl::zeroinfl(y ~ x | 1)'
      ].join('\n');
    },
    ordinal: function (D) {
      return [
        '# A five-point rating, treated as a number and then as what it is.',
        'set.seed(9)',
        'n <- ' + D.n,
        'x  <- runif(n, -2, 2)',
        'z  <- 1.1 * x + rlogis(n)',
        'y  <- cut(z, c(-Inf, ' + D.cuts.join(', ') + ', Inf), labels = 1:5)',
        'yn <- as.numeric(as.character(y))       # the mistake: a label used as a quantity',
        '',
        'lin <- lm(yn ~ x)',
        'round(predict(lin, data.frame(x = c(-2, 2))), 2)   # answers nobody can give',
        '',
        'table(y)',
        'diff(c(' + D.cuts.join(', ') + '))                  # the real gaps between categories',
        '',
        '# the honest model: one slope, boundaries wherever the data put them',
        'summary(MASS::polr(y ~ x, Hess = TRUE))'
      ].join('\n');
    },
    overfitting: function (D) {
      return [
        '# Flexibility that improves the training fit and nothing else.',
        'set.seed(9)',
        'n <- ' + D.n + '; deg <- 12',
        'xtr <- seq(-1, 1, length.out = n); ytr <- sin(2.3 * xtr) + rnorm(n, sd = 0.28)',
        'xte <- runif(n, -1, 1);            yte <- sin(2.3 * xte) + rnorm(n, sd = 0.28)',
        '',
        'fit  <- lm(ytr ~ poly(xtr, deg, raw = TRUE))',
        'pred <- function(x) as.numeric(cbind(1, outer(x, 1:deg, "^")) %*% coef(fit))',
        '',
        'round(c(train_r2   = summary(fit)$r.squared,',
        '        train_rmse = sqrt(mean((ytr - pred(xtr))^2)),',
        '        test_rmse  = sqrt(mean((yte - pred(xte))^2))), 3)',
        '',
        '# raise deg and run it again: train_r2 only ever goes up',
        '# test_rmse is the number that tells you when to stop'
      ].join('\n');
    },
    interaction: function (D) {
      return [
        '# Two groups whose slopes point in opposite directions.',
        'set.seed(9)',
        'n <- ' + D.n,
        'x <- runif(n, 0, 10)',
        'g <- rep(0:1, length.out = n)',
        'y <- ifelse(g == 1, 10 - 0.8 * x, 2 + 0.8 * x) + rnorm(n, sd = 1.5)',
        '',
        'add <- lm(y ~ x + g)        # no interaction: the lines must stay parallel',
        'int <- lm(y ~ x * g)        # the slope is allowed to differ by group',
        '',
        'round(c(additive_slope = unname(coef(add)["x"]),',
        '        slope_group0   = unname(coef(int)["x"]),',
        '        slope_group1   = unname(coef(int)["x"] + coef(int)["x:g"])), 3)',
        '',
        'anova(add, int)             # is the extra term earning its place?'
      ].join('\n');
    }
  };

  window.LessonWidgets.register('wrong-family-fit', mount);
})();
