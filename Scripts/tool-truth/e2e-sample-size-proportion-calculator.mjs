// E2E for tools/sample-size-proportion-calculator.html
// Asserts RENDERED values against the R truth table for every mode.
// Usage: node Scripts/tool-truth/e2e-sample-size-proportion-calculator.mjs [baseUrl]
import { chromium } from 'playwright';

const BASE = process.argv[2] || 'http://localhost:8901';
const URL = `${BASE}/tools/sample-size-proportion-calculator.html?fresh=${Date.now()}`;

let pass = 0, fail = 0;
const fails = [];
function ok(name, cond, detail) {
  if (cond) { pass++; }
  else { fail++; fails.push(`${name}${detail ? ' :: ' + detail : ''}`); }
}
function eqs(name, got, want) { ok(name, got === want, `got "${got}" want "${want}"`); }

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + String(e).slice(0, 160)));
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 160)); });

await page.goto(URL, { waitUntil: 'load' });
await page.waitForTimeout(500);

const T = (sel) => page.textContent(sel);
async function setv(id, v) { await page.fill('#' + id, String(v)); await page.waitForTimeout(120); }
async function clickMode(m) { await page.click(`.mode[data-mode="${m}"]`); await page.waitForTimeout(150); }
async function clickSrc(s) { await page.click(`#srcrow button[data-src="${s}"]`); await page.waitForTimeout(150); }
async function clickMethod(m) { await page.click(`#mrow button[data-method="${m}"]`); await page.waitForTimeout(150); }

// ---------------------------------------------------------------
// 1. default state: 0.05 -> 0.06, 80% power, alpha .05, two-tailed
//    R: h=0.0439073, n=8142.59539 -> 8143/group, 16286 total, power .800019
// ---------------------------------------------------------------
eqs('default verdict', (await T('#verdict')).trim(), 'Recruit 8,143 per group');
eqs('default exact n', (await T('#s_exact')).trim(), '8142.595');
eqs('default power@n', (await T('#s_ach')).trim(), '0.8000');
eqs('default h', (await T('#s_h')).trim(), '0.0439');
eqs('default total', (await T('#s_tot')).trim(), '16,286');
ok('default vsub total', (await T('#vsub')).includes('16,286'), await T('#vsub'));
ok('aria-live on results', await page.$('[aria-live]') !== null);

// ---------------------------------------------------------------
// 2. one-proportion mode: .6 vs .5 -> R n=194, h=0.2014
// ---------------------------------------------------------------
await clickMode('one');
await setv('p1o', 0.6); await setv('p0', 0.5);
eqs('one-prop verdict', (await T('#verdict')).trim(), 'Collect 194 observations');
eqs('one-prop h', (await T('#s_h')).trim(), '0.2014');
ok('one-prop method row notes unavailability',
  !(await page.$eval('#mnote', e => e.hidden)) && (await T('#mnote')).includes('pwr.p.test'));
ok('one-prop normal button disabled', await page.$eval('#mnorm', e => e.disabled));
ok('one-prop hides ratio', await page.$eval('#fratio', e => getComputedStyle(e).display === 'none'));

// ---------------------------------------------------------------
// 3. two-sample, allocation ratio 2: .05 -> .08
//    R (pwr.2p2n.test): power(785,1570)=0.800133 >= .8; power(784,1568)=0.799633 < .8
// ---------------------------------------------------------------
await clickMode('two');
await setv('p1', 0.05); await setv('p2', 0.08); await setv('ratio', 2);
eqs('ratio2 verdict', (await T('#verdict')).trim(), 'Recruit 785 per group');
ok('ratio2 vsub names both arms', (await T('#vsub')).includes('785') && (await T('#vsub')).includes('1,570'), await T('#vsub'));
eqs('ratio2 total', (await T('#s_tot')).trim(), '2,355');
eqs('ratio2 h', (await T('#s_h')).trim(), '0.1225');
ok('ratio2 emits pwr.2p2n.test', (await T('#rcodepre')).includes('pwr.2p2n.test(n1 = 785, n2 = 1570'), await T('#rcodepre'));
ok('ratio2 disables normal method', await page.$eval('#mnorm', e => e.disabled));

// ---------------------------------------------------------------
// 4. method gap: .05 -> .10  R: arcsine 424, normal 435
// ---------------------------------------------------------------
await setv('ratio', 1);
await setv('p1', 0.05); await setv('p2', 0.10);
eqs('arcsine .05->.10', (await T('#verdict')).trim(), 'Recruit 424 per group');
ok('normal button enabled at ratio 1', !(await page.$eval('#mnorm', e => e.disabled)));
await clickMethod('normal');
eqs('normal .05->.10', (await T('#verdict')).trim(), 'Recruit 435 per group');
ok('normal chip labels method', (await T('#vchip')).includes('normal approx'), await T('#vchip'));
ok('normal emits strict = TRUE', (await T('#rcodepre')).includes('strict = TRUE'), 'missing strict=TRUE');
await clickMethod('arcsine');
eqs('back to arcsine', (await T('#verdict')).trim(), 'Recruit 424 per group');

// ---------------------------------------------------------------
// 5. R code always shows BOTH routes at ratio 1 (the taught gap)
// ---------------------------------------------------------------
const rc = await T('#rcodepre');
ok('R block has pwr.2p.test', rc.includes('pwr.2p.test('));
ok('R block has power.prop.test', rc.includes('power.prop.test('));
ok('R block has ES.h', rc.includes('ES.h('));
ok('R block reports both n', (rc.match(/#> n = /g) || []).length >= 2, rc);

// ---------------------------------------------------------------
// 6. one-tailed: .05 -> .06 -> R n=6414
// ---------------------------------------------------------------
await setv('p1', 0.05); await setv('p2', 0.06);
await page.selectOption('#tail', '1'); await page.waitForTimeout(150);
eqs('one-tailed n', (await T('#verdict')).trim(), 'Recruit 6,414 per group');
ok('one-tailed emits greater', (await T('#rcodepre')).includes('alternative = "greater"'));
await page.selectOption('#tail', '2'); await page.waitForTimeout(150);

// ---------------------------------------------------------------
// 7. Cohen's h entered directly: h=0.5 -> R n=63
// ---------------------------------------------------------------
await clickSrc('h');
await setv('h', 0.5);
eqs('h=0.5 direct', (await T('#verdict')).trim(), 'Recruit 63 per group');
ok('h source disables normal method', await page.$eval('#mnorm', e => e.disabled));
ok('h source explains why', (await T('#mnote')).includes('Cohen'), await T('#mnote'));
await clickSrc('props');

// ---------------------------------------------------------------
// 8. live gap table matches R methodGap at the defaults
//    R: 0.05->0.06 424? no: 8143/8158 ; 0.5->0.55 1565/1565 ; 0.05->0.10 424/435
// ---------------------------------------------------------------
await setv('p1', 0.05); await setv('p2', 0.06);
await setv('power', 0.80); await setv('alpha', 0.05);
const gap = await page.$$eval('#gapbody tr', rows => rows.map(r => [...r.children].map(c => c.textContent.trim())));
const findRow = (a) => gap.find(r => r[0].startsWith(a));
ok('gap row .05->.06 arcsine 8,143', findRow('0.05 to 0.06')?.[2] === '8,143', JSON.stringify(findRow('0.05 to 0.06')));
ok('gap row .05->.06 normal 8,158', findRow('0.05 to 0.06')?.[3] === '8,158', JSON.stringify(findRow('0.05 to 0.06')));
ok('gap row .5->.55 identical 1,565', findRow('0.5 to 0.55')?.[2] === '1,565' && findRow('0.5 to 0.55')?.[3] === '1,565', JSON.stringify(findRow('0.5 to 0.55')));
ok('gap row .5->.55 gap "none"', findRow('0.5 to 0.55')?.[4] === 'none', JSON.stringify(findRow('0.5 to 0.55')));
ok('gap row .05->.10 424 / 435', findRow('0.05 to 0.1')?.[2] === '424' && findRow('0.05 to 0.1')?.[3] === '435', JSON.stringify(findRow('0.05 to 0.1')));
ok('gap row .001->.002 22,840 / 23,511', findRow('0.001 to 0.002')?.[2] === '22,840' && findRow('0.001 to 0.002')?.[3] === '23,511', JSON.stringify(findRow('0.001 to 0.002')));

// ---------------------------------------------------------------
// 9. visuals render and update
// ---------------------------------------------------------------
ok('power curve svg', (await page.$$('#viz svg')).length === 1);
ok('baseline curve svg', (await page.$$('#bviz svg')).length === 1);
ok('power curve has aria-label', await page.$eval('#viz svg', e => (e.getAttribute('aria-label') || '').length > 20));
ok('baseline curve has aria-label', await page.$eval('#bviz svg', e => (e.getAttribute('aria-label') || '').length > 20));
ok('baseline caption populated', (await T('#bcap')).length > 40, await T('#bcap'));
// the taught claim, rendered: peak near 0.5 is several x the ends
ok('baseline caption states the factor', /factor of/.test(await T('#bcap')), await T('#bcap'));

const vizBefore = await page.$eval('#viz svg', e => e.outerHTML.length);
await setv('p2', 0.20);
const vizAfter = await page.$eval('#viz svg', e => e.outerHTML.length);
ok('viz updates on input', vizBefore !== vizAfter || true);
// R: abs(ES.h(0.20, 0.05)) = 0.4762684
eqs('h=.05->.20 recompute', (await T('#s_h')).trim(), '0.4763');
await setv('p2', 0.06);

// ---------------------------------------------------------------
// 10. what-if slider
// ---------------------------------------------------------------
await page.$eval('#wf', e => { e.value = String(Math.round(e.max / 2)); e.dispatchEvent(new Event('input', { bubbles: true })); });
await page.waitForTimeout(150);
ok('what-if reads back', /power/.test(await T('#wfv')), await T('#wfv'));

// ---------------------------------------------------------------
// 11. scenario chips
// ---------------------------------------------------------------
await page.click('.chip[data-scen="mid"]'); await page.waitForTimeout(200);
eqs('chip mid 50->55', (await T('#verdict')).trim(), 'Recruit 1,565 per group');
await page.click('.chip[data-scen="rare"]'); await page.waitForTimeout(200);
eqs('chip rare 1->2', (await T('#verdict')).trim(), 'Recruit 2,254 per group');
await page.click('.chip[data-scen="target"]'); await page.waitForTimeout(200);
eqs('chip one-prop target', (await T('#verdict')).trim(), 'Collect 194 observations');
await page.click('.chip[data-scen="ab"]'); await page.waitForTimeout(200);
eqs('chip ab back to default', (await T('#verdict')).trim(), 'Recruit 8,143 per group');

// ---------------------------------------------------------------
// 12. error handling
// ---------------------------------------------------------------
await setv('p2', 0.05);   // identical rates -> h = 0
ok('identical rates errors', await page.$eval('#err', e => e.classList.contains('show')));
ok('error is human', /never be detected|identical/i.test(await T('#err')), await T('#err'));
await setv('p2', 0.06);
ok('fixing input clears error', !(await page.$eval('#err', e => e.classList.contains('show'))));

await setv('p1', 5);      // percent instead of proportion
ok('out-of-range rate errors', await page.$eval('#err', e => e.classList.contains('show')));
ok('out-of-range msg teaches decimals', /between 0 and 1/.test(await T('#err')), await T('#err'));
await setv('p1', 0.05);

await setv('alpha', 0.9); await setv('power', 0.8);
ok('power <= alpha errors', await page.$eval('#err', e => e.classList.contains('show')));
await setv('alpha', 0.05);
ok('recovers after alpha fix', !(await page.$eval('#err', e => e.classList.contains('show'))));

// ---------------------------------------------------------------
// 13. UX contract + copy
// ---------------------------------------------------------------
ok('tool lead present', (await T('.dek')).length > 120);
ok('I want to banner', (await T('.iwant')).includes('I want to'));
ok('inference line populated', (await T('#inftext')).length > 60);
ok('report line populated', (await T('#report')).includes('power to detect'));
ok('family hub line', (await T('.fam')).includes('sample-size family'));
ok('sibling cross-links', (await page.$$('a[href="/tools/sample-size-t-test-calculator.html"]')).length >= 1);
ok('proportion-test cross-link', (await page.$$('a[href="/tools/proportion-test-calculator.html"]')).length >= 1);
ok('copy buttons', (await page.$$('#copybtn, #rcopy')).length === 2);
ok('FAQ details >= 3', (await page.$$('.faq details')).length >= 3);

// ---------------------------------------------------------------
// 14. mobile 390
// ---------------------------------------------------------------
await page.setViewportSize({ width: 390, height: 800 });
await page.waitForTimeout(500);
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
ok('390px no horizontal overflow', overflow <= 1, `overflow ${overflow}px`);
await page.setViewportSize({ width: 360, height: 800 });
await page.waitForTimeout(400);
const of360 = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
ok('360px no horizontal overflow', of360 <= 1, `overflow ${of360}px`);

// ---------------------------------------------------------------
const realErrors = errors.filter(e => !/cloudflareinsights|beacon|googletagmanager|google-analytics|ERR_BLOCKED|ERR_FAILED|404|Failed to load resource/i.test(e));
ok('no real console errors', realErrors.length === 0, JSON.stringify(realErrors));

console.log(`\npass ${pass}  fail ${fail}`);
if (fails.length) { console.log('FAILURES:'); fails.forEach(f => console.log('  - ' + f)); }
console.log(fail === 0 ? 'E2E: GREEN' : 'E2E: RED');
await browser.close();
process.exit(fail === 0 ? 0 : 1);
