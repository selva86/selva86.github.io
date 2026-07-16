/* Local E2E for tools/sample-size-calculator.html.
   Asserts the RENDERED DOM against the R truth table (not the lib in isolation
   -- the lib is already gated by test-sample-size-calculator-math.js). This
   catches the wiring bugs a math harness cannot see: a mode that does not
   switch fields, a stat that never repaints, a viz that vanishes.

   Usage: node Scripts/tool-truth/e2e-sample-size-calculator.js [baseURL]  */
'use strict';
const { chromium } = require('playwright');
const truth = require('./sample-size-calculator.json');

const BASE = process.argv[2] || 'http://localhost:8901';
const URL = BASE + '/tools/sample-size-calculator.html';

let pass = 0, fail = 0;
const fails = [];
function ok(name, cond, detail) {
  if (cond) pass++;
  else { fail++; fails.push(name + (detail ? ' -- ' + detail : '')); }
}
const num = s => parseFloat(String(s).replace(/[, ]/g, '').replace('%', ''));

// Look up an expected n straight out of the R truth table.
function truthN(mode, args) {
  const c = truth.cases.find(c => c.mode === mode &&
    Math.abs(c.args.E - args.E) < 1e-12 &&
    (args.p == null || Math.abs(c.args.p - args.p) < 1e-12) &&
    (args.sd == null || Math.abs(c.args.sd - args.sd) < 1e-12) &&
    Math.abs(c.args.conf - args.conf) < 1e-12 &&
    ((c.args.Npop == null && args.N == null) || c.args.Npop === args.N));
  return c ? c.n : null;
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  // Network failures are tracked by URL so the console filter below can name
  // exactly what it forgives. Four cannot succeed from a plain http.server:
  //   /cdn-cgi/trace           consent-banner.js EU/UK geo check (CF-only)
  //   cloudflareinsights RUM   the analytics beacon (CORS-rejects other origins)
  //   google-analytics collect the GA4 hit (no network egress in headless)
  //   /api/me                  auth-hydrate.js; a Cloudflare Pages Function,
  //                            which only exists once deployed
  // Anything else that 404s is a real broken asset and must fail the gate.
  const netFails = [];
  page.on('response', r => { if (r.status() >= 400) netFails.push(r.status() + ' ' + r.url()); });
  page.on('requestfailed', r => netFails.push('FAILED ' + r.url()));
  // The GA hits are also EVIDENCE: they carry the event name and tool id, so
  // they positively prove tool_use / tool_copy are wired, which is worth more
  // than grepping the source for the handler.
  const gaHits = [];
  page.on('request', r => {
    const u = r.url();
    if (/google-analytics\.com\/g\/collect/.test(u)) gaHits.push(u);
  });
  await page.goto(URL, { waitUntil: 'networkidle' });

  const set = async (id, v) => {
    await page.fill('#' + id, String(v));
    await page.waitForTimeout(35);
  };

  // ---------------------------------------------------- 1. default paint
  // A tool must never present empty on first load.
  ok('default verdict non-empty', (await page.textContent('#verdict')).trim().length > 0);
  ok('default n = 1,068 (95%, +/-3pts, p=.5)',
    num(await page.textContent('#bignv')) === 1068,
    'got ' + await page.textContent('#bignv'));
  ok('viz rendered on load', (await page.locator('#viz svg').count()) === 1);
  ok('viz has aria-label', !!(await page.getAttribute('#viz svg', 'aria-label')));

  // ------------------------------------- 2. proportion mode vs truth table
  const propCases = [
    { E: 0.03, p: 0.5,  conf: 0.95, N: null },
    { E: 0.01, p: 0.5,  conf: 0.95, N: null },
    { E: 0.05, p: 0.5,  conf: 0.90, N: null },
    { E: 0.02, p: 0.3,  conf: 0.99, N: null },
    { E: 0.03, p: 0.8,  conf: 0.95, N: null },
    { E: 0.10, p: 0.95, conf: 0.90, N: null },
    { E: 0.03, p: 0.5,  conf: 0.95, N: 5000 },
    { E: 0.05, p: 0.5,  conf: 0.99, N: 1000 },
    { E: 0.03, p: 0.5,  conf: 0.90, N: 500 },
  ];
  for (const c of propCases) {
    const want = truthN('prop', c);
    if (want == null) { fails.push('no truth row for ' + JSON.stringify(c)); fail++; continue; }
    await page.click('.mode[data-mode="prop"]');
    await set('Eprop', c.E * 100);
    await set('pexp', c.p * 100);
    await set('conf', c.conf * 100);
    await set('Npop', c.N == null ? '' : c.N);
    const got = num(await page.textContent('#bignv'));
    ok(`prop E=${c.E} p=${c.p} conf=${c.conf} N=${c.N}`, got === want, `rendered ${got}, R says ${want}`);
  }

  // ------------------------------------------- 3. mean mode vs truth table
  const meanCases = [
    { E: 2, sd: 15, conf: 0.95, N: null },
    { E: 1, sd: 15, conf: 0.95, N: null },
    { E: 5, sd: 100, conf: 0.99, N: null },
    { E: 0.5, sd: 4, conf: 0.90, N: null },
    { E: 2, sd: 15, conf: 0.95, N: 1000 },
    { E: 2, sd: 15, conf: 0.99, N: 10000 },
  ];
  for (const c of meanCases) {
    const want = truthN('mean', c);
    if (want == null) { fails.push('no truth row for mean ' + JSON.stringify(c)); fail++; continue; }
    await page.click('.mode[data-mode="mean"]');
    await set('Emean', c.E);
    await set('sd', c.sd);
    await set('conf', c.conf * 100);
    await set('Npop', c.N == null ? '' : c.N);
    const got = num(await page.textContent('#bignv'));
    ok(`mean E=${c.E} sd=${c.sd} conf=${c.conf} N=${c.N}`, got === want, `rendered ${got}, R says ${want}`);
  }

  // ------------------------------------------ 4. achieved margin vs truth
  await page.click('.mode[data-mode="prop"]');
  await set('Eprop', 3); await set('pexp', 50); await set('conf', 95); await set('Npop', '');
  {
    const a = truth.achieved.find(a => a.mode === 'prop' && a.args.conf === 0.95 && a.args.E === 0.03);
    const shown = num(await page.textContent('#s_moe')) / 100;
    ok('achieved margin matches R', Math.abs(shown - a.moe) < 5e-6,
      `shown ${shown}, R ${a.moe}`);
  }

  // ------------------------------ 5. every dependent output moves together
  {
    const before = {
      n: await page.textContent('#bignv'), exact: await page.textContent('#s_exact'),
      plain: await page.textContent('#plain'), inf: await page.textContent('#inftext'),
      rep: await page.textContent('#report'), r: await page.textContent('#rcodepre'),
      steps: await page.textContent('#steps'), viz: await page.innerHTML('#viz'),
    };
    await set('Eprop', 1);
    const after = {
      n: await page.textContent('#bignv'), exact: await page.textContent('#s_exact'),
      plain: await page.textContent('#plain'), inf: await page.textContent('#inftext'),
      rep: await page.textContent('#report'), r: await page.textContent('#rcodepre'),
      steps: await page.textContent('#steps'), viz: await page.innerHTML('#viz'),
    };
    for (const k of Object.keys(before)) {
      ok('output "' + k + '" repaints on input change', before[k] !== after[k]);
    }
    ok('n moved 1068 -> 9604 when margin tightened 3pts -> 1pt', num(after.n) === 9604,
      'got ' + after.n);
  }

  // ---------------------------------------- 6. R code carries the real n
  {
    await set('Eprop', 3);
    const rc = await page.textContent('#rcodepre');
    ok('R block shows #> [1] 1068', /#>\s*\[1\]\s*1068/.test(rc), rc.slice(0, 200));
    ok('R block uses qnorm', rc.includes('qnorm('));
    ok('R block has no rounded-literal drift (E <- 0.03)', /E\s*<-\s*0\.03\b/.test(rc));
  }

  // -------------------------------------------- 7. the 3 old-tool features
  ok('tool lead present under H1', (await page.textContent('.dek')).length > 120);
  ok('"I want to" banner present', (await page.textContent('.iwant')).includes('I want to'));
  ok('banner select drives the mode', await page.locator('#iwsel').count() === 1);
  ok('inference line present', (await page.textContent('#inftext')).length > 40);
  {
    // banner select must actually switch modes
    await page.selectOption('#iwsel', 'mean');
    await page.waitForTimeout(50);
    ok('banner select switches to mean mode',
      await page.locator('.mode[data-mode="mean"].on').count() === 1);
    ok('banner label follows the mode',
      (await page.textContent('#iwt')).includes('average'));
    await page.selectOption('#iwsel', 'prop');
    await page.waitForTimeout(50);
  }

  // --------------------------------------------------- 8. the chooser routes
  {
    const routes = [
      ['#rt-onesample', '/tools/sample-size-t-test-calculator.html'],
      ['#rt-twomeans', '/tools/sample-size-t-test-calculator.html'],
      ['#rt-rates', '/tools/sample-size-proportion-calculator.html'],
      ['#rt-anova', '/tools/sample-size-anova-calculator.html'],
      ['#rt-estimate', '#calc'],
    ];
    for (const [sel, href] of routes) {
      ok('route ' + sel + ' -> ' + href,
        (await page.getAttribute(sel, 'href')) === href);
      const words = (await page.textContent(sel + ' .rw')).trim();
      ok('route ' + sel + ' says what it asks for', /asks for|asks you for/.test(words), words.slice(0, 80));
    }
  }

  // --------------------------------------------------- 9. scenario presets
  for (const [chip, expectMode] of [['poll', 'prop'], ['score', 'mean'], ['staff', 'prop']]) {
    await page.click(`.chip[data-scen="${chip}"]`);
    await page.waitForTimeout(50);
    ok('chip ' + chip + ' loads and computes',
      num(await page.textContent('#bignv')) > 0 &&
      await page.locator(`.mode[data-mode="${expectMode}"].on`).count() === 1);
  }
  await page.click('.chip[data-scen="staff"]');
  await page.waitForTimeout(50);
  ok('staff chip applies the population correction (n < 385)',
    num(await page.textContent('#bignv')) === 260,
    'got ' + await page.textContent('#bignv'));

  // ------------------------------------------------- 10. error handling
  await page.click('.mode[data-mode="prop"]');
  await set('Eprop', 3); await set('pexp', 50); await set('conf', 95); await set('Npop', '');
  for (const [id, bad] of [['conf', 150], ['Eprop', 0], ['pexp', 120], ['Npop', 1]]) {
    const prev = await page.inputValue('#' + id);
    await set(id, bad);
    ok('rejects ' + id + '=' + bad, await page.locator('#err.show').count() === 1);
    const msg = await page.textContent('#err');
    ok('error for ' + id + ' is a human sentence', msg.length > 25 && /[a-z]/.test(msg), msg);
    await set(id, prev === '' ? '' : prev);
  }
  await set('Eprop', 3); await set('pexp', 50); await set('conf', 95); await set('Npop', '');
  ok('error clears once inputs are fixed', await page.locator('#err.show').count() === 0);
  ok('recovers to the right answer after an error', num(await page.textContent('#bignv')) === 1068);

  // ------------------------------------ 11. degenerate p handled honestly
  await set('pexp', 0);
  {
    const v = await page.textContent('#verdict');
    ok('p=0 does not claim "survey 0 people"', !/\b0\b/.test(await page.textContent('#bignv')),
      'bignv = ' + await page.textContent('#bignv'));
    ok('p=0 explains the breakdown', /different method|not valid|approximation/i.test(v + await page.textContent('#plain')));
  }
  await set('pexp', 50);

  // --------------------------------------------- 12. what-if slider works
  {
    const before = await page.textContent('#bignv');
    await page.locator('#wf').fill('50');
    await page.locator('#wf').dispatchEvent('input');
    await page.waitForTimeout(60);
    const after = await page.textContent('#bignv');
    ok('slider moves the answer', before !== after, before + ' -> ' + after);
    ok('slider readout updates', (await page.textContent('#wfv')).includes('people'));
  }

  // -------------------------------------------- 13. health / a11y / meta
  // Analytics: assert from the wire, not from the source.
  // gtag() is a dataLayer stub until gtag.js loads, so an event fired now is
  // queued and only leaves the browser once that script arrives. Poll rather
  // than sleep a guessed interval.
  {
    await page.click('#copybtn');
    // Check the confirmation FIRST: it self-reverts after ~1.4s, so polling
    // for the GA hit before reading it would always miss the label.
    await page.waitForTimeout(150);
    const copyLabel = (await page.textContent('#copybtn')).trim();
    const deadline = Date.now() + 8000;
    while (Date.now() < deadline && !gaHits.join(' ').includes('en=tool_copy')) {
      await page.waitForTimeout(150);
    }
    const joined = gaHits.join(' ');
    ok('tool_use event fires with the right tool id',
      /en=tool_use/.test(joined) && /ep\.tool=sample-size-calculator/.test(joined),
      gaHits.length + ' GA hits seen');
    ok('tool_copy event fires on copy', /en=tool_copy/.test(joined),
      gaHits.length + ' GA hits: ' + joined.slice(0, 200));
    // The copy itself must succeed even where the async clipboard API is
    // blocked (this context has no clipboard permission, so this exercises
    // the execCommand fallback path).
    ok('copy button confirms to the user', copyLabel === 'Copied', 'label was: ' + copyLabel);
  }

  {
    const ENV_ONLY = /cdn-cgi\/trace|cloudflareinsights\.com|cdn-cgi\/rum|google-analytics\.com|\/api\/me/;
    const realNet = netFails.filter(u => !ENV_ONLY.test(u));
    ok('no broken assets (Cloudflare-only endpoints excepted)', realNet.length === 0, realNet.join(' | '));
    // Console text for the two env failures mentions neither URL in every
    // browser build, so forgive by message shape as well, but only those.
    const realErr = errors.filter(e =>
      !ENV_ONLY.test(e) &&
      !/Failed to load resource.*404/.test(e) &&
      !/net::ERR_FAILED/.test(e));
    ok('no console errors', realErr.length === 0, realErr.join(' | '));
    // Prove the forgiveness above is not hiding a page bug: the only 404 seen
    // must be the consent banner's geo probe.
    ok('the only 404s are the two CF-only endpoints',
      netFails.filter(u => u.startsWith('404'))
              .every(u => /cdn-cgi\/trace|\/api\/me/.test(u)),
      netFails.filter(u => u.startsWith('404')).join(' | '));
  }
  ok('results region is aria-live', await page.getAttribute('#rescard', 'aria-live') === 'polite');
  {
    const t = await page.title();
    ok('title 40-60 chars', t.length >= 40 && t.length <= 60, `${t.length}: ${t}`);
    const d = await page.getAttribute('meta[name="description"]', 'content');
    ok('meta description 120-165', d.length >= 120 && d.length <= 165, String(d.length));
    ok('canonical set', (await page.getAttribute('link[rel="canonical"]', 'href')).endsWith('/tools/sample-size-calculator.html'));
    for (const s of await page.locator('script[type="application/ld+json"]').all()) {
      try { JSON.parse(await s.textContent()); pass++; }
      catch (e) { fail++; fails.push('invalid JSON-LD: ' + e.message); }
    }
  }
  {
    const body = await page.textContent('body');
    ok('no em dashes', !body.includes('—'));
    ok('does not name the in-browser R runtime', !/webr/i.test(await page.content()));
  }

  // ------------------------------------------------- 14. mobile 390px
  await page.setViewportSize({ width: 390, height: 900 });
  await page.waitForTimeout(120);
  {
    const o = await page.evaluate(() =>
      ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
    ok('no horizontal overflow at 390px', o.sw <= o.iw + 1, `scrollWidth ${o.sw} vs ${o.iw}`);
  }
  await page.setViewportSize({ width: 360, height: 900 });
  await page.waitForTimeout(120);
  {
    const o = await page.evaluate(() =>
      ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
    ok('no horizontal overflow at 360px', o.sw <= o.iw + 1, `scrollWidth ${o.sw} vs ${o.iw}`);
  }

  await browser.close();
  console.log('passed:', pass, '| failed:', fail);
  if (fails.length) { console.log('\nFAILURES:'); fails.forEach(f => console.log('  - ' + f)); }
  process.exit(fail ? 1 : 0);
})();
