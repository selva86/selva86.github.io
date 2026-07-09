// Verify tools/lib/lm-math.js against the R 4.6.0 truth table.
// Run:  node Scripts/tool-truth/test-lm-output-interpreter-math.js
const M = require('../../tools/lib/lm-math.js');
const truth = JSON.parse(require('fs').readFileSync(__dirname + '/lm-output-interpreter.json', 'utf8'));
const TOL = 1e-6;
let pass = 0, fail = 0;

function rel(a, b) {
  if (!isFinite(a) || !isFinite(b)) return (a === b || (isNaN(a) && isNaN(b))) ? 0 : Infinity;
  return Math.abs(a - b) / Math.max(1e-300, Math.abs(b));
}
function check(id, got, want) {
  const r = rel(got, want);
  if (r > TOL) { fail++; console.log(`FAIL ${id}: got ${got} want ${want} (rel ${r.toExponential(2)})`); }
  else pass++;
}

// ---- real fitted models: coef t/p/CI, F p, adjR2, R2<->F, AIC/BIC/logLik ----
for (const m of truth.models) {
  for (const c of m.coefs) {
    const s = M.coefStats(c.estimate, c.se, c.df);
    check(`${m.name}[${c.term} t]`, s.t, c.t);
    check(`${m.name}[${c.term} p]`, s.p, c.p);
    const ci90 = M.coefCI(c.estimate, c.se, c.df, 0.90);
    const ci95 = M.coefCI(c.estimate, c.se, c.df, 0.95);
    const ci99 = M.coefCI(c.estimate, c.se, c.df, 0.99);
    check(`${m.name}[${c.term} ci90lo]`, ci90.lo, c.ci90[0]);
    check(`${m.name}[${c.term} ci90hi]`, ci90.hi, c.ci90[1]);
    check(`${m.name}[${c.term} ci95lo]`, ci95.lo, c.ci95[0]);
    check(`${m.name}[${c.term} ci95hi]`, ci95.hi, c.ci95[1]);
    check(`${m.name}[${c.term} ci99lo]`, ci99.lo, c.ci99[0]);
    check(`${m.name}[${c.term} ci99hi]`, ci99.hi, c.ci99[1]);
  }
  check(`${m.name}[Fp]`, M.fPValue(m.f, m.df1, m.df2), m.fp);
  check(`${m.name}[fCDF+fP=1]`, M.fCDF(m.f, m.df1, m.df2) + M.fPValue(m.f, m.df1, m.df2), 1);
  check(`${m.name}[adjR2]`, M.adjR2(m.r2, m.n, m.df1), m.adjr2);
  check(`${m.name}[r2FromF]`, M.r2FromF(m.f, m.df1, m.df2), m.r2);
  check(`${m.name}[logLik]`, M.logLik(m.n, m.rss), m.loglik);
  check(`${m.name}[AIC]`, M.aic(m.n, m.rss, m.npar), m.aic);
  check(`${m.name}[BIC]`, M.bic(m.n, m.rss, m.npar), m.bic);
  // round-trip sigma -> RSS
  check(`${m.name}[RSSfromSigma]`, M.rssFromSigma(m.sigma, m.dfres), m.rss);
}

// ---- synthetic coefficient edges ----
truth.coef_edges.forEach((c, i) => {
  const s = M.coefStats(c.estimate, c.se, c.df);
  check(`coef_edge${i}[t]`, s.t, c.t);
  check(`coef_edge${i}[p]`, s.p, c.p);
  [['ci90', 0.90], ['ci95', 0.95], ['ci99', 0.99]].forEach(([k, lv]) => {
    const ci = M.coefCI(c.estimate, c.se, c.df, lv);
    check(`coef_edge${i}[${k}lo]`, ci.lo, c[k][0]);
    check(`coef_edge${i}[${k}hi]`, ci.hi, c[k][1]);
  });
});

// ---- F upper-tail edges ----
truth.f_edges.forEach((c, i) => {
  check(`f_edge${i}[fp]`, M.fPValue(c.f, c.df1, c.df2), c.fp);
});

// ---- adjusted R2 edges ----
truth.adj_edges.forEach((c, i) => {
  check(`adj_edge${i}`, M.adjR2(c.r2, c.n, c.k), c.adjr2);
});

// ---- R2 <-> F edges ----
truth.r2_edges.forEach((c, i) => {
  check(`r2_edge${i}[r2FromF]`, M.r2FromF(c.f, c.df1, c.df2), c.r2);
  check(`r2_edge${i}[fFromR2]`, M.fFromR2(c.r2, c.df1, c.df2), c.f);
});

// ---- nested-anova F-test ----
truth.nested.forEach((c) => {
  const r = M.nestedF(c.rss_s, c.df_s, c.rss_b, c.df_b);
  check(`nested_${c.name}[f]`, r.f, c.f);
  check(`nested_${c.name}[df1]`, r.df1, c.df1);
  check(`nested_${c.name}[df2]`, r.df2, c.df2);
  check(`nested_${c.name}[p]`, r.p, c.p);
});

// ---- information-criteria reconstruction ----
truth.ic_edges.forEach((c, i) => {
  check(`ic_edge${i}[logLik]`, M.logLik(c.n, c.rss), c.loglik);
  check(`ic_edge${i}[AIC]`, M.aic(c.n, c.rss, c.npar), c.aic);
  check(`ic_edge${i}[BIC]`, M.bic(c.n, c.rss, c.npar), c.bic);
});

console.log(`${pass} PASS / ${fail} FAIL (tolerance ${TOL})`);
process.exit(fail ? 1 : 0);
