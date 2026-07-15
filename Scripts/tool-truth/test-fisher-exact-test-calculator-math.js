/* Verify tools/lib/fisher-math.js against the R 4.6.0 truth table.
   Every DISPLAYED number <= 1e-6 relative. The conditional MLE estimate is gated
   at 3e-4 (R's own uniroot solves it only to ~1.2e-4, so the truth is not defined
   tighter; see oddsratio-math.js note) but it rounds identically at display precision. */
'use strict';
var fs = require('fs');
var path = require('path');
var FM = require('../../tools/lib/fisher-math.js');

var truth = JSON.parse(fs.readFileSync(path.join(__dirname, 'fisher-exact-test-calculator.json'), 'utf8'));

function toNum(v) {
  if (v === 'Inf') return Infinity;
  if (v === '-Inf') return -Infinity;
  if (v === 'NaN') return NaN;
  return v;
}
function close(got, exp, relTol, absTol) {
  exp = toNum(exp);
  if (Number.isNaN(exp)) return Number.isNaN(got);
  if (!isFinite(exp)) return got === exp;
  if (!isFinite(got)) return false;
  var diff = Math.abs(got - exp);
  if (diff <= (absTol || 1e-9)) return true;
  return diff / Math.max(Math.abs(exp), 1e-300) <= relTol;
}

var fails = [], checks = 0;
function chk(key, name, got, exp, relTol, absTol) {
  checks++;
  if (!close(got, exp, relTol || 1e-6, absTol)) {
    fails.push(key + ' :: ' + name + '  got=' + got + '  exp=' + exp);
  }
}

Object.keys(truth).forEach(function (key) {
  var r = truth[key];
  var a = r.a, b = r.b, c = r.c, d = r.d, lv = r.level;

  var two = FM.analyze(a, b, c, d, { level: lv, alternative: 'two.sided' });
  var gt = FM.analyze(a, b, c, d, { level: lv, alternative: 'greater' });
  var lt = FM.analyze(a, b, c, d, { level: lv, alternative: 'less' });

  // p-values (all three are computed inside every call; assert once from two)
  chk(key, 'p_two', two.pTwo, r.p_two);
  chk(key, 'p_greater', two.pGreater, r.p_greater);
  chk(key, 'p_less', two.pLess, r.p_less);
  chk(key, 'p sel=two', two.p, r.p_two);
  chk(key, 'p sel=greater', gt.p, r.p_greater);
  chk(key, 'p sel=less', lt.p, r.p_less);

  // mid-p
  chk(key, 'midp_two', two.midTwo, r.midp_two);
  chk(key, 'midp_greater', two.midGreater, r.midp_greater);
  chk(key, 'midp_less', two.midLess, r.midp_less);

  // odds ratio: conditional MLE (3e-4) + sample ad/bc (1e-6)
  chk(key, 'estimate(cmle)', two.or.cmle, r.estimate, 3e-4, 3e-4);
  chk(key, 'sample_or', two.or.sample, r.sample_or);

  // exact CIs per alternative
  chk(key, 'ci2_lo', two.or.lo, r.ci2_lo);
  chk(key, 'ci2_hi', two.or.hi, r.ci2_hi);
  chk(key, 'cig_lo', gt.or.lo, r.cig_lo);
  chk(key, 'cig_hi', gt.or.hi, r.cig_hi);
  chk(key, 'cil_lo', lt.or.lo, r.cil_lo);
  chk(key, 'cil_hi', lt.or.hi, r.cil_hi);

  // chi-square comparison + expected count
  chk(key, 'minExp', two.chisq.minExp, r.minExp);
  chk(key, 'chisq_yates', two.chisq.statYates, r.chisq_y);
  chk(key, 'chisq_raw', two.chisq.stat, r.chisq_n);
  chk(key, 'p_chisq_yates', two.chisq.pYates, r.p_chisq_y);
  chk(key, 'p_chisq_raw', two.chisq.p, r.p_chisq_n);
});

console.log('rows: ' + Object.keys(truth).length + ' | checks: ' + checks + ' | fails: ' + fails.length);
if (fails.length) {
  fails.slice(0, 40).forEach(function (f) { console.log('  FAIL ' + f); });
  process.exit(1);
}
console.log('ALL PASS');
