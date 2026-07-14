// Harness: tools/lib/type-i-ii-math.js (via power-math.js) vs R pwr truth table.
// Gate: every displayed number (power, beta, crit, ncp) within 1e-6 relative.
'use strict';
const fs = require('fs');
const path = require('path');
const T2 = require('../../tools/lib/type-i-ii-math.js');

const truth = JSON.parse(fs.readFileSync(path.join(__dirname, 'type-i-ii-error-visualizer.json'), 'utf8'));

const TOL = 1e-6;
function rel(a, b) {
  if (!isFinite(a) || !isFinite(b)) return (a === b) ? 0 : Infinity;
  const d = Math.abs(a - b), s = Math.max(Math.abs(a), Math.abs(b));
  return s < 1e-12 ? d : d / s;
}

let pass = 0, fail = 0;
const fails = [];
for (const c of truth) {
  const s = { effect: c.effect, n: c.n, alpha: c.alpha, tail: c.tail, k: c.k,
              p0: c.p0, p1: c.p1, p2: c.p2 };
  const o = T2.compute(c.design, s);
  // crit for correlation is compared against o.critR (the critical correlation r*)
  const gotCrit = (c.design === 'correlation') ? o.critR : o.crit;
  const checks = [
    ['power', o.power, c.power],
    ['beta',  o.beta,  1 - c.power],
    ['crit',  gotCrit, c.crit],
    ['ncp',   o.ncp,   c.ncp],
  ];
  let bad = null;
  for (const [name, got, exp] of checks) {
    if (exp == null) continue;
    if (rel(got, exp) > TOL) { bad = { name, got, exp, r: rel(got, exp) }; break; }
  }
  if (bad) {
    fail++;
    fails.push(`${c.design} eff=${c.effect} n=${c.n} a=${c.alpha} t=${c.tail}` +
               (c.p0 != null ? ` p0=${c.p0} p1=${c.p1}` : '') +
               (c.p2 != null ? ` p1=${c.p1} p2=${c.p2}` : '') +
               (c.k != null ? ` k=${c.k}` : '') +
               `  -> ${bad.name}: got ${bad.got} exp ${bad.exp} (rel ${bad.r.toExponential(2)})`);
  } else pass++;
}

console.log(`type-i-ii-math vs R pwr: ${pass}/${truth.length} passed at rel<=${TOL}`);
if (fail) { console.log('FAILURES:'); fails.forEach(f => console.log('  ' + f)); process.exit(1); }
console.log('ALL GREEN');
