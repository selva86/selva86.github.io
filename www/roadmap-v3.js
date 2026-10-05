// roadmap-v3.js -- main roadmap page, 2026-10 design (design_handoff_roadmap).
// The DESIGN is the handoff; the DATA stays live: section titles and projects come from RM2
// (roadmap-curriculum.js), certificate names from RM.LEVELS (roadmap-data.js), and lesson counts
// from /courses.json (a baked copy in window.__RMCOUNTS__ paints first, the fetch refreshes it).
// Access rules, stated once here: New to R is free in full; every other path is free for section 1.
(function(){
  'use strict';
  var ROLES=[
    {key:'foundations',name:'New to R',goal:'learn R from zero',free:true,slug:'new-to-r',code:'RF',mastery:'base R programming',
     blurb:'Learn R from your first vector to writing your own functions. A free, structured path through R fundamentals.',
     sig:'Your own R functions, written and tested',step:'From your first vector to writing your own functions.'},
    {key:'analyst',name:'Data Analyst',goal:'turn data into decisions',slug:'data-analyst',code:'DA',mastery:'data analysis and reporting in R',
     blurb:'Wrangle, visualize and report on real data with dplyr, ggplot2 and Quarto. The shared core every specialization builds on.',
     sig:'A reproducible, parameterized Quarto report',step:'Wrangle, visualize and report with dplyr, ggplot2 and Quarto.'},
    {key:'ds',name:'Data Scientist',goal:'build predictive models',slug:'data-scientist',code:'DS',mastery:'machine learning in R',color:'#3D7FD9',
     blurb:'Build, tune, explain and ship machine learning models with tidymodels, XGBoost and torch.',sig:'A deployed, monitored model'},
    {key:'ts',name:'Forecaster',goal:'forecast what happens next',slug:'forecaster',code:'FC',mastery:'time-series forecasting in R',color:'#D9822B',
     blurb:'Model time series with fable, state-space and deep learning, and forecast with honest intervals.',sig:'A backtested forecast with calibrated intervals'},
    {key:'researcher',name:'Researcher',goal:'report statistical results',slug:'researcher',code:'RS',mastery:'statistical research methods in R',color:'#9A6BE0',
     blurb:'Design analyses, estimate effects and defend every inference, from mixed models to causal methods.',sig:'A complete study, from DAG to write-up'},
    {key:'developer',name:'R Developer',goal:'build packages and apps',slug:'r-developer',code:'RD',mastery:'R software development',color:'#D4467E',
     blurb:'Write fast, tested, documented R and ship it as packages, APIs and production Shiny apps.',sig:'A released package or app'}
  ];
  var BYKEY={};ROLES.forEach(function(r,i){r.i=i;BYKEY[r.key]=r;});
  var SPECS=ROLES.slice(2);
  // project domains in RM2.projectList -> role keys ("Statistician" is the old name for Researcher)
  var DOMAIN={'Data Analyst':'analyst','Data Scientist':'ds','Forecaster':'ts','Researcher':'researcher','Statistician':'researcher','R Developer':'developer'};
  var CUR_CAP=12;

  var state={role:'ds',filter:'all',open:{},all:false,pall:false};
  var PROJ_CAP=8;
  var C=window.__RMCOUNTS__||{t:{},s:{}};

  function esc(t){return String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  function two(n){return n<10?'0'+n:''+n;}
  function $(id){return document.getElementById(id);}
  function secs(k){return (window.RM2&&RM2.sections&&RM2.sections[k])||[];}
  function certName(k){var L=window.RM&&RM.byKey?RM.byKey(k):null;return (L&&L.cert)||'';}
  function trackHref(r){return '/roadmap/'+r.slug+'.html';}
  function plural(n,w){return n+' '+w+(n===1?'':'s');}
  function lessonsLabel(n){return n>=10?n+' interactive lessons':(n?plural(n,'lesson')+' so far':'lessons in progress');}
  function structure(k){return plural(secs(k).length,'section')+' · '+lessonsLabel(C.t[k]||0);}
  function access(r){return r.free?'Free, every lesson':'Section 1 free · full track with Pro';}

  function curItems(k,cap){
    var r=BYKEY[k], list=secs(k), out='';
    list.slice(0,cap||list.length).forEach(function(s){
      var n=C.s[k+':'+s.n]||0;
      out+='<li><span class="l"><span>Section '+two(s.n)+(s.n===1&&!r.free?' · free':'')+'</span><span>'+(n?plural(n,'lesson'):'Soon')+'</span></span>'
        +'<span class="t">'+esc(s.title)+'</span></li>';
    });
    return out;
  }

  /* ---- dark roles map ---- */
  function renderGoals(){
    var el=$('rmGoals');if(!el)return;
    el.innerHTML=ROLES.map(function(r){return '<button type="button" class="rm-chip" data-role="'+r.key+'" aria-pressed="'+(r.key===state.role)+'">'+esc(r.goal)+'</button>';}).join('');
  }
  function renderSpecs(){
    var el=$('rmSpecs');if(!el)return;
    el.innerHTML=SPECS.map(function(r){
      return '<button type="button" class="rm-b" data-role="'+r.key+'"><span class="t">'+esc(r.name)+'</span>'
        +'<span class="d s">'+esc(r.sig)+'</span><span class="a s">Section 1 free</span></button>';
    }).join('');
  }
  function paintMap(){
    var r=BYKEY[state.role], i=r.i;
    Array.prototype.forEach.call(document.querySelectorAll('.rm-b'),function(b){
      var k=b.getAttribute('data-role'), j=BYKEY[k].i, sel=(k===state.role);
      var on=sel||(j===0)||(j===1&&i>=1);
      b.classList.toggle('sel',sel);b.classList.toggle('on',on&&!sel);
      b.setAttribute('aria-pressed',sel?'true':'false');
    });
    Array.prototype.forEach.call(document.querySelectorAll('.rm-chip'),function(b){b.setAttribute('aria-pressed',b.getAttribute('data-role')===state.role?'true':'false');});
    var fill=$('rmFill');if(fill)fill.style.width=i===0?'0px':(i===1?'calc(25% - 4px)':'calc(100% - 8px)');
    var nodes=document.querySelectorAll('.rm-node');
    Array.prototype.forEach.call(nodes,function(n,k){n.classList.toggle('on',k===0||(k===1&&i>=1)||(k===2&&i>=2));});
  }
  function renderDetail(){
    var r=BYKEY[state.role], i=r.i;
    var path=i>=2?[ROLES[0],ROLES[1],r]:ROLES.slice(0,i+1);
    var route=$('rmRoute');
    if(route)route.innerHTML='<span>Your route:</span>'+path.map(function(p,k){return '<b>'+esc(p.name)+'</b>'+(k<path.length-1?'<i aria-hidden="true">&rarr;</i>':'');}).join('');
    set('rmName',esc(r.name));set('rmBlurb',esc(r.blurb));set('rmSig',esc(r.sig));
    set('rmCert',esc(certName(r.key)));
    var acc=$('rmAccess');if(acc){acc.textContent=access(r);acc.classList.toggle('free',!!r.free);}
    var cta=$('rmCta');if(cta){cta.setAttribute('href',trackHref(r));cta.innerHTML=r.free?'Start '+esc(r.name)+' free &rarr;':'Start the '+esc(r.name)+' track &rarr;';}
    set('rmStruct',esc(structure(r.key)));
    var n=secs(r.key).length, cap=state.all?n:CUR_CAP;
    set('rmCur',curItems(r.key,cap));
    var more=$('rmMore');
    if(more){more.hidden=n<=CUR_CAP;more.textContent=state.all?'Show fewer sections':'Show all '+n+' sections';}
  }

  /* ---- 01 foundation + 02 specialization cards ---- */
  function renderFoundation(){
    ['foundations','analyst'].forEach(function(k){set('earn-'+k,esc(certName(k)));});
  }
  function renderSpecCards(){
    SPECS.forEach(function(r){
      var o=!!state.open[r.key], box=$('cur-'+r.key), btn=document.querySelector('[data-toggle="'+r.key+'"]');
      if(box){box.hidden=!o;if(o)box.innerHTML='<span>'+esc(structure(r.key))+'</span><ol class="cur">'+curItems(r.key)+'</ol>';}
      if(btn){btn.textContent=o?'Hide curriculum −':'Show curriculum +';btn.setAttribute('aria-expanded',o?'true':'false');}
    });
  }

  /* ---- 03 projects (planned; none are built yet) ---- */
  function renderProjects(){
    var list=(window.RM2&&RM2.projectList)||[];
    var bar=$('pBar'), grid=$('pGrid');if(!bar||!grid)return;
    var counts={all:list.length};list.forEach(function(p){var k=DOMAIN[p.domain];if(k)counts[k]=(counts[k]||0)+1;});
    var filters=[{key:'all',name:'All tracks'}].concat(ROLES.filter(function(r){return counts[r.key];}));
    bar.innerHTML=filters.map(function(f){return '<button type="button" class="p-f" data-f="'+f.key+'" aria-pressed="'+(f.key===state.filter)+'">'+esc(f.name)+'<span>'+counts[f.key]+'</span></button>';}).join('')
      +'<span class="p-count">'+list.length+' projects planned</span>';
    var shown=list.filter(function(p){return state.filter==='all'||DOMAIN[p.domain]===state.filter;});
    var capped=!state.pall&&shown.length>PROJ_CAP+2;
    grid.innerHTML=shown.slice(0,capped?PROJ_CAP:shown.length).map(function(p){
      var r=BYKEY[DOMAIN[p.domain]]||ROLES[1];
      return '<div class="pc" style="--c:'+(r.color||'#4DB384')+'"><div class="pc-top"><span>'+esc(p.tier)+'</span><span class="pill">Planned</span></div>'
        +'<h4>'+esc(p.name)+'</h4><div class="pc-ft"><span class="pc-tr"><i aria-hidden="true"></i>'+esc(r.name)+'</span>'
        +'<span class="pc-st">'+esc(String(p.stack||'').split(/,\s*/).join(' · '))+'</span></div></div>';
    }).join('');
    var more=$('pMore');
    if(more){more.hidden=shown.length<=PROJ_CAP+2;more.textContent=capped?'Show all '+shown.length+' projects':'Show fewer projects';}
  }

  /* ---- certificate preview ---- */
  function renderCert(){
    var r=BYKEY[state.role];
    set('cpCode',esc(r.code));set('cpTitle',esc(certName(r.key)));set('cpMastery',esc(r.mastery));
    var el=$('cpChips');
    if(el)el.innerHTML=ROLES.map(function(c){return '<button type="button" class="cp-chip" data-role="'+c.key+'" aria-pressed="'+(c.key===state.role)+'">'+esc(c.name)+'</button>';}).join('');
  }

  function set(id,html){var el=$(id);if(el)el.innerHTML=html;}
  function pick(k){if(!BYKEY[k])return;state.role=k;state.all=false;paintMap();renderDetail();renderCert();}
  function go(k){pick(k);var el=$('roles');if(el)window.scrollTo({top:el.getBoundingClientRect().top+window.scrollY-40,behavior:'smooth'});}

  function renderAll(){renderGoals();renderSpecs();paintMap();renderDetail();renderFoundation();renderSpecCards();renderProjects();renderCert();}

  document.addEventListener('click',function(e){
    var t=e.target.closest('[data-role],[data-go],[data-toggle],[data-f],#rmMore,#pMore');if(!t)return;
    if(t.id==='rmMore'){state.all=!state.all;renderDetail();return;}
    if(t.id==='pMore'){state.pall=!state.pall;renderProjects();return;}
    if(t.hasAttribute('data-go')){go(t.getAttribute('data-go'));return;}
    if(t.hasAttribute('data-toggle')){var k=t.getAttribute('data-toggle');state.open[k]=!state.open[k];renderSpecCards();return;}
    if(t.hasAttribute('data-f')){state.filter=t.getAttribute('data-f');state.pall=false;renderProjects();return;}
    if(t.hasAttribute('data-role')&&t.tagName==='BUTTON')pick(t.getAttribute('data-role'));
  });

  try{renderAll();}catch(err){if(window.console)console.error('roadmap render',err);}

  // Start free -> the first free lesson of New to R
  if(C.first){var sf=$('startFree');if(sf)sf.setAttribute('href',C.first);}

  // refresh the counts from the live catalog so newly published lessons show without a rebuild
  fetch('/courses.json',{cache:'no-cache'}).then(function(r){return r.ok?r.json():null;}).then(function(cat){
    if(!cat)return;var T={},S={};
    (cat.courses||cat).forEach(function(c){var rm=c.roadmap;if(!rm||!rm.track)return;
      var n=(c.lessons||[]).filter(function(l){return l.built!==false;}).length;
      T[rm.track]=(T[rm.track]||0)+n;S[rm.track+':'+rm.section]=(S[rm.track+':'+rm.section]||0)+n;});
    C={t:T,s:S,first:C.first};renderDetail();renderSpecCards();
  }).catch(function(){});
})();
