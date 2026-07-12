/*!
 * bootstrap-math.js - Bootstrap confidence intervals, verified bit-for-bit against R's
 * boot::boot() + boot::boot.ci() (R 4.6.0, default RNG Mersenne-Twister | Inversion | Rejection).
 *
 * The engine reproduces R's Mersenne-Twister and R_unif_index() rejection sampler exactly, so
 * set.seed(seed); boot(...) in R yields the identical resample distribution, hence identical
 * percentile / basic / normal / BCa intervals. BCa influence uses the regression estimate
 * (empinf type="reg") when R >= n and the usual jackknife when R < n, matching boot.ci()'s default.
 *
 * UMD: browser global (window.BootMath) + CommonJS (require).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.BootMath = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ------------------------------------------------------------------
  // R's Mersenne-Twister + unif_rand + R_unif_index rejection sampler
  // ------------------------------------------------------------------
  function RRNG(seed) {
    var N = 624, M = 397;
    var MATRIX_A = 0x9908b0df, UPPER = 0x80000000, LOWER = 0x7fffffff;
    var TB = 0x9d2c5680, TC = 0xefc60000;
    var s = seed >>> 0;
    for (var j = 0; j < 50; j++) s = (Math.imul(69069, s) + 1) >>> 0; // initial scrambling
    var arr = new Uint32Array(625);
    for (j = 0; j < 625; j++) { s = (Math.imul(69069, s) + 1) >>> 0; arr[j] = s; }
    var mt = arr.subarray(1);   // 624 state words (dummy[1..624])
    var mti = 624;              // FixupSeeds: dummy[0] = 624
    var mag01 = [0x0, MATRIX_A];

    function genrand() {
      var y, kk;
      if (mti >= N) {
        for (kk = 0; kk < N - M; kk++) {
          y = ((mt[kk] & UPPER) | (mt[kk + 1] & LOWER)) >>> 0;
          mt[kk] = (mt[kk + M] ^ (y >>> 1) ^ mag01[y & 0x1]) >>> 0;
        }
        for (; kk < N - 1; kk++) {
          y = ((mt[kk] & UPPER) | (mt[kk + 1] & LOWER)) >>> 0;
          mt[kk] = (mt[kk + (M - N)] ^ (y >>> 1) ^ mag01[y & 0x1]) >>> 0;
        }
        y = ((mt[N - 1] & UPPER) | (mt[0] & LOWER)) >>> 0;
        mt[N - 1] = (mt[M - 1] ^ (y >>> 1) ^ mag01[y & 0x1]) >>> 0;
        mti = 0;
      }
      y = mt[mti++];
      y ^= (y >>> 11);
      y = (y ^ ((y << 7) & TB)) >>> 0;
      y = (y ^ ((y << 15) & TC)) >>> 0;
      y ^= (y >>> 18);
      return y >>> 0;
    }
    var i2_32m1 = 2.328306437080797e-10;
    function fixup(x) {
      if (x <= 0.0) return 0.5 * i2_32m1;
      if (1.0 - x <= 0.0) return 1.0 - 0.5 * i2_32m1;
      return x;
    }
    function unif() { return fixup(genrand() * 2.3283064365386963e-10); }

    function rbits(bits) {
      var v = 0;
      for (var n = 0; n <= bits; n += 16) {
        var v1 = Math.floor(unif() * 65536);
        v = 65536 * v + v1;
      }
      var mod = Math.pow(2, bits);          // mask to `bits` low bits
      return v - Math.floor(v / mod) * mod; // v mod 2^bits (v may exceed 2^32)
    }
    // R_unif_index(dn): integer in [0, dn) via rejection sampling
    function unifIndex(dn) {
      if (dn <= 0) return 0;
      var bits = Math.ceil(Math.log2(dn));
      var dv;
      do { dv = rbits(bits); } while (dn <= dv);
      return dv;
    }
    return { unif: unif, unifIndex: unifIndex };
  }

  // ------------------------------------------------------------------
  // Normal quantile (Wichura AS 241) and CDF (West, full double precision)
  // ------------------------------------------------------------------
  function qnorm(p) {
    if (p <= 0) return -Infinity;
    if (p >= 1) return Infinity;
    var q = p - 0.5, r, val;
    if (Math.abs(q) <= 0.425) {
      r = 0.180625 - q * q;
      return q * (((((((2509.0809287301226727 * r + 33430.575583588128105) * r + 67265.770927008700853) * r + 45921.953931549871457) * r + 13731.693765509461125) * r + 1971.5909503065514427) * r + 133.14166789178437745) * r + 3.387132872796366608) /
        (((((((5226.495278852854561 * r + 28729.085735721942674) * r + 39307.89580009271061) * r + 21213.794301586595867) * r + 5394.1960214247511077) * r + 687.1870074920579083) * r + 42.313330701600911252) * r + 1);
    }
    r = q < 0 ? p : 1 - p;
    r = Math.sqrt(-Math.log(r));
    if (r <= 5) {
      r -= 1.6;
      val = (((((((7.7454501427834140764e-4 * r + 0.0227238449892691845833) * r + 0.24178072517745061177) * r + 1.27045825245236838258) * r + 3.64784832476320460504) * r + 5.7694972214606914055) * r + 4.6303378461565452959) * r + 1.42343711074968357734) /
        (((((((1.05075007164441684324e-9 * r + 5.475938084995344946e-4) * r + 0.0151986665636164571966) * r + 0.14810397642748007459) * r + 0.68976733498510000455) * r + 1.6763848301838038494) * r + 2.05319162663775882187) * r + 1);
    } else {
      r -= 5;
      val = (((((((2.01033439929228813265e-7 * r + 2.71155556874348757815e-5) * r + 0.0012426609473880784386) * r + 0.026532189526576123093) * r + 0.29656057182850489123) * r + 1.7848265399172913358) * r + 5.4637849111641143699) * r + 6.6579046435011037772) /
        (((((((2.04426310338993978564e-15 * r + 1.4215117583164458887e-7) * r + 1.8463183175100546818e-6) * r + 7.868691311456132591e-5) * r + 0.0014875361290850615) * r + 0.013692988092273580531) * r + 0.059983220655588793769) * r + 1);
    }
    return q < 0 ? -val : val;
  }

  function pnorm(x) {
    var xa = Math.abs(x), cum;
    if (xa > 37) {
      cum = 0;
    } else {
      var e = Math.exp(-xa * xa / 2), b;
      if (xa < 7.07106781186547) {
        b = 3.52624965998911e-02 * xa + 0.700383064443688;
        b = b * xa + 6.37396220353165;
        b = b * xa + 33.912866078383;
        b = b * xa + 112.079291497871;
        b = b * xa + 221.213596169931;
        b = b * xa + 220.206867912376;
        cum = e * b;
        b = 8.83883476483184e-02 * xa + 1.75566716318264;
        b = b * xa + 16.064177579207;
        b = b * xa + 86.7807322029461;
        b = b * xa + 296.564248779674;
        b = b * xa + 637.333633378831;
        b = b * xa + 793.826512519948;
        b = b * xa + 440.413735824752;
        cum = cum / b;
      } else {
        b = xa + 0.65;
        b = xa + 4 / b;
        b = xa + 3 / b;
        b = xa + 2 / b;
        b = xa + 1 / b;
        cum = e / b / 2.506628274631;
      }
    }
    return x > 0 ? 1 - cum : cum;
  }

  // ------------------------------------------------------------------
  // Statistics on plain arrays (match R: sd/var use n-1; quantile type 7)
  // ------------------------------------------------------------------
  // R's mean.default: corrected two-pass (do_mean in summary.c) so bootstrap replicate
  // means align with R to full double precision (the strict t* < t0 count in BCa is
  // sensitive to sub-ULP differences).
  function mean(x) {
    var n = x.length, i, s = 0;
    for (i = 0; i < n; i++) s += x[i];
    s /= n;
    if (isFinite(s)) { var t = 0; for (i = 0; i < n; i++) t += (x[i] - s); s += t / n; }
    return s;
  }
  function variance(x) { var m = mean(x), s = 0, n = x.length, d; for (var i = 0; i < n; i++) { d = x[i] - m; s += d * d; } return s / (n - 1); }
  function sd(x) { return Math.sqrt(variance(x)); }
  function quantileSorted(sorted, p) { // R type 7 on an ascending array
    var n = sorted.length;
    if (n === 0) return NaN;
    if (n === 1) return sorted[0];
    var h = (n - 1) * p, lo = Math.floor(h);
    if (lo >= n - 1) return sorted[n - 1];
    return sorted[lo] + (h - lo) * (sorted[lo + 1] - sorted[lo]);
  }
  function ascSort(x) { var s = x.slice(); s.sort(function (a, b) { return a - b; }); return s; }
  function median(x) { return quantileSorted(ascSort(x), 0.5); }
  function iqr(x) { var s = ascSort(x); return quantileSorted(s, 0.75) - quantileSorted(s, 0.25); }
  function pquant(x, p) { return quantileSorted(ascSort(x), p); }

  var STAT = {
    mean: mean,
    median: median,
    sd: sd,
    iqr: iqr,
    p90: function (x) { return pquant(x, 0.90); }
  };

  // ------------------------------------------------------------------
  // boot.ci internals
  // ------------------------------------------------------------------
  // boot:::norm.inter for a single probability alpha; tstar ascending, finite.
  function normInter(sorted, alpha) {
    var R = sorted.length;
    var rk = (R + 1) * alpha;
    var k = Math.trunc(rk);
    if (k === rk) return sorted[k - 1];
    if (k <= 0) return sorted[0];
    if (k >= R) return sorted[R - 1];
    var za = qnorm(alpha);
    var zk = qnorm(k / (R + 1));
    var zk1 = qnorm((k + 1) / (R + 1));
    var tk = sorted[k - 1], tk1 = sorted[k];
    return tk + (za - zk) / (zk1 - zk) * (tk1 - tk);
  }

  // Solve a symmetric positive-definite (m x m) system A x = b via Gaussian
  // elimination with partial pivoting. Used for the regression influence OLS.
  function solveLinear(A, b, m) {
    var i, j, k, aug = [];
    for (i = 0; i < m; i++) { var rowarr = Array.prototype.slice.call(A[i]); rowarr.push(b[i]); aug.push(rowarr); }
    for (k = 0; k < m; k++) {
      var piv = k, big = Math.abs(aug[k][k]);
      for (i = k + 1; i < m; i++) { var v = Math.abs(aug[i][k]); if (v > big) { big = v; piv = i; } }
      if (piv !== k) { var t = aug[piv]; aug[piv] = aug[k]; aug[k] = t; }
      var akk = aug[k][k];
      if (akk === 0) return null;
      for (i = k + 1; i < m; i++) {
        var f = aug[i][k] / akk;
        if (f === 0) continue;
        for (j = k; j <= m; j++) aug[i][j] -= f * aug[k][j];
      }
    }
    var xsol = new Array(m);
    for (i = m - 1; i >= 0; i--) {
      var sum = aug[i][m];
      for (j = i + 1; j < m; j++) sum -= aug[i][j] * xsol[j];
      xsol[i] = sum / aug[i][i];
    }
    return xsol;
  }

  // ------------------------------------------------------------------
  // Full bootstrap: returns t0, replicates, bias/SE and all four CIs.
  //   x        : numeric array (single sample)
  //   statFn   : function(array) -> number
  //   opts     : { R, seed, conf }
  // ------------------------------------------------------------------
  function bootstrap(x, statFn, opts) {
    var n = x.length, R = opts.R, seed = opts.seed, conf = opts.conf;
    var rng = RRNG(seed);
    var t = new Float64Array(R);
    var t0 = statFn(x);

    var useReg = R >= n;                 // matches empinf() default: reg if R>=n else jack
    // Accumulators for the regression influence OLS (design = [1, prop_2..prop_n]).
    var m = n;                           // intercept + (n-1) proportion columns
    var XtX = null, Xty = null;
    if (useReg) {
      XtX = [];
      for (var a = 0; a < m; a++) { XtX.push(new Float64Array(m)); }
      Xty = new Float64Array(m);
    }
    var freq = new Float64Array(n);
    var resample = new Float64Array(n);
    var row = new Float64Array(m);       // [1, prop_1..prop_{n-1}] design row (drops obs 0)

    // R generates sample.int(n, n*R, replace=TRUE) as one flat draw stream, then
    // dim(i) <- c(R, n) reshapes COLUMN-MAJOR. So replicate r's n indices are strided:
    // flat[r], flat[r + R], flat[r + 2R], ... (verified equal to boot()$t in _boot_probe.R).
    var total = n * R;
    var flat = new Int32Array(total);
    for (var d = 0; d < total; d++) flat[d] = rng.unifIndex(n);

    for (var r = 0; r < R; r++) {
      var i, idx;
      for (i = 0; i < n; i++) freq[i] = 0;
      for (i = 0; i < n; i++) {
        idx = flat[i * R + r];           // column-major stride
        resample[i] = x[idx];
        freq[idx] += 1;
      }
      t[r] = statFn(resample);
      if (useReg && isFinite(t[r])) {
        row[0] = 1;
        for (i = 1; i < n; i++) row[i] = freq[i] / n;   // drop column 0
        var tv = t[r];
        for (i = 0; i < m; i++) {
          var ri = row[i];
          if (ri !== 0) { Xty[i] += ri * tv; }
          var XtXi = XtX[i];
          for (var jj = i; jj < m; jj++) XtXi[jj] += ri * row[jj];
        }
      }
    }
    // symmetrize XtX
    if (useReg) {
      for (var p = 0; p < m; p++) for (var qq = 0; qq < p; qq++) XtX[p][qq] = XtX[qq][p];
    }

    // finite replicates, sorted
    var finite = [];
    for (var f2 = 0; f2 < R; f2++) if (isFinite(t[f2])) finite.push(t[f2]);
    var Rf = finite.length;
    var sorted = finite.slice().sort(function (aa, bb) { return aa - bb; });
    var meanStar = mean(finite);
    var sdStar = Rf > 1 ? sd(finite) : 0;
    var bias = meanStar - t0;

    // ---- influence values L (empinf) ----
    var L = new Float64Array(n), acc = 0, Ltype;
    if (useReg) {
      Ltype = 'reg';
      var beta = solveLinear(XtX, Array.prototype.slice.call(Xty), m);
      var lmean = 0;
      L[0] = 0;
      for (var bi = 1; bi < n; bi++) { L[bi] = beta[bi]; }   // beta[0]=intercept dropped
      for (var li = 0; li < n; li++) lmean += L[li];
      lmean /= n;
      for (li = 0; li < n; li++) L[li] -= lmean;
    } else {
      Ltype = 'jack';
      var tobs = statFn(x);
      var sub = new Float64Array(n - 1);
      for (var ji = 0; ji < n; ji++) {
        var kk2 = 0;
        for (var jk = 0; jk < n; jk++) { if (jk === ji) continue; sub[kk2++] = x[jk]; }
        L[ji] = (n - 1) * (tobs - statFn(sub));
      }
    }
    var s2 = 0, s3 = 0;
    for (var si = 0; si < n; si++) { var Lv = L[si]; s2 += Lv * Lv; s3 += Lv * Lv * Lv; }
    acc = s3 / (6 * Math.pow(s2, 1.5));

    // ---- intervals ----
    var aLo = (1 - conf) / 2, aHi = (1 + conf) / 2;
    // normal
    var merr = sdStar * qnorm(aHi);
    var normCI = [t0 - bias - merr, t0 - bias + merr];
    // percentile
    var percCI = [normInter(sorted, aLo), normInter(sorted, aHi)];
    // basic (reverse percentile): uses upper then lower
    var qHi = normInter(sorted, aHi), qLo = normInter(sorted, aLo);
    var basicCI = [2 * t0 - qHi, 2 * t0 - qLo];
    // BCa
    var below = 0;
    for (var wi = 0; wi < Rf; wi++) if (sorted[wi] < t0) below++;
    var w = qnorm(below / Rf);
    var zLo = qnorm(aLo), zHi = qnorm(aHi);
    var bcaCI, bcaOk = isFinite(w) && isFinite(acc);
    if (bcaOk) {
      var adjLo = pnorm(w + (w + zLo) / (1 - acc * (w + zLo)));
      var adjHi = pnorm(w + (w + zHi) / (1 - acc * (w + zHi)));
      bcaCI = [normInter(sorted, adjLo), normInter(sorted, adjHi)];
    } else {
      bcaCI = [NaN, NaN];
    }

    return {
      t0: t0, t: t, sorted: sorted, R: R, Rfinite: Rf,
      meanStar: meanStar, sdStar: sdStar, bias: bias,
      w: w, acc: acc, Ltype: Ltype, L: L,
      ci: { norm: normCI, basic: basicCI, perc: percCI, bca: bcaCI },
      bcaOk: bcaOk
    };
  }

  return {
    RRNG: RRNG, qnorm: qnorm, pnorm: pnorm,
    mean: mean, variance: variance, sd: sd, median: median, iqr: iqr, pquant: pquant,
    quantileSorted: quantileSorted, STAT: STAT, normInter: normInter, bootstrap: bootstrap
  };
}));
