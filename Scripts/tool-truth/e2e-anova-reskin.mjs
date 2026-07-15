// E2E for the reskinned ANOVA Output Interpreter (externalized engine).
// Verifies: engine globals resolve, per-scenario parse math matches expectations,
// live render + mode/type/scenario switching, rendered htmlKB, console errors,
// mobile 390 overflow. Run: node Scripts/tool-truth/e2e-anova-reskin.mjs [baseUrl]
import { chromium } from 'playwright';

const BASE = process.argv[2] || 'http://localhost:8250';
const URL = `${BASE}/tools/anova-output-interpreter.html?fresh=${Date.now()}`;
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('FAIL ' + m); } else console.log('ok   ' + m); };
const near = (a, b, t = 1e-4) => Math.abs(a - b) <= t * Math.max(1, Math.abs(b));

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const cerr = [], bad = [];
page.on('pageerror', e => cerr.push('pageerror: ' + String(e).slice(0, 160)));
page.on('console', m => { if (m.type() === 'error') cerr.push('console: ' + m.text().slice(0, 160)); });
page.on('response', r => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url()); });

const resp = await page.goto(URL, { waitUntil: 'load', timeout: 45000 });
ok(resp.status() === 200, 'HTTP 200');
await page.waitForTimeout(700);

// ---- engine globals + per-scenario parse math ----
const eng = await page.evaluate(() => {
  const g = {};
  g.hasFns = ['parseAnovaTable','loadScenario','setType','setAlpha','updateRCode','copyReport'].every(f => typeof window[f] === 'function');
  g.hasMath = !!(window.ANOVAMath && window.LMMath && window.TTestMath);
  g.hasScen = !!window.SCENARIOS;
  try {
    const P = k => window.parseAnovaTable(window.SCENARIOS[k].output);
    const o = P('oneway'), f = P('factorial'), t3 = P('type3'), ad = P('additive');
    g.oneway = { n: o.rows.length, ss: o.rows[0].ss, F: o.rows[0].F, dfResid: o.dfResid, eta2: o.rows[0].eta2, r2: o.r2, p: o.rows[0].p };
    g.factorial = { n: f.rows.length, suppSS: f.rows[0].ss, fmt: f.format, type: f.type, omega2: f.rows[0].omega2 };
    g.type3 = { intercept: !!t3.intercept, n: t3.rows.length, type: t3.type, cylSS: t3.rows[0].ss };
    g.additive = { p1: ad.rows[1].p, expP1: window.ANOVAMath.fPValue(ad.rows[1].F, ad.rows[1].df, ad.dfResid) };
  } catch (e) { g.err = String(e); }
  return g;
});
ok(eng.hasFns, 'engine global functions resolve');
ok(eng.hasMath, 'math libs loaded (ANOVAMath/LMMath/TTestMath)');
ok(eng.hasScen, 'SCENARIOS global present');
ok(!eng.err, 'parse ran without error ' + (eng.err || ''));
if (!eng.err) {
  ok(eng.oneway.n === 1, 'oneway: 1 term row');
  ok(near(eng.oneway.ss, 824.8), 'oneway: SS = 824.8 (got ' + eng.oneway.ss + ')');
  ok(near(eng.oneway.F, (824.8/2)/(301.3/29)), 'oneway: F recomputed (got ' + eng.oneway.F.toFixed(3) + ')');
  ok(eng.oneway.dfResid === 29, 'oneway: residual df = 29');
  ok(near(eng.oneway.eta2, 824.8/(824.8+301.3)), 'oneway: eta2 (got ' + eng.oneway.eta2.toFixed(4) + ')');
  ok(near(eng.oneway.r2, 1-301.3/(824.8+301.3)), 'oneway: R^2 (got ' + eng.oneway.r2.toFixed(4) + ')');
  ok(eng.oneway.p < 1e-6, 'oneway: p tiny (got ' + eng.oneway.p.toExponential(2) + ')');
  ok(eng.factorial.n === 3, 'factorial: 3 term rows');
  ok(near(eng.factorial.suppSS, 205.35), 'factorial: supp SS = 205.35');
  ok(eng.factorial.fmt === 'car' && eng.factorial.type === 'II', 'factorial: detected car / Type II');
  ok(isFinite(eng.factorial.omega2), 'factorial: omega2 finite');
  ok(eng.type3.intercept, 'type3: intercept parsed');
  ok(eng.type3.n === 2, 'type3: 2 term rows');
  ok(eng.type3.type === 'III', 'type3: type III');
  ok(near(eng.type3.cylSS, 349.79), 'type3: cyl SS = 349.79');
  ok(near(eng.additive.p1, eng.additive.expP1, 1e-9), 'additive: tension p matches ANOVAMath.fPValue');
}

// ---- live render of the default (oneway) scenario ----
const r0 = await page.evaluate(() => ({
  result: (document.getElementById('result-area').innerText || '').trim(),
  infer: (document.getElementById('inference-banner').innerText || '').trim(),
  rcode: (document.getElementById('r-code-rebuild').innerText || '').trim(),
  viz: document.querySelectorAll('#viz-svg rect').length,
}));
ok(r0.result.length > 20, 'default scenario renders result-area (' + r0.result.length + ' chars)');
ok(/inference|reject|significan|Since|p /i.test(r0.infer) || r0.infer.length > 10, 'inference banner has text');
ok(/aov|Anova|summary|mpg|cyl/i.test(r0.rcode), 'R code block populated');
ok(r0.viz >= 1, 'viz SVG has bars (' + r0.viz + ')');

// ---- switch scenario + type, verify recompute ----
await page.evaluate(() => window.loadScenario('factorial'));
await page.waitForTimeout(200);
const rf = await page.evaluate(() => (document.getElementById('result-area').innerText || '').trim());
ok(rf !== r0.result, 'switching to factorial re-renders result-area');

// setType sticks + syncs the banner select on a scenario with no format-forced Type
// (car::Anova/aov output carries its own Type and correctly overrides - tested separately).
const typeSync = await page.evaluate(() => {
  document.getElementById('paste-input').value = '';
  window.onPasteChange && window.onPasteChange();
  window.setType('III');
  const a = document.getElementById('banner-type-select').value;
  window.setType('I');
  const b = document.getElementById('banner-type-select').value;
  return { a, b };
});
ok(typeSync.a === 'III' && typeSync.b === 'I', 'setType syncs banner select (III then I)');

// ---- back to oneway, test alpha + copy ----
await page.evaluate(() => { window.loadScenario('oneway'); window.setAlpha(0.01); });
await page.waitForTimeout(150);
const alphaShown = await page.evaluate(() => (document.getElementById('banner-alpha') || {}).innerText);
ok(String(alphaShown) === '0.01', 'setAlpha(0.01) updates banner alpha (got ' + alphaShown + ')');

// ---- page health ----
const htmlKB = await page.evaluate(() => Math.round(document.documentElement.outerHTML.length / 1024));
ok(htmlKB <= 200, 'rendered htmlKB <= 200 (got ' + htmlKB + ')');

// /cdn-cgi/trace and /api/me are Cloudflare-only endpoints (absent on the local python
// server, present on the CF preview) - environmental. Any OTHER 4xx is a real regression.
const envRe = /cdn-cgi|\/api\/me|favicon/i;
const realBad = bad.filter(u => !envRe.test(u));
ok(realBad.length === 0, 'no non-environmental 4xx ' + (realBad.length ? '-> ' + realBad[0] : '(env-only: ' + bad.length + ')'));
// console errors: drop generic resource-load 404s (they map to the env endpoints above)
const realErrs = cerr.filter(e => !/Failed to load resource|cloudflareinsights|beacon|googletagmanager|google-analytics|ERR_BLOCKED|favicon/i.test(e));
ok(realErrs.length === 0, 'no JS console/page errors ' + (realErrs.length ? '-> ' + realErrs[0] : ''));

await page.setViewportSize({ width: 390, height: 780 });
await page.waitForTimeout(400);
const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
ok(!overflow, 'no mobile 390 horizontal overflow');

console.log('\nhtmlKB=' + htmlKB + '  consoleErrs=' + realErrs.length + '  ' + (fails ? fails + ' FAIL' : 'ALL PASS'));
await browser.close();
process.exit(fails ? 1 : 0);
