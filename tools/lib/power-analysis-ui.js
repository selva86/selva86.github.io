/* power-analysis-ui.js - UI logic for tools/power-analysis.html (Lab-sheet v2).
   Math lives in tools/lib/power-math.js (R-verified vs the pwr package).
   Externalised from the page body to keep rendered outerHTML lean; GA events
   are routed through window.__gaUse / window.__gaCopy defined inline on the page. */
'use strict';
function $(id){ return document.getElementById(id); }
function fmt(x, d){ d = (d===undefined)?4:d; if (!isFinite(x)) return x>0?'∞':'-'; return Number(x).toFixed(d).replace(/\.?0+$/,''); }
function fmtViz(x, d){ d = (d===undefined)?3:d; if (!isFinite(x)) return '-'; return Number(x).toFixed(d).replace(/(\.\d*?)0+$/,'$1').replace(/\.$/,''); }
function fmtN(n){ if (!isFinite(n)) return '∞'; return Number(Math.round(n)).toLocaleString('en-US'); }
function escapeHtml(s){ return String(s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }

var PM = window.PowerMath;
var cohenH = PM.cohenH;
var powerFn = PM.power;
var solveEffect = PM.solveEffect;
var solveAlpha = PM.solveAlpha;
var __lastExactN = Infinity;
function solveN(design, params, target){
  var nf = PM.solveN(design, params, target);
  __lastExactN = nf;
  return isFinite(nf) ? Math.ceil(nf - 1e-9) : Infinity;
}

var DESIGNS = [
  {key:'oneT',        name:'one-sample t-test',     short:'one-sample t',      effectSym:'d', effectLabel:"Cohen's d"},
  {key:'twoT',        name:'two-sample t-test',     short:'two-sample t',      effectSym:'d', effectLabel:"Cohen's d"},
  {key:'paired',      name:'paired t-test',         short:'paired t',          effectSym:'d', effectLabel:"Cohen's d"},
  {key:'oneProp',     name:'one-proportion test',   short:'one-proportion',    effectSym:'h', effectLabel:"Cohen's h"},
  {key:'twoProp',     name:'two-proportion test',   short:'two-proportion',    effectSym:'h', effectLabel:"Cohen's h"},
  {key:'anova',       name:'one-way ANOVA',         short:'one-way ANOVA',     effectSym:'f', effectLabel:"Cohen's f"},
  {key:'correlation', name:'correlation (Pearson)', short:'correlation',       effectSym:'r', effectLabel:"Pearson's r"},
  {key:'chisq',       name:'chi-square goodness-of-fit', short:'chi-square',   effectSym:'w', effectLabel:"Cohen's w"}
];

var SOLVE_LABELS = { n:'sample size', power:'power', effect:'effect size', alpha:'alpha' };

var METHOD_META = {
  oneT: {
    useWhen: 'A single mean against a known reference (or a single-arm before/after change). The test stat is t = (mean - mu0) / (SD/sqrt(n)).',
    example: "e.g. test whether the average resting heart rate of a sample differs from 70 bpm; effect size is Cohen's d on (mean - mu0) / SD.",
    inputs: [{code:'d',desc:"Cohen's d (mean shift in SD units)"}, {code:'n',desc:'sample size'}, {code:'alpha',desc:'Type I error (usually 0.05)'}, {code:'power',desc:'target power (usually 0.80)'}]
  },
  twoT: {
    useWhen: 'Two independent groups, continuous outcome (the textbook two-arm trial). The test stat is t = (mean1 - mean2) / pooled SE.',
    example: 'e.g. treatment vs control on a continuous score; n per group is what you solve for; allocation ratio k = n2/n1 handles uneven groups.',
    inputs: [{code:'d',desc:"Cohen's d"}, {code:'n',desc:'n per group (group 1)'}, {code:'k',desc:'allocation ratio n2/n1 (1 = balanced)'}, {code:'alpha',desc:'Type I error'}, {code:'power',desc:'target power'}]
  },
  paired: {
    useWhen: 'Two measurements on the same subjects (before/after, twin pairs). The relevant SD is the SD of the differences, which depends on the within-pair correlation r.',
    example: "e.g. pre vs post training scores on the same students; high within-pair r (e.g. 0.7) shrinks the needed n dramatically.",
    inputs: [{code:'d',desc:"Cohen's d on the raw scale"}, {code:'r',desc:'within-pair correlation'}, {code:'n',desc:'number of pairs'}, {code:'alpha',desc:'Type I error'}, {code:'power',desc:'target power'}]
  },
  oneProp: {
    useWhen: 'One observed proportion against a hypothesised proportion p0 (e.g. success rate vs a benchmark).',
    example: "e.g. does this lab achieve a 90% positive-control rate? Effect size is Cohen's h between observed and hypothesised proportion.",
    inputs: [{code:'h',desc:"Cohen's h (arcsine difference)"}, {code:'n',desc:'sample size'}, {code:'alpha',desc:'Type I error'}, {code:'power',desc:'target power'}]
  },
  twoProp: {
    useWhen: "Two arms with a binary outcome: did the treatment shift the success rate? Effect is Cohen's h between the two proportions.",
    example: 'e.g. conversion rate 10% in control vs 15% in treatment, h about 0.156, two-prop test on n per arm.',
    inputs: [{code:'p1',desc:'control rate'}, {code:'p2',desc:'treatment rate'}, {code:'n',desc:'n per group'}, {code:'alpha',desc:'Type I error'}, {code:'power',desc:'target power'}]
  },
  anova: {
    useWhen: "k > 2 groups, continuous outcome, omnibus F test. Effect is Cohen's f (SD of group means / within-group SD).",
    example: "e.g. compare 4 teaching methods on a test score; Cohen's f = 0.25 is the medium benchmark.",
    inputs: [{code:'f',desc:"Cohen's f"}, {code:'k',desc:'number of groups'}, {code:'n',desc:'n per group'}, {code:'alpha',desc:'Type I error'}, {code:'power',desc:'target power'}]
  },
  correlation: {
    useWhen: 'Test whether the population Pearson correlation differs from 0 (or any other null).',
    example: 'e.g. is height correlated with vocabulary in 7-year-olds? r = 0.30 is the medium benchmark.',
    inputs: [{code:'r',desc:"Pearson's r (target effect)"}, {code:'n',desc:'sample size (pairs)'}, {code:'alpha',desc:'Type I error'}, {code:'power',desc:'target power'}]
  },
  chisq: {
    useWhen: 'Goodness-of-fit or contingency-table test against a chi-square reference distribution.',
    example: "e.g. a 3x3 contingency table has df = 4; effect size is Cohen's w (RMS deviation between observed and expected cell probabilities).",
    inputs: [{code:'w',desc:"Cohen's w"}, {code:'df',desc:'degrees of freedom'}, {code:'n',desc:'total sample size'}, {code:'alpha',desc:'Type I error'}, {code:'power',desc:'target power'}]
  }
};

var activeDesign = 'twoT';
var solveFor = 'n';

var state = {
  oneT:        {effect:0.5, n:34,  alpha:0.05, power:0.80, tail:2},
  twoT:        {effect:0.5, n:64,  alpha:0.05, power:0.80, tail:2, ratio:1},
  paired:      {effect:0.5, n:34,  alpha:0.05, power:0.80, tail:2, rPaired:0.5},
  oneProp:     {p0:0.5, p1:0.6, h:cohenH(0.6,0.5), effect:cohenH(0.6,0.5), n:200, alpha:0.05, power:0.80, tail:2},
  twoProp:     {p1:0.10, p2:0.15, h:cohenH(0.15,0.10), effect:cohenH(0.15,0.10), n:686, alpha:0.05, power:0.80, tail:2},
  anova:       {effect:0.25, k:4, n:45, alpha:0.05, power:0.80},
  correlation: {effect:0.3, n:84, alpha:0.05, power:0.80, tail:2},
  chisq:       {effect:0.3, df:4, n:133, alpha:0.05, power:0.80}
};

function isProp(d){ return d==='twoProp' || d==='oneProp'; }
function perGroup(d){ return d==='twoT' || d==='twoProp' || d==='anova'; }
function nLabel(d){ return perGroup(d) ? 'n per group' : (d==='paired' ? 'pairs' : 'sample size n'); }
function nLabelShort(d){ return perGroup(d) ? 'n / group' : (d==='paired' ? 'pairs' : 'n'); }

// ---- banner + pills ----
function renderModes(){
  var btns = document.querySelectorAll('.mode[data-solve]');
  for (var i=0;i<btns.length;i++) btns[i].classList.toggle('on', btns[i].getAttribute('data-solve')===solveFor);
}
function renderBannerSentence(){
  var el = $('iwant'); if (!el) return;
  var dsg = DESIGNS.find(function(d){ return d.key===activeDesign; }) || DESIGNS[1];
  var dsgOpts = DESIGNS.map(function(d){ return '<option value="'+d.key+'" '+(d.key===activeDesign?'selected':'')+'>'+escapeHtml(d.short)+'</option>'; }).join('');
  var solveOpts = Object.keys(SOLVE_LABELS).map(function(k){ return '<option value="'+k+'" '+(k===solveFor?'selected':'')+'>'+escapeHtml(SOLVE_LABELS[k])+'</option>'; }).join('');
  el.innerHTML = 'I want to solve for <span class="psel">'+escapeHtml(SOLVE_LABELS[solveFor])+'<span class="pcaret">&#9662;</span><select aria-label="Solve for" onchange="setSolveFor(this.value)">'+solveOpts+'</select></span> in a <span class="psel">'+escapeHtml(dsg.short)+'<span class="pcaret">&#9662;</span><select aria-label="Design" onchange="setDesign(this.value)">'+dsgOpts+'</select></span>.';
}

// ---- method note ----
function renderMethodNote(){
  var meta = METHOD_META[activeDesign];
  if (!meta){ return; }
  if ($('mn-use')) $('mn-use').textContent = meta.useWhen || '';
  if ($('mn-example')) $('mn-example').textContent = meta.example || '';
  if ($('mn-inputs')) $('mn-inputs').innerHTML = (meta.inputs||[]).map(function(m){ return '<li><code>'+escapeHtml(m.code)+'</code><span>'+escapeHtml(m.desc)+'</span></li>'; }).join('');
}

// ---- inputs ----
function setSolveFor(v){ solveFor = v; renderModes(); renderInputs(); renderBannerSentence(); recompute(); }
function setDesign(v){ activeDesign = v; renderInputs(); renderMethodNote(); renderBannerSentence(); renderVizSliders(); recompute(); }

function inputRow(label, control, helper){
  return '<div class="f"><label>'+label+(helper?' <small>'+helper+'</small>':'')+'</label>'+control+'</div>';
}
function renderInputs(){
  var d = activeDesign, s = state[d], html = '';
  var dsg = DESIGNS.find(function(x){ return x.key===d; });

  if (solveFor !== 'effect'){
    if (d === 'twoProp'){
      html += inputRow('p&#8321; control rate', '<input type="number" step="0.01" min="0.001" max="0.999" value="'+s.p1+'" oninput="setProp(\'p1\',this.value)">');
      html += inputRow('p&#8322; treatment rate', '<input type="number" step="0.01" min="0.001" max="0.999" value="'+s.p2+'" oninput="setProp(\'p2\',this.value)">');
    } else if (d === 'oneProp'){
      html += inputRow('p&#8320; null', '<input type="number" step="0.01" min="0.001" max="0.999" value="'+s.p0+'" oninput="setProp(\'p0\',this.value)">');
      html += inputRow('p&#8321; alternative', '<input type="number" step="0.01" min="0.001" max="0.999" value="'+s.p1+'" oninput="setProp(\'p1\',this.value)">');
    } else {
      html += inputRow(dsg.effectLabel+' ('+dsg.effectSym+')', '<input type="number" step="0.01" value="'+s.effect+'" oninput="state.'+d+'.effect=+this.value;onStateChange()">');
    }
  }
  if (d === 'twoT') html += inputRow('Allocation ratio k', '<input type="number" step="0.05" min="0.1" max="10" value="'+s.ratio+'" oninput="state.twoT.ratio=Math.max(0.01,+this.value||1);onStateChange()">', 'n2/n1');
  if (d === 'paired') html += inputRow('Within-pair r', '<input type="number" step="0.05" min="-0.99" max="0.99" value="'+s.rPaired+'" oninput="state.paired.rPaired=Math.max(-0.99,Math.min(0.99,+this.value||0));onStateChange()">');
  if (d === 'anova') html += inputRow('k groups', '<input type="number" step="1" min="2" value="'+s.k+'" oninput="state.anova.k=Math.max(2,Math.floor(+this.value||2));onStateChange()">');
  if (d === 'chisq') html += inputRow('df', '<input type="number" step="1" min="1" value="'+s.df+'" oninput="state.chisq.df=Math.max(1,Math.floor(+this.value||1));onStateChange()">');

  if (solveFor !== 'alpha') html += inputRow('Alpha', '<input type="number" step="0.005" min="0.0001" max="0.5" value="'+s.alpha+'" oninput="state.'+d+'.alpha=Math.max(0.0001,Math.min(0.5,+this.value||0.05));onStateChange()">');
  if (solveFor !== 'power') html += inputRow('Target power', '<input type="number" step="0.01" min="0.01" max="0.999" value="'+s.power+'" oninput="state.'+d+'.power=Math.max(0.01,Math.min(0.999,+this.value||0.8));onStateChange()">');
  if (solveFor !== 'n') html += inputRow(nLabel(d), '<input type="number" step="1" min="2" value="'+s.n+'" oninput="state.'+d+'.n=Math.max(2,Math.floor(+this.value||2));onStateChange()">');

  if (['oneT','twoT','paired','oneProp','twoProp','correlation'].indexOf(d) !== -1){
    html += inputRow('Tail', '<select onchange="state.'+d+'.tail=+this.value;onStateChange()"><option value="2" '+(s.tail===2?'selected':'')+'>two-sided</option><option value="1" '+(s.tail===1?'selected':'')+'>one-sided</option></select>');
  }
  $('design-inputs').innerHTML = html;
}

function setProp(key, v){
  var d = activeDesign, s = state[d];
  s[key] = Math.max(0.001, Math.min(0.999, +v || 0));
  if (d === 'twoProp'){ s.h = cohenH(s.p2, s.p1); s.effect = s.h; }
  if (d === 'oneProp'){ s.h = cohenH(s.p1, s.p0); s.effect = s.h; }
  onStateChange();
}
function onStateChange(){ refreshSliderValues(); renderBannerSentence(); recompute(); }

// ---- compute ----
function recompute(){
  var d = activeDesign, s = state[d];
  var solvedValue, primaryLabel, primaryDisplay, auxFormula = '';
  var dsg = DESIGNS.find(function(x){ return x.key===d; });

  if (d === 'twoProp'){ s.effect = s.h = cohenH(s.p2, s.p1); }
  if (d === 'oneProp'){ s.effect = s.h = cohenH(s.p1, s.p0); }

  var n = s.n, eff = s.effect, alpha = s.alpha, power = s.power;
  var baseParams = {effect:eff, n:n, alpha:alpha, power:power, tail:s.tail||2, ratio:s.ratio, rPaired:s.rPaired, k:s.k, df:s.df};

  try {
    if (solveFor === 'n'){
      var N = solveN(d, baseParams, power);
      solvedValue = N; n = N;
      if (isFinite(N)) s.n = N;
      primaryLabel = 'solving for ' + nLabelShort(d);
      primaryDisplay = isFinite(N) ? ('n = '+fmtN(N)+(perGroup(d)?' per group':(d==='paired'?' pairs':''))) : 'n = ∞';
      auxFormula = isFinite(N) ? ('smallest integer where power ≥ '+fmt(power,2)+' (exact '+fmt(__lastExactN,1)+', rounded up)') : 'target unreachable for these parameters';
    } else if (solveFor === 'power'){
      var p = powerFn(d, baseParams);
      solvedValue = p; power = p;
      primaryLabel = 'solving for power';
      primaryDisplay = 'power = '+fmt(p,3);
      auxFormula = 'Pr(reject H₀ | H₁) at your n, effect and alpha';
    } else if (solveFor === 'effect'){
      var e = solveEffect(d, baseParams, power);
      solvedValue = e; eff = e;
      primaryLabel = 'solving for '+dsg.effectLabel+' (min detectable)';
      primaryDisplay = dsg.effectSym+' = '+fmt(e,4);
      auxFormula = 'smallest |'+dsg.effectSym+'| reaching power '+fmt(power,2);
    } else if (solveFor === 'alpha'){
      var a = solveAlpha(d, baseParams, power);
      solvedValue = a; alpha = a;
      primaryLabel = 'solving for alpha';
      primaryDisplay = 'α = '+fmt(a,4);
      auxFormula = 'largest α keeping power ≥ '+fmt(power,2)+' (you usually fix α and solve for n)';
    }
  } catch(err){ primaryDisplay = 'error'; auxFormula = String(err.message || err); }

  $('vchip').textContent = primaryLabel || 'result';
  $('vhead').textContent = primaryDisplay || '-';
  $('vsub').textContent = auxFormula || '';

  // stats grid (4 cells): effect / alpha / power / n
  var effCellLabel = isProp(d) ? 'h' : dsg.effectSym;
  var cells = [
    {k:effCellLabel, v:fmt(eff,3), acc:(solveFor==='effect')},
    {k:'alpha', v:fmt(alpha,3), acc:(solveFor==='alpha')},
    {k:'power', v:fmt(power,3), acc:(solveFor==='power')},
    {k:nLabelShort(d), v:isFinite(n)?fmtN(n):'∞', acc:(solveFor==='n')}
  ];
  $('stats').innerHTML = cells.map(function(c){ return '<div class="st"><div class="k">'+escapeHtml(c.k)+'</div><div class="v'+(c.acc?' acc':'')+'">'+escapeHtml(c.v)+'</div></div>'; }).join('');

  // callouts
  var callouts = [];
  if ((d==='twoT'||d==='oneT'||d==='paired') && Math.abs(eff) < 0.05) callouts.push('|'+dsg.effectSym+'| &lt; 0.05: a tiny effect, so n explodes and you may be chasing noise.');
  if (isProp(d)){
    var extreme = (s.p1<0.02||s.p1>0.98) || (s.p2!==undefined&&(s.p2<0.02||s.p2>0.98)) || (s.p0!==undefined&&(s.p0<0.02||s.p0>0.98));
    if (extreme) callouts.push('Extreme proportions: the normal approximation gets brittle here; consider an exact or Fisher-style test.');
  }
  if (d==='correlation' && Math.abs(eff) >= 0.95) callouts.push('|r| close to 1: the sampling distribution shifts sharply; double-check the target r.');
  $('callouts').innerHTML = callouts.map(function(t){ return '<div class="callout"><span class="ci">&#9888;</span><div>'+t+'</div></div>'; }).join('');

  // total N
  var totalN = n;
  if (d === 'twoT') totalN = n * (1 + (s.ratio||1));
  else if (d === 'twoProp') totalN = n * 2;
  else if (d === 'anova') totalN = n * s.k;

  renderVerdict({d:d, s:s, dsg:dsg, n:n, eff:eff, alpha:alpha, power:power, totalN:totalN, solvedValue:solvedValue});
  renderHow({d:d, s:s, dsg:dsg, n:n, eff:eff, alpha:alpha, power:power, totalN:totalN});
  renderRecap({d:d, s:s, dsg:dsg, n:n, eff:eff, alpha:alpha, power:power, totalN:totalN});
  buildReport({d:d, s:s, dsg:dsg, n:n, eff:eff, alpha:alpha, power:power, totalN:totalN});

  if ($('rcodepre')) $('rcodepre').textContent = buildRCode(d, s, solveFor, {n:n, eff:eff, alpha:alpha, power:power});
  drawVizChart();
}

function effectDescHtml(ctx){
  var d = ctx.d, s = ctx.s, eff = ctx.eff;
  if (d==='twoT'||d==='oneT'||d==='paired') return "Cohen's d = <b>"+fmt(eff,3)+"</b>";
  if (d==='oneProp') return 'a shift from <b>'+fmt(s.p0,3)+'</b> to <b>'+fmt(s.p1,3)+'</b>';
  if (d==='twoProp') return 'a gap between <b>'+fmt(s.p1,3)+'</b> and <b>'+fmt(s.p2,3)+'</b>';
  if (d==='anova') return "Cohen's f = <b>"+fmt(eff,3)+"</b> across <b>"+s.k+"</b> groups";
  if (d==='correlation') return 'Pearson r = <b>'+fmt(eff,3)+'</b>';
  if (d==='chisq') return "Cohen's w = <b>"+fmt(eff,3)+"</b> at df = <b>"+s.df+"</b>";
  return '';
}

function renderVerdict(ctx){
  var d = ctx.d, dsg = ctx.dsg, n = ctx.n, eff = ctx.eff, alpha = ctx.alpha, power = ctx.power, totalN = ctx.totalN;
  var plainEl = $('plain'), infEl = $('infline');
  if (!isFinite(ctx.solvedValue)){
    plainEl.innerHTML = 'These inputs do not yield a finite answer. Try a larger effect, a smaller power target, or a more relaxed alpha.';
    infEl.innerHTML = '<span class="ik">Inference</span><span class="warn">No finite solution for the current inputs.</span>';
    return;
  }
  var grpWord = perGroup(d) ? 'per group' : (d==='paired' ? 'pairs' : '');
  var totalNote = perGroup(d) ? ' The total study size is <b>'+fmtN(totalN)+'</b>.' : '';
  var eD = effectDescHtml(ctx);
  var pct = (power*100).toFixed(power>=0.995?2:(Math.abs(power*100-Math.round(power*100))<0.05?0:1));

  var plain, inf;
  if (solveFor === 'n'){
    plain = 'To reach <b>'+(power*100).toFixed(0)+'%</b> power to detect '+eD+' at alpha <b>'+fmt(alpha,3)+'</b>, plan for <b>n = '+fmtN(n)+'</b> '+grpWord+'.'+totalNote;
    inf = 'Since you want power ≥ <b>'+fmt(power,2)+'</b> to detect '+eD+' at α = <b>'+fmt(alpha,3)+'</b>, you need <b>'+fmtN(n)+'</b> '+grpWord+'. A smaller sample risks missing a real effect (a Type II error).';
  } else if (solveFor === 'power'){
    var adequate = power >= 0.8;
    plain = 'With <b>'+fmtN(n)+'</b> '+grpWord+' at alpha <b>'+fmt(alpha,3)+'</b>, this design reaches <b>'+pct+'%</b> power to detect '+eD+'.'+totalNote;
    inf = 'With <b>'+fmtN(n)+'</b> '+grpWord+' at α = <b>'+fmt(alpha,3)+'</b>, power is <b>'+pct+'%</b>. '+(adequate ? 'That meets the usual 0.80 target: <b>adequately powered</b>.' : '<span class="warn">That is below the usual 0.80 target: the study is underpowered.</span>');
  } else if (solveFor === 'effect'){
    plain = 'With <b>'+fmtN(n)+'</b> '+grpWord+', alpha <b>'+fmt(alpha,3)+'</b> and <b>'+(power*100).toFixed(0)+'%</b> power, the smallest effect you can reliably detect is <b>'+dsg.effectSym+' = '+fmt(eff,3)+'</b>. Anything smaller will often be missed.'+totalNote;
    inf = 'Given <b>'+fmtN(n)+'</b> '+grpWord+' at α = <b>'+fmt(alpha,3)+'</b> and power <b>'+fmt(power,2)+'</b>, the minimum detectable effect is <b>'+dsg.effectSym+' = '+fmt(eff,3)+'</b>. If your real effect is smaller than this, expect a non-significant result even when H₁ is true.';
  } else {
    plain = 'To keep <b>'+(power*100).toFixed(0)+'%</b> power with <b>'+fmtN(n)+'</b> '+grpWord+' and effect '+eD+', you could relax alpha up to <b>'+fmt(alpha,4)+'</b>.'+totalNote;
    inf = 'The largest α that still keeps power ≥ <b>'+fmt(power,2)+'</b> at <b>'+fmtN(n)+'</b> '+grpWord+' is <b>'+fmt(alpha,4)+'</b>. In practice you fix α (usually 0.05) and solve for n instead.';
  }
  plainEl.innerHTML = plain;
  infEl.innerHTML = '<span class="ik">Inference</span>' + inf;
}

function renderHow(ctx){
  var d = ctx.d, dsg = ctx.dsg, n = ctx.n, alpha = ctx.alpha, power = ctx.power;
  var tailWord = (state[d].tail===1) ? 'one-sided' : 'two-sided';
  var fnName = {oneT:'pwr.t.test', twoT:'pwr.t.test', paired:'pwr.t.test', oneProp:'pwr.p.test', twoProp:'pwr.2p.test', anova:'pwr.anova.test', correlation:'pwr.r.test', chisq:'pwr.chisq.test'}[d];
  var dist = {oneT:'noncentral t', twoT:'noncentral t', paired:'noncentral t', oneProp:'shifted normal (arcsine)', twoProp:'shifted normal (arcsine)', anova:'noncentral F', correlation:'Fisher-z normal', chisq:'noncentral chi-square'}[d];
  $('how1').innerHTML = 'Model: a <b>'+escapeHtml(dsg.name)+'</b>. Under the alternative the test statistic follows a <b>'+dist+'</b> whose shift grows with sqrt(n) and the effect size. This is exactly what R\'s <code>'+fnName+'()</code> uses.';
  if (solveFor === 'n'){
    $('how2').innerHTML = 'Invert for n: hold the effect, alpha ('+fmt(alpha,3)+', '+tailWord+') and target power ('+fmt(power,2)+') fixed, then find the smallest n whose power reaches the target. The exact root is <code>'+fmt(__lastExactN,2)+'</code>, rounded up to a whole subject.';
  } else if (solveFor === 'power'){
    $('how2').innerHTML = 'Evaluate power directly: with n = '+fmtN(n)+', alpha '+fmt(alpha,3)+' ('+tailWord+') and the effect fixed, power is the area of the alternative distribution beyond the critical value.';
  } else if (solveFor === 'effect'){
    $('how2').innerHTML = 'Invert for the effect: hold n = '+fmtN(n)+', alpha '+fmt(alpha,3)+' ('+tailWord+') and target power '+fmt(power,2)+' fixed, then find the smallest effect that still reaches the target power.';
  } else {
    $('how2').innerHTML = 'Invert for alpha: hold n = '+fmtN(n)+', the effect and target power '+fmt(power,2)+' fixed, then find the largest alpha that still keeps power at or above the target.';
  }
  $('how3').innerHTML = 'The tail probability is evaluated to machine precision (AS 243 for noncentral t, Poisson-mixture series for F and chi-square), so every number here matches the <code>pwr</code> package. The full input recap is below.';
}

function renderRecap(ctx){
  var d = ctx.d, s = ctx.s, dsg = ctx.dsg, n = ctx.n, eff = ctx.eff, alpha = ctx.alpha, power = ctx.power, totalN = ctx.totalN;
  var rows = [];
  rows.push({k:'design', v:dsg.name});
  if (d === 'twoProp'){ rows.push({k:'p₁', v:fmt(s.p1,3)}); rows.push({k:'p₂', v:fmt(s.p2,3)}); rows.push({k:'h', v:fmt(s.h,4)}); }
  else if (d === 'oneProp'){ rows.push({k:'p₀', v:fmt(s.p0,3)}); rows.push({k:'p₁', v:fmt(s.p1,3)}); rows.push({k:'h', v:fmt(s.h,4)}); }
  else { rows.push({k:dsg.effectSym, v:fmt(eff,4)}); }
  if (d === 'twoT' && s.ratio !== 1) rows.push({k:'ratio n2/n1', v:fmt(s.ratio,3)});
  if (d === 'paired') rows.push({k:'within-pair r', v:fmt(s.rPaired,3)});
  if (d === 'anova') rows.push({k:'k groups', v:String(s.k)});
  if (d === 'chisq') rows.push({k:'df', v:String(s.df)});
  rows.push({k:'alpha', v:fmt(alpha,4)});
  rows.push({k:'tail', v:(s.tail===1?'one-sided':(s.tail===2?'two-sided':'two-sided'))});
  rows.push({k:'target power', v:fmt(power,3)});
  rows.push({k:nLabelShort(d), v:isFinite(n)?fmtN(n):'∞'});
  if (perGroup(d)) rows.push({k:'total N', v:isFinite(totalN)?fmtN(totalN):'∞'});
  $('recap').innerHTML = rows.map(function(r){ return '<div class="recap-row"><span class="rk">'+escapeHtml(r.k)+'</span><span class="rv">'+escapeHtml(r.v)+'</span></div>'; }).join('');
}

function buildReport(ctx){
  var d = ctx.d, s = ctx.s, dsg = ctx.dsg, n = ctx.n, eff = ctx.eff, alpha = ctx.alpha, power = ctx.power, totalN = ctx.totalN;
  var effTxt;
  if (isProp(d)) effTxt = (d==='twoProp' ? 'p1='+fmt(s.p1,3)+', p2='+fmt(s.p2,3)+' (h='+fmt(s.h,3)+')' : 'p0='+fmt(s.p0,3)+', p1='+fmt(s.p1,3)+' (h='+fmt(s.h,3)+')');
  else effTxt = dsg.effectSym+'='+fmt(eff,3);
  var nTxt = isFinite(n) ? (fmtN(n)+(perGroup(d)?' per group ('+fmtN(totalN)+' total)':(d==='paired'?' pairs':''))) : 'infinite';
  var report = dsg.name.charAt(0).toUpperCase()+dsg.name.slice(1)+' power analysis: '+effTxt+', alpha='+fmt(alpha,3)+', power='+fmt(power,2)+' -> n = '+nTxt+'. Computed with R pwr.';
  if ($('report')) $('report').textContent = report;
}

function buildRCode(d, s, mode, vals){
  var L = [];
  var alt = (s.tail||2)===1 ? 'greater' : 'two.sided';
  var dsg = DESIGNS.find(function(x){ return x.key===d; });
  var dV = mode==='effect' ? 'NULL' : fmt(s.effect,4);
  var nV = mode==='n' ? 'NULL' : fmtN(vals.n);
  var pV = mode==='power' ? 'NULL' : fmt(vals.power,3);
  var aV = mode==='alpha' ? 'NULL' : fmt(s.alpha,4);
  L.push('# Power analysis: '+dsg.name+', solving for '+SOLVE_LABELS[mode]);
  L.push('library(pwr)');
  if (d === 'twoT'){
    L.push('pwr.t.test(d = '+dV+', n = '+nV+',');
    L.push('           sig.level = '+aV+', power = '+pV+',');
    L.push('           type = "two.sample", alternative = "'+alt+'")');
  } else if (d === 'oneT'){
    L.push('pwr.t.test(d = '+dV+', n = '+nV+',');
    L.push('           sig.level = '+aV+', power = '+pV+',');
    L.push('           type = "one.sample", alternative = "'+alt+'")');
  } else if (d === 'paired'){
    if (mode === 'effect'){
      L.push('# d = NULL: pwr returns d_z; raw d = d_z * sqrt(2 * (1 - r))');
      L.push('pwr.t.test(d = NULL, n = '+nV+',');
    } else {
      L.push('r   <- '+fmt(s.rPaired,3));
      L.push('d_z <- '+dV+' / sqrt(2 * (1 - r))   # paired -> d_z');
      L.push('pwr.t.test(d = d_z, n = '+nV+',');
    }
    L.push('           sig.level = '+aV+', power = '+pV+',');
    L.push('           type = "paired", alternative = "'+alt+'")');
  } else if (d === 'oneProp'){
    if (mode === 'effect') L.push('# h = NULL (solving for the effect size)');
    else L.push('h <- ES.h('+fmt(s.p1,3)+', '+fmt(s.p0,3)+')');
    L.push('pwr.p.test(h = '+(mode==='effect'?'NULL':'h')+', n = '+nV+',');
    L.push('           sig.level = '+aV+', power = '+pV+',');
    L.push('           alternative = "'+alt+'")');
  } else if (d === 'twoProp'){
    if (mode === 'effect') L.push('# h = NULL (solving for the effect size)');
    else L.push('h <- ES.h('+fmt(s.p2,3)+', '+fmt(s.p1,3)+')');
    L.push('pwr.2p.test(h = '+(mode==='effect'?'NULL':'h')+', n = '+nV+',');
    L.push('            sig.level = '+aV+', power = '+pV+',');
    L.push('            alternative = "'+alt+'")');
  } else if (d === 'anova'){
    L.push('pwr.anova.test(k = '+s.k+', n = '+nV+', f = '+dV+',');
    L.push('               sig.level = '+aV+', power = '+pV+')');
  } else if (d === 'correlation'){
    L.push('pwr.r.test(r = '+dV+', n = '+nV+',');
    L.push('           sig.level = '+aV+', power = '+pV+',');
    L.push('           alternative = "'+alt+'")');
  } else if (d === 'chisq'){
    L.push('pwr.chisq.test(w = '+dV+', N = '+nV+', df = '+s.df+',');
    L.push('               sig.level = '+aV+', power = '+pV+')');
  }
  return L.join('\n');
}

// ---- viz ----
var VIZ_CONFIG = {
  oneT: [ {key:'effect', sym:'d', label:'effect', min:0.05, max:1.5, step:0.01, decimals:2}, {key:'alpha', sym:'α', label:'alpha', min:0.001, max:0.2, step:0.001, decimals:3}, {key:'power', sym:'P', label:'target', min:0.5, max:0.99, step:0.01, decimals:2} ],
  twoT: [ {key:'effect', sym:'d', label:'effect', min:0.05, max:1.5, step:0.01, decimals:2}, {key:'alpha', sym:'α', label:'alpha', min:0.001, max:0.2, step:0.001, decimals:3}, {key:'power', sym:'P', label:'target', min:0.5, max:0.99, step:0.01, decimals:2} ],
  paired: [ {key:'effect', sym:'d', label:'effect', min:0.05, max:1.5, step:0.01, decimals:2}, {key:'rPaired', sym:'r', label:'pair r', min:-0.9, max:0.95, step:0.01, decimals:2}, {key:'power', sym:'P', label:'target', min:0.5, max:0.99, step:0.01, decimals:2} ],
  oneProp: [ {key:'p0', sym:'p₀', label:'null', min:0.02, max:0.98, step:0.01, decimals:2}, {key:'p1', sym:'p₁', label:'alt', min:0.02, max:0.98, step:0.01, decimals:2}, {key:'power', sym:'P', label:'target', min:0.5, max:0.99, step:0.01, decimals:2} ],
  twoProp: [ {key:'p1', sym:'p₁', label:'control', min:0.02, max:0.98, step:0.01, decimals:2}, {key:'p2', sym:'p₂', label:'treat', min:0.02, max:0.98, step:0.01, decimals:2}, {key:'power', sym:'P', label:'target', min:0.5, max:0.99, step:0.01, decimals:2} ],
  anova: [ {key:'effect', sym:'f', label:'Cohen f', min:0.05, max:0.8, step:0.01, decimals:2}, {key:'k', sym:'k', label:'groups', min:2, max:8, step:1, decimals:0}, {key:'power', sym:'P', label:'target', min:0.5, max:0.99, step:0.01, decimals:2} ],
  correlation: [ {key:'effect', sym:'r', label:'corr', min:0.05, max:0.95, step:0.01, decimals:2}, {key:'alpha', sym:'α', label:'alpha', min:0.001, max:0.2, step:0.001, decimals:3}, {key:'power', sym:'P', label:'target', min:0.5, max:0.99, step:0.01, decimals:2} ],
  chisq: [ {key:'effect', sym:'w', label:'Cohen w', min:0.05, max:0.8, step:0.01, decimals:2}, {key:'df', sym:'df', label:'df', min:1, max:20, step:1, decimals:0}, {key:'power', sym:'P', label:'target', min:0.5, max:0.99, step:0.01, decimals:2} ]
};

function vizPowerAt(nv){
  var d = activeDesign, s = state[d];
  var params = {effect:(isProp(d)?s.h:s.effect), n:nv, alpha:s.alpha, tail:s.tail||2, ratio:s.ratio, rPaired:s.rPaired, k:s.k, df:s.df};
  var p = powerFn(d, params);
  return isFinite(p) ? p : 0;
}
function drawVizChart(){
  var svg = $('viz-svg'); if (!svg) return;
  var W = 360, H = 200, ml = 36, mr = 14, mt = 14, mb = 36;
  var plotW = W - ml - mr, plotH = H - mt - mb;
  var d = activeDesign, s = state[d];
  var nNow = s.n; if (!isFinite(nNow) || nNow < 4) nNow = 50;
  var nMax = Math.max(20, Math.round(nNow * 2.5)), nMin = 4, N = 60;
  var tx = function(nv){ return ml + ((nv - nMin)/(nMax - nMin)) * plotW; };
  var ty = function(pv){ return mt + plotH - pv * plotH; };
  var path = '';
  for (var i = 0; i <= N; i++){
    var nv = Math.round(nMin + (i/N)*(nMax-nMin));
    path += (i===0?'M':'L') + tx(nv).toFixed(1) + ',' + ty(vizPowerAt(nv)).toFixed(1);
  }
  var tyTarget = ty(s.power);
  var targetLine = '<line class="target-line" x1="'+ml+'" y1="'+tyTarget.toFixed(1)+'" x2="'+(W-mr)+'" y2="'+tyTarget.toFixed(1)+'"/><text class="target-label" x="'+(W-mr-2)+'" y="'+(tyTarget-3).toFixed(1)+'" text-anchor="end">power = '+fmt(s.power,2)+'</text>';
  var pNow = vizPowerAt(nNow);
  var dot = '<circle class="estimate-dot" cx="'+tx(nNow).toFixed(1)+'" cy="'+ty(pNow).toFixed(1)+'" r="4"/>';
  var ticks = '';
  for (var t = 0; t <= 4; t++){
    var nvt = Math.round(nMin + (t/4)*(nMax-nMin));
    ticks += '<line class="ax" x1="'+tx(nvt).toFixed(1)+'" y1="'+(mt+plotH)+'" x2="'+tx(nvt).toFixed(1)+'" y2="'+(mt+plotH+3)+'"/><text class="tick-label" x="'+tx(nvt).toFixed(1)+'" y="'+(mt+plotH+14)+'" text-anchor="middle">'+nvt+'</text>';
  }
  var yTicks = '';
  [0,0.5,1].forEach(function(yt){
    yTicks += '<line class="ax" x1="'+(ml-3)+'" y1="'+ty(yt).toFixed(1)+'" x2="'+ml+'" y2="'+ty(yt).toFixed(1)+'"/><text class="tick-label" x="'+(ml-6)+'" y="'+(ty(yt)+3).toFixed(1)+'" text-anchor="end">'+yt.toFixed(1)+'</text>';
  });
  svg.innerHTML = '<line class="ax" x1="'+ml+'" y1="'+(mt+plotH)+'" x2="'+(W-mr)+'" y2="'+(mt+plotH)+'"/><line class="ax" x1="'+ml+'" y1="'+mt+'" x2="'+ml+'" y2="'+(mt+plotH)+'"/>'+ticks+yTicks+targetLine+'<path class="ci-line" d="'+path+'"/>'+dot+'<text class="ax-label" x="'+(ml+plotW/2)+'" y="'+(H-6)+'" text-anchor="middle">sample size n  (power on the y-axis)</text>';
  $('viz-caption').textContent = 'Power rises with sample size; the effect is held fixed.';
  var eff = isProp(d) ? s.h : s.effect;
  var dsg = DESIGNS.find(function(x){ return x.key===d; });
  $('viz-readout').innerHTML = escapeHtml(dsg.short)+' &middot; '+dsg.effectSym+' = <b>'+fmtViz(eff,3)+'</b> &middot; n = <b>'+fmtN(nNow)+'</b> &middot; power = <b>'+fmtViz(pNow,3)+'</b>';
}
function renderVizSliders(){
  var container = $('viz-sliders'); if (!container) return;
  var cfg = VIZ_CONFIG[activeDesign]; if (!cfg){ container.innerHTML = ''; return; }
  container.innerHTML = cfg.map(function(inp){
    var val = state[activeDesign][inp.key];
    return '<div class="vrow"><label><span class="vsym">'+inp.sym+'</span>'+(inp.label||'')+'</label><input type="range" min="'+inp.min+'" max="'+inp.max+'" step="'+inp.step+'" value="'+val+'" aria-label="'+escapeHtml(inp.label||inp.key)+'" oninput="onVizSlide(\''+inp.key+'\', this.value)"><span class="vval" id="viz-val-'+inp.key+'">'+fmtViz(val, inp.decimals)+'</span></div>';
  }).join('');
}
function refreshSliderValues(){
  var cfg = VIZ_CONFIG[activeDesign]; if (!cfg) return;
  cfg.forEach(function(inp){
    var el = $('viz-val-'+inp.key);
    if (el) el.textContent = fmtViz(state[activeDesign][inp.key], inp.decimals);
  });
}
function onVizSlide(key, val){
  var v = +val;
  state[activeDesign][key] = (key==='k' || key==='df') ? Math.round(v) : v;
  if (activeDesign === 'twoProp' && (key==='p1'||key==='p2')){ state.twoProp.h = cohenH(state.twoProp.p2, state.twoProp.p1); state.twoProp.effect = state.twoProp.h; }
  if (activeDesign === 'oneProp' && (key==='p0'||key==='p1')){ state.oneProp.h = cohenH(state.oneProp.p1, state.oneProp.p0); state.oneProp.effect = state.oneProp.h; }
  refreshSliderValues();
  renderInputs();
  renderBannerSentence();
  recompute();
}

// ---- scenarios ----
var SCENARIOS = {
  ttest: {design:'twoT', solveFor:'n', state:{effect:0.5, n:64, alpha:0.05, power:0.80, tail:2, ratio:1}, note:'A typical two-arm trial: continuous outcome, medium effect (d = 0.5), 80% power, alpha 0.05.'},
  anova: {design:'anova', solveFor:'n', state:{effect:0.25, k:4, n:45, alpha:0.05, power:0.80}, note:'Four-group comparison with a medium Cohen f (0.25). Solve for n per group.'},
  prop:  {design:'twoProp', solveFor:'n', state:{p1:0.10, p2:0.15, n:686, alpha:0.05, power:0.80, tail:2}, note:'Conversion-rate test: control 10%, treatment 15%. Solve for n per arm.'},
  corr:  {design:'correlation', solveFor:'n', state:{effect:0.3, n:84, alpha:0.05, power:0.80, tail:2}, note:'Pearson correlation, target r = 0.30 (Cohen medium). Solve for sample size.'},
  chisq: {design:'chisq', solveFor:'n', state:{effect:0.3, df:4, n:133, alpha:0.05, power:0.80}, note:'A 3x3 contingency table (df = 4) with Cohen w = 0.30. Solve for total sample size.'},
  custom:{design:'twoT', solveFor:'n', state:{}, note:'Edit the inputs to your own study.'}
};
function loadScenario(key){
  var sc = SCENARIOS[key]; if (!sc) return;
  var btns = document.querySelectorAll('.scen');
  for (var i=0;i<btns.length;i++) btns[i].classList.toggle('on', btns[i].getAttribute('data-scen')===key);
  if (key !== 'custom'){
    activeDesign = sc.design;
    solveFor = sc.solveFor;
    Object.assign(state[sc.design], sc.state);
    if (sc.design === 'twoProp'){ state.twoProp.h = cohenH(state.twoProp.p2, state.twoProp.p1); state.twoProp.effect = state.twoProp.h; }
    if (sc.design === 'oneProp'){ state.oneProp.h = cohenH(state.oneProp.p1, state.oneProp.p0); state.oneProp.effect = state.oneProp.h; }
  }
  if ($('scen-note')) $('scen-note').innerHTML = sc.note;
  renderModes();
  renderInputs();
  renderMethodNote();
  renderBannerSentence();
  renderVizSliders();
  recompute();
}

// ---- copy ----
function copyReport(){
  var txt = ($('report')||{}).textContent || '';
  if (!txt) return;
  navigator.clipboard.writeText(txt).then(function(){
    var b = $('copybtn'); b.textContent = 'Copied'; setTimeout(function(){ b.textContent = 'Copy report line'; }, 1400);
    if (window.__gaCopy) window.__gaCopy('report');
  });
}
function copyCode(){
  var txt = ($('rcodepre')||{}).textContent || '';
  if (!txt) return;
  navigator.clipboard.writeText(txt).then(function(){
    var b = $('rcopy'); b.textContent = 'Copied'; setTimeout(function(){ b.textContent = 'Copy code'; }, 1400);
    if (window.__gaCopy) window.__gaCopy('rcode');
  });
}

var _usedOnce = false;
function markToolUse(){ if (_usedOnce) return; _usedOnce = true; if (window.__gaUse) window.__gaUse(); }

// init
loadScenario('ttest');
document.querySelectorAll('.scen').forEach(function(b){ if (b.getAttribute('data-scen')==='ttest') b.classList.add('on'); });
(function(){ var w = document.querySelector('main.wrap'); if (!w) return; ['input','click','change'].forEach(function(ev){ w.addEventListener(ev, markToolUse, {passive:true}); }); })();

window.runSmokeTests = function(){
  var cases = [
    {desc:'two-sample t d=0.5 a=0.05 power=0.80 -> n ~ 64', fn:function(){ return solveN('twoT', {effect:0.5, alpha:0.05, tail:2, ratio:1}, 0.80); }, expect:64, tol:1},
    {desc:'ANOVA k=4 f=0.25 a=0.05 power=0.80 -> n ~ 45', fn:function(){ return solveN('anova', {effect:0.25, k:4, alpha:0.05}, 0.80); }, expect:45, tol:2},
    {desc:'two-prop 0.5/0.6 a=0.05 power=0.80 -> n ~ 388', fn:function(){ return solveN('twoProp', {effect:cohenH(0.6,0.5), alpha:0.05, tail:2}, 0.80); }, expect:388, tol:3},
    {desc:'correlation r=0.3 a=0.05 power=0.80 -> n ~ 84', fn:function(){ return solveN('correlation', {effect:0.3, alpha:0.05, tail:2}, 0.80); }, expect:84, tol:2},
    {desc:'chi-square df=4 w=0.3 a=0.05 power=0.80 -> n ~ 133', fn:function(){ return solveN('chisq', {effect:0.3, df:4, alpha:0.05}, 0.80); }, expect:133, tol:2}
  ];
  var pass = 0;
  cases.forEach(function(t){ var got = t.fn(); var ok = Math.abs(got - t.expect) <= t.tol; console.log((ok?'PASS':'FAIL')+' '+t.desc+'  got='+got); if (ok) pass++; });
  console.log(pass+'/'+cases.length+' passed');
  return pass === cases.length;
};
