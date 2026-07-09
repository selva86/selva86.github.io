/* Verify tools/lib/effect-size-math.js against the R truth table.
   Run: node Scripts/tool-truth/test-effect-size-converter-math.js
   Gate: every case at <= 1e-6 relative error (conversions aim 1e-9+;
   noncentral-t CI at extreme ncp is limited by R's own pnt precision). */
const fs = require('fs');
const path = require('path');
const M = require('../../tools/lib/effect-size-math.js');

const truth = JSON.parse(fs.readFileSync(path.join(__dirname, 'effect-size-converter.json'), 'utf8'));

let pass = 0, fail = 0, worst = 0, worstId = '';
const fails = [];

function rel(got, exp) {
  if (exp === null) return (got === null || !isFinite(got)) ? 0 : Infinity;
  if (!isFinite(exp)) return isFinite(got) ? Infinity : 0;
  const denom = Math.max(Math.abs(exp), 1e-9);
  return Math.abs(got - exp) / denom;
}
function check(id, field, got, exp, tol) {
  tol = tol || 1e-6;
  const r = rel(got, exp);
  if (r > worst && isFinite(r)) { worst = r; worstId = id + '.' + field; }
  if (r <= tol) { pass++; }
  else { fail++; fails.push(`${id}.${field}: got=${got} exp=${exp} rel=${r.toExponential(2)}`); }
}

for (const c of truth) {
  const has = (k) => Object.prototype.hasOwnProperty.call(c, k) && c[k] !== null;
  if (c.kind === 'd') {
    const n1 = c.n1, n2 = c.n2, d = c.d;
    check(c.id, 'r', M.dToR(d, n1, n2), c.r);
    check(c.id, 'or', M.dToOr(d), c.or);
    check(c.id, 'g', M.dToG(d, n1, n2), c.g);
    check(c.id, 'eta2', Math.pow(M.dToR(d, n1, n2), 2), c.eta2);
    check(c.id, 'f', M.eta2ToF(Math.pow(M.dToR(d, n1, n2), 2)), c.f);
    check(c.id, 'cles', M.dToCles(d), c.cles);
    if (has('nnt')) check(c.id, 'nnt', M.dToNnt(d), c.nnt);
    else check(c.id, 'nnt', M.dToNnt(d), null);
    // noncentral-t CIs: relax to 5e-5 for the most extreme (small df, big |d|)
    const ciTol = (Math.abs(d) >= 2 || n1 < 10) ? 5e-5 : 1e-6;
    [90, 95, 99].forEach(L => {
      const ci = M.dCiExact(d, n1, n2, L / 100);
      check(c.id, 'dci_lo' + L, ci[0], c['dci_lo' + L], ciTol);
      check(c.id, 'dci_hi' + L, ci[1], c['dci_hi' + L], ciTol);
    });
  } else if (c.kind === 'g') {
    check(c.id, 'd', M.gToD(c.g, c.n1, c.n2), c.d);
    check(c.id, 'J', M.hedgesJ(c.n1, c.n2), c.J);
  } else if (c.kind === 'r') {
    check(c.id, 'd', M.rToD(c.r), c.d);
    check(c.id, 'or', M.dToOr(M.rToD(c.r)), c.or);
    check(c.id, 'cles', M.dToCles(M.rToD(c.r)), c.cles);
    [90, 95, 99].forEach(L => {
      const ci = M.rCi(c.r, c.n, L / 100);
      check(c.id, 'rci_lo' + L, ci[0], c['rci_lo' + L]);
      check(c.id, 'rci_hi' + L, ci[1], c['rci_hi' + L]);
    });
  } else if (c.kind === 'or') {
    check(c.id, 'd', M.orToD(c.or), c.d);
    check(c.id, 'r', M.dToR(M.orToD(c.or)), c.r);
    const cl = M.orClinical(c.or, c.p1);
    check(c.id, 'p2', cl.p2, c.p2);
    check(c.id, 'rr', cl.rr, c.rr);
    check(c.id, 'arr', cl.arr, c.arr);
    check(c.id, 'nnt_clin', cl.nnt, c.nnt_clin);
  } else if (c.kind === 'eta2') {
    check(c.id, 'f', M.eta2ToF(c.eta2), c.f);
    check(c.id, 'd', M.toCohenD('eta2', { eta2: c.eta2 }).d, c.d);
    check(c.id, 'r', M.dToR(M.toCohenD('eta2', { eta2: c.eta2 }).d), c.r);
  } else if (c.kind === 'f') {
    check(c.id, 'eta2', M.fToEta2(c.f), c.eta2);
    check(c.id, 'd', M.toCohenD('f', { f: c.f }).d, c.d);
  } else if (c.kind === 'cles') {
    check(c.id, 'd', M.clesToD(c.cles), c.d);
  }
}

console.log(`\nEffect Size Converter math check`);
console.log(`  cases: ${truth.length}   assertions: ${pass + fail}`);
console.log(`  PASS: ${pass}   FAIL: ${fail}`);
console.log(`  worst rel error: ${worst.toExponential(3)}  (${worstId})`);
if (fails.length) {
  console.log('\nFailures:');
  fails.slice(0, 40).forEach(f => console.log('  ' + f));
  process.exit(1);
}
console.log('  ALL GREEN\n');
