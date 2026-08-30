// persona-menu.js -- logged-out account menu. Replaces the plain "Sign in" link in
// every .auth-anon slot with a guest persona circle + a compact dropdown that previews
// the signed-in surfaces and drives signups. Anon-only (.auth-anon is hidden under
// body.state-pro). Self-contained CSS; coordinates with auth-hydrate (which owns
// .auth-anon visibility + .auth-user). GA4 events on open/CTA.
(function(){
  'use strict';
  // Masthead/nav slots ONLY. Tutorial pages also have an in-content
  // .actionbar-sync.auth-anon (the logged-out Save/Mark-read prompt) which must
  // keep its own sign-in behavior, so exclude anything inside main/#content/.actionbar.
  var slots=Array.prototype.filter.call(document.querySelectorAll('.auth-anon'),function(s){return !s.closest('main,#content,.actionbar');});
  if(!slots.length)return;
  function ga(ev,extra){try{if(window.gtag)gtag('event',ev,Object.assign({event_category:'persona_menu'},extra||{}));}catch(e){}}

  var I={
    user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M5 21a7 7 0 0 1 14 0"/></svg>',
    mark:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12v18l-6-4-6 4z"/></svg>',
    seal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M8 5h8v5a4 4 0 0 1-8 0V5z"/><path d="M16 7h3a2 2 0 0 1 0 4h-3"/><path d="M8 7H5a2 2 0 0 0 0 4h3"/><line x1="9" y1="18" x2="15" y2="18"/><line x1="12" y1="15" x2="12" y2="18"/><line x1="8" y1="21" x2="16" y2="21"/></svg>',
    grid:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 17 9 11 13 14 21 5"/><line x1="3" y1="20" x2="21" y2="20"/></svg>'
  };
  var ROWS=[
    {ic:'mark',t:'Saved posts',next:'/saved-posts.html'},
    {ic:'seal',t:'My certificates',next:'/account-certificates.html'},
    {ic:'grid',t:'Dashboard',next:'/dashboard.html'}
  ];
  var rows=ROWS.map(function(r){
    return '<a class="pm-row" href="/signin.html?next='+encodeURIComponent(r.next)+'" data-pm="row"><span class="pm-ic">'+I[r.ic]+'</span><span class="pm-t">'+r.t+'</span></a>';
  }).join('');
  var MENU=
    '<div class="pm-head"><span class="pm-av">'+I.user+'</span><span class="pm-who"><b>Browsing as guest</b><span>Sign in to save your progress</span></span></div>'+
    '<div class="pm-rows">'+rows+'</div>'+
    '<div class="pm-cta"><a class="pm-primary" href="/signin.html" data-pm="create">Create free account</a><a class="pm-secondary" href="/signin.html" data-pm="signin">Sign in</a><div class="pm-reassure">Free. Save posts, track progress, get certified.</div></div>';

  var CSS=
    '.auth-anon .pm{position:relative;display:inline-flex;align-items:center}'+
    '.auth-anon .pm-circle{width:34px;height:34px;border-radius:50%;background:#fff;border:1px solid #e4e4df;display:flex;align-items:center;justify-content:center;color:#888e97;cursor:pointer;padding:0}'+
    '.auth-anon .pm-circle svg{width:18px;height:18px}'+
    '.auth-anon .pm-circle:hover,.auth-anon .pm-circle[aria-expanded="true"]{border-color:#14161b;color:#14161b}'+
    '.auth-anon .pm-menu{position:absolute;top:46px;right:0;width:286px;background:#fff;border:1px solid #e9e9e4;border-radius:14px;box-shadow:0 18px 40px -18px rgba(20,23,28,.28),0 2px 8px rgba(20,23,28,.08);overflow:hidden;z-index:200;opacity:0;transform:translateY(-6px);pointer-events:none;transition:opacity .15s,transform .15s;font-family:inherit}'+
    '.auth-anon .pm-menu.pm-open{opacity:1;transform:none;pointer-events:auto}'+
    '.auth-anon .pm-head{display:flex;align-items:center;gap:11px;padding:14px 16px;border-bottom:1px solid #f2f2ee}'+
    '.auth-anon .pm-av{width:38px;height:38px;border-radius:50%;border:1px solid #e9e9e4;display:flex;align-items:center;justify-content:center;color:#888e97;flex:none}.auth-anon .pm-av svg{width:20px;height:20px}'+
    '.auth-anon .pm-who b{display:block;font-size:14px;font-weight:700;color:#14161b;line-height:1.2}.auth-anon .pm-who span{font-size:12px;color:#888e97}'+
    '.auth-anon .pm-rows{padding:6px 8px}'+
    '.auth-anon .pm-row{display:flex;align-items:center;gap:11px;padding:10px;border-radius:10px;text-decoration:none;font-size:13.5px;font-weight:600;color:#14161b}'+
    '.auth-anon .pm-row:hover{background:#f2f2ee}'+
    '.auth-anon .pm-ic{width:20px;color:#6b7280;display:flex;align-items:center;justify-content:center;flex:none}.auth-anon .pm-ic svg{width:17px;height:17px}'+
    '.auth-anon .pm-cta{padding:12px 14px 14px;border-top:1px solid #f2f2ee}'+
    '.auth-anon .pm-primary{display:block;text-align:center;background:#155c40;color:#fff;padding:11px;border-radius:11px;font-weight:600;font-size:14px;text-decoration:none}'+
    '.auth-anon .pm-primary:hover{background:#10452f;color:#fff}'+
    '.auth-anon .pm-secondary{display:block;text-align:center;margin-top:9px;font-size:13px;font-weight:600;color:#14161b;text-decoration:none}'+
    '.auth-anon .pm-secondary:hover{text-decoration:underline}'+
    '.auth-anon .pm-reassure{text-align:center;font-size:10.5px;color:#888e97;margin-top:10px;line-height:1.4}';

  var st=document.createElement('style');st.textContent=CSS;document.head.appendChild(st);

  slots.forEach(function(slot){
    slot.innerHTML='<span class="pm">'+
      '<button class="pm-circle" type="button" aria-haspopup="true" aria-expanded="false" aria-label="Account and sign in">'+I.user+'</button>'+
      '<div class="pm-menu" role="menu" aria-label="Account preview">'+MENU+'</div></span>';
    var btn=slot.querySelector('.pm-circle'), menu=slot.querySelector('.pm-menu');
    function setOpen(o){menu.classList.toggle('pm-open',o);btn.setAttribute('aria-expanded',o?'true':'false');if(o)ga('persona_menu_open');}
    btn.addEventListener('click',function(e){e.stopPropagation();setOpen(!menu.classList.contains('pm-open'));});
    menu.addEventListener('click',function(e){var a=e.target.closest('[data-pm]');if(a)ga('persona_cta_click',{label:a.getAttribute('data-pm')});});
    document.addEventListener('click',function(e){if(!slot.contains(e.target))setOpen(false);});
    document.addEventListener('keydown',function(e){if(e.key==='Escape')setOpen(false);});
  });
})();
