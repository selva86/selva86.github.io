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
// library()/require() are auto-installed. Exit 0 = all ran; 1 = a block errored OR hung
// past its timeout; 2 = usage.
//
// Hang protection (so one bad block can never wedge the verifier - and the batch - forever):
//   - per-block timeout     WEBR_BLOCK_TIMEOUT_MS   (default 90000  = 90s)
//   - init+install timeout  WEBR_INIT_TIMEOUT_MS    (default 180000 = 3 min)
//   - overall hard deadline WEBR_OVERALL_TIMEOUT_MS (default 900000 = 15 min) -> process.exit(1)
// A timed-out block is reported by number as "HUNG" so the author knows exactly which one
// to cap or move to ```r-static.
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';

const BLOCK_MS = Number(process.env.WEBR_BLOCK_TIMEOUT_MS || 90000);
const INIT_MS = Number(process.env.WEBR_INIT_TIMEOUT_MS || 180000);
const OVERALL_MS = Number(process.env.WEBR_OVERALL_TIMEOUT_MS || 900000);

// Race a promise against a timer so a never-resolving page.evaluate cannot hang us.
function withTimeout(promise, ms, label) {
  promise.catch(() => {});  // swallow a late rejection that arrives after we already timed out
  let t;
  const timer = new Promise((_, reject) => {
    t = setTimeout(() => reject(new Error(`no result in ${Math.round(ms / 1000)}s (${label})`)), ms);
  });
  return Promise.race([promise, timer]).finally(() => clearTimeout(t));
}

const path = process.argv[2];
if (!path) { console.error('usage: node Scripts/verify_lesson_webr.mjs <lesson.md>'); process.exit(2); }
const body = readFileSync(path, 'utf8');

const blocks = [];
const re = /```r(?!-static)[^\n]*\n([\s\S]*?)```/g;
let m;
while ((m = re.exec(body))) { if (!m[1].includes('____')) blocks.push(m[1]); }
if (!blocks.length) { console.log('verify: no runnable R blocks (nothing to test).'); process.exit(0); }

// Ultimate backstop: if anything below wedges (a block, init, even browser.close or a
// CDP deadlock), force-exit so the caller is never blocked. .unref() so the timer never
// holds the process open on its own when the normal path finishes first.
const hardKill = setTimeout(() => {
  console.error(`verify FAIL: ${path}`);
  console.error(`  overall WebR verification exceeded ${Math.round(OVERALL_MS / 1000)}s - treating the lesson as hung.`);
  console.error('  Find the slow/looping block and cap it (tiny data, setDTthreads(1), no infinite loop) or move it to a ```r-static block.');
  process.exit(1);
}, OVERALL_MS);
hardKill.unref();

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
  await withTimeout(page.evaluate(async (pkgs) => {
    const mod = await import('https://webr.r-wasm.org/latest/webr.mjs');
    window.__w = new mod.WebR(); await window.__w.init();
    if (pkgs.length) await window.__w.installPackages(pkgs);
  }, pkgs), INIT_MS, 'WebR init + package install');

  for (let i = 0; i < blocks.length; i++) {
    let res;
    try {
      res = await withTimeout(page.evaluate(async (code) => {
        const sh = await new window.__w.Shelter();
        try {
          const c = await sh.captureR(code, { withAutoprint: true, captureStreams: true });
          const errs = (c.output || []).filter(o => o.type === 'stderr' && /(^|\s)Error/.test(String(o.data)));
          sh.purge();
          return { ok: errs.length === 0, msg: errs.map(e => e.data).join(' | ') };
        } catch (e) { try { sh.purge(); } catch (_) {} return { ok: false, msg: String(e.message || e) }; }
      }, blocks[i]), BLOCK_MS, `R block #${i + 1}`);
    } catch (e) {
      // The block never returned within BLOCK_MS -> it hung the verifier.
      failed = { block: i + 1, msg: String(e.message || e), hung: true };
      break;
    }
    if (!res.ok) { failed = { block: i + 1, msg: res.msg }; break; }
  }
} catch (e) {
  failed = { block: 0, msg: 'WebR init/install failed or timed out: ' + String(e.message || e) };
}
await withTimeout(browser.close(), 15000, 'browser.close').catch(() => {});
clearTimeout(hardKill);

if (failed) {
  console.error(`verify FAIL: ${path}`);
  if (failed.hung) {
    console.error(`  runnable R block #${failed.block} HUNG: ${failed.msg}.`);
    console.error('  A block that never returns is almost always an infinite loop, an interactive prompt, or a WebR-incompatible op (e.g. multi-threaded data.table - use setDTthreads(1) on tiny data). Cap/fix it or move it to a ```r-static illustrative block.');
  } else if (failed.block === 0) {
    console.error(`  ${failed.msg}`);
  } else {
    console.error(`  runnable R block #${failed.block} errored: ${(failed.msg || '').slice(0, 240)}`);
    console.error('  Fix the code (self-contained data? right columns? WebR-compatible package?) or move it to a ```r-static illustrative block.');
  }
  process.exit(1);
}
console.log(`verify OK: ${path} - all ${blocks.length} runnable R block(s) executed in WebR.`);
process.exit(0);
