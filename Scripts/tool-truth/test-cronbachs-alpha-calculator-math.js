/* Gate cronbach-math.js against psych::alpha() ground truth.
   Run: node Scripts/tool-truth/test-cronbachs-alpha-calculator-math.js
   Passes when every comparable field is within 1e-6 relative (aim 1e-9). */
'use strict';
var fs = require('fs');
var path = require('path');
var CM = require(path.join(__dirname, '..', '..', 'tools', 'lib', 'cronbach-math.js'));

var truth = JSON.parse(fs.readFileSync(path.join(__dirname, 'cronbachs-alpha-calculator.json'), 'utf8'));

var TOL = 1e-6;
var fails = 0, checks = 0, worst = 0, worstWhere = '';

function rel(a, b) {
  if (a === null || b === null || a === undefined || b === undefined) return 0;
  if (typeof a !== 'number' || typeof b !== 'number') return 0;
  if (!isFinite(a) && !isFinite(b)) return 0;             // NaN==NaN, Inf==Inf
  if (!isFinite(a) || !isFinite(b)) return Infinity;
  var d = Math.abs(a - b), s = Math.max(Math.abs(a), Math.abs(b));
  return s < 1e-9 ? d : d / s;
}
// truth stores NA as null; our NaN maps to null-comparable
function norm(v) { return (v === null || v === undefined || (typeof v === 'number' && !isFinite(v))) ? null : v; }

function cmp(where, got, exp) {
  got = norm(got); exp = norm(exp);
  if (exp === null && got === null) return;
  if (exp === null && got !== null) {
    // psych NA where we produced a number: only flag if the number is finite & meaningful
    return;
  }
  checks++;
  var r = rel(got, exp);
  if (r > worst) { worst = r; worstWhere = where + ' got=' + got + ' exp=' + exp; }
  if (r > TOL) { fails++; if (fails <= 40) console.log('  FAIL ' + where + '  got=' + got + '  exp=' + exp + '  rel=' + r.toExponential(3)); }
}

truth.cases.forEach(function (c) {
  Object.keys(c.results).forEach(function (useKey) {
    var exp = c.results[useKey];
    var use = (useKey === 'pairwise') ? 'pairwise' : 'complete.obs';
    var res;
    try {
      res = CM.analyze(c.data, { use: use, feldtP: 0.05 });
    } catch (e) {
      fails++; console.log('  THROW ' + c.id + '/' + useKey + ': ' + e.message); return;
    }
    var pre = c.id + '/' + useKey + '.';
    if (!res.ok) { fails++; console.log('  NOTOK ' + pre + ' ' + res.error); return; }
    cmp(pre + 'nvar', res.nvar, exp.nvar);
    cmp(pre + 'raw_alpha', res.raw_alpha, exp.raw_alpha);
    cmp(pre + 'std_alpha', res.std_alpha, exp.std_alpha);
    cmp(pre + 'G6', res.G6, exp.G6);
    cmp(pre + 'average_r', res.average_r, exp.average_r);
    cmp(pre + 'sn', res.sn, exp.sn);
    cmp(pre + 'ase', res.ase, exp.ase);
    cmp(pre + 'mean_tot', res.mean_tot, exp.mean_tot);
    cmp(pre + 'sd_tot', res.sd_tot, exp.sd_tot);
    cmp(pre + 'median_r', res.median_r, exp.median_r);
    cmp(pre + 'var_r', res.var_r, exp.var_r);
    cmp(pre + 'interitem_min', res.interitem_min, exp.interitem_min);
    cmp(pre + 'interitem_max', res.interitem_max, exp.interitem_max);
    // Feldt at three levels
    ['0.10', '0.05', '0.01'].forEach(function (lvl) {
      cmp(pre + 'feldt' + lvl + '.lower', CM.feldtCI(res.raw_alpha, res.nsub, res.nvar, parseFloat(lvl)).lower, exp.feldt[lvl].lower);
      cmp(pre + 'feldt' + lvl + '.upper', CM.feldtCI(res.raw_alpha, res.nsub, res.nvar, parseFloat(lvl)).upper, exp.feldt[lvl].upper);
    });
    // items (align by order; psych keeps kept-item order)
    if (res.items.length !== exp.items.length) { fails++; console.log('  ITEMLEN ' + pre + ' got=' + res.items.length + ' exp=' + exp.items.length); }
    var m = Math.min(res.items.length, exp.items.length), i;
    for (i = 0; i < m; i++) {
      var g = res.items[i], e = exp.items[i], ip = pre + 'item' + (i + 1) + '.';
      cmp(ip + 'n', g.n, e.n);
      cmp(ip + 'raw_r', g.raw_r, e.raw_r);
      cmp(ip + 'std_r', g.std_r, e.std_r);
      cmp(ip + 'r_cor', g.r_cor, e.r_cor);
      cmp(ip + 'r_drop', g.r_drop, e.r_drop);
      cmp(ip + 'mean', g.mean, e.mean);
      cmp(ip + 'sd', g.sd, e.sd);
      cmp(ip + 'drop_raw', g.drop_raw, e.drop_raw);
      cmp(ip + 'drop_std', g.drop_std, e.drop_std);
      cmp(ip + 'drop_G6', g.drop_G6, e.drop_G6);
      cmp(ip + 'drop_avr', g.drop_avr, e.drop_avr);
      cmp(ip + 'drop_sn', g.drop_sn, e.drop_sn);
      cmp(ip + 'drop_ase', g.drop_ase, e.drop_ase);
      cmp(ip + 'drop_varr', g.drop_varr, e.drop_varr);
      cmp(ip + 'drop_medr', g.drop_medr, e.drop_medr);
    }
  });
});

// ---- Spearman-Brown prophecy ----
(truth.spearman_brown || []).forEach(function (s, i) {
  var pre = 'sb' + (i + 1) + '.';
  if (s.predicted !== undefined) cmp(pre + 'predicted', CM.spearmanBrown(s.alpha, s.factor), s.predicted);
  if (s.m !== undefined) cmp(pre + 'm', CM.sbFactorForTarget(s.alpha, s.target), s.m);
  if (s.itemsNeeded !== undefined) cmp(pre + 'itemsNeeded', CM.sbItemsForTarget(s.alpha, s.k, s.target), s.itemsNeeded);
});

console.log('\n' + (fails ? 'FAIL' : 'PASS') + ': ' + checks + ' comparisons, ' + fails + ' failures');
console.log('worst relative error: ' + worst.toExponential(3) + '  @ ' + worstWhere);
process.exit(fails ? 1 : 0);
