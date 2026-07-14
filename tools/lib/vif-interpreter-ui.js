/* vif-interpreter-ui.js - front-end engine for the VIF / multicollinearity
   calculator (tools/vif-interpreter.html). Externalized from the page to keep
   the rendered document under the Lab-sheet size budget; the analytics
   (tool_use / tool_copy) and copy buttons stay inline in the page so the
   deterministic page audit still sees them. Depends on window.VIFMath
   (tools/lib/vif-math.js) and window.DataParse (tools/lib/data-parse.js). */
(function(){
'use strict';
var M = window.VIFMath, DP = window.DataParse;
if(!M) return;
var $ = function(id){ return document.getElementById(id); };
var state = { mode:'data', low:5, high:10, dropped:{} };
var PRESETS = {
collinear: { mode:'data', text:"wt\thp\tdisp\tcyl\n2.62\t110.00\t160.00\t6.00\n2.875\t110.000\t160.000\t6.000\n2.32\t93.00\t108.00\t4.00\n3.215\t110.000\t258.000\t6.000\n3.44\t175.00\t360.00\t8.00\n3.46\t105.00\t225.00\t6.00\n3.57\t245.00\t360.00\t8.00\n3.19\t62.00\t146.70\t4.00\n3.15\t95.00\t140.80\t4.00\n3.44\t123.00\t167.60\t6.00\n3.44\t123.00\t167.60\t6.00\n4.07\t180.00\t275.80\t8.00\n3.73\t180.00\t275.80\t8.00\n3.78\t180.00\t275.80\t8.00\n5.25\t205.00\t472.00\t8.00\n5.424\t215.000\t460.000\t8.000\n5.345\t230.000\t440.000\t8.000\n2.2\t66.0\t78.7\t4.0\n1.615\t52.000\t75.700\t4.000\n1.835\t65.000\t71.100\t4.000\n2.465\t97.000\t120.100\t4.000\n3.52\t150.00\t318.00\t8.00\n3.435\t150.000\t304.000\t8.000\n3.84\t245.00\t350.00\t8.00\n3.845\t175.000\t400.000\t8.000\n1.935\t66.000\t79.000\t4.000\n2.14\t91.00\t120.30\t4.00\n1.513\t113.000\t95.100\t4.000\n3.17\t264.00\t351.00\t8.00\n2.77\t175.00\t145.00\t6.00\n3.57\t335.00\t301.00\t8.00\n2.78\t109.00\t121.00\t4.00" },
clean:     { mode:'data', text:"wt\tqsec\tam\n2.62\t16.46\t1.00\n2.875\t17.020\t1.000\n2.32\t18.61\t1.00\n3.215\t19.440\t0.000\n3.44\t17.02\t0.00\n3.46\t20.22\t0.00\n3.57\t15.84\t0.00\n3.19\t20.00\t0.00\n3.15\t22.90\t0.00\n3.44\t18.30\t0.00\n3.44\t18.90\t0.00\n4.07\t17.40\t0.00\n3.73\t17.60\t0.00\n3.78\t18.00\t0.00\n5.25\t17.98\t0.00\n5.424\t17.820\t0.000\n5.345\t17.420\t0.000\n2.20\t19.47\t1.00\n1.615\t18.520\t1.000\n1.835\t19.900\t1.000\n2.465\t20.010\t0.000\n3.52\t16.87\t0.00\n3.435\t17.300\t0.000\n3.84\t15.41\t0.00\n3.845\t17.050\t0.000\n1.935\t18.900\t1.000\n2.14\t16.70\t1.00\n1.513\t16.900\t1.000\n3.17\t14.50\t1.00\n2.77\t15.50\t1.00\n3.57\t14.60\t1.00\n2.78\t18.60\t1.00" },
cormat:    { mode:'cor',  text:'        wt        hp        disp\nwt   1.0000000 0.6587479 0.8879799\nhp   0.6587479 1.0000000 0.7909486\ndisp 0.8879799 0.7909486 1.0000000' },
vals:      { mode:'vals', text:'wt       hp       disp\n4.844618 2.736633 7.324517' },
gvif:      { mode:'vals', text:'         GVIF Df GVIF^(1/(2*Df))\nwt   2.580877  1        1.606511\nhp   3.496014  1        1.869763\ncylf 5.105815  2        1.503198' }
};
function isNum(t){ return /^-?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(t) || /^-?inf$/i.test(t) || /^nan$/i.test(t); }
function num(t){ if(/^-?inf$/i.test(t)) return /^-/.test(t)?-Infinity:Infinity; if(/^nan$/i.test(t)) return NaN; return parseFloat(t); }
function fmt(x,d){ if(x===Infinity) return '&#8734;'; if(x===-Infinity) return '-&#8734;'; if(!isFinite(x)) return 'NaN'; return x.toFixed(d===undefined?2:d); }
function fmtT(x,d){ if(x===Infinity) return '∞'; if(!isFinite(x)) return 'NaN'; return x.toFixed(d===undefined?2:d); }
function esc(s){ return String(s).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
function err(msg){ var e=$('ierr'); if(msg){ e.innerHTML=msg; e.classList.add('show'); } else e.classList.remove('show'); }
function fmtDec(x){ return (Math.round(x)===x)?0:(Math.round(x*10)===x*10?1:2); }
function clip(s,n){ s=String(s); return s.length>n ? s.slice(0,n-1)+'…' : s; }
function verdictOf(maxv){ if(!isFinite(maxv)) return 'sev'; if(maxv>=state.high) return 'sev'; if(maxv>=state.low) return 'mod'; return 'ok'; }
function flagOf(v){ if(!isFinite(v)||v>=state.high) return 'red'; if(v>=state.low) return 'yellow'; return 'green'; }
function flagWord(f){ return f==='red'?'Severe':f==='yellow'?'Moderate':'Low'; }
function nm(s){ return /^[A-Za-z.][A-Za-z0-9._]*$/.test(s) ? s : '`'+s+'`'; }
function trimNum(x){ if(x===Infinity) return 'Inf'; if(x===-Infinity) return '-Inf'; if(!isFinite(x)) return 'NaN'; var s=x.toPrecision(9); if(s.indexOf('.')>=0 && s.indexOf('e')<0) s=s.replace(/0+$/,'').replace(/\.$/,''); return s; }

var RESP=/^(mpg|y|response|outcome|target|dv|label|dep|dependent)$/i;
function parseRawData(raw){
if(!DP) return { error:'Data parser failed to load. Reload the page.' };
var pm = DP.parseMatrix(raw);
if(pm.mode==='empty') return { error:'Paste your predictor columns, one predictor per column, with a header row of names.' };
if(pm.mode==='vector') return { error:'Only one numeric column detected. VIF compares predictors, so paste at least two columns.' };
var names=pm.names.slice(), mat=pm.matrix, nc=pm.ncol, r, c, k;
var nonNum=[];
for(c=0;c<nc;c++){ var cnt=0; for(r=0;r<mat.length;r++){ var v=mat[r][c]; if(v!==null && isFinite(v)) cnt++; } if(cnt===0) nonNum.push(names[c]); }
if(nonNum.length) return { error:'Column '+nonNum.map(function(n){return '<b>'+esc(n)+'</b>';}).join(', ')+' is text, not numbers. VIF needs numeric predictors: remove it or encode it as 0/1 dummy columns.' };
var respDropped=null, keepCols=[];
for(c=0;c<nc;c++){ if(respDropped===null && RESP.test(names[c])){ respDropped=names[c]; } else keepCols.push(c); }
if(respDropped && keepCols.length<2){ respDropped=null; keepCols=[]; for(c=0;c<nc;c++) keepCols.push(c); }
var kn = keepCols.map(function(i){ return names[i]; });
if(kn.length<2) return { error:'Need at least two numeric predictor columns; found '+kn.length+'.' };
var cols=kn.map(function(){ return []; }), nDrop=0;
for(r=0;r<mat.length;r++){
var okr=true; for(k=0;k<keepCols.length;k++){ var vv=mat[r][keepCols[k]]; if(vv===null||!isFinite(vv)){ okr=false; break; } }
if(!okr){ nDrop++; continue; }
for(k=0;k<keepCols.length;k++) cols[k].push(mat[r][keepCols[k]]);
}
var nrow=cols[0].length;
if(nrow<3) return { error:'Only '+nrow+' complete row'+(nrow===1?'':'s')+' after removing missing values. Paste more observations.' };
return { names:kn, cols:cols, nrow:nrow, respDropped:respDropped, rowsDropped:nDrop };
}

function parseCorMatrix(raw){
var txt=(raw||'').trim();
if(!txt) return { error:'Paste a correlation matrix.' };
var lines=txt.split('\n').map(function(l){ return l.trim(); }).filter(Boolean);
var colNames=null, start=0;
var first=lines[0].split(/[\s,]+/).filter(Boolean);
if(first.length && first.every(function(t){ return !isNum(t); })){ colNames=first; start=1; }
var rows=[], rowNames=[];
for(var i=start;i<lines.length;i++){
var tk=lines[i].split(/[\s,]+/).filter(Boolean);
if(!tk.length) continue;
var rn=null; if(!isNum(tk[0])){ rn=tk.shift(); }
if(!tk.length) continue;
var vals=tk.map(parseFloat);
if(vals.some(function(v){ return !isFinite(v); })) return { error:'Row starting "'+esc(lines[i].slice(0,18))+'" has a non-numeric entry.' };
rows.push(vals); rowNames.push(rn);
}
if(rows.length<2) return { error:'Need at least a 2 by 2 correlation matrix.' };
var n=rows.length;
if(rows.some(function(r){ return r.length!==n; })) return { error:'The matrix must be square: '+n+' rows, so each row needs '+n+' values.' };
var names=colNames || (rowNames.every(Boolean)?rowNames:null) || rows.map(function(_,k){ return 'x'+(k+1); });
if(names.length!==n) names=rows.map(function(_,k){ return 'x'+(k+1); });
var drop=-1, dropped=null;
for(var d=0;d<names.length;d++){ if(RESP.test(names[d])){ drop=d; break; } }
if(drop>=0 && n>2){
dropped=names[drop];
names=names.filter(function(_,k){ return k!==drop; });
rows=rows.filter(function(_,k){ return k!==drop; }).map(function(r){ return r.filter(function(_,k){ return k!==drop; }); });
n=rows.length;
}
return { names:names, R:rows, dropped:dropped };
}

function parseVals(raw){
var txt=(raw||'').trim();
if(!txt) return { error:'Paste some VIF values to interpret.' };
var lines=txt.split('\n').map(function(l){ return l.trim(); }).filter(Boolean);
var hi=-1;
for(var i=0;i<lines.length;i++){ if(/gvif/i.test(lines[i]) && /\bdf\b/i.test(lines[i])){ hi=i; break; } }
if(hi>=0){
var gp=[];
for(var j=hi+1;j<lines.length;j++){
var pt=lines[j].split(/\s+/).filter(Boolean);
if(pt.length<4 || isNum(pt[0])) continue;
var df=num(pt[2]), adj=num(pt[3]);
if(!isFinite(df)||!isFinite(adj)) continue;
gp.push({ name:pt[0], vif:adj*adj, df:df, adj:adj });
}
if(gp.length) return { predictors:gp, gvif:true };
return { error:'Could not read the GVIF table. Expect columns: name, GVIF, Df, GVIF^(1/(2*Df)).' };
}
if(lines.length===2){
var a=lines[0].split(/[\s,]+/).filter(Boolean), b=lines[1].split(/[\s,]+/).filter(Boolean);
if(a.length===b.length && a.length>=1 && a.every(function(t){ return !isNum(t); }) && b.every(isNum))
return { predictors:a.map(function(n,k){ return { name:n, vif:num(b[k]) }; }) };
}
var pairs=[], pairOK=true, sawPair=false;
for(var li=0;li<lines.length;li++){
var tk=lines[li].split(/[\s,]+/).filter(Boolean);
if(tk.length===2 && !isNum(tk[0]) && isNum(tk[1])){ pairs.push({ name:tk[0], vif:num(tk[1]) }); sawPair=true; }
else { pairOK=false; break; }
}
if(sawPair && pairOK && pairs.length) return { predictors:pairs };
var toks=txt.split(/[\s,]+/).filter(Boolean);
if(toks.length && toks.every(isNum)) return { predictors:toks.map(function(v,k){ return { name:'x'+(k+1), vif:num(v) }; }) };
if(toks.length>=2 && toks.length%2===0){
var alt=[], ok=true;
for(var t2=0;t2<toks.length;t2+=2){ if(isNum(toks[t2])||!isNum(toks[t2+1])){ ok=false; break; } alt.push({ name:toks[t2], vif:num(toks[t2+1]) }); }
if(ok && alt.length) return { predictors:alt };
}
return { error:'Could not parse VIF values. Paste car::vif() output as names and values, or one "name value" per line.' };
}

function syncMeta(){
if(state.mode==='data'){ var d=parseRawData($('datain').value); $('datameta').innerHTML = d.error ? '' : (d.names.length+' predictors, '+d.nrow+' complete rows'+(d.respDropped?', dropped response '+esc(d.respDropped):'')+(d.rowsDropped?', '+d.rowsDropped+' rows with missing values skipped':'')); }
else if(state.mode==='cor'){ var c=parseCorMatrix($('corin').value); $('cormeta').innerHTML = c.error ? '' : (c.R.length+' by '+c.R.length+' matrix'+(c.dropped?', dropped '+esc(c.dropped):'')); }
else { var p=parseVals($('valsin').value); $('valsmeta').innerHTML = p.error ? '' : (p.predictors.length+' predictor'+(p.predictors.length===1?'':'s')+(p.gvif?' (GVIF table)':' detected')); }
}

function blankResults(){
['omax','ok','oflag','otol','ocond'].forEach(function(id){ $(id).textContent='-'; });
$('vrows').innerHTML=''; $('bars').innerHTML=''; $('vizcap').textContent='';
$('vhead').textContent='-'; $('vsub').textContent=''; $('plain').innerHTML=''; $('callout').innerHTML='';
$('guide').hidden=true; $('condbox').hidden=true; $('heatbox').hidden=true; $('infline').innerHTML=''; $('report').textContent='';
$('vchip').className='vchip'; $('vchip').innerHTML='max VIF';
}

function calc(){
err(null); syncMeta();
if(state.mode==='data'){
var d=parseRawData($('datain').value);
if(d.error){ err(d.error); blankResults(); return; }
var full=M.vifFromData(d.cols);
if(full.error && /zero variance/.test(full.error)){ err(full.error); blankResults(); return; }
renderWithR({ names:d.names, R:full.R || M.corMatrix(d.cols), nrow:d.nrow, respDropped:d.respDropped, rowsDropped:d.rowsDropped, mode:'data' });
} else if(state.mode==='cor'){
var c=parseCorMatrix($('corin').value);
if(c.error){ err(c.error); blankResults(); return; }
renderWithR({ names:c.names, R:c.R, nrow:null, respDropped:c.dropped, rowsDropped:0, mode:'cor' });
} else {
var p=parseVals($('valsin').value);
if(p.error){ err(p.error); blankResults(); return; }
var preds=p.predictors.map(function(x){ return { name:x.name, vif:x.vif, dropped:false, df:x.df, adj:x.adj }; });
paint(preds, { hasR:false, gvif:!!p.gvif, mode:'vals' });
}
}

function renderWithR(ctx){
var names=ctx.names, R=ctx.R;
Object.keys(state.dropped).forEach(function(n){ if(names.indexOf(n)<0) delete state.dropped[n]; });
var activeIdx=[], activeNames=[];
names.forEach(function(n,i){ if(!state.dropped[n]){ activeIdx.push(i); activeNames.push(n); } });
var base={ hasR:true, R:R, names:names, activeNames:activeNames, gvif:false, nrow:ctx.nrow, respDropped:ctx.respDropped, rowsDropped:ctx.rowsDropped, mode:ctx.mode };
if(activeIdx.length<2){
var predsF=names.map(function(n){ return { name:n, dropped:!!state.dropped[n], vif:NaN }; });
paint(predsF, Object.assign(base,{ activeR:null, cond:null, eig:null, singular:false, aliased:[], tooFew:true }));
return;
}
var activeR=M.subMatrix(R, activeIdx);
var res=M.vifFromCor(activeR), singular=false, aliased=[], cond=null, eig=null;
if(res.error){ singular=true; aliased=M.aliasedColumns(activeR).map(function(k){ return activeNames[k]; }); }
else { cond=res.cond; eig=res.eigenvalues; }
var preds=names.map(function(n){
var dropped=!!state.dropped[n], vif=NaN;
if(!dropped){ if(singular) vif=Infinity; else vif=res.vifs[activeNames.indexOf(n)]; }
return { name:n, dropped:dropped, vif:vif, aliased:aliased.indexOf(n)>=0 };
});
paint(preds, Object.assign(base,{ activeR:activeR, cond:cond, eig:eig, singular:singular, aliased:aliased, tooFew:false }));
}

function paint(preds, o){
var hasR=o.hasR, gvif=o.gvif, tooFew=!!o.tooFew, singular=!!o.singular;
var active=preds.filter(function(p){ return !p.dropped; });
var single = !hasR && preds.length<2;
var vifs=active.map(function(p){ return p.vif; });
var finite=vifs.filter(function(v){ return isFinite(v); });
var hasInf=vifs.some(function(v){ return !isFinite(v); });
var maxFinite=finite.length?Math.max.apply(null,finite):0;
var maxIdx=-1, best=-Infinity;
active.forEach(function(p,k){ var v=isFinite(p.vif)?p.vif:1e18; if(v>best){ best=v; maxIdx=k; } });
var maxv = (tooFew||single) ? NaN : (hasInf?Infinity:(finite.length?maxFinite:NaN));
var maxName = active[maxIdx] ? active[maxIdx].name : '';
var v = verdictOf(maxv);
var flagged = vifs.filter(function(x){ return !isFinite(x)||x>=state.high; }).length;
var minTol = isFinite(maxv)&&maxv>0 ? 1/maxv : 0;
var seMax = isFinite(maxFinite)&&maxFinite>0 ? Math.sqrt(maxFinite) : Infinity;
var anomaly = finite.some(function(x){ return x < 0.999; });

var chipCls='vchip', chipTxt, head, sub;
if(tooFew){ chipCls='vchip mod'; chipTxt='too few predictors'; head='Keep at least two predictors'; sub='VIF measures overlap between predictors, so at least two must stay in the model.'; }
else if(single){ chipCls='vchip mod'; chipTxt='one predictor'; head='Only one predictor'; sub='A single predictor has nothing to be collinear with, so VIF is not defined.'; }
else if(singular){ chipCls='vchip sev'; chipTxt='perfect collinearity'; head='Perfect collinearity'; sub='At least one predictor is an exact linear combination of the others, so VIFs are infinite.'; }
else { chipCls='vchip'+(v==='sev'?' sev':v==='mod'?' mod':'');
chipTxt='max VIF '+fmt(maxv, isFinite(maxv)?2:0);
head = v==='sev'?'Severe multicollinearity':v==='mod'?'Moderate multicollinearity':'Multicollinearity looks fine';
sub  = v==='sev'?'At least one coefficient is materially inflated and hard to trust.':v==='mod'?'Some overlap is inflating standard errors, but nothing alarming yet.':'Coefficients can be read without a collinearity caveat.';
}
$('vchip').className=chipCls; $('vchip').innerHTML=chipTxt;
$('vhead').textContent=head; $('vsub').textContent=sub;

$('omax').innerHTML = (tooFew||single) ? '-' : fmt(maxv, isFinite(maxv)?2:0);
$('omax').className='v '+((tooFew||single)?'':(v==='sev'?'sev':v==='mod'?'mod':'acc'));
$('ok').textContent = hasR ? (active.length+' / '+preds.length) : preds.length;
$('oflag').textContent=(tooFew||single)?'-':flagged; $('oflag').className='v'+(flagged>0&&!(tooFew||single)?(v==='sev'?' sev':' mod'):'');
$('otol').textContent=(tooFew||single)?'-':fmtT(minTol,3); $('otol').className='v';
if(hasR && !tooFew){
$('ocondk').textContent='Condition #';
if(singular){ $('ocond').innerHTML='&#8734;'; $('ocond').className='v sev'; }
else { $('ocond').innerHTML=fmt(o.cond,2); $('ocond').className='v'+(o.cond>=30?' sev':o.cond>=10?' mod':''); }
} else if(!hasR && !single){
$('ocondk').textContent='Max SE factor';
$('ocond').innerHTML=(hasInf?'&#8734;':(fmt(seMax,2)+'x')); $('ocond').className='v'+(hasInf?' sev':'');
} else { $('ocondk').textContent=hasR?'Condition #':'Max SE factor'; $('ocond').textContent='-'; $('ocond').className='v'; }

$('keeph').hidden=!hasR;
$('dfh').hidden=!gvif;
$('vrows').innerHTML=preds.map(function(p){
var dropped=p.dropped;
var f = dropped ? 'off' : flagOf(p.vif);
var tol = dropped ? NaN : M.tolerance(p.vif), se = dropped ? NaN : M.seInflation(p.vif);
var df = gvif ? (p.df!==undefined?String(p.df):'-') : '-';
var keepCell = hasR ? ('<td class="dc"><input type="checkbox" class="dchk" data-name="'+esc(p.name)+'"'+(dropped?'':' checked')+' aria-label="Keep '+esc(p.name)+' in the model"></td>') : '';
var vcell = dropped ? 'dropped' : (p.aliased ? '&#8734;' : fmt(p.vif, isFinite(p.vif)?2:0));
var tcell = dropped ? '-' : fmtT(tol,3);
var scell = dropped ? '-' : fmtT(se,2)+'x';
var flword = dropped ? 'Dropped' : (p.aliased ? 'Aliased' : flagWord(f));
return '<tr'+(dropped?' class="dropped"':'')+'>'+keepCell+
'<td class="name">'+esc(p.name)+'</td>'+
'<td class="num">'+vcell+'</td>'+
'<td class="num">'+tcell+'</td>'+
'<td class="num">'+scell+'</td>'+
(gvif?'<td class="num">'+df+'</td>':'')+
'<td><span class="fl '+f+'"><span class="dot"></span>'+flword+'</span></td></tr>';
}).join('');

drawBars(active.length?active:preds.map(function(p){ return { name:p.name, vif:NaN }; }));
$('vizcap').innerHTML=(tooFew||single)?'Add more predictors to see the chart.':'Dashed lines: moderate at '+fmt(state.low,fmtDec(state.low))+', severe at '+fmt(state.high,fmtDec(state.high))+'.';

renderGuide(o, active, maxv, v, tooFew, single, singular);

var co=[];
if(single) co.push(cwarn('<b>Add the other predictors.</b> Multicollinearity is about how predictors relate to each other, so paste every predictor from your model, not just one.'));
if(tooFew) co.push(cwarn('<b>Re-check a predictor.</b> You have fewer than two predictors left in the model. Tick some back on to compute VIFs.'));
if(anomaly && !hasR) co.push(cbad('<b>A VIF below 1 is impossible.</b> VIF is always at least 1. Check that you pasted variance inflation factors and not tolerances (1/VIF) or raw correlations.'));
if(singular){
co.push(cbad('<b>Singular correlation matrix.</b> '+(o.aliased.length?('<b>'+esc(o.aliased.join(', '))+'</b> can be reconstructed exactly from the other predictors'):'One predictor is an exact combination of the others')+'. Drop it before fitting the model; the rest are then estimable.'));
}
if(o.respDropped) co.push(cwarn('Dropped the column <b>'+esc(o.respDropped)+'</b> as the response. VIF is computed on predictors only.'));
if(o.rowsDropped) co.push(cwarn('Skipped <b>'+o.rowsDropped+'</b> row'+(o.rowsDropped===1?'':'s')+' with missing values (listwise deletion, as lm() does).'));
if(hasR && !tooFew && !singular && o.nrow!=null && o.nrow <= active.length+1) co.push(cwarn('<b>Few observations.</b> With '+o.nrow+' rows and '+active.length+' predictors the correlation matrix is barely estimable; add data or drop predictors.'));
if(!single && !tooFew && !singular){
var severe=active.filter(function(p){ return !isFinite(p.vif)||p.vif>=state.high; });
if(severe.length){
severe.slice(0,3).forEach(function(p){ co.push(cbad('<b>'+esc(p.name)+'</b> (VIF '+fmt(p.vif, isFinite(p.vif)?1:0)+') is above your severe threshold. Consider dropping it, merging it with the predictor it duplicates, or centering it if it is part of an interaction.')); });
} else if(v==='mod'){
co.push(cwarn('<b>'+esc(maxName)+'</b> carries the highest VIF ('+fmt(maxv,1)+'). It is not severe, but if that coefficient is central to your conclusions, confirm it is stable across specifications.'));
}
}
$('callout').innerHTML=co.join('');

var plainCls='plain'+((tooFew||single)?'':singular?' sev':(v==='sev'?' sev':v==='mod'?' mod':''));
var plain;
if(single) plain='With a single predictor there is no other variable for it to overlap with, so a variance inflation factor cannot be computed. Include the full set of predictors from your regression.';
else if(tooFew) plain='Fewer than two predictors remain in the model. Variance inflation factors describe how predictors overlap, so tick at least two back on to see them.';
else if(singular) plain='The predictor correlation matrix is <b>singular</b>: its determinant is zero, so it cannot be inverted and the VIFs are infinite. This is not a borderline case to interpret; it is a redundant predictor to remove'+(o.aliased.length?' (start with <b>'+esc(o.aliased.join(', '))+'</b>)':'')+'.';
else if(v==='sev') plain='<b>'+esc(maxName)+'</b> has the largest VIF at <b>'+fmt(maxv,2)+'</b>. That inflates its coefficient variance '+fmt(maxv,1)+' times and widens its standard error about <b>'+fmtT(seMax,2)+' times</b>, so the estimate is unstable and its p-value unreliable. Drop it, combine it with the predictor it echoes, or use a method built for collinearity such as ridge regression.';
else if(v==='mod') plain='The largest VIF is <b>'+fmt(maxv,2)+'</b> ('+esc(maxName)+'), which widens that standard error about <b>'+fmtT(seMax,2)+' times</b>. That is elevated but not alarming. Keep an eye on this coefficient, especially in a small sample or if it drives your conclusion.';
else plain='The largest VIF is <b>'+fmt(maxv,2)+'</b> ('+esc(maxName)+'), comfortably below your moderate threshold of '+fmt(state.low,fmtDec(state.low))+'. Multicollinearity is not distorting these coefficients; read them as they are.';
$('plain').className=plainCls; $('plain').innerHTML=plain;

if(hasR && !tooFew){
$('condbox').hidden=false;
if(singular){ $('condval').innerHTML='&#8734;'; $('condeig').textContent='Eigenvalues of R: '+eigStr(M.eigenvaluesSym(o.activeR))+' (one is zero).'; $('condnote').textContent='A zero eigenvalue is the signature of exact collinearity.'; }
else {
$('condval').innerHTML=fmt(o.cond,2);
$('condeig').textContent='Eigenvalues of R: '+eigStr(o.eig)+'.';
var cn = o.cond<10 ? 'Below 10 is comfortable: no whole-model collinearity signal here.' : o.cond<30 ? 'Between 10 and 30 hints at collinearity worth noting even where individual VIFs look tame.' : 'Above 30 is a strong signal (Belsley, Kuh and Welsch): collinearity is affecting the model as a whole.';
$('condnote').textContent='Computed as sqrt(largest / smallest eigenvalue of the correlation matrix), the same as kappa(scale(X), exact = TRUE) in R. '+cn;
}
renderHeat(o.activeR, o.activeNames, o.respDropped);
} else { $('condbox').hidden=true; $('heatbox').hidden=true; }

var inf;
if(single) inf='With one predictor there is nothing to assess: <b>add the rest of the model</b> to get variance inflation factors.';
else if(tooFew) inf='Fewer than two predictors are active, so <b>no VIF is defined</b>. Keep at least two.';
else if(singular) inf='Because the correlation matrix is singular, no coefficient in this set is identified: <b>remove the redundant predictor</b>'+(o.aliased.length?' ('+esc(o.aliased.join(', '))+')':'')+' and refit.';
else if(v==='sev') inf='Since the largest VIF ('+fmt(maxv,2)+' for '+esc(maxName)+') is at or above your severe threshold of '+fmt(state.high,fmtDec(state.high))+', <b>treat that coefficient as compromised</b>: multicollinearity is materially inflating its variance.'+(hasR&&o.cond>=30?' The condition number of '+fmt(o.cond,1)+' agrees.':'');
else if(v==='mod') inf='The largest VIF ('+fmt(maxv,2)+' for '+esc(maxName)+') falls between your thresholds of '+fmt(state.low,fmtDec(state.low))+' and '+fmt(state.high,fmtDec(state.high))+': <b>watch it</b>, but it is not yet a red flag.';
else inf='Every VIF is below '+fmt(state.low,fmtDec(state.low))+', so you can <b>read these coefficients without a multicollinearity caveat</b>.'+(hasR&&o.cond!=null?' The condition number of '+fmt(o.cond,1)+' confirms it.':'');
$('infline').innerHTML='<span class="ik">Inference</span>'+inf;

var rep;
if(tooFew||single) rep='VIF: not enough predictors in the model to compute a variance inflation factor.';
else if(singular) rep='VIF: perfect collinearity (singular matrix), '+active.length+' predictors, condition number infinite. Verdict: severe.';
else {
rep='VIF: max '+fmt(maxv,2)+' ('+maxName+'), tolerance '+fmtT(minTol,3)+', SE inflated '+fmtT(seMax,2)+'x';
if(hasR) rep+=', condition number '+fmt(o.cond,2);
if(o.dropList && o.dropList.length) rep+=' [after dropping '+o.dropList.join(', ')+']';
rep+='. Verdict: '+(v==='sev'?'severe':v==='mod'?'moderate':'low')+'.';
}
$('report').textContent=rep;

renderRCode(o, active, gvif, preds);
renderSteps(o, active, maxv, maxName, gvif, singular, tooFew, single);
}

function cwarn(h){ return '<div class="c warn"><span>&#9888;</span><span>'+h+'</span></div>'; }
function cbad(h){ return '<div class="c bad"><span>&#8594;</span><span>'+h+'</span></div>'; }
function eigStr(ev){ return ev.map(function(e){ return e.toFixed(4); }).join(', '); }

function renderGuide(o, active, maxv, v, tooFew, single, singular){
var g=$('guide');
if(!o.hasR || tooFew){ g.hidden=true; return; }
g.hidden=false;
var dropped=Object.keys(state.dropped).filter(function(n){ return o.names.indexOf(n)>=0; });
var greedy = M.greedyDropSet(o.activeR, o.activeNames, state.low);
var html='', cls='guide';
if(greedy.drop.length===0 && !singular){
cls='guide clear';
html='<div class="gt">Every active predictor is below your moderate threshold of <b>'+fmt(state.low,fmtDec(state.low))+'</b>. Nothing more to drop.</div>';
} else {
var maxRem = greedy.vifs.length ? Math.max.apply(null, greedy.vifs.map(function(x){ return isFinite(x)?x:1e18; })) : 0;
cls='guide'+(singular?' sev':'');
var names=greedy.drop.map(function(n){ return '<b>'+esc(n)+'</b>'; }).join(', ');
html='<div class="gt">Smallest fix: drop '+names+' and every remaining VIF falls under <b>'+fmt(state.low,fmtDec(state.low))+'</b>'+(isFinite(maxRem)&&greedy.vifs.length?' (largest left would be '+fmt(maxRem,2)+')':'')+'. Dropped in order of highest VIF first.</div>';
}
var btns='<div class="gbtns">';
if(greedy.drop.length) btns+='<button class="apply" id="gapply">Apply this drop</button>';
if(dropped.length) btns+='<button class="reset" id="greset">Reset ('+dropped.length+' dropped)</button>';
btns+='</div>';
g.className=cls; g.innerHTML=html+(greedy.drop.length||dropped.length?btns:'');
if($('gapply')) $('gapply').addEventListener('click',function(){ greedy.drop.forEach(function(n){ state.dropped[n]=1; }); calc(); });
if($('greset')) $('greset').addEventListener('click',function(){ state.dropped={}; calc(); });
o.dropList = dropped;
}

function drawBars(preds){
var W=640, L=118, RGAP=44, rowH=32, top=10, barW=W-L-RGAP;
var finite=preds.map(function(p){ return p.vif; }).filter(function(v){ return isFinite(v); });
var maxFinite=finite.length?Math.max.apply(null,finite):state.high;
var xmax=Math.max(state.high*1.35, maxFinite*1.08, state.low*1.6, state.high+2);
function X(v){ return L+Math.min(Math.max(v,0),xmax)/xmax*barW; }
var baseY=top+preds.length*rowH+6, g='';
[[state.low,'#e0a63a'],[state.high,'#b23b34']].forEach(function(t){
if(t[0]<=xmax){ var x=X(t[0]);
g+='<line x1="'+x.toFixed(1)+'" y1="'+top+'" x2="'+x.toFixed(1)+'" y2="'+baseY+'" stroke="'+t[1]+'" stroke-width="1.3" stroke-dasharray="4 3" opacity="0.85"/>';
g+='<text x="'+x.toFixed(1)+'" y="'+(baseY+15)+'" text-anchor="middle" font-family="Inter,sans-serif" font-size="10.5" fill="'+t[1]+'">'+fmt(t[0],fmtDec(t[0]))+'</text>';
}});
preds.forEach(function(p,i){
var y=top+i*rowH, barH=18, cy=y+(rowH-barH)/2;
var col=flagOf(p.vif)==='red'?'#b23b34':flagOf(p.vif)==='yellow'?'#e0a63a':'#1f7a55';
var end=X(isFinite(p.vif)?p.vif:xmax);
g+='<rect x="'+L+'" y="'+cy+'" width="'+barW+'" height="'+barH+'" rx="5" fill="#f2f2ee"/>';
if(isFinite(p.vif)||p.vif===Infinity) g+='<rect x="'+L+'" y="'+cy+'" width="'+Math.max(2,end-L).toFixed(1)+'" height="'+barH+'" rx="5" fill="'+col+'" opacity="0.9"/>';
g+='<text x="'+(L-8)+'" y="'+(cy+barH/2+4)+'" text-anchor="end" font-family="Inter,sans-serif" font-size="12.5" font-weight="600" fill="#14161b">'+esc(clip(p.name,14))+'</text>';
var vlabel=isFinite(p.vif)?p.vif.toFixed(2):(p.vif===Infinity?'∞':'-');
var inside=end>W-46;
g+='<text x="'+(inside?end-6:end+6).toFixed(1)+'" y="'+(cy+barH/2+4)+'" text-anchor="'+(inside?'end':'start')+'" font-family="ui-monospace,Consolas,monospace" font-size="11.5" font-weight="600" fill="'+(inside?'#fff':'#4d525b')+'">'+vlabel+'</text>';
});
g+='<line x1="'+L+'" y1="'+top+'" x2="'+L+'" y2="'+baseY+'" stroke="#d8d8d2" stroke-width="1"/>';
var svg=$('bars'); svg.setAttribute('viewBox','0 0 '+W+' '+(baseY+22)); svg.innerHTML=g;
}

function renderHeat(R, names, dropped){
if(!R || !R.length){ $('heatbox').hidden=true; return; }
var n=R.length, box=$('heatbox'); box.hidden=false;
var grid=$('hgrid');
grid.style.gridTemplateColumns='minmax(52px,auto) repeat('+n+',minmax(44px,1fr))';
var cells='<div class="hlabel"></div>', c, i, j;
for(c=0;c<n;c++) cells+='<div class="hlabel">'+esc(clip(names[c],8))+'</div>';
for(i=0;i<n;i++){
cells+='<div class="hlabel">'+esc(clip(names[i],8))+'</div>';
for(j=0;j<n;j++){
var r=R[i][j], mag=Math.min(Math.abs(r),1);
var bg=r>=0?'rgba(31,122,85,'+(0.12+mag*0.78).toFixed(3)+')':'rgba(178,59,52,'+(0.12+mag*0.78).toFixed(3)+')';
var fg=mag>0.5?'#fff':'#20242b';
cells+='<div class="hcell" style="background:'+bg+';color:'+fg+'">'+(isFinite(r)?r.toFixed(2):'-')+'</div>';
}}
grid.innerHTML=cells;
box.querySelector('.ht').textContent = dropped ? ('Predictor correlations (dropped response column: '+dropped+')') : 'Predictor correlations';
}

function renderSteps(o, active, maxv, maxName, gvif, singular, tooFew, single){
if(o.mode==='data'){
$('h1c').innerHTML='Each predictor column is standardized and the tool builds the predictor correlation matrix <code>R = cor(X)</code>. Any column named like a response (y, mpg, outcome) is dropped first, and rows with missing values are removed.';
$('h2c').innerHTML='Invert it. The VIF for predictor <em>j</em> is the <em>j</em>-th diagonal entry of <code>R&#8315;&#185;</code>, identical to <code>car::vif()</code>. Largest here: <b>'+((tooFew||single)?'-':fmt(maxv, isFinite(maxv)?2:0))+'</b>'+(maxName?' for '+esc(maxName):'')+'.';
} else if(o.mode==='cor'){
$('h1c').innerHTML='Start from the predictor correlation matrix R you pasted. Any column named like a response is dropped first.';
$('h2c').innerHTML='Invert it. The VIF for predictor <em>j</em> is the <em>j</em>-th diagonal entry of <code>R&#8315;&#185;</code>. Largest here: <b>'+((tooFew||single)?'-':fmt(maxv, isFinite(maxv)?2:0))+'</b>'+(maxName?' for '+esc(maxName):'')+'.';
} else if(gvif){
$('h1c').innerHTML='You pasted a GVIF table from <code>car::vif()</code> on a model with a factor.';
$('h2c').innerHTML='For each row the comparable VIF is <code>(GVIF^(1/(2&middot;Df)))&#178;</code>, which puts factors and numeric terms on one scale. Largest: <b>'+fmt(maxv,2)+'</b> for '+esc(maxName)+'.';
} else {
$('h1c').innerHTML='You pasted the VIFs straight from <code>car::vif()</code> (or an equivalent).';
$('h2c').innerHTML='The largest is <b>'+fmt(maxv, isFinite(maxv)?2:0)+'</b> for '+esc(maxName)+'. A VIF of '+fmt(maxv, isFinite(maxv)?1:0)+' means that coefficient variance is '+fmt(maxv, isFinite(maxv)?1:0)+' times what it would be with uncorrelated predictors.';
}
var tol=isFinite(maxv)&&maxv>0?1/maxv:0, se=isFinite(maxv)&&maxv>0?Math.sqrt(maxv):Infinity;
$('h3c').innerHTML='Tolerance = <code>1 / VIF = '+fmtT(tol,3)+'</code>; the standard error is inflated by <code>sqrt(VIF) = '+fmtT(se,2)+'</code> times.';
if(o.hasR && !tooFew){
$('h4c').innerHTML='Uncheck a predictor and its row and column leave R, so every remaining VIF is recomputed from the smaller matrix. The condition number <code>sqrt(&lambda;max / &lambda;min)</code> tracks whole-model collinearity that a single VIF can miss.';
} else {
$('h4c').innerHTML='For a whole-model check and the drop-a-predictor loop, switch to predictor-data or correlation-matrix mode.';
}
}

function renderRCode(o, active, gvif, preds){
var code;
if((o.mode==='data'||o.mode==='cor') && o.activeR && active.length>=2){
var n=o.activeR.length, lines=[], i;
for(i=0;i<n;i++) lines.push('  '+o.activeR[i].map(function(x){ return trimNum(x); }).join(', ')+(i<n-1?',':''));
var namesVec=o.activeNames.map(function(s){ return '"'+s+'"'; }).join(', ');
var head = o.mode==='data'
? ('library(car)\n# On your data frame d, VIF of the predictors still in the model:\nvif(lm(y ~ '+o.activeNames.map(nm).join(' + ')+', data = d))\n\n# Reproduce the exact VIFs shown here from the predictor correlation matrix:\n')
: ('# predictor correlation matrix\n');
code = head+
'R <- matrix(c(\n'+lines.join('\n')+'\n), nrow = '+n+', byrow = TRUE)\n'+
'colnames(R) <- rownames(R) <- c('+namesVec+')\n\n'+
'vif <- diag(solve(R))          # variance inflation factors\n'+
'tol <- 1 / vif                 # tolerance\n'+
'ev  <- eigen(R)$values\n'+
'kappa <- sqrt(max(ev) / min(ev))   # condition number\n\n'+
'round(vif, 3)\n'+
'round(kappa, 2)';
} else if(gvif){
var adj=preds.map(function(p){ return nm(p.name)+' = '+trimNum(p.adj); });
code='library(car)\nvif(model)          # GVIF, Df, GVIF^(1/(2*Df))\n\n# square the last column to compare against usual VIF cutoffs:\nadj <- c('+adj.join(', ')+')\ncomparable_vif <- adj^2\nround(comparable_vif, 3)';
} else if(o.mode==='vals'){
var vv=preds.map(function(p){ return nm(p.name)+' = '+trimNum(p.vif); });
code='library(car)\nvif(model)          # the VIFs you pasted\n\nv   <- c('+vv.join(', ')+')\ntol <- 1 / v                 # tolerance\nsei <- sqrt(v)               # standard-error inflation factor\nround(rbind(VIF = v, Tolerance = tol, SE = sei), 3)';
} else {
code='# Keep at least two predictors in the model to compute VIFs.';
}
$('rcodepre').textContent=code;
}

var IWANT={ data:'compute VIF from my predictor data', cor:'compute VIF from a correlation matrix', vals:'interpret VIF values I already have' };
function renderIwant(){
var el=$('iwant'); if(!el) return;
var opts=Object.keys(IWANT).map(function(k){ return '<option value="'+k+'"'+(state.mode===k?' selected':'')+'>'+IWANT[k]+'</option>'; }).join('');
el.innerHTML='I want to <span class="psel">'+IWANT[state.mode]+'<span class="pcaret">&#9662;</span><select aria-label="What do you want to do?">'+opts+'</select></span>.';
el.querySelector('select').addEventListener('change',function(){ setMode(this.value); });
}
function setMode(m){
if(m!==state.mode){ state.dropped={}; }
state.mode=m;
document.querySelectorAll('.mode').forEach(function(o){ o.classList.toggle('on', o.dataset.mode===m); });
document.querySelectorAll('.iobox').forEach(function(b){ b.hidden = b.dataset.io!==m; });
renderIwant(); calc();
}

document.querySelectorAll('.mode').forEach(function(b){ b.addEventListener('click',function(){ setMode(b.dataset.mode); }); });
document.querySelectorAll('.chip').forEach(function(b){ b.addEventListener('click',function(){
document.querySelectorAll('.chip').forEach(function(o){ o.classList.remove('on'); }); b.classList.add('on');
var pre=PRESETS[b.dataset.scen]; if(!pre) return;
state.dropped={};
if(pre.mode==='data') $('datain').value=pre.text; else if(pre.mode==='cor') $('corin').value=pre.text; else $('valsin').value=pre.text;
setMode(pre.mode);
});});
$('vrows').addEventListener('change',function(e){
var t=e.target; if(!t.classList||!t.classList.contains('dchk')) return;
var name=t.getAttribute('data-name');
if(t.checked) delete state.dropped[name]; else state.dropped[name]=1;
calc();
});
function bindThresh(numId, rangeId, key, dir){
var ni=$(numId), ri=$(rangeId);
function apply(val){
val=+val; if(!isFinite(val)) return;
state[key]=val; ni.value=val; if(+ri.value!==val && val>=+ri.min && val<=+ri.max) ri.value=val;
if(dir==='low' && state.low>state.high){ state.high=state.low; $('high').value=state.high; if(state.high<=+$('highr').max) $('highr').value=state.high; }
if(dir==='high' && state.high<state.low){ state.low=state.high; $('low').value=state.low; if(state.low>=+$('lowr').min) $('lowr').value=state.low; }
calc();
}
ni.addEventListener('input',function(){ apply(ni.value); });
ri.addEventListener('input',function(){ apply(ri.value); });
}
bindThresh('low','lowr','low','low');
bindThresh('high','highr','high','high');
$('datain').addEventListener('input',function(){ state.dropped={}; calc(); });
$('corin').addEventListener('input',function(){ state.dropped={}; calc(); });
$('valsin').addEventListener('input',calc);

$('datain').value=PRESETS.collinear.text;
$('corin').value=PRESETS.cormat.text;
$('valsin').value=PRESETS.vals.text;
renderIwant();
calc();
})();
