/* Gate: oddsratio-math.js vs Scripts/tool-truth/odds-ratio-calculator.json
   Tolerance: 1e-6 relative. Near-zero quantities (|truth| < 1e-9, e.g. a
   Fisher lower bound that is exactly 0, or an OR that underflows) are checked
   on an absolute floor of 1e-9. Inf/-Inf/NaN must match by kind.

   Exception: OR_cmle (the conditional MLE of the odds ratio, fisher.test's
   $estimate) is checked at 3e-4 relative. It is NOT a displayed value; it is a
   parity companion to the Fisher exact CI. R's fisher.test itself solves the
   cMLE with uniroot at tol = .Machine$double.eps^0.25 ~ 1.2e-4, so its ground
   truth is only defined to that precision and a tighter gate is not meaningful.
   Every DISPLAYED quantity (OR Wald, OR Fisher exact CI, RR, RD, NNT, AR%, PAF,
   chi-square and Fisher p) passes at <= 1e-6 relative. */
'use strict';
var fs = require('fs');
var path = require('path');
var ORM = require(path.join(__dirname, '..', '..', 'tools', 'lib', 'oddsratio-math.js'));
var truth = JSON.parse(fs.readFileSync(path.join(__dirname, 'odds-ratio-calculator.json'), 'utf8'));

var REL = 1e-6, ABS = 1e-9;
var fails = [], checks = 0;

function toNum(v) {
  if (v === 'Inf') return Infinity;
  if (v === '-Inf') return -Infinity;
  if (v === 'NaN') return NaN;
  return v;
}
function close(key, field, got, exp, relOverride) {
  checks++;
  exp = toNum(exp);
  if (Number.isNaN(exp)) { if (!Number.isNaN(got)) fails.push(key + '.' + field + ': got ' + got + ' want NaN'); return; }
  if (!isFinite(exp)) { if (got !== exp) fails.push(key + '.' + field + ': got ' + got + ' want ' + exp); return; }
  if (!isFinite(got)) { fails.push(key + '.' + field + ': got ' + got + ' want ' + exp); return; }
  var diff = Math.abs(got - exp);
  var rel = relOverride || REL;
  var tol = Math.abs(exp) < 1e-9 ? ABS : rel * Math.abs(exp);
  if (diff > tol) fails.push(key + '.' + field + ': got ' + got + ' want ' + exp + ' (diff ' + diff.toExponential(3) + ')');
}

Object.keys(truth).forEach(function (key) {
  var t = truth[key];
  var r = ORM.analyze(t.a, t.b, t.c, t.d, { level: t.level });
  close(key, 'risk1', r.risk1, t.risk1);
  close(key, 'risk0', r.risk0, t.risk0);
  close(key, 'OR', r.or.est, t.OR);
  close(key, 'OR_lo', r.or.lo, t.OR_lo);
  close(key, 'OR_hi', r.or.hi, t.OR_hi);
  close(key, 'OR_fisher_lo', r.orFisher.lo, t.OR_fisher_lo);
  close(key, 'OR_fisher_hi', r.orFisher.hi, t.OR_fisher_hi);
  close(key, 'OR_cmle', r.orFisher.cmle, t.OR_cmle, 3e-4);  // parity-only; R uniroot tol floor
  close(key, 'RR', r.rr.est, t.RR);
  close(key, 'RR_lo', r.rr.lo, t.RR_lo);
  close(key, 'RR_hi', r.rr.hi, t.RR_hi);
  close(key, 'RD', r.rd.est, t.RD);
  close(key, 'RD_lo', r.rd.lo, t.RD_lo);
  close(key, 'RD_hi', r.rd.hi, t.RD_hi);
  close(key, 'NNT', r.nnt.value, t.NNT);
  close(key, 'AFe', r.afe, t.AFe);
  close(key, 'PAF', r.paf, t.PAF);
  close(key, 'chisq_y', r.chisq.statYates, t.chisq_y);
  close(key, 'p_chisq_y', r.chisq.pYates, t.p_chisq_y);
  close(key, 'chisq_n', r.chisq.stat, t.chisq_n);
  close(key, 'p_chisq_n', r.chisq.p, t.p_chisq_n);
  close(key, 'p_fisher', r.fisherP, t.p_fisher);
  close(key, 'minExp', r.chisq.minExp, t.minExp);
  if (r.test.pick !== t.autopick) { checks++; fails.push(key + '.autopick: got ' + r.test.pick + ' want ' + t.autopick); }
});

console.log('rows: ' + Object.keys(truth).length + ', checks: ' + checks + ', fails: ' + fails.length);
if (fails.length) {
  fails.slice(0, 40).forEach(function (f) { console.log('  FAIL ' + f); });
  process.exit(1);
}
console.log('ALL PASS (<=1e-6 relative, 1e-9 absolute floor)');
