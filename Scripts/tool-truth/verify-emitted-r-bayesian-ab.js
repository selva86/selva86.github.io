/* Gate: the R code the page emits must ACTUALLY RUN and produce exactly the
 * output its own #> comments claim.
 *
 * The #> lines are a formatting contract, not a vibe. This runs each emitted
 * block verbatim in real R (#> is already a comment, and Rscript auto-prints,
 * so nothing is injected) and diffs R's stdout against the claimed lines.
 *
 * Run with the local server up:
 *   node Scripts/tool-truth/verify-emitted-r-bayesian-ab.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const RSCRIPT = 'C:/Program Files/R/R-4.6.0/bin/Rscript.exe';
const BASE = process.argv[2] || 'http://127.0.0.1:8901';
const DIR = path.join(__dirname, '_emit');

const CASES = [
  { name: 'typical',     cA: 1200, nA: 10000, cB: 1260, nB: 10000, prior: '1,1' },
  { name: 'winner',      cA: 100,  nA: 10000, cB: 300,  nB: 10000, prior: '1,1' },
  { name: 'early',       cA: 8,    nA: 150,   cB: 12,   nB: 150,   prior: '1,1' },
  { name: 'deadheat',    cA: 1000, nA: 20000, cB: 1000, nB: 20000, prior: '1,1' },
  { name: 'losing',      cA: 300,  nA: 5000,  cB: 240,  nB: 5000,  prior: '1,1' },
  { name: 'strongprior', cA: 6,    nA: 20,    cB: 12,   nB: 20,    prior: 'custom', a0: 100, b0: 100 },
  { name: 'jeffreys',    cA: 30,   nA: 500,   cB: 45,   nB: 500,   prior: '0.5,0.5' },
  { name: 'zeroconv',    cA: 0,    nA: 100,   cB: 5,    nB: 100,   prior: '1,1' },
  { name: 'bign',        cA: 5000, nA: 100000, cB: 5150, nB: 100000, prior: '1,1' }
];

(async () => {
  fs.mkdirSync(DIR, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(BASE + '/tools/bayesian-ab-test-calculator.html', { waitUntil: 'networkidle' });

  // Playwright and a synchronous execFileSync(R) interleaved in one loop can
  // deadlock, so capture every block first, then run R.
  const blocks = [];
  for (const c of CASES) {
    await page.selectOption('#prior', c.prior);
    if (c.prior === 'custom') { await page.fill('#a0', String(c.a0)); await page.fill('#b0', String(c.b0)); }
    for (const k of ['cA', 'nA', 'cB', 'nB']) await page.fill('#' + k, String(c[k]));
    await page.waitForTimeout(420);
    blocks.push({
      name: c.name,
      code: await page.textContent('#rcodepre'),
      shown: {
        p: (await page.textContent('#v1')).trim(),
        lossB: (await page.textContent('#v2')).trim(),
        lossA: (await page.textContent('#v3')).trim()
      }
    });
  }
  await browser.close();

  let pass = 0, fail = 0;
  const fails = [];
  for (const b of blocks) {
    const file = path.join(DIR, b.name + '.R');
    fs.writeFileSync(file, b.code);
    let out;
    try {
      out = execFileSync(RSCRIPT, [file], { encoding: 'utf8', timeout: 120000 });
    } catch (e) {
      fail++; fails.push(`${b.name}: emitted R FAILED TO RUN: ${(e.stderr || e.message).slice(0, 300)}`);
      continue;
    }
    const claimed = b.code.split('\n').filter(l => l.startsWith('#> ')).map(l => l.slice(3).trimEnd());
    const actual = out.split('\n').map(l => l.trimEnd()).filter(l => l.length);
    if (claimed.length === 0) { fail++; fails.push(`${b.name}: no #> lines emitted`); continue; }
    if (claimed.length !== actual.length) {
      fail++; fails.push(`${b.name}: claims ${claimed.length} output lines, R printed ${actual.length}\n    claimed: ${JSON.stringify(claimed)}\n    actual:  ${JSON.stringify(actual)}`);
      continue;
    }
    claimed.forEach((c, i) => {
      if (c === actual[i]) pass++;
      else { fail++; fails.push(`${b.name} line ${i + 1}:\n    claimed: ${JSON.stringify(c)}\n    R said:  ${JSON.stringify(actual[i])}`); }
    });

    // and the emitted output must agree with what the panel displays
    const rp = /P\(B beats A\)\s+=\s+([0-9.]+)/.exec(out);
    if (rp) {
      const shownPct = parseFloat(b.shown.p);
      const fromR = parseFloat(rp[1]) * 100;
      if (Math.abs(shownPct - fromR) <= 0.05) pass++;
      else { fail++; fails.push(`${b.name}: panel shows P(B>A)=${b.shown.p} but emitted R yields ${fromR.toFixed(2)}%`); }
    }
  }

  console.log(`\nemitted-R check: ${pass} passed, ${fail} failed  (${blocks.length} blocks run in real R)`);
  if (fail) { console.log('\nFAILURES:'); fails.forEach(f => console.log('  ' + f)); process.exit(1); }
  console.log('ALL GREEN: every emitted block runs and every #> line matches R byte for byte');
})().catch(e => { console.error(e); process.exit(1); });
