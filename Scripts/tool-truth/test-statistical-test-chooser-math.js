/*
 * test-statistical-test-chooser-math.js
 *
 * The Statistical Test Chooser's primary artifact is a DECISION ENGINE, not a
 * numeric computation, so this "truth table" is an assertion table of
 * wizard-state -> expected recommended test. Cases are reviewed against the
 * standard decision guides (Zar, Biostatistical Analysis; UCLA IDRE
 * "choosing the correct statistical test"; GraphPad flowcharts).
 *
 * It also enforces two structural guarantees:
 *   - every recommendation's calc / tutorial / exercise link resolves to a
 *     real file on disk (no 404s), and
 *   - the parametric<->nonparametric alt ids reference real registry entries.
 *
 * Run:  node Scripts/tool-truth/test-statistical-test-chooser-math.js
 */
'use strict';
var path = require('path');
var fs = require('fs');
var TC = require(path.resolve(__dirname, '../../tools/lib/test-chooser.js'));
var ROOT = path.resolve(__dirname, '../..');

var pass = 0, fail = 0;
function eq(desc, got, want) {
  if (got === want) { pass++; }
  else { fail++; console.log('  FAIL ' + desc + '\n       got  ' + JSON.stringify(got) + '\n       want ' + JSON.stringify(want)); }
}

// state builder shortcut
function S(o) { return o; }

// ---- wizard path assertions -------------------------------------------
var CASES = [
  // ---- compare, continuous -------------------------------------------
  ['1 group, normal',                     S({goal:'compare',outcome:'continuous',groups:'1',normal:'yes'}), 'one-sample-t'],
  ['1 group, skewed',                     S({goal:'compare',outcome:'continuous',groups:'1',normal:'no'}), 'wilcoxon-signed-rank'],
  ['2 indep, normal, unequal var',        S({goal:'compare',outcome:'continuous',groups:'2',design:'independent',normal:'yes',equalvar:'no'}), 'welch-t'],
  ['2 indep, normal, equal var',          S({goal:'compare',outcome:'continuous',groups:'2',design:'independent',normal:'yes',equalvar:'yes'}), 'student-t'],
  ['2 indep, skewed',                     S({goal:'compare',outcome:'continuous',groups:'2',design:'independent',normal:'no'}), 'mann-whitney'],
  ['2 paired, normal',                    S({goal:'compare',outcome:'continuous',groups:'2',design:'paired',normal:'yes'}), 'paired-t'],
  ['2 paired, skewed',                    S({goal:'compare',outcome:'continuous',groups:'2',design:'paired',normal:'no'}), 'wilcoxon-signed-rank'],
  ['3+ indep, normal, equal var',         S({goal:'compare',outcome:'continuous',groups:'3+',design:'independent',normal:'yes',equalvar:'yes'}), 'one-way-anova'],
  ['3+ indep, normal, unequal var',       S({goal:'compare',outcome:'continuous',groups:'3+',design:'independent',normal:'yes',equalvar:'no'}), 'welch-anova'],
  ['3+ indep, skewed',                    S({goal:'compare',outcome:'continuous',groups:'3+',design:'independent',normal:'no'}), 'kruskal-wallis'],
  ['3+ repeated, normal',                 S({goal:'compare',outcome:'continuous',groups:'3+',design:'paired',normal:'yes'}), 'rm-anova'],
  ['3+ repeated, skewed',                 S({goal:'compare',outcome:'continuous',groups:'3+',design:'paired',normal:'no'}), 'friedman'],
  ['2 indep, unsure + small n',           S({goal:'compare',outcome:'continuous',groups:'2',design:'independent',normal:'unsure',n:'small',equalvar:'no'}), 'mann-whitney'],
  ['2 indep, unsure + large n, uneq var', S({goal:'compare',outcome:'continuous',groups:'2',design:'independent',normal:'unsure',n:'large',equalvar:'no'}), 'welch-t'],
  ['2 indep, unsure + large n, eq var',   S({goal:'compare',outcome:'continuous',groups:'2',design:'independent',normal:'unsure',n:'large',equalvar:'yes'}), 'student-t'],
  ['3+ indep, unsure + small n',          S({goal:'compare',outcome:'continuous',groups:'3+',design:'independent',normal:'unsure',n:'small',equalvar:'yes'}), 'kruskal-wallis'],

  // ---- compare, ordinal (forces rank tests) --------------------------
  ['ordinal 1 group',                     S({goal:'compare',outcome:'ordinal',groups:'1'}), 'sign-test'],
  ['ordinal 2 indep',                     S({goal:'compare',outcome:'ordinal',groups:'2',design:'independent'}), 'mann-whitney'],
  ['ordinal 2 paired',                    S({goal:'compare',outcome:'ordinal',groups:'2',design:'paired'}), 'sign-test'],
  ['continuous 2 paired skewed = signed-rank', S({goal:'compare',outcome:'continuous',groups:'2',design:'paired',normal:'no'}), 'wilcoxon-signed-rank'],
  ['ordinal 3+ indep',                    S({goal:'compare',outcome:'ordinal',groups:'3+',design:'independent'}), 'kruskal-wallis'],
  ['ordinal 3+ repeated',                 S({goal:'compare',outcome:'ordinal',groups:'3+',design:'paired'}), 'friedman'],

  // ---- compare, binary ----------------------------------------------
  ['binary 1 group, small n',             S({goal:'compare',outcome:'binary',groups:'1',n:'small'}), 'binomial-test'],
  ['binary 1 group, large n',             S({goal:'compare',outcome:'binary',groups:'1',n:'large'}), 'one-prop-z'],
  ['binary 2 paired',                     S({goal:'compare',outcome:'binary',groups:'2',design:'paired'}), 'mcnemar'],
  ['binary 2 indep, small n',             S({goal:'compare',outcome:'binary',groups:'2',design:'independent',n:'small'}), 'fisher-exact'],
  ['binary 2 indep, large n',             S({goal:'compare',outcome:'binary',groups:'2',design:'independent',n:'large'}), 'two-prop-z'],
  ['binary 3+ repeated',                  S({goal:'compare',outcome:'binary',groups:'3+',design:'paired'}), 'cochran-q'],
  ['binary 3+ indep',                     S({goal:'compare',outcome:'binary',groups:'3+',design:'independent',n:'large'}), 'chi-square-independence'],

  // ---- compare, nominal (>2 categories) ------------------------------
  ['nominal 1 var, GoF',                  S({goal:'compare',outcome:'nominal',groups:'1'}), 'chi-square-gof'],
  ['nominal 2 indep, large n',            S({goal:'compare',outcome:'nominal',groups:'2',design:'independent',n:'large'}), 'chi-square-independence'],
  ['nominal 2 indep, small n',            S({goal:'compare',outcome:'nominal',groups:'2',design:'independent',n:'small'}), 'fisher-exact'],

  // ---- compare, count -----------------------------------------------
  ['count outcome across groups',         S({goal:'compare',outcome:'count',groups:'2'}), 'poisson-regression'],

  // ---- relationship --------------------------------------------------
  ['rel continuous, linear/normal',       S({goal:'relationship',outcome:'continuous',normal:'yes'}), 'pearson'],
  ['rel continuous, monotonic',           S({goal:'relationship',outcome:'continuous',normal:'no',n:'medium'}), 'spearman'],
  ['rel continuous, small n',             S({goal:'relationship',outcome:'continuous',normal:'no',n:'small'}), 'kendall'],
  ['rel ordinal',                         S({goal:'relationship',outcome:'ordinal'}), 'kendall'],
  ['rel nominal, large n',                S({goal:'relationship',outcome:'nominal',n:'large'}), 'chi-square-independence'],
  ['rel nominal, small n',                S({goal:'relationship',outcome:'nominal',n:'small'}), 'fisher-exact'],

  // ---- predict -------------------------------------------------------
  ['predict continuous, 1 predictor',     S({goal:'predict',outcome:'continuous',predictors:'1'}), 'simple-linear-regression'],
  ['predict continuous, many',            S({goal:'predict',outcome:'continuous',predictors:'2+'}), 'multiple-linear-regression'],
  ['predict binary',                      S({goal:'predict',outcome:'binary'}), 'logistic-regression'],
  ['predict count',                       S({goal:'predict',outcome:'count'}), 'poisson-regression'],
  ['predict ordinal',                     S({goal:'predict',outcome:'ordinal'}), 'ordinal-logistic'],
  ['predict nominal',                     S({goal:'predict',outcome:'nominal'}), 'multinomial-logistic'],

  // ---- survival ------------------------------------------------------
  ['survival compare groups',             S({goal:'survival',survGoal:'compare'}), 'log-rank'],
  ['survival model covariates',           S({goal:'survival',survGoal:'model'}), 'cox-regression'],

  // ---- agreement -----------------------------------------------------
  ['agreement categorical, 2 raters',     S({goal:'agreement',ratingType:'categorical',raters:'2'}), 'cohen-kappa'],
  ['agreement categorical, 3+ raters',    S({goal:'agreement',ratingType:'categorical',raters:'3+'}), 'cohen-kappa'],
  ['agreement continuous ratings',        S({goal:'agreement',ratingType:'continuous'}), 'icc'],

  // ---- describe ------------------------------------------------------
  ['describe continuous',                 S({goal:'describe',outcome:'continuous'}), 'describe-continuous'],
  ['describe categorical',                S({goal:'describe',outcome:'nominal'}), 'describe-categorical']
];

if (process.argv.indexOf('--dump') !== -1) {
  console.log(JSON.stringify(CASES.map(function (c) { return { s: c[1], id: c[2] }; })));
  process.exit(0);
}

console.log('=== wizard-path assertions (' + CASES.length + ') ===');
CASES.forEach(function (c) { eq(c[0], TC.decide(c[1]).id, c[2]); });

// ---- coverage: every registry test is reachable by some case ----------
var reached = {};
CASES.forEach(function (c) { reached[c[2]] = true; });
var testCount = 0, unreached = [];
Object.keys(TC.TESTS).forEach(function (id) {
  if (TC.TESTS[id].family !== 'describe') testCount++;
  if (!reached[id]) unreached.push(id);
});
console.log('\n=== coverage ===');
eq('at least 30 statistical-test endpoints', testCount >= 30, true);
console.log('  test endpoints: ' + testCount);
eq('every registry entry is reachable by a wizard path', unreached.length, 0);
if (unreached.length) console.log('  unreached: ' + unreached.join(', '));

// ---- notes sanity ------------------------------------------------------
eq('unsure+small emits a normality note',
   TC.decide(S({goal:'compare',outcome:'continuous',groups:'2',design:'independent',normal:'unsure',n:'small',equalvar:'no'})).notes.length > 0, true);
eq('alt id present for welch-t', TC.TESTS['welch-t'].alt, 'mann-whitney');

// ---- link resolution: no 404s -----------------------------------------
console.log('\n=== link resolution (files must exist on disk) ===');
var linkFail = 0, linkOk = 0;
function checkLink(id, kind, lnk) {
  if (!lnk) return;
  var rel = lnk.href.replace(/^\//, '').split('#')[0].split('?')[0];
  var abs = path.join(ROOT, rel);
  if (fs.existsSync(abs)) { linkOk++; }
  else { linkFail++; console.log('  MISSING ' + id + ' [' + kind + '] -> ' + lnk.href); }
}
Object.keys(TC.TESTS).forEach(function (id) {
  var t = TC.TESTS[id];
  checkLink(id, 'calc', t.calc);
  checkLink(id, 'tutorial', t.tutorial);
  checkLink(id, 'exercises', t.exercises);
  if (t.alt && !TC.TESTS[t.alt]) { linkFail++; console.log('  BAD ALT ' + id + ' -> ' + t.alt); }
});
eq('all recommendation links resolve to real files', linkFail, 0);
console.log('  links checked OK: ' + linkOk);

// ---- summary -----------------------------------------------------------
console.log('\n=== summary ===');
console.log('  assertions passed: ' + pass + ' / ' + (pass + fail));
if (fail > 0) { console.log('FAILED'); process.exit(1); }
console.log('ALL GREEN');
