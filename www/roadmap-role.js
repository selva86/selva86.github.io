(function(){
  function esc(t){return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;');}
  function freeHref(t){return (RM2.links&&RM2.links[t])||RM.STOP_LINKS[t]||'/tutorials/';}
  var CV={foundations:'--core',analyst:'--core',ds:'--ds',ts:'--ts',researcher:'--res',developer:'--dev'};
  var ROLE={foundations:'New to R',analyst:'Data Analyst',ds:'Data Scientist',ts:'Forecaster',researcher:'Researcher',developer:'R Developer'};
  var CHIP={foundations:'Foundations',analyst:'Data Analyst track',ds:'Data Scientist track',ts:'Forecaster track',researcher:'Researcher track',developer:'R Developer track'};
  var ALLOWED=['foundations','analyst','ds','ts','researcher','developer'];

  var role=(document.body.getAttribute('data-role'))||(location.search.match(/[?&]role=([a-z]+)/)||[])[1]||'ds';
  if(ALLOWED.indexOf(role)<0)role='ds';
  var L=RM.byKey(role), secs=RM2.sections[role], cv=CV[role];
  var allFree=(role==='foundations'||role==='analyst');
  function isFree(s){return allFree||s.free;}
  var total=secs.reduce(function(a,s){return a+s.items.length;},0);

  document.documentElement.style.setProperty('--c','var('+cv+')');
  document.title='The R '+ROLE[role]+' roadmap · r-statistics.co';

  // hero
  document.getElementById('rchipText').textContent=CHIP[role];
  document.getElementById('roleHead').innerHTML=L.head; // contains <em> accent
  document.getElementById('roleDek').textContent=L.become;
  document.getElementById('roleMeta').innerHTML=
    '<span><b>'+secs.length+'</b> sections</span><span><b>'+total+'</b> lessons</span><span>Certificate: <b>'+esc(L.cert)+'</b></span>';

  // prereq note
  var prq=document.getElementById('prereq');
  if(role==='foundations'){prq.innerHTML='<b>This is where everyone starts.</b> Free to read in full, it earns the '+esc(L.cert)+' certificate and feeds every track that follows.';}
  else if(role==='analyst'){prq.innerHTML='<b>Comes after</b> <a href="/roadmap/new-to-r.html">New to R</a> (free). Together they are the shared core every specialization builds on.';}
  else{prq.innerHTML='<b>Comes after the shared core:</b> <a href="/roadmap/new-to-r.html">New to R</a> and <a href="/roadmap/data-analyst.html">Data Analyst</a>, both free to read. This track is one of four equal specializations.';}

  // curriculum
  document.getElementById('curHead').textContent='The full '+ROLE[role]+' curriculum';
  document.getElementById('curLead').textContent=allFree
    ? 'All '+secs.length+' sections are free to read in full.'
    : 'Section 1 is free to read. The rest is the Program, ending in the '+L.cert+' certificate.';

  function lessonRow(t,free){
    if(free) return '<a class="lsn free" href="'+freeHref(t)+'"><span class="lt">'+esc(t)+'</span><span class="arr"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></span></a>';
    return '<a class="lsn pro" href="/pricing.html"><span class="lt">'+esc(t)+'</span><span class="go">Pro</span></a>';
  }
  function secDetails(s,free,open){
    return '<details class="sec"'+(open?' open':'')+'><summary><span class="car"></span><span class="sn">'+(s.n<10?'0'+s.n:s.n)+'</span>'+
      '<span class="st">'+esc(s.title)+'<span class="so">'+esc(s.outcome)+'</span></span>'+
      '<span class="tag '+(free?'free':'pro')+'">'+(free?'Free':'Pro')+'</span><span class="cnt">'+s.items.length+'</span></summary>'+
      '<div class="lsns">'+s.items.map(function(t){return lessonRow(t,free);}).join('')+'</div></details>';
  }
  document.getElementById('curric').innerHTML=secs.map(function(s,i){return secDetails(s,isFree(s),i===0);}).join('');

  // projects
  var projs=RM2.projects[role];
  if(projs && projs.length){
    document.getElementById('pgrid').innerHTML=projs.map(function(p){
      return '<a class="pcard" href="/pricing.html"><b>'+esc(p.name)+'</b><p class="scn">'+esc(p.scenario)+'</p>'+
        '<p class="bld"><span>You build</span>'+esc(p.build)+'</p>'+
        '<p class="wow"><svg><use href="#i-spark"/></svg> '+esc(p.wow)+'</p>'+
        '<span class="pgo">Start with the Program <span class="a">&rarr;</span></span></a>';}).join('');
  } else {
    document.getElementById('projects-sec').style.display='none';
  }

  // cert band
  document.getElementById('certHead').textContent='Earn the '+L.cert+' certificate';

  // progress bar + reveal
  var prog=document.getElementById('prog');
  function onScroll(){var h=document.documentElement,max=h.scrollHeight-h.clientHeight;prog.style.width=(max>0?(h.scrollTop/max*100):0)+'%';}
  window.addEventListener('scroll',onScroll,{passive:true});onScroll();
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{threshold:.05,rootMargin:'0px 0px -6% 0px'});
  document.querySelectorAll('.reveal').forEach(function(el,i){el.style.transitionDelay=(Math.min(i,6)*35)+'ms';io.observe(el);});
})();
