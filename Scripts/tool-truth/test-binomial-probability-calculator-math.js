/* Node harness: binomial-math.js vs R 4.6.0 truth table.
   Run: node Scripts/tool-truth/test-binomial-probability-calculator-math.js */
'use strict';
const fs = require('fs');
const path = require('path');
const B = require('../../tools/lib/binomial-math.js');

const truth = JSON.parse(fs.readFileSync(
  path.join(__dirname, 'binomial-probability-calculator.json'), 'utf8'));

function compute(c) {
  const a = c.args;
  switch (c.fn) {
    case 'dbinom':       return B.dbinom(a.k, a.n, a.p);
    case 'pbinom':       return B.pbinom(a.k, a.n, a.p);
    case 'pbinomUpper':  return B.pbinomUpper(a.k, a.n, a.p);
    case 'pbinomRange':  return B.pbinomRange(a.a, a.b, a.n, a.p);
    case 'qbinom':       return B.qbinom(a.target, a.n, a.p);
    case 'mean':         return B.mean(a.n, a.p);
    case 'variance':     return B.variance(a.n, a.p);
    case 'sd':           return B.sd(a.n, a.p);
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
  if (rel <= TOL || (c.fn === 'qbinom' && got === exp)) {
    pass++;
  } else {
    fail++;
    console.log(`FAIL ${c.id} (${c.fn}): got=${got} exp=${exp} rel=${rel.toExponential(3)}`);
  }
}
console.log(`\n${pass}/${pass + fail} passed; worst rel = ${worst.toExponential(3)} @ ${worstId}`);
process.exit(fail ? 1 : 0);
