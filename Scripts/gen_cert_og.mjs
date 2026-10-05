// Render the per-track certificate social images (screenshots/og-cert-<track>.png, 1200 x 630)
// from the shared certificate design in functions/_lib/cert-design.ts.
// These are the og:image of every /cert/<id> page and the picture in the certificate email.
// Usage (repo root): node Scripts/gen_cert_og.mjs
// After regenerating, bump the ?v= on og-cert (now v=3) in functions/cert/[id].ts and functions/api/cert/mint.ts.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const D = await import(pathToFileURL(path.join(ROOT, 'functions/_lib/cert-design.ts')).href);
const raw = JSON.parse(fs.readFileSync(path.join(ROOT, 'functions/_data/tracks.json'), 'utf8'));
const tracks = Array.isArray(raw) ? raw : (raw.tracks || Object.values(raw));
const year = new Date().getUTCFullYear();

const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })).newPage();
for (const t of tracks) {
  const m = D.certMeta(t.id, t.name, t);
  await p.setContent(D.renderShareImageHtml({ title: t.name, code: m.code, mastery: m.mastery, year }), { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  const out = path.join(ROOT, 'screenshots', `og-cert-${t.id}.png`);
  await p.screenshot({ path: out, clip: { x: 0, y: 0, width: 1200, height: 630 } });
  console.log('wrote', path.relative(ROOT, out), fs.statSync(out).size, 'bytes');
}
await b.close();
