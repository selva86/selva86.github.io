// Tool-catalog page audit (deterministic dimensions of the write-tool rubric).
// Usage: node Scripts/tool-audit/page_audit.mjs [baseUrl]
// Writes Scripts/tool-audit/page-audit-results.json + prints a findings summary.
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'fs';

const BASE = process.argv[2] || 'https://r-statistics.co';
const slugs = JSON.parse(readFileSync('Scripts/tool-audit/tool-list.json', 'utf8'));
const ts = Date.now();

const browser = await chromium.launch();
const results = [];

for (const slug of slugs) {
  const url = `${BASE}/tools/${slug}.html?fresh=${ts}`;
  const r = { slug, findings: [] };
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + String(e).slice(0, 120)));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 120)); });
  try {
    const resp = await page.goto(url, { waitUntil: 'load', timeout: 45000 });
    r.status = resp.status();
    if (r.status !== 200) { r.findings.push(`HTTP ${r.status}`); results.push(r); await ctx.close(); continue; }
    await page.waitForTimeout(1500);

    const d = await page.evaluate(() => {
      const out = {};
      out.title = document.title;
      const md = document.querySelector('meta[name="description"]');
      out.metaDesc = md ? md.content.length : 0;
      out.canonical = !!document.querySelector('link[rel="canonical"]');
      let webApp = false, faqSchema = false, ldBad = 0;
      document.querySelectorAll('script[type="application/ld+json"]').forEach(s => {
        try { const j = JSON.parse(s.textContent); const t = JSON.stringify(j);
          if (t.includes('WebApplication')) webApp = true;
          if (t.includes('FAQPage')) faqSchema = true;
        } catch (e) { ldBad++; }
      });
      out.webApp = webApp; out.faqSchema = faqSchema; out.ldBad = ldBad;
      out.chrome = document.querySelectorAll('[data-tool-chrome="injected"]').length;
      out.sitenav = !!document.querySelector('.sitenav');
      out.railFold = !!document.querySelector('.rail-fold');
      out.h1 = !!document.querySelector('h1');
      const txt = document.body.innerText;
      out.iwant = txt.includes('I want to') || document.documentElement.outerHTML.includes('I want to');
      out.since = /Since\s/.test(txt) || /p\s*[=<>]/.test(txt) || !!document.querySelector('[id*="verdict"],[class*="verdict"],[id*="inference"],[class*="inference"],[id*="readout"]');
      out.trust = /No data leaves|in your browser|Verified against|no signup|stays local|free/i.test(txt);
      out.faqDetails = document.querySelectorAll('[class*="faq"] details, .faq-h ~ details').length || (document.querySelectorAll('details:not([class*="primer"]):not([class*="ws-"])').length >= 3 ? 3 : 0);
      out.emdash = (txt.match(/—/g) || []).length;
      out.jbm = document.documentElement.outerHTML.includes('JetBrains');
      out.eyebrow = !!document.querySelector('.eyebrow');
      out.ariaLive = !!document.querySelector('[aria-live]');
      const html = document.documentElement.outerHTML;
      out.gaUse = html.includes('tool_use'); out.gaCopy = html.includes('tool_copy');
      out.inpageFooter = !!document.querySelector('main footer.ft, footer.ft');
      out.unpinnedLibs = [...document.querySelectorAll('script[src*="/tools/lib/"]')]
        .filter(s => !s.getAttribute('src').includes('?v='))
        .map(s => s.getAttribute('src'));
      // design-system fingerprint: Lab-sheet pages carry the injected .tool-chrome
      // style block and only mention IBM Plex in the shared footer (~3 refs);
      // old-shell bodies repeat the Plex font stack 30-90x and run 220-270KB
      out.chromeCss = [...document.querySelectorAll('style')].some(s => s.textContent.includes('.tool-chrome{'));
      out.plexRefs = (html.match(/IBM Plex/g) || []).length;
      out.htmlKB = Math.round(html.length / 1024);
      return out;
    });
    Object.assign(r, d);
    r.consoleErrors = errors.filter(e => !/cloudflareinsights|beacon|googletagmanager|google-analytics|ERR_BLOCKED/i.test(e));

    await page.setViewportSize({ width: 390, height: 760 });
    await page.waitForTimeout(600);
    r.mobileOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);

    // findings
    const tl = (r.title || '').length;
    if (tl < 40 || tl > 60) r.findings.push(`title ${tl}ch: "${r.title}"`);
    if (r.metaDesc < 50 || r.metaDesc > 170) r.findings.push(`meta desc ${r.metaDesc}ch`);
    if (!r.canonical) r.findings.push('no canonical');
    if (!r.webApp) r.findings.push('no WebApplication schema');
    if (!r.faqSchema) r.findings.push('no FAQPage schema');
    if (r.ldBad) r.findings.push(`${r.ldBad} JSON-LD blocks fail to parse`);
    if (r.chrome !== 1) r.findings.push(`injected chrome x${r.chrome}`);
    if (!r.sitenav) r.findings.push('no .sitenav');
    if (!r.railFold) r.findings.push('no .rail-fold');
    if (!r.h1) r.findings.push('no h1');
    if (!r.iwant) r.findings.push('no "I want to" banner');
    const NO_INF = ['reprex-builder','dag-confounder-picker','statistical-test-chooser','t-table','z-table','chi-square-table','f-table','descriptive-statistics-calculator','effect-size-converter','z-score-percentile','confidence-interval-calculator','bootstrap-ci-calculator','power-analysis','roc-auc-calculator','bayes-factor-calculator'];
    if (!r.since && !NO_INF.includes(slug)) r.findings.push('no inference-style line detected');
    if (!r.trust) r.findings.push('no trust line detected');
    if (r.faqDetails < 3) r.findings.push(`FAQ details x${r.faqDetails}`);
    if (r.emdash) r.findings.push(`${r.emdash} em-dashes`);
    if (r.jbm) r.findings.push('JetBrains Mono reference');
    if (r.eyebrow) r.findings.push('.eyebrow present');
    if (!r.ariaLive) r.findings.push('no aria-live region');
    if (!r.gaUse) r.findings.push('no tool_use event');
    if (!r.gaCopy) r.findings.push('no tool_copy event');
    if (r.inpageFooter) r.findings.push('in-page footer.ft');
    if (r.unpinnedLibs.length) r.findings.push('unpinned libs: ' + r.unpinnedLibs.join(','));
    if (!r.chromeCss) r.findings.push('missing .tool-chrome style block (broken chrome CSS)');
    if (r.plexRefs > 10) r.findings.push(`OLD-SHELL body: ${r.plexRefs} IBM Plex refs`);
    if (r.htmlKB > 200) r.findings.push(`page ${r.htmlKB}KB (Lab-sheet standard ~150KB)`);
    if (r.consoleErrors.length) r.findings.push(`console errors x${r.consoleErrors.length}: ${r.consoleErrors[0]}`);
    if (r.mobileOverflow) r.findings.push('mobile 390 overflow');
  } catch (e) {
    r.findings.push('AUDIT ERROR: ' + String(e).slice(0, 140));
  }
  await ctx.close();
  results.push(r);
  console.log(`${r.findings.length ? 'FIND' : 'ok  '} ${slug} ${r.findings.length ? '-> ' + r.findings.join(' ; ') : ''}`);
}
await browser.close();
writeFileSync('Scripts/tool-audit/page-audit-results.json', JSON.stringify(results, null, 1));
const flagged = results.filter(r => r.findings.length);
console.log(`\naudited: ${results.length} | clean: ${results.length - flagged.length} | flagged: ${flagged.length}`);
