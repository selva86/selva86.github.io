/* Harness: empirical-rule-calculator math vs R truth table.
   The tool composes tools/lib/normal-math.js (pnorm/qnorm, already R-verified).
   This confirms the exact composition the page uses matches R to <=1e-9.
   Run: node Scripts/tool-truth/test-empirical-rule-calculator-math.js */
'use strict';
var M = require('../../tools/lib/normal-math.js');
var truth = require('./empirical-rule-calculator.json');

// --- the composition, identical to what the page computes ---
function band(k) {
  return { within: M.pnorm(k) - M.pnorm(-k), tail_each: M.pnorm(-k), outside: 2 * M.pnorm(-k) };
}
function bandRange(mean, sd, k) { return { lo: mean - k * sd, hi: mean + k * sd, within: M.pnorm(k) - M.pnorm(-k) }; }
function valueLookup(x, mean, sd) {
  var z = (x - mean) / sd, az = Math.abs(z);
  return {
    z: z,
    within: 2 * M.pnorm(az) - 1,
    beyond: 2 * M.pnorm(-az),
    below: M.pnorm(z),
    above: M.pnorm(-z),
    pct_below: M.pnorm(z) * 100
  };
}
function reverse(cover, mean, sd) {
  var z = M.qnorm((1 + cover) / 2);
  return { z: z, lo: mean - z * sd, hi: mean + z * sd, tail_each: (1 - cover) / 2 };
}

var TOL = 1e-9;
var fails = 0, checks = 0;
function cmp(id, key, got, want) {
  checks++;
  var rel = Math.abs(want) > 1 ? Math.abs(got - want) / Math.abs(want) : Math.abs(got - want);
  if (!(rel <= TOL)) {
    fails++;
    console.log('FAIL ' + id + '.' + key + '  got=' + got + '  want=' + want + '  rel=' + rel);
  }
}

truth.forEach(function (c) {
  var id = c.id;
  if (/^band_k\d$/.test(id)) {
    var b = band(c.k);
    cmp(id, 'within', b.within, c.within);
    cmp(id, 'tail_each', b.tail_each, c.tail_each);
    cmp(id, 'outside', b.outside, c.outside);
  } else if (/_k\d$/.test(id)) {          // bandRange cases (iq/height/std/neg)
    var r = bandRange(c.mean, c.sd, c.k);
    cmp(id, 'lo', r.lo, c.lo);
    cmp(id, 'hi', r.hi, c.hi);
    cmp(id, 'within', r.within, c.within);
  } else if (/^v_/.test(id)) {            // value-to-band lookup
    var v = valueLookup(c.x, c.mean, c.sd);
    cmp(id, 'z', v.z, c.z);
    cmp(id, 'within', v.within, c.within);
    cmp(id, 'beyond', v.beyond, c.beyond);
    cmp(id, 'below', v.below, c.below);
    cmp(id, 'above', v.above, c.above);
    cmp(id, 'pct_below', v.pct_below, c.pct_below);
  } else if (/^r_/.test(id)) {            // reverse coverage
    var rv = reverse(c.cover, c.mean, c.sd);
    cmp(id, 'z', rv.z, c.z);
    cmp(id, 'lo', rv.lo, c.lo);
    cmp(id, 'hi', rv.hi, c.hi);
    cmp(id, 'tail_each', rv.tail_each, c.tail_each);
  } else {
    console.log('SKIP unknown id ' + id);
  }
});

console.log('\n' + (checks - fails) + '/' + checks + ' checks passed (tol ' + TOL + ')');
process.exit(fails ? 1 : 0);
