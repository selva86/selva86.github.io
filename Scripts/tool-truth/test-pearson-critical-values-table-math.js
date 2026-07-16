/* Gate pearson-r-math.js (and the dist-tables-math primitives it composes)
   against the R truth table (pearson-critical-values-table.json).
   Every value must match to <= 1e-6 relative (aim 1e-7+).
   Run: node Scripts/tool-truth/test-pearson-critical-values-table-math.js  */
'use strict';
const fs = require('fs');
const path = require('path');
const P = require('../../tools/lib/pearson-r-math.js');

const cases = JSON.parse(fs.readFileSync(
  path.join(__dirname, 'pearson-critical-values-table.json'), 'utf8'));

const relerr = (g, e) => {
  if (!isFinite(e)) return (g === e) ? 0 : Infinity;
  if (isNaN(e)) return isNaN(g) ? 0 : Infinity;
  const d = Math.abs(g - e);
  return d / Math.max(1, Math.abs(e));   // relative, floored at 1 near zero
};

// Pearson r from raw vectors: used only to confirm the r values fed to pvR are
// the same r that cor.test() reported (provenance check on the truth data).
function pearson(x, y) {
  const n = x.length;
  const mx = x.reduce((a, b) => a + b, 0) / n;
  const my = y.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mx, dy = y[i] - my;
    sxy += dx * dy; sxx += dx * dx; syy += dy * dy;
  }
  return sxy / Math.sqrt(sxx * syy);
}

function evalCase(c) {
  const a = c.a;
  switch (c.fn) {
    case 'critR':      return P.critR(a.alpha, a.n, a.tail);
    case 'pvR':        return P.pvR(a.r, a.n, a.tail);
    case 'rToT':       return P.rToT(a.r, a.n);
    case 'minN':       return P.minNForR(a.r, a.alpha, a.tail);
    // cor.test oracle: feed the r cor.test reported, demand its p / t back.
    case 'cortest_p':  return P.pvR(a.r, a.n, a.tail);
    case 'cortest_t':  return P.rToT(a.r, a.n);
    case 'cortest_r':  return pearson(a.x, a.y);
    default: throw new Error('unknown fn ' + c.fn);
  }
}

let maxRel = 0, worst = null, fails = 0, n = 0;
const byFnMax = {};
for (const c of cases) {
  const got = evalCase(c);
  const r = relerr(got, c.v);
  n++;
  byFnMax[c.fn] = Math.max(byFnMax[c.fn] || 0, r);
  if (r > maxRel) { maxRel = r; worst = { c, got }; }
  if (r > 1e-6) {
    fails++;
    if (fails <= 30)
      console.log(`FAIL ${c.fn}(${JSON.stringify(c.a).slice(0, 90)}) got=${got} exp=${c.v} rel=${r.toExponential(3)}`);
  }
}

console.log('\nmax relative error by fn:');
for (const k of Object.keys(byFnMax).sort())
  console.log('  ' + k.padEnd(12) + byFnMax[k].toExponential(3));
console.log(`\ncases: ${n}   fails: ${fails}   max rel: ${maxRel.toExponential(3)}`);
if (worst) console.log(`worst: ${worst.c.fn}(${JSON.stringify(worst.c.a).slice(0, 90)}) got=${worst.got} exp=${worst.c.v}`);

// ---- structural checks the truth table cannot express -------------------
let extra = 0;
const fail = (m) => { console.log('FAIL ' + m); extra++; };

// 1. The dual column header must be literally true: the two-tailed alpha and
//    its one-tailed half MUST resolve to the same critical r, or the printed
//    table's shared column is a lie.
for (const df of P.DF_ROWS) {
  for (const pair of P.ALPHA_PAIRS) {
    const two = P.critRfromDf(pair.two, df, 'two');
    const one = P.critRfromDf(pair.one, df, 'right');
    if (Math.abs(two - one) > 1e-12)
      fail(`dual header df=${df}: two(${pair.two})=${two} != one(${pair.one})=${one}`);
  }
}
// 2. Critical r must fall as df grows, and rise as alpha tightens.
for (const pair of P.ALPHA_PAIRS) {
  for (let i = 1; i < P.DF_ROWS.length; i++) {
    const a = P.critRfromDf(pair.two, P.DF_ROWS[i - 1], 'two');
    const b = P.critRfromDf(pair.two, P.DF_ROWS[i], 'two');
    if (!(b < a)) fail(`monotone df: alpha=${pair.two} df=${P.DF_ROWS[i]} ${b} !< ${a}`);
  }
}
for (const df of P.DF_ROWS) {
  for (let i = 1; i < P.ALPHA_PAIRS.length; i++) {
    const loose = P.critRfromDf(P.ALPHA_PAIRS[i - 1].two, df, 'two');
    const tight = P.critRfromDf(P.ALPHA_PAIRS[i].two, df, 'two');
    if (!(tight > loose)) fail(`monotone alpha: df=${df} ${tight} !> ${loose}`);
  }
}
// 3. Every printed cell must sit strictly inside (0, 1).
for (const df of P.DF_ROWS)
  for (const pair of P.ALPHA_PAIRS) {
    const v = P.critRfromDf(pair.two, df, 'two');
    if (!(v > 0 && v < 1)) fail(`range df=${df} alpha=${pair.two}: ${v}`);
  }
// 4. verdict() must agree with the p-value it reports: |r| > r_crit  <=>  p < alpha.
for (const df of [1, 5, 10, 28, 50, 98]) {
  const nn = df + 2;
  for (const r of [-0.99, -0.5, -0.2, 0, 0.2, 0.35, 0.5, 0.8, 0.99]) {
    for (const alpha of [0.10, 0.05, 0.02, 0.01]) {
      for (const tail of ['two', 'right', 'left']) {
        const v = P.verdict(r, nn, alpha, tail);
        if (v.significant !== (v.p < alpha))
          fail(`verdict/p disagree r=${r} n=${nn} alpha=${alpha} ${tail}: sig=${v.significant} p=${v.p}`);
      }
    }
  }
}
// 5. minNForR must be the true boundary: significant at n, NOT at n-1.
for (const r of [0.9, 0.6, 0.4, 0.25, 0.1, -0.35]) {
  for (const alpha of [0.05, 0.01]) {
    const m = P.minNForR(r, alpha, 'two');
    if (m === null) continue;
    if (!(Math.abs(r) > P.critR(alpha, m, 'two')))
      fail(`minN r=${r} alpha=${alpha}: n=${m} not significant`);
    if (m > 3 && Math.abs(r) > P.critR(alpha, m - 1, 'two'))
      fail(`minN r=${r} alpha=${alpha}: n=${m - 1} already significant`);
  }
}
// 6. r = 0 is never significant; r = +-1 always is (p = 0 exactly).
for (const nn of [3, 10, 100]) {
  if (P.pvR(0, nn, 'two') !== 1) fail(`r=0 n=${nn}: p=${P.pvR(0, nn, 'two')} != 1`);
  if (P.pvR(1, nn, 'two') !== 0) fail(`r=1 n=${nn}: p=${P.pvR(1, nn, 'two')} != 0`);
}

console.log(`structural checks: ${extra ? extra + ' FAILED' : 'all passed'}`);
if (fails || extra) { console.log('\nGATE: FAIL'); process.exit(1); }
console.log('\nGATE: PASS');
