/* Verify tools/lib/bayes-factor-math.js against the BayesFactor truth table.
   Gate: every BF10 within 1e-6 relative of BayesFactor 0.9.12-4.8. */
const fs = require('fs');
const path = require('path');
const BF = require('../../tools/lib/bayes-factor-math.js');
const truth = JSON.parse(fs.readFileSync(path.join(__dirname, 'bayes-factor-calculator.json'), 'utf8'));

function jsBF(c) {
  const p = c.params;
  switch (c.mode) {
    case 'twoT': {
      const neff = (p.n1 * p.n2) / (p.n1 + p.n2), nu = p.n1 + p.n2 - 2;
      return BF.bfT(p.t, neff, nu, p.rscale);
    }
    case 'oneT':
      return BF.bfT(p.t, p.n, p.n - 1, p.rscale);
    case 'regression':
      return BF.bfLM(p.N, p.p, p.R2, p.rscale);
    case 'anova':
      return BF.bfAnova(p.F, p.df1, p.df2, p.N, p.rscale);
    case 'cor':
      return BF.bfCor(p.n, p.r, p.rscale);
    case 'prop':
      return BF.bfProp(p.x1, p.n1, p.x2, p.n2, p.a);
    default: return NaN;
  }
}

const TOL = 1e-6;
let pass = 0, fail = 0, worst = 0, worstLabel = '';
const fails = [];
for (const c of truth.cases) {
  const got = jsBF(c);
  const exp = (c.bf10 === 'Inf') ? Infinity : (c.bf10 === '-Inf' ? -Infinity : c.bf10);
  let rel;
  if (!isFinite(exp)) rel = (got === exp) ? 0 : Infinity;
  else if (exp === 0) rel = Math.abs(got);
  else rel = Math.abs(got - exp) / Math.abs(exp);
  if (rel > worst) { worst = rel; worstLabel = c.mode + ' / ' + c.label; }
  if (rel <= TOL) pass++;
  else { fail++; fails.push({ m: c.mode, l: c.label, exp, got, rel }); }
}

console.log(`\nBayes-factor math vs BayesFactor 0.9.12-4.8`);
console.log(`  passed ${pass}/${truth.cases.length}  (tol ${TOL})`);
console.log(`  worst relative error: ${worst.toExponential(3)}  [${worstLabel}]`);
if (fails.length) {
  console.log('\nFAILURES:');
  for (const f of fails)
    console.log(`  ${f.m} | ${f.l}\n     expected ${f.exp}\n     got      ${f.got}\n     rel      ${f.rel.toExponential(3)}`);
  process.exit(1);
}
console.log('\nALL PASS\n');
