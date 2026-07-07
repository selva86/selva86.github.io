const M = require('../../tools/lib/normal-math.js');
const truth = JSON.parse(require('fs').readFileSync(__dirname + '/z-score.json', 'utf8'));
let pass = 0, fail = 0;
const m = 100, s = 15;
for (const c of truth) {
  let got;
  if (c.fn === 'pnorm') got = c.id === 'iq130_pct' ? M.pnorm(c.x) : M.pnorm(c.x);
  else if (c.fn === 'qnorm') got = M.qnorm(c.x);
  else if (c.fn === 'z') got = c.x;
  else if (c.fn === 'between') got = M.between(85, 115, m, s);
  else if (c.fn === 'twotail') got = M.twoTail(c.x);
  const rel = Math.abs(got - c.out) / Math.max(1e-300, Math.abs(c.out));
  if (rel > 1e-9) { fail++; console.log(`FAIL ${c.id}: got ${got} want ${c.out} (rel ${rel.toExponential(2)})`); }
  else pass++;
}
console.log(`${pass} PASS / ${fail} FAIL of ${truth.length} (tolerance 1e-9)`);
process.exit(fail ? 1 : 0);
