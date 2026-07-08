// Verify tools/lib/ab-test-math.js against the R 4.6.0 truth table.
const M = require('../../tools/lib/ab-test-math.js');
const fs = require('fs');
const truth = JSON.parse(fs.readFileSync(__dirname + '/ab-test-calculator.json', 'utf8'));

// pass if relative <= relTol OR absolute <= absTol (integral-defined quantiles
// like credible-interval bounds are compared on an absolute floor too).
function ok(got, want, relTol, absTol) {
  if (!isFinite(got) && !isFinite(want)) return true;
  const abs = Math.abs(got - want);
  if (absTol != null && abs <= absTol) return true;
  return abs / Math.max(1e-12, Math.abs(want)) <= relTol;
}

let pass = 0, fail = 0;
const fails = [];
function check(id, rows) {
  const bad = rows.filter(r => !ok(r[1], r[2], r[3], r[4]));
  if (bad.length) {
    fail++;
    fails.push(id);
    console.log(`FAIL ${id}`);
    bad.forEach(r => {
      const rel = Math.abs(r[1] - r[2]) / Math.max(1e-12, Math.abs(r[2]));
      console.log(`   ${r[0]}: got ${r[1]}  want ${r[2]}  (abs ${Math.abs(r[1]-r[2]).toExponential(2)}, rel ${rel.toExponential(2)})`);
    });
  } else {
    pass++;
    console.log(`PASS ${id}`);
  }
}

for (const c of truth) {
  if (c.mode === 'freq') {
    const r = M.twoProp(c.cA, c.nA, c.cB, c.nB, c.alpha, c.tail);
    check(c.id, [
      ['z',     r.z,     c.z,      1e-6, 1e-9],
      ['chisq', r.chisq, c.chisq,  1e-6, 1e-8],
      ['p',     r.p,     c.p,      1e-6, 1e-9],
      ['ciLo',  r.ciLo,  c.pt_lo,  1e-6, 1e-9],
      ['ciHi',  r.ciHi,  c.pt_hi,  1e-6, 1e-9],
    ]);
  } else if (c.mode === 'plan') {
    const r = M.sampleSize(c.p1, c.p2, c.alpha, c.power, c.tail);
    check(c.id, [
      ['h', r.h, c.h, 1e-6, 1e-9],
      ['n', r.n, c.n, 1e-6, 1e-4],   // R uniroot tol ~1e-4 on n of ~1e4
    ]);
  } else if (c.mode === 'bayes') {
    const r = M.bayes(c.cA, c.nA, c.cB, c.nB, c.a0, c.b0);
    check(c.id, [
      ['pBbetter', r.pBbetter, c.pBbetter, 1e-6, 1e-8],
      ['meanLift', r.meanLift, c.meanLift, 1e-6, 1e-12],
      ['crLo',     r.crLo,     c.crLo,     1e-6, 1e-7],
      ['crHi',     r.crHi,     c.crHi,     1e-6, 1e-7],
      ['bf10',     r.bf10,     c.bf10,     1e-6, 1e-12],
    ]);
  } else if (c.mode === 'sequential') {
    const r = M.pocockNominal(c.K, c.alpha);
    check(c.id, [
      ['ck',      r.ck,      c.ck,      1e-12, 1e-12],
      ['nominal', r.nominal, c.nominal, 1e-6,  1e-9],
    ]);
  }
}

console.log(`\n${pass} PASS / ${fail} FAIL of ${truth.length}`);
if (fail) console.log('failed:', fails.join(', '));
process.exit(fail ? 1 : 0);
