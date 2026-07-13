/* Gate roc-math.js against the R/pROC truth table. Run: node test-roc-auc-math.js
 * Datasets are frozen in roc-auc.json (also embedded verbatim in the page), so the
 * library, the page and R all operate on identical numbers. */
const fs = require('fs');
const path = require('path');
const RM = require('../../tools/lib/roc-math.js');

const truth = JSON.parse(fs.readFileSync(path.join(__dirname, 'roc-auc.json'), 'utf8'));
const TOL = 1e-6;
let fails = 0, checks = 0;

function eq(label, got, want) {
  checks++;
  if (want === null || want === undefined) return;      // skipped in R (e.g. NaN)
  if (typeof want === 'number' && !isFinite(want)) {
    if (!(typeof got === 'number' && !isFinite(got))) { fails++; console.log(`FAIL ${label}: got ${got} want ${want}`); }
    return;
  }
  // NaN-vs-NaN treated equal (ppv/npv at boundaries)
  if (typeof got === 'number' && isNaN(got) && (want === null || isNaN(want))) return;
  const rel = Math.abs(got - want) / (Math.abs(want) > 1 ? Math.abs(want) : 1);
  if (!(rel <= TOL)) { fails++; console.log(`FAIL ${label}: got ${got} want ${want} (rel ${rel.toExponential(2)})`); }
}

for (const id of Object.keys(truth.cases)) {
  const c = truth.cases[id];
  const ds = truth.datasets[id];
  const y = ds.y, score = ds.score;

  const d = RM.delong(y, score);
  eq(`${id}.auc`, d.auc, c.auc);
  eq(`${id}.var`, d.variance, c.var);
  eq(`${id}.se`, d.se, c.se);
  eq(`${id}.n_pos`, d.n_pos, c.n_pos);
  eq(`${id}.n_neg`, d.n_neg, c.n_neg);

  const ci95 = RM.ciAuc(d.auc, d.se, 0.95);
  eq(`${id}.ci95.lo`, ci95[0], c.ci95[0]);
  eq(`${id}.ci95.hi`, ci95[1], c.ci95[1]);
  const ci90 = RM.ciAuc(d.auc, d.se, 0.90);
  eq(`${id}.ci90.lo`, ci90[0], c.ci90[0]);
  eq(`${id}.ci90.hi`, ci90[1], c.ci90[1]);
  const ci99 = RM.ciAuc(d.auc, d.se, 0.99);
  eq(`${id}.ci99.lo`, ci99[0], c.ci99[0]);
  eq(`${id}.ci99.hi`, ci99[1], c.ci99[1]);

  const yb = RM.bestYouden(y, score);
  eq(`${id}.youden.t`, yb.t, c.youden.threshold);
  eq(`${id}.youden.sens`, yb.sens, c.youden.sens);
  eq(`${id}.youden.spec`, yb.spec, c.youden.spec);

  const f1 = RM.bestF1(y, score);
  eq(`${id}.f1.t`, f1.t, c.f1.threshold);
  eq(`${id}.f1.F1`, f1.f1, c.f1.F1);
  eq(`${id}.f1.prec`, f1.ppv, c.f1.prec);
  eq(`${id}.f1.rec`, f1.sens, c.f1.rec);

  const cost1 = RM.bestCost(y, score, 1);
  eq(`${id}.cost1.t`, cost1.t, c.cost1.threshold);
  eq(`${id}.cost1.cost`, cost1.value, c.cost1.cost);
  const cost5 = RM.bestCost(y, score, 5);
  eq(`${id}.cost5.t`, cost5.t, c.cost5.threshold);
  eq(`${id}.cost5.cost`, cost5.value, c.cost5.cost);

  // confusion matrix at the Youden threshold
  const m = RM.metricsAt(y, score, yb.t);
  const ay = c.at_youden;
  ['TP', 'FP', 'FN', 'TN'].forEach(kk => eq(`${id}.atY.${kk}`, m[kk], ay[kk]));
  eq(`${id}.atY.sens`, m.sens, ay.sens);
  eq(`${id}.atY.spec`, m.spec, ay.spec);
  eq(`${id}.atY.ppv`, m.ppv, ay.ppv);
  eq(`${id}.atY.npv`, m.npv, ay.npv);
  eq(`${id}.atY.acc`, m.acc, ay.acc);
  eq(`${id}.atY.f1`, m.f1, ay.f1);

  // probe threshold vs pROC coords
  const pm = RM.metricsAt(y, score, c.probe_threshold);
  const pmine = c.probe_mine;
  ['TP', 'FP', 'FN', 'TN', 'sens', 'spec', 'ppv', 'npv', 'acc'].forEach(kk =>
    eq(`${id}.probe.${kk}`, pm[kk], pmine[kk]));

  eq(`${id}.brier`, RM.brier(y, score), c.brier);

  // calibration bins
  const cb = RM.calibBins(y, score, 10);
  eq(`${id}.calib.len`, cb.length, c.calib.length);
  for (let b = 0; b < Math.min(cb.length, c.calib.length); b++) {
    eq(`${id}.calib[${b}].n`, cb[b].n, c.calib[b].n);
    eq(`${id}.calib[${b}].mean_score`, cb[b].mean_score, c.calib[b].mean_score);
    eq(`${id}.calib[${b}].mean_y`, cb[b].mean_y, c.calib[b].mean_y);
  }
}

console.log(`\n${checks} checks, ${fails} failures  (tol ${TOL})`);
process.exit(fails ? 1 : 0);
