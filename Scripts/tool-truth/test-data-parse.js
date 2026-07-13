/* Unit tests for the shared tolerant paste parser (tools/lib/data-parse.js).
   This parser is reused by W1.5 (Cronbach's alpha) and wave-2 correlation, so
   it is gated on its own. Run: node test-data-parse.js */
'use strict';
const DP = require('../../tools/lib/data-parse.js');

let pass = 0, fail = 0;
function eq(a, b) {
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (!eq(a[i], b[i])) return false;
    return true;
  }
  if (typeof a === 'number' && typeof b === 'number')
    return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b));
  return a === b;
}
function t(label, got, exp) {
  if (eq(got, exp)) { pass++; }
  else { fail++; console.log(`FAIL ${label}\n   got=${JSON.stringify(got)}\n   exp=${JSON.stringify(exp)}`); }
}

// ---- cleanNumber ----
t('clean plain', DP.cleanNumber('42'), 42);
t('clean decimal', DP.cleanNumber('3.14'), 3.14);
t('clean neg', DP.cleanNumber('-5'), -5);
t('clean plus', DP.cleanNumber('+7'), 7);
t('clean currency $', DP.cleanNumber('$1,234.50'), 1234.5);
t('clean currency £', DP.cleanNumber('£99'), 99);
t('clean euro decimal', DP.cleanNumber('€1.234,56'), 1234.56); // EU: last sep = decimal
t('clean thousands', DP.cleanNumber('1,234,567'), 1234567);
t('clean lone-comma decimal', DP.cleanNumber('12,5'), 12.5);
t('clean accounting neg', DP.cleanNumber('(1,234)'), -1234);
t('clean percent kept', DP.cleanNumber('50%'), 50);
t('clean scientific', DP.cleanNumber('2.5e-3'), 0.0025);
t('clean trailing dot', DP.cleanNumber('5.'), 5);
t('clean spaces', DP.cleanNumber('  1 000  '), 1000);
t('clean NA -> null', DP.cleanNumber('NA'), null);
t('clean blank -> null', DP.cleanNumber(''), null);
t('clean garbage -> null', DP.cleanNumber('abc'), null);
t('clean dash -> null', DP.cleanNumber('-'), null);

// Last-occurring separator is the decimal: "1,234.50" (US) and "1.234,56" (EU).
t('us mixed sep', DP.cleanNumber('1,234.50'), 1234.5);
t('eu mixed sep', DP.cleanNumber('1.234,56'), 1234.56);

// ---- single flat vector ----
function vals(text) { const r = DP.parse(text); return (r.column || r.columns[0]).values; }
function col0(text) { const r = DP.parse(text); return r.column || r.columns[0]; }

t('newline column', vals('1\n2\n3\n4\n5'), [1, 2, 3, 4, 5]);
t('comma list one line', vals('1, 2, 3, 4, 5'), [1, 2, 3, 4, 5]);
t('space list', vals('2 3 4 5 6'), [2, 3, 4, 5, 6]);
t('single value', vals('42'), [42]);
t('signed list', vals('-5\n+3\n-1.5'), [-5, 3, -1.5]);
t('scientific list', vals('1e3\n2.5e-2'), [1000, 0.025]);
t('mixed newline+space', vals('2 3\n4 5\n6'), [2, 3, 4, 5, 6]);
t('percent column', vals('50%\n25%\n12.5%'), [50, 25, 12.5]);

// currency + thousands single column
t('currency column', vals('$1,200\n$1,300\n$1,400'), [1200, 1300, 1400]);
t('grouped multiline (flat, not table)', vals('1,234\n5,678'), [1234, 5678]);

// NA / blank handling
{
  const c = col0('1\nNA\n3\n5\nn/a');   // blank lines are dropped, not counted
  t('withNA values', c.values, [1, 3, 5]);
  t('withNA missing', c.missing, 2);
}
// junk / invalid handling
{
  const c = col0('abc\n1\n2\nxyz\n3');
  t('junk values', c.values, [1, 2, 3]);
  t('junk invalid count', c.invalid, 2);
}

// ---- tables (columnar) ----
{
  const r = DP.parse('height\tweight\n1\t2\n3\t4');
  t('tab table mode', r.mode, 'columns');
  t('tab table ncol', r.ncol, 2);
  t('tab table names', [r.columns[0].name, r.columns[1].name], ['height', 'weight']);
  t('tab table col0', r.columns[0].values, [1, 3]);
  t('tab table col1', r.columns[1].values, [2, 4]);
}
{
  const r = DP.parse('a,b\n10,20\n30,40');
  t('csv header mode', r.mode, 'columns');
  t('csv header names', [r.columns[0].name, r.columns[1].name], ['a', 'b']);
  t('csv col0', r.columns[0].values, [10, 30]);
}
{
  const r = DP.parse('1\t2\t3\n4\t5\t6');
  t('excel numeric 3col', r.ncol, 3);
  t('excel no header name', r.columns[0].name, 'Column 1');
  t('excel col2', r.columns[2].values, [3, 6]);
}
{
  const r = DP.parse('a;b\n1;2\n3;4');
  t('semicolon table', r.ncol, 2);
  t('semicolon col1', r.columns[1].values, [2, 4]);
}
// thousands inside tab cells (comma is NOT the delimiter here)
{
  const r = DP.parse('1,234\t5,678\n2,345\t6,789');
  t('tab+thousands ncol', r.ncol, 2);
  t('tab+thousands col0', r.columns[0].values, [1234, 2345]);
  t('tab+thousands col1', r.columns[1].values, [5678, 6789]);
}
// header with NA / blanks in body
{
  const r = DP.parse('x,y\n1,\n2,8\n,9\nNA,10');
  t('table missing col0', r.columns[0].missing, 2);   // blank row + NA row
  t('table col0 values', r.columns[0].values, [1, 2]);
  t('table col1 values', r.columns[1].values, [8, 9, 10]);
}

// ---- numericVector convenience (picks fullest column) ----
{
  const c = DP.numericVector('x,y\n,1\n,2\n5,3\n,4');
  t('numericVector fullest col', c.values, [1, 2, 3, 4]);
}
// empty
t('empty parse', DP.parse('').mode, 'empty');
t('whitespace only', DP.parse('   \n  \n').mode, 'empty');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
