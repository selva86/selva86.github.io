/* test-reprex-math.js - gate reprex-format.js against the R truth fixture.
   Run: node Scripts/tool-truth/test-reprex-math.js
   Gate: every assertion passes (venue wrapping vs reprex 2.1.1, #> prefixing,
   library hoisting, seed, sessionInfo, lints, and scenario-output realism). */
'use strict';
var path = require('path');
var RF = require(path.join(__dirname, '..', '..', 'tools', 'lib', 'reprex-format.js'));
var FIX = require(path.join(__dirname, 'reprex.json'));

var pass = 0, fail = 0, fails = [];
function ok(name, cond, detail) {
  if (cond) { pass++; }
  else { fail++; fails.push(name + (detail ? '  [' + detail + ']' : '')); }
}
function firstLine(s) { return String(s).replace(/\s+$/, '').split('\n')[0]; }
function lastLine(s) { var a = String(s).replace(/\s+$/, '').split('\n'); return a[a.length - 1]; }

// ---- 1. Venue wrapping matches the real reprex output ---------------------
// gh: "``` r" ... "```"
ok('fixture gh opens with the lib open fence', firstLine(FIX.venues.gh) === RF.VENUES.gh.open,
   'fixture=' + JSON.stringify(firstLine(FIX.venues.gh)) + ' lib=' + JSON.stringify(RF.VENUES.gh.open));
ok('fixture gh closes with the lib close fence', lastLine(FIX.venues.gh) === RF.VENUES.gh.close);
ok('fixture slack opens ```', firstLine(FIX.venues.slack) === RF.VENUES.slack.open);
ok('fixture slack closes ```', lastLine(FIX.venues.slack) === RF.VENUES.slack.close);
ok('fixture r venue has no opening fence', !/^```/.test(firstLine(FIX.venues.r)));
ok('fixture html has <pre class="r"><code>', FIX.venues.html.indexOf('<pre class="r"><code>') >= 0);
ok('lib html open matches', RF.VENUES.html.open === '<pre class="r"><code>');
ok('lib html close matches', RF.VENUES.html.close === '</code></pre>');
ok('comment prefix "#> " appears in fixture gh', FIX.venues.gh.indexOf('#> ') >= 0 && RF.COMMENT === '#> ');

// Structural wrap check on a snippet with pre-pasted output.
var withOut = 'mean(c(1,2,3,NA,5))\n[1] NA';
var gh = RF.buildReprex(withOut, { venue: 'gh', commentsOut: true });
ok('gh output starts with "``` r"', gh.indexOf('``` r\n') === 0, JSON.stringify(gh.slice(0, 12)));
ok('gh output ends with "```"', /\n```$/.test(gh));
ok('gh re-prefixes [1] as "#> [1] NA"', gh.indexOf('#> [1] NA') >= 0, gh);

var slack = RF.buildReprex(withOut, { venue: 'slack', commentsOut: true });
ok('slack starts with unlabelled ```', slack.indexOf('```\n') === 0 && slack.indexOf('``` r') < 0);

var rscript = RF.buildReprex(withOut, { venue: 'r', commentsOut: true });
ok('r venue has no fences', rscript.indexOf('```') < 0);
ok('r venue still comments output', rscript.indexOf('#> [1] NA') >= 0);

var html = RF.buildReprex('x <- 1 < 2\nx', { venue: 'html' });
ok('html wraps in <pre class="r"><code>', html.indexOf('<pre class="r"><code>') === 0);
ok('html escapes <', html.indexOf('&lt;') >= 0 && html.indexOf('<pre') === 0 ? html.indexOf('1 &lt; 2') >= 0 : false, html);
ok('html closes </code></pre>', /<\/code><\/pre>$/.test(html));

// ---- 2. Cleaning transforms -----------------------------------------------
var hoist = RF.buildReprex('x <- 1\nlibrary(dplyr)\nlibrary(ggplot2)\nlibrary(dplyr)\ny <- 2', { venue: 'r' });
ok('hoists library() to the top', /^library\(dplyr\)\nlibrary\(ggplot2\)\n/.test(hoist), hoist);
ok('de-dupes repeated library() calls', (hoist.match(/library\(dplyr\)/g) || []).length === 1, hoist);

var seeded = RF.buildReprex('set.seed(99)\nrnorm(3)', { venue: 'r', seed: true, seedVal: 7 });
ok('seed toggle inserts set.seed(7)', seeded.indexOf('set.seed(7)') >= 0, seeded);
ok('seed toggle removes the old set.seed(99)', seeded.indexOf('set.seed(99)') < 0, seeded);
ok('seed appears only once', (seeded.match(/set\.seed\(/g) || []).length === 1, seeded);

var si = RF.buildReprex('1 + 1', { venue: 'r', sessionInfo: true });
ok('sessionInfo appended when requested', /sessionInfo\(\)\s*$/.test(si), si);
var si2 = RF.buildReprex('1 + 1\nsessionInfo()', { venue: 'r', sessionInfo: true });
ok('sessionInfo not duplicated', (si2.match(/sessionInfo\(\)/g) || []).length === 1, si2);

var dash = RF.buildReprex('x <- 1 — 2', { venue: 'r' });
ok('em dash sanitised to hyphen', dash.indexOf('—') < 0, dash);

// ---- 3. Lints -------------------------------------------------------------
function lintTags(code, opts) { return RF.buildLints(code, opts || {}).map(function (l) { return l.tag; }); }

ok('undefined data ref fires "data"', lintTags('sales_2024 |> filter(region == "EMEA")').indexOf('data') >= 0);
ok('mtcars (builtin) does NOT fire "data"', RF.detectUndefinedRefs('mtcars |> head()').indexOf('mtcars') < 0);
ok('diamonds (ggplot2 builtin) not undefined', RF.detectUndefinedRefs('ggplot(diamonds, aes(carat, price))').indexOf('diamonds') < 0);
ok('read.csv fires "file"', lintTags('d <- read.csv("mydata.csv")').indexOf('file') >= 0);
ok('download.file fires "net"', lintTags('download.file("http://x", "y")').indexOf('net') >= 0);
ok('rnorm w/o seed fires "seed" warn', RF.buildLints('rnorm(10)', {}).some(function (l) { return l.tag === 'seed' && l.level === 'warn'; }));
ok('rnorm WITH seed => "seed" ok', RF.buildLints('set.seed(1)\nrnorm(10)', {}).some(function (l) { return l.tag === 'seed' && l.level === 'ok'; }));
ok('reshape2 fires retired "pkg"', RF.buildLints('library(reshape2)\nmelt(mtcars)', {}).some(function (l) { return /retired/.test(l.msg); }));
ok('ggplot present fires "plot" info', lintTags('ggplot(mtcars, aes(wt, mpg))').indexOf('plot') >= 0);
ok('tidyverse verb w/o library fires "lib"', lintTags('mtcars %>% filter(mpg > 20)').indexOf('lib') >= 0);
ok('with library(dplyr) no "lib" lint', lintTags('library(dplyr)\nmtcars %>% filter(mpg > 20)').indexOf('lib') < 0);
var big = Array(60).fill('x <- 1').join('\n');
ok('>50 lines fires "size"', lintTags(big).indexOf('size') >= 0);
ok('builtinOnly escalates data lint to danger', RF.buildLints('foo_data |> head()', { builtinOnly: true }).some(function (l) { return l.tag === 'data' && l.level === 'danger'; }));
ok('empty code => no lints', RF.buildLints('   ', {}).length === 0);

// ---- 4. Scenario outputs are genuine R output -----------------------------
var scenMap = { minimal: 'minimal', plot: 'plot', dplyr: 'dplyr_nolib', conflict: 'conflict', customdata: 'customdata', customfn: 'customfn' };
Object.keys(RF.SCENARIOS).forEach(function (k) {
  var sc = RF.SCENARIOS[k];
  var fixKey = scenMap[k];
  var real = fixKey ? FIX.scenario_outputs[fixKey] : null;
  ok('scenario "' + k + '" verify substring present in code', sc.code.indexOf(sc.verify) >= 0);
  ok('scenario "' + k + '" #> output is real R output', real != null && real.indexOf(sc.verify) >= 0,
     'verify=' + JSON.stringify(sc.verify) + ' real=' + JSON.stringify(real));
});

// ---- report ---------------------------------------------------------------
console.log('\nReprex format harness: ' + pass + ' passed, ' + fail + ' failed');
if (fail) { console.log('FAILURES:\n  - ' + fails.join('\n  - ')); process.exit(1); }
console.log('ALL GREEN');
