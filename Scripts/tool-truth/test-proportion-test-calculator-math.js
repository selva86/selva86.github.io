/* Node harness: proportion-math.js vs the R prop.test() truth table.
   Gate: every displayed quantity within 1e-6 relative (aim 1e-9+). */
'use strict';
var fs = require('fs');
var path = require('path');
var PM = require('../../tools/lib/proportion-math.js');

var truth = JSON.parse(fs.readFileSync(
  path.join(__dirname, 'proportion-test-calculator.json'), 'utf8'));

var fails = 0, checks = 0, worst = 0, worstMsg = '';
function close(got, exp, tol, msg) {
  checks++;
  if (exp === null || exp === undefined) return;
  var e = Math.abs(got - exp);
  var rel = Math.abs(exp) > 1e-9 ? e / Math.abs(exp) : e;
  if (rel > worst) { worst = rel; worstMsg = msg + ' got=' + got + ' exp=' + exp; }
  if (rel > (tol || 1e-6) && e > 1e-9) {
    fails++;
    if (fails <= 40) console.log('FAIL ' + msg + '  got=' + got + ' exp=' + exp + ' rel=' + rel.toExponential(2));
  }
}

var altMap = { 'two.sided': 'two', 'greater': 'greater', 'less': 'less' };

truth.forEach(function (c, idx) {
  var alt = altMap[c.alt];
  if (c.mode === 'one') {
    var r = PM.oneSample(c.x, c.n, c.p0, alt, c.conf, c.correct);
    var tag = 'one x=' + c.x + '/' + c.n + ' p0=' + c.p0 + ' ' + c.alt + ' cc=' + c.correct + ' conf=' + c.conf;
    close(r.stat, c.statistic, 1e-6, tag + ' STAT');
    close(r.p, c['p.value'], 1e-6, tag + ' P');
    close(r.phat, c.estimate, 1e-9, tag + ' EST');
    // The tool displays the two-sided, uncorrected (Wilson) CI always; it matches
    // prop.test(correct=FALSE, alternative="two.sided")$conf.int. Only validate there.
    if (c.correct === false && c.alt === 'two.sided') {
      close(r.ci.lo, c.ci_lo, 1e-6, tag + ' CIlo');
      close(r.ci.hi, c.ci_hi, 1e-6, tag + ' CIhi');
    }
  } else if (c.mode === 'two') {
    var r2 = PM.twoSample(c.x1, c.n1, c.x2, c.n2, alt, c.conf, c.correct);
    var tag2 = 'two ' + c.x1 + '/' + c.n1 + ' vs ' + c.x2 + '/' + c.n2 + ' ' + c.alt + ' cc=' + c.correct + ' conf=' + c.conf;
    close(r2.stat, c.statistic, 1e-6, tag2 + ' STAT');
    close(r2.p, c['p.value'], 1e-6, tag2 + ' P');
    close(r2.p1, c.est1, 1e-9, tag2 + ' est1');
    close(r2.p2, c.est2, 1e-9, tag2 + ' est2');
    if (c.correct === false && c.alt === 'two.sided') {
      close(r2.ci.lo, c.ci_lo, 1e-6, tag2 + ' CIlo');
      close(r2.ci.hi, c.ci_hi, 1e-6, tag2 + ' CIhi');
    }
  } else if (c.mode === 'one_z0') {
    // signed classroom z0 == signed sqrt of the uncorrected statistic
    var ru = PM.oneSample(c.x, c.n, c.p0, altMap[c.alt], c.conf, false);
    close(ru.z, c.z0, 1e-9, 'one_z0 x=' + c.x + '/' + c.n + ' signedZ');
    close(ru.stat, c.statistic, 1e-9, 'one_z0 x=' + c.x + '/' + c.n + ' z0^2');
  } else if (c.mode === 'two_z0') {
    var ru2 = PM.twoSample(c.x1, c.n1, c.x2, c.n2, altMap[c.alt], c.conf, false);
    close(ru2.z, c.z0, 1e-9, 'two_z0 signedZ');
    close(ru2.stat, c.statistic, 1e-9, 'two_z0 z0^2');
  }
});

console.log('\nchecks=' + checks + '  fails=' + fails + '  worst rel=' + worst.toExponential(3));
if (worstMsg) console.log('worst: ' + worstMsg);
if (fails) { console.log('\nRESULT: FAIL'); process.exit(1); }
console.log('\nRESULT: PASS');
