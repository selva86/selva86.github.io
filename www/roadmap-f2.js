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
  var RDESC={foundations:'Start here',analyst:'Wrangle & visualize',ds:'Predict & model',ts:'Forecast ahead',researcher:'Infer & explain',developer:'Engineer & ship'};
  var RARR='<span class="arr"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></span>';
  var UNLOCK='<a class="tag pro" href="/pricing.html" title="Unlock with Pro" onclick="event.stopPropagation()">Pro</a>';
  var ROWLOCK='<svg class="lk" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/></svg>';
  var SLUG={foundations:'new-to-r',analyst:'data-analyst',ds:'data-scientist',ts:'forecaster',researcher:'researcher',developer:'r-developer'};
  function roleHref(k){return '/roadmap/'+(SLUG[k]||k)+'.html';}
  function rtile(k){return '<a class="rtile" href="'+roleHref(k)+'" style="--c:var('+CV[k]+')"><i></i><span class="rn"><b>'+esc(ROLE[k])+'</b><span>'+esc(RDESC[k])+'</span></span>'+RARR+'</a>';}
  document.getElementById('rolerail').innerHTML=
    '<div class="glabel">Shared core</div><div class="grow core">'+CORE.map(rtile).join('')+'</div>'+
    '<div class="glabel">Then specialize</div><div class="grow tracks">'+TRACKS.map(rtile).join('')+'</div>';

  function postHref(t){return (RM2.links&&RM2.links[t])||(RM.STOP_LINKS&&RM.STOP_LINKS[t])||'';}
  function lessonRow(t,isFree){
    if(isFree){
      var h=postHref(t);
      if(h) return '<a class="lsn free" href="'+h+'"><span class="dot"></span><span class="ltwrap"><span class="lt">'+esc(t)+'</span></span>'+RARR+'</a>';
      return '<span class="lsn soon"><span class="dot"></span><span class="ltwrap"><span class="lt">'+esc(t)+'</span></span><span class="go">Soon</span></span>';
    }
    return '<a class="lsn pro" href="/pricing.html"><span class="dot"></span><span class="ltwrap"><span class="lt">'+esc(t)+'</span></span><span class="go">Pro</span></a>';
  }
  function secDetails(s,isFree,open,trackKey){
    return '<details class="sec '+(isFree?'free-sec':'pro-sec')+'" data-track="'+(trackKey||'')+'" data-sec="'+s.n+'"'+(open?' open':'')+'><summary><span class="sn">'+(s.n<10?'0'+s.n:s.n)+'</span><span class="st">'+esc(s.title)+'<span class="so">'+esc(s.outcome||'')+'</span></span>'+
      (isFree?'<span class="tag free">Free</span>':UNLOCK)+'<span class="car" aria-hidden="true"></span></summary>'+
      '<div class="lsns">'+s.items.map(function(t){return lessonRow(t,isFree);}).join('')+'</div></details>';
  }
  function milestone(key,opts){
    var L=RM.byKey(key), secs=RM2.sections[key], allFree=(key==='foundations'||key==='analyst');
    function isFree(s){return allFree||s.free;}
    var total=secs.reduce(function(a,s){return a+s.items.length;},0);
    var meta=allFree?(secs.length+' sections / '+total+' lessons / all free'):('Section 1 free / '+(secs.length-1)+' with Pro / '+total+' lessons');
    var body=secs.map(function(s,i){return secDetails(s,isFree(s),i<2,key);}).join('');
    var acts=opts.role?'<div class="acts"><a class="open" href="'+roleHref(key)+'">Open full page <span class="a">&rarr;</span></a><a class="enroll" href="/pricing.html">Enroll</a></div>':'';
    var node=opts.step?opts.step:'<span class="dot"></span>';
    return '<div class="ms '+(opts.step?'step':'branch')+' reveal" style="--c:var('+CV[key]+')"><div class="node">'+node+'</div><div class="panel">'+
      '<div class="role">'+esc(ROLE[key])+'</div><h3>'+esc(L.head.replace(/<\/?em>/g,''))+'</h3>'+
      '<p class="become">'+esc(L.become)+'</p><div class="meta" data-track="'+key+'">'+meta+'</div>'+body+acts+'</div></div>';
  }
  document.getElementById('core').innerHTML=milestone('foundations',{step:'1'})+milestone('analyst',{step:'2',role:true});
  document.getElementById('tracks').innerHTML=TRACKS.map(function(k){return milestone(k,{role:true});}).join('');

  // projects: editorial index (E1 format, F theme)
  var pctl=document.getElementById('pctl'), pgrid=document.getElementById('pgrid');
  function meter(tier){var n=TIER[tier]||1,s='';for(var i=0;i<4;i++)s+='<i class="'+(i<n?'on':'')+'"></i>';return '<span class="meter">'+s+'<span class="ml">'+esc(tier)+'</span></span>';}
  function prow(p){var cv=DCV[p.domain]||'--ds';
    return '<span class="prow soon" data-tier="'+p.tier+'" data-free="'+(p.free?1:0)+'" style="--c:var('+cv+')">'+
      '<span class="pn">'+(p.n<10?'0'+p.n:p.n)+'</span>'+
      '<span class="pmid"><b>'+esc(p.name)+'</b><span class="pd"><span class="dom">'+esc(p.domain)+'.</span> '+esc(p.blurb)+'</span></span>'+
      meter(p.tier)+'<span class="ptag soon">Soon</span></span>';}
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

  // hero waitlist inline capture -> /api/waitlist (same contract as pricing)
  (function(){
    var form=document.getElementById('hero-wl'); if(!form) return;
    var msg=document.getElementById('hero-wl-msg'),btn=document.getElementById('hero-wl-btn'),em=document.getElementById('hero-wl-email'),orig=btn.innerHTML;
    form.addEventListener('submit',function(ev){ev.preventDefault();
      var v=(em.value||'').trim();
      if(!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(v)){msg.style.color='#b42318';msg.textContent='Please enter a valid email.';return;}
      btn.disabled=true;btn.textContent='Joining...';
      fetch('/api/waitlist',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:v,plan:'allaccess',source:'roadmap-hero'})})
        .then(function(r){return r.json().catch(function(){return null;}).then(function(d){return {ok:r.ok,d:d};});})
        .then(function(res){
          if(res.ok&&res.d&&res.d.ok){form.style.display='none';msg.style.color='#15803d';msg.textContent=res.d.already?"You're already on the list - we'll email you the day Pro opens.":"You're on the list. Check your inbox to confirm.";}
          else{btn.disabled=false;btn.innerHTML=orig;msg.style.color='#b42318';msg.textContent=(res.d&&res.d.message)||'Something went wrong. Please try again.';}
        })
        .catch(function(){btn.disabled=false;btn.innerHTML=orig;msg.style.color='#b42318';msg.textContent='Network error. Please try again.';});
    });
  })();

  // option 3: "Unlock with Pro" pill lives inside <summary>; navigate without toggling the accordion
  document.addEventListener('click',function(e){var u=e.target.closest&&e.target.closest('.unlock');if(u){e.preventDefault();e.stopPropagation();window.location.href=u.getAttribute('href')||'/pricing.html';}},true);

  // --- Core tracks (analyst, foundations): interactive-lesson hybrid rows ---
  // These tracks are fully covered by interactive lessons, so each section's flat concept
  // list is replaced by one row per lesson (+ its subtitle). The lesson data is BAKED inline
  // at build time (window.__RMLESSONS__) so the correct rows render SYNCHRONOUSLY on first
  // paint with no runtime-fetch dependency; the async /courses.json fetch then refreshes to
  // pick up any lessons published since the last roadmap rebuild. Other tracks stay flat.
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
              var sub=(l.subtitle||'').trim();
              var covHtml=sub?'<span class="lsub">'+esc(sub)+'</span>':'';
              var isQ=l.kind==='quiz';
              var isPro=String(l.access||'').toLowerCase()==='pro';
              var acc=isPro?'<span class="ltag pro" title="Part of the Program">'+
                '<svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor" aria-hidden="true"><path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5zm-3 8V7a3 3 0 1 1 6 0v3H9z"/></svg> Pro</span>'
                :'<span class="ltag free">Free</span>';
              rows+='<a class="lsn inter'+(isPro?' pro-row':'')+'" href="/'+l.slug+'.html"><span class="dot"></span><span class="ltwrap"><span class="lt">'+esc(l.title)+'</span>'+covHtml+'</span>'+acc+'<span class="itag'+(isQ?' quiz':'')+'">'+(isQ?'Quiz':'Interactive')+'</span>'+RARR+'</a>';
            });
          });
          if(!rows)return;
          lsns.innerHTML=rows;
          var cb=det.querySelector('.cnt'); if(cb)cb.textContent=String(cnt);
          grand+=cnt;
        });
        if(grand){var m=document.querySelector('.meta[data-track="'+track+'"]');
          if(m&&RM2.sections[track]){var af=(track==='analyst'||track==='foundations');
            m.textContent=RM2.sections[track].length+' sections / '+grand+(af?' lessons / all free':' lessons / Section 1 free');}}
      });
      // DS: not-yet-built Pro sections are the road ahead, not buyable now - show
      // "Soon" instead of a pricing link. Guarded on the catalog actually carrying
      // DS lessons, so a partial/baked catalog never downgrades a live section;
      // sections that upgraded above are in dsUp and skipped. Idempotent + self-
      // correcting (a shipped section gains lessons -> upgrades -> not relabeled).
      var dsUp=byTrack['ds'];
      if(dsUp&&RM2.sections['ds']){
        RM2.sections['ds'].forEach(function(s){
          if(dsUp[s.n])return;
          var det=document.querySelector('details.sec[data-track="ds"][data-sec="'+s.n+'"]'); if(!det)return;
          det.querySelectorAll('a.lsn.pro').forEach(function(a){
            var lt=a.querySelector('.lt'),span=document.createElement('span');
            span.className='lsn soon';
            span.innerHTML='<span class="dot"></span><span class="ltwrap"><span class="lt">'+(lt?lt.innerHTML:'')+'</span></span><span class="go">Soon</span>';
            a.parentNode.replaceChild(span,a);
          });
        });
      }
    }
    // 1) synchronous first paint from inline-baked data (no fetch dependency, every browser)
    if(window.__RMLESSONS__)applyHybrid(window.__RMLESSONS__);
    // 2) refresh from the live catalog (picks up lessons published since the last rebuild)
    fetch('/courses.json',{cache:'no-cache'}).then(function(r){return r.ok?r.json():null;}).then(applyHybrid).catch(function(){});
  })();

})();
