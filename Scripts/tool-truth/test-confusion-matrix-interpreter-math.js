// Node harness: classification-math.js vs caret truth. Gate: all <= 1e-6 relative.
// Run: node Scripts/tool-truth/test-confusion-matrix-interpreter-math.js
const fs = require('fs');
const path = require('path');
const M = require('../../tools/lib/classification-math.js');
const truth = JSON.parse(fs.readFileSync(path.join(__dirname, 'confusion-matrix-interpreter.json'), 'utf8'));

let pass = 0, fail = 0, skip = 0;
const TOL = 1e-6;

function ok(v) { return v !== null && v !== undefined && Number.isFinite(v); }
function cmp(label, got, exp) {
  // truth null = NaN/undefined in R (0/0, Inf-guard) -> only require the tool to be non-finite too
  if (exp === null || exp === undefined) {
    if (!ok(got)) { pass++; return; }
    // a null truth with a finite tool value: tolerate Infinity (e.g. LR+ when spec=1)
    if (!Number.isFinite(got)) { pass++; return; }
    console.log(`  MISMATCH ${label}: got ${got}, truth null`); fail++; return;
  }
  if (!ok(got)) { console.log(`  MISMATCH ${label}: got ${got}, truth ${exp}`); fail++; return; }
  const rel = Math.abs(got - exp) / Math.max(1, Math.abs(exp));
  if (rel <= TOL) pass++;
  else { console.log(`  MISMATCH ${label}: got ${got}, truth ${exp}, rel ${rel.toExponential(2)}`); fail++; }
}

console.log('== BINARY ==');
for (const b of truth.binary) {
  const r = M.binary(b.TP, b.FP, b.FN, b.TN, 0.95);
  const P = `[${b.name}]`;
  cmp(`${P} accuracy`, r.accuracy, b.accuracy);
  cmp(`${P} accLower95`, r.accuracyLower, b.accLower95);
  cmp(`${P} accUpper95`, r.accuracyUpper, b.accUpper95);
  cmp(`${P} nir`, r.nir, b.nir);
  cmp(`${P} accPValue`, r.accPValue, b.accPValue);
  cmp(`${P} mcnemarP`, r.mcnemarP, b.mcnemarP);
  cmp(`${P} kappa`, r.kappa, b.kappa);
  cmp(`${P} mcc`, r.mcc, b.mcc);
  cmp(`${P} sensitivity`, r.sensitivity, b.sensitivity);
  cmp(`${P} specificity`, r.specificity, b.specificity);
  cmp(`${P} ppv`, r.ppv, b.ppv);
  cmp(`${P} npv`, r.npv, b.npv);
  cmp(`${P} f1`, r.f1, b.f1);
  cmp(`${P} f0_5`, r.f0_5, b.f0_5);
  cmp(`${P} f2`, r.f2, b.f2);
  cmp(`${P} balancedAccuracy`, r.balancedAccuracy, b.balancedAccuracy);
  cmp(`${P} prevalence`, r.prevalence, b.prevalence);
  cmp(`${P} detectionRate`, r.detectionRate, b.detectionRate);
  cmp(`${P} detectionPrevalence`, r.detectionPrevalence, b.detectionPrevalence);
  cmp(`${P} lrPlus`, r.lrPlus, b.lrPlus);
  cmp(`${P} lrMinus`, r.lrMinus, b.lrMinus);
  // Clopper-Pearson at every level
  for (const c of b.cis) {
    const ci = M.accuracyCI(b.TP + b.TN, b.N, c.level);
    cmp(`${P} CI${c.level} lower`, ci[0], c.lower);
    cmp(`${P} CI${c.level} upper`, ci[1], c.upper);
  }
}

console.log('== MULTI ==');
for (const m of truth.multi) {
  const r = M.multi(m.matrix, 0.95);
  const P = `[${m.name}]`;
  cmp(`${P} accuracy`, r.accuracy, m.accuracy);
  cmp(`${P} accLower95`, r.accuracyLower, m.accLower95);
  cmp(`${P} accUpper95`, r.accuracyUpper, m.accUpper95);
  cmp(`${P} nir`, r.nir, m.nir);
  cmp(`${P} accPValue`, r.accPValue, m.accPValue);
  cmp(`${P} mcnemarP`, r.mcnemarP, m.mcnemarP);
  cmp(`${P} kappa`, r.kappa, m.kappa);
  cmp(`${P} mcc`, r.mcc, m.mcc);
  cmp(`${P} macroPrecision`, r.macroPrecision, m.macroPrecision);
  cmp(`${P} macroRecall`, r.macroRecall, m.macroRecall);
  cmp(`${P} macroF1`, r.macroF1, m.macroF1);
  cmp(`${P} weightedPrecision`, r.weightedPrecision, m.weightedPrecision);
  cmp(`${P} weightedRecall`, r.weightedRecall, m.weightedRecall);
  cmp(`${P} weightedF1`, r.weightedF1, m.weightedF1);
  cmp(`${P} balancedAccuracy`, r.balancedAccuracy, m.balancedAccuracy);
  for (let i = 0; i < m.perClass.length; i++) {
    const pc = m.perClass[i], gc = r.perClass[i], L = `${P} class ${pc.label}`;
    cmp(`${L} sensitivity`, gc.sensitivity, pc.sensitivity);
    cmp(`${L} specificity`, gc.specificity, pc.specificity);
    cmp(`${L} precision`, gc.precision, pc.precision);
    cmp(`${L} recall`, gc.recall, pc.recall);
    cmp(`${L} f1`, gc.f1, pc.f1);
    cmp(`${L} balancedAccuracy`, gc.balancedAccuracy, pc.balancedAccuracy);
    cmp(`${L} support`, gc.support, pc.support);
  }
  for (const c of m.cis) {
    const ci = M.accuracyCI(m.correct != null ? m.correct : null || Math.round(m.accuracy * m.N), m.N, c.level);
    cmp(`${P} CI${c.level} lower`, ci[0], c.lower);
    cmp(`${P} CI${c.level} upper`, ci[1], c.upper);
  }
}

console.log(`\n${pass} passed, ${fail} failed, ${skip} skipped`);
process.exit(fail ? 1 : 0);
