// verify_lesson_webr.mjs - RUN a lesson's runnable R blocks in real WebR (headless
// chromium) and confirm they execute without error. This is the "actually tested"
// guarantee: the deterministic gate (lesson_quality_check.py) catches missing data +
// WebR-incompatible packages; THIS runs the code for real to catch syntax / runtime /
// wrong-column errors that only show up on execution.
//
//   node Scripts/verify_lesson_webr.mjs lessons/<slug>.md
//
// Blocks tested: every ```r block (NOT ```r-static, which is illustrative) that does
// not contain a ____ fill-in blank. They run in ONE shared WebR session, in order, so
// later blocks see earlier objects (matches the in-lesson Run experience). Packages in
// library()/require() are auto-installed. Exit 0 = all ran; 1 = a block errored; 2 = usage.
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';

const path = process.argv[2];
if (!path) { console.error('usage: node Scripts/verify_lesson_webr.mjs <lesson.md>'); process.exit(2); }
const body = readFileSync(path, 'utf8');

const blocks = [];
const re = /```r(?!-static)[^\n]*\n([\s\S]*?)```/g;
let m;
while ((m = re.exec(body))) { if (!m[1].includes('____')) blocks.push(m[1]); }
if (!blocks.length) { console.log('verify: no runnable R blocks (nothing to test).'); process.exit(0); }

const pkgs = [...new Set([...body.matchAll(/(?:library|require)\s*\(\s*["']?([A-Za-z0-9.]+)/g)].map(x => x[1]))]
  .filter(p => !['base', 'stats', 'graphics', 'grDevices', 'utils', 'datasets', 'methods'].includes(p));

// WebR refuses to init with an invalid base URL (about:blank / data: fail), so load a
// real https page first. Any https page works; a lesson page is guaranteed to allow the
// WebR module. Override with WEBR_BASE_URL if the preview branch alias changes.
const BASE_URL = process.env.WEBR_BASE_URL || 'https://lesson-mode-phase1.r-statistics-co.pages.dev/RF-Course-Lesson-1.html';
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' }).catch(() => {});
let failed = null;
try {
  await page.evaluate(async (pkgs) => {
    const mod = await import('https://webr.r-wasm.org/latest/webr.mjs');
    window.__w = new mod.WebR(); await window.__w.init();
    if (pkgs.length) await window.__w.installPackages(pkgs);
  }, pkgs);
  for (let i = 0; i < blocks.length; i++) {
    const res = await page.evaluate(async (code) => {
      const sh = await new window.__w.Shelter();
      try {
        const c = await sh.captureR(code, { withAutoprint: true, captureStreams: true });
        const errs = (c.output || []).filter(o => o.type === 'stderr' && /(^|\s)Error/.test(String(o.data)));
        sh.purge();
        return { ok: errs.length === 0, msg: errs.map(e => e.data).join(' | ') };
      } catch (e) { try { sh.purge(); } catch (_) {} return { ok: false, msg: String(e.message || e) }; }
    }, blocks[i]);
    if (!res.ok) { failed = { block: i + 1, msg: res.msg }; break; }
  }
} catch (e) { failed = { block: 0, msg: 'WebR init/install failed: ' + String(e.message || e) }; }
await browser.close();

if (failed) {
  console.error(`verify FAIL: ${path}`);
  console.error(`  runnable R block #${failed.block} errored: ${(failed.msg || '').slice(0, 240)}`);
  console.error('  Fix the code (self-contained data? right columns? WebR-compatible package?) or move it to a ```r-static illustrative block.');
  process.exit(1);
}
console.log(`verify OK: ${path} - all ${blocks.length} runnable R block(s) executed in WebR.`);
process.exit(0);
