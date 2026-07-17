/* e2e-post-hoc-calculator.mjs - drives the real page in a real browser and
   asserts the RENDERED numbers against the R truth table.
   Usage: node Scripts/tool-truth/e2e-post-hoc-calculator.mjs [baseUrl]
   The math harness proves the library; this proves the PAGE wires it up. */
import { chromium } from 'playwright';
import { readFileSync } from 'fs';

const BASE = process.argv[2] || 'http://127.0.0.1:8899';
const T = JSON.parse(readFileSync('Scripts/tool-truth/post-hoc-calculator.json', 'utf8'));

let pass = 0, fail = 0;
const fails = [];
function ok(c, label, detail) {
  if (c) { pass++; return true; }
  fail++; if (fails.length < 30) fails.push(label + '  ' + (detail || ''));
  return false;
}
function near(a, b, tol, label) {
  const e = Math.abs(a - b) / Math.max(1e-12, Math.abs(b));
  return ok(e <= tol, label, `page=${a} R=${b} rel=${e.toExponential(2)}`);
}
const num = (s) => parseFloat(String(s).replace(/[^0-9eE+\-.]/g, ''));
// The page's own p-value display contract (mirrors pfmtPlain in the UI engine).
// Asserting the exact rendered STRING is stricter than a relative tolerance and
// catches a formatter that quietly rounds precision away.
function pExpect(p) {
  if (p < 0.0001) return '< 0.0001';
  if (p < 0.1) return p.toPrecision(3);
  return p.toFixed(4);
}
// The padj cell can carry a trailing "!" flag; take the leading value token.
const pCell = (s) => String(s).replace(/\s*!\s*$/, '').trim();

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + String(e).slice(0, 200)));
// Console 404 messages do not carry the URL, so track failures by response.
// /cdn-cgi/trace and /api/me are Cloudflare-only endpoints that simply do not
// exist on a local http.server; both return 200 in production. They are called
// by the INJECTED chrome (consent banner, auth hydration), not by this tool.
const ENV_ONLY = /\/cdn-cgi\/trace|\/api\/me/;
const badReq = [];
page.on('response', r => { if (r.status() >= 400 && !ENV_ONLY.test(r.url())) badReq.push(r.status() + ' ' + r.url()); });

await page.goto(`${BASE}/tools/post-hoc-calculator.html?fresh=${Date.now()}`, { waitUntil: 'networkidle' });

async function setRaw(labels, values, conf) {
  const text = labels.map((L, i) => `${L}, ${values[i]}`).join('\n');
  await page.click('.mode[data-mode="raw"]');
  await page.fill('#raw', text);
  await page.selectOption('#conf', String(conf));
  await page.waitForTimeout(120);
}
async function route(r) { await page.click(`.rt[data-route="${r}"]`); await page.waitForTimeout(90); }
async function rows() {
  return page.$$eval('#ptab tbody tr', trs => trs.map(tr =>
    Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim())));
}

// ---------------------------------------------------------------------------
// 1. Tukey: every rendered diff / CI / p adj vs R, across datasets + conf levels
// ---------------------------------------------------------------------------
const CONFS = ['0.90', '0.95', '0.99'];
const KEYS = ['balanced_k3', 'unbalanced_k4', 'plantgrowth', 'ties_likert_k3', 'chain_k4', 'null_k3', 'min_n2'];
for (const key of KEYS) {
  const c = T.cases[key];
  for (const cf of CONFS) {
    await setRaw(c.labels, c.values, cf);
    await route('tukey');
    const R = c.tukey[cf];
    const got = await rows();
    ok(got.length === R.length, `${key} ${cf} tukey row count`, `page=${got.length} R=${R.length}`);
    for (let i = 0; i < Math.min(got.length, R.length); i++) {
      const [pair, diff, ci, , padjTxt, verdict] = got[i];
      ok(pair === R[i].pair, `${key} ${cf} tukey pair[${i}]`, `page=${pair} R=${R[i].pair}`);
      near(num(diff), R[i].diff, 2e-4, `${key} ${cf} tukey diff ${pair}`);
      const m = ci.match(/\[([^,]+),\s*([^\]]+)\]/);
      if (ok(!!m, `${key} ${cf} tukey CI parses ${pair}`, ci)) {
        const half = R[i].upr - R[i].diff;
        ok(Math.abs(num(m[1]) - R[i].lwr) / half < 2e-4, `${key} ${cf} tukey lwr ${pair}`, `page=${m[1]} R=${R[i].lwr}`);
        ok(Math.abs(num(m[2]) - R[i].upr) / half < 2e-4, `${key} ${cf} tukey upr ${pair}`, `page=${m[2]} R=${R[i].upr}`);
      }
      ok(pCell(padjTxt) === pExpect(R[i].padj), `${key} ${cf} tukey padj ${pair}`,
         `page="${pCell(padjTxt)}" expected="${pExpect(R[i].padj)}" (R=${R[i].padj})`);
      // the verdict must follow the adjusted p at this alpha
      const alpha = 1 - parseFloat(cf);
      ok(/differ/.test(verdict) === (R[i].padj < alpha), `${key} ${cf} tukey verdict ${pair}`,
         `verdict="${verdict}" padj=${R[i].padj} alpha=${alpha}`);
    }
  }
}

// ---------------------------------------------------------------------------
// 2. Bonferroni + 3. Dunn at 95%
// ---------------------------------------------------------------------------
for (const key of KEYS) {
  const c = T.cases[key];
  await setRaw(c.labels, c.values, '0.95');

  await route('bonf');
  const bmap = {}; c.bonferroni.forEach(r => bmap[r.pair] = r);
  for (const r of await rows()) {
    const ref = bmap[r[0]];
    if (!ok(!!ref, `${key} bonf pair ${r[0]} exists in R`)) continue;
    ok(pCell(r[4]) === pExpect(ref.padj), `${key} bonf padj ${r[0]}`,
       `page="${pCell(r[4])}" expected="${pExpect(ref.padj)}"`);
  }

  await route('dunn');
  const dmap = {}; c.dunn.forEach(r => dmap[r.pair] = r);
  for (const r of await rows()) {
    const ref = dmap[r[0]];
    if (!ok(!!ref, `${key} dunn pair ${r[0]} exists in R`, JSON.stringify(Object.keys(dmap)))) continue;
    near(num(r[2]), ref.z, 1e-3, `${key} dunn z ${r[0]}`);
    ok(pCell(r[4]) === pExpect(ref.padj), `${key} dunn padj ${r[0]}`,
       `page="${pCell(r[4])}" expected="${pExpect(ref.padj)}"`);
  }
}

// ---------------------------------------------------------------------------
// 4. Letters display contract: share a letter <=> not significant
// ---------------------------------------------------------------------------
for (const key of KEYS) {
  const c = T.cases[key];
  await setRaw(c.labels, c.values, '0.95');
  await route('tukey');
  const letters = await page.$$eval('#letters .lrow', rs => rs.map(r => ({
    name: r.querySelector('.lname').textContent.trim(),
    letters: r.querySelector('.llet').textContent.trim()
  })));
  const map = {}; letters.forEach(l => map[l.name] = l.letters);
  ok(letters.length === c.levels.length, `${key} letters row count`, `page=${letters.length} R=${c.levels.length}`);
  for (const r of c.tukey['0.95']) {
    const [a, b] = [r.pair.split('-')[0], r.pair.split('-').slice(1).join('-')];
    if (map[a] === undefined || map[b] === undefined) { ok(false, `${key} letters has ${r.pair}`); continue; }
    const shares = map[a].split('').some(ch => map[b].indexOf(ch) >= 0);
    ok(shares !== (r.padj < 0.05), `${key} letters contract ${r.pair}`,
       `${a}=${map[a]} ${b}=${map[b]} padj=${r.padj}`);
  }
}

// ---------------------------------------------------------------------------
// 5. Summary mode vs the exact-moments reconstruction
// ---------------------------------------------------------------------------
for (const key of Object.keys(T.summaryMode)) {
  const s = T.summaryMode[key];
  await page.click('.mode[data-mode="summary"]');
  await page.waitForTimeout(80);
  // rebuild the rows to match this case
  const need = s.groupNames.length;
  let have = await page.$$eval('#sumrows .srow', r => r.length);
  while (have < need) { await page.click('#addrow'); have++; }
  while (have > need) { await page.click('#sumrows .srow:last-child .srm'); have--; }
  for (let i = 0; i < need; i++) {
    await page.fill(`#sumrows .srow:nth-child(${i + 1}) .s-name`, s.groupNames[i]);
    await page.fill(`#sumrows .srow:nth-child(${i + 1}) .s-mean`, String(s.mean[i]));
    await page.fill(`#sumrows .srow:nth-child(${i + 1}) .s-sd`, String(s.sd[i]));
    await page.fill(`#sumrows .srow:nth-child(${i + 1}) .s-n`, String(s.n[i]));
  }
  await page.selectOption('#conf', '0.95');
  await page.waitForTimeout(150);
  await route('tukey');
  const R = s.tukey['0.95'], got = await rows();
  ok(got.length === R.length, `${key} summary row count`, `page=${got.length} R=${R.length}`);
  for (let i = 0; i < Math.min(got.length, R.length); i++) {
    ok(got[i][0] === R[i].pair, `${key} summary pair[${i}]`, `page=${got[i][0]} R=${R[i].pair}`);
    near(num(got[i][1]), R[i].diff, 2e-4, `${key} summary diff ${R[i].pair}`);
    ok(pCell(got[i][4]) === pExpect(R[i].padj), `${key} summary padj ${R[i].pair}`,
       `page="${pCell(got[i][4])}" expected="${pExpect(R[i].padj)}"`);
  }
  // Dunn must be refused here, with a reason
  await route('dunn');
  const blocked = await page.$eval('#dunn-blocked', e => !e.hidden).catch(() => false);
  ok(blocked, `${key} summary blocks Dunn with an explanation`);
  const bodyHidden = await page.$eval('#routebody', e => e.hidden).catch(() => false);
  ok(bodyHidden, `${key} summary hides the pair table for Dunn`);
  await route('tukey');
}

// ---------------------------------------------------------------------------
// 5b. Mode switch must land on a WORKING tool, not an empty form.
// Regression: #sumrows started empty, so clicking "Group summaries" threw
// "needs at least three groups" and left the RAW mode's table + R code on
// screen, presenting one mode's numbers under the other mode's heading.
// ---------------------------------------------------------------------------
await page.reload({ waitUntil: 'networkidle' });
ok(await page.$$eval('#sumrows .srow', r => r.length) >= 3, 'summary form is pre-seeded on load');
await page.click('.mode[data-mode="summary"]');
await page.waitForTimeout(200);
ok(await page.$eval('#err', e => e.hidden), 'switching to summaries shows no error',
   await page.$eval('#err', e => e.textContent));
ok(await page.$$eval('#ptab tbody tr', r => r.length) >= 3, 'summaries render a pair table immediately');
{
  const code = await page.$eval('#rcode', e => e.textContent);
  ok(code.includes('scale(1:n)'), 'summaries emit the reconstruction R, not the raw-mode code', code.slice(0, 90));
  ok(!code.includes('21, 19.5'), 'summaries do not leave the raw preset data in the R code');
}
await page.click('.rt[data-route="bonf"]');
await page.waitForTimeout(150);
ok((await page.$eval('#rcode', e => e.textContent)).includes('pairwise.t.test('),
   'summary + Bonferroni emits pairwise.t.test, not TukeyHSD');
await page.click('.rt[data-route="tukey"]');
await page.click('.mode[data-mode="raw"]');
await page.waitForTimeout(150);

// ---------------------------------------------------------------------------
// 6. Error handling + recovery
// ---------------------------------------------------------------------------
await page.click('.mode[data-mode="raw"]');
await page.fill('#raw', 'total gibberish with no numbers at all');
await page.waitForTimeout(120);
ok(await page.$eval('#err', e => !e.hidden), 'junk paste shows an error');
const msg = await page.$eval('#err', e => e.textContent);
ok(msg.length > 20 && !/undefined|NaN|\[object/.test(msg), 'error message is human', msg);

await page.fill('#raw', 'A, 1\nA, 2\nB, 3\nB, 4');
await page.waitForTimeout(120);
ok(await page.$eval('#err', e => !e.hidden), 'two groups rejected');
ok(/three groups/i.test(await page.$eval('#err', e => e.textContent)), 'two-group message explains why');

await page.fill('#raw', 'A, 1\nA, 2\nB, 3\nB, 4\nC, 9\nC, 11');
await page.waitForTimeout(140);
ok(await page.$eval('#err', e => e.hidden), 'fixing the input clears the error');

// ---------------------------------------------------------------------------
// 7. Live wiring: R code + inference + report all track the route
// ---------------------------------------------------------------------------
const c0 = T.cases.balanced_k3;
await setRaw(c0.labels, c0.values, '0.95');
for (const [r, needle] of [['tukey', 'TukeyHSD('], ['bonf', 'pairwise.t.test('], ['dunn', 'dunnTest(']]) {
  await route(r);
  const code = await page.$eval('#rcode', e => e.textContent);
  ok(code.includes(needle), `R code shows ${needle} for route ${r}`, code.slice(0, 120));
  const inf = await page.$eval('#infline', e => e.textContent);
  ok(/Since/.test(inf) && inf.length > 40, `inference line present for ${r}`, inf);
  const rep = await page.$eval('#report', e => e.textContent);
  ok(/one-way ANOVA/i.test(rep) && rep.length > 60, `report line present for ${r}`, rep.slice(0, 80));
}
// the emitted R must pin the factor levels so it reproduces the displayed order
await route('tukey');
const code = await page.$eval('#rcode', e => e.textContent);
ok(/levels\s*=\s*c\(/.test(code), 'emitted R pins factor levels');
ok(code.includes('conf.level = 0.95'), 'emitted R carries the chosen conf level');
await page.selectOption('#conf', '0.99');
await page.waitForTimeout(120);
ok((await page.$eval('#rcode', e => e.textContent)).includes('conf.level = 0.99'), 'R code follows the conf level');

// ---------------------------------------------------------------------------
// 8. Health
// ---------------------------------------------------------------------------
ok(errors.length === 0, 'no page/console errors', errors[0] || '');
ok(badReq.length === 0, 'no failing requests (excluding CF-only endpoints)', badReq[0] || '');
await page.setViewportSize({ width: 390, height: 780 });
await page.waitForTimeout(400);
const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
ok(!overflow, 'no mobile overflow at 390px');

await browser.close();
console.log(`\n${fail === 0 ? 'PASS' : 'FAIL'}: ${pass}/${pass + fail} rendered checks`);
if (fail) { console.log('\nfailures:'); fails.forEach(f => console.log('  - ' + f)); process.exit(1); }
