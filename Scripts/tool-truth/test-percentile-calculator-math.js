/* Node harness: descriptive-math.js quantileType/ecdf vs R 4.6.0 truth table.
   Run: node Scripts/tool-truth/test-percentile-calculator-math.js */
'use strict';
const fs = require('fs');
const path = require('path');
const DM = require('../../tools/lib/descriptive-math.js');

const truth = JSON.parse(fs.readFileSync(
  path.join(__dirname, 'percentile-calculator.json'), 'utf8'));

function sortNum(a) { return a.slice().sort(function (x, y) { return x - y; }); }

function compute(c) {
  const sorted = sortNum(c.data);
  const e = c.extra;
  switch (c.fn) {
    case 'quantile': return DM.quantileType(sorted, e.p, e.type);
    case 'ecdf':     return DM.ecdf(sorted, e.v);
    default: throw new Error('unknown fn ' + c.fn);
  }
}

let pass = 0, fail = 0, worst = 0, worstId = '';
const TOL = 1e-6;
for (const c of truth) {
  const got = compute(c);
  const exp = c.value;
  let rel;
  if (exp === 0 || Math.abs(exp) < 1e-300) rel = Math.abs(got - exp);
  else rel = Math.abs(got - exp) / Math.abs(exp);
  if (rel > worst) { worst = rel; worstId = c.id; }
  if (rel <= TOL) {
    pass++;
  } else {
    fail++;
    console.log(`FAIL ${c.id} (${c.fn}): got=${got} exp=${exp} rel=${rel.toExponential(3)}`);
  }
}
console.log(`\n${pass}/${pass + fail} passed; worst rel = ${worst.toExponential(3)} @ ${worstId}`);
process.exit(fail ? 1 : 0);
