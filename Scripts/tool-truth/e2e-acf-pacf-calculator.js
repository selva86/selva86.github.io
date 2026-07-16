/* Local E2E for tools/acf-pacf-calculator.html.
   Asserts the RENDERED DOM against the R truth table (not the lib in isolation
   -- the lib is already gated by test-acf-pacf-calculator-math.js). This catches
   the wiring bugs a math harness cannot see: a mode that does not re-difference,
   a chart that never repaints, a preset whose pasted values are not the vector R
   was verified on, a lag table that aligns ACF and PACF by index.

   Usage: node Scripts/tool-truth/e2e-acf-pacf-calculator.js [baseURL]  */
'use strict';
const { chromium } = require('playwright');
const truth = require('./acf-pacf-calculator.json');

const BASE = process.argv[2] || 'http://localhost:8901';
// Cache-bust when pointed at a deployed origin: Cloudflare negative-caches the
// 404s served while polling for a new page, so a bare URL right after a deploy
// can hand back the pre-deploy miss instead of the page that just went live.
const URL = BASE + '/tools/acf-pacf-calculator.html' +
  (/^https?:\/\/localhost/.test(BASE) ? '' : '?fresh=' + Date.now());

let pass = 0, fail = 0;
const fails = [];
function ok(name, cond, detail) {
  if (cond) pass++;
  else { fail++; if (fails.length < 30) fails.push(name + (detail ? ' -- ' + detail : '')); }
}
function close(got, want, tol) {
  if (!isFinite(got) || !isFinite(want)) return false;
  return Math.abs(got - want) <= (tol == null ? 6e-4 : tol);  // table prints 3dp
}
const caseOf = id => truth.cases.find(c => c.id === id);

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  await page.goto(URL, { waitUntil: 'networkidle' });

  // ---- read the rendered lag table ----------------------------------------
  async function readTable() {
    return page.$$eval('.lagtab tbody tr', rows => rows.map(r => {
      const td = r.querySelectorAll('td');
      const txt = i => (td[i] ? td[i].textContent.trim() : '');
      return { lag: txt(0), acf: txt(1), pacf: txt(2), flag: txt(3), lb: txt(4) };
    }));
  }
  async function setMode(mode) {
    await page.click(`.mode[data-mode="${mode}"]`);
    await page.waitForTimeout(60);
  }
  async function loadPreset(key) {
    await page.click(`.chip[data-preset="${key}"]`);
    await page.waitForTimeout(60);
  }

  // ===== 1. every preset x every transform vs R ============================
  const COMBOS = [
    ['air', 'none'], ['air', 'diff1'], ['air', 'diff2'], ['air', 'sdiff12'],
    ['lynx', 'none'], ['lynx', 'diff1'], ['lynx', 'sdiff12'],
    ['nile', 'none'], ['nile', 'diff1'], ['nile', 'diff2'], ['nile', 'sdiff12'],
    ['ar1', 'none'], ['ar1', 'diff1'],
    ['ma1', 'none'], ['wn', 'none']
  ];
  for (const [preset, transform] of COMBOS) {
    const c = caseOf(`${preset}-${transform}`);
    if (!c) { ok(`truth case ${preset}-${transform}`, false, 'missing from truth table'); continue; }
    await loadPreset(preset);
    await setMode(transform);
    const rows = await readTable();
    const tag = `${preset}/${transform}`;

    // the table must run lag 0..lagmax: acf has lag0, pacf does not
    ok(`${tag} row count`, rows.length === c.lagmax + 1, `got ${rows.length} want ${c.lagmax + 1}`);
    ok(`${tag} lag0 acf is 1`, /^1\.000/.test(rows[0].acf), rows[0].acf);
    ok(`${tag} lag0 pacf not defined`, /not defined/.test(rows[0].pacf), rows[0].pacf);

    for (let lag = 0; lag < rows.length; lag++) {
      const r = rows[lag];
      ok(`${tag} lag${lag} number`, Number(r.lag) === lag, r.lag);
      ok(`${tag} lag${lag} acf`, close(parseFloat(r.acf), c.acf[lag]),
         `got ${r.acf} want ${c.acf[lag]}`);
      if (lag > 0) {
        ok(`${tag} lag${lag} pacf`, close(parseFloat(r.pacf), c.pacf[lag - 1]),
           `got ${r.pacf} want ${c.pacf[lag - 1]}`);
        // Significance flags must agree with |value| > the band R computes.
        // Tokenise: a naive /ACF/ also matches inside "PACF".
        const flags = r.flag.split('+').map(s => s.trim());
        const sigAcf = Math.abs(c.acf[lag]) > c.band95;
        const sigPacf = Math.abs(c.pacf[lag - 1]) > c.band95;
        ok(`${tag} lag${lag} acf flag`, flags.includes('ACF') === sigAcf,
           `flag "${r.flag}" acf=${c.acf[lag]} band=${c.band95}`);
        ok(`${tag} lag${lag} pacf flag`, flags.includes('PACF') === sigPacf,
           `flag "${r.flag}" pacf=${c.pacf[lag - 1]} band=${c.band95}`);
      }
    }

    // n used + band + lag.max as displayed in the stats grid
    const stats = await page.$$eval('.st', els => els.map(e => ({
      k: e.querySelector('.sk').textContent.trim(),
      v: e.querySelector('.sv').textContent.trim()
    })));
    const get = k => (stats.find(s => s.k === k) || {}).v;
    ok(`${tag} n used`, Number(get('Observations used')) === c.n_used, `got ${get('Observations used')} want ${c.n_used}`);
    ok(`${tag} lags shown`, Number(get('Lags shown')) === c.lagmax, `got ${get('Lags shown')} want ${c.lagmax}`);
    ok(`${tag} band`, close(parseFloat(String(get('Significance band')).replace(/[^\d.]/g, '')), c.band95),
       `got ${get('Significance band')} want ${c.band95}`);

    // charts repaint for every combo
    const stems = await page.$$eval('#acfchart .cg-stem', e => e.length);
    const pstems = await page.$$eval('#pacfchart .cg-stem', e => e.length);
    ok(`${tag} acf chart stems`, stems === c.lagmax + 1, `got ${stems} want ${c.lagmax + 1}`);
    ok(`${tag} pacf chart stems`, pstems === c.lagmax, `got ${pstems} want ${c.lagmax}`);
  }

  // ===== 2. presets are the exact vectors R was verified on ================
  for (const key of ['air', 'lynx', 'nile', 'ar1', 'ma1', 'wn']) {
    await loadPreset(key);
    const pasted = await page.$eval('#data', e => e.value.trim().split('\n').map(Number));
    const want = truth.series[key];
    ok(`preset ${key} length`, pasted.length === want.length, `${pasted.length} vs ${want.length}`);
    ok(`preset ${key} values identical to R`, pasted.every((v, i) => v === want[i]), 'a value differs from the R truth vector');
  }

  // ===== 3. the lag-0 teaching toggle =====================================
  await loadPreset('air');
  await setMode('none');
  const withLag0 = await page.$$eval('#acfchart .cg-stem', e => e.length);
  await page.uncheck('#showlag0');
  await page.waitForTimeout(50);
  const noLag0 = await page.$$eval('#acfchart .cg-stem', e => e.length);
  ok('show-lag-0 toggle drops exactly one stem', noLag0 === withLag0 - 1, `${withLag0} -> ${noLag0}`);
  await page.check('#showlag0');

  // ===== 4. band level + lag.max controls =================================
  const air = caseOf('air-none');
  await page.selectOption('#cisel', '0.99');
  await page.waitForTimeout(50);
  let band99 = await page.$$eval('.st', els => {
    const e = els.find(x => x.querySelector('.sk').textContent.trim() === 'Significance band');
    return e ? e.querySelector('.sv').textContent.trim() : '';
  });
  ok('99% band matches R', close(parseFloat(band99.replace(/[^\d.]/g, '')), air.band99), `got ${band99} want ${air.band99}`);
  await page.selectOption('#cisel', '0.95');

  const lm5 = caseOf('air-lm5');
  await page.fill('#lagmax', '5');
  await page.waitForTimeout(60);
  let rows5 = await readTable();
  ok('lag.max=5 row count', rows5.length === lm5.lagmax + 1, `got ${rows5.length}`);
  ok('lag.max=5 acf lag5', close(parseFloat(rows5[5].acf), lm5.acf[5]), `${rows5[5].acf} vs ${lm5.acf[5]}`);
  await page.fill('#lagmax', '');
  await page.waitForTimeout(60);

  // ===== 5. error handling ================================================
  await page.fill('#data', '5\n5\n5\n5\n5\n5\n5\n5\n5\n5');
  await page.waitForTimeout(80);
  let errTxt = await page.$eval('#ierr', e => e.textContent);
  ok('constant series refuses, cites NaN', /NaN/.test(errTxt), errTxt);
  ok('constant series hides results', await page.$eval('#res', e => e.classList.contains('off')), 'results still visible');

  await page.fill('#data', '1\n2\n3');
  await page.waitForTimeout(80);
  errTxt = await page.$eval('#ierr', e => e.textContent);
  ok('too-short series errors', errTxt.length > 10, errTxt);

  await page.fill('#data', 'banana\nrhubarb');
  await page.waitForTimeout(80);
  ok('junk paste errors rather than throwing', (await page.$eval('#ierr', e => e.textContent)).length > 5);

  // fixing the input clears the error
  await loadPreset('air');
  await page.waitForTimeout(80);
  ok('fixing input clears the error', !(await page.$eval('#ierr', e => e.classList.contains('on'))));

  // ===== 6. input formats: time,value rows and one-line paste =============
  const head = truth.series.nile.slice(0, 40);
  const twoCol = 'year,flow\n' + head.map((v, i) => (1871 + i) + ',' + v).join('\n');
  await page.fill('#data', twoCol);
  await page.waitForTimeout(80);
  let meta = await page.$eval('#dmeta', e => e.textContent);
  ok('time,value rows parse to the value column', /40 observations/.test(meta), meta);
  ok('header row is skipped', /header row skipped/.test(meta), meta);

  await page.fill('#data', head.join(', '));
  await page.waitForTimeout(80);
  meta = await page.$eval('#dmeta', e => e.textContent);
  ok('one-line comma paste parses every value', /40 observations/.test(meta), meta);
  // the thousands-comma trap: 3-digit values must not collapse into one number
  const rowsOneLine = await readTable();
  ok('comma-separated 3-digit values are not merged', rowsOneLine.length > 3, `${rowsOneLine.length} rows`);

  // ===== 7. the R block tracks the mode ===================================
  await loadPreset('air');
  await setMode('none');
  let rcode = await page.$eval('#rcode', e => e.textContent);
  ok('R block names the dataset for a pristine preset', /as\.numeric\(AirPassengers\)/.test(rcode), rcode.slice(0, 80));
  ok('R block has acf()', /acf\(x, lag\.max = 21\)/.test(rcode));
  ok('R block has pacf()', /pacf\(x, lag\.max = 21\)/.test(rcode));
  ok('R block mentions ggAcf', /ggAcf/.test(rcode));
  await setMode('diff1');
  rcode = await page.$eval('#rcode', e => e.textContent);
  ok('R block re-emits diff() on mode change', /y <- diff\(x\)/.test(rcode) && /acf\(y/.test(rcode), rcode.slice(0, 120));
  await setMode('sdiff12');
  rcode = await page.$eval('#rcode', e => e.textContent);
  ok('R block emits seasonal diff', /diff\(x, lag = 12\)/.test(rcode));

  // ===== 8. the three mandatory UX features ==============================
  await setMode('none');
  ok('tool lead present under H1', (await page.$eval('.dek', e => e.textContent)).length > 120);
  ok('"I want to" banner present', /I want to/.test(await page.$eval('#iwant', e => e.textContent)));
  const inferTxt = await page.$eval('#infer', e => e.textContent);
  ok('inference line names a rule and concludes', /Ljung-Box/.test(inferTxt) && /(reject|not reject)/.test(inferTxt), inferTxt.slice(0, 90));
  // it must move with the data
  await loadPreset('wn');
  await page.waitForTimeout(80);
  const inferWn = await page.$eval('#infer', e => e.textContent);
  ok('inference line updates with the data', inferWn !== inferTxt, 'identical on white noise and AirPassengers');
  ok('white noise does not reject', /do not reject/.test(inferWn), inferWn.slice(0, 90));

  // the banner select and the pills stay in sync
  await page.selectOption('#iwantsel', 'diff1');
  await page.waitForTimeout(60);
  ok('banner select drives the pills',
     await page.$eval('.mode[data-mode="diff1"]', e => e.classList.contains('on')));

  // ===== 9. verdict correctness on the teaching presets ==================
  await loadPreset('ar1'); await setMode('none'); await page.waitForTimeout(60);
  ok('AR(1) preset reads as AR(1)', /AR\(1\)/.test(await page.$eval('#verdict', e => e.textContent)),
     await page.$eval('#verdict', e => e.textContent));
  await loadPreset('ma1'); await setMode('none'); await page.waitForTimeout(60);
  ok('MA(1) preset reads as MA(1)', /MA\(1\)/.test(await page.$eval('#verdict', e => e.textContent)),
     await page.$eval('#verdict', e => e.textContent));
  await loadPreset('wn'); await setMode('none'); await page.waitForTimeout(60);
  ok('white noise preset reads as no autocorrelation',
     /No autocorrelation/i.test(await page.$eval('#verdict', e => e.textContent)),
     await page.$eval('#verdict', e => e.textContent));
  await loadPreset('air'); await setMode('none'); await page.waitForTimeout(60);
  ok('AirPassengers reads as slow decay / difference first',
     /decay|difference/i.test(await page.$eval('#verdict', e => e.textContent)),
     await page.$eval('#verdict', e => e.textContent));
  ok('AirPassengers flags the 12-lag season',
     /lag 12/.test(await page.$eval('#plain', e => e.textContent)));
  // every reading ships at least one candid limit note (.lim), whatever the pattern
  ok('the honest-limits note is shown', (await page.$$('#plain .lim')).length >= 1);
  ok('AirPassengers says difference before reading an order',
     /stationary|difference/i.test(await page.$eval('#plain', e => e.textContent)));
  for (const key of ['ar1', 'ma1', 'wn', 'nile']) {
    await loadPreset(key); await page.waitForTimeout(60);
    ok(`${key} carries a limit note too`, (await page.$$('#plain .lim')).length >= 1);
  }
  await loadPreset('air');

  // ===== 10. copy buttons =================================================
  await page.click('#copyreport');
  await page.waitForTimeout(60);
  ok('report copy confirms', /Copied/.test(await page.$eval('#copyreport', e => e.textContent)));
  await page.click('#copyr');
  await page.waitForTimeout(60);
  ok('R copy confirms', /Copied/.test(await page.$eval('#copyr', e => e.textContent)));

  // ===== 11. chrome + a11y + no console errors ===========================
  ok('exactly one injected chrome', (await page.$$('[data-tool-chrome="injected"]')).length === 1);
  ok('no bespoke masthead', (await page.$$('header.mast')).length === 0);
  ok('canonical navbar present', (await page.$$('.sitenav')).length === 1);
  ok('sidebar has links', (await page.$$('#sidebar-nav a')).length > 20);
  ok('sidebar collapse rail present', (await page.$$('.rail-fold')).length === 1);
  ok('results are aria-live', await page.$eval('#res', e => e.getAttribute('aria-live') === 'polite'));
  ok('charts have aria-labels', await page.$eval('#acfchart svg', e => (e.getAttribute('aria-label') || '').length > 10));
  ok('no em dashes', !(await page.$eval('body', e => e.innerText)).includes('—'));
  ok('no JetBrains Mono', !(await page.content()).includes('JetBrains'));

  // ===== 12. mobile 390 ===================================================
  await page.setViewportSize({ width: 390, height: 850 });
  await page.waitForTimeout(200);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ok('no horizontal overflow at 390px', overflow <= 1, `scrollWidth - innerWidth = ${overflow}`);
  await page.setViewportSize({ width: 360, height: 850 });
  await page.waitForTimeout(200);
  const overflow360 = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ok('no horizontal overflow at 360px', overflow360 <= 1, `${overflow360}`);

  // rendered size (the audit ceiling is 200KB of outerHTML)
  const kb = await page.evaluate(() => Math.round(document.documentElement.outerHTML.length / 1024));
  ok('rendered page under the 200KB audit ceiling', kb <= 200, `${kb}KB`);

  // /cdn-cgi/trace (consent geo-gate), /api/me (Pages Function) and the CF RUM
  // beacon only exist on Cloudflare, so they 404 against a local http.server.
  // Verified environmental, not page faults: the math libs all load (asserted
  // by every value check above).
  const ENV_NOISE = /cloudflareinsights|beacon|googletagmanager|ERR_INSUFFICIENT|cdn-cgi|\/api\/me|Failed to load resource/i;
  const realErrors = errors.filter(e => !ENV_NOISE.test(e));
  ok('no console errors', realErrors.length === 0, realErrors.slice(0, 3).join(' | '));

  await browser.close();
  console.log(`\nE2E acf-pacf-calculator @ ${BASE}: ${pass} passed, ${fail} failed  (rendered ${kb}KB)`);
  if (fails.length) { console.log('\nFAILURES:'); fails.forEach(f => console.log('  ' + f)); }
  process.exit(fail ? 1 : 0);
})();
