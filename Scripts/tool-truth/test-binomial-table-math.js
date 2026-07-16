/* Harness: tools/lib/binomial-math.js vs R 4.6.0 for the binomial-table tool.
   Truth: Scripts/tool-truth/binomial-table.json (dbinom / pbinom).
   Gate: every value <= 1e-9 relative, and every 4dp DISPLAY string identical to
   R's sprintf("%.4f") except on exact rounding ties, where the disagreement has
   to prove itself (see checkCell) -> the printed table is R cell for cell.
   Run: node Scripts/tool-truth/test-binomial-table-math.js  */
'use strict';
const fs = require('fs');
const path = require('path');
const B = require('../../tools/lib/binomial-math.js');

const truth = JSON.parse(fs.readFileSync(path.join(__dirname, 'binomial-table.json'), 'utf8'));
const TOL = 1e-9;
let n = 0, bad = 0, worst = 0, worstAt = '';

function rel(a, b) {
  if (a === b) return 0;
  const d = Math.abs(a - b), s = Math.max(Math.abs(a), Math.abs(b));
  return s < 1e-300 ? d : d / s;
}
function num(label, got, want) {
  n++;
  const r = rel(got, want);
  if (r > worst) { worst = r; worstAt = label; }
  if (!(r <= TOL)) { bad++; if (bad <= 12) console.log(`FAIL ${label}: got ${got} want ${want} rel ${r.toExponential(2)}`); }
}
function str(label, got, want) {
  n++;
  if (got !== want) { bad++; if (bad <= 12) console.log(`FAIL ${label}: got "${got}" want "${want}"`); }
}

// ---- 1. the printable grid: values AND the exact display strings ----------
// The printed cells come from exact BigInt rationals, so a cell can legitimately
// differ from R's sprintf("%.4f") in one place only: a value sitting EXACTLY on
// a 4dp tie, where R rounds its own double and that double is a hair off the
// tie. Every such disagreement has to prove itself here: the exact value must
// be a true tie AND R's double must be within a few ulp of it. Anything else
// is a real failure.
const ties = [];
function pStr(p) { return p.toFixed(2); }   // grid p is .05 .. .50
// The exact value as a double. 60 decimals keeps full precision even for the
// smallest grid cell (0.05^20 ~ 1e-26); a fixed 17 would truncate it to noise.
function exactVal(kind, k, n, ps) { return Number(B.fmtExact(kind, k, n, ps, 60)); }
function isTie4(kind, k, n, ps) {           // exact value lands ON the 4dp tie
  const r = B.exactRational(kind, k, n, ps);
  if (!r) return false;
  const rem = (r.N * 10000n) % r.D;
  return rem * 2n === r.D;
}
function ulpsApart(a, b) {                  // how many ulp R's double is from exact
  if (a === b) return 0;
  const ulp = Math.abs(b) < 1e-300 ? 5e-324 : Math.abs(b) * Number.EPSILON;
  return Math.abs(a - b) / ulp;
}
function checkCell(kind, tag, k, nn, ps, rDisp, rVal) {   // nn: do not shadow the counter n
  const got = B.fmtExact(kind, k, nn, ps, 4);
  if (got === null) { n++; bad++; console.log(`FAIL ${tag}: exact arithmetic unavailable`); return; }
  if (got === rDisp) { str(`${tag} disp`, got, rDisp); return; }
  // Disagreement is allowed ONLY on an exact tie, and only when R's double is
  // within a few ulp of the exact value (i.e. R and we agree on the number and
  // differ solely on which way a dead-even tie breaks).
  n++;
  const tie = isTie4(kind, k, nn, ps);
  const u = ulpsApart(rVal, exactVal(kind, k, nn, ps));
  if (!tie || u > 8) {
    bad++;
    console.log(`FAIL ${tag}: exact "${got}" vs R "${rDisp}" (tie=${tie}, ${u.toFixed(1)} ulp)`);
  } else {
    ties.push(`${tag}: exact ${got}, R prints ${rDisp} (R's double sits ${u.toFixed(1)} ulp off the tie)`);
  }
}
for (const g of truth.grid) {
  const tag = `grid n=${g.n} k=${g.k} p=${g.p}`;
  const ps = pStr(g.p);
  num(`${tag} dbinom`, B.dbinom(g.k, g.n, g.p), g.d);
  num(`${tag} pbinom`, B.pbinom(g.k, g.n, g.p), g.cum);
  num(`${tag} upper`, B.pbinomUpper(g.k, g.n, g.p), g.upper);
  // the exact rational must itself agree with R to full double precision
  num(`${tag} exact=R`, exactVal('eq', g.k, g.n, ps), g.d);
  num(`${tag} exactcum=R`, exactVal('le', g.k, g.n, ps), g.cum);
  // the strings that actually get printed into the HTML
  checkCell('eq', `${tag} d_disp`, g.k, g.n, ps, g.d_disp, g.d);
  checkCell('le', `${tag} cum_disp`, g.k, g.n, ps, g.cum_disp, g.cum);
}

// ---- 2. interactive lookups (edges, off-grid p, p > 0.5, big n) -----------
for (const c of truth.lookup) {
  const tag = `lookup n=${c.n} p=${c.p} k=${c.k}`;
  num(`${tag} P(X=k)`, B.dbinom(c.k, c.n, c.p), c.d);
  num(`${tag} P(X<=k)`, B.pbinom(c.k, c.n, c.p), c.cum);
  num(`${tag} P(X>=k)`, B.pbinomUpper(c.k, c.n, c.p), c.upper);
  num(`${tag} P(X<k)`, c.k >= 1 ? B.pbinom(c.k - 1, c.n, c.p) : 0, c.lt);
  num(`${tag} P(X>k)`, B.pbinomUpper(c.k + 1, c.n, c.p), c.gt);
  num(`${tag} mean`, B.mean(c.n, c.p), c.mean);
  num(`${tag} sd`, B.sd(c.n, c.p), c.sd);
  // the three headline numbers must sum consistently: P(<=k) + P(>k) = 1
  num(`${tag} complement`, B.pbinom(c.k, c.n, c.p) + B.pbinomUpper(c.k + 1, c.n, c.p), 1);
}

// ---- 3. the p > 0.5 symmetry trick the page teaches -----------------------
for (const s of truth.symmetry) {
  const tag = `sym n=${s.n} p=${s.p} k=${s.k}`;
  num(`${tag} direct`, B.dbinom(s.k, s.n, s.p), s.d_direct);
  // what the page actually does when p > 0.5: read the mirrored cell
  num(`${tag} mirror=direct`, B.dbinom(s.n - s.k, s.n, 1 - s.p), s.d_direct);
  num(`${tag} cum direct`, B.pbinom(s.k, s.n, s.p), s.cum_direct);
  num(`${tag} cum mirror`, B.pbinomUpper(s.n - s.k, s.n, 1 - s.p), s.cum_direct);
}

// ---- 4. formatter spot-checks: exact ties round half up ------------------
// exact fractions, rounded half up: C(n,k) p^k (1-p)^(n-k) worked out by hand
[['eq', 0, 5, '0.5', '0.0313'],    // 1/32   = 0.03125   -> tie, up
 ['eq', 1, 6, '0.5', '0.0938'],    // 6/64   = 0.09375   -> tie, up
 ['eq', 1, 5, '0.1', '0.3281'],    // 0.32805           -> tie, up
 ['eq', 4, 5, '0.1', '0.0005'],    // 0.00045           -> tie, up
 ['eq', 0, 1, '0.5', '0.5000'],
 ['le', 1, 1, '0.5', '1.0000'],
 ['eq', 3, 2, '0.5', '0.0000'],    // k > n
 ['eq', 0, 10, '1', '0.0000'],     // p = 1
 ['le', 10, 10, '1', '1.0000']
].forEach(([kind, k, n, ps, want]) => str(`fmtExact ${kind} k=${k} n=${n} p=${ps}`, B.fmtExact(kind, k, n, ps, 4), want));

// ---- 5. the exact engine must agree with the double engine everywhere -----
// (outside the ties, where the exact one is by definition the right answer)
for (const c of truth.lookup) {
  const ps = String(c.p);
  const e = B.fmtExact('eq', c.k, c.n, ps, 17);
  if (e !== null) num(`exact vs double n=${c.n} p=${c.p} k=${c.k}`, Number(e), B.dbinom(c.k, c.n, c.p));
}

console.log(`\n${n - bad}/${n} checks passed  |  worst rel ${worst.toExponential(2)} @ ${worstAt}`);
if (ties.length) {
  console.log(`\n${ties.length} exact-tie cells where R's printed digit differs (exact value is a true tie;`);
  console.log(`R rounds its own double, which sits just off it). The table prints the exact rounding:`);
  ties.forEach(t => console.log('  ' + t));
}
if (bad) { console.log(`${bad} FAILURES`); process.exit(1); }
console.log('ALL GREEN');
