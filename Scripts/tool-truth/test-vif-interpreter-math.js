const M = require('../../tools/lib/vif-math.js');
const truth = JSON.parse(require('fs').readFileSync(__dirname + '/vif-interpreter.json', 'utf8'));
const TOL = 1e-6;
let pass = 0, fail = 0;

function rel(a, b) {
  if (!isFinite(a) || !isFinite(b)) return (a === b || (isNaN(a) && isNaN(b))) ? 0 : Infinity;
  return Math.abs(a - b) / Math.max(1e-300, Math.abs(b));
}
function check(id, got, want) {
  const r = rel(got, want);
  if (r > TOL) { fail++; console.log(`FAIL ${id}: got ${got} want ${want} (rel ${r.toExponential(2)})`); }
  else pass++;
}

for (const c of truth) {
  if (c.type === 'cor') {
    const res = M.vifFromCor(c.R);
    if (res.error) { fail++; console.log(`FAIL ${c.id}: unexpected error ${res.error}`); continue; }
    for (let j = 0; j < c.vif.length; j++) check(`${c.id}[vif ${c.names[j]}]`, res.vifs[j], c.vif[j]);
    check(`${c.id}[cond]`, res.cond, c.cond);
    // cross-check tolerance / SE inflation identities
    for (let j = 0; j < c.vif.length; j++) {
      check(`${c.id}[tol ${c.names[j]}]`, M.tolerance(res.vifs[j]), 1 / c.vif[j]);
      check(`${c.id}[se ${c.names[j]}]`, M.seInflation(res.vifs[j]), Math.sqrt(c.vif[j]));
    }
  } else if (c.type === 'gvif') {
    check(`${c.id}[comparable_vif]`, M.gvifComparable(c.adj), c.comparable_vif);
  } else if (c.type === 'scalar') {
    check(`${c.id}[tol]`, M.tolerance(c.vif), c.tolerance);
    check(`${c.id}[se]`, M.seInflation(c.vif), c.se_infl);
  } else if (c.type === 'singular') {
    const res = M.vifFromCor(c.R);
    if (res.error) pass++;
    else { fail++; console.log(`FAIL ${c.id}: expected singular error, got vifs ${JSON.stringify(res.vifs)}`); }
  }
}

console.log(`${pass} PASS / ${fail} FAIL (tolerance ${TOL})`);
process.exit(fail ? 1 : 0);
