/* nonparametric-math.js - rank-based test math for Tool Farm v2.
   Ground truth: R 4.6.0 stats::wilcox.test / kruskal.test / binom.test and
   effectsize:: rank_biserial / rank_epsilon_squared
   (see Scripts/tool-truth/nonparametric.json).

   Faithful port of R's algorithms:
   - Mann-Whitney U (wilcox rank-sum) and Wilcoxon signed-rank: exact
     distribution (cwilcox / signrank DP) when small n and no ties/zeros,
     else normal approximation with continuity + tie/zero variance correction.
   - Hodges-Lehmann estimate + CI: exact (qwilcox/qsignrank order stats) and
     asymptotic (R's uniroot -> zeroin2 Brent port, tol 1e-4), incl. R's
     alpha-doubling for unachievable one-sample levels.
   - Kruskal-Wallis: tie-corrected H, chi-square upper tail.
   - Sign test: exact binom.test two-sided + Clopper-Pearson CI.

   The tool emits R code that PINS exact=/correct= so the displayed value
   reproduces in R. Browser global NonparMath + Node require. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports)
    module.exports = factory(require('./normal-math.js'), require('./ci-math.js'));
  else root.NonparMath = factory(root.NormalMath, root.CIMath);
}(typeof self !== 'undefined' ? self : this, function (N, CI) {
  'use strict';
  var EPS = 2.220446049250313e-16;

  /* ---------- basic rank helpers (R rank, ties = "average") ---------- */
  function rank(v) {
    var n = v.length, idx = v.map(function (x, i) { return i; });
    idx.sort(function (a, b) { return v[a] - v[b]; });
    var r = new Array(n), i = 0;
    while (i < n) {
      var j = i;
      while (j + 1 < n && v[idx[j + 1]] === v[idx[i]]) j++;
      var avg = (i + j) / 2 + 1;           // 1-based average rank
      for (var k = i; k <= j; k++) r[idx[k]] = avg;
      i = j + 1;
    }
    return r;
  }
  function tieTerm(ranksArr) {               // sum(t^3 - t) over tied groups
    var m = {}, s = 0, i;
    for (i = 0; i < ranksArr.length; i++) m[ranksArr[i]] = (m[ranksArr[i]] || 0) + 1;
    for (var key in m) { var t = m[key]; s += t * t * t - t; }
    return s;
  }
  function median(a) {
    var s = a.slice().sort(function (x, y) { return x - y; }), n = s.length;
    return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
  }
  function hasTies(a) {
    var s = a.slice().sort(function (x, y) { return x - y; });
    for (var i = 1; i < s.length; i++) if (s[i] === s[i - 1]) return true;
    return false;
  }

  /* ---------- exact Mann-Whitney distribution (R cwilcox) ---------- */
  var _cwCache = {};
  function cwilcoxDist(m, n) {              // count array c[k], k = 0..m*n
    var key = m + 'x' + n;
    if (_cwCache[key]) return _cwCache[key];
    var memo = new Map();
    function cw(k, mm, nn) {
      if (k < 0 || k > mm * nn) return 0;
      var u = mm * nn;
      if (k > u - k) k = u - k;            // symmetry
      if (mm === 0 || nn === 0) return k === 0 ? 1 : 0;
      var kk = k + ',' + mm + ',' + nn;
      var h = memo.get(kk); if (h !== undefined) return h;
      var r = cw(k - nn, mm - 1, nn) + cw(k, mm, nn - 1);
      memo.set(kk, r); return r;
    }
    var size = m * n, c = new Float64Array(size + 1);
    for (var k = 0; k <= size; k++) c[k] = cw(k, m, n);
    _cwCache[key] = c; return c;
  }
  function lchoose(n, k) { return N.lgamma(n + 1) - N.lgamma(k + 1) - N.lgamma(n - k + 1); }
  function pwilcox(q, m, n) {               // P(W <= q)
    q = Math.floor(q + 1e-7);
    if (q < 0) return 0;
    if (q >= m * n) return 1;
    var c = cwilcoxDist(m, n), tot = Math.exp(lchoose(m + n, n)), s = 0;
    for (var k = 0; k <= q; k++) s += c[k];
    return s / tot;
  }
  function qwilcox(p, m, n) {               // smallest q with P(W<=q) >= p
    if (p <= 0) return 0;
    if (p >= 1) return m * n;
    p *= 1 - 64 * EPS;
    var c = cwilcoxDist(m, n), tot = Math.exp(lchoose(m + n, n)), s = 0;
    for (var q = 0; q <= m * n; q++) { s += c[q]; if (s / tot >= p) return q; }
    return m * n;
  }

  /* ---------- exact signed-rank distribution ---------- */
  var _srCache = {};
  function signrankDist(n) {                // count array over 0..n(n+1)/2
    if (_srCache[n]) return _srCache[n];
    var max = n * (n + 1) / 2, c = new Float64Array(max + 1);
    c[0] = 1;
    for (var i = 1; i <= n; i++) for (var k = max; k >= i; k--) c[k] += c[k - i];
    _srCache[n] = c; return c;
  }
  function psignrank(q, n) {
    q = Math.floor(q + 1e-7);
    var max = n * (n + 1) / 2;
    if (q < 0) return 0;
    if (q >= max) return 1;
    var c = signrankDist(n), tot = Math.pow(2, n), s = 0;
    for (var k = 0; k <= q; k++) s += c[k];
    return s / tot;
  }
  function qsignrank(p, n) {
    if (p <= 0) return 0;
    var max = n * (n + 1) / 2;
    if (p >= 1) return max;
    p *= 1 - 64 * EPS;
    var c = signrankDist(n), tot = Math.pow(2, n), s = 0;
    for (var q = 0; q <= max; q++) { s += c[q]; if (s / tot >= p) return q; }
    return max;
  }

  /* ---------- Brent root finder (R zeroin2) ---------- */
  function zeroin2(ax, bx, fa, fb, f, tol, maxit) {
    var a = ax, b = bx, c = a, fc = fa, mit = maxit + 1;
    if (fa === 0) return a;
    if (fb === 0) return b;
    while (mit--) {
      var prev = b - a, tolAct, newStep, p, q;
      if (Math.abs(fc) < Math.abs(fb)) { a = b; b = c; c = a; fa = fb; fb = fc; fc = fa; }
      tolAct = 2 * EPS * Math.abs(b) + tol / 2;
      newStep = (c - b) / 2;
      if (Math.abs(newStep) <= tolAct || fb === 0) return b;
      if (Math.abs(prev) >= tolAct && Math.abs(fa) > Math.abs(fb)) {
        var cb = c - b, t1, t2;
        if (a === c) { t1 = fb / fa; p = cb * t1; q = 1 - t1; }
        else {
          q = fa / fc; t1 = fb / fc; t2 = fb / fa;
          p = t2 * (cb * q * (q - t1) - (b - a) * (t1 - 1));
          q = (q - 1) * (t1 - 1) * (t2 - 1);
        }
        if (p > 0) q = -q; else p = -p;
        if (p < 0.75 * cb * q - Math.abs(tolAct * q) / 2 && p < Math.abs(prev * q / 2)) newStep = p / q;
      }
      if (Math.abs(newStep) < tolAct) newStep = newStep > 0 ? tolAct : -tolAct;
      a = b; fa = fb; b += newStep; fb = f(b);
      if ((fb > 0 && fc > 0) || (fb < 0 && fc < 0)) { c = a; fc = fa; }
    }
    return b;
  }
  function uniroot(f, lo, hi, flo, fhi, tol) { return zeroin2(lo, hi, flo, fhi, f, tol, 1000); }

  /* ==================== MANN-WHITNEY U ==================== */
  function mannWhitney(x, y, opt) {
    opt = opt || {};
    var alt = opt.alt || 'two.sided', alpha = opt.alpha == null ? 0.05 : opt.alpha,
        correct = opt.correct !== false, nx = x.length, ny = y.length,
        tol = 1e-4, cl = 1 - alpha;
    var combined = x.concat(y), r = rank(combined);
    var ties = hasTies(combined);
    var Rx = 0; for (var i = 0; i < nx; i++) Rx += r[i];
    var W = Rx - nx * (nx + 1) / 2;
    var useExact = nx < 50 && ny < 50 && !ties;
    var p, z = null, sigma = null;
    if (useExact) {
      if (alt === 'two.sided') {
        p = Math.min(2 * pwilcox(W, nx, ny), 2 * (1 - pwilcox(W - 1, nx, ny)), 1);
      } else if (alt === 'greater') p = 1 - pwilcox(W - 1, nx, ny);
      else p = pwilcox(W, nx, ny);
    } else {
      var MEAN = nx * ny / 2;
      sigma = Math.sqrt((nx * ny / 12) * ((nx + ny + 1) - tieTerm(r) / ((nx + ny) * (nx + ny - 1))));
      var zc = W - MEAN;
      var corr = correct ? (alt === 'two.sided' ? Math.sign(zc) * 0.5 : alt === 'greater' ? 0.5 : -0.5) : 0;
      z = (zc - corr) / sigma;
      p = alt === 'less' ? N.pnorm(z) : alt === 'greater' ? 1 - N.pnorm(z)
        : 2 * Math.min(N.pnorm(z), 1 - N.pnorm(z));
    }
    var rb = 2 * W / (nx * ny) - 1;
    var hlci = mwuCI(x, y, nx, ny, alt, alpha, correct, useExact, tol);
    return { statistic: W, p: p, exact: useExact, ties: ties, z: z, sigma: sigma,
             rb: rb, cliff: rb, hl: hlci.est, ciLo: hlci.lo, ciHi: hlci.hi, cl: cl };
  }

  function mwuCI(x, y, nx, ny, alt, alpha, correct, useExact, tol) {
    var toler = 10 * EPS, i, j, diffs;
    if (useExact) {
      diffs = [];
      for (i = 0; i < nx; i++) for (j = 0; j < ny; j++) diffs.push(x[i] - y[j]);
      diffs.sort(function (a, b) { return a - b; });
      var mn = nx * ny, qu, ql, lo, hi;
      if (alt === 'two.sided') {
        qu = qwilcox(alpha / 2, nx, ny);
        if (pwilcox(qu, nx, ny) <= alpha / 2 + toler) qu++;
        if (qu === 0) { lo = -Infinity; hi = Infinity; }
        else { ql = mn - qu; lo = diffs[qu - 1]; hi = diffs[ql]; }
      } else if (alt === 'greater') {
        qu = qwilcox(alpha, nx, ny);
        if (pwilcox(qu, nx, ny) <= alpha + toler) qu++;
        lo = qu === 0 ? -Infinity : diffs[qu - 1]; hi = Infinity;
      } else {
        qu = qwilcox(alpha, nx, ny);
        if (pwilcox(qu, nx, ny) <= alpha + toler) qu++;
        ql = mn - qu; lo = -Infinity; hi = qu === 0 ? Infinity : diffs[ql];
      }
      return { est: median(diffs), lo: lo, hi: hi };
    }
    // asymptotic
    var mumin = Math.min.apply(null, x) - Math.max.apply(null, y);
    var mumax = Math.max.apply(null, x) - Math.min.apply(null, y);
    function Wfun(d, cc) {
      var arr = [], k;
      for (k = 0; k < nx; k++) arr.push(x[k] - d);
      for (k = 0; k < ny; k++) arr.push(y[k]);
      var dr = rank(arr), dz = 0;
      for (k = 0; k < nx; k++) dz += dr[k];
      dz -= nx * (nx + 1) / 2 + nx * ny / 2;
      var sig = Math.sqrt((nx * ny / 12) * ((nx + ny + 1) - tieTerm(dr) / ((nx + ny) * (nx + ny - 1))));
      var corr = cc ? (alt === 'two.sided' ? Math.sign(dz) * 0.5 : alt === 'greater' ? 0.5 : -0.5) : 0;
      return (dz - corr) / sig;
    }
    var Wmin = Wfun(mumin, correct), Wmax = Wfun(mumax, correct);
    function root(zq) {
      var fl = Wmin - zq; if (fl <= 0) return mumin;
      var fu = Wmax - zq; if (fu >= 0) return mumax;
      return uniroot(function (d) { return Wfun(d, correct) - zq; }, mumin, mumax, fl, fu, tol);
    }
    var lo2, hi2;
    if (alt === 'two.sided') { lo2 = root(N.qnorm(1 - alpha / 2)); hi2 = root(N.qnorm(alpha / 2)); }
    else if (alt === 'greater') { lo2 = root(N.qnorm(1 - alpha)); hi2 = Infinity; }
    else { lo2 = -Infinity; hi2 = root(N.qnorm(alpha)); }
    var Wmin0 = Wfun(mumin, false), Wmax0 = Wfun(mumax, false);
    var est = uniroot(function (d) { return Wfun(d, false); }, mumin, mumax, Wmin0, Wmax0, tol);
    return { est: est, lo: lo2, hi: hi2 };
  }

  /* ==================== WILCOXON SIGNED-RANK ==================== */
  function signedRank(x, y, opt) {
    opt = opt || {};
    var alt = opt.alt || 'two.sided', alpha = opt.alpha == null ? 0.05 : opt.alpha,
        correct = opt.correct !== false, mu = opt.mu || 0, tol = 1e-4, cl = 1 - alpha;
    var paired = !!y;
    var loc = paired ? x.map(function (v, i) { return v - y[i]; }) : x;   // location data
    var d = paired ? loc.slice() : x.map(function (v) { return v - mu; });
    var dnz = d.filter(function (v) { return v !== 0; });
    var zeros = dnz.length !== d.length;
    var absd = dnz.map(Math.abs), r = rank(absd);
    var ties = hasTies(absd);
    var n = dnz.length, V = 0;
    for (var i = 0; i < n; i++) if (dnz[i] > 0) V += r[i];
    var useExact = d.length < 50 && !ties && !zeros;
    var p, z = null, sigma = null;
    if (useExact) {
      if (alt === 'two.sided') {
        var m0 = n * (n + 1) / 4;
        var pp = V > m0 ? 1 - psignrank(V - 1, n) : psignrank(V, n);
        p = Math.min(2 * pp, 1);
      } else if (alt === 'greater') p = 1 - psignrank(V - 1, n);
      else p = psignrank(V, n);
    } else {
      var MEAN = n * (n + 1) / 4;
      sigma = Math.sqrt(n * (n + 1) * (2 * n + 1) / 24 - tieTerm(r) / 48);
      var zc = V - MEAN;
      var corr = correct ? (alt === 'two.sided' ? Math.sign(zc) * 0.5 : alt === 'greater' ? 0.5 : -0.5) : 0;
      z = (zc - corr) / sigma;
      p = alt === 'less' ? N.pnorm(z) : alt === 'greater' ? 1 - N.pnorm(z)
        : 2 * Math.min(N.pnorm(z), 1 - N.pnorm(z));
    }
    var S = n * (n + 1) / 2, rb = 2 * V / S - 1;
    var hlci = signedCI(loc, alt, alpha, correct, useExact, tol);
    return { statistic: V, p: p, exact: useExact, ties: ties, zeros: zeros, n: n,
             z: z, sigma: sigma, rb: rb, hl: hlci.est, ciLo: hlci.lo, ciHi: hlci.hi, cl: cl };
  }

  function signedCI(xloc, alt, alpha, correct, useExact, tol) {
    var toler = 10 * EPS, x = xloc, i, j, n0 = x.length;
    if (useExact) {
      var walsh = [];
      for (i = 0; i < n0; i++) for (j = i; j < n0; j++) walsh.push((x[i] + x[j]) / 2);
      walsh.sort(function (a, b) { return a - b; });
      var maxr = n0 * (n0 + 1) / 2, qu, ql, lo, hi;
      if (alt === 'two.sided') {
        qu = qsignrank(alpha / 2, n0);
        if (psignrank(qu, n0) <= alpha / 2 + toler) qu++;
        if (qu === 0) { lo = -Infinity; hi = Infinity; }
        else { ql = maxr - qu; lo = walsh[qu - 1]; hi = walsh[ql]; }
      } else if (alt === 'greater') {
        qu = qsignrank(alpha, n0);
        if (psignrank(qu, n0) <= alpha + toler) qu++;
        lo = qu === 0 ? -Infinity : walsh[qu - 1]; hi = Infinity;
      } else {
        qu = qsignrank(alpha, n0);
        if (psignrank(qu, n0) <= alpha + toler) qu++;
        ql = maxr - qu; lo = -Infinity; hi = qu === 0 ? Infinity : walsh[ql];
      }
      return { est: median(walsh), lo: lo, hi: hi };
    }
    // asymptotic (with R's alpha-doubling for unachievable levels)
    var mumin = Math.min.apply(null, x), mumax = Math.max.apply(null, x);
    function Wfun(d, cc) {
      var xd = [], k;
      for (k = 0; k < n0; k++) { var v = x[k] - d; if (v !== 0) xd.push(v); }
      var nx = xd.length, dr = rank(xd.map(Math.abs)), zd = 0;
      for (k = 0; k < nx; k++) if (xd[k] > 0) zd += dr[k];
      zd -= nx * (nx + 1) / 4;
      var sig = Math.sqrt(nx * (nx + 1) * (2 * nx + 1) / 24 - tieTerm(dr) / 48);
      var corr = cc ? (alt === 'two.sided' ? Math.sign(zd) * 0.5 : alt === 'greater' ? 0.5 : -0.5) : 0;
      return (zd - corr) / sig;
    }
    var Wmin = Wfun(mumin, correct), Wmax = Wfun(mumax, correct), a = alpha;
    function root(zq) { return uniroot(function (d) { return Wfun(d, correct) - zq; }, mumin, mumax, Wmin - zq, Wmax - zq, tol); }
    var lo, hi;
    if (alt === 'two.sided') {
      while (true) { var md = Wmin - N.qnorm(1 - a / 2), xd2 = Wmax - N.qnorm(a / 2); if (md < 0 || xd2 > 0) a *= 2; else break; }
      if (a < 1) { lo = root(N.qnorm(1 - a / 2)); hi = root(N.qnorm(a / 2)); }
      else { lo = hi = median(x); }
    } else if (alt === 'greater') {
      while (true) { if (Wmin - N.qnorm(1 - a) < 0) a *= 2; else break; }
      lo = a < 1 ? root(N.qnorm(1 - a)) : median(x); hi = Infinity;
    } else {
      while (true) { if (Wmax - N.qnorm(a) > 0) a *= 2; else break; }
      hi = a < 1 ? root(N.qnorm(a)) : median(x); lo = -Infinity;
    }
    var Wmin0 = Wfun(mumin, false), Wmax0 = Wfun(mumax, false);
    var est = uniroot(function (d) { return Wfun(d, false); }, mumin, mumax, Wmin0, Wmax0, tol);
    return { est: est, lo: lo, hi: hi };
  }

  /* ==================== KRUSKAL-WALLIS ==================== */
  function kruskal(groups) {
    var all = [], k = groups.length, i, j;
    for (i = 0; i < k; i++) for (j = 0; j < groups[i].length; j++) all.push(groups[i][j]);
    var n = all.length, r = rank(all), idx = 0, S = 0;
    for (i = 0; i < k; i++) {
      var rs = 0, ni = groups[i].length;
      for (j = 0; j < ni; j++) rs += r[idx++];
      S += rs * rs / ni;
    }
    var H = (12 * S / (n * (n + 1)) - 3 * (n + 1)) / (1 - tieTerm(r) / (n * n * n - n));
    var df = k - 1;
    var p = N.gammq(df / 2, H / 2);          // chi-square upper tail
    var eps2 = H * (n + 1) / (n * n - 1);
    var eta2 = (H - k + 1) / (n - k);
    return { statistic: H, df: df, p: p, eps2: eps2, eta2: eta2, n: n, k: k };
  }

  /* ==================== SIGN TEST ==================== */
  function dbinom(kk, n, pr) {
    if (kk < 0 || kk > n) return 0;
    return Math.exp(lchoose(n, kk) + kk * Math.log(pr) + (n - kk) * Math.log(1 - pr));
  }
  function pbinom(q, n, pr) {                // P(X <= q)
    q = Math.floor(q + 1e-7); if (q < 0) return 0; if (q >= n) return 1;
    var s = 0; for (var k = 0; k <= q; k++) s += dbinom(k, n, pr); return s;
  }
  function binomTwoSided(x, n, pr) {
    if (pr === 0) return x === 0 ? 1 : 0;
    if (pr === 1) return x === n ? 1 : 0;
    var relErr = 1 + 1e-7, d = dbinom(x, n, pr), m = n * pr, y, i;
    if (x === m) return 1;
    if (x < m) {
      y = 0; for (i = Math.ceil(m); i <= n; i++) if (dbinom(i, n, pr) <= d * relErr) y++;
      return pbinom(x, n, pr) + (1 - pbinom(n - y, n, pr));
    } else {
      y = 0; for (i = 0; i <= Math.floor(m); i++) if (dbinom(i, n, pr) <= d * relErr) y++;
      return pbinom(y - 1, n, pr) + (1 - pbinom(x - 1, n, pr));
    }
  }
  function signTest(x, y, opt) {
    opt = opt || {};
    var alt = opt.alt || 'two.sided', alpha = opt.alpha == null ? 0.05 : opt.alpha,
        mu = opt.mu || 0, paired = !!y, i;
    var d = paired ? x.map(function (v, k) { return v - y[k]; }) : x.map(function (v) { return v - mu; });
    var splus = 0, sminus = 0;
    for (i = 0; i < d.length; i++) { if (d[i] > 0) splus++; else if (d[i] < 0) sminus++; }
    var n = splus + sminus, p;
    if (alt === 'less') p = pbinom(splus, n, 0.5);
    else if (alt === 'greater') p = 1 - pbinom(splus - 1, n, 0.5);
    else p = binomTwoSided(splus, n, 0.5);
    // Clopper-Pearson CI on the proportion (binom.test conf.int)
    var lo, hi;
    if (alt === 'two.sided') {
      var a = (1 - (1 - alpha)) / 2;   // = alpha/2
      lo = splus === 0 ? 0 : CI.qbeta(a, splus, n - splus + 1);
      hi = splus === n ? 1 : CI.qbeta(1 - a, splus + 1, n - splus);
    } else if (alt === 'greater') {
      lo = splus === 0 ? 0 : CI.qbeta(alpha, splus, n - splus + 1); hi = 1;
    } else {
      lo = 0; hi = splus === n ? 1 : CI.qbeta(1 - alpha, splus + 1, n - splus);
    }
    return { statistic: splus, splus: splus, sminus: sminus, n: n, p: Math.min(p, 1),
             prop: n ? splus / n : NaN, ciLo: lo, ciHi: hi };
  }

  return {
    rank: rank, median: median, hasTies: hasTies,
    pwilcox: pwilcox, qwilcox: qwilcox, psignrank: psignrank, qsignrank: qsignrank,
    dbinom: dbinom, pbinom: pbinom, binomTwoSided: binomTwoSided,
    mannWhitney: mannWhitney, signedRank: signedRank, kruskal: kruskal, signTest: signTest
  };
}));
