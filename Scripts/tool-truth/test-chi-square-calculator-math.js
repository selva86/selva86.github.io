/* Verify tools/lib/chisq-math.js against the R truth table.
   Run:  node Scripts/tool-truth/test-chi-square-calculator-math.js
   Gate: every statistic, df, p, expected/stdres/residuals cell, effect size,
   and Fisher p within tolerance of R 4.6.0 chisq.test()/fisher.test(). */
'use strict';
var path = require('path');
var CM = require(path.join(__dirname, '..', '..', 'tools', 'lib', 'chisq-math.js'));
var truth = require(path.join(__dirname, 'chi-square-calculator.json'));

var REL_TOL = 1e-6;   // deterministic doubles -> demand tight
var ABS_TOL = 1e-9;   // absorbs values pinned at ~0

function relerr(got, exp) {
  if (got === exp) return 0;
  var d = Math.abs(got - exp);
  var scale = Math.max(Math.abs(exp), Math.abs(got));
  return scale > 0 ? d / scale : d;
}
var pass = 0, fail = 0, worst = 0, failures = [];
function chk(id, field, got, exp) {
  if (typeof exp !== 'number') return;
  var e = relerr(got, exp);
  var ok = (Math.abs(got - exp) <= ABS_TOL) || (e <= REL_TOL);
  if (e > worst && Math.abs(got - exp) > ABS_TOL) worst = e;
  if (ok) { pass++; } else { fail++; failures.push(id + ' . ' + field + '  got=' + got + '  exp=' + exp + '  rel=' + e.toExponential(3)); }
}
function chkMat(id, field, got, exp) {           // exp is array-of-arrays
  for (var i = 0; i < exp.length; i++)
    for (var j = 0; j < exp[i].length; j++)
      chk(id, field + '[' + i + '][' + j + ']', got[i][j], exp[i][j]);
}
function chkVec(id, field, got, exp) {
  for (var i = 0; i < exp.length; i++) chk(id, field + '[' + i + ']', got[i], exp[i]);
}

truth.forEach(function (t) {
  if (t.mode === 'independence') {
    var r = CM.independence(t.tbl, t.correct);
    if (r.error) { fail++; failures.push(t.id + ' unexpected error: ' + r.error); return; }
    chk(t.id, 'statistic', r.chi, t.statistic);
    chk(t.id, 'df', r.df, t.df);
    chk(t.id, 'pValue', r.p, t.pValue);
    chk(t.id, 'cramerV', r.cramerV, t.cramerV);
    chk(t.id, 'N', r.N, t.N);
    chkMat(t.id, 'expected', r.expected, t.expected);
    chkMat(t.id, 'stdres', r.stdres, t.stdres);
    chkMat(t.id, 'residuals', r.residuals, t.residuals);
    if (typeof t.fisherP === 'number') {
      var f = CM.fisher2x2(t.tbl);
      chk(t.id, 'fisherP', f.p, t.fisherP);
    }
  } else {                                        // gof
    var g = CM.goodnessOfFit(t.observed, t.probs);
    if (g.error) { fail++; failures.push(t.id + ' unexpected error: ' + g.error); return; }
    chk(t.id, 'statistic', g.chi, t.statistic);
    chk(t.id, 'df', g.df, t.df);
    chk(t.id, 'pValue', g.p, t.pValue);
    chk(t.id, 'cohenW', g.cohenW, t.cohenW);
    chk(t.id, 'N', g.N, t.N);
    chkVec(t.id, 'expected', g.expected, t.expected);
    chkVec(t.id, 'stdres', g.stdres, t.stdres);
    chkVec(t.id, 'residuals', g.residuals, t.residuals);
  }
});

// sanity: uniform GoF via null expected must equal explicit uniform probs
(function () {
  var a = CM.goodnessOfFit([10, 20], null);
  var b = CM.goodnessOfFit([10, 20], [0.5, 0.5]);
  chk('gof_uniform_null', 'statistic', a.chi, b.chi);
})();

console.log('chisq-math vs R: ' + pass + ' passed, ' + fail + ' failed. worst rel-err = ' + worst.toExponential(3));
if (fail) { console.log('\nFAILURES:'); failures.slice(0, 40).forEach(function (f) { console.log('  ' + f); }); process.exit(1); }
console.log('ALL GREEN (<= ' + REL_TOL.toExponential(0) + ' rel or ' + ABS_TOL.toExponential(0) + ' abs)');
