/* Local E2E for tools/coxph-output-interpreter.html.
   Asserts what the page RENDERS against the R truth table, not what the
   library returns: a correct library wired to the wrong element ships a wrong
   page. Every mode, presets, malformed input, mobile, console.

   Usage: node Scripts/tool-truth/e2e-coxph-output-interpreter.mjs [baseURL] */
import { chromium } from 'playwright';
import fs from 'fs';

const BASE = process.argv[2] || 'http://localhost:8901';
const URL = `${BASE}/tools/coxph-output-interpreter.html`;
const truth = JSON.parse(fs.readFileSync('Scripts/tool-truth/coxph-output-interpreter.json', 'utf8'));
const CASES = Object.fromEntries(truth.cases.map(c => [c.id, c]));
const PCI = Object.fromEntries(truth.cases.map(c => [c.id, printedCI(c.text)]));

let pass = 0, fail = 0;
const fails = [];
const ok = (c, label, detail) => {
  if (c) { pass++; return true; }
  fail++; fails.push(label + (detail ? `  ${detail}` : '')); return false;
};

// The table renders R's printed numbers verbatim, so the gate is exact string
// equality against what R actually printed. Pull those strings straight out of
// the summary text rather than re-deriving them: no rounding enters the check.
const fmtHR = (hr) => hr.toFixed(Math.abs(hr - 1) < 0.05 ? 3 : 2);   // mirrors CoxMath.fmtHR (prose only)

// R's exp(coef) CI block: "sex     0.588      1.701    0.4237     0.816"
function printedCI(text) {
  const lines = text.split('\n');
  const i = lines.findIndex(l => /lower\s+\.\d+\s+upper\s+\.\d+/.test(l));
  const out = {};
  if (i < 0) return out;
  for (let j = i + 1; j < lines.length; j++) {
    const w = lines[j].trim().split(/\s+/);
    if (w.length < 5) break;
    const nums = w.slice(-4);
    if (!nums.every(x => /^[\d.eE+-]+$/.test(x))) break;
    out[w.slice(0, w.length - 4).join(' ')] = { hr: nums[0], lower: nums[2], upper: nums[3] };
  }
  return out;
}

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();
const consoleErrors = [];
page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', e => consoleErrors.push('pageerror: ' + String(e)));
// "Failed to load resource: 404" in the console does NOT include the URL, so a
// bare console filter cannot tell a broken asset from /api/me, which simply does
// not exist off Cloudflare. Track responses to know which it was.
const bad404 = [];
page.on('response', r => { if (r.status() >= 400) bad404.push(`${r.status()} ${r.url()}`); });

await page.goto(URL, { waitUntil: 'networkidle' });

// ---- default paint: a real model must already be on screen ----------------
{
  const txt = await page.textContent('#paste');
  const v = await page.inputValue('#paste');
  ok(v.includes('coxph('), 'default paint: a real coxph summary is preloaded');
  const head = await page.textContent('#vhead');
  ok(/228 subjects/.test(head) || /165/.test(head), 'default paint: headline shows the model', head);
}

const setPaste = async (text) => {
  await page.fill('#paste', text);
  await page.waitForTimeout(120);
};
const setMode = async (m) => {
  await page.click(`.mode[data-mode="${m}"]`);
  await page.waitForTimeout(120);
};

// ---- every truth case, in hazard mode: the rendered HR/CI vs R ------------
await setMode('hazard');
for (const c of truth.cases) {
  await setPaste(c.text);
  const rows = await page.$$eval('.hrt tr', trs => trs.slice(1).map(tr => {
    const td = [...tr.querySelectorAll('td')].map(x => x.textContent.trim());
    return { name: td[0], hr: td[1], ci: td[2], p: td[3], read: td[4] };
  }));
  const rterms = Array.isArray(c.terms) ? c.terms : [c.terms];
  if (!ok(rows.length === rterms.length, `${c.id}: renders ${rterms.length} HR rows`,
          `got ${rows.length}`)) continue;

  for (let i = 0; i < rterms.length; i++) {
    const w = rterms[i], g = rows[i];
    ok(g.name === w.name, `${c.id}[${i}]: rendered term name`, `${g.name} vs ${w.name}`);

    // the table shows R's own printed strings: compare verbatim
    const pr = PCI[c.id][w.name];
    ok(g.hr === pr.hr, `${c.id}[${i}]: rendered HR is R's printed exp(coef)`, `"${g.hr}" vs "${pr.hr}"`);

    const m = /^([\d.eE+-]+)\s+to\s+([\d.eE+-]+)$/.exec(g.ci);
    if (ok(!!m, `${c.id}[${i}]: CI renders as "lo to hi"`, g.ci)) {
      ok(m[1] === pr.lower, `${c.id}[${i}]: rendered CI lower is R's printed value`, `"${m[1]}" vs "${pr.lower}"`);
      ok(m[2] === pr.upper, `${c.id}[${i}]: rendered CI upper is R's printed value`, `"${m[2]}" vs "${pr.upper}"`);
      // the crosses-1 pill must agree with R's own interval
      const rCross = (w.lower < 1 && w.upper > 1);
      ok(/crosses 1/.test(g.read) === rCross, `${c.id}[${i}]: crosses-1 pill matches R`, g.read);
    }
  }
}

// ---- the robust fit must render the ROBUST se-driven interval -------------
{
  const c = CASES.robust_cluster;
  await setPaste(c.text);
  const body = await page.textContent('#body');
  ok(/robust/i.test(await page.textContent('#vchip')), 'robust fit: chip flags robust SE');
  const rows = await page.$$eval('.hrt tr', trs => trs.slice(1).map(tr =>
    [...tr.querySelectorAll('td')].map(x => x.textContent.trim())));
  const w = c.terms[0];
  const pr = PCI.robust_cluster[w.name];
  const m = /^([\d.]+)\s+to\s+([\d.]+)$/.exec(rows[0][2]);
  ok(m && m[1] === pr.lower && m[2] === pr.upper,
     'robust fit: CI built from robust se, matching R', rows[0][2] + ' vs ' + pr.lower + ' to ' + pr.upper);
}

// ---- 90% and 99% levels must be picked up from the column header ----------
for (const [id, want] of [['lung_sex_90', 90], ['lung_sex_99', 99]]) {
  await setPaste(CASES[id].text);
  const chip = await page.textContent('#vchip');
  ok(chip.includes(`${want}% intervals`), `${id}: level ${want} read from the CI header`, chip);
  const rows = await page.$$eval('.hrt tr', trs => trs.slice(1).map(tr =>
    [...tr.querySelectorAll('td')].map(x => x.textContent.trim())));
  const w = CASES[id].terms[0];
  const pr = PCI[id][w.name];
  const m = /^([\d.]+)\s+to\s+([\d.]+)$/.exec(rows[0][2]);
  ok(m && m[1] === pr.lower && m[2] === pr.upper,
     `${id}: rendered CI matches R at ${want}%`, rows[0][2] + ' vs ' + pr.lower + ' to ' + pr.upper);
}

// ---- anatomy mode: every region labelled ---------------------------------
await setPaste(CASES.preset_multi.text);
await setMode('anatomy');
{
  const heads = await page.$$eval('.rgn .rh', els => els.map(e => e.textContent.trim()));
  for (const want of ['The Call', 'Counts', 'The coefficients', 'Hazard ratios with intervals',
                      'Concordance', 'The three global tests']) {
    ok(heads.includes(want), `anatomy: region "${want}" labelled`, heads.join(' | '));
  }
  const pres = await page.$$eval('.rgn .rt', els => els.map(e => e.textContent));
  ok(pres.some(t => /Call:/.test(t)), 'anatomy: Call region shows the Call text');
  ok(pres.some(t => /number of events/.test(t)), 'anatomy: counts region shows the header');
}

// ---- fit mode: global tests + the recomputed deep tail --------------------
await setMode('fit');
{
  const conc = await page.textContent('#v2');
  ok(Math.abs(parseFloat(conc) - CASES.preset_multi.conc) < 5e-4, 'fit: concordance rendered', conc);
  const rows = await page.$$eval('.hrt tr', trs => trs.slice(1).map(tr =>
    [...tr.querySelectorAll('td')].map(x => x.textContent.trim())));
  ok(rows.length >= 3, 'fit: three global tests rendered', String(rows.length));
  const lrt = rows.find(r => /Likelihood/.test(r[0]));
  ok(lrt && Math.abs(parseFloat(lrt[1]) - CASES.preset_multi.logtest.stat) < 0.06,
     'fit: LRT statistic rendered', lrt && lrt[1]);
}

// the censored-p case: R printed <2e-16, the page must recover a real tail
await setPaste(CASES.pbc_bili.text);
await setMode('fit');
{
  const rows = await page.$$eval('.hrt tr', trs => trs.slice(1).map(tr =>
    [...tr.querySelectorAll('td')].map(x => x.textContent.trim())));
  const lrt = rows.find(r => /Likelihood/.test(r[0]));
  ok(lrt && /<2e-16/.test(lrt[3]), 'censored p: R\'s printed <2e-16 shown as-is', lrt && lrt[3]);
  const recomputed = lrt && parseFloat(lrt[4]);
  ok(recomputed > 0 && recomputed < 2e-16,
     'censored p: recomputed tail is a real positive number, not 0', lrt && lrt[4]);
  ok(Math.abs(recomputed - CASES.pbc_bili.logtest.p) / CASES.pbc_bili.logtest.p < 0.05,
     'censored p: recomputed tail matches R full precision', `${recomputed} vs ${CASES.pbc_bili.logtest.p}`);
  const body = await page.textContent('#body');
  ok(/stopped at/.test(body), 'censored p: the note explains the <2e-16 floor');
  // all three agree on the conclusion despite a wide statistic spread
  ok(/same conclusion/.test(body) || /agree/.test(body),
     'wide-spread-but-agreeing tests are not called a disagreement', body.slice(0, 200));
}

// ---- ph mode -------------------------------------------------------------
await setMode('ph');
{
  const body = await page.textContent('#body');
  ok(/cox\.zph/.test(body), 'ph: points at cox.zph');
  ok(/strata/.test(body) && /tt\(/.test(body), 'ph: gives both remedies');
  const inf = await page.textContent('#inference-line');
  ok(/cox\.zph/.test(inf), 'ph: inference line names the check', inf);
  const r = await page.textContent('#rcodepre');
  ok(/cox\.zph\(model\)/.test(r) && /plot\(zph\)/.test(r), 'ph: R block runs cox.zph');
}

// ---- R code block updates per mode ---------------------------------------
{
  const seen = new Set();
  for (const m of ['anatomy', 'hazard', 'fit', 'ph']) {
    await setMode(m);
    const r = await page.textContent('#rcodepre');
    ok(r.length > 40, `R block non-empty in ${m} mode`);
    seen.add(r);
  }
  ok(seen.size === 4, 'R block differs across all four modes', `${seen.size} distinct`);
  await setMode('hazard');
  const r = await page.textContent('#rcodepre');
  ok(/ggforest/.test(r), 'hazard R block offers the forest plot');
  ok(/survfit/.test(r), 'hazard R block offers survfit for absolute risk');
}

// ---- the "I want to" select drives the mode ------------------------------
{
  await page.selectOption('#psel', 'fit');
  await page.waitForTimeout(120);
  const on = await page.getAttribute('.mode.on', 'data-mode');
  ok(on === 'fit', 'banner select and mode pills stay in lockstep', String(on));
}

// ---- presets -------------------------------------------------------------
for (const [scen, id] of [['sex', 'preset_sex'], ['multi', 'preset_multi'], ['factor', 'preset_factor']]) {
  await page.click(`.chip[data-scen="${scen}"]`);
  await page.waitForTimeout(150);
  const v = await page.inputValue('#paste');
  ok(v === CASES[id].text, `preset "${scen}" is byte-identical to R output`);
}

// ---- malformed input -----------------------------------------------------
for (const [txt, label] of [['hello world', 'prose'], ['{"a":1}', 'json'],
                            ['Call:\nlm(formula = y ~ x)\n\nResiduals:\n', 'an lm summary']]) {
  await setPaste(txt);
  const shown = await page.isVisible('#ierr');
  const msg = await page.textContent('#ierr');
  ok(shown && msg.trim().length > 10, `malformed (${label}): shows a human error`, msg);
  ok(!/undefined|NaN|\[object/.test(msg), `malformed (${label}): error text is clean`, msg);
}
// and recovering from an error clears it
await setPaste(CASES.preset_sex.text);
ok(!(await page.isVisible('#ierr')), 'fixing the paste clears the error');

// ---- copy buttons --------------------------------------------------------
await ctx.grantPermissions(['clipboard-read', 'clipboard-write']);
await setMode('hazard');
{
  const report = await page.textContent('#report');
  ok(/Cox proportional hazards model was fitted/.test(report), 'report line is journal-ready', report.slice(0, 60));
  await page.click('#copybtn');
  await page.waitForTimeout(200);
  ok((await page.textContent('#copybtn')).includes('Copied'), 'copy verdict confirms');
}

// ---- accessibility / health ---------------------------------------------
ok(await page.$('[aria-live]') !== null, 'aria-live region present');
ok(await page.$('.forest[aria-label]') !== null, 'forest plot has an aria-label');

// ---- mobile 390 ----------------------------------------------------------
await page.setViewportSize({ width: 390, height: 780 });
await page.waitForTimeout(400);
for (const m of ['anatomy', 'hazard', 'fit', 'ph']) {
  await setMode(m);
  const over = await page.evaluate(() =>
    document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  ok(!over, `mobile 390: no horizontal overflow in ${m} mode`);
}

// /api/me and the CF beacon only exist on Cloudflare: 404s for them are an
// artefact of the local server, not the page.
const ENV_ONLY = /cloudflareinsights|beacon|googletagmanager|google-analytics|\/api\/me|favicon/i;
const realAssets = bad404.filter(u => !ENV_ONLY.test(u));
ok(realAssets.length === 0, 'no broken assets', realAssets.join(' | '));

const realErrors = consoleErrors.filter(e =>
  !/cloudflareinsights|beacon|googletagmanager|google-analytics|ERR_BLOCKED|favicon|net::ERR_FAILED/i.test(e) &&
  !(/Failed to load resource/i.test(e) && realAssets.length === 0));
ok(realErrors.length === 0, 'no console errors', realErrors.slice(0, 3).join(' | '));

await browser.close();

console.log(`\ncoxph E2E: ${pass} passed, ${fail} failed`);
if (fails.length) {
  console.log('\nFailures:');
  fails.slice(0, 30).forEach(f => console.log('  ' + f));
  if (fails.length > 30) console.log(`  ... and ${fails.length - 30} more`);
  process.exit(1);
}
process.exit(0);
