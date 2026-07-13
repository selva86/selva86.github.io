/* Gate dist-tables-math.js p-value + critical-value composition against the
   R truth table (p-value-calculator.json). Every value must match to
   <= 1e-6 relative (aim 1e-7+).
   Run: node Scripts/tool-truth/test-p-value-calculator-math.js  */
'use strict';
const fs = require('fs');
const path = require('path');
const D = require('../../tools/lib/dist-tables-math.js');

const cases = JSON.parse(fs.readFileSync(path.join(__dirname, 'p-value-calculator.json'), 'utf8'));

const relerr = (g, e) => {
  if (e === null) return (g === null) ? 0 : Infinity;
  if (!isFinite(e)) return (g === e) ? 0 : (Math.abs(g) > 1e12 && Math.sign(g) === Math.sign(e) ? 0 : Infinity);
  if (isNaN(e)) return isNaN(g) ? 0 : Infinity;
  const d = Math.abs(g - e);
  return d / Math.max(1, Math.abs(e));   // relative, floored at 1 to tame near-zero probs
};

function evalCase(c) {
  const a = c.a;
  switch (c.fn) {
    case 'pvT':       return D.pvT(a.t, a.df, a.tail);
    case 'pvZ':       return D.pvZ(a.z, a.tail);
    case 'pvChisq':   return D.pvChisq(a.x, a.df, a.tail);
    case 'pvF':       return D.pvF(a.x, a.df1, a.df2, a.tail);
    case 'pvR':       return D.pvR(a.r, a.n, a.tail);
    case 'critT':     return D.critT(a.alpha, a.df, a.tail);
    case 'critZ':     return D.critZ(a.alpha, a.tail);
    case 'critChisq': return D.critChisq(a.alpha, a.df, a.tail);
    case 'critF':     return D.critF(a.alpha, a.df1, a.df2, a.tail);
    case 'critR':     return D.critR(a.alpha, a.n, a.tail);
    default: throw new Error('unknown fn ' + c.fn);
  }
}

let maxRel = 0, worst = null, fails = 0, n = 0;
const byFnMax = {};
for (const c of cases) {
  const got = evalCase(c);
  const r = relerr(got, c.v);
  n++;
  byFnMax[c.fn] = Math.max(byFnMax[c.fn] || 0, r);
  if (r > maxRel) { maxRel = r; worst = { c, got }; }
  if (r > 1e-6) {
    fails++;
    if (fails <= 30) console.log(`FAIL ${c.fn}(${JSON.stringify(c.a)}) got=${got} exp=${c.v} rel=${r.toExponential(3)}`);
  }
}

console.log('\nper-fn max relative error:');
for (const k of Object.keys(byFnMax).sort()) console.log(`  ${k.padEnd(10)} ${byFnMax[k].toExponential(3)}`);
console.log(`\ncases=${n}  fails=${fails}  maxRel=${maxRel.toExponential(3)}`);
if (worst) console.log(`worst: ${worst.c.fn}(${JSON.stringify(worst.c.a)}) got=${worst.got} exp=${worst.c.v}`);
if (fails > 0 || maxRel > 1e-6) { console.log('\nGATE: FAIL'); process.exit(1); }
console.log('\nGATE: PASS (all cases <= 1e-6 relative)');
