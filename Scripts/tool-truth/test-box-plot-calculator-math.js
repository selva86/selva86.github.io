/* test-box-plot-calculator-math.js - verify the box-plot / five-number
   summary calculator's math against the R 4.6.0 truth table.

   No new library: the tool reuses tools/lib/descriptive-math.js
   (quantileType, median, fivenum, boxplotStats). This harness re-implements
   the tiny per-vector analyze() the page runs (type-7 quartiles, 1.5*IQR
   fences, whiskers to the most extreme in-fence point, fence outliers) and
   checks every displayed number - single vectors AND each group of the
   grouped datasets - against box-plot-calculator.json.

   Run: node Scripts/tool-truth/test-box-plot-calculator-math.js            */
'use strict';
const fs = require('fs');
const path = require('path');
const DM = require('../../tools/lib/descriptive-math.js');

const truth = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'box-plot-calculator.json'), 'utf8'));

const TOL = 1e-9;             // absolute/relative tolerance (aim << 1e-6)
let pass = 0, fail = 0;
const fails = [];

function close(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (!isFinite(a) || !isFinite(b)) return a === b;
  const d = Math.abs(a - b);
  return d <= TOL || d <= TOL * Math.max(Math.abs(a), Math.abs(b));
}
function arrClose(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (!close(a[i], b[i])) return false;
  return true;
}
function check(label, got, exp) {
  const ok = (typeof exp === 'number') ? close(got, exp) : arrClose(got, exp);
  if (ok) pass++;
  else { fail++; fails.push(`${label}: got ${JSON.stringify(got)} exp ${JSON.stringify(exp)}`); }
}

// The exact analyze() the page will run (type-7 throughout).
function analyze(sorted) {
  const n = sorted.length;
  const q1 = DM.quantileType(sorted, 0.25, 7);
  const med = DM.quantileType(sorted, 0.50, 7);
  const q3 = DM.quantileType(sorted, 0.75, 7);
  const iqr = q3 - q1;
  const fLo = q1 - 1.5 * iqr, fHi = q3 + 1.5 * iqr;
  const fLo3 = q1 - 3 * iqr, fHi3 = q3 + 3 * iqr;
  const outliers = [];
  let wLo = Infinity, wHi = -Infinity;
  for (let i = 0; i < n; i++) {
    const v = sorted[i];
    if (v < fLo || v > fHi) outliers.push(v);
    else { if (v < wLo) wLo = v; if (v > wHi) wHi = v; }
  }
  if (!isFinite(wLo)) { wLo = sorted[0]; wHi = sorted[n - 1]; }
  return { n, min: sorted[0], q1, med, q3, max: sorted[n - 1], iqr,
           fLo, fHi, fLo3, fHi3, outliers, wLo, wHi };
}

function testVector(c, tag) {
  const sorted = c.x.slice().sort((a, b) => a - b);
  const a = analyze(sorted);
  check(`${tag} q1`, a.q1, c.q1);
  check(`${tag} median`, a.med, c.median);
  check(`${tag} q3`, a.q3, c.q3);
  check(`${tag} min`, a.min, c.min);
  check(`${tag} max`, a.max, c.max);
  check(`${tag} iqr`, a.iqr, c.iqr);
  check(`${tag} fenceLo`, a.fLo, c.fenceLo);
  check(`${tag} fenceHi`, a.fHi, c.fenceHi);
  check(`${tag} fence3Lo`, a.fLo3, c.fence3Lo);
  check(`${tag} fence3Hi`, a.fHi3, c.fence3Hi);
  check(`${tag} outliers`, a.outliers.slice().sort((x, y) => x - y), c.outliers);
  check(`${tag} whiskLo`, a.wLo, c.whiskLo);
  check(`${tag} whiskHi`, a.wHi, c.whiskHi);

  // fivenum + boxplot.stats reproduction (used by the R-code emitter + note).
  check(`${tag} fivenum`, DM.fivenum(sorted), c.fivenum);
  const bp = DM.boxplotStats(sorted, 1.5);
  check(`${tag} bpstats`, bp.stats, c.bpstats);
  check(`${tag} bpout`, bp.out.slice().sort((x, y) => x - y), c.bpout);

  // The load-bearing claim: type-7 fence outliers == boxplot.stats$out.
  const t7 = a.outliers.slice().sort((x, y) => x - y);
  if (!arrClose(t7, c.bpout)) {
    fail++; fails.push(`${tag} CLAIM type-7 outliers != boxplot.stats$out: ${JSON.stringify(t7)} vs ${JSON.stringify(c.bpout)}`);
  } else pass++;
}

truth.single.forEach(c => testVector(c, `single/${c.name}`));
truth.grouped.forEach(g => g.groups.forEach(m => testVector(m, `${g.name}/${m.name}`)));

console.log(`\nbox-plot-calculator math harness`);
console.log(`  ${pass} checks passed, ${fail} failed  (tol ${TOL})`);
if (fail) {
  console.log('\nFAILURES:');
  fails.slice(0, 40).forEach(f => console.log('  ' + f));
  process.exit(1);
}
console.log('  ALL GREEN\n');
