/* Bakes the server-rendered (crawlable, SEO) critical-value tables into
   tools/t-table.html and tools/z-table.html using the SAME math the tool
   uses at runtime (tools/lib/dist-tables-math.js) -> the printed numbers are
   R-exact and can never drift from the interactive result.

   Idempotent: replaces content between <!--BAKE:x-start--> / <!--BAKE:x-end-->.
   Run: node Scripts/tool-truth/gen-dist-tables.js  */
'use strict';
const fs = require('fs');
const path = require('path');
const D = require('../../tools/lib/dist-tables-math.js');
const ROOT = path.join(__dirname, '..', '..');

function bake(file, sentinel, html) {
  const p = path.join(ROOT, file);
  let src = fs.readFileSync(p, 'utf8');
  const s = `<!--BAKE:${sentinel}-start-->`, e = `<!--BAKE:${sentinel}-end-->`;
  const re = new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\s\\S]*?' + e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!re.test(src)) throw new Error(`sentinel ${sentinel} not found in ${file}`);
  src = src.replace(re, s + html + e);
  fs.writeFileSync(p, src, 'utf8');
  console.log(`baked ${sentinel} -> ${file} (${html.length} bytes)`);
}

/* ---------------- t-table ---------------- */
// Column key = upper-tail area a (one tail). Secondary headers derive
// two-tailed alpha = 2a and confidence = 1 - 2a.
const T_A = [0.10, 0.05, 0.025, 0.01, 0.005, 0.001, 0.0005];
// df rows: dense 1-30, then a standard tail, then the normal limit.
const T_DF = [];
for (let d = 1; d <= 30; d++) T_DF.push(d);
[35, 40, 45, 50, 60, 70, 80, 90, 100, 120, 150, 200].forEach(d => T_DF.push(d));
T_DF.push(Infinity);

function fmtT(v) { return v.toFixed(3); }
function tHead() {
  const conf = a => {
    const c = 100 * (1 - 2 * a);
    return (Math.round(c * 100) / 100).toString().replace(/\.0+$/, '') + '%';
  };
  let h = '<thead>';
  h += '<tr><th rowspan="3" class="dfh" scope="col">df</th>';
  h += T_A.map(a => `<th scope="col" data-a="${a}">${a}</th>`).join('') + '</tr>';
  h += '<tr class="sub"><th class="subk">two-tailed &alpha;</th>' +
       T_A.map(a => `<td>${(2 * a)}</td>`).join('') + '</tr>';
  h += '<tr class="sub"><th class="subk">confidence</th>' +
       T_A.map(a => `<td>${conf(a)}</td>`).join('') + '</tr>';
  h += '</thead>';
  return h;
}
function tBody() {
  let b = '<tbody id="ttbody">';
  for (const d of T_DF) {
    const isInf = !isFinite(d);
    const dfLabel = isInf ? '&#8734;<span class="zlab"> (z)</span>' : String(d);
    const dfAttr = isInf ? 'inf' : String(d);
    b += `<tr data-df="${dfAttr}"><th scope="row" class="dfc">${dfLabel}</th>`;
    for (const a of T_A) {
      const v = D.qt(1 - a, isInf ? Infinity : d);
      b += `<td data-a="${a}">${fmtT(v)}</td>`;
    }
    b += '</tr>';
  }
  b += '</tbody>';
  return b;
}

/* ---------------- z-table ---------------- */
// Standard normal cumulative Phi(z) = P(Z <= z). Two sub-tables (neg / pos).
const Z_COLS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];   // 2nd decimal
function fmtZ(v) { return v.toFixed(4); }
function zRows(sign) {
  // sign = +1 -> 0.0..3.4 ; -1 -> -0.0..-3.4
  let rows = '';
  for (let i = 0; i <= 34; i++) {
    const base = i / 10;                 // 0.0 .. 3.4
    const z0 = sign < 0 ? -base : base;
    const rowKey = (sign < 0 ? '-' : '') + base.toFixed(1);
    rows += `<tr data-z="${rowKey}"><th scope="row" class="zc">${sign < 0 ? '&minus;' : ''}${base.toFixed(1)}</th>`;
    for (const c of Z_COLS) {
      const z = (Math.round((base + c / 100) * 100) / 100) * (sign < 0 ? -1 : 1);
      const v = D.pnorm(z);
      rows += `<td>${fmtZ(v)}</td>`;   // column = cell position (see hiCell); no per-cell attr, saves ~7KB
    }
    rows += '</tr>';
  }
  return rows;
}
function zHead() {
  let h = '<thead><tr><th scope="col" class="zc">z</th>';
  h += Z_COLS.map(c => `<th scope="col" data-c="${c}">0.0${c}</th>`).join('');
  h += '</tr></thead>';
  return h;
}
function zTable(sign, label) {
  return `<figure class="ztbl"><figcaption>${label}</figcaption>` +
    `<div class="tscroll"><table class="dtab ztab">${zHead()}<tbody data-sign="${sign < 0 ? 'neg' : 'pos'}">${zRows(sign)}</tbody></table></div></figure>`;
}

/* ---------------- write ---------------- */
bake('tools/t-table.html', 'thead', tHead());
bake('tools/t-table.html', 'tbody', tBody());
bake('tools/z-table.html', 'zneg', zTable(-1, 'Negative z (z &le; 0): cumulative area to the left, P(Z &le; z)'));
bake('tools/z-table.html', 'zpos', zTable(1, 'Positive z (z &ge; 0): cumulative area to the left, P(Z &le; z)'));
console.log('done.');
