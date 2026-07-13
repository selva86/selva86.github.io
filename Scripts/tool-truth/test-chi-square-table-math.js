/* Gate dist-tables-math.js (qchisq/pchisq, qf/pf) against the R truth grid
   (chi-square-table.json). Backs BOTH tools/chi-square-table.html and
   tools/f-table.html: the printed tables, the live lookup and the reverse
   mode all route through this one lib. Every value must match R to
   <= 1e-6 relative (aim 1e-7+).
   Run: node Scripts/tool-truth/test-chi-square-table-math.js  */
'use strict';
const fs = require('fs');
const path = require('path');
const D = require('../../tools/lib/dist-tables-math.js');

const cases = JSON.parse(fs.readFileSync(path.join(__dirname, 'chi-square-table.json'), 'utf8'));

const relerr = (g, e) => {
  if (!isFinite(e)) return (g === e) ? 0 : (Math.abs(g) > 1e12 && Math.sign(g) === Math.sign(e) ? 0 : Infinity);
  if (isNaN(e)) return isNaN(g) ? 0 : Infinity;
  const d = Math.abs(g - e);
  return d / Math.max(1, Math.abs(e));   // relative, floored at 1 to tame near-zero probs
};

function evalCase(c) {
  const a = c.a;
  switch (c.fn) {
    case 'qchisq': return D.qchisq(a.p, a.df);
    case 'pchisq': return D.pchisq(a.q, a.df);
    case 'qf':     return D.qf(a.p, a.df1, a.df2);
    case 'pf':     return D.pf(a.q, a.df1, a.df2);
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
for (const k of Object.keys(byFnMax).sort()) console.log(`  ${k.padEnd(8)} ${byFnMax[k].toExponential(3)}`);
console.log(`\ncases=${n}  fails=${fails}  maxRel=${maxRel.toExponential(3)}`);
if (worst) console.log(`worst: ${worst.c.fn}(${JSON.stringify(worst.c.a)}) got=${worst.got} exp=${worst.c.v}`);
if (fails > 0 || maxRel > 1e-6) { console.log('\nGATE: FAIL'); process.exit(1); }
console.log('\nGATE: PASS (all cases <= 1e-6 relative)');
