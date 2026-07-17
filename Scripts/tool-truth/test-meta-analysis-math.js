/* Gate: tools/lib/meta-analysis-math.js vs R metafor 5.0.1.
   Run: node Scripts/tool-truth/test-meta-analysis-math.js
   Every case must agree to <= 1e-6 relative. Checks pooled estimates, SEs,
   CIs, z, p, Q, df, Q's p, I2, tau2, C, per-study percent weights, and the
   escalc log-OR arithmetic for the 2x2 cases (incl. the zero-cell rule). */
'use strict';
const fs = require('fs');
const path = require('path');
const M = require('../../tools/lib/meta-analysis-math.js');

const truth = JSON.parse(fs.readFileSync(
  path.join(__dirname, 'meta-analysis-quick-tool.json'), 'utf8'));

const TOL = 1e-6;
let checks = 0, fails = 0;
let worst = { rel: 0, what: '' };

function rel(got, exp) {
  if (!isFinite(got) || !isFinite(exp)) return got === exp ? 0 : Infinity;
  const d = Math.abs(got - exp);
  const scale = Math.max(Math.abs(exp), 1e-8);
  return Math.abs(exp) < 1e-10 ? d : d / scale;
}

function eq(what, got, exp) {
  checks++;
  const r = rel(got, exp);
  if (r > worst.rel) worst = { rel: r, what };
  if (!(r <= TOL)) {
    fails++;
    console.log(`  FAIL ${what}: got ${got}, expected ${exp}  (rel ${r.toExponential(3)})`);
  }
}

// jsonlite may unbox a length-1 vector; normalise to array.
const arr = (v) => (Array.isArray(v) ? v : [v]);

for (const cs of truth) {
  const labels = arr(cs.labels);
  let studies;

  if (cs.mode === 'counts') {
    const c = cs.counts;
    const et = arr(c.et), nt = arr(c.nt), ec = arr(c.ec), nc = arr(c.nc);
    studies = labels.map((lab, i) => {
      const e = M.escalcOR(et[i], nt[i], ec[i], nc[i]);
      // escalc arithmetic itself is ground-truthed, per study.
      eq(`${cs.name}[${i}] escalc yi`, e.yi, arr(cs.yi)[i]);
      eq(`${cs.name}[${i}] escalc vi`, e.vi, arr(cs.vi)[i]);
      return { label: lab, yi: e.yi, sei: e.sei };
    });
  } else {
    const yi = arr(cs.yi), sei = arr(cs.sei);
    studies = labels.map((lab, i) => ({ label: lab, yi: yi[i], sei: sei[i] }));
  }

  const r = M.analyze(studies, cs.level);

  // --- fixed effect ---
  eq(`${cs.name} FE est`, r.fe.est, cs.fe.est);
  eq(`${cs.name} FE se`, r.fe.se, cs.fe.se);
  eq(`${cs.name} FE lo`, r.fe.lo, cs.fe.lo);
  eq(`${cs.name} FE hi`, r.fe.hi, cs.fe.hi);
  eq(`${cs.name} FE z`, r.fe.z, cs.fe.z);
  eq(`${cs.name} FE p`, r.fe.p, cs.fe.p);

  // --- random effects ---
  eq(`${cs.name} RE est`, r.re.est, cs.re.est);
  eq(`${cs.name} RE se`, r.re.se, cs.re.se);
  eq(`${cs.name} RE lo`, r.re.lo, cs.re.lo);
  eq(`${cs.name} RE hi`, r.re.hi, cs.re.hi);
  eq(`${cs.name} RE z`, r.re.z, cs.re.z);
  eq(`${cs.name} RE p`, r.re.p, cs.re.p);

  // --- heterogeneity ---
  eq(`${cs.name} Q`, r.het.Q, cs.het.Q);
  eq(`${cs.name} df`, r.het.df, cs.het.df);
  eq(`${cs.name} Qp`, r.het.Qp, cs.het.Qp);
  eq(`${cs.name} I2`, r.het.I2, cs.het.I2);
  eq(`${cs.name} tau2`, r.het.tau2, cs.het.tau2);
  eq(`${cs.name} C`, r.het.C, cs.het.C);

  // --- per-study percent weights, both models ---
  const wfe = arr(cs.fe.weights), wre = arr(cs.re.weights);
  r.studies.forEach((s, i) => {
    eq(`${cs.name}[${i}] weight FE%`, s.pctFE, wfe[i]);
    eq(`${cs.name}[${i}] weight RE%`, s.pctRE, wre[i]);
  });
}

// ---- parser + edge behaviour (no R counterpart; asserted directly) ----
function ok(what, cond) {
  checks++;
  if (!cond) { fails++; console.log(`  FAIL ${what}`); }
}

const pES = M.parse('Smith 2020, 0.42, 0.15\nJones 2021, 0.30, 0.10', 'es');
ok('parse es: 2 studies', pES.studies.length === 2 && !pES.error);
ok('parse es: label with spaces kept', pES.studies[0].label === 'Smith 2020');

const pHdr = M.parse('study, effect, se\nA, 0.4, 0.1\nB, 0.2, 0.2', 'es');
ok('parse es: header row skipped', pHdr.studies.length === 2 && !pHdr.error);

const pTab = M.parse('A\t0.4\t0.1\nB\t0.2\t0.2', 'es');
ok('parse es: tab separated', pTab.studies.length === 2 && !pTab.error);

const pNoLab = M.parse('0.4, 0.1\n0.2, 0.2', 'es');
ok('parse es: label optional', pNoLab.studies.length === 2 && pNoLab.studies[0].label === 'Study 1');

ok('parse es: SE=0 rejected', !!M.parse('A, 0.4, 0\nB, 0.2, 0.2', 'es').error);
ok('parse es: SE<0 rejected', !!M.parse('A, 0.4, -0.1\nB, 0.2, 0.2', 'es').error);
ok('parse es: junk rejected', !!M.parse('A, banana, 0.1\nB, 0.2, 0.2', 'es').error);
ok('parse es: k<2 rejected', !!M.parse('A, 0.4, 0.1', 'es').error);
ok('parse es: empty rejected', !!M.parse('   ', 'es').error);
ok('parse es: short row rejected', !!M.parse('A\nB, 0.2, 0.2', 'es').error);

const pC = M.parse('Trial A, 12, 100, 20, 100\nTrial B, 8, 80, 15, 85', 'counts');
ok('parse counts: 2 studies', pC.studies.length === 2 && !pC.error);
ok('parse counts: events>total rejected', !!M.parse('A, 120, 100, 20, 100\nB, 8, 80, 15, 85', 'counts').error);
ok('parse counts: negative rejected', !!M.parse('A, -1, 100, 20, 100\nB, 8, 80, 15, 85', 'counts').error);
ok('parse counts: fractional rejected', !!M.parse('A, 1.5, 100, 20, 100\nB, 8, 80, 15, 85', 'counts').error);
ok('parse counts: zero total rejected', !!M.parse('A, 0, 0, 20, 100\nB, 8, 80, 15, 85', 'counts').error);

// zero-cell rule: 0.5 added to all four cells of THAT study only
const z = M.escalcOR(0, 25, 5, 25);
ok('escalc: zero cell flagged', z.adjusted === true);
eq('escalc zero-cell yi', z.yi, Math.log((0.5 * 20.5) / (25.5 * 5.5)));
const nz = M.escalcOR(8, 40, 12, 38);
ok('escalc: no adjustment when no zero cell', nz.adjusted === false);

// tau2 = 0 must collapse RE onto FE
const homog = M.analyze([
  { label: 'a', yi: 0.30, sei: 0.2 }, { label: 'b', yi: 0.31, sei: 0.2 },
  { label: 'c', yi: 0.29, sei: 0.2 }, { label: 'd', yi: 0.30, sei: 0.2 }], 95);
ok('tau2=0 clamps', homog.het.tau2 === 0);
eq('tau2=0 -> RE est == FE est', homog.re.est, homog.fe.est);
eq('tau2=0 -> RE se == FE se', homog.re.se, homog.fe.se);

// weights must sum to 100%
for (const cs of truth) {
  const labels = arr(cs.labels), yi = arr(cs.yi), sei = arr(cs.sei);
  const r = M.analyze(labels.map((l, i) => ({ label: l, yi: yi[i], sei: sei[i] })), cs.level);
  eq(`${cs.name} FE weights sum`, r.studies.reduce((t, s) => t + s.pctFE, 0), 100);
  eq(`${cs.name} RE weights sum`, r.studies.reduce((t, s) => t + s.pctRE, 0), 100);
}

console.log(`\n${checks - fails}/${checks} checks passed (tol ${TOL} relative)`);
console.log(`worst deviation: ${worst.rel.toExponential(3)} at ${worst.what}`);
if (fails) { console.log(`\n${fails} FAILURES`); process.exit(1); }
console.log('ALL GREEN vs R metafor');
