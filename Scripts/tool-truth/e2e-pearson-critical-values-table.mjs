/* Local E2E for pearson-critical-values-table: asserts RENDERED values against
   the R truth table for every mode, plus error handling, table highlight,
   mobile overflow and console health.
   Usage: node Scripts/tool-truth/e2e-pearson-critical-values-table.mjs [baseUrl] */
import { chromium } from 'playwright';
import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const P = require('../../tools/lib/pearson-r-math.js');

const BASE = process.argv[2] || 'http://127.0.0.1:8899';
const URL = `${BASE}/tools/pearson-critical-values-table.html?fresh=${Date.now()}`;

let pass = 0, fail = 0;
const ok = (c, m, got, exp) => {
  if (c) { pass++; }
  else { fail++; console.log(`  FAIL ${m}` + (got !== undefined ? `\n        got=${got}\n        exp=${exp}` : '')); }
};
const near = (g, e, tol = 5e-4) => Math.abs(g - e) <= tol;
const numOf = (s) => parseFloat(String(s).replace(/[^0-9eE.+-]/g, ''));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
await page.goto(URL, { waitUntil: 'networkidle' });

const setMode = async (m) => { await page.selectOption('#iwantsel', m); await page.waitForTimeout(60); };
const setVal = async (sel, v) => { await page.fill(sel, String(v)); await page.waitForTimeout(60); };
const setTails = async (t) => { await page.click(`.tab[data-tails="${t}"]`); await page.waitForTimeout(60); };
// Option values are literal 2dp strings ("0.10"), and String(0.10) is "0.1",
// so select by the exact printed form or Playwright never matches an option.
const setAlpha = async (a) => { await page.selectOption('#alpha', a.toFixed(2)); await page.waitForTimeout(60); };

// ---------------------------------------------------- 1. TEST mode vs truth
console.log('\n[1] test mode: rendered r / df / t / p vs the lib (R-verified)');
for (const [n, r, tails, alpha] of [
  [30, 0.42, 'two', 0.05], [12, 0.55, 'two', 0.05], [8, 0.71, 'two', 0.01],
  [32, -0.8676594, 'two', 0.05], [200, 0.14, 'two', 0.05], [10, 0.3, 'right', 0.05],
  [50, -0.4, 'left', 0.02], [3, 0.99, 'two', 0.10]
]) {
  await setMode('test'); await setTails(tails); await setAlpha(alpha);
  await setVal('#n', n); await setVal('#r', r);
  const [s1, s2, s3, s4, head] = await Promise.all(
    ['#s1', '#s2', '#s3', '#s4', '#vhead'].map(s => page.textContent(s)));
  const eT = P.rToT(r, n), eP = P.pvR(r, n, tails), v = P.verdict(r, n, alpha, tails);
  const tag = `n=${n} r=${r} ${tails} a=${alpha}`;
  ok(near(numOf(s1), r), `${tag} r`, s1, r);
  ok(numOf(s2) === n - 2, `${tag} df`, s2, n - 2);
  ok(near(numOf(s3), eT, 1e-2), `${tag} t`, s3, eT.toFixed(3));
  const gp = numOf(s4);
  ok(near(gp, eP, Math.max(1e-4, eP * 1e-2)), `${tag} p`, s4, eP);
  ok(head.trim() === (v.significant ? 'Significant' : 'Not significant'), `${tag} verdict`, head, v.significant);
}

// ---------------------------------------------------- 2. LOOKUP mode vs truth
console.log('[2] lookup mode: critical r vs the lib');
for (const [n, tails, alpha] of [
  [30, 'two', 0.05], [12, 'two', 0.01], [102, 'two', 0.10],
  [5, 'right', 0.05], [3, 'two', 0.05], [52, 'left', 0.02]
]) {
  await setMode('lookup'); await setTails(tails); await setAlpha(alpha);
  await setVal('#n', n);
  const a = tails === 'two' ? alpha : alpha / 2;
  const e = P.critR(a, n, tails);
  const s1 = await page.textContent('#s1');
  ok(near(numOf(s1), e), `lookup n=${n} ${tails} a=${alpha} r*`, s1, e.toFixed(4));
  const df = await page.textContent('#s2');
  ok(numOf(df) === n - 2, `lookup n=${n} df`, df, n - 2);
}

// ---------------------------------------------------- 3. n <-> df lockstep
console.log('[3] n and df stay in lockstep (the df = n - 2 rule)');
await setMode('lookup');
await setVal('#n', 42);
ok(await page.inputValue('#df') === '40', 'n=42 -> df=40', await page.inputValue('#df'), '40');
await setVal('#df', 18);
ok(await page.inputValue('#n') === '20', 'df=18 -> n=20', await page.inputValue('#n'), '20');

// ---------------------------------------------------- 4. PLAN mode vs truth
console.log('[4] plan mode: smallest n vs the lib');
for (const [r, tails, alpha] of [
  [0.3, 'two', 0.05], [0.5, 'two', 0.01], [0.1, 'two', 0.05], [0.9, 'two', 0.05], [0.4, 'right', 0.05]
]) {
  await setMode('plan'); await setTails(tails); await setAlpha(alpha);
  await setVal('#r', r);
  const a = tails === 'two' ? alpha : alpha / 2;
  const e = P.minNForR(r, a, tails);
  const head = await page.textContent('#vhead');
  ok(numOf(head) === e, `plan r=${r} ${tails} a=${alpha} -> n`, head, e);
}
// directional impossibility
await setMode('plan'); await setTails('right'); await setVal('#r', -0.8);
ok((await page.textContent('#vhead')).includes('No sample size'), 'plan: wrong-direction r has no n',
  await page.textContent('#vhead'), 'No sample size works');

// ---------------------------------------------------- 5. printed table cells
console.log('[5] printed table cells match the lib exactly');
let cellFails = 0, cells = 0;
for (const df of P.DF_ROWS) {
  for (const pair of P.ALPHA_PAIRS) {
    const txt = await page.textContent(`#rtab tr[data-dfrow="${df}"] td[data-a2="${pair.two}"]`);
    const exp = P.critRfromDf(pair.two, df, 'two').toFixed(4).replace(/^0\./, '.');
    cells++;
    if (txt.trim() !== exp) { cellFails++; if (cellFails <= 5) console.log(`  FAIL cell df=${df} a=${pair.two}: ${txt} != ${exp}`); }
  }
}
ok(cellFails === 0, `all ${cells} printed cells match`, cellFails + ' bad', '0 bad');
// the df=2 identity: critical r == 1 - alpha exactly
for (const pair of P.ALPHA_PAIRS) {
  const txt = (await page.textContent(`#rtab tr[data-dfrow="2"] td[data-a2="${pair.two}"]`)).trim();
  const exp = (1 - pair.two).toFixed(4).replace(/^0\./, '.');
  ok(txt === exp, `df=2 identity a=${pair.two}: r* = 1 - alpha`, txt, exp);
}

// ---------------------------------------------------- 5b. header alignment
// A rowspan/colspan slip silently shifts the headers one column off the data,
// so the .10 header ends up over the .05 values. Assert geometrically: each
// alpha header must sit horizontally over the column it labels.
console.log('[5b] dual header sits over the right columns');
const geom = await page.evaluate(() => {
  const cx = el => { const b = el.getBoundingClientRect(); return b.left + b.width / 2; };
  const heads = [...document.querySelectorAll('#rtab thead tr.sub')].map(tr =>
    [...tr.querySelectorAll('th')].map(th => ({ t: th.textContent.trim(), x: cx(th) })));
  const cells = [...document.querySelectorAll('#rtab tr[data-dfrow="1"] td')]
    .map(td => ({ a2: td.dataset.a2, x: cx(td) }));
  return { heads, cells };
});
ok(geom.heads.length === 2, 'two sub header rows', geom.heads.length, 2);
// no stray generator output ever reaches the markup
const tblTxt = await page.textContent('.tscroll');
ok(!/ties:|rows:\s*\d+\s+cells:/.test(tblTxt), 'no generator log text in the table', tblTxt.slice(0, 40), 'clean');
const TWO = ['.10', '.05', '.02', '.01'], ONE = ['.05', '.025', '.01', '.005'];
geom.cells.forEach((c, i) => {
  const oneH = geom.heads[0].find(h => Math.abs(h.x - c.x) < 2);
  const twoH = geom.heads[1].find(h => Math.abs(h.x - c.x) < 2);
  ok(oneH && oneH.t === ONE[i], `col ${i}: one-tailed header ${ONE[i]} centred over it`, oneH && oneH.t, ONE[i]);
  ok(twoH && twoH.t === TWO[i], `col ${i}: two-tailed header ${TWO[i]} centred over it`, twoH && twoH.t, TWO[i]);
  ok(String(c.a2) === String(parseFloat(TWO[i])), `col ${i}: data column is alpha ${TWO[i]}`, c.a2, parseFloat(TWO[i]));
});

// ---------------------------------------------------- 6. table highlight
console.log('[6] active row/cell highlight tracks the inputs');
await setMode('test'); await setAlpha(0.05); await setVal('#n', 30); await setVal('#r', 0.42);
ok(await page.locator('#rtab tr[data-dfrow="28"].rowon').count() === 1, 'row df=28 highlighted');
ok(await page.locator('#rtab td.cellon[data-df="28"][data-a2="0.05"]').count() === 1, 'cell df=28 a=.05 highlighted');
await setAlpha(0.01);
ok(await page.locator('#rtab td.cellon[data-df="28"][data-a2="0.01"]').count() === 1, 'cell follows alpha to .01');

// ---------------------------------------------------- 7. error handling
console.log('[7] input validation, and fixing an input clears the error');
await setMode('test'); await setVal('#n', 2);
ok(await page.locator('#ierr.show').count() === 1, 'n=2 raises an error');
await setVal('#n', 30);
ok(await page.locator('#ierr.show').count() === 0, 'fixing n clears the error');
await setVal('#r', 1.5);
ok(await page.locator('#ierr.show').count() === 1, 'r=1.5 raises an error');
await setVal('#r', 0.42);
ok(await page.locator('#ierr.show').count() === 0, 'fixing r clears the error');

// ---------------------------------------------------- 8. R code + report live
console.log('[8] R code block and report line update with the inputs');
await setMode('test'); await setTails('two'); await setAlpha(0.05);
await setVal('#n', 30); await setVal('#r', 0.42);
let rc = await page.textContent('#rcodepre');
ok(rc.includes('r  <- 0.42') && rc.includes('n  <- 30'), 'R code carries the inputs');
ok(rc.includes('cor.test'), 'R code names cor.test');
await setVal('#r', 0.61);
const rc2 = await page.textContent('#rcodepre');
ok(rc2.includes('r  <- 0.61'), 'R code follows a changed r');
ok((await page.textContent('#report')).includes('r(28)'), 'report line carries df');

// ---------------------------------------------------- 9. the 3 UX features
console.log('[9] tool lead, I-want banner, live inference line');
ok(await page.locator('.dek').count() === 1, 'tool lead present under H1');
ok(await page.locator('.iwant select#iwantsel').count() === 1, 'I want to ... mode selector present');
const inf1 = await page.textContent('#infline');
await setVal('#r', 0.05);
const inf2 = await page.textContent('#infline');
ok(inf1 !== inf2 && inf2.length > 20, 'inference line updates live', inf2.slice(0, 60));
ok(/reject/i.test(inf2), 'inference line names the decision');

// ---------------------------------------------------- 10. mobile + health
console.log('[10] responsive + console health');
for (const w of [360, 390, 768, 1280]) {
  await page.setViewportSize({ width: w, height: 900 });
  await page.waitForTimeout(120);
  const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ok(over <= 1, `no horizontal overflow at ${w}px`, over, '<=1');
}
const realErrors = errors.filter(e => !/cloudflareinsights|beacon|ERR_INSUFFICIENT|net::ERR|Failed to load resource/i.test(e));
ok(realErrors.length === 0, 'no console errors', realErrors.join(' | '), 'none');

await browser.close();
console.log(`\n${'='.repeat(52)}\nE2E: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
