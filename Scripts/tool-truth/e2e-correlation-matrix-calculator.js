/* Local E2E for tools/correlation-matrix-calculator.html
   Asserts RENDERED values against the R truth table, for every preset x method
   x deletion, plus all 3 modes, error handling, live R code and 390px layout.

   Usage: node Scripts/tool-truth/e2e-correlation-matrix-calculator.js [baseURL]
   Default baseURL http://127.0.0.1:8901 */
'use strict';
const { chromium } = require('playwright');
const truth = require('./correlation-matrix-calculator.json');

const BASE = process.argv[2] || 'http://127.0.0.1:8901';
const URL = BASE + '/tools/correlation-matrix-calculator.html';

// preset key -> truth case name
const PRESETS = { mtcars: 'mtcars-5col', gaps: 'ragged-missing', iris: 'iris-4col', noise: 'pure-noise-10col' };

let pass = 0, fail = 0;
const fails = [];
function ok(cond, label) { if (cond) pass++; else { fail++; if (fails.length < 30) fails.push(label); } }
function eq(got, want, label) { ok(got === want, `${label}: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`); }

function findCase(name, method, deletion) {
  return truth.cases.find(c => c.name === name && c.method === method && c.deletion === deletion);
}

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const page = await context.newPage();
  // Classify console noise by the URL that failed, not by the message text
  // (the text is always a generic "Failed to load resource"). Two failures are
  // environmental and expected off Cloudflare: /cdn-cgi/trace (the consent
  // banner's geo check, CF-only) and the CF analytics beacon (needs the net).
  const errors = [];
  // google-analytics/googletagmanager also fail with no network; their presence
  // is checked explicitly below instead.
  // /api/* are Cloudflare Functions (auth-hydrate) that only exist on CF, so a
  // plain static server 404s them. Environmental, not a page defect.
  const ENVIRONMENTAL = /cdn-cgi|cloudflareinsights|beacon\.min\.js|favicon|google-analytics|googletagmanager|\/api\//i;
  page.on('requestfailed', r => { if (!ENVIRONMENTAL.test(r.url())) errors.push('requestfailed: ' + r.url()); });
  page.on('response', r => { if (r.status() >= 400 && !ENVIRONMENTAL.test(r.url())) errors.push('HTTP ' + r.status() + ' ' + r.url()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));

  await page.goto(URL, { waitUntil: 'networkidle' });

  // libs actually loaded?
  const libOK = await page.evaluate(() => !!(window.CorrMatrixMath && window.CorrelationMath && window.DataParse && window.MultipleTestingMath));
  ok(libOK, 'all libs present on window');

  // ---- first paint: a real matrix, not an empty tool -----------------------
  const firstCells = await page.$$eval('#cmat .cell', els => els.length);
  ok(firstCells === 25, `first paint renders the 5x5 mtcars matrix (got ${firstCells} cells)`);

  async function setPreset(key) {
    await page.click(`.chip[data-scen="${key}"]`);
  }
  async function setMethod(m) { await page.click(`#methseg button[data-meth="${m}"]`); }
  async function setDeletion(d) { await page.click(`#delseg button[data-del="${d}"]`); }
  async function setMode(m) { await page.click(`.mode[data-mode="${m}"]`); }

  // Read the rendered matrix back as {r, p, n} text per cell.
  async function readMatrix() {
    return page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('#cmat tbody tr'));
      return rows.map(tr => Array.from(tr.querySelectorAll('.cell')).map(c => ({
        r: (c.querySelector('.cr') || {}).textContent || '',
        p: (c.querySelector('.cp') || {}).textContent || '',
        n: (c.querySelector('.cn') || {}).textContent || ''
      })));
    });
  }

  // ---- 1. every preset x method x deletion, rendered vs R ------------------
  await setMode('matrix');
  for (const [key, caseName] of Object.entries(PRESETS)) {
    await setPreset(key);
    for (const method of ['pearson', 'spearman']) {
      await setMethod(method);
      for (const deletion of ['pairwise', 'listwise']) {
        await setDeletion(deletion);
        const tc = findCase(caseName, method, deletion);
        const grid = await readMatrix();
        const tag = `${key}/${method}/${deletion}`;
        if (grid.length !== tc.names.length) { ok(false, `${tag}: rendered ${grid.length} rows, want ${tc.names.length}`); continue; }
        for (let i = 0; i < tc.names.length; i++) {
          for (let j = 0; j < tc.names.length; j++) {
            const cell = grid[i][j];
            // r: displayed at 2dp (diagonal shows a bare 1)
            const wantR = i === j ? '1' : (tc.r[i][j] === null ? 'n/a' : tc.r[i][j].toFixed(2));
            eq(cell.r, wantR, `${tag} r[${tc.names[i]},${tc.names[j]}]`);
            // n: exact integer, must equal R's pairwise/listwise count
            eq(cell.n, 'n=' + tc.n[i][j], `${tag} n[${tc.names[i]},${tc.names[j]}]`);
            // p: displayed 3dp or the <.001 form
            if (i !== j && tc.r[i][j] !== null) {
              const p = tc.p[i][j];
              const wantP = p === null ? '' : (p < 0.001 ? 'p<.001' : 'p=' + p.toFixed(3).replace(/^0/, ''));
              eq(cell.p, wantP, `${tag} p[${tc.names[i]},${tc.names[j]}]`);
            }
          }
        }
      }
    }
  }

  // ---- 2. the n really does vary per cell under pairwise, and collapse under listwise
  await setPreset('gaps'); await setMethod('pearson'); await setDeletion('pairwise');
  let g = await readMatrix();
  const pwNs = new Set(g.flat().map(c => c.n));
  ok(pwNs.size > 1, `gaps/pairwise: n varies per cell (saw ${[...pwNs].join(',')})`);
  await setDeletion('listwise');
  g = await readMatrix();
  const lwNs = new Set(g.flat().map(c => c.n));
  eq([...lwNs].join(','), 'n=5', 'gaps/listwise: every cell collapses to the 5 complete rows');

  // ---- 3. headline + report reflect the strongest pair ---------------------
  await setPreset('mtcars'); await setMethod('pearson'); await setDeletion('pairwise');
  {
    const tc = findCase('mtcars-5col', 'pearson', 'pairwise');
    let best = null;
    for (let i = 0; i < tc.names.length; i++) for (let j = i + 1; j < tc.names.length; j++) {
      if (best === null || Math.abs(tc.r[i][j]) > Math.abs(best.r)) best = { r: tc.r[i][j], a: tc.names[i], b: tc.names[j], n: tc.n[i][j] };
    }
    const vhead = (await page.textContent('#vhead')).trim();
    eq(vhead, 'r = ' + best.r.toFixed(3), 'headline shows the strongest r');
    const vsub = await page.textContent('#vsub');
    ok(vsub.includes(best.a) && vsub.includes(best.b), `subhead names the strongest pair (${best.a}, ${best.b})`);
    const report = await page.textContent('#report');
    ok(report.includes('r = ' + best.r.toFixed(3)) && report.includes('Pearson') && report.includes('pairwise'),
      'report line is journal-ready: ' + report.slice(0, 80));
  }

  // ---- 4. modes -----------------------------------------------------------
  await setMode('focal');
  ok(await page.isVisible('#fbars'), 'focal mode shows the bar list');
  ok(await page.isVisible('#frow'), 'focal mode reveals the column selector');
  ok(!(await page.isVisible('#cmat .cell')), 'focal mode hides the matrix');
  {
    // focal on mpg: strongest correlate should be wt per R
    await page.selectOption('#fsel', '0');
    const tc = findCase('mtcars-5col', 'pearson', 'pairwise');
    let best = null;
    for (let j = 1; j < tc.names.length; j++) if (best === null || Math.abs(tc.r[0][j]) > Math.abs(best.r)) best = { r: tc.r[0][j], name: tc.names[j] };
    const firstBar = await page.textContent('#fbars .fb .fbn');
    eq(firstBar.trim(), best.name, 'focal list is sorted by |r|, strongest first');
    const vsub = await page.textContent('#vsub');
    ok(vsub.includes(best.name), 'focal headline names the strongest correlate');
  }

  await setMode('pairs');
  ok(await page.isVisible('#ptabwrap'), 'pairs mode shows the ranked table');
  {
    const rows = await page.$$eval('#ptable tr', tr => tr.length);
    eq(rows, 10, 'pairs mode lists all k(k-1)/2 = 10 mtcars pairs');
    // Bonferroni column must be >= raw p in every row
    const bad = await page.evaluate(() => {
      let n = 0;
      document.querySelectorAll('#ptable tr').forEach(tr => {
        const td = tr.querySelectorAll('td');
        const p = parseFloat(td[3].textContent), b = parseFloat(td[4].textContent);
        if (isFinite(p) && isFinite(b) && b < p - 1e-12) n++;
      });
      return n;
    });
    eq(bad, 0, 'Bonferroni-adjusted p is never below the raw p');
  }

  // ---- 5. the multiple-testing teaching numbers, on the noise matrix -------
  await setPreset('noise'); await setMode('matrix');
  {
    const note = await page.textContent('#mtnote');
    ok(/45 tests at once/.test(note), 'noise matrix reports 45 tests: ' + note.slice(0, 60));
    ok(note.includes('2.3') || note.includes('2.2'), 'expected false positives ~2.25 stated');
    ok(/90%/.test(note), 'familywise error ~90% stated');
    const rows = await page.$$eval('#cmat tbody tr', tr => tr.length);
    eq(rows, 10, 'noise matrix is 10x10');
  }

  // ---- 6. R code is live --------------------------------------------------
  await setPreset('mtcars'); await setMethod('pearson'); await setDeletion('pairwise');
  let rcode = await page.textContent('#rcodepre');
  ok(rcode.includes('mtcars[, c("mpg", "hp", "wt", "disp", "qsec")]'), 'R uses the built-in mtcars for the unedited preset');
  ok(rcode.includes('use = "pairwise.complete.obs"'), 'R shows pairwise deletion');
  ok(rcode.includes('rcorr(as.matrix(df), type = "pearson")'), 'R shows rcorr');
  await setDeletion('listwise');
  rcode = await page.textContent('#rcodepre');
  ok(rcode.includes('df <- na.omit(df)'), 'R drops incomplete rows up front for listwise');
  ok(rcode.includes('use = "complete.obs"'), 'R still teaches the use = "complete.obs" equivalent');
  ok(!/use = "pairwise\.complete\.obs"/.test(rcode), 'listwise R never mentions pairwise deletion');
  // The cor.test drill-down must run on the SAME rows the matrix used, or it
  // would silently fall back to pairwise deletion for that one pair.
  ok(/df <- na\.omit\(df\)[\s\S]*cor\.test\(df\$/.test(rcode), 'listwise cor.test runs on the na.omit-ed frame');
  await setMethod('spearman');
  rcode = await page.textContent('#rcodepre');
  ok(rcode.includes('method = "spearman"') && rcode.includes('type = "spearman"'), 'R switches method to spearman');

  // ---- 7. the honest cor.test divergence flag -----------------------------
  await setPreset('gaps'); await setMethod('spearman'); await setDeletion('pairwise');
  await page.click('#how');
  {
    const h4 = await page.textContent('#h4c');
    ok(/exact/.test(h4), 'tie-free Spearman surfaces the cor.test exact-test divergence');
  }
  await setMethod('pearson');
  {
    const h4 = await page.textContent('#h4c');
    ok(!/would switch to an <em>exact/.test(h4), 'Pearson does not claim a divergence (there is none)');
  }

  // ---- 8. error handling --------------------------------------------------
  await page.fill('#data', '1\n2\n3\n');
  ok(await page.isVisible('#ierr'), 'single column raises a human error');
  {
    const e = await page.textContent('#ierr');
    ok(/at least 2 columns/.test(e), 'error message explains the fix: ' + e);
  }
  await page.fill('#data', '');
  ok(await page.isVisible('#ierr'), 'empty input raises an error');
  await page.fill('#data', 'a\tb\nfoo\tbar\nbaz\tqux\n');
  ok(await page.isVisible('#ierr'), 'non-numeric text raises an error rather than a grid of n/a cells');
  {
    const e = await page.textContent('#ierr');
    ok(/columns of numbers/.test(e), 'junk error names the cause: ' + e);
  }
  await page.fill('#data', 'a\tb\n1\tNA\n2\tNA\n3\tNA\n');
  ok(await page.isVisible('#ierr'), 'an all-missing second column is an error, not a fake matrix');
  // recover
  await setPreset('mtcars');
  ok(!(await page.isVisible('#ierr')), 'fixing the input clears the error');
  ok((await page.$$eval('#cmat .cell', e => e.length)) === 25, 'tool recovers and recomputes after an error');

  // ---- 9. toggles ---------------------------------------------------------
  await page.uncheck('#showp');
  eq(await page.$$eval('#cmat .cp', e => e.length), 0, 'p-value layer toggles off');
  await page.check('#showp');
  ok((await page.$$eval('#cmat .cp', e => e.length)) > 0, 'p-value layer toggles back on');
  await page.uncheck('#shown');
  eq(await page.$$eval('#cmat .cn', e => e.length), 0, 'n layer toggles off');
  await page.check('#shown');

  // ---- 10. accessibility / analytics --------------------------------------
  ok(await page.getAttribute('#cmat', 'aria-label') !== null, 'matrix carries an aria-label');
  const liveRegions = await page.$$eval('[aria-live]', e => e.length);
  ok(liveRegions > 0, 'results region is aria-live');

  // GA events really fire. gtag() pushes into dataLayer, so read that back
  // rather than trusting the network call (which cannot leave localhost).
  {
    const dl = await page.evaluate(() => (window.dataLayer || []).map(a => Array.prototype.slice.call(a)));
    const evs = dl.filter(a => a[0] === 'event').map(a => a[1]);
    ok(evs.includes('tool_use'), 'tool_use fired on first input: ' + JSON.stringify(evs));
    await page.click('#copybtn');
    await page.waitForTimeout(250);
    const dl2 = await page.evaluate(() => (window.dataLayer || []).map(a => Array.prototype.slice.call(a)));
    const evs2 = dl2.filter(a => a[0] === 'event').map(a => a[1]);
    ok(evs2.includes('tool_copy'), 'tool_copy fired on copy: ' + JSON.stringify(evs2));
    const btn = await page.textContent('#copybtn');
    eq(btn.trim(), 'Copied', 'copy button confirms to the user');
  }

  // ---- 11. mobile 390px: no horizontal overflow ---------------------------
  for (const w of [360, 390, 768, 1280]) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.waitForTimeout(120);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    ok(over <= 1, `no horizontal overflow at ${w}px (overflow ${over}px)`);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });

  // ---- 12. console clean --------------------------------------------------
  const real = errors.filter(e => !/cloudflareinsights|beacon|ERR_INTERNET|net::ERR_FAILED.*beacon|favicon/i.test(e));
  ok(real.length === 0, 'no console errors: ' + JSON.stringify(real.slice(0, 3)));

  await browser.close();

  console.log(`checks passed : ${pass}`);
  console.log(`checks failed : ${fail}`);
  if (fails.length) { console.log('\n--- failures ---'); fails.forEach(f => console.log('  ' + f)); }
  console.log(fail === 0 ? '\nE2E: PASS' : '\nE2E: FAIL');
  process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error('E2E CRASH:', e); process.exit(2); });
