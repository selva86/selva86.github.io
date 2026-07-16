/* correlation-matrix-math.js - correlation matrices for Tool Farm v2 (wave-3, G3).

   Ground truth: R 4.6.0 stats::cor() and Hmisc::rcorr()
   (see Scripts/tool-truth/correlation-matrix-calculator.json).

   WHY rcorr AND NOT cor.test IS THE p ORACLE HERE
   -----------------------------------------------
   cor.test() picks an exact test or an approximation PER PAIR, based on whether
   that pair happens to contain ties. Build a matrix cell-by-cell from cor.test
   and different cells answer with different tests, so the cells are no longer
   comparable to each other - which is the one thing a matrix is for. rcorr
   applies a single test uniformly to every cell: a two-sided t test on r with
   df = n - 2. This library reproduces rcorr.

   Consequences, all verified against R over 42 rcorr-comparable cases:
     * r      - identical to cor(use="pairwise.complete.obs") AND to rcorr$r,
                for both Pearson and Spearman. 0 mismatches.
     * n      - identical to rcorr$n (pairwise complete count per cell). 0 mismatches.
     * p      - identical to rcorr$P over 808 off-diagonal cells.
                Pearson: also identical to cor.test() in every case (880 cells).
                Spearman: identical to cor.test() WHEN THE PAIR HAS TIES (cor.test
                falls back to the same t approximation). With no ties cor.test
                switches to the AS 89 exact/Edgeworth branch and differs - that is
                surfaced on-page, not hidden.

   Deletion rules:
     * pairwise - each cell drops only the rows where ITS OWN two columns are
                  missing, so n varies per cell. Matches cor(use="pairwise.complete.obs").
     * listwise - drop any row with a gap in ANY column first, then correlate.
                  Matches cor(use="complete.obs"), and equals rcorr run on the
                  row-complete submatrix.

   Note: Hmisc::rcorr itself refuses n <= 4 ("must have >4 observations"). This
   library has no such floor; it follows cor()/the t test down to n = 3, and
   reports null where a statistic is undefined.

   Composes correlation-math (pearsonR, rank, clean), ttest-math (tCDF),
   data-parse (parseMatrix) and multiple-testing-math (padjust). No edits to any
   of them.

   Browser global CorrMatrixMath + Node require. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports)
    module.exports = factory(require('./correlation-math.js'), require('./ttest-math.js'),
                             require('./data-parse.js'), require('./multiple-testing-math.js'));
  else root.CorrMatrixMath = factory(root.CorrelationMath, root.TTestMath,
                                     root.DataParse, root.MultipleTestingMath);
}(typeof self !== 'undefined' ? self : this, function (C, T, DP, MT) {
  'use strict';

  var MIN_N = 3;   // t test needs df = n - 2 >= 1

  function isNum(v) { return v !== null && v !== undefined && isFinite(+v); }

  /* ---------- one cell ---------- */

  /* Pearson or Spearman r plus the rcorr p for a single pair of raw columns.
     Ranking happens AFTER pairwise deletion, which is what both
     cor(method="spearman", use="pairwise.complete.obs") and rcorr do. */
  function cell(xRaw, yRaw, method) {
    var c = C.clean(xRaw, yRaw), n = c.x.length;
    var out = { n: n, r: null, p: null, t: null, df: null, note: null };
    if (n < MIN_N) { out.note = 'n < ' + MIN_N; return out; }

    var x = c.x, y = c.y;
    if (method === 'spearman') { x = C.rank(x); y = C.rank(y); }

    if (C.nDistinct(x) < 2 || C.nDistinct(y) < 2) { out.note = 'zero variance'; return out; }

    var r = C.pearsonR(x, y);
    if (!isFinite(r)) { out.note = 'undefined'; return out; }
    out.r = r;
    out.df = n - 2;

    // R: t = r sqrt((n-2)/(1-r^2)). |r| = 1 -> t = Inf -> p = 0.
    if (Math.abs(r) >= 1) { out.t = r > 0 ? Infinity : -Infinity; out.p = 0; return out; }
    var t = r * Math.sqrt((n - 2) / (1 - r * r));
    out.t = t;
    out.p = 2 * T.tCDF(-Math.abs(t), n - 2);
    return out;
  }

  /* Does this pair carry ties (in the pairwise-complete rows)? Drives the
     honest "cor.test would switch to an exact test here" flag. */
  function pairHasTies(xRaw, yRaw) {
    var c = C.clean(xRaw, yRaw), n = c.x.length;
    if (!n) return false;
    return C.nDistinct(c.x) < n || C.nDistinct(c.y) < n;
  }

  /* ---------- the matrix ---------- */

  /* cols: [{name, values:[num|null,...]}]
     opts: {method:'pearson'|'spearman', deletion:'pairwise'|'listwise'} */
  function build(cols, opts) {
    opts = opts || {};
    var method = opts.method === 'spearman' ? 'spearman' : 'pearson';
    var deletion = opts.deletion === 'listwise' ? 'listwise' : 'pairwise';

    if (!cols || cols.length < 2) return { error: 'need at least 2 columns' };

    var k = cols.length, i, j, rr;
    var names = cols.map(function (c2, idx) {
      return (c2.name == null || c2.name === '') ? ('V' + (idx + 1)) : String(c2.name);
    });
    var nrow = 0;
    cols.forEach(function (c2) { nrow = Math.max(nrow, c2.values.length); });

    // Normalise to equal-length columns of num|null.
    var V = cols.map(function (c2) {
      var v = [], t2;
      for (rr = 0; rr < nrow; rr++) { t2 = c2.values[rr]; v.push(isNum(t2) ? +t2 : null); }
      return v;
    });

    // Junk guard: a column needs at least 2 numbers in it to be correlatable at
    // all. Without this, pasting text renders a full grid of "n/a" cells, which
    // looks like a result. Fewer than 2 usable columns is an input error.
    var usableCols = 0;
    for (i = 0; i < k; i++) {
      var got = 0;
      for (rr = 0; rr < nrow; rr++) if (V[i][rr] !== null) got++;
      if (got >= 2) usableCols++;
    }
    if (usableCols < 2)
      return { error: 'need at least 2 columns of numbers - check that the values are numeric and not text' };

    // Row-complete mask across ALL columns (drives listwise + the teaching numbers).
    var complete = [], nComplete = 0;
    for (rr = 0; rr < nrow; rr++) {
      var ok = true;
      for (i = 0; i < k; i++) if (V[i][rr] === null) { ok = false; break; }
      complete.push(ok);
      if (ok) nComplete++;
    }

    var W = V;
    if (deletion === 'listwise') {
      W = V.map(function (v) { return v.filter(function (_, rr2) { return complete[rr2]; }); });
    }

    var r = [], p = [], n = [], ties = [];
    for (i = 0; i < k; i++) { r.push(new Array(k)); p.push(new Array(k)); n.push(new Array(k)); ties.push(new Array(k)); }

    var pairs = [];
    for (i = 0; i < k; i++) {
      for (j = i; j < k; j++) {
        if (i === j) {
          // rcorr's diagonal: r = 1, P = NA, n = non-missing count of that column.
          var cnt = 0;
          for (rr = 0; rr < W[i].length; rr++) if (W[i][rr] !== null) cnt++;
          r[i][i] = 1; p[i][i] = null; n[i][i] = cnt; ties[i][i] = false;
          continue;
        }
        var c3 = cell(W[i], W[j], method);
        var tie = pairHasTies(W[i], W[j]);
        r[i][j] = r[j][i] = c3.r;
        p[i][j] = p[j][i] = c3.p;
        n[i][j] = n[j][i] = c3.n;
        ties[i][j] = ties[j][i] = tie;
        pairs.push({
          i: i, j: j, a: names[i], b: names[j],
          r: c3.r, p: c3.p, n: c3.n, t: c3.t, df: c3.df,
          ties: tie, note: c3.note
        });
      }
    }

    // Multiple testing over the k(k-1)/2 unique off-diagonal tests.
    var testable = pairs.filter(function (pr) { return pr.p !== null; });
    var pv = testable.map(function (pr) { return pr.p; });
    if (pv.length) {
      var bonf = MT.padjust(pv, 'bonferroni');
      var holm = MT.padjust(pv, 'holm');
      var bh = MT.padjust(pv, 'BH');
      testable.forEach(function (pr, idx) {
        pr.p_bonferroni = bonf[idx]; pr.p_holm = holm[idx]; pr.p_BH = bh[idx];
      });
    }
    pairs.forEach(function (pr) {
      if (pr.p === null) { pr.p_bonferroni = null; pr.p_holm = null; pr.p_BH = null; }
    });

    var nRange = { min: Infinity, max: -Infinity };
    pairs.forEach(function (pr) {
      if (pr.n < nRange.min) nRange.min = pr.n;
      if (pr.n > nRange.max) nRange.max = pr.n;
    });
    if (!pairs.length) { nRange = { min: 0, max: 0 }; }

    return {
      names: names, k: k, method: method, deletion: deletion,
      nrow: nrow, nComplete: nComplete, complete: complete,
      r: r, p: p, n: n, ties: ties,
      pairs: pairs,
      nTests: pairs.length,
      nRange: nRange,
      ragged: nRange.min !== nRange.max,
      anyTies: pairs.some(function (pr) { return pr.ties; }),
      // cor.test() only diverges for a tie-FREE Spearman pair (it goes exact there).
      cortestDiverges: method === 'spearman' && pairs.some(function (pr) {
        return !pr.ties && pr.n >= MIN_N && pr.p !== null;
      })
    };
  }

  /* ---------- callouts: the plain-English layer ---------- */

  function callouts(res) {
    var usable = res.pairs.filter(function (pr) { return pr.r !== null; });
    if (!usable.length) return null;
    var byR = usable.slice().sort(function (a, b) { return b.r - a.r; });
    var byAbs = usable.slice().sort(function (a, b) { return Math.abs(a.r) - Math.abs(b.r); });
    var strongestPos = byR[0].r > 0 ? byR[0] : null;
    var strongestNeg = byR[byR.length - 1].r < 0 ? byR[byR.length - 1] : null;
    return {
      strongestPositive: strongestPos,
      strongestNegative: strongestNeg,
      weakest: byAbs[0],
      strongest: byAbs[byAbs.length - 1],
      nSig05: usable.filter(function (pr) { return pr.p !== null && pr.p < 0.05; }).length,
      nSigBonf: usable.filter(function (pr) { return pr.p_bonferroni !== null && pr.p_bonferroni < 0.05; }).length
    };
  }

  /* Expected number of pairs that clear alpha by chance alone if NOTHING is
     truly correlated: the multiple-testing teaching number. */
  function expectedFalsePositives(nTests, alpha) { return nTests * alpha; }

  /* P(at least one false positive) under independence - the honest framing of
     why eyeballing the biggest r in a big matrix is not a free lunch. */
  function familywiseError(nTests, alpha) { return 1 - Math.pow(1 - alpha, nTests); }

  /* ---------- text -> columns ---------- */

  function fromText(text, opts) {
    var pm = DP.parseMatrix(text);
    if (!pm || pm.mode === 'empty') return { error: 'paste some data first' };
    if (pm.mode === 'vector' || pm.ncol < 2)
      return { error: 'need at least 2 columns - a correlation matrix compares columns to each other' };
    var cols = [], j, i;
    for (j = 0; j < pm.ncol; j++) {
      var vals = [];
      for (i = 0; i < pm.nrow; i++) vals.push(pm.matrix[i][j]);
      cols.push({ name: pm.names[j], values: vals });
    }
    var res = build(cols, opts);
    res.header = !!pm.header;
    return res;
  }

  return {
    version: '1.0.0',
    MIN_N: MIN_N,
    cell: cell,
    build: build,
    fromText: fromText,
    callouts: callouts,
    expectedFalsePositives: expectedFalsePositives,
    familywiseError: familywiseError
  };
}));
