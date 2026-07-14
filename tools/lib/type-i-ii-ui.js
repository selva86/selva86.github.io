/* type-i-ii-ui.js - UI + render layer for the Type I / II error visualizer.
   Compute is delegated to window.TypeIIMath (tools/lib/type-i-ii-math.js),
   which composes tools/lib/power-math.js (R pwr ground truth). Loaded as a
   classic script so its top-level functions are the global handlers the
   markup references (setTest, setEffect, onSlide, loadScenario, ...). The
   tool_use/tool_copy GA wiring + boot stay inline on the page. */
"use strict";
var T2 = window.TypeIIMath;
function $(id){ return document.getElementById(id); }
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
function fmt(x, d){ if (!isFinite(x)) return String(x); d = (d==null)?3:d; return Number(x).toFixed(d); }
function fmtN(n){ return isFinite(n) ? Math.round(n).toLocaleString() : '-'; }
function fmtPct(x){ return isFinite(x) ? (x*100).toFixed(1) + '%' : '-'; }

// ---- registry ----
var TESTS = [
  {key:'twoT',        name:'two-sample t-test',   short:'Two-sample t',    effectSym:'d'},
  {key:'oneT',        name:'one-sample t-test',   short:'One-sample t',    effectSym:'d'},
  {key:'oneProp',     name:'one-proportion test', short:'One proportion',  effectSym:'h'},
  {key:'twoProp',     name:'two-proportion test', short:'Two proportions', effectSym:'h'},
  {key:'anova',       name:'one-way ANOVA',       short:'One-way ANOVA',   effectSym:'f'},
  {key:'correlation', name:'correlation test',    short:'Correlation',     effectSym:'r'}
];
var METHOD = {
  twoT:        {use:'A numeric outcome measured in two independent groups; test whether the population means differ (equal n per arm assumed for the picture).', eg:'Treatment vs placebo on a continuous score, n = 30 per arm.'},
  oneT:        {use:'One numeric variable on a sample; test whether the population mean differs from a known reference value mu0.', eg:'A class averaged 72; is the true mean different from the historical 68?'},
  oneProp:     {use:'A yes/no outcome on one sample; test whether the rate differs from a fixed reference proportion p0.', eg:'A vendor claims a 3% defect rate; you observed 8%.'},
  twoProp:     {use:'Two independent yes/no rates (an A/B test); test whether the rates differ.', eg:'Conversion 12% (A) vs 15% (B), n per arm.'},
  anova:       {use:'The means of k groups compared at once (one-way ANOVA), equal n per group.', eg:'Four ad variants; mean conversions per variant, k = 4.'},
  correlation: {use:'Two numeric variables on a sample; test whether the population correlation differs from zero (Pearson).', eg:'Height vs weight in n = 30 adults; can we detect r = 0.4?'}
};

// ---- per-test state ----
var state = {
  twoT:        {effect:0.5,  n:30, alpha:0.05, tail:2},
  oneT:        {effect:0.5,  n:30, alpha:0.05, tail:2},
  oneProp:     {p0:0.50, p1:0.65, n:30, alpha:0.05, tail:2},
  twoProp:     {p1:0.50, p2:0.65, n:30, alpha:0.05, tail:2},
  anova:       {effect:0.25, k:4, n:30, alpha:0.05, tail:1},
  correlation: {effect:0.30, n:30, alpha:0.05, tail:2}
};
var activeTest = 'twoT';
var quietScn = false;   // set during loadScenario so setters don't clear chips

function nLabel(t){ return (t==='twoT'||t==='twoProp'||t==='anova') ? 'per group' : ''; }
function compute(){ return T2.compute(activeTest, state[activeTest]); }

// ---- banner ----
function renderBanner(){
  var el = $('iwant'); if (!el) return;
  var s = state[activeTest];
  var t = TESTS.filter(function(x){return x.key===activeTest;})[0];
  var opts = TESTS.map(function(x){
    return '<option value="'+x.key+'"'+(x.key===activeTest?' selected':'')+'>'+escapeHtml(x.name)+'</option>';
  }).join('');
  var effTxt;
  if (activeTest==='oneProp')      effTxt = 'h = '+fmt(T2.compute('oneProp',s).effectVal,2)+' (p0='+fmt(s.p0,2)+', p1='+fmt(s.p1,2)+')';
  else if (activeTest==='twoProp') effTxt = 'h = '+fmt(T2.compute('twoProp',s).effectVal,2)+' (p1='+fmt(s.p1,2)+', p2='+fmt(s.p2,2)+')';
  else                             effTxt = escapeHtml(t.effectSym)+' = '+fmt(s.effect,2);
  var nl = nLabel(activeTest);
  var nStr = 'n = '+fmtN(s.n)+(nl?'/'+nl.replace('per ',''):'');
  el.innerHTML = 'I want to visualize errors for a '+
    '<span class="psel">'+escapeHtml(t.name)+'<span class="pcaret">&#9662;</span>'+
    '<select onchange="setTest(this.value)" aria-label="Choose test">'+opts+'</select></span>'+
    ' with <span class="pv">'+effTxt+'</span>, <span class="pv">'+nStr+'</span>, '+
    '<span class="pv">&alpha; = '+fmt(s.alpha,3)+'</span>.';
}

// ---- model note ----
function renderModelNote(){
  var m = METHOD[activeTest];
  $('modelnote').innerHTML = '<b>Use when:</b> '+escapeHtml(m.use)+'<span class="eg">e.g. '+escapeHtml(m.eg)+'</span>';
}

// ---- inputs ----
function renderInputs(){
  var t = activeTest, s = state[t];
  var root = $('test-inputs');
  var html = '';
  if (t==='oneT' || t==='twoT'){
    html += fld('wide','Cohen\'s d <small>standardized effect</small>','in-effect', s.effect, 0.05, -3, 3, "setEffect(this.value)");
  } else if (t==='oneProp'){
    html += fld('','Null proportion p0','in-p0', s.p0, 0.01, 0.01, 0.99, "setProp('p0',this.value)");
    html += fld('','Alt proportion p1','in-p1', s.p1, 0.01, 0.01, 0.99, "setProp('p1',this.value)");
  } else if (t==='twoProp'){
    html += fld('','Control proportion p1','in-p1', s.p1, 0.01, 0.01, 0.99, "setProp('p1',this.value)");
    html += fld('','Treatment proportion p2','in-p2', s.p2, 0.01, 0.01, 0.99, "setProp('p2',this.value)");
  } else if (t==='anova'){
    html += fld('',"Cohen's f <small>between/within SD</small>",'in-effect', s.effect, 0.05, 0.01, 2, "setEffect(this.value)");
    html += fld('','Groups k','in-k', s.k, 1, 2, 12, "setK(this.value)");
  } else if (t==='correlation'){
    html += fld('wide','Population correlation r','in-effect', s.effect, 0.05, -0.99, 0.99, "setEffect(this.value)");
  }
  var nmin = (t==='correlation') ? 4 : 2;
  var nlab = nLabel(t) ? 'Sample size n <small>'+nLabel(t)+'</small>' : 'Sample size n';
  html += fld((t==='oneProp'||t==='twoProp'||t==='anova')?'':'wide', nlab, 'in-n', s.n, 1, nmin, 100000, "setN(this.value)");
  root.innerHTML = html;

  document.querySelectorAll('.pill.a').forEach(function(b){ b.classList.toggle('on', Math.abs(parseFloat(b.dataset.a)-s.alpha)<1e-9); });
  document.querySelectorAll('.pill.t').forEach(function(b){ b.classList.toggle('on', parseInt(b.dataset.t,10)===(s.tail||2)); });
  var showTails = (t!=='anova');
  $('tail-row').style.display = showTails ? '' : 'none';
  $('tails-lbl').style.display = showTails ? '' : 'none';
}
function fld(cls, label, id, val, step, min, max, oninput){
  return '<div class="field'+(cls?' '+cls:'')+'"><label>'+label+'</label>'+
    '<input type="number" id="'+id+'" step="'+step+'" min="'+min+'" max="'+max+'" value="'+val+'" oninput="'+oninput+'"></div>';
}

// ---- setters ----
function clearScn(){ if (!quietScn) document.querySelectorAll('.scn').forEach(function(c){ c.classList.remove('on'); }); }
function setTest(v){
  activeTest = v;
  document.querySelectorAll('.mode').forEach(function(b){ b.classList.toggle('on', b.dataset.test===v); });
  clearScn();
  renderInputs(); renderModelNote(); renderBanner(); renderSliders(); recompute();
}
function setEffect(v){ var x=parseFloat(v); if(!isFinite(x)) return; state[activeTest].effect=x; clearScn(); recompute(); }
function setN(v){ var x=parseInt(v,10); var mn=(activeTest==='correlation')?4:2; if(!isFinite(x)||x<mn) return; state[activeTest].n=x; clearScn(); recompute(); syncSliders(); }
function setK(v){ var x=parseInt(v,10); if(!isFinite(x)||x<2) return; state[activeTest].k=x; clearScn(); recompute(); }
function setProp(key,v){ var x=parseFloat(v); if(!isFinite(x)||x<=0||x>=1) return; state[activeTest][key]=x; clearScn(); recompute(); }
function setAlpha(a){ state[activeTest].alpha=a; clearScn(); renderInputs(); recompute(); }
function setTail(t){ state[activeTest].tail=parseInt(t,10); clearScn(); renderInputs(); recompute(); }

// ---- drag sliders ----
var SLIDERS = {
  twoT:        function(){ return [sl('effect','d','effect',-1.5,1.5,0.01,2), sl('n','n','per group',2,300,1,0), sl('alpha','&alpha;','alpha',0.001,0.20,0.001,3)]; },
  oneT:        function(){ return [sl('effect','d','effect',-1.5,1.5,0.01,2), sl('n','n','size',2,300,1,0), sl('alpha','&alpha;','alpha',0.001,0.20,0.001,3)]; },
  oneProp:     function(){ return [sl('p0','p&#8320;','null',0.02,0.98,0.01,2), sl('p1','p&#8321;','alt',0.02,0.98,0.01,2), sl('n','n','size',2,500,1,0)]; },
  twoProp:     function(){ return [sl('p1','p&#8321;','control',0.02,0.98,0.01,2), sl('p2','p&#8322;','treat',0.02,0.98,0.01,2), sl('n','n','per arm',2,1000,1,0)]; },
  anova:       function(){ return [sl('effect','f','Cohen f',0.05,0.8,0.01,2), sl('k','k','groups',2,8,1,0), sl('n','n','per group',2,300,1,0)]; },
  correlation: function(){ return [sl('effect','r','corr',-0.95,0.95,0.01,2), sl('n','n','size',4,500,1,0), sl('alpha','&alpha;','alpha',0.001,0.20,0.001,3)]; }
};
function sl(key,sym,label,min,max,step,dec){ return {key:key,sym:sym,label:label,min:min,max:max,step:step,dec:dec}; }
function fmtSl(v,d){ return d===0 ? String(Math.round(v)) : Number(v).toFixed(d); }
function renderSliders(){
  var cfg = SLIDERS[activeTest]; var box = $('viz-sliders'); if (!box) return;
  var list = cfg(), s = state[activeTest];
  box.innerHTML = list.map(function(inp){
    var val = s[inp.key];
    return '<div class="srow"><label><span class="vsym">'+inp.sym+'</span><span>'+inp.label+'</span></label>'+
      '<input type="range" min="'+inp.min+'" max="'+inp.max+'" step="'+inp.step+'" value="'+val+'" oninput="onSlide(\''+inp.key+'\',this.value)" aria-label="'+inp.key+'">'+
      '<span class="vval" id="sv-'+inp.key+'">'+fmtSl(val,inp.dec)+'</span></div>';
  }).join('');
}
function onSlide(key,val){
  var v=+val, isInt=(key==='n'||key==='k');
  state[activeTest][key] = isInt ? Math.round(v) : v;
  var inp = SLIDERS[activeTest]().filter(function(x){return x.key===key;})[0];
  if (inp) $('sv-'+key).textContent = fmtSl(state[activeTest][key], inp.dec);
  clearScn(); renderInputs(); recompute();
}
function syncSliders(){ renderSliders(); }

// ---- verdict + plain + inference + report ----
function nStr(){ var s=state[activeTest]; var nl=nLabel(activeTest); return fmtN(s.n)+(nl?'/'+nl.replace('per ',''):''); }
function effStr(r){
  var s=state[activeTest];
  if (activeTest==='oneProp') return 'h = '+fmt(r.effectVal,2)+' (p0 '+fmt(s.p0,2)+' vs p1 '+fmt(s.p1,2)+')';
  if (activeTest==='twoProp') return 'h = '+fmt(r.effectVal,2)+' (p1 '+fmt(s.p1,2)+' vs p2 '+fmt(s.p2,2)+')';
  if (activeTest==='anova')   return 'f = '+fmt(s.effect,2)+', k = '+s.k;
  return r.effectSym+' = '+fmt(r.effectVal,2);
}
function tailStr(r){ return (r.tail===1) ? 'one-sided' : 'two-sided'; }

function renderVerdict(r){
  var ok = r.power >= 0.80;
  var chip = $('vchip'); chip.textContent = 'power = '+fmt(r.power,2); chip.className = 'vchip'+(ok?'':' na');
  $('vhead').textContent = ok ? 'Adequately powered' : 'Underpowered';
  $('vsub').innerHTML = ok
    ? 'A real effect of this size would be caught about '+fmtPct(r.power)+' of the time.'
    : 'A real effect of this size would be missed about '+fmtPct(r.beta)+' of the time.';
}
function renderPlain(r){
  $('plain').innerHTML = 'If the effect is truly this size, you would correctly detect it about <b>'+fmtPct(r.power)+
    '</b> of the time (power). The other <b>'+fmtPct(r.beta)+'</b> of the time you would miss it, a Type II error. '+
    'And when nothing is really going on, a stricter-or-looser threshold means you raise a false alarm <b>'+fmtPct(r.alpha)+
    '</b> of the time, a Type I error.';
}
function renderInference(r){
  var el = $('inference-banner');
  var lo = r.power < 0.80;
  var lead = 'Since power = <b>'+fmt(r.power,3)+'</b> '+(lo?'&lt;':'&ge;')+' 0.80, this design is <b class="'+(lo?'lo':'')+'">'+(lo?'underpowered':'adequately powered')+'</b>: ';
  var tail = lo
    ? 'it would miss a true '+r.effectSym+'-sized effect <b>'+fmtPct(r.beta)+'</b> of the time. Raise n, target a larger effect, or accept a larger &alpha; to lift power.'
    : 'a true effect of this size is detected <b>'+fmtPct(r.power)+'</b> of the time, at a Type I error rate of <b>'+fmtPct(r.alpha)+'</b>.';
  el.innerHTML = '<span class="ik">Inference</span>'+lead+tail;
}
function renderReport(r){
  var t = TESTS.filter(function(x){return x.key===activeTest;})[0];
  var crit = r.critText.replace('&plusmn;','+/-').replace('&pm;','+/-');
  $('report').textContent = t.name+', '+effStr(r)+', n = '+nStr()+', alpha = '+fmt(r.alpha,3)+
    ' ('+tailStr(r)+'): power = '+fmt(r.power,3)+', beta = '+fmt(r.beta,3)+', '+crit+'.';
}

// ---- main density plot ----
function drawMainViz(r){
  var svg = $('viz-svg'); if (!svg) return;
  var W=720, H=280, ml=48, mr=24, mt=26, mb=50;
  var plotW=W-ml-mr, plotH=H-mt-mb;
  var xLo=r.xRange[0], xHi=r.xRange[1];
  var N=220, xs=[]; for (var i=0;i<=N;i++) xs.push(xLo+(i/N)*(xHi-xLo));
  var yNull=xs.map(function(x){return Math.max(0,r.nullPdf(x));});
  var yAlt =xs.map(function(x){return Math.max(0,r.altPdf(x));});
  var yMax=Math.max.apply(null, yNull.concat(yAlt))*1.10;
  var tx=function(v){ return ml+((v-xLo)/(xHi-xLo))*plotW; };
  var ty=function(v){ return mt+plotH-(v/yMax)*plotH; };
  var linePath=function(ys){ return xs.map(function(x,i){ return (i===0?'M':'L')+tx(x).toFixed(1)+','+ty(ys[i]).toFixed(1); }).join(' '); };
  var fillPath=function(ys,fromX,toX){
    var pts=[]; for (var i=0;i<xs.length;i++){ if (xs[i]>=fromX && xs[i]<=toX) pts.push([xs[i],ys[i]]); }
    if (!pts.length) return '';
    var d='M'+tx(pts[0][0]).toFixed(1)+','+ty(0).toFixed(1);
    for (var j=0;j<pts.length;j++) d+=' L'+tx(pts[j][0]).toFixed(1)+','+ty(pts[j][1]).toFixed(1);
    d+=' L'+tx(pts[pts.length-1][0]).toFixed(1)+','+ty(0).toFixed(1)+' Z'; return d;
  };
  var nullLine=linePath(yNull), altLine=linePath(yAlt);
  var alphaFills='', critLines='', critLabels='';
  if (r.family==='f' || r.tail===1){
    alphaFills += '<path class="alpha-fill" d="'+fillPath(yNull,r.crit,xHi)+'"/>';
    var xc=tx(r.crit);
    critLines += '<line class="crit-line" x1="'+xc.toFixed(1)+'" y1="'+mt+'" x2="'+xc.toFixed(1)+'" y2="'+(mt+plotH)+'"/>';
    critLabels += '<text class="label-crit" x="'+xc.toFixed(1)+'" y="'+(mt-6).toFixed(1)+'" text-anchor="middle">'+(r.family==='f'?'F*':'crit')+' = '+fmt(r.crit,2)+'</text>';
  } else {
    alphaFills += '<path class="alpha-fill" d="'+fillPath(yNull,r.crit,xHi)+'"/>';
    alphaFills += '<path class="alpha-fill" d="'+fillPath(yNull,xLo,-r.crit)+'"/>';
    var xc1=tx(r.crit), xc2=tx(-r.crit);
    critLines += '<line class="crit-line" x1="'+xc1.toFixed(1)+'" y1="'+mt+'" x2="'+xc1.toFixed(1)+'" y2="'+(mt+plotH)+'"/>';
    critLines += '<line class="crit-line" x1="'+xc2.toFixed(1)+'" y1="'+mt+'" x2="'+xc2.toFixed(1)+'" y2="'+(mt+plotH)+'"/>';
    critLabels += '<text class="label-crit" x="'+xc1.toFixed(1)+'" y="'+(mt-6).toFixed(1)+'" text-anchor="middle">+'+fmt(r.crit,2)+'</text>';
    critLabels += '<text class="label-crit" x="'+xc2.toFixed(1)+'" y="'+(mt-6).toFixed(1)+'" text-anchor="middle">-'+fmt(r.crit,2)+'</text>';
  }
  var betaFill='';
  if (r.family==='f') betaFill='<path class="beta-fill" d="'+fillPath(yAlt,0,r.crit)+'"/>';
  else if (r.tail===1) betaFill='<path class="beta-fill" d="'+fillPath(yAlt,xLo,r.crit)+'"/>';
  else betaFill='<path class="beta-fill" d="'+fillPath(yAlt,-r.crit,r.crit)+'"/>';
  var meanLines='';
  if (r.family!=='f'){
    var x0=tx(0), xN=tx(r.ncp);
    meanLines += '<line class="mean-line-null" x1="'+x0.toFixed(1)+'" y1="'+(mt+plotH).toFixed(1)+'" x2="'+x0.toFixed(1)+'" y2="'+(mt+plotH-12).toFixed(1)+'"/>';
    meanLines += '<line class="mean-line-alt" x1="'+xN.toFixed(1)+'" y1="'+(mt+plotH).toFixed(1)+'" x2="'+xN.toFixed(1)+'" y2="'+(mt+plotH-12).toFixed(1)+'"/>';
  }
  var ticks=''; var nT=6;
  for (var k=0;k<=nT;k++){ var v=xLo+(k/nT)*(xHi-xLo);
    ticks += '<line class="ax" x1="'+tx(v).toFixed(1)+'" y1="'+(mt+plotH)+'" x2="'+tx(v).toFixed(1)+'" y2="'+(mt+plotH+3)+'"/>';
    ticks += '<text class="tick-label" x="'+tx(v).toFixed(1)+'" y="'+(mt+plotH+14).toFixed(1)+'" text-anchor="middle">'+fmt(v,2)+'</text>';
  }
  var curveLabels='', regionLabels='';
  if (r.family==='f'){
    curveLabels += '<text class="label-null" x="'+(ml+plotW*0.20).toFixed(1)+'" y="'+(mt+30).toFixed(1)+'">H0 (central F)</text>';
    curveLabels += '<text class="label-alt" x="'+(ml+plotW*0.55).toFixed(1)+'" y="'+(mt+30).toFixed(1)+'">H1 (noncentral F)</text>';
    regionLabels += '<text class="label-alpha" x="'+(tx(r.crit)+22).toFixed(1)+'" y="'+(mt+plotH-8).toFixed(1)+'">&alpha;</text>';
    regionLabels += '<text class="label-beta" x="'+tx(r.crit*0.5).toFixed(1)+'" y="'+(mt+plotH-8).toFixed(1)+'" text-anchor="middle">&beta;</text>';
  } else {
    curveLabels += '<text class="label-null" x="'+tx(0).toFixed(1)+'" y="'+(mt+16).toFixed(1)+'" text-anchor="middle">H0 null</text>';
    curveLabels += '<text class="label-alt" x="'+tx(r.ncp).toFixed(1)+'" y="'+(mt+16).toFixed(1)+'" text-anchor="middle">H1 alt</text>';
    if (r.tail===1){
      regionLabels += '<text class="label-alpha" x="'+(tx(r.crit)+12).toFixed(1)+'" y="'+(mt+plotH-8).toFixed(1)+'">&alpha;</text>';
      regionLabels += '<text class="label-beta" x="'+tx(Math.max(xLo+0.3,r.ncp-0.6)).toFixed(1)+'" y="'+(mt+plotH-8).toFixed(1)+'" text-anchor="middle">&beta;</text>';
    } else {
      regionLabels += '<text class="label-alpha" x="'+(tx(r.crit)+12).toFixed(1)+'" y="'+(mt+plotH-8).toFixed(1)+'">&alpha;/2</text>';
      regionLabels += '<text class="label-alpha" x="'+(tx(-r.crit)-12).toFixed(1)+'" y="'+(mt+plotH-8).toFixed(1)+'" text-anchor="end">&alpha;/2</text>';
      regionLabels += '<text class="label-beta" x="'+tx(r.ncp/2).toFixed(1)+'" y="'+(mt+plotH-8).toFixed(1)+'" text-anchor="middle">&beta;</text>';
    }
  }
  svg.innerHTML =
    '<line class="ax" x1="'+ml+'" y1="'+(mt+plotH)+'" x2="'+(W-mr)+'" y2="'+(mt+plotH)+'"/>'+
    ticks+
    '<path class="density-null-fill" d="'+fillPath(yNull,xLo,xHi)+'"/>'+
    alphaFills+betaFill+
    '<path class="density-null" d="'+nullLine+'"/>'+
    '<path class="density-alt" d="'+altLine+'"/>'+
    critLines+meanLines+curveLabels+critLabels+regionLabels+
    '<text class="ax-label" x="'+(ml+plotW/2).toFixed(1)+'" y="'+(H-12).toFixed(1)+'" text-anchor="middle">test statistic</text>';

  var t = TESTS.filter(function(x){return x.key===activeTest;})[0];
  $('viz-readout').innerHTML = escapeHtml(t.short)+' &middot; <b>'+r.effectSym+' = '+fmt(r.effectVal,3)+'</b> &middot; <b>n = '+fmtN(state[activeTest].n)+
    '</b> &middot; <span class="vr-alpha">&alpha; = '+fmt(r.alpha,3)+'</span> &middot; <span class="vr-beta">&beta; = '+fmt(r.beta,3)+'</span> &middot; <span class="vr-power">power = '+fmt(r.power,3)+'</span>';
}

// ---- 2x2 mosaic ----
function drawMosaic(r){
  var tn=1-r.alpha, t1=r.alpha, t2=r.beta, tp=r.power;
  $('tt-pct-tn').textContent=fmtPct(tn); $('tt-pct-t1').textContent=fmtPct(t1);
  $('tt-pct-t2').textContent=fmtPct(t2); $('tt-pct-tp').textContent=fmtPct(tp);
  $('tt-fill-tn').style.height=(tn*100).toFixed(1)+'%'; $('tt-fill-t1').style.height=(t1*100).toFixed(1)+'%';
  $('tt-fill-t2').style.height=(t2*100).toFixed(1)+'%'; $('tt-fill-tp').style.height=(tp*100).toFixed(1)+'%';
}

// ---- sparklines ----
function powerOf(overrides){
  var saved = {}; var s=state[activeTest]; for (var k in s) saved[k]=s[k];
  for (var o in overrides) s[o]=overrides[o];
  var p = compute().power;
  for (var k2 in saved) s[k2]=saved[k2];
  return p;
}
function drawSpark(svgId, curId, getX, getY, curX, xLabel, valFmt){
  var svg=$(svgId), lbl=$(curId); if(!svg) return;
  var W=200,H=48,pad=4,N=40,xs=[]; for (var i=0;i<=N;i++) xs.push(getX(i/N));
  var ys=xs.map(function(x){ var p=getY(x); if(!isFinite(p)||p<0)p=0; if(p>1)p=1; return p; });
  var xMin=Math.min.apply(null,xs), xMax=Math.max.apply(null,xs);
  var tx=function(v){ return pad+((v-xMin)/((xMax-xMin)||1))*(W-2*pad); };
  var ty=function(v){ return pad+(1-v)*(H-2*pad); };
  var path=xs.map(function(x,i){ return (i===0?'M':'L')+tx(x).toFixed(1)+','+ty(ys[i]).toFixed(1); }).join(' ');
  var cx=tx(curX), cy=ty(Math.max(0,Math.min(1,getY(curX))));
  svg.innerHTML='<line x1="'+pad+'" y1="'+ty(0.8).toFixed(1)+'" x2="'+(W-pad)+'" y2="'+ty(0.8).toFixed(1)+'" stroke="#9ca3af" stroke-dasharray="2 3" stroke-width="0.6"/>'+
    '<path d="'+path+'" fill="none" stroke="#16233a" stroke-width="1.6"/>'+
    '<circle cx="'+cx.toFixed(1)+'" cy="'+cy.toFixed(1)+'" r="3" fill="#1f7a55" stroke="#fff" stroke-width="1.5"/>';
  lbl.innerHTML=xLabel+' = <b>'+valFmt(curX)+'</b> &rarr; power = <b>'+fmt(getY(curX),3)+'</b>';
}
function drawSparks(){
  var t=activeTest, s=state[t];
  var nMax=Math.max(60, Math.round(s.n*3));
  drawSpark('spark-n','spark-n-cur', function(u){return Math.round(2+u*(nMax-2));}, function(n){return powerOf({n:n});}, s.n, 'n', function(v){return fmtN(v);});
  if (t==='oneProp'){
    drawSpark('spark-e','spark-e-cur', function(u){return 0.02+u*0.96;}, function(p1){return powerOf({p1:p1});}, s.p1, 'p1', function(v){return fmt(v,2);});
  } else if (t==='twoProp'){
    drawSpark('spark-e','spark-e-cur', function(u){return 0.02+u*0.96;}, function(p2){return powerOf({p2:p2});}, s.p2, 'p2', function(v){return fmt(v,2);});
  } else if (t==='correlation'){
    drawSpark('spark-e','spark-e-cur', function(u){return -0.95+u*1.90;}, function(r){return powerOf({effect:r});}, s.effect, 'r', function(v){return fmt(v,2);});
  } else if (t==='anova'){
    drawSpark('spark-e','spark-e-cur', function(u){return 0.05+u*0.75;}, function(f){return powerOf({effect:f});}, s.effect, 'f', function(v){return fmt(v,2);});
  } else {
    drawSpark('spark-e','spark-e-cur', function(u){return -1.5+u*3.0;}, function(d){return powerOf({effect:d});}, s.effect, 'd', function(v){return fmt(v,2);});
  }
  drawSpark('spark-a','spark-a-cur', function(u){return 0.001+u*0.199;}, function(a){return powerOf({alpha:a});}, s.alpha, 'alpha', function(v){return fmt(v,3);});
}

// ---- how-computed ----
function renderHow(r){
  var s=state[activeTest];
  $('h-1').innerHTML='The effect size and sample size set the <b>noncentrality</b>: <code>'+r.ncpStr+'</code>. This is how far the alternative distribution sits from the null.';
  $('h-2').innerHTML='The significance level fixes the <b>critical value</b> on the null distribution ('+r.dfStr+'): the test rejects H0 beyond <code>'+r.critText.replace('&plusmn;','+/-')+'</code>.';
  $('h-3').innerHTML='Alpha = <b>'+fmt(r.alpha,3)+'</b> is the null tail past the critical value; beta = <b>'+fmt(r.beta,3)+'</b> is the alternative area inside it; power = <b>'+fmt(r.power,3)+'</b>.';
}

// ---- R code ----
function buildRCode(){
  var t=activeTest, s=state[t], alpha=s.alpha, n=s.n, tail=s.tail||2;
  var altStr=(tail===1)?'greater':'two.sided';
  function c(x){return '<span class="comment">'+escapeHtml(x)+'</span>';}
  function fn(x){return '<span class="fn">'+escapeHtml(x)+'</span>';}
  function nu(v){return '<span class="number">'+escapeHtml(String(v))+'</span>';}
  function st(x){return '<span class="string">"'+escapeHtml(x)+'"</span>';}
  var L=[];
  L.push(c('# Type I / II error rates for a '+TESTS.filter(function(x){return x.key===t;})[0].name));
  L.push(fn('library')+'('+st('pwr')+')');
  L.push('');
  if (t==='oneT' || t==='twoT'){
    var type=(t==='oneT')?'one.sample':'two.sample';
    L.push('d     <- '+nu(s.effect));
    L.push('n     <- '+nu(n));
    L.push('alpha <- '+nu(alpha));
    L.push('');
    L.push('res <- '+fn('pwr.t.test')+'(d = d, n = n, sig.level = alpha,');
    L.push('                  type = '+st(type)+', alternative = '+st(altStr)+')');
    L.push('res$power        '+c('# power = 1 - beta'));
    L.push(nu(1)+' - res$power    '+c('# beta (Type II)'));
  } else if (t==='oneProp'){
    L.push('p0    <- '+nu(s.p0));
    L.push('p1    <- '+nu(s.p1));
    L.push('n     <- '+nu(n));
    L.push('alpha <- '+nu(alpha));
    L.push('h     <- '+fn('ES.h')+'(p1, p0)   '+c("# Cohen's h"));
    L.push('');
    L.push('res <- '+fn('pwr.p.test')+'(h = h, n = n, sig.level = alpha,');
    L.push('                  alternative = '+st(altStr)+')');
    L.push('res$power');
    L.push(nu(1)+' - res$power');
  } else if (t==='twoProp'){
    L.push('p1    <- '+nu(s.p1));
    L.push('p2    <- '+nu(s.p2));
    L.push('n     <- '+nu(n)+'   '+c('# per arm'));
    L.push('alpha <- '+nu(alpha));
    L.push('h     <- '+fn('ES.h')+'(p2, p1)');
    L.push('');
    L.push('res <- '+fn('pwr.2p.test')+'(h = h, n = n, sig.level = alpha,');
    L.push('                   alternative = '+st(altStr)+')');
    L.push('res$power');
    L.push(nu(1)+' - res$power');
  } else if (t==='anova'){
    L.push('f     <- '+nu(s.effect)+'   '+c("# Cohen's f"));
    L.push('k     <- '+nu(s.k));
    L.push('n     <- '+nu(n)+'   '+c('# per group'));
    L.push('alpha <- '+nu(alpha));
    L.push('');
    L.push('res <- '+fn('pwr.anova.test')+'(k = k, n = n, f = f, sig.level = alpha)');
    L.push('res$power');
    L.push(nu(1)+' - res$power');
  } else if (t==='correlation'){
    L.push('r     <- '+nu(s.effect));
    L.push('n     <- '+nu(n));
    L.push('alpha <- '+nu(alpha));
    L.push('');
    L.push('res <- '+fn('pwr.r.test')+'(r = r, n = n, sig.level = alpha,');
    L.push('                  alternative = '+st(altStr)+')');
    L.push('res$power');
    L.push(nu(1)+' - res$power');
  }
  return L.join('\n');
}

// ---- orchestrator ----
function recompute(){
  var r = compute();
  if (!isFinite(r.power)){
    $('ierr').textContent = 'That sample size is too small for this test (need n at least '+(activeTest==='correlation'?4:2)+').';
    $('ierr').classList.add('show');
    return;
  }
  $('ierr').classList.remove('show');
  $('ro-alpha').textContent = fmt(r.alpha,4);
  $('ro-beta').textContent  = fmt(r.beta,4);
  $('ro-power').textContent = fmt(r.power,4);
  $('ro-crit').innerHTML    = r.critText;
  renderVerdict(r); renderPlain(r); renderInference(r); renderReport(r);
  renderBanner();
  drawMainViz(r); drawMosaic(r); drawSparks(); renderHow(r);
  $('rcodepre').innerHTML = buildRCode();
}

// ---- scenarios ----
var SCEN = {
  under:    {test:'twoT', st:{effect:0.3, n:20, alpha:0.05, tail:2}},
  conv:     {test:'twoT', st:{effect:0.5, n:30, alpha:0.05, tail:2}},
  tight:    {test:'twoT', st:{effect:0.5, n:30, alpha:0.01, tail:2}},
  balanced: {test:'twoT', st:{effect:0.5, n:105, alpha:0.05, tail:2}},
  tiny:     {test:'twoT', st:{effect:0.1, n:200, alpha:0.05, tail:2}}
};
function loadScenario(key){
  var sc=SCEN[key]; if(!sc) return;
  quietScn=true;
  document.querySelectorAll('.scn').forEach(function(c){ c.classList.toggle('on', c.dataset.scn===key); });
  activeTest = sc.test;
  document.querySelectorAll('.mode').forEach(function(b){ b.classList.toggle('on', b.dataset.test===sc.test); });
  for (var k in sc.st) state[sc.test][k]=sc.st[k];
  renderInputs(); renderModelNote(); renderBanner(); renderSliders(); recompute();
  quietScn=false;
  toast('Loaded: '+key.charAt(0).toUpperCase()+key.slice(1));
}

// ---- toast + GA ----
function toast(msg){
  var el=$('toast-area'); if(!el) return;
  var t=document.createElement('div'); t.className='toast'; t.textContent=msg;
  el.appendChild(t); setTimeout(function(){ t.remove(); }, 2600);
}
