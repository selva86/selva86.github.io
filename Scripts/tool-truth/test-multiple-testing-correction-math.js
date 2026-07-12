/* Verifies tools/lib/multiple-testing-math.js against the R truth table.
   Gate: every adjusted p-value for every method/case must match R's p.adjust
   to <= 1e-12 absolute (these are exact rational ops, so we expect ~machine eps).

   Run:  node Scripts/tool-truth/test-multiple-testing-correction-math.js
*/
'use strict';
const path = require('path');
const M = require(path.join(__dirname, '..', '..', 'tools', 'lib', 'multiple-testing-math.js'));
const truth = require(path.join(__dirname, 'multiple-testing-correction.json'));

const METHODS = ['bonferroni', 'holm', 'hochberg', 'hommel', 'BH', 'BY'];
const TOL = 1e-12;
const asArr = v => Array.isArray(v) ? v : [v];

let pass = 0, fail = 0, worst = 0, worstAt = '';
const fails = [];

for (const c of truth) {
  const p = asArr(c.p);
  const n = c.n;
  for (const meth of METHODS) {
    const expect = asArr(c[meth]);
    let got;
    try { got = M.padjust(p, meth, n); }
    catch (e) { fails.push(`${c.label}/${meth}: threw ${e.message}`); fail++; continue; }
    if (got.length !== expect.length) {
      fails.push(`${c.label}/${meth}: length ${got.length} != ${expect.length}`); fail++; continue;
    }
    let ok = true;
    for (let i = 0; i < expect.length; i++) {
      const d = Math.abs(got[i] - expect[i]);
      if (d > worst) { worst = d; worstAt = `${c.label}/${meth}[${i}]`; }
      if (d > TOL) {
        ok = false;
        fails.push(`${c.label}/${meth}[${i}]: got ${got[i]} expected ${expect[i]} (|d|=${d.toExponential(3)})`);
      }
    }
    if (ok) pass++; else fail++;
  }
}

// Also verify rejection COUNTS at each recorded alpha (what the page headline shows).
const ALPHAS = { 'a0.01': 0.01, 'a0.05': 0.05, 'a0.1': 0.10 };
let cntPass = 0, cntFail = 0;
for (const c of truth) {
  const p = asArr(c.p);
  for (const ak of Object.keys(ALPHAS)) {
    const alpha = ALPHAS[ak];
    const expectCounts = c.rejected[ak]; // array in METHODS order
    METHODS.forEach((meth, mi) => {
      const adj = M.padjust(p, meth, c.n);
      const got = M.countRejected(adj, alpha);
      if (got === expectCounts[mi]) cntPass++;
      else { cntFail++; fails.push(`COUNT ${c.label}/${meth}@${alpha}: got ${got} expected ${expectCounts[mi]}`); }
    });
  }
}

console.log(`adjusted-vector checks : ${pass} pass / ${fail} fail`);
console.log(`rejection-count checks : ${cntPass} pass / ${cntFail} fail`);
console.log(`worst |diff|           : ${worst.toExponential(3)} at ${worstAt}`);
if (fails.length) {
  console.log('\nFAILURES (first 25):');
  fails.slice(0, 25).forEach(f => console.log('  ' + f));
  process.exit(1);
}
console.log('\nALL GREEN - multiple-testing-math.js matches R p.adjust across all methods, edge cases, and family-size overrides.');
