// Verify tools/lib/ttest-math.js against the R 4.6.0 truth table.
const M = require('../../tools/lib/ttest-math.js');
const fs = require('fs');
const truthRaw = fs.readFileSync(__dirname + '/t-test.json', 'utf8').replace(/\bInf\b/g, '1e999').replace(/-1e999/g, '-1e999');
const truth = JSON.parse(truthRaw.replace(/1e999/g, '9e307'));  // stand-in for Inf

function exactVec(m, s, n) {
  // replicate R's m + s*scale(1:n) exactly
  const z = Array.from({length: n}, (_, i) => i + 1);
  const zm = M.mean(z), zs = M.sd(z);
  return z.map(v => m + s * (v - zm) / zs);
}

const cases = {
  welch_default_two:      () => M.welchSummary(84.2, 6.1, 24, 79.6, 7.4, 26, 'two', 0.95),
  welch_default_greater:  () => M.welchSummary(84.2, 6.1, 24, 79.6, 7.4, 26, 'greater', 0.95),
  welch_nonsig:           () => M.welchSummary(50.0, 10.0, 15, 51.2, 9.5, 17, 'two', 0.95),
  welch_raw:              () => M.welchRaw([12.1,14.3,11.8,13.6,15.2,12.9,14.8,13.1],
                                           [10.4,11.9,12.3,10.8,11.1,12.6,10.2], 'two', 0.95),
  onesample_two:          () => M.oneSampleSummary(104.3, 12.5, 30, 100, 'two', 0.95),
  onesample_less:         () => M.oneSampleRaw([4.2,4.8,5.1,3.9,4.5,4.1,4.7,4.4,4.0,4.6], 5, 'less', 0.95),
  paired_two:             () => M.pairedRaw([75,70,79,74,68,74,77,70,76,70,74,72],
                                            [72,68,75,71,66,70,74,69,73,67,71,70], 'two', 0.95),
  welch_tiny:             () => M.welchSummary(10, 1, 3, 8, 1.5, 3, 'two', 0.95),
  welch_equal:            () => M.welchSummary(20, 4, 12, 20, 4, 12, 'two', 0.95),
  welch_huge:             () => M.welchSummary(100, 5, 40, 60, 5, 40, 'two', 0.95),
  welch_ci99:             () => M.welchSummary(84.2, 6.1, 24, 79.6, 7.4, 26, 'two', 0.99),
};

function rel(a, b) {
  if (!isFinite(a) && !isFinite(b)) return 0;
  if (a === 0 && b === 0) return 0;
  return Math.abs(a - b) / Math.max(1e-12, Math.abs(b));
}

let pass = 0, fail = 0;
for (const row of truth) {
  const got = cases[row.id]();
  const checks = [
    ['t',  got.t,     row.t,    1e-8],
    ['df', got.df,    row.df,   1e-8],
    ['p',  got.p,     row.p,    1e-7],
    ['lo', got.ci[0], row.ci_lo, 1e-7],
    ['hi', got.ci[1], row.ci_hi, 1e-7],
    ['d',  got.d,     row.d,    1e-3],   // one-sample d in R script was rounded
  ];
  const bad = checks.filter(([k, g, w, tol]) => {
    if (w >= 9e307) return !(g === Infinity || g >= 9e307);
    if (w <= -9e307) return !(g === -Infinity || g <= -9e307);
    return rel(g, w) > tol;
  });
  if (bad.length) {
    fail++;
    console.log(`FAIL ${row.id}:`);
    bad.forEach(([k, g, w]) => console.log(`   ${k}: got ${g}  want ${w}  (rel ${rel(g, w).toExponential(2)})`));
  } else {
    pass++;
    console.log(`PASS ${row.id}  (t=${got.t.toFixed(6)}, p=${got.p.toExponential(4)})`);
  }
}
console.log(`\n${pass} PASS / ${fail} FAIL of ${truth.length}`);
process.exit(fail ? 1 : 0);
