// account.js -- shared renderer for the F2 account pages.
// body[data-acct] = settings | billing | certificates. Loaded after
// www/roadmap-data.js (RM) + www/roadmap-curriculum.js (RM2) + dashboard.css + account.css.
// Auth-gated: anon -> redirect to /signin.html?next=<self>.
(function(){
  'use strict';
  var RM=window.RM||{};
  var ACCT=document.body.getAttribute('data-acct')||'';
  function el(id){return document.getElementById(id);}
  function esc(t){return String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');}
  function setText(id,t){var e=el(id);if(e)e.textContent=t;}
  function fmtDate(sec){try{return new Date((sec>2e10?sec:sec*1000)).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'});}catch(e){return '';}}

  // ---- role-page links (cert track id -> level key -> slug) ----
  var SLUG={foundations:'new-to-r',analyst:'data-analyst',ds:'data-scientist',ts:'forecaster',researcher:'researcher',developer:'r-developer'};
  var LV=['foundations','analyst','ds','ts','researcher','developer'];
  var TRACK2KEY={}; LV.forEach(function(k){var L=RM.byKey&&RM.byKey(k);if(L&&L.track)TRACK2KEY[L.track]=k;});
  function rolePageForTrack(tid){var k=TRACK2KEY[tid];return k?('/roadmap/'+SLUG[k]+'.html'):'/roadmap/';}

  // ---- auth token (for mutations; mirrors auth-hydrate readAccessToken) ----
  function readToken(){try{for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(!k||k.indexOf('sb-')!==0||k.indexOf('-auth-token')<0)continue;var raw=localStorage.getItem(k);if(!raw)continue;var p=JSON.parse(raw);if(p&&typeof p.access_token==='string')return p.access_token;if(Array.isArray(p)&&typeof p[0]==='string')return p[0];}}catch(e){}return null;}
  function hdr(extra){var t=readToken();var h={Accept:'application/json'};if(t)h.Authorization='Bearer '+t;if(extra)for(var k in extra)h[k]=extra[k];return h;}
  function api(path,opts){opts=opts||{};opts.credentials='same-origin';opts.headers=hdr(opts.headers);return fetch(path,opts).then(function(r){if(r.status===401){var e=new Error('401');e.a401=true;throw e;}if(!r.ok)throw new Error(path+' '+r.status);return r.status===204?{}:r.json();});}
  function toSignin(){location.replace('/signin.html?next='+encodeURIComponent(location.pathname));}

  function ic(id){return '<svg><use href="#'+id+'"/></svg>';}
  var ARR='<span class="arr">'+ic('i-arr')+'</span>';
  function toast(msg){var t=document.createElement('div');t.className='toast';t.textContent=msg;document.body.appendChild(t);requestAnimationFrame(function(){t.classList.add('show');});setTimeout(function(){t.classList.remove('show');setTimeout(function(){t.remove();},250);},2600);}
  function absUrl(u){if(!u)return '';return /^https?:/i.test(u)?u:('https://r-statistics.co'+(u.charAt(0)==='/'?'':'/')+u);}

  // ===================== SETTINGS =====================
  function renderSettings(me, sess){
    var u=me.user||{};
    var name=u.display_name||(u.email?u.email.split('@')[0]:'You');
    var initials=(name||'?').trim().split(/[\s@._-]+/).filter(Boolean).slice(0,2).map(function(x){return x[0];}).join('').toUpperCase()||'?';
    el('ac-profile').innerHTML=
      '<span class="ck">Profile</span><h2 class="disp">Your profile</h2><div class="subt">How you appear on certificates and your account.</div>'+
      '<div class="prof"><span class="pav">'+esc(initials)+'</span><span class="pn"><b>'+esc(name)+'</b><span>'+esc(u.email||'')+'</span></span></div>'+
      '<div class="frow"><div class="field"><span class="lbl">Display name</span><span class="val">'+esc(name)+'</span></div>'+
      '<div class="field"><span class="lbl">Email</span><span class="val">'+esc(u.email||'')+'</span></div></div>'+
      '<div class="note">Your name and email come from your sign-in. Certificates are issued in this name.</div>';

    var list=(sess&&sess.sessions)||[];
    var others=list.filter(function(s){return !s.current;});
    el('ac-sessions').innerHTML = list.length ? list.map(function(s){
      return '<div class="sess"><span class="si">'+ic('i-device')+'</span><span class="sd"><b>'+esc(s.device||'Unknown device')+'</b>'+
        '<span>Last active '+fmtDate(s.last_seen_at||s.created_at)+(s.current?' &middot; this device':'')+'</span></span>'+
        (s.current?'<span class="cur">Current</span>':'<button class="rev" data-sid="'+esc(s.session_id)+'">Sign out</button>')+'</div>';
    }).join('') : '<div class="empty">No other active sessions.</div>';

    var acts='<button class="btn btn-out" id="ac-signout">'+ic('i-logout')+' Sign out</button>';
    if(others.length) acts='<button class="btn btn-out" id="ac-revall">Sign out all other devices</button>'+acts;
    el('ac-secactions').innerHTML=acts;

    el('ac-sessions').querySelectorAll('.rev').forEach(function(b){
      b.addEventListener('click',function(){
        var sid=b.getAttribute('data-sid'); b.disabled=true;
        api('/api/me/sessions/'+encodeURIComponent(sid),{method:'DELETE'}).then(function(){toast('Signed out that device');load();}).catch(function(){b.disabled=false;toast('Could not sign out that device');});
      });
    });
    var ra=el('ac-revall'); if(ra) ra.addEventListener('click',function(){ra.disabled=true;api('/api/me/sessions-revoke-all',{method:'POST'}).then(function(){toast('Signed out other devices');load();}).catch(function(){ra.disabled=false;toast('Could not complete that');});});
    var so=el('ac-signout'); if(so) so.addEventListener('click',function(){if(window.__auth&&window.__auth.signOut)window.__auth.signOut();else{toSignin();}});
  }

  // ===================== BILLING =====================
  function renderBilling(me){
    var pro=!!me.pro, until=me.pro_until;
    if(pro){
      el('ac-plan').innerHTML=
        '<div class="plan"><div class="pinfo"><span class="badge pro">'+ic('i-spark')+' Pro</span>'+
        '<b class="dp" style="margin-top:10px">Pro is active</b>'+
        '<div class="psub">'+(until?('Access through <b>'+esc(fmtDate(until))+'</b>.'):'Your Pro access is active.')+'</div></div>'+
        '<button class="btn btn-out" id="ac-portal">Manage billing</button></div>'+
        '<div class="note" style="margin-top:18px" id="ac-portal-note">Update your card, switch plans, download invoices, or cancel from the billing portal. Anything else, <a href="mailto:support@r-statistics.co?subject=Billing">email support</a>.</div>';
      var pb=el('ac-portal');
      if(pb) pb.addEventListener('click',function(){
        pb.disabled=true; pb.textContent='Opening…';
        api('/api/billing/portal').then(function(r){
          if(r&&r.url){ location.href=r.url; return; }
          pb.style.display='none';
          el('ac-portal-note').innerHTML='Self-service billing is not linked to this account yet. <a href="mailto:support@r-statistics.co?subject=Billing">Email support</a> and we will sort it within 24 hours.';
        }).catch(function(){
          pb.disabled=false; pb.textContent='Manage billing';
          toast('Could not open the billing portal');
        });
      });
    } else {
      el('ac-plan').innerHTML=
        '<div class="plan"><div class="pinfo"><span class="badge free">Free</span>'+
        '<b class="dp" style="margin-top:10px">You are on the free plan</b>'+
        '<div class="psub">Every lesson is free to read. Pro unlocks graded practice and the credential.</div></div>'+
        '<a class="btn btn-primary" href="/pricing.html">See the Program '+ic('i-arr')+'</a></div>'+
        '<ul class="unlocks">'+
          '<li>'+ic('i-check')+' Auto-graded exercises with hints and solutions</li>'+
          '<li>'+ic('i-check')+' Every specialization section, start to finish</li>'+
          '<li>'+ic('i-check')+' Portfolio projects that become your CV</li>'+
          '<li>'+ic('i-check')+' Shareable, verifiable certificates</li>'+
        '</ul>';
    }
  }

  // ===================== CERTIFICATES =====================
  function renderCerts(certsR, tracksR){
    var items=(certsR&&certsR.items)||[];
    var tracks=(tracksR&&tracksR.tracks)||[];
    var inProg=tracks.filter(function(t){return t.pct>0&&t.pct<100;});
    var claimable=tracks.filter(function(t){return t.eligible&&!t.minted;});
    var scores=items.map(function(c){return c.score;}).filter(function(s){return s!=null;});
    var avg=scores.length?Math.round(scores.reduce(function(a,b){return a+b;},0)/scores.length):null;

    el('ac-stats').innerHTML=
      '<div class="stat"><b class="mono">'+items.length+'</b><span>Earned</span></div>'+
      '<div class="stat"><b class="mono">'+inProg.length+'</b><span>In progress</span></div>'+
      '<div class="stat"><b class="mono">'+(avg!=null?avg+'%':'&ndash;')+'</b><span>Avg assessment score</span></div>';

    el('ac-claim').innerHTML=claimable.map(function(t){
      return '<div class="claim"><span class="ci">'+ic('i-trophy')+'</span><span class="ct"><b>'+esc(t.name)+' &mdash; ready to claim</b><span>You have met the requirement. Mint your certificate.</span></span>'+
        '<button class="btn btn-primary btn-sm" data-claim="'+esc(t.id)+'">Claim certificate</button></div>';
    }).join('');
    el('ac-claim').querySelectorAll('[data-claim]').forEach(function(b){
      b.addEventListener('click',function(){var id=b.getAttribute('data-claim');b.disabled=true;b.textContent='Minting...';
        api('/api/cert/mint',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({track_id:id})}).then(function(){toast('Certificate minted');load();}).catch(function(){b.disabled=false;b.textContent='Claim certificate';toast('Could not mint yet');});
      });
    });

    if(items.length){
      el('ac-earned').innerHTML=items.map(function(c){
        var nm=c.track_name||c.track;
        var v=absUrl(c.verify_url||('/cert/'+c.public_id));
        var d=new Date((c.issued_at>2e10?c.issued_at:c.issued_at*1000));
        var li='https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name='+encodeURIComponent(nm)+'&organizationName='+encodeURIComponent('r-statistics.co')+'&certUrl='+encodeURIComponent(v)+'&certId='+encodeURIComponent(c.public_id||'')+(c.issued_at?('&issueYear='+d.getFullYear()+'&issueMonth='+(d.getMonth()+1)):'');
        return '<div class="ccard"><div class="frame"><span class="cseal">'+ic('i-trophy')+'</span>'+
          '<div class="clbl">Certificate of Mastery</div><div class="cnm">'+esc(nm)+'</div>'+
          '<div class="awd">Verified at <b>'+esc((v||'').replace(/^https?:\/\//,''))+'</b></div></div>'+
          '<div class="cmeta">'+(c.score!=null?'<span class="score">'+c.score+'% score</span>':'')+'<span>Earned '+fmtDate(c.issued_at)+'</span></div>'+
          '<div class="cacts"><a class="btn btn-primary btn-sm" href="'+v+'" target="_blank" rel="noopener">'+ic('i-arr')+' Share link</a>'+
          '<a class="btn btn-out btn-sm" href="'+li+'" target="_blank" rel="noopener">Add to LinkedIn</a>'+
          '<a class="btn btn-out btn-sm" href="'+v+'" target="_blank" rel="noopener">'+ic('i-shield')+' Verify</a></div></div>';
      }).join('');
    } else {
      el('ac-earned').innerHTML='<div class="empty">No certificates yet. Finish a track to earn your first, then it will be verifiable and shareable from here.</div>';
    }

    var pe=el('ac-progress'), ph=el('ac-progress-hd');
    if(inProg.length){
      if(ph)ph.style.display='';
      pe.innerHTML=inProg.map(function(t){
        return '<a class="row" href="'+rolePageForTrack(t.id)+'"><span class="ic">'+ic('i-compass')+'</span><span class="rt"><b>'+esc(t.name)+'</b><span>'+(t.solved||0)+' of '+(t.total_exercises||t.threshold||0)+' exercises &middot; '+t.pct+'%</span></span>'+ARR+'</a>';
      }).join('');
    } else { if(ph)ph.style.display='none'; pe.innerHTML=''; }
  }

  // ===================== load =====================
  function load(){
    if(ACCT==='settings'){
      Promise.all([api('/api/me'),api('/api/me/sessions').catch(function(){return {sessions:[]};})]).then(function(r){
        if(!r[0]||!r[0].user)return toSignin(); renderSettings(r[0],r[1]);
      }).catch(fail);
    } else if(ACCT==='billing'){
      api('/api/me').then(function(me){ if(!me||!me.user)return toSignin(); renderBilling(me); }).catch(fail);
    } else if(ACCT==='certificates'){
      Promise.all([api('/api/me'),api('/api/me/certificates'),api('/api/me/tracks')]).then(function(r){
        if(!r[0]||!r[0].user)return toSignin(); renderCerts(r[1],r[2]);
      }).catch(fail);
    }
  }
  function fail(e){ if(e&&e.a401)return toSignin(); console.error('[account]',e); var m=el('ac-error'); if(m){m.style.display='';m.textContent='Could not load this page. Please refresh.';} }

  // review-only fixtures so the F2 layouts can be eyeballed on the preview
  // (auth does not complete on the pages.dev subdomain). ?demo=1 | ?demo=pro
  if(/[?&]demo=(1|pro)/.test(location.search)){
    var dn=Math.floor(Date.now()/1000), dpro=/[?&]demo=pro/.test(location.search);
    var dme={user:{display_name:'Selva Prabhakaran',email:'selva@example.com'},pro:dpro,pro_until:dpro?dn+31000000:null};
    if(ACCT==='settings')renderSettings(dme,{sessions:[{device:'Chrome on Windows',last_seen_at:dn,created_at:dn-2000000,current:true},{device:'Safari on iPhone',session_id:'demo2',last_seen_at:dn-90000,created_at:dn-900000}]});
    else if(ACCT==='billing')renderBilling(dme);
    else if(ACCT==='certificates')renderCerts({items:[{public_id:'RF-4127',track:'r-fundamentals',track_name:'R Foundations',issued_at:dn-3000000,score:94,verify_url:'https://r-statistics.co/cert/RF-4127'},{public_id:'TV-5102',track:'tidyverse-practitioner',track_name:'Tidyverse Practitioner',issued_at:dn-1000000,score:88,verify_url:'https://r-statistics.co/cert/TV-5102'}]},{tracks:[{id:'machine-learning',name:'Machine Learning',pct:46,solved:24,total_exercises:52},{id:'statistics-for-ds',name:'Statistics for Data Science',pct:100,eligible:true,minted:false,solved:40,total_exercises:40}]});
  } else { load(); }

  var prog=el('prog'); if(prog){var os=function(){var h=document.documentElement,m=h.scrollHeight-h.clientHeight;prog.style.width=(m>0?(h.scrollTop/m*100):0)+'%';};window.addEventListener('scroll',os,{passive:true});os();}
})();
