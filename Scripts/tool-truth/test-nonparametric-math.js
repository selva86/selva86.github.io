/* Validate nonparametric-math.js vs the R truth table.
   Gate: statistic/p-value/effect size/HL estimate <= 1e-6 rel; exact-path CI
   <= 1e-6; asymptotic-path CI (R uniroot, tol 1e-4) <= 2e-4 abs. */
const path = require('path');
const M = require(path.join(__dirname, '..', '..', 'tools', 'lib', 'nonparametric-math.js'));
const truth = require(path.join(__dirname, 'nonparametric.json'));

const num = v => v === 'Inf' ? Infinity : v === '-Inf' ? -Infinity : (v == null ? NaN : v);
let fails = 0, checks = 0, worst = 0, worstMsg = '';
function chk(id, name, got, exp, tol, abs) {
  checks++;
  const e = num(exp), g = got;
  if (!isFinite(e) || !isFinite(g)) {           // Inf bounds: match sign/inf-ness
    if (e === g) return;
    fails++; console.log(`FAIL ${id} ${name}: got ${g} exp ${e}`); return;
  }
  const d = abs ? Math.abs(g - e) : Math.abs(g - e) / (Math.abs(e) > 1e-9 ? Math.abs(e) : 1);
  if (d > worst) { worst = d; worstMsg = `${id} ${name} (${abs ? 'abs' : 'rel'} ${d.toExponential(2)})`; }
  if (d > tol) { fails++; console.log(`FAIL ${id} ${name}: got ${g} exp ${e} (${abs ? 'abs' : 'rel'} diff ${d.toExponential(3)} > ${tol})`); }
}

for (const c of truth.cases) {
  const opt = { alt: c.alt, alpha: c.alpha, correct: c.correct, mu: c.mu };
  if (c.mode === 'mwu') {
    const r = M.mannWhitney(c.x, c.y, opt);
    chk(c.id, 'W', r.statistic, c.statistic, 1e-9, true);
    chk(c.id, 'p', r.p, c.p_value, 1e-6);
    chk(c.id, 'rb', r.rb, c.rb, 1e-6);
    chk(c.id, 'hl', r.hl, c.hl, c.exact ? 1e-9 : 2e-4, true);
    chk(c.id, 'ciLo', r.ciLo, c.ci_lo, c.exact ? 1e-9 : 2e-4, true);
    chk(c.id, 'ciHi', r.ciHi, c.ci_hi, c.exact ? 1e-9 : 2e-4, true);
    if (r.exact !== c.exact) { fails++; console.log(`FAIL ${c.id} exact flag ${r.exact} vs ${c.exact}`); }
  } else if (c.mode === 'signed') {
    const r = M.signedRank(c.x, c.y || null, opt);
    chk(c.id, 'V', r.statistic, c.statistic, 1e-9, true);
    chk(c.id, 'p', r.p, c.p_value, 1e-6);
    chk(c.id, 'rb', r.rb, c.rb, 1e-6);
    chk(c.id, 'hl', r.hl, c.hl, c.exact ? 1e-9 : 2e-4, true);
    chk(c.id, 'ciLo', r.ciLo, c.ci_lo, c.exact ? 1e-9 : 2e-4, true);
    chk(c.id, 'ciHi', r.ciHi, c.ci_hi, c.exact ? 1e-9 : 2e-4, true);
    if (r.exact !== c.exact) { fails++; console.log(`FAIL ${c.id} exact flag ${r.exact} vs ${c.exact}`); }
  } else if (c.mode === 'kw') {
    const r = M.kruskal(c.groups);
    chk(c.id, 'H', r.statistic, c.statistic, 1e-6);
    chk(c.id, 'p', r.p, c.p_value, 1e-6);
    chk(c.id, 'eps2', r.eps2, c.eps2, 1e-6);
    chk(c.id, 'eta2', r.eta2, c.eta2, 1e-6);
  } else if (c.mode === 'sign') {
    const r = M.signTest(c.x, c.y || null, opt);
    chk(c.id, 'S+', r.statistic, c.statistic, 1e-9, true);
    chk(c.id, 'p', r.p, c.p_value, 1e-6);
    chk(c.id, 'prop', r.prop, c.prop, 1e-9);
    chk(c.id, 'ciLo', r.ciLo, c.ci_lo, 1e-6, true);
    chk(c.id, 'ciHi', r.ciHi, c.ci_hi, 1e-6, true);
  }
}

console.log(`\n${checks} checks, ${fails} failures. worst: ${worstMsg}`);
process.exit(fails ? 1 : 0);
