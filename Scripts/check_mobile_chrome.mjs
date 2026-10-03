// Mobile chrome check: the sitewide navbar and the lesson top bar must fit on
// one row at every phone, foldable and tablet width (280px Fold cover screen
// up to 1024px). Run after any change to www/site-nav.css, www/lesson-mode.css
// or the lesson top-bar markup in www/lesson-mode.js, against the branch
// preview before merging.
// Usage: node Scripts/check_mobile_chrome.mjs [baseUrl]
// Exit 0 = every page fits at every width; 1 = a finding (printed).
import { chromium } from 'playwright';

const BASE = (process.argv[2] || 'https://r-statistics.co').replace(/\/$/, '');
const PAGES = [
  '/Temporal-Fusion-Transformers.html',   // lesson (step player top bar)
  '/Linear-Regression.html',              // tutorial
  '/',                                    // homepage
  '/roadmap/',                            // roadmap family (own nav.nav markup)
  '/exercises/',                          // generated index
  '/pricing.html',
];
const WIDTHS = [280, 300, 320, 344, 360, 375, 390, 412, 430, 480, 540, 600, 673, 717, 768, 820, 884, 960, 1024];
const ts = Date.now();

const browser = await chromium.launch();
let fails = 0;
for (const path of PAGES) {
  for (const w of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 800 }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.goto(`${BASE}${path}${path.includes('?') ? '&' : '?'}fresh=${ts}`, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(600);
    const f = await page.evaluate(() => {
      const out = [];
      const cw = document.documentElement.clientWidth;
      // Visible = laid out, not visibility:hidden, and no ancestor at opacity 0
      // (closed dropdowns such as the account menu are faded out, not removed).
      const vis = e => {
        if (!e || !e.getClientRects().length || getComputedStyle(e).visibility === 'hidden') return false;
        for (let a = e; a && a !== document.body; a = a.parentElement) if (getComputedStyle(a).opacity === '0') return false;
        return true;
      };
      const box = s => { const e = document.querySelector(s); return vis(e) ? e.getBoundingClientRect() : null; };
      const nav = document.querySelector('.sitenav, nav.nav');
      if (nav) {
        for (const e of nav.querySelectorAll('a, button, input')) {
          if (!vis(e)) continue;
          const r = e.getBoundingClientRect();
          if (r.width && (r.right > cw + 1 || r.left < -1)) out.push(`nav item off-screen: ${(e.textContent || e.getAttribute('aria-label') || e.tagName).trim().slice(0, 20)} (${Math.round(r.left)}..${Math.round(r.right)})`);
        }
        const links = box('.sitenav .snav-links, nav.nav .links'), burger = box('.snav-burger');
        if (links && burger) out.push('nav links and burger both visible');
        const nb = nav.getBoundingClientRect();
        if (nav.matches('.sitenav') && cw < 1024 && (nb.left > 1 || nb.right < cw - 1)) out.push(`navbar not full width (${Math.round(nb.left)}..${Math.round(nb.right)})`);
      }
      const top = box('.lm-top');
      if (top) {
        if (top.height > 60) out.push(`lesson bar is ${Math.round(top.height)}px tall (wrapped)`);
        for (const s of ['.lm-stepn', '.lm-cert', '.lm-fs', '.lm-rail-toggle', '.lm-exit']) {
          const r = box(s);
          if (!r) continue;
          if (r.right > cw + 1) out.push(`${s} off-screen (right ${Math.round(r.right)})`);
          // one line is ~20px for the counter and ~36px for the button; a wrap adds a line
          if ((s === '.lm-stepn' && r.height > 28) || (s === '.lm-cert' && r.height > 44)) out.push(`${s} wraps (${Math.round(r.height)}px)`);
        }
      }
      if (document.documentElement.scrollWidth > cw + 1) out.push(`page scrolls sideways (${document.documentElement.scrollWidth} > ${cw})`);
      return out;
    });
    if (f.length) { fails += f.length; console.log(`FAIL ${path} @${w}px: ${f.join('; ')}`); }
    await ctx.close();
  }
  console.log(`checked ${path}`);
}
await browser.close();
console.log(fails ? `${fails} finding(s)` : 'PASS: navbar and lesson bar fit at every width');
process.exit(fails ? 1 : 0);
