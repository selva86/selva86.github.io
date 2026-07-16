/* Bakes the two server-rendered (crawlable, printable) binomial tables into
   tools/binomial-table.html: exact P(X = k) and cumulative P(X <= k), for the
   standard n = 1..20 x p = .05(.05).50 grid.

   The cells print through tools/lib/binomial-math.js fmtExact(), the same
   exact-rational routine the page uses for its live readout, so a cell and the
   tool can never disagree. Verified cell by cell against R in
   Scripts/tool-truth/test-binomial-table-math.js (run it after any change).

   Idempotent: replaces content between <!--BAKE:x-start--> / <!--BAKE:x-end-->.
   Run: node Scripts/tool-truth/gen-binomial-table.js  */
'use strict';
const fs = require('fs');
const path = require('path');
const B = require('../../tools/lib/binomial-math.js');
const ROOT = path.join(__dirname, '..', '..');

const NS = []; for (let n = 1; n <= 20; n++) NS.push(n);
const PS = ['0.05', '0.10', '0.15', '0.20', '0.25', '0.30', '0.35', '0.40', '0.45', '0.50'];

function bake(file, sentinel, html) {
  const p = path.join(ROOT, file);
  let src = fs.readFileSync(p, 'utf8');
  const s = `<!--BAKE:${sentinel}-start-->`, e = `<!--BAKE:${sentinel}-end-->`;
  const esc = x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(esc(s) + '[\\s\\S]*?' + esc(e));
  if (!re.test(src)) throw new Error(`sentinel ${sentinel} not found in ${file}`);
  fs.writeFileSync(p, src.replace(re, s + html + e), 'utf8');
  console.log(`baked ${sentinel} -> ${file} (${(html.length / 1024).toFixed(1)} KB)`);
}

function head() {
  return '<thead><tr><th scope="col" class="nh">n</th><th scope="col" class="kh">k</th>' +
    PS.map(p => `<th scope="col" data-p="${p}">${p.replace(/^0/, '')}</th>`).join('') +
    '</tr></thead>';
}
// kind: 'eq' -> P(X = k), 'le' -> P(X <= k)
function body(kind) {
  const rows = [];
  for (const n of NS) {
    for (let k = 0; k <= n; k++) {
      const cells = PS.map(p => `<td data-p="${p}">${B.fmtExact(kind, k, n, p, 4)}</td>`).join('');
      rows.push(`<tr data-n="${n}" data-k="${k}"${k === 0 ? ' class="ng"' : ''}>` +
        `<th scope="row" class="nc">${k === 0 ? n : ''}</th>` +
        `<th scope="row" class="kc">${k}</th>${cells}</tr>`);
    }
  }
  return `<tbody>${rows.join('')}</tbody>`;
}

const F = 'tools/binomial-table.html';
bake(F, 'exact-head', head());
bake(F, 'exact-body', body('eq'));
bake(F, 'cum-head', head());
bake(F, 'cum-body', body('le'));

// sanity: the corners every reader knows by heart
const spot = [['eq', 0, 1, '0.50', '0.5000'], ['eq', 5, 10, '0.50', '0.2461'],
              ['le', 20, 20, '0.50', '1.0000'], ['eq', 0, 20, '0.05', '0.3585']];
for (const [kind, k, n, p, want] of spot) {
  const got = B.fmtExact(kind, k, n, p, 4);
  if (got !== want) throw new Error(`spot check ${kind} k=${k} n=${n} p=${p}: got ${got} want ${want}`);
}
console.log('spot checks ok');
