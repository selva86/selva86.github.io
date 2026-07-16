/* Node harness: verify descriptive-math.js against the R truth table for the
   Standard Deviation Calculator. Replays every case (data + frequency modes),
   comparing mean, sample/population sd + variance, ss, se, cv, cvPop.
   Frequency cases expand rep(values, counts) then run describe() - the same
   thing the page does. Gate: all finite comparisons at <= 1e-9 relative. */
const fs = require('fs');
const path = require('path');
const D = require('../../tools/lib/descriptive-math.js');

const truth = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'standard-deviation-calculator.json'), 'utf8')
);

function expand(values, counts) {
  const out = [];
  for (let i = 0; i < values.length; i++) {
    const c = Math.round(counts[i]);
    for (let k = 0; k < c; k++) out.push(values[i]);
  }
  return out;
}

// relative (or absolute near zero) closeness; null==null ok.
function close(got, exp, tol) {
  if (exp === null || exp === undefined) return got === null || got === undefined || Number.isNaN(got);
  if (got === null || got === undefined || Number.isNaN(got)) return false;
  const d = Math.abs(got - exp);
  if (Math.abs(exp) < 1e-12) return d < 1e-9;
  return d / Math.abs(exp) <= tol;
}

const TOL = 1e-9;
let pass = 0, fail = 0, worst = 0;
const fails = [];

for (const c of truth) {
  const x = c.mode === 'freq' ? expand(c.values, c.counts) : c.x;
  const r = D.describe(x, { level: 0.95 });
  const checks = [
    ['n', r.n, c.n],
    ['mean', r.mean, c.mean],
    ['sum', r.sum, c.sum],
    ['min', r.min, c.min],
    ['max', r.max, c.max],
    ['range', r.range, c.range],
    ['varSample', r.var, c.varSample],
    ['sdSample', r.sd, c.sdSample],
    ['varPop', r.varPop, c.varPop],
    ['sdPop', r.sdPop, c.sdPop],
    ['ss', r.ss, c.ss],
    ['se', r.se, c.se],
    ['cv', r.cv, c.cv],
    ['cvPop', r.cvPop, c.cvPop],
  ];
  for (const [name, got, exp] of checks) {
    const ok = close(got, exp, TOL);
    if (ok) {
      pass++;
      if (exp !== null && got !== null && Math.abs(exp) > 1e-12 && !Number.isNaN(got))
        worst = Math.max(worst, Math.abs(got - exp) / Math.abs(exp));
    } else {
      fail++;
      fails.push(`${c.id}.${name}: got ${got} exp ${exp}`);
    }
  }
}

console.log(`cases: ${truth.length}  checks: ${pass + fail}  pass: ${pass}  fail: ${fail}`);
console.log(`worst relative error: ${worst.toExponential(3)}`);
if (fails.length) {
  console.log('FAILURES:');
  fails.slice(0, 40).forEach(f => console.log('  ' + f));
  process.exit(1);
}
console.log('ALL GREEN');
