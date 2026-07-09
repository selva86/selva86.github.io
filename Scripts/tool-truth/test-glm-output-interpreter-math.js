// Verify tools/lib/glm-math.js against the R 4.6.0 truth table.
// Run:  node Scripts/tool-truth/test-glm-output-interpreter-math.js
const M = require('../../tools/lib/glm-math.js');
const truth = JSON.parse(require('fs').readFileSync(__dirname + '/glm-output-interpreter.json', 'utf8'));
const TOL = 1e-6;
let pass = 0, fail = 0;

function rel(a, b) {
  if (typeof b === 'string') return 0;                 // NA truth cells: skip
  if (!isFinite(a) || !isFinite(b)) return (a === b || (isNaN(a) && isNaN(b))) ? 0 : Infinity;
  return Math.abs(a - b) / Math.max(1e-300, Math.abs(b));
}
function check(id, got, want) {
  if (typeof want === 'string') return;                // NA / not-applicable truth
  const r = rel(got, want);
  if (r > TOL) { fail++; console.log(`FAIL ${id}: got ${got} want ${want} (rel ${r.toExponential(2)})`); }
  else pass++;
}

// ---- real fitted models ----
for (const f of truth.fits) {
  for (const c of f.coefs) {
    const s = M.coefStat(c.est, c.se, f.residDf, f.dist);
    check(`${f.name}[${c.term} stat]`, s.stat, c.stat);
    check(`${f.name}[${c.term} p]`, s.p, c.p);
    [['ci90', 0.90], ['ci95', 0.95], ['ci99', 0.99]].forEach(([k, lv]) => {
      const ci = M.coefCI(c.est, c.se, lv);
      check(`${f.name}[${c.term} ${k}lo]`, ci.lo, c[k][0]);
      check(`${f.name}[${c.term} ${k}hi]`, ci.hi, c[k][1]);
    });
    if (f.exp) {
      const e = M.expCI(c.est, c.se, 0.95);
      check(`${f.name}[${c.term} expEst]`, e.est, c.exp_est);
      check(`${f.name}[${c.term} expCI95lo]`, e.lo, c.exp_ci95[0]);
      check(`${f.name}[${c.term} expCI95hi]`, e.hi, c.exp_ci95[1]);
    }
  }
  // model-level LR test
  const lr = M.lrTest(f.nullDev, f.nullDf, f.residDev, f.residDf);
  check(`${f.name}[LR]`, lr.lr, f.lr);
  check(`${f.name}[LRdf]`, lr.df, f.lrdf);
  check(`${f.name}[LRp]`, lr.p, f.lrp);
  // deviance-ratio pseudo-R2 + GOF + BIC-from-AIC
  check(`${f.name}[devratio]`, M.pseudoR2(f.nullDev, f.residDev), f.devratio);
  check(`${f.name}[gofp]`, M.devianceGOF(f.residDev, f.residDf), f.gofp);
  check(`${f.name}[bicFromAic]`, M.bicFromAic(f.aic, f.k, f.n), f.bic);
}

// ---- nested chi-square tests ----
truth.nested_chisq.forEach(n => {
  const r = M.nestedChisq(n.devSmall, n.dfSmall, n.devBig, n.dfBig);
  check(`nested_chisq_${n.name}[dev]`, r.dev, n.dev);
  check(`nested_chisq_${n.name}[df]`, r.df, n.df);
  check(`nested_chisq_${n.name}[p]`, r.p, n.p);
});

// ---- nested quasi F tests ----
truth.nested_f.forEach(n => {
  const r = M.nestedF(n.devSmall, n.dfSmall, n.devBig, n.dfBig, n.phiBig);
  check(`nested_f_${n.name}[f]`, r.f, n.f);
  check(`nested_f_${n.name}[df1]`, r.df1, n.df);
  check(`nested_f_${n.name}[df2]`, r.df2, n.dfBig);
  check(`nested_f_${n.name}[p]`, r.p, n.p);
});

// ---- chi-square upper-tail edges ----
truth.chisq_edges.forEach((c, i) => {
  check(`chisq_edge${i}`, M.chisqUpper(c.x, c.k), c.upper);
});

// ---- F upper-tail edges ----
truth.f_edges.forEach((c, i) => {
  check(`f_edge${i}`, M.fUpperTail(c.f, c.df1, c.df2), c.p);
});

// ---- z-family coefficient edges ----
truth.coef_z_edges.forEach((c, i) => {
  const s = M.coefStat(c.est, c.se, null, 'z');
  check(`coef_z_edge${i}[stat]`, s.stat, c.stat);
  check(`coef_z_edge${i}[p]`, s.p, c.p);
  [['ci90', 0.90], ['ci95', 0.95], ['ci99', 0.99]].forEach(([k, lv]) => {
    const ci = M.coefCI(c.est, c.se, lv);
    check(`coef_z_edge${i}[${k}lo]`, ci.lo, c[k][0]);
    check(`coef_z_edge${i}[${k}hi]`, ci.hi, c[k][1]);
  });
  const e = M.expCI(c.est, c.se, 0.95);
  check(`coef_z_edge${i}[expEst]`, e.est, c.exp_est);
  check(`coef_z_edge${i}[expCI95lo]`, e.lo, c.exp_ci95[0]);
  check(`coef_z_edge${i}[expCI95hi]`, e.hi, c.exp_ci95[1]);
});

// ---- t-family coefficient edges ----
truth.coef_t_edges.forEach((c, i) => {
  const s = M.coefStat(c.est, c.se, c.df, 't');
  check(`coef_t_edge${i}[stat]`, s.stat, c.stat);
  check(`coef_t_edge${i}[p]`, s.p, c.p);
  [['ci90', 0.90], ['ci95', 0.95], ['ci99', 0.99]].forEach(([k, lv]) => {
    const ci = M.coefCI(c.est, c.se, lv);
    check(`coef_t_edge${i}[${k}lo]`, ci.lo, c[k][0]);
    check(`coef_t_edge${i}[${k}hi]`, ci.hi, c[k][1]);
  });
});

// ---- BIC-from-AIC edges ----
truth.bic_edges.forEach((b, i) => {
  check(`bic_edge${i}`, M.bicFromAic(b.aic, b.k, b.n), b.bic);
});

console.log(`${pass} PASS / ${fail} FAIL (tolerance ${TOL})`);
process.exit(fail ? 1 : 0);
