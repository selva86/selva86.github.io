/* correlation-math.js - exact correlation math for Tool Farm v2 (W2.2).
   Ground truth: R 4.6.0 stats::cor.test() (see
   Scripts/tool-truth/correlation-calculator.json). Reproduces R bit-for-bit:

     * Pearson   - r, t = sqrt(n-2) r / sqrt(1 - r^2), Fisher-z CI
                   (atanh, sigma = 1/sqrt(n-3)), one/two-sided p from t_{n-2}.
     * Spearman  - rho = cor(rank(x), rank(y)); S = (n^3-n)(1-rho)/6.
                   No ties & n<=1290: EXACT p via the AS 89 algorithm (prho.c,
                   Best & Roberts 1975) - exact permutation count for n<=9, the
                   Edgeworth series for 10<=n<=1290. Ties or larger n: the
                   asymptotic t_{n-2} approximation R falls back to (with the
                   "cannot compute exact p-value with ties" caveat surfaced
                   on-page).
     * Kendall   - tau-b (tie-corrected). No ties & n<50: EXACT p via the null
                   distribution recurrence (kendall.c ckendall/pkendall). Ties
                   or n>=50: the tie-corrected normal approximation.

   Composes ttest-math (t CDF/quantile) and normal-math (pnorm/qnorm).
   Browser global CorrelationMath + Node require. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports)
    module.exports = factory(require('./ttest-math.js'), require('./normal-math.js'));
  else root.CorrelationMath = factory(root.TTestMath, root.NormalMath);
}(typeof self !== 'undefined' ? self : this, function (T, N) {
  'use strict';

  /* ---------- basic vector helpers ---------- */
  function mean(a) { var s = 0, i; for (i = 0; i < a.length; i++) s += a[i]; return s / a.length; }

  // Pearson product-moment r == R cor(x, y).
  function pearsonR(x, y) {
    var n = x.length, mx = mean(x), my = mean(y), sxy = 0, sxx = 0, syy = 0, i, dx, dy;
    for (i = 0; i < n; i++) {
      dx = x[i] - mx; dy = y[i] - my;
      sxy += dx * dy; sxx += dx * dx; syy += dy * dy;
    }
    return sxy / Math.sqrt(sxx * syy);
  }

  // R rank(), ties.method = "average" (1-based).
  function rank(v) {
    var n = v.length, idx = v.map(function (_, i) { return i; });
    idx.sort(function (a, b) { return v[a] - v[b]; });
    var r = new Array(n), i = 0, j, k, avg;
    while (i < n) {
      j = i;
      while (j + 1 < n && v[idx[j + 1]] === v[idx[i]]) j++;
      avg = (i + j) / 2 + 1;
      for (k = i; k <= j; k++) r[idx[k]] = avg;
      i = j + 1;
    }
    return r;
  }

  function nDistinct(a) {
    var seen = {}, c = 0, i;
    for (i = 0; i < a.length; i++) if (seen[a[i]] === undefined) { seen[a[i]] = 1; c++; }
    return c;
  }
  // Sizes of tied groups (only groups with >= 2 members), like
  // table(x[duplicated(x)]) + 1 in R.
  function tieGroups(a) {
    var counts = {}, i, k, out = [];
    for (i = 0; i < a.length; i++) counts[a[i]] = (counts[a[i]] || 0) + 1;
    for (k in counts) if (counts[k] >= 2) out.push(counts[k]);
    return out;
  }

  /* ================= Pearson ================= */
  function pearson(x, y, alternative, conf) {
    var n = x.length, df = n - 2;
    var r = pearsonR(x, y);
    var t = Math.sqrt(df) * r / Math.sqrt(1 - r * r);   // +/-Inf when |r| = 1
    var pl = T.tCDF(t, df), pg = 1 - pl, p;
    if (alternative === 'less') p = pl;
    else if (alternative === 'greater') p = pg;
    else p = 2 * Math.min(pl, pg);
    var ci = null;
    if (n > 3) {
      var z = Math.atanh(r), sigma = 1 / Math.sqrt(n - 3), lo, hi;
      if (alternative === 'less') { lo = -Infinity; hi = z + sigma * N.qnorm(conf); }
      else if (alternative === 'greater') { lo = z - sigma * N.qnorm(conf); hi = Infinity; }
      else { var m = sigma * N.qnorm((1 + conf) / 2); lo = z - m; hi = z + m; }
      ci = [Math.tanh(lo), Math.tanh(hi)];
    }
    return { method: 'pearson', r: r, statistic: t, statName: 't', df: df,
             p: p, ci: ci, n: n, exact: false, ties: false };
  }

  /* ============ AS 89: exact/Edgeworth Spearman tail (prho.c) ============ */
  // Returns the tail probability of S that R's pspearman() wraps; `is` is the
  // integer S passed by cor.test (round(S) + 2*lowerTail).
  function prho(n, is, lowerTail) {
    var pv = lowerTail ? 0 : 1;
    if (n <= 1) return pv;
    if (is <= 0) return pv;
    var n3 = n; n3 = n3 * (n3 * n3 - 1) / 3;
    if (is > n3) return 1 - pv;
    if (n <= 9) {
      var nfac = 1, l = [], i, m, ise, n1, mt, ifr;
      for (i = 1; i <= n; i++) { nfac *= i; l[i - 1] = i; }
      if (is === n3) { ifr = 1; }
      else {
        ifr = 0;
        for (m = 0; m < nfac; m++) {
          ise = 0;
          for (i = 0; i < n; i++) { n1 = (i + 1) - l[i]; ise += n1 * n1; }
          if (is <= ise) ifr++;
          n1 = n;
          do {
            mt = l[0];
            for (i = 1; i < n1; i++) l[i - 1] = l[i];
            n1--;
            l[n1] = mt;
          } while (mt === n1 + 1 && n1 > 1);
        }
      }
      return (lowerTail ? nfac - ifr : ifr) / nfac;
    }
    // Edgeworth series (10 <= n <= 1290)
    var c1 = 0.2274, c2 = 0.2531, c3 = 0.1745, c4 = 0.0758, c5 = 0.1033,
        c6 = 0.3932, c7 = 0.0879, c8 = 0.0151, c9 = 0.0072, c10 = 0.0831,
        c11 = 0.0131, c12 = 4.6e-4;
    var y = n, b = 1 / y;
    var x = (6 * (is - 1) * b / (y * y - 1) - 1) * Math.sqrt(y - 1);
    y = x * x;
    var u = x * b * (c1 + b * (c2 + c3 * b) +
            y * (-c4 + b * (c5 + c6 * b) -
                 y * b * (c7 + c8 * b - y * (c9 - c10 * b + y * b * (c11 - c12 * y)))));
    y = u / Math.exp(y / 2);
    var pn = lowerTail ? N.pnorm(x) : (1 - N.pnorm(x));
    pv = (lowerTail ? -y : y) + pn;
    if (pv < 0) pv = 0;
    if (pv > 1) pv = 1;
    return pv;
  }

  /* ================= Spearman ================= */
  function spearman(x, y, alternative, conf, continuity) {
    var n = x.length;
    var rho = pearsonR(rank(x), rank(y));
    var ties = (nDistinct(x) < n) || (nDistinct(y) < n);
    var q = (n * n * n - n) * (1 - rho) / 6;   // S
    var exact = !ties && n <= 1290;
    var df = n - 2;
    function pspearman(qq, lower) {
      if (exact) return prho(n, Math.round(qq) + (lower ? 2 : 0), lower);
      var den = (n * (n * n - 1)) / 6; if (continuity) den += 1;
      var rr = 1 - qq / den;
      var tval = rr / Math.sqrt((1 - rr * rr) / df);
      // pt(tval, df, lower.tail = !lower)
      var lo = T.tCDF(tval, df);
      return lower ? (1 - lo) : lo;
    }
    var p;
    if (alternative === 'greater') p = pspearman(q, true);
    else if (alternative === 'less') p = pspearman(q, false);
    else {
      p = (q > (n * n * n - n) / 6) ? pspearman(q, false) : pspearman(q, true);
      p = Math.min(2 * p, 1);
    }
    return { method: 'spearman', r: rho, statistic: q, statName: 'S', df: null,
             p: p, ci: null, n: n, exact: exact, ties: ties };
  }

  /* ==== exact Kendall null distribution (kendall.c ckendall/pkendall) ==== */
  // cnt[m][k] = number of permutations of m items with k inversions.
  function inversionCounts(n) {
    var cnt = [null, [1]], m, umax, k, i, row, prev, s, plen;
    for (m = 2; m <= n; m++) {
      umax = m * (m - 1) / 2;
      prev = cnt[m - 1]; plen = prev.length;
      row = new Array(umax + 1);
      for (k = 0; k <= umax; k++) {
        s = 0;
        for (i = 0; i < m; i++) {   // sum_{i=0}^{m-1} prev[k-i]
          var idx = k - i;
          if (idx >= 0 && idx < plen) s += prev[idx];
        }
        row[k] = s;
      }
      cnt[m] = row;
    }
    return cnt;
  }
  function factorial(n) { var f = 1, i; for (i = 2; i <= n; i++) f *= i; return f; }
  // P(T <= q) for the exact Kendall statistic, per R's pkendall().
  function pKendall(q, n, cnt, nfac) {
    q = Math.floor(q + 1e-7);
    if (q < 0) return 0;
    var umax = n * (n - 1) / 2;
    if (q > umax) return 1;
    var p = 0, j, row = cnt[n];
    for (j = 0; j <= q; j++) p += row[j];
    return p / nfac;
  }

  /* ================= Kendall tau-b ================= */
  function kendall(x, y, alternative, continuity) {
    var n = x.length, i, j, nc = 0, nd = 0, sxij, syij, s;
    for (i = 0; i < n - 1; i++) for (j = i + 1; j < n; j++) {
      sxij = Math.sign(x[i] - x[j]); syij = Math.sign(y[i] - y[j]);
      s = sxij * syij;
      if (s > 0) nc++; else if (s < 0) nd++;
    }
    var n0 = n * (n - 1) / 2;
    var xg = tieGroups(x), yg = tieGroups(y);
    function sum(arr, f) { var t = 0, k; for (k = 0; k < arr.length; k++) t += f(arr[k]); return t; }
    var n1 = sum(xg, function (t) { return t * (t - 1) / 2; });
    var n2 = sum(yg, function (t) { return t * (t - 1) / 2; });
    var tau = (nc - nd) / Math.sqrt((n0 - n1) * (n0 - n2));
    var ties = (nDistinct(x) < n) || (nDistinct(y) < n);
    var exact = n < 50 && !ties;
    var p, statistic, statName;
    if (exact) {
      var q = Math.round((tau + 1) * n * (n - 1) / 4);
      statistic = q; statName = 'T';
      var cnt = inversionCounts(n), nfac = factorial(n);
      function pk(qq) { return pKendall(qq, n, cnt, nfac); }
      if (alternative === 'greater') p = 1 - pk(q - 1);
      else if (alternative === 'less') p = pk(q);
      else {
        p = (q > n * (n - 1) / 4) ? (1 - pk(q - 1)) : pk(q);
        p = Math.min(2 * p, 1);
      }
    } else {
      var T0 = n * (n - 1) / 2;
      var T1 = sum(xg, function (t) { return t * (t - 1); }) / 2;
      var T2 = sum(yg, function (t) { return t * (t - 1); }) / 2;
      var S = tau * Math.sqrt((T0 - T1) * (T0 - T2));
      var v0 = n * (n - 1) * (2 * n + 5);
      var vt = sum(xg, function (t) { return t * (t - 1) * (2 * t + 5); });
      var vu = sum(yg, function (t) { return t * (t - 1) * (2 * t + 5); });
      var v1 = sum(xg, function (t) { return t * (t - 1); }) * sum(yg, function (t) { return t * (t - 1); });
      var v2 = sum(xg, function (t) { return t * (t - 1) * (t - 2); }) *
               sum(yg, function (t) { return t * (t - 1) * (t - 2); });
      var varS = (v0 - vt - vu) / 18 + v1 / (2 * n * (n - 1)) + v2 / (9 * n * (n - 1) * (n - 2));
      if (continuity) S = Math.sign(S) * (Math.abs(S) - 1);
      var z = S / Math.sqrt(varS);
      statistic = z; statName = 'z';
      var lo = N.pnorm(z);
      if (alternative === 'greater') p = 1 - lo;
      else if (alternative === 'less') p = lo;
      else p = 2 * Math.min(lo, 1 - lo);
    }
    return { method: 'kendall', r: tau, statistic: statistic, statName: statName,
             df: null, p: p, ci: null, n: n, exact: exact, ties: ties };
  }

  /* ================= top-level ================= */
  // x, y may contain null/NaN/non-finite: pairs are dropped (R complete.cases).
  function clean(x, y) {
    var xs = [], ys = [], i, a, b;
    var m = Math.min(x.length, y.length);
    for (i = 0; i < m; i++) {
      a = x[i]; b = y[i];
      if (a == null || b == null) continue;
      a = +a; b = +b;
      if (!isFinite(a) || !isFinite(b)) continue;
      xs.push(a); ys.push(b);
    }
    return { x: xs, y: ys };
  }

  function analyze(x, y, opts) {
    opts = opts || {};
    var method = opts.method || 'pearson';
    var alternative = opts.alternative || 'two.sided';
    var conf = opts.conf == null ? 0.95 : opts.conf;
    var continuity = !!opts.continuity;
    var c = clean(x, y), n = c.x.length;
    var minN = method === 'pearson' ? 3 : 2;
    if (n < minN) {
      return { error: 'need at least ' + minN + ' complete pairs', method: method, n: n };
    }
    if (nDistinct(c.x) < 2 || nDistinct(c.y) < 2) {
      return { error: 'a variable has zero variance (all values equal)', method: method, n: n };
    }
    if (method === 'spearman') return spearman(c.x, c.y, alternative, conf, continuity);
    if (method === 'kendall') return kendall(c.x, c.y, alternative, continuity);
    return pearson(c.x, c.y, alternative, conf);
  }

  return {
    mean: mean, pearsonR: pearsonR, rank: rank, tieGroups: tieGroups, nDistinct: nDistinct,
    prho: prho, pKendall: pKendall, inversionCounts: inversionCounts, factorial: factorial,
    pearson: pearson, spearman: spearman, kendall: kendall,
    clean: clean, analyze: analyze
  };
}));
