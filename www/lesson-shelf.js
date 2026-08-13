// Dashboard module: "Your open lessons" (the windowed shelf) + the
// mini-course catalog with locks. Renders into #dh-shelf-host on
// dashboard.html. Data: /api/nurture/catalog (public) + /api/me/shelf
// (authed). Empty states stay quiet: no shelf section until the nurture
// sequence has ever sent this user anything; the catalog shows once any
// mini-course lesson is BUILT.
(function(){
  'use strict';
  var host = document.getElementById('dh-shelf-host');
  if (!host) return;
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function token(){
    try{
      for (var i=0;i<localStorage.length;i++){
        var k = localStorage.key(i);
        if (/^sb-.*-auth-token$/.test(k)){
          var v = JSON.parse(localStorage.getItem(k));
          return (Array.isArray(v) ? v[0] : (v && v.access_token)) || null;
        }
      }
    }catch(e){}
    return null;
  }
  var tok = token();
  Promise.all([
    fetch('/api/nurture/catalog').then(function(r){ return r.json(); }),
    tok ? fetch('/api/me/shelf', { headers: { Authorization: 'Bearer ' + tok } })
        .then(function(r){ return r.ok ? r.json() : { open: [], badges: [] }; })
        : Promise.resolve({ open: [], badges: [] })
  ]).then(function(res){
    var cat = res[0], shelf = res[1];
    var html = '';
    if (shelf.open && shelf.open.length){
      html += '<section class="card"><h2>Your open lessons <span class="dh-sub">each stays open 3 days from its email</span></h2><div>' +
        shelf.open.map(function(o){
          var left = Math.max(1, Math.round((o.closes_at*1000 - Date.now())/36e5));
          return '<div style="display:flex;justify-content:space-between;gap:10px;align-items:baseline;padding:9px 0;border-top:1px solid var(--line,#e7ebf1)">' +
            '<a href="/' + esc(o.slug) + '.html" style="font-weight:600">' + esc(o.subject) + '</a>' +
            '<span class="dh-sub" style="white-space:nowrap">' + left + 'h left</span></div>';
        }).join('') + '</div></section>';
    }
    var anyBuilt = (cat.courses||[]).some(function(c){ return c.parts.some(function(p){ return p.status === 'built'; }); });
    if (anyBuilt){
      html += '<section class="card"><h2>Mini courses <span class="dh-sub">one lesson arrives by email each day; Pro opens everything anytime</span></h2>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px;margin-top:8px">' +
        (cat.courses||[]).map(function(c){
          var built = c.parts.filter(function(p){ return p.status === 'built'; }).length;
          return '<div style="border:1px solid var(--line,#e7ebf1);border-radius:10px;padding:12px 14px">' +
            '<b style="font-size:14px">' + esc(c.title) + '</b>' +
            '<div class="dh-sub" style="margin-top:4px">' + c.parts.length + ' parts &middot; ' + built + ' available</div></div>';
        }).join('') + '</div></section>';
    }
    host.innerHTML = html;
  }).catch(function(){});
})();
