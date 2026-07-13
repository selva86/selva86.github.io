// Verify tools/lib/anova-math.js against the R 4.6.0 truth table.
// Run:  node Scripts/tool-truth/test-anova-output-interpreter-math.js
const M = require('../../tools/lib/anova-math.js');
const truth = JSON.parse(require('fs').readFileSync(__dirname + '/anova-output-interpreter.json', 'utf8'));
const TOL = 1e-6;      // p-values (ibeta) vs R pf
const TOL_ALG = 1e-9;  // pure algebra vs R closed forms
let pass = 0, fail = 0;

function rel(a, b) {
  if (!isFinite(a) || !isFinite(b)) return (a === b || (isNaN(a) && isNaN(b))) ? 0 : Infinity;
  return Math.abs(a - b) / Math.max(1e-300, Math.abs(b));
}
function check(id, got, want, tol) {
  const r = rel(got, want);
  if (r > (tol || TOL)) { fail++; console.log(`FAIL ${id}: got ${got} want ${want} (rel ${r.toExponential(2)})`); }
  else pass++;
}
const floor0 = x => x < 0 ? 0 : x;

// ---- real fitted models: recomputed F/p + every effect size ----
for (const m of truth.models) {
  for (const c of m.terms) {
    const s = M.termStats(c.ss, c.df, c.ss_resid, c.df_resid, c.ss_total, c.N);
    // the verified p-value (ibeta F upper tail) vs R pf
    check(`${m.name}[${c.term} F]`, s.f, c.f, TOL_ALG);
    check(`${m.name}[${c.term} p]`, s.p, c.p, TOL);
    check(`${m.name}[${c.term} pf via fromSS]`, M.fPValue(M.fFromSS(c.ss, c.df, c.ss_resid, c.df_resid), c.df, c.df_resid), c.p, TOL);
    // effect sizes vs the documented closed forms (what the tool displays)
    check(`${m.name}[${c.term} eta2]`, s.eta2, c.eta2, TOL_ALG);
    check(`${m.name}[${c.term} partialEta2]`, s.partialEta2, c.partial_eta2, TOL_ALG);
    check(`${m.name}[${c.term} omega2]`, s.omega2, c.omega2, TOL_ALG);
    check(`${m.name}[${c.term} partialOmega2]`, s.partialOmega2, c.partial_omega2, TOL_ALG);
    check(`${m.name}[${c.term} cohensF]`, s.cohensF, c.cohens_f, TOL_ALG);
    // balanced models: the same numbers effectsize returns (omega floored at 0)
    if (m.es_parity) {
      check(`${m.name}[${c.term} eta2~effectsize]`, s.eta2, c.es_eta2, TOL);
      check(`${m.name}[${c.term} pEta2~effectsize]`, s.partialEta2, c.es_partial_eta2, TOL);
      check(`${m.name}[${c.term} omega2~effectsize]`, floor0(s.omega2), c.es_omega2, TOL);
      check(`${m.name}[${c.term} pOmega2~effectsize]`, floor0(s.partialOmega2), c.es_partial_omega2, TOL);
    }
  }
}

// ---- F upper-tail edges: fPValue vs R pf, and fCDF + tail == 1 ----
truth.f_edges.forEach((c, i) => {
  check(`f_edge${i}[p]`, M.fPValue(c.f, c.df1, c.df2), c.p, TOL);
  check(`f_edge${i}[cdf]`, M.fCDF(c.f, c.df1, c.df2), c.cdf, TOL);
  check(`f_edge${i}[cdf+tail=1]`, M.fCDF(c.f, c.df1, c.df2) + M.fPValue(c.f, c.df1, c.df2), 1, TOL);
});

// ---- effect-size algebra edges ----
truth.es_edges.forEach((c, i) => {
  check(`es_edge${i}[eta2]`, M.eta2(c.ss, c.ss_total), c.eta2, TOL_ALG);
  check(`es_edge${i}[partialEta2]`, M.partialEta2(c.ss, c.ss_resid), c.partial_eta2, TOL_ALG);
  check(`es_edge${i}[omega2]`, M.omega2(c.ss, c.df, c.ms_resid, c.ss_total), c.omega2, TOL_ALG);
  check(`es_edge${i}[partialOmega2]`, M.partialOmega2(c.ss, c.df, c.ms_resid, c.N), c.partial_omega2, TOL_ALG);
  check(`es_edge${i}[cohensF]`, M.cohensF(c.partial_eta2), c.cohens_f, TOL_ALG);
});

console.log(`${pass} PASS / ${fail} FAIL (p-tol ${TOL}, algebra-tol ${TOL_ALG})`);
process.exit(fail ? 1 : 0);
