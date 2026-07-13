/* data-parse.js - tolerant paste-data parser for Tool Farm v2.
   Shared by the descriptive-statistics calculator (W1.4), Cronbach's alpha
   (W1.5) and the wave-2 correlation calculator. One job: turn a blob of
   pasted numbers into clean numeric column(s), forgiving the mess real users
   paste - headers, currency symbols, thousands separators, blank/NA cells,
   and any of newline / comma / semicolon / tab / space separators.

   Design:
     * Tab or semicolon present  -> a real delimited table (columnar).
     * Comma present, >= 2 rows, modal field count >= 2, and the lines are not
       just grouped numbers ("1,234") -> columnar (CSV).
     * Everything else -> one flat numeric vector (split on any run of
       comma / semicolon / whitespace), so a casual space- or newline-
       separated list of numbers is treated as a single sample.
   Cell cleaning strips $ £ € ¥ ₹ % and whitespace, reads (1,234) as -1234,
   removes thousands commas, and reads a lone comma as a European decimal.

   Works in browser (window.DataParse) and Node (module.exports). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.DataParse = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Tokens that mean "no value here" (case-insensitive, exact match).
  var MISSING = {
    '': 1, 'na': 1, 'n/a': 1, 'nan': 1, 'null': 1, 'none': 1, 'nil': 1,
    '.': 1, '-': 1, '--': 1, '?': 1, 'missing': 1, '#n/a': 1, '#na': 1,
    '#null!': 1, '#div/0!': 1, 'inf': 1, '-inf': 1, 'x': 1
  };

  function isMissing(s) {
    if (s == null) return true;
    return MISSING[String(s).trim().toLowerCase()] === 1;
  }

  // Strip surrounding double quotes and whitespace from a cell.
  function trimCell(s) {
    s = String(s == null ? '' : s).trim();
    if (s.length >= 2 && s.charAt(0) === '"' && s.charAt(s.length - 1) === '"') {
      s = s.slice(1, -1).replace(/""/g, '"').trim();
    }
    return s;
  }

  // "$1,234.50" / "(1,234)" / "12,5" / "1.2e9" -> Number | null.
  function cleanNumber(raw) {
    if (raw == null) return null;
    var s = String(raw).trim();
    if (s === '' || isMissing(s)) return null;
    var sign = 1;
    // Accounting negatives: (1,234) -> -1234
    if (/^\(.*\)$/.test(s)) { sign = -1; s = s.slice(1, -1).trim(); }
    // Strip currency symbols, percent signs and internal spaces.
    s = s.replace(/[$£€¥₹% \s]/g, '');
    if (s === '') return null;
    if (s.charAt(0) === '+') s = s.slice(1);
    else if (s.charAt(0) === '-') { sign = -sign; s = s.slice(1); }
    if (s === '') return null;
    // Decide what commas mean.
    var hasComma = s.indexOf(',') >= 0, hasDot = s.indexOf('.') >= 0;
    if (hasComma && hasDot) {
      // The last-occurring separator is the decimal point; the other groups
      // thousands. Handles both "1,234.50" (US) and "1.234,56" (EU).
      if (s.lastIndexOf(',') > s.lastIndexOf('.'))
        s = s.replace(/\./g, '').replace(',', '.');   // EU: comma decimal
      else
        s = s.replace(/,/g, '');                       // US: comma thousands
    } else if (hasComma) {
      if (/^\d{1,3}(,\d{3})+$/.test(s)) {
        s = s.replace(/,/g, '');                  // grouped thousands: 1,234,567
      } else if ((s.match(/,/g) || []).length === 1) {
        s = s.replace(',', '.');                  // lone comma = decimal: 12,5 -> 12.5
      } else {
        s = s.replace(/,/g, '');                  // best effort: strip
      }
    }
    if (!/^\d*\.?\d+(e[-+]?\d+)?$|^\d+\.$/i.test(s)) {
      // allow a trailing dot ("5.") too; otherwise reject garbage
      var v0 = parseFloat(s);
      if (!isFinite(v0) || /[^0-9eE.\-+]/.test(s)) return null;
      return sign * v0;
    }
    var v = parseFloat(s);
    return isFinite(v) ? sign * v : null;
  }

  function isNumericCell(s) {
    if (isMissing(s)) return false;
    return cleanNumber(s) !== null;
  }

  // A line that is one grouped number, e.g. "1,234" or "$1,234,567.89".
  function isGroupedNumberLine(line) {
    var t = String(line).replace(/[$£€¥₹% \s()+-]/g, '');
    return /^\d{1,3}(,\d{3})+(\.\d+)?$/.test(t);
  }

  // Split one line into cells for a known delimiter (quote-aware for , and ;).
  function splitCells(line, delim) {
    if (delim === '\t') return line.split('\t').map(trimCell);
    var out = [], cur = '', inQ = false, i, ch;
    for (i = 0; i < line.length; i++) {
      ch = line.charAt(i);
      if (ch === '"') {
        if (inQ && line.charAt(i + 1) === '"') { cur += '"'; i++; }
        else inQ = !inQ;
      } else if (ch === delim && !inQ) { out.push(cur); cur = ''; }
      else cur += ch;
    }
    out.push(cur);
    return out.map(trimCell);
  }

  // Split a line into flat numeric tokens (comma / semicolon / whitespace).
  function splitFlat(line) {
    return line.split(/[,;\s]+/).filter(function (t) { return t.length; });
  }

  function modeOf(arr) {
    var counts = {}, best = arr.length ? arr[0] : 0, bestC = 0, i, k;
    for (i = 0; i < arr.length; i++) {
      k = arr[i]; counts[k] = (counts[k] || 0) + 1;
      if (counts[k] > bestC) { bestC = counts[k]; best = k; }
    }
    return best;
  }

  // Turn a list of raw cell strings into a numeric column summary.
  function buildColumn(name, cells) {
    var values = [], missing = 0, invalid = 0, i, s, v;
    for (i = 0; i < cells.length; i++) {
      s = trimCell(cells[i]);
      if (s === '' || isMissing(s)) { missing++; continue; }
      v = cleanNumber(s);
      if (v === null || !isFinite(v)) { invalid++; continue; }
      values.push(v);
    }
    return {
      name: name, raw: cells, values: values,
      n: values.length, missing: missing, invalid: invalid
    };
  }

  function hasHeaderRow(rows) {
    if (rows.length < 2) return false;
    var firstNum = 0, belowNum = 0, r, c;
    for (c = 0; c < rows[0].length; c++) if (isNumericCell(rows[0][c])) firstNum++;
    for (r = 1; r < rows.length; r++)
      for (c = 0; c < rows[r].length; c++) if (isNumericCell(rows[r][c])) belowNum++;
    return firstNum === 0 && belowNum > 0;
  }

  /* Main entry. Returns:
     { mode:'empty' }                                        no usable input
     { mode:'vector', column:{...}, ncol:1 }                 one flat sample
     { mode:'columns', header, columns:[...], ncol, nrow }   a table
     Every column object: {name, raw, values, n, missing, invalid}. */
  function parse(text) {
    var norm = String(text == null ? '' : text).replace(/\r\n?/g, '\n');
    var lines = norm.split('\n').map(function (l) { return l.trim(); })
      .filter(function (l) { return l.length; });
    if (!lines.length) return { mode: 'empty', ncol: 0, nrow: 0, columns: [] };

    var hasTab = lines.some(function (l) { return l.indexOf('\t') >= 0; });
    var hasSemi = lines.some(function (l) { return l.indexOf(';') >= 0; });
    var hasComma = lines.some(function (l) { return l.indexOf(',') >= 0; });
    var delim = hasTab ? '\t' : hasSemi ? ';' : hasComma ? ',' : null;

    var columnar = false;
    if (delim === '\t' || delim === ';') {
      var mc = modeOf(lines.map(function (l) { return splitCells(l, delim).length; }));
      columnar = mc >= 2;
    } else if (delim === ',') {
      if (lines.length >= 2) {
        var counts = lines.map(function (l) { return splitCells(l, ',').length; });
        var modal = modeOf(counts);
        var allGrouped = lines.every(isGroupedNumberLine);
        columnar = modal >= 2 && !allGrouped;
      }
    }

    if (!columnar) {
      var toks = [];
      lines.forEach(function (l) {
        if (isGroupedNumberLine(l)) toks.push(l);
        else splitFlat(l).forEach(function (t) { toks.push(t); });
      });
      return { mode: 'vector', ncol: 1, nrow: toks.length,
               column: buildColumn('values', toks),
               columns: [buildColumn('values', toks)] };
    }

    var rows = lines.map(function (l) { return splitCells(l, delim); });
    var ncol = modeOf(rows.map(function (r) { return r.length; }));
    if (ncol < 1) ncol = 1;
    var header = null, dataRows = rows;
    if (hasHeaderRow(rows)) { header = rows[0]; dataRows = rows.slice(1); }
    var columns = [];
    for (var c = 0; c < ncol; c++) {
      var cells = dataRows.map(function (r) { return c < r.length ? r[c] : ''; });
      var nm = (header && header[c] && header[c].length) ? header[c] : ('Column ' + (c + 1));
      columns.push(buildColumn(nm, cells));
    }
    return { mode: 'columns', ncol: ncol, nrow: dataRows.length,
             header: header, delimiter: delim, columns: columns };
  }

  // Convenience: pull one numeric vector out of any paste (the column with the
  // most usable numbers wins when the input is a table).
  function numericVector(text) {
    var r = parse(text);
    if (r.mode === 'empty') return { values: [], n: 0, missing: 0, invalid: 0, name: 'values' };
    if (r.mode === 'vector') return r.column;
    var best = r.columns[0];
    for (var i = 1; i < r.columns.length; i++)
      if (r.columns[i].n > best.n) best = r.columns[i];
    return best;
  }

  /* Matrix entry point for the Cronbach's alpha calculator (W1.5): turn a
     pasted item-response table (rows = respondents, cols = items) into a dense
     matrix of Number|null, preserving row alignment and NA positions. Unlike
     parse() - which folds space/newline lists into ONE flat vector - this reads
     a whitespace-only grid as a real table, since a reliability analysis is
     inherently multi-column. Delimited (tab/comma/semicolon) tables reuse
     parse() so headers, quotes and currency handling come for free.
     Returns:
       { mode:'empty' }
       { mode:'vector', nrow, ncol:1, values }          only one usable column
       { mode:'matrix', nrow, ncol, names, matrix, header } where matrix[r][c]
         is a Number or null (missing). Ragged rows are padded with null. */
  function parseMatrix(text) {
    var norm = String(text == null ? '' : text).replace(/\r\n?/g, '\n');
    var lines = norm.split('\n').map(function (l) { return l.trim(); })
      .filter(function (l) { return l.length; });
    if (!lines.length) return { mode: 'empty', nrow: 0, ncol: 0, names: [], matrix: [] };

    // 1. Real delimiter present -> reuse parse() (headers/quotes/currency).
    var p = parse(text);
    if (p.mode === 'columns' && p.ncol >= 2) {
      var nrow = p.columns[0].raw.length, matrix = [], r, c, cell;
      for (r = 0; r < nrow; r++) {
        var row = [];
        for (c = 0; c < p.ncol; c++) {
          cell = p.columns[c].raw[r];
          row.push(isMissing(cell) ? null : cleanNumber(cell));
        }
        matrix.push(row);
      }
      return { mode: 'matrix', nrow: nrow, ncol: p.ncol,
               names: p.columns.map(function (col) { return col.name; }),
               matrix: matrix, header: !!p.header };
    }

    // 2. Whitespace-only grid (space/tab/comma/semicolon runs).
    var rows = lines.map(function (l) {
      return l.split(/[\t,;\s]+/).filter(function (t) { return t.length; });
    });
    var modal = modeOf(rows.map(function (r2) { return r2.length; }));
    if (modal >= 2 && rows.length >= 2) {
      // Header row: first line entirely non-numeric, data below numeric.
      var header = null, dataRows = rows;
      var firstNum = rows[0].filter(isNumericCell).length;
      var belowNum = 0, i, j;
      for (i = 1; i < rows.length; i++) belowNum += rows[i].filter(isNumericCell).length;
      if (firstNum === 0 && belowNum > 0) { header = rows[0]; dataRows = rows.slice(1); }
      var mat = [], names = [];
      for (j = 0; j < modal; j++)
        names.push((header && header[j] && header[j].length) ? header[j] : ('Item ' + (j + 1)));
      for (i = 0; i < dataRows.length; i++) {
        var rr = [];
        for (j = 0; j < modal; j++) {
          var v = j < dataRows[i].length ? dataRows[i][j] : '';
          rr.push(isMissing(v) ? null : cleanNumber(v));
        }
        mat.push(rr);
      }
      return { mode: 'matrix', nrow: mat.length, ncol: modal, names: names,
               matrix: mat, header: !!header };
    }

    // 3. One usable column only -> not enough for a scale.
    var v = numericVector(text);
    return { mode: 'vector', nrow: v.n, ncol: 1, values: v.values, names: [v.name] };
  }

  return {
    version: '1.1.0',
    isMissing: isMissing,
    cleanNumber: cleanNumber,
    isNumericCell: isNumericCell,
    splitCells: splitCells,
    parse: parse,
    parseMatrix: parseMatrix,
    numericVector: numericVector
  };
}));
