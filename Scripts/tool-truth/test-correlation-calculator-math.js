/* Node gate: tools/lib/correlation-math.js vs R cor.test truth table.
   Every case at <= 1e-6 relative (abs floor 1e-9 for underflow / tiny p).
   Run: node Scripts/tool-truth/test-correlation-calculator-math.js */
'use strict';
var C = require('../../tools/lib/correlation-math.js');
var cases = require('./correlation-calculator.json');

function dec(v) {
  if (v === 'Inf') return Infinity;
  if (v === '-Inf') return -Infinity;
  if (v === 'NaN') return NaN;
  return v; // number | null
}
var INFISH = 1e6;
// returns {ok, rel} ; rel is the relative error (0 for exact / Inf matches)
function cmp(got, want) {
  if (want === null || want === undefined) return { ok: got == null, rel: 0 };
  want = dec(want);
  if (!isFinite(want) || Math.abs(want) >= INFISH) {
    // R reports +/-Inf (perfect correlation) or an enormous statistic
    var g = !isFinite(got) || Math.abs(got) >= INFISH;
    var signOk = (want > 0) === (got > 0) || want === 0;
    return { ok: g && signOk, rel: 0 };
  }
  var diff = Math.abs(got - want);
  var rel = diff / Math.max(Math.abs(want), 1e-300);
  return { ok: rel <= 1e-6 || diff <= 1e-9, rel: rel };
}

var pass = 0, fail = 0, worst = 0, worstId = '', failures = [];
cases.forEach(function (c) {
  var res = C.analyze(c.x, c.y, { method: c.method, alternative: c.alternative, conf: c.conf });
  if (c.error) {
    if (res && res.error) pass++; else { fail++; failures.push(c.id + ' expected R error'); }
    return;
  }
  if (res.error) { fail++; failures.push(c.id + ' unexpected lib error: ' + res.error); return; }

  var checks = [
    ['estimate', res.r, c.estimate],
    ['statistic', res.statistic, c.statistic],
    ['p', res.p, c.p]
  ];
  if (c.method === 'pearson') {
    if (c.df != null) checks.push(['df', res.df, c.df]);
    if (c.ci_lo != null) checks.push(['ci_lo', res.ci ? res.ci[0] : null, c.ci_lo]);
    if (c.ci_hi != null) checks.push(['ci_hi', res.ci ? res.ci[1] : null, c.ci_hi]);
  }
  // sanity: the exact/approx branch R chose must match ours (stat name)
  if (c.stat_name && c.method !== 'pearson' && res.statName !== c.stat_name) {
    fail++; failures.push(c.id + ' stat-name mismatch: got ' + res.statName + ' want ' + c.stat_name);
    return;
  }
  var bad = null;
  checks.forEach(function (ch) {
    var r = cmp(ch[1], ch[2]);
    if (r.rel > worst) { worst = r.rel; worstId = c.id + '.' + ch[0]; }
    if (!r.ok && !bad) bad = ch[0] + ': got ' + ch[1] + ' want ' + dec(ch[2]) + ' (rel ' + r.rel.toExponential(2) + ')';
  });
  if (bad) { fail++; failures.push(c.id + ' [' + c.method + '/' + c.alternative + '] ' + bad); }
  else pass++;
});

console.log('cases: ' + cases.length + '  pass: ' + pass + '  fail: ' + fail);
console.log('worst relative error: ' + worst.toExponential(3) + '  (' + worstId + ')');
if (fail) {
  console.log('\nFAILURES:');
  failures.slice(0, 40).forEach(function (f) { console.log('  ' + f); });
  process.exit(1);
}
console.log('ALL PASS (<= 1e-6)');
