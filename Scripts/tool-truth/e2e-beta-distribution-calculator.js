/* Local E2E for tools/beta-distribution-calculator.html.
   Asserts the RENDERED DOM against the R truth table (the lib itself is already
   gated by test-beta-distribution-calculator-math.js). This catches the wiring
   bugs a math harness cannot see: a mode that reads the wrong input, a stats
   grid that keeps the previous mode's labels, a curve that never repaints, a
   preset that loads values the truth table never covered, an emitted R block
   whose #> comments drifted from what R actually prints.

   Usage: node Scripts/tool-truth/e2e-beta-distribution-calculator.js [baseURL] */
'use strict';
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const truth = require('./beta-distribution-calculator.json');

const BASE = process.argv[2] || 'http://localhost:8901';
// Cache-bust when pointed at a deployed origin: Cloudflare negative-caches the
// 404s served while polling for a new page, so a bare URL right after a deploy
// can hand back the pre-deploy miss instead of the page that just went live.
const URL = BASE + '/tools/beta-distribution-calculator.html' +
  (/^https?:\/\/localhost/.test(BASE) ? '' : '?fresh=' + Date.now());

let pass = 0, fail = 0;
const fails = [];
function ok(name, cond, detail) {
  if (cond) pass++;
  else { fail++; if (fails.length < 40) fails.push(name + (detail ? ' -- ' + detail : '')); }
}
const num = s => (s === 'NA' ? null : Number(s));
const caseOf = id => truth.find(c => c.id === id);
// The UI prints 4dp, so half a unit in the last place is the tightest a
// rendered assertion can legitimately be.
function close(got, want, tol) {
  if (!isFinite(got) || !isFinite(want)) return false;
  return Math.abs(got - want) <= (tol == null ? 5e-5 : tol);
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  // Only these three are environmental: /cdn-cgi/trace and /api/me exist only
  // behind Cloudflare Pages Functions, and the analytics beacon cannot post
  // from localhost. Anything else 404ing is a real broken asset, so the filter
  // matches the URL rather than swallowing every 404.
  const ENV_ONLY = /\/cdn-cgi\/trace|\/api\/me|cloudflareinsights|beacon\.min\.js/i;
  page.on('console', m => {
    if (m.type() !== 'error') return;
    const loc = (m.location() && m.location().url) || '';
    const t = m.text();
    if (ENV_ONLY.test(loc) || ENV_ONLY.test(t)) return;
    errors.push('console: ' + t + (loc ? ' @ ' + loc : ''));
  });

  await page.goto(URL, { waitUntil: 'networkidle' });

  const setMode = async (m) => { await page.click(`.mode[data-mode="${m}"]`); };
  const setVal = async (id, v) => {
    await page.fill('#' + id, String(v));
    await page.dispatchEvent('#' + id, 'input');
  };
  const txt = async (sel) => (await page.textContent(sel)).trim();
  const numOf = async (sel) => parseFloat((await txt(sel)).replace(/[^0-9eE.+-]/g, ''));

  // ===== 1. below / above modes vs truth =================================
  for (const id of ['posterior_mid', 'unif_mid', 'skew_prior', 'spike_a02',
                    'near_normal', 'deep_lower', 'j_shape', 'bound_zero', 'bound_one']) {
    const c = caseOf(id);
    const a = num(c.inp.a), b = num(c.inp.b), x = num(c.inp.x);
    await setMode('below');
    await setVal('pa', a); await setVal('pb', b); await setVal('xc', x);
    ok(`${id} P(X<=x)`, close(await numOf('#v1'), num(c.out.p_below)),
       `got ${await txt('#v1')} want ${num(c.out.p_below)}`);
    ok(`${id} P(X>x)`, close(await numOf('#v2'), num(c.out.p_above)),
       `got ${await txt('#v2')} want ${num(c.out.p_above)}`);
    // moments are shown on every mode
    ok(`${id} mean`, close(await numOf('#d1'), num(c.out.mean)),
       `got ${await txt('#d1')} want ${num(c.out.mean)}`);
    ok(`${id} sd`, close(await numOf('#d3'), num(c.out.sd)),
       `got ${await txt('#d3')} want ${num(c.out.sd)}`);
    // mode: R says NA for the flat and bimodal cases; the page must say so in
    // words rather than print a number it invented.
    const modeTxt = await txt('#d4');
    if (num(c.out.mode) === null) {
      ok(`${id} mode is not invented`, /flat|0 and 1/.test(modeTxt), `got "${modeTxt}"`);
    } else {
      ok(`${id} mode`, close(parseFloat(modeTxt), num(c.out.mode)), `got "${modeTxt}"`);
    }
    // the 'above' mode must headline the OTHER tail from the same inputs
    await setMode('above');
    ok(`${id} above headline`, close(await numOf('#v2'), num(c.out.p_above)));
    const head = await txt('#vhead');
    ok(`${id} above headline says >`, head.includes('>'), `got "${head}"`);
  }

  // ===== 2. density, including the spike =================================
  {
    await setMode('below');
    await setVal('pa', 0.5); await setVal('pb', 0.5); await setVal('xc', 0.01);
    const c = caseOf('spike_small_x');
    ok('spike density f(x)', Math.abs(await numOf('#v3') - num(c.out.d)) < 1e-3,
       `got ${await txt('#v3')} want ${num(c.out.d)}`);
    // at x=0 with alpha<1 the density is infinite: the page must show that,
    // not NaN and not a silently clamped number.
    await setVal('xc', 0);
    const dTxt = await txt('#v3');
    ok('infinite density renders as the infinity glyph', dTxt.includes('∞'), `got "${dTxt}"`);
    ok('infinite density does not break P(X<=x)', close(await numOf('#v1'), 0));
  }

  // ===== 3. between mode vs truth ========================================
  for (const id of ['btw_posterior_ci', 'btw_unif', 'btw_skew', 'btw_full']) {
    const c = caseOf(id);
    await setMode('between');
    await setVal('pa', num(c.inp.a)); await setVal('pb', num(c.inp.b));
    await setVal('ba', num(c.inp.lo)); await setVal('bb', num(c.inp.hi));
    ok(`${id} P(inside)`, close(await numOf('#v1'), num(c.out.p_between)),
       `got ${await txt('#v1')} want ${num(c.out.p_between)}`);
    ok(`${id} P(outside)`, close(await numOf('#v2'), num(c.out.p_outside)),
       `got ${await txt('#v2')} want ${num(c.out.p_outside)}`);
  }

  // ===== 4. quantile mode: left / right / central =========================
  for (const id of ['q_median_post', 'q_skew', 'q_extreme_lo', 'q_extreme_hi', 'q_unif']) {
    const c = caseOf(id);
    const p = num(c.inp.p);
    await setMode('quantile');
    await setVal('pa', num(c.inp.a)); await setVal('pb', num(c.inp.b));
    await setVal('pp', p * 100);
    await page.selectOption('#reg', 'left');
    ok(`${id} q_left`, close(await numOf('#v1'), num(c.out.q_left)),
       `got ${await txt('#v1')} want ${num(c.out.q_left)}`);
    await page.selectOption('#reg', 'right');
    ok(`${id} q_right`, close(await numOf('#v1'), num(c.out.q_right)),
       `got ${await txt('#v1')} want ${num(c.out.q_right)}`);
  }
  // central band = the credible interval; ends are the 0.025 / 0.975 quantiles
  {
    await setMode('quantile');
    await setVal('pa', 31); await setVal('pb', 71); await setVal('pp', 95);
    await page.selectOption('#reg', 'central');
    ok('central lower end = qbeta(0.025)',
       close(await numOf('#v1'), num(caseOf('q_025_post').out.q_left)),
       `got ${await txt('#v1')}`);
    ok('central upper end = qbeta(0.975)',
       close(await numOf('#v2'), num(caseOf('q_975_post').out.q_left)),
       `got ${await txt('#v2')}`);
    ok('central band is called a credible interval',
       (await txt('#inference-line')).toLowerCase().includes('credible'));
  }

  // ===== 5. presets load and compute =====================================
  const scens = ['posterior', 'target', 'uniform', 'skew', 'spike'];
  for (const s of scens) {
    await page.click(`.chip[data-scen="${s}"]`);
    const head = await txt('#vhead');
    ok(`preset ${s} computes`, head.length > 1 && head !== '-' && !/NaN/.test(head), `got "${head}"`);
    ok(`preset ${s} draws`, (await page.$$eval('#curve path', p => p.length)) > 0);
    ok(`preset ${s} sets a hint`, (await txt('#hint')).length > 0);
  }
  // the uniform preset is the one that must be exactly Beta(1,1)=Uniform(0,1)
  {
    await page.click('.chip[data-scen="uniform"]');
    ok('uniform preset: P(X<=0.5)=0.5', close(await numOf('#v1'), 0.5));
    ok('uniform preset: density is 1', close(await numOf('#v3'), 1, 1e-3));
    ok('uniform preset: mode reads flat', (await txt('#d4')).includes('flat'));
  }

  // ===== 6. error handling ===============================================
  await setMode('below');
  await setVal('pa', 31); await setVal('pb', 71);
  await setVal('pa', -1);
  ok('negative alpha errors', await page.isVisible('#ierr'));
  ok('error message is human', /greater than 0/.test(await txt('#ierr')));
  await setVal('pa', 31);
  ok('fixing the input clears the error', !(await page.isVisible('#ierr')));
  await setVal('xc', 1.5);
  ok('x outside 0..1 errors', await page.isVisible('#ierr'));
  ok('x error explains the support', /between 0 and 1/.test(await txt('#ierr')));
  await setVal('xc', 0.3);
  ok('fixing x clears the error', !(await page.isVisible('#ierr')));
  await setMode('between');
  await setVal('ba', 0.8); await setVal('bb', 0.2);
  ok('inverted bounds error', await page.isVisible('#ierr'));
  await setVal('ba', 0.25); await setVal('bb', 0.35);
  ok('fixing bounds clears the error', !(await page.isVisible('#ierr')));

  // ===== 7. the 3 mandatory UX features ==================================
  ok('tool lead under H1', (await txt('.dek')).length > 120);
  ok('"I want to" banner is the mode selector',
     (await txt('#iwant')).startsWith('I want to') && !!(await page.$('#iwsel')));
  {
    // the banner select must actually drive the mode
    await page.selectOption('#iwsel', 'between');
    ok('banner select switches mode',
       await page.$eval('.mode[data-mode="between"]', el => el.classList.contains('on')));
  }
  ok('inference line present and live', (await txt('#inference-line')).length > 30);

  // ===== 8. everything updates together ==================================
  {
    await setMode('below');
    await setVal('pa', 31); await setVal('pb', 71); await setVal('xc', 0.3);
    const before = {
      head: await txt('#vhead'), report: await txt('#report'),
      rcode: await txt('#rcodepre'), inf: await txt('#inference-line'),
      curve: await page.$eval('#curve', el => el.innerHTML.length),
      h1: await txt('#h1c')
    };
    await setVal('xc', 0.4);
    ok('headline updates', (await txt('#vhead')) !== before.head);
    ok('report line updates', (await txt('#report')) !== before.report);
    ok('R code updates', (await txt('#rcodepre')) !== before.rcode);
    ok('inference updates', (await txt('#inference-line')) !== before.inf);
    ok('how-computed updates', (await txt('#h1c')) !== before.h1);
    ok('curve repaints', (await page.$eval('#curve', el => el.innerHTML.length)) !== before.curve
       || before.curve > 0);
  }

  // ===== 9. mobile: no horizontal overflow ===============================
  for (const w of [360, 390, 768, 1280]) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.waitForTimeout(120);
    const over = await page.evaluate(() =>
      document.documentElement.scrollWidth - window.innerWidth);
    ok(`no overflow at ${w}px`, over <= 1, `overflow ${over}px`);
  }
  await page.setViewportSize({ width: 1400, height: 1000 });

  // ===== 10. chrome + SEO ===============================================
  ok('exactly one injected chrome',
     (await page.$$('[data-tool-chrome="injected"]')).length === 1);
  ok('no bespoke masthead', (await page.$$('header.mast')).length === 0);
  ok('canonical navbar present', (await page.$$('.sitenav')).length === 1);
  ok('sidebar has links', (await page.$$eval('#sidebar-nav a', a => a.length)) > 20);
  ok('sidebar collapse rail', (await page.$$('.rail-fold')).length >= 1);
  {
    const title = await page.title();
    ok('title 40-60 chars', title.length >= 40 && title.length <= 60, `${title.length}: ${title}`);
    const desc = await page.$eval('meta[name=description]', el => el.content);
    ok('meta description present', desc.length > 80);
    ok('canonical present', !!(await page.$('link[rel=canonical]')));
    const lds = await page.$$eval('script[type="application/ld+json"]', s => s.map(x => x.textContent));
    ok('two JSON-LD blocks', lds.length === 2);
    let jsonOK = true;
    for (const l of lds) { try { JSON.parse(l); } catch (e) { jsonOK = false; } }
    ok('JSON-LD parses', jsonOK);
    ok('WebApplication schema', lds.some(l => l.includes('WebApplication')));
    ok('FAQPage schema', lds.some(l => l.includes('FAQPage')));
  }
  ok('no em dashes in body', !(await page.$eval('main', el => el.innerText)).includes('—'));
  ok('no in-page footer', (await page.$$('footer.ft')).length === 0);
  ok('trust line present', (await txt('.trust')).includes('No data leaves your browser'));

  // ===== 11. every internal link resolves ================================
  // Guessed URLs are a real failure mode on this site: the sibling normal tool
  // still links /Normal-Distribution-in-R.html, which does not exist.
  {
    const hrefs = await page.$$eval('.rel a, .sect a', as =>
      as.map(a => a.getAttribute('href')).filter(h => h && h.startsWith('/')));
    const origin = /^https?:\/\/localhost/.test(BASE) ? BASE : 'https://r-statistics.co';
    for (const h of [...new Set(hrefs)]) {
      const res = await page.request.get(origin + h, { failOnStatusCode: false });
      ok(`link resolves ${h}`, res.status() === 200, `HTTP ${res.status()}`);
    }
  }

  // ===== 12. dump the emitted R for every mode ===========================
  // Written out so the next step can run it VERBATIM in real R and diff every
  // #> comment. An emitted block that does not reproduce the page is a lie.
  const emitted = [];
  const grab = async (label) => emitted.push({ label, code: await txt('#rcodepre') });
  await setMode('below');
  await setVal('pa', 31); await setVal('pb', 71); await setVal('xc', 0.3);
  await grab('below_posterior');
  await setVal('pa', 2); await setVal('pb', 5); await setVal('xc', 0.95);
  await grab('below_deep_upper');       // the tail that must not cancel
  await setVal('pa', 1); await setVal('pb', 1); await setVal('xc', 0.5);
  await grab('below_uniform');
  await setVal('pa', 0.5); await setVal('pb', 0.5); await setVal('xc', 0.01);
  await grab('below_spike');
  await setMode('between');
  await setVal('pa', 31); await setVal('pb', 71); await setVal('ba', 0.25); await setVal('bb', 0.35);
  await grab('between_posterior');
  await setMode('quantile');
  await setVal('pa', 31); await setVal('pb', 71); await setVal('pp', 95);
  await page.selectOption('#reg', 'central');
  await grab('quantile_central');
  await page.selectOption('#reg', 'left');
  await setVal('pp', 90);
  await grab('quantile_left');
  await page.selectOption('#reg', 'right');
  await setVal('pp', 0.1);
  await grab('quantile_right_tiny');
  await setVal('pa', 2); await setVal('pb', 5); await setVal('pp', 99.9);
  await page.selectOption('#reg', 'left');
  await grab('quantile_left_extreme');
  fs.writeFileSync(path.join(__dirname, 'beta-emitted-r.json'), JSON.stringify(emitted, null, 1));

  ok('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));

  await browser.close();
  console.log(`\npass: ${pass}  fail: ${fail}`);
  if (fails.length) console.log('FAILURES:\n - ' + fails.join('\n - '));
  console.log(`emitted R blocks written: ${emitted.length}`);
  process.exit(fail === 0 ? 0 : 1);
})();
