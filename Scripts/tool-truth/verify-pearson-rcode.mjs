/* Rubric 6: the emitted R code must ACTUALLY run in R and reproduce the
   displayed result. Scrapes the page's own R block for several states, runs
   each in real R, and compares R's printed output to the #> comments the page
   wrote next to it.
   Usage: node Scripts/tool-truth/verify-pearson-rcode.mjs [baseUrl] */
import { chromium } from 'playwright';
import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const BASE = process.argv[2] || 'http://127.0.0.1:8899';
const RSCRIPT = 'C:\\Program Files\\R\\R-4.6.0\\bin\\Rscript.exe';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`${BASE}/tools/pearson-critical-values-table.html?fresh=${Date.now()}`, { waitUntil: 'networkidle' });

const states = [
  { mode: 'test', n: 30, r: 0.42, tails: 'two', alpha: '0.05' },
  { mode: 'test', n: 12, r: 0.55, tails: 'two', alpha: '0.01' },
  { mode: 'test', n: 10, r: 0.30, tails: 'right', alpha: '0.05' },
  { mode: 'test', n: 50, r: -0.40, tails: 'left', alpha: '0.02' },
  { mode: 'test', n: 32, r: -0.8676594, tails: 'two', alpha: '0.05' },
  { mode: 'lookup', n: 30, tails: 'two', alpha: '0.05' },
  { mode: 'lookup', n: 12, tails: 'right', alpha: '0.10' },
  { mode: 'plan', r: 0.30, tails: 'two', alpha: '0.05' },
];

let pass = 0, fail = 0;
for (const st of states) {
  await page.selectOption('#iwantsel', st.mode);
  await page.click(`.tab[data-tails="${st.tails}"]`);
  await page.selectOption('#alpha', st.alpha);
  if (st.n !== undefined) await page.fill('#n', String(st.n));
  if (st.r !== undefined) await page.fill('#r', String(st.r));
  await page.waitForTimeout(80);

  const code = await page.textContent('#rcodepre');
  // The #> lines are the page's claim about what R prints. Strip them, run the
  // rest, and compare R's real output to those claims in order.
  const claims = [...code.matchAll(/^#> (.+)$/gm)].map(m => m[1].trim());
  const runnable = code.split('\n').filter(l => !l.trim().startsWith('#>')).join('\n');

  const tmp = path.join(os.tmpdir(), `pearson-rcode-${Math.abs(hash(JSON.stringify(st)))}.R`);
  fs.writeFileSync(tmp, runnable, 'utf8');
  let out;
  try {
    out = execFileSync(RSCRIPT, [tmp], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    console.log(`FAIL ${JSON.stringify(st)}: R errored\n${e.stderr || e.message}`);
    fail++; continue;
  }
  // R echoes each auto-printed value as "[1] <value>"
  const printed = [...out.matchAll(/^\[1\]\s+(.+)$/gm)].map(m => m[1].trim());
  const tag = `${st.mode} n=${st.n ?? '-'} r=${st.r ?? '-'} ${st.tails} a=${st.alpha}`;
  if (printed.length !== claims.length) {
    console.log(`FAIL ${tag}: ${claims.length} #> claims but R printed ${printed.length}`);
    console.log('  claims:', claims, '\n  printed:', printed);
    fail++; continue;
  }
  let bad = 0;
  claims.forEach((c, i) => { if (c !== printed[i]) { bad++; console.log(`FAIL ${tag}: #> ${c} but R printed ${printed[i]}`); } });
  if (bad) fail++; else { pass++; console.log(`ok   ${tag}  (${claims.length} values reproduced exactly)`); }
  fs.unlinkSync(tmp);
}
function hash(s) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return h; }

await browser.close();
console.log(`\nemitted-R verification: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
