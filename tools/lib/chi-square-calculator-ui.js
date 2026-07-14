/* chi-square-calculator-ui.js - UI/compute/render engine for the chi-square tool.
   Externalized from the page so the rendered outerHTML stays under the page_audit
   size gate; math stays in chisq-math.js (R-verified vs chisq.test(), 219/219).
   Classic script: every onclick-referenced function is a top-level `function`
   declaration (global on window) so inline handlers resolve. state/SCENARIOS are
   top-level const (global lexical), used only by this file. GA tool_use/tool_copy
   wiring + the boot call live INLINE in the page. */

function $(id){ return document.getElementById(id); }
function fmt(x, d){ d = d == null ? 4 : d; if (!isFinite(x)) return '-'; return Number(x).toFixed(d).replace(/\.?0+$/,''); }
function fmtP(p){
  if (!isFinite(p)) return '-';
  if (p < 1e-4) return p.toExponential(3);
  if (p < 0.001) return p.toFixed(5);
  return p.toFixed(4);
}
function escapeHtml(s){ return String(s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
function magWord(v){ return v < 0.1 ? 'small' : (v < 0.3 ? 'small to medium' : (v < 0.5 ? 'medium' : 'large')); }

// ---- parsing ------------------------------------------------------------
// A token is a value only if it is a real number. Header rows (all labels)
// yield no numbers and are dropped; leading row-label columns (e.g. "Vaccine")
// are non-numeric tokens and are skipped, so labelled tables parse correctly.
var NUM_RE = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;
function parseTable(text){
  if (!text) return null;
  var lines = text.split(/\r?\n/).map(function(l){ return l.trim(); }).filter(function(l){ return l.length > 0; });
  if (lines.length === 0) return null;
  var rows = [];
  for (var li = 0; li < lines.length; li++){
    var tokens = lines[li].split(/[\t,;]+|\s+/).map(function(t){ return t.trim(); }).filter(function(t){ return t.length > 0; });
    var nums = [];
    for (var ti = 0; ti < tokens.length; ti++){
      if (NUM_RE.test(tokens[ti])) nums.push(Number(tokens[ti]));  // keep numbers, drop labels
    }
    if (nums.length === 0) continue;                                // pure header / label row
    rows.push(nums);
  }
  if (rows.length === 0) return null;
  var ncol = Math.max.apply(null, rows.map(function(r){ return r.length; }));
  for (var ri = 0; ri < rows.length; ri++){ while (rows[ri].length < ncol) rows[ri].push(0); }
  return rows;
}
function parseRow(text){
  var t = parseTable(text);
  if (!t) return null;
  return t.reduce(function(a, r){ return a.concat(r); }, []);
}

// ---- math delegates (R-verified lib) ------------------------------------
function chiIndependence(tbl, yates){ return window.ChisqMath.independence(tbl, yates); }
function chiGoF(observed, expected){ return window.ChisqMath.goodnessOfFit(observed, expected); }

// ---- state --------------------------------------------------------------
var state = {
  mode: 'independence',   // 'independence' | 'gof' | 'homogeneity'
  alpha: 0.05,
  scenario: 'vaccine',
  rawTable: '',
  rawExpected: '',
  yates: false,
  result: null
};

// ---- scenario presets ---------------------------------------------------
var SCENARIOS = {
  vaccine: {
    icon: '&#129514;',
    title: '2&times;2 vaccine',
    story: 'Vaccinated vs unvaccinated, infected vs not. Are vaccination and infection independent?',
    mode: 'independence',
    table: '\tInfected\tNotInfected\nVaccine\t20\t30\nPlacebo\t40\t10',
    yates: false
  },
  dietary: {
    icon: '&#129396;',
    title: '2&times;3 dietary',
    story: 'Two groups, three dietary outcomes (A / B / C). Chi-square = 7.41 on df = 2, p = 0.025, Cramer\'s V = 0.15.',
    mode: 'independence',
    table: '\tA\tB\tC\nGroup1\t50\t30\t20\nGroup2\t80\t100\t50',
    yates: false
  },
  income: {
    icon: '&#127891;',
    title: '3&times;3 income x education',
    story: 'Three income brackets crossed with three education levels. Larger table - df = 4.',
    mode: 'independence',
    table: '\tHS\tBA\tGrad\nLow\t40\t20\t10\nMid\t30\t50\t20\nHigh\t10\t30\t60',
    yates: false
  },
  dice: {
    icon: '&#127922;',
    title: 'GoF: dice fairness',
    story: 'A die rolled 600 times: 95, 110, 100, 90, 105, 100. Is the die fair? Uniform expected.',
    mode: 'gof',
    table: '95\t110\t100\t90\t105\t100',
    expected: ''
  },
  proportions: {
    icon: '&#128202;',
    title: 'GoF: expected proportions',
    story: 'Mendelian peas: 312, 102, 109, 31 against the 9:3:3:1 ratio. Classic genetics example.',
    mode: 'gof',
    table: '312\t102\t109\t31',
    expected: '0.5625\t0.1875\t0.1875\t0.0625'
  },
  custom: {
    icon: '&#9881;&#65039;',
    title: 'Custom',
    story: 'Paste your own table and pick a mode.',
    mode: 'independence',
    table: '',
    expected: ''
  }
};

// ---- UI controls --------------------------------------------------------
function setMode(mode){
  state.mode = mode;
  document.querySelectorAll('.mode').forEach(function(b){ b.classList.toggle('on', b.dataset.mode === mode); });
  var ge = $('gof-expected-row'); if (ge) ge.style.display = mode === 'gof' ? '' : 'none';
  var pl = $('paste-label');
  if (pl) pl.innerHTML = mode === 'gof'
    ? 'Paste observed counts <small>(one row, tab / space / comma)</small>'
    : 'Paste table <small>(TSV / CSV / spaces)</small>';
  var uw = $('method-use-when'), ex = $('method-example'), inn = $('method-inputs-needed');
  if (mode === 'independence'){
    if (uw) uw.textContent = 'You have a two-way table of counts and want to test whether row and column classifications are independent.';
    if (ex) ex.textContent = 'e.g. Does outcome (infected / not) depend on group (vaccine / placebo)?';
    if (inn) inn.innerHTML = '<li><code>tbl</code> a 2-D table of counts</li><li><code>&alpha;</code> significance level</li>';
  } else if (mode === 'gof'){
    if (uw) uw.textContent = 'You have a single row of observed counts and want to test whether they match a hypothesised distribution (uniform by default).';
    if (ex) ex.textContent = 'e.g. A die rolled 600 times: are the six face counts consistent with a fair die?';
    if (inn) inn.innerHTML = '<li><code>obs</code> observed counts</li><li><code>exp</code> expected counts or proportions (optional)</li><li><code>&alpha;</code> significance level</li>';
  } else {
    if (uw) uw.textContent = 'You have several samples (rows are samples; row totals are fixed by design) and want to test whether they share the same column distribution.';
    if (ex) ex.textContent = 'e.g. Two clinics, three outcome categories: does the outcome distribution differ across clinics?';
    if (inn) inn.innerHTML = '<li><code>tbl</code> a 2-D table of counts</li><li><code>&alpha;</code> significance level</li>';
  }
  recompute();
}

function setAlpha(a){
  state.alpha = a;
  document.querySelectorAll('#conf-picker .conf-btn').forEach(function(b){ b.classList.toggle('active', Number(b.dataset.alpha) === a); });
  var ac = $('alpha-custom'); if (ac) ac.value = '';
  recompute();
}
function setAlphaFromInput(){
  var v = Number($('alpha-custom').value);
  if (isFinite(v) && v > 0 && v < 1){
    state.alpha = v;
    document.querySelectorAll('#conf-picker .conf-btn').forEach(function(b){ b.classList.remove('active'); });
    recompute();
  }
}

function loadScenario(name){
  var sc = SCENARIOS[name];
  if (!sc) return;
  state.scenario = name;
  document.querySelectorAll('.scenario-card').forEach(function(b){ b.classList.toggle('active', b.dataset.scenario === name); });
  var si = $('sc-icon'); if (si) si.innerHTML = sc.icon;
  var st = $('sc-title'); if (st) st.innerHTML = sc.title;
  var ss = $('sc-story'); if (ss) ss.textContent = sc.story;
  var scx = $('scenario-context'); if (scx) scx.classList.add('show');
  setMode(sc.mode);
  $('paste-box').value = sc.table || '';
  var ge = $('gof-expected'); if (ge) ge.value = sc.expected || '';
  state.yates = !!sc.yates;
  var yt = $('yates-toggle'); if (yt) yt.checked = state.yates;
  // Sync state from the freshly loaded fields. recompute()/updateRCode read
  // state.rawExpected, so without this the preset's expected counts are ignored
  // and GoF falls back to uniform (the proportions preset was silently wrong).
  state.rawTable = $('paste-box').value;
  state.rawExpected = ge ? ge.value : '';
  recompute();
}

function clearScenario(){
  state.scenario = null;
  document.querySelectorAll('.scenario-card').forEach(function(b){ b.classList.remove('active'); });
  var scx = $('scenario-context'); if (scx) scx.classList.remove('show');
}

function onPasteChange(){
  state.rawTable = $('paste-box').value;
  state.rawExpected = $('gof-expected') ? $('gof-expected').value : '';
  state.yates = $('yates-toggle') ? $('yates-toggle').checked : false;
  recompute();
}

// ---- recompute + render -------------------------------------------------
function recompute(){
  var res;
  if (state.mode === 'gof'){
    var obs = parseRow($('paste-box').value);
    if (!obs || obs.length < 2){ res = { error: 'Enter at least 2 observed counts (one row).' }; }
    else {
      var exp = state.rawExpected ? parseRow(state.rawExpected) : null;
      res = chiGoF(obs, exp);
    }
    var yr0 = $('yates-row'); if (yr0) yr0.style.display = 'none';
  } else {
    var tbl = parseTable($('paste-box').value);
    if (!tbl || tbl.length < 2 || tbl[0].length < 2){
      res = { error: 'Enter at least a 2x2 table of counts.' };
      var yr1 = $('yates-row'); if (yr1) yr1.style.display = 'none';
    } else {
      var is2x2 = (tbl.length === 2 && tbl[0].length === 2);
      var yr2 = $('yates-row'); if (yr2) yr2.style.display = is2x2 ? '' : 'none';
      var useYates = is2x2 ? state.yates : false;
      res = chiIndependence(tbl, useYates);
    }
  }
  state.result = res;
  render();
}

function render(){
  var r = state.result;
  updateBanner();
  var ie = $('ierr');
  var effK = state.mode === 'gof' ? "Cohen's w" : "Cramer's V";

  if (!r || r.error){
    var vc = $('vchip'); if (vc){ vc.textContent = 'no result'; vc.className = 'vchip na'; }
    $('result-headline').textContent = 'Enter a table to see the result';
    $('verdict-line').innerHTML = '';
    $('stat-chi').textContent = '-'; $('stat-df').textContent = '-'; $('stat-p').textContent = '-';
    $('stat-eff-k').textContent = effK; $('stat-eff').textContent = '-'; $('stat-n').textContent = '-';
    $('residuals-area').innerHTML = '';
    $('diag-area').innerHTML = '';
    $('english-read').style.display = 'none';
    $('inference-banner').innerHTML = '<span class="ik">Plain-English read</span>Enter a table above to see a plain-English verdict.';
    $('report').textContent = '';
    ['h1c','h2c','h3c','h4c'].forEach(function(id){ var el = $(id); if (el) el.textContent = '-'; });
    drawMosaic(null);
    updateRCode();
    if (ie){ if (r && r.error){ ie.textContent = r.error; ie.classList.add('show'); } else { ie.textContent = ''; ie.classList.remove('show'); } }
    return;
  }
  if (ie){ ie.textContent = ''; ie.classList.remove('show'); }

  var reject = r.p <= state.alpha;

  // verdict chip + headline
  var vc2 = $('vchip');
  if (vc2){ vc2.textContent = reject ? 'p < ' + state.alpha : 'p ≥ ' + state.alpha; vc2.className = 'vchip' + (reject ? '' : ' na'); }
  var headline;
  if (state.mode === 'gof') headline = reject ? 'Counts differ from the expected distribution' : 'Counts are consistent with expectation';
  else headline = reject ? 'The variables are associated' : 'No association detected';
  $('result-headline').textContent = headline;

  var eff = state.mode === 'gof' ? ('Cohen&rsquo;s w = ' + fmt(r.cohenW, 4)) : ('Cramer&rsquo;s V = ' + fmt(r.cramerV, 4));
  $('verdict-line').innerHTML = (reject
    ? '<b>Reject H<sub>0</sub></b> at &alpha; = ' + state.alpha + '. '
    : '<b>Fail to reject H<sub>0</sub></b> at &alpha; = ' + state.alpha + '. ')
    + eff + (r.yates ? ' (Yates corrected)' : '') + '.';

  // stats grid
  $('stat-chi').textContent = fmt(r.chi, 4);
  $('stat-df').textContent = r.df;
  $('stat-p').textContent = fmtP(r.p);
  $('stat-eff-k').textContent = effK;
  $('stat-eff').textContent = state.mode === 'gof' ? fmt(r.cohenW, 4) : fmt(r.cramerV, 4);
  $('stat-n').textContent = r.N;

  // residuals table
  if (state.mode === 'gof') renderGoFResiduals(r);
  else renderTableResiduals(r);

  // diagnostics
  var callouts = [];
  if (state.mode === 'gof'){
    var minEg = Math.min.apply(null, r.expected);
    if (minEg < 5) callouts.push({ type:'warn', text:'Smallest expected count is ' + fmt(minEg, 2) + ' (&lt; 5). The chi-square approximation may be unreliable.' });
    if (r.N < 30) callouts.push({ type:'warn', text:'Total n = ' + r.N + '. Small samples weaken the chi-square approximation.' });
  } else {
    var nLow = 0, minEi = Infinity;
    for (var i = 0; i < r.R; i++) for (var j = 0; j < r.C; j++){
      if (r.expected[i][j] < 5) nLow++;
      if (r.expected[i][j] < minEi) minEi = r.expected[i][j];
    }
    if (nLow > 0) callouts.push({ type:'warn', text: nLow + ' cell' + (nLow > 1 ? 's' : '') + ' have expected count &lt; 5 (smallest = ' + fmt(minEi, 2) + '). Consider Fisher&rsquo;s exact test.', action:'fisher' });
    if (r.N < 30) callouts.push({ type:'warn', text:'Total n = ' + r.N + '. The chi-square approximation may be unreliable.' });
    if (r.expected.some(function(row){ return row.some(function(e){ return e === 0; }); })) callouts.push({ type:'danger', text:'Some cells have expected count = 0. Collapse categories or use an exact test.' });
  }
  $('diag-area').innerHTML = callouts.map(function(c){
    var btn = c.action === 'fisher' ? ' <button class="fisher-button" type="button" onclick="switchToFisher()">Switch to Fisher&rsquo;s exact</button>' : '';
    return '<div class="callout ' + (c.type === 'danger' ? 'danger' : '') + '"><span class="callout-icon" aria-hidden="true">&#9888;</span><span>' + c.text + btn + '</span></div>';
  }).join('');

  renderEnglish(r);

  // how-this-is-computed live steps
  $('h1c').innerHTML = 'Expected counts under the null: E = row total &times; column total / N for independence, or N &times; p for goodness-of-fit. The smallest expected count here is <b>' + fmt(r.minExpected, 2) + '</b>.';
  $('h2c').innerHTML = 'Pearson pools the scaled squared deviations: &chi;&sup2; = &Sigma; (O &minus; E)&sup2; / E = <b>' + fmt(r.chi, 3) + '</b> across df = <b>' + r.df + '</b>' + (r.yates ? ' (Yates corrected)' : '') + '.';
  $('h3c').innerHTML = 'The p-value <b>' + fmtP(r.p) + '</b> is the upper-tail area of the chi-square distribution with df = ' + r.df + '. That is ' + (reject ? 'below' : 'at or above') + ' &alpha; = ' + state.alpha + '.';
  var effVal = state.mode === 'gof' ? r.cohenW : r.cramerV;
  $('h4c').innerHTML = 'Effect size ' + effK + ' = <b>' + fmt(effVal, 3) + '</b> sizes the association independent of sample size (' + magWord(effVal) + ').';

  // report line (journal-ready, copyable)
  var report;
  if (state.mode === 'gof'){
    report = 'χ²(' + r.df + ', N = ' + r.N + ') = ' + fmt(r.chi, 3) + ', p = ' + fmtP(r.p) + ", Cohen's w = " + fmt(r.cohenW, 3) + '. Chi-square goodness-of-fit test.';
  } else {
    var nm = state.mode === 'homogeneity' ? 'homogeneity' : 'independence';
    report = 'χ²(' + r.df + ', N = ' + r.N + ') = ' + fmt(r.chi, 3) + ', p = ' + fmtP(r.p) + ", Cramer's V = " + fmt(r.cramerV, 3) + '. Chi-square test of ' + nm + '.';
  }
  $('report').textContent = report;

  drawMosaic(r);
  updateRCode();
  renderInferenceBanner(r);
}

function renderInferenceBanner(r){
  var el = $('inference-banner'); if (!el) return;
  if (!r || r.error){ el.innerHTML = '<span class="ik">Plain-English read</span>Enter a table above to see a plain-English verdict.'; return; }
  var reject = r.p <= state.alpha;
  var verdictWord = reject ? 'There is evidence' : 'There is no evidence';
  var verdictCls = reject ? 'sig' : 'insig';
  var pStr = fmtP(r.p);
  var html = '';
  if (state.mode === 'gof'){
    var obs = parseRow($('paste-box').value) || [];
    var maxIdx = 0, maxAbs = 0;
    for (var i = 0; i < r.k; i++){ if (Math.abs(r.stdres[i]) > maxAbs){ maxAbs = Math.abs(r.stdres[i]); maxIdx = i; } }
    var o = obs[maxIdx], e = r.expected[maxIdx];
    var dir = o > e ? 'above' : 'below';
    var w = fmt(r.cohenW, 3);
    var cellNote = 'category <b>' + (maxIdx + 1) + '</b> (observed <b>' + o + '</b> ' + dir + ' expected <b>' + fmt(e, 2) + '</b>)';
    html = 'The <em>chi-square goodness-of-fit test</em> on these <b>' + r.k + '</b> categories gives ' +
           '&chi;&sup2; = <b>' + fmt(r.chi, 3) + '</b>, df = <b>' + r.df + '</b>, p = <b>' + pStr + '</b>. ' +
           '<span class="' + verdictCls + '">' + verdictWord + '</span> against the hypothesised distribution at &alpha; = ' + state.alpha + '. ' +
           "Cohen's w = <b>" + w + '</b> (<em>' + magWord(r.cohenW) + '</em> effect). The strongest deviation is in ' + cellNote + '.';
  } else {
    var mi = 0, mj = 0, maxAbs2 = 0;
    for (var a = 0; a < r.R; a++) for (var b = 0; b < r.C; b++){ if (Math.abs(r.stdres[a][b]) > maxAbs2){ maxAbs2 = Math.abs(r.stdres[a][b]); mi = a; mj = b; } }
    var tbl = parseTable($('paste-box').value) || [[0]];
    var o2 = tbl[mi] && tbl[mi][mj] !== undefined ? tbl[mi][mj] : 0;
    var e2 = r.expected[mi][mj];
    var dir2 = o2 > e2 ? 'above' : 'below';
    var v = fmt(r.cramerV, 3);
    var cellNote2 = '(row <b>' + (mi + 1) + '</b>, col <b>' + (mj + 1) + '</b>) where observed <b>' + o2 + '</b> is ' + dir2 + ' expected <b>' + fmt(e2, 2) + '</b>';
    html = 'The <em>chi-square test of ' + (state.mode === 'homogeneity' ? 'homogeneity' : 'independence') + '</em> on the <b>' + r.R + '&times;' + r.C + '</b> table gives ' +
           '&chi;&sup2; = <b>' + fmt(r.chi, 3) + '</b>, df = <b>' + r.df + '</b>, p = <b>' + pStr + '</b>. ' +
           '<span class="' + verdictCls + '">' + verdictWord + '</span> that the two variables are associated at &alpha; = ' + state.alpha + '. ' +
           "Cramer's V = <b>" + v + '</b> (<em>' + magWord(r.cramerV) + '</em> effect). The strongest cell deviation is at ' + cellNote2 + '.';
  }
  el.innerHTML = '<span class="ik">Plain-English read</span>' + html;
}

function residCellClass(s){
  if (s >= 1.96) return 'high-pos';
  if (s <= -1.96) return 'high-neg';
  if (s >= 1) return 'med-pos';
  if (s <= -1) return 'med-neg';
  return '';
}

function renderTableResiduals(r){
  var tbl = parseTable($('paste-box').value) || [];
  var html = '<div class="restable-wrap"><table class="residuals-table"><thead><tr><th></th>';
  for (var j0 = 0; j0 < r.C; j0++) html += '<th>C' + (j0 + 1) + '</th>';
  html += '<th>Total</th></tr></thead><tbody>';
  for (var i = 0; i < r.R; i++){
    html += '<tr><th>R' + (i + 1) + '</th>';
    for (var j = 0; j < r.C; j++){
      var o = tbl[i] && tbl[i][j] !== undefined ? tbl[i][j] : 0;
      var e = r.expected[i][j];
      var s = r.stdres[i][j];
      html += '<td class="cell ' + residCellClass(s) + '"><span class="o">' + o + '</span><span class="e">E=' + fmt(e, 1) + '</span><span class="r">r=' + fmt(s, 2) + '</span></td>';
    }
    html += '<td class="tot">' + r.rowTot[i] + '</td></tr>';
  }
  html += '<tr class="totrow"><th>Total</th>';
  for (var j2 = 0; j2 < r.C; j2++) html += '<td>' + r.colTot[j2] + '</td>';
  html += '<td>' + r.N + '</td></tr></tbody></table></div>';
  html += '<div class="residuals-legend">Cell = observed / expected / std. residual. <span class="swatch pos"></span> r &ge; 1.96 <span class="swatch neg"></span> r &le; -1.96</div>';
  $('residuals-area').innerHTML = html;
}

function renderGoFResiduals(r){
  var obs = parseRow($('paste-box').value) || [];
  var html = '<div class="restable-wrap"><table class="residuals-table"><thead><tr><th>Category</th>';
  for (var i0 = 0; i0 < r.k; i0++) html += '<th>' + (i0 + 1) + '</th>';
  html += '</tr></thead><tbody>';
  html += '<tr><th>Observed</th>';
  for (var i1 = 0; i1 < r.k; i1++) html += '<td>' + obs[i1] + '</td>';
  html += '</tr><tr><th>Expected</th>';
  for (var i2 = 0; i2 < r.k; i2++) html += '<td>' + fmt(r.expected[i2], 2) + '</td>';
  html += '</tr><tr><th>Std. resid.</th>';
  for (var i = 0; i < r.k; i++){
    html += '<td class="cell ' + residCellClass(r.stdres[i]) + '">' + fmt(r.stdres[i], 2) + '</td>';
  }
  html += '</tr></tbody></table></div>';
  html += '<div class="residuals-legend">Std. residuals beyond |1.96| are highlighted. <span class="swatch pos"></span> r &ge; 1.96 <span class="swatch neg"></span> r &le; -1.96</div>';
  $('residuals-area').innerHTML = html;
}

function renderEnglish(r){
  var el = $('english-read'); if (!el) return;
  if (state.mode === 'gof'){
    var obs = parseRow($('paste-box').value) || [];
    var maxIdx = 0, maxAbs = 0;
    for (var i = 0; i < r.k; i++){ if (Math.abs(r.stdres[i]) > maxAbs){ maxAbs = Math.abs(r.stdres[i]); maxIdx = i; } }
    var o = obs[maxIdx], e = r.expected[maxIdx];
    var dir = o > e ? 'above' : 'below';
    el.style.display = '';
    el.innerHTML = 'The strongest deviation is in <b>category ' + (maxIdx + 1) + '</b>, where the observed count of <b>' + o + '</b> is ' + dir + ' the expected <b>' + fmt(e, 2) + '</b> (std. residual <b>' + fmt(r.stdres[maxIdx], 2) + '</b>).';
  } else {
    var mi = 0, mj = 0, maxAbs2 = 0;
    for (var a = 0; a < r.R; a++) for (var b = 0; b < r.C; b++){ if (Math.abs(r.stdres[a][b]) > maxAbs2){ maxAbs2 = Math.abs(r.stdres[a][b]); mi = a; mj = b; } }
    var tbl = parseTable($('paste-box').value) || [[0]];
    var o2 = tbl[mi] && tbl[mi][mj] !== undefined ? tbl[mi][mj] : 0;
    var e2 = r.expected[mi][mj];
    var dir2 = o2 > e2 ? 'above' : 'below';
    el.style.display = '';
    el.innerHTML = 'The strongest deviation is in <b>(row ' + (mi + 1) + ', col ' + (mj + 1) + ')</b>, where the observed count of <b>' + o2 + '</b> is ' + dir2 + ' the expected <b>' + fmt(e2, 2) + '</b> (std. residual <b>' + fmt(r.stdres[mi][mj], 2) + '</b>).';
  }
}

function updateBanner(){
  var flavorMap = { independence: 'test of independence', gof: 'goodness-of-fit test', homogeneity: 'test of homogeneity' };
  var ft = $('banner-flavor-text'); if (ft) ft.textContent = flavorMap[state.mode];
  var fs = $('banner-flavor-select'); if (fs) fs.value = state.mode;
  var t = parseTable($('paste-box').value);
  var label = 'your table';
  if (state.mode === 'gof'){
    var obs = parseRow($('paste-box').value);
    label = obs ? ('1×' + obs.length + ' observed') : 'observed counts';
  } else if (t){
    label = t.length + '×' + t[0].length + ' table';
  }
  var bt = $('banner-table-text'); if (bt) bt.textContent = label;
  var ba = $('banner-alpha'); if (ba) ba.textContent = state.alpha;
}

// ---- mosaic plot (SVG 360x200) -----------------------------------------
function drawMosaic(r){
  var svg = $('viz-svg'); if (!svg) return;
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  var NS = 'http://www.w3.org/2000/svg';
  if (!r || r.error){
    var t0 = document.createElementNS(NS, 'text');
    t0.setAttribute('x', '180'); t0.setAttribute('y', '104');
    t0.setAttribute('text-anchor', 'middle'); t0.setAttribute('class', 'mosaic-empty');
    t0.textContent = 'Paste a table to see the mosaic';
    svg.appendChild(t0);
    var vr0 = $('viz-readout'); if (vr0) vr0.innerHTML = '';
    return;
  }
  var W = 360, H = 200, pad = 24, innerW = W - 2 * pad, innerH = H - 2 * pad;
  if (state.mode === 'gof'){
    var obs = parseRow($('paste-box').value);
    var total = obs.reduce(function(a, b){ return a + b; }, 0) || 1;
    var x = pad;
    for (var i = 0; i < r.k; i++){
      var w = (obs[i] / total) * innerW;
      var rect = document.createElementNS(NS, 'rect');
      rect.setAttribute('x', x); rect.setAttribute('y', pad);
      rect.setAttribute('width', Math.max(0, w - 1)); rect.setAttribute('height', innerH);
      rect.setAttribute('fill', residColor(r.stdres[i]));
      rect.setAttribute('stroke', '#ffffff'); rect.setAttribute('stroke-width', '1');
      svg.appendChild(rect);
      if (w > 18){
        var tx = document.createElementNS(NS, 'text');
        tx.setAttribute('x', x + w / 2); tx.setAttribute('y', pad + innerH / 2 + 4);
        tx.setAttribute('text-anchor', 'middle'); tx.setAttribute('class', 'mosaic-lab');
        tx.textContent = obs[i];
        svg.appendChild(tx);
      }
      x += w;
    }
  } else {
    var tbl = parseTable($('paste-box').value);
    var x2 = pad;
    for (var a = 0; a < r.R; a++){
      var wRow = (r.rowTot[a] / r.N) * innerW;
      var y = pad;
      for (var b = 0; b < r.C; b++){
        var hCol = (r.rowTot[a] > 0 ? tbl[a][b] / r.rowTot[a] : 0) * innerH;
        var rc = document.createElementNS(NS, 'rect');
        rc.setAttribute('x', x2); rc.setAttribute('y', y);
        rc.setAttribute('width', Math.max(0, wRow - 1)); rc.setAttribute('height', Math.max(0, hCol - 1));
        rc.setAttribute('fill', residColor(r.stdres[a][b]));
        rc.setAttribute('stroke', '#ffffff'); rc.setAttribute('stroke-width', '1');
        svg.appendChild(rc);
        if (wRow > 30 && hCol > 16){
          var t2 = document.createElementNS(NS, 'text');
          t2.setAttribute('x', x2 + wRow / 2); t2.setAttribute('y', y + hCol / 2 + 3);
          t2.setAttribute('text-anchor', 'middle'); t2.setAttribute('class', 'mosaic-lab');
          t2.textContent = tbl[a][b];
          svg.appendChild(t2);
        }
        y += hCol;
      }
      x2 += wRow;
    }
  }
  var vr = $('viz-readout');
  if (vr){
    var effTxt = state.mode === 'gof' ? "Cohen's w = <b>" + fmt(r.cohenW, 3) + "</b>" : "Cramer's V = <b>" + fmt(r.cramerV, 3) + "</b>";
    vr.innerHTML = '&chi;&sup2; = <b>' + fmt(r.chi, 3) + '</b> &middot; df = <b>' + r.df + '</b> &middot; p = <b>' + fmtP(r.p) + '</b> &middot; ' + effTxt;
  }
}

function residColor(s){
  // Diverging: green (positive) <-> light grey (~0) <-> red (negative).
  if (!isFinite(s)) return '#cfd3da';
  var a = Math.min(1, Math.abs(s) / 4);
  if (s >= 0) return 'rgb(' + Math.round(225 - 175 * a) + ',' + Math.round(232 - 60 * a) + ',' + Math.round(225 - 165 * a) + ')';
  return 'rgb(' + Math.round(225 - 50 * a) + ',' + Math.round(232 - 175 * a) + ',' + Math.round(225 - 165 * a) + ')';
}

// ---- R code emitter (static live block) ---------------------------------
function updateRCode(){
  var pre = $('rcodepre'); if (!pre) return;
  var code;
  if (state.mode === 'gof'){
    var obs = parseRow($('paste-box').value) || [95, 110, 100, 90, 105, 100];
    var expRaw = parseRow(state.rawExpected || '');
    var obsStr = obs.join(', ');
    var body;
    if (expRaw && expRaw.length === obs.length){
      var sumE = expRaw.reduce(function(a, b){ return a + b; }, 0);
      var isProp = Math.abs(sumE - 1) < 1e-3;
      body = 'observed <- c(' + obsStr + ')\n'
           + 'expected <- c(' + expRaw.join(', ') + ')' + (isProp ? '  # proportions; chisq.test rescales' : '') + '\n'
           + 'result <- chisq.test(observed, p = expected' + (isProp ? '' : ' / sum(expected)') + ')\n'
           + 'result\nresult$expected\nresult$stdres';
    } else {
      body = 'observed <- c(' + obsStr + ')\n'
           + '# Default: uniform expected (each category equally likely)\n'
           + 'result <- chisq.test(observed)\n'
           + 'result\nresult$expected\nresult$stdres';
    }
    code = body + "\n\n# Effect size (Cohen's w)\nw <- sqrt(result$statistic / sum(observed))\nw";
  } else {
    var tbl = parseTable($('paste-box').value) || [[20, 30], [40, 10]];
    var R = tbl.length, C = tbl[0].length;
    var byRow = [];
    for (var i = 0; i < R; i++) for (var j = 0; j < C; j++) byRow.push(tbl[i][j]);
    var yatesArg = state.yates && R === 2 && C === 2 ? 'TRUE' : 'FALSE';
    code = 'tbl <- matrix(c(' + byRow.join(', ') + '), nrow = ' + R + ', byrow = TRUE)\n'
         + 'rownames(tbl) <- paste0("R", 1:' + R + ')\n'
         + 'colnames(tbl) <- paste0("C", 1:' + C + ')\n'
         + 'tbl\n\n'
         + 'result <- chisq.test(tbl, correct = ' + yatesArg + ')\n'
         + 'result\nresult$expected\nresult$stdres\n\n'
         + 'library(rcompanion)\ncramerV(tbl, ci = TRUE)\n\n'
         + 'mosaicplot(tbl, shade = TRUE, las = 2)';
    var needFisher = false;
    if (state.result && !state.result.error){
      for (var a = 0; a < R; a++) for (var b = 0; b < C; b++){ if (state.result.expected[a][b] < 5) needFisher = true; }
    }
    if (needFisher) code += '\n\n# Some expected counts < 5; consider:\nfisher.test(tbl)';
  }
  pre.textContent = code;
}

// ---- copy + toasts ------------------------------------------------------
function copyReport(){
  var t = $('report'); if (!t || !t.textContent) return;
  navigator.clipboard.writeText(t.textContent).then(function(){
    var b = $('copybtn'); if (b){ b.textContent = 'Copied'; setTimeout(function(){ b.textContent = 'Copy report line'; }, 1400); }
  });
}
function copyRCode(){
  var pre = $('rcodepre'); if (!pre) return;
  navigator.clipboard.writeText(pre.textContent).then(function(){
    var b = $('rcopy'); if (b){ b.textContent = 'Copied'; setTimeout(function(){ b.textContent = 'Copy code'; }, 1400); }
  });
}
function switchToFisher(){ toast('Added fisher.test(tbl) to the R code below.'); }

function toast(msg){
  var area = $('toast-area'); if (!area) return;
  var t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  area.appendChild(t);
  setTimeout(function(){ t.remove(); }, 3200);
}
