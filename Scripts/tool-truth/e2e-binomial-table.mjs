// E2E: drives tools/binomial-table.html in a real browser and asserts the
// RENDERED numbers against the R truth table (Scripts/tool-truth/binomial-table.json).
// Usage: node Scripts/tool-truth/e2e-binomial-table.mjs [baseUrl]
import { chromium } from 'playwright';
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const B = require('../../tools/lib/binomial-math.js');

const BASE = process.argv[2] || 'http://127.0.0.1:8901';
const truth = JSON.parse(readFileSync('Scripts/tool-truth/binomial-table.json', 'utf8'));
const byCase = new Map(truth.lookup.map(c => [`${c.n}|${c.p}|${c.k}`, c]));

let pass = 0, fail = 0;
const eq = (label, got, want) => {
  if (String(got) === String(want)) { pass++; }
  else { fail++; console.log(`FAIL ${label}\n     got  ${got}\n     want ${want}`); }
};
const ok = (label, cond, detail = '') => {
  if (cond) pass++; else { fail++; console.log(`FAIL ${label} ${detail}`); }
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + String(e).slice(0, 160)));
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 160)); });

const resp = await page.goto(`${BASE}/tools/binomial-table.html?fresh=${Date.now()}`, { waitUntil: 'load', timeout: 45000 });
ok('page 200', resp.status() === 200, `status ${resp.status()}`);

async function setLookup(n, p, k, mode) {
  await page.click(`.mode[data-mode="${mode}"]`);
  for (const [id, v] of [['n', n], ['p', p], ['k', k]]) {
    await page.fill(`#${id}`, String(v));
  }
  await page.waitForTimeout(90);
}
const txt = sel => page.textContent(sel).then(t => t.trim());

// ---- 1. rendered headline + stat grid vs R, across every mode -------------
const CASES = [
  [10, '0.50', 7], [10, '0.50', 0], [10, '0.50', 10], [20, '0.05', 0], [20, '0.05', 3],
  [15, '0.10', 2], [1, '0.50', 1], [12, '0.25', 4], [10, '0.70', 7], [20, '0.65', 12],
  [50, '0.30', 15], [100, '0.50', 50], [500, '0.10', 40], [30, '0.50', 25]
];
// A value under 0.00005 prints as 0.0000 in a 4dp cell. The page promises the
// readout reports it in full instead, so hold it to that.
const show = (kind, k, n, ps, dbl) =>
  (dbl > 0 && dbl < 0.00005) ? dbl.toExponential(2) : B.fmtExact(kind, k, n, ps, 4);
for (const [n, ps, k] of CASES) {
  const p = parseFloat(ps);
  const t = byCase.get(`${n}|${p}|${k}`);
  const wantEq = show('eq', k, n, ps, B.dbinom(k, n, p));
  const wantLe = show('le', k, n, ps, B.pbinom(k, n, p));
  const wantGe = show('ge', k, n, ps, B.pbinomUpper(k, n, p));
  // the exact engine that produced those strings is itself pinned to R here
  if (t) {
    const rel = (a, b) => (a === b ? 0 : Math.abs(a - b) / Math.max(Math.abs(a), Math.abs(b), 1e-300));
    ok(`truth n=${n} p=${ps} k=${k} eq vs R`, rel(Number(B.fmtExact('eq', k, n, ps, 60)), t.d) < 1e-9);
    ok(`truth n=${n} p=${ps} k=${k} le vs R`, rel(Number(B.fmtExact('le', k, n, ps, 60)), t.cum) < 1e-9);
    ok(`truth n=${n} p=${ps} k=${k} ge vs R`, rel(Number(B.fmtExact('ge', k, n, ps, 60)), t.upper) < 1e-9);
  }
  for (const [mode, sym, want] of [['eq', '=', wantEq], ['le', '≤', wantLe], ['ge', '≥', wantGe]]) {
    await setLookup(n, ps, k, mode);
    eq(`headline n=${n} p=${ps} k=${k} ${mode}`, await txt('#vhead'), `P(X ${sym} ${k}) = ${want}`);
  }
  // the stat grid always carries all three, whatever the mode
  eq(`stat P(X=k) n=${n} p=${ps} k=${k}`, await txt('#s1'), wantEq);
  eq(`stat P(X<=k) n=${n} p=${ps} k=${k}`, await txt('#s2'), wantLe);
  eq(`stat P(X>=k) n=${n} p=${ps} k=${k}`, await txt('#s3'), wantGe);
  eq(`stat mean n=${n} p=${ps} k=${k}`, await txt('#s4'), (n * p).toFixed(2));
}

// ---- 1b. a tiny probability: cell rounds to 0.0000, the readout does not ----
await setLookup(20, '0.50', 20, 'eq');
eq('tiny value: readout reports it in full', await txt('#vhead'), 'P(X = 20) = 9.54e-7');
eq('tiny value: the 4dp cell still reads 0.0000', await txt('#texact .cellon'), '0.0000');
ok('tiny value: note explains 0.0000', (await txt('#tblnote')).length > 0);

// ---- 2. the highlighted cell must equal the headline ----------------------
// on-grid: exact table cell == P(X = k)
await setLookup(10, '0.50', 7, 'eq');
eq('highlighted exact cell', await txt('#texact .cellon'), B.fmtExact('eq', 7, 10, '0.50', 4));
eq('highlighted row is k=7', await page.getAttribute('#texact tr.rowon', 'data-k'), '7');
eq('highlighted block is n=10', await page.getAttribute('#texact tr.rowon', 'data-n'), '10');
await setLookup(10, '0.50', 7, 'le');
eq('cumulative cell == P(X<=k)', await txt('#tcum .cellon'), B.fmtExact('le', 7, 10, '0.50', 4));
// at-least reads the row above and subtracts: cell must be P(X <= k-1)
await setLookup(10, '0.50', 7, 'ge');
eq('at-least highlights k-1', await page.getAttribute('#tcum tr.rowon', 'data-k'), '6');
eq('at-least cell == P(X<=k-1)', await txt('#tcum .cellon'), B.fmtExact('le', 6, 10, '0.50', 4));

// ---- 3. the p > 0.5 symmetry trick ---------------------------------------
await setLookup(10, '0.70', 7, 'eq');
eq('mirror: column is 1-p', await page.getAttribute('#texact .cellon', 'data-p'), '0.30');
eq('mirror: row is n-k', await page.getAttribute('#texact tr.rowon', 'data-k'), '3');
// and the mirrored cell really does equal the answer for p = 0.7
eq('mirror cell == P(X=7|10,0.7)', await txt('#texact .cellon'), B.fmtExact('eq', 7, 10, '0.70', 4));
ok('mirror note explains the flip', (await txt('#tblnote')).includes('failure side'));
const symTruth = truth.symmetry.find(s => s.n === 10 && s.p === 0.7 && s.k === 7);
ok('mirror matches R', Math.abs(B.dbinom(3, 10, 0.3) - symTruth.d_direct) < 1e-12);

// ---- 4. off-table cases are called out, and still compute -----------------
await setLookup(12, '0.33', 6, 'ge');
ok('off-grid p flagged', (await txt('#tblnote')).includes('not one of the .05 steps'));
ok('off-grid still computes', /P\(X ≥ 6\) = 0\.\d{4}/.test(await txt('#vhead')));
ok('off-grid: no cell highlighted', (await page.$('#tcum .cellon')) === null);
await setLookup(50, '0.30', 15, 'eq');
ok('n > 20 flagged', (await txt('#tblnote')).includes('stops at n = 20'));

// ---- 5. errors are human, and clear when fixed ----------------------------
await setLookup(10, '0.50', 25, 'eq');
ok('k > n rejected', (await txt('#ierr')).includes('cannot exceed n'));
await page.fill('#k', '5'); await page.waitForTimeout(90);
ok('error clears on fix', !(await page.getAttribute('#ierr', 'class')).includes('show'));
await page.fill('#p', '2'); await page.waitForTimeout(90);
ok('p > 1 rejected', (await txt('#ierr')).includes('between 0 and 1'));
await page.fill('#p', '0.5'); await page.waitForTimeout(90);
ok('error clears again', !(await page.getAttribute('#ierr', 'class')).includes('show'));

// ---- 6. R code block tracks the inputs -----------------------------------
await setLookup(15, '0.10', 3, 'ge');
const rcode = await txt('#rcodepre');
ok('R code: at-least uses lower.tail=FALSE', rcode.includes('pbinom(2, size = 15, prob = 0.1, lower.tail = FALSE)'), rcode.slice(0, 90));
await setLookup(15, '0.10', 3, 'eq');
ok('R code: exact uses dbinom', (await txt('#rcodepre')).includes('dbinom(3, size = 15, prob = 0.1)'));
await setLookup(15, '0.10', 3, 'le');
ok('R code: at-most uses pbinom', (await txt('#rcodepre')).includes('pbinom(3, size = 15, prob = 0.1)'));

// ---- 7. the baked tables are intact and match the exact engine ------------
const shape = await page.evaluate(() => ({
  exactRows: document.querySelectorAll('#texact tbody tr').length,
  cumRows: document.querySelectorAll('#tcum tbody tr').length,
  cols: document.querySelectorAll('#texact thead th').length,
  sample: Array.from(document.querySelectorAll('#texact tbody tr')).map(tr => ({
    n: +tr.dataset.n, k: +tr.dataset.k,
    cells: Array.from(tr.querySelectorAll('td')).map(td => ({ p: td.dataset.p, v: td.textContent }))
  }))
}));
eq('exact table rows', shape.exactRows, 230);      // sum of (n+1) for n = 1..20
eq('cumulative table rows', shape.cumRows, 230);
eq('columns (n, k + 10 p)', shape.cols, 12);
let cellChecks = 0, cellBad = 0;
for (const row of shape.sample) {
  for (const c of row.cells) {
    cellChecks++;
    if (c.v !== B.fmtExact('eq', row.k, row.n, c.p, 4)) {
      cellBad++;
      if (cellBad <= 5) console.log(`FAIL cell n=${row.n} k=${row.k} p=${c.p}: rendered "${c.v}"`);
    }
  }
}
ok(`all ${cellChecks} rendered exact cells match the engine`, cellBad === 0, `${cellBad} bad`);

// ---- 8. mobile 390: no horizontal overflow -------------------------------
await page.setViewportSize({ width: 390, height: 760 });
await page.waitForTimeout(300);
const ov = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
ok('390px: no page overflow', ov <= 1, `overflow ${ov}px`);
await page.setViewportSize({ width: 1280, height: 900 });

// ---- 9. health ------------------------------------------------------------
const real = errors.filter(e => !/cloudflareinsights|beacon|ERR_BLOCKED|net::ERR|404/i.test(e));
ok('no console errors', real.length === 0, real.join(' | '));

await browser.close();
console.log(`\n${pass}/${pass + fail} E2E checks passed`);
if (fail) process.exit(1);
console.log('E2E GREEN');
