/* Pre-render the printable Pearson critical-value table (crawlable HTML) from
   the R-verified lib, so the shipped markup and the interactive lookup can
   never drift apart. Run: node Scripts/tool-truth/gen-pearson-table.js
   Prints the <tbody> rows to stdout. */
'use strict';
const P = require('../../tools/lib/pearson-r-math.js');

// Guard against the binomial-table lesson: at a 4dp tie, neither R's round()
// nor sprintf() is an oracle for the printed digit. Flag any cell sitting on a
// half-way boundary so it gets a decided rule rather than a silent coin flip.
let ties = 0;
function fmt(v) {
  const scaled = v * 1e4;
  const frac = Math.abs(scaled - Math.trunc(scaled));
  if (Math.abs(frac - 0.5) < 1e-7) {
    ties++;
    console.error(`TIE at 4dp: ${v}`);
  }
  return v.toFixed(4).replace(/^0\./, '.');   // classic tables print .9969
}

const rows = [];
for (const df of P.DF_ROWS) {
  const cells = P.ALPHA_PAIRS.map(pair => {
    const v = P.critRfromDf(pair.two, df, 'two');
    return `<td data-df="${df}" data-a2="${pair.two}">${fmt(v)}</td>`;
  }).join('');
  rows.push(`<tr data-dfrow="${df}"><th class="dfc" scope="row">${df}</th>${cells}</tr>`);
}
console.log(rows.join('\n'));
console.error(`\nrows: ${rows.length}  cells: ${rows.length * 4}  ties: ${ties}`);
