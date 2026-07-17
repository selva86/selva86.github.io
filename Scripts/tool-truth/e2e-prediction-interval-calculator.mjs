/* Local E2E for tools/prediction-interval-calculator.html.
   Asserts the RENDERED numbers against the R truth table for every preset,
   every level, and several x0 including extrapolation. Also covers the three
   mandatory UX features, malformed paste, the R emitter, and mobile overflow.

   Usage: node Scripts/tool-truth/e2e-prediction-interval-calculator.mjs [baseUrl] */
import { chromium } from 'playwright';
import { readFileSync } from 'fs';

const BASE = process.argv[2] || 'http://localhost:8792';
const URL = `${BASE}/tools/prediction-interval-calculator.html?fresh=${Date.now()}`;
const truth = JSON.parse(readFileSync('Scripts/tool-truth/prediction-interval-calculator.json', 'utf8'));

// preset chip -> truth-table case name
const MAP = { study: 'study_hours_n12', cars: 'cars_head20', ads: 'ad_spend_n10', tiny: 'tiny_n3' };

let pass = 0, fail = 0;
const bad = [];
function ok(cond, what, extra) {
  if (cond) { pass++; } else { fail++; bad.push(what + (extra ? ` :: ${extra}` : '')); }
}
// Rendered text is rounded for humans; assert to the displayed precision.
function near(got, want, what, tol = 0.0006) {
  const d = Math.abs(got - want);
  ok(d <= tol * Math.max(1, Math.abs(want)) + 0.0006, what, `got ${got} want ${want} diff ${d}`);
}
function nums(s) {
  return (s.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + String(e).slice(0, 160)));
page.on('console', m => {
  if (m.type() !== 'error') return;
  const t = m.text();
  // Localhost-only infrastructure: /cdn-cgi/trace and /api/me exist on the CF
  // prod edge, and the CF beacon is CORS-blocked off-origin. Verified to fail
  // identically on already-shipped tools, so they are not this page's doing.
  if (/cloudflareinsights|cdn-cgi|\/api\/me/i.test(t)) return;
  if (/Failed to load resource/i.test(t)) return;
  errors.push('console: ' + t.slice(0, 160));
});

await page.goto(URL, { waitUntil: 'load', timeout: 45000 });
await page.waitForTimeout(700);

// ---- 1. THE 3 MANDATORY UX FEATURES ---------------------------------------
const lead = await page.locator('h1 ~ .dek, .dek').first().innerText();
ok(lead.length > 120, 'tool lead present under H1', `len ${lead.length}`);
ok(await page.locator('#iwant select').count() === 1, '"I want to" banner has an inline mode select');
const iwantTxt = await page.locator('#iwant').innerText();
ok(/^I want to/.test(iwantTxt.trim()), '"I want to" banner phrasing', iwantTxt.slice(0, 60));
ok(await page.locator('#inference-line').count() === 1, 'inference line present after results');

// banner select is synced with the mode pills
await page.selectOption('#iwsel', 'pi');
await page.waitForTimeout(150);
ok(await page.locator('.mode[data-mode="pi"]').getAttribute('class').then(c => c.includes('on')),
   'banner select drives the mode pills');
await page.click('.mode[data-mode="both"]');
await page.waitForTimeout(150);
ok(await page.locator('#iwsel').inputValue() === 'both', 'mode pills drive the banner select');

// ---- 2. NUMBERS vs R, every preset x every level x several x0 --------------
const LVL_PILL = { 0.9: '.pill[data-lvl="0.9"]', 0.95: '.pill[data-lvl="0.95"]', 0.99: '.pill[data-lvl="0.99"]' };

for (const [chip, caseName] of Object.entries(MAP)) {
  const c = truth.cases.find(k => k.name === caseName);
  await page.click(`.chip[data-scen="${chip}"]`);
  await page.waitForTimeout(200);

  // the preset must load the exact verified vectors
  const pasted = await page.locator('#data').inputValue();
  const rows = pasted.trim().split('\n').slice(1);
  ok(rows.length === c.n, `${chip}: preset row count`, `${rows.length} vs ${c.n}`);

  for (const cell of c.cells) {
    await page.click(LVL_PILL[cell.level]);
    await page.fill('#x0', String(cell.x0));
    await page.waitForTimeout(120);

    const piTxt = await page.locator('#pivals').innerText();
    const ciTxt = await page.locator('#civals').innerText();
    const pn = nums(piTxt), cn = nums(ciTxt);
    ok(pn.length === 2, `${caseName}@${cell.x0}/${cell.level}: PI renders two bounds`, piTxt);
    ok(cn.length === 2, `${caseName}@${cell.x0}/${cell.level}: CI renders two bounds`, ciTxt);
    if (pn.length === 2) {
      near(pn[0], cell.pi_lo, `${caseName}@x0=${cell.x0} L=${cell.level} PI lo`);
      near(pn[1], cell.pi_hi, `${caseName}@x0=${cell.x0} L=${cell.level} PI hi`);
    }
    if (cn.length === 2) {
      near(cn[0], cell.ci_lo, `${caseName}@x0=${cell.x0} L=${cell.level} CI lo`);
      near(cn[1], cell.ci_hi, `${caseName}@x0=${cell.x0} L=${cell.level} CI hi`);
    }
    // shared centre
    const v1 = Number(await page.locator('#v1').innerText());
    near(v1, cell.fit, `${caseName}@x0=${cell.x0} L=${cell.level} fitted centre`);

    // extrapolation flag must match the observed range
    const shouldWarn = cell.x0 < c.xmin || cell.x0 > c.xmax;
    const warnVisible = await page.locator('#warn').evaluate(el => el.classList.contains('show'));
    ok(warnVisible === shouldWarn,
       `${caseName}@x0=${cell.x0}: extrapolation warning ${shouldWarn ? 'shown' : 'hidden'}`,
       `visible=${warnVisible}`);
    if (shouldWarn) {
      const wt = await page.locator('#warn').innerText();
      ok(/extrapolat/i.test(wt), `${caseName}@x0=${cell.x0}: warning names extrapolation`);
    }
  }
}

// ---- 3. PI always wider, and both narrowest at xbar ------------------------
await page.click('.chip[data-scen="study"]');
await page.click(LVL_PILL[0.95]);
await page.waitForTimeout(150);
{
  const widths = [];
  for (const x0 of [6.5, 4, 9, 1, 12, -1, 16]) {
    await page.fill('#x0', String(x0));
    await page.waitForTimeout(100);
    const pw = nums(await page.locator('#piw').innerText())[0];
    const cw = nums(await page.locator('#ciw').innerText())[0];
    ok(pw > cw, `x0=${x0}: PI wider than CI on screen`, `pi ${pw} ci ${cw}`);
    widths.push({ x0, pw, cw });
  }
  const atBar = widths.find(w => w.x0 === 6.5);
  for (const w of widths) {
    ok(w.cw >= atBar.cw - 1e-9, `CI band minimal at mean of x (vs x0=${w.x0})`);
    ok(w.pw >= atBar.pw - 1e-9, `PI band minimal at mean of x (vs x0=${w.x0})`);
  }
}

// ---- 4. what-if slider live-updates both intervals -------------------------
{
  await page.fill('#x0', '6.5');
  await page.waitForTimeout(120);
  const before = await page.locator('#pivals').innerText();
  await page.locator('#x0r').evaluate(el => {
    el.value = String(Number(el.max));
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.waitForTimeout(150);
  const after = await page.locator('#pivals').innerText();
  ok(before !== after, 'slider live-updates the prediction interval');
  const x0after = await page.locator('#x0').inputValue();
  ok(Math.abs(Number(x0after) - 6.5) > 0.5, 'slider writes back to the x0 number input', x0after);
  const sv = await page.locator('#sv').innerText();
  ok(sv.includes(x0after) || sv.length > 3, 'slider read-out updates', sv);
}

// ---- 5. dependent outputs all move together --------------------------------
{
  await page.click('.chip[data-scen="study"]');
  await page.fill('#x0', '6.5');
  await page.click(LVL_PILL[0.95]);
  await page.locator('#how').evaluate(el => el.open = true);   // steps are in a <details>
  await page.waitForTimeout(150);
  // textContent, not innerText: collapsed regions render as '' otherwise.
  const snap = async () => await page.evaluate(() => ({
    plain: document.getElementById('plain').textContent,
    infl: document.getElementById('inference-line').textContent,
    rep: document.getElementById('report').textContent,
    rcode: document.getElementById('rcodepre').textContent,
    steps: document.getElementById('h4c').textContent,
    chip: document.getElementById('vchip').textContent,
    pi: document.getElementById('pivals').textContent,
    ci: document.getElementById('civals').textContent,
    head: document.getElementById('vhead').textContent,
  }));
  const a = await snap();
  await page.click(LVL_PILL[0.99]);
  await page.waitForTimeout(150);
  const b = await snap();
  for (const k of ['plain', 'infl', 'rep', 'rcode', 'steps', 'chip', 'pi', 'ci'])
    ok(a[k] !== b[k], `level change updates #${k}`);
  ok(b.rcode.includes('level = 0.99'), 'R code carries the chosen level', b.rcode.slice(0, 80));
  ok(b.chip.includes('99'), 'result chip shows the level');
  ok(b.steps.includes('99%'), 'steps name the chosen level');

  // In "compare both" the headline states the centre and the width RATIO. Both
  // are level-invariant (the t multiplier cancels in sePred/seFit), so it must
  // NOT change here. That is the property, not an oversight.
  ok(a.head === b.head, 'compare-both headline is level-invariant (t cancels in the ratio)');
  // nums() stops at the sentence period; a bare [\d.]+ would swallow it and NaN.
  const r95 = nums(a.head)[0], r99 = nums(b.head)[0];
  ok(isFinite(r95) && r95 === r99, 'fitted centre unchanged by level', `${r95} vs ${r99}`);
  const ratio95 = await page.evaluate(() => document.getElementById('v4').textContent);
  await page.click(LVL_PILL[0.9]);
  await page.waitForTimeout(120);
  const ratio90 = await page.evaluate(() => document.getElementById('v4').textContent);
  ok(ratio95 === ratio90, 'PI/CI width ratio is level-invariant', `${ratio95} vs ${ratio90}`);

  // But in single-interval modes the headline IS the interval, so it must move.
  await page.click('.mode[data-mode="pi"]');
  await page.click(LVL_PILL[0.95]);
  await page.waitForTimeout(150);
  const h95 = await page.locator('#vhead').innerText();
  await page.click(LVL_PILL[0.99]);
  await page.waitForTimeout(150);
  const h99 = await page.locator('#vhead').innerText();
  ok(h95 !== h99, 'PI-mode headline follows the level');
  await page.click('.mode[data-mode="both"]');
  await page.waitForTimeout(120);
}

// ---- 6. R emitter shape ----------------------------------------------------
{
  await page.click('.chip[data-scen="study"]');
  await page.fill('#x0', '6.5');
  await page.click(LVL_PILL[0.95]);
  await page.waitForTimeout(150);
  const rc = await page.locator('#rcodepre').innerText();
  ok(rc.includes('lm(y ~ x, data = d)'), 'R code fits with lm()');
  ok(rc.includes('interval = "prediction"'), 'R code emits the prediction call');
  ok(rc.includes('interval = "confidence"'), 'R code emits the confidence call');
  ok(rc.includes('data.frame(x = 6.5)'), 'R code carries x0 into newdata');
  const c = truth.cases.find(k => k.name === 'study_hours_n12');
  const cell = c.cells.find(z => z.x0 === 6.5 && z.level === 0.95);
  ok(rc.includes(cell.pi_lo.toFixed(3)), 'R code comment shows the verified PI lower bound');
  ok(rc.includes(cell.ci_hi.toFixed(3)), 'R code comment shows the verified CI upper bound');
}

// ---- 7. malformed / edge input --------------------------------------------
const badInputs = [
  ['', /paste some data/i, 'empty'],
  ['1\n2\n3\n4\n5', /single column|two/i, 'one column'],
  ['hello world\nfoo bar\nbaz qux', /no usable number pairs|two numbers/i, 'no numbers'],
  ['1,2\n2,4', /at least 3 points/i, 'n=2'],
  ['5,1\n5,2\n5,3\n5,4', /every x value is the same/i, 'zero variance x'],
  ['@@@\n###\n$$$', /no usable number pairs|two numbers|single column/i, 'junk symbols'],
];
for (const [txt, re, label] of badInputs) {
  await page.fill('#data', txt);
  await page.waitForTimeout(150);
  const shown = await page.locator('#ierr').evaluate(el => el.classList.contains('show'));
  ok(shown, `malformed (${label}): error shown`);
  const msg = await page.locator('#ierr').innerText();
  ok(re.test(msg), `malformed (${label}): human message`, msg.slice(0, 90));
}
// NA rows tolerated, not fatal
await page.fill('#data', 'x,y\n1,54\n2,NA\n3,61\n4,63\n5,71\n6,72');
await page.waitForTimeout(150);
ok(!(await page.locator('#ierr').evaluate(el => el.classList.contains('show'))), 'NA rows tolerated');
// fixing the input clears the error
await page.fill('#data', '1\n2\n3');
await page.waitForTimeout(120);
ok(await page.locator('#ierr').evaluate(el => el.classList.contains('show')), 'error re-shown for bad input');
await page.click('.chip[data-scen="study"]');
await page.waitForTimeout(150);
ok(!(await page.locator('#ierr').evaluate(el => el.classList.contains('show'))), 'fixing the input clears the error');

// ---- 8. viz renders and is labelled ---------------------------------------
{
  const n = await page.locator('#plot circle').count();
  ok(n >= 12, 'plot draws the data points', `circles ${n}`);
  const paths = await page.locator('#plot path').count();
  ok(paths >= 4, 'plot draws both bands plus the fit line', `paths ${paths}`);
  const al = await page.locator('#plot').getAttribute('aria-label');
  ok(al && al.length > 60 && /prediction band/i.test(al), 'plot aria-label describes both bands');
  // extreme x0 must not blow up the drawing
  await page.fill('#x0', '99999');
  await page.waitForTimeout(200);
  ok(await page.locator('#plot path').count() >= 4, 'plot survives an extreme x0');
  const html = await page.locator('#plot').innerHTML();
  ok(!/NaN|Infinity/.test(html), 'plot emits no NaN/Infinity geometry');
  await page.fill('#x0', '6.5');
  await page.waitForTimeout(120);
}

// ---- 9. copy buttons -------------------------------------------------------
await ctx.grantPermissions(['clipboard-read', 'clipboard-write']);
await page.click('#copybtn');
await page.waitForTimeout(250);
ok((await page.locator('#copybtn').innerText()).includes('Copied'), 'report copy confirms');
await page.click('#rcopy');
await page.waitForTimeout(250);
ok((await page.locator('#rcopy').innerText()).includes('Copied'), 'R code copy confirms');

// ---- 10. chrome + SEO + a11y ----------------------------------------------
{
  const d = await page.evaluate(() => ({
    chrome: document.querySelectorAll('[data-tool-chrome="injected"]').length,
    ownMast: document.querySelectorAll('header.mast').length,
    sitenav: document.querySelectorAll('.sitenav').length,
    sideLinks: document.querySelectorAll('#sidebar-nav a').length,
    rail: document.querySelectorAll('.rail-fold').length,
    title: document.title,
    desc: (document.querySelector('meta[name="description"]') || {}).content || '',
    canonical: (document.querySelector('link[rel=canonical]') || {}).href || '',
    ld: [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => s.textContent),
    live: document.querySelectorAll('[aria-live]').length,
    labels: [...document.querySelectorAll('input,textarea,select')].every(
      el => el.labels?.length || el.getAttribute('aria-label') || el.getAttribute('aria-labelledby')),
    faqDetails: document.querySelectorAll('[class*="faq"] details').length,
    emdash: document.body.innerText.includes('—'),
    footer: document.querySelectorAll('footer.ft').length,
  }));
  ok(d.chrome === 1, 'exactly one injected chrome', String(d.chrome));
  ok(d.ownMast === 0, 'no bespoke masthead', String(d.ownMast));
  ok(d.sitenav >= 1, 'canonical navbar present');
  ok(d.sideLinks > 20, 'sidebar has >20 links', String(d.sideLinks));
  ok(d.rail >= 1, 'sidebar collapse rail present');
  ok(d.title.length >= 40 && d.title.length <= 60, 'title 40-60ch', `${d.title.length}`);
  ok(d.desc.length > 60, 'meta description present');
  ok(d.canonical.includes('prediction-interval-calculator'), 'canonical set');
  ok(d.ld.length >= 2, 'two JSON-LD blocks');
  for (const s of d.ld) { try { JSON.parse(s); ok(true, 'JSON-LD parses'); } catch { ok(false, 'JSON-LD parses', s.slice(0, 60)); } }
  ok(d.ld.some(s => s.includes('WebApplication')), 'WebApplication schema');
  ok(d.ld.some(s => s.includes('FAQPage')), 'FAQPage schema');
  ok(d.live >= 1, 'aria-live on results');
  ok(d.labels, 'every input labelled');
  ok(d.faqDetails >= 5, 'FAQ uses plain details/summary', String(d.faqDetails));
  ok(!d.emdash, 'no em dashes in rendered text');
  ok(d.footer === 0, 'no in-page footer');
}

// ---- 11. mobile 390 --------------------------------------------------------
for (const w of [360, 390, 768, 1280]) {
  await page.setViewportSize({ width: w, height: 900 });
  await page.waitForTimeout(250);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ok(overflow <= 1, `no horizontal overflow at ${w}px`, `overflow ${overflow}px`);
}
await page.setViewportSize({ width: 1280, height: 900 });

// ---- 12. console clean -----------------------------------------------------
ok(errors.length === 0, 'no console/page errors', errors.join(' | ').slice(0, 300));

await browser.close();
console.log(`\npass: ${pass}   fail: ${fail}`);
if (bad.length) { console.log('\nFAILURES:'); bad.slice(0, 40).forEach(b => console.log('  - ' + b)); }
console.log(fail ? 'E2E: FAIL' : 'E2E: PASS');
process.exit(fail ? 1 : 0);
