/* anova-output-interpreter UI engine (externalized for page weight).
   Top-level globals: inline onclick handlers in the page resolve against these.
   Needs window.ANOVAMath (+ LMMath, TTestMath) loaded first; GA firing via
   inline anovaTrackUse()/anovaTrackCopy(). */
function $(id){ return document.getElementById(id); }
function fmt(x, d){ d = (d == null) ? 4 : d; if (!isFinite(x)) return '-'; var s = Number(x).toFixed(d); return s.replace(/\.?0+$/,''); }
function fmtP(p){ if (!isFinite(p)) return '-'; if (p < 0.0001) return '<0.0001'; return Number(p).toFixed(4).replace(/\.?0+$/,''); }
function escapeHtml(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c];}); }

// ============================================================
// Scenarios: real R output for paste-and-parse
// ============================================================
var SCENARIOS = {
  // One-way aov(mpg ~ cyl, mtcars) with cyl a 3-level factor. Type I.
  'oneway': {
    type: 'I',
    output:
'            Df Sum Sq Mean Sq F value   Pr(>F)    \n' +
'cyl          2  824.8   412.4    39.7 4.98e-09 ***\n' +
'Residuals   29  301.3    10.4                     \n' +
'---\n' +
"Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1\n"
  },
  // car::Anova(lm(len ~ supp*dose, ToothGrowth), type=2). Balanced factorial.
  'factorial': {
    type: 'II',
    output:
'Anova Table (Type II tests)\n\n' +
'Response: len\n' +
'           Sum Sq Df F value    Pr(>F)    \n' +
'supp       205.35  1  15.572 0.0002312 ***\n' +
'dose      2426.43  2  92.000 < 2.2e-16 ***\n' +
'supp:dose  108.32  2   4.107 0.0218603 *  \n' +
'Residuals  712.11 54                      \n' +
'---\n' +
"Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1\n"
  },
  // car::Anova(lm(breaks ~ wool+tension, warpbreaks), type=2). Additive.
  'additive': {
    type: 'II',
    output:
'Anova Table (Type II tests)\n\n' +
'Response: breaks\n' +
'          Sum Sq Df F value   Pr(>F)   \n' +
'wool       450.7  1  3.3393 0.073614 . \n' +
'tension   2034.3  2  7.5367 0.001378 **\n' +
'Residuals 6747.9 50                    \n' +
'---\n' +
"Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1\n"
  },
  // car::Anova(lm(mpg ~ cyl+gear, mtcars), type=3). Unbalanced, intercept row.
  'type3': {
    type: 'III',
    output:
'Anova Table (Type III tests)\n\n' +
'Response: mpg\n' +
'             Sum Sq Df  F value    Pr(>F)    \n' +
'(Intercept) 1982.84  1 182.7123 1.554e-13 ***\n' +
'cyl          349.79  2  16.1162 2.477e-05 ***\n' +
'gear           8.25  2   0.3802    0.6873    \n' +
'Residuals    293.01 27                       \n' +
'---\n' +
"Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1\n"
  },
  'custom': { type: 'I', output: '' }
};

// ============================================================
// Parser - handles both column orders:
//   aov():       Df  Sum Sq  Mean Sq  F value  Pr(>F)
//   car::Anova:  Sum Sq  Df  F value  Pr(>F)     (Df comes 2nd)
// Detect the header row, then parse subsequent rows.
// ============================================================
function detectFormat(text){
  // Detect car::Anova banner
  var m = text.match(/Anova Table \(Type ([IV]+) tests?\)/i);
  if (m) return { format: 'car', type: m[1].toUpperCase() };
  // Look for header line patterns
  var lines = text.split(/\r?\n/);
  for (var i = 0; i < lines.length; i++){
    var L = lines[i];
    // car::Anova printed without banner: header has "Sum Sq" before "Df"
    if (/Sum Sq\s+Df/.test(L) && /F value/.test(L)) return { format: 'car', type: null };
    // aov-style: Df comes before Sum Sq
    if (/\bDf\s+Sum Sq\b/.test(L) && /F value/.test(L)) return { format: 'aov', type: 'I' };
  }
  return { format: 'unknown', type: null };
}

function parseNumberCell(s){
  if (s == null) return NaN;
  s = String(s).trim();
  if (s === '' || s === 'NA') return NaN;
  // Handle "< 2.2e-16" pattern
  var m = s.match(/^<\s*([0-9.eE+\-]+)/);
  if (m) return Number(m[1]) * 0.5; // conservatively mid-range; flag below threshold
  // Strip stars and signif codes residue
  s = s.replace(/[*.]+\s*$/, '').trim();
  s = s.replace(/,/g, '');
  var v = Number(s);
  return isFinite(v) ? v : NaN;
}

function tokenizeRow(line){
  // R prints a stars suffix like " ***" or " . " - strip it first so the
  // remaining cells are pure numbers or "NA" / "<".
  var s = line.replace(/\s+(\*{1,3}|\.)\s*$/, '').trim();
  // Numbers in an ANOVA table never contain spaces, so split on ANY whitespace
  // (the columns in R's printed table are 1+ spaces wide).
  var parts = s.split(/\s+/).filter(function(t){return t.length > 0;});
  // Glue back "< 2.2e-16" -> "<2.2e-16" so it counts as one cell
  var out = [];
  for (var i = 0; i < parts.length; i++){
    if (parts[i] === '<' && i+1 < parts.length){
      out.push('<' + parts[i+1]); i++;
    } else { out.push(parts[i]); }
  }
  return out;
}

// A token that begins the numeric part of a row: a number, a leading "<"
// (as in "< 2.2e-16"), or NA. Everything before the first such token is the
// term label. This is order-of-magnitude more robust than splitting on a
// 2-space gap: R right-aligns columns, so the widest row label (often
// "(Intercept)" or "Residuals") is followed by only ONE space.
function looksNumeric(t){
  return t === 'NA' || t === '<' || /^<?[-+]?[0-9.]/.test(t);
}

function parseAnovaTable(text){
  var fmtInfo = detectFormat(text);
  if (fmtInfo.format === 'unknown') {
    return { ok: false, error: 'Could not detect ANOVA table format. Header line should contain "Df", "Sum Sq", and "F value".' };
  }
  var lines = text.split(/\r?\n/);
  var headerIdx = -1;
  for (var i = 0; i < lines.length; i++){
    if (/Sum Sq/.test(lines[i]) && /F value/.test(lines[i])) { headerIdx = i; break; }
  }
  if (headerIdx < 0) return { ok: false, error: 'No data header line (Df / Sum Sq / F value) found.' };

  var rows = [];
  var residual = null;
  var intercept = null;
  for (var j = headerIdx + 1; j < lines.length; j++){
    var raw = lines[j];
    if (!raw || /^\s*$/.test(raw)) continue;
    if (/^---/.test(raw)) break;
    if (/^Signif/.test(raw)) break;
    if (/^Response\s*:/.test(raw)) continue;

    // Split the row into a term LABEL + a numeric TAIL at the first
    // numeric-looking token. Handles single-space alignment after wide labels
    // ("(Intercept) 1982.84", "Residuals 6747.9") that a 2-space split misses.
    var toks = raw.replace(/^\s+/, '').replace(/\s+$/, '').split(/\s+/);
    var ni = 0;
    while (ni < toks.length && !looksNumeric(toks[ni])) ni++;
    if (ni === 0) ni = 1;                 // safety: always keep >=1 label token
    var name = toks.slice(0, ni).join(' ').trim();
    var tail = toks.slice(ni).join(' ');
    var cells = tokenizeRow(tail);
    if (cells.length < 2) continue;

    var df, ss, ms, F, p;
    if (fmtInfo.format === 'aov'){
      // Df, Sum Sq, Mean Sq, F value, Pr(>F)
      df = parseNumberCell(cells[0]);
      ss = parseNumberCell(cells[1]);
      ms = parseNumberCell(cells[2]);
      F  = parseNumberCell(cells[3]);
      p  = parseNumberCell(cells[4]);
    } else {
      // Sum Sq, Df, F value, Pr(>F)
      ss = parseNumberCell(cells[0]);
      df = parseNumberCell(cells[1]);
      F  = parseNumberCell(cells[2]);
      p  = parseNumberCell(cells[3]);
      ms = isFinite(df) && df > 0 ? ss / df : NaN;
    }
    var rec = { term: name, df: df, ss: ss, ms: ms, F: F, p: p, raw: raw };
    if (/^Residuals?$/i.test(name)) { residual = rec; continue; }
    if (/^\(Intercept\)$/i.test(name)) { intercept = rec; continue; }
    if (!isFinite(ss) && !isFinite(df)) continue;
    rows.push(rec);
  }

  if (rows.length === 0) return { ok: false, error: 'No term rows found after header.' };

  // ---- SS totals + degrees of freedom off the parsed table ----
  var ssTerms = 0;
  rows.forEach(function(r){ if (isFinite(r.ss)) ssTerms += r.ss; });
  var ssResid = residual && isFinite(residual.ss) ? residual.ss : 0;
  var ssTotal = ssTerms + ssResid;                 // column total (non-intercept)
  var dfResid = residual && isFinite(residual.df) ? residual.df : NaN;
  var dfTerms = 0;
  rows.forEach(function(r){ if (isFinite(r.df)) dfTerms += r.df; });
  var n = isFinite(dfResid) ? dfResid + dfTerms + 1 : NaN; // total obs from df
  var msResid = (isFinite(ssResid) && isFinite(dfResid) && dfResid > 0) ? ssResid / dfResid : NaN;
  var canRecompute = isFinite(msResid) && msResid > 0 && isFinite(dfResid);

  // ---- RE-COMPUTE MS, F, p and every effect size from SS + df (verified) ----
  // The parsed F/p are kept as .Fparsed/.pParsed only for a sanity comparison;
  // everything the tool DISPLAYS is recomputed here via ANOVAMath.
  rows.forEach(function(r){
    r.Fparsed = r.F; r.pParsed = r.p;
    if (canRecompute && isFinite(r.ss) && isFinite(r.df) && r.df > 0){
      var s = ANOVAMath.termStats(r.ss, r.df, ssResid, dfResid, ssTotal, n);
      r.ms = s.ms; r.F = s.f; r.p = s.p;
      r.eta2 = s.eta2; r.partialEta2 = s.partialEta2;
      r.omega2 = s.omega2; r.omega2Floor = s.omega2 < 0 ? 0 : s.omega2;
      r.partialOmega2 = s.partialOmega2; r.cohensF = s.cohensF;
    } else {
      r.eta2 = (isFinite(r.ss) && ssTotal > 0) ? r.ss / ssTotal : NaN;
      r.partialEta2 = (isFinite(r.ss) && (r.ss + ssResid) > 0) ? r.ss / (r.ss + ssResid) : NaN;
      r.omega2 = NaN; r.omega2Floor = NaN; r.partialOmega2 = NaN; r.cohensF = NaN;
    }
  });
  // intercept row (Type III): recompute its F/p too (no effect size reported)
  if (intercept && canRecompute && isFinite(intercept.ss) && isFinite(intercept.df) && intercept.df > 0){
    intercept.Fparsed = intercept.F; intercept.pParsed = intercept.p;
    intercept.ms = ANOVAMath.ms(intercept.ss, intercept.df);
    intercept.F = ANOVAMath.fFromSS(intercept.ss, intercept.df, ssResid, dfResid);
    intercept.p = ANOVAMath.fPValue(intercept.F, intercept.df, dfResid);
  }
  if (residual) residual.ms = msResid;

  var r2 = ssTotal > 0 ? ANOVAMath.r2(ssResid, ssTotal) : NaN;
  var adjR2 = (isFinite(dfResid) && dfResid > 0 && isFinite(n) && n > 1)
    ? ANOVAMath.adjR2(ssResid, dfResid, ssTotal, n) : NaN;

  return {
    ok: true,
    format: fmtInfo.format,
    type: fmtInfo.type,
    rows: rows,
    intercept: intercept,
    residual: residual,
    ssTerms: ssTerms,
    ssResid: ssResid,
    ssTotal: ssTotal,
    dfResid: dfResid,
    msResid: msResid,
    n: n,
    r2: r2,
    adjR2: adjR2,
    recomputed: canRecompute
  };
}

// ============================================================
// Effect-size labels
// ============================================================
function eta2Label(e){
  if (!isFinite(e)) return 'undefined';
  if (e < 0.01) return 'negligible';
  if (e < 0.06) return 'small';
  if (e < 0.14) return 'medium';
  return 'large';
}
function pSig(p, alpha){
  if (!isFinite(p)) return false;
  return p < alpha;
}
function stars(p){
  if (!isFinite(p)) return '';
  if (p < 0.001) return '***';
  if (p < 0.01)  return '**';
  if (p < 0.05)  return '*';
  if (p < 0.1)   return '.';
  return '';
}

// ============================================================
// State
// ============================================================
var STATE = {
  type: 'II',
  alpha: 0.05,
  scenario: 'oneway',
  parsed: null
};

function setType(t){
  STATE.type = t;
  document.querySelectorAll('#banner-pill button').forEach(function(b){
    b.classList.toggle('active', b.getAttribute('data-type') === t);
  });
  updateBanner();
  updateMethodColumn();
  updateRCode();
  rerenderResult();
  markUsed();
}
function setAlpha(a){
  STATE.alpha = a;
  document.querySelectorAll('#alpha-picker .conf-btn').forEach(function(b){
    b.classList.toggle('active', Number(b.getAttribute('data-alpha')) === a);
  });
  updateBanner();
  rerenderResult();
  markUsed();
}
function updateBanner(){
  var sel = $('banner-type-select'); if (sel) sel.value = STATE.type;
  var al = $('banner-alpha'); if (al) al.textContent = STATE.alpha;
}
function updateMethodColumn(){
  var meaning = {
    'I':   'Type I (sequential): each effect is tested adjusting only for the previously listed terms. Order matters; never quote Type I from a model whose term order has no theoretical justification.',
    'II':  'Type II adjusts each main effect for all other main effects but ignores interactions. Use when the design is unbalanced and the interaction is small or absent.',
    'III': 'Type III tests every term holding all other terms fixed (including interactions). Most journals expect Type III with sum-to-zero contrasts when the design is unbalanced.'
  };
  $('mode-meaning').textContent = meaning[STATE.type] || meaning.II;
}

// ============================================================
// Render
// ============================================================
function termReadProse(r, parsed){
  var sig = pSig(r.p, STATE.alpha);
  var size = eta2Label(r.eta2);
  var dfNum = isFinite(r.df) ? r.df : '?';
  var dfDen = isFinite(parsed.dfResid) ? parsed.dfResid : '?';
  var Fstr = isFinite(r.F) ? fmt(r.F, 2) : '?';
  var verdict = sig
    ? 'is statistically significant at alpha=' + STATE.alpha
    : 'is not statistically significant at alpha=' + STATE.alpha;
  var interaction = /:/.test(r.term);
  var nature = interaction
    ? "an interaction term: the effect of one factor depends on the level of the other"
    : "a main effect";
  // Term name is already rendered by the surrounding span.tr-name wrapper, so
  // start the prose with the verdict to avoid the duplicated "groupgroup".
  return verdict +
    ' (F(' + dfNum + ',' + dfDen + ') = ' + Fstr + ', p = ' + fmtP(r.p) + '). ' +
    'It is ' + nature + '. Eta-squared = ' + fmt(r.eta2, 3) +
    ' (' + size + '), partial eta-squared = ' + fmt(r.partialEta2, 3) +
    (isFinite(r.omega2Floor) ? ', omega-squared = ' + fmt(r.omega2Floor, 3) : '') +
    (isFinite(r.cohensF) ? ", Cohen's f = " + fmt(r.cohensF, 3) : '') + '.';
}

function renderResult(parsed){
  if (!parsed || !parsed.ok) return '';
  var html = '';

  // Summary bar
  html += '<div class="summary-bar">';
  html += '<div class="sb-cell">SS_total <b>' + fmt(parsed.ssTotal, 2) + '</b></div>';
  html += '<div class="sb-cell">SS_resid <b>' + fmt(parsed.ssResid, 2) + '</b></div>';
  html += '<div class="sb-cell">df_resid <b>' + (isFinite(parsed.dfResid) ? parsed.dfResid : '?') + '</b></div>';
  html += '<div class="sb-cell">R^2 <b>' + fmt(parsed.r2, 3) + '</b></div>';
  if (isFinite(parsed.adjR2)) html += '<div class="sb-cell">adj R^2 <b>' + fmt(parsed.adjR2, 3) + '</b></div>';
  html += '</div>';

  // Verified-recompute note
  if (parsed.recomputed){
    html += '<p class="verified-line"><span class="vchip">verified</span> F and p recomputed from Sum Sq and Df via R\'s F distribution (<code>pf</code>).</p>';
  }
  // Table (scroll wrapper keeps it from overflowing on narrow screens)
  html += '<div class="table-scroll"><table class="anova-table">';
  html += '<thead><tr><th>Term</th><th class="num">SS</th><th class="num">df</th><th class="num">MS</th><th class="num">F</th><th class="num">p</th><th class="num">&eta;&sup2;</th><th class="num">&omega;&sup2;</th><th></th></tr></thead><tbody>';
  if (parsed.intercept){
    var ic = parsed.intercept;
    html += '<tr class="intercept"><td class="term-name">(Intercept)</td><td class="num">' + fmt(ic.ss,2) +
      '</td><td class="num">' + (isFinite(ic.df)?ic.df:'-') + '</td><td class="num">' + fmt(ic.ms,2) +
      '</td><td class="num">' + fmt(ic.F,2) + '</td><td class="num">' + fmtP(ic.p) +
      '</td><td class="num">-</td><td class="num">-</td><td class="star-cell">' + stars(ic.p) + '</td></tr>';
  }
  parsed.rows.forEach(function(r){
    html += '<tr><td class="term-name">' + escapeHtml(r.term) + '</td>' +
      '<td class="num">' + fmt(r.ss,2) + '</td>' +
      '<td class="num">' + (isFinite(r.df)?r.df:'-') + '</td>' +
      '<td class="num">' + fmt(r.ms,2) + '</td>' +
      '<td class="num">' + fmt(r.F,2) + '</td>' +
      '<td class="num">' + fmtP(r.p) + '</td>' +
      '<td class="num">' + fmt(r.eta2,3) + '</td>' +
      '<td class="num">' + (isFinite(r.omega2Floor)?fmt(r.omega2Floor,3):'-') + '</td>' +
      '<td class="star-cell">' + stars(r.p) + '</td></tr>';
  });
  if (parsed.residual){
    var rs = parsed.residual;
    html += '<tr class="resid"><td class="term-name">Residuals</td><td class="num">' + fmt(rs.ss,2) +
      '</td><td class="num">' + (isFinite(rs.df)?rs.df:'-') + '</td><td class="num">' + fmt(rs.ms,2) +
      '</td><td class="num">-</td><td class="num">-</td><td class="num">-</td><td class="num">-</td><td></td></tr>';
  }
  html += '</tbody></table></div>';

  // Per-term reads
  parsed.rows.forEach(function(r){
    html += '<div class="term-read"><span class="tr-name">' + escapeHtml(r.term) + '</span>' +
      '<span class="tr-body">' + termReadProse(r, parsed) + '</span></div>';
  });

  // Diagnostics
  html += renderCallouts(parsed);

  return html;
}

function renderCallouts(parsed){
  var out = '';
  // Zero residual df
  if (isFinite(parsed.dfResid) && parsed.dfResid <= 0){
    out += '<div class="callout danger"><span class="callout-icon">!</span><div><b>Zero residual degrees of freedom.</b> The model is saturated (no leftover information to estimate residual variance), so all F-tests are undefined. Drop a term or add observations.</div></div>';
  } else if (isFinite(parsed.dfResid) && parsed.dfResid < 5){
    out += '<div class="callout"><span class="callout-icon">!</span><div><b>Very small residual df (' + parsed.dfResid + ').</b> F-tests have low power and the residual MS is unstable. Treat p-values as suggestive at best.</div></div>';
  }
  // Type I caveat
  if (STATE.type === 'I' && parsed.rows.length > 1){
    out += '<div class="callout"><span class="callout-icon">i</span><div><b>Type I (sequential) sums of squares.</b> Each effect is adjusted only for the previously listed terms. If the design is unbalanced, the F-values change with term order. Switch to Type II or Type III if the order is not theoretically motivated.</div></div>';
  }
  // Type II caveat
  if (STATE.type === 'II' && parsed.rows.some(function(r){return /:/.test(r.term);})){
    out += '<div class="callout"><span class="callout-icon">i</span><div><b>Interaction in a Type II table.</b> Type II tests main effects in a model that omits the interaction. If the interaction is significant, consider Type III plus simple-effects (emmeans) for interpretable contrasts.</div></div>';
  }
  // Type III intercept hint
  if (STATE.type === 'III' && !parsed.intercept){
    out += '<div class="callout"><span class="callout-icon">i</span><div><b>Type III without an Intercept row.</b> Make sure your contrasts are coded as sum-to-zero (<code>options(contrasts = c("contr.sum","contr.poly"))</code>) before running <code>car::Anova(model, type=3)</code>; otherwise main-effect tests can be order-dependent.</div></div>';
  }
  // Unbalanced design heuristic: any df > 1 main effect
  var anyMulti = parsed.rows.some(function(r){return isFinite(r.df) && r.df >= 2 && !/:/.test(r.term);});
  if (anyMulti && STATE.type === 'I'){
    out += '<div class="callout"><span class="callout-icon">!</span><div><b>Possibly unbalanced design.</b> Multi-level main effects under Type I are especially sensitive to term order. Re-run with car::Anova(., type="II") and compare.</div></div>';
  }
  // Suspiciously high R^2
  if (isFinite(parsed.r2) && parsed.r2 > 0.95){
    out += '<div class="callout"><span class="callout-icon">!</span><div><b>R^2 = ' + fmt(parsed.r2,3) + ' is very high.</b> Sanity-check for leakage (e.g., the outcome encoded in a predictor) or a saturated model.</div></div>';
  }
  return out;
}

// ============================================================
// SVG: SS contributions
// ============================================================
function renderViz(parsed){
  var svg = $('viz-svg');
  svg.innerHTML = '';
  if (!parsed || !parsed.ok || parsed.rows.length === 0){
    $('viz-readout').textContent = 'Paste an ANOVA table to render.';
    return;
  }
  var W = 360, H = 200, padL = 60, padR = 14, padT = 14, padB = 50;
  var iw = W - padL - padR, ih = H - padT - padB;
  var bars = parsed.rows.map(function(r){return {label:r.term, ss:r.ss, kind:'term'};});
  if (parsed.residual) bars.push({label:'Residuals', ss:parsed.residual.ss, kind:'resid'});
  var maxSS = bars.reduce(function(m,b){return isFinite(b.ss) && b.ss > m ? b.ss : m;}, 0);
  if (maxSS <= 0) maxSS = 1;
  var bw = iw / bars.length * 0.8;
  var gap = iw / bars.length * 0.2;

  // Axis line
  var ns = 'http://www.w3.org/2000/svg';
  function elem(tag, attrs, text){
    var e = document.createElementNS(ns, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    return e;
  }
  svg.appendChild(elem('line', {x1:padL, y1:padT+ih, x2:W-padR, y2:padT+ih, class:'ax'}));
  svg.appendChild(elem('line', {x1:padL, y1:padT, x2:padL, y2:padT+ih, class:'ax'}));

  // Y ticks (3)
  for (var t = 0; t <= 3; t++){
    var yv = (maxSS * t) / 3;
    var yp = padT + ih - (yv / maxSS) * ih;
    svg.appendChild(elem('line', {x1:padL-3, y1:yp, x2:padL, y2:yp, class:'ax'}));
    svg.appendChild(elem('text', {x:padL-6, y:yp+3, 'text-anchor':'end', class:'tick-label'}, fmt(yv,1)));
  }
  svg.appendChild(elem('text', {x:14, y:padT+ih/2, transform:'rotate(-90 14 '+(padT+ih/2)+')', 'text-anchor':'middle', class:'ax-label'}, 'Sum of Squares'));

  // Bars
  bars.forEach(function(b, i){
    if (!isFinite(b.ss) || b.ss <= 0) return;
    var x = padL + i * (bw + gap) + gap/2;
    var h = (b.ss / maxSS) * ih;
    var y = padT + ih - h;
    var color = b.kind === 'resid' ? 'var(--c-text-mute)' : 'var(--c-accent)';
    svg.appendChild(elem('rect', {x:x, y:y, width:bw, height:h, fill:color, opacity: b.kind === 'resid' ? 0.55 : 0.85}));
    var label = b.label.length > 9 ? b.label.slice(0,8) + '…' : b.label;
    svg.appendChild(elem('text', {x:x + bw/2, y:padT+ih+13, 'text-anchor':'middle', class:'tick-label'}, label));
    svg.appendChild(elem('text', {x:x + bw/2, y:y - 4, 'text-anchor':'middle', class:'estimate-label'}, fmt(b.ss,1)));
  });

  var sigCount = parsed.rows.filter(function(r){return pSig(r.p, STATE.alpha);}).length;
  $('viz-readout').innerHTML = '<b>' + sigCount + '</b> of <b>' + parsed.rows.length +
    '</b> term(s) significant at alpha=' + STATE.alpha +
    '. Residual SS = <b>' + fmt(parsed.ssResid,2) + '</b> (' +
    fmt((parsed.ssResid/parsed.ssTotal)*100,1) + '% of total).';
}

// ============================================================
// R code
// ============================================================
function rnum(x){ return isFinite(x) ? String(x) : 'NA'; }
function typeCallComment(parsed){
  if (parsed.type === 'II')  return '# Anova(fit, type = 2)              # this Type II table';
  if (parsed.type === 'III') return '# Anova(fit, type = 3)              # this Type III table';
  return '# anova(fit)                        # this Type I (sequential) table';
}
function buildRCode(){
  var parsed = STATE.parsed;
  if (!parsed || !parsed.ok || !parsed.rows || !parsed.rows.length){
    return [
      '# Run an ANOVA in R, then paste the printed table above.',
      'fit <- aov(mpg ~ factor(cyl), data = mtcars)   # one-way',
      'summary(fit)                                    # Type I table',
      '',
      '# Unbalanced or factorial designs - Type II or III:',
      'library(car)',
      'Anova(lm(len ~ supp * factor(dose), data = ToothGrowth), type = 2)',
      '',
      '# Effect sizes:',
      'library(effectsize)',
      'eta_squared(fit, partial = FALSE)',
      'omega_squared(fit)'
    ].join('\n');
  }
  var qterm = parsed.rows.map(function(r){ return '"' + String(r.term).replace(/"/g,'\\"') + '"'; }).join(', ');
  var vss = parsed.rows.map(function(r){ return rnum(r.ss); }).join(', ');
  var vdf = parsed.rows.map(function(r){ return rnum(r.df); }).join(', ');
  var lines = [
    '# Recompute every number in the table above from its Sum Sq and Df.',
    '# You already ran aov()/car::Anova() to get these; this reproduces the',
    '# F, p-values and effect sizes shown here with base R, no extra packages.',
    'term     <- c(' + qterm + ')',
    'ss       <- c(' + vss + ')   # Sum Sq per term',
    'df       <- c(' + vdf + ')   # Df per term',
    'ss_resid <- ' + rnum(parsed.ssResid),
    'df_resid <- ' + rnum(parsed.dfResid),
    'N        <- df_resid + sum(df) + 1',
    '',
    'ms       <- ss / df',
    'ms_resid <- ss_resid / df_resid',
    'Fval     <- ms / ms_resid',
    'pval     <- pf(Fval, df, df_resid, lower.tail = FALSE)   # exact F upper tail',
    'ss_total <- sum(ss) + ss_resid',
    '',
    'eta2         <- ss / ss_total',
    'partial_eta2 <- ss / (ss + ss_resid)',
    'omega2       <- (ss - df * ms_resid) / (ss_total + ms_resid)',
    'cohens_f     <- sqrt(partial_eta2 / (1 - partial_eta2))',
    '',
    'data.frame(term, Df = df, Sum_Sq = ss, Mean_Sq = round(ms, 2),',
    '           F = round(Fval, 3), p = signif(pval, 4),',
    '           eta2 = round(eta2, 3), omega2 = round(pmax(0, omega2), 3),',
    '           cohens_f = round(cohens_f, 3))',
    '',
    '# --- Or, if you still have the fitted model, read them straight off it: ---',
    '# library(car); library(effectsize)',
    typeCallComment(parsed),
    '# eta_squared(fit, partial = FALSE)  # omega_squared(fit)'
  ];
  return lines.join('\n');
}
function updateRCode(){
  var ed = $('r-code-rebuild');
  if (ed) ed.textContent = buildRCode();
}

// ============================================================
// Top-level interaction
// ============================================================
function loadScenario(name){
  STATE.scenario = name;
  document.querySelectorAll('.scenario-card').forEach(function(b){
    b.classList.toggle('active', b.getAttribute('data-scenario') === name);
  });
  var sc = SCENARIOS[name];
  if (!sc) return;
  $('paste-input').value = sc.output;
  if (sc.type) {
    setType(sc.type);
  } else {
    rerenderResult();
  }
  markUsed();
}

function onPasteChange(){
  rerenderResult();
  markUsed();
}

function rerenderResult(){
  var text = $('paste-input').value;
  if (!text || /^\s*$/.test(text)){
    STATE.parsed = null;
    $('parse-status').textContent = 'Awaiting paste…';
    $('parse-status').className = 'parse-status';
    $('result-area').innerHTML = '';
    renderViz(null);
    renderInferenceBanner(null);
    renderReport(null);
    updateRCode();
    return;
  }
  var p = parseAnovaTable(text);
  STATE.parsed = p;
  if (!p.ok){
    $('parse-status').textContent = 'Parse error: ' + p.error;
    $('parse-status').className = 'parse-status err';
    $('result-area').innerHTML = '';
    renderViz(null);
    renderInferenceBanner(null);
    renderReport(null);
    updateRCode();
    return;
  }
  // Auto-detect Type from text
  if (p.type && p.type !== STATE.type){
    STATE.type = p.type;
    document.querySelectorAll('#banner-pill button').forEach(function(b){
      b.classList.toggle('active', b.getAttribute('data-type') === p.type);
    });
    updateBanner();
    updateMethodColumn();
  }
  $('parse-status').textContent = 'Parsed ' + p.rows.length + ' term row(s) (' + p.format + ' format' +
    (p.type ? ', Type ' + p.type : '') + '). SS_total = ' + fmt(p.ssTotal,2) + '.';
  $('parse-status').className = 'parse-status ok';
  $('result-area').innerHTML = renderResult(p);
  renderViz(p);
  renderInferenceBanner(p);
  renderReport(p);
  updateRCode();
}

function renderInferenceBanner(parsed){
  var el = $('inference-banner'); if (!el) return;
  if (!parsed || !parsed.ok || !parsed.rows || parsed.rows.length === 0){
    el.innerHTML = 'Paste an <em>anova(...)</em> table to see term-by-term effect sizes and significance. <span class="insig">Awaiting paste.</span>';
    return;
  }
  var typeLabel = STATE.type;
  var k = parsed.rows.length;
  // Find strongest term: lowest p
  var strongest = null;
  parsed.rows.forEach(function(r){
    if (!isFinite(r.p)) return;
    if (!strongest || r.p < strongest.p) strongest = r;
  });
  var html = 'Type <b>' + typeLabel + '</b> ANOVA across <b>' + k + '</b> term' + (k===1?'':'s') + '.';
  if (isFinite(parsed.r2)) html += ' R<sup>2</sup> = <b>' + fmt(parsed.r2, 3) + '</b>.';
  if (strongest){
    var sig = strongest.p < 0.05;
    html += ' Strongest term: <b>' + escapeHtml(strongest.term) + '</b> explains &eta;<sup>2</sup> = <b>' + fmt(strongest.eta2, 3) + '</b> of variance (F = <b>' + fmt(strongest.F, 2) + '</b>, p = <b>' + (strongest.p < 0.0001 ? '&lt;0.0001' : fmt(strongest.p, 4)) + '</b>, <span class="' + (sig?'sig':'insig') + '">' + (sig ? 'significant' : 'not significant') + '</span>).';
  }
  if (isFinite(parsed.ssTotal)) html += ' Total SS = <b>' + fmt(parsed.ssTotal, 2) + '</b>; residual SS = <b>' + fmt(parsed.ssResid, 2) + '</b> on <b>' + (isFinite(parsed.dfResid)?parsed.dfResid:'?') + '</b> df.';
  el.innerHTML = html;
}

// ============================================================
// Journal-ready one-line report (copyable, fires tool_copy)
// ============================================================
function renderReport(parsed){
  var wrap = $('report-wrap'); if (!wrap) return;
  if (!parsed || !parsed.ok || !parsed.rows.length){ wrap.innerHTML = ''; return; }
  var s = null;
  parsed.rows.forEach(function(r){ if (isFinite(r.p) && (!s || r.p < s.p)) s = r; });
  var txt;
  if (s){
    txt = 'Type ' + STATE.type + ' ANOVA: ' + s.term + ' F(' + s.df + ', ' + parsed.dfResid + ') = ' +
      fmt(s.F, 2) + ', p ' + (s.p < 0.0001 ? '< 0.0001' : '= ' + fmt(s.p, 4)) +
      ', eta-squared = ' + fmt(s.eta2, 3) +
      (isFinite(s.partialEta2) ? ' (partial ' + fmt(s.partialEta2, 3) + ')' : '') +
      (isFinite(parsed.r2) ? '; model R-squared = ' + fmt(parsed.r2, 3) : '') + '.';
  } else {
    txt = 'Type ' + STATE.type + ' ANOVA across ' + parsed.rows.length + ' term(s); model R-squared = ' + fmt(parsed.r2, 3) + '.';
  }
  wrap.innerHTML = '<div class="report-row"><span class="report" id="report">' + escapeHtml(txt) +
    '</span><button type="button" class="copy" id="copybtn" onclick="copyReport()">Copy</button></div>';
}
function copyReport(){
  var el = $('report'); if (!el) return;
  if (navigator.clipboard) navigator.clipboard.writeText(el.textContent);
  var b = $('copybtn'); if (b){ b.textContent = 'Copied'; setTimeout(function(){ b.textContent = 'Copy'; }, 1400); }
  try{ if (window.gtag) anovaTrackCopy('report'); }catch(e){}
}
function toast(msg){
  var area = $('toast-area'); if (!area) return;
  var t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
  area.appendChild(t); setTimeout(function(){ t.remove(); }, 3200);
}
// Copy button on the R code block copies the live snippet.
document.addEventListener('click', function(e){
  var btn = e.target.closest ? e.target.closest('.webr-copy-btn') : null;
  if (!btn) return;
  var ed = $('r-code-rebuild'); if (!ed) return;
  var txt = ed.innerText || ed.textContent || '';
  if (navigator.clipboard) navigator.clipboard.writeText(txt);
  toast('R code copied');
  try{ if (window.gtag) anovaTrackCopy('rcode'); }catch(e){}
});
// GA tool_use: once per session, first genuine interaction (not the boot).
var _toolUsed = false, _ready = false;
function markUsed(){
  if (!_ready || _toolUsed) return; _toolUsed = true;
  try{ if (window.gtag) anovaTrackUse(); }catch(e){}
}

// ============================================================
// Init
// ============================================================
document.addEventListener('DOMContentLoaded', function(){
  updateRCode();
  updateBanner();
  updateMethodColumn();
  loadScenario('oneway');
  _ready = true;   // user gestures from here on count as tool_use
});
