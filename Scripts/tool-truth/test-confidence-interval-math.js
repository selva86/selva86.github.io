const C = require('../../tools/lib/ci-math.js');
const truth = JSON.parse(require('fs').readFileSync(__dirname + '/confidence-interval.json', 'utf8'));
const cases = {
  mean_95: () => C.meanCI(52.3, 8.1, 25, 0.95),
  mean_90: () => C.meanCI(52.3, 8.1, 25, 0.90),
  mean_99: () => C.meanCI(52.3, 8.1, 25, 0.99),
  mean_small_n: () => C.meanCI(3.42, 1.77, 8, 0.95),
  wilson_42_100: () => C.wilsonCI(42, 100, 0.95),
  wilson_7_20: () => C.wilsonCI(7, 20, 0.95),
  wilson_0_15: () => C.wilsonCI(0, 15, 0.95),
  wilson_199_200: () => C.wilsonCI(199, 200, 0.95),
  wilson_42_100_99: () => C.wilsonCI(42, 100, 0.99),
  exact_42_100: () => C.exactCI(42, 100, 0.95),
  exact_7_20: () => C.exactCI(7, 20, 0.95),
  exact_0_15: () => C.exactCI(0, 15, 0.95),
  exact_20_20: () => C.exactCI(20, 20, 0.95),
};
let pass = 0, fail = 0;
const rel = (a, b) => (a === 0 && b === 0) ? 0 : Math.abs(a - b) / Math.max(1e-12, Math.abs(b));
for (const row of truth) {
  const got = cases[row.id]();
  const bad = [];
  if (rel(got.lo, row.lo) > 1e-7) bad.push(`lo got ${got.lo} want ${row.lo}`);
  if (rel(got.hi, row.hi) > 1e-7) bad.push(`hi got ${got.hi} want ${row.hi}`);
  if (bad.length) { fail++; console.log(`FAIL ${row.id}: ${bad.join('; ')}`); }
  else { pass++; console.log(`PASS ${row.id}  [${got.lo.toFixed(6)}, ${got.hi.toFixed(6)}]`); }
}
console.log(`\n${pass} PASS / ${fail} FAIL of ${truth.length}`);
process.exit(fail ? 1 : 0);
