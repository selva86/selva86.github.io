/* Harness: tools/lib/posterior-math.js vs R 4.6.0 closed-form conjugate updates.
   Run: node Scripts/tool-truth/test-posterior-calculator-math.js
   Gate: every case <= 1e-6 relative. */
const P = require('../../tools/lib/posterior-math.js');
const truth = require('./posterior-calculator.json');

let checks = 0, fails = 0, worst = 0, worstAt = '';

function rel(got, want) {
  if (want === 0) return Math.abs(got) < 1e-300 ? 0 : Math.abs(got);
  if (!isFinite(want)) return (got === want) ? 0 : Infinity;
  return Math.abs(got - want) / Math.abs(want);
}
function ck(label, field, got, want, tol) {
  tol = tol || 1e-6;
  checks++;
  const r = rel(got, want);
  if (r > worst && isFinite(r)) { worst = r; worstAt = `${label} :: ${field}`; }
  if (!(r <= tol)) {
    fails++;
    console.log(`FAIL ${label} :: ${field}\n     got  ${got}\n     want ${want}\n     rel  ${r}`);
  }
}

for (const c of truth) {
  const inp = Object.assign({}, c.inp, { level: c.level });
  const r = P.analyze(c.family, inp);
  const L = `[${c.family}] ${c.label} @${c.level}`;
  if (!r.ok) { fails++; console.log(`FAIL ${L} :: rejected -> ${r.errors.join('; ')}`); continue; }

  // posterior parameters (the closed-form update itself)
  if (c.family === 'normal-normal') {
    ck(L, 'm1', r.post.m, c.m1);
    ck(L, 's1', r.post.s, c.s1);
    ck(L, 'n0 (prior pseudo-observations)', r.priorObs, c.n0);
    ck(L, 'se', r.se, c.se);
  } else {
    ck(L, 'a1', r.post.a, c.a1);
    ck(L, 'b1', r.post.b, c.b1);
  }

  // moments + quantiles
  ck(L, 'priorMean', r.priorMean, c.priorMean);
  ck(L, 'mle', r.mle, c.mle);
  ck(L, 'mean', r.mean, c.mean);
  ck(L, 'sd', r.sd, c.sd);
  ck(L, 'median', r.median, c.median);
  ck(L, 'lo', r.lo, c.lo);
  ck(L, 'hi', r.hi, c.hi);
  ck(L, 'priorLo', r.priorLo, c.priorLo);
  ck(L, 'priorHi', r.priorHi, c.priorHi);

  // the three plotted curves
  c.xs.forEach((x, i) => {
    ck(L, `dPrior(${x})`, r.dPrior(x), c.dPrior[i]);
    ck(L, `dPost(${x})`, r.dPost(x), c.dPost[i]);
    ck(L, `dLik(${x})`, r.dLik(x), c.dLik[i]);
  });

  // free identity: the posterior mean IS the pseudo-count weighted average of
  // the prior mean and the data estimate. Holds in all three families.
  if (isFinite(r.mle) && isFinite(r.priorMean)) {
    const blend = r.w * r.priorMean + (1 - r.w) * r.mle;
    ck(L, 'weighted-average identity', blend, c.mean, 1e-9);
  }
  // free identity: the posterior CDF must invert its own quantiles.
  [0.05, 0.5, 0.9].forEach(p => {
    const q = r.qPost(p);
    if (isFinite(q) && q > 0 && r.pPost(q) > 1e-12) ck(L, `round-trip p=${p}`, r.pPost(q), p, 1e-6);
  });
}

// Validation must reject junk with a human message, not compute nonsense.
const bad = [
  ['beta-binomial', { a0: 0, b0: 1, s: 1, n: 2 }],
  ['beta-binomial', { a0: 1, b0: 1, s: 5, n: 2 }],
  ['beta-binomial', { a0: 1, b0: 1, s: 1.5, n: 2 }],
  ['normal-normal', { m0: 0, s0: 0, xbar: 1, n: 2, sigma: 1 }],
  ['normal-normal', { m0: 0, s0: 1, xbar: 1, n: 0, sigma: 1 }],
  ['gamma-poisson', { a0: 1, b0: 0, y: 3, t: 5 }],
  ['gamma-poisson', { a0: 1, b0: 1, y: -2, t: 5 }],
  ['gamma-poisson', { a0: 1, b0: 1, y: 3, t: 0 }]
];
for (const [fam, inp] of bad) {
  checks++;
  const r = P.analyze(fam, inp);
  if (r.ok || !r.errors.length) { fails++; console.log(`FAIL validation accepted junk: ${fam} ${JSON.stringify(inp)}`); }
}

console.log(`\n${checks - fails}/${checks} checks pass | worst rel ${worst.toExponential(2)} at ${worstAt}`);
process.exit(fails ? 1 : 0);
