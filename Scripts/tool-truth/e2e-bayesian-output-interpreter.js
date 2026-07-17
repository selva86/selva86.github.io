/* Local E2E for tools/bayesian-output-interpreter.html.
   Asserts the RENDERED DOM against the truth tables. The parser is already gated by
   test-bayesian-output-interpreter-math.js; this catches the wiring bugs a math
   harness cannot see: a preset that loads text rstanarm never printed, a view that
   keeps the previous mode's body, a stats grid that does not follow the model, an
   R block that never repaints, a verdict that stays green on a fit that diverged.

   Usage: node Scripts/tool-truth/e2e-bayesian-output-interpreter.js [baseURL] */
'use strict';
const { chromium } = require('playwright');
const truth = require('./bayesian-output-interpreter.json');
const brmsTruth = require('./brms-preset.json');

const BASE = process.argv[2] || 'http://localhost:8901';
const URL = BASE + '/tools/bayesian-output-interpreter.html' +
  (/^https?:\/\/localhost/.test(BASE) ? '' : '?fresh=' + Date.now());

let pass = 0, fail = 0;
const fails = [];
function ok(name, cond, detail) {
  if (cond) pass++;
  else { fail++; if (fails.length < 50) fails.push(name + (detail ? ' -- ' + detail : '')); }
}

const $ = (page, id) => page.$eval('#' + id, e => e.textContent.trim()).catch(() => null);

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', e => consoleErrors.push('pageerror: ' + e.message));
  const missing = [];
  page.on('response', r => { if (r.status() === 404) missing.push(r.url()); });

  await page.goto(URL, { waitUntil: 'networkidle' });

  // ---------------------------------------------------------------- chrome
  ok('exactly one injected chrome',
     (await page.$$('[data-tool-chrome="injected"]')).length === 1);
  ok('no bespoke masthead', (await page.$$('header.mast')).length === 0);
  ok('canonical navbar present', (await page.$$('.sitenav')).length === 1);
  ok('sidebar collapse rail present', (await page.$$('.rail-fold')).length >= 1);
  const sideLinks = await page.$$eval('.tool-chrome-side a', a => a.length).catch(() => 0);
  ok('sidebar has >20 links', sideLinks > 20, 'got ' + sideLinks);

  // ---------------------------------------------------------------- first paint
  ok('never paints empty: paste is prefilled',
     (await page.$eval('#paste', e => e.value.length)) > 100);
  ok('first paint is the gauss preset',
     (await page.$eval('#paste', e => e.value)) === truth.presets.gauss.summary_text);
  ok('stats grid visible on first paint',
     await page.$eval('#statgrid', e => !e.hidden));
  {
    const vl = await $(page, 'verline');
    ok('version line names the real R build', vl.includes('rstanarm 2.32.2'), vl);
    ok('version line states the brms preset was not fitted here',
       /quoted verbatim from the official/.test(vl) && /paulbuerkner/.test(vl), vl);
    ok('version line links the brms source',
       (await page.$$('#verline a[href="https://paulbuerkner.com/brms/"]')).length === 1);
  }

  // ---------------------------------------------------------------- the 3 UX features
  ok('tool lead under H1 present',
     (await page.$eval('.dek', e => e.textContent)).length > 120);
  const iwant = await page.$eval('#iwant', e => e.textContent);
  ok('"I want to" banner present', /^I want to/.test(iwant.trim()), iwant);
  ok('"I want to" carries a real select', (await page.$$('#iwantsel')).length === 1);
  ok('inference line visible', await page.$eval('#inference-line', e => !e.hidden));

  // ---------------------------------------------------------------- presets
  async function loadPreset(key) {
    await page.click(`.chip[data-scen="${key}"]`);
    await page.waitForTimeout(60);
  }

  for (const key of Object.keys(truth.presets)) {
    const pre = truth.presets[key];
    await loadPreset(key);
    const val = await page.$eval('#paste', e => e.value);
    ok(`preset ${key}: textarea holds the byte-identical captured output`,
       val === pre.summary_text);

    // the stats grid must report the model, not a stale one
    const v1 = await $(page, 'v1');
    ok(`preset ${key}: stat grid names ${pre.expect.stan_function}`,
       v1 === pre.expect.stan_function, v1);
    const v2 = await $(page, 'v2');
    ok(`preset ${key}: stat grid says the interval is 80%`, v2 === '80%', v2);

    // worst Rhat / lowest ESS must equal the worst row in the truth table
    const rhats = pre.expect.params.filter(p => p.rhat !== undefined).map(p => p.rhat);
    const esss = pre.expect.params.filter(p => p.n_eff !== undefined).map(p => p.n_eff);
    const wantRhat = Math.max.apply(null, rhats).toFixed(3);
    const wantEss = String(Math.min.apply(null, esss));
    ok(`preset ${key}: worst Rhat rendered as ${wantRhat}`,
       (await $(page, 'v3')) === wantRhat, await $(page, 'v3'));
    ok(`preset ${key}: lowest ESS rendered as ${wantEss}`,
       (await $(page, 'v4')) === wantEss, await $(page, 'v4'));

    // the R block must repaint per preset
    const rc = await $(page, 'rcodepre');
    ok(`preset ${key}: R block shows this preset's call`,
       rc.includes(pre.r_call.split('\n').pop().slice(0, 20)) || rc.includes(pre.label),
       rc.slice(0, 80));
  }

  // ---------------------------------------------------------------- brms preset
  await loadPreset('brms');
  ok('brms preset: textarea holds the documented output verbatim',
     (await page.$eval('#paste', e => e.value)) === brmsTruth.preset.summary_text);
  ok('brms preset: stat grid says brms', (await $(page, 'v1')) === 'brms', await $(page, 'v1'));
  ok('brms preset: interval is 95%', (await $(page, 'v2')) === '95%', await $(page, 'v2'));
  {
    const wantRhat = Math.max.apply(null,
      brmsTruth.preset.expect.population.concat(brmsTruth.preset.expect.groups).map(p => p.rhat));
    ok('brms preset: worst Rhat rendered', (await $(page, 'v3')) === wantRhat.toFixed(3),
       await $(page, 'v3'));
    const wantEss = Math.min.apply(null,
      brmsTruth.preset.expect.population.concat(brmsTruth.preset.expect.groups)
        .flatMap(p => [p.bulk_ess, p.tail_ess]));
    ok('brms preset: lowest ESS rendered', (await $(page, 'v4')) === String(wantEss),
       await $(page, 'v4'));
  }

  // ---------------------------------------------------------------- verdicts
  await loadPreset('gauss');
  ok('gauss: verdict chip is positive',
     (await $(page, 'vchip')) === 'Looks trustworthy', await $(page, 'vchip'));
  ok('gauss: inference line says the sampling is sound',
     (await $(page, 'inference-line')).includes('sampling is sound'));

  await loadPreset('weak');
  ok('weak: verdict chip refuses the fit',
     (await $(page, 'vchip')) === 'Do not report this', await $(page, 'vchip'));
  ok('weak: headline says it did not converge',
     (await $(page, 'vhead')).includes('did not converge'), await $(page, 'vhead'));
  ok('weak: report line flags non-convergence',
     (await $(page, 'report')).includes('DID NOT CONVERGE'), await $(page, 'report'));

  await loadPreset('diverge');
  ok('diverge: verdict chip refuses the fit',
     (await $(page, 'vchip')) === 'Do not report this', await $(page, 'vchip'));
  ok('diverge: report line carries the real divergence count',
     (await $(page, 'report')).includes(truth.presets.diverge.expect.divergences + ' divergences'),
     await $(page, 'report'));

  // ---------------------------------------------------------------- modes
  async function setMode(m) {
    await page.click(`.mode[data-mode="${m}"]`);
    await page.waitForTimeout(60);
  }
  await loadPreset('gauss');

  await setMode('read');
  ok('read mode: anatomy regions rendered', (await page.$$('.rgn')).length >= 3);
  const anat = await page.$eval('#body', e => e.textContent);
  ok('read mode: labels the Model Info block', anat.includes('Model Info'));
  ok('read mode: labels the MCMC diagnostics block', anat.includes('MCMC diagnostics'));

  await setMode('coef');
  ok('coef mode: forest plot rendered', (await page.$$('.fp-row')).length === 3);
  ok('coef mode: forest plot has an aria-label',
     (await page.$eval('.fplot', e => e.getAttribute('aria-label') || '')).length > 10);
  ok('coef mode: zero line drawn', (await page.$$('.fp-zero')).length >= 1);
  const coefBody = await page.$eval('#body', e => e.textContent);
  ok('coef mode: shows the real wt estimate', coefBody.includes('-3.868'), 'looking for -3.868');
  ok('coef mode: shows the real wt interval bounds',
     coefBody.includes('-4.705') && coefBody.includes('-3.033'));
  ok('coef mode: sigma is called out as not a coefficient',
     coefBody.includes('residual standard deviation'));
  ok('coef mode: per-row scaling is stated, not implied',
     coefBody.includes('own scale') && coefBody.includes('do not compare bar widths'));
  ok('coef mode: every row gets its own zero line', (await page.$$('.fp-zero')).length === 3);
  // a posterior probability is never exactly 100%: it must be bounded, not rounded up
  ok('coef mode: never claims a probability of 100%',
     !/\b100\.0%/.test(coefBody) && !/\b0\.0%/.test(coefBody),
     (coefBody.match(/.{0,40}100\.0%.{0,10}/) || [''])[0]);
  ok('coef mode: bounds an extreme probability instead',
     coefBody.includes('greater than 99.9%'));
  ok('coef mode: labels P(>0) as an approximation',
     coefBody.includes('approximation from the printed mean'));

  await setMode('diag');
  ok('diag mode: per-parameter table rendered', (await page.$$('.dtable tr')).length >= 5);
  const diagBody = await page.$eval('#body', e => e.textContent);
  ok('diag mode: explains between vs within chain variance',
     diagBody.includes('between') && diagBody.includes('within'));
  ok('diag mode: names the 1.01 threshold', diagBody.includes('1.01'));
  ok('diag mode: names the 400 ESS rule of thumb', diagBody.includes('400'));
  ok('diag mode: says summary() does not print divergences',
     diagBody.includes('does not print divergences') || diagBody.includes('not in this paste'));

  await setMode('verdict');
  ok('verdict mode: paragraph rendered', (await page.$$('#vpara')).length === 1);
  const vpara = await page.$eval('#vpara', e => e.textContent);
  ok('verdict mode: paragraph names the formula', vpara.includes('mpg ~ wt + hp'));
  ok('verdict mode: paragraph warns about the 80% default', vpara.includes('80%'));
  ok('verdict mode: next steps listed', (await page.$$('ol.nx li')).length >= 3);

  // mode switching must not leave the previous body behind
  await setMode('read');
  ok('mode switch clears the previous view',
     (await page.$$('#vpara')).length === 0 && (await page.$$('.rgn')).length >= 3);

  // ---------------------------------------------------------------- divergence teaching
  await loadPreset('diverge');
  await setMode('diag');
  const dv = await page.$eval('#body', e => e.textContent);
  ok('diverge/diag: reports the real divergence count',
     dv.includes(String(truth.presets.diverge.expect.divergences)));
  ok('diverge/diag: teaches the adapt_delta ladder',
     dv.includes('0.9') && dv.includes('0.95') && dv.includes('0.99'));
  ok('diverge/diag: gives the reparameterization escape hatch',
     dv.toLowerCase().includes('reparameterize'));
  ok('diverge/diag: says more iterations will not fix a divergence',
     dv.includes('no amount of extra iterations') || dv.includes('does not help') ||
     dv.includes('biased'));

  // ---------------------------------------------------------------- multilevel
  await loadPreset('mlm');
  await setMode('coef');
  const mlmBody = await page.$eval('#body', e => e.textContent);
  ok('mlm: Sigma[] row explained as a variance',
     mlmBody.includes('variance') && mlmBody.includes('Sigma[cyl:(Intercept),(Intercept)]'));
  ok('mlm: b[] group offsets explained', mlmBody.includes('group offsets') || mlmBody.includes('b[...] rows'));

  // ---------------------------------------------------------------- error handling
  // Set the value and fire the same input event a real keystroke would. page.fill()
  // is no use for the empty case: filling '' over an already-empty box is a no-op
  // that dispatches nothing, so the tool would never be asked to re-read.
  async function typePaste(t) {
    await page.$eval('#paste', (e, v) => {
      e.value = v;
      e.dispatchEvent(new Event('input', { bubbles: true }));
    }, t);
    await page.waitForTimeout(60);
  }

  await typePaste('this is not a model summary at all');
  ok('junk paste: error shown', await page.$eval('#ierr', e => e.classList.contains('show')));
  ok('junk paste: error lists supported formats',
     (await $(page, 'ierr')).includes('rstanarm') && (await $(page, 'ierr')).includes('brms'),
     await $(page, 'ierr'));
  ok('junk paste: results hidden', await page.$eval('#statgrid', e => e.hidden));
  ok('junk paste: R block does not go blank',
     (await $(page, 'rcodepre')).startsWith('#'));

  await typePaste('Call:\nlm(formula = mpg ~ wt)\n\nCoefficients:\n            Estimate Std. Error t value Pr(>|t|)\n(Intercept)  37.2851     1.8776  19.858  < 2e-16 ***\n\nResidual standard error: 3.046 on 30 degrees of freedom\n');
  ok('lm paste: redirected with a working link',
     (await page.$$('#ierr a[href="/tools/lm-output-interpreter.html"]')).length === 1);

  await typePaste('');
  ok('empty paste: asks for a summary',
     (await $(page, 'ierr')).includes('Nothing pasted yet'), await $(page, 'ierr'));

  // fixing the input clears the error
  await typePaste(truth.presets.gauss.summary_text);
  ok('fixing the paste clears the error',
     !(await page.$eval('#ierr', e => e.classList.contains('show'))));
  ok('fixing the paste brings the results back',
     await page.$eval('#statgrid', e => !e.hidden));

  // ---------------------------------------------------------------- live recompute
  await typePaste(truth.presets.gauss.summary_text.replace('1.000 2935', '1.400 35'));
  const v3 = await $(page, 'v3');
  ok('editing the paste recomputes the verdict live', v3 === '1.400', v3);
  ok('editing the paste flips the chip to a refusal',
     (await $(page, 'vchip')) === 'Do not report this', await $(page, 'vchip'));

  // ---------------------------------------------------------------- clear
  await loadPreset('gauss');
  await page.click('#clearbtn');
  await page.waitForTimeout(60);
  ok('clear empties the box', (await page.$eval('#paste', e => e.value)) === '');

  // ---------------------------------------------------------------- mobile
  await page.setViewportSize({ width: 390, height: 900 });
  await loadPreset('gauss');
  await page.waitForTimeout(120);
  const overflow390 = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth);
  ok('390px: no horizontal overflow', overflow390 <= 1, 'overflow ' + overflow390 + 'px');
  await page.setViewportSize({ width: 360, height: 900 });
  await page.waitForTimeout(120);
  const overflow360 = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth);
  ok('360px: no horizontal overflow', overflow360 <= 1, 'overflow ' + overflow360 + 'px');
  await page.setViewportSize({ width: 1280, height: 900 });

  // ---------------------------------------------------------------- health
  /* Two endpoints the injected chrome calls on every tool page exist only on the
     real origin, so a local static server answers 404 and the browser logs it:
       /cdn-cgi/trace  - Cloudflare's edge geo lookup, fetched by www/consent-banner.js
       /api/me         - the site's auth check, fetched by www/auth-hydrate.js
     Neither is this tool's code. They are excused on localhost only; against a
     deployed origin the filter below is inert and a real 404 still fails the run. */
  const CHROME_ONLY = /\/cdn-cgi\/trace|\/api\/me/;
  const local = /^https?:\/\/localhost/.test(BASE);
  const ignorable = u =>
    /cloudflareinsights|googletagmanager|gstatic|googleapis/.test(u) ||
    (local && CHROME_ONLY.test(u));

  const realMissing = missing.filter(u => !ignorable(u));
  ok('no 404s', realMissing.length === 0, realMissing.join(' | '));
  // Console 404 lines carry no URL, so they can only be counted, not matched:
  // allow exactly as many as the excused requests we actually saw.
  const excused = missing.filter(u => ignorable(u)).length;
  // The CF beacon cannot reach cloudflareinsights.com from localhost, so it logs a
  // CORS rejection plus a net::ERR_FAILED. Excepted by rule, on localhost only.
  const beaconNoise = /cloudflareinsights|beacon|CORS|net::ERR/i;
  const realErrors = consoleErrors
    .filter(e => !(local && beaconNoise.test(e)))
    .filter(e => !/Failed to load resource/.test(e));
  ok('no console errors', realErrors.length === 0, realErrors.join(' | '));
  // 404 console lines carry no URL, so count them rather than match them: there
  // must be no more than the excused chrome endpoints we actually watched 404.
  const resourceErrors = consoleErrors.filter(
    e => /Failed to load resource/.test(e) && !(local && beaconNoise.test(e)));
  ok('no unexplained failed requests', resourceErrors.length <= excused,
     `${resourceErrors.length} failed loads but only ${excused} excused chrome endpoints`);

  await browser.close();

  console.log(`${pass} passed, ${fail} failed`);
  if (fail) {
    fails.forEach(f => console.log('  FAIL  ' + f));
    process.exit(1);
  }
  console.log('e2e-bayesian-output-interpreter: rendered DOM matches the captured output.');
})().catch(e => { console.error(e); process.exit(1); });
