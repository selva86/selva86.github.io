(function(){
  function esc(t){return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;');}
  function freeHref(t){return (RM2.links&&RM2.links[t])||RM.STOP_LINKS[t]||'/tutorials/';}
  var CORE=['foundations','analyst'], TRACKS=['ds','ts','researcher','developer'];
  var ROLE={foundations:'New to R',analyst:'Data Analyst',ds:'Data Scientist',ts:'Forecaster',researcher:'Researcher',developer:'R Developer'};
  var CV={foundations:'--core',analyst:'--core',ds:'--ds',ts:'--ts',researcher:'--res',developer:'--dev'};
  var DCV={'Data Analyst':'--ds','Data Scientist':'--ds','Forecaster':'--ts','Researcher':'--res','Statistician':'--res','R Developer':'--dev'};
  var TIER={Starter:1,Core:2,Advanced:3,Capstone:4};

  var lessons=CORE.concat(TRACKS).reduce(function(a,k){return a+RM2.sections[k].reduce(function(b,s){return b+s.items.length;},0);},0);
  document.getElementById('stats').innerHTML='<div><b>6</b><span>roles</span></div><div><b>'+lessons+'</b><span>lessons</span></div><div><b>'+RM2.projectList.length+'</b><span>projects</span></div><div><b>6</b><span>certificates</span></div>';
  var RDESC={foundations:'Start here',analyst:'Wrangle & visualize',ds:'Predict & model',ts:'Forecast over time',researcher:'Infer & prove',developer:'Engineer & ship'};
  var RARR='<span class="arr"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></span>';
  var SLUG={foundations:'new-to-r',analyst:'data-analyst',ds:'data-scientist',ts:'forecaster',researcher:'researcher',developer:'r-developer'};
  function roleHref(k){return '/roadmap/'+(SLUG[k]||k)+'.html';}
  function rtile(k){return '<a class="rtile" href="'+roleHref(k)+'" style="--c:var('+CV[k]+')"><i></i><span class="rn"><b>'+esc(ROLE[k])+'</b><span>'+esc(RDESC[k])+'</span></span>'+RARR+'</a>';}
  document.getElementById('rolerail').innerHTML=
    '<div class="glabel">Shared core</div><div class="grow core">'+CORE.map(rtile).join('')+'</div>'+
    '<div class="glabel">Then specialize</div><div class="grow tracks">'+TRACKS.map(rtile).join('')+'</div>';

  function lessonRow(t,isFree){
    if(isFree) return '<a class="lsn free" href="'+freeHref(t)+'"><span class="lt">'+esc(t)+'</span><span class="arr"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></span></a>';
    return '<a class="lsn pro" href="/pricing.html"><span class="lt">'+esc(t)+'</span><span class="go">Pro</span></a>';
  }
  function secDetails(s,isFree,open){
    return '<details class="sec"'+(open?' open':'')+'><summary><span class="car"></span><span class="sn">'+(s.n<10?'0'+s.n:s.n)+'</span><span class="st">'+esc(s.title)+'</span>'+
      '<span class="tag '+(isFree?'free':'pro')+'">'+(isFree?'Free':'Pro')+'</span><span class="cnt">'+s.items.length+'</span></summary>'+
      '<div class="lsns">'+s.items.map(function(t){return lessonRow(t,isFree);}).join('')+'</div></details>';
  }
  function milestone(key,opts){
    var L=RM.byKey(key), secs=RM2.sections[key], allFree=(key==='foundations'||key==='analyst');
    function isFree(s){return allFree||s.free;}
    var total=secs.reduce(function(a,s){return a+s.items.length;},0);
    var meta=allFree?(secs.length+' sections / '+total+' lessons / all free'):('Section 1 free / '+(secs.length-1)+' with Pro / '+total+' lessons');
    var body=secs.map(function(s,i){return secDetails(s,isFree(s),i===0);}).join('');
    var acts=opts.role?'<div class="acts"><a class="open" href="'+roleHref(key)+'">Open full page <span class="a">&rarr;</span></a><a class="enroll" href="/pricing.html">Enroll</a></div>':'';
    var node=opts.step?opts.step:'<span class="dot"></span>';
    return '<div class="ms '+(opts.step?'step':'branch')+' reveal" style="--c:var('+CV[key]+')"><div class="node">'+node+'</div><div class="panel">'+
      '<div class="role">'+esc(ROLE[key])+'</div><h3>'+esc(L.head.replace(/<\/?em>/g,''))+'</h3>'+
      '<p class="become">'+esc(L.become)+'</p><div class="meta">'+meta+'</div>'+body+acts+'</div></div>';
  }
  document.getElementById('core').innerHTML=milestone('foundations',{step:'1'})+milestone('analyst',{step:'2'});
  document.getElementById('tracks').innerHTML=TRACKS.map(function(k){return milestone(k,{role:true});}).join('');

  // projects: editorial index (E1 format, F theme)
  var pctl=document.getElementById('pctl'), pgrid=document.getElementById('pgrid');
  function meter(tier){var n=TIER[tier]||1,s='';for(var i=0;i<4;i++)s+='<i class="'+(i<n?'on':'')+'"></i>';return '<span class="meter">'+s+'<span class="ml">'+esc(tier)+'</span></span>';}
  function prow(p){var href=p.free?'/tutorials/':'/pricing.html',cv=DCV[p.domain]||'--ds';
    return '<a class="prow" href="'+href+'" data-tier="'+p.tier+'" data-free="'+(p.free?1:0)+'" style="--c:var('+cv+')">'+
      '<span class="pn">'+(p.n<10?'0'+p.n:p.n)+'</span>'+
      '<span class="pmid"><b>'+esc(p.name)+'</b><span class="pd"><span class="dom">'+esc(p.domain)+'.</span> '+esc(p.blurb)+'</span></span>'+
      meter(p.tier)+'<span class="ptag '+(p.free?'free':'pro')+'">'+(p.free?'Free':'Pro')+'</span></a>';}
  pgrid.innerHTML=RM2.projectList.map(prow).join('');
  var fc=RM2.projectList.filter(function(p){return p.free;}).length;
  var F=[['All',RM2.projectList.length],['Free',fc],['Starter',0],['Core',0],['Advanced',0],['Capstone',0]];
  pctl.innerHTML=F.map(function(f,i){return '<button class="'+(i===0?'on':'')+'" data-f="'+f[0]+'">'+f[0]+(f[1]?' '+f[1]:'')+'</button>';}).join('');
  pctl.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;pctl.querySelectorAll('button').forEach(function(o){o.classList.remove('on')});b.classList.add('on');var f=b.getAttribute('data-f');
    pgrid.querySelectorAll('.prow').forEach(function(el){var show=f==='All'||(f==='Free'&&el.getAttribute('data-free')==='1')||el.getAttribute('data-tier')===f;el.style.display=show?'':'none';});});

  // progress bar + reveal
  var prog=document.getElementById('prog');
  function onScroll(){var h=document.documentElement;var max=h.scrollHeight-h.clientHeight;prog.style.width=(max>0?(h.scrollTop/max*100):0)+'%';}
  window.addEventListener('scroll',onScroll,{passive:true});onScroll();
  var io=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){en.target.classList.add('in');io.unobserve(en.target);}});},{threshold:.06,rootMargin:'0px 0px -8% 0px'});
  document.querySelectorAll('.reveal').forEach(function(el,i){el.style.transitionDelay=(Math.min(i,6)*35)+'ms';io.observe(el);});
})();
