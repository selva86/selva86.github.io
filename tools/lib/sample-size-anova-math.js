/* sample-size-anova-math.js - sample size / power for a balanced one-way ANOVA.
 *
 * COMPOSES tools/lib/power-math.js (PowerMath). It adds NO distribution
 * primitives of its own: power-math already carries pf_nc / qf and a
 * powerAnova() whose parameterisation is exactly pwr.anova.test's:
 *
 *     lambda = k * n * f^2 ,  df1 = k - 1 ,  df2 = (n - 1) * k
 *
 * Verified against pwr::pwr.anova.test and stats::power.anova.test (R 4.6.0).
 *
 * THE TWO R FUNCTIONS AGREE EXACTLY, once you know which variance each wants:
 *     pwr.anova.test   : lambda = k * n * f^2
 *     power.anova.test : lambda = (k - 1) * n * (between.var / within.var)
 * Cohen's f uses the POPULATION spread of the means (divide by k); R's var()
 * uses the SAMPLE denominator (k - 1). So with between.var = var(means):
 *     between.var / within.var = f^2 * k / (k - 1)
 *     (k - 1) * n * f^2 * k/(k-1) = k * n * f^2       <- pwr's lambda, exactly.
 * Both use the same df. Any residual gap is uniroot tolerance, not a formula.
 *
 * k = 2 is the two-sided two-sample t-test (F = t^2). Cohen's f = d/2 there,
 * so solveSampleSize({f: d/2, k: 2}) reproduces the t-test tool's n.
 *
 * UMD: browser global SampleSizeAnovaMath / CommonJS require.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./power-math.js'));
  } else {
    root.SampleSizeAnovaMath = factory(root.PowerMath);
  }
}(typeof self !== 'undefined' ? self : this, function (PM) {
  'use strict';

  var N_MIN = 2;          // ANOVA needs >= 2 observations per group (pwr enforces this)
  var K_MIN = 2;

  function isNum(x) { return typeof x === 'number' && isFinite(x); }
  function fmt(x, dp) {
    if (!isFinite(x)) return '∞';
    var v = Math.abs(x) >= 1e6 ? x.toPrecision(6) : x.toFixed(dp == null ? 4 : dp);
    return String(v);
  }

  // ---------------------------------------------------------------
  // Effect size: Cohen's f  <->  eta-squared
  //   f    = sqrt(eta2 / (1 - eta2))
  //   eta2 = f^2 / (1 + f^2)
  // ---------------------------------------------------------------
  function fFromEta2(eta2) {
    if (!isNum(eta2) || eta2 < 0 || eta2 >= 1) return NaN;
    return Math.sqrt(eta2 / (1 - eta2));
  }
  function eta2FromF(f) {
    if (!isNum(f) || f < 0) return NaN;
    return (f * f) / (1 + f * f);
  }

  // ---------------------------------------------------------------
  // Cohen's f from group means + one common within-group SD.
  //   sigma_m = sqrt( sum((m_i - mbar)^2) / k )     <- POPULATION denominator k
  //   f       = sigma_m / sd
  // Returns the full arithmetic so the page can show its work.
  // ---------------------------------------------------------------
  function fFromMeans(means, sd) {
    if (!means || means.length < K_MIN) {
      return { f: NaN, error: 'Enter at least two group means.' };
    }
    for (var i = 0; i < means.length; i++) {
      if (!isNum(means[i])) return { f: NaN, error: 'Every group mean must be a number.' };
    }
    if (!isNum(sd) || sd <= 0) {
      return { f: NaN, error: 'The within-group SD must be greater than 0.' };
    }
    var k = means.length;
    var sum = 0, j;
    for (j = 0; j < k; j++) sum += means[j];
    var grand = sum / k;
    var ss = 0, devs = [];
    for (j = 0; j < k; j++) {
      var dv = means[j] - grand;
      devs.push(dv);
      ss += dv * dv;
    }
    var sigmaM = Math.sqrt(ss / k);           // population SD of the means
    var f = sigmaM / sd;
    var betweenVarR = k > 1 ? ss / (k - 1) : NaN;  // what R's var(means) returns
    return {
      f: f, k: k, grand: grand, devs: devs, ss: ss,
      sigmaM: sigmaM, sd: sd,
      betweenVarR: betweenVarR,               // for the power.anova.test emitter
      withinVar: sd * sd,
      eta2: eta2FromF(f),
      steps: [
        { label: 'Grand mean', expr: '(' + means.join(' + ') + ') / ' + k, val: fmt(grand, 4) },
        { label: 'Sum of squared deviations', expr: 'Σ(mᵢ − ' + fmt(grand, 4) + ')²', val: fmt(ss, 4) },
        { label: 'SD of the means', expr: '√(' + fmt(ss, 4) + ' / ' + k + ')', val: fmt(sigmaM, 4) },
        { label: "Cohen's f", expr: fmt(sigmaM, 4) + ' / ' + fmt(sd, 4), val: fmt(f, 4) }
      ]
    };
  }

  // ---------------------------------------------------------------
  // Power at a given per-group n (thin wrapper on PM.powerAnova).
  // ---------------------------------------------------------------
  function powerAt(f, k, n, alpha) {
    return PM.powerAnova(Math.abs(f), k, n, alpha);
  }

  function validate(p) {
    if (!isNum(p.k) || p.k < K_MIN) return 'Number of groups must be at least 2.';
    if (Math.abs(p.k - Math.round(p.k)) > 1e-9) return 'Number of groups must be a whole number.';
    if (!isNum(p.alpha) || p.alpha <= 0 || p.alpha >= 1) return 'Alpha must be between 0 and 1.';
    return null;
  }

  // ---------------------------------------------------------------
  // MODE 1 - solve n per group.  Mirrors pwr.anova.test(k, f, sig.level, power).
  // ---------------------------------------------------------------
  function solveSampleSize(p) {
    var bad = validate(p);
    if (bad) return { error: bad };
    var f = Math.abs(p.f), k = Math.round(p.k), a = p.alpha, target = p.power;
    if (!isNum(f) || f <= 0) return { error: "Cohen's f must be greater than 0." };
    if (!isNum(target) || target <= 0 || target >= 1) return { error: 'Power must be between 0 and 1.' };
    if (target <= a) return { error: 'Power must exceed alpha, otherwise the test is no better than chance.' };

    // If n = 2 (the smallest legal group) already clears the target, pwr's uniroot
    // bracket has no sign change and errors. Report the floor honestly instead.
    var pAtFloor = powerAt(f, k, N_MIN, a);
    if (pAtFloor >= target) {
      return {
        n: N_MIN, nCeil: N_MIN, N: N_MIN * k, f: f, k: k, alpha: a, power: target,
        atFloor: true, powerAtN: pAtFloor,
        df1: k - 1, df2: (N_MIN - 1) * k, ncp: f * f * k * N_MIN,
        eta2: eta2FromF(f)
      };
    }

    var n = PM.solveN('anova', { effect: f, k: k, alpha: a }, target);
    if (!isFinite(n)) return { error: 'That combination needs an impractically large sample.' };
    var nCeil = Math.ceil(n - 1e-9);
    if (nCeil < N_MIN) nCeil = N_MIN;
    return {
      n: n, nCeil: nCeil, N: nCeil * k, f: f, k: k, alpha: a, power: target,
      powerAtN: powerAt(f, k, n, a),           // == target, the tolerance-free identity
      powerAtCeil: powerAt(f, k, nCeil, a),    // the power actually bought
      df1: k - 1, df2: (nCeil - 1) * k,
      ncp: f * f * k * nCeil,
      ncpExact: f * f * k * n,
      eta2: eta2FromF(f),
      // the power.anova.test bridge for this f: between.var that reproduces it
      betweenVarFor1: f * f * k / (k - 1)      // with within.var = 1
    };
  }

  // ---------------------------------------------------------------
  // MODE 2 - solve power from an n you can afford.
  // ---------------------------------------------------------------
  function solvePower(p) {
    var bad = validate(p);
    if (bad) return { error: bad };
    var f = Math.abs(p.f), k = Math.round(p.k), a = p.alpha, n = p.n;
    if (!isNum(f) || f < 0) return { error: "Cohen's f cannot be negative." };
    if (!isNum(n) || n < N_MIN) return { error: 'Each group needs at least 2 observations.' };
    var pw = powerAt(f, k, n, a);
    return {
      power: pw, n: n, N: n * k, f: f, k: k, alpha: a,
      df1: k - 1, df2: (n - 1) * k, ncp: f * f * k * n,
      eta2: eta2FromF(f), beta: 1 - pw
    };
  }

  // ---------------------------------------------------------------
  // MODE 3 - solve the smallest detectable f for a fixed n.
  // ---------------------------------------------------------------
  function solveDetectableF(p) {
    var bad = validate(p);
    if (bad) return { error: bad };
    var k = Math.round(p.k), a = p.alpha, n = p.n, target = p.power;
    if (!isNum(n) || n < N_MIN) return { error: 'Each group needs at least 2 observations.' };
    if (!isNum(target) || target <= 0 || target >= 1) return { error: 'Power must be between 0 and 1.' };
    if (target <= a) return { error: 'Power must exceed alpha, otherwise the test is no better than chance.' };
    var f = PM.solveEffect('anova', { n: n, k: k, alpha: a }, target);
    if (!isFinite(f)) return { error: 'No finite effect size reaches that power at this sample size.' };
    return {
      f: f, n: n, N: n * k, k: k, alpha: a, power: target,
      powerAtF: powerAt(f, k, n, a),
      eta2: eta2FromF(f),
      df1: k - 1, df2: (n - 1) * k, ncp: f * f * k * n
    };
  }

  // ---------------------------------------------------------------
  // Cohen's benchmarks for f. Deliberately carries the domain caveat.
  // ---------------------------------------------------------------
  function benchmark(f) {
    var a = Math.abs(f);
    if (a < 0.10) return { label: 'below small', note: "smaller than Cohen's smallest benchmark (0.10)" };
    if (a < 0.25) return { label: 'small', note: "around Cohen's small benchmark (0.10)" };
    if (a < 0.40) return { label: 'medium', note: "around Cohen's medium benchmark (0.25)" };
    return { label: 'large', note: "at or above Cohen's large benchmark (0.40)" };
  }

  // ---------------------------------------------------------------
  // What-if curves
  // ---------------------------------------------------------------
  // n per group and total N as k varies at fixed f.
  function nVsK(f, alpha, target, kMin, kMax) {
    var out = [];
    for (var k = kMin; k <= kMax; k++) {
      var r = solveSampleSize({ f: f, k: k, alpha: alpha, power: target });
      if (r.error) { out.push({ k: k, n: NaN, N: NaN }); continue; }
      out.push({ k: k, n: r.n, nCeil: r.nCeil, N: r.N });
    }
    return out;
  }
  // power as a function of per-group n.
  function powerCurve(f, k, alpha, nMax, points) {
    var pts = [], m = points || 60;
    for (var i = 0; i <= m; i++) {
      var n = N_MIN + (nMax - N_MIN) * (i / m);
      pts.push({ n: n, power: powerAt(f, k, n, alpha) });
    }
    return pts;
  }
  // n as a function of f at fixed k.
  function nVsF(k, alpha, target, fMin, fMax, points) {
    var pts = [], m = points || 60;
    for (var i = 0; i <= m; i++) {
      var f = fMin + (fMax - fMin) * (i / m);
      if (f <= 0) continue;
      var r = solveSampleSize({ f: f, k: k, alpha: alpha, power: target });
      if (!r.error) pts.push({ f: f, n: r.n });
    }
    return pts;
  }

  return {
    N_MIN: N_MIN,
    fFromEta2: fFromEta2,
    eta2FromF: eta2FromF,
    fFromMeans: fFromMeans,
    powerAt: powerAt,
    solveSampleSize: solveSampleSize,
    solvePower: solvePower,
    solveDetectableF: solveDetectableF,
    benchmark: benchmark,
    nVsK: nVsK,
    powerCurve: powerCurve,
    nVsF: nVsF
  };
}));
