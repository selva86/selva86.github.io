/* acf-pacf-calculator-ui.js - UI engine for tools/acf-pacf-calculator.html.
   All displayed numbers come from AcfPacfMath (verified against R 4.6.0
   stats::acf / pacf / diff / Box.test). This file only parses, renders and
   phrases; it computes nothing statistical of its own.

   Presets are spliced in programmatically from the R truth table by
   Scripts/tool-truth/splice-acf-presets.py - never hand-typed - so the demo
   series on the page are byte-identical to the vectors R was verified on. */
(function () {
  'use strict';

  var M = window.AcfPacfMath;
  var $ = function (id) { return document.getElementById(id); };

  // ===== preset series (spliced from Scripts/tool-truth/acf-pacf-calculator.json) =====
  var PRESETS = /*__PRESETS_START__*/{
    air: [112,118,132,129,121,135,148,148,136,119,104,118,115,126,141,135,125,149,170,170,158,133,114,140,145,150,178,163,172,178,199,199,184,162,146,166,171,180,193,181,183,218,230,242,209,191,172,194,196,196,236,235,229,243,264,272,237,211,180,201,204,188,235,227,234,264,302,293,259,229,203,229,242,233,267,269,270,315,364,347,312,274,237,278,284,277,317,313,318,374,413,405,355,306,271,306,315,301,356,348,355,422,465,467,404,347,305,336,340,318,362,348,363,435,491,505,404,359,310,337,360,342,406,396,420,472,548,559,463,407,362,405,417,391,419,461,472,535,622,606,508,461,390,432],
    lynx: [269,321,585,871,1475,2821,3928,5943,4950,2577,523,98,184,279,409,2285,2685,3409,1824,409,151,45,68,213,546,1033,2129,2536,957,361,377,225,360,731,1638,2725,2871,2119,684,299,236,245,552,1623,3311,6721,4254,687,255,473,358,784,1594,1676,2251,1426,756,299,201,229,469,736,2042,2811,4431,2511,389,73,39,49,59,188,377,1292,4031,3495,587,105,153,387,758,1307,3465,6991,6313,3794,1836,345,382,808,1388,2713,3800,3091,2985,3790,674,81,80,108,229,399,1132,2432,3574,2935,1537,529,485,662,1000,1590,2657,3396],
    nile: [1120,1160,963,1210,1160,1160,813,1230,1370,1140,995,935,1110,994,1020,960,1180,799,958,1140,1100,1210,1150,1250,1260,1220,1030,1100,774,840,874,694,940,833,701,916,692,1020,1050,969,831,726,456,824,702,1120,1100,832,764,821,768,845,864,862,698,845,744,796,1040,759,781,865,845,944,984,897,822,1010,771,676,649,846,812,742,801,1040,860,874,848,890,744,749,838,1050,918,986,797,923,975,815,1020,906,901,1170,912,746,919,718,714,740],
    ar1: [68.554,65.527,43.965,55.507,46.177,41.333,36.154,45.686,43.201,48.095,35.548,32.358,28.778,45.818,57.023,58.444,47.176,50.942,57.317,46.608,54.121,44.539,34.232,41.983,41.718,51.689,40.242,41.839,43.021,56.004,54.194,45.497,49.637,50.333,52.954,73.829,75.219,72.978,69.709,65.71,64.838,69.662,74.347,83.862,73.183,70.662,67.297,65.511,72.671,63.233,76.524,85.114,75.968,70.226,50.13,54.169,36.566,58.672,50.253,64.161,64.151,42.934,53.387,59.193,51.576,41.463,13.974,6.179,17.176,17.385,30.11,29.16,38.852,40.568,47.418,35.961,66.853,60.085,75.919,67.28,37.161,44.112,35.346,51.621,34.043,44.024,60.537,64.539,45.038,55.037,51.069,48.271,52.704,48.613,37.519,39.959,50.942,62.857,57.517,50.841,50.736,40.276,21.455,9.806,29.603,45.175,39.76,34.295,50.427,49.629,49.826,40.946,53.641,68.093,70.276,70.628,77.305,60.739,50.797,43.757],
    ma1: [54.981,65.671,45.969,23.07,61.034,66.788,50.998,40.565,34.898,36.893,43.753,56.536,63.842,56.131,45.586,25.947,26.959,54.497,72.149,50.717,40.054,38.297,28.968,41.105,34.668,26.056,42.284,67.67,64.899,62.737,44.436,37.294,37.019,30.518,47.771,58.79,57.825,50.488,49.406,51.347,81.869,70.069,71.902,83.853,41.564,33.286,46.145,45.65,55.984,57.311,64.313,67.637,65.341,60.866,58.115,67.584,50.261,32.647,53.047,53.902,54.74,77.295,66.673,29.415,38.539,35.18,37.896,27.916,33.905,50.795,34.508,36.584,34.5,42.361,59.487,56.76,51.034,43.611,57.624,76.75,58.117,47.758,54.097,66.844,52.155,60.647,51.707,37.366,48.74,46.671,56.731,75.446,77.943,62.781,48.529,71.584,89.75,61.673,64.074,51.905,26.701,35.355,59.195,67.651,51.69,32.853,28.356,46.294,61.619,62.023,76.431,65.977,48.213,52.113,46.208,31.988,31.014,53.062,58.17,43.291],
    wn: [69.522,16.908,43.769,39.624,47.221,45.138,57.724,59.592,59.557,46.797,42.743,43.742,55.918,50.032,59.312,61.31,42.752,39.472,52.213,59.46,47.944,48.553,71.672,42.178,55.553,42.509,50.511,43.079,70.737,54.989,35.915,44.685,47.336,53.045,55.42,47.15,43.81,60.286,38.645,52.751,50.652,40.075,42.728,40.189,53.109,38.261,55.217,44.518,32.594,48.772,37.188,56.978,40.517,49.634,51.983,43.79,63.138,69.159,65.94,53.093,52.655,38.004,46.284,59.822,64.277,40.927,53.78,60.263,67.961,34.356,54.7,45.538,56.126,46.675,62.178,52.008,35.135,55.596,43.148,32.928,63.021,50.743,48.549,64.031,34.659,41.95,53.148,66.882,42.845,49.961,47.593,47.742,56.219,39.616,53.135,52.198,46.095,60.973,53.76,61.43,50.339,52.222,45.276,62.001,57.058,55.796,56.909,42.802,64.837,47.102,62.46,71.793,67.682,48.106,65.657,36.728,65.437,43.297,42.901,59.471]
  }/*__PRESETS_END__*/;

  var PRESET_META = {
    air:  { label: 'AirPassengers', rExpr: 'as.numeric(AirPassengers)',
            note: 'Monthly airline passengers 1949-1960: trend plus a hard 12-month season.' },
    lynx: { label: 'lynx', rExpr: 'as.numeric(lynx)',
            note: 'Annual Canadian lynx trappings 1821-1934: a strong ~10-year cycle.' },
    nile: { label: 'Nile', rExpr: 'as.numeric(Nile)',
            note: 'Annual Nile flow 1871-1970, with a level shift around 1899.' },
    ar1:  { label: 'AR(1) sim', rExpr: null,
            note: 'Simulated AR(1) with phi = 0.7: the textbook PACF cutoff at lag 1.' },
    ma1:  { label: 'MA(1) sim', rExpr: null,
            note: 'Simulated MA(1) with theta = 0.8: the textbook ACF cutoff at lag 1.' },
    wn:   { label: 'White noise', rExpr: null,
            note: 'Independent draws: nothing to model, and the plots should say so.' }
  };

  var state = {
    transform: 'none', ci: 0.95, lagMax: null, period: 12,
    showLag0: true, bartlett: false, preset: 'air'
  };

  // ===== parsing ============================================================
  // Accepts: one value per line; "time value" or "time,value" rows (the value
  // is the last numeric cell); or a whole series on one line, comma separated.
  // Commas are ALWAYS separators here, never thousands groupers - otherwise a
  // pasted "112, 118, 132" collapses into a single number.
  function parseSeries(text) {
    var lines = String(text || '').split(/\r?\n/).map(function (s) { return s.trim(); })
      .filter(function (s) { return s.length; });
    if (!lines.length) return { values: [], skippedHeader: false, twoCol: false };

    var skippedHeader = false;
    var cells0 = splitCells(lines[0]);
    if (cells0.length && !cells0.some(isNum)) { lines.shift(); skippedHeader = true; }
    if (!lines.length) return { values: [], skippedHeader: skippedHeader, twoCol: false };

    // A whole series pasted on one or two lines with many cells.
    var allCells = [], perLine = [];
    for (var i = 0; i < lines.length; i++) {
      var c = splitCells(lines[i]);
      perLine.push(c);
      allCells = allCells.concat(c);
    }
    var maxCells = 0;
    perLine.forEach(function (c) { if (c.length > maxCells) maxCells = c.length; });

    if (lines.length <= 2 && allCells.length > 2) {
      return { values: allCells.filter(isNum).map(Number), skippedHeader: skippedHeader, twoCol: false };
    }

    var vals = [], twoCol = maxCells >= 2;
    for (var j = 0; j < perLine.length; j++) {
      var cells = perLine[j].filter(function (c) { return c.length; });
      if (!cells.length) continue;
      if (cells.length === 1) { if (isNum(cells[0])) vals.push(Number(cells[0])); continue; }
      // time,value rows: take the LAST numeric cell (the value column)
      for (var k = cells.length - 1; k >= 0; k--) {
        if (isNum(cells[k])) { vals.push(Number(cells[k])); break; }
      }
    }
    return { values: vals, skippedHeader: skippedHeader, twoCol: twoCol };
  }
  function splitCells(line) {
    return line.split(/[\t;,]|\s+/).map(function (s) { return s.trim(); })
      .filter(function (s) { return s.length; });
  }
  function isNum(s) { return /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(s); }

  // ===== formatting =========================================================
  function f3(v) { return (v === null || v === undefined || !isFinite(v)) ? 'n/a' : v.toFixed(3); }
  function fp(p) {
    if (!isFinite(p)) return 'n/a';
    if (p < 0.001) return '< 0.001';
    return p.toFixed(3);
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }
  function plural(n, one, many) { return n === 1 ? one : (many || one + 's'); }

  // ===== correlogram ========================================================
  // Stems + the significance band, drawn the way R's plot.acf draws it.
  function correlogram(vals, startLag, band, bartlett, label, useBart) {
    var W = 640, H = 200, padL = 42, padR = 12, padT = 12, padB = 28;
    var n = vals.length;
    if (!n) return '';
    var innerW = W - padL - padR, innerH = H - padT - padB;
    // R (plot.acf): ylim <- range(c(-clim, clim, acf)). A fixed -1..1 window
    // would squash a decaying ACF into the top quarter and shrink the band to an
    // invisible sliver, so follow R and let the data set the range.
    var lo = -band, hi = band, i;
    for (i = 0; i < n; i++) {
      var b0 = useBart && bartlett ? bartlett[startLag + i] : band;
      lo = Math.min(lo, vals[i], -b0);
      hi = Math.max(hi, vals[i], b0);
    }
    var padY = Math.max(0.04, (hi - lo) * 0.06);
    var ymax = Math.min(1.06, hi + padY), ymin = Math.max(-1.06, lo - padY);
    if (ymax - ymin < 0.25) { ymax += 0.1; ymin -= 0.1; }   // guard a flat window
    // Coordinates are rounded to 0.1px: full float precision costs several KB of
    // rendered markup per chart and buys nothing at screen resolution.
    function rnd(v) { return Math.round(v * 10) / 10; }
    function X(i) { return rnd(padL + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW)); }
    function Y(v) { return rnd(padT + innerH * (1 - (v - ymin) / (ymax - ymin))); }
    var s = [];
    s.push('<svg viewBox="0 0 ' + W + ' ' + H + '" class="cgram" role="img" aria-label="' + esc(label) + '">');
    // band ribbon
    if (useBart && bartlett) {
      var up = [], dn = [];
      for (var b = 0; b < n; b++) {
        var bb = bartlett[startLag + b];
        up.push(X(b) + ',' + Y(Math.min(bb, ymax)));
        dn.push(X(b) + ',' + Y(Math.max(-bb, ymin)));
      }
      s.push('<polyline class="cg-bandline" points="' + up.join(' ') + '"/>');
      s.push('<polyline class="cg-bandline" points="' + dn.join(' ') + '"/>');
    } else {
      s.push('<rect class="cg-band" x="' + padL + '" y="' + Y(band) + '" width="' + innerW + '" height="' + Math.max(0.5, Y(-band) - Y(band)) + '"/>');
      s.push('<line class="cg-bandline" x1="' + padL + '" y1="' + Y(band) + '" x2="' + (W - padR) + '" y2="' + Y(band) + '"/>');
      s.push('<line class="cg-bandline" x1="' + padL + '" y1="' + Y(-band) + '" x2="' + (W - padR) + '" y2="' + Y(-band) + '"/>');
    }
    // zero axis
    s.push('<line class="cg-axis" x1="' + padL + '" y1="' + Y(0) + '" x2="' + (W - padR) + '" y2="' + Y(0) + '"/>');
    // y ticks: step with the (data-driven) range so a zoomed chart still gets
    // labels instead of a lone 0.
    var span = ymax - ymin;
    var tstep = span > 1.2 ? 0.5 : (span > 0.6 ? 0.25 : (span > 0.3 ? 0.1 : 0.05));
    var t0 = Math.ceil(ymin / tstep) * tstep;
    for (var t = t0; t <= ymax + 1e-9; t += tstep) {
      var tv = Math.abs(t) < 1e-9 ? 0 : Math.round(t * 100) / 100;
      s.push('<text class="cg-tick" x="' + (padL - 7) + '" y="' + (Y(tv) + 3.5) + '" text-anchor="end">' + tv + '</text>');
    }
    // stems
    for (var k = 0; k < n; k++) {
      var v = vals[k], lag = startLag + k;
      var lim = useBart && bartlett ? bartlett[lag] : band;
      var sig = lag > 0 && Math.abs(v) > lim;
      var cls = lag === 0 ? 'cg-stem cg-lag0' : (sig ? 'cg-stem cg-sig' : 'cg-stem');
      s.push('<line class="' + cls + '" x1="' + X(k) + '" y1="' + Y(0) + '" x2="' + X(k) + '" y2="' + Y(v) + '"><title>lag ' + lag + ': ' + f3(v) + '</title></line>');
      s.push('<circle class="' + cls.replace('cg-stem', 'cg-dot') + '" cx="' + X(k) + '" cy="' + Y(v) + '" r="2.4"/>');
    }
    // x ticks: keep them readable at any lag.max
    var step = n <= 12 ? 1 : (n <= 26 ? 2 : Math.ceil(n / 12));
    for (var t2 = 0; t2 < n; t2 += step) {
      s.push('<text class="cg-tick" x="' + X(t2) + '" y="' + (H - 9) + '" text-anchor="middle">' + (startLag + t2) + '</text>');
    }
    s.push('<text class="cg-axlabel" x="' + (padL + innerW / 2) + '" y="' + (H - 0.5) + '" text-anchor="middle">Lag</text>');
    s.push('</svg>');
    return s.join('');
  }

  // ===== R code =============================================================
  function rCode(r, values) {
    var meta = PRESET_META[state.preset];
    var pristine = state.preset && meta && isPristine();
    var xline;
    if (pristine && meta.rExpr) {
      xline = 'x <- ' + meta.rExpr + '   # ' + values.length + ' observations';
    } else {
      xline = 'x <- c(' + values.join(', ') + ')';
    }
    var L = [];
    L.push('# ' + (pristine && meta ? meta.label + ': ' : '') + 'sample ACF and PACF');
    L.push(xline);
    L.push('');
    var target = 'x', tnote = '';
    if (state.transform === 'diff1') { L.push('# first differences: model the change, not the level'); L.push('y <- diff(x)'); target = 'y'; tnote = ' of the first differences'; }
    else if (state.transform === 'diff2') { L.push('# second differences'); L.push('y <- diff(x, differences = 2)'); target = 'y'; tnote = ' of the second differences'; }
    else if (state.transform === 'sdiff12') { L.push('# seasonal difference at lag ' + state.period); L.push('y <- diff(x, lag = ' + state.period + ')'); target = 'y'; tnote = ' of the seasonal differences'; }
    if (target !== 'x') L.push('');
    L.push('# acf() returns lags 0..' + r.lagmax + ' (lag 0 is always 1); pacf() starts at lag 1');
    L.push('acf(' + target + ', lag.max = ' + r.lagmax + ')');
    L.push('pacf(' + target + ', lag.max = ' + r.lagmax + ')');
    L.push('');
    L.push('# the numbers behind the plots');
    L.push('round(drop(acf(' + target + ', lag.max = ' + r.lagmax + ', plot = FALSE)$acf), 3)');
    // Truncate on a VALUE boundary, never mid-number: a chopped digit string
    // would be a wrong number sitting under a "#>" that claims R printed it.
    var shown = r.acf.map(function (v) { return v.toFixed(3); });
    var line = shown.join(' '), suffix = '';
    if (line.length > 380) {
      var keep = [], len = 0;
      for (var i = 0; i < shown.length && len + shown[i].length + 1 <= 380; i++) {
        keep.push(shown[i]); len += shown[i].length + 1;
      }
      line = keep.join(' ');
      suffix = ' ... (' + (shown.length - keep.length) + ' more)';
    }
    L.push('#> ' + line + suffix);
    L.push('');
    L.push('# the significance band R draws: qnorm(0.' + Math.round(((1 + state.ci) / 2) * 1000) + ')/sqrt(n), n = ' + r.n);
    L.push('qnorm(' + ((1 + state.ci) / 2).toFixed(4) + ')/sqrt(' + r.n + ')');
    // R prints at 7 significant digits and drops trailing zeros: 0.170593, not
    // 0.1705930. toFixed(7) would emit a digit R never shows.
    L.push('#> ' + rFormat(r.band, 7));
    L.push('');
    L.push('# is anything left? the test, not the eyeball');
    L.push('Box.test(' + target + ', lag = ' + r.lagmax + ', type = "Ljung-Box")');
    var lbL = r.lb[r.lb.length - 1];
    // Reproduce print.htest exactly: the statistic through format(digits = 5)
    // (getOption("digits") - 2) and the p through format.pval(digits = 4).
    // An "#>" line that does not match what R actually prints is a false claim.
    L.push('#> X-squared = ' + rFormat(lbL.stat, 5) + ', df = ' + lbL.df +
           ', p-value ' + rPval(lbL.p));
    L.push('');
    L.push('# same plots, ggplot2 styling (drops the lag-0 spike)');
    L.push('# forecast::ggAcf(' + target + '); forecast::ggPacf(' + target + ')');
    return L.join('\n');
  }
  // ---- R's print formatting, reproduced -----------------------------------
  // R's format(x, digits = d) renders d significant digits and then picks fixed
  // or scientific by whichever is SHORTER (the default scipen = 0), dropping
  // trailing zeros either way. The emitted #> lines have to match R's console
  // output character for character, so this is not cosmetic.
  function rFormat(v, digits) {
    if (!isFinite(v)) return 'NA';
    if (v === 0) return '0';
    var fixed = trimZeros(Number(v.toPrecision(digits)).toFixed(Math.max(0, decimalsFor(v, digits))));
    var sci = sciFormat(v, digits);
    return sci.length < fixed.length ? sci : fixed;
  }
  function decimalsFor(v, digits) {
    var mag = Math.floor(Math.log10(Math.abs(Number(v.toPrecision(digits)))));
    return Math.max(0, digits - 1 - mag);
  }
  function trimZeros(s) {
    return s.indexOf('.') < 0 ? s : s.replace(/0+$/, '').replace(/\.$/, '');
  }
  function sciFormat(v, digits) {
    var e = v.toExponential(digits - 1);           // "1.885e-7"
    var parts = e.split('e');
    var mant = trimZeros(parts[0]);
    var exp = Number(parts[1]);
    var sign = exp < 0 ? '-' : '+';
    var a = Math.abs(exp);
    return mant + 'e' + sign + (a < 10 ? '0' + a : String(a));   // R pads to 2 digits
  }
  // R: format.pval(p, digits = 4, eps = .Machine$double.eps) -> "< 2.2e-16"
  function rPval(p) {
    if (!isFinite(p)) return '= NA';
    return p < 2.220446049250313e-16 ? '< 2.2e-16' : '= ' + rFormat(p, 4);
  }
  function isPristine() {
    var meta = PRESETS[state.preset];
    if (!meta) return false;
    return $('data').value.trim() === serialize(meta);
  }
  function serialize(arr) { return arr.join('\n'); }

  // ===== render =============================================================
  function render() {
    var parsed = parseSeries($('data').value);
    var values = parsed.values;
    var meta = $('dmeta');
    meta.textContent = values.length
      ? values.length + ' ' + plural(values.length, 'observation') +
        (parsed.skippedHeader ? ', header row skipped' : '') +
        (parsed.twoCol ? ', value column detected' : '')
      : 'no data';

    var r = M.analyze(values, {
      transform: state.transform, ci: state.ci,
      lagMax: state.lagMax, period: state.period
    });

    var err = $('ierr');
    if (r.error) {
      err.textContent = r.error;
      err.classList.add('on');
      $('res').classList.add('off');
      return;
    }
    err.classList.remove('on');
    err.textContent = '';
    $('res').classList.remove('off');

    // ---- verdict
    var h = r.hint;
    $('verdict').textContent = h.headline;
    $('verdict').className = 'verdict tone-' + (h.key === 'whitenoise' ? 'ok' : (h.key === 'nonstationary' ? 'warn' : 'acc'));

    // ---- charts
    var acfStart = state.showLag0 ? 0 : 1;
    var acfVals = state.showLag0 ? r.acf : r.acf.slice(1);
    $('acfchart').innerHTML = correlogram(acfVals, acfStart, r.band, r.bartlett,
      'Autocorrelation by lag with the ' + Math.round(state.ci * 100) + '% significance band', state.bartlett);
    $('pacfchart').innerHTML = correlogram(r.pacf, 1, r.band, null,
      'Partial autocorrelation by lag with the ' + Math.round(state.ci * 100) + '% significance band', false);

    // ---- stats grid
    var lbLast = r.lb[r.lb.length - 1];
    var sigCount = h.acfScan.sigCount, sigCountP = h.pacfScan.sigCount;
    $('stats').innerHTML = [
      stat('Observations used', r.n, r.n !== r.nRaw ? r.nRaw + ' pasted, ' + (r.nRaw - r.n) + ' lost to differencing' : 'as pasted'),
      stat('Lags shown', r.lagmax, 'R default: floor(10 &times; log10(' + r.n + ')) = ' + r.defaultLagMax),
      stat('Significance band', '&plusmn;' + f3(r.band), Math.round(state.ci * 100) + '%: qnorm/&radic;n'),
      stat('ACF lags outside', sigCount + ' of ' + r.lagmax, 'about ' + (r.lagmax * (1 - state.ci)).toFixed(1) + ' expected by chance'),
      stat('PACF lags outside', sigCountP + ' of ' + r.lagmax, 'same band'),
      stat('Ljung-Box p', fp(lbLast.p), 'at lag ' + lbLast.lag + ', Q = ' + lbLast.stat.toFixed(1))
    ].join('');

    // ---- plain English + the honest limits
    $('plain').innerHTML = '<p>' + esc(h.why) + '</p>' + limitsFor(h, r);

    // ---- inference line: a named rule and this result's conclusion
    $('infer').innerHTML = inferenceLine(h, r, lbLast);

    // ---- report line
    $('report').textContent = reportLine(h, r, lbLast);

    // ---- lag table
    renderTable(r);

    // ---- how computed
    renderSteps(r);

    // ---- R
    $('rcode').textContent = rCode(r, values);
    if (window.hljsR) window.hljsR($('rcode'));
  }

  function stat(k, v, sub) {
    return '<div class="st"><div class="sk">' + k + '</div><div class="sv">' + v +
           '</div><div class="ss">' + sub + '</div></div>';
  }

  function limitsFor(h, r) {
    var out = [];
    if (h.seasonal && h.seasonal.length) {
      out.push('<p class="lim"><b>Seasonal spikes.</b> The ACF peaks at lag ' +
        h.seasonal.slice(0, 3).join(', lag ') + '. A repeating spike every ' + h.seasonal[0] +
        ' lags is a season, not an AR or MA term: it needs a seasonal difference or a seasonal ARIMA term, which is what the ' +
        (state.transform === 'sdiff12' ? 'seasonal difference mode you are in' : 'seasonal difference mode') + ' is for.</p>');
    }
    if (h.key === 'nonstationary') {
      out.push('<p class="lim"><b>Read the order only after the series is stationary.</b> Identification rules assume a stationary series. Difference this one first, then read the ACF and PACF of the result.</p>');
    }
    if (h.key === 'mixed' || h.key === 'both' || h.confidence === 'weak' || h.confidence === 'none') {
      out.push('<p class="lim"><b>The cutoff rules have limits, and this is one of them.</b> They only give a clean answer for a pure AR or a pure MA process. Real series are usually mixed, and a mixed ARMA tails off in both plots, so the picture cannot separate p from q by eye. Use the plots to shortlist a few orders, then let AICc choose between fitted models.</p>');
    }
    if (h.key === 'ar' || h.key === 'ma') {
      out.push('<p class="lim"><b>This is a shortlist, not a verdict.</b> The pattern is clean here, but sampling noise alone puts roughly ' +
        ((1 - state.ci) * 100).toFixed(0) + '% of lags outside the band, so a lone far-out spike is usually nothing. Fit the candidate, then check that its residual ACF looks like white noise.</p>');
    }
    if (h.key === 'whitenoise') {
      out.push('<p class="lim"><b>What that means.</b> If these are residuals from a model, the model has captured the structure. If it is your raw series, there is no ARMA signal to fit, and the mean is your forecast.</p>');
    }
    return out.join('');
  }

  function inferenceLine(h, r, lb) {
    var sig = h.acfScan.sigCount + h.pacfScan.sigCount;
    if (lb.p < 0.05) {
      return 'Since the Ljung-Box p at lag ' + lb.lag + ' is ' + fp(lb.p) + ' &lt; 0.05, reject the white-noise null: ' +
             'this series still carries autocorrelation worth modelling' +
             (h.key === 'nonstationary' ? ', and its slow ACF decay says to difference before choosing an order.' :
              (h.p !== null && h.p > 0 ? ', and the PACF cutoff points at AR(' + h.p + ') as the first candidate.' :
               (h.q !== null && h.q > 0 ? ', and the ACF cutoff points at MA(' + h.q + ') as the first candidate.' :
                '. The cutoff rules cannot name the order here, so fit a few and compare.')));
    }
    return 'Since the Ljung-Box p at lag ' + lb.lag + ' is ' + fp(lb.p) + ' &ge; 0.05, do not reject the white-noise null: ' +
           'with ' + sig + ' of ' + (r.lagmax * 2) + ' lags outside the band, there is no autocorrelation here that ordinary sampling noise would not produce anyway.';
  }

  function reportLine(h, r, lb) {
    var tl = M.TRANSFORMS[state.transform].short;
    return 'ACF and PACF of the ' + tl + ' (n = ' + r.n +
      (r.n !== r.nRaw ? ', from ' + r.nRaw + ' pasted' : '') + '), lags 0 to ' + r.lagmax +
      ', ' + Math.round(state.ci * 100) + '% band +/-' + f3(r.band) + '. ' +
      h.acfScan.sigCount + ' ACF and ' + h.pacfScan.sigCount + ' PACF lags fall outside it. ' +
      'Ljung-Box at lag ' + lb.lag + ': Q = ' + lb.stat.toFixed(2) + ', df = ' + lb.df + ', p ' +
      (lb.p < 0.001 ? '< 0.001' : '= ' + lb.p.toFixed(3)) + '. ' + h.headline + '.';
  }

  function renderTable(r) {
    var rows = r.rows, out = [];
    out.push('<table class="lagtab"><thead><tr><th>Lag</th><th>ACF</th><th>PACF</th><th>Outside band?</th><th>Ljung-Box p</th></tr></thead><tbody>');
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var flags = [];
      if (row.acfSig) flags.push('ACF');
      if (row.pacfSig) flags.push('PACF');
      var mark = row.lag === 0 ? '<span class="dim">n/a</span>'
        : (flags.length ? '<span class="yes">' + flags.join(' + ') + '</span>' : '<span class="dim">no</span>');
      out.push('<tr' + (row.lag === 0 ? ' class="lag0row"' : '') + '>' +
        '<td class="mono">' + row.lag + '</td>' +
        '<td class="mono">' + f3(row.acf) + (row.lag === 0 ? ' <span class="dim">(always 1)</span>' : '') + '</td>' +
        '<td class="mono">' + (row.pacf === null ? '<span class="dim">not defined</span>' : f3(row.pacf)) + '</td>' +
        '<td>' + mark + '</td>' +
        '<td class="mono">' + (row.lb ? fp(row.lb.p) : '<span class="dim">n/a</span>') + '</td>' +
        '</tr>');
    }
    out.push('</tbody></table>');
    $('lagtable').innerHTML = out.join('');
  }

  function renderSteps(r) {
    var lb = r.lb[r.lb.length - 1];
    var z = ((1 + state.ci) / 2).toFixed(4);
    var h = '';
    h += '<p>The autocorrelation at lag <i>k</i> is the correlation of the series with itself shifted <i>k</i> steps, using the same mean and variance for every lag:</p>';
    h += '<pre class="frm">r_k = sum_{t=1}^{n-k} (x_t - xbar)(x_{t+k} - xbar)  /  sum_{t=1}^{n} (x_t - xbar)^2</pre>';
    h += '<p>With n = <b>' + r.n + '</b>, that gives r<sub>1</sub> = <b>' + f3(r.acf[1]) + '</b>' +
         (r.lagmax >= 2 ? ' and r<sub>2</sub> = <b>' + f3(r.acf[2]) + '</b>' : '') + '. ' +
         'The denominator always uses all n terms, so r<sub>0</sub> = 1 exactly: a series is perfectly correlated with itself at lag 0, which is why that spike carries no information.</p>';
    h += '<p>The <b>partial</b> autocorrelation at lag <i>k</i> strips out the lags in between: it is the correlation left between x<sub>t</sub> and x<sub>t+k</sub> once lags 1 to k-1 are regressed out. R gets it from the Durbin-Levinson recursion on the ACF, so lag 1 is the only place the two agree: ' +
         'r<sub>1</sub> = <b>' + f3(r.acf[1]) + '</b> = &phi;<sub>11</sub> = <b>' + f3(r.pacf[0]) + '</b>. There is no partial autocorrelation at lag 0 to compute, which is why pacf() starts at lag 1 and returns ' + r.pacf.length + ' values where acf() returns ' + r.acf.length + '.</p>';
    h += '<p>The band is the range a lag would stay inside if the series were white noise:</p>';
    h += '<pre class="frm">band = qnorm(' + z + ') / sqrt(n) = ' + M.band(r.n, state.ci).toFixed(6) + ' / ... = &plusmn;' + f3(r.band) + '</pre>';
    h += '<p>That is where the familiar <b>1.96/&radic;n</b> comes from: 1.96 is qnorm(0.975) rounded. ' +
         'Note the n is the length <i>after</i> any differencing (' + r.n + ' here), so every difference you take widens the band and makes spikes harder to call significant.</p>';
    h += '<p>Finally the Ljung-Box statistic pools the first ' + lb.lag + ' lags into one test of "is this white noise?":</p>';
    h += '<pre class="frm">Q = n(n+2) * sum_{k=1}^{' + lb.lag + '} r_k^2/(n-k) = ' + lb.stat.toFixed(3) + ' on ' + lb.df + ' df, p ' + (lb.p < 0.001 ? '< 0.001' : '= ' + lb.p.toFixed(3)) + '</pre>';
    $('steps').innerHTML = h;
  }

  // ===== wiring =============================================================
  // The event names live INLINE on the page (window.__acfGA): the tool audit
  // greps the rendered HTML for them, and lib bodies are not in outerHTML.
  function touched() {
    try { if (window.__acfGA) window.__acfGA.use(); } catch (e) {}
  }
  function gaCopy(what) {
    try { if (window.__acfGA) window.__acfGA.copy(what); } catch (e) {}
  }

  function setTransform(t) {
    state.transform = t;
    Array.prototype.forEach.call(document.querySelectorAll('.mode'), function (b) {
      var on = b.getAttribute('data-mode') === t;
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    $('iwantsel').value = t;
    $('iwantlbl').textContent = $('iwantsel').options[$('iwantsel').selectedIndex].textContent;
    $('perrow').style.display = t === 'sdiff12' ? '' : 'none';
    render();
  }

  function loadPreset(key) {
    state.preset = key;
    $('data').value = serialize(PRESETS[key]);
    Array.prototype.forEach.call(document.querySelectorAll('.chip'), function (c) {
      c.classList.toggle('on', c.getAttribute('data-preset') === key);
    });
    $('presetnote').textContent = PRESET_META[key] ? PRESET_META[key].note : '';
    render();
  }

  function boot() {
    if (!M) return;
    // presets
    var row = $('scenrow');
    Object.keys(PRESET_META).forEach(function (k) {
      if (!PRESETS[k]) return;
      var b = document.createElement('button');
      b.className = 'chip' + (k === state.preset ? ' on' : '');
      b.type = 'button';
      b.setAttribute('data-preset', k);
      b.textContent = PRESET_META[k].label;
      b.addEventListener('click', function () { touched(); loadPreset(k); });
      row.appendChild(b);
    });

    Array.prototype.forEach.call(document.querySelectorAll('.mode'), function (b) {
      b.addEventListener('click', function () { touched(); setTransform(b.getAttribute('data-mode')); });
    });
    $('iwantsel').addEventListener('change', function () { touched(); setTransform(this.value); });

    $('data').addEventListener('input', function () { touched(); state.preset = isPristineAny(); render(); });

    $('cisel').addEventListener('change', function () { touched(); state.ci = Number(this.value); render(); });
    $('lagmax').addEventListener('input', function () {
      touched();
      var v = this.value.trim();
      state.lagMax = v === '' ? null : Math.max(1, Math.round(Number(v)) || 1);
      render();
    });
    $('period').addEventListener('input', function () {
      touched();
      var v = Math.round(Number(this.value.trim()));
      state.period = (isFinite(v) && v >= 2) ? v : 12;
      render();
    });
    $('showlag0').addEventListener('change', function () { touched(); state.showLag0 = this.checked; render(); });
    $('bartlett').addEventListener('change', function () { touched(); state.bartlett = this.checked; render(); });

    // copies
    wireCopy('copyreport', function () { return $('report').textContent; }, 'report');
    wireCopy('copyr', function () { return $('rcode').textContent; }, 'r');

    loadPreset(state.preset);
    setTransform('none');
  }
  function isPristineAny() {
    var txt = $('data').value.trim(), k;
    for (k in PRESETS) if (PRESETS.hasOwnProperty(k) && txt === serialize(PRESETS[k])) return k;
    return null;
  }
  function wireCopy(id, get, what) {
    var b = $(id);
    if (!b) return;
    b.addEventListener('click', function () {
      var t = get();
      function done() {
        var old = b.textContent;
        b.textContent = 'Copied';
        setTimeout(function () { b.textContent = old; }, 1400);
      }
      try {
        navigator.clipboard.writeText(t).then(done, function () { fallback(t); done(); });
      } catch (e) { fallback(t); done(); }
      gaCopy(what);
    });
  }
  function fallback(t) {
    var ta = document.createElement('textarea');
    ta.value = t; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
