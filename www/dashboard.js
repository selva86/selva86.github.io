// dashboard.js -- renders /dashboard.html from /api/me/*. Auth-gated (redirects to
// /signin if anon). Loads after www/roadmap-data.js (RM) + www/roadmap-curriculum.js (RM2).
(function(){
  'use strict';
  var RM=window.RM||{}, RM2=window.RM2||{};
  function $(id){return document.getElementById(id);}
  function setText(id,t){var e=$(id);if(e)e.textContent=t;}
  function esc(t){return String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;');}
  function fmt(n){return (n==null?0:n).toLocaleString('en-US');}

  // ----- title resolution (curriculum links + sidebar.json) -----
  var inv={};
  (function(map){[RM.STOP_LINKS,RM2.links].forEach(function(m){if(!m)return;Object.keys(m).forEach(function(title){var u=m[title];if(u&&u.charAt(0)==='/')inv[u.toLowerCase()]=title;});});})();
  var sbTitle={};
  function slugHtml(s){s=String(s).replace(/^\//,'');return /\.html$/.test(s)?s:s+'.html';}
  function humanize(s){return String(s).replace(/\.html$/,'').replace(/[-_]/g,' ').replace(/\b\w/g,function(c){return c.toUpperCase();});}
  function titleFor(slug){var h=slugHtml(slug);return inv['/'+h.toLowerCase()]||sbTitle[h]||humanize(slug);}
  function postHref(slug){return '/'+slugHtml(slug);}

  // ----- level + slug maps -----
  var LV=['foundations','analyst','ds','ts','researcher','developer'];
  var SLUG={foundations:'new-to-r',analyst:'data-analyst',ds:'data-scientist',ts:'forecaster',researcher:'researcher',developer:'r-developer'};
  function rolePage(k){return '/roadmap/'+SLUG[k]+'.html';}

  function ic(id){return '<span class="ic"><svg><use href="#'+id+'"/></svg></span>';}
  var ARR='<span class="arr"><svg><use href="#i-arr"/></svg></span>';

  function api(path){return fetch(path,{credentials:'same-origin',headers:{Accept:'application/json'}}).then(function(r){if(r.status===401){var e=new Error('401');e.a401=true;throw e;}if(!r.ok)throw new Error(path+' '+r.status);return r.json();});}
  function toSignin(){location.replace('/signin.html?next=/dashboard.html');}
  function fmtDate(sec){try{return new Date(sec*1000).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'});}catch(e){return '';}}

  function tile(big,label,cls,delta){return '<div class="stat'+(cls?' '+cls:'')+'"><b class="mono">'+big+'</b><span>'+label+'</span>'+(delta?'<span class="delta">'+esc(delta)+'</span>':'')+'</div>';}
  function row(icon,title,sub,href,end){return '<a class="row" href="'+href+'">'+ic(icon)+'<span class="rt"><b>'+esc(title)+'</b><span>'+esc(sub)+'</span></span>'+end+'</a>';}

  function renderResume(item){
    var el=$('dh-resume');
    if(!item){el.innerHTML='<section class="resume" style="--c:var(--core)"><span class="ck">Start learning</span><h2 class="disp">Begin the roadmap</h2><div class="clip">Pick a track and your first lesson is one click away.</div><div class="go"><a class="primary" href="/roadmap/">Browse the roadmap <span class="a">&rarr;</span></a></div></section>';return;}
    var pct=Math.max(2,Math.min(100,item.scroll_pct||0));
    el.innerHTML='<section class="resume" style="--c:var(--ds)"><span class="ck">Continue learning</span>'+
      '<h2 class="disp">'+esc(titleFor(item.slug))+'</h2>'+
      '<div class="clip">Resume where you left off'+(item.last_section?(' &middot; '+esc(item.last_section)):'')+'</div>'+
      '<div class="pbar"><div class="pfill" style="width:'+pct+'%"></div></div>'+
      '<div class="meta"><span>Progress <b>'+pct+'%</b></span></div>'+
      '<div class="go"><a class="primary" href="'+postHref(item.slug)+'">Continue this lesson <span class="a">&rarr;</span></a></div></section>';
  }

  function renderStages(apiTracks, certBy){
    var byId={}; apiTracks.forEach(function(t){byId[t.id]=t;});
    $('dh-stages').innerHTML=LV.map(function(k){
      var L=RM.byKey?RM.byKey(k):null; if(!L)return '';
      var tid=L.track, entry=tid?byId[tid]:null, earned=!!(tid&&certBy[tid]);
      var pct=earned?100:(entry?entry.pct:0);
      var cls=earned?'done':(pct>0?'doing':'');
      var sn=earned?'<svg width="15" height="15"><use href="#i-check"/></svg>':'';
      var sub=earned?(esc(L.cert)+' earned'):(entry&&entry.eligible?('Ready to claim '+esc(L.cert)):(pct>0?'In progress':'Not started yet'));
      return '<a class="stage '+cls+'" href="'+rolePage(k)+'" style="--c:var(--ds)"><span class="sn">'+sn+'</span>'+
        '<span class="st"><b>'+esc(L.persona)+'</b><span>'+sub+'</span></span>'+
        '<span class="bar"><span class="fill" style="width:'+pct+'%"></span></span>'+
        '<span class="pct">'+pct+'%</span></a>';
    }).join('');
  }

  function renderRec(apiTracks, certBy, pro){
    var byId={}; apiTracks.forEach(function(t){byId[t.id]=t;});
    var activeKey=null, bestPct=-1;
    LV.forEach(function(k){var L=RM.byKey(k);if(!L)return;var tid=L.track;if(tid&&certBy[tid])return;var pct=(tid&&byId[tid])?byId[tid].pct:0;if(pct>bestPct){bestPct=pct;activeKey=k;}});
    if(!activeKey)activeKey='ds';
    var L=RM.byKey(activeKey);
    var rows=[row('i-compass','Continue the '+L.persona+' track','Your active specialization',rolePage(activeKey),ARR),
              row('i-flask','Practice exercises','Sharpen skills and earn XP','/exercises/',ARR)];
    if(!pro)rows.push(row('i-seal','Get certified','Graded practice and a certificate','/pricing.html','<span class="tag pro">Pro</span>'));
    $('dh-rec').innerHTML=rows.join('');
  }

  function renderCerts(items){
    setText('dh-certn', String(items.length));
    var el=$('dh-certs');
    if(!items.length){el.innerHTML='<div class="empty">No certificates yet. Finish a track to earn your first.</div>';return;}
    el.innerHTML=items.map(function(c){
      var score=(c.score!=null)?(' &middot; '+c.score+'%'):'';
      var share=c.verify_url?('<a href="'+c.verify_url+'">Share</a>'):'';
      return '<div class="crow"><span class="seal"><svg><use href="#i-seal"/></svg></span><span class="cn"><b>'+esc(c.track_name||c.track)+'</b><span>Earned '+fmtDate(c.issued_at)+score+'</span></span>'+share+'</div>';
    }).join('');
  }

  function renderSaved(saved){
    var items=saved.items||[];
    setText('dh-savedn', String(saved.total!=null?saved.total:items.length));
    var el=$('dh-saved');
    if(!items.length){el.innerHTML='<div class="empty">Nothing saved yet. Bookmark a tutorial to read later.</div>';return;}
    el.innerHTML=items.map(function(it){return '<a class="row" href="'+postHref(it.slug)+'">'+ic('i-mark')+'<span class="rt"><b>'+esc(titleFor(it.slug))+'</b><span>Saved</span></span>'+ARR+'</a>';}).join('');
  }

  function render(d){
    var me=d.me, stats=d.stats||{}, tracks=d.tracks||{tracks:[]}, certsR=d.certs||{items:[]}, reading=d.reading||{items:[]}, saved=d.saved||{items:[]};
    var u=me.user||{}, pro=!!me.pro, streak=stats.current_streak_days||0;
    var first=String(u.display_name||(u.email?u.email.split('@')[0]:'')||'').split(' ')[0];
    var certItems=certsR.items||[], certBy={}; certItems.forEach(function(c){certBy[c.track]=c;});

    setText('dh-name', first?(', '+first):'');
    var sub=$('dh-sub'); sub.classList.remove('dh-skel');
    sub.innerHTML= streak>0 ? ('You are on a <b>'+streak+'-day streak.</b> Pick up where you left off.') : 'Pick up where you left off.';
    if(streak>0){setText('dh-streakn',streak);$('dh-streakchip').hidden=false;}

    var best=stats.longest_streak_days||streak;
    var active=(tracks.tracks||[]).filter(function(t){return t.pct>0&&t.pct<100;}).length;
    $('dh-stats').innerHTML=
      tile(fmt(tracks.total_solved||0),'Exercises solved','','')+
      tile(fmt(stats.total_xp||0),'XP earned','','')+
      tile(streak+'d','Current streak','fire', best?('best '+best+'d'):'')+
      tile(String(certItems.length),'Certificates','', active?(active+' in progress'):'');

    renderResume(reading.items&&reading.items[0]);
    renderStages(tracks.tracks||[], certBy);
    renderRec(tracks.tracks||[], certBy, pro);
    renderCerts(certItems);
    renderSaved(saved);
    if(!pro)$('dh-upsell').innerHTML='<div class="upsell"><span class="ck">The Program</span><h3 class="disp">Get certified</h3><p>Unlock graded practice, every specialization section, and the projects that become your portfolio.</p><a href="/pricing.html">See the Program <span class="a">&rarr;</span></a></div>';
  }

  // sidebar titles (non-blocking enrichment)
  fetch('/www/sidebar.json').then(function(r){return r.ok?r.json():null;}).then(function(sb){if(!sb)return;sb.forEach(function(sec){(sec.items||[]).forEach(function(it){if(it.href&&it.text)sbTitle[String(it.href).replace(/^\//,'')]=it.text;});});}).catch(function(){});

  // review-only fixtures (auth does not complete on the pages.dev subdomain). ?demo=1 | ?demo=pro
  if(/[?&]demo=(1|pro)/.test(location.search)){
    var dn=Math.floor(Date.now()/1000), dpro=/[?&]demo=pro/.test(location.search);
    render({me:{user:{display_name:'Selva Prabhakaran',email:'selva@example.com'},pro:dpro,pro_until:dpro?dn+31000000:null},
      stats:{total_xp:4820,current_streak_days:6,longest_streak_days:14},
      tracks:{total_solved:64,tracks:[{id:'r-fundamentals',pct:100,eligible:true,minted:true},{id:'tidyverse-practitioner',pct:100,eligible:true,minted:true},{id:'machine-learning',pct:46,solved:24,eligible:false},{id:'statistics-for-ds',pct:22}]},
      certs:{items:[{public_id:'RF-4127',track:'r-fundamentals',track_name:'R Foundations',issued_at:dn-3000000,score:94,verify_url:'https://r-statistics.co/cert/RF-4127'},{public_id:'TV-5102',track:'tidyverse-practitioner',track_name:'Tidyverse Practitioner',issued_at:dn-1000000,score:88,verify_url:'https://r-statistics.co/cert/TV-5102'}]},
      reading:{items:[{slug:'Linear-Regression',scroll_pct:62,last_section:'Model diagnostics'}]},
      saved:{total:3,items:[{slug:'Logistic-Regression'},{slug:'Random-Forest'},{slug:'ggplot2-Tutorial'}]}});
  } else {
  Promise.all([
    api('/api/me'),api('/api/me/stats'),api('/api/me/tracks'),api('/api/me/certificates'),
    api('/api/me/reading?kind=in_progress&limit=1'),api('/api/me/saved?limit=5')
  ]).then(function(r){
    if(!r[0]||!r[0].user)return toSignin();
    render({me:r[0],stats:r[1],tracks:r[2],certs:r[3],reading:r[4],saved:r[5]});
  }).catch(function(e){
    if(e&&e.a401)return toSignin();
    console.error('[dashboard]',e);
    var sub=$('dh-sub'); if(sub){sub.classList.remove('dh-skel');sub.textContent='Could not load your dashboard. Please refresh.';}
  });
  }

  var prog=$('prog');
  if(prog){var os=function(){var h=document.documentElement,m=h.scrollHeight-h.clientHeight;prog.style.width=(m>0?(h.scrollTop/m*100):0)+'%';};window.addEventListener('scroll',os,{passive:true});os();}
})();
