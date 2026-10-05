// The r-statistics.co certificate (2026-10 design handoff), one source for every surface:
//   /cert/<id> page (HTML) and its print/PDF, the profile share card (SVG),
//   the per-track social images (Scripts/gen_cert_og.mjs renders renderShareImageHtml).
// Canvas 1280 x 800. No signature, no monospace. Track codes live in _build/tracks-source.json;
// the account and dashboard minis and the roadmap preview copy them (www/account.js,
// www/dashboard.js, www/roadmap-v3.js), so keep those in step.

export const CERT_FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800" +
  "&family=Cormorant+Garamond:ital,wght@0,600;1,500&family=Source+Sans+3:wght@400;600&display=swap";

// Two-letter seal code + the phrase in "Demonstrated mastery of ___". Both come
// from the track (functions/_data/tracks.json, authored in _build/tracks-source.json);
// the fallback only covers a certificate whose track is no longer in the manifest.
export function certMeta(
  _trackId: string, trackName: string, track?: { code?: string; mastery?: string } | null,
): { code: string; mastery: string } {
  if (track && track.code && track.mastery) return { code: track.code, mastery: track.mastery };
  const code = trackName.replace(/^Certified\s+R?\s*/i, "").split(/\s+/)
    .filter(w => /^[A-Za-z]/.test(w) && !/^(with|for|and|of|in|the)$/i.test(w))
    .map(w => w[0]).join("").slice(0, 2).toUpperCase() || "R";
  return { code, mastery: `the ${trackName.replace(/^Certified\s+/i, "")} curriculum` };
}

export interface CertData {
  holder: string;
  title: string;
  code: string;
  mastery: string;
  issuedAt: number;      // unix seconds
  score: number | null;  // percent, or null when the record has none
  credId: string;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function fmtCertDate(unixSec: number): string {
  const d = new Date(unixSec * 1000);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function esc(s: string): string {
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

// Starting sizes from the handoff (92 -> 76 -> 64 for long names); CERT_FIT_JS shrinks further only if needed.
function nameSize(n: string): number { const l = n.length; return l <= 22 ? 92 : l <= 28 ? 76 : 64; }
function titleSize(t: string): number { const l = t.length; return l <= 20 ? 54 : l <= 26 ? 46 : 40; }

export function sealSvg(code: string, year: number, idSuffix: string, size: number): string {
  const ring = `rscRing${idSuffix}`;
  return `<svg viewBox="0 0 160 160" width="${size}" height="${size}" aria-hidden="true" style="display:block">` +
    `<defs><path id="${ring}" d="M80,80 m-60,0 a60,60 0 1,1 120,0 a60,60 0 1,1 -120,0"/></defs>` +
    `<circle cx="80" cy="80" r="76" fill="#0F3F2A" stroke="#C9A85E" stroke-width="1.5"/>` +
    `<circle cx="80" cy="80" r="71" fill="none" stroke="#C9A85E" stroke-width="0.6"/>` +
    `<text font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="9" font-weight="700" letter-spacing="2.6" fill="#D9BE7C">` +
    `<textPath href="#${ring}">R-STATISTICS.CO · CERTIFICATION AUTHORITY · ${year} ·</textPath></text>` +
    `<circle cx="80" cy="80" r="46" fill="#134A33" stroke="#C9A85E" stroke-width="1.5"/>` +
    `<text x="80" y="88" text-anchor="middle" font-family="'Cormorant Garamond', Georgia, serif" font-weight="600" font-size="46" fill="#E9D49A">R</text>` +
    `<text x="80" y="108" text-anchor="middle" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-weight="800" font-size="10" letter-spacing="2.5" fill="#D9BE7C">${esc(code)}</text>` +
    `</svg>`;
}

// Scoped styles for the 1280 x 800 canvas. .rsc-frame scales it to its width (CERT_FIT_JS sets --k).
export const CERT_CSS = `
.rsc-frame{position:relative;width:100%;aspect-ratio:1280/800;overflow:hidden}
.rsc{position:absolute;left:0;top:0;width:1280px;height:800px;transform-origin:0 0;transform:scale(var(--k,.6875));
  display:flex;background:#fff;font-family:'Source Sans 3',system-ui,sans-serif;color:#151816;overflow:hidden;
  -webkit-print-color-adjust:exact;print-color-adjust:exact}
.rsc *{box-sizing:border-box}
.rsc-l{width:380px;flex:none;background-color:#0F3F2A;
  background-image:repeating-radial-gradient(circle at 50% 42%,rgba(201,168,94,.13) 0 1.5px,transparent 1.5px 14px);
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:34px;text-align:center;padding:40px}
.rsc-lt{display:grid;gap:8px}
.rsc-k1{font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-size:17px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#D9BE7C}
.rsc-k2{font-size:19px;color:#BFE3CF}
.rsc-r{flex:1;min-width:0;border-left:6px solid #C9A85E;padding:64px 80px 52px;display:flex;flex-direction:column}
.rsc-hd{display:flex;justify-content:space-between;align-items:baseline;gap:20px}
.rsc-hd b{font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-weight:800;font-size:30px;letter-spacing:-.01em;color:#0F3F2A}
.rsc-hd span{font-size:20px;color:#59605C}
.rsc-b{margin-top:auto;display:grid;gap:10px;min-width:0}
.rsc-this{font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-weight:500;font-size:34px;color:#59605C}
.rsc-name{font-family:'Cormorant Garamond',Georgia,serif;font-weight:600;line-height:1.02;color:#151816;white-space:nowrap}
.rsc-earned{font-size:24px;color:#59605C;margin-top:18px}
.rsc-title{font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-weight:800;line-height:1.1;letter-spacing:-.02em;color:#0F3F2A;white-space:nowrap}
.rsc-m{font-size:23px;line-height:1.45;color:#363D39;margin-top:8px;max-width:30em;text-wrap:pretty}
.rsc-data{margin-top:auto;display:grid;grid-template-columns:auto auto 1fr;gap:20px 64px;border-top:1.5px solid #E3E6E4;padding-top:26px}
.rsc-data.two{grid-template-columns:auto 1fr}
.rsc-data>span{display:grid;gap:6px}
.rsc-dl{font-size:15px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#868C89}
.rsc-dv{font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-weight:700;font-size:26px;font-variant-numeric:tabular-nums;white-space:nowrap}
.rsc-v{margin-top:20px;font-size:20px;color:#59605C}
.rsc-v b{color:#1F6B4A;font-weight:600}
`;

export function renderCertificateHtml(d: CertData): string {
  const year = new Date(d.issuedAt * 1000).getUTCFullYear();
  const hasScore = d.score != null && isFinite(d.score);
  return `<div class="rsc-frame"><div class="rsc" role="img" aria-label="${esc(`${d.title} certificate awarded to ${d.holder}`)}">` +
    `<div class="rsc-l">${sealSvg(d.code, year, "", 290)}` +
    `<div class="rsc-lt"><span class="rsc-k1">Professional Certificate</span><span class="rsc-k2">Code-graded · verifiable</span></div></div>` +
    `<div class="rsc-r">` +
    `<div class="rsc-hd"><b>r-statistics.co</b><span>Certification Authority</span></div>` +
    `<div class="rsc-b"><span class="rsc-this">This certifies that</span>` +
    `<span class="rsc-name" data-fit="92,76,64,56,48" style="font-size:${nameSize(d.holder)}px">${esc(d.holder)}</span>` +
    `<span class="rsc-earned">has earned the credential</span>` +
    `<span class="rsc-title" data-fit="54,46,40,34" style="font-size:${titleSize(d.title)}px">${esc(d.title)}</span>` +
    `<span class="rsc-m">Demonstrated mastery of ${esc(d.mastery)} in code-graded R exercises.</span></div>` +
    `<div class="rsc-data${hasScore ? "" : " two"}">` +
    `<span><span class="rsc-dl">Issued</span><span class="rsc-dv">${esc(fmtCertDate(d.issuedAt))}</span></span>` +
    (hasScore ? `<span><span class="rsc-dl">Score</span><span class="rsc-dv">${Math.round(d.score as number)}%</span></span>` : "") +
    `<span><span class="rsc-dl">Credential ID</span><span class="rsc-dv">${esc(d.credId)}</span></span></div>` +
    `<span class="rsc-v">Verify at <b>r-statistics.co/cert/${esc(d.credId)}</b></span>` +
    `</div></div></div>`;
}

// Scales every .rsc-frame to its width, and steps the name/title down (data-fit sizes) until they fit.
export const CERT_FIT_JS = `(function(){
  function fit(el){var s=(el.getAttribute('data-fit')||'').split(',').map(Number);
    if(!el.getAttribute('data-start'))el.setAttribute('data-start',parseFloat(el.style.fontSize)||s[0]);
    var start=+el.getAttribute('data-start');el.style.whiteSpace='';
    for(var i=0;i<s.length;i++){if(s[i]>start)continue;el.style.fontSize=s[i]+'px';if(el.scrollWidth<=el.parentNode.clientWidth+1)return;}
    el.style.whiteSpace='normal';}
  function scale(){document.querySelectorAll('.rsc-frame').forEach(function(f){f.style.setProperty('--k',String(f.clientWidth/1280));});}
  function run(){document.querySelectorAll('.rsc [data-fit]').forEach(fit);scale();}
  run();if(document.fonts&&document.fonts.ready)document.fonts.ready.then(run);
  window.addEventListener('resize',scale);
  window.addEventListener('beforeprint',function(){document.querySelectorAll('.rsc-frame').forEach(function(f){f.style.setProperty('--k','1');});});
  window.addEventListener('afterprint',scale);
})();`;

// ---- SVG version (profile share card). Same layout as the HTML (positions measured from
// it); text widths come from measured glyph tables, so long names step down like the HTML
// does instead of being squeezed. Fonts load from Google Fonts when the SVG is opened
// directly; system fallbacks otherwise.
const GLYPHS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ -'.&,";
const W_CORM = [.42,.51,.42,.51,.41,.31,.45,.51,.27,.26,.49,.27,.77,.52,.49,.51,.5,.37,.34,.34,.5,.44,.68,.44,.43,.41,.71,.58,.68,.7,.55,.52,.73,.76,.34,.33,.65,.54,.85,.73,.77,.55,.77,.69,.51,.64,.7,.66,.92,.65,.62,.6,.23,.32,.15,.2,.71,.22];
const W_JAK = [.58,.67,.61,.67,.61,.41,.65,.6,.26,.26,.59,.26,.93,.6,.65,.67,.67,.39,.52,.42,.6,.58,.91,.58,.6,.49,.73,.69,.77,.74,.59,.59,.8,.73,.29,.4,.69,.55,.91,.74,.88,.65,.88,.67,.65,.55,.72,.71,1.03,.68,.67,.57,.18,.63,.33,.41,.81,.39];
function textW(s: string, px: number, table: number[], dflt: number, track = 0): number {
  let w = 0;
  for (const ch of s) { const i = GLYPHS.indexOf(ch); w += (i >= 0 ? table[i] : dflt) + track; }
  return w * px;
}
function wrapWords(s: string, px: number, em: number, max: number): string[] {
  const out: string[] = []; let line = "";
  for (const w of s.split(/\s+/)) {
    const t = line ? line + " " + w : w;
    if (t.length * px * em > max && line) { out.push(line); line = w; } else line = t;
  }
  if (line) out.push(line);
  return out;
}

export function renderCertificateSvg(d: CertData): string {
  const year = new Date(d.issuedAt * 1000).getUTCFullYear();
  const X = 466, MAXW = 734;              // right panel content box: 380 + 6 + 80
  const hasScore = d.score != null && isFinite(d.score);
  const pick = (sizes: number[], start: number, w: (px: number) => number) => {
    const ok = sizes.filter(px => px <= start);
    return ok.find(px => w(px) <= MAXW) ?? ok[ok.length - 1];
  };
  const nPx = pick([92, 76, 64, 56, 48], nameSize(d.holder), px => textW(d.holder, px, W_CORM, 0.48));
  const tPx = pick([54, 46, 40, 34], titleSize(d.title), px => textW(d.title, px, W_JAK, 0.62, -0.02));
  // Pin name and title to their measured width: a no-op with the real fonts, and it keeps a
  // wider fallback font (an SVG inside <img> cannot load web fonts) inside the panel.
  const squeeze = (w: number) => ` textLength="${Math.min(w, MAXW).toFixed(1)}" lengthAdjust="spacingAndGlyphs"`;
  const m = wrapWords(`Demonstrated mastery of ${d.mastery} in code-graded R exercises.`, 23, 0.47, 640);
  // vertical rhythm measured from the HTML: the body block is centred between header (103) and data row (613)
  const block = 41 + 10 + nPx * 1.02 + 10 + 53 + 10 + tPx * 1.1 + 10 + 8 + m.length * 33.35;
  const top = 103 + (510 - block) / 2;
  const nameTop = top + 51, earnTop = nameTop + nPx * 1.02 + 28, titleTop = earnTop + 45, mTop = titleTop + tPx * 1.1 + 18;
  const rings: string[] = [];
  for (let r = 14; r < 560; r += 14) rings.push(`<circle cx="190" cy="336" r="${r}" fill="none" stroke="rgba(201,168,94,.13)" stroke-width="1.5"/>`);
  const cols = hasScore ? [["Issued", fmtCertDate(d.issuedAt)], ["Score", `${Math.round(d.score as number)}%`], ["Credential ID", d.credId]]
                        : [["Issued", fmtCertDate(d.issuedAt)], ["Credential ID", d.credId]];
  let cx = X; const colXs: number[] = [];
  for (const [k, v] of cols) { colXs.push(cx); cx += Math.max(textW(v, 26, W_JAK, 0.62), k.length * 11.1) + 64; }
  const J = "font-family=\"'Plus Jakarta Sans', system-ui, sans-serif\"", C = "font-family=\"'Cormorant Garamond', Georgia, serif\"", S = "font-family=\"'Source Sans 3', system-ui, sans-serif\"";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 800" width="1280" height="800">` +
    `<style>@import url('${CERT_FONTS_HREF.replace(/&/g, "&amp;")}');</style>` +
    `<rect width="1280" height="800" fill="#fff"/>` +
    `<clipPath id="lp"><rect width="380" height="800"/></clipPath>` +
    `<rect width="380" height="800" fill="#0F3F2A"/><g clip-path="url(#lp)">${rings.join("")}</g>` +
    `<g transform="translate(45 199) scale(1.8125)">${sealSvg(d.code, year, "S", 160).replace(/^<svg[^>]*>|<\/svg>$/g, "")}</g>` +
    `<text text-anchor="middle" ${J} font-size="17" font-weight="700" letter-spacing="3.4" fill="#D9BE7C"><tspan x="190" y="540">PROFESSIONAL</tspan><tspan x="190" y="562">CERTIFICATE</tspan></text>` +
    `<text x="190" y="595" text-anchor="middle" ${S} font-size="19" fill="#BFE3CF">Code-graded · verifiable</text>` +
    `<rect x="380" width="6" height="800" fill="#C9A85E"/>` +
    `<text x="${X}" y="93" ${J} font-size="30" font-weight="800" fill="#0F3F2A">r-statistics.co</text>` +
    `<text x="${X + MAXW}" y="93" text-anchor="end" ${S} font-size="20" fill="#59605C">Certification Authority</text>` +
    `<text x="${X}" y="${(top + 31).toFixed(1)}" ${C} font-style="italic" font-weight="500" font-size="34" fill="#59605C">This certifies that</text>` +
    `<text x="${X}" y="${(nameTop + nPx * 0.8).toFixed(1)}" ${C} font-weight="600" font-size="${nPx}" fill="#151816"${squeeze(textW(d.holder, nPx, W_CORM, 0.48))}>${esc(d.holder)}</text>` +
    `<text x="${X}" y="${(earnTop + 26).toFixed(1)}" ${S} font-size="24" fill="#59605C">has earned the credential</text>` +
    `<text x="${X}" y="${(titleTop + tPx * 0.84).toFixed(1)}" ${J} font-weight="800" font-size="${tPx}" letter-spacing="${(-0.02 * tPx).toFixed(2)}" fill="#0F3F2A"${squeeze(textW(d.title, tPx, W_JAK, 0.62, -0.02))}>${esc(d.title)}</text>` +
    m.map((l, i) => `<text x="${X}" y="${(mTop + 24 + i * 33.35).toFixed(1)}" ${S} font-size="23" fill="#363D39">${esc(l)}</text>`).join("") +
    `<rect x="${X}" y="613" width="${MAXW}" height="1.5" fill="#E3E6E4"/>` +
    cols.map(([k, v], i) => `<text x="${colXs[i]}" y="654" ${S} font-size="15" font-weight="700" letter-spacing="2.1" fill="#868C89">${esc(k.toUpperCase())}</text>` +
      `<text x="${colXs[i]}" y="690" ${J} font-size="26" font-weight="700" fill="#151816">${esc(v)}</text>`).join("") +
    `<text x="${X}" y="741" ${S} font-size="20" fill="#59605C">Verify at <tspan fill="#1F6B4A" font-weight="600">r-statistics.co/cert/${esc(d.credId)}</tspan></text>` +
    `</svg>`;
}

// ---- 1200 x 630 social image for a track (no holder: the image is shared per track).
export function renderShareImageHtml(t: { title: string; code: string; mastery: string; year: number }): string {
  const tPx = t.title.length <= 20 ? 64 : t.title.length <= 26 ? 56 : 50;
  return `<!doctype html><html><head><meta charset="utf-8"><link href="${CERT_FONTS_HREF}" rel="stylesheet"><style>
html,body{margin:0}*{box-sizing:border-box}
.c{width:1200px;height:630px;display:flex;background:#fff;font-family:'Source Sans 3',sans-serif;color:#151816;overflow:hidden}
.l{width:420px;flex:none;background-color:#0F3F2A;background-image:repeating-radial-gradient(circle at 50% 46%,rgba(201,168,94,.13) 0 1.5px,transparent 1.5px 14px);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px}
.k1{font-family:'Plus Jakarta Sans',sans-serif;font-size:16px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#D9BE7C}
.r{flex:1;border-left:6px solid #C9A85E;padding:56px 64px 50px;display:flex;flex-direction:column}
.hd{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:28px;letter-spacing:-.01em;color:#0F3F2A}
.b{margin-top:auto;display:grid;gap:14px}
.e{font-size:24px;color:#59605C}
.t{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:${tPx}px;line-height:1.08;letter-spacing:-.02em;color:#0F3F2A}
.m{font-size:24px;line-height:1.4;color:#363D39}
.f{margin-top:auto;border-top:1.5px solid #E3E6E4;padding-top:22px;font-size:21px;color:#59605C}
.f b{color:#1F6B4A;font-weight:600}
</style></head><body><div class="c"><div class="l">${sealSvg(t.code, t.year, "", 250)}<span class="k1">Professional Certificate</span></div>
<div class="r"><div class="hd">r-statistics.co</div><div class="b"><span class="e">A verified credential</span><span class="t">${esc(t.title)}</span>
<span class="m">Mastery of ${esc(t.mastery)}, shown in code-graded R exercises.</span></div>
<div class="f">Code-graded · verify any credential at <b>r-statistics.co/verify</b></div></div></div></body></html>`;
}
