// Generates the live F2 roadmap + 6 static SEO role pages from the shared www assets.
// Run: node _build/build_roadmap_f2.js   (from repo root)
// Idempotent: overwrites /roadmap/index.html + /roadmap/<slug>.html and updates sitemap.xml.
const fs=require('path'), p=require('path'), F=require('fs');
const root=process.cwd();
global.window={};
require(p.join(root,'www','roadmap-data.js'));
require(p.join(root,'www','roadmap-curriculum.js'));
const RM=window.RM, RM2=window.RM2;

const ORIGIN='https://r-statistics.co';
const ROLES=[
  {k:'foundations',slug:'new-to-r',name:'New to R',title:'Learn R from Scratch: the Foundations Roadmap',
   desc:'Learn R from your first vector to writing your own functions. A free, structured path through R fundamentals, ending in the R Fundamentals certificate.'},
  {k:'analyst',slug:'data-analyst',name:'Data Analyst',title:'Become a Data Analyst in R: the Roadmap',
   desc:'Go from a raw file to a clear analysis in R with dplyr, ggplot2 and EDA. A free learning path ending in the Tidyverse Practitioner certificate.'},
  {k:'ds',slug:'data-scientist',name:'Data Scientist',title:'Machine Learning in R: the Data Scientist Roadmap',
   desc:'Build, tune and explain machine learning models in R with tidymodels and xgboost. A structured path ending in the Machine Learning certificate.'},
  {k:'ts',slug:'forecaster',name:'Forecaster',title:'Time Series Forecasting in R: the Roadmap',
   desc:'Forecast time series in R the modern way: tsibble, ETS, ARIMA and reconciliation. An fpp3-grade path ending in the Time Series Forecasting certificate.'},
  {k:'researcher',slug:'researcher',name:'Researcher',title:'Applied Statistics in R: the Researcher Roadmap',
   desc:'Run defensible statistics in R: inference, regression, GLMs, mixed models, causal inference and Bayes. Ends in the Applied Statistics certificate.'},
  {k:'developer',slug:'r-developer',name:'R Developer',title:'Advanced R: the R Developer Roadmap',
   desc:'Engineer production-grade R: functional and object-oriented R, packages, testing, performance and Shiny. Ends in the Advanced R certificate.'}
];
const FONTS='<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@500;600;700&family=Inter:wght@400;450;500;600&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">';
const AUTHCSS='<style>.auth-anon{display:none;align-items:center}body.state-anon .auth-anon{display:inline-flex}.masthead-auth-link{font-size:14px;font-weight:600;color:var(--ink);border-bottom:2px solid var(--line);padding-bottom:1px}.masthead-auth-link:hover{border-color:var(--ink)}.nav .right{margin-left:auto;display:flex;align-items:center;gap:14px}</style>';
const GA="<script>\n  window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}\n  gtag('js',new Date());\n  gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:1500});\n  gtag('config','G-D5XKCMN7FR');\n  (function(){var loaded=false;function load(){if(loaded)return;loaded=true;cleanup();var s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id=G-D5XKCMN7FR';document.head.appendChild(s);}var ev=['pointerdown','keydown','scroll','touchstart'];function cleanup(){ev.forEach(function(e){window.removeEventListener(e,load,{capture:true});});}function arm(){ev.forEach(function(e){window.addEventListener(e,load,{capture:true,once:true,passive:true});});setTimeout(load,6000);}if(document.readyState==='complete')arm();else window.addEventListener('load',arm,{once:true});})();\n</script>";
const SHELL="<script defer src=\"/www/consent-banner.js?v=2\"></script>\n<script defer src=\"https://static.cloudflareinsights.com/beacon.min.js\" data-cf-beacon='{\"token\": \"edf7e3d50c3e4130a913e7f144643624\"}'></script>\n<script defer src=\"/www/auth-hydrate.js?v=11\"></script>\n<script defer src=\"/www/signin-nudge.js?v=10\"></script>\n<script defer src=\"/www/persona-menu.js?v=4\"></script>";
function nav(){return '<nav class="nav"><div class="wrap">\n  <a class="brand" href="/">r-statistics<span class="co">.co</span></a>\n  <div class="links"><a href="/roadmap/" class="on">Roadmap</a><a href="/tutorials/">Tutorials</a><a href="/exercises/">Exercises</a><a href="/tools/">Tools</a></div>\n  <div class="right"><a class="btn" href="/pricing.html">Get certified <span class="a">&rarr;</span></a><span class="auth-anon"><a class="masthead-auth-link" href="/signin.html">Sign in</a></span><span class="auth-user"></span></div>\n</div></nav>';}
function foot(){return '<footer class="foot"><span>&copy; 2016&ndash;2026 r-statistics.co</span><span><a href="/tutorials/">Tutorials</a> &nbsp; <a href="/tools/">Tools</a> &nbsp; <a href="/pricing.html">Pricing</a> &nbsp; <a href="/verify/">Verify a credential</a> &nbsp; <a href="/about/">About</a></span></footer>';}
function jsonldRoadmap(){
  return '<script type="application/ld+json">'+JSON.stringify({"@context":"https://schema.org","@type":"WebPage",name:"R Learning Roadmap, r-statistics.co",url:ORIGIN+"/roadmap/",description:"A guided route through R, sequenced by your goal: new to R, data analyst, data scientist, forecaster, researcher or R developer."})+'</script>\n'+
  '<script type="application/ld+json">'+JSON.stringify({"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"Home",item:ORIGIN+"/"},{"@type":"ListItem",position:2,name:"Roadmap",item:ORIGIN+"/roadmap/"}]})+'</script>';
}
function jsonldRole(r){
  const url=ORIGIN+'/roadmap/'+r.slug+'.html';
  return '<script type="application/ld+json">'+JSON.stringify({"@context":"https://schema.org","@type":"WebPage",name:r.title,url:url,description:r.desc})+'</script>\n'+
  '<script type="application/ld+json">'+JSON.stringify({"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"Home",item:ORIGIN+"/"},{"@type":"ListItem",position:2,name:"Roadmap",item:ORIGIN+"/roadmap/"},{"@type":"ListItem",position:3,name:r.name,item:url}]})+'</script>';
}
function head(o){
  return '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n'+
    '<title>'+o.title+'</title>\n<meta name="description" content="'+o.desc+'">\n<meta name="author" content="Selva Prabhakaran">\n<meta name="robots" content="index, follow">\n'+
    '<link rel="canonical" href="'+o.canon+'">\n<link rel="icon" type="image/png" href="/screenshots/iconb-64.png">\n'+
    '<meta property="og:type" content="website"><meta property="og:title" content="'+o.title+'"><meta property="og:description" content="'+o.desc+'"><meta property="og:url" content="'+o.canon+'"><meta property="og:site_name" content="r-statistics.co"><meta property="og:image" content="'+ORIGIN+'/screenshots/og-default.png">\n'+
    '<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="'+o.title+'"><meta name="twitter:description" content="'+o.desc+'"><meta name="twitter:image" content="'+ORIGIN+'/screenshots/og-default.png">\n'+
    o.jsonld+'\n'+FONTS+'\n<link rel="stylesheet" href="/www/'+o.css+'?v=4">\n'+GA+'\n'+AUTHCSS+'\n</head>';
}
const ROADMAP_MAIN=`<main class="wrap">
  <header class="hero reveal">
    <h1 class="disp">Learn R, <u>role by role</u>.</h1>
    <p class="lede">A complete path from your first line of R to real, shippable work, taught in the order a practitioner would teach it. Free to read, certified when you are ready.</p>
    <div class="go"><a class="primary" href="/pricing.html">Get certified <span class="a">&rarr;</span></a><a class="ghost" href="#path">Browse the curriculum</a></div>
    <div class="stats" id="stats"></div>
    <div class="rolerail" id="rolerail"></div>
  </header>
  <section class="section" id="path">
    <div class="shead reveal"><div class="num">01</div><div><h2 class="disp">Build your foundation.</h2><p>Start where every data role begins: solid R and strong analysis skills. Both steps are completely free.</p></div></div>
    <div class="atlas" id="core"></div>
  </section>
  <div class="fork reveal"><div class="ln"></div><b class="disp">Earn the Data Analyst credential, then specialize.</b><span>Four specializations, all equal. Pick the one you want, take them in any order, or earn them all.</span></div>
  <section class="section" style="padding-top:8px">
    <div class="shead reveal"><div class="num">02</div><div><h2 class="disp">Choose your specialization.</h2><p>Section 1 of every track is free. The certificate, graded practice and projects come with the Program.</p></div></div>
    <div class="atlas" id="tracks"></div>
  </section>
  <section class="section" id="proj">
    <div class="shead reveal"><div class="num">03</div><div><h2 class="disp">Build projects worth putting on a CV.</h2><p>Twenty-eight industry builds, from a first clean dataset to a deployed model. Starter and some Core projects are free; the rest become your portfolio.</p></div></div>
    <div class="reveal"><div class="pctl" id="pctl"></div><div class="pindex" id="pgrid"></div></div>
  </section>
  <section class="final reveal"><div class="in">
    <div><h2 class="disp">Read it free. Get certified to prove it.</h2><p>Every lesson is open. The graded practice, the projects and the certificate are the Program.</p></div>
    <a class="primary" href="/pricing.html">Join the Program <span class="a">&rarr;</span></a>
  </div></section>
</main>`;
const ROLE_DEFS=`<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  <symbol id="i-arr" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></symbol>
  <symbol id="i-spark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 L13.8 9.4 L20 11 L13.8 12.6 L12 19 L10.2 12.6 L4 11 L10.2 9.4 Z"/></symbol>
</defs></svg>`;
const ROLE_MAIN=`<main class="wrap">
  <header class="hero reveal">
    <a class="back" href="/roadmap/"><svg><use href="#i-arr"/></svg> The R roadmap</a>
    <div class="rchip" id="rchip"><i></i><span id="rchipText"></span></div>
    <h1 class="disp" id="roleHead"></h1>
    <p class="dek" id="roleDek"></p>
    <div class="meta" id="roleMeta"></div>
    <div class="go"><a class="primary" href="/pricing.html">Get certified <span class="a">&rarr;</span></a><a class="ghost" href="#curriculum">Browse the curriculum</a></div>
  </header>
  <div class="prereq reveal" id="prereq"></div>
  <section class="section" id="curriculum">
    <div class="shead reveal"><h2 class="disp" id="curHead">The full curriculum</h2><p id="curLead"></p>
      <div class="legend"><span><b class="f">Free</b> open to read</span><span><b class="p">Pro</b> with the Program (graded, certificate)</span></div>
    </div>
    <div class="curric reveal" id="curric"></div>
  </section>
  <section class="section" id="projects-sec">
    <div class="shead reveal"><h2 class="disp">Projects that prove it</h2><p>Finish two or three to build a portfolio a hiring manager can open, and earn the credential.</p></div>
    <div class="pindex reveal" id="pgrid"></div>
  </section>
  <section class="certband reveal"><div class="in">
    <div><h2 class="disp" id="certHead">Earn the certificate</h2><p id="certSub">Read every lesson free. The graded practice, projects and certificate are the Program.</p></div>
    <a class="primary" href="/pricing.html">Join the Program <span class="a">&rarr;</span></a>
  </div></section>
</main>`;
function dataScripts(render){return '<script src="/www/roadmap-data.js"></script>\n<script src="/www/roadmap-curriculum.js"></script>\n<script src="/www/'+render+'"></script>';}

// --- roadmap index ---
const idx=head({title:'R Learning Roadmap · r-statistics.co',desc:'A guided route through R, sequenced by your goal: new to R, data analyst, data scientist, forecaster, researcher or R developer. Every level earns a verifiable certificate.',canon:ORIGIN+'/roadmap/',jsonld:jsonldRoadmap(),css:'roadmap-f2.css'})+
  '\n<body data-page="roadmap">\n<div class="prog" id="prog"></div>\n'+nav()+'\n'+ROADMAP_MAIN+'\n'+foot()+'\n'+dataScripts('roadmap-f2.js?v=3')+'\n'+SHELL+'\n</body>\n</html>\n';
F.writeFileSync(p.join(root,'roadmap','index.html'),idx);
let n=1;

// --- 6 role pages ---
ROLES.forEach(function(r){
  const canon=ORIGIN+'/roadmap/'+r.slug+'.html';
  const h=head({title:r.title+' · r-statistics.co',desc:r.desc,canon:canon,jsonld:jsonldRole(r),css:'roadmap-role.css'});
  const html=h+'\n<body data-page="role" data-role="'+r.k+'">\n<div class="prog" id="prog"></div>\n'+ROLE_DEFS+'\n'+nav()+'\n'+ROLE_MAIN+'\n'+foot()+'\n'+dataScripts('roadmap-role.js?v=3')+'\n'+SHELL+'\n</body>\n</html>\n';
  F.writeFileSync(p.join(root,'roadmap',r.slug+'.html'),html);
  n++;
});

// --- sitemap ---
const smPath=p.join(root,'sitemap.xml');
let sm=F.readFileSync(smPath,'utf8');
const today=new Date().toISOString().slice(0,10);
const urls=ROLES.map(function(r){return ORIGIN+'/roadmap/'+r.slug+'.html';});
let added=0;
urls.forEach(function(u){
  if(sm.indexOf('<loc>'+u+'</loc>')<0){
    sm=sm.replace('</urlset>','  <url><loc>'+u+'</loc><lastmod>'+today+'</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>\n</urlset>');
    added++;
  }
});
F.writeFileSync(smPath,sm);
console.log('WROTE roadmap/index.html + '+ROLES.length+' role pages | sitemap +'+added);
