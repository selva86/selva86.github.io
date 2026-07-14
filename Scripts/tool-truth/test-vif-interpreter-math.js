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
// rows (row-major matrix from R) -> columns (one array per predictor)
function cols(data) {
  const p = data[0].length, n = data.length, out = [];
  for (let j = 0; j < p; j++) { const c = []; for (let i = 0; i < n; i++) c.push(data[i][j]); out.push(c); }
  return out;
}

for (const c of truth) {
  if (c.type === 'cor') {
    const res = M.vifFromCor(c.R);
    if (res.error) { fail++; console.log(`FAIL ${c.id}: unexpected error ${res.error}`); continue; }
    for (let j = 0; j < c.vif.length; j++) check(`${c.id}[vif ${c.names[j]}]`, res.vifs[j], c.vif[j]);
    check(`${c.id}[cond]`, res.cond, c.cond);
    for (let j = 0; j < c.vif.length; j++) {
      check(`${c.id}[tol ${c.names[j]}]`, M.tolerance(res.vifs[j]), 1 / c.vif[j]);
      check(`${c.id}[se ${c.names[j]}]`, M.seInflation(res.vifs[j]), Math.sqrt(c.vif[j]));
    }
  } else if (c.type === 'raw') {
    // (1) correlation matrix matches R's cor()  (2) VIFs match car::vif()
    const X = cols(c.data);
    const R = M.corMatrix(X);
    for (let i = 0; i < R.length; i++)
      for (let j = 0; j < R.length; j++)
        check(`${c.id}[R ${i},${j}]`, R[i][j], c.R[i][j]);
    const res = M.vifFromData(X);
    if (res.error) { fail++; console.log(`FAIL ${c.id}: unexpected error ${res.error}`); continue; }
    for (let j = 0; j < c.vif.length; j++) check(`${c.id}[vif ${c.names[j]}]`, res.vifs[j], c.vif[j]);
    check(`${c.id}[cond]`, res.cond, c.cond);
  } else if (c.type === 'drop') {
    // recompute VIFs after removing the dropped predictors: reduce R, re-invert.
    const X = cols(c.data);
    const R = M.corMatrix(X);
    const keepIdx = c.names.map((n, i) => i).filter(i => c.drop.indexOf(c.names[i]) < 0);
    const res = M.vifFromCor(M.subMatrix(R, keepIdx));
    if (res.error) { fail++; console.log(`FAIL ${c.id}: unexpected error ${res.error}`); continue; }
    for (let j = 0; j < c.vif_after.length; j++)
      check(`${c.id}[after ${c.names_after[j]}]`, res.vifs[j], c.vif_after[j]);
  } else if (c.type === 'gvif') {
    check(`${c.id}[comparable_vif]`, M.gvifComparable(c.adj), c.comparable_vif);
  } else if (c.type === 'scalar') {
    check(`${c.id}[tol]`, M.tolerance(c.vif), c.tolerance);
    check(`${c.id}[se]`, M.seInflation(c.vif), c.se_infl);
  } else if (c.type === 'singular') {
    const res = M.vifFromCor(c.R);
    if (res.error) pass++;
    else { fail++; console.log(`FAIL ${c.id}: expected singular error, got vifs ${JSON.stringify(res.vifs)}`); }
    // aliased-column detection should flag the duplicate (the 2nd predictor).
    const al = M.aliasedColumns(c.R);
    if (al.length === 1 && al[0] === 1) pass++;
    else { fail++; console.log(`FAIL ${c.id}: aliasedColumns expected [1], got ${JSON.stringify(al)}`); }
  }
}

// ---- greedy drop-set sanity: mtcars 4-pred should drop until max VIF < 5 ----
(function () {
  const c = truth.find(t => t.id === 'raw_mtcars_4');
  const X = [], data = c.data, p = data[0].length;
  for (let j = 0; j < p; j++) { const col = []; for (let i = 0; i < data.length; i++) col.push(data[i][j]); X.push(col); }
  const R = M.corMatrix(X);
  const g = M.greedyDropSet(R, c.names, 5);
  const ok = g.keep.length >= 2 && g.vifs.every(v => v < 5) && g.drop.length >= 1;
  if (ok) pass++; else { fail++; console.log(`FAIL greedyDropSet: drop=${JSON.stringify(g.drop)} keepVifs=${JSON.stringify(g.vifs)}`); }
})();

console.log(`${pass} PASS / ${fail} FAIL (tolerance ${TOL})`);
process.exit(fail ? 1 : 0);
