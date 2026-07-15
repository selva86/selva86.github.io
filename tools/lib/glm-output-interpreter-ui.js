// ============================================================
// glm() Output Interpreter - domain logic. All statistics come from the
// verified GLMMath library (tools/lib/glm-math.js), composing normal-math +
// ttest-math. No approximations live in this file.
// ============================================================
function $(id){ return document.getElementById(id); }
function fmt(x, d){ d = (d==null?4:d); if (x==null || !isFinite(x)) return '-'; return Number(x).toFixed(d).replace(/\.?0+$/,''); }
function fmtP(p){ if (!isFinite(p)) return '-'; if (p < 0.0001) return '<0.0001'; return Number(p).toFixed(4).replace(/\.?0+$/,''); }
// Odds / rate ratios span many orders of magnitude; a fixed 3-dp format rounds
// small ratios (e.g. 0.0003) to "0" and prints huge ones as long integers.
function fmtOR(x){ if (x==null || !isFinite(x)) return '-'; const a = Math.abs(x); if (a !== 0 && (a >= 1e5 || a < 1e-3)) return x.toExponential(2); return fmt(x, a < 1 ? 4 : 3); }
function escapeHtml(s){ return String(s==null?'':s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function clamp(x, lo, hi){ return Math.min(Math.max(x, lo), hi); }

// ---- family registry ----
const FAMILIES = {
  'binomial-logit':     {family:'binomial',     link:'logit',    label:'binomial(logit) / logistic', icon:'', exp:true,  scale:'odds'},
  'binomial-probit':    {family:'binomial',     link:'probit',   label:'binomial(probit)',  exp:false, scale:'latent'},
  'binomial-cloglog':   {family:'binomial',     link:'cloglog',  label:'binomial(cloglog)', exp:false, scale:'cloglog'},
  'poisson-log':        {family:'poisson',      link:'log',      label:'poisson(log)',      exp:true,  scale:'rate'},
  'quasipoisson-log':   {family:'quasipoisson', link:'log',      label:'quasipoisson(log)', exp:true,  scale:'rate'},
  'quasibinomial-logit':{family:'quasibinomial',link:'logit',    label:'quasibinomial(logit)', exp:true, scale:'odds'},
  'gaussian-identity':  {family:'gaussian',     link:'identity', label:'gaussian(identity)',exp:false, scale:'linear'},
  'Gamma-inverse':      {family:'Gamma',        link:'inverse',  label:'Gamma(inverse)',    exp:false, scale:'inverse'},
  'Gamma-log':          {family:'Gamma',        link:'log',      label:'Gamma(log)',        exp:true,  scale:'rate'},
  'negbin-log':         {family:'negbin',       link:'log',      label:'negative binomial(log)', exp:true, scale:'rate'}
};

const METHOD_META = {
  'binomial': { useWhen:'Binary outcome (yes / no, 0 / 1).', example:'survived ~ age + class on Titanic',
    inputs:['Full summary(glm()) text', 'Coefficient table with z values', 'Null and residual deviance lines', 'AIC line'] },
  'poisson': { useWhen:'Count outcome where the variance roughly equals the mean.', example:'breaks ~ wool + tension on warpbreaks',
    inputs:['Full summary(glm()) text', 'z values column', 'Deviance and AIC lines', 'Watch residual deviance / df greater than 1'] },
  'quasipoisson': { useWhen:'Count outcome with overdispersion (variance bigger than the mean).', example:'crashes ~ volume, family = quasipoisson',
    inputs:['Full summary(glm()) text', 't values column (not z)', 'Dispersion parameter line', 'AIC will read NA, that is normal'] },
  'quasibinomial': { useWhen:'Binary / proportion data with extra-binomial variance.', example:'cbind(ok, fail) ~ dose, family = quasibinomial',
    inputs:['Full summary(glm()) text', 't values column', 'Dispersion parameter line', 'AIC will read NA'] },
  'Gamma': { useWhen:'Strictly positive continuous outcome (durations, costs).', example:'wait ~ load, family = Gamma(link = "log")',
    inputs:['Full summary(glm()) text', 'Dispersion parameter line', 'Null and residual deviance'] },
  'gaussian': { useWhen:'Continuous outcome. Identity-link Gaussian glm equals lm().', example:'mpg ~ wt + hp, family = gaussian',
    inputs:['Full summary(glm()) text', 'Note: the lm interpreter gives cleaner R-squared output'] },
  'negbin': { useWhen:'Count outcome with overdispersion you want to model directly.', example:'glm.nb(crashes ~ volume + weather)',
    inputs:['Full summary(glm.nb()) text', 'Theta line if shown', 'Deviance and AIC lines'] }
};

// z reference (dispersion fixed) vs t reference (dispersion estimated)
function distForFamily(fam){
  if (!fam) return 'z';
  if (fam.family === 'binomial' || fam.family === 'poisson' || fam.family === 'negbin') return 'z';
  return 't';
}
function isQuasiFamily(fam){ return fam && (fam.family === 'quasipoisson' || fam.family === 'quasibinomial'); }
function dispersionDfOffset(fam){
  if (!fam) return 0;
  if (fam.family === 'gaussian' || fam.family === 'Gamma') return 1;
  return 0;
}

function detectFamily(callLine){
  if (!callLine) return null;
  if (/\bglm\.nb\s*\(/.test(callLine)) return FAMILIES['negbin-log'];
  let m = callLine.match(/family\s*=\s*([A-Za-z_.]+)\s*\(\s*(?:link\s*=\s*)?["']?([A-Za-z]+)["']?\s*\)/i);
  if (!m) m = callLine.match(/family\s*=\s*([A-Za-z_.]+)\s*\(/i);
  if (!m) m = callLine.match(/family\s*=\s*([A-Za-z_.]+)/i);
  if (!m) return null;
  let fam = m[1], link = m[2] || null;
  if (fam === 'gaussian' && !link) link = 'identity';
  if (fam === 'binomial' && !link) link = 'logit';
  if (fam === 'poisson' && !link) link = 'log';
  if (fam === 'quasipoisson' && !link) link = 'log';
  if (fam === 'quasibinomial' && !link) link = 'logit';
  if (fam === 'Gamma' && !link) link = 'inverse';
  const key = fam + '-' + link;
  return FAMILIES[key] || {family:fam, link:link||'?', label:fam+'('+(link||'?')+')', exp:false, scale:'unknown'};
}

// ---- parser for summary(glm) ----
function parseGlmSummary(text){
  if (!text || !text.trim()) return null;
  const lines = text.split(/\r?\n/).map(l => l.replace(/^\s*>\s?/, ''));
  const result = { raw:text, errors:[], call:null, coefficients:[], dispersion:null, dispersionFamily:null,
    nullDev:null, nullDf:null, residDev:null, residDf:null, aic:null, fisherIters:null, family:null };

  const callIdx = lines.findIndex(l => /^Call:/i.test(l.trim()));
  if (callIdx >= 0){
    let callLine = '';
    for (let i = callIdx + 1; i < lines.length && lines[i].trim() !== ''; i++){
      callLine += (callLine ? ' ' : '') + lines[i].trim();
      if (/\)\s*$/.test(callLine) && (callLine.match(/\(/g)||[]).length === (callLine.match(/\)/g)||[]).length) break;
    }
    result.call = callLine;
    result.family = detectFamily(callLine);
  }

  const coefIdx = lines.findIndex(l => /^Coefficients:/i.test(l.trim()));
  if (coefIdx >= 0){
    let i = coefIdx + 1;
    while (i < lines.length && !/Estimate/i.test(lines[i])) i++;
    if (i < lines.length) i++;
    while (i < lines.length){
      const t = lines[i].trim();
      if (!t) break;
      if (/^---/.test(t) || /^Signif/i.test(t) || /^\(Dispersion/i.test(t) || /^Null deviance/i.test(t)) break;
      // Glue "< 2e-16" / "> 0.99" into one token so the p-value survives tokenizing.
      const stripped = t.replace(/[*.]+\s*$/, '').trim().replace(/([<>])\s+(?=[\d.])/g, '$1');
      const sigMatch = t.match(/(\*+|\.)\s*$/);
      const sigStars = sigMatch ? sigMatch[1] : '';
      const tokens = stripped.split(/\s+/).filter(Boolean);
      const numRe = /^[<>]?\s*-?\d+(\.\d+)?(e[+-]?\d+)?$/i;
      const nums = [];
      for (let k = tokens.length - 1; k >= 0 && nums.length < 4; k--){
        const tok = tokens[k];
        if (/^NA$/i.test(tok)){ nums.unshift(NaN); }
        else if (numRe.test(tok)){ nums.unshift(parseFloat(tok.replace(/^[<>]/, ''))); }
        else break;
      }
      if (nums.length === 4){
        const name = tokens.slice(0, tokens.length - 4).join(' ');
        const [estimate, se, z, p] = nums;
        result.coefficients.push({name, estimate, se, z, p, stat:z, sig:sigStars, aliased:!isFinite(estimate)});
      }
      i++;
    }
  }
  if (result.coefficients.length === 0){
    result.errors.push(callIdx >= 0
      ? 'Looks like part of the summary is missing. Include everything from Coefficients: through the deviance lines.'
      : "Couldn't find a Coefficients table. Paste the full summary(glm()) output.");
  }

  const dispLine = lines.find(l => /Dispersion parameter for/i.test(l));
  if (dispLine){
    const m = dispLine.match(/Dispersion parameter for\s+(\S+)\s+family\s+taken to be\s+([0-9.eE+-]+|NA)/i);
    if (m){ result.dispersionFamily = m[1]; result.dispersion = m[2] === 'NA' ? NaN : parseFloat(m[2]); }
  }
  const nullLine = lines.find(l => /^\s*Null deviance/i.test(l));
  if (nullLine){ const m = nullLine.match(/Null deviance:\s*([0-9.eE+-]+)\s+on\s+(\d+)\s+degrees of freedom/i); if (m){ result.nullDev = parseFloat(m[1]); result.nullDf = parseInt(m[2]); } }
  const residLine = lines.find(l => /^\s*Residual deviance/i.test(l));
  if (residLine){ const m = residLine.match(/Residual deviance:\s*([0-9.eE+-]+)\s+on\s+(\d+)\s+degrees of freedom/i); if (m){ result.residDev = parseFloat(m[1]); result.residDf = parseInt(m[2]); } }
  const aicLine = lines.find(l => /^\s*AIC:/i.test(l));
  if (aicLine){ const m = aicLine.match(/AIC:\s*([0-9.eE+-]+|NA)/i); if (m) result.aic = m[1] === 'NA' ? NaN : parseFloat(m[1]); }
  const fisLine = lines.find(l => /Fisher Scoring iterations/i.test(l));
  if (fisLine){ const m = fisLine.match(/Fisher Scoring iterations:\s*(\d+)/i); if (m) result.fisherIters = parseInt(m[1]); }
  return result;
}

// ---- recompute coefficient statistic + p with the verified library ----
function recomputeCoefs(parsed, fam){
  const dist = distForFamily(fam);
  const canT = isFinite(parsed.residDf) && parsed.residDf > 0;
  parsed.coefficients.forEach(c => {
    if (c.aliased || !isFinite(c.estimate) || !isFinite(c.se)) return;
    if (dist === 't' && !canT) return;            // keep pasted t/p if no residual df
    const s = GLMMath.coefStat(c.estimate, c.se, parsed.residDf, dist);
    c.stat = s.stat; c.p = s.p;
  });
}

// ---- verdicts + interpretation ----
function pVerdict(p){
  if (!isFinite(p)) return {label:'unknown', cls:'none'};
  if (p > 0.10) return {label:'no evidence', cls:'none'};
  if (p > 0.05) return {label:'weak', cls:'weak'};
  if (p > 0.01) return {label:'evidence', cls:'evidence'};
  return {label:'strong', cls:'strong'};
}
function sigStars(p){
  if (!isFinite(p)) return '';
  if (p < 0.001) return '***';
  if (p < 0.01) return '**';
  if (p < 0.05) return '*';
  if (p < 0.1) return '.';
  return '';
}

function interpretCoefficient(c, fam, outcome){
  const out = outcome || 'the outcome';
  const v = pVerdict(c.p);
  if (c.aliased) return {badge:'none', html:'This coefficient is <strong>aliased</strong> (NA). Perfect collinearity with another predictor; drop one.'};
  const isIntercept = /^\(?Intercept\)?$/i.test(c.name);
  const isInteraction = /:|\*/.test(c.name);

  if (isIntercept){
    if (!fam) return {badge:v.cls, html:'Intercept = <strong>'+fmt(c.estimate)+'</strong> (SE = '+fmt(c.se)+').'};
    if (fam.scale === 'odds'){
      const p0 = 1 / (1 + Math.exp(-c.estimate));
      return {badge:v.cls, html:'Baseline log-odds = <strong>'+fmt(c.estimate)+'</strong>. Baseline odds = <strong>'+fmtOR(Math.exp(c.estimate))+'</strong>; baseline probability around <strong>'+fmt(p0*100,1)+'%</strong> (all predictors 0 or at reference).'};
    }
    if (fam.scale === 'rate'){
      return {badge:v.cls, html:'Baseline log-rate = <strong>'+fmt(c.estimate)+'</strong>. Baseline expected value = <strong>'+fmtOR(Math.exp(c.estimate))+'</strong> when all predictors are 0.'};
    }
    if (fam.scale === 'latent'){
      return {badge:v.cls, html:'Latent intercept = <strong>'+fmt(c.estimate)+'</strong>. Probability when all predictors are 0 around <strong>'+fmt(NormalMath.pnorm(c.estimate)*100,1)+'%</strong>.'};
    }
    return {badge:v.cls, html:'Intercept = <strong>'+fmt(c.estimate)+'</strong> on the link scale (SE = '+fmt(c.se)+').'};
  }
  if (isInteraction){
    if (fam && fam.exp){
      const ratio = Math.exp(c.estimate);
      return {badge:v.cls, html:'<strong>Interaction term.</strong> The '+fam.scale+' ratio is multiplied by <strong>'+fmtOR(ratio)+'</strong> for each unit of the other variable (log-scale = '+fmt(c.estimate)+', p = '+fmtP(c.p)+'). Plot predicted values; main effects become conditional.'};
    }
    return {badge:v.cls, html:'<strong>Interaction term.</strong> The slope on one variable shifts by <strong>'+fmt(c.estimate)+'</strong> per unit of the other (p = '+fmtP(c.p)+').'};
  }
  if (fam && fam.scale === 'odds'){
    const or = Math.exp(c.estimate), pct = (or - 1) * 100;
    return {badge:v.cls, html:'A 1-unit increase in <code>'+escapeHtml(c.name)+'</code> multiplies the <strong>odds</strong> of '+escapeHtml(out)+' by <strong>'+fmtOR(or)+'</strong> ('+(pct>=0?'+':'')+fmt(pct,1)+'%). Log-OR = '+fmt(c.estimate)+', SE = '+fmt(c.se)+', p = '+fmtP(c.p)+'.'};
  }
  if (fam && fam.scale === 'rate'){
    const rr = Math.exp(c.estimate), pct = (rr - 1) * 100;
    const noun = fam.family === 'Gamma' ? 'expected value' : 'expected count / rate';
    return {badge:v.cls, html:'A 1-unit increase in <code>'+escapeHtml(c.name)+'</code> multiplies the <strong>'+noun+'</strong> by <strong>'+fmtOR(rr)+'</strong> ('+(pct>=0?'+':'')+fmt(pct,1)+'%). Log-RR = '+fmt(c.estimate)+', SE = '+fmt(c.se)+', p = '+fmtP(c.p)+'.'};
  }
  if (fam && fam.scale === 'latent'){
    return {badge:v.cls, html:'A 1-unit increase in <code>'+escapeHtml(c.name)+'</code> shifts the latent z-score by <strong>'+fmt(c.estimate,3)+'</strong> (SE = '+fmt(c.se)+', p = '+fmtP(c.p)+'). For probability-scale effects use <code>marginaleffects</code>.'};
  }
  if (fam && fam.scale === 'cloglog'){
    return {badge:v.cls, html:'A 1-unit change in <code>'+escapeHtml(c.name)+'</code> shifts the cloglog linear predictor by <strong>'+fmt(c.estimate,3)+'</strong>; roughly multiplicative on the cumulative-incidence scale (p = '+fmtP(c.p)+').'};
  }
  const dir = c.estimate > 0 ? 'increase' : (c.estimate < 0 ? 'decrease' : 'no change');
  return {badge:v.cls, html:'Holding others constant, a 1-unit increase in <code>'+escapeHtml(c.name)+'</code> is associated with a <strong>'+fmt(Math.abs(c.estimate))+'</strong> '+(dir==='no change'?'':dir)+' on the link scale (SE = '+fmt(c.se)+', p = '+fmtP(c.p)+').'};
}

// ---- diagnostics ----
function diagnosticCallouts(parsed){
  const out = [];
  if (!parsed) return out;
  const fam = parsed.family;
  const aliased = parsed.coefficients.filter(c => c.aliased);
  if (aliased.length){ out.push({icon:'!', cls:'danger', text:'<strong>'+aliased.length+' aliased coefficient'+(aliased.length>1?'s':'')+'.</strong> The design matrix is rank-deficient. Drop redundant variables.'}); }
  if (fam && fam.family === 'binomial'){
    const sep = parsed.coefficients.filter(c => !c.aliased && Math.abs(c.estimate) > 10 && isFinite(c.se) && c.se > 10);
    if (sep.length){ out.push({icon:'!', cls:'danger', text:'<strong>Likely separation</strong> on '+sep.map(c=>'<code>'+escapeHtml(c.name)+'</code>').join(', ')+'. Use <code>brglm2</code> or <code>logistf</code>.'}); }
    if (parsed.fisherIters != null && parsed.fisherIters >= 25){ out.push({icon:'!', cls:'', text:'<strong>'+parsed.fisherIters+' Fisher iterations.</strong> Convergence struggled (separation, sparse data, or near-collinearity).'}); }
  }
  if (fam && (fam.family === 'poisson' || fam.family === 'binomial') && parsed.residDev != null && parsed.residDf > 0){
    const ratio = GLMMath.dispersionRatio(parsed.residDev, parsed.residDf);
    if (ratio > 1.5){
      out.push({icon:'!', cls:'', text: fam.family === 'poisson'
        ? '<strong>Overdispersion likely.</strong> Residual deviance / df = '+fmt(ratio,2)+' (much greater than 1). Switch to <code>quasipoisson</code> or <code>glm.nb()</code>.'
        : '<strong>Overdispersion likely.</strong> Residual deviance / df = '+fmt(ratio,2)+'. Try <code>quasibinomial</code> or a mixed model.'});
    }
  }
  if (isQuasiFamily(fam) && parsed.dispersion != null && isFinite(parsed.dispersion) && parsed.dispersion > 1.5){
    out.push({icon:'!', cls:'', text:'<strong>Dispersion = '+fmt(parsed.dispersion,2)+'.</strong> The quasi family inflates SEs by '+fmt(Math.sqrt(parsed.dispersion),2)+'x. Point estimates are unchanged.'});
  }
  if (fam && fam.family === 'gaussian' && fam.link === 'identity'){
    out.push({icon:'i', cls:'', text:'<strong>Gaussian (identity) glm equals lm().</strong> For cleaner R-squared and F output, refit with <code>lm()</code> and use the <a href="lm-output-interpreter.html">lm interpreter</a>.'});
  }
  if (parsed.residDf != null && parsed.residDf < 5){ out.push({icon:'!', cls:'', text:'<strong>Very few residual df ('+parsed.residDf+').</strong> Coefficients and SEs are unreliable.'}); }
  return out;
}

function modelDecision(parsed){
  if (!parsed) return null;
  const fam = parsed.family;
  if (parsed.coefficients.some(c => c.aliased)) return {cls:'broken', icon:'!', verdict:'Model has structural problems', text:'Aliased coefficients detected; the design matrix is not full rank.'};
  if (parsed.residDf != null && parsed.residDf < 3) return {cls:'broken', icon:'!', verdict:'Too few degrees of freedom', text:'Residual df = '+parsed.residDf+'; results are not trustworthy.'};
  if (fam && fam.family === 'binomial' && parsed.coefficients.some(c => !c.aliased && Math.abs(c.estimate) > 10 && isFinite(c.se) && c.se > 10))
    return {cls:'broken', icon:'!', verdict:'Likely separation', text:'Extreme estimates and SEs in a logistic fit; use a penalized method.'};
  let mcf = null, lrP = null;
  if (parsed.nullDev != null && parsed.residDev != null && parsed.nullDev > 0) mcf = GLMMath.pseudoR2(parsed.nullDev, parsed.residDev);
  if (parsed.nullDev != null && parsed.residDev != null && parsed.nullDf != null && parsed.residDf != null){
    const t = GLMMath.lrTest(parsed.nullDev, parsed.nullDf, parsed.residDev, parsed.residDf);
    if (t.df > 0 && t.lr >= 0) lrP = t.p;
  }
  if (mcf != null && mcf > 0.95) return {cls:'broken', icon:'!', verdict:'Suspiciously near-perfect fit', text:'Deviance pseudo-R2 = '+fmt(mcf,3)+'. Likely separation, leakage, or determinism.'};
  if (lrP != null && lrP < 0.05 && mcf != null && mcf > 0.10) return {cls:'solid', icon:'✓', verdict:'Solid model', text:'LR test rejects "no predictor matters" (p = '+fmtP(lrP)+'); pseudo-R2 = '+fmt(mcf,3)+' (about '+(mcf*100).toFixed(0)+'% deviance reduction).'};
  if (lrP != null && lrP < 0.05) return {cls:'solid', icon:'✓', verdict:'Significant but modest', text:'LR test p = '+fmtP(lrP)+'; pseudo-R2 = '+(mcf==null?'?':fmt(mcf,3))+'.'};
  if (lrP != null && lrP < 0.20) return {cls:'weak', icon:'?', verdict:'Borderline', text:'LR test p = '+fmtP(lrP)+'; some signal, not convincing on its own.'};
  if (lrP != null) return {cls:'weak', icon:'?', verdict:'No detectable signal', text:'LR test p = '+fmtP(lrP)+'.'};
  return {cls:'weak', icon:'?', verdict:'Inputs incomplete', text:"Couldn't compute the model-level test; paste the deviance lines."};
}

// ---- call / formula helpers ----
function extractOutcomeName(call){
  if (!call) return null;
  const start = call.search(/glm(\.nb)?\s*\(/i); if (start < 0) return null;
  let i = call.indexOf('(', start) + 1;
  const s0 = call.slice(i).match(/^\s*(?:formula\s*=\s*)?/i); if (s0) i += s0[0].length;
  let depth = 0, tildeAt = -1;
  for (let k = i; k < call.length; k++){ const ch = call[k]; if (ch==='(') depth++; else if (ch===')') depth--; else if (ch==='~' && depth===0){ tildeAt = k; break; } }
  if (tildeAt < 0) return null;
  return call.slice(i, tildeAt).trim();
}
function formulaFromCall(call){
  if (!call) return null;
  const start = call.search(/glm(\.nb)?\s*\(/i); if (start < 0) return null;
  let i = call.indexOf('(', start) + 1;
  const s0 = call.slice(i).match(/^\s*(?:formula\s*=\s*)?/i); if (s0) i += s0[0].length;
  let depth = 0;
  for (let k = i; k < call.length; k++){ const ch = call[k]; if (ch==='(') depth++; else if (ch===')') depth--; else if (ch===',' && depth===0) return call.slice(i, k).trim(); }
  return null;
}
function predictorList(call){ const f = formulaFromCall(call); if (!f) return null; const idx = f.indexOf('~'); return idx < 0 ? null : f.slice(idx+1).trim(); }
function predictorTerms(call){ const rhs = predictorList(call); return rhs ? rhs.split('+').map(s=>s.trim()).filter(Boolean) : null; }
function isNested(smallTerms, bigTerms){ if (!smallTerms || !bigTerms) return false; const big = new Set(bigTerms); return smallTerms.every(t => big.has(t)) && bigTerms.length > smallTerms.length; }

function computeBIC(m, fam){
  if (!isFinite(m.aic)) return NaN;
  const k = m.coefficients.length + dispersionDfOffset(fam);
  const n = (m.nullDf != null && isFinite(m.nullDf)) ? m.nullDf + 1 : null;
  if (!n || n <= 0) return null;
  return GLMMath.bicFromAic(m.aic, k, n);
}

function getActiveFamily(parsed){
  const ov = $('family-override-sel').value;
  if (ov !== 'auto' && FAMILIES[ov]) return FAMILIES[ov];
  return parsed && parsed.family ? parsed.family : null;
}
function getCiLevel(){ return ciLevel; }

// ============================================================
// State + scenarios
// ============================================================
let mode = 'single';
let ciLevel = 0.95;
const COMPARE_MAX = 5;
let compareCount = 2;

const SCENARIOS = {
  logistic_mtcars: { name:'Logistic on mtcars',
    story:'Predict transmission type (am: auto vs manual) from weight and horsepower.',
    output:'Call:\nglm(formula = am ~ wt + hp, family = binomial, data = mtcars)\n\nCoefficients:\n            Estimate Std. Error z value Pr(>|z|)\n(Intercept) 18.86630    7.44356   2.535  0.01126 *\nwt          -8.08348    3.06868  -2.634  0.00843 **\nhp           0.03625    0.01773   2.044  0.04091 *\n---\nSignif. codes:  0 \'***\' 0.001 \'**\' 0.01 \'*\' 0.05 \'.\' 0.1 \' \' 1\n\n(Dispersion parameter for binomial family taken to be 1)\n\n    Null deviance: 43.230  on 31  degrees of freedom\nResidual deviance: 10.059  on 29  degrees of freedom\nAIC: 16.059\n\nNumber of Fisher Scoring iterations: 8' },
  poisson_warpbreaks: { name:'Poisson on warpbreaks',
    story:'Predict the number of warp breaks from wool type (A / B) and tension level (L / M / H).',
    output:'Call:\nglm(formula = breaks ~ wool + tension, family = poisson, data = warpbreaks)\n\nCoefficients:\n            Estimate Std. Error z value Pr(>|z|)\n(Intercept)  3.69196    0.04541  81.302  < 2e-16 ***\nwoolB       -0.20599    0.05157  -3.994 6.49e-05 ***\ntensionM    -0.32132    0.06027  -5.332 9.73e-08 ***\ntensionH    -0.51849    0.06396  -8.107 5.21e-16 ***\n---\nSignif. codes:  0 \'***\' 0.001 \'**\' 0.01 \'*\' 0.05 \'.\' 0.1 \' \' 1\n\n(Dispersion parameter for poisson family taken to be 1)\n\n    Null deviance: 297.37  on 53  degrees of freedom\nResidual deviance: 210.39  on 50  degrees of freedom\nAIC: 493.06\n\nNumber of Fisher Scoring iterations: 4' },
  quasipoisson: { name:'Quasi-Poisson',
    story:'Same data, quasi-Poisson family lets dispersion float to absorb overdispersion.',
    output:'Call:\nglm(formula = breaks ~ wool + tension, family = quasipoisson, data = warpbreaks)\n\nCoefficients:\n            Estimate Std. Error t value Pr(>|t|)\n(Intercept)  3.69196    0.09374  39.385  < 2e-16 ***\nwoolB       -0.20599    0.10646  -1.935   0.0589 .\ntensionM    -0.32132    0.12440  -2.583   0.0128 *\ntensionH    -0.51849    0.13205  -3.927 0.000259 ***\n---\nSignif. codes:  0 \'***\' 0.001 \'**\' 0.01 \'*\' 0.05 \'.\' 0.1 \' \' 1\n\n(Dispersion parameter for quasipoisson family taken to be 4.262)\n\n    Null deviance: 297.37  on 53  degrees of freedom\nResidual deviance: 210.39  on 50  degrees of freedom\nAIC: NA\n\nNumber of Fisher Scoring iterations: 4' },
  logistic_interaction: { name:'Logistic with interaction',
    story:'Probability of admission depending on score and an applicant-type interaction.',
    output:'Call:\nglm(formula = admit ~ score * type, family = binomial, data = adm)\n\nCoefficients:\n                  Estimate Std. Error z value Pr(>|z|)\n(Intercept)       -3.21405    0.41123  -7.815 5.51e-15 ***\nscore              0.04412    0.00543   8.124 4.51e-16 ***\ntypeB             -0.71245    0.51234  -1.391  0.16432\nscore:typeB        0.01876    0.00712   2.635  0.00842 **\n---\nSignif. codes:  0 \'***\' 0.001 \'**\' 0.01 \'*\' 0.05 \'.\' 0.1 \' \' 1\n\n(Dispersion parameter for binomial family taken to be 1)\n\n    Null deviance: 567.45  on 499  degrees of freedom\nResidual deviance: 423.18  on 496  degrees of freedom\nAIC: 431.18\n\nNumber of Fisher Scoring iterations: 5' },
  gamma: { name:'Gamma (log link)',
    story:'Wait time (positive continuous) modeled with Gamma + log link; coefficients exponentiate to multiplicative effects.',
    output:'Call:\nglm(formula = wait ~ load + priority, family = Gamma(link = "log"), data = svc)\n\nCoefficients:\n            Estimate Std. Error t value Pr(>|t|)\n(Intercept)  1.45123    0.07823  18.551  < 2e-16 ***\nload         0.32145    0.04231   7.598 1.35e-12 ***\npriority    -0.18234    0.05613  -3.250  0.00134 **\n---\nSignif. codes:  0 \'***\' 0.001 \'**\' 0.01 \'*\' 0.05 \'.\' 0.1 \' \' 1\n\n(Dispersion parameter for Gamma family taken to be 0.521)\n\n    Null deviance: 134.56  on 199  degrees of freedom\nResidual deviance:  98.45  on 197  degrees of freedom\nAIC: 612.34\n\nNumber of Fisher Scoring iterations: 6' },
  custom: { name:'Custom', story:'Paste your own summary(glm()) output above.', output:'' }
};

function loadScenario(key){
  const s = SCENARIOS[key]; if (!s) return;
  document.querySelectorAll('.scenario-card').forEach(c => c.classList.toggle('active', c.dataset.scenario === key));
  mode = 'single';
  document.querySelectorAll('#mode-tabs .submode-tab').forEach(b => b.classList.toggle('active', b.dataset.mode === 'single'));
  $('single-input-area').style.display = '';
  $('compare-input-area').style.display = 'none';
  $('viz-svg').style.display = ''; $('viz-compare').style.display = 'none';
  $('viz-title').textContent = 'Coefficient forest plot';
  if (s.output !== '') $('glm-input').value = s.output;
  $('family-override-sel').value = 'auto';
  const note = $('scenario-note');
  if (key !== 'custom'){ note.textContent = s.story; note.classList.add('show'); } else { note.classList.remove('show'); }
  renderBannerSentence();
  parseAndRender();
  toast('Loaded: ' + s.name);
}
function clearScenario(){ document.querySelectorAll('.scenario-card').forEach(c => c.classList.remove('active')); $('scenario-note').classList.remove('show'); }

function setMode(m){
  mode = m;
  document.querySelectorAll('#mode-tabs .submode-tab').forEach(b => b.classList.toggle('active', b.dataset.mode === m));
  $('single-input-area').style.display = (m === 'single') ? '' : 'none';
  $('compare-input-area').style.display = (m === 'compare') ? '' : 'none';
  $('viz-svg').style.display = (m === 'single') ? '' : 'none';
  $('viz-compare').style.display = (m === 'compare') ? '' : 'none';
  $('viz-title').textContent = (m === 'compare') ? 'Deviance & AIC by model' : 'Coefficient forest plot';
  $('viz-caption').textContent = (m === 'compare') ? 'Residual deviance (lower = better fit) and AIC (lower = better trade-off) per model.' : 'Estimate ± ' + Math.round(ciLevel*100) + '% CI per predictor (intercept omitted) on the link scale; the dashed line marks no effect.';
  if (m === 'compare') renderCompareInputs();
  renderBannerSentence();
  parseAndRender();
}
function setCILevel(v){
  ciLevel = v;
  document.querySelectorAll('#ci-level-row .submode-tab').forEach(b => b.classList.toggle('active', parseFloat(b.dataset.ci) === v));
  $('viz-caption').textContent = (mode === 'compare') ? $('viz-caption').textContent : 'Estimate ± ' + Math.round(v*100) + '% CI per predictor (intercept omitted) on the link scale; the dashed line marks no effect.';
  parseAndRender();
}

function renderCompareInputs(){
  const list = $('compare-models-list'); if (!list) return;
  const existing = {};
  for (let i = 1; i <= COMPARE_MAX; i++){ const el = document.getElementById('glm-input-' + i); if (el) existing[i] = el.value; }
  let html = '';
  for (let i = 1; i <= compareCount; i++){
    const val = escapeHtml(existing[i] || '');
    const rm = (i > 2) ? '<button type="button" class="model-remove" onclick="removeCompareModel('+i+')" aria-label="Remove model '+i+'">&times;</button>' : '';
    html += '<div class="model-paste-block"><div class="model-paste-label"><span>Model ' + i + '</span>' + rm + '</div>' +
      '<textarea class="paste-box compare" id="glm-input-' + i + '" spellcheck="false" oninput="parseAndRender()" placeholder="Call:&#10;glm(y ~ x1' + (i>1 ? ' + x' + (i+1) : '') + ', family = binomial, data = d)&#10;..."></textarea></div>';
  }
  list.innerHTML = html;
  for (let i = 1; i <= compareCount; i++){ if (existing[i] != null){ const el = document.getElementById('glm-input-' + i); if (el) el.value = existing[i]; } }
  const btn = $('compare-add-btn'); if (btn) btn.disabled = compareCount >= COMPARE_MAX;
}
function addCompareModel(){ if (compareCount >= COMPARE_MAX) return; compareCount++; renderCompareInputs(); parseAndRender(); }
function removeCompareModel(i){
  if (compareCount <= 2) return;
  for (let k = i; k < compareCount; k++){ const a = document.getElementById('glm-input-' + k), b = document.getElementById('glm-input-' + (k+1)); if (a && b) a.value = b.value; }
  compareCount--; renderCompareInputs(); parseAndRender();
}

// ---- banner + method meta + inference ----
function renderBannerSentence(){
  const el = $('banner-sentence'); if (!el) return;
  const opts = [['single','interpret one model'], ['compare','compare 2+ models']];
  const cur = (opts.find(o => o[0] === mode) || opts[0])[1];
  let sel = '<span class="param">' + cur + '<span class="param-caret">&#9662;</span><select onchange="setMode(this.value)" aria-label="Mode">';
  opts.forEach(o => sel += '<option value="' + o[0] + '"' + (mode === o[0] ? ' selected' : '') + '>' + o[1] + '</option>');
  sel += '</select></span>';
  el.innerHTML = 'I want to ' + sel + ' from R\'s <span class="param is-static">summary(glm())</span> output.';
}
function updateMethodMeta(parsed){
  const fam = parsed && parsed.family ? parsed.family : null;
  const meta = METHOD_META[fam ? fam.family : 'binomial'] || METHOD_META.binomial;
  $('method-use-when').innerHTML = meta.useWhen;
  $('method-example').textContent = 'e.g. ' + meta.example;
  $('method-inputs-needed').innerHTML = meta.inputs.map(i => '<li>' + i + '</li>').join('');
}
function renderInferenceBanner(parsed, compareModels){
  const el = $('inference-banner'); if (!el) return;
  if (mode === 'compare'){
    const models = compareModels || [];
    if (models.length < 2){ el.innerHTML = 'Paste at least <b>2</b> <em>summary(glm())</em> blocks to compare. <span class="insig">Awaiting input.</span>'; return; }
    const aics = models.map(m => isFinite(m.aic) ? m.aic : null);
    let html = 'Comparing <b>' + models.length + '</b> models';
    if (aics.every(a => a != null)){
      const minA = Math.min.apply(null, aics), wi = aics.indexOf(minA), others = aics.filter((_, i) => i !== wi);
      html += ': <b>' + escapeHtml(models[wi].label) + '</b> has the lowest AIC';
      if (others.length) html += ' (<b>' + fmt(Math.min.apply(null, others) - minA, 2) + '</b> lower than the next)';
      html += '.';
    } else html += '. <span class="insig">AIC is not available for every model (quasi family).</span>';
    const a = models[0], b = models[1];
    const nested = isNested(a.terms, b.terms) ? {small:a, big:b} : (isNested(b.terms, a.terms) ? {small:b, big:a} : null);
    if (nested && nested.small.residDev != null && nested.big.residDev != null && nested.small.residDf != null && nested.big.residDf != null){
      const r = GLMMath.nestedChisq(nested.small.residDev, nested.small.residDf, nested.big.residDev, nested.big.residDf);
      if (r.df > 0 && r.dev >= 0){ const sig = r.p < 0.05; html += ' The nested LR test gives p = <b>' + fmtP(r.p) + '</b>, <span class="' + (sig ? 'sig' : 'insig') + '">' + (sig ? 'significant' : 'not significant') + '</span>.'; }
    } else html += ' The first two models are <em>not nested</em>; the LR test is undefined.';
    el.innerHTML = html; return;
  }
  if (!parsed || parsed.errors.length > 0 || parsed.coefficients.length === 0){ el.innerHTML = 'Paste a <em>summary(glm())</em> block to read every coefficient on the odds / rate scale. <span class="insig">Awaiting paste.</span>'; return; }
  const fam = parsed.family;
  const outcome = extractOutcomeName(parsed.call);
  let strongest = null;
  parsed.coefficients.forEach(c => { if (/^\(?Intercept\)?$/i.test(c.name) || c.aliased || !isFinite(c.p)) return; if (!strongest || c.p < strongest.p) strongest = c; });
  let html = 'This <b>' + escapeHtml(fam ? fam.label : 'GLM') + '</b> models <b>' + escapeHtml(outcome || 'the outcome') + '</b> with link <b>' + escapeHtml(fam ? fam.link : '?') + '</b>.';
  if (parsed.nullDev != null && parsed.residDev != null){
    html += ' Null deviance <b>' + fmt(parsed.nullDev, 2) + '</b>, residual <b>' + fmt(parsed.residDev, 2) + '</b>.';
    if (parsed.nullDev > 0) html += ' Deviance pseudo-R<sup>2</sup> = <b>' + fmt(GLMMath.pseudoR2(parsed.nullDev, parsed.residDev), 3) + '</b>.';
  }
  if (isFinite(parsed.aic)) html += ' AIC = <b>' + fmt(parsed.aic, 2) + '</b>.';
  if (strongest){
    if (fam && fam.exp){ const scale = fam.scale === 'odds' ? 'OR' : 'RR'; html += ' Strongest predictor: <b>' + escapeHtml(strongest.name) + '</b> (' + scale + ' = <b>' + fmtOR(Math.exp(strongest.estimate)) + '</b>, p = <b>' + fmtP(strongest.p) + '</b>).'; }
    else html += ' Strongest predictor: <b>' + escapeHtml(strongest.name) + '</b> (&beta; = <b>' + fmt(strongest.estimate, 3) + '</b>, p = <b>' + fmtP(strongest.p) + '</b>).';
  }
  el.innerHTML = html;
}

// ============================================================
// Render: single
// ============================================================
function parseAndRender(){
  if (mode === 'compare'){ renderCompare(); return; }
  const parsed = parseGlmSummary($('glm-input').value);
  if (!parsed){
    $('parse-status').innerHTML = 'Awaiting paste&hellip;';
    $('family-display').innerHTML = ''; $('parse-errors').innerHTML = '';
    $('summary').innerHTML = 'Paste a <code>summary(glm(...))</code> block on the left for a plain-English interpretation.';
    $('decision-card').style.display = 'none'; $('callouts-area').innerHTML = ''; $('result-area').innerHTML = '';
    updateMethodMeta(null); updateRCode(null); drawForest(null); renderInferenceBanner(null); return;
  }
  const fam = getActiveFamily(parsed);
  parsed.family = fam || parsed.family;
  recomputeCoefs(parsed, fam);
  updateMethodMeta(parsed);
  $('family-display').innerHTML = fam ? '<span class="family-badge">Family: ' + escapeHtml(fam.label) + '</span>' : '<span class="family-badge unknown">Family: unknown</span>';
  $('parse-status').innerHTML = parsed.errors.length ? '<span class="warn">Partial parse</span>' : '<span class="ok">&check; Parsed</span>';

  if (parsed.errors.length){
    $('parse-errors').innerHTML = parsed.errors.map(e => '<div class="parse-error">' + e + '</div>').join('');
    $('decision-card').style.display = 'none'; $('summary').textContent = parsed.errors[0];
    $('callouts-area').innerHTML = ''; $('result-area').innerHTML = ''; updateRCode(null); drawForest(null); renderInferenceBanner(null); return;
  }
  $('parse-errors').innerHTML = '';

  const dec = modelDecision(parsed);
  if (dec){ const dc = $('decision-card'); dc.style.display = ''; dc.className = 'decision-card ' + dec.cls; $('dc-icon').textContent = dec.icon; $('dc-verdict').textContent = dec.verdict; $('dc-rationale').textContent = dec.text; }
  else $('decision-card').style.display = 'none';

  const outcome = extractOutcomeName(parsed.call);
  const preds = parsed.coefficients.filter(c => !/^\(?Intercept\)?$/i.test(c.name));
  const sigCount = preds.filter(c => !c.aliased && isFinite(c.p) && c.p < 0.05).length;
  if (parsed.nullDev != null && parsed.residDev != null && parsed.nullDev > 0){
    $('summary').innerHTML = 'Your <strong>' + escapeHtml(fam ? fam.label : 'unknown family') + '</strong> model has <strong>' + preds.length + '</strong> predictor' + (preds.length===1?'':'s') + (outcome ? ' of <strong>' + escapeHtml(outcome) + '</strong>' : '') + '. Deviance pseudo-R<sup>2</sup> = <strong>' + fmt(GLMMath.pseudoR2(parsed.nullDev, parsed.residDev), 3) + '</strong>. <strong>' + sigCount + ' of ' + preds.length + '</strong> ' + (sigCount===1?'is':'are') + ' significant at &alpha; = 0.05.';
  } else $('summary').innerHTML = 'Parsed ' + parsed.coefficients.length + ' coefficient' + (parsed.coefficients.length===1?'':'s') + '.';

  const callouts = diagnosticCallouts(parsed);
  $('callouts-area').innerHTML = callouts.map(c => '<div class="callout ' + (c.cls||'') + '"><span class="callout-icon">' + c.icon + '</span><div>' + c.text + '</div></div>').join('');

  // Coefficient table
  const ciPct = Math.round(ciLevel * 100);
  const dist = distForFamily(fam);
  const statLabel = dist === 't' ? 't' : 'z';
  const expCol = fam && fam.exp;
  const expLabel = fam ? (fam.scale === 'odds' ? 'OR' : (fam.scale === 'rate' ? 'RR' : 'exp(b)')) : 'exp(b)';
  let html = '<div class="coltag">Coefficients</div>';
  html += '<div style="overflow-x:auto"><table class="coef-table"><thead><tr><th>name</th><th class="num">est</th>' + (expCol ? '<th class="num">' + expLabel + '</th>' : '') + '<th class="num">SE</th><th class="num">' + statLabel + '</th><th class="num">p</th><th class="num">' + (expCol ? expLabel + ' ' + ciPct + '%' : ciPct + '% CI') + '</th></tr></thead><tbody>';
  parsed.coefficients.forEach(c => {
    const cls = c.aliased ? 'aliased' : '';
    let ciStr = '-', expStr = '';
    if (!c.aliased && isFinite(c.estimate) && isFinite(c.se)){
      const ci = GLMMath.coefCI(c.estimate, c.se, ciLevel);
      if (expCol){ const e = GLMMath.expCI(c.estimate, c.se, ciLevel); expStr = fmtOR(e.est); ciStr = '(' + fmtOR(e.lo) + ', ' + fmtOR(e.hi) + ')'; }
      else ciStr = '(' + fmt(ci.lo, 3) + ', ' + fmt(ci.hi, 3) + ')';
    }
    const stars = sigStars(c.p);
    html += '<tr class="' + cls + '"><td>' + escapeHtml(c.name) + '</td><td class="num">' + (c.aliased ? 'NA' : fmt(c.estimate, 4)) + '</td>' + (expCol ? '<td class="num">' + expStr + '</td>' : '') + '<td class="num">' + fmt(c.se, 4) + '</td><td class="num">' + (isFinite(c.stat) ? fmt(c.stat, 3) : '-') + '</td><td class="num">' + fmtP(c.p) + (stars ? '<span class="sig-stars">' + stars + '</span>' : '') + '</td><td class="num">' + ciStr + '</td></tr>';
  });
  html += '</tbody></table></div>';

  // Fit grid
  if (parsed.nullDev != null && parsed.residDev != null){
    const mcf = parsed.nullDev > 0 ? GLMMath.pseudoR2(parsed.nullDev, parsed.residDev) : null;
    const lr = GLMMath.lrTest(parsed.nullDev, parsed.nullDf != null ? parsed.nullDf : 0, parsed.residDev, parsed.residDf != null ? parsed.residDf : 0);
    const lrP = (lr.df > 0 && lr.lr >= 0) ? lr.p : null;
    let g = '<div class="fit-grid">';
    g += '<div class="fit-cell"><div class="fit-key">pseudo-R2</div><div class="fit-val">' + (mcf==null?'-':fmt(mcf,3)) + '</div><div class="fit-sub" style="color:var(--c-text-mute)">deviance</div></div>';
    g += '<div class="fit-cell"><div class="fit-key">LR chi-sq</div><div class="fit-val">' + fmt(lr.lr,2) + '</div><div class="fit-sub" style="color:var(--c-text-mute)">' + lr.df + ' df</div></div>';
    g += '<div class="fit-cell"><div class="fit-key">LR p</div><div class="fit-val">' + (lrP==null?'-':fmtP(lrP)) + '</div></div>';
    g += '<div class="fit-cell"><div class="fit-key">AIC</div><div class="fit-val">' + (isFinite(parsed.aic)?fmt(parsed.aic,2):'NA') + '</div></div>';
    if (parsed.dispersion != null && isFinite(parsed.dispersion)){
      g += '<div class="fit-cell"><div class="fit-key">phi</div><div class="fit-val">' + fmt(parsed.dispersion,3) + '</div><div class="fit-sub" style="color:var(--c-text-mute)">dispersion</div></div>';
    } else if (parsed.residDf > 0){
      const ratio = GLMMath.dispersionRatio(parsed.residDev, parsed.residDf);
      let vv = 'OK', col = 'var(--c-success)';
      if (ratio > 1.5){ vv = 'over-disp'; col = 'var(--c-danger)'; } else if (ratio > 1.2){ vv = 'mild'; col = 'var(--c-warn)'; }
      g += '<div class="fit-cell"><div class="fit-key">D / df</div><div class="fit-val">' + fmt(ratio,2) + '</div><div class="fit-sub" style="color:' + col + '">' + vv + '</div></div>';
    }
    if ((fam && (fam.family === 'poisson' || fam.family === 'binomial')) && parsed.residDf > 0){
      g += '<div class="fit-cell"><div class="fit-key">GOF p</div><div class="fit-val">' + fmtP(GLMMath.devianceGOF(parsed.residDev, parsed.residDf)) + '</div><div class="fit-sub" style="color:var(--c-text-mute)">deviance</div></div>';
    }
    g += '</div>';
    html += g;
  }

  // Coefficient-by-coefficient
  html += '<div class="coltag">Coefficient by coefficient</div>';
  parsed.coefficients.forEach(c => {
    const it = interpretCoefficient(c, fam, outcome);
    html += '<div class="coef-interp"><div class="ci-name"><code>' + escapeHtml(c.name) + '</code> <span class="ci-badge ' + it.badge + '">' + pVerdict(c.p).label + '</span></div><div class="ci-text">' + it.html + '</div></div>';
  });

  // Journal-ready report line
  if (parsed.nullDev != null && parsed.residDev != null && parsed.nullDev > 0){
    const lr = GLMMath.lrTest(parsed.nullDev, parsed.nullDf||0, parsed.residDev, parsed.residDf||0);
    const rpt = 'glm(' + (formulaFromCall(parsed.call) || '?') + ', ' + (fam ? fam.label : 'family') + '): pseudo-R2 = ' + fmt(GLMMath.pseudoR2(parsed.nullDev, parsed.residDev), 3) + ', LR chi-sq(' + lr.df + ') = ' + fmt(lr.lr, 2) + ', p = ' + fmtP(lr.p) + (isFinite(parsed.aic) ? ', AIC = ' + fmt(parsed.aic, 2) : '') + '; ' + sigCount + ' of ' + preds.length + ' predictor' + (preds.length===1?'':'s') + ' significant at p<0.05.';
    html += '<div class="report-row" style="display:flex;gap:10px;align-items:flex-start;margin-top:14px;padding-top:12px;border-top:1px solid rgba(0,0,0,.08)"><span class="report" id="report" style="flex:1;font-size:12.5px;color:var(--c-text-soft);line-height:1.5">' + escapeHtml(rpt) + '</span><button type="button" class="copy" id="copybtn" onclick="copyReport()" style="flex:none;font:600 12.5px/1 inherit;background:var(--c-accent);color:#fff;border:none;border-radius:6px;padding:7px 11px;cursor:pointer">Copy</button></div>';
  }

  $('result-area').innerHTML = html;
  updateRCode(parsed);
  drawForest(parsed);
  renderInferenceBanner(parsed);
}

// ============================================================
// Render: compare
// ============================================================
function renderCompare(){
  const texts = [];
  for (let i = 1; i <= compareCount; i++){ const el = document.getElementById('glm-input-' + i); texts.push(el ? el.value : ''); }
  const models = texts.map((t, i) => { const p = parseGlmSummary(t); if (p){ p.label = 'Model ' + (i+1); if (p.family) recomputeCoefs(p, p.family); } return p; }).filter(p => p && p.coefficients.length > 0);

  updateMethodMeta(models[0] || null);
  if (models.length < 2){
    $('summary').innerHTML = 'Paste at least two model summaries to compare.';
    $('decision-card').style.display = 'none'; $('callouts-area').innerHTML = ''; $('result-area').innerHTML = '';
    $('parse-status').innerHTML = '<span class="warn">' + models.length + ' model' + (models.length===1?'':'s') + ' parsed</span>';
    $('family-display').innerHTML = '';
    updateRCode(null); drawCompareBars([]); renderInferenceBanner(null, models); return;
  }

  const fam = models[0].family, isQ = isQuasiFamily(fam);
  $('parse-status').innerHTML = '<span class="ok">&check; ' + models.length + ' models parsed</span>';
  $('family-display').innerHTML = fam ? '<span class="family-badge">Family: ' + escapeHtml(fam.label) + '</span>' : '';
  $('decision-card').style.display = 'none';

  const families = new Set(models.map(m => m.family ? m.family.label : 'unknown'));
  $('callouts-area').innerHTML = (families.size > 1) ? '<div class="callout danger"><span class="callout-icon">!</span><div><strong>Mixed families.</strong> AIC, BIC and pseudo-R2 are not comparable across distribution families. Refit on the same family before comparing.</div></div>' : '';

  models.forEach(m => {
    m.n = (m.nullDf != null && isFinite(m.nullDf)) ? m.nullDf + 1 : null;
    m.mcf = (m.nullDev > 0 && m.residDev != null) ? GLMMath.pseudoR2(m.nullDev, m.residDev) : null;
    m.bic = computeBIC(m, m.family);
    m.predictors = predictorList(m.call) || '?';
    m.terms = predictorTerms(m.call);
  });

  const allAic = models.every(m => isFinite(m.aic));
  let bestAic = -1; if (allAic){ bestAic = 0; models.forEach((m, i) => { if (m.aic < models[bestAic].aic) bestAic = i; }); }
  const allBic = models.every(m => isFinite(m.bic));
  let bestBic = -1; if (allBic){ bestBic = 0; models.forEach((m, i) => { if (m.bic < models[bestBic].bic) bestBic = i; }); }

  let html = '<div class="coltag">Model comparison</div><div style="overflow-x:auto"><table class="compare-table"><thead><tr><th>Model</th><th>Predictors</th><th>Family</th><th class="num">n</th><th class="num">resid df</th><th class="num">null dev</th><th class="num">resid dev</th><th class="num">AIC</th><th class="num">BIC</th><th class="num">pseudo-R2</th></tr></thead><tbody>';
  models.forEach((m, i) => {
    html += '<tr class="' + (i === bestAic ? 'best' : '') + '"><td>' + m.label + '</td><td class="formula-cell">' + escapeHtml(m.predictors) + '</td><td>' + (m.family ? escapeHtml(m.family.label) : 'unknown') + '</td>' +
      '<td class="num">' + (m.n==null?'-':m.n) + '</td><td class="num">' + (m.residDf==null?'-':m.residDf) + '</td>' +
      '<td class="num">' + (m.nullDev==null?'-':fmt(m.nullDev,2)) + '</td><td class="num">' + (m.residDev==null?'-':fmt(m.residDev,2)) + '</td>' +
      '<td class="num">' + (isFinite(m.aic)?fmt(m.aic,2):'NA') + '</td><td class="num">' + (isFinite(m.bic)?fmt(m.bic,2):'NA') + '</td>' +
      '<td class="num">' + (m.mcf==null?'-':fmt(m.mcf,3)) + '</td></tr>';
  });
  html += '</tbody></table></div>';

  // Nested tests on consecutive pairs
  const lrtRows = [];
  for (let i = 0; i < models.length - 1; i++){
    const a = models[i], b = models[i+1];
    if (isNested(a.terms, b.terms) && a.residDev != null && b.residDev != null && a.residDf != null && b.residDf != null){
      if (isQ){
        const phi = (b.dispersion && isFinite(b.dispersion)) ? b.dispersion : 1;
        const r = GLMMath.nestedF(a.residDev, a.residDf, b.residDev, b.residDf, phi);
        lrtRows.push({label:a.label + ' → ' + b.label, test:'F-test', stat:'F = ' + fmt(r.f,3), df:r.df1, p:fmtP(r.p), praw:r.p});
      } else {
        const r = GLMMath.nestedChisq(a.residDev, a.residDf, b.residDev, b.residDf);
        lrtRows.push({label:a.label + ' → ' + b.label, test:'LR chi-sq', stat:'chi-sq = ' + fmt(r.dev,2), df:r.df, p:fmtP(r.p), praw:r.p});
      }
    } else if (a.terms && b.terms){ lrtRows.push({label:a.label + ' → ' + b.label, test:'Not nested', stat:'-', df:'-', p:'-', praw:null}); }
  }
  if (lrtRows.length){
    html += '<div class="coltag">Nested test (consecutive pairs)</div><div style="overflow-x:auto"><table class="compare-table"><thead><tr><th>Pair</th><th>Test</th><th class="num">statistic</th><th class="num">df</th><th class="num">p</th></tr></thead><tbody>';
    lrtRows.forEach(r => html += '<tr class="lrt-row"><td class="lrt-label">' + r.label + '</td><td class="lrt-label">' + r.test + '</td><td class="num">' + r.stat + '</td><td class="num">' + r.df + '</td><td class="num">' + r.p + '</td></tr>');
    html += '</tbody></table></div>';
  }

  const rec = [];
  if (allAic) rec.push('<strong>Lowest AIC:</strong> ' + models[bestAic].label + ' (' + fmt(models[bestAic].aic,2) + ').');
  else if (isQ) rec.push('<strong>AIC is NA</strong> for quasi families (no full likelihood). Use the F-test on nested pairs and inspect the dispersion.');
  else rec.push('<strong>AIC unavailable</strong> for at least one model; compare via deviance and the nested LR test.');
  if (allBic && bestBic >= 0) rec.push('<strong>Lowest BIC:</strong> ' + models[bestBic].label + ' (' + fmt(models[bestBic].bic,2) + '). BIC penalizes complexity more than AIC.');
  const sigL = lrtRows.filter(r => r.praw != null && r.praw < 0.05);
  if (sigL.length) rec.push('<strong>Nested test rejects the smaller model:</strong> ' + escapeHtml(sigL.map(r => r.label).join('; ')) + ' (p &lt; 0.05).');
  else if (lrtRows.some(r => r.praw != null)) rec.push('No nested pair shows a significant improvement at &alpha; = 0.05; the simpler model is competitive.');
  html += '<div class="compare-recommendation">' + rec.join(' ') + '</div>';

  html += '<div class="compare-caveats"><strong>Caveats.</strong><ul>' +
    '<li>AIC, BIC and pseudo-R2 are only meaningful on the <em>same data</em> and <em>same response</em>.</li>' +
    '<li>Comparing across distribution families is not valid; the likelihoods live on different scales.</li>' +
    '<li>The likelihood-ratio / F test is only valid for <em>nested</em> models; non-nested pairs are flagged above.</li>' +
    '<li>Quasi families have AIC = NA; the F-test divides the deviance difference by the estimated dispersion.</li>' +
    '<li>BIC here is reconstructed from AIC, the parameter count, and n = null df + 1; it matches R\'s <code>BIC()</code> for the standard families.</li></ul></div>';

  $('summary').innerHTML = 'Comparing <strong>' + models.length + '</strong> ' + (fam ? escapeHtml(fam.label) : '') + ' models on n = ' + (models[0].n==null?'?':models[0].n) + ' observations.';
  $('result-area').innerHTML = html;
  updateRCode(models[0], models);
  drawCompareBars(models);
  renderInferenceBanner(null, models);
}

// ============================================================
// R code emitter
// ============================================================
function updateRCode(parsed, compareModels){
  const editor = $('r-code-rebuild'); if (!editor) return;
  const fam = parsed && parsed.family ? parsed.family : null;
  let code = '';
  if (compareModels && compareModels.length >= 2){
    const isQ = fam && isQuasiFamily(fam);
    const dataName = (compareModels[0].call && compareModels[0].call.match(/data\s*=\s*([\w.]+)/i) || [])[1] || 'd';
    const fitNames = compareModels.map((_, i) => 'fit' + (i+1));
    code = '# Compare GLM fits\n';
    compareModels.forEach((m, i) => {
      const f = formulaFromCall(m.call) || ('y ~ x' + (i+1));
      const fs = m.family ? (m.family.family === 'Gamma' ? 'Gamma(link = "' + m.family.link + '")' : m.family.family) : 'binomial';
      code += m.family && m.family.family === 'negbin' ? fitNames[i] + ' <- MASS::glm.nb(' + f + ', data = ' + dataName + ')\n' : fitNames[i] + ' <- glm(' + f + ', family = ' + fs + ', data = ' + dataName + ')\n';
    });
    code += '\n# AIC and BIC (NA for quasi families)\nAIC(' + fitNames.join(', ') + '); BIC(' + fitNames.join(', ') + ')\n\n';
    code += '# Likelihood-ratio (or F) test for nested pairs\nanova(' + fitNames.join(', ') + ', test = "' + (isQ ? 'F' : 'Chisq') + '")\n\n';
    const last = fitNames[fitNames.length-1];
    code += '# Deviance pseudo-R2 for the largest model\n1 - ' + last + '$deviance / ' + last + '$null.deviance\n';
  } else if (parsed && parsed.call){
    const formula = formulaFromCall(parsed.call) || 'am ~ wt + hp';
    const family = fam ? fam.family : 'binomial', link = fam ? fam.link : 'logit';
    const dataName = (parsed.call.match(/data\s*=\s*([\w.]+)/i) || [])[1] || 'mtcars';
    code = '# Reproduce the model\n';
    code += fam && fam.family === 'negbin' ? 'fit <- MASS::glm.nb(' + formula + ', data = ' + dataName + ')\n' : 'fit <- glm(' + formula + ', data = ' + dataName + ', family = ' + (family === 'Gamma' ? 'Gamma(link = "' + link + '")' : family) + ')\n';
    code += 'summary(fit)\n\n';
    if (fam && fam.exp){
      code += '# Exponentiated coefficients (' + (fam.scale === 'odds' ? 'odds ratios' : 'rate ratios') + ')\n';
      code += 'exp(coef(fit))\nexp(confint.default(fit, level = ' + ciLevel + '))\n\n';
    } else {
      code += '# Coefficient CIs (Wald)\nconfint.default(fit, level = ' + ciLevel + ')\n\n';
    }
    code += '# Deviance pseudo-R2 and LR test vs the null\n1 - fit$deviance / fit$null.deviance\nanova(fit, test = "Chisq")\n';
  } else {
    code = '# Logistic on mtcars\nfit <- glm(am ~ wt + hp, data = mtcars, family = binomial)\nsummary(fit)\nexp(coef(fit))\nexp(confint.default(fit))\n';
  }
  const lines = code.split('\n');
  editor.innerHTML = lines.map(line => {
    const cIdx = line.indexOf('#');
    let codePart = line, comment = '';
    if (cIdx >= 0){ codePart = line.slice(0, cIdx); comment = line.slice(cIdx); }
    const strs = [];
    let s = codePart.replace(/"([^"]*)"/g, m => { strs.push(m); return '@@STR' + (strs.length-1) + '@@'; });
    s = s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    s = s.replace(/\b(glm\.nb|glm|summary|coef|exp|confint\.default|confint|anova|AIC|BIC|MASS|library)\b/g, '<span class="fn">$1</span>')
         .replace(/\b(family|data|level|test|formula)(\s*=)/g, '<span class="keyword">$1</span>$2')
         .replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="number">$1</span>');
    s = s.replace(/@@STR(\d+)@@/g, (_, i) => '<span class="string">' + strs[+i].replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</span>');
    return s + (comment ? '<span class="comment">' + comment.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</span>' : '');
  }).join('\n');
}

// ============================================================
// Visualization
// ============================================================
function drawForest(parsed){
  const svg = $('viz-svg'); if (!svg) return;
  const fam = parsed && parsed.family;
  if (!parsed || !parsed.coefficients || parsed.coefficients.length === 0){ svg.innerHTML = ''; $('viz-readout').textContent = 'Paste a summary(glm()) block to render.'; return; }
  // Predictor coefficients only; the intercept's baseline log-odds/log-rate CI is
  // often huge and would compress every slope into an unreadable dot.
  const rows = parsed.coefficients.filter(c => !c.aliased && isFinite(c.estimate) && isFinite(c.se) && !/^\(?Intercept\)?$/i.test(c.name)).map(c => {
    const ci = GLMMath.coefCI(c.estimate, c.se, ciLevel);
    return {name:c.name, est:c.estimate, lo:ci.lo, hi:ci.hi, sig:isFinite(c.p) && c.p < 0.05, p:c.p};
  });
  if (!rows.length){ svg.innerHTML = ''; $('viz-readout').textContent = 'Only an intercept was parsed; no predictor slopes to plot.'; return; }
  let lo = Math.min.apply(null, rows.map(r => r.lo).concat(0)), hi = Math.max.apply(null, rows.map(r => r.hi).concat(0));
  const pad = (hi - lo) * 0.08 || 1; lo -= pad; hi += pad;
  const W = 360, H = 200, padL = 100, padR = 14, padT = 14, padB = 24, n = rows.length;
  const rowH = (H - padT - padB) / Math.max(n, 1);
  const xPx = x => padL + (x - lo) / (hi - lo) * (W - padL - padR);
  let s = '';
  const zx = xPx(0);
  s += '<line class="fp-ref" x1="' + zx.toFixed(1) + '" y1="' + (padT-4) + '" x2="' + zx.toFixed(1) + '" y2="' + (H-padB) + '"/>';
  s += '<text class="fp-reflabel" x="' + zx.toFixed(1) + '" y="' + (H-padB+12) + '" text-anchor="middle">' + (fam && fam.exp ? 'ratio 1 (0 on link)' : 'no effect (0)') + '</text>';
  rows.forEach((r, i) => {
    const cy = padT + rowH * (i + 0.5), x1 = xPx(r.lo), x2 = xPx(r.hi), xd = xPx(clamp(r.est, lo, hi));
    const sc = r.sig ? ' sig' : '';
    s += '<line class="fp-line' + sc + '" x1="' + x1.toFixed(1) + '" y1="' + cy.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + cy.toFixed(1) + '"/>';
    s += '<line class="fp-cap' + sc + '" x1="' + x1.toFixed(1) + '" y1="' + (cy-3).toFixed(1) + '" x2="' + x1.toFixed(1) + '" y2="' + (cy+3).toFixed(1) + '"/>';
    s += '<line class="fp-cap' + sc + '" x1="' + x2.toFixed(1) + '" y1="' + (cy-3).toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + (cy+3).toFixed(1) + '"/>';
    s += '<circle class="fp-dot' + sc + '" cx="' + xd.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="3.2"/>';
    const nm = r.name.length > 14 ? r.name.slice(0, 13) + '…' : r.name;
    s += '<text class="fp-term" x="' + (padL-6) + '" y="' + (cy+3).toFixed(1) + '" text-anchor="end">' + escapeHtml(nm) + '</text>';
  });
  svg.innerHTML = s;
  let strongest = null; rows.forEach(r => { if (!/^\(?Intercept\)?$/i.test(r.name) && isFinite(r.p) && (!strongest || r.p < strongest.p)) strongest = r; });
  if (strongest){
    if (fam && fam.exp){ const scale = fam.scale === 'odds' ? 'OR' : 'RR'; $('viz-readout').innerHTML = 'Strongest: <b>' + escapeHtml(strongest.name) + '</b> ' + scale + ' = <b>' + fmtOR(Math.exp(strongest.est)) + '</b> (' + fmtOR(Math.exp(strongest.lo)) + ', ' + fmtOR(Math.exp(strongest.hi)) + '), p = <b>' + fmtP(strongest.p) + '</b>.'; }
    else $('viz-readout').innerHTML = 'Strongest: <b>' + escapeHtml(strongest.name) + '</b> &beta; = <b>' + fmt(strongest.est,3) + '</b> (' + fmt(strongest.lo,3) + ', ' + fmt(strongest.hi,3) + '), p = <b>' + fmtP(strongest.p) + '</b>.';
  } else $('viz-readout').innerHTML = 'Intercept-only or no predictors to summarize.';
}

function drawCompareBars(models){
  const el = $('viz-compare'); if (!el) return;
  if (!models.length){ el.innerHTML = '<div style="font-size:12px;color:var(--c-text-mute);padding:8px">Paste 2+ summaries to see the comparison chart.</div>'; $('viz-readout').textContent = 'Deviance and AIC render once two models parse.'; return; }
  const devVals = models.map(m => isFinite(m.residDev) ? m.residDev : null);
  const devMax = Math.max.apply(null, devVals.filter(v => v != null).concat(1));
  let h = '<div class="compare-bars-title">Residual deviance (lower = better fit)</div>';
  models.forEach((m, i) => { const v = devVals[i], pct = v == null ? 0 : 100 * v / devMax; h += '<div class="compare-bar-row"><span class="compare-bar-label">' + m.label + '</span><div class="compare-bar-track"><div class="compare-bar-fill" style="width:' + pct.toFixed(1) + '%"></div></div><span class="compare-bar-val">' + (v==null?'-':fmt(v,1)) + '</span></div>'; });
  const aicVals = models.map(m => isFinite(m.aic) ? m.aic : null);
  const aicFin = aicVals.filter(v => v != null);
  h += '<div class="compare-bars-title">AIC (lower = better)</div>';
  if (!aicFin.length){ h += '<div style="font-size:11px;color:var(--c-text-mute);padding:4px">AIC is NA for all models (quasi family).</div>'; }
  else {
    const mn = Math.min.apply(null, aicFin), mx = Math.max.apply(null, aicFin), range = Math.max(mx - mn, 1);
    models.forEach((m, i) => { const v = aicVals[i];
      if (v == null) h += '<div class="compare-bar-row"><span class="compare-bar-label">' + m.label + '</span><div class="compare-bar-track"></div><span class="compare-bar-val">NA</span></div>';
      else { const pct = 100 * (v - mn + range*0.08) / (range * 1.08); h += '<div class="compare-bar-row"><span class="compare-bar-label">' + m.label + '</span><div class="compare-bar-track"><div class="compare-bar-fill aic" style="width:' + pct.toFixed(1) + '%"></div></div><span class="compare-bar-val">' + fmt(v,1) + '</span></div>'; }
    });
  }
  el.innerHTML = h;
  const best = models.filter(m => isFinite(m.aic)).sort((a,b) => a.aic - b.aic)[0];
  $('viz-readout').innerHTML = best ? 'Lowest AIC: <b>' + escapeHtml(best.label) + '</b> (' + fmt(best.aic,2) + ').' : 'Compare residual deviance directly (AIC is NA for quasi families).';
}

// ============================================================
// Toast + copy + boot
// ============================================================
function toast(msg){ const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; $('toast-area').appendChild(t); setTimeout(() => t.remove(), 3200); }
function copyReport(){
  const el = $('report'); if (!el) return;
  if (navigator.clipboard) navigator.clipboard.writeText(el.textContent);
  const b = $('copybtn'); if (b){ b.textContent = 'Copied'; setTimeout(() => { b.textContent = 'Copy'; }, 1400); }
}
document.addEventListener('click', e => {
  const btn = e.target.closest('.webr-copy-btn'); if (!btn) return;
  const editor = btn.closest('.webr-code-block') && btn.closest('.webr-code-block').querySelector('.webr-editor'); if (!editor) return;
  if (navigator.clipboard) navigator.clipboard.writeText(editor.innerText || editor.textContent || '');
  toast('R code copied');
});
let _toolUsed = false;
function markUsed(){ if (_toolUsed) return; _toolUsed = true; }

window.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('rstat_dark') === '1') document.documentElement.classList.add('dark');
  updateMethodMeta(null);
  renderBannerSentence();
  loadScenario('logistic_mtcars');
  const shell = document.querySelector('.shell');
  if (shell){ shell.addEventListener('pointerdown', markUsed, true); shell.addEventListener('input', markUsed, true); }
});

// ============================================================
// Smoke tests (console): window.runSmokeTests()
// ============================================================
window.runSmokeTests = function(){
  const rel = (a, b) => Math.abs(a - b) / Math.max(1e-300, Math.abs(b));
  const P = parseGlmSummary(SCENARIOS.logistic_mtcars.output);
  recomputeCoefs(P, P.family);
  const wt = P.coefficients.find(c => c.name === 'wt');
  const lr = GLMMath.lrTest(P.nullDev, P.nullDf, P.residDev, P.residDf);
  const tests = [
    {d:'mtcars: 3 coefficients', v:P.coefficients.length, e:3},
    {d:'mtcars: family binomial', v:P.family.family === 'binomial' ? 1 : 0, e:1},
    {d:'mtcars wt: z = -2.634', v:wt.stat, e:-2.6341, tol:1e-3},
    {d:'mtcars wt: OR = exp(-8.08348)', v:Math.exp(wt.estimate), e:0.00030860, tol:1e-3},
    {d:'mtcars LR chi-sq = 33.171', v:lr.lr, e:33.171, tol:1e-3},
    {d:'mtcars LR p = 6.27e-8', v:lr.p, e:6.266e-8, tol:1e-3},
    {d:'chisqUpper(210.39,50) = 1.45e-21', v:GLMMath.chisqUpper(210.39,50), e:1.447e-21, tol:1e-2},
    {d:'bicFromAic(16.059,3,32) = 20.456', v:GLMMath.bicFromAic(16.059,3,32), e:20.456, tol:1e-3}
  ];
  console.group('glm-output-interpreter smoke tests');
  let pass = 0;
  tests.forEach(t => { const ok = (t.tol ? rel(t.v, t.e) < t.tol : t.v === t.e); if (ok) pass++; console.log((ok?'PASS':'FAIL') + ' - ' + t.d + ' -> ' + t.v); });
  console.log(pass + ' / ' + tests.length + ' passed');
  console.groupEnd();
};
