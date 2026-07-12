/* multiple-testing-math.js  -  p-value adjustment, verified against R's stats::p.adjust().
   Ground truth: Scripts/tool-truth/multiple-testing-correction.json (base R 4.6.0).

   Implements every method p.adjust supports, matching it to machine precision,
   including the family-size argument n (>= number of p-values):
     bonferroni | holm | hochberg | hommel | BH (fdr) | BY

   Faithful port of R's algorithm, including the quirks that inline reimplementations
   miss: holm/hochberg use the family size n in the multiplier while ranking over the
   supplied p's; BY's harmonic factor is sum(1/1..n) over n (not the sample count);
   and hommel PADS the p-vector with 1's up to n before running, then slices back.

   UMD: browser global (window.MultipleTestingMath) + Node require. Self-contained. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MultipleTestingMath = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var METHOD_KEYS = ['bonferroni', 'holm', 'hochberg', 'hommel', 'BH', 'BY'];

  // R's order(): stable sort of indices. JS Array.sort is stable (ES2019+),
  // so ties keep ascending original-index order, matching R for both directions.
  function orderIdx(a, decreasing) {
    var idx = a.map(function (_, i) { return i; });
    idx.sort(function (x, y) { return decreasing ? (a[y] - a[x]) : (a[x] - a[y]); });
    return idx;
  }
  function inverseOrder(o) {
    var ro = new Array(o.length);
    for (var k = 0; k < o.length; k++) ro[o[k]] = k;
    return ro;
  }
  function cummax(a) {
    var out = a.slice();
    for (var i = 1; i < out.length; i++) if (out[i - 1] > out[i]) out[i] = out[i - 1];
    return out;
  }
  function cummin(a) {
    var out = a.slice();
    for (var i = 1; i < out.length; i++) if (out[i - 1] < out[i]) out[i] = out[i - 1];
    return out;
  }
  function min1(a) { return a.map(function (v) { return v < 1 ? v : 1; }); }

  // sum(1/(1:n)) - the BY / Benjamini-Yekutieli harmonic factor c(m).
  function harmonicSum(n) {
    var s = 0;
    for (var k = 1; k <= n; k++) s += 1 / k;
    return s;
  }

  // Core: adjusted p-values for one method. Mirrors stats::p.adjust(p, method, n).
  // p: array of raw p-values (finite, in [0,1]). n: family size (default p.length).
  function padjust(p, method, n) {
    method = String(method).toLowerCase();
    if (method === 'fdr') method = 'bh';
    var lp = p.length;
    if (n === undefined || n === null) n = lp;
    n = Math.round(n);
    if (n < lp) throw new Error('family size n must be >= number of p-values');
    var p0 = p.slice();
    if (n <= 1) return p0;                        // R: return unchanged
    if (n === 2 && method === 'hommel') method = 'hochberg';

    var o, ro, t, cm, ps, i;

    if (method === 'bonferroni') {
      return p.map(function (v) { return Math.min(1, n * v); });
    }
    if (method === 'none') {
      return p.slice();
    }
    if (method === 'holm') {
      o = orderIdx(p, false);
      ro = inverseOrder(o);
      t = o.map(function (oi, k) { return (n - (k + 1) + 1) * p[oi]; });   // i = k+1
      cm = min1(cummax(t));
      return ro.map(function (r) { return cm[r]; });
    }
    if (method === 'hochberg') {
      o = orderIdx(p, true);                        // decreasing
      ro = inverseOrder(o);
      t = o.map(function (oi, k) { return (n - (lp - k) + 1) * p[oi]; });   // i = lp-k
      cm = min1(cummin(t));
      return ro.map(function (r) { return cm[r]; });
    }
    if (method === 'bh') {
      o = orderIdx(p, true);
      ro = inverseOrder(o);
      t = o.map(function (oi, k) { return (n / (lp - k)) * p[oi]; });       // i = lp-k
      cm = min1(cummin(t));
      return ro.map(function (r) { return cm[r]; });
    }
    if (method === 'by') {
      o = orderIdx(p, true);
      ro = inverseOrder(o);
      var q = harmonicSum(n);
      t = o.map(function (oi, k) { return (q * n / (lp - k)) * p[oi]; });
      cm = min1(cummin(t));
      return ro.map(function (r) { return cm[r]; });
    }
    if (method === 'hommel') {
      // R pads p to length n with 1's, runs the full procedure on n values,
      // then returns the first lp of the reordered result.
      var pp = p.slice();
      for (i = 0; i < n - lp; i++) pp.push(1);
      var N = n;
      o = orderIdx(pp, false);                      // ascending, length N
      ro = inverseOrder(o);
      ps = o.map(function (oi) { return pp[oi]; });  // sorted ascending
      var init = Infinity;
      for (i = 0; i < N; i++) { var v0 = N * ps[i] / (i + 1); if (v0 < init) init = v0; }
      var qv = new Array(N).fill(init);
      var pa = new Array(N).fill(init);
      for (var m = N - 1; m >= 2; m--) {
        var q1 = Infinity, denom = 2, idx;
        for (idx = N - m + 1; idx <= N - 1; idx++) {          // i2
          var v1 = m * ps[idx] / denom; if (v1 < q1) q1 = v1; denom++;
        }
        for (idx = 0; idx <= N - m; idx++) {                  // i1
          qv[idx] = Math.min(m * ps[idx], q1);
        }
        for (idx = N - m + 1; idx <= N - 1; idx++) {          // i2 <- q[n-m+1]
          qv[idx] = qv[N - m];
        }
        for (i = 0; i < N; i++) if (qv[i] > pa[i]) pa[i] = qv[i];
      }
      var full = new Array(N);
      for (i = 0; i < N; i++) full[i] = Math.max(pa[i], ps[i]);   // no pmin(1,.) in R hommel
      var out = new Array(lp);
      for (i = 0; i < lp; i++) out[i] = full[ro[i]];
      return out;
    }
    throw new Error('unknown method: ' + method);
  }

  // Adjusted vectors for every method at once (for the side-by-side comparison).
  function adjustAll(p, n) {
    var res = {};
    for (var i = 0; i < METHOD_KEYS.length; i++) {
      res[METHOD_KEYS[i]] = padjust(p, METHOD_KEYS[i], n);
    }
    return res;
  }

  // Count how many adjusted p-values survive at level alpha.
  function countRejected(adj, alpha) {
    var c = 0;
    for (var i = 0; i < adj.length; i++) if (adj[i] <= alpha) c++;
    return c;
  }

  // Parse a free-form textarea into a clean numeric p-vector (0..1 inclusive).
  // Tolerates commas, semicolons, whitespace, newlines; silently drops junk.
  function parsePvals(text) {
    if (!text) return [];
    var tokens = String(text).split(/[\s,;]+/);
    var out = [];
    for (var i = 0; i < tokens.length; i++) {
      var tk = tokens[i];
      if (!tk.length) continue;
      var v = parseFloat(tk);
      if (isFinite(v) && v >= 0 && v <= 1) out.push(v);
    }
    return out;
  }

  return {
    padjust: padjust,
    adjustAll: adjustAll,
    countRejected: countRejected,
    parsePvals: parsePvals,
    harmonicSum: harmonicSum,
    METHOD_KEYS: METHOD_KEYS
  };
}));
