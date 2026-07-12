// Node harness: bootstrap-math.js vs R truth table (Scripts/tool-truth/bootstrap-ci.json).
// Gate: every displayed quantity within 1e-6 relative (aim 1e-9+) of R's boot()/boot.ci().
const fs = require('fs');
const path = require('path');
const BM = require('../../Tools/lib/bootstrap-math.js');

const truth = JSON.parse(fs.readFileSync(path.join(__dirname, 'bootstrap-ci.json'), 'utf8'));

let pass = 0, fail = 0;
const fails = [];
function rel(a, b) { const d = Math.abs(a - b); const s = Math.max(1, Math.abs(a), Math.abs(b)); return d / s; }
function check(name, got, want, tol) {
  tol = tol || 1e-6;
  if (want === null || want === undefined) return;
  const r = rel(got, want);
  if (Number.isFinite(r) && r <= tol) pass++;
  else { fail++; fails.push(`${name}: got ${got}  want ${want}  rel ${r.toExponential(3)}`); }
}

for (const c of truth.cases) {
  const fn = BM.STAT[c.stat];
  const res = BM.bootstrap(c.x, fn, { R: c.R, seed: c.seed, conf: c.conf });
  const tag = `[${c.label}]`;
  check(`${tag} t0`, res.t0, c.t0, 1e-12);
  check(`${tag} meanStar`, res.meanStar, c.meanStar, 1e-9);
  check(`${tag} sdStar`, res.sdStar, c.sdStar, 1e-9);
  // first replicates element-by-element (proves the resample engine matches R)
  for (let i = 0; i < c.tstar_head.length; i++) check(`${tag} tstar[${i}]`, res.t[i], c.tstar_head[i], 1e-9);
  check(`${tag} w`, res.w, c.w, 1e-8);
  check(`${tag} acc`, res.acc, c.acc, 1e-6);
  if (res.Ltype !== c.Ltype) { fail++; fails.push(`${tag} Ltype: got ${res.Ltype} want ${c.Ltype}`); } else pass++;
  check(`${tag} norm.lo`, res.ci.norm[0], c.norm[0], 1e-8);
  check(`${tag} norm.hi`, res.ci.norm[1], c.norm[1], 1e-8);
  check(`${tag} basic.lo`, res.ci.basic[0], c.basic[0], 1e-8);
  check(`${tag} basic.hi`, res.ci.basic[1], c.basic[1], 1e-8);
  check(`${tag} perc.lo`, res.ci.perc[0], c.perc[0], 1e-8);
  check(`${tag} perc.hi`, res.ci.perc[1], c.perc[1], 1e-8);
  check(`${tag} bca.lo`, res.ci.bca[0], c.bca[0], 1e-8);
  check(`${tag} bca.hi`, res.ci.bca[1], c.bca[1], 1e-8);
}

console.log(`\nBootstrap math: ${pass} passed, ${fail} failed`);
if (fail) { console.log('\nFailures:'); fails.slice(0, 40).forEach(f => console.log('  ' + f)); }
process.exit(fail ? 1 : 0);
