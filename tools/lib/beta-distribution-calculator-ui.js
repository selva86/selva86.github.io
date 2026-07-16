/* beta-distribution-calculator-ui.js - page engine for
   tools/beta-distribution-calculator.html.

   Externalised purely for page weight: inline, this pushed the rendered
   outerHTML to 206KB against the 200KB tool-audit ceiling. The GA hooks
   deliberately stay inline on the page (window.RSTrack) because the audit
   greps the RENDERED html for tool_use / tool_copy.

   Math lives in tools/lib/beta-math.js; this file is wiring only. */
(function(){
'use strict';
var M = window.BetaMath;
var $ = function(id){ return document.getElementById(id); };
var state = { mode:'below' };
var usedOnce = false;

function fmt(x,d){
  if (x === Infinity) return '&#8734;';
  if (!isFinite(x)) return '-';
  return x.toFixed(d===undefined?4:d);
}
function pctFmt(p){
  var v = p*100;
  if (v>99.99 && v<100) return '>99.99';
  if (v>0 && v<0.01) return '<0.01';
  return v.toFixed(2);
}
// Density can be enormous or infinite, so it gets significant digits, not decimals.
function dFmt(x){
  if (x === Infinity) return '&#8734;';
  if (!isFinite(x)) return '-';
  if (x === 0) return '0';
  if (x >= 1000 || x < 0.001) return x.toExponential(2);
  return x.toPrecision(4).replace(/\.?0+$/,'');
}
// R prints 7 significant digits and switches to scientific below 1e-4.
// The #> comments in the emitted block are a contract: they must be what R
// actually prints, so this mirrors R's formatting rather than JS defaults.
function rnum(x){
  if (x === 0) return '0';
  if (x === Infinity) return 'Inf';
  if (!isFinite(x)) return 'NaN';
  var ax = Math.abs(x);
  if (ax >= 1e-4 && ax < 1e5) return String(parseFloat(x.toPrecision(7)));
  var m = parseFloat(x.toPrecision(7)).toExponential();
  var parts = m.split('e'), ex = parseInt(parts[1],10);
  var aex = Math.abs(ex);
  return parts[0] + 'e' + (ex<0?'-':'+') + (aex<10?'0'+aex:''+aex);
}
// Drop a trailing ".0" so emitted R reads dbeta(0.3, 31, 71) not 31.0
function rp(x){ return String(parseFloat(x.toPrecision(15))); }

var IWANT = {
  below:    'find the chance a proportion is below a value',
  above:    'find the chance a proportion is above a value',
  between:  'find the chance it lands between two values',
  quantile: 'work back from a probability to a value'
};
function buildIwant(){
  var el = $('iwant'), opts = '';
  for (var k in IWANT) opts += '<option value="'+k+'"'+(k===state.mode?' selected':'')+'>'+IWANT[k]+'</option>';
  el.innerHTML = 'I want to <span class="psel">'+IWANT[state.mode]+'<span class="pcaret">&#9662;</span><select id="iwsel" aria-label="What do you want to do">'+opts+'</select></span>';
  $('iwsel').addEventListener('change', function(){ state.mode = this.value; applyMode(); });
}

var SCEN = {
  posterior:{ mode:'quantile', pa:31, pb:71, pp:95, reg:'central',
    hint:'30 conversions out of 100, on top of a flat prior. The band is the 95% credible interval.' },
  target:{ mode:'above', pa:31, pb:71, xc:0.35,
    hint:'Given that same posterior, how much belief sits above a 35% target?' },
  uniform:{ mode:'below', pa:1, pb:1, xc:0.5,
    hint:'Beta(1,1) is Uniform(0,1): the density is flat at 1 and the CDF is just x.' },
  skew:{ mode:'below', pa:2, pb:8, xc:0.2,
    hint:'A prior that says the rate is probably small: like 1 success in 8 tries.' },
  spike:{ mode:'below', pa:0.5, pb:0.5, xc:0.01,
    hint:'With alpha below 1 the density is infinite at 0, yet the area is still 1.' }
};

function applyMode(){
  document.querySelectorAll('.mode').forEach(function(b){ b.classList.toggle('on', b.dataset.mode===state.mode); });
  $('in-cut').hidden  = !(state.mode==='below' || state.mode==='above');
  $('in-band').hidden = state.mode!=='between';
  $('in-inv').hidden  = state.mode!=='quantile';
  $('cutlabel').textContent = state.mode==='above' ? 'The cutoff' : 'The cutoff';
  buildIwant();
  calc();
}

function err(msg){
  $('ierr').textContent = msg; $('ierr').classList.add('show');
  $('vhead').textContent = '-'; $('vsub').textContent = '';
  $('report').textContent = '';
  $('curve').innerHTML = '';
}
function clearErr(){ $('ierr').classList.remove('show'); }

// ---- the shaded curve -------------------------------------------------
// Sampled on a fixed grid. The y-scale is set from the BODY of the
// distribution (the middle 96%), not the global max: when alpha < 1 the
// density is infinite at 0, and scaling to that would flatten every other
// curve into the baseline. Anything taller than the frame is clipped.
function drawCurve(a,b,shades,marks){
  var W=640,H=210,L=34,R=16,B=30,T=12;
  var N=480, i, xx, d;
  var pts=[];
  for(i=0;i<=N;i++){ xx=i/N; pts.push([xx, M.dbeta(xx,a,b)]); }
  var lo2=M.qbeta(0.02,a,b), hi2=M.qbeta(0.98,a,b), ymax=0;
  for(i=0;i<=N;i++){
    xx=pts[i][0]; d=pts[i][1];
    if(xx>=lo2 && xx<=hi2 && isFinite(d) && d>ymax) ymax=d;
  }
  if(!(ymax>0)) ymax=1;
  ymax*=1.15;
  var px=function(t){ return L + t*(W-L-R); };
  var py=function(v){ var y=H-B-(v/ymax)*(H-B-T); return y<T?T:y; };
  var s='';
  // shaded regions first, under the curve line
  (shades||[]).forEach(function(sh){
    var s0=Math.max(0,Math.min(1,sh[0])), s1=Math.max(0,Math.min(1,sh[1]));
    if(!(s1>s0)) return;
    var p='M '+px(s0)+' '+(H-B);
    for(i=0;i<=N;i++){ xx=pts[i][0]; if(xx<s0||xx>s1) continue; p+=' L '+px(xx).toFixed(2)+' '+py(pts[i][1]).toFixed(2); }
    p+=' L '+px(s1)+' '+(H-B)+' Z';
    s+='<path d="'+p+'" fill="#1f7a55" fill-opacity="0.18"></path>';
  });
  // the density curve
  var c='';
  for(i=0;i<=N;i++){ c+=(i?' L ':'M ')+px(pts[i][0]).toFixed(2)+' '+py(pts[i][1]).toFixed(2); }
  s+='<path d="'+c+'" fill="none" stroke="#1f7a55" stroke-width="2" stroke-linejoin="round"></path>';
  // baseline + ticks
  s+='<line x1="'+L+'" y1="'+(H-B)+'" x2="'+(W-R)+'" y2="'+(H-B)+'" stroke="#c9ccd1" stroke-width="1"></line>';
  [0,0.25,0.5,0.75,1].forEach(function(t){
    s+='<line x1="'+px(t)+'" y1="'+(H-B)+'" x2="'+px(t)+'" y2="'+(H-B+5)+'" stroke="#c9ccd1"></line>';
    s+='<text x="'+px(t)+'" y="'+(H-B+18)+'" text-anchor="middle" font-family="Inter,sans-serif" font-size="11" fill="#888e97">'+t+'</text>';
  });
  // markers
  (marks||[]).forEach(function(mk){
    if(!isFinite(mk.at)) return;
    var t=Math.max(0,Math.min(1,mk.at));
    s+='<line x1="'+px(t)+'" y1="'+T+'" x2="'+px(t)+'" y2="'+(H-B)+'" stroke="#155c40" stroke-width="1.5" stroke-dasharray="4 3"></line>';
    s+='<text x="'+px(t)+'" y="'+(T-2)+'" text-anchor="middle" font-family="Inter,sans-serif" font-size="10.5" fill="#155c40">'+mk.label+'</text>';
  });
  $('curve').innerHTML=s;
}

function modeText(a,b,mo){
  if(mo!==null) return fmt(mo,4);
  if(a===1&&b===1) return 'flat';
  return '0 and 1';
}
function modeNote(a,b,mo){
  if(mo!==null) return '';
  if(a===1&&b===1) return ' Beta(1, 1) is flat, so every value is equally likely and there is no single peak.';
  return ' With both shapes below 1 the curve piles up at 0 and at 1, so it has two peaks, not one.';
}

function calc(){
  var a=parseFloat($('pa').value), b=parseFloat($('pb').value);
  if(!isFinite(a)||!isFinite(b)) return err('Enter both shape parameters.');
  if(a<=0||b<=0) return err('Alpha and beta must both be greater than 0. They are counts of evidence, so zero or negative has no meaning.');
  clearErr();
  if(!usedOnce){ usedOnce=true; RSTrack.use(); }

  var mo=M.moments(a,b);
  $('vchip').textContent='Beta('+rp(a)+', '+rp(b)+')';
  $('d1').textContent=fmt(mo.mean,4);
  $('d2').textContent=mo.var<0.0001?mo.var.toExponential(2):fmt(mo.var,5);
  $('d3').textContent=fmt(mo.sd,4);
  $('d4').textContent=modeText(a,b,mo.mode);

  var r, rcode, plain, inf, report;
  var pc=M.pseudoCounts(a,b);
  var pcRead = (a>=1&&b>=1&&(a>1||b>1))
    ? 'Read as pseudo-counts, Beta('+rp(a)+', '+rp(b)+') is what you hold after <b>'+rp(pc.successes)+' successes and '+rp(pc.failures)+' failures</b> on top of a flat prior. '
    : '';

  if(state.mode==='below'||state.mode==='above'){
    var x=parseFloat($('xc').value);
    if(!isFinite(x)) return err('Enter a cutoff.');
    if(x<0||x>1) return err('The cutoff must sit between 0 and 1. A beta distribution has no mass outside that interval.');
    r=M.analyze('below',{a:a,b:b,x:x});
    var isB=state.mode==='below', p=isB?r.p_below:r.p_above;
    $('vhead').innerHTML='P(X '+(isB?'&le;':'&gt;')+' '+rp(x)+') = '+fmt(p,4);
    $('vsub').textContent=pctFmt(p)+'% of the distribution lies '+(isB?'at or below ':'above ')+rp(x)+'.';
    $('k1').innerHTML='P(X &le; x)'; $('v1').innerHTML=fmt(r.p_below,4);
    $('k2').innerHTML='P(X &gt; x)'; $('v2').innerHTML=fmt(r.p_above,4);
    $('k3').innerHTML='Density f(x)'; $('v3').innerHTML=dFmt(r.d);
    $('k4').innerHTML='Percentile'; $('v4').innerHTML=pctFmt(r.p_below)+'%';
    $('v1').className='v'+(isB?' acc':''); $('v2').className='v'+(isB?'':' acc');
    drawCurve(a,b,[isB?[0,x]:[x,1]],[{at:x,label:'x = '+rp(x)}]);
    plain=pcRead+'Its mean is <b>'+fmt(mo.mean,4)+'</b>'+(mo.mode!==null?' and it peaks at <b>'+fmt(mo.mode,4)+'</b>':'')+'.'+modeNote(a,b,mo.mode)
      +' The height at '+rp(x)+' is '+dFmt(r.d)+', which is a <b>density, not a probability</b>: only the shaded area is a probability.';
    var surp = p<0.01?'so a proportion in that region would be a real surprise':(p<0.05?'so a proportion in that region would be unusual':(p>0.5?'so that region holds most of the belief':'so that region is entirely plausible'));
    inf='<b>'+pctFmt(p)+'%</b> of a Beta('+rp(a)+', '+rp(b)+') lies '+(isB?'at or below ':'above ')+'<b>'+rp(x)+'</b>, '+surp+'.';
    report='Beta('+rp(a)+', '+rp(b)+'): P(X '+(isB?'<=':'>')+' '+rp(x)+') = '+fmt(p,4)+'; mean = '+fmt(mo.mean,4)+', SD = '+fmt(mo.sd,4)+'.';
    rcode='# Beta('+rp(a)+', '+rp(b)+'): density and both tails at x = '+rp(x)+'\n'
      +'dbeta('+rp(x)+', '+rp(a)+', '+rp(b)+')'+pad('dbeta('+rp(x)+', '+rp(a)+', '+rp(b)+')')+'#> '+rnum(r.d)+'\n'
      +'pbeta('+rp(x)+', '+rp(a)+', '+rp(b)+')'+pad('pbeta('+rp(x)+', '+rp(a)+', '+rp(b)+')')+'#> '+rnum(r.p_below)+'\n'
      +'pbeta('+rp(x)+', '+rp(a)+', '+rp(b)+', lower.tail = FALSE)'+pad('pbeta('+rp(x)+', '+rp(a)+', '+rp(b)+', lower.tail = FALSE)')+'#> '+rnum(r.p_above)+'\n\n'
      +'# the curve, shaded like the picture above\n'
      +'curve(dbeta(x, '+rp(a)+', '+rp(b)+'), from = 0, to = 1,\n'
      +'      xlab = "proportion", ylab = "density")';
    $('h1c').innerHTML='The density at '+rp(x)+' is x<sup>&alpha;-1</sup>(1-x)<sup>&beta;-1</sup> / B('+rp(a)+', '+rp(b)+') = '+dFmt(r.d)+'.';
    $('h2c').innerHTML='The shaded area is the regularized incomplete beta function I<sub>'+rp(x)+'</sub>('+rp(a)+', '+rp(b)+') = '+fmt(r.p_below,6)+', so the other tail is '+fmt(r.p_above,6)+'.';
  }

  else if(state.mode==='between'){
    var lo=parseFloat($('ba').value), hi=parseFloat($('bb').value);
    if(!isFinite(lo)||!isFinite(hi)) return err('Enter both bounds.');
    if(lo<0||hi>1||lo>1||hi<0) return err('Both bounds must sit between 0 and 1. A beta distribution has no mass outside that interval.');
    if(hi<lo) return err('The upper bound is below the lower bound. Swap them.');
    r=M.analyze('between',{a:a,b:b,lo:lo,hi:hi});
    $('vhead').innerHTML='P('+rp(lo)+' &le; X &le; '+rp(hi)+') = '+fmt(r.p_between,4);
    $('vsub').textContent=pctFmt(r.p_between)+'% of the distribution falls inside that band.';
    $('k1').innerHTML='P(inside)'; $('v1').innerHTML=fmt(r.p_between,4);
    $('k2').innerHTML='P(outside)'; $('v2').innerHTML=fmt(r.p_outside,4);
    $('k3').innerHTML='P(X &le; lower)'; $('v3').innerHTML=fmt(r.p_lo,4);
    $('k4').innerHTML='P(X &le; upper)'; $('v4').innerHTML=fmt(r.p_hi,4);
    $('v1').className='v acc'; $('v2').className='v';
    drawCurve(a,b,[[lo,hi]],[{at:lo,label:rp(lo)},{at:hi,label:rp(hi)}]);
    plain=pcRead+'The band from '+rp(lo)+' to '+rp(hi)+' holds <b>'+pctFmt(r.p_between)+'%</b> of the belief, leaving '+pctFmt(r.p_outside)+'% outside it. If this Beta is a posterior, that first figure is the probability the true rate sits in the band.';
    inf='<b>'+pctFmt(r.p_between)+'%</b> of a Beta('+rp(a)+', '+rp(b)+') lies between <b>'+rp(lo)+'</b> and <b>'+rp(hi)+'</b>, computed as pbeta('+rp(hi)+') - pbeta('+rp(lo)+') = '+fmt(r.p_hi,4)+' - '+fmt(r.p_lo,4)+'.';
    report='Beta('+rp(a)+', '+rp(b)+'): P('+rp(lo)+' <= X <= '+rp(hi)+') = '+fmt(r.p_between,4)+'; mean = '+fmt(mo.mean,4)+', SD = '+fmt(mo.sd,4)+'.';
    rcode='# Beta('+rp(a)+', '+rp(b)+'): the mass between '+rp(lo)+' and '+rp(hi)+'\n'
      +'pbeta('+rp(hi)+', '+rp(a)+', '+rp(b)+') - pbeta('+rp(lo)+', '+rp(a)+', '+rp(b)+')'+pad('pbeta('+rp(hi)+', '+rp(a)+', '+rp(b)+') - pbeta('+rp(lo)+', '+rp(a)+', '+rp(b)+')')+'#> '+rnum(r.p_between)+'\n\n'
      +'# the curve, shaded like the picture above\n'
      +'curve(dbeta(x, '+rp(a)+', '+rp(b)+'), from = 0, to = 1,\n'
      +'      xlab = "proportion", ylab = "density")';
    $('h1c').innerHTML='The area up to '+rp(hi)+' is '+fmt(r.p_hi,6)+' and the area up to '+rp(lo)+' is '+fmt(r.p_lo,6)+'.';
    $('h2c').innerHTML='Subtracting leaves the band: '+fmt(r.p_hi,6)+' - '+fmt(r.p_lo,6)+' = '+fmt(r.p_between,6)+'.';
  }

  else {
    var pv=parseFloat($('pp').value), reg=$('reg').value;
    if(!isFinite(pv)) return err('Enter a probability.');
    if(pv<0||pv>100) return err('The probability must be between 0 and 100%.');
    var p=pv/100, q, q2, shades, marks;
    if(reg==='left'){
      q=M.qbeta(p,a,b);
      $('vhead').innerHTML='x = '+fmt(q,4);
      $('vsub').textContent=pctFmt(p)+'% of the distribution lies at or below that value.';
      $('k1').innerHTML='Value (x)'; $('v1').innerHTML=fmt(q,4);
      $('k2').innerHTML='Area to its left'; $('v2').innerHTML=fmt(p,4);
      $('k3').innerHTML='Area to its right'; $('v3').innerHTML=fmt(1-p,4);
      $('k4').innerHTML='Density there'; $('v4').innerHTML=dFmt(M.dbeta(q,a,b));
      shades=[[0,q]]; marks=[{at:q,label:'x = '+fmt(q,4)}];
      inf='<b>'+fmt(q,4)+'</b> is the value with <b>'+pctFmt(p)+'%</b> of a Beta('+rp(a)+', '+rp(b)+') at or below it, so it is the '+pctFmt(p)+'th percentile of this distribution.';
      report='Beta('+rp(a)+', '+rp(b)+'): the '+pctFmt(p)+'th percentile is '+fmt(q,4)+'.';
      rcode='# Beta('+rp(a)+', '+rp(b)+'): the value with '+rp(p*100)+'% of the mass below it\n'
        +'qbeta('+rp(p)+', '+rp(a)+', '+rp(b)+')'+pad('qbeta('+rp(p)+', '+rp(a)+', '+rp(b)+')')+'#> '+rnum(q)+'';
      plain=pcRead+'Ask for a left-hand area and you get back the cutoff that marks it. <b>'+pctFmt(p)+'%</b> of the belief sits at or below <b>'+fmt(q,4)+'</b>.';
      $('h1c').innerHTML='qbeta inverts the CDF: it looks for the x where the area to the left equals '+fmt(p,4)+'.';
      $('h2c').innerHTML='That x is '+fmt(q,6)+'. Checking it: pbeta('+fmt(q,6)+', '+rp(a)+', '+rp(b)+') = '+fmt(M.pbeta(q,a,b),6)+'.';
    } else if(reg==='right'){
      q=M.qbetaUpper(p,a,b);
      $('vhead').innerHTML='x = '+fmt(q,4);
      $('vsub').textContent=pctFmt(p)+'% of the distribution lies above that value.';
      $('k1').innerHTML='Value (x)'; $('v1').innerHTML=fmt(q,4);
      $('k2').innerHTML='Area to its right'; $('v2').innerHTML=fmt(p,4);
      $('k3').innerHTML='Area to its left'; $('v3').innerHTML=fmt(1-p,4);
      $('k4').innerHTML='Density there'; $('v4').innerHTML=dFmt(M.dbeta(q,a,b));
      shades=[[q,1]]; marks=[{at:q,label:'x = '+fmt(q,4)}];
      inf='<b>'+fmt(q,4)+'</b> is the value with <b>'+pctFmt(p)+'%</b> of a Beta('+rp(a)+', '+rp(b)+') above it, so it is the '+pctFmt(1-p)+'th percentile of this distribution.';
      report='Beta('+rp(a)+', '+rp(b)+'): '+pctFmt(p)+'% of the mass lies above '+fmt(q,4)+'.';
      rcode='# Beta('+rp(a)+', '+rp(b)+'): the value with '+rp(p*100)+'% of the mass ABOVE it\n'
        +'qbeta('+rp(p)+', '+rp(a)+', '+rp(b)+', lower.tail = FALSE)'+pad('qbeta('+rp(p)+', '+rp(a)+', '+rp(b)+', lower.tail = FALSE)')+'#> '+rnum(q)+'';
      plain=pcRead+'Ask for a right-hand area and you get back the cutoff that marks it. <b>'+pctFmt(p)+'%</b> of the belief sits above <b>'+fmt(q,4)+'</b>.';
      $('h1c').innerHTML='The upper tail is solved directly rather than as 1 minus the left area, which keeps small tails exact.';
      $('h2c').innerHTML='That x is '+fmt(q,6)+'. Checking it: the area above is '+fmt(M.sfbeta(q,a,b),6)+'.';
    } else {
      var tail=(1-p)/2;
      q=M.qbeta(tail,a,b); q2=M.qbeta(1-tail,a,b);
      $('vhead').innerHTML=fmt(q,4)+' to '+fmt(q2,4);
      $('vsub').textContent='The central '+pctFmt(p)+'% of the distribution, with '+pctFmt(tail)+'% left in each tail.';
      $('k1').innerHTML='Lower end'; $('v1').innerHTML=fmt(q,4);
      $('k2').innerHTML='Upper end'; $('v2').innerHTML=fmt(q2,4);
      $('k3').innerHTML='Width'; $('v3').innerHTML=fmt(q2-q,4);
      $('k4').innerHTML='Each tail'; $('v4').innerHTML=pctFmt(tail)+'%';
      shades=[[q,q2]]; marks=[{at:q,label:fmt(q,4)},{at:q2,label:fmt(q2,4)}];
      inf='<b>'+pctFmt(p)+'%</b> of a Beta('+rp(a)+', '+rp(b)+') lies between <b>'+fmt(q,4)+'</b> and <b>'+fmt(q2,4)+'</b>. If this Beta is a posterior, that is your '+pctFmt(p)+'% credible interval for the rate.';
      report='Beta('+rp(a)+', '+rp(b)+'): central '+pctFmt(p)+'% interval = ['+fmt(q,4)+', '+fmt(q2,4)+'].';
      rcode='# Beta('+rp(a)+', '+rp(b)+'): the central '+rp(p*100)+'% interval\n'
        +'qbeta(c('+rp(tail)+', '+rp(1-tail)+'), '+rp(a)+', '+rp(b)+')'+pad('qbeta(c('+rp(tail)+', '+rp(1-tail)+'), '+rp(a)+', '+rp(b)+')')+'#> '+rnum(q)+' '+rnum(q2)+'';
      plain=pcRead+'Cutting '+pctFmt(tail)+'% off each tail leaves the central <b>'+pctFmt(p)+'%</b>, from <b>'+fmt(q,4)+'</b> to <b>'+fmt(q2,4)+'</b>. When the Beta is a posterior this is the credible interval, and it means what people wish a confidence interval meant: there is a '+pctFmt(p)+'% probability the rate is in there.';
      $('h1c').innerHTML='A central '+pctFmt(p)+'% band leaves '+pctFmt(tail)+'% in each tail, so the ends are the '+fmt(tail,4)+' and '+fmt(1-tail,4)+' quantiles.';
      $('h2c').innerHTML='qbeta returns '+fmt(q,6)+' and '+fmt(q2,6)+'; the mass between them is '+fmt(M.pbeta(q2,a,b)-M.pbeta(q,a,b),6)+'.';
    }
    $('v1').className='v acc'; $('v2').className='v';
    drawCurve(a,b,shades,marks);
  }

  $('plain').innerHTML=plain;
  $('inference-line').innerHTML='<span class="ik">What this means</span>'+inf;
  $('report').textContent=report;
  $('rcodepre').textContent=rcode;
}
// line up the #> comments in the emitted R
function pad(code){
  var target=52, n=target-code.length;
  return n>0 ? new Array(n+1).join(' ') : '  ';
}

document.querySelectorAll('.chip').forEach(function(btn){ btn.addEventListener('click',function(){
  var sc=SCEN[btn.dataset.scen]; if(!sc) return;
  state.mode=sc.mode;
  if(sc.pa!==undefined) $('pa').value=sc.pa;
  if(sc.pb!==undefined) $('pb').value=sc.pb;
  if(sc.xc!==undefined) $('xc').value=sc.xc;
  if(sc.ba!==undefined) $('ba').value=sc.ba;
  if(sc.bb!==undefined) $('bb').value=sc.bb;
  if(sc.pp!==undefined) $('pp').value=sc.pp;
  if(sc.reg!==undefined) $('reg').value=sc.reg;
  applyMode();
  if(sc.hint) $('hint').textContent=sc.hint;
});});
document.querySelectorAll('.mode').forEach(function(btn){ btn.addEventListener('click',function(){
  state.mode=btn.dataset.mode; applyMode();
});});
document.querySelectorAll('input').forEach(function(el){ el.addEventListener('input',calc); });
$('reg').addEventListener('change',calc);
$('copybtn').addEventListener('click',function(){
  navigator.clipboard.writeText($('report').textContent).then(function(){
    $('copybtn').textContent='Copied'; setTimeout(function(){$('copybtn').textContent='Copy result line';},1400);
    RSTrack.copy('report');
  });
});
$('rcopy').addEventListener('click',function(){
  navigator.clipboard.writeText($('rcodepre').textContent).then(function(){
    $('rcopy').textContent='Copied'; setTimeout(function(){$('rcopy').textContent='Copy code';},1400);
    RSTrack.copy('rcode');
  });
});
applyMode();
})();
