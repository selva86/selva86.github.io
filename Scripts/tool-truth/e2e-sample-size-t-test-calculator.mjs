/* Local E2E for sample-size-t-test-calculator: asserts RENDERED values against
   the R truth table for every mode (incl. means+SD derivation, unequal allocation,
   the what-if slider, the live lever table and the emitted R code), plus error
   handling, mobile overflow and console health.
   Usage: node Scripts/tool-truth/e2e-sample-size-t-test-calculator.mjs [baseUrl] */
import { chromium } from 'playwright';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const T = require('./sample-size-t-test-calculator.json');

const BASE = process.argv[2] || 'http://127.0.0.1:8899';
const URL = `${BASE}/tools/sample-size-t-test-calculator.html?fresh=${Date.now()}`;

let pass = 0, fail = 0;
const ok = (c, m, got, exp) => {
  if (c) pass++;
  else { fail++; console.log(`  FAIL ${m}` + (got !== undefined ? `\n        got=${got}\n        exp=${exp}` : '')); }
};
const numOf = s => parseFloat(String(s).replace(/[^0-9eE.+-]/g, ''));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
// Track failing URLs directly: the console text for a 404 does not name the
// resource, so URL-based filtering has to come from the response listener.
// /cdn-cgi/trace (consent geo-gate) and /api/me (auth hydration) are Cloudflare
// Functions endpoints and cannot exist on a local python http.server - genuinely
// environmental, verified 2026-07-16, not page faults.
const ENVIRONMENTAL = /\/cdn-cgi\/|\/api\/me|cloudflareinsights|googletagmanager|gtag|favicon/i;
const badUrls = [];
page.on('response', r => { if (r.status() >= 400 && !ENVIRONMENTAL.test(r.url())) badUrls.push(r.status() + ' ' + r.url()); });
page.on('console', m => {
  if (m.type() !== 'error') return;
  const t = m.text();
  if (/Failed to load resource/i.test(t)) return; // adjudicated by badUrls above
  errors.push(t);
});
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
await page.goto(URL, { waitUntil: 'networkidle' });

const setMode = async m => { await page.selectOption('#iwsel', m); await page.waitForTimeout(50); };
const setVal = async (sel, v) => { await page.fill(sel, String(v)); await page.dispatchEvent(sel, 'input'); await page.waitForTimeout(45); };
const txt = async sel => (await page.textContent(sel)).trim();
const modeKey = t => t === 'one.sample' ? 'one' : t === 'two.sample' ? 'two' : 'paired';

// ---------------------------------------------------------------- 1. first paint
console.log('\n1. first paint (never an empty tool)');
ok((await txt('#bignv')) === '64', 'default two-sample d=0.5 pw=.80 a=.05 -> 64/group', await txt('#bignv'), '64');
ok((await txt('#vsub')).includes('128'), 'total 128 shown', await txt('#vsub'), 'contains 128');
ok((await page.$('#viz svg')) !== null, 'power curve renders on first paint');
ok((await txt('#report')).length > 40, 'report line populated on first paint');

// ---------------------------------------------------------------- 2. solveN vs R, all 3 modes
console.log('\n2. rendered n vs R pwr.t.test (ceiling), sampled across the grid');
const sample = T.solveN.filter(c => [0.2, 0.5, 0.8].includes(c.d) && [0.05, 0.01].includes(c.alpha));
await page.click('#srcd');
for (const c of sample) {
  await setMode(modeKey(c.type));
  await setVal('#d', c.d);
  await setVal('#power', c.power);
  await setVal('#alpha', c.alpha);
  await page.selectOption('#tail', c.tail === 'two.sided' ? '2' : '1');
  if (modeKey(c.type) === 'two') await setVal('#ratio', 1);
  await page.waitForTimeout(45);
  const expN = Math.ceil(c.n_pwr - 1e-9);
  const gotN = numOf(await txt('#bignv'));
  ok(gotN === expN, `${c.id} rendered n`, gotN, expN);
  const gotExact = numOf(await txt('#s_exact'));
  ok(Math.abs(gotExact - c.n_pwr) < 5e-3, `${c.id} exact n stat`, gotExact, c.n_pwr.toFixed(3));
}

// ---------------------------------------------------------------- 3. unequal allocation
console.log('\n3. unequal allocation vs R (n1, n2, achieved power via pwr.t2n.test)');
await setMode('two');
for (const c of T.solveNRatio.filter(c => c.alpha === 0.05 && c.power === 0.80 && c.tail === 'two.sided')) {
  await setVal('#d', c.d);
  await setVal('#power', c.power);
  await setVal('#alpha', c.alpha);
  await page.selectOption('#tail', '2');
  await setVal('#ratio', c.ratio);
  await page.waitForTimeout(45);
  const expN1 = Math.ceil(c.n1 - 1e-9);
  const gotN1 = numOf(await txt('#bignv'));
  ok(gotN1 === expN1, `${c.id} n1`, gotN1, expN1);
  const sub = await txt('#vsub');
  const expN2 = Math.ceil(expN1 * c.ratio - 1e-9);
  ok(sub.includes(String(expN2)), `${c.id} n2=${expN2} in subtitle`, sub, `contains ${expN2}`);
  // R code must switch to pwr.t2n.test when ratio != 1
  const rc = await txt('#rcodepre');
  ok(rc.includes('pwr.t2n.test'), `${c.id} R code uses pwr.t2n.test`, rc.slice(0, 60), 'pwr.t2n.test');
  ok(rc.includes(`n1 = ${expN1}`) && rc.includes(`n2 = ${expN2}`), `${c.id} R code carries the planned pair`);
}
await setVal('#ratio', 1);

// ---------------------------------------------------------------- 4. means + SD -> d
console.log('\n4. means + SD derivation vs R');
for (const c of T.dFromMeans) {
  const mk = modeKey(c.type);
  await setMode(mk);
  await page.click('#srcm');
  await page.waitForTimeout(40);
  if (mk === 'one') { await setVal('#mean', c.m); await setVal('#mu0', c.mu0); await setVal('#sd', c.sd); }
  else if (mk === 'two') { await setVal('#mean1', c.m1); await setVal('#mean2', c.m2); await setVal('#sd1', c.s1); await setVal('#sd2', c.s2); }
  else { await setVal('#meanDiff', c.mdiff); await setVal('#sdDiff', c.sdiff); }
  await setVal('#power', 0.80); await setVal('#alpha', 0.05);
  await page.selectOption('#tail', '2');
  await page.waitForTimeout(50);
  // the stat is displayed at 2dp, so compare against the 2dp rounding of R's d,
  // not against d itself (|0.63 - 0.625| is exactly at a 5e-3 boundary otherwise)
  const gotD = numOf(await txt('#s_d'));
  const expD = Number(Math.abs(c.d).toFixed(2));
  ok(Math.abs(gotD - expD) < 1e-9, `${c.id} rendered |d|`, gotD, expD);
  const gotN = numOf(await txt('#bignv'));
  const expN = Math.ceil(c.n_at_default - 1e-9);
  ok(gotN === expN, `${c.id} n from derived d`, gotN, expN);
  const note = await txt('#dnote');
  ok(note.toLowerCase().includes('imply') || note.includes('d ='), `${c.id} derivation note shown`, note.slice(0, 50), 'd = ...');
}
await page.click('#srcd');
await setMode('two');
await setVal('#d', 0.5); await setVal('#power', 0.80); await setVal('#alpha', 0.05);

// ---------------------------------------------------------------- 5. what-if slider
console.log('\n5. what-if slider tracks power(n) from the truth table');
for (const c of T.powerAtN.filter(x => x.type === 'two.sample' && x.d === 0.5 && x.alpha === 0.05 && x.tail === 'two.sided' && x.n <= 100 && x.n >= 10)) {
  await page.fill('#wf', String(c.n));
  await page.dispatchEvent('#wf', 'input');
  await page.waitForTimeout(45);
  const wfv = await txt('#wfv');
  const gotPct = parseFloat(wfv.match(/([\d.]+)%/)[1]);
  ok(Math.abs(gotPct - c.power_pwr * 100) < 0.06, `slider n=${c.n} power`, gotPct, (c.power_pwr * 100).toFixed(1));
}

// ---------------------------------------------------------------- 6. live lever table
console.log('\n6. live lever table matches R');
await setVal('#d', 0.5); await setVal('#power', 0.80); await setVal('#alpha', 0.05);
await page.selectOption('#tail', '2');
await page.waitForTimeout(60);
for (const [d, pw] of [[0.2, 0.80], [0.5, 0.90], [0.8, 0.95]]) {
  const c = T.solveN.find(x => x.type === 'two.sample' && x.d === d && x.alpha === 0.05 && x.power === pw && x.tail === 'two.sided');
  const col = { 0.80: 1, 0.90: 2, 0.95: 3 }[pw];
  const cell = await page.evaluate(([dd, cc]) => {
    const rows = [...document.querySelectorAll('#levbody tr')];
    const r = rows.find(r => r.cells[0].textContent.includes('d = ' + dd));
    return r ? r.cells[cc].textContent.trim() : null;
  }, [String(d), col]);
  if (c) ok(numOf(cell) === Math.ceil(c.n_pwr - 1e-9), `lever d=${d} power=${pw}`, cell, Math.ceil(c.n_pwr - 1e-9));
}

// ---------------------------------------------------------------- 7. emitted R code correctness
console.log('\n7. emitted R code reproduces the displayed number');
await setVal('#d', 0.5); await setVal('#power', 0.80); await setVal('#alpha', 0.05); await setVal('#ratio', 1);
await page.waitForTimeout(60);
const rc = await txt('#rcodepre');
ok(rc.includes('pwr.t.test'), 'R code uses pwr.t.test for balanced');
ok(rc.includes('strict = TRUE'), 'power.t.test line carries strict = TRUE (else it would not reproduce n)');
ok(rc.includes('63.76561'), 'R code #> comment shows R 7-sig-digit n', rc.match(/#> n = [\d.]+/)?.[0], '63.76561');
ok(rc.includes('type = "two.sample"'), 'R code type matches mode');

// ---------------------------------------------------------------- 8. error handling
console.log('\n8. error handling with human messages');
await setVal('#d', 0);
ok(await page.isVisible('#err'), 'd=0 raises an error');
ok((await txt('#err')).toLowerCase().includes('zero') || (await txt('#err')).toLowerCase().includes('bigger'), 'd=0 message is human', await txt('#err'));
await setVal('#d', 0.5);
ok(!(await page.isVisible('#err')), 'fixing d clears the error');
await setVal('#power', 0.03); await setVal('#alpha', 0.05);
ok(await page.isVisible('#err'), 'power <= alpha raises an error');
await setVal('#power', 0.80);
ok(!(await page.isVisible('#err')), 'fixing power clears the error');
await setVal('#alpha', 2);
ok(await page.isVisible('#err'), 'alpha=2 raises an error');
await setVal('#alpha', 0.05);
await setVal('#d', '');
ok(await page.isVisible('#err'), 'empty d raises an error');
await setVal('#d', 0.5);
ok(!(await page.isVisible('#err')), 'recovered from empty d');
await setVal('#d', 0.0001);
ok(numOf(await txt('#bignv')) > 100000 || (await page.isVisible('#err')), 'tiny d gives a huge n or a clean error');
await setVal('#d', 0.5);

// ---------------------------------------------------------------- 9. the 3 mandatory UX features
console.log('\n9. the three old-tool UX features');
ok((await txt('.dek')).length > 120, 'tool lead under H1 present');
ok((await page.$('#iwsel')) !== null, '"I want to ..." banner has the mode selector');
await setMode('paired');
ok((await txt('#iwt')).includes('before-and-after'), 'banner text syncs with mode', await txt('#iwt'));
ok((await page.getAttribute('.mode[data-mode="paired"]', 'class')).includes('on'), 'mode pill syncs with banner select');
await setMode('two');
const inf = await txt('#inftext');
ok(inf.includes('recruit') || inf.includes('Recruit'), 'inference line names the conclusion', inf.slice(0, 70));
ok(inf.includes('64'), 'inference line carries THIS result', inf.slice(0, 70));

// ---------------------------------------------------------------- 10. scenario chips
console.log('\n10. scenario presets');
await page.click('[data-scen="alloc"]'); await page.waitForTimeout(80);
ok(numOf(await page.inputValue('#ratio')) === 2, '2:1 preset sets the ratio', await page.inputValue('#ratio'), 2);
await page.click('[data-scen="prepost"]'); await page.waitForTimeout(80);
ok((await txt('#vchip')).includes('Paired'), 'before/after preset switches to paired', await txt('#vchip'));
await page.click('[data-scen="classic"]'); await page.waitForTimeout(80);
ok(numOf(await txt('#bignv')) === 64, 'classic preset returns 64/group', await txt('#bignv'), 64);

// ---------------------------------------------------------------- 11. steps
console.log('\n11. how-computed steps carry live numbers');
const steps = await txt('#steps');
ok(steps.includes('63.76') || steps.includes('63.77'), 'steps show the exact root', steps.slice(0, 80));
ok(steps.includes('ceiling'), 'steps show the rounding');

// ---------------------------------------------------------------- 12. responsive + health
console.log('\n12. responsive + health');
for (const w of [360, 390, 768, 1280]) {
  await page.setViewportSize({ width: w, height: 900 });
  await page.waitForTimeout(120);
  const of = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ok(of <= 1, `no horizontal overflow @${w}px`, of, '<=1');
}
await page.setViewportSize({ width: 1280, height: 900 });
const realErrors = errors.filter(e => !/beacon|cloudflareinsights|cdn-cgi|googletagmanager|gtag|favicon|net::ERR_/i.test(e));
ok(realErrors.length === 0, 'zero console errors', realErrors.slice(0, 3).join(' | '), 'none');
ok(badUrls.length === 0, 'zero non-environmental failed requests', badUrls.slice(0, 3).join(' | '), 'none');
// prove the math libs actually loaded (a silent 404 here would fake-pass everything)
const globals = await page.evaluate(() => [typeof window.PowerMath, typeof window.SampleSizeTMath].join(','));
ok(globals === 'object,object', 'both math libs loaded from their pinned ?v paths', globals, 'object,object');

console.log(`\n${'='.repeat(52)}\npass ${pass}  fail ${fail}\n${'='.repeat(52)}`);
await browser.close();
process.exit(fail === 0 ? 0 : 1);
