(function(){
  function esc(t){return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;');}
  function freeHref(t){return (RM2.links&&RM2.links[t])||RM.STOP_LINKS[t]||'/tutorials/';}
  var CV={foundations:'--core',analyst:'--core',ds:'--ds',ts:'--ts',researcher:'--res',developer:'--dev'};
  var ROLE={foundations:'New to R',analyst:'Data Analyst',ds:'Data Scientist',ts:'Forecaster',researcher:'Researcher',developer:'R Developer'};
  var CHIP={foundations:'Foundations',analyst:'Data Analyst track',ds:'Data Scientist track',ts:'Forecaster track',researcher:'Researcher track',developer:'R Developer track'};
  var ALLOWED=['foundations','analyst','ds','ts','researcher','developer'];
  var UNLOCK='<a class="tag pro" href="/pricing.html" title="Unlock with Pro" onclick="event.stopPropagation()">Pro</a>';
  var ROWLOCK='<svg class="lk" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/></svg>';

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

  // CTA: hero primary becomes "Start free" -> first lesson of section 1 (interactive
  // preferred; upgraded once courses.json loads). "Get certified" stays the cert-band + nav action.
  var startHref='#curriculum';
  (function(){
    var s1=secs[0];
    if(s1&&s1.items){for(var i=0;i<s1.items.length;i++){var h=postHref(s1.items[i]);if(h){startHref=h;break;}}}
    var pr=document.querySelector('header.hero .primary');
    if(pr){pr.setAttribute('href',startHref);pr.innerHTML='Start free <span class="a">&rarr;</span>';}
    var cb=document.querySelector('.certband .primary');
    if(cb){cb.innerHTML='Get certified <span class="a">&rarr;</span>';}
  })();

  // hero signature visual (per-track) - keeps the page's own copy, adds the
  // animated right-hand panel. One honest visual per track; --c is the accent.
  var reduceMo=window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches;
  function vizShell(el,label,svg){el.innerHTML=svg;}
  function vizResearcher(el){
    var Z=205,rows=[{y:66,a:98,b:178,d:138,s:1},{y:100,a:150,b:250,d:200,s:0},{y:134,a:120,b:192,d:156,s:1},{y:168,a:182,b:262,d:222,s:0},{y:202,a:216,b:288,d:252,s:1}];
    var s='<line x1="'+Z+'" y1="42" x2="'+Z+'" y2="216" style="stroke:var(--faint)" stroke-width="1" stroke-dasharray="3 4" opacity=".7"/><text x="'+Z+'" y="34" text-anchor="middle" font-family="JetBrains Mono" font-size="10" style="fill:var(--faint)">no effect</text>';
    rows.forEach(function(r,i){var c=r.s?'var(--c)':'var(--faint)',o=r.s?1:.5;
      s+='<g class="hv-in" style="animation-delay:'+(i*120)+'ms"><line x1="'+r.a+'" y1="'+r.y+'" x2="'+r.b+'" y2="'+r.y+'" style="stroke:'+c+'" stroke-width="2" stroke-linecap="round" opacity="'+o+'"/><line x1="'+r.a+'" y1="'+(r.y-4)+'" x2="'+r.a+'" y2="'+(r.y+4)+'" style="stroke:'+c+'" stroke-width="1.6" opacity="'+o+'"/><line x1="'+r.b+'" y1="'+(r.y-4)+'" x2="'+r.b+'" y2="'+(r.y+4)+'" style="stroke:'+c+'" stroke-width="1.6" opacity="'+o+'"/><circle cx="'+r.d+'" cy="'+r.y+'" r="4.6"'+(r.s?' class="hv-pulse"':'')+' style="fill:'+c+'" stroke="#fff" stroke-width="1.5"/></g>';});
    vizShell(el,'model estimates, with uncertainty','<svg viewBox="0 0 410 230">'+s+'</svg>');
  }
  function vizDS(el){
    var d='',B=[[70,82],[104,62],[140,94],[92,116],[156,74],[120,130]],A=[[286,150],[322,138],[352,176],[300,168],[338,182],[268,158]];
    B.forEach(function(p){d+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="5" fill="#2563a8" stroke="#fff" stroke-width="2"/>';});
    A.forEach(function(p){d+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="5" fill="#d98a2b" stroke="#fff" stroke-width="2"/>';});
    var g='';[80,140].forEach(function(y){g+='<line x1="28" y1="'+y+'" x2="382" y2="'+y+'" style="stroke:var(--line2)"/>';});[140,260].forEach(function(x){g+='<line x1="'+x+'" y1="28" x2="'+x+'" y2="204" style="stroke:var(--line2)"/>';});
    vizShell(el,'a classifier learning its boundary','<svg viewBox="0 0 410 230"><rect x="28" y="28" width="354" height="176" rx="12" fill="none" style="stroke:var(--line)"/>'+g+'<path id="hvbn" fill="none" style="stroke:var(--c)" stroke-width="14" stroke-linecap="round" opacity="0.12"/><path id="hvbd" fill="none" style="stroke:var(--c)" stroke-width="2.6" stroke-linecap="round"/>'+d+'<circle id="hvpl" r="4" style="fill:var(--c)"/><text id="hvac" x="372" y="50" text-anchor="end" font-family="Inter Tight" font-weight="700" font-size="18" style="fill:var(--c)">97%</text></svg>');
    var bd=el.querySelector('#hvbd'),bn=el.querySelector('#hvbn'),pl=el.querySelector('#hvpl'),ac=el.querySelector('#hvac');
    function q(p,c){var m=1-p;return[m*m*30+2*m*p*205+p*p*378,m*m*196+2*m*p*c+p*p*84];}
    function fr(ts){var c=126+Math.sin(ts*0.0009)*16,dd='M30 196 Q205 '+c.toFixed(1)+' 378 84';bd.setAttribute('d',dd);bn.setAttribute('d',dd);bn.setAttribute('opacity',(0.13+Math.sin(ts*0.0012)*0.05).toFixed(3));var pp=(ts*0.00017)%1,xy=q(pp,c);pl.setAttribute('cx',xy[0].toFixed(1));pl.setAttribute('cy',xy[1].toFixed(1));ac.textContent=(97+Math.sin(ts*0.0006)*0.5).toFixed(1)+'%';if(!reduceMo)requestAnimationFrame(fr);}
    if(reduceMo)fr(2200);else requestAnimationFrame(fr);
  }
  function vizForecaster(el){
    var hist='M40 150 L70 140 L100 150 L130 126 L160 138 L190 120 L205 126';
    vizShell(el,'a forecast, with its uncertainty','<svg viewBox="0 0 410 230"><line x1="40" y1="196" x2="380" y2="196" style="stroke:var(--line)"/><line x1="205" y1="44" x2="205" y2="196" style="stroke:var(--faint)" stroke-width="1" stroke-dasharray="3 4" opacity=".6"/><text x="205" y="36" text-anchor="middle" font-family="JetBrains Mono" font-size="10" style="fill:var(--faint)">now</text><path id="hvfan" style="fill:var(--c)" opacity="0.12"/><path d="'+hist+'" fill="none" style="stroke:var(--c)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path id="hvfore" fill="none" style="stroke:var(--c)" stroke-width="2.2" stroke-dasharray="2 5" stroke-linecap="round"/></svg>');
    var fan=el.querySelector('#hvfan'),fore=el.querySelector('#hvfore');
    function fy(x){return 126+(78-126)*((x-205)/175);}function fw(x){return ((x-205)/175)*32;}
    function fr(ts){var p=(ts%4400)/4400,rev,op=1;if(p<0.84)rev=p/0.84;else{rev=1;op=1-(p-0.84)/0.16;}var xE=205+175*rev,dd='M205 126',top='M205 126',bot=[],i;for(i=211;i<=xE;i+=6){dd+=' L'+i+' '+fy(i).toFixed(1);top+=' L'+i+' '+(fy(i)-fw(i)).toFixed(1);bot.push([i,fy(i)+fw(i)]);}fore.setAttribute('d',dd);fore.setAttribute('opacity',op.toFixed(3));for(var j=bot.length-1;j>=0;j--)top+=' L'+bot[j][0]+' '+bot[j][1].toFixed(1);top+=' Z';fan.setAttribute('d',top);fan.setAttribute('opacity',(0.13*op).toFixed(3));if(!reduceMo)requestAnimationFrame(fr);}
    if(reduceMo)fr(3600);else requestAnimationFrame(fr);
  }
  function vizAnalyst(el){
    var t='<rect x="30" y="74" width="118" height="112" rx="9" fill="#f1f1ee" style="stroke:var(--line)"/><rect x="30" y="74" width="118" height="22" rx="9" style="fill:var(--c)" opacity="0.14"/><rect x="30" y="90" width="118" height="6" style="fill:var(--c)" opacity="0.14"/>';
    [118,140,162].forEach(function(y){t+='<line x1="30" y1="'+y+'" x2="148" y2="'+y+'" style="stroke:var(--line2)"/>';});[70,109].forEach(function(x){t+='<line x1="'+x+'" y1="74" x2="'+x+'" y2="186" style="stroke:var(--line2)"/>';});
    var k='';[107,129,151,173].forEach(function(y){[49,89,128].forEach(function(x){k+='<rect x="'+(x-9)+'" y="'+(y-2)+'" width="15" height="3" rx="1.5" style="fill:var(--faint)" opacity=".5"/>';});});
    var ar='<path d="M166 130 L188 130 M181 124 L188 130 L181 136" fill="none" style="stroke:var(--faint)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
    var BX=[212,244,276,308,340],bars='';BX.forEach(function(x,i){bars+='<rect id="hvbar'+i+'" x="'+x+'" width="22" rx="3" style="fill:var(--c)"/>';});
    vizShell(el,'from raw table to a clear chart','<svg viewBox="0 0 410 230"><line x1="206" y1="196" x2="374" y2="196" style="stroke:var(--line)"/>'+t+k+ar+bars+'</svg>');
    var R=BX.map(function(_,i){return el.querySelector('#hvbar'+i);}),base=[58,92,46,104,74];
    function fr(ts){R.forEach(function(r,i){var h=base[i]+Math.sin(ts*0.0016+i*1.1)*6,y=196-h;r.setAttribute('y',y.toFixed(1));r.setAttribute('height',h.toFixed(1));});if(!reduceMo)requestAnimationFrame(fr);}
    if(reduceMo)fr(2200);else requestAnimationFrame(fr);
  }
  function vizFoundations(el){
    var C0=72,R0=62,CW=68,RH=27,cols=4,rows=4,g='',c,r;
    for(c=0;c<cols;c++)g+='<rect x="'+(C0+c*CW)+'" y="'+R0+'" width="58" height="19" rx="5" style="fill:var(--c);opacity:.18"/>';
    for(c=0;c<cols;c++)for(r=0;r<rows;r++)g+='<rect class="hv-in" x="'+(C0+c*CW)+'" y="'+(R0+RH+r*RH)+'" width="58" height="19" rx="5" fill="#f1f1ee" style="animation-delay:'+((c*rows+r)*60)+'ms;stroke:var(--line)" stroke-width="1"/>';
    vizShell(el,'a data frame taking shape','<svg viewBox="0 0 410 230">'+g+'</svg>');
  }
  function vizDeveloper(el){
    var code='<rect x="34" y="60" width="152" height="134" rx="10" fill="#f1f1ee" style="stroke:var(--line)"/>';
    var L=[[48,74,92],[60,90,116],[60,106,94],[48,122,72],[60,138,112],[48,154,64]];
    L.forEach(function(l,i){code+='<rect x="'+l[0]+'" y="'+l[1]+'" width="'+l[2]+'" height="6" rx="3" style="fill:'+(i===0?'var(--c)':'var(--faint)')+';opacity:'+(i===0?.85:.45)+'"/>';});
    var TX=212,TY=72,TH=30,tr='',i;
    for(i=0;i<4;i++){var y=TY+i*TH;
      tr+='<circle cx="'+(TX+9)+'" cy="'+(y+9)+'" r="9" fill="#f1f1ee" style="stroke:var(--line)" stroke-width="1.5"/>'
        +'<path id="hvck'+i+'" d="M'+(TX+4.5)+' '+(y+9)+' l3 3.2 l6.2 -7.4" fill="none" style="stroke:var(--c)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0"/>'
        +'<rect id="hvnm'+i+'" x="'+(TX+26)+'" y="'+(y+5)+'" width="'+(118-i*12)+'" height="7" rx="3.5" style="fill:var(--faint);opacity:.4"/>';}
    vizShell(el,'a function, proven by tests','<svg viewBox="0 0 410 230">'+code+tr+'</svg>');
    var ck=[],nm=[],last=-1;for(i=0;i<4;i++){ck.push(el.querySelector('#hvck'+i));nm.push(el.querySelector('#hvnm'+i));}
    function fr(t2){var p=Math.floor((t2%5200)/900);if(p>4)p=4;if(p!==last){for(var i=0;i<4;i++){ck[i].setAttribute('opacity',i<p?'1':'0');nm[i].setAttribute('style','fill:'+(i<p?'var(--c)':'var(--faint)')+';opacity:'+(i<p?.6:.4));}last=p;}if(!reduceMo)requestAnimationFrame(fr);}
    if(reduceMo){ck.forEach(function(c){c.setAttribute('opacity','1');});nm.forEach(function(n){n.setAttribute('style','fill:var(--c);opacity:.6');});}else requestAnimationFrame(fr);
  }
  var HEROVIZ={foundations:vizFoundations,analyst:vizAnalyst,ds:vizDS,ts:vizForecaster,researcher:vizResearcher,developer:vizDeveloper};
  (function(){
    var hero=document.querySelector('header.hero');if(!hero)return;var make=HEROVIZ[role];if(!make)return;
    var col=document.createElement('div');col.className='hcol';while(hero.firstChild)col.appendChild(hero.firstChild);hero.appendChild(col);
    var viz=document.createElement('div');viz.className='hviz';hero.appendChild(viz);hero.classList.add('has-viz');
    try{make(viz);}catch(e){hero.classList.remove('has-viz');if(viz.parentNode)hero.removeChild(viz);while(col.firstChild)hero.appendChild(col.firstChild);if(col.parentNode)hero.removeChild(col);}
  })();

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
  var ARR='<span class="arr"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></span>';
  // concept row (curriculum item with no interactive lesson yet)
  function conceptRow(t,free){
    if(free){
      var h=postHref(t);
      if(h) return '<a class="lsn free" href="'+h+'"><span class="dot"></span><span class="ltwrap"><span class="lt">'+esc(t)+'</span></span>'+ARR+'</a>';
      return '<span class="lsn soon"><span class="dot"></span><span class="ltwrap"><span class="lt">'+esc(t)+'</span></span><span class="go">Soon</span></span>';
    }
    return '<a class="lsn pro" href="/pricing.html"><span class="dot"></span><span class="ltwrap"><span class="lt">'+esc(t)+'</span></span><span class="go">Pro</span></a>';
  }
  // interactive step-player lesson row (dot + title + outcome subtitle + tag + arrow)
  function interRow(l){
    var isQ=l.kind==='quiz', sub=(l.subtitle||'').trim();
    var subHtml=sub?'<span class="lsub">'+esc(sub)+'</span>':'';
    var tag='<span class="itag'+(isQ?' quiz':'')+'">'+(isQ?'Quiz':'Interactive')+'</span>';
    return '<a class="lsn inter" href="/'+l.slug+'.html"><span class="dot"></span><span class="ltwrap"><span class="lt">'+esc(l.title)+'</span>'+subHtml+'</span>'+tag+ARR+'</a>';
  }
  // B6 section block: numbered chip + title + outcome + Free/Pro badge, then a
  // hairline-ruled table of rows. Open by default (collapsible), concept rows are
  // upgraded to interactive rows once courses.json loads.
  function secBlock(s,free){
    // free sections open by default (the browse-everything feel); Pro sections
    // collapse so long tracks (DS = 29 sections) stay navigable. Both collapsible.
    return '<details id="rm-s'+s.n+'" class="sec '+(free?'free-sec':'pro-sec')+'"'+(free?' open':'')+'><summary><span class="sn">'+(s.n<10?'0'+s.n:s.n)+'</span>'+
      '<span class="st">'+esc(s.title)+'<span class="so">'+esc(s.outcome)+'</span></span>'+
      (free?'<span class="tag free">Free</span>':UNLOCK)+'<span class="car" aria-hidden="true"></span></summary>'+
      '<div class="lsns">'+s.items.map(function(t){return conceptRow(t,free);}).join('')+'</div></details>';
  }

  // Tier bands + the credential moment. Only tracks whose sections carry a `tier`
  // (currently DS) get bands; the certified-milestone block is inserted after the
  // last core section. DS shows the full Hired/Trusted/Sought ladder; other roles
  // fall back to a one-line milestone (and only if they ever gain tiers).
  var TIERBAND={core:['Core','the certified path'],adv:['Advanced','operate at scale'],spec:['Specializations','go deep in your domain'],ai:['AI and LLM systems','the 2026/27 pillar'],capstone:['Capstone','put it all together']};
  function bandHead(t){var b=TIERBAND[t];return b?'<div class="tband"><span class="tbk">'+esc(b[0])+'</span><span class="tbs">'+esc(b[1])+'</span></div>':'';}
  function certMile(){
    if(role!=='ds') return '<div class="tcert"><span class="th"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Core complete &middot; certified '+esc(ROLE[role].toLowerCase())+'</span><span class="ts">everything below is how you go senior</span></div>';
    return '<div class="vF">'+
      '<div class="panel">'+
        '<div class="seal"><svg viewBox="0 0 84 84" width="72" height="72" aria-hidden="true"><circle cx="42" cy="42" r="38" fill="none" stroke="#d8b24e" stroke-width="1" opacity=".4"/><g stroke="#d8b24e" stroke-width="1.4" opacity=".5"><line x1="42" y1="6.5" x2="42" y2="11"/><line x1="42" y1="73" x2="42" y2="77.5"/><line x1="6.5" y1="42" x2="11" y2="42"/><line x1="73" y1="42" x2="77.5" y2="42"/><line x1="17" y1="17" x2="20.2" y2="20.2"/><line x1="63.8" y1="63.8" x2="67" y2="67"/><line x1="67" y1="17" x2="63.8" y2="20.2"/><line x1="20.2" y1="63.8" x2="17" y2="67"/></g><circle cx="42" cy="42" r="30" fill="none" stroke="#b08720" stroke-width="1.7"/><path d="M31 43 L38.5 50.5 L54 33" fill="none" stroke="#d8b24e" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/></svg></div>'+
        '<div>'+
          '<div class="eyebrow">Milestone reached</div>'+
          '<h2>You are a Certified Data Scientist in R.</h2>'+
          '<p class="lede">Frame a problem, build and properly evaluate a model, handle imbalance, and ship it. Your verifiable credential is ready.</p>'+
          '<div class="comps"><span>Build + evaluate models</span><span>Resampling + tuning</span><span>Ship to production</span><span>Interpret responsibly</span></div>'+
        '</div>'+
        '<div class="cta"><a class="btn-w" href="/pricing.html">Get your certificate &rarr;</a><div class="proof">Verifiable &middot; Add to LinkedIn &middot; Shareable PDF</div></div>'+
      '</div>'+
      '<div class="ladder">'+
        '<div class="lhead">You\'re certified. <b>The path from hired to sought-after starts here.</b></div>'+
        '<div class="rungs">'+
          '<div class="rung done"><div class="rhead"><span class="badge b-hired">Hired</span><span class="rtier">Tier 1 &middot; earned</span></div><div class="rn">Data Scientist</div><div class="rs">Job-ready and certified: you build models that work, and you can prove it.</div><span class="tag">&#10003; Certified in R</span></div>'+
          '<div class="rung next"><div class="rhead"><span class="badge b-trusted">Trusted</span><span class="rtier">Tier 2 &middot; next</span></div><div class="rn">Applied Scientist</div><div class="rs">Hired gets you in the room; trusted gets you the decisions that count. Own production, causal inference and calibrated uncertainty.</div><span class="tag">Go applied &rarr;</span></div>'+
          '<div class="rung locked"><div class="rhead"><span class="badge b-sought">Sought</span><span class="rtier">Tier 3 &middot; frontier</span></div><div class="rn">Deep Learning and AI</div><div class="rs">The work everyone wants and few can do. Go deep on LLMs, deep learning and generative AI, and be the name on the shortlist.</div><span class="tag">Go deep</span></div>'+
        '</div>'+
      '</div>'+
    '</div>';
  }
  (function(){var html='',prev=null;
    secs.forEach(function(s,i){var t=s.tier||null;
      if(t&&t!==prev){if(prev==='core')html+=certMile();html+=bandHead(t);prev=t;}
      html+=secBlock(s,isFree(s));});
    document.getElementById('curric').innerHTML=html;})();

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
    document.getElementById('pgrid').innerHTML=projs.map(function(p){var cv=DCV[p.domain]||'--ds';
      return '<span class="prow soon" style="--c:var('+cv+')"><span class="pn">'+(p.n<10?'0'+p.n:p.n)+'</span>'+
        '<span class="pmid"><b>'+esc(p.name)+'</b><span class="pd"><span class="dom">'+esc(p.domain)+'.</span> '+esc(p.blurb)+'</span></span>'+
        meter(p.tier)+'<span class="ptag soon">Soon</span></span>';}).join('');
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

  // option 3: "Unlock with Pro" pill lives inside <summary>; navigate without toggling the accordion
  document.addEventListener('click',function(e){var u=e.target.closest&&e.target.closest('.unlock');if(u){e.preventDefault();e.stopPropagation();window.location.href=u.getAttribute('href')||'/pricing.html';}},true);

  // --- upgrade sections that have interactive step-player lessons ---
  // Reads /courses.json and, for every section on THIS track with built lessons,
  // swaps its concept rows for B6 interactive rows (title + outcome + tag).
  (function(){
    fetch('/courses.json',{cache:'no-cache'}).then(function(r){return r.ok?r.json():null;}).then(function(cat){
      if(!cat||!cat.courses)return;
      var bySec={};
      cat.courses.forEach(function(c){ if(!c.roadmap||c.roadmap.track!==role)return;
        (bySec[c.roadmap.section]=bySec[c.roadmap.section]||[]).push(c); });
      // "Start free" -> first interactive lesson in section 1
      var s1n=secs[0]&&secs[0].n;
      if(s1n!=null&&bySec[s1n]){var first=null;
        bySec[s1n].forEach(function(c){(c.lessons||[]).forEach(function(l){if(l.built!==false&&(!first||(l.order||0)<(first.order||0)))first=l;});});
        if(first){var pr=document.querySelector('header.hero .primary');if(pr)pr.setAttribute('href','/'+first.slug+'.html');}}
      var grand=0;
      secs.forEach(function(s){
        var det=document.getElementById('rm-s'+s.n); if(!det)return;
        var lsns=det.querySelector('.lsns'); if(!lsns)return;
        var ls=[];
        (bySec[s.n]||[]).forEach(function(c){(c.lessons||[]).forEach(function(l){if(l.built!==false)ls.push(l);});});
        ls.sort(function(a,b){return (a.order||0)-(b.order||0);});
        if(!ls.length)return;
        lsns.innerHTML=ls.map(interRow).join('');
        det.classList.add('has-inter');
        grand+=ls.length;
      });
      // DS: sections with no live interactive lessons yet are the road ahead, not
      // buyable now. Show their Pro rows as a non-clickable "Soon" instead of a
      // pricing link. Self-correcting: once a section ships lessons it upgrades
      // above (gets .has-inter) and is skipped here.
      if(role==='ds'&&grand){
        secs.forEach(function(s){
          var det=document.getElementById('rm-s'+s.n);
          if(!det||det.classList.contains('has-inter'))return;
          det.querySelectorAll('a.lsn.pro').forEach(function(a){
            var lt=a.querySelector('.lt'),span=document.createElement('span');
            span.className='lsn soon';
            span.innerHTML='<span class="dot"></span><span class="ltwrap"><span class="lt">'+(lt?lt.innerHTML:'')+'</span></span><span class="go">Soon</span>';
            a.parentNode.replaceChild(span,a);
          });
        });
      }
      if((role==='analyst'||role==='foundations')&&grand){var rm=document.getElementById('roleMeta');
        if(rm)rm.innerHTML='<span><b>'+secs.length+'</b> sections</span><span><b>'+grand+'</b> interactive lessons</span><span>Certificate: <b>'+esc(L.cert)+'</b></span>';}
    }).catch(function(){});
  })();
})();
