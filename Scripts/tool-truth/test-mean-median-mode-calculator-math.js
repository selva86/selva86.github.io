/* Node harness: verify descriptive-math.js against the R truth table for the
   Mean, Median & Mode Calculator. Replays every case (data + frequency modes),
   comparing mean, median, min, max, range, midrange and skewness against R,
   plus the mode.

   The mode needs two checks:
     * modeFreq (the maximum frequency) is compared directly against R's max(tab).
     * The mode SET is compared against the tool's honest display convention:
       R's modeSet lists every value tied at the maximum frequency; the tool
       reports "no mode" (an empty set) when nothing repeats (modeFreq === 1
       and n > 1), and otherwise reports exactly R's modeSet. describe().modes
       must equal that convention set.
   Frequency cases expand rep(values, counts) then run describe() - the same
   thing the page does. Gate: all finite comparisons at <= 1e-9 relative. */
const fs = require('fs');
const path = require('path');
const D = require('../../tools/lib/descriptive-math.js');

const truth = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'mean-median-mode-calculator.json'), 'utf8')
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

// exact set equality on two numeric arrays (order-independent, tolerant).
function sameSet(got, exp) {
  if (got.length !== exp.length) return false;
  const g = got.slice().sort((a, b) => a - b);
  const e = exp.slice().sort((a, b) => a - b);
  for (let i = 0; i < g.length; i++) if (!close(g[i], e[i], 1e-9)) return false;
  return true;
}

const TOL = 1e-9;
let pass = 0, fail = 0, worst = 0;
const fails = [];

for (const c of truth) {
  const x = c.mode === 'freq' ? expand(c.values, c.counts) : c.x;
  const r = D.describe(x, { level: 0.95 });

  // scalar checks vs R
  const checks = [
    ['n', r.n, c.n],
    ['mean', r.mean, c.mean],
    ['median', r.median, c.median],
    ['min', r.min, c.min],
    ['max', r.max, c.max],
    ['range', r.range, c.range],
    ['midrange', r.midrange, c.midrange],
    ['skewness', r.skewness, c.skewness],
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

  // mode frequency vs R's max(tab)
  if (r.modeFreq === c.modeFreq) pass++;
  else { fail++; fails.push(`${c.id}.modeFreq: got ${r.modeFreq} exp ${c.modeFreq}`); }

  // mode SET vs the tool's honest display convention over R's modeSet
  const expectedModes = (c.modeFreq === 1 && c.n > 1) ? [] : c.modeSet;
  if (sameSet(r.modes, expectedModes)) pass++;
  else { fail++; fails.push(`${c.id}.modes: got [${r.modes}] exp [${expectedModes}]`); }
}

console.log(`cases: ${truth.length}  checks: ${pass + fail}  pass: ${pass}  fail: ${fail}`);
console.log(`worst relative error: ${worst.toExponential(3)}`);
if (fails.length) {
  console.log('FAILURES:');
  fails.slice(0, 40).forEach(f => console.log('  ' + f));
  process.exit(1);
}
console.log('ALL GREEN');
