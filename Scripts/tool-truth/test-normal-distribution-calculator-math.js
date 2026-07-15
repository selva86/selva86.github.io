/* Gate: compose the normal-distribution-calculator's region + inverse math
   from tools/lib/normal-math.js and check every case against the R 4.6.0
   truth table. All primitives (pnorm/qnorm) are already R-verified; this
   proves the COMPOSED forward/inverse formulas the page uses are exact. */
'use strict';
const fs = require('fs');
const path = require('path');
const M = require('../../tools/lib/normal-math.js');

const truth = JSON.parse(fs.readFileSync(
  path.join(__dirname, 'normal-distribution-calculator.json'), 'utf8'));

// The exact formulas the page computes, per mode.
function compute(c) {
  const i = c.inp;
  switch (c.mode) {
    case 'below': {
      const z = (i.x - i.mean) / i.sd;
      // tail-accurate: pnorm(-z) keeps the upper tail exact past |z|=6
      return { z, p_below: M.pnorm(z), p_above: M.pnorm(-z) };
    }
    case 'above': {
      const z = (i.x - i.mean) / i.sd;
      return { z, p_below: M.pnorm(z), p_above: M.pnorm(-z) };
    }
    case 'between':
    case 'outside': {
      const za = (i.a - i.mean) / i.sd, zb = (i.b - i.mean) / i.sd;
      const pr = M.pnorm(zb) - M.pnorm(za);           // matches R pnorm(b)-pnorm(a)
      const outside = M.pnorm(za) + M.pnorm(-zb);      // tail-accurate 1 - pr
      return { z_a: za, z_b: zb, p_between: pr, p_outside: outside };
    }
    case 'inv_below': {
      const z = M.qnorm(i.p);
      return { x: i.mean + z * i.sd, z };
    }
    case 'inv_above': {
      const z = M.qnorm(1 - i.p);   // value with p in the RIGHT tail
      return { x: i.mean + z * i.sd, z };
    }
    case 'inv_central': {
      const z = M.qnorm((1 + i.p) / 2);
      return { lo: i.mean - z * i.sd, hi: i.mean + z * i.sd, z };
    }
    default:
      throw new Error('unknown mode ' + c.mode);
  }
}

const TOL = 1e-6;      // gate; we report the worst seen too
let worst = 0, worstId = '', fails = 0, n = 0;

for (const c of truth) {
  const got = compute(c);
  for (const k of Object.keys(c.out)) {
    n++;
    const exp = c.out[k], act = got[k];
    if (act === undefined) { console.log(`MISSING ${c.id}.${k}`); fails++; continue; }
    // relative error, with absolute fallback near zero
    const denom = Math.max(Math.abs(exp), 1e-300);
    const rel = Math.abs(exp) < 1e-12 ? Math.abs(act - exp) : Math.abs(act - exp) / denom;
    if (rel > worst) { worst = rel; worstId = `${c.id}.${k}`; }
    if (rel > TOL) {
      fails++;
      console.log(`FAIL ${c.id}.${k}: exp=${exp} act=${act} rel=${rel.toExponential(3)}`);
    }
  }
}

console.log(`\nchecked ${n} values across ${truth.length} cases`);
console.log(`worst rel err = ${worst.toExponential(3)} at ${worstId}`);
if (fails) { console.log(`\n${fails} FAILURE(S)`); process.exit(1); }
console.log('\nALL PASS (<= 1e-6)');
