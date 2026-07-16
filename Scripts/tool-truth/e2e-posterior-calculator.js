/* Local E2E for tools/posterior-calculator.html.
   Asserts the RENDERED DOM against the R truth table for all 28 cases across
   the three families (the lib is already gated by test-posterior-calculator-math.js).
   This catches what a math harness cannot see: a family that reads another
   family's inputs, a stats grid still showing the previous family's labels, a
   curve that never repaints, a preset that sets a field the truth never covered.
   It also CAPTURES the emitted R blocks to posterior-emitted-r.json, which
   verify-posterior-emitted-r.js then runs verbatim in real R.

   Usage: node Scripts/tool-truth/e2e-posterior-calculator.js [baseURL] */
'use strict';
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const truth = require('./posterior-calculator.json');

const BASE = process.argv[2] || 'http://localhost:8901';
// Cache-bust off localhost: Cloudflare negative-caches the 404s served while
// polling for a new page, so a bare URL right after a deploy can hand back the
// pre-deploy miss instead of the page that just went live.
const URL = BASE + '/tools/posterior-calculator.html' +
  (/^https?:\/\/localhost/.test(BASE) ? '' : '?fresh=' + Date.now());

let pass = 0, fail = 0;
const fails = [];
function ok(name, cond, detail) {
  if (cond) pass++;
  else { fail++; if (fails.length < 45) fails.push(name + (detail ? ' -- ' + detail : '')); }
}
// The UI trims to a readable precision, so the tightest a rendered assertion can
// legitimately be is half a unit in the last place actually shown.
function closeDisp(shown, want, name) {
  const got = Number(shown);
  if (!isFinite(got)) return ok(name, false, `unparseable "${shown}"`);
  let tol;
  if (/e/i.test(shown)) tol = Math.abs(want) * 5e-3 + 1e-300;
  else {
    const m = /\.(\d+)$/.exec(shown);
    tol = m ? 0.5 * Math.pow(10, -m[1].length) : 0.5;
  }
  return ok(name, Math.abs(got - want) <= tol * 1.001, `shown ${shown} vs R ${want}`);
}

const FIELDS = {
  'beta-binomial': { a0: 'bb-a0', b0: 'bb-b0', s: 'bb-s', n: 'bb-n' },
  'normal-normal': { m0: 'nn-m0', s0: 'nn-s0', xbar: 'nn-xbar', n: 'nn-n', sigma: 'nn-sigma' },
  'gamma-poisson': { a0: 'gp-a0', b0: 'gp-b0', y: 'gp-y', t: 'gp-t' }
};

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const consoleErrs = [];
  page.on('console', m => {
    // A console error for a failed request carries no URL, so it cannot be
    // judged here; the response listener below checks those precisely by URL.
    // This one catches real JS errors.
    // The CF web-analytics beacon cannot validate a localhost origin, so its
    // CORS complaint is an artefact of the test server, not the page.
    const envNoise = /Failed to load resource|cloudflareinsights|cdn-cgi\/rum/;
    if (m.type() === 'error' && !envNoise.test(m.text())) consoleErrs.push(m.text());
  });
  // Console 404s carry no URL, so watch responses instead: /api/me and
  // /cdn-cgi/trace are CF Functions and legitimately 404 off Cloudflare.
  const bad404 = [];
  page.on('response', r => {
    if (r.status() >= 400 && !/\/api\/me|cdn-cgi\/trace|beacon\.min\.js|gtag|googletagmanager/.test(r.url())) {
      bad404.push(r.status() + ' ' + r.url());
    }
  });
  const resp = await page.goto(URL, { waitUntil: 'networkidle' });
  ok('page 200', resp.status() === 200, String(resp.status()));

  // ---------- the three old-tool UX features ----------
  ok('tool lead under H1', (await page.locator('h1 + p.dek, .dek').first().innerText()).length > 120);
  const iwant = await page.locator('#iwant').innerText();
  ok('"I want to" banner present', /I want to/.test(iwant), iwant);
  ok('banner carries the family selector', await page.locator('#iwant select#fsel').count() === 1);
  ok('inference line has the id page_audit looks for', await page.locator('#inference-line').count() === 1);

  const emitted = [];

  // ---------- every truth case, every family ----------
  for (const c of truth) {
    const L = `[${c.family}] ${c.label} @${c.level}`;
    await page.click(`.mode[data-mode="${c.family}"]`);
    for (const [k, id] of Object.entries(FIELDS[c.family])) {
      await page.fill('#' + id, String(c.inp[k]));
    }
    await page.selectOption('#lev', String(c.level));
    await page.waitForTimeout(30);

    ok(L + ' no error shown', !(await page.locator('#ierr').evaluate(e => e.classList.contains('show'))));
    closeDisp(await page.locator('#v1').innerText(), c.mean, L + ' posterior mean');
    closeDisp(await page.locator('#v2').innerText(), c.median, L + ' posterior median');
    closeDisp(await page.locator('#v3').innerText(), c.sd, L + ' posterior SD');
    const ci = (await page.locator('#v4').innerText()).split(' to ');
    ok(L + ' CI has two ends', ci.length === 2, JSON.stringify(ci));
    if (ci.length === 2) {
      closeDisp(ci[0], c.lo, L + ' CI lower');
      closeDisp(ci[1], c.hi, L + ' CI upper');
    }
    closeDisp(await page.locator('#d1').innerText(), c.priorMean, L + ' prior mean');
    closeDisp(await page.locator('#d2').innerText(), c.mle, L + ' data estimate');

    // headline must equal the interval, not go stale
    const head = (await page.locator('#vhead').innerText()).split(' to ');
    if (head.length === 2) closeDisp(head[0], c.lo, L + ' headline lower');

    // the posterior parameters, from the closed-form update
    const chip = await page.locator('#vchip').innerText();
    if (c.family === 'normal-normal') {
      ok(L + ' chip names a Normal posterior', /^Posterior: Normal\(/.test(chip), chip);
    } else {
      const want = c.family === 'beta-binomial' ? 'Beta' : 'Gamma';
      ok(L + ` chip names a ${want} posterior`, chip.indexOf('Posterior: ' + want + '(') === 0, chip);
    }

    // the curve must actually repaint for this case
    const paths = await page.locator('#plot-g path').count();
    ok(L + ' plot draws prior+likelihood+posterior', paths >= 3, 'paths=' + paths);

    // live inference line names this level and this interval
    const inf = await page.locator('#inference-line').innerText();
    ok(L + ' inference line states the probability claim',
      inf.indexOf(Math.round(c.level * 100) + '% probability') > 0, inf.slice(0, 90));

    emitted.push({ id: L, family: c.family, level: c.level, code: await page.locator('#rcodepre').innerText() });
  }

  // ---------- presets ----------
  for (const fam of Object.keys(FIELDS)) {
    await page.click(`.mode[data-mode="${fam}"]`);
    const chips = await page.locator('#scen .chip').count();
    ok(`[${fam}] presets present`, chips >= 4, 'chips=' + chips);
    // the weak/strong pair must move the posterior on IDENTICAL data
    const nth = await page.locator('#scen .chip').nth(0);
    await nth.click(); await page.waitForTimeout(20);
    const weakMean = await page.locator('#v1').innerText();
    const weakData = await page.locator('#d2').innerText();
    await page.locator('#scen .chip').nth(1).click(); await page.waitForTimeout(20);
    const strongMean = await page.locator('#v1').innerText();
    const strongData = await page.locator('#d2').innerText();
    ok(`[${fam}] weak/strong presets hold the data fixed`, weakData === strongData, `${weakData} vs ${strongData}`);
    ok(`[${fam}] weak/strong presets move the posterior`, weakMean !== strongMean, `${weakMean} vs ${strongMean}`);
  }

  // ---------- validation: human messages, and recovery ----------
  await page.click('.mode[data-mode="beta-binomial"]');
  await page.fill('#bb-s', '50'); await page.fill('#bb-n', '10');
  await page.waitForTimeout(30);
  ok('successes > trials is rejected', await page.locator('#ierr').evaluate(e => e.classList.contains('show')));
  ok('the message is human', /cannot exceed/i.test(await page.locator('#ierr').innerText()));
  await page.fill('#bb-s', '5');
  await page.waitForTimeout(30);
  ok('fixing the input clears the error', !(await page.locator('#ierr').evaluate(e => e.classList.contains('show'))));

  await page.fill('#bb-a0', '0'); await page.waitForTimeout(30);
  ok('alpha 0 is rejected', await page.locator('#ierr').evaluate(e => e.classList.contains('show')));
  await page.fill('#bb-a0', '1'); await page.waitForTimeout(30);

  await page.click('.mode[data-mode="gamma-poisson"]');
  await page.fill('#gp-b0', '0'); await page.waitForTimeout(30);
  ok('improper prior (rate 0) is rejected with guidance',
    /0\.001/.test(await page.locator('#ierr').innerText()), await page.locator('#ierr').innerText());
  await page.fill('#gp-b0', '0.001'); await page.waitForTimeout(30);

  // ---------- family switch must swap the visible inputs ----------
  await page.click('.mode[data-mode="normal-normal"]');
  ok('normal inputs visible', await page.locator('#in-nn').isVisible());
  ok('beta inputs hidden', !(await page.locator('#in-bb').isVisible()));
  ok('gamma inputs hidden', !(await page.locator('#in-gp').isVisible()));

  // ---------- go-deeper links resolve ----------
  const hrefs = await page.locator('.rel a').evaluateAll(as => as.map(a => a.getAttribute('href')));
  for (const h of hrefs) {
    if (h === '/tools/') { ok('link /tools/ exists', fs.existsSync(path.join(__dirname, '../../tools/index.html'))); continue; }
    const f = path.join(__dirname, '../..', h.replace(/^\//, ''));
    ok('go-deeper link resolves: ' + h, fs.existsSync(f));
  }

  // ---------- mobile ----------
  await page.setViewportSize({ width: 390, height: 850 });
  await page.waitForTimeout(60);
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ok('390px: no horizontal overflow', ov <= 1, 'overflow=' + ov);
  await page.setViewportSize({ width: 360, height: 850 });
  await page.waitForTimeout(60);
  const ov2 = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ok('360px: no horizontal overflow', ov2 <= 1, 'overflow=' + ov2);

  ok('no console errors', consoleErrs.length === 0, consoleErrs.slice(0, 3).join(' | '));
  ok('no unexpected 404s', bad404.length === 0, bad404.slice(0, 3).join(' | '));

  await browser.close();

  fs.writeFileSync(path.join(__dirname, 'posterior-emitted-r.json'), JSON.stringify(emitted, null, 1));
  console.log(`\ncaptured ${emitted.length} emitted R blocks -> posterior-emitted-r.json`);
  console.log(`${pass}/${pass + fail} checks pass`);
  if (fails.length) { console.log('\nFAILURES:'); fails.forEach(f => console.log('  - ' + f)); }
  process.exit(fail ? 1 : 0);
})();
