/* Gate outlier-math.js against the R truth table (outlier.json).
   Every numeric field must match to <= 1e-6 relative (aim 1e-7+).
   Run: node test-outlier-math.js  */
'use strict';
const fs = require('fs');
const path = require('path');
const OM = require('../../tools/lib/outlier-math.js');

const cases = JSON.parse(fs.readFileSync(path.join(__dirname, 'outlier.json'), 'utf8'));

const relerr = (g, e) => {
  if (e === null || e === undefined) return (g === null || g === undefined) ? 0 : Infinity;
  if (!isFinite(e)) return (isFinite(g) ? Infinity : 0);
  if (isNaN(e)) return isNaN(g) ? 0 : Infinity;
  const d = Math.abs(g - e);
  return d / Math.max(1, Math.abs(e));
};

let maxRel = 0, fails = 0, n = 0;
function check(label, got, exp) {
  n++;
  const r = relerr(got, exp);
  if (r > maxRel) maxRel = r;
  if (r > 1e-6 || (typeof exp === 'boolean' && got !== exp)) {
    fails++;
    if (fails <= 40) console.log(`FAIL ${label}: got=${got} exp=${exp} rel=${r.toExponential(2)}`);
  }
}

for (const c of cases) {
  const a = c.args, e = c.expect, tag = c.note;
  if (c.fn === 'grubbs') {
    const g = OM.grubbs(a.data, a.alpha);
    check(`${tag}|G`, g.G, e.G);
    check(`${tag}|U`, g.U, e.U);
    check(`${tag}|pOne`, g.pOne, e.pOne);
    check(`${tag}|pTwo`, g.pTwo, e.pTwo);
    check(`${tag}|Gcrit`, g.Gcrit, e.Gcrit);
    check(`${tag}|low`, g.low, e.low);
    check(`${tag}|extreme`, g.extreme, e.extreme);
    check(`${tag}|isOut`, g.isOut, e.isOut);
  } else if (c.fn === 'esd') {
    const g = OM.esd(a.data, a.k, a.alpha);
    check(`${tag}|nOut`, g.nOut, e.nOut);
    check(`${tag}|nRows`, g.stats.length, e.stats.length);
    for (let i = 0; i < Math.min(g.stats.length, e.stats.length); i++) {
      const gr = g.stats[i], er = e.stats[i];
      check(`${tag}|row${i}.mean`, gr.mean, er.mean);
      check(`${tag}|row${i}.sd`, gr.sd, er.sd);
      check(`${tag}|row${i}.R`, gr.R, er.R);
      check(`${tag}|row${i}.lambda`, gr.lambda, er.lambda);
      check(`${tag}|row${i}.value`, gr.value, er.value);
      check(`${tag}|row${i}.obsNum`, gr.obsNum, er.obsNum);
      check(`${tag}|row${i}.outlier`, gr.outlier, er.outlier);
    }
  } else if (c.fn === 'hampel') {
    const g = OM.hampel(a.data, a.k);
    check(`${tag}|median`, g.median, e.median);
    check(`${tag}|mad`, g.mad, e.mad);
    check(`${tag}|lo`, g.lo, e.lo);
    check(`${tag}|hi`, g.hi, e.hi);
    check(`${tag}|nFlagged`, g.nFlagged, e.nFlagged);
    const ef = [].concat(e.flagged);
    for (let i = 0; i < Math.max(g.flagged.length, ef.length); i++)
      check(`${tag}|flag${i}`, g.flagged[i], ef[i]);
  } else if (c.fn === 'tukey') {
    const g = OM.tukey(a.data, a.coef);
    const ef5 = [].concat(e.five);
    for (let i = 0; i < 5; i++) check(`${tag}|five${i}`, g.five[i], ef5[i]);
    check(`${tag}|q1`, g.q1, e.q1);
    check(`${tag}|q3`, g.q3, e.q3);
    check(`${tag}|iqr`, g.iqr, e.iqr);
    check(`${tag}|lo`, g.lo, e.lo);
    check(`${tag}|hi`, g.hi, e.hi);
    check(`${tag}|nFlagged`, g.nFlagged, e.nFlagged);
    const ef = [].concat(e.flagged);
    for (let i = 0; i < Math.max(g.flagged.length, ef.length); i++)
      check(`${tag}|flag${i}`, g.flagged[i], ef[i]);
  }
}

console.log(`\n${n} assertions, ${fails} failures, max rel err ${maxRel.toExponential(3)}`);
process.exit(fails ? 1 : 0);
