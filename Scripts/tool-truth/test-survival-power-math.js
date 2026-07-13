/* Gate survival-math.js against the R truth table (survival-power.json).
   Every case must match to <= 1e-6 relative (aim 1e-7+).
   Run: node test-survival-power-math.js  */
'use strict';
const fs = require('fs');
const path = require('path');
const SM = require('../../tools/lib/survival-math.js');

const cases = JSON.parse(fs.readFileSync(path.join(__dirname, 'survival-power.json'), 'utf8'));

// dispatch each truth record to the matching SurvivalMath call
function callFn(fn, a) {
  switch (fn) {
    case 'schoenfeldEvents':        return SM.schoenfeldEvents(a.HR, a.alpha, a.power, a.k, a.sided);
    case 'freedmanEvents':          return SM.freedmanEvents(a.HR, a.alpha, a.power, a.k, a.sided);
    case 'powerFromEvents':         return SM.powerFromEvents(a.D, a.HR, a.alpha, a.k, a.sided);
    case 'powerFromEventsFreedman': return SM.powerFromEventsFreedman(a.D, a.HR, a.alpha, a.k, a.sided);
    case 'dropoutMonthlyHazard':    return SM.dropoutMonthlyHazard(a.annual);
    case 'medianToHazard':          return SM.medianToHazard(a.median);
    case 'pEventExp':               return SM.pEventExp(a.lambda, a.A, a.F);
    case 'pEventWithDropout':       return SM.pEventWithDropout(a.lambda, a.mu, a.A, a.F);
    case 'plan':                    return SM.plan({
      HR: a.HR, alpha: a.alpha, power: a.power, k: a.k, medianC: a.medianC,
      accrual: a.A, followup: a.F, dropoutAnnual: a.dropoutAnnual,
      method: a.method, sided: a.sided
    });
    default: throw new Error('unknown fn ' + fn);
  }
}

const relerr = (g, e) => {
  if (!isFinite(e)) return isFinite(g) ? Infinity : 0;
  const d = Math.abs(g - e);
  return d / Math.max(1, Math.abs(e));
};

let maxRel = 0, fails = 0, n = 0;
const PLAN_KEYS = ['lamC', 'lamT', 'mu', 'pEC', 'pET', 'pEbar', 'D', 'nTotal', 'n1', 'n2'];

for (const c of cases) {
  const got = callFn(c.fn, c.args);
  if (c.fn === 'plan') {
    for (const key of PLAN_KEYS) {
      n++;
      const r = relerr(got[key], c.expect[key]);
      maxRel = Math.max(maxRel, r);
      if (r > 1e-6) {
        fails++;
        console.error(`FAIL plan.${key} ${c.note}: got ${got[key]} expected ${c.expect[key]} rel ${r.toExponential(2)}`);
      }
    }
  } else {
    n++;
    const r = relerr(got, c.expect);
    maxRel = Math.max(maxRel, r);
    if (r > 1e-6) {
      fails++;
      console.error(`FAIL ${c.fn} ${JSON.stringify(c.args)} ${c.note}: got ${got} expected ${c.expect} rel ${r.toExponential(2)}`);
    }
  }
}

console.log(`checked ${n} assertions across ${cases.length} cases`);
console.log(`max relative error: ${maxRel.toExponential(3)}`);
if (fails) {
  console.error(`\n${fails} FAILED (> 1e-6)`);
  process.exit(1);
}
console.log('ALL PASS (<= 1e-6)');
