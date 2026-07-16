/* Harness: tools/lib/icc-math.js vs Scripts/tool-truth/icc-calculator.json
   (ground truth = R psych::ICC(x, lmer = FALSE) on R 4.6.0).

   Gate: every comparable field at <= 1e-6 relative.

   ONE documented waiver, applied by a rule rather than by case name:
     when the residual sum of squares is exactly zero (raters agree perfectly,
     or differ by an exact constant), this library computes SSE in closed form
     and gets 0, so the residual F is +Infinity and p is 0 -- the true
     mathematical limit. R's aov reaches SSE by QR decomposition and lands on
     ~1e-14..1e-28 of floating-point cancellation noise instead, so it prints
     F ~ 1e31 and a denormal p. Those R numbers track the BLAS, not the data,
     and both encode the same fact: infinitely strong evidence. So where R's
     own F exceeds 1e20 (its noise signature) F, p and MSE are waived and
     replaced by a limit assertion. Every ICC estimate and every confidence
     bound is still compared with no waiver, including in those cases -- which
     is the part that actually matters, and is what caught the ICC2 bug where
     a vanishing residual must NOT drive absolute agreement to 1. Every other
     field of every other case is compared outright. */
const fs = require('fs');
const path = require('path');
const ICC = require('../../tools/lib/icc-math.js');

const truth = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'icc-calculator.json'), 'utf8')
);

const TOL = 1e-6;
let checks = 0, fails = 0, waived = 0;
let worst = { rel: 0, where: '' };

function rel(got, want) {
  if (Number.isNaN(got) && Number.isNaN(want)) return 0;
  if (got === want) return 0;
  if (!isFinite(got) || !isFinite(want)) return Infinity;
  const d = Math.abs(got - want);
  const scale = Math.max(Math.abs(want), 1e-8);
  return d / scale;
}

function cmp(where, got, want) {
  checks++;
  const r = rel(got, want);
  if (r > worst.rel) worst = { rel: r, where };
  if (!(r <= TOL)) {
    fails++;
    console.log(`  FAIL ${where}: got ${got}  want ${want}  rel ${r.toExponential(3)}`);
  }
}

for (const c of truth) {
  const res = ICC.analyze(c.matrix, c.alpha);
  const tag = `${c.name}[a=${c.alpha}]`;
  // R's residual F blows past 1e20 exactly when its SSE is cancellation noise.
  const noisyResidual = c.MSE < c.MSB * 1e-12;

  // --- the ANOVA the whole thing rests on ---
  cmp(`${tag}.MSB`, res.anova.MSB, c.MSB);
  cmp(`${tag}.MSJ`, res.anova.MSJ, c.MSJ);
  cmp(`${tag}.MSW`, res.anova.MSW, c.MSW);
  cmp(`${tag}.SSB`, res.anova.SSB, c.SSB);
  cmp(`${tag}.SSJ`, res.anova.SSJ, c.SSJ);
  cmp(`${tag}.dfB`, res.anova.dfB, c.dfB);
  cmp(`${tag}.dfE`, res.anova.dfE, c.dfE);
  if (noisyResidual) {
    waived++;
    if (!(res.anova.MSE === 0)) {
      fails++;
      console.log(`  FAIL ${tag}.MSE: expected exact 0 vs R's noise ${c.MSE}, got ${res.anova.MSE}`);
    }
  } else {
    cmp(`${tag}.MSE`, res.anova.MSE, c.MSE);
  }

  // --- all six ICC rows ---
  for (let i = 0; i < 6; i++) {
    const row = res.rows[i];
    const ty = c.type[i];
    if (row.type !== ty) {
      fails++;
      console.log(`  FAIL ${tag}: row ${i} is ${row.type}, R says ${ty}`);
      continue;
    }
    cmp(`${tag}.${ty}.ICC`, row.icc, c.ICC[i]);
    cmp(`${tag}.${ty}.df1`, row.df1, c.df1[i]);
    cmp(`${tag}.${ty}.df2`, row.df2, c.df2[i]);
    cmp(`${tag}.${ty}.lower`, row.lower, c.lower[i]);
    cmp(`${tag}.${ty}.upper`, row.upper, c.upper[i]);

    if (noisyResidual && c.F[i] > 1e20) {
      // Waived: see header. Assert the limit is still the right KIND of answer.
      // Note this only fires for the rows driven by the residual F; ICC1/ICC1k
      // ride on MSW and are compared normally even in these cases.
      waived += 2;
      if (!(row.F === Infinity)) {
        fails++;
        console.log(`  FAIL ${tag}.${ty}.F: expected Infinity vs R's ${c.F[i]}, got ${row.F}`);
      }
      if (!(row.p === 0 && c.p[i] < 1e-100)) {
        fails++;
        console.log(`  FAIL ${tag}.${ty}.p: expected 0 vs R's <1e-100, got ${row.p} / ${c.p[i]}`);
      }
    } else {
      cmp(`${tag}.${ty}.F`, row.F, c.F[i]);
      cmp(`${tag}.${ty}.p`, row.p, c.p[i]);
    }
  }
}

// --- the picker maps answers onto the right Shrout & Fleiss name ---
const pick = [
  ['oneway', 'absolute', 'single', 'ICC1'],
  ['oneway', 'consistency', 'average', 'ICC1k'],
  ['random', 'absolute', 'single', 'ICC2'],
  ['random', 'absolute', 'average', 'ICC2k'],
  ['random', 'consistency', 'single', 'ICC3'],
  ['fixed', 'absolute', 'single', 'ICC3'],
  ['fixed', 'consistency', 'average', 'ICC3k']
];
for (const [d, a, u, want] of pick) {
  checks++;
  const got = ICC.recommend(d, a, u).type;
  if (got !== want) {
    fails++;
    console.log(`  FAIL recommend(${d},${a},${u}): got ${got} want ${want}`);
  }
}

console.log(`\nicc-math vs psych::ICC(lmer=FALSE): ${checks} checks, ${fails} failures, ` +
            `${waived} waived (perfect-agreement F/p only)`);
console.log(`worst relative error: ${worst.rel.toExponential(3)} at ${worst.where}`);
if (fails) { console.log('\nGATE: FAIL'); process.exit(1); }
console.log('GATE: PASS');
