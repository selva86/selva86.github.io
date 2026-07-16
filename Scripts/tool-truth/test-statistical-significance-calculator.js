/* Node harness: assert significance-math.js against the R truth table.
   Gate: every checked value within 1e-6 relative (aim << that). */
const fs = require('fs');
const path = require('path');
const S = require('../../tools/lib/significance-math.js');

const truth = JSON.parse(fs.readFileSync(
  path.join(__dirname, 'statistical-significance-calculator.json'), 'utf8'));

const TOL = 1e-6;
let checks = 0, fails = 0, worst = 0, worstMsg = '';

function altOf(s) { return s === 'two.sided' ? 'two' : s; }

function cmp(label, got, exp) {
  if (exp === undefined || exp === null) return;
  // R serialises non-finite bounds as the strings "Inf" / "-Inf".
  if (exp === 'Inf') exp = Infinity;
  else if (exp === '-Inf') exp = -Infinity;
  checks++;
  // Infinite CI bounds (one-sided t) compare exactly.
  if (!isFinite(exp)) {
    const ok = (got === exp) || (got === Infinity && exp > 1e300) || (got === -Infinity && exp < -1e300);
    if (!ok) { fails++; console.log(`FAIL ${label}: got ${got} exp ${exp}`); }
    return;
  }
  const err = Math.abs(got - exp) / Math.max(1, Math.abs(exp));
  if (err > worst) { worst = err; worstMsg = `${label}: got ${got} exp ${exp} (rel ${err.toExponential(2)})`; }
  if (err > TOL || Number.isNaN(got)) {
    fails++;
    console.log(`FAIL ${label}: got ${got} exp ${exp} (rel ${err.toExponential(3)})`);
  }
}

for (const c of truth) {
  if (c.mode === 'conv') {
    const two = S.convRate(c.cA, c.nA, c.cB, c.nB, { alpha: c.alpha, tail: 'two' });
    const grt = S.convRate(c.cA, c.nA, c.cB, c.nB, { alpha: c.alpha, tail: 'greater' });
    const tag = `conv(${c.cA}/${c.nA} vs ${c.cB}/${c.nB} a=${c.alpha})`;
    cmp(`${tag} pa`, two.pa, c.pa);
    cmp(`${tag} pb`, two.pb, c.pb);
    cmp(`${tag} diff`, two.absLift, c.diff);
    cmp(`${tag} z`, two.z, c.z);
    cmp(`${tag} p_two`, two.p, c.p_two);
    cmp(`${tag} p_greater`, grt.p, c.p_greater);
    cmp(`${tag} ci_lo`, two.ciLo, c.ci_lo);
    cmp(`${tag} ci_hi`, two.ciHi, c.ci_hi);
  } else if (c.mode === 'means') {
    const r = S.twoMeans(c.m1, c.s1, c.n1, c.m2, c.s2, c.n2, { alt: altOf(c.alt), conf: c.conf });
    const tag = `means(${c.m1}/${c.s1}/${c.n1} vs ${c.m2}/${c.s2}/${c.n2} ${c.alt} ${c.conf})`;
    cmp(`${tag} t`, r.t, c.t);
    cmp(`${tag} df`, r.df, c.df);
    cmp(`${tag} p`, r.p, c.p);
    cmp(`${tag} ci_lo`, r.ciLo, c.ci_lo);
    cmp(`${tag} ci_hi`, r.ciHi, c.ci_hi);
    cmp(`${tag} diff`, r.diff, c.diff);
  } else if (c.mode === 'onep') {
    const r = S.oneProp(c.x, c.n, c.p0, { alt: altOf(c.alt), conf: c.conf });
    const tag = `onep(${c.x}/${c.n} vs ${c.p0} ${c.alt} ${c.conf})`;
    cmp(`${tag} phat`, r.phat, c.phat);
    cmp(`${tag} z`, r.z, c.z);
    cmp(`${tag} p`, r.p, c.p);
    // The tool always DISPLAYS the two-sided Wilson interval as a supporting
    // stat; R returns a one-sided Wilson bound for one-sided alts, so only the
    // two-sided cases are directly comparable (same choice as proportion-test).
    if (c.alt === 'two.sided') {
      cmp(`${tag} ci_lo`, r.ciLo, c.ci_lo);
      cmp(`${tag} ci_hi`, r.ciHi, c.ci_hi);
    }
  }
}

console.log(`\n${checks} checks, ${fails} fail. worst rel = ${worst.toExponential(2)} [${worstMsg}]`);
process.exit(fails ? 1 : 0);
