const C = require('../../tools/lib/ci-math.js');
const truth = JSON.parse(require('fs').readFileSync(__dirname + '/confidence-interval-full.json', 'utf8'));
const R_CORR = 0.418442003291;   // r from the R script's constructed vectors
const cases = {
  mean_95: () => C.meanCI(52.3, 8.1, 25, 0.95),
  mean_99: () => C.meanCI(52.3, 8.1, 25, 0.99),
  diffmean_95: () => C.diffMeanCI(84.2, 6.1, 24, 79.6, 7.4, 26, 0.95),
  diffmean_90: () => C.diffMeanCI(84.2, 6.1, 24, 79.6, 7.4, 26, 0.90),
  prop_wilson_95: () => C.wilsonCI(42, 100, 0.95),
  prop_exact_95: () => C.exactCI(42, 100, 0.95),
  diffprop_95: () => C.diffPropCI(45, 120, 30, 115, 0.95),
  diffprop_small: () => C.diffPropCI(8, 40, 3, 35, 0.95),
  poisson_17_4: () => C.poissonCI(17, 4, 0.95),
  poisson_0_10: () => C.poissonCI(0, 10, 0.95),
  variance_95: () => C.varianceCI(8.1, 30, 0.95),
  sd_95: () => { const v = C.varianceCI(8.1, 30, 0.95); return { lo: v.sdLo, hi: v.sdHi }; },
  corr_95: () => C.corrCI(R_CORR, 40, 0.95),
  corr_90: () => C.corrCI(R_CORR, 40, 0.90),
  regbeta_95: () => C.regBetaCI(2.35, 0.48, 47, 0.95),
};
let pass = 0, fail = 0;
const rel = (a, b) => (a === 0 && b === 0) ? 0 : Math.abs(a - b) / Math.max(1e-12, Math.abs(b));
for (const row of truth) {
  const got = cases[row.id]();
  const bad = [];
  if (rel(got.lo, row.lo) > 1e-6) bad.push(`lo got ${got.lo} want ${row.lo}`);
  if (rel(got.hi, row.hi) > 1e-6) bad.push(`hi got ${got.hi} want ${row.hi}`);
  if (bad.length) { fail++; console.log(`FAIL ${row.id}: ${bad.join('; ')}`); }
  else { pass++; console.log(`PASS ${row.id}  [${got.lo.toFixed(6)}, ${got.hi.toFixed(6)}]`); }
}
console.log(`\n${pass} PASS / ${fail} FAIL of ${truth.length}`);
process.exit(fail ? 1 : 0);
