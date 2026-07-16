/* Harness: tools/lib/bayes-ab-math.js vs the R truth table.
 *
 * Three oracles, each answering a different question:
 *   R integrate()  - is my quadrature right?     (gate: 1e-6 relative)
 *   R Monte Carlo  - is my DERIVATION right?     (gate: 4 sigma, using the
 *                    MC standard errors the R script emits - a fixed relative
 *                    gate is wrong for a rare-event mean like a small loss)
 *   exact 80 dp    - what is the value REALLY?   (Cook's exact finite sum, not a
 *                    quadrature; settles cases where R and JS are both
 *                    double-limited - R is off by 25 orders of magnitude on the
 *                    smallest loss here)
 *
 * Plus two oracles that need no external truth at all:
 *   identity   loss_A - loss_B == mean_B - mean_A   (E[x+] - E[(-x)+] = E[x])
 *   symmetry   identical arms => P(B>A) == 0.5 and loss_A == loss_B, exactly
 *
 * Run: node Scripts/tool-truth/test-bayesian-ab-test-calculator-math.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const M = require('../../tools/lib/bayes-ab-math.js');

const truth = JSON.parse(fs.readFileSync(
  path.join(__dirname, 'bayesian-ab-test-calculator.json'), 'utf8'));

const exactPath = path.join(__dirname, 'bayesian-ab-exact.json');
const exact = fs.existsSync(exactPath)
  ? JSON.parse(fs.readFileSync(exactPath, 'utf8')) : null;

// Below this, a loss is not a number any decision can use: thresholds of caring
// live at ~1e-4 (0.01pp) and the page prints losses to a few decimal places in
// pp. Values under the floor are gated as "both agree it is negligible", and the
// EXACT adjudicator (not an assumption) is what proves the true value really is
// down there rather than large and mis-integrated.
const FLOOR = 1e-9;

let pass = 0, fail = 0, worst = 0, worstName = '';
const fails = [];

function check(name, got, want, tol, kind) {
  const denom = Math.max(Math.abs(want), Math.abs(got));
  const rel = denom === 0 ? 0 : Math.abs(got - want) / denom;
  const ok = denom === 0 ? true : rel <= tol;
  if (ok) {
    pass++;
    if (kind === 'integ' && rel > worst) { worst = rel; worstName = name; }
  } else {
    fail++;
    fails.push(`${name}: got ${got}  want ${want}  rel ${rel.toExponential(3)} > ${tol}`);
  }
  return ok;
}

function checkAbs(name, got, want, tol) {
  const d = Math.abs(got - want);
  if (d <= tol) { pass++; return true; }
  fail++;
  fails.push(`${name}: got ${got}  want ${want}  abs ${d.toExponential(3)} > ${tol}`);
  return false;
}

for (const [name, v] of Object.entries(truth)) {
  const inp = v.input, p = v.post, ti = v.integ, mc = v.mc;
  const r = M.analyze({
    cA: inp.cA, nA: inp.nA, cB: inp.cB, nB: inp.nB,
    a0: inp.a0, b0: inp.b0, level: inp.level, threshold: 0.001
  });
  if (!r.ok) { fail++; fails.push(`${name}: analyze rejected valid input: ${r.errors}`); continue; }

  // --- posterior shape straight from qbeta ---
  check(`${name}/a1`, r.a1, p.a1, 0); check(`${name}/b1`, r.b1, p.b1, 0);
  check(`${name}/a2`, r.a2, p.a2, 0); check(`${name}/b2`, r.b2, p.b2, 0);
  check(`${name}/meanA`, r.meanA, p.meanA, 1e-12);
  check(`${name}/meanB`, r.meanB, p.meanB, 1e-12);
  check(`${name}/sdA`, r.sdA, p.sdA, 1e-12);
  check(`${name}/sdB`, r.sdB, p.sdB, 1e-12);
  check(`${name}/medA`, r.medA, p.medA, 1e-9);
  check(`${name}/medB`, r.medB, p.medB, 1e-9);
  check(`${name}/ciA.lo`, r.ciA[0], p.ciA[0], 1e-9);
  check(`${name}/ciA.hi`, r.ciA[1], p.ciA[1], 1e-9);
  check(`${name}/ciB.lo`, r.ciB[0], p.ciB[0], 1e-9);
  check(`${name}/ciB.hi`, r.ciB[1], p.ciB[1], 1e-9);

  // --- oracle 1: R integrate() ---
  check(`${name}/pBgtA`, r.pBgtA, ti.pBgtA, 1e-6, 'integ');
  check(`${name}/meanLift`, r.meanLift, ti.meanLift, 1e-12);
  check(`${name}/meanRelLift`, r.meanRelLift, ti.meanRelLift, 1e-12);

  for (const q of ['lossChooseA', 'lossChooseB']) {
    if (ti[q] >= FLOOR) {
      check(`${name}/${q}`, r[q], ti[q], 1e-6, 'integ');
    } else {
      // Both must agree it is negligible. R's own value here is double noise
      // (windowing the integral moved clear-winner's lossB from 1.2e-29 to
      // 5.2e-29), so comparing them relatively would be theatre.
      checkAbs(`${name}/${q}(negligible)`, r[q], 0, FLOOR);
    }
  }

  // lift intervals: uniroot tol 1e-12 on the R side, bisection here
  check(`${name}/dLo`, r.dLo, ti.dLo, 1e-6, 'integ');
  check(`${name}/dHi`, r.dHi, ti.dHi, 1e-6, 'integ');
  check(`${name}/rLo`, r.rLo, ti.rLo, 1e-6, 'integ');
  check(`${name}/rHi`, r.rHi, ti.rHi, 1e-6, 'integ');

  // --- oracle 2: Monte Carlo, gated at 4 sigma of ITS OWN standard error ---
  // This is the only check that tests the algebra rather than the arithmetic:
  // integrate() and I evaluate the same integrand, so it cannot catch a wrong
  // derivation. rbeta can.
  // When every draw falls the same way the sample sd is 0 and a "4 sigma" band
  // is degenerate: 4e6 draws all favouring B do not prove P(B>A)==1 exactly,
  // they bound it by the rule of three, P > 1 - 3/N. Gate on that instead of
  // failing a correct 1 - 1.5e-10.
  const sig = (got, m, se) =>
    se === 0 ? Math.abs(got - m) <= 3 / mc.n
             : Math.abs(got - m) <= 4 * se + 1e-12;
  if (!sig(r.pBgtA, mc.pBgtA, mc.seP)) {
    fail++; fails.push(`${name}/MC pBgtA: ${r.pBgtA} vs ${mc.pBgtA} +- ${mc.seP} (>4 sigma)`);
  } else pass++;
  if (!sig(r.lossChooseA, mc.lossChooseA, mc.seLossA)) {
    fail++; fails.push(`${name}/MC lossA: ${r.lossChooseA} vs ${mc.lossChooseA} +- ${mc.seLossA} (>4 sigma)`);
  } else pass++;
  if (!sig(r.lossChooseB, mc.lossChooseB, mc.seLossB)) {
    fail++; fails.push(`${name}/MC lossB: ${r.lossChooseB} vs ${mc.lossChooseB} +- ${mc.seLossB} (>4 sigma)`);
  } else pass++;

  // --- oracle 3: exact finite sum at 80 dp, where available ---
  // The exact route is a finite sum, not a quadrature, so it is the only truth
  // here that is not double-limited. It is what proves the sub-FLOOR values are
  // genuinely negligible rather than large-and-mis-integrated: for
  // huge-separation it puts lossB at 8.06e-84 while R's integrate() reports
  // 4.44e-109 - R is off by 25 orders of magnitude down there, which is exactly
  // why nothing below FLOOR is gated relatively against R.
  if (exact && exact[name]) {
    for (const q of ['pBgtA', 'lossChooseA', 'lossChooseB']) {
      const e = Number(exact[name][q]);
      if (e >= FLOOR) check(`${name}/exact:${q}`, r[q], e, 1e-6);
      else checkAbs(`${name}/exact:${q} truly negligible (exact=${exact[name][q]})`,
                    r[q], 0, FLOOR);
    }
  }

  // --- free oracle: the loss identity, no external truth needed ---
  // Gated at 1e-10, not tighter, and that is a measurement not a shrug: the
  // residual sits at ~1.1e-12 and did NOT move when the quadrature was swapped
  // from 2048-node Simpson to 96-node Gauss-Legendre (1.1404e-12 -> 1.1434e-12).
  // A quadrature error would have moved by ~20x; this did not, so it is the
  // double-precision cancellation floor of  mB*sf(a2+1,b2) - a*sf(a2,b2)  in the
  // integrand, not an error in the rule. 1e-10 of a RATE is 1e-8 pp, eight orders
  // below anything the page prints, and the gate still has the resolution that
  // caught the real bug it was written for (a 1.5e-3 miss, 7 orders larger).
  const idn = (r.lossChooseA - r.lossChooseB) - (r.meanB - r.meanA);
  checkAbs(`${name}/identity lossA-lossB==mB-mA`, idn, 0, 1e-10);

  // --- stopping read is a pure function of the losses ---
  const expLeader = r.lossChooseB <= r.lossChooseA ? 'B' : 'A';
  if (r.stop.leader !== expLeader) {
    fail++; fails.push(`${name}/stop.leader ${r.stop.leader} != ${expLeader}`);
  } else pass++;
  if (r.stop.canStop !== (Math.min(r.lossChooseA, r.lossChooseB) <= 0.001)) {
    fail++; fails.push(`${name}/stop.canStop wrong`);
  } else pass++;
  // The leading arm is the one with the higher posterior mean. Not a definition
  // in the code (leader comes from the losses), so it is a real check.
  const meanLeader = r.meanB > r.meanA ? 'B' : (r.meanB < r.meanA ? 'A' : null);
  if (meanLeader && r.stop.leader !== meanLeader) {
    fail++; fails.push(`${name}/leader ${r.stop.leader} contradicts posterior means`);
  } else pass++;
}

// --- free oracle: exact symmetry, independent of every table above ---
for (const [cA, nA, a0, b0] of [[50, 100, 1, 1], [0, 30, 1, 1], [7, 9, 0.5, 0.5],
                                [1200, 10000, 3, 40], [99, 100, 1, 1]]) {
  const r = M.analyze({ cA, nA, cB: cA, nB: nA, a0, b0, level: 0.95, threshold: 0.001 });
  // P(B>A) is 0.5 exactly on paper; numerically it is 0.5 plus quadrature noise
  // (~1e-10), since it is reached by integrating rather than by symmetry.
  checkAbs(`symmetry ${cA}/${nA} prior(${a0},${b0}) P(B>A)==0.5`, r.pBgtA, 0.5, 1e-8);
  checkAbs(`symmetry ${cA}/${nA} lossA==lossB`, r.lossChooseA - r.lossChooseB, 0, 1e-14);
  checkAbs(`symmetry ${cA}/${nA} meanLift==0`, r.meanLift, 0, 1e-15);
  // D = pB - pA is symmetric about 0, so the interval must be too
  checkAbs(`symmetry ${cA}/${nA} dLo==-dHi`, r.dLo + r.dHi, 0, 1e-8);
}

// --- consistency with the sibling tool ---
// ab-test-calculator's Bayesian framing prints P(B>A) for the same data from a
// different implementation (ab-test-math.bayes, Beta(1,1)). Two tools on the
// site showing different numbers for the same quantity is a bug even if both
// are "close enough" to R, so pin them together.
const AB = require('../../tools/lib/ab-test-math.js');
for (const [cA, nA, cB, nB] of [[1200, 10000, 1260, 10000], [8, 150, 12, 150],
                                [100, 10000, 300, 10000], [300, 5000, 240, 5000],
                                [40, 900, 120, 2400]]) {
  const mine = M.analyze({ cA, nA, cB, nB, a0: 1, b0: 1, level: 0.95, threshold: 0.001 });
  const sib = AB.bayes(cA, nA, cB, nB, 1, 1);
  checkAbs(`sibling ab-test-math P(B>A) ${cA}/${nA} vs ${cB}/${nB}`,
           mine.pBgtA, sib.pBbetter, 1e-7);
  checkAbs(`sibling ab-test-math 95% lift CI lo`, mine.dLo, sib.crLo, 1e-6);
  checkAbs(`sibling ab-test-math 95% lift CI hi`, mine.dHi, sib.crHi, 1e-6);
}

// --- validation surface ---
const bad = [
  [{ cA: 5, nA: 3, cB: 1, nB: 10, a0: 1, b0: 1 }, 'more conversions than visitors'],
  [{ cA: -1, nA: 10, cB: 1, nB: 10, a0: 1, b0: 1 }, 'negative conversions'],
  [{ cA: 1, nA: 0, cB: 1, nB: 10, a0: 1, b0: 1 }, 'zero visitors'],
  [{ cA: 1, nA: 10, cB: 1, nB: 10, a0: 0, b0: 1 }, 'prior alpha 0'],
  [{ cA: 1, nA: 10, cB: 1, nB: 10, a0: 1, b0: -2 }, 'prior beta negative'],
  [{ cA: NaN, nA: 10, cB: 1, nB: 10, a0: 1, b0: 1 }, 'NaN conversions']
];
for (const [inp, why] of bad) {
  const r = M.analyze(Object.assign({ level: 0.95, threshold: 0.001 }, inp));
  if (r.ok) { fail++; fails.push(`validation: accepted ${why}`); } else pass++;
}

console.log(`\nchecks: ${pass} passed, ${fail} failed`);
if (worstName) console.log(`worst relative error vs R integrate(): ${worst.toExponential(3)}  (${worstName})`);
if (!exact) console.log('NOTE: bayesian-ab-exact.json absent - mpmath adjudication skipped');
if (fail) {
  console.log('\nFAILURES:');
  fails.slice(0, 40).forEach(f => console.log('  ' + f));
  process.exit(1);
}
console.log('ALL GREEN');
