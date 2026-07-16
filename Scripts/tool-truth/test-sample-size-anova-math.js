/* Node harness: tools/lib/sample-size-anova-math.js vs the R truth table.
 *
 * GATES (see the sibling sample-size tools for the precedent):
 *   - power / f / eta2  : 1e-6 relative (R is a true oracle for these)
 *   - direct n          : 1e-5 relative ONLY. pwr.anova.test roots via uniroot at
 *                         the DEFAULT tol = .Machine$double.eps^0.25 = 1.22e-4, so
 *                         R's own n is not converged past ~1e-6. Loosening alone
 *                         would be a cop-out, so n is ALSO gated by:
 *   - power identity    : power(my n) == target at 1e-9. Tolerance-free and
 *                         non-circular: powerAt is itself pinned to pwr at 1e-6
 *                         by the 1152 powerAtN cases.
 *   - ceiling agreement : ceil(mine) == ceil(R's n). The integer the user reads.
 *
 * ONE DOCUMENTED DIVERGENCE FROM pwr (4 of 1115 solveN cases):
 *   R's qf() switches to the chi-square limiting approximation once df2 > 4e5
 *   (src/nmath/qf.c: "fudge the extreme DF cases -- qbeta doesn't do this well"),
 *   and pwr.anova.test inherits it. There R's own pf() disagrees with R's own qf()
 *   by 9.5e-5, and pwr's n misses the requested power by ~1.2e-6. Those cases are
 *   gated against n_true (uniroot on R's pf via the qbeta quantile, tol 1e-10)
 *   instead of against pwr, and we ASSERT that pwr misses while we hit. Only
 *   studies with N > 400000 are affected.
 */
const A = require('../../tools/lib/sample-size-anova-math.js');
const PM = require('../../tools/lib/power-math.js');
const T = require('./sample-size-anova-calculator.json');

let pass = 0, fail = 0;
const fails = [];
let worstRel = 0, worstRelWhat = '';

function rel(a, b) {
  if (!isFinite(a) || !isFinite(b)) return (a === b ? 0 : Infinity);
  const d = Math.abs(a - b);
  const s = Math.max(Math.abs(a), Math.abs(b));
  return s < 1e-12 ? d : d / s;
}
function check(what, got, want, tol) {
  const r = rel(got, want);
  if (r > worstRel && isFinite(r)) { worstRel = r; worstRelWhat = what; }
  if (r <= tol) { pass++; return true; }
  fail++;
  if (fails.length < 25) fails.push(`${what}: got ${got}, want ${want}, rel ${r.toExponential(3)} > ${tol}`);
  return false;
}
function eq(what, got, want) {
  if (got === want) { pass++; return true; }
  fail++;
  if (fails.length < 25) fails.push(`${what}: got ${got}, want ${want}`);
  return false;
}

// ============================================================
// A. solveN  (1115 cases)
// ============================================================
let ceilMismatch = 0, fudgedSeen = 0;
T.solveN.forEach((c, i) => {
  const tag = `solveN[${i}] k=${c.k} f=${c.f} pw=${c.power} a=${c.alpha}`;
  const r = A.solveSampleSize({ f: c.f, k: c.k, alpha: c.alpha, power: c.power });
  if (r.error) { fail++; fails.length < 25 && fails.push(`${tag}: ERROR ${r.error}`); return; }

  // tolerance-free power identity: my n hits the target exactly. Always applies.
  check(`${tag} power-identity`, A.powerAt(c.f, c.k, r.n, c.alpha), c.power, 1e-9);

  if (c.qf_fudged) {
    // R's qf() has silently switched to the chi-square approximation: pwr is NOT
    // the reference here. Gate against the accurate root instead.
    fudgedSeen++;
    check(`${tag} [qf-fudged] n vs n_true`, r.n, c.n_true, 1e-8);
    eq(`${tag} [qf-fudged] ceil vs n_true_ceil`, r.nCeil, c.n_true_ceil);
    // and assert the divergence is REAL and in our favour: pwr's n misses the
    // target power, ours hits it (both judged by R's own pf).
    if (Math.abs(c.power_at_R_n_acc - c.power) > 1e-7) pass++;
    else { fail++; fails.push(`${tag}: expected pwr's n to miss the target, it did not`); }
    if (Math.abs(c.power_at_n_true - c.power) < 1e-9) pass++;
    else { fail++; fails.push(`${tag}: n_true does not hit the target`); }
  } else {
    // 1. direct n. uniroot's tol is ABSOLUTE on the n axis, so at small n a purely
    //    relative gate is tighter than R can actually resolve. Pass on EITHER
    //    1e-5 relative OR uniroot's own 1.22e-4 absolute.
    //    Adjudicated 2026-07-16 for the two cases this admits (k=3,f=1,pw=.5,a=.1 and
    //    k=5,f=1,pw=.5,a=.05, both n ~ 2.2-2.4): judged by R's OWN pf(), pwr's n
    //    misses the target power by ~1e-5 while ours misses by ~1e-10. Ours is the
    //    better root of the identical equation; the gap is pwr's uniroot, not drift.
    const nAbs = Math.abs(r.n - c.n), nRel = rel(r.n, c.n);
    if (nRel <= 1e-5 || nAbs <= 1.22e-4) pass++;
    else { fail++; fails.length < 25 && fails.push(`${tag} n: got ${r.n}, want ${c.n}, rel ${nRel.toExponential(3)} / abs ${nAbs.toExponential(3)}`); }
    // 2. ceiling agreement - the number the user reads
    if (!eq(`${tag} ceil`, r.nCeil, c.n_ceil)) ceilMismatch++;
    // 3. total N
    eq(`${tag} N`, r.N, c.N_total);
    // 4. R's own power-at-its-n, reproduced by my powerAt (independent-impl cross
    //    check of the noncentral F; 1e-8 = ~8 significant digits between two
    //    separate implementations, not a solver tolerance)
    check(`${tag} R power_at_n`, A.powerAt(c.f, c.k, c.n, c.alpha), c.power_at_n, 1e-8);
  }
  // df bookkeeping at the ceiling (always)
  eq(`${tag} df1`, r.df1, c.k - 1);
  eq(`${tag} df2`, r.df2, (r.nCeil - 1) * c.k);
});

// A2. Pin R's qf() fudge itself: threshold, direction and magnitude.
T.qfFudge.cases.forEach((c, i) => {
  const tag = `qfFudge[${i}] df2=${c.df2}`;
  eq(`${tag} fudged flag`, c.fudged, c.df2 > T.qfFudge.threshold);
  if (c.fudged) {
    // R returns the chi-square limit verbatim, and its own pf disagrees with 0.999
    check(`${tag} qf_R == chisq limit`, c.qf_R, c.chisq_limit, 1e-14);
    if (Math.abs(c.pf_at_qf_R - 0.999) > 1e-9) pass++;
    else { fail++; fails.push(`${tag}: expected R's pf to disagree with its own qf`); }
  } else {
    check(`${tag} qf_R == accurate`, c.qf_R, c.qf_accurate, 1e-10);
    check(`${tag} pf(qf_R) == .999`, c.pf_at_qf_R, 0.999, 1e-12);
  }
  check(`${tag} pf(qf_acc) == .999`, c.pf_at_qf_acc, 0.999, 1e-12);
});

// ============================================================
// B. powerAtN  (1152 cases) - the load-bearing pin of powerAt to pwr
// ============================================================
T.powerAtN.forEach((c, i) => {
  const tag = `powerAtN[${i}] k=${c.k} f=${c.f} n=${c.n} a=${c.alpha}`;
  const r = A.solvePower({ f: c.f, k: c.k, n: c.n, alpha: c.alpha });
  if (r.error) { fail++; fails.length < 25 && fails.push(`${tag}: ERROR ${r.error}`); return; }
  check(`${tag} power`, r.power, c.power, 1e-6);
  eq(`${tag} N`, r.N, c.n * c.k);
  eq(`${tag} df2`, r.df2, (c.n - 1) * c.k);
  check(`${tag} ncp`, r.ncp, c.f * c.f * c.k * c.n, 1e-12);
});

// ============================================================
// C. solveF  (280 cases) - detectable effect
// ============================================================
// NOTE ON TOLERANCE: pwr.anova.test solves f with uniroot over c(1e-7, 1e7) at the
// DEFAULT tol = 1.22e-4, which is an ABSOLUTE tolerance on the x (= f) axis. So R's f
// is only converged to ~tol/2 = 6.1e-5 ABSOLUTE, which at f ~ 0.3 is 2e-4 RELATIVE.
// A relative gate is therefore the wrong shape here: gate absolutely at uniroot's own
// tolerance, and lean on the tolerance-free power identity for real accuracy.
let worstFAbs = 0;
T.solveF.forEach((c, i) => {
  const tag = `solveF[${i}] k=${c.k} n=${c.n} pw=${c.power} a=${c.alpha}`;
  const r = A.solveDetectableF({ k: c.k, n: c.n, alpha: c.alpha, power: c.power });
  if (r.error) { fail++; fails.length < 25 && fails.push(`${tag}: ERROR ${r.error}`); return; }
  const absErr = Math.abs(r.f - c.f);
  if (absErr > worstFAbs) worstFAbs = absErr;
  if (absErr <= 1.22e-4) pass++;
  else { fail++; fails.length < 25 && fails.push(`${tag} f: got ${r.f}, want ${c.f}, abs ${absErr.toExponential(3)} > uniroot tol 1.22e-4`); }
  // tolerance-free identity: power at MY f == target, to 1e-9
  check(`${tag} power-identity`, A.powerAt(r.f, c.k, c.n, c.alpha), c.power, 1e-9);
  // ...and my powerAt reproduces R's power at R's f (independent-impl cross check)
  check(`${tag} R power_at_f`, A.powerAt(c.f, c.k, c.n, c.alpha), c.power_at_f, 1e-8);
});

// ============================================================
// D. fFromMeans  (8 cases) + the power.anova.test equivalence
// ============================================================
T.fFromMeans.forEach((c, i) => {
  const means = Array.isArray(c.means) ? c.means : [c.means];
  const tag = `fFromMeans[${i}] k=${c.k}`;
  const r = A.fFromMeans(means, c.sd);
  if (r.error) { fail++; fails.length < 25 && fails.push(`${tag}: ERROR ${r.error}`); return; }
  check(`${tag} f`, r.f, c.f, 1e-12);
  check(`${tag} grand`, r.grand, c.grand_mean, 1e-12);
  check(`${tag} ss`, r.ss, c.ss_between_unit, 1e-12);
  check(`${tag} withinVar`, r.withinVar, c.within_var, 1e-12);
  eq(`${tag} k`, r.k, c.k);
  if (c.f > 0) {
    check(`${tag} eta2`, r.eta2, c.eta2, 1e-12);
    // between.var as R's var() sees it - the bridge to power.anova.test
    check(`${tag} betweenVarR`, r.betweenVarR, c.between_var_R, 1e-12);
    const s = A.solveSampleSize({ f: r.f, k: c.k, alpha: 0.05, power: 0.80 });
    check(`${tag} n`, s.n, c.n_pwr, 1e-5);
    eq(`${tag} nCeil`, s.nCeil, c.n_ceil);
    // my single n must match BOTH R functions (they agree to uniroot tol)
    check(`${tag} n vs power.anova.test`, s.n, c.n_power_anova_test, 1e-4);
  } else {
    // f = 0 (all means equal): power == alpha, no finite n
    const s = A.solveSampleSize({ f: r.f, k: c.k, alpha: 0.05, power: 0.80 });
    if (s.error) pass++; else { fail++; fails.push(`${tag}: f=0 should refuse to solve n`); }
  }
});

// ============================================================
// E. EQUIVALENCE (75 cases): the algebraic bridge between the two R functions.
//    between.var / within.var must equal f^2 * k/(k-1), EXACTLY.
// ============================================================
T.equivalence.forEach((c, i) => {
  const tag = `equiv[${i}] k=${c.k} f=${c.f} pw=${c.power}`;
  // my lib's advertised bridge (within.var = 1)
  const s = A.solveSampleSize({ f: c.f, k: c.k, alpha: 0.05, power: c.power });
  check(`${tag} betweenVarFor1`, s.betweenVarFor1, c.between_var, 1e-12);
  check(`${tag} bridge k/(k-1)`, c.ratio_over_f2, c.k / (c.k - 1), 1e-14);
  // my n reproduces BOTH R routes
  check(`${tag} n vs pwr`, s.n, c.n_pwr, 1e-5);
  check(`${tag} n vs power.anova.test`, s.n, c.n_pat, 1e-4);
  eq(`${tag} ceil vs pwr`, s.nCeil, Math.ceil(c.n_pwr));
  // and R's two routes agree with each other on the ceiling
  eq(`${tag} R routes ceil agree`, c.ceil_agree, true);
});

// ============================================================
// F. k = 2 RECONCILIATION with the two-sample t-test tool.
//    f = d/2  =>  ANOVA n == t-test n. Cross-tool consistency check.
// ============================================================
T.k2Reconcile.forEach((c, i) => {
  const tag = `k2[${i}] d=${c.d} pw=${c.power} a=${c.alpha}`;
  check(`${tag} f == d/2`, c.f, c.d / 2, 1e-15);
  const s = A.solveSampleSize({ f: c.d / 2, k: 2, alpha: c.alpha, power: c.power });
  check(`${tag} n vs pwr.anova`, s.n, c.n_anova, 1e-5);
  check(`${tag} n vs pwr.t.test`, s.n, c.n_t, 1e-4);
  eq(`${tag} ceil == t-test ceil`, s.nCeil, Math.ceil(c.n_t));
  // and against power-math's OWN two-sample t power at the same n: F = t^2
  const pT = PM.powerTwoSampleT(c.d, s.n, c.alpha, 2, 1);
  check(`${tag} anova power == two-sided t power`, A.powerAt(c.d / 2, 2, s.n, c.alpha), pT, 1e-9);
});

// ============================================================
// G. eta2 <-> f
// ============================================================
T.eta2.forEach((c, i) => {
  check(`eta2[${i}] f`, A.fFromEta2(c.eta2), c.f, 1e-12);
  check(`eta2[${i}] round-trip`, A.eta2FromF(A.fFromEta2(c.eta2)), c.back_eta2, 1e-12);
});
T.benchmarks.forEach((c, i) => {
  check(`bench[${i}] eta2`, A.eta2FromF(c.f), c.eta2, 1e-12);
  const s = A.solveSampleSize({ f: c.f, k: 3, alpha: 0.05, power: 0.80 });
  check(`bench[${i}] n`, s.n, c.n_k3_80, 1e-5);
  eq(`bench[${i}] nCeil`, s.nCeil, c.n_k3_80_ceil);
});

// ============================================================
// H. nVsK what-if
// ============================================================
T.nVsK.forEach((c, i) => {
  const s = A.solveSampleSize({ f: c.f, k: c.k, alpha: 0.05, power: 0.80 });
  check(`nVsK[${i}] f=${c.f} k=${c.k} n`, s.n, c.n, 1e-5);
  eq(`nVsK[${i}] f=${c.f} k=${c.k} ceil`, s.nCeil, c.n_ceil);
  eq(`nVsK[${i}] f=${c.f} k=${c.k} N`, s.N, c.N_total);
});
// the taught claim: at fixed f, per-group n FALLS but total N RISES as k grows
[0.10, 0.25, 0.40].forEach(f => {
  const curve = A.nVsK(f, 0.05, 0.80, 2, 10);
  for (let i = 1; i < curve.length; i++) {
    if (!(curve[i].n < curve[i - 1].n)) { fail++; fails.push(`nVsK monotone f=${f}: n rose at k=${curve[i].k}`); }
    else pass++;
    if (!(curve[i].N > curve[i - 1].N)) { fail++; fails.push(`nVsK monotone f=${f}: N fell at k=${curve[i].k}`); }
    else pass++;
  }
});

// ============================================================
// I. Edge cases
// ============================================================
const E = T.edge;
(function () {
  // R's ?power.anova.test doc example: means c(120,130,140,150), within.var 500 -> f = 0.5 exactly
  const dm = A.fFromMeans(E.doc_example.groupmeans, Math.sqrt(E.doc_example['within.var']));
  check('edge doc f', dm.f, E.doc_example.f, 1e-12);
  check('edge doc f == 0.5 exactly', dm.f, 0.5, 1e-15);
  const s = A.solveSampleSize({ f: dm.f, k: 4, alpha: 0.05, power: 0.90 });
  check('edge doc n vs pwr', s.n, E.doc_example.n_pwr, 1e-5);
  check('edge doc n vs power.anova.test', s.n, E.doc_example.n, 1e-4);
  eq('edge doc nCeil', s.nCeil, E.doc_example.n_ceil);

  // textbook free check: k=2, f=0.25 -> 63.7656 -> 64/group (matches the t-test tool at d=0.5)
  const tb = A.solveSampleSize({ f: E.textbook_k2.f, k: 2, alpha: 0.05, power: 0.80 });
  check('edge textbook k2 n', tb.n, E.textbook_k2.n, 1e-5);
  eq('edge textbook k2 ceil==64', tb.nCeil, 64);

  // tiny f
  const tf = A.solveSampleSize({ f: E.tiny_f.f, k: 3, alpha: 0.05, power: 0.80 });
  check('edge tiny f n', tf.n, E.tiny_f.n, 1e-5);
  // power .99
  const p99 = A.solveSampleSize({ f: E.power99.f, k: 4, alpha: 0.05, power: 0.99 });
  check('edge power99 n', p99.n, E.power99.n, 1e-5);
  // many groups k=8
  const k8 = A.solveSampleSize({ f: E.k8.f, k: 8, alpha: 0.05, power: 0.80 });
  check('edge k8 n', k8.n, E.k8.n, 1e-5);
  // n=2 floor
  check('edge n2 power', A.powerAt(E.n2.f, 3, 2, 0.05), E.n2.power, 1e-6);
  // f = 0 -> power == alpha
  check('edge f0 power==alpha', A.powerAt(0, 3, 20, 0.05), E.f0.power, 1e-9);
})();

// ============================================================
// J. Input handling / guards (no R oracle needed)
// ============================================================
(function () {
  const bad = [
    ['k=1', A.solveSampleSize({ f: 0.25, k: 1, alpha: 0.05, power: 0.8 })],
    ['k=2.5', A.solveSampleSize({ f: 0.25, k: 2.5, alpha: 0.05, power: 0.8 })],
    ['f=0', A.solveSampleSize({ f: 0, k: 3, alpha: 0.05, power: 0.8 })],
    ['f=NaN', A.solveSampleSize({ f: NaN, k: 3, alpha: 0.05, power: 0.8 })],
    ['alpha=0', A.solveSampleSize({ f: 0.25, k: 3, alpha: 0, power: 0.8 })],
    ['alpha=1', A.solveSampleSize({ f: 0.25, k: 3, alpha: 1, power: 0.8 })],
    ['power=1', A.solveSampleSize({ f: 0.25, k: 3, alpha: 0.05, power: 1 })],
    ['power<alpha', A.solveSampleSize({ f: 0.25, k: 3, alpha: 0.5, power: 0.3 })],
    ['n<2 power', A.solvePower({ f: 0.25, k: 3, n: 1, alpha: 0.05 })],
    ['sd=0', A.fFromMeans([1, 2, 3], 0)],
    ['sd<0', A.fFromMeans([1, 2, 3], -1)],
    ['one mean', A.fFromMeans([1], 1)],
    ['NaN mean', A.fFromMeans([1, NaN], 1)]
  ];
  bad.forEach(([name, r]) => {
    if (r && r.error) pass++;
    else { fail++; fails.push(`guard ${name}: expected an error, got ${JSON.stringify(r)}`); }
  });
  // huge f -> pinned at the n=2 floor, flagged, NOT an error
  const hf = A.solveSampleSize({ f: 5, k: 3, alpha: 0.05, power: 0.8 });
  if (hf.atFloor === true && hf.nCeil === 2) pass++;
  else { fail++; fails.push(`huge f: expected atFloor n=2, got ${JSON.stringify(hf)}`); }
})();

// ============================================================
// K2. THE EMITTED "#>" PRECISION CONTRACT.
//     A "#>" comment asserts what R prints, so the page may only claim digits R
//     actually reproduces. pwr roots n and f via uniroot at tol 1.22e-4, so its
//     own trailing digits wobble: claiming 7 significant digits of n is FALSE in
//     288 / 1111 cases. These are the roundings sample-size-anova-ui.js emits
//     (nR / fR / powR). If someone tightens them, this gate fails loudly.
// ============================================================
(function () {
  var nBad = 0, fBad = 0, pBad = 0;
  T.solveN.filter(function (c) { return !c.qf_fudged; }).forEach(function (c) {
    var r = A.solveSampleSize({ f: c.f, k: c.k, alpha: c.alpha, power: c.power });
    if (!r.error && r.n.toFixed(2) !== c.n.toFixed(2)) nBad++;
  });
  T.solveF.forEach(function (c) {
    var r = A.solveDetectableF({ k: c.k, n: c.n, alpha: c.alpha, power: c.power });
    if (!r.error && r.f.toFixed(2) !== c.f.toFixed(2)) fBad++;
  });
  T.powerAtN.forEach(function (c) {
    var r = A.solvePower({ f: c.f, k: c.k, n: c.n, alpha: c.alpha });
    if (!r.error && r.power.toFixed(6) !== c.power.toFixed(6)) pBad++;
  });
  eq('emitted #> n at 2dp matches R everywhere', nBad, 0);
  eq('emitted #> f at 2dp matches R everywhere', fBad, 0);
  eq('emitted #> power at 6dp matches R everywhere', pBad, 0);
  // and the integer the user actually acts on
  var cBad = 0;
  T.solveN.filter(function (c) { return !c.qf_fudged; }).forEach(function (c) {
    var r = A.solveSampleSize({ f: c.f, k: c.k, alpha: c.alpha, power: c.power });
    if (!r.error && r.nCeil !== c.n_ceil) cBad++;
  });
  eq('ceiling n matches R everywhere', cBad, 0);
})();

// ============================================================
// K. power-math must NOT have been edited (blast-radius proof)
// ============================================================
(function () {
  const crypto = require('crypto'), fs = require('fs');
  const md5 = crypto.createHash('md5').update(fs.readFileSync(require.resolve('../../tools/lib/power-math.js'))).digest('hex');
  if (md5.slice(0, 8) === 'ff8f3f6a') pass++;
  else { fail++; fails.push(`power-math.js md5 changed: ${md5.slice(0, 8)} != ff8f3f6a (its ?v pin on 4 other pages)`); }
})();

console.log(`\n${pass} passed, ${fail} failed`);
console.log(`worst relative error: ${worstRel.toExponential(3)}  (${worstRelWhat})`);
console.log(`worst solveF absolute error: ${worstFAbs.toExponential(3)}  (uniroot's own tol: 1.22e-4)`);
console.log(`solveN cases hitting R's qf df2>4e5 fudge (gated vs the accurate root): ${fudgedSeen}`);
if (ceilMismatch) console.log(`ceiling mismatches: ${ceilMismatch}`);
if (fails.length) { console.log('\nfailures:'); fails.forEach(f => console.log('  ' + f)); }
process.exit(fail ? 1 : 0);
