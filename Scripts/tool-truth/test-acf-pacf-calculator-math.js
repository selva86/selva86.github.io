/* Verifies tools/lib/acf-pacf-math.js against Scripts/tool-truth/acf-pacf-calculator.json
   (R 4.6.0 stats::acf / pacf / diff / Box.test / plot.acf bands).
   Gate: every case <= 1e-6 relative. Run: node Scripts/tool-truth/test-acf-pacf-calculator-math.js */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const TRUTH = JSON.parse(fs.readFileSync(path.join(__dirname, 'acf-pacf-calculator.json'), 'utf8'));
// Deep-tail Ljung-Box p-values, exact to 60 dp (mpmath). Needed because R's own
// pchisq drifts up to 3e-5 relative below ~1e-10, while acf-pacf-math is exact
// to ~1e-14 there - adjudicated by feeding R's OWN statistic to both. See
// Scripts/tool-truth/acf-pacf-deep-tail.py for the adjudication table.
const DEEP = JSON.parse(fs.readFileSync(path.join(__dirname, 'acf-pacf-deep-tail.json'), 'utf8'));
const LIB = path.join(__dirname, '..', '..', 'tools', 'lib');

// Load the libs the way the BROWSER does (script tags into a shared global), not
// via require(). A wrong UMD global name (root.Foo vs root.FooMath) is invisible
// to require() but fatal on the page, so the harness has to see what the page sees.
const sandbox = { self: null, console };
sandbox.self = sandbox;
vm.createContext(sandbox);
for (const f of ['vif-math.js', 'timeseries-math.js', 'normal-math.js', 'acf-pacf-math.js']) {
  vm.runInContext(fs.readFileSync(path.join(LIB, f), 'utf8'), sandbox, { filename: f });
}
const M = sandbox.AcfPacfMath;
if (!M) { console.error('FATAL: window.AcfPacfMath undefined - UMD global name is wrong'); process.exit(1); }
if (!sandbox.TimeSeriesMath) { console.error('FATAL: window.TimeSeriesMath undefined'); process.exit(1); }

let pass = 0, fail = 0, maxRel = 0, deepChecked = 0;
const fails = [];

function rel(got, want) {
  if (!isFinite(got) || !isFinite(want)) return (got === want || (isNaN(got) && isNaN(want))) ? 0 : Infinity;
  const d = Math.abs(got - want);
  return d <= 1e-300 ? 0 : d / Math.max(1e-12, Math.abs(want));
}
function check(id, what, got, want, tol) {
  tol = tol || 1e-6;
  const r = rel(got, want);
  if (r > maxRel) maxRel = r;
  if (r <= tol) { pass++; return true; }
  fail++;
  if (fails.length < 25) fails.push(`${id} :: ${what}  got=${got}  want=${want}  rel=${r.toExponential(3)}`);
  return false;
}
function checkVec(id, what, got, want, tol) {
  if (!Array.isArray(got) || got.length !== want.length) {
    fail++; fails.push(`${id} :: ${what} LENGTH got=${got && got.length} want=${want.length}`); return;
  }
  for (let i = 0; i < want.length; i++) check(id, `${what}[${i}]`, got[i], want[i], tol);
}

for (const c of TRUTH.cases) {
  const x = TRUTH.series[c.series];
  const lagMax = (c.lagMaxArg === null || c.lagMaxArg === undefined || Number.isNaN(c.lagMaxArg)) ? null : c.lagMaxArg;
  const r = M.analyze(x, { transform: c.transform, ci: 0.95, lagMax: lagMax });

  if (r.error) { fail++; fails.push(`${c.id} :: unexpected error "${r.error}"`); continue; }

  // structural conventions: acf carries lag 0, pacf does not
  check(c.id, 'n.used', r.n, c.n_used, 0);
  check(c.id, 'lag.max', r.lagmax, c.lagmax, 0);
  check(c.id, 'acf length (lag 0..L)', r.acf.length, c.acf.length, 0);
  check(c.id, 'pacf length (lag 1..L)', r.pacf.length, c.pacf.length, 0);
  check(c.id, 'acf lag0 is exactly 1', r.acf[0], 1, 0);

  checkVec(c.id, 'acf', r.acf, c.acf);
  checkVec(c.id, 'pacf', r.pacf, c.pacf);

  // the bands R actually draws
  check(c.id, 'band95', r.band, c.band95);
  check(c.id, 'band90', M.band(r.n, 0.90), c.band90);
  check(c.id, 'band99', M.band(r.n, 0.99), c.band99);
  checkVec(c.id, 'bartlett', r.bartlett, c.bartlett);

  // cumulative Ljung-Box at every lag
  for (let i = 0; i < c.lb.length; i++) {
    check(c.id, `LB lag${c.lb[i].lag} stat`, r.lb[i].stat, c.lb[i].stat);
    check(c.id, `LB lag${c.lb[i].lag} df`, r.lb[i].df, c.lb[i].df, 0);
    // p-values: gate against R where R is trustworthy, against the exact
    // 60dp oracle where it is not (R's pchisq drifts below ~1e-10).
    const key = `${c.id}|${c.lb[i].lag}`;
    if (c.lb[i].p >= DEEP.cutoff) {
      check(c.id, `LB lag${c.lb[i].lag} p`, r.lb[i].p, c.lb[i].p);
    } else if (DEEP.exact[key] !== undefined) {
      check(c.id, `LB lag${c.lb[i].lag} p (exact oracle)`, r.lb[i].p, DEEP.exact[key], 1e-9);
      deepChecked++;
    }
  }

  // the per-lag table must align by LAG NUMBER, not array index
  for (const row of r.rows) {
    check(c.id, `row lag${row.lag} acf`, row.acf, c.acf[row.lag]);
    if (row.lag === 0) {
      if (row.pacf !== null) { fail++; fails.push(`${c.id} :: row lag0 pacf should be null, got ${row.pacf}`); } else pass++;
    } else {
      check(c.id, `row lag${row.lag} pacf`, row.pacf, c.pacf[row.lag - 1]);
    }
  }
}

// ---- degenerate variance: refuse exactly where R returns NaN ---------------
const flat = M.analyze(new Array(20).fill(5), { transform: 'none' });
if (flat.error && /NaN/.test(flat.error)) pass++; else { fail++; fails.push('constant series must error mentioning NaN, got ' + JSON.stringify(flat.error || flat.acf)); }
if (TRUTH.constant.acf_is_nan !== true) { fail++; fails.push('R truth says constant acf is not NaN?'); }

// Overflow / underflow: R gives NaN, so a white-noise verdict here would be a
// fabricated reading of garbage. Refuse, and say which way it broke.
for (const [key, wantWord] of [['huge', /overflow/i], ['tiny', /underflow/i]]) {
  const d = TRUTH.degenerate[key];
  if (d.acf_is_nan !== true) { fail++; fails.push(`R truth: ${key} acf is not NaN?`); }
  const r = M.analyze(d.x, { transform: 'none' });
  if (r.error && wantWord.test(r.error)) pass++;
  else { fail++; fails.push(`${key} series must refuse citing ${wantWord}, got ` + JSON.stringify(r.error || r.acf.slice(0, 3))); }
}
// ...but a near-constant series has a real variance: R answers, so must we.
{
  const d = TRUTH.degenerate.nearconst;
  const r = M.analyze(d.x, { transform: 'none' });
  if (r.error) { fail++; fails.push('near-constant series must NOT be refused: R answers. got ' + r.error); }
  else { checkVec('nearconst', 'acf', r.acf, d.acf, 1e-6); }
}

// too-short input, and differencing that eats the series
for (const [label, arg] of [['empty', []], ['n=3', [1, 2, 3]]]) {
  const r = M.analyze(arg, { transform: 'none' });
  if (r.error) pass++; else { fail++; fails.push(`${label} must error`); }
}
const eaten = M.analyze([1, 2, 3, 4, 5, 6], { transform: 'sdiff12' });
if (eaten.error) pass++; else { fail++; fails.push('sdiff12 on n=6 must error'); }

// lag.max clamp to n-1 (R's rule), and the floor at 1
const clamp = M.analyze(TRUTH.series.tiny10, { transform: 'none', lagMax: 999 });
if (clamp.lagmax === TRUTH.series.tiny10.length - 1) pass++; else { fail++; fails.push(`lagMax clamp got ${clamp.lagmax}`); }

// default lag.max == floor(10*log10(n))
for (const n of [30, 100, 144, 114]) {
  check('default-lagmax', `n=${n}`, M.acfDefaultLagMax(n), Math.floor(10 * Math.log10(n)), 0);
}

// the band really is qnorm-based, not the rounded 1.96 (they differ at 1e-5)
const b144 = M.band(144, 0.95);
if (Math.abs(b144 - 1.96 / Math.sqrt(144)) > 1e-9 && Math.abs(b144 - 0.16333026) < 1e-6) pass++;
else { fail++; fails.push('band must be qnorm(.975)/sqrt(n), not 1.96/sqrt(n)'); }

// diffR must equal R's diff(x, lag, differences)
const dv = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8, 9, 7, 9, 3];
const d1 = M.diffR(dv, 1, 1), d2 = M.diffR(dv, 1, 2), ds = M.diffR(dv, 12, 1);
if (d1.length === 15 && d2.length === 14 && ds.length === 4) pass++; else { fail++; fails.push('diffR lengths wrong'); }
if (d2[0] === (dv[2] - dv[1]) - (dv[1] - dv[0])) pass++; else { fail++; fails.push('diffR differences=2 wrong'); }

console.log(`\nacf-pacf-math vs R 4.6.0: ${pass} passed, ${fail} failed  (max rel ${maxRel.toExponential(2)})`);
console.log(`  ${TRUTH.cases.length} cases; ${deepChecked} deep-tail p-values checked against the exact 60dp oracle instead of R`);
if (fails.length) { console.log('\nFAILURES:'); fails.forEach(f => console.log('  ' + f)); }
process.exit(fail ? 1 : 0);
