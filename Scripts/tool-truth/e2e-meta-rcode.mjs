/* Takes the R code the page emits, runs it in real R, and checks the numbers
   R prints back match what the page displays. Rubric item 6. */
import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
import { execFileSync } from 'child_process';
const BASE = process.argv[2] || 'http://127.0.0.1:8237';
const RSCRIPT = 'C:/Program Files/R/R-4.6.0/bin/Rscript.exe';
const b = await chromium.launch();
const page = await (await b.newContext()).newPage();
await page.goto(`${BASE}/tools/meta-analysis-quick-tool.html?fresh=${Date.now()}`, { waitUntil: 'load' });
await page.waitForTimeout(600);
let fail = 0;
const CASES = [
  ['es 95', 'es', 'Ahmed 2018, 0.10, 0.12\nBrown 2019, 0.85, 0.14\nChen 2020, 0.22, 0.10\nDuval 2021, 1.10, 0.16\nEllis 2022, 0.45, 0.13', '95', false],
  ['es 99', 'es', 'Abrams 2019, 0.32, 0.12\nBennett 2020, 0.28, 0.15\nCho 2020, 0.41, 0.18\nDiaz 2021, 0.35, 0.10\nEgan 2022, 0.30, 0.14', '99', false],
  ['counts 95', 'counts', 'Trial A, 12, 100, 20, 100\nTrial B, 8, 80, 15, 85\nTrial C, 25, 150, 33, 145\nTrial D, 5, 60, 9, 58', '95', true],
  ['counts zero-cell', 'counts', 'Small trial, 0, 25, 5, 25\nMid trial, 8, 40, 12, 38\nLarge trial, 3, 30, 7, 32', '95', true],
];
for (const [name, mode, text, lev, isOR] of CASES) {
  await page.click(`.mode[data-mode="${mode}"]`);
  await page.fill('#paste', text);
  await page.selectOption('#lev', lev);
  await page.waitForTimeout(180);
  const code = await page.$eval('#rcodepre', e => e.textContent);
  // page's own displayed pooled values
  const shown = await page.evaluate(() => {
    const g = w => { const tr = [...document.querySelectorAll('#pertbl tr.pool')].find(r => r.cells[0].textContent.includes(w));
      return Number(tr.cells[tr.cells.length - 4].textContent.trim()); };
    return { fe: g('Fixed-effect'), re: g('Random-effects') };
  });
  // run the emitted code verbatim, then print the two pooled estimates
  const probe = code.replace(/^# forest plot[\s\S]*$/m, '') + `
cat("FE=", coef(fe), " RE=", coef(re), "\n", sep="")`;
  writeFileSync('Scripts/tool-truth/_rcode_probe.R', probe);
  let out;
  try { out = execFileSync(RSCRIPT, ['Scripts/tool-truth/_rcode_probe.R'], { encoding: 'utf8' }); }
  catch (e) { console.log(`FAIL ${name}: emitted R code did not run\n${String(e.stderr).slice(0, 400)}`); fail++; continue; }
  const m = out.match(/FE=([-\d.e+]+) RE=([-\d.e+]+)/);
  if (!m) { console.log(`FAIL ${name}: no output (${out.slice(0, 200)})`); fail++; continue; }
  const tf = v => isOR ? Math.exp(v) : v;           // page shows counts as odds ratios
  const rFE = tf(Number(m[1])), rRE = tf(Number(m[2]));
  const okFE = Math.abs(rFE - shown.fe) < 0.0006, okRE = Math.abs(rRE - shown.re) < 0.0006;
  console.log(`${okFE && okRE ? 'PASS' : 'FAIL'} ${name}: R FE=${rFE.toFixed(4)} vs page ${shown.fe}; R RE=${rRE.toFixed(4)} vs page ${shown.re}`);
  if (!(okFE && okRE)) fail++;
}
await b.close();
console.log(fail ? `\n${fail} FAILED` : '\nemitted R code runs and reproduces the page');
process.exit(fail ? 1 : 0);
