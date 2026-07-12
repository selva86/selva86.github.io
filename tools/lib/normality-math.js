/* normality-math.js  -  normality tests, verified against R 4.6.0.
   Ground truth: Scripts/tool-truth/normality-test-picker.json.

   Implements the four formal tests the Normality Test Picker offers, each a
   faithful port of the reference implementation R users actually run:
     shapiroWilk  -> stats::shapiro.test   (Royston 1995, AS R94; swilk.c)
     andersonDarling -> nortest::ad.test   (Stephens 1986 p-value fit)
     lilliefors   -> nortest::lillie.test  (Dallal-Wilkinson + Molin-Abdi 1998)
     jarqueBera   -> tseries::jarque.bera.test

   Why a faithful port matters (bugs common in quick reimplementations, all
   avoided here): the Shapiro-Wilk weight polynomial takes 1/sqrt(n) as its
   argument (NOT the largest expected order statistic), n=3 has an exact
   closed-form p-value (not NaN), and n<=11 uses a different p-value transform
   than n>=12; Anderson-Darling needs a minimum n of 8 and log-space normal
   CDFs for tail accuracy; Lilliefors uses the Molin-Abdi analytic p-value with
   a small-sample polynomial correction when p>0.1, not a single exp() fit.

   Distribution primitives (pnorm/qnorm/lgamma/gammq) are reused from
   normal-math.js (itself verified against R pnorm/qnorm).

   UMD: browser global (window.NormalityMath) + Node require. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./normal-math.js'));
  } else {
    root.NormalityMath = factory(root.NormalMath);
  }
}(typeof self !== 'undefined' ? self : this, function (NM) {
  'use strict';

  if (!NM) throw new Error('normality-math.js requires normal-math.js (NormalMath)');
  var pnorm = NM.pnorm, qnorm = NM.qnorm, gammq = NM.gammq;

  // ---- helpers --------------------------------------------------------------

  // Horner evaluation of c[0] + c[1] x + ... + c[k-1] x^(k-1)  (== R's poly()).
  function poly(c, x) {
    var p = c[c.length - 1];
    for (var i = c.length - 2; i >= 0; i--) p = p * x + c[i];
    return p;
  }

  // log standard-normal CDF, accurate in the far left tail (matches R's
  // pnorm(z, log.p=TRUE)). log(pnorm(z)) is already accurate while pnorm(z)
  // is representable; below that use the asymptotic series.
  function logpnorm(z) {
    var p = pnorm(z);
    if (p > 1e-300) return Math.log(p);
    var t = -z;               // t large & positive
    var t2 = t * t;
    return -0.5 * t2 - Math.log(t) - 0.5 * Math.log(2 * Math.PI)
           + Math.log(1 - 1 / t2 + 3 / (t2 * t2) - 15 / (t2 * t2 * t2));
  }

  function sorted(x) { return x.slice().sort(function (a, b) { return a - b; }); }

  // n, mean, sample sd, population skew, population excess kurtosis
  function summaryStats(x) {
    var n = x.length;
    if (!n) return { n: 0, mean: NaN, sd: NaN, skew: NaN, exKurt: NaN };
    var mean = 0, i;
    for (i = 0; i < n; i++) mean += x[i];
    mean /= n;
    var m2 = 0, m3 = 0, m4 = 0;
    for (i = 0; i < n; i++) { var d = x[i] - mean; var d2 = d * d; m2 += d2; m3 += d2 * d; m4 += d2 * d2; }
    m2 /= n; m3 /= n; m4 /= n;
    var sd = n > 1 ? Math.sqrt(m2 * n / (n - 1)) : 0;
    var skew = m2 > 0 ? m3 / Math.pow(m2, 1.5) : 0;
    var exKurt = m2 > 0 ? m4 / (m2 * m2) - 3 : 0;
    return { n: n, mean: mean, sd: sd, skew: skew, exKurt: exKurt };
  }

  // ---- Shapiro-Wilk : faithful port of R stats swilk.c (Royston AS R94) -----
  var SW_C1 = [0, 0.221157, -0.147981, -2.071190, 4.434685, -2.706056];
  var SW_C2 = [0, 0.042981, -0.293762, -1.752461, 5.682633, -3.582633];
  var SW_G  = [-2.273, 0.459];
  var SW_C3 = [0.544, -0.39978, 0.025054, -6.714e-4];
  var SW_C4 = [1.3822, -0.77857, 0.062767, -0.0020322];
  var SW_C5 = [-1.5861, -0.31082, -0.083751, 0.0038915];
  var SW_C6 = [-0.4803, -0.082676, 0.0030302];

  function shapiroWilk(xIn) {
    var n = xIn.length;
    if (n < 3 || n > 5000) return null;
    var x = sorted(xIn);                 // 0-indexed ascending
    var range = x[n - 1] - x[0];
    if (range <= 0) return null;         // all identical -> R errors

    var nn2 = Math.floor(n / 2);
    var a = new Array(nn2 + 1);          // 1-indexed weights a[1..nn2]
    var i, j;

    if (n === 3) {
      a[1] = Math.SQRT1_2;
    } else {
      var an25 = n + 0.25, summ2 = 0;
      for (i = 1; i <= nn2; i++) { a[i] = qnorm((i - 0.375) / an25); summ2 += a[i] * a[i]; }
      summ2 *= 2;
      var ssumm2 = Math.sqrt(summ2);
      var rsn = 1 / Math.sqrt(n);
      var a1 = poly(SW_C1, rsn) - a[1] / ssumm2;
      var i1, fac;
      if (n > 5) {
        i1 = 3;
        var a2 = -a[2] / ssumm2 + poly(SW_C2, rsn);
        fac = Math.sqrt((summ2 - 2 * a[1] * a[1] - 2 * a[2] * a[2]) /
                        (1 - 2 * a1 * a1 - 2 * a2 * a2));
        a[2] = a2;
      } else {
        i1 = 2;
        fac = Math.sqrt((summ2 - 2 * a[1] * a[1]) / (1 - 2 * a1 * a1));
      }
      a[1] = a1;
      for (i = i1; i <= nn2; i++) a[i] = -a[i] / fac;
    }

    // full antisymmetric weight for order statistic i (1..n):
    //   w(i) = sign(i-j) * a[min(i,j)] with j = n+1-i, and 0 when i==j.
    function wt(i) {
      j = n + 1 - i;
      if (i === j) return 0;
      var s = i > j ? 1 : -1;
      return s * a[Math.min(i, j)];
    }

    var sa = 0, sx = 0;
    for (i = 1; i <= n; i++) { sa += wt(i); sx += x[i - 1] / range; }
    sa /= n; sx /= n;

    var ssa = 0, ssx = 0, sax = 0;
    for (i = 1; i <= n; i++) {
      var asa = wt(i) - sa;
      var xsx = x[i - 1] / range - sx;
      ssa += asa * asa; ssx += xsx * xsx; sax += asa * xsx;
    }
    var ssassx = Math.sqrt(ssa * ssx);
    var w1 = (ssassx - sax) * (ssassx + sax) / (ssa * ssx);
    var W = 1 - w1;

    // significance level
    var p, m, s, y, xx;
    if (n === 3) {
      var PI6 = 1.90985931710274, STQR = 1.04719755119660; // 6/pi, asin(sqrt(3/4))
      p = PI6 * (Math.asin(Math.sqrt(W)) - STQR);
      if (p < 0) p = 0;
      if (p > 1) p = 1;
    } else {
      y = Math.log(w1);
      xx = Math.log(n);
      if (n <= 11) {
        var gamma = poly(SW_G, n);
        if (y >= gamma) return { W: W, p: 1e-99 };
        y = -Math.log(gamma - y);
        m = poly(SW_C3, n);
        s = Math.exp(poly(SW_C4, n));
      } else {
        m = poly(SW_C5, xx);
        s = Math.exp(poly(SW_C6, xx));
      }
      p = 1 - pnorm((y - m) / s);       // upper tail
    }
    return { W: W, p: p };
  }

  // ---- Anderson-Darling : port of nortest ad.test (n>=8) --------------------
  function andersonDarling(xIn) {
    var n = xIn.length;
    if (n < 8) return null;
    var x = sorted(xIn);
    var ss = summaryStats(x);
    if (!(ss.sd > 0)) return null;
    var mean = ss.mean, sd = ss.sd;
    var lp1 = new Array(n), lp2 = new Array(n);
    for (var i = 0; i < n; i++) {
      var z = (x[i] - mean) / sd;
      lp1[i] = logpnorm(z);
      lp2[i] = logpnorm(-z);
    }
    var h = 0;                            // sum of (2i-1)*(logp1[i] + rev(logp2)[i])
    for (i = 0; i < n; i++) h += (2 * (i + 1) - 1) * (lp1[i] + lp2[n - 1 - i]);
    var A = -n - h / n;                   // R ad.test reports this unadjusted A
    var AA = (1 + 0.75 / n + 2.25 / (n * n)) * A;   // adjusted only for the p-value
    var p;
    if (AA < 0.2)       p = 1 - Math.exp(-13.436 + 101.14 * AA - 223.73 * AA * AA);
    else if (AA < 0.34) p = 1 - Math.exp(-8.318 + 42.796 * AA - 59.938 * AA * AA);
    else if (AA < 0.6)  p = Math.exp(0.9177 - 4.279 * AA - 1.38 * AA * AA);
    else if (AA < 10)   p = Math.exp(1.2937 - 5.709 * AA + 0.0186 * AA * AA);
    else                p = 3.7e-24;
    return { A2: A, Astar: AA, p: p };
  }

  // ---- Lilliefors (KS) : port of nortest lillie.test (n>=5) -----------------
  function lilliefors(xIn) {
    var n = xIn.length;
    if (n < 5) return null;
    var x = sorted(xIn);
    var ss = summaryStats(x);
    if (!(ss.sd > 0)) return null;
    var mean = ss.mean, sd = ss.sd;
    var Dplus = -Infinity, Dminus = -Infinity;
    for (var i = 0; i < n; i++) {
      var p = pnorm((x[i] - mean) / sd);
      var dp = (i + 1) / n - p;           // i/n - p (1-indexed i)
      var dm = p - i / n;                 // p - (i-1)/n
      if (dp > Dplus) Dplus = dp;
      if (dm > Dminus) Dminus = dm;
    }
    var K = Math.max(Dplus, Dminus);
    var Kd, nd;
    if (n <= 100) { Kd = K; nd = n; }
    else { Kd = K * Math.pow(n / 100, 0.49); nd = 100; }
    var pvalue = Math.exp(-7.01256 * Kd * Kd * (nd + 2.78019)
                          + 2.99587 * Kd * Math.sqrt(nd + 2.78019)
                          - 0.122119 + 0.974598 / Math.sqrt(nd) + 1.67997 / nd);
    if (pvalue > 0.1) {
      var KK = (Math.sqrt(n) - 0.01 + 0.85 / Math.sqrt(n)) * K;
      if (KK <= 0.302) pvalue = 1;
      else if (KK <= 0.5) pvalue = 2.76773 - 19.828315 * KK + 80.709644 * KK * KK - 138.55152 * Math.pow(KK, 3) + 81.218052 * Math.pow(KK, 4);
      else if (KK <= 0.9) pvalue = -4.901232 + 40.662806 * KK - 97.490286 * KK * KK + 94.029866 * Math.pow(KK, 3) - 32.355711 * Math.pow(KK, 4);
      else if (KK <= 1.31) pvalue = 6.198765 - 19.558097 * KK + 23.186922 * KK * KK - 12.234627 * Math.pow(KK, 3) + 2.423045 * Math.pow(KK, 4);
      else pvalue = 0;
    }
    return { D: K, p: pvalue };
  }

  // ---- Jarque-Bera : port of tseries jarque.bera.test -----------------------
  function jarqueBera(xIn) {
    var n = xIn.length;
    if (n < 2) return null;
    var m1 = 0, i;
    for (i = 0; i < n; i++) m1 += xIn[i];
    m1 /= n;
    var m2 = 0, m3 = 0, m4 = 0;
    for (i = 0; i < n; i++) { var d = xIn[i] - m1, d2 = d * d; m2 += d2; m3 += d2 * d; m4 += d2 * d2; }
    m2 /= n; m3 /= n; m4 /= n;
    if (!(m2 > 0)) return null;
    var b1 = Math.pow(m3 / Math.pow(m2, 1.5), 2);   // squared skewness
    var b2 = m4 / (m2 * m2);                          // kurtosis (not excess)
    var JB = n * b1 / 6 + n * (b2 - 3) * (b2 - 3) / 24;
    var p = chiSqUpper(JB, 2);
    return { JB: JB, skew: m3 / Math.pow(m2, 1.5), exKurt: b2 - 3, p: p };
  }

  // upper-tail chi-square = Q(df/2, x/2) via reused regularized gamma
  function chiSqUpper(x, df) {
    if (x <= 0) return 1;
    return gammq(df / 2, x / 2);
  }

  // ---- parse a pasted blob of numbers (thousands-separator tolerant) --------
  function parseData(text) {
    if (!text) return [];
    var cleaned = String(text), prev;
    do { prev = cleaned; cleaned = cleaned.replace(/(\d),(\d{3})(?=\D|$)/g, '$1$2'); } while (cleaned !== prev);
    var tokens = cleaned.split(/[\s,;]+/);
    var out = [];
    for (var i = 0; i < tokens.length; i++) {
      if (!tokens[i].length) continue;
      var v = parseFloat(tokens[i]);
      if (isFinite(v)) out.push(v);
    }
    return out;
  }

  // dispatch by test key used across the UI
  function runTest(key, x) {
    if (key === 'sw') return shapiroWilk(x);
    if (key === 'ad') return andersonDarling(x);
    if (key === 'lillie') return lilliefors(x);
    if (key === 'jb') return jarqueBera(x);
    return null;                       // 'qq' is visual-only
  }

  return {
    shapiroWilk: shapiroWilk,
    andersonDarling: andersonDarling,
    lilliefors: lilliefors,
    jarqueBera: jarqueBera,
    summaryStats: summaryStats,
    chiSqUpper: chiSqUpper,
    logpnorm: logpnorm,
    parseData: parseData,
    runTest: runTest,
    pnorm: pnorm,
    qnorm: qnorm
  };
}));
