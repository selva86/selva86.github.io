/* vif-math.js - variance-inflation-factor / multicollinearity math for Tool Farm v2.
   Ground truth: R 4.6.0 car::vif() and base::kappa() (see
   Scripts/tool-truth/vif-interpreter.json). Standalone: no library deps.

   Key identities (verified to 1e-6 against R):
     VIF_j          = diag(solve(R))[j]            where R = cor(predictors)
     tolerance_j    = 1 / VIF_j
     SE inflation   = sqrt(VIF_j)
     condition no.  = sqrt(max(eig(R)) / min(eig(R)))  == kappa(scale(X), exact=TRUE)
     comparable VIF = (GVIF^(1/(2*Df)))^2             (Fox & Monette 1992) */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.VIFMath = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ---- inverse of a square matrix via Gauss-Jordan with partial pivoting ----
  // Returns null when the matrix is singular (perfect collinearity).
  function invertMatrix(M) {
    var n = M.length, i, j, k, r, c, rr, cc;
    var A = [];
    for (i = 0; i < n; i++) {
      if (M[i].length !== n) return null;
      A.push(M[i].slice());
      for (j = 0; j < n; j++) A[i].push(i === j ? 1 : 0);
    }
    for (k = 0; k < n; k++) {
      var maxRow = k, maxVal = Math.abs(A[k][k]);
      for (r = k + 1; r < n; r++) {
        if (Math.abs(A[r][k]) > maxVal) { maxVal = Math.abs(A[r][k]); maxRow = r; }
      }
      if (maxVal < 1e-12) return null;
      if (maxRow !== k) { var tmp = A[k]; A[k] = A[maxRow]; A[maxRow] = tmp; }
      var piv = A[k][k];
      for (c = 0; c < 2 * n; c++) A[k][c] /= piv;
      for (rr = 0; rr < n; rr++) {
        if (rr === k) continue;
        var fac = A[rr][k];
        if (fac === 0) continue;
        for (cc = 0; cc < 2 * n; cc++) A[rr][cc] -= fac * A[k][cc];
      }
    }
    var inv = [];
    for (i = 0; i < n; i++) inv.push(A[i].slice(n));
    return inv;
  }

  // ---- eigenvalues of a symmetric matrix via cyclic Jacobi rotation ----
  // Returns eigenvalues sorted descending. Exact to ~1e-12 for well-scaled R.
  function eigenvaluesSym(M) {
    var n = M.length, i, j, k;
    var A = M.map(function (row) { return row.slice(); });
    for (var iter = 0; iter < 200; iter++) {
      var p = 0, q = 1, max = 0;
      for (i = 0; i < n; i++) {
        for (j = i + 1; j < n; j++) {
          if (Math.abs(A[i][j]) > max) { max = Math.abs(A[i][j]); p = i; q = j; }
        }
      }
      if (max < 1e-14) break;
      var theta;
      if (Math.abs(A[p][p] - A[q][q]) < 1e-14) theta = Math.PI / 4;
      else theta = 0.5 * Math.atan2(2 * A[p][q], A[p][p] - A[q][q]);
      var cs = Math.cos(theta), sn = Math.sin(theta);
      var App = cs * cs * A[p][p] + 2 * cs * sn * A[p][q] + sn * sn * A[q][q];
      var Aqq = sn * sn * A[p][p] - 2 * cs * sn * A[p][q] + cs * cs * A[q][q];
      A[p][p] = App; A[q][q] = Aqq; A[p][q] = 0; A[q][p] = 0;
      for (k = 0; k < n; k++) {
        if (k === p || k === q) continue;
        var Apk = cs * A[p][k] + sn * A[q][k];
        var Aqk = -sn * A[p][k] + cs * A[q][k];
        A[p][k] = Apk; A[k][p] = Apk; A[q][k] = Aqk; A[k][q] = Aqk;
      }
    }
    var eig = [];
    for (i = 0; i < n; i++) eig.push(A[i][i]);
    eig.sort(function (a, b) { return b - a; });
    return eig;
  }

  // ---- condition number sqrt(lambda_max / lambda_min) of a correlation matrix ----
  function conditionNumber(R) {
    var ev = eigenvaluesSym(R);
    var lmax = ev[0], lmin = ev[ev.length - 1];
    return (lmin > 1e-12) ? Math.sqrt(lmax / lmin) : Infinity;
  }

  // ---- VIFs from a predictor correlation matrix ----
  // Returns { vifs, eigenvalues, cond } or { error } when singular.
  function vifFromCor(R) {
    if (!R || R.length < 2) return { error: 'Need at least 2 predictors to compute VIFs.' };
    var inv = invertMatrix(R);
    var ev = eigenvaluesSym(R);
    var lmin = ev[ev.length - 1];
    var cond = (lmin > 1e-12) ? Math.sqrt(ev[0] / lmin) : Infinity;
    if (!inv) return { error: 'Predictor correlation matrix is singular - perfect collinearity.', eigenvalues: ev, cond: cond };
    var vifs = [];
    for (var d = 0; d < R.length; d++) vifs.push(inv[d][d]);
    return { vifs: vifs, eigenvalues: ev, cond: cond };
  }

  // ---- Pearson correlation matrix from raw predictor columns ----
  // cols: array of equal-length numeric arrays (one per predictor).
  // Matches R's cor() to ~1e-12 (two-pass, mean-centred cross products).
  function corMatrix(cols) {
    var p = cols.length, n = p ? cols[0].length : 0, i, j, k;
    var mean = [], sd = [];
    for (i = 0; i < p; i++) {
      var s = 0; for (k = 0; k < n; k++) s += cols[i][k];
      mean.push(s / n);
    }
    for (i = 0; i < p; i++) {
      var ss = 0; for (k = 0; k < n; k++) { var d = cols[i][k] - mean[i]; ss += d * d; }
      sd.push(Math.sqrt(ss));
    }
    var R = [];
    for (i = 0; i < p; i++) {
      R.push(new Array(p));
      for (j = 0; j < p; j++) R[i][j] = (i === j) ? 1 : 0;
    }
    for (i = 0; i < p; i++) {
      for (j = i + 1; j < p; j++) {
        var cov = 0;
        for (k = 0; k < n; k++) cov += (cols[i][k] - mean[i]) * (cols[j][k] - mean[j]);
        var denom = sd[i] * sd[j];
        var r = denom > 0 ? cov / denom : NaN;
        R[i][j] = r; R[j][i] = r;
      }
    }
    return R;
  }

  // ---- VIFs straight from raw predictor columns ----
  // Returns { R, vifs, eigenvalues, cond } or { error, R } when singular.
  function vifFromData(cols) {
    if (!cols || cols.length < 2) return { error: 'Need at least 2 predictor columns to compute VIFs.' };
    var n = cols[0].length;
    for (var i = 0; i < cols.length; i++) {
      if (cols[i].length !== n) return { error: 'Predictor columns have unequal lengths after dropping missing rows.' };
    }
    var R = corMatrix(cols);
    // zero-variance column -> NaN row in R -> not usable
    for (i = 0; i < R.length; i++) {
      if (!isFinite(R[i][i]) || R.some(function (row) { return !isFinite(row[i]); })) {
        return { error: 'A predictor has zero variance (all values identical); VIF is undefined for it.', R: R };
      }
    }
    var res = vifFromCor(R);
    res.R = R;
    return res;
  }

  // ---- reduce a correlation matrix to a subset of indices (keep, in order) ----
  function subMatrix(R, keep) {
    return keep.map(function (i) { return keep.map(function (j) { return R[i][j]; }); });
  }

  // ---- aliased (perfectly dependent) columns of a correlation matrix ----
  // Pivoted Cholesky with a rank check: a column whose residual variance after
  // projecting onto the earlier kept columns is ~0 is an exact linear
  // combination of them (mirrors R's alias(): the later term of a dependent
  // set is flagged, earlier terms kept). Returns an array of 0-based indices.
  function aliasedColumns(R, tol) {
    tol = tol || 1e-8;
    var n = R.length, L = [], kept = [], aliased = [], i, k, m;
    for (i = 0; i < n; i++) L.push(new Array(n).fill(0));
    for (k = 0; k < n; k++) {
      var d = R[k][k];
      for (m = 0; m < kept.length; m++) { var kk = kept[m]; d -= L[k][kk] * L[k][kk]; }
      if (d <= tol) { aliased.push(k); continue; }
      var Lkk = Math.sqrt(d);
      L[k][k] = Lkk;
      for (i = k + 1; i < n; i++) {
        var v = R[i][k];
        for (m = 0; m < kept.length; m++) { var kj = kept[m]; v -= L[i][kj] * L[k][kj]; }
        L[i][k] = v / Lkk;
      }
      kept.push(k);
    }
    return aliased;
  }

  // ---- greedy minimal drop-set: keep dropping the highest-VIF predictor until
  // every remaining VIF is below `threshold` (or fewer than 2 predictors left).
  // Operates on a correlation matrix R with named predictors. Returns
  // { drop:[names], keep:[names], vifs:[remaining], cond, singular }.
  function greedyDropSet(R, names, threshold) {
    var keepIdx = names.map(function (_, i) { return i; });
    var dropped = [];
    for (var guard = 0; guard < names.length; guard++) {
      if (keepIdx.length < 2) break;
      var sub = subMatrix(R, keepIdx);
      var res = vifFromCor(sub);
      if (res.error) {
        // singular subset: drop an aliased column, then continue.
        var al = aliasedColumns(sub);
        if (!al.length) break;
        var gi = keepIdx[al[al.length - 1]];
        dropped.push(names[gi]);
        keepIdx = keepIdx.filter(function (x) { return x !== gi; });
        continue;
      }
      var maxV = -Infinity, maxLocal = -1;
      res.vifs.forEach(function (v, i) {
        var vv = isFinite(v) ? v : 1e18;
        if (vv > maxV) { maxV = vv; maxLocal = i; }
      });
      if (maxV < threshold) break;               // all remaining under threshold
      var globalI = keepIdx[maxLocal];
      dropped.push(names[globalI]);
      keepIdx = keepIdx.filter(function (x) { return x !== globalI; });
    }
    var keepNames = keepIdx.map(function (i) { return names[i]; });
    var finalRes = keepIdx.length >= 2 ? vifFromCor(subMatrix(R, keepIdx)) : { vifs: [], cond: null };
    return {
      drop: dropped,
      keep: keepNames,
      vifs: finalRes.error ? [] : finalRes.vifs,
      cond: finalRes.error ? Infinity : finalRes.cond,
      singular: !!finalRes.error
    };
  }

  function tolerance(v) { return (isFinite(v) && v > 0) ? 1 / v : 0; }
  function seInflation(v) { return (isFinite(v) && v > 0) ? Math.sqrt(v) : Infinity; }

  // Square the reported GVIF^(1/(2*Df)) to a VIF comparable to the usual thresholds.
  function gvifComparable(adj) { return adj * adj; }

  // Traffic-light flag for a VIF against (low, high) thresholds.
  function flag(v, low, high) {
    if (!isFinite(v)) return 'red';
    if (v < low) return 'green';
    if (v < high) return 'yellow';
    return 'red';
  }

  return {
    invertMatrix: invertMatrix,
    eigenvaluesSym: eigenvaluesSym,
    conditionNumber: conditionNumber,
    vifFromCor: vifFromCor,
    corMatrix: corMatrix,
    vifFromData: vifFromData,
    subMatrix: subMatrix,
    aliasedColumns: aliasedColumns,
    greedyDropSet: greedyDropSet,
    tolerance: tolerance,
    seInflation: seInflation,
    gvifComparable: gvifComparable,
    flag: flag
  };
}));
