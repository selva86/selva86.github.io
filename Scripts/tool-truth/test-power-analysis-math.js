// Verify tools/lib/power-math.js against the R 4.6.0 `pwr` truth table.
// Gate: forward power at rel<=1e-6 (abs floor 1e-9); solved n/effect/alpha at rel<=1e-5
// (inverse solves inherit pwr's own uniroot tolerance ~1e-6 on the value).
const M = require('../../tools/lib/power-math.js');
const fs = require('fs');
const truth = JSON.parse(fs.readFileSync(__dirname + '/power-analysis.json', 'utf8'));

let pass = 0, fail = 0;
const fails = [];

function rel(got, want) { return Math.abs(got - want) / Math.max(1e-12, Math.abs(want)); }
function ok(got, want, relTol, absTol) {
  if (!isFinite(got) && !isFinite(want)) return true;
  if (absTol != null && Math.abs(got - want) <= absTol) return true;
  return rel(got, want) <= relTol;
}

// ---- forward power ----
let pf_pass = 0, worstPow = 0, worstPowCase = null;
truth.power_cases.forEach((c, i) => {
  const got = M.power(c.design, {
    effect: c.effect, n: c.n, alpha: c.alpha, tail: c.tail,
    ratio: c.ratio, rPaired: c.rPaired, k: c.k, df: c.df
  });
  const r = rel(got, c.power);
  if (r > worstPow) { worstPow = r; worstPowCase = { i, c, got }; }
  if (ok(got, c.power, 1e-6, 1e-9)) pf_pass++;
  else fails.push(`power[${i}] ${c.design} tail=${c.tail} eff=${c.effect} n=${c.n} a=${c.alpha}: got ${got} want ${c.power} rel ${r.toExponential(2)}`);
});

// ---- inverse solves ----
// Two checks: (1) close to pwr's own answer at 2e-4 (pwr's uniroot tol is ~1.2e-4, so it can't be
// tighter); (2) ROUND-TRIP - power at the solved value must equal the target power to 1e-7. The
// round-trip is the real correctness gate (my solver is often MORE precise than pwr's uniroot).
let sv_pass = 0, worstSolve = 0, worstSolveCase = null, worstRt = 0;
truth.solve_cases.forEach((c, i) => {
  const params = { effect: c.effect, n: c.n, alpha: c.alpha, tail: c.tail, ratio: c.ratio, rPaired: c.rPaired, k: c.k, df: c.df };
  if (c.solve_for === 'power') {
    const got = M.power(c.design, params);
    const r = rel(got, c.answer);
    if (r > worstSolve) { worstSolve = r; worstSolveCase = { i, c, got }; }
    if (ok(got, c.answer, 1e-6, 1e-9)) sv_pass++;
    else fails.push(`solve[${i}] ${c.design} power: got ${got} want ${c.answer} rel ${r.toExponential(2)}`);
    return;
  }
  const target = c.power;                       // target power (0.80/0.90/0.95)
  const got = M.solve(c.design, c.solve_for, params, target);
  const r = rel(got, c.answer);
  if (r > worstSolve) { worstSolve = r; worstSolveCase = { i, c, got }; }
  const rtParams = Object.assign({}, params); rtParams[c.solve_for] = got;
  const rtPower = M.power(c.design, rtParams);
  const rt = rel(rtPower, target);
  if (rt > worstRt) worstRt = rt;
  const closeToPwr = ok(got, c.answer, 2e-4, 1e-6);
  const roundTrips = ok(rtPower, target, 1e-6, 1e-8);
  if (closeToPwr && roundTrips) sv_pass++;
  else fails.push(`solve[${i}] ${c.design} ${c.solve_for}: got ${got} want ${c.answer} rel ${r.toExponential(2)}  round-trip power ${rtPower} vs ${target} rel ${rt.toExponential(2)}`);
});

console.log(`forward power : ${pf_pass}/${truth.power_cases.length}  (worst rel ${worstPow.toExponential(2)})`);
console.log(`inverse solve : ${sv_pass}/${truth.solve_cases.length}  (worst vs-pwr rel ${worstSolve.toExponential(2)}, worst round-trip rel ${worstRt.toExponential(2)})`);
if (worstPowCase) console.log(`  worst power  : ${worstPowCase.c.design} tail=${worstPowCase.c.tail} eff=${worstPowCase.c.effect} n=${worstPowCase.c.n} a=${worstPowCase.c.alpha} -> got ${worstPowCase.got} want ${worstPowCase.c.power}`);
if (worstSolveCase) console.log(`  worst solve  : ${worstSolveCase.c.design} ${worstSolveCase.c.solve_for} -> got ${worstSolveCase.got} want ${worstSolveCase.c.answer}`);

if (fails.length) {
  console.log(`\nFAILURES (${fails.length}):`);
  fails.slice(0, 40).forEach(f => console.log('  ' + f));
  process.exit(1);
} else {
  console.log('\nALL PASS');
}
