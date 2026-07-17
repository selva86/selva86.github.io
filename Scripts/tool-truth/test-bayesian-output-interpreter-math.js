/* Gate for tools/lib/bayes-output-math.js.
 *
 * The parser reads numbers out of printed text, so there is no tolerance to
 * negotiate: every decoded number must equal the truth table EXACTLY. The truth
 * table for rstanarm is read off the fitted model object (and asserted equal to
 * the printed text by the R script); the brms one is parsed independently in
 * Python from the documentation text we ship.
 *
 * Run: node Scripts/tool-truth/test-bayesian-output-interpreter-math.js
 */
'use strict';

var fs = require('fs');
var path = require('path');
var B = require('../../tools/lib/bayes-output-math.js');

var HERE = __dirname;
var truth = JSON.parse(fs.readFileSync(path.join(HERE, 'bayesian-output-interpreter.json'), 'utf8'));
var brmsTruth = JSON.parse(fs.readFileSync(path.join(HERE, 'brms-preset.json'), 'utf8'));

var pass = 0, fail = 0;
var failures = [];

function ok(cond, what) {
  if (cond) { pass++; return true; }
  fail++; failures.push(what);
  return false;
}

function eq(got, want, what) {
  var same = (got === want) ||
             (got == null && want == null) ||
             (typeof got === 'number' && typeof want === 'number' &&
              isNaN(got) && isNaN(want));
  if (!same && typeof got === 'number' && typeof want === 'number') {
    // both came from the same decimal text; allow only float-repr noise
    same = Math.abs(got - want) < 1e-9;
  }
  return ok(same, what + ': got ' + JSON.stringify(got) + ', want ' + JSON.stringify(want));
}

// ------------------------------------------------------------ rstanarm

console.log('=== rstanarm presets (real fits, R ' + truth.meta.r_version + ', rstanarm ' +
            truth.meta.rstanarm_version + ') ===');

Object.keys(truth.presets).forEach(function (key) {
  var pre = truth.presets[key];
  var exp = pre.expect;
  var res = B.parse(pre.summary_text);
  if (!ok(res.ok, key + ': parses')) {
    console.log('   ' + key + ' error: ' + res.error);
    return;
  }
  var m = res.model;
  eq(m.engine, 'rstanarm', key + ': engine');
  eq(m.nobs, exp.nobs, key + ': nobs');
  eq(m.draws, exp.sample, key + ': draws');
  eq(m.stanFunction, exp.stan_function, key + ': stan function');
  ok(m.formula === exp.formula.replace(/\s+/g, ' ').trim(),
     key + ': formula: got ' + JSON.stringify(m.formula) + ', want ' + JSON.stringify(exp.formula));
  // the console prints "gaussian [identity]"; the parser splits family from link,
  // so reassemble it to compare against what was printed
  var famPrinted = m.family + (m.link ? ' [' + m.link + ']' : '');
  eq(famPrinted, exp.family_printed, key + ': family and link');

  // every parameter row in the truth table must come back, exactly
  var byName = {};
  m.params.forEach(function (p) { byName[p.name] = p; });
  eq(m.params.length, exp.params.length, key + ': parameter count');

  exp.params.forEach(function (want) {
    var got = byName[want.name];
    if (!ok(got, key + ': has parameter ' + want.name)) return;
    if (want.mean !== undefined) eq(got.estimate, want.mean, key + '/' + want.name + ': mean');
    if (want.sd !== undefined) eq(got.est_error, want.sd, key + '/' + want.name + ': sd');
    if (want.mcse !== undefined) eq(got.mcse, want.mcse, key + '/' + want.name + ': mcse');
    if (want.rhat !== undefined) eq(got.rhat, want.rhat, key + '/' + want.name + ': Rhat');
    if (want.n_eff !== undefined) eq(got.n_eff, want.n_eff, key + '/' + want.name + ': n_eff');
    if (want.q10 !== undefined) eq(got.q && got.q[10], want.q10, key + '/' + want.name + ': 10%');
    if (want.q50 !== undefined) eq(got.q && got.q[50], want.q50, key + '/' + want.name + ': 50%');
    if (want.q90 !== undefined) eq(got.q && got.q[90], want.q90, key + '/' + want.name + ': 90%');
    // the interval the tool reports must be the printed quantiles, nothing invented
    if (want.q10 !== undefined) eq(got.lower, want.q10, key + '/' + want.name + ': CI lower is the 10% column');
    if (want.q90 !== undefined) eq(got.upper, want.q90, key + '/' + want.name + ': CI upper is the 90% column');
  });

  // rstanarm's default probs are 10/50/90 -> an 80% central interval, not 95%
  eq(m.ciFrom, 10, key + ': interval starts at the 10% quantile');
  eq(m.ciTo, 90, key + ': interval ends at the 90% quantile');
  eq(m.ciLevel, 80, key + ': printed interval is 80%, not 95%');
});

// the deliberately-bad fits must actually be judged bad
(function () {
  var weak = B.parse(truth.presets.weak.summary_text).model;
  var v = B.fitVerdict(weak);
  ok(v.level === 'bad', 'weak: verdict is bad, got ' + v.level);
  ok(v.reasons.length >= 2, 'weak: gives at least two reasons, got ' + v.reasons.length);
  var wr = B.worstRhat(weak);
  ok(wr.rhat > 1.05, 'weak: worst Rhat exceeds 1.05, got ' + wr.rhat);
  var we = B.worstEss(weak);
  ok(B.essOf(we) < 100, 'weak: worst ESS under 100, got ' + B.essOf(we));
  eq(weak.diagnostics.divergences, 8, 'weak: divergences read from the pasted warnings');
  eq(weak.diagnostics.maxRhatReported, 2.68, 'weak: largest R-hat read from the warnings');
  ok(weak.diagnostics.notConverged === true, 'weak: reads the did-not-converge warning');
  ok(weak.diagnostics.bfmi === true, 'weak: reads the low-BFMI warning');
  ok(weak.diagnostics.essWarn.indexOf('bulk') >= 0, 'weak: reads the bulk-ESS warning');
  ok(weak.diagnostics.essWarn.indexOf('tail') >= 0, 'weak: reads the tail-ESS warning');
})();

(function () {
  var d = B.parse(truth.presets.diverge.summary_text).model;
  var want = truth.presets.diverge.expect.divergences;
  eq(d.diagnostics.divergences, want, 'diverge: divergence count matches the fit');
  var v = B.fitVerdict(d);
  ok(v.level === 'bad', 'diverge: verdict is bad, got ' + v.level);
})();

(function () {
  var g = B.parse(truth.presets.gauss.summary_text).model;
  var v = B.fitVerdict(g);
  ok(v.level === 'ok', 'gauss: healthy fit passes, got ' + v.level + ' (' + v.reasons.join(' | ') + ')');
  eq(g.diagnostics.divergences, null, 'gauss: no divergences claimed when none printed');
  var coefs = B.coefficients(g);
  ok(coefs.length === 3, 'gauss: 3 coefficients (Intercept, wt, hp), got ' + coefs.length);
  ok(coefs.every(function (p) { return p.name !== 'sigma'; }), 'gauss: sigma is not a coefficient');
  var sigma = g.params.filter(function (p) { return p.name === 'sigma'; })[0];
  eq(sigma.kind, 'sigma', 'gauss: sigma classified as sigma');
  var lp = g.params.filter(function (p) { return p.name === 'log-posterior'; })[0];
  eq(lp.kind, 'lp', 'gauss: log-posterior classified');
  ok(lp.estimate == null, 'gauss: log-posterior has no estimate row, so no estimate invented');
  var ppd = g.params.filter(function (p) { return p.name === 'mean_PPD'; })[0];
  eq(ppd.kind, 'ppd', 'gauss: mean_PPD classified');
  ok(ppd.rhat != null, 'gauss: mean_PPD Rhat joined from the diagnostics table');
})();

(function () {
  var l = B.parse(truth.presets.logit.summary_text).model;
  eq(l.family, 'binomial', 'logit: family');
  eq(l.link, 'logit', 'logit: link');
  var byName = {};
  l.params.forEach(function (p) { byName[p.name] = p; });
  ok(B.excludesZero(byName['dist100']) === true, 'logit: dist100 interval excludes 0');
  ok(B.excludesZero(byName['(Intercept)']) === false, 'logit: intercept interval spans 0');
})();

(function () {
  var m = B.parse(truth.presets.mlm.summary_text).model;
  eq(m.stanFunction, 'stan_glmer', 'mlm: stan_glmer');
  ok(m.groups.length === 1 && m.groups[0].name === 'cyl' && m.groups[0].levels === 3,
     'mlm: groups read: ' + JSON.stringify(m.groups));
  var names = m.params.map(function (p) { return p.name; });
  // the row name contains a space; the right-peel must keep it whole
  ok(names.indexOf('b[(Intercept) cyl:4]') >= 0,
     'mlm: parameter name with a space survives: ' + JSON.stringify(names));
  var sig = m.params.filter(function (p) { return /^Sigma\[/.test(p.name); })[0];
  ok(sig, 'mlm: Sigma[] row present');
  eq(sig.kind, 'group_var', 'mlm: Sigma[] classified as a group variance');
  var off = m.params.filter(function (p) { return p.name === 'b[(Intercept) cyl:4]'; })[0];
  eq(off.kind, 'group_offset', 'mlm: b[] classified as a group offset');
})();

// ------------------------------------------------------------ brms

console.log('=== brms preset (verbatim from ' + brmsTruth.meta.source_url + ') ===');
(function () {
  var pre = brmsTruth.preset;
  var exp = pre.expect;
  var res = B.parse(pre.summary_text);
  if (!ok(res.ok, 'brms: parses')) { console.log('   error: ' + res.error); return; }
  var m = res.model;
  eq(m.engine, 'brms', 'brms: engine');
  eq(m.nobs, exp.nobs, 'brms: nobs');
  eq(m.draws, exp.draws, 'brms: draws');
  eq(m.chains, 4, 'brms: chains');
  eq(m.iter, 2000, 'brms: iter');
  eq(m.warmup, 1000, 'brms: warmup');
  eq(m.thin, 1, 'brms: thin');
  ok(/poisson/.test(m.family), 'brms: family, got ' + m.family);
  eq(m.link, 'log', 'brms: link');
  eq(m.ciLevel, 95, 'brms: printed interval is 95%');
  eq(m.groups.length, 1, 'brms: one grouping factor');
  eq(m.groups[0].name, 'patient', 'brms: group name');
  eq(m.groups[0].levels, exp.group_levels, 'brms: group levels');

  var byName = {};
  m.params.forEach(function (p) { byName[p.name] = p; });

  exp.population.forEach(function (want) {
    var got = byName[want.name];
    if (!ok(got, 'brms: has population parameter ' + want.name)) return;
    eq(got.estimate, want.estimate, 'brms/' + want.name + ': Estimate');
    eq(got.est_error, want.est_error, 'brms/' + want.name + ': Est.Error');
    eq(got.lower, want.lower, 'brms/' + want.name + ': l-95% CI');
    eq(got.upper, want.upper, 'brms/' + want.name + ': u-95% CI');
    eq(got.rhat, want.rhat, 'brms/' + want.name + ': Rhat');
    eq(got.bulk_ess, want.bulk_ess, 'brms/' + want.name + ': Bulk_ESS');
    eq(got.tail_ess, want.tail_ess, 'brms/' + want.name + ': Tail_ESS');
    eq(got.kind, 'coef', 'brms/' + want.name + ': classified as a coefficient');
  });

  exp.groups.forEach(function (want) {
    var got = byName[want.name];
    if (!ok(got, 'brms: has group parameter ' + want.name)) return;
    eq(got.estimate, want.estimate, 'brms/' + want.name + ': Estimate');
    eq(got.lower, want.lower, 'brms/' + want.name + ': l-95% CI');
    eq(got.upper, want.upper, 'brms/' + want.name + ': u-95% CI');
    eq(got.bulk_ess, want.bulk_ess, 'brms/' + want.name + ': Bulk_ESS');
    eq(got.tail_ess, want.tail_ess, 'brms/' + want.name + ': Tail_ESS');
    eq(got.kind, 'group_sd', 'brms/' + want.name + ': classified as a group sd');
    eq(got.group, 'patient', 'brms/' + want.name + ': attached to its grouping factor');
  });

  // Rhat 1.01 sits exactly ON the threshold: the rule is "> 1.01", so it passes
  ok(byName['Trt1'].rhat === 1.01, 'brms: Trt1 Rhat is 1.01');
  eq(B.rhatVerdict(1.01).level, 'ok', 'brms: Rhat exactly 1.01 is not flagged (rule is > 1.01)');
  eq(B.rhatVerdict(1.011).level, 'warn', 'brms: Rhat just over 1.01 is flagged');

  // Tail_ESS matters for the interval endpoints, so it is read as its own column
  ok(byName['zBase'].bulk_ess === 678, 'brms: zBase Bulk_ESS');
  ok(byName['zBase'].tail_ess === 1389, 'brms: zBase Tail_ESS is read separately from Bulk_ESS');
  eq(B.essVerdict(678).level, 'ok', 'brms: Bulk_ESS 678 clears the 400 rule of thumb');
  eq(B.fitVerdict(m).level, 'ok', 'brms: the documented epilepsy fit is healthy');
})();

// ------------------------------------------------------------ malformed

console.log('=== malformed and wrong-tool pastes ===');
[
  ['', 'Nothing pasted yet'],
  ['   \n  \n', 'Nothing pasted yet'],
  ['hello world', 'does not look like'],
  ['{"a":1}', 'does not look like']
].forEach(function (c) {
  var r = B.parse(c[0]);
  ok(!r.ok && r.error.indexOf(c[1]) >= 0,
     'rejects ' + JSON.stringify(c[0].slice(0, 20)) + ' with a message mentioning "' + c[1] + '"');
});

(function () {
  var lm = 'Call:\nlm(formula = mpg ~ wt)\n\nResiduals:\n    Min      1Q \n-4.5432 -2.3647 \n\n' +
           'Coefficients:\n            Estimate Std. Error t value Pr(>|t|)\n' +
           '(Intercept)  37.2851     1.8776  19.858  < 2e-16 ***\n' +
           'wt           -5.3445     0.5591  -9.559 1.29e-10 ***\n\n' +
           'Residual standard error: 3.046 on 30 degrees of freedom\n';
  var r = B.parse(lm);
  ok(!r.ok && r.hint === 'lm', 'lm() paste is redirected to the lm interpreter');
})();

(function () {
  var lmer = "Linear mixed model fit by REML ['lmerMod']\nFormula: Reaction ~ Days + (1 | Subject)\n" +
             '\nRandom effects:\n Groups   Name        Variance Std.Dev.\n' +
             ' Subject  (Intercept) 1378.2   37.12   \n Residual              960.5   30.99   \n' +
             'Number of obs: 180, groups:  Subject, 18\n\nFixed effects:\n' +
             '            Estimate Std. Error t value\n(Intercept) 251.4051     9.7467   25.79\n';
  var r = B.parse(lmer);
  ok(!r.ok && r.hint === 'lmer', 'lme4 paste is redirected to the lmer interpreter');
})();

(function () {
  var r = B.parse('Inference for Stan model: anon_model.\n4 chains, each with iter=2000');
  ok(!r.ok && /rstanarm and brms summary/.test(r.error),
     'raw rstan print(stanfit) gets a targeted message');
})();

(function () {
  // truncated: has estimates but no header block to identify the package
  var r = B.parse('Estimates:\n              mean   sd     10%    50%    90% \n(Intercept) 37.217  1.656 35.084 37.245 39.253\n');
  ok(!r.ok && /Model Info|which package/.test(r.error),
     'a headerless fragment is refused rather than half-read');
})();

// ------------------------------------------------------------ robustness

console.log('=== robustness ===');
(function () {
  var t = truth.presets.gauss.summary_text;
  // a copied console prompt in front of the paste
  var r = B.parse('> summary(fit)\n' + t);
  ok(r.ok, 'tolerates a copied "> summary(fit)" prompt line');
  // CRLF
  var r2 = B.parse(t.replace(/\n/g, '\r\n'));
  ok(r2.ok && r2.model.params.length === B.parse(t).model.params.length,
     'tolerates CRLF line endings');
  // trailing blank lines
  var r3 = B.parse('\n\n' + t + '\n\n\n');
  ok(r3.ok, 'tolerates surrounding blank lines');
})();

(function () {
  // the normal approximation must refuse to speak for a skewed/bounded parameter
  var m = B.parse(truth.presets.mlm.summary_text).model;
  var sig = m.params.filter(function (p) { return /^Sigma\[/.test(p.name); })[0];
  ok(B.normalApproxOk(sig) === false, 'no normal approximation offered for a variance row');
  var g = B.parse(truth.presets.gauss.summary_text).model;
  var wt = g.params.filter(function (p) { return p.name === 'wt'; })[0];
  ok(B.normalApproxOk(wt) === true, 'normal approximation allowed for a symmetric coefficient');
  var pp = B.probPositive(wt);
  ok(pp < 0.001, 'P(wt > 0) is tiny for a clearly negative coefficient, got ' + pp);
})();

(function () {
  eq(B.adaptDeltaLadder(0.8), 0.9, 'adapt_delta ladder: 0.8 -> 0.9');
  eq(B.adaptDeltaLadder(0.9), 0.95, 'adapt_delta ladder: 0.9 -> 0.95');
  eq(B.adaptDeltaLadder(0.95), 0.99, 'adapt_delta ladder: 0.95 -> 0.99');
  eq(B.adaptDeltaLadder(0.99), 0.999, 'adapt_delta ladder: 0.99 -> 0.999');
  eq(B.adaptDeltaLadder(null), 0.9, 'adapt_delta ladder: default start is 0.8 -> 0.9');
})();

(function () {
  eq(B.essVerdict(399).level, 'warn', 'ESS 399 is below the 400 rule of thumb');
  eq(B.essVerdict(400).level, 'ok', 'ESS 400 meets the rule of thumb');
  eq(B.essVerdict(99).level, 'bad', 'ESS 99 is far too low');
  eq(B.rhatVerdict(1.0).level, 'ok', 'Rhat 1.00 is fine');
  eq(B.rhatVerdict(1.05).level, 'warn', 'Rhat 1.05 warns');
  eq(B.rhatVerdict(1.051).level, 'bad', 'Rhat above 1.05 is bad');
  eq(B.rhatVerdict(null).level, 'unknown', 'a missing Rhat is unknown, not fine');
  eq(B.essVerdict(null).level, 'unknown', 'a missing ESS is unknown, not fine');
})();

// ------------------------------------------------------------ report

console.log('');
console.log(pass + ' passed, ' + fail + ' failed');
if (fail) {
  console.log('');
  failures.forEach(function (f) { console.log('  FAIL  ' + f); });
  process.exit(1);
}
console.log('bayes-output-math: every decoded number matches the pasted text exactly.');
