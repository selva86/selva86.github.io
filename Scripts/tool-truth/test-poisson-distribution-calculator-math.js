/* Node harness: poisson-math.js vs R 4.6.0 truth table.
   Run: node Scripts/tool-truth/test-poisson-distribution-calculator-math.js */
'use strict';
const fs = require('fs');
const path = require('path');
const P = require('../../tools/lib/poisson-math.js');

const truth = JSON.parse(fs.readFileSync(
  path.join(__dirname, 'poisson-distribution-calculator.json'), 'utf8'));

function compute(c) {
  const a = c.args;
  switch (c.fn) {
    case 'dpois':       return P.dpois(a.k, a.lambda);
    case 'ppois':       return P.ppois(a.k, a.lambda);
    case 'ppoisUpper':  return P.ppoisUpper(a.k, a.lambda);
    case 'ppoisRange':  return P.ppoisRange(a.a, a.b, a.lambda);
    case 'qpois':       return P.qpois(a.target, a.lambda);
    case 'mean':        return P.mean(a.lambda);
    case 'variance':    return P.variance(a.lambda);
    case 'sd':          return P.sd(a.lambda);
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
  if (Number.isNaN(rel)) rel = (got === exp ? 0 : Infinity);   // Inf===Inf case
  if (rel > worst && Number.isFinite(rel)) { worst = rel; worstId = c.id; }
  if (rel <= TOL || (c.fn === 'qpois' && got === exp)) {
    pass++;
  } else {
    fail++;
    console.log(`FAIL ${c.id} (${c.fn}): got=${got} exp=${exp} rel=${rel.toExponential(3)}`);
  }
}
console.log(`\n${pass}/${pass + fail} passed; worst rel = ${worst.toExponential(3)} @ ${worstId}`);
process.exit(fail ? 1 : 0);
