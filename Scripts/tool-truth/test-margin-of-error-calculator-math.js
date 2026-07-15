// Gate: margin-math.js vs the R truth table. All cases must agree to <=1e-9 rel.
const fs = require('fs');
const path = require('path');
const M = require('../../tools/lib/margin-math.js');

const truth = JSON.parse(fs.readFileSync(
  path.join(__dirname, 'margin-of-error-calculator.json'), 'utf8'));

const TOL = 1e-9;
let fail = 0, checked = 0, maxrel = 0;

function close(got, exp, label) {
  if (exp === null || exp === undefined) return;
  if (typeof exp === 'string') return; // mode label etc.
  checked++;
  const denom = Math.max(1, Math.abs(exp));
  const rel = Math.abs(got - exp) / denom;
  if (rel > maxrel) maxrel = rel;
  if (!(rel <= TOL) && !(Number.isNaN(got) && Number.isNaN(exp))) {
    fail++;
    console.log(`FAIL ${label}: got ${got} expected ${exp} (rel ${rel.toExponential(3)})`);
  }
}

truth.forEach((c, i) => {
  const Npop = (c.N === null || c.N === undefined) ? null : c.N;
  const tag = `#${i} ${c.mode}`;
  if (c.mode === 'prop') {
    const r = M.propMOE(c.p, c.n, c.conf, Npop);
    close(r.moe, c.moe, `${tag} moe`);
    close(r.z, c.z, `${tag} z`);
    close(r.se, c.se, `${tag} se`);
    close(r.fpc, c.fpc, `${tag} fpc`);
    close(r.lo, c.lo, `${tag} lo`);
    close(r.hi, c.hi, `${tag} hi`);
  } else if (c.mode === 'size') {
    const r = M.sampleSizeProp(c.moe, c.p, c.conf, Npop);
    close(r.n, c.n, `${tag} n`);
    close(r.n0, c.n0, `${tag} n0`);
    close(r.z, c.z, `${tag} z`);
  } else if (c.mode === 'mean' || c.mode === 'mean_ttest') {
    const r = M.meanMOE(c.s, c.n, c.conf, c.method, Npop);
    close(r.moe, c.moe, `${tag} moe`);
    close(r.crit, c.crit, `${tag} crit`);
    close(r.se, c.se, `${tag} se`);
    close(r.fpc, c.fpc, `${tag} fpc`);
  }
});

console.log(`\n${checked} values checked, ${fail} failures, max rel err ${maxrel.toExponential(3)}`);
process.exit(fail ? 1 : 0);
