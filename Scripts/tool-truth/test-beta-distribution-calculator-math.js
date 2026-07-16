/* Harness: tools/lib/beta-math.js vs R 4.6.0 dbeta/pbeta/qbeta truth table.
   Gate: every finite case <= 1e-6 relative (we aim far tighter).
   Run: node Scripts/tool-truth/test-beta-distribution-calculator-math.js */
'use strict';
const path = require('path');
const fs = require('fs');
const B = require(path.join(__dirname, '..', '..', 'tools', 'lib', 'beta-math.js'));

const truth = JSON.parse(fs.readFileSync(
  path.join(__dirname, 'beta-distribution-calculator.json'), 'utf8'));

const num = (s) => (s === 'NA' ? null : Number(s));
let pass = 0, fail = 0, worst = 0, worstId = '';

function cmp(id, key, got, want) {
  // R emitted "NA" for a genuinely undefined mode; the lib must agree by
  // returning null rather than inventing a number.
  if (want === null) {
    if (got === null || got === undefined) { pass++; return; }
    fail++; console.log(`FAIL ${id}.${key}: expected NA (undefined), got ${got}`);
    return;
  }
  if (!isFinite(want)) {                       // Infinity (density spike)
    if (got === want) { pass++; return; }
    fail++; console.log(`FAIL ${id}.${key}: expected ${want}, got ${got}`);
    return;
  }
  const rel = want === 0 ? Math.abs(got) : Math.abs(got - want) / Math.abs(want);
  if (rel > worst) { worst = rel; worstId = `${id}.${key}`; }
  if (rel <= 1e-6) pass++;
  else { fail++; console.log(`FAIL ${id}.${key}: got ${got}, want ${want}, rel ${rel.toExponential(3)}`); }
}

for (const c of truth) {
  const inp = {}; for (const k in c.inp) inp[k] = num(c.inp[k]);
  const r = B.analyze(c.mode, inp);
  const o = c.out;
  cmp(c.id, 'mean', r.mean, num(o.mean));
  cmp(c.id, 'var', r.var, num(o.var));
  cmp(c.id, 'sd', r.sd, num(o.sd));
  cmp(c.id, 'mode', r.mode, num(o.mode));
  if (c.mode === 'below') {
    cmp(c.id, 'd', r.d, num(o.d));
    cmp(c.id, 'p_below', r.p_below, num(o.p_below));
    cmp(c.id, 'p_above', r.p_above, num(o.p_above));
  } else if (c.mode === 'between') {
    cmp(c.id, 'p_between', r.p_between, num(o.p_between));
    cmp(c.id, 'p_outside', r.p_outside, num(o.p_outside));
    cmp(c.id, 'p_lo', r.p_lo, num(o.p_lo));
    cmp(c.id, 'p_hi', r.p_hi, num(o.p_hi));
  } else if (c.mode === 'quantile') {
    cmp(c.id, 'q_left', r.q_left, num(o.q_left));
    cmp(c.id, 'q_right', r.q_right, num(o.q_right));
  }
}

// ---- identity checks R cannot be an oracle for --------------------------
// qbeta must round-trip through pbeta regardless of R's printed digits.
let idFail = 0;
for (const [a, b] of [[2, 5], [31, 71], [0.5, 0.5], [500, 500], [1, 1], [0.2, 3]]) {
  for (const p of [1e-6, 0.001, 0.025, 0.5, 0.975, 0.999]) {
    const q = B.qbeta(p, a, b);
    const back = B.pbeta(q, a, b);
    const rel = Math.abs(back - p) / p;
    if (rel > 1e-9) { idFail++; console.log(`ROUNDTRIP lower a=${a} b=${b} p=${p}: rel ${rel.toExponential(3)}`); }
    const qu = B.qbetaUpper(p, a, b);
    // Skip roots pressed up against 1: doubles are spaced 2.2e-16 apart
    // there, so a root at 1 - 2.5e-12 carries only ~4 significant digits and
    // NO implementation can round-trip it. R misses this same check by 8e-6
    // (verified against R 4.6.0), so failing here would be measuring the
    // float grid, not the solver. The x value itself is still gated against
    // R in the truth table above (q_upper_tiny_spike).
    if (1 - qu > 1e-11) {
      const backU = B.sfbeta(qu, a, b);
      const relU = Math.abs(backU - p) / p;
      if (relU > 1e-9) { idFail++; console.log(`ROUNDTRIP upper a=${a} b=${b} p=${p}: rel ${relU.toExponential(3)}`); }
    }
  }
}
// Beta(1,1) is Uniform(0,1): CDF must be the identity, exactly.
for (const x of [0.1, 0.25, 0.5, 0.777, 0.9]) {
  if (Math.abs(B.pbeta(x, 1, 1) - x) > 1e-15) { idFail++; console.log(`UNIFORM pbeta(${x},1,1) != ${x}`); }
  if (Math.abs(B.dbeta(x, 1, 1) - 1) > 1e-15) { idFail++; console.log(`UNIFORM dbeta(${x},1,1) != 1`); }
}
// Symmetry: X~Beta(a,b) => 1-X~Beta(b,a)
for (const [a, b, x] of [[2, 5, 0.3], [31, 71, 0.25], [0.5, 0.5, 0.1]]) {
  const rel = Math.abs(B.pbeta(x, a, b) - B.sfbeta(1 - x, b, a)) / B.pbeta(x, a, b);
  if (rel > 1e-12) { idFail++; console.log(`SYMMETRY a=${a} b=${b} x=${x}: rel ${rel.toExponential(3)}`); }
}

console.log(`\ncases: ${truth.length}  checks: ${pass + fail}  pass: ${pass}  fail: ${fail}`);
console.log(`identity checks failed: ${idFail}`);
console.log(`worst relative: ${worst.toExponential(3)} (${worstId})`);
process.exit(fail === 0 && idFail === 0 ? 0 : 1);
