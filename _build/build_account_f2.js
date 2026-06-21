// build_account_f2.js -- generates the F2 account pages:
//   account.html (settings), account-billing.html, account-certificates.html
// Thin pages: SEO head (noindex) + nav (auth slots) + account-nav rail + skeleton
// containers (filled by /www/account.js) + footer + shell scripts.
// Re-run after editing the shared shell:  node _build/build_account_f2.js
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const SPRITE = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>'+
'<symbol id="i-arr" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></symbol>'+
'<symbol id="i-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></symbol>'+
'<symbol id="i-trophy" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M8 5h8v5a4 4 0 0 1-8 0V5z"/><path d="M16 7h3a2 2 0 0 1 0 4h-3"/><path d="M8 7H5a2 2 0 0 0 0 4h3"/><line x1="9" y1="18" x2="15" y2="18"/><line x1="12" y1="15" x2="12" y2="18"/><line x1="8" y1="21" x2="16" y2="21"/></symbol>'+
'<symbol id="i-shield" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3z"/><polyline points="9 12 11 14 15 10"/></symbol>'+
'<symbol id="i-device" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="12" rx="2"/><line x1="8" y1="20" x2="16" y2="20"/><line x1="12" y1="16" x2="12" y2="20"/></symbol>'+
'<symbol id="i-card" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="13" rx="2"/><line x1="3" y1="11" x2="21" y2="11"/></symbol>'+
'<symbol id="i-grid" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 17 9 11 13 14 21 5"/><line x1="3" y1="20" x2="21" y2="20"/></symbol>'+
'<symbol id="i-mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12v18l-6-4-6 4z"/></symbol>'+
'<symbol id="i-compass" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polygon points="16 8 11 11 8 16 13 13 16 8"/></symbol>'+
'<symbol id="i-logout" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8"/><polyline points="14 17 19 12 14 7"/><line x1="19" y1="12" x2="9" y2="12"/></symbol>'+
'<symbol id="i-spark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 13.8 9.4 20 11 13.8 12.6 12 19 10.2 12.6 4 11 10.2 9.4 Z"/></symbol>'+
'<symbol id="i-settings" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2.1-1.6-2-3.5-2.5.9a7 7 0 0 0-2.1-1.2L14 3h-4l-.4 2.4a7 7 0 0 0-2.1 1.2l-2.5-.9-2 3.5 2.1 1.6A7 7 0 0 0 5 12a7 7 0 0 0 .1 1.2l-2.1 1.6 2 3.5 2.5-.9a7 7 0 0 0 2.1 1.2l.4 2.4h4l.4-2.4a7 7 0 0 0 2.1-1.2l2.5.9 2-3.5-2.1-1.6c.06-.4.1-.79.1-1.2z"/></symbol>'+
'</defs></svg>';

const AUTHCSS = '.auth-anon{display:none;align-items:center}body.state-anon .auth-anon{display:inline-flex}'+
'.masthead-auth-link{font-size:14px;font-weight:600;color:var(--ink);border-bottom:2px solid var(--line);padding-bottom:1px}'+
'.masthead-auth-link:hover{border-color:var(--ink)}';

const GA = "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:1500});gtag('config','G-D5XKCMN7FR');(function(){var loaded=false;function load(){if(loaded)return;loaded=true;cleanup();var s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id=G-D5XKCMN7FR';document.head.appendChild(s);}var ev=['pointerdown','keydown','scroll','touchstart'];function cleanup(){ev.forEach(function(e){window.removeEventListener(e,load,{capture:true});});}function arm(){ev.forEach(function(e){window.addEventListener(e,load,{capture:true,once:true,passive:true});});setTimeout(load,6000);}if(document.readyState==='complete')arm();else window.addEventListener('load',arm,{once:true});})();";

const NAV =
'<nav class="nav"><div class="wrap">'+
'<a class="brand" href="/">r-statistics<span class="co">.co</span></a>'+
'<div class="links"><a href="/roadmap/">Roadmap</a><a href="/tutorials/">Tutorials</a><a href="/exercises/">Exercises</a><a href="/tools/">Tools</a></div>'+
'<div class="right"><span class="auth-anon"><a class="masthead-auth-link" href="/signin.html">Sign in</a></span><span class="auth-user"></span></div>'+
'</div></nav>';

const FOOT = '<footer class="foot"><span>&copy; 2016&ndash;2026 r-statistics.co</span><span><a href="/roadmap/">Roadmap</a> &nbsp; <a href="/pricing.html">Pricing</a></span></footer>';

const SCRIPTS =
'<script src="/www/roadmap-data.js"></script>'+
'<script src="/www/roadmap-curriculum.js"></script>'+
'<script src="/www/account.js?v=2"></script>'+
'<script defer src="/www/consent-banner.js?v=2"></script>'+
'<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon=\'{"token": "edf7e3d50c3e4130a913e7f144643624"}\'></script>'+
'<script defer src="/www/auth-hydrate.js?v=11"></script>'+
'<script defer src="/www/persona-menu.js?v=3"></script>'+
'<script defer src="/www/signin-nudge.js?v=10"></script>';

const NAVITEMS = [
  {href:'/dashboard.html', icon:'i-grid', label:'Dashboard', key:'dashboard'},
  {href:'/account-certificates.html', icon:'i-trophy', label:'My certificates', key:'certificates'},
  {href:'/saved-posts.html', icon:'i-mark', label:'Saved posts', key:'saved'},
  {href:'/account-billing.html', icon:'i-card', label:'Billing &amp; plan', key:'billing'},
  {href:'/account.html', icon:'i-settings', label:'Account settings', key:'settings'},
];
function acctNav(active){
  return '<aside class="acctnav"><div class="sk">Account</div>'+
    NAVITEMS.map(function(n){return '<a href="'+n.href+'"'+(n.key===active?' class="on"':'')+'><svg><use href="#'+n.icon+'"/></svg> '+n.label+'</a>';}).join('')+
    '</aside>';
}

function page(o){
  return '<!DOCTYPE html>\n<html lang="en">\n<head>\n'+
'<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n'+
'<title>'+o.title+' &middot; r-statistics.co</title>\n'+
'<meta name="robots" content="noindex, nofollow">\n'+
'<link rel="icon" type="image/png" href="/screenshots/iconb-64.png">\n'+
'<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'+
'<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@500;600;700&family=Inter:wght@400;450;500;600&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">\n'+
'<link rel="stylesheet" href="/www/dashboard.css?v=1">\n<link rel="stylesheet" href="/www/account.css?v=1">\n'+
'<script>'+GA+'</script>\n<style>'+AUTHCSS+'</style>\n</head>\n'+
'<body data-acct="'+o.acct+'">\n<div class="prog" id="prog"></div>\n'+SPRITE+'\n'+NAV+'\n'+
'<main class="wrap"><div class="pagewrap">'+acctNav(o.acct==='settings'?'settings':o.acct)+'<div class="acctmain">'+o.content+'</div></div>'+FOOT+'</main>\n'+
SCRIPTS+'\n</body>\n</html>\n';
}

const ERR = '<div class="empty" id="ac-error" style="display:none"></div>';

const SETTINGS = page({acct:'settings', title:'Account settings',
  content:
'<h1 class="ph">Account settings</h1><p class="pl">Manage your profile and security.</p>'+
'<div class="card" id="ac-profile"></div>'+
'<div class="card"><span class="ck">Security</span><h2 class="disp">Active sessions</h2><div class="subt">Devices currently signed in to your account.</div><div id="ac-sessions"></div><div class="actions-row" id="ac-secactions"></div></div>'+
'<div class="card"><span class="ck">Your data</span><h2 class="disp">Export or delete</h2><div class="subt">You own your data.</div><div class="note">Want a copy of everything (lessons, exercises, certificates, bookmarks) or to delete your account? <a href="mailto:selva@r-statistics.co?subject=Data%20request">Email support</a> and we will action it within 24 hours. Self-service export and deletion are on the way.</div></div>'+
ERR});

const BILLING = page({acct:'billing', title:'Billing and plan',
  content:
'<h1 class="ph">Billing &amp; plan</h1><p class="pl">Your plan and what it unlocks.</p>'+
'<div class="card" id="ac-plan"></div>'+
'<div class="note" style="text-align:center;margin-top:6px">Questions about billing? <a href="mailto:selva@r-statistics.co?subject=Billing">Email support</a> &middot; 30-day money-back guarantee on every paid plan.</div>'+
ERR});

const CERTS = page({acct:'certificates', title:'My certificates',
  content:
'<h1 class="ph">My certificates</h1><p class="pl">Every credential you have earned, verifiable and shareable.</p>'+
'<div class="stat-strip" id="ac-stats"></div>'+
'<div id="ac-claim"></div>'+
'<div class="secthd"><h2>Earned</h2></div><div class="certgrid" id="ac-earned"></div>'+
'<div class="secthd" id="ac-progress-hd" style="display:none"><h2>In progress</h2><a class="all" href="/roadmap/">See roadmap &rarr;</a></div><div class="rows" id="ac-progress"></div>'+
ERR});

fs.writeFileSync(path.join(ROOT,'account.html'), SETTINGS);
fs.writeFileSync(path.join(ROOT,'account-billing.html'), BILLING);
fs.writeFileSync(path.join(ROOT,'account-certificates.html'), CERTS);
console.log('WROTE account.html + account-billing.html + account-certificates.html');
