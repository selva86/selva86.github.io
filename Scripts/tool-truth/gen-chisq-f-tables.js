/* Bakes the server-rendered (crawlable, SEO) critical-value tables into
   tools/chi-square-table.html and tools/f-table.html using the SAME math the
   tools use at runtime (tools/lib/dist-tables-math.js) -> the printed numbers
   are R-exact and can never drift from the interactive result.

   Idempotent: replaces content between <!--BAKE:x-start--> / <!--BAKE:x-end-->.
   Run: node Scripts/tool-truth/gen-chisq-f-tables.js  */
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

/* ---------------- chi-square table ---------------- */
// Columns = upper-tail area a; the cell is the chi-square value with area a to
// its RIGHT, i.e. qchisq(1 - a, df). Small a -> large critical value.
const CHI_A = [0.995, 0.99, 0.975, 0.95, 0.90, 0.10, 0.05, 0.025, 0.01, 0.005];
const CHI_DF = [];
for (let d = 1; d <= 30; d++) CHI_DF.push(d);
[35, 40, 45, 50, 60, 70, 80, 90, 100].forEach(d => CHI_DF.push(d));

function fmtChi(v) {
  if (!isFinite(v)) return '&#8734;';
  if (v === 0) return '0';
  if (v < 0.001) return v.toPrecision(3);
  if (v < 1) return v.toFixed(4);
  if (v < 1000) return v.toFixed(3);
  return v.toFixed(1);
}
function chiHead() {
  let h = '<thead>';
  h += '<tr><th rowspan="2" class="dfh" scope="col">df</th>';
  h += CHI_A.map(a => `<th scope="col" data-a="${a}">${a}</th>`).join('') + '</tr>';
  h += '<tr class="sub"><th class="subk">cumulative P(&chi;&sup2; &le; crit)</th>' +
       CHI_A.map(a => `<td>${+(1 - a).toFixed(3)}</td>`).join('') + '</tr>';
  h += '</thead>';
  return h;
}
function chiBody() {
  let b = '<tbody id="chitbody">';
  for (const d of CHI_DF) {
    b += `<tr data-df="${d}"><th scope="row" class="dfc">${d}</th>`;
    for (const a of CHI_A) {
      const v = D.qchisq(1 - a, d);
      b += `<td data-a="${a}">${fmtChi(v)}</td>`;
    }
    b += '</tr>';
  }
  b += '</tbody>';
  return b;
}

/* ---------------- F tables (one per alpha) ---------------- */
const F_A = [0.10, 0.05, 0.025, 0.01];
const F_DF1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 24, 30, 40, 60, 120, Infinity];
const F_DF2 = [];
for (let d = 1; d <= 30; d++) F_DF2.push(d);
[40, 60, 120, Infinity].forEach(d => F_DF2.push(d));

function fmtF(v) {
  if (!isFinite(v)) return '&#8734;';
  if (v >= 1000) return v.toFixed(0);
  if (v >= 100) return v.toFixed(1);
  return v.toFixed(2);
}
function dfLabel(d) { return isFinite(d) ? String(d) : '&#8734;'; }
function dfKey(d) { return isFinite(d) ? String(d) : 'inf'; }

function fHead() {
  let h = '<thead><tr><th class="dfh corner" scope="col"><span class="cnum">df1</span> &rarr;<br><span class="cden">df2</span> &darr;</th>';
  h += F_DF1.map((d, i) => `<th scope="col" data-df1="${dfKey(d)}" data-col="${i}">${dfLabel(d)}</th>`).join('');
  h += '</tr></thead>';
  return h;
}
function fBody(a) {
  let b = '<tbody>';
  for (const d2 of F_DF2) {
    b += `<tr data-df2="${dfKey(d2)}"><th scope="row" class="dfc">${dfLabel(d2)}</th>`;
    for (const d1 of F_DF1) {
      const v = D.qf(1 - a, d1, d2);   // column = cell position; no per-cell attr (saves bytes)
      b += `<td>${fmtF(v)}</td>`;
    }
    b += '</tr>';
  }
  b += '</tbody>';
  return b;
}
function fTable(a) {
  const id = 'f' + String(a).replace('0.', '');
  const on = a === 0.05 ? '' : ' style="display:none"';
  return `<div class="ftbl" data-alpha="${a}"${on}>` +
    `<div class="tscroll"><table class="dtab ftab" data-alpha="${a}" ` +
    `aria-label="Critical F values, upper-tail area ${a}">${fHead()}${fBody(a)}</table></div></div>`;
}

/* ---------------- write ---------------- */
bake('tools/chi-square-table.html', 'chithead', chiHead());
bake('tools/chi-square-table.html', 'chitbody', chiBody());
bake('tools/f-table.html', 'ftables', F_A.map(fTable).join(''));
console.log('done.');
