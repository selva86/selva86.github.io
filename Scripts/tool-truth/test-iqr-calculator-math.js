/* Node harness: descriptive-math.js IQR / quartile / fivenum / boxplot.stats
   vs R 4.6.0 truth table (Scripts/tool-truth/iqr-calculator.json).
   Run: node Scripts/tool-truth/test-iqr-calculator-math.js */
'use strict';
const fs = require('fs');
const path = require('path');
const DM = require('../../tools/lib/descriptive-math.js');

const truth = JSON.parse(fs.readFileSync(
  path.join(__dirname, 'iqr-calculator.json'), 'utf8'));

const TOL = 1e-6;
let pass = 0, fail = 0, worst = 0, worstId = '';

function rel(got, exp) {
  if (exp === 0 || Math.abs(exp) < 1e-300) return Math.abs(got - exp);
  return Math.abs(got - exp) / Math.abs(exp);
}
function chk(id, got, exp) {
  const r = rel(got, exp);
  if (r > worst) { worst = r; worstId = id; }
  if (r <= TOL) { pass++; }
  else { fail++; console.log(`FAIL ${id}: got=${got} exp=${exp} rel=${r.toExponential(3)}`); }
}
function chkArr(id, got, exp) {
  if (got.length !== exp.length) {
    fail++; console.log(`FAIL ${id}: length got=${got.length} exp=${exp.length} [${got}] vs [${exp}]`);
    return;
  }
  const g = got.slice().sort((a, b) => a - b);
  const e = exp.slice().sort((a, b) => a - b);
  for (let i = 0; i < g.length; i++) chk(id + '[' + i + ']', g[i], e[i]);
}

// type-7 fence outliers, the tool's flagged points (strict inequality).
function t7out(sorted, coef) {
  const q1 = DM.quantileType(sorted, 0.25, 7), q3 = DM.quantileType(sorted, 0.75, 7);
  const iqr = q3 - q1, lo = q1 - coef * iqr, hi = q3 + coef * iqr, o = [];
  for (const v of sorted) if (v < lo || v > hi) o.push(v);
  return o;
}

for (const r of truth) {
  const s = r.data.slice().sort((a, b) => a - b);
  const id = r.id;
  // quartiles / median (type 7 and type 6)
  chk(id + '/q7.25', DM.quantileType(s, 0.25, 7), r.q7[0]);
  chk(id + '/q7.50', DM.quantileType(s, 0.50, 7), r.q7[1]);
  chk(id + '/q7.75', DM.quantileType(s, 0.75, 7), r.q7[2]);
  chk(id + '/q6.25', DM.quantileType(s, 0.25, 6), r.q6[0]);
  chk(id + '/q6.75', DM.quantileType(s, 0.75, 6), r.q6[2]);
  chk(id + '/median', DM.median(s), r.median);
  chk(id + '/min', s[0], r.min);
  chk(id + '/max', s[s.length - 1], r.max);
  // IQR (type 7 default, and type 6)
  chk(id + '/iqr7', DM.quantileType(s, 0.75, 7) - DM.quantileType(s, 0.25, 7), r.iqr7);
  chk(id + '/iqr6', DM.quantileType(s, 0.75, 6) - DM.quantileType(s, 0.25, 6), r.iqr6);
  // five-number summary (Tukey fivenum)
  chkArr(id + '/fivenum', DM.fivenum(s), r.fivenum);
  // boxplot.stats reproduction (coef 1.5 and 3)
  const b15 = DM.boxplotStats(s, 1.5), b30 = DM.boxplotStats(s, 3);
  chkArr(id + '/bstats15', b15.stats, r.bstats15);
  chkArr(id + '/bout15', b15.out, r.bout15);
  chkArr(id + '/bout30', b30.out, r.bout30);
  // type-7 fences + outliers (what the tool displays)
  const q1 = DM.quantileType(s, 0.25, 7), q3 = DM.quantileType(s, 0.75, 7), iqr = q3 - q1;
  chkArr(id + '/t7fence15', [q1 - 1.5 * iqr, q3 + 1.5 * iqr], r.t7fence15);
  chkArr(id + '/t7fence30', [q1 - 3 * iqr, q3 + 3 * iqr], r.t7fence30);
  chkArr(id + '/t7out15', t7out(s, 1.5), r.t7out15);
  chkArr(id + '/t7out30', t7out(s, 3), r.t7out30);
  // the coincidence the tool relies on: type-7 outliers == boxplot.stats$out
  chkArr(id + '/coincide15', t7out(s, 1.5), r.bout15);
}

console.log(`\n${pass}/${pass + fail} passed; worst rel = ${worst.toExponential(3)} @ ${worstId}`);
process.exit(fail ? 1 : 0);
