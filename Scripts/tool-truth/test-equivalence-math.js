/* Node harness: equivalence-math.js vs the R truth table.
   Run: node Scripts/tool-truth/test-equivalence-math.js
   Gate: every numeric field <= 1e-6 relative (aim 1e-7+); verdict strings exact. */
const fs = require('fs');
const path = require('path');
const EM = require('../../tools/lib/equivalence-math.js');

const truth = JSON.parse(fs.readFileSync(path.join(__dirname, 'equivalence.json'), 'utf8'));
const TOL = 1e-6;
let fails = 0, checks = 0, worst = 0, worstWhere = '';

function rel(a, b) {
  if (a === b) return 0;
  if (!isFinite(a) || !isFinite(b)) return Infinity;
  return Math.abs(a - b) / Math.max(1, Math.abs(a));
}
function cmp(id, field, got, exp) {
  if (exp === null || exp === undefined) return;
  checks++;
  const r = rel(exp, got);
  if (r > worst) { worst = r; worstWhere = `${id}.${field}`; }
  if (r > TOL || Number.isNaN(got)) {
    console.log(`FAIL ${id}.${field}: got=${got} exp=${exp} rel=${r.toExponential(2)}`);
    fails++;
  }
}
function cmpStr(id, field, got, exp) {
  checks++;
  if (got !== exp) { console.log(`FAIL ${id}.${field}: got="${got}" exp="${exp}"`); fails++; }
}
function cmpInf(id, field, gotInf, gotVal, expInf, expVal) {
  cmpStr(id, field + 'Inf', gotInf, expInf);
  if (!expInf) cmp(id, field, gotVal, expVal);
}

for (const c of truth) {
  const o = c.out, i = c.inp;
  if (c.kind === 'analyze_cont') {
    const r = EM.analyzeCont({ m1: i.m1, m2: i.m2, sd1: i.sd1, sd2: i.sd2, n1: i.n1, n2: i.n2,
      type: c.type, low: i.low, high: i.high, alpha: i.alpha, varEqual: c.var_equal });
    ['diff', 'se', 'df', 'sp', 'd', 't1', 'p1', 't2', 'p2'].forEach(f => cmp(c.id, f, r[f], o[f]));
    cmpInf(c.id, 'ciLo', r.ciLoInf, r.ciLo, o.ciLoInf, o.ciLo);
    cmpInf(c.id, 'ciHi', r.ciHiInf, r.ciHi, o.ciHiInf, o.ciHi);
    cmpStr(c.id, 'verdict', r.verdict, o.verdict);
  } else if (c.kind === 'analyze_prop') {
    const r = EM.analyzeProp({ x1: i.x1, n1: i.n1, x2: i.x2, n2: i.n2,
      type: c.type, low: i.low, high: i.high, alpha: i.alpha });
    ['p1', 'p2', 'diff', 'se', 'z1', 'pz1', 'z2', 'pz2'].forEach(f => cmp(c.id, f, r[f], o[f]));
    cmpInf(c.id, 'ciLo', r.ciLoInf, r.ciLo, o.ciLoInf, o.ciLo);
    cmpInf(c.id, 'ciHi', r.ciHiInf, r.ciHi, o.ciHiInf, o.ciHi);
    cmpStr(c.id, 'verdict', r.verdict, o.verdict);
  } else if (c.kind === 'plan_cont') {
    const r = EM.planCont({ type: c.type, low: i.low, high: i.high, mu: i.mu, alpha: i.alpha, power: i.power });
    ['nraw', 'n', 'ntotal'].forEach(f => cmp(c.id, f, r[f], o[f]));
  } else if (c.kind === 'plan_prop') {
    const r = EM.planProp({ type: c.type, p1: i.p1, p2: i.p2, low: i.low, high: i.high, alpha: i.alpha, power: i.power });
    ['nraw', 'n', 'ntotal'].forEach(f => cmp(c.id, f, r[f], o[f]));
  }
}

console.log(`\n${truth.length} cases, ${checks} field checks, ${fails} fails.`);
console.log(`worst relative error: ${worst.toExponential(3)} at ${worstWhere}`);
if (fails > 0) { console.log('GATE: FAIL'); process.exit(1); }
console.log('GATE: PASS (all fields <= 1e-6 relative, verdicts exact)');
