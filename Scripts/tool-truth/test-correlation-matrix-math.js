/* Harness: tools/lib/correlation-matrix-math.js vs the R truth table.
   Run: node Scripts/tool-truth/test-correlation-matrix-math.js
   Gate: every case <= 1e-6 relative. */
'use strict';
const path = require('path');
const fs = require('fs');
const vm = require('vm');

const LIB = path.join(__dirname, '..', '..', 'tools', 'lib');
const M = require(path.join(LIB, 'correlation-matrix-math.js'));
const truth = require(path.join(__dirname, 'correlation-matrix-calculator.json'));

let pass = 0, fail = 0, maxRel = 0;
const fails = [];

function rel(a, b) {
  if (a === null && b === null) return 0;
  if (a === null || b === null) return Infinity;
  if (!isFinite(a) || !isFinite(b)) return a === b ? 0 : Infinity;
  const d = Math.abs(a - b);
  return d / Math.max(1e-300, Math.abs(b), 1e-12);
}
// p-values legitimately reach 0 / 1e-300; compare with an absolute floor too.
function close(a, b, tol) {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  if (!isFinite(a) || !isFinite(b)) return a === b;
  if (Math.abs(a - b) <= 1e-12) return true;
  return rel(a, b) <= tol;
}
function chk(label, got, want, tol) {
  tol = tol || 1e-6;
  const ok = close(got, want, tol);
  if (ok) {
    pass++;
    if (want !== null && got !== null && isFinite(want) && isFinite(got) && Math.abs(want) > 1e-8) {
      const r = rel(got, want);
      if (r > maxRel) maxRel = r;
    }
  } else {
    fail++;
    if (fails.length < 25) fails.push(`${label}: got ${got} want ${want} (rel ${rel(got, want).toExponential(3)})`);
  }
}

// ---- 1. every case: r / p / n vs R ----------------------------------------
for (const c of truth.cases) {
  const cols = c.names.map((nm, j) => ({ name: nm, values: c.data.map(row => row[j]) }));
  const res = M.build(cols, { method: c.method, deletion: c.deletion });
  const tag = `${c.name}/${c.method}/${c.deletion}`;

  if (res.error) { fail++; fails.push(`${tag}: lib errored: ${res.error}`); continue; }
  if (res.names.join('|') !== c.names.join('|')) { fail++; fails.push(`${tag}: names differ`); }

  const k = c.names.length;
  for (let i = 0; i < k; i++) {
    for (let j = 0; j < k; j++) {
      chk(`${tag} r[${c.names[i]},${c.names[j]}]`, res.r[i][j], c.r[i][j]);
      chk(`${tag} p[${c.names[i]},${c.names[j]}]`, res.p[i][j], c.p[i][j]);
      // n is an integer count: exact match required.
      if (res.n[i][j] !== c.n[i][j]) {
        fail++; fails.push(`${tag} n[${c.names[i]},${c.names[j]}]: got ${res.n[i][j]} want ${c.n[i][j]}`);
      } else pass++;
    }
  }
}

// ---- 2. n per cell vs Hmisc::rcorr$n (the spec's hard requirement) --------
let rcorrCases = 0, rcorrCells = 0;
for (const c of truth.cases) {
  if (!Array.isArray(c.rcorr_n) || !Array.isArray(c.rcorr_n[0])) continue;
  rcorrCases++;
  const cols = c.names.map((nm, j) => ({ name: nm, values: c.data.map(row => row[j]) }));
  const res = M.build(cols, { method: c.method, deletion: c.deletion });
  const k = c.names.length;
  for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) {
    rcorrCells++;
    if (res.n[i][j] !== c.rcorr_n[i][j]) {
      fail++; fails.push(`rcorr n ${c.name}/${c.method}/${c.deletion}[${i}][${j}]: got ${res.n[i][j]} want ${c.rcorr_n[i][j]}`);
    } else pass++;
    chk(`rcorr r ${c.name}/${c.method}/${c.deletion}[${i}][${j}]`, res.r[i][j], c.rcorr_r[i][j]);
    if (i !== j) chk(`rcorr P ${c.name}/${c.method}/${c.deletion}[${i}][${j}]`, res.p[i][j], c.rcorr_p[i][j]);
  }
}

// ---- 3. multiple-testing adjustment vs R p.adjust -------------------------
{
  const noise = truth.cases.find(c => c.name === 'pure-noise-10col' && c.method === 'pearson' && c.deletion === 'pairwise');
  const cols = noise.names.map((nm, j) => ({ name: nm, values: noise.data.map(row => row[j]) }));
  const res = M.build(cols, { method: 'pearson', deletion: 'pairwise' });
  const pa = truth.padjust_noise;
  if (res.nTests !== pa.n_tests) { fail++; fails.push(`nTests: got ${res.nTests} want ${pa.n_tests}`); } else pass++;
  // R's upper.tri walks column-major: (1,2),(1,3),(2,3),(1,4)... build the same order.
  const order = [];
  for (let j = 0; j < noise.names.length; j++) for (let i = 0; i < j; i++) order.push(`${i},${j}`);
  const byKey = {}; res.pairs.forEach(pr => { byKey[`${pr.i},${pr.j}`] = pr; });
  order.forEach((key, idx) => {
    const pr = byKey[key];
    chk(`padj raw[${idx}]`, pr.p, pa.pvals[idx]);
    chk(`padj bonferroni[${idx}]`, pr.p_bonferroni, pa.bonferroni[idx]);
    chk(`padj holm[${idx}]`, pr.p_holm, pa.holm[idx]);
    chk(`padj BH[${idx}]`, pr.p_BH, pa.BH[idx]);
  });
}

// ---- 4. the cor.test divergence claim, asserted (not assumed) -------------
// Pearson: lib p MUST equal cor.test everywhere.
// Spearman: lib p MUST equal cor.test exactly where the pair has ties.
let ctPearsonChecked = 0, ctSpearmanTiedChecked = 0;
for (const c of truth.cases) {
  if (!c.cortest_p) continue;
  const cols = c.names.map((nm, j) => ({ name: nm, values: c.data.map(row => row[j]) }));
  const res = M.build(cols, { method: c.method, deletion: c.deletion });
  const k = c.names.length;
  for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) {
    if (i === j) continue;
    const want = c.cortest_p[i][j];
    if (want === null) continue;
    if (c.method === 'pearson') {
      ctPearsonChecked++;
      chk(`cor.test pearson ${c.name}[${i}][${j}]`, res.p[i][j], want);
    } else if (res.ties[i][j]) {
      ctSpearmanTiedChecked++;
      chk(`cor.test spearman(ties) ${c.name}[${i}][${j}]`, res.p[i][j], want);
    }
  }
}

// ---- 5. browser-global wiring (node require cannot catch a wrong global) --
{
  const files = ['ttest-math.js', 'normal-math.js', 'correlation-math.js',
                 'data-parse.js', 'multiple-testing-math.js', 'correlation-matrix-math.js'];
  const sandbox = {}; sandbox.self = sandbox; sandbox.window = sandbox;
  vm.createContext(sandbox);
  for (const f of files) vm.runInContext(fs.readFileSync(path.join(LIB, f), 'utf8'), sandbox, { filename: f });
  if (typeof sandbox.CorrMatrixMath !== 'object' || !sandbox.CorrMatrixMath) {
    fail++; fails.push('browser global CorrMatrixMath missing after script-tag load order');
  } else {
    pass++;
    const probe = sandbox.CorrMatrixMath.build(
      [{ name: 'a', values: [1, 2, 3, 4, 5] }, { name: 'b', values: [2, 1, 4, 3, 6] }],
      { method: 'pearson', deletion: 'pairwise' });
    if (probe.error || probe.r[0][1] === null) { fail++; fails.push('browser-global probe failed to compute'); }
    else pass++;
  }
}

// ---- 6. error paths -------------------------------------------------------
{
  const one = M.build([{ name: 'a', values: [1, 2, 3] }], {});
  if (!one.error) { fail++; fails.push('single column should error'); } else pass++;
  const txt = M.fromText('1\n2\n3\n', {});
  if (!txt.error) { fail++; fails.push('single-column text should error'); } else pass++;
  const empty = M.fromText('', {});
  if (!empty.error) { fail++; fails.push('empty text should error'); } else pass++;
  // header auto-detect
  const hdr = M.fromText('mpg\thp\n21\t110\n22.8\t93\n18.7\t175\n14.3\t245\n', {});
  if (hdr.error || hdr.names[0] !== 'mpg' || hdr.names[1] !== 'hp') {
    fail++; fails.push('header auto-detect failed: ' + JSON.stringify(hdr.names || hdr.error));
  } else pass++;
}

// ---- report ---------------------------------------------------------------
console.log(`cases in truth table : ${truth.cases.length}`);
console.log(`rcorr-verified cases : ${rcorrCases} (${rcorrCells} cells)`);
console.log(`cor.test cells asserted: pearson ${ctPearsonChecked}, spearman-with-ties ${ctSpearmanTiedChecked}`);
console.log(`checks passed        : ${pass}`);
console.log(`checks failed        : ${fail}`);
console.log(`max relative error   : ${maxRel.toExponential(3)}`);
if (fails.length) { console.log('\n--- failures ---'); fails.forEach(f => console.log('  ' + f)); }
console.log(fail === 0 ? '\nGATE: PASS' : '\nGATE: FAIL');
process.exit(fail === 0 ? 0 : 1);
