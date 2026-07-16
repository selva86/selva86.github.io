/* Node harness: KappaMath vs psych::cohen.kappa truth table.
   Gate: every displayed quantity within 1e-7 relative (abs floor 1e-9). */
const fs = require('fs');
const path = require('path');
const K = require(path.join(__dirname, '..', '..', 'tools', 'lib', 'kappa-math.js'));

const truth = JSON.parse(fs.readFileSync(path.join(__dirname, 'cohens-kappa-calculator.json'), 'utf8'));

let pass = 0, fail = 0;
const fails = [];

function close(got, exp, rtol = 1e-7, atol = 1e-9) {
  if (!isFinite(got) && !isFinite(exp)) return true;
  const d = Math.abs(got - exp);
  return d <= atol || d <= rtol * Math.abs(exp);
}
function check(name, field, got, exp) {
  if (close(got, exp)) { pass++; }
  else { fail++; fails.push(`${name} :: ${field}  got=${got}  exp=${exp}  d=${Math.abs(got - exp)}`); }
}

truth.forEach(function (c) {
  const m = c.matrix.map(r => r.slice());
  const r = K.analyze(m, { alpha: c.alpha });
  if (!r.ok) { fail++; fails.push(`${c.name} :: analyze not ok: ${r.error}`); return; }

  check(c.name, 'N', r.N, c.N);
  check(c.name, 'po', r.po, c.po);
  check(c.name, 'pc', r.pc, c.pc);
  check(c.name, 'kappa', r.kappa, c.kappa);
  check(c.name, 'se_kappa', r.se_kappa, c.se_kappa);
  check(c.name, 'ci_kappa_lo', r.ci_lower, c.ci_kappa[0]);
  check(c.name, 'ci_kappa_hi', r.ci_upper, c.ci_kappa[1]);

  check(c.name, 'wpo_linear', r.linear.wpo, c.wpo_linear);
  check(c.name, 'wpc_linear', r.linear.wpc, c.wpc_linear);
  check(c.name, 'kappa_linear', r.linear.kappa, c.kappa_linear);
  check(c.name, 'se_linear', r.linear.se, c.se_linear);
  check(c.name, 'ci_linear_lo', r.linear.ci_lower, c.ci_linear[0]);
  check(c.name, 'ci_linear_hi', r.linear.ci_upper, c.ci_linear[1]);

  check(c.name, 'wpo_quad', r.quadratic.wpo, c.wpo_quad);
  check(c.name, 'wpc_quad', r.quadratic.wpc, c.wpc_quad);
  check(c.name, 'kappa_quad', r.quadratic.kappa, c.kappa_quad);
  check(c.name, 'se_quad', r.quadratic.se, c.se_quad);
  check(c.name, 'ci_quad_lo', r.quadratic.ci_lower, c.ci_quad[0]);
  check(c.name, 'ci_quad_hi', r.quadratic.ci_upper, c.ci_quad[1]);

  // column-paste mode: rebuild the matrix from x1/x2 and confirm it matches
  if (c.mode === 'columns' && c.x1 && c.x2) {
    const t = K.tableFromColumns(c.x1, c.x2);
    const flatGot = t.matrix.flat();
    const flatExp = c.matrix.flat();
    let ok = flatGot.length === flatExp.length && flatGot.every((v, i) => v === flatExp[i]);
    if (ok) { pass++; } else { fail++; fails.push(`${c.name} :: tableFromColumns mismatch got=${JSON.stringify(t.matrix)} exp=${JSON.stringify(c.matrix)}`); }
  }
});

console.log(`\nKappaMath truth-table check: ${pass} passed, ${fail} failed (of ${pass + fail}).`);
if (fail) { console.log('\nFAILURES:'); fails.slice(0, 40).forEach(f => console.log('  ' + f)); process.exit(1); }
console.log('ALL GREEN');
