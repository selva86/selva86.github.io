import { chromium } from 'playwright';
const BASE = process.argv[2] || 'http://127.0.0.1:8237';
const URL = `${BASE}/tools/vif-interpreter.html?fresh=${Date.now()}`;
let pass = 0, fail = 0;
const errs = [];
function ok(name, cond, got) { if (cond) pass++; else { fail++; console.log(`FAIL ${name}` + (got !== undefined ? ` (got ${got})` : '')); } }
function near(name, got, want, dp = 2) { const g = Number(got).toFixed(dp), w = Number(want).toFixed(dp); ok(`${name} ~ ${want}`, g === w, got); }

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
page.on('pageerror', e => errs.push('pageerror: ' + String(e).slice(0, 160)));
page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 160)); });

// read the results table into {name -> {vif, tol, se, flag, dropped}}
async function rows() {
  return await page.evaluate(() => {
    const out = {};
    document.querySelectorAll('#vrows tr').forEach(tr => {
      const nameCell = tr.querySelector('td.name');
      if (!nameCell) return;
      const nums = [...tr.querySelectorAll('td.num')].map(td => td.textContent.trim());
      const flag = tr.querySelector('.fl') ? tr.querySelector('.fl').textContent.trim() : '';
      out[nameCell.textContent.trim()] = { vif: nums[0], tol: nums[1], se: nums[2], flag, dropped: tr.classList.contains('dropped') };
    });
    return out;
  });
}
const stat = id => page.$eval('#' + id, e => e.textContent.trim());
const txt = id => page.$eval('#' + id, e => e.innerText.trim());
const rcode = () => page.$eval('#rcodepre', e => e.textContent);

await page.goto(URL, { waitUntil: 'load', timeout: 45000 });
await page.waitForTimeout(700);

// ---- 1. DEFAULT paint: mtcars 4-predictor raw data ----
let r = await rows();
near('default disp VIF', r.disp.vif, 10.3733);
near('default wt VIF', r.wt.vif, 4.848);
near('default hp VIF', r.hp.vif, 3.406);
near('default cyl VIF', r.cyl.vif, 6.7377);
near('default cond', await stat('ocond'), 7.2164);
ok('default max stat', (await stat('omax')) === '10.37', await stat('omax'));
ok('default verdict severe', (await txt('vhead')).toLowerCase().includes('severe'), await txt('vhead'));
ok('default disp flag red', r.disp.flag.includes('Severe'), r.disp.flag);
ok('default predictors 4/4', (await stat('ok')) === '4 / 4', await stat('ok'));
ok('default rcode has car::vif', (await rcode()).includes('vif(lm(y ~'), '');
ok('default guide suggests disp', (await txt('guide')).includes('disp'), await txt('guide'));

// ---- 2. DROP disp via checkbox -> remaining VIFs recompute ----
await page.uncheck('input.dchk[data-name="disp"]');
await page.waitForTimeout(200);
r = await rows();
ok('disp row dropped', r.disp.dropped === true, JSON.stringify(r.disp));
near('after-drop wt VIF', r.wt.vif, 2.5805);
near('after-drop hp VIF', r.hp.vif, 3.2585);
near('after-drop cyl VIF', r.cyl.vif, 4.7575);
ok('after-drop verdict fine/low', (await txt('vhead')).toLowerCase().includes('fine'), await txt('vhead'));
ok('after-drop predictors 3/4', (await stat('ok')) === '3 / 4', await stat('ok'));
ok('after-drop report notes drop', (await stat('report')).includes('after dropping disp'), await stat('report'));
ok('after-drop guide clear', (await txt('guide')).toLowerCase().includes('nothing more to drop'), await txt('guide'));
// re-check disp back on
await page.check('input.dchk[data-name="disp"]');
await page.waitForTimeout(150);
r = await rows();
ok('recheck disp restores', r.disp.dropped === false && Number(r.disp.vif).toFixed(2) === '10.37', JSON.stringify(r.disp));

// ---- 3. Greedy "Apply this drop" ----
await page.click('#gapply');
await page.waitForTimeout(200);
r = await rows();
ok('apply dropped disp', r.disp.dropped === true, JSON.stringify(r.disp));
ok('apply verdict fine', (await txt('vhead')).toLowerCase().includes('fine'), await txt('vhead'));
// reset
await page.click('#greset');
await page.waitForTimeout(150);
r = await rows();
ok('reset restores all', r.disp.dropped === false, JSON.stringify(r.disp));

// ---- 4. Clean-set chip: all VIFs low ----
await page.click('.chip[data-scen="clean"]');
await page.waitForTimeout(200);
r = await rows();
near('clean wt VIF', r.wt.vif, 2.4830);
near('clean qsec VIF', r.qsec.vif, 1.3643);
near('clean am VIF', r.am.vif, 2.5414);
ok('clean verdict fine', (await txt('vhead')).toLowerCase().includes('fine'), await txt('vhead'));

// ---- 5. Correlation-matrix mode ----
await page.click('.chip[data-scen="cormat"]');
await page.waitForTimeout(200);
r = await rows();
near('cor wt VIF', r.wt.vif, 4.8446);
near('cor hp VIF', r.hp.vif, 2.7366);
near('cor disp VIF', r.disp.vif, 7.3245);
near('cor cond', await stat('ocond'), 5.4695);
ok('cor rcode diag(solve', (await rcode()).includes('diag(solve(R))'), '');

// ---- 6. Interpret-values mode (no toggles) ----
await page.click('.chip[data-scen="vals"]');
await page.waitForTimeout(200);
r = await rows();
near('vals wt VIF', r.wt.vif, 4.8446);
near('vals disp VIF', r.disp.vif, 7.3245);
ok('vals no keep column', (await page.$('input.dchk')) === null, 'has dchk');
ok('vals guide hidden', await page.$eval('#guide', e => e.hidden), '');

// ---- 7. GVIF table ----
await page.click('.chip[data-scen="gvif"]');
await page.waitForTimeout(200);
r = await rows();
near('gvif cylf comparable', r.cylf.vif, 2.2596);
near('gvif wt comparable', r.wt.vif, 2.5809);

// ---- 8. iris raw data (paste) ----
await page.click('.mode[data-mode="data"]');
await page.waitForTimeout(100);
const iris = 'Sepal.Width\tPetal.Length\tPetal.Width\n' + await page.evaluate(() => '');
// build iris data string from truth JSON at test time instead:
const fs = await import('fs');
const truth = JSON.parse(fs.readFileSync('Scripts/tool-truth/vif-interpreter.json', 'utf8'));
const irisCase = truth.find(t => t.id === 'raw_iris_3');
let irisText = irisCase.names.join('\t') + '\n' + irisCase.data.map(row => row.join('\t')).join('\n');
await page.fill('#datain', irisText);
await page.waitForTimeout(250);
r = await rows();
near('iris Sepal.Width VIF', r['Sepal.Width'].vif, 1.2708);
near('iris Petal.Length VIF', r['Petal.Length'].vif, 15.0976);
near('iris Petal.Width VIF', r['Petal.Width'].vif, 14.2343);
near('iris cond', await stat('ocond'), 7.9998);

// ---- 9. Singular / perfect collinearity (duplicate column) ----
await page.fill('#datain', 'x1\tx2\tx3\n1\t1\t5\n2\t2\t3\n3\t3\t9\n4\t4\t2\n5\t5\t7\n6\t6\t1');
await page.waitForTimeout(250);
ok('singular verdict', (await txt('vhead')).toLowerCase().includes('perfect collinearity'), await txt('vhead'));
ok('singular callout aliased', (await txt('callout')).toLowerCase().includes('singular'), await txt('callout'));

// ---- 10. Non-numeric column rejected ----
await page.fill('#datain', 'age\tcity\n20\tParis\n30\tLyon\n40\tNice');
await page.waitForTimeout(200);
ok('non-numeric error shown', await page.$eval('#ierr', e => e.classList.contains('show') && /text, not numbers/.test(e.textContent)), await txt('ierr'));

// ---- 11. Threshold change recolors ----
await page.click('.chip[data-scen="clean"]');
await page.waitForTimeout(150);
await page.fill('#low', '2');
await page.waitForTimeout(150);
r = await rows();
ok('low threshold flags qsec? (2.48>=2 moderate)', r.wt.flag.includes('Moderate') || r.am.flag.includes('Moderate'), JSON.stringify({wt:r.wt.flag,am:r.am.flag}));

// ---- 11b. copy buttons (externalized engine + inline copy handlers) ----
await ctx.grantPermissions(['clipboard-read', 'clipboard-write']);
await page.click('.chip[data-scen="collinear"]');
await page.waitForTimeout(150);
await page.click('#copybtn');
await page.waitForTimeout(120);
ok('copy report confirms', (await page.$eval('#copybtn', e => e.textContent)).includes('Copied'), '');
const clip = await page.evaluate(() => navigator.clipboard.readText());
ok('clipboard has report', /VIF: max/.test(clip), clip.slice(0, 40));

// ---- 12. mobile overflow + htmlKB + console ----
const htmlKB = await page.evaluate(() => Math.round(document.documentElement.outerHTML.length / 1024));
ok(`htmlKB ${htmlKB} <= 200`, htmlKB <= 200, htmlKB);
await page.setViewportSize({ width: 390, height: 780 });
await page.waitForTimeout(300);
const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
ok('no mobile 390 overflow', !overflow, overflow);
// /api/me + /cdn-cgi/trace only exist on the Cloudflare deploy, so 404 on localhost (environmental)
const realErrs = errs.filter(e => !/cloudflareinsights|beacon|googletagmanager|google-analytics|ERR_BLOCKED|ERR_FAILED|favicon|\/api\/me|cdn-cgi\/trace|404/i.test(e));
ok('no console errors', realErrs.length === 0, realErrs.join(' | '));

await browser.close();
console.log(`\n${pass} PASS / ${fail} FAIL  (htmlKB=${htmlKB})`);
process.exit(fail ? 1 : 0);
