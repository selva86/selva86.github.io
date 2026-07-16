/* Runs the R that tools/acf-pacf-calculator.html EMITS, verbatim, in real R, and
   checks every "#>" claim against what R actually printed.

   WHY: the emitted block is a promise that this code reproduces the page. A "#>"
   that R would never print is a false claim, and precision is part of it -
   Box.test prints its statistic through format(digits = 5) and its p through
   format.pval(digits = 4), so "X-squared = 1469.8818" is wrong where R says
   "1469.9". Caught exactly this way on 2026-07-16.

   Usage: node Scripts/tool-truth/verify-acf-emitted-r.js [baseURL]  */
'use strict';
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const BASE = process.argv[2] || 'http://localhost:8901';
const RSCRIPT = 'C:/Program Files/R/R-4.6.0/bin/Rscript.exe';
const OUT = fs.mkdtempSync(path.join(os.tmpdir(), 'acfr-'));

const COMBOS = [
  ['air', 'none'], ['air', 'diff1'], ['air', 'diff2'], ['air', 'sdiff12'],
  ['nile', 'none'], ['nile', 'diff2'], ['lynx', 'diff1'],
  ['ar1', 'none'], ['ma1', 'none'], ['wn', 'none']
];

let pass = 0, fail = 0;
const fails = [];
function ok(name, cond, detail) {
  if (cond) pass++; else { fail++; fails.push(name + (detail ? '\n      ' + detail : '')); }
}

(async () => {
  // 1. harvest the emitted blocks from the live page
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(BASE + '/tools/acf-pacf-calculator.html', { waitUntil: 'networkidle' });
  const blocks = [];
  for (const [preset, mode] of COMBOS) {
    await page.click(`.chip[data-preset="${preset}"]`);
    await page.waitForTimeout(60);
    await page.click(`.mode[data-mode="${mode}"]`);
    await page.waitForTimeout(80);
    blocks.push({
      preset, mode,
      code: await page.$eval('#rcode', e => e.textContent),
      band: await page.$$eval('.st', els => {
        const e = els.find(x => x.querySelector('.sk').textContent.trim() === 'Significance band');
        return e ? e.querySelector('.sv').textContent.trim() : '';
      })
    });
  }
  await browser.close();

  // 2. run each block in real R. Playwright and a synchronous execFileSync(R)
  //    interleaved will hang, so the browser is closed FIRST and R runs after.
  for (const b of blocks) {
    const tag = `${b.preset}/${b.mode}`;
    const file = path.join(OUT, `${b.preset}_${b.mode}.R`);
    fs.writeFileSync(file, b.code + '\n');
    let out;
    try {
      out = execFileSync(RSCRIPT, ['--vanilla', file], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (e) {
      ok(`${tag} emitted R runs`, false, String(e.stderr || e).slice(0, 300));
      continue;
    }
    ok(`${tag} emitted R runs clean`, true);

    // ---- the ACF "#>" line: every value R printed must appear, in order
    const acfClaim = (b.code.match(/^#> ([\d.\- ]+)(?: \.\.\..*)?$/m) || [])[1];
    if (acfClaim) {
      const claimed = acfClaim.trim().split(/\s+/);
      // R wraps the vector across lines with "[n]" index prefixes; strip them
      const printed = (out.match(/^\s*\[\d+\][^\n]*/gm) || []).join(' ')
        .replace(/\[\d+\]/g, ' ').trim().split(/\s+/).filter(s => /^[-\d.]+$/.test(s));
      const truncated = /\.\.\. \(\d+ more\)/.test(b.code);
      if (!truncated) {
        ok(`${tag} acf #> count`, claimed.length <= printed.length,
           `claimed ${claimed.length}, R printed ${printed.length}`);
      }
      let mismatch = null;
      for (let i = 0; i < claimed.length; i++) {
        if (printed[i] !== claimed[i]) { mismatch = `lag ${i}: #> says ${claimed[i]}, R printed ${printed[i]}`; break; }
      }
      ok(`${tag} acf #> matches R's output`, mismatch === null, mismatch);
    } else {
      ok(`${tag} acf #> present`, false);
    }

    // ---- the band "#>" line vs R's qnorm()/sqrt(n)
    const bandClaim = (b.code.match(/qnorm\([\d.]+\)\/sqrt\(\d+\)\n#> ([\d.]+)/) || [])[1];
    const bandPrinted = (out.match(/^\[1\] ([\d.]+)\s*$/m) || [])[1];
    ok(`${tag} band #> matches R`, bandClaim && bandPrinted && bandClaim === bandPrinted,
       `#> ${bandClaim} vs R ${bandPrinted}`);
    // and the band R prints must be the one the page displays
    if (bandPrinted) {
      const shown = parseFloat(String(b.band).replace(/[^\d.]/g, ''));
      ok(`${tag} displayed band == R's band`, Math.abs(shown - parseFloat(bandPrinted)) <= 6e-4,
         `page ${shown} vs R ${bandPrinted}`);
    }

    // ---- the Box.test "#>" line vs print.htest, character for character
    const btClaim = (b.code.match(/^#> (X-squared = .*)$/m) || [])[1];
    const btPrinted = (out.match(/^(X-squared = .*)$/m) || [])[1];
    ok(`${tag} Box.test #> matches R exactly`, btClaim && btPrinted && btClaim.trim() === btPrinted.trim(),
       `#> "${btClaim}"\n      R  "${btPrinted}"`);
  }

  console.log(`\nEmitted-R verification (run verbatim in R 4.6.0): ${pass} passed, ${fail} failed`);
  if (fails.length) { console.log('\nFAILURES:'); fails.forEach(f => console.log('  ' + f)); }
  process.exit(fail ? 1 : 0);
})();
