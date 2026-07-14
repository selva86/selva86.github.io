/* A/B Test Calculator - UI engine (compute, render, viz, scenarios).
 * Pairs with tools/lib/ab-test-math.js (the R-verified math) and the inline
 * boot/analytics block in tools/ab-test-calculator.html. Classic script:
 * every function here is global so inline onclick handlers can reach it. */
'use strict';
function $(id){ return document.getElementById(id); }
function fmt(x, d){ d = (d==null)?4:d; if (!isFinite(x)) return '-'; return Number(x).toFixed(d).replace(/\.?0+$/,''); }
function fmtPct(p, d){ d = (d==null)?2:d; if (!isFinite(p)) return '-'; return (p*100).toFixed(d) + '%'; }
function fmtNum(n){ if (!isFinite(n)) return '-'; return Math.round(n).toLocaleString('en-US'); }
function fmtViz(x, d){ d = (d==null)?3:d; if (!isFinite(x)) return '-'; return Number(x).toFixed(d).replace(/(\.\d*?)0+$/,'$1').replace(/\.$/,''); }
function escapeHtml(s){ return String(s).replace(/[&<>"]/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]; }); }

// Math engine: verified library /tools/lib/ab-test-math.js (checked to <= 1e-6
// vs R prop.test / pwr.2p.test / integrate across 29 cases). No RNG.
const AB = window.ABTestMath;
const pnorm = AB.pnorm, dnorm = AB.dnorm, qnorm = AB.qnorm, dbeta = AB.dbeta;

function twoPropTest(c1, n1, c2, n2, alpha, tail){
  const a = (typeof alpha === 'number' && alpha > 0 && alpha < 1) ? alpha : 0.05;
  const tl = (tail === 1) ? 1 : 2;
  const r = AB.twoProp(c1, n1, c2, n2, a, tl);
  return { p1:r.pa, p2:r.pb, diff:r.diff, relDiff:r.relDiff, z:r.z, p:r.p, tail:tl,
           ciLow:r.ciLo, ciHigh:r.ciHi, ciLevel:r.ciLevel, seH0:r.seH0, seCi:r.seCi, chi2:r.chisq };
}
function sampleSizeTwoProp(p1, p2, alpha, power, tail){
  if (!(p1 > 0 && p1 < 1 && p2 > 0 && p2 < 1)) return NaN;
  const r = AB.sampleSize(p1, p2, alpha, power, tail);
  return isFinite(r.nCeil) ? r.nCeil : NaN;
}
let _bayesMemo = { key:'', val:null };
function bayesAnalysis(c1, n1, c2, n2, prior){
  const a0 = (prior && prior.a > 0) ? prior.a : 1;
  const b0 = (prior && prior.b > 0) ? prior.b : 1;
  const key = [c1,n1,c2,n2,a0,b0].join(',');
  if (_bayesMemo.key === key) return _bayesMemo.val;
  const r = AB.bayes(c1, n1, c2, n2, a0, b0);
  const out = { probBeatsA:r.pBbetter, meanDiff:r.meanLift, ci025:r.crLo, ci975:r.crHi,
                bf10:r.bf10, a1:r.a1, b1:r.b1, a2:r.a2, b2:r.b2 };
  _bayesMemo = { key:key, val:out };
  return out;
}
function pocockInfo(K, alpha){ return AB.pocockNominal(K, alpha); }

// Modes, framings, state
const MODES = [
  {key:'plan',       name:'plan a 2-arm test'},
  {key:'analyze',    name:'analyze a finished test'},
  {key:'sequential', name:'check a sequential / peeking plan'}
];
const FRAMINGS = [
  {key:'freq',  name:'frequentist'},
  {key:'bayes', name:'Bayesian'},
  {key:'both',  name:'frequentist + Bayesian'}
];
let activeMode = 'analyze';
let activeFraming = 'both';
const state = {
  baseline: 0.10, mde: 0.01, power: 0.80,
  n_a: 1000, conv_a: 120, n_b: 1000, conv_b: 144,
  alpha: 0.05, tail: 2, looks: 3,
  vizBaseline: 0.10, vizMde: 0.01, vizAlpha: 0.05
};
const METHOD_META = {
  'plan': {
    useWhen: 'You have not run the test yet. You want the sample size per arm (at 50/50 allocation) from a baseline rate, a minimum detectable lift, alpha and power.',
    example: 'baseline 10% conversion, want 80% power to detect a +1pp absolute lift at alpha = 0.05.'
  },
  'sequential': {
    useWhen: 'You plan to peek at the data several times and might stop early. You want the per-look significance boundary that keeps the overall false-positive rate at alpha.',
    example: '3 interim looks at alpha = 0.05: cross only if |z| exceeds the Pocock boundary, not the naive 1.96.'
  },
  'analyze-freq': {
    useWhen: 'The test is finished. You have the per-arm visitors and conversions. You want lift, p and a confidence interval.',
    example: 'A: 120/1000, B: 144/1000. The two-proportion z-test gives lift = +2.4pp, p and a CI.'
  },
  'analyze-bayes': {
    useWhen: 'You want P(B&gt;A) and a credible interval on the lift, with a stated prior. No alpha needed.',
    example: 'Beta(1,1) prior + the same data gives P(B&gt;A) and a posterior CI for p_b - p_a.'
  },
  'analyze-both': {
    useWhen: 'You want both readouts side by side: p and CI from the z-test, plus P(B&gt;A) and BF10 from the Bayesian update. Most production setups land here.',
    example: 'A: 120/1000, B: 144/1000 returns p, lift CI, P(B&gt;A) and BF10 together.'
  }
};
function metaKey(){
  if (activeMode === 'plan') return 'plan';
  if (activeMode === 'sequential') return 'sequential';
  return 'analyze-' + activeFraming;
}

// "I want to ..." banner
function renderIwant(){
  const el = $('iwant'); if (!el) return;
  const modeLabel = MODES.find(function(m){ return m.key === activeMode; }).name;
  const modeOpts = MODES.map(function(m){
    return '<option value="'+m.key+'" '+(m.key===activeMode?'selected':'')+'>'+escapeHtml(m.name)+'</option>';
  }).join('');
  const modeParam = '<span class="param">'+escapeHtml(modeLabel)+'<span class="param-caret">&#9662;</span>'
      + '<select aria-label="Mode" onchange="setMode(this.value)">'+modeOpts+'</select></span>';
  if (activeMode === 'analyze'){
    const framingLabel = FRAMINGS.find(function(f){ return f.key === activeFraming; }).name;
    const framingOpts = FRAMINGS.map(function(f){
      return '<option value="'+f.key+'" '+(f.key===activeFraming?'selected':'')+'>'+escapeHtml(f.name)+'</option>';
    }).join('');
    const givens = 'n_a = '+state.n_a+', conv_a = '+state.conv_a+', n_b = '+state.n_b+', conv_b = '+state.conv_b;
    el.innerHTML = 'I want to '+modeParam+' using '
      + '<span class="param">'+escapeHtml(framingLabel)+'<span class="param-caret">&#9662;</span>'
      + '<select aria-label="Framing" onchange="setFraming(this.value)">'+framingOpts+'</select></span> '
      + 'given <span class="param is-static">'+givens+'</span>.';
  } else if (activeMode === 'plan'){
    const givens = 'p1 = '+fmtPct(state.baseline,1)+', MDE = +'+fmtPct(state.mde,2)+', &alpha; = '+fmt(state.alpha,3)+', power = '+fmt(state.power,2);
    el.innerHTML = 'I want to '+modeParam+' given <span class="param is-static">'+givens+'</span>.';
  } else {
    const givens = 'K = '+state.looks+' looks, &alpha; = '+fmt(state.alpha,3);
    el.innerHTML = 'I want to '+modeParam+' given <span class="param is-static">'+givens+'</span>.';
  }
}
function syncControlVisibility(){
  const showFraming = activeMode === 'analyze';
  const showTail = activeMode === 'plan' || (activeMode === 'analyze' && activeFraming !== 'bayes');
  const showAlpha = activeMode !== 'analyze' || activeFraming !== 'bayes';
  if ($('framing-row')) $('framing-row').style.display = showFraming ? '' : 'none';
  if ($('tail-row')) $('tail-row').style.display = showTail ? '' : 'none';
  if ($('alpha-row')) $('alpha-row').style.display = showAlpha ? '' : 'none';
}
function renderMethodNote(){
  const meta = METHOD_META[metaKey()];
  const el = $('method-note'); if (!meta || !el) return;
  el.innerHTML = '<b>Use when:</b> ' + meta.useWhen + ' <b>Example:</b> ' + meta.example;
}

// Inputs (mode-dependent) - Lab-sheet fields
function renderInputs(){
  let html = '';
  if (activeMode === 'plan'){
    html = '<div class="fields">'
      + '<div class="f"><label>Baseline p1<span class="hint">arm A rate, 0-1</span></label><input type="number" id="i-baseline" min="0.0001" max="0.9999" step="0.001" value="'+state.baseline+'" oninput="onPlanInput()" aria-label="Baseline conversion rate"></div>'
      + '<div class="f"><label>MDE<span class="hint">absolute lift, e.g. 0.01</span></label><input type="number" id="i-mde" min="0.0001" max="0.9" step="0.001" value="'+state.mde+'" oninput="onPlanInput()" aria-label="Minimum detectable effect"></div>'
      + '<div class="f"><label>Power<span class="hint">1 - beta</span></label><input type="number" id="i-power" min="0.5" max="0.999" step="0.01" value="'+state.power+'" oninput="onPlanInput()" aria-label="Statistical power"></div>'
      + '</div>';
  } else if (activeMode === 'sequential'){
    html = '<div class="fields one">'
      + '<div class="f"><label>Interim looks K<span class="hint">how many times you peek, including the final analysis (1-10)</span></label><input type="number" id="i-looks" min="1" max="10" step="1" value="'+state.looks+'" oninput="onSeqInput()" aria-label="Number of interim looks"></div>'
      + '</div>';
  } else {
    html = '<div class="fields two">'
      + '<div class="f"><label>Arm A visitors</label><input type="number" id="i-na" min="1" step="1" value="'+state.n_a+'" oninput="onAnalyzeInput()" aria-label="Visitors in arm A"></div>'
      + '<div class="f"><label>Arm A conversions</label><input type="number" id="i-ca" min="0" step="1" value="'+state.conv_a+'" oninput="onAnalyzeInput()" aria-label="Conversions in arm A"></div>'
      + '<div class="f"><label>Arm B visitors</label><input type="number" id="i-nb" min="1" step="1" value="'+state.n_b+'" oninput="onAnalyzeInput()" aria-label="Visitors in arm B"></div>'
      + '<div class="f"><label>Arm B conversions</label><input type="number" id="i-cb" min="0" step="1" value="'+state.conv_b+'" oninput="onAnalyzeInput()" aria-label="Conversions in arm B"></div>'
      + '</div>';
  }
  $('mode-inputs').innerHTML = html;
}
function setErr(msg){
  const e = $('ierr'); if (!e) return;
  if (msg){ e.textContent = msg; e.classList.add('show'); } else { e.classList.remove('show'); }
}
function onPlanInput(){
  const b = parseFloat($('i-baseline').value);
  const m = parseFloat($('i-mde').value);
  const p = parseFloat($('i-power').value);
  if (isFinite(b) && b > 0 && b < 1) state.baseline = b;
  if (isFinite(m) && m > 0) state.mde = m;
  if (isFinite(p) && p > 0 && p < 1) state.power = p;
  setErr((state.baseline + state.mde >= 1) ? 'Baseline + MDE reaches 100%. Lower one so the target rate stays below 1.' : '');
  state.vizBaseline = state.baseline; state.vizMde = state.mde;
  renderIwant(); recompute();
}
function onSeqInput(){
  const k = parseInt($('i-looks').value, 10);
  if (isFinite(k) && k >= 1) state.looks = Math.max(1, Math.min(10, k));
  setErr('');
  renderIwant(); recompute();
}
function onAnalyzeInput(){
  const na = parseInt($('i-na').value, 10);
  const ca = parseInt($('i-ca').value, 10);
  const nb = parseInt($('i-nb').value, 10);
  const cb = parseInt($('i-cb').value, 10);
  if (isFinite(na) && na > 0) state.n_a = na;
  if (isFinite(ca) && ca >= 0) state.conv_a = ca;
  if (isFinite(nb) && nb > 0) state.n_b = nb;
  if (isFinite(cb) && cb >= 0) state.conv_b = cb;
  let err = '';
  if (state.conv_a > state.n_a || state.conv_b > state.n_b) err = 'Conversions cannot exceed visitors. Check the arm where conversions are larger than n.';
  setErr(err);
  renderIwant();
  if (!err) recompute();
}

// Top-level switches
function setMode(m){
  activeMode = m;
  document.querySelectorAll('.mode').forEach(function(b){ b.classList.toggle('on', b.dataset.mode === m); });
  setErr('');
  renderAll();
}
function setFraming(f){
  activeFraming = f;
  document.querySelectorAll('.pill.fr').forEach(function(b){ b.classList.toggle('on', b.dataset.framing === f); });
  renderAll();
}
function setAlpha(a){
  state.alpha = a; state.vizAlpha = a;
  document.querySelectorAll('.pill.a').forEach(function(b){ b.classList.toggle('on', parseFloat(b.dataset.a) === a); });
  renderIwant(); recompute();
}
function setTail(t){
  state.tail = t;
  document.querySelectorAll('.pill.t').forEach(function(b){ b.classList.toggle('on', parseInt(b.dataset.t,10) === t); });
  recompute();
}
function renderAll(){
  syncControlVisibility();
  renderInputs();
  renderIwant();
  renderMethodNote();
  renderVizSliders();
  recompute();
}

// Compute + render
function setStats(items){
  const g = $('stats'); if (!g) return;
  g.innerHTML = items.map(function(s){
    return '<div class="st"><div class="k">'+s.k+'</div><div class="v'+(s.acc?' acc':'')+'">'+s.v+'</div></div>';
  }).join('');
}
function setChip(text, na){
  const c = $('vchip'); if (!c) return;
  c.innerHTML = text; c.classList.toggle('na', !!na);
}
function pTxtOf(p){ return p < 0.0001 ? '&lt;0.0001' : p.toFixed(4); }

function recompute(){
  let headline = '', vsub = '', report = '', rcode = '', howRows = [];

  if (activeMode === 'plan'){
    const p1 = state.baseline;
    const p2 = Math.min(0.9999, Math.max(0.0001, p1 + state.mde));
    const n = sampleSizeTwoProp(p1, p2, state.alpha, state.power, state.tail);
    const tailWord = state.tail === 2 ? 'two-sided' : 'one-sided';
    if (!isFinite(n)){
      setChip('PLANNING', true); headline = '-'; vsub = 'Inputs incomplete or implied target rate out of (0,1).';
      setStats([{k:'n per arm',v:'-'}]);
      report = 'Sample size: inputs incomplete.';
    } else {
      const h = Math.abs(2 * (Math.asin(Math.sqrt(p2)) - Math.asin(Math.sqrt(p1))));
      const zA = qnorm(1 - state.alpha/state.tail);
      const zB = qnorm(state.power);
      setChip('PLANNING', true);
      headline = 'n = ' + fmtNum(n);
      vsub = 'per arm, ' + fmtNum(n*2) + ' total, to detect ' + fmtPct(p1,2) + ' to ' + fmtPct(p2,2) + ' (+' + (state.mde*100).toFixed(2) + 'pp)';
      setStats([
        {k:'n per arm', v:fmtNum(n), acc:true},
        {k:'total n', v:fmtNum(n*2)},
        {k:"Cohen's h", v:h.toFixed(3)},
        {k:'alpha', v:fmt(state.alpha,3)},
        {k:'power', v:fmt(state.power,2)}
      ]);
      howRows = [
        {k:'p1, p2', v:fmtPct(p1,2)+', '+fmtPct(p2,2)},
        {k:'h', v:'|2(asin sqrt(p2) - asin sqrt(p1))| = '+h.toFixed(4)},
        {k:'z_alpha', v:'qnorm(1 - '+state.alpha+'/'+state.tail+') = '+zA.toFixed(3)},
        {k:'z_beta', v:'qnorm('+state.power+') = '+zB.toFixed(3)},
        {k:'n', v:'~ 2(z_alpha + z_beta)^2 / h^2 = '+fmtNum(n)+' (pwr.2p.test solves the exact equation)'}
      ];
      report = 'Sample size (two-proportion z-test, pwr.2p.test): n = '+fmtNum(n)+' per arm ('+fmtNum(n*2)+' total) to detect '+fmtPct(p1,2)+' -> '+fmtPct(p2,2)+' (+'+(state.mde*100).toFixed(2)+'pp) at alpha='+fmt(state.alpha,3)+' ('+tailWord+'), power='+fmt(state.power,2)+'.';
    }
    rcode = buildRCodePlan(p1, p2, state.alpha, state.power, state.tail);

  } else if (activeMode === 'sequential'){
    const info = pocockInfo(state.looks, state.alpha);
    const K = info.K, cK = info.ck, nominal = info.nominal;
    const naive = state.tail === 1 ? qnorm(1 - state.alpha) : qnorm(1 - state.alpha/2);
    setChip('SEQUENTIAL', true);
    headline = '|z| &gt; ' + cK.toFixed(3);
    vsub = 'per-look nominal alpha = ' + nominal.toFixed(4) + ', overall alpha held at ' + fmt(state.alpha,3) + ' across ' + K + ' look' + (K>1?'s':'');
    setStats([
      {k:'Pocock c_K', v:cK.toFixed(3), acc:true},
      {k:'per-look alpha', v:nominal.toFixed(4)},
      {k:'naive cutoff', v:naive.toFixed(3)},
      {k:'looks K', v:String(K)}
    ]);
    howRows = [
      {k:'looks K', v:K+' equally spaced interim analyses'},
      {k:'Pocock c_K', v:cK.toFixed(3)+' (constant boundary; Jennison & Turnbull 2000, Table 2.1)'},
      {k:'per-look alpha', v:'2(1 - Phi('+cK.toFixed(3)+')) = '+nominal.toFixed(4)},
      {k:'naive boundary', v:naive.toFixed(3)+' - using this at every look would inflate the real false-positive rate'}
    ];
    report = 'Pocock group-sequential design (K='+K+' looks, overall alpha='+fmt(state.alpha,3)+'): declare significance only if |z| > '+cK.toFixed(3)+' at any look; per-look nominal alpha = '+nominal.toFixed(4)+'.';
    rcode = buildRCodeSequential(K, state.alpha, cK, nominal, naive);

  } else {
    const f = twoPropTest(state.conv_a, state.n_a, state.conv_b, state.n_b, state.alpha, state.tail);
    let b = null;
    if (activeFraming !== 'freq') b = bayesAnalysis(state.conv_a, state.n_a, state.conv_b, state.n_b, {a:1,b:1});
    const sig = f.p < state.alpha;
    const liftTxt = (f.diff>=0?'+':'') + (f.diff*100).toFixed(2) + 'pp';
    const ciTxt = '['+(f.ciLow*100).toFixed(2)+', '+(f.ciHigh*100).toFixed(2)+']pp';
    const tailWord = state.tail === 2 ? 'two-sided' : 'one-sided';
    const dirVerdict = f.diff > 0 ? 'B beats A' : (f.diff < 0 ? 'A beats B' : 'No difference');

    if (activeFraming === 'freq'){
      setChip(sig ? ('p &lt; '+fmt(state.alpha,3)) : ('p &ge; '+fmt(state.alpha,3)), !sig);
      headline = sig ? dirVerdict : 'No significant difference';
      vsub = 'lift ' + liftTxt + ', z = ' + f.z.toFixed(3) + ', ' + Math.round(f.ciLevel*100) + '% CI ' + ciTxt;
      setStats([
        {k:'lift (abs)', v:liftTxt, acc:true},
        {k:'relative', v:(f.relDiff*100).toFixed(1)+'%'},
        {k:'z', v:f.z.toFixed(3)},
        {k:'p-value', v:pTxtOf(f.p), acc:true},
        {k:Math.round(f.ciLevel*100)+'% CI', v:ciTxt}
      ]);
      report = 'Two-proportion z-test (prop.test correct=FALSE): B '+fmtPct(f.p2,2)+' vs A '+fmtPct(f.p1,2)+', lift '+liftTxt+' ('+(f.relDiff*100).toFixed(1)+'% relative), z='+f.z.toFixed(3)+', p='+(f.p<0.0001?'<0.0001':f.p.toFixed(4))+' ('+tailWord+'); '+Math.round(f.ciLevel*100)+'% CI '+ciTxt+'.';
    } else if (activeFraming === 'bayes'){
      setChip('P(B&gt;A) = ' + (b.probBeatsA*100).toFixed(1) + '%', b.probBeatsA < 0.5);
      const word = b.probBeatsA >= 0.95 ? 'B very likely wins' : b.probBeatsA >= 0.80 ? 'B likely wins' : b.probBeatsA >= 0.50 ? 'B slightly favored' : 'A favored';
      headline = word;
      vsub = 'mean lift ' + (b.meanDiff>=0?'+':'') + (b.meanDiff*100).toFixed(2) + 'pp, 95% CrI [' + (b.ci025*100).toFixed(2) + ', ' + (b.ci975*100).toFixed(2) + ']pp';
      setStats([
        {k:'P(B>A)', v:(b.probBeatsA*100).toFixed(1)+'%', acc:true},
        {k:'mean lift', v:(b.meanDiff>=0?'+':'')+(b.meanDiff*100).toFixed(2)+'pp'},
        {k:'95% CrI', v:'['+(b.ci025*100).toFixed(2)+', '+(b.ci975*100).toFixed(2)+']'},
        {k:'BF10', v:isFinite(b.bf10)?b.bf10.toFixed(2):'-'}
      ]);
      report = 'Bayesian beta-binomial (Beta(1,1) prior): P(B>A)='+(b.probBeatsA*100).toFixed(1)+'%, mean lift '+(b.meanDiff>=0?'+':'')+(b.meanDiff*100).toFixed(2)+'pp, 95% credible interval ['+(b.ci025*100).toFixed(2)+', '+(b.ci975*100).toFixed(2)+']pp, BF10='+b.bf10.toFixed(3)+'.';
    } else {
      setChip(sig ? ('p &lt; '+fmt(state.alpha,3)) : ('p &ge; '+fmt(state.alpha,3)), !sig);
      headline = sig ? dirVerdict : 'No significant difference';
      vsub = 'lift ' + liftTxt + ', p = ' + (f.p<0.0001?'<0.0001':f.p.toFixed(4)) + ', P(B>A) = ' + (b.probBeatsA*100).toFixed(1) + '%';
      setStats([
        {k:'lift (abs)', v:liftTxt, acc:true},
        {k:'p-value', v:pTxtOf(f.p), acc:true},
        {k:Math.round(f.ciLevel*100)+'% CI', v:ciTxt},
        {k:'P(B>A)', v:(b.probBeatsA*100).toFixed(1)+'%', acc:true},
        {k:'BF10', v:isFinite(b.bf10)?b.bf10.toFixed(2):'-'}
      ]);
      report = 'A/B test (A '+state.conv_a+'/'+state.n_a+', B '+state.conv_b+'/'+state.n_b+'): lift '+liftTxt+'; frequentist z='+f.z.toFixed(3)+', p='+(f.p<0.0001?'<0.0001':f.p.toFixed(4))+', '+Math.round(f.ciLevel*100)+'% CI '+ciTxt+'; Bayesian P(B>A)='+(b.probBeatsA*100).toFixed(1)+'%, BF10='+b.bf10.toFixed(3)+'.';
    }
    howRows.push({k:'inputs', v:'A: '+state.conv_a+'/'+state.n_a+' ('+fmtPct(f.p1,2)+'); B: '+state.conv_b+'/'+state.n_b+' ('+fmtPct(f.p2,2)+')'});
    howRows.push({k:'lift', v:liftTxt+' absolute ('+(f.relDiff*100).toFixed(1)+'% relative)'});
    if (activeFraming !== 'bayes'){
      howRows.push({k:'z, p', v:'z = '+f.z.toFixed(3)+', p = '+(f.p<0.0001?'<0.0001':f.p.toFixed(4))+' ('+tailWord+')'});
      howRows.push({k:Math.round(f.ciLevel*100)+'% CI', v:ciTxt});
    }
    if (activeFraming !== 'freq'){
      howRows.push({k:'P(B>A)', v:(b.probBeatsA*100).toFixed(1)+'%'});
      howRows.push({k:'95% CrI', v:'['+(b.ci025*100).toFixed(2)+', '+(b.ci975*100).toFixed(2)+']pp'});
      if (isFinite(b.bf10)) howRows.push({k:'BF10', v:b.bf10.toFixed(3)});
    }
    rcode = buildRCodeAnalyze(state.conv_a, state.n_a, state.conv_b, state.n_b, state.alpha, state.tail, activeFraming);
  }

  $('vhead').innerHTML = headline;
  $('vsub').textContent = vsub;
  if ($('report')) $('report').textContent = report;
  $('howrows').innerHTML = howRows.map(function(r){
    return '<div class="hrow"><span class="hk">'+escapeHtml(r.k)+'</span><span class="hv">'+r.v+'</span></div>';
  }).join('');
  if ($('rcodepre')) $('rcodepre').textContent = rcode;
  drawViz();
  renderInference();
}

// Plain-English box + decisive inference line
function renderInference(){
  const box = $('plain'); const line = $('infline');
  let plain = '', inf = '';
  if (activeMode === 'plan'){
    const p1 = state.baseline;
    const p2 = Math.min(0.9999, Math.max(0.0001, p1 + state.mde));
    const n = sampleSizeTwoProp(p1, p2, state.alpha, state.power, state.tail);
    const tailWord = state.tail === 2 ? 'two-sided' : 'one-sided';
    if (!isFinite(n)){
      plain = 'Inputs do not yet imply a valid plan. Pick a baseline in (0,1), an MDE that lands the target rate in (0,1), and an alpha below 0.5.';
      inf = 'Adjust the inputs so the target rate stays inside (0, 1).';
    } else {
      plain = 'To detect a lift from <b>'+fmtPct(p1,2)+'</b> to <b>'+fmtPct(p2,2)+'</b> (+'+(state.mde*100).toFixed(2)+'pp) at alpha = <b>'+fmt(state.alpha,3)+'</b> ('+tailWord+') with <b>'+(state.power*100).toFixed(0)+'%</b> power, you need <b>n = '+fmtNum(n)+'</b> per arm (<b>'+fmtNum(n*2)+'</b> total). Halve the MDE and the sample roughly quadruples.';
      inf = 'You need <b>n = '+fmtNum(n)+'</b> per arm (<b>'+fmtNum(n*2)+'</b> total) for '+(state.power*100).toFixed(0)+'% power at alpha = '+fmt(state.alpha,3)+' ('+tailWord+').';
    }
  } else if (activeMode === 'sequential'){
    const info = pocockInfo(state.looks, state.alpha);
    const naive = state.tail === 1 ? qnorm(1 - state.alpha) : qnorm(1 - state.alpha/2);
    plain = 'With <b>'+info.K+'</b> interim look'+(info.K>1?'s':'')+' at an overall alpha of <b>'+fmt(state.alpha,3)+'</b>, declare a winner only when <span class="sig">|z| &gt; '+info.ck.toFixed(3)+'</span> at a look (per-look alpha = <b>'+info.nominal.toFixed(4)+'</b>). Using the naive <b>'+naive.toFixed(3)+'</b> cutoff at every peek would push your real false-positive rate <em>well above</em> '+fmt(state.alpha,3)+'.';
    inf = 'Cross only at <b>|z| &gt; '+info.ck.toFixed(3)+'</b> to hold overall alpha = '+fmt(state.alpha,3)+' across '+info.K+' look'+(info.K>1?'s':'')+'.';
  } else {
    const f = twoPropTest(state.conv_a, state.n_a, state.conv_b, state.n_b, state.alpha, state.tail);
    const b = (activeFraming !== 'freq') ? bayesAnalysis(state.conv_a, state.n_a, state.conv_b, state.n_b, {a:1,b:1}) : null;
    const direction = f.diff > 0 ? 'higher' : (f.diff < 0 ? 'lower' : 'identical to');
    const liftAbs = Math.abs(f.diff*100).toFixed(2);
    const sig = f.p < state.alpha;
    const vWord = sig ? 'is statistically significant' : 'is not statistically significant';
    const vCls = sig ? 'sig' : 'insig';
    const ciZero = f.ciLow <= 0 && f.ciHigh >= 0;
    const pDisp = f.p < 0.0001 ? '&lt;0.0001' : f.p.toFixed(4);
    if (activeFraming === 'freq'){
      plain = "B's rate of <b>"+fmtPct(f.p2,2)+'</b> is <b>'+liftAbs+'pp '+direction+'</b> than A\'s <b>'+fmtPct(f.p1,2)+'</b>. The difference <span class="'+vCls+'">'+vWord+'</span> at alpha = '+fmt(state.alpha,3)+' (p = <b>'+pDisp+'</b>); the '+Math.round((1-state.alpha)*100)+'% CI for the lift is <b>['+(f.ciLow*100).toFixed(2)+', '+(f.ciHigh*100).toFixed(2)+']pp</b>'+(ciZero?', which <em>includes zero</em>.':', which <em>excludes zero</em>.');
      inf = sig
        ? 'Since p = '+pDisp+' &lt; '+fmt(state.alpha,3)+', reject H0: B genuinely '+(f.diff>0?'beats':'differs from')+' A.'
        : 'Since p = '+pDisp+' &ge; '+fmt(state.alpha,3)+', do not reject H0: the lift is within chance.';
    } else if (activeFraming === 'bayes'){
      const probPct = (b.probBeatsA*100).toFixed(1);
      const probWord = b.probBeatsA >= 0.95 ? 'very likely' : b.probBeatsA >= 0.80 ? 'likely' : b.probBeatsA >= 0.50 ? 'slightly favored' : 'unlikely';
      plain = 'There is a <b>'+probPct+'%</b> probability that B beats A; the data make B <em>'+probWord+'</em> the better variant. The expected lift is <b>'+(b.meanDiff>=0?'+':'')+(b.meanDiff*100).toFixed(2)+'pp</b> with a 95% credible interval of <b>['+(b.ci025*100).toFixed(2)+', '+(b.ci975*100).toFixed(2)+']pp</b>'+(isFinite(b.bf10)?' (Bayes factor BF10 = <b>'+b.bf10.toFixed(2)+'</b>).':'.');
      const bfWord = !isFinite(b.bf10) ? '' : (b.bf10 >= 10 ? ', with strong evidence B and A truly differ' : b.bf10 <= 0.1 ? ', though the Bayes factor barely favors a real difference' : ', though the Bayes factor is not yet decisive');
      inf = 'P(B&gt;A) = <b>'+probPct+'%</b>, so B is '+probWord+' the better variant'+bfWord+'.';
    } else {
      const probPct = (b.probBeatsA*100).toFixed(1);
      plain = "B's rate of <b>"+fmtPct(f.p2,2)+'</b> is <b>'+liftAbs+'pp '+direction+'</b> than A\'s <b>'+fmtPct(f.p1,2)+'</b>. Frequentist: the difference <span class="'+vCls+'">'+vWord+'</span> (p = <b>'+pDisp+'</b>, '+Math.round((1-state.alpha)*100)+'% CI <b>['+(f.ciLow*100).toFixed(2)+', '+(f.ciHigh*100).toFixed(2)+']pp</b>). Bayesian: there is a <b>'+probPct+'%</b> probability that B beats A.';
      inf = sig
        ? 'Since p = '+pDisp+' &lt; '+fmt(state.alpha,3)+' and P(B&gt;A) = '+probPct+'%, both framings back B.'
        : 'Since p = '+pDisp+' &ge; '+fmt(state.alpha,3)+' (P(B&gt;A) = '+probPct+'%), the frequentist test is not yet decisive.';
    }
  }
  if (box) box.innerHTML = plain;
  if (line) line.innerHTML = inf;
}

// R code emitters (plain text, live)
function buildRCodePlan(p1, p2, alpha, power, tail){
  const tailStr = tail === 2 ? 'two.sided' : 'greater';
  return '# Sample size for a two-proportion z-test\n'
    + 'library(pwr)\n\n'
    + 'p1 <- ' + p1 + '        # baseline\n'
    + 'p2 <- ' + p2.toFixed(4) + '     # expected with treatment\n'
    + 'h  <- abs(ES.h(p1, p2))   # Cohen\'s h (magnitude)\n\n'
    + 'pwr.2p.test(h = h, sig.level = ' + alpha + ', power = ' + power + ',\n'
    + '            alternative = "' + tailStr + '")';
}
function buildRCodeAnalyze(c1, n1, c2, n2, alpha, tail, framing){
  const altStr = tail === 2 ? 'two.sided' : 'greater';
  const freq = '# Two-proportion z-test (B first: estimate = p_b - p_a)\n'
    + 'prop.test(x = c(' + c2 + ', ' + c1 + '),   # conversions: B, A\n'
    + '          n = c(' + n2 + ', ' + n1 + '),   # visitors:    B, A\n'
    + '          conf.level = ' + (1-alpha).toFixed(3) + ', alternative = "' + altStr + '",\n'
    + '          correct = FALSE)';
  const a1 = 1+c1, b1 = 1+n1-c1, a2 = 1+c2, b2 = 1+n2-c2;
  const bayes = '# Bayesian beta-binomial conjugate, Beta(1,1) prior (deterministic)\n'
    + 'a1 <- ' + a1 + '; b1 <- ' + b1 + '   # posterior A ~ Beta(a1, b1)\n'
    + 'a2 <- ' + a2 + '; b2 <- ' + b2 + '   # posterior B ~ Beta(a2, b2)\n\n'
    + '# P(B > A) by numerical integration\n'
    + 'integrate(function(x) dbeta(x, a2, b2) * pbeta(x, a1, b1), 0, 1)$value\n\n'
    + '# 95% credible interval for the lift p_b - p_a\n'
    + 'cdf <- function(d) integrate(function(a)\n'
    + '  dbeta(a, a1, b1) * pbeta(pmin(pmax(a + d, 0), 1), a2, b2), 0, 1)$value\n'
    + 'c(lo = uniroot(function(d) cdf(d) - 0.025, c(-1, 1))$root,\n'
    + '  hi = uniroot(function(d) cdf(d) - 0.975, c(-1, 1))$root)\n\n'
    + '# Bayes factor BF10 (rates differ vs equal), closed form\n'
    + 'exp(lbeta(a1, b1) + lbeta(a2, b2) - lbeta(1, 1) -\n'
    + '    lbeta(' + (1+c1+c2) + ', ' + (1+n1+n2-c1-c2) + '))';
  if (framing === 'freq')  return freq;
  if (framing === 'bayes') return bayes;
  return freq + '\n\n' + bayes;
}
function buildRCodeSequential(K, alpha, cK, nominal, naive){
  return '# Pocock group-sequential boundary (constant across looks)\n'
    + '# c_K from Jennison & Turnbull (2000), Group Sequential Methods, Table 2.1\n'
    + 'K   <- ' + K + '          # interim looks, including the final one\n'
    + 'c_K <- ' + cK + '   # overall alpha = ' + fmt(alpha,3) + '\n\n'
    + '# per-look two-sided nominal alpha\n'
    + '2 * (1 - pnorm(c_K))            # = ' + nominal.toFixed(4) + '\n\n'
    + '# decision: at look j (1..K), declare significance only if |z_j| > c_K,\n'
    + '# not the naive ' + naive.toFixed(3) + ' boundary you would use for a single test.';
}

// Interactive viz
const VIZ_SLIDERS = function(){
  if (activeMode === 'sequential'){
    return [{key:'looks', sym:'K', label:'interim looks', min:1, max:10, step:1, decimals:0}];
  }
  return [
    {key:'vizAlpha',    sym:'&alpha;', label:'level',    min:0.001, max:0.20, step:0.001, decimals:3},
    {key:'vizBaseline', sym:'p1',      label:'baseline', min:0.001, max:0.50, step:0.001, decimals:3},
    {key:'vizMde',      sym:'MDE',     label:'lift',     min:0.001, max:0.20, step:0.001, decimals:3}
  ];
};
function renderVizSliders(){
  const container = $('vizsliders'); if (!container) return;
  container.innerHTML = VIZ_SLIDERS().map(function(inp){
    const val = state[inp.key];
    return '<div class="viz-slider-row"><label><span class="vsym">'+inp.sym+'</span>'+(inp.label||'')+'</label>'
      + '<input type="range" min="'+inp.min+'" max="'+inp.max+'" step="'+inp.step+'" value="'+val+'" oninput="onVizSlide(\''+inp.key+'\', this.value)" aria-label="'+inp.label+'">'
      + '<span class="vval" id="viz-val-'+inp.key+'">'+fmtViz(val, inp.decimals)+'</span></div>';
  }).join('');
}
function onVizSlide(key, val){
  const v = +val;
  if (key === 'looks'){
    state.looks = Math.max(1, Math.min(10, Math.round(v)));
    if ($('i-looks')) $('i-looks').value = state.looks;
    const el = $('viz-val-looks'); if (el) el.textContent = String(state.looks);
    renderIwant(); recompute(); return;
  }
  state[key] = v;
  if (key === 'vizAlpha'){
    state.alpha = v;
    document.querySelectorAll('.pill.a').forEach(function(b){ b.classList.remove('on'); });
  }
  if (key === 'vizBaseline' && activeMode === 'plan'){ state.baseline = v; if ($('i-baseline')) $('i-baseline').value = v; }
  if (key === 'vizMde' && activeMode === 'plan'){ state.mde = v; if ($('i-mde')) $('i-mde').value = v; }
  const inp = VIZ_SLIDERS().find(function(i){ return i.key===key; });
  if (inp){ const el = $('viz-val-'+key); if (el) el.textContent = fmtViz(v, inp.decimals); }
  renderIwant(); recompute();
}
function drawViz(){
  const svg = $('curve'); if (!svg) return;
  const W = 360, H = 200, ml = 36, mr = 12, mt = 14, mb = 38;
  const plotW = W - ml - mr, plotH = H - mt - mb;
  let body = '', caption = '', readout = '';

  if (activeMode === 'plan'){
    const p1 = state.vizBaseline;
    const xVals = [], yVals = [];
    const xMin = 0.002, xMax = Math.max(0.05, state.vizMde * 2.5), N = 50;
    for (let i=0;i<N;i++){
      const mde = xMin + (xMax-xMin)*(i/(N-1));
      const p2 = Math.min(0.9999, p1 + mde);
      const n = sampleSizeTwoProp(p1, p2, state.vizAlpha, state.power || 0.8, state.tail);
      if (isFinite(n) && n < 1e6){ xVals.push(mde); yVals.push(Math.log10(Math.max(1, n))); }
    }
    if (xVals.length === 0){
      svg.innerHTML = '<text x="'+(W/2)+'" y="'+(H/2)+'" text-anchor="middle">adjust inputs to draw curve</text>';
      $('vizcap').textContent = ''; $('vizread').innerHTML = ''; return;
    }
    const yMin = Math.min.apply(null, yVals), yMax = Math.max.apply(null, yVals);
    const tx = function(m){ return ml + ((m - xMin)/(xMax - xMin))*plotW; };
    const ty = function(ly){ return mt + plotH - ((ly - yMin)/Math.max(0.01, (yMax-yMin)))*plotH; };
    let path = '';
    for (let i=0;i<xVals.length;i++){ path += (i===0?'M':'L') + tx(xVals[i]).toFixed(1) + ',' + ty(yVals[i]).toFixed(1) + ' '; }
    const curMde = state.vizMde;
    const curP2 = Math.min(0.9999, p1 + curMde);
    const curN = sampleSizeTwoProp(p1, curP2, state.vizAlpha, state.power || 0.8, state.tail);
    const cx = tx(Math.max(xMin, Math.min(xMax, curMde)));
    const cy = ty(Math.log10(Math.max(1, curN)));
    body = '<line class="ax" x1="'+ml+'" y1="'+(mt+plotH).toFixed(1)+'" x2="'+(W-mr).toFixed(1)+'" y2="'+(mt+plotH).toFixed(1)+'"/>'
      + '<line class="ax" x1="'+ml+'" y1="'+mt+'" x2="'+ml+'" y2="'+(mt+plotH).toFixed(1)+'"/>'
      + '<path d="'+path+'" class="density"/>'
      + '<circle cx="'+cx.toFixed(1)+'" cy="'+cy.toFixed(1)+'" r="4" fill="var(--c-warn)" stroke="var(--c-surface)" stroke-width="1.5"/>'
      + '<text x="'+(ml+plotW/2).toFixed(1)+'" y="'+(H-6)+'" text-anchor="middle" style="font-style:italic">MDE (absolute lift)</text>'
      + '<text x="'+(ml-4)+'" y="'+(mt+8).toFixed(1)+'" text-anchor="end">log10 n</text>';
    caption = 'Sample size vs minimum detectable lift (log scale).';
    readout = 'p1 = <b>'+fmtPct(p1,2)+'</b> &middot; MDE = <b>+'+fmtPct(curMde,2)+'</b> &middot; n per arm = <b>'+fmtNum(curN)+'</b>';

  } else if (activeMode === 'sequential'){
    const info = pocockInfo(state.looks, state.alpha);
    const K = info.K, cK = info.ck, nominal = info.nominal;
    const naive = state.tail === 1 ? qnorm(1 - state.alpha) : qnorm(1 - state.alpha/2);
    const yMax = Math.max(3.8, cK + 0.5);
    const xAt = function(j){ return ml + (K === 1 ? plotW/2 : ((j-1)/(K-1))*plotW); };
    const yAt = function(z){ return mt + plotH - (z/yMax)*plotH; };
    let dots = '';
    for (let j=1;j<=K;j++){ dots += '<circle cx="'+xAt(j).toFixed(1)+'" cy="'+yAt(cK).toFixed(1)+'" r="3.5" fill="var(--c-accent)" stroke="var(--c-surface)" stroke-width="1.3"/>'; }
    body = '<line class="ax" x1="'+ml+'" y1="'+(mt+plotH).toFixed(1)+'" x2="'+(W-mr).toFixed(1)+'" y2="'+(mt+plotH).toFixed(1)+'"/>'
      + '<line class="ax" x1="'+ml+'" y1="'+mt+'" x2="'+ml+'" y2="'+(mt+plotH).toFixed(1)+'"/>'
      + '<line x1="'+ml+'" y1="'+yAt(naive).toFixed(1)+'" x2="'+(W-mr).toFixed(1)+'" y2="'+yAt(naive).toFixed(1)+'" stroke="var(--c-danger)" stroke-width="1.4" stroke-dasharray="4 3"/>'
      + '<line x1="'+ml+'" y1="'+yAt(cK).toFixed(1)+'" x2="'+(W-mr).toFixed(1)+'" y2="'+yAt(cK).toFixed(1)+'" stroke="var(--c-accent)" stroke-width="2"/>'
      + dots
      + '<text x="'+(W-mr-2).toFixed(1)+'" y="'+(yAt(cK)-4).toFixed(1)+'" text-anchor="end" fill="var(--c-accent)">Pocock '+cK.toFixed(2)+'</text>'
      + '<text x="'+(W-mr-2).toFixed(1)+'" y="'+(yAt(naive)+12).toFixed(1)+'" text-anchor="end" fill="var(--c-danger)">naive '+naive.toFixed(2)+'</text>'
      + '<text x="'+(ml+plotW/2).toFixed(1)+'" y="'+(H-6)+'" text-anchor="middle" style="font-style:italic">interim look (1 to '+K+')</text>'
      + '<text x="'+(ml-4)+'" y="'+(mt+8).toFixed(1)+'" text-anchor="end">|z|</text>';
    caption = 'The bar you must clear at each look: Pocock (raised) vs a naive single-test cutoff.';
    readout = 'K = <b>'+K+'</b> &middot; per-look nominal &alpha; = <b>'+nominal.toFixed(4)+'</b> &middot; boundary |z| &gt; <b>'+cK.toFixed(3)+'</b>';

  } else if (activeFraming === 'freq'){
    const f = twoPropTest(state.conv_a, state.n_a, state.conv_b, state.n_b, state.vizAlpha, state.tail);
    const xMin = -4, xMax = 4;
    const tx = function(x){ return ml + ((x - xMin)/(xMax - xMin))*plotW; };
    const yMaxD = dnorm(0);
    const ty = function(y){ return mt + plotH - (y/yMaxD)*plotH * 0.95; };
    const N = 54; let pathD = ''; let pts = [];
    for (let i=0;i<N;i++){
      const x = xMin + (xMax-xMin)*(i/(N-1));
      const y = dnorm(x);
      pathD += (i===0?'M':'L') + tx(x).toFixed(1) + ',' + ty(y).toFixed(1) + ' ';
      pts.push([x,y]);
    }
    const zAbs = Math.abs(f.z);
    let leftTail = 'M ' + tx(xMin).toFixed(1) + ' ' + (mt+plotH).toFixed(1) + ' ';
    for (let i=0;i<pts.length;i++){ if (pts[i][0] <= -zAbs) leftTail += 'L ' + tx(pts[i][0]).toFixed(1) + ' ' + ty(pts[i][1]).toFixed(1) + ' '; }
    leftTail += 'L ' + tx(-zAbs).toFixed(1) + ' ' + (mt+plotH).toFixed(1) + ' Z';
    let rightTail = 'M ' + tx(zAbs).toFixed(1) + ' ' + (mt+plotH).toFixed(1) + ' ';
    for (let i=0;i<pts.length;i++){ if (pts[i][0] >= zAbs) rightTail += 'L ' + tx(pts[i][0]).toFixed(1) + ' ' + ty(pts[i][1]).toFixed(1) + ' '; }
    rightTail += 'L ' + tx(xMax).toFixed(1) + ' ' + (mt+plotH).toFixed(1) + ' Z';
    body = '<line class="ax" x1="'+ml+'" y1="'+(mt+plotH).toFixed(1)+'" x2="'+(W-mr).toFixed(1)+'" y2="'+(mt+plotH).toFixed(1)+'"/>'
      + '<path d="'+leftTail+'" class="density-fill"/>'
      + '<path d="'+rightTail+'" class="density-fill"/>'
      + '<path d="'+pathD+'" class="density"/>'
      + '<line class="zero-ref" x1="'+tx(f.z).toFixed(1)+'" y1="'+mt+'" x2="'+tx(f.z).toFixed(1)+'" y2="'+(mt+plotH).toFixed(1)+'"/>'
      + '<text x="'+tx(f.z).toFixed(1)+'" y="'+(mt-2)+'" text-anchor="middle" fill="var(--c-accent)">z = '+f.z.toFixed(2)+'</text>'
      + '<text x="'+(ml+plotW/2).toFixed(1)+'" y="'+(H-6)+'" text-anchor="middle" style="font-style:italic">z under H0 ~ N(0, 1)</text>';
    caption = 'Sampling distribution of z under H0; shaded = p-value tails.';
    readout = 'lift = <b>'+(f.diff*100).toFixed(2)+'pp</b> &middot; z = <b>'+f.z.toFixed(3)+'</b> &middot; p = <b>'+(f.p < 0.0001 ? '&lt;0.0001' : f.p.toFixed(4))+'</b>';

  } else {
    const a1 = 1 + state.conv_a, b1 = 1 + state.n_a - state.conv_a;
    const a2 = 1 + state.conv_b, b2 = 1 + state.n_b - state.conv_b;
    const pHatA = state.conv_a / Math.max(1, state.n_a);
    const pHatB = state.conv_b / Math.max(1, state.n_b);
    const center = (pHatA + pHatB) / 2;
    const spread = 6*Math.sqrt(Math.max(1e-9, center*(1-center))/Math.max(1,(state.n_a+state.n_b)/2));
    const xMin = Math.max(0, center - spread);
    const xMax = Math.min(1, center + spread);
    const tx = function(x){ return ml + ((x - xMin)/Math.max(1e-9,(xMax - xMin)))*plotW; };
    const N = 54; let dA = [], dB = []; let yMaxD = 0;
    for (let i=0;i<N;i++){
      const x = xMin + (xMax-xMin)*(i/(N-1));
      const ya = dbeta(x, a1, b1), yb = dbeta(x, a2, b2);
      yMaxD = Math.max(yMaxD, ya, yb);
      dA.push([x, ya]); dB.push([x, yb]);
    }
    const ty = function(y){ return mt + plotH - (y/Math.max(1e-9, yMaxD))*plotH * 0.95; };
    const pathOf = function(arr){ return arr.map(function(pr,i){ return (i===0?'M':'L') + tx(pr[0]).toFixed(1) + ',' + ty(pr[1]).toFixed(1); }).join(' '); };
    body = '<line class="ax" x1="'+ml+'" y1="'+(mt+plotH).toFixed(1)+'" x2="'+(W-mr).toFixed(1)+'" y2="'+(mt+plotH).toFixed(1)+'"/>'
      + '<path d="'+pathOf(dA)+'" class="density"/>'
      + '<path d="'+pathOf(dB)+'" class="density-b"/>'
      + '<line x1="'+tx(pHatA).toFixed(1)+'" y1="'+(mt+plotH-3).toFixed(1)+'" x2="'+tx(pHatA).toFixed(1)+'" y2="'+(mt+plotH+3).toFixed(1)+'" stroke="var(--c-accent)"/>'
      + '<line x1="'+tx(pHatB).toFixed(1)+'" y1="'+(mt+plotH-3).toFixed(1)+'" x2="'+tx(pHatB).toFixed(1)+'" y2="'+(mt+plotH+3).toFixed(1)+'" stroke="var(--c-success)"/>'
      + '<text x="'+tx(pHatA).toFixed(1)+'" y="'+(mt+10)+'" text-anchor="middle" fill="var(--c-accent)">A</text>'
      + '<text x="'+tx(pHatB).toFixed(1)+'" y="'+(mt+10)+'" text-anchor="middle" fill="var(--c-success)">B</text>'
      + '<text x="'+ml+'" y="'+(mt+plotH+14).toFixed(1)+'" text-anchor="start">'+fmtPct(xMin,2)+'</text>'
      + '<text x="'+(W-mr).toFixed(1)+'" y="'+(mt+plotH+14).toFixed(1)+'" text-anchor="end">'+fmtPct(xMax,2)+'</text>'
      + '<text x="'+(ml+plotW/2).toFixed(1)+'" y="'+(H-6)+'" text-anchor="middle" style="font-style:italic">conversion rate (A blue, B green)</text>';
    const b = bayesAnalysis(state.conv_a, state.n_a, state.conv_b, state.n_b, {a:1,b:1});
    caption = 'Beta posteriors for each arm; tick marks at observed rates.';
    readout = 'P(B &gt; A) = <b>'+(b.probBeatsA*100).toFixed(1)+'%</b> &middot; mean lift = <b>'+(b.meanDiff*100).toFixed(2)+'pp</b> &middot; 95% CrI = <b>['+(b.ci025*100).toFixed(2)+', '+(b.ci975*100).toFixed(2)+']pp</b>';
  }

  svg.innerHTML = body;
  $('vizcap').textContent = caption;
  $('vizread').innerHTML = readout;
}

// Scenarios
const SCENARIOS = {
  plan2arm: { name:'Plan a 2-arm test', mode:'plan', framing:'freq',
    set: function(){ state.baseline=0.10; state.mde=0.01; state.power=0.80; state.alpha=0.05; state.tail=2; },
    story:'Baseline conversion is 10%. Want 80% power to detect a +1pp absolute lift at alpha = 0.05.' },
  analyze: { name:'Analyze a finished test', mode:'analyze', framing:'both',
    set: function(){ state.n_a=1000; state.conv_a=120; state.n_b=1000; state.conv_b=144; state.alpha=0.05; state.tail=2; },
    story:'A converted 120/1000 = 12%; B converted 144/1000 = 14.4%. Both framings shown.' },
  bayesonly: { name:'Bayesian only', mode:'analyze', framing:'bayes',
    set: function(){ state.n_a=500; state.conv_a=50; state.n_b=500; state.conv_b=65; state.alpha=0.05; state.tail=2; },
    story:'Same shape, smaller sample. Beta(1,1) prior, focus on P(B>A) and the credible interval.' },
  sequential: { name:'Sequential look', mode:'sequential', framing:'freq',
    set: function(){ state.looks=3; state.alpha=0.05; state.tail=2; },
    story:'You want to peek 3 times at alpha = 0.05. The Pocock boundary raises the per-look bar to |z| > 2.289 (per-look alpha near 0.022).' },
  longtail: { name:'Long-tail conversion', mode:'analyze', framing:'both',
    set: function(){ state.n_a=1000; state.conv_a=1; state.n_b=1000; state.conv_b=5; state.alpha=0.05; state.tail=2; },
    story:'Rare events: 1/1000 vs 5/1000. Small absolute lift (+0.4pp), large relative.' },
  custom: { name:'Custom', mode:'analyze', framing:'both',
    set: function(){}, story:'Edit any input above to explore your own scenario.' }
};
function loadScenario(key){
  const s = SCENARIOS[key]; if (!s) return;
  s.set();
  state.vizBaseline = state.baseline; state.vizMde = state.mde; state.vizAlpha = state.alpha;
  activeMode = s.mode; activeFraming = s.framing;
  setErr('');
  document.querySelectorAll('.chip').forEach(function(c){ c.classList.toggle('on', c.dataset.scenario === key); });
  document.querySelectorAll('.mode').forEach(function(b){ b.classList.toggle('on', b.dataset.mode === activeMode); });
  document.querySelectorAll('.pill.fr').forEach(function(b){ b.classList.toggle('on', b.dataset.framing === activeFraming); });
  document.querySelectorAll('.pill.a').forEach(function(b){ b.classList.toggle('on', parseFloat(b.dataset.a) === state.alpha); });
  document.querySelectorAll('.pill.t').forEach(function(b){ b.classList.toggle('on', parseInt(b.dataset.t,10) === state.tail); });
  if ($('scstory')) $('scstory').innerHTML = key === 'custom' ? '' : ('<b>' + escapeHtml(s.name) + '.</b> ' + escapeHtml(s.story));
  renderAll();
}

function toast(msg){
  const t = document.createElement('div'); t.className='toast'; t.textContent=msg;
  $('toast-area').appendChild(t); setTimeout(function(){ t.remove(); }, 2600);
}
