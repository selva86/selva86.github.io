// roadmap-f2.js -- main roadmap page renderer (redesign-v1 skin).
// The DESIGN is the redesign-v1 mock (split hero + chart figure, signature-viz role cards,
// numbered milestone curriculum with FREE/Interactive/Quiz badge hierarchy, fork, project
// cards). The DATA stays live: everything renders from RM / RM2 (roadmap-data.js +
// roadmap-curriculum.js) and window.__RMLESSONS__, and applyHybrid() still refreshes the
// interactive-lesson rows from /courses.json so newly published lessons appear automatically.
(function(){
  'use strict';
  var reduceMo = window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches;

  var CORE=['foundations','analyst'], TRACKS=['ds','ts','researcher','developer'];
  var ROLE={foundations:'New to R',analyst:'Data Analyst',ds:'Data Scientist',ts:'Forecaster',researcher:'Researcher',developer:'R Developer'};
  var CVAR={foundations:'--core',analyst:'--core',ds:'--ds',ts:'--ts',researcher:'--res',developer:'--dev'};
  var OUTCOME={foundations:'Fluency in the language itself.',analyst:'Answer real questions with data.',ds:'A validated model you can defend.',ts:'A forecast with honest intervals.',researcher:'A reproducible, review-proof report.',developer:'A tested package, shipped to GitHub.'};
  var CERT={foundations:'R Fundamentals',analyst:'Tidyverse Practitioner',ds:'Machine Learning with R',ts:'Time Series Forecasting',researcher:'Applied Statistics with R',developer:'Advanced R'};
  var SPECCLS={ds:'spec-ds',ts:'spec-ts',researcher:'spec-res',developer:'spec-dev'};
  var TRACKTAG={ds:'Machine Learning',ts:'Time Series',researcher:'Applied Statistics',developer:'Advanced R'};
  var SLUG={foundations:'new-to-r',analyst:'data-analyst',ds:'data-scientist',ts:'forecaster',researcher:'researcher',developer:'r-developer'};
  var CHNUM={foundations:'01',analyst:'02',ds:'03',ts:'04',researcher:'05',developer:'06'};
  var TIER={Starter:1,Core:2,Advanced:3,Capstone:4};
  var TIERC={Starter:'--core',Core:'--ds',Advanced:'--ts',Capstone:'--dev'};

  function esc(t){return String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  function two(n){return n<10?'0'+n:''+n;}
  function headText(L){return (L&&L.head?L.head:'').replace(/<\/?em>/g,'');}
  function roleHref(k){return '/roadmap/'+(SLUG[k]||k)+'.html';}
  function postHref(t){return (window.RM2&&RM2.links&&RM2.links[t])||(window.RM&&RM.STOP_LINKS&&RM.STOP_LINKS[t])||'';}
  function trackLessonCount(k){var s=RM2.sections[k]||[];return s.reduce(function(a,x){return a+x.items.length;},0);}

  /* ---- inline icon set (24x24 stroke) ---- */
  var ICONS={
   terminal:'<rect x="3" y="4" width="18" height="16" rx="2.5"/><polyline points="7 9 10 12 7 15"/><line x1="13" y1="15" x2="17" y2="15"/>',
   stack:'<rect x="3" y="4" width="18" height="4" rx="1.4"/><rect x="3" y="10" width="18" height="4" rx="1.4"/><rect x="3" y="16" width="18" height="4" rx="1.4"/>',
   table:'<rect x="3" y="4" width="18" height="16" rx="2.5"/><line x1="3" y1="9.5" x2="21" y2="9.5"/><line x1="9.5" y1="9.5" x2="9.5" y2="20"/><line x1="15" y1="9.5" x2="15" y2="20"/>',
   braces:'<path d="M8 4H7a3 3 0 0 0-3 3v2a2 2 0 0 1-2 2 2 2 0 0 1 2 2v2a3 3 0 0 0 3 3h1"/><path d="M16 4h1a3 3 0 0 1 3 3v2a2 2 0 0 0 2 2 2 2 0 0 0-2 2v2a3 3 0 0 1-3 3h-1"/>',
   funnel:'<path d="M3 4h18l-7 8v7l-4 2v-9L3 4z"/>',
   bars:'<line x1="4" y1="20" x2="20" y2="20"/><rect x="5.5" y="12" width="3" height="8" rx="1"/><rect x="10.5" y="7" width="3" height="13" rx="1"/><rect x="15.5" y="14" width="3" height="6" rx="1"/>',
   scatter:'<line x1="4" y1="4" x2="4" y2="20"/><line x1="4" y1="20" x2="20" y2="20"/><circle cx="8" cy="15" r="1.5"/><circle cx="12" cy="10" r="1.5"/><circle cx="16" cy="12" r="1.5"/><circle cx="10" cy="8" r="1.5"/>',
   trend:'<line x1="4" y1="4" x2="4" y2="20"/><line x1="4" y1="20" x2="20" y2="20"/><path d="M6 17 19 7"/><circle cx="9" cy="14.5" r="1.3"/><circle cx="13" cy="11.5" r="1.3"/><circle cx="16" cy="9" r="1.3"/>',
   clusters:'<ellipse cx="8.5" cy="9" rx="4.2" ry="3.2"/><ellipse cx="15.5" cy="15" rx="4.2" ry="3.2"/><circle cx="8" cy="8.6" r="1"/><circle cx="9.4" cy="9.8" r="1"/><circle cx="15" cy="14.6" r="1"/><circle cx="16.4" cy="15.6" r="1"/>',
   wave:'<line x1="4" y1="20" x2="20" y2="20"/><path d="M4 14 Q7 8 10 12 T15 10"/><path d="M15 10 20 5.5" stroke-dasharray="2.4 2.4"/>',
   bell:'<line x1="3" y1="19" x2="21" y2="19"/><path d="M4 19c4 0 4-13 8-13s4 13 8 13"/>',
   doc:'<path d="M7 3h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><polyline points="14 3 14 8 19 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="16.5" x2="15" y2="16.5"/>',
   cube:'<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/>',
   layers:'<polygon points="12 3 21 8 12 13 3 8"/><polyline points="4 12 12 16.5 20 12"/><polyline points="4 16 12 20.5 20 16"/>',
   gauge:'<path d="M4 18a8 8 0 0 1 16 0"/><line x1="12" y1="18" x2="16.5" y2="12.5"/><circle cx="12" cy="18" r="1.3"/>',
   loop:'<path d="M4 12a8 8 0 0 1 13.6-5.6"/><polyline points="18 3 18 7 14 7"/><path d="M20 12a8 8 0 0 1-13.6 5.6"/><polyline points="6 21 6 17 10 17"/>',
   database:'<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>',
   book:'<path d="M4 5a2 2 0 0 1 2-2h13v18H6a2 2 0 0 1-2-2z"/><line x1="8" y1="7.5" x2="15" y2="7.5"/><line x1="8" y1="11" x2="15" y2="11"/>'
  };
  var ICONMAP=[
   [/syntax|first r|session|install|package|getting help|help in r/i,'terminal'],
   [/vector|atomic|data type|list|recycl|coercion|special value|subset/i,'stack'],
   [/data frame|tibble|matrix|arrays|structure|inspect/i,'table'],
   [/control flow|function|project|closure factory|writing r/i,'braces'],
   [/dplyr|wrangl|filter|import|join|reshape|pivot|tidy|missing|clean|transform|mutat|group|summar/i,'funnel'],
   [/data.?table|bigger|dtplyr|memory data|large|speed.?up|performance|parallel|profil/i,'gauge'],
   [/ggplot|visuali|chart|plot|publication|graphic|figure|scatter plot|bar chart|aesthetic|geom|theme/i,'bars'],
   [/dashboard|shiny|interactive chart|quarto|report|markdown|story|communicat|reproduc/i,'doc'],
   [/eda|explor|distribution|correlation|outlier|univariate|bivariate|profile/i,'scatter'],
   [/regression|linear|logistic|glm|diagnostic|residual|model|assumption|ols|bias.?variance|framing/i,'trend'],
   [/cluster|pca|unsupervis|segment|dimension|k-?means|dbscan|t-?sne|umap|component/i,'clusters'],
   [/time series|forecast|arima|season|trend and|decompos|horizon|ets|holt/i,'wave'],
   [/probabil|sampling|hypothesis|test|anova|inference|effect size|bootstrap|nonparam|central limit|random variable|confidence|distribution.*(t|f|chi)|significance/i,'bell'],
   [/oop|s3|s4|r6|class|object|dispatch|method|operator overload|generic/i,'cube'],
   [/environment|scope|lexical|name|value|internal|lobstr|namespace|promise/i,'layers'],
   [/functional|purrr|map|reduce|compose|higher.?order|operator|vectoris|vectoriz|apply/i,'loop'],
   [/debug|condition|error|warning|test|profil/i,'gauge']
  ];
  function iconFor(title){var t=title||'';for(var i=0;i<ICONMAP.length;i++){if(ICONMAP[i][0].test(t))return ICONS[ICONMAP[i][1]];}return ICONS.book;}
  function svgIcon(inner){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+inner+'</svg>';}
  var ARR='<svg class="larr" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';
  var RGO='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';
  var PLAY='<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="8 6 18 12 8 18 8 6"/></svg>';
  var SHIELD='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v5c0 4.4-3 7.4-7 8.6C8 19.4 5 16.4 5 12V6l7-3z"/><polyline points="9 12 11 14 15 10"/></svg>';
  var LOCK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/></svg>';
  var CHECK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
  var SEAL='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="9" r="5"/><path d="M9 13.5 8 21l4-2.4L16 21l-1-7.5"/></svg>';

  /* ---- lessons ---- */
  function badge(kind){
    if(kind==='quiz')return '<span class="lb quiz">'+SHIELD+'Quiz</span>';
    if(kind==='interactive')return '<span class="lb inter">'+PLAY+'Interactive</span>';
    if(kind==='pro')return '<span class="lb pro">'+LOCK+'Pro</span>';
    if(kind==='soon')return '<span class="lb soon">Soon</span>';
    if(kind==='read')return '<span class="lb read">Read</span>';
    return '';
  }
  function lessonRow(o){
    var inter=o.kind==='interactive', quiz=o.kind==='quiz', locked=(o.kind==='pro'||o.kind==='soon');
    var cls='lsn'+(inter?' inter':'')+(quiz?' quiz':'')+(locked?' lk':'')+(o.kind==='pro'?' pro':'')+(o.kind==='soon'?' soon':'');
    var inner='<span class="ldot"></span><span class="lw"><span class="lt">'+esc(o.title)+'</span>'
      +(o.sub?'<span class="lsub">'+esc(o.sub)+'</span>':'')+'</span>'+badge(o.kind)+ARR;
    if(o.href) return '<a class="'+cls+'" href="'+esc(o.href)+'">'+inner+'</a>';
    return '<span class="'+cls+'">'+inner+'</span>';
  }
  function itemRow(t,isFree){
    if(isFree){var h=postHref(t);return lessonRow(h?{title:t,href:h,kind:'read'}:{title:t,kind:'soon'});}
    return lessonRow({title:t,href:'/pricing.html',kind:'pro'});
  }

  /* ---- section accordion ---- */
  function sectionEl(key,sec,open){
    var allFree=(key==='foundations'||key==='analyst');
    var isFree=allFree||sec.free, pro=!isFree;
    var chip=pro?'<span class="chip pro">'+LOCK+'Pro</span>':'<span class="chip free">'+CHECK+'Free</span>';
    var rows=sec.items.map(function(t){return itemRow(t,isFree);}).join('');
    return '<details class="sec'+(pro?' pro':'')+'" data-track="'+key+'" data-sec="'+sec.n+'"'+(open?' open':'')+'>'
      +'<summary class="sm'+(pro?' pro':'')+'">'
        +'<span class="thumb">'+svgIcon(iconFor(sec.title))+'</span>'
        +'<span class="sinfo"><span class="stopline"><span class="snn">'+two(sec.n)+'</span><span class="stitle">'+esc(sec.title)+'</span></span>'
          +(sec.outcome?'<span class="ssub">'+esc(sec.outcome)+'</span>':'')+'</span>'
        +'<span class="sright"><span class="lcount"><span class="cnt">'+sec.items.length+'</span> lessons</span> '+chip+'<span class="car"></span></span>'
      +'</summary>'
      +'<div class="lsns">'+rows+'</div></details>';
  }

  /* ---- chapter meta pills ---- */
  function metaPills(key,count){
    var secs=RM2.sections[key]||[], af=(key==='foundations'||key==='analyst');
    var bits=[count+' lessons', secs.length+' sections', af?'all free':'Section 1 free'];
    return bits.map(function(b){var f=/free/i.test(b);return '<span'+(f?' class="free"':'')+'>'+(f?CHECK:'')+esc(b)+'</span>';}).join('');
  }

  /* ---- chapter (level card) ---- */
  function chapterEl(key){
    var L=RM.byKey(key), secs=RM2.sections[key], cv=CVAR[key], count=trackLessonCount(key);
    var body=secs.map(function(s,i){return sectionEl(key,s,i===0);}).join('');
    var cred='<div class="cred"><span class="cmark">'+SEAL+'</span>'
      +'<span><span class="ct">Earn the '+esc(CERT[key]||L.cert||'certificate')+' certificate</span>'
      +'<span class="cs">Complete every section to certify this role.</span></span>'
      +'<span class="cver">Credential</span></div>';
    return '<article class="chapter" style="--c:var('+cv+')">'
      +'<div class="chnum"><b>'+CHNUM[key]+'</b><span class="chspine"></span></div>'
      +'<div class="chbody">'
        +'<div class="chhead"><div class="cheye">'+esc(ROLE[key])+'</div><h3>'+esc(headText(L))+'</h3>'
          +'<p class="chbecome">'+esc(L.become)+'</p><div class="chmeta" data-track="'+key+'">'+metaPills(key,count)+'</div></div>'
        +'<div class="secs">'+body+'</div>'+cred
      +'</div></article>';
  }
  function specCard(key){
    var top='<div class="spectop"><span class="sbadge">'+svgIcon(iconFor(RM.byKey(key).head))+'</span>'
      +'<div><div class="stt">'+esc(TRACKTAG[key])+'</div><div class="stx">'+esc(OUTCOME[key])+'</div></div></div>';
    return '<div class="speccard '+SPECCLS[key]+' reveal">'+top+chapterEl(key)+'</div>';
  }

  /* ---- role cards ---- */
  function roleCard(key,spec){
    var cv=CVAR[key], secs=RM2.sections[key], count=trackLessonCount(key), af=(key==='foundations'||key==='analyst');
    var pills='<span>'+count+' lessons</span><span>'+secs.length+' sections</span>'+(af?'<span class="free">Free</span>':'<span class="free">Section 1 free</span>');
    return '<a class="rcard'+(spec?' spec':'')+' reveal" style="--c:var('+cv+')" href="'+roleHref(key)+'" data-viz="'+key+'">'
      +'<div class="rviz" data-role="'+key+'"></div>'
      +'<div class="rbody"><div class="reye">'+esc(ROLE[key])+'</div><h3>'+esc(headText(RM.byKey(key)))+'</h3>'
        +'<div class="rout">'+esc(OUTCOME[key])+'</div><div class="rmeta">'+pills+'</div></div>'
      +'<span class="rgo">'+RGO+'</span></a>';
  }

  /* ---- project thumbnails + cards ---- */
  function projThumb(p){
    var dom=(p.dom||'').toLowerCase();
    var seed=parseInt(p.n,10)||1;
    function rnd(i){var x=Math.sin(seed*12.9898+i*78.233)*43758.5453;return x-Math.floor(x);}
    var body='';
    if(/scientist/.test(dom)){
      body='<rect x="14" y="8" width="192" height="56" rx="6" fill="none" stroke="var(--line)"/>';
      body+='<path d="M18 60 Q110 12 202 30" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="3 4" opacity=".55"/>';
      for(var i=0;i<9;i++){var cx=24+rnd(i)*168,cy=16+rnd(i+9)*40,up=cy<40;body+='<circle cx="'+cx.toFixed(0)+'" cy="'+cy.toFixed(0)+'" r="3.2" fill="'+(up?'currentColor':'#b9bdc4')+'"/>';}
    } else if(/forecaster/.test(dom)){
      body='<path d="M16 52 L46 44 L76 50 L106 34 L136 40 L166 30" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>';
      body+='<path d="M166 30 L200 20 L200 46 L166 30 Z" fill="currentColor" opacity=".14"/>';
      body+='<path d="M166 30 L200 24" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="2 4"/>';
      body+='<line x1="166" y1="8" x2="166" y2="60" stroke="var(--line)" stroke-dasharray="2 3"/>';
    } else if(/researcher/.test(dom)){
      body='<line x1="110" y1="10" x2="110" y2="62" stroke="var(--line)" stroke-dasharray="2 3"/>';
      var rows=[[60,22],[84,18],[38,34],[100,30],[70,46]];
      for(var r=0;r<rows.length;r++){var a=rows[r][0],y=8+r*11,b=a+52;body+='<line x1="'+a+'" y1="'+y+'" x2="'+b+'" y2="'+y+'" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity=".7"/><circle cx="'+((a+b)/2)+'" cy="'+y+'" r="3" fill="currentColor"/>';}
    } else if(/developer/.test(dom)){
      body='<rect x="14" y="10" width="120" height="52" rx="6" fill="#fff" stroke="var(--line)"/>';
      var yy=[20,30,40,50];for(var c=0;c<4;c++){body+='<rect x="24" y="'+yy[c]+'" width="'+(90-c*14)+'" height="4" rx="2" fill="'+(c===0?'currentColor':'#c9ccd2')+'"/>';}
      for(var t=0;t<3;t++){body+='<circle cx="154" cy="'+(20+t*15)+'" r="6" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M150.5 '+(20+t*15)+' l2.4 2.4 l4.2 -5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>';}
    } else {
      body='<line x1="14" y1="60" x2="206" y2="60" stroke="var(--line)"/>';
      var h=[26,40,20,48,32,44];for(var bx=0;bx<6;bx++){var bh=h[bx],x=22+bx*30;body+='<rect x="'+x+'" y="'+(60-bh)+'" width="18" height="'+bh+'" rx="3" fill="currentColor" opacity="'+(0.55+bx*0.07).toFixed(2)+'"/>';}
    }
    return '<svg viewBox="0 0 220 72" preserveAspectRatio="xMidYMid meet" style="color:var(--c)">'+body+'</svg>';
  }
  function projCard(p){
    var cv=p.accent||'var(--core)';
    var feat=(p.tier==='Capstone');
    var meter='';for(var i=0;i<4;i++)meter+='<i class="'+(i<p.level?'on':'')+'"></i>';
    var free=(p.free==='1');
    return '<div class="pcard'+(feat?' feat':'')+' reveal" data-tier="'+esc(p.tier)+'" data-free="'+esc(p.free)+'" style="--c:'+cv+'">'
      +(feat?'<span class="pribbon">Capstone build</span>':'')
      +'<div class="pthumb">'+projThumb(p)+'<span class="pn">'+esc(p.n)+'</span>'
        +(free?'<span class="pfree">Free</span>':'')+'</div>'
      +'<div class="pbody">'
        +'<div class="pdom">'+esc((p.dom||'').replace(/\.$/,''))+'</div>'
        +'<div class="ptt">'+esc(p.name)+'</div>'
        +'<div class="pdesc">'+esc(p.desc)+'</div>'
        +'<div class="pfoot"><span class="pmeter">'+meter+'<span class="ml">'+esc(p.ml)+'</span></span>'
          +'<span class="psoon">'+esc(p.ptag||'Soon')+'</span></div>'
      +'</div></div>';
  }
  function projObj(p){
    return {n:String(p.n),tier:p.tier,free:p.free?'1':'0',dom:p.domain,name:p.name,desc:p.blurb,
      level:TIER[p.tier]||1,ml:p.tier,ptag:'Soon',accent:'var('+(TIERC[p.tier]||'--core')+')'};
  }

  /* =================== RENDER =================== */
  // progress + reveal set up first, and static reveals observed early, so the page is
  // resilient even if a later render step throws.
  var prog=document.getElementById('prog');
  function onScroll(){var h=document.documentElement,max=h.scrollHeight-h.clientHeight;if(prog)prog.style.width=(max>0?(h.scrollTop/max*100):0)+'%';}
  document.addEventListener('scroll',onScroll,{passive:true});onScroll();
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{threshold:.08,rootMargin:'0px 0px -40px 0px'});
  function observeAll(){Array.prototype.forEach.call(document.querySelectorAll('.reveal:not(.in)'),function(el){io.observe(el);});}
  observeAll();

  function set(id,html){var el=document.getElementById(id);if(el)el.innerHTML=html;}

  // hero stats
  var totalLessons=CORE.concat(TRACKS).reduce(function(a,k){return a+trackLessonCount(k);},0);
  set('hstats',[['6','roles'],[String(totalLessons),'lessons'],[String(RM2.projectList.length),'projects'],['6','certificates']]
    .map(function(s){return '<div><b>'+s[0]+'</b><span>'+s[1]+'</span></div>';}).join(''));

  // role cards
  set('coreRoles',CORE.map(function(k){return roleCard(k,false);}).join(''));
  set('specRoles',TRACKS.map(function(k){return roleCard(k,true);}).join(''));

  // core chapters (paper) + spec cards (tinted)
  set('coreChapters',CORE.map(function(k){return chapterEl(k);}).join(''));
  set('specChapters',TRACKS.map(function(k){return specCard(k);}).join(''));

  // projects
  set('pgrid',RM2.projectList.map(function(p){return projCard(projObj(p));}).join(''));
  var pfilters=['All','Free','Starter','Core','Advanced','Capstone'];
  var counts={All:RM2.projectList.length,Free:RM2.projectList.filter(function(p){return p.free;}).length};
  RM2.projectList.forEach(function(p){counts[p.tier]=(counts[p.tier]||0)+1;});
  var pctl=document.getElementById('pctl');
  if(pctl){
    pctl.innerHTML=pfilters.map(function(f,i){var cnt=counts[f]!=null?counts[f]:'';
      return '<button class="pfilt'+(i===0?' on':'')+'" data-f="'+esc(f)+'">'+esc(f)+(cnt!==''?'<span class="cnt">'+cnt+'</span>':'')+'</button>';}).join('');
    pctl.addEventListener('click',function(e){var b=e.target.closest('.pfilt');if(!b)return;
      Array.prototype.forEach.call(pctl.children,function(x){x.classList.toggle('on',x===b);});
      var f=b.getAttribute('data-f');
      Array.prototype.forEach.call(document.querySelectorAll('#pgrid .pcard'),function(c){
        var show=(f==='All')||(f==='Free'?c.getAttribute('data-free')==='1':c.getAttribute('data-tier')===f);
        c.style.display=show?'':'none';});
    });
  }

  observeAll();

  /* =================== SIGNATURE VIZ (per-role) =================== */
  var MONO='ui-monospace,SFMono-Regular,Consolas,monospace';
  function vizFoundations(el){
    var C0=72,R0=44,CW=68,RH=26,cols=4,rows=4,g='',c,r;
    for(c=0;c<cols;c++)g+='<rect x="'+(C0+c*CW)+'" y="'+R0+'" width="58" height="18" rx="5" style="fill:var(--c);opacity:.18"/>';
    for(c=0;c<cols;c++)for(r=0;r<rows;r++)g+='<rect class="hv-in" x="'+(C0+c*CW)+'" y="'+(R0+RH+r*RH)+'" width="58" height="18" rx="5" fill="#fff" style="animation-delay:'+((c*rows+r)*55)+'ms;stroke:var(--line)" stroke-width="1"/>';
    el.innerHTML='<svg viewBox="0 0 410 200">'+g+'</svg>';
  }
  function vizAnalyst(el){
    var t='<rect x="30" y="52" width="118" height="112" rx="9" fill="#f5f4ef" style="stroke:var(--line)"/><rect x="30" y="52" width="118" height="20" rx="9" style="fill:var(--c);opacity:.14"/>';
    [96,118,140].forEach(function(y){t+='<line x1="30" y1="'+y+'" x2="148" y2="'+y+'" style="stroke:var(--line2)"/>';});[70,109].forEach(function(x){t+='<line x1="'+x+'" y1="52" x2="'+x+'" y2="164" style="stroke:var(--line2)"/>';});
    var k='';[85,107,129,151].forEach(function(y){[49,89,128].forEach(function(x){k+='<rect x="'+(x-9)+'" y="'+(y-2)+'" width="15" height="3" rx="1.5" style="fill:var(--faint)" opacity=".5"/>';});});
    var ar='<path d="M166 108 L188 108 M181 102 L188 108 L181 114" fill="none" style="stroke:var(--faint)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
    var BX=[212,244,276,308,340],bars='';BX.forEach(function(x,i){bars+='<rect id="a_hvbar'+i+'" x="'+x+'" width="22" rx="3" style="fill:var(--c)"/>';});
    el.innerHTML='<svg viewBox="0 0 410 200"><line x1="206" y1="164" x2="374" y2="164" style="stroke:var(--line)"/>'+t+k+ar+bars+'</svg>';
    var R=BX.map(function(_,i){return el.querySelector('#a_hvbar'+i);}),base=[54,84,42,96,68];
    function fr(ts){R.forEach(function(rr,i){var h=base[i]+Math.sin(ts*0.0016+i*1.1)*6,y=164-h;rr.setAttribute('y',y.toFixed(1));rr.setAttribute('height',h.toFixed(1));});if(!reduceMo)requestAnimationFrame(fr);}
    if(reduceMo)fr(2200);else requestAnimationFrame(fr);
  }
  function vizDS(el){
    var d='',B=[[70,72],[104,54],[140,84],[92,104],[120,116]],A=[[286,132],[322,122],[352,154],[300,148],[268,140]];
    B.forEach(function(p){d+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="5" fill="#2563a8" stroke="#fff" stroke-width="2"/>';});
    A.forEach(function(p){d+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="5" fill="#d98a2b" stroke="#fff" stroke-width="2"/>';});
    var g='';[72,124].forEach(function(y){g+='<line x1="28" y1="'+y+'" x2="382" y2="'+y+'" style="stroke:var(--line2)"/>';});[140,260].forEach(function(x){g+='<line x1="'+x+'" y1="24" x2="'+x+'" y2="176" style="stroke:var(--line2)"/>';});
    el.innerHTML='<svg viewBox="0 0 410 200"><rect x="28" y="24" width="354" height="152" rx="12" fill="none" style="stroke:var(--line)"/>'+g+'<path id="ds_bn" fill="none" style="stroke:var(--c)" stroke-width="14" stroke-linecap="round" opacity="0.12"/><path id="ds_bd" fill="none" style="stroke:var(--c)" stroke-width="2.6" stroke-linecap="round"/>'+d+'<circle id="ds_pl" r="4" style="fill:var(--c)"/><text id="ds_ac" x="372" y="46" text-anchor="end" font-family="Inter Tight" font-weight="700" font-size="17" style="fill:var(--c)">97%</text></svg>';
    var bd=el.querySelector('#ds_bd'),bn=el.querySelector('#ds_bn'),pl=el.querySelector('#ds_pl'),ac=el.querySelector('#ds_ac');
    function q(p,c){var m=1-p;return[m*m*30+2*m*p*205+p*p*378,m*m*168+2*m*p*c+p*p*72];}
    function fr(ts){var c=110+Math.sin(ts*0.0009)*14,dd='M30 168 Q205 '+c.toFixed(1)+' 378 72';bd.setAttribute('d',dd);bn.setAttribute('d',dd);bn.setAttribute('opacity',(0.13+Math.sin(ts*0.0012)*0.05).toFixed(3));var pp=(ts*0.00017)%1,xy=q(pp,c);pl.setAttribute('cx',xy[0].toFixed(1));pl.setAttribute('cy',xy[1].toFixed(1));ac.textContent=(97+Math.sin(ts*0.0006)*0.5).toFixed(1)+'%';if(!reduceMo)requestAnimationFrame(fr);}
    if(reduceMo)fr(2200);else requestAnimationFrame(fr);
  }
  function vizForecaster(el){
    var hist='M40 128 L70 120 L100 128 L130 106 L160 116 L190 100 L205 106';
    el.innerHTML='<svg viewBox="0 0 410 200"><line x1="40" y1="168" x2="380" y2="168" style="stroke:var(--line)"/><line x1="205" y1="36" x2="205" y2="168" style="stroke:var(--faint)" stroke-width="1" stroke-dasharray="3 4" opacity=".6"/><text x="205" y="28" text-anchor="middle" font-family="'+MONO+'" font-size="10" style="fill:var(--faint)">now</text><path id="ts_fan" style="fill:var(--c)" opacity="0.12"/><path d="'+hist+'" fill="none" style="stroke:var(--c)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path id="ts_fore" fill="none" style="stroke:var(--c)" stroke-width="2.2" stroke-dasharray="2 5" stroke-linecap="round"/></svg>';
    var fan=el.querySelector('#ts_fan'),fore=el.querySelector('#ts_fore');
    function fy(x){return 106+(64-106)*((x-205)/175);}function fw(x){return ((x-205)/175)*30;}
    function fr(ts){var p=(ts%4400)/4400,rev,op=1;if(p<0.84)rev=p/0.84;else{rev=1;op=1-(p-0.84)/0.16;}var xE=205+175*rev,dd='M205 106',top='M205 106',bot=[],i;for(i=211;i<=xE;i+=6){dd+=' L'+i+' '+fy(i).toFixed(1);top+=' L'+i+' '+(fy(i)-fw(i)).toFixed(1);bot.push([i,fy(i)+fw(i)]);}fore.setAttribute('d',dd);fore.setAttribute('opacity',op.toFixed(3));for(var j=bot.length-1;j>=0;j--)top+=' L'+bot[j][0]+' '+bot[j][1].toFixed(1);top+=' Z';fan.setAttribute('d',top);fan.setAttribute('opacity',(0.13*op).toFixed(3));if(!reduceMo)requestAnimationFrame(fr);}
    if(reduceMo)fr(3600);else requestAnimationFrame(fr);
  }
  function vizResearcher(el){
    var rows=[{y:52,a:98,b:178,d:138,s:1},{y:82,a:150,b:250,d:200,s:0},{y:112,a:120,b:192,d:156,s:1},{y:142,a:182,b:262,d:222,s:0},{y:172,a:216,b:288,d:252,s:1}];
    var Z=205,s='<line x1="'+Z+'" y1="32" x2="'+Z+'" y2="186" style="stroke:var(--faint)" stroke-width="1" stroke-dasharray="3 4" opacity=".7"/><text x="'+Z+'" y="24" text-anchor="middle" font-family="'+MONO+'" font-size="10" style="fill:var(--faint)">no effect</text>';
    rows.forEach(function(r,i){var c=r.s?'var(--c)':'var(--faint)',o=r.s?1:.5;
      s+='<g class="hv-in" style="animation-delay:'+(i*110)+'ms"><line x1="'+r.a+'" y1="'+r.y+'" x2="'+r.b+'" y2="'+r.y+'" style="stroke:'+c+'" stroke-width="2" stroke-linecap="round" opacity="'+o+'"/><line x1="'+r.a+'" y1="'+(r.y-4)+'" x2="'+r.a+'" y2="'+(r.y+4)+'" style="stroke:'+c+'" stroke-width="1.6" opacity="'+o+'"/><line x1="'+r.b+'" y1="'+(r.y-4)+'" x2="'+r.b+'" y2="'+(r.y+4)+'" style="stroke:'+c+'" stroke-width="1.6" opacity="'+o+'"/><circle cx="'+r.d+'" cy="'+r.y+'" r="4.6"'+(r.s?' class="hv-pulse"':'')+' style="fill:'+c+'" stroke="#fff" stroke-width="1.5"/></g>';});
    el.innerHTML='<svg viewBox="0 0 410 200">'+s+'</svg>';
  }
  function vizDeveloper(el){
    var code='<rect x="34" y="44" width="152" height="128" rx="10" fill="#f5f4ef" style="stroke:var(--line)"/>';
    var L=[[48,58,92],[60,74,116],[60,90,94],[48,106,72],[60,122,112],[48,138,64]];
    L.forEach(function(l,i){code+='<rect x="'+l[0]+'" y="'+l[1]+'" width="'+l[2]+'" height="6" rx="3" style="fill:'+(i===0?'var(--c)':'var(--faint)')+';opacity:'+(i===0?.85:.45)+'"/>';});
    var TX=212,TY=56,TH=30,tr='',i;
    for(i=0;i<4;i++){var y=TY+i*TH;
      tr+='<circle cx="'+(TX+9)+'" cy="'+(y+9)+'" r="9" fill="#f5f4ef" style="stroke:var(--line)" stroke-width="1.5"/>'
        +'<path id="dev_ck'+i+'" d="M'+(TX+4.5)+' '+(y+9)+' l3 3.2 l6.2 -7.4" fill="none" style="stroke:var(--c)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0"/>'
        +'<rect id="dev_nm'+i+'" x="'+(TX+26)+'" y="'+(y+5)+'" width="'+(118-i*12)+'" height="7" rx="3.5" style="fill:var(--faint);opacity:.4"/>';}
    el.innerHTML='<svg viewBox="0 0 410 200">'+code+tr+'</svg>';
    var ck=[],nm=[],last=-1;for(i=0;i<4;i++){ck.push(el.querySelector('#dev_ck'+i));nm.push(el.querySelector('#dev_nm'+i));}
    function fr(t2){var p=Math.floor((t2%5200)/900);if(p>4)p=4;if(p!==last){for(var i=0;i<4;i++){ck[i].setAttribute('opacity',i<p?'1':'0');nm[i].setAttribute('style','fill:'+(i<p?'var(--c)':'var(--faint)')+';opacity:'+(i<p?.6:.4));}last=p;}if(!reduceMo)requestAnimationFrame(fr);}
    if(reduceMo){ck.forEach(function(c){c.setAttribute('opacity','1');});nm.forEach(function(n){n.setAttribute('style','fill:var(--c);opacity:.6');});}else requestAnimationFrame(fr);
  }
  var HEROVIZ={foundations:vizFoundations,analyst:vizAnalyst,ds:vizDS,ts:vizForecaster,researcher:vizResearcher,developer:vizDeveloper};
  Array.prototype.forEach.call(document.querySelectorAll('.rviz'),function(el){var fn=HEROVIZ[el.getAttribute('data-role')];if(fn){try{fn(el);}catch(e){}}});

  /* hero chart = a fitted regression line through real data (chart-led, no code box) */
  (function(){var el=document.getElementById('heroChart');if(!el)return;
  try{
  var pts=[[52,168],[86,150],[122,138],[158,120],[196,108],[236,92],[276,84],[318,66],[104,158],[142,128],[182,124],[224,100],[262,72],[300,86],[344,58]],d='';
  pts.forEach(function(p){d+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="4.5" fill="var(--core)" stroke="#fff" stroke-width="1.6" opacity=".92"/>';});
  var g='';[64,112,160].forEach(function(y){g+='<line x1="36" y1="'+y+'" x2="392" y2="'+y+'" style="stroke:var(--line2)"/>';});
  el.innerHTML='<svg viewBox="0 0 420 210" role="img" aria-label="a fitted regression line through real data">'
   +'<line x1="36" y1="192" x2="392" y2="192" stroke="var(--line)"/><line x1="36" y1="28" x2="36" y2="192" stroke="var(--line)"/>'+g
   +'<path d="M44 176 C 150 140, 260 96, 384 52" stroke="var(--core)" stroke-width="2.6" stroke-linecap="round" fill="none"/>'
   +'<path d="M44 176 C 150 140, 260 96, 384 52 L384 84 C 260 122, 150 160, 44 188 Z" fill="var(--core)" opacity=".08"/>'
   +d+'<text x="388" y="44" text-anchor="end" font-size="11.5" font-weight="600" fill="var(--core)" font-family="Inter,sans-serif">hwy ~ displ</text></svg>';
  }catch(e){} })();

  /* ---- Start free -> the first free lesson (from baked lesson data) ---- */
  (function(){
    var href='', cat=window.__RMLESSONS__;
    if(cat&&cat.courses){
      for(var i=0;i<cat.courses.length&&!href;i++){var c=cat.courses[i];
        if(c.roadmap&&c.roadmap.track==='foundations'&&c.roadmap.section===1){
          var ls=(c.lessons||[]).slice().sort(function(a,b){return (a.order||0)-(b.order||0);});
          for(var j=0;j<ls.length;j++){if(ls[j].kind!=='quiz'){href='/'+ls[j].slug+'.html';break;}}
        }
      }
    }
    var el=document.getElementById('startFree');
    if(el&&href)el.setAttribute('href',href);
  })();

  /* =================== HYBRID: interactive-lesson rows =================== */
  // analyst + foundations (and ds, as it ships) are covered by interactive lessons, so each
  // section's flat concept list is replaced by one row per lesson (+ subtitle). Data is BAKED
  // inline (window.__RMLESSONS__) for a synchronous first paint, then the async /courses.json
  // fetch refreshes to pick up anything published since the last rebuild.
  (function(){
    var HYBRID={analyst:1,foundations:1,ds:1};
    function applyHybrid(cat){
      if(!cat||!cat.courses)return;
      var byTrack={};
      cat.courses.forEach(function(c){ if(!c.roadmap||!HYBRID[c.roadmap.track])return;
        var t=c.roadmap.track; byTrack[t]=byTrack[t]||{};
        (byTrack[t][c.roadmap.section]=byTrack[t][c.roadmap.section]||[]).push(c); });
      Object.keys(byTrack).forEach(function(track){
        var bySec=byTrack[track], grand=0;
        Object.keys(bySec).forEach(function(n){
          var det=document.querySelector('details.sec[data-track="'+track+'"][data-sec="'+n+'"]'); if(!det)return;
          var lsns=det.querySelector('.lsns'); if(!lsns)return;
          var rows='',cnt=0;
          bySec[n].forEach(function(c){
            (c.lessons||[]).slice().sort(function(a,b){return (a.order||0)-(b.order||0);}).forEach(function(l){
              if(l.built===false)return; cnt++;
              rows+=lessonRow({title:l.title,sub:(l.subtitle||'').trim(),href:'/'+l.slug+'.html',kind:l.kind==='quiz'?'quiz':'interactive'});
            });
          });
          if(!rows)return;
          lsns.innerHTML=rows;
          var cb=det.querySelector('.cnt'); if(cb)cb.textContent=String(cnt);
          grand+=cnt;
        });
        if(grand){var m=document.querySelector('.chmeta[data-track="'+track+'"]'); if(m)m.innerHTML=metaPills(track,grand);}
      });
      // DS: not-yet-built Pro sections are the road ahead, not buyable now -> show "Soon".
      // Guarded on the catalog actually carrying DS lessons; upgraded sections are skipped.
      var dsUp=byTrack['ds'];
      if(dsUp&&RM2.sections['ds']){
        RM2.sections['ds'].forEach(function(s){
          if(dsUp[s.n])return;
          var det=document.querySelector('details.sec[data-track="ds"][data-sec="'+s.n+'"]'); if(!det)return;
          det.querySelectorAll('a.lsn.pro').forEach(function(a){
            var lt=a.querySelector('.lt'),title=lt?lt.textContent:'';
            var span=document.createElement('span');
            span.className='lsn lk soon';
            span.innerHTML='<span class="ldot"></span><span class="lw"><span class="lt">'+esc(title)+'</span></span>'+badge('soon')+ARR;
            a.parentNode.replaceChild(span,a);
          });
        });
      }
    }
    // 1) synchronous first paint from inline-baked data
    if(window.__RMLESSONS__)applyHybrid(window.__RMLESSONS__);
    // 2) refresh from the live catalog
    fetch('/courses.json',{cache:'no-cache'}).then(function(r){return r.ok?r.json():null;}).then(applyHybrid).catch(function(){});
  })();

})();
