/*
 * gen-chooser-static.js
 * Emits the SEO server-rendered blocks for statistical-test-chooser.html:
 *   1. the full decision tree grouped by goal (crawlable text, engine-driven),
 *   2. the coverage-matrix table of every statistical test.
 * Both are generated from tools/lib/test-chooser.js so they can never drift
 * from the live wizard. Output -> Scripts/tool-truth/chooser-static.html
 */
'use strict';
var path = require('path');
var fs = require('fs');
var TC = require(path.resolve(__dirname, '../../tools/lib/test-chooser.js'));

function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function link(l){ return l ? '<a href="'+l.href+'">'+esc(l.label)+'</a>' : '<span class="tm-no">none yet</span>'; }
function testLink(id){ var t=TC.TESTS[id]; var href=(t.tutorial&&t.tutorial.href)||(t.calc&&t.calc.href)||''; return href ? '<a href="'+href+'">'+esc(t.name)+'</a>' : '<span class="tree-leaf">'+esc(t.name)+'</span>'; }

// ---- decision tree: curated, engine-verified scenarios per goal --------
var TREE = [
  { goal:'Compare groups or conditions', intro:'You have a variable measured in different groups (or the same subjects more than once) and want to know whether they differ.', rows:[
    ['A continuous outcome, one group vs a known value, roughly normal', {goal:'compare',outcome:'continuous',groups:'1',normal:'yes'}],
    ['A continuous outcome, one group vs a value, skewed', {goal:'compare',outcome:'continuous',groups:'1',normal:'no'}],
    ['Two independent groups, normal, equal spread', {goal:'compare',outcome:'continuous',groups:'2',design:'independent',normal:'yes',equalvar:'yes'}],
    ['Two independent groups, normal, unequal spread', {goal:'compare',outcome:'continuous',groups:'2',design:'independent',normal:'yes',equalvar:'no'}],
    ['Two independent groups, skewed', {goal:'compare',outcome:'continuous',groups:'2',design:'independent',normal:'no'}],
    ['Two paired measurements, normal differences', {goal:'compare',outcome:'continuous',groups:'2',design:'paired',normal:'yes'}],
    ['Two paired measurements, skewed differences', {goal:'compare',outcome:'continuous',groups:'2',design:'paired',normal:'no'}],
    ['Paired ordinal data (only the direction is meaningful)', {goal:'compare',outcome:'ordinal',groups:'2',design:'paired'}],
    ['Three or more independent groups, normal, equal spread', {goal:'compare',outcome:'continuous',groups:'3+',design:'independent',normal:'yes',equalvar:'yes'}],
    ['Three or more independent groups, normal, unequal spread', {goal:'compare',outcome:'continuous',groups:'3+',design:'independent',normal:'yes',equalvar:'no'}],
    ['Three or more independent groups, skewed', {goal:'compare',outcome:'continuous',groups:'3+',design:'independent',normal:'no'}],
    ['Three or more repeated measures, normal', {goal:'compare',outcome:'continuous',groups:'3+',design:'paired',normal:'yes'}],
    ['Three or more repeated measures, skewed or ordinal', {goal:'compare',outcome:'ordinal',groups:'3+',design:'paired'}],
    ['A single yes/no proportion vs a value, small sample', {goal:'compare',outcome:'binary',groups:'1',n:'small'}],
    ['A single yes/no proportion vs a value, large sample', {goal:'compare',outcome:'binary',groups:'1',n:'large'}],
    ['Two independent yes/no rates, large sample', {goal:'compare',outcome:'binary',groups:'2',design:'independent',n:'large'}],
    ['Two independent yes/no rates, small or sparse', {goal:'compare',outcome:'binary',groups:'2',design:'independent',n:'small'}],
    ['A paired yes/no outcome (before vs after)', {goal:'compare',outcome:'binary',groups:'2',design:'paired'}],
    ['A yes/no outcome across 3+ repeated conditions', {goal:'compare',outcome:'binary',groups:'3+',design:'paired'}],
    ['One categorical variable vs an expected distribution', {goal:'compare',outcome:'nominal',groups:'1'}],
    ['Two categorical variables in a table, large sample', {goal:'compare',outcome:'nominal',groups:'2',design:'independent',n:'large'}],
    ['A count outcome compared across groups', {goal:'compare',outcome:'count',groups:'2'}]
  ]},
  { goal:'Measure a relationship', intro:'You have two variables and want to know whether, and how strongly, they move together.', rows:[
    ['Two continuous variables, linear and roughly normal', {goal:'relationship',outcome:'continuous',normal:'yes'}],
    ['Two continuous variables, monotonic but not normal', {goal:'relationship',outcome:'continuous',normal:'no',n:'medium'}],
    ['Two variables, small sample with ties', {goal:'relationship',outcome:'continuous',normal:'no',n:'small'}],
    ['Two ordinal (ranked) variables', {goal:'relationship',outcome:'ordinal'}],
    ['Two categorical variables, large sample', {goal:'relationship',outcome:'nominal',n:'large'}],
    ['Two categorical variables, small 2x2 table', {goal:'relationship',outcome:'nominal',n:'small'}]
  ]},
  { goal:'Predict or model an outcome', intro:'You want to model an outcome from one or more predictors.', rows:[
    ['A continuous outcome from one predictor', {goal:'predict',outcome:'continuous',predictors:'1'}],
    ['A continuous outcome from several predictors', {goal:'predict',outcome:'continuous',predictors:'2+'}],
    ['A yes/no outcome', {goal:'predict',outcome:'binary'}],
    ['A count outcome', {goal:'predict',outcome:'count'}],
    ['An ordered categorical outcome', {goal:'predict',outcome:'ordinal'}],
    ['An unordered categorical outcome (3+ classes)', {goal:'predict',outcome:'nominal'}]
  ]},
  { goal:'Time-to-event (survival)', intro:'Your outcome is the time until an event happens, with some observations censored.', rows:[
    ['Compare survival curves between groups', {goal:'survival',survGoal:'compare'}],
    ['Model the effect of covariates on survival', {goal:'survival',survGoal:'model'}]
  ]},
  { goal:'Rater agreement / reliability', intro:'You want to quantify how well raters or methods agree.', rows:[
    ['Two raters, categorical labels', {goal:'agreement',ratingType:'categorical',raters:'2'}],
    ['Three or more raters, categorical labels', {goal:'agreement',ratingType:'categorical',raters:'3+'}],
    ['Continuous ratings from two or more raters', {goal:'agreement',ratingType:'continuous'}]
  ]},
  { goal:'Describe your data', intro:'You want to summarise a single variable, not run a test.', rows:[
    ['A continuous variable', {goal:'describe',outcome:'continuous'}],
    ['A categorical variable', {goal:'describe',outcome:'nominal'}]
  ]}
];

var treeHtml = '';
TREE.forEach(function(sec){
  treeHtml += '\n  <h3>'+esc(sec.goal)+'</h3>\n  <p class="tree-intro">'+esc(sec.intro)+'</p>\n  <ul class="tree">\n';
  sec.rows.forEach(function(r){
    var d = TC.decide(r[1]);
    treeHtml += '    <li><span class="tree-when">'+esc(r[0])+'</span> <span class="tree-arrow" aria-hidden="true">&rarr;</span> '+testLink(d.id)+'</li>\n';
  });
  treeHtml += '  </ul>\n';
});

// ---- coverage matrix table --------------------------------------------
var famLabel = {parametric:'Parametric',nonparametric:'Nonparametric',anova:'ANOVA',categorical:'Categorical',proportion:'Proportion',correlation:'Correlation',regression:'Regression',survival:'Survival',agreement:'Agreement'};
var order = ['parametric','nonparametric','anova','categorical','proportion','correlation','regression','survival','agreement'];
var ids = Object.keys(TC.TESTS).filter(function(id){ return TC.TESTS[id].family!=='describe'; });
ids.sort(function(a,b){ return order.indexOf(TC.TESTS[a].family)-order.indexOf(TC.TESTS[b].family); });

var rows = '';
ids.forEach(function(id){
  var t = TC.TESTS[id];
  rows += '        <tr>'
       + '<td><b>'+esc(t.name)+'</b></td>'
       + '<td>'+esc(t.why)+'</td>'
       + '<td>'+link(t.calc)+'</td>'
       + '<td>'+link(t.tutorial)+'</td>'
       + '</tr>\n';
});
var matrixHtml = '    <table class="matrix">\n      <thead><tr><th>Test</th><th>Use it when</th><th>Our calculator</th><th>Tutorial</th></tr></thead>\n      <tbody>\n'+rows+'      </tbody>\n    </table>';

var out = '<!-- ===== GENERATED by Scripts/tool-truth/gen-chooser-static.js ===== -->\n'
  + '<!-- DECISION-TREE -->\n' + treeHtml
  + '\n<!-- COVERAGE-MATRIX -->\n' + matrixHtml + '\n';
fs.writeFileSync(path.resolve(__dirname, 'chooser-static.html'), out, 'utf8');
console.log('wrote chooser-static.html: '+ids.length+' tests in matrix, '+TREE.reduce(function(a,s){return a+s.rows.length;},0)+' tree leaves');
