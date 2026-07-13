/* timeseries-math.js - exact stationarity-test math for Tool Farm v2
   (tools/ts-stationarity-calculator.html).

   Ground truth: R 4.6.0
     tseries::adf.test   Augmented Dickey-Fuller (trend model, fixed lag k)
     tseries::kpss.test  KPSS (Level + Trend nulls, lshort short/long lag)
     tseries::pp.test    Phillips-Perron (Z(alpha) + Z(t_alpha))
     forecast::ndiffs    differencing order (test="kpss" -> urca::ur.kpss)
     stats::acf / pacf   sample ACF; Durbin-Levinson PACF
   Verified <=1e-6 relative against Scripts/tool-truth/ts-stationarity.json.

   Replaces the predecessor's home-grown approximations (hard-coded MacKinnon
   critical values, AIC-selected ADF lag, level-only KPSS, coordinate-descent
   ARIMA fit). Every p-value here comes from the SAME interpolation table R uses
   (approx over the Banerjee/Kwiatkowski tables), so the displayed numbers match
   adf.test()/kpss.test()/pp.test()/ndiffs() exactly.

   NOTE: auto.arima's AICc model ranking is deliberately NOT reproduced - fitting
   each ARIMA(p,d,q) needs maximum-likelihood optimisation, which is not
   bit-reproducible outside R's arima(). The tool teaches that and emits the
   auto.arima() call to run; here we give the pieces auto.arima decides FROM:
   the differencing order d and the ACF/PACF order signals.

   Browser: window.TimeSeriesMath (needs window.VIFMath loaded first).
   Node:    require('./timeseries-math.js'). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./vif-math.js'));
  } else {
    root.TimeSeriesMath = factory(root.VIFMath);
  }
}(typeof self !== 'undefined' ? self : this, function (VIF) {
  'use strict';

  // ===== small vector helpers ================================================
  function sum(a) { var s = 0, i; for (i = 0; i < a.length; i++) s += a[i]; return s; }
  function mean(a) { return sum(a) / a.length; }
  function diff(a) { var o = [], i; for (i = 1; i < a.length; i++) o.push(a[i] - a[i - 1]); return o; }
  function cumsum(a) { var o = [], s = 0, i; for (i = 0; i < a.length; i++) { s += a[i]; o.push(s); } return o; }
  function seq(from, to) { var o = [], i; for (i = from; i <= to; i++) o.push(i); return o; }

  // embed(x, k): rows = n-k+1, row i = (x[i+k-1], x[i+k-2], ..., x[i]) (R order).
  function embed(x, k) {
    var n = x.length, rows = n - k + 1, out = [], i, j;
    for (i = 0; i < rows; i++) {
      var r = [];
      for (j = 0; j < k; j++) r.push(x[i + k - 1 - j]);
      out.push(r);
    }
    return out;
  }

  // ===== R stats::approx(method="linear") ====================================
  // Sorts x ascending (carrying y), linear-interpolates at xout. rule=2 clamps
  // to the nearest endpoint outside the data range; rule=1 -> NaN there.
  // Returns { y, oob } where oob = -1 below range, +1 above, 0 inside.
  function approx(x, y, xout, rule) {
    if (rule == null) rule = 1;
    var n = x.length, idx = [], i;
    for (i = 0; i < n; i++) idx.push(i);
    idx.sort(function (a, b) { return x[a] - x[b]; });
    var xs = idx.map(function (k) { return x[k]; });
    var ys = idx.map(function (k) { return y[k]; });
    if (isNaN(xout)) return { y: NaN, oob: 0 };
    if (xout < xs[0]) return { y: rule === 2 ? ys[0] : NaN, oob: -1 };
    if (xout > xs[n - 1]) return { y: rule === 2 ? ys[n - 1] : NaN, oob: 1 };
    for (i = 0; i < n - 1; i++) {
      if (xout >= xs[i] && xout <= xs[i + 1]) {
        if (xs[i + 1] === xs[i]) return { y: ys[i], oob: 0 };
        var t = (xout - xs[i]) / (xs[i + 1] - xs[i]);
        return { y: ys[i] + t * (ys[i + 1] - ys[i]), oob: 0 };
      }
    }
    return { y: ys[n - 1], oob: 0 };
  }

  // ===== ordinary least squares (design X supplied incl. intercept col) ======
  // Returns { beta, resid, rss, se, df, sigma2, singular }.
  function ols(X, y) {
    var n = X.length, k = X[0].length, i, j, a, b, s;
    var XtX = [], Xty = [];
    for (a = 0; a < k; a++) {
      XtX.push(new Array(k));
      for (b = 0; b < k; b++) { s = 0; for (i = 0; i < n; i++) s += X[i][a] * X[i][b]; XtX[a][b] = s; }
      s = 0; for (i = 0; i < n; i++) s += X[i][a] * y[i]; Xty.push(s);
    }
    var inv = VIF.invertMatrix(XtX);
    if (!inv) return { singular: true };
    var beta = new Array(k);
    for (a = 0; a < k; a++) { s = 0; for (b = 0; b < k; b++) s += inv[a][b] * Xty[b]; beta[a] = s; }
    var resid = new Array(n), rss = 0;
    for (i = 0; i < n; i++) {
      s = 0; for (j = 0; j < k; j++) s += X[i][j] * beta[j];
      resid[i] = y[i] - s; rss += resid[i] * resid[i];
    }
    var df = n - k, sigma2 = df > 0 ? rss / df : NaN;
    var se = new Array(k);
    for (a = 0; a < k; a++) se[a] = Math.sqrt(sigma2 * inv[a][a]);
    return { beta: beta, resid: resid, rss: rss, se: se, df: df, sigma2: sigma2, n: n, k: k };
  }

  // ===== Bartlett long-run variance (tseries_pp_sum C routine) ===============
  // s2in = sum(u^2)/n ; returns s2in + (2/n) * sum_{i=1..l}(1-i/(l+1)) * gamma_i,
  // gamma_i = sum_{j=i..n-1} u[j]*u[j-i]. Identical to urca::ur.kpss's R form.
  function longRunVar(u, n, l, s2in) {
    var tmp2 = 0, i, j, g;
    for (i = 1; i <= l; i++) {
      g = 0;
      for (j = i; j < n; j++) g += u[j] * u[j - i];
      tmp2 += (1 - i / (l + 1)) * g;
    }
    return s2in + 2 / n * tmp2;
  }

  // ===== critical-value tables (from tseries source, pre-negation) ===========
  var TABLE_T = [25, 50, 100, 250, 500, 100000];
  var TABLE_P = [0.01, 0.025, 0.05, 0.1, 0.9, 0.95, 0.975, 0.99];
  // Dickey-Fuller table (adf.test + pp.test Z(t_alpha))
  var DF_COLS = [
    [4.38, 4.15, 4.04, 3.99, 3.98, 3.96], [3.95, 3.80, 3.73, 3.69, 3.68, 3.66],
    [3.60, 3.50, 3.45, 3.43, 3.42, 3.41], [3.24, 3.18, 3.15, 3.13, 3.13, 3.12],
    [1.14, 1.19, 1.22, 1.23, 1.24, 1.25], [0.80, 0.87, 0.90, 0.92, 0.93, 0.94],
    [0.50, 0.58, 0.62, 0.64, 0.65, 0.66], [0.15, 0.24, 0.28, 0.31, 0.32, 0.33]
  ];
  // Phillips-Perron Z(alpha) table
  var ZA_COLS = [
    [22.5, 25.7, 27.4, 28.4, 28.9, 29.5], [19.9, 22.4, 23.6, 24.4, 24.8, 25.1],
    [17.9, 19.8, 20.7, 21.3, 21.5, 21.8], [15.6, 16.8, 17.5, 18.0, 18.1, 18.3],
    [3.66, 3.71, 3.74, 3.75, 3.76, 3.77], [2.51, 2.60, 2.62, 2.64, 2.65, 2.66],
    [1.53, 1.66, 1.73, 1.78, 1.78, 1.79], [0.43, 0.65, 0.75, 0.82, 0.84, 0.87]
  ];
  function neg(cols) { return cols.map(function (c) { return c.map(function (v) { return -v; }); }); }
  var DF_NEG = neg(DF_COLS), ZA_NEG = neg(ZA_COLS);

  // interpolate a DF/PP-style p-value: first across sample size (per column),
  // then across the resulting critical values at the observed statistic.
  function tablePValue(colsNeg, nSample, stat) {
    var tableipl = colsNeg.map(function (col) { return approx(TABLE_T, col, nSample, 2).y; });
    return approx(tableipl, TABLE_P, stat, 2);   // {y, oob}
  }

  // ===== Augmented Dickey-Fuller (tseries::adf.test) =========================
  // Model: dy_t = a + b*t + rho*y_{t-1} + sum g_i dy_{t-i}. STAT = t-stat on rho.
  // Default k = trunc((N-1)^(1/3)); p from DF table interpolation (alt=stationary).
  function adf(x, opts) {
    opts = opts || {};
    var N = x.length;
    var k0 = opts.k != null ? opts.k : Math.trunc(Math.pow(N - 1, 1 / 3));
    if (k0 < 0) return { error: 'Lag order k must be non-negative.' };
    var k = k0 + 1;
    var y = diff(x), n = y.length;                 // n = N-1 (used for the p table)
    if (n - k + 1 < k + 3) return { error: 'Series too short for the Augmented Dickey-Fuller regression at lag ' + k0 + '.' };
    var z = embed(y, k);
    var m = z.length;
    var X = [], yt = [], i, j;
    for (i = 0; i < m; i++) {
      var row = [1, x[k - 1 + i], k + i];          // intercept, y_{t-1} (x[k..n]), trend (k..n)
      for (j = 1; j < k; j++) row.push(z[i][j]);   // lagged diffs
      X.push(row); yt.push(z[i][0]);
    }
    var f = ols(X, yt);
    if (f.singular || !(f.df > 0)) return { error: 'The Augmented Dickey-Fuller regression is singular for this series.' };
    var stat = f.beta[1] / f.se[1];
    var pv = tablePValue(DF_NEG, n, stat);
    var pStationary = pv.y;                         // alternative = "stationary"
    return {
      statistic: stat, lag: k0, p: pStationary, oob: pv.oob,
      nobs: m, df: f.df, model: 'trend'
    };
  }

  // ===== KPSS (tseries::kpss.test) ===========================================
  // null="Level": residuals x-mean(x); null="Trend": residuals of lm(x~t).
  // eta = sum(cumsum(e)^2)/n^2 ; s2 = Bartlett LRV ; STAT = eta/s2.
  var KPSS_TABLE = { Level: [0.739, 0.574, 0.463, 0.347], Trend: [0.216, 0.176, 0.146, 0.119] };
  var KPSS_P = [0.01, 0.025, 0.05, 0.1];
  function kpss(x, opts) {
    opts = opts || {};
    var nullType = opts.null_ || 'Level';
    var lshort = opts.lshort !== false;
    var n = x.length, e, i;
    if (nullType === 'Trend') {
      var X = [], t = [];
      for (i = 0; i < n; i++) { X.push([1, i + 1]); t.push(x[i]); }
      var f = ols(X, x);
      if (f.singular) return { error: 'KPSS trend regression is singular.' };
      e = f.resid;
    } else {
      var mu = mean(x); e = x.map(function (v) { return v - mu; });
    }
    var s = cumsum(e);
    var eta = 0; for (i = 0; i < n; i++) eta += s[i] * s[i]; eta /= (n * n);
    var s2 = 0; for (i = 0; i < n; i++) s2 += e[i] * e[i]; s2 /= n;
    var l = lshort ? Math.trunc(4 * Math.pow(n / 100, 0.25)) : Math.trunc(12 * Math.pow(n / 100, 0.25));
    s2 = longRunVar(e, n, l, s2);
    var stat = eta / s2;
    var pv = approx(KPSS_TABLE[nullType], KPSS_P, stat, 2);
    return { statistic: stat, lag: l, p: pv.y, oob: pv.oob, null: nullType };
  }

  // ===== Phillips-Perron (tseries::pp.test) ==================================
  function pp(x, opts) {
    opts = opts || {};
    var type = opts.type || 'Z(t_alpha)';
    var lshort = opts.lshort !== false;
    var z = embed(x, 2), n = z.length, i;
    var yt = [], yt1 = [], X = [];
    for (i = 0; i < n; i++) {
      yt.push(z[i][0]); yt1.push(z[i][1]);
      X.push([1, (i + 1) - n / 2, z[i][1]]);        // intercept, tt=(1:n)-n/2, y_{t-1}
    }
    var f = ols(X, yt);
    if (f.singular || f.k < 3) return { error: 'Phillips-Perron regression is singular.' };
    var u = f.resid;
    var ssqru = 0; for (i = 0; i < n; i++) ssqru += u[i] * u[i]; ssqru /= n;
    var l = lshort ? Math.trunc(4 * Math.pow(n / 100, 0.25)) : Math.trunc(12 * Math.pow(n / 100, 0.25));
    var ssqrtl = longRunVar(u, n, l, ssqru);
    var n2 = n * n;
    var sYt1sq = 0, sYt1i = 0, sYt1 = 0;
    for (i = 0; i < n; i++) { sYt1sq += yt1[i] * yt1[i]; sYt1i += yt1[i] * (i + 1); sYt1 += yt1[i]; }
    var trm1 = n2 * (n2 - 1) * sYt1sq / 12;
    var trm2 = n * sYt1i * sYt1i;
    var trm3 = n * (n + 1) * sYt1i * sYt1;
    var trm4 = (n * (n + 1) * (2 * n + 1) * sYt1 * sYt1) / 6;
    var Dx = trm1 - trm2 + trm3 - trm4;
    var stat, cols;
    if (type === 'Z(alpha)') {
      var alpha = f.beta[2];
      stat = n * (alpha - 1) - (Math.pow(n, 6)) / (24 * Dx) * (ssqrtl - ssqru);
      cols = ZA_NEG;
    } else {
      var tstat = (f.beta[2] - 1) / f.se[2];
      stat = Math.sqrt(ssqru) / Math.sqrt(ssqrtl) * tstat
           - (Math.pow(n, 3)) / (4 * Math.sqrt(3) * Math.sqrt(Dx) * Math.sqrt(ssqrtl)) * (ssqrtl - ssqru);
      cols = DF_NEG;
    }
    var pv = tablePValue(cols, n, stat);
    return { statistic: stat, lag: l, p: pv.y, oob: pv.oob, type: type };
  }

  // ===== forecast::ndiffs (test="kpss") via urca::ur.kpss ====================
  // is.constant (forecast) uses all.equal(x, rep(x[1])); replicate the tolerance.
  function isConstant(x) {
    var i, x0 = x[0], xy = 0, xn = 0;
    for (i = 0; i < x.length; i++) { xy += Math.abs(x[i] - x0); xn += Math.abs(x[i]); }
    xy /= x.length; xn /= x.length;
    if (isFinite(xn) && xn > 1.5e-8) xy /= xn;
    return xy <= 1.5e-8;
  }
  // ur.kpss teststat with an explicit truncation lag (use.lag). type mu|tau.
  function urKpssStat(x, type, useLag) {
    var n = x.length, res, i;
    if (type === 'tau') {
      var X = [];
      for (i = 0; i < n; i++) X.push([1, i + 1]);
      var f = ols(X, x); res = f.resid;
    } else {
      var mu = mean(x); res = x.map(function (v) { return v - mu; });
    }
    var S = cumsum(res);
    var nominator = 0; for (i = 0; i < n; i++) nominator += S[i] * S[i]; nominator /= (n * n);
    var s2 = 0; for (i = 0; i < n; i++) s2 += res[i] * res[i]; s2 /= n;
    var denom = useLag === 0 ? s2 : longRunVar(res, n, useLag, s2);
    return nominator / denom;
  }
  var URCA_KPSS_CVAL = { mu: [0.347, 0.463, 0.574, 0.739], tau: [0.119, 0.146, 0.176, 0.216] };
  var URCA_KPSS_PCT = [0.10, 0.05, 0.025, 0.01];
  function ndiffs(x, opts) {
    opts = opts || {};
    var alpha = opts.alpha != null ? opts.alpha : 0.05;
    var maxD = opts.maxD != null ? opts.maxD : 2;
    var type = opts.type === 'trend' ? 'tau' : 'mu';
    if (alpha < 0.01) alpha = 0.01; else if (alpha > 0.1) alpha = 0.1;
    var d = 0, cur = x.slice();
    if (isConstant(cur)) return 0;
    function dodiff(v) {
      var useLag = Math.trunc(3 * Math.sqrt(v.length) / 13);
      var stat = urKpssStat(v, type, useLag);
      var p = approx(URCA_KPSS_CVAL[type], URCA_KPSS_PCT, stat, 2).y;   // kpss: reject -> difference
      return p < alpha;
    }
    var doIt = dodiff(cur);
    while (doIt && d < maxD) {
      d += 1; cur = diff(cur);
      if (isConstant(cur)) return d;
      doIt = dodiff(cur);
    }
    return d;
  }

  // ===== sample ACF / PACF (stats::acf / pacf) ===============================
  function acfDefaultLagMax(n) { return Math.floor(10 * Math.log(n) / Math.LN10); }
  // returns values[0..lagMax], values[0]=1
  function acf(x, lagMax) {
    var n = x.length, i, k;
    if (lagMax == null) lagMax = acfDefaultLagMax(n);
    lagMax = Math.min(lagMax, n - 1);
    var xbar = mean(x), c0 = 0;
    for (i = 0; i < n; i++) c0 += (x[i] - xbar) * (x[i] - xbar); c0 /= n;
    var out = [1];
    for (k = 1; k <= lagMax; k++) {
      var ck = 0;
      for (i = 0; i < n - k; i++) ck += (x[i] - xbar) * (x[i + k] - xbar);
      ck /= n;
      out.push(c0 > 0 ? ck / c0 : 0);
    }
    return { lagmax: lagMax, values: out };
  }
  // Durbin-Levinson recursion -> partial autocorrelations phi_kk, lags 1..lagMax
  function pacf(x, lagMax) {
    var a = acf(x, lagMax);
    var rho = a.values, L = a.lagmax;               // rho[0]=1, rho[k]=acf at lag k
    var phiPrev = [], phiCur, pac = [], k, j;
    for (k = 1; k <= L; k++) {
      phiCur = new Array(k + 1);
      if (k === 1) {
        phiCur[1] = rho[1];
      } else {
        var num = rho[k], den = 1;
        for (j = 1; j < k; j++) { num -= phiPrev[j] * rho[k - j]; den -= phiPrev[j] * rho[j]; }
        phiCur[k] = num / den;
        for (j = 1; j < k; j++) phiCur[j] = phiPrev[j] - phiCur[k] * phiPrev[k - j];
      }
      pac.push(phiCur[k]);
      phiPrev = phiCur;
    }
    return { lagmax: L, values: pac };
  }

  // ===== order-identification heuristic (guidance, NOT an R-verified number) =
  // Last significant lag (|value| > 1.96/sqrt(n)) before a run of insignificant
  // ones: PACF cutoff -> AR order p, ACF cutoff -> MA order q. Capped at 5.
  function suggestOrders(acfVals, pacfVals, n) {
    var bound = 1.96 / Math.sqrt(n), cap = 5, i;
    function cutoff(vals) {   // vals index 0 == lag 1
      var last = 0;
      for (i = 0; i < Math.min(vals.length, cap); i++) if (Math.abs(vals[i]) > bound) last = i + 1;
      return last;
    }
    return { p: cutoff(pacfVals), q: cutoff(acfVals), bound: bound };
  }

  // ===== master analyze for the page ========================================
  // Returns every displayed quantity + a combined ADF/KPSS verdict. alpha only
  // affects the verdict thresholds, matching R (the p-values are alpha-free).
  function analyze(x, opts) {
    opts = opts || {};
    var alpha = opts.alpha != null ? opts.alpha : 0.05;
    var kpssNull = opts.kpssNull || 'Level';
    var lshort = opts.lshort !== false;
    var ppType = opts.ppType || 'Z(t_alpha)';
    var n = x.length;
    if (n < 8) return { error: 'Paste at least 8 numeric observations - the stationarity tests need a minimum series length.' };
    if (isConstant(x)) {
      return {
        n: n, constant: true,
        verdict: { key: 'constant', label: 'Constant series', tone: 'ok' },
        d: 0,
        note: 'Every value is identical, so the series is trivially stationary and needs no differencing.'
      };
    }

    var adfR = adf(x, { k: opts.adfLag });
    var kpssR = kpss(x, { null_: kpssNull, lshort: lshort });
    var ppR = pp(x, { type: ppType, lshort: lshort });
    var d = ndiffs(x, { alpha: alpha, type: kpssNull === 'Trend' ? 'trend' : 'level' });
    var aacf = acf(x), apacf = pacf(x);
    var hint = suggestOrders(aacf.values.slice(1), apacf.values, n);

    // combined ADF/KPSS verdict at alpha. Clamp-aware: when a p-value is
    // pinned at the table's most-significant end (ADF/PP below the smallest
    // critical value -> oob<0; KPSS above the largest -> oob>0) the true p is
    // beyond 0.01, so it rejects at every offered alpha (>=0.01). The pinned
    // non-significant end never rejects. In range, compare p<alpha.
    function rejectUnitRoot(r) {   // ADF / PP: reject H0 = unit root
      if (!r || r.error || !isFinite(r.p)) return false;
      if (r.oob < 0) return true;
      if (r.oob > 0) return false;
      return r.p < alpha;
    }
    function rejectStationary(r) { // KPSS: reject H0 = stationary (inverted table)
      if (!r || r.error || !isFinite(r.p)) return false;
      if (r.oob > 0) return true;
      if (r.oob < 0) return false;
      return r.p < alpha;
    }
    var adfRej = rejectUnitRoot(adfR);    // reject unit root -> evidence of stationarity
    var kpssRej = rejectStationary(kpssR); // reject stationarity -> evidence against it
    var verdict;
    if (adfR && adfR.error) {
      verdict = { key: 'undef', label: 'Cannot test', tone: 'warn' };
    } else if (adfRej && !kpssRej) {
      verdict = { key: 'stationary', label: 'Stationary', tone: 'ok' };
    } else if (!adfRej && kpssRej) {
      verdict = { key: 'unitroot', label: 'Non-stationary (unit root)', tone: 'bad' };
    } else if (adfRej && kpssRej) {
      verdict = { key: 'trend', label: 'Trend-stationary (difference or detrend)', tone: 'warn' };
    } else {
      verdict = { key: 'ambiguous', label: 'Inconclusive (tests disagree)', tone: 'warn' };
    }

    return {
      n: n, alpha: alpha, kpssNull: kpssNull, ppType: ppType, lshort: lshort,
      adf: adfR, kpss: kpssR, pp: ppR, d: d,
      acf: aacf, pacf: apacf, hint: hint,
      adfRej: adfRej, kpssRej: kpssRej, verdict: verdict,
      mean: mean(x), variance: (function () { var m = mean(x), v = 0, i; for (i = 0; i < n; i++) v += (x[i] - m) * (x[i] - m); return v / (n - 1); })()
    };
  }

  return {
    sum: sum, mean: mean, diff: diff, cumsum: cumsum, embed: embed, approx: approx,
    ols: ols, longRunVar: longRunVar,
    adf: adf, kpss: kpss, pp: pp, ndiffs: ndiffs, urKpssStat: urKpssStat,
    acf: acf, pacf: pacf, acfDefaultLagMax: acfDefaultLagMax,
    isConstant: isConstant, suggestOrders: suggestOrders, analyze: analyze
  };
}));
