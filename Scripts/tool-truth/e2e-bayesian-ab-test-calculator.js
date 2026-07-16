/* Local E2E: drive tools/bayesian-ab-test-calculator.html in a real browser and
 * assert the RENDERED text against the R truth table, for every mode.
 *
 * Inputs persist across mode switches by design, so every case sets them
 * explicitly rather than relying on leftover state.
 *
 * Run: node Scripts/tool-truth/e2e-bayesian-ab-test-calculator.js [baseUrl]
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const BASE = process.argv[2] || 'http://127.0.0.1:8901';
const URL = BASE + '/tools/bayesian-ab-test-calculator.html';
const truth = JSON.parse(fs.readFileSync(
  path.join(__dirname, 'bayesian-ab-test-calculator.json'), 'utf8'));

let pass = 0, fail = 0;
const fails = [];
function ok(name, cond, detail) {
  if (cond) pass++;
  else { fail++; fails.push(`${name}${detail ? ': ' + detail : ''}`); }
}
function eq(name, got, want) { ok(name, got === want, `got ${JSON.stringify(got)} want ${JSON.stringify(want)}`); }

// The page prints percentages to 1dp and losses to 4dp in pp; rebuild the same
// strings from the truth table rather than loosening the comparison.
const pctS = (x, d = 1) => (x * 100).toFixed(d) + '%';
const lossS = (x) => {
  const v = x * 100;
  if (!(v > 0)) return '0pp';
  if (v < 0.0001) return '<0.0001pp';
  return v.toFixed(4) + 'pp';
};
const ppS = (x, d = 2) => (x * 100 >= 0 ? '+' : '') + (x * 100).toFixed(d) + 'pp';
const relS = (x) => (x * 100 >= 0 ? '+' : '') + (x * 100).toFixed(1) + '%';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  const badRes = [];
  // A resource-load console error reads only "Failed to load resource: ..." and
  // does NOT carry the URL, so filtering console text by URL can never work.
  // Watch responses for that, and keep console for real script errors.
  page.on('console', m => {
    const t = m.text();
    // The CF analytics beacon posts to cloudflareinsights.com/cdn-cgi/rum, which
    // fails CORS preflight from a localhost origin. Environmental, and excepted
    // by the tool rubric.
    if (m.type() === 'error' && !/Failed to load resource/i.test(t) &&
        !/cloudflareinsights\.com|cdn-cgi\/rum/i.test(t)) errors.push(t);
  });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('response', r => { if (r.status() >= 400) badRes.push(r.status() + ' ' + r.url()); });

  await page.goto(URL, { waitUntil: 'networkidle' });

  async function setCase(inp) {
    // The option values are 2-decimal strings ("0.90"), and String(0.9) is
    // "0.9", which selects nothing at all.
    await page.selectOption('#lev', inp.level.toFixed(2));
    // prior: use the preset where one matches, else custom
    const key = `${inp.a0},${inp.b0}`;
    const preset = ['1,1', '0.5,0.5'].includes(key) ? key : 'custom';
    await page.selectOption('#prior', preset);
    if (preset === 'custom') {
      await page.fill('#a0', String(inp.a0));
      await page.fill('#b0', String(inp.b0));
    }
    for (const [id, v] of [['cA', inp.cA], ['nA', inp.nA], ['cB', inp.cB], ['nB', inp.nB]]) {
      await page.fill('#' + id, String(v));
    }
    await page.waitForTimeout(320);       // debounce (90ms) + compute
  }

  const T = async (sel) => (await page.textContent(sel)).trim();

  // ---------- every truth case, in decide mode ----------
  for (const [name, v] of Object.entries(truth)) {
    const inp = v.input, ti = v.integ, p = v.post;
    await setCase(inp);

    eq(`${name}/P(B>A)`, await T('#v1'), pctS(ti.pBgtA));
    eq(`${name}/loss ship B`, await T('#v2'), lossS(ti.lossChooseB));
    eq(`${name}/loss ship A`, await T('#v3'), lossS(ti.lossChooseA));
    eq(`${name}/lift`, await T('#v4'), ppS(ti.meanLift));
    eq(`${name}/CI A`, await T('#d1'), `${pctS(p.ciA[0], 2)} to ${pctS(p.ciA[1], 2)}`);
    eq(`${name}/CI B`, await T('#d2'), `${pctS(p.ciB[0], 2)} to ${pctS(p.ciB[1], 2)}`);
    eq(`${name}/abs lift CrI`, await T('#d3'), `${ppS(ti.dLo)} to ${ppS(ti.dHi)}`);
    eq(`${name}/rel lift CrI`, await T('#d4'), `${relS(ti.rLo)} to ${relS(ti.rHi)}`);
    // posterior shapes in the chip
    eq(`${name}/chip`, await T('#vchip'),
       `Beta(${p.a1}, ${p.b1}) vs Beta(${p.a2}, ${p.b2})`);
    // the report line must carry the same numbers it claims
    const rep = await T('#report');
    ok(`${name}/report has P(B>A)`, rep.includes(pctS(ti.pBgtA)), rep);
    ok(`${name}/report has both losses`,
       rep.includes(lossS(ti.lossChooseB)) && rep.includes(lossS(ti.lossChooseA)), rep);
  }

  // ---------- stop mode: the decision must follow the rule ----------
  for (const [name, v] of Object.entries(truth)) {
    const inp = v.input, ti = v.integ;
    await setCase(inp);
    await page.click('.mode[data-mode="stop"]');
    await page.waitForTimeout(260);

    const lossLeader = Math.min(ti.lossChooseA, ti.lossChooseB);
    const leader = ti.lossChooseB <= ti.lossChooseA ? 'B' : 'A';
    for (const thr of [0.1, 1.0]) {
      await page.fill('#thr', String(thr));
      await page.waitForTimeout(280);
      const canStop = lossLeader <= thr / 100;
      eq(`${name}/stop chip @${thr}pp`, await T('#vchip'), canStop ? 'Stop the test' : 'Keep running');
      const head = await T('#vhead');
      ok(`${name}/stop head @${thr}pp`,
         canStop ? head === `You can stop now and ship ${leader}`
                 : head === 'Not yet: too much is still at stake', head);
      const inf = await T('#inference-line');
      ok(`${name}/inference @${thr}pp names the action`,
         canStop ? inf.includes(`stop the test and ship ${leader}`)
                 : inf.includes('keep the test running'), inf.slice(0, 90));
      ok(`${name}/loss bar visible @${thr}pp`, await page.isVisible('#lossbar'));
    }
    await page.fill('#thr', '0.1');
    await page.click('.mode[data-mode="decide"]');
    await page.waitForTimeout(200);
  }

  // ---------- prior mode ----------
  await setCase({ cA: 1200, nA: 10000, cB: 1260, nB: 10000, a0: 1, b0: 1, level: 0.95 });
  await page.click('.mode[data-mode="prior"]');
  await page.waitForTimeout(400);
  ok('prior/table visible', await page.isVisible('#priortab'));
  const rows = await page.$$eval('#priorbody tr', rs => rs.map(r => r.textContent));
  ok('prior/has uniform row', rows.some(r => r.includes('Uniform')), JSON.stringify(rows));
  ok('prior/has jeffreys row', rows.some(r => r.includes('Jeffreys')), JSON.stringify(rows));
  // the uniform row must equal the headline numbers for the same prior
  const uni = truth['typical'].integ;
  ok('prior/uniform row P(B>A) matches truth',
     rows.some(r => r.includes(pctS(uni.pBgtA))), JSON.stringify(rows));
  // a custom strong prior must show up as a distinct row
  await page.selectOption('#prior', 'custom');
  await page.fill('#a0', '30'); await page.fill('#b0', '270');
  await page.waitForTimeout(420);
  const rows2 = await page.$$eval('#priorbody tr', rs => rs.map(r => r.textContent));
  ok('prior/custom row appears', rows2.some(r => r.includes('Beta(30, 270)')), JSON.stringify(rows2));
  ok('prior/3 rows with custom', rows2.length === 3, String(rows2.length));

  // ---------- error handling ----------
  await page.selectOption('#prior', '1,1');
  await setCase({ cA: 1200, nA: 10000, cB: 1260, nB: 10000, a0: 1, b0: 1, level: 0.95 });
  await page.fill('#cA', '99999');
  await page.waitForTimeout(300);
  ok('error/shows for conversions > visitors', await page.isVisible('#ierr'));
  const msg = await T('#ierr');
  ok('error/message is human', /more conversions than visitors/i.test(msg), msg);
  await page.fill('#cA', '1200');
  await page.waitForTimeout(300);
  ok('error/clears when fixed', !(await page.isVisible('#ierr')));
  eq('error/recovers to correct value', await T('#v1'), pctS(truth['typical'].integ.pBgtA));

  // empty input must not throw or wipe the page
  await page.fill('#nB', '');
  await page.waitForTimeout(300);
  ok('error/empty visitors handled', await page.isVisible('#ierr'));
  await page.fill('#nB', '10000');
  await page.waitForTimeout(300);

  // ---------- R code emitter updates live ----------
  const r1 = await T('#rcodepre');
  ok('R/code mentions the inputs', r1.includes('cA <- 1200') && r1.includes('nB <- 10000'), r1.slice(0, 80));
  await page.fill('#cA', '1100');
  await page.waitForTimeout(300);
  const r2 = await T('#rcodepre');
  ok('R/code updates with input', r2.includes('cA <- 1100'), r2.slice(0, 80));
  await page.fill('#cA', '1200');
  await page.waitForTimeout(300);

  // ---------- scenario chips ----------
  for (const [chip, expectCA] of [['winner', '100'], ['early', '8'], ['deadheat', '1000'],
                                  ['losing', '300'], ['strongprior', '6'], ['typical', '1200']]) {
    await page.click(`.chip[data-scen="${chip}"]`);
    await page.waitForTimeout(320);
    eq(`chip/${chip} loads cA`, await page.inputValue('#cA'), expectCA);
    ok(`chip/${chip} computes`, (await T('#v1')).endsWith('%'), await T('#v1'));
  }
  // the strong-prior chip must actually switch the prior control to custom
  await page.click('.chip[data-scen="strongprior"]');
  await page.waitForTimeout(320);
  eq('chip/strongprior sets custom prior', await page.inputValue('#prior'), 'custom');
  eq('chip/strongprior sets a0', await page.inputValue('#a0'), '100');
  ok('chip/strongprior reveals prior fields', await page.isVisible('#in-prior'));
  eq('chip/strongprior P(B>A) matches truth', await T('#v1'),
     pctS(truth['strong-prior'].integ.pBgtA));

  // ---------- the "I want to" banner is a working mode selector ----------
  await page.selectOption('#iwsel', 'stop');
  await page.waitForTimeout(300);
  ok('iwant/select switches mode', await page.isVisible('#lossbar'));
  ok('iwant/pill reflects mode', (await T('#iwant')).includes('stop the test now'), await T('#iwant'));
  const onPill = await page.getAttribute('.mode[data-mode="stop"]', 'class');
  ok('iwant/syncs the mode pills', onPill.includes('on'), onPill);
  await page.selectOption('#iwsel', 'decide');
  await page.waitForTimeout(250);

  // ---------- viz renders ----------
  ok('viz/curve has paths', (await page.$$('#curve path')).length >= 4);
  ok('viz/curve has aria-label', !!(await page.getAttribute('#curve', 'aria-label')));
  await page.click('.mode[data-mode="stop"]');
  await page.waitForTimeout(250);
  ok('viz/loss bar renders', (await page.$$('#lossviz rect')).length >= 2);
  await page.click('.mode[data-mode="decide"]');
  await page.waitForTimeout(250);

  // ---------- copy buttons ----------
  await page.click('#copybtn');
  await page.waitForTimeout(120);
  ok('copy/report confirms', (await T('#copybtn')) === 'Copied', await T('#copybtn'));

  // ---------- mobile: no horizontal overflow ----------
  for (const w of [360, 390, 768, 1280]) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.waitForTimeout(220);
    const over = await page.evaluate(() =>
      document.documentElement.scrollWidth - window.innerWidth);
    ok(`responsive/${w}px no overflow`, over <= 1, `scrollWidth-innerWidth=${over}`);
  }
  await page.setViewportSize({ width: 1280, height: 900 });

  // ---------- console health ----------
  ok('health/no script errors', errors.length === 0, errors.join(' | '));
  // Two endpoints only exist on Cloudflare, so a localhost static server 404s
  // them by construction (both verified 200 on prod in the CF check):
  //   /cdn-cgi/trace - the consent banner's geo probe
  //   /api/me        - the auth-hydrate Pages Function, injected by build.py
  // Everything else must be a 200.
  const realBad = badRes.filter(u =>
    !/cdn-cgi\/trace|\/api\/me|cloudflareinsights|googletagmanager/i.test(u));
  ok('health/no failed resources', realBad.length === 0, realBad.join(' | '));

  await browser.close();
  console.log(`\nE2E: ${pass} passed, ${fail} failed`);
  if (fail) { console.log('\nFAILURES:'); fails.slice(0, 40).forEach(f => console.log('  ' + f)); process.exit(1); }
  console.log('ALL GREEN');
})().catch(e => { console.error(e); process.exit(1); });
