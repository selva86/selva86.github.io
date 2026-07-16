/* Harness: tools/lib/sample-size-t-math.js vs the R truth table.
 * Primary oracle : pwr::pwr.t.test / pwr::pwr.t2n.test
 * Secondary      : stats::power.t.test(strict=TRUE) - looser gate, because R's own
 *                  two functions only agree with each other to ~3e-6 relative
 *                  (uniroot tolerance, not a formula difference).
 */
const M = require('../../tools/lib/sample-size-t-math.js');
const T = require('./sample-size-t-test-calculator.json');

let pass = 0, fail = 0, worst = 0, worstId = '';
const fails = [];

function rel(a, b) {
  if (!isFinite(a) || !isFinite(b)) return (a === b || (isNaN(a) && isNaN(b))) ? 0 : Infinity;
  const den = Math.max(Math.abs(b), 1e-12);
  return Math.abs(a - b) / den;
}
function check(id, got, want, tol) {
  const e = rel(got, want);
  if (e > worst) { worst = e; worstId = id; }
  if (e <= tol) { pass++; return true; }
  fail++; fails.push(`${id}\n    got  ${got}\n    want ${want}\n    rel  ${e.toExponential(3)} (tol ${tol})`);
  return false;
}
const modeOf = t => t === 'one.sample' ? 'one' : t === 'two.sample' ? 'two' : 'paired';
const tailOf = a => a === 'two.sided' ? 2 : 1;

// ---- 1. solve for n, balanced (one / two / paired) ----
//
// TOLERANCE NOTE (adjudicated 2026-07-16, do not tighten back to 1e-6):
//   pwr.t.test roots its power equation with uniroot() at the DEFAULT
//   tol = .Machine$double.eps^0.25 = 1.22e-4, so its own n is only converged to
//   ~1e-6 relative at small n. Evaluating pwr's power body with R's own pt() at
//   both candidates shows pwr's n misses the target power by ~1e-6 while this
//   lib's n misses by ~1e-13 - i.e. where the two differ, THIS lib is the more
//   accurate root of the identical equation, and R is not an oracle at 1e-6 here.
//   So the direct-n gate is 1e-5 (honest re uniroot), and correctness is pinned
//   instead by two stronger checks below: the tolerance-free power identity
//   (suite 1b) and ceiling agreement (suite 1c), which is what the user sees.
T.solveN.forEach(c => {
  const r = M.solveSampleSize(modeOf(c.type), {
    d: c.d, alpha: c.alpha, power: c.power, tail: tailOf(c.tail), ratio: 1
  });
  if (r.error) { fail++; fails.push(`${c.id} -> error: ${r.error}`); return; }
  check(`solveN/${c.id}`, r.nExact, c.n_pwr, 1e-5);
  check(`solveN-ptt/${c.id}`, r.nExact, c.n_powerttest_strict, 1e-5);

  // 1b. power identity - the real correctness criterion, free of uniroot slop.
  // Not circular: powerAt() is itself pinned to pwr's power at 1e-6 by suite 3
  // (336 cases), so "powerAt == pwr" + "solver inverts powerAt exactly" pins n
  // as tightly as R can express it.
  const back = M.powerAt(modeOf(c.type), {
    d: c.d, n: r.nExact, alpha: c.alpha, tail: tailOf(c.tail), ratio: 1
  });
  check(`solveN-identity/${c.id}`, back, c.power, 1e-9);

  // 1c. ceiling agreement - the integer the page actually prints must match the
  // integer an R user gets from ceiling(pwr.t.test(...)$n).
  if (Math.ceil(c.n_pwr - 1e-9) !== r.n1) {
    fail++; fails.push(`solveN-ceil/${c.id}: page prints ${r.n1}, ceiling(pwr n=${c.n_pwr}) = ${Math.ceil(c.n_pwr - 1e-9)}`);
  } else pass++;
});

// ---- 2. solve for n, unequal allocation (n2 = ratio*n1) ----
T.solveNRatio.forEach(c => {
  const r = M.solveSampleSize('two', {
    d: c.d, alpha: c.alpha, power: c.power, tail: tailOf(c.tail), ratio: c.ratio
  });
  if (r.error) { fail++; fails.push(`${c.id} -> error: ${r.error}`); return; }
  // ground truth here is uniroot at tol=sqrt(eps) (tighter than pwr's default), so 1e-6 holds
  check(`solveNRatio-n1/${c.id}`, r.nExact, c.n1, 1e-6);
  check(`solveNRatio-n2/${c.id}`, r.n2Exact, c.n2, 1e-6);
  const back = M.powerAt('two', { d: c.d, n: r.nExact, alpha: c.alpha, tail: tailOf(c.tail), ratio: c.ratio });
  check(`solveNRatio-identity/${c.id}`, back, c.power, 1e-9);
});

// ---- 3. power at a given n ----
T.powerAtN.forEach(c => {
  const got = M.powerAt(modeOf(c.type), {
    d: c.d, n: c.n, alpha: c.alpha, tail: tailOf(c.tail), ratio: 1
  });
  check(`powerAtN/${c.id}`, got, c.power_pwr, 1e-6);
  check(`powerAtN-ptt/${c.id}`, got, c.power_powerttest_strict, 1e-5);
});

// ---- 4. power at an explicit unequal pair (drives "achieved power" after rounding up) ----
T.powerAtN2.forEach(c => {
  const got = M.powerAtPair(c.n1, c.n2, { d: c.d, alpha: c.alpha, tail: tailOf(c.tail) });
  check(`powerAtN2/${c.id}`, got, c.power_t2n, 1e-6);
});

// ---- 5. means + SD -> Cohen's d, and the n it implies ----
T.dFromMeans.forEach(c => {
  const mode = modeOf(c.type);
  let args;
  if (mode === 'one') args = { mean: c.m, mu0: c.mu0, sd: c.sd };
  else if (mode === 'two') args = { mean1: c.m1, mean2: c.m2, sd1: c.s1, sd2: c.s2 };
  else args = { meanDiff: c.mdiff, sdDiff: c.sdiff };
  const r = M.dFromMeans(mode, args);
  check(`dFromMeans/${c.id}`, r.d, c.d, 1e-12);
  const s = M.solveSampleSize(mode, { d: Math.abs(r.d), alpha: 0.05, power: 0.80, tail: 2, ratio: 1 });
  check(`dFromMeans-n/${c.id}`, s.nExact, c.n_at_default, 1e-6);
});

// ---- 6. integer plan sanity: ceiling must never LOSE power vs the target ----
let ceilFail = 0;
T.solveN.forEach(c => {
  const mode = modeOf(c.type);
  const r = M.solveSampleSize(mode, { d: c.d, alpha: c.alpha, power: c.power, tail: tailOf(c.tail), ratio: 1 });
  if (r.error) return;
  if (!(r.achieved >= c.power - 1e-12)) {
    ceilFail++; fails.push(`ceil/${c.id}: achieved ${r.achieved} < target ${c.power}`);
  }
  if (!Number.isInteger(r.n1)) { ceilFail++; fails.push(`ceil/${c.id}: n1 not integer (${r.n1})`); }
});
T.solveNRatio.forEach(c => {
  const r = M.solveSampleSize('two', { d: c.d, alpha: c.alpha, power: c.power, tail: tailOf(c.tail), ratio: c.ratio });
  if (r.error) return;
  if (!(r.achieved >= c.power - 1e-12)) {
    ceilFail++; fails.push(`ceilR/${c.id}: achieved ${r.achieved} < target ${c.power}`);
  }
});
if (ceilFail === 0) pass++; else fail += ceilFail;

// ---- 7. monotonicity the page teaches: n falls as d grows, rises as power grows ----
let monoFail = 0;
for (const mode of ['one', 'two', 'paired']) {
  let prev = Infinity;
  for (const d of [0.1, 0.2, 0.3, 0.5, 0.8, 1.0, 1.5]) {
    const n = M.solveSampleSize(mode, { d, alpha: 0.05, power: 0.8, tail: 2, ratio: 1 }).nExact;
    if (!(n < prev)) { monoFail++; fails.push(`mono-d/${mode}/d=${d}: n=${n} not < ${prev}`); }
    prev = n;
  }
  let prevP = 0;
  for (const pw of [0.5, 0.7, 0.8, 0.9, 0.95, 0.99]) {
    const n = M.solveSampleSize(mode, { d: 0.5, alpha: 0.05, power: pw, tail: 2, ratio: 1 }).nExact;
    if (!(n > prevP)) { monoFail++; fails.push(`mono-pw/${mode}/power=${pw}: n=${n} not > ${prevP}`); }
    prevP = n;
  }
}
if (monoFail === 0) pass++; else fail += monoFail;

// ---- 8. the strict= convention is real and pinned (guards the emitted R line) ----
T.strictConvention.forEach(c => {
  const r = M.solveSampleSize('two', { d: c.d, alpha: c.alpha, power: c.power, tail: 2, ratio: 1 });
  check(`strict/${c.id}-matches-pwr`, r.nExact, c.n_pwr, 1e-6);
  check(`strict/${c.id}-matches-ptt-strict`, r.nExact, c.n_ptt_strict, 1e-5);
  // and confirm the default power.t.test really does differ (else the FAQ claim is wrong)
  if (!(Math.abs(c.n_ptt_default - c.n_pwr) > 1e-4)) {
    fail++; fails.push(`strict/${c.id}: expected power.t.test default to DIFFER from pwr, but it matched`);
  } else pass++;
});

console.log(`\npass ${pass}  fail ${fail}`);
console.log(`worst relative error: ${worst.toExponential(3)}  (${worstId})`);
if (fails.length) { console.log('\nFAILURES:'); fails.slice(0, 25).forEach(f => console.log('  ' + f)); }
process.exit(fail === 0 ? 0 : 1);
