/* Gate descriptive-math.js against the R truth table
   (descriptive-statistics-calculator.json). Every numeric field must match to
   <= 1e-6 relative (aim 1e-7+). Run: node test-descriptive-statistics-calculator-math.js */
'use strict';
const fs = require('fs');
const path = require('path');
const DM = require('../../tools/lib/descriptive-math.js');

const cases = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'descriptive-statistics-calculator.json'), 'utf8'));

const relerr = (g, e) => {
  if (e === null || e === undefined) return (g === null || g === undefined) ? 0 : Infinity;
  if (typeof e === 'number' && !isFinite(e)) return (isFinite(g) ? Infinity : 0);
  if (typeof e === 'number' && isNaN(e)) return isNaN(g) ? 0 : Infinity;
  const d = Math.abs(g - e);
  return d / Math.max(1, Math.abs(e));
};

let maxRel = 0, fails = 0, n = 0;
function check(label, got, exp) {
  n++;
  const r = relerr(got, exp);
  if (r > maxRel) maxRel = r;
  if (r > 1e-6) {
    fails++;
    if (fails <= 60) console.log(`FAIL ${label}: got=${got} exp=${exp} rel=${r.toExponential(2)}`);
  }
}

for (const c of cases) {
  const tag = c.name;
  // jsonlite auto_unbox collapses length-1 vectors to scalars; re-wrap.
  const rawData = Array.isArray(c.data) ? c.data : (c.data == null ? [] : [c.data]);
  // Strip NA (null) exactly as the tool does before computing.
  const clean = rawData.filter(v => v !== null && v !== undefined);
  const e = c.expect;
  if (e.empty) {
    const g = DM.describe(clean);
    check(`${tag}|n`, g.n, 0);
    check(`${tag}|empty`, g.empty ? 1 : 0, 1);
    continue;
  }
  const g = DM.describe(clean, { level: 0.95 });
  check(`${tag}|n`, g.n, e.n);
  check(`${tag}|mean`, g.mean, e.mean);
  check(`${tag}|median`, g.median, e.median);
  check(`${tag}|sd`, g.sd, e.sd);
  check(`${tag}|var`, g.var, e.var);
  check(`${tag}|sdPop`, g.sdPop, e.sdPop);
  check(`${tag}|varPop`, g.varPop, e.varPop);
  check(`${tag}|se`, g.se, e.se);
  check(`${tag}|min`, g.min, e.min);
  check(`${tag}|max`, g.max, e.max);
  check(`${tag}|range`, g.range, e.range);
  check(`${tag}|q1`, g.q1, e.q1);
  check(`${tag}|q3`, g.q3, e.q3);
  check(`${tag}|iqr`, g.iqr, e.iqr);
  check(`${tag}|skewness`, g.skewness, e.skewness);
  check(`${tag}|kurtosis`, g.kurtosis, e.kurtosis);
  check(`${tag}|cv`, g.cv, e.cv);
  check(`${tag}|cvPop`, g.cvPop, e.cvPop);
  check(`${tag}|sum`, g.sum, e.sum);
  check(`${tag}|ci95lo`, g.ciLo, e.ci95lo);
  check(`${tag}|ci95hi`, g.ciHi, e.ci95hi);
  check(`${tag}|fenceLo`, g.fenceLo, e.fenceLo);
  check(`${tag}|fenceHi`, g.fenceHi, e.fenceHi);
  check(`${tag}|nOut`, g.nOut, e.nOut);
  check(`${tag}|modeFreq`, g.modeFreq, e.modeFreq);
  check(`${tag}|nModes`, g.nModes, e.nModes);
  check(`${tag}|fdBins`, g.fdBins, e.fdBins);
  check(`${tag}|sturgesBins`, g.sturgesBins, e.sturgesBins);
  // five-number summary
  const ef = [].concat(e.five);
  for (let i = 0; i < 5; i++) check(`${tag}|five${i}`, g.five[i], ef[i]);
  // outliers (sorted both sides)
  const eo = [].concat(e.outliers === undefined ? [] : e.outliers);
  for (let i = 0; i < Math.max(g.outliers.length, eo.length); i++)
    check(`${tag}|out${i}`, g.outliers[i], eo[i]);
  // modes (sorted both sides)
  const em = [].concat(e.modes === undefined ? [] : e.modes);
  for (let i = 0; i < Math.max(g.modes.length, em.length); i++)
    check(`${tag}|mode${i}`, g.modes[i], em[i]);
  // CI at 90 and 99 too
  const g90 = DM.describe(clean, { level: 0.90 });
  const g99 = DM.describe(clean, { level: 0.99 });
  check(`${tag}|ci90lo`, g90.ciLo, e.ci90lo);
  check(`${tag}|ci90hi`, g90.ciHi, e.ci90hi);
  check(`${tag}|ci99lo`, g99.ciLo, e.ci99lo);
  check(`${tag}|ci99hi`, g99.ciHi, e.ci99hi);
}

console.log(`\n${n} assertions, ${fails} failures, max rel err ${maxRel.toExponential(3)}`);
process.exit(fails ? 1 : 0);
