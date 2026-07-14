function $(id){ return document.getElementById(id); }
function fmt(x, d){ d = d ?? 4; if (!isFinite(x)) return '-'; return Number(x).toFixed(d).replace(/\.?0+$/,''); }
function fmtP(p){ if (!isFinite(p)) return '-'; if (p < 0.0001) return '<0.0001'; return Number(p).toFixed(4).replace(/\.?0+$/,''); }
function escapeHtml(s){ return String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

// ============================================================
// Quantile helpers (qnorm + qt)
// ============================================================
function qnorm(p){
  if (!(p > 0 && p < 1)) return NaN;
  const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02,
              1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
  const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02,
              6.680131188771972e+01, -1.328068155288572e+01];
  const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00,
             -2.549732539343734e+00,  4.374664141464968e+00,  2.938163982698783e+00];
  const d = [ 7.784695709041462e-03,  3.224671290700398e-01,  2.445134137142996e+00,
              3.754408661907416e+00];
  const pl = 0.02425, ph = 1 - pl;
  let q, r;
  if (p < pl){
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  } else if (p <= ph){
    q = p - 0.5; r = q*q;
    return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q / (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  }
}
// Exact t quantile via the verified t-test math library (bisection on the
// exact t CDF), replacing the old Cornish-Fisher approximation.
function qt(p, df){
  if (!isFinite(df) || df <= 0) return NaN;
  return TTestMath.tQuantile(p, df);
}

// ============================================================
// Parser for summary(lm) output (preserved from previous version)
// ============================================================
function parseLmSummary(text){
  if (!text || !text.trim()) return null;
  const lines = text.split(/\r?\n/).map(l => l.replace(/^\s*>\s?/, ''));
  const result = {raw:text, errors:[], warnings:[], call:null, formula:null, residuals:null, coefficients:[], rse:null, df:null, r2:null, ar2:null, f:null, fdf1:null, fdf2:null, pmodel:null};

  // 1) Call line
  const callIdx = lines.findIndex(l => /^Call:/i.test(l.trim()));
  if (callIdx >= 0){
    let callLine = '';
    for (let i = callIdx + 1; i < lines.length && lines[i].trim() !== ''; i++){
      callLine += (callLine ? ' ' : '') + lines[i].trim();
      if (callLine.includes(')')) break;
    }
    result.call = callLine;
    const fm = callLine.match(/lm\s*\(\s*formula\s*=\s*([^,]+?)(?:,|\))/i) || callLine.match(/lm\s*\(\s*([^,]+?)(?:,|\))/i);
    if (fm) result.formula = fm[1].trim();
  }

  // 2) Residuals quantiles
  const resIdx = lines.findIndex(l => /^Residuals:/i.test(l.trim()));
  if (resIdx >= 0){
    for (let i = resIdx + 1; i < lines.length; i++){
      const l = lines[i].trim();
      if (!l) continue;
      const numbers = l.split(/\s+/).filter(t => /^-?\d+(\.\d+)?(e[+-]?\d+)?$/i.test(t)).map(parseFloat);
      if (numbers.length >= 5){ result.residuals = numbers.slice(0, 5); break; }
    }
  }

  // 3) Coefficients
  const coefIdx = lines.findIndex(l => /^Coefficients:/i.test(l.trim()));
  if (coefIdx >= 0){
    let i = coefIdx + 1;
    while (i < lines.length && !/Estimate/i.test(lines[i])) i++;
    if (i < lines.length) i++;
    while (i < lines.length){
      const raw = lines[i];
      const t = raw.trim();
      if (!t) break;
      if (/^---/.test(t) || /^Signif/i.test(t) || /^Residual standard error/i.test(t)) break;
      const stripped = t.replace(/[*.]+\s*$/, '');
      const sigMatch = t.match(/(\*+|\.)\s*$/);
      const sigStars = sigMatch ? sigMatch[1] : '';
      const glued = stripped.replace(/<\s+(\S+)/g, '<$1').trim();
      const tokens = glued.split(/\s+/).filter(Boolean);
      const nums = [];
      const numRe = /^[<>]?\s*-?\d+(\.\d+)?(e[+-]?\d+)?$/i;
      for (let k = tokens.length - 1; k >= 0 && nums.length < 4; k--){
        const tok = tokens[k];
        if (numRe.test(tok) || /^<\s*\d/.test(tok)){
          let val = parseFloat(tok.replace(/^[<>]\s*/, ''));
          nums.unshift(val);
        } else {
          break;
        }
      }
      if (nums.length === 4){
        const nameTokens = tokens.slice(0, tokens.length - 4);
        const name = nameTokens.join(' ');
        const [estimate, se, tval, pval] = nums;
        const aliased = !isFinite(estimate);
        result.coefficients.push({name, estimate, se, t:tval, p:pval, sig:sigStars, aliased});
      } else if (nums.length > 0 && nums.length < 4){
        result.warnings.push("Couldn't fully parse row: \"" + t + "\"");
      }
      i++;
    }
  }
  if (result.coefficients.length === 0){
    result.errors.push("Couldn't find a coefficients table. Make sure you've pasted the full summary() output.");
  }

  // 4) Residual SE + df
  const rseLine = lines.find(l => /^Residual standard error/i.test(l.trim()));
  if (rseLine){
    const m = rseLine.match(/Residual standard error:\s*([0-9.eE+-]+)\s+on\s+(\d+)\s+degrees of freedom/i);
    if (m){ result.rse = parseFloat(m[1]); result.df = parseInt(m[2]); }
  }

  // 5) R-squared
  const r2Line = lines.find(l => /R-squared/i.test(l));
  if (r2Line){
    const m = r2Line.match(/R-squared:\s*([0-9.eE+-]+).*Adjusted R-squared:\s*([0-9.eE+-]+)/i);
    if (m){ result.r2 = parseFloat(m[1]); result.ar2 = parseFloat(m[2]); }
  }

  // 6) F-statistic
  const fLine = lines.find(l => /^F-statistic/i.test(l.trim()));
  if (fLine){
    const m = fLine.match(/F-statistic:\s*([0-9.eE+-]+)\s*on\s*(\d+)\s*and\s*(\d+)\s*DF,\s*p-value:\s*([<0-9.eE+-]+)/i);
    if (m){
      result.f = parseFloat(m[1]); result.fdf1 = parseInt(m[2]); result.fdf2 = parseInt(m[3]);
      result.pmodel = parseFloat(m[4].replace(/^</, ''));
    }
  }

  // Recompute the model F p-value exactly (the printed value is often
  // truncated to "< 2e-16"); matches R's pf(F, df1, df2, lower.tail=FALSE).
  if (isFinite(result.f) && result.fdf1 > 0 && result.fdf2 > 0 && typeof LMMath !== 'undefined'){
    result.pmodel = LMMath.fPValue(result.f, result.fdf1, result.fdf2);
  }
  return result;
}

// ============================================================
// Interpretation engine
// ============================================================
function pVerdict(p){
  if (!isFinite(p)) return {label:'unknown', cls:'none', text:'p-value not parsed'};
  if (p > 0.10) return {label:'no evidence', cls:'none', text:'no detectable effect'};
  if (p > 0.05) return {label:'weak evidence', cls:'weak', text:'borderline; treat with caution'};
  if (p > 0.01) return {label:'evidence', cls:'evidence', text:'significant at the conventional 5% level'};
  return {label:'strong', cls:'strong', text:'strong evidence against the null'};
}

function extractOutcomeName(call){
  if (!call) return null;
  const m = call.match(/lm\s*\(\s*formula\s*=\s*(\w+)\s*~/i) || call.match(/lm\s*\(\s*(\w+)\s*~/i);
  return m ? m[1] : null;
}

function interpretCoefficient(c, outcome){
  const out = outcome || 'the outcome';
  const v = pVerdict(c.p);
  const dirWord = c.estimate > 0 ? 'increase' : (c.estimate < 0 ? 'decrease' : 'no change');
  const absEst = Math.abs(c.estimate);

  if (c.aliased){
    return {badge:'none', html:'This coefficient is <strong>aliased</strong> (estimate is NA), perfectly collinear with another predictor or factor level. Drop the redundant term.'};
  }
  if (/^\(?Intercept\)?$/i.test(c.name)){
    return {badge:v.cls, html:'When all predictors are 0, the predicted value of <strong>' + escapeHtml(out) + '</strong> is <strong>' + fmt(c.estimate) + '</strong> (SE = ' + fmt(c.se) + '). ' + (v.text === 'no detectable effect' ? "It's not significantly different from zero." : v.text) + '.'};
  }
  if (/:|\*/.test(c.name)){
    return {badge:v.cls, html:'<strong>Interaction term.</strong> The slope of one variable on ' + escapeHtml(out) + ' shifts by <strong>' + fmt(c.estimate) + '</strong> per unit of the moderator (p = ' + fmtP(c.p) + '). Interpret main effects with care; consider plotting predicted values.'};
  }
  if (/poly\s*\(/i.test(c.name) || /I\s*\(.*\^\s*\d+\s*\)/i.test(c.name) || /\^\d+/.test(c.name)){
    return {badge:v.cls, html:'<strong>Polynomial term.</strong> A nonlinear curvature component on ' + escapeHtml(out) + ' (estimate ' + fmt(c.estimate) + ', p = ' + fmtP(c.p) + '). The shape of the relationship is not a straight line; combine with the lower-order term to read the curve.'};
  }
  // Detect factor level (heuristic: contains a capital letter run after a lowercase prefix)
  const isFactor = /[a-z_.][A-Z][A-Za-z0-9_]*$/.test(c.name) || /[a-z_.]\d+$/.test(c.name);
  if (isFactor){
    return {badge:v.cls, html:'Compared to the reference level, this group has a predicted ' + escapeHtml(out) + ' that is <strong>' + fmt(absEst) + ' ' + (c.estimate > 0 ? 'higher' : 'lower') + '</strong> (SE = ' + fmt(c.se) + ', p = ' + fmtP(c.p) + '). ' + v.text + '.'};
  }
  // Predictor side always reads "1-unit increase"; only the outcome direction
  // flips with the sign of the coefficient.
  return {badge:v.cls, html:'Holding other predictors constant, a 1-unit increase in <code>' + escapeHtml(c.name) + '</code> is associated with <strong>' + (dirWord === 'no change' ? 'no change' : 'a ' + fmt(absEst) + ' ' + dirWord) + '</strong> in ' + escapeHtml(out) + ' (SE = ' + fmt(c.se) + ', t = ' + fmt(c.t,2) + ', p = ' + fmtP(c.p) + '). ' + v.text + '.'};
}

function diagnosticCallouts(parsed){
  const callouts = [];
  if (!parsed) return callouts;
  const aliased = parsed.coefficients.filter(c => c.aliased);
  if (aliased.length > 0){
    callouts.push({text:'<strong>' + aliased.length + ' aliased coefficient' + (aliased.length>1?'s':'') + '.</strong> Model is rank-deficient; drop redundant predictors.'});
  }
  if (parsed.df !== null && parsed.df < 5){
    callouts.push({text:'<strong>Very few degrees of freedom (' + parsed.df + ').</strong> Estimates and p-values are unreliable.'});
  }
  if (parsed.r2 !== null && parsed.r2 > 0.99){
    callouts.push({text:'<strong>R^2 = ' + fmt(parsed.r2,3) + ' is suspiciously high.</strong> Check for data leakage or near-deterministic relationships.'});
  }
  if (parsed.r2 !== null && parsed.r2 < 0.02 && parsed.pmodel !== null && parsed.pmodel > 0.10){
    callouts.push({text:'<strong>Model has no detectable explanatory power.</strong> R^2 = ' + fmt(parsed.r2,3) + ', F-test p = ' + fmtP(parsed.pmodel) + '.'});
  }
  parsed.coefficients.forEach(c => {
    if (isFinite(c.t) && Math.abs(c.t) > 100){
      callouts.push({text:'<strong>Extreme t-statistic on <code>' + escapeHtml(c.name) + '</code> (' + fmt(c.t,1) + ').</strong> Verify scale or near-zero noise.'});
    }
  });
  const colSuspects = parsed.coefficients.filter(c => !c.aliased && c.name !== '(Intercept)' && isFinite(c.estimate) && isFinite(c.se) && c.se > 0 && Math.abs(c.se / c.estimate) > 5 && Math.abs(c.t) < 1);
  if (colSuspects.length >= 2){
    callouts.push({text:'<strong>Possible multicollinearity.</strong> ' + colSuspects.length + ' predictors have inflated SEs and tiny t-stats; run <code>car::vif(fit)</code>.'});
  }
  if (parsed.rse !== null && parsed.coefficients.length > 0){
    const intc = parsed.coefficients.find(c => /^\(?Intercept\)?$/i.test(c.name));
    if (intc && Math.abs(intc.estimate) > 0 && parsed.rse / Math.abs(intc.estimate) > 0.5){
      callouts.push({text:'<strong>Residual SE is large relative to the intercept</strong> (RSE/|Intercept| = ' + fmt(parsed.rse / Math.abs(intc.estimate),2) + '). Typical errors are a substantial fraction of the outcome scale.'});
    }
  }
  return callouts;
}

function modelDecision(parsed){
  if (!parsed) return null;
  const aliased = parsed.coefficients.some(c => c.aliased);
  const r2 = parsed.r2 ?? 0, fp = parsed.pmodel ?? 1;
  if (aliased || (parsed.df !== null && parsed.df < 3)) return {cls:'broken', icon:'!', verdict:'Model has structural problems', text:'Aliased coefficients or near-zero degrees of freedom.'};
  if (r2 > 0.99) return {cls:'broken', icon:'!', verdict:'Suspiciously perfect fit', text:'R^2 = ' + fmt(r2,3) + ' is implausibly high; verify before interpreting.'};
  if (fp < 0.05 && r2 > 0.20) return {cls:'solid', icon:'+', verdict:'Solid model', text:'F-test significant (p = ' + fmtP(fp) + '); model explains ' + (r2*100).toFixed(0) + '% of variance.'};
  if (fp < 0.05 && r2 > 0.05) return {cls:'solid', icon:'+', verdict:'Modest but real signal', text:'F-test significant (p = ' + fmtP(fp) + '); R^2 = ' + fmt(r2,3) + ' is small but coefficients are interpretable.'};
  if (fp < 0.20) return {cls:'weak', icon:'?', verdict:'Weak / underpowered', text:'F-test p = ' + fmtP(fp) + '; borderline. R^2 = ' + fmt(r2,3) + '.'};
  return {cls:'weak', icon:'?', verdict:'No detectable signal', text:'F-test p = ' + fmtP(fp) + '; R^2 = ' + fmt(r2,3) + '.'};
}

// ============================================================
// AIC / BIC / logLik - EXACT stats:: values from the parsed
// RSS (= RSE^2 * resid df), n, and the model rank (non-aliased
// coefficient count). Verified vs R AIC()/BIC()/logLik().
// ============================================================
function icInputs(parsed){
  if (!parsed || parsed.rse == null || parsed.df == null) return null;
  const npar = parsed.coefficients.filter(c => !c.aliased && isFinite(c.estimate)).length;
  if (npar <= 0) return null;
  const n = parsed.df + npar;              // n_obs = residual df + rank
  const rss = parsed.rse * parsed.rse * parsed.df;
  if (!(n > 0) || !(rss > 0)) return null;
  return {n:n, rss:rss, npar:npar};
}
function approxAIC(parsed){ const r = icInputs(parsed); return r ? LMMath.aic(r.n, r.rss, r.npar) : null; }
function approxBIC(parsed){ const r = icInputs(parsed); return r ? LMMath.bic(r.n, r.rss, r.npar) : null; }
function approxLogLik(parsed){ const r = icInputs(parsed); return r ? LMMath.logLik(r.n, r.rss) : null; }

// Exact F upper-tail p-value via the verified incomplete beta (LMMath),
// used for the overall model F and the nested-anova F. Matches R's pf().
function pf_upper(F, df1, df2){
  if (!isFinite(F) || F <= 0 || !isFinite(df1) || !isFinite(df2) || df1 <= 0 || df2 <= 0) return NaN;
  return LMMath.fPValue(F, df1, df2);
}

// ============================================================
// Modes / state / METHOD_META
// ============================================================
const MODES = [
  {key:'single',  name:'a single model'},
  {key:'compare', name:'compare 2+ models'}
];

let activeMode = 'single';
let ciLevel = 0.95;   // coefficient CI level (90/95/99), user-selectable
function setCILevel(v){
  ciLevel = +v;
  document.querySelectorAll('#ci-level-row .submode-tab').forEach(b => b.classList.toggle('active', +b.dataset.ci === ciLevel));
  parseAllAndRender();
}
function ciPct(){ return Math.round(ciLevel * 100); }
const state = {
  mode:'single',
  models: [{paste:'', parsed:null}]
};

const METHOD_META = {
  'single': {
    useWhen: 'You ran <code>summary(lm(...))</code> in R and want a structured plain-English read of every coefficient, the model-level fit, and any diagnostic flags worth chasing.',
    example: 'e.g., paste the output of <code>summary(lm(mpg ~ wt + hp, data = mtcars))</code> and read each row.',
    inputs: [
      {code:'paste', desc:'a complete summary(lm(...)) block, from "Call:" through "F-statistic:".'}
    ]
  },
  'compare': {
    useWhen: 'You fit two or more <code>lm()</code> models on the same outcome / dataset and want to pick one. The tool reports R^2, adjusted R^2, residual SE, AIC, BIC, log-likelihood, and runs an anova-style F-test for nested pairs.',
    example: 'e.g., paste <code>summary(lm(y ~ x1))</code> and <code>summary(lm(y ~ x1 + x2))</code> back-to-back; the tool tells you whether x2 earned its keep.',
    inputs: [
      {code:'A', desc:'first summary(lm()) block'},
      {code:'B', desc:'second summary(lm()) block (and optionally more via "+ Add another model")'}
    ]
  }
};

// ============================================================
// Banner sentence
// ============================================================
function renderBannerSentence(){
  const el = $('banner-sentence'); if (!el) return;
  const modeLabel = MODES.find(m => m.key === activeMode).name;
  const modeOpts = MODES.map(m =>
    '<option value="' + m.key + '"' + (m.key===activeMode?' selected':'') + '>' + escapeHtml(m.name) + '</option>'
  ).join('');
  let givens;
  const n = state.models.length;
  const parsedCount = state.models.filter(m => m.parsed).length;
  if (activeMode === 'single'){
    givens = parsedCount > 0 ? 'parsed summary(lm()) block' : 'paste summary(lm()) below';
  } else {
    givens = parsedCount + ' of ' + n + ' models parsed';
  }
  el.innerHTML = 'I want to interpret ' +
    '<span class="param">' + escapeHtml(modeLabel) + '<span class="param-caret">&#9662;</span>' +
      '<select onchange="setMode(this.value)">' + modeOpts + '</select>' +
    '</span>' +
    ' given ' +
    '<span class="param is-static">' + givens + '</span>.';
}

function setMode(mode){
  if (!MODES.find(m => m.key === mode)) return;
  activeMode = mode;
  state.mode = mode;
  document.querySelectorAll('#mode-tabs .submode-tab').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
  if (mode === 'compare' && state.models.length < 2){
    state.models.push({paste:'', parsed:null});
  }
  $('add-model-btn').style.display = (mode === 'compare') ? '' : 'none';
  renderPasteBlocks();
  renderMethodColumn();
  renderBannerSentence();
  parseAllAndRender();
}

function addModel(){
  if (state.models.length >= 5){ toast('Up to 5 models'); return; }
  state.models.push({paste:'', parsed:null});
  renderPasteBlocks();
  renderBannerSentence();
  parseAllAndRender();
  // disable button at cap
  const btn = $('add-model-btn');
  if (btn) btn.disabled = (state.models.length >= 5);
}
function removeModel(idx){
  if (state.models.length <= 1) return;
  state.models.splice(idx, 1);
  renderPasteBlocks();
  renderBannerSentence();
  parseAllAndRender();
  const btn = $('add-model-btn');
  if (btn) btn.disabled = (state.models.length >= 5);
}

function renderMethodColumn(){
  const meta = METHOD_META[activeMode];
  if (!meta) return;
  $('method-use-when').innerHTML = meta.useWhen;
  $('method-example').innerHTML = meta.example;
  $('method-inputs-needed').innerHTML = (meta.inputs || []).map(m =>
    '<li><code>' + m.code + '</code><span>' + m.desc + '</span></li>'
  ).join('');
}

function renderPasteBlocks(){
  const wrap = $('paste-blocks');
  let html = '';
  state.models.forEach((m, i) => {
    const labelTxt = (activeMode === 'compare')
      ? 'Model ' + String.fromCharCode(65 + i)
      : 'summary(lm(...)) output';
    const removeBtn = (activeMode === 'compare' && state.models.length > 1)
      ? '<button type="button" class="model-remove" onclick="removeModel(' + i + ')" title="Remove this model">&times;</button>'
      : '';
    html += '<div class="model-paste-block">' +
      '<div class="model-paste-label"><span>' + labelTxt + '</span>' + removeBtn + '</div>' +
      '<div class="form-row"><textarea class="paste-box" data-model-idx="' + i + '" oninput="onPasteChange(' + i + ')" placeholder="Paste a summary(lm(...)) block here&hellip;">' + escapeHtml(m.paste) + '</textarea></div>' +
      '</div>';
  });
  wrap.innerHTML = html;
}

function onPasteChange(idx){
  const ta = document.querySelector('textarea[data-model-idx="' + idx + '"]');
  if (!ta) return;
  state.models[idx].paste = ta.value;
  state.models[idx].parsed = parseLmSummary(ta.value);
  renderBannerSentence();
  parseAllAndRender();
}

// ============================================================
// Render: single
// ============================================================
function parseAllAndRender(){
  state.models.forEach(m => { m.parsed = parseLmSummary(m.paste); });
  if (activeMode === 'single'){
    $('single-result').style.display = '';
    $('compare-result').style.display = 'none';
    renderSingle(state.models[0].parsed);
  } else {
    $('single-result').style.display = 'none';
    $('compare-result').style.display = '';
    renderCompare(state.models);
  }
  drawVizChart();
  refreshRCode();
  renderInferenceBanner();
}

function renderInferenceBanner(){
  const el = $('inference-banner');
  if (!el) return;
  if (activeMode === 'compare'){
    const have = state.models.filter(m => m.parsed && m.parsed.coefficients && m.parsed.coefficients.length > 0).map(m => m.parsed);
    const k = have.length;
    if (k < 2){
      el.innerHTML = 'Paste at least <b>2</b> <em>summary(lm())</em> blocks to compare. <span class="insig">Awaiting input.</span>';
      return;
    }
    const labels = have.map((_, i) => 'Model ' + String.fromCharCode(65 + i));
    const aics = have.map(approxAIC);
    if (aics.every(a => a != null && isFinite(a))){
      const minA = Math.min(...aics);
      const winnerIdx = aics.indexOf(minA);
      const others = aics.filter((_, i) => i !== winnerIdx);
      const aDelta = others.length ? Math.min(...others) - minA : null;
      // Nested F / LRT on the first two models if nested
      let pPart = '';
      if (have.length >= 2){
        const A = have[0], B = have[1];
        let small = null, big = null;
        if (isNested(A, B)){ small = A; big = B; }
        else if (isNested(B, A)){ small = B; big = A; }
        if (small && big && small.rse !== null && big.rse !== null && small.df !== null && big.df !== null){
          const rssS = small.rse * small.rse * small.df;
          const rssB = big.rse * big.rse * big.df;
          const df1 = small.df - big.df;
          const df2 = big.df;
          if (df1 > 0 && df2 > 0 && rssB > 0){
            const F = ((rssS - rssB) / df1) / (rssB / df2);
            const p = pf_upper(F, df1, df2);
            const sig = p < 0.05;
            pPart = ' The nested F-test gives p = <b>' + (p < 0.0001 ? '&lt;0.0001' : fmt(p,4)) + '</b>, <span class="' + (sig ? 'sig' : 'insig') + '">' + (sig ? 'significant' : 'not significant') + '</span>.';
          }
        } else {
          pPart = ' Models are <em>not nested</em>; the F-test is not defined here, prefer AIC / BIC.';
        }
      }
      el.innerHTML = 'Comparing <b>' + k + '</b> models: <b>' + escapeHtml(labels[winnerIdx]) + '</b> has the lowest AIC' +
        (aDelta != null ? ' (<b>' + fmt(aDelta, 2) + '</b> lower than next)' : '') + '.' + pPart;
    } else {
      el.innerHTML = 'Comparing <b>' + k + '</b> models. <span class="insig">AIC / BIC could not be computed for every model.</span>';
    }
    return;
  }
  // single
  const parsed = state.models[0] && state.models[0].parsed;
  if (!parsed || parsed.errors.length > 0 || parsed.coefficients.length === 0){
    el.innerHTML = 'Paste a <em>summary(lm())</em> block to read every coefficient in plain English. <span class="insig">Awaiting paste.</span>';
    return;
  }
  const outcome = extractOutcomeName(parsed.call);
  const k = parsed.coefficients.filter(c => c.name !== '(Intercept)').length;
  // Strongest predictor: lowest p among non-intercept, non-aliased
  let strongest = null;
  parsed.coefficients.forEach(c => {
    if (c.name === '(Intercept)' || c.aliased) return;
    if (!isFinite(c.p)) return;
    if (!strongest || c.p < strongest.p) strongest = c;
  });
  let html = 'This model regresses <b>' + escapeHtml(outcome || 'the outcome') + '</b> on <b>' + k + '</b> predictor' + (k===1?'':'s') + '.';
  if (parsed.r2 !== null){
    html += ' R<sup>2</sup> = <b>' + fmt(parsed.r2, 3) + '</b>';
    if (parsed.ar2 !== null) html += ' (adjusted <b>' + fmt(parsed.ar2, 3) + '</b>)';
    html += '.';
  }
  if (parsed.f !== null && parsed.pmodel !== null){
    const sig = parsed.pmodel < 0.05;
    html += ' The model-level F(' + parsed.fdf1 + ', ' + parsed.fdf2 + ') = <b>' + fmt(parsed.f, 2) + '</b>, p = <b>' + (parsed.pmodel < 0.0001 ? '&lt;0.0001' : fmt(parsed.pmodel, 4)) + '</b> is <span class="' + (sig?'sig':'insig') + '">' + (sig ? 'significant' : 'not significant') + '</span>.';
  }
  if (strongest){
    html += ' Strongest predictor: <b>' + escapeHtml(strongest.name) + '</b> (&beta; = <b>' + fmt(strongest.estimate, 3) + '</b>, p = <b>' + (strongest.p < 0.0001 ? '&lt;0.0001' : fmt(strongest.p, 4)) + '</b>).';
  }
  if (parsed.rse !== null){
    html += ' Residual SE = <b>' + fmt(parsed.rse, 3) + '</b> on <b>' + parsed.df + '</b> df.';
  }
  el.innerHTML = html;
}

function renderSingle(parsed){
  const root = $('single-result');
  if (!parsed){
    $('parse-status').innerHTML = '<span>Awaiting paste&hellip;</span>';
    root.innerHTML = '<p style="color:var(--c-text-mute);font-size:13px;margin:0">Paste a <code>summary(lm(...))</code> block in column B to get a plain-English read of every coefficient.</p>';
    return;
  }
  if (parsed.errors.length > 0){
    $('parse-status').innerHTML = '<span class="err">! Parse error</span>';
    root.innerHTML = '<div class="callout"><span class="callout-icon">!</span><div>' + parsed.errors.map(escapeHtml).join('</div><div>') + '</div></div>';
    return;
  }
  $('parse-status').innerHTML = '<span class="ok">&check; Parsed</span> &middot; ' + parsed.coefficients.length + ' coefficient' + (parsed.coefficients.length===1?'':'s') + ' &middot; ' + (parsed.df ?? '?') + ' df &middot; R^2 = ' + (parsed.r2 !== null ? fmt(parsed.r2,3) : '?');

  const outcome = extractOutcomeName(parsed.call);
  const sigCount = parsed.coefficients.filter(c => c.name !== '(Intercept)' && !c.aliased && c.p < 0.05).length;
  const totalCount = parsed.coefficients.filter(c => c.name !== '(Intercept)').length;
  let summary = '';
  if (parsed.r2 !== null && parsed.f !== null){
    summary = 'Your model has <strong>' + totalCount + ' predictor' + (totalCount===1?'':'s') + '</strong>' + (outcome ? ' of <strong>' + escapeHtml(outcome) + '</strong>' : '') + ', explaining <strong>' + (parsed.r2*100).toFixed(0) + '%</strong> of variance (R^2 = ' + fmt(parsed.r2,3) + '). F(' + parsed.fdf1 + ', ' + parsed.fdf2 + ') = ' + fmt(parsed.f,2) + ', p = ' + fmtP(parsed.pmodel) + '. <strong>' + sigCount + ' of ' + totalCount + '</strong> predictor' + (totalCount===1?' is':'s are') + ' significant at &alpha;=0.05.';
  } else {
    summary = 'Parsed ' + parsed.coefficients.length + ' coefficient' + (parsed.coefficients.length===1?'':'s') + '. Some model-level statistics did not parse.';
  }

  const dec = modelDecision(parsed);
  const decHtml = dec ? '<div class="decision-card ' + dec.cls + '"><div class="dc-icon">' + dec.icon + '</div><div class="dc-body"><div class="dc-verdict">' + escapeHtml(dec.verdict) + '</div><div class="dc-rationale">' + dec.text + '</div></div></div>' : '';

  // Coefficient table
  let coefHtml = '';
  if (parsed.coefficients.length > 0 && parsed.df){
    const tCrit = qt(1 - (1 - ciLevel)/2, parsed.df);
    coefHtml = '<table class="coef-table"><thead><tr><th>name</th><th class="num">estimate</th><th class="num">SE</th><th class="num">t</th><th class="num">p</th><th class="num">' + ciPct() + '% CI</th></tr></thead><tbody>';
    parsed.coefficients.forEach(c => {
      const cls = c.aliased ? 'aliased' : '';
      let ci = '-';
      if (!c.aliased && isFinite(c.estimate) && isFinite(c.se)){
        ci = '[' + fmt(c.estimate - tCrit*c.se, 3) + ', ' + fmt(c.estimate + tCrit*c.se, 3) + ']';
      }
      coefHtml += '<tr class="' + cls + '"><td>' + escapeHtml(c.name) + '</td><td class="num">' + (c.aliased?'NA':fmt(c.estimate,4)) + '</td><td class="num">' + fmt(c.se,4) + '</td><td class="num">' + fmt(c.t,2) + '</td><td class="num">' + fmtP(c.p) + (c.sig?'<span class="sig-stars">' + c.sig + '</span>':'') + '</td><td class="num">' + ci + '</td></tr>';
    });
    coefHtml += '</tbody></table>';
  }

  // Fit grid
  let fitHtml = '';
  if (parsed.r2 !== null && parsed.f !== null){
    fitHtml = '<div class="fit-grid">' +
      '<div><div class="k">R^2</div><div class="v">' + fmt(parsed.r2,3) + '</div></div>' +
      '<div><div class="k">Adj R^2</div><div class="v">' + fmt(parsed.ar2,3) + '</div></div>' +
      '<div><div class="k">F (' + parsed.fdf1 + ', ' + parsed.fdf2 + ')</div><div class="v">' + fmt(parsed.f,2) + '</div></div>' +
      '<div><div class="k">F p-value</div><div class="v">' + fmtP(parsed.pmodel) + '</div></div>' +
      '</div>';
  }

  // Coefficient interpretations
  let interpHtml = '<div style="font-size:11px;color:var(--c-text-mute);text-transform:uppercase;letter-spacing:0.05em;margin:14px 0 6px">Plain-English read</div>';
  parsed.coefficients.forEach(c => {
    const interp = interpretCoefficient(c, outcome);
    interpHtml += '<div class="coef-interp">' +
      '<div class="ci-name"><code>' + escapeHtml(c.name) + '</code> <span class="ci-badge ' + interp.badge + '">' + pVerdict(c.p).label + '</span></div>' +
      '<div class="ci-text">' + interp.html + '</div>' +
    '</div>';
  });

  // Fit explanation
  let fitText = '';
  if (parsed.r2 !== null && parsed.pmodel !== null){
    if (parsed.r2 > 0.7) fitText = 'The model explains a large share of variance.';
    else if (parsed.r2 > 0.3) fitText = 'The model explains a moderate share of variance.';
    else if (parsed.r2 > 0.05) fitText = 'Small R^2; common in noisy individual-level data.';
    else fitText = 'Very low R^2; predictors capture little variance.';
    if (parsed.pmodel < 0.05) fitText += ' F-test rejects "no relationship" at &alpha;=0.05.';
    else fitText += ' F-test fails to reject; treat individual coefficients with caution.';
  }
  if (parsed.rse !== null) fitText += ' Residual SE = ' + fmt(parsed.rse,3) + ' on ' + parsed.df + ' df.';

  const callouts = diagnosticCallouts(parsed);
  const calloutsHtml = callouts.length ? '<div style="margin-top:14px">' + callouts.map(c => '<div class="callout"><span class="callout-icon">!</span><div>' + c.text + '</div></div>').join('') + '</div>' : '';

  // Journal-ready one-line report (copyable, fires tool_copy)
  let reportHtml = '';
  if (parsed.r2 !== null && parsed.f !== null){
    const reportText = 'lm(' + (parsed.formula || '?') + '): R^2 = ' + fmt(parsed.r2,3) + ' (adj ' + fmt(parsed.ar2,3) + '), F(' + parsed.fdf1 + ',' + parsed.fdf2 + ') = ' + fmt(parsed.f,2) + ', p = ' + fmtP(parsed.pmodel) + '; ' + sigCount + ' of ' + totalCount + ' predictor' + (totalCount===1?'':'s') + ' significant at p<0.05.';
    reportHtml = '<div class="report-row" style="display:flex;gap:10px;align-items:flex-start;margin-top:14px;padding-top:12px;border-top:1px solid rgba(0,0,0,.08)"><span class="report" id="report" style="flex:1;font-size:12.5px;color:var(--c-text-soft);line-height:1.5">' + escapeHtml(reportText) + '</span><button type="button" class="copy" id="copybtn" onclick="copyReport()" style="flex:none;font:600 12.5px/1 inherit;background:var(--c-accent,#2563eb);color:#fff;border:none;border-radius:6px;padding:7px 11px;cursor:pointer">Copy</button></div>';
  }

  root.innerHTML =
    '<div class="live-summary">' + summary + '</div>' +
    decHtml +
    (parsed.call ? '<div style="font-size:11px;color:var(--c-text-mute);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Call</div><div style="font-family:ui-monospace,Consolas,monospace;font-size:12px;color:var(--c-text);margin-bottom:10px;overflow-wrap:anywhere">' + escapeHtml(parsed.call) + '</div>' : '') +
    coefHtml +
    fitHtml +
    (fitText ? '<p style="font-size:13px;line-height:1.55;color:var(--c-text-soft);margin:8px 0 0">' + fitText + '</p>' : '') +
    interpHtml +
    calloutsHtml +
    reportHtml;
}

// ============================================================
// Render: compare
// ============================================================
function isNested(small, big){
  if (!small || !big) return false;
  const sNames = new Set(small.coefficients.map(c => c.name));
  const bNames = new Set(big.coefficients.map(c => c.name));
  if (sNames.size >= bNames.size) return false;
  for (const n of sNames){ if (!bNames.has(n)) return false; }
  return true;
}

function renderCompare(models){
  const root = $('compare-result');
  const parsed = models.map(m => m.parsed);
  const have = parsed.filter(p => p && p.coefficients.length > 0);
  if (have.length < 2){
    $('parse-status').innerHTML = '<span class="warn">~ ' + have.length + ' / ' + models.length + ' parsed</span>';
    root.innerHTML = '<p style="color:var(--c-text-mute);font-size:13px;margin:0">Paste at least 2 <code>summary(lm())</code> blocks in column B to compare them.</p>';
    return;
  }
  $('parse-status').innerHTML = '<span class="ok">&check; ' + have.length + ' models parsed</span>';

  const labels = parsed.map((p, i) => 'Model ' + String.fromCharCode(65 + i));
  const aics = parsed.map(approxAIC);
  const bics = parsed.map(approxBIC);
  const lls = parsed.map(approxLogLik);

  // Build comparison table
  function row(label, vals, betterFn, fmtter){
    const ff = fmtter || (x => x===null||!isFinite(x)?'-':fmt(x,3));
    let bestIdx = -1;
    if (betterFn){
      let bestV = null;
      vals.forEach((v, i) => {
        if (v == null || !isFinite(v)) return;
        if (bestV == null || betterFn(v, bestV)){ bestV = v; bestIdx = i; }
      });
    }
    let html = '<tr><td class="label">' + label + '</td>';
    vals.forEach((v, i) => {
      html += '<td class="num' + (i === bestIdx ? ' cmp-win' : '') + '">' + ff(v) + '</td>';
    });
    html += '</tr>';
    return html;
  }

  // Per-model derived: n (= df + k) and formula display
  const ns = parsed.map(p => (p && p.df != null) ? (p.df + p.coefficients.length) : null);
  const formulas = parsed.map(p => p ? (p.formula || '-') : '-');

  let head = '<thead><tr><th>Metric</th>';
  labels.forEach(l => { head += '<th class="num">' + l + '</th>'; });
  head += '</tr></thead>';
  let body = '<tbody>';
  // Formula row (no winner)
  body += '<tr><td class="label">Predictors (formula)</td>';
  formulas.forEach(f => { body += '<td class="formula-cell">' + escapeHtml(f) + '</td>'; });
  body += '</tr>';
  body += row('n (sample size)', ns, null, x => x==null?'-':String(x));
  body += row('Residual df', parsed.map(p => p ? p.df : null), null, x => x==null?'-':String(x));
  body += row('R^2', parsed.map(p => p ? p.r2 : null), (a,b)=>a>b);
  body += row('Adjusted R^2', parsed.map(p => p ? p.ar2 : null), (a,b)=>a>b);
  body += row('Residual SE', parsed.map(p => p ? p.rse : null), (a,b)=>a<b);
  body += row('F (model-level)', parsed.map(p => p ? p.f : null), (a,b)=>a>b);
  body += row('F p-value', parsed.map(p => p ? p.pmodel : null), (a,b)=>a<b, x => x==null?'-':fmtP(x));
  body += row('AIC', aics, (a,b)=>a<b, x => x==null?'-':fmt(x,2));
  body += row('BIC', bics, (a,b)=>a<b, x => x==null?'-':fmt(x,2));
  body += row('logLik', lls, (a,b)=>a>b, x => x==null?'-':fmt(x,2));
  body += '</tbody>';

  let tableHtml = '<table class="cmp-table">' + head + body + '</table>';

  // Different-n guard: AIC/BIC are not comparable across different sample sizes
  let nGuardHtml = '';
  const distinctNs = [...new Set(ns.filter(x => x != null))];
  if (distinctNs.length > 1){
    nGuardHtml = '<div class="callout danger"><span class="callout-icon">!</span><div><strong>Different sample sizes detected</strong> (n = ' + distinctNs.join(', ') + '). AIC and BIC are exact but assume the SAME data, and the nested F-test is undefined across different rows. Refit on a common subset (e.g., complete cases) before comparing.</div></div>';
  }

  // Nested anova F-test on the first two models
  let anovaHtml = '';
  let nestedDone = false;
  if (parsed.length >= 2 && parsed[0] && parsed[1]){
    const A = parsed[0], B = parsed[1];
    let small = null, big = null, smallLabel = '', bigLabel = '';
    if (isNested(A, B)){ small = A; big = B; smallLabel = labels[0]; bigLabel = labels[1]; }
    else if (isNested(B, A)){ small = B; big = A; smallLabel = labels[1]; bigLabel = labels[0]; }
    if (small && big && small.rse !== null && big.rse !== null && small.df !== null && big.df !== null){
      const rssS = small.rse * small.rse * small.df;
      const rssB = big.rse   * big.rse   * big.df;
      const df1 = small.df - big.df;
      const df2 = big.df;
      if (df1 > 0 && df2 > 0 && rssB > 0 && distinctNs.length <= 1){
        const F = ((rssS - rssB) / df1) / (rssB / df2);
        const p = pf_upper(F, df1, df2);
        nestedDone = true;
        anovaHtml = '<div class="callout" style="background:var(--c-accent-soft);border-color:var(--c-accent-line);border-left-color:var(--c-accent);color:var(--c-text)"><span class="callout-icon">F</span><div><strong>Nested anova F-test</strong> (' + smallLabel + ' nested in ' + bigLabel + '): F(' + df1 + ', ' + df2 + ') = ' + fmt(F,3) + ', p &asymp; ' + fmtP(p) + '. ' + (p < 0.05 ? 'Extra terms in ' + bigLabel + ' significantly improve fit.' : 'Extra terms do NOT significantly improve fit; prefer ' + smallLabel + '.') + '</div></div>';
      }
    }
    if (!nestedDone && distinctNs.length <= 1){
      anovaHtml = '<div class="callout"><span class="callout-icon">i</span><div><strong>Models are not nested.</strong> The F-test from <code>anova(fit1, fit2)</code> requires one model\'s predictors to be a strict superset of the other. Use AIC and BIC for selection here; lower is better.</div></div>';
    }
  }

  // Verdict / recommendation paragraph
  let verdict = '';
  if (aics.every(a => a != null && isFinite(a)) && bics.every(b => b != null && isFinite(b))){
    const minA = Math.min(...aics), minB = Math.min(...bics);
    const aIdx = aics.indexOf(minA), bIdx = bics.indexOf(minB);
    const aDelta = aics.filter((_, i) => i !== aIdx).map(a => a - minA).sort((x,y)=>x-y)[0];
    const bDelta = bics.filter((_, i) => i !== bIdx).map(a => a - minB).sort((x,y)=>x-y)[0];
    if (aIdx === bIdx){
      verdict = '<strong>' + labels[aIdx] + '</strong> has the lowest AIC';
      if (aDelta != null) verdict += ' (lower by ' + fmt(aDelta,2) + ')';
      verdict += ' and the lowest BIC';
      if (bDelta != null) verdict += ' (lower by ' + fmt(bDelta,2) + ')';
      verdict += '; both criteria favor it. ';
      if (aDelta != null && aDelta < 2) verdict += 'But &Delta;AIC &lt; 2 to the next-best model means the gap is small; treat the two as roughly equivalent. ';
      else if (aDelta != null && aDelta >= 7) verdict += 'The gap is substantial. ';
      if (nestedDone) verdict += 'The nested F-test agrees. Pick ' + labels[aIdx] + '.';
      else verdict += 'Pick ' + labels[aIdx] + '.';
    } else {
      verdict = 'AIC favors <strong>' + labels[aIdx] + '</strong> (lower by ' + fmt(aDelta||0,2) + '); BIC favors <strong>' + labels[bIdx] + '</strong> (lower by ' + fmt(bDelta||0,2) + '). They disagree because BIC penalizes parameters more heavily than AIC, so it leans toward simpler models. If your goal is prediction, follow AIC; if it is identifying a parsimonious "true" model, follow BIC.';
    }
  }

  // Caveats block (always shown when at least 2 parsed models)
  const caveatsHtml = '<div class="cmp-caveats">' +
    '<h6>How to read this comparison</h6>' +
    '<ul>' +
    '<li><strong>AIC vs BIC.</strong> AIC penalizes each parameter by 2; BIC penalizes by ln(n). For n &gt; 7, BIC is stricter and prefers simpler models. AIC targets prediction; BIC targets recovering the data-generating model.</li>' +
    '<li><strong>&Delta; &lt; 2 means roughly equivalent.</strong> Treat models within 2 AIC units (Burnham &amp; Anderson) as substantially supported; &Delta; in [4, 7] is meaningful preference; &Delta; &gt; 10 is decisive.</li>' +
    '<li><strong>F-test only for nested pairs.</strong> The <code>anova(fit1, fit2)</code> F-test requires one model to be a strict subset of the other (every predictor in fit1 also in fit2). For non-nested models, AIC and BIC are the way; an F-test is undefined.</li>' +
    '<li><strong>Same data, please.</strong> AIC, BIC, and the F-test all assume identical n and identical response. Compare models fit on the same rows of the same outcome, untransformed.</li>' +
    '</ul></div>';

  root.innerHTML = nGuardHtml + tableHtml +
    (verdict ? '<p style="margin:14px 0 0;font-size:13.5px;line-height:1.6;color:var(--c-text)">' + verdict + '</p>' : '') +
    anovaHtml + caveatsHtml;
}

// ============================================================
// Forest plot viz
// ============================================================
function drawVizChart(){
  const svg = $('viz-svg'); if (!svg) return;
  const W = 360, H = 200;
  const ml = 80, mr = 20, mt = 14, mb = 28;
  const plotW = W - ml - mr;
  const titleEl = $('viz-title');

  // Compare mode: draw side-by-side R^2 and AIC bars (one row per model)
  if (activeMode === 'compare'){
    if (titleEl) titleEl.textContent = 'R^2 / AIC comparison';
    const have = state.models.map(m => m.parsed).filter(p => p && p.coefficients.length > 0);
    if (have.length < 2){
      svg.innerHTML = '<text class="ax-label" x="' + (W/2) + '" y="' + (H/2) + '" text-anchor="middle">paste 2+ models to compare</text>';
      $('viz-caption').innerHTML = 'Side-by-side R^2 and AIC bars per model (filled when both parse).';
      $('viz-readout').innerHTML = 'Awaiting at least 2 parsed models.';
      return;
    }
    const labels = have.map((_, i) => 'Model ' + String.fromCharCode(65 + i));
    const r2s = have.map(p => p.r2);
    const aics = have.map(approxAIC).map(v => v == null ? NaN : v);
    // Two-panel layout: left half R^2, right half AIC
    const gap = 18;
    const halfW = (W - ml - mr - gap) / 2;
    const r2Min = 0, r2Max = 1;
    const aicMin = Math.min(...aics) - Math.max(1, Math.abs(Math.min(...aics))*0.01);
    const aicMax = Math.max(...aics) + Math.max(1, Math.abs(Math.max(...aics))*0.01);
    const aicSpan = (aicMax - aicMin) || 1;
    const rowH = (H - mt - mb) / have.length;
    const barH = Math.max(8, rowH * 0.55);
    let body = '';
    // R^2 panel header
    body += '<text class="ax-label" x="' + (ml + halfW/2) + '" y="' + (mt - 2) + '" text-anchor="middle" style="font-size:10px;fill:var(--c-text-mute);font-weight:600">R^2</text>';
    body += '<text class="ax-label" x="' + (ml + halfW + gap + halfW/2) + '" y="' + (mt - 2) + '" text-anchor="middle" style="font-size:10px;fill:var(--c-text-mute);font-weight:600">AIC (lower=better)</text>';
    // axes
    body += '<line class="ax" x1="' + ml + '" y1="' + (H - mb) + '" x2="' + (ml + halfW) + '" y2="' + (H - mb) + '"/>';
    body += '<line class="ax" x1="' + (ml + halfW + gap) + '" y1="' + (H - mb) + '" x2="' + (W - mr) + '" y2="' + (H - mb) + '"/>';
    // R^2 axis ticks
    body += '<text class="tick-label" x="' + ml + '" y="' + (H - mb + 14) + '" text-anchor="start" style="font-size:9px">0</text>';
    body += '<text class="tick-label" x="' + (ml + halfW) + '" y="' + (H - mb + 14) + '" text-anchor="end" style="font-size:9px">1</text>';
    body += '<text class="tick-label" x="' + (ml + halfW + gap) + '" y="' + (H - mb + 14) + '" text-anchor="start" style="font-size:9px">' + fmt(aicMin,1) + '</text>';
    body += '<text class="tick-label" x="' + (W - mr) + '" y="' + (H - mb + 14) + '" text-anchor="end" style="font-size:9px">' + fmt(aicMax,1) + '</text>';
    const minAic = Math.min(...aics);
    const maxR2 = Math.max(...r2s.filter(v => v != null && isFinite(v)));
    have.forEach((p, i) => {
      const cy = mt + rowH * i + (rowH - barH)/2;
      const midY = cy + barH/2;
      // label
      body += '<text class="ax-label" x="' + (ml - 6) + '" y="' + (midY + 3).toFixed(1) + '" text-anchor="end" style="font-family:Inter,sans-serif;font-size:10.5px;fill:var(--c-text);font-weight:600">' + escapeHtml(labels[i]) + '</text>';
      // R^2 bar
      const r2v = (r2s[i] != null && isFinite(r2s[i])) ? r2s[i] : 0;
      const r2W = (r2v - r2Min)/(r2Max - r2Min) * halfW;
      const r2Win = isFinite(maxR2) && Math.abs(r2v - maxR2) < 1e-9;
      body += '<rect x="' + ml + '" y="' + cy.toFixed(1) + '" width="' + r2W.toFixed(1) + '" height="' + barH.toFixed(1) + '" fill="' + (r2Win ? 'var(--c-accent)' : 'var(--c-text-mute)') + '" opacity="' + (r2Win ? '1' : '0.55') + '" rx="2"/>';
      body += '<text x="' + (ml + r2W + 4).toFixed(1) + '" y="' + (midY + 3).toFixed(1) + '" style="font-family:ui-monospace,Consolas,monospace;font-size:10px;fill:var(--c-text)">' + fmt(r2v,3) + '</text>';
      // AIC bar (drawn from min so the smallest is shortest visible "deficit"; use scale)
      const aicV = aics[i];
      const xb = ml + halfW + gap;
      const aicW = isFinite(aicV) ? ((aicV - aicMin)/aicSpan * halfW) : 0;
      const aicWin = isFinite(aicV) && Math.abs(aicV - minAic) < 1e-9;
      body += '<rect x="' + xb + '" y="' + cy.toFixed(1) + '" width="' + Math.max(2, aicW).toFixed(1) + '" height="' + barH.toFixed(1) + '" fill="' + (aicWin ? 'var(--c-success)' : 'var(--c-text-mute)') + '" opacity="' + (aicWin ? '1' : '0.55') + '" rx="2"/>';
      body += '<text x="' + (xb + Math.max(2, aicW) + 4).toFixed(1) + '" y="' + (midY + 3).toFixed(1) + '" style="font-family:ui-monospace,Consolas,monospace;font-size:10px;fill:var(--c-text)">' + (isFinite(aicV) ? fmt(aicV,1) : '-') + '</text>';
    });
    svg.innerHTML = body;
    $('viz-caption').innerHTML = 'Higher R^2 and lower AIC are better; the leader on each metric is highlighted.';
    const minIdx = aics.indexOf(minAic);
    $('viz-readout').innerHTML = have.length + ' models compared &middot; lowest AIC: <strong>' + escapeHtml(labels[minIdx]) + '</strong> (' + fmt(minAic,2) + ')';
    return;
  }

  if (titleEl) titleEl.textContent = 'Coefficient forest plot';

  // Single mode: forest plot of the first parsed model
  const parsed = state.models[0] && state.models[0].parsed;
  if (!parsed || parsed.coefficients.length === 0){
    svg.innerHTML = '<text class="ax-label" x="' + (W/2) + '" y="' + (H/2) + '" text-anchor="middle">paste a summary block to render</text>';
    $('viz-readout').innerHTML = 'Paste a summary(lm()) block to render.';
    return;
  }
  const coefs = parsed.coefficients.filter(c => !c.aliased && isFinite(c.estimate) && isFinite(c.se));
  if (coefs.length === 0){
    svg.innerHTML = '<text class="ax-label" x="' + (W/2) + '" y="' + (H/2) + '" text-anchor="middle">no plottable coefficients</text>';
    $('viz-readout').innerHTML = 'No finite coefficients to plot.';
    return;
  }
  const tCrit = parsed.df ? qt(1 - (1 - ciLevel)/2, parsed.df) : 1.96;
  const intervals = coefs.map(c => ({name:c.name, est:c.estimate, lo:c.estimate - tCrit*c.se, hi:c.estimate + tCrit*c.se, p:c.p}));
  let xMin = Math.min(...intervals.map(i => i.lo), 0);
  let xMax = Math.max(...intervals.map(i => i.hi), 0);
  if (xMax - xMin < 1e-9){ xMax += 1; xMin -= 1; }
  const pad = (xMax - xMin) * 0.06;
  xMin -= pad; xMax += pad;
  const tx = v => ml + ((v - xMin) / (xMax - xMin)) * plotW;
  const rowH = (H - mt - mb) / Math.max(1, intervals.length);
  let body = '';
  // axis
  body += '<line class="ax" x1="' + ml + '" y1="' + (H - mb) + '" x2="' + (W - mr) + '" y2="' + (H - mb) + '"/>';
  // zero ref
  if (xMin <= 0 && xMax >= 0){
    body += '<line class="zero-ref" x1="' + tx(0).toFixed(1) + '" y1="' + mt + '" x2="' + tx(0).toFixed(1) + '" y2="' + (H - mb) + '"/>';
    body += '<text class="zero-label" x="' + tx(0).toFixed(1) + '" y="' + (H - mb + 14) + '" text-anchor="middle">0</text>';
  }
  // tick labels at xMin / xMax
  body += '<text class="tick-label" x="' + ml + '" y="' + (H - mb + 14) + '" text-anchor="start">' + fmt(xMin,2) + '</text>';
  body += '<text class="tick-label" x="' + (W - mr) + '" y="' + (H - mb + 14) + '" text-anchor="end">' + fmt(xMax,2) + '</text>';
  // intervals
  intervals.forEach((iv, i) => {
    const cy = mt + rowH * (i + 0.5);
    const sig = isFinite(iv.p) && iv.p < 0.05;
    const stroke = sig ? 'var(--c-accent)' : 'var(--c-text-mute)';
    const fill   = sig ? 'var(--c-accent)' : 'var(--c-text-mute)';
    body += '<text class="ax-label" x="' + (ml - 6) + '" y="' + (cy + 3).toFixed(1) + '" text-anchor="end" style="font-family:ui-monospace,Consolas,monospace;font-size:9.5px;fill:var(--c-text)">' + escapeHtml(iv.name.length > 12 ? iv.name.slice(0, 11) + '…' : iv.name) + '</text>';
    body += '<line x1="' + tx(iv.lo).toFixed(1) + '" y1="' + cy.toFixed(1) + '" x2="' + tx(iv.hi).toFixed(1) + '" y2="' + cy.toFixed(1) + '" stroke="' + stroke + '" stroke-width="1.6"/>';
    body += '<line x1="' + tx(iv.lo).toFixed(1) + '" y1="' + (cy - 3).toFixed(1) + '" x2="' + tx(iv.lo).toFixed(1) + '" y2="' + (cy + 3).toFixed(1) + '" stroke="' + stroke + '" stroke-width="1.4"/>';
    body += '<line x1="' + tx(iv.hi).toFixed(1) + '" y1="' + (cy - 3).toFixed(1) + '" x2="' + tx(iv.hi).toFixed(1) + '" y2="' + (cy + 3).toFixed(1) + '" stroke="' + stroke + '" stroke-width="1.4"/>';
    body += '<circle cx="' + tx(iv.est).toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="3.5" fill="' + fill + '" stroke="var(--c-surface)" stroke-width="1.5"/>';
  });
  body += '<text class="ax-label" x="' + ((ml + W - mr)/2) + '" y="' + (H - 4) + '" text-anchor="middle" style="font-style:italic">coefficient estimate</text>';
  svg.innerHTML = body;
  $('viz-caption').innerHTML = 'Estimate &plusmn; ' + ciPct() + '% CI per term; dashed line marks zero; significant terms (p &lt; 0.05) in accent.';
  $('viz-readout').innerHTML = intervals.length + ' coefficient' + (intervals.length===1?'':'s') + ' &middot; ' + intervals.filter(i=>i.p<0.05).length + ' significant at &alpha; = 0.05';
}

// ============================================================
// R code emission
// ============================================================
function refreshRCode(){
  const editor = $('r-code-rebuild'); if (!editor) return;
  const parsed = state.models[0] && state.models[0].parsed;
  let formula = (parsed && parsed.formula) ? parsed.formula : 'mpg ~ wt + hp';
  let dataExpr = 'mtcars';
  // Try to lift "data = something" from the call
  if (parsed && parsed.call){
    const dm = parsed.call.match(/data\s*=\s*([A-Za-z_][A-Za-z0-9_.]*)/);
    if (dm) dataExpr = dm[1];
  }
  // For compare mode, emit two fits + AIC/BIC/anova
  if (activeMode === 'compare' && state.models.length >= 2 && state.models[0].parsed && state.models[1].parsed){
    let f1 = state.models[0].parsed.formula || 'y ~ x1';
    let f2 = state.models[1].parsed.formula || 'y ~ x1 + x2';
    let dm = (state.models[0].parsed.call || '').match(/data\s*=\s*([A-Za-z_][A-Za-z0-9_.]*)/);
    let dat = dm ? dm[1] : 'mtcars';
    const code =
      '<span class="comment"># Fit both models on the same dataset</span>\n' +
      'fit1 <- <span class="fn">lm</span>(' + escapeHtml(f1) + ', data = <span class="number">' + escapeHtml(dat) + '</span>)\n' +
      'fit2 <- <span class="fn">lm</span>(' + escapeHtml(f2) + ', data = <span class="number">' + escapeHtml(dat) + '</span>)\n' +
      '<span class="fn">summary</span>(fit1); <span class="fn">summary</span>(fit2)\n' +
      '<span class="comment"># Information criteria + nested F-test</span>\n' +
      '<span class="fn">AIC</span>(fit1, fit2)\n' +
      '<span class="fn">BIC</span>(fit1, fit2)\n' +
      '<span class="fn">anova</span>(fit1, fit2)\n' +
      '<span class="comment"># Tidy table of coefficients with 95% CIs</span>\n' +
      '<span class="keyword">library</span>(<span class="fn">broom</span>); <span class="fn">tidy</span>(fit2, conf.int = <span class="keyword">TRUE</span>)';
    editor.innerHTML = code;
    return;
  }
  const code =
    '<span class="comment"># Fit and inspect the model</span>\n' +
    'fit <- <span class="fn">lm</span>(' + escapeHtml(formula) + ', data = <span class="number">' + escapeHtml(dataExpr) + '</span>)\n' +
    '<span class="fn">summary</span>(fit)\n' +
    '<span class="fn">confint</span>(fit, level = <span class="number">' + ciLevel + '</span>)   <span class="comment"># ' + ciPct() + '% CIs for each coefficient</span>\n' +
    '<span class="comment"># Diagnostic plots: residuals, Q-Q, scale-location, leverage</span>\n' +
    '<span class="fn">par</span>(mfrow = <span class="fn">c</span>(<span class="number">2</span>, <span class="number">2</span>)); <span class="fn">plot</span>(fit)\n' +
    '<span class="comment"># Tidy table with broom (one row per coefficient + 95% CI)</span>\n' +
    '<span class="keyword">library</span>(<span class="fn">broom</span>); <span class="fn">tidy</span>(fit, conf.int = <span class="keyword">TRUE</span>)\n' +
    '<span class="fn">glance</span>(fit)   <span class="comment"># one-row model summary (R^2, F, AIC, BIC, ...)</span>';
  editor.innerHTML = code;
}

// ============================================================
// Scenarios
// ============================================================
const SCENARIOS = {
  mtcars: {
    name:'mtcars (mpg ~ wt + hp)', icon:'\u{1F697}',
    story:'Predicting fuel economy (mpg) from car weight (wt) and horsepower (hp). Both expected to reduce mpg.',
    output:'Call:\nlm(formula = mpg ~ wt + hp, data = mtcars)\n\nResiduals:\n    Min      1Q  Median      3Q     Max\n-3.9410 -1.7895 -0.4757  1.2024  5.5311\n\nCoefficients:\n            Estimate Std. Error t value Pr(>|t|)\n(Intercept) 37.22727    1.59879  23.285  < 2e-16 ***\nwt          -3.87783    0.63273  -6.129 1.12e-06 ***\nhp          -0.03177    0.00903  -3.519  0.00145 **\n---\nSignif. codes:  0 \'***\' 0.001 \'**\' 0.01 \'*\' 0.05 \'.\' 0.1 \' \' 1\n\nResidual standard error: 2.593 on 29 degrees of freedom\nMultiple R-squared:  0.8268,\tAdjusted R-squared:  0.8148\nF-statistic: 69.21 on 2 and 29 DF,  p-value: 5.344e-12'
  },
  iris: {
    name:'iris regression', icon:'\u{1F33C}',
    story:'iris dataset: Sepal.Length on Sepal.Width plus Species (factor). Two factor dummies appear in the table.',
    output:'Call:\nlm(formula = Sepal.Length ~ Sepal.Width + Species, data = iris)\n\nResiduals:\n     Min       1Q   Median       3Q      Max\n-1.30711 -0.25713 -0.05325  0.19542  1.41253\n\nCoefficients:\n                  Estimate Std. Error t value Pr(>|t|)\n(Intercept)        2.25140    0.37116   6.066 1.45e-08 ***\nSepal.Width        0.59550    0.10872   5.477 1.94e-07 ***\nSpeciesversicolor  1.45813    0.11198  13.022  < 2e-16 ***\nSpeciesvirginica   1.94058    0.10052  19.305  < 2e-16 ***\n---\nSignif. codes:  0 \'***\' 0.001 \'**\' 0.01 \'*\' 0.05 \'.\' 0.1 \' \' 1\n\nResidual standard error: 0.4378 on 146 degrees of freedom\nMultiple R-squared:  0.7259,\tAdjusted R-squared:  0.7203\nF-statistic: 128.9 on 3 and 146 DF,  p-value: < 2.2e-16'
  },
  factor: {
    name:'Factor predictor', icon:'\u{1F3F7}',
    story:'A categorical predictor with several levels. R reports k-1 dummy coefficients comparing each level to the reference.',
    output:'Call:\nlm(formula = score ~ method + age, data = study)\n\nResiduals:\n    Min      1Q  Median      3Q     Max\n-23.456  -5.123  -0.456   5.789  19.234\n\nCoefficients:\n                Estimate Std. Error t value Pr(>|t|)\n(Intercept)      67.234      2.345  28.673  < 2e-16 ***\nmethodB           4.567      1.234   3.700 0.000287 ***\nmethodC           1.234      1.345   0.918  0.36012\nmethodD           7.890      1.456   5.420 1.23e-07 ***\nage              -0.234      0.045  -5.200 4.56e-07 ***\n---\nSignif. codes:  0 \'***\' 0.001 \'**\' 0.01 \'*\' 0.05 \'.\' 0.1 \' \' 1\n\nResidual standard error: 7.89 on 145 degrees of freedom\nMultiple R-squared:  0.4321,\tAdjusted R-squared:  0.4163\nF-statistic: 27.59 on 4 and 145 DF,  p-value: < 2.2e-16'
  },
  interaction: {
    name:'Interaction term', icon:'\u{1F517}',
    story:'mtcars again but with an interaction wt:hp. The interaction row tells you how the slope of one shifts per unit of the other.',
    output:'Call:\nlm(formula = mpg ~ wt * hp, data = mtcars)\n\nResiduals:\n    Min      1Q  Median      3Q     Max\n-3.0632 -1.6491 -0.7362  1.4211  4.5513\n\nCoefficients:\n              Estimate Std. Error t value Pr(>|t|)\n(Intercept) 49.808406   3.605279  13.816 5.01e-14 ***\nwt          -8.216553   1.269738  -6.471 5.20e-07 ***\nhp          -0.120137   0.024838  -4.836 4.53e-05 ***\nwt:hp        0.027847   0.008487   3.281  0.00277 **\n---\nSignif. codes:  0 \'***\' 0.001 \'**\' 0.01 \'*\' 0.05 \'.\' 0.1 \' \' 1\n\nResidual standard error: 2.153 on 28 degrees of freedom\nMultiple R-squared:  0.8848,\tAdjusted R-squared:  0.8724\nF-statistic: 71.66 on 3 and 28 DF,  p-value: 2.981e-13'
  },
  poly: {
    name:'Polynomial term', icon:'\u{1F4C8}',
    story:'A quadratic fit using poly(x, 2). The first poly term is the linear component, the second is curvature.',
    output:'Call:\nlm(formula = mpg ~ poly(hp, 2), data = mtcars)\n\nResiduals:\n    Min      1Q  Median      3Q     Max\n-4.5870 -1.6831 -0.7367  1.3155  8.7311\n\nCoefficients:\n               Estimate Std. Error t value Pr(>|t|)\n(Intercept)     20.0906     0.5435  36.964  < 2e-16 ***\npoly(hp, 2)1   -26.0456     3.0743  -8.473 2.51e-09 ***\npoly(hp, 2)2    13.1547     3.0743   4.279 0.000189 ***\n---\nSignif. codes:  0 \'***\' 0.001 \'**\' 0.01 \'*\' 0.05 \'.\' 0.1 \' \' 1\n\nResidual standard error: 3.077 on 29 degrees of freedom\nMultiple R-squared:  0.7561,\tAdjusted R-squared:  0.7393\nF-statistic: 44.95 on 2 and 29 DF,  p-value: 1.301e-09'
  },
  custom: {
    name:'Custom', icon:'\u{2699}',
    story:'Paste your own summary(lm()) output above.',
    output:''
  }
};

function loadScenario(key){
  const s = SCENARIOS[key]; if (!s) return;
  document.querySelectorAll('.scenario-card').forEach(c => c.classList.toggle('active', c.dataset.scenario === key));
  // Always go back to single mode for scenarios
  activeMode = 'single';
  state.mode = 'single';
  document.querySelectorAll('#mode-tabs .submode-tab').forEach(b => b.classList.toggle('active', b.dataset.mode === activeMode));
  $('add-model-btn').style.display = 'none';
  state.models = [{paste:s.output, parsed:null}];
  renderPasteBlocks();
  state.models[0].parsed = parseLmSummary(s.output);
  renderMethodColumn();
  renderBannerSentence();
  parseAllAndRender();
  toast('Loaded: ' + s.name);
}
function clearScenario(){
  document.querySelectorAll('.scenario-card').forEach(c => c.classList.remove('active'));
}

// ============================================================
// Toast + boot
// ============================================================
function toast(msg){
  const t = document.createElement('div'); t.className='toast'; t.textContent=msg;
  $('toast-area').appendChild(t); setTimeout(()=>t.remove(),3200);
}
function copyReport(){
  const el = $('report'); if (!el) return;
  navigator.clipboard?.writeText(el.textContent);
  const b = $('copybtn'); if (b){ b.textContent='Copied'; setTimeout(()=>{ b.textContent='Copy'; },1400); }
}

document.addEventListener('click', e => {
  const btn = e.target.closest('.webr-copy-btn');
  if (!btn) return;
  const editor = btn.closest('.webr-code-block')?.querySelector('.webr-editor');
  if (!editor) return;
  const txt = editor.innerText || editor.textContent || '';
  navigator.clipboard?.writeText(txt);
  toast('R code copied');
});

window.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('rstat_dark') === '1') document.documentElement.classList.add('dark');
  renderMethodColumn();
  renderPasteBlocks();
  renderBannerSentence();
  loadScenario('mtcars');
});

// ============================================================
// Smoke tests for the console
// ============================================================
window.runSmokeTests = function(){
  const tests = [
    {desc:'mtcars: 3 coefficients', fn:()=>parseLmSummary(SCENARIOS.mtcars.output).coefficients.length, expect:3},
    {desc:'mtcars: R^2 = 0.8268',  fn:()=>parseLmSummary(SCENARIOS.mtcars.output).r2, expect:0.8268},
    {desc:'mtcars: F = 69.21',     fn:()=>parseLmSummary(SCENARIOS.mtcars.output).f, expect:69.21},
    {desc:'iris: 4 coefficients',  fn:()=>parseLmSummary(SCENARIOS.iris.output).coefficients.length, expect:4},
    {desc:'iris: R^2 = 0.7259',    fn:()=>parseLmSummary(SCENARIOS.iris.output).r2, expect:0.7259},
    {desc:'interaction: 4 coefs',  fn:()=>parseLmSummary(SCENARIOS.interaction.output).coefficients.length, expect:4},
    {desc:'interaction: wt:hp parsed', fn:()=>parseLmSummary(SCENARIOS.interaction.output).coefficients.some(c => c.name==='wt:hp')?1:0, expect:1},
    {desc:'qnorm(0.975) ~ 1.96',   fn:()=>qnorm(0.975), expect:1.95996},
    {desc:'qt(0.975, 29) ~ 2.045', fn:()=>qt(0.975, 29), expect:2.045},
    {desc:'LMMath.fPValue(69.21,2,29) tiny', fn:()=>LMMath.fPValue(69.21,2,29), expect:0},
    {desc:'LMMath.aic(32,278.32,2) ~ 166.0', fn:()=>LMMath.aic(32,278.3219,2), expect:166.03},
    {desc:'LMMath.adjR2(0.8268,32,2) ~ 0.815', fn:()=>LMMath.adjR2(0.8268,32,2), expect:0.8148}
  ];
  console.group('lm() Output Interpreter smoke tests');
  let pass = 0;
  tests.forEach(t => {
    const got = t.fn();
    const ok = typeof got === 'number' && Math.abs(got - t.expect) < 0.005;
    console.log((ok?'PASS':'FAIL')+' '+t.desc+'  got='+got+' expected='+t.expect);
    if (ok) pass++;
  });
  console.log(pass + '/' + tests.length + ' passed');
  console.groupEnd();
};
