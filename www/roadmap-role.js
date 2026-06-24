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

  function postHref(t){return (RM2.links&&RM2.links[t])||(RM.STOP_LINKS&&RM.STOP_LINKS[t])||'';}
  function lessonRow(t,free){
    if(free){
      var h=postHref(t);
      if(h) return '<a class="lsn free" href="'+h+'"><span class="lt">'+esc(t)+'</span><span class="arr"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></span></a>';
      return '<span class="lsn soon"><span class="lt">'+esc(t)+'</span><span class="go">Soon</span></span>';
    }
    return '<a class="lsn pro" href="/pricing.html"><span class="lt">'+esc(t)+'</span><span class="go">Pro</span></a>';
  }
  function secDetails(s,free,open){
    return '<details id="rm-s'+s.n+'" class="sec"'+(open?' open':'')+'><summary><span class="car"></span><span class="sn">'+(s.n<10?'0'+s.n:s.n)+'</span>'+
      '<span class="st">'+esc(s.title)+'<span class="so">'+esc(s.outcome)+'</span></span>'+
      '<span class="tag '+(free?'free':'pro')+'">'+(free?'Free':'Pro')+'</span><span class="cnt">'+s.items.length+'</span></summary>'+
      '<div class="lsns">'+s.items.map(function(t){return lessonRow(t,free);}).join('')+'</div></details>';
  }
  document.getElementById('curric').innerHTML=secs.map(function(s,i){return secDetails(s,isFree(s),i===0);}).join('');

  // deep-link from a lesson player: /roadmap/<role>.html#rm-s<n>. #curric is built
  // here in JS, so the browser's native hash scroll already fired against nothing.
  // Open the targeted section, scroll to it, and flash it in the track accent.
  (function(){
    var m=(location.hash||'').match(/^#rm-s(\d+)$/); if(!m) return;
    var el=document.getElementById('rm-s'+m[1]); if(!el) return;
    el.setAttribute('open','');
    setTimeout(function(){
      el.scrollIntoView({behavior:'smooth',block:'center'});
      el.style.transition='box-shadow .35s'; el.style.boxShadow='0 0 0 3px var(--c,#1f7a55)';
      setTimeout(function(){el.style.boxShadow='none';},1700);
    },80);
  })();

  // projects: F2 editorial index, filtered to this role's domain(s)
  var DOM={foundations:['Data Analyst'],analyst:['Data Analyst'],ds:['Data Scientist'],ts:['Forecaster'],researcher:['Researcher','Statistician'],developer:['R Developer']};
  var DCV={'Data Analyst':'--core','Data Scientist':'--ds','Forecaster':'--ts','Researcher':'--res','Statistician':'--res','R Developer':'--dev'};
  var TIER={Starter:1,Core:2,Advanced:3,Capstone:4};
  var doms=DOM[role]||[];
  var projs=(RM2.projectList||[]).filter(function(p){return doms.indexOf(p.domain)>=0;});
  if(projs.length){
    var meter=function(t){var n=TIER[t]||1,x='';for(var i=0;i<4;i++)x+='<i class="'+(i<n?'on':'')+'"></i>';return '<span class="meter">'+x+'<span class="ml">'+esc(t)+'</span></span>';};
    document.getElementById('pgrid').innerHTML=projs.map(function(p){var href=p.free?'/tutorials/':'/pricing.html',cv=DCV[p.domain]||'--ds';
      return '<a class="prow" href="'+href+'" style="--c:var('+cv+')"><span class="pn">'+(p.n<10?'0'+p.n:p.n)+'</span>'+
        '<span class="pmid"><b>'+esc(p.name)+'</b><span class="pd"><span class="dom">'+esc(p.domain)+'.</span> '+esc(p.blurb)+'</span></span>'+
        meter(p.tier)+'<span class="ptag '+(p.free?'free':'pro')+'">'+(p.free?'Free':'Pro')+'</span></a>';}).join('');
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

  // --- surface interactive step-player lessons on their roadmap sections ---
  // Reads /courses.json (the generated catalog) and, for every course mapped to
  // THIS track, injects its built lessons as launch links into the matching
  // section's <details id="rm-s<n>">. So a reader can open the interactive player
  // straight from the curriculum. Lights up automatically as lessons publish.
  (function(){
    var st=document.createElement('style');
    st.textContent='.ilsns{margin:2px 8px 12px;padding:11px 13px;border:1px solid var(--line,#e6e3da);border-radius:12px;background:color-mix(in srgb,var(--c) 5%,#fff)}'
      +'.ilsns-h{font:600 10px/1 "JetBrains Mono",monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--c);margin-bottom:8px}'
      +'.ilsn{display:flex;align-items:center;gap:9px;padding:8px 9px;border-radius:9px;text-decoration:none;color:var(--ink,#1a1a1a);font-size:14px}'
      +'.ilsn:hover{background:color-mix(in srgb,var(--c) 12%,#fff)}'
      +'.ila{color:var(--c);font-size:10px;flex:none}.ilt{flex:1;min-width:0}'
      +'.ilg{flex:none;font:600 9.5px/1 "JetBrains Mono",monospace;letter-spacing:.06em;text-transform:uppercase;color:var(--c);border:1px solid var(--c);border-radius:5px;padding:3px 6px}';
    document.head.appendChild(st);
    fetch('/courses.json',{cache:'no-cache'}).then(function(r){return r.ok?r.json():null;}).then(function(cat){
      if(!cat||!cat.courses)return;
      var bySec={};
      cat.courses.forEach(function(c){ if(!c.roadmap||c.roadmap.track!==role)return;
        (bySec[c.roadmap.section]=bySec[c.roadmap.section]||[]).push(c); });
      Object.keys(bySec).forEach(function(n){
        var det=document.getElementById('rm-s'+n); if(!det)return;
        var html='';
        bySec[n].forEach(function(c){
          (c.lessons||[]).slice().sort(function(a,b){return (a.order||0)-(b.order||0);}).forEach(function(l){
            if(l.built===false)return;
            html+='<a class="ilsn" href="/'+l.slug+'.html"><span class="ila">&#9654;</span><span class="ilt">'+esc(l.title)+'</span><span class="ilg">Interactive</span></a>';
          });
        });
        if(!html)return;
        var box=document.createElement('div'); box.className='ilsns';
        box.innerHTML='<div class="ilsns-h">Interactive lessons</div>'+html;
        var lsns=det.querySelector('.lsns');
        if(lsns)lsns.insertBefore(box,lsns.firstChild); else det.appendChild(box);
      });
    }).catch(function(){});
  })();
})();
