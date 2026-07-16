/* Local E2E for tools/lmer-output-interpreter.html.
   Asserts the RENDERED DOM against the R truth table (the parser + ICC maths are
   already gated by test-lmer-output-interpreter-math.js). This catches the wiring
   bugs a math harness cannot see: a preset that loads text lme4 never printed, a
   view that keeps the previous mode's body, a stats grid whose labels do not
   follow the model type, an ICC caveat that fails to appear on a random-slope
   paste, an R block that never repaints.

   Usage: node Scripts/tool-truth/e2e-lmer-output-interpreter.js [baseURL] */
'use strict';
const { chromium } = require('playwright');
const truth = require('./lmer-output-interpreter.json');

const BASE = process.argv[2] || 'http://localhost:8901';
// Cache-bust against a deployed origin: CF negative-caches the 404s served while
// polling for a new page, so a bare URL right after a deploy can hand back the
// pre-deploy miss instead of the page that just went live.
const URL = BASE + '/tools/lmer-output-interpreter.html' +
  (/^https?:\/\/localhost/.test(BASE) ? '' : '?fresh=' + Date.now());

let pass = 0, fail = 0;
const fails = [];
function ok(name, cond, detail) {
  if (cond) pass++;
  else { fail++; if (fails.length < 40) fails.push(name + (detail ? ' -- ' + detail : '')); }
}
function near(name, got, want, tol) {
  const d = Math.abs(got - want);
  ok(name, d <= tol, `got ${got} want ${want} diff ${d.toExponential(2)}`);
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', e => consoleErrors.push('pageerror: ' + e.message));
  // 404s: console messages omit the URL, so watch responses instead
  const missing = [];
  page.on('response', r => { if (r.status() === 404) missing.push(r.url()); });

  await page.goto(URL, { waitUntil: 'networkidle' });

  /* ------------------------------------------------ 0. chrome + first paint */
  ok('injected chrome present', await page.locator('[data-tool-chrome="injected"]').count() === 1);
  ok('no bespoke masthead', await page.locator('header.mast').count() === 0);
  ok('canonical navbar present', await page.locator('nav.sitenav').count() >= 1);
  ok('sidebar has links', await page.locator('#sidebar-nav a').count() > 20,
    'links=' + await page.locator('#sidebar-nav a').count());
  ok('sidebar fold control', await page.locator('.rail-fold').count() >= 1);
  ok('no own footer', await page.locator('footer.ft').count() === 0);
  ok('site footer injected', await page.locator('footer.rsft').count() === 1);
  // never an empty tool on first paint
  const firstPaste = await page.inputValue('#paste');
  ok('first paint is pre-filled', firstPaste.trim().length > 100);
  ok('first paint verdict rendered', (await page.textContent('#vhead')).indexOf('Paste an') === -1);

  /* --------------------------------------- 1. presets are REAL lme4 output */
  // The presets must be byte-identical to what R printed. Hand-typing one before
  // produced a fabricated preset, so this compares against the R truth JSON.
  for (const key of ['ri', 'rs', 'glmer', 'lmertest']) {
    await page.click(`.chip[data-scen="${key}"]`);
    await page.waitForTimeout(60);
    const v = await page.inputValue('#paste');
    ok(`preset ${key} byte-identical to R output`, v === truth.presets[key].summary_text,
      `len got ${v.length} want ${truth.presets[key].summary_text.length}`);
  }

  /* ------------------------------------------ 2. ICC rendered, per preset */
  // random intercept: must equal performance::icc within print-rounding
  await page.click('.chip[data-scen="ri"]');
  await page.click('.mode[data-mode="icc"]');
  await page.waitForTimeout(60);
  near('RI icc rendered', Number(await page.textContent('#v1')), truth.presets.ri.icc_adjusted, 5e-4);
  ok('RI icc label is plain ICC', (await page.textContent('#k1')).trim() === 'ICC',
    await page.textContent('#k1'));
  ok('RI has no at-zero caveat', !(await page.textContent('#body')).includes('random slope'));
  ok('RI stat label names the group', (await page.textContent('#k2')).includes('Subject'),
    await page.textContent('#k2'));
  near('RI between SD', Number(await page.textContent('#v2')), 37.12, 5e-3);
  near('RI residual SD', Number(await page.textContent('#v3')), 30.99, 5e-3);
  ok('RI effective n shown', (await page.textContent('#v4')).includes('of 180'),
    await page.textContent('#v4'));
  // the design-effect reading: 180 rows are worth ~29 independent observations
  ok('RI plain-English carries the effective n', /29|28/.test(await page.textContent('#plain')),
    await page.textContent('#plain'));

  // random slope: MUST show the at-zero caveat and MUST NOT claim performance::icc
  await page.click('.chip[data-scen="rs"]');
  await page.waitForTimeout(60);
  const rsBody = await page.textContent('#body');
  ok('RS flags at-zero ICC label', (await page.textContent('#k1')).includes('x = 0'),
    await page.textContent('#k1'));
  ok('RS explains the random-slope limit', /random slope/i.test(rsBody));
  ok('RS points at performance::icc', /performance::icc/.test(rsBody));
  const rsIcc = Number(await page.textContent('#v1'));
  near('RS icc is the at-zero value', rsIcc, truth.rs_proof.icc_at_x0, 5e-3);
  ok('RS icc is NOT performance::icc adjusted',
    Math.abs(rsIcc - truth.rs_proof.performance_adjusted) > 0.2,
    `rendered ${rsIcc} vs performance ${truth.rs_proof.performance_adjusted}`);
  ok('RS inference line names the caveat', /not one number|zero/i.test(await page.textContent('#inference-line')));

  // glmer: latent-scale ICC
  await page.click('.chip[data-scen="glmer"]');
  await page.waitForTimeout(60);
  near('glmer icc rendered', Number(await page.textContent('#v1')), truth.presets.glmer.icc_adjusted, 5e-4);
  ok('glmer residual labelled latent', (await page.textContent('#k3')).toLowerCase().includes('latent'),
    await page.textContent('#k3'));
  ok('glmer body names pi^2/3', (await page.textContent('#body')).includes('pi^2/3'));
  near('glmer latent residual SD', Number(await page.textContent('#v3')), Math.sqrt(truth.pi2_3), 5e-3);

  // lmerTest: same model as RI, so same ICC
  await page.click('.chip[data-scen="lmertest"]');
  await page.waitForTimeout(60);
  near('lmerTest icc == RI icc', Number(await page.textContent('#v1')), truth.presets.lmertest.icc_adjusted, 5e-4);
  ok('lmerTest chip labels the fit', (await page.textContent('#vchip')).includes('lmerTest'),
    await page.textContent('#vchip'));

  /* --------------------------------------------- 3. anatomy labels regions */
  await page.click('.chip[data-scen="glmer"]');
  await page.click('.mode[data-mode="anatomy"]');
  await page.waitForTimeout(60);
  const rgnCount = await page.locator('.rgn').count();
  ok('anatomy renders several labelled regions', rgnCount >= 6, 'regions=' + rgnCount);
  for (const want of ['Model header', 'Family and link', 'Formula', 'Random effects', 'Sample size', 'Fixed effects']) {
    ok('anatomy region: ' + want,
      await page.locator('.rgn .rt', { hasText: want }).count() >= 1);
  }
  // every region must carry a one-sentence meaning
  const meanings = await page.locator('.rgn .rm').allTextContents();
  ok('every region has a meaning', meanings.length === rgnCount && meanings.every(t => t.trim().length > 25),
    'meanings=' + meanings.length + '/' + rgnCount);
  // the anatomy must reproduce the pasted text, not paraphrase it
  const anatText = (await page.locator('.rgn pre').allTextContents()).join('\n');
  ok('anatomy shows the real Formula line', anatText.includes('r2 ~ Anger + Gender + btype + (1 | id)'));

  /* ------------------------------------------------- 4. fixed effects view */
  await page.click('.chip[data-scen="glmer"]');
  await page.click('.mode[data-mode="fixed"]');
  await page.waitForTimeout(60);
  const fxBody = await page.textContent('#body');
  for (const t of ['(Intercept)', 'Anger', 'GenderM', 'btypescold', 'btypeshout']) {
    ok('fixed view lists ' + t, fxBody.includes(t));
  }
  // Wald CI must match confint(method="Wald") from R
  const anger = truth.presets.glmer.fixed.find(f => f.term === 'Anger');
  const angerCI = truth.wald_ci.glmer.find(c => c.term === 'Anger');
  ok('fixed view shows Anger Wald CI',
    fxBody.includes(String(Number(angerCI.lower.toPrecision(4)))) ||
    fxBody.includes(angerCI.lower.toFixed(4)),
    'want ~' + angerCI.lower.toFixed(4));
  ok('glmer fixed view speaks odds', /odds/i.test(fxBody));

  // plain lmer: fixed view must flag the missing p column
  await page.click('.chip[data-scen="ri"]');
  await page.waitForTimeout(60);
  ok('RI fixed view flags absent p-values', /No p-value column/i.test(await page.textContent('#body')));

  /* ------------------------------------------------- 5. p-value view */
  await page.click('.mode[data-mode="pvalues"]');
  await page.waitForTimeout(60);
  let pv = await page.textContent('#body');
  ok('p view explains lmer has none', /deliberate/i.test(pv));
  ok('p view gives the normal-approx p', /anti-conservative/i.test(pv));
  await page.click('.chip[data-scen="lmertest"]');
  await page.waitForTimeout(60);
  pv = await page.textContent('#body');
  ok('p view recognises lmerTest', /Satterthwaite/i.test(pv));
  await page.click('.chip[data-scen="glmer"]');
  await page.waitForTimeout(60);
  pv = await page.textContent('#body');
  ok('p view recognises glmer z-values', /z value|glmer/i.test(pv));

  /* ---------------------------------------------------- 6. R code emitter */
  await page.click('.chip[data-scen="ri"]');
  await page.waitForTimeout(60);
  let rc = await page.textContent('#rcodepre');
  ok('R code uses the real formula', rc.includes('Reaction ~ Days + (1 | Subject)'));
  ok('R code names the dataset', rc.includes('sleepstudy'));
  ok('R code offers performance::icc', rc.includes('performance::icc(m)'));
  ok('R code offers confint Wald', rc.includes('confint(m, method = "Wald")'));
  ok('R code offers lmerTest for the p-values', rc.includes('library(lmerTest)'));
  await page.click('.chip[data-scen="rs"]');
  await page.waitForTimeout(60);
  const rcRS = await page.textContent('#rcodepre');
  ok('R code repaints on preset change', rcRS !== rc);
  ok('R code carries the random-slope ICC caveat', /random slope/.test(rcRS));
  await page.click('.chip[data-scen="glmer"]');
  await page.waitForTimeout(60);
  const rcG = await page.textContent('#rcodepre');
  ok('glmer R code uses glmer()', rcG.includes('glmer(') && rcG.includes('family = binomial'));
  ok('glmer R code does not push lmerTest', !rcG.includes('library(lmerTest)'));
  // Running the emitted block for real showed confint(method="profile") ERRORS on
  // this glmer fit ("profiling detected new, lower deviance"), so it must stay
  // commented out. Every emitted line has to be a line that actually runs.
  ok('glmer profile line is commented, not live',
    !/^\s*confint\(m, method = "profile"\)/m.test(rcG));
  ok('glmer explains why profile is commented', /lower deviance/.test(rcG));
  // ...but for lmer it runs, so it stays live advice
  await page.click('.chip[data-scen="ri"]');
  await page.waitForTimeout(60);
  ok('lmer profile line IS live',
    /^confint\(m, method = "profile"\)/m.test(await page.textContent('#rcodepre')));

  /* ------------------------------------------------- 7. error handling */
  const BAD = [
    ['hello world', /mixed-model header/i],
    ['{"a":1}', /mixed-model header/i],
    ['Call:\nlm(formula = y ~ x)\n\nCoefficients:\n            Estimate Std. Error t value Pr(>|t|)\n(Intercept)   1.0000     0.1000   10.00   <2e-16\n\nResidual standard error: 1 on 98 degrees of freedom', /lm\(\) model/i]
  ];
  for (const [txt, re] of BAD) {
    await page.fill('#paste', txt);
    await page.waitForTimeout(80);
    const shown = await page.locator('#ierr.show').count() === 1;
    const msg = await page.textContent('#ierr');
    ok('error shown for: ' + txt.slice(0, 18), shown);
    ok('error message helpful for: ' + txt.slice(0, 18), re.test(msg), msg.slice(0, 90));
    ok('no crash residue for: ' + txt.slice(0, 18), !/undefined|NaN|\[object/.test(msg));
    ok('results hidden on error: ' + txt.slice(0, 18), await page.locator('#statgrid[hidden]').count() === 1);
  }
  // the lm mispaste should route to the lm tool
  ok('lm mispaste links the lm interpreter',
    await page.locator('#ierr a[href="/tools/lm-output-interpreter.html"]').count() === 1);

  // fixing the input clears the error
  await page.fill('#paste', truth.presets.ri.summary_text);
  await page.waitForTimeout(80);
  ok('error clears when input is fixed', await page.locator('#ierr.show').count() === 0);
  ok('results return when input is fixed', await page.locator('#statgrid[hidden]').count() === 0);

  // empty input is a calm state, not an error
  await page.fill('#paste', '');
  await page.waitForTimeout(80);
  ok('empty input is not an error', await page.locator('#ierr.show').count() === 0);
  ok('empty input hides results', await page.locator('#statgrid[hidden]').count() === 1);

  /* ------------------------------- 8. robustness: console prompt + whitespace */
  await page.fill('#paste', '> summary(m)\n' + truth.presets.ri.summary_text + '\n\n');
  await page.waitForTimeout(80);
  ok('tolerates a copied console prompt', await page.locator('#ierr.show').count() === 0);
  near('prompt-prefixed paste still computes ICC',
    Number(await page.textContent('#v1')), truth.presets.ri.icc_adjusted, 5e-4);

  /* ------------------------------------------------ 9. copy + interactivity */
  await page.click('.chip[data-scen="ri"]');
  await page.waitForTimeout(60);
  const rep = await page.textContent('#report');
  ok('report line is journal-ready', /ICC = 0\.589/.test(rep), rep);
  ok('report line carries n_eff', /n_eff/.test(rep), rep);
  // mode switch must repaint the body
  await page.click('.mode[data-mode="anatomy"]');
  const bodyA = await page.textContent('#body');
  await page.click('.mode[data-mode="fixed"]');
  const bodyF = await page.textContent('#body');
  ok('mode switch repaints the body', bodyA !== bodyF);
  // the I-want banner select stays in sync with the pills
  ok('banner select syncs with pills', await page.inputValue('#modesel') === 'fixed',
    await page.inputValue('#modesel'));
  await page.selectOption('#modesel', 'icc');
  await page.waitForTimeout(60);
  ok('banner select drives the mode',
    await page.locator('.mode[data-mode="icc"].on').count() === 1);
  // clear button
  await page.click('#clearbtn');
  await page.waitForTimeout(60);
  ok('clear empties the box', (await page.inputValue('#paste')) === '');

  /* ----------------------------------------------------- 10. accessibility */
  ok('results region is live', await page.locator('[aria-live="polite"]').count() >= 1);
  ok('paste box is labelled',
    (await page.locator('#paste').getAttribute('placeholder') || '').length > 10);

  /* -------------------------------------------------------- 11. responsive */
  for (const w of [360, 390, 768, 1280]) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.click('.chip[data-scen="glmer"]');
    await page.waitForTimeout(120);
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - window.innerWidth);
    ok(`no horizontal overflow @${w}px`, overflow <= 1, 'overflow=' + overflow);
  }
  await page.setViewportSize({ width: 1280, height: 900 });

  /* ------------------------------------------------------------ 12. health */
  // Off Cloudflare these endpoints do not exist: /cdn-cgi/trace is the consent
  // banner's geo probe and /api/me is auth-hydrate. Both 404 on a plain
  // http.server and both are served for real on CF, so they are filtered on
  // localhost ONLY -- against a deployed origin any 404 is a genuine failure.
  const envOnly = u => /localhost/.test(BASE) && /\/cdn-cgi\/|\/api\//.test(u);
  const realMissing = missing.filter(u =>
    !/beacon|cloudflareinsights|gtag|googletagmanager/i.test(u) && !envOnly(u));
  ok('no unexpected 404s', realMissing.length === 0, realMissing.slice(0, 3).join(' | '));
  // Every console error on localhost traces to those same env-only requests plus
  // the CF beacon's CORS rejection. Anything else (a real script error, a missing
  // lib) must fail the gate, so count errors against the requests we saw.
  const envNoise = /cloudflareinsights|beacon|ERR_INSUFFICIENT_RESOURCES|net::ERR_FAILED|Failed to load resource/i;
  const realErrors = consoleErrors.filter(e => !envNoise.test(e));
  ok('no console errors', realErrors.length === 0, realErrors.slice(0, 3).join(' | '));
  ok('no uncaught page errors', consoleErrors.filter(e => /^pageerror:/.test(e)).length === 0,
    consoleErrors.filter(e => /^pageerror:/.test(e)).join(' | '));
  // and prove the libs actually loaded rather than silently 404ing
  const libs = await page.evaluate(() => ({ m: typeof window.LmerMath, n: typeof window.NormalMath }));
  ok('lmer-math loaded', libs.m === 'object', libs.m);
  ok('normal-math loaded', libs.n === 'object', libs.n);

  await browser.close();
  if (fails.length) console.log('FAILURES:\n  ' + fails.join('\n  '));
  console.log(`\nE2E ${URL}\nPASS ${pass}  FAIL ${fail}`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('E2E ERROR', e); process.exit(2); });
