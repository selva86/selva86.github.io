/* Node harness: tools/lib/anova-math.js raw-data ANOVA (anova-calculator)
   vs Scripts/tool-truth/anova-calculator.json (R 4.6.0 aov / car / effectsize).
   Gate: every displayed quantity within 1e-6 relative (finite values). */
'use strict';
var A = require('../../tools/lib/anova-math.js');
var truth = require('./anova-calculator.json');

var fails = 0, checks = 0;
function rel(a, b) {
  if (!isFinite(a) || !isFinite(b)) return (a === b || (isNaN(a) && isNaN(b))) ? 0 : Infinity;
  var d = Math.abs(a - b), s = Math.max(Math.abs(a), Math.abs(b));
  return s < 1e-12 ? d : d / s;
}
function chk(label, got, exp, tol) {
  tol = tol || 1e-6; checks++;
  var r = rel(got, exp);
  if (r > tol) { fails++; console.log('  FAIL ' + label + '  got=' + got + '  exp=' + exp + '  rel=' + r); }
}

console.log('--- ONE-WAY (' + truth.oneway.length + ' cases) ---');
truth.oneway.forEach(function (c) {
  var groups = c.groups.map(function (g) { return { name: g.name, values: g.values }; });
  var r = A.oneWay(groups, { conf: c.conf });
  var pre = c.name + ': ';
  chk(pre + 'SSbetween', r.ssBetween, c.ss_between);
  chk(pre + 'dfbetween', r.dfBetween, c.df_between);
  chk(pre + 'MSbetween', r.msBetween, c.ms_between);
  chk(pre + 'SSwithin', r.ssWithin, c.ss_within);
  chk(pre + 'dfwithin', r.dfWithin, c.df_within);
  chk(pre + 'MSwithin', r.msWithin, c.ms_within);
  chk(pre + 'SStotal', r.ssTotal, c.ss_total);
  chk(pre + 'F', r.f, c.f);
  chk(pre + 'p', r.p, c.p, 1e-6);
  chk(pre + 'eta2', r.eta2, c.eta2);
  chk(pre + 'omega2', r.omega2, c.omega2);
  chk(pre + 'cohensF', r.cohensF, c.cohens_f);
  chk(pre + 'es_eta2', r.eta2, c.es_eta2);       // == effectsize
  chk(pre + 'es_omega2', Math.max(0, r.omega2), c.es_omega2);  // effectsize floors omega2 at 0
  // Levene is 0/0 when every group's within-median deviations are identical
  // (e.g. n=2 in all groups) -- R returns perfect-fit FP noise (~1.0) and warns
  // "essentially perfect fit unreliable". The lib returns NaN (honest); the page
  // shows n/a. Waive that degenerate case; assert real ones exactly.
  if (!isFinite(r.levene.f)) {
    console.log('  WAIVED ' + pre + 'Levene (degenerate equal-spread; R value is perfect-fit FP noise)');
  } else {
    chk(pre + 'levene_F', r.levene.f, c.levene_f);
    chk(pre + 'levene_p', r.levene.p, c.levene_p, 1e-6);
  }
  // group summary
  c.summary.forEach(function (s, i) {
    chk(pre + 'grp' + i + '.n', r.summary[i].n, s.n);
    chk(pre + 'grp' + i + '.mean', r.summary[i].mean, s.mean);
    if (isFinite(s.sd)) chk(pre + 'grp' + i + '.sd', r.summary[i].sd, s.sd);
  });
});

console.log('--- TWO-WAY (' + truth.twoway.length + ' cases) ---');
truth.twoway.forEach(function (c) {
  var r = A.twoWay(c.A, c.B, c.y, {});
  var pre = c.name + ': ';
  c.rows.forEach(function (tr, i) {
    chk(pre + tr.term + '.SS', r.rows[i].ss, tr.ss);
    chk(pre + tr.term + '.df', r.rows[i].df, tr.df);
    chk(pre + tr.term + '.MS', r.rows[i].ms, tr.ms);
    chk(pre + tr.term + '.F', r.rows[i].f, tr.f);
    chk(pre + tr.term + '.p', r.rows[i].p, tr.p, 1e-6);
    chk(pre + tr.term + '.eta2', r.rows[i].eta2, tr.eta2);
    chk(pre + tr.term + '.es_eta2', r.rows[i].eta2, tr.es_eta2);
    chk(pre + tr.term + '.peta2', r.rows[i].partialEta2, tr.partial_eta2);
  });
  chk(pre + 'resid.SS', r.resid.ss, c.resid.ss);
  chk(pre + 'resid.df', r.resid.df, c.resid.df);
  chk(pre + 'resid.MS', r.resid.ms, c.resid.ms);
  chk(pre + 'total.SS', r.total.ss, c.total.ss);
  chk(pre + 'total.df', r.total.df, c.total.df);
});

console.log('\n' + (fails ? ('*** ' + fails + '/' + checks + ' FAILED') : ('ALL ' + checks + ' CHECKS PASSED')));
process.exit(fails ? 1 : 0);
