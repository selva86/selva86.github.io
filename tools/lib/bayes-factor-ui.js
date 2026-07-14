function $(id){ return document.getElementById(id); }
function fmt(x, d){ d = d == null ? 4 : d; if (!isFinite(x)) return '-'; var s = Number(x).toFixed(d); return s.replace(/\.?0+$/,''); }
function fmtP(p){ if (!isFinite(p)) return '-'; if (p < 1e-4) return p.toExponential(2); return Number(p).toFixed(4); }
function fmtBF(x){
  if (!isFinite(x)) return (x === Infinity ? '&infin;' : '-');
  if (x <= 0) return '-';
  if (x >= 1e6) return x.toExponential(2);
  if (x >= 100) return Number(x).toFixed(0);
  if (x >= 10) return Number(x).toFixed(1);
  if (x >= 1) return Number(x).toFixed(2);
  if (x >= 0.01) return Number(x).toFixed(3);
  return x.toExponential(2);
}
function escapeHtml(s){ return String(s).replace(/[&<>"]/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]; }); }

// ============================================================
// R-verified Bayes-factor math (tools/lib/bayes-factor-math.js).
// Every displayed BF matches BayesFactor 0.9.12-4.8 to <=1e-6.
// ============================================================
var BF = window.BayesFactorMath;

// ============================================================
// Prior presets, per family, matching BayesFactor's named scales exactly.
// The numeric value is passed identically to the JS lib and the emitted R,
// so the shown BF and the R code always agree.
//   opts: [key, label, numericValue]
// ============================================================
var S2 = Math.SQRT2, HS2 = Math.SQRT1_2;              // sqrt(2), 1/sqrt(2)
var PRIOR = {
  twoT:       {word:'Cauchy', axis:'Cauchy scale r', log:true, sweep:[0.1,2],
               opts:[['medium','medium (r=0.71)',HS2],['wide','wide (r=1.0)',1],['ultrawide','ultrawide (r=1.41)',S2]]},
  oneT:       {word:'Cauchy', axis:'Cauchy scale r', log:true, sweep:[0.1,2],
               opts:[['medium','medium (r=0.71)',HS2],['wide','wide (r=1.0)',1],['ultrawide','ultrawide (r=1.41)',S2]]},
  regression: {word:'Zellner-Siow g', axis:'g-prior scale r', log:true, sweep:[0.1,1.5],
               opts:[['medium','medium (r=0.35)',S2/4],['wide','wide (r=0.5)',0.5],['ultrawide','ultrawide (r=0.71)',HS2]]},
  anova:      {word:'Zellner-Siow g', axis:'g-prior scale r', log:true, sweep:[0.1,1.5],
               opts:[['medium','medium (r=0.5)',0.5],['wide','wide (r=0.71)',HS2],['ultrawide','ultrawide (r=1.0)',1]]},
  cor:        {word:'stretched-beta', axis:'beta width kappa', log:true, sweep:[0.08,1.2],
               opts:[['medium.narrow','narrow (k=0.19)',1/Math.sqrt(27)],['medium','medium (k=0.33)',1/3],['wide','wide (k=0.58)',1/Math.sqrt(3)],['ultrawide','ultrawide (k=1.0)',1]]},
  prop:       {word:'Dirichlet', axis:'concentration a', log:false, sweep:[1,6],
               opts:[['a1','uniform (a=1)',1],['a2','concentrated (a=2)',2],['a5','tight (a=5)',5]]}
};

// ============================================================
// Interpretation (Jeffreys / Lee & Wagenmakers) - via the lib.
// ============================================================
function interpretBF(bf){ return BF.interpret(bf); }

// ============================================================
// State
// ============================================================
var state = {
  mode: 'twoT',
  inputMode: 'summary',
  direction: 'bf10',
  priorKey: {twoT:'medium', oneT:'medium', regression:'medium', anova:'medium', cor:'medium', prop:'a1'},
  twoT: {summary:{n1:50,m1:0.5,sd1:1.0,n2:50,m2:0.0,sd2:1.0}, tstat:{t:2.5,n1:50,n2:50}},
  oneT: {summary:{n:20,m:0.6,sd:1.0,mu0:0}, tstat:{t:4.0,n:20}},
  prop: {summary:{x1:100,n1:200,x2:60,n2:200}},
  cor:  {summary:{r:0.4,n:50}},
  anova: {summary:{F:4.85, df1:2, df2:27, N:30}},
  regression: {summary:{F:69.21, df1:2, df2:29, N:32}, r2form:{R2:0.7826, N:32, p:2}}
};
function priorCfg(){ return PRIOR[state.mode]; }
function getPrior(){
  var cfg = priorCfg(), key = state.priorKey[state.mode];
  for (var i=0; i<cfg.opts.length; i++) if (cfg.opts[i][0] === key) return cfg.opts[i][2];
  return cfg.opts[0][2];
}
function priorShort(){
  var cfg = priorCfg(), key = state.priorKey[state.mode];
  for (var i=0; i<cfg.opts.length; i++) if (cfg.opts[i][0] === key) return cfg.opts[i][1].split(' ')[0];
  return cfg.opts[0][1].split(' ')[0];
}

// ============================================================
// Method-column copy per mode
// ============================================================
var METHOD_COPY = {
  twoT: {
    useWhen: 'You compare two independent groups on a continuous outcome and want the evidence for a non-zero mean difference, marginalising over a Cauchy prior on Cohen’s d.',
    example: 'Treatment vs control, n1 = n2 = 50, t = 2.5: BF10 = 3.23 (moderate evidence for a difference).',
    inputs: [['n1, n2', 'sample sizes per group'], ['m1, m2', 'group means'], ['sd1, sd2', 'group SDs'], ['or t', 't-statistic + sample sizes']],
    prior: 'JZS Cauchy on d; medium scale r = 0.707 (BayesFactor default). Wider scales expect larger effects and penalise small ones.'
  },
  oneT: {
    useWhen: 'A single sample, or paired within-subject differences, tested against a null mean. Same JZS construction with effective n = n.',
    example: 'Paired pre/post, n = 20, t = 4.0: BF10 = 46 (very strong evidence for an effect).',
    inputs: [['n', 'sample size'], ['mean', 'sample mean'], ['sd', 'sample SD'], ['mu0', 'null value (default 0)'], ['or t', 't-statistic + n']],
    prior: 'JZS Cauchy on d, medium r = 0.707. For a paired test, feed in the within-pair differences.'
  },
  prop: {
    useWhen: 'Two independent binomial samples: successes x out of trials n in each group. Compares H0 (a shared rate) against H1 (separate rates).',
    example: '100/200 vs 60/200: BF10 = 520 (extreme evidence the rates differ).',
    inputs: [['x1, n1', 'group 1 successes & trials'], ['x2, n2', 'group 2 successes & trials']],
    prior: 'Independent-multinomial contingency BF (Gunel & Dickey 1974) with Dirichlet concentration a; a = 1 is the uniform default of contingencyTableBF().'
  },
  cor: {
    useWhen: 'A Pearson correlation r from n paired observations. Tests H0: rho = 0 against H1: rho on a stretched beta over (-1, 1).',
    example: 'r = 0.4, n = 50: BF10 = 13.3 (strong evidence for a non-zero correlation).',
    inputs: [['r', 'observed correlation'], ['n', 'sample size (pairs)']],
    prior: 'Exact analytic BF (Ly, Verhagen & Wagenmakers 2016). Prior width kappa; medium kappa = 1/3 is the BayesFactor default.'
  },
  anova: {
    useWhen: 'A one-way design with k groups: the omnibus "group means differ" test. Compute the BF from the F-statistic and degrees of freedom.',
    example: 'PlantGrowth, F = 4.85 on (2, 27) df, N = 30: BF10 = 3.35 (moderate evidence at least one mean differs).',
    inputs: [['F', 'F-statistic'], ['df1', 'k - 1 (groups - 1)'], ['df2', 'N - k (residual df)'], ['N', 'total sample size']],
    prior: 'Zellner-Siow g-prior via the R-squared route (linearReg.R2stat); the omnibus model-vs-null BF. On raw data anovaBF() uses a different effect prior, so its number differs by ~10-20%.'
  },
  regression: {
    useWhen: 'A linear regression: the full model tested against the intercept-only null. Feed the omnibus F and df, or R-squared with N and the predictor count.',
    example: 'mtcars mpg ~ wt + hp, F = 69.2 on (2, 29) df: BF10 in the tens of millions (decisive).',
    inputs: [['F', 'overall F-statistic'], ['df1', 'p (number of predictors)'], ['df2', 'N - p - 1'], ['N', 'total sample size']],
    prior: 'Zellner-Siow g-prior on the coefficients; R-squared is sufficient, so linearReg.R2stat reproduces regressionBF exactly. Medium r = sqrt(2)/4 is the BayesFactor default.'
  }
};

// ============================================================
// Scenarios
// ============================================================
var SCENARIOS = {
  moderate: {mode:'twoT', inputMode:'summary', icon:'&#129518;', title:'Two-sample t with moderate evidence',
    story:'Treatment vs control on a continuous outcome. n1 = n2 = 50, mean difference 0.5 SDs. The t is about 2.5; the BF lands just into the moderate band.',
    set:function(){ state.twoT.summary={n1:50,m1:0.5,sd1:1.0,n2:50,m2:0.0,sd2:1.0}; }},
  extreme: {mode:'twoT', inputMode:'tstat', icon:'&#128293;', title:'Two-sample t with extreme evidence',
    story:'Big effect, big n. With t = 6 on 198 df, the data are over a million times more likely under H1 than H0.',
    set:function(){ state.twoT.tstat={t:6.0,n1:100,n2:100}; }},
  null: {mode:'twoT', inputMode:'tstat', icon:'&#10060;', title:'Two-sample t close to zero',
    story:'When |t| is small relative to n, the BF leans the other way: a small t with large df gives positive evidence for H0, not just an absence of evidence for H1.',
    set:function(){ state.twoT.tstat={t:0.5,n1:50,n2:50}; }},
  paired: {mode:'oneT', inputMode:'summary', icon:'&#128203;', title:'Paired pre/post test',
    story:'Twenty people measured before and after an intervention. Mean within-pair change 0.6 SDs, t about 2.7. Moderate evidence for an effect.',
    set:function(){ state.oneT.summary={n:20,m:0.6,sd:1.0,mu0:0}; }},
  prop: {mode:'prop', inputMode:'summary', icon:'&#128202;', title:'Two proportions (rates differ)',
    story:'Conversion rates of 50% vs 30% on n = 200 each. BF10 is in the hundreds: the data are far more likely under separate rates than a common rate.',
    set:function(){ state.prop.summary={x1:100,n1:200,x2:60,n2:200}; }},
  cor: {mode:'cor', inputMode:'summary', icon:'&#128279;', title:'Correlation r = 0.4, n = 50',
    story:'A medium correlation in a moderate sample. Strong evidence for a non-zero correlation, but the prior matters: try the sensitivity curve.',
    set:function(){ state.cor.summary={r:0.4,n:50}; }},
  anova: {mode:'anova', inputMode:'summary', icon:'&#127793;', title:'One-way ANOVA on PlantGrowth',
    story:'PlantGrowth has 30 observations across three treatment groups. The omnibus F is 4.85 on (2, 27) df, p about 0.016. The Bayes factor is 3.35: moderate evidence that at least one group mean differs.',
    set:function(){ state.anova.summary={F:4.85, df1:2, df2:27, N:30}; }},
  regression: {mode:'regression', inputMode:'summary', icon:'&#128663;', title:'Regression: mtcars mpg ~ wt + hp',
    story:'A two-predictor model on mtcars: F = 69.21 on (2, 29) df, R-squared above 0.82. The Bayes factor is in the tens of millions: decisive evidence the model beats the intercept-only null.',
    set:function(){ state.regression.summary={F:69.21, df1:2, df2:29, N:32}; }}
};

// ============================================================
// UI: inputs
// ============================================================
function renderInputs(){
  var host = $('mode-inputs');
  var html = '';
  if (state.mode === 'twoT'){
    if (state.inputMode === 'summary'){
      var s = state.twoT.summary;
      html += inputRow('Group 1', [['n1','n1', s.n1, 1], ['m1','mean', s.m1, 0.01], ['sd1','sd', s.sd1, 0.01]]);
      html += inputRow('Group 2', [['n2','n2', s.n2, 1], ['m2','mean', s.m2, 0.01], ['sd2','sd', s.sd2, 0.01]]);
    } else {
      var t = state.twoT.tstat;
      html += inputRow('t-statistic', [['t','t', t.t, 0.01]]);
      html += inputRow('Sample sizes', [['n1','n1', t.n1, 1], ['n2','n2', t.n2, 1]]);
    }
  } else if (state.mode === 'oneT'){
    if (state.inputMode === 'summary'){
      var s = state.oneT.summary;
      html += inputRow('Sample', [['n','n', s.n, 1], ['m','mean', s.m, 0.01], ['sd','sd', s.sd, 0.01]]);
      html += inputRow('Null', [['mu0','mu0', s.mu0, 0.01]]);
    } else {
      var t = state.oneT.tstat;
      html += inputRow('t-statistic', [['t','t', t.t, 0.01], ['n','n', t.n, 1]]);
    }
  } else if (state.mode === 'prop'){
    var s = state.prop.summary;
    html += inputRow('Group 1', [['x1','x1 (successes)', s.x1, 1], ['n1','n1 (trials)', s.n1, 1]]);
    html += inputRow('Group 2', [['x2','x2 (successes)', s.x2, 1], ['n2','n2 (trials)', s.n2, 1]]);
  } else if (state.mode === 'cor'){
    var s = state.cor.summary;
    html += inputRow('Correlation', [['r','r', s.r, 0.001], ['n','n', s.n, 1]]);
  } else if (state.mode === 'anova'){
    var s = state.anova.summary;
    html += inputRow('Test', [['F','F', s.F, 0.01]]);
    html += inputRow('Degrees of freedom', [['df1','df1 (k-1)', s.df1, 1], ['df2','df2 (N-k)', s.df2, 1]]);
    html += inputRow('Sample', [['N','N total', s.N, 1]]);
  } else if (state.mode === 'regression'){
    if (state.inputMode === 'r2form'){
      var s = state.regression.r2form;
      html += inputRow('Model fit', [['R2','R-squared', s.R2, 0.001]]);
      html += inputRow('Sample', [['N','N', s.N, 1], ['p','p (predictors)', s.p, 1]]);
    } else {
      var s = state.regression.summary;
      html += inputRow('Test', [['F','F', s.F, 0.01]]);
      html += inputRow('Degrees of freedom', [['df1','df1 (p)', s.df1, 1], ['df2','df2 (N-p-1)', s.df2, 1]]);
      html += inputRow('Sample', [['N','N total', s.N, 1]]);
    }
  }
  host.innerHTML = html;
  host.querySelectorAll('input[data-key]').forEach(function(el){
    el.addEventListener('input', function(){
      var key = el.getAttribute('data-key');
      var val = parseFloat(el.value);
      if (!isFinite(val)) return;
      var s;
      if (state.mode === 'twoT'){ s = state.inputMode === 'summary' ? state.twoT.summary : state.twoT.tstat; }
      else if (state.mode === 'oneT'){ s = state.inputMode === 'summary' ? state.oneT.summary : state.oneT.tstat; }
      else if (state.mode === 'prop'){ s = state.prop.summary; }
      else if (state.mode === 'cor'){ s = state.cor.summary; }
      else if (state.mode === 'anova'){ s = state.anova.summary; }
      else if (state.mode === 'regression'){ s = state.inputMode === 'r2form' ? state.regression.r2form : state.regression.summary; }
      s[key] = val;
      compute();
    });
  });
}
function inputRow(label, fields){
  var inner = '';
  for (var i=0; i<fields.length; i++){
    var f = fields[i];
    var key = f[0], lbl = f[1], val = f[2], step = f[3] || 0.01;
    inner += '<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px"><small style="font-size:10.5px;color:var(--c-text-mute);font-weight:600;text-transform:uppercase;letter-spacing:0.04em">' + escapeHtml(lbl) + '</small><input type="number" step="' + step + '" value="' + val + '" data-key="' + key + '"></div>';
  }
  return '<div class="form-row"><label>' + escapeHtml(label) + '</label><div class="form-control" style="display:flex;gap:8px">' + inner + '</div></div>';
}

// ============================================================
// UI: modes, tabs, prior
// ============================================================
function setMode(m){
  state.mode = m;
  if (m === 'prop' || m === 'cor' || m === 'anova') state.inputMode = 'summary';
  if (m === 'regression' && state.inputMode !== 'r2form' && state.inputMode !== 'summary') state.inputMode = 'summary';
  $('mode-select').value = m;
  $('mode-pill').firstChild.textContent = pillLabelMode(m) + ' ';
  renderTabs();
  renderMethod();
  renderPrior();
  renderInputs();
  compute();
}
function pillLabelMode(m){
  return ({twoT:'two-sample t', oneT:'one-sample t', prop:'two-proportion', cor:'correlation', anova:'one-way ANOVA', regression:'linear regression'})[m];
}
function setInputMode(im){
  if ((state.mode === 'prop' || state.mode === 'cor' || state.mode === 'anova') && im !== 'summary') return;
  if (state.mode === 'regression' && im !== 'summary' && im !== 'r2form') return;
  state.inputMode = im;
  document.querySelectorAll('.submode-tab').forEach(function(b){ b.classList.toggle('active', b.getAttribute('data-input-mode') === im); });
  renderInputs();
  compute();
}
function renderTabs(){
  var tabs = $('input-mode-tabs');
  if (state.mode === 'prop' || state.mode === 'cor' || state.mode === 'anova'){
    tabs.style.display = 'none';
  } else if (state.mode === 'regression'){
    tabs.style.display = '';
    tabs.innerHTML = '<button class="submode-tab" data-input-mode="summary" onclick="setInputMode(\'summary\')">F-statistic</button>'
                   + '<button class="submode-tab" data-input-mode="r2form" onclick="setInputMode(\'r2form\')">R-squared</button>';
    document.querySelectorAll('.submode-tab').forEach(function(b){ b.classList.toggle('active', b.getAttribute('data-input-mode') === state.inputMode); });
  } else {
    tabs.style.display = '';
    if (!tabs.querySelector('[data-input-mode="tstat"]')){
      tabs.innerHTML = '<button class="submode-tab" data-input-mode="summary" onclick="setInputMode(\'summary\')">Summary stats</button>'
                     + '<button class="submode-tab" data-input-mode="tstat" onclick="setInputMode(\'tstat\')">Test statistic</button>';
    }
    document.querySelectorAll('.submode-tab').forEach(function(b){ b.classList.toggle('active', b.getAttribute('data-input-mode') === state.inputMode); });
  }
}
function renderMethod(){
  var m = METHOD_COPY[state.mode];
  $('method-use-when').textContent = m.useWhen;
  $('method-example').textContent = m.example;
  var ul = $('method-inputs-needed');
  ul.innerHTML = m.inputs.map(function(p){ return '<li><code>' + p[0] + '</code><span>' + p[1] + '</span></li>'; }).join('');
  $('method-prior').textContent = m.prior;
}
function renderPrior(){
  var cfg = priorCfg(), key = state.priorKey[state.mode], sel = $('rscale-select');
  var opts = '';
  for (var i=0; i<cfg.opts.length; i++){
    var o = cfg.opts[i];
    opts += '<option value="' + o[0] + '"' + (o[0] === key ? ' selected' : '') + '>' + o[1] + '</option>';
  }
  sel.innerHTML = opts;
  $('prior-word').textContent = cfg.word;
  $('rscale-pill').firstChild.textContent = priorShort() + ' ';
}

// ============================================================
// Inputs -> canonical quantities
// ============================================================
function getInputs(){
  var inp = {};
  if (state.mode === 'twoT'){
    if (state.inputMode === 'summary'){
      var s = state.twoT.summary;
      var n1 = s.n1, n2 = s.n2;
      var sp2 = ((n1-1)*s.sd1*s.sd1 + (n2-1)*s.sd2*s.sd2) / (n1+n2-2);
      var se = Math.sqrt(sp2 * (1/n1 + 1/n2));
      var t = (s.m1 - s.m2) / se;
      inp = {t:t, neff:(n1*n2)/(n1+n2), nu:n1+n2-2, n1:n1, n2:n2};
    } else {
      var s = state.twoT.tstat;
      inp = {t:s.t, neff:(s.n1*s.n2)/(s.n1+s.n2), nu:s.n1+s.n2-2, n1:s.n1, n2:s.n2};
    }
  } else if (state.mode === 'oneT'){
    if (state.inputMode === 'summary'){
      var s = state.oneT.summary;
      var t = (s.m - s.mu0) / (s.sd / Math.sqrt(s.n));
      inp = {t:t, neff:s.n, nu:s.n-1, n:s.n};
    } else {
      var s = state.oneT.tstat;
      inp = {t:s.t, neff:s.n, nu:s.n-1, n:s.n};
    }
  } else if (state.mode === 'prop'){
    var s = state.prop.summary;
    inp = {x1:s.x1, n1:s.n1, x2:s.x2, n2:s.n2};
  } else if (state.mode === 'cor'){
    var s = state.cor.summary;
    inp = {r:s.r, n:s.n};
  } else if (state.mode === 'anova'){
    var s = state.anova.summary;
    inp = {F:s.F, df1:s.df1, df2:s.df2, N:s.N, p:s.df1, R2:(s.F*s.df1)/(s.F*s.df1+s.df2)};
  } else if (state.mode === 'regression'){
    if (state.inputMode === 'r2form'){
      var s = state.regression.r2form;
      var Fimp = (s.R2 / s.p) / ((1 - s.R2) / (s.N - s.p - 1));
      inp = {F:Fimp, df1:s.p, df2:s.N - s.p - 1, N:s.N, p:s.p, R2:s.R2};
    } else {
      var s = state.regression.summary;
      inp = {F:s.F, df1:s.df1, df2:s.df2, N:s.N, p:s.df1, R2:(s.F*s.df1)/(s.F*s.df1+s.df2)};
    }
  }
  return inp;
}
function bfAtPrior(pv, inp){
  if (state.mode === 'twoT' || state.mode === 'oneT') return BF.bfT(inp.t, inp.neff, inp.nu, pv);
  if (state.mode === 'prop') return BF.bfProp(inp.x1, inp.n1, inp.x2, inp.n2, pv);
  if (state.mode === 'cor') return BF.bfCor(inp.n, inp.r, pv);
  if (state.mode === 'anova' || state.mode === 'regression') return BF.bfLM(inp.N, inp.p, inp.R2, pv);
  return NaN;
}
function computeBF(){
  var inp = getInputs();
  var bf = bfAtPrior(getPrior(), inp);
  if (!(bf > 0)) bf = (bf === Infinity ? Infinity : 1e-300);
  return {bf:bf, inputs:inp};
}
// Domain checks with plain-English messages. Returns an error string, or ''.
function validateInputs(inp){
  var m = state.mode;
  if (m === 'twoT' || m === 'oneT'){
    if (state.inputMode === 'summary'){
      var sd = m === 'twoT' ? Math.min(state.twoT.summary.sd1, state.twoT.summary.sd2) : state.oneT.summary.sd;
      if (!(sd > 0)) return 'Standard deviations must be greater than 0.';
    }
    if (!(inp.nu >= 1)) return 'Need at least 2 observations per group.';
    if (!isFinite(inp.t)) return 'Enter finite means and SDs (the t-statistic is undefined).';
  } else if (m === 'prop'){
    if (!(inp.n1 >= 1) || !(inp.n2 >= 1)) return 'Each group needs at least 1 trial.';
    if (inp.x1 < 0 || inp.x2 < 0) return 'Successes cannot be negative.';
    if (inp.x1 > inp.n1 || inp.x2 > inp.n2) return 'Successes cannot exceed the number of trials.';
  } else if (m === 'cor'){
    if (!(inp.n > 3)) return 'Correlation Bayes factor needs n greater than 3.';
    if (Math.abs(inp.r) >= 1) return 'Correlation r must be strictly between -1 and 1.';
  } else if (m === 'anova'){
    if (!(inp.F >= 0)) return 'F must be 0 or greater.';
    if (!(inp.df1 >= 1) || !(inp.df2 >= 1)) return 'Degrees of freedom must be at least 1.';
    if (!(inp.N > inp.df1 + 1)) return 'Total N must exceed the number of groups.';
  } else if (m === 'regression'){
    if (state.inputMode === 'r2form'){
      if (!(inp.R2 >= 0) || !(inp.R2 < 1)) return 'R-squared must be at least 0 and below 1.';
      if (!(inp.p >= 1)) return 'Need at least 1 predictor.';
    } else {
      if (!(inp.F >= 0)) return 'F must be 0 or greater.';
      if (!(inp.df1 >= 1) || !(inp.df2 >= 1)) return 'Degrees of freedom must be at least 1.';
    }
    if (!(inp.N > inp.p + 1)) return 'N must be greater than the number of predictors plus 1.';
  }
  return '';
}
function pValue(inp){
  if (state.mode === 'twoT' || state.mode === 'oneT') return BF.ptTwoSided(inp.t, inp.nu);
  if (state.mode === 'prop'){
    var p1 = inp.x1/inp.n1, p2 = inp.x2/inp.n2, pp = (inp.x1+inp.x2)/(inp.n1+inp.n2);
    var den = pp*(1-pp)*(1/inp.n1 + 1/inp.n2);
    if (!(den > 0)) return NaN;
    var z = (p1 - p2) / Math.sqrt(den);
    return 2*(1 - BF.pnorm(Math.abs(z)));
  }
  if (state.mode === 'cor'){
    var t = inp.r * Math.sqrt(inp.n - 2) / Math.sqrt(Math.max(1e-12, 1 - inp.r*inp.r));
    return BF.ptTwoSided(t, inp.n - 2);
  }
  if (state.mode === 'anova' || state.mode === 'regression') return BF.pfUpper(inp.F, inp.df1, inp.df2);
  return NaN;
}

// ============================================================
// Compute + render
// ============================================================
function compute(){
  markUsed();
  var inp0 = getInputs();
  var err = validateInputs(inp0);
  if (err){
    $('result-label').textContent = state.direction === 'bf10' ? 'BF₁₀ (alt vs null)' : 'BF₀₁ (null vs alt)';
    $('result-bounds').innerHTML = '<span>&mdash;</span>';
    $('result-aux').innerHTML = '<b class="err-note">' + escapeHtml(err) + '</b>';
    $('recap-mini-rows').innerHTML = recapRow('status', 'check your inputs');
    var vs = $('viz-svg'); if (vs) vs.innerHTML = '';
    if ($('viz-readout')) $('viz-readout').textContent = err;
    var ib = $('inference-banner'); if (ib) ib.innerHTML = escapeHtml(err) + ' Fix the highlighted value to get a Bayes factor.';
    return;
  }
  var res = computeBF();
  var bf10 = res.bf, inp = res.inputs;
  var shown = state.direction === 'bf10' ? bf10 : 1/bf10;
  var label = state.direction === 'bf10' ? 'BF₁₀ (alt vs null)' : 'BF₀₁ (null vs alt)';
  var interp = interpretBF(bf10);
  $('result-label').textContent = label;
  $('result-bounds').innerHTML = '<span>' + fmtBF(shown) + '</span>';
  $('result-aux').innerHTML = '<b>' + interp.label + '</b>';
  var pH1 = bf10 === Infinity ? 1 : bf10 / (1 + bf10);
  var pVal = pValue(inp);
  var rows = '';
  rows += recapRow('prior', priorShort() + ' (' + fmt(getPrior(), 3) + ')');
  rows += recapRow('BF10', fmtBF(bf10));
  rows += recapRow('BF01', fmtBF(1/bf10));
  rows += recapRow('P(H1)', (pH1*100).toFixed(2) + '%');
  rows += recapRow('p-value', fmtP(pVal));
  rows += recapRow('verdict', interp.label);
  $('recap-mini-rows').innerHTML = rows;
  buildRCode(inp);
  drawSensitivity();
  $('direction-pill').firstChild.textContent = (state.direction === 'bf10' ? 'BF₁₀' : 'BF₀₁') + ' ';
  renderInferenceBanner(bf10, pH1, pVal, interp);
}
function modeLabel(){
  return ({twoT:'two-sample t', oneT:'one-sample t', prop:'two-proportion', cor:'correlation', anova:'one-way ANOVA', regression:'linear regression'})[state.mode];
}
function recapRow(k, v){
  return '<div class="recap-mini-row"><span class="key">' + escapeHtml(k) + '</span><span class="val">' + escapeHtml(v) + '</span></div>';
}
function renderInferenceBanner(bf10, pH1, pVal, interp){
  var el = $('inference-banner'); if (!el) return;
  if (!(bf10 > 0)){
    el.innerHTML = 'These inputs do not yet imply a valid Bayes factor. Adjust the values to get a finite, positive BF.';
    return;
  }
  var ml = modeLabel();
  var shown = state.direction === 'bf10' ? bf10 : 1/bf10;
  var dirLabel = state.direction === 'bf10' ? 'BF<sub>10</sub>' : 'BF<sub>01</sub>';
  var intensity = (interp.label || '').replace(/ evidence for H[01]$/i, '').replace(/ evidence either way$/i, '');
  var towards = interp.side === 'h1' ? '<b>H<sub>1</sub></b>' : (interp.side === 'h0' ? '<b>H<sub>0</sub></b>' : 'either side');
  var ratio = bf10 >= 1 ? bf10 : (1/bf10);
  var ratioWord = bf10 >= 1 ? 'H<sub>1</sub>' : 'H<sub>0</sub>';
  var ratioOther = bf10 >= 1 ? 'H<sub>0</sub>' : 'H<sub>1</sub>';
  var post = (pH1 * 100).toFixed(1);
  var pStr = (!isFinite(pVal)) ? '-' : (pVal < 0.0001 ? '&lt;0.0001' : Number(pVal).toFixed(4));
  var verdictCls = interp.side === 'h1' ? 'sig' : 'insig';
  el.innerHTML = 'Your <em>' + escapeHtml(ml) + '</em> gives ' + dirLabel + ' = <b>' + fmtBF(shown) + '</b>. ' +
    'The data are about <b>' + fmtBF(ratio) + '</b> times more likely under ' + ratioWord + ' than ' + ratioOther + '. ' +
    'On the Jeffreys and Lee-Wagenmakers scale this is <span class="' + verdictCls + '">' + escapeHtml(intensity.trim() || 'no') + '</span> evidence for ' + towards + '. ' +
    'The posterior probability of H<sub>1</sub> is <b>' + post + '%</b> under a 50/50 prior. ' +
    'The frequentist p-value is <b>' + pStr + '</b>, which answers a different question: how surprising the data would be if H<sub>0</sub> were true, not which model the data favour.';
}

// ============================================================
// R code generation
// ============================================================
function setRCode(code){
  var ed = $('r-code-rebuild'); if (!ed) return;
  ed.textContent = code;
  if (window.highlightWebREditors) window.highlightWebREditors();
}
function buildRCode(inp){
  var key = state.priorKey[state.mode];
  var lines = ['library(BayesFactor)', ''];
  if (state.mode === 'twoT'){
    lines.push('# Two-sample t Bayes factor (JZS Cauchy prior on Cohen’s d)');
    lines.push('ttest.tstat(t = ' + fmt(inp.t, 4) + ', n1 = ' + inp.n1 + ', n2 = ' + inp.n2 + ',');
    lines.push('            rscale = "' + key + '", simple = TRUE)');
    lines.push('');
    lines.push('# With raw data: ttestBF(x = group1, y = group2, rscale = "' + key + '")');
  } else if (state.mode === 'oneT'){
    lines.push('# One-sample / paired t Bayes factor (JZS Cauchy prior)');
    lines.push('ttest.tstat(t = ' + fmt(inp.t, 4) + ', n1 = ' + inp.n + ',');
    lines.push('            rscale = "' + key + '", simple = TRUE)');
    lines.push('');
    lines.push('# With raw data: ttestBF(x = differences, mu = 0, rscale = "' + key + '")');
  } else if (state.mode === 'prop'){
    var a = getPrior();
    lines.push('# Two-proportion Bayes factor (independent-multinomial contingency table)');
    lines.push('tab <- matrix(c(' + inp.x1 + ', ' + (inp.n1-inp.x1) + ', ' + inp.x2 + ', ' + (inp.n2-inp.x2) + '),');
    lines.push('              nrow = 2, byrow = TRUE,');
    lines.push('              dimnames = list(group = c("A","B"), outcome = c("yes","no")))');
    lines.push('contingencyTableBF(tab, sampleType = "indepMulti", fixedMargin = "rows",');
    lines.push('                   priorConcentration = ' + fmt(a, 3) + ')');
  } else if (state.mode === 'cor'){
    lines.push('# Correlation Bayes factor (Ly et al. 2016 exact BF; kappa = "' + key + '")');
    lines.push('# BayesFactor needs the raw x, y vectors with cor(x, y) = ' + fmt(inp.r, 4) + ':');
    lines.push('correlationBF(x = x, y = y, rscale = "' + key + '")');
    lines.push('# The value shown is the exact analytic BF for r = ' + fmt(inp.r, 3) + ', n = ' + inp.n + '.');
  } else if (state.mode === 'anova'){
    lines.push('# One-way ANOVA: omnibus "group means vs null" BF from the F test,');
    lines.push('# via the Zellner-Siow g-prior (R-squared route).');
    lines.push('Fv <- ' + fmt(inp.F, 4) + '; df1 <- ' + inp.df1 + '; df2 <- ' + inp.df2 + '; N <- ' + inp.N);
    lines.push('R2 <- (Fv * df1) / (Fv * df1 + df2)');
    lines.push('linearReg.R2stat(N = N, p = df1, R2 = R2, rscale = ' + fmt(getPrior(), 4) + ', simple = TRUE)');
    lines.push('# Reproduces the value shown above exactly.');
    lines.push('');
    lines.push('# On raw data, anovaBF() uses a different effect prior (values differ ~10-20%):');
    lines.push('# anovaBF(y ~ group, data = d, rscaleFixed = "' + key + '")');
  } else if (state.mode === 'regression'){
    if (state.inputMode === 'r2form'){
      var s = state.regression.r2form;
      lines.push('# Linear regression Bayes factor from R-squared, N, and predictor count p');
      lines.push('linearReg.R2stat(N = ' + s.N + ', p = ' + s.p + ', R2 = ' + fmt(s.R2, 4) + ',');
      lines.push('                 rscale = "' + key + '", simple = TRUE)');
      lines.push('');
      lines.push('# With raw data: regressionBF(y ~ x1 + x2, data = d, rscaleCont = "' + key + '")');
    } else {
      lines.push('# Linear regression Bayes factor: full model vs intercept-only null');
      lines.push('Fv <- ' + fmt(inp.F, 4) + '; df1 <- ' + inp.df1 + '; df2 <- ' + inp.df2 + '; N <- ' + inp.N);
      lines.push('R2 <- (Fv * df1) / (Fv * df1 + df2)');
      lines.push('linearReg.R2stat(N = N, p = df1, R2 = R2, rscale = "' + key + '", simple = TRUE)');
      lines.push('');
      lines.push('# With raw data: regressionBF(y ~ x1 + x2, data = d, rscaleCont = "' + key + '")');
    }
  }
  setRCode(lines.join('\n'));
}

// ============================================================
// Sensitivity plot: BF vs prior scale
// ============================================================
function drawSensitivity(){
  var svg = $('viz-svg');
  if (!svg) return;
  var W = 360, H = 200, pl = 40, pr = 14, pt_ = 14, pb = 30;
  var cfg = priorCfg(), inp = getInputs();
  var lo = cfg.sweep[0], hi = cfg.sweep[1], useLog = cfg.log;
  var pvs = [], N = 40;
  for (var i=0; i<=N; i++){
    var frac = i / N;
    pvs.push(useLog ? lo * Math.pow(hi/lo, frac) : lo + (hi-lo)*frac);
  }
  var bfs = pvs.map(function(pv){ return bfAtPrior(pv, inp); });
  var logBfs = bfs.map(function(b){ return isFinite(b) && b > 0 ? Math.log10(Math.max(1e-50, Math.min(1e50, b))) : NaN; });
  var finite = logBfs.filter(function(v){ return isFinite(v); });
  if (!finite.length){ svg.innerHTML = ''; if ($('viz-readout')) $('viz-readout').textContent = 'No valid Bayes factor to plot for these inputs.'; return; }
  var minY = Math.min.apply(null, finite), maxY = Math.max.apply(null, finite);
  if (maxY - minY < 1){ var c = (maxY+minY)/2; minY = c - 0.5; maxY = c + 0.5; }
  var pad = (maxY - minY) * 0.1; minY -= pad; maxY += pad;
  function tx(pv){
    var f = useLog ? (Math.log(pv) - Math.log(lo)) / (Math.log(hi) - Math.log(lo)) : (pv - lo) / (hi - lo);
    return pl + f * (W - pl - pr);
  }
  function sy(ly){ return pt_ + (1 - (ly - minY) / (maxY - minY)) * (H - pt_ - pb); }
  var path = '', started = false;
  for (var i=0; i<pvs.length; i++){
    if (!isFinite(logBfs[i])) { started = false; continue; }
    path += (started ? 'L' : 'M') + tx(pvs[i]).toFixed(1) + ',' + sy(logBfs[i]).toFixed(1);
    started = true;
  }
  var refs = [-2, -1, 0, 1, 2];
  var refLabels = {'-2':'1/100','-1':'1/10','0':'1','1':'10','2':'100'};
  var refPaths = '';
  for (var i=0; i<refs.length; i++){
    var ly = refs[i];
    if (ly < minY || ly > maxY) continue;
    var y = sy(ly);
    var stroke = (ly === 0) ? '#8b6500' : '#d8dce2';
    var dash = (ly === 0) ? '4 3' : '2 4';
    refPaths += '<line x1="' + pl + '" x2="' + (W-pr) + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '" stroke="' + stroke + '" stroke-width="1" stroke-dasharray="' + dash + '"/>';
    refPaths += '<text class="tick-label" x="' + (pl-4) + '" y="' + (y+3).toFixed(1) + '" text-anchor="end">' + refLabels[String(ly)] + '</text>';
  }
  var xticks = useLog ? [lo, 0.25, 0.5, 0.707, 1, hi] : [1, 2, 3, 4, 5, 6];
  var xlabels = '';
  for (var i=0; i<xticks.length; i++){
    if (xticks[i] < lo - 1e-9 || xticks[i] > hi + 1e-9) continue;
    var x = tx(xticks[i]);
    xlabels += '<line x1="' + x.toFixed(1) + '" x2="' + x.toFixed(1) + '" y1="' + (H-pb) + '" y2="' + (H-pb+3) + '" stroke="#d8dce2"/>';
    xlabels += '<text class="tick-label" x="' + x.toFixed(1) + '" y="' + (H-pb+12) + '" text-anchor="middle">' + (useLog ? fmt(xticks[i],3) : xticks[i]) + '</text>';
  }
  var cur = getPrior();
  var curBf = bfAtPrior(cur, inp);
  var marker = '';
  if (isFinite(curBf) && curBf > 0){
    var curX = tx(cur), curY = sy(Math.log10(Math.max(1e-50, Math.min(1e50, curBf))));
    marker = '<circle class="estimate-dot" cx="' + curX.toFixed(1) + '" cy="' + curY.toFixed(1) + '" r="4"/>' +
             '<text class="estimate-label" x="' + (curX - 8).toFixed(1) + '" y="' + (curY-8).toFixed(1) + '" text-anchor="end">' + priorShort() + '</text>';
  }
  svg.setAttribute('aria-label', 'Bayes factor as the ' + cfg.axis + ' varies; current setting marked.');
  svg.innerHTML = ''
    + refPaths
    + '<line class="ax" x1="' + pl + '" y1="' + pt_ + '" x2="' + pl + '" y2="' + (H-pb) + '"/>'
    + '<line class="ax" x1="' + pl + '" y1="' + (H-pb) + '" x2="' + (W-pr) + '" y2="' + (H-pb) + '"/>'
    + '<text class="ax-label" x="' + (pl-30) + '" y="' + (pt_+8) + '">BF₁₀</text>'
    + '<text class="ax-label" x="' + ((pl+W-pr)/2) + '" y="' + (H-6) + '" text-anchor="middle">' + cfg.axis + '</text>'
    + xlabels
    + '<path class="density" d="' + path + '" fill="none"/>'
    + marker;
  $('viz-caption').textContent = 'Bayes factor vs ' + cfg.axis + ' (log-y)';
  $('viz-readout').innerHTML = 'At <b>' + priorShort() + '</b> (' + fmt(cur,3) + '), BF₁₀ = <b>' + fmtBF(curBf) + '</b>. The curve sweeps the prior from ' + fmt(lo,2) + ' to ' + fmt(hi,2) + '.';
}

// ============================================================
// Scenarios
// ============================================================
function loadScenario(key){
  var sc = SCENARIOS[key];
  if (!sc) return;
  document.querySelectorAll('.scenario-card').forEach(function(b){ b.classList.toggle('active', b.getAttribute('data-scenario') === key); });
  sc.set();
  state.mode = sc.mode;
  state.inputMode = sc.inputMode;
  $('mode-select').value = sc.mode;
  setMode(sc.mode);
  setInputMode(sc.inputMode);
  $('sc-icon').innerHTML = sc.icon;
  $('sc-title').textContent = sc.title;
  $('sc-story').textContent = sc.story;
  $('scenario-context').classList.add('show');
}
function clearScenario(){
  $('scenario-context').classList.remove('show');
  document.querySelectorAll('.scenario-card').forEach(function(b){ b.classList.remove('active'); });
}
