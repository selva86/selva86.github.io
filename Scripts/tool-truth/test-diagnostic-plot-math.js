/* Gate diagnostic-math.js against the R + lmtest truth table.
 * Run: node Scripts/tool-truth/test-diagnostic-plot-math.js
 * Datasets are frozen in diagnostic-plot.json (also embedded verbatim in the
 * page), so R, the library and the page all operate on identical numbers. */
const fs = require('fs');
const path = require('path');
const DM = require('../../tools/lib/diagnostic-math.js');

const truth = JSON.parse(fs.readFileSync(path.join(__dirname, 'diagnostic-plot.json'), 'utf8'));
const TOL = 1e-6;
let fails = 0, checks = 0;

function eq(label, got, want) {
  checks++;
  if (want === null || want === undefined) return;
  if (typeof want === 'number' && !isFinite(want)) {
    if (!(typeof got === 'number' && !isFinite(got))) { fails++; console.log(`FAIL ${label}: got ${got} want ${want}`); }
    return;
  }
  const rel = Math.abs(got - want) / (Math.abs(want) > 1 ? Math.abs(want) : 1);
  if (!(rel <= TOL)) { fails++; console.log(`FAIL ${label}: got ${got} want ${want} (rel ${rel.toExponential(2)})`); }
}
function eqArr(label, got, want) {
  if (!want) return;
  if (got.length !== want.length) { fails++; checks++; console.log(`FAIL ${label}: length ${got.length} vs ${want.length}`); return; }
  for (let i = 0; i < want.length; i++) eq(`${label}[${i}]`, got[i], want[i]);
}

for (const id of Object.keys(truth.cases)) {
  const c = truth.cases[id];
  const ds = truth.datasets[id];
  const rows = ds.rows;
  const y = rows.map(r => r[0]);
  const npred = ds.cols.length - 1;
  const predictors = [];
  for (let j = 1; j <= npred; j++) predictors.push(rows.map(r => r[j]));

  const r = DM.analyze(y, predictors, { outThresh: 2, cookK: 4 });
  if (r.error) { fails++; console.log(`FAIL ${id}: ${r.error}`); continue; }

  eq(`${id}.n`, r.n, c.n);
  eq(`${id}.p`, r.p, c.p);
  eq(`${id}.dfResid`, r.dfResid, c.df_resid);
  eqArr(`${id}.coef`, r.beta, c.coef);
  eq(`${id}.sigma`, r.sigma, c.sigma);
  eq(`${id}.r2`, r.rSquared, c.r_squared);
  eq(`${id}.adjR2`, r.adjRSquared, c.adj_r2);
  eqArr(`${id}.fitted`, r.fitted, c.fitted);
  eqArr(`${id}.resid`, r.resid, c.resid);
  eqArr(`${id}.hat`, r.hat, c.hat);
  eqArr(`${id}.rstandard`, r.rstandard, c.rstandard);
  eqArr(`${id}.cooks`, r.cooks, c.cooks);
  eqArr(`${id}.qqTheo`, r.qqTheo, c.qq_theo);

  eq(`${id}.bp_stat`, r.bp.stat, c.bp_stat);
  eq(`${id}.bp_df`, r.bp.df, c.bp_df);
  eq(`${id}.bp_p`, r.bp.p, c.bp_p);
  eq(`${id}.reset_stat`, r.reset.stat, c.reset_stat);
  eq(`${id}.reset_df1`, r.reset.df1, c.reset_df1);
  eq(`${id}.reset_df2`, r.reset.df2, c.reset_df2);
  eq(`${id}.reset_p`, r.reset.p, c.reset_p);
  eq(`${id}.sw_W`, r.shapiro.W, c.sw_W);
  eq(`${id}.sw_p`, r.shapiro.p, c.sw_p);
  eq(`${id}.dw`, r.dw, c.dw_stat);
  eq(`${id}.n_out2`, r.nOut, c.n_out2);
  eq(`${id}.n_cook_4n`, r.nCook, c.n_cook_4n);

  // residuals-mode: feed the fit's residuals + fitted back in
  const rr = DM.analyzeResiduals(r.resid, r.fitted, { outThresh: 2 });
  eq(`${id}.resid_bp_stat`, rr.bp.stat, c.resid_bp_stat);
  eq(`${id}.resid_bp_p`, rr.bp.p, c.resid_bp_p);
  eq(`${id}.resid_reset_stat`, rr.reset.stat, c.resid_reset_stat);
  eq(`${id}.resid_reset_p`, rr.reset.p, c.resid_reset_p);
  eq(`${id}.resid_sw_p`, rr.shapiro.p, c.sw_p);
  eq(`${id}.resid_dw`, rr.dw, c.dw_stat);
}

console.log(`\n${checks} checks, ${fails} failures  (TOL ${TOL})`);
process.exit(fails ? 1 : 0);
