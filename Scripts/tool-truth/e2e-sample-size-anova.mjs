/* Playwright E2E for tools/sample-size-anova-calculator.html
 *
 * Asserts RENDERED values against the R truth table for every mode, plus error
 * handling, live R-code updates, the 3 mandatory UX features, and 390px overflow.
 *
 * Inputs persist across mode switches by design, so every test sets what it needs.
 *
 * Usage: node Scripts/tool-truth/e2e-sample-size-anova.mjs [baseURL]
 */
import { chromium } from 'playwright';
import fs from 'fs';

const BASE = process.argv[2] || 'http://127.0.0.1:8899';
const URL = `${BASE}/tools/sample-size-anova-calculator.html?fresh=${Date.now()}`;
const T = JSON.parse(fs.readFileSync('Scripts/tool-truth/sample-size-anova-calculator.json', 'utf8'));

let pass = 0, fail = 0;
const fails = [];
function ok(what, cond, got, want) {
  if (cond) { pass++; return true; }
  fail++;
  if (fails.length < 30) fails.push(`${what}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
  return false;
}
function near(what, got, want, tol) {
  return ok(what, Math.abs(got - want) <= tol, got, `${want} +/- ${tol}`);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });

// Console-error gate. Two classes are genuinely environmental on localhost and are
// excepted by the tool rubric:
//   - the CF Web Analytics beacon's CORS preflight (only allowed from the real origin)
//   - 404s for /cdn-cgi/trace and /api/me, which exist only as CF Functions in prod.
// A 404's console text does NOT name its URL, so real 404s are caught by the
// `response` listener below instead of by matching console strings.
const consoleErrors = [];
// Neither a 404 nor an ERR_FAILED names its URL in the console text, so those two
// generic lines are excepted HERE and adjudicated by the URL-bearing listeners
// below (`requestfailed` + `response`), which prove exactly what failed.
const GENERIC = /Failed to load resource: (the server responded with a status of 404|net::ERR_FAILED)/i;
page.on('console', m => {
  if (m.type() !== 'error') return;
  const t = m.text();
  if (GENERIC.test(t) || /cloudflareinsights|cdn-cgi/i.test(t)) return;
  consoleErrors.push(t);
});

// Every network failure, WITH its URL. Only third-party analytics beacons may fail
// here: the CF Web Analytics beacon's CORS preflight only allows the real origin,
// and the GA4 collect beacon aborts on teardown. Neither is the tool's own health.
// Anything else is a real bug.
const ENV_FAIL = /cloudflareinsights\.com|\/cdn-cgi\/|static\.cloudflareinsights|google-analytics\.com|googletagmanager\.com/i;
const failedReqs = [];
page.on('requestfailed', r => { if (!ENV_FAIL.test(r.url())) failedReqs.push(r.url() + ' :: ' + (r.failure() || {}).errorText); });
const bad404 = [];
page.on('response', r => {
  if (r.status() === 404) {
    const u = r.url();
    // CF Functions only exist in prod; on localhost these legitimately 404.
    if (!/\/cdn-cgi\/trace|\/api\/me|beacon\.min\.js/.test(u)) bad404.push(u);
  }
});

await page.goto(URL, { waitUntil: 'networkidle' });

// ---------- helpers ----------
const txt = sel => page.textContent(sel).then(t => (t || '').trim());
async function setVal(id, v) {
  await page.fill(`#${id}`, String(v));
  await page.dispatchEvent(`#${id}`, 'input');
}
async function setMode(m) { await page.click(`.mode[data-mode="${m}"]`); }
async function setSrc(s) { await page.click(`.srcrow button[data-src="${s}"]`); }
async function num(sel) { return parseFloat((await txt(sel)).replace(/[^0-9.\-]/g, '')); }

// ============================================================
// 0. THE 3 MANDATORY UX FEATURES
// ============================================================
ok('tool lead under H1 present', (await txt('.dek')).length > 120, (await txt('.dek')).length, '>120 chars');
ok('"I want to" banner present', (await txt('.iwant')).startsWith('I want to'), await txt('.iwant'), 'starts with "I want to"');
ok('banner select is the mode selector', (await page.locator('#iwsel option').count()) === 3, await page.locator('#iwsel option').count(), 3);
ok('inference line present', (await txt('#inftext')).length > 60, (await txt('#inftext')).length, '>60 chars');
ok('inference line names the decision', /recruit|power|detect/i.test(await txt('#inftext')), await txt('#inftext'), 'names the decision');

// chrome
ok('exactly 1 injected chrome', await page.locator('[data-tool-chrome="injected"]').count() === 1, await page.locator('[data-tool-chrome="injected"]').count(), 1);
ok('0 own mastheads', await page.locator('header.mast').count() === 0, await page.locator('header.mast').count(), 0);
ok('canonical navbar present', await page.locator('.sitenav').count() >= 1, await page.locator('.sitenav').count(), '>=1');
ok('sidebar >20 links', await page.locator('.tool-chrome-side a').count() > 20, await page.locator('.tool-chrome-side a').count(), '>20');
ok('rail-fold collapse present', await page.locator('.rail-fold').count() === 1, await page.locator('.rail-fold').count(), 1);
ok('no in-page footer .ft', await page.locator('footer.ft').count() === 0, await page.locator('footer.ft').count(), 0);

// [hidden] guards actually hide (the recurring trap: class display beats [hidden])
await setSrc('f');
ok('#fmeans hidden via [hidden]', await page.locator('#fmeans').isVisible() === false, await page.locator('#fmeans').isVisible(), false);
ok('#feta hidden via [hidden]', await page.locator('#feta').isVisible() === false, await page.locator('#feta').isVisible(), false);
ok('#fn hidden in n mode', await page.locator('#fn').isVisible() === false, await page.locator('#fn').isVisible(), false);

// ============================================================
// 1. MODE n - rendered n vs the truth table
// ============================================================
await setMode('n');
await setSrc('f');
const nCases = T.solveN.filter(c => !c.qf_fudged && c.alpha === 0.05 && [0.10, 0.25, 0.40].includes(c.f) &&
  [2, 3, 4, 6, 8].includes(c.k) && [0.80, 0.90].includes(c.power));
for (const c of nCases) {
  await setVal('fval', c.f); await setVal('k', c.k); await setVal('power', c.power); await setVal('alpha', c.alpha);
  const shown = await num('#bignv');
  ok(`n-mode k=${c.k} f=${c.f} pw=${c.power} bign`, shown === c.n_ceil, shown, c.n_ceil);
  const exact = await num('#s_exact');
  near(`n-mode k=${c.k} f=${c.f} pw=${c.power} exact n`, exact, c.n, 5e-3);
  const verdict = await txt('#verdict');
  ok(`n-mode k=${c.k} f=${c.f} verdict text`, verdict === `Recruit ${c.n_ceil} per group`, verdict, `Recruit ${c.n_ceil} per group`);
  const vsub = await txt('#vsub');
  ok(`n-mode k=${c.k} f=${c.f} total N`, vsub.includes(String(c.N_total)), vsub, `contains ${c.N_total}`);
}

// ============================================================
// 2. MODE power - rendered power vs the truth table
// ============================================================
await setMode('power');
const pCases = T.powerAtN.filter(c => c.alpha === 0.05 && [0.10, 0.25, 0.40].includes(c.f) &&
  [3, 4, 8].includes(c.k) && [10, 25, 50, 100].includes(c.n));
for (const c of pCases) {
  await setVal('fval', c.f); await setVal('k', c.k); await setVal('nper', c.n); await setVal('alpha', c.alpha);
  const shown = await num('#s_ach');
  near(`power-mode k=${c.k} f=${c.f} n=${c.n}`, shown, c.power, 5e-5);
  const headline = await txt('#verdict');
  ok(`power-mode k=${c.k} f=${c.f} n=${c.n} headline`, headline === `${(100 * c.power).toFixed(1)}% power`, headline, `${(100 * c.power).toFixed(1)}% power`);
}

// ============================================================
// 3. MODE detectable f - rendered f vs the truth table
// ============================================================
await setMode('f');
const fCases = T.solveF.filter(c => c.alpha === 0.05 && [3, 4, 8].includes(c.k) &&
  [10, 20, 50, 100].includes(c.n) && [0.80, 0.90].includes(c.power));
for (const c of fCases) {
  await setVal('k', c.k); await setVal('nper', c.n); await setVal('power', c.power); await setVal('alpha', c.alpha);
  const shown = await num('#bignv');
  near(`f-mode k=${c.k} n=${c.n} pw=${c.power}`, shown, c.f, 1e-3);
}
// effect inputs must be hidden while solving FOR the effect
ok('srcrow hidden in f mode', await page.locator('#srcrow').isVisible() === false, await page.locator('#srcrow').isVisible(), false);
ok('#ff hidden in f mode', await page.locator('#ff').isVisible() === false, await page.locator('#ff').isVisible(), false);

// ============================================================
// 4. SRC means - f derived from group means, k derived from the list
// ============================================================
await setMode('n');
await setSrc('means');
for (const c of T.fFromMeans) {
  if (!(c.f > 0)) continue;
  const means = Array.isArray(c.means) ? c.means : [c.means];
  await setVal('means', means.join(', '));
  await setVal('sdw', c.sd);
  await setVal('power', 0.80); await setVal('alpha', 0.05);
  const kShown = parseInt(await page.inputValue('#k'), 10);
  ok(`means k derived (${means.length} means)`, kShown === c.k, kShown, c.k);
  const fShown = await num('#s_f');
  near(`means f=${c.f.toFixed(4)}`, fShown, c.f, 5e-4);
  const shown = await num('#bignv');
  ok(`means n=${c.n_ceil}`, shown === c.n_ceil, shown, c.n_ceil);
  // k field is locked when derived
  ok('k disabled when derived from means', await page.locator('#k').isDisabled(), await page.locator('#k').isDisabled(), true);
  // the derived-effect note fires
  ok('dnote shown for means', await page.locator('#dnote').isVisible(), await page.locator('#dnote').isVisible(), true);
}

// R's ?power.anova.test doc example: f is exactly 0.5
await setVal('means', '120, 130, 140, 150');
await setVal('sdw', Math.sqrt(500));
await setVal('power', 0.90);
near('doc example f == 0.5', await num('#s_f'), 0.5, 1e-3);
ok('doc example n == 16', await num('#bignv') === T.edge.doc_example.n_ceil, await num('#bignv'), T.edge.doc_example.n_ceil);

// ============================================================
// 5. SRC eta2
// ============================================================
await setSrc('eta2');
for (const c of T.eta2.filter(c => c.eta2 >= 0.01 && c.eta2 <= 0.5)) {
  await setVal('eta2', c.eta2); await setVal('k', 4); await setVal('power', 0.80); await setVal('alpha', 0.05);
  const fShown = await num('#s_f');
  near(`eta2=${c.eta2} -> f`, fShown, c.f, 5e-4);
}
ok('eta2 dnote shown', await page.locator('#dnote').isVisible(), await page.locator('#dnote').isVisible(), true);

// ============================================================
// 6. THE k=2 RECONCILIATION (the taught claim, verified in the UI)
// ============================================================
await setSrc('f');
await setVal('fval', 0.25); await setVal('k', 2); await setVal('power', 0.80); await setVal('alpha', 0.05);
ok('k=2 f=0.25 -> 64 per group (== t-test tool at d=0.5)', await num('#bignv') === 64, await num('#bignv'), 64);
near('k=2 exact n == pwr.t.test d=0.5', await num('#s_exact'), 63.766, 1e-3);
const rc2 = await txt('#rcodepre');
ok('k=2 R block emits the t-test cross-check', rc2.includes('pwr.t.test(d = 0.5'), rc2.slice(0, 400), 'contains pwr.t.test(d = 0.5');

// ============================================================
// 7. R CODE + steps update live
// ============================================================
await setVal('fval', 0.25); await setVal('k', 3); await setVal('power', 0.80);
const rcA = await txt('#rcodepre');
ok('R code names pwr.anova.test', rcA.includes('pwr.anova.test(k = 3, f = 0.25'), rcA.slice(0, 300), 'pwr.anova.test(k = 3, f = 0.25');
ok('R code names power.anova.test', rcA.includes('power.anova.test('), true, true);
await setVal('k', 5);
const rcB = await txt('#rcodepre');
ok('R code updates on input', rcB.includes('k = 5') && rcB !== rcA, true, true);
await page.click('details.how summary');
const stepsTxt = await txt('#steps');
ok('steps carry live numbers', stepsTxt.includes('&lambda;') === false && /lambda|λ/.test(stepsTxt), true, 'steps rendered');
ok('steps mention rounding up', /ceiling\(/.test(stepsTxt), true, true);

// ============================================================
// 8. ERROR HANDLING - human messages, and fixing clears them
// ============================================================
await setVal('k', 1);
ok('k=1 errors', await page.locator('#err.show').count() === 1, await page.locator('#err.show').count(), 1);
ok('k=1 message is human', (await txt('#err')).includes('at least 2 groups'), await txt('#err'), 'mentions at least 2 groups');
await setVal('k', 3);
ok('fixing k clears the error', await page.locator('#err.show').count() === 0, await page.locator('#err.show').count(), 0);

await setVal('fval', 0);
ok('f=0 errors', await page.locator('#err.show').count() === 1, await page.locator('#err.show').count(), 1);
await setVal('fval', 0.25);
await setVal('alpha', 0);
ok('alpha=0 errors', await page.locator('#err.show').count() === 1, await page.locator('#err.show').count(), 1);
await setVal('alpha', 0.05);
await setVal('power', 0.05);
ok('power<=alpha errors', await page.locator('#err.show').count() === 1, await page.locator('#err.show').count(), 1);
await setVal('power', 0.80);
ok('all fixed, no error', await page.locator('#err.show').count() === 0, await page.locator('#err.show').count(), 0);

// junk paste into means
await setSrc('means');
await setVal('means', 'abc, def');
ok('junk means errors', await page.locator('#err.show').count() === 1, await page.locator('#err.show').count(), 1);
await setVal('means', '10');
ok('single mean errors', await page.locator('#err.show').count() === 1, await page.locator('#err.show').count(), 1);
await setVal('means', '10, 12, 15');
await setVal('sdw', 0);
ok('sd=0 errors', await page.locator('#err.show').count() === 1, await page.locator('#err.show').count(), 1);
await setVal('sdw', 4);
ok('means fixed, no error', await page.locator('#err.show').count() === 0, await page.locator('#err.show').count(), 0);
// tolerant separators
await setVal('means', '10 12 15');
ok('space-separated means parse', await page.locator('#err.show').count() === 0, await page.locator('#err.show').count(), 0);

// ============================================================
// 9. WHAT-IF slider over k (the spec's n-vs-k teaching)
// ============================================================
await setSrc('f');
await setVal('fval', 0.25); await setVal('k', 3); await setVal('power', 0.80); await setVal('alpha', 0.05);
await page.fill('#wf', '6');
await page.dispatchEvent('#wf', 'input');
const wf = await txt('#wfv');
const k6 = T.nVsK.find(r => r.f === 0.25 && r.k === 6);
ok('what-if k=6 n per group', wf.includes(`${k6.n_ceil} per group`), wf, `contains ${k6.n_ceil} per group`);
ok('what-if k=6 total', wf.includes(`${k6.N_total} total`), wf, `contains ${k6.N_total} total`);

// live n-vs-k table
const kRows = await page.locator('#kbody tr').count();
ok('n-vs-k table has 9 rows (k=2..10)', kRows === 9, kRows, 9);
const kbodyTxt = await txt('#kbody');
const k3 = T.nVsK.find(r => r.f === 0.25 && r.k === 3);
ok('n-vs-k table row k=3 correct', kbodyTxt.includes(String(k3.n_ceil)) && kbodyTxt.includes(String(k3.N_total)), true, true);

// live lever table
const levRows = await page.locator('#levbody tr').count();
ok('lever table rendered', levRows >= 3, levRows, '>=3');

// ============================================================
// 10. VIZ
// ============================================================
ok('viz svg renders', await page.locator('#viz svg').count() === 1, await page.locator('#viz svg').count(), 1);
const aria = await page.getAttribute('#viz svg', 'aria-label');
ok('viz has aria-label', (aria || '').length > 30, aria, '>30 chars');
await setVal('fval', 0.40);
const aria2 = await page.getAttribute('#viz svg', 'aria-label');
ok('viz updates live', aria2 !== aria, true, true);

// ============================================================
// 11. COPY buttons
// ============================================================
// navigator.clipboard.writeText() resolves asynchronously and the label flips in
// its .then(), so poll for the confirmation rather than reading it straight after
// the click (reading twice in one assertion races the promise).
await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
async function confirmsCopy(sel, label) {
  await page.click(sel);
  try {
    await page.waitForFunction(
      ([s, l]) => document.querySelector(s).textContent.trim() === l, [sel, 'Copied'], { timeout: 3000 });
    pass++;
    // and the clipboard really holds the text
    const clip = (await page.evaluate(() => navigator.clipboard.readText())).trim();
    ok(`${label} clipboard has content`, clip.length > 20, clip.slice(0, 40), '>20 chars');
  } catch (e) {
    fail++;
    fails.push(`${label} copy: label never became "Copied" (got "${await txt(sel)}")`);
  }
}
await confirmsCopy('#copybtn', 'report');
await confirmsCopy('#rcopy', 'rcode');

// ============================================================
// 12. MOBILE 390px - no horizontal overflow
// ============================================================
for (const w of [360, 390, 768, 1280]) {
  await page.setViewportSize({ width: w, height: 900 });
  await page.waitForTimeout(120);
  const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ok(`no overflow at ${w}px`, over <= 1, over, '<=1');
}
await page.setViewportSize({ width: 1280, height: 1000 });

// ============================================================
// 13. HEALTH
// ============================================================
const rendered = await page.evaluate(() => document.documentElement.outerHTML.length);
ok('rendered html < 200KB (tool-audit ceiling)', rendered / 1024 < 200, (rendered / 1024).toFixed(1) + 'KB', '<200KB');
console.log(`  rendered outerHTML: ${(rendered / 1024).toFixed(1)}KB`);
ok('no console errors', consoleErrors.length === 0, consoleErrors.slice(0, 3), []);
ok('no unexpected 404s', bad404.length === 0, bad404.slice(0, 3), []);
ok('no unexpected failed requests', failedReqs.length === 0, failedReqs.slice(0, 3), []);

// title contract 40-60 chars
const title = await page.title();
ok(`title 40-60ch (${title.length})`, title.length >= 40 && title.length <= 60, title.length, '40-60');
// schema valid
const schemas = await page.$$eval('script[type="application/ld+json"]', ns => ns.map(n => n.textContent));
schemas.forEach((s, i) => { try { JSON.parse(s); pass++; } catch (e) { fail++; fails.push(`schema[${i}] invalid JSON: ${e.message}`); } });
ok('WebApplication + FAQPage schemas', schemas.length === 2, schemas.length, 2);

await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
if (fails.length) { console.log('\nfailures:'); fails.forEach(f => console.log('  ' + f)); }
process.exit(fail ? 1 : 0);
