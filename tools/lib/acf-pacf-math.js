/* acf-pacf-math.js - ACF / PACF correlogram math for Tool Farm v2
   (tools/acf-pacf-calculator.html).

   Ground truth: R 4.6.0
     stats::acf      sample autocorrelation, lags 0..lag.max (lag 0 == 1)
     stats::pacf     partial autocorrelation, lags 1..lag.max (no lag 0)
     stats::diff     diff(x, lag = s, differences = k)
     stats::Box.test Ljung-Box white-noise test (cumulative over lags)
     plot.acf        the significance bands drawn on the correlogram
   Verified <=1e-6 relative against Scripts/tool-truth/acf-pacf-calculator.json.

   COMPOSITION, NOT DUPLICATION: the sample ACF and the Durbin-Levinson PACF are
   already R-verified in timeseries-math.js (ts-stationarity-calculator). This
   library delegates both to that lib and adds only what the correlogram needs.
   timeseries-math.js is deliberately NOT edited, so its content-hash pin (and
   ts-stationarity-calculator) stay untouched.

   Conventions pinned here (they are the substance of the tool):
     * acf() returns lag 0..L; lag 0 is 1 BY CONSTRUCTION and carries no
       information. pacf() starts at lag 1. Tools that silently align the two
       arrays by index are off by one; we keep lag 0 explicit and label it.
     * default lag.max = floor(10*log10(n)) then min(., n-1)  (R's rule)
     * the white-noise band R draws is qnorm((1+ci)/2)/sqrt(n.used), i.e.
       1.959964/sqrt(n) at 95% - the familiar "1.96/sqrt(n)" is that rounded.
     * n.used is the length AFTER differencing, so every diff widens the band.
     * a constant series has 0/0 autocorrelation: R returns NaN, not 0. We
       refuse to display a number there rather than invent one.

   The identification layer (suggest()) is EXPLICITLY a heuristic, not an
   R-verified quantity: it reads cutoffs/decay off the verified numbers the same
   way a human would, and reports its own confidence + when it cannot call it.
   Box-Jenkins order identification is not a decision procedure; the page says so. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports)
    module.exports = factory(require('./timeseries-math.js'), require('./normal-math.js'));
  else root.AcfPacfMath = factory(root.TimeSeriesMath, root.NormalMath);
}(typeof self !== 'undefined' ? self : this, function (TS, NM) {
  'use strict';

  // ===== transforms: R's diff(x, lag = s, differences = k) ===================
  function diffOnce(x, lag) {
    var o = [], i;
    for (i = lag; i < x.length; i++) o.push(x[i] - x[i - lag]);
    return o;
  }
  function diffR(x, lag, differences) {
    lag = lag || 1; differences = differences || 1;
    var cur = x.slice(), k;
    for (k = 0; k < differences; k++) {
      if (cur.length <= lag) return [];
      cur = diffOnce(cur, lag);
    }
    return cur;
  }

  // The mode pills. Each maps to exactly one R call, which is what we emit.
  var TRANSFORMS = {
    none:    { label: 'as-is (no differencing)', short: 'raw series',            rExpr: function (v) { return v; } },
    diff1:   { label: 'first differences',       short: 'first difference',      rExpr: function (v) { return 'diff(' + v + ')'; } },
    diff2:   { label: 'second differences',      short: 'second difference',     rExpr: function (v) { return 'diff(' + v + ', differences = 2)'; } },
    sdiff12: { label: 'seasonal differences',    short: 'seasonal difference',   rExpr: function (v, s) { return 'diff(' + v + ', lag = ' + (s || 12) + ')'; } }
  };
  function applyTransform(x, transform, period) {
    switch (transform) {
      case 'diff1':   return diffR(x, 1, 1);
      case 'diff2':   return diffR(x, 1, 2);
      case 'sdiff12': return diffR(x, period || 12, 1);
      default:        return x.slice();
    }
  }

  // ===== bands ==============================================================
  // R (plot.acf): clim0 <- qnorm((1 + ci)/2)/sqrt(x$n.used)
  function band(n, ci) { return NM.qnorm((1 + (ci == null ? 0.95 : ci)) / 2) / Math.sqrt(n); }
  // R (plot.acf, ci.type="ma"): clim0 * sqrt(cumsum(c(1, 2*acf[-1]^2)))
  // Bartlett's formula: the band under an MA(k-1) null, so it widens with lag.
  function bartlettBands(acfVals, n, ci) {
    var clim0 = band(n, ci), out = [], s = 1, k;
    out.push(clim0);
    for (k = 1; k < acfVals.length; k++) {
      s += 2 * acfVals[k] * acfVals[k];
      out.push(clim0 * Math.sqrt(s));
    }
    return out;  // aligned with acfVals (index 0 == lag 0)
  }

  // ===== Ljung-Box (stats::Box.test type="Ljung-Box"), cumulative ===========
  // Q(h) = n(n+2) * sum_{k=1..h} r_k^2/(n-k);  df = h - fitdf;  p = P(chisq_df > Q)
  function ljungBox(acfVals, n, h, fitdf) {
    fitdf = fitdf || 0;
    var s = 0, k;
    for (k = 1; k <= h; k++) s += acfVals[k] * acfVals[k] / (n - k);
    var Q = n * (n + 2) * s, df = h - fitdf;
    return { lag: h, stat: Q, df: df, p: df > 0 ? NM.gammq(df / 2, Q / 2) : NaN };
  }
  function ljungBoxAll(acfVals, n, L, fitdf) {
    var out = [], h;
    for (h = 1; h <= L; h++) out.push(ljungBox(acfVals, n, h, fitdf));
    return out;
  }

  // ===== identification heuristic (NOT R-verified; guidance only) ===========
  // Reads the verified numbers the way Box-Jenkins tells a human to, and is
  // candid when the pattern does not actually support a call.
  function scan(vals, bnd) {          // vals index 0 == lag 1
    var lastSig = 0, sigCount = 0, i;
    for (i = 0; i < vals.length; i++) {
      if (Math.abs(vals[i]) > bnd) { sigCount++; lastSig = i + 1; }
    }
    return { lastSig: lastSig, sigCount: sigCount, n: vals.length };
  }
  // A clean cutoff: significance stops at a small lag and stays stopped.
  function isCutoff(s) { return s.lastSig >= 1 && s.lastSig <= 5 && s.lastSig < s.n; }
  // Tail-off / decay: significance persists deep into the correlogram.
  function isTailOff(s) { return s.lastSig >= Math.min(6, s.n); }

  function suggest(acfVals, pacfVals, n, opts) {
    opts = opts || {};
    var bnd = band(n, opts.ci == null ? 0.95 : opts.ci);
    var a1 = acfVals.slice(1);              // drop lag 0 - it is always 1
    var sa = scan(a1, bnd), sp = scan(pacfVals, bnd);
    var r1 = a1.length ? a1[0] : 0;
    var period = opts.period || 12;

    // seasonal spikes: significant, and a local peak among its neighbours
    var seasonal = [];
    for (var m = 1; m * period <= a1.length; m++) {
      var idx = m * period - 1, v = a1[idx];
      if (Math.abs(v) > bnd) {
        var lo = idx > 0 ? Math.abs(a1[idx - 1]) : 0,
            hi = idx < a1.length - 1 ? Math.abs(a1[idx + 1]) : 0;
        if (Math.abs(v) >= lo && Math.abs(v) >= hi) seasonal.push(m * period);
      }
    }

    // Slow decay = the classic nonstationarity signature: big r1, and the ACF
    // is still significant deep out. This outranks any AR/MA call.
    var slowDecay = r1 > 0.8 && sa.lastSig >= Math.min(8, sa.n) &&
                    sa.sigCount >= Math.min(8, sa.n) * 0.7;

    var key, p = null, q = null, conf, headline, why;
    if (sa.sigCount === 0 && sp.sigCount === 0) {
      key = 'whitenoise'; conf = 'clear'; p = 0; q = 0;
      headline = 'No autocorrelation left to model';
      why = 'Not one lag breaks the significance band in either plot, which is what white noise looks like.';
    } else if (slowDecay) {
      key = 'nonstationary'; conf = 'clear';
      headline = 'Slow decay: difference the series first';
      why = 'The ACF starts at ' + r1.toFixed(2) + ' and is still significant at lag ' + sa.lastSig +
            ', decaying gradually rather than cutting off. That is the signature of a trend or a unit root, not of an ARMA order.';
    } else if (isCutoff(sp) && isTailOff(sa)) {
      key = 'ar'; p = sp.lastSig; conf = 'clear';
      headline = 'Looks like AR(' + p + ')';
      why = 'The PACF cuts off after lag ' + p + ' while the ACF tails off gradually, the textbook AR(' + p + ') pattern.';
    } else if (isCutoff(sa) && isTailOff(sp)) {
      key = 'ma'; q = sa.lastSig; conf = 'clear';
      headline = 'Looks like MA(' + q + ')';
      why = 'The ACF cuts off after lag ' + q + ' while the PACF tails off gradually, the textbook MA(' + q + ') pattern.';
    } else if (isCutoff(sa) && isCutoff(sp)) {
      key = 'both'; p = sp.lastSig; q = sa.lastSig; conf = 'weak';
      headline = 'Ambiguous: AR(' + p + ') and MA(' + q + ') both fit the picture';
      why = 'Both plots cut off early, so the classic rules point two ways at once. Fit both and compare on AICc.';
    } else if (isTailOff(sa) && isTailOff(sp)) {
      key = 'mixed'; conf = 'none';
      headline = 'Mixed ARMA: the classic rules cannot call this one';
      why = 'Both the ACF and the PACF tail off instead of cutting off. That is the ARMA(p,q) signature, and it is exactly the case the cutoff rules were never able to resolve by eye.';
    } else {
      key = 'unclear'; conf = 'weak';
      headline = 'No clean cutoff pattern';
      why = 'The significant lags do not form the clean cutoff-versus-decay contrast the identification rules need.';
    }
    return {
      key: key, p: p, q: q, confidence: conf, headline: headline, why: why,
      band: bnd, r1: r1, seasonal: seasonal,
      acfScan: sa, pacfScan: sp, slowDecay: slowDecay
    };
  }

  // ===== master analyze =====================================================
  function analyze(x, opts) {
    opts = opts || {};
    var transform = opts.transform || 'none';
    var period = opts.period || 12;
    var ci = opts.ci == null ? 0.95 : opts.ci;
    var nRaw = x.length;

    if (!nRaw) return { error: 'Paste a series to get started - one number per line, or time and value in two columns.' };

    var y = applyTransform(x, transform, period);
    var n = y.length;
    if (n < 4) {
      return { error: transform === 'none'
        ? 'Paste at least 4 observations - a correlogram needs a series, not a handful of points.'
        : 'Differencing left only ' + n + ' observation' + (n === 1 ? '' : 's') + '. Paste a longer series or use a smaller differencing order.' };
    }
    // R's rule, applied exactly: every autocorrelation divides by
    // c0 = sum((x - xbar)^2)/n, so when c0 is 0 or overflows, acf() is NaN.
    // Test c0 itself rather than a tolerance heuristic, so we refuse in exactly
    // the cases R refuses and answer wherever R answers (a near-constant series
    // with a tiny but real variance still gets its numbers).
    //
    // This guard has to live here: timeseries-math's acf returns 0 when c0 == 0,
    // where R returns NaN, and a displayed 0 would be a fabricated correlation.
    var c0 = 0, ybar = 0, ii;
    for (ii = 0; ii < n; ii++) ybar += y[ii];
    ybar /= n;
    for (ii = 0; ii < n; ii++) c0 += (y[ii] - ybar) * (y[ii] - ybar);
    c0 /= n;
    if (!(c0 > 0) || !isFinite(c0)) {
      var same = true;
      for (ii = 1; ii < n; ii++) if (y[ii] !== y[0]) { same = false; break; }
      var lead = transform === 'none' ? '' : 'After differencing, ';
      if (same) {
        return { error: lead + 'every value is identical, so there is no variation to correlate. ' +
                        'R returns NaN here, not 0.' };
      }
      if (!isFinite(c0)) {
        return { error: lead + 'these numbers are too large to square without overflowing, so every ' +
                        'autocorrelation is NaN in R too. Rescale the series (divide by a constant) and try again.' };
      }
      return { error: lead + 'these numbers are so small that their squared deviations underflow to zero, ' +
                      'so every autocorrelation is NaN in R too. Rescale the series (multiply by a constant) and try again.' };
    }

    var L = opts.lagMax != null ? opts.lagMax : TS.acfDefaultLagMax(n);
    L = Math.max(1, Math.min(L, n - 1));   // R: lag.max <- min(lag.max, n-1)

    var a = TS.acf(y, L);        // values[0..L], values[0] === 1
    var p = TS.pacf(y, L);       // values[0..L-1] == lags 1..L
    var bnd = band(n, ci);
    var bart = bartlettBands(a.values, n, ci);
    var lb = ljungBoxAll(a.values, n, L, opts.fitdf || 0);
    var hint = suggest(a.values, p.values, n, { ci: ci, period: period });

    // per-lag table rows: the ONLY place acf and pacf are aligned, and it is
    // done by lag number, never by array index (acf has lag 0, pacf does not).
    var rows = [], k;
    for (k = 0; k <= L; k++) {
      rows.push({
        lag: k,
        acf: a.values[k],
        pacf: k === 0 ? null : p.values[k - 1],
        band: bnd,
        bartlett: bart[k],
        acfSig: k === 0 ? false : Math.abs(a.values[k]) > bnd,
        pacfSig: k === 0 ? false : Math.abs(p.values[k - 1]) > bnd,
        lb: k === 0 ? null : lb[k - 1]
      });
    }

    return {
      ok: true,
      nRaw: nRaw, n: n, nUsed: n, lagmax: L, ci: ci,
      transform: transform, period: period,
      series: y,
      acf: a.values, pacf: p.values,
      band: bnd, bartlett: bart, lb: lb, rows: rows, hint: hint,
      defaultLagMax: TS.acfDefaultLagMax(n)
    };
  }

  return {
    version: '1.0.0',
    diffR: diffR, applyTransform: applyTransform, TRANSFORMS: TRANSFORMS,
    band: band, bartlettBands: bartlettBands,
    ljungBox: ljungBox, ljungBoxAll: ljungBoxAll,
    acf: function (x, L) { return TS.acf(x, L); },
    pacf: function (x, L) { return TS.pacf(x, L); },
    acfDefaultLagMax: TS.acfDefaultLagMax,
    suggest: suggest, analyze: analyze
  };
}));
