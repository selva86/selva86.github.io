/* Verify tools/lib/normality-math.js against the R truth table.
   Run:  node Scripts/tool-truth/test-normality-test-picker-math.js
   Gate: every statistic and p-value within tolerance of R 4.6.0. */
'use strict';
var path = require('path');
var NormalityMath = require(path.join(__dirname, '..', '..', 'tools', 'lib', 'normality-math.js'));
var truth = require(path.join(__dirname, 'normality-test-picker.json'));

// Statistics are deterministic on the same doubles -> demand 1e-6 relative.
// p-values from R's own closed-form fits should match just as tightly; the
// only slack is for values pinned at hard floors (AD 3.7e-24) or ~0.
var STAT_TOL = 1e-6;
var P_REL_TOL = 1e-6;
var P_ABS_TOL = 1e-9;   // absorbs p's reported as exactly 0 / at the 3.7e-24 floor

function relerr(got, exp) {
  if (exp === got) return 0;
  var d = Math.abs(got - exp);
  var scale = Math.max(Math.abs(exp), Math.abs(got));
  return scale > 0 ? d / scale : d;
}

var pass = 0, fail = 0, worstStat = 0, worstP = 0;
var failures = [];

truth.cases.forEach(function (c) {
  var x = c.x.map(function (s) { return parseFloat(s); });
  var res = NormalityMath.runTest(c.test, x);

  // error cases: R errored -> lib must return null
  if (c.err != null) {
    if (res === null) { pass++; }
    else { fail++; failures.push(c.id + ': expected null (R errored) but got ' + JSON.stringify(res)); }
    return;
  }

  if (res === null) { fail++; failures.push(c.id + ': lib returned null, R gave ' + c.statName + '=' + c.stat); return; }

  var statKey = { W: 'W', A2: 'A2', D: 'D', JB: 'JB' }[c.statName];
  var gotStat = res[statKey];
  var gotP = res.p;

  var se = relerr(gotStat, +c.stat);
  var pe = relerr(gotP, +c.p);
  var pAbs = Math.abs(gotP - (+c.p));
  worstStat = Math.max(worstStat, se);
  if (pAbs > P_ABS_TOL) worstP = Math.max(worstP, pe);

  var okStat = se <= STAT_TOL;
  var okP = pe <= P_REL_TOL || pAbs <= P_ABS_TOL;

  if (okStat && okP) { pass++; }
  else {
    fail++;
    failures.push(c.id + ' [' + c.test + ' n=' + c.n + ']: ' +
      (okStat ? '' : ('stat ' + c.statName + ' got=' + gotStat + ' exp=' + c.stat + ' relerr=' + se.toExponential(2) + '  ')) +
      (okP ? '' : ('p got=' + gotP + ' exp=' + c.p + ' relerr=' + pe.toExponential(2))));
  }
});

console.log('normality-math.js vs R 4.6.0 truth table');
console.log('cases: ' + truth.cases.length + '  pass: ' + pass + '  fail: ' + fail);
console.log('worst stat relerr: ' + worstStat.toExponential(3) + '  worst p relerr: ' + worstP.toExponential(3));
if (failures.length) {
  console.log('\nFAILURES:');
  failures.forEach(function (f) { console.log('  x ' + f); });
  process.exit(1);
} else {
  console.log('\nALL PASS (stat <= ' + STAT_TOL + ' rel, p <= ' + P_REL_TOL + ' rel or ' + P_ABS_TOL + ' abs)');
}
