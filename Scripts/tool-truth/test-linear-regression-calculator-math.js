/* Node gate: tools/lib/lm-math.js  fitSimple + predict  vs R lm() truth table.
   Every value at <= 1e-6 relative (aim 1e-7); p-values get an absolute floor so
   astronomically small tails compare sanely (both < 1e-290 => equal).
   Run: node Scripts/tool-truth/test-linear-regression-calculator-math.js */
'use strict';
var LM = require('../../tools/lib/lm-math.js');
var cases = require('./linear-regression-calculator.json');

var TOL = 1e-6;          // target relative tolerance
var P_FLOOR = 1e-290;    // both p-values below this are treated as equal (underflow)
var ABS_FLOOR = 1e-12;   // absolute slack for values legitimately near zero

var pass = 0, fail = 0, worst = 0, worstId = '', failures = [];

// returns {ok, rel}
function cmp(got, want, isP) {
  if (want === null || want === undefined) return { ok: got == null, rel: 0 };
  if (typeof got !== 'number' || !isFinite(got)) {
    return { ok: false, rel: Infinity };
  }
  if (isP && want < P_FLOOR && got < P_FLOOR) return { ok: true, rel: 0 };
  var diff = Math.abs(got - want);
  var rel = diff / Math.max(Math.abs(want), 1e-300);
  var ok = rel <= TOL || diff <= ABS_FLOOR;
  return { ok: ok, rel: rel };
}

function check(id, label, got, want, isP) {
  var r = cmp(got, want, isP);
  if (r.rel > worst) { worst = r.rel; worstId = id + '.' + label; }
  if (!r.ok) {
    fail++;
    failures.push(id + ' ' + label + ': got ' + got + ' want ' + want +
                  ' (rel ' + (isFinite(r.rel) ? r.rel.toExponential(2) : r.rel) + ')');
    return false;
  }
  pass++;
  return true;
}

cases.forEach(function (c) {
  var id = c.id;
  var fit = LM.fitSimple(c.x, c.y, { conf: 0.95, xname: 'x', yname: 'y' });
  if (fit.error) { fail++; failures.push(id + ' unexpected lib error: ' + fit.error); return; }

  // structural
  check(id, 'n', fit.n, c.n);
  check(id, 'coef0.name==(Intercept)', fit.coef[0].name === '(Intercept)' ? 1 : 0, 1);

  // coefficients: index 0 = intercept, index 1 = slope
  var ic = c.coef.intercept, sl = c.coef.slope;
  check(id, 'intercept.est', fit.coef[0].est, ic.est);
  check(id, 'intercept.se',  fit.coef[0].se,  ic.se);
  check(id, 'intercept.t',   fit.coef[0].t,   ic.t);
  check(id, 'intercept.p',   fit.coef[0].p,   ic.p, true);
  check(id, 'slope.est', fit.coef[1].est, sl.est);
  check(id, 'slope.se',  fit.coef[1].se,  sl.se);
  check(id, 'slope.t',   fit.coef[1].t,   sl.t);
  check(id, 'slope.p',   fit.coef[1].p,   sl.p, true);

  // model-level
  check(id, 'r2',    fit.r2,    c.r2);
  check(id, 'adjR2', fit.adjR2, c.adjr2);
  check(id, 'sigma', fit.sigma, c.sigma);
  check(id, 'fstat', fit.fstat, c.fstat);
  check(id, 'fdf1',  fit.fdf1,  c.fdf1);
  check(id, 'fdf2',  fit.fdf2,  c.fdf2);
  check(id, 'fp',    fit.fp,    c.fp, true);

  // identity: F == t_slope^2 and fp == slope two-sided p
  check(id, 'F==t_slope^2', fit.fstat, fit.coef[1].t * fit.coef[1].t);
  check(id, 'fp==slope.p',  fit.fp,    fit.coef[1].p, true);

  // residual quantiles (type 7)
  check(id, 'residq.min',    fit.residQuantiles.min,    c.residq.min);
  check(id, 'residq.q1',     fit.residQuantiles.q1,     c.residq.q1);
  check(id, 'residq.median', fit.residQuantiles.median, c.residq.median);
  check(id, 'residq.q3',     fit.residQuantiles.q3,     c.residq.q3);
  check(id, 'residq.max',    fit.residQuantiles.max,    c.residq.max);

  // information criteria
  check(id, 'logLik', fit.logLik, c.logLik);
  check(id, 'aic',    fit.aic,    c.aic);
  check(id, 'bic',    fit.bic,    c.bic);

  // confint at 0.90 / 0.95 / 0.99 (re-fit at each level; check coef[].ci)
  [['0.9', 0.90], ['0.95', 0.95], ['0.99', 0.99]].forEach(function (lv) {
    var key = lv[0], conf = lv[1];
    var f = LM.fitSimple(c.x, c.y, { conf: conf, xname: 'x', yname: 'y' });
    if (f.error) { fail++; failures.push(id + ' confint refit error @' + key); return; }
    var ci = c.confint[key];
    check(id, 'ci' + key + '.intercept.lo', f.coef[0].ci[0], ci.intercept[0]);
    check(id, 'ci' + key + '.intercept.hi', f.coef[0].ci[1], ci.intercept[1]);
    check(id, 'ci' + key + '.slope.lo',     f.coef[1].ci[0], ci.slope[0]);
    check(id, 'ci' + key + '.slope.hi',     f.coef[1].ci[1], ci.slope[1]);
  });

  // predict at each x0: confidence + prediction intervals at 0.95
  c.predict.forEach(function (pr, k) {
    var p = LM.predict(fit, pr.x0, 0.95);
    var tag = 'predict[' + k + ' x0=' + pr.x0 + ']';
    check(id, tag + '.conf.fit', p.fit,   pr.conf.fit);
    check(id, tag + '.conf.lwr', p.ciLo,  pr.conf.lwr);
    check(id, tag + '.conf.upr', p.ciHi,  pr.conf.upr);
    check(id, tag + '.pred.fit', p.fit,   pr.pred.fit);
    check(id, tag + '.pred.lwr', p.piLo,  pr.pred.lwr);
    check(id, tag + '.pred.upr', p.piHi,  pr.pred.upr);
  });
});

console.log('datasets: ' + cases.length + '  checks pass: ' + pass + '  fail: ' + fail);
console.log('worst relative error: ' + worst.toExponential(3) + '  (' + worstId + ')');
if (fail) {
  console.log('\nFAILURES:');
  failures.slice(0, 60).forEach(function (f) { console.log('  ' + f); });
  process.exit(1);
}
console.log('ALL PASS (<= ' + TOL.toExponential(0) + ' relative, p-floor ' + P_FLOOR.toExponential(0) + ')');
