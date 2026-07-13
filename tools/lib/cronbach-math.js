/* cronbach-math.js - Cronbach's alpha and item statistics for Tool Farm v2.
   Ground truth: psych::alpha() 2.6.5 on R 4.6.0 (see
   Scripts/tool-truth/cronbachs-alpha-calculator.json). Reproduces, bit for bit:

     raw_alpha  = (1 - tr(C)/sum(C)) * k/(k-1)          from the covariance matrix
     std.alpha  = (1 - k/sum(R))    * k/(k-1)           from the correlation matrix
     G6(smc)    = 1 - (k - sum(smc))/sum(R)             Guttman's lambda 6
     average_r  = (sum(R) - k)/(k*(k-1))                mean inter-item correlation
     S/N        = k*av.r/(1 - av.r)
     ase        = sqrt(Q/n)   with Feldt-Woodruff-Salih Q term
     item stats = n, raw.r (item-total), std.r, r.cor, r.drop (item-rest), mean, sd
     alpha.drop = alpha.1 on the sub-matrix with each item removed
     Feldt CI   = 1 - (1 - alpha)*qf(1 - p/2 | p/2, n-1, (n-1)(k-1))

   Missing data: use = "pairwise" (each covariance from its complete pairs) or
   "complete.obs" (listwise: rows complete across all kept items). Zero-variance
   items are dropped like psych (delete = TRUE) and folded back into the total.
   smc(R) uses a symmetric pseudo-inverse (Jacobi eigen) that matches psych's
   SVD-based Pinv, including rank-deficient matrices.

   qf is reused from dist-tables-math.js (verified vs R's qf across 600+ cases).
   Browser: window.CronbachMath (needs NormalMath + TTestMath + DistTablesMath
   loaded first). Node: require('./cronbach-math.js'). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./dist-tables-math.js'));
  } else {
    root.CronbachMath = factory(root.DistTablesMath);
  }
}(typeof self !== 'undefined' ? self : this, function (D) {
  'use strict';

  var qf = D.qf;
  var EPS = Math.sqrt(2.220446049250313e-16);   // sqrt(.Machine$double.eps)

  // ---------- small numeric helpers -----------------------------------------
  function isNum(v) { return v !== null && v !== undefined && typeof v === 'number' && isFinite(v); }
  function sumArr(a) { var s = 0, i; for (i = 0; i < a.length; i++) s += a[i]; return s; }
  function meanArr(a) { return a.length ? sumArr(a) / a.length : NaN; }
  function sampVar(a) {                       // R var(): denominator n-1
    var n = a.length; if (n < 2) return NaN;
    var m = meanArr(a), s = 0, i;
    for (i = 0; i < n; i++) s += (a[i] - m) * (a[i] - m);
    return s / (n - 1);
  }
  function sampSd(a) { var v = sampVar(a); return isNum(v) ? Math.sqrt(v) : NaN; }
  function median(a) {
    var b = a.slice().sort(function (x, y) { return x - y; }), n = b.length;
    if (!n) return NaN;
    return n % 2 ? b[(n - 1) / 2] : (b[n / 2 - 1] + b[n / 2]) / 2;
  }
  function trace(M) { var s = 0, i; for (i = 0; i < M.length; i++) s += M[i][i]; return s; }
  function sumMat(M) { var s = 0, i, j; for (i = 0; i < M.length; i++) for (j = 0; j < M.length; j++) s += M[i][j]; return s; }
  function matmul(A, B) {
    var n = A.length, m = B[0].length, k = B.length, C = [], i, j, t, s;
    for (i = 0; i < n; i++) { C[i] = []; for (j = 0; j < m; j++) { s = 0; for (t = 0; t < k; t++) s += A[i][t] * B[t][j]; C[i][j] = s; } }
    return C;
  }
  function lowerTri(R) {                      // off-diagonal lower triangle as a flat array
    var out = [], i, j;
    for (i = 1; i < R.length; i++) for (j = 0; j < i; j++) out.push(R[i][j]);
    return out;
  }
  function dropIndex(M, idx) {                // matrix with row+col idx removed
    var out = [], i, j, r;
    for (i = 0; i < M.length; i++) { if (i === idx) continue; r = []; for (j = 0; j < M.length; j++) { if (j === idx) continue; r.push(M[i][j]); } out.push(r); }
    return out;
  }

  // ---------- symmetric eigen (Jacobi) + smc --------------------------------
  // Reproduces psych::smc(R) = 1 - 1/diag(Pinv(R)), clamped to [0,1].
  function jacobiEigen(Ain) {
    var n = Ain.length, A = [], V = [], i, j, p, q, iter;
    for (i = 0; i < n; i++) { A[i] = Ain[i].slice(); V[i] = []; for (j = 0; j < n; j++) V[i][j] = (i === j) ? 1 : 0; }
    for (iter = 0; iter < 100; iter++) {
      var off = 0;
      for (p = 0; p < n; p++) for (q = p + 1; q < n; q++) off += A[p][q] * A[p][q];
      if (off < 1e-30) break;
      for (p = 0; p < n; p++) for (q = p + 1; q < n; q++) {
        if (Math.abs(A[p][q]) < 1e-300) continue;
        var app = A[p][p], aqq = A[q][q], apq = A[p][q];
        var phi = 0.5 * Math.atan2(2 * apq, aqq - app);
        var c = Math.cos(phi), s = Math.sin(phi), k;
        for (k = 0; k < n; k++) {
          var akp = A[k][p], akq = A[k][q];
          A[k][p] = c * akp - s * akq; A[k][q] = s * akp + c * akq;
        }
        for (k = 0; k < n; k++) {
          var apk = A[p][k], aqk = A[q][k];
          A[p][k] = c * apk - s * aqk; A[q][k] = s * apk + c * aqk;
        }
        for (k = 0; k < n; k++) {
          var vkp = V[k][p], vkq = V[k][q];
          V[k][p] = c * vkp - s * vkq; V[k][q] = s * vkp + c * vkq;
        }
      }
    }
    var vals = [], vecs = [];
    for (i = 0; i < n; i++) { vals[i] = A[i][i]; vecs[i] = []; for (j = 0; j < n; j++) vecs[i][j] = V[i][j]; }
    return { values: vals, vectors: vecs };   // vectors[row][k] = component row of eigenvector k
  }
  // diag of the Moore-Penrose pseudo-inverse of symmetric R (== solve when full rank).
  function pinvDiag(R) {
    var n = R.length, e = jacobiEigen(R), i, k, maxAbs = 0;
    for (k = 0; k < n; k++) maxAbs = Math.max(maxAbs, Math.abs(e.values[k]));
    var tol = Math.max(EPS * maxAbs, 0);
    var d = [];
    for (i = 0; i < n; i++) {
      var s = 0;
      for (k = 0; k < n; k++) {
        if (Math.abs(e.values[k]) > tol) s += e.vectors[i][k] * e.vectors[i][k] / e.values[k];
      }
      d[i] = s;
    }
    return d;
  }
  function smc(R) {
    var d = pinvDiag(R), out = [], i, v;
    for (i = 0; i < R.length; i++) {
      v = 1 - 1 / d[i];
      if (!isNum(v)) v = 1;
      if (v > 1) v = 1; if (v < 0) v = 0;
      out.push(v);
    }
    return out;
  }

  // ---------- covariance / correlation with missing data --------------------
  // data: array of rows; each cell is a finite number or null/NaN for missing.
  // cols: indices of the kept columns. Returns C (cov) and R (cor) matrices.
  function covcor(data, cols, use) {
    var k = cols.length, n = data.length, C = [], R = [], i, j;
    for (i = 0; i < k; i++) { C[i] = new Array(k); R[i] = new Array(k); }

    if (use === 'complete.obs' || use === 'listwise') {
      // rows complete across all kept columns
      var rows = [];
      for (i = 0; i < n; i++) {
        var ok = true;
        for (j = 0; j < k; j++) if (!isNum(data[i][cols[j]])) { ok = false; break; }
        if (ok) rows.push(i);
      }
      var m = rows.length;
      var means = [];
      for (j = 0; j < k; j++) { var s = 0; for (i = 0; i < m; i++) s += data[rows[i]][cols[j]]; means[j] = m ? s / m : NaN; }
      for (i = 0; i < k; i++) for (j = i; j < k; j++) {
        var cov = 0, t;
        for (t = 0; t < m; t++) cov += (data[rows[t]][cols[i]] - means[i]) * (data[rows[t]][cols[j]] - means[j]);
        cov = (m > 1) ? cov / (m - 1) : NaN;
        C[i][j] = C[j][i] = cov;
      }
      for (i = 0; i < k; i++) for (j = 0; j < k; j++) {
        R[i][j] = C[i][j] / Math.sqrt(C[i][i] * C[j][j]);
      }
      return { C: C, R: R, completeRows: rows };
    }

    // pairwise.complete.obs: every pair from its own complete rows
    for (i = 0; i < k; i++) for (j = i; j < k; j++) {
      var xs = [], ys = [], t;
      for (t = 0; t < n; t++) {
        var a = data[t][cols[i]], b = data[t][cols[j]];
        if (isNum(a) && isNum(b)) { xs.push(a); ys.push(b); }
      }
      var mm = xs.length, mi = meanArr(xs), mj = meanArr(ys), cov = 0, vi = 0, vj = 0;
      for (t = 0; t < mm; t++) { cov += (xs[t] - mi) * (ys[t] - mj); vi += (xs[t] - mi) * (xs[t] - mi); vj += (ys[t] - mj) * (ys[t] - mj); }
      cov = (mm > 1) ? cov / (mm - 1) : NaN;
      var corr = (i === j) ? 1 : cov / Math.sqrt((vi / (mm - 1)) * (vj / (mm - 1)));
      C[i][j] = C[j][i] = cov;
      R[i][j] = R[j][i] = corr;
    }
    return { C: C, R: R, completeRows: null };
  }

  // Pearson correlation of two aligned vectors over shared non-missing rows.
  function pairCor(a, b, rows) {
    var xs = [], ys = [], t, i;
    if (rows) { for (i = 0; i < rows.length; i++) { t = rows[i]; if (isNum(a[t]) && isNum(b[t])) { xs.push(a[t]); ys.push(b[t]); } } }
    else { for (t = 0; t < a.length; t++) if (isNum(a[t]) && isNum(b[t])) { xs.push(a[t]); ys.push(b[t]); } }
    var m = xs.length; if (m < 2) return NaN;
    var mx = meanArr(xs), my = meanArr(ys), sxy = 0, sx = 0, sy = 0;
    for (t = 0; t < m; t++) { sxy += (xs[t] - mx) * (ys[t] - my); sx += (xs[t] - mx) * (xs[t] - mx); sy += (ys[t] - my) * (ys[t] - my); }
    return sxy / Math.sqrt(sx * sy);
  }

  // ---------- alpha.1: psych's inner engine ---------------------------------
  function alpha1(C, R) {
    var n = R.length;
    var trC = trace(C), sumC = sumMat(C), sumR = sumMat(R);
    var raw = (1 - trC / sumC) * (n / (n - 1));
    var std = (1 - n / sumR) * (n / (n - 1));
    var smcR = smc(R), G6 = 1 - (n - sumArr(smcR)) / sumR;
    var avr = (sumR - n) / (n * (n - 1));
    var lt = lowerTri(R);
    var var_r = (lt.length >= 2) ? sampVar(lt) : NaN;
    var med_r = median(lt);
    var sn = n * avr / (1 - avr);
    var CC = matmul(C, C);
    var Q = (2 * n * n / ((n - 1) * (n - 1) * Math.pow(sumC, 3))) *
            (sumC * (trace(CC) + trC * trC) - 2 * (trC * sumMat(CC)));
    return { raw: raw, std: std, G6: G6, avr: avr, sn: sn, Q: Q, var_r: var_r, med_r: med_r,
             smc0: smcR[0], R01: (n >= 2 ? R[0][1] : NaN), C01: (n >= 2 ? C[0][1] : NaN),
             C00: (n >= 2 ? C[0][0] : NaN), C11: (n >= 2 ? C[1][1] : NaN) };
  }

  // ---------- Feldt confidence interval -------------------------------------
  function feldtCI(alpha, nsub, nvar, p) {
    var df1 = nsub - 1, df2 = (nsub - 1) * (nvar - 1);
    var lower = 1 - (1 - alpha) * qf(1 - p / 2, df1, df2);
    var upper = 1 - (1 - alpha) * qf(p / 2, df1, df2);
    return { lower: lower, upper: upper, df1: df1, df2: df2 };
  }

  // ---------- main entry ----------------------------------------------------
  // matrix: array of rows (arrays). Cells: finite number, or null/NaN/'' = NA.
  // opts: { use:'pairwise'|'complete.obs' (default 'complete.obs'), feldtP:0.05 }
  function analyze(matrix, opts) {
    opts = opts || {};
    var use = opts.use || 'complete.obs';
    var p = (opts.feldtP != null) ? opts.feldtP : 0.05;

    // normalise cells to number|null
    var data = matrix.map(function (row) {
      return row.map(function (c) {
        if (c === null || c === undefined || c === '') return null;
        var v = (typeof c === 'number') ? c : Number(c);
        return isFinite(v) ? v : null;
      });
    });
    var nsub = data.length, ncolOrig = data.length ? data[0].length : 0;

    // zero-variance / near-empty column detection (psych: delete=TRUE)
    var colSd = [], deleted = [], kept = [], j, i;
    for (j = 0; j < ncolOrig; j++) {
      var vals = [];
      for (i = 0; i < nsub; i++) if (isNum(data[i][j])) vals.push(data[i][j]);
      var sd = sampSd(vals);
      colSd[j] = sd;
      if (!isNum(sd) || sd <= 0) deleted.push(j); else kept.push(j);
    }
    var nvar = kept.length, nbad = deleted.length;
    if (nvar < 2) {
      return { ok: false, error: nvar === 0
        ? 'No usable items: every column is empty or constant.'
        : 'Need at least 2 items with variance. Only one usable item was found.',
        nsub: nsub, ncol: ncolOrig, nvar: nvar, deleted: deleted, colNames: null };
    }
    var completeCount = 0;
    for (i = 0; i < nsub; i++) { var full = true; for (j = 0; j < kept.length; j++) if (!isNum(data[i][kept[j]])) { full = false; break; } if (full) completeCount++; }

    var cc = covcor(data, kept, use);
    var C = cc.C, R = cc.R, completeRows = cc.completeRows;

    var tot = alpha1(C, R);

    // ---- total-score vector (for item-total r, mean, sd) ----
    // psych folds any deleted constant item back into the total.
    var sumBad = 0;
    for (j = 0; j < deleted.length; j++) { var v0 = data[0][deleted[j]]; if (isNum(v0)) sumBad += v0; }
    var total = [];
    for (i = 0; i < nsub; i++) {
      var rv = [], t;
      for (t = 0; t < kept.length; t++) { var c = data[i][kept[t]]; if (isNum(c)) rv.push(c); }
      var rm;
      if (rv.length === 0) rm = NaN;
      else if (nbad > 0) rm = (nvar * meanArr(rv) + sumBad) / (nvar + nbad);
      else rm = meanArr(rv);
      total[i] = rm;
    }
    var totDefined = total.filter(isNum);
    var meanTot = meanArr(totDefined);
    var sdTot = sampSd(totDefined);

    // ---- per-item statistics ----
    var items = [];
    for (j = 0; j < kept.length; j++) {
      var col = kept[j], colVals = [], nvalid = 0;
      for (i = 0; i < nsub; i++) if (isNum(data[i][col])) { colVals.push(data[i][col]); nvalid++; }
      var itemMean = meanArr(colVals), itemSd = sampSd(colVals);
      // raw.r = cor(total, x_j) with the same `use` set
      var xcol = data.map(function (r) { return r[col]; });
      var rawr = pairCor(total, xcol, (use === 'pairwise') ? null : completeRows);
      // std.r = colSum(R_j)/sqrt(sum(R)) ; r.cor via smc-diag substitution
      var sumRj = 0, t2; for (t2 = 0; t2 < nvar; t2++) sumRj += R[j][t2];
      var std_r = sumRj / Math.sqrt(sumMat(R));
      // r.drop = item-rest correlation from C
      var vdrop = 0, a2, b2;
      for (a2 = 0; a2 < nvar; a2++) if (a2 !== j) for (b2 = 0; b2 < nvar; b2++) if (b2 !== j) vdrop += C[a2][b2];
      var colSumCj = 0; for (t2 = 0; t2 < nvar; t2++) colSumCj += C[t2][j];
      var cdrop = colSumCj - C[j][j];
      var r_drop = cdrop / Math.sqrt(C[j][j] * vdrop);
      items.push({ index: col, n: nvalid, raw_r: rawr, std_r: std_r, r_drop: r_drop, mean: itemMean, sd: itemSd });
    }
    // r.cor needs RC = R with diag replaced by smc(R)
    var smcTot = smc(R), RC = R.map(function (row) { return row.slice(); });
    for (j = 0; j < nvar; j++) RC[j][j] = smcTot[j];
    var sumRC = sumMat(RC), sqrtRC = Math.sqrt(sumRC);
    for (j = 0; j < nvar; j++) { var sc = 0; for (i = 0; i < nvar; i++) sc += RC[j][i]; items[j].r_cor = sc / sqrtRC; }

    // ---- alpha-if-deleted ----
    var hasAse = nsub > nvar;
    if (nvar > 2) {
      for (j = 0; j < nvar; j++) {
        var sub = alpha1(dropIndex(C, j), dropIndex(R, j));
        items[j].drop_raw = sub.raw; items[j].drop_std = sub.std; items[j].drop_G6 = sub.G6;
        items[j].drop_avr = sub.avr; items[j].drop_sn = sub.sn;
        items[j].drop_ase = hasAse ? Math.sqrt(sub.Q / nsub) : null;
        items[j].drop_varr = sub.var_r; items[j].drop_medr = sub.med_r;
      }
    } else {
      // 2-item degenerate rows (psych special case)
      var r01 = R[0][1], smcv = tot.smc0, sn2 = r01 / (1 - r01);
      items[0].drop_raw = C[0][1] / C[1][1]; items[1].drop_raw = C[0][1] / C[0][0];
      for (j = 0; j < 2; j++) {
        items[j].drop_std = r01; items[j].drop_G6 = smcv; items[j].drop_avr = r01;
        items[j].drop_sn = sn2; items[j].drop_ase = null; items[j].drop_varr = null; items[j].drop_medr = r01;
      }
    }

    // ---- assemble total row ----
    var ase = Math.sqrt(tot.Q / nsub);
    var lt = lowerTri(R);
    var feldt = {};
    [0.10, 0.05, 0.01].forEach(function (pl) {
      var f = feldtCI(tot.raw, nsub, nvar, pl);
      feldt[pl.toFixed(2)] = { lower: f.lower, upper: f.upper };
    });
    var chosen = feldtCI(tot.raw, nsub, nvar, p);

    return {
      ok: true, use: use, nsub: nsub, ncol: ncolOrig, nvar: nvar,
      deleted: deleted, completeCount: completeCount,
      raw_alpha: tot.raw, std_alpha: tot.std, G6: tot.G6, average_r: tot.avr,
      sn: tot.sn, ase: ase, mean_tot: meanTot, sd_tot: sdTot,
      median_r: tot.med_r, var_r: tot.var_r,
      interitem_min: lt.length ? Math.min.apply(null, lt) : NaN,
      interitem_max: lt.length ? Math.max.apply(null, lt) : NaN,
      feldt: feldt, feldtP: p, feldt_lower: chosen.lower, feldt_upper: chosen.upper,
      feldt_df1: chosen.df1, feldt_df2: chosen.df2,
      C: C, R: R, items: items
    };
  }

  // ---------- Spearman-Brown prophecy (test-length planning) ----------------
  // predicted reliability if the test is scaled by factor m (m = newLen/oldLen).
  function spearmanBrown(alpha, m) { return (m * alpha) / (1 + (m - 1) * alpha); }
  // factor m needed to move current alpha to a target reliability.
  function sbFactorForTarget(alpha, target) { return (target * (1 - alpha)) / (alpha * (1 - target)); }
  // whole items needed (rounded up) to reach a target on a k-item test.
  function sbItemsForTarget(alpha, k, target) { return Math.ceil(sbFactorForTarget(alpha, target) * k); }

  // ---------- reverse a column against a scale bound ------------------------
  // new = (max + min) - x, applied to finite cells only.
  function reverseColumn(matrix, colIndex, maxVal, minVal) {
    var adj = maxVal + minVal;
    return matrix.map(function (row) {
      return row.map(function (c, j) {
        if (j !== colIndex) return c;
        if (c === null || c === undefined || c === '') return c;
        var v = (typeof c === 'number') ? c : Number(c);
        return isFinite(v) ? adj - v : c;
      });
    });
  }

  return {
    version: '1.0.0',
    analyze: analyze,
    reverseColumn: reverseColumn,
    feldtCI: feldtCI,
    spearmanBrown: spearmanBrown,
    sbFactorForTarget: sbFactorForTarget,
    sbItemsForTarget: sbItemsForTarget,
    smc: smc,
    _alpha1: alpha1,
    _covcor: covcor
  };
}));
