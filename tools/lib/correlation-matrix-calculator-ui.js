/* correlation-matrix-calculator-ui.js - the page engine for
   tools/correlation-matrix-calculator.html. Lives out of line so the rendered
   page stays under the 200KB tool-audit ceiling; there is no other reason to
   split it. All the maths is in correlation-matrix-math.js (which is verified
   against R); this file only renders it.

   Every preset below reproduces the R truth table exactly
   (Scripts/tool-truth/correlation-matrix-calculator.json).

   Browser global CorrMatrixUI. Call CorrMatrixUI.boot() once the DOM is ready. */
(function (root) {
'use strict';
var CM = window.CorrMatrixMath;
var $ = function(id){ return document.getElementById(id); };
/* Analytics hooks live in the page's inline boot script (the tool audit greps
   the rendered HTML for the event names), so the lib just calls back into them. */
function firstUse(){ if(root.__cmxGA) root.__cmxGA.use(); }
function gaCopy(what){ if(root.__cmxGA) root.__cmxGA.copy(what); }

var state = { mode:'matrix', method:'pearson', deletion:'pairwise', showp:true, shown:true, focal:0 };

/* Presets. Every one of these reproduces the R truth table exactly
   (Scripts/tool-truth/correlation-matrix-calculator.json), so the rendered
   matrix is the same matrix R prints for the same data. */
var SCEN = {
  mtcars: "mpg\thp\twt\tdisp\tqsec\n21\t110\t2.62\t160\t16.46\n21\t110\t2.875\t160\t17.02\n22.8\t93\t2.32\t108\t18.61\n21.4\t110\t3.215\t258\t19.44\n18.7\t175\t3.44\t360\t17.02\n18.1\t105\t3.46\t225\t20.22\n14.3\t245\t3.57\t360\t15.84\n24.4\t62\t3.19\t146.7\t20\n22.8\t95\t3.15\t140.8\t22.9\n19.2\t123\t3.44\t167.6\t18.3\n17.8\t123\t3.44\t167.6\t18.9\n16.4\t180\t4.07\t275.8\t17.4\n17.3\t180\t3.73\t275.8\t17.6\n15.2\t180\t3.78\t275.8\t18\n10.4\t205\t5.25\t472\t17.98\n10.4\t215\t5.424\t460\t17.82\n14.7\t230\t5.345\t440\t17.42\n32.4\t66\t2.2\t78.7\t19.47\n30.4\t52\t1.615\t75.7\t18.52\n33.9\t65\t1.835\t71.1\t19.9\n21.5\t97\t2.465\t120.1\t20.01\n15.5\t150\t3.52\t318\t16.87\n15.2\t150\t3.435\t304\t17.3\n13.3\t245\t3.84\t350\t15.41\n19.2\t175\t3.845\t400\t17.05\n27.3\t66\t1.935\t79\t18.9\n26\t91\t2.14\t120.3\t16.7\n30.4\t113\t1.513\t95.1\t16.9\n15.8\t264\t3.17\t351\t14.5\n19.7\t175\t2.77\t145\t15.5\n15\t335\t3.57\t301\t14.6\n21.4\t109\t2.78\t121\t18.6",
  gaps: "age\tbmi\tglucose\tchol\n34\tNA\t88\t180\n51\t27.4\t102\t210\n28\t22.1\tNA\t165\nNA\t31\t118\t240\n45\t25.6\t95\t195\n62\t29.8\t130\t255\n23\t21.3\tNA\t150\n58\t33.2\t141\t268\n39\tNA\t91\t172\n47\t28.1\t126\t232\n30\t24\tNA\t188\nNA\t26.5\t99\t205",
  iris: "Sepal.Length\tSepal.Width\tPetal.Length\tPetal.Width\n5.1\t3.5\t1.4\t0.2\n4.9\t3\t1.4\t0.2\n4.7\t3.2\t1.3\t0.2\n4.6\t3.1\t1.5\t0.2\n5\t3.6\t1.4\t0.2\n5.4\t3.9\t1.7\t0.4\n4.6\t3.4\t1.4\t0.3\n5\t3.4\t1.5\t0.2\n4.4\t2.9\t1.4\t0.2\n4.9\t3.1\t1.5\t0.1\n5.4\t3.7\t1.5\t0.2\n4.8\t3.4\t1.6\t0.2\n4.8\t3\t1.4\t0.1\n4.3\t3\t1.1\t0.1\n5.8\t4\t1.2\t0.2\n5.7\t4.4\t1.5\t0.4\n5.4\t3.9\t1.3\t0.4\n5.1\t3.5\t1.4\t0.3\n5.7\t3.8\t1.7\t0.3\n5.1\t3.8\t1.5\t0.3\n5.4\t3.4\t1.7\t0.2\n5.1\t3.7\t1.5\t0.4\n4.6\t3.6\t1\t0.2\n5.1\t3.3\t1.7\t0.5\n4.8\t3.4\t1.9\t0.2\n5\t3\t1.6\t0.2\n5\t3.4\t1.6\t0.4\n5.2\t3.5\t1.5\t0.2\n5.2\t3.4\t1.4\t0.2\n4.7\t3.2\t1.6\t0.2\n4.8\t3.1\t1.6\t0.2\n5.4\t3.4\t1.5\t0.4\n5.2\t4.1\t1.5\t0.1\n5.5\t4.2\t1.4\t0.2\n4.9\t3.1\t1.5\t0.2\n5\t3.2\t1.2\t0.2\n5.5\t3.5\t1.3\t0.2\n4.9\t3.6\t1.4\t0.1\n4.4\t3\t1.3\t0.2\n5.1\t3.4\t1.5\t0.2\n5\t3.5\t1.3\t0.3\n4.5\t2.3\t1.3\t0.3\n4.4\t3.2\t1.3\t0.2\n5\t3.5\t1.6\t0.6\n5.1\t3.8\t1.9\t0.4\n4.8\t3\t1.4\t0.3\n5.1\t3.8\t1.6\t0.2\n4.6\t3.2\t1.4\t0.2\n5.3\t3.7\t1.5\t0.2\n5\t3.3\t1.4\t0.2\n7\t3.2\t4.7\t1.4\n6.4\t3.2\t4.5\t1.5\n6.9\t3.1\t4.9\t1.5\n5.5\t2.3\t4\t1.3\n6.5\t2.8\t4.6\t1.5\n5.7\t2.8\t4.5\t1.3\n6.3\t3.3\t4.7\t1.6\n4.9\t2.4\t3.3\t1\n6.6\t2.9\t4.6\t1.3\n5.2\t2.7\t3.9\t1.4\n5\t2\t3.5\t1\n5.9\t3\t4.2\t1.5\n6\t2.2\t4\t1\n6.1\t2.9\t4.7\t1.4\n5.6\t2.9\t3.6\t1.3\n6.7\t3.1\t4.4\t1.4\n5.6\t3\t4.5\t1.5\n5.8\t2.7\t4.1\t1\n6.2\t2.2\t4.5\t1.5\n5.6\t2.5\t3.9\t1.1\n5.9\t3.2\t4.8\t1.8\n6.1\t2.8\t4\t1.3\n6.3\t2.5\t4.9\t1.5\n6.1\t2.8\t4.7\t1.2\n6.4\t2.9\t4.3\t1.3\n6.6\t3\t4.4\t1.4\n6.8\t2.8\t4.8\t1.4\n6.7\t3\t5\t1.7\n6\t2.9\t4.5\t1.5\n5.7\t2.6\t3.5\t1\n5.5\t2.4\t3.8\t1.1\n5.5\t2.4\t3.7\t1\n5.8\t2.7\t3.9\t1.2\n6\t2.7\t5.1\t1.6\n5.4\t3\t4.5\t1.5\n6\t3.4\t4.5\t1.6\n6.7\t3.1\t4.7\t1.5\n6.3\t2.3\t4.4\t1.3\n5.6\t3\t4.1\t1.3\n5.5\t2.5\t4\t1.3\n5.5\t2.6\t4.4\t1.2\n6.1\t3\t4.6\t1.4\n5.8\t2.6\t4\t1.2\n5\t2.3\t3.3\t1\n5.6\t2.7\t4.2\t1.3\n5.7\t3\t4.2\t1.2\n5.7\t2.9\t4.2\t1.3\n6.2\t2.9\t4.3\t1.3\n5.1\t2.5\t3\t1.1\n5.7\t2.8\t4.1\t1.3\n6.3\t3.3\t6\t2.5\n5.8\t2.7\t5.1\t1.9\n7.1\t3\t5.9\t2.1\n6.3\t2.9\t5.6\t1.8\n6.5\t3\t5.8\t2.2\n7.6\t3\t6.6\t2.1\n4.9\t2.5\t4.5\t1.7\n7.3\t2.9\t6.3\t1.8\n6.7\t2.5\t5.8\t1.8\n7.2\t3.6\t6.1\t2.5\n6.5\t3.2\t5.1\t2\n6.4\t2.7\t5.3\t1.9\n6.8\t3\t5.5\t2.1\n5.7\t2.5\t5\t2\n5.8\t2.8\t5.1\t2.4\n6.4\t3.2\t5.3\t2.3\n6.5\t3\t5.5\t1.8\n7.7\t3.8\t6.7\t2.2\n7.7\t2.6\t6.9\t2.3\n6\t2.2\t5\t1.5\n6.9\t3.2\t5.7\t2.3\n5.6\t2.8\t4.9\t2\n7.7\t2.8\t6.7\t2\n6.3\t2.7\t4.9\t1.8\n6.7\t3.3\t5.7\t2.1\n7.2\t3.2\t6\t1.8\n6.2\t2.8\t4.8\t1.8\n6.1\t3\t4.9\t1.8\n6.4\t2.8\t5.6\t2.1\n7.2\t3\t5.8\t1.6\n7.4\t2.8\t6.1\t1.9\n7.9\t3.8\t6.4\t2\n6.4\t2.8\t5.6\t2.2\n6.3\t2.8\t5.1\t1.5\n6.1\t2.6\t5.6\t1.4\n7.7\t3\t6.1\t2.3\n6.3\t3.4\t5.6\t2.4\n6.4\t3.1\t5.5\t1.8\n6\t3\t4.8\t1.8\n6.9\t3.1\t5.4\t2.1\n6.7\t3.1\t5.6\t2.4\n6.9\t3.1\t5.1\t2.3\n5.8\t2.7\t5.1\t1.9\n6.8\t3.2\t5.9\t2.3\n6.7\t3.3\t5.7\t2.5\n6.7\t3\t5.2\t2.3\n6.3\t2.5\t5\t1.9\n6.5\t3\t5.2\t2\n6.2\t3.4\t5.4\t2.3\n5.9\t3\t5.1\t1.8",
  noise: "v1\tv2\tv3\tv4\tv5\tv6\tv7\tv8\tv9\tv10\n2.287\t1.219\t0.343\t-1.555\t0.346\t2.023\t-0.406\t2.109\t-1.091\t0.203\n-1.197\t-0.699\t0.004\t1.57\t0.094\t0.862\t0.155\t0.71\t-0.657\t-2.309\n-0.694\t-0.285\t0.029\t0.688\t0.007\t-0.025\t-0.972\t-1.475\t2.263\t-0.057\n-0.412\t-1.312\t-0.393\t-0.178\t0.743\t0.601\t1.548\t-0.59\t0.088\t0.063\n-0.971\t-0.391\t-0.793\t0.729\t1.042\t1.216\t-0.37\t0.14\t0.768\t0.71\n-0.947\t-0.402\t-0.312\t1.533\t-0.319\t-1.177\t1.962\t-0.512\t-0.613\t-0.592\n0.748\t1.351\t-0.346\t0.507\t0.323\t-0.609\t-0.61\t0.151\t0.153\t0.299\n-0.117\t0.591\t-0.305\t0.033\t0.685\t0.387\t-0.077\t0.442\t-0.592\t0.643\n0.153\t0.101\t-1.786\t-1.468\t0.32\t-1.399\t-1.829\t-0.162\t-0.961\t2.113\n2.19\t0.931\t0.587\t1.019\t-1.915\t1.232\t0.806\t0.972\t-0.585\t0.918\n0.357\t-0.263\t1.636\t-0.593\t-2.34\t0.016\t-1.478\t-0.671\t0.657\t-1.573\n2.717\t-0.008\t-0.645\t0.812\t0.483\t-1.621\t-2.973\t1.638\t-0.29\t0.993\n2.281\t0.367\t0.619\t0.866\t1.179\t-0.665\t-1.34\t-1.068\t0.904\t0.48\n0.324\t1.707\t0.236\t0.368\t-1.293\t-0.575\t-0.266\t-0.011\t0.199\t-0.297\n1.896\t0.724\t0.847\t1.135\t0.616\t-0.902\t-0.384\t-1.865\t-0.052\t0.816\n0.468\t0.481\t-0.574\t-0.757\t0.256\t1.492\t-0.603\t0.018\t-0.908\t-1\n-0.894\t-1.568\t1.118\t0.445\t0.728\t-0.137\t-0.652\t-0.247\t-1.142\t0.549\n-0.307\t0.318\t-1.54\t0.916\t1.324\t0.108\t1.758\t-0.919\t0.99\t0.28\n-0.005\t0.166\t-0.438\t0.27\t0.147\t-1.035\t-0.019\t-2.173\t0.112\t0.917\n0.988\t-0.9\t-0.151\t1.008\t-0.599\t-0.445\t0.155\t-0.649\t1.15\t-1.731\n0.84\t0.076\t0.519\t-1.461\t2.193\t-0.196\t-0.761\t0.525\t-0.91\t-1.48\n0.705\t0.159\t0.588\t-0.875\t2.327\t-1.269\t-1.55\t-0.276\t-1.104\t2.23\n1.306\t0.544\t-0.079\t0.165\t1.135\t0.954\t2.75\t0.055\t-1.635\t0.386\n-1.388\t0.705\t-1.174\t0.207\t-0.191\t0.473\t1.047\t-0.388\t-1.616\t0.66\n1.273\t0.319\t0.309\t0.482\t0.475\t-0.559\t0.918\t-0.417\t-0.837\t-0.276\n0.184\t1.109\t-1.604\t-0.072\t-0.545\t1.242\t0.47\t-1.164\t1.093\t0.276\n0.752\t0.769\t0.991\t-0.889\t1.056\t-0.015\t-0.617\t1.738\t1.235\t-2.274\n0.592\t1.153\t1.023\t0.486\t0.429\t-0.792\t0.042\t-0.254\t0.172\t0.908\n-0.983\t1.261\t0.84\t0.34\t-1.82\t-0.402\t-0.902\t-0.974\t0.12\t-1.086\n-0.276\t0.701\t0.12\t-1.098\t-0.692\t-1.897\t1.34\t1.111\t0.558\t-0.216\n-0.871\t0.433\t-0.426\t-0.356\t-1.932\t0.972\t0.804\t0.973\t0.491\t-0.733\n0.719\t-0.923\t0.459\t1.097\t1.21\t-0.514\t0.318\t1.257\t-0.069\t0.212\n0.111\t-0.616\t0.645\t-0.907\t-0.279\t0.015\t-0.19\t1.776\t-1.351\t-0.939\n-0.078\t-0.867\t0.612\t-0.207\t-1.096\t-0.261\t-1.087\t-2.683\t0.799\t-0.619\n-0.42\t-1.64\t-0.889\t0.679\t-0.102\t1.522\t0.145\t0.66\t-0.32\t0.244\n-0.562\t-1.326\t1.544\t-0.798\t0.357\t-1.473\t2.463\t1.179\t-0.357\t0.372\n0.998\t-0.889\t-1.242\t-1.592\t-0.882\t-0.017\t0.924\t0.394\t-0.511\t0.627\n-1.105\t-0.558\t1.103\t1.18\t-0.057\t0.025\t0.742\t-1.19\t-1.879\t-1.073\n-0.142\t-0.062\t0.983\t1.223\t-0.581\t-0.001\t1.416\t-0.357\t-0.952\t-0.709\n0.315\t2.423\t0.304\t-0.011\t0.644\t-0.434\t1.252\t-1.466\t2.273\t0.907"
};
/* The idiomatic R expression for a preset the user has not edited. mtcars and
   iris ARE these presets, so naming them reproduces the matrix exactly. */
var SCEN_R = {
  mtcars: 'df <- mtcars[, c("mpg", "hp", "wt", "disp", "qsec")]',
  iris:   'df <- iris[, 1:4]'
};
var SCEN_CHIPS = [
  ['mtcars','mtcars (5 columns)'],
  ['gaps','clinic, with gaps'],
  ['iris','iris (n = 150)'],
  ['noise','10 noise columns']
];

/* ---------- formatting ---------- */
function fmt(v,d){ if(v===null||v===undefined||!isFinite(v)) return 'n/a'; return v.toFixed(d===undefined?3:d); }
function fmtR(r){ if(r===null) return 'n/a'; return (r<0?'':'')+r.toFixed(2); }
function fmtP(p){
  if(p===null||p===undefined) return 'n/a';
  if(p===0) return '<1e-16';
  if(p<0.0001) return p.toExponential(1);
  return p.toFixed(4);
}
function fmtPCell(p){
  if(p===null||p===undefined) return '';
  if(p<0.001) return 'p<.001';
  return 'p=' + p.toFixed(3).replace(/^0/,'');
}
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

/* Restrained ramp: white at r = 0, medium blue at +1, warm clay at -1. Alpha is
   capped at 0.62 so the darkest cell still carries dark ink at ~7:1 contrast,
   which is why this never needs a white-text flip. */
function cellBg(r){
  if(r===null) return '#f7f7f4';
  var a = Math.pow(Math.abs(r),0.8) * 0.62;
  var base = r>=0 ? [47,111,158] : [196,97,31];
  return 'rgb(' + base.map(function(c){ return Math.round(255+(c-255)*a); }).join(',') + ')';
}

/* ---------- parse + compute ---------- */
function currentPreset(){
  var v = $('data').value;
  for(var k in SCEN) if(SCEN[k]===v) return k;
  return null;
}
function compute(){
  return CM.fromText($('data').value, { method:state.method, deletion:state.deletion });
}

/* ---------- renderers ---------- */
function renderMatrix(res){
  var k = res.k, i, j, html = '';
  html += '<thead><tr><th class="rh"></th>';
  for(j=0;j<k;j++) html += '<th class="ch">'+esc(res.names[j])+'</th>';
  html += '</tr></thead><tbody>';
  for(i=0;i<k;i++){
    html += '<tr><th class="rh">'+esc(res.names[i])+'</th>';
    for(j=0;j<k;j++){
      var r = res.r[i][j], p = res.p[i][j], n = res.n[i][j];
      var cls = 'cell', style = '';
      if(i===j) cls += ' diag';
      else if(r===null) cls += ' na';
      else { style = 'background:'+cellBg(r); if(p!==null && p<0.05) cls += ' sig'; }
      var lab = res.names[i]+' and '+res.names[j]+': ';
      lab += (r===null? 'not computable' : 'r = '+r.toFixed(3)+', n = '+n+(p===null?'':', p = '+fmtP(p)));
      html += '<td><div class="'+cls+'" style="'+style+'" title="'+esc(lab)+'">';
      html += '<span class="cr">'+(i===j?'1':(r===null?'n/a':fmtR(r)))+'</span>';
      if(state.showp && i!==j && r!==null) html += '<span class="cp">'+fmtPCell(p)+'</span>';
      if(state.shown) html += '<span class="cn">n='+n+'</span>';
      html += '</div></td>';
    }
    html += '</tr>';
  }
  html += '</tbody>';
  $('cmat').innerHTML = html;
  $('cmat').setAttribute('aria-label', res.method+' correlation matrix of '+k+' columns, '+res.nTests+' unique pairs');

  var ramp = '', vals = [-1,-0.75,-0.5,-0.25,0,0.25,0.5,0.75,1];
  vals.forEach(function(v){ ramp += '<i style="background:'+cellBg(v)+'"></i>'; });
  $('cbar').innerHTML = '<span>-1</span><span class="cramp">'+ramp+'</span><span>+1</span>'
    + '<span style="margin-left:6px">Warm = negative, blue = positive, stronger = deeper.</span>'
    + '<span style="margin-left:auto">A ring marks p &lt; 0.05, before any correction.</span>';
  $('cbar').hidden = false;
}

function renderFocal(res){
  var f = Math.min(state.focal, res.k-1);
  var rows = [];
  for(var j=0;j<res.k;j++){
    if(j===f) continue;
    rows.push({ name:res.names[j], r:res.r[f][j], p:res.p[f][j], n:res.n[f][j] });
  }
  rows.sort(function(a,b){
    if(a.r===null) return 1; if(b.r===null) return -1;
    return Math.abs(b.r)-Math.abs(a.r);
  });
  var html = '';
  rows.forEach(function(d){
    var w = d.r===null ? 0 : Math.abs(d.r)*50;
    var left = d.r===null ? 50 : (d.r>=0 ? 50 : 50-w);
    html += '<div class="fb"><span class="fbn" title="'+esc(d.name)+'">'+esc(d.name)+'</span>'
      + '<span class="fbt"><i style="left:'+left+'%;width:'+w+'%;background:'+cellBg(d.r)+'"></i><span class="zero"></span></span>'
      + '<span class="fbv">'+(d.r===null?'<b>n/a</b>':'<b>r='+d.r.toFixed(3)+'</b>')
      + '  n='+d.n+(d.p===null?'':'  '+fmtPCell(d.p))+'</span></div>';
  });
  $('fbars').innerHTML = html;
  $('fbars').hidden = false;
  return rows;
}

function renderPairs(res){
  var rows = res.pairs.slice().sort(function(a,b){
    if(a.r===null) return 1; if(b.r===null) return -1;
    return Math.abs(b.r)-Math.abs(a.r);
  });
  var html = '';
  rows.forEach(function(d){
    var sw = '<span class="sw" style="background:'+cellBg(d.r)+'"></span>';
    function mark(v){
      if(v===null||v===undefined) return '<span class="no">n/a</span>';
      return v<0.05 ? '<span class="yes">'+fmtP(v)+'</span>' : '<span class="no">'+fmtP(v)+'</span>';
    }
    html += '<tr><td class="pnm">'+sw+esc(d.a)+' &amp; '+esc(d.b)+'</td>'
      + '<td>'+(d.r===null?'n/a':d.r.toFixed(3))+'</td>'
      + '<td>'+d.n+'</td>'
      + '<td>'+mark(d.p)+'</td>'
      + '<td>'+mark(d.p_bonferroni)+'</td>'
      + '<td>'+mark(d.p_holm)+'</td>'
      + '<td>'+mark(d.p_BH)+'</td></tr>';
  });
  $('ptable').innerHTML = html;
  $('ptabwrap').hidden = false;
  return rows;
}

function renderCalls(res,co){
  if(!co){ $('calls').hidden = true; return; }
  function box(k,pair,fallback){
    if(!pair) return '<div class="call"><div class="ck">'+k+'</div><div class="cv">none</div><div class="cx">'+fallback+'</div></div>';
    return '<div class="call"><div class="ck">'+k+'</div><div class="cv">'+esc(pair.a)+' &amp; '+esc(pair.b)+'</div>'
      + '<div class="cx">r = '+pair.r.toFixed(3)+', n = '+pair.n+', '+(pair.p===null?'p n/a':'p = '+fmtP(pair.p))+'</div></div>';
  }
  $('calls').innerHTML =
      box('Strongest positive', co.strongestPositive, 'no pair moves together')
    + box('Strongest negative', co.strongestNegative, 'no pair moves in opposite directions')
    + box('Weakest overall', co.weakest, '');
  $('calls').hidden = false;
}

/* ---------- R code ---------- */
function rdataExpr(res){
  var sc = currentPreset();
  if(sc && SCEN_R[sc]) return SCEN_R[sc];
  var txt = $('data').value.replace(/\s+$/,'');
  return 'df <- read.table(text = "\n' + txt + '\n", header = ' + (res.header?'TRUE':'FALSE') + ')';
}
function buildR(res,co){
  var meth = state.method, L = [];
  var strongest = co ? co.strongest : null;
  L.push('# Your data');
  L.push(rdataExpr(res));
  L.push('');
  if(state.deletion==='listwise'){
    L.push('# Listwise deletion: drop any row with a gap anywhere, up front, so every');
    L.push('# cell rests on the same ' + res.nComplete + ' rows. cor(df, use = "complete.obs") does this');
    L.push('# internally, but doing it here keeps rcorr and cor.test on those rows too.');
    L.push('df <- na.omit(df)');
    L.push('');
    L.push('round(cor(df, method = "' + meth + '"), 3)');
    L.push('');
    L.push('# r, the n behind each cell, and p, in one object');
    L.push('library(Hmisc)');
    L.push('rc <- rcorr(as.matrix(df), type = "' + meth + '")');
  } else {
    L.push('# The matrix, pairwise deletion: each cell uses the rows where its own');
    L.push(res.ragged
      ? '# two columns are both present, so n runs from ' + res.nRange.min + ' to ' + res.nRange.max + ' across cells.'
      : '# two columns are both present. No gaps here, so every cell uses all ' + res.nRange.max + ' rows.');
    L.push('round(cor(df, use = "pairwise.complete.obs", method = "' + meth + '"), 3)');
    L.push('');
    L.push('# r, the n behind each cell, and p, in one object');
    L.push('library(Hmisc)');
    L.push('rc <- rcorr(as.matrix(df), type = "' + meth + '")');
  }
  L.push('rc$r   # the same correlations');
  L.push('rc$n   # the sample size behind each cell');
  L.push('rc$P   # the p-values');
  L.push('');
  if(state.mode==='focal'){
    var fn = res.names[Math.min(state.focal,res.k-1)];
    L.push('# Just one column against the rest, strongest last');
    L.push('sort(cor(df, ' + (state.deletion==='listwise' ? '' : 'use = "pairwise.complete.obs", ')
           + 'method = "' + meth + '")[, "' + fn + '"])');
    L.push('');
  }
  if(strongest){
    L.push('# The strongest pair here, in full (this is the one that also gives');
    L.push('# you a confidence interval, which the matrix never shows)');
    L.push('cor.test(df$' + strongest.a + ', df$' + strongest.b + ', method = "' + meth + '")');
    L.push('');
  }
  if(res.nTests>1){
    L.push('# ' + res.nTests + ' pairs were tested at once. Adjust before believing the small p-values.');
    L.push('p <- rc$P[upper.tri(rc$P)]');
    L.push('round(p.adjust(p, method = "bonferroni"), 4)');
    L.push('round(p.adjust(p, method = "holm"), 4)        # never worse than Bonferroni');
    L.push('round(p.adjust(p, method = "BH"), 4)          # controls the false discovery rate');
  }
  return L.join('\n');
}

/* ---------- how it is computed ---------- */
function buildHow(res,co){
  var gaps = res.nrow - res.nComplete;
  $('h1c').innerHTML = 'Read <b>' + res.k + ' columns</b> and <b>' + res.nrow + ' rows</b> from your paste'
    + (res.header ? ', taking the first line as column names' : ' (no header line found, so columns are named V1 to V'+res.k+')')
    + '. ' + (gaps ? '<b>' + gaps + '</b> of those rows have a gap in at least one column.' : 'No gaps: every row is complete.');

  if(state.deletion==='listwise'){
    $('h2c').innerHTML = '<b>Listwise deletion:</b> drop every row with a gap anywhere, which leaves <b>'
      + res.nComplete + ' of ' + res.nrow + ' rows</b>. Every cell below is computed from those same rows, so all cells share n = '
      + res.nComplete + '.';
  } else {
    $('h2c').innerHTML = '<b>Pairwise deletion:</b> each cell drops only the rows where its own two columns are missing. '
      + (res.ragged
          ? 'That is why n runs from <b>' + res.nRange.min + ' to ' + res.nRange.max + '</b> across the cells rather than being one number.'
          : 'Here no rows are lost, so every cell uses n = <b>' + res.nRange.max + '</b>.');
  }

  if(state.method==='spearman'){
    $('h3c').innerHTML = 'For each pair, <b>rank</b> both columns (after the deletion step, so the ranks are computed on exactly the rows that cell uses), then take the ordinary Pearson correlation of those ranks. That is Spearman&#39;s rho: it measures whether the pair moves together <em>consistently</em>, not whether it moves in a straight line.';
  } else {
    $('h3c').innerHTML = 'For each pair, <b>r</b> is the covariance of the two columns divided by the product of their standard deviations, which pins it to the range -1 to +1. It measures how tightly the points hug a straight line.';
  }

  $('h4c').innerHTML = 'Turn each r into a test: <code>t = r &times; &radic;((n-2) / (1-r&sup2;))</code> on <b>n - 2</b> degrees of freedom, and read the two-sided p from the t distribution. '
    + 'This is the same test <code>Hmisc::rcorr</code> applies to every cell, which is why the p-values match it exactly.'
    + (res.cortestDiverges
        ? ' Note: some pairs here have no tied values, so a single <code>cor.test()</code> would switch to an <em>exact</em> test and report a slightly different p. The matrix keeps one test for every cell so the cells stay comparable.'
        : '');

  var alpha = 0.05;
  var expFP = CM.expectedFalsePositives(res.nTests, alpha);
  var fwer = CM.familywiseError(res.nTests, alpha);
  $('h5c').innerHTML = 'Count the tests: ' + res.k + ' columns give <b>' + res.k + '(' + res.k + '-1)/2 = ' + res.nTests + '</b> unique pairs. '
    + (res.nTests>1
        ? 'If none of them were truly correlated you would still expect <b>' + expFP.toFixed(1) + '</b> to clear p &lt; 0.05 by luck, and the chance of at least one doing so is <b>'
          + (fwer*100).toFixed(0) + '%</b>. The Bonferroni threshold is 0.05/' + res.nTests + ' = <b>' + (alpha/res.nTests).toPrecision(2) + '</b>.'
        : 'With a single pair there is nothing to correct for.');
}

/* ---------- main render ---------- */
function render(){
  var res = compute();

  if(res.error){
    $('ierr').textContent = res.error;
    $('ierr').classList.add('show');
    $('mwrap').hidden = true; $('cbar').hidden = true; $('fbars').hidden = true;
    $('ptabwrap').hidden = true; $('calls').hidden = true; $('mtnote').hidden = true;
    $('vchip').textContent = 'no result'; $('vchip').className = 'vchip na';
    $('vhead').textContent = '-'; $('vsub').textContent = '';
    $('plain').textContent = 'Paste at least two columns of numbers. The first line can be a row of names.';
    $('infline').textContent = '';
    $('report').textContent = '';
    $('rcodepre').textContent = '# Paste some data to see the R that reproduces it.';
    $('dmeta').textContent = 'no data';
    $('innote').textContent = '';
    return;
  }
  $('ierr').classList.remove('show');

  var co = CM.callouts(res);

  // input meta
  var gaps = res.nrow - res.nComplete;
  $('dmeta').textContent = res.k + ' columns x ' + res.nrow + ' rows' + (gaps? '  |  ' + gaps + ' rows have a gap' : '  |  no gaps');
  $('innote').innerHTML = res.nTests + ' unique pair' + (res.nTests===1?'':'s') + ' ('
    + res.k + '(' + res.k + '-1)/2)'
    + (gaps
        ? (state.deletion==='listwise'
            ? '. Listwise is using the ' + res.nComplete + ' complete rows and discarding ' + gaps + '.'
            : '. Pairwise gives each cell its own n, here ' + res.nRange.min + ' to ' + res.nRange.max + '.')
        : '. No gaps, so pairwise and listwise agree exactly.');

  // focal select
  var fsel = $('fsel');
  if(fsel.options.length !== res.k || fsel.dataset.sig !== res.names.join('|')){
    fsel.innerHTML = res.names.map(function(n,i){ return '<option value="'+i+'">'+esc(n)+'</option>'; }).join('');
    fsel.dataset.sig = res.names.join('|');
  }
  if(state.focal > res.k-1) state.focal = 0;
  fsel.value = String(state.focal);

  // panels
  $('mwrap').hidden = state.mode!=='matrix';
  $('cbar').hidden  = state.mode!=='matrix';
  $('fbars').hidden = true;
  $('ptabwrap').hidden = true;
  $('frow').hidden = state.mode!=='focal';

  var focalRows = null, pairRows = null;
  if(state.mode==='matrix') renderMatrix(res);
  else if(state.mode==='focal') focalRows = renderFocal(res);
  else pairRows = renderPairs(res);

  renderCalls(res, state.mode==='focal' ? null : co);

  // chip + headline + sub
  var methLbl = state.method==='pearson' ? 'Pearson' : 'Spearman';
  $('vchip').className = 'vchip';
  $('vchip').textContent = methLbl + ', ' + state.deletion;

  var alpha = 0.05;
  var bonfThresh = alpha/res.nTests;

  if(state.mode==='focal'){
    var fname = res.names[Math.min(state.focal,res.k-1)];
    var top = focalRows && focalRows.length ? focalRows[0] : null;
    if(top && top.r!==null){
      $('vhead').textContent = 'r = ' + top.r.toFixed(3);
      $('vsub').innerHTML = 'the strongest correlate of <b>' + esc(fname) + '</b> is <b>' + esc(top.name)
        + '</b> (n = ' + top.n + ', p = ' + fmtP(top.p) + ')';
    } else {
      $('vhead').textContent = 'n/a';
      $('vsub').textContent = 'nothing correlates with ' + fname + ' here';
    }
  } else if(state.mode==='pairs'){
    var nSurv = co ? co.nSigBonf : 0;
    $('vhead').textContent = nSurv + ' of ' + res.nTests + ' pair' + (res.nTests===1?'':'s') + ' survive Bonferroni';
    $('vsub').innerHTML = (co? co.nSig05 : 0) + ' clear the raw 0.05 cut, <b>' + nSurv
      + '</b> still clear it after correcting for all ' + res.nTests + ' tests';
  } else {
    if(co && co.strongest && co.strongest.r!==null){
      $('vhead').textContent = 'r = ' + co.strongest.r.toFixed(3);
      $('vsub').innerHTML = 'strongest of ' + res.nTests + ' pairs: <b>' + esc(co.strongest.a) + '</b> and <b>'
        + esc(co.strongest.b) + '</b> (n = ' + co.strongest.n + ', p = ' + fmtP(co.strongest.p) + ')';
    } else {
      $('vhead').textContent = 'n/a';
      $('vsub').textContent = 'no pair could be computed';
    }
  }

  // plain English
  if(co && co.strongest && co.strongest.r!==null){
    var s = co.strongest;
    var dir = s.r>=0 ? 'rise together' : 'move in opposite directions';
    var shared = (s.r*s.r*100).toFixed(0);
    var strength = Math.abs(s.r)>=0.7 ? 'strong' : (Math.abs(s.r)>=0.4 ? 'moderate' : 'weak');
    $('plain').innerHTML = 'Across ' + res.k + ' columns the standout pair is <b>' + esc(s.a) + '</b> and <b>' + esc(s.b)
      + '</b>: a ' + strength + ' ' + (state.method==='spearman'?'monotonic':'linear') + ' relationship, r = <b>' + s.r.toFixed(3)
      + '</b>, meaning they ' + dir + ' and share about <b>' + shared + '%</b> of their variance. '
      + 'That cell rests on <b>' + s.n + '</b> rows. '
      + (co.nSig05===0
          ? 'No pair in this matrix clears p &lt; 0.05.'
          : '<b>' + co.nSig05 + '</b> of the ' + res.nTests + ' pairs clear p &lt; 0.05 before any correction'
            + (res.nTests>1 ? ', and <b>' + co.nSigBonf + '</b> still do after Bonferroni.' : '.'));
  } else {
    $('plain').textContent = 'No pair in this table could be correlated. Check that the columns hold numbers and that at least 3 rows are complete for some pair.';
  }

  // multiple-testing note
  if(res.nTests>1){
    var expFP = CM.expectedFalsePositives(res.nTests, alpha);
    var fwer = CM.familywiseError(res.nTests, alpha);
    $('mtnote').innerHTML = '<b>This matrix ran ' + res.nTests + ' tests at once.</b> With ' + res.k
      + ' columns you get ' + res.k + '(' + res.k + '-1)/2 = ' + res.nTests + ' pairs, and if none were truly related you would still expect about <b>'
      + expFP.toFixed(1) + '</b> of them to land under p &lt; 0.05 by chance, with a <b>' + (fwer*100).toFixed(0)
      + '%</b> chance of at least one. Picking the biggest r after looking is exactly the move that p-value cannot account for. '
      + 'The blunt fix is Bonferroni: judge each p against 0.05/' + res.nTests + ' = <b>' + bonfThresh.toPrecision(2)
      + '</b> instead of 0.05. Holm does the same job with more power, and the ranked-pairs mode shows both.';
    $('mtnote').hidden = false;
  } else {
    $('mtnote').hidden = true;
  }

  // inference line
  if(co && co.strongest && co.strongest.r!==null && co.strongest.p!==null){
    var t = co.strongest;
    var raw = t.p<alpha;
    var adj = t.p_bonferroni!==null && t.p_bonferroni<alpha;
    var line;
    if(res.nTests===1){
      line = raw
        ? 'Since p = ' + fmtP(t.p) + ' &lt; 0.05, reject the null of zero correlation: <b>' + esc(t.a) + '</b> and <b>' + esc(t.b) + '</b> are genuinely related.'
        : 'Since p = ' + fmtP(t.p) + ' is not below 0.05, do not reject the null: this sample is consistent with no correlation between <b>' + esc(t.a) + '</b> and <b>' + esc(t.b) + '</b>.';
    } else if(raw && adj){
      line = 'Since the strongest pair (<b>' + esc(t.a) + '</b> and <b>' + esc(t.b) + '</b>) has p = ' + fmtP(t.p)
        + ' &lt; ' + bonfThresh.toPrecision(2) + ', the Bonferroni threshold for ' + res.nTests
        + ' tests, it survives the correction: <b>call it real</b>.';
    } else if(raw && !adj){
      line = 'The strongest pair (<b>' + esc(t.a) + '</b> and <b>' + esc(t.b) + '</b>) has p = ' + fmtP(t.p)
        + ', which clears 0.05 but <b>not</b> the Bonferroni threshold of ' + bonfThresh.toPrecision(2) + ' for ' + res.nTests
        + ' tests: treat it as a lead to test on new data, <b>not a finding</b>.';
    } else {
      line = 'Even the strongest pair here (<b>' + esc(t.a) + '</b> and <b>' + esc(t.b) + '</b>) has p = ' + fmtP(t.p)
        + ', above 0.05 before any correction: <b>nothing in this matrix is distinguishable from noise</b>.';
    }
    $('infline').innerHTML = line;
  } else {
    $('infline').textContent = '';
  }

  // report line
  if(co && co.strongest && co.strongest.r!==null){
    var st = co.strongest;
    $('report').textContent = methLbl + ' correlation matrix (' + state.deletion + ' deletion), '
      + res.k + ' columns, ' + res.nTests + ' pairs, n = '
      + (res.ragged ? res.nRange.min + '-' + res.nRange.max : String(res.nRange.max))
      + '; strongest: ' + st.a + ' and ' + st.b + ', r = ' + st.r.toFixed(3)
      + ', p = ' + fmtP(st.p) + (res.nTests>1 ? ' (Bonferroni-adjusted p = ' + fmtP(st.p_bonferroni) + ')' : '') + '.';
  } else $('report').textContent = '';

  buildHow(res,co);
  $('rcodepre').textContent = buildR(res,co);
  if(window.hljsR) try{ window.hljsR($('rcodepre')); }catch(e){}
}

/* ---------- wiring ---------- */
function syncMode(){
  Array.prototype.forEach.call(document.querySelectorAll('.mode'), function(b){
    var on = b.dataset.mode===state.mode;
    b.classList.toggle('on',on);
    b.setAttribute('aria-selected', on?'true':'false');
  });
  var sel = $('iwantsel');
  sel.value = state.mode;
  $('iwantlbl').textContent = sel.options[sel.selectedIndex].textContent;
}

function boot(){
  // scenario chips
  (function(){
    var row = $('scenrow');
    SCEN_CHIPS.forEach(function(c){
      var b = document.createElement('button');
      b.type='button'; b.className='chip'; b.dataset.scen=c[0]; b.textContent=c[1];
      b.addEventListener('click', function(){
        $('data').value = SCEN[c[0]];
        state.focal = 0;
        firstUse(); syncChips(); render();
      });
      row.appendChild(b);
    });
  })();
  function syncChips(){
    var cur = currentPreset();
    Array.prototype.forEach.call(document.querySelectorAll('.chip'), function(b){
      b.classList.toggle('on', b.dataset.scen===cur);
    });
  }

  Array.prototype.forEach.call(document.querySelectorAll('.mode'), function(b){
    b.addEventListener('click', function(){ state.mode=b.dataset.mode; firstUse(); syncMode(); render(); });
  });
  $('iwantsel').addEventListener('change', function(){ state.mode=this.value; firstUse(); syncMode(); render(); });

  Array.prototype.forEach.call($('methseg').querySelectorAll('button'), function(b){
    b.addEventListener('click', function(){
      state.method = b.dataset.meth;
      Array.prototype.forEach.call($('methseg').querySelectorAll('button'), function(x){ x.classList.toggle('on', x===b); });
      firstUse(); render();
    });
  });
  Array.prototype.forEach.call($('delseg').querySelectorAll('button'), function(b){
    b.addEventListener('click', function(){
      state.deletion = b.dataset.del;
      Array.prototype.forEach.call($('delseg').querySelectorAll('button'), function(x){ x.classList.toggle('on', x===b); });
      firstUse(); render();
    });
  });
  $('showp').addEventListener('change', function(){ state.showp=this.checked; firstUse(); render(); });
  $('shown').addEventListener('change', function(){ state.shown=this.checked; firstUse(); render(); });
  $('fsel').addEventListener('change', function(){ state.focal=+this.value; firstUse(); render(); });
  $('data').addEventListener('input', function(){ firstUse(); syncChips(); render(); });

  $('copybtn').addEventListener('click', function(){
    navigator.clipboard.writeText($('report').textContent).then(function(){
      $('copybtn').textContent='Copied'; setTimeout(function(){ $('copybtn').textContent='Copy result'; },1400);
      gaCopy('result');
    });
  });
  $('rcopy').addEventListener('click', function(){
    navigator.clipboard.writeText($('rcodepre').textContent).then(function(){
      $('rcopy').textContent='Copied'; setTimeout(function(){ $('rcopy').textContent='Copy code'; },1400);
      gaCopy('rcode');
    });
  });

  // init
  $('data').value = SCEN.mtcars;
  syncChips();
  syncMode();
  render();
}

root.CorrMatrixUI = { boot: boot };
}(typeof self !== 'undefined' ? self : this));
