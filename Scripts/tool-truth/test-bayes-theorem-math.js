// Verify tools/lib/bayes-math.js against the R 4.6.0 truth table.
// Run: node Scripts/tool-truth/test-bayes-theorem-math.js
const M = require('../../tools/lib/bayes-math.js');
const fs = require('fs');
const truth = JSON.parse(fs.readFileSync(__dirname + '/bayes-theorem.json', 'utf8'));
const N = truth.meta.N;

// R encodes non-finite values as strings so JSON can carry them.
function decode(v) {
  if (v === 'Infinity') return Infinity;
  if (v === '-Infinity') return -Infinity;
  if (v === 'NaN') return NaN;
  return v;
}
function ok(got, want, relTol, absTol) {
  want = decode(want);
  if (Number.isNaN(want)) return Number.isNaN(got);
  if (!isFinite(want)) return got === want;              // Infinity match
  const abs = Math.abs(got - want);
  if (absTol != null && abs <= absTol) return true;
  return abs / Math.max(1e-12, Math.abs(want)) <= relTol;
}

const REL = 1e-9, ABS = 1e-12;    // pure arithmetic -> effectively exact
let pass = 0, fail = 0;
const fails = [];

// Build the computed object for a case exactly as the page would.
function compute(c) {
  const i = c.inputs;
  if (c.mode === 'medical' || c.mode === 'paradox') return M.medical(i.prev, i.sens, i.spec, N);
  if (c.mode === 'chain') return M.chain(i.prev, i.sens1, i.spec1, i.sens2, i.spec2, N);
  // generic + spam share the frame engine (prior, pdh, pdnh)
  return M.frame(i.prior, i.pdh, i.pdnh, N);
}

function check(c) {
  const got = compute(c);
  const exp = c.expected;
  const bad = [];
  Object.keys(exp).forEach(k => {
    // skip echoed inputs that aren't computed outputs
    if (['prior', 'pdh', 'pdnh', 'prev', 'sens1', 'spec1', 'sens2', 'spec2'].includes(k)) return;
    if (!(k in got)) { bad.push([k, 'MISSING', exp[k]]); return; }
    if (!ok(got[k], exp[k], REL, ABS)) bad.push([k, got[k], exp[k]]);
  });
  if (bad.length) {
    fail++; fails.push(c.name);
    console.log(`FAIL ${c.name} (${c.mode})`);
    bad.forEach(r => {
      const want = decode(r[2]);
      const rel = (typeof r[1] === 'number' && isFinite(want)) ?
        (Math.abs(r[1] - want) / Math.max(1e-12, Math.abs(want))).toExponential(2) : '-';
      console.log(`   ${r[0]}: got ${r[1]}  want ${r[2]}  (rel ${rel})`);
    });
  } else {
    pass++;
    console.log(`PASS ${c.name} (${c.mode})`);
  }
}

truth.cases.forEach(check);

// Independent spot checks against the page's original smoke-test constants.
function spot(desc, got, want) {
  if (ok(got, want, 1e-9, 1e-12)) { pass++; console.log(`PASS spot: ${desc}`); }
  else { fail++; fails.push('spot:' + desc); console.log(`FAIL spot: ${desc} got ${got} want ${want}`); }
}
spot('HIV PPV', M.ppv(0.001, 0.99, 0.95), 0.0194346289752650);
spot('HIV LR+', M.lrPos(0.99, 0.95), 19.8);
spot('HIV LR-', M.lrNeg(0.99, 0.95), 0.0105263157894737);
spot('Mammo PPV', M.ppv(0.01, 0.80, 0.90), 0.0747663551401869);
spot('Spam P(spam|word)', M.bayes(0.30, 0.40, 0.05), 0.7741935483870968);
spot('50/50/50 sanity', M.bayes(0.5, 0.5, 0.5), 0.5);
spot('NPV symmetry', M.npv(0.10, 0.90, 0.80), M.bayes(0.90, 0.80, 0.10));
spot('odds<->prob', M.posteriorFromOdds(M.postOdds(0.05, 0.85, 0.97)), M.ppv(0.05, 0.85, 0.97));

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) { console.log('FAILURES: ' + fails.join(', ')); process.exit(1); }
