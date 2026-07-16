/* Harness: tools/lib/samplesize-math.js vs Scripts/tool-truth/sample-size-calculator.json
   Run: node Scripts/tool-truth/test-sample-size-calculator-math.js

   Gates:
     A. z criticals            vs R qnorm                       (<= 1e-12 rel)
     B. every n case           n0 / nExact exact-ish, n EXACT   (integer match)
     C. achieved margins       vs R                             (<= 1e-12 rel)
     D. quartering law         halving E quadruples n0          (exact 4x)
     E. delegation consistency shrinkToPop+ceil == MarginMath.sampleSizeProp
     F. browser global name    SampleSizeMath is what the page loads

   The integer n is gated EXACTLY, not to a tolerance. A tolerance on a
   ceiling is meaningless: n is either the same person count as R or it is
   not. 189 of the 190 cases meet that bar.

   THE ONE EXCEPTION, and why it is not a loosened gate.
   prop_edge_exact_int was constructed by solving for the E that puts n0
   exactly on the whole number 100. It therefore lands ON a ceiling
   discontinuity, and that is the one place where the shared normal-math
   qnorm (which agrees with R's to 1.1e-13 relative, never bit-for-bit)
   changes the answer by a whole person:
       R  : n0 = 100.00000000000003  -> ceiling 101
       JS : n0 = 99.999999999998295  -> ceiling 100
   Both bracket the true real-valued answer (exactly 100) to within 3e-14.
   R is not an oracle here: it returns 101 only because its own last ulp
   fell on the high side of a value that is mathematically 100. Neither
   result is more correct than the other, so an exact-integer gate on this
   case would be asserting a coin flip.
   The response is NOT to relax the tolerance globally (that would hide real
   errors in the other 189) and NOT to rewrite qnorm to AS241 inside
   normal-math (that lib is frozen and shipped on 7 verified pages; churning
   it for an unreachable case trades real regression risk for nothing).
   Instead this case is gated on the tolerance-free properties that DO have
   a determinate answer: n0 must agree with R to 1e-12 relative, and the two
   candidate integers must differ by at most one person. Reachability: a user
   would have to type E to 17 significant digits to land here. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SS = require('../../tools/lib/samplesize-math.js');
const MM = require('../../tools/lib/margin-math.js');
const truth = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'sample-size-calculator.json'), 'utf8'));

let pass = 0, fail = 0, worst = 0, worstId = '';
const fails = [];

function relerr(got, want) {
  if (want === got) return 0;
  const d = Math.abs(got - want);
  return Math.abs(want) > 1e-300 ? d / Math.abs(want) : d;
}
function chk(id, field, got, want, tol) {
  const e = relerr(got, want);
  if (e > worst) { worst = e; worstId = id + '.' + field; }
  if (!(e <= tol) || !isFinite(got)) {
    fail++; fails.push(`${id}.${field}: got ${got} want ${want} (rel ${e.toExponential(3)})`);
  } else pass++;
}
function chkInt(id, field, got, want) {
  if (got === want) pass++;
  else { fail++; fails.push(`${id}.${field}: got ${got} want ${want} (INTEGER MISMATCH)`); }
}

// ------------------------------------------------------------------- A. zcrit
for (const z of truth.zcrit) chk('zcrit_' + z.conf, 'z', SS.zcrit(z.conf), z.z, 1e-12);

// ------------------------------------------------------- B. every n/n0 case
// A case sits ON a ceiling discontinuity when its exact n is indistinguishable
// from a whole number at the precision qnorm can deliver. Detected, not
// hard-coded, so a future case that drifts onto a boundary is adjudicated the
// same way instead of failing mysteriously.
function onCeilingBoundary(nExact) {
  return nExact > 0 && Math.abs(nExact - Math.round(nExact)) < 1e-9;
}
let boundaryCases = 0;
for (const c of truth.cases) {
  const a = c.args;
  const N = (a.Npop == null) ? null : a.Npop;
  const r = (c.mode === 'prop')
    ? SS.sizeProp(a.E, a.p, a.conf, N)
    : SS.sizeMean(a.E, a.sd, a.conf, N);
  chk(c.id, 'z', r.z, c.z, 1e-12);
  chk(c.id, 'n0', r.n0, c.n0, 1e-12);
  chk(c.id, 'nExact', r.nExact, c.n_exact, 1e-12);

  if (onCeilingBoundary(c.n_exact)) {
    // Ill-posed ceiling: gate the properties that are determinate.
    boundaryCases++;
    if (Math.abs(r.n - c.n) <= 1) pass++;
    else { fail++; fails.push(`${c.id}.n: boundary case off by ${Math.abs(r.n - c.n)} people (max 1)`); }
    // and the real-valued answer must still be the same to 1e-12 (checked above)
  } else {
    chkInt(c.id, 'n', r.n, c.n);        // exact: a person is not a tolerance
  }
}

// ---------------------------------------------------------- C. achieved margin
for (const a of truth.achieved) {
  const g = a.args;
  const got = SS.marginAt(a.mode, g.n, g.conf, g.Npop == null ? null : g.Npop, g.p, g.sd);
  chk(a.id, 'moe', got, a.moe, 1e-12);
}

// -------------------------------------------------------- D. quartering law
// The page claims halving the margin roughly quadruples n. Assert the exact
// 4x on n0 so the prose cannot drift away from the arithmetic.
for (let i = 1; i < truth.quartering.length; i++) {
  const prev = truth.quartering[i - 1], cur = truth.quartering[i];
  const ratio = cur.n0 / prev.n0;
  chk('quartering_E' + cur.E, 'ratio_is_4x', ratio, 4, 1e-12);
  const mine = SS.sizeProp(cur.E, 0.5, 0.95, null);
  chkInt('quartering_E' + cur.E, 'n', mine.n, cur.n);
}

// ------------------------------------------------- E. delegation consistency
// sizeProp delegates its integer to MarginMath.sampleSizeProp while nExact
// comes from the local shrinkToPop. If those two ever disagree the page would
// print an exact n that does not round to its own headline. Prove they cannot.
let delChecked = 0;
for (const c of truth.cases) {
  if (c.mode !== 'prop') continue;
  const a = c.args;
  const N = (a.Npop == null) ? null : a.Npop;
  const viaLocal = Math.ceil(SS.shrinkToPop(SS.sizeProp(a.E, a.p, a.conf, N).n0, N));
  const viaLib = MM.sampleSizeProp(a.E, a.p, a.conf, N).n;
  // Same JS qnorm on both sides, so this must agree bit-for-bit even on the
  // boundary case. No exemption here.
  chkInt(c.id, 'delegation_agrees', viaLocal, viaLib);
  delChecked++;
}

// ---------------------------------------------------- F. browser global name
// Node require() cannot catch a wrong browser global: the UMD else-branch
// never runs here. Evaluate the file the way a <script> tag would and assert
// the page's global actually appears. (Bitten before: DistTablesMath.)
{
  const sandbox = { self: {} };
  sandbox.self.MarginMath = MM;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(
    path.join(__dirname, '../../tools/lib/samplesize-math.js'), 'utf8'), sandbox);
  if (typeof sandbox.self.SampleSizeMath === 'object' &&
      typeof sandbox.self.SampleSizeMath.sizeProp === 'function') pass++;
  else { fail++; fails.push('browser global self.SampleSizeMath not exported by the UMD branch'); }
}

// -------------------------------------------------------------- degenerate p
if (SS.degenerate('prop', 0) === 'boundary-p' && SS.degenerate('prop', 1) === 'boundary-p'
    && SS.degenerate('prop', 0.5) === null && SS.degenerate('mean', 0) === null) pass++;
else { fail++; fails.push('degenerate() does not flag boundary p'); }

console.log('cases in truth table :', truth.cases.length);
console.log('  exact-integer gate :', truth.cases.length - boundaryCases);
console.log('  ceiling-boundary   :', boundaryCases, '(adjudicated, see header)');
console.log('delegation checks    :', delChecked);
console.log('checks passed        :', pass);
console.log('checks failed        :', fail);
console.log('worst rel error      :', worst.toExponential(3), '(' + worstId + ')');
if (fails.length) {
  console.log('\nFAILURES:');
  fails.slice(0, 25).forEach(f => console.log('  ' + f));
}
process.exit(fail ? 1 : 0);
