/* Gate for tools/lib/prediction-interval-math.js against the R truth table.
   Run: node Scripts/tool-truth/test-prediction-interval-calculator-math.js
   Pass bar: every case at <= 1e-6 relative error (we aim far better).

   Checks, per dataset: b0, b1, se(b0), se(b1), t(b1), p(b1), sigma, df, r2,
   adj r2, xbar, Sxx. Then per (x0, level) cell: the shared fit, se.fit,
   se.pred, and BOTH interval endpoints and widths from predict.lm. */
'use strict';
const fs = require('fs');
const path = require('path');
const PI = require('../../tools/lib/prediction-interval-math.js');

const truth = JSON.parse(fs.readFileSync(
  path.join(__dirname, 'prediction-interval-calculator.json'), 'utf8'));

const TOL = 1e-6;
let checks = 0, fails = 0, worst = 0, worstWhat = '';

function rel(got, want) {
  if (!isFinite(got) || !isFinite(want)) return got === want ? 0 : Infinity;
  const d = Math.abs(got - want);
  const s = Math.max(Math.abs(want), 1e-9);
  return Math.abs(want) < 1e-8 ? d : d / s;   // absolute near zero
}
function check(what, got, want) {
  checks++;
  const e = rel(got, want);
  if (e > worst) { worst = e; worstWhat = what; }
  if (!(e <= TOL)) {
    fails++;
    if (fails <= 12) console.log(`  FAIL ${what}\n       got  ${got}\n       want ${want}\n       rel  ${e}`);
  }
}

// ---- t quantiles first: if qt is off, everything downstream is off ----------
const TT = require('../../tools/lib/ttest-math.js');
for (const t of truth.tquantiles) {
  check(`qt(df=${t.df}, level=${t.level})`, TT.tQuantile(1 - (1 - t.level) / 2, t.df), t.q);
}
console.log(`t quantiles: ${truth.tquantiles.length} checked`);

// ---- per-dataset fit + every cell ------------------------------------------
for (const c of truth.cases) {
  const f = PI.fit(c.x, c.y);
  if (!f.ok) { console.log(`  FAIL ${c.name}: fit not ok (${f.reason})`); fails++; continue; }

  check(`${c.name}.b0`, f.b0, c.b0);
  check(`${c.name}.b1`, f.b1, c.b1);
  check(`${c.name}.seB0`, f.seB0, c.se_b0);
  check(`${c.name}.seB1`, f.seB1, c.se_b1);
  check(`${c.name}.tB1`, f.tB1, c.t_b1);
  check(`${c.name}.pB1`, f.pB1, c.p_b1);
  check(`${c.name}.sigma`, f.sigma, c.sigma);
  check(`${c.name}.df`, f.df, c.df);
  check(`${c.name}.r2`, f.r2, c.r2);
  check(`${c.name}.adjr2`, f.adjr2, c.adjr2);
  check(`${c.name}.xbar`, f.xbar, c.xbar);
  check(`${c.name}.sxx`, f.sxx, c.sxx);

  for (const cell of c.cells) {
    const p = PI.predictAt(f, cell.x0, cell.level);
    const tag = `${c.name}@x0=${cell.x0},L=${cell.level}`;
    check(`${tag}.fit`, p.fit, cell.fit);
    check(`${tag}.se_fit`, p.seFit, cell.se_fit);
    check(`${tag}.se_pred`, p.sePred, cell.se_pred);
    check(`${tag}.ci_lo`, p.ci.lo, cell.ci_lo);
    check(`${tag}.ci_hi`, p.ci.hi, cell.ci_hi);
    check(`${tag}.pi_lo`, p.pi.lo, cell.pi_lo);
    check(`${tag}.pi_hi`, p.pi.hi, cell.pi_hi);
    check(`${tag}.ci_width`, p.ci.width, cell.ci_width);
    check(`${tag}.pi_width`, p.pi.width, cell.pi_width);

    // Invariants the whole page teaches; assert them, do not assume them.
    if (!(p.pi.width > p.ci.width)) {
      fails++; console.log(`  FAIL ${tag}: PI not wider than CI`);
    }
    const expectExtrap = cell.x0 < c.xmin || cell.x0 > c.xmax;
    if (p.extrapolating !== expectExtrap) {
      fails++; console.log(`  FAIL ${tag}: extrapolation flag ${p.extrapolating} want ${expectExtrap}`);
    }
  }
}

// ---- structural: the bands must be narrowest exactly at xbar ---------------
for (const c of truth.cases) {
  const f = PI.fit(c.x, c.y);
  const atBar = PI.predictAt(f, f.xbar, 0.95);
  for (const off of [0.25, 1, 3, 10]) {
    for (const s of [-1, 1]) {
      const away = PI.predictAt(f, f.xbar + s * off * Math.sqrt(f.sxx / f.n), 0.95);
      checks += 2;
      if (!(away.ci.width >= atBar.ci.width - 1e-12)) { fails++; console.log(`  FAIL ${c.name}: CI not minimal at xbar`); }
      if (!(away.pi.width >= atBar.pi.width - 1e-12)) { fails++; console.log(`  FAIL ${c.name}: PI not minimal at xbar`); }
    }
  }
}

// ---- parse + error paths ---------------------------------------------------
function expectReason(text, reason, label) {
  checks++;
  const r = PI.parseXY(text);
  if (r.ok || r.reason !== reason) {
    fails++; console.log(`  FAIL parse ${label}: ok=${r.ok} reason=${r.reason} want ${reason}`);
  }
}
expectReason('', 'empty', 'empty string');
expectReason('   \n  \n', 'empty', 'whitespace only');
expectReason('1\n2\n3\n4', 'onecol', 'single column');
expectReason('a b\nc d\ne f', 'nonumeric', 'no numbers');

// Happy paths: headers, delimiters, NA rows.
(function () {
  const good = [
    ['x,y\n1,2\n2,4\n3,6', 3, 0, 'comma + header'],
    ['1\t2\n2\t4\n3\t6', 3, 0, 'tab'],
    ['1 2\n2 4\n3 6', 3, 0, 'space'],
    ['1;2\n2;4\n3;6', 3, 0, 'semicolon'],
    ['x,y\n1,2\n2,NA\n3,6\n4,8', 3, 1, 'NA row dropped'],
    ['x,y\n1,2\n,\n3,6\n4,8', 3, 1, 'blank cells dropped'],
  ];
  for (const [txt, n, dropped, label] of good) {
    checks++;
    const r = PI.parseXY(txt);
    if (!r.ok || r.n !== n || r.dropped !== dropped) {
      fails++;
      console.log(`  FAIL parse ${label}: ok=${r.ok} n=${r.n} (want ${n}) dropped=${r.dropped} (want ${dropped})`);
    }
  }
})();

// n<3 and zero-variance x must be refused, not silently NaN'd.
(function () {
  checks += 2;
  const tooFew = PI.fit([1, 2], [3, 4]);
  if (tooFew.ok || tooFew.reason !== 'n') { fails++; console.log('  FAIL n=2 not refused'); }
  const flat = PI.fit([5, 5, 5, 5], [1, 2, 3, 4]);
  if (flat.ok || flat.reason !== 'sxx') { fails++; console.log('  FAIL zero-variance x not refused'); }
})();

// The parsed default preset must reproduce the R fit end to end.
(function () {
  const d = truth.cases[0];
  const pasted = d.x.map((v, i) => `${v},${d.y[i]}`).join('\n');
  const r = PI.parseXY('hours,score\n' + pasted);
  checks++;
  if (!r.ok || r.n !== d.n) { fails++; console.log('  FAIL default preset round-trip parse'); }
  const f = PI.fit(r.x, r.y);
  check('preset_roundtrip.b1', f.b1, d.b1);
  check('preset_roundtrip.sigma', f.sigma, d.sigma);
})();

console.log(`\nchecks: ${checks}   fails: ${fails}`);
console.log(`worst relative error: ${worst.toExponential(3)}  (${worstWhat})`);
if (fails) { console.log('GATE: FAIL'); process.exit(1); }
console.log('GATE: PASS (all within 1e-6)');
