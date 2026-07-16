/* E2E for tools/icc-calculator.html
   Asserts RENDERED values against Scripts/tool-truth/icc-calculator.json
   (psych::ICC(x, lmer = FALSE)) across every mode, picker path, CI level,
   error path and viewport.

   Usage: node Scripts/tool-truth/e2e-icc.mjs [baseURL]
*/
import { chromium } from 'playwright';
import fs from 'fs';

const BASE = process.argv[2] || 'http://127.0.0.1:8099';
const URL = `${BASE}/tools/icc-calculator.html`;
const truth = Object.fromEntries(
  JSON.parse(fs.readFileSync('Scripts/tool-truth/icc-calculator.json', 'utf8'))
    .map(c => [c.name, c])
);

let pass = 0, fail = 0;
const ok = (name, cond, got, want) => {
  if (cond) { pass++; }
  else { fail++; console.log(`  FAIL ${name}: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`); }
};
const near = (name, got, want, tol = 0.0006) =>
  ok(name, Math.abs(got - want) <= tol, got, want);

// psych row order -> notation used on the page
const NOTE = { ICC1: 'ICC(1,1)', ICC2: 'ICC(2,1)', ICC3: 'ICC(3,1)',
               ICC1k: 'ICC(1,k)', ICC2k: 'ICC(2,k)', ICC3k: 'ICC(3,k)' };

const page = await (await chromium.launch()).newPage();
const consoleErrors = [], failedRequests = [];
page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', e => consoleErrors.push('pageerror: ' + e.message));
page.on('response', r => { if (r.status() >= 400) failedRequests.push(r.url()); });
await page.goto(URL, { waitUntil: 'networkidle' });

// Read the rendered all-six table into {ICC1:{icc,lower,upper,F,df,p}, ...}
const readTable = () => page.evaluate(() => {
  const out = {};
  document.querySelectorAll('#alltab tbody tr').forEach(tr => {
    const td = [...tr.querySelectorAll('td')].map(x => x.textContent.trim());
    const ci = td[2].match(/\[(-?[\d.]+), (-?[\d.]+)\]/);
    out[td[0]] = {
      icc: parseFloat(td[1]),
      lower: ci ? parseFloat(ci[1]) : null,
      upper: ci ? parseFloat(ci[2]) : null,
      F: parseFloat(td[3]), df: td[4], p: td[5],
      picked: tr.classList.contains('pickrow')
    };
  });
  return out;
});
const setData = async (txt) => {
  await page.fill('#data', txt);
  await page.waitForTimeout(60);
};
const matToText = (m, names) =>
  (names ? names.join(', ') + '\n' : '') + m.map(r => r.join(', ')).join('\n');

// ---------------------------------------------------------------
// 1. Default paint: the radiology preset == truth case tiny_6x3
// ---------------------------------------------------------------
{
  const t = truth.tiny_6x3;
  const tab = await readTable();
  for (let i = 0; i < 6; i++) {
    const n = NOTE[t.type[i]];
    near(`default.${n}.icc`, tab[n].icc, t.ICC[i]);
    near(`default.${n}.lower`, tab[n].lower, t.lower[i]);
    near(`default.${n}.upper`, tab[n].upper, t.upper[i]);
    near(`default.${n}.F`, tab[n].F, t.F[i], 0.006);
  }
  // default picker = random + absolute + single -> ICC(2,1)
  ok('default.picked', tab['ICC(2,1)'].picked === true, tab['ICC(2,1)'].picked, true);
  const head = await page.textContent('#vhead');
  ok('default.headline', head.includes('ICC(2,1)') && head.includes(t.ICC[1].toFixed(3)), head, `ICC(2,1) = ${t.ICC[1].toFixed(3)}`);
  ok('default.notEmpty', (await page.textContent('#dmeta')).includes('6 subjects x 3 raters'), await page.textContent('#dmeta'), '6 subjects x 3 raters');
}

// ---------------------------------------------------------------
// 2. Every truth case with alpha .05, wide mode, via paste
// ---------------------------------------------------------------
for (const name of ['clean_20x4', 'judge_bias_20x4', 'two_raters_15x2', 'likert_12x5',
                    'pure_noise_10x3', 'six_raters_25x6', 'moderate_30x3',
                    'rater_bias_clean_8x3', 'exact_offset_6x3', 'perfect_8x3']) {
  const t = truth[name];
  await setData(matToText(t.matrix));
  const tab = await readTable();
  for (let i = 0; i < 6; i++) {
    const n = NOTE[t.type[i]];
    near(`${name}.${n}.icc`, tab[n].icc, t.ICC[i]);
    // R's own bounds are compared; where the transform is singular the page
    // prints n/a, which we assert matches R's lower > upper artefact.
    const singular = t.lower[i] > t.upper[i];
    if (singular) {
      ok(`${name}.${n}.ci-suppressed`, tab[n].lower === null, tab[n].lower, null);
    } else {
      near(`${name}.${n}.lower`, tab[n].lower, t.lower[i]);
      near(`${name}.${n}.upper`, tab[n].upper, t.upper[i]);
    }
  }
}

// ---------------------------------------------------------------
// 3. CI level switching (90 / 95 / 99) on a case with all three
// ---------------------------------------------------------------
for (const [lvl, name] of [['0.90', 'clean_20x4_a90'], ['0.95', 'clean_20x4'], ['0.99', 'clean_20x4_a99']]) {
  const t = truth[name];
  await setData(matToText(t.matrix));
  await page.click(`[data-level="${lvl}"]`);
  await page.waitForTimeout(60);
  const tab = await readTable();
  for (let i = 0; i < 6; i++) {
    const n = NOTE[t.type[i]];
    near(`level${lvl}.${n}.lower`, tab[n].lower, t.lower[i]);
    near(`level${lvl}.${n}.upper`, tab[n].upper, t.upper[i]);
  }
}
await page.click('[data-level="0.95"]');

// 99% on two raters, a separate truth case
{
  const t = truth.two_raters_15x2_a99;
  await setData(matToText(t.matrix));
  await page.click('[data-level="0.99"]');
  await page.waitForTimeout(60);
  const tab = await readTable();
  for (let i = 0; i < 6; i++) {
    near(`2rat99.${NOTE[t.type[i]]}.lower`, tab[NOTE[t.type[i]]].lower, t.lower[i]);
  }
  await page.click('[data-level="0.95"]');
}

// ---------------------------------------------------------------
// 4. The picker drives the headline: every path
// ---------------------------------------------------------------
{
  const t = truth.rater_bias_clean_8x3;
  await setData(matToText(t.matrix));
  const idx = { ICC1: 0, ICC2: 1, ICC3: 2, ICC1k: 3, ICC2k: 4, ICC3k: 5 };
  const paths = [
    ['oneway', null, 'single', 'ICC1'],
    ['oneway', null, 'average', 'ICC1k'],
    ['random', 'absolute', 'single', 'ICC2'],
    ['random', 'absolute', 'average', 'ICC2k'],
    ['random', 'consistency', 'single', 'ICC3'],
    ['random', 'consistency', 'average', 'ICC3k'],
    ['fixed', null, 'single', 'ICC3'],
    ['fixed', null, 'average', 'ICC3k']
  ];
  for (const [design, agree, unit, want] of paths) {
    await page.click(`[data-design="${design}"]`);
    if (agree) await page.click(`[data-agree="${agree}"]`);
    await page.click(`[data-unit="${unit}"]`);
    await page.waitForTimeout(50);
    const tag = `pick[${design},${agree},${unit}]`;
    const head = await page.textContent('#vhead');
    ok(`${tag}.headline`, head.includes(NOTE[want]), head, NOTE[want]);
    // headline value must equal R's value for that form
    const v = parseFloat(head.split('=')[1]);
    near(`${tag}.value`, v, t.ICC[idx[want]]);
    const tab = await readTable();
    ok(`${tag}.rowHighlighted`, tab[NOTE[want]].picked === true, tab[NOTE[want]].picked, true);
    // Q2 must hide for non-random designs and show for random
    const q2Hidden = await page.locator('#q-agree').isHidden();
    ok(`${tag}.q2visibility`, q2Hidden === (design !== 'random'), q2Hidden, design !== 'random');
    const mootHidden = await page.locator('#agreemoot').isHidden();
    ok(`${tag}.mootVisibility`, mootHidden === (design === 'random'), mootHidden, design === 'random');
  }
  // restore
  await page.click('[data-design="random"]');
  await page.click('[data-agree="absolute"]');
  await page.click('[data-unit="single"]');
}

// ---------------------------------------------------------------
// 5. Long format pivots to the same answer as the wide table
// ---------------------------------------------------------------
{
  await page.click('.chip[data-scn="long"]');
  await page.waitForTimeout(80);
  const t = truth.tiny_6x3;
  const tab = await readTable();
  for (let i = 0; i < 6; i++) {
    near(`long.${NOTE[t.type[i]]}.icc`, tab[NOTE[t.type[i]]].icc, t.ICC[i]);
  }
  ok('long.modeActive', await page.locator('.mode[data-mode="long"]').evaluate(e => e.classList.contains('on')), true, true);
  ok('long.meta', (await page.textContent('#dmeta')).includes('6 subjects x 3 raters'), await page.textContent('#dmeta'), '6 subjects x 3 raters');
}

// ---------------------------------------------------------------
// 6. Missing data -> listwise drop + a note (not a crash)
// ---------------------------------------------------------------
{
  await page.click('.chip[data-scn="radiology"]');
  await page.waitForTimeout(60);
  await setData('Dr_A, Dr_B, Dr_C\n9, 8, 9\n6, , 6\n8, 8, 7\n7, 6, 8\n5, 6, 5\n9, 9, 9');
  const noteShown = await page.locator('#inote').isVisible();
  ok('missing.noteShown', noteShown, noteShown, true);
  ok('missing.noteText', (await page.textContent('#inote')).includes('1 subject was'), await page.textContent('#inote'), '1 subject was');
  ok('missing.meta', (await page.textContent('#dmeta')).includes('5 subjects'), await page.textContent('#dmeta'), '5 subjects');
  ok('missing.noError', !(await page.locator('#ierr').isVisible()), true, true);
}

// ---------------------------------------------------------------
// 7. Error paths, each with a human message, and recovery
// ---------------------------------------------------------------
const errCases = [
  ['', 'Paste your ratings'],
  ['5\n5\n5', 'single column'],                    // one rater column
  ['1, 2, 3', 'single row'],                       // one subject row
  ['7, 7\n7, 7\n7, 7', 'no variance'],             // constant
  ['banana, split\nnope, nope', 'Could not read any numbers']  // junk
];
for (const [txt, want] of errCases) {
  await setData(txt);
  const vis = await page.locator('#ierr').isVisible();
  const msg = await page.textContent('#ierr');
  ok(`err[${JSON.stringify(txt).slice(0, 18)}].shown`, vis, vis, true);
  ok(`err[${JSON.stringify(txt).slice(0, 18)}].msg`, msg.includes(want), msg, want);
}
// recovery: fixing the input clears the error
{
  const t = truth.tiny_6x3;
  await setData(matToText(t.matrix));
  ok('err.recovers', !(await page.locator('#ierr').isVisible()), true, true);
  near('err.recoveredValue', (await readTable())['ICC(2,1)'].icc, t.ICC[1]);
}

// ---------------------------------------------------------------
// 8. Everything downstream updates together
// ---------------------------------------------------------------
{
  const t = truth.pure_noise_10x3;
  await setData(matToText(t.matrix));
  const report = await page.textContent('#report');
  ok('noise.report', report.includes('ICC(2,1) = ' + t.ICC[1].toFixed(2)), report, t.ICC[1].toFixed(2));
  ok('noise.reportNk', report.includes('n = 10 subjects, k = 3 raters'), report, 'n = 10 subjects, k = 3 raters');
  const infl = await page.textContent('#infline');
  ok('noise.inference', /no measurable reliability/.test(infl), infl, 'no measurable reliability');
  const plain = await page.textContent('#plain');
  ok('noise.plain', /below zero/.test(plain), plain, 'below zero');
  ok('noise.plainClass', (await page.getAttribute('#plain', 'class')).includes('bad'), await page.getAttribute('#plain', 'class'), 'bad');
  const rc = await page.textContent('#rcodepre');
  ok('noise.rcode', rc.includes('lmer = FALSE') && rc.includes('ICC(2,1) = ' + t.ICC[1].toFixed(3)), rc.slice(0, 60), 'lmer=FALSE + value');
  ok('noise.viz', (await page.innerHTML('#forms')).length > 100, 'forms svg', 'non-empty');
  ok('noise.gauge', (await page.innerHTML('#gauge')).length > 100, 'gauge svg', 'non-empty');
  // ICC2k CI is singular in R here (lower > upper) -> page must say n/a.
  // Note the picked form is ICC(2,1), whose own CI is fine, so the singular
  // one only reaches the headline once we switch the unit to average.
  const tab = await readTable();
  ok('noise.singularCI', tab['ICC(2,k)'].lower === null, tab['ICC(2,k)'].lower, null);
  await page.click('[data-unit="average"]');
  await page.waitForTimeout(60);
  ok('noise.singularHeadline', (await page.textContent('#vsub')).includes('not usable'), await page.textContent('#vsub'), 'not usable');
  const cav = await page.textContent('#caveat');
  ok('noise.caveatExplains', /not usable/.test(cav), cav, 'not usable');
  await page.click('[data-unit="single"]');
  await page.waitForTimeout(60);
  // with a usable CI the caveat moves on to the real limitation
  ok('noise.caveatSmallStudy', /small for a reliability estimate/.test(await page.textContent('#caveat')), await page.textContent('#caveat'), 'small-study caveat');
}

// ---------------------------------------------------------------
// 9. The rater-bias teaching case: ICC3 >> ICC2, caveat fires
// ---------------------------------------------------------------
{
  await page.click('.chip[data-scn="bias"]');
  await page.waitForTimeout(80);
  const t = truth.rater_bias_clean_8x3;
  const tab = await readTable();
  near('bias.ICC3', tab['ICC(3,1)'].icc, t.ICC[2]);
  near('bias.ICC2', tab['ICC(2,1)'].icc, t.ICC[1]);
  ok('bias.gap', tab['ICC(3,1)'].icc - tab['ICC(2,1)'].icc > 0.15,
     tab['ICC(3,1)'].icc - tab['ICC(2,1)'].icc, '>0.15');
  const cav = await page.textContent('#caveat');
  ok('bias.caveat', /Absolute agreement and consistency disagree/.test(cav), cav, 'gap caveat');
}

// ---------------------------------------------------------------
// 10. ANOVA table matches R's mean squares
// ---------------------------------------------------------------
{
  const t = truth.likert_12x5;
  await setData(matToText(t.matrix));
  const aov = await page.evaluate(() => {
    const o = {};
    document.querySelectorAll('#aovtab tbody tr').forEach(tr => {
      const td = [...tr.querySelectorAll('td')].map(x => x.textContent.trim());
      o[td[0]] = { df: +td[1], ss: parseFloat(td[2]), ms: parseFloat(td[3]) };
    });
    return o;
  });
  near('aov.MSB', aov.Subjects.ms, t.MSB, 0.0006);
  near('aov.MSJ', aov.Raters.ms, t.MSJ, 0.0006);
  near('aov.MSE', aov.Residual.ms, t.MSE, 0.0006);
  near('aov.MSW', aov['Within (pooled)'].ms, t.MSW, 0.0006);
  ok('aov.dfB', aov.Subjects.df === t.dfB, aov.Subjects.df, t.dfB);
  ok('aov.dfJ', aov.Raters.df === t.dfJ, aov.Raters.df, t.dfJ);
  ok('aov.dfE', aov.Residual.df === t.dfE, aov.Residual.df, t.dfE);
}

// ---------------------------------------------------------------
// 11. Copy buttons
// ---------------------------------------------------------------
{
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  for (const [btn, want] of [['#copybtn', 'ICC(2,1)'], ['#rcopy', 'lmer = FALSE'], ['#copyall', 'ICC(3,k)']]) {
    await page.click(btn);
    await page.waitForTimeout(90);
    const txt = await page.evaluate(() => navigator.clipboard.readText());
    ok(`copy[${btn}]`, txt.includes(want), txt.slice(0, 40), want);
    ok(`copy[${btn}].confirms`, (await page.textContent(btn)) === 'Copied', await page.textContent(btn), 'Copied');
  }
}

// ---------------------------------------------------------------
// 12. Responsive: no horizontal overflow
// ---------------------------------------------------------------
// 1024 is the width that matters most: the injected sidebar squeezes the
// results card while the window is still "desktop", so a viewport-keyed
// media query can leave the stat grid too narrow for its own contents.
for (const w of [360, 390, 768, 1024, 1280, 1440]) {
  await page.setViewportSize({ width: w, height: 900 });
  await page.waitForTimeout(150);
  const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ok(`responsive[${w}].noOverflow`, over <= 1, over, '<=1');
  // no stat tile may wrap onto a second line at any width
  const wrapped = await page.evaluate(() =>
    [...document.querySelectorAll('.st .v')].filter(v => v.getBoundingClientRect().height > 24).length);
  ok(`responsive[${w}].noTileWrap`, wrapped === 0, wrapped, 0);
}
await page.setViewportSize({ width: 1280, height: 900 });

// ---------------------------------------------------------------
// 13. Health / SEO / a11y
// ---------------------------------------------------------------
{
  const title = await page.title();
  ok('seo.titleLen', title.length >= 40 && title.length <= 60, title.length, '40-60');
  const desc = await page.getAttribute('meta[name="description"]', 'content');
  ok('seo.descLen', desc.length >= 140 && desc.length <= 170, desc.length, '140-170');
  ok('seo.canonical', (await page.getAttribute('link[rel=canonical]', 'href')) === 'https://r-statistics.co/tools/icc-calculator.html', true, true);
  const ld = await page.$$eval('script[type="application/ld+json"]', ns => ns.map(n => { try { JSON.parse(n.textContent); return true; } catch (e) { return false; } }));
  ok('seo.jsonldValid', ld.length === 2 && ld.every(Boolean), ld, [true, true]);
  ok('a11y.ariaLive', await page.locator('[aria-live="polite"]').count() > 0, true, true);
  const emdash = await page.evaluate(() => document.body.innerText.includes('—'));
  ok('style.noEmDash', emdash === false, emdash, false);
  const jbm = await page.evaluate(() => document.documentElement.outerHTML.includes('JetBrains'));
  ok('style.noJetBrains', jbm === false, jbm, false);
  // Excepted, and only these: the Cloudflare beacon (CORS-blocked off-origin)
  // and /api/me (a Pages Function, so it 404s under a plain static server).
  // Both are injected chrome, both are 200 on the real origin. Anything else
  // counts as a genuine error.
  const real = consoleErrors.filter(e =>
    !/cloudflareinsights|cdn-cgi|beacon|ERR_(BLOCKED|CONNECTION)|net::/i.test(e) &&
    !/404/.test(e));
  ok('health.noConsoleErrors', real.length === 0, real, []);
  const unexpected404 = failedRequests.filter(u => !/\/api\/me|cdn-cgi|cloudflareinsights/.test(u));
  ok('health.no404s', unexpected404.length === 0, unexpected404, []);
}

console.log(`\nE2E icc-calculator: ${pass} passed, ${fail} failed`);
await page.context().browser().close();
if (fail) { console.log('GATE: FAIL'); process.exit(1); }
console.log('GATE: PASS');
