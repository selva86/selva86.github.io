/* Harness: tools/lib/sample-size-prop-math.js vs the R truth table.
 *
 * Gating philosophy (learned building sample-size-t-test-calculator):
 *   - "power at a given n" is a direct formula evaluation in R, with no root
 *     finding anywhere. It IS an oracle. Gated at 1e-9.
 *   - "n" comes out of uniroot. pwr uses uniroot's DEFAULT tol (1.22e-4);
 *     power.prop.test passes the same tol explicitly. R's n is therefore only
 *     good to ~1e-4 and is NOT an oracle at 1e-6. Comparing raw n at 1e-6 would
 *     fail on R's own tolerance, not on our math.
 *     So n is gated on:
 *       (a) ceiling agreement with R, and
 *       (b) the tolerance-free power identity: power(n_exact) == target.
 *     Where the ceilings disagree, the case is adjudicated with R's own
 *     tolerance-free power function: whoever's ceiling is the true smallest
 *     integer with power >= target wins. That verdict is printed, never hidden.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const M = require('../../tools/lib/sample-size-prop-math.js');
const PM = require('../../tools/lib/power-math.js');

const truth = JSON.parse(fs.readFileSync(path.join(__dirname, 'sample-size-proportion-calculator.json'), 'utf8'));

let pass = 0, fail = 0, adjudicated = 0;
const fails = [];
let worst = 0, worstCase = '';

function rel(got, want) {
  if (!isFinite(got) && !isFinite(want)) return 0;
  const d = Math.abs(got - want);
  const s = Math.max(Math.abs(want), 1e-12);
  return Math.abs(want) < 1e-10 ? d : d / s;
}
function check(name, got, want, tol) {
  const r = rel(got, want);
  if (r > worst) { worst = r; worstCase = name; }
  if (!(r <= tol)) {
    fail++;
    if (fails.length < 25) fails.push(`${name}\n     got  ${got}\n     want ${want}\n     rel  ${r.toExponential(3)} > ${tol}`);
  } else pass++;
}
function eq(name, cond, detail) {
  if (cond) pass++;
  else { fail++; if (fails.length < 25) fails.push(`${name}: ${detail}`); }
}
const altTail = (a) => (a === 'two.sided' ? 2 : 1);

// ---------------------------------------------------------------
console.log('--- 1. Cohen\'s h (ES.h) ---');
for (const c of truth.h) {
  check(`h(${c.p1}, ${c.p2})`, M.cohenH(c.p1, c.p2), c.h, 1e-12);
}

// ---------------------------------------------------------------
console.log('--- 2. arcsine power at n: pwr.p.test / pwr.2p.test / pwr.2p2n.test ---');
for (const c of truth.powerOne) {
  check(`pwr.p.test(h=${c.h}, n=${c.n}, a=${c.alpha}, ${c.alt})`,
    M.powerOne(c.h, c.n, c.alpha, altTail(c.alt)), c.power, 1e-9);
}
for (const c of truth.powerTwo) {
  // equal n goes through the SAME unequal-n routine the tool uses
  check(`pwr.2p.test(h=${c.h}, n=${c.n}, a=${c.alpha}, ${c.alt})`,
    M.powerPair(c.h, c.n, c.n, c.alpha, altTail(c.alt)), c.power, 1e-9);
}
for (const c of truth.powerTwo2n) {
  check(`pwr.2p2n.test(h=${c.h}, n1=${c.n1}, n2=${c.n2}, a=${c.alpha}, ${c.alt})`,
    M.powerPair(c.h, c.n1, c.n2, c.alpha, altTail(c.alt)), c.power, 1e-9);
}

// ---------------------------------------------------------------
console.log('--- 3. composition identities (proves power-math needed no edit) ---');
for (const h of [0.0439, 0.2, 0.5, 1.2]) for (const n of [5, 64, 1000]) for (const t of [1, 2]) {
  // powerPair(h,n,n) must BE pwr.2p.test, i.e. power-math's shared powerTwoProp
  eq(`powerPair(h=${h},n=${n},n) == PM.powerTwoProp (tail ${t})`,
    Math.abs(M.powerPair(h, n, n, 0.05, t) - PM.powerTwoProp(h, n, 0.05, t)) < 1e-12,
    `${M.powerPair(h, n, n, 0.05, t)} vs ${PM.powerTwoProp(h, n, 0.05, t)}`);
  // one-sample path must BE power-math's shared powerOneProp
  eq(`powerOne(h=${h},n=${n}) == PM.powerOneProp (tail ${t})`,
    Math.abs(M.powerOne(h, n, 0.05, t) - PM.powerOneProp(h, n, 0.05, t)) < 1e-12,
    `${M.powerOne(h, n, 0.05, t)} vs ${PM.powerOneProp(h, n, 0.05, t)}`);
}

// ---------------------------------------------------------------
console.log('--- 4. power.prop.test power at n (normal approximation) ---');
for (const c of truth.pptPower) {
  check(`power.prop.test(n=${c.n}, p1=${c.p1}, p2=${c.p2}, a=${c.alpha}, ${c.alt}, strict=${c.strict})`,
    M.pptPower(c.p1, c.p2, c.n, c.alpha, altTail(c.alt === 'one.sided' ? 'greater' : 'two.sided'), c.strict),
    c.power, 1e-9);
}

// ---------------------------------------------------------------
// n: ceiling agreement + tolerance-free power identity
// ---------------------------------------------------------------
function checkN(label, c, mine, powerFn, target) {
  // (a) the power identity at our own root - tolerance free, the real gate
  const pAtRoot = powerFn(mine.nExact);
  check(`${label} :: power(n_exact) == target`, pAtRoot, target, 1e-9);

  // (b) ceiling agreement with R
  if (mine.n1 === c.nCeil) { pass++; return; }

  // Disagreement: adjudicate with the tolerance-free power function.
  // The correct ceiling is the smallest integer whose power >= target.
  const mineOk = powerFn(mine.n1) >= target && powerFn(mine.n1 - 1) < target;
  const rOk = powerFn(c.nCeil) >= target && powerFn(c.nCeil - 1) < target;
  if (mineOk && !rOk) {
    adjudicated++;
    console.log(`    [adjudicated] ${label}: ours n=${mine.n1}, R n=${c.nCeil} (R root ${c.n.toFixed(6)}).`);
    console.log(`                  power(${mine.n1 - 1})=${powerFn(mine.n1 - 1).toFixed(12)} < ${target} <= power(${mine.n1})=${powerFn(mine.n1).toFixed(12)}`);
    console.log(`                  -> ours is the true smallest integer; R's uniroot tol (1.22e-4) landed across the boundary.`);
    pass++;
  } else {
    fail++;
    if (fails.length < 25) {
      fails.push(`${label}: ceiling mismatch ours=${mine.n1} R=${c.nCeil} (R root ${c.n}); ` +
        `mineOk=${mineOk} rOk=${rOk} power(ours)=${powerFn(mine.n1)} power(ours-1)=${powerFn(mine.n1 - 1)}`);
    }
  }
}

console.log('--- 5. n solved: pwr.p.test ---');
for (const c of truth.nOne) {
  const t = altTail(c.alt);
  const mine = M.solveSampleSize('one', { h: c.h, alpha: c.alpha, power: c.power, tail: t, method: 'arcsine' });
  if (mine.error) { fail++; fails.push(`nOne ${JSON.stringify(c)}: ${mine.error}`); continue; }
  checkN(`pwr.p.test(h=${c.h}, power=${c.power}, a=${c.alpha}, ${c.alt})`, c, mine,
    (n) => M.powerOne(c.h, n, c.alpha, t), c.power);
}

console.log('--- 6. n solved: pwr.2p.test ---');
for (const c of truth.nTwo) {
  const t = altTail(c.alt);
  const mine = M.solveSampleSize('two', { h: c.h, alpha: c.alpha, power: c.power, tail: t, ratio: 1, method: 'arcsine' });
  if (mine.error) { fail++; fails.push(`nTwo ${JSON.stringify(c)}: ${mine.error}`); continue; }
  checkN(`pwr.2p.test(h=${c.h}, power=${c.power}, a=${c.alpha}, ${c.alt})`, c, mine,
    (n) => M.powerPair(c.h, n, n, c.alpha, t), c.power);
}

console.log('--- 7. n solved: power.prop.test (normal approximation) ---');
for (const c of truth.pptN) {
  if (!c.strict) continue;   // the tool only ever solves the strict=TRUE variant
  const t = altTail(c.alt === 'one.sided' ? 'greater' : 'two.sided');
  const mine = M.solveSampleSize('two', {
    h: Math.abs(M.cohenH(c.p2, c.p1)), p1: c.p1, p2: c.p2,
    alpha: c.alpha, power: c.power, tail: t, ratio: 1, method: 'normal'
  });
  if (mine.error) { fail++; fails.push(`pptN ${JSON.stringify(c)}: ${mine.error}`); continue; }
  checkN(`power.prop.test(p1=${c.p1}, p2=${c.p2}, power=${c.power}, a=${c.alpha}, ${c.alt}, strict=TRUE)`,
    c, mine, (n) => M.pptPower(c.p1, c.p2, n, c.alpha, t, true), c.power);
}

// ---------------------------------------------------------------
console.log('--- 8. allocation ratio: our solved pair vs pwr.2p2n.test ---');
// We root-find n1 with n2 = k*n1, which pwr cannot do directly. So verify the
// resulting integer PAIR against pwr.2p2n.test, which R evaluates exactly.
for (const c of truth.powerTwo2n) {
  const k = c.n2 / c.n1;
  const t = altTail(c.alt);
  check(`pair power h=${c.h} n1=${c.n1} k=${k} a=${c.alpha} ${c.alt}`,
    M.powerAt('two', { h: c.h, n: c.n1, ratio: k, alpha: c.alpha, tail: t, method: 'arcsine' }),
    c.power, 1e-9);
}

// ---------------------------------------------------------------
console.log('--- 9. the taught claim: same lift costs most near p = 0.5 ---');
for (const c of truth.baselineSweep) {
  check(`h at baseline ${c.baseline} (+${c.diff})`, Math.abs(M.cohenH(c.p2, c.baseline)), Math.abs(c.h), 1e-12);
  const mine = M.solveSampleSize('two', { h: Math.abs(c.h), alpha: 0.05, power: 0.80, tail: 2, ratio: 1, method: 'arcsine' });
  eq(`n at baseline ${c.baseline} == R (${c.nCeil})`, mine.n1 === c.nCeil, `ours ${mine.n1} vs R ${c.nCeil}`);
}

console.log('--- 10. the taught claim: where arcsine and normal disagree ---');
for (const c of truth.methodGap) {
  const arc = M.solveSampleSize('two', { h: Math.abs(c.h), alpha: 0.05, power: 0.80, tail: 2, ratio: 1, method: 'arcsine' });
  const nrm = M.solveSampleSize('two', { h: Math.abs(c.h), p1: c.p1, p2: c.p2, alpha: 0.05, power: 0.80, tail: 2, ratio: 1, method: 'normal' });
  eq(`arcsine n for ${c.p1}->${c.p2} == R (${c.ceilArcsine})`, arc.n1 === c.ceilArcsine, `ours ${arc.n1} vs R ${c.ceilArcsine}`);
  eq(`normal n for ${c.p1}->${c.p2} == R (${c.ceilNormalStrict})`, nrm.n1 === c.ceilNormalStrict, `ours ${nrm.n1} vs R ${c.ceilNormalStrict}`);
}

// ---------------------------------------------------------------
console.log('\n========================================');
console.log(`pass ${pass}   fail ${fail}   adjudicated ${adjudicated}`);
console.log(`worst relative error: ${worst.toExponential(3)}  (${worstCase})`);
if (fails.length) {
  console.log('\nFAILURES:');
  fails.forEach((f) => console.log('  - ' + f));
}
console.log(fail === 0 ? 'GATE: GREEN' : 'GATE: RED');
process.exit(fail === 0 ? 0 : 1);
