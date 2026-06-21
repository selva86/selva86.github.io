// persona-menu.js -- logged-out "persona" account menu (preview of signed-in features).
// SAFE BY DEFAULT: does nothing unless enabled, so it never changes prod behavior until
// turned on. Enable for testing/A-B via any of:
//   ?personamenu=1  |  localStorage 'rs-persona-menu'='1'  |  window.__PERSONA_MENU=true
// When enabled, replaces the contents of every .auth-anon slot (the plain "Sign in" link)
// with a guest persona circle + an honest, clearly-locked preview of the dashboard widgets.
// Only ever visible to anon users (.auth-anon is display:none under body.state-pro).
(function(){
  'use strict';
  function enabled(){try{return /[?&]personamenu=1/.test(location.search)||localStorage.getItem('rs-persona-menu')==='1'||window.__PERSONA_MENU===true;}catch(e){return false;}}
  if(!enabled())return;
  var slots=document.querySelectorAll('.auth-anon');
  if(!slots.length)return;
  function ga(ev,extra){try{if(window.gtag)gtag('event',ev,Object.assign({event_category:'persona_menu'},extra||{}));}catch(e){}}

  var I={
    user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M5 21a7 7 0 0 1 14 0"/></svg>',
    mark:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12v18l-6-4-6 4z"/></svg>',
    book:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 1-2-2V5z"/><path d="M4 19a2 2 0 0 1 2-2h12"/></svg>',
    flame:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3s-3 4 0 7c-3 0-5 2-5 6a5 5 0 0 0 10 0c0-3-2-4-2-7 1 1 3 1 3 4"/></svg>',
    seal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="9" r="6"/><path d="M9 14l-2 7 5-3 5 3-2-7"/></svg>',
    compass:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polygon points="16 8 11 11 8 16 13 13 16 8"/></svg>',
    lock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>'
  };
  var ROWS=[
    {ic:'mark',t:'Saved posts',s:'Bookmark tutorials to read later',next:'/saved-posts.html'},
    {ic:'book',t:'Reading progress',s:'Resume exactly where you left off',next:'/dashboard.html'},
    {ic:'flame',t:'XP and streak',s:'Earn XP as you solve exercises',next:'/dashboard.html'},
    {ic:'seal',t:'Certificates',s:'Earn shareable, verifiable credentials',next:'/account-certificates.html'},
    {ic:'compass',t:'Your roadmap',s:'A path that adapts to your progress',next:'/roadmap/'}
  ];
  function rowsHTML(){return ROWS.map(function(r){
    return '<a class="pm-row" href="/signin.html?next='+encodeURIComponent(r.next)+'" data-pm="row"><span class="pm-ic">'+I[r.ic]+'</span><span class="pm-t"><b>'+r.t+'</b><span>'+r.s+'</span></span><span class="pm-lk">'+I.lock+'</span></a>';
  }).join('');}
  var MENU=
    '<div class="pm-head"><span class="pm-av">'+I.user+'</span><span class="pm-who"><b>Browsing as guest</b><span>Create a free account to unlock these</span></span></div>'+
    '<div class="pm-stat"><div class="pm-s">'+I.lock+'<span>XP</span></div><div class="pm-s">'+I.lock+'<span>Streak</span></div><div class="pm-s">'+I.lock+'<span>Certs</span></div></div>'+
    '<div class="pm-rows">'+rowsHTML()+'</div>'+
    '<div class="pm-cta"><a class="pm-primary" href="/signin.html" data-pm="create">Create free account</a><a class="pm-secondary" href="/signin.html" data-pm="signin">or sign in</a><div class="pm-reassure">Free. No credit card.</div></div>';

  var CSS=
    '.auth-anon .pm{position:relative;display:inline-flex;align-items:center;gap:10px}'+
    '.auth-anon .pm .pm-signin{font-size:14px;font-weight:600;color:#14161b}'+
    '.auth-anon .pm-circle{width:34px;height:34px;border-radius:50%;background:#fff;border:1px solid #e4e4df;display:flex;align-items:center;justify-content:center;color:#888e97;cursor:pointer;position:relative;padding:0}'+
    '.auth-anon .pm-circle svg{width:18px;height:18px}'+
    '.auth-anon .pm-circle:hover,.auth-anon .pm-circle[aria-expanded="true"]{border-color:#14161b;color:#14161b}'+
    '.auth-anon .pm-circle .pm-dot{position:absolute;right:-1px;bottom:-1px;width:10px;height:10px;border-radius:50%;background:#1f7a55;border:2px solid #fff}'+
    '.auth-anon .pm-menu{position:absolute;top:46px;right:0;width:300px;background:#fff;border:1px solid #e9e9e4;border-radius:14px;box-shadow:0 18px 40px -18px rgba(20,23,28,.28),0 2px 8px rgba(20,23,28,.08);overflow:hidden;z-index:200;opacity:0;transform:translateY(-6px);pointer-events:none;transition:opacity .15s,transform .15s;font-family:inherit}'+
    '.auth-anon .pm-menu.pm-open{opacity:1;transform:none;pointer-events:auto}'+
    '.auth-anon .pm-head{display:flex;align-items:center;gap:11px;padding:14px 16px;border-bottom:1px solid #f2f2ee}'+
    '.auth-anon .pm-av{width:38px;height:38px;border-radius:50%;border:1px solid #e9e9e4;display:flex;align-items:center;justify-content:center;color:#888e97;flex:none}.auth-anon .pm-av svg{width:20px;height:20px}'+
    '.auth-anon .pm-who b{display:block;font-size:14px;font-weight:700;color:#14161b;line-height:1.2}.auth-anon .pm-who span{font-size:12px;color:#888e97}'+
    '.auth-anon .pm-stat{display:grid;grid-template-columns:repeat(3,1fr);border-bottom:1px solid #f2f2ee}'+
    '.auth-anon .pm-s{padding:10px 6px;text-align:center;border-right:1px solid #f2f2ee;color:#a9ada4}.auth-anon .pm-s:last-child{border-right:0}.auth-anon .pm-s svg{width:13px;height:13px}.auth-anon .pm-s span{display:block;margin-top:4px;font-size:10px;color:#888e97}'+
    '.auth-anon .pm-rows{padding:6px 8px}'+
    '.auth-anon .pm-row{display:flex;align-items:center;gap:11px;padding:9px 10px;border-radius:10px;text-decoration:none}'+
    '.auth-anon .pm-row:hover{background:#f2f2ee}'+
    '.auth-anon .pm-ic{width:30px;height:30px;border-radius:8px;background:#f2f2ee;color:#4d525b;display:flex;align-items:center;justify-content:center;flex:none}.auth-anon .pm-ic svg{width:16px;height:16px}'+
    '.auth-anon .pm-t{flex:1;min-width:0}.auth-anon .pm-t b{display:block;font-size:13px;font-weight:600;color:#4d525b;line-height:1.2}.auth-anon .pm-t span{font-size:11.5px;color:#888e97}'+
    '.auth-anon .pm-lk{color:#b6bab2;flex:none}.auth-anon .pm-lk svg{width:13px;height:13px;display:block}.auth-anon .pm-row:hover .pm-lk{color:#1f7a55}'+
    '.auth-anon .pm-cta{padding:12px 14px 14px;border-top:1px solid #f2f2ee}'+
    '.auth-anon .pm-primary{display:block;text-align:center;background:#14161b;color:#fff;padding:11px;border-radius:11px;font-weight:600;font-size:14px;text-decoration:none}'+
    '.auth-anon .pm-primary:hover{background:#000}'+
    '.auth-anon .pm-secondary{display:block;text-align:center;margin-top:9px;font-size:13px;font-weight:600;color:#14161b;text-decoration:none}'+
    '.auth-anon .pm-secondary:hover{text-decoration:underline}'+
    '.auth-anon .pm-reassure{text-align:center;font-size:10.5px;color:#888e97;margin-top:9px}';

  var st=document.createElement('style');st.textContent=CSS;document.head.appendChild(st);

  slots.forEach(function(slot){
    slot.innerHTML='<span class="pm"><a class="pm-signin" href="/signin.html">Sign in</a>'+
      '<button class="pm-circle" type="button" aria-haspopup="true" aria-expanded="false" aria-label="Account and sign in">'+I.user+'<span class="pm-dot" aria-hidden="true"></span></button>'+
      '<div class="pm-menu" role="menu" aria-label="Account preview">'+MENU+'</div></span>';
    var btn=slot.querySelector('.pm-circle'), menu=slot.querySelector('.pm-menu');
    function setOpen(o){menu.classList.toggle('pm-open',o);btn.setAttribute('aria-expanded',o?'true':'false');if(o)ga('persona_menu_open');}
    btn.addEventListener('click',function(e){e.stopPropagation();setOpen(!menu.classList.contains('pm-open'));});
    menu.addEventListener('click',function(e){var a=e.target.closest('[data-pm]');if(a)ga('persona_cta_click',{label:a.getAttribute('data-pm')});});
    document.addEventListener('click',function(e){if(!slot.contains(e.target))setOpen(false);});
    document.addEventListener('keydown',function(e){if(e.key==='Escape')setOpen(false);});
  });
})();
