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
      if(h) return '<a class="lsn free" href="'+h+'"><span class="lt">'+esc(t)+'</span><span class="arr"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></span></a>';
      return '<span class="lsn soon"><span class="lt">'+esc(t)+'</span><span class="go">Soon</span></span>';
    }
    return '<a class="lsn pro" href="/pricing.html"><span class="lt">'+esc(t)+'</span><span class="go">Pro</span></a>';
  }
  function secDetails(s,isFree,open,trackKey){
    return '<details class="sec" data-track="'+(trackKey||'')+'" data-sec="'+s.n+'"'+(open?' open':'')+'><summary><span class="car"></span><span class="sn">'+(s.n<10?'0'+s.n:s.n)+'</span><span class="st">'+esc(s.title)+'</span>'+
      (isFree?'<span class="tag free">Free</span>':UNLOCK)+'<span class="cnt">'+s.items.length+'</span></summary>'+
      '<div class="lsns">'+s.items.map(function(t){return lessonRow(t,isFree);}).join('')+'</div></details>';
  }
  function milestone(key,opts){
    var L=RM.byKey(key), secs=RM2.sections[key], allFree=(key==='foundations'||key==='analyst');
    function isFree(s){return allFree||s.free;}
    var total=secs.reduce(function(a,s){return a+s.items.length;},0);
    var meta=allFree?(secs.length+' sections / '+total+' lessons / all free'):('Section 1 free / '+(secs.length-1)+' with Pro / '+total+' lessons');
    var body=secs.map(function(s,i){return secDetails(s,isFree(s),i===0,key);}).join('');
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

  // --- Data Analyst track: interactive-lesson hybrid rows ---
  // The analyst curriculum is fully covered by interactive lessons, so replace each analyst
  // section's flat concept list with one row per lesson plus the concepts it covers (no
  // duplication). Lesson set/order come from /courses.json (authoritative for what is built);
  // RM2.lessonConcepts attaches the "covers" detail. Every other track is left unchanged.
  (function(){
    var st=document.createElement('style');
    st.textContent='.ilhy-row{display:block;padding:11px 9px;border-radius:9px;text-decoration:none;color:var(--ink,#1a1a1a)}'
      +'.ilhy-row+.ilhy-row{border-top:1px solid var(--line,#e6e3da)}'
      +'.ilhy-row:hover{background:color-mix(in srgb,var(--c) 7%,#fff)}'
      +'.ilhy-head{display:flex;align-items:center;gap:9px}'
      +'.ilhy-a{color:var(--c);font-size:10px;flex:none}'
      +'.ilhy-t{flex:1;min-width:0;font-size:14px;font-weight:600}'
      +'.ilhy-g{flex:none;font:600 9px/1 "JetBrains Mono",monospace;letter-spacing:.06em;text-transform:uppercase;color:var(--c);border:1px solid var(--c);border-radius:5px;padding:3px 6px}'
      +'.ilhy-cov{display:block;margin:5px 0 0 19px;font-size:12px;color:var(--faint,#8a8a83);line-height:1.55}'
      +'.ilhy-gq{background:var(--c);color:#fff;border-color:var(--c)}';
    document.head.appendChild(st);
    fetch('/courses.json',{cache:'no-cache'}).then(function(r){return r.ok?r.json():null;}).then(function(cat){
      if(!cat||!cat.courses)return;
      var bySec={};
      cat.courses.forEach(function(c){ if(!c.roadmap||c.roadmap.track!=='analyst')return;
        (bySec[c.roadmap.section]=bySec[c.roadmap.section]||[]).push(c); });
      var grand=0;
      Object.keys(bySec).forEach(function(n){
        var det=document.querySelector('details.sec[data-track="analyst"][data-sec="'+n+'"]'); if(!det)return;
        var lsns=det.querySelector('.lsns'); if(!lsns)return;
        var rows='',cnt=0;
        bySec[n].forEach(function(c){
          (c.lessons||[]).slice().sort(function(a,b){return (a.order||0)-(b.order||0);}).forEach(function(l){
            if(l.built===false)return; cnt++;
            var sub=(l.subtitle||'').trim();
            var covHtml=sub?'<span class="ilhy-cov">'+esc(sub)+'</span>':'';
            var isQ=l.kind==='quiz';
            rows+='<a class="ilhy-row'+(isQ?' ilhy-quiz':'')+'" href="/'+l.slug+'.html"><span class="ilhy-head"><span class="ilhy-a">'+(isQ?'&#10003;':'&#9654;')+'</span><span class="ilhy-t">'+esc(l.title)+'</span><span class="ilhy-g'+(isQ?' ilhy-gq':'')+'">'+(isQ?'Quiz':'Interactive')+'</span></span>'+covHtml+'</a>';
          });
        });
        if(!rows)return;
        lsns.innerHTML=rows;
        var cb=det.querySelector('.cnt'); if(cb)cb.textContent=String(cnt);
        grand+=cnt;
      });
      // align the analyst milestone "lessons" count with the interactive-lesson rows now shown
      if(grand){var m=document.querySelector('.meta[data-track="analyst"]');
        if(m)m.textContent=RM2.sections.analyst.length+' sections / '+grand+' lessons / all free';}
    }).catch(function(){});
  })();

})();
