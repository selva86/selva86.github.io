/* Node verification: tools/lib/dag-math.js vs dagitty truth table.
   Gate: MINIMAL adjustment sets must match dagitty for every DAG (headline
   output). We also compare the "all" enumeration (after de-duplication); a
   documented, accepted divergence is when dagitty lists a non-minimal set that
   includes an off-path descendant of X (the Pearl back-door engine excludes
   those). Any minimal-set mismatch is a hard failure. */
const fs = require('fs');
const path = require('path');
const DAG = require(path.join(__dirname, '..', '..', 'tools', 'lib', 'dag-math.js'));
const truth = JSON.parse(fs.readFileSync(path.join(__dirname, 'dag-confounder-picker.json'), 'utf8'));

function parseEdges(edgeStrs) {
  return edgeStrs.map(s => {
    const m = s.match(/^\s*([A-Za-z_]\w*)\s*->\s*([A-Za-z_]\w*)\s*$/);
    if (!m) throw new Error('bad edge: ' + s);
    return [m[1], m[2]];
  });
}
function nodesOf(edges) {
  const s = new Set();
  edges.forEach(([a, b]) => { s.add(a); s.add(b); });
  return Array.from(s);
}
// canonical key for a list of sets: sort each set, then sort the list
function canon(sets) {
  const arrs = sets.map(s => s.slice().sort());
  const keyed = arrs.map(a => String(a.length).padStart(3, '0') + '|' + a.join(','));
  // dedup
  const seen = new Set(); const uniq = [];
  keyed.forEach((k, i) => { if (!seen.has(k)) { seen.add(k); uniq.push(arrs[i]); } });
  uniq.sort((x, y) => {
    const kx = String(x.length).padStart(3, '0') + '|' + x.join(',');
    const ky = String(y.length).padStart(3, '0') + '|' + y.join(',');
    return kx < ky ? -1 : kx > ky ? 1 : 0;
  });
  return uniq;
}
function eqSets(a, b) {
  const ca = canon(a), cb = canon(b);
  if (ca.length !== cb.length) return false;
  for (let i = 0; i < ca.length; i++) {
    if (ca[i].join(',') !== cb[i].join(',')) return false;
  }
  return true;
}
function fmt(sets) {
  const c = canon(sets);
  if (!c.length) return '(none)';
  return c.map(s => '{' + s.join(',') + '}').join(' ');
}

let pass = 0, fail = 0, allDiverge = 0;
console.log('DAG'.padEnd(28), 'minimal(tool)'.padEnd(20), 'minimal(dagitty)'.padEnd(20), 'ok');
console.log('-'.repeat(84));
for (const t of truth) {
  const edges = parseEdges(t.edges);
  const nodes = nodesOf(edges);
  const r = DAG.findAdjustmentSets(t.X, t.Y, nodes, edges);
  const toolMin = r.ok ? r.minSets : [];
  const toolAll = r.ok ? r.allValid : [];
  const minOk = eqSets(toolMin, t.minimal);
  const allOk = eqSets(toolAll, t.all);
  if (minOk) pass++; else fail++;
  if (!allOk) allDiverge++;
  console.log(
    t.name.padEnd(28),
    fmt(toolMin).slice(0, 19).padEnd(20),
    fmt(t.minimal).slice(0, 19).padEnd(20),
    minOk ? 'PASS' : 'FAIL *** ' + (allOk ? '' : '(all diff)')
  );
  if (!minOk) {
    console.log('    tool all:   ', fmt(toolAll));
    console.log('    dagitty all:', fmt(t.all));
  } else if (!allOk) {
    console.log('    [all-set divergence, minimal OK] tool:', fmt(toolAll), '| dagitty:', fmt(t.all));
  }
}
console.log('-'.repeat(84));
console.log(`minimal-set match: ${pass}/${truth.length}   all-set divergences: ${allDiverge}`);
if (fail > 0) { console.error('FAILED: ' + fail + ' minimal-set mismatch(es).'); process.exit(1); }
console.log('OK: all minimal adjustment sets match dagitty.');
